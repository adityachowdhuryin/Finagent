const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const { parseIndianTaxDocument } = require('../services/inTaxDocParser');

const LTCG_EXEMPTION = 125000;
const LTCG_RATE = 0.125;
const STCG_RATE = 0.20;
const CESS_RATE = 0.04;

function computeFIFOLots(transactions) {
  // transactions: [{ date, assetName, type: 'Purchase|SIP|Redemption', units, nav, amount }]
  // Returns lots: [{ assetName, purchaseDate, units, costPerUnit, currentNav, holdingDays, gainType, gainPerUnit }]
  const queues = {}; // { assetName: [{ date, units, costPerUnit }] }
  const lots = [];

  // Sort by date
  const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

  for (const txn of sorted) {
    const key = txn.assetName || txn.schemeName;
    if (!queues[key]) queues[key] = [];

    if (txn.type === 'Purchase' || txn.type === 'SIP' || txn.type === 'Switch-In') {
      queues[key].push({ date: txn.date, units: txn.units, costPerUnit: txn.nav || (txn.amount / txn.units) });
    } else if (txn.type === 'Redemption' || txn.type === 'Switch-Out') {
      let unitsToRedeem = txn.units;
      while (unitsToRedeem > 0 && queues[key]?.length > 0) {
        const lot = queues[key][0];
        const redeemed = Math.min(lot.units, unitsToRedeem);
        const holdingDays = Math.floor((new Date(txn.date) - new Date(lot.date)) / 86400000);
        lots.push({
          assetName: key,
          purchaseDate: lot.date,
          saleDate: txn.date,
          units: redeemed,
          costPerUnit: lot.costPerUnit,
          saleNav: txn.nav,
          holdingDays,
          gainType: holdingDays > 365 ? 'LTCG' : 'STCG',
          gainPerUnit: (txn.nav || 0) - lot.costPerUnit,
          totalGain: redeemed * ((txn.nav || 0) - lot.costPerUnit),
        });
        lot.units -= redeemed;
        unitsToRedeem -= redeemed;
        if (lot.units <= 0) queues[key].shift();
      }
    }
  }

  return lots;
}

function computeTaxSummary(lots) {
  const ltcgGross = lots.filter(l => l.gainType === 'LTCG' && l.totalGain > 0).reduce((s, l) => s + l.totalGain, 0);
  const stcgGross = lots.filter(l => l.gainType === 'STCG' && l.totalGain > 0).reduce((s, l) => s + l.totalGain, 0);
  const ltcgLosses = lots.filter(l => l.gainType === 'LTCG' && l.totalGain < 0).reduce((s, l) => s + Math.abs(l.totalGain), 0);
  const stcgLosses = lots.filter(l => l.gainType === 'STCG' && l.totalGain < 0).reduce((s, l) => s + Math.abs(l.totalGain), 0);

  const netLTCG = Math.max(0, ltcgGross - ltcgLosses);
  const netSTCG = Math.max(0, stcgGross - stcgLosses);
  const taxableLTCG = Math.max(0, netLTCG - LTCG_EXEMPTION);
  const ltcgTax = taxableLTCG * LTCG_RATE;
  const stcgTax = netSTCG * STCG_RATE;
  const totalTaxBeforeCess = ltcgTax + stcgTax;
  const cess = totalTaxBeforeCess * CESS_RATE;
  const totalTax = totalTaxBeforeCess + cess;

  return {
    ltcgGross,
    stcgGross,
    ltcgLosses,
    stcgLosses,
    netLTCG,
    netSTCG,
    taxableLTCG,
    ltcgTax,
    stcgTax,
    cess,
    totalTax,
    ltcgExemptionUsed: Math.min(netLTCG, LTCG_EXEMPTION),
    ltcgExemptionRemaining: Math.max(0, LTCG_EXEMPTION - netLTCG),
  };
}

// POST /api/tax/compute-lots
async function computeLots(req, res) {
  try {
    const { transactions } = req.body;
    if (!transactions?.length) return res.json({ lots: [], summary: computeTaxSummary([]) });
    const lots = computeFIFOLots(transactions);
    const summary = computeTaxSummary(lots);
    res.json({ lots, summary });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// POST /api/tax/generate-itr-xml
async function generateITRXML(req, res) {
  try {
    const { summary, userInfo } = req.body;
    const { name = 'TAXPAYER', pan = 'XXXXXXXXXX', ay = '2026-27' } = userInfo || {};
    const s = summary || {};
    // Simplified ITR-2 Schedule CG XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- FinAgent Generated ITR-2 Capital Gains Schedule - AY ${ay} -->
<!-- PAN: ${pan} | Taxpayer: ${name} -->
<ITR><ITR2><ScheduleCG>
  <!-- Equity & Equity MF Capital Gains -->
  <ShortTerm>
    <SaleValue>${Math.round(s.stcgGross || 0)}</SaleValue>
    <Expenditure>0</Expenditure>
    <NetCG>${Math.round(s.netSTCG || 0)}</NetCG>
    <TaxRate>${STCG_RATE * 100}</TaxRate>
    <TaxPayable>${Math.round(s.stcgTax || 0)}</TaxPayable>
  </ShortTerm>
  <LongTerm>
    <GrossLTCG>${Math.round(s.ltcgGross || 0)}</GrossLTCG>
    <Exemption>${Math.round(s.ltcgExemptionUsed || 0)}</Exemption>
    <NetLTCG>${Math.round(s.taxableLTCG || 0)}</NetLTCG>
    <TaxRate>${LTCG_RATE * 100}</TaxRate>
    <TaxPayable>${Math.round(s.ltcgTax || 0)}</TaxPayable>
  </LongTerm>
  <TotalCGTax>${Math.round((s.ltcgTax || 0) + (s.stcgTax || 0))}</TotalCGTax>
  <HealthEducationCess>${Math.round(s.cess || 0)}</HealthEducationCess>
  <TotalTaxPayable>${Math.round(s.totalTax || 0)}</TotalTaxPayable>
  <GeneratedBy>FinAgent AI - finagent.in</GeneratedBy>
  <GeneratedAt>${new Date().toISOString()}</GeneratedAt>
  <!-- DISCLAIMER: Verify all figures with a qualified CA before filing -->
</ScheduleCG></ITR2></ITR>`;
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="ITR2_ScheduleCG_${pan}_AY${ay.replace('-', '')}.xml"`);
    res.send(xml);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// POST /api/tax/80c-tracker
async function tracker80C(req, res) {
  try {
    const { holdings } = req.body;
    const LIMIT_80C = 150000;
    const LIMIT_80D_SELF = 25000;
    const LIMIT_80D_PARENTS = 50000;
    const LIMIT_NPS = 50000;

    const epfContrib = (holdings?.epf?.employeeContribution || 0);
    const elssInvested = (holdings?.mutualFunds || [])
      .filter(m => (m.category || '').includes('ELSS'))
      .reduce((s, m) => s + (m.value || 0), 0);
    const lifeInsurancePremium = (holdings?.insurance || [])
      .filter(i => i.type === 'Term' || i.type === 'Life')
      .reduce((s, i) => s + (i.premium || 0), 0);
    const used80C = Math.min(LIMIT_80C, epfContrib + elssInvested + lifeInsurancePremium);
    const remaining80C = Math.max(0, LIMIT_80C - used80C);

    const medInsurancePremium = (holdings?.insurance || [])
      .filter(i => i.type === 'Health' || i.type === 'Mediclaim')
      .reduce((s, i) => s + (i.premium || 0), 0);

    res.json({
      section80C: {
        limit: LIMIT_80C,
        used: used80C,
        remaining: remaining80C,
        breakdown: [
          { label: 'EPF Contribution', amount: epfContrib },
          { label: 'ELSS Invested', amount: elssInvested },
          { label: 'Life Insurance Premium', amount: lifeInsurancePremium },
        ],
      },
      section80D: { selfLimit: LIMIT_80D_SELF, parentsLimit: LIMIT_80D_PARENTS, selfPremium: medInsurancePremium },
      sectionNPS: { additionalLimit: LIMIT_NPS },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// ── India Schedule FA (Foreign Assets Reporting & Black Money Act Sec 43 Compliance) ──
// Mandatory under Black Money (Undisclosed Foreign Income and Assets) and Imposition of Tax Act, 2015
// Rule 115 SBI TT Buying Rate currency conversion; Calendar Year reporting (Jan 01 - Dec 31).

const HISTORICAL_SBI_TT_RATES = {
  2023: { default: 83.15, yearEnd: 83.15 },
  2024: { default: 83.40, yearEnd: 83.55 },
  2025: { default: 85.20, yearEnd: 85.50 },
  2026: { default: 86.40, yearEnd: 86.80 },
};

function getSBITTRate(year = 2025) {
  return HISTORICAL_SBI_TT_RATES[year] || { default: 85.50, yearEnd: 85.50 };
}

function computeScheduleFA(payload = {}) {
  const {
    calendarYear = 2025,
    foreignHoldings = payload.equityInterests || [],
    cashAccounts = payload.depositoryAccounts || [],
    hasUndisclosedForeignAssets = false,
  } = payload;

  const rates = getSBITTRate(calendarYear);
  const conversionRate = payload.customSbiTtRate || rates.yearEnd;

  // Table A3: Foreign Equity & Debt Interest (e.g. US RSUs, ESPP, Equities)
  let totalPeakValueINR = 0;
  let totalClosingValueINR = 0;
  let totalDividendsINR = 0;
  let totalGrossProceedsINR = 0;

  const tableA3 = (foreignHoldings || []).map((asset, idx) => {
    const peakUSD = Number(asset.peakBalanceUSD || asset.peakValueUSD || 0);
    const closingUSD = Number(asset.closingBalanceUSD || asset.closingValueUSD || 0);
    const initialUSD = Number(asset.initialCostUSD || asset.initialValueUSD || 0);
    const dividendsUSD = Number(asset.grossDividendsUSD || asset.grossDividends || 0);
    const proceedsUSD = Number(asset.grossSalesProceedsUSD || asset.grossProceeds || 0);

    const peakINR = Math.round(peakUSD * conversionRate);
    const closingINR = Math.round(closingUSD * conversionRate);
    const initialINR = Math.round(initialUSD * conversionRate);
    const dividendsINR = Math.round(dividendsUSD * conversionRate);
    const proceedsINR = Math.round(proceedsUSD * conversionRate);

    totalPeakValueINR += peakINR;
    totalClosingValueINR += closingINR;
    totalDividendsINR += dividendsINR;
    totalGrossProceedsINR += proceedsINR;

    return {
      scheduleItemNo: `A3-${idx + 1}`,
      countryCode: asset.countryCode || '2', // 2 = USA
      countryName: asset.countryName || 'United States',
      entityName: asset.companyName || asset.entityName || 'US Corporation',
      entityAddress: asset.address || 'USA',
      zipCode: asset.zipCode || '94043',
      natureOfEntity: asset.natureOfEntity || 'Company',
      acquisitionDate: asset.acquisitionDate || `${calendarYear}-01-15`,
      initialCostUSD: initialUSD,
      initialCostINR: initialINR,
      peakBalanceUSD: peakUSD,
      peakBalanceINR: peakINR,
      peakBalanceDate: asset.peakDate || `${calendarYear}-06-30`,
      closingBalanceUSD: closingUSD,
      closingBalanceINR: closingINR,
      grossDividendsUSD: dividendsUSD,
      grossDividendsINR: dividendsINR,
      grossProceedsUSD: proceedsUSD,
      grossProceedsINR: proceedsINR,
    };
  });

  // Table A1: Foreign Depository / Broker Cash Accounts (e.g. Schwab One, Morgan Stanley cash)
  let totalCashPeakINR = 0;
  let totalCashClosingINR = 0;
  let totalCashInterestINR = 0;

  const tableA1 = (cashAccounts || []).map((acc, idx) => {
    const peakUSD = Number(acc.peakBalanceUSD || 0);
    const closingUSD = Number(acc.closingBalanceUSD || 0);
    const interestUSD = Number(acc.grossInterestUSD || 0);

    const peakINR = Math.round(peakUSD * conversionRate);
    const closingINR = Math.round(closingUSD * conversionRate);
    const interestINR = Math.round(interestUSD * conversionRate);

    totalCashPeakINR += peakINR;
    totalCashClosingINR += closingINR;
    totalCashInterestINR += interestINR;

    return {
      scheduleItemNo: `A1-${idx + 1}`,
      countryCode: acc.countryCode || '2',
      countryName: acc.countryName || 'United States',
      institutionName: acc.institutionName || 'Foreign Financial Institution',
      institutionAddress: acc.address || 'USA',
      accountNumber: acc.accountNumber ? `****${String(acc.accountNumber).slice(-4)}` : '****1234',
      accountOpeningDate: acc.openingDate || `${calendarYear - 2}-01-01`,
      peakBalanceUSD: peakUSD,
      peakBalanceINR: peakINR,
      closingBalanceUSD: closingUSD,
      closingBalanceINR: closingINR,
      grossInterestUSD: interestUSD,
      grossInterestINR: interestINR,
    };
  });

  const totalForeignAssetsCount = tableA3.length + tableA1.length;
  const isMandatory = totalForeignAssetsCount > 0;

  // Black Money Act Section 43 & Section 42 Compliance Assessment
  // Failure to disclose foreign assets in Schedule FA attracts ₹10,00,000 penalty per assessment year
  let complianceStatus = 'COMPLIANT';
  let penaltyExposureINR = 0;
  const statutoryWarnings = [];

  if (isMandatory) {
    if (hasUndisclosedForeignAssets) {
      complianceStatus = 'CRITICAL_RISK';
      penaltyExposureINR = 1000000;
      statutoryWarnings.push(
        'Section 43 of the Black Money Act, 2015 imposes a mandatory flat penalty of ₹10,00,000 for non-disclosure or inaccurate disclosure in Schedule FA, regardless of whether the foreign asset was acquired out of declared, tax-paid funds.'
      );
    } else {
      statutoryWarnings.push(
        'All foreign shares/RSUs must be disclosed on a Calendar Year basis (Jan 01 - Dec 31) using the SBI TT Buying Rate under Rule 115 of Income-tax Rules.'
      );
    }
  }

  // Generate XML Node snippet for ITR-2 / ITR-3
  const xmlSnippet = `<ScheduleFA>
  <AccountingPeriodCalendarYear>${calendarYear}</AccountingPeriodCalendarYear>
  <ConversionRule>Rule115_SBI_TT_Buying_Rate</ConversionRule>
  <ExchangeRateUsed>${conversionRate}</ExchangeRateUsed>
  <TableA1_ForeignDepositoryAccounts>
    ${tableA1.map(a => `
    <DepositoryAccount>
      <CountryCode>${a.countryCode}</CountryCode>
      <NameOfBank>${a.institutionName}</NameOfBank>
      <AccountNumber>${a.accountNumber}</AccountNumber>
      <PeakBalanceINR>${a.peakBalanceINR}</PeakBalanceINR>
      <ClosingBalanceINR>${a.closingBalanceINR}</ClosingBalanceINR>
      <GrossInterestINR>${a.grossInterestINR}</GrossInterestINR>
    </DepositoryAccount>`).join('')}
  </TableA1_ForeignDepositoryAccounts>
  <TableA3_ForeignEquityDebtInterest>
    ${tableA3.map(e => `
    <EquityInterest>
      <CountryCode>${e.countryCode}</CountryCode>
      <NameOfEntity>${e.entityName}</NameOfEntity>
      <InitialInvestmentINR>${e.initialCostINR}</InitialInvestmentINR>
      <PeakBalanceINR>${e.peakBalanceINR}</PeakBalanceINR>
      <ClosingBalanceINR>${e.closingBalanceINR}</ClosingBalanceINR>
      <GrossDividendsINR>${e.grossDividendsINR}</GrossDividendsINR>
      <GrossSaleProceedsINR>${e.grossProceedsINR}</GrossSaleProceedsINR>
    </EquityInterest>`).join('')}
  </TableA3_ForeignEquityDebtInterest>
</ScheduleFA>`;

  return {
    calendarYear,
    conversionRateUsed: conversionRate,
    tableA1,
    tableA3,
    summary: {
      totalHoldingsCount: totalForeignAssetsCount,
      totalPeakValueINR: totalPeakValueINR + totalCashPeakINR,
      totalClosingValueINR: totalClosingValueINR + totalCashClosingINR,
      totalForeignIncomeINR: totalDividendsINR + totalCashInterestINR,
      totalGrossProceedsINR,
    },
    blackMoneyActCompliance: {
      status: complianceStatus,
      isScheduleFAMandatory: isMandatory,
      penaltyExposureINR,
      statutorySection: 'Section 43, Black Money (Undisclosed Foreign Income and Assets) and Imposition of Tax Act, 2015',
      statutoryWarnings,
    },
    xmlSnippet,
  };
}

// ── India Surcharge, Marginal Relief & Section 87A Nuance (Finance Act 2024) ──
// Calculates exact high-earner surcharge (10%, 15%, 25%), capital gains 15% surcharge cap,
// statutory marginal relief on ₹50L/₹1Cr/₹2Cr thresholds, and enforces Section 87A rebate restriction.

function computeSlabTaxNewRegime(taxableSlabIncome) {
  // Budget 2024 revised slabs under Section 115BAC:
  // 0 - 3,00,000: Nil
  // 3,00,001 - 7,00,000: 5%
  // 7,00,001 - 10,00,000: 10%
  // 10,00,001 - 12,00,000: 15%
  // 12,00,001 - 15,00,000: 20%
  // Above 15,00,000: 30%
  let tax = 0;
  const inc = Math.max(0, taxableSlabIncome);

  if (inc > 1500000) {
    tax += (inc - 1500000) * 0.30;
    tax += 300000 * 0.20; // 12-15L
    tax += 200000 * 0.15; // 10-12L
    tax += 300000 * 0.10; // 7-10L
    tax += 400000 * 0.05; // 3-7L
  } else if (inc > 1200000) {
    tax += (inc - 1200000) * 0.20;
    tax += 200000 * 0.15;
    tax += 300000 * 0.10;
    tax += 400000 * 0.05;
  } else if (inc > 1000000) {
    tax += (inc - 1000000) * 0.15;
    tax += 300000 * 0.10;
    tax += 400000 * 0.05;
  } else if (inc > 700000) {
    tax += (inc - 700000) * 0.10;
    tax += 400000 * 0.05;
  } else if (inc > 300000) {
    tax += (inc - 300000) * 0.05;
  }
  return tax;
}

function computeSurchargeAndMarginalRelief(params = {}) {
  const {
    slabIncome = 0,
    stcg111A = 0,
    ltcg112A = 0,
    ltcg112 = 0,
    regime = 'new', // 'new' | 'old'
  } = params;

  // Capital gains tax computations:
  // Section 111A: 20% (Finance Act 2024)
  // Section 112A: 12.5% in excess of ₹1.25 Lakh exemption
  // Section 112: 12.5% without indexation / 20% with indexation
  const taxableLTCG112A = Math.max(0, ltcg112A - 125000);
  const taxSTCG111A = stcg111A * 0.20;
  const taxLTCG112A = taxableLTCG112A * 0.125;
  const taxLTCG112 = ltcg112 * 0.125;

  const totalSpecialTax = taxSTCG111A + taxLTCG112A + taxLTCG112;
  const normalSlabTax = computeSlabTaxNewRegime(slabIncome);
  const totalTaxableIncome = slabIncome + stcg111A + taxableLTCG112A + ltcg112;

  // ── Section 87A Rebate Computation (Finance Act 2024 Nuance) ──
  // Rebate up to ₹25,000 under New Regime if total taxable income <= ₹7,00,000.
  // CRITICAL STATUTORY RESTRICTION: Section 87A rebate cannot reduce tax on Sec 111A or Sec 112A gains!
  let rebate87A = 0;
  let rebateRestrictedNotice = null;

  if (totalTaxableIncome <= 700000) {
    const rawRebateAvailable = Math.min(25000, normalSlabTax + totalSpecialTax);
    // Statutory restriction: Rebate limited strictly to tax on normal slab income
    rebate87A = Math.min(25000, normalSlabTax);

    if (totalSpecialTax > 0 && rawRebateAvailable > rebate87A) {
      rebateRestrictedNotice = {
        code: 'FA2024_SEC87A_RESTRICTION',
        message: 'Finance Act 2024 Restriction: Section 87A rebate cannot be claimed against special rate capital gains under Section 111A (20%) or Section 112A (12.5%). Rebate is restricted to normal slab tax of ₹' + Math.round(normalSlabTax).toLocaleString('en-IN') + '.',
        disallowedRebateAmount: Math.round(rawRebateAvailable - rebate87A),
      };
    }
  }

  const baseTaxPayable = Math.max(0, normalSlabTax - rebate87A) + totalSpecialTax;

  // ── Surcharge & Marginal Relief Calculation ──
  let statutorySurchargeRate = 0;
  let capitalGainsSurchargeRate = 0;
  let threshold = 0;

  if (totalTaxableIncome > 20000000) { // > ₹2 Crore
    statutorySurchargeRate = 0.25; // Capped at 25% under 115BAC
    capitalGainsSurchargeRate = 0.15; // Strictly capped at 15% for 111A & 112A
    threshold = 20000000;
  } else if (totalTaxableIncome > 10000000) { // > ₹1 Crore
    statutorySurchargeRate = 0.15;
    capitalGainsSurchargeRate = 0.15;
    threshold = 10000000;
  } else if (totalTaxableIncome > 5000000) { // > ₹50 Lakhs
    statutorySurchargeRate = 0.10;
    capitalGainsSurchargeRate = 0.10;
    threshold = 5000000;
  }

  // Base surcharge without marginal relief
  const slabSurcharge = Math.max(0, normalSlabTax - rebate87A) * statutorySurchargeRate;
  const specialSurcharge = totalSpecialTax * capitalGainsSurchargeRate;
  const rawSurcharge = slabSurcharge + specialSurcharge;
  const totalTaxWithSurcharge = baseTaxPayable + rawSurcharge;

  // Marginal Relief Calculation:
  // Tax payable cannot exceed (Tax on threshold income + Excess income over threshold)
  let marginalRelief = 0;
  if (threshold > 0 && totalTaxableIncome > threshold) {
    const excessIncome = totalTaxableIncome - threshold;

    // Estimate tax on exact threshold income
    const thresholdSlabTax = computeSlabTaxNewRegime(threshold);
    let thresholdSurchargeRate = 0;
    if (threshold === 10000000) thresholdSurchargeRate = 0.10;
    else if (threshold === 20000000) thresholdSurchargeRate = 0.15;

    const thresholdTotalTax = thresholdSlabTax * (1 + thresholdSurchargeRate);
    const maxAllowableTax = thresholdTotalTax + excessIncome;

    if (totalTaxWithSurcharge > maxAllowableTax) {
      marginalRelief = totalTaxWithSurcharge - maxAllowableTax;
    }
  }

  const netSurchargePayable = Math.max(0, rawSurcharge - marginalRelief);
  const taxBeforeCess = baseTaxPayable + netSurchargePayable;
  const healthAndEducationCess = Math.round(taxBeforeCess * 0.04);
  const finalTotalTax = taxBeforeCess + healthAndEducationCess;

  return {
    totalTaxableIncome,
    normalSlabTax: Math.round(normalSlabTax),
    specialCapitalGainsTax: Math.round(totalSpecialTax),
    breakdown: {
      taxSTCG111A: Math.round(taxSTCG111A),
      taxLTCG112A: Math.round(taxLTCG112A),
      taxLTCG112: Math.round(taxLTCG112),
    },
    rebate87A: Math.round(rebate87A),
    rebateRestrictedNotice,
    surcharge: {
      statutoryRate: statutorySurchargeRate,
      capitalGainsRate: capitalGainsSurchargeRate,
      rawSurcharge: Math.round(rawSurcharge),
      marginalRelief: Math.round(marginalRelief),
      netSurchargePayable: Math.round(netSurchargePayable),
      marginalReliefTriggered: marginalRelief > 0,
      threshold,
    },
    cess: healthAndEducationCess,
    finalTotalTax: Math.round(finalTotalTax),
    effectiveTaxRate: totalTaxableIncome > 0 ? Number(((finalTotalTax / totalTaxableIncome) * 100).toFixed(2)) : 0,
  };
}

// Handlers
async function handleScheduleFA(req, res) {
  try {
    const result = computeScheduleFA(req.body);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleSurchargeMarginalRelief(req, res) {
  try {
    const result = computeSurchargeAndMarginalRelief(req.body);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleParseDocument(req, res) {
  try {
    const result = await parseIndianTaxDocument(req.body);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  computeLots,
  generateITRXML,
  tracker80C,
  computeScheduleFA,
  computeSurchargeAndMarginalRelief,
  handleScheduleFA,
  handleSurchargeMarginalRelief,
  handleParseDocument,
};

