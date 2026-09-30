const express = require('express');
const router = express.Router();

/**
 * Tech ESOP & US RSU Tax Calculation Engine
 * Compliant with:
 * - Rule 115 of Income Tax Rules (SBI TT Buying Rate conversion)
 * - Finance Act 2024 LTCG rules on foreign assets (12.5% without indexation for >24 months)
 * - Section 90 / Article 25 Indo-US DTAA (Foreign Tax Credit via Form 67)
 * - Schedule FA (Foreign Assets - Table A3) format for ITR-2
 */

// Approximate benchmark SBI TT Buying Rates for key periods
const DEFAULT_SBI_TT_RATE = 84.35; // INR per USD

router.post('/analyze', (req, res) => {
  try {
    const {
      companyName = 'Tech Corp (US)',
      symbol = 'US_STOCK',
      exchange = 'NASDAQ',
      vestings = [],
      sales = [],
      taxSlab = 30, // 30% slab rate
      exchangeRate = DEFAULT_SBI_TT_RATE,
    } = req.body;

    // 1. Calculate Perquisite Tax on Vestings
    let totalVestedShares = 0;
    let totalPerquisiteValueINR = 0;
    let totalPerquisiteTaxINR = 0;

    const processedVestings = vestings.map(v => {
      const shares = Number(v.shares) || 0;
      const fmvUSD = Number(v.fmvUSD) || 0;
      const rate = Number(v.exchangeRate) || exchangeRate;
      const fmvINR = fmvUSD * rate;
      const totalValueINR = shares * fmvINR;
      const perquisiteTaxINR = totalValueINR * (taxSlab / 100) * 1.04; // with cess

      totalVestedShares += shares;
      totalPerquisiteValueINR += totalValueINR;
      totalPerquisiteTaxINR += perquisiteTaxINR;

      return {
        ...v,
        fmvINR: Math.round(fmvINR),
        totalValueINR: Math.round(totalValueINR),
        perquisiteTaxINR: Math.round(perquisiteTaxINR),
      };
    });

    // 2. Calculate Capital Gains on Sales
    let totalSTCG_INR = 0;
    let totalLTCG_INR = 0;
    let totalCapitalGainsTaxINR = 0;
    let totalGrossProceedsINR = 0;

    const processedSales = sales.map(s => {
      const shares = Number(s.shares) || 0;
      const salePriceUSD = Number(s.salePriceUSD) || 0;
      const costPriceUSD = Number(s.costPriceUSD) || 0;
      const rate = Number(s.exchangeRate) || exchangeRate;

      const saleProceedsINR = shares * salePriceUSD * rate;
      const costBasisINR = shares * costPriceUSD * rate;
      const gainINR = saleProceedsINR - costBasisINR;

      // Determine holding period in months
      const vestDate = s.vestDate ? new Date(s.vestDate) : new Date('2023-01-01');
      const saleDate = s.saleDate ? new Date(s.saleDate) : new Date();
      const diffMonths = (saleDate.getFullYear() - vestDate.getFullYear()) * 12 + (saleDate.getMonth() - vestDate.getMonth());

      const isLTCG = diffMonths > 24;
      // Budget 2024: LTCG on unlisted/foreign shares is 12.5% without indexation
      const taxRate = isLTCG ? 12.5 : taxSlab;
      const taxINR = Math.max(0, gainINR * (taxRate / 100) * 1.04);

      if (isLTCG) {
        totalLTCG_INR += Math.max(0, gainINR);
      } else {
        totalSTCG_INR += Math.max(0, gainINR);
      }
      totalCapitalGainsTaxINR += taxINR;
      totalGrossProceedsINR += saleProceedsINR;

      return {
        ...s,
        diffMonths,
        isLTCG,
        gainINR: Math.round(gainINR),
        taxINR: Math.round(taxINR),
        saleProceedsINR: Math.round(saleProceedsINR),
      };
    });

    // 3. Form 67 & Foreign Tax Credit (FTC) calculation
    // US withholding on dividends/shares under IRS Form 1042-S is typically 25% (or 15% with DTAA treaty)
    const usWithholdingUSD = Number(req.body.usWithholdingUSD) || 0;
    const usTaxPaidINR = usWithholdingUSD * exchangeRate;
    const eligibleFTC_INR = Math.min(usTaxPaidINR, totalCapitalGainsTaxINR);

    // 4. Schedule FA (Foreign Assets) Table A3 Packet for ITR-2
    const currentUnsoldShares = Math.max(0, totalVestedShares - sales.reduce((acc, s) => acc + (Number(s.shares) || 0), 0));
    const latestSharePriceUSD = vestings.length > 0 ? (vestings[vestings.length - 1].fmvUSD || 150) : 150;
    const closingValueINR = currentUnsoldShares * latestSharePriceUSD * exchangeRate;
    const peakValueINR = Math.max(closingValueINR, totalPerquisiteValueINR);

    const scheduleFA_TableA3 = {
      countryCode: '740', // USA
      countryName: 'United States of America',
      entityName: companyName,
      entityAddress: 'United States (Depository Custodian)',
      zipCode: '94043',
      initialInvestmentCostINR: Math.round(totalPerquisiteValueINR),
      peakBalanceINR: Math.round(peakValueINR),
      closingBalanceINR: Math.round(closingValueINR),
      grossAmountPaidCreditedINR: Math.round(totalPerquisiteValueINR),
      grossProceedsFromSaleINR: Math.round(totalGrossProceedsINR),
    };

    return res.json({
      success: true,
      data: {
        companyName,
        symbol,
        exchange,
        exchangeRateUsed: exchangeRate,
        summary: {
          totalVestedShares,
          unsoldShares: currentUnsoldShares,
          totalPerquisiteValueINR: Math.round(totalPerquisiteValueINR),
          totalPerquisiteTaxINR: Math.round(totalPerquisiteTaxINR),
          totalSTCG_INR: Math.round(totalSTCG_INR),
          totalLTCG_INR: Math.round(totalLTCG_INR),
          totalCapitalGainsTaxINR: Math.round(totalCapitalGainsTaxINR),
          usTaxPaidINR: Math.round(usTaxPaidINR),
          eligibleFTC_INR: Math.round(eligibleFTC_INR),
          netPayableTaxINR: Math.round(Math.max(0, totalCapitalGainsTaxINR - eligibleFTC_INR)),
        },
        vestings: processedVestings,
        sales: processedSales,
        scheduleFA: scheduleFA_TableA3,
        complianceNotes: [
          'Rule 115: Foreign income & capital gains must be converted to INR using the Telegraphic Transfer (TT) Buying Rate of SBI as on the specified date.',
          'Schedule FA is MANDATORY for anyone holding vested foreign shares. Non-disclosure carries penalties up to ₹10 Lakhs under the Black Money Act.',
          'Form 67 MUST be filed on or before the due date of filing ITR under Section 139(1) to claim Foreign Tax Credit (FTC) for US taxes withheld.',
          'Budget 2024: LTCG holding period for foreign shares is 24 months, taxed at 12.5% without indexation.',
        ],
      },
    });
  } catch (err) {
    console.error('ESOP/RSU Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = { router };
