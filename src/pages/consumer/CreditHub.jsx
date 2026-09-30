// src/pages/consumer/CreditHub.jsx
// Institutional Credit Bureau Engine (US FICO 300–850 & Indian CIBIL 300–900), Interactive Simulator, and Snowball vs Avalanche Debt Engine

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, AlertCircle, ArrowUpRight, TrendingUp, Sliders,
  CreditCard, Calendar, Flame, Sparkles, CheckCircle2, ChevronRight,
  Info, RefreshCw, Layers
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function CreditHub() {
  const { state, isUSMarket } = useApp();
  const [loading, setLoading] = useState(true);
  const [creditData, setCreditData] = useState(null);

  // Simulator state
  const [simAction, setSimAction] = useState('PAY_DOWN_DEBT');
  const [simAmount, setSimAmount] = useState(isUSMarket ? 3500 : 75000);
  const [simulationResult, setSimulationResult] = useState(null);
  const [simulating, setSimulating] = useState(false);

  // Debt Strategy state
  const [extraPayment, setExtraPayment] = useState(isUSMarket ? 500 : 15000);
  const [debtStrategy, setDebtStrategy] = useState(null);
  const [activeStrategyView, setActiveStrategyView] = useState('avalanche'); // 'avalanche' | 'snowball'

  const market = isUSMarket ? 'US' : 'IN';
  const currencySymbol = isUSMarket ? '$' : '₹';

  const fetchScoreAndDebts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/credit/score?market=${market}`);
      const data = await res.json();
      if (data.success) {
        setCreditData(data);
        runDebtCalculation(data.accounts, extraPayment);
      }
    } catch (err) {
      console.error('Failed to load credit report:', err);
    } finally {
      setLoading(false);
    }
  };

  const runDebtCalculation = async (accounts, extra) => {
    if (!accounts || accounts.length === 0) return;
    try {
      const res = await fetch('/api/credit/debt-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debts: accounts,
          extraMonthlyPayment: extra,
          currency: currencySymbol
        })
      });
      const data = await res.json();
      if (data.success) {
        setDebtStrategy(data);
      }
    } catch (err) {
      console.error('Failed to compute debt strategy:', err);
    }
  };

  const handleSimulate = async () => {
    if (!creditData) return;
    setSimulating(true);
    try {
      const res = await fetch('/api/credit/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market,
          currentScore: creditData.score,
          action: simAction,
          amount: Number(simAmount)
        })
      });
      const data = await res.json();
      if (data.success) {
        setSimulationResult(data);
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimulating(false);
    }
  };

  useEffect(() => {
    fetchScoreAndDebts();
  }, [isUSMarket]);

  useEffect(() => {
    if (creditData?.accounts) {
      runDebtCalculation(creditData.accounts, extraPayment);
    }
  }, [extraPayment]);

  // Score circular gauge computation
  const minScore = isUSMarket ? 300 : 300;
  const maxScore = isUSMarket ? 850 : 900;
  const currentScore = creditData?.score || 780;
  const scorePercent = Math.min(Math.max(((currentScore - minScore) / (maxScore - minScore)) * 100, 0), 100);

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(59,130,246,0.06) 100%)',
        border: '1px solid rgba(99,102,241,0.3)',
        padding: '1.75rem',
        borderRadius: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-primary">Institutional Bureau Gateway</span>
              <span className="badge badge-green">Direct Bureau Feed</span>
            </div>
            <h1 className="text-h1" style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              {isUSMarket ? 'FICO® Score 8 & Credit Health OS' : 'CIBIL Bureau Score & Credit Health'}
            </h1>
            <p className="text-secondary" style={{ marginTop: '0.25rem', maxWidth: 640 }}>
              Monitor your official credit standing, run predictive scenarios before making major financial moves, and optimize debt payoff via mathematical Avalanche or Snowball models.
            </p>
          </div>

          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--glass-border)',
            borderRadius: 12,
            padding: '1rem 1.25rem',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bureau Source</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              {creditData?.bureau || (isUSMarket ? 'Experian / FICO 8' : 'TransUnion CIBIL')}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              Updated {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Main Score Display & Bureau Factors */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Score Dial Card */}
        <div className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '1rem' }}>
            OFFICIAL CREDIT STANDING
          </div>

          <div style={{
            position: 'relative',
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: `conic-gradient(var(--green) ${scorePercent * 3.6}deg, var(--surface-raised) 0deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 40px rgba(16,185,129,0.15)'
          }}>
            <div style={{
              width: 170,
              height: 170,
              borderRadius: '50%',
              background: 'var(--surface)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{ fontSize: '2.75rem', fontWeight: 900, fontFamily: 'Space Grotesk', lineHeight: 1 }}>
                {creditData?.score || 780}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--green)', fontWeight: 700, marginTop: 4 }}>
                {creditData?.tier || 'Excellent'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Scale: {minScore}–{maxScore}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--green)', fontWeight: 600, fontSize: '0.85rem' }}>
            <ArrowUpRight size={16} />
            <span>+{creditData?.changeLastMonth || 8} points vs last month</span>
          </div>

          <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Qualifies for top-tier prime lending rates (30-yr mortgage / low-APR auto).
          </div>
        </div>

        {/* 5 Bureau Factors */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <h3 className="text-h3" style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={18} color="var(--primary)" /> Bureau Impact Factors
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {(creditData?.factors || []).map((factor, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 10,
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{factor.name}</span>
                    <span className="badge badge-surface" style={{ fontSize: '0.65rem' }}>{factor.weight}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {factor.detail}
                  </div>
                </div>

                <span className="badge badge-green" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                  {factor.rating}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Credit Score Simulator */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 className="text-h3" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sliders size={20} color="var(--primary)" /> What-If Credit Score Simulator
            </h3>
            <p className="text-sm text-secondary" style={{ marginTop: 2 }}>
              Simulate how actions affect your bureau rating before executing.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              Select Hypothetical Scenario
            </label>
            <select
              value={simAction}
              onChange={(e) => setSimAction(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--surface-raised)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius)',
                padding: '0.625rem 0.875rem',
                color: 'var(--text-primary)',
                fontWeight: 600
              }}
            >
              <option value="PAY_DOWN_DEBT">Pay Down Revolving Balance</option>
              <option value="INCREASE_CREDIT_LIMIT">Request Credit Limit Increase</option>
              <option value="OPEN_NEW_CREDIT_LINE">Apply for New Credit Card</option>
              <option value="CLOSE_OLDEST_CARD">Close Oldest Credit Card</option>
              <option value="MISS_PAYMENT_30_DAYS">Miss 30-Day Payment</option>
            </select>

            {simAction === 'PAY_DOWN_DEBT' && (
              <div style={{ marginTop: '1rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Payoff Amount: {currencySymbol}{Number(simAmount).toLocaleString()}
                </label>
                <input
                  type="range"
                  min={isUSMarket ? 500 : 10000}
                  max={isUSMarket ? 10000 : 250000}
                  step={isUSMarket ? 500 : 10000}
                  value={simAmount}
                  onChange={(e) => setSimAmount(e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>
            )}

            <button
              className="btn btn-primary"
              onClick={handleSimulate}
              disabled={simulating}
              style={{ marginTop: '1.25rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 700 }}
            >
              {simulating ? <RefreshCw className="spin" size={16} /> : <Sparkles size={16} />}
              {simulating ? 'Calculating Bureau Impact…' : 'Simulate Score Delta'}
            </button>
          </div>

          {/* Simulation Output Card */}
          <div style={{
            background: simulationResult ? (simulationResult.delta >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)') : 'var(--surface-raised)',
            border: `1px solid ${simulationResult ? (simulationResult.delta >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)') : 'var(--glass-border)'}`,
            borderRadius: 12,
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            {simulationResult ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Projected Score</span>
                  <span style={{
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    color: simulationResult.delta >= 0 ? 'var(--green)' : 'var(--red)'
                  }}>
                    {simulationResult.delta >= 0 ? `+${simulationResult.delta}` : simulationResult.delta} pts
                  </span>
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'Space Grotesk', marginTop: 4 }}>
                  {simulationResult.projectedScore}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '0.5rem', lineHeight: 1.4 }}>
                  {simulationResult.rationale}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  {simulationResult.advice}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <Sliders size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                <div style={{ fontSize: '0.875rem' }}>Select a scenario and click Simulate to preview the impact on your score.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Debt Avalanche vs. Snowball Engine */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 className="text-h3" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Flame size={20} color="var(--primary)" /> Debt Payoff Engine: Avalanche vs. Snowball
            </h3>
            <p className="text-sm text-secondary" style={{ marginTop: 2 }}>
              Mathematically eliminates high-interest credit lines.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className={`btn btn-sm ${activeStrategyView === 'avalanche' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveStrategyView('avalanche')}
            >
              Avalanche (Max Savings)
            </button>
            <button
              className={`btn btn-sm ${activeStrategyView === 'snowball' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveStrategyView('snowball')}
            >
              Snowball (Quick Wins)
            </button>
          </div>
        </div>

        {/* Extra Monthly Payment Slider */}
        <div style={{
          background: 'var(--surface-raised)',
          borderRadius: 12,
          padding: '1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ fontWeight: 600 }}>Accelerated Monthly Paydown Budget</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Extra monthly cash flow allocated on top of required minimum payments
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 260 }}>
            <input
              type="range"
              min={isUSMarket ? 100 : 5000}
              max={isUSMarket ? 3000 : 75000}
              step={isUSMarket ? 50 : 2500}
              value={extraPayment}
              onChange={(e) => setExtraPayment(Number(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--primary)' }}
            />
            <div style={{ fontWeight: 800, fontSize: '1.1rem', minWidth: 80, textAlign: 'right' }}>
              +{currencySymbol}{extraPayment.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Comparison Result Cards */}
        {debtStrategy && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div style={{
              background: activeStrategyView === 'avalanche' ? 'rgba(99,102,241,0.08)' : 'var(--surface-raised)',
              border: `1px solid ${activeStrategyView === 'avalanche' ? 'var(--primary)' : 'var(--glass-border)'}`,
              borderRadius: 12,
              padding: '1.25rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-primary">Mathematical Winner</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--green)', fontWeight: 700 }}>
                  Saves {currencySymbol}{debtStrategy.avalanche.savingsVsSnowball.toLocaleString()} in interest
                </span>
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '0.5rem' }}>Debt Avalanche</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: 'Space Grotesk', marginTop: 4 }}>
                {debtStrategy.avalanche.monthsToPayoff} Months
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                Total Interest Paid: {currencySymbol}{debtStrategy.avalanche.totalInterest.toLocaleString()}
              </div>

              <div style={{ marginTop: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Priority Payoff Order:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {debtStrategy.avalanche.priorityOrder.map((item, i) => (
                    <div key={i} style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: 'var(--primary)', fontWeight: 700 }}>#{i + 1}</span> {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{
              background: activeStrategyView === 'snowball' ? 'rgba(99,102,241,0.08)' : 'var(--surface-raised)',
              border: `1px solid ${activeStrategyView === 'snowball' ? 'var(--primary)' : 'var(--glass-border)'}`,
              borderRadius: 12,
              padding: '1.25rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-surface">Psychological Momentum</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Earliest Account Closures</span>
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '0.5rem' }}>Debt Snowball</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: 'Space Grotesk', marginTop: 4 }}>
                {debtStrategy.snowball.monthsToPayoff} Months
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                Total Interest Paid: {currencySymbol}{debtStrategy.snowball.totalInterest.toLocaleString()}
              </div>

              <div style={{ marginTop: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Priority Payoff Order:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {debtStrategy.snowball.priorityOrder.map((item, i) => (
                    <div key={i} style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: 'var(--primary)', fontWeight: 700 }}>#{i + 1}</span> {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
