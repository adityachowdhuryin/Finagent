// test_us_live_endpoints.mjs
// Comprehensive live HTTP endpoint validation for all US modules

const BASE_URL = 'http://localhost:3001';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runLiveTests() {
  console.log('\n===============================================================');
  console.log('   FINAGENT US LIVE HTTP ENDPOINT COMPREHENSIVE VERIFICATION');
  console.log('===============================================================\n');

  try {
    // 1. POST /api/us-tax/calculate-amt
    console.log('--- 1. Testing /api/us-tax/calculate-amt ---');
    const amtRes = await fetch(`${BASE_URL}/api/us-tax/calculate-amt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        regularTaxableIncome: 300000,
        regularTax: 68000,
        filingStatus: 'Single',
        isoSpread: 200000,
        privateActivityBondInterest: 10000,
        saltDeductionClaimed: 10000,
      }),
    });
    const amtData = await amtRes.json();
    assert(amtRes.status === 200, 'HTTP 200 received from /api/us-tax/calculate-amt');
    assert(amtData.success === true, 'Response success is true');
    assert(amtData.amti === 520000, `AMTI accurately calculated: $${amtData.amti}`);
    assert(amtData.amtPayable > 0, `AMT payable calculated: $${amtData.amtPayable}`);
    assert(amtData.form8801CreditCarryforward > 0, `Form 8801 MTC carryforward generated: $${amtData.form8801CreditCarryforward}`);

    // 2. POST /api/us-tax/calculate-ptet
    console.log('\n--- 2. Testing /api/us-tax/calculate-ptet ---');
    const ptetRes = await fetch(`${BASE_URL}/api/us-tax/calculate-ptet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entityNetIncome: 500000,
        stateCode: 'CA',
        ownerMarginalFederalRate: 0.37,
      }),
    });
    const ptetData = await ptetRes.json();
    assert(ptetRes.status === 200, 'HTTP 200 received from /api/us-tax/calculate-ptet');
    assert(ptetData.success === true, 'Response success is true');
    assert(ptetData.ptetRatePct === '9.30%', `CA AB 150 rate is 9.30% (Got: ${ptetData.ptetRatePct})`);
    assert(ptetData.entityPTETTaxPaid === 46500, `Entity PTET paid: $46,500 (Got: ${ptetData.entityPTETTaxPaid})`);
    assert(ptetData.netFederalCashSavings > 17000, `Federal tax savings computed ($${ptetData.netFederalCashSavings})`);

    // 3. POST /api/us-tax/calculate-federal-and-state
    console.log('\n--- 3. Testing /api/us-tax/calculate-federal-and-state ---');
    const fedStateRes = await fetch(`${BASE_URL}/api/us-tax/calculate-federal-and-state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        w2Wages: 180000,
        ordinaryDividends: 5000,
        shortTermCapitalGains: 15000,
        longTermCapitalGains: 30000,
        filingStatus: 'Single',
        stateCode: 'CA',
        hsaContributions: 4150,
        qualifyingChildren: 1,
      }),
    });
    const fedStateData = await fedStateRes.json();
    assert(fedStateRes.status === 200, 'HTTP 200 received from /api/us-tax/calculate-federal-and-state');
    assert(fedStateData.success === true, 'Response success is true');
    assert(fedStateData.summary.totalFederalTax > 0, `Federal tax calculated: $${fedStateData.summary.totalFederalTax}`);
    assert(fedStateData.summary.stateTax > 0, `CA State tax calculated: $${fedStateData.summary.stateTax}`);
    assert(fedStateData.stateBreakdown.caSDITax > 0, `CA SDI tax calculated ($${fedStateData.stateBreakdown.caSDITax})`);

    // 4. POST /api/e-file/generate-schema (US Mode)
    console.log('\n--- 4. Testing /api/e-file/generate-schema (US Form 1040) ---');
    const schemaRes = await fetch(`${BASE_URL}/api/e-file/generate-schema`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        market: 'US',
        profile: {
          filingStatus: 'single',
          w2Wages: 140000,
          businessIncome: 80000,
          businessExpenses: 20000,
          milesDriven: 8000,
          hasForeignAccounts: true,
          foreignAccountsMaxBalance: 15000,
        },
      }),
    });
    const schemaData = await schemaRes.json();
    assert(schemaRes.status === 200, 'HTTP 200 received from /api/e-file/generate-schema');
    assert(schemaData.success === true, 'Response success is true');
    assert(schemaData.payload.includes('<IRS1040ScheduleC'), 'MeF XML includes Schedule C node');
    assert(schemaData.payload.includes('<IRS1040ScheduleB'), 'MeF XML includes Schedule B node');
    assert(schemaData.payload.includes('<IRS8949'), 'MeF XML includes Form 8949 node');

    // 5. POST /api/e-file/lint (US Mode: 28 statutory rules)
    console.log('\n--- 5. Testing /api/e-file/lint (US Statutory Compliance) ---');
    const lintRes = await fetch(`${BASE_URL}/api/e-file/lint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        market: 'US',
        payload: schemaData.payload,
        profile: {
          filingStatus: 'single',
          w2Wages: 140000,
          businessIncome: 80000,
          businessExpenses: 20000,
          milesDriven: 8000,
          hasForeignAccounts: true,
          foreignAccountsMaxBalance: 15000,
        },
      }),
    });
    const lintData = await lintRes.json();
    assert(lintRes.status === 200, 'HTTP 200 received from /api/e-file/lint');
    assert(lintData.success === true, 'Response success is true');
    assert(lintData.totalRulesAudited === 28, `All 28 US statutory lint rules checked (Got: ${lintData.totalRulesAudited})`);
    assert(lintData.complianceScore === 100, `Compliance audit score is 100% (Got: ${lintData.complianceScore}%)`);

    // 6. POST /api/us-scorp/optimize
    console.log('\n--- 6. Testing /api/us-scorp/optimize ---');
    const scorpRes = await fetch(`${BASE_URL}/api/us-scorp/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grossRevenue: 250000,
        operatingExpenses: 50000,
        w2Salary: 100000,
        ownerState: 'CA',
      }),
    });
    const scorpData = await scorpRes.json();
    assert(scorpRes.status === 200, 'HTTP 200 received from /api/us-scorp/optimize');
    assert(scorpData.success === true, 'Response success is true');
    assert(scorpData.summary.annualFICASaved > 0, `Annual FICA savings calculated: $${scorpData.summary.annualFICASaved}`);
    assert(scorpData.summary.totalAnnualTaxSavings > 0, `Total tax savings calculated: $${scorpData.summary.totalAnnualTaxSavings}`);

    // 7. POST /api/us-scorp/basis-worksheet (Form 7203 & § 1368 Waterfall)
    console.log('\n--- 7. Testing /api/us-scorp/basis-worksheet (Form 7203) ---');
    const basisRes = await fetch(`${BASE_URL}/api/us-scorp/basis-worksheet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        beginningStockBasis: 40000,
        capitalContributions: 10000,
        ordinaryBusinessIncome: 80000,
        shareholderDistributions: 120000,
        beginningDebtBasis: 0,
        newLoansToCompany: 0,
        loanRepayments: 0,
      }),
    });
    const basisData = await basisRes.json();
    assert(basisRes.status === 200, 'HTTP 200 received from /api/us-scorp/basis-worksheet');
    assert(basisData.success === true, 'Response success is true');
    assert(basisData.endingStockBasis >= 0, `Form 7203 ending basis cannot be negative ($${basisData.endingStockBasis})`);
    assert(basisData.allowableDistributionFromBasis === 120000, `Allowable distribution drawn from basis ($${basisData.allowableDistributionFromBasis})`);

    // 8. POST /api/us-scorp/operating-agreement
    console.log('\n--- 8. Testing /api/us-scorp/operating-agreement ---');
    const llcRes = await fetch(`${BASE_URL}/api/us-scorp/operating-agreement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: 'Apex Innovations LLC',
        state: 'DE',
        members: [
          { name: 'John Doe', units: 60, contribution: 60000 },
          { name: 'Jane Smith', units: 40, contribution: 40000 },
        ],
        preferredReturnRate: 8,
      }),
    });
    const llcData = await llcRes.json();
    assert(llcRes.status === 200, 'HTTP 200 received from /api/us-scorp/operating-agreement');
    assert(llcData.success === true, 'Response success is true');
    assert(llcData.agreementText.toUpperCase().includes('APEX INNOVATIONS LLC'), 'Agreement contains company name in header');
    assert(llcData.agreementText.includes('704(b)'), 'Agreement contains IRC § 704(b) substantial economic effect clause');

    // 9. POST /api/us-trust/generate
    console.log('\n--- 9. Testing /api/us-trust/generate ---');
    const trustRes = await fetch(`${BASE_URL}/api/us-trust/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grantorName: 'Robert Vance',
        spouseName: 'Eleanor Vance',
        maritalStatus: 'married',
        stateOfResidence: 'New York',
        distributionMethod: 'per_stirpes',
        hasSpecialNeedsBeneficiary: true,
        specialNeedsBeneficiaryName: 'Tommy Vance',
        realEstateProperties: [
          { address: '124 Hudson St, New York, NY', apnParcelNo: 'NY-MAN-402-12', estimatedValue: 3500000 }
        ],
      }),
    });
    const trustData = await trustRes.json();
    assert(trustRes.status === 200, 'HTTP 200 received from /api/us-trust/generate');
    assert(trustData.success === true, 'Response success is true');
    assert(trustData.metadata.isDecoupledState === true, 'NY detected as decoupled estate tax state ($6.94M cliff)');
    assert(trustData.packageDocuments.livingTrust.includes('PER STIRPES'), 'Document contains Per Stirpes clause');
    assert(trustData.packageDocuments.livingTrust.toUpperCase().includes('CREDIT SHELTER') || trustData.packageDocuments.livingTrust.toUpperCase().includes('MARITAL TRUST'), 'Document contains AB Marital Bypass clause');
    assert(trustData.packageDocuments.livingTrust.includes('Special Needs Trust') || trustData.packageDocuments.livingTrust.includes('Tommy Vance'), 'Document contains Special Needs Trust article');

    // 10. POST /api/us-mortgage/audit
    console.log('\n--- 10. Testing /api/us-mortgage/audit ---');
    const mortRes = await fetch(`${BASE_URL}/api/us-mortgage/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentMortgageBalanceUSD: 950000,
        county: 'San Francisco, CA',
        currentInterestRatePct: 6.875,
        homeMarketValueUSD: 1250000,
      }),
    });
    const mortData = await mortRes.json();
    assert(mortRes.status === 200, 'HTTP 200 received from /api/us-mortgage/audit');
    assert(mortData.success === true, 'Response success is true');
    assert(mortData.fhfaAnalysis.loanCategory === 'HIGH_BALANCE_CONFORMING', `SF $950k classified as HIGH_BALANCE_CONFORMING (Got: ${mortData.fhfaAnalysis.loanCategory})`);
    assert(mortData.fhfaAnalysis.countyLimit === 1149825, `2026 High-cost ceiling limit applied ($1,149,825)`);

    // 11. POST /api/us-mortgage/points-npv
    console.log('\n--- 11. Testing /api/us-mortgage/points-npv ---');
    const pointsRes = await fetch(`${BASE_URL}/api/us-mortgage/points-npv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loanAmount: 600000,
        baseRatePct: 6.75,
        pointsPurchased: 2,
        rateReductionPerPoint: 0.25,
        marginalTaxRatePct: 32,
      }),
    });
    const pointsData = await pointsRes.json();
    assert(pointsRes.status === 200, 'HTTP 200 received from /api/us-mortgage/points-npv');
    assert(pointsData.success === true, 'Response success is true');
    assert(pointsData.upfrontCost === 12000, '2 points on $600k equals $12,000 cost');
    assert(pointsData.nominalBreakevenMonths > 0, `Break-even month calculated: ${pointsData.nominalBreakevenMonths} months`);
    assert(pointsData.taxShieldYear1 > 0, `IRC § 461(g) tax deduction shield computed: $${pointsData.taxShieldYear1}`);

    // 12. POST /api/us-mortgage/arm-shock
    console.log('\n--- 12. Testing /api/us-mortgage/arm-shock ---');
    const armRes = await fetch(`${BASE_URL}/api/us-mortgage/arm-shock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loanAmount: 800000,
        initialRatePct: 5.5,
        armType: '5/1',
        initialCapPct: 2,
        periodicCapPct: 2,
        lifetimeCapPct: 5,
      }),
    });
    const armData = await armRes.json();
    assert(armRes.status === 200, 'HTTP 200 received from /api/us-mortgage/arm-shock');
    assert(armData.success === true, 'Response success is true');
    assert(armData.maxLifetimeRatePct === 10.5, 'Lifetime cap rate 5.5% + 5% = 10.5%');
    assert(armData.maxLifetimePI > armData.initialMonthlyPI, 'Max payment shock exceeds initial payment');

    // 13. POST /api/us-mortgage/fcra-dispute
    console.log('\n--- 13. Testing /api/us-mortgage/fcra-dispute ---');
    const fcraRes = await fetch(`${BASE_URL}/api/us-mortgage/fcra-dispute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consumerName: 'Alice Walker',
        consumerAddress: '456 Oak Lane, Austin, TX 78701',
        bureau: 'experian',
        creditorName: 'Midland Credit Management',
        accountNumber: '****-5678',
        customReasonText: 'Inaccurate collection balance and missing chain of custody',
      }),
    });
    const fcraData = await fcraRes.json();
    assert(fcraRes.status === 200, 'HTTP 200 received from /api/us-mortgage/fcra-dispute');
    assert(fcraData.success === true, 'Response success is true');
    assert(fcraData.letterText.includes('15 U.S.C. § 1681i'), 'Dispute letter cites FCRA § 611 (15 U.S.C. § 1681i)');
    assert(fcraData.letterText.includes('Midland Credit Management'), 'Dispute letter targets specific creditor');

    // 14. POST /api/us-mortgage/escrow-audit
    console.log('\n--- 14. Testing /api/us-mortgage/escrow-audit ---');
    const escrowRes = await fetch(`${BASE_URL}/api/us-mortgage/escrow-audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        annualPropertyTax: 9600,
        annualHazardInsurance: 2400,
        currentEscrowBalance: 3500,
      }),
    });
    const escrowData = await escrowRes.json();
    assert(escrowRes.status === 200, 'HTTP 200 received from /api/us-mortgage/escrow-audit');
    assert(escrowData.success === true, 'Response success is true');
    assert(escrowData.maxAllowableCushion === 2000, 'RESPA 1/6th cushion on $12,000 disbursements is $2,000');
    assert(escrowData.hasUnlawfulSurplus === true, 'Surplus correctly flagged when balance exceeds cushion by >$50');

    // 15. POST /api/forensic/audit (US Mode: ERISA 408(b)(2) & 12b-1 Drag)
    console.log('\n--- 15. Testing /api/forensic/audit (US Mode) ---');
    const forensicRes = await fetch(`${BASE_URL}/api/forensic/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        market: 'US',
      }),
    });
    const forensicData = await forensicRes.json();
    assert(forensicRes.status === 200, 'HTTP 200 received from /api/forensic/audit (US)');
    assert(forensicData.success === true, 'Response success is true');
    assert(forensicData.market === 'US', 'US Market confirmed in audit response');
    assert(forensicData.data.erisa5500Audit !== undefined, 'ERISA 408(b)(2) Form 5500 audit data returned');
    assert(forensicData.data.shareClassDissector.length >= 3, 'Mutual fund share class dissector returned 3+ classes');

  } catch (err) {
    console.error('Fatal error during test execution:', err);
    failed++;
  }

  console.log('\n===============================================================');
  console.log(`   LIVE HTTP SUITE: ${passed} PASSED | ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) process.exit(1);
}

runLiveTests();
