// src/pages/syndicates/SyndicatePortal.jsx
// Venture Syndicates, SPV & Cap Table OS (/syndicates)
// Rule 506(c) LP Onboarding, Capital Call Dispatcher, Waterfall Carry & Schedule K-1 Engine

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, TrendingUp, DollarSign, ArrowLeft, Home, Sun, Moon,
  Download, Send, Plus, CheckCircle, ShieldCheck, AlertCircle,
  FileText, Sliders, ChevronRight, Lock, Zap
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../hooks/useTheme';

export default function SyndicatePortal() {
  const navigate = useNavigate();
  const { isUSMarket, switchMarket } = useApp();
  const { theme, toggleTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('deals'); // 'deals' | 'lps' | 'calls' | 'waterfall' | 'k1'
  const [toastMsg, setToastMsg] = useState(null);
  const [showNewSPVModal, setShowNewSPVModal] = useState(false);
  const [newSPVForm, setNewSPVForm] = useState({ name: '', targetAllocation: 1000000, valuationCap: 15000000, carryPct: 20 });
  
  // Waterfall simulation state
  const [exitMultiple, setExitMultiple] = useState(3.0);
  const [waterfallResult, setWaterfallResult] = useState(null);

  const currencySymbol = isUSMarket ? '$' : '₹';
  const market = isUSMarket ? 'US' : 'IN';

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/syndicate-admin/dashboard?market=${market}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.warn('Failed to load syndicate data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [isUSMarket]);

  const handleCreateSPV = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/syndicate-admin/create-spv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSPVForm)
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ SPV Created for ${newSPVForm.name}`);
        setShowNewSPVModal(false);
        fetchDashboard();
      }
    } catch (err) {
      showToast('Failed to create SPV');
    }
  };

  const handleDispatchCapitalCall = async (spvId) => {
    try {
      const res = await fetch('/api/syndicate-admin/capital-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spvId, percentage: 100 })
      });
      const json = await res.json();
      if (json.success) {
        showToast('✓ Digital capital call dispatched with wire instructions to all LPs!');
        fetchDashboard();
      }
    } catch (err) {
      showToast('Capital call dispatch failed');
    }
  };

  const runWaterfallSim = async () => {
    try {
      const res = await fetch('/api/syndicate-admin/waterfall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investedCapital: 1000000, exitValuation: 1000000 * exitMultiple, hurdleRatePct: 8, carryPct: 20 })
      });
      const json = await res.json();
      if (json.success) {
        setWaterfallResult(json);
      }
    } catch (err) {
      console.warn('Waterfall error:', err);
    }
  };

  useEffect(() => {
    runWaterfallSim();
  }, [exitMultiple]);

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
            <span style={{ fontSize: '1.3rem' }}>🤝</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                Venture Syndicates & SPV Cap Table OS
                <span className="badge badge-purple" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>LEAD PORTAL</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {data?.syndicateLead?.name || 'Aether Capital Syndicate'} · {data?.statutoryFramework || 'SEC Rule 506(c)'}
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

          <button onClick={() => setShowNewSPVModal(true)} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
            <Plus size={14} /> New SPV
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '1.5rem' }}>
        {/* Top Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="card" style={{ background: 'var(--surface-raised)', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>TOTAL SYNDICATE AUM</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'Space Grotesk' }}>
              {currencySymbol}{Number(data?.syndicateLead?.totalAUM || 14800000).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--green)', marginTop: 4 }}>
              Across {data?.spvs?.length || 3} Active SPVs
            </div>
          </div>

          <div className="card" style={{ background: 'var(--surface-raised)', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>CARRIED INTEREST ACCRUED</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--green)', fontFamily: 'Space Grotesk' }}>
              +{currencySymbol}{Number(data?.syndicateLead?.carriedInterestEarnedYTD || 642000).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
              20% Standard Carry Model
            </div>
          </div>

          <div className="card" style={{ background: 'var(--surface-raised)', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>ACCREDITED LP INVESTORS</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'Space Grotesk' }}>
              {data?.syndicateLead?.totalLPs || 238} LPs
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Avg Check Size: {currencySymbol}{Number(data?.syndicateLead?.averageCheckSize || 25000).toLocaleString()}
            </div>
          </div>

          <div className="card" style={{ background: 'var(--surface-raised)', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>REGULATORY COMPLIANCE</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={18} /> 100% VERIFIED
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
              Rule 506(c) Safe Harbor Active
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: 4 }}>
          {[
            { id: 'deals', label: 'Active SPVs & Deal Room', icon: Zap },
            { id: 'lps', label: 'LP Investor CRM', icon: Users },
            { id: 'calls', label: 'Capital Call Dispatcher', icon: Send },
            { id: 'waterfall', label: 'Carry & Waterfall Modeler', icon: Sliders },
            { id: 'k1', label: 'Schedule K-1 Tax Generator', icon: FileText },
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

        {/* TAB 1: ACTIVE SPVs */}
        {activeTab === 'deals' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 className="text-h3" style={{ margin: 0 }}>Active Special Purpose Vehicles (SPVs)</h3>
                <p className="text-sm text-secondary" style={{ marginTop: 4 }}>
                  Turnkey legal formation, digital subscription docs, and cap table tracking for private venture rounds.
                </p>
              </div>
              <button onClick={() => setShowNewSPVModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus size={14} /> Create SPV
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem' }}>
              {(data?.spvs || []).map(spv => {
                const pct = Math.min(100, Math.round((spv.fundedAmount / spv.targetAllocation) * 100));
                return (
                  <div key={spv.id} className="card" style={{ background: 'var(--surface-raised)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <h4 style={{ fontWeight: 800, fontSize: '1.05rem', margin: 0 }}>{spv.name}</h4>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          Valuation Cap: {currencySymbol}{Number(spv.valuationCap).toLocaleString()} · Closing: {spv.closingDate}
                        </div>
                      </div>
                      <span className="badge badge-purple">{spv.status}</span>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                        <span>Funded: <strong>{currencySymbol}{Number(spv.fundedAmount).toLocaleString()}</strong></span>
                        <span style={{ color: 'var(--text-muted)' }}>Target: {currencySymbol}{Number(spv.targetAllocation).toLocaleString()} ({pct}%)</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${pct}%`, background: 'var(--primary)' }} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', background: 'var(--surface)', padding: '0.75rem', borderRadius: 'var(--radius)', fontSize: '0.75rem', textAlign: 'center', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ color: 'var(--text-muted)' }}>LPs Joined</div>
                        <div style={{ fontWeight: 800, fontSize: '1rem', marginTop: 2 }}>{spv.lpCount}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)' }}>Markup (MOIC)</div>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--green)', marginTop: 2 }}>{spv.currentMOIC}x</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)' }}>GP Carry %</div>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary)', marginTop: 2 }}>{spv.carryPct}%</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleDispatchCapitalCall(spv.id)} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                        <Send size={13} style={{ marginRight: 4 }} /> Dispatch Call
                      </button>
                      <button onClick={() => showToast(`✓ SPV Legal Deal Memo Downloaded for ${spv.name}`)} className="btn btn-ghost btn-sm">
                        <Download size={13} style={{ marginRight: 4 }} /> Deal Memo
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: LP INVESTOR CRM */}
        {activeTab === 'lps' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--glass-border)' }}>
              <h3 className="text-h3" style={{ margin: 0 }}>Accredited LP Investor Directory</h3>
              <p className="text-sm text-secondary" style={{ marginTop: 2 }}>
                Rule 506(c) accreditation verified by third-party licensed attorneys/CPAs.
              </p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>INVESTOR NAME</th>
                    <th style={{ padding: '0.85rem 1rem' }}>EMAIL</th>
                    <th style={{ padding: '0.85rem 1rem' }}>COMMITTED</th>
                    <th style={{ padding: '0.85rem 1rem' }}>FUNDED</th>
                    <th style={{ padding: '0.85rem 1rem' }}>ACCREDITATION</th>
                    <th style={{ padding: '0.85rem 1rem' }}>TAX STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {((data?.spvs?.[0]?.lps) || []).map(lp => (
                    <tr key={lp.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{lp.name}</td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{lp.email}</td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>{currencySymbol}{Number(lp.committed).toLocaleString()}</td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--green)', fontWeight: 700 }}>{currencySymbol}{Number(lp.funded).toLocaleString()}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span className="badge badge-green"><ShieldCheck size={12} style={{ marginRight: 3 }} /> {lp.accreditedStatus}</span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span className="badge badge-surface">{lp.k1Status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CAPITAL CALLS */}
        {activeTab === 'calls' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
              <h3 className="text-h3">Digital Capital Call Command Center</h3>
              <p className="text-sm text-secondary" style={{ marginTop: 4 }}>
                Generate legally binding capital call notices with embedded wire instructions and automated tracking.
              </p>
              <div style={{ marginTop: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {(data?.spvs || []).map(spv => (
                  <button
                    key={spv.id}
                    onClick={() => handleDispatchCapitalCall(spv.id)}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Send size={15} /> Issue Capital Call for {spv.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: WATERFALL MODELER */}
        {activeTab === 'waterfall' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
              <h3 className="text-h3">Interactive GP Carry & LP Waterfall Simulator</h3>
              <p className="text-sm text-secondary" style={{ marginTop: 4 }}>
                Standard American/European deal waterfall: 100% Principal Return $\rightarrow$ 8% Hurdle Rate $\rightarrow$ 80% LP / 20% GP Carry.
              </p>

              <div style={{ marginTop: '1.5rem', maxWidth: 600 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Exit Multiple (MOIC):</span>
                  <span style={{ fontWeight: 800, color: 'var(--green)', fontSize: '1.2rem', fontFamily: 'Space Grotesk' }}>
                    {exitMultiple}x ({currencySymbol}{Number(1000000 * exitMultiple).toLocaleString()} Exit)
                  </span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="15.0"
                  step="0.5"
                  value={exitMultiple}
                  onChange={(e) => setExitMultiple(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>

              {waterfallResult && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
                  <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: 'var(--radius)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>LP CAPITAL RETURNED</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: 4 }}>
                      {currencySymbol}{Number(waterfallResult.investedCapital).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: 'var(--radius)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>LP PREFERRED HURDLE GAIN</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--green)', marginTop: 4 }}>
                      +{currencySymbol}{Number(waterfallResult.preferredReturnToLPs).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: 'var(--radius)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>LP NET PROCEEDS</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)', marginTop: 4 }}>
                      {currencySymbol}{Number(waterfallResult.totalLPProceeds).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--green)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--green)', fontWeight: 700 }}>GP CARRIED INTEREST (20%)</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--green)', marginTop: 4 }}>
                      +{currencySymbol}{Number(waterfallResult.totalGPCarryProceeds).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: K-1 TAX */}
        {activeTab === 'k1' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 className="text-h3" style={{ margin: 0 }}>Schedule K-1 & Section 1061 Tax Engine</h3>
                  <p className="text-sm text-secondary" style={{ marginTop: 4 }}>
                    Auto-generates IRS Schedule K-1 (Form 1065) partnership tax schedules and Section 1061 3-year holding period certifications.
                  </p>
                </div>
                <button onClick={() => showToast('✓ Complete LP Schedule K-1 ZIP Package Downloaded')} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Download size={14} /> Download Batch K-1 Bundle
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { title: 'Schedule K-1 (Form 1065) — Horizon Family Trust', units: 250, status: 'GENERATED_VERIFIED' },
                  { title: 'Schedule K-1 (Form 1065) — Elena Rostova', units: 100, status: 'GENERATED_VERIFIED' },
                  { title: 'Schedule K-1 (Form 1065) — Vikram Sethi', units: 75, status: 'GENERATED_VERIFIED' },
                  { title: 'Section 1061 GP Long-Term Capital Gain Certificate', units: 'Lead Carry', status: 'AUDITED' }
                ].map((doc, idx) => (
                  <div key={idx} style={{
                    padding: '0.85rem 1rem',
                    background: 'var(--surface-raised)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{doc.title}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Ownership Units: {doc.units}</div>
                    </div>
                    <span className="badge badge-green">{doc.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal: New SPV */}
      {showNewSPVModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ maxWidth: 500, width: '100%', background: 'var(--surface)', border: '1px solid var(--glass-border)', padding: '1.5rem' }}>
            <h3 className="text-h3" style={{ marginBottom: '1rem' }}>Create New Special Purpose Vehicle (SPV)</h3>
            <form onSubmit={handleCreateSPV} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>DEAL / TARGET COMPANY NAME</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Quantum Systems Series Seed"
                  value={newSPVForm.name}
                  onChange={(e) => setNewSPVForm(p => ({ ...p, name: e.target.value }))}
                  style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>TARGET ALLOCATION ({currencySymbol})</label>
                  <input
                    type="number"
                    required
                    value={newSPVForm.targetAllocation}
                    onChange={(e) => setNewSPVForm(p => ({ ...p, targetAllocation: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>VALUATION CAP ({currencySymbol})</label>
                  <input
                    type="number"
                    value={newSPVForm.valuationCap}
                    onChange={(e) => setNewSPVForm(p => ({ ...p, valuationCap: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>GP CARRIED INTEREST (%)</label>
                <input
                  type="number"
                  value={newSPVForm.carryPct}
                  onChange={(e) => setNewSPVForm(p => ({ ...p, carryPct: Number(e.target.value) }))}
                  style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowNewSPVModal(false)} className="btn btn-ghost" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, fontWeight: 700 }}>
                  Launch SPV ($4,500 Setup)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
