// server/routes/charitableGiving.js
// Non-Profits, Endowments & Tax-Optimized Charitable Giving (/giving)
// Appreciated Stock Gifting (37% Tax Alpha), DAF Onramp, and Fiduciary IPS Auditor

const crypto = require('crypto');

let endowmentState = {
  institutionName: 'Stanford Climate & Tech Foundation',
  taxExemptId: 'EIN-94-1156820', // 501(c)(3) in US / 80G in IN
  market: 'US',
  totalEndowmentAUM: 42500000.00,
  annualDisbursementTarget: 2125000.00, // 5.0% annual policy spend
  disbursedYTD: 1420000.00,
  stockGiftsProcessedYTD: 3840000.00,
  donorTaxSavingsUnlockedYTD: 1420800.00,
  ipsComplianceScore: 98,
  assetAllocation: [
    { assetClass: 'Global Equities', targetPct: 50, currentPct: 52.4, currentValue: 22270000, variance: '+2.4%', status: 'COMPLIANT' },
    { assetClass: 'Fixed Income & Sovereign Debt', targetPct: 25, currentPct: 23.8, currentValue: 10115000, variance: '-1.2%', status: 'COMPLIANT' },
    { assetClass: 'Alternative Syndicates & Private Equity', targetPct: 15, currentPct: 14.5, currentValue: 6162500, variance: '-0.5%', status: 'COMPLIANT' },
    { assetClass: 'Liquid Cash & T-Bill Sweeps', targetPct: 10, currentPct: 9.3, currentValue: 3952500, variance: '-0.7%', status: 'COMPLIANT' },
  ],
  esgExclusions: [
    { sector: 'Thermal Coal & Fossil Exploration', status: 'ZERO_EXPOSURE', verified: true },
    { sector: 'Tobacco & Weapons Manufacturing', status: 'ZERO_EXPOSURE', verified: true },
  ],
  recentGifts: [
    { id: 'gft_01', donor: 'Anonymous Family Fund', asset: 'NVDA (500 shares)', fmvValue: 68500.00, taxDeductionClaimed: 68500.00, capitalGainsAvoided: 19865.00, status: 'LIQUIDATED_SETTLED', date: '2026-10-09' },
    { id: 'gft_02', donor: 'Dr. Rajiv Malhotra', asset: 'AAPL (300 shares)', fmvValue: 69300.00, taxDeductionClaimed: 69300.00, capitalGainsAvoided: 18711.00, status: 'LIQUIDATED_SETTLED', date: '2026-10-04' },
    { id: 'gft_03', donor: 'Sarah & Keith Collins', asset: 'GOOGL (200 shares)', fmvValue: 37400.00, taxDeductionClaimed: 37400.00, capitalGainsAvoided: 10846.00, status: 'PROCESSING_DTC', date: '2026-10-01' }
  ]
};

function getEndowmentOverview(req, res) {
  const isIN = req.query.market === 'IN';
  res.json({
    success: true,
    data: {
      ...endowmentState,
      market: isIN ? 'IN' : 'US',
      currency: isIN ? 'INR' : 'USD',
      currencySymbol: isIN ? '₹' : '$',
      statutoryFramework: isIN ? 'Section 12A & 80G of Income Tax Act, 1961' : 'IRC Section 501(c)(3) & Form 990 / Form 8283',
    }
  });
}

function calculateStockGiftTaxSavings(req, res) {
  const {
    ticker = 'NVDA',
    currentPrice = 138.50,
    costBasis = 35.00,
    shares = 100,
    donorTaxBracketPct = 37,
    ltcgTaxRatePct = 20,
    stateTaxRatePct = 9.3
  } = req.body;

  const totalFairMarketValue = currentPrice * shares;
  const totalCostBasis = costBasis * shares;
  const unrealizedGain = Math.max(0, totalFairMarketValue - totalCostBasis);

  // Scenario A: Sell stock first, pay capital gains tax, donate cash
  const combinedCapGainsRate = (ltcgTaxRatePct + stateTaxRatePct + 3.8) / 100; // includes 3.8% NIIT
  const capGainsTaxOwed = unrealizedGain * combinedCapGainsRate;
  const netCashRemainingToDonate = totalFairMarketValue - capGainsTaxOwed;
  const cashDonationTaxSavings = netCashRemainingToDonate * (donorTaxBracketPct / 100);

  // Scenario B: Donate stock directly to 501(c)(3) / 80G charity
  const directGiftCapGainsTaxOwed = 0; // Completely eliminated
  const fullCharityReceives = totalFairMarketValue;
  const stockDonationTaxSavings = totalFairMarketValue * (donorTaxBracketPct / 100);
  const totalDonorBenefit = stockDonationTaxSavings + capGainsTaxOwed;

  const netWealthSavings = (totalFairMarketValue - netCashRemainingToDonate) + (stockDonationTaxSavings - cashDonationTaxSavings);

  res.json({
    success: true,
    ticker,
    shares,
    totalFairMarketValue: Math.round(totalFairMarketValue),
    unrealizedCapitalGain: Math.round(unrealizedGain),
    scenarioSellAndDonateCash: {
      taxesPaid: Math.round(capGainsTaxOwed),
      charityGets: Math.round(netCashRemainingToDonate),
      incomeTaxDeduction: Math.round(cashDonationTaxSavings)
    },
    scenarioDirectStockGift: {
      taxesPaid: 0,
      charityGets: Math.round(fullCharityReceives),
      incomeTaxDeduction: Math.round(stockDonationTaxSavings),
      capitalGainsEliminated: Math.round(capGainsTaxOwed)
    },
    taxAlphaUnlocked: Math.round(capGainsTaxOwed),
    charityGainExtra: Math.round(fullCharityReceives - netCashRemainingToDonate),
    irsRuleCitation: 'IRC § 170(b)(1)(C) — Long-term appreciated capital gain property deducted at full Fair Market Value with 0% tax realization.'
  });
}

function auditEndowmentIPS(req, res) {
  const { maxEquityVariance = 5.0 } = req.body;
  const flaggedAllocations = endowmentState.assetAllocation.filter(a => {
    const varNum = Math.abs(parseFloat(a.variance));
    return varNum > maxEquityVariance;
  });

  res.json({
    success: true,
    institution: endowmentState.institutionName,
    auditDate: new Date().toISOString(),
    ipsComplianceScore: flaggedAllocations.length === 0 ? 100 : 92,
    status: flaggedAllocations.length === 0 ? 'FULLY_COMPLIANT' : 'VARIANCE_WARNING',
    disbursementStatus: {
      annualTarget: endowmentState.annualDisbursementTarget,
      disbursedYTD: endowmentState.disbursedYTD,
      pctCompleted: `${Math.round((endowmentState.disbursedYTD / endowmentState.annualDisbursementTarget) * 100)}%`,
      onTrack: true
    },
    allocationsAudited: endowmentState.assetAllocation,
    esgStatus: endowmentState.esgExclusions
  });
}

function generateForm8283(req, res) {
  const { giftId, donorName = 'John Doe', ticker = 'NVDA', shares = 100, fmv = 13850 } = req.body;
  const packageId = `f8283_${crypto.randomBytes(4).toString('hex')}`;

  res.json({
    success: true,
    packageId,
    formName: 'IRS Form 8283 (Section A: Donated Securities over $5,000)',
    receiptTitle: 'Official Non-Cash Charitable Gift Substantiation Receipt',
    institution: endowmentState.institutionName,
    ein: endowmentState.taxExemptId,
    appraisalExemptionMet: true, // Publicly traded securities exempt from qualified appraisal
    digitalStamp: crypto.randomBytes(8).toString('hex'),
    receiptGeneratedAt: new Date().toISOString()
  });
}

function getEmbedWidgetCode(req, res) {
  const { charityName = endowmentState.institutionName, primaryColor = '#10B981' } = req.query;
  const widgetHtml = `<iframe src="https://finagent.app/widget/give?charity=${encodeURIComponent(charityName)}&color=${encodeURIComponent(primaryColor)}" width="100%" height="480" style="border:none;border-radius:16px;box-shadow:0 8px 30px rgba(0,0,0,0.12);" title="Donate Appreciated Stock"></iframe>`;

  res.json({
    success: true,
    widgetHtml,
    instructions: 'Paste this snippet directly into your donor landing page or donation modal. Supports zero-tax DTC stock transfers, DAF onramps, and automated IRS Form 8283 receipts.'
  });
}

module.exports = {
  getEndowmentOverview,
  calculateStockGiftTaxSavings,
  auditEndowmentIPS,
  generateForm8283,
  getEmbedWidgetCode
};
