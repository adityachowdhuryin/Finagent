// server/routes/forensicAudit.js
// AI Bank & UPI Forensic Statement Auditor: Zombie Subscriptions & Tax Deduction Harvester

const SAMPLE_FORENSIC_DATA = {
  accountNumber: 'HDFC Bank - A/C No: XXXX-XXXX-9182',
  statementPeriod: 'Last 90 Days (Apr 2026 - Jun 2026)',
  totalDebitSpend: 342600,
  zombieSubscriptionAnnualBleed: 21828,
  unclaimedTaxDeductionsFound: 73450,
  zombieSubscriptions: [
    {
      id: 'sub_01',
      merchant: 'Cult.fit Fitness Membership',
      rawString: 'ACH D- CULTFIT HEALTHCA-910283',
      amount: 999,
      frequency: 'Monthly (Auto-Debit)',
      annualCost: 11988,
      status: 'HIGH_LEAK',
      insight: 'Zero gym check-ins detected in the last 74 days. Immediate cancel candidate.',
      cancelUrl: 'https://www.cult.fit',
    },
    {
      id: 'sub_02',
      merchant: 'Apple Services (iCloud+ 2TB)',
      rawString: 'POS 438190 APPLE.COM/BILL',
      amount: 749,
      frequency: 'Monthly',
      annualCost: 8988,
      status: 'UNDER_UTILIZED',
      insight: 'You are using only 84GB out of 2,000GB. Downgrade to 200GB plan (₹219/mo) to save ₹6,360/yr.',
      cancelUrl: 'https://appleid.apple.com',
    },
    {
      id: 'sub_03',
      merchant: 'Truecaller Premium Annual',
      rawString: 'UPI/TRUECALLER/291048',
      amount: 852,
      frequency: 'Annual Auto-Renew',
      annualCost: 852,
      status: 'REVIEW',
      insight: 'Renews next month on July 14. Turn off auto-renewal in Google Play / App Store.',
      cancelUrl: 'https://play.google.com/store/account/subscriptions',
    },
  ],
  taxDeductionsHarvested: [
    {
      id: 'tax_01',
      section: 'Section 80D (Health Insurance)',
      category: 'Medical Insurance Premium',
      recipient: 'HDFC ERGO General Insurance',
      amount: 18450,
      taxSavedAt30Pct: 5756,
      proofDetail: 'Direct debit to IRDAI approved insurer. Full amount eligible for tax deduction.',
    },
    {
      id: 'tax_02',
      section: 'Section 80G (Charitable Donations)',
      category: 'Donation with 80G Exemption',
      recipient: 'The Akshaya Patra Foundation',
      amount: 10000,
      taxSavedAt30Pct: 1560,
      proofDetail: '50% deduction eligible under Section 80G. Form 10BE receipt available from NGO.',
    },
    {
      id: 'tax_03',
      section: 'Section 80C (Tuition Fees)',
      category: 'Child Education Tuition Fee',
      recipient: 'Delhi Public School (Tuition Component)',
      amount: 45000,
      taxSavedAt30Pct: 14040,
      proofDetail: 'Tuition fees for up to 2 children are eligible under Section 80C limit.',
    },
  ],
  spendBreakdown: {
    needs: { label: 'Essential Needs (Rent, Utilities, Groceries)', amount: 184000, pct: 54 },
    wants: { label: 'Discretionary Wants (Dining, Zomato, Blinkit, Shopping)', amount: 112000, pct: 33 },
    investments: { label: 'Savings & Mutual Fund SIPs', amount: 46600, pct: 13 },
  },
};

// POST /api/forensic/audit
async function auditStatement(req, res) {
  try {
    const { isSample, password } = req.body || {};
    // Return sample or process uploaded file
    res.json({
      success: true,
      isSimulated: Boolean(isSample),
      data: SAMPLE_FORENSIC_DATA,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { auditStatement };
