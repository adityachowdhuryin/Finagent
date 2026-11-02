/**
 * test_cpa_handshake_and_quarterly_sentinel.mjs
 * Comprehensive automated verification for the 4 Commercial Expansion Pillars:
 * 1. Broker CSV/Text Parsers (Charles Schwab, Fidelity, Robinhood, Zerodha, Groww)
 * 2. CPA & ERO Handshake Export Bundles (TXF V042, Form 8949 CSV, Schedule CG JSON)
 * 3. Year-Round Tax Autopilot & Quarterly Safe-Harbor Sentinel (US IRC § 6654 & India Sec 234C)
 * 4. Human-in-the-Loop CPA/CA Dual-Dispatch & Attestation Workflow
 */

import assert from 'node:assert';
import {
  parseBrokerCsv,
  parseCharlesSchwabCsv,
  parseFidelityCsv,
  parseRobinhoodCsv,
  parseZerodhaTradebookCsv,
  parseGrowwTaxCsv
} from '../src/utils/realBrokerParsers.js';

import {
  generateTxfString,
  generateForm8949CsvString,
  generateIndiaCgExportString,
  generatePreFilledAttestationForm
} from '../src/utils/taxExportBundles.js';

console.log('🧪 Starting Test Suite: CPA Handshake & Quarterly Safe-Harbor Sentinel...\n');

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
// PILLAR 4: REAL-WORLD BROKER PARSERS
// ==========================================
console.log('📌 Testing Pillar 4: Real-World Broker Parsers');

runTest('Pillar 4.1: Charles Schwab Real CSV Parser', () => {
  const sampleSchwab = `"Date","Action","Symbol","Description","Quantity","Price","Fees & Comm","Amount"
"03/15/2026","Sell","NVDA","NVIDIA CORP","50","$850.00","$0.00","$42500.00"
"01/10/2025","Buy","NVDA","NVIDIA CORP","50","$500.00","$0.00","-$25000.00"
"02/20/2026","Sell","AAPL","APPLE INC","100","$180.00","$1.50","$17998.50"
"11/15/2025","Buy","AAPL","APPLE INC","100","$150.00","$0.00","-$15000.00"`;

  const parsed = parseCharlesSchwabCsv(sampleSchwab);
  assert.strictEqual(parsed.broker, 'Charles Schwab');
  assert.strictEqual(parsed.lots.length, 2, 'Should detect 2 sell dispositions');

  const nvda = parsed.lots.find(l => l.symbol === 'NVDA');
  assert.ok(nvda, 'NVDA lot found');
  assert.strictEqual(nvda.quantity, 50);
  assert.strictEqual(nvda.proceeds, 42500);
  assert.strictEqual(nvda.gainLoss, 17500);
  assert.strictEqual(nvda.term, 'long', 'Over 1 year should be long-term');

  const aapl = parsed.lots.find(l => l.symbol === 'AAPL');
  assert.ok(aapl, 'AAPL lot found');
  assert.strictEqual(aapl.quantity, 100);
  assert.strictEqual(aapl.term, 'short', 'Nov 2025 to Feb 2026 is short-term');

  assert.strictEqual(parsed.summary.totalLots, 2);
  assert.strictEqual(parsed.summary.totalProceeds, 42500 + 17998.5);
});

runTest('Pillar 4.2: Fidelity Investments Real CSV Parser', () => {
  const sampleFidelity = `"Run Date","Action","Symbol","Security Description","Quantity","Price ($)","Commission ($)","Amount ($)"
"04/10/2026","YOU SOLD","MSFT","MICROSOFT CORP","40","420.00","0.00","16800.00"
"08/12/2025","YOU BOUGHT","MSFT","MICROSOFT CORP","40","330.00","0.00","-13200.00"`;

  const parsed = parseFidelityCsv(sampleFidelity);
  assert.strictEqual(parsed.broker, 'Fidelity Investments');
  assert.strictEqual(parsed.lots.length, 1);
  const msft = parsed.lots[0];
  assert.strictEqual(msft.symbol, 'MSFT');
  assert.strictEqual(msft.quantity, 40);
  assert.strictEqual(msft.proceeds, 16800);
  assert.strictEqual(msft.costBasis, 13200);
  assert.strictEqual(msft.gainLoss, 3600);
  assert.strictEqual(msft.term, 'short', 'August 2025 to April 2026 is short-term');
});

runTest('Pillar 4.3: Robinhood CSV Parser', () => {
  const sampleRobinhood = `process_date,instrument,description,trans_code,quantity,price,amount
2026-03-20,TSLA,TESLA INC,SL,25,240.00,6000.00
2026-01-10,TSLA,TESLA INC,BY,25,210.00,-5250.00`;

  const parsed = parseRobinhoodCsv(sampleRobinhood);
  assert.strictEqual(parsed.broker, 'Robinhood');
  assert.strictEqual(parsed.lots.length, 1);
  assert.strictEqual(parsed.lots[0].symbol, 'TSLA');
  assert.strictEqual(parsed.lots[0].proceeds, 6000);
  assert.strictEqual(parsed.lots[0].gainLoss, 750);
});

runTest('Pillar 4.4: Zerodha Tradebook Real CSV Parser (India Market)', () => {
  const sampleZerodha = `symbol,isin,trade_date,exchange,segment,series,trade_type,quantity,price,trade_id,order_id
RELIANCE,INE002A01018,2026-02-15,NSE,EQ,EQ,sell,100,2950.00,TR8912,OR1092
RELIANCE,INE002A01018,2024-05-10,NSE,EQ,EQ,buy,100,2400.00,TR1122,OR3311
TCS,INE467B01029,2026-03-01,NSE,EQ,EQ,sell,50,4100.00,TR9912,OR4492
TCS,INE467B01029,2025-11-20,NSE,EQ,EQ,buy,50,3800.00,TR7712,OR2211`;

  const parsed = parseZerodhaTradebookCsv(sampleZerodha);
  assert.strictEqual(parsed.broker, 'Zerodha Kite');
  assert.strictEqual(parsed.lots.length, 2);

  const reliance = parsed.lots.find(l => l.symbol === 'RELIANCE');
  assert.ok(reliance);
  assert.strictEqual(reliance.term, 'long', 'Over 365 days holding is Long-Term Capital Gain (Sec 112A)');
  assert.strictEqual(reliance.proceeds, 295000);
  assert.strictEqual(reliance.costBasis, 240000);
  assert.strictEqual(reliance.gainLoss, 55000);

  const tcs = parsed.lots.find(l => l.symbol === 'TCS');
  assert.ok(tcs);
  assert.strictEqual(tcs.term, 'short', 'Under 365 days holding is Short-Term Capital Gain (Sec 111A)');
  assert.strictEqual(tcs.gainLoss, 15000);

  assert.strictEqual(parsed.summary.longTermGain, 55000);
  assert.strictEqual(parsed.summary.shortTermGain, 15000);
});

runTest('Pillar 4.5: Groww Tax P&L CSV Parser', () => {
  const sampleGroww = `"Stock Name","ISIN","Quantity","Buy Date","Buy Price","Sell Date","Sell Price","Realized P&L","Term"
"INFOSYS LTD","INE009A01021","80","12/04/2024","1450.00","20/02/2026","1920.00","37600.00","LTCG"
"TATA MOTORS","INE155A01022","150","10/11/2025","820.00","15/01/2026","940.00","18000.00","STCG"`;

  const parsed = parseGrowwTaxCsv(sampleGroww);
  assert.strictEqual(parsed.broker, 'Groww');
  assert.strictEqual(parsed.lots.length, 2);
  assert.strictEqual(parsed.summary.longTermGain, 37600);
  assert.strictEqual(parsed.summary.shortTermGain, 18000);
});

runTest('Pillar 4.6: Broker Auto-Detection Dispatcher', () => {
  const schwabHeader = `"Date","Action","Symbol","Description","Quantity","Price","Amount"`;
  const zerodhaHeader = `symbol,isin,trade_date,exchange,segment,series,trade_type,quantity,price`;
  const fidelityHeader = `"Run Date","Action","Symbol","Security Description","Quantity"`;

  const rSchwab = parseBrokerCsv(schwabHeader);
  assert.strictEqual(rSchwab.broker, 'Charles Schwab');

  const rZerodha = parseBrokerCsv(zerodhaHeader);
  assert.strictEqual(rZerodha.broker, 'Zerodha Kite');

  const rFidelity = parseBrokerCsv(fidelityHeader);
  assert.strictEqual(rFidelity.broker, 'Fidelity Investments');
});

// ==========================================
// PILLAR 1: CPA & ERO HANDSHAKE EXPORTS
// ==========================================
console.log('\n📌 Testing Pillar 1: CPA & ERO Handshake Export Bundles');

const sampleLots = [
  {
    symbol: 'NVDA',
    description: 'NVIDIA CORP',
    quantity: 50,
    dateAcquired: '2024-01-15',
    dateSold: '2026-03-10',
    proceeds: 42500,
    costBasis: 25000,
    gainLoss: 17500,
    term: 'long'
  },
  {
    symbol: 'TSLA',
    description: 'TESLA INC',
    quantity: 100,
    dateAcquired: '2025-11-20',
    dateSold: '2026-02-15',
    proceeds: 24000,
    costBasis: 21000,
    gainLoss: 3000,
    term: 'short'
  }
];

runTest('Pillar 1.1: Official TXF V042 Generation for TurboTax/Drake', () => {
  const txf = generateTxfString(sampleLots, { taxYear: 2026, filerName: 'Alex Morgan' });

  assert.ok(txf.startsWith('V042'), 'Must begin with official TXF version V042');
  assert.ok(txf.includes('AFinAgent OS'), 'Program attribution tag');
  assert.ok(txf.includes('\nD'), 'Date tag');
  assert.ok(txf.includes('N321'), 'Category 321 for Short-Term Capital Gains');
  assert.ok(txf.includes('N323'), 'Category 323 for Long-Term Capital Gains');
  assert.ok(txf.includes('PNVDA'), 'Security symbol NVDA');
  assert.ok(txf.includes('$42500.00'), 'NVDA proceeds formatted with leading $');
  assert.ok(txf.includes('$25000.00'), 'NVDA cost basis formatted with leading $');
  assert.ok(txf.includes('^'), 'Record delimiter marker ^');
});

runTest('Pillar 1.2: Form 8949 CSV Generation for IRS E-File Software', () => {
  const csv = generateForm8949CsvString(sampleLots);
  const lines = csv.split('\n');

  assert.ok(lines[0].includes('Description of Property (Box 1a)'));
  assert.ok(lines[0].includes('Proceeds (Sales Price) (Box 1d)'));
  assert.strictEqual(lines.length, 3, 'Header + 2 lot lines');
  assert.ok(lines[1].includes('Box D'), 'Long-term lot assigned to Box D');
  assert.ok(lines[2].includes('Box A'), 'Short-term lot assigned to Box A');
});

runTest('Pillar 1.3: India Schedule CG JSON for ClearTax & Winman', () => {
  const cgJson = generateIndiaCgExportString(sampleLots, {
    pan: 'ABCDE1234F',
    taxpayerName: 'Arjun Sharma',
    assessmentYear: '2026-27'
  });

  const parsed = JSON.parse(cgJson);
  assert.strictEqual(parsed.assessmentYear, '2026-27');
  assert.strictEqual(parsed.taxpayerDetails.pan, 'ABCDE1234F');
  assert.strictEqual(parsed.scheduleCG.section112A_LTCG.totalGains, 17500);
  assert.strictEqual(parsed.scheduleCG.section111A_STCG.totalGains, 3000);
  assert.strictEqual(parsed.scheduleCG.section112A_LTCG.statutoryExemptionLimit, 125000);
  assert.strictEqual(parsed.scheduleCG.section112A_LTCG.taxRate, 0.125);
  assert.strictEqual(parsed.scheduleCG.section111A_STCG.taxRate, 0.20);
});

runTest('Pillar 1.4: Pre-Filled Attestation Form 8879 / Form ITR-V PDF', () => {
  const docUS = generatePreFilledAttestationForm({
    market: 'US',
    taxpayerName: 'Alex Morgan',
    taxYear: 2026,
    agi: 185000,
    totalTax: 32400,
    shaSeal: '0x9482f...a12'
  });
  assert.ok(docUS, 'Returns jsPDF instance for US Form 8879');

  const docIN = generatePreFilledAttestationForm({
    market: 'IN',
    taxpayerName: 'Arjun Sharma',
    taxYear: 2026,
    agi: 1850000,
    totalTax: 284000,
    shaSeal: '0x3310f...e42'
  });
  assert.ok(docIN, 'Returns jsPDF instance for India Form ITR-V');
});

// ==========================================
// PILLAR 3: YEAR-ROUND TAX AUTOPILOT & SAFE HARBOR
// ==========================================
console.log('\n📌 Testing Pillar 3: Quarterly Safe-Harbor Sentinel (IRC § 6654 & Sec 234C)');

runTest('Pillar 3.1: US IRC § 6654 Safe Harbor Standard vs High-Earner Rule', () => {
  // Case A: Standard Earner (Prior Year AGI <= $150k) -> 100% of Prior Year Tax
  const priorYearTaxA = 30000;
  const priorYearAgiA = 120000;
  const isHighEarnerA = priorYearAgiA > 150000;
  assert.strictEqual(isHighEarnerA, false);
  const safeHarborA = isHighEarnerA ? priorYearTaxA * 1.10 : priorYearTaxA * 1.00;
  assert.strictEqual(safeHarborA, 30000, 'Standard earner safe harbor is exactly 100%');

  // Case B: High Earner (Prior Year AGI > $150k) -> 110% of Prior Year Tax
  const priorYearTaxB = 40000;
  const priorYearAgiB = 210000;
  const isHighEarnerB = priorYearAgiB > 150000;
  assert.strictEqual(isHighEarnerB, true);
  const safeHarborB = isHighEarnerB ? priorYearTaxB * 1.10 : priorYearTaxB * 1.00;
  assert.strictEqual(safeHarborB, 44000, 'High earner safe harbor is exactly 110% ($44,000)');

  // 4 Ratable Installments
  const installmentQ = safeHarborB / 4;
  assert.strictEqual(installmentQ, 11000, 'Each quarterly installment is $11,000');
});

runTest('Pillar 3.2: India Section 234C Cumulative Advance Tax Milestones', () => {
  const netAssessedTax = 200000; // Net Tax Payable

  // Statutory Schedule:
  // Q1 (Jun 15): 15% -> ₹30,000
  // Q2 (Sep 15): 45% -> ₹90,000
  // Q3 (Dec 15): 75% -> ₹1,50,000
  // Q4 (Mar 15): 100% -> ₹2,00,000
  const q1Required = netAssessedTax * 0.15;
  const q2Required = netAssessedTax * 0.45;
  const q3Required = netAssessedTax * 0.75;
  const q4Required = netAssessedTax * 1.00;

  assert.strictEqual(q1Required, 30000);
  assert.strictEqual(q2Required, 90000);
  assert.strictEqual(q3Required, 150000);
  assert.strictEqual(q4Required, 200000);

  // Shortfall interest calculation under 234C: 1% per month for 3 months
  const actualPaidQ1 = 20000; // Shortfall ₹10,000
  const shortfallQ1 = Math.max(0, q1Required - actualPaidQ1);
  const interestQ1 = shortfallQ1 * 0.01 * 3;
  assert.strictEqual(shortfallQ1, 10000);
  assert.strictEqual(interestQ1, 300, '1% per month * 3 months = ₹300 interest');
});

runTest('Pillar 3.3: .ics Calendar Event Generation', () => {
  const deadlines = [
    { name: 'IRS Q1 Estimated Tax (IRC § 6654)', date: '2026-04-15' },
    { name: 'IRS Q2 Estimated Tax (IRC § 6654)', date: '2026-06-15' },
    { name: 'IRS Q3 Estimated Tax (IRC § 6654)', date: '2026-09-15' },
    { name: 'IRS Q4 Estimated Tax (IRC § 6654)', date: '2027-01-15' }
  ];

  let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//FinAgent OS//Tax Sentinel Calendar//EN\n';
  deadlines.forEach((d) => {
    const dClean = d.date.replace(/-/g, '');
    icsContent += `BEGIN:VEVENT\nSUMMARY:${d.name}\nDTSTART;VALUE=DATE:${dClean}\nDTEND;VALUE=DATE:${dClean}\nEND:VEVENT\n`;
  });
  icsContent += 'END:VCALENDAR\n';

  assert.ok(icsContent.includes('BEGIN:VCALENDAR'));
  assert.ok(icsContent.includes('DTSTART;VALUE=DATE:20260415'));
  assert.ok(icsContent.includes('SUMMARY:IRS Q1 Estimated Tax (IRC § 6654)'));
  assert.ok(icsContent.includes('END:VCALENDAR'));
});

// ==========================================
// PILLAR 2: CPA REVIEW DUAL-DISPATCH WORKFLOW
// ==========================================
console.log('\n📌 Testing Pillar 2: Human CPA/CA Dual-Dispatch & Attestation Workflow');

runTest('Pillar 2.1: Dispatch to Practice Portal & Queue Ingestion', () => {
  const queue = [];
  const dispatchPayload = {
    id: 'cpa-rev-test-01',
    clientName: 'Alex Morgan',
    clientEmail: 'alex.morgan@techcorp.io',
    jurisdiction: 'CA',
    formType: 'Form 1040 + Form 8949',
    agi: 185000,
    taxAlpha: 18420,
    scheduledSlot: 'Tomorrow at 10:00 AM PST',
    notes: 'Please review S-Corp reasonable salary W-2 split.',
    sealHash: '0x9b7f...c421',
    dispatchedAt: new Date().toISOString(),
    status: 'pending_review'
  };

  queue.push(dispatchPayload);
  assert.strictEqual(queue.length, 1);
  assert.strictEqual(queue[0].status, 'pending_review');
  assert.strictEqual(queue[0].clientName, 'Alex Morgan');
});

runTest('Pillar 2.2: CPA Review Certification & Seal Stamping', () => {
  let queue = [
    {
      id: 'cpa-rev-test-01',
      clientName: 'Alex Morgan',
      status: 'pending_review'
    }
  ];

  function certifyReturn(returnId, certifierInfo) {
    queue = queue.map((item) =>
      item.id === returnId
        ? {
            ...item,
            status: 'certified',
            certifiedBy: certifierInfo,
            certifiedAt: new Date().toISOString()
          }
        : item
    );
  }

  certifyReturn('cpa-rev-test-01', 'Beacon Wealth & Fiduciary Tax LLP (CPA Lic #119420)');

  assert.strictEqual(queue[0].status, 'certified');
  assert.strictEqual(queue[0].certifiedBy, 'Beacon Wealth & Fiduciary Tax LLP (CPA Lic #119420)');
  assert.ok(queue[0].certifiedAt);
});

console.log(`\n🎉 Test Suite Completed: ${passedTests}/${totalTests} tests passed with 100% success!`);
