// server/routes/hufStudio.js
// Indian HUF (Hindu Undivided Family) Tax Shelter & Capital Infusion Studio
// Statutory legal deed compiler, Section 64 anti-clubbing planner, and Multi-PAN tax arbitrage simulator

const crypto = require('crypto');

let hufState = {
  hufName: 'Arjun Sharma (HUF)',
  pan: 'AAHFA1234F',
  formedDate: '2020-04-01',
  karta: {
    name: 'Arjun Sharma',
    age: 38,
    relation: 'Karta (Head of Family)',
    pan: 'ABCPS1234F',
    address: 'Flat 402, Green Glen Layout, Bellandur, Bengaluru, Karnataka 560103',
  },
  coparceners: [
    {
      name: 'Aarav Sharma',
      relation: 'Son / Coparcener',
      age: 10,
      rights: 'Equal coparcenary birthright under Hindu Succession Act, 1956',
    },
    {
      name: 'Ananya Sharma',
      relation: 'Daughter / Coparcener',
      age: 14,
      rights: 'Equal coparcenary rights by birth per Hindu Succession (Amendment) Act, 2005',
    },
  ],
  members: [
    {
      name: 'Priya Sharma',
      relation: 'Spouse / Member',
      rights: 'Full maintenance rights, stridhan autonomy, and partition share rights',
    },
  ],
  corpus: {
    initialContribution: 101000,
    source: 'Ancestral Gold Shagun & Parental Cash Gift on Formation',
    currentNetWorth: 4250000,
  },
  bankAccount: {
    bank: 'HDFC Bank Ltd',
    branch: 'Bellandur Branch, Bengaluru',
    accountNumber: '50200098765432',
    ifsc: 'HDFC0001234',
    status: 'ACTIVE',
  },
  dematAccount: {
    depository: 'CDSL',
    dpName: 'Zerodha Broking Ltd',
    boId: '1208160087654321',
    status: 'ACTIVE',
  },
};

// GET /api/huf/profile
async function getHUFProfile(req, res) {
  try {
    res.json({
      success: true,
      data: hufState,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// POST /api/huf/create-deed
async function createHUFDeed(req, res) {
  try {
    const {
      hufName = hufState.hufName,
      karta = hufState.karta,
      coparceners = hufState.coparceners,
      members = hufState.members,
      initialCorpus = 101000,
      corpusSource = 'Parental Blessing / Ancestral Gift',
      executionCity = 'Bengaluru',
      executionState = 'Karnataka',
    } = req.body;

    const deedDate = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const deedClauses = [
      {
        clauseNumber: 1,
        title: 'Affirmation of Joint Hindu Family',
        text: `The parties hereto formally declare that they constitute a Joint Hindu Family governed by the Mitakshara School of Hindu Law, known under the institutional name and style of "${hufName}".`,
      },
      {
        clauseNumber: 2,
        title: 'Status & Authority of the Karta',
        text: `Shri ${karta.name}, being the senior male/head of the Joint Hindu Family, is affirmed as the Karta. The Karta shall have full executive authority to open and operate bank accounts, trade on capital markets, execute leases, and hold property on behalf of the HUF.`,
      },
      {
        clauseNumber: 3,
        title: 'Coparcenary Rights (Inclusive of 2005 Amendment)',
        text: `In accordance with Section 6 of the Hindu Succession (Amendment) Act, 2005 and Supreme Court precedent (Vineeta Sharma v. Rakesh Sharma), all children of the Karta—namely ${coparceners.map(c => c.name).join(' and ')}—are declared as Coparceners holding equal birthrights, survivorship interest, and liabilities in the HUF property.`,
      },
      {
        clauseNumber: 4,
        title: 'Members and Maintenance Protection',
        text: `Smt. ${members.map(m => m.name).join(', ')} is recognized as a member of the HUF entitled to full maintenance out of the HUF estate, preservation of individual Stridhan, and equal partition entitlement as mandated by Hindu Jurisprudence.`,
      },
      {
        clauseNumber: 5,
        title: 'Initial Corpus & Section 64 Anti-Clubbing Segregation',
        text: `The foundational corpus of Rs. ${Number(initialCorpus).toLocaleString('en-IN')} received via ${corpusSource} constitutes the exclusive indivisible property of "${hufName}". The Karta expressly covenants that no personal self-acquired funds have been commingled without statutory commercial consideration, preventing Section 64(2) clubbing provisions of the Income Tax Act, 1961.`,
      },
      {
        clauseNumber: 6,
        title: 'Banking and Investment Authority',
        text: `The Karta is authorized to apply for a Permanent Account Number (PAN) in Form 49A, open savings/current bank accounts with Scheduled Commercial Banks, and establish demat accounts with SEBI-registered depositories.`,
      },
    ];

    const hashPayload = `${hufName}|${karta.name}|${initialCorpus}|${deedDate}|${executionCity}`;
    const deedHash = crypto.createHash('sha256').update(hashPayload).digest('hex');

    // Update in-memory state
    hufState = {
      ...hufState,
      hufName,
      karta: { ...hufState.karta, ...karta },
      coparceners,
      members,
      corpus: { ...hufState.corpus, initialContribution: initialCorpus, source: corpusSource },
    };

    res.json({
      success: true,
      data: {
        deedId: `HUF-DEED-${Date.now()}`,
        hufName,
        deedDate,
        executionCity,
        executionState,
        clauses: deedClauses,
        digitalHash: deedHash,
        karta,
        coparceners,
        members,
        initialCorpus,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// POST /api/huf/capital-infusion
async function assessCapitalInfusion(req, res) {
  try {
    const {
      infusionType = 'ANCESTRAL_BEQUEST', // 'ANCESTRAL_BEQUEST' | 'PARENTAL_GIFT' | 'COMMERCIAL_LOAN' | 'KARTA_GIFT'
      amount = 500000,
      interestRatePct = 8.5,
    } = req.body;

    let clubbingRisk = 'LOW';
    let section64Exempt = true;
    let rationale = '';
    let actionRecommendation = '';

    if (infusionType === 'ANCESTRAL_BEQUEST') {
      clubbingRisk = 'ZERO';
      section64Exempt = true;
      rationale = 'Ancestral property and bequests received via Will or family partition are 100% exempt from Section 64(2) clubbing. All interest, rental, or capital gains remain strictly taxable in HUF hands.';
      actionRecommendation = 'Execute simple HUF gift declaration with probate/Will reference.';
    } else if (infusionType === 'PARENTAL_GIFT') {
      clubbingRisk = 'ZERO';
      section64Exempt = true;
      rationale = 'Gifts received by the HUF from lineal ascendants (e.g. Karta’s father/mother) are non-taxable under Section 56(2)(x) and do NOT trigger Section 64(2) clubbing back to the Karta.';
      actionRecommendation = 'Draft Gift Deed from Grandparents directly in favor of the HUF.';
    } else if (infusionType === 'COMMERCIAL_LOAN') {
      clubbingRisk = 'LOW';
      section64Exempt = true;
      rationale = `Karta lends Rs. ${Number(amount).toLocaleString('en-IN')} to the HUF at a fair market benchmark rate of ${interestRatePct}% p.a. Since consideration is adequate, Section 64(2) does NOT apply. HUF pays deductible interest to Karta, and retains surplus profits tax-efficiently.`;
      actionRecommendation = `Execute an official Promissory Note & Loan Agreement at ${interestRatePct}% interest.`;
    } else if (infusionType === 'KARTA_GIFT') {
      clubbingRisk = 'HIGH';
      section64Exempt = false;
      rationale = 'WARNING: Under Section 64(2) of the Income Tax Act, if the Karta gifts personal self-acquired funds directly to the HUF without consideration, all income generated from that asset is clubbed back into the Karta’s individual tax return.';
      actionRecommendation = 'Switch to a Commercial Loan structure or channel through parental gifts to avoid Section 64(2) clubbing.';
    }

    res.json({
      success: true,
      data: {
        infusionType,
        amount,
        clubbingRisk,
        section64Exempt,
        rationale,
        actionRecommendation,
        statutorySections: ['Section 64(2)', 'Section 56(2)(x)', 'Section 10(2)'],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// POST /api/huf/simulate-arbitrage
async function simulateArbitrage(req, res) {
  try {
    const {
      annualRental = 480000,
      annualDividends = 120000,
      shortTermGains = 300000,
      longTermGains = 250000,
      individualTaxSlabPct = 31.2, // 30% slab + 4% cess
    } = req.body;

    const totalIncome = annualRental + annualDividends + shortTermGains + longTermGains;

    // 1. If taxed 100% in Individual Hands
    const individualTax = Math.round(
      (annualRental * 0.70 * (individualTaxSlabPct / 100)) + // 30% standard deduction on rent
      (annualDividends * (individualTaxSlabPct / 100)) +
      (shortTermGains * 0.20) + // Budget 2024 STCG 20%
      (Math.max(0, longTermGains - 125000) * 0.125) // Budget 2024 LTCG 12.5%
    );

    // 2. If routed to HUF Entity
    // HUF gets its own separate basic exemption limit (Rs. 3L in Old/New Regime),
    // Section 80C (Rs. 1.5L), Section 112A LTCG separate Rs. 1.25L exemption!
    const hufTaxableRental = annualRental * 0.70; // 30% standard deduction = Rs. 3,36,000
    const hufTotalGross = hufTaxableRental + annualDividends; // Rs. 4,56,000
    const hufDeduction80C = Math.min(150000, hufTotalGross);
    const hufNetSlabTaxable = Math.max(0, hufTotalGross - hufDeduction80C); // ~Rs. 3,06,000

    let hufSlabTax = 0;
    if (hufNetSlabTaxable <= 300000) {
      hufSlabTax = 0;
    } else {
      hufSlabTax = (hufNetSlabTaxable - 300000) * 0.05 * 1.04;
    }

    const hufSTCGTax = shortTermGains * 0.20;
    const hufLTCGTax = Math.max(0, longTermGains - 125000) * 0.125; // separate 1.25L exemption!

    const hufTotalTax = Math.round(hufSlabTax + hufSTCGTax + hufLTCGTax);
    const annualTaxSaved = Math.max(0, individualTax - hufTotalTax);
    const tenYearCompoundedSavings = Math.round(
      annualTaxSaved * ((Math.pow(1 + 0.12, 10) - 1) / 0.12)
    );

    res.json({
      success: true,
      data: {
        totalIncomeRedirected: totalIncome,
        individualTaxWithoutHUF: individualTax,
        hufTaxWithSeparateEntity: hufTotalTax,
        annualTaxSaved,
        tenYearCompoundedSavings,
        hufExemptionsUtilized: [
          'HUF Basic Exemption Slab: Rs. 3,00,000',
          'HUF Section 80C Deduction: Rs. 1,50,000',
          'HUF Section 112A LTCG Exemption: Rs. 1,25,000 (Autonomous)',
          'Section 24(a) Standard Deduction on Rental: 30% (Rs. 1,44,000)',
        ],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getHUFProfile,
  createHUFDeed,
  assessCapitalInfusion,
  simulateArbitrage,
};
