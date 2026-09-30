import React, { useState } from 'react';
import { Menu, RefreshCw, Search, Lock, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../hooks/useTheme';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationBell from '../notifications/NotificationBell';
import NotificationPanel from '../notifications/NotificationPanel';
import PrivacyLock from '../common/PrivacyLock';
import DailyPulseNotification from '../common/DailyPulseNotification';
import { useLocation } from 'react-router-dom';

const breadcrumbs = {
  // Hub 1: Home
  '/app/dashboard': ['FinAgent', 'Home', 'Overview'],
  '/app/health-score': ['FinAgent', 'Home', 'Health Score'],
  '/app/dna': ['FinAgent', 'Home', 'Financial DNA'],
  '/app/peers': ['FinAgent', 'Home', 'Peer Benchmark'],

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
};

export default function TopBar({ onMenuClick, onSearchClick }) {
  const { state, switchMarket } = useApp();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const crumbs = breadcrumbs[location.pathname] || ['FinAgent'];
  const isAdvisor = state.activeRole === 'advisor';
  const isDark = theme === 'dark';

  const [panelOpen, setPanelOpen] = useState(false);

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
        <div className="topbar-left" style={{ display: 'flex', alignItems: 'center' }}>
          <button className="btn btn-ghost btn-icon mobile-menu-btn" onClick={onMenuClick}>
            <Menu size={20} />
          </button>
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
                marginLeft: '1rem',
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
          }}>
            <button
              onClick={() => switchMarket('US')}
              style={{
                border: 'none',
                background: (state.activeMarket || 'US') === 'US' ? 'var(--primary)' : 'transparent',
                color: (state.activeMarket || 'US') === 'US' ? '#fff' : 'var(--text-muted)',
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
              onClick={() => switchMarket('IN')}
              style={{
                border: 'none',
                background: (state.activeMarket || 'US') === 'IN' ? 'var(--primary)' : 'transparent',
                color: (state.activeMarket || 'US') === 'IN' ? '#fff' : 'var(--text-muted)',
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
                // Trigger visibility change event to immediately lock
                document.dispatchEvent(new Event('visibilitychange'));
              }}
              title="Lock Screen (Privacy Shield)"
              style={{ padding: '0.4rem', color: 'var(--text-secondary)' }}
            >
              <Lock size={15} />
            </button>
          )}

          {/* Theme Toggle */}
          <button className="theme-toggle" onClick={toggleTheme} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'} aria-label="Toggle theme">
            <span className="theme-toggle-icon">{isDark ? '☀️' : '🌙'}</span>
          </button>

          {/* AI Notifications Bell (consumer only) */}
          {!isAdvisor && (
            <NotificationBell
              unreadCount={unreadCount}
              onClick={() => setPanelOpen(o => !o)}
            />
          )}

          {/* Mode badge */}
          <div className={`badge ${isAdvisor ? 'badge-purple' : 'badge-primary'}`}>
            {isAdvisor ? '🏢 Advisor' : '👤 Investor'}
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
