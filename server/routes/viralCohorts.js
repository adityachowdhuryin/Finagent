// server/routes/viralCohorts.js
// Viral Growth Engines: "Financial Blind" Verified Peer Cohorts & Couple Financial Pre-Nup
// Enables anonymized percentile benchmarking, strategy cloning, and viral social scorecards

const crypto = require('crypto');

const VERIFIED_COHORTS = [
  {
    id: 'cohort_bay_l6',
    name: 'Silicon Valley Big Tech (L6 / Staff Engineers)',
    badge: 'Verified Tech',
    memberCount: 2480,
    medianNetWorth: 1840000,
    currency: 'USD',
    medianSavingsRate: 46,
    benchmarkAllocation: [
      { asset: 'US Equities (Tech heavy)', pct: 58, color: '#6366f1' },
      { asset: 'Real Estate / Primary', pct: 24, color: '#10b981' },
      { asset: 'Cash / Treasuries', pct: 12, color: '#3b82f6' },
      { asset: 'Crypto / Alts', pct: 6, color: '#f59e0b' }
    ],
    topClonedStrategy: {
      title: 'Barbell Tech Alpha + 401(k) Max',
      cagr3y: '24.2%',
      clonedByCount: 489,
      tags: ['Wash-Sale Opt', '83(b) Filed']
    }
  },
  {
    id: 'cohort_yc_founders',
    name: 'YC & Early-Stage Startup Founders',
    badge: 'YC Verified',
    memberCount: 890,
    medianNetWorth: 2650000,
    currency: 'USD',
    medianSavingsRate: 35,
    benchmarkAllocation: [
      { asset: 'Private Startup Equity', pct: 65, color: '#ec4899' },
      { asset: 'Index ETFs (VOO/QQQ)', pct: 20, color: '#6366f1' },
      { asset: 'Cash Runway (18 mos)', pct: 15, color: '#10b981' }
    ],
    topClonedStrategy: {
      title: 'Founder QSBS Shield + Runway Vault',
      cagr3y: '31.4%',
      clonedByCount: 312,
      tags: ['QSBS §1202', 'ISO Early Exercise']
    }
  },
  {
    id: 'cohort_blr_founders',
    name: 'Bangalore Tech Founders & VP Engineering',
    badge: 'India Unicorn Circle',
    memberCount: 1640,
    medianNetWorth: 62000000, // ₹6.2 Cr
    currency: 'INR',
    medianSavingsRate: 52,
    benchmarkAllocation: [
      { asset: 'Indian Direct Equity & MFs', pct: 50, color: '#6366f1' },
      { asset: 'Bangalore Real Estate', pct: 25, color: '#10b981' },
      { asset: 'US Stocks (LRS Scheme)', pct: 15, color: '#3b82f6' },
      { asset: 'Gold / SGB', pct: 10, color: '#f59e0b' }
    ],
    topClonedStrategy: {
      title: 'LRS US Tech + Direct Nifty Momentum',
      cagr3y: '22.8%',
      clonedByCount: 614,
      tags: ['Zero-Commission Direct', 'HUF Tax Arbitrage']
    }
  },
  {
    id: 'cohort_physicians',
    name: 'Specialist Physicians & Surgeons (< 45 yrs)',
    badge: 'Healthcare Pros',
    memberCount: 1220,
    medianNetWorth: 1450000,
    currency: 'USD',
    medianSavingsRate: 38,
    benchmarkAllocation: [
      { asset: 'Tax-Advantaged (403b/457b)', pct: 45, color: '#6366f1' },
      { asset: 'Primary Real Estate', pct: 35, color: '#10b981' },
      { asset: 'Municipal Bonds / Cash', pct: 20, color: '#3b82f6' }
    ],
    topClonedStrategy: {
      title: 'Backdoor Roth + Municipal Bond Ladder',
      cagr3y: '14.6%',
      clonedByCount: 284,
      tags: ['Backdoor Roth', 'Asset Protection Trust']
    }
  }
];

/**
 * GET /api/cohorts/list
 */
function getCohortsList(req, res) {
  const market = (req.query.market || 'US').toUpperCase();
  const cohorts = VERIFIED_COHORTS.filter(c =>
    market === 'US' ? c.currency === 'USD' : c.currency === 'INR'
  );

  res.json({
    success: true,
    market,
    cohorts: cohorts.length > 0 ? cohorts : VERIFIED_COHORTS
  });
}

/**
 * GET /api/cohorts/benchmark
 * Compares user data anonymously against selected cohort
 */
function benchmarkAgainstCohort(req, res) {
  const { cohortId = 'cohort_bay_l6', userNetWorth = 240000, userSavingsRate = 42 } = req.query;
  const cohort = VERIFIED_COHORTS.find(c => c.id === cohortId) || VERIFIED_COHORTS[0];

  const nwPercentile = Math.min(99, Math.max(10, Math.round((Number(userNetWorth) / cohort.medianNetWorth) * 50)));
  const savingsPercentile = Math.min(99, Math.max(10, Math.round((Number(userSavingsRate) / cohort.medianSavingsRate) * 50)));

  res.json({
    success: true,
    cohort: {
      name: cohort.name,
      badge: cohort.badge,
      memberCount: cohort.memberCount,
      medianNetWorth: cohort.medianNetWorth,
      medianSavingsRate: cohort.medianSavingsRate
    },
    userComparison: {
      netWorthPercentile: nwPercentile,
      savingsRatePercentile: savingsPercentile,
      ranking: nwPercentile >= 75 ? 'Top Quartile' : 'Middle Tier',
      gapAnalysis: `Your savings rate (${userSavingsRate}%) is ${userSavingsRate >= cohort.medianSavingsRate ? 'above' : 'below'} the cohort median (${cohort.medianSavingsRate}%).`
    },
    strategyToClone: cohort.topClonedStrategy
  });
}

/**
 * POST /api/prenup/calculate
 * Couple Financial Pre-Nup & Proportional Income Expense Splitter
 */
function calculateCouplePreNup(req, res) {
  const {
    partnerAName = 'Partner A',
    partnerBName = 'Partner B',
    partnerAIncome = 180000,
    partnerBIncome = 120000,
    partnerADebt = 15000,
    partnerBDebt = 45000,
    monthlySharedExpenses = 7500,
    market = 'US'
  } = req.body;

  const totalHouseholdIncome = partnerAIncome + partnerBIncome;
  const partnerAPct = Number(((partnerAIncome / totalHouseholdIncome) * 100).toFixed(1));
  const partnerBPct = Number(((partnerBIncome / totalHouseholdIncome) * 100).toFixed(1));

  // Proportional split of shared monthly expenses
  const partnerAShare = Math.round(monthlySharedExpenses * (partnerAPct / 100));
  const partnerBShare = Math.round(monthlySharedExpenses * (partnerBPct / 100));

  // 50/50 Equal split baseline comparison
  const equalSplit = Math.round(monthlySharedExpenses / 2);
  const fairEquityDelta = partnerAShare - equalSplit;

  // Couple Money Compatibility Score (0 - 100)
  const debtDisparityRatio = Math.abs(partnerADebt - partnerBDebt) / (partnerADebt + partnerBDebt + 1);
  const compatibilityScore = Math.max(50, Math.round(95 - (debtDisparityRatio * 20)));

  const currencySymbol = market === 'US' ? '$' : '₹';

  res.json({
    success: true,
    household: {
      partnerAName,
      partnerBName,
      totalIncome: totalHouseholdIncome,
      partnerAPct,
      partnerBPct
    },
    fairProportionalSplit: {
      partnerAAmount: partnerAShare,
      partnerBAmount: partnerBShare,
      monthlySharedExpenses,
      fairEquityNote: `${partnerAName} earns ${partnerAPct}% of household income and covers ${currencySymbol}${partnerAShare}/mo, leaving both partners with equitable discretionary income.`
    },
    equalSplitComparison: {
      equalAmount: equalSplit,
      burdenDisparity: `${partnerBName} would pay ${currencySymbol}${equalSplit - partnerBShare}/mo MORE than fair proportion under a rigid 50/50 split.`
    },
    compatibilityAudit: {
      score: compatibilityScore,
      rating: compatibilityScore >= 80 ? 'Highly Aligned' : 'Requires Pre-Agreed Guardrails',
      debtStrategy: partnerBDebt > partnerADebt
        ? `Recommend an accelerated Avalanche debt pool where ${partnerAName} funds higher joint living expenses while ${partnerBName} channels 60% of surplus into high-interest debt.`
        : 'Debts are balanced; recommend joint automated savings into index funds.'
    }
  });
}

/**
 * POST /api/viral-audit/generate
 * Generates viral 10-second shareable scorecard
 */
function generateViralAudit(req, res) {
  const { title = 'Staff Software Engineer', company = 'Google', annualCompensation = 350000, market = 'US' } = req.body;

  const estimatedTaxLeak = market === 'US'
    ? Math.round(annualCompensation * 0.042) // 4.2% typical W-2 state/401k leak
    : Math.round(annualCompensation * 0.065); // 6.5% typical Indian CTC leak

  const leakId = `leak_${crypto.randomBytes(3).toString('hex')}`;
  const currencySymbol = market === 'US' ? '$' : '₹';

  res.json({
    success: true,
    scorecard: {
      id: leakId,
      title,
      company,
      annualCompensation,
      estimatedAnnualLeak: estimatedTaxLeak,
      leakBreakdown: market === 'US' ? [
        { item: 'Unclaimed 401(k) Mega-Backdoor Roth', amount: 8500 },
        { item: 'State Tax Arbitrage Drag (CA/NY)', amount: 4800 },
        { item: 'Un-harvested Broker Capital Losses', amount: 1400 }
      ] : [
        { item: 'Regular MF Commission Drag (1.2%)', amount: 38000 },
        { item: 'Unused Corporate NPS (80CCD2)', amount: 45000 },
        { item: 'Salary Structure Non-Opt (HRA/Fuel)', amount: 22000 }
      ],
      headline: `Tech professionals at ${company} leak an average of ${currencySymbol}${estimatedTaxLeak.toLocaleString()}/yr in unoptimized wealth.`,
      shareableUrl: `https://finagent.app/audit/${leakId}`
    }
  });
}

module.exports = {
  getCohortsList,
  benchmarkAgainstCohort,
  calculateCouplePreNup,
  generateViralAudit
};
