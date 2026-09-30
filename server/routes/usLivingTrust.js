// US Revocable Living Trust, Pour-Over Will & Estate Planning Generator (Bypasses Probate Court)

// POST /api/us-trust/generate
async function generateLivingTrust(req, res) {
  try {
    const {
      grantorName = 'Alex Morgan',
      stateOfResidence = 'California',
      county = 'San Francisco County',
      maritalStatus = 'single',
      successorTrusteeName = 'Jordan Morgan',
      successorTrusteeRelation = 'Sibling',
      beneficiaries = [
        { name: 'Jordan Morgan', relation: 'Sibling', sharePct: 70 },
        { name: 'Silicon Valley Community Foundation', relation: 'Charity', sharePct: 30 },
      ],
      realEstateProperties = [
        { address: '1240 Valencia St, San Francisco, CA 94110', apnParcelNo: '3589-021' },
      ],
      brokerageAccounts = [
        { institution: 'Charles Schwab & Co.', accountType: 'Taxable Individual Brokerage' },
        { institution: 'Fidelity Investments', accountType: 'Brokerage' },
      ],
      executorName = 'Jordan Morgan',
    } = req.body;

    const todayStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const trustName = `THE ${grantorName.toUpperCase()} REVOCABLE LIVING TRUST`;

    const trustLegalText = `DECLARATION OF TRUST
${trustName}

This Revocable Living Trust Agreement is executed on this ${todayStr}, by and between ${grantorName} ("Grantor" and initial "Trustee"), residing in the County of ${county}, State of ${stateOfResidence}.

ARTICLE 1: CREATION AND NAME OF TRUST
The Grantor hereby transfers and delivers to the Trustee the property described in Schedule A attached hereto. All such property, together with any additions, shall be held, administered, and distributed by the Trustee in accordance with the terms of this Trust. This Trust shall be known as "${trustName}".

ARTICLE 2: REVOCABILITY
The Grantor explicitly reserves the right at any time during their lifetime, by written instrument delivered to the Trustee, to alter, amend, or revoke this Trust, in whole or in part, without the consent of any beneficiary.

ARTICLE 3: TRUSTEE APPOINTMENT & SUCCESSION
The initial Trustee shall be ${grantorName}. 
In the event that the initial Trustee dies, resigns, or becomes incapacitated, ${successorTrusteeName} (${successorTrusteeRelation}) shall immediately serve as Successor Trustee. The Successor Trustee shall have all powers and fiduciary duties granted to the initial Trustee.

ARTICLE 4: PROBATE AVOIDANCE & DISTRIBUTION UPON DEMISE
Upon the death of the Grantor, the Successor Trustee shall pay all just administrative expenses, and without court supervision or Probate Court proceedings, distribute the remaining trust principal to the following Beneficiaries:

${beneficiaries.map((b, i) => `   (${i + 1}) ${b.name} (${b.relation}): ${b.sharePct}% of Trust Estate`).join('\n')}

ARTICLE 5: SCHEDULE A (INITIAL ASSET FUNDING)
The Grantor hereby deeds, assigns, and titles the following assets into the Trust:
1. Real Property: ${realEstateProperties.map(p => `${p.address} (APN: ${p.apnParcelNo})`).join(', ')}
2. Financial & Demat Accounts: ${brokerageAccounts.map(a => `${a.institution} (${a.accountType})`).join(', ')}

IN WITNESS WHEREOF, the Grantor and Trustee have executed this Trust on this ${todayStr}.

________________________________________
${grantorName}, Grantor & Initial Trustee


STATE OF ${stateOfResidence.toUpperCase()}
COUNTY OF ${county.toUpperCase()}

On this ${todayStr}, before me, a Notary Public in and for said State, personally appeared ${grantorName}, known to me to be the person whose name is subscribed to the within instrument, and acknowledged that they executed the same for the purposes therein contained.

________________________________________
Notary Public, State of ${stateOfResidence}
My Commission Expires: __________________
`;

    const pourOverWillText = `LAST WILL AND TESTAMENT OF ${grantorName.toUpperCase()}
(POUR-OVER WILL)

I, ${grantorName}, a resident of ${county}, State of ${stateOfResidence}, declare that this is my Last Will and Testament, hereby revoking all prior Wills and Codicils.

1. APPOINTMENT OF EXECUTOR:
I appoint ${executorName} as the Executor of this Will.

2. POUR-OVER CLAUSE:
I give, devise, and bequeath all of my estate, including all real and personal property, wherever situated, to the then-acting Trustee of "${trustName}", to be added to and commingled with the trust principal and administered according to its terms.

IN WITNESS WHEREOF, I have subscribed my name on ${todayStr}.

________________________________________
${grantorName}, Testator

ATTESTATION CLAUSE:
The Testator declared to us that this instrument is their Will and asked us to sign as witnesses. We sign in the Testator's presence and in each other's presence:

Witness 1: ____________________________  Date: ____________
Witness 2: ____________________________  Date: ____________
`;

    res.json({
      success: true,
      trustName,
      grantorName,
      stateOfResidence,
      avoidedProbateFeeEstimateUSD: Math.round(realEstateProperties.length * 950000 * 0.04), // ~4% statutory California probate fee
      trustLegalText,
      pourOverWillText,
      fundingChecklist: [
        '1. Record a Grant Deed transfer with the County Recorder transferring home title to: ' + trustName,
        '2. Submit Certificate of Trust to Charles Schwab & Fidelity to retitle taxable accounts into the Trust',
        '3. Update primary/contingent beneficiaries on 401(k) and Roth IRA accounts',
        '4. Print Trust & Will on bond paper and execute before a certified Notary Public and 2 witnesses',
      ],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { generateLivingTrust };
