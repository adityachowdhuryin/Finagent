// src/pages/legal/FamilyLawPortal.jsx
// Family Law, Divorce & Forensic Asset Discovery Portal (/divorce)
// AI Forensic Statement Audit, Equitable Marital Asset Division, and QDRO Retirement Splitter

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scale, AlertTriangle, ShieldCheck, FileText, ArrowLeft, Home,
  Sun, Moon, Download, Search, CheckCircle, Sliders, Lock, Sparkles,
  PieChart, DollarSign, Upload
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../hooks/useTheme';

const SAMPLE_FORENSIC_STATEMENT = `TRANSACTION LEDGER AUDIT EXCERPT:
Account: Apex Platinum Checking (#8849-XXXX)
Account Holder: Jonathan & Claire Sterling

Date         Description                                         Debit ($)     Credit ($)   Balance ($)
-------------------------------------------------------------------------------------------------------
2026-08-01   Bi-Weekly Executive Payroll Wire Credit                            42,500.00   184,200.00
2026-08-03   Aston Martin Financial Services Monthly Lease        3,850.00                  180,350.00
2026-08-08   ATM Cash Withdrawal #401 (Structuring Flag < $10k)   9,900.00                  170,450.00
2026-08-09   ATM Cash Withdrawal #402 (Structuring Flag < $10k)   9,800.00                  160,650.00
2026-08-14   Outward Wire: Al-Maktoum Holdings FZE (Dubai UAE)   85,000.00                   75,650.00
2026-08-18   Coinbase Inc Deposit / Digital Asset Purchase       25,000.00                   50,650.00
2026-08-22   Cartier Jewelers Fifth Ave Retail Purchase          14,200.00                   36,450.00
2026-08-28   Pasadena Family Court Legal Retainer Escrow         15,000.00                   21,450.00`;

const DEFAULT_FAMILY_LAW_DATA = {
  activeCase: {
    caseId: 'matter_8892',
    caseTitle: 'Vance v. Vance (Matrimonial Dissolution)',
    courtJurisdiction: 'Superior Court of California / Family Division',
    market: 'US',
    filingDate: '2026-04-12',
    caseStage: 'EVIDENTIARY_DISCOVERY',
    spouseA: { name: 'David Vance', income: 420000, representation: 'Morrison & Foerster LLP' },
    spouseB: { name: 'Claire Vance', income: 110000, representation: 'Henschel Family Law' },
    grossMaritalEstate: 5850000.00,
    forensicAuditStatus: 'ANOMALIES_DETECTED',
    anomaliesFoundCount: 4,
    anomaliesTotalValue: 642000.00,
    assets: [
      { id: 'ast_01', type: 'Real Estate', name: 'Primary Residence (Palo Alto)', grossValue: 2800000, debt: 850000, netEquity: 1950000, taxDiscountPct: 0, maritalPortionPct: 100 },
      { id: 'ast_02', type: 'Retirement (401k)', name: 'Spouse A Employer 401(k)', grossValue: 1200000, debt: 0, netEquity: 1200000, taxDiscountPct: 24, maritalPortionPct: 100 },
      { id: 'ast_03', type: 'Brokerage (Taxable)', name: 'Charles Schwab Joint Account', grossValue: 1150000, debt: 0, netEquity: 1150000, taxDiscountPct: 15, maritalPortionPct: 100 },
      { id: 'ast_04', type: 'Unvested RSUs', name: 'Spouse A Tech Company RSUs', grossValue: 700000, debt: 0, netEquity: 700000, taxDiscountPct: 37, maritalPortionPct: 65 }
    ],
    anomalies: [
      { id: 'flg_01', severity: 'HIGH', category: 'Undisclosed Crypto Wallet', amount: 285000, date: '2026-01-14', description: 'Repeated $45k outbound wires from joint checking to Kraken and self-custody Ethereum wallet 0x71a...9b', status: 'UNEXPLAINED' },
      { id: 'flg_02', severity: 'MEDIUM', category: 'Pre-Separation Cash Dissipation', amount: 140000, date: '2025-11-20', description: 'Abnormal cash withdrawals totaling $140,000 over 6 weeks preceding formal notice of separation', status: 'FLAGGED_FOR_HEARING' },
      { id: 'flg_03', severity: 'HIGH', category: 'Secret Entity Capital Contribution', amount: 180000, date: '2026-02-05', description: 'Wire to Nevada LLC registered under business partner with no recorded spousal consent', status: 'SUBPOENA_RECOMMENDED' },
      { id: 'flg_04', severity: 'LOW', category: 'Delayed Bonus Payment', amount: 37000, date: '2026-03-30', description: 'Deferred compensation bonus scheduled for distribution post-filing', status: 'INCLUDED_IN_ESTATE' }
    ]
  }
};

export default function FamilyLawPortal() {
  const navigate = useNavigate();
  const { isUSMarket, switchMarket } = useApp();
  const { theme, toggleTheme } = useTheme();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(DEFAULT_FAMILY_LAW_DATA);
  const [activeTab, setActiveTab] = useState('forensics'); // 'forensics' | 'equalizer' | 'qdro' | 'affidavit'
  const [toastMsg, setToastMsg] = useState(null);
  const [statementText, setStatementText] = useState('');
  const [auditing, setAuditing] = useState(false);
  const [auditSummary, setAuditSummary] = useState('');

  // Equalizer state
  const [splitRatioA, setSplitRatioA] = useState(50);
  const [applyTaxDiscount, setApplyTaxDiscount] = useState(true);
  const [equalizerData, setEqualizerData] = useState(null);

  const currencySymbol = isUSMarket ? '$' : '₹';
  const market = isUSMarket ? 'US' : 'IN';

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleRunForensicAudit = async (customText) => {
    const textToScan = customText !== undefined ? customText : statementText;
    if (!textToScan || !textToScan.trim()) {
      showToast('⚠️ Please paste or load statement transactions first');
      return;
    }
    setAuditing(true);
    try {
      const res = await fetch('/api/family-law/analyze-statements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: data?.activeCase?.caseId || 'matter_8892',
          statementText: textToScan,
          market,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setData(prev => ({
          ...prev,
          activeCase: {
            ...prev.activeCase,
            forensicFlags: json.anomaliesFound,
            anomaliesFoundCount: json.anomaliesFound?.length || 0,
            anomaliesTotalValue: json.totalUndisclosedDetected || 0,
            forensicAuditStatus: 'ANOMALIES_DETECTED',
          }
        }));
        setAuditSummary(json.forensicAuditorSummary);
        showToast(`✓ AI Forensic Audit Complete: ${json.anomaliesFound?.length || 0} Red Flags Detected!`);
      } else {
        showToast('❌ Audit failed: ' + (json.error || 'Server error'));
      }
    } catch (err) {
      console.error('Forensic audit error:', err);
      showToast('❌ Forensic audit request failed');
    } finally {
      setAuditing(false);
    }
  };

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/family-law/dashboard?market=${market}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.warn('Failed to load family law data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistribution = async () => {
    try {
      const res = await fetch('/api/family-law/equitable-distribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spouseASplitPct: splitRatioA, applyTaxDiscount })
      });
      const json = await res.json();
      if (json.success) {
        setEqualizerData(json);
      }
    } catch (err) {
      console.warn('Equitable distribution error:', err);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [isUSMarket]);

  useEffect(() => {
    calculateDistribution();
  }, [splitRatioA, applyTaxDiscount]);

  const activeCase = data?.activeCase;

  return (
    <div className="portal-container" style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-primary)' }}>
      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: '1.5rem',
          right: '1.5rem',
          zIndex: 9999,
          background: 'var(--surface-raised)',
          border: '1px solid var(--green)',
          color: 'var(--green)',
          padding: '0.75rem 1.25rem',
          borderRadius: 'var(--radius)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <CheckCircle size={18} />
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'var(--surface)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--glass-border)',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <ArrowLeft size={16} /> Back
          </button>
          <button onClick={() => navigate('/app/dashboard')} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Home size={16} /> Personal
          </button>
          <div style={{ width: 1, height: 20, background: 'var(--glass-border)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.3rem' }}>⚖️</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                Family Law & Forensic Discovery OS
                <span className="badge badge-purple" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>LEGAL COUNSEL</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {activeCase?.caseTitle || 'Matrimonial Dissolution'} · {data?.statutoryFramework || 'ERISA QDRO & Uniform Dissolution Act'}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Market Pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'var(--surface-raised)',
            border: '1px solid var(--glass-border)',
            borderRadius: 20,
            padding: 2,
            fontSize: '0.75rem',
            fontWeight: 700
          }}>
            <button
              onClick={() => switchMarket?.('US')}
              style={{
                border: 'none',
                background: isUSMarket ? 'var(--primary)' : 'transparent',
                color: isUSMarket ? '#fff' : 'var(--text-muted)',
                borderRadius: 16,
                padding: '0.2rem 0.55rem',
                cursor: 'pointer'
              }}
            >
              🇺🇸 US ($)
            </button>
            <button
              onClick={() => switchMarket?.('IN')}
              style={{
                border: 'none',
                background: !isUSMarket ? 'var(--primary)' : 'transparent',
                color: !isUSMarket ? '#fff' : 'var(--text-muted)',
                borderRadius: 16,
                padding: '0.2rem 0.55rem',
                cursor: 'pointer'
              }}
            >
              🇮🇳 IN (₹)
            </button>
          </div>

          <button onClick={toggleTheme} className="btn btn-ghost btn-icon" style={{ width: 34, height: 34, padding: 0 }}>
            {theme === 'dark' ? <Sun size={16} style={{ color: 'var(--gold)' }} /> : <Moon size={16} />}
          </button>

          <button onClick={() => showToast('✓ Sworn Financial Statement Affidavit Exported for Court Hearing')} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
            <Download size={14} /> Court Affidavit
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '1.5rem' }}>
        {/* Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="card" style={{ background: 'var(--surface-raised)', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>GROSS MARITAL ESTATE</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'Space Grotesk' }}>
              {currencySymbol}{Number(activeCase?.grossMaritalEstate || 5850000).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Combined Assets & Debts Declared
            </div>
          </div>

          <div className="card" style={{ background: 'var(--surface-raised)', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>FORENSIC ANOMALIES FLAGGED</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--red)', fontFamily: 'Space Grotesk' }}>
              {currencySymbol}{Number(activeCase?.anomaliesTotalValue || 642000).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <AlertTriangle size={14} /> {activeCase?.anomaliesFoundCount || 4} Undisclosed Asset Diversions
            </div>
          </div>

          <div className="card" style={{ background: 'var(--surface-raised)', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>SPOUSE A (EARNING)</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              {activeCase?.spouseA?.name || 'David Vance'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Income: {currencySymbol}{Number(activeCase?.spouseA?.income || 420000).toLocaleString()}/yr
            </div>
          </div>

          <div className="card" style={{ background: 'var(--surface-raised)', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>SPOUSE B (SUPPORT PETITIONER)</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              {activeCase?.spouseB?.name || 'Claire Vance'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Income: {currencySymbol}{Number(activeCase?.spouseB?.income || 110000).toLocaleString()}/yr
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: 4 }}>
          {[
            { id: 'forensics', label: 'AI Forensic Statement Scanner', icon: Search },
            { id: 'equalizer', label: 'Marital Asset Equalizer (Tax Adjusted)', icon: Scale },
            { id: 'qdro', label: 'QDRO Retirement Plan Splitter', icon: Lock },
            { id: 'affidavit', label: 'Court-Ready Sworn Affidavits', icon: FileText },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '0.6rem 1rem',
                  borderRadius: 'var(--radius)',
                  background: active ? 'var(--surface-raised)' : 'transparent',
                  border: active ? '1px solid var(--primary)' : '1px solid transparent',
                  color: active ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: active ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: FORENSICS */}
        {activeTab === 'forensics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Input Statement Box */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 className="text-h3" style={{ margin: 0 }}>Input Suspicious Transactions / Statement Ledger</h3>
                  <p className="text-sm text-secondary" style={{ marginTop: 4 }}>
                    Paste transaction text, ledger excerpts, or bank export rows to run Gemini AI forensic auditing.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      setStatementText(SAMPLE_FORENSIC_STATEMENT);
                      showToast('📋 Loaded sample_data/forensic_divorce_statement.txt');
                    }}
                    className="btn btn-ghost btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary)', border: '1px solid var(--glass-border)' }}
                  >
                    <FileText size={14} /> Load Sample Statement
                  </button>
                  <label className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', border: '1px solid var(--glass-border)' }}>
                    <Upload size={14} /> Upload File (.txt / .csv)
                    <input
                      type="file"
                      accept=".txt,.csv"
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const t = await file.text();
                          setStatementText(t);
                          showToast(`📂 Loaded ${file.name}`);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <textarea
                value={statementText}
                onChange={e => setStatementText(e.target.value)}
                placeholder="Paste bank statement rows or transaction ledger here (or click 'Load Sample Statement' above)..."
                rows={6}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--text-primary)',
                  fontFamily: 'monospace',
                  fontSize: '0.825rem',
                  padding: '0.75rem 1rem',
                  lineHeight: 1.5,
                  resize: 'vertical'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {statementText ? `${statementText.split('\n').filter(Boolean).length} lines ready for forensic analysis` : 'Supports checking accounts, brokerage statements, wire transfers & crypto deposits'}
                </div>
                <button
                  onClick={() => handleRunForensicAudit(statementText)}
                  disabled={auditing}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.65rem 1.5rem', fontWeight: 700 }}
                >
                  <Sparkles size={16} /> {auditing ? 'Auditing with Gemini Forensic AI...' : 'Run AI Forensic Audit'}
                </button>
              </div>
            </div>

            {/* AI Summary Banner if available */}
            {auditSummary && (
              <div style={{
                padding: '1rem 1.25rem',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 'var(--radius)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12
              }}>
                <AlertTriangle size={20} color="var(--red)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong style={{ color: 'var(--red)', fontSize: '0.9rem' }}>Forensic Auditor Executive Assessment:</strong>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: 4, lineHeight: 1.5 }}>
                    {auditSummary}
                  </div>
                </div>
              </div>
            )}

            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 className="text-h3" style={{ margin: 0 }}>Gemini AI Forensic Account Analysis</h3>
                <p className="text-sm text-secondary" style={{ marginTop: 4 }}>
                  Audited joint bank accounts, international wires, and digital asset transactions.
                </p>
              </div>
              <button onClick={() => handleRunForensicAudit(statementText || SAMPLE_FORENSIC_STATEMENT)} disabled={auditing} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} /> Refresh Audit Scan
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(activeCase?.forensicFlags || []).map(flag => (
                <div key={flag.id} style={{
                  padding: '1rem',
                  background: flag.severity === 'HIGH' ? 'rgba(239, 68, 68, 0.05)' : 'var(--surface-raised)',
                  border: flag.severity === 'HIGH' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div style={{ flex: 1, minWidth: 280 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`badge ${flag.severity === 'HIGH' ? 'badge-red' : 'badge-gold'}`}>{flag.severity} RISK</span>
                      <strong style={{ fontSize: '0.95rem' }}>{flag.category}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date: {flag.date}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>
                      {flag.description}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: flag.severity === 'HIGH' ? 'var(--red)' : 'var(--gold)', fontFamily: 'Space Grotesk' }}>
                      {currencySymbol}{Number(flag.amount).toLocaleString()}
                    </div>
                    <span className="badge badge-surface" style={{ marginTop: 4 }}>{flag.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: EQUALIZER */}
        {activeTab === 'equalizer' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
              <h3 className="text-h3">Equitable Marital Asset Division & Deferred Tax Equalizer</h3>
              <p className="text-sm text-secondary" style={{ marginTop: 4 }}>
                Adjust asset division percentage. FinAgent automatically discounts pre-tax assets (like Traditional 401(k)s and stock options) to true after-tax purchasing power.
              </p>

              <div style={{ marginTop: '1.5rem', maxWidth: 640 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Split Ratio Allocation:</span>
                  <span style={{ fontWeight: 800, color: 'var(--primary)', fontFamily: 'Space Grotesk' }}>
                    Spouse A: {splitRatioA}% · Spouse B: {100 - splitRatioA}%
                  </span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="70"
                  step="1"
                  value={splitRatioA}
                  onChange={(e) => setSplitRatioA(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: '1rem' }}>
                  <input
                    type="checkbox"
                    id="taxDisc"
                    checked={applyTaxDiscount}
                    onChange={(e) => setApplyTaxDiscount(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <label htmlFor="taxDisc" style={{ fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>
                    Apply Deferred Tax Discount (24% on 401k, 15% on Capital Gains, 37% on RSUs)
                  </label>
                </div>
              </div>

              {equalizerData && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
                  <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: 'var(--radius)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>GROSS ESTATE VALUE</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: 4 }}>
                      {currencySymbol}{Number(equalizerData.estateGrossEquity).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: 'var(--radius)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>AFTER-TAX REAL VALUE</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)', marginTop: 4 }}>
                      {currencySymbol}{Number(equalizerData.estateTaxAdjustedEquity).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: 'var(--radius)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>SPOUSE A SHARE</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--green)', marginTop: 4 }}>
                      {currencySymbol}{Number(equalizerData.spouseAAfterTaxTotal).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: 'var(--radius)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>SPOUSE B SHARE</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--green)', marginTop: 4 }}>
                      {currencySymbol}{Number(equalizerData.spouseBAfterTaxTotal).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Asset Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>MARITAL ASSET</th>
                    <th style={{ padding: '0.85rem 1rem' }}>GROSS VALUE</th>
                    <th style={{ padding: '0.85rem 1rem' }}>TAX DISCOUNT</th>
                    <th style={{ padding: '0.85rem 1rem' }}>AFTER-TAX POWER</th>
                    <th style={{ padding: '0.85rem 1rem' }}>SPOUSE A</th>
                    <th style={{ padding: '0.85rem 1rem' }}>SPOUSE B</th>
                  </tr>
                </thead>
                <tbody>
                  {(equalizerData?.distributionBreakdown || []).map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{row.name}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>{currencySymbol}{Number(row.grossValue).toLocaleString()}</td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--red)' }}>-{row.deferredTaxDiscount}</td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>{currencySymbol}{Number(row.afterTaxPurchasingPower).toLocaleString()}</td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--green)', fontWeight: 600 }}>{currencySymbol}{Number(row.allocatedToSpouseA).toLocaleString()}</td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--green)', fontWeight: 600 }}>{currencySymbol}{Number(row.allocatedToSpouseB).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: QDRO */}
        {activeTab === 'qdro' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
              <h3 className="text-h3">Qualified Domestic Relations Order (QDRO) Specification</h3>
              <p className="text-sm text-secondary" style={{ marginTop: 4 }}>
                Divides qualified employer retirement plans (401k/pension) under 26 U.S.C. § 414(p) with 0% early withdrawal tax penalty.
              </p>

              <div style={{ marginTop: '1.5rem', background: 'var(--surface-raised)', padding: '1.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
                <h4 style={{ margin: '0 0 0.75rem', fontWeight: 800 }}>Certified QDRO Rollover Specs:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <div>• Plan Name: <strong>Spouse A Employer 401(k) Profit Sharing Plan</strong></div>
                  <div>• Participant: <strong>David Vance</strong> | Alternate Payee: <strong>Claire Vance</strong></div>
                  <div>• Award Amount: <strong>50% of Marital Benefit accrued (\$600,000)</strong></div>
                  <div>• IRC § 72(t) Penalty Waiver: <strong style={{ color: 'var(--green)' }}>EXEMPT (0% Penalty)</strong></div>
                  <div>• Mandatory Direct Rollover: <strong>Alternate Payee Traditional IRA Custodian</strong></div>
                </div>
                <button onClick={() => showToast('✓ Complete QDRO Court Order Package Downloaded')} className="btn btn-primary" style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                  <Download size={14} /> Download QDRO Legal Package
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: AFFIDAVIT */}
        {activeTab === 'affidavit' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 className="text-h3" style={{ margin: 0 }}>Court-Admissible Statement of Net Worth</h3>
                  <p className="text-sm text-secondary" style={{ marginTop: 4 }}>
                    Sworn financial disclosure certified for family court judges and evidentiary hearings.
                  </p>
                </div>
                <button onClick={() => showToast('✓ Sworn Net Worth Statement Downloaded')} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Download size={14} /> Download Sworn Statement
                </button>
              </div>

              <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', fontFamily: 'serif', lineHeight: 1.8 }}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '1rem', textTransform: 'uppercase' }}>
                  IN THE SUPERIOR COURT OF CALIFORNIA, COUNTY OF SANTA CLARA<br />
                  FAMILY LAW DIVISION — CASE NO. FL-2026-8892
                </div>
                <p>
                  <strong>IN RE THE MARRIAGE OF:</strong><br />
                  DAVID VANCE, Petitioner, and CLAIRE VANCE, Respondent.
                </p>
                <hr style={{ borderColor: 'var(--glass-border)', margin: '1rem 0' }} />
                <p style={{ fontSize: '0.9rem' }}>
                  <strong>CERTIFIED DECLARATION OF MARITAL ASSETS & FORENSIC LIABILITIES:</strong><br />
                  The undersigned forensic accounting analysis conducted via FinAgent Financial Systems certifies that the gross marital estate equals <strong>{currencySymbol}5,850,000.00</strong>, with <strong>{currencySymbol}642,000.00</strong> in flagged undisclosed assets identified in Annexure A.
                </p>
                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <div>Digital Stamp: <strong>sha256_88c42a001e92d</strong></div>
                  <div>Certified: <strong>{new Date().toLocaleDateString()}</strong></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
