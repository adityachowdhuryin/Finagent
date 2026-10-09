import React, { useState } from 'react';
import { Menu, RefreshCw, Search, Lock, Eye, EyeOff, SlidersHorizontal, X, ChevronLeft, ChevronRight, ChevronDown, Sun, Moon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationBell from '../notifications/NotificationBell';
import NotificationPanel from '../notifications/NotificationPanel';
import PrivacyLock from '../common/PrivacyLock';
import DailyPulseNotification from '../common/DailyPulseNotification';
import { useLocation, useNavigate } from 'react-router-dom';

const breadcrumbs = {
  // Hub 1: Home
  '/app/dashboard': ['FinAgent', 'Home', 'Overview'],
  '/app/health-score': ['FinAgent', 'Home', 'Health Score'],
  '/app/dna': ['FinAgent', 'Home', 'Financial DNA'],
  '/app/peers': ['FinAgent', 'Home', 'Peer Benchmark'],

  // Frontier Venture-Scale Expansion Routes
  '/app/direct-indexing': ['FinAgent', 'Execution', 'Direct Indexing Terminal'],
  '/app/e-file': ['FinAgent', 'Tax & Alpha', 'Government E-Filing'],
  '/app/notary': ['FinAgent', 'Family & Wealth', 'Remote Online Notary'],
  '/app/esop-financing': ['FinAgent', 'Enterprise', 'ESOP Liquidity Marketplace'],
  '/app/syndicates': ['FinAgent', 'Family & Wealth', 'Alternative Syndicates'],
  '/app/live-banker': ['FinAgent', 'Advisory', 'Live Multimodal Banker'],

  // Autonomous Execution & Wealth Engines
  '/app/execution': ['FinAgent', 'Execution', '1-Click Execution Hub'],

  '/app/credit': ['FinAgent', 'Credit', 'Bureau Health & Simulator'],
  '/app/payroll': ['FinAgent', 'Payroll', 'Direct Deposit Splitter'],
  '/app/roundups': ['FinAgent', 'Micro-Investing', 'Round-Up Jar & Dip Radar'],
  '/app/household': ['FinAgent', 'Multi-Player', 'Household & Spouse Co-Pilot'],
  '/app/succession': ['FinAgent', 'Succession', 'Proof-of-Life Escrow'],
  '/app/offers': ['FinAgent', 'Marketplace', 'Perks & Cashback Offers'],
  '/cpa': ['FinAgent', 'Practice', 'CPA Tax Portal'],
  '/work': ['FinAgent', 'Enterprise', 'FinAgent for Work (HR)'],

  // Hub 2: Investments
  '/app/portfolio': ['FinAgent', 'Investments', 'Holdings'],
  '/app/performance': ['FinAgent', 'Investments', 'Performance'],
  '/app/xray': ['FinAgent', 'Investments', 'Portfolio X-Ray'],
  '/app/rebalancing': ['FinAgent', 'Investments', 'Rebalancing'],
  '/app/sip-optimizer': ['FinAgent', 'Investments', 'SIP Optimizer'],
  '/app/watchlist': ['FinAgent', 'Investments', 'Watchlist'],
  '/app/news': ['FinAgent', 'Investments', 'Market Pulse'],

  // Hub 3: Tax & Alpha
  '/app/commission-hunter': ['FinAgent', 'Tax & Alpha', 'Commission Hunter'],
  '/app/ctc-optimizer': ['FinAgent', 'Tax & Alpha', 'CTC Optimizer'],
  '/app/forensic-audit': ['FinAgent', 'Tax & Alpha', 'Forensic Audit'],
  '/app/esop-rsu': ['FinAgent', 'Tax & Alpha', 'ESOP & RSU Tax'],
  '/app/card-optimizer': ['FinAgent', 'Tax & Alpha', 'Card Maximizer'],
  '/app/tax': ['FinAgent', 'Tax & Alpha', 'Tax Harvester'],
  '/app/tax-loss-bot': ['FinAgent', 'Tax & Alpha', 'Tax-Loss Bot'],
  '/app/itr': ['FinAgent', 'Tax & Alpha', 'ITR Assistant'],
  '/app/cashflow': ['FinAgent', 'Tax & Alpha', 'Cashflow'],

  // Hub 4: Family & Wealth
  '/app/family-hub': ['FinAgent', 'Family & Wealth', 'Family Hub'],
  '/app/emergency-vault': ['FinAgent', 'Family & Wealth', 'Emergency Vault'],
  '/app/digital-will': ['FinAgent', 'Family & Wealth', 'Digital Will'],
  '/app/goals': ['FinAgent', 'Family & Wealth', 'Goals'],
  '/app/fire': ['FinAgent', 'Family & Wealth', 'FIRE Calculator'],
  '/app/loan': ['FinAgent', 'Family & Wealth', 'Loan Negotiator'],
  '/app/insurance': ['FinAgent', 'Family & Wealth', 'Insurance Decoder'],
  '/app/govt-schemes': ['FinAgent', 'Family & Wealth', 'Govt Schemes'],

  // Hub 5: Advisory
  '/app/ai-advisor': ['FinAgent', 'Advisory', 'AI Copilot'],
  '/app/doctor': ['FinAgent', 'Advisory', 'Portfolio Doctor'],
  '/app/life-events': ['FinAgent', 'Advisory', 'Life Events'],
  '/app/marketplace': ['FinAgent', 'Advisory', 'Advisor Hub'],
  '/app/whatsapp': ['FinAgent', 'Advisory', 'WhatsApp AI'],
  '/app/documents': ['FinAgent', 'Advisory', 'Document Intelligence'],
  '/app/link-advisor': ['FinAgent', 'Advisory', 'Link Advisor'],

  // Sync
  '/app/aa-sync': ['FinAgent', 'Sync', '1-Click AA Sync'],
  '/app/cas-import': ['FinAgent', 'Sync', 'Import CAS'],
  '/app/report-settings': ['FinAgent', 'Sync', 'Monthly Report'],
  '/app/reports': ['FinAgent', 'Sync', 'PDF Reports'],

  // US Market Parallel Routes
  '/app/w2-optimizer': ['FinAgent', 'Tax & Alpha', 'W-2 & 401(k) Optimizer'],
  '/app/wash-sale': ['FinAgent', 'Tax & Alpha', 'Wash-Sale Harvester'],
  '/app/equity-os': ['FinAgent', 'Tax & Alpha', 'Equity OS (RSU / ISO)'],
  '/app/us-cards': ['FinAgent', 'Tax & Alpha', 'Points & 5/24 Maximizer'],
  '/app/cross-border': ['FinAgent', 'Tax & Alpha', 'US-India Tax Shield'],
  '/app/mortgage-refi': ['FinAgent', 'Family & Wealth', 'Mortgage & PMI Removal'],
  '/app/living-trust': ['FinAgent', 'Family & Wealth', 'Living Trust & Will'],
  '/app/fee-hunter': ['FinAgent', 'Family & Wealth', '401(k) Fee Drag Hunter'],
  '/app/plaid-sync': ['FinAgent', 'Sync', 'Plaid 1-Click Sync'],

  // Advisor
  '/advisor/clients': ['Advisor Portal', 'Client Book'],
  '/advisor/recommendations': ['Advisor Portal', 'Reco Queue'],
  '/advisor/audit': ['Advisor Portal', 'Audit Log'],
  '/advisor/insights': ['Advisor Portal', 'Practice Insights'],
  '/advisor/meeting-prep': ['Advisor Portal', 'Meeting Prep'],
  '/advisor/report-cards': ['Advisor Portal', 'Report Cards'],
  '/advisor/compliance': ['Advisor Portal', 'Compliance Watch'],

  // High-Impact Monetization Suites
  '/app/bounties': ['FinAgent', 'Marketplace', 'Partner Bounties & Carry'],
  '/app/black': ['FinAgent', 'VIP Concierge', 'FinAgent Black'],
};

export default function TopBar({ onMenuClick, onSearchClick }) {
  const { state, switchMarket, experienceMode, setExperienceMode } = useApp();
  const { userRole, switchRole } = useAuth();
  const activeMode = experienceMode || state?.experienceMode || 'pro';
  const currentMarket = state?.activeMarket || 'US';
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isWorkPortal = location.pathname.startsWith('/work');
  const crumbs = breadcrumbs[location.pathname] || ['FinAgent'];
  const isAdvisor = state?.activeRole === 'advisor' || userRole === 'advisor';
  const isDark = theme === 'dark';


  const [panelOpen, setPanelOpen] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  // Pass portfolio context for AI-generated alerts
  const portfolioData = !isAdvisor ? {
    netWorth: state.consumer?.netWorth,
    holdings: state.consumer?.holdings,
    goals: state.consumer?.goals,
    healthScore: state.consumer?.healthScore,
  } : null;

  const { notifications, unreadCount, loading, lastUpdated, generateAlerts, markRead, markAllRead, ALERT_TYPES } =
    useNotifications(portfolioData);

  return (
    <>
      <header className="topbar">
        <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', minWidth: 0, flexShrink: 1, overflow: 'hidden' }}>
          <button className="btn btn-ghost btn-icon mobile-menu-btn" onClick={onMenuClick}>
            <Menu size={20} />
          </button>

          {/* History Navigation (Back / Forward) */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', marginRight: '0.25rem', flexShrink: 0 }}>
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              onClick={() => navigate(-1)}
              title="Back"
              aria-label="Back"
              style={{ width: 32, height: 32, padding: 0 }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              onClick={() => navigate(1)}
              title="Forward"
              aria-label="Forward"
              style={{ width: 32, height: 32, padding: 0 }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <nav className="topbar-breadcrumb">
            {crumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="topbar-breadcrumb-sep">/</span>}
                <span className={i === crumbs.length - 1 ? 'text-primary font-semibold' : 'text-muted'}>
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </nav>

          {/* Cmd+K Quick Search Pill */}
          {!isAdvisor && (
            <button
              onClick={onSearchClick}
              type="button"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.35rem 0.75rem',
                background: 'var(--surface-raised)',
                border: '1px solid var(--glass-border)',
                borderRadius: 20,
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                marginLeft: '0.5rem',
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
              title="Search all tools (Cmd + K)"
            >
              <Search size={13} style={{ color: 'var(--primary)' }} />
              <span className="hidden-mobile">Search all tools...</span>
              <kbd style={{
                fontSize: '0.65rem',
                padding: '0.1rem 0.35rem',
                background: 'var(--surface)',
                border: '1px solid var(--glass-border)',
                borderRadius: 4,
                fontFamily: 'monospace',
                color: 'var(--text-secondary)',
              }}>
                ⌘K
              </kbd>
            </button>
          )}
        </div>

        <div className="topbar-right">
          {/* Daily Financial Pulse Briefing Pill */}
          {!isAdvisor && <DailyPulseNotification />}

          {/* Market Switcher Pill (US ⇋ IN) */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'var(--surface-raised)',
            border: '1px solid var(--glass-border)',
            borderRadius: 20,
            padding: '2px',
            fontSize: '0.75rem',
            fontWeight: 700,
            flexShrink: 0,
          }}>
            <button
              onClick={() => switchMarket?.('US')}
              style={{
                border: 'none',
                background: currentMarket === 'US' ? 'var(--primary)' : 'transparent',
                color: currentMarket === 'US' ? '#fff' : 'var(--text-muted)',
                borderRadius: 16,
                padding: '0.2rem 0.55rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
              }}
              title="Switch to US Financial Market ($ USD, 401k, IRS 1040, Wash-Sale)"
            >
              <span>🇺🇸</span> US
            </button>
            <button
              onClick={() => switchMarket?.('IN')}
              style={{
                border: 'none',
                background: currentMarket === 'IN' ? 'var(--primary)' : 'transparent',
                color: currentMarket === 'IN' ? '#fff' : 'var(--text-muted)',
                borderRadius: 16,
                padding: '0.2rem 0.55rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
              }}
              title="Switch to Indian Financial Market (₹ INR, EPF, ITR, MF)"
            >
              <span>🇮🇳</span> IN
            </button>
          </div>

          {/* Desktop Controls (visible only on ultra-wide screens >=1720px) */}
          <div className="topbar-desktop-controls">
            {/* Multi-Tenant Role Switcher Pill (Investor ⇋ Advisor ⇋ CPA ⇋ Work) */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'var(--surface-raised)',
              border: '1px solid var(--glass-border)',
              borderRadius: 20,
              padding: '2px',
              fontSize: '0.72rem',
              fontWeight: 700,
            }}>
              <button
                onClick={() => { switchRole?.('investor'); navigate('/app/dashboard'); }}
                style={{
                  border: 'none',
                  background: (!isAdvisor && !isWorkPortal && location.pathname !== '/cpa') ? 'var(--primary)' : 'transparent',
                  color: (!isAdvisor && !isWorkPortal && location.pathname !== '/cpa') ? '#fff' : 'var(--text-muted)',
                  borderRadius: 16,
                  padding: '0.2rem 0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                }}
                title="Investor Cockpit: Personal wealth, portfolio & tax"
              >
                <span>👤</span> Investor
              </button>
              <button
                onClick={() => { switchRole?.('advisor'); navigate('/advisor/clients'); }}
                style={{
                  border: 'none',
                  background: isAdvisor ? 'var(--primary)' : 'transparent',
                  color: isAdvisor ? '#fff' : 'var(--text-muted)',
                  borderRadius: 16,
                  padding: '0.2rem 0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                }}
                title="Advisor Practice: Client book, recommendations, AUM"
              >
                <span>🏢</span> Advisor
              </button>
              <button
                onClick={() => navigate('/cpa')}
                style={{
                  border: 'none',
                  background: location.pathname === '/cpa' ? 'var(--primary)' : 'transparent',
                  color: location.pathname === '/cpa' ? '#fff' : 'var(--text-muted)',
                  borderRadius: 16,
                  padding: '0.2rem 0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                }}
                title="CPA Portal: 1040 Sch D, Form 8949, client tax audit"
              >
                <span>📋</span> CPA
              </button>
              <button
                onClick={() => navigate('/work')}
                style={{
                  border: 'none',
                  background: isWorkPortal ? 'var(--primary)' : 'transparent',
                  color: isWorkPortal ? '#fff' : 'var(--text-muted)',
                  borderRadius: 16,
                  padding: '0.2rem 0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                }}
                title="FinAgent for Work: Enterprise HR, 401(k), equity & payroll"
              >
                <span>💼</span> Work
              </button>
            </div>

            {/* Experience Mode Depth Switcher (Essential ⇋ Pro ⇋ Sovereign) */}
            {!isAdvisor && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: 'var(--surface-raised)',
                border: '1px solid var(--glass-border)',
                borderRadius: 20,
                padding: '2px',
                fontSize: '0.72rem',
                fontWeight: 700,
              }}>
                <button
                  onClick={() => setExperienceMode?.('essential')}
                  style={{
                    border: 'none',
                    background: activeMode === 'essential' ? 'var(--green)' : 'transparent',
                    color: activeMode === 'essential' ? '#fff' : 'var(--text-muted)',
                    borderRadius: 16,
                    padding: '0.2rem 0.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                  title="Essential Mode: Streamlined view for everyday personal finance, budget, and tax"
                >
                  <span>🌱</span> Essential
                </button>
                <button
                  onClick={() => setExperienceMode?.('pro')}
                  style={{
                    border: 'none',
                    background: activeMode === 'pro' ? 'var(--primary)' : 'transparent',
                    color: activeMode === 'pro' ? '#fff' : 'var(--text-muted)',
                    borderRadius: 16,
                    padding: '0.2rem 0.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                  title="Pro Wealth Mode: Unlocks Direct Indexing, Tax-Loss Harvester, Family Council, and Sentinels"
                >
                  <span>⚡</span> Pro
                </button>
                <button
                  onClick={() => setExperienceMode?.('sovereign')}
                  style={{
                    border: 'none',
                    background: activeMode === 'sovereign' ? 'linear-gradient(135deg, #D4AF37, #996515)' : 'transparent',
                    color: activeMode === 'sovereign' ? '#000' : 'var(--text-muted)',
                    borderRadius: 16,
                    padding: '0.2rem 0.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    fontWeight: activeMode === 'sovereign' ? 800 : 700,
                  }}
                  title="Sovereign Mode: Full institutional cockpit"
                >
                  <span>👑</span> Sovereign
                </button>
              </div>
            )}

            {/* FinAgent Black VIP Shortcut */}
            <button
              onClick={() => navigate('/app/black')}
              style={{
                border: '1px solid rgba(212, 175, 55, 0.6)',
                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(0, 0, 0, 0.4))',
                color: '#D4AF37',
                borderRadius: 20,
                padding: '0.25rem 0.65rem',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.2s',
              }}
              title="FinAgent Black Sovereign Virtual Family Office"
            >
              <span>👑</span> Black
            </button>

            {/* Live sync status (consumer only) */}
            {!isAdvisor && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <RefreshCw size={12} style={{ color: 'var(--green)' }} />
                <span>Synced 2 min ago</span>
              </div>
            )}

            {/* Privacy Shield PIN Lock */}
            {!isAdvisor && (
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => {
                  localStorage.setItem('finagent_pin_enabled', 'true');
                  document.dispatchEvent(new Event('visibilitychange'));
                }}
                title="Lock Screen (Privacy Shield)"
                style={{ padding: '0.4rem', color: 'var(--text-secondary)' }}
              >
                <Lock size={15} />
              </button>
            )}
          </div>

          {/* Mobile/Tablet Quick Controls Popover Toggle */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="topbar-mobile-controls-trigger"
              onClick={() => setControlsOpen(o => !o)}
              title="Quick Controls"
            >
              <SlidersHorizontal size={13} />
              <span>Controls</span>
            </button>

            {controlsOpen && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 998 }}
                  onClick={() => setControlsOpen(false)}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: 290,
                    background: 'var(--surface-raised)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                    padding: '1rem',
                    zIndex: 999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                    animation: 'fadeIn 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Quick Controls</span>
                    <button
                      type="button"
                      onClick={() => setControlsOpen(false)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Market Switcher */}
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>FINANCIAL MARKET</div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className={`btn btn-sm ${currentMarket === 'US' ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ flex: 1, fontSize: '0.75rem', padding: '0.35rem' }}
                        onClick={() => { switchMarket?.('US'); setControlsOpen(false); }}
                      >
                        🇺🇸 US ($)
                      </button>
                      <button
                        className={`btn btn-sm ${currentMarket === 'IN' ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ flex: 1, fontSize: '0.75rem', padding: '0.35rem' }}
                        onClick={() => { switchMarket?.('IN'); setControlsOpen(false); }}
                      >
                        🇮🇳 India (₹)
                      </button>
                    </div>
                  </div>

                  {/* Depth Mode */}
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>EXPERIENCE DEPTH</div>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        className={`btn btn-sm ${activeMode === 'essential' ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ flex: 1, fontSize: '0.7rem', padding: '0.3rem' }}
                        onClick={() => { setExperienceMode?.('essential'); setControlsOpen(false); }}
                      >
                        🌱 Essential
                      </button>
                      <button
                        className={`btn btn-sm ${activeMode === 'pro' ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ flex: 1, fontSize: '0.7rem', padding: '0.3rem' }}
                        onClick={() => { setExperienceMode?.('pro'); setControlsOpen(false); }}
                      >
                        ⚡ Pro
                      </button>
                      <button
                        className={`btn btn-sm ${activeMode === 'sovereign' ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ flex: 1, fontSize: '0.7rem', padding: '0.3rem' }}
                        onClick={() => { setExperienceMode?.('sovereign'); setControlsOpen(false); }}
                      >
                        👑 Sovereign
                      </button>
                    </div>
                  </div>

                  {/* Workspace & Portal Switcher */}
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 700 }}>PORTAL & WORKSPACE</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem' }}>
                      <button
                        className={`btn btn-sm ${(!isAdvisor && !isWorkPortal && location.pathname !== '/cpa') ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ fontSize: '0.72rem', padding: '0.4rem 0.35rem', justifyContent: 'center' }}
                        onClick={() => { switchRole?.('investor'); navigate('/app/dashboard'); setControlsOpen(false); }}
                      >
                        👤 Investor
                      </button>
                      <button
                        className={`btn btn-sm ${isAdvisor ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ fontSize: '0.72rem', padding: '0.4rem 0.35rem', justifyContent: 'center' }}
                        onClick={() => { switchRole?.('advisor'); navigate('/advisor/clients'); setControlsOpen(false); }}
                      >
                        🏢 Advisor
                      </button>
                      <button
                        className={`btn btn-sm ${location.pathname === '/cpa' ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ fontSize: '0.72rem', padding: '0.4rem 0.35rem', justifyContent: 'center' }}
                        onClick={() => { navigate('/cpa'); setControlsOpen(false); }}
                      >
                        📋 CPA Tax
                      </button>
                      <button
                        className={`btn btn-sm ${isWorkPortal ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ fontSize: '0.72rem', padding: '0.4rem 0.35rem', justifyContent: 'center' }}
                        onClick={() => { navigate('/work'); setControlsOpen(false); }}
                      >
                        💼 Work B2B
                      </button>
                    </div>
                  </div>

                  {/* Appearance (Light / Dark Mode) */}
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>APPEARANCE</div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className={`btn btn-sm ${!isDark ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ flex: 1, fontSize: '0.75rem', padding: '0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                        onClick={() => { if (isDark) toggleTheme(); setControlsOpen(false); }}
                      >
                        <Sun size={14} /> Light
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${isDark ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ flex: 1, fontSize: '0.75rem', padding: '0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                        onClick={() => { if (!isDark) toggleTheme(); setControlsOpen(false); }}
                      >
                        <Moon size={14} /> Dark
                      </button>
                    </div>
                  </div>

                  {/* VIP and PIN Lock */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--glass-border)' }}>
                    <button
                      onClick={() => { navigate('/app/black'); setControlsOpen(false); }}
                      style={{
                        border: '1px solid rgba(212, 175, 55, 0.6)',
                        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(0, 0, 0, 0.4))',
                        color: '#D4AF37',
                        borderRadius: 16,
                        padding: '0.3rem 0.65rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                      }}
                    >
                      👑 FinAgent Black
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        localStorage.setItem('finagent_pin_enabled', 'true');
                        document.dispatchEvent(new Event('visibilitychange'));
                        setControlsOpen(false);
                      }}
                      style={{ fontSize: '0.75rem' }}
                    >
                      <Lock size={13} style={{ marginRight: 4 }} /> PIN Lock
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Theme Toggle (Permanent, flexShrink: 0) */}
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{ flexShrink: 0 }}
          >
            <span className="theme-toggle-icon">
              {isDark ? (
                <Sun size={17} style={{ color: 'var(--gold)' }} />
              ) : (
                <Moon size={17} style={{ color: 'var(--primary)' }} />
              )}
            </span>
          </button>

          {/* AI Notifications Bell (consumer only) */}
          {!isAdvisor && (
            <NotificationBell
              unreadCount={unreadCount}
              onClick={() => setPanelOpen(o => !o)}
            />
          )}

          {/* Role & Portal Switcher Badge with Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setRoleMenuOpen(o => !o)}
              className={`badge ${isAdvisor ? 'badge-purple' : 'badge-primary'}`}
              style={{
                cursor: 'pointer',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '0.28rem 0.65rem',
                fontWeight: 700,
                fontSize: '0.75rem',
                borderRadius: 20,
                transition: 'all 0.15s ease',
              }}
              title="Click to Switch Portal (Investor, Advisor, CPA, Enterprise Work)"
            >
              <span>{isAdvisor ? '🏢 Advisor' : '👤 Investor'}</span>
              <ChevronDown size={13} style={{ transform: roleMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
            </button>

            {roleMenuOpen && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 998 }}
                  onClick={() => setRoleMenuOpen(false)}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: 280,
                    background: 'var(--surface-raised)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                    padding: '0.75rem',
                    zIndex: 999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    animation: 'fadeIn 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.4rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>SWITCH ROLE & PORTAL</span>
                    <button
                      type="button"
                      onClick={() => setRoleMenuOpen(false)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                    >
                      <X size={13} />
                    </button>
                  </div>

                  {/* 1. Investor */}
                  <button
                    type="button"
                    onClick={() => {
                      switchRole?.('investor');
                      navigate('/app/dashboard');
                      setRoleMenuOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.6rem 0.75rem',
                      borderRadius: 'var(--radius)',
                      background: (!isAdvisor && !isWorkPortal && location.pathname !== '/cpa') ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                      border: (!isAdvisor && !isWorkPortal && location.pathname !== '/cpa') ? '1px solid var(--primary)' : '1px solid transparent',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{ fontSize: '1.25rem' }}>👤</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Investor Cockpit</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Personal wealth, holdings, taxes & AI</div>
                    </div>
                    {(!isAdvisor && !isWorkPortal && location.pathname !== '/cpa') && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 800 }}>Active</span>
                    )}
                  </button>

                  {/* 2. Wealth Advisor */}
                  <button
                    type="button"
                    onClick={() => {
                      switchRole?.('advisor');
                      navigate('/advisor/clients');
                      setRoleMenuOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.6rem 0.75rem',
                      borderRadius: 'var(--radius)',
                      background: isAdvisor ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                      border: isAdvisor ? '1px solid #a855f7' : '1px solid transparent',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{ fontSize: '1.25rem' }}>🏢</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Wealth Advisor Portal</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Client book, reco queue, SEBI/SEC RIA</div>
                    </div>
                    {isAdvisor && (
                      <span style={{ fontSize: '0.7rem', color: '#a855f7', fontWeight: 800 }}>Active</span>
                    )}
                  </button>

                  {/* 3. CPA / Tax Portal */}
                  <button
                    type="button"
                    onClick={() => {
                      navigate('/cpa');
                      setRoleMenuOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.6rem 0.75rem',
                      borderRadius: 'var(--radius)',
                      background: location.pathname === '/cpa' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                      border: location.pathname === '/cpa' ? '1px solid var(--green)' : '1px solid transparent',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{ fontSize: '1.25rem' }}>📋</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>CPA & Tax Portal</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>1040 Sch D, Form 8949, client tax audit</div>
                    </div>
                    {location.pathname === '/cpa' && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--green)', fontWeight: 800 }}>Active</span>
                    )}
                  </button>

                  {/* 4. FinAgent for Work */}
                  <button
                    type="button"
                    onClick={() => {
                      navigate('/work');
                      setRoleMenuOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.6rem 0.75rem',
                      borderRadius: 'var(--radius)',
                      background: isWorkPortal ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                      border: isWorkPortal ? '1px solid #3b82f6' : '1px solid transparent',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{ fontSize: '1.25rem' }}>💼</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>FinAgent for Work</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Enterprise B2B, 401(k), equity & payroll</div>
                    </div>
                    {isWorkPortal && (
                      <span style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: 800 }}>Active</span>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Notification Panel */}
      {panelOpen && !isAdvisor && (
        <NotificationPanel
          notifications={notifications}
          ALERT_TYPES={ALERT_TYPES}
          loading={loading}
          lastUpdated={lastUpdated}
          onClose={() => setPanelOpen(false)}
          onGenerate={generateAlerts}
          onMarkRead={markRead}
          onMarkAllRead={markAllRead}
        />
      )}

      {/* DPDP App Privacy PIN Lock Screen */}
      <PrivacyLock />
    </>
  );
}
