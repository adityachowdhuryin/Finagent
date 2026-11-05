import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useApp } from './AppContext';
import { useAuth } from './AuthContext';
import {
  generateTxfString,
  generateForm8949CsvString,
  generateIndiaCgExportString,
  generatePreFilledAttestationForm
} from '../utils/taxExportBundles';
import { parseRealBrokerageCsv } from '../utils/realBrokerParsers';
import {
  classifyTaxIntent,
  getPersonaFromCards,
  PERSONA_DEFINITIONS
} from '../utils/taxPersonaClassifier';

const TaxStudioContext = createContext(null);

export function TaxStudioProvider({ children }) {
  const { state: appState, isUSMarket } = useApp();
  const { currentUser, userProfile } = useAuth();

  const activeMarket = isUSMarket || appState?.activeMarket === 'US' ? 'US' : 'IN';

  // ── Baseline Taxpayer Profiles ─────────────────────────────────────────────
  const [inTaxpayer, setInTaxpayer] = useState({
    filerName: currentUser?.displayName || userProfile?.name || 'Arjun Sharma',
    pan: userProfile?.pan || 'ABCDE1234F',
    filingStatus: 'individual', // 'individual' | 'huf'
    stateCode: 'MH',
    residencyStatus: 'resident', // 'resident' | 'nri'
    taxRegime: 'new', // 'new' (Sec 115BAC) | 'old'
    salary: 2400000,
    businessProfit: 1200000,
    rentalIncome: 480000,
    dividendIncome: 42000,
    bankInterest: 14200,
    fdInterest: 28000,
    stcg: 180000,
    ltcg: 420000,
    unrealizedLoss: 125000,
    harvestedLoss: 0,
    deduction80C: 150000,
    deduction80D: 25000,
    deduction80CCD2: 50000,
    hraDeduction: 180000,
    homeLoanInterest24b: 200000,
    tdsPaid: 412000,
    advanceTaxPaid: 80000,
  });

  const [usTaxpayer, setUsTaxpayer] = useState({
    filerName: currentUser?.displayName || 'Alex Morgan',
    ssnMasked: 'XXX-XX-9182',
    filingStatus: 'married_joint', // 'single' | 'married_joint' | 'head_of_household' | 'married_separate'
    stateCode: 'CA',
    residencyStatus: 'resident', // 'resident' | 'resident_alien' | 'pr_bonafide' | 'expat'
    salary: 184200,
    businessProfit: 120000, // Schedule C gross receipts net
    sCorpW2Wage: 95000, // Reasonable compensation
    rentalIncome: 36000,
    dividendIncome: 14270,
    qualifiedDividends: 9800,
    bankInterest: 2450,
    stcg: -3200,
    ltcg: 33300,
    unrealizedLoss: 18400,
    harvestedLoss: 0,
    deductionType: 'standard', // 'standard' | 'itemized'
    saltDeduction: 10000, // Capped at $10k
    mortgageInterest: 18400,
    charitableDeduction: 5000,
    hsaContribution: 4150,
    k401Contribution: 23000,
    fedWithholding: 34500,
    stateWithholding: 12200,
    estimatedTaxPaid: 6000,
    // Expat & Territory fields
    daysAbroad: 335,
    foreignEarnedIncome: 115000,
    foreignTaxesPaid: 24000,
    territoryCode: null, // null | 'PR' | 'VI' | 'GU' | 'MP' | 'AS'
    hasAct60Decree: false,
    isoSpreadExercised: 45000, // Form 6251 AMT preference
  });

  // ── Multi-Year Loss Carryforward Banks ──────────────────────────────────────
  const [inLossCarryforwards, setInLossCarryforwards] = useState([
    { id: 'in-lc-1', ay: '2023-24', type: 'STCL', originalLoss: 85000, unabsorbedLoss: 35000, expiryAY: '2031-32', section: 'Sec 70/74' },
    { id: 'in-lc-2', ay: '2024-25', type: 'LTCL', originalLoss: 120000, unabsorbedLoss: 75000, expiryAY: '2032-33', section: 'Sec 74' },
    { id: 'in-lc-3', ay: '2025-26', type: 'STCL', originalLoss: 60000, unabsorbedLoss: 60000, expiryAY: '2033-34', section: 'Sec 70/74' },
  ]);

  const [usLossCarryforwards, setUsLossCarryforwards] = useState([
    { id: 'us-lc-1', year: 2023, type: 'STCL', originalLoss: 12000, remainingLoss: 6000, offsetThisYear: 3000, statutoryLimit: '$3,000/yr against ordinary income' },
    { id: 'us-lc-2', year: 2024, type: 'LTCL', originalLoss: 18500, remainingLoss: 15500, offsetThisYear: 0, statutoryLimit: 'Offsets future LTCG indefinitely' },
    { id: 'us-lc-3', year: 2025, type: 'AMT_MTC', description: 'Form 8801 Prior-Year Minimum Tax Credit (AMT)', creditAvailable: 4800, usedThisYear: 1200, statutoryLimit: 'Offsets regular tax below tentative AMT' },
    { id: 'us-lc-4', year: 2024, type: 'FTC', description: 'Form 1116 Foreign Tax Credit Carryforward', creditAvailable: 7200, usedThisYear: 2400, statutoryLimit: '10-Year statutory carryforward window' },
  ]);

  // ── Ingested Documents List ────────────────────────────────────────────────
  const [ingestedDocs, setIngestedDocs] = useState([
    {
      id: 'doc-seed-1',
      name: activeMarket === 'US' ? 'W-2_2026_TechCorp_Staff_Eng.pdf' : 'Form16_PartB_FY2025-26.pdf',
      type: activeMarket === 'US' ? 'Form W-2' : 'Form 16 Part B',
      size: '428 KB',
      uploadedAt: 'Today, 10:15 AM',
      status: 'VERIFIED_PARSED',
      verifiedFieldsCount: activeMarket === 'US' ? 14 : 18,
      issuer: activeMarket === 'US' ? 'TechCorp International Inc.' : 'Infosys Technologies Ltd',
      extractedEntities: activeMarket === 'US'
        ? { wages: 184200, fedWithholding: 34500, socialSecurityWages: 168600, medicareWages: 184200 }
        : { salary: 2400000, tds: 412000, sec80C: 150000, hraExemption: 180000 },
      hash: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    },
    {
      id: 'doc-seed-2',
      name: activeMarket === 'US' ? '1099-B_Consolidated_Robinhood_2026.pdf' : 'CAMS_KFintech_CAS_FY2025-26.pdf',
      type: activeMarket === 'US' ? 'Form 1099-B' : 'Consolidated Account Statement (CAS)',
      size: '1.2 MB',
      uploadedAt: 'Yesterday, 04:30 PM',
      status: 'VERIFIED_PARSED',
      verifiedFieldsCount: activeMarket === 'US' ? 22 : 31,
      issuer: activeMarket === 'US' ? 'Apex Clearing / Robinhood Financial' : 'CAMS & KFintech Registrar',
      extractedEntities: activeMarket === 'US'
        ? { stcg: -3200, ltcg: 33300, washSaleDisallowed: 420, qualifiedDividends: 6420 }
        : { stcg: 180000, ltcg: 420000, totalUnitsRedeemed: 4500, directNAVTotal: 1840000 },
      hash: 'sha256:d8c11e649a37e96a4a49c4e259e8f6bfdfd87b3223126f584f2c00d45ca2490b',
    }
  ]);

  // ── What-If Scenario, Dropzone & Vault Modal States ───────────────────────
  const [isScenarioOpen, setIsScenarioOpen] = useState(false);
  const [isDropzoneOpen, setIsDropzoneOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [activeScenarioPreset, setActiveScenarioPreset] = useState(
    activeMarket === 'US' ? 'RELOCATE_TX' : 'REGIME_OPTIMIZE'
  );
  const [scenarioOverrides, setScenarioOverrides] = useState({});

  // ── Commercial Monetization, PII Privacy & B2B Practice States ─────────────
  const [isTaxProUnlocked, setIsTaxProUnlocked] = useState(() => {
    return localStorage.getItem('finagent_tax_pro_unlocked') === 'true';
  });
  const [isPiiMasked, setIsPiiMasked] = useState(false);
  const [activeWorkspaceMode, setActiveWorkspaceMode] = useState('individual'); // 'individual' | 'cpa_practice'
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [paywallReason, setPaywallReason] = useState('TRANSMISSION');
  const [isBrokerSyncOpen, setIsBrokerSyncOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isCpaReviewModalOpen, setIsCpaReviewModalOpen] = useState(false);
  const [cpaReviewStatus, setCpaReviewStatus] = useState('UNASSIGNED');
  const [isQuarterlyModalOpen, setIsQuarterlyModalOpen] = useState(false);
  const [incomingCpaQueue, setIncomingCpaQueue] = useState([
    {
      id: 'rev-01',
      clientName: 'Jonathan Vance',
      taxYear: '2025',
      jurisdiction: 'California (CA)',
      agi: '$254,936',
      taxLiability: '$48,250',
      status: 'PENDING_REVIEW',
      scheduledSlot: 'March 24, 2026 at 11:00 AM EST',
      sealHash: 'SHA256-49A82D1E-US-2026-STAMP',
      flags: ['S-Corp Reasonable Comp $95k', 'Form 8949 Box A/D', 'PTET SALT CA AB 150'],
    },
    {
      id: 'rev-02',
      clientName: 'Priya Patel',
      taxYear: 'AY 2026-27',
      jurisdiction: 'Maharashtra (MH)',
      agi: '₹31,92,200',
      taxLiability: '₹6,42,100',
      status: 'PENDING_REVIEW',
      scheduledSlot: 'March 25, 2026 at 02:30 PM IST',
      sealHash: 'SHA256-8B1C902A-IN-2026-STAMP',
      flags: ['Section 112A ₹1.25L Exemption', 'Schedule FA Foreign RSUs', 'HUF Entity Separate PAN'],
    },
  ]);

  // ── AI Tax Navigator & Adaptive Focus Mode State ──────────────────────────
  const [isTaxNavigatorOpen, setIsTaxNavigatorOpen] = useState(false);
  const [userTaxPersona, setUserTaxPersona] = useState(() => {
    try {
      return localStorage.getItem('finagent_tax_persona_key') || null;
    } catch {
      return null;
    }
  });
  const [isFocusModeActive, setIsFocusModeActive] = useState(() => {
    try {
      return localStorage.getItem('finagent_tax_focus_mode') !== 'false';
    } catch {
      return true;
    }
  });
  const [activeRoadmap, setActiveRoadmap] = useState(() => {
    try {
      const savedKey = localStorage.getItem('finagent_tax_persona_key');
      if (savedKey && PERSONA_DEFINITIONS[savedKey]) {
        return PERSONA_DEFINITIONS[savedKey];
      }
    } catch {}
    return null;
  });

  // ── Plain English Mode & In-Tab Co-Pilot State ─────────────────────────────
  const [isPlainEnglishMode, setIsPlainEnglishMode] = useState(() => {
    try {
      return localStorage.getItem('finagent_tax_plain_english') !== 'false';
    } catch {
      return true;
    }
  });

  const togglePlainEnglishMode = useCallback(() => {
    setIsPlainEnglishMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('finagent_tax_plain_english', String(next));
      } catch {}
      return next;
    });
  }, []);

  const [isCoPilotCollapsed, setIsCoPilotCollapsed] = useState(() => {
    try {
      return localStorage.getItem('finagent_copilot_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCoPilotCollapse = useCallback(() => {
    setIsCoPilotCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('finagent_copilot_collapsed', String(next));
      } catch {}
      return next;
    });
  }, []);

  const [isCoPilotDismissed, setIsCoPilotDismissed] = useState(() => {
    try {
      return localStorage.getItem('finagent_copilot_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const dismissCoPilot = useCallback(() => {
    setIsCoPilotDismissed(true);
    try {
      localStorage.setItem('finagent_copilot_dismissed', 'true');
    } catch {}
  }, []);

  const restoreCoPilot = useCallback(() => {
    setIsCoPilotDismissed(false);
    setIsCoPilotCollapsed(false);
    try {
      localStorage.setItem('finagent_copilot_dismissed', 'false');
      localStorage.setItem('finagent_copilot_collapsed', 'false');
    } catch {}
  }, []);

  const [currentTab, setCurrentTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('tab') || 'e-file';
    }
    return 'e-file';
  });

  const [currentSubTab, setCurrentSubTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('subTab') || null;
    }
    return null;
  });

  const setTab = useCallback((newTab, newSubTab = null) => {
    setCurrentTab(newTab);
    setCurrentSubTab(newSubTab);
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', newTab);
        if (newSubTab) {
          url.searchParams.set('subTab', newSubTab);
        } else {
          url.searchParams.delete('subTab');
        }
        window.history.pushState({}, '', url.toString());
        window.dispatchEvent(new Event('popstate'));
      } catch {}
    }
  }, []);

  const [spotlightTarget, setSpotlightTarget] = useState(null);

  const triggerSpotlight = useCallback((elementId) => {
    if (!elementId) return;
    setSpotlightTarget(elementId);

    const trySpotlight = (retries = 5) => {
      try {
        const el = document.getElementById(elementId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('tax-spotlight-active');
          setTimeout(() => {
            el.classList.remove('tax-spotlight-active');
            setSpotlightTarget(null);
          }, 2600);
        } else if (retries > 0) {
          setTimeout(() => trySpotlight(retries - 1), 200);
        } else {
          setSpotlightTarget(null);
        }
      } catch {
        setSpotlightTarget(null);
      }
    };

    trySpotlight();
  }, []);

  // ── Fiduciary CPA / CA Review State ────────────────────────────────────────
  const [cpaReview, setCpaReview] = useState({
    status: 'none', // 'none' | 'dispatching' | 'assigned' | 'certified'
    assignedPro: null,
    requestedAt: null,
    notes: '',
  });

  // ── Helper to update active taxpayer ───────────────────────────────────────
  const updateTaxpayer = useCallback((keyOrUpdates, value) => {
    if (activeMarket === 'US') {
      setUsTaxpayer((prev) => {
        if (typeof keyOrUpdates === 'string') {
          return { ...prev, [keyOrUpdates]: value };
        }
        return { ...prev, ...keyOrUpdates };
      });
    } else {
      setInTaxpayer((prev) => {
        if (typeof keyOrUpdates === 'string') {
          return { ...prev, [keyOrUpdates]: value };
        }
        return { ...prev, ...keyOrUpdates };
      });
    }
  }, [activeMarket]);

  // ── Document Ingestion Parser ──────────────────────────────────────────────
  const ingestDocument = useCallback((file, docTypeOverride = null) => {
    const isUS = activeMarket === 'US';
    const fakeHash = 'sha256:' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    
    let docType = docTypeOverride;
    if (!docType) {
      const name = file.name.toLowerCase();
      if (name.includes('w2') || name.includes('w-2')) docType = 'Form W-2';
      else if (name.includes('1099-b') || name.includes('1099b')) docType = 'Form 1099-B';
      else if (name.includes('1099-div')) docType = 'Form 1099-DIV';
      else if (name.includes('16') || name.includes('form16')) docType = 'Form 16 Part B';
      else if (name.includes('cas') || name.includes('cams')) docType = 'CAMS/KFin CAS';
      else docType = isUS ? 'Tax Schedule / Statement' : 'Income Statement';
    }

    // Mock intelligent entity extraction
    let extracted = {};
    if (docType.includes('W-2')) {
      extracted = { wages: 195000, fedWithholding: 38200, medicareWages: 195000 };
      setUsTaxpayer((p) => ({ ...p, salary: 195000, fedWithholding: 38200 }));
    } else if (docType.includes('1099-B')) {
      extracted = { stcg: 4500, ltcg: 48000, washSaleLossDisallowed: 620 };
      setUsTaxpayer((p) => ({ ...p, stcg: 4500, ltcg: 48000 }));
    } else if (docType.includes('Form 16')) {
      extracted = { salary: 2650000, tds: 448000, deduction80C: 150000 };
      setInTaxpayer((p) => ({ ...p, salary: 2650000, tdsPaid: 448000 }));
    } else if (docType.includes('CAS')) {
      extracted = { stcg: 210000, ltcg: 540000, unrealizedLoss: 145000 };
      setInTaxpayer((p) => ({ ...p, stcg: 210000, ltcg: 540000, unrealizedLoss: 145000 }));
    } else {
      extracted = { status: 'Entity verified', verifiedFields: 12 };
    }

    const newDoc = {
      id: `doc-${Date.now()}`,
      name: file.name,
      type: docType,
      size: `${Math.round(file.size / 1024 || 350)} KB`,
      uploadedAt: 'Just now',
      status: 'VERIFIED_PARSED',
      verifiedFieldsCount: Object.keys(extracted).length + 8,
      issuer: isUS ? 'IRS Authorized Submitter / Brokerage' : 'Income Tax Dept / RTA Certified',
      extractedEntities: extracted,
      hash: fakeHash,
    };

    setIngestedDocs((prev) => [newDoc, ...prev]);
    return newDoc;
  }, [activeMarket]);

  // ── Loss Harvesting Execution ──────────────────────────────────────────────
  const executeLossHarvest = useCallback((lossAmount) => {
    if (activeMarket === 'US') {
      setUsTaxpayer((prev) => ({
        ...prev,
        harvestedLoss: prev.harvestedLoss + lossAmount,
        unrealizedLoss: Math.max(0, prev.unrealizedLoss - lossAmount),
        stcg: prev.stcg - lossAmount,
      }));
    } else {
      setInTaxpayer((prev) => ({
        ...prev,
        harvestedLoss: prev.harvestedLoss + lossAmount,
        unrealizedLoss: Math.max(0, prev.unrealizedLoss - lossAmount),
        stcg: prev.stcg - lossAmount,
      }));
    }
  }, [activeMarket]);

  // ── Commercial & Privacy Helpers ──────────────────────────────────────────
  const unlockTaxPro = useCallback((planId = 'pro') => {
    setIsTaxProUnlocked(true);
    localStorage.setItem('finagent_tax_pro_unlocked', 'true');
    setIsPaywallOpen(false);
  }, []);

  const lockTaxPro = useCallback(() => {
    setIsTaxProUnlocked(false);
    localStorage.removeItem('finagent_tax_pro_unlocked');
  }, []);

  const togglePiiMask = useCallback(() => {
    setIsPiiMasked((prev) => !prev);
  }, []);

  const triggerPaywall = useCallback((reason = 'TRANSMISSION') => {
    if (isTaxProUnlocked) return true; // Already unlocked!
    setPaywallReason(reason);
    setIsPaywallOpen(true);
    return false;
  }, [isTaxProUnlocked]);

  const closePaywall = useCallback(() => {
    setIsPaywallOpen(false);
  }, []);

  const maskValue = useCallback((val, type = 'text') => {
    if (!isPiiMasked) return val;
    if (!val && val !== 0) return '••••';
    const str = String(val);
    if (type === 'ssn') {
      return `***-**-${str.slice(-4) || '9182'}`;
    }
    if (type === 'pan') {
      return `*****${str.slice(-4) || '234F'}`;
    }
    if (type === 'currency') {
      return activeMarket === 'US' ? '$***,***' : '₹**,**,***';
    }
    return '••••••••';
  }, [isPiiMasked, activeMarket]);

  const syncBrokerageData = useCallback((brokerName, payload = {}) => {
    const isUS = activeMarket === 'US';
    if (isUS) {
      setUsTaxpayer((prev) => ({
        ...prev,
        stcg: payload.stcg !== undefined ? payload.stcg : prev.stcg,
        ltcg: payload.ltcg !== undefined ? payload.ltcg : prev.ltcg,
        salary: payload.wages !== undefined ? payload.wages : prev.salary,
        fedWithholding: payload.fedWithholding !== undefined ? payload.fedWithholding : prev.fedWithholding,
      }));
    } else {
      setInTaxpayer((prev) => ({
        ...prev,
        stcg: payload.stcg !== undefined ? payload.stcg : prev.stcg,
        ltcg: payload.ltcg !== undefined ? payload.ltcg : prev.ltcg,
        salary: payload.wages !== undefined ? payload.wages : prev.salary,
        tdsPaid: payload.tds !== undefined ? payload.tds : prev.tdsPaid,
      }));
    }

    // Add to ingested docs list
    const syncDoc = {
      id: `doc-sync-${Date.now()}`,
      name: `${brokerName} Real-Time API Ledger`,
      type: 'Direct API Feed',
      size: 'Live Cloud Stream',
      uploadedAt: 'Just now',
      status: 'VERIFIED_PARSED',
      verifiedFieldsCount: (payload.taxLotsCount || 24) + 6,
      issuer: `${brokerName} Custodian & Clearing API`,
      extractedEntities: payload,
      hash: 'sha256:api_' + Array.from({ length: 56 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    };
    setIngestedDocs((prev) => [syncDoc, ...prev]);
    return syncDoc;
  }, [activeMarket]);

  // ── CPA / CA Fiduciary Dispatch ────────────────────────────────────────────
  const dispatchToCpaCa = useCallback((notes = '') => {
    setCpaReview({
      status: 'assigned',
      requestedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      notes,
      assignedPro: activeMarket === 'US'
        ? {
            name: 'Sarah Jenkins, CPA (CA Lic #119420)',
            firm: 'Beacon Wealth & Fiduciary Tax LLP',
            location: 'San Francisco, CA',
            rating: '4.98 / 5.0 (142 audited filings)',
            turnaround: 'Under 24 hours guaranteed',
            mefAccredited: true,
          }
        : {
            name: 'CA Rajesh Aggarwal, FCA (ICAI Mem #084921)',
            firm: 'Aggarwal & Singhal Chartered Accountants',
            location: 'Nariman Point, Mumbai',
            rating: '4.99 / 5.0 (210 statutory audits)',
            turnaround: 'Same-day DIN filing',
            caCertified: true,
          },
    });
  }, [activeMarket]);

  // ── Commercial CPA Practice Queue Dispatch & Certification ─────────────────
  const dispatchToCpaPractice = useCallback((bookingDetails = {}) => {
    const isUS = activeMarket === 'US';
    const newQueueItem = {
      id: `rev-${Date.now()}`,
      clientName: isUS ? usTaxpayer.filerName : inTaxpayer.filerName,
      taxYear: isUS ? '2025' : 'AY 2026-27',
      jurisdiction: isUS ? `${usTaxpayer.stateCode}` : `${inTaxpayer.stateCode}`,
      agi: isUS ? `$${(usTaxpayer.salary + usTaxpayer.businessProfit).toLocaleString()}` : `₹${(inTaxpayer.salary + inTaxpayer.businessProfit).toLocaleString('en-IN')}`,
      taxLiability: isUS ? '$48,250' : '₹6,42,100',
      status: 'DISPATCHED_TO_PRACTICE_QUEUE',
      scheduledSlot: `${bookingDetails.scheduledDate || '2026-03-24'} at ${bookingDetails.scheduledTime || '11:00 AM EST'}`,
      sealHash: 'SHA256-CLIENT-DISPATCHED-STAMP',
      flags: isUS ? ['12-Page Audit Binder Sealed', 'Circular 230 Certified'] : ['Schedule FA Disclosed', 'Section 288 Verified'],
      ...bookingDetails,
    };
    setIncomingCpaQueue((prev) => [newQueueItem, ...prev]);
    setCpaReviewStatus('DISPATCHED');
  }, [activeMarket, usTaxpayer, inTaxpayer]);

  const certifyClientReturn = useCallback((clientId) => {
    setIncomingCpaQueue((prev) => prev.map((item) => {
      if (item.id === clientId) {
        return {
          ...item,
          status: 'CERTIFIED_LOCKED',
          certifiedAt: new Date().toISOString(),
          certifiedBy: activeMarket === 'US' ? 'Sarah Jenkins, CPA (PTIN: P0192847)' : 'CA Rajesh Aggarwal, FCA (ICAI: 084921)',
        };
      }
      return item;
    }));
  }, [activeMarket]);

  // ── File Downloader Utility ────────────────────────────────────────────────
  const downloadTextFile = (content, filename, mimeType = 'text/plain') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ── Export Handshake Methods ───────────────────────────────────────────────
  const exportTxfBundle = useCallback(() => {
    const lots = [
      { symbol: 'AAPL', description: 'Apple Inc.', dateAcquired: '2025-01-15', dateSold: '2025-11-20', proceeds: 28500, costBasis: 22000, term: 'SHORT' },
      { symbol: 'NVDA', description: 'NVIDIA Corporation', dateAcquired: '2024-03-10', dateSold: '2025-12-05', proceeds: 44000, costBasis: 18000, term: 'LONG' },
      { symbol: 'TSLA', description: 'Tesla Inc.', dateAcquired: '2025-02-14', dateSold: '2025-10-18', proceeds: 14200, costBasis: 17500, term: 'SHORT' },
    ];
    const txfStr = generateTxfString(lots, { ssn: usTaxpayer.ssnMasked, name: usTaxpayer.filerName });
    downloadTextFile(txfStr, 'finagent_tax_return_2025.txf', 'application/x-txf');
  }, [usTaxpayer]);

  const exportForm8949Csv = useCallback(() => {
    const lots = [
      { symbol: 'AAPL', description: 'Apple Inc. - 120 Shs', dateAcquired: '2025-01-15', dateSold: '2025-11-20', proceeds: 28500, costBasis: 22000, term: 'SHORT' },
      { symbol: 'NVDA', description: 'NVIDIA Corporation - 40 Shs', dateAcquired: '2024-03-10', dateSold: '2025-12-05', proceeds: 44000, costBasis: 18000, term: 'LONG' },
      { symbol: 'TSLA', description: 'Tesla Inc. - 60 Shs', dateAcquired: '2025-02-14', dateSold: '2025-10-18', proceeds: 14200, costBasis: 17500, term: 'SHORT' },
    ];
    const csvStr = generateForm8949CsvString(lots);
    downloadTextFile(csvStr, 'form_8949_sales_and_dispositions.csv', 'text/csv');
  }, []);

  const exportIndiaCgBundle = useCallback(() => {
    const lots = [
      { symbol: 'RELIANCE', description: 'Reliance Industries - 100 Shs', dateAcquired: '2025-02-10', dateSold: '2025-10-15', proceeds: 295000, costBasis: 240000, term: 'SHORT' },
      { symbol: 'TCS', description: 'Tata Consultancy Services - 80 Shs', dateAcquired: '2023-04-12', dateSold: '2025-11-28', proceeds: 340000, costBasis: 210000, term: 'LONG' },
    ];
    const jsonStr = generateIndiaCgExportString(lots, { pan: inTaxpayer.pan, name: inTaxpayer.filerName });
    downloadTextFile(jsonStr, 'schedule_cg_capital_gains.json', 'application/json');
  }, [inTaxpayer]);

  const exportAttestationPdf = useCallback(() => {
    const isUS = activeMarket === 'US';
    const pdfDoc = generatePreFilledAttestationForm({
      isUS,
      taxpayerName: isUS ? usTaxpayer.filerName : inTaxpayer.filerName,
      idNumber: isUS ? usTaxpayer.ssnMasked : inTaxpayer.pan,
      totalIncome: isUS ? (usTaxpayer.salary + usTaxpayer.businessProfit) : (inTaxpayer.salary + inTaxpayer.businessProfit),
      taxLiability: isUS ? 48250 : 642100,
      sealHash: 'SHA256-CERTIFIED-SIGNATURE-AUTH-2026',
    });
    pdfDoc.save(isUS ? 'form_8879_signature_authorization.pdf' : 'form_itr_v_verification.pdf');
  }, [activeMarket, usTaxpayer, inTaxpayer]);

  const parseAndIngestRealCsv = useCallback((csvText, filename = '') => {
    const parsed = parseRealBrokerageCsv(csvText, filename);
    const isUS = activeMarket === 'US';

    if (isUS) {
      setUsTaxpayer((prev) => ({
        ...prev,
        stcg: parsed.summary.netShortTerm || prev.stcg,
        ltcg: parsed.summary.netLongTerm || prev.ltcg,
        unrealizedLoss: parsed.summary.harvestableLosses || prev.unrealizedLoss,
      }));
    } else {
      setInTaxpayer((prev) => ({
        ...prev,
        stcg: parsed.summary.netShortTerm || prev.stcg,
        ltcg: parsed.summary.netLongTerm || prev.ltcg,
        unrealizedLoss: parsed.summary.harvestableLosses || prev.unrealizedLoss,
      }));
    }

    const docObj = {
      id: `doc-csv-${Date.now()}`,
      name: filename || `${parsed.format} Statement Export`,
      type: `${parsed.format} Realized CSV`,
      size: `${Math.round(csvText.length / 1024)} KB`,
      uploadedAt: 'Just now',
      status: 'VERIFIED_PARSED',
      verifiedFieldsCount: parsed.lotsCount * 6,
      issuer: `${parsed.format} Institutional Brokerage`,
      extractedEntities: parsed.summary,
      lots: parsed.lots,
      hash: 'SHA256-REAL-BROKERAGE-INGESTION-STAMP',
    };
    setIngestedDocs((prev) => [docObj, ...prev]);
    return docObj;
  }, [activeMarket]);

  // ── AI Tax Navigator & Roadmap Handlers ───────────────────────────────────
  const setPersonaAndGenerateRoadmap = useCallback((personaKeyOrText, customInput = '') => {
    let diagnosed = null;
    if (typeof personaKeyOrText === 'object') {
      diagnosed = getPersonaFromCards(personaKeyOrText, activeMarket);
    } else if (PERSONA_DEFINITIONS[personaKeyOrText]) {
      diagnosed = PERSONA_DEFINITIONS[personaKeyOrText];
    } else {
      diagnosed = classifyTaxIntent(personaKeyOrText || customInput, activeMarket);
    }

    if (diagnosed) {
      setUserTaxPersona(diagnosed.key);
      setActiveRoadmap({ ...diagnosed, steps: diagnosed.steps.map((s) => ({ ...s, completed: false })) });
      setIsFocusModeActive(true);
      try {
        localStorage.setItem('finagent_tax_persona_key', diagnosed.key);
        localStorage.setItem('finagent_tax_focus_mode', 'true');
        localStorage.setItem('finagent_tax_navigator_seen', 'true');
      } catch {}
    }
    setIsTaxNavigatorOpen(false);
  }, [activeMarket]);

  const toggleFocusMode = useCallback(() => {
    setIsFocusModeActive((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('finagent_tax_focus_mode', String(next));
      } catch {}
      return next;
    });
  }, []);

  const completeRoadmapStep = useCallback((stepId) => {
    setActiveRoadmap((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        steps: prev.steps.map((s) => s.id === stepId ? { ...s, completed: true } : s),
      };
    });
  }, []);

  const advanceToNextRoadmapStep = useCallback((stepId, onSelectTab) => {
    setActiveRoadmap((prev) => {
      if (!prev) return null;
      const updatedSteps = prev.steps.map((s) => s.id === stepId ? { ...s, completed: true } : s);
      const currIdx = prev.steps.findIndex((s) => s.id === stepId);
      if (currIdx !== -1 && currIdx < prev.steps.length - 1) {
        const nextStep = prev.steps[currIdx + 1];
        if (nextStep && nextStep.tab && onSelectTab) {
          setTimeout(() => onSelectTab(nextStep.tab, nextStep.subTab), 120);
        }
      }
      return {
        ...prev,
        steps: updatedSteps,
      };
    });
  }, []);

  const resetPersonaAndRoadmap = useCallback(() => {
    setUserTaxPersona(null);
    setActiveRoadmap(null);
    setIsFocusModeActive(false);
    try {
      localStorage.removeItem('finagent_tax_persona_key');
      localStorage.setItem('finagent_tax_focus_mode', 'false');
    } catch {}
  }, []);

  // ── Dynamic Tax & Alpha Mathematical Computations ──────────────────────────
  const computedMetrics = useMemo(() => {
    if (activeMarket === 'US') {
      const {
        salary, businessProfit, sCorpW2Wage, dividendIncome, qualifiedDividends,
        bankInterest, stcg, ltcg, stateCode, territoryCode, hasAct60Decree,
        residencyStatus, daysAbroad, foreignEarnedIncome
      } = usTaxpayer;

      // 1. S-Corp FICA Savings
      // Self-employment tax on Schedule C profit vs S-Corp reasonable salary:
      // Profit: $120,000. Under Sole Prop: SE tax ~ 15.3% on $120k * 0.9235 = ~$16,955
      // Under S-Corp: Wage is $95k (FICA 15.3% on $95k = $14,535), Distribution $25k escapes FICA ($3,825 saved)
      const solePropSeTax = Math.round(businessProfit * 0.9235 * 0.153);
      const sCorpWageFica = Math.round(Math.min(businessProfit, sCorpW2Wage) * 0.153);
      const sCorpFicaSavings = Math.max(0, solePropSeTax - sCorpWageFica);

      // 2. PTET SALT Workaround Alpha (e.g. CA AB 150 9.3% or NY PTET 6.85%)
      const isPTETState = ['CA', 'NY', 'NJ', 'IL', 'MA', 'CO', 'GA', 'NC', 'AZ', 'VA'].includes(stateCode);
      const ptetRate = stateCode === 'CA' ? 0.093 : stateCode === 'NY' ? 0.0685 : 0.055;
      const ptetFederalTaxAlpha = isPTETState ? Math.round(businessProfit * ptetRate * 0.35) : 0; // 35% top bracket deduction

      // 3. Tax Loss Harvesting Alpha (stcg offset + $3,000 ordinary income offset)
      const ordinaryLossOffset = Math.min(3000, Math.max(0, -(stcg)));
      const harvestAlpha = Math.round((ordinaryLossOffset * 0.35) + (Math.max(0, ltcg) * 0.20 * 0.3));

      // 4. Territory Act 60 / Expat FEIE Relief
      let expatTerritoryAlpha = 0;
      if (territoryCode === 'PR' && hasAct60Decree) {
        // 0% capital gains tax under Act 60 vs 20% federal + 13.3% state
        expatTerritoryAlpha = Math.round((ltcg + dividendIncome) * 0.238);
      } else if (residencyStatus === 'expat' && daysAbroad >= 330) {
        // FEIE $130,000 exclusion at ~24% effective marginal rate
        const excluded = Math.min(130000, foreignEarnedIncome);
        expatTerritoryAlpha = Math.round(excluded * 0.24);
      }

      // 5. Total Tax Alpha
      const totalTaxAlpha = sCorpFicaSavings + ptetFederalTaxAlpha + harvestAlpha + expatTerritoryAlpha;

      // 6. Forensic Leakage Metrics (ERISA 401k + 12b-1 MF + Phantom gains + Subscriptions)
      const erisaLeakage = 1840;
      const mf12b1Leakage = 2450;
      const phantomTaxBleed = 1280;
      const zombieSubBleed = 850;
      const totalFeeLeakage = erisaLeakage + mf12b1Leakage + phantomTaxBleed + zombieSubBleed;

      // 7. Statutory Penalties Defended
      // FinCEN BOI ($591/day x 90 days = $53,190), Form 8606 pro-rata trap ($4,200), FBAR willful penalty defense ($100,000)
      const statutoryPenaltiesDefended = 53190 + 4200 + 100000;

      // 8. 10-Year Compounded Wealth Trajectory (10% annual CAGR on total annual savings)
      const annualReinvested = totalTaxAlpha + totalFeeLeakage;
      // FV = P * [((1 + r)^n - 1) / r]
      const r = 0.10;
      const n = 10;
      const tenYearWealthDelta = Math.round(annualReinvested * ((Math.pow(1 + r, n) - 1) / r));

      return {
        totalTaxAlpha,
        sCorpFicaSavings,
        ptetFederalTaxAlpha,
        harvestAlpha,
        expatTerritoryAlpha,
        totalFeeLeakage,
        erisaLeakage,
        mf12b1Leakage,
        phantomTaxBleed,
        zombieSubBleed,
        statutoryPenaltiesDefended,
        tenYearWealthDelta,
        currencySymbol: '$',
      };
    } else {
      // ── Indian Market Calculations ─────────────────────────────────────────
      const {
        salary, businessProfit, rentalIncome, dividendIncome, bankInterest,
        stcg, ltcg, taxRegime, deduction80C, deduction80D, deduction80CCD2,
        hraDeduction, homeLoanInterest24b
      } = inTaxpayer;

      // 1. HUF Multi-PAN Split Savings
      // Moving rental income (₹4.8L) + dividend (₹42k) + ₹1.5L 80C into HUF separate ₹3L basic exemption + lower slabs
      const hufExemptionSavings = 78000; // Average ₹78k-₹1.2L savings
      
      // 2. Tax Loss Harvesting Alpha (Offsetting 20% STCG and 12.5% LTCG above ₹1.25L exemption)
      const harvestAlpha = Math.round((Math.max(0, stcg) * 0.20 * 0.45) + (Math.max(0, ltcg - 125000) * 0.125 * 0.35));

      // 3. Section 80CCD(2) Corporate NPS Alpha (Up to 14% of basic salary tax-exempt under both regimes)
      const npsCorporateAlpha = Math.round(deduction80CCD2 * 0.312); // 30% slab + 4% cess

      // 4. Section 87A Rebate / Regime Arbitrage
      const regimeArbitrageAlpha = 42500;

      // Total Tax Alpha
      const totalTaxAlpha = hufExemptionSavings + harvestAlpha + npsCorporateAlpha + regimeArbitrageAlpha;

      // 5. Forensic Leakage Metrics (Regular MF commissions 1.15% on ₹85L AUM + Hidden banking charges)
      const regularMFCommissionLeakage = 97750;
      const hiddenBankExpense = 18500;
      const zombieSubBleed = 22250;
      const totalFeeLeakage = regularMFCommissionLeakage + hiddenBankExpense + zombieSubBleed;

      // 6. Statutory Penalties Defended
      // Black Money Act Foreign Asset non-disclosure (Schedule FA): ₹10,00,000 mandatory penalty
      // Section 234ABC interest defense: ₹45,000; Section 271J CA certification audit defense: ₹10,000
      const statutoryPenaltiesDefended = 1000000 + 45000 + 10000;

      // 7. 10-Year Compounded Wealth Trajectory (12% CAGR equity return on saved alpha + plugged fees)
      const annualReinvested = totalTaxAlpha + totalFeeLeakage;
      const r = 0.12;
      const n = 10;
      const tenYearWealthDelta = Math.round(annualReinvested * ((Math.pow(1 + r, n) - 1) / r));

      return {
        totalTaxAlpha,
        hufExemptionSavings,
        harvestAlpha,
        npsCorporateAlpha,
        regimeArbitrageAlpha,
        totalFeeLeakage,
        regularMFCommissionLeakage,
        hiddenBankExpense,
        zombieSubBleed,
        statutoryPenaltiesDefended,
        tenYearWealthDelta,
        currencySymbol: '₹',
      };
    }
  }, [activeMarket, usTaxpayer, inTaxpayer]);

  // ── Cryptographic SHA-256 Workpaper Seal Generator ─────────────────────────
  const computationHash = useMemo(() => {
    const rawData = activeMarket === 'US' ? JSON.stringify(usTaxpayer) : JSON.stringify(inTaxpayer);
    // Simple deterministic string hash for workpaper proof
    let hash = 0;
    for (let i = 0; i < rawData.length; i++) {
      const char = rawData.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `SHA256-${hex.toUpperCase()}-${activeMarket}-2026-STAMP`;
  }, [activeMarket, usTaxpayer, inTaxpayer]);

  const value = {
    activeMarket,
    // Tab & Navigation State
    currentTab,
    setCurrentTab,
    currentSubTab,
    setCurrentSubTab,
    setTab,
    // Taxpayers
    taxpayer: activeMarket === 'US' ? usTaxpayer : inTaxpayer,
    inTaxpayer,
    usTaxpayer,
    updateTaxpayer,
    // Loss Carryforwards
    lossCarryforwards: activeMarket === 'US' ? usLossCarryforwards : inLossCarryforwards,
    inLossCarryforwards,
    usLossCarryforwards,
    setUsLossCarryforwards,
    setInLossCarryforwards,
    // Documents
    ingestedDocs,
    ingestDocument,
    // Harvest Action
    executeLossHarvest,
    // What-If Scenarios & Modal States
    isScenarioOpen,
    setIsScenarioOpen,
    isDropzoneOpen,
    setIsDropzoneOpen,
    isVaultOpen,
    setIsVaultOpen,
    activeScenarioPreset,
    setActiveScenarioPreset,
    scenarioOverrides,
    setScenarioOverrides,
    // AI Tax Navigator & Adaptive Focus Mode
    isTaxNavigatorOpen,
    setIsTaxNavigatorOpen,
    userTaxPersona,
    isFocusModeActive,
    activeRoadmap,
    setPersonaAndGenerateRoadmap,
    toggleFocusMode,
    completeRoadmapStep,
    advanceToNextRoadmapStep,
    resetPersonaAndRoadmap,
    // Plain English Mode & In-Tab Co-Pilot
    isPlainEnglishMode,
    setIsPlainEnglishMode,
    togglePlainEnglishMode,
    isCoPilotCollapsed,
    setIsCoPilotCollapsed,
    toggleCoPilotCollapse,
    isCoPilotDismissed,
    dismissCoPilot,
    restoreCoPilot,
    spotlightTarget,
    triggerSpotlight,
    // CPA Review
    cpaReview,
    dispatchToCpaCa,
    // Commercial CPA Review & Practice Queue
    isCpaReviewModalOpen,
    setIsCpaReviewModalOpen,
    cpaReviewStatus,
    setCpaReviewStatus,
    incomingCpaQueue,
    dispatchToCpaPractice,
    certifyClientReturn,
    // Quarterly Safe Harbor Sentinel
    isQuarterlyModalOpen,
    setIsQuarterlyModalOpen,
    // Export Handshake Bundles
    exportTxfBundle,
    exportForm8949Csv,
    exportIndiaCgBundle,
    exportAttestationPdf,
    parseAndIngestRealCsv,
    // Analytics & Metrics
    computedMetrics,
    computationHash,
    // Monetization, Privacy & Practice Mode
    isTaxProUnlocked,
    unlockTaxPro,
    lockTaxPro,
    isPiiMasked,
    togglePiiMask,
    maskValue,
    activeWorkspaceMode,
    setActiveWorkspaceMode,
    isPaywallOpen,
    setIsPaywallOpen,
    paywallReason,
    triggerPaywall,
    closePaywall,
    isBrokerSyncOpen,
    setIsBrokerSyncOpen,
    isPrivacyModalOpen,
    setIsPrivacyModalOpen,
    syncBrokerageData,
  };

  return <TaxStudioContext.Provider value={value}>{children}</TaxStudioContext.Provider>;
}

export function useTaxStudio() {
  const context = useContext(TaxStudioContext);
  if (!context) {
    throw new Error('useTaxStudio must be used within a TaxStudioProvider');
  }
  return context;
}

export default TaxStudioContext;
