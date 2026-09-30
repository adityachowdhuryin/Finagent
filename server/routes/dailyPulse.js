// server/routes/dailyPulse.js
// Daily Financial Pulse (Morning Briefing & Market-Close Digest) + Intraday Dip Radar

/**
 * POST /api/pulse/generate
 * Generates Morning Briefing (9:00 AM) or Market-Close Digest (4:30 PM).
 */
function generateDailyPulse(req, res) {
  const { market = 'US', timeOfDay = 'morning' } = req.body;
  const isMorning = timeOfDay === 'morning';

  if (market === 'US') {
    return res.json({
      success: true,
      market: 'US',
      edition: isMorning ? 'Morning Financial Pulse (9:00 AM EST)' : 'Market-Close Digest (4:30 PM EST)',
      timestamp: new Date().toISOString(),
      netWorthDelta: isMorning ? '+0.42% (Pre-market Futures Green)' : '+$1,185.40 (+0.84% Today)',
      summary: isMorning
        ? 'US Markets poised for a higher open led by semiconductor momentum. You have 1 bill due in 4 days and $3,840 eligible for cash sweep.'
        : 'S&P 500 closed up +0.65% at 5,720. Your equity portfolio outperformed the benchmark by +19 bps today.',
      movers: [
        { symbol: 'NVDA', name: 'Nvidia Corp', change: '+3.42%', price: '$128.40', sentiment: 'BULLISH' },
        { symbol: 'VOO', name: 'Vanguard S&P 500', change: '+0.68%', price: '$498.40', sentiment: 'NEUTRAL' },
        { symbol: 'TSLA', name: 'Tesla Inc', change: '-1.85%', price: '$242.10', sentiment: 'BEARISH' },
      ],
      actionItems: [
        { priority: 'HIGH', text: 'AT&T bill ($175.50) due in 4 days. Auto-pay scheduled from Chase Checking.' },
        { priority: 'MEDIUM', text: 'Harvest Radar: TSLA intraday dip opened a $420 tax-loss harvest opportunity.' },
        { priority: 'LOW', text: 'Spare-Change Round-Ups accumulated $42.50 this week ready for S&P 500 auto-investment.' }
      ],
      macro: '10-Year Treasury Yield held steady at 3.72%. Fed Funds futures price in a 25 bps rate cut next meeting.'
    });
  }

  // India Market Pulse
  return res.json({
    success: true,
    market: 'IN',
    edition: isMorning ? 'Morning Wealth Pulse (9:00 AM IST)' : 'Market-Close Wrap (4:00 PM IST)',
    timestamp: new Date().toISOString(),
    netWorthDelta: isMorning ? '+0.28% (GIFT Nifty hints gap-up)' : '+₹16,420.00 (+0.52% Today)',
    summary: isMorning
      ? 'GIFT Nifty trading +65 pts higher. Indian IT & Banking show institutional buying. 1 credit card bill due in 3 days.'
      : 'Nifty 50 closed at 25,410 (+0.45%). Mutual fund NAVs will update by 9:00 PM tonight.',
    movers: [
      { symbol: 'INFY', name: 'Infosys Ltd', change: '+2.14%', price: '₹1,940.00', sentiment: 'BULLISH' },
      { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', change: '+0.85%', price: '₹1,642.00', sentiment: 'NEUTRAL' },
      { symbol: 'TATASTEEL', name: 'Tata Steel Ltd', change: '-1.40%', price: '₹138.50', sentiment: 'BEARISH' },
    ],
    actionItems: [
      { priority: 'HIGH', text: 'HDFC Regalia Gold bill (₹32,000) due on 22nd Sep. Pay now to maintain 0 DPD credit score.' },
      { priority: 'MEDIUM', text: 'Tax loss bot detected ₹6,240 short-term capital loss offset on Tata Steel.' },
      { priority: 'LOW', text: 'UPI Round-Ups saved ₹380 this week into Digital Gold jar.' }
    ],
    macro: 'Crude oil at $73/bbl supportive of INR. Foreign Institutional Investors (FII) net buyers of ₹1,420 Cr yesterday.'
  });
}

/**
 * GET /api/pulse/dip-radar
 * Scans holdings for intraday dip opportunities (>2% drop).
 */
function getDipRadar(req, res) {
  const market = (req.query.market || 'US').toUpperCase();

  const dips = market === 'US' ? [
    {
      symbol: 'TSLA',
      name: 'Tesla Inc',
      drop: '-2.85%',
      currentPrice: 242.10,
      supportPrice: 238.00,
      rsi: 34.2,
      strategy: 'TAX_LOSS_HARVEST',
      potentialHarvestLoss: 620.00,
      currency: 'USD',
      recommendation: 'Dip satisfies short-term loss lock without triggering 30-day wash-sale rule using alternate EV ETF proxy.',
    },
    {
      symbol: 'AMD',
      name: 'Advanced Micro Devices',
      drop: '-3.12%',
      currentPrice: 154.20,
      supportPrice: 152.00,
      rsi: 31.8,
      strategy: 'DCA_ACCUMULATION',
      potentialHarvestLoss: 0,
      currency: 'USD',
      recommendation: 'Trading near 200-day moving average. Favorable risk/reward for fractional DCA buy.',
    }
  ] : [
    {
      symbol: 'TATASTEEL',
      name: 'Tata Steel Ltd',
      drop: '-2.40%',
      currentPrice: 138.50,
      supportPrice: 135.00,
      rsi: 36.4,
      strategy: 'TAX_LOSS_HARVEST',
      potentialHarvestLoss: 4800.00,
      currency: 'INR',
      recommendation: 'Book short-term loss before metal sector cycle rebound to offset equity gains.',
    }
  ];

  res.json({
    success: true,
    market,
    scannedAssets: 18,
    dipsDetected: dips.length,
    opportunities: dips,
  });
}

module.exports = {
  generateDailyPulse,
  getDipRadar,
};
