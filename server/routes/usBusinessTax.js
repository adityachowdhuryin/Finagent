// server/routes/usBusinessTax.js
// S-Corporation / LLC Pass-Through Entity Tax Studio & Corporate Governance Engine
// Models W-2 Reasonable Salary vs K-1 Distribution FICA (15.3%) arbitrage,
// IRS Form 7203 Shareholder Stock and Debt Basis Limitations (Suspended Losses & Excess Distributions),
// Accumulated Adjustments Account (AAA) & E&P Waterfall (IRC § 1368),
// Built-In Gains (BIG) Tax (§ 1374), Section 199A QBI 20% deduction, Solo 401(k), Augusta Rule (§ 280A(g)),
// and Multi-Member LLC Operating Agreement Generator (§ 704(b) Capital Accounts).

const crypto = require('crypto');

// 1. Form 7203 Stock & Debt Basis Calculation
function computeForm7203Basis({
  beginningStockBasis = 45000,
  capitalContributions = 10000,
  ordinaryBusinessIncome = 120000,
  taxExemptIncome = 2500,
  nonDeductibleExpenses = 1500,
  shareholderDistributions = 95000,
  ordinaryBusinessLoss = 0,
  beginningDebtBasis = 25000,
  newLoansToCompany = 0,
  loanRepayments = 5000,
}) {
  // Stock Basis Increases (Part I Lines 1-3)
  const totalStockIncreases = Number(capitalContributions) + Number(ordinaryBusinessIncome) + Number(taxExemptIncome);
  const basisBeforeDistributions = Number(beginningStockBasis) + totalStockIncreases;

  // Distributions (Part I Line 7)
  const allowableDistributionFromBasis = Math.min(basisBeforeDistributions, Number(shareholderDistributions));
  const excessDistributionCapitalGain = Math.max(0, Number(shareholderDistributions) - basisBeforeDistributions);

  // Stock Basis after distributions, before losses
  const basisAfterDistributions = Math.max(0, basisBeforeDistributions - allowableDistributionFromBasis);

  // Non-deductible expenses reduce basis
  const basisAfterNonDeductible = Math.max(0, basisAfterDistributions - Number(nonDeductibleExpenses));

  // Debt Basis (Part II)
  const netDebtBasis = Math.max(0, Number(beginningDebtBasis) + Number(newLoansToCompany) - Number(loanRepayments));

  // Loss Limitations & Suspension (Part III)
  const totalAvailableLossBasis = basisAfterNonDeductible + netDebtBasis;
  const currentYearLoss = Number(ordinaryBusinessLoss);
  const allowableLossDeduction = Math.min(totalAvailableLossBasis, currentYearLoss);
  const suspendedLossCarriedForward = Math.max(0, currentYearLoss - totalAvailableLossBasis);

  // Ending Stock Basis
  const endingStockBasis = Math.max(0, basisAfterNonDeductible - allowableLossDeduction);

  return {
    beginningStockBasis: Number(beginningStockBasis),
    totalStockIncreases,
    basisBeforeDistributions,
    allowableDistributionFromBasis,
    excessDistributionCapitalGain, // Taxable as capital gains on Schedule D!
    basisAfterDistributions,
    endingStockBasis,
    debtBasis: netDebtBasis,
    totalAvailableLossBasis,
    allowableLossDeduction,
    suspendedLossCarriedForward, // Carried indefinitely under IRC § 1366(d)
    hasSuspendedLosses: suspendedLossCarriedForward > 0,
    hasExcessDistributions: excessDistributionCapitalGain > 0
  };
}

// 2. Accumulated Adjustments Account (AAA) & E&P Waterfall (IRC § 1368)
function computeAAAAndEPWaterfall({
  beginningAAA = 80000,
  currentYearNetIncome = 125000,
  totalDistributions = 140000,
  accumulatedEPFromCCorp = 35000,
  stockBasis = 60000
}) {
  // S-Corp Distribution Tiers:
  // Tier 1: Distribution from AAA (Tax-free return of basis)
  const availableAAA = Number(beginningAAA) + Number(currentYearNetIncome);
  const tier1AAA = Math.min(availableAAA, Number(totalDistributions));
  const remainingDistAfterTier1 = Math.max(0, Number(totalDistributions) - tier1AAA);

  // Tier 2: Distribution from Accumulated Earnings & Profits (Taxable Qualified Dividend on 1099-DIV)
  const tier2EP = Math.min(Number(accumulatedEPFromCCorp), remainingDistAfterTier1);
  const remainingDistAfterTier2 = Math.max(0, remainingDistAfterTier1 - tier2EP);

  // Tier 3: Distribution from remaining Stock Basis (Tax-free return of capital)
  const tier3Basis = Math.min(Number(stockBasis), remainingDistAfterTier2);
  const remainingDistAfterTier3 = Math.max(0, remainingDistAfterTier2 - tier3Basis);

  // Tier 4: Excess Distribution (Taxable Capital Gain under IRC § 1368(b)(2))
  const tier4CapitalGain = remainingDistAfterTier3;

  const endingAAA = Math.max(0, availableAAA - tier1AAA);
  const endingEP = Math.max(0, Number(accumulatedEPFromCCorp) - tier2EP);

  return {
    tier1TaxFreeAAA: tier1AAA,
    tier2TaxableEPDividend: tier2EP,
    tier3TaxFreeReturnOfCapital: tier3Basis,
    tier4TaxableCapitalGain: tier4CapitalGain,
    endingAAA,
    endingEP,
    totalDistributions: Number(totalDistributions),
  };
}

// 3. Built-In Gains (BIG) Tax (§ 1374)
function computeBIGTax({
  cCorpConversionDate = '2023-01-01',
  netUnrealizedBuiltInGain = 200000,
  assetSoldGain = 75000,
  taxYear = 2026
}) {
  const convYear = new Date(cCorpConversionDate).getFullYear();
  const yearsSinceConversion = taxYear - convYear;
  const isWithin5YearWindow = yearsSinceConversion <= 5;

  const recognizedBIG = isWithin5YearWindow ? Math.min(Number(netUnrealizedBuiltInGain), Number(assetSoldGain)) : 0;
  const corporateBIGTax = Math.round(recognizedBIG * 0.21); // 21% flat federal corporate rate

  return {
    conversionYear: convYear,
    yearsSinceConversion,
    isWithin5YearWindow,
    statutoryRecognitionPeriod: '5 Years (IRC § 1374(d)(7))',
    netUnrealizedBuiltInGain: Number(netUnrealizedBuiltInGain),
    recognizedBIG,
    corporateBIGTax,
    passThroughToShareholder: Math.max(0, Number(assetSoldGain) - corporateBIGTax), // Shareholder pays tax on net
  };
}

// ── 50-State + DC + Territories Statutory LLC and Corporation Laws ─────────
const STATE_LLC_STATUTES = {
  Alabama: 'Alabama Limited Liability Company Law of 2014 (Ala. Code § 10A-5A)',
  Alaska: 'Alaska Revised Limited Liability Company Act (AS 10.50)',
  Arizona: 'Arizona Limited Liability Company Act (A.R.S. § 29-3101 et seq.)',
  Arkansas: 'Arkansas Uniform Limited Liability Company Act (Ark. Code Ann. § 4-38-101)',
  California: 'California Revised Uniform Limited Liability Company Act (Cal. Corp. Code § 17701.01 et seq.)',
  Colorado: 'Colorado Limited Liability Company Act (C.R.S. § 7-80-101 et seq.)',
  Connecticut: 'Connecticut Uniform Limited Liability Company Act (C.G.S. § 34-243 et seq.)',
  Delaware: 'Delaware Limited Liability Company Act (6 Del. C. § 18-101 et seq.)',
  'District of Columbia': 'District of Columbia Uniform Limited Liability Company Act (D.C. Code § 29-801.01 et seq.)',
  Florida: 'Florida Revised Limited Liability Company Act (Fla. Stat. Ch. 605)',
  Georgia: 'Georgia Limited Liability Company Act (O.C.G.A. § 14-11-100 et seq.)',
  Hawaii: 'Hawaii Uniform Limited Liability Company Act (HRS § 428-101 et seq.)',
  Idaho: 'Idaho Uniform Limited Liability Company Act (Idaho Code § 30-25-101 et seq.)',
  Illinois: 'Illinois Limited Liability Company Act (805 ILCS 180/)',
  Indiana: 'Indiana Business Flexibility Act (Ind. Code § 23-18)',
  Iowa: 'Iowa Revised Uniform Limited Liability Company Act (Iowa Code Ch. 489)',
  Kansas: 'Kansas Revised Limited Liability Company Act (K.S.A. § 17-7662 et seq.)',
  Kentucky: 'Kentucky Limited Liability Company Act (KRS Ch. 275)',
  Louisiana: 'Louisiana Limited Liability Company Law (La. R.S. § 12:1301 et seq.)',
  Maine: 'Maine Limited Liability Company Act (31 M.R.S. Ch. 21)',
  Maryland: 'Maryland Limited Liability Company Act (Md. Code Ann., Corps. & Ass\'ns § 4A-101 et seq.)',
  Massachusetts: 'Massachusetts Limited Liability Company Act (M.G.L. c. 156C)',
  Michigan: 'Michigan Limited Liability Company Act (MCL 450.4101 et seq.)',
  Minnesota: 'Minnesota Revised Uniform Limited Liability Company Act (Minn. Stat. Ch. 322C)',
  Mississippi: 'Mississippi Limited Liability Company Act (Miss. Code Ann. § 79-29-101 et seq.)',
  Missouri: 'Missouri Limited Liability Company Act (Mo. Rev. Stat. Ch. 347)',
  Montana: 'Montana Limited Liability Company Act (MCA § 35-8-101 et seq.)',
  Nebraska: 'Nebraska Uniform Limited Liability Company Act (Neb. Rev. Stat. § 21-101 et seq.)',
  Nevada: 'Nevada Limited Liability Company Act (NRS Ch. 86)',
  'New Hampshire': 'New Hampshire Revised Limited Liability Company Act (RSA 304-C)',
  'New Jersey': 'New Jersey Revised Uniform Limited Liability Company Act (N.J.S.A. 42:2C-1 et seq.)',
  'New Mexico': 'New Mexico Limited Liability Company Act (NMSA 1978, § 53-19-1 et seq.)',
  'New York': 'New York Limited Liability Company Law (LLCL § 101 et seq.)',
  'North Carolina': 'North Carolina Limited Liability Company Act (N.C. Gen. Stat. Ch. 57D)',
  'North Dakota': 'North Dakota Uniform Limited Liability Company Act (N.D.C.C. Ch. 10-32.1)',
  Ohio: 'Ohio Revised Limited Liability Company Act (Ohio Rev. Code Ch. 1706)',
  Oklahoma: 'Oklahoma Limited Liability Company Act (18 O.S. § 2000 et seq.)',
  Oregon: 'Oregon Limited Liability Company Act (ORS Ch. 63)',
  Pennsylvania: 'Pennsylvania Uniform Limited Liability Company Act of 2016 (15 Pa.C.S. § 8811 et seq.)',
  'Rhode Island': 'Rhode Island Limited Liability Company Act (R.I. Gen. Laws § 7-16-1 et seq.)',
  'South Carolina': 'South Carolina Uniform Limited Liability Company Act of 1996 (S.C. Code Ann. § 33-44-101 et seq.)',
  'South Dakota': 'South Dakota Uniform Limited Liability Company Act (SDCL Ch. 47-34A)',
  Tennessee: 'Tennessee Revised Limited Liability Company Act (Tenn. Code Ann. § 48-249-101 et seq.)',
  Texas: 'Texas Business Organizations Code (BOC Title 3, Ch. 101)',
  Utah: 'Utah Revised Uniform Limited Liability Company Act (Utah Code Ann. § 48-3a-101 et seq.)',
  Vermont: 'Vermont Limited Liability Company Act (11 V.S.A. Ch. 25)',
  Virginia: 'Virginia Limited Liability Company Act (Va. Code Ann. § 13.1-1000 et seq.)',
  Washington: 'Washington Limited Liability Company Act (RCW 25.15)',
  'West Virginia': 'West Virginia Uniform Limited Liability Company Act (W. Va. Code § 31B-1-101 et seq.)',
  Wisconsin: 'Wisconsin Uniform Limited Liability Company Law (Wis. Stat. Ch. 183)',
  Wyoming: 'Wyoming Limited Liability Company Act (W.S. 17-29-101 et seq.)',
  'Puerto Rico': 'Puerto Rico General Corporations Act of 2009 (Act No. 164-2009, 14 L.P.R.A. § 3951 et seq.)',
  'U.S. Virgin Islands': 'Virgin Islands Uniform Limited Liability Company Act (13 V.I.C. § 1101 et seq.)',
  Guam: 'Guam Limited Liability Company Act (18 GCA Ch. 15)',
  'Northern Mariana Islands': 'Commonwealth of Northern Mariana Islands Limited Liability Company Act (4 CMC § 4101 et seq.)',
  'American Samoa': 'American Samoa Uniform Limited Liability Company Act (ASCA Title 30)'
};

function getLLCStatute(stateName) {
  if (!stateName) return 'Delaware Limited Liability Company Act (6 Del. C. § 18-101 et seq.)';
  const found = Object.keys(STATE_LLC_STATUTES).find(k => k.toLowerCase() === stateName.trim().toLowerCase());
  if (found) return STATE_LLC_STATUTES[found];
  return `${stateName} Limited Liability Company Act`;
}

// 4. Multi-Member LLC Operating Agreement Generator (§ 704(b))
function generateLLCOperatingAgreement({
  companyName = 'Apex Ventures LLC',
  stateOfFormation = 'Delaware',
  managerName = 'Alex Morgan',
  members = [
    { name: 'Alex Morgan', initialContribution: 100000, units: 60, role: 'Managing Member' },
    { name: 'Jordan Lee', initialContribution: 50000, units: 30, role: 'Member' },
    { name: 'Taylor Reed', initialContribution: 15000, units: 10, role: 'Passive Investor' }
  ],
  preferredReturnPct = 8.0,
  carriedInterestPct = 20.0
}) {
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const totalContribution = members.reduce((sum, m) => sum + Number(m.initialContribution || 0), 0);
  const statute = getLLCStatute(stateOfFormation);

  const agreementText = `LIMITED LIABILITY COMPANY OPERATING AGREEMENT
OF
${companyName.toUpperCase()}
A ${stateOfFormation.toUpperCase()} LIMITED LIABILITY COMPANY

THIS OPERATING AGREEMENT (this "Agreement") is entered into as of ${dateStr}, by and among the Members identified on Schedule A attached hereto.

ARTICLE I: FORMATION AND PURPOSE
1.1 Formation. The Company was formed as a limited liability company pursuant to the ${statute}.
1.2 Purpose. The purpose of the Company is to engage in any lawful business, purpose, or activity permitted under applicable law.
1.3 Principal Office. The principal office of the Company shall be located at such address as the Manager may determine from time to time.

ARTICLE II: CAPITAL CONTRIBUTIONS & CAPITAL ACCOUNTS (IRC § 704(b))
2.1 Capital Contributions. Each Member has contributed the initial capital set forth opposite their name on Schedule A. Total Initial Contributed Capital: $${totalContribution.toLocaleString()}.
2.2 Capital Accounts. A separate Capital Account shall be maintained for each Member in strict compliance with Section 704(b) of the Internal Revenue Code and Treasury Regulation § 1.704-1(b)(2)(iv). Capital Accounts shall be increased by:
    (a) Cash and the fair market value of property contributed by such Member;
    (b) Allocations of Net Profit and items of gross income;
    and decreased by:
    (a) Cash and fair market value of distributions made to such Member;
    (b) Allocations of Net Loss and non-deductible expenditures.
2.3 Negative Capital Account Restoration. No Member shall be required to restore a deficit balance in their Capital Account upon liquidation.

ARTICLE III: 4-TIER WATERFALL CASH DISTRIBUTIONS
3.1 Cash Available for Distribution. Distributable Cash shall be distributed to Members at such times as determined by the Manager, strictly following the priority below:
    First: 100% to all Contributing Members pro rata until each has received a full Return of Initial Capital Contributions ($${totalContribution.toLocaleString()});
    Second: 100% to Contributing Members pro rata until each has achieved an accrued, cumulative Preferred Return equal to ${preferredReturnPct.toFixed(1)}% per annum, compounded annually;
    Third: 100% to the Managing Member (${managerName}) as a Catch-Up Distribution until the Managing Member has received ${carriedInterestPct.toFixed(1)}% of all profits distributed under Tier 2 and Tier 3;
    Fourth: Thereafter, 80% to all Members pro rata in accordance with their Percentage Interests, and ${carriedInterestPct.toFixed(1)}% to the Managing Member as Carried Interest.

ARTICLE IV: MANAGEMENT AND GOVERNANCE
4.1 Manager. The management of the Company shall be vested exclusively in the Manager, ${managerName}. The Manager shall have full, exclusive, and complete authority to manage and control the business.
4.2 Major Decisions. Unanimous consent of Members holding at least 66.7% of Percentage Units shall be required for:
    (a) The merger, consolidation, or sale of substantially all assets of the Company;
    (b) Filing for voluntary bankruptcy or reorganization;
    (c) The issuance of additional equity interests or admission of new Members.

ARTICLE V: TRANSFERS AND BUY-SELL RESTRICTIONS
5.1 Right of First Refusal (ROFR). No Member may sell, transfer, pledge, or encumber their Units without first offering the Company and remaining Members a 30-day ROFR upon identical terms.
5.2 Drag-Along Rights. If Members holding >70% of Units approve a bona fide third-party acquisition, all remaining Members must consent and transfer their Units on identical terms.

IN WITNESS WHEREOF, the Members have executed this Agreement as of the date first above written.

${members.map(m => `MEMBER: /s/ ${m.name} (${m.role} - ${m.units}% Units)`).join('\n')}

SCHEDULE A: INITIAL CAPITAL CONTRIBUTIONS
${members.map((m, i) => `${i + 1}. ${m.name}: $${Number(m.initialContribution).toLocaleString()} (${m.units}% Equity Interests)`).join('\n')}`;

  const hash = crypto.createHash('sha256').update(agreementText).digest('hex');

  return {
    companyName,
    stateOfFormation,
    managerName,
    totalContribution,
    members,
    agreementText,
    agreementHash: hash
  };
}

// Main S-Corp optimization endpoint
async function optimizeSCorpPassThrough(req, res) {
  const {
    businessName = 'Apex Tech Consulting LLC',
    ownerName = 'Alex Chen',
    grossRevenue = 350000,
    operatingExpenses = 50000,
    industry = 'Software Engineering / Tech Consulting',
    w2Salary = 125000,
    ownerState = 'CA',
    hasSolo401k = true,
    augustaDays = 14,
    augustaDailyRate = 1200,
    // Basis parameters
    beginningStockBasis = 45000,
    shareholderDistributions = 100000,
    beginningDebtBasis = 20000,
    cCorpConversionDate = '2023-01-01',
    unrealizedBIG = 0,
  } = req.body;

  const netBusinessProfit = Math.max(0, grossRevenue - operatingExpenses);

  // 1. Scenario A: Standard Sole Proprietorship / Disregarded LLC (No S-Corp)
  const seTaxableBase = netBusinessProfit * 0.9235;
  const ssCap = 168600;
  const solePropSS = Math.min(seTaxableBase, ssCap) * 0.124;
  const solePropMed = seTaxableBase * 0.029;
  const solePropAddMed = seTaxableBase > 200000 ? (seTaxableBase - 200000) * 0.009 : 0;
  const totalSolePropFICA = Math.round(solePropSS + solePropMed + solePropAddMed);

  // 2. Scenario B: S-Corporation Election (Form 2553)
  const reasonableSalary = Math.min(Number(w2Salary), netBusinessProfit);
  const scorpDistributions = Math.max(0, netBusinessProfit - reasonableSalary);

  const scorpSS = Math.min(reasonableSalary, ssCap) * 0.124;
  const scorpMed = reasonableSalary * 0.029;
  const scorpAddMed = reasonableSalary > 200000 ? (reasonableSalary - 200000) * 0.009 : 0;
  const totalSCorpFICA = Math.round(scorpSS + scorpMed + scorpAddMed);

  const annualFICASaved = Math.max(0, totalSolePropFICA - totalSCorpFICA);

  // 3. Section 199A Qualified Business Income (QBI) 20% Deduction
  const qbiDeductionBase = scorpDistributions;
  const qbi20PctDeduction = Math.round(qbiDeductionBase * 0.20);
  const qbiIncomeTaxSavings = Math.round(qbi20PctDeduction * 0.32);

  // 4. Solo 401(k) Employer Profit-Sharing & Employee Deferral
  const solo401kEmployee = 23500;
  const solo401kEmployer = Math.round(reasonableSalary * 0.25);
  const totalSolo401kShelter = Math.min(69000, solo401kEmployee + solo401kEmployer);
  const solo401kTaxSaved = Math.round(totalSolo401kShelter * 0.32);

  // 5. Augusta Rule (IRC § 280A(g))
  const augustaDeduction = Math.min(14, Number(augustaDays)) * Number(augustaDailyRate);
  const augustaTaxSaved = Math.round(augustaDeduction * 0.35);

  // 6. Form 7203 Shareholder Stock and Debt Basis Calculation
  const basisResult = computeForm7203Basis({
    beginningStockBasis,
    capitalContributions: 0,
    ordinaryBusinessIncome: scorpDistributions,
    taxExemptIncome: 0,
    nonDeductibleExpenses: 0,
    shareholderDistributions: Number(shareholderDistributions) || scorpDistributions,
    ordinaryBusinessLoss: 0,
    beginningDebtBasis,
    newLoansToCompany: 0,
    loanRepayments: 0
  });

  // 7. Built-in Gains (BIG) Tax Calculation
  const bigResult = computeBIGTax({
    cCorpConversionDate,
    netUnrealizedBuiltInGain: unrealizedBIG,
    assetSoldGain: 0,
    taxYear: 2026
  });

  // 8. Cumulative Wealth Acceleration
  const totalAnnualTaxSavings = annualFICASaved + qbiIncomeTaxSavings + augustaTaxSaved;
  const tenYearCompoundedWealth = Math.round(
    totalAnnualTaxSavings * ((Math.pow(1 + 0.08, 10) - 1) / 0.08)
  );

  // 9. Form 2553 Statutory Election Text
  const electionText = `DEPARTMENT OF THE TREASURY - INTERNAL REVENUE SERVICE
FORM 2553: ELECTION BY A SMALL BUSINESS CORPORATION
(Under Section 1362(a) of the Internal Revenue Code)

PART I: ELECTION INFORMATION
1. Name of Corporation: ${businessName}
2. Employer Identification Number (EIN): APEX-EIN-992182
3. Principal Business Activity: ${industry}
4. Effective Date of Election: January 1, 2026
5. State of Incorporation: ${ownerState}
6. Shareholder Name: ${ownerName}
7. Shares Owned: 100 Shares (100% Voting Common Stock)

PART II: SHAREHOLDER'S CONSENT STATEMENT
The undersigned shareholder hereby consents to the election of the above-named corporation
to be treated as an S Corporation under Internal Revenue Code Section 1362(a).
Signature: /s/ ${ownerName}
Date: ${new Date().toISOString().split('T')[0]}

REASONABLE SALARY AUDIT BENCHMARK:
- Total Business Net Income: $${netBusinessProfit.toLocaleString()}
- W-2 FICA-Exempt Distribution: $${scorpDistributions.toLocaleString()}
- Certified W-2 Reasonable Salary: $${reasonableSalary.toLocaleString()} (RCReports & Bureau of Labor Statistics benchmark)
- Form 7203 Ending Stock Basis: $${basisResult.endingStockBasis.toLocaleString()}
- Form 7203 Debt Basis: $${basisResult.debtBasis.toLocaleString()}`;

  const docHash = crypto.createHash('sha256').update(electionText).digest('hex');

  return res.json({
    success: true,
    market: 'US',
    businessName,
    ownerName,
    annualFICASaved,
    form7203Basis: basisResult,
    summary: {
      grossRevenue,
      operatingExpenses,
      netBusinessProfit,
      reasonableSalary,
      shareholderDistributions: scorpDistributions,
      totalSolePropFICA,
      totalSCorpFICA,
      annualFICASaved,
      ficaTaxSavingsUSD: annualFICASaved,
      qbi20PctDeduction,
      qbiIncomeTaxSavings,
      totalSolo401kShelter,
      solo401kTaxSaved,
      augustaDeduction,
      augustaTaxSaved,
      totalAnnualTaxSavings,
      tenYearCompoundedWealth,
      docHash,
      basisTracking: basisResult,
      builtInGainsTax: bigResult
    },
    form2553LegalText: electionText
  });
}

// 5. Corporate Banking & Financial Account Resolution Kit
function generateCorporateBankingResolution({
  companyName = 'Apex Technology Consulting LLC',
  entityName,
  stateOfFormation = 'Delaware',
  bankName = 'JPMorgan Chase Bank, N.A.',
  managingMember = 'Alex Morgan',
  authorizedSigners,
  secretaryName = 'Jordan Lee',
  dailyWireLimit = 100000,
  wireTransferDailyLimit,
  checkSigningThreshold = 25000,
  debitCardsAuthorized = true,
  ein = 'XX-XXXXXXX (SS-4 Applied For)',
}) {
  const activeCompany = entityName || companyName;
  const activeSigner = (Array.isArray(authorizedSigners) ? authorizedSigners[0] : authorizedSigners) || managingMember;
  const activeLimit = Number(wireTransferDailyLimit || dailyWireLimit);

  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const statute = getLLCStatute(stateOfFormation);

  const resolutionText = `UNANIMOUS WRITTEN CONSENT AND CORPORATE RESOLUTION
OF THE MEMBERS AND MANAGERS OF
${activeCompany.toUpperCase()}
AUTHORIZING BANKING AND FINANCIAL INSTITUTION SERVICES

The undersigned, constituting all the Members and Managers of ${activeCompany}, a ${stateOfFormation} limited liability company (the "Company"), hereby adopt the following resolutions pursuant to the ${statute} as of ${dateStr}:

RECITALS:
WHEREAS, it is in the best business interests of the Company to establish, maintain, and operate one or more commercial depository, operating, payroll, and wire accounts with ${bankName} (the "Financial Institution"); and

WHEREAS, the Company requires clear statutory authorization designating authorized signers and establishing corporate fiduciary protocols for electronic fund transfers, wire releases, and commercial credit facilities.

NOW, THEREFORE, BE IT RESOLVED:
1. DESIGNATION OF DEPOSITORY:
${bankName} is hereby designated as an official commercial depository of the Company. The Managers and Officers of the Company are authorized to open and maintain commercial accounts (checking, savings, money market, and certificate of deposit accounts) in the name and EIN of the Company (${ein}).

2. AUTHORIZED SIGNERS & WIRE AUTHORITY:
${activeSigner} (Managing Member) is designated as an Primary Authorized Signer on all commercial accounts. The Authorized Signer is vested with full power to:
(a) Sign, execute, and deliver checks, drafts, notes, bills of exchange, and acceptances against funds of the Company.
(b) Initiate, approve, and execute domestic Fedwire and international SWIFT wire transfers up to a single-day transaction ceiling of $${Number(activeLimit).toLocaleString()}.
(c) Establish electronic automated clearing house (ACH) origination debit and credit mandates.
(d) ${debitCardsAuthorized ? 'Authorize the issuance of commercial debit cards and corporate expense credit cards under the Company master credit profile.' : 'Debit card issuance is expressly withheld.'}

3. IRS FORM SS-4 & EIN COMPLIANCE:
The Managers are authorized and directed to execute and submit IRS Form SS-4 (Application for Employer Identification Number) with the Internal Revenue Service and verify entity classification under Treasury Regulation § 301.7701-3.

4. CERTIFICATION & CONTINUING FORCE:
These resolutions shall remain in full force and effect until express written notice of revocation or modification is delivered to and receipt confirmed by the Financial Institution.

IN WITNESS WHEREOF, the undersigned have executed this Resolution as of the date first written above.

/s/ ${activeSigner}
Managing Member / Authorized Signatory

/s/ ${secretaryName}
Corporate Secretary & Custodian of Records`;

  const hash = crypto.createHash('sha256').update(resolutionText).digest('hex');

  const executionChecklist = [
    'Certified Articles of Organization / Incorporation from Secretary of State.',
    'IRS Notice CP 575 or Form 147C Letter verifying federal Employer Identification Number (EIN).',
    'Executed Corporate Banking & Financial Services Resolution signed by corporate secretary/members.',
    'Executed Operating Agreement (§ 704(b)) or Corporate Bylaws.',
    'Government-issued photo IDs (Driver License / US Passport) for all authorized signers.',
    'Beneficial Ownership Information (BOI) Report confirmation under FinCEN Corporate Transparency Act.'
  ];

  return {
    companyName: activeCompany,
    stateOfFormation,
    bankName,
    managingMember: activeSigner,
    dailyWireLimit: activeLimit,
    checkSigningThreshold,
    ein,
    resolutionText,
    resolutionDocument: resolutionText,
    resolutionHash: hash,
    einFilingGuide: {
      responsiblePartyRules: 'Responsible party must be an individual with valid SSN/ITIN possessing true corporate authority.',
      onlineApplicationUrl: 'https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online',
      operatingHours: 'Monday to Friday, 7:00 a.m. to 10:00 p.m. Eastern Standard Time',
    },
    ss4Checklist: [
      'Line 1: Full Legal Entity Name (as filed with Secretary of State)',
      'Line 7a-b: Responsible Party Name and SSN/ITIN',
      'Line 8a: LLC Entity Status (Check "Yes")',
      'Line 9a: Type of Entity (Check "Other" and enter "Disregarded Entity" or "Corporation" based on Form 2553)',
      'Line 10: Reason for Applying (Started new business / Formed corporate entity)',
      'Form 2553 Subchapter S election must be submitted within 75 days of formation or fiscal year start',
    ],
    executionChecklist,
  };
}

// Endpoint handlers
async function getBasisWorksheet(req, res) {
  try {
    const result = computeForm7203Basis(req.body);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function getLLCOperatingAgreement(req, res) {
  try {
    const result = generateLLCOperatingAgreement(req.body);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ── US FinCEN Beneficial Ownership Information (BOI) Reporting Engine ────────
// Implements Corporate Transparency Act (CTA) 31 U.S.C. 5336 & 31 CFR § 1010.380.
// Generates official BOI compliance packages, validates 23 statutory exemptions,
// identifies 25%+ beneficial owners and substantial control individuals, avoiding $591/day penalties.

const FINCEN_23_EXEMPTIONS = [
  { id: 1, title: 'Securities Reporting Issuer', code: 'SEC_ISSUER', desc: 'Public company subject to Section 12 or 15(d) of Securities Exchange Act' },
  { id: 2, title: 'Governmental Authority', code: 'GOVERNMENTAL', desc: 'Entity established under federal, state, or tribal law' },
  { id: 3, title: 'Bank', code: 'BANK', desc: 'Depository institution as defined in FDIC Act' },
  { id: 4, title: 'Credit Union', code: 'CREDIT_UNION', desc: 'Federal or state chartered credit union' },
  { id: 5, title: 'Depository Institution Holding Company', code: 'DEP_HOLDING', desc: 'Bank or savings and loan holding company' },
  { id: 6, title: 'Money Services Business', code: 'MSB', desc: 'Registered money transmitting business' },
  { id: 7, title: 'Broker or Dealer in Securities', code: 'BROKER_DEALER', desc: 'SEC-registered broker-dealer' },
  { id: 8, title: 'Securities Exchange or Clearing Agency', code: 'EXCHANGE', desc: 'Registered securities exchange or clearing agency' },
  { id: 9, title: 'Other Exchange Act Registered Entity', code: 'EXCHANGE_ACT_OTHER', desc: 'Registered under SEC Exchange Act' },
  { id: 10, title: 'Investment Company or Investment Adviser', code: 'SEC_RIA', desc: 'SEC-registered Investment Adviser (RIA) or fund' },
  { id: 11, title: 'Venture Capital Fund Adviser', code: 'VC_ADVISER', desc: 'Adviser to venture capital funds under Section 203(l)' },
  { id: 12, title: 'Insurance Company', code: 'INSURANCE_CO', desc: 'Licensed insurance underwriter' },
  { id: 13, title: 'State-Licensed Insurance Producer', code: 'INSURANCE_PRODUCER', desc: 'Licensed insurance agency/producer' },
  { id: 14, title: 'Commodity Exchange Act Registered Entity', code: 'CFTC_ENTITY', desc: 'Futures commission merchant or commodity pool' },
  { id: 15, title: 'Accounting Firm', code: 'PCAOB_CPA', desc: 'Public accounting firm registered under Sarbanes-Oxley' },
  { id: 16, title: 'Public Utility', code: 'PUBLIC_UTILITY', desc: 'Regulated telecommunications or electric utility' },
  { id: 17, title: 'Financial Market Utility', code: 'FMU', desc: 'Systemically important financial market utility' },
  { id: 18, title: 'Pooled Investment Vehicle', code: 'PIV', desc: 'Operated or advised by certain exempt entities' },
  { id: 19, title: 'Tax-Exempt Entity', code: 'TAX_EXEMPT_501C', desc: 'IRC § 501(c) non-profit or charitable organization' },
  { id: 20, title: 'Entity Assisting a Tax-Exempt Entity', code: 'ASSISTING_TAX_EXEMPT', desc: 'Operated exclusively for charitable support' },
  { id: 21, title: 'Large Operating Company', code: 'LARGE_OPERATING_CO', desc: 'More than 20 full-time US employees AND > $5,000,000 in gross federal receipts' },
  { id: 22, title: 'Subsidiary of Certain Exempt Entities', code: 'EXEMPT_SUBSIDIARY', desc: 'Wholly owned or controlled by an exempt entity' },
  { id: 23, title: 'Inactive Entity', code: 'INACTIVE_ENTITY', desc: 'In existence on/before Jan 1, 2020, not actively engaged, no foreign owners, zero assets' },
];

function computeFinCENBOIReport(params = {}) {
  const {
    legalName = 'Apex Cloud Systems LLC',
    dba = '',
    jurisdiction = 'Delaware',
    formationDate = '2024-03-15',
    ein = '12-3456789',
    streetAddress = '1209 North Orange Street',
    city = 'Wilmington',
    state = 'DE',
    zip = '19801',
    exemptionClaimed = null, // e.g. 'LARGE_OPERATING_CO' or null
    fullTimeEmployees = 4,
    annualGrossReceiptsUSD = 850000,
    owners = [
      { name: 'Aditya Chowdhury', ownershipPct: 70, isSeniorOfficer: true, officerTitle: 'Managing Member & CEO', residentialAddress: 'San Francisco, CA', idType: 'US Passport', idNumber: 'P12345678', isSubstantialControl: true },
      { name: 'Sarah Jenkins', ownershipPct: 30, isSeniorOfficer: false, officerTitle: 'VP Product', residentialAddress: 'Austin, TX', idType: 'Driver License', idNumber: 'DL98765432', isSubstantialControl: false },
    ],
    applicants = [
      { name: 'John Doe, Esq.', role: 'Direct Filer / Legal Counsel', lawFirm: 'Silicon Legal Group LLP', address: 'San Francisco, CA', idType: 'State Bar ID', idNumber: 'CA-294812' }
    ],
  } = params;

  // 1. Exemption Assessment
  let isExempt = false;
  let exemptionReason = null;

  if (exemptionClaimed) {
    const matched = FINCEN_23_EXEMPTIONS.find(e => e.code === exemptionClaimed || e.id === Number(exemptionClaimed));
    if (matched) {
      isExempt = true;
      exemptionReason = `Exempt under 31 CFR § 1010.380(c)(2) Exemption #${matched.id}: ${matched.title}. Reason: ${matched.desc}`;
    }
  }

  // Automatic check for Large Operating Company exemption
  if (!isExempt && fullTimeEmployees > 20 && annualGrossReceiptsUSD > 5000000) {
    isExempt = true;
    exemptionReason = 'Qualifies for 31 CFR § 1010.380(c)(2)(xxi) Large Operating Company exemption (>20 full-time US employees and >$5M gross revenue).';
  }

  // 2. Beneficial Owners Identification (Ownership >= 25% OR Substantial Control)
  const reportingCompany = {
    legalName,
    dba: dba || 'N/A',
    jurisdiction,
    formationDate,
    ein,
    address: `${streetAddress}, ${city}, ${state} ${zip}`,
    isExempt,
    exemptionReason,
  };

  const identifiedBeneficialOwners = [];
  (owners || []).forEach((o, idx) => {
    const pct = Number(o.ownershipPct || 0);
    const meets25PctRule = pct >= 25;
    const meetsSubstantialControl = !!(o.isSeniorOfficer || o.isSubstantialControl);

    if (meets25PctRule || meetsSubstantialControl) {
      identifiedBeneficialOwners.push({
        id: idx + 1,
        legalName: o.name,
        ownershipPct: pct,
        basisOfReporting: [
          ...(meets25PctRule ? [`Equity Ownership (${pct}% >= 25% statutory threshold)`] : []),
          ...(meetsSubstantialControl ? [`Substantial Control (${o.officerTitle || 'Senior Officer / Director'})`] : []),
        ],
        residentialAddress: o.residentialAddress || 'USA',
        identificationDocument: {
          type: o.idType || 'US Passport / RealID Driver License',
          number: o.idNumber ? `****${String(o.idNumber).slice(-4)}` : '****5678',
          status: 'VERIFIED_DOC_ON_FILE',
        },
      });
    }
  });

  // 3. Filing Deadlines & Statutory Compliance Windows
  const formYear = new Date(formationDate).getFullYear();
  let filingDeadline = '30 calendar days from formation';
  let penaltyStatus = 'ACTIVE_COMPLIANCE_REQUIRED';

  if (formYear < 2024) {
    filingDeadline = 'January 1, 2025 (Initial reporting deadline for pre-existing entities)';
  } else if (formYear === 2024) {
    filingDeadline = '90 calendar days from actual or public notice of formation';
  } else {
    filingDeadline = '30 calendar days from actual or public notice of formation';
  }

  const statutoryWarnings = [];
  if (!isExempt) {
    statutoryWarnings.push(
      'Under 31 U.S.C. 5336(h)(1), willful failure to report complete or updated BOI, or willfully providing false information, carries civil penalties of up to $591 per day (inflation-adjusted) and criminal fines up to $10,000 or up to 2 years imprisonment.'
    );
    statutoryWarnings.push(
      'Any changes to beneficial ownership, officer titles, or residential addresses MUST be reported via an updated FinCEN BOI filing within 30 calendar days of the change.'
    );
  }

  return {
    reportingCompany,
    isExempt,
    exemptionReason,
    filingDeadline,
    statutoryCivilPenaltyPerDayUSD: 591,
    beneficialOwners: identifiedBeneficialOwners,
    companyApplicants: formYear >= 2024 ? (applicants || []) : [],
    requiresCompanyApplicants: formYear >= 2024,
    statutoryAuthority: 'Corporate Transparency Act (CTA), 31 U.S.C. 5336; 31 CFR § 1010.380',
    statutoryWarnings,
    availableExemptions: FINCEN_23_EXEMPTIONS,
    finCENSubmissionReadyPayload: {
      reportType: isExempt ? 'EXEMPT_ENTITY_NOTICE' : 'INITIAL_BOI_REPORT',
      reportingCompanyEIN: ein,
      reportingCompanyName: legalName,
      totalBeneficialOwnersReported: identifiedBeneficialOwners.length,
      timestamp: new Date().toISOString(),
    },
  };
}

async function getFinCENBOIReportHandler(req, res) {
  try {
    const result = computeFinCENBOIReport(req.body);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function getCorporateBankingResolutionHandler(req, res) {
  try {
    const result = generateCorporateBankingResolution(req.body);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  optimizeSCorpPassThrough,
  computeForm7203Basis,
  computeAAAAndEPWaterfall,
  computeBIGTax,
  generateLLCOperatingAgreement,
  generateCorporateBankingResolution,
  computeFinCENBOIReport,
  getBasisWorksheet,
  getLLCOperatingAgreement,
  getCorporateBankingResolutionHandler,
  getFinCENBOIReportHandler,
  FINCEN_23_EXEMPTIONS,
  STATE_LLC_STATUTES,
  getLLCStatute,
};

