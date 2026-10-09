// server/routes/directIndexing.js
// Direct Indexing Engine & Continuous Tax-Loss Alpha Harvester
// Models fractional constituent baskets, single-stock exclusions, ESG screens, and custom factor tilts

const DIRECT_INDEX_MODELS = {
  US: [
    {
      id: 'sp500_direct_50',
      name: 'S&P 500 Direct 50 (Custom Beta)',
      benchmark: 'S&P 500 TR (SPY)',
      description: 'Fractional replication of top 50 S&P 500 constituents weighted by free-float market cap with continuous constituent-level tax-loss harvesting.',
      trackingError: '0.42%',
      projectedTaxAlpha: '+2.14% p.a.',
      wrapFeeBps: 25,
      wrapFeeAnnualPct: '0.25% p.a.',
      netClientTaxAlpha: '+1.89% p.a. (Net of 25 bps Advisory Fee)',
      historical3YReturn: '36.8%',
      benchmark3YReturn: '35.1%',
      minInvestment: 5000,
      constituents: [
        { symbol: 'MSFT', name: 'Microsoft Corp', weight: 8.4, sector: 'Technology', price: 428.40, pnlPct: +14.2, harvestable: false },
        { symbol: 'AAPL', name: 'Apple Inc', weight: 7.9, sector: 'Technology', price: 228.15, pnlPct: +8.5, harvestable: false },
        { symbol: 'NVDA', name: 'NVIDIA Corp', weight: 6.8, sector: 'Semiconductors', price: 122.50, pnlPct: -6.4, harvestable: true, harvestLoss: '$1,840' },
        { symbol: 'AMZN', name: 'Amazon.com Inc', weight: 4.5, sector: 'Consumer Discretionary', price: 188.20, pnlPct: +11.2, harvestable: false },
        { symbol: 'GOOGL', name: 'Alphabet Inc', weight: 3.9, sector: 'Technology', price: 164.80, pnlPct: -3.8, harvestable: true, harvestLoss: '$890' },
        { symbol: 'META', name: 'Meta Platforms Inc', weight: 3.2, sector: 'Communication', price: 585.10, pnlPct: +19.4, harvestable: false },
        { symbol: 'BRK.B', name: 'Berkshire Hathaway', weight: 2.5, sector: 'Financials', price: 462.30, pnlPct: +5.1, harvestable: false },
        { symbol: 'LLY', name: 'Eli Lilly & Co', weight: 2.1, sector: 'Healthcare', price: 895.40, pnlPct: +15.3, harvestable: false },
        { symbol: 'JPM', name: 'JPMorgan Chase & Co', weight: 2.0, sector: 'Financials', price: 218.70, pnlPct: +9.7, harvestable: false },
        { symbol: 'TSLA', name: 'Tesla Inc', weight: 1.8, sector: 'Consumer Discretionary', price: 245.20, pnlPct: -14.2, harvestable: true, harvestLoss: '$2,450' }
      ]
    },
    {
      id: 'tech_innovators_direct',
      name: 'Silicon Valley Mega-Tech Direct',
      benchmark: 'Nasdaq 100 (QQQ)',
      description: 'High-conviction tech tilt optimized for engineers with heavy single-firm equity compensation seeking non-correlated tech exposure.',
      trackingError: '0.88%',
      projectedTaxAlpha: '+2.45% p.a.',
      wrapFeeBps: 25,
      wrapFeeAnnualPct: '0.25% p.a.',
      netClientTaxAlpha: '+2.20% p.a. (Net of 25 bps Advisory Fee)',
      historical3YReturn: '48.2%',
      benchmark3YReturn: '44.6%',
      minInvestment: 10000,
      constituents: [
        { symbol: 'NVDA', name: 'NVIDIA Corp', weight: 14.5, sector: 'Semiconductors', price: 122.50, pnlPct: -6.4, harvestable: true, harvestLoss: '$3,200' },
        { symbol: 'MSFT', name: 'Microsoft Corp', weight: 12.0, sector: 'Technology', price: 428.40, pnlPct: +14.2, harvestable: false },
        { symbol: 'AAPL', name: 'Apple Inc', weight: 11.5, sector: 'Technology', price: 228.15, pnlPct: +8.5, harvestable: false },
        { symbol: 'AVGO', name: 'Broadcom Inc', weight: 8.2, sector: 'Semiconductors', price: 168.40, pnlPct: +22.1, harvestable: false },
        { symbol: 'AMD', name: 'Advanced Micro Devices', weight: 6.5, sector: 'Semiconductors', price: 156.20, pnlPct: -11.5, harvestable: true, harvestLoss: '$1,920' },
        { symbol: 'CRM', name: 'Salesforce Inc', weight: 5.5, sector: 'Software', price: 295.40, pnlPct: +4.2, harvestable: false },
        { symbol: 'ADBE', name: 'Adobe Inc', weight: 4.8, sector: 'Software', price: 512.30, pnlPct: -8.1, harvestable: true, harvestLoss: '$1,450' }
      ]
    }
  ],
  IN: [
    {
      id: 'nifty50_direct',
      name: 'Nifty 50 Direct Index (CBDT Tax Optimized)',
      benchmark: 'Nifty 50 TRI (NIFTYBEES)',
      description: 'Fractional replication of top 50 Indian bluechips on NSE. Harvests short-term capital losses before March 31 to offset 20% STCG gains.',
      trackingError: '0.38%',
      projectedTaxAlpha: '+1.85% p.a.',
      wrapFeeBps: 25,
      wrapFeeAnnualPct: '0.25% p.a.',
      netClientTaxAlpha: '+1.60% p.a. (Net of 25 bps Advisory Fee)',
      historical3YReturn: '42.4%',
      benchmark3YReturn: '40.2%',
      minInvestment: 50000,
      constituents: [
        { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', weight: 11.8, sector: 'Banking', price: 1682.40, pnlPct: -4.5, harvestable: true, harvestLoss: '₹28,500' },
        { symbol: 'RELIANCE', name: 'Reliance Industries', weight: 10.2, sector: 'Energy & Conglomerate', price: 2985.10, pnlPct: +8.4, harvestable: false },
        { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', weight: 8.5, sector: 'Banking', price: 1245.80, pnlPct: +16.2, harvestable: false },
        { symbol: 'INFY', name: 'Infosys Ltd', weight: 6.8, sector: 'IT Services', price: 1892.30, pnlPct: +12.1, harvestable: false },
        { symbol: 'TCS', name: 'Tata Consultancy Services', weight: 4.5, sector: 'IT Services', price: 4260.50, pnlPct: -5.2, harvestable: true, harvestLoss: '₹18,400' },
        { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', weight: 4.2, sector: 'Telecom', price: 1640.20, pnlPct: +34.5, harvestable: false },
        { symbol: 'ITC', name: 'ITC Ltd', weight: 4.0, sector: 'FMCG', price: 512.40, pnlPct: +6.8, harvestable: false },
        { symbol: 'LT', name: 'Larsen & Toubro Ltd', weight: 3.8, sector: 'Infrastructure', price: 3680.10, pnlPct: +11.4, harvestable: false },
        { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', weight: 2.9, sector: 'Banking', price: 1845.00, pnlPct: -7.8, harvestable: true, harvestLoss: '₹14,200' },
        { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', weight: 2.8, sector: 'FMCG', price: 2780.40, pnlPct: -3.4, harvestable: true, harvestLoss: '₹9,800' }
      ]
    }
  ]
};

const { saveWrapEnrollment, getWrapEnrollments } = require('../db/database');
const { calculateAUMFee, validateFinancialNumber, validateCurrency } = require('../utils/financialMath');

async function getDirectIndexModels(req, res) {
  const market = req.query.market || 'US';
  const models = DIRECT_INDEX_MODELS[market] || DIRECT_INDEX_MODELS.US;

  // Calculate live aggregate harvestable metrics
  const enhancedModels = models.map(m => {
    const harvestableStocks = m.constituents.filter(c => c.harvestable);
    return {
      ...m,
      harvestableCount: harvestableStocks.length,
      activeTaxLossAlpha: m.projectedTaxAlpha,
      availableLotsToHarvest: harvestableStocks.map(s => s.symbol),
      wrapFeeBps: m.wrapFeeBps || 25,
      wrapFeeAnnualPct: m.wrapFeeAnnualPct || '0.25% p.a.',
      netClientTaxAlpha: m.netClientTaxAlpha || '+1.89% p.a.',
    };
  });

  return res.json({
    success: true,
    market,
    models: enhancedModels,
    advisoryWrapTerms: {
      standardFeeBps: 25,
      standardFeeAnnual: '0.25% of invested AUM',
      billingFrequency: 'Quarterly in arrears (6.25 bps per quarter)',
      netBenefitRatio: 'Client retains >85% of net harvested tax alpha'
    },
    cashSweepRates: {
      US: { yield: '5.15% APY', vehicle: 'US Treasury Bills (SGOV / TBIL)', liquidity: 'T+1 Daily Sweep' },
      IN: { yield: '6.85% p.a.', vehicle: 'Liquid Mutual Funds (Overnight)', liquidity: 'Instant ₹50k / T+1' }
    }[market]
  });
}

async function rebalanceDirectIndex(req, res) {
  const { modelId, exclusions = [], market = 'US', customCash = 10000 } = req.body;
  const models = DIRECT_INDEX_MODELS[market] || DIRECT_INDEX_MODELS.US;
  const targetModel = models.find(m => m.id === modelId) || models[0];

  // Filter out excluded constituents (e.g. employee RSU concentration)
  const activeConstituents = targetModel.constituents.filter(c => !exclusions.includes(c.symbol));
  const excludedWeightSum = targetModel.constituents
    .filter(c => exclusions.includes(c.symbol))
    .reduce((s, c) => s + c.weight, 0);

  // Pro-rata redistribution of excluded weights
  const remainingWeightSum = activeConstituents.reduce((s, c) => s + c.weight, 0);
  const reweightedOrders = activeConstituents.map(c => {
    const adjustedWeight = (c.weight / remainingWeightSum) * 100;
    const allocatedCash = (customCash * adjustedWeight) / 100;
    const targetQty = Number((allocatedCash / c.price).toFixed(market === 'US' ? 4 : 0));

    return {
      symbol: c.symbol,
      name: c.name,
      targetWeight: Number(adjustedWeight.toFixed(2)),
      originalWeight: c.weight,
      price: c.price,
      allocatedCash: Number(allocatedCash.toFixed(2)),
      targetQty: targetQty || 1,
      orderType: 'SOR_VWAP_FRACTIONAL',
      side: 'BUY'
    };
  });

  // Calculate annual 25 bps wrap fee on this investment
  const annualWrapFee = Math.round(customCash * 0.0025 * 100) / 100;
  const quarterlyDebit = Math.round((annualWrapFee / 4) * 100) / 100;

  return res.json({
    success: true,
    modelId: targetModel.id,
    modelName: targetModel.name,
    exclusionsApplied: exclusions,
    excludedWeightRedistributed: `${excludedWeightSum.toFixed(2)}%`,
    trackingErrorDelta: exclusions.length > 0 ? `+0.08% (negligible)` : `0.00%`,
    estimatedTaxLossAlphaHarvest: market === 'US' ? '$2,450 this tax quarter' : '₹42,800 this fiscal quarter',
    advisoryWrapFee: {
      basisPoints: 25,
      annualFeeAmount: annualWrapFee,
      quarterlyDebitAmount: quarterlyDebit,
      currency: market === 'IN' ? 'INR' : 'USD'
    },
    orderBasket: reweightedOrders,
    totalOrderAmount: customCash
  });
}

/**
 * POST /api/direct-indexing/enroll-wrap
 * Enrolls portfolio in 25 bps automated advisory wrap fee debited quarterly
 */
async function enrollWrapFee(req, res) {
  try {
    const {
      modelId,
      clientAUM,
      aum: aumParam,
      portfolioAum,
      clientSignature,
      market = 'US',
      userEmail = 'investor@finagent.app',
      tier = 'pro',
    } = req.body;

    const rawAum = clientAUM || aumParam || portfolioAum || 50000;
    const aum = validateFinancialNumber(rawAum, 'Client AUM', 1);
    const validCurrency = validateCurrency(market === 'IN' ? 'INR' : 'USD');

    const feeCalculation = calculateAUMFee(aum, 25);
    const annualWrapFee = feeCalculation.annualWrapFee;
    const quarterlyDebit = feeCalculation.quarterlyDebit;
    const agreementRef = `RIA-WRAP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const enrollmentRecord = {
      agreementRef,
      modelId: modelId || 'sp500_direct_50',
      userEmail,
      clientSignature: (clientSignature && clientSignature.trim()) || 'Digital Authorizer',
      market: market.toUpperCase(),
      aum,
      portfolioAum: aum,
      wrapFeeBps: 25,
      annualWrapFee,
      annualFeeUsd: annualWrapFee,
      quarterlyDebit,
      currency: validCurrency,
      status: 'ENROLLED_ACTIVE',
      enrolledAt: new Date().toISOString(),
      durableStorage: 'sqlite',
      advSchedule: 'Quarterly in arrears, automatically adjusted for harvested tax-loss alpha'
    };

    saveWrapEnrollment(enrollmentRecord);

    return res.json({
      success: true,
      enrollment: enrollmentRecord,
      message: 'Enrolled in 25 bps Direct Indexing Advisory Wrap Fee program.'
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/direct-indexing/cash-sweep-yield
 * Tiered Net Interest Margin (NIM) cash sweep calculation (50 bps float spread on Free tier)
 */
async function getCashSweepYield(req, res) {
  try {
    const market = req.query.market || 'US';
    const tier = (req.query.tier || 'free').toLowerCase();
    const balance = Number(req.query.balance) || (market === 'IN' ? 1000000 : 50000);

    const isUS = market === 'US';
    const institutionalYieldPct = isUS ? 5.15 : 6.85;

    // Free tier: FinAgent keeps 50 bps (0.50%) float spread
    // Pro & Black tiers: 100% pass-through (0 bps retained by FinAgent)
    const isFree = tier === 'free';
    const finagentSpreadBps = isFree ? 50 : 0;
    const finagentSpreadPct = isFree ? 0.50 : 0.00;
    const effectiveUserYieldPct = Number((institutionalYieldPct - finagentSpreadPct).toFixed(2));

    const annualUserYieldAmount = Math.round((balance * effectiveUserYieldPct / 100) * 100) / 100;
    const annualFinAgentSpreadAmount = Math.round((balance * finagentSpreadPct / 100) * 100) / 100;
    const upgradeGainAnnual = isFree ? Math.round((balance * 0.0050) * 100) / 100 : 0;

    return res.json({
      success: true,
      market,
      tier,
      balance,
      institutionalYieldPct: `${institutionalYieldPct}% ${isUS ? 'APY' : 'p.a.'}`,
      effectiveUserYieldPct: `${effectiveUserYieldPct}% ${isUS ? 'APY' : 'p.a.'}`,
      finagentSpreadBps,
      finagentSpreadPct: `${finagentSpreadPct}% p.a.`,
      annualUserEarnings: annualUserYieldAmount,
      annualFinAgentSpreadRevenue: annualFinAgentSpreadAmount,
      upgradeGainAnnual,
      upgradeIncentive: isFree
        ? `Upgrade to Pro or FinAgent Black to instantly eliminate the 50 bps spread and earn an extra ${isUS ? '$' : '₹'}${upgradeGainAnnual.toLocaleString()}/yr.`
        : 'VIP Status: You receive 100% unencumbered institutional yield with 0 bps spread deducted.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getDirectIndexModels,
  rebalanceDirectIndex,
  enrollWrapFee,
  getCashSweepYield,
};

