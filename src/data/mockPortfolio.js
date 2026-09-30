// Mock Portfolio Data — Arjun Sharma, 32, Bangalore
export const userProfile = {
  name: 'Arjun Sharma',
  age: 32,
  city: 'Bangalore',
  income: 2800000, // ₹28 LPA
  riskProfile: 'Moderate-Aggressive',
  panMasked: 'ABCPS****K',
  email: 'arjun.sharma@example.com',
  phone: '+91 98765 43210',
  dependents: 1, // Spouse
  employmentType: 'Salaried',
  employer: 'Infosys Ltd.',
};

export const netWorth = {
  total: 12487320,
  totalInvested: 10420000,
  unrealizedPnL: 2067320,
  unrealizedPnLPct: 19.84,
  monthlyDelta: 324500,
  monthlyDeltaPct: 2.67,
  lastSynced: '2 minutes ago',
  sources: ['AA Network', 'NSDL CDSL', 'EPF Portal'],
};

export const assetBreakdown = [
  { name: 'Equities', value: 3842100, color: '#6366F1', pct: 30.8, invested: 2900000 },
  { name: 'Mutual Funds', value: 2814500, color: '#8B5CF6', pct: 22.5, invested: 2400000 },
  { name: 'Fixed Deposits', value: 1800000, color: '#F59E0B', pct: 14.4, invested: 1800000 },
  { name: 'EPF / PPF', value: 2130720, color: '#10B981', pct: 17.1, invested: 1680000 },
  { name: 'Real Estate', value: 1400000, color: '#EC4899', pct: 11.2, invested: 3400000 },
  { name: 'Gold SGBs', value: 280000, color: '#F97316', pct: 2.2, invested: 220000 },
  { name: 'Insurance', value: 220000, color: '#06B6D4', pct: 1.8, invested: 220000 },
];

export const equityHoldings = [
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', qty: 45, ltp: 1642.30, avgCost: 1380.00, value: 738935, pnl: 118035, pnlPct: 18.98, holdingDays: 412, taxType: 'LTCG' },
  { symbol: 'INFY', name: 'Infosys Ltd.', qty: 120, ltp: 1834.55, avgCost: 1920.00, value: 220146, pnl: -10266, pnlPct: -4.45, holdingDays: 185, taxType: 'STCG' },
  { symbol: 'RELIANCE', name: 'Reliance Industries', qty: 28, ltp: 2912.40, avgCost: 2450.00, value: 81547, pnl: 12947, pnlPct: 18.87, holdingDays: 298, taxType: 'STCG' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', qty: 35, ltp: 4187.20, avgCost: 3820.00, value: 146552, pnl: 12852, pnlPct: 9.61, holdingDays: 521, taxType: 'LTCG' },
  { symbol: 'ITC', name: 'ITC Ltd.', qty: 400, ltp: 478.60, avgCost: 520.00, value: 191440, pnl: -16560, pnlPct: -7.96, holdingDays: 210, taxType: 'STCG' },
  { symbol: 'AXISBANK', name: 'Axis Bank Ltd.', qty: 80, ltp: 1156.85, avgCost: 980.00, value: 92548, pnl: 14148, pnlPct: 18.03, holdingDays: 389, taxType: 'LTCG' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', qty: 60, ltp: 1287.40, avgCost: 1050.00, value: 77244, pnl: 14244, pnlPct: 22.61, holdingDays: 672, taxType: 'LTCG' },
  { symbol: 'ZOMATO', name: 'Zomato Ltd.', qty: 250, ltp: 287.30, avgCost: 310.00, value: 71825, pnl: -5675, pnlPct: -7.34, holdingDays: 95, taxType: 'STCG' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd.', qty: 18, ltp: 8423.60, avgCost: 7200.00, value: 151625, pnl: 22025, pnlPct: 17.00, holdingDays: 445, taxType: 'LTCG' },
];

export const mutualFunds = [
  {
    name: 'Parag Parikh Flexi Cap Direct Growth',
    amc: 'PPFAS',
    nav: 342.50,
    units: 284.2,
    value: 973525,
    invested: 800000,
    pnl: 173525,
    pnlPct: 21.69,
    cagr3Y: 18.4,
    expenseRatio: 0.58,
    category: 'Flexi Cap',
    holdingDays: 892,
    taxType: 'LTCG',
  },
  {
    name: 'Axis Bluechip Direct Growth',
    amc: 'Axis MF',
    nav: 58.72,
    units: 4820.3,
    value: 283040,
    invested: 310000,
    pnl: -26960,
    pnlPct: -8.69,
    cagr3Y: 12.1,
    expenseRatio: 0.44,
    category: 'Large Cap',
    holdingDays: 320,
    taxType: 'STCG',
  },
  {
    name: 'Mirae Asset Tax Saver (ELSS) Direct Growth',
    amc: 'Mirae Asset',
    nav: 47.38,
    units: 3180.1,
    value: 150650,
    invested: 120000,
    pnl: 30650,
    pnlPct: 25.54,
    cagr3Y: 22.8,
    expenseRatio: 0.52,
    category: 'ELSS',
    holdingDays: 1095,
    taxType: 'LTCG',
    lockInDays: 0,
  },
  {
    name: 'SBI Liquid Direct Growth',
    amc: 'SBI MF',
    nav: 3892.14,
    units: 104.8,
    value: 408097,
    invested: 380000,
    pnl: 28097,
    pnlPct: 7.39,
    cagr3Y: 7.1,
    expenseRatio: 0.11,
    category: 'Liquid',
    holdingDays: 180,
    taxType: 'STCG',
  },
];

export const fixedDeposits = [
  {
    bank: 'State Bank of India',
    bankCode: 'SBI',
    amount: 1000000,
    rate: 7.2,
    startDate: '2024-04-01',
    maturityDate: '2026-04-01',
    daysRemaining: 238,
    interest: 144000,
    prematureWithdrawalPenalty: 0.5,
  },
  {
    bank: 'HDFC Bank',
    bankCode: 'HDFC',
    amount: 800000,
    rate: 7.0,
    startDate: '2025-01-15',
    maturityDate: '2026-01-15',
    daysRemaining: 38,
    interest: 56000,
    prematureWithdrawalPenalty: 1.0,
  },
];

export const epfData = {
  uan: 'UAN1001234567',
  employerContribution: 980000,
  employeeContribution: 1050000,
  interestEarned: 100720,
  total: 2130720,
  interestRate: 8.25,
  projectedAt60: 8200000,
};

export const realEstate = [
  {
    name: '2BHK Apartment, Whitefield',
    city: 'Bangalore',
    purchaseValue: 5200000,
    currentEstimate: 6800000,
    equity: 1400000,
    loanOutstanding: 5400000,
    loanRate: 8.9,
    emiMonthly: 52000,
    rentalIncome: 28000,
    rentalYield: 4.94,
  },
];

export const goldHoldings = [
  {
    name: 'RBI Sovereign Gold Bond 2023-24 Sr. III',
    units: 8,
    issuePrice: 5926,
    currentValue: 280000,
    maturityDate: '2031-12-27',
    interestRate: 2.5,
  },
];

export const insurancePolicies = [
  {
    type: 'Term Life',
    insurer: 'SBI Life Insurance',
    coverAmount: 5000000,
    premium: 18000,
    premiumFreq: 'Annual',
    maturityDate: '2054-01-01',
    nominee: 'Priya Sharma (Spouse)',
  },
  {
    type: 'Health',
    insurer: 'Star Health',
    coverAmount: 500000,
    premium: 12400,
    premiumFreq: 'Annual',
    maturityDate: '2027-03-31',
    members: ['Self', 'Spouse'],
  },
];

export const goals = [
  {
    id: 'g1',
    name: 'Retire at 50',
    icon: '🌴',
    targetAmount: 40000000,
    currentCorpus: 8487320,
    targetDate: '2043-01-01',
    yearsLeft: 17,
    monthlyRequired: 42000,
    currentSIP: 25000,
    progress: 67,
    status: 'behind',
    projectedCorpus: 26800000,
    probability: 62,
  },
  {
    id: 'g2',
    name: 'Home Purchase — Goa',
    icon: '🏠',
    targetAmount: 8000000,
    currentCorpus: 3440000,
    targetDate: '2028-06-01',
    yearsLeft: 2,
    monthlyRequired: 85000,
    currentSIP: 20000,
    progress: 43,
    status: 'at-risk',
    projectedCorpus: 4800000,
    probability: 38,
  },
  {
    id: 'g3',
    name: "Child's Education Fund",
    icon: '🎓',
    targetAmount: 5000000,
    currentCorpus: 4400000,
    targetDate: '2038-06-01',
    yearsLeft: 12,
    monthlyRequired: 8000,
    currentSIP: 10000,
    progress: 88,
    status: 'on-track',
    projectedCorpus: 5800000,
    probability: 91,
  },
];

export const netWorthHistory = [
  { month: 'Aug 25', total: 9240000, equity: 2800000, mf: 2100000, fd: 1800000, other: 2540000 },
  { month: 'Sep 25', total: 9580000, equity: 3020000, mf: 2180000, fd: 1800000, other: 2580000 },
  { month: 'Oct 25', total: 10120000, equity: 3380000, mf: 2280000, fd: 1800000, other: 2660000 },
  { month: 'Nov 25', total: 10640000, equity: 3540000, mf: 2420000, fd: 1800000, other: 2880000 },
  { month: 'Dec 25', total: 11280000, equity: 3720000, mf: 2560000, fd: 1800000, other: 3200000 },
  { month: 'Jan 26', total: 11840000, equity: 3820000, mf: 2640000, fd: 1800000, other: 3580000 },
  { month: 'Feb 26', total: 11920000, equity: 3780000, mf: 2700000, fd: 1800000, other: 3640000 },
  { month: 'Mar 26', total: 12163000, equity: 3840000, mf: 2780000, fd: 1800000, other: 3743000 },
  { month: 'Apr 26', total: 11980000, equity: 3620000, mf: 2750000, fd: 1800000, other: 3810000 },
  { month: 'May 26', total: 12220000, equity: 3760000, mf: 2790000, fd: 1800000, other: 3870000 },
  { month: 'Jun 26', total: 12380000, equity: 3820000, mf: 2800000, fd: 1800000, other: 3960000 },
  { month: 'Jul 26', total: 12487320, equity: 3842100, mf: 2814500, fd: 1800000, other: 4030820 },
];

export const actionItems = [
  {
    id: 'a1',
    priority: 'high',
    icon: '🚨',
    title: 'Idle cash earning low returns',
    body: '₹2.8L in SBI savings account earning 3.5%. A Liquid Fund yields 7.4% with same-day redemption.',
    potentialGain: 10920,
    prompt: 'I have ₹2.8L idle in my savings account. Where should I move it for better returns?',
  },
  {
    id: 'a2',
    priority: 'medium',
    icon: '⚠️',
    title: 'Insurance gap detected',
    body: 'Your term cover of ₹50L is 40% below the recommended ₹1.2Cr (10× annual income).',
    potentialGain: null,
    prompt: 'Am I adequately covered with my current SBI Life term insurance of ₹50L?',
  },
  {
    id: 'a3',
    priority: 'medium',
    icon: '💡',
    title: 'Tax-loss harvesting window open',
    body: '₹68,000 in harvestable STCG losses (Axis Bluechip + Zomato) before FY end March 31.',
    potentialGain: 14740,
    prompt: 'Help me harvest capital losses to save tax before March 31.',
  },
  {
    id: 'a4',
    priority: 'low',
    icon: '📅',
    title: 'HDFC FD maturing in 38 days',
    body: '₹8L FD at 7.0% matures Jan 15. Should you renew or redeploy into debt MFs?',
    potentialGain: null,
    prompt: 'My HDFC FD of ₹8L is maturing in 38 days. What should I do with the maturity amount?',
  },
];

export const healthScoreData = {
  overall: 74,
  grade: 'Good',
  percentile: 68,
  components: [
    { name: 'Liquidity Buffer', score: 82, max: 100, status: 'good', detail: '4.8 months of expenses in liquid assets' },
    { name: 'Diversification', score: 71, max: 100, status: 'fair', detail: 'Overweight IT sector (38% of equity)' },
    { name: 'Debt Management', score: 58, max: 100, status: 'poor', detail: 'Car loan EMI at 11% p.a. — above liquid return rate' },
    { name: 'Insurance Coverage', score: 63, max: 100, status: 'fair', detail: 'Term cover ₹50L vs ₹1.2Cr recommended (10× income)' },
    { name: 'Goal Progress', score: 74, max: 100, status: 'good', detail: '2 of 3 goals on track' },
  ],
  history: [
    { month: 'Aug 25', score: 64 }, { month: 'Sep 25', score: 66 }, { month: 'Oct 25', score: 67 },
    { month: 'Nov 25', score: 69 }, { month: 'Dec 25', score: 70 }, { month: 'Jan 26', score: 72 },
    { month: 'Feb 26', score: 71 }, { month: 'Mar 26', score: 73 }, { month: 'Apr 26', score: 72 },
    { month: 'May 26', score: 73 }, { month: 'Jun 26', score: 74 }, { month: 'Jul 26', score: 74 },
  ],
  improvements: [
    { action: 'Increase term cover to ₹1.2Cr', impact: '+7 points', cost: '~₹8,400/yr additional premium' },
    { action: 'Prepay car loan EMI', impact: '+5 points', cost: 'Use ₹2L from idle savings' },
    { action: 'Reduce IT sector concentration below 25%', impact: '+4 points', cost: 'Rebalance ₹50k to FMCG/Healthcare funds' },
  ],
};
