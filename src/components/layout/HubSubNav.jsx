import React from 'react';
import { NavLink, useLocation, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard, PieChart, MessageSquare, Heart, Target, Scissors,
  Users, FileText, BarChart2, Newspaper, GitCompare, Dna, ScanLine,
  Scale, ShieldCheck, Landmark, Eye, LineChart, Bell, Zap,
  Lock, CloudLightning, ArrowRightLeft, Cpu, Calculator, Coins
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useSubscription } from '../../context/SubscriptionContext';

/**
 * Streamlined Single-Row In-Page Tab Strip
 * Replaces the heavy multi-tier dropdown sandwich with a clean,
 * horizontal tab bar scoped to the active Super-Hub.
 */
export default function HubSubNav() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isUSMarket, state } = useApp();
  const { canAccess } = useSubscription();

  const isUS = isUSMarket;
  const currentPath = location.pathname;
  const currentTabParam = searchParams.get('tab');

  // Define the 5 Super-Hub configurations
  const hubs = [
    {
      id: 'home',
      label: 'Cockpit & Health',
      icon: LayoutDashboard,
      matchPrefixes: ['/app/dashboard', '/app/health-score', '/app/dna', '/app/peers', '/app/cohorts'],
      tabs: [
        { to: '/app/dashboard', label: 'Overview Cockpit', icon: LayoutDashboard },
        { to: '/app/health-score', label: 'Health Score', icon: Heart, badge: '0-100' },
        { to: '/app/dna', label: 'Financial DNA', icon: Dna, gate: 'dna', badge: 'Psych' },
        { to: '/app/cohorts', label: 'Peer Leagues', icon: Users, badge: 'Blind' },
      ],
    },
    {
      id: 'execution',
      label: 'Autonomous Execution',
      icon: Zap,
      matchPrefixes: ['/app/execution', '/app/direct-indexing', '/app/broker-router', '/app/roundups', '/app/payroll'],
      tabs: [
        { to: '/app/execution', label: '1-Click Execution', icon: Zap, badge: 'Autonomous' },
        { to: '/app/direct-indexing', label: 'Direct Indexing Studio', icon: Cpu, badge: '+2.4% Alpha' },
        { to: '/app/broker-router', label: 'Broker Order Router', icon: ArrowRightLeft, badge: 'SOR' },
        { to: '/app/roundups', label: 'Micro-Invest Jar', icon: Coins },
      ],
    },
    {
      id: 'investments',
      label: 'Investments & Alpha',
      icon: PieChart,
      matchPrefixes: ['/app/portfolio', '/app/performance', '/app/xray', '/app/rebalancing', '/app/stress-test', '/app/sip-optimizer', '/app/watchlist', '/app/news', '/app/syndicates'],
      tabs: [
        { to: '/app/portfolio', label: isUS ? 'US Holdings' : 'Holdings', icon: PieChart },
        { to: '/app/performance', label: 'Performance & XIRR', icon: LineChart },
        { to: '/app/xray', label: 'Portfolio X-Ray', icon: Eye, badge: 'Overlap' },
        { to: '/app/rebalancing', label: 'Rebalancing & Drift', icon: Scale },
        { to: '/app/stress-test', label: 'Crisis Simulator', icon: CloudLightning, badge: 'Shock' },
        { to: '/app/watchlist', label: 'Watchlist & Pulse', icon: Bell },
      ],
    },
    {
      id: 'tax',
      label: 'Tax & Forensic Studio',
      icon: ShieldCheck,
      matchPrefixes: [
        '/app/tax', '/app/e-file', '/app/huf-studio', '/app/itr', '/app/forensic-audit',
        '/app/commission-hunter', '/app/ctc-optimizer', '/app/esop-rsu', '/app/card-optimizer',
        '/app/tax-loss-bot', '/app/w2-optimizer', '/app/wash-sale', '/app/equity-os',
        '/app/us-cards', '/app/cross-border', '/app/residency-arbitrage'
      ],
      tabs: [
        {
          to: '/app/tax?tab=e-file',
          matchTo: '/app/e-file',
          tabKey: 'e-file',
          label: isUS ? 'IRS MeF E-Filing' : 'ITR E-Filing & AIS',
          icon: ShieldCheck,
          badge: isUS ? '1040' : 'AY26-27',
        },
        {
          to: '/app/tax?tab=huf',
          matchTo: isUS ? '/app/w2-optimizer' : '/app/huf-studio',
          tabKey: 'huf',
          label: isUS ? 'S-Corp Pass-Through' : 'HUF Tax Studio',
          icon: Landmark,
          badge: isUS ? 'Save $28k' : 'Save ₹3L',
        },
        {
          to: '/app/tax?tab=harvester',
          matchTo: isUS ? '/app/wash-sale' : '/app/tax-loss-bot',
          tabKey: 'harvester',
          label: isUS ? 'Wash-Sale Harvester' : 'Tax-Loss Harvester',
          icon: Scissors,
          badge: '+1.8% Alpha',
        },
        {
          to: '/app/tax?tab=forensic',
          matchTo: '/app/forensic-audit',
          tabKey: 'forensic',
          label: isUS ? 'ERISA 401k Audit' : 'Forensic Audit',
          icon: FileText,
        },
        {
          to: '/app/tax?tab=itr',
          matchTo: '/app/itr',
          tabKey: 'itr',
          label: isUS ? 'Federal & 50-State Tax' : 'Capital Gains & ITR',
          icon: Calculator,
        },
      ],
    },
    {
      id: 'family',
      label: 'Family Office & Estate Vault',
      icon: Users,
      matchPrefixes: [
        '/app/family-hub', '/app/emergency-vault', '/app/digital-will', '/app/living-trust',
        '/app/goals', '/app/fire', '/app/loan', '/app/negotiator', '/app/insurance',
        '/app/govt-schemes', '/app/household', '/app/succession', '/app/prenup'
      ],
      tabs: [
        { to: '/app/family-hub', label: 'Family Hub', icon: Users },
        { to: '/app/emergency-vault', label: 'Emergency Vault', icon: Lock, badge: 'ZK-Escrow' },
        { to: isUS ? '/app/living-trust' : '/app/digital-will', label: isUS ? 'Living Trust' : 'Digital Will', icon: FileText, badge: 'Legal' },
        { to: '/app/goals', label: 'Goals & FIRE', icon: Target },
        { to: '/app/loan', label: 'Loan Repricing Engine', icon: Landmark, badge: 'Cut EMI' },
      ],
    },
    {
      id: 'advisory',
      label: 'Advisory & AI',
      icon: MessageSquare,
      matchPrefixes: ['/app/ai-advisor', '/app/doctor', '/app/life-events', '/app/marketplace', '/app/whatsapp', '/app/documents', '/app/link-advisor', '/app/aa-sync', '/app/reports'],
      tabs: [
        { to: '/app/ai-advisor', label: 'AI Wealth Copilot', icon: MessageSquare },
        { to: '/app/doctor', label: 'Portfolio Doctor', icon: Heart },
        { to: '/app/documents', label: 'Document Intelligence', icon: ScanLine, badge: 'AI' },
        { to: '/app/link-advisor', label: isUS ? 'Connect SEC RIA' : 'Connect SEBI RIA', icon: Users },
        { to: '/app/reports', label: 'Fiduciary Reports', icon: FileText },
      ],
    },
  ];

  // Find the active hub based on current URL path
  const activeHub = hubs.find(h =>
    h.matchPrefixes.some(prefix => currentPath === prefix || currentPath.startsWith(prefix + '/'))
  );

  // If no hub matches (e.g. standalone portal), don't render sub-navigation
  if (!activeHub) {
    return null;
  }

  const HubIcon = activeHub.icon;

  return (
    <nav
      className="hub-subnav-strip"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.4rem 1.25rem',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--glass-border)',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
        minHeight: '44px',
        boxSizing: 'border-box',
      }}
      aria-label={`${activeHub.label} Navigation Tabs`}
    >
      {/* Active Hub Title Label */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          paddingRight: '0.75rem',
          marginRight: '0.25rem',
          borderRight: '1px solid var(--glass-border)',
          flexShrink: 0,
        }}
      >
        <HubIcon size={15} style={{ color: 'var(--primary)' }} />
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
          }}
        >
          {activeHub.label}
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
        {activeHub.tabs.map((tab) => {
          const Icon = tab.icon;
          const isLocked = tab.gate && !canAccess(tab.gate);

          // Calculate active state
          let isSelected = false;
          if (activeHub.id === 'tax') {
            if (currentPath === '/app/tax') {
              const activeTabKey = currentTabParam || 'e-file';
              isSelected = tab.tabKey === activeTabKey;
            } else {
              isSelected = currentPath === tab.matchTo || currentPath === tab.to;
            }
          } else {
            isSelected = currentPath === tab.to || (tab.matchTo && currentPath === tab.matchTo);
          }

          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.75rem',
                borderRadius: 20,
                fontSize: '0.78125rem',
                fontWeight: isSelected ? 700 : 500,
                textDecoration: 'none',
                color: isSelected ? 'var(--primary-light)' : 'var(--text-secondary)',
                background: isSelected ? 'rgba(99, 102, 241, 0.14)' : 'transparent',
                border: `1px solid ${isSelected ? 'var(--primary)' : 'transparent'}`,
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                opacity: isLocked ? 0.6 : 1,
                boxShadow: isSelected ? '0 2px 8px rgba(99, 102, 241, 0.2)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'var(--surface-hover)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <Icon size={14} style={{ color: isSelected ? 'var(--primary)' : 'var(--text-muted)' }} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  style={{
                    fontSize: '0.625rem',
                    fontWeight: 800,
                    padding: '0.1rem 0.35rem',
                    borderRadius: 10,
                    background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(16, 185, 129, 0.15)',
                    color: isSelected ? 'var(--primary-light)' : 'var(--green)',
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
