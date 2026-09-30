// server/routes/commissionHunter.js
// Audits mutual fund holdings for Regular plan commission drag and calculates tax-optimized switch blueprint

const DEFAULT_COMMISSION_DELTA = 0.01; // ~1.0% annual distributor trailing commission
const EXPECTED_CAGR = 0.12; // 12% market benchmark CAGR

function isRegularFund(schemeName = '') {
  const name = schemeName.toLowerCase();
  return name.includes('regular') || (!name.includes('direct') && !name.includes('index') && !name.includes('etf'));
}

function calculateCompoundLoss(principal, annualRate, delta, years) {
  // Direct FV vs Regular FV
  const fvDirect = principal * Math.pow(1 + annualRate, years);
  const fvRegular = principal * Math.pow(1 + annualRate - delta, years);
  return Math.round(fvDirect - fvRegular);
}

function generateSwitchBlueprint(fund, index) {
  const value = fund.value || (fund.units * fund.nav) || 0;
  const holdingDays = fund.holdingDays || 400; // default to >1yr if unknown
  const hasExitLoad = holdingDays < 365;
  const exitLoadRate = hasExitLoad ? 0.01 : 0; // 1% exit load if redeemed within 1 year
  const exitLoadAmount = value * exitLoadRate;

  const pnl = fund.pnl || (value * 0.25); // estimate 25% unrealized gain if pnl not passed
  const isLTCG = holdingDays > 365;
  const taxRate = isLTCG ? 0.125 : 0.20;
  const estimatedTax = Math.max(0, pnl * taxRate);

  const directSchemeName = fund.name.replace(/regular/i, 'Direct').replace(/reg/i, 'Direct');
  const directName = directSchemeName.toLowerCase().includes('direct') ? directSchemeName : `${fund.name} (Direct Growth)`;

  return {
    fundId: index + 1,
    originalName: fund.name,
    directEquivalent: directName,
    currentValue: value,
    annualCommissionLost: Math.round(value * DEFAULT_COMMISSION_DELTA),
    holdingDays,
    exitLoadStatus: hasExitLoad ? '1.0% (Hold until day 366)' : '0% (Eligible to Switch Now)',
    exitLoadAmount: Math.round(exitLoadAmount),
    canSwitchNowFree: !hasExitLoad,
    estimatedTax: Math.round(estimatedTax),
    taxType: isLTCG ? 'LTCG (12.5%)' : 'STCG (20%)',
    recommendedTranche: !hasExitLoad ? 'Tranche 1: Switch Immediately' : `Tranche 2: Wait ${365 - holdingDays} days to avoid exit load`,
    actionUrl: 'https://app.mfcentral.com/investor/signin',
  };
}

// POST /api/commission/audit
async function auditCommission(req, res) {
  try {
    const { mutualFunds = [] } = req.body;

    let targetFunds = mutualFunds.filter(f => isRegularFund(f.name));

    // If user has zero regular funds or empty portfolio, provide realistic seed preview
    let isSimulated = false;
    if (targetFunds.length === 0) {
      isSimulated = true;
      targetFunds = [
        { name: 'HDFC Top 100 Fund - Regular Plan Growth', units: 350, nav: 950.5, value: 332675, pnl: 72000, holdingDays: 450 },
        { name: 'ICICI Prudential Bluechip Fund - Regular Plan Growth', units: 4200, nav: 110.2, value: 462840, pnl: 95000, holdingDays: 510 },
        { name: 'Nippon India Small Cap Fund - Regular Growth', units: 1250, nav: 165.8, value: 207250, pnl: 48000, holdingDays: 180 },
        { name: 'SBI Focused Equity Fund - Regular Plan', units: 850, nav: 290.4, value: 246840, pnl: 31000, holdingDays: 410 },
      ];
    }

    const totalRegularValue = targetFunds.reduce((sum, f) => sum + (f.value || 0), 0);
    const annualCommissionLoss = Math.round(totalRegularValue * DEFAULT_COMMISSION_DELTA);
    const loss10Year = calculateCompoundLoss(totalRegularValue, EXPECTED_CAGR, DEFAULT_COMMISSION_DELTA, 10);
    const loss20Year = calculateCompoundLoss(totalRegularValue, EXPECTED_CAGR, DEFAULT_COMMISSION_DELTA, 20);

    const switchBlueprints = targetFunds.map((fund, idx) => generateSwitchBlueprint(fund, idx));

    const readyToSwitchCount = switchBlueprints.filter(b => b.canSwitchNowFree).length;
    const immediateSwitchValue = switchBlueprints
      .filter(b => b.canSwitchNowFree)
      .reduce((s, b) => s + b.currentValue, 0);

    res.json({
      success: true,
      isSimulated,
      totalRegularValue,
      annualCommissionLoss,
      loss10Year,
      loss20Year,
      regularFundsCount: targetFunds.length,
      readyToSwitchCount,
      immediateSwitchValue,
      blueprints: switchBlueprints,
      assumptions: {
        trailingCommissionRate: '1.0% per annum',
        expectedCagr: '12% per annum',
      },
    });
  } catch (error) {
    console.error('[Commission Audit Error]:', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = { auditCommission };
