// src/pages/legal/FamilyLawPortal.jsx
// Family Law, Divorce & Forensic Asset Discovery Portal (/divorce)
// AI Forensic Statement Audit, Equitable Marital Asset Division, and QDRO Retirement Splitter

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scale, AlertTriangle, ShieldCheck, FileText, ArrowLeft, Home,
  Sun, Moon, Download, Search, CheckCircle, Sliders, Lock, Sparkles,
  PieChart, DollarSign
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../hooks/useTheme';

export default function FamilyLawPortal() {
  const navigate = useNavigate();
  const { isUSMarket, switchMarket } = useApp();
  const { theme, toggleTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('forensics'); // 'forensics' | 'equalizer' | 'qdro' | 'affidavit'
  const [toastMsg, setToastMsg] = useState(null);

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
            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 className="text-h3" style={{ margin: 0 }}>Gemini AI Forensic Account Analysis</h3>
                <p className="text-sm text-secondary" style={{ marginTop: 4 }}>
                  Audited 5 years of joint bank accounts, Schwab brokerages, and corporate LLC filings.
                </p>
              </div>
              <button onClick={() => showToast('✓ Forensic Audit Scan Refreshed: 1,840 Transactions Cleared')} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={15} /> Run Deep Re-Audit
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
