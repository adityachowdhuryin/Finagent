const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

module.exports = { computeLots, generateITRXML, tracker80C };
