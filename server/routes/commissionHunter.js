// server/routes/commissionHunter.js
// Audits mutual fund holdings for Regular plan commission drag and calculates tax-optimized switch blueprint

const DEFAULT_COMMISSION_DELTA = 0.0115; // ~1.15% typical active equity distributor trailing fee
const EXPECTED_CAGR = 0.12; // 12% benchmark equity market CAGR

function isRegularFund(schemeName = '') {
  const name = schemeName.toLowerCase();
  // If explicitly direct, index, or ETF, it's direct/no trailer
  if (name.includes('direct') || name.includes('dir plan') || name.includes('dir ') || name.includes('etf')) {
    return false;
  }
  // If explicitly regular, reg, or default growth without direct marker, it is a regular commission-bearing fund
  return true;
}

function calculateCompoundLoss(principal, annualRate, delta, years) {
  // Direct FV vs Regular FV
  const fvDirect = principal * Math.pow(1 + annualRate, years);
  const fvRegular = principal * Math.pow(1 + annualRate - delta, years);
  return Math.round(fvDirect - fvRegular);
}

function generateSwitchBlueprint(fund, index) {
  const value = fund.value || (fund.units * fund.nav) || 0;
  const units = fund.units || (fund.nav > 0 ? Math.round(value / fund.nav) : 0);
  const holdingDays = fund.holdingDays || 400; // default to >1yr if unknown
  const hasExitLoad = holdingDays < 365;
  const daysRemaining = Math.max(0, 365 - holdingDays);

  // 1% exit load if redeemed within 1 year for equity funds
  const exitLoadRate = hasExitLoad ? 0.01 : 0;
  const exitLoadAmount = Math.round(value * exitLoadRate);

  // Annual commission lost on this fund
  const annualCommissionLost = Math.round(value * DEFAULT_COMMISSION_DELTA);
  const dailyCommission = annualCommissionLost / 365;
  const commissionDuringWait = Math.round(dailyCommission * daysRemaining);

  // Breakeven decision:
  // If waiting saves more on exit load than the commission leaked while waiting, wait!
  // Otherwise switch immediately.
  const shouldWait = hasExitLoad && (exitLoadAmount > commissionDuringWait);
  const netSavingsIfWaiting = Math.max(0, exitLoadAmount - commissionDuringWait);

  const pnl = fund.pnl || Math.round(value * 0.22); // estimate 22% unrealized gain if pnl not passed
  const isLTCG = holdingDays > 365;
  // Finance Act 2024: LTCG = 12.5% (above 1.25L), STCG = 20%
  const taxRate = isLTCG ? 0.125 : 0.20;
  const estimatedTax = Math.max(0, Math.round(pnl * taxRate));

  let directName = fund.name
    .replace(/ - Regular Plan/i, ' - Direct Plan')
    .replace(/ Regular Plan/i, ' Direct Plan')
    .replace(/ Regular Growth/i, ' Direct Growth')
    .replace(/ Regular/i, ' Direct')
    .replace(/ Reg /i, ' Direct ');

  if (!directName.toLowerCase().includes('direct')) {
    directName = `${fund.name} (Direct Growth)`;
  }

  // Determine Folio
  const folioNo = fund.folioNo || fund.folio || `FOLIO-${2100 + index * 137}`;

  return {
    fundId: index + 1,
    folioNo,
    originalName: fund.name,
    directEquivalent: directName,
    units,
    currentNav: fund.nav || (units > 0 ? Math.round((value / units) * 100) / 100 : 0),
    currentValue: value,
    unrealizedGain: pnl,
    annualCommissionLost,
    holdingDays,
    daysRemaining,
    exitLoadRatePct: hasExitLoad ? '1.0%' : '0.0%',
    exitLoadStatus: hasExitLoad
      ? `1.0% (Hold ${daysRemaining} days to 0%)`
      : '0.0% (Eligible to Switch Now)',
    exitLoadAmount,
    commissionDuringWait,
    shouldWait,
    netSavingsIfWaiting,
    canSwitchNowFree: !hasExitLoad,
    estimatedTax,
    taxType: isLTCG ? 'LTCG (12.5%)' : 'STCG (20%)',
    recommendedTranche: !hasExitLoad
      ? 'Tranche 1: Switch Immediately (0% Exit Load)'
      : shouldWait
        ? `Tranche 2: Wait ${daysRemaining} days (Saves Rs. ${netSavingsIfWaiting.toLocaleString('en-IN')} net)`
        : 'Tranche 1: Switch Now (Commission drag exceeds exit load)',
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
        { name: 'HDFC Top 100 Fund - Regular Plan Growth', units: 350, nav: 950.5, value: 332675, pnl: 72000, holdingDays: 450, folioNo: '10482910/82' },
        { name: 'ICICI Prudential Bluechip Fund - Regular Plan Growth', units: 4200, nav: 110.2, value: 462840, pnl: 95000, holdingDays: 510, folioNo: '92847192/14' },
        { name: 'Nippon India Small Cap Fund - Regular Growth', units: 1250, nav: 165.8, value: 207250, pnl: 48000, holdingDays: 210, folioNo: '48192039/55' },
        { name: 'SBI Focused Equity Fund - Regular Plan', units: 850, nav: 290.4, value: 246840, pnl: 31000, holdingDays: 410, folioNo: '73910284/90' },
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

    const pendingTrancheValue = switchBlueprints
      .filter(b => !b.canSwitchNowFree)
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
      pendingTrancheValue,
      blueprints: switchBlueprints,
      assumptions: {
        trailingCommissionRate: '1.15% per annum (Active Equity Category Average)',
        expectedCagr: '12.0% per annum',
        sebiMandate: 'SEBI (IA) Regulation 18(2) Direct Scheme Requirement',
      },
    });
  } catch (error) {
    console.error('[Commission Audit Error]:', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = { auditCommission };
