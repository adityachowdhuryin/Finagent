import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, ArrowRight, LayoutDashboard, PieChart, MessageSquare,
  Heart, Target, Scissors, Users, BarChart2, Newspaper, GitCompare,
  Dna, ScanLine, Download, Flame, Scale, Shield, Home, BookOpen,
  TrendingUp, DollarSign, TrendingDown, Landmark, Eye, Link2, LineChart,
  Bell, Activity, MessageCircle, Zap, Mail, FileText, CloudLightning, Briefcase,
  Globe, CreditCard, Coins, Lock, Gift, Building2, Mic, Sparkles, MapPin
} from 'lucide-react';

const ALL_TOOLS = [
  // Home
  { title: 'Overview Dashboard', category: 'Home', to: '/app/dashboard', icon: LayoutDashboard, keywords: 'net worth summary assets' },
  { title: 'Financial Health Score', category: 'Home', to: '/app/health-score', icon: Heart, keywords: 'audit score rating health' },
  { title: 'Financial DNA', category: 'Home', to: '/app/dna', icon: Dna, keywords: 'personality risk investor psychology' },
  { title: 'Peer Benchmark', category: 'Home', to: '/app/peers', icon: GitCompare, keywords: 'compare peers income age' },

  // Investments
  { title: 'Portfolio Holdings', category: 'Investments', to: '/app/portfolio', icon: PieChart, keywords: 'stocks equity mutual funds fd gold' },
  { title: 'Performance Analytics', category: 'Investments', to: '/app/performance', icon: LineChart, keywords: 'cagr returns alpha nifty benchmark' },
  { title: 'Portfolio X-Ray Overlap', category: 'Investments', to: '/app/xray', icon: Eye, keywords: 'overlap mutual fund stocks exposure' },
  { title: 'AI Black Swan Crisis Simulator', category: 'Investments', to: '/app/stress-test', icon: CloudLightning, keywords: 'stress test crash 2008 recession runway shock black swan drawdown' },
  { title: 'Portfolio Rebalancing', category: 'Investments', to: '/app/rebalancing', icon: Scale, keywords: 'asset allocation target rebalance' },
  { title: 'SIP Optimizer', category: 'Investments', to: '/app/sip-optimizer', icon: BarChart2, keywords: 'pe ratio nifty valuation dip' },
  { title: 'Market Watchlist', category: 'Investments', to: '/app/watchlist', icon: Bell, keywords: 'alerts prices tracking' },
  { title: 'Market Pulse News', category: 'Investments', to: '/app/news', icon: Newspaper, keywords: 'news feeds sentiment' },

  // Tax & Alpha
  { title: 'Commission Hunter (Direct vs Regular)', category: 'Tax & Alpha', to: '/app/commission-hunter', icon: DollarSign, keywords: 'regular direct commission distributor switch mf central' },
  { title: 'Autonomous Fee & Loan Negotiator', category: 'Tax & Alpha', to: '/app/negotiator', icon: FileText, keywords: 'negotiator dispute bank fee repo rate reset loan apr cfpb rbi letter email' },
  { title: 'AI CTC & Salary Tax Optimizer', category: 'Tax & Alpha', to: '/app/ctc-optimizer', icon: Briefcase, keywords: 'ctc salary slip 80ccd2 corporate nps flexi benefits tax restructuring hr declaration' },
  { title: 'Tech ESOP & US Stock (RSU) Tax Engine', category: 'Tax & Alpha', to: '/app/esop-rsu', icon: Globe, keywords: 'esop rsu us stocks foreign assets schedule fa form 67 google msft' },
  { title: 'Credit Card Reward Maximizer & Spend Router', category: 'Tax & Alpha', to: '/app/card-optimizer', icon: CreditCard, keywords: 'credit card infinia atlas cashback reward points smartbuy spend router' },
  { title: 'AI Forensic Statement Auditor', category: 'Tax & Alpha', to: '/app/forensic-audit', icon: FileText, keywords: 'forensic audit statement zombie subscription tax leak hidden charges' },
  { title: 'Tax Harvester', category: 'Tax & Alpha', to: '/app/tax', icon: Scissors, keywords: 'capital gains stcg ltcg 80c exemptions' },
  { title: 'Tax-Loss Harvesting Bot', category: 'Tax & Alpha', to: '/app/tax-loss-bot', icon: TrendingDown, keywords: 'market dip loss offset paired swap' },
  { title: 'ITR Assistant & Schedule CG', category: 'Tax & Alpha', to: '/app/itr', icon: BookOpen, keywords: 'fifo lots xml income tax filing itr2' },
  { title: 'Cashflow Analyzer', category: 'Tax & Alpha', to: '/app/cashflow', icon: TrendingUp, keywords: 'income expenses monthly savings' },

  // Family & Wealth
  { title: 'Family Office Hub (Multi-PAN)', category: 'Family & Wealth', to: '/app/family-hub', icon: Users, keywords: 'spouse huf parents multi pan tax arbitrage' },
  { title: 'Family Emergency Vault', category: 'Family & Wealth', to: '/app/emergency-vault', icon: Shield, keywords: 'nominee dead man switch dossier pdf inheritance' },
  { title: 'Legal Digital Will & Estate Dossier', category: 'Family & Wealth', to: '/app/digital-will', icon: FileText, keywords: 'digital will inheritance succession estate executor witness legal pdf' },
  { title: 'Goals Tracker', category: 'Family & Wealth', to: '/app/goals', icon: Target, keywords: 'retirement house car college' },
  { title: 'FIRE Calculator', category: 'Family & Wealth', to: '/app/fire', icon: Flame, keywords: 'early retirement financial independence' },
  { title: 'AI Home Loan Rate Arbitrage & Negotiator', category: 'Family & Wealth', to: '/app/loan', icon: Home, keywords: 'emi home loan debt prepayment repo spread audit bank letter' },
  { title: 'AI Insurance Fine-Print Decoder', category: 'Family & Wealth', to: '/app/insurance', icon: Shield, keywords: 'term life health cover mediclaim room rent co-pay fine print trap policy' },
  { title: 'Government Schemes Tracker', category: 'Family & Wealth', to: '/app/govt-schemes', icon: Landmark, keywords: 'ppf ssy scss nps sovereign gold' },

  // Advisory & AI
  { title: 'Family Office Council (3-Agent Debate)', category: 'Advisory & AI', to: '/app/council', icon: Users, keywords: 'council alpha citadel tax debate multi agent memo family office' },
  { title: 'Dynamic Natural Language Chart Studio', category: 'Advisory & AI', to: '/app/chart-studio', icon: BarChart2, keywords: 'chart studio prompt recharts graph net worth projection png visualize' },
  { title: 'AI Copilot Advisor', category: 'Advisory & AI', to: '/app/ai-advisor', icon: MessageSquare, keywords: 'chat gemini financial advice' },
  { title: 'Portfolio Doctor', category: 'Advisory & AI', to: '/app/doctor', icon: Activity, keywords: 'diagnostic health prescription checkup' },
  { title: 'Life Events Re-Architect', category: 'Advisory & AI', to: '/app/life-events', icon: Zap, keywords: 'marriage baby home job switch' },
  { title: 'Advisor Hub (SEBI Marketplace)', category: 'Advisory & AI', to: '/app/marketplace', icon: Users, keywords: 'ria book call fee only' },
  { title: 'WhatsApp AI Assistant', category: 'Advisory & AI', to: '/app/whatsapp', icon: MessageCircle, keywords: 'twilio chat mobile bot' },
  { title: 'Document Intelligence', category: 'Advisory & AI', to: '/app/documents', icon: ScanLine, keywords: 'statement bank salary slip ocr' },

  // Data Sync & Billing
  { title: '1-Click Account Aggregator Sync', category: 'Data Sync', to: '/app/aa-sync', icon: Zap, keywords: 'rbi aa otp bank auto sync' },
  { title: 'Import CAS Statement (PDF)', category: 'Data Sync', to: '/app/cas-import', icon: Download, keywords: 'cams kfintech pdf import mutual funds' },
  { title: 'Monthly Report Email Settings', category: 'Data Sync', to: '/app/report-settings', icon: Mail, keywords: 'email digest monthly pdf' },
  { title: 'PDF Report Generator', category: 'Data Sync', to: '/app/reports', icon: FileText, keywords: 'export download print report' },
  { title: 'GST Invoices & Subscription Billing', category: 'Data Sync', to: '/app/invoices', icon: CreditCard, keywords: 'gst tax invoice billing subscription pro receipt reimbursement' },

  // US Market Parallel Tools
  { title: 'W-2 & 401(k) Match Auditor', category: 'US Market', to: '/app/w2-optimizer', icon: Briefcase, keywords: 'w2 401k 403b true up match paycheck federal state tax withholding standard deduction' },
  { title: 'Wash-Sale Loss Harvester (IRC §1091)', category: 'US Market', to: '/app/wash-sale', icon: Scissors, keywords: 'wash sale irc 1091 proxy etf voo ivv qqq tax loss harvesting 3000 offset' },
  { title: 'Silicon Valley Equity OS (RSU / ISO / AMT)', category: 'US Market', to: '/app/equity-os', icon: Globe, keywords: 'rsu iso amt form 6251 83b election cliff vesting statutory 22 percent tech stock' },
  { title: 'US Credit Card & Points Maximizer (5/24)', category: 'US Market', to: '/app/us-cards', icon: CreditCard, keywords: 'chase 524 bilt amex mr sapphire preferred points transfer category router' },
  { title: 'Mortgage Refinance & PMI Removal Tracker', category: 'US Market', to: '/app/mortgage-refi', icon: Home, keywords: 'mortgage pmi removal homeowners protection act 1998 80 ltv 78 ltv refi letter' },
  { title: 'Revocable Living Trust & Pour-Over Will', category: 'US Market', to: '/app/living-trust', icon: FileText, keywords: 'living trust revocable trust pour over will power of attorney probate ca ny legal pdf' },
  { title: 'US-India Cross-Border Tax Shield', category: 'US Market', to: '/app/cross-border', icon: Shield, keywords: 'fbar fincen 114 fatca form 8938 pfic 1291 nri 10000 threshold indian mutual funds' },
  { title: '401(k) Fee Drag Hunter', category: 'US Market', to: '/app/fee-hunter', icon: DollarSign, keywords: '401k expense ratio fee drag target date fund low cost index sp500 30 percent' },
  { title: 'Plaid 1-Click Bank & Brokerage Sync', category: 'US Market', to: '/app/plaid-sync', icon: Zap, keywords: 'plaid chase fidelity schwab marcus bank sync 1099b statements' },

  // Autonomous Execution, Institutional Credit & Multi-Player Wealth
  { title: 'Autonomous 1-Click Execution Hub', category: 'Autonomous', to: '/app/execution', icon: Zap, keywords: '1 click execute rebalance harvest proxy sweep rocket money cancel bills negotiate' },
  { title: 'Credit Bureau Health & FICO / CIBIL Simulator', category: 'Credit', to: '/app/credit', icon: Activity, keywords: 'fico score cibil credit bureau simulator debt avalanche snowball paydown experian' },
  { title: 'Automated Payroll Direct Deposit Splitter', category: 'Wealth OS', to: '/app/payroll', icon: Briefcase, keywords: 'adp gusto workday rippling paycheck direct deposit split savings auto invest' },
  { title: 'Spare-Change Round-Up Jar & Dip Radar', category: 'Wealth OS', to: '/app/roundups', icon: Coins, keywords: 'round up jar acorns micro investing multiplier dip radar discount buy' },
  { title: 'Household & Spouse Co-Pilot (Monarch Privacy)', category: 'Multi-Player', to: '/app/household', icon: Users, keywords: 'household spouse co pilot joint private partner monarch money net worth' },
  { title: 'CPA & CA Tax Filing Dossier Portal', category: 'Practice', to: '/cpa', icon: FileText, keywords: 'cpa ca tax dossier form 1040 schedule d form 8949 itr2 xml accountant' },
  { title: 'Proof-of-Life Succession Escrow (2-of-3 Quorum)', category: 'Succession', to: '/app/succession', icon: Lock, keywords: 'dead man switch succession escrow proof of life trustee quorum digital will emergency' },
  { title: 'Pre-Qualified Offers & Cashback Marketplace', category: 'Marketplace', to: '/app/offers', icon: Gift, keywords: 'marketplace offers credit cards refinance mortgage cashback bonus member bounty' },
  { title: 'FinAgent for Work (Enterprise HR Portal)', category: 'Enterprise', to: '/work', icon: Building2, keywords: 'finagent for work enterprise b2b hr benefits employee wellness 401k match policy' },

  // Public Viral Tools
  { title: 'Free Salary Tax Leak Auditor (Public)', category: 'Public Tools', to: '/tools/ctc-tax-leak', icon: Briefcase, keywords: 'public ctc salary tax leak audit viral calculator' },
  { title: 'Free Home Loan Repo Spread Auditor (Public)', category: 'Public Tools', to: '/tools/loan-arbitrage', icon: Home, keywords: 'public home loan repo spread arbitrage calculator bank overpayment' },
  { title: 'Free W-2 & 401(k) Tax Leak Audit (Public)', category: 'Public Tools', to: '/tools/w2-tax-leak', icon: Briefcase, keywords: 'public w2 tax leak viral 401k calculator true up match free audit' },
  { title: 'Free Mortgage PMI Arbitrage Auditor (Public)', category: 'Public Tools', to: '/tools/pmi-arbitrage', icon: Home, keywords: 'public pmi removal viral mortgage calculator 80 ltv arbitrage free audit' },
  { title: '10-Second Wealth & Fee Leak Audit (Public)', category: 'Public Tools', to: '/tools/wealth-leak', icon: Sparkles, keywords: 'public wealth leak fee audit viral diagnostic share' },

  // Wave 2: Autonomous Execution, Multimodal AI & Venture-Scale Engines
  { title: 'Autonomous Smart Order Router (SOR)', category: 'Execution', to: '/app/broker-router', icon: Zap, keywords: 'broker router sor alpaca kite zerodha paper live trading vwap twap' },
  { title: 'Conversational Voice AI Banker', category: 'Advisory', to: '/app/voice-banker', icon: Mic, keywords: 'voice banker speech mic talk jarvis private wealth audio' },
  { title: '10,000-Run Monte Carlo Life Twin', category: 'Advisory', to: '/app/life-twin', icon: Sparkles, keywords: 'monte carlo life twin ruin probability simulation sabbatical retirement' },
  { title: 'Private Equity & Startup Cap Table (409A)', category: 'Investments', to: '/app/private-equity', icon: Briefcase, keywords: 'private equity 409a openai stripe spacex secondary market iso rsu amt grant' },
  { title: 'Real Estate Automated Valuation Model (AVM)', category: 'Investments', to: '/app/real-estate-avm', icon: Home, keywords: 'real estate avm property valuation metro price sqft rental cashflow 1031 section 54' },
  { title: 'Financial Blind Verified Peer Leagues', category: 'Community', to: '/app/cohorts', icon: Users, keywords: 'cohorts financial blind peer benchmark clone strategy bay area founders' },
  { title: 'Couple Financial Pre-Nup & Expense Splitter', category: 'Family', to: '/app/prenup', icon: Heart, keywords: 'couple prenup money compatibility income proportional split expenses' },
  { title: 'Zero-Knowledge Client Encryption Vault', category: 'Security', to: '/app/zk-vault', icon: Lock, keywords: 'zero knowledge client encryption aes 256 webcrypto mnemonic recovery touchid faceid' },
  { title: 'Multi-State & Cross-Border Residency Tax Arbitrage', category: 'Tax & Alpha', to: '/app/residency-arbitrage', icon: Globe, keywords: 'state tax relocation california texas rnor returnee india tax holiday 183 days' },


  // Frontier Venture-Scale Expansion Suite (The 5 Highest-Impact Vectors)
  { title: 'Direct Indexing Terminal & Tax-Alpha Harvester', category: 'Investments', to: '/app/direct-indexing', icon: Zap, keywords: 'direct indexing custom beta sp500 nifty50 tax loss harvesting tracking error exclusions alpha' },
  { title: 'Direct Government Tax E-Filing Rails', category: 'Tax & Alpha', to: '/app/e-file', icon: FileText, keywords: 'e file irs mef xml cbdt itr json transmission din receipt 1040 8949 statutory' },
  { title: 'Remote Online Notary (RON) & FinCEN FBAR', category: 'Family & Wealth', to: '/app/notary', icon: FileText, keywords: 'notary ron remote online notarization seal fbar fincen 114 witness trust will' },
  { title: 'Non-Recourse ESOP Exercise Funding Marketplace', category: 'Enterprise', to: '/app/esop-financing', icon: Briefcase, keywords: 'esop financing funding non recourse options exercise term sheet liquidity private credit' },
  { title: 'Pre-IPO Unicorn Secondaries & Private Credit Deal Room', category: 'Investments', to: '/app/syndicates', icon: Briefcase, keywords: 'syndicate secondaries pre ipo spacex stripe openai anthropic databricks private credit spv' },
  { title: 'Gemini Live Multimodal Vision Banker', category: 'Advisory & AI', to: '/app/live-banker', icon: Mic, keywords: 'live banker multimodal vision webrtc camera webcam ocr trap inspection neural voice' },
];


export default function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && isOpen) {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = ALL_TOOLS.filter(tool => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      tool.title.toLowerCase().includes(q) ||
      tool.category.toLowerCase().includes(q) ||
      tool.keywords.toLowerCase().includes(q)
    );
  }).slice(0, 10);

  function handleSelect(tool) {
    navigate(tool.to);
    onClose();
  }

  function handleKeyNav(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      handleSelect(filtered[selectedIndex]);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 5, 15, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
        paddingLeft: '1rem',
        paddingRight: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface-raised)',
          border: '1px solid var(--glass-border)',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(99, 102, 241, 0.2)',
          width: '100%',
          maxWidth: 620,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--glass-border)',
        }}>
          <Search size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyNav}
            placeholder="Jump to any tool, calculator, tax, or family hub..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '1.05rem',
              fontFamily: 'inherit',
            }}
          />
          <kbd style={{
            fontSize: '0.7rem',
            padding: '0.2rem 0.4rem',
            background: 'var(--surface)',
            border: '1px solid var(--glass-border)',
            borderRadius: 6,
            color: 'var(--text-muted)',
            fontFamily: 'monospace',
          }}>
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: 380, overflowY: 'auto', padding: '0.5rem' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No matching tools found for "{query}".
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.to}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: 10,
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                    border: `1px solid ${isSelected ? 'rgba(99, 102, 241, 0.3)' : 'transparent'}`,
                    transition: 'all 0.1s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: isSelected ? 'var(--primary)' : 'var(--surface)',
                      color: isSelected ? 'white' : 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {item.category}
                      </div>
                    </div>
                  </div>

                  <ArrowRight size={14} style={{ color: isSelected ? 'var(--primary)' : 'var(--text-muted)', opacity: isSelected ? 1 : 0.4 }} />
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div style={{
          padding: '0.625rem 1.25rem',
          background: 'var(--surface)',
          borderTop: '1px solid var(--glass-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
        }}>
          <div>Use <kbd>↑</kbd> <kbd>↓</kbd> to navigate, <kbd>↵</kbd> to select</div>
          <div>FinAgent Spotlight Search</div>
        </div>
      </div>
    </div>
  );
}
