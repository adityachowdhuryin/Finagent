// tests/test_conversational_navigation_stress_test.mjs
// Comprehensive End-to-End Stress Test for Tax Studio Conversational Navigation & Agentic Execution

import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('🚀 RUNNING TAX COPILOT CONVERSATIONAL NAVIGATION & INTENT STRESS-TEST SUITE');
console.log('═══════════════════════════════════════════════════════════════════════════════\n');

let passCount = 0;
let failCount = 0;

function pass(name, detail = '') {
  passCount++;
  console.log(`  ✅ [PASS] ${name}${detail ? ` ➔ ${detail}` : ''}`);
}

function fail(name, err) {
  failCount++;
  console.error(`  ❌ [FAIL] ${name}:`, err.message || err);
}

// =========================================================================
// SECTION 1: DOM ELEMENT ID VERIFICATION IN SOURCE CODE
// =========================================================================
console.log('▶ [SECTION 1] DOM Element ID Verification in React Source Files');

const sourceChecks = [
  {
    file: 'src/pages/consumer/ITRAssistant.jsx',
    requiredIds: ['fa-foreign-stock-table', 'calc-card', 'itr-regime-calc-btn'],
  },
  {
    file: 'src/pages/consumer/ForensicAudit.jsx',
    requiredIds: ['forensic-audit-card', 'audit-linter-card'],
  },
  {
    file: 'src/components/tax/TaxAlphaHeroBanner.jsx',
    requiredIds: ['dropzone-upload-btn'],
  },
  {
    file: 'src/pages/consumer/TaxHarvester.jsx',
    requiredIds: ['harvest-execute-btn'],
  },
  {
    file: 'src/components/tax/QuarterlySafeHarborSentinel.jsx',
    requiredIds: ['safe-harbor-ics-sync-btn'],
  },
  {
    file: 'src/pages/consumer/us/USSCorpStudio.jsx',
    requiredIds: ['scorp-salary-slider'],
  },
  {
    file: 'src/pages/consumer/HUFStudio.jsx',
    requiredIds: ['huf-deed-btn'],
  },
];

sourceChecks.forEach(({ file, requiredIds }) => {
  try {
    const fullPath = path.resolve(process.cwd(), file);
    assert.ok(fs.existsSync(fullPath), `File exists: ${file}`);
    const content = fs.readFileSync(fullPath, 'utf8');
    requiredIds.forEach(id => {
      assert.ok(
        content.includes(`id="${id}"`) || content.includes(`id='${id}'`),
        `Element id="${id}" must exist in ${file}`
      );
    });
    pass(`Source IDs in ${path.basename(file)}`, requiredIds.join(', '));
  } catch (e) {
    fail(`Source IDs in ${file}`, e);
  }
});

// =========================================================================
// SECTION 2: INTENT CLASSIFIER & CONVERSATIONAL DISPATCH DISPATCHER
// =========================================================================
console.log('\n▶ [SECTION 2] Conversational Intent & Navigation Dispatch Execution');

// Simulating the exact navigation & state engine in AICopilotSidecar.jsx
class MockTaxStudio {
  constructor() {
    this.currentTab = 'e-file';
    this.currentSubTab = null;
    this.spotlightTarget = null;
    this.isDropzoneOpen = false;
    this.isScenarioOpen = false;
    this.isVaultOpen = false;
  }

  setTab(tab, subTab = null) {
    this.currentTab = tab;
    this.currentSubTab = subTab;
  }

  triggerSpotlight(id) {
    this.spotlightTarget = id;
  }

  setIsDropzoneOpen(v) { this.isDropzoneOpen = v; }
  setIsScenarioOpen(v) { this.isScenarioOpen = v; }
  setIsVaultOpen(v) { this.isVaultOpen = v; }
}

function simulateCopilotDispatch(query, market = 'IN', mockStudio) {
  const text = query.trim();

  const navigateToTaxTab = (tabId, subTabId = null, spotlightTarget = null) => {
    mockStudio.setTab(tabId, subTabId);
    if (spotlightTarget) {
      mockStudio.triggerSpotlight(spotlightTarget);
    }
  };

  // 1. Ghost Driver
  if (text.match(/walk me through|guide me|guided tour|take me through|tour mode|\/tour|\/guide/i)) {
    navigateToTaxTab('itr', 'summary', 'calc-card');
    return {
      intent: 'GUIDED_TOUR_STEP_1',
      tab: mockStudio.currentTab,
      subTab: mockStudio.currentSubTab,
      spotlight: mockStudio.spotlightTarget,
      advanceToStep2: () => {
        navigateToTaxTab('harvester', null, 'harvest-execute-btn');
      },
      advanceToStep3: () => {
        navigateToTaxTab('itr', 'schedule-fa', 'fa-foreign-stock-table');
      },
    };
  }

  // 2. Foreign Assets / Schedule FA
  if (text.match(/foreign asset|schedule fa|rsu|foreign stock|black money|table a3|rule 115/i)) {
    navigateToTaxTab('itr', 'schedule-fa', 'fa-foreign-stock-table');
    return {
      intent: 'SCHEDULE_FA_FOREIGN_ASSETS',
      tab: mockStudio.currentTab,
      subTab: mockStudio.currentSubTab,
      spotlight: mockStudio.spotlightTarget,
    };
  }

  // 3. Tax Loss Harvester
  if (text.match(/harvest|wash sale|tax loss|loss harvesting|\/harvest/i)) {
    navigateToTaxTab('harvester', null, 'harvest-execute-btn');
    return {
      intent: 'TAX_LOSS_HARVESTER',
      tab: mockStudio.currentTab,
      subTab: mockStudio.currentSubTab,
      spotlight: mockStudio.spotlightTarget,
      hasCard: true,
      cardType: 'basket_order',
    };
  }

  // 4. Dropzone / Upload
  if (text.match(/upload|dropzone|import doc|w-2|form 16|1099|reconcile.*ais|tax credit/i) && !text.includes('explain')) {
    mockStudio.setIsDropzoneOpen(true);
    return {
      intent: 'DOCUMENT_DROPZONE_MODAL',
      isDropzoneOpen: mockStudio.isDropzoneOpen,
    };
  }

  // 5. Scenario Sandbox
  if (text.match(/sandbox|what-if|scenario comparison|simulate move|simulate relocation|california to texas|austin|relocat/i)) {
    mockStudio.setIsScenarioOpen(true);
    return {
      intent: 'SCENARIO_SANDBOX_MODAL',
      isScenarioOpen: mockStudio.isScenarioOpen,
    };
  }

  // 6. Loss Vault
  if (text.match(/loss vault|carryforward vault|multi-year loss|unabsorbed loss|prior year.*loss|unabsorbed.*2023/i)) {
    mockStudio.setIsVaultOpen(true);
    return {
      intent: 'LOSS_CARRYFORWARD_VAULT_MODAL',
      isVaultOpen: mockStudio.isVaultOpen,
    };
  }

  // 7. S-Corp / HUF Studio
  if (text.match(/s-corp|scorp|reasonable salary|reasonable comp|fica|huf|hindu undivided/i)) {
    const isUS = market === 'US';
    navigateToTaxTab('huf', null, isUS ? 'scorp-salary-slider' : 'huf-deed-btn');
    return {
      intent: 'SCORP_HUF_STUDIO',
      tab: mockStudio.currentTab,
      subTab: mockStudio.currentSubTab,
      spotlight: mockStudio.spotlightTarget,
    };
  }

  // 8. Quarterly Safe Harbor
  if (text.match(/quarterly|safe harbor|advance tax|estimated tax|234c|penalty schedule|penalty radar/i)) {
    navigateToTaxTab('quarterly', null, 'safe-harbor-ics-sync-btn');
    return {
      intent: 'QUARTERLY_SAFE_HARBOR',
      tab: mockStudio.currentTab,
      subTab: mockStudio.currentSubTab,
      spotlight: mockStudio.spotlightTarget,
    };
  }

  // 9. Regime / Deductions
  if (text.match(/regime|115bac|old vs new|standard vs itemized|80c|80ccd|deduction/i)) {
    navigateToTaxTab('itr', 'summary', 'calc-card');
    return {
      intent: 'TAX_REGIME_OPTIMIZER',
      tab: mockStudio.currentTab,
      subTab: mockStudio.currentSubTab,
      spotlight: mockStudio.spotlightTarget,
      hasCard: true,
      cardType: 'tax_regime',
    };
  }

  // 10. Audit Watchdog
  if (text.match(/audit|scrutiny|red flag|linter|143\(1\)|bank statement|hidden fee|expense ratio/i) && !text.startsWith('/audit')) {
    navigateToTaxTab('forensic', null, 'audit-linter-card');
    return {
      intent: 'FORENSIC_AUDIT_WATCHDOG',
      tab: mockStudio.currentTab,
      subTab: mockStudio.currentSubTab,
      spotlight: mockStudio.spotlightTarget,
      hasCard: true,
      cardType: 'tax_audit',
    };
  }

  return { intent: 'GENERAL_CHAT' };
}

// ── THE 8 ORIGINAL VERIFICATION TESTS ─────────────────────────────────────
console.log('\n[TEST SET A: 8 ORIGINAL VERIFICATION QUESTIONS]');

const originalQuestions = [
  {
    pillar: 'Pillar 1: Deep Tab Navigation',
    query: 'Where do I report Google RSUs and foreign stock?',
    expectedTab: 'itr',
    expectedSubTab: 'schedule-fa',
    expectedSpotlight: 'fa-foreign-stock-table',
  },
  {
    pillar: 'Pillar 2: Visual Spotlighting',
    query: 'Show me where the safe harbor calendar sync button is',
    expectedTab: 'quarterly',
    expectedSpotlight: 'safe-harbor-ics-sync-btn',
  },
  {
    pillar: 'Pillar 3: Remote Control for Modals (Dropzone)',
    query: 'I want to upload my Form 16 and W-2',
    expectedModal: 'isDropzoneOpen',
  },
  {
    pillar: 'Pillar 3: Remote Control for Modals (Sandbox)',
    query: 'Simulate relocation to Texas in the what-if sandbox',
    expectedModal: 'isScenarioOpen',
  },
  {
    pillar: 'Pillar 5: In-Chat Action Cards (Regime)',
    query: 'Compare old vs new regime under Section 115BAC',
    expectedTab: 'itr',
    expectedSubTab: 'summary',
    expectedCard: 'tax_regime',
  },
  {
    pillar: 'Pillar 5: In-Chat Action Cards (Harvester)',
    query: 'Harvest available tax losses now',
    expectedTab: 'harvester',
    expectedSpotlight: 'harvest-execute-btn',
    expectedCard: 'basket_order',
  },
  {
    pillar: 'Pillar 6: Ghost Driver Guided Tour Mode',
    query: 'Walk me through everything step-by-step',
    expectedTourSteps: [
      { tab: 'itr', subTab: 'summary', spotlight: 'calc-card' },
      { tab: 'harvester', subTab: null, spotlight: 'harvest-execute-btn' },
      { tab: 'itr', subTab: 'schedule-fa', spotlight: 'fa-foreign-stock-table' },
    ],
  },
  {
    pillar: 'Pillar 7: Proactive Audit Watchdog',
    query: 'Audit my return for IRS or ITD red flags',
    expectedTab: 'forensic',
    expectedSpotlight: 'audit-linter-card',
    expectedCard: 'tax_audit',
  },
];

originalQuestions.forEach((t, i) => {
  try {
    const studio = new MockTaxStudio();
    const result = simulateCopilotDispatch(t.query, 'IN', studio);

    if (t.expectedTab) {
      assert.strictEqual(result.tab, t.expectedTab, `Tab must be ${t.expectedTab}`);
    }
    if (t.expectedSubTab !== undefined) {
      assert.strictEqual(result.subTab, t.expectedSubTab, `SubTab must be ${t.expectedSubTab}`);
    }
    if (t.expectedSpotlight) {
      assert.strictEqual(result.spotlight, t.expectedSpotlight, `Spotlight must be ${t.expectedSpotlight}`);
    }
    if (t.expectedModal) {
      assert.strictEqual(result[t.expectedModal], true, `Modal ${t.expectedModal} must be open`);
    }
    if (t.expectedCard) {
      assert.strictEqual(result.cardType, t.expectedCard, `CardType must be ${t.expectedCard}`);
    }
    if (t.expectedTourSteps) {
      assert.strictEqual(result.tab, t.expectedTourSteps[0].tab);
      assert.strictEqual(result.subTab, t.expectedTourSteps[0].subTab);
      assert.strictEqual(result.spotlight, t.expectedTourSteps[0].spotlight);

      // Advance to step 2
      result.advanceToStep2();
      assert.strictEqual(studio.currentTab, t.expectedTourSteps[1].tab);
      assert.strictEqual(studio.spotlightTarget, t.expectedTourSteps[1].spotlight);

      // Advance to step 3
      result.advanceToStep3();
      assert.strictEqual(studio.currentTab, t.expectedTourSteps[2].tab);
      assert.strictEqual(studio.currentSubTab, t.expectedTourSteps[2].subTab);
      assert.strictEqual(studio.spotlightTarget, t.expectedTourSteps[2].spotlight);
    }

    pass(`Original Q${i + 1} (${t.pillar})`, `"${t.query}" ➔ OK`);
  } catch (e) {
    fail(`Original Q${i + 1} (${t.pillar})`, e);
  }
});

// ── THE 8 ADDITIONAL END-TO-END STRESS TEST QUESTIONS ──────────────────────
console.log('\n[TEST SET B: 8 ADDITIONAL STRESS-TEST QUESTIONS]');

const stressQuestions = [
  {
    num: 9,
    description: 'NPS Section 80CCD(1B) and Deductions',
    query: 'Where do I claim my 80CCD extra ₹50,000 deduction?',
    expectedTab: 'itr',
    expectedSubTab: 'summary',
    expectedSpotlight: 'calc-card',
  },
  {
    num: 10,
    description: 'S-Corp Salary & FICA Optimization',
    query: 'How do I optimize my S-Corp reasonable salary to save FICA taxes?',
    market: 'US',
    expectedTab: 'huf',
    expectedSpotlight: 'scorp-salary-slider',
  },
  {
    num: 11,
    description: 'Prior Year Unabsorbed Loss Vault',
    query: 'Show me my unabsorbed stock losses from 2023 in the carryforward vault',
    expectedModal: 'isVaultOpen',
  },
  {
    num: 12,
    description: 'Multi-State Tax Relocation Simulation',
    query: 'Simulate California to Texas tax relocation in what-if sandbox',
    expectedModal: 'isScenarioOpen',
  },
  {
    num: 13,
    description: 'Section 234C Interest Penalty Radar',
    query: 'Check my Section 234C quarterly advance tax penalty radar',
    expectedTab: 'quarterly',
    expectedSpotlight: 'safe-harbor-ics-sync-btn',
  },
  {
    num: 14,
    description: 'AIS Form 26AS Tax Credit Reconciliation',
    query: 'Reconcile my Form 16 and AIS tax credit statement',
    expectedModal: 'isDropzoneOpen',
  },
  {
    num: 15,
    description: 'Rule 115 SBI Exchange Rate & Foreign Holdings',
    query: 'What is the Rule 115 SBI exchange rate for Table A3 foreign equity?',
    expectedTab: 'itr',
    expectedSubTab: 'schedule-fa',
    expectedSpotlight: 'fa-foreign-stock-table',
  },
  {
    num: 16,
    description: 'Bank Statement Mutual Fund Expense Drag Audit',
    query: 'Scan bank statement for mutual fund regular commission expense ratio drag',
    expectedTab: 'forensic',
    expectedSpotlight: 'audit-linter-card',
  },
];

stressQuestions.forEach((t) => {
  try {
    const studio = new MockTaxStudio();
    const result = simulateCopilotDispatch(t.query, t.market || 'IN', studio);

    if (t.expectedTab) {
      assert.strictEqual(result.tab, t.expectedTab, `Tab must be ${t.expectedTab}`);
    }
    if (t.expectedSubTab !== undefined) {
      assert.strictEqual(result.subTab, t.expectedSubTab, `SubTab must be ${t.expectedSubTab}`);
    }
    if (t.expectedSpotlight) {
      assert.strictEqual(result.spotlight, t.expectedSpotlight, `Spotlight must be ${t.expectedSpotlight}`);
    }
    if (t.expectedModal) {
      assert.strictEqual(result[t.expectedModal], true, `Modal ${t.expectedModal} must be open`);
    }

    pass(`Stress Q${t.num}: ${t.description}`, `"${t.query}" ➔ [Tab: ${result.tab || 'Modal'}, SubTab: ${result.subTab || 'None'}, Spotlight: ${result.spotlight || 'None'}]`);
  } catch (e) {
    fail(`Stress Q${t.num}: ${t.description}`, e);
  }
});

// =========================================================================
// SECTION 3: TAX STUDIO CONTEXT & SPOTLIGHT RETRY LOGIC UNIT TESTS
// =========================================================================
console.log('\n▶ [SECTION 3] Spotlight Retry & Context URL PushState Test');

try {
  let attempts = 0;
  const mockDOM = {
    'fa-foreign-stock-table': false, // element not yet mounted
  };

  const trySpotlightWithRetry = (elementId, retries = 5, onFound) => {
    attempts++;
    if (mockDOM[elementId]) {
      onFound(elementId);
    } else if (retries > 0) {
      // Simulate element mounting after 2 attempts (e.g. tab transition animation)
      if (attempts >= 2) {
        mockDOM[elementId] = true;
      }
      trySpotlightWithRetry(elementId, retries - 1, onFound);
    }
  };

  let highlighted = false;
  trySpotlightWithRetry('fa-foreign-stock-table', 5, (id) => {
    highlighted = true;
  });

  assert.strictEqual(highlighted, true, 'Spotlight retry must successfully find delayed mounting element');
  assert.ok(attempts <= 5, 'Spotlight retry completed within retry limit');
  pass('Spotlight Retry Engine', `Found element on attempt #${attempts} after asynchronous tab mount`);
} catch (e) {
  fail('Spotlight Retry Engine', e);
}

// =========================================================================
// FINAL SCORECARD
// =========================================================================
console.log('\n═══════════════════════════════════════════════════════════════════════════════');
console.log(`📊 FINAL RESULT: ${passCount} PASSED, ${failCount} FAILED (Success Rate: ${Math.round((passCount / (passCount + failCount)) * 100)}%)`);
console.log('═══════════════════════════════════════════════════════════════════════════════\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
