// src/pages/consumer/us/USMortgageRefi.jsx
// Institutional US Mortgage Architecture, FHFA Conforming/Jumbo Engine, Points NPV,
// SOFR ARM Shock Simulator, RESPA § 10 Escrow Auditor & FCRA § 609 / § 611 Certified Credit Dispute Studio

import React, { useState, useEffect } from 'react';
import {
  Home, Sparkles, Download, ArrowRight, ShieldCheck, AlertCircle, Copy, Check,
  DollarSign, Calculator, Layers, AlertTriangle, FileText, Send, CheckCircle2,
  TrendingDown, TrendingUp, Sliders, Landmark, Scale, HelpCircle
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useApp } from '../../../context/AppContext';
import { buildPMICancellationLetterPDF } from '../../../utils/fiduciaryPdfBuilder';

const PRESET_COUNTIES = [
  'San Francisco, CA',
  'Santa Clara, CA',
  'San Mateo, CA',
  'Marin, CA',
  'Alameda, CA',
  'Contra Costa, CA',
  'Los Angeles, CA',
  'Orange, CA',
  'San Diego, CA',
  'New York (Manhattan), NY',
  'Kings (Brooklyn), NY',
  'Queens, NY',
  'Westchester, NY',
  'Bergen, NJ',
  'King (Seattle), WA',
  'Suffolk (Boston), MA',
  'Boulder, CO',
  'District of Columbia, DC',
  'Arlington, VA',
  'Honolulu, HI',
  'Standard Baseline County ($766,550)'
];

export default function USMortgageRefi() {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState('pmi'); // 'pmi' | 'fhfa' | 'points' | 'arm' | 'escrow' | 'fcra'

  // Tab 1: PMI & Refinance State
  const [homeValue, setHomeValue] = useState(950000);
  const [mortgageBalance, setMortgageBalance] = useState(742000);
  const [interestRate, setInterestRate] = useState(6.625);
  const [monthlyPMI, setMonthlyPMI] = useState(195);
  const [lenderName, setLenderName] = useState('Wells Fargo Home Mortgage');
  const [accountNo, setAccountNo] = useState('WF-89102482');
  const [selectedCounty, setSelectedCounty] = useState('Santa Clara, CA');
  const [auditData, setAuditData] = useState(null);
  const [copiedPMI, setCopiedPMI] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Tab 2: Points NPV State
  const [pointsLoanAmount, setPointsLoanAmount] = useState(750000);
  const [pointsBaseRate, setPointsBaseRate] = useState(6.875);
  const [pointsBought, setPointsBought] = useState(1.5);
  const [rateDropPerPoint, setRateDropPerPoint] = useState(0.25);
  const [pointsTaxBracket, setPointsTaxBracket] = useState(32);
  const [pointsDiscountRate, setPointsDiscountRate] = useState(5.0);
  const [isPurchaseLoan, setIsPurchaseLoan] = useState(true);
  const [pointsHoldingYears, setPointsHoldingYears] = useState(7);
  const [pointsResult, setPointsResult] = useState(null);
  const [loadingPoints, setLoadingPoints] = useState(false);

  // Tab 3: SOFR ARM Shock State
  const [armLoanAmount, setArmLoanAmount] = useState(800000);
  const [armInitialRate, setArmInitialRate] = useState(5.875);
  const [armType, setArmType] = useState('5/1');
  const [sofrBenchmark, setSofrBenchmark] = useState(4.85);
  const [armMargin, setArmMargin] = useState(2.75);
  const [armResult, setArmResult] = useState(null);
  const [loadingArm, setLoadingArm] = useState(false);

  // Tab 4: RESPA Escrow State
  const [escrowPropertyTax, setEscrowPropertyTax] = useState(10800);
  const [escrowHazardIns, setEscrowHazardIns] = useState(1800);
  const [escrowCurrentBal, setEscrowCurrentBal] = useState(3850);
  const [escrowResult, setEscrowResult] = useState(null);
  const [copiedEscrow, setCopiedEscrow] = useState(false);
  const [loadingEscrow, setLoadingEscrow] = useState(false);

  // Tab 5: FCRA Dispute State
  const [fcraBureau, setFcraBureau] = useState('experian');
  const [fcraCreditor, setFcraCreditor] = useState('JPMorgan Chase Bank');
  const [fcraAccountNo, setFcraAccountNo] = useState('CH-99201948');
  const [fcraReason, setFcraReason] = useState('INACCURATE_30_DAY_LATE_PAYMENT');
  const [fcraTracking, setFcraTracking] = useState('7021 0950 0001 9842 5519');
  const [fcraResult, setFcraResult] = useState(null);
  const [copiedFCRA, setCopiedFCRA] = useState(false);
  const [loadingFCRA, setLoadingFCRA] = useState(false);

  // Auto-run audits on parameter change
  useEffect(() => {
    runMortgageAudit();
  }, [homeValue, mortgageBalance, interestRate, monthlyPMI, selectedCounty]);

  useEffect(() => {
    runPointsCalculation();
  }, [pointsLoanAmount, pointsBaseRate, pointsBought, rateDropPerPoint, pointsTaxBracket, pointsDiscountRate, isPurchaseLoan, pointsHoldingYears]);

  useEffect(() => {
    runArmSimulation();
  }, [armLoanAmount, armInitialRate, armType, sofrBenchmark, armMargin]);

  useEffect(() => {
    runEscrowAudit();
  }, [escrowPropertyTax, escrowHazardIns, escrowCurrentBal]);

  useEffect(() => {
    runFCRAGeneration();
  }, [fcraBureau, fcraCreditor, fcraAccountNo, fcraReason, fcraTracking]);

  async function runMortgageAudit() {
    setLoadingAudit(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/us-mortgage/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeMarketValueUSD: Number(homeValue),
          currentMortgageBalanceUSD: Number(mortgageBalance),
          currentInterestRatePct: Number(interestRate),
          monthlyPMIUSD: Number(monthlyPMI),
          lenderName,
          accountNumber: accountNo,
          county: selectedCounty,
        }),
      });
      const data = await res.json();
      if (data.success) setAuditData(data);
    } catch (err) {
      console.error('Mortgage audit error:', err);
    } finally {
      setLoadingAudit(false);
    }
  }

  async function runPointsCalculation() {
    setLoadingPoints(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/us-mortgage/points-npv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loanAmount: Number(pointsLoanAmount),
          baseRatePct: Number(pointsBaseRate),
          pointsPurchased: Number(pointsBought),
          rateReductionPerPoint: Number(rateDropPerPoint),
          marginalTaxBracket: Number(pointsTaxBracket),
          discountRatePct: Number(pointsDiscountRate),
          isPurchase: isPurchaseLoan,
          holdingYears: Number(pointsHoldingYears),
        }),
      });
      const data = await res.json();
      if (data.success) setPointsResult(data);
    } catch (err) {
      console.error('Points NPV calculation error:', err);
    } finally {
      setLoadingPoints(false);
    }
  }

  async function runArmSimulation() {
    setLoadingArm(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/us-mortgage/arm-shock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loanAmount: Number(armLoanAmount),
          initialRatePct: Number(armInitialRate),
          armType,
          sofrIndexPct: Number(sofrBenchmark),
          marginPct: Number(armMargin),
        }),
      });
      const data = await res.json();
      if (data.success) setArmResult(data);
    } catch (err) {
      console.error('ARM simulation error:', err);
    } finally {
      setLoadingArm(false);
    }
  }

  async function runEscrowAudit() {
    setLoadingEscrow(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/us-mortgage/escrow-audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annualPropertyTax: Number(escrowPropertyTax),
          annualHazardInsurance: Number(escrowHazardIns),
          currentEscrowBalance: Number(escrowCurrentBal),
          servicerName: lenderName,
          accountNumber: accountNo,
        }),
      });
      const data = await res.json();
      if (data.success) setEscrowResult(data);
    } catch (err) {
      console.error('Escrow audit error:', err);
    } finally {
      setLoadingEscrow(false);
    }
  }

  async function runFCRAGeneration() {
    setLoadingFCRA(true);
    const userName = state?.consumer?.user?.name || 'Alex Chen';
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/us-mortgage/fcra-dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consumerName: userName,
          consumerAddress: '100 University Ave, Palo Alto, CA 94301',
          ssnLast4: '4821',
          dob: '1988-06-14',
          bureau: fcraBureau,
          creditorName: fcraCreditor,
          accountNumber: fcraAccountNo,
          disputeReason: fcraReason,
          certifiedMailTracking: fcraTracking,
        }),
      });
      const data = await res.json();
      if (data.success) setFcraResult(data);
    } catch (err) {
      console.error('FCRA letter error:', err);
    } finally {
      setLoadingFCRA(false);
    }
  }

  function handleCopyPMI() {
    if (!auditData?.pmiLetterText) return;
    navigator.clipboard.writeText(auditData.pmiLetterText);
    setCopiedPMI(true);
    setTimeout(() => setCopiedPMI(false), 2500);
  }

  function handleCopyEscrow() {
    if (!escrowResult?.refundDemandLetterText) return;
    navigator.clipboard.writeText(escrowResult.refundDemandLetterText);
    setCopiedEscrow(true);
    setTimeout(() => setCopiedEscrow(false), 2500);
  }

  function handleCopyFCRA() {
    if (!fcraResult?.letterText) return;
    navigator.clipboard.writeText(fcraResult.letterText);
    setCopiedFCRA(true);
    setTimeout(() => setCopiedFCRA(false), 2500);
  }

  function downloadLetterPDF() {
    const user = {
      name: state?.consumer?.user?.name || 'Alex Chen',
      email: state?.consumer?.user?.email || 'alex.chen@fiduciary.test'
    };

    try {
      const doc = buildPMICancellationLetterPDF({
        bankName: lenderName,
        loanAccount: accountNo,
        homeValue: Number(homeValue),
        outstandingBalance: Number(mortgageBalance),
        monthlyPMI: Number(monthlyPMI),
        creditScore: '782'
      }, user);
      doc.save(`PMI_Cancellation_Letter_${accountNo}.pdf`);
    } catch (err) {
      if (!auditData?.pmiLetterText) return;
      const doc = new jsPDF();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const splitText = doc.splitTextToSize(auditData.pmiLetterText, 180);
      doc.text(splitText, 14, 20);
      doc.save(`PMI_Cancellation_Letter_${accountNo}.pdf`);
    }
  }

  function downloadFCRAPDF() {
    if (!fcraResult?.letterText) return;
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('CERTIFIED STATUTORY DISPUTE NOTICE (FCRA § 609 / § 611)', 14, 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Tracking: ${fcraTracking} | Bureau: ${fcraBureau.toUpperCase()}`, 14, 27);
    doc.text('Statutory Authority: 15 U.S.C. § 1681i & 15 U.S.C. § 1681g', 14, 32);

    const splitText = doc.splitTextToSize(fcraResult.letterText, 180);
    doc.setFontSize(9.5);
    doc.text(splitText, 14, 42);
    doc.save(`FCRA_609_Dispute_Letter_${fcraAccountNo}.pdf`);
  }

  function downloadEscrowPDF() {
    if (!escrowResult?.refundDemandLetterText) return;
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('RESPA SECTION 10 ESCROW OVERAGE REFUND DEMAND', 14, 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Servicer: ${lenderName} | Loan Account: ${accountNo}`, 14, 27);
    doc.text('Statutory Authority: 12 U.S.C. § 2609 & 12 CFR § 1024.17', 14, 32);

    const splitText = doc.splitTextToSize(escrowResult.refundDemandLetterText, 180);
    doc.setFontSize(9.5);
    doc.text(splitText, 14, 42);
    doc.save(`RESPA_Section10_Escrow_Refund_${accountNo}.pdf`);
  }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(99, 102, 241, 0.06) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        padding: '1.75rem',
        borderRadius: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-green">🇺🇸 US Mortgage & Debt Architecture</span>
              <span className="badge badge-primary">FHFA · HPA · FCRA · RESPA</span>
            </div>
            <h1 className="text-h1" style={{ fontSize: '1.8rem', fontWeight: 800 }}>
              Mortgage Arbitrage, Credit & Debt Architecture
            </h1>
            <p className="text-secondary" style={{ marginTop: '0.25rem', maxWidth: 740 }}>
              Audit Loan-to-Value for statutory PMI removal (12 U.S.C. § 4902), verify 2026 FHFA Conforming vs. Jumbo county limits, compute mortgage discount points NPV under IRC § 461(g), simulate SOFR ARM rate shock caps, demand RESPA § 10 escrow refunds, and generate certified FCRA § 609 credit dispute letters.
            </p>
          </div>

          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--glass-border)',
            borderRadius: 12,
            padding: '1rem 1.25rem',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>2026 FHFA Conforming Ceiling</div>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--green)', fontFamily: 'Space Grotesk' }}>
              $1,149,825
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              Baseline: $766,550
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        paddingBottom: '0.5rem',
        borderBottom: '1px solid var(--glass-border)'
      }}>
        {[
          { id: 'pmi', label: '12 U.S.C. § 4902 PMI Cancellation', icon: ShieldCheck },
          { id: 'fhfa', label: '2026 FHFA Conforming vs Jumbo', icon: Landmark },
          { id: 'points', label: 'Discount Points NPV (IRC § 461(g))', icon: Calculator },
          { id: 'arm', label: 'SOFR ARM 2/2/5 Shock Simulator', icon: TrendingUp },
          { id: 'escrow', label: 'RESPA § 10 Escrow Auditor', icon: Scale },
          { id: 'fcra', label: 'FCRA § 609 / § 611 Credit Dispute', icon: FileText },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`}
              style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
            >
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: 12 U.S.C. § 4902 PMI CANCELLATION ──────────────────────── */}
      {activeTab === 'pmi' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* LTV Milestone Banner */}
          {auditData?.pmiAudit && (
            <div className="card" style={{
              background: auditData.pmiAudit.eligibleForBorrowerRequest
                ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.12), var(--surface))'
                : 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), var(--surface))',
              border: auditData.pmiAudit.eligibleForBorrowerRequest
                ? '1px solid rgba(34, 197, 94, 0.4)'
                : '1px solid rgba(245, 158, 11, 0.4)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              padding: '1.25rem 1.5rem'
            }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.2rem 0.65rem', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                  <ShieldCheck size={14} /> CURRENT LTV: {auditData.currentLTV}%
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                  {auditData.pmiAudit.eligibleForBorrowerRequest
                    ? `🎉 Legally Eligible to Cancel PMI! Saves $${auditData.pmiAudit.annualPMISaved.toLocaleString()}/year.`
                    : `Need $${auditData.pmiAudit.dollarsRemainingTo80LTV.toLocaleString()} principal paydown to hit statutory 80% LTV cancellation.`}
                </div>
                <p className="text-xs text-secondary" style={{ maxWidth: 680, marginTop: 4 }}>
                  Under 12 U.S. Code § 4902, when your loan reaches 80% LTV, your lender must cancel Private Mortgage Insurance upon written request. At 78% LTV, removal is automatic by law.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={downloadLetterPDF} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Download size={14} /> Download Statutory Letter (PDF)
                </button>
              </div>
            </div>
          )}

          {/* Parameters & Refi Comparison */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 className="text-h3">Mortgage Parameters</h3>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: 4 }}>
                  <span className="text-muted">Home Fair Market Value</span>
                  <strong style={{ fontFamily: 'Space Grotesk' }}>${Number(homeValue).toLocaleString()}</strong>
                </div>
                <input
                  type="range" min={300000} max={2500000} step={25000}
                  value={homeValue} onChange={e => setHomeValue(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: 4 }}>
                  <span className="text-muted">Current Mortgage Balance</span>
                  <strong style={{ fontFamily: 'Space Grotesk' }}>${Number(mortgageBalance).toLocaleString()}</strong>
                </div>
                <input
                  type="range" min={100000} max={2000000} step={10000}
                  value={mortgageBalance} onChange={e => setMortgageBalance(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="text-xs text-muted">Current Rate (%)</label>
                  <input
                    type="number" step="0.125"
                    value={interestRate} onChange={e => setInterestRate(Number(e.target.value))}
                    style={{ width: '100%', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted">Monthly PMI ($)</label>
                  <input
                    type="number"
                    value={monthlyPMI} onChange={e => setMonthlyPMI(Number(e.target.value))}
                    style={{ width: '100%', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted">County for FHFA Conforming Limits</label>
                <select
                  value={selectedCounty} onChange={e => setSelectedCounty(e.target.value)}
                  style={{ width: '100%', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                >
                  {PRESET_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="text-xs text-muted">Lender / Servicer</label>
                  <input
                    type="text" value={lenderName} onChange={e => setLenderName(e.target.value)}
                    style={{ width: '100%', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted">Loan Account #</label>
                  <input
                    type="text" value={accountNo} onChange={e => setAccountNo(e.target.value)}
                    style={{ width: '100%', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>
            </div>

            {/* Right: Statutory Letter Preview */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="text-h3" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileText size={16} /> Statutory 12 U.S.C. § 4902 Letter
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={handleCopyPMI} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {copiedPMI ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    {copiedPMI ? 'Copied' : 'Copy'}
                  </button>
                  <button onClick={downloadLetterPDF} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Download size={14} /> PDF
                  </button>
                </div>
              </div>

              <pre style={{
                flex: 1,
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                background: 'var(--surface-raised)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius)',
                padding: '1rem',
                overflowY: 'auto',
                maxHeight: 380,
                whiteSpace: 'pre-wrap',
                color: 'var(--text-secondary)'
              }}>
                {auditData?.pmiLetterText || 'Loading legal letter...'}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: 2026 FHFA CONFORMING VS JUMBO ENGINE ───────────────────── */}
      {activeTab === 'fhfa' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <h3 className="text-h3" style={{ marginBottom: '0.5rem' }}>2026 Federal Housing Finance Agency (FHFA) County Limits</h3>
            <p className="text-sm text-secondary" style={{ marginBottom: '1.25rem' }}>
              The Housing and Economic Recovery Act of 2008 (HERA) sets baseline conforming loan limits ($766,550) and high-cost ceiling limits ($1,149,825 for 1-unit single family homes). Loans above county ceilings become Non-Conforming Jumbo loans with higher reserve and underwriting requirements.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'var(--surface-raised)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
                <div className="text-xs text-muted">Selected County</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: 4 }}>{auditData?.fhfaAnalysis?.county || selectedCounty}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: 4 }}>
                  FHFA Limit: ${auditData?.fhfaAnalysis?.countyLimit?.toLocaleString() || '1,149,825'}
                </div>
              </div>

              <div style={{ background: 'var(--surface-raised)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
                <div className="text-xs text-muted">Loan Classification</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: auditData?.fhfaAnalysis?.loanCategory === 'NON_CONFORMING_JUMBO' ? 'var(--red)' : '#10b981', marginTop: 4 }}>
                  {auditData?.fhfaAnalysis?.loanCategory || 'CONFORMING'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Balance: ${Number(mortgageBalance).toLocaleString()}
                </div>
              </div>

              <div style={{ background: 'var(--surface-raised)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
                <div className="text-xs text-muted">Reserve Requirements (PITI)</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: 4 }}>
                  {auditData?.fhfaAnalysis?.reserveRequirementMonths || 6} Months Mandatory
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  Max DTI: {auditData?.fhfaAnalysis?.maxDTI || 45}%
                </div>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.6rem 0.75rem' }}>County / Metropolitan Area</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>2026 FHFA 1-Unit Limit</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Tier Classification</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Min Down Payment</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Fannie/Freddie Eligible</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { county: 'San Francisco, CA', limit: 1149825, tier: 'High-Cost Ceiling', down: '5%', eligible: 'Yes' },
                    { county: 'Santa Clara (Silicon Valley), CA', limit: 1149825, tier: 'High-Cost Ceiling', down: '5%', eligible: 'Yes' },
                    { county: 'New York (Manhattan), NY', limit: 1149825, tier: 'High-Cost Ceiling', down: '5%', eligible: 'Yes' },
                    { county: 'King (Seattle), WA', limit: 977500, tier: 'High-Cost Medium', down: '5%', eligible: 'Yes' },
                    { county: 'Suffolk (Boston), MA', limit: 920000, tier: 'High-Cost Medium', down: '5%', eligible: 'Yes' },
                    { county: 'Boulder, CO', limit: 891250, tier: 'High-Cost Medium', down: '5%', eligible: 'Yes' },
                    { county: 'Travis (Austin), TX', limit: 766550, tier: 'National Baseline', down: '3%', eligible: 'Yes' },
                    { county: 'Cook (Chicago), IL', limit: 766550, tier: 'National Baseline', down: '3%', eligible: 'Yes' },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>{row.county}</td>
                      <td style={{ padding: '0.6rem 0.75rem', fontFamily: 'Space Grotesk' }}>${row.limit.toLocaleString()}</td>
                      <td style={{ padding: '0.6rem 0.75rem' }}><span className="badge badge-surface">{row.tier}</span></td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>{row.down}</td>
                      <td style={{ padding: '0.6rem 0.75rem', color: '#10b981', fontWeight: 700 }}>{row.eligible}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: DISCOUNT POINTS NPV (IRC § 461(g)) ──────────────────────── */}
      {activeTab === 'points' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 className="text-h3">Discount Points Parameters</h3>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: 4 }}>
                  <span className="text-muted">Loan Amount</span>
                  <strong style={{ fontFamily: 'Space Grotesk' }}>${Number(pointsLoanAmount).toLocaleString()}</strong>
                </div>
                <input
                  type="range" min={200000} max={1800000} step={25000}
                  value={pointsLoanAmount} onChange={e => setPointsLoanAmount(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="text-xs text-muted">Base APR (%)</label>
                  <input
                    type="number" step="0.125"
                    value={pointsBaseRate} onChange={e => setPointsBaseRate(Number(e.target.value))}
                    style={{ width: '100%', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted">Points Bought (1 point = 1%)</label>
                  <input
                    type="number" step="0.25" min={0} max={4}
                    value={pointsBought} onChange={e => setPointsBought(Number(e.target.value))}
                    style={{ width: '100%', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="text-xs text-muted">Holding Horizon (Years)</label>
                  <input
                    type="number" min={1} max={30}
                    value={pointsHoldingYears} onChange={e => setPointsHoldingYears(Number(e.target.value))}
                    style={{ width: '100%', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted">Marginal Tax Bracket (%)</label>
                  <input
                    type="number"
                    value={pointsTaxBracket} onChange={e => setPointsTaxBracket(Number(e.target.value))}
                    style={{ width: '100%', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${isPurchaseLoan ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setIsPurchaseLoan(true)}
                  style={{ flex: 1 }}
                >
                  Purchase Loan (100% Year 1 Deductible)
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${!isPurchaseLoan ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setIsPurchaseLoan(false)}
                  style={{ flex: 1 }}
                >
                  Refinance (Amortized over 30 yrs)
                </button>
              </div>
            </div>

            {/* Results Card */}
            {pointsResult && (
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="text-h3">IRC § 461(g) NPV & Break-Even</h3>
                  <span className={`badge ${pointsResult.recommendation === 'BUY_POINTS_RECOMMENDED' ? 'badge-green' : 'badge-gold'}`}>
                    {pointsResult.recommendation === 'BUY_POINTS_RECOMMENDED' ? 'BUY POINTS' : 'DO NOT BUY'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div style={{ background: 'var(--surface-raised)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
                    <div className="text-xs text-muted">Upfront Cash Outlay</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: 'var(--red)', marginTop: 2 }}>
                      -${pointsResult.upfrontCost?.toLocaleString()}
                    </div>
                    {isPurchaseLoan && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--green)', marginTop: 2 }}>
                        Year 1 Tax Shield: +${pointsResult.taxShieldYear1?.toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div style={{ background: 'var(--surface-raised)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
                    <div className="text-xs text-muted">Monthly P&I Savings</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: '#10b981', marginTop: 2 }}>
                      +${pointsResult.monthlySavings?.toLocaleString()}/mo
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Annual: +${pointsResult.annualSavings?.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div style={{ background: 'var(--surface-raised)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
                    <div className="text-xs text-muted">Break-Even Point</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'Space Grotesk', marginTop: 2 }}>
                      {pointsResult.taxAdjustedBreakevenMonths} Months
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      ~{(pointsResult.taxAdjustedBreakevenMonths / 12).toFixed(1)} Years
                    </div>
                  </div>

                  <div style={{ background: 'var(--surface-raised)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
                    <div className="text-xs text-muted">Net Present Value ({pointsHoldingYears} Yrs)</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: pointsResult.totalNPV >= 0 ? '#10b981' : 'var(--red)', marginTop: 2 }}>
                      {pointsResult.totalNPV >= 0 ? '+' : ''}${pointsResult.totalNPV?.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      At {pointsDiscountRate}% Discount Rate
                    </div>
                  </div>
                </div>

                <p className="text-xs text-secondary">
                  Under <strong>IRC § 461(g)(2)</strong>, mortgage points paid on a purchase of a principal residence are fully deductible in the year paid if funded out of unborrowed funds. For refinances, points must be amortized ratably over 360 months unless refinanced again.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 4: SOFR ARM 2/2/5 SHOCK SIMULATOR ──────────────────────────── */}
      {activeTab === 'arm' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 className="text-h3">SOFR ARM Parameters</h3>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: 4 }}>
                  <span className="text-muted">Loan Amount</span>
                  <strong style={{ fontFamily: 'Space Grotesk' }}>${Number(armLoanAmount).toLocaleString()}</strong>
                </div>
                <input
                  type="range" min={300000} max={2000000} step={25000}
                  value={armLoanAmount} onChange={e => setArmLoanAmount(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="text-xs text-muted">Initial Teaser Rate (%)</label>
                  <input
                    type="number" step="0.125"
                    value={armInitialRate} onChange={e => setArmInitialRate(Number(e.target.value))}
                    style={{ width: '100%', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted">ARM Structure</label>
                  <select
                    value={armType} onChange={e => setArmType(e.target.value)}
                    style={{ width: '100%', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                  >
                    <option value="5/1">5/1 ARM (5 Yrs Fixed)</option>
                    <option value="7/1">7/1 ARM (7 Yrs Fixed)</option>
                    <option value="10/1">10/1 ARM (10 Yrs Fixed)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="text-xs text-muted">30-Day Avg SOFR (%)</label>
                  <input
                    type="number" step="0.05"
                    value={sofrBenchmark} onChange={e => setSofrBenchmark(Number(e.target.value))}
                    style={{ width: '100%', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted">Lender Margin (%)</label>
                  <input
                    type="number" step="0.05"
                    value={armMargin} onChange={e => setArmMargin(Number(e.target.value))}
                    style={{ width: '100%', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div style={{ background: 'var(--surface-raised)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
                <div className="text-xs text-muted">Statutory Caps Structure</div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginTop: 2 }}>2% Initial / 2% Periodic / 5% Lifetime Cap</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  Max Initial Reset: {(armInitialRate + 2.0).toFixed(3)}% | Lifetime Ceiling: {(armInitialRate + 5.0).toFixed(3)}%
                </div>
              </div>
            </div>

            {/* Shock Matrix */}
            {armResult && (
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 className="text-h3">Rate Reset Shock Analysis</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div style={{ background: 'var(--surface-raised)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
                    <div className="text-xs text-muted">Initial Fixed Payment</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: '#10b981', marginTop: 2 }}>
                      ${armResult.initialMonthlyPI?.toLocaleString()}/mo
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      First {armResult.fixedYears} Years
                    </div>
                  </div>

                  <div style={{ background: 'var(--surface-raised)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
                    <div className="text-xs text-muted">First Reset Month Shock</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: 'var(--gold)', marginTop: 2 }}>
                      +${armResult.monthlyShockAtReset?.toLocaleString()}/mo
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Payment: ${armResult.maxFirstResetPI?.toLocaleString()}/mo
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div style={{ background: 'var(--surface-raised)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
                    <div className="text-xs text-muted">Worst-Case Lifetime Shock</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: 'var(--red)', marginTop: 2 }}>
                      +${armResult.maxMonthlyShockLifetime?.toLocaleString()}/mo
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Ceiling: ${armResult.maxLifetimePI?.toLocaleString()}/mo
                    </div>
                  </div>

                  <div style={{ background: 'var(--surface-raised)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
                    <div className="text-xs text-muted">Mandatory Emergency Buffer</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'Space Grotesk', marginTop: 2 }}>
                      ${armResult.recommendedEmergencyBuffer?.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      12 Months Peak Shock Delta
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 5: RESPA § 10 ESCROW CUSHION AUDITOR ──────────────────────── */}
      {activeTab === 'escrow' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 className="text-h3">Escrow Cushion Auditor (12 U.S.C. § 2609)</h3>
              <p className="text-xs text-secondary">
                Under Section 10 of RESPA (12 CFR § 1024.17), servicers are legally prohibited from holding more than a <strong>one-sixth (1/6th) cushion</strong> of annual disbursements (~2 months). If your servicer holds more than $50 in surplus, they must refund it within 30 days.
              </p>

              <div>
                <label className="text-xs text-muted">Annual Property Taxes ($)</label>
                <input
                  type="number"
                  value={escrowPropertyTax} onChange={e => setEscrowPropertyTax(Number(e.target.value))}
                  style={{ width: '100%', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="text-xs text-muted">Annual Hazard / Homeowners Insurance ($)</label>
                <input
                  type="number"
                  value={escrowHazardIns} onChange={e => setEscrowHazardIns(Number(e.target.value))}
                  style={{ width: '100%', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="text-xs text-muted">Current Escrow Balance Held by Servicer ($)</label>
                <input
                  type="number"
                  value={escrowCurrentBal} onChange={e => setEscrowCurrentBal(Number(e.target.value))}
                  style={{ width: '100%', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                />
              </div>

              {escrowResult && (
                <div style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius)',
                  background: escrowResult.hasUnlawfulSurplus ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                  border: escrowResult.hasUnlawfulSurplus ? '1px solid var(--red)' : '1px solid #10b981'
                }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: escrowResult.hasUnlawfulSurplus ? 'var(--red)' : '#10b981' }}>
                    {escrowResult.hasUnlawfulSurplus
                      ? `⚠️ Unlawful Escrow Surplus Detected: $${escrowResult.escrowSurplus?.toLocaleString()}`
                      : '✓ Escrow Cushion Within Statutory 1/6th Limit'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    Max Allowable Cushion: ${escrowResult.maxAllowableCushion?.toLocaleString()} | Balance Held: ${escrowResult.currentEscrowBalance?.toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            {/* Escrow Refund Letter */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="text-h3" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileText size={16} /> RESPA § 10 Refund Demand
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={handleCopyEscrow} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {copiedEscrow ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    {copiedEscrow ? 'Copied' : 'Copy'}
                  </button>
                  <button onClick={downloadEscrowPDF} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Download size={14} /> PDF
                  </button>
                </div>
              </div>

              <pre style={{
                flex: 1,
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                background: 'var(--surface-raised)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius)',
                padding: '1rem',
                overflowY: 'auto',
                maxHeight: 380,
                whiteSpace: 'pre-wrap',
                color: 'var(--text-secondary)'
              }}>
                {escrowResult?.refundDemandLetterText || 'Loading escrow demand letter...'}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 6: FCRA § 609 / § 611 CERTIFIED CREDIT DISPUTE STUDIO ─────── */}
      {activeTab === 'fcra' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 className="text-h3">FCRA Statutory Dispute Parameters</h3>
              <p className="text-xs text-secondary">
                Generate an attorney-grade certified mail demand letter under <strong>15 U.S.C. § 1681i (FCRA § 611)</strong> requiring credit bureaus to investigate and produce physical verification within 30 days or delete the tradeline under penalty of $1,000 civil liability (15 U.S.C. § 1681n).
              </p>

              <div>
                <label className="text-xs text-muted">Target Credit Bureau</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 4 }}>
                  {['experian', 'equifax', 'transunion'].map(b => (
                    <button
                      key={b}
                      type="button"
                      className={`btn btn-sm ${fcraBureau === b ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setFcraBureau(b)}
                      style={{ flex: 1, textTransform: 'capitalize' }}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="text-xs text-muted">Creditor / Furnisher</label>
                  <input
                    type="text"
                    value={fcraCreditor} onChange={e => setFcraCreditor(e.target.value)}
                    style={{ width: '100%', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted">Disputed Account #</label>
                  <input
                    type="text"
                    value={fcraAccountNo} onChange={e => setFcraAccountNo(e.target.value)}
                    style={{ width: '100%', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted">Statutory Dispute Grounds</label>
                <select
                  value={fcraReason} onChange={e => setFcraReason(e.target.value)}
                  style={{ width: '100%', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                >
                  <option value="INACCURATE_30_DAY_LATE_PAYMENT">Inaccurate 30-Day Late Payment (Full Timely Payment Made)</option>
                  <option value="UNVERIFIED_COLLECTION_BALANCE">Unverified Collection Tradeline (Lack of Valid Assignment)</option>
                  <option value="OBSOLETE_ACCOUNT_OVER_7_YEARS">Obsolete Item (Exceeds 7-Year Statutory Limit under § 1681c)</option>
                  <option value="IDENTITY_MISMATCH_MIXED_FILE">Identity Mismatch / Mixed Credit File Attribution</option>
                  <option value="UNAUTHORIZED_HARD_INQUIRY">Unauthorized Hard Credit Inquiry without Permissible Purpose</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-muted">USPS Certified Mail Tracking #</label>
                <input
                  type="text"
                  value={fcraTracking} onChange={e => setFcraTracking(e.target.value)}
                  style={{ width: '100%', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            {/* FCRA Letter Preview */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="text-h3" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileText size={16} /> Certified Mail Dispute Demand
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={handleCopyFCRA} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {copiedFCRA ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    {copiedFCRA ? 'Copied' : 'Copy'}
                  </button>
                  <button onClick={downloadFCRAPDF} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Download size={14} /> PDF
                  </button>
                </div>
              </div>

              <pre style={{
                flex: 1,
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                background: 'var(--surface-raised)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius)',
                padding: '1rem',
                overflowY: 'auto',
                maxHeight: 380,
                whiteSpace: 'pre-wrap',
                color: 'var(--text-secondary)'
              }}>
                {fcraResult?.letterText || 'Loading FCRA dispute notice...'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
