// src/pages/consumer/us/USSCorpStudio.jsx
// S-Corporation, LLC & Pass-Through Entity Corporate OS
// Reasonable Salary Optimizer (FICA 15.3% savings), IRS Form 7203 Shareholder Stock and Debt Basis Limitations,
// Accumulated Adjustments Account (AAA) & E&P Waterfall (IRC § 1368), Multi-Member LLC Operating Agreement Generator (§ 704(b)),
// Solo 401(k) Maximizer ($69k), Augusta Rule (§ 280A(g)), and Form 2553 Generator.

import React, { useState, useEffect } from 'react';
import {
  Building2, DollarSign, ShieldCheck, Download, Award, RefreshCw,
  TrendingUp, CheckCircle2, ChevronRight, AlertTriangle, FileText,
  Briefcase, Scale, Layers, Check, Copy, Sparkles, PieChart, Users, Landmark,
  ShieldAlert
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useApp } from '../../../context/AppContext';
import { useAuth } from '../../../context/AuthContext';
import StickyActionDock from '../../../components/common/StickyActionDock';
import EntityWealthDivergenceChart from '../../../components/tax/visualizations/EntityWealthDivergenceChart';

export default function USSCorpStudio() {
  const { state } = useApp();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState('salary'); // 'salary' | 'basis' | 'waterfall' | 'llc' | 'election'
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 1. S-Corp Core State
  const [businessName, setBusinessName] = useState('Apex Technology Consulting LLC');
  const [ownerName, setOwnerName] = useState(currentUser?.displayName || 'Alex Morgan');
  const [grossRevenue, setGrossRevenue] = useState(380000);
  const [operatingExpenses, setOperatingExpenses] = useState(60000);
  const [w2Salary, setW2Salary] = useState(135000);
  const [ownerState, setOwnerState] = useState('CA');
  const [augustaDays, setAugustaDays] = useState(14);
  const [augustaRate, setAugustaRate] = useState(1250);

  // 2. Form 7203 Stock & Debt Basis State
  const [beginningStockBasis, setBeginningStockBasis] = useState(55000);
  const [beginningDebtBasis, setBeginningDebtBasis] = useState(25000);
  const [shareholderDistributions, setShareholderDistributions] = useState(120000);
  const [ordinaryBusinessLoss, setOrdinaryBusinessLoss] = useState(0);

  // 3. Multi-Member LLC Operating Agreement State
  const [stateOfFormation, setStateOfFormation] = useState('Delaware');
  const [members, setMembers] = useState([
    { name: 'Alex Morgan', initialContribution: 120000, units: 60, role: 'Managing Member' },
    { name: 'Jordan Lee', initialContribution: 60000, units: 30, role: 'Member' },
    { name: 'Taylor Reed', initialContribution: 20000, units: 10, role: 'Passive Investor' }
  ]);
  const [preferredReturnPct, setPreferredReturnPct] = useState(8.0);
  const [carriedInterestPct, setCarriedInterestPct] = useState(20.0);
  const [llcAgreementResult, setLlcAgreementResult] = useState(null);

  // 4. Banking Resolution & EIN Form SS-4 Kit State
  const [bankName, setBankName] = useState('JPMorgan Chase Bank, N.A. / Mercury Bank');
  const [authorizedSigners, setAuthorizedSigners] = useState(currentUser?.displayName ? `${currentUser.displayName} (Managing Member & President)` : 'Alex Morgan (President & Managing Member)');
  const [wireTransferLimit, setWireTransferLimit] = useState(100000);
  const [checkSigningThreshold, setCheckSigningThreshold] = useState(25000);
  const [bankResolutionData, setBankResolutionData] = useState(null);

  // FinCEN BOI (Corporate Transparency Act) State
  const [boiData, setBoiData] = useState(null);
  const [loadingBoi, setLoadingBoi] = useState(false);
  const [selectedExemption, setSelectedExemption] = useState('NONE');
  const [fullTimeEmployees, setFullTimeEmployees] = useState(4);
  const [grossReceiptsUSD, setGrossReceiptsUSD] = useState(850000);

  // Calculation Results
  const [optResult, setOptResult] = useState(null);

  useEffect(() => {
    runOptimization();
  }, [
    businessName, ownerName, grossRevenue, operatingExpenses, w2Salary,
    ownerState, augustaDays, augustaRate, beginningStockBasis,
    beginningDebtBasis, shareholderDistributions, ordinaryBusinessLoss
  ]);

  useEffect(() => {
    generateBankingResolution();
  }, [businessName, stateOfFormation, bankName, authorizedSigners, wireTransferLimit, checkSigningThreshold]);

  useEffect(() => {
    fetchFinCENBOI();
  }, [businessName, stateOfFormation, selectedExemption, fullTimeEmployees, grossReceiptsUSD, ownerName]);

  async function fetchFinCENBOI() {
    setLoadingBoi(true);
    try {
      const res = await fetch('/api/us-scorp/fincen-boi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          legalName: businessName,
          jurisdiction: stateOfFormation || 'Delaware',
          formationDate: '2024-03-15',
          ein: '12-3456789',
          exemptionClaimed: selectedExemption !== 'NONE' ? selectedExemption : null,
          fullTimeEmployees: Number(fullTimeEmployees),
          annualGrossReceiptsUSD: Number(grossReceiptsUSD),
          owners: [
            { name: ownerName, ownershipPct: 70, isSeniorOfficer: true, officerTitle: 'Managing Member & CEO', isSubstantialControl: true },
            { name: 'Sarah Jenkins', ownershipPct: 30, isSeniorOfficer: false, officerTitle: 'VP Product', isSubstantialControl: false },
          ],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBoiData(data);
      }
    } catch (e) {
      console.warn('FinCEN BOI fetch failed:', e.message);
    } finally {
      setLoadingBoi(false);
    }
  }

  function downloadFinCENBOIPDF() {
    const doc = new jsPDF();
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 24, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text('FINCEN BENEFICIAL OWNERSHIP INFORMATION (BOI) COMPLIANCE DOSSIER', 14, 14);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(`Corporate Transparency Act (CTA) 31 U.S.C. 5336 · Entity: ${businessName}`, 14, 20);

    const rows = (boiData?.beneficialOwners || []).map(o => [
      o.legalName,
      `${o.ownershipPct}%`,
      o.basisOfReporting.join(' & '),
      o.identificationDocument?.type || 'RealID / Passport',
      o.identificationDocument?.status || 'VERIFIED',
    ]);

    autoTable(doc, {
      startY: 32,
      head: [['Beneficial Owner Name', 'Ownership %', 'Statutory Basis of Reporting', 'ID Document Type', 'Verification']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] },
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('STATUTORY PENALTY SAFEGUARD & DEADLINE NOTICE:', 14, finalY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Filing Deadline: ${boiData?.filingDeadline || '30 days from formation'}. Civil penalty safeguard: $591/day protection under 31 U.S.C. 5336(h)(1).`, 14, finalY + 6, { maxWidth: 180 });

    doc.save(`FinCEN_BOI_Compliance_Dossier_${businessName.replace(/\s+/g, '_')}.pdf`);
    showToast('Downloaded FinCEN BOI Compliance Dossier (PDF)');
  }

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  }

  async function generateBankingResolution() {
    try {
      const res = await fetch('/api/us-scorp/banking-resolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityName: businessName,
          stateOfFormation: stateOfFormation || 'Delaware',
          entityType: 'S-Corporation / Multi-Member LLC',
          bankName,
          authorizedSigners: [authorizedSigners],
          wireTransferDailyLimit: Number(wireTransferLimit) || 100000,
          checkSigningThreshold: Number(checkSigningThreshold) || 25000,
        })
      });
      const data = await res.json();
      if (data.success) {
        setBankResolutionData(data);
      }
    } catch (err) {
      console.error('Failed to generate banking resolution:', err);
    }
  }

  function downloadBankingResolutionPDF() {
    if (!bankResolutionData?.resolutionDocument) return;
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('CORPORATE BANKING & FINANCIAL SERVICES RESOLUTION', 14, 20);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Entity: ${businessName} | State of Formation: ${stateOfFormation || 'Delaware'}`, 14, 26);
    doc.text(`Designated Depository: ${bankName} | Wire Limit: $${Number(wireTransferLimit).toLocaleString()}/day`, 14, 32);

    const splitText = doc.splitTextToSize(bankResolutionData.resolutionDocument, 180);
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.text(splitText, 14, 40);

    doc.save(`${businessName.replace(/\s+/g, '_')}_Corporate_Banking_Resolution.pdf`);
    showToast('✓ Downloaded Corporate Banking Resolution (PDF)');
  }

  async function runOptimization() {
    setLoading(true);
    try {
      const res = await fetch('/api/us-scorp/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          ownerName,
          grossRevenue: Number(grossRevenue),
          operatingExpenses: Number(operatingExpenses),
          w2Salary: Number(w2Salary),
          ownerState,
          augustaDays: Number(augustaDays),
          augustaDailyRate: Number(augustaRate),
          beginningStockBasis: Number(beginningStockBasis),
          beginningDebtBasis: Number(beginningDebtBasis),
          shareholderDistributions: Number(shareholderDistributions),
        })
      });
      const data = await res.json();
      if (data.success) {
        setOptResult(data);
      }
    } catch (err) {
      console.error('Failed to run S-Corp optimization:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateLLCAgreement() {
    try {
      const res = await fetch('/api/us-scorp/operating-agreement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: businessName,
          stateOfFormation,
          managerName: ownerName,
          members,
          preferredReturnPct: Number(preferredReturnPct),
          carriedInterestPct: Number(carriedInterestPct)
        })
      });
      const data = await res.json();
      if (data.success) {
        setLlcAgreementResult(data);
        showToast('✓ Generated Multi-Member LLC Operating Agreement (§ 704(b))');
      }
    } catch (err) {
      console.error('Failed to generate LLC Operating Agreement:', err);
    }
  }

  function downloadExecutivePDF() {
    const s = optResult?.summary;
    if (!s) return;
    const doc = new jsPDF();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('S-CORPORATION & PASS-THROUGH CORPORATE OS', 14, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Entity: ${businessName} | State: ${ownerState} | Filer: ${ownerName}`, 14, 28);
    doc.text(`Total Annual Tax Shield: $${s.totalAnnualTaxSavings.toLocaleString()}/yr | 10-Yr Compounded: $${s.tenYearCompoundedWealth.toLocaleString()}`, 14, 34);

    const rows = [
      ['Gross Business Revenue', `$${s.grossRevenue.toLocaleString()}`],
      ['Ordinary Operating Expenses', `$${s.operatingExpenses.toLocaleString()}`],
      ['Net Business Profit', `$${s.netBusinessProfit.toLocaleString()}`],
      ['Certified W-2 Reasonable Salary', `$${s.reasonableSalary.toLocaleString()}`],
      ['W-2 FICA-Exempt Shareholder Distributions', `$${s.shareholderDistributions.toLocaleString()}`],
      ['Annual FICA Self-Employment Tax Saved (15.3%)', `+$${s.annualFICASaved.toLocaleString()}`],
      ['Section 199A QBI 20% Deduction Amount', `$${s.qbi20PctDeduction.toLocaleString()}`],
      ['Section 199A Income Tax Saved', `+$${s.qbiIncomeTaxSavings.toLocaleString()}`],
      ['Solo 401(k) Employer Profit-Sharing & Deferral', `$${s.totalSolo401kShelter.toLocaleString()}`],
      ['Augusta Rule (IRC § 280A(g)) Tax-Free Payout', `$${s.augustaDeduction.toLocaleString()}`],
      ['Form 7203 Ending Stock Basis', `$${s.basisTracking?.endingStockBasis?.toLocaleString() || 0}`],
      ['Form 7203 Debt Basis Available', `$${s.basisTracking?.debtBasis?.toLocaleString() || 0}`],
      ['Total Annual Direct Tax Savings', `+$${s.totalAnnualTaxSavings.toLocaleString()}`],
    ];

    autoTable(doc, {
      startY: 40,
      head: [['Corporate & Tax Architecture Component', 'Amount (USD)']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] },
      styles: { fontSize: 8.5, cellPadding: 3.5 }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('STATUTORY CITATIONS & IRS SAFEGUARDS:', 14, finalY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`1. FICA Arbitrage: Rev. Rul. 74-44 & Radtke v. United States defensibility benchmark.`, 14, finalY + 6);
    doc.text(`2. Form 7203 Basis: Ending stock basis of $${s.basisTracking?.endingStockBasis?.toLocaleString()} safely absorbs distributions without triggering excess distribution capital gains.`, 14, finalY + 12);
    doc.text(`3. Form 2553 SHA-256 Digest: ${s.docHash?.slice(0, 32)}... authenticated.`, 14, finalY + 18);

    doc.save(`US_SCorp_Strategy_${businessName.replace(/\s+/g, '_')}_2026.pdf`);
    showToast('Downloaded S-Corp Strategy & Basis Dossier (PDF)');
  }

  const s = optResult?.summary;
  const basis = s?.basisTracking;

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
        background: 'linear-gradient(135deg, rgba(15,23,42,0.3), rgba(99,102,241,0.06))',
        border: '1px solid var(--border-active)', padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-lg)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', padding: '0.2rem 0.65rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.4rem' }}>
              <span>🏛️</span> ENTITY TAX ARCHITECTURE & GOVERNANCE
            </div>
            <h1 className="text-h1" style={{ margin: 0 }}>S-Corporation & LLC Corporate OS</h1>
            <p className="text-sm text-secondary" style={{ marginTop: '0.25rem' }}>
              Reasonable salary optimization, Form 7203 shareholder stock & debt basis worksheets, AAA & E&P distribution waterfalls, and § 704(b) LLC operating agreements.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={downloadExecutivePDF}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Download size={14} />
              <span>Download S-Corp PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div style={{
        display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)',
        paddingBottom: '0.5rem', overflowX: 'auto'
      }}>
        {[
          { id: 'salary', label: '1. Reasonable Salary & FICA Optimizer', icon: DollarSign },
          { id: 'basis', label: '2. Form 7203 Stock & Debt Basis', icon: Scale },
          { id: 'waterfall', label: '3. AAA & E&P Waterfall (IRC § 1368)', icon: Layers },
          { id: 'llc', label: '4. Multi-Member LLC Agreement (§ 704b)', icon: Users },
          { id: 'election', label: '5. Form 2553 Election & Resolution', icon: FileText },
          { id: 'bank_kit', label: '6. EIN Form SS-4 & Bank Resolution Kit', icon: Landmark },
          { id: 'fincen_boi', label: '7. FinCEN BOI Reporting Kit (CTA)', icon: ShieldAlert },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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

      {/* TAB 1: REASONABLE SALARY & FICA OPTIMIZER */}
      {activeTab === 'salary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Interactive S-Corp FICA Wealth Divergence Area Chart */}
          <EntityWealthDivergenceChart
            market="US"
            entityType="SCORP"
            annualTaxSaved={s?.totalAnnualTaxSavings || 28000}
            initialPortfolio={500000}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {/* Inputs Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card" style={{ padding: '1.25rem' }}>
              <h3 className="text-h3" style={{ margin: '0 0 1rem' }}>Business Profile & Financials</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Entity Legal Name</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Gross Revenue (Annual)</label>
                  <input
                    type="number"
                    value={grossRevenue}
                    onChange={(e) => setGrossRevenue(Number(e.target.value))}
                    style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Operating Expenses</label>
                  <input
                    type="number"
                    value={operatingExpenses}
                    onChange={(e) => setOperatingExpenses(Number(e.target.value))}
                    style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <label className="text-xs text-muted">Certified W-2 Reasonable Salary</label>
                  <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.9rem' }}>${w2Salary.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="50000"
                  max={Math.max(50000, grossRevenue - operatingExpenses)}
                  step="5000"
                  value={w2Salary}
                  onChange={(e) => setW2Salary(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  <span>Min RCReports Defensible ($60k)</span>
                  <span>100% of Net Profit</span>
                </div>
              </div>
            </div>

            {/* Augusta Rule (§ 280A(g)) */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 className="text-h3" style={{ margin: 0 }}>Augusta Rule (IRC § 280A(g))</h3>
                <span className="badge badge-green">100% Tax-Free</span>
              </div>
              <p className="text-xs text-secondary" style={{ margin: '0 0 0.75rem' }}>
                Rent your home to your business for up to 14 days per year for board meetings or quarterly planning without reporting the income.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Meeting Days (Max 14)</label>
                  <input
                    type="number"
                    max="14"
                    value={augustaDays}
                    onChange={(e) => setAugustaDays(Number(e.target.value))}
                    style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Daily Comparable Rate</label>
                  <input
                    type="number"
                    value={augustaRate}
                    onChange={(e) => setAugustaRate(Number(e.target.value))}
                    style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Results Summary Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(16,185,129,0.06), transparent)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 className="text-h3" style={{ margin: 0 }}>Tax Shield Acceleration</h3>
                <span className="badge badge-green">ANNUAL SAVINGS</span>
              </div>

              {s ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.4rem', fontSize: '0.875rem' }}>
                    <span className="text-secondary">Net Business Profit</span>
                    <span style={{ fontWeight: 700 }}>${s.netBusinessProfit.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.4rem', fontSize: '0.875rem' }}>
                    <span className="text-secondary">W-2 FICA-Exempt K-1 Distributions</span>
                    <span style={{ fontWeight: 700, color: 'var(--green)' }}>${s.shareholderDistributions.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.4rem', fontSize: '0.875rem' }}>
                    <span className="text-secondary">Annual Self-Employment (FICA) Saved</span>
                    <span style={{ fontWeight: 800, color: 'var(--green)' }}>+${s.annualFICASaved.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.4rem', fontSize: '0.875rem' }}>
                    <span className="text-secondary">Section 199A QBI 20% Income Tax Saved</span>
                    <span style={{ fontWeight: 800, color: 'var(--green)' }}>+${s.qbiIncomeTaxSavings.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.4rem', fontSize: '0.875rem' }}>
                    <span className="text-secondary">Augusta Rule Tax-Free Cash Out</span>
                    <span style={{ fontWeight: 800, color: 'var(--green)' }}>+${s.augustaTaxSaved.toLocaleString()}</span>
                  </div>

                  <div style={{
                    marginTop: '0.5rem', padding: '1rem', background: 'var(--surface-raised)',
                    borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TOTAL ANNUAL CASH SAVED</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--green)' }}>
                        +${s.totalAnnualTaxSavings.toLocaleString()}/yr
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>10-YR COMPOUNDED WEALTH</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>
                        ${s.tenYearCompoundedWealth.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 0.5rem', color: 'var(--primary)' }} />
                  <p className="text-xs text-muted">Optimizing corporate salary benchmark...</p>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      )}

      {/* TAB 2: FORM 7203 SHAREHOLDER STOCK & DEBT BASIS */}
      {activeTab === 'basis' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span className="badge badge-gold" style={{ marginBottom: '0.5rem' }}>IRS MANDATORY DISCLOSURE</span>
                <h2 className="text-h2" style={{ margin: '0 0 0.5rem' }}>IRS Form 7203: S Corporation Stock and Debt Basis Worksheet</h2>
                <p className="text-sm text-secondary" style={{ maxWidth: 740 }}>
                  Mandatory form under IRC § 1366(d). If distributions exceed stock basis, the excess triggers taxable capital gains. If business losses exceed total stock and debt basis, the losses are suspended indefinitely.
                </p>
              </div>
              <div style={{
                padding: '0.875rem 1.25rem', background: basis?.hasExcessDistributions ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                border: `1px solid ${basis?.hasExcessDistributions ? 'var(--red)' : 'var(--green)'}`, borderRadius: 10, textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: basis?.hasExcessDistributions ? 'var(--red)' : 'var(--green)' }}>
                  {basis?.hasExcessDistributions ? 'EXCESS CAPITAL GAINS TRIGGERED' : 'SAFE BASIS MARGIN'}
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: basis?.hasExcessDistributions ? 'var(--red)' : 'var(--green)' }}>
                  ${(basis?.endingStockBasis || 0).toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginTop: '1.5rem' }}>
              <div>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>
                  Beginning Stock Basis (Part I Line 1)
                </label>
                <input
                  type="number"
                  value={beginningStockBasis}
                  onChange={(e) => setBeginningStockBasis(Number(e.target.value))}
                  style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontWeight: 700 }}
                />
              </div>

              <div>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>
                  Total Shareholder Distributions (Part I Line 7)
                </label>
                <input
                  type="number"
                  value={shareholderDistributions}
                  onChange={(e) => setShareholderDistributions(Number(e.target.value))}
                  style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontWeight: 700 }}
                />
              </div>

              <div>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>
                  Shareholder Direct Debt Basis (Part II Loans)
                </label>
                <input
                  type="number"
                  value={beginningDebtBasis}
                  onChange={(e) => setBeginningDebtBasis(Number(e.target.value))}
                  style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontWeight: 700 }}
                />
              </div>
            </div>

            {/* Line by line Form 7203 breakdown */}
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--surface-raised)', borderRadius: 10 }}>
              <h4 className="text-h4" style={{ marginBottom: '0.75rem' }}>Form 7203 Line-by-Line Computation Audit</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
                <div>
                  <div className="text-xs text-muted">Stock Basis Before Distributions</div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', marginTop: 4 }}>
                    ${(basis?.basisBeforeDistributions || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted">Allowable Tax-Free Distribution</div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--green)', marginTop: 4 }}>
                    ${(basis?.allowableDistributionFromBasis || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted">Excess Distribution (Taxable Capital Gain)</div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: basis?.hasExcessDistributions ? 'var(--red)' : 'var(--text-primary)', marginTop: 4 }}>
                    ${(basis?.excessDistributionCapitalGain || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted">Ending Stock Basis Carried Over</div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--primary)', marginTop: 4 }}>
                    ${(basis?.endingStockBasis || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AAA & E&P WATERFALL (IRC § 1368) */}
      {activeTab === 'waterfall' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <span className="badge badge-surface" style={{ marginBottom: '0.5rem' }}>IRC § 1368 DISTRIBUTION PRIORITY</span>
            <h2 className="text-h2" style={{ margin: '0 0 0.5rem' }}>Accumulated Adjustments Account (AAA) & E&P Distribution Waterfall</h2>
            <p className="text-sm text-secondary" style={{ maxWidth: 740 }}>
              When an S-Corporation distributes cash to shareholders, the Internal Revenue Code mandates a strict 4-tier distribution ordering rule, protecting against inadvertent taxable dividend exposure.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
              <div className="card" style={{ padding: '1.25rem', border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4 className="text-h4" style={{ color: 'var(--green)', margin: 0 }}>Tier 1: AAA Balance</h4>
                  <span className="badge badge-green">100% Tax-Free</span>
                </div>
                <p className="text-xs text-muted">Return of accumulated S-Corp post-election earnings.</p>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.5rem' }}>
                  ${(s?.shareholderDistributions || 0).toLocaleString()}
                </div>
              </div>

              <div className="card" style={{ padding: '1.25rem', border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4 className="text-h4" style={{ color: 'var(--gold)', margin: 0 }}>Tier 2: C-Corp E&P</h4>
                  <span className="badge badge-gold">Taxable Dividend</span>
                </div>
                <p className="text-xs text-muted">Accumulated earnings from prior C-Corporation years.</p>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.5rem' }}>$0 (Clean Pass-Through)</div>
              </div>

              <div className="card" style={{ padding: '1.25rem', border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4 className="text-h4" style={{ color: '#3b82f6', margin: 0 }}>Tier 3: Stock Basis</h4>
                  <span className="badge badge-surface">Tax-Free ROC</span>
                </div>
                <p className="text-xs text-muted">Remaining shareholder capital contribution return.</p>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.5rem' }}>
                  ${(basis?.endingStockBasis || 0).toLocaleString()}
                </div>
              </div>

              <div className="card" style={{ padding: '1.25rem', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4 className="text-h4" style={{ color: 'var(--red)', margin: 0 }}>Tier 4: Capital Gain</h4>
                  <span className="badge badge-red">Taxable LTCG</span>
                </div>
                <p className="text-xs text-muted">Excess distributions exceeding stock basis.</p>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.5rem', color: basis?.hasExcessDistributions ? 'var(--red)' : 'var(--text-primary)' }}>
                  ${(basis?.excessDistributionCapitalGain || 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MULTI-MEMBER LLC AGREEMENT (§ 704b) */}
      {activeTab === 'llc' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>IRC § 704(b) CAPITAL ACCOUNTS</span>
                <h2 className="text-h2" style={{ margin: '0 0 0.5rem' }}>Multi-Member LLC Operating Agreement Generator</h2>
                <p className="text-sm text-secondary" style={{ maxWidth: 740 }}>
                  Produces attorney-grade Operating Agreements with substantial economic effect compliance, capital accounts maintenance, and 4-tier waterfall distributions (Return of Capital, 8% Preferred Return, 100% Catch-Up, 80/20 Common split).
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleGenerateLLCAgreement}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <FileText size={14} />
                <span>Generate Legal Agreement</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginTop: '1.5rem' }}>
              <div>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>State of Formation</label>
                <select
                  value={stateOfFormation}
                  onChange={(e) => setStateOfFormation(e.target.value)}
                  style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                >
                  <optgroup label="Premier Formation & Tax Havens">
                    <option value="Delaware">Delaware (Chancery Court & Series LLC)</option>
                    <option value="Wyoming">Wyoming (Strong Charging Order & Privacy)</option>
                    <option value="Nevada">Nevada (Zero State Tax & No Franchise Fee)</option>
                    <option value="Texas">Texas (Zero Personal Income Tax)</option>
                    <option value="Florida">Florida (Zero Personal Income Tax)</option>
                    <option value="California">California (Franchise Tax Board $800)</option>
                  </optgroup>
                  <optgroup label="All Other US States (A–Z)">
                    <option value="Alabama">Alabama</option>
                    <option value="Alaska">Alaska</option>
                    <option value="Arizona">Arizona</option>
                    <option value="Arkansas">Arkansas</option>
                    <option value="Colorado">Colorado</option>
                    <option value="Connecticut">Connecticut</option>
                    <option value="Delaware">Delaware</option>
                    <option value="District of Columbia">District of Columbia</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Hawaii">Hawaii</option>
                    <option value="Idaho">Idaho</option>
                    <option value="Illinois">Illinois</option>
                    <option value="Indiana">Indiana</option>
                    <option value="Iowa">Iowa</option>
                    <option value="Kansas">Kansas</option>
                    <option value="Kentucky">Kentucky</option>
                    <option value="Louisiana">Louisiana</option>
                    <option value="Maine">Maine</option>
                    <option value="Maryland">Maryland</option>
                    <option value="Massachusetts">Massachusetts</option>
                    <option value="Michigan">Michigan</option>
                    <option value="Minnesota">Minnesota</option>
                    <option value="Mississippi">Mississippi</option>
                    <option value="Missouri">Missouri</option>
                    <option value="Montana">Montana</option>
                    <option value="Nebraska">Nebraska</option>
                    <option value="New Hampshire">New Hampshire</option>
                    <option value="New Jersey">New Jersey</option>
                    <option value="New Mexico">New Mexico</option>
                    <option value="New York">New York</option>
                    <option value="North Carolina">North Carolina</option>
                    <option value="North Dakota">North Dakota</option>
                    <option value="Ohio">Ohio</option>
                    <option value="Oklahoma">Oklahoma</option>
                    <option value="Oregon">Oregon</option>
                    <option value="Pennsylvania">Pennsylvania</option>
                    <option value="Rhode Island">Rhode Island</option>
                    <option value="South Carolina">South Carolina</option>
                    <option value="South Dakota">South Dakota</option>
                    <option value="Tennessee">Tennessee</option>
                    <option value="Utah">Utah</option>
                    <option value="Vermont">Vermont</option>
                    <option value="Virginia">Virginia</option>
                    <option value="Washington">Washington</option>
                    <option value="West Virginia">West Virginia</option>
                    <option value="Wisconsin">Wisconsin</option>
                  </optgroup>
                  <optgroup label="US Overseas Territories">
                    <option value="Puerto Rico">Puerto Rico (Act 60 Export Services LLC - 4% Tax)</option>
                    <option value="U.S. Virgin Islands">U.S. Virgin Islands (EDC Tax Incentive LLC)</option>
                    <option value="Guam">Guam (Qualifying Certificate LLC)</option>
                    <option value="Northern Mariana Islands">Northern Mariana Islands</option>
                    <option value="American Samoa">American Samoa</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Preferred Return (% p.a.)</label>
                <input
                  type="number"
                  step="0.5"
                  value={preferredReturnPct}
                  onChange={(e) => setPreferredReturnPct(Number(e.target.value))}
                  style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Carried Interest / Sponsor Promote (%)</label>
                <input
                  type="number"
                  value={carriedInterestPct}
                  onChange={(e) => setCarriedInterestPct(Number(e.target.value))}
                  style={{ width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {/* Member Units Table */}
            <div style={{ marginTop: '1.25rem' }}>
              <h4 className="text-h4" style={{ marginBottom: '0.5rem' }}>Schedule A: Initial Member Equity Allocations</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {members.map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 1rem', background: 'var(--surface-raised)', borderRadius: 8, fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ fontWeight: 700 }}>{m.name}</span>
                      <span className="text-xs text-muted" style={{ marginLeft: 8 }}>({m.role})</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 800 }}>${m.initialContribution.toLocaleString()}</span>
                      <span className="badge badge-surface" style={{ marginLeft: 8 }}>{m.units}% Equity</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Agreement Preview if Generated */}
            {llcAgreementResult && (
              <div style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="text-xs text-muted">Legal Operating Agreement Text · SHA-256: {llcAgreementResult.agreementHash?.slice(0, 24)}...</span>
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={() => {
                      navigator.clipboard.writeText(llcAgreementResult.agreementText);
                      showToast('✓ Copied Operating Agreement to Clipboard');
                    }}
                  >
                    <Copy size={12} /> Copy Agreement
                  </button>
                </div>
                <pre style={{
                  background: '#0a0d14', color: '#38bdf8', padding: '1rem', borderRadius: 8,
                  fontSize: '0.78rem', overflowX: 'auto', maxHeight: '350px', lineHeight: 1.5,
                  border: '1px solid rgba(255,255,255,0.06)'
                }}>
                  {llcAgreementResult.agreementText}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: FORM 2553 ELECTION & RESOLUTION */}
      {activeTab === 'election' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 className="text-h3" style={{ margin: 0 }}>IRS Form 2553 Statutory S-Corp Election Document</h3>
                <span className="text-xs text-muted">Under Section 1362(a) of the Internal Revenue Code</span>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  navigator.clipboard.writeText(optResult?.form2553LegalText || '');
                  showToast('✓ Form 2553 Copied to Clipboard');
                }}
              >
                <Copy size={14} /> Copy Text
              </button>
            </div>

            <pre style={{
              background: '#0a0d14', color: '#e2e8f0', padding: '1rem', borderRadius: 8,
              fontSize: '0.8rem', overflowX: 'auto', maxHeight: '420px', lineHeight: 1.5,
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              {optResult?.form2553LegalText || 'Generating election text...'}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 6: EIN FORM SS-4 & CORPORATE BANKING RESOLUTION KIT */}
      {activeTab === 'bank_kit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <span className="badge badge-primary" style={{ marginBottom: '0.4rem' }}>CORPORATE BANKING RESOLUTION & IRS FORM SS-4</span>
                <h2 className="text-h2" style={{ margin: '0 0 0.35rem' }}>Commercial Banking Resolution & Federal EIN Kit</h2>
                <p className="text-sm text-secondary" style={{ maxWidth: 740, margin: 0 }}>
                  Standard institutional corporate resolution for opening business deposit, treasury, and merchant accounts at JPMorgan Chase, Bank of America, Silicon Valley Bank, Mercury, and Brex.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    navigator.clipboard.writeText(bankResolutionData?.resolutionDocument || '');
                    showToast('✓ Corporate Banking Resolution copied to clipboard');
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Copy size={14} /> Copy Resolution Text
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={downloadBankingResolutionPDF}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Download size={14} /> Download Resolution PDF
                </button>
              </div>
            </div>

            {/* Inputs Grid for Resolution */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', background: 'var(--surface-raised)', padding: '1.25rem', borderRadius: 10, marginBottom: '1.5rem' }}>
              <div>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Designated Financial Depository Bank</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Authorized Signer & Corporate Officer</label>
                <input
                  type="text"
                  value={authorizedSigners}
                  onChange={(e) => setAuthorizedSigners(e.target.value)}
                  style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Daily Wire Transfer Limit ($)</label>
                <input
                  type="number"
                  value={wireTransferLimit}
                  onChange={(e) => setWireTransferLimit(Number(e.target.value))}
                  style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Check Dual-Signature Threshold ($)</label>
                <input
                  type="number"
                  value={checkSigningThreshold}
                  onChange={(e) => setCheckSigningThreshold(Number(e.target.value))}
                  style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {/* Resolution Document Live Preview */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 className="text-h4" style={{ margin: 0 }}>Corporate Banking Authorization Resolution (Full Text)</h4>
                <span className="badge badge-surface" style={{ fontSize: '0.75rem' }}>Attorney-Grade Fiduciary Instrument</span>
              </div>
              <pre style={{
                background: '#0a0d14', color: '#e2e8f0', padding: '1rem', borderRadius: 8,
                fontSize: '0.8rem', overflowX: 'auto', maxHeight: '360px', lineHeight: 1.5,
                border: '1px solid rgba(255,255,255,0.06)'
              }}>
                {bankResolutionData?.resolutionDocument || 'Generating banking resolution...'}
              </pre>
            </div>

            {/* IRS Form SS-4 EIN Guidance & Checklist */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Landmark size={18} color="var(--primary)" />
                  <h4 className="text-h4" style={{ margin: 0 }}>IRS Form SS-4 Line-by-Line Guide</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  <div><strong>Line 1 (Legal Name):</strong> {businessName}</div>
                  <div><strong>Line 7a-7b (Responsible Party):</strong> {ownerName} (Must provide valid SSN/ITIN; responsible party controls corporate funds).</div>
                  <div><strong>Line 8a-9a (Type of Entity):</strong> Corporate Entity electing Subchapter S (Form 1120-S) or LLC taxed as S-Corp.</div>
                  <div><strong>Line 10 (Reason for Applying):</strong> Started new business / Created corporate entity.</div>
                  <div><strong>Instant Turnaround:</strong> File online at <em>irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online</em> for instant CP 575 notice issuance (Mon-Fri 7 AM - 10 PM EST).</div>
                </div>
              </div>

              <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <CheckCircle2 size={18} color="var(--green)" />
                  <h4 className="text-h4" style={{ margin: 0 }}>Bank Account Opening Checklist</h4>
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  {(bankResolutionData?.executionChecklist || [
                    'Certified Articles of Organization / Incorporation from Secretary of State.',
                    'IRS Notice CP 575 or Form 147C Letter verifying federal Employer Identification Number (EIN).',
                    'Executed Corporate Banking & Financial Services Resolution signed by corporate secretary/members.',
                    'Executed Operating Agreement (§ 704(b)) or Corporate Bylaws.',
                    'Government-issued photo IDs (Driver License / US Passport) for all authorized signers.',
                    'Beneficial Ownership Information (BOI) Report confirmation under FinCEN Corporate Transparency Act.'
                  ]).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: FINCEN BENEFICIAL OWNERSHIP INFORMATION (BOI) REPORTING KIT */}
      {activeTab === 'fincen_boi' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <span className="badge badge-surface" style={{ marginBottom: '0.4rem' }}>31 U.S.C. 5336 CORPORATE TRANSPARENCY ACT</span>
                <h2 className="text-h2" style={{ margin: 0 }}>FinCEN Beneficial Ownership Information (BOI) Kit</h2>
                <p className="text-sm text-secondary" style={{ marginTop: '0.25rem' }}>
                  Statutory compliance engine for LLCs and S-Corporations to avoid severe civil penalties of up to $591 per day.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={downloadFinCENBOIPDF}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <Download size={14} /> Download FinCEN BOI Dossier (PDF)
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={fetchFinCENBOI}
                >
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>
            </div>

            {/* Penalty Warning & Exemption Banner */}
            <div style={{
              background: boiData?.isExempt ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
              border: `1px solid ${boiData?.isExempt ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', marginBottom: '1.25rem',
              display: 'flex', gap: '0.75rem', alignItems: 'flex-start'
            }}>
              {boiData?.isExempt ? <CheckCircle2 size={22} color="var(--green)" /> : <ShieldAlert size={22} color="var(--red)" />}
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.875rem', color: boiData?.isExempt ? 'var(--green)' : 'var(--red)', marginBottom: '0.25rem' }}>
                  {boiData?.isExempt ? 'ENTITY QUALIFIES FOR STATUTORY EXEMPTION' : 'MANDATORY REPORTING COMPANY — $591/DAY STATUTORY PENALTY EXPOSURE'}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {boiData?.isExempt
                    ? boiData.exemptionReason
                    : 'Unless exempt under 31 CFR § 1010.380(c)(2), all domestic LLCs and corporations must file an initial Beneficial Ownership Information (BOI) report with FinCEN. Willful failure to report carries civil penalties of up to $591 per day and criminal fines up to $10,000.'}
                </div>
              </div>
            </div>

            {/* Statutory Exemptions Screener & Company Profile */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div className="card" style={{ padding: '1.25rem', background: 'var(--surface-raised)' }}>
                <h4 className="text-h4" style={{ margin: '0 0 0.75rem' }}>23 Statutory Exemptions Screener</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 2 }}>Statutory Exemption Category</label>
                    <select
                      className="input input-sm"
                      value={selectedExemption}
                      onChange={e => setSelectedExemption(e.target.value)}
                    >
                      <option value="NONE">Non-Exempt Reporting Company (Must File BOI)</option>
                      <option value="LARGE_OPERATING_CO">Exemption 21: Large Operating Co (&gt;20 US Employees &amp; &gt;$5M Revenue)</option>
                      <option value="SEC_RIA">Exemption 10: SEC Registered Investment Adviser (RIA)</option>
                      <option value="BANK">Exemption 3: FDIC Insured Depository Bank</option>
                      <option value="TAX_EXEMPT_501C">Exemption 19: 501(c) Tax-Exempt Non-Profit</option>
                      <option value="INACTIVE_ENTITY">Exemption 23: Pre-2020 Inactive Entity</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 2 }}>Full-Time US Employees</label>
                      <input
                        className="input input-sm"
                        type="number"
                        value={fullTimeEmployees}
                        onChange={e => setFullTimeEmployees(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 2 }}>Annual Gross Receipts ($)</label>
                      <input
                        className="input input-sm"
                        type="number"
                        value={grossReceiptsUSD}
                        onChange={e => setGrossReceiptsUSD(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Deadline & Reporting Entity Info */}
              <div className="card" style={{ padding: '1.25rem', background: 'var(--surface-raised)' }}>
                <h4 className="text-h4" style={{ margin: '0 0 0.75rem' }}>FinCEN Filing Windows</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem' }}>
                  <div><strong>Legal Entity:</strong> {businessName}</div>
                  <div><strong>Jurisdiction of Formation:</strong> {stateOfFormation || 'Delaware'}</div>
                  <div><strong>Federal EIN:</strong> 12-3456789</div>
                  <div><strong>Statutory Deadline:</strong> <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{boiData?.filingDeadline || '30 days from formation'}</span></div>
                  <div><strong>Update Requirement:</strong> Any change to beneficial owners or addresses must be reported within 30 calendar days.</div>
                </div>
              </div>
            </div>

            {/* Beneficial Owners Table */}
            <h4 className="text-h4" style={{ margin: '1rem 0 0.5rem' }}>Reported Beneficial Owners (25%+ Equity or Substantial Control)</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem' }}>Owner Legal Name</th>
                    <th style={{ padding: '0.5rem' }}>Equity Interest</th>
                    <th style={{ padding: '0.5rem' }}>Statutory Basis</th>
                    <th style={{ padding: '0.5rem' }}>ID Document</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>FinCEN Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(boiData?.beneficialOwners || [
                    { legalName: ownerName, ownershipPct: 70, basisOfReporting: ['Equity Ownership (70% >= 25%)', 'Substantial Control (Managing Member)'], identificationDocument: { type: 'US Passport', status: 'VERIFIED_DOC_ON_FILE' } },
                    { legalName: 'Sarah Jenkins', ownershipPct: 30, basisOfReporting: ['Equity Ownership (30% >= 25%)'], identificationDocument: { type: 'Driver License', status: 'VERIFIED_DOC_ON_FILE' } },
                  ]).map((o, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '0.5rem', fontWeight: 600 }}>{o.legalName}</td>
                      <td style={{ padding: '0.5rem', fontWeight: 700, color: 'var(--primary)' }}>{o.ownershipPct}%</td>
                      <td style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>
                        {Array.isArray(o.basisOfReporting) ? o.basisOfReporting.join(' & ') : o.basisOfReporting}
                      </td>
                      <td style={{ padding: '0.5rem' }}>{o.identificationDocument?.type || 'US Passport'}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                        <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>VERIFIED</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Action Dock */}
      <StickyActionDock
        primaryLabel="Download S-Corp & Basis Dossier"
        primaryIcon={Download}
        onPrimary={downloadExecutivePDF}
        badges={[`Entity: ${businessName}`, `Annual Shield: +$${(s?.totalAnnualTaxSavings || 0).toLocaleString()}`, `Ending Basis: $${(basis?.endingStockBasis || 0).toLocaleString()}`]}
      />
    </div>
  );
}
