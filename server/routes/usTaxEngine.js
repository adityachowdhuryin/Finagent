// US Federal & State Tax Engine (IRS 2024-2025 Form 1040 & State Calculations)

const FEDERAL_BRACKETS_2024_2025 = {
  single: [
    { cap: 11600, rate: 0.10 },
    { cap: 47150, rate: 0.12 },
    { cap: 100525, rate: 0.22 },
    { cap: 191950, rate: 0.24 },
    { cap: 243725, rate: 0.32 },
    { cap: 609350, rate: 0.35 },
    { cap: Infinity, rate: 0.37 },
  ],
  mfj: [
    { cap: 23200, rate: 0.10 },
    { cap: 94300, rate: 0.12 },
    { cap: 201050, rate: 0.22 },
    { cap: 383900, rate: 0.24 },
    { cap: 487450, rate: 0.32 },
    { cap: 731200, rate: 0.35 },
    { cap: Infinity, rate: 0.37 },
  ],
};

const STANDARD_DEDUCTION = {
  single: 14600,
  mfj: 29200,
};

const FICA_CONFIG = {
  ssWageCap: 168600, // 2024 ($176,100 for 2025)
  ssRate: 0.062,
  medicareRate: 0.0145,
  addlMedicareThreshold: { single: 200000, mfj: 250000 },
  addlMedicareRate: 0.009,
};

const STATE_RATES = {
  CA: [
    { cap: 10412, rate: 0.01 },
    { cap: 24684, rate: 0.02 },
    { cap: 38959, rate: 0.04 },
    { cap: 54081, rate: 0.06 },
    { cap: 68350, rate: 0.08 },
    { cap: 349137, rate: 0.093 },
    { cap: 418961, rate: 0.103 },
    { cap: 698271, rate: 0.113 },
    { cap: Infinity, rate: 0.123 },
  ],
  NY: [
    { cap: 8500, rate: 0.04 },
    { cap: 11700, rate: 0.045 },
    { cap: 13900, rate: 0.0525 },
    { cap: 80650, rate: 0.055 },
    { cap: 215400, rate: 0.06 },
    { cap: 1077550, rate: 0.0685 },
    { cap: 5000000, rate: 0.0965 },
    { cap: Infinity, rate: 0.109 },
  ],
  TX: [], // 0% state income tax
  FL: [], // 0% state income tax
  WA: [], // 0% income tax (7% capital gains over $262k)
};

function computeProgressiveTax(income, brackets) {
  if (income <= 0 || !brackets || brackets.length === 0) return 0;
  let tax = 0;
  let prevCap = 0;

  for (const b of brackets) {
    if (income > prevCap) {
      const taxableInBracket = Math.min(income, b.cap) - prevCap;
      tax += taxableInBracket * b.rate;
      prevCap = b.cap;
    } else {
      break;
    }
  }
  return Math.round(tax);
}

// POST /api/us-tax/estimate
async function estimateUSTax(req, res) {
  try {
    const {
      grossIncome = 150000,
      filingStatus = 'single', // 'single' | 'mfj'
      state = 'CA', // 'CA' | 'NY' | 'TX' | 'FL' | 'WA'
      traditional401k = 23000,
      hsa = 4150,
      fsa = 0,
      shortTermCapGains = 0,
      longTermCapGains = 0,
    } = req.body;

    const brackets = FEDERAL_BRACKETS_2024_2025[filingStatus] || FEDERAL_BRACKETS_2024_2025.single;
    const stdDeduction = STANDARD_DEDUCTION[filingStatus] || STANDARD_DEDUCTION.single;

    // 1. Above-the-line Pre-tax Deductions
    const preTaxDeductions = (Number(traditional401k) || 0) + (Number(hsa) || 0) + (Number(fsa) || 0);
    const agi = Math.max(0, grossIncome - preTaxDeductions + Number(shortTermCapGains));

    // 2. Taxable Income
    const taxableOrdinaryIncome = Math.max(0, agi - stdDeduction);

    // 3. Federal Ordinary Income Tax
    const federalTax = computeProgressiveTax(taxableOrdinaryIncome, brackets);

    // 4. Federal Long-Term Capital Gains Tax (0%, 15%, 20%)
    let ltcgTax = 0;
    const ltcg = Number(longTermCapGains) || 0;
    if (ltcg > 0) {
      const ltcgThresholds = filingStatus === 'mfj' ? { t15: 94050, t20: 583750 } : { t15: 47025, t20: 518900 };
      const totalIncome = taxableOrdinaryIncome + ltcg;

      if (totalIncome > ltcgThresholds.t20) {
        const topChunk = Math.min(ltcg, totalIncome - ltcgThresholds.t20);
        const midChunk = ltcg - topChunk;
        ltcgTax = topChunk * 0.20 + midChunk * 0.15;
      } else if (totalIncome > ltcgThresholds.t15) {
        ltcgTax = ltcg * 0.15;
      }
    }
    ltcgTax = Math.round(ltcgTax);

    // 5. Net Investment Income Tax (NIIT 3.8% if MAGI > $200k/$250k)
    const niitThreshold = filingStatus === 'mfj' ? 250000 : 200000;
    const investmentIncome = (Number(shortTermCapGains) || 0) + ltcg;
    let niitTax = 0;
    if (agi > niitThreshold && investmentIncome > 0) {
      const excessAgi = agi - niitThreshold;
      niitTax = Math.round(Math.min(excessAgi, investmentIncome) * 0.038);
    }

    // 6. FICA (Social Security & Medicare)
    const ssTaxable = Math.min(grossIncome, FICA_CONFIG.ssWageCap);
    const socialSecurityTax = Math.round(ssTaxable * FICA_CONFIG.ssRate);
    const medicareTax = Math.round(grossIncome * FICA_CONFIG.medicareRate);
    const addlMedicareThreshold = FICA_CONFIG.addlMedicareThreshold[filingStatus] || 200000;
    const addlMedicareTax = grossIncome > addlMedicareThreshold
      ? Math.round((grossIncome - addlMedicareThreshold) * FICA_CONFIG.addlMedicareRate)
      : 0;
    const totalFICA = socialSecurityTax + medicareTax + addlMedicareTax;

    // 7. State Income Tax
    const stateBrackets = STATE_RATES[state] || STATE_RATES.CA;
    const stateTaxable = Math.max(0, grossIncome - preTaxDeductions - 5000); // Standard state deduction proxy
    let stateTax = computeProgressiveTax(stateTaxable, stateBrackets);
    if (state === 'CA' && stateTaxable > 1000000) {
      stateTax += (stateTaxable - 1000000) * 0.01; // CA Mental Health 1% surtax
    }
    stateTax = Math.round(stateTax);

    // Total & Net Take-home
    const totalTax = federalTax + ltcgTax + niitTax + stateTax + totalFICA;
    const effectiveTaxRate = grossIncome > 0 ? Number(((totalTax / grossIncome) * 100).toFixed(2)) : 0;
    const netTakeHome = grossIncome - totalTax;
    const monthlyTakeHome = Math.round(netTakeHome / 12);

    res.json({
      success: true,
      summary: {
        grossIncome,
        preTaxDeductions,
        agi,
        standardDeduction: stdDeduction,
        taxableIncome: taxableOrdinaryIncome,
        federalTax,
        ltcgTax,
        niitTax,
        stateTax,
        socialSecurityTax,
        medicareTax: medicareTax + addlMedicareTax,
        totalFICA,
        totalTax,
        effectiveTaxRate,
        netTakeHome,
        monthlyTakeHome,
        state,
        filingStatus,
      },
      optimizationTips: [
        traditional401k < 23000
          ? `You have $${(23000 - traditional401k).toLocaleString()} remaining in elective 401(k) space. Maxing this saves ~$${Math.round((23000 - traditional401k) * 0.32).toLocaleString()} in taxes.`
          : '✓ Fully maxed out 2024/2025 401(k) elective deferral limit ($23,000).',
        hsa < 4150
          ? 'An HSA provides triple tax savings (pre-tax, tax-free growth, tax-free medical withdrawal).'
          : '✓ Maxing out annual HSA contributions ($4,150 single / $8,300 family).',
        state === 'CA' || state === 'NY'
          ? `High state income tax jurisdiction (${state}). Prioritize municipal bonds or Treasury Bills (exempt from state income tax).`
          : `${state} has 0% state income tax on W-2 earned wages.`,
      ],
      form1040Schedule: {
        line1_wages: grossIncome,
        line9_totalIncome: grossIncome,
        line11_agi: agi,
        line12_standardDeduction: stdDeduction,
        line15_taxableIncome: taxableOrdinaryIncome,
        line24_totalTax: federalTax + ltcgTax + niitTax,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { estimateUSTax };
