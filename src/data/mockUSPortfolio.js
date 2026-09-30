// Mock data for US Market portfolio and wealth diagnostics

export const usUserProfile = {
  name: 'Alex Morgan',
  age: 34,
  city: 'San Francisco, CA',
  income: 220000,
  taxFilingStatus: 'single',
  riskProfile: 'Moderate-Aggressive',
  email: 'alex.morgan@finagent.app',
  phone: '+1 (415) 890-2341',
  employer: 'Stripe Inc',
};

export const usNetWorth = {
  total: 842500,
  totalInvested: 648000,
  unrealizedPnL: 194500,
  unrealizedPnLPct: 30.01,
  monthlyDelta: 14200,
  monthlyDeltaPct: 1.72,
  lastSynced: 'Just now (via Plaid)',
  sources: ['Fidelity', 'Charles Schwab', 'Chase', 'Marcus'],
};

export const usAssetBreakdown = [
  { label: 'US Equities & RSUs', value: 370700, pct: 44, color: '#6366F1' },
  { label: '401(k) & Roth IRA', value: 261175, pct: 31, color: '#3B82F6' },
  { label: 'Real Estate Equity', value: 126375, pct: 15, color: '#10B981' },
  { label: 'Cash & HYSA (4.4%)', value: 67400, pct: 8, color: '#F59E0B' },
  { label: 'Crypto (BTC/ETH)', value: 16850, pct: 2, color: '#EC4899' },
];

export const usEquities = [
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', qty: 250, ltp: 512.40, avgCost: 445.00, value: 128100, pnl: 16850, pnlPct: 15.15, holdingDays: 450, taxType: 'LTCG', sector: 'Index ETF' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust (Nasdaq 100)', qty: 180, ltp: 490.20, avgCost: 415.50, value: 88236, pnl: 13446, pnlPct: 17.98, holdingDays: 390, taxType: 'LTCG', sector: 'Tech ETF' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', qty: 450, ltp: 124.50, avgCost: 82.00, value: 56025, pnl: 19125, pnlPct: 51.83, holdingDays: 220, taxType: 'STCG', sector: 'Semiconductors' },
  { symbol: 'AAPL', name: 'Apple Inc.', qty: 200, ltp: 228.30, avgCost: 185.00, value: 45660, pnl: 8660, pnlPct: 23.41, holdingDays: 520, taxType: 'LTCG', sector: 'Consumer Tech' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', qty: 125, ltp: 421.50, avgCost: 390.00, value: 52687, pnl: 3937, pnlPct: 8.08, holdingDays: 310, taxType: 'STCG', sector: 'Enterprise Tech' },
];

export const us401kHoldings = [
  {
    institution: 'Fidelity Investments',
    accountType: 'Traditional 401(k)',
    balance: 185000,
    annualContribution: 23000,
    employerMatchPct: 50,
    employerMatchMaxPct: 6,
    employerMatchAmount: 6600,
    vestedPct: 100,
    primaryFund: 'Vanguard Target Retirement 2055 (VFFVX)',
    expenseRatio: 0.08,
  },
  {
    institution: 'Vanguard',
    accountType: 'Roth IRA',
    balance: 48500,
    annualContribution: 7000,
    holdings: 'Vanguard Total Stock Market (VTI)',
    expenseRatio: 0.03,
  },
  {
    institution: 'Fidelity',
    accountType: 'Health Savings Account (HSA)',
    balance: 16800,
    annualContribution: 4150,
    investedAmount: 14200,
    cashAmount: 2600,
    taxAdvantage: 'Triple-Tax Free (Medical, Growth, Deduction)',
  },
];

export const usRealEstate = [
  {
    name: 'San Francisco Mission Condo',
    propertyType: 'Primary Residence',
    marketValue: 950000,
    mortgageBalance: 742000,
    equity: 208000,
    ltvPct: 78.1,
    interestRate: 6.625,
    loanTermYears: 30,
    originationDate: '2022-09-15',
    monthlyMortgageEMI: 4745,
    monthlyPMI: 195,
    pmiRemovalEligible: true, // LTV ~78%
  },
];

export const usCashHoldings = [
  { bank: 'Marcus by Goldman Sachs', type: 'High Yield Savings Account', balance: 52400, apy: 4.40, annualInterest: 2305, fdicInsured: true },
  { bank: 'Chase Bank', type: 'Premier Checking', balance: 15000, apy: 0.01, annualInterest: 1.5, fdicInsured: true },
];

export const usCrypto = [
  { symbol: 'BTC', name: 'Bitcoin', qty: 0.24, ltp: 63500, value: 15240, avgCost: 48000, pnl: 3720, pnlPct: 32.29 },
  { symbol: 'ETH', name: 'Ethereum', qty: 0.62, ltp: 2600, value: 1612, avgCost: 2300, pnl: 186, pnlPct: 13.04 },
];

export const usGoals = [
  { id: 'us-g1', name: 'FIRE Early Retirement ($2.5M)', targetAmount: 2500000, currentAmount: 842500, targetYear: 2040, status: 'on-track', progress: 34, icon: '🔥', yearsLeft: 14 },
  { id: 'us-g2', name: 'Secondary Home Down Payment', targetAmount: 200000, currentAmount: 125000, targetYear: 2027, status: 'on-track', progress: 62.5, icon: '🏡', yearsLeft: 1 },
  { id: 'us-g3', name: 'Max 401(k) + Mega Backdoor', targetAmount: 69000, currentAmount: 34000, targetYear: 2026, status: 'on-track', progress: 49.3, icon: '🛡️', yearsLeft: 0 },
];

export const usHealthScoreData = {
  overall: 84,
  grade: 'Good',
  percentile: 88,
  components: [
    { name: '401(k) & Match Capture', score: 95, max: 100, status: 'good', detail: 'Maxing $23k elective deferral + full 6% company match' },
    { name: 'Emergency Liquidity', score: 88, max: 100, status: 'good', detail: '6.4 months of living expenses safely in 4.4% HYSA' },
    { name: 'Wash-Sale Harvest Alpha', score: 72, max: 100, status: 'fair', detail: '$4,200 unrealized losses eligible for proxy swap' },
    { name: 'Mortgage & PMI Drag', score: 68, max: 100, status: 'fair', detail: 'LTV is 78.1% — eligible to cancel $195/mo PMI immediately' },
    { name: 'Tax-Advantaged Mix', score: 92, max: 100, status: 'good', detail: 'Active HSA & Backdoor Roth pipeline established' },
  ],
  improvements: [
    { action: 'Request PMI Cancellation on SF Condo', impact: 'Save $2,340/year in non-deductible insurance fees', cost: 'Free (Under HPA 1998)' },
    { action: 'Harvest $4,200 loss in NVDA lot via SOXX proxy', impact: 'Save $1,470 on 2026 federal/CA state income taxes', cost: 'Zero transaction fee' },
    { action: 'Open Chase Sapphire Preferred for 5/24 spot', impact: 'Earn 60,000 bonus points (~$1,200 travel value)', cost: '$95 annual fee' },
  ],
};
