import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Sparkles, Shield, TrendingUp, Scale, AlertTriangle,
  ArrowRight, CheckCircle2, Bookmark, Download, RefreshCw, Send,
  Cpu, Flame, Heart, Volume2, VolumeX, FastForward, Play,
  ShieldCheck, Zap, ExternalLink, HelpCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { buildCouncilActionMemoPDF } from '../../utils/fiduciaryPdfBuilder';

const PRESET_SCENARIOS = [
  {
    id: 'real_estate',
    icon: '🏡',
    title: 'Rental Property vs Index Funds',
    question: 'Should I liquidate surplus equity to purchase a rental property with 20% down or DCA into broad index funds?',
    category: 'Asset Allocation'
  },
  {
    id: 'sabbatical',
    icon: '🏖️',
    title: '1-Year Sabbatical vs Promotion',
    question: 'Can I afford a 1-year career sabbatical without impairing my long-term FIRE retirement milestone at age 45?',
    category: 'Life Event'
  },
  {
    id: 'mortgage_payoff',
    icon: '🏦',
    title: 'Pay Off Debt vs Equity Compounding',
    question: 'Should I make a lump-sum prepayment on my home loan or invest that capital into broad-market index ETFs?',
    category: 'Debt Strategy'
  },
  {
    id: 'esop_exercise',
    icon: '🚀',
    title: 'Pre-IPO Options Exercise & Tax Hold',
    question: 'Should I exercise vested startup options now to start the capital gains clock, or hold off to avoid AMT / perquisite tax drag?',
    category: 'Equity OS'
  }
];

const PRESET_CHALLENGES = [
  {
    id: 'market_drop',
    label: '📉 20% Market Crash',
    text: 'What if equity markets correct 20% right after execution?'
  },
  {
    id: 'interest_hike',
    label: '📈 100 bps Rate Hike',
    text: 'What if central banks raise interest rates by 100 bps next month?'
  },
  {
    id: 'income_shock',
    label: '💼 6-Month Income Pause',
    text: 'What if my primary salary or consulting income stops for 6 months?'
  },
  {
    id: 'tax_hike',
    label: '🏛️ Capital Gains Tax Hike',
    text: 'What if capital gains tax rates increase by 5% in the next budget?'
  }
];

export default function CouncilHub() {
  const navigate = useNavigate();
  const { state, dispatch, isUSMarket } = useApp();
  const { userProfile } = useAuth();

  const market = state?.activeMarket || (isUSMarket ? 'US' : 'IN');
  const currencySymbol = market === 'IN' ? '₹' : '$';

  // Extract real user portfolio telemetry from AppContext
  const holdings = state?.consumer?.holdings || {};
  const user = state?.consumer?.user || {};
  const netWorthTotal = state?.consumer?.netWorth?.total || (market === 'IN' ? 12487320 : 842500);

  // Compute live liquid buffer (FDs + Liquid MFs)
  const fdCash = (holdings.fixedDeposits || []).reduce((s, fd) => s + (fd.amount || fd.principal || 0), 0);
  const liquidMFCash = (holdings.mutualFunds || [])
    .filter(mf => (mf.category || '').toLowerCase().includes('liquid') || (mf.name || '').toLowerCase().includes('liquid') || (mf.name || '').toLowerCase().includes('overnight'))
    .reduce((s, mf) => s + (mf.value || 0), 0);
  const totalLiquid = (fdCash + liquidMFCash) || (market === 'IN' ? 1850000 : 75000);
  const annualIncome = user.income || (market === 'IN' ? 1800000 : 285000);
  const monthlyExpense = Math.max(25000, Math.round((annualIncome * 0.55) / 12));
  const liquidMonths = (totalLiquid / monthlyExpense).toFixed(1);

  // Compute live equity allocation
  const equityVal = (holdings.equities || []).reduce((s, eq) => s + (eq.value || 0), 0) +
    (holdings.mutualFunds || []).filter(mf => !(mf.category || '').toLowerCase().includes('debt') && !(mf.category || '').toLowerCase().includes('liquid')).reduce((s, mf) => s + (mf.value || 0), 0);
  const equityPct = netWorthTotal > 0 ? Math.round((equityVal / netWorthTotal) * 100) : 48;

  // Key holdings summary
  const topStocks = (holdings.equities || []).slice(0, 3).map(e => e.symbol || e.name);
  const topMFs = (holdings.mutualFunds || []).slice(0, 2).map(m => m.name?.split(' ')[0]);
  const topHoldingsSummary = [...topStocks, ...topMFs].filter(Boolean).join(', ') || (market === 'IN' ? 'Nifty 50, HDFC Bank, Parag Parikh Flexi Cap' : 'VOO, MSFT, AAPL');

  // Debt liabilities summary
  const totalDebt = (holdings.realEstate || []).reduce((s, r) => s + (r.loanOutstanding || 0), 0);
  const totalEMI = (holdings.realEstate || []).reduce((s, r) => s + (r.emiMonthly || 0), 0);
  const debtSummary = totalDebt > 0
    ? `${currencySymbol}${totalDebt.toLocaleString()} outstanding (EMI: ${currencySymbol}${totalEMI.toLocaleString()}/mo)`
    : (market === 'IN' ? 'Zero high-interest personal debt' : 'Zero revolving credit balance');

  // Tax loss summary
  const totalUnrealizedLoss = (holdings.equities || []).filter(e => (e.pnl || 0) < 0).reduce((s, e) => s + Math.abs(e.pnl), 0);
  const taxLossSummary = totalUnrealizedLoss > 0
    ? `${currencySymbol}${totalUnrealizedLoss.toLocaleString()} harvestable short-term losses available`
    : (market === 'IN' ? 'Under ₹1.25L annual LTCG exemption limit' : 'Under annual capital gain exemption allowance');

  // Interactive UI States
  const [selectedScenario, setSelectedScenario] = useState(PRESET_SCENARIOS[0].id);
  const [customQuestion, setCustomQuestion] = useState(PRESET_SCENARIOS[0].question);
  const [debating, setDebating] = useState(false);
  const [councilResult, setCouncilResult] = useState(null);
  const [activeRoundTab, setActiveRoundTab] = useState(0);
  const [savedToDossier, setSavedToDossier] = useState(false);
  const [routedToAdvisor, setRoutedToAdvisor] = useState(false);

  // Turn-Taking Live Debate Floor Simulation
  const [simulationStage, setSimulationStage] = useState(0); // 0: Idle, 1: Alpha, 2: Citadel, 3: Tax, 4: Consensus
  const [skipSimulation, setSkipSimulation] = useState(false);
  const simTimerRef = useRef(null);

  // Speech Narration State
  const [isSpeaking, setIsSpeaking] = useState(false);

  // "Challenge the Council" State
  const [challengeInput, setChallengeInput] = useState('');
  const [challenging, setChallenging] = useState(false);
  const [challengeResult, setChallengeResult] = useState(null);

  // Clean speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, []);

  async function handleConveneCouncil(questionText) {
    const q = (questionText || customQuestion).trim();
    if (!q || debating) return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    setDebating(true);
    setCouncilResult(null);
    setChallengeResult(null);
    setSavedToDossier(false);
    setRoutedToAdvisor(false);
    setSimulationStage(1);

    // Start simulation ticker
    let stage = 1;
    simTimerRef.current = setInterval(() => {
      stage += 1;
      if (stage <= 3) {
        setSimulationStage(stage);
      }
    }, 1400);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/council/debate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          scenario: selectedScenario,
          userProfile: {
            name: user?.name || userProfile?.name || (market === 'IN' ? 'Arjun Sharma' : 'Alex Chen'),
            age: user?.age || 35,
            city: user?.city || (market === 'IN' ? 'Bangalore' : 'San Francisco'),
            income: annualIncome,
            riskProfile: user?.riskProfile || 'Moderate',
            market
          },
          portfolioSummary: {
            netWorth: netWorthTotal,
            liquidMonths,
            equityPct,
            topHoldingsSummary,
            debtSummary,
            taxLossSummary,
            holdings
          }
        })
      });

      const json = await res.json();
      if (json.success && json.data) {
        setCouncilResult(json.data);
      }
    } catch (err) {
      console.error('Council error:', err);
    } finally {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
      setSimulationStage(4);
      setDebating(false);
    }
  }

  // Handle "Challenge the Council" follow-up stress test
  async function handleChallengeCouncil(customChallenge) {
    const challengeText = (customChallenge || challengeInput).trim();
    if (!challengeText || challenging) return;

    setChallenging(true);
    setChallengeResult(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/council/challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenge: challengeText,
          originalQuestion: customQuestion,
          currentMemo: councilResult || {},
          userProfile: {
            name: user?.name || (market === 'IN' ? 'Arjun Sharma' : 'Alex Chen'),
            market,
            city: user?.city || 'India'
          },
          portfolioSummary: {
            netWorth: netWorthTotal,
            liquidMonths,
            equityPct
          }
        })
      });

      const json = await res.json();
      if (json.success && json.data) {
        setChallengeResult(json.data);
      }
    } catch (err) {
      console.error('Challenge error:', err);
    } finally {
      setChallenging(false);
    }
  }

  // Handle PDF Export
  function handleDownloadPDF() {
    if (!councilResult) return;
    const doc = buildCouncilActionMemoPDF(
      councilResult,
      {
        name: user?.name || (market === 'IN' ? 'Arjun Sharma' : 'Alex Chen'),
        riskProfile: user?.riskProfile || 'Moderate',
        market,
        city: user?.city || (market === 'IN' ? 'Bangalore' : 'San Francisco'),
      },
      {
        netWorth: netWorthTotal,
        liquidMonths,
        equityPct
      }
    );
    doc.save(`Family_Office_Council_Action_Memo_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  // Handle Web Speech API Audio Narration
  function handleToggleAudio() {
    if (!('speechSynthesis' in window) || !councilResult) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const recs = (councilResult.actionMemo?.unanimousRecommendations || []).join('. ');
    const textToSpeak = `Family Office Investment Council Verdict: ${councilResult.verdict}. Key Unanimous Recommendations: ${recs}. Projected Impact: ${councilResult.actionMemo?.financialImpact || ''}`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = market === 'IN' ? 'en-IN' : 'en-US';

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }

  // 1-Click SEBI RIA Advisor Review Queue Dispatch
  function handleRouteToAdvisorQueue() {
    if (!councilResult) return;

    const councilReco = {
      id: `r_council_${Date.now()}`,
      clientId: 'c1',
      clientName: user?.name || (market === 'IN' ? 'Arjun Sharma' : 'Alex Chen'),
      type: 'family_office_council',
      urgency: 'high',
      confidence: councilResult.consensusScore || 90,
      createdAt: new Date().toISOString(),
      title: councilResult.actionMemo?.title || 'Family Office Council Investment Strategy',
      summary: councilResult.verdict,
      impact: {
        'Committee Consensus': `${councilResult.consensusScore}% Alignment`,
        'Financial Impact': councilResult.actionMemo?.financialImpact || '+Rs. 48,000/yr alpha',
        'Preserved Buffer': `${liquidMonths} months liquidity`,
        'Statutory Status': market === 'IN' ? 'SEBI Reg. 17 Compliant' : 'SEC Fiduciary Standard'
      },
      aiRationale: [
        ...(councilResult.actionMemo?.unanimousRecommendations || []),
        `Stress-tested across Alpha, Citadel, and Tax agents with ${councilResult.consensusScore}% alignment score.`,
        `Preserves ${liquidMonths} months living expense runway prior to surplus capital deployment.`
      ],
      recommendation: councilResult.actionMemo?.actionSteps?.[0]?.action || 'Execute phased deployment across low-cost index proxies.',
      action: 'Council Phased Allocation Directive',
      status: 'pending',
      advisorEdit: '',
    };

    dispatch({ type: 'ADD_RECOMMENDATIONS', payload: councilReco });
    setRoutedToAdvisor(true);
  }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🏛️</span>
            <h1 className="text-h1" style={{ margin: 0 }}>Family Office Investment Council</h1>
            <span className="badge badge-primary">Autonomous Multi-Agent</span>
          </div>
          <p className="text-sm text-secondary" style={{ margin: 0 }}>
            Convene an institutional 3-agent wealth committee to simulate, stress-test, and debate your most critical financial dilemmas.
          </p>
        </div>

        {/* Live Grounded Telemetry Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-raised)', padding: '0.4rem 0.85rem', borderRadius: 20, border: '1px solid var(--glass-border)', fontSize: '0.78rem' }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} />
          <span style={{ color: 'var(--text-muted)' }}>Context Injected:</span>
          <strong style={{ color: 'var(--text-primary)' }}>{currencySymbol}{Number(netWorthTotal).toLocaleString()} NW</strong>
          <span style={{ color: 'var(--text-muted)' }}>·</span>
          <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{liquidMonths}mo Runway</span>
        </div>
      </div>

      {/* The 3 Agents Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, transparent 100%)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🚀</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>The Alpha Agent</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600 }}>Growth & Compounding Mandate</div>
            </div>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
            Maximizes long-term IRR, fights inflation erosion, and advocates opportunistic equity compounding over idle cash drag.
          </p>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, transparent 100%)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🛡️</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>The Citadel Agent</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--red)', fontWeight: 600 }}>Risk & Capital Preservation</div>
            </div>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
            Stress-tests drawdowns, defends a strict 6-month liquidity buffer, caps concentration risk, and prevents catastrophic ruin.
          </p>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, transparent 100%)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>⚖️</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>The Tax & Legal Agent</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--green)', fontWeight: 600 }}>Arbitrage & Compliance Mandate</div>
            </div>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
            Evaluates wash-sale locks, capital gains brackets, asset location efficiency, and statutory compliance ({market} rules).
          </p>
        </div>
      </div>

      {/* Query Selector Card */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 className="text-h3" style={{ margin: 0 }}>Select an Executive Dilemma or Ask Custom Question</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Institutional Grounding Engine</span>
        </div>

        {/* Preset scenario chips */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.6rem', marginBottom: '1.25rem' }}>
          {PRESET_SCENARIOS.map(sc => (
            <button
              key={sc.id}
              type="button"
              onClick={() => {
                setSelectedScenario(sc.id);
                setCustomQuestion(sc.question);
              }}
              style={{
                textAlign: 'left',
                background: selectedScenario === sc.id ? 'rgba(99, 102, 241, 0.15)' : 'var(--surface-raised)',
                border: `1px solid ${selectedScenario === sc.id ? 'var(--primary)' : 'var(--glass-border)'}`,
                borderRadius: 10,
                padding: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: 3 }}>
                <span>{sc.icon}</span>
                <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>{sc.title}</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{sc.category}</div>
            </button>
          ))}
        </div>

        {/* Textarea */}
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <textarea
            value={customQuestion}
            onChange={e => setCustomQuestion(e.target.value)}
            rows={3}
            placeholder="Describe your financial decision, dilemma or investment trade-off..."
            style={{
              width: '100%',
              background: 'var(--surface-raised)',
              border: '1px solid var(--glass-border)',
              borderRadius: 12,
              padding: '0.85rem 1rem',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Context Grounding: <strong>{user?.name || (market === 'IN' ? 'Arjun Sharma' : 'Alex Chen')}</strong> · <strong>{equityPct}% Equity</strong> · <strong>{liquidMonths}mo Liquid Reserve</strong>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleConveneCouncil(customQuestion)}
            disabled={debating || !customQuestion.trim()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.5rem',
              fontSize: '0.9rem',
              fontWeight: 700,
            }}
          >
            {debating ? (
              <>
                <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Council Debating in Real-Time...</span>
              </>
            ) : (
              <>
                <Users size={16} />
                <span>Convene Family Office Council</span>
              </>
            )}
          </button>
        </div>

        {/* Live Turn-Taking Simulation Stage Bar */}
        {debating && (
          <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(99, 102, 241, 0.08)', borderRadius: 10, border: '1px solid rgba(99, 102, 241, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {simulationStage === 1 && <span>🚀 Step 1: Alpha Agent analyzing opportunistic IRR compounding...</span>}
                {simulationStage === 2 && <span>🛡️ Step 2: Citadel Agent stress-testing downside & {liquidMonths}mo liquid buffer...</span>}
                {simulationStage === 3 && <span>⚖️ Step 3: Tax & Legal Agent structuring statutory compliance & capital gains...</span>}
                {simulationStage >= 4 && <span>🏛️ Synthesizing Family Office Consensus Action Memo...</span>}
              </div>
              <span className="badge badge-primary">Round {Math.min(3, simulationStage)} / 3</span>
            </div>
            <div className="progress-bar" style={{ height: 6 }}>
              <div className="progress-fill" style={{ width: `${Math.min(100, simulationStage * 33)}%`, transition: 'width 0.4s ease' }} />
            </div>
          </div>
        )}
      </div>

      {/* Council Debate Results Floor */}
      {councilResult && (
        <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Executive Verdict Banner */}
          <div
            className="card"
            style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span className="badge badge-green">Consensus Reached</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Committee Alignment Score: {councilResult.consensusScore}%
                </span>
              </div>

              {/* Action Buttons: Audio Narration & PDF Download */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handleToggleAudio}
                  title="Listen to Council Verdict Audio Narration"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  {isSpeaking ? <VolumeX size={14} color="var(--red)" /> : <Volume2 size={14} />}
                  <span>{isSpeaking ? 'Stop Audio' : '🔊 Listen to Verdict'}</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleDownloadPDF}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Download size={14} />
                  <span>Download Council Memo (PDF)</span>
                </button>
              </div>
            </div>

            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
              {councilResult.verdict}
            </h2>

            {/* Live Conviction Alignment Gauge */}
            <div style={{ marginTop: '1rem', background: 'var(--surface)', padding: '0.75rem 1rem', borderRadius: 10, border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: 4 }}>
                <span style={{ color: 'var(--primary)' }}>Alpha Conviction: {councilResult.rounds?.[activeRoundTab]?.alpha?.conviction || 88}%</span>
                <span style={{ color: 'var(--red)' }}>Citadel Conviction: {councilResult.rounds?.[activeRoundTab]?.citadel?.conviction || 90}%</span>
                <span style={{ color: 'var(--green)' }}>Tax Conviction: {councilResult.rounds?.[activeRoundTab]?.tax?.conviction || 91}%</span>
              </div>
              <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ flex: councilResult.rounds?.[activeRoundTab]?.alpha?.conviction || 33, background: 'var(--primary)' }} />
                <div style={{ flex: councilResult.rounds?.[activeRoundTab]?.citadel?.conviction || 33, background: 'var(--red)' }} />
                <div style={{ flex: councilResult.rounds?.[activeRoundTab]?.tax?.conviction || 33, background: 'var(--green)' }} />
              </div>
            </div>
          </div>

          {/* 3-Round Debate Transcript */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <h3 className="text-h3" style={{ margin: 0 }}>Live 3-Round Council Debate Transcript</h3>
              
              {/* Round selector pills */}
              <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--surface-raised)', padding: 3, borderRadius: 20 }}>
                {councilResult.rounds.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveRoundTab(i)}
                    style={{
                      border: 'none',
                      background: activeRoundTab === i ? 'var(--primary)' : 'transparent',
                      color: activeRoundTab === i ? 'white' : 'var(--text-muted)',
                      borderRadius: 16,
                      padding: '0.25rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Round {r.roundNumber}: {r.topic.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Round Content */}
            {councilResult.rounds[activeRoundTab] && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                  Topic: {councilResult.rounds[activeRoundTab].topic}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  {/* Alpha Agent Card */}
                  <div style={{ background: 'var(--surface-raised)', borderRadius: 12, padding: '1rem', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--primary)' }}>🚀 Alpha Agent</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Conviction: {councilResult.rounds[activeRoundTab].alpha.conviction}%</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      "{councilResult.rounds[activeRoundTab].alpha.statement}"
                    </p>
                  </div>

                  {/* Citadel Agent Card */}
                  <div style={{ background: 'var(--surface-raised)', borderRadius: 12, padding: '1rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--red)' }}>🛡️ Citadel Agent</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Conviction: {councilResult.rounds[activeRoundTab].citadel.conviction}%</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      "{councilResult.rounds[activeRoundTab].citadel.statement}"
                    </p>
                  </div>

                  {/* Tax & Legal Agent Card */}
                  <div style={{ background: 'var(--surface-raised)', borderRadius: 12, padding: '1rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--green)' }}>⚖️ Tax & Legal Agent</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Conviction: {councilResult.rounds[activeRoundTab].tax.conviction}%</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      "{councilResult.rounds[activeRoundTab].tax.statement}"
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Synthesized Family Office Action Memo */}
          {councilResult.actionMemo && (
            <div className="card" style={{ padding: '1.75rem', border: '1px solid var(--primary)', background: 'var(--surface-raised)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Final Deliverable
                  </span>
                  <h3 className="text-h3" style={{ margin: '2px 0 0 0' }}>{councilResult.actionMemo.title}</h3>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {/* Route to Advisor for SEBI RIA Fiduciary Review */}
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleRouteToAdvisorQueue}
                    disabled={routedToAdvisor}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    {routedToAdvisor ? <CheckCircle2 size={14} color="#fff" /> : <ShieldCheck size={14} />}
                    <span>{routedToAdvisor ? 'Routed to Advisor' : '🏛️ Route to SEBI RIA Advisor'}</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setSavedToDossier(true)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    {savedToDossier ? <CheckCircle2 size={14} color="var(--green)" /> : <Bookmark size={14} />}
                    <span>{savedToDossier ? 'Saved to Dossier' : 'Save to Dossier'}</span>
                  </button>
                </div>
              </div>

              {/* Success Notification after routing to advisor queue */}
              {routedToAdvisor && (
                <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid var(--green)', borderRadius: 10, padding: '0.85rem 1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <CheckCircle2 size={18} color="var(--green)" />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                        Council Recommendation Successfully Logged into SEBI RIA Fiduciary Queue
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Assigned to Principal Officer Meera Kapoor for statutory suitability review under SEBI Regulation 17.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate('/advisor/recommendations')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <span>View in Reco Queue</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              )}

              {/* Unanimous Recommendations */}
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  ✅ Unanimous Recommendations
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {councilResult.actionMemo.unanimousRecommendations.map((rec, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                      <CheckCircle2 size={15} style={{ color: 'var(--green)', flexShrink: 0, marginTop: 2 }} />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Steps Sequence */}
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  ⚡ Sequenced Execution Plan
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
                  {councilResult.actionMemo.actionSteps.map((step, i) => (
                    <div key={i} style={{ background: 'var(--surface)', borderRadius: 10, padding: '0.85rem', border: '1px solid var(--glass-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>{step.phase}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Lead: {step.owner}</span>
                      </div>
                      <div style={{ fontSize: '0.825rem', color: 'var(--text-primary)', fontWeight: 600 }}>{step.action}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Impact Footer */}
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: 10,
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div style={{ fontSize: '0.825rem', color: 'var(--green)', fontWeight: 700 }}>
                  💡 {councilResult.actionMemo.financialImpact}
                </div>
              </div>
            </div>
          )}

          {/* Interactive "Challenge the Council" Stress-Test Section */}
          <div className="card" style={{ padding: '1.5rem', border: '1px solid rgba(245, 158, 11, 0.35)', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.04) 0%, transparent 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.3rem' }}>⚡</span>
              <h3 className="text-h3" style={{ margin: 0 }}>Challenge the Council (Interactive Stress-Test)</h3>
              <span className="badge badge-gold">What-If Engine</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0' }}>
              Test the Council's consensus against severe market dislocations, rate shocks, or liquidity freezes.
            </p>

            {/* Quick Challenge Preset Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              {PRESET_CHALLENGES.map(ch => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => {
                    setChallengeInput(ch.text);
                    handleChallengeCouncil(ch.text);
                  }}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                >
                  {ch.label}
                </button>
              ))}
            </div>

            {/* Custom Challenge Input Box */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={challengeInput}
                onChange={e => setChallengeInput(e.target.value)}
                placeholder="Pose a custom curveball (e.g. What if interest rates drop 150 bps?)..."
                style={{
                  flex: 1,
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 10,
                  padding: '0.6rem 0.9rem',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem'
                }}
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleChallengeCouncil(challengeInput)}
                disabled={challenging || !challengeInput.trim()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
              >
                {challenging ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
                <span>Stress-Test</span>
              </button>
            </div>

            {/* Challenge Rebuttal Floor */}
            {challengeResult && (
              <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: 'rgba(99, 102, 241, 0.08)', borderRadius: 8, padding: '0.75rem 1rem', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>
                    Council Stress-Test Finding
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                    {challengeResult.rebuttalSummary}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
                  <div style={{ background: 'var(--surface-raised)', padding: '0.85rem', borderRadius: 10, border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.78rem', color: 'var(--primary)', marginBottom: 4 }}>🚀 Alpha Rebuttal</div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {challengeResult.alphaRebuttal}
                    </p>
                  </div>

                  <div style={{ background: 'var(--surface-raised)', padding: '0.85rem', borderRadius: 10, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.78rem', color: 'var(--red)', marginBottom: 4 }}>🛡️ Citadel Rebuttal</div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {challengeResult.citadelRebuttal}
                    </p>
                  </div>

                  <div style={{ background: 'var(--surface-raised)', padding: '0.85rem', borderRadius: 10, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.78rem', color: 'var(--green)', marginBottom: 4 }}>⚖️ Tax & Legal Rebuttal</div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {challengeResult.taxRebuttal}
                    </p>
                  </div>
                </div>

                {/* Contingency Trigger Rule */}
                {challengeResult.adjustedContingency && (
                  <div style={{ background: 'rgba(245, 158, 11, 0.08)', borderRadius: 8, padding: '0.65rem 0.9rem', border: '1px solid rgba(245, 158, 11, 0.25)', fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 600 }}>
                    ⚡ {challengeResult.adjustedContingency}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
