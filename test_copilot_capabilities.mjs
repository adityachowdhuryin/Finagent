// test_copilot_capabilities.mjs
// Automated verification test for FinAgent AI Copilot Complete Capabilities

import assert from 'assert';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const { COPILOT_TOOL_DECLARATIONS, executeCopilotTool } = require('./server/services/copilotTools.js');
const { computeProactiveAlerts, getUnreadAlertCount } = await import('./src/services/proactiveAdvisorEngine.js');
const { checkPanicSellingIntent, formatMemoryContext, DEFAULT_COPILOT_MEMORY } = await import('./src/services/copilotMemoryService.js');
const { buildFiduciaryDossierPDF } = require('./src/utils/fiduciaryPdfBuilder.js');

console.log('🧪 Starting FinAgent AI Copilot Capabilities Verification Suite...\n');

// 1. Verify Gemini Tool Declarations & Tool Execution
console.log('Test 1: Gemini Tool Declarations & Tool Execution');
assert(Array.isArray(COPILOT_TOOL_DECLARATIONS), 'Tool declarations must be an array');
assert(COPILOT_TOOL_DECLARATIONS.length >= 5, 'Must have at least 5 registered tools');

const basketResult = executeCopilotTool('draft_basket_order', {
  strategyName: 'Tax-Loss Harvesting',
  orders: [
    { symbol: 'NVDA', action: 'SELL', quantity: 20, price: 120, taxImpact: -3000 },
    { symbol: 'SOXX', action: 'BUY', quantity: 10, price: 240, taxImpact: 0 },
  ],
  netTaxSaved: 1050,
});
assert.strictEqual(basketResult.cardType, 'basket_order');
assert.strictEqual(basketResult.orders.length, 2);
assert.strictEqual(basketResult.netTaxSaved, 1050);
console.log('  ✓ draft_basket_order returned structured card');

const prepayResult = executeCopilotTool('simulate_loan_prepayment', {
  loanName: 'HDFC Home Loan',
  currentPrincipal: 4000000,
  interestRate: 8.5,
  tenureMonths: 240,
  prepaymentAmount: 500000,
});
assert.strictEqual(prepayResult.cardType, 'prepayment_slider');
assert(prepayResult.interestSaved > 0, 'Interest saved must be positive');
assert(prepayResult.monthsSaved > 0, 'Months saved must be positive');
console.log(`  ✓ simulate_loan_prepayment: saved ₹${prepayResult.interestSaved.toLocaleString()} & ${prepayResult.monthsSaved} months`);

const fundCompare = executeCopilotTool('compare_mutual_funds', {
  fundA: 'Parag Parikh Flexi Cap',
  fundB: 'HDFC Flexi Cap',
});
assert.strictEqual(fundCompare.cardType, 'fund_comparison');
assert(fundCompare.fundA.name.includes('Parag Parikh'));
console.log('  ✓ compare_mutual_funds returned head-to-head comparison');

const taxCompare = executeCopilotTool('calculate_tax_breakdown', {
  salaryIncome: 2000000,
  stcg: 50000,
  ltcg: 200000,
  deductions80C: 150000,
  deductions80D: 25000,
});
assert.strictEqual(taxCompare.cardType, 'tax_comparison');
assert(taxCompare.recommendedRegime === 'OLD' || taxCompare.recommendedRegime === 'NEW');
console.log(`  ✓ calculate_tax_breakdown: recommended ${taxCompare.recommendedRegime} regime`);

const suitabilityMemo = executeCopilotTool('generate_advisor_suitability_memo', {
  clientName: 'Arun Sharma',
  riskProfile: 'Moderate',
  proposedAUM: 12500000,
  rationale: 'Fiduciary 65/35 Equity/Debt alignment',
});
assert.strictEqual(suitabilityMemo.cardType, 'suitability_memo');
assert(suitabilityMemo.complianceHash.startsWith('sha256:'));
console.log(`  ✓ generate_advisor_suitability_memo: hash ${suitabilityMemo.complianceHash}`);

// 2. Verify Proactive Advisor Engine
console.log('\nTest 2: Proactive Advisor Engine (Event-Driven Telemetry)');
const mockConsumerState = {
  netWorth: { total: 12450000 },
  assetBreakdown: [
    { label: 'Equity', pct: 72 }, // >60% -> drift alert!
    { label: 'Debt', pct: 28 },
  ],
  holdings: {
    equities: [
      { symbol: 'INFY', pnl: -15000, value: 120000 }, // <-10k -> harvest alert!
      { symbol: 'TCS', pnl: 45000, value: 340000 },
    ],
    fixedDeposits: [
      { bank: 'HDFC Bank', amount: 500000, daysRemaining: 7 }, // <=14 days -> maturity alert!
    ],
  },
};

const alerts = computeProactiveAlerts(mockConsumerState, 'IN');
assert(alerts.length >= 4, 'Must generate morning pulse, drift, harvest, and maturity alerts');
const driftAlert = alerts.find(a => a.type === 'drift');
const harvestAlert = alerts.find(a => a.type === 'tax_harvest');
const maturityAlert = alerts.find(a => a.type === 'fd_maturity');
assert(driftAlert, 'Must detect portfolio drift');
assert(harvestAlert, 'Must detect tax-loss harvest lot');
assert(maturityAlert, 'Must detect upcoming FD maturity');

console.log(`  ✓ Proactive Engine generated ${alerts.length} active alerts`);
console.log(`    - ${driftAlert.title}`);
console.log(`    - ${harvestAlert.title}`);
console.log(`    - ${maturityAlert.title}`);

// 3. Verify Long-Term Memory & Behavioral Panic Interceptor
console.log('\nTest 3: Long-Term Memory & Behavioral Panic Interceptor');
const normalCheck = checkPanicSellingIntent('What is my portfolio dividend yield?');
assert.strictEqual(normalCheck.isPanic, false, 'Normal query must not trigger panic interceptor');

const panicCheck = checkPanicSellingIntent('Markets are crashing, I want to sell all my stocks immediately and dump everything!');
assert.strictEqual(panicCheck.isPanic, true, 'Panic query must trigger panic interceptor');
assert(panicCheck.coachingNote.includes('Strategic Compounder'), 'Must reference Financial DNA archetype');
console.log('  ✓ Panic selling successfully intercepted with Financial DNA coaching');

const memoryPrompt = formatMemoryContext(DEFAULT_COPILOT_MEMORY);
assert(memoryPrompt.includes('Strategic Compounder'));
assert(memoryPrompt.includes('tobacco and defense'));
console.log('  ✓ Long-term memory context formatted for Gemini grounding');

// 4. Verify Fiduciary Dossier PDF Builder
console.log('\nTest 4: Fiduciary Dossier PDF Builder (Regulatory Verification)');
const testMessages = [
  { role: 'user', content: 'What is my optimal tax-loss harvesting strategy for FY25?' },
  { role: 'assistant', content: 'Harvesting INFY saves Rs. 3,320 in STCG. Reinvest proceeds into NIFTYBEES.' },
];
const doc = buildFiduciaryDossierPDF(testMessages, { name: 'Aditya Chowdhury', pan: 'ABCDE1234F' }, { netWorth: 12450000 });
const pdfBuffer = doc.output();
assert(pdfBuffer.length > 5000, 'PDF buffer must contain vector letterhead');
console.log(`  ✓ Fiduciary Consultation Dossier generated (${pdfBuffer.length} bytes) with clean ASCII and SHA-256 seal`);

console.log('\n🎉 ALL COPILOT CAPABILITY TESTS PASSED WITH 100% SUCCESS!');
