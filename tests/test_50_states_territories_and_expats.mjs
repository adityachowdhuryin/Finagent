// tests/test_50_states_territories_and_expats.mjs
// Automated verification suite for Universal 50-State, DC, Overseas Territories, and US Expat Architecture
import assert from 'assert';
import {
  calculateStateTax,
  computeTerritoryTax,
  computeExpatTaxRelief,
  STATE_TAX_DATA,
} from '../server/routes/usTax.js';

import {
  generateLLCOperatingAgreement,
  generateCorporateBankingResolution,
  getLLCStatute,
  STATE_LLC_STATUTES,
} from '../server/routes/usBusinessTax.js';

console.log('🧪 Starting Universal 50-State, Territories, and Expat Verification Suite...\n');

let passCount = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    process.exit(1);
  }
}

// ── 1. Jurisdiction Count & Completeness ────────────────────────────────────
console.log('--- 1. Jurisdiction Catalog & Coverage ---');

test('STATE_TAX_DATA contains exactly 56 jurisdictions (50 States + DC + 5 Territories)', () => {
  const keys = Object.keys(STATE_TAX_DATA);
  assert.strictEqual(keys.length, 56, `Expected 56 jurisdictions, found ${keys.length}`);
});

test('All 8 zero-tax states exist and produce exactly $0 state tax', () => {
  const zeroStates = ['TX', 'FL', 'NV', 'WY', 'TN', 'SD', 'AK', 'NH'];
  zeroStates.forEach(code => {
    assert(STATE_TAX_DATA[code], `Missing zero-tax state: ${code}`);
    assert.strictEqual(STATE_TAX_DATA[code].type, 'none');
    const res = calculateStateTax(175000, code);
    assert.strictEqual(res.stateTax, 0, `State ${code} should have 0 tax, got ${res.stateTax}`);
    assert.strictEqual(res.stateRatePct, '0.0%');
  });
});

test('Washington (WA) 7% capital gains tax triggers only above $250k threshold', () => {
  assert.strictEqual(STATE_TAX_DATA.WA.type, 'wa_cap_gains');
  // Below threshold ($200k gains)
  const resBelow = calculateStateTax(100000, 'WA', false, 200000);
  assert.strictEqual(resBelow.stateTax, 0);

  // Above threshold ($350k gains => $100k taxable * 7% = $7,000)
  const resAbove = calculateStateTax(100000, 'WA', false, 350000);
  assert.strictEqual(resAbove.stateTax, 7000);
  assert.strictEqual(resAbove.stateRatePct, '7.0%');
});

// ── 2. Flat Tax States Mathematical Precision ──────────────────────────────
console.log('\n--- 2. Flat Tax States Mathematical Precision ---');

test('Arizona (AZ) flat 2.50% calculation', () => {
  const res = calculateStateTax(100000, 'AZ');
  assert.strictEqual(res.stateTax, 2500);
  assert.strictEqual(res.stateRatePct, '2.50%');
});

test('Colorado (CO) flat 4.40% calculation', () => {
  const res = calculateStateTax(100000, 'CO');
  assert.strictEqual(res.stateTax, 4400);
  assert.strictEqual(res.stateRatePct, '4.40%');
});

test('Georgia (GA) flat 5.39% calculation', () => {
  const res = calculateStateTax(100000, 'GA');
  assert.strictEqual(res.stateTax, 5390);
  assert.strictEqual(res.stateRatePct, '5.39%');
});

test('Illinois (IL) flat 4.95% calculation', () => {
  const res = calculateStateTax(100000, 'IL');
  assert.strictEqual(res.stateTax, 4950);
  assert.strictEqual(res.stateRatePct, '4.95%');
});

test('Pennsylvania (PA) flat 3.07% calculation', () => {
  const res = calculateStateTax(100000, 'PA');
  assert.strictEqual(res.stateTax, 3070);
  assert.strictEqual(res.stateRatePct, '3.07%');
});

test('Utah (UT) flat 4.55% calculation', () => {
  const res = calculateStateTax(100000, 'UT');
  assert.strictEqual(res.stateTax, 4550);
  assert.strictEqual(res.stateRatePct, '4.55%');
});

test('Indiana (IN) flat 3.05% calculation', () => {
  const res = calculateStateTax(100000, 'IN');
  assert.strictEqual(res.stateTax, 3050);
  assert.strictEqual(res.stateRatePct, '3.05%');
});

// ── 3. Progressive Tax States Mathematical Precision ────────────────────────
console.log('\n--- 3. Progressive Tax States & Surtaxes ---');

test('California (CA) progressive brackets + 1.2% uncapped SDI', () => {
  const res = calculateStateTax(150000, 'CA');
  assert(res.baseStateTax > 0);
  assert.strictEqual(res.caSDITax, Math.round(150000 * 0.012)); // 1.2% SDI
  assert.strictEqual(res.stateTax, res.baseStateTax + res.caSDITax);
});

test('New York (NY) with and without NYC resident tax', () => {
  const resStateOnly = calculateStateTax(150000, 'NY', false);
  const resWithNYC = calculateStateTax(150000, 'NY', true);
  assert(resWithNYC.stateTax > resStateOnly.stateTax);
  assert(resWithNYC.nycTax > 0);
  assert(resStateOnly.nycTax === 0);
  assert(resWithNYC.mtaTax > 0);
});

test('Massachusetts (MA) 5% base + 4% Fair Share surtax on > $1M', () => {
  // Below $1M
  const resUnder = calculateStateTax(800000, 'MA');
  assert.strictEqual(resUnder.stateTax, 40000); // 800k * 5%

  // Over $1M ($1.5M => 1.5M * 5% + 500k * 4% = 75k + 20k = 95k)
  const resOver = calculateStateTax(1500000, 'MA');
  assert.strictEqual(resOver.stateTax, 95000);
});

test('Maryland (MD) progressive base + 3.2% county local tax', () => {
  const res = calculateStateTax(100000, 'MD');
  assert(res.baseStateTax > 0);
  assert.strictEqual(res.localCountyTax, 3200); // 100k * 3.2%
  assert.strictEqual(res.stateTax, res.baseStateTax + 3200);
});

test('Hawaii (HI) high progressive rate brackets up to 11.0%', () => {
  const res = calculateStateTax(250000, 'HI');
  assert(res.stateTax > 0);
  assert(res.details.includes('11.00%'));
});

// ── 4. US Overseas Territories Statutory Engine ─────────────────────────────
console.log('\n--- 4. US Overseas Territories Engine (IRC § 931–935 & Act 60) ---');

test('Puerto Rico (PR): IRC § 933 source exclusion and standard Hacienda tax', () => {
  const res = computeTerritoryTax({
    territoryCode: 'PR',
    usSourceIncome: 30000,
    territorySourceIncome: 120000,
    act60Decree: false,
    capitalGains: 40000,
    filingStatus: 'Single'
  });

  assert.strictEqual(res.territoryCode, 'PR');
  assert.strictEqual(res.act60Claimed, false);
  assert.strictEqual(res.capitalGainsTax, Math.round(40000 * 0.15)); // 15% standard PR cap gains
  assert.strictEqual(res.usGrossExclusionAmount, 120000); // Excluded under IRC § 933
  assert(res.governingStatute.includes('IRC § 933'));
});

test('Puerto Rico (PR): Act 60 decree provides 0% capital gains exemption', () => {
  const res = computeTerritoryTax({
    territoryCode: 'PR',
    usSourceIncome: 30000,
    territorySourceIncome: 120000,
    act60Decree: true,
    capitalGains: 75000,
    filingStatus: 'Single'
  });

  assert.strictEqual(res.act60Claimed, true);
  assert.strictEqual(res.capitalGainsTax, 0, 'Act 60 must yield $0 capital gains tax');
  assert.strictEqual(res.act60CapitalGainsRate, '0.0%');
  assert(res.details.includes('Act 60 Individual Investor decree eliminates all capital gains tax (0.0%)'));
});

test('U.S. Virgin Islands (VI): IRC § 932 mirror return satisfies US federal obligation', () => {
  const res = computeTerritoryTax({
    territoryCode: 'VI',
    usSourceIncome: 0,
    territorySourceIncome: 180000,
  });

  assert.strictEqual(res.territoryCode, 'VI');
  assert.strictEqual(res.isMirrorCode, true);
  assert.strictEqual(res.satisfiesUSFederalObligation, true);
  assert(res.governingStatute.includes('IRC § 932(c)'));
});

test('Guam (GU) & CNMI (MP): IRC § 935 single mirror return filing', () => {
  const guamRes = computeTerritoryTax({ territoryCode: 'GU', territorySourceIncome: 100000 });
  const cnmiRes = computeTerritoryTax({ territoryCode: 'MP', territorySourceIncome: 100000 });

  assert.strictEqual(guamRes.isMirrorCode, true);
  assert.strictEqual(guamRes.satisfiesUSFederalObligation, true);
  assert(guamRes.governingStatute.includes('IRC § 935'));

  assert.strictEqual(cnmiRes.isMirrorCode, true);
  assert.strictEqual(cnmiRes.satisfiesUSFederalObligation, true);
});

test('American Samoa (AS): IRC § 931 non-mirror territorial exclusion', () => {
  const res = computeTerritoryTax({ territoryCode: 'AS', territorySourceIncome: 90000 });
  assert.strictEqual(res.isMirrorCode, false);
  assert.strictEqual(res.usGrossExclusionAmount, 90000);
  assert.strictEqual(res.totalTerritoryTax, Math.round(90000 * 0.06));
  assert(res.governingStatute.includes('IRC § 931'));
});

// ── 5. US Expatriate Relief Engine (Form 2555 vs Form 1116) ─────────────────
console.log('\n--- 5. US Expatriate Relief Engine (Form 2555 & 1116) ---');

test('Form 2555 FEIE: 330-day Physical Presence Test validator', () => {
  // Below 330 days
  const failRes = computeExpatTaxRelief({
    foreignEarnedIncome: 120000,
    foreignTaxesPaid: 15000,
    foreignDaysPresent: 310, // Failed
    totalTaxableIncome: 150000,
    baseUsTax: 30000,
  });
  assert.strictEqual(failRes.qualifiesForFEIE, false);
  assert.strictEqual(failRes.feieExcludedAmount, 0);

  // Meets 330 days
  const passRes = computeExpatTaxRelief({
    foreignEarnedIncome: 120000,
    foreignTaxesPaid: 15000,
    foreignDaysPresent: 335, // Passed
    totalTaxableIncome: 150000,
    baseUsTax: 30000,
  });
  assert.strictEqual(passRes.qualifiesForFEIE, true);
  assert.strictEqual(passRes.feieExcludedAmount, 120000);
});

test('Form 2555 FEIE: Statutory 2026 cap ($130,000)', () => {
  const res = computeExpatTaxRelief({
    foreignEarnedIncome: 185000, // Exceeds cap
    foreignTaxesPaid: 20000,
    foreignDaysPresent: 340,
    totalTaxableIncome: 200000,
    baseUsTax: 45000,
  });

  assert.strictEqual(res.feie2026Limit, 130000);
  assert.strictEqual(res.feieExcludedAmount, 130000, 'Exclusion must cap at $130,000 for 2026');
  assert(res.feieTaxSavings > 0);
});

test('Form 1116 FTC: Limitation and excess carryforward calculation', () => {
  const res = computeExpatTaxRelief({
    foreignEarnedIncome: 100000,
    foreignTaxesPaid: 45000, // High foreign taxes
    foreignDaysPresent: 340,
    totalTaxableIncome: 100000,
    baseUsTax: 18000,
  });

  // Since foreign source ratio is 100%, FTC limit = $18,000
  assert.strictEqual(res.form1116FTC.ftcLimitation, 18000);
  assert.strictEqual(res.form1116FTC.allowableFTC, 18000);
  assert.strictEqual(res.form1116FTC.excessFTCCarriedForward, 27000); // $45k - $18k
  assert.strictEqual(res.form1116FTC.netTaxWithFTC, 0);
  // High foreign tax jurisdiction prefers FTC over FEIE
  assert.strictEqual(res.recommendedStrategy, 'Form 1116 FTC');
});

test('Dual Optimizer recommends FEIE when foreign tax is low/zero (e.g. Dubai, UAE)', () => {
  const res = computeExpatTaxRelief({
    foreignEarnedIncome: 120000,
    foreignTaxesPaid: 0, // Zero foreign income tax in UAE
    foreignDaysPresent: 350,
    totalTaxableIncome: 120000,
    baseUsTax: 22000,
  });

  assert.strictEqual(res.form1116FTC.allowableFTC, 0);
  assert(res.feieTaxSavings > 0);
  assert.strictEqual(res.recommendedStrategy, 'Form 2555 FEIE');
  assert.strictEqual(res.finalNetTax, res.netTaxWithFEIE);
});

// ── 6. 50-State Statutory LLC & Corporate Formation ─────────────────────────
console.log('\n--- 6. Universal 50-State LLC Statutory Formation ---');

test('STATE_LLC_STATUTES contains statutory acts for all 50 states + DC + Territories', () => {
  const count = Object.keys(STATE_LLC_STATUTES).length;
  assert(count >= 55, `Expected at least 55 statutes, found ${count}`);
  assert(getLLCStatute('Florida').includes('Fla. Stat. Ch. 605'));
  assert(getLLCStatute('California').includes('Cal. Corp. Code'));
  assert(getLLCStatute('New York').includes('LLCL § 101'));
  assert(getLLCStatute('Texas').includes('Texas Business Organizations Code'));
  assert(getLLCStatute('Washington').includes('RCW 25.15'));
  assert(getLLCStatute('Puerto Rico').includes('Act No. 164-2009'));
});

test('generateLLCOperatingAgreement cites the exact state statutory LLC act', () => {
  const prAgreement = generateLLCOperatingAgreement({
    companyName: 'Caribbean Cloud Software LLC',
    stateOfFormation: 'Puerto Rico',
    managerName: 'Aditya Chowdhury'
  });
  assert(prAgreement.agreementText.includes('Puerto Rico General Corporations Act of 2009'));

  const flAgreement = generateLLCOperatingAgreement({
    companyName: 'Sunshine Health Technologies LLC',
    stateOfFormation: 'Florida',
    managerName: 'Sarah Jenkins'
  });
  assert(flAgreement.agreementText.includes('Florida Revised Limited Liability Company Act (Fla. Stat. Ch. 605)'));
});

test('generateCorporateBankingResolution cites the exact state statute', () => {
  const resolution = generateCorporateBankingResolution({
    companyName: 'Emerald City Innovations LLC',
    stateOfFormation: 'Washington',
    bankName: 'Silicon Valley Bank, a division of First Citizens Bank',
    managingMember: 'Alex Morgan'
  });
  assert(resolution.resolutionText.includes('Washington Limited Liability Company Act (RCW 25.15)'));
});

// ── 7. Live HTTP API Integration Tests ──────────────────────────────────────
console.log('\n--- 7. Live HTTP Endpoint Integration Tests ---');

async function testAsync(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    process.exit(1);
  }
}

await testAsync('HTTP POST /api/us-tax/calculate-federal-and-state for Texas (0% State Tax)', async () => {
  const res = await fetch('http://localhost:3001/api/us-tax/calculate-federal-and-state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filingStatus: 'Single',
      w2Wages: 150000,
      stateCode: 'TX',
      shortTermCapitalGains: 0,
      longTermCapitalGains: 20000,
    })
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert(data.success);
  assert.strictEqual(data.summary.stateTax, 0);
  assert.strictEqual(data.stateCode, 'TX');
});

await testAsync('HTTP POST /api/us-tax/calculate-federal-and-state for Puerto Rico with Act 60', async () => {
  const res = await fetch('http://localhost:3001/api/us-tax/calculate-federal-and-state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filingStatus: 'Single',
      w2Wages: 25000, // US source
      territorySourceIncome: 150000, // PR source (IRC § 933 excluded)
      act60Decree: true,
      longTermCapitalGains: 50000,
      stateCode: 'PR',
      isTerritoryResident: true,
    })
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert(data.success);
  assert(data.summary.territoryOptimization);
  assert.strictEqual(data.summary.territoryOptimization.act60Claimed, true);
  assert.strictEqual(data.summary.territoryOptimization.capitalGainsTax, 0);
  assert.strictEqual(data.summary.territoryOptimization.usGrossExclusionAmount, 150000);
});

await testAsync('HTTP POST /api/us-tax/calculate-federal-and-state for US Expatriate (335 Days Foreign)', async () => {
  const res = await fetch('http://localhost:3001/api/us-tax/calculate-federal-and-state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filingStatus: 'Single',
      w2Wages: 160000,
      stateCode: 'TX',
      isLivingAbroad: true,
      foreignDaysPresent: 335,
      foreignEarnedIncome: 140000,
      foreignTaxesPaid: 5000,
    })
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert(data.success);
  assert(data.summary.expatOptimization);
  assert.strictEqual(data.summary.expatOptimization.qualifiesForFEIE, true);
  assert.strictEqual(data.summary.expatOptimization.feieExcludedAmount, 130000); // 2026 cap
  assert(data.summary.expatOptimization.optimalSavings > 0);
});

await testAsync('HTTP POST /api/us-tax/calculate-federal-and-state for US Virgin Islands (Mirror Code)', async () => {
  const res = await fetch('http://localhost:3001/api/us-tax/calculate-federal-and-state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filingStatus: 'Single',
      w2Wages: 120000,
      stateCode: 'VI',
      isTerritoryResident: true,
    })
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert(data.success);
  assert.strictEqual(data.summary.totalFederalTax, 0, 'IRS direct liability should be 0 under IRC § 932 mirror');
  assert(data.summary.territoryOptimization.isMirrorCode);
});

console.log(`\n================================================================`);
console.log(`🎉 ALL ${passCount} STATUTORY JURISDICTION & EXPAT TESTS PASSED!`);
console.log(`================================================================\n`);
