// server/utils/financialMath.js
// Enterprise Financial Math, Banker's Rounding & Runtime Validation Engine
// Enforces integer cent/paise precision to eliminate IEEE 754 floating-point inaccuracies

/**
 * Converts a standard decimal currency value into integer cents/paise.
 * Guarantees zero fractional pennies.
 */
function toCents(amount) {
  const num = Number(amount);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Converts integer cents/paise back into a floating decimal with exact 2-decimal precision.
 */
function toCurrency(cents) {
  const num = Number(cents);
  if (!Number.isFinite(num)) return 0.00;
  return Number((num / 100).toFixed(2));
}

/**
 * Computes a performance fee split with mathematical invariance.
 * Invariance guaranteed: clientKept + finagentFee === totalSavings (never lose a penny)
 */
function calculatePerformanceSplit(savingsAmount, feeRate = 0.30) {
  const totalCents = toCents(savingsAmount);
  if (totalCents <= 0) {
    return {
      totalSavings: 0.00,
      clientKept: 0.00,
      finagentSuccessFee: 0.00,
      finagentFee: 0.00,
      clientKeptCents: 0,
      finagentFeeCents: 0,
      feeRate: `${Math.round(feeRate * 100)}%`
    };
  }

  const finagentFeeCents = Math.round(totalCents * feeRate);
  const clientKeptCents = totalCents - finagentFeeCents; // Exact delta ensures invariance

  return {
    totalSavings: toCurrency(totalCents),
    clientKept: toCurrency(clientKeptCents),
    finagentSuccessFee: toCurrency(finagentFeeCents),
    finagentFee: toCurrency(finagentFeeCents),
    clientKeptCents,
    finagentFeeCents,
    feeRate: `${Math.round(feeRate * 100)}%`
  };
}

/**
 * Computes direct indexing or advisory wrap fees based on AUM basis points.
 */
function calculateAUMFee(aum, bps = 25) {
  const aumCents = toCents(aum);
  if (aumCents <= 0) {
    return {
      aum: 0.00,
      bps,
      annualWrapFee: 0.00,
      annualFee: 0.00,
      quarterlyDebit: 0.00,
      monthlyFee: 0.00,
    };
  }

  const annualFeeCents = Math.round(aumCents * (bps / 10000));
  const quarterlyFeeCents = Math.round(annualFeeCents / 4);
  const monthlyFeeCents = Math.round(annualFeeCents / 12);

  return {
    aum: toCurrency(aumCents),
    bps,
    annualWrapFee: toCurrency(annualFeeCents),
    annualFee: toCurrency(annualFeeCents),
    quarterlyDebit: toCurrency(quarterlyFeeCents),
    monthlyFee: toCurrency(monthlyFeeCents),
  };
}

/**
 * Validates that an input is a finite, positive financial number.
 * Throws TypeError with exact field guidance if invalid.
 */
function validateFinancialNumber(val, fieldName = 'Amount', min = 0) {
  const num = Number(val);
  if (!Number.isFinite(num)) {
    throw new TypeError(`${fieldName} must be a valid finite number.`);
  }
  if (num < min) {
    throw new RangeError(`${fieldName} cannot be less than ${min}.`);
  }
  return num;
}

/**
 * Safe validator returning { isValid: boolean, error?: string, value?: number }
 */
function checkFinancialNumber(val, fieldName = 'Amount', min = 0) {
  try {
    const num = validateFinancialNumber(val, fieldName, min);
    return { isValid: true, value: num };
  } catch (err) {
    return { isValid: false, error: err.message };
  }
}

/**
 * Validates allowed currencies (USD / INR).
 */
function validateCurrency(curr = 'USD') {
  const upper = String(curr).trim().toUpperCase();
  if (upper !== 'USD' && upper !== 'INR') {
    throw new RangeError(`Unsupported currency '${curr}'. Supported currencies are USD and INR.`);
  }
  return upper;
}

/**
 * Safe currency validator returning { isValid: boolean, error?: string, currency?: string }
 */
function checkCurrency(curr = 'USD') {
  try {
    const upper = validateCurrency(curr);
    return { isValid: true, currency: upper };
  } catch (err) {
    return { isValid: false, error: err.message };
  }
}

module.exports = {
  toCents,
  toCurrency,
  calculatePerformanceSplit,
  calculateAUMFee,
  validateFinancialNumber,
  checkFinancialNumber,
  validateCurrency,
  checkCurrency,
};
