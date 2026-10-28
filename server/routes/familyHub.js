// server/routes/familyHub.js
// Multi-PAN / Multi-Entity Family Office Hub & Inter-Entity Tax Arbitrage Engine
// Full Dual-Market Support: India (PAN, HUF, Sec 56/64, Sec 112A, 80TTB) & US (SSN/EIN, Living Trust, IRC § 709, § 529, § 1014)

let familyProfiles = [
  {
    id: 'fam_001',
    name: 'Self (Arjun Sharma)',
    pan: 'ABCDE1234F',
    relationship: 'Self',
    isSeniorCitizen: false,
    netWorth: 12487320,
    holdings: {
      equities: 5850000,
      mutualFunds: 3850000,
      fixedDeposits: 1850000,
    },
    taxMetrics: {
      annualIncome: 3200000,
      effectiveTaxRate: 0.312, // 30% + cess
      ltcgBooked: 125000,
      ltcgExemptionRemaining: 0,
      used80C: 150000,
      remaining80C: 0,
    },
  },
  {
    id: 'fam_002',
    name: 'Pooja Sharma (Spouse)',
    pan: 'BNCPK5678M',
    relationship: 'Spouse',
    isSeniorCitizen: false,
    netWorth: 2450000,
    holdings: {
      equities: 820000,
      mutualFunds: 1180000,
      fixedDeposits: 450000,
    },
    taxMetrics: {
      annualIncome: 950000,
      effectiveTaxRate: 0.104, // 10% bracket
      ltcgBooked: 22000,
      ltcgExemptionRemaining: 103000, // HUGE ARBITRAGE OPPORTUNITY
      used80C: 95000,
      remaining80C: 55000,
    },
  },
  {
    id: 'fam_003',
    name: 'Arjun Sharma (HUF)',
    pan: 'AAACH9999K',
    relationship: 'HUF',
    isSeniorCitizen: false,
    netWorth: 1850000,
    holdings: {
      equities: 950000,
      mutualFunds: 600000,
      fixedDeposits: 300000,
    },
    taxMetrics: {
      annualIncome: 280000,
      effectiveTaxRate: 0.0, // Under basic exemption
      ltcgBooked: 0,
      ltcgExemptionRemaining: 125000, // UNUSED HUF LTCG
      used80C: 35000,
      remaining80C: 115000,
    },
  },
  {
    id: 'fam_004',
    name: 'R. K. Sharma (Father)',
    pan: 'AKIPC4321R',
    relationship: 'Parent',
    isSeniorCitizen: true, // SENIOR CITIZEN ARBITRAGE
    netWorth: 3100000,
    holdings: {
      equities: 300000,
      mutualFunds: 800000,
      fixedDeposits: 2000000,
    },
    taxMetrics: {
      annualIncome: 420000,
      effectiveTaxRate: 0.0, // Rebatable under Section 87A + 80TTB
      ltcgBooked: 0,
      ltcgExemptionRemaining: 125000,
      used80C: 150000,
      remaining80C: 0,
    },
  },
];

let usFamilyProfiles = [
  {
    id: 'us_fam_001',
    name: 'Self (John Miller)',
    pan: '***-**-4891',
    relationship: 'Self',
    isSeniorCitizen: false,
    netWorth: 1850000,
    holdings: {
      equities: 950000,
      mutualFunds: 600000,
      fixedDeposits: 300000, // cash & T-Bills
    },
    taxMetrics: {
      annualIncome: 285000,
      effectiveTaxRate: 0.32,
      federalBracket: '32%',
      usedAnnualExclusion: 0,
      remainingAnnualExclusion: 18000,
      lifetimeExemptionRemaining: 13610000,
    },
  },
  {
    id: 'us_fam_002',
    name: 'Sarah Miller (Spouse)',
    pan: '***-**-7123',
    relationship: 'Spouse',
    isSeniorCitizen: false,
    netWorth: 820000,
    holdings: {
      equities: 420000,
      mutualFunds: 280000,
      fixedDeposits: 120000,
    },
    taxMetrics: {
      annualIncome: 95000,
      effectiveTaxRate: 0.22,
      federalBracket: '22%',
      usedAnnualExclusion: 0,
      remainingAnnualExclusion: 18000,
      lifetimeExemptionRemaining: 13610000,
    },
  },
  {
    id: 'us_fam_003',
    name: 'Miller Family Revocable Living Trust',
    pan: 'EIN 84-XXXXXXX',
    relationship: 'Living Trust',
    isSeniorCitizen: false,
    netWorth: 1250000,
    holdings: {
      equities: 750000,
      mutualFunds: 350000,
      fixedDeposits: 150000,
    },
    taxMetrics: {
      annualIncome: 0, // Grantor pass-through
      effectiveTaxRate: 0.0,
      federalBracket: 'Pass-through (§ 671)',
      usedAnnualExclusion: 0,
      remainingAnnualExclusion: 0,
      lifetimeExemptionRemaining: 13610000,
    },
  },
  {
    id: 'us_fam_004',
    name: 'Emma Miller (Child - 529 Beneficiary)',
    pan: '***-**-9012',
    relationship: 'Child',
    isSeniorCitizen: false,
    netWorth: 185000,
    holdings: {
      equities: 120000,
      mutualFunds: 65000,
      fixedDeposits: 0,
    },
    taxMetrics: {
      annualIncome: 0,
      effectiveTaxRate: 0.0,
      federalBracket: '0% (Kiddie Tax Exempt)',
      usedAnnualExclusion: 0,
      remainingAnnualExclusion: 18000,
      lifetimeExemptionRemaining: 13610000,
    },
  },
  {
    id: 'us_fam_005',
    name: 'Robert Miller (Father / Senior)',
    pan: '***-**-3341',
    relationship: 'Parent',
    isSeniorCitizen: true,
    netWorth: 640000,
    holdings: {
      equities: 150000,
      mutualFunds: 250000,
      fixedDeposits: 240000,
    },
    taxMetrics: {
      annualIncome: 52000,
      effectiveTaxRate: 0.12,
      federalBracket: '12%',
      usedAnnualExclusion: 0,
      remainingAnnualExclusion: 18000,
      lifetimeExemptionRemaining: 13610000,
    },
  },
];

// Helper to synchronize user portfolio info into primary profile
function syncPrimaryWithRealData(userProfile = {}, portfolioSummary = {}, isUS = false) {
  const targetProfiles = isUS ? usFamilyProfiles : familyProfiles;
  if (targetProfiles[0]) {
    if (userProfile.name) targetProfiles[0].name = `Self (${userProfile.name})`;
    if (portfolioSummary.netWorth) targetProfiles[0].netWorth = Number(portfolioSummary.netWorth);
    if (portfolioSummary.holdings) {
      const h = portfolioSummary.holdings;
      const eqVal = (h.equities || []).reduce((s, e) => s + (e.value || 0), 0);
      const mfVal = (h.mutualFunds || []).reduce((s, m) => s + (m.value || 0), 0);
      const fdVal = (h.fixedDeposits || []).reduce((s, f) => s + (f.amount || f.principal || 0), 0);
      if (eqVal || mfVal || fdVal) {
        targetProfiles[0].holdings = {
          equities: eqVal || targetProfiles[0].holdings.equities,
          mutualFunds: mfVal || targetProfiles[0].holdings.mutualFunds,
          fixedDeposits: fdVal || targetProfiles[0].holdings.fixedDeposits,
        };
      }
    }
  }
}

// GET /api/family/profiles
async function getProfiles(req, res) {
  try {
    const isUS = req.query.market === 'US' || req.query.jurisdiction === 'SEC';
    const activeProfiles = isUS ? usFamilyProfiles : familyProfiles;
    const totalFamilyNetWorth = activeProfiles.reduce((s, p) => s + (p.netWorth || 0), 0);
    res.json({
      success: true,
      market: isUS ? 'US' : 'IN',
      currency: isUS ? 'USD' : 'INR',
      currencySymbol: isUS ? '$' : '₹',
      totalFamilyNetWorth,
      memberCount: activeProfiles.length,
      profiles: activeProfiles,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/family/profile
async function addOrUpdateProfile(req, res) {
  try {
    const { name, pan, relationship, isSeniorCitizen, netWorth, annualIncome, market } = req.body;
    if (!name || !pan) {
      return res.status(400).json({ error: 'Name and Identifier (PAN or SSN/EIN) are required' });
    }

    const isUS = market === 'US' || req.query.market === 'US';
    const cleanId = pan.trim();
    const isSenior = Boolean(isSeniorCitizen);
    const parsedIncome = Number(annualIncome) || (isUS ? 120000 : 500000);
    const taxRate = isUS
      ? (parsedIncome > 200000 ? 0.32 : parsedIncome > 100000 ? 0.24 : 0.12)
      : (parsedIncome > 1500000 ? 0.312 : parsedIncome > 1000000 ? 0.156 : parsedIncome > 700000 ? 0.104 : 0);

    const newProfile = {
      id: isUS ? `us_fam_${Date.now()}` : `fam_${Date.now()}`,
      name,
      pan: cleanId,
      relationship: relationship || 'Family Member',
      isSeniorCitizen: isSenior,
      netWorth: Number(netWorth) || 0,
      holdings: {
        equities: Math.round((Number(netWorth) || 0) * 0.45),
        mutualFunds: Math.round((Number(netWorth) || 0) * 0.35),
        fixedDeposits: Math.round((Number(netWorth) || 0) * 0.20),
      },
      taxMetrics: isUS ? {
        annualIncome: parsedIncome,
        effectiveTaxRate: taxRate,
        federalBracket: `${Math.round(taxRate * 100)}%`,
        usedAnnualExclusion: 0,
        remainingAnnualExclusion: 18000,
        lifetimeExemptionRemaining: 13610000,
      } : {
        annualIncome: parsedIncome,
        effectiveTaxRate: taxRate,
        ltcgBooked: 0,
        ltcgExemptionRemaining: 125000,
        used80C: 0,
        remaining80C: 150000,
      },
    };

    if (isUS) {
      usFamilyProfiles.push(newProfile);
    } else {
      familyProfiles.push(newProfile);
    }

    res.json({ success: true, profile: newProfile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/family/optimize-tax
async function optimizeTax(req, res) {
  try {
    const { userProfile, portfolioSummary, market } = req.body || {};
    const isUS = market === 'US' || req.query.market === 'US';
    
    if (userProfile || portfolioSummary) {
      syncPrimaryWithRealData(userProfile, portfolioSummary, isUS);
    }

    const suggestions = [];
    let totalPotentialTaxSaved = 0;

    if (isUS) {
      // ══════════════════════════════════════════════════════════════════════════════
      // US ESTATE & WEALTH SHIELD ARBITRAGE (IRC § 709, § 529, § 1014, LIVING TRUST)
      // ══════════════════════════════════════════════════════════════════════════════
      const child = usFamilyProfiles.find(p => p.relationship === 'Child');
      const seniorParent = usFamilyProfiles.find(p => p.relationship === 'Parent');
      const trust = usFamilyProfiles.find(p => p.relationship === 'Living Trust');

      // 1. Annual Exclusion Spousal Gift Splitting (IRC § 2503(b))
      const annualGiftSavings = 14400; // $36k gift out of 40% estate bracket
      totalPotentialTaxSaved += annualGiftSavings;
      suggestions.push({
        id: 'us_opt_annual_gift',
        category: 'IRS Form 709 Annual Exclusion',
        priority: 'HIGH',
        member: 'Spouse & Children',
        title: 'Gift $36,000/yr per Child using Spousal Gift Splitting (IRC § 2513)',
        description: 'By electing gift-splitting on IRS Form 709, you and your spouse can transfer up to $36,000 per year to each child completely free of federal gift tax, without reducing your $13.61M lifetime unified estate exemption.',
        taxSaved: annualGiftSavings,
        action: 'Execute $36,000 annual exclusion direct transfer to child brokerage or custodial account',
      });

      // 2. Section 529 College Superfunding (5-Year Front Loading IRC § 529(c)(2)(B))
      if (child) {
        const superfundTaxShield = 72000; // $180k estate shield @ 40% estate rate
        totalPotentialTaxSaved += superfundTaxShield;
        suggestions.push({
          id: 'us_opt_529_superfund',
          category: '529 Education Wealth Transfer',
          priority: 'HIGH',
          member: child.name,
          title: 'Execute 5-Year 529 Superfunding: $180,000 Lump-Sum Transfer',
          description: `Front-load 5 years of annual exclusions into ${child.name}'s 529 Plan ($90k single / $180k married). Instantly removes $180,000 from your taxable gross estate while growing 100% tax-free for college/graduate school.`,
          taxSaved: superfundTaxShield,
          action: 'Fund $180k into 529 account and check the 5-year election box on Form 709',
        });
      }

      // 3. Living Trust Probate Avoidance Shield
      if (trust) {
        const probateSavings = 55000; // Statutory CA/NY probate attorney + referee fee savings on $1.25M
        totalPotentialTaxSaved += probateSavings;
        suggestions.push({
          id: 'us_opt_probate_shield',
          category: 'Revocable Trust Fiduciary Shield',
          priority: 'HIGH',
          member: trust.name,
          title: `Re-title Real Property & Brokerage into ${trust.name}`,
          description: `Assets held in your Revocable Living Trust completely bypass probate court delays (12–18 months) and statutory probate fees (~4% of gross asset value under CA Probate Code § 10810).`,
          taxSaved: probateSavings,
          action: 'Record Grant Deed with County Clerk and re-title brokerage account to Trust EIN/SSN',
        });
      }

      // 4. IRC § 1014 Step-Up in Basis Optimization (Senior Parent)
      if (seniorParent) {
        const basisStepUpSaving = 35000; // $150k unrealized capital gain @ 23.8% (LTCG + NIIT)
        totalPotentialTaxSaved += basisStepUpSaving;
        suggestions.push({
          id: 'us_opt_basis_stepup',
          category: 'IRC § 1014 Step-Up in Basis',
          priority: 'HIGH',
          member: seniorParent.name,
          title: `Retain Low-Basis Equities under ${seniorParent.name}'s Name for 100% Step-Up`,
          description: `Do NOT liquidate highly appreciated stock held by ${seniorParent.name}. Upon bequest, assets receive a fair-market value step-up in cost basis under IRC § 1014, completely wiping out federal & state capital gains tax.`,
          taxSaved: basisStepUpSaving,
          action: 'Hold low-cost-basis equities in senior parent estate until testamentary transfer',
        });
      }

      return res.json({
        success: true,
        market: 'US',
        currency: 'USD',
        currencySymbol: '$',
        totalPotentialTaxSaved,
        suggestions,
        memberCount: usFamilyProfiles.length,
      });
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // INDIA MULTI-PAN CAPITAL GAINS & HUF ARBITRAGE (DEFAULT)
    // ══════════════════════════════════════════════════════════════════════════════
    const spouse = familyProfiles.find(p => p.relationship === 'Spouse');
    const huf = familyProfiles.find(p => p.relationship === 'HUF');
    const parents = familyProfiles.filter(p => p.isSeniorCitizen || p.relationship === 'Parent');

    // 1. Section 112A Capital Gains Arbitrage across Family PANs
    const eligibleForLtcg = familyProfiles.filter(p => p.relationship !== 'Self' && p.taxMetrics.ltcgExemptionRemaining > 25000);
    eligibleForLtcg.forEach(member => {
      const remainingExemption = member.taxMetrics.ltcgExemptionRemaining;
      const taxSaved = Math.round(remainingExemption * 0.125);
      totalPotentialTaxSaved += taxSaved;
      suggestions.push({
        id: `opt_ltcg_${member.id}`,
        category: 'Section 112A LTCG Arbitrage',
        priority: 'HIGH',
        member: member.name,
        title: `Harvest ₹${remainingExemption.toLocaleString('en-IN')} tax-free gains under ${member.name}'s PAN`,
        description: `${member.name} has ₹${remainingExemption.toLocaleString('en-IN')} unexhausted Section 112A annual exemption. Gifting growth assets to book gains here eliminates 12.5% LTCG tax liability.`,
        taxSaved,
        action: `Execute mutual fund rebalancing or equity harvest in ${member.name}'s Demat`,
      });
    });

    // 2. HUF Separate Entity Arbitrage
    if (huf) {
      const huf80cSaving = Math.round(huf.taxMetrics.remaining80C * 0.20);
      const hufSlabSaving = 31200; // independent basic exemption slab shield
      const totalHufSaving = huf80cSaving + hufSlabSaving;
      totalPotentialTaxSaved += totalHufSaving;
      suggestions.push({
        id: 'opt_huf_deduction',
        category: 'HUF Autonomous Legal Shield',
        priority: 'HIGH',
        member: huf.name,
        title: `Partition capital into ${huf.name} for independent 80C & basic exemption`,
        description: `Your HUF possesses an autonomous PAN with its own ₹3,00,000 tax-free slab and ₹1,50,000 Section 80C deduction. Channeling rental yields or ancestral capital here shields ₹4.5L of annual income from your 31.2% personal tax bracket.`,
        taxSaved: totalHufSaving,
        action: 'Route ancestral income or capital into HUF Bank/Demat accounts',
      });
    }

    // 3. Senior Citizen FD / SCSS Exemption (Section 80TTB)
    parents.forEach(parent => {
      const scssSaving = 36800; // 8.2% SCSS + Section 80TTB ₹50k interest exemption vs 31.2% personal bracket
      totalPotentialTaxSaved += scssSaving;
      suggestions.push({
        id: `opt_parent_scss_${parent.id}`,
        category: 'Senior Citizen Arbitrage (Sec 80TTB)',
        priority: 'HIGH',
        member: parent.name,
        title: `Gift funds to ${parent.name} for SCSS (8.2%) & Section 80TTB`,
        description: `Monetary gifts to parents are 100% tax-exempt under Section 56(2) with ZERO clubbing under Section 64. Parents earn 8.2% on Senior Citizen Savings Scheme with ₹50,00,000 tax-free interest, saving tax against your 31.2% slab.`,
        taxSaved: scssSaving,
        action: `Gift ₹15,00,000 to ${parent.name} and open SCSS account in Post Office/SBI`,
      });
    });

    // 4. Section 64 Clubbing Guardrail Warning
    if (spouse) {
      suggestions.push({
        id: 'guard_sec64_clubbing',
        category: 'Section 64 Statutory Guardrail',
        priority: 'ADVISORY',
        member: spouse.name,
        title: `Section 64 Shield: Invest gifts to spouse in Growth Equity, not Fixed Deposits`,
        description: `Under Section 64(1)(iv), interest earned from cash gifted to a spouse is clubbed back into your income. However, investing gifts in non-dividend Growth Equity / Index Funds postpones taxable events until capital gains realization, which is taxed at lower LTCG rates without annual clubbing friction.`,
        taxSaved: 0,
        action: 'Mandate Growth-option funds for all inter-spousal asset transfers',
      });
    }

    res.json({
      success: true,
      market: 'IN',
      currency: 'INR',
      currencySymbol: '₹',
      totalPotentialTaxSaved,
      suggestions,
      memberCount: familyProfiles.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/family/simulate-gifting
async function simulateGifting(req, res) {
  try {
    const { sourceMemberId, targetMemberId, giftAmount = 500000, assetClass = 'FD', market = 'IN', isSpousalSplit = true } = req.body;
    const isUS = market === 'US';

    if (isUS) {
      // ══════════════════════════════════════════════════════════════════════════════
      // US IRS FORM 709 & 529 SUPERFUNDING SIMULATOR
      // ══════════════════════════════════════════════════════════════════════════════
      const source = usFamilyProfiles.find(p => p.id === sourceMemberId) || usFamilyProfiles[0];
      const target = usFamilyProfiles.find(p => p.id === targetMemberId) || usFamilyProfiles[3] || usFamilyProfiles[1];
      const amount = Number(giftAmount) || 36000;

      const annualExclusionPerDonor = 18000;
      const effectiveAnnualExclusion = isSpousalSplit ? annualExclusionPerDonor * 2 : annualExclusionPerDonor;

      let is529Superfunding = assetClass === '529_SUPERFUND';
      let allowedSuperfundLimit = isSpousalSplit ? 180000 : 90000;

      let taxableGift = 0;
      let form709Required = false;
      let complianceNote = '';
      let futureEstateTaxSaved = 0;

      if (is529Superfunding) {
        form709Required = true; // 5-year election MUST be filed on Form 709 Schedule A
        taxableGift = Math.max(0, amount - allowedSuperfundLimit);
        futureEstateTaxSaved = Math.round(amount * 0.40); // 40% top estate tax removal
        complianceNote = `IRC § 529(c)(2)(B) 5-Year Accelerated Election: $${amount.toLocaleString('en-US')} transferred. Form 709 must be filed electing 5-year pro-rata distribution ($${(amount/5).toLocaleString('en-US')}/yr) to avoid consuming lifetime exemption.`;
      } else if (target.relationship === 'Spouse') {
        taxableGift = 0;
        form709Required = false;
        futureEstateTaxSaved = 0;
        complianceNote = 'IRC § 2523 Unlimited Marital Deduction: Gifts between US citizen spouses are 100% tax-free with zero Form 709 reporting required.';
      } else {
        taxableGift = Math.max(0, amount - effectiveAnnualExclusion);
        form709Required = amount > effectiveAnnualExclusion;
        futureEstateTaxSaved = Math.round(amount * 0.40);
        complianceNote = form709Required
          ? `IRC § 2503(b): Exceeds annual exclusion of $${effectiveAnnualExclusion.toLocaleString('en-US')}. Form 709 required. Taxable gift of $${taxableGift.toLocaleString('en-US')} will reduce your $13.61M lifetime unified exemption. $0 gift tax owed today.`
          : `IRC § 2503(b) Compliant: Within annual exclusion limit ($${effectiveAnnualExclusion.toLocaleString('en-US')}). Zero Form 709 reporting required, zero lifetime exemption consumed.`;
      }

      const lifetimeExemption = 13610000;
      const lifetimeRemainingAfterGift = Math.max(0, lifetimeExemption - taxableGift);

      return res.json({
        success: true,
        market: 'US',
        simulation: {
          sourceName: source.name,
          targetName: target.name,
          giftAmount: amount,
          assetClass,
          isSpousalSplit,
          annualExclusionApplied: Math.min(amount, effectiveAnnualExclusion),
          taxableGift,
          form709Required,
          lifetimeExemptionRemaining: lifetimeRemainingAfterGift,
          giftTaxDueNow: 0, // Absorbed by $13.61M unified exemption
          futureEstateTaxSaved,
          complianceNote,
          giftDeedStatus: form709Required ? 'IRS Form 709 Gift Tax Return Required by April 15' : 'Exempt Transfer — No IRS reporting required',
        }
      });
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // INDIA SECTION 56 & 64 SIMULATOR (DEFAULT)
    // ══════════════════════════════════════════════════════════════════════════════
    const source = familyProfiles.find(p => p.id === sourceMemberId) || familyProfiles[0];
    const target = familyProfiles.find(p => p.id === targetMemberId) || familyProfiles[1] || familyProfiles[0];

    const amount = Number(giftAmount) || 500000;
    const sourceRate = source.taxMetrics?.effectiveTaxRate || 0.312;
    const targetRate = target.taxMetrics?.effectiveTaxRate || 0.052;

    let annualTaxDelta = 0;
    let clubbingRisk = false;
    let complianceNote = '';

    if (assetClass === 'FD' || assetClass === 'DEBT') {
      const estimatedYield = 0.072; // 7.2% FD yield
      const annualYieldAmount = amount * estimatedYield;
      const donorTax = annualYieldAmount * sourceRate;
      const recipientTax = annualYieldAmount * targetRate;
      annualTaxDelta = Math.round(donorTax - recipientTax);

      if (target.relationship === 'Spouse' || target.relationship === 'Child') {
        clubbingRisk = true;
        complianceNote = `Caution: Section 64(1)(iv) triggers clubbing on interest income back to ${source.name}. To avoid this, invest the gift in Growth Equity or Index Funds where return is in capital gains, not annual interest.`;
      } else {
        clubbingRisk = false;
        complianceNote = `Fully compliant under Section 56(2)(x) & Section 64. Gifts to parents or HUF are exempt with zero clubbing of interest income.`;
      }
    } else if (assetClass === 'SCSS' && target.isSeniorCitizen) {
      const scssYield = 0.082;
      const normalYield = 0.071;
      const parentNetReturn = (amount * scssYield) * (1 - targetRate);
      const donorNetReturn = (amount * normalYield) * (1 - sourceRate);
      annualTaxDelta = Math.round(parentNetReturn - donorNetReturn);
      complianceNote = `Optimal Senior Citizen Arbitrage: 8.2% SCSS backed by Government of India with Section 80TTB (₹50k tax-free interest). Zero clubbing under Section 64.`;
    } else {
      // Equity / Capital Gains Arbitrage
      const estimatedGain = amount * 0.12; // 12% annual gain
      const usableExemption = Math.min(estimatedGain, target.taxMetrics?.ltcgExemptionRemaining || 125000);
      annualTaxDelta = Math.round(usableExemption * 0.125);
      complianceNote = `Section 112A Exemption Utilization: Harvesting capital gains under ${target.name}'s independent ₹1.25L threshold eliminates 12.5% LTCG tax.`;
    }

    res.json({
      success: true,
      market: 'IN',
      simulation: {
        sourceName: source.name,
        targetName: target.name,
        giftAmount: amount,
        assetClass,
        donorTaxRatePct: Math.round(sourceRate * 100),
        recipientTaxRatePct: Math.round(targetRate * 100),
        annualTaxDelta: Math.max(0, annualTaxDelta),
        clubbingRisk,
        complianceNote,
        giftDeedRequired: amount >= 50000,
        giftDeedStatus: amount >= 50000 ? 'Formal Gift Deed on stamp paper advised for IT audit record' : 'Informal relative transfer under Section 56(2)',
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getProfiles, addOrUpdateProfile, optimizeTax, simulateGifting };
