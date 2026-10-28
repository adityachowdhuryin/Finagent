// tests/test_enterprise_commercial_readiness.mjs
// Comprehensive Institutional Verification Suite for Phases 1, 2, and 3
// Tests Schedule FA, Marginal Relief, Sec 87A restriction, Form 8606 Pro-Rata, FBAR/FATCA,
// FinCEN BOI (CTA), Ingestion Parsers, and Dual-Engine Multi-Tenant Database Persistence.

const BASE_URL = 'http://localhost:3001';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('\n================================================================');
  console.log('🚀 ENTERPRISE COMMERCIAL PRODUCTION READINESS SUITE (PHASES 1-3)');
  console.log('================================================================\n');

  // ── PHASE 1.1: India Schedule FA (Black Money Act Sec 43 Compliance) ───────
  console.log('--- TEST GROUP 1: India Schedule FA & Rule 115 SBI TT Rates ---');
  {
    const res = await fetch(`${BASE_URL}/api/tax/schedule-fa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        calendarYear: 2025,
        foreignHoldings: [
          { companyName: 'Alphabet Inc.', countryCode: '2', initialCostUSD: 25000, peakBalanceUSD: 42000, closingBalanceUSD: 39500, grossDividendsUSD: 350 },
          { companyName: 'Apple Inc.', countryCode: '2', initialCostUSD: 18000, peakBalanceUSD: 26500, closingBalanceUSD: 24800, grossDividendsUSD: 210 }
        ],
        cashAccounts: [
          { institutionName: 'Charles Schwab & Co.', accountNumber: '****5678', peakBalanceUSD: 8500, closingBalanceUSD: 4200, grossInterestUSD: 115 }
        ],
      }),
    });
    const data = await res.json();
    assert(res.ok && data.success === true, 'Schedule FA endpoint returns 200 OK');
    assert(data.conversionRateUsed === 85.5, 'Applies Rule 115 SBI TT Buying Rate of ₹85.50 / USD');
    assert(data.tableA3.length === 2, 'Generates 2 Table A3 foreign equity entries');
    assert(data.tableA1.length === 1, 'Generates 1 Table A1 foreign depository entry');
    assert(data.blackMoneyActCompliance.status === 'COMPLIANT', 'Flags Schedule FA as COMPLIANT under Sec 43');
    assert(data.blackMoneyActCompliance.penaltyExposureINR === 0, 'Zero penalty exposure when foreign assets are declared');
    assert(data.xmlSnippet.includes('<ScheduleFA>') && data.xmlSnippet.includes('<TableA3_ForeignEquityDebtInterest>'), 'Generates valid ITR-2 / ITR-3 Schedule FA XML tags');
  }

  // ── PHASE 1.2: India Surcharge, Marginal Relief & Section 87A Nuance ────────
  console.log('\n--- TEST GROUP 2: India Surcharge, Marginal Relief & Section 87A ---');
  {
    // Marginal relief jump test at ₹50,00,001
    const resRelief = await fetch(`${BASE_URL}/api/tax/surcharge-marginal-relief`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slabIncome: 5000001, stcg111A: 0, ltcg112A: 0 }),
    });
    const dRelief = await resRelief.json();
    assert(dRelief.success === true, 'Marginal relief endpoint returns success');
    assert(dRelief.surcharge.marginalReliefTriggered === true, 'Marginal relief triggers when income exceeds ₹50L by ₹1');
    assert(dRelief.surcharge.netSurchargePayable === 1, 'Statutory marginal relief caps surcharge payable to exactly ₹1 (the excess income)');
    assert(dRelief.surcharge.marginalRelief === 118999, 'Taxpayer saves exactly ₹1,18,999 in marginal relief');

    // Section 87A Finance Act 2024 restriction test
    const res87A = await fetch(`${BASE_URL}/api/tax/surcharge-marginal-relief`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slabIncome: 400000, stcg111A: 200000, ltcg112A: 0 }),
    });
    const d87A = await res87A.json();
    assert(d87A.success === true, 'Sec 87A calculation returns success');
    assert(d87A.rebate87A === 5000, 'Rebate u/s 87A is strictly restricted to slab tax (₹5,000)');
    assert(d87A.rebateRestrictedNotice !== null, 'Issues Finance Act 2024 Sec 87A capital gains restriction notice');
    assert(d87A.rebateRestrictedNotice.disallowedRebateAmount === 20000, 'Disallows ₹20,000 rebate against Section 111A capital gains tax');
  }

  // ── PHASE 1.3: US Form 8606 & Backdoor Roth Pro-Rata Trap + FBAR/FATCA ───────
  console.log('\n--- TEST GROUP 3: US Form 8606 & Backdoor Roth Pro-Rata Trap ---');
  {
    // Clean backdoor conversion
    const resClean = await fetch(`${BASE_URL}/api/us-tax/form-8606-fbar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nondeductibleContribution: 7000, yearEndTraditionalIRABalance: 0, rothConversionAmount: 7000 }),
    });
    const dClean = await resClean.json();
    assert(dClean.proRataTrap.triggered === false, 'Clean backdoor Roth detected when Line 6 is $0');
    assert(dClean.form8606.line15_taxableRothConversion === 0, 'Line 15 taxable conversion is $0');

    // Pro-rata trap trigger test
    const resTrap = await fetch(`${BASE_URL}/api/us-tax/form-8606-fbar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nondeductibleContribution: 7000,
        yearEndTraditionalIRABalance: 63000,
        rothConversionAmount: 7000,
        foreignAccounts: [
          { institutionName: 'HDFC Bank Ltd', accountNumber: '987654321', country: 'India', maxBalanceUSD: 15000, yearEndBalanceUSD: 14000 }
        ],
      }),
    });
    const dTrap = await resTrap.json();
    assert(dTrap.proRataTrap.triggered === true, 'Pro-rata trap triggered when rollover IRA balance exists ($63,000)');
    assert(dTrap.form8606.line10_nontaxableRatio === 0.1, 'Line 10 non-taxable ratio is 10% (0.10000)');
    assert(dTrap.form8606.line15_taxableRothConversion === 6300, 'Line 15 taxable conversion is $6,300 (90%)');
    assert(dTrap.proRataTrap.remedy.includes('reverse-rollover'), 'Prescribes 401(k) reverse-rollover remedy to eliminate pre-tax balance');
    assert(dTrap.crossBorderFBAR_FATCA.fbar.required === true, 'FBAR FinCEN Form 114 mandatory filing flagged ($15k > $10k)');
  }

  // ── PHASE 1.4: US FinCEN Beneficial Ownership Information (BOI) ─────────────
  console.log('\n--- TEST GROUP 4: US FinCEN BOI (Corporate Transparency Act) ---');
  {
    const resBOI = await fetch(`${BASE_URL}/api/us-scorp/fincen-boi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        legalName: 'Apex Cloud Systems LLC',
        jurisdiction: 'Delaware',
        formationDate: '2024-03-15',
        ein: '12-3456789',
        fullTimeEmployees: 4,
        annualGrossReceiptsUSD: 850000,
        owners: [
          { name: 'Aditya Chowdhury', ownershipPct: 70, isSeniorOfficer: true, officerTitle: 'Managing Member & CEO', isSubstantialControl: true },
          { name: 'Sarah Jenkins', ownershipPct: 30, isSeniorOfficer: false, officerTitle: 'VP Product', isSubstantialControl: false },
        ],
      }),
    });
    const dBOI = await resBOI.json();
    assert(dBOI.success === true, 'FinCEN BOI endpoint returns 200 OK');
    assert(dBOI.isExempt === false, 'LLC correctly classified as non-exempt Reporting Company');
    assert(dBOI.beneficialOwners.length === 2, 'Identifies both 25%+ beneficial owners');
    assert(dBOI.statutoryCivilPenaltyPerDayUSD === 591, 'Models $591/day statutory civil penalty under 31 U.S.C. 5336');
    assert(dBOI.availableExemptions.length === 23, 'Embeds all 23 statutory exemptions under 31 CFR § 1010.380(c)(2)');
  }

  // ── PHASE 2: Live Document Ingestion & Parsers ──────────────────────────────
  console.log('\n--- TEST GROUP 5: Live Document Parsers (CAS, Form 16, 1099-B, W-2) ---');
  {
    // Form 16 Parser
    const resForm16 = await fetch(`${BASE_URL}/api/tax/parse-document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rawText: `FORM NO. 16 Certificate under section 203
Employer TAN: BLRA12345B | PAN: ABCDE1234F | Employee PAN: FGHIJ5678K | AY: 2026-27
Gross Salary under section 17(1): Rs. 24,50,000
Standard Deduction under section 16(ia): Rs. 75,000
Deductions under Chapter VI-A:
Section 80C: Rs. 1,50,000
Section 80D: Rs. 25,000
Section 80CCD(1B): Rs. 50,000
Total TDS Deposited: Rs. 3,12,000`
      }),
    });
    const dForm16 = await resForm16.json();
    assert(dForm16.success === true, 'Form 16 parser executes successfully');
    assert(dForm16.employerTAN === 'BLRA12345B', 'Extracts employer TAN BLRA12345B');
    assert(dForm16.salaryDetails.grossSalarySec17_1 === 2450000, 'Extracts Sec 17(1) gross salary of ₹24,50,000');
    assert(dForm16.salaryDetails.standardDeductionSec16_ia === 75000, 'Extracts Sec 16(ia) standard deduction of ₹75,000');
    assert(dForm16.partATaxDeducted.totalTDSDeposited === 312000, 'Extracts Part A total TDS deposited of ₹3,12,000');

    // 1099-B Parser
    const res1099 = await fetch(`${BASE_URL}/api/us-tax/parse-document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rawText: `1099-B Proceeds From Broker Schwab AAPL 01/15/2024 10/12/2025 $45,000.00 $32,000.00 Box D Long-Term`
      }),
    });
    const d1099 = await res1099.json();
    assert(d1099.success === true, '1099-B parser executes successfully');
    assert(d1099.lots.length >= 1, 'Extracts tax lot from 1099-B');
    assert(d1099.lots[0].cusipOrTicker === 'AAPL', 'Extracts ticker AAPL');
    assert(d1099.lots[0].proceeds === 45000, 'Extracts proceeds of $45,000');
    assert(d1099.lots[0].costBasis === 32000, 'Extracts cost basis of $32,000');
    assert(d1099.lots[0].gainLoss === 13000, 'Computes realized gain of $13,000');
  }

  // ── PHASE 3: Dual-Engine Persistence & CPA / CA Workpapers ──────────────────
  console.log('\n--- TEST GROUP 6: Dual-Engine Persistence & CPA/CA Locking ---');
  {
    // Save draft return
    const resSave = await fetch(`${BASE_URL}/api/tax/return/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        market: 'IN',
        taxYear: 2026,
        userId: 'test_client_enterprise',
        regime: 'new',
        filingStatus: 'Salaried Individual',
        taxpayerName: 'Aditya Chowdhury',
        taxpayerId: 'ABCDE1234F',
        summary: { totalTax: 215000, stcg: 40000, ltcg: 95000 },
        lots: [
          { assetType: 'MUTUAL_FUND', symbol: 'HDFC Mid-Cap Fund', units: 150, buyPrice: 120, sellPrice: 180, gainLoss: 9000, term: 'SHORT_TERM' }
        ],
      }),
    });
    const dSave = await resSave.json();
    assert(dSave.success === true, 'Saves return to multi-tenant database');
    assert(dSave.status === 'DRAFT', 'Initial return status is DRAFT');

    // Retrieve saved return
    const resGet = await fetch(`${BASE_URL}/api/tax/return/IN/2026?userId=test_client_enterprise`);
    const dGet = await resGet.json();
    assert(dGet.success === true && dGet.exists === true, 'Retrieves persisted return from SQLite / Supabase mirror');
    assert(dGet.lots.length === 1, 'Retrieves associated tax lots');
    assert(dGet.return.taxpayer_name === 'Aditya Chowdhury', 'Matches taxpayer name');

    // Lock return with CA credentials & verify cryptographic SHA-256 seal
    const resLock = await fetch(`${BASE_URL}/api/tax/return/lock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        returnId: dSave.id,
        preparerInfo: {
          name: 'CA Rajesh Sharma',
          role: 'CA',
          membershipNo: 'ICAI-094812',
          registrationNo: 'FRN-012984N',
        },
      }),
    });
    const dLock = await resLock.json();
    assert(dLock.success === true, 'Fiduciary return locking executes successfully');
    assert(dLock.status === 'LOCKED', 'Status transitions to LOCKED');
    assert(typeof dLock.sealHash === 'string' && dLock.sealHash.length === 64, 'Generates 64-char SHA-256 cryptographic return seal');

    // Re-verify that audit trail contains the lock event
    const resAudit = await fetch(`${BASE_URL}/api/tax/return/IN/2026?userId=test_client_enterprise`);
    const dAudit = await resAudit.json();
    assert(dAudit.return.status === 'LOCKED', 'Persisted state reflects LOCKED status');
    assert(dAudit.auditTrail.length >= 1, 'Audit trail contains digital certification record');
    assert(dAudit.auditTrail[0].actor_role === 'CA', 'Identifies actor as Chartered Accountant');
    assert(dAudit.auditTrail[0].seal_hash === dLock.sealHash, 'Matches cryptographic seal hash in audit ledger');
  }

  console.log('\n================================================================');
  console.log(`🎉 ALL VERIFICATION TESTS PASSED: ${passedTests}/${totalTests} (100% SUCCESS)`);
  console.log('================================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
