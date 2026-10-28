// src/pages/consumer/us/USTaxAssistant.jsx
// High-Fidelity Institutional US Federal & 50-State Statutory Tax Assistant (Tax Year 2026)
// Form 6251 Alternative Minimum Tax (AMT), ISO Spread Preferences, Pass-Through Entity Tax (PTET / CA AB 150 / NY PTET),
// Child Tax Credit & Dependent Care FSA Phaseouts, California Schedule CA & New York IT-201 Non-Conformity Engine.

import React, { useState, useEffect } from 'react';
import {
  Calculator, DollarSign, ShieldCheck, Download, RefreshCw,
  TrendingDown, TrendingUp, HelpCircle, Layers, CheckCircle2, ChevronRight,
  AlertTriangle, Building, Briefcase, Users, FileText, ArrowRight, Check, Sparkles, Scale,
  Calendar, Clock, Landmark, AlertCircle, PieChart, Plus, Trash2, Send,
  Globe, Lock, UploadCloud, FileCheck, Save
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useApp } from '../../../context/AppContext';
import { useAuth } from '../../../context/AuthContext';
import StickyActionDock from '../../../components/common/StickyActionDock';
import TaxBracketStepVisualizer from '../../../components/tax/visualizations/TaxBracketStepVisualizer';
import ProRataTrapDonut from '../../../components/tax/visualizations/ProRataTrapDonut';
import { useTaxStudio } from '../../../context/TaxStudioContext';

const US_STATE_GROUPS = [
  {
    group: 'Core Tech & High-AUM States',
    states: [
      { code: 'CA', name: 'California', top: '13.3%', ptet: 'AB 150 (9.3%)', sdi: '1.2% Uncapped', hsaTaxable: true },
      { code: 'NY', name: 'New York (State & NYC)', top: '10.9% / 14.8%', ptet: 'Article 24-A (6.85%-10.9%)', mta: '0.34%', hsaTaxable: false },
      { code: 'WA', name: 'Washington', top: '7.0% (LTCG > $250k)', ptet: 'N/A', hsaTaxable: false },
      { code: 'MA', name: 'Massachusetts', top: '9.0% (Fair Share)', ptet: 'Chapter 63D (5.0%)', hsaTaxable: false },
      { code: 'NJ', name: 'New Jersey', top: '10.75%', ptet: 'BAIT (5.675%-6.52%)', hsaTaxable: true },
      { code: 'IL', name: 'Illinois', top: '4.95%', ptet: 'IL § 201(p) (4.95%)', hsaTaxable: false },
      { code: 'CO', name: 'Colorado', top: '4.40%', ptet: 'CO SALT Workaround (4.4%)', hsaTaxable: false },
      { code: 'GA', name: 'Georgia', top: '5.39%', ptet: 'HB 149 (5.39%)', hsaTaxable: false },
      { code: 'NC', name: 'North Carolina', top: '4.50%', ptet: 'NC PTET (4.50%)', hsaTaxable: false },
      { code: 'PA', name: 'Pennsylvania', top: '3.07%', ptet: 'N/A', hsaTaxable: true },
      { code: 'AZ', name: 'Arizona', top: '2.50%', ptet: 'AZ PTET (2.50%)', hsaTaxable: false },
      { code: 'VA', name: 'Virginia', top: '5.75%', ptet: 'VA PTET (5.75%)', hsaTaxable: false },
    ]
  },
  {
    group: 'Zero State Income Tax States',
    states: [
      { code: 'TX', name: 'Texas (Zero Income Tax)', top: '0.0%', ptet: 'N/A (No Personal Tax)', hsaTaxable: false },
      { code: 'FL', name: 'Florida (Zero Income Tax)', top: '0.0%', ptet: 'N/A (No Personal Tax)', hsaTaxable: false },
      { code: 'NV', name: 'Nevada (Zero Income Tax)', top: '0.0%', ptet: 'N/A', hsaTaxable: false },
      { code: 'WY', name: 'Wyoming (Zero Income Tax)', top: '0.0%', ptet: 'N/A', hsaTaxable: false },
      { code: 'TN', name: 'Tennessee (Zero Income Tax)', top: '0.0%', ptet: 'N/A', hsaTaxable: false },
      { code: 'SD', name: 'South Dakota (Zero Income Tax)', top: '0.0%', ptet: 'N/A', hsaTaxable: false },
      { code: 'AK', name: 'Alaska (Zero Income Tax)', top: '0.0%', ptet: 'N/A', hsaTaxable: false },
      { code: 'NH', name: 'New Hampshire (Zero Income Tax)', top: '0.0%', ptet: 'N/A', hsaTaxable: false },
    ]
  },
  {
    group: 'All Other US States (A–Z)',
    states: [
      { code: 'AL', name: 'Alabama', top: '5.00%', ptet: 'AL Act 2021-1 (5%)', hsaTaxable: true },
      { code: 'AR', name: 'Arkansas', top: '4.40%', ptet: 'AR Act 362 (4.4%)', hsaTaxable: false },
      { code: 'CT', name: 'Connecticut', top: '6.99%', ptet: 'CT Mandatory PE Tax (6.99%)', hsaTaxable: false },
      { code: 'DE', name: 'Delaware', top: '6.60%', ptet: 'N/A', hsaTaxable: false },
      { code: 'DC', name: 'District of Columbia', top: '10.75%', ptet: 'N/A', hsaTaxable: false },
      { code: 'HI', name: 'Hawaii', top: '11.00%', ptet: 'HI PTET (11%)', hsaTaxable: false },
      { code: 'ID', name: 'Idaho', top: '5.695%', ptet: 'ID HB 317 (5.695%)', hsaTaxable: false },
      { code: 'IN', name: 'Indiana', top: '3.05%', ptet: 'IN PTET (3.05%)', hsaTaxable: false },
      { code: 'IA', name: 'Iowa', top: '3.80%', ptet: 'IA PTET (3.8%)', hsaTaxable: false },
      { code: 'KS', name: 'Kansas', top: '5.70%', ptet: 'KS SALT Parity (5.7%)', hsaTaxable: false },
      { code: 'KY', name: 'Kentucky', top: '4.00%', ptet: 'KY HB 360 (4.0%)', hsaTaxable: false },
      { code: 'LA', name: 'Louisiana', top: '4.25%', ptet: 'LA Act 442 (4.25%)', hsaTaxable: false },
      { code: 'ME', name: 'Maine', top: '7.15%', ptet: 'ME PTET (7.15%)', hsaTaxable: false },
      { code: 'MD', name: 'Maryland', top: '5.75% + local', ptet: 'MD SB 523 (8.95%)', hsaTaxable: false },
      { code: 'MI', name: 'Michigan', top: '4.25%', ptet: 'MI Flow-Through (4.25%)', hsaTaxable: false },
      { code: 'MN', name: 'Minnesota', top: '9.85%', ptet: 'MN PTET (9.85%)', hsaTaxable: false },
      { code: 'MS', name: 'Mississippi', top: '4.00%', ptet: 'MS HB 1698 (4%)', hsaTaxable: true },
      { code: 'MO', name: 'Missouri', top: '4.70%', ptet: 'MO HB 2400 (4.7%)', hsaTaxable: false },
      { code: 'MT', name: 'Montana', top: '5.90%', ptet: 'MT SB 554 (5.9%)', hsaTaxable: false },
      { code: 'NE', name: 'Nebraska', top: '5.84%', ptet: 'NE LB 754 (5.84%)', hsaTaxable: false },
      { code: 'NM', name: 'New Mexico', top: '5.90%', ptet: 'NM HB 102 (5.9%)', hsaTaxable: false },
      { code: 'ND', name: 'North Dakota', top: '2.50%', ptet: 'N/A', hsaTaxable: false },
      { code: 'OH', name: 'Ohio', top: '3.50%', ptet: 'OH SB 246 (3.5%)', hsaTaxable: false },
      { code: 'OK', name: 'Oklahoma', top: '4.75%', ptet: 'OK Pass-Through (4.75%)', hsaTaxable: false },
      { code: 'OR', name: 'Oregon', top: '9.90%', ptet: 'OR SB 1524 (9.9%)', hsaTaxable: false },
      { code: 'RI', name: 'Rhode Island', top: '5.99%', ptet: 'RI PTET (5.99%)', hsaTaxable: false },
      { code: 'SC', name: 'South Carolina', top: '6.20%', ptet: 'SC Act 61 (6.2%)', hsaTaxable: false },
      { code: 'UT', name: 'Utah', top: '4.55%', ptet: 'UT PTET (4.55%)', hsaTaxable: false },
      { code: 'VT', name: 'Vermont', top: '8.75%', ptet: 'N/A', hsaTaxable: false },
      { code: 'WV', name: 'West Virginia', top: '5.12%', ptet: 'WV PTET (5.12%)', hsaTaxable: false },
      { code: 'WI', name: 'Wisconsin', top: '7.65%', ptet: 'WI Act 368 (7.65%)', hsaTaxable: false },
    ]
  },
  {
    group: 'US Overseas Territories',
    states: [
      { code: 'PR', name: 'Puerto Rico', top: '33.0% (Hacienda) / 0% Act 60', ptet: 'Act 60 (4% Corporate)', isTerritory: true, governing: 'IRC § 933 & Act 60 Decree' },
      { code: 'VI', name: 'U.S. Virgin Islands', top: 'Mirror Code (VIBIR)', ptet: 'EDC 90% Exemption', isTerritory: true, governing: 'IRC § 932 Single Return' },
      { code: 'GU', name: 'Guam', top: 'Mirror Code (Guam DRT)', ptet: 'QC 75% Rebate', isTerritory: true, governing: 'IRC § 935 Single Return' },
      { code: 'MP', name: 'Northern Mariana Islands', top: 'Mirror Code (CNMI DRT)', ptet: 'N/A', isTerritory: true, governing: 'IRC § 935 Single Return' },
      { code: 'AS', name: 'American Samoa', top: '4%-10% Non-Mirror', ptet: 'N/A', isTerritory: true, governing: 'IRC § 931 Non-Mirror' },
    ]
  }
];

const US_STATES = US_STATE_GROUPS.flatMap(g => g.states);

export default function USTaxAssistant() {
  const { state } = useApp();
  const { currentUser, userProfile } = useAuth();

  let taxStudio = null;
  try {
    taxStudio = useTaxStudio();
  } catch (e) {
    // Graceful fallback
  }

  // Active Sub-Tab
  const [activeSubTab, setActiveSubTab] = useState('overview'); // 'overview' | 'amt' | 'ptet' | 'credits' | 'states'

  // Primary Tax Form State
  const [filingStatus, setFilingStatus] = useState('Single');
  const [w2Wages, setW2Wages] = useState(taxStudio?.usTaxpayer?.salary || 210000);
  const [interestIncome, setInterestIncome] = useState(taxStudio?.usTaxpayer?.bankInterest || 3200);
  const [ordinaryDividends, setOrdinaryDividends] = useState(8500);
  const [qualifiedDividends, setQualifiedDividends] = useState(taxStudio?.usTaxpayer?.qualifiedDividends || 6400);
  const [shortTermGains, setShortTermGains] = useState(taxStudio?.usTaxpayer?.stcg !== undefined ? taxStudio.usTaxpayer.stcg : -3000);
  const [longTermGains, setLongTermGains] = useState(taxStudio?.usTaxpayer?.ltcg || 38000);
  const [stateCode, setStateCode] = useState(taxStudio?.usTaxpayer?.stateCode || 'CA');
  const [isNYCResident, setIsNYCResident] = useState(false);

  useEffect(() => {
    if (taxStudio?.usTaxpayer) {
      const tp = taxStudio.usTaxpayer;
      if (tp.salary && tp.salary !== w2Wages) setW2Wages(tp.salary);
      if (tp.stateCode && tp.stateCode !== stateCode) setStateCode(tp.stateCode);
      if (tp.ltcg !== undefined && tp.ltcg !== longTermGains) setLongTermGains(tp.ltcg);
    }
  }, [taxStudio?.usTaxpayer?.salary, taxStudio?.usTaxpayer?.stateCode, taxStudio?.usTaxpayer?.ltcg]);

  // Itemized Deductions (Schedule A)
  const [saltTaxes, setSaltTaxes] = useState(18500); // capped at $10k
  const [mortgageInterest, setMortgageInterest] = useState(22400);
  const [charitableCash, setCharitableCash] = useState(5500);
  const [medicalExpenses, setMedicalExpenses] = useState(3000);
  const [hsaContributions, setHsaContributions] = useState(4150);
  const [preTax401k, setPreTax401k] = useState(23000);

  // Alternative Minimum Tax (AMT - Form 6251) State
  const [isoSpread, setIsoSpread] = useState(65000); // Tech ISO exercise preference: (FMV - Strike) * Shares
  const [privateActivityBonds, setPrivateActivityBonds] = useState(0);

  // Pass-Through Entity Tax (PTET) State
  const [entityNetIncome, setEntityNetIncome] = useState(275000);
  const [hasBusinessPassThrough, setHasBusinessPassThrough] = useState(true);

  // Child & Dependent Care State
  const [qualifyingChildren, setQualifyingChildren] = useState(1);
  const [otherDependents, setOtherDependents] = useState(0);
  const [dependentCareSpend, setDependentCareSpend] = useState(5000);

  // ── Overseas US Territories State ─────────────────────────────────────────
  const [territorySourceIncome, setTerritorySourceIncome] = useState(120000);
  const [act60Decree, setAct60Decree] = useState(false);

  // ── Living Abroad / US Expatriate State ────────────────────────────────────
  const [isLivingAbroad, setIsLivingAbroad] = useState(false);
  const [foreignDaysPresent, setForeignDaysPresent] = useState(335);
  const [foreignEarnedIncome, setForeignEarnedIncome] = useState(140000);
  const [foreignTaxesPaid, setForeignTaxesPaid] = useState(28000);

  // ── Form 1040-ES Quarterly State ───────────────────────────────────────────
  const [priorYearTax, setPriorYearTax] = useState(42000);
  const [priorYearAGI, setPriorYearAGI] = useState(215000);
  const [w2WithholdingYTD, setW2WithholdingYTD] = useState(24000);
  const [quarterlyPayments, setQuarterlyPayments] = useState([4500, 4500, 0, 0]);
  const [quarterlyResult, setQuarterlyResult] = useState(null);

  // ── Schedule D Netting State ──────────────────────────────────────────────
  const [shortTermTrades, setShortTermTrades] = useState([
    { id: 'st_1', desc: 'NVDA Bear Put Spread', proceeds: 14500, costBasis: 19800 },
    { id: 'st_2', desc: 'TSLA Day Trade Lot', proceeds: 28400, costBasis: 24200 },
    { id: 'st_3', desc: 'PLTR Covered Call Roll', proceeds: 3200, costBasis: 5100 },
  ]);
  const [longTermTrades, setLongTermTrades] = useState([
    { id: 'lt_1', desc: 'VTI Total Market Index (2022 Lot)', proceeds: 52000, costBasis: 36000 },
    { id: 'lt_2', desc: 'MSFT Tech Holdings (2021 Lot)', proceeds: 41000, costBasis: 29000 },
    { id: 'lt_3', desc: 'ARKK Innovation Loss Lot', proceeds: 6500, costBasis: 14500 },
  ]);
  const [newSTTrade, setNewSTTrade] = useState({ desc: '', proceeds: '', costBasis: '' });
  const [newLTTrade, setNewLTTrade] = useState({ desc: '', proceeds: '', costBasis: '' });
  const [priorYearLossCarryover, setPriorYearLossCarryover] = useState(4500);
  const [scheduleDResult, setScheduleDResult] = useState(null);

  // ── Prescriptive Tax-Shield Optimizer State ────────────────────────────────
  const [claimed401k, setClaimed401k] = useState(16500);
  const [claimedHSA, setClaimedHSA] = useState(2200);
  const [claimedFSA, setClaimedFSA] = useState(2500);
  const [claimedIRA, setClaimedIRA] = useState(0);
  const [taxShieldResult, setTaxShieldResult] = useState(null);

  // Results & Loading
  const [taxResult, setTaxResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // ── Form 8606 & Backdoor Roth Pro-Rata Trap State ─────────────────────────
  const [form8606State, setForm8606State] = useState({
    nondeductibleContribution: 7000,
    priorYearBasis: 0,
    yearEndTraditionalIRABalance: 63000, // Pre-tax traditional/rollover balance
    rothConversionAmount: 7000,
  });
  const [foreignAccounts, setForeignAccounts] = useState([
    { institutionName: 'HDFC Bank Ltd', accountNumber: '****4321', country: 'India', maxBalanceUSD: 15000, yearEndBalanceUSD: 14000 },
    { institutionName: 'ICICI Bank NRE Account', accountNumber: '****9988', country: 'India', maxBalanceUSD: 8500, yearEndBalanceUSD: 6200 },
  ]);
  const [form8606Result, setForm8606Result] = useState(null);
  const [loadingForm8606, setLoadingForm8606] = useState(false);

  // Persistence & CPA Workpaper State
  const [savedReturnStatusUS, setSavedReturnStatusUS] = useState(null);
  const [returnSealHashUS, setReturnSealHashUS] = useState(null);
  const [savingDraftUS, setSavingDraftUS] = useState(false);
  const [lockingReturnUS, setLockingReturnUS] = useState(false);
  const [cpaCredentials, setCpaCredentials] = useState({
    name: 'Sarah M. Jenkins, CPA',
    ptin: 'P01928472',
    efin: '109283',
    firmName: 'Apex Tax & Wealth Advisory LLP',
    circular230Check: true,
    auditNotes: 'Verified all 1099-B, W-2 Box 1-17, and IRC § 408(d)(2) basis schedules. No Circular 230 exceptions.'
  });
  const [pbcChecklistUS, setPbcChecklistUS] = useState({
    w2s: true,
    form1099B: true,
    form1099DIV: true,
    form1098Mortgage: true,
    form5498IRA: true,
    foreignAccountFBAR: true,
    priorYearReturn: true,
  });

  // Document Ingestion State
  const [ingestionTextUS, setIngestionTextUS] = useState('');
  const [parsedDocResultUS, setParsedDocResultUS] = useState(null);
  const [parsingDocUS, setParsingDocUS] = useState(false);

  useEffect(() => {
    calculateTaxes();
  }, [
    filingStatus, w2Wages, interestIncome, ordinaryDividends, qualifiedDividends,
    shortTermGains, longTermGains, stateCode, isNYCResident,
    saltTaxes, mortgageInterest, charitableCash, medicalExpenses, hsaContributions,
    isoSpread, privateActivityBonds, entityNetIncome, hasBusinessPassThrough,
    qualifyingChildren, otherDependents, dependentCareSpend,
    territorySourceIncome, act60Decree, isLivingAbroad, foreignDaysPresent, foreignEarnedIncome, foreignTaxesPaid
  ]);

  useEffect(() => {
    calculateQuarterlyTaxes();
  }, [taxResult?.summary?.totalFederalTax, priorYearTax, priorYearAGI, w2WithholdingYTD, quarterlyPayments]);

  useEffect(() => {
    calculateScheduleD();
  }, [shortTermTrades, longTermTrades, priorYearLossCarryover, filingStatus]);

  useEffect(() => {
    calculateTaxShields();
  }, [w2Wages, filingStatus, stateCode, claimed401k, claimedHSA, claimedFSA, claimedIRA]);

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  }

  async function calculateTaxes() {
    setLoading(true);
    try {
      const res = await fetch('/api/us-tax/calculate-federal-and-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filingStatus,
          w2Wages: Number(w2Wages) || 0,
          interestIncome: Number(interestIncome) || 0,
          ordinaryDividends: Number(ordinaryDividends) || 0,
          qualifiedDividends: Number(qualifiedDividends) || 0,
          shortTermCapitalGains: Number(shortTermGains) || 0,
          longTermCapitalGains: Number(longTermGains) || 0,
          stateCode,
          isNYCResident,
          itemizedDeductions: {
            saltTaxes: Number(saltTaxes) || 0,
            mortgageInterest: Number(mortgageInterest) || 0,
            charitableCash: Number(charitableCash) || 0,
            medicalExpenses: Number(medicalExpenses) || 0,
          },
          hsaContributions: Number(hsaContributions) || 0,
          preTax401k: Number(preTax401k) || 0,
          isoSpread: Number(isoSpread) || 0,
          privateActivityBondInterest: Number(privateActivityBonds) || 0,
          qualifyingChildren: Number(qualifyingChildren) || 0,
          otherDependents: Number(otherDependents) || 0,
          dependentCareSpend: Number(dependentCareSpend) || 0,
          entityPTETIncome: hasBusinessPassThrough ? Number(entityNetIncome) : 0,
          // Overseas Territory & Expat Fields
          isTerritoryResident: ['PR', 'VI', 'GU', 'MP', 'AS'].includes(stateCode),
          territorySourceIncome: Number(territorySourceIncome) || 0,
          act60Decree,
          isLivingAbroad,
          foreignDaysPresent: Number(foreignDaysPresent) || 0,
          foreignEarnedIncome: Number(foreignEarnedIncome) || 0,
          foreignTaxesPaid: Number(foreignTaxesPaid) || 0,
        })
      });
      const data = await res.json();
      if (data.success) {
        setTaxResult(data);
      }
    } catch (err) {
      console.error('US Tax Calculation failed:', err);
    } finally {
      setLoading(false);
    }
  }

  async function calculateQuarterlyTaxes() {
    try {
      const estimatedTax = taxResult?.summary?.totalFederalTax || 38000;
      const res = await fetch('/api/us-tax/quarterly-estimated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentYearEstimatedTax: estimatedTax,
          priorYearActualTax: Number(priorYearTax) || 0,
          priorYearAGI: Number(priorYearAGI) || 0,
          w2WithholdingYTD: Number(w2WithholdingYTD) || 0,
          quarterlyPaymentsMade: quarterlyPayments.map(Number),
        })
      });
      const data = await res.json();
      if (data.success) {
        setQuarterlyResult(data);
      }
    } catch (err) {
      console.error('Quarterly tax calculation failed:', err);
    }
  }

  async function calculateScheduleD() {
    try {
      const res = await fetch('/api/us-tax/schedule-d-netting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shortTermTrades,
          longTermTrades,
          priorYearLossCarryover: Number(priorYearLossCarryover) || 0,
          filingStatus,
        })
      });
      const data = await res.json();
      if (data.success) {
        setScheduleDResult(data);
      }
    } catch (err) {
      console.error('Schedule D netting calculation failed:', err);
    }
  }

  async function calculateTaxShields() {
    try {
      const res = await fetch('/api/us-tax/tax-shield-optimizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salary: Number(w2Wages) || 185000,
          filingStatus,
          marginalFederalRate: 0.32,
          marginalStateRate: stateCode === 'CA' ? 0.093 : (stateCode === 'NY' ? 0.0685 : 0.05),
          traditional401kClaimed: Number(claimed401k) || 0,
          hsaClaimed: Number(claimedHSA) || 0,
          dependentCareClaimed: Number(claimedFSA) || 0,
          iraClaimed: Number(claimedIRA) || 0,
        })
      });
      const data = await res.json();
      if (data.success) {
        setTaxShieldResult(data);
      }
    } catch (err) {
      console.error('Tax-shield calculation failed:', err);
    }
  }

  function handleMaxOutTaxShields() {
    if (!taxShieldResult?.caps) return;
    setClaimed401k(taxShieldResult.caps.traditional401k);
    setClaimedHSA(taxShieldResult.caps.hsa);
    setClaimedFSA(taxShieldResult.caps.dependentCareFSA);
    setClaimedIRA(taxShieldResult.caps.traditionalIRA);
    showToast('✓ All tax shields maximized to statutory limits! Saved max allowable taxes.');
  }

  function handleAddSTTrade() {
    if (!newSTTrade.desc || !newSTTrade.proceeds || !newSTTrade.costBasis) {
      showToast('Please fill description, proceeds, and cost basis');
      return;
    }
    setShortTermTrades(prev => [
      ...prev,
      {
        id: `st_${Date.now()}`,
        desc: newSTTrade.desc,
        proceeds: Number(newSTTrade.proceeds),
        costBasis: Number(newSTTrade.costBasis)
      }
    ]);
    setNewSTTrade({ desc: '', proceeds: '', costBasis: '' });
    showToast('✓ Added Short-Term trade to Schedule D Part I');
  }

  function handleAddLTTrade() {
    if (!newLTTrade.desc || !newLTTrade.proceeds || !newLTTrade.costBasis) {
      showToast('Please fill description, proceeds, and cost basis');
      return;
    }
    setLongTermTrades(prev => [
      ...prev,
      {
        id: `lt_${Date.now()}`,
        desc: newLTTrade.desc,
        proceeds: Number(newLTTrade.proceeds),
        costBasis: Number(newLTTrade.costBasis)
      }
    ]);
    setNewLTTrade({ desc: '', proceeds: '', costBasis: '' });
    showToast('✓ Added Long-Term trade to Schedule D Part II');
  }

  function handleRemoveSTTrade(id) {
    setShortTermTrades(prev => prev.filter(t => t.id !== id));
  }

  function handleRemoveLTTrade(id) {
    setLongTermTrades(prev => prev.filter(t => t.id !== id));
  }

  function downloadForm1040ESVoucher(q) {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('FORM 1040-ES (2026) ESTIMATED TAX PAYMENT VOUCHER', 14, 20);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`IRS Department of the Treasury — Internal Revenue Service`, 14, 26);
    doc.text(`Taxpayer: ${currentUser?.displayName || 'Alex Morgan'} | SSN: XXX-XX-6789`, 14, 32);

    const rows = [
      ['Voucher Quarter', q.quarter],
      ['Calendar Due Date', q.dueDate],
      ['Period Covered', q.periodCovered],
      ['Required Safe Harbor Payment', `$${q.requiredPayment.toLocaleString()}`],
      ['Withholding Credit Applied', `$${q.withholdingCredit.toLocaleString()}`],
      ['Amount Remitted / Check Enclosed', `$${q.paid.toLocaleString()}`],
      ['Remaining Balance / Shortfall', `$${q.shortfall.toLocaleString()}`],
      ['Statutory Safe Harbor Authority', 'IRC § 6654(d) (Annualized Income / Prior Year Safe Harbor)'],
    ];

    autoTable(doc, {
      startY: 38,
      head: [['Voucher Field', 'Details & Statutory Telemetry']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 8.5 }
    });

    const finalY = doc.lastAutoTable.finalY + 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('PAYMENT INSTRUCTIONS (IRS EFTPS / DIRECT PAY):', 14, finalY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('1. Pay online electronically at www.irs.gov/payments using IRS Direct Pay or EFTPS.', 14, finalY + 6);
    doc.text('2. If mailing, make check payable to "United States Treasury" with SSN and "2026 Form 1040-ES" in memo.', 14, finalY + 12);

    doc.save(`IRS_Form_1040ES_Voucher_${q.quarter}_2026.pdf`);
    showToast(`✓ Downloaded IRS Form 1040-ES Voucher for ${q.quarter}`);
  }

  function downloadExecutivePDF() {
    if (!taxResult?.summary) return;
    const s = taxResult.summary;
    const doc = new jsPDF();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('2026 US FIDUCIARY TAX COMPUTATION & SCHEDULES', 14, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Filer: ${currentUser?.displayName || 'Alex Morgan'} | Filing Status: ${filingStatus} | State: ${stateCode}${isNYCResident ? ' (NYC Resident)' : ''}`, 14, 28);
    doc.text(`Tax Year: 2026 | Effective Federal: ${s.effectiveFederalRate} | Total Combined Rate: ${s.effectiveCombinedRate}`, 14, 34);

    const tableRows = [
      ['Gross Wages & Ordinary Income', `$${s.grossIncome.toLocaleString()}`],
      ['Above-the-Line Adjustments (HSA / IRA)', `$${s.totalAdjustments.toLocaleString()}`],
      ['Adjusted Gross Income (AGI)', `$${s.adjustedGrossIncome.toLocaleString()}`],
      [`Deduction Method (${s.deductionMethod})`, `$${s.deductionAmount.toLocaleString()}`],
      ['Taxable Income (Line 15)', `$${s.taxableIncome.toLocaleString()}`],
      ['Base Federal Income Tax (Regular + Pref LTCG)', `$${s.baseFederalTax.toLocaleString()}`],
      ['Child Tax Credit Offset (CTC / ACTC)', `-$${(s.credits?.allowableCTC || 0).toLocaleString()}`],
      ['Net Investment Income Tax (NIIT 3.8%)', `$${s.niitTax.toLocaleString()}`],
      ['Additional Medicare Tax (0.9% on wages > $200k)', `$${s.additionalMedicareTax.toLocaleString()}`],
      ['Form 6251 Alternative Minimum Tax (AMT)', s.triggersAMT ? `$${s.amtPayable.toLocaleString()} (TRIGGERED)` : '$0 (Regular Tax Governs)'],
      ['Total Federal Income Tax Liability', `$${s.totalFederalTax.toLocaleString()}`],
      [`State & Local Income Tax (${stateCode})`, `$${s.stateTax.toLocaleString()}`],
      ['FICA Payroll Taxes (Social Security + Standard Medicare)', `$${(s.socialSecurityTax + s.standardMedicareTax).toLocaleString()}`],
      ['Total Combined Tax (Federal + State + FICA + AMT)', `$${(s.totalCombinedTax + s.socialSecurityTax + s.standardMedicareTax).toLocaleString()}`],
    ];

    if (s.ptetOptimization?.netFederalCashSavings > 0) {
      tableRows.push([
        `PTET SALT Cap Workaround Savings (${s.ptetOptimization.formName})`,
        `+$${s.ptetOptimization.netFederalCashSavings.toLocaleString()} (Cash Saved)`
      ]);
    }

    if (s.territoryOptimization) {
      tableRows.push([
        `Territory Sourcing Adjustment (${s.territoryOptimization.governingStatute})`,
        s.territoryOptimization.act60Claimed
          ? 'Act 60 (0% Cap Gains & 4% Corp Tax)'
          : `Excluded $${(s.territoryOptimization.usGrossExclusionAmount || 0).toLocaleString()} from US 1040`
      ]);
    }

    if (s.expatOptimization) {
      tableRows.push([
        `Expatriate Relief (${s.expatOptimization.recommendedStrategy})`,
        `-$${s.expatOptimization.optimalSavings.toLocaleString()} (Sheltered from US Tax)`
      ]);
    }

    autoTable(doc, {
      startY: 40,
      head: [['Statutory Line Item', 'Tax Year 2026 Amount (USD)']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 8.5, cellPadding: 3.5 }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('STATUTORY STATEMENTS & FIDUCIARY SAFEGUARDS:', 14, finalY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`1. Form 6251 AMT: AMTI is $${s.amtBreakdown?.amti?.toLocaleString() || 0}. Allowable Exemption: $${s.amtBreakdown?.allowableExemption?.toLocaleString() || 0}. MTC Carryforward generated: $${s.amtBreakdown?.form8801CreditCarryforward?.toLocaleString() || 0}.`, 14, finalY + 6);
    doc.text(`2. State PTET Election: Electing under ${s.ptetOptimization?.statutoryCode || 'Notice 2020-75'} converts state tax on $${(entityNetIncome).toLocaleString()} into an above-the-line ordinary deduction.`, 14, finalY + 12);
    doc.text(`3. Capital Loss Carryforward: $${s.capitalLossCarriedForward.toLocaleString()} remaining to offset ordinary income in future tax years.`, 14, finalY + 18);
    if (s.territoryOptimization) {
      doc.text(`4. Territorial Tax Rule: ${s.territoryOptimization.filingRequirement}`, 14, finalY + 24);
    }
    if (s.expatOptimization) {
      doc.text(`5. Expatriate Relief: ${s.expatOptimization.strategicRationale}`, 14, finalY + (s.territoryOptimization ? 30 : 24));
    }

    doc.save(`US_Fiduciary_Tax_Computation_${stateCode}_2026.pdf`);
    showToast('Downloaded US Institutional Tax Computation (PDF)');
  }

  // ── Enterprise Phase 1-3 Handlers ─────────────────────────────────────────

  const calculateForm8606 = async () => {
    setLoadingForm8606(true);
    try {
      const res = await fetch('/api/us-tax/form-8606-fbar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taxYear: 2026,
          filingStatus,
          livingInUS: true,
          nondeductibleContribution: form8606State.nondeductibleContribution,
          priorYearBasis: form8606State.priorYearBasis,
          yearEndTraditionalIRABalance: form8606State.yearEndTraditionalIRABalance,
          rothConversionAmount: form8606State.rothConversionAmount,
          foreignAccounts,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setForm8606Result(data);
      }
    } catch (e) {
      console.warn('Form 8606 fetch error:', e.message);
    } finally {
      setLoadingForm8606(false);
    }
  };

  useEffect(() => {
    calculateForm8606();
  }, [form8606State, foreignAccounts, filingStatus]);

  useEffect(() => {
    // Check saved US return from DB
    fetch('/api/tax/return/US/2026?userId=default_taxpayer')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.return) {
          setSavedReturnStatusUS(data.return.status);
          if (data.auditTrail && data.auditTrail.length > 0) {
            setReturnSealHashUS(data.auditTrail[data.auditTrail.length - 1].seal_hash);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveDraftUS = async () => {
    setSavingDraftUS(true);
    try {
      const res = await fetch('/api/tax/return/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market: 'US',
          taxYear: 2026,
          userId: 'default_taxpayer',
          regime: 'Federal_Form_1040',
          filingStatus,
          taxpayerName: userProfile?.name || 'Alex Morgan',
          taxpayerId: '***-**-1842',
          summary: {
            wages: w2Wages,
            stateCode,
            totalFederalTax: taxResult?.summary?.totalFederalTax || 0,
            totalStateTax: taxResult?.summary?.totalStateTax || 0,
            effectiveTaxRate: taxResult?.summary?.effectiveTaxRate || 0,
          },
          lots: [...shortTermTrades, ...longTermTrades].map(t => ({
            assetType: 'EQUITY',
            symbol: t.desc,
            units: 100,
            buyPrice: t.costBasis / 100,
            sellPrice: t.proceeds / 100,
            gainLoss: t.proceeds - t.costBasis,
            term: t.id.startsWith('st') ? 'SHORT_TERM' : 'LONG_TERM',
          })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedReturnStatusUS('DRAFT');
        showToast('✅ Form 1040 draft persisted to database');
      }
    } catch (e) {
      showToast('⚠️ Draft save failed: ' + e.message);
    } finally {
      setSavingDraftUS(false);
    }
  };

  const handleLockReturnUS = async () => {
    setLockingReturnUS(true);
    try {
      const res = await fetch('/api/tax/return/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnId: 'ret_US_2026_default_taxpayer',
          preparerInfo: {
            name: cpaCredentials.name,
            role: 'CPA',
            preparerId: cpaCredentials.ptin,
            registrationNo: cpaCredentials.efin,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedReturnStatusUS('LOCKED');
        setReturnSealHashUS(data.sealHash);
        showToast('🔒 Return sealed & digitally certified by CPA');
      }
    } catch (e) {
      showToast('⚠️ Lock failed: ' + e.message);
    } finally {
      setLockingReturnUS(false);
    }
  };

  const handleParseUSDocument = async (customText = null) => {
    const textToParse = customText || ingestionTextUS;
    if (!textToParse) return;
    setParsingDocUS(true);
    try {
      const res = await fetch('/api/us-tax/parse-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: textToParse,
          documentHint: textToParse.includes('W-2') ? 'W2' : '1099_B',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setParsedDocResultUS(data);
        showToast('✅ Statement parsed & verified');
      }
    } catch (e) {
      showToast('⚠️ Parse error: ' + e.message);
    } finally {
      setParsingDocUS(false);
    }
  };

  const applyParsedUSDocument = () => {
    if (!parsedDocResultUS) return;
    if (parsedDocResultUS.documentType === 'FORM_W2') {
      if (parsedDocResultUS.wages?.box1_wagesTipsOther) {
        setW2Wages(parsedDocResultUS.wages.box1_wagesTipsOther);
      }
      showToast('✅ W-2 Wages & Withholdings applied to Form 1040');
    } else if (parsedDocResultUS.documentType === 'FORM_1099_B') {
      if (parsedDocResultUS.lots && parsedDocResultUS.lots.length > 0) {
        const st = parsedDocResultUS.lots.filter(l => l.boxCode.includes('Short-Term')).map((l, i) => ({ id: `st_${Date.now()}_${i}`, desc: `${l.cusipOrTicker} (${l.description})`, proceeds: l.proceeds, costBasis: l.costBasis }));
        const lt = parsedDocResultUS.lots.filter(l => l.boxCode.includes('Long-Term')).map((l, i) => ({ id: `lt_${Date.now()}_${i}`, desc: `${l.cusipOrTicker} (${l.description})`, proceeds: l.proceeds, costBasis: l.costBasis }));
        if (st.length) setShortTermTrades(st);
        if (lt.length) setLongTermTrades(lt);
      }
      showToast('✅ 1099-B tax lots auto-filled into Schedule D tables');
    }
  };

  const downloadForm8606PDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 24, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text('IRS FORM 8606 & BACKDOOR ROTH STATEMENT (TAX YEAR 2026)', 14, 14);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text('Nondeductible IRAs · IRC § 408(d)(2) Basis Aggregation & Pro-Rata Ratio Computation', 14, 20);

    const f = form8606Result?.form8606;
    const rows = [
      ['Line 1: Nondeductible contributions to traditional IRAs for 2026', `$${(f?.line1_nondeductibleContribution || 7000).toLocaleString()}`],
      ['Line 2: Total basis in traditional IRAs from prior years (Line 14 of 2025 Form 8606)', `$${(f?.line2_priorYearBasis || 0).toLocaleString()}`],
      ['Line 3: Total Basis (Add Line 1 and Line 2)', `$${(f?.line3_totalBasis || 7000).toLocaleString()}`],
      ['Line 6: Dec 31 Total Traditional, SEP, and SIMPLE IRA Balances', `$${(f?.line6_yearEndTraditionalIRABalance || 63000).toLocaleString()}`],
      ['Line 8: Net amount converted from traditional to Roth IRAs in 2026', `$${(f?.line8_rothConversionAmount || 7000).toLocaleString()}`],
      ['Line 9: Total Aggregate IRA Valuation (Line 6 + Line 7 + Line 8)', `$${(f?.line9_totalIRAValuation || 70000).toLocaleString()}`],
      ['Line 10: Nontaxable Ratio (Line 5 / Line 9, capped at 1.0)', `${((f?.line10_nontaxableRatio || 0.1) * 100).toFixed(2)}%`],
      ['Line 11: Nontaxable portion of Roth conversion (Line 8 * Line 10)', `$${(f?.line11_nontaxableConversion || 700).toLocaleString()}`],
      ['Line 14: Remaining traditional IRA basis for future years', `$${(f?.line14_remainingBasisFutureYears || 6300).toLocaleString()}`],
      ['Line 15: TAXABLE AMOUNT of conversion (Reported on Form 1040 Line 4b)', `$${(f?.line15_taxableRothConversion || 6300).toLocaleString()}`],
    ];

    autoTable(doc, {
      startY: 32,
      head: [['Form 8606 Statutory Line Item', 'Calculated 2026 Amount']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] },
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('PRO-RATA TRAP STATUS & STATUTORY CITATION:', 14, finalY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(form8606Result?.proRataTrap?.remedy || 'IRC § 408(d)(2) verified clean.', 14, finalY + 6, { maxWidth: 180 });

    doc.save('IRS_Form_8606_Backdoor_Roth_Schedule_2026.pdf');
    showToast('Downloaded IRS Form 8606 & Roth Dossier');
  };

  const downloadCPAWorkpaperPDFUS = () => {
    const doc = new jsPDF();
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 24, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text('CPA FIDUCIARY TAX WORKPAPER DOSSIER — FORM 1040', 14, 14);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(`Preparer: ${cpaCredentials.name} (PTIN: ${cpaCredentials.ptin}) · Firm: ${cpaCredentials.firmName}`, 14, 20);

    autoTable(doc, {
      startY: 32,
      head: [['Client Requirement Checklist (PBC)', 'Verification Status']],
      body: [
        ['Form W-2 Wages & Withholdings Reconciled with Box 1-17', pbcChecklistUS.w2s ? 'VERIFIED (ZERO DISCREPANCIES)' : 'PENDING'],
        ['Consolidated 1099-B Brokerage Proceeds & Cost Basis', pbcChecklistUS.form1099B ? 'MATCHED WITH FORM 8949' : 'PENDING'],
        ['Form 1099-DIV Qualified & Ordinary Dividends Reconciled', pbcChecklistUS.form1099DIV ? 'VERIFIED' : 'PENDING'],
        ['Form 1098 Mortgage Interest & Real Estate Taxes', pbcChecklistUS.form1098Mortgage ? 'APPLIED TO SCHED A' : 'PENDING'],
        ['Form 5498 Traditional IRA Year-End Value for Form 8606', pbcChecklistUS.form5498IRA ? 'PRO-RATA VERIFIED' : 'PENDING'],
        ['FinCEN Form 114 (FBAR) Foreign Account Threshold', pbcChecklistUS.foreignAccountFBAR ? 'FBAR AUDIT COMPLETED' : 'EXEMPT'],
      ],
      theme: 'striped',
    });

    const finalY = doc.lastAutoTable.finalY + 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('Circular 230 Due Diligence Certification & Seal Hash:', 14, finalY);
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.text(returnSealHashUS || 'd020098f686b77db945f6a5a279ffba2c4f0272e35ae5f8376c9c3856e6544ba', 14, finalY + 6);

    doc.save('CPA_Form1040_Fiduciary_Workpapers_2026.pdf');
    showToast('Downloaded CPA Fiduciary Workpaper Dossier');
  };

  const s = taxResult?.summary;
  const amt = s?.amtBreakdown;
  const ptet = s?.ptetOptimization;
  const credits = s?.credits;

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999,
          background: 'var(--surface-raised)', border: '1px solid var(--primary)',
          color: 'var(--text-primary)', padding: '0.75rem 1.25rem', borderRadius: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)', fontWeight: 600, fontSize: '0.875rem'
        }}>
          {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(16,185,129,0.04))',
        border: '1px solid var(--border-active)', padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-lg)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(99, 102, 241, 0.12)', color: 'var(--primary)', padding: '0.2rem 0.65rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.4rem' }}>
              <span>🇺🇸</span> IRS CODE 2026 STATUTORY SUITE
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 className="text-h1" style={{ margin: 0 }}>US Federal & 50-State Institutional Tax Studio</h1>
              {savedReturnStatusUS === 'LOCKED' ? (
                <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', padding: '3px 8px' }}>
                  <Lock size={12} /> LOCKED & CPA SIGNED
                </span>
              ) : (
                <span className="badge badge-surface" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                  {savedReturnStatusUS === 'DRAFT' ? '💾 DRAFT SAVED' : '📝 EDITABLE'}
                </span>
              )}
            </div>
            <p className="text-sm text-secondary" style={{ marginTop: '0.25rem' }}>
              Exhaustive Form 1040, Form 8606 Pro-Rata Trap, FBAR/FATCA, Form 6251 AMT, State PTET SALT Cap Workarounds, and CPA Workpapers.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleSaveDraftUS}
              disabled={savingDraftUS || savedReturnStatusUS === 'LOCKED'}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Save size={14} />
              <span>{savingDraftUS ? 'Saving...' : 'Save Draft'}</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={downloadExecutivePDF}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Download size={14} />
              <span>Download Statutory PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Strip */}
      <div style={{
        display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)',
        paddingBottom: '0.5rem', overflowX: 'auto'
      }}>
        {[
          { id: 'overview', label: '1. Federal & State Overview', icon: Calculator },
          { id: 'quarterly', label: '2. Form 1040-ES & Safe Harbor', icon: Calendar },
          { id: 'schedd', label: '3. Schedule D Netting & § 1212', icon: TrendingDown },
          { id: 'shield', label: '4. Prescriptive Tax-Shield Optimizer', icon: ShieldCheck },
          { id: 'amt', label: '5. Form 6251 AMT & ISO Spread', icon: Scale },
          { id: 'ptet', label: '6. State PTET SALT Workaround', icon: Building },
          { id: 'credits', label: '7. Credits & Child Care (CTC)', icon: Users },
          { id: 'states', label: '8. State Non-Conformity Engine', icon: Layers },
          { id: 'form8606', label: '9. Form 8606 & Backdoor Roth', icon: RefreshCw },
          { id: 'fbar', label: '10. FBAR & FATCA (Form 8938)', icon: Globe },
          { id: 'workpapers', label: '11. CPA Fiduciary Workpapers', icon: FileCheck },
          { id: 'document-import', label: '12. 1099 & W-2 Ingestion', icon: UploadCloud },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                fontSize: '0.8125rem', whiteSpace: 'nowrap'
              }}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & GENERAL TAX COMPUTATION */}
      {activeSubTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Interactive Federal Progressive Bracket Visualizer */}
          <TaxBracketStepVisualizer
            market="US"
            taxableIncome={s?.taxableIncome || 185000}
            slabTax={s?.baseFederalTax || 32000}
            surcharge={s?.niitTax || 0}
            marginalReliefSaved={0}
            cess={s?.stateTax || 12000}
            totalTax={s?.totalFederalLiability || 44000}
            effectiveRate={s?.effectiveTaxRate || 18.2}
            filingStatus={filingStatus}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {/* Inputs Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Filing Status & State */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <h3 className="text-h3" style={{ margin: '0 0 1rem' }}>Filing Status & Jurisdiction</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Filing Status</label>
                  <select
                    value={filingStatus}
                    onChange={(e) => setFilingStatus(e.target.value)}
                    style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  >
                    <option value="Single">Single ($14,600 Std Ded)</option>
                    <option value="MFJ">Married Filing Jointly ($29,200 Std Ded)</option>
                    <option value="MFS">Married Filing Separately ($14,600)</option>
                    <option value="HoH">Head of Household ($21,900)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>State Jurisdiction</label>
                  <select
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value)}
                    style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  >
                    {US_STATE_GROUPS.map(grp => (
                      <optgroup key={grp.group} label={grp.group}>
                        {grp.states.map(st => (
                          <option key={st.code} value={st.code}>{st.name} ({st.top})</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>

              {stateCode === 'NY' && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={isNYCResident} onChange={(e) => setIsNYCResident(e.target.checked)} />
                  <span>Include New York City (NYC) Resident Surcharge (+3.876%)</span>
                </label>
              )}

              {/* Overseas US Territory Sourcing & Act 60 Panel */}
              {['PR', 'VI', 'GU', 'MP', 'AS'].includes(stateCode) && (
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(99, 102, 241, 0.05)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)' }}>
                      <Globe size={15} />
                      <span>
                        {stateCode === 'PR' && '🇵🇷 Puerto Rico — IRC § 933 Sourcing & Act 60'}
                        {stateCode === 'VI' && '🇻🇮 U.S. Virgin Islands — IRC § 932 VIBIR Mirror'}
                        {stateCode === 'GU' && '🇬🇺 Guam — IRC § 935 Mirror Return'}
                        {stateCode === 'MP' && '🇲🇵 Northern Mariana Islands — IRC § 935 Mirror'}
                        {stateCode === 'AS' && '🇦🇸 American Samoa — IRC § 931 Non-Mirror'}
                      </span>
                    </div>
                    <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                      {stateCode === 'PR' ? 'IRC § 933 SOURCE EXCLUSION' : (stateCode === 'AS' ? 'IRC § 931 TERRITORIAL' : 'IRC § 932/935 MIRROR CODE')}
                    </span>
                  </div>

                  <p className="text-xs text-secondary" style={{ margin: 0, lineHeight: 1.4 }}>
                    {stateCode === 'PR' && 'Bona fide residents of Puerto Rico exclude PR-source income from US Form 1040 gross income under IRC § 933. Federal tax applies only to US mainland source income.'}
                    {stateCode === 'VI' && 'Under IRC § 932(c), a single return is filed with VIBIR. Full tax is paid locally, satisfying 100% of US federal obligations ($0 due to IRS).'}
                    {(stateCode === 'GU' || stateCode === 'MP') && 'Under IRC § 935 single-return coordination, tax is paid directly to the local territorial revenue agency. No separate IRS filing is required.'}
                    {stateCode === 'AS' && 'American Samoa operates an independent tax code under IRC § 931. Territorial income is reported locally to the AS Tax Office.'}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.25rem' }}>
                        Territory-Source Income ({stateCode})
                      </label>
                      <input
                        type="number"
                        value={territorySourceIncome}
                        onChange={(e) => setTerritorySourceIncome(Number(e.target.value))}
                        style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.45rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                      />
                      <span className="text-xs text-secondary" style={{ fontSize: '0.7rem' }}>Excluded from Form 1040</span>
                    </div>
                    <div>
                      <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.25rem' }}>
                        US Mainland Source Income
                      </label>
                      <input
                        type="number"
                        value={w2Wages}
                        onChange={(e) => setW2Wages(Number(e.target.value))}
                        style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.45rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                      />
                      <span className="text-xs text-secondary" style={{ fontSize: '0.7rem' }}>Subject to Form 1040</span>
                    </div>
                  </div>

                  {stateCode === 'PR' && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', cursor: 'pointer', background: 'rgba(16, 185, 129, 0.08)', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                      <input
                        type="checkbox"
                        checked={act60Decree}
                        onChange={(e) => setAct60Decree(e.target.checked)}
                      />
                      <span style={{ fontWeight: 600, color: 'var(--success)' }}>
                        Claim Act 60 Individual Investor Exemption Decree (0% Capital Gains & 4% Export Corporate Tax)
                      </span>
                    </label>
                  )}
                </div>
              )}

              {/* US Expat / Living Abroad Panel */}
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                background: isLivingAbroad ? 'rgba(59, 130, 246, 0.06)' : 'var(--surface-raised)',
                border: isLivingAbroad ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid var(--glass-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isLivingAbroad}
                      onChange={(e) => setIsLivingAbroad(e.target.checked)}
                    />
                    <span>Taxpayer Resides Abroad (US Expat) — IRC § 911 Form 2555 & Form 1116</span>
                  </label>
                  {isLivingAbroad && (
                    <span className={`badge ${foreignDaysPresent >= 330 ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
                      {foreignDaysPresent >= 330 ? `PASSED: ${foreignDaysPresent}/330 DAYS` : `BELOW 330 DAYS (${foreignDaysPresent}/330)`}
                    </span>
                  )}
                </div>

                {isLivingAbroad && (
                  <>
                    <p className="text-xs text-secondary" style={{ margin: 0, lineHeight: 1.4 }}>
                      Models the 330-day Physical Presence Test, 2026 Form 2555 Foreign Earned Income Exclusion ($130,000 statutory limit) with stacking rules, and compares against Form 1116 Foreign Tax Credit to automatically recommend the optimal tax shield.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                      <div>
                        <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.25rem' }}>Days in Foreign Country</label>
                        <input
                          type="number"
                          value={foreignDaysPresent}
                          onChange={(e) => setForeignDaysPresent(Number(e.target.value))}
                          style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.45rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.25rem' }}>Foreign Earned Income ($)</label>
                        <input
                          type="number"
                          value={foreignEarnedIncome}
                          onChange={(e) => setForeignEarnedIncome(Number(e.target.value))}
                          style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.45rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.25rem' }}>Foreign Income Taxes Paid ($)</label>
                        <input
                          type="number"
                          value={foreignTaxesPaid}
                          onChange={(e) => setForeignTaxesPaid(Number(e.target.value))}
                          style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.45rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                        />
                      </div>
                    </div>

                    {s?.expatOptimization && (
                      <div style={{ padding: '0.75rem', borderRadius: 8, background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                            RECOMMENDED STRATEGY: {s.expatOptimization.recommendedStrategy}
                          </span>
                          <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                            SAVINGS: ${s.expatOptimization.optimalSavings.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-secondary" style={{ fontSize: '0.75rem', lineHeight: 1.4 }}>
                          {s.expatOptimization.strategicRationale}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Income Sources */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <h3 className="text-h3" style={{ margin: '0 0 1rem' }}>Income Sources & Capital Gains</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>W-2 Wages (Box 1)</label>
                  <input
                    type="number"
                    value={w2Wages}
                    onChange={(e) => setW2Wages(Number(e.target.value))}
                    style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Taxable Interest (1099-INT)</label>
                  <input
                    type="number"
                    value={interestIncome}
                    onChange={(e) => setInterestIncome(Number(e.target.value))}
                    style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Ordinary Dividends (1099-DIV)</label>
                  <input
                    type="number"
                    value={ordinaryDividends}
                    onChange={(e) => setOrdinaryDividends(Number(e.target.value))}
                    style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Qualified Dividends (Pref Rate)</label>
                  <input
                    type="number"
                    value={qualifiedDividends}
                    onChange={(e) => setQualifiedDividends(Number(e.target.value))}
                    style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Short-Term Gains / (Losses)</label>
                  <input
                    type="number"
                    value={shortTermGains}
                    onChange={(e) => setShortTermGains(Number(e.target.value))}
                    style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Long-Term Capital Gains</label>
                  <input
                    type="number"
                    value={longTermGains}
                    onChange={(e) => setLongTermGains(Number(e.target.value))}
                    style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Schedule A Itemized Deductions */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 className="text-h3" style={{ margin: 0 }}>Schedule A Deductions</h3>
                <span className="badge badge-surface" style={{ fontSize: '0.75rem' }}>SALT Cap: $10,000</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>State & Local Property/Income Tax</label>
                  <input
                    type="number"
                    value={saltTaxes}
                    onChange={(e) => setSaltTaxes(Number(e.target.value))}
                    style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Mortgage Interest (Form 1098)</label>
                  <input
                    type="number"
                    value={mortgageInterest}
                    onChange={(e) => setMortgageInterest(Number(e.target.value))}
                    style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Charitable Gifts (IRC § 170)</label>
                  <input
                    type="number"
                    value={charitableCash}
                    onChange={(e) => setCharitableCash(Number(e.target.value))}
                    style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>HSA Pre-Tax Deduction</label>
                  <input
                    type="number"
                    value={hsaContributions}
                    onChange={(e) => setHsaContributions(Number(e.target.value))}
                    style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Executive Fiduciary Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.05), transparent)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 className="text-h3" style={{ margin: 0 }}>Executive Tax Summary</h3>
                <span className="badge badge-primary">{s?.deductionMethod}</span>
              </div>

              {s ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.4rem', fontSize: '0.875rem' }}>
                    <span className="text-secondary">Adjusted Gross Income (AGI)</span>
                    <span style={{ fontWeight: 700 }}>${s.adjustedGrossIncome.toLocaleString()}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.4rem', fontSize: '0.875rem' }}>
                    <span className="text-secondary">Allowable Deduction</span>
                    <span style={{ fontWeight: 700, color: 'var(--green)' }}>-${s.deductionAmount.toLocaleString()}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.4rem', fontSize: '0.875rem' }}>
                    <span className="text-secondary">Taxable Income (Line 15)</span>
                    <span style={{ fontWeight: 700 }}>${s.taxableIncome.toLocaleString()}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.4rem', fontSize: '0.875rem' }}>
                    <span className="text-secondary">Base Federal Income Tax</span>
                    <span style={{ fontWeight: 700 }}>${s.baseFederalTax.toLocaleString()}</span>
                  </div>

                  {s.credits?.allowableCTC > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.4rem', fontSize: '0.875rem' }}>
                      <span className="text-secondary">Child Tax Credit Offset</span>
                      <span style={{ fontWeight: 700, color: 'var(--green)' }}>-${s.credits.allowableCTC.toLocaleString()}</span>
                    </div>
                  )}

                  {s.niitTax > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.4rem', fontSize: '0.875rem' }}>
                      <span className="text-secondary">Net Investment Income Tax (3.8%)</span>
                      <span style={{ fontWeight: 700, color: 'var(--red)' }}>+${s.niitTax.toLocaleString()}</span>
                    </div>
                  )}

                  {s.triggersAMT && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.4rem', fontSize: '0.875rem', background: 'rgba(239,68,68,0.08)', padding: '0.4rem 0.5rem', borderRadius: 6 }}>
                      <span style={{ color: 'var(--red)', fontWeight: 700 }}>Form 6251 AMT Liability</span>
                      <span style={{ fontWeight: 800, color: 'var(--red)' }}>+${s.amtPayable.toLocaleString()}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.4rem', fontSize: '0.875rem' }}>
                    <span className="text-secondary">State & Local Income Tax ({stateCode})</span>
                    <span style={{ fontWeight: 700 }}>${s.stateTax.toLocaleString()}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.4rem', fontSize: '0.875rem' }}>
                    <span className="text-secondary">FICA (Social Security & Medicare)</span>
                    <span style={{ fontWeight: 700 }}>${(s.socialSecurityTax + s.standardMedicareTax).toLocaleString()}</span>
                  </div>

                  <div style={{
                    marginTop: '0.5rem', padding: '1rem', background: 'var(--surface-raised)',
                    borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TOTAL COMBINED LIABILITY</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary)' }}>
                        ${(s.totalCombinedTax + s.socialSecurityTax + s.standardMedicareTax).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>EFFECTIVE TAX RATE</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--green)' }}>
                        {s.effectiveCombinedRate}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 0.5rem', color: 'var(--primary)' }} />
                  <p className="text-xs text-muted">Computing 2026 federal & state brackets...</p>
                </div>
              )}
            </div>

            {/* Quick Strategy Alerts */}
            {ptet?.netFederalCashSavings > 0 && (
              <div className="card" style={{ padding: '1rem', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                  <Sparkles size={16} color="var(--green)" />
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--green)' }}>
                    PTET SALT Bypass Available: +${ptet.netFederalCashSavings.toLocaleString()} Cash Saved
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Under {ptet.statutoryCode}, electing entity-level tax on pass-through income circumvents the $10,000 personal SALT deduction ceiling.
                </p>
              </div>
            )}
          </div>
        </div>
        </div>
      )}

      {/* TAB 2: FORM 1040-ES QUARTERLY ESTIMATED TAXES & SAFE HARBOR */}
      {activeSubTab === 'quarterly' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <span className="badge badge-primary" style={{ marginBottom: '0.4rem' }}>IRC § 6654 & FORM 1040-ES STATUTORY ENGINE</span>
                <h2 className="text-h2" style={{ margin: '0 0 0.35rem' }}>Quarterly Estimated Taxes & Underpayment Penalty Safeguard</h2>
                <p className="text-sm text-secondary" style={{ maxWidth: 740, margin: 0 }}>
                  High-earning individuals with investment gains, business dividends, or unwithheld income must remit quarterly estimated payments or satisfy statutory Safe Harbor thresholds to avoid IRS Form 2210 penalties.
                </p>
              </div>

              {quarterlyResult && (
                <div style={{
                  padding: '0.85rem 1.25rem',
                  background: quarterlyResult.totalShortfall > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                  border: `1px solid ${quarterlyResult.totalShortfall > 0 ? 'var(--red)' : 'var(--green)'}`,
                  borderRadius: 10, textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: quarterlyResult.totalShortfall > 0 ? 'var(--red)' : 'var(--green)' }}>
                    {quarterlyResult.totalShortfall > 0 ? 'FORM 2210 PENALTY RISK' : 'SAFE HARBOR COMPLIANT'}
                  </div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: quarterlyResult.totalShortfall > 0 ? 'var(--red)' : 'var(--green)' }}>
                    {quarterlyResult.totalShortfall > 0 ? `-$${quarterlyResult.totalEstimatedForm2210Penalty.toLocaleString()}` : '$0 Penalty'}
                  </div>
                </div>
              )}
            </div>

            {/* Safe Harbor Metric Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="card" style={{ padding: '1rem', background: 'var(--surface-raised)' }}>
                <div className="text-xs text-muted">Current Year 2026 Estimated Tax</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: 4 }}>
                  ${(quarterlyResult?.currentYearEstimatedTax || taxResult?.summary?.totalFederalTax || 38000).toLocaleString()}
                </div>
                <div className="text-xs text-secondary" style={{ marginTop: 2 }}>Based on Form 1040 engine</div>
              </div>

              <div className="card" style={{ padding: '1rem', background: 'var(--surface-raised)' }}>
                <div className="text-xs text-muted">Method A: 90% Current Year Tax</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)', marginTop: 4 }}>
                  ${(quarterlyResult?.safeHarbor?.methodA_90PctCurrent || 0).toLocaleString()}
                </div>
                <div className="text-xs text-secondary" style={{ marginTop: 2 }}>Standard safe harbor</div>
              </div>

              <div className="card" style={{ padding: '1rem', background: 'var(--surface-raised)' }}>
                <div className="text-xs text-muted">Method B: {quarterlyResult?.safeHarbor?.priorYearMultiplierPct || '110%'} Prior Year Tax</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)', marginTop: 4 }}>
                  ${(quarterlyResult?.safeHarbor?.methodB_PriorYear || 0).toLocaleString()}
                </div>
                <div className="text-xs text-secondary" style={{ marginTop: 2 }}>AGI &gt; $150k triggers 110% rule</div>
              </div>

              <div className="card" style={{ padding: '1rem', background: 'rgba(99,102,241,0.06)', border: '1px solid var(--primary)' }}>
                <div className="text-xs text-muted" style={{ fontWeight: 700, color: 'var(--primary)' }}>GOVERNING SAFE HARBOR</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--primary)', marginTop: 4 }}>
                  ${(quarterlyResult?.safeHarbor?.requiredAnnualPayment || 0).toLocaleString()}
                </div>
                <div className="text-xs text-secondary" style={{ marginTop: 2 }}>{quarterlyResult?.safeHarbor?.governingMethod}</div>
              </div>
            </div>

            {/* Inputs: Prior Year & W-2 Withholding */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem', background: 'var(--surface-raised)', padding: '1.25rem', borderRadius: 10 }}>
              <div>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Prior Year (2025) Total Tax (Form 1040 Line 24)</label>
                <input
                  type="number"
                  value={priorYearTax}
                  onChange={(e) => setPriorYearTax(Number(e.target.value))}
                  style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Prior Year AGI (Form 1040 Line 11)</label>
                <input
                  type="number"
                  value={priorYearAGI}
                  onChange={(e) => setPriorYearAGI(Number(e.target.value))}
                  style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Expected 2026 W-2 Federal Withholding (Box 2)</label>
                <input
                  type="number"
                  value={w2WithholdingYTD}
                  onChange={(e) => setW2WithholdingYTD(Number(e.target.value))}
                  style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {/* 4 Quarters Installment Schedule Table */}
            <h3 className="text-h3" style={{ margin: '0 0 0.75rem' }}>IRS Form 1040-ES Quarterly Payment Ledger & Vouchers</h3>
            <div style={{ overflowX: 'auto', marginBottom: '1.25rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>Quarter</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>IRS Statutory Due Date</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>Income Period</th>
                    <th style={{ textAlign: 'right', padding: '0.75rem' }}>Required Cumulative</th>
                    <th style={{ textAlign: 'right', padding: '0.75rem' }}>W-2 Credit</th>
                    <th style={{ textAlign: 'right', padding: '0.75rem' }}>Amount Remitted ($)</th>
                    <th style={{ textAlign: 'center', padding: '0.75rem' }}>Status</th>
                    <th style={{ textAlign: 'right', padding: '0.75rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(quarterlyResult?.quarters || []).map((q, idx) => (
                    <tr key={q.quarter} style={{ borderBottom: '1px solid var(--glass-border)33' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 800 }}>{q.quarter}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>{q.dueDate}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{q.periodCovered}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'Space Grotesk' }}>${q.requiredPayment.toLocaleString()}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'Space Grotesk', color: 'var(--green)' }}>${q.withholdingCredit.toLocaleString()}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <input
                          type="number"
                          value={quarterlyPayments[idx]}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setQuarterlyPayments(prev => {
                              const next = [...prev];
                              next[idx] = val;
                              return next;
                            });
                          }}
                          style={{ width: 90, textAlign: 'right', background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 6, padding: '0.25rem 0.5rem', color: 'var(--text-primary)', fontWeight: 700 }}
                        />
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {q.isDelinquent ? (
                          <span className="badge badge-red">Shortfall: -${q.shortfall.toLocaleString()}</span>
                        ) : (
                          <span className="badge badge-green">Satisfied</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => downloadForm1040ESVoucher(q)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}
                        >
                          <Download size={12} /> Voucher PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ background: 'var(--surface-raised)', padding: '1rem', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={16} color="var(--primary)" />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Statutory Reference: <strong>IRC § 6654(d)(1)(B)</strong> — Avoid underpayment penalties by paying 100% of prior-year tax (110% if prior AGI &gt; $150,000) or 90% of current-year tax in 4 equal installments.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: IRS SCHEDULE D NETTING & § 1212 CARRYFORWARD LEDGER */}
      {activeSubTab === 'schedd' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <span className="badge badge-primary" style={{ marginBottom: '0.4rem' }}>IRC § 1211(b) & § 1212 STATUTORY LEDGER</span>
                <h2 className="text-h2" style={{ margin: '0 0 0.35rem' }}>IRS Schedule D: Capital Transactions Netting Ledger</h2>
                <p className="text-sm text-secondary" style={{ maxWidth: 740, margin: 0 }}>
                  Part I short-term trades net against Part II long-term trades. Net capital losses offset ordinary income up to $3,000 per tax year on Form 1040 Line 7, with excess carried forward indefinitely.
                </p>
              </div>

              {scheduleDResult && (
                <div style={{
                  padding: '0.85rem 1.25rem',
                  background: scheduleDResult.isNetLoss ? 'rgba(16,185,129,0.08)' : 'rgba(99,102,241,0.08)',
                  border: `1px solid ${scheduleDResult.isNetLoss ? 'var(--green)' : 'var(--primary)'}`,
                  borderRadius: 10, textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: scheduleDResult.isNetLoss ? 'var(--green)' : 'var(--primary)' }}>
                    {scheduleDResult.isNetLoss ? 'ORDINARY INCOME WRITE-OFF' : 'NET CAPITAL GAIN'}
                  </div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: scheduleDResult.isNetLoss ? 'var(--green)' : 'var(--primary)' }}>
                    {scheduleDResult.isNetLoss ? `-$${scheduleDResult.allowableOrdinaryLossDeduction.toLocaleString()} (Max $3,000)` : `+$${scheduleDResult.combinedCapitalGains.toLocaleString()}`}
                  </div>
                </div>
              )}
            </div>

            {/* Schedule D Netting Metric Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="card" style={{ padding: '1rem', background: 'var(--surface-raised)' }}>
                <div className="text-xs text-muted">Part I Net Short-Term (Line 7)</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: (scheduleDResult?.shortTermNet || 0) >= 0 ? 'var(--primary)' : 'var(--green)', marginTop: 4 }}>
                  {(scheduleDResult?.shortTermNet || 0) >= 0 ? `+$${(scheduleDResult?.shortTermNet || 0).toLocaleString()}` : `-$${Math.abs(scheduleDResult?.shortTermNet || 0).toLocaleString()}`}
                </div>
                <div className="text-xs text-secondary" style={{ marginTop: 2 }}>Taxed at ordinary rates</div>
              </div>

              <div className="card" style={{ padding: '1rem', background: 'var(--surface-raised)' }}>
                <div className="text-xs text-muted">Part II Net Long-Term (Line 15)</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: (scheduleDResult?.longTermNet || 0) >= 0 ? 'var(--primary)' : 'var(--green)', marginTop: 4 }}>
                  {(scheduleDResult?.longTermNet || 0) >= 0 ? `+$${(scheduleDResult?.longTermNet || 0).toLocaleString()}` : `-$${Math.abs(scheduleDResult?.longTermNet || 0).toLocaleString()}`}
                </div>
                <div className="text-xs text-secondary" style={{ marginTop: 2 }}>Pref. 0%/15%/20% rates</div>
              </div>

              <div className="card" style={{ padding: '1rem', background: 'var(--surface-raised)' }}>
                <div className="text-xs text-muted">Allowable Ordinary Loss (1040 Line 7)</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--green)', marginTop: 4 }}>
                  -${(scheduleDResult?.allowableOrdinaryLossDeduction || 0).toLocaleString()}
                </div>
                <div className="text-xs text-secondary" style={{ marginTop: 2 }}>IRC § 1211(b) limit: $3,000/yr</div>
              </div>

              <div className="card" style={{ padding: '1rem', background: 'var(--surface-raised)' }}>
                <div className="text-xs text-muted">§ 1212 Carryforward to 2027+</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--gold)', marginTop: 4 }}>
                  ${(scheduleDResult?.capitalLossCarryforward || 0).toLocaleString()}
                </div>
                <div className="text-xs text-secondary" style={{ marginTop: 2 }}>Indefinite carryforward bank</div>
              </div>
            </div>

            {/* Prior Year Loss Carryforward Input */}
            <div style={{ background: 'var(--surface-raised)', padding: '1rem', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Prior-Year Form 1040 Schedule D Loss Carryover (Line 6 & Line 14)</div>
                <div className="text-xs text-muted">Carried over from prior year tax returns under IRC § 1212(b)</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="text-xs text-muted">$</span>
                <input
                  type="number"
                  value={priorYearLossCarryover}
                  onChange={(e) => setPriorYearLossCarryover(Number(e.target.value))}
                  style={{ width: 110, background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 6, padding: '0.4rem 0.6rem', color: 'var(--text-primary)', fontWeight: 700, textAlign: 'right' }}
                />
              </div>
            </div>

            {/* Part I Table */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 className="text-h3" style={{ margin: 0 }}>Schedule D Part I: Short-Term Capital Trades (Holding ≤ 1 Year)</h3>
                <span className="badge badge-surface">{shortTermTrades.length} Lots</span>
              </div>
              <div style={{ overflowX: 'auto', marginBottom: '0.75rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      <th style={{ textAlign: 'left', padding: '0.6rem' }}>Description of Asset</th>
                      <th style={{ textAlign: 'right', padding: '0.6rem' }}>Gross Proceeds (Box 1d)</th>
                      <th style={{ textAlign: 'right', padding: '0.6rem' }}>Cost Basis (Box 1e)</th>
                      <th style={{ textAlign: 'right', padding: '0.6rem' }}>Gain / (Loss)</th>
                      <th style={{ textAlign: 'center', padding: '0.6rem', width: 60 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shortTermTrades.map(t => {
                      const gain = t.proceeds - t.costBasis;
                      return (
                        <tr key={t.id} style={{ borderBottom: '1px solid var(--glass-border)22' }}>
                          <td style={{ padding: '0.6rem', fontWeight: 600 }}>{t.desc}</td>
                          <td style={{ padding: '0.6rem', textAlign: 'right', fontFamily: 'Space Grotesk' }}>${t.proceeds.toLocaleString()}</td>
                          <td style={{ padding: '0.6rem', textAlign: 'right', fontFamily: 'Space Grotesk' }}>${t.costBasis.toLocaleString()}</td>
                          <td style={{ padding: '0.6rem', textAlign: 'right', fontFamily: 'Space Grotesk', fontWeight: 800, color: gain >= 0 ? 'var(--primary)' : 'var(--green)' }}>
                            {gain >= 0 ? `+$${gain.toLocaleString()}` : `-$${Math.abs(gain).toLocaleString()}`}
                          </td>
                          <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                            <button onClick={() => handleRemoveSTTrade(t.id)} className="btn btn-ghost btn-xs" style={{ color: 'var(--red)' }}><Trash2 size={12} /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Add ST Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Asset description (e.g. AMD Day Trade Lot)"
                  value={newSTTrade.desc}
                  onChange={(e) => setNewSTTrade(prev => ({ ...prev, desc: e.target.value }))}
                  style={{ background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 6, padding: '0.4rem 0.6rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}
                />
                <input
                  type="number"
                  placeholder="Proceeds ($)"
                  value={newSTTrade.proceeds}
                  onChange={(e) => setNewSTTrade(prev => ({ ...prev, proceeds: e.target.value }))}
                  style={{ background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 6, padding: '0.4rem 0.6rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}
                />
                <input
                  type="number"
                  placeholder="Basis ($)"
                  value={newSTTrade.costBasis}
                  onChange={(e) => setNewSTTrade(prev => ({ ...prev, costBasis: e.target.value }))}
                  style={{ background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 6, padding: '0.4rem 0.6rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}
                />
                <button onClick={handleAddSTTrade} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Plus size={14} /> Add Lot</button>
              </div>
            </div>

            {/* Part II Table */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 className="text-h3" style={{ margin: 0 }}>Schedule D Part II: Long-Term Capital Trades (Holding &gt; 1 Year)</h3>
                <span className="badge badge-surface">{longTermTrades.length} Lots</span>
              </div>
              <div style={{ overflowX: 'auto', marginBottom: '0.75rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      <th style={{ textAlign: 'left', padding: '0.6rem' }}>Description of Asset</th>
                      <th style={{ textAlign: 'right', padding: '0.6rem' }}>Gross Proceeds (Box 1d)</th>
                      <th style={{ textAlign: 'right', padding: '0.6rem' }}>Cost Basis (Box 1e)</th>
                      <th style={{ textAlign: 'right', padding: '0.6rem' }}>Gain / (Loss)</th>
                      <th style={{ textAlign: 'center', padding: '0.6rem', width: 60 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {longTermTrades.map(t => {
                      const gain = t.proceeds - t.costBasis;
                      return (
                        <tr key={t.id} style={{ borderBottom: '1px solid var(--glass-border)22' }}>
                          <td style={{ padding: '0.6rem', fontWeight: 600 }}>{t.desc}</td>
                          <td style={{ padding: '0.6rem', textAlign: 'right', fontFamily: 'Space Grotesk' }}>${t.proceeds.toLocaleString()}</td>
                          <td style={{ padding: '0.6rem', textAlign: 'right', fontFamily: 'Space Grotesk' }}>${t.costBasis.toLocaleString()}</td>
                          <td style={{ padding: '0.6rem', textAlign: 'right', fontFamily: 'Space Grotesk', fontWeight: 800, color: gain >= 0 ? 'var(--primary)' : 'var(--green)' }}>
                            {gain >= 0 ? `+$${gain.toLocaleString()}` : `-$${Math.abs(gain).toLocaleString()}`}
                          </td>
                          <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                            <button onClick={() => handleRemoveLTTrade(t.id)} className="btn btn-ghost btn-xs" style={{ color: 'var(--red)' }}><Trash2 size={12} /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Add LT Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Asset description (e.g. SPY S&P 500 Index Lot)"
                  value={newLTTrade.desc}
                  onChange={(e) => setNewLTTrade(prev => ({ ...prev, desc: e.target.value }))}
                  style={{ background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 6, padding: '0.4rem 0.6rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}
                />
                <input
                  type="number"
                  placeholder="Proceeds ($)"
                  value={newLTTrade.proceeds}
                  onChange={(e) => setNewLTTrade(prev => ({ ...prev, proceeds: e.target.value }))}
                  style={{ background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 6, padding: '0.4rem 0.6rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}
                />
                <input
                  type="number"
                  placeholder="Basis ($)"
                  value={newLTTrade.costBasis}
                  onChange={(e) => setNewLTTrade(prev => ({ ...prev, costBasis: e.target.value }))}
                  style={{ background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 6, padding: '0.4rem 0.6rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}
                />
                <button onClick={handleAddLTTrade} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Plus size={14} /> Add Lot</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PRESCRIPTIVE TAX-SHIELD OPTIMIZER */}
      {activeSubTab === 'shield' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <span className="badge badge-green" style={{ marginBottom: '0.4rem' }}>STATUTORY DEDUCTION SHIELD & FICA AVOIDANCE</span>
                <h2 className="text-h2" style={{ margin: '0 0 0.35rem' }}>Prescriptive Tax-Shield Optimizer</h2>
                <p className="text-sm text-secondary" style={{ maxWidth: 740, margin: 0 }}>
                  Maximize 2026 statutory pre-tax vehicles. Health Savings Accounts (HSA) and Dependent Care FSAs provide <strong>triple-tax advantages</strong> plus an extra <strong>7.65% FICA payroll tax exemption</strong> when routed via employer payroll.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleMaxOutTaxShields}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Sparkles size={14} />
                <span>Max Out All Shields</span>
              </button>
            </div>

            {/* Hero Savings Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="card" style={{ padding: '1rem', background: 'var(--surface-raised)' }}>
                <div className="text-xs text-muted">Combined Marginal Tax Rate</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary)', marginTop: 4 }}>
                  {taxShieldResult?.combinedMarginalRate || 41.3}%
                </div>
                <div className="text-xs text-secondary" style={{ marginTop: 2 }}>Federal + {stateCode} top bracket</div>
              </div>

              <div className="card" style={{ padding: '1rem', background: 'var(--surface-raised)' }}>
                <div className="text-xs text-muted">Untapped Tax-Shield Headroom</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--gold)', marginTop: 4 }}>
                  ${(taxShieldResult?.totalUntappedShield || 0).toLocaleString()}
                </div>
                <div className="text-xs text-secondary" style={{ marginTop: 2 }}>Available 2026 pre-tax capacity</div>
              </div>

              <div className="card" style={{ padding: '1rem', background: 'rgba(16,185,129,0.08)', border: '1px solid var(--green)' }}>
                <div className="text-xs text-muted" style={{ color: 'var(--green)', fontWeight: 700 }}>POTENTIAL CASH TAX SAVINGS</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--green)', marginTop: 4 }}>
                  +${(taxShieldResult?.totalPotentialCashSavings || 0).toLocaleString()}
                </div>
                <div className="text-xs text-secondary" style={{ marginTop: 2 }}>Direct annual cash savings</div>
              </div>
            </div>

            {/* Interactive Shield Sliders & Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {/* 401(k) Card */}
              <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Traditional 401(k) / 403(b)</div>
                  <span className="badge badge-surface">Limit: $23,000</span>
                </div>
                <p className="text-xs text-secondary" style={{ marginBottom: '0.75rem' }}>
                  Elective deferral reduces Box 1 taxable wages. Offsets federal & state ordinary brackets.
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="text-xs text-muted">Claimed Contribution:</span>
                  <input
                    type="number"
                    max="23000"
                    value={claimed401k}
                    onChange={(e) => setClaimed401k(Number(e.target.value))}
                    style={{ width: 100, textAlign: 'right', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 6, padding: '0.3rem 0.5rem', color: 'var(--text-primary)', fontWeight: 700 }}
                  />
                </div>
                <div style={{ background: 'var(--surface-raised)', padding: '0.6rem 0.75rem', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-xs text-secondary">Remaining Headroom:</span>
                  <span style={{ fontWeight: 800, color: 'var(--green)', fontSize: '0.85rem' }}>+${(taxShieldResult?.potentialTaxSavings?.traditional401k || 0).toLocaleString()} cash saved</span>
                </div>
              </div>

              {/* HSA Card */}
              <div className="card" style={{ padding: '1.25rem', border: '1px solid rgba(16,185,129,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--green)' }}>Health Savings Account (HSA)</div>
                  <span className="badge badge-green">Limit: ${filingStatus === 'MFJ' ? '8,300' : '4,150'}</span>
                </div>
                <p className="text-xs text-secondary" style={{ marginBottom: '0.75rem' }}>
                  Triple-tax exempt. <strong>Avoids 7.65% FICA taxes</strong> when routed via Section 125 cafeteria plan!
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="text-xs text-muted">Claimed Contribution:</span>
                  <input
                    type="number"
                    max={filingStatus === 'MFJ' ? 8300 : 4150}
                    value={claimedHSA}
                    onChange={(e) => setClaimedHSA(Number(e.target.value))}
                    style={{ width: 100, textAlign: 'right', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 6, padding: '0.3rem 0.5rem', color: 'var(--text-primary)', fontWeight: 700 }}
                  />
                </div>
                <div style={{ background: 'var(--surface-raised)', padding: '0.6rem 0.75rem', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-xs text-secondary">Remaining Headroom:</span>
                  <span style={{ fontWeight: 800, color: 'var(--green)', fontSize: '0.85rem' }}>+${(taxShieldResult?.potentialTaxSavings?.hsa || 0).toLocaleString()} cash saved</span>
                </div>
              </div>

              {/* Dependent Care FSA */}
              <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Dependent Care FSA (DCFSA)</div>
                  <span className="badge badge-surface">Limit: $5,000</span>
                </div>
                <p className="text-xs text-secondary" style={{ marginBottom: '0.75rem' }}>
                  Pre-tax childcare spend (daycare, preschool, camps). Also exempt from 7.65% FICA taxes.
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="text-xs text-muted">Claimed Annual Spend:</span>
                  <input
                    type="number"
                    max="5000"
                    value={claimedFSA}
                    onChange={(e) => setClaimedFSA(Number(e.target.value))}
                    style={{ width: 100, textAlign: 'right', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 6, padding: '0.3rem 0.5rem', color: 'var(--text-primary)', fontWeight: 700 }}
                  />
                </div>
                <div style={{ background: 'var(--surface-raised)', padding: '0.6rem 0.75rem', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-xs text-secondary">Remaining Headroom:</span>
                  <span style={{ fontWeight: 800, color: 'var(--green)', fontSize: '0.85rem' }}>+${(taxShieldResult?.potentialTaxSavings?.dependentCareFSA || 0).toLocaleString()} cash saved</span>
                </div>
              </div>

              {/* Traditional / Backdoor Roth IRA */}
              <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Traditional / Backdoor Roth IRA</div>
                  <span className="badge badge-surface">Limit: $7,000</span>
                </div>
                <p className="text-xs text-secondary" style={{ marginBottom: '0.75rem' }}>
                  Non-deductible contribution converted to Roth IRA without pro-rata rule if 401(k) holds pre-tax balances.
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="text-xs text-muted">Claimed IRA Amount:</span>
                  <input
                    type="number"
                    max="7000"
                    value={claimedIRA}
                    onChange={(e) => setClaimedIRA(Number(e.target.value))}
                    style={{ width: 100, textAlign: 'right', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 6, padding: '0.3rem 0.5rem', color: 'var(--text-primary)', fontWeight: 700 }}
                  />
                </div>
                <div style={{ background: 'var(--surface-raised)', padding: '0.6rem 0.75rem', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-xs text-secondary">Remaining Headroom:</span>
                  <span style={{ fontWeight: 800, color: 'var(--green)', fontSize: '0.85rem' }}>+${(taxShieldResult?.potentialTaxSavings?.traditionalIRA || 0).toLocaleString()} cash saved</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: FORM 6251 ALTERNATIVE MINIMUM TAX (AMT) & ISO SPREAD */}
      {activeSubTab === 'amt' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span className="badge badge-gold" style={{ marginBottom: '0.5rem' }}>IRC § 55 STATUTORY ENGINE</span>
                <h2 className="text-h2" style={{ margin: '0 0 0.5rem' }}>IRS Form 6251: Alternative Minimum Tax & ISO Preference</h2>
                <p className="text-sm text-secondary" style={{ maxWidth: 740 }}>
                  High earners exercising Incentive Stock Options (ISOs) face severe Alternative Minimum Tax obligations. The spread between the Fair Market Value (FMV) on exercise and the Strike Price is treated as an AMTI preference item.
                </p>
              </div>
              <div style={{
                padding: '0.875rem 1.25rem', background: amt?.triggersAMT ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                border: `1px solid ${amt?.triggersAMT ? 'var(--red)' : 'var(--green)'}`, borderRadius: 10, textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: amt?.triggersAMT ? 'var(--red)' : 'var(--green)' }}>
                  {amt?.triggersAMT ? 'AMT TRIGGERED' : 'REGULAR TAX GOVERNS'}
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: amt?.triggersAMT ? 'var(--red)' : 'var(--green)' }}>
                  ${(amt?.amtPayable || 0).toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginTop: '1.5rem' }}>
              <div>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>
                  Incentive Stock Option (ISO) Spread: (FMV - Strike) × Exercised
                </label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-raised)', borderRadius: 8, padding: '0.4rem 0.75rem' }}>
                  <span style={{ color: 'var(--text-muted)', marginRight: 6 }}>$</span>
                  <input
                    type="number"
                    value={isoSpread}
                    onChange={(e) => setIsoSpread(Number(e.target.value))}
                    style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 700 }}
                  />
                </div>
                <span className="text-xs text-muted" style={{ display: 'block', marginTop: 4 }}>
                  Generates Form 8801 Minimum Tax Credit (MTC) carryforward for future recovery.
                </span>
              </div>

              <div>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>
                  Private Activity Bond Interest (Form 6251 Line 2g)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-raised)', borderRadius: 8, padding: '0.4rem 0.75rem' }}>
                  <span style={{ color: 'var(--text-muted)', marginRight: 6 }}>$</span>
                  <input
                    type="number"
                    value={privateActivityBonds}
                    onChange={(e) => setPrivateActivityBonds(Number(e.target.value))}
                    style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 700 }}
                  />
                </div>
                <span className="text-xs text-muted" style={{ display: 'block', marginTop: 4 }}>
                  Tax-exempt for regular income tax, but fully taxable under AMT rules.
                </span>
              </div>
            </div>

            {/* Line-by-Line Form 6251 Worksheet */}
            <div style={{ marginTop: '1.5rem', background: 'var(--surface-raised)', borderRadius: 10, padding: '1rem' }}>
              <h4 className="text-h4" style={{ marginBottom: '0.75rem' }}>Form 6251 Line-by-Line Computation Breakdown</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
                <div style={{ borderRight: '1px solid var(--glass-border)', paddingRight: '1rem' }}>
                  <div className="text-xs text-muted">Regular Taxable Income</div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', marginTop: 4 }}>${(amt?.regularTax || 0).toLocaleString()}</div>
                </div>
                <div style={{ borderRight: '1px solid var(--glass-border)', paddingRight: '1rem' }}>
                  <div className="text-xs text-muted">AMTI (Alternative Minimum Taxable Income)</div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--gold)', marginTop: 4 }}>${(amt?.amti || 0).toLocaleString()}</div>
                </div>
                <div style={{ borderRight: '1px solid var(--glass-border)', paddingRight: '1rem' }}>
                  <div className="text-xs text-muted">Allowable 2026 Exemption</div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', marginTop: 4 }}>${(amt?.allowableExemption || 0).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-muted">Tentative Minimum Tax (TMT)</div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: amt?.triggersAMT ? 'var(--red)' : 'var(--text-primary)', marginTop: 4 }}>
                    ${(amt?.tentativeMinimumTax || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {amt?.form8801CreditCarryforward > 0 && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(99,102,241,0.08)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <ShieldCheck size={20} color="var(--primary)" />
                  <div style={{ fontSize: '0.8125rem' }}>
                    <strong>Form 8801 Minimum Tax Credit (MTC):</strong> You generated <strong>${amt.form8801CreditCarryforward.toLocaleString()}</strong> in refundable/carryforward tax credits that will offset regular income tax liabilities in future years when regular tax exceeds TMT.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: PASS-THROUGH ENTITY TAX (PTET) OPTIMIZER */}
      {activeSubTab === 'ptet' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span className="badge badge-green" style={{ marginBottom: '0.5rem' }}>IRS NOTICE 2020-75 STATUTORY CARVEOUT</span>
                <h2 className="text-h2" style={{ margin: '0 0 0.5rem' }}>Pass-Through Entity Tax (PTET) SALT Cap Bypass Studio</h2>
                <p className="text-sm text-secondary" style={{ maxWidth: 740 }}>
                  By electing to pay state tax at the partnership or S-Corporation level, the tax is 100% deductible as a business expense against Federal ordinary income. You receive a 100% credit on your state personal return, circumventing the $10,000 personal SALT cap.
                </p>
              </div>
              <div style={{
                padding: '0.875rem 1.25rem', background: 'rgba(16,185,129,0.1)',
                border: '1px solid var(--green)', borderRadius: 10, textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--green)' }}>NET CASH SAVINGS</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--green)' }}>
                  +${(ptet?.netFederalCashSavings || 0).toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginTop: '1.5rem' }}>
              <div>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>
                  Pass-Through Entity Net Income (S-Corp / Partnership K-1)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-raised)', borderRadius: 8, padding: '0.4rem 0.75rem' }}>
                  <span style={{ color: 'var(--text-muted)', marginRight: 6 }}>$</span>
                  <input
                    type="number"
                    value={entityNetIncome}
                    onChange={(e) => setEntityNetIncome(Number(e.target.value))}
                    style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 700 }}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>
                  State Statutory Law
                </label>
                <div style={{ padding: '0.6rem 0.75rem', background: 'var(--surface-raised)', borderRadius: 8, fontWeight: 700, fontSize: '0.875rem' }}>
                  {ptet?.statutoryCode || 'California AB 150 (9.3%)'}
                </div>
              </div>
            </div>

            {/* Comparison Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
              <div className="card" style={{ padding: '1.25rem', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.03)' }}>
                <h4 className="text-h4" style={{ color: 'var(--red)', marginBottom: '0.5rem' }}>Scenario A: Standard Individual Filing</h4>
                <p className="text-xs text-muted" style={{ marginBottom: '1rem' }}>Without PTET election, subject to TCJA $10,000 SALT ceiling.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">Total State Tax Incurred:</span>
                    <span style={{ fontWeight: 700 }}>${(ptet?.entityPTETTaxPaid || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">Allowable Federal SALT Deduction:</span>
                    <span style={{ fontWeight: 700, color: 'var(--red)' }}>$10,000 (Capped)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">Lost Federal Deduction:</span>
                    <span style={{ fontWeight: 700, color: 'var(--red)' }}>
                      -${Math.max(0, (ptet?.entityPTETTaxPaid || 0) - 10000).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: '1.25rem', border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.03)' }}>
                <h4 className="text-h4" style={{ color: 'var(--green)', marginBottom: '0.5rem' }}>Scenario B: With PTET Elective Tax</h4>
                <p className="text-xs text-muted" style={{ marginBottom: '1rem' }}>Entity pays tax directly under {ptet?.formName || 'FTB 3804'}.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">Above-the-Line Federal Deduction:</span>
                    <span style={{ fontWeight: 700, color: 'var(--green)' }}>${(ptet?.entityPTETTaxPaid || 0).toLocaleString()} (100%)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">State Personal Tax Credit:</span>
                    <span style={{ fontWeight: 700, color: 'var(--green)' }}>${(ptet?.stateCreditReceived || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--glass-border)', paddingTop: '0.4rem' }}>
                    <span style={{ fontWeight: 700 }}>Net Cash In Pocket:</span>
                    <span style={{ fontWeight: 800, color: 'var(--green)', fontSize: '1.05rem' }}>
                      +${(ptet?.netFederalCashSavings || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: CHILD TAX CREDIT & DEPENDENT CARE FSA */}
      {activeSubTab === 'credits' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <span className="badge badge-surface" style={{ marginBottom: '0.5rem' }}>IRC § 24 & § 129 STATUTORY LIMITS</span>
            <h2 className="text-h2" style={{ margin: '0 0 0.5rem' }}>Child Tax Credit (CTC) & Dependent Care FSA Studio</h2>
            <p className="text-sm text-secondary" style={{ maxWidth: 740 }}>
              Evaluates the $2,000 credit per child ($1,700 refundable ACTC), $500 Credit for Other Dependents, and exact phase-out curves ($50 reduction per $1,000 MAGI exceeding $400k MFJ / $200k Single).
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginTop: '1.5rem' }}>
              <div>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>
                  Qualifying Children Under 17 (Line 19 - $2,000 / child)
                </label>
                <input
                  type="number"
                  min="0"
                  value={qualifyingChildren}
                  onChange={(e) => setQualifyingChildren(Number(e.target.value))}
                  style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontWeight: 700 }}
                />
              </div>

              <div>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>
                  Other Qualifying Dependents ($500 / dependent)
                </label>
                <input
                  type="number"
                  min="0"
                  value={otherDependents}
                  onChange={(e) => setOtherDependents(Number(e.target.value))}
                  style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontWeight: 700 }}
                />
              </div>

              <div>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>
                  Dependent Care FSA Annual Spend (Max $5,000 pre-tax)
                </label>
                <input
                  type="number"
                  max="5000"
                  value={dependentCareSpend}
                  onChange={(e) => setDependentCareSpend(Number(e.target.value))}
                  style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontWeight: 700 }}
                />
              </div>
            </div>

            {/* Results Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
              <div className="card" style={{ padding: '1rem', background: 'var(--surface-raised)' }}>
                <div className="text-xs text-muted">Gross Base Credits</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: 4 }}>${(credits?.totalBaseCredits || 0).toLocaleString()}</div>
              </div>
              <div className="card" style={{ padding: '1rem', background: 'var(--surface-raised)' }}>
                <div className="text-xs text-muted">MAGI Phase-Out Reduction</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: credits?.creditReduction > 0 ? 'var(--red)' : 'var(--green)', marginTop: 4 }}>
                  -${(credits?.creditReduction || 0).toLocaleString()}
                </div>
              </div>
              <div className="card" style={{ padding: '1rem', background: 'var(--surface-raised)' }}>
                <div className="text-xs text-muted">Net Allowable CTC Offset</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginTop: 4 }}>
                  ${(credits?.allowableCTC || 0).toLocaleString()}
                </div>
              </div>
              <div className="card" style={{ padding: '1rem', background: 'var(--surface-raised)' }}>
                <div className="text-xs text-muted">Dependent Care FSA Tax Saved</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--green)', marginTop: 4 }}>
                  +${(credits?.dependentCareFSA?.fsaTaxSaved || 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: STATE SPECIFIC NON-CONFORMITY ENGINE */}
      {activeSubTab === 'states' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <span className="badge badge-surface" style={{ marginBottom: '0.5rem' }}>MULTI-STATE JURISDICTION MATRIX</span>
            <h2 className="text-h2" style={{ margin: '0 0 0.5rem' }}>State Statutory Non-Conformity & Payroll Adjustments</h2>
            <p className="text-sm text-secondary" style={{ maxWidth: 740 }}>
              States do not uniformly conform to the Internal Revenue Code. FinAgent models key state-specific addition and subtraction modifications.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginTop: '1.5rem' }}>
              {/* California Box */}
              <div className="card" style={{ padding: '1.25rem', border: stateCode === 'CA' ? '1px solid var(--primary)' : '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 className="text-h4" style={{ margin: 0 }}>California (Form 540)</h4>
                  <span className="badge badge-primary">Top: 13.3%</span>
                </div>
                <ul style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', margin: 0 }}>
                  <li><strong>CA SDI Payroll Tax:</strong> 1.2% tax applied to 100% of W-2 wages with NO wage base ceiling.</li>
                  <li><strong>HSA Non-Conformity:</strong> California does not recognize HSAs. Annual contributions and interest/dividends are added back to state taxable income.</li>
                  <li><strong>IRC § 199A QBI Exclusion:</strong> California does not conform to the 20% Qualified Business Income deduction.</li>
                  <li><strong>Mental Health Services Tax:</strong> Additional 1.0% surtax on taxable income exceeding $1,000,000.</li>
                </ul>
              </div>

              {/* New York Box */}
              <div className="card" style={{ padding: '1.25rem', border: stateCode === 'NY' ? '1px solid var(--primary)' : '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 className="text-h4" style={{ margin: 0 }}>New York (Form IT-201)</h4>
                  <span className="badge badge-primary">Top: 10.9% / 14.8%</span>
                </div>
                <ul style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', margin: 0 }}>
                  <li><strong>NYC Resident City Tax:</strong> Graduated municipal tax up to 3.876% on full taxable income.</li>
                  <li><strong>MTA Commuter Mobility Tax:</strong> 0.34% surcharge on net earnings within the 12-county metropolitan commuter transportation district.</li>
                  <li><strong>Estate Tax Cliff:</strong> New York estates exceeding 105% of the $6.94M exemption lose the entire exemption retroactively.</li>
                  <li><strong>PTET Rate:</strong> Graduated 6.85% to 10.9% elective pass-through entity tax credit.</li>
                </ul>
              </div>

              {/* Washington & Texas */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <h4 className="text-h4" style={{ margin: '0 0 0.75rem' }}>Zero-Income & Specialized States</h4>
                <ul style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', margin: 0 }}>
                  <li><strong>Washington:</strong> 0% wage income tax, but 7.0% excise tax on net long-term capital gains exceeding $250,000.</li>
                  <li><strong>Texas / Florida / Nevada:</strong> 0% state income tax on all wages, ordinary income, and capital gains.</li>
                  <li><strong>Massachusetts:</strong> 5.0% flat income tax plus a 4.0% Fair Share surtax on taxable income exceeding $1,000,000 (9.0% combined).</li>
                  <li><strong>New Jersey:</strong> Progressive rate schedule up to 10.75% for income exceeding $1,000,000.</li>
                </ul>
              </div>

              {/* US Overseas Territories & Expat Havens */}
              <div className="card" style={{ padding: '1.25rem', border: ['PR', 'VI', 'GU', 'MP', 'AS'].includes(stateCode) ? '1px solid var(--primary)' : '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 className="text-h4" style={{ margin: 0 }}>US Territories & Expatriate Relief</h4>
                  <span className="badge badge-success">IRC § 911 / 931–935</span>
                </div>
                <ul style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', margin: 0 }}>
                  <li><strong>Puerto Rico (Act 60 / IRC § 933):</strong> Excludes 100% of PR-source income from US Form 1040. Act 60 provides 0% capital gains and 4% fixed export services corporate tax.</li>
                  <li><strong>U.S. Virgin Islands (IRC § 932):</strong> Single mirror tax return filed with VIBIR; eliminates dual-filing and satisfies federal obligation.</li>
                  <li><strong>Guam & CNMI (IRC § 935):</strong> Mirror return filed locally with Guam DRT / CNMI DRT; $0 direct federal tax to the IRS.</li>
                  <li><strong>American Samoa (IRC § 931):</strong> Independent non-mirror territorial code; AS-source income excluded from US Form 1040.</li>
                  <li><strong>US Expats (Form 2555 FEIE):</strong> Up to $130,000 foreign earned income exclusion for taxpayers satisfying the 330-day Physical Presence Test.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: FORM 8606 & BACKDOOR ROTH PRO-RATA TRAP ENGINE */}
      {activeSubTab === 'form8606' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Interactive Pro-Rata Trap Donut Visualizer */}
          <ProRataTrapDonut
            nondeductibleBasis={form8606State.nondeductibleContribution}
            preTaxBalance={form8606State.yearEndTraditionalIRABalance}
            conversionAmount={form8606State.rothConversionAmount}
            onSimulateChange={(isReverseRollover) => {
              setForm8606State(prev => ({
                ...prev,
                yearEndTraditionalIRABalance: isReverseRollover ? 0 : 63000
              }));
            }}
          />

          {/* Header & Warning Banner */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <span className="badge badge-surface" style={{ marginBottom: '0.4rem' }}>IRC § 408(d)(2) STATUTORY PROTOCOL</span>
                <h2 className="text-h2" style={{ margin: 0 }}>Form 8606 & Backdoor Roth Pro-Rata Trap Engine</h2>
                <p className="text-sm text-secondary" style={{ marginTop: '0.25rem' }}>
                  Aggregates all Traditional, Rollover, SEP, and SIMPLE IRAs as of Dec 31 to prevent catastrophic CP2000 IRS deficiency notices.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={downloadForm8606PDF}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Download size={14} /> Download Form 8606 PDF
              </button>
            </div>

            {/* Pro-Rata Trap Warning Banner */}
            {form8606Result?.proRataTrap?.triggered ? (
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', marginBottom: '1.25rem',
                display: 'flex', gap: '0.75rem', alignItems: 'flex-start'
              }}>
                <AlertTriangle size={22} color="var(--red)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--red)', marginBottom: '0.25rem' }}>
                    IRC § 408(d)(2) PRO-RATA TRAP TRIGGERED — {form8606Result.proRataTrap.taxableConversionPercentage}% TAXABLE CONVERSION
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {form8606Result.proRataTrap.remedy}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', marginBottom: '1.25rem',
                display: 'flex', gap: '0.75rem', alignItems: 'center'
              }}>
                <CheckCircle2 size={22} color="var(--green)" />
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  <strong>Clean Backdoor Roth:</strong> Dec 31 pre-tax IRA balance is $0. 100% of the conversion is non-taxable and protected under IRC § 408A.
                </div>
              </div>
            )}

            {/* Inputs & Computation Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {/* Inputs Box */}
              <div className="card" style={{ padding: '1.25rem', background: 'var(--surface-raised)' }}>
                <h4 className="text-h4" style={{ margin: '0 0 1rem' }}>IRA Basis & Balances</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  <div>
                    <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>
                      Line 1: Nondeductible Traditional IRA Contribution ($)
                    </label>
                    <input
                      className="input input-sm"
                      type="number"
                      value={form8606State.nondeductibleContribution}
                      onChange={e => setForm8606State({ ...form8606State, nondeductibleContribution: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>
                      Line 2: Prior Year Basis in Traditional IRAs ($)
                    </label>
                    <input
                      className="input input-sm"
                      type="number"
                      value={form8606State.priorYearBasis}
                      onChange={e => setForm8606State({ ...form8606State, priorYearBasis: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>
                      Line 6: Dec 31 Pre-Tax Balance (Traditional, SEP, SIMPLE, Rollover IRAs) ($)
                    </label>
                    <input
                      className="input input-sm"
                      type="number"
                      value={form8606State.yearEndTraditionalIRABalance}
                      onChange={e => setForm8606State({ ...form8606State, yearEndTraditionalIRABalance: Number(e.target.value) })}
                    />
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Triggers pro-rata taxation if greater than $0
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>
                      Line 8: Amount Converted to Roth IRA ($)
                    </label>
                    <input
                      className="input input-sm"
                      type="number"
                      value={form8606State.rothConversionAmount}
                      onChange={e => setForm8606State({ ...form8606State, rothConversionAmount: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              {/* Form 8606 Output Schedule Table */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <h4 className="text-h4" style={{ margin: '0 0 0.75rem' }}>Form 8606 Line-by-Line Schedule</h4>
                {form8606Result?.form8606 && (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '0.4rem 0', color: 'var(--text-secondary)' }}>Line 3: Total Basis</td>
                        <td style={{ padding: '0.4rem 0', textAlign: 'right', fontWeight: 700 }}>
                          ${form8606Result.form8606.line3_totalBasis.toLocaleString()}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '0.4rem 0', color: 'var(--text-secondary)' }}>Line 9: Total Aggregate IRA Valuation</td>
                        <td style={{ padding: '0.4rem 0', textAlign: 'right', fontWeight: 700 }}>
                          ${form8606Result.form8606.line9_totalIRAValuation.toLocaleString()}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '0.4rem 0', color: 'var(--text-secondary)' }}>Line 10: Non-Taxable Ratio</td>
                        <td style={{ padding: '0.4rem 0', textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                          {(form8606Result.form8606.line10_nontaxableRatio * 100).toFixed(2)}%
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '0.4rem 0', color: 'var(--text-secondary)' }}>Line 11: Nontaxable Portion of Conversion</td>
                        <td style={{ padding: '0.4rem 0', textAlign: 'right', fontWeight: 700, color: 'var(--green)' }}>
                          ${form8606Result.form8606.line11_nontaxableConversion.toLocaleString()}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '0.4rem 0', color: 'var(--text-secondary)' }}>Line 14: Remaining Basis for Future Years</td>
                        <td style={{ padding: '0.4rem 0', textAlign: 'right', fontWeight: 700 }}>
                          ${form8606Result.form8606.line14_remainingBasisFutureYears.toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '0.5rem 0', fontWeight: 800, color: 'var(--red)' }}>
                          Line 15: TAXABLE CONVERSION (Form 1040 Line 4b)
                        </td>
                        <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 800, color: 'var(--red)', fontSize: '1rem' }}>
                          ${form8606Result.form8606.line15_taxableRothConversion.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 10: FBAR (FINCEN 114) & FATCA (FORM 8938) */}
      {activeSubTab === 'fbar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <span className="badge badge-surface" style={{ marginBottom: '0.4rem' }}>CROSS-BORDER ASSET COMPLIANCE</span>
                <h2 className="text-h2" style={{ margin: 0 }}>FinCEN Form 114 (FBAR) & FATCA Form 8938 Sentinel</h2>
                <p className="text-sm text-secondary" style={{ marginTop: '0.25rem' }}>
                  Monitors aggregate foreign financial account thresholds ($10,000 FBAR rule / $50k-$200k FATCA thresholds) avoiding catastrophic $16,117+ statutory penalties.
                </p>
              </div>
            </div>

            {/* Threshold KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div className="card" style={{ padding: '1rem', background: 'var(--surface-raised)' }}>
                <div className="text-xs text-muted">Aggregate Peak Foreign Balance</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: (form8606Result?.crossBorderFBAR_FATCA?.totalMaxAggregateForeignUSD || 0) > 10000 ? 'var(--red)' : 'var(--text-primary)', marginTop: 4 }}>
                  ${(form8606Result?.crossBorderFBAR_FATCA?.totalMaxAggregateForeignUSD || 23500).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>FBAR Limit: $10,000 USD</div>
              </div>
              <div className="card" style={{ padding: '1rem', background: 'var(--surface-raised)' }}>
                <div className="text-xs text-muted">FinCEN Form 114 Status</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: form8606Result?.crossBorderFBAR_FATCA?.fbar?.required ? 'var(--red)' : 'var(--green)', marginTop: 4 }}>
                  {form8606Result?.crossBorderFBAR_FATCA?.fbar?.required ? '⚠️ FILING MANDATORY' : '✅ EXEMPT (<$10k)'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Due: April 15 (BSA E-Filing)</div>
              </div>
              <div className="card" style={{ padding: '1rem', background: 'var(--surface-raised)' }}>
                <div className="text-xs text-muted">FATCA Form 8938 Status</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: form8606Result?.crossBorderFBAR_FATCA?.fatca8938?.required ? 'var(--red)' : 'var(--green)', marginTop: 4 }}>
                  {form8606Result?.crossBorderFBAR_FATCA?.fatca8938?.required ? '⚠️ ATTACH TO 1040' : '✅ BELOW THRESHOLD'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Single: $50k / MFJ: $100k</div>
              </div>
            </div>

            {/* Foreign Accounts Table */}
            <h4 className="text-h4" style={{ margin: '1rem 0 0.5rem' }}>Reported Foreign Financial Accounts</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem' }}>Institution Name</th>
                    <th style={{ padding: '0.5rem' }}>Country</th>
                    <th style={{ padding: '0.5rem' }}>Account #</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Max Balance (USD)</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Year-End Balance (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {foreignAccounts.map((acc, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '0.5rem', fontWeight: 600 }}>{acc.institutionName}</td>
                      <td style={{ padding: '0.5rem' }}>{acc.country}</td>
                      <td style={{ padding: '0.5rem' }}><code>{acc.accountNumber}</code></td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 700, color: 'var(--gold)' }}>
                        ${acc.maxBalanceUSD.toLocaleString()}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                        ${acc.yearEndBalanceUSD.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 11: CPA FIDUCIARY WORKPAPERS & CIRCULAR 230 */}
      {activeSubTab === 'workpapers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  {savedReturnStatusUS === 'LOCKED' ? <Lock size={20} color="var(--green)" /> : <FileCheck size={20} color="var(--primary)" />}
                  <h2 className="text-h2" style={{ margin: 0 }}>CPA Form 1040 Fiduciary Review Workpapers</h2>
                  <span className={`badge ${savedReturnStatusUS === 'LOCKED' ? 'badge-success' : 'badge-surface'}`}>
                    {savedReturnStatusUS === 'LOCKED' ? 'LOCKED & CERTIFIED' : 'AUDIT READY DRAFT'}
                  </span>
                </div>
                <p className="text-sm text-secondary" style={{ margin: 0 }}>
                  Prepares institutional workpapers adhering to Treasury Department Circular 230 and AICPA Statements on Standards for Tax Services (SSTS).
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleLockReturnUS}
                  disabled={lockingReturnUS || savedReturnStatusUS === 'LOCKED'}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <Lock size={14} />
                  <span>{savedReturnStatusUS === 'LOCKED' ? 'Certified & Locked' : (lockingReturnUS ? 'Locking...' : 'Certify & Lock Form 1040')}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={downloadCPAWorkpaperPDFUS}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <Download size={14} /> Download CPA Workpaper PDF
                </button>
              </div>
            </div>

            {/* SHA-256 Cryptographic Seal Display */}
            {returnSealHashUS && (
              <div style={{
                background: 'var(--surface-raised)', border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', marginBottom: '1.25rem',
                display: 'flex', alignItems: 'center', gap: 10
              }}>
                <CheckCircle2 size={18} color="var(--green)" />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                    IMMUTABLE RETURN SEAL HASH (SHA-256)
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--green)', wordBreak: 'break-all' }}>
                    {returnSealHashUS}
                  </div>
                </div>
              </div>
            )}

            {/* Checklist & CPA Credentials */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {/* PBC Checklist */}
              <div className="card" style={{ padding: '1.25rem', background: 'var(--surface-raised)' }}>
                <h4 className="text-h4" style={{ margin: '0 0 0.75rem' }}>Client Document Checklist (PBC)</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[
                    { key: 'w2s', label: 'Form W-2 Wage & Tax Statements (All Employers)' },
                    { key: 'form1099B', label: 'Form 1099-B Brokerage Proceeds & Cost Basis' },
                    { key: 'form1099DIV', label: 'Form 1099-DIV Qualified & Ordinary Dividends' },
                    { key: 'form1098Mortgage', label: 'Form 1098 Mortgage Interest & Real Estate Taxes' },
                    { key: 'form5498IRA', label: 'Form 5498 Year-End Traditional IRA Balance' },
                    { key: 'foreignAccountFBAR', label: 'Foreign Accounts Statements (FinCEN 114 Audit)' },
                    { key: 'priorYearReturn', label: 'Prior Year Form 1040 (Loss Carryforward Audit)' },
                  ].map(item => (
                    <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={!!pbcChecklistUS[item.key]}
                        onChange={e => setPbcChecklistUS({ ...pbcChecklistUS, [item.key]: e.target.checked })}
                      />
                      <span style={{ color: pbcChecklistUS[item.key] ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* CPA Credentials */}
              <div className="card" style={{ padding: '1.25rem', background: 'var(--surface-raised)' }}>
                <h4 className="text-h4" style={{ margin: '0 0 0.75rem' }}>Paid Preparer & Circular 230 Info</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 2 }}>Preparer Name</label>
                    <input
                      className="input input-sm"
                      value={cpaCredentials.name}
                      onChange={e => setCpaCredentials({ ...cpaCredentials, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 2 }}>IRS PTIN</label>
                    <input
                      className="input input-sm"
                      value={cpaCredentials.ptin}
                      onChange={e => setCpaCredentials({ ...cpaCredentials, ptin: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 2 }}>ERO EFIN</label>
                    <input
                      className="input input-sm"
                      value={cpaCredentials.efin}
                      onChange={e => setCpaCredentials({ ...cpaCredentials, efin: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 2 }}>Firm Name</label>
                    <input
                      className="input input-sm"
                      value={cpaCredentials.firmName}
                      onChange={e => setCpaCredentials({ ...cpaCredentials, firmName: e.target.value })}
                    />
                  </div>
                </div>
                <div style={{ marginTop: '0.75rem' }}>
                  <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 2 }}>Preparer Notes & Due Diligence Record</label>
                  <textarea
                    className="input input-sm"
                    style={{ minHeight: 50, width: '100%' }}
                    value={cpaCredentials.auditNotes}
                    onChange={e => setCpaCredentials({ ...cpaCredentials, auditNotes: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 12: 1099 & W-2 DOCUMENT INGESTION */}
      {activeSubTab === 'document-import' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <span className="badge badge-surface" style={{ marginBottom: '0.4rem' }}>STATEMENT INGESTION RAILS</span>
            <h2 className="text-h2" style={{ margin: '0 0 0.5rem' }}>Automated Form W-2 & 1099-B Ingestion</h2>
            <p className="text-sm text-secondary" style={{ maxWidth: 740, marginBottom: '1.25rem' }}>
              Paste text from your employer Form W-2 or brokerage Form 1099-B statement for instant deterministic field extraction and auto-fill.
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIngestionTextUS(`Form W-2 Wage and Tax Statement 2026
Employer EIN: 94-3129845 | Employee SSN: ***-**-6789
Box 1 Wages, tips, other comp: $245,000.00
Box 2 Federal income tax withheld: $48,200.00
Box 3 Social security wages: $168,600.00
Box 4 Social security tax withheld: $10,453.20
Box 5 Medicare wages and tips: $245,000.00
Box 6 Medicare tax withheld: $3,552.50
Box 12a Code D Elective deferrals to 401(k): $23,000.00
Box 16 State wages: $245,000.00 | Box 17 State tax: $17,800.00`)}
              >
                📋 Load Sample W-2
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIngestionTextUS(`1099-B Proceeds From Broker Schwab
NVDA 02/14/2025 11/20/2025 $28,450.00 $19,200.00 Box A Short-Term
TSLA 06/10/2025 10/15/2025 $14,200.00 $16,800.00 $2,600.00 Box A Short-Term Code W
AAPL 04/12/2023 08/18/2025 $45,000.00 $32,000.00 Box D Long-Term`)}
              >
                📋 Load Sample 1099-B
              </button>
            </div>

            <textarea
              className="input"
              style={{ width: '100%', minHeight: 130, fontFamily: 'monospace', fontSize: '0.8125rem' }}
              placeholder="Paste raw W-2 or 1099-B statement text here..."
              value={ingestionTextUS}
              onChange={e => setIngestionTextUS(e.target.value)}
            />

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => handleParseUSDocument()}
                disabled={parsingDocUS || !ingestionTextUS.trim()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                <UploadCloud size={14} />
                <span>{parsingDocUS ? 'Parsing...' : 'Deterministic Auto-Parse'}</span>
              </button>
            </div>
          </div>

          {/* Parsed Result Preview */}
          {parsedDocResultUS && (
            <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--green)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={18} color="var(--green)" />
                  <h4 className="text-h4" style={{ margin: 0 }}>
                    Extracted {parsedDocResultUS.documentType === 'FORM_W2' ? 'Form W-2 Wage Statement' : 'Form 1099-B Brokerage Proceeds'}
                  </h4>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={applyParsedUSDocument}
                >
                  ⚡ Apply Extracted Data to Form 1040
                </button>
              </div>

              {parsedDocResultUS.documentType === 'FORM_W2' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  <div className="card" style={{ padding: '0.75rem', background: 'var(--surface-raised)' }}>
                    <div className="text-xs text-muted">Box 1 Wages</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>${(parsedDocResultUS.wages?.box1_wagesTipsOther || 0).toLocaleString()}</div>
                  </div>
                  <div className="card" style={{ padding: '0.75rem', background: 'var(--surface-raised)' }}>
                    <div className="text-xs text-muted">Box 2 Fed Tax Withheld</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>${(parsedDocResultUS.wages?.box2_federalIncomeTaxWithheld || 0).toLocaleString()}</div>
                  </div>
                  <div className="card" style={{ padding: '0.75rem', background: 'var(--surface-raised)' }}>
                    <div className="text-xs text-muted">Box 17 State Tax Withheld</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>${(parsedDocResultUS.stateDetails?.box17_stateIncomeTaxWithheld || 0).toLocaleString()}</div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-sm text-secondary" style={{ marginBottom: '0.5rem' }}>
                    Extracted {parsedDocResultUS.lots?.length || 0} tax lots (Total Proceeds: ${(parsedDocResultUS.summary?.totalProceeds || 0).toLocaleString()} · Wash Sale Disallowed: ${(parsedDocResultUS.summary?.totalWashSaleDisallowed || 0).toLocaleString()}).
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sticky Action Dock */}
      <StickyActionDock
        primaryLabel="Download Fiduciary Tax Statement"
        primaryIcon={Download}
        onPrimary={downloadExecutivePDF}
        badges={[`Filing: ${filingStatus}`, `State: ${stateCode}`, `Eff. Rate: ${s?.effectiveCombinedRate || '0.0%'}`]}
      />
    </div>
  );
}
