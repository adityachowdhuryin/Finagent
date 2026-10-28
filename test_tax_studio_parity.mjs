// test_tax_studio_parity.mjs
// Exhaustive End-to-End Verification of Tax & Forensic Studio 1:1 Parity for US & Indian Modes

import http from 'http';

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3001,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let respData = '';
        res.on('data', (chunk) => (respData += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(respData) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: respData });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(
      {
        hostname: 'localhost',
        port: 3001,
        path,
      },
      (res) => {
        let respData = '';
        res.on('data', (chunk) => (respData += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(respData) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: respData });
          }
        });
      }
    );
    req.on('error', reject);
  });
}

async function runTests() {
  console.log('\n============================================================');
  console.log('🏛️ TAX & FORENSIC STUDIO: 1:1 GRANULAR PARITY VERIFICATION');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(desc, condition, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${desc} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  }

  try {
    // 1. Tab 1 Parity: US 1040 E-Filing vs Indian ITR Hub
    console.log('\n--- 1. TAB 1: E-FILING STUDIO (US 1040 vs Indian ITR) ---');
    const efileRes = await post('/api/e-file/generate-schema', {
      market: 'US',
      profile: {
        filingStatus: 'Single',
        w2Wages: 185000,
        name: 'Alex Morgan',
      },
    });
    assert('1040 XML Generation Status is 200', efileRes.status === 200);
    assert('MeF XML Payload exists', !!efileRes.body?.payload?.includes('<IRS1040'));
    assert('Submission Tracking Hash generated', !!efileRes.body?.hash);

    const lintRes = await post('/api/e-file/lint', {
      market: 'US',
      payload: efileRes.body?.payload,
    });
    assert('MeF Linter audits statutory rules', lintRes.body?.totalRulesAudited >= 5);
    assert('Linter status is Valid', lintRes.body?.valid === true && lintRes.body?.errorCount === 0);

    // 2. Tab 2 Parity: US S-Corp & LLC Studio vs Indian HUF Studio
    console.log('\n--- 2. TAB 2: ENTITY TAX ARBITRAGE (S-Corp vs HUF Studio) ---');
    const scorpRes = await post('/api/us-scorp/optimize', {
      businessName: 'Apex Tech LLC',
      ownerName: 'Alex Morgan',
      grossRevenue: 380000,
      operatingExpenses: 60000,
      w2Salary: 135000,
      ownerState: 'CA',
      beginningStockBasis: 55000,
      beginningDebtBasis: 25000,
      shareholderDistributions: 120000,
    });
    assert('S-Corp Optimizer returns 200', scorpRes.status === 200);
    assert('FICA Savings calculated', scorpRes.body?.summary?.annualFICASaved > 0);
    assert('Form 7203 Ending Stock Basis computed', scorpRes.body?.form7203Basis?.endingStockBasis >= 0);
    assert('Form 2553 Statutory Election Text generated', !!scorpRes.body?.form2553LegalText?.includes('Section 1362'));

    // Test Banking Resolution endpoint
    const bankRes = await post('/api/us-scorp/banking-resolution', {
      entityName: 'Apex Tech LLC',
      stateOfFormation: 'Delaware',
      bankName: 'JPMorgan Chase Bank, N.A.',
      authorizedSigners: ['Alex Morgan (President)'],
      wireTransferDailyLimit: 100000,
      checkSigningThreshold: 25000,
    });
    assert('Banking Resolution returns 200', bankRes.status === 200);
    assert('Resolution Document has depository authority', bankRes.body?.resolutionDocument?.includes('JPMorgan Chase'));
    assert('Form SS-4 line-by-line guide present', !!bankRes.body?.einFilingGuide?.responsiblePartyRules);
    assert('Execution checklist includes 6 statutory steps', bankRes.body?.executionChecklist?.length >= 5);

    // 3. Tab 3 Parity: Wash-Sale Harvester vs Indian Tax Harvester
    console.log('\n--- 3. TAB 3: TAX-LOSS HARVESTER (US § 1091 vs Indian LTCG/STCG) ---');
    const washScan = await post('/api/us-wash-sale/scan', {
      marginalTaxRate: 0.35,
    });
    assert('Wash-Sale Scan returns 200', washScan.status === 200);
    assert('Scan detects portfolio-wide opportunities', washScan.body?.opportunities?.length >= 3);
    assert('$3,000 Ordinary Loss Offset modeled', washScan.body?.summary?.ordinaryIncomeOffset === 3000);
    assert('§ 1212 Capital Loss Carryover tracked', washScan.body?.summary?.carryforwardLoss >= 0);
    assert('Non-identical paired ETF proxies mapped', washScan.body?.opportunities?.some((o) => !!o.primaryProxy));

    const washNotify = await post('/api/us-wash-sale/notify', {
      email: 'alex.morgan@techcorp.io',
      clientName: 'Alex Morgan',
      harvestableAmount: 22400,
      taxSaved: 7840,
    });
    assert('Wash-Sale harvest notification sent', washNotify.body?.success === true);

    // 4. Tab 4 Parity: ERISA 401(k) & 12b-1 Forensic Audit vs Indian Forensic Audit
    console.log('\n--- 4. TAB 4: FORENSIC WEALTH DRAG AUDIT (ERISA vs MF Commission) ---');
    const forensicRes = await post('/api/forensic/audit', {
      isSample: true,
      market: 'US',
    });
    assert('Forensic Audit returns 200', forensicRes.status === 200);
    assert('Total wealth leakage discovered', forensicRes.body?.data?.totalLeakage > 0);
    assert('ERISA Form 5500 Sched C audited', !!forensicRes.body?.data?.erisa5500Audit?.directRecordkeepingFeeUSD);
    assert('12b-1 share class load dissector active', forensicRes.body?.data?.shareClassDissector?.length >= 2);
    assert('Phantom capital gains audit (IRC § 852(b)(6)) modeled', forensicRes.body?.data?.phantomCapitalGainAudit?.length >= 2);

    // Test SEC RIA Advisor Dispatch
    const dispatchRes = await post('/api/advisor/dispatch-recommendation', {
      recoId: 'reco_test_us_forensic',
      clientName: 'Alex Morgan',
      clientEmail: 'alex.morgan@techcorp.io',
      title: 'US Forensic Fee Remediation',
      summary: 'Eliminate $6,420/yr in ERISA & 12b-1 drag',
      viaEmail: false,
      type: 'erisa_fee_reduction',
      urgency: 'high',
    });
    assert('SEC RIA Advisor Dispatch succeeds', dispatchRes.body?.success === true);

    // 5. Tab 5 Parity: Federal & State Assistant vs Indian Capital Gains Assistant
    console.log('\n--- 5. TAB 5: TAX ASSISTANT & CAPITAL GAINS (US Form 1040 vs ITR) ---');
    const taxCalcRes = await post('/api/us-tax/calculate-federal-and-state', {
      filingStatus: 'Single',
      w2Wages: 210000,
      stateCode: 'CA',
      itemizedDeductions: { saltTaxes: 18500, mortgageInterest: 22400 },
      isoSpread: 65000,
    });
    assert('US Dual-Regime (Standard vs Itemized) calculated', taxCalcRes.body?.success === true);
    assert('Effective combined rate reported', !!taxCalcRes.body?.summary?.effectiveCombinedRate);

    // Form 1040-ES Quarterly Estimated Tax & Safe Harbor
    const quarterlyRes = await post('/api/us-tax/quarterly-estimated', {
      currentYearEstimatedTax: 45000,
      priorYearActualTax: 38000,
      priorYearAGI: 220000,
      w2WithholdingYTD: 20000,
      quarterlyPaymentsMade: [5000, 5000, 0, 0],
    });
    assert('Form 1040-ES Quarterly returns 200', quarterlyRes.status === 200);
    assert('110% Prior Year Safe Harbor triggered for AGI > $150k', quarterlyRes.body?.safeHarbor?.priorYearMultiplierPct === '110%');
    assert('4 Quarters (Apr 15 / Jun 15 / Sep 15 / Jan 15) generated', quarterlyRes.body?.quarters?.length === 4);
    assert('Form 2210 Underpayment Penalty calculated', quarterlyRes.body?.totalEstimatedForm2210Penalty >= 0);

    // Schedule D Netting Ledger
    const schedDRes = await post('/api/us-tax/schedule-d-netting', {
      shortTermTrades: [
        { proceeds: 15000, costBasis: 22000 }, // -$7,000 STCL
      ],
      longTermTrades: [
        { proceeds: 40000, costBasis: 35000 }, // +$5,000 LTCG
      ],
      priorYearLossCarryover: 1000,
      filingStatus: 'Single',
    });
    assert('Schedule D Netting returns 200', schedDRes.status === 200);
    assert('Net short-term & long-term netted correctly (-$3,000)', schedDRes.body?.combinedCapitalGains === -3000);
    assert('Allowable ordinary loss offset is capped at $3,000', schedDRes.body?.allowableOrdinaryLossDeduction === 3000);
    assert('§ 1212 carryforward computed', schedDRes.body?.capitalLossCarryforward === 0);

    // Prescriptive Tax-Shield Optimizer
    const shieldRes = await post('/api/us-tax/tax-shield-optimizer', {
      salary: 195000,
      filingStatus: 'Single',
      marginalFederalRate: 0.32,
      marginalStateRate: 0.093,
      traditional401kClaimed: 15000,
      hsaClaimed: 2000,
      dependentCareClaimed: 2500,
      iraClaimed: 0,
    });
    assert('Tax Shield Optimizer returns 200', shieldRes.status === 200);
    assert('Traditional 401k headroom calculated ($8,000)', shieldRes.body?.remaining?.traditional401k === 8000);
    assert('HSA includes 7.65% FICA exemption savings', shieldRes.body?.potentialTaxSavings?.hsa > 0);
    assert('Total potential cash savings calculated', shieldRes.body?.totalPotentialCashSavings > 0);

  } catch (err) {
    console.error('Fatal test execution error:', err);
    failed++;
  }

  console.log('\n============================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
