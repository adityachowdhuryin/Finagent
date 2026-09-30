// server/routes/roundUpEngine.js
// Spare-Change Micro-Investing Engine (Acorns / Jar model)
// Rounds card transactions to the nearest dollar / ₹10 and auto-invests into S&P 500 ETF or Digital Gold

const crypto = require('crypto');

let roundUpJarState = {
  enabled: true,
  market: 'US',
  multiplier: 2, // 1x, 2x, 3x multiplier
  currentJarBalance: 42.60,
  investThreshold: 25.00,
  totalInvestedToDate: 840.00,
  targetAsset: 'VOO (Vanguard S&P 500 ETF)',
  currency: 'USD',
  transactions: [
    { id: 'tx_01', merchant: 'Starbucks Coffee', date: 'Today, 8:42 AM', spent: 5.35, roundUp: 0.65, multiplied: 1.30 },
    { id: 'tx_02', merchant: 'Whole Foods Market', date: 'Yesterday', spent: 64.12, roundUp: 0.88, multiplied: 1.76 },
    { id: 'tx_03', merchant: 'Uber Trip', date: 'Sep 27', spent: 22.40, roundUp: 0.60, multiplied: 1.20 },
    { id: 'tx_04', merchant: 'Trader Joe\'s', date: 'Sep 26', spent: 38.25, roundUp: 0.75, multiplied: 1.50 },
    { id: 'tx_05', merchant: 'Chipotle Mexican Grill', date: 'Sep 25', spent: 14.60, roundUp: 0.40, multiplied: 0.80 },
  ]
};

let roundUpJarStateIN = {
  enabled: true,
  market: 'IN',
  multiplier: 2,
  currentJarBalance: 380.00,
  investThreshold: 250.00,
  totalInvestedToDate: 6450.00,
  targetAsset: '24K Digital Gold / Nippon Nifty ETF',
  currency: 'INR',
  transactions: [
    { id: 'tx_in_01', merchant: 'Swiggy Food Delivery', date: 'Today, 1:15 PM', spent: 342.00, roundUp: 8.00, multiplied: 16.00 },
    { id: 'tx_in_02', merchant: 'Blinkit Instant Groceries', date: 'Yesterday', spent: 184.00, roundUp: 6.00, multiplied: 12.00 },
    { id: 'tx_in_03', merchant: 'Uber Auto Ride', date: 'Sep 27', spent: 91.00, roundUp: 9.00, multiplied: 18.00 },
    { id: 'tx_in_04', merchant: 'Blue Tokai Coffee', date: 'Sep 26', spent: 245.00, roundUp: 5.00, multiplied: 10.00 },
    { id: 'tx_in_05', merchant: 'Apollo Pharmacy', date: 'Sep 25', spent: 412.00, roundUp: 8.00, multiplied: 16.00 },
  ]
};

/**
 * GET /api/roundup/status
 */
function getRoundUpStatus(req, res) {
  const market = (req.query.market || 'US').toUpperCase();
  const state = market === 'US' ? roundUpJarState : roundUpJarStateIN;

  res.json({
    success: true,
    market,
    roundUp: state,
  });
}

/**
 * POST /api/roundup/config
 * Updates round-up multiplier (1x, 2x, 3x) and target asset.
 */
function updateConfig(req, res) {
  const { market = 'US', multiplier = 2, targetAsset } = req.body;
  const targetState = market === 'US' ? roundUpJarState : roundUpJarStateIN;

  targetState.multiplier = Number(multiplier);
  if (targetAsset) targetState.targetAsset = targetAsset;

  res.json({
    success: true,
    message: `Multiplier updated to ${multiplier}x!`,
    roundUp: targetState,
  });
}

/**
 * POST /api/roundup/invest
 * Manually or automatically sweeps the accumulated jar into the target asset.
 */
function investJar(req, res) {
  const { market = 'US' } = req.body;
  const targetState = market === 'US' ? roundUpJarState : roundUpJarStateIN;

  let investedAmount = targetState.currentJarBalance;
  if (investedAmount <= 0) {
    // In demo environment, replenish fresh accumulated spare change
    investedAmount = market === 'US' ? 25.00 : 250.00;
  }

  targetState.totalInvestedToDate += investedAmount;
  targetState.currentJarBalance = 0;

  const orderId = `rnd_inv_${crypto.randomBytes(4).toString('hex')}`;
  const currencySymbol = market === 'US' ? '$' : '₹';

  res.json({
    success: true,
    message: `Successfully invested ${currencySymbol}${investedAmount.toFixed(2)} into ${targetState.targetAsset}!`,
    orderId,
    investedAmount,
    roundUp: targetState,
  });
}

module.exports = {
  getRoundUpStatus,
  updateConfig,
  investJar,
};
