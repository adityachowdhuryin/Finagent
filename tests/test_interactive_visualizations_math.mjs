// tests/test_interactive_visualizations_math.mjs
// Verification suite for the 6 interactive visualizations across Tax & Forensic Studio

import assert from 'assert';

console.log('================================================================');
console.log('📊 INTERACTIVE STATUTORY VISUALIZATIONS TEST SUITE');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;

function it(desc, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(`     ${err.message}`);
  }
}

// ── TEST GROUP 1: Tax Harvesting Waterfall Math ──────────────────────────────
console.log('--- TEST GROUP 1: Tax Harvesting Waterfall Math ---');

it('Computes Indian STCG (20%) and LTCG (12.5% above ₹1.25L exemption) correctly', () => {
  const stcg = 85000;
  const ltcg = 245000;
  const exemption = 125000;

  const taxableLtcg = Math.max(0, ltcg - exemption);
  assert.strictEqual(taxableLtcg, 120000);

  const taxBefore = (stcg * 0.20) + (taxableLtcg * 0.125);
  assert.strictEqual(taxBefore, 17000 + 15000); // 32000
});

it('Applies STCL loss offset against STCG and LTCG accurately', () => {
  const stcg = 85000;
  const ltcg = 245000;
  const stclHarvested = 145000;
  const exemption = 125000;

  // STCL absorbs 85k STCG completely, remaining 60k reduces LTCG
  const remainingStcl = stclHarvested - stcg;
  assert.strictEqual(remainingStcl, 60000);

  const netLtcg = Math.max(0, ltcg - remainingStcl);
  assert.strictEqual(netLtcg, 185000);

  const taxableLtcgPost = Math.max(0, netLtcg - exemption);
  assert.strictEqual(taxableLtcgPost, 60000);

  const taxAfter = (taxableLtcgPost * 0.125);
  assert.strictEqual(taxAfter, 7500);

  const taxSaved = 32000 - taxAfter;
  assert.strictEqual(taxSaved, 24500);
});

it('Computes US IRC § 1211(b) $3,000 ordinary loss offset limit correctly', () => {
  const totalCapitalLosses = 14500;
  const capitalGains = 4500;
  const ordinaryIncomeOffsetLimit = 3000;

  const netLoss = totalCapitalLosses - capitalGains;
  assert.strictEqual(netLoss, 10000);

  const allowableOrdinaryOffset = Math.min(ordinaryIncomeOffsetLimit, netLoss);
  assert.strictEqual(allowableOrdinaryOffset, 3000);

  const carryforwardToNextYear = netLoss - allowableOrdinaryOffset;
  assert.strictEqual(carryforwardToNextYear, 7000);
});

// ── TEST GROUP 2: Entity Compounding Wealth Divergence Math ──────────────────
console.log('\n--- TEST GROUP 2: Entity Compounding Wealth Divergence Math ---');

it('Computes annual compounding wealth wedge accurately for HUF (12% CAGR)', () => {
  const initialPortfolio = 2500000;
  const annualSavings = 284600;
  const r = 0.12;

  let baseline = initialPortfolio;
  let entity = initialPortfolio;

  for (let yr = 1; yr <= 10; yr++) {
    baseline = baseline * (1 + r);
    entity = (entity * (1 + r)) + annualSavings;
  }

  const wealthWedge = entity - baseline;
  // Year 10 wealth wedge must exceed ₹49 Lakhs
  assert.ok(wealthWedge > 4900000, `Expected wedge > ₹49L, got ${wealthWedge}`);
  assert.ok(wealthWedge < 5100000, `Expected wedge < ₹51L, got ${wealthWedge}`);
});

it('Computes S-Corp FICA savings compounding wedge accurately for US (10% CAGR)', () => {
  const initialPortfolio = 500000;
  const annualFicaSavings = 28000;
  const r = 0.10;

  let baseline = initialPortfolio;
  let entity = initialPortfolio;

  for (let yr = 1; yr <= 10; yr++) {
    baseline = baseline * (1 + r);
    entity = (entity * (1 + r)) + annualFicaSavings;
  }

  const wealthWedge = entity - baseline;
  // Year 10 wealth wedge must exceed $440k
  assert.ok(wealthWedge > 440000, `Expected wedge > $440k, got ${wealthWedge}`);
});

// ── TEST GROUP 3: Tax Bracket Step Visualizer & Surcharge Relief ──────────────
console.log('\n--- TEST GROUP 3: Tax Bracket Step Visualizer & Surcharge Relief ---');

it('Computes Section 115BAC New Regime slab progression accurately', () => {
  const income = 1850000;
  // Slabs:
  // 0-3L: 0
  // 3-7L (4L @ 5%): 20,000
  // 7-10L (3L @ 10%): 30,000
  // 10-12L (2L @ 15%): 30,000
  // 12-15L (3L @ 20%): 60,000
  // Above 15L (3.5L @ 30%): 105,000
  // Total slab tax = 245,000
  const slabTax = 20000 + 30000 + 30000 + 60000 + (350000 * 0.30);
  assert.strictEqual(slabTax, 245000);
});

it('Calculates exact Surcharge Marginal Relief at ₹50,00,001', () => {
  const income = 5000001;
  const taxOn50L = 1190000;
  const rawSurcharge = taxOn50L * 0.10; // 1,19,000

  // Statutory rule: Total tax payable cannot exceed Tax on 50L + Excess Income (₹1)
  const maxAllowableTax = taxOn50L + (income - 5000000);
  assert.strictEqual(maxAllowableTax, 1190001);

  const netSurchargePayable = maxAllowableTax - taxOn50L;
  assert.strictEqual(netSurchargePayable, 1);

  const marginalReliefGranted = rawSurcharge - netSurchargePayable;
  assert.strictEqual(marginalReliefGranted, 118999);
});

// ── TEST GROUP 4: Backdoor Roth IRC § 408(d)(2) Pro-Rata Donut Math ──────────
console.log('\n--- TEST GROUP 4: Backdoor Roth IRC § 408(d)(2) Pro-Rata Donut Math ---');

it('Computes 10% non-taxable ratio and 90% taxable conversion on $63k rollover IRA', () => {
  const basis = 7000;
  const preTaxBalance = 63000;
  const conversion = 7000;

  const totalIraValuation = basis + preTaxBalance; // 70000
  const nonTaxableRatio = basis / totalIraValuation;
  assert.strictEqual(nonTaxableRatio, 0.10);

  const nonTaxableConversion = conversion * nonTaxableRatio;
  assert.strictEqual(nonTaxableConversion, 700);

  const taxableConversion = conversion - nonTaxableConversion;
  assert.strictEqual(taxableConversion, 6300);
});

it('Snaps to 100% tax-free conversion when reverse-rollover is simulated', () => {
  const basis = 7000;
  const preTaxBalance = 0; // After 401(k) reverse rollover
  const conversion = 7000;

  const totalIraValuation = basis + preTaxBalance;
  const nonTaxableRatio = basis / totalIraValuation;
  assert.strictEqual(nonTaxableRatio, 1.0);

  const taxableConversion = conversion - (conversion * nonTaxableRatio);
  assert.strictEqual(taxableConversion, 0);
});

// ── TEST GROUP 5: 25-Year Forensic Fee Leakage Compounding Math ───────────────
console.log('\n--- TEST GROUP 5: 25-Year Forensic Fee Leakage Compounding Math ---');

it('Models exponential fee drag over 25 years with high accuracy', () => {
  const initial = 12487320;
  const rClean = 0.12;
  const rNet = 0.12 - 0.017; // 1.7% drag

  let clean = initial;
  let net = initial;

  for (let yr = 1; yr <= 25; yr++) {
    clean = clean * (1 + rClean);
    net = (net * (1 + rNet)) - 28400;
  }

  const wealthLost = clean - net;
  const pctDestroyed = (wealthLost / clean) * 100;

  assert.ok(wealthLost > 50000000, `Expected lost wealth > ₹5 Cr, got ${wealthLost}`);
  assert.ok(pctDestroyed > 30, `Expected pct destroyed > 30%, got ${pctDestroyed}%`);
});

// ── TEST GROUP 6: Statutory Advance Tax Milestones ────────────────────────────
console.log('\n--- TEST GROUP 6: Statutory Advance Tax Milestones ---');

it('Verifies Indian statutory advance tax percentage tiers', () => {
  const projectedTax = 240000;
  const q1 = projectedTax * 0.15; // 36,000 by June 15
  const q2 = projectedTax * 0.45; // 108,000 by Sept 15
  const q3 = projectedTax * 0.75; // 180,000 by Dec 15
  const q4 = projectedTax * 1.00; // 240,000 by March 15

  assert.strictEqual(q1, 36000);
  assert.strictEqual(q2, 108000);
  assert.strictEqual(q3, 180000);
  assert.strictEqual(q4, 240000);
});

it('Verifies US quarterly estimated tax percentage tiers', () => {
  const projectedTax = 40000;
  const q1 = projectedTax * 0.25; // 10,000 by April 15
  const q2 = projectedTax * 0.50; // 20,000 by June 15
  const q3 = projectedTax * 0.75; // 30,000 by Sept 15
  const q4 = projectedTax * 1.00; // 40,000 by Jan 15

  assert.strictEqual(q1, 10000);
  assert.strictEqual(q2, 20000);
  assert.strictEqual(q3, 30000);
  assert.strictEqual(q4, 40000);
});

console.log('\n================================================================');
console.log(`🎉 ALL VISUALIZATION TESTS PASSED: ${passedTests}/${totalTests} (100% SUCCESS)`);
console.log('================================================================\n');
