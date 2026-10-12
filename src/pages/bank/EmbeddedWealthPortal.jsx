// src/pages/bank/EmbeddedWealthPortal.jsx
// Commercial Bank & White-Label Embedded Wealth SDK Portal (/bank-embed)
// Embedded Robo-Advisory, Deposit-to-Wealth Sweeps, and Bank Partner Revenue Share (15-25 bps)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building, Code, Smartphone, Monitor, ShieldCheck, ArrowLeft, Home,
  Sun, Moon, Download, Sliders, CheckCircle, Copy, Sparkles, TrendingUp,
  DollarSign, RefreshCw, Key
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../hooks/useTheme';

const DEFAULT_BANK_DATA = {
  partnerId: 'bank_partner_882',
  institutionName: 'First Pacific Bank & Trust',
  institutionType: 'Commercial Bank & Trust',
  market: 'US',
  brand: {
    primaryColor: '#0284C7',
    secondaryColor: '#0EA5E9',
    accentColor: '#10B981',
    themeMode: 'dark',
    logoText: 'FirstPacific Wealth AI',
    customDomain: 'wealth.firstpacificbank.com',
  },
  commercialTerms: {
    advisoryWrapBps: 25,
    bankRevenueSharePct: 70,
    monthlyPlatformLicenseFee: 4500.00,
    contractStatus: 'ENTERPRISE_ACTIVE',
  },
  metrics: {
    totalRetailCheckingAccounts: 65000,
    sweptWealthAccountsActive: 11840,
    conversionRate: '18.2%',
    embeddedAUM: 88750000.00,
    bankAnnualFeeRevenueProjected: 155312.50,
    depositRetentionScore: 94,
  },
  enabledFeatures: {
    directIndexing: true,
    automatedSweepRobo: true,
    taxLossHarvesting: true,
    fireSimulator: true,
    voiceBanker: true,
  }
};

export default function EmbeddedWealthPortal() {
  const navigate = useNavigate();
  const { isUSMarket, switchMarket } = useApp();
  const { theme, toggleTheme } = useTheme();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(DEFAULT_BANK_DATA);
  const [activeTab, setActiveTab] = useState('brand'); // 'brand' | 'simulator' | 'revenue' | 'dev'
  const [toastMsg, setToastMsg] = useState(null);

  // Brand customization state
  const [brandForm, setBrandForm] = useState({
    institutionName: 'First Pacific Bank & Trust',
    primaryColor: '#0284C7',
    secondaryColor: '#0EA5E9',
    logoText: 'FirstPacific Wealth AI',
    customDomain: 'wealth.firstpacificbank.com',
    advisoryBps: 25,
  });

  // Simulator viewport
  const [simViewport, setSimViewport] = useState('mobile'); // 'mobile' | 'desktop'

  // Revenue projection slider
  const [accountCount, setAccountCount] = useState(65000);
  const [avgChecking, setAvgChecking] = useState(8500);

  const currencySymbol = isUSMarket ? '$' : '₹';
  const market = isUSMarket ? 'US' : 'IN';

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/embedded-wealth/config?market=${market}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setBrandForm({
          institutionName: json.data.institutionName,
          primaryColor: json.data.brand.primaryColor,
          secondaryColor: json.data.brand.secondaryColor,
          logoText: json.data.brand.logoText,
          customDomain: json.data.brand.customDomain,
          advisoryBps: json.data.commercialTerms.advisoryWrapBps,
        });
      }
    } catch (err) {
      console.warn('Failed to load embedded config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [isUSMarket]);

  const handleSaveBrand = async () => {
    try {
      const res = await fetch('/api/embedded-wealth/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionName: brandForm.institutionName,
          brand: {
            primaryColor: brandForm.primaryColor,
            secondaryColor: brandForm.secondaryColor,
            logoText: brandForm.logoText,
            customDomain: brandForm.customDomain
          },
          commercialTerms: {
            advisoryWrapBps: brandForm.advisoryBps
          }
        })
      });
      const json = await res.json();
      if (json.success) {
        showToast('✓ White-Label Theme & Brand Configuration Saved');
        fetchConfig();
      }
    } catch (err) {
      showToast('Save failed');
    }
  };

  // Projected math
  const projectedMobilized = Math.round(accountCount * 0.182);
  const projectedAUM = projectedMobilized * avgChecking;
  const annualGrossFee = projectedAUM * (brandForm.advisoryBps / 10000);
  const bankShareRevenue = annualGrossFee * 0.70;

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
            <span style={{ fontSize: '1.3rem' }}>🌐</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                White-Label Embedded Wealth & Banking SDK
                <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>B2B2C EMBEDDED</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {brandForm.institutionName} · FinAgent Embedded Robo-Advisor
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

          <button onClick={handleSaveBrand} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
            <Sparkles size={14} /> Publish Theme
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '1.5rem' }}>
        {/* Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="card" style={{ background: 'var(--surface-raised)', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>EMBEDDED SWEPT AUM</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'Space Grotesk' }}>
              {currencySymbol}{Number(data?.metrics?.embeddedAUM || 88750000).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--green)', marginTop: 4 }}>
              Across {data?.metrics?.sweptWealthAccountsActive?.toLocaleString() || '11,840'} Banking Customers
            </div>
          </div>

          <div className="card" style={{ background: 'var(--surface-raised)', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>BANK ANNUAL REVENUE SHARE</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--green)', fontFamily: 'Space Grotesk' }}>
              +{currencySymbol}{Number(data?.metrics?.bankAnnualFeeRevenueProjected || 155312).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
              70% Bank Take on {brandForm.advisoryBps} bps Fee
            </div>
          </div>

          <div className="card" style={{ background: 'var(--surface-raised)', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>DEPOSIT ADOPTION RATE</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'Space Grotesk' }}>
              {data?.metrics?.conversionRate || '18.2%'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Checking $\rightarrow$ Wealth Sweeps
            </div>
          </div>

          <div className="card" style={{ background: 'var(--surface-raised)', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>DEPOSIT CHURN REDUCTION</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={18} /> 94% RETENTION
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
              Zero Outflow to External Brokers
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: 4 }}>
          {[
            { id: 'brand', label: 'White-Label Brand Studio', icon: Sliders },
            { id: 'simulator', label: 'Live Embedded App Simulator', icon: Monitor },
            { id: 'revenue', label: 'Deposit Sweep Revenue Model', icon: TrendingUp },
            { id: 'dev', label: 'Developer SDK & Embed Docs', icon: Code },
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

        {/* TAB 1: BRAND STUDIO */}
        {activeTab === 'brand' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
            <div className="card">
              <h3 className="text-h3" style={{ marginBottom: '1rem' }}>Partner White-Label Customization</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    COMMERCIAL INSTITUTION NAME
                  </label>
                  <input
                    type="text"
                    value={brandForm.institutionName}
                    onChange={(e) => setBrandForm(p => ({ ...p, institutionName: e.target.value }))}
                    style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    PRIMARY BRAND ACCENT COLOR
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="color"
                      value={brandForm.primaryColor}
                      onChange={(e) => setBrandForm(p => ({ ...p, primaryColor: e.target.value }))}
                      style={{ width: 44, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      value={brandForm.primaryColor}
                      onChange={(e) => setBrandForm(p => ({ ...p, primaryColor: e.target.value }))}
                      style={{ flex: 1, padding: '0.6rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontFamily: 'monospace' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    CUSTOM DOMAIN CNAME
                  </label>
                  <input
                    type="text"
                    value={brandForm.customDomain}
                    onChange={(e) => setBrandForm(p => ({ ...p, customDomain: e.target.value }))}
                    style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    ADVISORY WRAP FEE SPREAD: <strong>{brandForm.advisoryBps} bps (0.{brandForm.advisoryBps}%)</strong>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="5"
                    value={brandForm.advisoryBps}
                    onChange={(e) => setBrandForm(p => ({ ...p, advisoryBps: Number(e.target.value) }))}
                    style={{ width: '100%', accentColor: brandForm.primaryColor }}
                  />
                </div>

                <button onClick={handleSaveBrand} className="btn btn-primary" style={{ background: brandForm.primaryColor, borderColor: brandForm.primaryColor, fontWeight: 700, marginTop: '0.5rem' }}>
                  Save White-Label Theme
                </button>
              </div>
            </div>

            {/* Live Preview Card */}
            <div className="card" style={{ background: 'var(--surface-raised)', border: `2px solid ${brandForm.primaryColor}`, padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: brandForm.primaryColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                  {brandForm.institutionName[0]}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 800 }}>{brandForm.institutionName}</h4>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Powered by FinAgent Embedded Infrastructure</div>
                </div>
              </div>

              <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Customer Checking Account Linked</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: 4 }}>Checking Balance: $14,250.00</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--green)', marginTop: 4 }}>
                  ⚡ Auto-Sweep to 4.9% Yield Active (Excess over $5,000)
                </div>
              </div>

              <button className="btn" style={{ background: brandForm.primaryColor, color: '#fff', width: '100%', fontWeight: 700 }}>
                Open Embedded Wealth Dashboard
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: SIMULATOR */}
        {activeTab === 'simulator' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setSimViewport('mobile')}
                className={`btn btn-sm ${simViewport === 'mobile' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Smartphone size={15} /> Mobile Banking View
              </button>
              <button
                onClick={() => setSimViewport('desktop')}
                className={`btn btn-sm ${simViewport === 'desktop' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Monitor size={15} /> Online Banking Portal View
              </button>
            </div>

            {/* Simulated Device Frame */}
            <div style={{
              width: simViewport === 'mobile' ? 380 : '100%',
              maxWidth: simViewport === 'mobile' ? 380 : 960,
              minHeight: 520,
              background: 'var(--surface)',
              borderRadius: 24,
              border: `3px solid ${brandForm.primaryColor}`,
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Fake Bank Header */}
              <div style={{ background: brandForm.primaryColor, color: '#fff', padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{brandForm.institutionName} Mobile</div>
                <span style={{ fontSize: '0.7rem', opacity: 0.85 }}>FDIC Insured</span>
              </div>

              <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: 'var(--surface-raised)', padding: '1rem', borderRadius: 'var(--radius)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PRIMARY CHECKING</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 4 }}>$8,450.00</div>
                </div>

                <div style={{ background: 'var(--surface-raised)', border: `1px solid ${brandForm.primaryColor}`, padding: '1rem', borderRadius: 'var(--radius)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: brandForm.primaryColor }}>AUTOMATED WEALTH SWEEP</span>
                    <span className="badge badge-green">4.92% APY</span>
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 4 }}>$24,800.00</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    Invested across US Treasuries & Diversified Direct Indexing
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button className="btn btn-sm" style={{ background: brandForm.primaryColor, color: '#fff', fontSize: '0.75rem' }}>
                    Deposit More
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem' }}>
                    Auto-Sweep Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: REVENUE MODEL */}
        {activeTab === 'revenue' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
              <h3 className="text-h3">Partner Deposit Retention & Software Revenue Calculator</h3>
              <p className="text-sm text-secondary" style={{ marginTop: 4 }}>
                Commercial banks retain deposits from fleeing to fintech brokers while earning a 70% share of the {brandForm.advisoryBps} bps advisory fee.
              </p>

              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 600 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Total Retail Checking Accounts:</span>
                    <strong style={{ color: 'var(--primary)' }}>{accountCount.toLocaleString()} Accounts</strong>
                  </div>
                  <input
                    type="range"
                    min="10000"
                    max="500000"
                    step="5000"
                    value={accountCount}
                    onChange={(e) => setAccountCount(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--primary)' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Average Checking Balance Swept:</span>
                    <strong style={{ color: 'var(--green)' }}>{currencySymbol}{avgChecking.toLocaleString()}</strong>
                  </div>
                  <input
                    type="range"
                    min="3000"
                    max="25000"
                    step="500"
                    value={avgChecking}
                    onChange={(e) => setAvgChecking(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--green)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
                <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: 'var(--radius)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>SWEPT WEALTH AUM</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 4 }}>
                    {currencySymbol}{Number(projectedAUM).toLocaleString()}
                  </div>
                </div>
                <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: 'var(--radius)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>BANK NET ANNUAL REVENUE (70%)</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--green)', marginTop: 4 }}>
                    +{currencySymbol}{Number(bankShareRevenue).toLocaleString()}/yr
                  </div>
                </div>
                <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: 'var(--radius)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>FINAGENT PLATFORM SHARE</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', marginTop: 4 }}>
                    +{currencySymbol}{Number(annualGrossFee * 0.30).toLocaleString()}/yr
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DEVELOPER SDK */}
        {activeTab === 'dev' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
              <h3 className="text-h3">Developer REST APIs & Web Component Integration</h3>
              <p className="text-sm text-secondary" style={{ marginTop: 4 }}>
                Integrate FinAgent into your native iOS, Android, or React web banking portal via lightweight SDK or secure iFrame.
              </p>

              <div style={{ marginTop: '1.25rem', background: 'var(--surface-raised)', padding: '1.25rem', borderRadius: 'var(--radius)', position: 'relative' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>EMBED JAVASCRIPT SNIPPET</div>
                <code style={{ fontSize: '0.75rem', color: 'var(--green)', display: 'block', whiteSpace: 'pre-wrap' }}>
{`<div id="finagent-embedded-root"></div>
<script src="https://cdn.finagent.app/sdk/v2/embed.js"
  data-partner-id="${data?.partnerId || 'bank_partner_882'}"
  data-theme="${theme}"
  data-primary-color="${brandForm.primaryColor}">
</script>`}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`<div id="finagent-embedded-root"></div>\n<script src="https://cdn.finagent.app/sdk/v2/embed.js" data-partner-id="${data?.partnerId || 'bank_partner_882'}" data-primary-color="${brandForm.primaryColor}"></script>`);
                    showToast('✓ Embed Code Copied');
                  }}
                  className="btn btn-ghost btn-sm"
                  style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Copy size={13} /> Copy Snippet
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
