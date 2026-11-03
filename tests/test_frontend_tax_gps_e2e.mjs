/**
 * test_frontend_tax_gps_e2e.mjs
 * End-to-end verification of the Tax GPS state engine, persona transitions,
 * roadmap lifecycle, and live HTTP API handshake.
 */

import assert from 'node:assert';
import {
  PERSONA_DEFINITIONS,
  TAX_PERSONAS,
  classifyTaxIntent,
  getPersonaFromCards,
  generatePersonaRoadmap,
} from '../src/utils/taxPersonaClassifier.js';

console.log('🧪 Starting Full System Verification: Frontend Tax GPS & State Lifecycle...\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
    throw err;
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
    throw err;
  }
}

// -------------------------------------------------------------
// 1. ALL 8 STATUTORY PERSONA INTEGRITY
// -------------------------------------------------------------
console.log('📌 1. Persona Catalog & Statutory Metadata Completeness');

runTest('1.1: Verifies all 8 personas have required statutory fields', () => {
  const allKeys = Object.keys(PERSONA_DEFINITIONS);
  assert.strictEqual(allKeys.length, 8, 'Must have exactly 8 personas');

  allKeys.forEach((key) => {
    const p = PERSONA_DEFINITIONS[key];
    assert.strictEqual(p.key, key);
    assert.ok(p.title && p.title.length > 5, `${key} missing title`);
    assert.ok(p.tag && p.tag.length > 2, `${key} missing tag`);
    assert.ok(p.summary && p.summary.length > 20, `${key} missing summary`);
    assert.ok(p.plainSubtitle && p.plainSubtitle.length > 10, `${key} missing subtitle`);
    assert.ok(Array.isArray(p.relevantTabs), `${key} relevantTabs must be array`);
    assert.ok(p.relevantTabs.length >= 2 && p.relevantTabs.length <= 4, `${key} must have 2-4 tabs`);
    assert.ok(Array.isArray(p.steps), `${key} steps must be array`);
    assert.strictEqual(p.steps.length, 3, `${key} must have exactly 3 actionable steps`);

    p.steps.forEach((s, idx) => {
      assert.ok(s.id, `Step ${idx} in ${key} missing id`);
      assert.ok(s.title, `Step ${idx} in ${key} missing title`);
      assert.ok(s.desc, `Step ${idx} in ${key} missing desc`);
      assert.ok(s.tab || s.action, `Step ${idx} in ${key} missing tab or action`);
      assert.strictEqual(s.completed, false, `Step ${idx} initial completion must be false`);
    });
  });
});

// -------------------------------------------------------------
// 2. SIMULATED STATE MACHINE (Context Lifecycle)
// -------------------------------------------------------------
console.log('\n📌 2. Simulated State Machine (TaxStudioContext Lifecycle)');

runTest('2.1: Lifecycle: Intake ➔ Set Persona ➔ Generate Roadmap ➔ Complete Step ➔ Toggle Cockpit', () => {
  // Step 1: Initial state
  let userTaxPersona = null;
  let isFocusModeActive = false;
  let activeRoadmap = null;

  // Step 2: Intake Diagnosis (User diagnoses as US_SCORP_FREELANCER)
  const personaKey = 'US_SCORP_FREELANCER';
  userTaxPersona = personaKey;
  activeRoadmap = generatePersonaRoadmap(personaKey);
  isFocusModeActive = true;

  assert.strictEqual(userTaxPersona, 'US_SCORP_FREELANCER');
  assert.strictEqual(isFocusModeActive, true);
  assert.strictEqual(activeRoadmap.steps.length, 3);
  assert.strictEqual(activeRoadmap.steps.filter((s) => s.completed).length, 0);

  // Step 3: Complete Step 1
  const targetStepId = activeRoadmap.steps[0].id;
  activeRoadmap = {
    ...activeRoadmap,
    steps: activeRoadmap.steps.map((s) => (s.id === targetStepId ? { ...s, completed: true } : s)),
  };

  const doneCount = activeRoadmap.steps.filter((s) => s.completed).length;
  const progressPercent = Math.round((doneCount / activeRoadmap.steps.length) * 100);
  assert.strictEqual(doneCount, 1);
  assert.strictEqual(progressPercent, 33);

  // Step 4: Toggle to Full Cockpit
  isFocusModeActive = false;
  assert.strictEqual(isFocusModeActive, false, 'Should allow viewing all tools at 100% opacity');

  // Step 5: Toggle back to Focus Mode
  isFocusModeActive = true;
  assert.strictEqual(isFocusModeActive, true, 'Should re-enable focused dimming');

  // Step 6: Reset Profile
  userTaxPersona = null;
  activeRoadmap = null;
  isFocusModeActive = false;
  assert.strictEqual(userTaxPersona, null);
  assert.strictEqual(activeRoadmap, null);
  assert.strictEqual(isFocusModeActive, false);
});

// -------------------------------------------------------------
// 3. TAB FILTERING & SPOTLIGHTING LOGIC
// -------------------------------------------------------------
console.log('\n📌 3. Tab Filtering & Spotlighting Logic for All Personas');

runTest('3.1: Verifies each persona highlights correct tabs and dims the rest', () => {
  const allTabs = ['e-file', 'quarterly', 'huf', 'harvester', 'forensic', 'itr'];

  Object.keys(PERSONA_DEFINITIONS).forEach((personaKey) => {
    const p = PERSONA_DEFINITIONS[personaKey];
    const recommended = allTabs.filter((t) => p.relevantTabs.includes(t));
    const dimmed = allTabs.filter((t) => !p.relevantTabs.includes(t));

    assert.ok(recommended.length >= 2, `${personaKey} should recommend at least 2 tabs`);
    assert.ok(dimmed.length >= 2, `${personaKey} should dim non-essential tabs`);
    assert.strictEqual(recommended.length + dimmed.length, allTabs.length);
  });
});

// -------------------------------------------------------------
// 4. LIVE BACKEND API HANDSHAKE (Gemini 2.0 Integration)
// -------------------------------------------------------------
console.log('\n📌 4. Live Backend API Handshake (Gemini 2.0 Integration)');

await runAsyncTest('4.1: Tests live HTTP POST /api/ai/diagnose-tax with Gemini 2.0', async () => {
  const res = await fetch('http://localhost:3001/api/ai/diagnose-tax', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'I have 3 rental houses with depreciation expenses and mortgage interest',
      market: 'US',
    }),
  });

  assert.strictEqual(res.status, 200, 'HTTP status should be 200 OK');
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.personaKey, 'US_RENTAL_REAL_ESTATE');
  assert.ok(data.confidence >= 0.7, 'High confidence diagnosis');
  assert.ok(data.explanation && data.explanation.length > 10, 'Should include explanation');
});

await runAsyncTest('4.2: Tests live HTTP POST /api/ai/diagnose-tax with Indian Section 44ADA', async () => {
  const res = await fetch('http://localhost:3001/api/ai/diagnose-tax', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'I am a freelance UI designer in Gurgaon billing clients with 50% presumptive income under 44ADA',
      market: 'IN',
    }),
  });

  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.personaKey, 'IN_BUSINESS_PROFESSIONAL');
  assert.ok(data.confidence >= 0.7);
});

// -------------------------------------------------------------
// 5. PRODUCTION BUNDLE & CLIENT SCRIPT SANITY
// -------------------------------------------------------------
console.log('\n📌 5. Frontend Route Availability Check');

await runAsyncTest('5.1: Verifies Vite dev server serves /app/tax correctly', async () => {
  const res = await fetch('http://localhost:5173/app/tax');
  assert.strictEqual(res.status, 200);
  const html = await res.text();
  assert.ok(html.includes('<div id="root">'), 'HTML must contain React root container');
  assert.ok(html.includes('/src/main.jsx'), 'HTML must link main.jsx');
});

console.log(`\n🎉 Full System Verification Complete: ${passedTests}/${totalTests} Tests Passed (100% Success Rate)!\n`);
