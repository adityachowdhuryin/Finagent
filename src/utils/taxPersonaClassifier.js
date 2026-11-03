// src/utils/taxPersonaClassifier.js
// Hybrid Client-Side Semantic Classifier & Persona Roadmap Generator for Tax & Forensic Studio

export const PERSONA_DEFINITIONS = {
  // ==========================================
  // US PERSONAS
  // ==========================================
  US_SALARIED_STOCKS: {
    key: 'US_SALARIED_STOCKS',
    market: 'US',
    title: 'Salaried Tech & Stock Investor (RSUs / 1099-B)',
    tag: 'W-2 + Capital Gains',
    summary: 'Optimized for tech employees and active retail investors with stock grants, capital gains, and broker statements.',
    relevantTabs: ['e-file', 'harvester', 'quarterly'],
    plainSubtitle: 'E-File 1040, harvest losses, and prevent IRS estimated tax penalties.',
    steps: [
      {
        id: 'step_dropzone',
        title: 'Ingest Broker 1099-B / CSV',
        desc: 'Drag & drop your Charles Schwab, Fidelity, or Robinhood statement into the Dropzone for client-side FIFO lot parsing.',
        tab: 'e-file',
        action: 'open_dropzone',
        completed: false,
      },
      {
        id: 'step_harvest',
        title: 'Execute $3,000 Loss Write-off',
        desc: 'Identify underwater lots and execute IRS § 1091 proxy swaps to offset capital gains and write off $3,000 against ordinary income.',
        tab: 'harvester',
        action: 'open_tab',
        completed: false,
      },
      {
        id: 'step_quarterly',
        title: 'Check 110% Safe-Harbor Defense',
        desc: 'Verify that your quarterly estimated tax payments shield you from IRS § 6654 underpayment interest penalties.',
        tab: 'quarterly',
        action: 'open_tab',
        completed: false,
      },
    ],
  },

  US_SCORP_FREELANCER: {
    key: 'US_SCORP_FREELANCER',
    market: 'US',
    title: 'Self-Employed / S-Corp Pass-Through Owner',
    tag: '1099 + S-Corp FICA',
    summary: 'Designed for consultants, LLC founders, and agency owners seeking reasonable salary FICA arbitrage and quarterly filing.',
    relevantTabs: ['huf', 'quarterly', 'e-file'],
    plainSubtitle: 'Save 15.3% FICA self-employment taxes and track quarterly estimated deadlines.',
    steps: [
      {
        id: 'step_scorp_salary',
        title: 'Optimize W-2 Reasonable Salary',
        desc: 'Calculate the defensible salary vs distribution split to save thousands in 15.3% Medicare and Social Security taxes.',
        tab: 'huf',
        action: 'open_tab',
        completed: false,
      },
      {
        id: 'step_scorp_quarterly',
        title: 'Lock In Quarterly Safe-Harbor',
        desc: 'Set up your quarterly IRS Form 1040-ES payment schedule and sync deadlines to your calendar via .ics export.',
        tab: 'quarterly',
        action: 'open_tab',
        completed: false,
      },
      {
        id: 'step_sched_c_e',
        title: 'Prepare Schedule C & E Deductions',
        desc: 'Maximize mileage (67¢/mi), home office deduction ($5/sq ft), and MACRS business asset depreciation.',
        tab: 'e-file',
        action: 'open_tab',
        completed: false,
      },
    ],
  },

  US_RENTAL_REAL_ESTATE: {
    key: 'US_RENTAL_REAL_ESTATE',
    market: 'US',
    title: 'Real Estate Investor & Landlord',
    tag: 'Schedule E + MACRS',
    summary: 'Tailored for property owners seeking MACRS 27.5-year residential depreciation and passive activity loss deductions.',
    relevantTabs: ['e-file', 'quarterly', 'itr'],
    plainSubtitle: 'Deduct mortgage interest, shelter rental cashflow with depreciation, and track state taxes.',
    steps: [
      {
        id: 'step_sched_e_deprec',
        title: 'Calculate 27.5-Year MACRS Depreciation',
        desc: 'Enter gross rents and let FinAgent compute straight-line building depreciation and $25,000 active rental allowance.',
        tab: 'e-file',
        action: 'open_tab',
        completed: false,
      },
      {
        id: 'step_mortgage_deduct',
        title: 'Audit Form 1098 Mortgage Interest',
        desc: 'Reconcile property taxes, insurance, and maintenance expenses against rental revenue.',
        tab: 'e-file',
        action: 'open_tab',
        completed: false,
      },
      {
        id: 'step_state_tax_apportion',
        title: '50-State Multi-Jurisdiction Allocation',
        desc: 'Apportion rental income across non-resident states to ensure accurate state tax withholding.',
        tab: 'itr',
        action: 'open_tab',
        completed: false,
      },
    ],
  },

  US_EXPAT_TERRITORY: {
    key: 'US_EXPAT_TERRITORY',
    market: 'US',
    title: 'Expat / Puerto Rico Act 60 / Cross-Border',
    tag: 'FEIE + Act 60 + FBAR',
    summary: 'For digital nomads, Puerto Rico Act 60 decree holders, and US citizens living abroad with foreign accounts.',
    relevantTabs: ['itr', 'e-file', 'forensic'],
    plainSubtitle: 'Claim Form 2555 $130k exclusion, Act 60 0% capital gains, and FBAR compliance.',
    steps: [
      {
        id: 'step_feie_test',
        title: 'Verify 330-Day Physical Presence Test',
        desc: 'Calculate your Form 2555 Foreign Earned Income Exclusion ($130,000 cap) and Form 1116 Foreign Tax Credit.',
        tab: 'itr',
        action: 'open_tab',
        completed: false,
      },
      {
        id: 'step_act60_check',
        title: 'Simulate Puerto Rico Act 60 Decree',
        desc: 'Model 0% capital gains exemption under IRC § 933 and compare against California/New York marginal brackets.',
        tab: 'itr',
        action: 'open_tab',
        completed: false,
      },
      {
        id: 'step_fbar_defense',
        title: 'Defend FinCEN Form 114 (FBAR)',
        desc: 'Audit foreign bank and brokerage accounts exceeding the $10,000 aggregate threshold to avoid civil penalties.',
        tab: 'forensic',
        action: 'open_tab',
        completed: false,
      },
    ],
  },

  // ==========================================
  // INDIA PERSONAS
  // ==========================================
  IN_SALARIED_INVESTOR: {
    key: 'IN_SALARIED_INVESTOR',
    market: 'IN',
    title: 'Salaried Employee & Equity Investor',
    tag: 'Form 16 + AIS + CG',
    summary: 'Designed for corporate professionals in India with salary, Zerodha/Groww stock trades, and mutual fund folios.',
    relevantTabs: ['e-file', 'harvester', 'itr'],
    plainSubtitle: 'Reconcile Form 16 against AIS, optimize Old vs New regime, and harvest capital losses.',
    steps: [
      {
        id: 'step_ais_reconcile',
        title: 'Reconcile Return with NSDL AIS/TIS',
        desc: 'Compare Form 16, dividend vouchers, and bank interest side-by-side with TIN-NSDL to avoid Section 143(1)(a) notices.',
        tab: 'e-file',
        action: 'open_tab',
        completed: false,
      },
      {
        id: 'step_loss_harvest_in',
        title: 'Harvest ₹1.25L Section 112A Exemption',
        desc: 'Realize long-term capital gains up to the statutory ₹1.25 Lakh zero-tax exemption and offset short-term losses.',
        tab: 'harvester',
        action: 'open_tab',
        completed: false,
      },
      {
        id: 'step_regime_compare',
        title: 'Old vs New Regime (Sec 115BAC)',
        desc: 'Calculate exact breakeven deductions (HRA, 80C, 80D, NPS) to pick the mathematically optimal regime.',
        tab: 'itr',
        action: 'open_tab',
        completed: false,
      },
    ],
  },

  IN_HUF_FAMILY: {
    key: 'IN_HUF_FAMILY',
    market: 'IN',
    title: 'Hindu Undivided Family (HUF) Tax Shield',
    tag: 'Separate PAN + Deed',
    summary: 'For families seeking an additional legal tax entity with separate basic exemption limits and capital shelter.',
    relevantTabs: ['huf', 'itr', 'e-file'],
    plainSubtitle: 'Generate legally-binding HUF deeds, open separate bank accounts, and save ₹3L+ annually.',
    steps: [
      {
        id: 'step_huf_deed',
        title: 'Generate Foundational HUF Legal Deed',
        desc: 'Draft and compile an official Hindu Succession Act compliant HUF Charter with Karta and Coparcener schedules.',
        tab: 'huf',
        action: 'open_tab',
        completed: false,
      },
      {
        id: 'step_huf_bank_kit',
        title: 'Download Bank Account Resolution Kit',
        desc: 'Print formal banking resolutions to open a dedicated HUF bank and demat account with leading national banks.',
        tab: 'huf',
        action: 'open_tab',
        completed: false,
      },
      {
        id: 'step_huf_pan_arbitrage',
        title: 'Simulate Multi-PAN Tax Arbitrage',
        desc: 'Distribute dividend and ancestral rental income across individual and HUF PANs to exploit double standard deductions.',
        tab: 'huf',
        action: 'open_tab',
        completed: false,
      },
    ],
  },

  IN_BUSINESS_PROFESSIONAL: {
    key: 'IN_BUSINESS_PROFESSIONAL',
    market: 'IN',
    title: 'Professional & Business Owner (Sec 44ADA)',
    tag: 'Presumptive + Advance Tax',
    summary: 'For doctors, lawyers, software consultants, and SMEs filing presumptive returns and paying advance tax.',
    relevantTabs: ['quarterly', 'forensic', 'e-file'],
    plainSubtitle: 'Track Section 234C advance tax milestones and plug mutual fund commission bleed.',
    steps: [
      {
        id: 'step_adv_tax_234c',
        title: 'Calculate Section 234C Advance Tax',
        desc: 'Track the 15%, 45%, 75%, and 100% quarterly schedule to prevent 1% monthly penal interest under Sections 234B and 234C.',
        tab: 'quarterly',
        action: 'open_tab',
        completed: false,
      },
      {
        id: 'step_forensic_mf_switch',
        title: 'Switch Regular Mutual Funds to Direct',
        desc: 'Audit folio commission leakage (1.15% to 1.50%) and generate formal AMC transfer letters to save lakhs.',
        tab: 'forensic',
        action: 'open_tab',
        completed: false,
      },
      {
        id: 'step_presumptive_file',
        title: 'File Form ITR-3 / 44ADA',
        desc: 'Compile business balance sheets and declare 50% gross receipts for professional income with instant validation.',
        tab: 'e-file',
        action: 'open_tab',
        completed: false,
      },
    ],
  },

  IN_FOREIGN_ASSETS_ESOP: {
    key: 'IN_FOREIGN_ASSETS_ESOP',
    market: 'IN',
    title: 'MNC Tech Employee with US RSUs (Schedule FA)',
    tag: 'US Stocks + Black Money Act',
    summary: 'Essential for Indian residents holding US tech RSUs, ESPPs, or foreign bank accounts needing zero-penalty filing.',
    relevantTabs: ['e-file', 'harvester', 'forensic'],
    plainSubtitle: 'Safely report foreign equity under Schedule FA using Rule 115 SBI TT rates and avoid ₹10L penalties.',
    steps: [
      {
        id: 'step_sched_fa_report',
        title: 'Compile Schedule FA Foreign Assets',
        desc: 'Convert US stock values to INR using SBI TT Buying Rates under Rule 115 and satisfy Black Money Act Section 43.',
        tab: 'e-file',
        action: 'open_tab',
        completed: false,
      },
      {
        id: 'step_esop_capital_gains',
        title: 'Calculate US Capital Gains & DTAA FTC',
        desc: 'Compute Section 112 long-term capital gains on foreign scrips and claim Form 67 Double Taxation Relief (DTAA).',
        tab: 'e-file',
        action: 'open_tab',
        completed: false,
      },
      {
        id: 'step_foreign_bank_fbar',
        title: 'Audit Table A1 Foreign Depository Accounts',
        desc: 'Verify peak balances in foreign broker cash sweeps (Charles Schwab, Morgan Stanley, E*TRADE).',
        tab: 'e-file',
        action: 'open_tab',
        completed: false,
      },
    ],
  },
};

/**
 * Fast Client-Side Semantic Pattern Classifier
 * Evaluates user natural language text and returns the optimal persona & roadmap in <5ms.
 */
export function classifyTaxIntent(inputText = '', market = 'US') {
  const text = (inputText || '').toLowerCase().trim();
  const isUS = market === 'US';

  if (!text) {
    // Return default base persona for market
    const defaultKey = isUS ? 'US_SALARIED_STOCKS' : 'IN_SALARIED_INVESTOR';
    return PERSONA_DEFINITIONS[defaultKey];
  }

  // --- US Patterns ---
  if (isUS) {
    // 1. Expat / Puerto Rico / Cross-Border
    if (
      text.includes('puerto rico') ||
      text.includes('act 60') ||
      text.includes('expat') ||
      text.includes('foreign earned') ||
      text.includes('feie') ||
      text.includes('form 2555') ||
      text.includes('living abroad') ||
      text.includes('dubai') ||
      text.includes('nomad')
    ) {
      return PERSONA_DEFINITIONS.US_EXPAT_TERRITORY;
    }

    // 2. Rental Real Estate / Landlord
    if (
      text.includes('rental') ||
      text.includes('property') ||
      text.includes('landlord') ||
      text.includes('mortgage') ||
      text.includes('depreciation') ||
      text.includes('macrs') ||
      text.includes('schedule e') ||
      text.includes('tenant') ||
      text.includes('1031')
    ) {
      return PERSONA_DEFINITIONS.US_RENTAL_REAL_ESTATE;
    }

    // 3. S-Corp / Freelancer / LLC
    if (
      text.includes('s-corp') ||
      text.includes('scorp') ||
      text.includes('llc') ||
      text.includes('freelance') ||
      text.includes('consultant') ||
      text.includes('1099-nec') ||
      text.includes('1099 nec') ||
      text.includes('reasonable salary') ||
      text.includes('fica') ||
      text.includes('self employ') ||
      text.includes('form 2553') ||
      text.includes('pass through')
    ) {
      return PERSONA_DEFINITIONS.US_SCORP_FREELANCER;
    }

    // 4. Default / Tech Stock Investor
    return PERSONA_DEFINITIONS.US_SALARIED_STOCKS;
  }

  // --- India Patterns ---
  // 1. HUF (Hindu Undivided Family)
  if (
    text.includes('huf') ||
    text.includes('hindu undivided') ||
    text.includes('karta') ||
    text.includes('ancestral') ||
    text.includes('family deed') ||
    text.includes('coparcener')
  ) {
    return PERSONA_DEFINITIONS.IN_HUF_FAMILY;
  }

  // 2. Schedule FA / Foreign Assets / US RSUs in India
  if (
    text.includes('schedule fa') ||
    text.includes('us stock') ||
    text.includes('us rsu') ||
    text.includes('esop') ||
    text.includes('vested rsu') ||
    text.includes('foreign asset') ||
    text.includes('black money') ||
    text.includes('sbi tt') ||
    text.includes('form 67')
  ) {
    return PERSONA_DEFINITIONS.IN_FOREIGN_ASSETS_ESOP;
  }

  // 3. Business / Presumptive 44ADA
  if (
    text.includes('44ada') ||
    text.includes('business') ||
    text.includes('freelanc') ||
    text.includes('consultant') ||
    text.includes('presumptive') ||
    text.includes('itr-3') ||
    text.includes('itr-4') ||
    text.includes('advance tax') ||
    text.includes('234c')
  ) {
    return PERSONA_DEFINITIONS.IN_BUSINESS_PROFESSIONAL;
  }

  // 4. Default: Salaried Employee & Equity Investor
  return PERSONA_DEFINITIONS.IN_SALARIED_INVESTOR;
}

/**
 * Maps 3-Click Intake Answers to a Persona Definition
 */
export function getPersonaFromCards(answers = {}, market = 'US') {
  const { incomeType, eventType, primaryGoal, employment, specialSituation } = answers;
  const isUS = market === 'US';

  const inc = incomeType || employment || '';
  const evt = eventType || specialSituation || '';

  if (isUS) {
    if (evt === 'EXPAT' || evt === 'ACT60' || evt === 'foreign_income' || evt === 'expat_income') {
      return PERSONA_DEFINITIONS.US_EXPAT_TERRITORY;
    }
    if (inc === 'BUSINESS' || inc === 'freelance_1099' || inc === 'FREELANCE' || evt === 'BUSINESS' || evt === 'biz_expenses') {
      return PERSONA_DEFINITIONS.US_SCORP_FREELANCER;
    }
    if (evt === 'REAL_ESTATE' || evt === 'rental_prop') {
      return PERSONA_DEFINITIONS.US_RENTAL_REAL_ESTATE;
    }
    return PERSONA_DEFINITIONS.US_SALARIED_STOCKS;
  } else {
    if (evt === 'HUF' || inc === 'FAMILY_HUF' || inc === 'family_huf') {
      return PERSONA_DEFINITIONS.IN_HUF_FAMILY;
    }
    if (evt === 'US_RSUS' || evt === 'SCHEDULE_FA' || evt === 'foreign_rsu') {
      return PERSONA_DEFINITIONS.IN_FOREIGN_ASSETS_ESOP;
    }
    if (inc === 'BUSINESS' || inc === 'FREELANCE' || inc === 'consultant') {
      return PERSONA_DEFINITIONS.IN_BUSINESS_PROFESSIONAL;
    }
    return PERSONA_DEFINITIONS.IN_SALARIED_INVESTOR;
  }
}

export const TAX_PERSONAS = PERSONA_DEFINITIONS;

export function generatePersonaRoadmap(personaKey) {
  const persona = PERSONA_DEFINITIONS[personaKey];
  if (!persona) return PERSONA_DEFINITIONS.US_SALARIED_STOCKS;
  return JSON.parse(JSON.stringify(persona));
}

