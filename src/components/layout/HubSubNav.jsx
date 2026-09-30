import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, PieChart, MessageSquare, Heart, Target, Scissors,
  Users, FileText, BarChart2, Newspaper, GitCompare, Dna, ScanLine,
  Download, Flame, Scale, Shield, Home, BookOpen, TrendingUp, DollarSign,
  TrendingDown, Landmark, Eye, Link2, LineChart, Bell, Activity, MessageCircle,
  Zap, Mail, Sparkles, Briefcase, Globe, CreditCard,
  Coins, Gift, Lock, Mic, ChevronDown, LayoutGrid, X, CloudLightning
} from 'lucide-react';
import { useSubscription } from '../../context/SubscriptionContext';
import { useApp } from '../../context/AppContext';

function getHubs(market = 'US') {
  const isUS = market === 'US';

  return [
    {
      id: 'home',
      label: 'Home',
      icon: LayoutDashboard,
      matchPrefixes: ['/app/dashboard', '/app/health-score', '/app/dna', '/app/peers', '/app/cohorts'],
      pillars: [
        {
          id: 'overview',
          label: 'Overview & Health',
          tabs: [
            { to: '/app/dashboard', label: 'Overview Cockpit', icon: LayoutDashboard, desc: 'Net worth, asset breakdown & daily priorities' },
            { to: '/app/health-score', label: 'Financial Health Score', icon: Heart, desc: 'Comprehensive 0–100 financial fitness rating' },
            { to: '/app/dna', label: 'Financial DNA', icon: Dna, gate: 'dna', desc: 'Behavioral risk traits & psychological profile' },
          ],
        },
        {
          id: 'peers',
          label: 'Peer Intelligence',
          tabs: [
            { to: '/app/cohorts', label: 'Verified Peer Leagues', icon: Users, badge: 'Blind', desc: 'Anonymized "Financial Blind" tech & founder leagues' },
            { to: '/app/peers', label: 'Peer Benchmark', icon: GitCompare, gate: 'peers', desc: 'Percentile rankings vs verified age & income peers' },
          ],
        },
      ],
    },
    {
      id: 'execution',
      label: '1-Click Execution',
      icon: Zap,
      matchPrefixes: ['/app/execution', '/app/broker-router', '/app/roundups', '/app/payroll'],
      pillars: [
        {
          id: 'routing',
          label: 'Autonomous Order Routing',
          tabs: [
            { to: '/app/execution', label: 'Execution Hub', icon: Zap, badge: 'Autonomous', desc: '1-click automated trades, rebalancing & order rails' },
            { to: '/app/broker-router', label: 'Broker Order Router', icon: Zap, badge: 'SOR', desc: 'Low-latency Smart Order Routing for Alpaca & Zerodha' },
          ],
        },
        {
          id: 'autopilot',
          label: 'Cashflow Autopilot',
          tabs: [
            { to: '/app/roundups', label: 'Micro-Invest Jar & Dip', icon: Coins, badge: 'Round-Up', desc: 'Spare change round-ups & automated dip-buying limit radar' },
            { to: '/app/payroll', label: isUS ? 'Paycheck Splitter' : 'Salary Splitter', icon: Briefcase, desc: 'Rule-based income allocation directly to investment buckets' },
          ],
        },
      ],
    },
    {
      id: 'investments',
      label: 'Investments',
      icon: PieChart,
      matchPrefixes: ['/app/portfolio', '/app/private-equity', '/app/performance', '/app/xray', '/app/stress-test', '/app/rebalancing', '/app/sip-optimizer', '/app/watchlist', '/app/news'],
      pillars: [
        {
          id: 'core_holdings',
          label: 'Core Portfolio',
          tabs: [
            { to: '/app/portfolio', label: isUS ? 'US Holdings' : 'Holdings', icon: PieChart, desc: 'Real-time equities, funds, FDs, gold & alternative assets' },
            { to: '/app/performance', label: 'Performance', icon: LineChart, desc: 'IRR, XIRR, alpha vs benchmark & asset class returns' },
            { to: '/app/xray', label: 'Portfolio X-Ray', icon: Eye, desc: 'Fund overlap analysis, sector exposure & concentration risk' },
          ],
        },
        {
          id: 'strategy_risk',
          label: 'Strategy & Risk',
          tabs: [
            { to: '/app/rebalancing', label: 'Rebalancing', icon: Scale, gate: 'rebalancing', desc: 'Target allocation drift monitoring & tax-smart rebalancing' },
            { to: '/app/sip-optimizer', label: isUS ? 'DCA Optimizer' : 'SIP Optimizer', icon: BarChart2, desc: 'Algorithmic day-of-month timing & step-up investment cadence' },
            { to: '/app/stress-test', label: 'Crisis Simulator', icon: CloudLightning, badge: 'AI Shock', desc: 'Stress test portfolio against 2008 crash, stagflation & rate hikes' },
          ],
        },
        {
          id: 'markets_alternatives',
          label: 'Markets & Alternatives',
          tabs: [
            { to: '/app/private-equity', label: isUS ? 'Private Equity & 409A' : 'Startup ESOPs', icon: Briefcase, desc: 'Pre-IPO unicorn valuations, secondary tender watch & exercise ROI' },
            { to: '/app/watchlist', label: 'Watchlist', icon: Bell, gate: 'watchlist', desc: 'Real-time price alerts, AI technical signals & sector tags' },
            { to: '/app/news', label: 'Market Pulse', icon: Newspaper, desc: 'Macro market trends, breaking financial news & AI sentiment' },
          ],
        },
      ],
    },
    {
      id: 'tax',
      label: 'Tax & Alpha',
      icon: DollarSign,
      matchPrefixes: [
        '/app/w2-optimizer', '/app/wash-sale', '/app/equity-os', '/app/us-cards', '/app/cross-border',
        '/app/commission-hunter', '/app/ctc-optimizer', '/app/forensic-audit', '/app/esop-rsu',
        '/app/card-optimizer', '/app/tax', '/app/tax-loss-bot', '/app/itr', '/app/cashflow',
        '/app/credit', '/app/offers', '/app/residency-arbitrage'
      ],
      pillars: isUS ? [
        {
          id: 'tax_optimization',
          label: 'Tax Optimization',
          tabs: [
            { to: '/app/residency-arbitrage', label: 'State Tax Arbitrage', icon: Globe, badge: 'CA➔TX', desc: 'State relocation tax delta across salary, RSUs & capital gains' },
            { to: '/app/wash-sale', label: 'Wash-Sale Harvester', icon: Scissors, badge: 'IRC 1091', desc: 'Automated capital loss harvesting compliant with wash-sale rules' },
            { to: '/app/tax', label: 'Tax Harvester', icon: TrendingDown, gate: 'tax_harvester', desc: 'Year-end loss/gain offsetting & tax bracket maximization' },
            { to: '/app/w2-optimizer', label: 'W-2 & 401(k) Match', icon: Briefcase, badge: 'Max $23k', desc: 'Pre-tax 401(k), mega-backdoor Roth & payroll deductions' },
          ],
        },
        {
          id: 'equity_crossborder',
          label: 'Equity & Cross-Border',
          tabs: [
            { to: '/app/equity-os', label: 'Equity OS (RSU/ISO)', icon: Globe, badge: 'AMT 6251', desc: 'AMT liability modeling, 83(b) elections & vesting schedule' },
            { to: '/app/cross-border', label: 'US-India Tax Shield', icon: Shield, badge: 'FBAR / PFIC', desc: 'DTAA tax credits, PFIC avoidance & foreign account disclosures' },
            { to: '/app/cashflow', label: 'Cashflow Intelligence', icon: TrendingUp, gate: 'cashflow', desc: 'Automated bank statement parsing & spending categorization' },
          ],
        },
        {
          id: 'credit_perks',
          label: 'Credit & Perks',
          tabs: [
            { to: '/app/credit', label: 'FICO® & Debts', icon: Activity, badge: '782', desc: 'FICO score simulator, utilization alerts & debt avalanche planner' },
            { to: '/app/us-cards', label: 'Points & 5/24 Maximizer', icon: CreditCard, badge: 'Chase 5/24', desc: 'Reward point valuations & Chase 5/24 velocity rules' },
            { to: '/app/offers', label: 'Perks & Cashback', icon: Gift, badge: '$625', desc: 'Curated corporate discounts & premium partner perks' },
          ],
        },
      ] : [
        {
          id: 'direct_tax',
          label: 'Direct Tax & Savings',
          tabs: [
            { to: '/app/residency-arbitrage', label: 'RNOR Returnee Shield', icon: Globe, badge: 'Tax-Free', desc: '2–3 year tax exemption calculator for returning NRIs' },
            { to: '/app/commission-hunter', label: 'Commission Hunter', icon: DollarSign, badge: 'Save ₹34k', desc: 'Switch regular mutual funds to direct plans to save expense drag' },
            { to: '/app/ctc-optimizer', label: 'CTC Optimizer', icon: Briefcase, badge: 'Save ₹65k', desc: 'Restructure salary components (HRA, NPS, LTA) to reduce TDS' },
            { to: '/app/tax', label: 'Tax Harvester', icon: Scissors, gate: 'tax_harvester', desc: 'Harvest ₹1.25L tax-free LTCG exemption each financial year' },
            { to: '/app/tax-loss-bot', label: 'Tax-Loss Bot', icon: TrendingDown, desc: 'Offset realized short-term losses against gains before March 31' },
            { to: '/app/itr', label: 'ITR Assistant', icon: BookOpen, gate: 'itr_assistant', desc: 'Old vs New tax regime simulator & schedule pre-filler' },
          ],
        },
        {
          id: 'equity_audit',
          label: 'Equity & Audit',
          tabs: [
            { to: '/app/esop-rsu', label: 'ESOP & RSU Tax', icon: Globe, badge: 'US Stocks', desc: 'Perquisite tax & TCS remittance on foreign company shares' },
            { to: '/app/forensic-audit', label: 'Forensic Audit', icon: FileText, desc: 'Detect hidden bank charges, insurance leakages & excess fees' },
            { to: '/app/cashflow', label: 'Cashflow Intelligence', icon: TrendingUp, gate: 'cashflow', desc: 'Bank statement parsing & spending categorization' },
          ],
        },
        {
          id: 'credit_perks',
          label: 'Credit & Perks',
          tabs: [
            { to: '/app/credit', label: 'CIBIL & Debts', icon: Activity, badge: '794', desc: 'CIBIL credit health, loan payoff timeline & score booster' },
            { to: '/app/card-optimizer', label: 'Card Maximizer', icon: CreditCard, badge: 'Max 16%', desc: 'Credit card rewards, milestone perks & lounge eligibility' },
            { to: '/app/offers', label: 'Perks & Cashback', icon: Gift, badge: '₹12k', desc: 'Verified consumer offers & platform rewards' },
          ],
        },
      ],
    },
    {
      id: 'family',
      label: 'Family & Wealth',
      icon: Users,
      matchPrefixes: [
        '/app/living-trust', '/app/mortgage-refi', '/app/fee-hunter',
        '/app/family-hub', '/app/emergency-vault', '/app/digital-will', '/app/goals', '/app/fire', '/app/loan', '/app/insurance', '/app/govt-schemes',
        '/app/household', '/app/succession', '/app/real-estate-avm', '/app/prenup', '/app/zk-vault'
      ],
      pillars: isUS ? [
        {
          id: 'estate_protection',
          label: 'Estate & Protection',
          tabs: [
            { to: '/app/living-trust', label: 'Living Trust & Will', icon: FileText, badge: 'No Probate', desc: 'Revocable living trust, healthcare directive & probate bypass' },
            { to: '/app/succession', label: 'Succession Escrow', icon: Lock, desc: 'Proof-of-life heartbeat & encrypted beneficiary delivery' },
            { to: '/app/zk-vault', label: 'Zero-Knowledge Vault', icon: Lock, badge: 'AES', desc: 'Client-side AES-256-GCM encrypted biometric vault' },
            { to: '/app/emergency-vault', label: 'Emergency Vault', icon: Shield, desc: 'Centralized storage for critical estate & health documents' },
            { to: '/app/insurance', label: 'Term vs Whole Life', icon: Shield, gate: 'insurance', desc: 'Audit high-fee whole life policies vs low-cost term protection' },
          ],
        },
        {
          id: 'household_property',
          label: 'Household & Real Estate',
          tabs: [
            { to: '/app/household', label: 'Spouse Co-Pilot', icon: Users, badge: 'Monarch', desc: 'Two-player household dashboard for joint net worth & budgets' },
            { to: '/app/prenup', label: 'Couple Pre-Nup', icon: Heart, desc: 'Financial compatibility quiz & fair proportional expense sharing' },
            { to: '/app/real-estate-avm', label: 'Real Estate AVM', icon: Home, desc: 'Algorithmic home valuation, net equity & 1031 tax exchange' },
            { to: '/app/mortgage-refi', label: 'Mortgage & PMI Removal', icon: Home, badge: 'Delete PMI', desc: 'LTV equity monitoring to eliminate private mortgage insurance' },
          ],
        },
        {
          id: 'independence',
          label: 'Financial Independence',
          tabs: [
            { to: '/app/fee-hunter', label: '401(k) Fee Drag Hunter', icon: DollarSign, badge: 'Save 30%', desc: 'Uncover hidden 401(k) administration fees & switch funds' },
            { to: '/app/goals', label: 'Goals Tracker', icon: Target, desc: 'Track college funds, home down payment & retirement goals' },
            { to: '/app/fire', label: 'FIRE Calculator', icon: Flame, desc: 'Calculate your exact Financial Independence target corpus' },
          ],
        },
      ] : [
        {
          id: 'estate_protection',
          label: 'Estate & Protection',
          tabs: [
            { to: '/app/digital-will', label: 'Digital Will', icon: FileText, badge: 'Legal', desc: 'Draft a legally compliant will under the Indian Succession Act' },
            { to: '/app/succession', label: 'Succession Escrow', icon: Lock, desc: 'Proof-of-life protocol & automated nominee handover' },
            { to: '/app/zk-vault', label: 'Zero-Knowledge Vault', icon: Lock, badge: 'AES', desc: 'Biometric TouchID/FaceID encrypted document safe' },
            { to: '/app/emergency-vault', label: 'Emergency Vault', icon: Shield, desc: 'Aadhaar, PAN & policy emergency document binder' },
            { to: '/app/insurance', label: 'Insurance Decoder', icon: Shield, gate: 'insurance', badge: 'Trap Audit', desc: 'Analyze endowment and ULIP policies vs pure term cover' },
            { to: '/app/govt-schemes', label: 'Govt Schemes', icon: Landmark, gate: 'govt_schemes', desc: 'Check eligibility for PPF, Sukanya Samriddhi & sovereign schemes' },
          ],
        },
        {
          id: 'household_property',
          label: 'Household & Real Estate',
          tabs: [
            { to: '/app/household', label: 'Spouse Co-Pilot', icon: Users, badge: 'Monarch', desc: 'Multi-player couple finance with joint budget alignment' },
            { to: '/app/family-hub', label: 'Family Hub (Multi-PAN)', icon: Users, desc: 'Consolidated view of parents, spouse & child portfolios' },
            { to: '/app/prenup', label: 'Couple Pre-Nup', icon: Heart, desc: 'Relationship money compatibility & proportional contribution split' },
            { to: '/app/real-estate-avm', label: 'Real Estate AVM', icon: Home, desc: 'Metro price/sqft valuation, rental yield & Section 54 tax shelter' },
            { to: '/app/loan', label: 'Loan Negotiator', icon: Home, gate: 'loan_analyzer', badge: 'Cut EMI', desc: 'Repo-linked rate cuts & home loan prepayment strategy' },
          ],
        },
        {
          id: 'independence',
          label: 'Financial Independence',
          tabs: [
            { to: '/app/goals', label: 'Goals Tracker', icon: Target, desc: 'Target milestones for retirement, home buying & education' },
            { to: '/app/fire', label: 'FIRE Calculator', icon: Flame, desc: 'Simulate early retirement corpus and safe withdrawal rates' },
          ],
        },
      ],
    },
    {
      id: 'advisory',
      label: 'Advisory & AI',
      icon: MessageSquare,
      matchPrefixes: ['/app/ai-advisor', '/app/voice-banker', '/app/life-twin', '/app/doctor', '/app/life-events', '/app/marketplace', '/app/whatsapp', '/app/documents', '/app/link-advisor'],
      pillars: [
        {
          id: 'copilots',
          label: 'AI Copilots',
          tabs: [
            { to: '/app/ai-advisor', label: 'AI Copilot', icon: MessageSquare, desc: 'Autonomous financial assistant for deep portfolio analysis' },
            { to: '/app/voice-banker', label: 'Voice AI Banker', icon: Mic, badge: 'Live', desc: 'Conversational voice banking with live interactive chart triggers' },
            { to: '/app/whatsapp', label: 'WhatsApp AI', icon: MessageCircle, desc: 'Daily market briefs & instant wealth queries on WhatsApp' },
          ],
        },
        {
          id: 'simulations',
          label: 'Simulations & Diagnostics',
          tabs: [
            { to: '/app/life-twin', label: 'Life Twin (10k)', icon: Sparkles, badge: 'Monte Carlo', desc: '10,000-iteration Monte Carlo life milestone simulation' },
            { to: '/app/doctor', label: 'Portfolio Doctor', icon: Activity, desc: 'Automated diagnostic scan for leakages, churn & risks' },
            { to: '/app/life-events', label: 'Life Events', icon: Zap, desc: 'Financial playbooks for career shifts, marriage & relocation' },
          ],
        },
        {
          id: 'human_intelligence',
          label: 'Experts & Documents',
          tabs: [
            { to: '/app/marketplace', label: 'Advisor Hub', icon: Users, desc: 'Connect with verified SEBI Registered / CFP advisors' },
            { to: '/app/documents', label: 'Doc Intelligence', icon: ScanLine, gate: 'documents', desc: 'Extract data from salary slips, EPF passbooks & receipts' },
            { to: '/app/link-advisor', label: 'Link Advisor', icon: Link2, desc: 'Grant secure read-only access to your personal accountant' },
          ],
        },
      ],
    },
    {
      id: 'sync',
      label: 'Sync & Reports',
      icon: Download,
      matchPrefixes: [
        '/app/plaid-sync', '/app/aa-sync', '/app/cas-import', '/app/report-settings', '/app/reports', '/app/import', '/app/invoices'
      ],
      pillars: [
        {
          id: 'aggregation',
          label: 'Data Aggregation',
          tabs: isUS ? [
            { to: '/app/plaid-sync', label: 'Plaid 1-Click Sync', icon: Zap, badge: 'Fidelity/Chase', desc: 'Automated sync with 12,000+ US banks, brokers & 401(k)s' },
          ] : [
            { to: '/app/aa-sync', label: '1-Click AA Sync', icon: Zap, desc: 'RBI Account Aggregator protocol for instant bank statements' },
            { to: '/app/cas-import', label: 'Import CAS', icon: Download, desc: 'Upload CAMS or KFintech consolidated mutual fund statement' },
          ],
        },
        {
          id: 'reports_billing',
          label: 'Reports & Billing',
          tabs: [
            { to: '/app/report-settings', label: 'Monthly Report Email', icon: Mail, desc: 'Automated 1st-of-month portfolio briefing email' },
            { to: '/app/reports', label: 'PDF Reports', icon: FileText, gate: 'pdf_reports', desc: 'Export executive-ready comprehensive wealth audit PDFs' },
            { to: '/app/invoices', label: isUS ? 'Billing & Invoices' : 'GST Invoices', icon: CreditCard, desc: 'Download tax-compliant subscription receipts' },
          ],
        },
      ],
    },
  ].map(hub => ({
    ...hub,
    // Flatten pillars into tabs for full backward compatibility
    tabs: hub.pillars.flatMap(p => p.tabs),
  }));
}

export default function HubSubNav() {
  const location = useLocation();
  const { canAccess } = useSubscription();
  const { state } = useApp();
  const hubs = getHubs(state?.activeMarket || 'US');

  const [openPillar, setOpenPillar] = useState(null);
  const [launchpadOpen, setLaunchpadOpen] = useState(false);
  const navRef = useRef(null);

  // Find which hub matches the current route
  const currentHub = hubs.find(hub =>
    hub.matchPrefixes.some(prefix => location.pathname === prefix || location.pathname.startsWith(prefix + '/'))
  );

  // Close dropdown on outside click or route change
  useEffect(() => {
    function handleClickOutside(event) {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setOpenPillar(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setOpenPillar(null);
    setLaunchpadOpen(false);
  }, [location.pathname]);

  if (!currentHub) return null;

  const allTabs = currentHub.tabs;
  const activeTab = allTabs.find(t => location.pathname === t.to);
  const HubIcon = currentHub.icon;

  return (
    <div
      ref={navRef}
      className="hub-subnav-container"
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.5rem 1.25rem',
        background: 'var(--surface-raised)',
        borderBottom: '1px solid var(--glass-border)',
        marginBottom: '1rem',
        zIndex: 40,
        gap: '0.75rem',
        flexWrap: 'nowrap',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Left: Hub Title & Active Pillar Dropdowns */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            paddingRight: '0.875rem',
            borderRight: '1px solid var(--glass-border)',
            flexShrink: 0,
          }}
        >
          {HubIcon && <HubIcon size={16} style={{ color: 'var(--primary)' }} />}
          <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            {currentHub.label}
          </span>
        </div>

        {/* Grouped Pillar Dropdown Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          {currentHub.pillars.map((pillar) => {
            const hasActiveTab = pillar.tabs.some(t => location.pathname === t.to);
            const activeSubTab = pillar.tabs.find(t => location.pathname === t.to);
            const isOpen = openPillar === pillar.id;

            return (
              <div key={pillar.id} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setOpenPillar(isOpen ? null : pillar.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.45rem 0.85rem',
                    borderRadius: 20,
                    fontSize: '0.8125rem',
                    fontWeight: hasActiveTab ? 700 : 500,
                    color: hasActiveTab ? 'white' : 'var(--text-secondary)',
                    background: hasActiveTab ? 'var(--primary)' : 'var(--surface)',
                    border: `1px solid ${hasActiveTab ? 'var(--primary)' : isOpen ? 'var(--primary)' : 'var(--glass-border)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: hasActiveTab ? '0 2px 10px rgba(99,102,241,0.25)' : 'none',
                  }}
                >
                  <span>{pillar.label}</span>
                  {activeSubTab && (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        opacity: 0.9,
                        background: 'rgba(255,255,255,0.2)',
                        padding: '0.1rem 0.4rem',
                        borderRadius: 10,
                      }}
                    >
                      {activeSubTab.label}
                    </span>
                  )}
                  <ChevronDown
                    size={14}
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      opacity: 0.8,
                    }}
                  />
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      left: 0,
                      minWidth: 280,
                      maxWidth: 340,
                      background: 'var(--surface-raised)',
                      backdropFilter: 'blur(24px)',
                      WebkitBackdropFilter: 'blur(24px)',
                      border: '1px solid var(--border-active)',
                      borderRadius: 'var(--radius)',
                      boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
                      padding: '0.5rem',
                      zIndex: 100,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                      animation: 'fadeIn 0.15s ease',
                    }}
                  >
                    <div style={{ padding: '0.35rem 0.6rem', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {pillar.label} ({pillar.tabs.length} tools)
                    </div>
                    {pillar.tabs.map((tab) => {
                      const Icon = tab.icon;
                      const isLocked = tab.gate && !canAccess(tab.gate);
                      const isSelected = location.pathname === tab.to;

                      return (
                        <NavLink
                          key={tab.to}
                          to={tab.to}
                          onClick={() => setOpenPillar(null)}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.75rem',
                            padding: '0.6rem',
                            borderRadius: 'var(--radius-sm)',
                            textDecoration: 'none',
                            background: isSelected ? 'rgba(99,102,241,0.12)' : 'transparent',
                            color: isSelected ? 'var(--primary-light)' : 'var(--text-primary)',
                            transition: 'all 0.15s ease',
                            opacity: isLocked ? 0.6 : 1,
                          }}
                          onMouseEnter={e => {
                            if (!isSelected) e.currentTarget.style.background = 'var(--surface-hover)';
                          }}
                          onMouseLeave={e => {
                            if (!isSelected) e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 8,
                              background: isSelected ? 'var(--primary)' : 'var(--surface)',
                              color: isSelected ? 'white' : 'var(--text-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              marginTop: 2,
                            }}
                          >
                            <Icon size={15} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: isSelected ? 700 : 600, fontSize: '0.8125rem' }}>
                              <span>{tab.label}</span>
                              {tab.badge && (
                                <span
                                  style={{
                                    fontSize: '0.65rem',
                                    padding: '0.08rem 0.35rem',
                                    background: 'rgba(16,185,129,0.2)',
                                    color: 'var(--green)',
                                    borderRadius: 6,
                                    fontWeight: 700,
                                  }}
                                >
                                  {tab.badge}
                                </span>
                              )}
                            </div>
                            {tab.desc && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.3, marginTop: 2 }}>
                                {tab.desc}
                              </div>
                            )}
                          </div>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: "All Tools" Directory Launchpad */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, marginLeft: 'auto' }}>
        <button
          type="button"
          onClick={() => setLaunchpadOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.4rem 0.75rem',
            borderRadius: 20,
            fontSize: '0.78125rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            background: 'var(--surface)',
            border: '1px solid var(--glass-border)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.borderColor = 'var(--primary)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.borderColor = 'var(--glass-border)';
          }}
        >
          <LayoutGrid size={13} style={{ color: 'var(--primary)' }} />
          <span>All {currentHub.label} Tools ({allTabs.length})</span>
        </button>
      </div>

      {/* Launchpad Modal */}
      {launchpadOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.7)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.5rem',
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={() => setLaunchpadOpen(false)}
        >
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-active)',
              borderRadius: 'var(--radius-xl)',
              maxWidth: 920,
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
              padding: '1.75rem',
              position: 'relative',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--primary), var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  {HubIcon && <HubIcon size={20} />}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    {currentHub.label} Directory
                  </h2>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                    Select any submodule to navigate directly without scrolling.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLaunchpadOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '0.4rem',
                  borderRadius: 8,
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Pillars Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
              {currentHub.pillars.map((pillar) => (
                <div key={pillar.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--primary)', paddingBottom: '0.25rem', borderBottom: '1px solid var(--glass-border)' }}>
                    {pillar.label}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {pillar.tabs.map((tab) => {
                      const Icon = tab.icon;
                      const isLocked = tab.gate && !canAccess(tab.gate);
                      const isSelected = location.pathname === tab.to;

                      return (
                        <NavLink
                          key={tab.to}
                          to={tab.to}
                          onClick={() => setLaunchpadOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.75rem',
                            padding: '0.75rem',
                            borderRadius: 'var(--radius)',
                            textDecoration: 'none',
                            background: isSelected ? 'rgba(99,102,241,0.15)' : 'var(--surface-raised)',
                            border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--glass-border)'}`,
                            color: isSelected ? 'var(--primary-light)' : 'var(--text-primary)',
                            transition: 'all 0.15s ease',
                            opacity: isLocked ? 0.6 : 1,
                          }}
                          onMouseEnter={e => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = 'var(--primary)';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }
                          }}
                          onMouseLeave={e => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = 'var(--glass-border)';
                              e.currentTarget.style.transform = 'none';
                            }
                          }}
                        >
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: isSelected ? 'var(--primary)' : 'rgba(99,102,241,0.1)',
                              color: isSelected ? 'white' : 'var(--primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <Icon size={16} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.85rem' }}>
                              <span>{tab.label}</span>
                              {tab.badge && (
                                <span
                                  style={{
                                    fontSize: '0.625rem',
                                    padding: '0.1rem 0.35rem',
                                    background: 'rgba(16,185,129,0.2)',
                                    color: 'var(--green)',
                                    borderRadius: 6,
                                    fontWeight: 700,
                                  }}
                                >
                                  {tab.badge}
                                </span>
                              )}
                            </div>
                            {tab.desc && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.35, marginTop: 3 }}>
                                {tab.desc}
                              </div>
                            )}
                          </div>
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
