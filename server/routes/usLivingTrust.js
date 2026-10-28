// server/routes/usLivingTrust.js
// Institutional US Revocable Living Trust, Pour-Over Will, Financial POA,
// Advance Healthcare Directive, Certificate of Trust, and Statutory Deed Transfer Package.
// Per Stirpes vs Per Capita distribution trees, State Estate Tax Decoupled AB Marital Bypass Formulas,
// California PCOR (Prop 19 Exclusion), and Special Needs Trust (42 U.S.C. § 1396p(d)(4)(A)) Articles.

const crypto = require('crypto');

// POST /api/us-trust/generate
async function generateLivingTrust(req, res) {
  try {
    const {
      grantorName = 'Alex Morgan',
      stateOfResidence = 'California',
      county = 'San Francisco County',
      maritalStatus = 'single', // 'single' | 'married'
      spouseName = '',
      distributionMethod = 'per_stirpes', // 'per_stirpes' | 'per_capita'
      hasSpecialNeedsBeneficiary = false,
      specialNeedsBeneficiaryName = '',
      successorTrusteeName = 'Jordan Morgan',
      successorTrusteeRelation = 'Sibling',
      beneficiaries = [
        { name: 'Jordan Morgan', relation: 'Sibling', sharePct: 70 },
        { name: 'Silicon Valley Community Foundation', relation: 'Charity', sharePct: 30 },
      ],
      realEstateProperties = [
        { address: '1240 Valencia St, San Francisco, CA 94110', apnParcelNo: '3589-021', estimatedValue: 1250000 },
      ],
      brokerageAccounts = [
        { institution: 'Charles Schwab & Co.', accountType: 'Taxable Individual Brokerage', accountNo: ' Schwab-***-9182' },
        { institution: 'Fidelity Investments', accountType: 'Brokerage & Liquid Accounts', accountNo: ' Fidelity-***-4019' },
      ],
      executorName = 'Jordan Morgan',
      healthcareAgentName = 'Jordan Morgan',
      financialAgentName = 'Jordan Morgan'
    } = req.body;

    const todayStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const trustName = `THE ${grantorName.toUpperCase()} REVOCABLE LIVING TRUST`;

    // 1. Distribution Clause (Per Stirpes vs Per Capita)
    let distributionArticleText = '';
    if (distributionMethod === 'per_stirpes') {
      distributionArticleText = `ARTICLE 4: PROBATE AVOIDANCE & DISTRIBUTION UPON DEMISE (PER STIRPES)
Upon the death of the Grantor, the Successor Trustee shall pay all just administrative expenses, and without court supervision or Probate Court proceedings, distribute the remaining trust principal to the following Beneficiaries:

${beneficiaries.map((b, i) => `   (${i + 1}) ${b.name} (${b.relation}): ${b.sharePct}% of Trust Estate, PER STIRPES. If any beneficiary predeceases the Grantor leaving surviving lawful lineal descendants, such deceased beneficiary's share shall not lapse, but shall descend and be divided in equal shares among such deceased beneficiary's surviving children by right of representation.`).join('\n')}`;
    } else {
      distributionArticleText = `ARTICLE 4: PROBATE AVOIDANCE & DISTRIBUTION UPON DEMISE (PER CAPITA)
Upon the death of the Grantor, the Successor Trustee shall pay all just administrative expenses, and without court supervision or Probate Court proceedings, distribute the remaining trust principal to the following Beneficiaries:

${beneficiaries.map((b, i) => `   (${i + 1}) ${b.name} (${b.relation}): ${b.sharePct}% of Trust Estate, PER CAPITA. If any beneficiary predeceases the Grantor, their share shall lapse and be divided equally among the surviving named beneficiaries at that generation.`).join('\n')}`;
    }

    // 2. State Estate Tax Decoupled AB Marital Bypass Formula (if applicable)
    let abBypassArticleText = '';
    const stateUpper = (stateOfResidence || '').toUpperCase();
    const isDecoupledState = stateUpper.includes('NEW YORK') || stateUpper.includes('MASSACHUSETTS') || stateUpper.includes('OREGON') || stateUpper.includes('WASHINGTON');

    if (maritalStatus === 'married' || isDecoupledState) {
      abBypassArticleText = `
ARTICLE 6: CREDIT SHELTER & MARITAL BYPASS TRUST FORMULA (STATE TAX DECOUPLING)
Upon the death of the first spouse to die, the Trustee shall divide the Trust Estate into two separate trusts:
(a) THE SURVIVOR'S MARITAL TRUST (TRUST A): Designed to qualify for the unlimited federal and state marital deduction under Internal Revenue Code Section 2056(b)(7).
(b) THE CREDIT SHELTER / BYPASS TRUST (TRUST B): The Trustee shall fund Trust B with the maximum pecuniary amount of the deceased spouse's available State Estate Tax Exemption (e.g., $6,940,000 for New York with cliff mitigation, or $2,000,000 for Massachusetts) without generating any state estate tax liability. Trust B shall be irrevocable, protecting appreciated assets from the surviving spouse's taxable estate while providing discretionary income for health, education, maintenance, and support (HEMS standard).`;
    }

    // 3. Special Needs Trust (SNT) Article (if selected)
    let sntArticleText = '';
    if (hasSpecialNeedsBeneficiary) {
      sntArticleText = `
ARTICLE 7: SPECIAL NEEDS / SUPPLEMENTAL NEEDS TRUST PROVISIONS
Any share passing to ${specialNeedsBeneficiaryName || 'a disabled beneficiary'} shall not be distributed outright, but shall be held in a separate Third-Party Supplemental Needs Trust administered pursuant to 42 U.S.C. § 1396p(d)(4)(A). The primary intent of this trust is to provide supplemental amenities, education, therapies, and care without disqualifying the beneficiary from needs-based governmental assistance programs including Supplemental Security Income (SSI), Medicaid, and Section 8 housing.`;
    }

    // Full Trust Text
    const trustLegalText = `DECLARATION OF TRUST
${trustName}

This Revocable Living Trust Agreement is executed on this ${todayStr}, by and between ${grantorName} ("Grantor" and initial "Trustee"), residing in the County of ${county}, State of ${stateOfResidence}.

ARTICLE 1: CREATION AND NAME OF TRUST
The Grantor hereby transfers and delivers to the Trustee the property described in Schedule A attached hereto. All such property, together with any additions, shall be held, administered, and distributed by the Trustee in accordance with the terms of this Trust. This Trust shall be known as "${trustName}".

ARTICLE 2: REVOCABILITY
The Grantor explicitly reserves the right at any time during their lifetime, by written instrument delivered to the Trustee, to alter, amend, or revoke this Trust, in whole or in part, without the consent of any beneficiary.

ARTICLE 3: TRUSTEE APPOINTMENT & SUCCESSION
The initial Trustee shall be ${grantorName}. 
In the event that the initial Trustee dies, resigns, or becomes incapacitated, ${successorTrusteeName} (${successorTrusteeRelation}) shall immediately serve as Successor Trustee. The Successor Trustee shall have all powers and fiduciary duties granted to the initial Trustee under applicable State Probate Code.

${distributionArticleText}
${abBypassArticleText}
${sntArticleText}

ARTICLE 8: DIGITAL ASSETS & RUFADAA AUTHORIZATION
Pursuant to the Revised Uniform Fiduciary Access to Digital Assets Act (RUFADAA), the Trustee is granted express authority to access, control, modify, delete, and transfer all digital devices, cloud accounts, financial portals, and cryptocurrency private key material.

ARTICLE 9: SCHEDULE A (INITIAL ASSET FUNDING)
The Grantor hereby deeds, assigns, and titles the following assets into the Trust:
1. Real Property: ${realEstateProperties.map(p => `${p.address} (APN: ${p.apnParcelNo})`).join(', ')}
2. Financial & Custodial Accounts: ${brokerageAccounts.map(a => `${a.institution} (${a.accountType} - ${a.accountNo})`).join(', ')}

IN WITNESS WHEREOF, the Grantor and Trustee have executed this Trust on this ${todayStr}.

________________________________________
${grantorName}, Grantor & Initial Trustee


STATE OF ${stateOfResidence.toUpperCase()}
COUNTY OF ${county.toUpperCase()}

On this ${todayStr}, before me, a Notary Public in and for said State, personally appeared ${grantorName}, known to me to be the person whose name is subscribed to the within instrument, and acknowledged that they executed the same for the purposes therein contained.

________________________________________
Notary Public, State of ${stateOfResidence}
My Commission Expires: __________________`;

    // 2. POUR-OVER WILL
    const pourOverWillText = `LAST WILL AND TESTAMENT OF ${grantorName.toUpperCase()}
(POUR-OVER WILL)

I, ${grantorName}, a resident of ${county}, State of ${stateOfResidence}, declare that this is my Last Will and Testament, hereby revoking all prior Wills and Codicils.

1. APPOINTMENT OF EXECUTOR:
I appoint ${executorName} as the Executor of this Will.

2. POUR-OVER CLAUSE:
I give, devise, and bequeath all of my estate, including all real and personal property, wherever situated, to the then-acting Trustee of "${trustName}", to be added to and commingled with the trust principal and administered according to its terms.

3. DIGITAL ASSET DISPOSITION:
My Executor is granted full power under RUFADAA to access digital accounts and execute master transfers to the Trust.

IN WITNESS WHEREOF, I have subscribed my name on ${todayStr}.

________________________________________
${grantorName}, Testator

ATTESTATION CLAUSE:
The Testator declared to us that this instrument is their Will and asked us to sign as witnesses. We sign in the Testator's presence and in each other's presence:

Witness 1: ____________________________  Date: ____________
Witness 2: ____________________________  Date: ____________`;

    // 3. DURABLE FINANCIAL POWER OF ATTORNEY (POA)
    const durableFinancialPOAText = `UNIFORM STATUTORY FORM POWER OF ATTORNEY
(DURABLE FINANCIAL POWER OF ATTORNEY)

STATE OF ${stateOfResidence.toUpperCase()}, COUNTY OF ${county.toUpperCase()}

NOTICE: THE POWERS GRANTED BY THIS DOCUMENT ARE BROAD AND SWEEPING. THEY EXPLAIN POWERS TO ACT REGARDING YOUR BANKING, TAX, REAL PROPERTY, AND DIGITAL ASSETS.

1. PRINCIPAL & AGENT DESIGNATION:
I, ${grantorName}, appoint ${financialAgentName} as my Agent (Attorney-in-Fact) to act in my name and for my benefit in all financial matters.

2. GRANT OF POWERS:
My Agent is authorized to conduct banking, real estate transactions, tax filings with the Internal Revenue Service (Form 2848), brokerage transactions, digital asset transfers, and business operations.

3. DURABILITY STATEMENT:
This Power of Attorney is durable and shall NOT be affected by my subsequent disability, incapacity, or lapse of time.

DATED: ${todayStr}

________________________________________
${grantorName}, Principal`;

    // 4. ADVANCE HEALTHCARE DIRECTIVE
    const advanceDirectiveText = `ADVANCE HEALTHCARE DIRECTIVE & LIVING WILL
(Statutory Healthcare Proxy & Medical Living Will)

1. DESIGNATION OF HEALTHCARE AGENT:
I, ${grantorName}, appoint ${healthcareAgentName} as my Healthcare Agent to make health and personal care decisions for me if I become incapable of making my own decisions.

2. LIVING WILL / END-OF-LIFE DIRECTIVE:
If I have an incurable and irreversible condition that will cause death within a short time, I direct that life-sustaining treatment be withheld or withdrawn, and that I be permitted to die naturally with only the administration of medication necessary for comfort.

3. HIPAA MEDICAL PRIVACY WAIVER:
I authorize all healthcare providers to disclose my entire protected medical record to my Agent under the Health Insurance Portability and Accountability Act of 1996 (45 CFR § 164.508).

DATED: ${todayStr}

________________________________________
${grantorName}, Principal`;

    // 5. CERTIFICATE OF TRUST
    const certOfTrustText = `STATUTORY CERTIFICATE OF TRUST
(Under State Probate Code)

TO ALL FINANCIAL INSTITUTIONS AND TITLE COMPANIES:
1. Name of Trust: ${trustName}
2. Date of Trust: ${todayStr}
3. Settlor / Grantor: ${grantorName}
4. Initial Trustee: ${grantorName}
5. Successor Trustee: ${successorTrusteeName} (${successorTrusteeRelation})
6. Revocability: The Trust is REVOCABLE by the Grantor during their lifetime.
7. Taxpayer Identification Number: The Grantor's Social Security Number is the TIN during lifetime (Treas. Reg. § 1.671-4).
8. Powers of Trustee: The Trustee has full powers to buy, sell, encumber, pledge, open, close, and manage financial and brokerage accounts.
9. Redaction: As authorized by law, dispositive provisions and beneficiary identities are omitted.

I certify under penalty of perjury under the laws of ${stateOfResidence} that the foregoing is true and correct.

DATED: ${todayStr}

________________________________________
${grantorName}, Trustee`;

    // 6. CALIFORNIA PCOR (FORM BOE-502-A) & STATUTORY DEED TRANSFER GUIDE
    const pcorAndDeedGuideText = `STATE STATUTORY REAL PROPERTY TRANSFER INSTRUMENT
(COUNTY RECORDER COMPLIANCE & PROPOSITION 19 PARENT-TO-CHILD EXCLUSION)

COUNTY: ${county}
PARCEL NUMBER (APN): ${realEstateProperties[0]?.apnParcelNo || '3589-021'}
PROPERTY ADDRESS: ${realEstateProperties[0]?.address || '1240 Valencia St, San Francisco, CA'}

SECTION I: TRANSFER DOCUMENTS REQUIRED
1. Executed and Notarized Quitclaim Deed / Grant Deed conveying title:
   From: ${grantorName}, an unmarried individual
   To: ${grantorName}, Trustee of ${trustName}
2. California Preliminary Change of Ownership Report (PCOR - Form BOE-502-A).
   - Check Box J: Transfer is to a Revocable Living Trust where the transferor is the sole beneficiary during lifetime.
   - Statutory Property Tax Reassessment Exclusion: Transfer into a revocable trust is EXEMPT from property tax reassessment under California Revenue and Taxation Code Section 62(d).
3. Proposition 19 Primary Residence Exclusion: Transfers to qualifying lineal descendants qualify for up to $1,000,000 in taxable assessed value adjustment protection.

SECTION II: RECORDER FORMATTING SPECIFICATIONS
- Top Margin: 3.0 inches on page 1 for Recorder's Stamp
- Left/Right/Bottom Margins: 0.5 inches minimum
- Documentary Transfer Tax: $0.00 (Exempt under R&T Code § 11930 - Inter vivos trust transfer)`;

    const trustHash = crypto.createHash('sha256').update(trustLegalText).digest('hex');

    return res.json({
      success: true,
      market: 'US',
      grantorName,
      trustName,
      trustHash,
      packageDocuments: {
        livingTrust: trustLegalText,
        pourOverWill: pourOverWillText,
        durablePOA: durableFinancialPOAText,
        advanceDirective: advanceDirectiveText,
        certificateOfTrust: certOfTrustText,
        pcorAndDeedGuide: pcorAndDeedGuideText
      },
      metadata: {
        stateOfResidence,
        county,
        distributionMethod,
        isDecoupledState,
        hasSpecialNeedsBeneficiary
      }
    });
  } catch (err) {
    console.error('Error generating Living Trust package:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  generateLivingTrust
};
