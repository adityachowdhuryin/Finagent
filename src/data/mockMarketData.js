// Market Data Mock — realistic Indian market data
export const marketTicker = [
  { symbol: 'NIFTY 50', value: 24842.65, change: 184.30, changePct: 0.75, direction: 'up' },
  { symbol: 'SENSEX', value: 81452.78, change: 612.45, changePct: 0.76, direction: 'up' },
  { symbol: 'BANK NIFTY', value: 53218.40, change: -124.80, changePct: -0.23, direction: 'down' },
  { symbol: 'NIFTY IT', value: 37842.15, change: 421.30, changePct: 1.13, direction: 'up' },
  { symbol: '10Y G-Sec', value: 6.84, change: -0.02, changePct: -0.29, direction: 'down', suffix: '%' },
  { symbol: 'INR/USD', value: 84.12, change: 0.18, changePct: 0.21, direction: 'up' },
  { symbol: 'GOLD (MCX)', value: 71842, change: 320, changePct: 0.45, direction: 'up', suffix: '/10g' },
  { symbol: 'NIFTY MIDCAP', value: 55612.30, change: 289.40, changePct: 0.52, direction: 'up' },
];

export const topGainers = [
  { symbol: 'BAJFINANCE', change: 4.32 },
  { symbol: 'ICICIBANK', change: 3.12 },
  { symbol: 'RELIANCE', change: 2.87 },
];

export const topLosers = [
  { symbol: 'ZOMATO', change: -2.14 },
  { symbol: 'ITC', change: -1.89 },
  { symbol: 'INFY', change: -0.94 },
];
