import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, PieChart, MessageSquare, Target,
  Users, ClipboardCheck, FileText, BarChart2,
  CalendarCheck, Receipt, ShieldCheck,
  Download, DollarSign,
  UserPlus, Layers, Mail, Lock, Zap,
  Building2, Briefcase
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useSubscription, TIERS } from '../../context/SubscriptionContext';

// ── Nav definitions ───────────────────────────────────────────────────────────

function getConsumerNav(isUSMarket, experienceMode = 'pro') {
  const base = isUSMarket ? [
    {
      to: '/app/dashboard',
      label: 'Home',
      icon: LayoutDashboard,
      matchPrefixes: ['/app/dashboard', '/app/health-score', '/app/dna', '/app/peers', '/app/cohorts'],
    },
    {
      to: '/app/execution',
      label: '1-Click Execution',
      icon: Zap,
      matchPrefixes: ['/app/execution', '/app/broker-router', '/app/roundups', '/app/payroll'],
    },
    {
      to: '/app/portfolio',
      label: 'Investments',
      icon: PieChart,
      matchPrefixes: ['/app/portfolio', '/app/private-equity', '/app/performance', '/app/xray', '/app/stress-test', '/app/rebalancing', '/app/sip-optimizer', '/app/watchlist', '/app/news'],
    },
    {
      to: '/app/wash-sale',
      label: 'Tax & Alpha',
      icon: DollarSign,
      matchPrefixes: [
        '/app/wash-sale', '/app/w2-optimizer', '/app/equity-os', '/app/us-cards', '/app/cross-border',
        '/app/commission-hunter', '/app/ctc-optimizer', '/app/forensic-audit', '/app/esop-rsu',
        '/app/card-optimizer', '/app/tax', '/app/tax-loss-bot', '/app/itr', '/app/cashflow',
        '/app/credit', '/app/offers', '/app/residency-arbitrage'
      ],
    },
    {
      to: '/app/living-trust',
      label: 'Family & Wealth',
      icon: Users,
      matchPrefixes: [
        '/app/living-trust', '/app/mortgage-refi', '/app/fee-hunter',
        '/app/family-hub', '/app/emergency-vault', '/app/digital-will', '/app/goals', '/app/fire',
        '/app/loan', '/app/insurance', '/app/govt-schemes', '/app/household', '/app/succession',
        '/app/real-estate-avm', '/app/prenup', '/app/zk-vault'
      ],
    },
    {
      to: '/app/ai-advisor',
      label: 'Advisory & AI',
      icon: MessageSquare,
      matchPrefixes: ['/app/ai-advisor', '/app/voice-banker', '/app/life-twin', '/app/doctor', '/app/life-events', '/app/marketplace', '/app/whatsapp', '/app/documents', '/app/link-advisor'],
    },
    {
      to: '/app/plaid-sync',
      label: 'Sync & Reports',
      icon: Download,
      matchPrefixes: ['/app/plaid-sync', '/app/report-settings', '/app/reports', '/app/invoices'],
    },
    { divider: true, label: 'Enterprise & Practice' },
    { to: '/cpa',  label: 'CPA Tax Portal', icon: FileText, matchPrefixes: ['/cpa'] },
    { to: '/work', label: 'FinAgent for Work', icon: Building2, badge: 'B2B', matchPrefixes: ['/work'] },
  ] : [
    {
      to: '/app/dashboard',
      label: 'Home',
      icon: LayoutDashboard,
      matchPrefixes: ['/app/dashboard', '/app/health-score', '/app/dna', '/app/peers', '/app/cohorts'],
    },
    {
      to: '/app/execution',
      label: '1-Click Execution',
      icon: Zap,
      matchPrefixes: ['/app/execution', '/app/broker-router', '/app/roundups', '/app/payroll'],
    },
    {
      to: '/app/portfolio',
      label: 'Investments',
      icon: PieChart,
      matchPrefixes: ['/app/portfolio', '/app/private-equity', '/app/performance', '/app/xray', '/app/stress-test', '/app/rebalancing', '/app/sip-optimizer', '/app/watchlist', '/app/news'],
    },
    {
      to: '/app/commission-hunter',
      label: 'Tax & Alpha',
      icon: DollarSign,
      matchPrefixes: [
        '/app/commission-hunter', '/app/ctc-optimizer', '/app/forensic-audit', '/app/esop-rsu',
        '/app/card-optimizer', '/app/tax', '/app/tax-loss-bot', '/app/itr', '/app/cashflow',
        '/app/credit', '/app/offers', '/app/residency-arbitrage'
      ],
    },
    {
      to: '/app/family-hub',
      label: 'Family & Wealth',
      icon: Users,
      matchPrefixes: [
        '/app/family-hub', '/app/emergency-vault', '/app/digital-will', '/app/goals',
        '/app/fire', '/app/loan', '/app/insurance', '/app/govt-schemes', '/app/household',
        '/app/succession', '/app/real-estate-avm', '/app/prenup', '/app/zk-vault'
      ],
    },
    {
      to: '/app/ai-advisor',
      label: 'Advisory & AI',
      icon: MessageSquare,
      matchPrefixes: ['/app/ai-advisor', '/app/voice-banker', '/app/life-twin', '/app/doctor', '/app/life-events', '/app/marketplace', '/app/whatsapp', '/app/documents', '/app/link-advisor'],
    },
    {
      to: '/app/aa-sync',
      label: 'Sync & Reports',
      icon: Download,
      matchPrefixes: ['/app/aa-sync', '/app/cas-import', '/app/report-settings', '/app/reports', '/app/invoices'],
    },
    { divider: true, label: 'Enterprise & Practice' },
    { to: '/cpa',  label: 'CA Tax Portal', icon: FileText, matchPrefixes: ['/cpa'] },
    { to: '/work', label: 'FinAgent for Work', icon: Building2, badge: 'B2B', matchPrefixes: ['/work'] },
  ];

  if (experienceMode === 'essential') {
    return base.filter(item => item.to !== '/cpa' && item.to !== '/work' && !item.divider);
  }

  return base;
}

const advisorNav = [
  { to: '/advisor/clients',         label: 'Client Book',       icon: Users },
  { to: '/advisor/recommendations', label: 'Reco Queue',        icon: ClipboardCheck, badge: 3 },
  { to: '/advisor/audit',           label: 'Audit Log',         icon: FileText },
  { to: '/advisor/insights',        label: 'Practice Insights', icon: BarChart2 },
  { divider: true, label: 'AI Tools' },
  { to: '/advisor/meeting-prep',    label: 'Meeting Prep',      icon: CalendarCheck },
  { to: '/advisor/report-cards',    label: 'Report Cards',      icon: Receipt },
  { to: '/advisor/compliance',      label: 'Compliance Watch',  icon: ShieldCheck },
  { divider: true, label: 'Advisor Suite' },
  { to: '/advisor/onboarding',      label: 'Client Onboarding', icon: UserPlus },
  { to: '/advisor/aum',             label: 'AUM Dashboard',     icon: DollarSign },
  { to: '/advisor/models',          label: 'Model Portfolios',  icon: Layers },
  { to: '/advisor/portal',          label: 'Portal & Dispatch', icon: Mail },
];

// ── Tier badge ────────────────────────────────────────────────────────────────

function TierBadge({ tier }) {
  const colors = { free: '#6B7280', pro: '#6366F1', advisor: '#F59E0B' };
  const color = colors[tier] || '#6B7280';
  return (
    <span style={{
      fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.05em',
      color, border: `1px solid ${color}`, borderRadius: 4,
      padding: '1px 5px', textTransform: 'uppercase', flexShrink: 0,
    }}>
      {tier}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Sidebar({ open, onClose }) {
  const { state, isUSMarket } = useApp();
  const { currentUser, userProfile, userRole, signOut } = useAuth();
  const { tier, canAccess } = useSubscription();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdvisor = userRole === 'advisor' || state.activeRole === 'advisor';
  const experienceMode = state?.experienceMode || 'pro';
  const nav = isAdvisor ? advisorNav : getConsumerNav(isUSMarket, experienceMode);

  const displayName = isAdvisor
    ? (userProfile?.name || currentUser?.displayName || state.advisor?.profile?.name || 'Advisor')
    : (state.consumer?.user?.name || userProfile?.name || currentUser?.displayName || 'Investor');
  const displaySub = isAdvisor
    ? (userProfile?.sebiRegNo || userProfile?.firmName || 'Advisor')
    : (state.consumer?.user?.city || userProfile?.city || 'Investor');

  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  async function handleSignOut() {
    try { await signOut(); } catch {}
    navigate('/login');
    onClose?.();
  }

  return (
    <>
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">F</div>
          <div>
            <div className="sidebar-brand">Fin<span>Agent</span></div>
            <div className="text-xs text-muted" style={{ marginTop: 1 }}>
              {isAdvisor ? 'Advisor Portal' : 'Wealth Operating System'}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">{isAdvisor ? 'Practice' : 'Core Hubs'}</div>

          {nav.map((item, i) => {
            if (item.divider) {
              return (
                <React.Fragment key={`divider-${i}`}>
                  <div className="divider" style={{ margin: '0.5rem 0' }} />
                  <div className="nav-section-label">{item.label}</div>
                </React.Fragment>
              );
            }

            const { to, label, icon: Icon, badge, gate, matchPrefixes } = item;
            const isLocked = gate && !canAccess(gate);
            const isCustomActive = matchPrefixes
              ? matchPrefixes.some(p => location.pathname === p || location.pathname.startsWith(p + '/'))
              : location.pathname === to;

            return (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `nav-item ${(isActive || isCustomActive) ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
                onClick={onClose}
                style={isLocked ? { opacity: 0.55 } : {}}
              >
                <Icon className="nav-item-icon" size={17} />
                <span style={{ flex: 1 }}>{label}</span>
                {isLocked && <Lock size={11} style={{ opacity: 0.6, flexShrink: 0 }} />}
                {!isLocked && badge && <span className="nav-badge">{badge}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={() => navigate('/app/report-settings')}>
            <div className="sidebar-avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)', truncate: true }}>
                {displayName}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                {displaySub}
              </div>
            </div>
            <TierBadge tier={tier} />
          </div>
        </div>
      </aside>
    </>
  );
}
