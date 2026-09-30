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
      assets = [
        { category: 'Demat / Stocks & Mutual Funds', identifier: 'Zerodha Demat (BO ID: 1208160012345678)', beneficiary: 'Priya Sharma (Spouse)', sharePct: 100 },
        { category: 'Bank Accounts & FDs', identifier: 'HDFC Bank A/C No. 50100234567890 & FDs', beneficiary: 'Priya Sharma (Spouse)', sharePct: 100 },
        { category: 'Real Estate / Property', identifier: 'Apartment 402, Green Glen, Bellandur', beneficiary: 'Priya Sharma (50%) & Aarav Sharma (50%)', sharePct: 100 },
        { category: 'Digital & Cloud Accounts', identifier: 'Google Cloud, Apple ID, Financial Portals', beneficiary: 'Priya Sharma (Spouse)', sharePct: 100 },
      ],
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

    const legalDraftText = `
LAST WILL AND TESTAMENT OF ${testator.fullName.toUpperCase()}

I, ${testator.fullName}, aged about ${testator.age} years, son/daughter of ${testator.fatherName}, residing at ${testator.address}, holding PAN ${testator.pan}, do hereby make, publish and declare this to be my Last Will and Testament, hereby revoking all prior Wills, Codicils, and Testamentary Dispositions made by me at any time heretofore.

1. SOUND MIND & VOLUNTARY EXECUTION
I declare that I am in sound health and disposing state of mind, and am making this Will voluntarily, of my own free will and accord, without any persuasion, duress, coercion, or undue influence from anyone whatsoever.

2. APPOINTMENT OF EXECUTORS
I hereby nominate and appoint ${executors.find(e => !e.isAlternate)?.name || 'my spouse'} as the sole Executor of this my Will. In the event that my said Executor predeceases me or is unable/unwilling to act, I nominate and appoint ${executors.find(e => e.isAlternate)?.name || 'my sibling'} as the Alternate Executor of this Will. I direct that no bond or surety shall be required of my Executor.

3. APPOINTMENT OF GUARDIAN FOR MINORS
If any of my children are minors at the time of my demise and my spouse has also predeceased me, I appoint ${guardian.name} (${guardian.relation}) to be the legal and physical Guardian of my minor child/children, namely ${guardian.minorNames}, until they attain majority.

4. SPECIFIC BEQUESTS AND ASSET DISTRIBUTION
I direct that my debts, funeral and testamentary expenses be paid first from my estate. Thereafter, my properties and investments shall be bequeathed as follows:

${assets.map((a, i) => `   (${i + 1}) ${a.category}:
       Asset Details: ${a.identifier}
       Beneficiary: ${a.beneficiary} (Allocation: ${a.sharePct}%)`).join('\n\n')}

5. RESIDUARY ESTATE
All the rest, residue, and remainder of my estate, of every nature and kind, both movable and immovable, wheresoever situate, which I may possess or be entitled to at the time of my death, shall devolve absolutely and forever upon my spouse ${executors.find(e => !e.isAlternate)?.name || 'Priya Sharma'}, or surviving children in equal shares.

6. WITNESS EXECUTION CLAUSE
IN WITNESS WHEREOF, I, the said ${testator.fullName}, have hereunto set my hand and signature to this my Last Will and Testament on this ${willDate} at Bengaluru, India.


________________________________________
SIGNATURE OF TESTATOR: ${testator.fullName}


SIGNED, PUBLISHED AND DECLARED by the above-named Testator as their Last Will and Testament, in the presence of us, who at their request, in their presence, and in the presence of each other, have subscribed our names as attesting witnesses:

WITNESS 1:
Name: ${witnesses[0]?.name || 'Witness One'}
Address: ${witnesses[0]?.address || 'Address One'}
Signature: __________________________

WITNESS 2:
Name: ${witnesses[1]?.name || 'Witness Two'}
Address: ${witnesses[1]?.address || 'Address Two'}
Signature: __________________________
    `.trim();

    return res.json({
      success: true,
      data: {
        testator,
        executors,
        guardian,
        assets,
        witnesses,
        willDate,
        legalDraftText,
        guidelines: [
          'Registration of a Will is OPTIONAL in India under Section 18 of the Registration Act, 1908, but highly recommended to prevent probate disputes.',
          'Two witnesses must physically watch you sign, and you must watch them sign.',
          'A beneficiary should NEVER sign as an attesting witness to prevent any conflict of interest.',
        ],
      },
    });
  } catch (err) {
    console.error('Digital Will Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = { router };
