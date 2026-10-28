// server/routes/usTax.js
// High-Fidelity US Federal & 50-State Statutory Income Tax Engine (Tax Year 2026)
// Incorporates 2026 Federal Slabs, Standard vs Schedule A Itemized (SALT $10k cap),
// 50-State progressive brackets, NYC local resident tax, NIIT (3.8%), and FICA/Medicare thresholds.

const FEDERAL_BRACKETS_2026 = {
  Single: [
    { upTo: 11925, rate: 0.10 },
    { upTo: 48475, rate: 0.12 },
    { upTo: 103350, rate: 0.22 },
    { upTo: 197300, rate: 0.24 },
    { upTo: 250525, rate: 0.32 },
    { upTo: 626350, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
  MFJ: [ // Married Filing Jointly
    { upTo: 23850, rate: 0.10 },
    { upTo: 96950, rate: 0.12 },
    { upTo: 206700, rate: 0.22 },
    { upTo: 394600, rate: 0.24 },
    { upTo: 501050, rate: 0.32 },
    { upTo: 751600, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
  MFS: [ // Married Filing Separately
    { upTo: 11925, rate: 0.10 },
    { upTo: 48475, rate: 0.12 },
    { upTo: 103350, rate: 0.22 },
    { upTo: 197300, rate: 0.24 },
    { upTo: 250525, rate: 0.32 },
    { upTo: 375800, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
  HoH: [ // Head of Household
    { upTo: 17000, rate: 0.10 },
    { upTo: 64850, rate: 0.12 },
    { upTo: 103350, rate: 0.22 },
    { upTo: 197300, rate: 0.24 },
    { upTo: 250500, rate: 0.32 },
    { upTo: 626350, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
};

const STANDARD_DEDUCTION_2026 = {
  Single: 14600,
  MFJ: 29200,
  MFS: 14600,
  HoH: 21900,
};

const LTCG_BRACKETS_2026 = {
  Single: [
    { upTo: 47025, rate: 0.00 },
    { upTo: 518900, rate: 0.15 },
    { upTo: Infinity, rate: 0.20 },
  ],
  MFJ: [
    { upTo: 94050, rate: 0.00 },
    { upTo: 583750, rate: 0.15 },
    { upTo: Infinity, rate: 0.20 },
  ],
};

// 50-State Tax Rates and Bracket Rules
const STATE_TAX_DATA = {
  // Zero Income Tax States (8)
  TX: { name: 'Texas', type: 'none', rate: 0, topRate: '0.0%' },
  FL: { name: 'Florida', type: 'none', rate: 0, topRate: '0.0%' },
  NV: { name: 'Nevada', type: 'none', rate: 0, topRate: '0.0%' },
  WY: { name: 'Wyoming', type: 'none', rate: 0, topRate: '0.0%' },
  TN: { name: 'Tennessee', type: 'none', rate: 0, topRate: '0.0%' },
  SD: { name: 'South Dakota', type: 'none', rate: 0, topRate: '0.0%' },
  AK: { name: 'Alaska', type: 'none', rate: 0, topRate: '0.0%' },
  NH: { name: 'New Hampshire', type: 'none', rate: 0, topRate: '0.0%' },

  // Capital Gains Excise Only
  WA: { name: 'Washington', type: 'wa_cap_gains', rate: 0, topRate: '7.0% (Cap Gains > $250k)' },

  // Flat Tax States (13)
  AZ: { name: 'Arizona', type: 'flat', rate: 0.025, topRate: '2.50%' },
  CO: { name: 'Colorado', type: 'flat', rate: 0.044, topRate: '4.40%' },
  GA: { name: 'Georgia', type: 'flat', rate: 0.0539, topRate: '5.39%' },
  ID: { name: 'Idaho', type: 'flat', rate: 0.05695, topRate: '5.695%' },
  IL: { name: 'Illinois', type: 'flat', rate: 0.0495, topRate: '4.95%' },
  IN: { name: 'Indiana', type: 'flat', rate: 0.0305, topRate: '3.05%' },
  IA: { name: 'Iowa', type: 'flat', rate: 0.038, topRate: '3.80%' },
  KY: { name: 'Kentucky', type: 'flat', rate: 0.040, topRate: '4.00%' },
  MI: { name: 'Michigan', type: 'flat', rate: 0.0425, topRate: '4.25%' },
  MS: { name: 'Mississippi', type: 'flat', rate: 0.040, topRate: '4.00%' },
  NC: { name: 'North Carolina', type: 'flat', rate: 0.045, topRate: '4.50%' },
  PA: { name: 'Pennsylvania', type: 'flat', rate: 0.0307, topRate: '3.07%' },
  UT: { name: 'Utah', type: 'flat', rate: 0.0455, topRate: '4.55%' },

  // Flat with Surtax
  MA: {
    name: 'Massachusetts',
    type: 'flat_with_surtax',
    rate: 0.05,
    topRate: '9.0% (> $1M Surtax)',
    surtaxThreshold: 1000000,
    surtaxRate: 0.04
  },

  // Progressive Tax States (27 + DC)
  AL: {
    name: 'Alabama',
    type: 'progressive',
    topRate: '5.00%',
    brackets: [
      { upTo: 500, rate: 0.02 },
      { upTo: 3000, rate: 0.04 },
      { upTo: Infinity, rate: 0.05 },
    ]
  },
  AR: {
    name: 'Arkansas',
    type: 'progressive',
    topRate: '4.40%',
    brackets: [
      { upTo: 5000, rate: 0.02 },
      { upTo: 10000, rate: 0.04 },
      { upTo: Infinity, rate: 0.044 },
    ]
  },
  CA: {
    name: 'California',
    type: 'progressive',
    topRate: '13.3%',
    brackets: [
      { upTo: 10412, rate: 0.01 },
      { upTo: 24684, rate: 0.02 },
      { upTo: 38959, rate: 0.04 },
      { upTo: 54081, rate: 0.06 },
      { upTo: 68350, rate: 0.08 },
      { upTo: 349137, rate: 0.093 },
      { upTo: 418961, rate: 0.103 },
      { upTo: 698271, rate: 0.113 },
      { upTo: 1000000, rate: 0.123 },
      { upTo: Infinity, rate: 0.133 }, // Includes 1% Mental Health Services Tax on > $1M
    ]
  },
  CT: {
    name: 'Connecticut',
    type: 'progressive',
    topRate: '6.99%',
    brackets: [
      { upTo: 10000, rate: 0.03 },
      { upTo: 50000, rate: 0.05 },
      { upTo: 100000, rate: 0.055 },
      { upTo: Infinity, rate: 0.0699 },
    ]
  },
  DE: {
    name: 'Delaware',
    type: 'progressive',
    topRate: '6.60%',
    brackets: [
      { upTo: 2000, rate: 0.0 },
      { upTo: 5000, rate: 0.022 },
      { upTo: 10000, rate: 0.039 },
      { upTo: 20000, rate: 0.048 },
      { upTo: 25000, rate: 0.052 },
      { upTo: 60000, rate: 0.0555 },
      { upTo: Infinity, rate: 0.066 },
    ]
  },
  DC: {
    name: 'District of Columbia',
    type: 'progressive',
    topRate: '10.75%',
    brackets: [
      { upTo: 10000, rate: 0.04 },
      { upTo: 40000, rate: 0.06 },
      { upTo: 60000, rate: 0.065 },
      { upTo: 250000, rate: 0.085 },
      { upTo: 500000, rate: 0.0925 },
      { upTo: 1000000, rate: 0.0975 },
      { upTo: Infinity, rate: 0.1075 },
    ]
  },
  HI: {
    name: 'Hawaii',
    type: 'progressive',
    topRate: '11.00%',
    brackets: [
      { upTo: 2400, rate: 0.014 },
      { upTo: 4800, rate: 0.032 },
      { upTo: 9600, rate: 0.055 },
      { upTo: 14400, rate: 0.064 },
      { upTo: 19200, rate: 0.068 },
      { upTo: 24000, rate: 0.072 },
      { upTo: 36000, rate: 0.076 },
      { upTo: 48000, rate: 0.079 },
      { upTo: 150000, rate: 0.0825 },
      { upTo: 175000, rate: 0.09 },
      { upTo: 200000, rate: 0.10 },
      { upTo: Infinity, rate: 0.11 },
    ]
  },
  KS: {
    name: 'Kansas',
    type: 'progressive',
    topRate: '5.70%',
    brackets: [
      { upTo: 15000, rate: 0.031 },
      { upTo: 30000, rate: 0.0525 },
      { upTo: Infinity, rate: 0.057 },
    ]
  },
  LA: {
    name: 'Louisiana',
    type: 'progressive',
    topRate: '4.25%',
    brackets: [
      { upTo: 12500, rate: 0.0185 },
      { upTo: 50000, rate: 0.035 },
      { upTo: Infinity, rate: 0.0425 },
    ]
  },
  ME: {
    name: 'Maine',
    type: 'progressive',
    topRate: '7.15%',
    brackets: [
      { upTo: 26050, rate: 0.058 },
      { upTo: 61600, rate: 0.0675 },
      { upTo: Infinity, rate: 0.0715 },
    ]
  },
  MD: {
    name: 'Maryland',
    type: 'progressive_md',
    topRate: '5.75% + local',
    localRate: 0.032,
    brackets: [
      { upTo: 1000, rate: 0.02 },
      { upTo: 2000, rate: 0.03 },
      { upTo: 3000, rate: 0.04 },
      { upTo: 100000, rate: 0.0475 },
      { upTo: 125000, rate: 0.05 },
      { upTo: 150000, rate: 0.0525 },
      { upTo: 250000, rate: 0.055 },
      { upTo: Infinity, rate: 0.0575 },
    ]
  },
  MN: {
    name: 'Minnesota',
    type: 'progressive',
    topRate: '9.85%',
    brackets: [
      { upTo: 30070, rate: 0.0535 },
      { upTo: 98760, rate: 0.068 },
      { upTo: 183340, rate: 0.0785 },
      { upTo: Infinity, rate: 0.0985 },
    ]
  },
  MO: {
    name: 'Missouri',
    type: 'progressive',
    topRate: '4.70%',
    brackets: [
      { upTo: 1273, rate: 0.0 },
      { upTo: 2546, rate: 0.02 },
      { upTo: 3819, rate: 0.025 },
      { upTo: 5092, rate: 0.03 },
      { upTo: 6365, rate: 0.035 },
      { upTo: 7638, rate: 0.04 },
      { upTo: 8911, rate: 0.045 },
      { upTo: Infinity, rate: 0.047 },
    ]
  },
  MT: {
    name: 'Montana',
    type: 'progressive',
    topRate: '5.90%',
    brackets: [
      { upTo: 20500, rate: 0.047 },
      { upTo: Infinity, rate: 0.059 },
    ]
  },
  NE: {
    name: 'Nebraska',
    type: 'progressive',
    topRate: '5.84%',
    brackets: [
      { upTo: 3700, rate: 0.0246 },
      { upTo: 22170, rate: 0.0351 },
      { upTo: 35730, rate: 0.0501 },
      { upTo: Infinity, rate: 0.0584 },
    ]
  },
  NJ: {
    name: 'New Jersey',
    type: 'progressive',
    topRate: '10.75%',
    brackets: [
      { upTo: 20000, rate: 0.014 },
      { upTo: 35000, rate: 0.0175 },
      { upTo: 40000, rate: 0.035 },
      { upTo: 75000, rate: 0.05525 },
      { upTo: 500000, rate: 0.0637 },
      { upTo: 1000000, rate: 0.0897 },
      { upTo: Infinity, rate: 0.1075 },
    ]
  },
  NM: {
    name: 'New Mexico',
    type: 'progressive',
    topRate: '5.90%',
    brackets: [
      { upTo: 5500, rate: 0.017 },
      { upTo: 11000, rate: 0.032 },
      { upTo: 16000, rate: 0.047 },
      { upTo: 210000, rate: 0.049 },
      { upTo: Infinity, rate: 0.059 },
    ]
  },
  NY: {
    name: 'New York (State & NYC)',
    type: 'progressive_nyc',
    topRate: '10.9% (NYS) / 14.8% (NYC)',
    nysBrackets: [
      { upTo: 8500, rate: 0.04 },
      { upTo: 11700, rate: 0.045 },
      { upTo: 13900, rate: 0.0525 },
      { upTo: 80650, rate: 0.055 },
      { upTo: 215400, rate: 0.06 },
      { upTo: 1077550, rate: 0.0685 },
      { upTo: 5000000, rate: 0.0965 },
      { upTo: 25000000, rate: 0.103 },
      { upTo: Infinity, rate: 0.109 },
    ],
    nycBrackets: [
      { upTo: 12000, rate: 0.03078 },
      { upTo: 25000, rate: 0.03762 },
      { upTo: 50000, rate: 0.03819 },
      { upTo: Infinity, rate: 0.03876 },
    ]
  },
  ND: {
    name: 'North Dakota',
    type: 'progressive',
    topRate: '2.50%',
    brackets: [
      { upTo: 44725, rate: 0.0195 },
      { upTo: Infinity, rate: 0.025 },
    ]
  },
  OH: {
    name: 'Ohio',
    type: 'progressive',
    topRate: '3.50%',
    brackets: [
      { upTo: 26050, rate: 0 },
      { upTo: 100000, rate: 0.0275 },
      { upTo: Infinity, rate: 0.035 }
    ]
  },
  OK: {
    name: 'Oklahoma',
    type: 'progressive',
    topRate: '4.75%',
    brackets: [
      { upTo: 1000, rate: 0.0025 },
      { upTo: 2500, rate: 0.0075 },
      { upTo: 3750, rate: 0.0175 },
      { upTo: 4900, rate: 0.0275 },
      { upTo: 7200, rate: 0.0375 },
      { upTo: Infinity, rate: 0.0475 },
    ]
  },
  OR: {
    name: 'Oregon',
    type: 'progressive',
    topRate: '9.90%',
    brackets: [
      { upTo: 4050, rate: 0.0475 },
      { upTo: 10200, rate: 0.0675 },
      { upTo: 125000, rate: 0.0875 },
      { upTo: Infinity, rate: 0.099 },
    ]
  },
  RI: {
    name: 'Rhode Island',
    type: 'progressive',
    topRate: '5.99%',
    brackets: [
      { upTo: 77450, rate: 0.0375 },
      { upTo: 176050, rate: 0.0475 },
      { upTo: Infinity, rate: 0.0599 },
    ]
  },
  SC: {
    name: 'South Carolina',
    type: 'progressive',
    topRate: '6.20%',
    brackets: [
      { upTo: 3460, rate: 0 },
      { upTo: 17330, rate: 0.03 },
      { upTo: Infinity, rate: 0.062 },
    ]
  },
  VA: {
    name: 'Virginia',
    type: 'progressive',
    topRate: '5.75%',
    brackets: [
      { upTo: 3000, rate: 0.02 },
      { upTo: 5000, rate: 0.03 },
      { upTo: 17000, rate: 0.05 },
      { upTo: Infinity, rate: 0.0575 },
    ]
  },
  VT: {
    name: 'Vermont',
    type: 'progressive',
    topRate: '8.75%',
    brackets: [
      { upTo: 45400, rate: 0.0335 },
      { upTo: 110050, rate: 0.066 },
      { upTo: 229550, rate: 0.076 },
      { upTo: Infinity, rate: 0.0875 },
    ]
  },
  WV: {
    name: 'West Virginia',
    type: 'progressive',
    topRate: '5.12%',
    brackets: [
      { upTo: 10000, rate: 0.0236 },
      { upTo: 25000, rate: 0.0315 },
      { upTo: 40000, rate: 0.0354 },
      { upTo: 60000, rate: 0.0472 },
      { upTo: Infinity, rate: 0.0512 },
    ]
  },
  WI: {
    name: 'Wisconsin',
    type: 'progressive',
    topRate: '7.65%',
    brackets: [
      { upTo: 14320, rate: 0.035 },
      { upTo: 28640, rate: 0.044 },
      { upTo: 315310, rate: 0.053 },
      { upTo: Infinity, rate: 0.0765 },
    ]
  },

  // US Overseas Territories (5)
  PR: {
    name: 'Puerto Rico (Commonwealth)',
    type: 'territory_pr',
    topRate: '33.0% (PR Hacienda) / 0% Act 60 Decree',
    brackets: [
      { upTo: 9000, rate: 0.07 },
      { upTo: 25000, rate: 0.14 },
      { upTo: 41500, rate: 0.25 },
      { upTo: Infinity, rate: 0.33 },
    ]
  },
  VI: {
    name: 'U.S. Virgin Islands (VIBIR)',
    type: 'territory_vi',
    topRate: 'IRC § 932 Mirror Single Return',
  },
  GU: {
    name: 'Guam (DRT Mirror Code)',
    type: 'territory_gu',
    topRate: 'IRC § 935 Mirror Single Return',
  },
  MP: {
    name: 'Northern Mariana Islands (CNMI DRT)',
    type: 'territory_mp',
    topRate: 'IRC § 935 Mirror Single Return',
  },
  AS: {
    name: 'American Samoa (Non-Mirror)',
    type: 'territory_as',
    topRate: 'IRC § 931 Local Territorial Tax (4%-10%)',
    rate: 0.06,
  },
};

// Generic fallback for any other US state
function getGenericStateRate(stateCode) {
  if (STATE_TAX_DATA[stateCode]) return STATE_TAX_DATA[stateCode];
  return { name: `State of ${stateCode}`, type: 'flat', rate: 0.045, topRate: '4.50%' };
}

function calculateProgressiveTax(income, brackets) {
  let tax = 0;
  let prevLimit = 0;
  for (const b of brackets) {
    if (income <= prevLimit) break;
    const taxableChunk = Math.min(income, b.upTo) - prevLimit;
    tax += taxableChunk * b.rate;
    prevLimit = b.upTo;
  }
  return Math.round(tax);
}

// ── Overseas US Territories Statutory Tax Engine (IRC § 931, § 932, § 933, § 935) ──
function computeTerritoryTax({
  territoryCode = 'PR',
  usSourceIncome = 0,
  territorySourceIncome = 150000,
  act60Decree = false,
  capitalGains = 0,
  filingStatus = 'Single'
}) {
  const code = (territoryCode || 'PR').toUpperCase();

  if (code === 'PR') {
    // Puerto Rico IRC § 933 (Bona Fide PR Resident Source Income Exclusion) & Act 60
    const prBrackets = [
      { upTo: 9000, rate: 0.07 },
      { upTo: 25000, rate: 0.14 },
      { upTo: 41500, rate: 0.25 },
      { upTo: Infinity, rate: 0.33 },
    ];
    const baseHaciendaTax = calculateProgressiveTax(territorySourceIncome, prBrackets);
    const prCapGainsRate = act60Decree ? 0.00 : 0.15;
    const prCapGainsTax = Math.round(capitalGains * prCapGainsRate);
    const totalTerritoryTax = baseHaciendaTax + prCapGainsTax;

    return {
      territoryCode: 'PR',
      territoryName: 'Puerto Rico',
      governingStatute: 'IRC § 933 & Act 60 (Ley 60 de 2019)',
      filingRequirement: 'Form 482 (Departamento de Hacienda). Form 1040 required only for US mainland source income.',
      usSourceIncome: Number(usSourceIncome),
      territorySourceIncome: Number(territorySourceIncome),
      act60Eligible: true,
      act60Claimed: !!act60Decree,
      act60CapitalGainsRate: '0.0%',
      capitalGainsTax: prCapGainsTax,
      baseTerritoryTax: baseHaciendaTax,
      totalTerritoryTax,
      usGrossExclusionAmount: Number(territorySourceIncome),
      details: act60Decree
        ? 'IRC § 933 excludes PR-source income from US Form 1040. Act 60 Individual Investor decree eliminates all capital gains tax (0.0%).'
        : 'IRC § 933 excludes PR-source income from US Form 1040. PR Hacienda graduated rates apply up to 33%, plus 15% standard capital gains tax.'
    };
  }

  if (code === 'VI') {
    // US Virgin Islands IRC § 932 (Mirror Code Single Return)
    return {
      territoryCode: 'VI',
      territoryName: 'U.S. Virgin Islands',
      governingStatute: 'IRC § 932(c) Single Mirror Return Rule',
      filingRequirement: 'Single mirror Form 1040 filed directly with Virgin Islands Bureau of Internal Revenue (VIBIR).',
      usSourceIncome: Number(usSourceIncome),
      territorySourceIncome: Number(territorySourceIncome),
      act60Eligible: false,
      act60Claimed: false,
      isMirrorCode: true,
      satisfiesUSFederalObligation: true,
      details: 'Under IRC § 932(c), a bona fide USVI resident files a single return with VIBIR; no separate return or tax is due directly to the IRS.'
    };
  }

  if (code === 'GU' || code === 'MP') {
    // Guam & CNMI IRC § 935 (Single Return Coordination)
    const name = code === 'GU' ? 'Guam' : 'Northern Mariana Islands';
    const agency = code === 'GU' ? 'Guam Department of Revenue & Taxation (DRT)' : 'CNMI Division of Revenue & Taxation';
    return {
      territoryCode: code,
      territoryName: name,
      governingStatute: 'IRC § 935 Coordination of Individual Income Taxes',
      filingRequirement: `Single mirror return filed with ${agency}. 0 separate return with the IRS.`,
      usSourceIncome: Number(usSourceIncome),
      territorySourceIncome: Number(territorySourceIncome),
      act60Eligible: false,
      act60Claimed: false,
      isMirrorCode: true,
      satisfiesUSFederalObligation: true,
      details: `IRC § 935 relieves bona fide residents of ${name} from dual-filing; all income is reported on a single return filed locally with ${agency}.`
    };
  }

  // American Samoa IRC § 931 (Non-Mirror Exclusion)
  const asTax = Math.round(Number(territorySourceIncome) * 0.06);
  return {
    territoryCode: 'AS',
    territoryName: 'American Samoa',
    governingStatute: 'IRC § 931 Non-Mirror Territorial Income System',
    filingRequirement: 'AS Government Tax Office return for territorial income; Form 1040 for US-source income.',
    usSourceIncome: Number(usSourceIncome),
    territorySourceIncome: Number(territorySourceIncome),
    act60Eligible: false,
    act60Claimed: false,
    isMirrorCode: false,
    usGrossExclusionAmount: Number(territorySourceIncome),
    totalTerritoryTax: asTax,
    details: 'IRC § 931 excludes American Samoa-source income from US Form 1040 gross income. Territorial income is taxed locally by American Samoa Tax Office.'
  };
}

// ── US Expatriate Relief Engine (Form 2555 FEIE vs Form 1116 FTC) ──
function computeExpatTaxRelief({
  foreignEarnedIncome = 0,
  foreignTaxesPaid = 0,
  foreignDaysPresent = 335,
  totalTaxableIncome = 200000,
  baseUsTax = 35000,
  filingStatus = 'Single'
}) {
  const FEIE_MAX_2026 = 130000; // Statutory 2026 ceiling under IRC § 911(b)(2)(D)
  const QUALIFYING_DAYS_THRESHOLD = 330; // Physical Presence Test (330 full days in any 12-month period)

  const qualifiesByPresence = Number(foreignDaysPresent) >= QUALIFYING_DAYS_THRESHOLD;
  const eligibleEarnedIncome = Math.min(Number(foreignEarnedIncome), FEIE_MAX_2026);

  // 1. Form 2555 FEIE Calculation with IRC § 911(f) Stacking Rule
  let feieTaxSavings = 0;
  let netTaxWithFEIE = baseUsTax;

  if (qualifiesByPresence && eligibleEarnedIncome > 0) {
    const fedBrackets = FEDERAL_BRACKETS_2026[filingStatus] || FEDERAL_BRACKETS_2026.Single;
    const taxOnExclusion = calculateProgressiveTax(eligibleEarnedIncome, fedBrackets);
    feieTaxSavings = Math.min(taxOnExclusion, baseUsTax);
    netTaxWithFEIE = Math.max(0, baseUsTax - feieTaxSavings);
  }

  // 2. Form 1116 Foreign Tax Credit (FTC) Calculation
  const foreignSourceRatio = totalTaxableIncome > 0
    ? Math.min(1.0, Number(foreignEarnedIncome) / totalTaxableIncome)
    : 0;
  const ftcLimitation = Math.round(baseUsTax * foreignSourceRatio);
  const allowableFTC = Math.min(Number(foreignTaxesPaid), ftcLimitation);
  const netTaxWithFTC = Math.max(0, baseUsTax - allowableFTC);
  const ftcExcessCarriedForward = Math.max(0, Number(foreignTaxesPaid) - allowableFTC);

  // 3. Dual Strategy Optimizer
  let recommendedStrategy = 'Form 2555 FEIE';
  let optimalSavings = feieTaxSavings;
  let finalNetTax = netTaxWithFEIE;
  let strategicRationale = '';

  if (!qualifiesByPresence) {
    recommendedStrategy = allowableFTC > 0 ? 'Form 1116 FTC' : 'None (Below 330-Day Presence Threshold)';
    optimalSavings = allowableFTC;
    finalNetTax = netTaxWithFTC;
    strategicRationale = `Taxpayer did not meet the statutory 330-day physical presence test (${foreignDaysPresent}/330 days). Form 1116 Foreign Tax Credit is evaluated as the sole primary relief mechanism.`;
  } else if (netTaxWithFTC < netTaxWithFEIE) {
    recommendedStrategy = 'Form 1116 FTC';
    optimalSavings = allowableFTC;
    finalNetTax = netTaxWithFTC;
    strategicRationale = `Foreign income taxes paid ($${Number(foreignTaxesPaid).toLocaleString()}) exceed FEIE shelter value. Claiming Form 1116 yields higher net tax reduction ($${allowableFTC.toLocaleString()} vs $${feieTaxSavings.toLocaleString()}) and generates $${ftcExcessCarriedForward.toLocaleString()} in carryforward credits.`;
  } else {
    recommendedStrategy = 'Form 2555 FEIE';
    optimalSavings = feieTaxSavings;
    finalNetTax = netTaxWithFEIE;
    strategicRationale = `Form 2555 excludes $${eligibleEarnedIncome.toLocaleString()} from US taxation under IRC § 911, reducing net federal liability by $${feieTaxSavings.toLocaleString()} (outperforming Form 1116 FTC).`;
  }

  return {
    qualifiesForFEIE: qualifiesByPresence,
    physicalPresenceTest: {
      daysPresent: Number(foreignDaysPresent),
      requiredDays: QUALIFYING_DAYS_THRESHOLD,
      passed: qualifiesByPresence,
    },
    feie2026Limit: FEIE_MAX_2026,
    feieExcludedAmount: qualifiesByPresence ? eligibleEarnedIncome : 0,
    feieTaxSavings,
    netTaxWithFEIE,
    form1116FTC: {
      foreignTaxesPaid: Number(foreignTaxesPaid),
      foreignSourceRatio: (foreignSourceRatio * 100).toFixed(1) + '%',
      ftcLimitation,
      allowableFTC,
      excessFTCCarriedForward: ftcExcessCarriedForward,
      netTaxWithFTC,
    },
    recommendedStrategy,
    optimalSavings,
    finalNetTax,
    strategicRationale
  };
}

function calculateStateTax(taxableIncome, stateCode, isNYCResident = false, capitalGains = 0, territoryOptions = {}) {
  const upperCode = (stateCode || 'CA').toUpperCase();
  const stateData = getGenericStateRate(upperCode);

  if (stateData.type === 'none') {
    return { stateTax: 0, stateRatePct: '0.0%', details: `${stateData.name} has no individual state income tax.` };
  }

  if (stateData.type === 'wa_cap_gains') {
    const waTax = capitalGains > 250000 ? Math.round((capitalGains - 250000) * 0.07) : 0;
    return {
      stateTax: waTax,
      stateRatePct: waTax > 0 ? '7.0%' : '0.0%',
      details: waTax > 0
        ? `WA 7% excise tax on long-term capital gains exceeding $250,000 threshold.`
        : `Washington has zero wage tax and capital gains remain below the $250k threshold.`
    };
  }

  if (stateData.type === 'flat') {
    const tax = Math.round(taxableIncome * stateData.rate);
    return {
      stateTax: tax,
      stateRatePct: (stateData.rate * 100).toFixed(2) + '%',
      details: `${stateData.name} flat income tax rate of ${(stateData.rate * 100).toFixed(2)}%.`
    };
  }

  if (stateData.type === 'flat_with_surtax') {
    let tax = taxableIncome * stateData.rate;
    if (taxableIncome > stateData.surtaxThreshold) {
      tax += (taxableIncome - stateData.surtaxThreshold) * stateData.surtaxRate;
    }
    const finalTax = Math.round(tax);
    return {
      stateTax: finalTax,
      stateRatePct: `${((finalTax / (taxableIncome || 1)) * 100).toFixed(2)}% (Effective)`,
      details: `${stateData.name} base 5% rate plus 4% Fair Share surtax on taxable income exceeding $1M.`
    };
  }

  if (stateData.type === 'progressive_md') {
    const baseStateTax = calculateProgressiveTax(taxableIncome, stateData.brackets);
    const localCountyTax = Math.round(taxableIncome * (stateData.localRate || 0.032));
    const totalMDTax = baseStateTax + localCountyTax;
    return {
      stateTax: totalMDTax,
      baseStateTax,
      localCountyTax,
      stateRatePct: `${((totalMDTax / (taxableIncome || 1)) * 100).toFixed(2)}% (Effective)`,
      details: `${stateData.name} progressive state tax ($${baseStateTax.toLocaleString()}) plus average local county tax (3.2%: $${localCountyTax.toLocaleString()}).`
    };
  }

  if (stateData.type === 'territory_pr') {
    const territoryIncome = Number(territoryOptions.territorySourceIncome ?? taxableIncome);
    const act60 = !!territoryOptions.act60Decree;
    const basePRTax = calculateProgressiveTax(territoryIncome, stateData.brackets);
    const prCapGains = act60 ? 0 : Math.round(capitalGains * 0.15);
    const totalPRTax = basePRTax + prCapGains;
    return {
      stateTax: totalPRTax,
      basePRTax,
      prCapGains,
      act60Claimed: act60,
      stateRatePct: `${((totalPRTax / (territoryIncome || 1)) * 100).toFixed(2)}% (Hacienda Form 482)`,
      details: act60
        ? `Puerto Rico Departamento de Hacienda (Form 482) graduated rates up to 33%. Act 60 Decree active: 0% capital gains tax applied.`
        : `Puerto Rico Departamento de Hacienda (Form 482) graduated rates up to 33% plus 15% standard capital gains tax.`
    };
  }

  if (stateData.type === 'territory_vi') {
    return {
      stateTax: 0,
      stateRatePct: 'IRC § 932 Mirror',
      details: `U.S. Virgin Islands: Under IRC § 932(c), full tax is paid to the Virgin Islands Bureau of Internal Revenue (VIBIR). Satisfies 100% of US federal return obligation with $0 owed directly to IRS.`
    };
  }

  if (stateData.type === 'territory_gu' || stateData.type === 'territory_mp') {
    const agency = upperCode === 'GU' ? 'Guam DRT' : 'CNMI Division of Revenue & Taxation';
    return {
      stateTax: 0,
      stateRatePct: 'IRC § 935 Mirror',
      details: `${stateData.name}: Under IRC § 935, a single mirror return is filed with ${agency}. 0 separate return or tax due directly to the IRS.`
    };
  }

  if (stateData.type === 'territory_as') {
    const asTax = Math.round(taxableIncome * (stateData.rate || 0.06));
    return {
      stateTax: asTax,
      stateRatePct: '6.0% (Territorial)',
      details: `American Samoa: Non-mirror territorial system under IRC § 931. Local tax of $${asTax.toLocaleString()} payable to American Samoa Tax Office.`
    };
  }

  if (stateData.type === 'progressive') {
    // California Specific Adjustments
    let effectiveTaxable = taxableIncome;
    let caSDITax = 0;
    let caNotes = [];

    if (upperCode === 'CA') {
      // CA State Disability Insurance (SDI) is 1.2% with no wage ceiling
      caSDITax = Math.round(taxableIncome * 0.012);
      caNotes.push(`CA SDI Payroll Tax (1.2% uncapped): $${caSDITax.toLocaleString()}`);
      caNotes.push(`California does not conform to Federal HSA deductions (earnings & contributions taxed).`);
      caNotes.push(`California does not conform to IRC § 199A QBI 20% deductions.`);
    }

    const baseStateTax = calculateProgressiveTax(effectiveTaxable, stateData.brackets);
    const totalStateWithSDI = baseStateTax + caSDITax;

    return {
      stateTax: totalStateWithSDI,
      baseStateTax,
      caSDITax,
      stateRatePct: `${((totalStateWithSDI / (taxableIncome || 1)) * 100).toFixed(2)}% (Effective, Top: ${stateData.topRate})`,
      details: `${stateData.name} graduated progressive state tax schedule up to ${stateData.topRate}.${caNotes.length ? ' ' + caNotes.join(' ') : ''}`
    };
  }

  if (stateData.type === 'progressive_nyc') {
    const nysTax = calculateProgressiveTax(taxableIncome, stateData.nysBrackets);
    let nycTax = 0;
    let mtaTax = Math.round(taxableIncome * 0.0034); // MCTD 0.34% mobility tax

    if (isNYCResident) {
      nycTax = calculateProgressiveTax(taxableIncome, stateData.nycBrackets);
    }
    const totalStateLocal = Math.round(nysTax + nycTax + mtaTax);
    return {
      stateTax: totalStateLocal,
      nysTax,
      nycTax,
      mtaTax,
      stateRatePct: `${((totalStateLocal / (taxableIncome || 1)) * 100).toFixed(2)}% (Effective)`,
      details: isNYCResident
        ? `NYS State Tax ($${nysTax.toLocaleString()}) + NYC Resident City Tax ($${nycTax.toLocaleString()}) + MCTD MTA Surcharge ($${mtaTax.toLocaleString()}).`
        : `NYS State Tax ($${nysTax.toLocaleString()}) + MCTD MTA Surcharge ($${mtaTax.toLocaleString()}).`
    };
  }

  return { stateTax: Math.round(taxableIncome * 0.045), stateRatePct: '4.5%', details: 'Standard state bracket calculation.' };
}

async function calculateFederalAndStateTax(req, res) {
  const {
    filingStatus = 'Single', // 'Single' | 'MFJ' | 'MFS' | 'HoH'
    w2Wages = 184200,
    interestIncome = 2450,
    ordinaryDividends = 7850,
    qualifiedDividends = 6420,
    shortTermCapitalGains = -3200, // can be negative
    longTermCapitalGains = 33300,
    stateCode = 'CA',
    isNYCResident = false,
    itemizedDeductions = {
      saltTaxes: 15400, // Capped at $10k
      mortgageInterest: 18400, // on up to $750k acquisition indebtedness
      charitableCash: 4500,
      medicalExpenses: 2000,
    },
    useItemized = false, // auto-selects higher of itemized vs standard
    iraContributions = 0,
    hsaContributions = 4150,
    preTax401k = 23000,
    isoSpread = 0,
    privateActivityBondInterest = 0,
    qualifyingChildren = 0,
    otherDependents = 0,
    dependentCareSpend = 0,
    entityPTETIncome = 0,
    // Overseas Territories & Expatriate Fields
    isTerritoryResident = false,
    territorySourceIncome = 0,
    act60Decree = false,
    isLivingAbroad = false,
    foreignDaysPresent = 0,
    foreignEarnedIncome = 0,
    foreignTaxesPaid = 0,
  } = req.body;

  const upperState = (stateCode || 'CA').toUpperCase();
  const isTerritory = ['PR', 'VI', 'GU', 'MP', 'AS'].includes(upperState) || Boolean(isTerritoryResident);

  // 1. Total & Gross Income Calculations
  const netShortTerm = Number(shortTermCapitalGains);
  const netLongTerm = Number(longTermCapitalGains);
  const totalRawGains = netShortTerm + netLongTerm;

  // IRS Rule: Up to $3,000 net capital loss deductible against ordinary income ($1,500 MFS)
  const maxLossDeduction = filingStatus === 'MFS' ? 1500 : 3000;
  const allowableLossOffset = totalRawGains < 0 ? Math.min(Math.abs(totalRawGains), maxLossDeduction) : 0;
  const netCapitalGainIncome = totalRawGains < 0 ? -allowableLossOffset : totalRawGains;

  let totalOrdinaryIncome = w2Wages + interestIncome + ordinaryDividends;
  let grossIncome = totalOrdinaryIncome + Math.max(0, netCapitalGainIncome) - allowableLossOffset;

  // Territorial income source split (IRC § 933 for PR, § 931 for AS)
  let territoryResult = null;
  if (isTerritory) {
    territoryResult = computeTerritoryTax({
      territoryCode: upperState,
      usSourceIncome: Math.max(0, grossIncome - Number(territorySourceIncome || 0)),
      territorySourceIncome: Number(territorySourceIncome || 0),
      act60Decree: Boolean(act60Decree),
      capitalGains: Math.max(0, netLongTerm),
      filingStatus,
    });

    if (upperState === 'PR' || upperState === 'AS') {
      // Exclude territory-source income from US Form 1040 gross income
      if (Number(territorySourceIncome) > 0) {
        grossIncome = Math.max(0, grossIncome - Number(territorySourceIncome));
      }
    }
  }

  // 2. Adjustments to Income (Above-The-Line Deductions)
  const totalAdjustments = Number(hsaContributions) + Number(iraContributions);
  const agi = Math.max(0, grossIncome - totalAdjustments); // Adjusted Gross Income

  // 3. Deductions: Standard vs Schedule A Itemized
  const standardDeduction = STANDARD_DEDUCTION_2026[filingStatus] || 14600;

  // Schedule A breakdown
  const saltCap = filingStatus === 'MFS' ? 5000 : 10000;
  const allowableSALT = Math.min(Number(itemizedDeductions.saltTaxes || 0), saltCap);
  const allowableMortgage = Number(itemizedDeductions.mortgageInterest || 0);
  const allowableCharity = Number(itemizedDeductions.charitableCash || 0);
  
  // Medical must exceed 7.5% of AGI
  const medicalThreshold = agi * 0.075;
  const allowableMedical = Math.max(0, Number(itemizedDeductions.medicalExpenses || 0) - medicalThreshold);

  const totalItemized = allowableSALT + allowableMortgage + allowableCharity + allowableMedical;

  const chosenDeductionMethod = useItemized
    ? (totalItemized > standardDeduction ? 'Itemized (Schedule A)' : 'Standard Deduction')
    : (totalItemized > standardDeduction ? 'Itemized (Schedule A)' : 'Standard Deduction');
  const deductionAmount = Math.max(standardDeduction, totalItemized);

  const taxableIncome = Math.max(0, agi - deductionAmount);

  // 4. Federal Income Tax Calculation
  // Portion taxed at preferential capital gains rates
  let preferentialLTCG = Math.max(0, Math.min(netLongTerm, taxableIncome)) + Math.min(qualifiedDividends, taxableIncome);
  if (upperState === 'PR' && act60Decree) {
    preferentialLTCG = 0; // Act 60 0% decree exempts capital gains
  }
  const ordinaryTaxableIncome = Math.max(0, taxableIncome - preferentialLTCG);

  const fedBrackets = FEDERAL_BRACKETS_2026[filingStatus] || FEDERAL_BRACKETS_2026.Single;
  const ordinaryFedTax = calculateProgressiveTax(ordinaryTaxableIncome, fedBrackets);

  // Preferential LTCG tax
  const ltcgBrackets = LTCG_BRACKETS_2026[filingStatus] || LTCG_BRACKETS_2026.Single;
  let ltcgTax = 0;
  if (!(upperState === 'PR' && act60Decree)) {
    let runningPref = preferentialLTCG;
    for (const b of ltcgBrackets) {
      if (runningPref <= 0) break;
      if (ordinaryTaxableIncome < b.upTo) {
        const roomInBracket = b.upTo - ordinaryTaxableIncome;
        const chunk = Math.min(runningPref, roomInBracket);
        ltcgTax += chunk * b.rate;
        runningPref -= chunk;
      }
    }
  }

  const baseFederalTax = Math.round(ordinaryFedTax + ltcgTax);

  // 5. Net Investment Income Tax (NIIT 3.8%)
  const niitThreshold = filingStatus === 'MFJ' ? 250000 : filingStatus === 'MFS' ? 125000 : 200000;
  const netInvestmentIncome = Math.max(0, interestIncome + ordinaryDividends + qualifiedDividends + Math.max(0, netCapitalGainIncome));
  const niitTaxable = Math.min(netInvestmentIncome, Math.max(0, agi - niitThreshold));
  const niitTax = (upperState === 'PR' && act60Decree) ? 0 : Math.round(niitTaxable * 0.038);

  // 6. Additional Medicare Tax (0.9%)
  const addMedicareThreshold = filingStatus === 'MFJ' ? 250000 : 200000;
  const addMedicareTaxable = Math.max(0, w2Wages - addMedicareThreshold);
  const additionalMedicareTax = Math.round(addMedicareTaxable * 0.009);

  let totalFederalTax = baseFederalTax + niitTax + additionalMedicareTax;

  // Credits & Deductions (Child Tax Credit & Dependent Care FSA)
  const creditsResult = computeCreditsAndDeductions({
    qualifyingChildren,
    otherDependents,
    dependentCareSpend,
    filingStatus,
    magi: agi,
    marginalRate: 0.24,
  });

  // Apply allowable CTC against federal tax (non-refundable first, then ACTC)
  totalFederalTax = Math.max(0, totalFederalTax - creditsResult.allowableCTC);

  // Form 6251 Alternative Minimum Tax (AMT) Calculation
  const amtResult = computeForm6251AMT({
    regularTaxableIncome: taxableIncome,
    regularTax: baseFederalTax,
    filingStatus,
    isoSpread,
    privateActivityBondInterest,
    saltDeductionClaimed: chosenDeductionMethod.includes('Itemized') ? allowableSALT : 0,
    standardDeductionClaimed: chosenDeductionMethod.includes('Standard') ? standardDeduction : 0,
  });

  if (amtResult.triggersAMT) {
    totalFederalTax += amtResult.amtPayable;
  }

  // Handle US Virgin Islands (VI), Guam (GU), CNMI (MP) Mirror Returns:
  // Under IRC § 932 / § 935, tax is paid to territorial revenue agency, IRS liability = $0
  let federalOwedToIRS = totalFederalTax;
  if (upperState === 'VI' || upperState === 'GU' || upperState === 'MP') {
    federalOwedToIRS = 0; // Mirror return satisfies US obligation locally
  }

  // Expatriate Relief (Form 2555 FEIE vs Form 1116 FTC Optimizer)
  let expatResult = null;
  if (isLivingAbroad) {
    expatResult = computeExpatTaxRelief({
      foreignEarnedIncome: Number(foreignEarnedIncome || 0),
      foreignTaxesPaid: Number(foreignTaxesPaid || 0),
      foreignDaysPresent: Number(foreignDaysPresent || 0),
      totalTaxableIncome: taxableIncome,
      baseUsTax: federalOwedToIRS,
      filingStatus,
    });
    federalOwedToIRS = expatResult.finalNetTax;
    totalFederalTax = federalOwedToIRS;
  } else {
    totalFederalTax = federalOwedToIRS;
  }

  // 7. State Tax Calculation
  const stateResult = calculateStateTax(
    taxableIncome,
    upperState,
    isNYCResident,
    netLongTerm,
    { territorySourceIncome, act60Decree }
  );

  // Pass-Through Entity Tax (PTET) Potential Optimization
  const ptetResult = computeStatePTET({
    entityNetIncome: entityPTETIncome || (w2Wages > 150000 ? Math.round(w2Wages * 0.6) : 100000),
    stateCode: upperState,
    ownerFilingStatus: filingStatus,
    ownerMarginalFederalRate: 0.35,
  });

  // 8. FICA / Payroll Tax (Social Security + Medicare)
  const ssWageCap = 168600;
  const socialSecurityTax = Math.round(Math.min(w2Wages, ssWageCap) * 0.062);
  const standardMedicareTax = Math.round(w2Wages * 0.0145);
  const totalFICATax = socialSecurityTax + standardMedicareTax + additionalMedicareTax;

  // 9. Overall Summary
  const totalCombinedTax = totalFederalTax + stateResult.stateTax;
  const effectiveFederalRate = ((totalFederalTax / (grossIncome || 1)) * 100).toFixed(2);
  const effectiveCombinedRate = ((totalCombinedTax / (grossIncome || 1)) * 100).toFixed(2);

  return res.json({
    success: true,
    market: 'US',
    filingStatus,
    stateCode: stateCode.toUpperCase(),
    summary: {
      grossIncome,
      totalAdjustments,
      adjustedGrossIncome: agi,
      deductionMethod: chosenDeductionMethod,
      deductionAmount,
      standardDeduction,
      totalItemized,
      itemizedBreakdown: {
        allowableSALT,
        allowableMortgage,
        allowableCharity,
        allowableMedical,
        saltCapped: Number(itemizedDeductions.saltTaxes) > saltCap
      },
      taxableIncome,
      baseFederalTax,
      niitTax,
      additionalMedicareTax,
      totalFederalTax,
      amtPayable: amtResult.amtPayable,
      triggersAMT: amtResult.triggersAMT,
      amtBreakdown: amtResult,
      credits: creditsResult,
      ptetOptimization: ptetResult,
      territoryOptimization: territoryResult,
      expatOptimization: expatResult,
      stateTax: stateResult.stateTax,
      stateTaxDetails: stateResult.details,
      socialSecurityTax,
      standardMedicareTax,
      totalFICATax,
      totalCombinedTax,
      effectiveFederalRate: `${effectiveFederalRate}%`,
      effectiveCombinedRate: `${effectiveCombinedRate}%`,
      capitalLossCarriedForward: totalRawGains < -maxLossDeduction ? Math.abs(totalRawGains) - maxLossDeduction : 0,
    },
    stateBreakdown: stateResult
  });
}

// 10. Form 6251 Alternative Minimum Tax (AMT) Calculation
function computeForm6251AMT({
  regularTaxableIncome,
  regularTax,
  filingStatus = 'Single',
  isoSpread = 0,
  privateActivityBondInterest = 0,
  saltDeductionClaimed = 0,
  standardDeductionClaimed = 0
}) {
  const amti = Math.max(
    0,
    Number(regularTaxableIncome || 0) +
      Number(saltDeductionClaimed || 0) +
      Number(standardDeductionClaimed || 0) +
      Number(isoSpread || 0) +
      Number(privateActivityBondInterest || 0)
  );

  // 2026 AMT Exemptions & Phase-outs (IRC § 55)
  const AMT_EXEMPTIONS = { Single: 85700, MFJ: 133300, MFS: 66650, HoH: 85700 };
  const AMT_PHASEOUT_THRESHOLDS = { Single: 609350, MFJ: 1218700, MFS: 609350, HoH: 609350 };

  const baseExemption = AMT_EXEMPTIONS[filingStatus] || 85700;
  const phaseoutThreshold = AMT_PHASEOUT_THRESHOLDS[filingStatus] || 609350;

  // 25% phase-out of exemption above threshold
  const excessAMTI = Math.max(0, amti - phaseoutThreshold);
  const exemptionReduction = excessAMTI * 0.25;
  const allowableExemption = Math.max(0, baseExemption - exemptionReduction);

  // AMT Base
  const amtBase = Math.max(0, amti - allowableExemption);

  // 26% up to $232,600 ($116,300 MFS); 28% on excess
  const rate26Cap = filingStatus === 'MFS' ? 116300 : 232600;
  let tentativeMinimumTax = 0;
  if (amtBase <= rate26Cap) {
    tentativeMinimumTax = amtBase * 0.26;
  } else {
    tentativeMinimumTax = (rate26Cap * 0.26) + ((amtBase - rate26Cap) * 0.28);
  }
  tentativeMinimumTax = Math.round(tentativeMinimumTax);

  const amtPayable = Math.max(0, tentativeMinimumTax - Number(regularTax || 0));

  // Form 8801 Minimum Tax Credit (MTC) generation: ISO spread is a deferral preference item
  const mtcGenerated = Number(isoSpread) > 0 ? amtPayable : 0;

  return {
    amti,
    baseExemption,
    allowableExemption: Math.round(allowableExemption),
    exemptionPhasedOut: exemptionReduction > 0,
    amtBase: Math.round(amtBase),
    tentativeMinimumTax,
    regularTax,
    amtPayable,
    triggersAMT: amtPayable > 0,
    form8801CreditCarryforward: mtcGenerated,
    breakdown: {
      isoPreference: Number(isoSpread || 0),
      privateActivityBondInterest: Number(privateActivityBondInterest || 0),
      saltAddback: Number(saltDeductionClaimed || 0),
      standardDeductionAddback: Number(standardDeductionClaimed || 0),
    }
  };
}

// 11. State Pass-Through Entity Tax (PTET) Engine
function computeStatePTET({
  entityNetIncome = 250000,
  stateCode = 'CA',
  ownerFilingStatus = 'Single',
  ownerMarginalFederalRate = 0.37
}) {
  const stateUpper = (stateCode || 'CA').toUpperCase();
  let ptetRate = 0;
  let stateName = 'California';
  let statutoryCode = 'California AB 150 (Rev. & Tax Code § 19900)';
  let formName = 'Form FTB 3804';

  if (stateUpper === 'CA') {
    ptetRate = 0.093; // 9.3% flat elective tax
    stateName = 'California';
    statutoryCode = 'California AB 150 / SB 113 (R&TC § 19900-19906)';
    formName = 'Form FTB 3804 (Pass-Through Entity Elective Tax Calculation)';
  } else if (stateUpper === 'NY') {
    stateName = 'New York';
    statutoryCode = 'NYS Tax Law Article 24-A (PTET)';
    formName = 'Form IT-653 (Pass-Through Entity Tax Credit)';
    if (entityNetIncome <= 2000000) ptetRate = 0.0685;
    else if (entityNetIncome <= 5000000) ptetRate = 0.0774;
    else if (entityNetIncome <= 20000000) ptetRate = 0.0890;
    else ptetRate = 0.1090;
  } else if (stateUpper === 'NJ') {
    stateName = 'New Jersey';
    statutoryCode = 'NJ BAIT (Business Alternative Income Tax)';
    formName = 'Form PTE-100';
    ptetRate = entityNetIncome <= 250000 ? 0.05675 : 0.0652;
  } else if (stateUpper === 'MA') {
    stateName = 'Massachusetts';
    statutoryCode = 'Mass. Gen. Laws ch. 63D (63D Elective Tax)';
    formName = 'Form 63D-ELT';
    ptetRate = 0.05;
  } else if (stateUpper === 'IL') {
    stateName = 'Illinois';
    statutoryCode = 'Illinois 35 ILCS 5/201(p) Pass-Through Entity Tax';
    formName = 'Schedule K-1-P(3)';
    ptetRate = 0.0495;
  } else {
    stateName = stateUpper;
    statutoryCode = `${stateUpper} Pass-Through Entity Tax Workaround (IRS Notice 2020-75)`;
    formName = `${stateUpper} PTET Schedule`;
    ptetRate = 0.06;
  }

  const entityPTETTaxPaid = Math.round(Number(entityNetIncome) * ptetRate);
  const federalIncomeTaxSaved = Math.round(entityPTETTaxPaid * Number(ownerMarginalFederalRate));
  const stateCreditReceived = entityPTETTaxPaid;
  const netFederalCashSavings = federalIncomeTaxSaved;

  return {
    stateCode: stateUpper,
    stateName,
    statutoryCode,
    formName,
    ptetRatePct: (ptetRate * 100).toFixed(2) + '%',
    entityNetIncome: Number(entityNetIncome),
    entityPTETTaxPaid,
    federalIncomeTaxSaved,
    stateCreditReceived,
    netFederalCashSavings,
    saltBypassEfficiency: '100% Above-The-Line Federal Ordinary Deduction',
    estimatedQuarterlyPayment: Math.round(entityPTETTaxPaid / 4),
  };
}

// 12. Child Tax Credit (CTC) & Dependent Care FSA Math
function computeCreditsAndDeductions({
  qualifyingChildren = 0,
  otherDependents = 0,
  dependentCareSpend = 0,
  filingStatus = 'Single',
  magi = 150000,
  marginalRate = 0.24
}) {
  const children = Number(qualifyingChildren || 0);
  const others = Number(otherDependents || 0);
  const depSpend = Number(dependentCareSpend || 0);

  // CTC: $2,000 per qualifying child (under 17), $500 per other dependent
  const grossCTC = children * 2000;
  const grossODC = others * 500;
  const totalBaseCredits = grossCTC + grossODC;

  // Phaseout: $50 reduction per $1,000 MAGI exceeding $400k (MFJ) or $200k (others)
  const threshold = filingStatus === 'MFJ' ? 400000 : 200000;
  const excessMAGI = Math.max(0, magi - threshold);
  const reductionSteps = Math.ceil(excessMAGI / 1000);
  const creditReduction = reductionSteps * 50;

  const allowableCTC = Math.max(0, totalBaseCredits - creditReduction);
  const refundableACTCCap = children * 1700; // 2026 refundable cap per child
  const refundablePortion = Math.min(allowableCTC, refundableACTCCap);

  // Dependent Care FSA ($5,000 pre-tax limit for married or single)
  const allowableFSA = Math.min(5000, depSpend);
  const fsaTaxSaved = Math.round(allowableFSA * (marginalRate + 0.0765)); // Income tax + FICA 7.65%

  return {
    qualifyingChildren: children,
    otherDependents: others,
    totalBaseCredits,
    creditReduction,
    allowableCTC,
    refundablePortion,
    dependentCareFSA: {
      claimed: allowableFSA,
      fsaTaxSaved
    }
  };
}

// 11. IRS Form 1040-ES Quarterly Estimated Tax & IRC § 6654 Safe Harbor Penalty Engine
function computeForm1040ESQuarterly({
  currentYearEstimatedTax = 65000,
  priorYearActualTax = 54000,
  priorYearAGI = 210000,
  filingStatus = 'Single',
  w2WithholdingYTD = 32000,
  quarterlyPaymentsMade = [0, 0, 0, 0],
}) {
  const isHighIncome = (filingStatus === 'MFS' ? 75000 : 150000);
  const priorYearAGIExceeds = Number(priorYearAGI) > isHighIncome;
  
  // Safe Harbor Rule 1: 90% of current year tax
  const safeHarborMethodA = Math.round(Number(currentYearEstimatedTax) * 0.90);
  
  // Safe Harbor Rule 2: 100% of prior year (or 110% if prior year AGI > $150k)
  const priorYearMultiplier = priorYearAGIExceeds ? 1.10 : 1.00;
  const safeHarborMethodB = Math.round(Number(priorYearActualTax) * priorYearMultiplier);
  
  // Required Annual Payment is minimum of Method A and Method B
  const requiredAnnualPayment = Math.min(safeHarborMethodA, safeHarborMethodB);
  const remainingLiabilityAfterW2 = Math.max(0, requiredAnnualPayment - Number(w2WithholdingYTD));
  
  const requiredPerQuarter = Math.round(remainingLiabilityAfterW2 / 4);
  const w2PerQuarter = Math.round(Number(w2WithholdingYTD) / 4);

  const quarters = [
    {
      quarter: 'Q1',
      dueDate: 'April 15, 2026',
      periodCovered: 'Jan 1 – Mar 31',
      requiredPayment: requiredPerQuarter,
      paid: quarterlyPaymentsMade[0] || 0,
      withholdingCredit: w2PerQuarter,
      isDelinquent: (quarterlyPaymentsMade[0] || 0) + w2PerQuarter < requiredPerQuarter,
      shortfall: Math.max(0, requiredPerQuarter - (quarterlyPaymentsMade[0] || 0) - w2PerQuarter),
    },
    {
      quarter: 'Q2',
      dueDate: 'June 15, 2026',
      periodCovered: 'Apr 1 – May 31',
      requiredPayment: requiredPerQuarter,
      paid: quarterlyPaymentsMade[1] || 0,
      withholdingCredit: w2PerQuarter,
      isDelinquent: (quarterlyPaymentsMade[1] || 0) + w2PerQuarter < requiredPerQuarter,
      shortfall: Math.max(0, requiredPerQuarter - (quarterlyPaymentsMade[1] || 0) - w2PerQuarter),
    },
    {
      quarter: 'Q3',
      dueDate: 'September 15, 2026',
      periodCovered: 'Jun 1 – Aug 31',
      requiredPayment: requiredPerQuarter,
      paid: quarterlyPaymentsMade[2] || 0,
      withholdingCredit: w2PerQuarter,
      isDelinquent: (quarterlyPaymentsMade[2] || 0) + w2PerQuarter < requiredPerQuarter,
      shortfall: Math.max(0, requiredPerQuarter - (quarterlyPaymentsMade[2] || 0) - w2PerQuarter),
    },
    {
      quarter: 'Q4',
      dueDate: 'January 15, 2027',
      periodCovered: 'Sep 1 – Dec 31',
      requiredPayment: requiredPerQuarter,
      paid: quarterlyPaymentsMade[3] || 0,
      withholdingCredit: w2PerQuarter,
      isDelinquent: (quarterlyPaymentsMade[3] || 0) + w2PerQuarter < requiredPerQuarter,
      shortfall: Math.max(0, requiredPerQuarter - (quarterlyPaymentsMade[3] || 0) - w2PerQuarter),
    },
  ];

  // IRS Form 2210 Underpayment Penalty calculation (IRS federal short-term rate ~8% annualized)
  const annualPenaltyRate = 0.08;
  const totalShortfall = quarters.reduce((sum, q) => sum + q.shortfall, 0);
  // Weighted penalty across quarter durations (Q1: 365/365, Q2: 304/365, Q3: 212/365, Q4: 90/365)
  const penaltyQ1 = Math.round(quarters[0].shortfall * annualPenaltyRate * (365 / 365));
  const penaltyQ2 = Math.round(quarters[1].shortfall * annualPenaltyRate * (304 / 365));
  const penaltyQ3 = Math.round(quarters[2].shortfall * annualPenaltyRate * (212 / 365));
  const penaltyQ4 = Math.round(quarters[3].shortfall * annualPenaltyRate * (90 / 365));
  const totalEstimatedForm2210Penalty = penaltyQ1 + penaltyQ2 + penaltyQ3 + penaltyQ4;

  return {
    currentYearEstimatedTax: Number(currentYearEstimatedTax),
    priorYearActualTax: Number(priorYearActualTax),
    priorYearAGI: Number(priorYearAGI),
    safeHarbor: {
      methodA_90PctCurrent: safeHarborMethodA,
      methodB_PriorYear: safeHarborMethodB,
      priorYearMultiplierPct: `${Math.round(priorYearMultiplier * 100)}%`,
      governingMethod: safeHarborMethodA < safeHarborMethodB ? '90% Current Year Tax' : `${Math.round(priorYearMultiplier * 100)}% Prior Year Tax`,
      requiredAnnualPayment,
      satisfiedByW2Withholding: Number(w2WithholdingYTD) >= requiredAnnualPayment,
      remainingLiabilityAfterW2,
    },
    quarters,
    totalShortfall,
    totalEstimatedForm2210Penalty,
    form2210Required: totalShortfall > 1000,
    statutoryCitations: [
      'IRC § 6654 (Failure by Individual to Pay Estimated Income Tax)',
      'IRS Form 1040-ES (Estimated Tax for Individuals)',
      'IRS Form 2210 (Underpayment of Estimated Tax by Individuals, Estates, and Trusts)',
    ],
  };
}

// 12. Schedule D Capital Gains & Transactions Netting Ledger
function computeScheduleDNetting({
  shortTermTrades = [],
  longTermTrades = [],
  priorYearLossCarryover = 0,
  filingStatus = 'Single',
}) {
  const shortTermNet = shortTermTrades.reduce((sum, t) => sum + (Number(t.proceeds || 0) - Number(t.costBasis || 0)), 0);
  const longTermNet = longTermTrades.reduce((sum, t) => sum + (Number(t.proceeds || 0) - Number(t.costBasis || 0)), 0);

  // Line 7: Net Short-Term Capital Gain or Loss
  const netShortTerm = shortTermNet;

  // Line 15: Net Long-Term Capital Gain or Loss
  const netLongTerm = longTermNet;

  // Line 16: Combine Lines 7 and 15
  const combinedCapitalGains = netShortTerm + netLongTerm - Number(priorYearLossCarryover);

  // IRC § 1211(b): $3,000 maximum allowable loss offset against ordinary income ($1,500 for MFS)
  const maxOrdinaryLossOffset = filingStatus === 'MFS' ? 1500 : 3000;
  let allowableOrdinaryLossDeduction = 0;
  let capitalLossCarryforward = 0;

  if (combinedCapitalGains < 0) {
    const rawLoss = Math.abs(combinedCapitalGains);
    allowableOrdinaryLossDeduction = Math.min(rawLoss, maxOrdinaryLossOffset);
    capitalLossCarryforward = Math.max(0, rawLoss - allowableOrdinaryLossDeduction);
  }

  return {
    shortTermNet,
    longTermNet,
    priorYearLossCarryover: Number(priorYearLossCarryover),
    combinedCapitalGains,
    isNetGain: combinedCapitalGains > 0,
    isNetLoss: combinedCapitalGains < 0,
    taxableCapitalGainOnForm1040: Math.max(0, combinedCapitalGains),
    allowableOrdinaryLossDeduction, // Offsets Form 1040 Line 7 (up to $3,000)
    capitalLossCarryforward, // Carried forward indefinitely under IRC § 1212(b)
    statute: 'IRC § 1211(b) Limitation on Capital Losses & IRC § 1212(b) Capital Loss Carrybacks and Carryforwards',
  };
}

// 13. Prescriptive Tax-Shield Optimizer
function computeTaxShieldOptimizer({
  salary = 185000,
  filingStatus = 'Single',
  marginalFederalRate = 0.32,
  marginalStateRate = 0.093,
  traditional401kClaimed = 15000,
  hsaClaimed = 2500,
  dependentCareClaimed = 2000,
  iraClaimed = 0,
}) {
  const combinedRate = Number(marginalFederalRate) + Number(marginalStateRate);

  // Statutory 2026 Caps
  const caps = {
    traditional401k: 23000,
    hsa: filingStatus === 'MFJ' ? 8300 : 4150,
    dependentCareFSA: 5000,
    traditionalIRA: 7000,
  };

  const remaining = {
    traditional401k: Math.max(0, caps.traditional401k - Number(traditional401kClaimed)),
    hsa: Math.max(0, caps.hsa - Number(hsaClaimed)),
    dependentCareFSA: Math.max(0, caps.dependentCareFSA - Number(dependentCareClaimed)),
    traditionalIRA: Math.max(0, caps.traditionalIRA - Number(iraClaimed)),
  };

  const potentialTaxSavings = {
    traditional401k: Math.round(remaining.traditional401k * combinedRate),
    hsa: Math.round(remaining.hsa * (combinedRate + 0.0765)), // Income tax + FICA 7.65% exemption
    dependentCareFSA: Math.round(remaining.dependentCareFSA * (combinedRate + 0.0765)),
    traditionalIRA: Math.round(remaining.traditionalIRA * combinedRate),
  };

  const totalUntappedShield = remaining.traditional401k + remaining.hsa + remaining.dependentCareFSA + remaining.traditionalIRA;
  const totalPotentialCashSavings = Object.values(potentialTaxSavings).reduce((sum, v) => sum + v, 0);

  return {
    combinedMarginalRate: Number((combinedRate * 100).toFixed(1)),
    caps,
    claimed: {
      traditional401k: Number(traditional401kClaimed),
      hsa: Number(hsaClaimed),
      dependentCareFSA: Number(dependentCareClaimed),
      traditionalIRA: Number(iraClaimed),
    },
    remaining,
    potentialTaxSavings,
    totalUntappedShield,
    totalPotentialCashSavings,
  };
}

// Endpoint handlers
async function calculateAMTTax(req, res) {
  try {
    const result = computeForm6251AMT(req.body);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function calculatePTETTax(req, res) {
  try {
    const result = computeStatePTET(req.body);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function calculateQuarterlyEstimatedTax(req, res) {
  try {
    const result = computeForm1040ESQuarterly(req.body);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function calculateScheduleDNettingHandler(req, res) {
  try {
    const result = computeScheduleDNetting(req.body);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ── US Form 8606 & Backdoor Roth Pro-Rata Trap Engine + FBAR/FATCA ───────────────
// Implements IRC § 408(d)(2) aggregate balance rules, Form 8606 Lines 1-18,
// FinCEN Form 114 (FBAR $10,000 aggregate rule), and FATCA Form 8938 thresholds.

function computeForm8606AndFBAR(params = {}) {
  const {
    taxYear = 2026,
    filingStatus = 'Single', // 'Single' | 'MFJ' | 'MFS' | 'HoH'
    livingInUS = true,
    nondeductibleContribution = params.traditionalIraNonDeductibleContribution ?? 7000, // Line 1
    priorYearBasis = 0,               // Line 2
    contributionsMadePostDec31 = 0,   // Line 4
    yearEndTraditionalIRABalance = params.dec31PreTaxIraBalance ?? 0, // Line 6 (Dec 31 balance of all Trad, SEP, SIMPLE IRAs)
    totalDistributions = 0,           // Line 7
    rothConversionAmount = 7000,      // Line 8
    foreignAccounts = [],             // [{ institution, accountNo, country, maxBalanceUSD, yearEndBalanceUSD }]
  } = params;

  // Form 8606 Part I & Part II Step-by-Step
  const line1 = Math.max(0, Number(nondeductibleContribution || 0));
  const line2 = Math.max(0, Number(priorYearBasis || 0));
  const line3 = line1 + line2; // Total basis
  const line4 = Math.max(0, Number(contributionsMadePostDec31 || 0));
  const line5 = Math.max(0, line3 - line4);
  const line6 = Math.max(0, Number(yearEndTraditionalIRABalance || 0));
  const line7 = Math.max(0, Number(totalDistributions || 0));
  const line8 = Math.max(0, Number(rothConversionAmount || 0));
  const line9 = line6 + line7 + line8;

  // Line 10: Non-taxable ratio (capped at 1.00000)
  let line10 = 1.0;
  if (line9 > 0) {
    line10 = Math.min(1.0, line5 / line9);
  }
  line10 = Number(line10.toFixed(5));

  // Line 11: Nontaxable portion of conversion
  const line11 = Math.round(line8 * line10);
  // Line 12: Nontaxable portion of regular distributions
  const line12 = Math.round(line7 * line10);
  // Line 13: Total nontaxable amount
  const line13 = line11 + line12;
  // Line 14: Remaining basis for future years
  const line14 = Math.max(0, line3 - line13);
  // Line 15: Taxable amount of Roth conversion (IRC § 408(d)(2)) -> reported on Form 1040 Line 4b
  const line15 = Math.max(0, line8 - line11);
  // Line 16: Taxable amount of regular distributions
  const line16 = Math.max(0, line7 - line12);

  // Pro-Rata Trap Detection
  const proRataTrapTriggered = line6 > 0 && line8 > 0 && line15 > 0;
  const taxableConversionPercentage = line8 > 0 ? Number(((line15 / line8) * 100).toFixed(1)) : 0;

  // ── FinCEN Form 114 (FBAR) & FATCA Form 8938 Scanners ──
  let totalMaxAggregateForeignUSD = 0;
  let totalYearEndForeignUSD = 0;

  const accountsProcessed = (foreignAccounts || []).map((acc, idx) => {
    const maxVal = Number(acc.maxBalanceUSD || acc.peakBalanceUSD || 0);
    const yrEndVal = Number(acc.yearEndBalanceUSD || acc.closingBalanceUSD || 0);
    totalMaxAggregateForeignUSD += maxVal;
    totalYearEndForeignUSD += yrEndVal;

    return {
      id: idx + 1,
      institutionName: acc.institutionName || 'Foreign Financial Institution',
      accountNumber: acc.accountNumber ? `****${String(acc.accountNumber).slice(-4)}` : '****0000',
      country: acc.country || 'India',
      maxBalanceUSD: maxVal,
      yearEndBalanceUSD: yrEndVal,
    };
  });

  // FBAR Threshold: $10,000 aggregate peak value at ANY time in the year
  const fbarRequired = totalMaxAggregateForeignUSD > 10000;

  // FATCA Form 8938 Thresholds:
  // Taxpayers in US:
  //   Single / MFS: > $50,000 on last day OR > $75,000 at any time
  //   MFJ:          > $100,000 on last day OR > $200,000 at any time
  // Taxpayers Abroad:
  //   Single:       > $200,000 on last day OR > $300,000 at any time
  //   MFJ:          > $400,000 on last day OR > $600,000 at any time
  let fatcaYearEndThreshold = livingInUS ? (filingStatus === 'MFJ' ? 100000 : 50000) : (filingStatus === 'MFJ' ? 400000 : 200000);
  let fatcaPeakThreshold = livingInUS ? (filingStatus === 'MFJ' ? 200000 : 75000) : (filingStatus === 'MFJ' ? 600000 : 300000);

  const fatca8938Required =
    totalYearEndForeignUSD > fatcaYearEndThreshold ||
    totalMaxAggregateForeignUSD > fatcaPeakThreshold;

  return {
    taxYear,
    form8606: {
      line1_nondeductibleContribution: line1,
      line2_priorYearBasis: line2,
      line3_totalBasis: line3,
      line4_subsequentYearContribs: line4,
      line5_netBasisForCalculation: line5,
      line6_yearEndTraditionalIRABalance: line6,
      line7_regularDistributions: line7,
      line8_rothConversionAmount: line8,
      line9_totalIRAValuation: line9,
      line10_nontaxableRatio: line10,
      line11_nontaxableConversion: line11,
      line12_nontaxableDistributions: line12,
      line13_totalNontaxable: line13,
      line14_remainingBasisFutureYears: line14,
      line15_taxableRothConversion: line15, // Report to Form 1040 Line 4b
      line16_taxableDistributions: line16,
    },
    proRataTrap: {
      triggered: proRataTrapTriggered,
      taxableConversionPercentage,
      unexpectedTaxableAmount: line15,
      severity: proRataTrapTriggered ? (taxableConversionPercentage > 50 ? 'HIGH' : 'MEDIUM') : 'NONE',
      remedy: proRataTrapTriggered
        ? `IRC § 408(d)(2) Pro-Rata Trap Detected: You have $${line6.toLocaleString()} in pre-tax traditional/rollover IRAs, causing $${line15.toLocaleString()} (${taxableConversionPercentage}%) of your Backdoor Roth conversion to become unexpectedly TAXABLE. To fix this, reverse-rollover your $${line6.toLocaleString()} pre-tax IRA funds into an active employer 401(k) or Solo 401(k) before Dec 31 to eliminate pre-tax balances and render 100% of conversions tax-free.`
        : 'Clean Backdoor Roth: Pre-tax traditional IRA balances are $0. 100% of the $7,000 conversion is non-taxable.',
    },
    crossBorderFBAR_FATCA: {
      totalMaxAggregateForeignUSD,
      totalYearEndForeignUSD,
      accounts: accountsProcessed,
      fbar: {
        required: fbarRequired,
        form: 'FinCEN Form 114 (Report of Foreign Bank and Financial Accounts)',
        thresholdUSD: 10000,
        dueNotice: fbarRequired
          ? 'Mandatory Filing Required: Aggregate foreign accounts exceeded $10,000. File via BSA E-Filing System by April 15 (automatic extension to October 15). Non-willful statutory penalty up to $16,117 per violation; willful violation penalty up to $161,166 or 50% of account balance.'
          : 'Aggregate foreign accounts remained under $10,000 threshold. FBAR filing not triggered.',
      },
      fatca8938: {
        required: fatca8938Required,
        form: 'IRS Form 8938 (Statement of Specified Foreign Financial Assets)',
        yearEndThresholdUSD: fatcaYearEndThreshold,
        peakThresholdUSD: fatcaPeakThreshold,
        dueNotice: fatca8938Required
          ? `Mandatory Attachment Required: Specified foreign financial assets exceed Form 8938 thresholds ($${fatcaYearEndThreshold.toLocaleString()} year-end / $${fatcaPeakThreshold.toLocaleString()} peak). Must attach to Form 1040. Failure to file penalty is $10,000 plus continuous failure penalties up to $50,000.`
          : 'Specified foreign financial assets are below Form 8938 statutory thresholds.',
      },
    },
  };
}

async function calculateForm8606AndFBARHandler(req, res) {
  try {
    const result = computeForm8606AndFBAR(req.body);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function calculateTaxShieldOptimizerHandler(req, res) {
  try {
    const result = computeTaxShieldOptimizer(req.body);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

const { parseUSTaxDocument } = require('../services/usTaxDocParser');

async function handleParseUSDocument(req, res) {
  try {
    const result = await parseUSTaxDocument(req.body);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  calculateFederalAndStateTax,
  calculateAMTTax,
  calculatePTETTax,
  calculateQuarterlyEstimatedTax,
  calculateScheduleDNettingHandler,
  calculateTaxShieldOptimizerHandler,
  calculateForm8606AndFBARHandler,
  handleParseUSDocument,
  computeForm6251AMT,
  computeStatePTET,
  computeCreditsAndDeductions,
  computeForm1040ESQuarterly,
  computeScheduleDNetting,
  computeTaxShieldOptimizer,
  computeForm8606AndFBAR,
  computeTerritoryTax,
  computeExpatTaxRelief,
  calculateStateTax,
  STATE_TAX_DATA,
};

