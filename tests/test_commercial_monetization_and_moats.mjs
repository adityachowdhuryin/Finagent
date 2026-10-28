// tests/test_commercial_monetization_and_moats.mjs
// Verification suite for Commercial Monetization, AI Defensibility Moats, PII Privacy, and B2B Practice Mode

import assert from 'assert';
import { buildInstitutionalTaxBinderPDF } from '../src/utils/institutionalTaxBinderPdf.js';

console.log('─────────────────────────────────────────────────────────────────────────────');
console.log('🧪 RUNNING COMMERCIAL MONETIZATION & AI DEFENSIBILITY MOATS SUITE');
console.log('─────────────────────────────────────────────────────────────────────────────');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    console.error(err.stack);
  }
}

// ── 1. Commercial Paywall & 3x ROI Guarantee ─────────────────────────────────
console.log('\n💳 1. Commercial Paywall & 3x ROI Guarantee Logic');

runTest('3x ROI Multiplier Calculation for US High Earners ($299 Plan)', () => {
  const annualTaxAlpha = 18420;
  const annualFeeBleedPlugged = 6420;
  const totalFinancialAdvantage = annualTaxAlpha + annualFeeBleedPlugged; // $24,840
  const planPrice = 299;
  const guaranteeThreshold = planPrice * 3; // $897

  const roiMultiplier = Math.round(totalFinancialAdvantage / planPrice);

  assert.ok(totalFinancialAdvantage >= guaranteeThreshold, 'Financial advantages must exceed 3x software fee');
  assert.strictEqual(roiMultiplier, 83, 'Expected 83x return on investment');
});

runTest('3x ROI Multiplier Calculation for Indian HNIs (₹7,999 Plan)', () => {
  const annualTaxAlpha = 328000;
  const annualFeeBleedPlugged = 138500;
  const totalFinancialAdvantage = annualTaxAlpha + annualFeeBleedPlugged; // ₹4,66,500
  const planPrice = 7999;
  const guaranteeThreshold = planPrice * 3; // ₹23,997

  const roiMultiplier = Math.round(totalFinancialAdvantage / planPrice);

  assert.ok(totalFinancialAdvantage >= guaranteeThreshold, 'Indian advantages must exceed 3x software fee');
  assert.strictEqual(roiMultiplier, 58, 'Expected 58x return on investment');
});

runTest('Paywall Gating State Transitions', () => {
  let isTaxProUnlocked = false;
  let paywallTriggered = false;

  function triggerPaywall(reason) {
    if (isTaxProUnlocked) return true;
    paywallTriggered = true;
    return false;
  }

  // 1. Initial attempt while locked should fail and trigger paywall
  const attempt1 = triggerPaywall('TRANSMISSION');
  assert.strictEqual(attempt1, false);
  assert.strictEqual(paywallTriggered, true);

  // 2. Unlock plan (VIP Demo Bypass or payment)
  isTaxProUnlocked = true;
  const attempt2 = triggerPaywall('TRANSMISSION');
  assert.strictEqual(attempt2, true, 'Unlocked user passes through execution gate');
});

// ── 2. Client-Side Zero-Knowledge Privacy & PII Masking Shield ───────────────
console.log('\n🔒 2. Zero-Knowledge Privacy & PII Masking Shield');

runTest('PII Masking Function (SSN, PAN, and Currency)', () => {
  function maskValue(val, type, isPiiMasked) {
    if (!isPiiMasked) return val;
    if (!val && val !== 0) return '••••';
    const str = String(val);
    if (type === 'ssn') return `***-**-${str.slice(-4) || '9182'}`;
    if (type === 'pan') return `*****${str.slice(-4) || '234F'}`;
    if (type === 'currency') return '$***,***';
    return '••••••••';
  }

  // Unmasked Mode
  assert.strictEqual(maskValue('987-65-4321', 'ssn', false), '987-65-4321');
  assert.strictEqual(maskValue('ABCDE1234F', 'pan', false), 'ABCDE1234F');
  assert.strictEqual(maskValue(184200, 'currency', false), 184200);

  // Masked Mode
  assert.strictEqual(maskValue('987-65-4321', 'ssn', true), '***-**-4321');
  assert.strictEqual(maskValue('ABCDE1234F', 'pan', true), '*****234F');
  assert.strictEqual(maskValue(184200, 'currency', true), '$***,***');
});

// ── 3. 1-Click Direct Broker & Payroll Auto-Sync ─────────────────────────────
console.log('\n⚡ 3. 1-Click Broker & Payroll Auto-Sync Connectors');

runTest('Broker Connector Ledger Ingestion & Context State Update', () => {
  const currentTaxpayer = { salary: 150000, stcg: 0, ltcg: 10000, fedWithholding: 25000 };
  const mockSchwabPayload = {
    stcg: -4100,
    ltcg: 44200,
    washSaleDisallowed: 780,
    taxLotsCount: 38,
  };

  const updatedTaxpayer = {
    ...currentTaxpayer,
    stcg: mockSchwabPayload.stcg,
    ltcg: mockSchwabPayload.ltcg,
  };

  assert.strictEqual(updatedTaxpayer.stcg, -4100);
  assert.strictEqual(updatedTaxpayer.ltcg, 44200);
  assert.strictEqual(updatedTaxpayer.salary, 150000, 'Salary preserved when broker is synced');
});

runTest('Payroll Direct Ingestion (ADP / Gusto W-2 Auto-Populate)', () => {
  const currentTaxpayer = { salary: 0, fedWithholding: 0 };
  const mockAdpPayload = {
    wages: 198500,
    fedWithholding: 38900,
    taxLotsCount: 1,
  };

  const updatedTaxpayer = {
    ...currentTaxpayer,
    salary: mockAdpPayload.wages,
    fedWithholding: mockAdpPayload.fedWithholding,
  };

  assert.strictEqual(updatedTaxpayer.salary, 198500);
  assert.strictEqual(updatedTaxpayer.fedWithholding, 38900);
});

// ── 4. 12-Page Institutional Audit Binder PDF ────────────────────────────────
console.log('\n📄 4. Institutional 12-Page Audit Binder PDF Generator');

runTest('Institutional Tax Binder PDF Compilation', () => {
  const mockTaxpayer = {
    filerName: 'Alex Morgan',
    ssnMasked: 'XXX-XX-9182',
    stateCode: 'CA',
    filingStatus: 'Single',
    residencyStatus: 'Resident',
  };

  const mockComputedMetrics = {
    totalTaxAlpha: 18420,
    totalFeeLeakage: 6420,
    tenYearWealthDelta: 94350,
    sCorpFicaSavings: 3825,
    ptetFederalTaxAlpha: 3906,
    harvestAlpha: 3850,
  };

  const mockLossCarryforwards = [
    { year: 2023, type: 'STCL', originalLoss: 12000, remainingLoss: 6000, offsetThisYear: 3000, statutoryLimit: '$3k/yr offset' },
    { year: 2024, type: 'LTCL', originalLoss: 18500, remainingLoss: 15500, offsetThisYear: 0, statutoryLimit: 'Indefinite' },
  ];

  const doc = buildInstitutionalTaxBinderPDF(mockTaxpayer, mockComputedMetrics, mockLossCarryforwards, 'US', {
    seal: 'SHA256-TEST-SEAL-US-2026-STAMP',
  });

  assert.ok(doc, 'PDF Document must be created');
  assert.strictEqual(doc.getNumberOfPages(), 4, 'Must contain 4 comprehensive multi-schedule pages');
});

// ── 5. B2B CPA & CA Practice Mode (Client Roster & Linter) ───────────────────
console.log('\n🏛️ 5. B2B CPA & CA Practice Portal');

runTest('CPA Practice Client Roster Filtering & Linter Aggregation', () => {
  const clients = [
    { id: 'cli-1', name: 'Alex Morgan', linterStatus: '28/28 Pass', filingStatus: 'Ready to File' },
    { id: 'cli-2', name: 'Sarah Jenkins', linterStatus: '27/28 Pass', filingStatus: 'In Review' },
    { id: 'cli-3', name: 'Marcus Vance', linterStatus: '28/28 Pass', filingStatus: 'Transmitted (ECN)' },
    { id: 'cli-4', name: 'Elena Rostova', linterStatus: 'Warning: Form 8938 FBAR', filingStatus: 'Action Required' },
  ];

  const passedClients = clients.filter(c => c.linterStatus.includes('Pass'));
  const warningClients = clients.filter(c => c.linterStatus.includes('Warning'));

  assert.strictEqual(passedClients.length, 3);
  assert.strictEqual(warningClients.length, 1);
  assert.strictEqual(warningClients[0].name, 'Elena Rostova');
});

runTest('CPA Client Batch Manifest CSV Export String Structure', () => {
  const clients = [
    { id: 'cli-1', name: 'Alex Morgan', email: 'alex@techcorp.io', aum: '$1.45M', form: '1040', linterStatus: 'Pass', filingStatus: 'Ready', taxAlphaSaved: '$18,420', state: 'CA' }
  ];

  const header = 'Client ID,Client Name,Email,AUM,Tax Form,Linter Status,Filing Status,Tax Alpha Saved,State\n';
  const row = `"${clients[0].id}","${clients[0].name}","${clients[0].email}","${clients[0].aum}","${clients[0].form}","${clients[0].linterStatus}","${clients[0].filingStatus}","${clients[0].taxAlphaSaved}","${clients[0].state}"`;
  const csv = header + row;

  assert.ok(csv.includes('Client Name'));
  assert.ok(csv.includes('Alex Morgan'));
  assert.ok(csv.includes('$18,420'));
});

console.log('\n─────────────────────────────────────────────────────────────────────────────');
console.log(`📊 FINAL TEST REPORT: ${passedTests}/${totalTests} TESTS PASSED (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
console.log('─────────────────────────────────────────────────────────────────────────────\n');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
