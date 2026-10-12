// server/routes/corporateTreasury.js
// Autonomous Corporate Treasury & CFO Yield Sentinel (/treasury)
// Multi-Bank FDIC/DICGC Deposit Sweeps ($10M+ Protection), T-Bill Laddering, and Dynamic Runway Sentinel

const crypto = require('crypto');

// Default Corporate Treasury Dataset
let treasuryData = {
  orgId: 'corp_hyperion_912',
  companyName: 'Hyperion AI Labs Inc.',
  market: 'US', // 'US' | 'IN'
  totalCash: 12450000.00, // $12.45M (or scaled in INR)
  payrollMonthlyNeed: 385000.00, // 385k/mo payroll & ops
  liquidityReserveDays: 90, // 90 days liquid buffer ($1.155M)
  blendedYieldPct: 4.92,
  monthlyYieldEarned: 51045.00,
  annualProjectedYield: 612540.00,
  fdicInsuranceCoveredPct: 100, // 100% insured via sweep network
  runwayMonths: 32.3,
  sweepNetworkStatus: 'OPTIMAL',
  apiConfig: {
    provider: 'Simulation Engine',
    apiKeyConfigured: true,
    autoSweepEnabled: true,
    minBankBuffer: 150000,
    maxPerBank: 245000, // Safe below $250k FDIC limit
  },
  banks: [
    { id: 'bnk_01', name: 'JPMorgan Chase & Co', routing: '021000021', balance: 245000, maxLimit: 250000, yieldPct: 4.85, status: 'INSURED', logo: '🏛️' },
    { id: 'bnk_02', name: 'Bank of America, N.A.', routing: '026009593', balance: 245000, maxLimit: 250000, yieldPct: 4.80, status: 'INSURED', logo: '🏦' },
    { id: 'bnk_03', name: 'First Citizens Bank (f. SVB)', routing: '121140399', balance: 245000, maxLimit: 250000, yieldPct: 4.95, status: 'INSURED', logo: '🏢' },
    { id: 'bnk_04', name: 'Wells Fargo Bank, N.A.', routing: '121000248', balance: 245000, maxLimit: 250000, yieldPct: 4.75, status: 'INSURED', logo: '🏛️' },
    { id: 'bnk_05', name: 'Citibank, N.A.', routing: '021000089', balance: 245000, maxLimit: 250000, yieldPct: 4.90, status: 'INSURED', logo: '🏦' },
    { id: 'bnk_06', name: 'Goldman Sachs Bank USA', routing: '124085029', balance: 245000, maxLimit: 250000, yieldPct: 5.10, status: 'INSURED', logo: '💼' },
    { id: 'bnk_07', name: 'Morgan Stanley Bank, N.A.', routing: '026013576', balance: 245000, maxLimit: 250000, yieldPct: 5.05, status: 'INSURED', logo: '📈' },
    { id: 'bnk_08', name: 'PNC Bank, N.A.', routing: '043000096', balance: 245000, maxLimit: 250000, yieldPct: 4.88, status: 'INSURED', logo: '🏛️' },
    { id: 'bnk_09', name: 'US Bank, N.A.', routing: '091000022', balance: 245000, maxLimit: 250000, yieldPct: 4.82, status: 'INSURED', logo: '🏦' },
    { id: 'bnk_10', name: 'Truist Bank', routing: '061000104', balance: 245000, maxLimit: 250000, yieldPct: 4.84, status: 'INSURED', logo: '🏛️' },
  ],
  tBillLadder: [
    { id: 'tb_4w', tenor: '4-Week T-Bill', maturityDate: '2026-11-06', cusip: '912797KU3', allocation: 2500000, yieldRate: 4.88, status: 'ACTIVE', gainMaturity: 10166 },
    { id: 'tb_8w', tenor: '8-Week T-Bill', maturityDate: '2026-12-04', cusip: '912797LA6', allocation: 3000000, yieldRate: 4.95, status: 'ACTIVE', gainMaturity: 24750 },
    { id: 'tb_13w', tenor: '13-Week T-Bill', maturityDate: '2027-01-08', cusip: '912797LE8', allocation: 2500000, yieldRate: 5.05, status: 'ACTIVE', gainMaturity: 31562 },
    { id: 'tb_26w', tenor: '26-Week T-Bill', maturityDate: '2027-04-09', cusip: '912797LR9', allocation: 2000000, yieldRate: 5.15, status: 'ACTIVE', gainMaturity: 51500 },
  ],
  recentAuditLogs: [
    { id: 'log_01', timestamp: '2026-10-10T14:22:00Z', event: 'Autonomous Sweep Executed', detail: '$480k swept into Goldman Sachs & Morgan Stanley to maintain 100% FDIC compliance', hash: 'e8f10c8d' },
    { id: 'log_02', timestamp: '2026-10-08T09:15:00Z', event: '4-Week T-Bill Matured & Rolled', detail: '$2.5M principal + $9,800 interest auto-reinvested at 4.88%', hash: '7c42ba91' },
    { id: 'log_03', timestamp: '2026-10-01T10:00:00Z', event: 'Monthly Liquidity Rebalance', detail: 'Transferred $385k to operating payroll account for Oct 1st cycle', hash: '19d3ef64' }
  ]
};

function getTreasuryOverview(req, res) {
  const isIN = req.query.market === 'IN';
  
  if (isIN) {
    const inFactor = 83.5;
    return res.json({
      success: true,
      data: {
        ...treasuryData,
        market: 'IN',
        totalCash: Math.round(treasuryData.totalCash * inFactor),
        payrollMonthlyNeed: Math.round(treasuryData.payrollMonthlyNeed * inFactor),
        blendedYieldPct: 7.15,
        monthlyYieldEarned: Math.round(treasuryData.monthlyYieldEarned * inFactor * (7.15 / 4.92)),
        annualProjectedYield: Math.round(treasuryData.annualProjectedYield * inFactor * (7.15 / 4.92)),
        fdicInsuranceCoveredPct: 100, // 100% covered under DICGC multi-bank network
        currency: 'INR',
        currencySymbol: '₹',
        insuranceLabel: 'DICGC Insured (₹5 Lakhs/bank)',
        banks: [
          { id: 'in_bnk_01', name: 'HDFC Bank Ltd', routing: 'HDFC0000001', balance: 490000, maxLimit: 500000, yieldPct: 7.10, status: 'INSURED', logo: '🏛️' },
          { id: 'in_bnk_02', name: 'ICICI Bank Ltd', routing: 'ICIC0000002', balance: 490000, maxLimit: 500000, yieldPct: 7.15, status: 'INSURED', logo: '🏦' },
          { id: 'in_bnk_03', name: 'State Bank of India', routing: 'SBIN0000001', balance: 490000, maxLimit: 500000, yieldPct: 7.00, status: 'INSURED', logo: '🏢' },
          { id: 'in_bnk_04', name: 'Axis Bank Ltd', routing: 'UTIB0000004', balance: 490000, maxLimit: 500000, yieldPct: 7.20, status: 'INSURED', logo: '🏛️' },
          { id: 'in_bnk_05', name: 'Kotak Mahindra Bank', routing: 'KKBK0000005', balance: 490000, maxLimit: 500000, yieldPct: 7.25, status: 'INSURED', logo: '🏦' },
        ],
        tBillLadder: [
          { id: 'in_tb_91d', tenor: '91-Day RBI T-Bill', maturityDate: '2027-01-08', cusip: 'IN002026X01', allocation: 400000000, yieldRate: 6.95, status: 'ACTIVE', gainMaturity: 6950000 },
          { id: 'in_tb_182d', tenor: '182-Day RBI T-Bill', maturityDate: '2027-04-09', cusip: 'IN002026Y02', allocation: 350000000, yieldRate: 7.12, status: 'ACTIVE', gainMaturity: 12460000 },
          { id: 'in_tb_364d', tenor: '364-Day RBI T-Bill', maturityDate: '2027-10-08', cusip: 'IN002026Z03', allocation: 289575000, yieldRate: 7.28, status: 'ACTIVE', gainMaturity: 21081060 },
        ]
      }
    });
  }

  res.json({
    success: true,
    data: {
      ...treasuryData,
      currency: 'USD',
      currencySymbol: '$',
      insuranceLabel: 'FDIC Insured ($250,000/bank)',
    }
  });
}

function optimizeSweep(req, res) {
  const { totalCash, partnerCount = 40 } = req.body;
  const cash = Number(totalCash) || treasuryData.totalCash;
  const maxSafePerBank = 245000;
  
  const banksNeeded = Math.ceil(cash / maxSafePerBank);
  const perBankAllocation = Math.min(maxSafePerBank, Math.round(cash / banksNeeded));
  
  treasuryData.totalCash = cash;
  treasuryData.fdicInsuranceCoveredPct = 100;
  
  const auditEntry = {
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    event: 'Treasury Sweep Re-Optimized',
    detail: `Allocated $${(cash / 1e6).toFixed(2)}M across ${banksNeeded} chartered institutions. Zero balance exceeds $245,000.`,
    hash: crypto.randomBytes(4).toString('hex')
  };
  treasuryData.recentAuditLogs.unshift(auditEntry);
  
  res.json({
    success: true,
    message: 'Deposit sweep re-optimized with 100% deposit guarantee',
    banksAllocated: banksNeeded,
    perBankDeposit: perBankAllocation,
    insuredPct: 100,
    annualYieldEst: Math.round(cash * 0.0492),
    auditEntry
  });
}

function calculateTBillLadder(req, res) {
  const { targetAllocation, tenorMonths = 6 } = req.body;
  const alloc = Number(targetAllocation) || 5000000;
  
  const ladder = [
    { tenor: '4-Week', pct: 25, amount: alloc * 0.25, yield: 4.88, projectedInterest: Math.round(alloc * 0.25 * 0.0488 * (4 / 52)) },
    { tenor: '8-Week', pct: 30, amount: alloc * 0.30, yield: 4.95, projectedInterest: Math.round(alloc * 0.30 * 0.0495 * (8 / 52)) },
    { tenor: '13-Week', pct: 25, amount: alloc * 0.25, yield: 5.05, projectedInterest: Math.round(alloc * 0.25 * 0.0505 * (13 / 52)) },
    { tenor: '26-Week', pct: 20, amount: alloc * 0.20, yield: 5.15, projectedInterest: Math.round(alloc * 0.20 * 0.0515 * (26 / 52)) }
  ];

  const totalGain = ladder.reduce((sum, item) => sum + item.projectedInterest, 0);

  res.json({
    success: true,
    totalAllocation: alloc,
    blendedYield: 4.99,
    projectedAnnualYield: Math.round(alloc * 0.0499),
    cumulativeMaturityGain: totalGain,
    ladder
  });
}

function projectRunway(req, res) {
  const { currentCash, monthlyBurn, revenueGrowthPct = 5 } = req.body;
  const cash = Number(currentCash) || treasuryData.totalCash;
  const burn = Number(monthlyBurn) || treasuryData.payrollMonthlyNeed;
  
  const scenarios = {
    base: { burnRate: burn, runwayMonths: Number((cash / burn).toFixed(1)), status: 'HEALTHY' },
    conservative: { burnRate: burn * 1.25, runwayMonths: Number((cash / (burn * 1.25)).toFixed(1)), status: 'ADEQUATE' },
    worstCase: { burnRate: burn * 1.6, runwayMonths: Number((cash / (burn * 1.6)).toFixed(1)), status: 'ACTION_REQUIRED' }
  };

  res.json({
    success: true,
    totalCash: cash,
    scenarios,
    cfoRecommendation: scenarios.base.runwayMonths > 24
      ? 'Runway exceeds 24 months. Deploy up to 60% of idle capital into 13-week and 26-week sovereign T-Bills.'
      : 'Maintain 6-month buffer in overnight liquid sweeps.'
  });
}

function updateApiConfig(req, res) {
  const { provider, apiKey, autoSweepEnabled } = req.body;
  treasuryData.apiConfig = {
    ...treasuryData.apiConfig,
    provider: provider || treasuryData.apiConfig.provider,
    apiKeyConfigured: !!apiKey || treasuryData.apiConfig.apiKeyConfigured,
    autoSweepEnabled: autoSweepEnabled !== undefined ? autoSweepEnabled : treasuryData.apiConfig.autoSweepEnabled,
    lastUpdated: new Date().toISOString()
  };

  res.json({
    success: true,
    message: 'Treasury API configuration updated',
    config: treasuryData.apiConfig
  });
}

module.exports = {
  getTreasuryOverview,
  optimizeSweep,
  calculateTBillLadder,
  projectRunway,
  updateApiConfig
};
