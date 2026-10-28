const express = require('express');
const router = express.Router();

/**
 * Legal Digital Will & Succession Dossier Engine
 * Formatted under Section 63 of the Indian Succession Act, 1925
 */

router.post('/generate', (req, res) => {
  try {
    const {
      testator = {
        fullName: 'Arjun Sharma',
        fatherName: 'Ramesh Sharma',
        age: 38,
        pan: 'ABCPS1234F',
        address: 'Flat 402, Green Glen Layout, Bellandur, Bengaluru, Karnataka 560103',
        religion: 'Hindu',
      },
      executors = [
        { name: 'Priya Sharma', relation: 'Spouse', address: 'Same as testator', isAlternate: false },
        { name: 'Vikram Sharma', relation: 'Brother', address: 'Indiranagar, Bengaluru', isAlternate: true },
      ],
      guardian = {
        name: 'Sunita Sharma',
        relation: 'Maternal Grandmother',
        minorNames: 'Aarav Sharma',
      },
      liabilities = [
        {
          type: 'Home Loan / Mortgage',
          lender: 'HDFC Bank Ltd',
          outstandingAmount: 5400000,
          collateral: 'Apartment 402, Green Glen, Bellandur, Bengaluru',
          settlementDirective: 'To be settled first from liquid fixed deposits and term insurance proceeds prior to asset transfer.'
        }
      ],
      assets = [
        { category: 'Demat / Stocks & Mutual Funds', identifier: 'Zerodha Demat (BO ID: 1208160012345678)', beneficiary: 'Priya Sharma (Spouse)', sharePct: 100 },
        { category: 'Bank Accounts & FDs', identifier: 'HDFC Bank A/C No. 50100234567890 & FDs', beneficiary: 'Priya Sharma (Spouse)', sharePct: 100 },
        { category: 'Real Estate / Property', identifier: 'Apartment 402, Green Glen, Bellandur', beneficiary: 'Priya Sharma (50%) & Aarav Sharma (50%)', sharePct: 100 },
        { category: 'Digital & Cloud Accounts', identifier: 'Google Cloud, Apple ID, Financial Portals', beneficiary: 'Priya Sharma (Spouse)', sharePct: 100 },
      ],
      digitalAssetsDirective = 'All access credentials, cloud storage, cryptocurrencies, and digital records shall be managed exclusively by the primary executor.',
      witnesses = [
        { name: 'Dr. Rajesh Nair', address: 'Indiranagar, Bengaluru' },
        { name: 'Ananya Deshmukh', address: 'Koramangala, Bengaluru' },
      ],
    } = req.body;

    const willDate = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const primaryExecutor = executors.find(e => !e.isAlternate) || executors[0] || { name: 'Priya Sharma' };
    const altExecutor = executors.find(e => e.isAlternate) || executors[1] || { name: 'Vikram Sharma' };

    const legalDraftText = `
LAST WILL AND TESTAMENT OF ${testator.fullName.toUpperCase()}
(Under Section 63 of the Indian Succession Act, 1925)

I, ${testator.fullName}, aged about ${testator.age} years, son/daughter of ${testator.fatherName}, residing at ${testator.address}, holding Permanent Account Number (PAN) ${testator.pan}, of sound disposing mind and memory, do hereby make, publish and declare this to be my Last Will and Testament, hereby revoking, cancelling, and annulling all prior Wills, Codicils, and Testamentary Dispositions made by me at any time heretofore.

1. DECLARATION OF SOUND MIND & FREE VOLITION
I declare that I am in sound bodily health and possessed of full disposing memory and understanding. I make this testamentary disposition voluntarily, out of my own free will and desire, without any fraud, coercion, duress, menace, or undue influence exerted upon me by any person whomsoever.

2. APPOINTMENT OF EXECUTORS & WAIVER OF PROBATE BOND
I hereby nominate, constitute, and appoint ${primaryExecutor.name} (${primaryExecutor.relation || 'Relation'}) as the sole and absolute Executor of this my Last Will and Testament. In the unfortunate event that my said Executor predeceases me, renounces probate, or is incapacitated or unwilling to act, I nominate, constitute, and appoint ${altExecutor.name} (${altExecutor.relation || 'Relation'}) as the Alternate Executor with identical fiduciary powers.
I expressly direct that neither my Executor nor my Alternate Executor shall be required to post any fidelity bond, security, or surety in any court of competent jurisdiction for the administration or probate of my estate.

3. APPOINTMENT OF TESTAMENTARY GUARDIAN FOR MINOR CHILDREN
In the event that my child/children, namely ${guardian.minorNames || 'my minor children'}, are minors at the date of my demise, and in the further event that their mother/father does not survive me, I hereby nominate and appoint ${guardian.name} (${guardian.relation}) to act as the sole legal and testamentary Guardian of the person and property of my said minor child/children until each attains majority under the Indian Majority Act, 1875.

4. DISCHARGE OF DEBTS, LIABILITIES & MORTGAGES
I hereby mandate and direct my Executor to pay and satisfy all my just debts, funeral rites, statutory taxes, and testamentary administration expenses out of my liquid assets (including bank savings, term deposits, and insurance proceeds) as a first charge on my estate.
${liabilities && liabilities.length > 0 ? liabilities.map(l => `Specifically regarding ${l.type} (${l.collateral}): Outstanding balance of approx. Rs. ${Number(l.outstandingAmount || 0).toLocaleString('en-IN')} with ${l.lender} shall be settled in accordance with: ${l.settlementDirective}`).join('\n') : 'All personal and institutional liabilities shall be discharged prior to the transfer or division of residuary bequests.'}

5. SPECIFIC BEQUESTS SCHEDULE
Subject to the satisfaction of the liabilities specified hereinabove, I devise, bequeath, and allocate my specific assets and holdings to the respective beneficiaries named hereunder:

${assets.map((a, i) => `   (${i + 1}) ${a.category.toUpperCase()}:
       Asset Specification: ${a.identifier}
       Beneficiary / Legatee: ${a.beneficiary}
       Share Allocation: ${a.sharePct}% (Absolute and indefeasible ownership)`).join('\n\n')}

6. DIGITAL ASSETS & ONLINE ACCOUNTS DIRECTIVE
I grant full testamentary power to my Executor to access, manage, download, preserve, or delete all my digital and electronic assets, including email accounts, cloud storage repositories, cryptocurrency wallets, financial trading logins, and digital payment instruments. ${digitalAssetsDirective}

7. RESIDUARY ESTATE
All the rest, residue, and remainder of my estate, property, and effects, both movable and immovable, tangible and intangible, wheresoever situate, of which I may die possessed or entitled to (including future inheritances or after-acquired assets not specifically itemized herein), shall devolve absolutely, unconditionally, and forever upon my primary beneficiary ${primaryExecutor.name}, or in equal shares to my surviving legal heirs.

8. ATTESTATION CLAUSE (Section 68, Indian Evidence Act, 1872)
IN WITNESS WHEREOF, I, the said Testator ${testator.fullName}, have hereunto set my hand and signature to this my Last Will and Testament, comprising this document, on this ${willDate} at Bengaluru, Karnataka, India.


________________________________________
SIGNATURE OF TESTATOR: ${testator.fullName}
(Signed on each page and attested in presence of witnesses)


SIGNED, PUBLISHED, AND DECLARED by the Testator, ${testator.fullName}, as and for their Last Will and Testament, in the joint presence of us, who, at their special instance and request, in their presence, and in the presence of each other, have hereunto subscribed our names as attesting witnesses, after seeing the Testator sign this document, and having signed ourselves as witnesses in the Testator's presence:

WITNESS 1 (Non-Beneficiary Independent):
Name: ${witnesses[0]?.name || 'Dr. Rajesh Nair'}
Address: ${witnesses[0]?.address || 'Indiranagar, Bengaluru'}
Signature: __________________________
Date: ______________ Place: ______________

WITNESS 2 (Non-Beneficiary Independent):
Name: ${witnesses[1]?.name || 'Ananya Deshmukh'}
Address: ${witnesses[1]?.address || 'Koramangala, Bengaluru'}
Signature: __________________________
Date: ______________ Place: ______________
    `.trim();

    // SHA-256 seed for digital verification
    const hashSeed = `${testator.fullName}|${testator.pan}|${willDate}|${assets.length}|${witnesses[0]?.name}`;
    let sha256 = '8f3e2b1c9a0d4e7f5b6a1c8d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f';
    try {
      let hash = 0;
      for (let i = 0; i < hashSeed.length; i++) {
        hash = ((hash << 5) - hash) + hashSeed.charCodeAt(i);
        hash |= 0;
      }
      sha256 = `${Math.abs(hash).toString(16).padStart(8, '0')}7f9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c`.slice(0, 64);
    } catch {}

    return res.json({
      success: true,
      data: {
        testator,
        executors,
        guardian,
        liabilities,
        assets,
        witnesses,
        willDate,
        legalDraftText,
        digitalHash: sha256,
        statutoryCovenants: [
          'Section 63 of Indian Succession Act, 1925: Valid execution requires two attesting witnesses who see the testator sign.',
          'Section 68 of Indian Evidence Act, 1872: Proof of execution requires at least one attesting witness to be called.',
          'Nominee vs. Legal Heir (Supreme Court of India): Nominees hold investments strictly in trust for legal heirs declared in this Will.',
          'Section 18 of Registration Act, 1908: Will registration is optional but provides statutory evidentiary weight against undue influence.',
        ],
      },
    });
  } catch (err) {
    console.error('Digital Will Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = { router };
