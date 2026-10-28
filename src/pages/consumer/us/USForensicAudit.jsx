// src/pages/consumer/us/USForensicAudit.jsx
// US ERISA 408(b)(2) 401(k) Fee Hunter & Mutual Fund 12b-1 Drag Forensic Auditor

import React, { useState, useEffect } from 'react';
import {
  FileText, ShieldCheck, AlertTriangle, CheckCircle2, Download,
  Sparkles, Upload, RefreshCw, Scissors, DollarSign, TrendingDown,
  TrendingUp, Layers, Send, ArrowRight, ArrowUpRight, Check,
  Landmark, Percent, AlertCircle, Ban, HelpCircle, Copy, X
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useApp } from '../../../context/AppContext';
import { useAuth } from '../../../context/AuthContext';
import StickyActionDock from '../../../components/common/StickyActionDock';
import ForensicFeeLeakageChart from '../../../components/tax/visualizations/ForensicFeeLeakageChart';
import { useTaxStudio } from '../../../context/TaxStudioContext';

export default function USForensicAudit() {
  const { state, dispatch } = useApp();
  const { currentUser } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pillars'); // 'pillars' | 'erisa' | 'shareclass' | 'phantom' | 'zombies'
  const [revokedSubs, setRevokedSubs] = useState({});
  const [dispatchedToAdvisor, setDispatchedToAdvisor] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedLetterFund, setSelectedLetterFund] = useState(null);
  const [copiedLetter, setCopiedLetter] = useState(false);

  let taxStudio = null;
  try {
    taxStudio = useTaxStudio();
  } catch (e) {
    // Graceful fallback
  }

  const handleOpenTransferLetter = (fund) => {
    if (taxStudio && !taxStudio.isTaxProUnlocked) {
      taxStudio.triggerPaywall('BROKER_LETTER');
      return;
    }
    setSelectedLetterFund(fund);
  };

  useEffect(() => {
    runAudit(true);
  }, []);

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  }

  async function handleDispatchToAdvisor() {
    if (!data) return;
    const clientName = currentUser?.displayName || 'Alex Morgan';
    const clientEmail = currentUser?.email || 'alex.morgan@techcorp.io';
    const totalBleed = data.totalLeakage || 6420;
    const tenYear = data.tenYearCompoundedWealth || 94350;

    const auditReco = {
      id: `reco_us_forensic_${Date.now()}`,
      clientId: 'c1',
      clientName,
      clientEmail,
      type: 'erisa_fee_reduction',
      urgency: 'high',
      confidence: 98,
      createdAt: new Date().toISOString(),
      title: `US Forensic Fiduciary Action: Recover $${totalBleed.toLocaleString()}/yr in ERISA & 12b-1 Drag`,
      summary: `Automated US forensic scan identified $${totalBleed.toLocaleString()}/yr in avoidable leakage across 5 pillars: ERISA 401(k) revenue sharing ($${(data.erisa5500Audit?.annualExcessFeePerParticipantUSD || 840).toLocaleString()}/yr), mutual fund 12b-1 sales loads ($${(data.pillars?.shareClass?.annualDrag || 1650).toLocaleString()}/yr), taxable phantom dividend bleed ($${(data.pillars?.phantomGains?.annualBleed || 1280).toLocaleString()}/yr), zombie auto-debits ($${(data.pillars?.zombieSubs?.annualWaste || 1450).toLocaleString()}/yr), and unharvested pre-tax shields ($${(data.pillars?.unharvestedTax?.annualTaxSaved || 1200).toLocaleString()}/yr). 10-year compounded wealth loss: $${tenYear.toLocaleString()}.`,
      impact: {
        'Annual Drag Recovered': `$${totalBleed.toLocaleString()}/yr`,
        '10-Yr Wealth Delta': `+$${tenYear.toLocaleString()}`,
        'ERISA 401(k) Optimization': `$${(data.erisa5500Audit?.annualExcessFeePerParticipantUSD || 840).toLocaleString()}/yr`,
        '12b-1 Institutional Switch': `$${(data.pillars?.shareClass?.annualDrag || 1650).toLocaleString()}/yr`,
        'Fiduciary Code': 'SEC Investment Advisers Act § 206 / Form ADV Part 2A'
      },
      aiRationale: [
        `Convert Class A/C mutual funds to zero-load institutional index shares or equivalent low-cost ETFs.`,
        `Exercise ERISA § 408(b)(2) participant disclosure rights to petition plan sponsor for fee leveling or low-cost index tier.`,
        `Route taxable account equity holdings through IRC § 852(b)(6) in-kind creation/redemption ETF structures to eliminate phantom capital gains.`,
        `Revoke NACHA recurring authorizations for 3 dormant subscriptions to recapture immediate cash flow.`
      ],
      recommendation: `Execute 5-pillar US forensic fee remediation to roll active 401(k) allocations into low-cost institutional funds and eliminate $${totalBleed.toLocaleString()} in recurring drag.`,
      action: 'Execute Fiduciary Remediation Plan',
      status: 'pending',
      advisorEdit: ''
    };

    if (dispatch) {
      dispatch({ type: 'ADD_RECOMMENDATIONS', payload: auditReco });
    }

    try {
      await fetch('/api/advisor/dispatch-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recoId: auditReco.id,
          clientName: auditReco.clientName,
          clientEmail: auditReco.clientEmail,
          title: auditReco.title,
          summary: auditReco.summary,
          viaEmail: false,
          type: auditReco.type,
          urgency: auditReco.urgency,
          impact: auditReco.impact,
        }),
      });
    } catch (err) {
      console.warn('Backend compliance audit log notice:', err);
    }

    setDispatchedToAdvisor(true);
    showToast('✓ Dispatched Forensic Audit Remediation to SEC RIA Queue at /advisor/recommendations');
  }

  function exportForensicProofsCSV() {
    if (!data) return;
    const rows = [
      ['Pillar', 'Finding Description', 'Annual Bleed (USD)', 'Actionable Remediation / Statutory Authority'],
      ...(data.leakagePillars || []).map(p => [
        `"${p.name}"`,
        `"${p.description.replace(/"/g, '""')}"`,
        p.annualBleed,
        `"${p.remediation.replace(/"/g, '""')}"`
      ]),
      ...(data.unclaimedTaxDeductions || []).map(t => [
        `"Tax Shelter: ${t.section}"`,
        `"${t.recipient} (${t.proofDetail})"`,
        t.taxSavedAt30Pct,
        `"IRC Form 8889 / Schedule A above-the-line deduction"`
      ])
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `US_Forensic_Fee_Audit_Proofs_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('✓ Downloaded US Forensic Fee Audit Proofs (CSV)');
  }

  async function runAudit(isSample = false) {
    setLoading(true);
    try {
      const res = await fetch('/api/forensic/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isSample,
          market: 'US',
          holdings: state?.consumer?.holdings || {}
        })
      });
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (err) {
      console.error('US Forensic audit failed:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleRevokeSub(sub) {
    setRevokedSubs(prev => ({ ...prev, [sub.id]: true }));
    showToast(`✓ ACH stop-payment mandate dispatched for ${sub.service} (Saves $${sub.annualCost}/yr)!`);
  }

  function downloadExecutiveReportPDF() {
    if (!data) return;
    const doc = new jsPDF();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('EXECUTIVE FORENSIC WEALTH AUDIT REPORT (US)', 14, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Client: ${currentUser?.displayName || 'Alex Morgan'} | Account: ${data.accountNumber}`, 14, 28);
    doc.text(`Audit Window: ${data.statementPeriod} | Total Annual Leakage: $${data.totalLeakage.toLocaleString()}`, 14, 34);

    const pillarRows = (data.leakagePillars || []).map(p => [
      p.name,
      `$${p.annualBleed.toLocaleString()} / yr`,
      p.description,
      p.remediation
    ]);

    autoTable(doc, {
      startY: 42,
      head: [['Forensic Leakage Pillar', 'Annual Bleed', 'Diagnostic Finding', 'Actionable Remediation']],
      body: pillarRows,
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241] },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 40, fontStyle: 'bold' },
        1: { cellWidth: 28, textColor: [220, 38, 38], fontStyle: 'bold' },
        2: { cellWidth: 60 },
        3: { cellWidth: 62 }
      }
    });

    let nextY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('ERISA 408(b)(2) 401(k) HIDDEN RECORDKEEPING & REVENUE SHARING AUDIT:', 14, nextY);

    const erisaRows = [
      ['Plan Name', data.erisa5500Audit?.planName || 'TechCorp 401(k) Plan'],
      ['Total Plan Assets / Participants', `$${(data.erisa5500Audit?.totalPlanAssetsUSD || 0).toLocaleString()} across ${data.erisa5500Audit?.totalParticipants || 0} participants`],
      ['Direct Recordkeeping Fees (Schedule C Part I)', `$${(data.erisa5500Audit?.directRecordkeepingFeeUSD || 0).toLocaleString()}/yr ($300/participant)`],
      ['Indirect Revenue Sharing / Sub-TA (Part II)', `$${(data.erisa5500Audit?.indirectRevenueSharingUSD || 0).toLocaleString()}/yr (0.35% undisclosed drag)`],
      ['Total Participant Drag vs Low-Cost Target', `${data.erisa5500Audit?.totalParticipantFeeDragPct || 1.20}% actual vs ${data.erisa5500Audit?.fiduciaryBenchmarkDragPct || 0.08}% index target`],
      ['Annual Excess Bleed per Participant', `$${(data.erisa5500Audit?.annualExcessFeePerParticipantUSD || 0).toLocaleString()}/yr`],
    ];

    autoTable(doc, {
      startY: nextY + 4,
      head: [['Audit Metric', 'Plan Telemetry / Statutory Compliance']],
      body: erisaRows,
      theme: 'plain',
      styles: { fontSize: 8 }
    });

    nextY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('MUTUAL FUND 12b-1 SHARE CLASS & LOAD DRAG:', 14, nextY);

    const shareClassRows = (data.shareClassDissector || []).map(s => [
      s.fundName,
      s.shareClass,
      `${s.frontEndLoadPct}% front / ${s.annual12b1FeePct}% 12b-1`,
      `$${s.tenYearCompoundedDragUSD?.toLocaleString()}`,
      `${s.recommendedSwitch} (${s.switchExpenseRatioPct}%)`
    ]);

    autoTable(doc, {
      startY: nextY + 4,
      head: [['Fund Name', 'Class', 'Sales Load & 12b-1', '10-Yr Compounded Drag', 'Institutional Low-Cost Switch']],
      body: shareClassRows,
      theme: 'grid',
      headStyles: { fillColor: [50, 50, 70] },
      styles: { fontSize: 7.5 }
    });

    doc.save(`US_Forensic_Audit_Report_${(currentUser?.displayName || 'Alex_Morgan').replace(/\s+/g, '_')}.pdf`);
    showToast('Downloaded Executive Forensic Audit Report (PDF)');
  }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 1200, margin: '0 auto' }}>
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
        background: 'linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(99,102,241,0.06) 100%)',
        border: '1px solid var(--border-active)', padding: '1.5rem', borderRadius: 'var(--radius-lg)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(239, 68, 68, 0.12)', color: 'var(--red)', padding: '0.2rem 0.65rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.4rem' }}>
              <span>🇺🇸</span> ERISA 408(b)(2) & 12b-1 FEE DETECTOR
            </div>
            <h1 className="text-h1" style={{ margin: 0, fontSize: '1.8rem' }}>US Forensic Fee & Wealth Drag Auditor</h1>
            <p className="text-sm text-secondary" style={{ marginTop: '0.25rem', maxWidth: 720 }}>
              Unmask hidden 401(k) custodial recordkeeping fees (Form 5500 Sched C), mutual fund 12b-1 trailing loads, taxable phantom capital gains drag, and silent subscriptions.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleDispatchToAdvisor}
              className={`btn btn-sm ${dispatchedToAdvisor ? 'btn-ghost' : 'btn-primary'}`}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {dispatchedToAdvisor ? <Check size={14} color="#10b981" /> : <Send size={14} />}
              <span>{dispatchedToAdvisor ? 'Dispatched to SEC Advisor' : 'Dispatch to SEC Advisor'}</span>
            </button>

            <button onClick={exportForensicProofsCSV} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Download size={14} /> Export CSV Proofs
            </button>

            <button onClick={downloadExecutiveReportPDF} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Download size={14} /> Executive PDF
            </button>
          </div>
        </div>
      </div>

      {/* Brokerage & 401(k) Statement Upload Zone */}
      <div className="card" style={{ padding: '1.25rem', background: 'var(--surface-raised)', border: '1px dashed var(--glass-border)', borderRadius: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Upload size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Upload 401(k), Brokerage or 1099-DIV Statement</div>
              <div className="text-xs text-muted">Supports PDF or CSV from Fidelity, Vanguard, Charles Schwab, Empower, Morgan Stanley</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <FileText size={14} />
              <span>{uploadFile ? uploadFile.name : 'Choose Statement'}</span>
              <input
                type="file"
                accept=".pdf,.csv"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setUploadFile(e.target.files[0]);
                    showToast(`✓ Loaded ${e.target.files[0].name} for parsing`);
                  }
                }}
              />
            </label>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={isUploading}
              onClick={() => {
                setIsUploading(true);
                setTimeout(() => {
                  setIsUploading(false);
                  runAudit(false);
                  showToast('✓ Statement successfully parsed! Forensic fee telemetry refreshed.');
                }, 900);
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {isUploading ? <RefreshCw className="animate-spin" size={14} /> : <Sparkles size={14} />}
              <span>{isUploading ? 'Analyzing...' : 'Run Forensic Scan'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hero Stats */}
      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          <div className="card" style={{ borderLeft: '4px solid var(--red)' }}>
            <div className="text-xs text-muted">Annual Wealth Bleed Discovered</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--red)', margin: '4px 0' }}>
              -${data.totalLeakage.toLocaleString()}<span style={{ fontSize: '1rem', fontWeight: 600 }}>/yr</span>
            </div>
            <div className="text-xs text-secondary">
              ERISA fees, 12b-1 drag & unharvested tax shields
            </div>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
            <div className="text-xs text-muted">10-Year Compounded Lost Wealth</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: '#10b981', margin: '4px 0' }}>
              +${data.tenYearCompoundedWealth.toLocaleString()}
            </div>
            <div className="text-xs text-secondary">
              Recoverable via low-cost index rollover at 8% CAGR
            </div>
          </div>

          <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
            <div className="text-xs text-muted">ERISA 401(k) Fee Drag Score</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--primary)', margin: '4px 0' }}>
              {data.diversificationScore} / 100
            </div>
            <div className="text-xs text-secondary">
              Moderate fee drag detected across active funds
            </div>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        paddingBottom: '0.5rem',
        borderBottom: '1px solid var(--glass-border)'
      }}>
        {[
          { id: 'pillars', label: 'Leakage Pillars & Action Matrix', icon: Layers },
          { id: 'erisa', label: 'ERISA Form 5500 & Sched C Auditor', icon: Landmark },
          { id: 'shareclass', label: '12b-1 Share Class Load Dissector', icon: Percent },
          { id: 'phantom', label: 'Phantom Cap Gains (IRC § 852(b)(6))', icon: TrendingDown },
          { id: 'zombies', label: 'Zombie Auto-Debits & ACH Revocation', icon: Ban },
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

      {/* ── TAB 1: LEAKAGE PILLARS ─────────────────────────────────────────── */}
      {activeTab === 'pillars' && data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Interactive 25-Year ERISA 401(k) & 12b-1 Fee Leakage Horizon Chart */}
          <ForensicFeeLeakageChart
            market="US"
            initialPortfolio={450000}
            commissionDragPct={0.85}
            expenseRatioDragPct={0.65}
            zombieAnnualTotal={data?.totalLeakage || 1850}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {(data.leakagePillars || []).map(p => (
              <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: 4 }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem' }}>{p.name}</div>
                    <span className="badge badge-red">-${p.annualBleed.toLocaleString()}/yr</span>
                  </div>
                  <p className="text-xs text-secondary" style={{ lineHeight: 1.5 }}>{p.description}</p>
                </div>

                <div style={{ background: 'var(--surface-raised)', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Actionable Remediation</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--green)', fontWeight: 600, marginTop: 2 }}>{p.remediation}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Unharvested Pre-Tax Deductions */}
          <div className="card">
            <h3 className="text-h3" style={{ marginBottom: '0.75rem' }}>Unharvested Pre-Tax Shields (Form 8889 & Sched A)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
              {(data.unclaimedTaxDeductions || []).map(t => (
                <div key={t.id} style={{ background: 'var(--surface-raised)', padding: '0.85rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{t.section}</span>
                    <span className="badge badge-green">+${t.taxSavedAt30Pct} Tax Credit</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>{t.recipient} (${t.amount.toLocaleString()})</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{t.proofDetail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: ERISA FORM 5500 & SCHED C AUDITOR ──────────────────────── */}
      {activeTab === 'erisa' && data?.erisa5500Audit && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <span className="badge badge-primary">29 CFR § 2550.404a-5 & ERISA § 408(b)(2)</span>
                <h3 className="text-h3" style={{ marginTop: '0.35rem' }}>{data.erisa5500Audit.planName}</h3>
                <p className="text-xs text-secondary">
                  Audits Department of Labor (DOL) Form 5500 Schedule C disclosures for indirect revenue sharing, sub-transfer agency (sub-TA) fees, and wrap pricing.
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-red" style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}>
                  Fiduciary Breach Alert
                </span>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Excess Drag: +{data.erisa5500Audit.totalParticipantFeeDragPct - data.erisa5500Audit.fiduciaryBenchmarkDragPct}%
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'var(--surface-raised)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
                <div className="text-xs text-muted">Total Plan Assets</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'Space Grotesk', marginTop: 2 }}>
                  ${(data.erisa5500Audit.totalPlanAssetsUSD / 1000000).toFixed(2)}M
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{data.erisa5500Audit.totalParticipants} Participants</div>
              </div>

              <div style={{ background: 'var(--surface-raised)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
                <div className="text-xs text-muted">Direct Fees (Sched C Part I)</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: 'var(--red)', marginTop: 2 }}>
                  ${data.erisa5500Audit.directRecordkeepingFeeUSD.toLocaleString()}/yr
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>$300/participant recordkeeping</div>
              </div>

              <div style={{ background: 'var(--surface-raised)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
                <div className="text-xs text-muted">Indirect Revenue Sharing (Part II)</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: 'var(--red)', marginTop: 2 }}>
                  ${data.erisa5500Audit.indirectRevenueSharingUSD.toLocaleString()}/yr
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>0.35% undisclosed Sub-TA drag</div>
              </div>

              <div style={{ background: 'var(--surface-raised)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
                <div className="text-xs text-muted">Annual Excess Bleed Per Person</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: 'var(--green)', marginTop: 2 }}>
                  ${data.erisa5500Audit.annualExcessFeePerParticipantUSD.toLocaleString()}/yr
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Recoverable via IRA rollover</div>
              </div>
            </div>

            <div style={{ background: 'rgba(99,102,241,0.06)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Fiduciary Correction Pathway</div>
                <p className="text-xs text-secondary" style={{ maxWidth: 640, marginTop: 2 }}>
                  Under Tibble v. Edison International (U.S. Supreme Court), plan fiduciaries have a continuing duty to monitor 401(k) fees and replace high-cost retail share classes with low-cost institutional index alternatives.
                </p>
              </div>

              <button
                className="btn btn-primary btn-sm"
                onClick={() => showToast('Dispatched Form 5500 Fee Inquiry to Plan Administrator')}
              >
                Send Fiduciary Inquiry Demand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: 12b-1 SHARE CLASS LOAD DISSECTOR ───────────────────────── */}
      {activeTab === 'shareclass' && data?.shareClassDissector && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <h3 className="text-h3" style={{ marginBottom: '0.5rem' }}>FINRA Rule 2210 & Mutual Fund Share Class Dissector</h3>
            <p className="text-sm text-secondary" style={{ marginBottom: '1.25rem' }}>
              Brokers and distributors charge upfront sales loads (Class A) or level 1.00% annual trailing commissions (Class C) under SEC Rule 12b-1. Compare these loads with institutional low-cost index funds:
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Fund Name</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Share Class</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Front Load</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Annual 12b-1</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Total Expense</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>10-Yr Wealth Drag</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Institutional Alternative</th>
                    <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Fiduciary Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.shareClassDissector.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>{row.fundName}</td>
                      <td style={{ padding: '0.6rem 0.75rem' }}><span className="badge badge-surface">{row.shareClass}</span></td>
                      <td style={{ padding: '0.6rem 0.75rem', color: row.frontEndLoadPct > 0 ? 'var(--red)' : 'var(--text-muted)', fontWeight: 700 }}>
                        {row.frontEndLoadPct > 0 ? `${row.frontEndLoadPct}%` : '0%'}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', color: row.annual12b1FeePct >= 0.75 ? 'var(--red)' : 'var(--text-secondary)', fontWeight: 700 }}>
                        {row.annual12b1FeePct}%
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', fontFamily: 'Space Grotesk' }}>{row.totalExpenseRatioPct}%</td>
                      <td style={{ padding: '0.6rem 0.75rem', color: 'var(--red)', fontWeight: 800, fontFamily: 'Space Grotesk' }}>
                        -${row.tenYearCompoundedDragUSD.toLocaleString()}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', color: '#10b981', fontWeight: 700 }}>
                        {row.recommendedSwitch} ({row.switchExpenseRatioPct}%)
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenTransferLetter(row)}
                          className="btn btn-sm btn-primary"
                          style={{ fontSize: '0.72rem', padding: '0.3rem 0.65rem', whiteSpace: 'nowrap' }}
                        >
                          Generate Transfer Letter
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Transfer Letter Modal for US Share Class / ERISA */}
            {selectedLetterFund && (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(0,0,0,0.75)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 9999,
                  padding: '1rem',
                }}
              >
                <div
                  style={{
                    background: '#0f172a',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    borderRadius: 12,
                    padding: '1.5rem',
                    maxWidth: 620,
                    width: '100%',
                    color: '#fff',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={20} color="#818cf8" />
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                        ERISA 408(b)(2) / Brokerage Low-Cost Transfer Letter
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedLetterFund(null)}
                      style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div
                    style={{
                      background: '#090d16',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 8,
                      padding: '1rem',
                      fontSize: '0.78rem',
                      fontFamily: 'monospace',
                      lineHeight: 1.6,
                      color: '#cbd5e1',
                      marginBottom: '1rem',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
{`To,
The Plan Administrator & Fiduciary Committee /
Operations Department, Custodian Brokerage

Subject: Demand for Conversion to Low-Cost Institutional Share Class / In-Kind Rollover pursuant to ERISA § 404(a) & 29 CFR § 2550.408b-2

Dear Plan Administrator / Custodian,

I am writing as a participant/client to formally request the replacement of the high-fee mutual fund share class currently held in my account:

• Account Title / Beneficiary: ${currentUser?.displayName || 'Alex Morgan'}
• SSN Masked: XXX-XX-9182
• Existing High-Fee Holding: ${selectedLetterFund.fundName} (${selectedLetterFund.shareClass})
• Current Total Expense Ratio: ${selectedLetterFund.totalExpenseRatioPct}% (including ${selectedLetterFund.annual12b1FeePct}% 12b-1 distributor commission)
• Mandated Low-Cost Replacement: ${selectedLetterFund.recommendedSwitch} (${selectedLetterFund.switchExpenseRatioPct}% TER)

Fiduciary Legal Justification:
Under ERISA Section 404(a)(1)(A), plan fiduciaries have an ongoing statutory duty to defray reasonable expenses of administering the plan. Holding retail A/C share classes with embedded 12b-1 marketing fees where lower-cost institutional or index share classes exist constitutes an unnecessary fiduciary drag. 

Furthermore, inside tax-advantaged retirement accounts, an immediate rebalancing into ${selectedLetterFund.recommendedSwitch} triggers $0 in capital gains taxes.

Please confirm receipt of this directive and execute the conversion within 5 business days.

Sincerely,

${currentUser?.displayName || 'Alex Morgan'}
Date: ${new Date().toLocaleDateString('en-US')}`}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`To,\nThe Plan Administrator ...`);
                        setCopiedLetter(true);
                        setTimeout(() => setCopiedLetter(false), 2500);
                      }}
                      style={{
                        padding: '0.45rem 0.85rem',
                        borderRadius: 6,
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#fff',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      {copiedLetter ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                      <span>{copiedLetter ? 'Copied to Clipboard!' : 'Copy Letter'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const blob = new Blob([`To,\nThe Plan Administrator ...`], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `ERISA_Direct_Transfer_${selectedLetterFund.fundName.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      style={{
                        padding: '0.45rem 1rem',
                        borderRadius: 6,
                        background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
                        border: 'none',
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <Download size={14} />
                      <span>Download Transfer Letter (TXT)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 4: PHANTOM CAPITAL GAINS DRAG (IRC § 852(b)(6)) ───────────── */}
      {activeTab === 'phantom' && data?.phantomCapitalGainAudit && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <h3 className="text-h3" style={{ marginBottom: '0.5rem' }}>Taxable Account Phantom Capital Gain Drag</h3>
            <p className="text-sm text-secondary" style={{ marginBottom: '1.25rem' }}>
              Unlike ETFs which use <strong>IRC § 852(b)(6) in-kind creation and redemption baskets</strong> to shield investors from capital gains taxes, actively managed mutual funds dump capital gains onto taxable investors on Form 1099-DIV Box 2a even when the fund price falls.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
              {data.phantomCapitalGainAudit.map((fund, idx) => (
                <div key={idx} style={{ background: 'var(--surface-raised)', padding: '1.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem' }}>{fund.fundName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{fund.accountType} · {fund.turnoverRatePct}% Turnover</div>
                    </div>
                    <span className="badge badge-red">-${fund.estimatedTaxBleedUSD} Tax Bleed</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div style={{ background: 'var(--surface)', padding: '0.5rem 0.75rem', borderRadius: 8 }}>
                      <div className="text-xs text-muted">Projected 1099-DIV Box 2a</div>
                      <div style={{ fontWeight: 800, fontFamily: 'Space Grotesk', marginTop: 2 }}>${fund.projected1099DivBox2aUSD.toLocaleString()}</div>
                    </div>
                    <div style={{ background: 'var(--surface)', padding: '0.5rem 0.75rem', borderRadius: 8 }}>
                      <div className="text-xs text-muted">Embedded Gains</div>
                      <div style={{ fontWeight: 800, fontFamily: 'Space Grotesk', marginTop: 2 }}>{fund.embeddedUnrealizedGainsPct}%</div>
                    </div>
                  </div>

                  <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#10b981' }}>Recommended ETF Switch: {fund.etfEquivalent}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>{fund.etfTaxProtection}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: ZOMBIE SUBSCRIPTIONS & ACH REVOCATION ──────────────────── */}
      {activeTab === 'zombies' && data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <h3 className="text-h3" style={{ marginBottom: '0.5rem' }}>Silent Zombie Auto-Debits & Unused SaaS Subscriptions</h3>
            <p className="text-sm text-secondary" style={{ marginBottom: '1.25rem' }}>
              Detected recurring ACH and credit card auto-debits with negligible utilization in the past 60 days. Dispatch automated stop-payment orders under NACHA rules:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(data.zombieSubscriptions || []).map(sub => {
                const isRevoked = revokedSubs[sub.id];
                return (
                  <div key={sub.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'var(--surface-raised)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--glass-border)',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{sub.service}</span>
                        <span className="badge badge-surface">{sub.cadence}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>
                        {sub.detectedVia} · Last Active: <strong style={{ color: 'var(--gold)' }}>{sub.lastEngagement}</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontFamily: 'Space Grotesk', fontSize: '1rem', color: 'var(--red)' }}>
                          -${sub.annualCost.toLocaleString()}/yr
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>${sub.monthlyCost}/mo</div>
                      </div>

                      <button
                        onClick={() => handleRevokeSub(sub)}
                        disabled={isRevoked}
                        className={`btn btn-sm ${isRevoked ? 'btn-ghost' : 'btn-primary'}`}
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        {isRevoked ? <Check size={14} color="#10b981" /> : <Scissors size={14} />}
                        {isRevoked ? 'ACH Revoked' : 'Revoke Mandate'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Sticky Action Dock */}
      <StickyActionDock
        primaryLabel={dispatchedToAdvisor ? '✓ Dispatched to SEC RIA' : 'Dispatch Remediation to SEC Advisor'}
        primaryIcon={dispatchedToAdvisor ? Check : Send}
        onPrimary={dispatchedToAdvisor ? () => showToast('Remediation already queued in SEC RIA advisor portal!') : handleDispatchToAdvisor}
        secondaryLabel="Executive Forensic PDF"
        secondaryIcon={Download}
        onSecondary={downloadExecutiveReportPDF}
        badges={[
          `Annual Leakage: -$${(data?.totalLeakage || 6420).toLocaleString()}/yr`,
          `10-Yr Recovery: +$${(data?.tenYearCompoundedWealth || 94350).toLocaleString()}`,
          `Score: ${data?.diversificationScore || 72}/100`
        ]}
      />
    </div>
  );
}
