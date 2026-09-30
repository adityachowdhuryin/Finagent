// server/routes/familyHub.js
// Multi-PAN Family Office Hub & Inter-PAN Tax Arbitrage Engine

let familyProfiles = [
  {
    id: 'fam_001',
    name: 'Self (Aditya Chowdhury)',
    pan: 'ABCDE1234F',
    relationship: 'Self',
    isSeniorCitizen: false,
    netWorth: 2430000,
    holdings: {
      equities: 1250000,
      mutualFunds: 880000,
      fixedDeposits: 300000,
    },
    taxMetrics: {
      annualIncome: 1800000,
      ltcgBooked: 95000,
      ltcgExemptionRemaining: 30000,
      used80C: 150000,
      remaining80C: 0,
    },
  },
  {
    id: 'fam_002',
    name: 'Pooja Chowdhury (Spouse)',
    pan: 'BNCPK5678M',
    relationship: 'Spouse',
    isSeniorCitizen: false,
    netWorth: 1450000,
    holdings: {
      equities: 420000,
      mutualFunds: 780000,
      fixedDeposits: 250000,
    },
    taxMetrics: {
      annualIncome: 1200000,
      ltcgBooked: 15000,
      ltcgExemptionRemaining: 110000, // HUGE ARBITRAGE OPPORTUNITY
      used80C: 95000,
      remaining80C: 55000,
    },
  },
  {
    id: 'fam_003',
    name: 'Aditya Chowdhury (HUF)',
    pan: 'AAACH9999K',
    relationship: 'HUF',
    isSeniorCitizen: false,
    netWorth: 850000,
    holdings: {
      equities: 500000,
      mutualFunds: 250000,
      fixedDeposits: 100000,
    },
    taxMetrics: {
      annualIncome: 350000,
      ltcgBooked: 0,
      ltcgExemptionRemaining: 125000, // UNUSED HUF LTCG
      used80C: 40000,
      remaining80C: 110000,
    },
  },
  {
    id: 'fam_004',
    name: 'R. K. Chowdhury (Father)',
    pan: 'AKIPC4321R',
    relationship: 'Parent',
    isSeniorCitizen: true, // SENIOR CITIZEN ARBITRAGE
    netWorth: 2100000,
    holdings: {
      equities: 200000,
      mutualFunds: 600000,
      fixedDeposits: 1300000,
    },
    taxMetrics: {
      annualIncome: 450000,
      ltcgBooked: 0,
      ltcgExemptionRemaining: 125000,
      used80C: 150000,
      remaining80C: 0,
    },
  },
];

// GET /api/family/profiles
async function getProfiles(req, res) {
  try {
    const totalFamilyNetWorth = familyProfiles.reduce((s, p) => s + (p.netWorth || 0), 0);
    res.json({
      success: true,
      totalFamilyNetWorth,
      memberCount: familyProfiles.length,
      profiles: familyProfiles,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/family/profile
async function addOrUpdateProfile(req, res) {
  try {
    const { name, pan, relationship, isSeniorCitizen, netWorth, annualIncome } = req.body;
    if (!name || !pan) {
      return res.status(400).json({ error: 'Name and PAN are required' });
    }

    const cleanPan = pan.toUpperCase().trim();
    const newProfile = {
      id: `fam_${Date.now()}`,
      name,
      pan: cleanPan,
      relationship: relationship || 'Family Member',
      isSeniorCitizen: Boolean(isSeniorCitizen),
      netWorth: Number(netWorth) || 0,
      holdings: {
        equities: Math.round((Number(netWorth) || 0) * 0.4),
        mutualFunds: Math.round((Number(netWorth) || 0) * 0.4),
        fixedDeposits: Math.round((Number(netWorth) || 0) * 0.2),
      },
      taxMetrics: {
        annualIncome: Number(annualIncome) || 500000,
        ltcgBooked: 0,
        ltcgExemptionRemaining: 125000,
        used80C: 0,
        remaining80C: 150000,
      },
    };

    familyProfiles.push(newProfile);
    res.json({ success: true, profile: newProfile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/family/optimize-tax
async function optimizeTax(req, res) {
  try {
    const suggestions = [];
    let totalPotentialTaxSaved = 0;

    // 1. LTCG Exemption Arbitrage across PANs
    const spouse = familyProfiles.find(p => p.relationship === 'Spouse');
    const self = familyProfiles.find(p => p.relationship === 'Self');
    const huf = familyProfiles.find(p => p.relationship === 'HUF');
    const parent = familyProfiles.find(p => p.isSeniorCitizen);

    if (spouse && spouse.taxMetrics.ltcgExemptionRemaining > 50000) {
      const saving = Math.round(spouse.taxMetrics.ltcgExemptionRemaining * 0.125);
      totalPotentialTaxSaved += saving;
      suggestions.push({
        id: 'opt_spouse_ltcg',
        category: 'Capital Gains Arbitrage',
        priority: 'HIGH',
        title: `Harvest ₹${(spouse.taxMetrics.ltcgExemptionRemaining).toLocaleString('en-IN')} tax-free gains in ${spouse.name}'s PAN`,
        description: `Your spouse has an unused Section 112A LTCG exemption limit. Booking capital gains or transferring equity assets to their account allows tax-free harvesting.`,
        taxSaved: saving,
        action: 'Execute rebalancing in Spouse account',
      });
    }

    // 2. HUF Separate Entity Arbitrage
    if (huf) {
      const huf80cSaving = Math.round(huf.taxMetrics.remaining80C * 0.20);
      totalPotentialTaxSaved += huf80cSaving;
      suggestions.push({
        id: 'opt_huf_deduction',
        category: 'HUF Tax Shield',
        priority: 'MEDIUM',
        title: `Utilize HUF's independent ₹1,50,000 80C limit`,
        description: `Your HUF operates as an independent legal entity under Indian Tax Law. Investing ₹${huf.taxMetrics.remaining80C.toLocaleString('en-IN')} in ELSS under HUF PAN saves ₹${huf80cSaving.toLocaleString('en-IN')} tax.`,
        taxSaved: huf80cSaving,
        action: 'Contribute to HUF Demat / ELSS',
      });
    }

    // 3. Senior Citizen FD / Interest Exemption (Section 80TTB)
    if (parent) {
      const scssSaving = 15600; // 8.2% SCSS vs standard 7.1% on ₹15L + Section 80TTB ₹50k exemption
      totalPotentialTaxSaved += scssSaving;
      suggestions.push({
        id: 'opt_parent_scss',
        category: 'Senior Citizen Arbitrage',
        priority: 'HIGH',
        title: `Gift funds to ${parent.name} for Senior Citizen Savings Scheme (8.2%)`,
        description: `Monetary gifts to parents are completely tax-free under Section 56(2). Parents enjoy Section 80TTB (₹50,000 tax-free interest) and higher slab exemptions.`,
        taxSaved: scssSaving,
        action: 'Open SCSS Account in Post Office / Bank',
      });
    }

    res.json({
      success: true,
      totalPotentialTaxSaved,
      suggestions,
      memberCount: familyProfiles.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getProfiles, addOrUpdateProfile, optimizeTax };
