// server/routes/privateEquity.js
// Private Equity & Startup ESOP Cap Table Valuation Engine
// Seeded with top private unicorns (OpenAI, SpaceX, Stripe, Databricks, Canva, Swiggy, Razorpay, Zepto)
// Models 409A valuations, secondary market discounts, 83(b) tax savings, and liquidation stacks

const UNICORN_DATABASE = [
  {
    id: 'comp_01',
    name: 'OpenAI',
    tickerMock: 'OPAI',
    lastRoundValuation: '$157 Billion',
    lastRoundDate: 'Oct 2024 (Series F)',
    latest409A: 135.00,
    secondaryMarketPrice: 150.00,
    secondaryDiscount: '-4.2%',
    sector: 'Artificial Intelligence',
    liquidationPreference: '1x Non-Participating Preferred',
    investors: ['Thrive Capital', 'SoftBank', 'Microsoft', 'Khosla Ventures']
  },
  {
    id: 'comp_02',
    name: 'SpaceX',
    tickerMock: 'SPCX',
    lastRoundValuation: '$210 Billion',
    lastRoundDate: 'Jun 2024 (Tender Offer)',
    latest409A: 112.00,
    secondaryMarketPrice: 115.00,
    secondaryDiscount: '+2.6%',
    sector: 'Aerospace & Defense',
    liquidationPreference: '1x Non-Participating Preferred',
    investors: ['Founders Fund', 'Fidelity', 'Baillie Gifford']
  },
  {
    id: 'comp_03',
    name: 'Stripe',
    tickerMock: 'STRP',
    lastRoundValuation: '$70 Billion',
    lastRoundDate: 'Feb 2024 (Tender Offer)',
    latest409A: 27.50,
    secondaryMarketPrice: 28.25,
    secondaryDiscount: '+2.7%',
    sector: 'Fintech & Payments',
    liquidationPreference: '1x Non-Participating Preferred',
    investors: ['Sequoia Capital', 'Andreessen Horowitz', 'General Catalyst']
  },
  {
    id: 'comp_04',
    name: 'Databricks',
    tickerMock: 'DBRK',
    lastRoundValuation: '$43 Billion',
    lastRoundDate: 'Sep 2023 (Series I)',
    latest409A: 73.50,
    secondaryMarketPrice: 71.00,
    secondaryDiscount: '-3.4%',
    sector: 'Enterprise Data / AI',
    liquidationPreference: '1x Non-Participating Preferred',
    investors: ['CapitalG', 'Andreessen Horowitz', 'T. Rowe Price']
  },
  {
    id: 'comp_05',
    name: 'Canva',
    tickerMock: 'CNVA',
    lastRoundValuation: '$32 Billion',
    lastRoundDate: 'May 2024 (Secondary Tender)',
    latest409A: 820.00,
    secondaryMarketPrice: 795.00,
    secondaryDiscount: '-3.0%',
    sector: 'Design SaaS',
    liquidationPreference: '1x Non-Participating Preferred',
    investors: ['Bessemer Venture Partners', 'Blackbird Ventures']
  },
  {
    id: 'comp_06',
    name: 'Razorpay',
    tickerMock: 'RZRP',
    lastRoundValuation: '$7.5 Billion',
    lastRoundDate: 'Dec 2021 (Series F)',
    latest409A: 182.00,
    secondaryMarketPrice: 165.00,
    secondaryDiscount: '-9.3%',
    sector: 'India Fintech / Neobanking',
    liquidationPreference: '1x Non-Participating Preferred',
    investors: ['Tiger Global', 'Sequoia Capital India', 'Lone Pine']
  },
  {
    id: 'comp_07',
    name: 'Zepto',
    tickerMock: 'ZEPT',
    lastRoundValuation: '$5.0 Billion',
    lastRoundDate: 'Aug 2024 (Series G)',
    latest409A: 42.00,
    secondaryMarketPrice: 40.50,
    secondaryDiscount: '-3.5%',
    sector: 'Quick Commerce / Retail',
    liquidationPreference: '1x Non-Participating Preferred',
    investors: ['General Catalyst', 'Nexus Venture Partners', 'Glade Brook']
  }
];

/**
 * GET /api/private-equity/database
 */
function getPrivateEquityDatabase(req, res) {
  res.json({
    success: true,
    companies: UNICORN_DATABASE
  });
}

/**
 * POST /api/private-equity/analyze-grant
 * Computes take-home value, 83(b) tax savings, AMT liabilities, and liquidation waterfall
 */
function analyzeGrant(req, res) {
  const {
    companyName = 'Stripe',
    grantType = 'ISO', // 'ISO' | 'NSO' | 'RSU'
    totalShares = 10000,
    vestedShares = 4500,
    strikePrice = 5.00,
    current409A = 27.50,
    secondaryPrice = 28.25,
    taxBracket = 0.37 // 37% Federal
  } = req.body;

  const currentGrossValue = totalShares * secondaryPrice;
  const vestedGrossValue = vestedShares * secondaryPrice;
  const exerciseCostVested = vestedShares * strikePrice;
  const netVestedSpread = vestedGrossValue - exerciseCostVested;

  // AMT Calculation (for ISOs)
  // Spread at exercise = (409A - Strike) * vestedShares
  const amtSpread = Math.max(0, (current409A - strikePrice) * vestedShares);
  const estimatedAmtTax = Math.round(amtSpread * 0.28); // 28% AMT rate

  // 83(b) savings analysis if filed within 30 days of unvested grant
  const unvestedShares = totalShares - vestedShares;
  const unvestedSpreadAtGrant = Math.max(0, (current409A - strikePrice) * unvestedShares);
  const estimated83bSavings = Math.round(unvestedSpreadAtGrant * 0.15); // Capital gains vs ordinary tax delta

  // Liquidation Waterfall Scenarios at Various Exits
  const exitScenarios = [
    { multiplier: 'Conservative (0.8x)', exitValuation: '$56B', sharePrice: (secondaryPrice * 0.8).toFixed(2), netTakeHome: Math.round(totalShares * (secondaryPrice * 0.8) * 0.70) },
    { multiplier: 'Base Case (1.0x)', exitValuation: '$70B', sharePrice: secondaryPrice.toFixed(2), netTakeHome: Math.round(totalShares * secondaryPrice * 0.70) },
    { multiplier: 'Bull Case (2.0x)', exitValuation: '$140B', sharePrice: (secondaryPrice * 2.0).toFixed(2), netTakeHome: Math.round(totalShares * (secondaryPrice * 2.0) * 0.70) },
    { multiplier: 'Hyper-Growth (4.0x)', exitValuation: '$280B', sharePrice: (secondaryPrice * 4.0).toFixed(2), netTakeHome: Math.round(totalShares * (secondaryPrice * 4.0) * 0.70) }
  ];

  res.json({
    success: true,
    companyName,
    grantSummary: {
      grantType,
      totalShares,
      vestedShares,
      unvestedShares,
      currentGrossValue,
      vestedGrossValue,
      exerciseCostVested,
      netVestedSpread,
      estimatedAmtTax,
      estimated83bSavings
    },
    exitScenarios,
    taxRecommendation: grantType === 'ISO'
      ? `Exercising now locks in the $${current409A} 409A before expected IPO, triggering ~$${estimatedAmtTax.toLocaleString()} in AMT which converts to an AMT credit upon sale.`
      : `RSUs will vest and be taxed as ordinary income at ~${(taxBracket * 100).toFixed(0)}% upon liquidity event.`
  });
}

module.exports = {
  getPrivateEquityDatabase,
  analyzeGrant
};
