// US 30-Year Mortgage Arbitrage & Homeowners Protection Act (HPA) PMI Removal Engine

// POST /api/us-mortgage/audit
async function auditMortgage(req, res) {
  try {
    const {
      homeMarketValueUSD = 850000,
      currentMortgageBalanceUSD = 695000,
      currentInterestRatePct = 6.875,
      monthlyPMIUSD = 220,
      originationDate = '2022-10-01',
      loanTermYears = 30,
      lenderName = 'Wells Fargo Home Mortgage',
      accountNumber = 'WF-89102482',
    } = req.body;

    const currentLTV = Number(((currentMortgageBalanceUSD / homeMarketValueUSD) * 100).toFixed(2));
    const target80Balance = homeMarketValueUSD * 0.80;
    const target78Balance = homeMarketValueUSD * 0.78;

    const dollarsTo80LTV = Math.max(0, currentMortgageBalanceUSD - target80Balance);
    const dollarsTo78LTV = Math.max(0, currentMortgageBalanceUSD - target78Balance);

    const eligibleForBorrowerRequest = currentLTV <= 80.0;
    const eligibleForMandatoryLenderRemoval = currentLTV <= 78.0;

    // Refinance Benchmark (Freddie Mac PMMS baseline ~6.15%)
    const benchmarkRefiRatePct = 6.15;
    const rateSpread = Number((currentInterestRatePct - benchmarkRefiRatePct).toFixed(2));

    // Monthly Principal & Interest calculation
    function calcMonthlyPI(principal, annualRate, years) {
      const r = (annualRate / 100) / 12;
      const n = years * 12;
      if (r === 0) return principal / n;
      return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }

    const currentPI = Math.round(calcMonthlyPI(currentMortgageBalanceUSD, currentInterestRatePct, 30));
    const refiPI = Math.round(calcMonthlyPI(currentMortgageBalanceUSD, benchmarkRefiRatePct, 30));
    const monthlyRefiSavings = Math.max(0, currentPI - refiPI);

    // Refinance Breakeven (assuming 1.5% closing costs)
    const estimatedClosingCosts = Math.round(currentMortgageBalanceUSD * 0.015);
    const breakevenMonths = monthlyRefiSavings > 0 ? Math.ceil(estimatedClosingCosts / monthlyRefiSavings) : 0;

    // Annualized PMI cost
    const annualPMICost = Math.round(monthlyPMIUSD * 12);
    const fiveYearPMICost = annualPMICost * 5;

    // Official HPA 1998 PMI Cancellation Letter
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const pmiLetterText = `Date: ${todayStr}

To:
${lenderName}
Escrow & Loan Servicing Department
Account No: ${accountNumber}

RE: FORMAL REQUEST FOR PRIVATE MORTGAGE INSURANCE (PMI) CANCELLATION UNDER 12 U.S. CODE § 4902 (HOMEOWNERS PROTECTION ACT OF 1998)

Dear Loan Servicing Representative,

I am writing to formally request the immediate cancellation of Private Mortgage Insurance (PMI) on the above-referenced mortgage account.

Pursuant to the Homeowners Protection Act of 1998 (12 U.S.C. § 4902(a)), borrowers have the statutory right to request PMI cancellation upon reaching an 80% Loan-to-Value (LTV) ratio based on the original value or current appraised value.

Property & Mortgage Details:
- Current Estimated Market Value: $${homeMarketValueUSD.toLocaleString()}
- Current Principal Balance: $${currentMortgageBalanceUSD.toLocaleString()}
- Resulting Loan-to-Value (LTV) Ratio: ${currentLTV}%
- Current Monthly PMI Premium: $${monthlyPMIUSD.toLocaleString()}/month

My payment history on this loan is in good standing with no 30-day late payments in the past 12 months or 60-day late payments in the past 24 months. I have no subordinate liens on the property.

Please confirm in writing the effective date of cancellation and provide updated escrow and payment schedule reflections, or advise if an official Broker Price Opinion (BPO) or appraisal is required to finalize this cancellation.

Sincerely,

________________________________________
Authorized Borrower Signature
Account No: ${accountNumber}
`;

    res.json({
      success: true,
      currentLTV,
      pmiAudit: {
        currentLTV,
        eligibleForBorrowerRequest, // 80% LTV
        eligibleForMandatoryLenderRemoval, // 78% LTV
        dollarsRemainingTo80LTV: Math.round(dollarsTo80LTV),
        dollarsRemainingTo78LTV: Math.round(dollarsTo78LTV),
        monthlyPMISaved: monthlyPMIUSD,
        annualPMISaved: annualPMICost,
        fiveYearPMISaved: fiveYearPMICost,
        hpaStatute: '12 U.S. Code § 4902 (Homeowners Protection Act of 1998)',
        status: eligibleForBorrowerRequest
          ? 'ELIGIBLE_FOR_REMOVAL_NOW'
          : `NEED_${Math.round(dollarsTo80LTV)}_PAYDOWN`,
      },
      refinanceAudit: {
        currentRate: currentInterestRatePct,
        benchmarkRate: benchmarkRefiRatePct,
        rateSpread,
        currentMonthlyPI: currentPI,
        refiMonthlyPI: refiPI,
        monthlyInterestSavings: monthlyRefiSavings,
        estimatedClosingCosts,
        breakevenMonths,
        isWorthRefinancing: rateSpread >= 0.75 && breakevenMonths <= 36,
      },
      pmiLetterText,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { auditMortgage };
