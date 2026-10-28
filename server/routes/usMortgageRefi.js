// server/routes/usMortgageRefi.js
// Institutional US Mortgage, Debt Architecture, Credit Bureau & Escrow Engine
// Statutes: 12 U.S.C. § 4902 (HPA 1998 PMI Cancellation), 12 U.S.C. § 2609 (RESPA § 10 Escrow Cushion),
// 15 U.S.C. § 1681 (FCRA § 609 / § 611 Credit Dispute), 2026 FHFA Conforming Limits & IRC § 461(g) Points.

const FHFA_2026_COUNTY_LIMITS = {
  // California
  'San Francisco, CA': 1149825,
  'San Mateo, CA': 1149825,
  'Santa Clara, CA': 1149825,
  'Marin, CA': 1149825,
  'Alameda, CA': 1149825,
  'Contra Costa, CA': 1149825,
  'Los Angeles, CA': 1149825,
  'Orange, CA': 1149825,
  'San Diego, CA': 1006250,
  'Santa Cruz, CA': 1149825,
  'Ventura, CA': 950000,
  // New York Metro
  'New York (Manhattan), NY': 1149825,
  'Kings (Brooklyn), NY': 1149825,
  'Queens, NY': 1149825,
  'Westchester, NY': 1149825,
  'Nassau, NY': 1149825,
  'Suffolk, NY': 1149825,
  // New Jersey
  'Bergen, NJ': 1149825,
  'Hudson, NJ': 1149825,
  'Essex, NJ': 1149825,
  // Washington State
  'King (Seattle), WA': 977500,
  'Snohomish, WA': 977500,
  'Pierce, WA': 977500,
  // Massachusetts
  'Suffolk (Boston), MA': 920000,
  'Middlesex, MA': 920000,
  'Norfolk, MA': 920000,
  // Colorado
  'Boulder, CO': 891250,
  'Denver, CO': 787750,
  'Pitkin (Aspen), CO': 1149825,
  // DMV Metro
  'District of Columbia, DC': 1149825,
  'Arlington, VA': 1149825,
  'Fairfax, VA': 1149825,
  'Montgomery, MD': 1149825,
  // Hawaii & High Cost
  'Honolulu, HI': 1149825,
  'Maui, HI': 1149825,
  'Monroe (Key West), FL': 920000,
};

const FHFA_2026_BASELINE_LIMIT = 766550;
const FHFA_2026_CEILING_LIMIT = 1149825;

function calcMonthlyPI(principal, annualRate, years = 30) {
  const r = (annualRate / 100) / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

// ── 1. Comprehensive Mortgage Audit & PMI Removal (12 U.S.C. § 4902) ────────
async function auditMortgage(req, res) {
  try {
    const {
      homeMarketValueUSD = 950000,
      currentMortgageBalanceUSD = 742000,
      currentInterestRatePct = 6.625,
      monthlyPMIUSD = 195,
      originationDate = '2022-10-01',
      loanTermYears = 30,
      lenderName = 'Wells Fargo Home Mortgage',
      accountNumber = 'WF-89102482',
      county = 'Santa Clara, CA',
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

    const currentPI = Math.round(calcMonthlyPI(currentMortgageBalanceUSD, currentInterestRatePct, 30));
    const refiPI = Math.round(calcMonthlyPI(currentMortgageBalanceUSD, benchmarkRefiRatePct, 30));
    const monthlyRefiSavings = Math.max(0, currentPI - refiPI);

    const estimatedClosingCosts = Math.round(currentMortgageBalanceUSD * 0.015);
    const breakevenMonths = monthlyRefiSavings > 0 ? Math.ceil(estimatedClosingCosts / monthlyRefiSavings) : 0;

    const annualPMICost = Math.round(monthlyPMIUSD * 12);
    const fiveYearPMICost = annualPMICost * 5;

    // FHFA 2026 Conforming vs Jumbo Status
    const countyLimit = FHFA_2026_COUNTY_LIMITS[county] || FHFA_2026_BASELINE_LIMIT;
    let loanCategory = 'CONFORMING_CONVENTIONAL';
    let reserveRequirementMonths = 2;
    let minDownPaymentPct = 3.0;

    if (currentMortgageBalanceUSD > countyLimit) {
      loanCategory = 'NON_CONFORMING_JUMBO';
      reserveRequirementMonths = 12;
      minDownPaymentPct = 15.0;
    } else if (countyLimit > FHFA_2026_BASELINE_LIMIT) {
      loanCategory = 'HIGH_BALANCE_CONFORMING';
      reserveRequirementMonths = 6;
      minDownPaymentPct = 5.0;
    }

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

Pursuant to the Homeowners Protection Act of 1998 (12 U.S.C. § 4902(a)), borrowers have the statutory right to request PMI cancellation upon reaching an 80% Loan-to-Value (LTV) ratio based on the original purchase price or current appraised fair market value.

Property & Mortgage Details:
- Current Fair Market Value: $${Number(homeMarketValueUSD).toLocaleString()}
- Current Principal Balance: $${Number(currentMortgageBalanceUSD).toLocaleString()}
- Resulting Loan-to-Value (LTV) Ratio: ${currentLTV}%
- Monthly PMI Premium: $${Number(monthlyPMIUSD).toLocaleString()}/month
- Property County: ${county}
- FHFA Conforming Limit: $${countyLimit.toLocaleString()} (${loanCategory})

Payment Standing Certification:
My payment history on this loan is in excellent standing with zero 30-day late payments in the past 12 months and zero 60-day late payments in the past 24 months. There are no secondary liens, equity lines of credit, or encumbrances against the property.

Statutory Demand:
Please confirm in writing within 30 days the effective date of PMI cancellation and provide an updated monthly payment coupon reflecting the deletion of the $${monthlyPMIUSD}/month charge. If an official Broker Price Opinion (BPO) or independent appraisal is required by Fannie Mae/Freddie Mac guidelines, please provide written authorization instructions immediately.

Sincerely,

________________________________________
Authorized Borrower Signature
Account No: ${accountNumber}
Certified Mail Tracking: 7021 0950 0001 8294 1029
`;

    res.json({
      success: true,
      currentLTV,
      fhfaAnalysis: {
        county,
        countyLimit,
        baselineLimit: FHFA_2026_BASELINE_LIMIT,
        isHighCostCounty: countyLimit > FHFA_2026_BASELINE_LIMIT,
        loanCategory,
        reserveRequirementMonths,
        minDownPaymentPct,
        maxDTI: loanCategory === 'NON_CONFORMING_JUMBO' ? 43 : 45,
      },
      pmiAudit: {
        currentLTV,
        eligibleForBorrowerRequest,
        eligibleForMandatoryLenderRemoval,
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

// ── 2. Mortgage Discount Points NPV Break-Even Engine (IRC § 461(g)) ────────
function computePointsNPV(req, res) {
  try {
    const {
      loanAmount = 750000,
      baseRatePct = 6.875,
      pointsPurchased = 1.5, // e.g. 1.5 points = 1.5% cost
      rateReductionPerPoint = 0.25, // typical 0.25% drop per point
      marginalTaxBracket = 32, // 32% federal bracket
      discountRatePct = 5.0, // 5% cost of capital / Treasury yield
      isPurchase = true, // purchase vs refinance
      holdingYears = 7, // expected years before move or refi
    } = req.body;

    const upfrontCost = Math.round(loanAmount * (pointsPurchased / 100));
    const effectiveRatePct = Number((baseRatePct - (pointsPurchased * rateReductionPerPoint)).toFixed(3));

    const baseMonthlyPI = Math.round(calcMonthlyPI(loanAmount, baseRatePct, 30));
    const reducedMonthlyPI = Math.round(calcMonthlyPI(loanAmount, effectiveRatePct, 30));
    const monthlySavings = Math.max(0, baseMonthlyPI - reducedMonthlyPI);
    const annualSavings = monthlySavings * 12;

    // IRC § 461(g) Tax Deductibility
    // Purchase of principal residence: points are 100% deductible in year of purchase (subject to $750k indebtedness limit)
    // Refinance: ratable amortization over 360 months (points / 30 years)
    let taxShieldYear1 = 0;
    let annualRefiTaxShield = 0;

    if (isPurchase) {
      // Capped by $750k indebtedness limit under TCJA
      const eligibleRatio = Math.min(1.0, 750000 / loanAmount);
      taxShieldYear1 = Math.round((upfrontCost * eligibleRatio) * (marginalTaxBracket / 100));
    } else {
      const eligibleRatio = Math.min(1.0, 750000 / loanAmount);
      const annualDeduction = (upfrontCost * eligibleRatio) / 30;
      annualRefiTaxShield = Math.round(annualDeduction * (marginalTaxBracket / 100));
    }

    const netUpfrontOutlay = isPurchase ? Math.max(0, upfrontCost - taxShieldYear1) : upfrontCost;

    // Nominal Break-Even Months
    const nominalBreakevenMonths = monthlySavings > 0 ? Math.ceil(upfrontCost / monthlySavings) : 999;
    const taxAdjustedBreakevenMonths = monthlySavings > 0 ? Math.ceil(netUpfrontOutlay / monthlySavings) : 999;

    // Net Present Value (NPV) calculation across holding horizon
    const monthlyDiscountRate = (discountRatePct / 100) / 12;
    let cumulativeNPV = -netUpfrontOutlay;
    const horizonMonths = holdingYears * 12;
    const yearlyMilestones = [];

    for (let m = 1; m <= Math.min(360, horizonMonths); m++) {
      const discountedCashFlow = monthlySavings / Math.pow(1 + monthlyDiscountRate, m);
      cumulativeNPV += discountedCashFlow;

      if (!isPurchase && m % 12 === 0) {
        // Add yearly tax shield for refi
        const discountedTaxShield = annualRefiTaxShield / Math.pow(1 + (discountRatePct / 100), m / 12);
        cumulativeNPV += discountedTaxShield;
      }

      if (m % 12 === 0) {
        const yr = m / 12;
        yearlyMilestones.push({
          year: yr,
          nominalSavings: annualSavings * yr,
          cumulativeNPV: Math.round(cumulativeNPV),
          isProfitable: cumulativeNPV > 0,
        });
      }
    }

    const recommendation = cumulativeNPV > 0
      ? 'BUY_POINTS_RECOMMENDED'
      : 'DO_NOT_BUY_POINTS';

    res.json({
      success: true,
      loanAmount,
      baseRatePct,
      effectiveRatePct,
      pointsPurchased,
      upfrontCost,
      taxShieldYear1,
      netUpfrontOutlay,
      baseMonthlyPI,
      reducedMonthlyPI,
      monthlySavings,
      annualSavings,
      nominalBreakevenMonths,
      taxAdjustedBreakevenMonths,
      holdingYears,
      totalNPV: Math.round(cumulativeNPV),
      recommendation,
      ircStatute: 'IRC § 461(g) Points Amortization & Deductibility Rules',
      yearlyMilestones,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── 3. SOFR ARM Interest Rate Shock Simulator (2/2/5 Caps) ──────────────────
function simulateArmShock(req, res) {
  try {
    const {
      loanAmount = 800000,
      initialRatePct = 5.875,
      armType = '5/1', // '5/1' | '7/1' | '10/1'
      initialCapPct = 2.0,
      periodicCapPct = 2.0,
      lifetimeCapPct = 5.0,
      sofrIndexPct = 4.85,
      marginPct = 2.75,
    } = req.body;

    const fixedYears = armType === '7/1' ? 7 : armType === '10/1' ? 10 : 5;
    const initialMonthlyPI = Math.round(calcMonthlyPI(loanAmount, initialRatePct, 30));
    const fullyIndexedRatePct = Number((sofrIndexPct + marginPct).toFixed(3));
    const maxLifetimeRatePct = Number((initialRatePct + lifetimeCapPct).toFixed(3));
    const firstResetMaxRatePct = Number((initialRatePct + initialCapPct).toFixed(3));

    // Calculate maximum rate shock payment
    const maxFirstResetPI = Math.round(calcMonthlyPI(loanAmount, firstResetMaxRatePct, 30 - fixedYears));
    const maxLifetimePI = Math.round(calcMonthlyPI(loanAmount, maxLifetimeRatePct, 30 - fixedYears - 2));

    const monthlyShockAtReset = Math.max(0, maxFirstResetPI - initialMonthlyPI);
    const maxMonthlyShockLifetime = Math.max(0, maxLifetimePI - initialMonthlyPI);
    const recommendedEmergencyBuffer = Math.round(maxMonthlyShockLifetime * 12);

    // Timeline simulation (30 years)
    const timeline = [];
    let currentBal = loanAmount;
    let currentRate = initialRatePct;

    for (let yr = 1; yr <= 15; yr++) {
      if (yr <= fixedYears) {
        currentRate = initialRatePct;
      } else if (yr === fixedYears + 1) {
        currentRate = Math.min(maxLifetimeRatePct, initialRatePct + initialCapPct);
      } else {
        currentRate = Math.min(maxLifetimeRatePct, currentRate + periodicCapPct);
      }

      const payment = Math.round(calcMonthlyPI(currentBal, currentRate, 30 - yr + 1));
      timeline.push({
        year: yr,
        isFixed: yr <= fixedYears,
        ratePct: currentRate,
        monthlyPI: payment,
        annualCost: payment * 12,
        paymentShockDelta: Math.max(0, payment - initialMonthlyPI),
      });

      // Rough amortization reduction
      currentBal = Math.max(0, currentBal - (payment * 12 * 0.4));
    }

    res.json({
      success: true,
      armType,
      fixedYears,
      initialRatePct,
      fullyIndexedRatePct,
      firstResetMaxRatePct,
      maxLifetimeRatePct,
      initialMonthlyPI,
      maxFirstResetPI,
      maxLifetimePI,
      monthlyShockAtReset,
      maxMonthlyShockLifetime,
      recommendedEmergencyBuffer,
      capsSummary: `${initialCapPct}% Initial / ${periodicCapPct}% Periodic / ${lifetimeCapPct}% Lifetime Cap`,
      timeline,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── 4. Statutory FCRA § 609 / § 611 Certified Credit Dispute Letter ────────
function generateFCRALetter(req, res) {
  try {
    const {
      consumerName = 'Alex Chen',
      consumerAddress = '100 University Ave, Palo Alto, CA 94301',
      ssnLast4 = '4821',
      dob = '1988-06-14',
      bureau = 'experian', // 'experian' | 'equifax' | 'transunion'
      creditorName = 'JPMorgan Chase Bank',
      accountNumber = 'CH-99201948',
      disputeReason = 'INACCURATE_30_DAY_LATE_PAYMENT',
      customReasonText = '',
      certifiedMailTracking = '7021 0950 0001 9842 5519',
    } = req.body;

    const bureauAddresses = {
      experian: {
        name: 'Experian Information Solutions, Inc.',
        address: 'P.O. Box 4500, Allen, TX 75013',
      },
      equifax: {
        name: 'Equifax Information Services LLC',
        address: 'P.O. Box 740256, Atlanta, GA 30374',
      },
      transunion: {
        name: 'TransUnion LLC Consumer Dispute Center',
        address: 'P.O. Box 2000, Chester, PA 19016',
      },
    };

    const targetBureau = bureauAddresses[bureau.toLowerCase()] || bureauAddresses.experian;
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const disputeDescriptions = {
      INACCURATE_30_DAY_LATE_PAYMENT: 'An erroneous 30-day late payment was reported on my tradeline despite full and timely electronic payment.',
      UNVERIFIED_COLLECTION_BALANCE: 'An unverified third-party collection balance is being reported without verifiable proof of initial assignment or chain of custody.',
      OBSOLETE_ACCOUNT_OVER_7_YEARS: 'This negative item has aged past the 7-year statutory obsolescence limitation governed by 15 U.S.C. § 1681c.',
      IDENTITY_MISMATCH_MIXED_FILE: 'This tradeline does not belong to me and appears to be the result of a mixed credit file or synthetic identity misattribution.',
      UNAUTHORIZED_HARD_INQUIRY: 'An unauthorized hard credit inquiry was pulled without my express written consent or permissible statutory purpose under 15 U.S.C. § 1681b.',
    };

    const specificReason = customReasonText || disputeDescriptions[disputeReason] || disputeDescriptions.INACCURATE_30_DAY_LATE_PAYMENT;

    const certifiedLetterText = `SENT VIA USPS CERTIFIED MAIL — RETURN RECEIPT REQUESTED
Certified Mail Tracking No: ${certifiedMailTracking}

Date: ${todayStr}

To:
${targetBureau.name}
Dispute Resolution Department
${targetBureau.address}

From:
${consumerName}
${consumerAddress}
SSN (Last 4): XXX-XX-${ssnLast4}
Date of Birth: ${dob}

RE: FORMAL DISPUTE NOTICE AND DEMAND FOR VERIFICATION UNDER 15 U.S.C. § 1681i (FCRA § 611) AND 15 U.S.C. § 1681g (FCRA § 609)

Dear Consumer Dispute Specialist,

This letter serves as a formal statutory dispute under the Fair Credit Reporting Act, 15 U.S.C. § 1681i (Section 611). I am formally challenging the accuracy, completeness, and lawful reporting of the following tradeline currently appearing on my consumer credit file:

DISPUTED TRADELINE:
- Creditor / Data Furnisher: ${creditorName}
- Account Number: ${accountNumber}
- Specific Defect / Grounds for Dispute: ${specificReason}

STATUTORY RIGHTS & DEMAND FOR ORIGINAL VERIFICATION:
Under 15 U.S.C. § 1681i(a)(1)(A), upon receipt of this dispute, you are required to conduct a prompt and reasonable reinvestigation of this disputed information free of charge within thirty (30) calendar days.

Pursuant to FCRA § 609 (15 U.S.C. § 1681g), I hereby demand that you provide documented substantiation of:
1. The original signed credit application, promissory note, or contractual instrument bearing my physical signature.
2. The complete electronic accounting ledger and itemized payment history from inception demonstrating the alleged delinquency.
3. The specific method and business contact details of the verification protocol used by your agency with the furnisher, including the name, title, and address of the individual who verified the accuracy of this data.

MANDATORY STATUTORY REMEDY:
If you cannot verify each disputed item within thirty (30) calendar days with competent, authenticated documentation from the furnisher, you must promptly delete the item from my credit file pursuant to 15 U.S.C. § 1681i(a)(5)(A).

Please be advised that willful or negligent non-compliance with the Fair Credit Reporting Act entitles consumers to civil statutory damages of up to $1,000 per violation, actual damages, punitive damages, and attorney's fees under 15 U.S.C. § 1681n and § 1681o.

Please forward an updated copy of my consumer disclosure report reflecting the deletion or correction of this tradeline to my address stated above.

Sincerely,

________________________________________
${consumerName}
Enclosures: Copy of Government-Issued Photo ID, Copy of Utility Statement for Proof of Address
`;

    res.json({
      success: true,
      bureau: targetBureau.name,
      disputeReason,
      certifiedMailTracking,
      letterText: certifiedLetterText,
      statuteCitations: [
        '15 U.S.C. § 1681i (Procedure in case of disputed accuracy - 30 day reinvestigation)',
        '15 U.S.C. § 1681g (Consumer disclosures & complete file visibility)',
        '15 U.S.C. § 1681n (Civil liability for willful noncompliance up to $1,000 + legal fees)',
      ],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── 5. RESPA § 10 Escrow Cushion Audit (12 U.S.C. § 2609) ──────────────────
function auditEscrow(req, res) {
  try {
    const {
      annualPropertyTax = 10800,
      annualHazardInsurance = 1800,
      annualFloodInsurance = 0,
      currentEscrowBalance = 3850,
      servicerName = 'Wells Fargo Home Mortgage',
      accountNumber = 'WF-89102482',
    } = req.body;

    const totalAnnualDisbursements = annualPropertyTax + annualHazardInsurance + annualFloodInsurance;
    const monthlyEscrowAccrual = Number((totalAnnualDisbursements / 12).toFixed(2));

    // Under RESPA § 10 (12 U.S.C. § 2609 & 12 CFR § 1024.17(c)(1)(vi)),
    // the servicer may maintain a cushion not to exceed 1/6th of total annual disbursements (2 months).
    const maxAllowableCushion = Math.round(totalAnnualDisbursements / 6);
    const escrowSurplus = Math.max(0, currentEscrowBalance - maxAllowableCushion);
    const hasUnlawfulSurplus = escrowSurplus > 50; // RESPA requires refund if surplus exceeds $50

    const todayStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const refundDemandLetterText = `Date: ${todayStr}

To:
${servicerName}
Escrow Accounting & Compliance Division
Account No: ${accountNumber}

RE: FORMAL DEMAND FOR ESCROW SURPLUS REFUND UNDER RESPA SECTION 10 (12 U.S.C. § 2609 & 12 CFR § 1024.17)

Dear Escrow Servicing Officer,

I am writing to formally request an immediate reconciliation and statutory refund of the surplus funds currently held in my mortgage escrow account.

Pursuant to Section 10 of the Real Estate Settlement Procedures Act (RESPA), 12 U.S.C. § 2609 and its implementing Regulation X (12 CFR § 1024.17), a loan servicer is strictly prohibited from maintaining an escrow cushion in excess of one-sixth (1/6th) of the total anticipated annual disbursements (representing a maximum of two months of escrow payments).

Escrow Cushion Audit:
- Annual County Property Taxes: $${annualPropertyTax.toLocaleString()}
- Annual Hazard / Homeowners Insurance: $${annualHazardInsurance.toLocaleString()}
- Total Annual Anticipated Disbursements: $${totalAnnualDisbursements.toLocaleString()}
- Statutory Maximum 1/6th Cushion Allowed: $${maxAllowableCushion.toLocaleString()}
- Current Escrow Account Balance Held: $${currentEscrowBalance.toLocaleString()}
- Discovered Unlawful Escrow Surplus: $${escrowSurplus.toLocaleString()}

Statutory Remedy:
Under 12 CFR § 1024.17(f)(2)(i), if an escrow analysis reveals a surplus equal to or greater than $50.00, the servicer MUST refund the full surplus amount to the borrower within thirty (30) calendar days of the analysis.

Please issue a refund check in the amount of $${escrowSurplus.toLocaleString()} made payable to the borrower or credit this exact balance directly toward my principal balance with an updated written amortization schedule within thirty (30) business days.

Sincerely,

________________________________________
Authorized Borrower Signature
Account No: ${accountNumber}
`;

    res.json({
      success: true,
      annualPropertyTax,
      annualHazardInsurance,
      totalAnnualDisbursements,
      monthlyEscrowAccrual,
      maxAllowableCushion,
      currentEscrowBalance,
      escrowSurplus,
      hasUnlawfulSurplus,
      statute: '12 U.S. Code § 2609 & 12 CFR § 1024.17 (RESPA § 10 Escrow Rules)',
      refundDemandLetterText,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  auditMortgage,
  computePointsNPV,
  simulateArmShock,
  generateFCRALetter,
  auditEscrow,
  FHFA_2026_COUNTY_LIMITS,
  FHFA_2026_BASELINE_LIMIT,
  FHFA_2026_CEILING_LIMIT,
};
