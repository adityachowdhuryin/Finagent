// Indian Direct Tax Engine — FY 2025-26 & FY 2026-27 rules
// Updated with post-July 2024 budget statutory amendments:
// - Section 111A: Equity/MF STCG flat 20%
// - Section 112A: Equity/MF LTCG flat 12.5% above ₹1.25L exemption
// - Section 115BAC: New tax regime slabs with ₹75k standard deduction and Section 87A rebate up to ₹7L (tax = 0)
// - Section 87A marginal relief for incomes between ₹7L and ₹7.27L
// - Old regime slabs with Section 87A rebate up to ₹5L (tax = 0) and ₹50k standard deduction
// - Surcharge and 4% Health & Education Cess

export const TAX_RATES = {
  STCG_EQUITY: 0.20,      // 20% flat (Section 111A)
  LTCG_EQUITY: 0.125,     // 12.5% flat (Section 112A)
  LTCG_EXEMPTION: 125000, // ₹1.25 Lakh per financial year
  STCG_DEBT: 0.30,        // Taxed at marginal slab rate
  LTCG_DEBT: 0.20,        // 20%
  STD_DEDUCTION_NEW: 75000, // Budget 2024 revised standard deduction
  STD_DEDUCTION_OLD: 50000, // Old regime standard deduction
  REBATE_87A_NEW_LIMIT: 700000, // Full rebate if taxable income <= 7L
  REBATE_87A_OLD_LIMIT: 500000, // Full rebate if taxable income <= 5L
  CESS_RATE: 0.04,        // 4% Health & Education Cess
};

export function classifyHolding(holdingDays, assetClass = 'equity') {
  if (assetClass === 'equity' || assetClass === 'mf_equity') {
    return holdingDays >= 365 ? 'LTCG' : 'STCG';
  }
  if (assetClass === 'mf_debt') {
    return holdingDays >= 1095 ? 'LTCG' : 'STCG';
  }
  return holdingDays >= 365 ? 'LTCG' : 'STCG';
}

/**
 * Calculates tax on capital gains under Section 111A and Section 112A.
 */
export function calculateTaxOnGain(gain, gainType) {
  if (gainType === 'LTCG') {
    const taxableGain = Math.max(0, gain - TAX_RATES.LTCG_EXEMPTION);
    return taxableGain * TAX_RATES.LTCG_EQUITY;
  }
  return gain * TAX_RATES.STCG_EQUITY;
}

/**
 * Calculates tax under the New Regime (Section 115BAC) for FY 2025-26.
 * Slabs:
 *   Up to ₹3,00,000: Nil
 *   ₹3,00,001 – ₹7,00,000: 5% (max ₹20,000)
 *   ₹7,00,001 – ₹10,00,000: 10% (max ₹30,000)
 *   ₹10,00,001 – ₹12,00,000: 15% (max ₹30,000)
 *   ₹12,00,001 – ₹15,00,000: 20% (max ₹60,000)
 *   Above ₹15,00,000: 30%
 * Includes Section 87A rebate (₹0 tax if taxable income <= ₹7L)
 * and Marginal Relief for taxable incomes between ₹7,00,000 and ₹7,27,778.
 */
export function calcNewRegimeTax(taxableIncome) {
  if (taxableIncome <= 300000) return 0;

  let tax = 0;
  if (taxableIncome <= 700000) {
    tax = (taxableIncome - 300000) * 0.05;
  } else if (taxableIncome <= 1000000) {
    tax = 20000 + (taxableIncome - 700000) * 0.10;
  } else if (taxableIncome <= 1200000) {
    tax = 50000 + (taxableIncome - 1000000) * 0.15;
  } else if (taxableIncome <= 1500000) {
    tax = 80000 + (taxableIncome - 1200000) * 0.20;
  } else {
    tax = 140000 + (taxableIncome - 1500000) * 0.30;
  }

  // Section 87A rebate: zero tax if taxable income <= ₹7 Lakhs
  if (taxableIncome <= TAX_RATES.REBATE_87A_NEW_LIMIT) {
    tax = 0;
  } else if (taxableIncome <= 727778) {
    // Marginal relief under Section 87A: tax cannot exceed income in excess of ₹7L
    const excessIncome = taxableIncome - TAX_RATES.REBATE_87A_NEW_LIMIT;
    if (tax > excessIncome) {
      tax = excessIncome;
    }
  }

  // Surcharge for high net-worth individuals
  let surcharge = 0;
  if (taxableIncome > 20000000) {
    surcharge = tax * 0.25; // Capped at 25% under New Regime
  } else if (taxableIncome > 10000000) {
    surcharge = tax * 0.15;
  } else if (taxableIncome > 5000000) {
    surcharge = tax * 0.10;
  }

  const cess = Math.round((tax + surcharge) * TAX_RATES.CESS_RATE);
  return Math.round(tax + surcharge + cess);
}

/**
 * Calculates tax under the Old Regime for FY 2025-26.
 * Slabs (for individuals under 60 years):
 *   Up to ₹2,50,000: Nil
 *   ₹2,50,001 – ₹5,00,000: 5% (max ₹12,500)
 *   ₹5,00,001 – ₹10,00,000: 20% (max ₹1,00,000)
 *   Above ₹10,00,000: 30%
 * Includes Section 87A rebate (₹0 tax if taxable income <= ₹5L).
 */
export function calcOldRegimeTax(taxableIncome, age = 30) {
  const basicExempt = age >= 80 ? 500000 : age >= 60 ? 300000 : 250000;
  if (taxableIncome <= basicExempt) return 0;

  let tax = 0;
  if (taxableIncome <= 500000) {
    tax = (taxableIncome - basicExempt) * 0.05;
  } else if (taxableIncome <= 1000000) {
    tax = (500000 - basicExempt) * 0.05 + (taxableIncome - 500000) * 0.20;
  } else {
    tax = (500000 - basicExempt) * 0.05 + 100000 + (taxableIncome - 1000000) * 0.30;
  }

  // Section 87A rebate: zero tax if taxable income <= ₹5 Lakhs
  if (taxableIncome <= TAX_RATES.REBATE_87A_OLD_LIMIT) {
    tax = 0;
  }

  // Surcharge
  let surcharge = 0;
  if (taxableIncome > 50000000) {
    surcharge = tax * 0.37;
  } else if (taxableIncome > 20000000) {
    surcharge = tax * 0.25;
  } else if (taxableIncome > 10000000) {
    surcharge = tax * 0.15;
  } else if (taxableIncome > 5000000) {
    surcharge = tax * 0.10;
  }

  const cess = Math.round((tax + surcharge) * TAX_RATES.CESS_RATE);
  return Math.round(tax + surcharge + cess);
}

/**
 * Calculates the exact breakeven deductions needed for Old Regime to beat New Regime.
 */
export function findBreakevenDeductions(grossIncome, isSalaried = true, age = 30) {
  const stdDeductionNew = isSalaried ? TAX_RATES.STD_DEDUCTION_NEW : 0;
  const stdDeductionOld = isSalaried ? TAX_RATES.STD_DEDUCTION_OLD : 0;
  const taxableNew = Math.max(0, grossIncome - stdDeductionNew);
  
  const taxNew = calcNewRegimeTax(taxableNew);
  const targetOldTax = Math.round(taxNew / 1.04); // Before cess
  
  const basicExempt = age >= 80 ? 500000 : age >= 60 ? 300000 : 250000;
  let targetTaxableOld = 0;
  
  if (targetOldTax === 0) {
    targetTaxableOld = TAX_RATES.REBATE_87A_OLD_LIMIT;
  } else if (targetOldTax <= 12500) {
    targetTaxableOld = basicExempt + (targetOldTax / 0.05);
  } else if (targetOldTax <= 112500) {
    targetTaxableOld = 500000 + ((targetOldTax - 12500) / 0.20);
  } else {
    targetTaxableOld = 1000000 + ((targetOldTax - 112500) / 0.30);
  }
  
  const totalDeductionsNeeded = Math.max(0, grossIncome - targetTaxableOld);
  const extraDeductionsExclStd = Math.max(0, totalDeductionsNeeded - stdDeductionOld);
  
  return {
    taxNew,
    targetTaxableOld: Math.round(targetTaxableOld),
    totalDeductionsNeeded: Math.round(totalDeductionsNeeded),
    extraDeductionsExclStd: Math.round(extraDeductionsExclStd),
  };
}

/**
 * Tax-Loss Harvesting Savings Simulator
 */
export function calculateHarvestingSavings(realizedGains, harvestableLosses) {
  const stcgGains = realizedGains.filter(g => g.type === 'STCG').reduce((s, g) => s + g.gain, 0);
  const ltcgGains = realizedGains.filter(g => g.type === 'LTCG').reduce((s, g) => s + g.gain, 0);
  const stcgLosses = harvestableLosses.filter(l => l.type === 'STCG').reduce((s, l) => s + Math.abs(l.loss), 0);
  const ltcgLosses = harvestableLosses.filter(l => l.type === 'LTCG').reduce((s, l) => s + Math.abs(l.loss), 0);

  // STCG losses offset STCG gains first, then LTCG gains
  const netStcgGain = Math.max(0, stcgGains - stcgLosses);
  const remainingStcgLoss = Math.max(0, stcgLosses - stcgGains);
  const netLtcgGain = Math.max(0, ltcgGains - ltcgLosses - remainingStcgLoss);

  const taxWithoutHarvest = calculateTaxOnGain(stcgGains, 'STCG') + calculateTaxOnGain(ltcgGains, 'LTCG');
  const taxWithHarvest = calculateTaxOnGain(netStcgGain, 'STCG') + calculateTaxOnGain(netLtcgGain, 'LTCG');

  return {
    stcgGains, ltcgGains, stcgLosses, ltcgLosses,
    netStcgGain, netLtcgGain,
    taxWithoutHarvest, taxWithHarvest,
    taxSaved: Math.max(0, taxWithoutHarvest - taxWithHarvest),
  };
}

// Sample realized gains for FY 2025-26
export const realizedGainsFY26 = [
  { holding: 'Bajaj Finance Ltd.', gain: 22025, type: 'LTCG', date: '2026-06-15' },
  { holding: 'ICICI Bank Ltd.', gain: 14244, type: 'LTCG', date: '2026-04-20' },
  { holding: 'Axis Bank Ltd.', gain: 8400, type: 'STCG', date: '2026-07-10' },
  { holding: 'SBI Liquid Fund (partial)', gain: 12800, type: 'STCG', date: '2026-05-01' },
  { holding: 'HDFC Bank Ltd. (partial)', gain: 29951, type: 'LTCG', date: '2026-03-25' },
];

export const harvestablePositions = [
  { holding: 'Axis Bluechip Direct Growth', loss: -26960, type: 'STCG', holdingDays: 320, action: 'Sell & reinvest after 30 days', washSaleRisk: false },
  { holding: 'Zomato Ltd.', loss: -5675, type: 'STCG', holdingDays: 95, action: 'Sell & wait 30 days', washSaleRisk: true },
  { holding: 'ITC Ltd.', loss: -16560, type: 'STCG', holdingDays: 210, action: 'Sell & replace with similar', washSaleRisk: false },
  { holding: 'Infosys Ltd.', loss: -10266, type: 'STCG', holdingDays: 185, action: 'Sell & replace with TCS', washSaleRisk: false },
];
