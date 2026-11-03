// src/utils/taxPlainEnglishDictionary.js
// Dual-Market Plain English (ELI5) Tax Translation Engine & In-Tab Field Guidance Matrix

/**
 * Universal Dual-Market Tax Glossary
 * Provides 5th-grade plain English explanations, savings impact, and statutory citations.
 */
export const TAX_TERM_GLOSSARY = {
  // ==========================================
  // US STATUTORY CONCEPTS
  // ==========================================
  FICA: {
    term: 'FICA',
    plainTitle: 'Medicare & Social Security Taxes',
    eli5: 'A 15.3% tax taken from self-employed income to pay for Social Security and Medicare. By paying yourself partly as distributions through an S-Corp, you legally skip paying this 15.3% on that portion.',
    whyItMatters: 'Can save typical consultants and freelancers $8,000 to $28,000 every single year.',
    statute: 'IRC § 3101 & IRC § 1401 (Federal Insurance Contributions Act)',
  },
  QBI: {
    term: 'QBI',
    plainTitle: '20% Small Business Tax Pass-Through Discount',
    eli5: 'A special tax law that lets eligible small businesses and freelancers pay income tax on only 80% of their net profits. The remaining 20% is completely tax-free.',
    whyItMatters: 'Instantly shields up to one-fifth of your business profit from federal tax.',
    statute: 'IRC § 199A (Qualified Business Income Deduction)',
  },
  REASONABLE_SALARY: {
    term: 'Reasonable Compensation',
    plainTitle: 'IRS Fair Pay Rule for Business Owners',
    eli5: 'If you own an S-Corp, the IRS requires you to pay yourself a fair market wage for the work you do before taking the rest as tax-advantaged profit distributions.',
    whyItMatters: 'Getting this ratio right (~60% salary / 40% distribution) maximizes tax savings while keeping you 100% audit-proof.',
    statute: 'Revenue Ruling 74-44 & IRC § 1366',
  },
  WASH_SALE: {
    term: 'IRS § 1091 Wash Sale Rule',
    plainTitle: '30-Day Stock Re-Purchase Restriction',
    eli5: 'If you sell a stock for a tax-deductible loss, you cannot buy the exact same stock within 30 days before or after. Otherwise, the IRS cancels your tax deduction.',
    whyItMatters: 'We swap your losing stock into a similar non-identical fund (like swapping VOO for IVV) so you keep your market position AND lock in the cash refund.',
    statute: 'IRC § 1091 (Loss from Wash Sales of Stock or Securities)',
  },
  SAFE_HARBOR: {
    term: 'IRS Safe Harbor Rule',
    plainTitle: 'Zero-Penalty Quarterly Tax Immunity',
    eli5: 'An IRS guarantee: if you pay at least 100% of last year\'s tax (or 110% if you earn over $150k) across four quarterly installments, you are legally immune from underpayment fines and interest, even if you owe money at tax time.',
    whyItMatters: 'Prevents thousands of dollars in surprise IRS interest charges (currently 8% APR).',
    statute: 'IRC § 6654(d) (Failure by Individual to Pay Estimated Income Tax)',
  },
  FORM_8949: {
    term: 'IRS Form 8949',
    plainTitle: 'Investment Sales Detail Sheet',
    eli5: 'The official IRS form where every single stock, bond, or crypto trade is listed row-by-row to show what you bought it for, what you sold it for, and whether you made or lost money.',
    whyItMatters: 'FinAgent automatically groups this into TurboTax TXF and official 8-column CSV formats for instant e-filing.',
    statute: 'IRS Instructions for Form 8949 & Schedule D',
  },
  PTET: {
    term: 'PTET (Pass-Through Entity Tax)',
    plainTitle: 'State Tax Cap Bypass Workaround',
    eli5: 'Federal law caps state tax deductions at $10,000 (the SALT cap). Over 36 states created PTET so your business can pay state tax directly, completely bypassing the $10,000 limit.',
    whyItMatters: 'Can save business owners in California, New York, and New Jersey over $15,000 in federal taxes.',
    statute: 'IRS Notice 2020-75, CA AB 150, NY Article 24-A',
  },
  AUGUSTA_RULE: {
    term: 'Augusta Rule (§ 280A(g))',
    plainTitle: 'Tax-Free Home Rental to Your Business',
    eli5: 'A legal tax perk that allows you to rent your personal home to your business for up to 14 days each year for corporate meetings. Your business gets a full tax deduction, and you receive the rental income 100% tax-free.',
    whyItMatters: 'Puts $5,000 to $17,500 of completely tax-free cash into your personal bank account.',
    statute: 'IRC § 280A(g) (Special Rule for Certain Use)',
  },
  FORM_7203: {
    term: 'Form 7203',
    plainTitle: 'Owner Investment & Debt Basis Tracker',
    eli5: 'An IRS form tracking how much actual money you have invested in your S-Corp. You can only deduct business losses or take tax-free distributions up to this basis amount.',
    whyItMatters: 'Required by the IRS with every S-Corp return; prevents taking distributions that trigger surprise capital gains tax.',
    statute: 'IRC § 1366(d) & IRS Form 7203',
  },
  FEIE: {
    term: 'Form 2555 FEIE',
    plainTitle: 'Foreign Earned Income Tax Exemption',
    eli5: 'If you are an American living abroad for at least 330 days in a 12-month period, you can exclude up to $130,000 of foreign salary from US federal income tax.',
    whyItMatters: 'Eliminates double taxation for US expats and digital nomads.',
    statute: 'IRC § 911 (Citizens or Residents of the US Living Abroad)',
  },
  FBAR: {
    term: 'FinCEN Form 114 (FBAR)',
    plainTitle: 'Foreign Bank Account Disclosure',
    eli5: 'If all your foreign bank or broker accounts combined exceed $10,000 at any point during the year, you must disclose them to the US Treasury by April 15.',
    whyItMatters: 'Failing to file triggers massive penalties starting at $10,000 per violation.',
    statute: '31 U.S.C. § 5314 & 31 CFR § 1010.350',
  },
  BACKDOOR_ROTH: {
    term: 'Backdoor Roth & Pro-Rata Rule',
    plainTitle: 'High-Earner Tax-Free Retirement Hack',
    eli5: 'High earners cannot contribute directly to a Roth IRA. Instead, you contribute to a Traditional IRA and immediately convert it. But if you have pre-tax IRA money elsewhere, the IRS taxes a portion of the conversion.',
    whyItMatters: 'Allows contributing $7,000/yr into forever tax-free accounts regardless of your salary.',
    statute: 'IRC § 408(d)(2) & IRS Form 8606',
  },
  ERISA_12B1: {
    term: '12b-1 Trailing Load & 401(k) Fee Drag',
    plainTitle: 'Hidden Wall Street Commission Cut',
    eli5: 'A hidden annual fee (typically 0.25% to 1.00%) sliced directly from mutual fund assets to pay brokers for selling the fund, with zero added performance for you.',
    whyItMatters: 'Over 25 years, a 1% annual fee can eat away up to 28% of your total retirement nest egg.',
    statute: 'SEC Rule 12b-1 & ERISA § 408(b)(2)',
  },

  // ==========================================
  // INDIA STATUTORY CONCEPTS
  // ==========================================
  HUF: {
    term: 'HUF (Hindu Undivided Family)',
    plainTitle: 'Separate Legal Family Tax Entity',
    eli5: 'Under Indian law, a family can create a separate legal entity with its own independent PAN card. It gets its own basic tax exemption limit (₹3L–₹4L) and separate Section 80C deduction, letting the family split income legally.',
    whyItMatters: 'Saves ₹1,50,000 to ₹7,00,000 annually by diverting rental income and investments into the HUF PAN.',
    statute: 'Hindu Undivided Family under Income Tax Act, 1961',
  },
  SECTION_115BAC: {
    term: 'Section 115BAC (New Tax Regime)',
    plainTitle: 'Default Flat-Bracket Tax System',
    eli5: 'The modern Indian tax regime offering lower tax rates across 6 simplified slabs, but eliminating most deductions like HRA, 80C, and home loan interest.',
    whyItMatters: 'Income up to ₹7,00,000 is 100% tax-free under Section 87A rebate.',
    statute: 'Section 115BAC of the Income Tax Act, 1961',
  },
  SECTION_112A: {
    term: 'Section 112A (LTCG on Equity)',
    plainTitle: 'Long-Term Stock & Mutual Fund Tax (12.5%)',
    eli5: 'Taxes on stock or mutual fund gains held for more than 12 months. Starting Budget 2024, gains above ₹1,25,000 are taxed at 12.5% without indexation.',
    whyItMatters: 'The first ₹1,25,000 of profit every single financial year is 100% tax-free.',
    statute: 'Section 112A of the Income Tax Act, 1961 (Budget 2024)',
  },
  SECTION_111A: {
    term: 'Section 111A (STCG on Equity)',
    plainTitle: 'Short-Term Stock Trading Profit Tax (20%)',
    eli5: 'Gains on listed stocks or equity mutual funds held for less than 12 months before selling. Taxed at a flat 20% starting Budget 2024.',
    whyItMatters: 'Harvesting short-term capital losses offsets these 20% gains directly.',
    statute: 'Section 111A of the Income Tax Act, 1961',
  },
  SECTION_44ADA: {
    term: 'Section 44ADA',
    plainTitle: '50% Flat Freelancer Tax Deduction',
    eli5: 'A simplified tax scheme for professionals (software developers, architects, consultants) earning up to ₹75 Lakhs. You can declare only 50% of your gross earnings as profit and pay tax only on that half, with zero bookkeeping needed.',
    whyItMatters: 'Cuts your taxable income in half with no receipts or audit required.',
    statute: 'Section 44ADA of the Income Tax Act, 1961',
  },
  AIS_TIS: {
    term: 'AIS / TIS (Annual Information Statement)',
    plainTitle: 'Income Tax Department Activity Dossier',
    eli5: 'The government\'s master record of all your financial activity: salary TDS, share sales, mutual fund dividends, and high-value bank deposits.',
    whyItMatters: 'If your tax filing doesn\'t match the AIS report, the tax department automatically sends an automated discrepancy notice.',
    statute: 'Rule 114-I of Income Tax Rules, 1962',
  },
  SCHEDULE_FA: {
    term: 'Schedule FA',
    plainTitle: 'Foreign Stock & Account Disclosure',
    eli5: 'A mandatory reporting table in ITR-2/ITR-3 where Indian residents must disclose any foreign asset, including US company RSUs, ESPP, or foreign bank accounts.',
    whyItMatters: 'Failure to disclose carries a strict flat penalty of ₹10,00,000 under the Black Money Act.',
    statute: 'Schedule FA & Section 43 of the Black Money Act, 2015',
  },
  SECTION_234C: {
    term: 'Section 234C & 234B',
    plainTitle: 'Advance Tax Shortfall Interest Penalty',
    eli5: 'If your tax due exceeds ₹10,000 in a year, you must pay it in 4 installments (June 15%, Sept 45%, Dec 75%, March 100%). Missing a deadline triggers a 1% per month interest fine.',
    whyItMatters: 'Paying before the quarterly milestone shields you from automatic interest penalties.',
    statute: 'Sections 208, 234B & 234C of Income Tax Act, 1961',
  },
  SECTION_80CCD2: {
    term: 'Section 80CCD(2)',
    plainTitle: 'Employer NPS Tax Shield',
    eli5: 'An extra tax deduction where your employer deposits up to 10% (14% for govt) of your basic salary directly into the National Pension System (NPS).',
    whyItMatters: 'Completely exempt under both Old and New Tax Regimes with no upper rupee cap.',
    statute: 'Section 80CCD(2) of Income Tax Act, 1961',
  },
};

/**
 * Contextual In-Tab Field Guidance Matrix
 * Tells the floating Co-Pilot what mission to show, what element to spotlight,
 * and what tip to display based on the active tab and user persona.
 */
export function getModuleFieldGuidance(personaKey = '', tabId = 'e-file', market = 'US') {
  const isUS = market === 'US';

  // --- S-Corp & HUF Module (tab = 'huf') ---
  if (tabId === 'huf') {
    if (isUS) {
      return {
        tabId: 'huf',
        missionTitle: 'Find Your Maximum S-Corp Tax Savings',
        plainMission: 'Slide your W-2 Salary slider to find the sweet spot where your 15.3% self-employment tax savings are highest.',
        spotlightTargetId: 'scorp-salary-slider',
        actionTip: 'Aim for roughly a 60% salary / 40% distribution split to maximize savings while remaining IRS audit-proof.',
        nextStepTitle: 'Quarterly Safe Harbor Autopilot',
        nextTabId: 'quarterly',
        targetLabel: 'W-2 Reasonable Salary Slider',
      };
    } else {
      return {
        tabId: 'huf',
        missionTitle: 'Generate HUF Deed & Set Up Separate PAN',
        plainMission: 'Verify family coparceners and generate your stamped HUF foundational deed to unlock an extra ₹3L–₹7L tax-free income.',
        spotlightTargetId: 'huf-deed-btn',
        actionTip: 'Click "Download Legal HUF Deed" to generate your printable stamp-duty contract for your bank account.',
        nextStepTitle: 'Section 80C Double Dip & Tax Slabs',
        nextTabId: 'itr',
        targetLabel: 'Generate Legal HUF Deed Button',
      };
    }
  }

  // --- Quarterly Safe Harbor (tab = 'quarterly') ---
  if (tabId === 'quarterly') {
    if (isUS) {
      return {
        tabId: 'quarterly',
        missionTitle: 'Shield Yourself from IRS Underpayment Fines',
        plainMission: 'Review your 110% safe harbor number and sync estimated tax dates to your calendar to guarantee zero interest penalties.',
        spotlightTargetId: 'safe-harbor-ics-sync-btn',
        actionTip: 'Paying your exact quarterly installment guarantees immunity from the 8% IRS interest charge.',
        nextStepTitle: 'E-File 1040 Statutory Package',
        nextTabId: 'e-file',
        targetLabel: 'Add to Calendar (.ics) Button',
      };
    } else {
      return {
        tabId: 'quarterly',
        missionTitle: 'Automate Advance Tax (Sec 234C)',
        plainMission: 'Check your June/Sept/Dec/March advance tax milestones to avoid paying 1% monthly interest penalties.',
        spotlightTargetId: 'safe-harbor-ics-sync-btn',
        actionTip: 'Ensure at least 15% is deposited by June 15 and 45% by September 15.',
        nextStepTitle: 'ITR Filing & AIS Reconciler',
        nextTabId: 'e-file',
        targetLabel: 'Advance Tax Milestones & Calendar',
      };
    }
  }

  // --- Tax Loss Harvester (tab = 'harvester') ---
  if (tabId === 'harvester') {
    if (isUS) {
      return {
        tabId: 'harvester',
        missionTitle: 'Lock In Your $3,000 Ordinary Income Loss Write-Off',
        plainMission: 'Scan your portfolio to find underwater stocks, then execute a safe proxy swap to pocket an immediate tax refund.',
        spotlightTargetId: 'harvest-execute-btn',
        actionTip: 'Swapping into a proxy ETF retains your stock market upside while permanently realizing the capital loss for tax season.',
        nextStepTitle: 'Quarterly Safe Harbor Defense',
        nextTabId: 'quarterly',
        targetLabel: 'Execute Proxy Harvesting Button',
      };
    } else {
      return {
        tabId: 'harvester',
        missionTitle: 'Offset Capital Gains with Year-End Harvesting',
        plainMission: 'Identify underwater stocks to offset your realized short-term gains (20%) and long-term gains (12.5%).',
        spotlightTargetId: 'harvest-execute-btn',
        actionTip: 'Remember that the first ₹1,25,000 of LTCG is completely tax-free every year.',
        nextStepTitle: 'ITR-2 Filing & AIS Reconciliation',
        nextTabId: 'e-file',
        targetLabel: 'Execute Loss Harvest Button',
      };
    }
  }

  // --- Forensic Fee Audit (tab = 'forensic') ---
  if (tabId === 'forensic') {
    if (isUS) {
      return {
        tabId: 'forensic',
        missionTitle: 'Plug Hidden 401(k) & 12b-1 Fee Leakage',
        plainMission: 'Uncover hidden broker fees in your 401(k) or mutual funds and verify foreign asset reporting (FBAR / Schedule FA).',
        spotlightTargetId: 'forensic-audit-card',
        actionTip: 'Switching high-fee funds into equivalent zero-commission ETFs can save over $100k over 20 years.',
        nextStepTitle: 'IRS E-Filing Hub',
        nextTabId: 'e-file',
        targetLabel: 'Audit Analysis Results',
      };
    } else {
      return {
        tabId: 'forensic',
        missionTitle: 'Stop Commission Drain & Check Schedule FA',
        plainMission: 'Identify regular mutual funds draining ~1.15% in broker cuts and declare US RSUs to avoid the ₹10L Black Money fine.',
        spotlightTargetId: 'forensic-audit-card',
        actionTip: 'Converting regular plans to direct mutual plans immediately increases your returns by ~1% every year.',
        nextStepTitle: 'ITR E-Filing & AIS Reconciler',
        nextTabId: 'e-file',
        targetLabel: 'Fee Leakage Breakdown Card',
      };
    }
  }

  // --- E-Filing & AIS Hub (tab = 'e-file') ---
  if (tabId === 'e-file') {
    if (isUS) {
      return {
        tabId: 'e-file',
        missionTitle: 'Ingest Documents & E-File IRS Return',
        plainMission: 'Drop your W-2 or broker 1099-B CSV into the dropzone to automatically populate your return with zero typing.',
        spotlightTargetId: 'dropzone-upload-btn',
        actionTip: 'All documents are processed purely in your browser\'s memory with zero server storage.',
        nextStepTitle: 'Harvest Losses for Tax Discount',
        nextTabId: 'harvester',
        targetLabel: 'Document Dropzone Button',
      };
    } else {
      return {
        tabId: 'e-file',
        missionTitle: 'Reconcile AIS & E-File Official ITR',
        plainMission: 'Drop your Form 16 or CAMS/NSDL CAS PDF to reconcile TDS discrepancies and verify tax credits.',
        spotlightTargetId: 'dropzone-upload-btn',
        actionTip: 'Checking AIS discrepancies before filing eliminates automated Section 143(1) mismatch notices.',
        nextStepTitle: 'Tax-Loss Harvesting Studio',
        nextTabId: 'harvester',
        targetLabel: 'Document Dropzone Button',
      };
    }
  }

  // --- Federal & State / ITR Assistant (tab = 'itr') ---
  return {
    tabId: 'itr',
    missionTitle: isUS ? 'Review 50-State & Federal Deductions' : 'Compare Old vs New Tax Regime',
    plainMission: isUS
      ? 'Verify standard deduction vs itemized mortgage deductions across all 50 states.'
      : 'Calculate whether Section 115BAC New Regime or Old Regime with 80C/80D saves you more money.',
    spotlightTargetId: 'itr-regime-calc-btn',
    actionTip: isUS
      ? 'Ensure your state tax deductions are maximized under state-specific rules.'
      : 'New Regime is usually cheaper unless you have large home loans and 80C investments exceeding ₹3.75L.',
    nextStepTitle: 'Final E-Filing Package',
    nextTabId: 'e-file',
    targetLabel: 'Regime Comparison Calculator',
  };
}

/**
 * Translates a statutory title or metric into a human-friendly plain English string.
 */
export function getPlainEnglishLabel(key = '', marketOrFallback = '', fallback = '') {
  const market = marketOrFallback === 'US' || marketOrFallback === 'IN' ? marketOrFallback : 'US';
  const resolvedFallback = (marketOrFallback && marketOrFallback !== 'US' && marketOrFallback !== 'IN') 
    ? marketOrFallback 
    : fallback;

  const dictionary = {
    // Top banner 4 hero metrics
    totalTaxAlpha: 'Annual Tax Savings Found',
    totalFeeLeakage: 'Hidden Wall Street Fees Stopped',
    statutoryPenaltiesDefended: 'IRS / Tax Authority Fines Blocked',
    tenYearWealthDelta: '10-Yr Compounded Wealth Boost',
    
    // Additional metrics
    effectiveTaxRate: 'Actual % of Income Paid in Tax',
    taxDrag: 'Money Lost to Inefficient Taxes',
    marginalRate: 'Tax Rate on Your Next Dollar',
    lossHarvestAlpha: 'Direct Cash Saved from Stock Losses',

    // Tab translations
    tab_efile: 'E-Filing & Document Ingestion',
    tab_quarterly: market === 'US' ? 'Zero-Penalty IRS Calendar' : 'Zero-Penalty Advance Tax Calendar',
    tab_huf: market === 'US' ? 'S-Corp & Small Business Pay Optimizer' : 'Family HUF Tax-Free Income Shelter',
    tab_harvester: 'Tax-Loss Cash Refund Swaps',
    tab_forensic: 'Hidden Fee Hunter & Fine Shield',
    tab_itr: market === 'US' ? '50-State & Federal Tax Optimizer' : 'Old vs New Tax Regime Analyzer',

    // Short tab IDs
    efile: 'E-Filing & Document Ingestion',
    quarterly: market === 'US' ? 'Zero-Penalty IRS Calendar' : 'Zero-Penalty Advance Tax Calendar',
    huf: market === 'US' ? 'S-Corp & Small Business Pay Optimizer' : 'Family HUF Tax-Free Income Shelter',
    harvester: 'Tax-Loss Cash Refund Swaps',
    forensic: 'Hidden Fee Hunter & Fine Shield',
    itr: market === 'US' ? '50-State & Federal Tax Optimizer' : 'Old vs New Tax Regime Analyzer',
  };

  return dictionary[key] || resolvedFallback;
}
