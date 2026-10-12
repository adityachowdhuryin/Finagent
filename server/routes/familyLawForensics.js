// server/routes/familyLawForensics.js
// Family Law, Divorce & Forensic Asset Discovery (/divorce)
// AI Forensic Statement Audit, Equitable Marital Asset Division, and QDRO Retirement Splitter

const crypto = require('crypto');

let familyLawCases = [
  {
    caseId: 'matter_8892',
    caseTitle: 'Vance v. Vance (Matrimonial Dissolution)',
    courtJurisdiction: 'Superior Court of California / Family Division (or Family Court, Mumbai)',
    market: 'US',
    filingDate: '2026-04-12',
    caseStage: 'EVIDENTIARY_DISCOVERY',
    spouseA: { name: 'David Vance', income: 420000, representation: 'Morrison & Foerster LLP' },
    spouseB: { name: 'Claire Vance', income: 110000, representation: 'Henschel Family Law' },
    grossMaritalEstate: 5850000.00,
    forensicAuditStatus: 'ANOMALIES_DETECTED',
    anomaliesFoundCount: 4,
    anomaliesTotalValue: 642000.00,
    assets: [
      { id: 'ast_01', type: 'Real Estate', name: 'Primary Residence (Palo Alto)', grossValue: 2800000, debt: 850000, netEquity: 1950000, taxDiscountPct: 0, maritalPortionPct: 100 },
      { id: 'ast_02', type: 'Retirement (401k)', name: 'Spouse A Employer 401(k)', grossValue: 1200000, debt: 0, netEquity: 1200000, taxDiscountPct: 24, maritalPortionPct: 100 }, // 24% deferred tax
      { id: 'ast_03', type: 'Brokerage (Taxable)', name: 'Charles Schwab Joint Account', grossValue: 1150000, debt: 0, netEquity: 1150000, taxDiscountPct: 15, maritalPortionPct: 100 },
      { id: 'ast_04', type: 'Unvested RSUs', name: 'Spouse A Tech Company RSUs', grossValue: 700000, debt: 0, netEquity: 700000, taxDiscountPct: 37, maritalPortionPct: 65 }, // Nelson/Hug coverture fraction
    ],
    forensicFlags: [
      { id: 'flg_01', severity: 'HIGH', category: 'Undisclosed Crypto Wallet', amount: 285000, date: '2026-01-14', description: 'Repeated $45k outbound wires from joint checking to Kraken and self-custody Ethereum wallet 0x71a...9b', status: 'UNEXPLAINED' },
      { id: 'flg_02', severity: 'MEDIUM', category: 'Pre-Separation Cash Dissipation', amount: 140000, date: '2025-11-20', description: 'Abnormal cash withdrawals totaling $140,000 over 6 weeks preceding formal notice of separation', status: 'FLAGGED_FOR_HEARING' },
      { id: 'flg_03', severity: 'HIGH', category: 'Secret Entity Capital Contribution', amount: 180000, date: '2026-02-05', description: 'Wire to Nevada LLC registered under business partner with no recorded spousal consent', status: 'SUBPOENA_RECOMMENDED' },
      { id: 'flg_04', severity: 'LOW', category: 'Delayed Bonus Payment', amount: 37000, date: '2026-03-30', description: 'Deferred compensation bonus scheduled for distribution post-filing', status: 'INCLUDED_IN_ESTATE' }
    ]
  }
];

function getFamilyLawDashboard(req, res) {
  const isIN = req.query.market === 'IN';
  const activeCase = familyLawCases[0];

  res.json({
    success: true,
    data: {
      activeCase,
      market: isIN ? 'IN' : 'US',
      currency: isIN ? 'INR' : 'USD',
      currencySymbol: isIN ? '₹' : '$',
      statutoryFramework: isIN
        ? 'Section 24/25 Hindu Marriage Act & Special Marriage Act (Maintenance & Alimony)'
        : 'Uniform Dissolution of Marriage Act & ERISA QDRO Standards (26 U.S.C. § 414(p))',
    }
  });
}

function analyzeForensicStatements(req, res) {
  const { caseId, filesCount = 12 } = req.body;
  const currentCase = familyLawCases[0];

  res.json({
    success: true,
    caseId: currentCase.caseId,
    statementsAnalyzed: filesCount,
    transactionsScanned: 1840,
    anomaliesFound: currentCase.forensicFlags,
    totalUndisclosedDetected: currentCase.anomaliesTotalValue,
    forensicAuditorSummary: 'AI analysis identified 4 distinct diversion patterns totaling $642,000. Recommends formal subpoena for self-custody wallet transactions and corporate bank accounts for Nevada entity.',
    auditConfidenceScore: '96.4%'
  });
}

function calculateEquitableDistribution(req, res) {
  const { spouseASplitPct = 50, applyTaxDiscount = true } = req.body;
  const currentCase = familyLawCases[0];
  const splitA = Number(spouseASplitPct) / 100;
  const splitB = 1 - splitA;

  let totalGross = 0;
  let totalTaxAdjustedValue = 0;

  const distributionBreakdown = currentCase.assets.map(asset => {
    totalGross += asset.netEquity;
    const taxRate = applyTaxDiscount ? (asset.taxDiscountPct / 100) : 0;
    const afterTaxValue = asset.netEquity * (1 - taxRate);
    totalTaxAdjustedValue += afterTaxValue;

    return {
      name: asset.name,
      type: asset.type,
      grossValue: asset.netEquity,
      deferredTaxDiscount: `${asset.taxDiscountPct}%`,
      afterTaxPurchasingPower: Math.round(afterTaxValue),
      allocatedToSpouseA: Math.round(afterTaxValue * splitA),
      allocatedToSpouseB: Math.round(afterTaxValue * splitB)
    };
  });

  res.json({
    success: true,
    estateGrossEquity: Math.round(totalGross),
    estateTaxAdjustedEquity: Math.round(totalTaxAdjustedValue),
    splitRatio: `${Math.round(splitA * 100)}% Spouse A / ${Math.round(splitB * 100)}% Spouse B`,
    taxDiscountApplied: applyTaxDiscount,
    spouseAAfterTaxTotal: Math.round(totalTaxAdjustedValue * splitA),
    spouseBAfterTaxTotal: Math.round(totalTaxAdjustedValue * splitB),
    equalizationPaymentDue: Math.abs(Math.round((totalTaxAdjustedValue * splitA) - (totalTaxAdjustedValue * splitB))),
    distributionBreakdown
  });
}

function modelQDRO(req, res) {
  const { retirementBalance = 1200000, awardPct = 50, covertureFraction = 1.0 } = req.body;
  const awardAmount = (retirementBalance * (awardPct / 100)) * covertureFraction;

  res.json({
    success: true,
    qdroModel: {
      planType: 'Qualified Defined Contribution Plan (401k)',
      statutoryCitation: '26 U.S.C. § 414(p) & ERISA § 206(d)(3)',
      alternatePayeeAward: Math.round(awardAmount),
      rolloverVehicle: 'Direct Alternate Payee Traditional IRA Rollover',
      earlyWithdrawalPenaltyExempt: true, // QDRO distributions exempt from 10% penalty
      mandatoryWithholding: '0% if direct trustee-to-trustee transfer executed',
      qdroLegalClauses: [
        'Payment shall be made directly to Alternate Payee as an eligible rollover distribution without imposition of IRC Section 72(t) early withdrawal penalty.',
        'Alternate Payee shall receive proportionate share of market gains and losses from date of separation to date of segregation.',
        'Plan Administrator shall segregate funds into separate sub-account upon receipt of domestic relations order.'
      ]
    }
  });
}

function generateCourtAffidavit(req, res) {
  const currentCase = familyLawCases[0];
  const affidavitId = `affidavit_${crypto.randomBytes(4).toString('hex')}`;

  res.json({
    success: true,
    affidavitId,
    title: 'Court-Admissible Statement of Net Worth & Forensic Asset Declaration',
    courtMatter: currentCase.caseTitle,
    notarizationStatus: 'READY_FOR_EXECUTION',
    forensicAuditAnnexed: true,
    anomaliesAnnexureCount: currentCase.anomaliesFoundCount,
    certifiedTimestamp: new Date().toISOString(),
    downloadUrl: `/api/family-law/affidavit-download?id=${affidavitId}`
  });
}

module.exports = {
  getFamilyLawDashboard,
  analyzeForensicStatements,
  calculateEquitableDistribution,
  modelQDRO,
  generateCourtAffidavit
};
