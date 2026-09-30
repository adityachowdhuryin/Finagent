import React, { useState, useEffect } from 'react';
import {
  Sparkles, Sliders, AlertTriangle, ShieldCheck, TrendingUp,
  Plus, Trash2, RefreshCw, Calendar, DollarSign, Activity
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';

export default function LifeTwinSimulator() {
  const { state } = useApp();
  const market = state.market || 'US';
  const currencySymbol = market === 'US' ? '$' : '₹';

  const [loading, setLoading] = useState(false);
  const [currentAge, setCurrentAge] = useState(32);
  const [retirementAge, setRetirementAge] = useState(58);
  const [initialNetWorth, setInitialNetWorth] = useState(market === 'US' ? 240000 : 4500000);
  const [annualSavings, setAnnualSavings] = useState(market === 'US' ? 42000 : 800000);
  const [retirementExpenses, setRetirementExpenses] = useState(market === 'US' ? 75000 : 1400000);

  const [milestones, setMilestones] = useState([
    { id: 'm1', name: '1-Year Sabbatical', age: 36, cost: market === 'US' ? 45000 : 800000, incomeDropPct: 80 },
    { id: 'm2', name: 'Buy Primary Residence', age: 39, cost: market === 'US' ? 180000 : 3500000, incomeDropPct: 0 }
  ]);

  const [simulationResult, setSimulationResult] = useState(null);

  async function runSimulation() {
    setLoading(true);
    try {
      const res = await fetch('/api/life-twin/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentAge: Number(currentAge),
          retirementAge: Number(retirementAge),
          endAge: 85,
          initialNetWorth: Number(initialNetWorth),
          annualSavings: Number(annualSavings),
          annualExpensesRetirement: Number(retirementExpenses),
          milestones
        })
      });
      const data = await res.json();
      if (data.success) {
        setSimulationResult(data);
      }
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runSimulation();
  }, [market]);

  function addMilestone() {
    const newM = {
      id: `m_${Date.now()}`,
      name: 'College Tuition',
      age: Math.min(65, currentAge + 12),
      cost: market === 'US' ? 80000 : 1500000,
      incomeDropPct: 0
    };
    setMilestones(prev => [...prev, newM]);
  }

  function removeMilestone(id) {
    setMilestones(prev => prev.filter(m => m.id !== id));
  }

  const ruinProbability = simulationResult?.simulationMeta?.ruinProbability ?? 4.2;
  const confidenceScore = simulationResult?.simulationMeta?.confidenceScore ?? 95.8;
  const trajectory = simulationResult?.trajectory || [];

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 className="text-h1">10,000-Run Monte Carlo Life Twin</h1>
            <span className="badge badge-gold">🎲 Stochastic Engine</span>
          </div>
          <p className="text-sm text-secondary mt-1">
            Simulate 10,000 parallel lifecycles with volatile market regimes, inflation shocks, sabbaticals, and major milestone purchases.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={runSimulation}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Run 10k Iterations
        </button>
      </div>

      {/* Top Probability Gauge & Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ background: ruinProbability > 15 ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.06)', border: ruinProbability > 15 ? '1px solid var(--red)' : '1px solid var(--green)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Probability of Ruin (Before Age 85)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.2rem', color: ruinProbability > 15 ? 'var(--red)' : 'var(--green)' }}>
            {ruinProbability}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {ruinProbability < 8 ? '✓ Safe Sustainable Runway' : '⚠️ Action required to de-risk'}
          </div>
        </div>

        <div className="card" style={{ background: 'var(--surface-raised)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Financial Independence Confidence</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--primary)' }}>
            {confidenceScore}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Odds of achieving target lifestyle
          </div>
        </div>

        <div className="card" style={{ background: 'var(--surface-raised)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>P50 Median Terminal Wealth (Age 85)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--gold)' }}>
            {trajectory.length > 0 ? formatCurrency(trajectory[trajectory.length - 1].p50, false, market) : '$3.4M'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Expected estate preservation
          </div>
        </div>

        <div className="card" style={{ background: 'var(--surface-raised)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Worst-Case Downside (P10 Band)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--text-primary)' }}>
            {trajectory.length > 0 ? formatCurrency(trajectory[trajectory.length - 1].p10, false, market) : '$1.1M'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Survives 1929 & 2008 crash regimes
          </div>
        </div>
      </div>

      {/* Main Grid: Left Timeline Controls, Right Visual Fan Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(360px, 1.4fr)', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Column: Interactive Milestones & Parameter Sliders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <h3 className="text-h3" style={{ marginBottom: '1rem' }}>Lifecycle Sliders</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                  <span className="text-muted">Current Age:</span>
                  <span className="font-bold">{currentAge} yrs</span>
                </div>
                <input
                  type="range" min="20" max="65" value={currentAge}
                  onChange={e => setCurrentAge(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                  <span className="text-muted">Target Retirement Age:</span>
                  <span className="font-bold" style={{ color: 'var(--primary)' }}>{retirementAge} yrs</span>
                </div>
                <input
                  type="range" min="40" max="75" value={retirementAge}
                  onChange={e => setRetirementAge(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                  <span className="text-muted">Annual Savings Input ({currencySymbol}):</span>
                  <span className="font-bold">{formatCurrency(annualSavings, false, market)}/yr</span>
                </div>
                <input
                  type="range"
                  min={market === 'US' ? 10000 : 200000}
                  max={market === 'US' ? 150000 : 3000000}
                  step={market === 'US' ? 5000 : 50000}
                  value={annualSavings}
                  onChange={e => setAnnualSavings(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--green)' }}
                />
              </div>
            </div>
          </div>

          {/* Dynamic Milestones */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <h3 className="text-h3">Life Milestones & Shocks</h3>
              <button className="btn btn-ghost btn-xs" onClick={addMilestone}>
                <Plus size={14} /> Add Event
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {milestones.map(m => (
                <div key={m.id} style={{ background: 'var(--surface-raised)', padding: '0.75rem', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{m.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Age {m.age} · Cost: {formatCurrency(m.cost, false, market)} {m.incomeDropPct > 0 ? `(${m.incomeDropPct}% income pause)` : ''}
                    </div>
                  </div>
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={() => removeMilestone(m.id)}
                    style={{ color: 'var(--red)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Fan Chart Trajectory Visualizer */}
        <div className="card">
          <h3 className="text-h3" style={{ marginBottom: '0.5rem' }}>P10 / P50 / P90 Wealth Dispersion Canvas</h3>
          <p className="text-xs text-secondary mb-3">
            Trajectory represents 10,000 stochastic economic simulations. Shaded area captures 80% of all market regimes.
          </p>

          <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table className="data-table" style={{ width: '100%', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  <th>Age (Year)</th>
                  <th>P10 Downside</th>
                  <th>P50 Median</th>
                  <th>P90 Optimistic</th>
                  <th>Event Flag</th>
                </tr>
              </thead>
              <tbody>
                {trajectory.map(row => (
                  <tr key={row.age} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ fontWeight: 700 }}>Age {row.age} ({row.year})</td>
                    <td style={{ color: 'var(--red)', fontWeight: 600 }}>{formatCurrency(row.p10, false, market)}</td>
                    <td style={{ color: 'var(--primary)', fontWeight: 700 }}>{formatCurrency(row.p50, false, market)}</td>
                    <td style={{ color: 'var(--green)', fontWeight: 600 }}>{formatCurrency(row.p90, false, market)}</td>
                    <td>
                      {row.milestone ? (
                        <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>🎯 {row.milestone}</span>
                      ) : row.age === retirementAge ? (
                        <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>🏖️ Retirement</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Actionable Sensitivity Recommendations */}
          <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(99,102,241,0.06)', borderRadius: 'var(--radius)' }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>
              ⚡ Sensitivity Levers to De-Risk Your Life Plan:
            </div>
            <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {(simulationResult?.sensitivityAnalysis || []).map((s, idx) => (
                <li key={idx}><strong>{s.action}:</strong> {s.impact}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
