// server/routes/stressTest.js
// AI Black Swan Crisis Simulator & Portfolio Stress-Tester

const SCENARIO_CONFIGS = {
  crash_2008: {
    id: 'crash_2008',
    name: '2008 Global Liquidity Shock',
    tag: 'Severe Market Crash',
    equityDrawdown: -0.38,
    mfDrawdown: -0.32,
    fdReturn: 0.04,
    description: 'Simulates a systemic global credit freeze. Smallcaps plunge 50%, largecaps drop 35%, and investors experience liquidity panic.',
    hedgingPrescription: 'Maintain 10% allocation in Sovereign Gold Bonds (SGB) and High-Quality Liquid Debt to reduce portfolio beta and drawdown.',
  },
  job_loss: {
    id: 'job_loss',
    name: '12-Month Zero-Income Shock',
    tag: 'Personal Cashflow Shock',
    equityDrawdown: -0.12,
    mfDrawdown: -0.10,
    fdReturn: 0.05,
    description: 'Simulates a sudden job loss or industry layoff with zero salary income for 12 months while monthly EMIs, rent, and living expenses continue.',
    hedgingPrescription: 'Keep at least 9 months of non-negotiable living expenses in an overnight debt fund or flexi-deposit so you never distress-sell equities in a dip.',
  },
  tech_winter: {
    id: 'tech_winter',
    name: 'Tech & Startup Winter',
    tag: 'Sector Specific Plunge',
    equityDrawdown: -0.45,
    mfDrawdown: -0.26,
    fdReturn: 0.06,
    description: 'Simulates a 45% plunge in technology and high-multiple growth equities, accompanied by a tech compensation and hiring freeze.',
    hedgingPrescription: 'Rebalance tech concentration into value-oriented banking, domestic consumption, and dividend-yield mutual funds.',
  },
  rate_spike: {
    id: 'rate_spike',
    name: 'Crude Oil $130 & Inflation Spike',
    tag: 'Macro Inflation Shock',
    equityDrawdown: -0.22,
    mfDrawdown: -0.18,
    fdReturn: -0.02, // negative real return after inflation
    description: 'Brent crude surges above $130, inflation spikes to 8.5%, and the RBI aggressively hikes repo rates by 150 bps.',
    hedgingPrescription: 'Shift duration debt into Arbitrage and Floating Rate funds; hold allocation in commodities and export-earning equities.',
  },
};

// POST /api/stress-test/simulate
async function simulateCrisis(req, res) {
  try {
    const {
      scenarioId = 'crash_2008',
      totalNetWorth = 2430000,
      equities = 1250000,
      mutualFunds = 880000,
      fixedDeposits = 300000,
      monthlyBurn = 75000,
    } = req.body || {};

    const scenario = SCENARIO_CONFIGS[scenarioId] || SCENARIO_CONFIGS.crash_2008;

    const troughEquities = Math.round(equities * (1 + scenario.equityDrawdown));
    const troughMF = Math.round(mutualFunds * (1 + scenario.mfDrawdown));
    const troughFD = Math.round(fixedDeposits * (1 + scenario.fdReturn));
    const troughNetWorth = troughEquities + troughMF + troughFD;

    const absoluteDrawdown = totalNetWorth - troughNetWorth;
    const maxDrawdownPct = Math.round(((totalNetWorth - troughNetWorth) / totalNetWorth) * 100);

    // Calculate liquid survival runway in months
    const liquidBuffer = fixedDeposits + Math.round(mutualFunds * 0.5);
    const emergencyRunwayMonths = (liquidBuffer / (monthlyBurn || 75000)).toFixed(1);

    // 12-Month Drawdown Trajectory points
    const trajectory = [];
    for (let m = 0; m <= 12; m++) {
      let factor;
      if (m <= 6) {
        // Drawdown phase down to trough at month 6
        factor = 1 - (maxDrawdownPct / 100) * (m / 6);
      } else {
        // Slow recovery phase
        const recoveryProgress = (m - 6) / 6;
        factor = (1 - (maxDrawdownPct / 100)) + (recoveryProgress * (maxDrawdownPct / 100) * 0.4);
      }
      trajectory.push({
        month: m === 0 ? 'Today' : `M+${m}`,
        portfolioValue: Math.round(totalNetWorth * factor),
        troughValue: troughNetWorth,
      });
    }

    res.json({
      success: true,
      scenario,
      metrics: {
        currentNetWorth: totalNetWorth,
        troughNetWorth,
        absoluteDrawdown,
        maxDrawdownPct,
        emergencyRunwayMonths,
        monthlyBurn: monthlyBurn || 75000,
      },
      trajectory,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { simulateCrisis };
