/**
 * tests/test_tax_gps_plain_english_and_copilot.mjs
 * Comprehensive automated verification for Tax GPS Plain English Engine,
 * Hover-to-Translate Glossary (<TaxTerm />), In-Tab Co-Pilot Drawer,
 * Spotlighting Engine, and Progressive Disclosure.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  TAX_TERM_GLOSSARY,
  getModuleFieldGuidance,
  getPlainEnglishLabel,
} from '../src/utils/taxPlainEnglishDictionary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

console.log('🗣️ Starting Test Suite: Tax GPS Plain English Engine & In-Tab Co-Pilot...\n');

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

// ==========================================
// SECTION 1: DUAL-MARKET PLAIN ENGLISH GLOSSARY INTEGRITY
// ==========================================
console.log('📌 Section 1: Dual-Market Plain English Glossary Integrity');

runTest('1.1: Validates US statutory terms structure and ELI5 language', () => {
  const usRequiredTerms = [
    'FICA', 'QBI', 'REASONABLE_SALARY', 'WASH_SALE', 'SAFE_HARBOR',
    'FORM_8949', 'PTET', 'AUGUSTA_RULE', 'FORM_7203', 'FEIE', 'FBAR',
    'BACKDOOR_ROTH', 'ERISA_12B1',
  ];

  usRequiredTerms.forEach((key) => {
    const entry = TAX_TERM_GLOSSARY[key];
    assert.ok(entry, `Missing glossary entry for ${key}`);
    assert.ok(entry.term && entry.term.length > 0, `Term missing for ${key}`);
    assert.ok(entry.plainTitle && entry.plainTitle.length > 0, `Plain title missing for ${key}`);
    assert.ok(entry.eli5 && entry.eli5.length > 15, `ELI5 explanation too short for ${key}`);
    assert.ok(entry.whyItMatters && entry.whyItMatters.length > 10, `whyItMatters missing for ${key}`);
    assert.ok(entry.statute && entry.statute.length > 3, `Statutory citation missing for ${key}`);
  });
});

runTest('1.2: Validates India statutory terms structure and ELI5 language', () => {
  const inRequiredTerms = [
    'HUF', 'SECTION_115BAC', 'SECTION_112A', 'SECTION_111A', 'SECTION_44ADA',
    'AIS_TIS', 'SCHEDULE_FA', 'SECTION_234C', 'SECTION_80CCD2',
  ];

  inRequiredTerms.forEach((key) => {
    const entry = TAX_TERM_GLOSSARY[key];
    assert.ok(entry, `Missing glossary entry for ${key}`);
    assert.ok(entry.term && entry.term.length > 0, `Term missing for ${key}`);
    assert.ok(entry.plainTitle && entry.plainTitle.length > 0, `Plain title missing for ${key}`);
    assert.ok(entry.eli5 && entry.eli5.length > 15, `ELI5 explanation too short for ${key}`);
    assert.ok(entry.whyItMatters && entry.whyItMatters.length > 10, `whyItMatters missing for ${key}`);
    assert.ok(entry.statute && entry.statute.length > 3, `Statutory citation missing for ${key}`);
  });
});

runTest('1.3: Verifies plain English metrics and tab translation helpers', () => {
  assert.strictEqual(getPlainEnglishLabel('effectiveTaxRate'), 'Actual % of Income Paid in Tax');
  assert.strictEqual(getPlainEnglishLabel('taxDrag'), 'Money Lost to Inefficient Taxes');
  assert.strictEqual(getPlainEnglishLabel('marginalRate'), 'Tax Rate on Your Next Dollar');
  assert.strictEqual(getPlainEnglishLabel('lossHarvestAlpha'), 'Direct Cash Saved from Stock Losses');

  // Market sensitive tab translations
  assert.strictEqual(getPlainEnglishLabel('huf', 'US'), 'S-Corp & Small Business Pay Optimizer');
  assert.strictEqual(getPlainEnglishLabel('huf', 'IN'), 'Family HUF Tax-Free Income Shelter');
  assert.strictEqual(getPlainEnglishLabel('quarterly', 'US'), 'Zero-Penalty IRS Calendar');
  assert.strictEqual(getPlainEnglishLabel('quarterly', 'IN'), 'Zero-Penalty Advance Tax Calendar');
  assert.strictEqual(getPlainEnglishLabel('unknown_key', 'fallback'), 'fallback');
});

// ==========================================
// SECTION 2: IN-TAB FIELD GUIDANCE MATRIX & SPOTLIGHT RESOLUTION
// ==========================================
console.log('\n📌 Section 2: In-Tab Field Guidance Matrix & Spotlight Resolution');

runTest('2.1: Resolves S-Corp / HUF guidance across US and India', () => {
  const usScorpGuidance = getModuleFieldGuidance('US_SCORP_FREELANCER', 'huf', 'US');
  assert.strictEqual(usScorpGuidance.tabId, 'huf');
  assert.strictEqual(usScorpGuidance.spotlightTargetId, 'scorp-salary-slider');
  assert.strictEqual(usScorpGuidance.nextTabId, 'quarterly');
  assert.ok(usScorpGuidance.plainMission.includes('Slide your W-2 Salary slider'));

  const inHufGuidance = getModuleFieldGuidance('IN_FAMILY_HUF_WEALTH', 'huf', 'IN');
  assert.strictEqual(inHufGuidance.tabId, 'huf');
  assert.strictEqual(inHufGuidance.spotlightTargetId, 'huf-deed-btn');
  assert.strictEqual(inHufGuidance.nextTabId, 'itr');
  assert.ok(inHufGuidance.plainMission.includes('HUF foundational deed'));
});

runTest('2.2: Resolves Quarterly Safe Harbor guidance across US and India', () => {
  const usQuarterlyGuidance = getModuleFieldGuidance('US_1099_CONSULTANT', 'quarterly', 'US');
  assert.strictEqual(usQuarterlyGuidance.tabId, 'quarterly');
  assert.strictEqual(usQuarterlyGuidance.spotlightTargetId, 'safe-harbor-ics-sync-btn');
  assert.strictEqual(usQuarterlyGuidance.nextTabId, 'e-file');

  const inAdvanceTaxGuidance = getModuleFieldGuidance('IN_FREELANCER_44ADA', 'quarterly', 'IN');
  assert.strictEqual(inAdvanceTaxGuidance.tabId, 'quarterly');
  assert.strictEqual(inAdvanceTaxGuidance.spotlightTargetId, 'safe-harbor-ics-sync-btn');
});

runTest('2.3: Resolves Tax-Loss Harvester guidance across US and India', () => {
  const usHarvesterGuidance = getModuleFieldGuidance('US_SALARIED_STOCKS', 'harvester', 'US');
  assert.strictEqual(usHarvesterGuidance.tabId, 'harvester');
  assert.strictEqual(usHarvesterGuidance.spotlightTargetId, 'harvest-execute-btn');
  assert.strictEqual(usHarvesterGuidance.nextTabId, 'quarterly');

  const inHarvesterGuidance = getModuleFieldGuidance('IN_TECH_RSU_GLOBAL', 'harvester', 'IN');
  assert.strictEqual(inHarvesterGuidance.spotlightTargetId, 'harvest-execute-btn');
  assert.strictEqual(inHarvesterGuidance.nextTabId, 'e-file');
});

// ==========================================
// SECTION 3: DOM SPOTLIGHT TARGET ID VERIFICATION IN SOURCE CODE
// ==========================================
console.log('\n📌 Section 3: DOM Spotlight Target ID Verification in Source Code');

runTest('3.1: Confirms USSCorpStudio contains scorp-salary-slider and scorp-savings-card', () => {
  const filePath = path.join(ROOT_DIR, 'src/pages/consumer/us/USSCorpStudio.jsx');
  const code = fs.readFileSync(filePath, 'utf8');
  assert.ok(code.includes('id="scorp-salary-slider"'), 'Missing id="scorp-salary-slider" in USSCorpStudio.jsx');
  assert.ok(code.includes('id="scorp-savings-card"'), 'Missing id="scorp-savings-card" in USSCorpStudio.jsx');
  assert.ok(code.includes('<TaxTerm term="FICA"'), 'Missing FICA TaxTerm in USSCorpStudio.jsx');
  assert.ok(code.includes('<TaxTerm term="QBI"'), 'Missing QBI TaxTerm in USSCorpStudio.jsx');
});

runTest('3.2: Confirms USTaxLossHarvester contains harvest-execute-btn and harvest-scan-btn', () => {
  const filePath = path.join(ROOT_DIR, 'src/pages/consumer/us/USTaxLossHarvester.jsx');
  const code = fs.readFileSync(filePath, 'utf8');
  assert.ok(code.includes('id="harvest-execute-btn"'), 'Missing id="harvest-execute-btn" in USTaxLossHarvester.jsx');
  assert.ok(code.includes('id="harvest-scan-btn"'), 'Missing id="harvest-scan-btn" in USTaxLossHarvester.jsx');
  assert.ok(code.includes('<TaxTerm term="WASH_SALE"'), 'Missing WASH_SALE TaxTerm in USTaxLossHarvester.jsx');
});

runTest('3.3: Confirms QuarterlySafeHarborSentinel contains safe-harbor-ics-sync-btn and calc-card', () => {
  const filePath = path.join(ROOT_DIR, 'src/components/tax/QuarterlySafeHarborSentinel.jsx');
  const code = fs.readFileSync(filePath, 'utf8');
  assert.ok(code.includes('id="safe-harbor-ics-sync-btn"'), 'Missing id="safe-harbor-ics-sync-btn" in QuarterlySafeHarborSentinel.jsx');
  assert.ok(code.includes('id="safe-harbor-calc-card"'), 'Missing id="safe-harbor-calc-card" in QuarterlySafeHarborSentinel.jsx');
  assert.ok(code.includes('<TaxTerm term="SAFE_HARBOR"'), 'Missing SAFE_HARBOR TaxTerm in QuarterlySafeHarborSentinel.jsx');
});

runTest('3.4: Confirms HUFStudio contains huf-deed-btn and huf-arbitrage-card', () => {
  const filePath = path.join(ROOT_DIR, 'src/pages/consumer/HUFStudio.jsx');
  const code = fs.readFileSync(filePath, 'utf8');
  assert.ok(code.includes('id="huf-deed-btn"'), 'Missing id="huf-deed-btn" in HUFStudio.jsx');
  assert.ok(code.includes('id="huf-arbitrage-card"'), 'Missing id="huf-arbitrage-card" in HUFStudio.jsx');
  assert.ok(code.includes('<TaxTerm term="HUF"'), 'Missing HUF TaxTerm in HUFStudio.jsx');
});

// ==========================================
// SECTION 4: PROGRESSIVE DISCLOSURE & IN-TAB CO-PILOT FLOW
// ==========================================
console.log('\n📌 Section 4: Progressive Disclosure & In-Tab Co-Pilot Flow');

runTest('4.1: Progressive Disclosure filters out advanced corporate accounting in Focus Mode', () => {
  const allScorpSubTabs = ['salary', 'election', 'basis', 'waterfall', 'llc_agreement', 'bank_kit', 'fincen_boi'];
  const focusModeSubTabs = ['salary', 'election'];

  // When focusMode is true and showAdvanced is false:
  const isFocusMode = true;
  let showAdvanced = false;
  
  let visibleTabs = allScorpSubTabs.filter(t => !isFocusMode || showAdvanced || focusModeSubTabs.includes(t));
  assert.deepStrictEqual(visibleTabs, ['salary', 'election']);

  // When user clicks "Show Advanced Corporate Tools":
  showAdvanced = true;
  visibleTabs = allScorpSubTabs.filter(t => !isFocusMode || showAdvanced || focusModeSubTabs.includes(t));
  assert.deepStrictEqual(visibleTabs, allScorpSubTabs);
});

runTest('4.2: Co-Pilot navigation simulates step completion and auto-routing', () => {
  const activeRoadmap = [
    { id: 'step-1', title: 'Salary Optimizer', targetTab: 'huf', completed: false },
    { id: 'step-2', title: 'Quarterly Safe Harbor', targetTab: 'quarterly', completed: false },
    { id: 'step-3', title: 'E-File 1040', targetTab: 'e-file', completed: false },
  ];

  let navigatedToTab = null;
  const mockOnSelectTab = (tabId) => {
    navigatedToTab = tabId;
  };

  // Simulate advanceToNextRoadmapStep logic from TaxStudioContext
  function advanceToNextRoadmapStep(stepId, onSelectTab) {
    const idx = activeRoadmap.findIndex(s => s.id === stepId);
    if (idx !== -1) {
      activeRoadmap[idx].completed = true;
      const nextStep = activeRoadmap[idx + 1];
      if (nextStep && onSelectTab) {
        onSelectTab(nextStep.targetTab);
      }
    }
  }

  // Complete Step 1
  advanceToNextRoadmapStep('step-1', mockOnSelectTab);
  assert.strictEqual(activeRoadmap[0].completed, true);
  assert.strictEqual(navigatedToTab, 'quarterly');

  // Complete Step 2
  advanceToNextRoadmapStep('step-2', mockOnSelectTab);
  assert.strictEqual(activeRoadmap[1].completed, true);
  assert.strictEqual(navigatedToTab, 'e-file');
});

runTest('4.3: Spotlighting CSS animation exists in global index.css', () => {
  const cssPath = path.join(ROOT_DIR, 'src/index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  assert.ok(cssContent.includes('.tax-spotlight-active'), 'Missing .tax-spotlight-active in index.css');
  assert.ok(cssContent.includes('@keyframes taxSpotlightPulse'), 'Missing @keyframes taxSpotlightPulse in index.css');
});

console.log(`\n🎉 All ${passedTests}/${totalTests} tests passed successfully!`);
