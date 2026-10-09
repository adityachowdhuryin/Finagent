import React, { useState } from 'react';
import {
  Users, Sparkles, Shield, TrendingUp, Scale, AlertTriangle,
  ArrowRight, CheckCircle2, Bookmark, Download, RefreshCw, Send,
  Cpu, Flame, Heart
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

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

export default function CouncilHub() {
  const { state, isUSMarket } = useApp();
  const { currentUser, userProfile } = useAuth();

  const market = state?.activeMarket || (isUSMarket ? 'US' : 'IN');
  const currencySymbol = market === 'IN' ? '₹' : '$';

  const [selectedScenario, setSelectedScenario] = useState(PRESET_SCENARIOS[0].id);
  const [customQuestion, setCustomQuestion] = useState(PRESET_SCENARIOS[0].question);
  const [debating, setDebating] = useState(false);
  const [councilResult, setCouncilResult] = useState(null);
  const [activeRoundTab, setActiveRoundTab] = useState(0);
  const [savedToDossier, setSavedToDossier] = useState(false);

  async function handleConveneCouncil(questionText) {
    const q = (questionText || customQuestion).trim();
    if (!q || debating) return;

    setDebating(true);
    setCouncilResult(null);
    setSavedToDossier(false);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/council/debate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          scenario: selectedScenario,
          userProfile: {
            name: state?.consumer?.user?.name || userProfile?.name || (market === 'IN' ? 'Arjun Sharma' : 'Alex Chen'),
            age: state?.consumer?.user?.age || 35,
            city: state?.consumer?.user?.city || (market === 'IN' ? 'Bangalore' : 'San Francisco'),
            income: state?.consumer?.user?.income || (market === 'IN' ? 1800000 : 285000),
            riskProfile: state?.consumer?.user?.riskProfile || 'Moderate',
            market
          },
          portfolioSummary: {
            netWorth: state?.consumer?.netWorth?.total || (market === 'IN' ? 12487320 : 842500),
            holdings: state?.consumer?.holdings || {}
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
      setDebating(false);
    }
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
        <h3 className="text-h3" style={{ marginBottom: '1rem' }}>Select an Executive Dilemma or Ask Custom Question</h3>
        
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
            Context Injected: <strong>{state?.consumer?.user?.name || (market === 'IN' ? 'Arjun Sharma' : 'Alex Chen')}</strong> · Net Worth: <strong>{currencySymbol}{(state?.consumer?.netWorth?.total || (market === 'IN' ? 12487320 : 842500)).toLocaleString()}</strong>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-green">Consensus Reached</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Committee Alignment Score: {councilResult.consensusScore}%
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>

            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: 'var(--text-primary)' }}>
              {councilResult.verdict}
            </h2>
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

                <div style={{ display: 'flex', gap: '0.5rem' }}>
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
        </div>
      )}
    </div>
  );
}
