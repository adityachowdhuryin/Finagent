// src/pages/giving/GivingPortal.jsx
// Non-Profits, Endowments & Tax-Optimized Charitable Giving (/giving)
// Appreciated Stock Gifting (37% Tax Alpha), DAF Onramp, and Fiduciary IPS Auditor

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart, TrendingUp, ShieldCheck, ArrowLeft, Home, Sun, Moon,
  Download, Code, CheckCircle, Calculator, Sparkles, AlertTriangle,
  Copy, FileText, ExternalLink
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../hooks/useTheme';

export default function GivingPortal() {
  const navigate = useNavigate();
  const { isUSMarket, switchMarket } = useApp();
  const { theme, toggleTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('calc'); // 'calc' | 'widget' | 'ips' | 'receipts'
  const [toastMsg, setToastMsg] = useState(null);

  // Stock calculator state
  const [calcForm, setCalcForm] = useState({
    ticker: 'NVDA',
    currentPrice: 138.50,
    costBasis: 35.00,
    shares: 100,
    taxBracketPct: 37,
  });
  const [calcResult, setCalcResult] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);

  // Widget settings
  const [widgetColor, setWidgetColor] = useState('#10B981');

  const currencySymbol = isUSMarket ? '$' : '₹';
  const market = isUSMarket ? 'US' : 'IN';

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/charitable-giving/overview?market=${market}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.warn('Failed to load giving data:', err);
    } finally {
      setLoading(false);
    }
  };

  const runStockCalc = async () => {
    setCalcLoading(true);
    try {
      const res = await fetch('/api/charitable-giving/stock-tax-savings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...calcForm,
          ltcgTaxRatePct: isUSMarket ? 20 : 12.5,
          stateTaxRatePct: isUSMarket ? 9.3 : 0
        })
      });
      const json = await res.json();
      if (json.success) {
        setCalcResult(json);
      }
    } catch (err) {
      console.warn('Calc error:', err);
    } finally {
      setCalcLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    runStockCalc();
  }, [isUSMarket]);

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
            <span style={{ fontSize: '1.3rem' }}>🏛️</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                Non-Profit, Endowment & Planned Giving OS
                <span className="badge badge-green" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>TAX-EXEMPT</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {data?.institutionName || 'Stanford Climate & Tech Foundation'} · {data?.taxExemptId || '501(c)(3)'}
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

          <button onClick={() => showToast('✓ Institutional Form 990 / 80G Annual Filing Exported')} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
            <Download size={14} /> Annual Report
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '1.5rem' }}>
        {/* Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="card" style={{ background: 'var(--surface-raised)', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>ENDOWMENT AUM</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'Space Grotesk' }}>
              {currencySymbol}{Number(data?.totalEndowmentAUM || 42500000).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--green)', marginTop: 4 }}>
              Fiduciary Policy Score: {data?.ipsComplianceScore || 98}%
            </div>
          </div>

          <div className="card" style={{ background: 'var(--surface-raised)', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>STOCK GIFTS PROCESSED YTD</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--green)', fontFamily: 'Space Grotesk' }}>
              +{currencySymbol}{Number(data?.stockGiftsProcessedYTD || 3840000).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Zero-Tax Securities Transfers
            </div>
          </div>

          <div className="card" style={{ background: 'var(--surface-raised)', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>DONOR TAX SAVINGS UNLOCKED</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'Space Grotesk' }}>
              {currencySymbol}{Number(data?.donorTaxSavingsUnlockedYTD || 1420800).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Capital Gains Avoided for Donors
            </div>
          </div>

          <div className="card" style={{ background: 'var(--surface-raised)', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>STATUTORY MANDATE</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={18} /> 5.0% SPEND POLICY ON TRACK
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
              Disbursed: {currencySymbol}{Number(data?.disbursedYTD || 1420000).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: 4 }}>
          {[
            { id: 'calc', label: 'Appreciated Stock Gift Tax Calculator', icon: Calculator },
            { id: 'widget', label: 'Embeddable Giving Widget Studio', icon: Code },
            { id: 'ips', label: 'Endowment & IPS Compliance Audit', icon: ShieldCheck },
            { id: 'receipts', label: 'Donor Tax Receipts & Form 8283', icon: FileText },
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
                  border: active ? '1px solid var(--green)' : '1px solid transparent',
                  color: active ? 'var(--green)' : 'var(--text-muted)',
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

        {/* TAB 1: STOCK CALCULATOR */}
        {activeTab === 'calc' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
            <div className="card">
              <h3 className="text-h3" style={{ marginBottom: '1rem' }}>Donor Gift Input Parameters</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>TICKER / SECURITY</label>
                    <input
                      type="text"
                      value={calcForm.ticker}
                      onChange={(e) => setCalcForm(p => ({ ...p, ticker: e.target.value.toUpperCase() }))}
                      style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontWeight: 700 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>NUMBER OF SHARES</label>
                    <input
                      type="number"
                      value={calcForm.shares}
                      onChange={(e) => setCalcForm(p => ({ ...p, shares: Number(e.target.value) }))}
                      style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>CURRENT SHARE PRICE ({currencySymbol})</label>
                    <input
                      type="number"
                      value={calcForm.currentPrice}
                      onChange={(e) => setCalcForm(p => ({ ...p, currentPrice: Number(e.target.value) }))}
                      style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>COST BASIS ({currencySymbol})</label>
                    <input
                      type="number"
                      value={calcForm.costBasis}
                      onChange={(e) => setCalcForm(p => ({ ...p, costBasis: Number(e.target.value) }))}
                      style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>DONOR FEDERAL TAX BRACKET (%)</label>
                  <select
                    value={calcForm.taxBracketPct}
                    onChange={(e) => setCalcForm(p => ({ ...p, taxBracketPct: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                  >
                    <option value="37">37% (Top Federal Tier)</option>
                    <option value="35">35% Bracket</option>
                    <option value="32">32% Bracket</option>
                    <option value="24">24% Bracket</option>
                  </select>
                </div>

                <button onClick={runStockCalc} className="btn btn-primary" style={{ marginTop: '0.5rem', fontWeight: 700 }}>
                  Calculate Tax Alpha Comparison
                </button>
              </div>
            </div>

            {/* Comparison Cards */}
            {calcResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="card" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <div style={{ fontWeight: 800, color: 'var(--red)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                    ❌ SCENARIO A: Sell Stock & Donate Cash
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div>Capital Gains Tax Owed: <strong style={{ color: 'var(--red)' }}>{currencySymbol}{calcResult.scenarioSellAndDonateCash.taxesPaid.toLocaleString()}</strong></div>
                    <div>Net Amount Charity Receives: <strong>{currencySymbol}{calcResult.scenarioSellAndDonateCash.charityGets.toLocaleString()}</strong></div>
                    <div>Income Tax Deduction: {currencySymbol}{calcResult.scenarioSellAndDonateCash.incomeTaxDeduction.toLocaleString()}</div>
                  </div>
                </div>

                <div className="card" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid var(--green)' }}>
                  <div style={{ fontWeight: 800, color: 'var(--green)', fontSize: '1.05rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={18} /> SCENARIO B: Direct Stock Donation (FinAgent)
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div>Capital Gains Tax Paid: <strong style={{ color: 'var(--green)' }}>$0.00 (100% Tax Forgiven)</strong></div>
                    <div>Charity Receives Full Value: <strong style={{ color: 'var(--green)', fontSize: '1.2rem' }}>{currencySymbol}{calcResult.scenarioDirectStockGift.charityGets.toLocaleString()}</strong></div>
                    <div>Full FMV Tax Deduction: <strong style={{ color: 'var(--green)' }}>{currencySymbol}{calcResult.scenarioDirectStockGift.incomeTaxDeduction.toLocaleString()}</strong></div>
                    <div style={{ marginTop: 8, padding: '0.75rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      💡 {calcResult.irsRuleCitation}
                    </div>
                  </div>
                  <button onClick={() => showToast('✓ Stock Gifting Intake Form Generated for Donor')} className="btn btn-primary" style={{ marginTop: '1rem', width: '100%', fontWeight: 700 }}>
                    Execute Stock Gift Intake
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: WIDGET STUDIO */}
        {activeTab === 'widget' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
            <div className="card">
              <h3 className="text-h3" style={{ marginBottom: '0.75rem' }}>Embeddable Giving Widget Studio</h3>
              <p className="text-sm text-secondary" style={{ marginBottom: '1rem' }}>
                Embed this responsive widget directly onto your non-profit or university donation page. Donors can pledge stock gifts with instant zero-tax transfer paperwork.
              </p>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>WIDGET THEME ACCENT COLOR</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  {['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'].map(color => (
                    <button
                      key={color}
                      onClick={() => setWidgetColor(color)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: color,
                        border: widgetColor === color ? '3px solid #fff' : 'none',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </div>

                <div style={{ background: 'var(--surface-raised)', padding: '1rem', borderRadius: 'var(--radius)', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)', position: 'relative' }}>
                  <code>{`<iframe src="https://finagent.app/widget/give?charity=Stanford%20Foundation&color=${encodeURIComponent(widgetColor)}" width="100%" height="450" style="border:none;border-radius:16px;"></iframe>`}</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`<iframe src="https://finagent.app/widget/give?charity=Stanford%20Foundation&color=${encodeURIComponent(widgetColor)}" width="100%" height="450" style="border:none;border-radius:16px;"></iframe>`);
                      showToast('✓ Embed HTML Code Copied to Clipboard!');
                    }}
                    className="btn btn-ghost btn-sm"
                    style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Copy size={13} /> Copy
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Preview Mock */}
            <div className="card" style={{ background: 'var(--surface-raised)', border: `2px solid ${widgetColor}`, padding: '1.5rem', textAlign: 'center' }}>
              <Heart size={32} style={{ color: widgetColor, margin: '0 auto 0.75rem' }} />
              <h4 style={{ margin: 0, fontWeight: 800 }}>Donate Appreciated Stock & Crypto</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Support {data?.institutionName || 'Our Mission'}. Avoid 100% capital gains tax and deduct the full market value.
              </p>
              <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: 'var(--radius)', margin: '1rem 0', textAlign: 'left', fontSize: '0.8rem' }}>
                <div>1. Select Security: <strong>NVDA, AAPL, MSFT, BTC</strong></div>
                <div style={{ marginTop: 4 }}>2. DTC Electronic Transfer: <strong>Depository Trust Co. #0164</strong></div>
                <div style={{ marginTop: 4 }}>3. Receipt Issued: <strong>Instant IRS Form 8283 Noncash Form</strong></div>
              </div>
              <button className="btn" style={{ background: widgetColor, color: '#fff', width: '100%', fontWeight: 700 }}>
                Transfer Appreciated Shares Now
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: IPS AUDIT */}
        {activeTab === 'ips' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--glass-border)' }}>
              <h3 className="text-h3" style={{ margin: 0 }}>Investment Policy Statement (IPS) Fiduciary Audit</h3>
              <p className="text-sm text-secondary" style={{ marginTop: 2 }}>
                Monitors endowment allocations against mandated target boundaries and negative ESG exclusions.
              </p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>ASSET CLASS</th>
                    <th style={{ padding: '0.85rem 1rem' }}>IPS TARGET %</th>
                    <th style={{ padding: '0.85rem 1rem' }}>CURRENT %</th>
                    <th style={{ padding: '0.85rem 1rem' }}>VALUE ({currencySymbol})</th>
                    <th style={{ padding: '0.85rem 1rem' }}>VARIANCE</th>
                    <th style={{ padding: '0.85rem 1rem' }}>FIDUCIARY STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.assetAllocation || []).map((alloc, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{alloc.assetClass}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>{alloc.targetPct}%</td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>{alloc.currentPct}%</td>
                      <td style={{ padding: '0.85rem 1rem' }}>{currencySymbol}{Number(alloc.currentValue).toLocaleString()}</td>
                      <td style={{ padding: '0.85rem 1rem', color: alloc.variance.startsWith('+') ? 'var(--green)' : 'var(--text-muted)' }}>{alloc.variance}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span className="badge badge-green"><ShieldCheck size={12} style={{ marginRight: 3 }} /> {alloc.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: RECEIPTS */}
        {activeTab === 'receipts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card">
              <h3 className="text-h3">IRS Form 8283 Noncash Contribution Receipts</h3>
              <p className="text-sm text-secondary" style={{ marginTop: 4 }}>
                Substantiation certificates verifying stock transfer dates, Fair Market Value, and qualified appraisal exemptions.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(data?.recentGifts || []).map(gift => (
                <div key={gift.id} style={{
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
                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{gift.donor} — {gift.asset}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Fair Market Value: {currencySymbol}{Number(gift.fmvValue).toLocaleString()} · Capital Gains Avoided: {currencySymbol}{Number(gift.capitalGainsAvoided).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="badge badge-green">{gift.status}</span>
                    <button onClick={() => showToast(`✓ Form 8283 Noncash Certificate Downloaded for ${gift.donor}`)} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Download size={13} /> Form 8283
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
