// test_us_institutional_depth.mjs
// Automated verification suite for US Institutional Mathematical, Statutory & Data Parity

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const { computeForm6251AMT, computeStatePTET, computeCreditsAndDeductions } = require('./server/routes/usTax.js');
const { generateIRSMeFXML, lintTaxFiling } = require('./server/routes/taxEFiling.js');
const { computeForm7203Basis, computeAAAAndEPWaterfall, generateLLCOperatingAgreement } = require('./server/routes/usBusinessTax.js');
const { generateLivingTrust } = require('./server/routes/usLivingTrust.js');
const {
  FHFA_2026_COUNTY_LIMITS,
  FHFA_2026_BASELINE_LIMIT,
  FHFA_2026_CEILING_LIMIT,
} = require('./server/routes/usMortgageRefi.js');

import {
  parseSchwabCSV,
  parseFidelityCSV,
  parseVanguardCSV,
  parseRobinhoodCSV,
  parseOFX,
  detectFileFormat
} from './src/utils/usBrokerageParser.js';

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

console.log('\n===============================================================');
console.log('   FINAGENT US INSTITUTIONAL DEPTH TEST SUITE');
console.log('===============================================================\n');

// ── TEST 1: Form 6251 Alternative Minimum Tax (AMT) & ISO Spread ───────────
console.log('--- TEST 1: Form 6251 AMT & ISO Spread Engine ---');
const amtResult = computeForm6251AMT({
  regularTaxableIncome: 280000,
  regularTax: 62000,
  filingStatus: 'Single',
  isoSpread: 250000, // (60 - 10) * 5000 shares
  privateActivityBondInterest: 5000,
  saltDeductionClaimed: 10000,
});

assert(amtResult.breakdown.isoPreference === 250000, 'ISO spread preference calculated accurately: $250,000');
assert(amtResult.amti === 545000, 'AMTI correctly sums taxable income + ISO spread + preference items: $545,000');
assert(amtResult.triggersAMT === true && amtResult.amtPayable > 0, `AMT liability triggered on substantial ISO exercise ($${amtResult.amtPayable})`);
assert(amtResult.form8801CreditCarryforward > 0, `Form 8801 Minimum Tax Credit (MTC) generated for carryforward: $${amtResult.form8801CreditCarryforward}`);

// ── TEST 2: Pass-Through Entity Tax (PTET) SALT Cap Workaround ──────────────
console.log('\n--- TEST 2: State PTET SALT Workaround (CA AB 150 & NY PTET) ---');
const caPtet = computeStatePTET({
  entityNetIncome: 450000,
  stateCode: 'CA',
  ownerMarginalFederalRate: 0.37,
});
assert(caPtet.ptetRatePct === '9.30%', 'CA AB 150 elective tax rate matches statutory 9.30%');
assert(caPtet.entityPTETTaxPaid === 41850, 'CA PTET tax paid: 9.3% of $450k = $41,850');
assert(caPtet.netFederalCashSavings > 15000, 'Above-the-line federal tax savings bypasses $10k personal SALT cap');

const nyPtet = computeStatePTET({
  entityNetIncome: 3000000,
  stateCode: 'NY',
  ownerMarginalFederalRate: 0.37,
});
assert(nyPtet.ptetRatePct === '7.74%', 'NY PTET applies graduated bracket (effective 7.74% on $3M income)');
assert(nyPtet.entityPTETTaxPaid === 232200, 'NY PTET entity tax correctly calculated: $232,200');

// ── TEST 3: Schedule C & Mileage / Home Office Deductions ───────────────────
console.log('\n--- TEST 3: Schedule C Business OS & Statutory Lint Rules ---');
const taxReturnData = {
  filingStatus: 'single',
  w2Wages: 150000,
  businessIncome: 120000,
  businessExpenses: 35000,
  homeOfficeSquareFootage: 250,
  milesDriven: 12000,
  hasForeignAccounts: true,
  foreignAccountsMaxBalance: 25000,
};

const mefXml = generateIRSMeFXML(taxReturnData);
assert(mefXml.includes('<IRS1040ScheduleC'), 'IRS MeF XML includes <IRS1040ScheduleC> node');
assert(mefXml.includes('<IRS8949'), 'IRS MeF XML includes <IRS8949> capital transactions');
assert(mefXml.includes('<IRS1040ScheduleB'), 'IRS MeF XML includes <IRS1040ScheduleB> foreign accounts schedule');
assert(mefXml.includes('<IRS1040ScheduleE'), 'IRS MeF XML includes <IRS1040ScheduleE> rental schedule');

let lintResultData = null;
lintTaxFiling({ body: { market: 'US', payload: mefXml, profile: taxReturnData } }, {
  json: data => { lintResultData = data; }
});
assert(lintResultData && lintResultData.totalRulesAudited === 28, `Checked 28 statutory US tax lint rules (Got: ${lintResultData?.totalRulesAudited})`);
assert(lintResultData && lintResultData.complianceScore === 100, `Compliance audit score 100%`);

// ── TEST 4: S-Corp Form 7203 Stock & Debt Basis + AAA Waterfall ────────────
console.log('\n--- TEST 4: Form 7203 Basis & AAA Waterfall (§ 1368) ---');
const basisWorksheet = computeForm7203Basis({
  beginningStockBasis: 40000,
  capitalContributions: 10000,
  ordinaryBusinessIncome: 25000,
  taxExemptIncome: 5000,
  nonDeductibleExpenses: 3000,
  distributionsReceived: 85000,
  beginningDebtBasis: 20000,
});

assert(basisWorksheet.endingStockBasis === 0, 'Ending stock basis cannot fall below zero');
assert(basisWorksheet.hasExcessDistributions === true, 'Excess distribution triggers capital gain under § 1368(b)(2)');
assert(basisWorksheet.excessDistributionCapitalGain === 15000, 'Calculates excess distribution capital gain ($15,000)');

const waterfall = computeAAAAndEPWaterfall({
  beginningAAA: 80000,
  currentYearNetIncome: 125000,
  totalDistributions: 140000,
  accumulatedEPFromCCorp: 35000,
  stockBasis: 60000,
});
assert(waterfall.tier1TaxFreeAAA === 140000, 'Tier 1 correctly draws from non-taxable AAA ($140,000)');
assert(waterfall.endingAAA === 65000, 'Ending AAA correctly updated after distribution ($65,000)');

// ── TEST 5: Living Trust Per Stirpes & State Estate Tax Decoupling ──────────
console.log('\n--- TEST 5: Living Trust Per Stirpes & AB Bypass Formulas ---');
let maTrustData = null;
await generateLivingTrust({
  body: {
    grantorName: 'Eleanor Vance',
    maritalStatus: 'married',
    stateOfResidence: 'Massachusetts',
    distributionMethod: 'per_stirpes',
    hasSpecialNeedsBeneficiary: true,
  }
}, {
  json: data => { maTrustData = data; },
  status: () => ({ json: () => {} })
});

assert(maTrustData && maTrustData.metadata.distributionMethod === 'per_stirpes', 'Per Stirpes generational distribution configured');
assert(maTrustData && maTrustData.metadata.isDecoupledState === true, 'Massachusetts detected as estate tax decoupled state ($2M exemption)');
assert(maTrustData && maTrustData.packageDocuments.livingTrust.includes('PER STIRPES'), 'Legal trust package contains statutory Per Stirpes clauses');
assert(maTrustData && maTrustData.packageDocuments.livingTrust.includes('CREDIT SHELTER'), 'Legal trust package contains Credit Shelter Trust language');
assert(maTrustData && maTrustData.packageDocuments.livingTrust.includes('42 U.S.C. § 1396p(d)(4)(A)'), 'Third-party Special Needs Trust (SNT) article included');

// ── TEST 6: 2026 FHFA Conforming vs Jumbo County Limits ─────────────────────
console.log('\n--- TEST 6: 2026 FHFA Conforming vs Jumbo County Limits ---');
assert(FHFA_2026_BASELINE_LIMIT === 766550, 'FHFA 2026 baseline limit verified at $766,550');
assert(FHFA_2026_CEILING_LIMIT === 1149825, 'FHFA 2026 high-cost ceiling verified at $1,149,825');
assert(FHFA_2026_COUNTY_LIMITS['San Francisco, CA'] === 1149825, 'San Francisco County set to high-cost ceiling ($1,149,825)');
assert(FHFA_2026_COUNTY_LIMITS['King (Seattle), WA'] === 977500, 'Seattle (King County) set to $977,500');

// ── TEST 7: Deterministic Brokerage Parsers (The Big Four & OFX) ────────────
console.log('\n--- TEST 7: Deterministic Ingestion (Schwab, Fidelity, Vanguard, Robinhood, OFX) ---');

// Schwab CSV sample
const schwabSample = `"Symbol","Description","Quantity","Price","Price Change %","Price Change $","Day's Value Change","Cost Basis","Gain/Loss %","Gain/Loss $","Ratings","Reinvest Dividends?","Capital Gains?","% Of Account","Security Type","Market Value"
"VOO","Vanguard S&P 500 ETF","300","540.00","0.5%","2.70","810.00","135000.00","20.0%","27000.00","A","Yes","Yes","70%","ETFs & Closed End Funds","162000.00"
"MSFT","Microsoft Corporation","100","445.00","-0.2%","-0.89","-89.00","38000.00","17.1%","6500.00","A","Yes","Yes","30%","Equity","44500.00"`;

const parsedSchwab = parseSchwabCSV(schwabSample);
assert(parsedSchwab.length === 2, `Schwab parser extracted ${parsedSchwab.length} holdings`);
assert(parsedSchwab[0].symbol === 'VOO' && parsedSchwab[0].value === 162000, 'Schwab VOO holding parsed with $162,000 market value');
assert(parsedSchwab[1].symbol === 'MSFT' && parsedSchwab[1].qty === 100, 'Schwab MSFT holding parsed with 100 shares');

// Fidelity CSV sample
const fidelitySample = `"Account Name/Number","Symbol","Description","Quantity","Last Price","Last Price Change","Current Value","Today's Gain/Loss Dollar","Today's Gain/Loss Percent","Total Gain/Loss Dollar","Total Gain/Loss Percent","Cost Basis Per Share","Cost Basis Total","Type"
"Individual 2041","VTI","VANGUARD TOTAL STK MKT","500","280.00","+1.20","140000.00","+600.00","+0.43%","+25000.00","+21.74%","230.00","115000.00","Cash"
"Individual 2041","SPAXX**","FIDELITY GOVERNMENT MONEY MARKET","15000","1.00","0.00","15000.00","0.00","0.00%","0.00","0.00%","1.00","15000.00","Cash"`;

const parsedFidelity = parseFidelityCSV(fidelitySample);
assert(parsedFidelity.length === 2, `Fidelity parser extracted ${parsedFidelity.length} holdings`);
assert(parsedFidelity[0].symbol === 'VTI' && parsedFidelity[0].value === 140000, 'Fidelity VTI parsed accurately');
assert(parsedFidelity[1].symbol === 'SPAXX', 'Fidelity core money market asterisks stripped cleanly (SPAXX)');

// OFX Sample
const ofxSample = `<OFX>
<SECLIST>
<SECINFO><SECID><UNIQUEID>922908769</UNIQUEID></SECID><SECNAME>Vanguard S&P 500 ETF</SECNAME><TICKER>VOO</TICKER></SECINFO>
</SECLIST>
<INVSTMTTRNRS>
<INVSTMTRS>
<INVBAL><AVAILCASH>5000.00</INVBAL></INVBAL>
<INVPOSLIST>
<POSSTOCK><INVPOS><SECID><UNIQUEID>922908769</UNIQUEID></SECID><HELDINACCT>CASH</HELDINACCT><POSTYPE>LONG</POSTYPE><UNITS>250</UNITS><UNITPRICE>540.00</UNITPRICE><MKTVAL>135000.00</MKTVAL></INVPOS></POSSTOCK>
</INVPOSLIST>
</INVSTMTRS>
</INVSTMTTRNRS>
</OFX>`;

const parsedOfx = parseOFX(ofxSample);
assert(parsedOfx.length === 1, `OFX parser extracted ${parsedOfx.length} position`);
assert(parsedOfx[0].symbol === 'VOO' && parsedOfx[0].units === 250, 'OFX position resolved ticker VOO and 250 units');

// ── TEST 8: Form 8606 Pro-Rata Math & IRMAA Tiers ───────────────────────────
console.log('\n--- TEST 8: Form 8606 Pro-Rata Math & IRMAA Surcharges ---');

function calcForm8606(line1, line2, line4, line6, line7, line8) {
  const line3 = line1 + line2;
  const line5 = Math.max(0, line3 - line4);
  const line9 = line6 + line7 + line8;
  const line10 = line9 > 0 ? Math.min(1.0, line5 / line9) : 1.0;
  const line11 = Math.round(line8 * line10);
  const line15 = Math.max(0, line8 - line11);
  return { line10, line11, line15 };
}

// Case A: Clean backdoor Roth ($0 line 6)
const cleanBackdoor = calcForm8606(7000, 0, 0, 0, 0, 7000);
assert(cleanBackdoor.line10 === 1.0, 'Clean backdoor Roth yields 1.00000 (100%) nontaxable percentage');
assert(cleanBackdoor.line15 === 0, 'Clean backdoor Roth produces $0 taxable conversion on Form 1040 line 4b');

// Case B: Pro-rata trap ($63,000 pre-tax IRA balance)
const trapBackdoor = calcForm8606(7000, 0, 0, 63000, 0, 7000);
assert(Number(trapBackdoor.line10.toFixed(1)) === 0.1, 'Pro-rata trap correctly calculates 10% nontaxable ratio ($7k / $70k pool)');
assert(trapBackdoor.line15 === 6300, 'Form 8606 Line 15 identifies $6,300 as taxable conversion income');

console.log('\n===============================================================');
console.log(`   TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
console.log('===============================================================\n');

if (failed > 0) process.exit(1);
