// Silicon Valley Tech Equity Compensation OS (RSU Under-Withholding, ISO/AMT Form 6251 & Section 83b)

// POST /api/us-equity/analyze
async function analyzeEquity(req, res) {
  try {
    const {
      companyName = 'Tech Corp',
      baseSalaryUSD = 200000,
      rsuVestingUSD = 80000, // Annual RSU vest value
      state = 'CA', // CA, NY, WA, TX
      isoExercises = [
        // { shares: 5000, strikeUSD: 3.50, fmvAtExerciseUSD: 28.00, exerciseDate: '2024-05-10' }
      ],
      earlyGrantDate = null, // for Section 83(b) 30-day deadline
    } = req.body;

    // ── 1. RSU Under-Withholding Tax Cliff ─────────────────────────────────────
    // Statutory federal supplemental withholding rate is only 22% for bonuses/RSUs under $1M
    const federalStatutoryWithholdingPct = 0.22;
    const totalW2Income = Number(baseSalaryUSD) + Number(rsuVestingUSD);

    // Realistic marginal bracket for this income level
    let actualFederalMarginalRate = 0.24;
    if (totalW2Income > 243725) actualFederalMarginalRate = 0.35;
    else if (totalW2Income > 191950) actualFederalMarginalRate = 0.32;
    else if (totalW2Income > 100525) actualFederalMarginalRate = 0.24;

    const stateMarginalRate = state === 'CA' ? 0.093 : state === 'NY' ? 0.0685 : 0;
    const companyWithheldFederal = Math.round(rsuVestingUSD * federalStatutoryWithholdingPct);
    const companyWithheldState = Math.round(rsuVestingUSD * (stateMarginalRate * 0.7)); // state supplemental proxy ~6.6% in CA

    const actualFederalTaxOwedOnRSU = Math.round(rsuVestingUSD * actualFederalMarginalRate);
    const actualStateTaxOwedOnRSU = Math.round(rsuVestingUSD * stateMarginalRate);

    const federalShortfall = Math.max(0, actualFederalTaxOwedOnRSU - companyWithheldFederal);
    const stateShortfall = Math.max(0, actualStateTaxOwedOnRSU - companyWithheldState);
    const totalUnderWithholdingShortfall = federalShortfall + stateShortfall;

    // ── 2. ISO Exercise & Alternative Minimum Tax (AMT Form 6251) ─────────────
    let totalISOSpreadUSD = 0;
    let totalExerciseCostUSD = 0;
    let estimatedAMTTaxUSD = 0;

    if (Array.isArray(isoExercises) && isoExercises.length > 0) {
      isoExercises.forEach((iso) => {
        const spreadPerShare = Math.max(0, (iso.fmvAtExerciseUSD || iso.fmvUSD || 0) - (iso.strikeUSD || 0));
        const totalSpread = spreadPerShare * (iso.shares || 0);
        const cost = (iso.strikeUSD || 0) * (iso.shares || 0);
        totalISOSpreadUSD += totalSpread;
        totalExerciseCostUSD += cost;
      });

      // AMT calculation proxy for 2024:
      // Exemption: $85,700 (Single) phasing out at 25% over $609,350
      // AMT rate: 26% on first $232,600 of AMTI, 28% above
      if (totalISOSpreadUSD > 0) {
        const amti = totalW2Income + totalISOSpreadUSD;
        const exemption = Math.max(0, 85700 - Math.max(0, amti - 609350) * 0.25);
        const taxableAMTI = Math.max(0, amti - exemption);
        const tentativeMinimumTax = Math.round(taxableAMTI * 0.28);
        const regularTaxProxy = Math.round(totalW2Income * 0.26);
        estimatedAMTTaxUSD = Math.max(0, tentativeMinimumTax - regularTaxProxy);
      }
    }

    // ── 3. Section 83(b) Election Countdown ──────────────────────────────────
    let section83bStatus = null;
    if (earlyGrantDate) {
      const grant = new Date(earlyGrantDate);
      const deadline = new Date(grant.getTime() + 30 * 24 * 60 * 60 * 1000); // exactly 30 days
      const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      section83bStatus = {
        grantDate: grant.toISOString().split('T')[0],
        strictDeadline: deadline.toISOString().split('T')[0],
        daysRemaining: daysLeft,
        isExpired: daysLeft < 0,
        warning: daysLeft < 0
          ? 'EXPIRED: 83(b) election was not filed within 30 days. Future vesting will be taxed at ordinary income rates.'
          : `CRITICAL: You have ${daysLeft} days to physical mail IRS Form 83(b) via USPS Certified Mail with Return Receipt.`,
      };
    }

    res.json({
      success: true,
      companyName,
      totalW2Compensation: totalW2Income,
      rsuWithholdingAudit: {
        vestValueUSD: rsuVestingUSD,
        actualFederalBracketPct: Number((actualFederalMarginalRate * 100).toFixed(1)),
        statutoryWithheldFederalPct: 22.0,
        federalShortfallUSD: federalShortfall,
        stateShortfallUSD: stateShortfall,
        totalSurpriseTaxDueInApril: totalUnderWithholdingShortfall,
        severity: totalUnderWithholdingShortfall > 10000 ? 'HIGH_CLIFF' : 'MODERATE',
        remedy: 'Submit an updated W-4 to HR requesting additional per-paycheck withholding on Step 4(c) to avoid IRS Form 2210 underpayment penalties.',
      },
      isoAMTAudit: {
        totalSharesExercised: isoExercises.reduce((s, i) => s + (i.shares || 0), 0),
        totalExerciseCostUSD,
        totalPaperSpreadUSD: totalISOSpreadUSD,
        estimatedAMTTaxUSD,
        form8801CreditGeneratedUSD: estimatedAMTTaxUSD, // Recoupable in future years
        warning: totalISOSpreadUSD > 50000
          ? 'High AMT Exposure: You owe tax on paper wealth even if the private company never goes public or drops in value.'
          : 'Low to moderate AMT impact.',
      },
      section83bStatus,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { analyzeEquity };
