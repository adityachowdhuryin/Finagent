// server/routes/ctcOptimizer.js
// AI CTC & Salary Tax Structuring Engine: Maximizes in-hand monthly salary via 80CCD(2) Corporate NPS & flexi-perks

const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

function computeTaxes(taxableIncome, isNewRegime = true) {
  if (isNewRegime) {
    // FY 2026-27 New Tax Regime Slabs
    // 0 - 3L: 0%
    // 3L - 7L: 5%
    // 7L - 10L: 10%
    // 10L - 12L: 15%
    // 12L - 15L: 20%
    // > 15L: 30%
    // Standard deduction: 75,000
    const net = Math.max(0, taxableIncome - 75000);
    if (net <= 700000) return 0; // Section 87A rebate

    let tax = 0;
    if (net > 300000) tax += Math.min(400000, net - 300000) * 0.05;
    if (net > 700000) tax += Math.min(300000, net - 700000) * 0.10;
    if (net > 1000000) tax += Math.min(200000, net - 1000000) * 0.15;
    if (net > 1200000) tax += Math.min(300000, net - 1200000) * 0.20;
    if (net > 1500000) tax += (net - 1500000) * 0.30;

    return Math.round(tax * 1.04); // + 4% cess
  } else {
    // Old Tax Regime Slabs
    // Standard deduction: 50,000
    const net = Math.max(0, taxableIncome - 50000);
    if (net <= 500000) return 0;

    let tax = 0;
    if (net > 250000) tax += Math.min(250000, net - 250000) * 0.05;
    if (net > 500000) tax += Math.min(500000, net - 500000) * 0.20;
    if (net > 1000000) tax += (net - 1000000) * 0.30;

    return Math.round(tax * 1.04);
  }
}

function optimizeCTCStructure(ctc = 2400000) {
  const basic = Math.round(ctc * 0.40); // 40% Basic
  const hra = Math.round(basic * 0.40); // 40% HRA
  const employerPF = Math.round(basic * 0.12); // 12% PF

  // Unoptimized (Typical corporate default)
  const currentSpecialAllowance = ctc - (basic + hra + employerPF);
  const currentTaxable = basic + hra + currentSpecialAllowance;
  const currentNewTax = computeTaxes(currentTaxable, true);
  const currentOldTax = computeTaxes(currentTaxable - 150000 - 25000 - 180000, false); // 80C + 80D + HRA
  const currentBestTax = Math.min(currentNewTax, currentOldTax);

  // OPTIMIZED STRUCTURE
  // 1. Corporate NPS 80CCD(2): 10% of Basic salary tax-free
  const corporateNPS = Math.round(basic * 0.10);
  // 2. Tax-Free Flexi Allowances (Books, Telephone, Food Card)
  const telephoneReimbursement = 36000;
  const mealCoupons = 26400; // 2200/mo
  const booksPeriodicals = 24000;
  const totalFlexi = telephoneReimbursement + mealCoupons + booksPeriodicals;

  const optimizedSpecialAllowance = Math.max(0, ctc - (basic + hra + employerPF + corporateNPS + totalFlexi));
  const optimizedTaxable = basic + hra + optimizedSpecialAllowance;

  // New regime allows 80CCD(2) employer NPS deduction!
  const optimizedNewTax = computeTaxes(optimizedTaxable - corporateNPS, true);
  const optimizedOldTax = computeTaxes(optimizedTaxable - corporateNPS - 150000 - 25000 - 180000, false);
  const optimizedBestTax = Math.min(optimizedNewTax, optimizedOldTax);

  const annualTaxSaved = Math.max(0, currentBestTax - optimizedBestTax);
  const monthlyInHandIncrease = Math.round(annualTaxSaved / 12);

  return {
    ctc,
    current: {
      basic,
      hra,
      employerPF,
      specialAllowance: currentSpecialAllowance,
      corporateNPS: 0,
      flexiAllowances: 0,
      annualTax: currentBestTax,
      regime: currentNewTax <= currentOldTax ? 'New Tax Regime' : 'Old Tax Regime',
      monthlyInHand: Math.round((ctc - currentBestTax - employerPF) / 12),
    },
    optimized: {
      basic,
      hra,
      employerPF,
      corporateNPS,
      flexiAllowances: totalFlexi,
      specialAllowance: optimizedSpecialAllowance,
      annualTax: optimizedBestTax,
      regime: optimizedNewTax <= optimizedOldTax ? 'New Tax Regime (with 80CCD2)' : 'Old Tax Regime',
      monthlyInHand: Math.round((ctc - optimizedBestTax - employerPF - corporateNPS) / 12),
    },
    annualTaxSaved,
    monthlyInHandIncrease,
    breakdown: [
      {
        benefit: 'Section 80CCD(2) Corporate NPS (10% Basic)',
        annualDeduction: corporateNPS,
        taxSaved: Math.round(corporateNPS * 0.312),
        legalClause: 'Tax-exempt under both Old and New regimes with no upper ceiling.',
      },
      {
        benefit: 'Tax-Free Internet & Telephone Allowance',
        annualDeduction: telephoneReimbursement,
        taxSaved: Math.round(telephoneReimbursement * 0.312),
        legalClause: 'Rule 3(7)(ix) - Actual bill submission.',
      },
      {
        benefit: 'Food / Meal Card Subsidies (Sodexo/Zeta)',
        annualDeduction: mealCoupons,
        taxSaved: Math.round(mealCoupons * 0.312),
        legalClause: '₹50/meal for 2 meals/day, 22 working days/mo.',
      },
      {
        benefit: 'Books & Periodicals Allowance',
        annualDeduction: booksPeriodicals,
        taxSaved: Math.round(booksPeriodicals * 0.312),
        legalClause: 'Exempt against valid invoices under Sec 10(14)(i).',
      },
    ],
  };
}

// POST /api/ctc/optimize
async function optimizeCTC(req, res) {
  try {
    const { ctc = 2400000, isSample } = req.body || {};
    const result = optimizeCTCStructure(Number(ctc) || 2400000);
    res.json({
      success: true,
      isSimulated: Boolean(isSample),
      data: result,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { optimizeCTC };
