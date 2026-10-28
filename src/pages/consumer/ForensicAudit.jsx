import React, { useState, useEffect } from 'react';
import {
  FileText, ShieldCheck, AlertTriangle, CheckCircle2, Download,
  Sparkles, Upload, Key, RefreshCw, ExternalLink, Scissors, DollarSign,
  TrendingDown, TrendingUp, Layers, Send, ArrowRight, ArrowUpRight, Copy, Check, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { buildForensicAuditReportPDF } from '../../utils/fiduciaryPdfBuilder';
import USForensicAudit from './us/USForensicAudit';
import ForensicFeeLeakageChart from '../../components/tax/visualizations/ForensicFeeLeakageChart';
import { useTaxStudio } from '../../context/TaxStudioContext';

const DIRECT_MF_CONVERSIONS = [
  {
    id: 'dmf-1',
    fundName: 'HDFC Top 100 Fund - Regular Plan (Growth)',
    currentValue: 1850000,
    regularTER: 1.68,
    directProxyName: 'HDFC Top 100 Fund - Direct Plan (Growth)',
    directTER: 0.65,
    annualFeeSaving: 19055,
    unrealizedGains: 82000,
    ltcgTaxExempt: true,
    taxLiabilityIfSwitched: 0,
    amc: 'HDFC Asset Management Company Ltd',
    rta: 'CAMS',
    folio: '9102847/31'
  },
  {
    id: 'dmf-2',
    fundName: 'Nippon India Small Cap Fund - Regular Plan',
    currentValue: 1420000,
    regularTER: 1.74,
    directProxyName: 'Nippon India Small Cap Fund - Direct Plan',
    directTER: 0.68,
    annualFeeSaving: 15052,
    unrealizedGains: 110000,
    ltcgTaxExempt: true,
    taxLiabilityIfSwitched: 0,
    amc: 'Nippon Life India Asset Management Ltd',
    rta: 'KFintech',
    folio: '4481902/89'
  },
  {
    id: 'dmf-3',
    fundName: 'Axis Long Term Equity ELSS - Regular Plan',
    currentValue: 980000,
    regularTER: 1.62,
    directProxyName: 'Axis ELSS Tax Saver Fund - Direct Plan',
    directTER: 0.72,
    annualFeeSaving: 8820,
    unrealizedGains: 45000,
    ltcgTaxExempt: true,
    taxLiabilityIfSwitched: 0,
    amc: 'Axis Asset Management Company Ltd',
    rta: 'KFintech',
    folio: '1092837/12'
  }
];

export default function ForensicAudit() {
  const navigate = useNavigate();
  const { state, dispatch, isUSMarket } = useApp();

  if (isUSMarket || state?.activeMarket === 'US') {
    return <USForensicAudit />;
  }

  const user = state?.consumer?.user || {};
  const holdings = state?.consumer?.holdings || {};

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [file, setFile] = useState(null);
  const [dispatchedToAdvisor, setDispatchedToAdvisor] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [letterModalFund, setLetterModalFund] = useState(null);
  const [copiedLetter, setCopiedLetter] = useState(false);

  let taxStudio = null;
  try {
    taxStudio = useTaxStudio();
  } catch (e) {
    // Graceful fallback
  }

  const handleOpenLetterModal = (fund) => {
    if (taxStudio && !taxStudio.isTaxProUnlocked) {
      taxStudio.triggerPaywall('BROKER_LETTER');
      return;
    }
    setLetterModalFund(fund);
  };

  useEffect(() => {
    runAudit(true);
  }, []);

  async function runAudit(isSample = false) {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/forensic/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isSample,
          password,
          holdings,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (e) {
      console.error('Forensic audit failed:', e);
    } finally {
      setLoading(false);
    }
  }

  function downloadExecutiveReportPDF() {
    if (!data) return;
    const doc = buildForensicAuditReportPDF(data, user, {
      totalHoldingsValue: state?.consumer?.netWorth?.total || 12487320,
    });
    const filename = `Executive_Forensic_Audit_Report_${(user.name || 'Arjun_Sharma').replace(/\s+/g, '_')}.pdf`;
    doc.save(filename);
    showToast('Downloaded Executive Forensic Audit Report (Vector PDF)');
  }

  async function handleDispatchToAdvisor() {
    const auditReco = {
      id: `reco_audit_${Date.now()}`,
      clientId: 'c1',
      clientName: user.name || 'Arjun Sharma',
      clientEmail: user.email || 'aditya.chowdhury.in@gmail.com',
      type: 'regular_to_direct_switch',
      urgency: 'high',
      confidence: 97,
      createdAt: new Date().toISOString(),
      title: `Forensic Wealth Leakage Clean-Up: Recover ₹${Number(data?.totalLeakage || 153978).toLocaleString('en-IN')}/yr`,
      summary: `Automated forensic scan identified ₹${Number(data?.totalLeakage || 153978).toLocaleString('en-IN')}/yr in avoidable leakage across 4 drag pillars: Mutual Fund direct switches (₹${(data?.pillars?.directSwitch?.annualSavings || 26500).toLocaleString('en-IN')}), fund overlap redundancy (₹${(data?.pillars?.overlapDrag?.annualDrag || 18400).toLocaleString('en-IN')}), zombie recurring subscriptions (₹${(data?.pillars?.zombieSubs?.annualWaste || 18078).toLocaleString('en-IN')}), and unharvested tax exemptions (₹${(data?.pillars?.taxHarvest?.annualTaxSaved || 91000).toLocaleString('en-IN')}). 10-year compounded loss: ₹${(Number(data?.tenYearCompoundedWealth || 2694615) / 100000).toFixed(2)} Lakhs.`,
      impact: {
        'Annual Drag Recovered': `₹${Number(data?.totalLeakage || 153978).toLocaleString('en-IN')}/yr`,
        '10-Yr Wealth Delta': `+₹${(Number(data?.tenYearCompoundedWealth || 2694615) / 100000).toFixed(1)} Lakhs`,
        'Direct Switch Savings': `₹${(data?.pillars?.directSwitch?.annualSavings || 26500).toLocaleString('en-IN')}/yr`,
        'Tax Harvest (80D/80G)': `₹${(data?.pillars?.taxHarvest?.annualTaxSaved || 91000).toLocaleString('en-IN')}`,
        'Fiduciary Code': 'SEBI IA Reg. 17 Direct Mandate'
      },
      aiRationale: [
        `Direct mutual fund conversion eliminates distributor commission drag without altering core asset allocation.`,
        `Liquidating overlapping large-cap schemes consolidates portfolio into high-conviction holdings.`,
        `Unharvested Section 80D medical and Section 80G donations can be declared before fiscal year cutoff.`,
        `Cancelling 4 dormant recurring subscriptions recaptures immediate monthly cashflow.`
      ],
      recommendation: `Approve 4-pillar forensic remediation plan to migrate ₹28.5L regular schemes to zero-commission direct growth plans and harvest ₹91,000 in unclaimed tax deductions.`,
      action: 'Execute Forensic Remediation Directives',
      status: 'pending',
      advisorEdit: ''
    };

    // 1. Add to active AppContext advisor recommendation queue
    dispatch({ type: 'ADD_RECOMMENDATIONS', payload: auditReco });

    // 2. Durable backend SEBI compliance audit trail
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/advisor/dispatch-recommendation`, {
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
    showToast('Forensic Remediation Plan added to SEBI RIA Queue at /advisor/recommendations');
  }

  function exportTaxDeductionsCSV() {
    if (!data || !data.taxDeductionsHarvested) return;
    const rows = [
      ['Tax Section', 'Category', 'Recipient / Institution', 'Amount (INR)', 'Tax Saved (30% Slab)', 'Proof / Receipt Document'],
      ...data.taxDeductionsHarvested.map(d => [
        `"${d.section}"`,
        `"${d.category}"`,
        `"${d.recipient}"`,
        d.amount,
        d.taxSavedAt30Pct,
        `"${d.proofDetail}"`
      ])
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Unclaimed_Tax_Deductions_Packet_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported Tax Deductions CSV for ITR Filing');
  }

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  }

  const formatINR = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          background: 'var(--surface-raised)',
          border: '1px solid var(--primary)',
          color: 'var(--text-primary)',
          padding: '0.75rem 1.25rem',
          borderRadius: 8,
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontWeight: 600,
          fontSize: '0.85rem'
        }}>
          <CheckCircle2 size={16} color="var(--green)" /> {toastMsg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.75rem' }}>🧾</span>
            <h1 className="text-h1">Forensic Portfolio X-Ray & Wealth Drag Auditor</h1>
            <span className="badge badge-red" style={{ fontSize: '0.75rem' }}>
              4-Pillar Audit
            </span>
          </div>
          <p className="text-sm text-secondary">
            Scans mutual fund overlap drag, regular plan commissions, recurring zombie debits, and unharvested tax deductions into a unified recovery plan.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => runAudit(true)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Sparkles size={14} /> Sample Audit Telemetry
          </button>
          <button
            onClick={() => navigate('/app/xray')}
            className="btn btn-ghost btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)' }}
          >
            <Layers size={14} /> Fund Overlap Matrix <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Upload Statement Box */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <h3 className="text-h3" style={{ marginBottom: '0.25rem' }}>Scan New Bank Statement / E-Bill (PDF / CSV)</h3>
        <p className="text-xs text-secondary" style={{ marginBottom: '1rem' }}>
          Supports password-protected statements from HDFC, SBI, ICICI, Axis, and Zerodha ledger statements.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
          <div>
            <label className="text-xs text-muted">Bank Statement PDF / CSV</label>
            <input
              type="file"
              accept=".pdf,.csv"
              onChange={e => setFile(e.target.files[0])}
              style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '0.45rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}
            />
          </div>

          <div>
            <label className="text-xs text-muted">PDF Password (if encrypted)</label>
            <input
              type="password"
              placeholder="e.g. PAN + DOB"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '0.45rem 0.75rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
            />
          </div>

          <button
            onClick={() => runAudit(false)}
            disabled={loading}
            className="btn btn-primary"
            style={{ height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <Upload size={16} /> {loading ? 'Auditing Telemetry...' : 'Run Forensic Audit'}
          </button>
        </div>
      </div>

      {data && (
        <>
          {/* Interactive 25-Year Fee & Commission Leakage Horizon Chart */}
          <ForensicFeeLeakageChart
            market="IN"
            initialPortfolio={state?.consumer?.netWorth?.total || 12487320}
            commissionDragPct={1.25}
            expenseRatioDragPct={0.45}
            zombieAnnualTotal={data?.totalLeakage || 28400}
          />

          {/* Executive Consolidated Leakage Banner */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {/* Total Drag */}
            <div className="card" style={{ borderLeft: '4px solid var(--red)', background: 'linear-gradient(135deg, rgba(239,68,68,0.06), transparent)' }}>
              <div className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Annual Financial Drag</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--red)', marginTop: 4 }}>
                {formatINR(data.totalLeakage || 153978)} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ year</span>
              </div>
              <div className="text-xs text-secondary" style={{ marginTop: 4 }}>
                Consolidated across 4 leak streams
              </div>
            </div>

            {/* 10-Yr Compounded Recovery */}
            <div className="card" style={{ borderLeft: '4px solid var(--green)', background: 'linear-gradient(135deg, rgba(16,185,129,0.06), transparent)' }}>
              <div className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>10-Year Compounded Recovery</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--green)', marginTop: 4 }}>
                +{formatINR(data.tenYearCompoundedWealth || 2694615)}
              </div>
              <div className="text-xs text-secondary" style={{ marginTop: 4 }}>
                Compounded @ 12% CAGR over a decade
              </div>
            </div>

            {/* Scanned Volume */}
            <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
              <div className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>Audit Coverage & Period</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Space Grotesk', marginTop: 4 }}>
                {formatINR(data.totalDebitSpend || 342600)}
              </div>
              <div className="text-xs text-secondary" style={{ marginTop: 4 }}>
                {data.statementPeriod || 'Last 90 Days'} ({data.accountNumber || 'HDFC Bank'})
              </div>
            </div>
          </div>

          {/* Action Center: PDF & RIA Dispatch */}
          <div className="card" style={{ background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 className="text-h3" style={{ margin: 0, marginBottom: 2 }}>Institutional Audit Reports & Fiduciary Dispatch</h3>
              <p className="text-xs text-secondary" style={{ margin: 0 }}>
                Download certified executive vector report or dispatch the remediation checklist to your SEBI RIA review queue.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={downloadExecutiveReportPDF}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Download size={14} /> Download Executive Report (PDF)
              </button>

              {dispatchedToAdvisor ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--green)', fontSize: '0.8rem', fontWeight: 600 }}>
                    <CheckCircle2 size={15} /> Queued in Advisor Portal
                  </span>
                  <button
                    onClick={() => navigate('/advisor/recommendations')}
                    className="btn btn-sm btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    Open Advisor Queue <ArrowUpRight size={13} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleDispatchToAdvisor}
                  className="btn btn-sm btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Send size={14} /> Dispatch Remediation to SEBI RIA
                </button>
              )}
            </div>
          </div>

          {/* 4-Pillar Breakdown Grid */}
          <div>
            <h3 className="text-h3" style={{ marginBottom: '0.75rem' }}>4-Pillar Forensic Leakage Breakdown</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              {(data.leakagePillars || []).map(pillar => (
                <div
                  key={pillar.id}
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '1.25rem',
                    border: '1px solid var(--glass-border)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {pillar.name}
                      </span>
                      <span className={`badge ${pillar.badge === 'URGENT' || pillar.badge === 'HIGH_PRIORITY' ? 'badge-red' : pillar.badge === 'RECOVERABLE' ? 'badge-green' : 'badge-gold'}`} style={{ fontSize: '0.65rem' }}>
                        {pillar.badge}
                      </span>
                    </div>

                    <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: pillar.category === 'TAX_RECOVERY' ? 'var(--green)' : 'var(--red)', marginBottom: '0.5rem' }}>
                      {pillar.category === 'TAX_RECOVERY' ? '+' : '-'}{formatINR(pillar.annualBleed)}/yr
                    </div>

                    <p className="text-xs text-secondary" style={{ lineHeight: 1.5, marginBottom: '0.75rem' }}>
                      {pillar.description}
                    </p>
                  </div>

                  <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '0.5rem 0.75rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Remediation:</strong> {pillar.remediation}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 1-Click Direct Mutual Fund Transition Package */}
          <div className="card" style={{ border: '1px solid var(--border-active, #6366f1)', background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(16,185,129,0.04))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 className="text-h3" style={{ margin: 0 }}>1-Click Direct Mutual Fund Transition Package</h3>
                  <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>SEBI Mandated Direct Plan Switch</span>
                </div>
                <p className="text-xs text-secondary" style={{ margin: '0.25rem 0 0' }}>
                  Eliminate distributor commissions immediately. Direct plans have zero distributor kickbacks, adding +1.0% to +1.3% compounded alpha annually.
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span className="text-xs text-muted" style={{ display: 'block' }}>Total Commission Drain Saved:</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--green)', fontFamily: 'Space Grotesk' }}>
                  +{formatINR(DIRECT_MF_CONVERSIONS.reduce((s, f) => s + f.annualFeeSaving, 0))}/yr
                </span>
              </div>
            </div>

            {/* Direct Proxy Matching Table */}
            <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                    <th style={{ textAlign: 'left', padding: '0.6rem 0.5rem' }}>Current Regular Fund</th>
                    <th style={{ textAlign: 'left', padding: '0.6rem 0.5rem' }}>Direct Equivalent</th>
                    <th style={{ textAlign: 'right', padding: '0.6rem 0.5rem' }}>AUM</th>
                    <th style={{ textAlign: 'center', padding: '0.6rem 0.5rem' }}>TER Delta</th>
                    <th style={{ textAlign: 'right', padding: '0.6rem 0.5rem' }}>Annual Drain</th>
                    <th style={{ textAlign: 'center', padding: '0.6rem 0.5rem' }}>Tax Impact</th>
                    <th style={{ textAlign: 'right', padding: '0.6rem 0.5rem' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {DIRECT_MF_CONVERSIONS.map((fund) => (
                    <tr key={fund.id} style={{ borderBottom: '1px solid var(--glass-border)33' }}>
                      <td style={{ padding: '0.65rem 0.5rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{fund.fundName}</div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Folio: {fund.folio} • {fund.rta}</div>
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--green)' }}>{fund.directProxyName}</div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>Direct Growth Option</div>
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', fontFamily: 'Space Grotesk', fontWeight: 600 }}>
                        {formatINR(fund.currentValue)}
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>
                        <span style={{ color: 'var(--red)', fontWeight: 600 }}>{fund.regularTER}%</span>
                        <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>&rarr;</span>
                        <span style={{ color: 'var(--green)', fontWeight: 700 }}>{fund.directTER}%</span>
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', color: 'var(--green)', fontWeight: 800, fontFamily: 'Space Grotesk' }}>
                        +{formatINR(fund.annualFeeSaving)}/yr
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>
                        <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>
                          ₹0 Tax (Within ₹1.25L Sec 112A)
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenLetterModal(fund)}
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
          </div>

          {/* Transfer Request Letter Modal */}
          {letterModalFund && (
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
                      Formal SEBI Direct Mutual Fund Switch Letter
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLetterModalFund(null)}
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
The Registrar & Transfer Agent (${letterModalFund.rta}) /
The Operations Head, ${letterModalFund.amc}

Subject: Request for Direct Conversion / Switch of Units under SEBI Circular SEBI/HO/IMD/DF2/CIR/P/2018/137

Dear Sir / Madam,

I am writing to formally instruct the immediate switch/conversion of my mutual fund units from the Regular Plan to the Direct Plan:

1. Investor Name: ${user?.name || 'Arjun Sharma'}
2. PAN: ${user?.pan || 'ABCDE1234F'}
3. Folio Number: ${letterModalFund.folio}
4. Current Scheme: ${letterModalFund.fundName}
5. Target Direct Scheme: ${letterModalFund.directProxyName}
6. Units to Switch: ALL Units (100% balance)

Statutory Compliance Notice:
In accordance with SEBI circular SEBI/HO/IMD/DF2/CIR/P/2018/137, no distributor intervention, broker sign-off, or unauthorized administrative friction shall impede an investor's statutory right to switch to the Direct Plan. Under Section 112A of the Income Tax Act 1961, the unrealized gains for this folio remain within my statutory tax-free exemption threshold for the current financial year.

Please process this switch transaction immediately and transmit the updated Consolidated Account Statement (CAS) to my registered email address.

Yours faithfully,

${user?.name || 'Arjun Sharma'}
Date: ${new Date().toLocaleDateString('en-GB')}`}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`To,\nThe Registrar & Transfer Agent (${letterModalFund.rta}) ...`);
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
                      const blob = new Blob([`To,\nThe Registrar & Transfer Agent (${letterModalFund.rta}) ...`], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `SEBI_Direct_Switch_${letterModalFund.rta}_${letterModalFund.folio.replace('/', '_')}.txt`;
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
                    <span>Download Formal Letter (TXT)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Zombie Subscriptions List */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 className="text-h3">Silent Zombie Subscriptions & Auto-Debits ({data.zombieSubscriptions?.length || 0})</h3>
                <p className="text-xs text-secondary">Recurring charges detected from unused memberships, bloated cloud storage, and forgotten auto-renewals.</p>
              </div>
              <span className="badge badge-red">Bleeding {formatINR(data.zombieSubscriptionAnnualBleed)}/yr</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(data.zombieSubscriptions || []).map(sub => (
                <div key={sub.id} style={{
                  padding: '1rem',
                  background: 'var(--surface-raised)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{sub.merchant}</span>
                      <span className={`badge ${sub.status === 'HIGH_LEAK' ? 'badge-red' : 'badge-gold'}`} style={{ fontSize: '0.65rem' }}>
                        {sub.status === 'HIGH_LEAK' ? 'UNATTENDED LEAK' : 'UNDER-UTILIZED'}
                      </span>
                    </div>
                    <div className="text-xs text-muted" style={{ fontFamily: 'monospace' }}>Raw: {sub.rawString}</div>
                    <div className="text-xs text-secondary" style={{ marginTop: 4 }}>💡 {sub.insight}</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, color: 'var(--red)', fontSize: '1.1rem' }}>
                        -{formatINR(sub.annualCost)}/yr
                      </div>
                      <div className="text-xs text-muted">{sub.frequency}</div>
                    </div>

                    <a
                      href={sub.cancelUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      Cancel <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tax Deductions Harvester */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 className="text-h3">Auto-Harvested Tax Deduction Receipts</h3>
                <p className="text-xs text-secondary">Payments identified as eligible tax deductions under Sections 80D, 80G, and 80C.</p>
              </div>

              <button
                onClick={exportTaxDeductionsCSV}
                className="btn btn-primary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Download size={14} /> Export Tax Proof Packet (CSV)
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Section & Category</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Recipient / Entity</th>
                    <th style={{ textAlign: 'right', padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Amount</th>
                    <th style={{ textAlign: 'right', padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Tax Saved (30% Slab)</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.taxDeductionsHarvested || []).map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--glass-border)22' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>{item.section}</span>
                        <div className="text-xs text-secondary" style={{ marginTop: 2 }}>{item.category}</div>
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>{item.recipient}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'Space Grotesk' }}>{formatINR(item.amount)}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'Space Grotesk', fontWeight: 800, color: 'var(--green)' }}>
                        +{formatINR(item.taxSavedAt30Pct)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
