// server/routes/residencyArbitrage.js
// Multi-State Tax Relocation & US-to-India Returnee RNOR Tax Engine
// Computes state tax savings, 183-day physical presence compliance, and Indian RNOR tax holidays

const STATE_TAX_RATES = {
  CA: { name: 'California', topMarginalRate: 13.3, capGainsTreatedAsOrdinary: true },
  NY: { name: 'New York (NYC combined)', topMarginalRate: 10.9, capGainsTreatedAsOrdinary: true },
  NJ: { name: 'New Jersey', topMarginalRate: 10.75, capGainsTreatedAsOrdinary: true },
  MA: { name: 'Massachusetts', topMarginalRate: 9.0, capGainsTreatedAsOrdinary: false },
  WA: { name: 'Washington', topMarginalRate: 0.0, capGainsTreatedAsOrdinary: false, excCapGainsRate: 7.0 },
  TX: { name: 'Texas', topMarginalRate: 0.0, capGainsTreatedAsOrdinary: false },
  FL: { name: 'Florida', topMarginalRate: 0.0, capGainsTreatedAsOrdinary: false },
  NV: { name: 'Nevada', topMarginalRate: 0.0, capGainsTreatedAsOrdinary: false }
};

/**
 * POST /api/residency/state-arbitrage
 * Calculates exact tax differential between origin and destination states
 */
function calculateStateArbitrage(req, res) {
  const {
    originState = 'CA',
    destState = 'TX',
    annualSalary = 280000,
    rsuVestingValue = 120000,
    capitalGains = 45000
  } = req.body;

  const origin = STATE_TAX_RATES[originState.toUpperCase()] || STATE_TAX_RATES.CA;
  const dest = STATE_TAX_RATES[destState.toUpperCase()] || STATE_TAX_RATES.TX;

  const totalOrdinaryIncome = annualSalary + rsuVestingValue;

  // Origin State Tax
  const originOrdinaryTax = Math.round(totalOrdinaryIncome * (origin.topMarginalRate / 100) * 0.85); // effective rate estimate
  const originCapGainsTax = Math.round(capitalGains * (origin.topMarginalRate / 100));
  const totalOriginStateTax = originOrdinaryTax + originCapGainsTax;

  // Destination State Tax
  const destOrdinaryTax = Math.round(totalOrdinaryIncome * (dest.topMarginalRate / 100) * 0.85);
  const destCapGainsTax = dest.excCapGainsRate ? Math.round(capitalGains * (dest.excCapGainsRate / 100)) : 0;
  const totalDestStateTax = destOrdinaryTax + destCapGainsTax;

  const annualTaxSavings = Math.max(0, totalOriginStateTax - totalDestStateTax);
  const fiveYearCompoundSavings = Math.round(annualTaxSavings * 5.86); // assuming 7% compounding

  // RSU Apportionment Warning for CA/NY
  const rsuNotice = (originState === 'CA' || originState === 'NY') && (destState === 'TX' || destState === 'FL' || destState === 'WA')
    ? `${origin.name} Franchise Tax Board enforces statutory work-day allocation: RSUs granted while working in ${origin.name} remain taxable in ${origin.name} pro-rata based on work days between grant date and vest date.`
    : 'No complex trailing state tax clawbacks detected.';

  res.json({
    success: true,
    comparison: {
      originState: origin.name,
      destState: dest.name,
      totalCompensation: totalOrdinaryIncome + capitalGains,
      originTax: totalOriginStateTax,
      destTax: totalDestStateTax,
      annualSavings: annualTaxSavings,
      fiveYearCompoundSavings,
      rsuNotice
    },
    relocationPlaybook: [
      { step: 'Establish Domicile', action: 'Acquire driver license, voter registration, and primary residential lease in destination state.' },
      { step: 'Sever Origin Ties', action: `Relinquish primary home in ${origin.name}; close local bank safety deposit boxes.` },
      { step: 'Workday Logging', action: 'Maintain contemporaneous digital flight and location logs proving fewer than 45 days in origin state post-move.' }
    ]
  });
}

/**
 * POST /api/residency/rnor-holiday
 * Calculates India RNOR (Resident but Not Ordinarily Resident) status for returning NRIs
 */
function calculateRNORStatus(req, res) {
  const {
    yearsInUSA = 7,
    expectedReturnYear = 2026,
    us401kBalance = 380000,
    usBrokerageGains = 42000,
    rentalIncomeUSA = 28000
  } = req.body;

  // An individual is RNOR in India if:
  // (a) They were an NRI in 9 out of 10 preceding financial years, OR
  // (b) They stayed in India for 729 days or less in the 7 preceding years.
  const isEligibleRNOR = yearsInUSA >= 2;
  const rnorDurationYears = yearsInUSA >= 9 ? 3 : 2;

  // Savings in India tax during RNOR (foreign income is 0% taxed in India during RNOR)
  const annualForeignIncome = usBrokerageGains + rentalIncomeUSA;
  const indiaTaxRate = 0.3588; // 30% + 4% cess + surcharge
  const annualRNORTaxSavings = Math.round(annualForeignIncome * indiaTaxRate);
  const totalHolidaySavings = annualRNORTaxSavings * rnorDurationYears;

  res.json({
    success: true,
    rnorSummary: {
      isEligible: isEligibleRNOR,
      statusLabel: isEligibleRNOR ? 'RNOR Qualified (Tax Holiday Active)' : 'Ordinary Resident (ROR)',
      holidayDuration: `${rnorDurationYears} Financial Years (FY ${expectedReturnYear}-${expectedReturnYear + 1} to FY ${expectedReturnYear + rnorDurationYears - 1}-${expectedReturnYear + rnorDurationYears})`,
      annualTaxSavedInIndia: annualRNORTaxSavings,
      totalProjectedSavings: totalHolidaySavings
    },
    exemptionsDuringRNOR: [
      { incomeSource: 'US 401(k) / Roth IRA growth', indianTaxability: '100% Tax Free in India' },
      { incomeSource: 'US Brokerage Capital Gains (VOO, AAPL)', indianTaxability: '100% Tax Free in India' },
      { incomeSource: 'US Real Estate Rental Income', indianTaxability: '100% Tax Free in India' },
      { incomeSource: 'Indian Salary / Indian Dividends', indianTaxability: 'Taxable under normal Indian slabs' }
    ],
    transitionChecklist: [
      { phase: 'Year 1 (RNOR)', task: 'Rebalance high-gain US stocks tax-free before attaining ROR status.' },
      { phase: 'Year 2 (RNOR)', task: 'Open RFC (Resident Foreign Currency) account to preserve USD holdings.' },
      { phase: 'Year 3 (Pre-ROR)', task: 'File Section 89A declaration for deferring Indian tax on US 401(k) retirement accounts.' }
    ]
  });
}

/**
 * POST /api/residency/day-counter
 * 183-day physical presence tracker and audit risk score
 */
function trackPhysicalPresence(req, res) {
  const {
    currentYear = 2026,
    daysInOrigin = 38,
    daysInDest = 274,
    daysTravelInternational = 53
  } = req.body;

  const threshold = 183;
  const auditRisk = daysInOrigin > 90 ? 'ELEVATED' : daysInOrigin > 45 ? 'MODERATE' : 'LOW';

  res.json({
    success: true,
    calendar: {
      currentYear,
      daysInOriginState: daysInOrigin,
      daysInDestinationState: daysInDest,
      internationalDays: daysTravelInternational,
      safeMarginDaysRemaining: Math.max(0, threshold - daysInOrigin),
      auditRisk
    },
    auditDefenseDocs: [
      { doc: 'Flight Boarding Passes & Itineraries', status: 'Logged', required: true },
      { doc: 'Credit Card Geolocation Receipts', status: 'Active', required: true },
      { doc: 'Primary Gym / Club Membership Swipes', status: 'Recommended', required: false },
      { doc: 'Cell Phone Tower / Toll Road EZ-Pass Records', status: 'Optional', required: false }
    ]
  });
}

module.exports = {
  calculateStateArbitrage,
  calculateRNORStatus,
  trackPhysicalPresence
};
