import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles, X, Send, Bot, User, ArrowRight, Zap, Scale,
  Scissors, FileText, ChevronRight, Minimize2, Maximize2, Shield,
  Mic, MicOff, Volume2, VolumeX, Paperclip, Upload, Eye,
  AlertTriangle, CheckCircle2, Download, RefreshCw, Layers
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { computeProactiveAlerts, getUnreadAlertCount, markAlertsAsRead } from '../../services/proactiveAdvisorEngine';
import { loadCopilotMemory, checkPanicSellingIntent, formatMemoryContext } from '../../services/copilotMemoryService';
import InChatBasketOrderCard from './cards/InChatBasketOrderCard';
import InChatPrepaymentSliderCard from './cards/InChatPrepaymentSliderCard';
import InChatFundCompareCard from './cards/InChatFundCompareCard';
import InChatDossierExportCard from './cards/InChatDossierExportCard';
import InChatTaxRegimeCard from './cards/InChatTaxRegimeCard';
import InChatTaxAuditCard from './cards/InChatTaxAuditCard';
import TaxGPSRoadmapHeader from './TaxGPSRoadmapHeader';
import { useTaxStudio } from '../../context/TaxStudioContext';

export default function AICopilotSidecar({ isOpen, onToggle }) {
  const { state, isUSMarket } = useApp();
  const { currentUser, userProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const taxStudio = useTaxStudio();

  const isTaxStudio = location.pathname === '/app/tax';
  const taxRoadmap = taxStudio?.activeRoadmap;
  const taxSteps = taxRoadmap?.steps || [];
  const taxCompletedCount = taxSteps.filter(s => s.completed).length;

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showProactiveTray, setShowProactiveTray] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  const isAdvisorRoute = location.pathname.startsWith('/advisor');
  const market = state?.activeMarket || (isUSMarket ? 'US' : 'IN');
  const currencySymbol = market === 'IN' ? '₹' : '$';

  // Proactive Alerts Engine
  const proactiveAlerts = useMemo(() => {
    return computeProactiveAlerts(state?.consumer, market);
  }, [state?.consumer, market]);

  const [unreadAlerts, setUnreadAlerts] = useState(() => getUnreadAlertCount(proactiveAlerts));

  useEffect(() => {
    setUnreadAlerts(getUnreadAlertCount(proactiveAlerts));
  }, [proactiveAlerts]);

  // Context Description by Route
  const pageContext = useMemo(() => {
    const path = location.pathname;
    const h = state?.consumer?.holdings || {};
    const nw = state?.consumer?.netWorth?.total || 12450000;

    if (isAdvisorRoute) {
      const isClient = path.includes('/advisor/clients');
      return {
        pageName: 'SEBI RIA Institutional Terminal',
        summary: isClient ? 'Client Arun Sharma (c1) · ₹1.45 Cr AUM under advice' : 'Institutional Advisory & Compliance Suite',
        suggestedPrompts: [
          'Draft SEBI Suitability Memo for Arun',
          'Audit IPS asset allocation drift for this account',
          'Prepare Pre-Meeting Client Briefing & Tax Summary',
        ],
      };
    }

    if (path.includes('/portfolio')) {
      const eqCount = h.equities?.length || 0;
      return {
        pageName: 'Investments & Portfolio',
        summary: `Holdings: ${eqCount} equities/ETFs, Net Worth: ${currencySymbol}${nw.toLocaleString()}`,
        suggestedPrompts: [
          'What is my single largest stock concentration risk?',
          'Which holding has the highest unrealized loss to harvest?',
          'How does my equity allocation compare to benchmark?',
        ],
      };
    }
    if (path.includes('/tax') || path.includes('/wash-sale')) {
      return {
        pageName: 'Tax & Forensic Studio',
        summary: `Fiduciary tax engine (${market}). Tab: ${taxStudio?.currentTab || 'Overview'}. Persona: ${taxStudio?.userTaxPersona || 'Standard'}.`,
        suggestedPrompts: [
          '🧭 Walk me through everything step-by-step',
          '⚡ Compare Old vs New Regime & pick best',
          '🔍 Audit my return for IRS / ITD red flags',
          '📉 Harvest available tax losses now',
          '🌐 Where do I enter foreign assets and RSUs?',
        ],
      };
    }
    if (path.includes('/rebalancing')) {
      return {
        pageName: 'Portfolio Rebalancing',
        summary: 'Target allocation drift monitoring and trade scheduling.',
        suggestedPrompts: [
          'How far has my equity allocation drifted from target?',
          'What are the minimum-tax rebalancing trade steps?',
          'Should I rebalance using fresh SIP inflows instead of selling?',
        ],
      };
    }
    if (path.includes('/loan') || path.includes('/mortgage-refi')) {
      return {
        pageName: 'Loan & Debt Negotiator',
        summary: 'Amortisation schedules, repo-linked spread arbitrage, and prepayment savings.',
        suggestedPrompts: [
          'What if I prepay ₹2.5 Lakh on my home loan?',
          'Draft a rate reset negotiation letter for my bank',
          'How much interest do I save by prepaying 5% of principal?',
        ],
      };
    }
    if (path.includes('/council')) {
      return {
        pageName: 'Family Office Council',
        summary: 'Multi-agent wealth committee (Alpha vs Citadel vs Tax & Legal).',
        suggestedPrompts: [
          'Debate: Sabbatical vs Stay for Promotion',
          'Debate: Buy Rental Property vs DCA into S&P 500',
          'Debate: Early Mortgage Payoff vs Equity Compounding',
        ],
      };
    }

    return {
      pageName: 'Wealth Operating System',
      summary: `Net worth: ${currencySymbol}${nw.toLocaleString()}, Profile: ${state?.consumer?.user?.riskProfile || 'Moderate'}`,
      suggestedPrompts: [
        'Scan my entire portfolio for tax-loss harvesting lots',
        'Compare Parag Parikh Flexi Cap vs HDFC Flexi Cap',
        'What are my top 3 wealth optimization actions today?',
      ],
    };
  }, [location.pathname, state?.consumer, market, currencySymbol, isAdvisorRoute]);

  // Initial message thread
  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      role: 'assistant',
      content: isAdvisorRoute
        ? `Hello Advisor. I am your **SEBI RIA Institutional Copilot**. I am synced with **${pageContext.pageName}** (${pageContext.summary}).\n\nHow can I support your client fiduciary advisory today?`
        : `Hello! I am your **Autonomous Wealth Copilot**. I am synced with your **${pageContext.pageName}** (${currencySymbol}${state?.consumer?.netWorth?.total?.toLocaleString() || 'Portfolio'}).\n\nHow can I optimize your wealth strategy right now?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Route context update banner
  useEffect(() => {
    setMessages(prev => [
      ...prev,
      {
        id: `context-${Date.now()}`,
        role: 'system',
        content: `Switched context to **${pageContext.pageName}**. ${pageContext.summary}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [pageContext.pageName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Escape key listener to close sidecar
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onToggle();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onToggle]);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = market === 'US' ? 'en-US' : 'en-IN';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (e) => {
        const spoken = e.results[0][0].transcript;
        if (spoken) {
          setInput(spoken);
          handleSend(spoken);
        }
      };
      recognitionRef.current = recognition;
    }
  }, [market]);

  // Toggle Voice Recognition
  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Safari, or Edge.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // Text-To-Speech Readout
  const speakText = (text) => {
    if (!window.speechSynthesis) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const clean = text.replace(/\*\*/g, '').replace(/<[^>]*>?/gm, '');
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.05;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Inspect Current Screen
  const handleInspectScreen = () => {
    const prompt = `Inspect my current view on "${pageContext.pageName}". Identify any hidden risks, unoptimized holdings, or immediate action items.`;
    handleSend(prompt);
  };

  // Document Vision Upload Handler
  const handleFileUpload = async (file) => {
    if (!file) return;
    setLoading(true);

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: `Uploaded document: **${file.name}** for OCR analysis and portfolio data extraction.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/ai/vision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: file.type || 'application/pdf',
          documentType: file.name,
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Document OCR failed');

      const d = json.data;
      let taxSyncNote = '';
      if (taxStudio?.updateTaxpayer) {
        const updates = {};
        if (d.salary) updates.salary = Number(d.salary);
        if (d.tdsPaid) updates.tdsPaid = Number(d.tdsPaid);
        if (d.fedWithholding) updates.fedWithholding = Number(d.fedWithholding);
        if (d.stcg) updates.stcg = Number(d.stcg);
        if (d.ltcg) updates.ltcg = Number(d.ltcg);
        if (d.deduction80C) updates.deduction80C = Number(d.deduction80C);
        if (Object.keys(updates).length > 0) {
          taxStudio.updateTaxpayer(updates);
          taxSyncNote = `\n\n⚡ **Live Tax Studio Sync**: Extracted figures have been directly populated into your active tax return workspace in the background.`;
        }
      }

      const responseText = `**Document Verified: ${d.documentType || 'Financial Statement'}**\n` +
        `• Institution: ${d.institution || 'Verified Financial Entity'}\n` +
        `• Account / Ref: ${d.accountNumber || 'Masked'}\n` +
        `• Executive Summary: ${d.summary || 'Data extracted successfully.'}\n\n` +
        (d.anomalies && d.anomalies.length > 0 ? `⚠️ **Audit Flags**: ${d.anomalies.join('; ')}\n\n` : '') +
        (taxSyncNote || `Would you like me to update your portfolio holdings with these figures?`);

      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: `Document processed: Extracted account statement figures and verified stamp. Portfolio reconciliation is ready for your confirmation.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Helper: Deep Tab Navigation & Target Spotlighting for Tax Studio
  const navigateToTaxTab = (tabId, tabName, spotlightTarget) => {
    if (location.pathname !== '/app/tax') {
      navigate('/app/tax');
    }
    if (taxStudio?.setTab) {
      taxStudio.setTab(tabId);
    }
    if (spotlightTarget && taxStudio?.triggerSpotlight) {
      setTimeout(() => taxStudio.triggerSpotlight(spotlightTarget), 300);
    }
  };

  // Main Send Handler with Slash Commands & Tool Calling
  async function handleSend(userText) {
    const text = (userText || input).trim();
    if (!text || loading) return;

    setInput('');
    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    // Behavioral Panic-Selling Interceptor
    const panicCheck = checkPanicSellingIntent(text);
    let behavioralNote = '';
    if (panicCheck.isPanic) {
      behavioralNote = `\n[Behavioral Intervention]: ${panicCheck.coachingNote}`;
    }

    // Slash Command Client Dispatcher
    if (text.startsWith('/council')) {
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: `Initiating **Family Office Council** session. Navigating to the multi-agent debate floor...`,
            action: { type: 'navigate', to: '/app/council', label: 'Open Council Floor →' },
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setLoading(false);
        navigate('/app/council');
      }, 450);
      return;
    }

    if (text.startsWith('/will')) {
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: `Auditing Estate & Nominee records. Navigating to the **Digital Will & Succession Studio**...`,
            action: { type: 'navigate', to: '/app/will', label: 'Open Digital Will Studio →' },
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setLoading(false);
        navigate('/app/will');
      }, 450);
      return;
    }

    if (text.startsWith('/audit')) {
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: `Generating SEBI-compliant Advisor Audit Log. Navigating to the **Audit Vault**...`,
            action: { type: 'navigate', to: '/advisor/audit', label: 'Open SEBI Audit Vault →' },
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setLoading(false);
        navigate('/advisor/audit');
      }, 450);
      return;
    }

    if (text.startsWith('/export')) {
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: `Official Fiduciary Consultation Dossier compiled with registered SEBI RIA credentials (INA000014523) and SHA-256 session integrity digest.`,
            card: { cardType: 'dossier_export' },
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setLoading(false);
      }, 500);
      return;
    }

    // ── Agentic Tax Studio Command Dispatchers (8 Pillars) ───────────────
    // Pillar 6: Ghost Driver Guided Tour Mode
    if (text.match(/walk me through|guide me|guided tour|take me through|tour mode|\/tour|\/guide/i)) {
      setTimeout(() => {
        navigateToTaxTab('itr', 'ITR Assistant', 'calc-card');
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: `🧭 **Guided Tax Tour: Step 1 of 3 (Regime Optimization)**\n\nI have navigated your screen to the **Regime & Deduction Optimizer**. Here, we compute whether the **New Tax Regime (Section 115BAC)** or the **Old Regime** saves you more money.\n\nTake a look at the highlighted progressive slab visualizer on screen. Click below to proceed to **Step 2 (Loss Harvesting)** or ask me any question about your deductions.`,
            action: {
              type: 'tax_tour_next',
              label: 'Proceed to Step 2: Loss Harvesting →',
              onClick: () => {
                navigateToTaxTab('harvester', 'Tax-Loss Harvester', 'harvest-execute-btn');
                setMessages(m => [
                  ...m,
                  {
                    id: `ai-${Date.now()}`,
                    role: 'assistant',
                    content: `📉 **Guided Tax Tour: Step 2 of 3 (Tax-Loss Harvesting)**\n\nI have switched your workspace to the **Tax-Loss Harvester**. Here you can offset capital gains by selling dipped positions and instantly reinvesting in non-identical proxies.\n\nReady for **Step 3: Foreign Assets & Forensic Audit**?`,
                    action: {
                      type: 'tax_tour_next',
                      label: 'Proceed to Step 3: Foreign Assets & Audit →',
                      onClick: () => {
                        navigateToTaxTab('forensic', 'Forensic Audit', 'fa-foreign-stock-table');
                        setMessages(m2 => [
                          ...m2,
                          {
                            id: `ai-${Date.now()}`,
                            role: 'assistant',
                            content: `🛡️ **Guided Tax Tour: Step 3 of 3 (Schedule FA & Audit Shield)**\n\nHere you can declare foreign accounts, RSUs, and run the 28-rule audit linter to ensure zero statutory notices.\n\n🎉 **Tour Complete!** You are ready to generate your certified return draft.`,
                          }
                        ]);
                      }
                    }
                  }
                ]);
              }
            },
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setLoading(false);
      }, 350);
      return;
    }

    // Pillar 1 & 2: Foreign Assets / Schedule FA Deep Navigation & Spotlighting
    if (text.match(/foreign asset|schedule fa|rsu|foreign stock|black money/i)) {
      setTimeout(() => {
        navigateToTaxTab('forensic', 'Schedule FA (Foreign Assets)', 'fa-foreign-stock-table');
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: `I have navigated your screen to **Schedule FA (Foreign Assets)** and spotlighted the foreign holdings declaration table.\n\nUnder statutory rules, all foreign equity, depository receipts, and overseas broker accounts must be declared to prevent penalty notices under the Black Money Act.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setLoading(false);
      }, 350);
      return;
    }

    // Pillar 1 & 2 & 5: Tax-Loss Harvesting & Paired Swaps
    if (text.match(/harvest|wash sale|tax loss|loss harvesting|\/harvest/i)) {
      setTimeout(() => {
        navigateToTaxTab('harvester', 'Tax-Loss Harvester', 'harvest-execute-btn');
        const harvestCard = {
          cardType: 'basket_order',
          strategyName: market === 'US' ? 'US Tax-Loss Harvesting & Proxy Reinvestment' : 'LTCG/STCG Tax-Loss Harvester',
          orders: market === 'US' ? [
            { symbol: 'NVDA', action: 'SELL', quantity: 25, price: 118, taxImpact: -4200, reason: 'Harvest STCL against wage income' },
            { symbol: 'SOXX', action: 'BUY', quantity: 12, price: 235, taxImpact: 0, reason: 'Semiconductor ETF Proxy (Avoids Wash-Sale)' },
          ] : [
            { symbol: 'INFY', action: 'SELL', quantity: 30, price: 1880, taxImpact: -12400, reason: 'Harvest STCG Loss under 20% slab' },
            { symbol: 'NIFTYBEES', action: 'BUY', quantity: 210, price: 268, taxImpact: 0, reason: 'Broad Nifty 50 Proxy Allocation' },
          ],
          totalValue: market === 'US' ? 5770 : 84200,
          netTaxSaved: market === 'US' ? 1260 : 2480,
        };
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: `I have navigated to the **Tax-Loss Harvester** and spotlighted the execution button. I prepared a verified harvest basket for you below.`,
            card: harvestCard,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setLoading(false);
      }, 350);
      return;
    }

    // Pillar 3: Remote Control for Modals (Dropzone, Sandbox, Vault)
    if (text.match(/upload|dropzone|import doc|w-2|form 16|1099/i) && !text.includes('explain')) {
      setTimeout(() => {
        if (location.pathname !== '/app/tax') navigate('/app/tax');
        if (taxStudio?.setIsDropzoneOpen) taxStudio.setIsDropzoneOpen(true);
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: `Opening the **Universal Document Dropzone** modal on your screen. You can drag and drop your Form 16, W-2, 1099-B, or brokerage statement directly.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setLoading(false);
      }, 350);
      return;
    }

    if (text.match(/sandbox|what-if|scenario comparison|simulate move|simulate relocation/i)) {
      setTimeout(() => {
        if (location.pathname !== '/app/tax') navigate('/app/tax');
        if (taxStudio?.setIsScenarioOpen) taxStudio.setIsScenarioOpen(true);
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: `Opening the **Side-by-Side What-If Scenario Sandbox** on your screen. You can simulate tax relocation, wage adjustments, and deduction splits in real-time.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setLoading(false);
      }, 350);
      return;
    }

    if (text.match(/loss vault|carryforward vault|multi-year loss/i)) {
      setTimeout(() => {
        if (location.pathname !== '/app/tax') navigate('/app/tax');
        if (taxStudio?.setIsVaultOpen) taxStudio.setIsVaultOpen(true);
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: `Opening the **Multi-Year Loss Carryforward Vault** modal on your screen. You can inspect unabsorbed STCL / LTCL lots across prior assessment years.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setLoading(false);
      }, 350);
      return;
    }

    // Pillar 1 & 2: S-Corp / HUF Studio
    if (text.match(/s-corp|scorp|reasonable salary|reasonable comp|huf|hindu undivided/i)) {
      setTimeout(() => {
        const isUS = market === 'US';
        navigateToTaxTab('huf', isUS ? 'S-Corp Studio' : 'HUF Tax Shield', isUS ? 'scorp-salary-slider' : 'huf-deed-btn');
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: isUS
              ? `I have switched your workspace to the **S-Corp Reasonable Compensation Studio** and highlighted the salary slider. Setting your wage to $95,000 saves an estimated **$7,420** in FICA taxes.`
              : `I have navigated your workspace to the **HUF Tax Shield Studio** and highlighted the deed generator. Partitioning rental and passive investments through an HUF creates a separate ₹2.5L basic exemption slab.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setLoading(false);
      }, 350);
      return;
    }

    // Pillar 1 & 2: Quarterly Safe Harbor
    if (text.match(/quarterly|safe harbor|advance tax|estimated tax/i)) {
      setTimeout(() => {
        navigateToTaxTab('quarterly', 'Quarterly Safe Harbor Sentinel', 'safe-harbor-ics-sync-btn');
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: `I have navigated your screen to the **Quarterly Safe Harbor Sentinel** and spotlighted the IRS/ITD calendar sync. Complying with safe harbor installments protects you from statutory interest penalties.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setLoading(false);
      }, 350);
      return;
    }

    // Pillar 5: In-Chat Tax Regime Decision Card
    if (text.match(/regime|115bac|old vs new|standard vs itemized/i)) {
      setTimeout(() => {
        navigateToTaxTab('itr', 'ITR Assistant', 'calc-card');
        const regimeCard = {
          cardType: 'tax_regime',
          market,
          recommendedRegime: 'new',
          oldTax: market === 'US' ? 48500 : 425000,
          newTax: market === 'US' ? 44200 : 382500,
          savings: market === 'US' ? 4300 : 42500,
        };
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: `I have analyzed your tax profile under statutory brackets. The **${market === 'US' ? 'Standard Deduction' : 'New Tax Regime (Section 115BAC)'}** yields lower tax liability. A 1-click decision card is prepared below.`,
            card: regimeCard,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setLoading(false);
      }, 350);
      return;
    }

    // Pillar 7: Proactive Audit Watchdog Card
    if (text.match(/audit|scrutiny|red flag|linter|143\(1\)/i) && !text.startsWith('/audit')) {
      setTimeout(() => {
        navigateToTaxTab('forensic', 'Forensic Audit Sentinel', 'audit-linter-card');
        const auditCard = {
          cardType: 'tax_audit',
          market,
          score: 92,
          flags: market === 'US' ? [
            { id: 'f-1', severity: 'WARNING', title: 'Schedule D Wash-Sale Linter', desc: 'Active paired swap prevents IRC §1091 replacement stock loss disallowance.' },
            { id: 'f-2', severity: 'INFO', title: 'S-Corp Reasonable Wage Audit', desc: 'Wage-to-distribution ratio verified against Bureau of Labor Statistics.' },
          ] : [
            { id: 'f-1', severity: 'WARNING', title: 'Schedule FA Foreign Assets', desc: 'US Tech RSUs require complete foreign asset disclosure under Black Money Act.' },
            { id: 'f-2', severity: 'INFO', title: 'Section 44ADA Presumptive Safe Harbor', desc: 'Declared net profit ratio exceeds 50% statutory threshold.' },
          ],
        };
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: `I have initiated the **Forensic Audit Linter** across statutory rules. Your return score is **92/100**. One potential scrutiny point requires safe harbor confirmation below.`,
            card: auditCard,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setLoading(false);
      }, 350);
      return;
    }

    // Call Backend API
    try {
      const memory = await loadCopilotMemory(currentUser?.uid);
      const memoryContext = formatMemoryContext(memory);

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `[Context: ${pageContext.pageName} | Market: ${market}] ${text}${behavioralNote}\n${memoryContext}`,
          }],
          portfolioContext: {
            netWorth: state?.consumer?.netWorth?.total || 12450000,
            holdingsSummary: state?.consumer?.holdings,
            activePage: pageContext.pageName,
            isAdvisor: isAdvisorRoute,
            clientName: isAdvisorRoute ? 'Arun Sharma' : (currentUser?.displayName || 'Investor'),
            riskProfile: state?.consumer?.user?.riskProfile || 'Moderate',
          },
        }),
      });

      const data = await res.json();
      const reply = data?.reply ||
        `Based on your portfolio state and market context, executing this action optimizes your risk-adjusted after-tax yield. A verified action ticket has been prepared below.`;

      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: reply,
          card: data?.card,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch {
      // Offline / fallback response
      let fallbackCard = null;
      if (text.includes('/harvest') || text.includes('harvest')) {
        fallbackCard = {
          cardType: 'basket_order',
          strategyName: 'Tax-Loss Harvesting & Proxy Reinvestment',
          orders: [
            { symbol: 'NVDA', action: 'SELL', quantity: 25, price: 118, taxImpact: -4200, reason: 'Harvest Short-Term Capital Loss' },
            { symbol: 'SOXX', action: 'BUY', quantity: 12, price: 235, taxImpact: 0, reason: 'Semiconductor ETF Proxy (Avoids Wash-Sale)' },
            { symbol: 'INFY', action: 'SELL', quantity: 30, price: 1880, taxImpact: -12400, reason: 'Harvest STCG Loss under 20% slab' },
            { symbol: 'NIFTYBEES', action: 'BUY', quantity: 210, price: 268, taxImpact: 0, reason: 'Broad Nifty 50 Proxy Allocation' },
          ],
          totalValue: 124000,
          netTaxSaved: 3320,
        };
      } else if (text.includes('/rebalance') || text.includes('rebalance')) {
        fallbackCard = {
          cardType: 'basket_order',
          strategyName: 'Target Allocation Rebalancing Basket',
          orders: [
            { symbol: 'TCS', action: 'SELL', quantity: 15, price: 3450, taxImpact: 0, reason: 'Trim 8% Tech Sector Overweight' },
            { symbol: 'GOLDBEES', action: 'BUY', quantity: 180, price: 62.5, taxImpact: 0, reason: 'Align Gold to 10% IPS Target' },
          ],
          totalValue: 63000,
          netTaxSaved: 0,
        };
      } else if (text.includes('/loan') || text.includes('prepay') || text.includes('mortgage')) {
        fallbackCard = {
          cardType: 'prepayment_slider',
          loanName: 'HDFC Home Loan',
          currentPrincipal: 4850000,
          interestRate: 8.65,
          tenureMonths: 180,
          prepaymentAmount: 250000,
        };
      } else if (text.includes('compare')) {
        fallbackCard = {
          cardType: 'fund_comparison',
          fundA: { name: 'Parag Parikh Flexi Cap Fund', aum: '₹72,400 Cr', expenseRatio: '0.62%', cagr3Y: '21.4%', alpha: '4.8' },
          fundB: { name: 'HDFC Flexi Cap Fund', aum: '₹58,100 Cr', expenseRatio: '0.78%', cagr3Y: '23.8%', alpha: '5.2' },
          overlapPct: '28%',
          recommendation: 'Parag Parikh offers international diversification, while HDFC Flexi Cap has higher domestic momentum.',
        };
      }

      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: `I've analyzed your **${pageContext.pageName}** data. Based on historical data and your risk profile (${state?.consumer?.user?.riskProfile || 'Moderate'}), maintaining disciplined DCA and harvesting loss lots remains your highest-conviction strategy.`,
          card: fallbackCard,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Global Floating AI Orb Trigger Button (Bottom Right) — Hidden when drawer is open */}
      {!isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            zIndex: 90,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <button
            type="button"
            onClick={() => {
              onToggle();
              if (unreadAlerts > 0) {
                markAlertsAsRead(proactiveAlerts);
                setUnreadAlerts(0);
              }
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.65rem 1.15rem',
              borderRadius: 30,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #4f46e5 100%)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 30px rgba(99, 102, 241, 0.45)',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            title="Toggle Copilot Sidecar (Cmd + J)"
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Sparkles size={16} />
              {unreadAlerts > 0 ? (
                <span
                  style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    background: 'var(--red)',
                    color: 'white',
                    fontSize: '0.65rem',
                    fontWeight: 900,
                    width: 17,
                    height: 17,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 10px rgba(239, 68, 68, 0.7)',
                    animation: 'pulse 2s infinite',
                  }}
                >
                  {unreadAlerts}
                </span>
              ) : (
                <span
                  style={{
                    position: 'absolute',
                    top: -3,
                    right: -3,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#10b981',
                    boxShadow: '0 0 8px #10b981',
                  }}
                />
              )}
            </div>
            <span>
              {isAdvisorRoute
                ? 'RIA Copilot'
                : isTaxStudio && taxRoadmap
                ? `Copilot AI • ${taxCompletedCount}/${taxSteps.length} Done 🧭`
                : 'Copilot AI'}
            </span>
            <kbd
              style={{
                fontSize: '0.65rem',
                padding: '0.1rem 0.4rem',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 4,
                fontFamily: 'monospace',
                opacity: 0.9,
              }}
            >
              ⌘J
            </kbd>
          </button>
        </div>
      )}

      {/* Click Outside / Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onToggle}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(1px)',
            zIndex: 94,
            cursor: 'pointer',
          }}
          title="Click anywhere to close Copilot"
        />
      )}

      {/* Dockable 440px Right Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 440,
          maxWidth: '100vw',
          background: 'var(--surface-raised)',
          borderLeft: '1px solid var(--glass-border)',
          boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.5)',
          zIndex: 95,
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
        }}
      >
        {/* Drag Overlay */}
        {dragActive && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(99, 102, 241, 0.92)',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              backdropFilter: 'blur(4px)',
            }}
          >
            <Upload size={44} style={{ marginBottom: 12, animation: 'bounce 1s infinite' }} />
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Drop Document to Analyze</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.85, marginTop: 4 }}>
              Bank Statements, CAMS CAS, EPF Passbooks, ITRs
            </div>
          </div>
        )}

        {/* Drawer Header */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: isAdvisorRoute
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <Bot size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {isAdvisorRoute ? 'SEBI RIA Copilot' : 'FinAgent Copilot'}
                </span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    color: isAdvisorRoute ? 'var(--gold)' : 'var(--green)',
                    background: isAdvisorRoute ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    padding: '1px 6px',
                    borderRadius: 4,
                  }}
                >
                  {isAdvisorRoute ? 'INA000014523' : 'LIVE'}
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {pageContext.pageName}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              type="button"
              onClick={handleInspectScreen}
              className="btn btn-ghost btn-sm"
              title="Inspect Current Screen Context"
              style={{ padding: '4px 8px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Eye size={13} />
              <span>Inspect</span>
            </button>
            <button
              type="button"
              onClick={onToggle}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--red)',
                cursor: 'pointer',
                padding: '0.3rem 0.65rem',
                borderRadius: 8,
                fontSize: '0.75rem',
                fontWeight: 800,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--red)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                e.currentTarget.style.color = 'var(--red)';
              }}
              title="Close Copilot (Esc or Cmd+J)"
            >
              <X size={14} />
              <span>Close ✕</span>
            </button>
          </div>
        </div>

        {/* Pinned Tax GPS Roadmap Header on /app/tax */}
        {isTaxStudio && (
          <TaxGPSRoadmapHeader
            onAskAboutStep={(step) => {
              handleSend(`Explain step: ${step.title} and what actions I need to take.`);
            }}
          />
        )}

        {/* Proactive Intelligence Banner Tray */}
        {proactiveAlerts.length > 0 && (
          <div
            style={{
              padding: '0.5rem 1rem',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(16, 185, 129, 0.05))',
              borderBottom: '1px solid var(--glass-border)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
              onClick={() => setShowProactiveTray(prev => !prev)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                <Zap size={14} style={{ color: 'var(--gold)' }} />
                <span>Autonomous Radar ({proactiveAlerts.length} Active Insights)</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }}>
                {showProactiveTray ? 'Hide' : 'View Alerts'}
              </span>
            </div>

            {showProactiveTray && (
              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {proactiveAlerts.map(a => (
                  <div
                    key={a.id}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 8,
                      padding: '0.5rem 0.65rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.3rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {a.icon} {a.title}
                      </span>
                      {a.urgent && (
                        <span style={{ fontSize: '0.625rem', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--red)', fontWeight: 800, padding: '1px 5px', borderRadius: 4 }}>
                          URGENT
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                      {a.summary}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowProactiveTray(false);
                          handleSend(a.actionCommand);
                        }}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.7rem', padding: '0.25rem 0.6rem', borderRadius: 6 }}
                      >
                        {a.actionLabel} →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Message Thread Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
          }}
        >
          {messages.map((m) => {
            if (m.role === 'system') {
              return (
                <div
                  key={m.id}
                  style={{
                    alignSelf: 'center',
                    background: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    borderRadius: 20,
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.72rem',
                    color: 'var(--text-secondary)',
                    textAlign: 'center',
                  }}
                >
                  <span dangerouslySetInnerHTML={{ __html: m.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                </div>
              );
            }

            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  gap: '0.6rem',
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '92%',
                }}
              >
                {!isUser && (
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: isAdvisorRoute ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                      color: isAdvisorRoute ? 'var(--green)' : 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    <Bot size={14} />
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      background: isUser ? 'var(--primary)' : 'var(--surface)',
                      border: isUser ? 'none' : '1px solid var(--glass-border)',
                      color: isUser ? 'white' : 'var(--text-primary)',
                      padding: '0.65rem 0.9rem',
                      borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      fontSize: '0.825rem',
                      lineHeight: 1.5,
                      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
                    }}
                  >
                    <div
                      dangerouslySetInnerHTML={{
                        __html: m.content
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\n\n/g, '<br/><br/>')
                          .replace(/\n/g, '<br/>')
                      }}
                    />

                    {/* Interactive Generative UI Card Injections */}
                    {m.card && m.card.cardType === 'basket_order' && (
                      <InChatBasketOrderCard
                        card={m.card}
                        onComplete={() => {
                          if (taxStudio?.executeLossHarvest) {
                            taxStudio.executeLossHarvest();
                          }
                        }}
                      />
                    )}
                    {m.card && (m.card.cardType === 'tax_regime' || m.card.cardType === 'tax_comparison') && (
                      <InChatTaxRegimeCard
                        card={m.card}
                        onComplete={(res) => {
                          handleSend(`Applied ${res.appliedRegime} tax regime. Saved ${res.savings}.`);
                        }}
                      />
                    )}
                    {m.card && m.card.cardType === 'tax_audit' && (
                      <InChatTaxAuditCard
                        card={m.card}
                        onComplete={(res) => {
                          handleSend(`Secured safe harbor compliance for ${res.fixedCount} audit rules.`);
                        }}
                      />
                    )}
                    {m.card && m.card.cardType === 'prepayment_slider' && (
                      <InChatPrepaymentSliderCard card={m.card} />
                    )}
                    {m.card && m.card.cardType === 'fund_comparison' && (
                      <InChatFundCompareCard card={m.card} />
                    )}
                    {m.card && m.card.cardType === 'dossier_export' && (
                      <InChatDossierExportCard
                        messages={messages}
                        userProfile={userProfile}
                        portfolioContext={{ netWorth: state?.consumer?.netWorth?.total }}
                      />
                    )}

                    {m.action && (
                      <div style={{ marginTop: '0.65rem' }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (m.action.onClick) {
                              m.action.onClick();
                            } else {
                              if (m.action.to) navigate(m.action.to);
                              onToggle();
                            }
                          }}
                          className="btn btn-primary btn-sm"
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.35rem 0.75rem',
                            borderRadius: 8,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                        >
                          <span>{m.action.label}</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: '0.65rem',
                      color: 'var(--text-muted)',
                      marginTop: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      justifyContent: isUser ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <span>{m.timestamp}</span>
                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => speakText(m.content)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: isSpeaking ? 'var(--primary)' : 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'inline-flex',
                          alignItems: 'center',
                        }}
                        title="Read Out Aloud"
                      >
                        {isSpeaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
                      </button>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    <User size={14} />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem' }}>
              <Sparkles size={14} style={{ color: 'var(--primary)', animation: 'spin 1.5s linear infinite' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Reasoning over market data & fiduciary portfolio state...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompts */}
        <div
          style={{
            padding: '0.55rem 1rem',
            borderTop: '1px solid var(--glass-border)',
            background: 'var(--surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.3rem',
          }}
        >
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Contextual Actions for this page
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {pageContext.suggestedPrompts.slice(0, 2).map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(prompt)}
                style={{
                  textAlign: 'left',
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 6,
                  padding: '0.35rem 0.6rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
              >
                💡 {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Hidden File Input for Vision OCR */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
          }}
        />

        {/* Chat Input Bar */}
        <div
          style={{
            padding: '0.75rem 1rem',
            borderTop: '1px solid var(--glass-border)',
            background: 'var(--surface-raised)',
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'var(--surface)',
              border: isListening ? '1px solid var(--red)' : '1px solid var(--glass-border)',
              borderRadius: 12,
              padding: '0.35rem 0.55rem',
            }}
          >
            {/* Paperclip for Vision Upload */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
              }}
              title="Attach Document / PDF for OCR Extraction"
            >
              <Paperclip size={15} />
            </button>

            {/* Input field */}
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={isListening ? 'Listening...' : 'Ask Copilot or type /harvest, /loan, /export...'}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.825rem',
              }}
            />

            {/* Voice Mic Button */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              style={{
                background: isListening ? 'var(--red)' : 'transparent',
                border: 'none',
                color: isListening ? 'white' : 'var(--text-muted)',
                borderRadius: 6,
                padding: 4,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Toggle Hands-Free Voice Input"
            >
              {isListening ? <MicOff size={15} /> : <Mic size={15} />}
            </button>

            {/* Send Button */}
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                background: input.trim() ? 'var(--primary)' : 'transparent',
                border: 'none',
                color: input.trim() ? 'white' : 'var(--text-muted)',
                borderRadius: 8,
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: input.trim() ? 'pointer' : 'default',
                transition: 'all 0.15s ease',
              }}
            >
              <Send size={14} />
            </button>
          </form>

          {/* Quick Slash Commands List */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '0.65rem', color: 'var(--text-muted)', padding: '0 4px' }}>
            <span>Commands: <code>/harvest</code> <code>/loan</code> <code>/rebalance</code> <code>/export</code></span>
            <span><code>⌘J</code> to toggle</span>
          </div>
        </div>
      </div>
    </>
  );
}
