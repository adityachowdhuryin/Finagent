// IRS Section 1091 Wash-Sale & Automated Tax-Loss Harvesting (TLH) Engine

const PROXY_REPLACEMENT_MAP = {
  VOO: {
    name: 'Vanguard S&P 500 ETF',
    proxies: [
      { symbol: 'IVV', name: 'iShares Core S&P 500 ETF', correlation: 0.999, expRatio: 0.03, rationale: 'Different index sponsor (S&P via BlackRock), IRS compliant non-identical proxy.' },
      { symbol: 'SCHX', name: 'Schwab U.S. Large-Cap ETF', correlation: 0.992, expRatio: 0.03, rationale: 'Tracks Dow Jones U.S. Large-Cap Total Stock Market Index.' },
      { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', correlation: 0.990, expRatio: 0.03, rationale: 'Tracks CRSP US Total Market Index (includes mid/small cap).' },
    ],
  },
  QQQ: {
    name: 'Invesco QQQ Trust (Nasdaq 100)',
    proxies: [
      { symbol: 'VGT', name: 'Vanguard Information Tech ETF', correlation: 0.945, expRatio: 0.10, rationale: 'Pure tech focus, tracks MSCI US Investable Market 25/50.' },
      { symbol: 'XLK', name: 'Technology Select Sector SPDR Fund', correlation: 0.950, expRatio: 0.09, rationale: 'Tracks Technology Select Sector Index.' },
    ],
  },
  VTI: {
    name: 'Vanguard Total Stock Market ETF',
    proxies: [
      { symbol: 'ITOT', name: 'iShares Core S&P Total U.S. Stock Market', correlation: 0.998, expRatio: 0.03, rationale: 'Tracks S&P Total Market Index.' },
      { symbol: 'SCHB', name: 'Schwab U.S. Broad Market ETF', correlation: 0.996, expRatio: 0.03, rationale: 'Tracks Dow Jones U.S. Broad Market Index.' },
    ],
  },
  VXUS: {
    name: 'Vanguard Total International Stock ETF',
    proxies: [
      { symbol: 'IXUS', name: 'iShares Core MSCI Total International Stock', correlation: 0.994, expRatio: 0.07, rationale: 'Tracks MSCI ACWI ex USA IMI Index.' },
    ],
  },
  NVDA: {
    name: 'NVIDIA Corporation',
    proxies: [
      { symbol: 'SOXX', name: 'iShares Semiconductor ETF', correlation: 0.885, expRatio: 0.35, rationale: 'Broad semiconductor exposure (NVDA is top holding ~10%).' },
      { symbol: 'SMH', name: 'VanEck Semiconductor ETF', correlation: 0.890, expRatio: 0.35, rationale: 'Semiconductor basket maintains exposure without wash sale.' },
    ],
  },
  TSLA: {
    name: 'Tesla Inc.',
    proxies: [
      { symbol: 'XLY', name: 'Consumer Discretionary Select Sector SPDR', correlation: 0.720, expRatio: 0.09, rationale: 'Discretionary sector index with high TSLA weighting.' },
    ],
  },
};

// POST /api/us-wash-sale/harvest
async function harvestTaxLoss(req, res) {
  try {
    const {
      symbol = 'VOO',
      shares = 100,
      purchasePrice = 520,
      currentPrice = 465,
      taxBracketFederal = 0.32,
      taxBracketState = 0.093, // California proxy
    } = req.body;

    const costBasis = shares * purchasePrice;
    const currentVal = shares * currentPrice;
    const unrealizedLoss = Math.max(0, costBasis - currentVal);

    if (unrealizedLoss === 0) {
      return res.json({
        success: true,
        eligible: false,
        message: 'No harvestable loss detected for this position (cost basis is lower than market price).',
      });
    }

    const combinedMarginalRate = Number(taxBracketFederal) + Number(taxBracketState);
    const estimatedTaxShield = Math.round(unrealizedLoss * combinedMarginalRate);
    const ordinaryIncomeOffset = Math.min(3000, unrealizedLoss);
    const ordinaryTaxSaved = Math.round(ordinaryIncomeOffset * combinedMarginalRate);

    const proxyData = PROXY_REPLACEMENT_MAP[symbol.toUpperCase()] || {
      name: `${symbol} Holding`,
      proxies: [
        {
          symbol: 'VTI',
          name: 'Vanguard Total Stock Market ETF',
          correlation: 0.85,
          expRatio: 0.03,
          rationale: 'Broad diversified equity proxy while awaiting 31-day wash-sale expiration.',
        },
      ],
    };

    const today = new Date();
    const safeReentryDate = new Date(today.getTime() + 31 * 24 * 60 * 60 * 1000);

    res.json({
      success: true,
      eligible: true,
      summary: {
        symbol: symbol.toUpperCase(),
        shares,
        purchasePrice,
        currentPrice,
        costBasis,
        currentVal,
        unrealizedLoss,
        estimatedTaxShield,
        ordinaryIncomeOffset,
        ordinaryTaxSaved,
        capitalGainsOffset: Math.max(0, unrealizedLoss - ordinaryIncomeOffset),
        combinedMarginalRate: Number((combinedMarginalRate * 100).toFixed(1)),
      },
      washSaleRules: {
        ircSection: 'IRS Code § 1091',
        restrictionWindowDays: 61, // 30 days before, day of sale, 30 days after
        saleDate: today.toISOString().split('T')[0],
        safeReentryDate: safeReentryDate.toISOString().split('T')[0],
        penaltyIfViolated: 'Loss is disallowed for this tax year and added to the cost basis of repurchased shares.',
      },
      proxyReplacements: proxyData.proxies,
      executionSteps: [
        `1. Sell all ${shares} shares of ${symbol.toUpperCase()} at market price (~$${currentVal.toLocaleString()}).`,
        `2. Instantly deploy proceeds ($${currentVal.toLocaleString()}) into proxy ${proxyData.proxies[0].symbol} to maintain market exposure.`,
        `3. Set calendar reminder for ${safeReentryDate.toLocaleDateString('en-US')} (31 days). You may swap back into ${symbol.toUpperCase()} after this date without triggering IRS Wash-Sale penalties.`,
        `4. Report $${unrealizedLoss.toLocaleString()} capital loss on Form 8949 / Schedule D to write off taxes.`,
      ],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { harvestTaxLoss, PROXY_REPLACEMENT_MAP };
