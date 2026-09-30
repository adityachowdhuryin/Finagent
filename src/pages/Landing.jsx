import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Sparkles, TrendingUp, Shield, BarChart2, Users, LogIn } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { marketTicker } from '../data/mockMarketData';

function MarketTicker() {
  const doubled = [...marketTicker, ...marketTicker];
  return (
    <div className="market-ticker">
      <div className="ticker-track">
        {doubled.map((item, i) => (
          <div key={i} className="ticker-item">
            <span className="ticker-symbol">{item.symbol}</span>
            <span className="ticker-value">{item.suffix ? `${item.value.toLocaleString('en-IN')}${item.suffix}` : item.value.toLocaleString('en-IN')}</span>
            <span className={`ticker-change ${item.direction}`}>
              {item.direction === 'up' ? '▲' : '▼'} {Math.abs(item.changePct).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const features = [
  { icon: '🔗', label: '60-Second Net Worth Sync', sub: 'AA Network · 7 asset classes' },
  { icon: '🤖', label: 'AI Wealth Co-pilot', sub: 'India-aware · Audit-logged' },
  { icon: '🌾', label: 'Tax-Loss Harvesting', sub: 'LTCG / STCG · FY26 rules' },
  { icon: '🛡️', label: 'SEBI Audit Trail', sub: 'Compliance-ready log' },
];

export default function Landing() {
  const { dispatch, activeMarket, isUSMarket, switchMarket } = useApp();
  const { loginAsDemo } = useAuth();
  const navigate = useNavigate();

  function enterAs(role) {
    loginAsDemo(role === 'advisor' ? 'advisor' : 'investor');
    dispatch({ type: 'SET_ROLE', payload: role });
    navigate(role === 'advisor' ? '/advisor' : '/app');
  }

  const currentFeatures = isUSMarket ? [
    { icon: '🏦', label: 'Plaid 1-Click Sync', sub: 'Fidelity · Chase · Schwab · Marcus' },
    { icon: '🌾', label: 'Wash-Sale Harvester', sub: 'IRC §1091 · VOO ➔ IVV / VTI' },
    { icon: '⚡', label: 'Equity OS (RSU / ISO)', sub: 'Statutory 22% Underwithholding · Form 6251' },
    { icon: '📜', label: 'Living Trust & Will', sub: 'Avoid CA/NY Probate · 100% Legal PDF' },
  ] : features;

  return (
    <div className="landing" style={{ paddingBottom: '3rem' }}>
      {/* Top Navbar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 2rem', maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="sidebar-logo-mark" style={{ width: 34, height: 34, fontSize: '1rem' }}>F</div>
          <div style={{ fontSize: '1.25rem', fontFamily: 'Space Grotesk', fontWeight: 700 }}>Fin<span style={{ color: 'var(--primary-light)' }}>Agent</span></div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Dual Market Toggle Pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'var(--surface-raised)',
            border: '1px solid var(--glass-border)',
            borderRadius: '999px',
            padding: '2px',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}>
            <button
              type="button"
              onClick={() => switchMarket('US')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 9px',
                borderRadius: '999px',
                border: 'none',
                cursor: 'pointer',
                background: isUSMarket ? 'var(--primary)' : 'transparent',
                color: isUSMarket ? '#fff' : 'var(--text-muted)',
                fontWeight: isUSMarket ? 700 : 500,
                transition: 'all 0.15s ease'
              }}
            >
              <span>🇺🇸</span>
              <span>US ($)</span>
            </button>
            <button
              type="button"
              onClick={() => switchMarket('IN')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 9px',
                borderRadius: '999px',
                border: 'none',
                cursor: 'pointer',
                background: !isUSMarket ? 'var(--primary)' : 'transparent',
                color: !isUSMarket ? '#fff' : 'var(--text-muted)',
                fontWeight: !isUSMarket ? 700 : 500,
                transition: 'all 0.15s ease'
              }}
            >
              <span>🇮🇳</span>
              <span>India (₹)</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isUSMarket ? (
              <>
                <Link to="/tools/w2-tax-leak" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: 20 }}>
                  <Sparkles size={13} /> Free W-2 Audit
                </Link>
                <Link to="/tools/pmi-arbitrage" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 20 }}>
                  <TrendingUp size={13} /> Free PMI Audit
                </Link>
              </>
            ) : (
              <>
                <Link to="/tools/ctc-tax-leak" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#c084fc', border: '1px solid rgba(192, 132, 252, 0.25)', borderRadius: 20 }}>
                  <Sparkles size={13} /> Free Salary Tax Audit
                </Link>
                <Link to="/tools/loan-arbitrage" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.25)', borderRadius: 20 }}>
                  <TrendingUp size={13} /> Free Home Loan Audit
                </Link>
              </>
            )}
          </div>

          <div style={{ width: 1, height: 20, background: 'var(--glass-border)' }} />
          <Link to="/login" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <LogIn size={15} /> Sign In
          </Link>
          <Link to="/signup" className="btn btn-primary btn-sm">
            Create Account
          </Link>
        </div>
      </header>

      {/* Background blobs */}
      <div className="landing-bg-blob blob-1" />
      <div className="landing-bg-blob blob-2" />
      <div className="landing-bg-blob blob-3" />

      {/* Hero */}
      <div className="landing-hero animate-fade-in-up">
        <div className="landing-tag">
          <Sparkles size={12} />
          {isUSMarket ? '🇺🇸 Silicon Valley & Wall St Grade Wealth OS · Dual-Market' : '🇮🇳 India-First AI Wealth Intelligence · v1 Investor Demo'}
        </div>
        <h1 className="text-display" style={{ marginBottom: '1rem' }}>
          Your entire financial life,
          <br />
          <span className="gradient-text">{isUSMarket ? 'automated & tax-optimized' : 'one intelligent platform'}</span>
        </h1>
        <p style={{ fontSize: '1.0625rem', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 580, margin: '0 auto' }}>
          {isUSMarket
            ? 'FinAgent unifies your US wealth — 401(k), Roth IRA, HSA, RSUs, Real Estate, and Living Trusts — with AI engines for Wash-Sale harvesting (IRC §1091), statutory W-2 withholding, and PMI elimination.'
            : 'FinAgent unifies India\'s fragmented wealth — stocks, mutual funds, EPF, real estate, insurance — with an AI co-pilot that gives advice your CA would be proud of.'}
        </p>

        {/* Features strip */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem', marginTop: '2rem' }}>
          {currentFeatures.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-full)', padding: '0.4rem 0.875rem', fontSize: '0.8125rem' }}>
              <span>{f.icon}</span>
              <div>
                <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.8125rem' }}>{f.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Role cards */}
      <div className="role-cards animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="role-card" onClick={() => enterAs('consumer')} id="enter-consumer-btn">
          <span className="role-card-icon">📱</span>
          <div className="role-card-title">I'm an Investor</div>
          <div className="role-card-sub">
            {isUSMarket
              ? 'Complete US net worth across 401(k), Roth IRA, Brokerage, and Real Estate with IRC §1091 Tax Harvester.'
              : 'See your complete net worth across 7 asset classes. Let AI optimize taxes, goals, and rebalancing.'}
          </div>
          <div className="role-card-persona">
            <strong>Demo persona:</strong> {isUSMarket ? 'Alex Morgan, 34, San Francisco · $842,000 net worth · Senior Eng at Stripe' : 'Arjun Sharma, 32, Bangalore · ₹1.24 Crore net worth · Salaried at Infosys'}
          </div>
          <div className="role-card-cta">
            Enter as Investor <ArrowRight size={16} />
          </div>
        </div>

        <div className="role-card" onClick={() => enterAs('advisor')} id="enter-advisor-btn">
          <span className="role-card-icon">🏢</span>
          <div className="role-card-title">{isUSMarket ? 'I\'m a CFP® / RIA' : 'I\'m a SEBI Advisor / MFD'}</div>
          <div className="role-card-sub">
            {isUSMarket
              ? 'Manage your entire US client book with fiduciary AI recommendations, Form 1040 reviews, and audit trails.'
              : 'Manage your entire client book with AI-drafted recommendations you review, edit, and approve.'}
          </div>
          <div className="role-card-persona">
            <strong>Demo persona:</strong> {isUSMarket ? 'David Chen, CFP® · 18 HNW Families · $24M AUM · SF Bay Area' : 'Meera Kapoor, SEBI-RIA · 12 clients · ₹4.2 Crore AUM · Mumbai'}
          </div>
          <div className="role-card-cta">
            Enter as Advisor <ArrowRight size={16} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '2.5rem', justifyContent: 'center', marginTop: '2.5rem', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
        {(isUSMarket ? [
          { value: '$38T+', label: 'US Retirement Assets' },
          { value: 'IRC §1091', label: 'Compliant Tax Harvesting' },
          { value: '80% LTV', label: 'HPA Mandatory PMI Removal' },
          { value: '$19 / mo', label: 'Unlimited Pro Access' },
        ] : [
          { value: '20+ Crore', label: 'Indian investors' },
          { value: '~2,500', label: 'SEBI-registered advisors' },
          { value: '2.75 Lakh', label: 'AMFI-registered MFDs' },
          { value: 'Stage 1', label: 'No broker needed' },
        ]).map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.5rem', color: 'var(--text-primary)' }}>{s.value}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <MarketTicker />
    </div>
  );
}
