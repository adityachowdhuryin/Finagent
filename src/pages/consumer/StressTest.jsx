import React, { useState, useEffect } from 'react';
import {
  CloudLightning, AlertTriangle, ShieldCheck, TrendingDown,
  ArrowRight, Shield, RefreshCw, Sparkles, Activity, Clock
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { useApp } from '../../context/AppContext';

const SCENARIOS = [
  { id: 'crash_2008', title: '2008 Liquidity Shock', severity: 'SEVERE', icon: '📉', tag: 'Systemic Crisis' },
  { id: 'job_loss', title: '12-Month Job Loss', severity: 'HIGH', icon: '💼', tag: 'Cashflow Shock' },
  { id: 'tech_winter', title: 'Tech & Startup Winter', severity: 'MODERATE', icon: '❄️', tag: 'Sector Plunge' },
  { id: 'rate_spike', title: 'Oil $130 & Inflation Spike', severity: 'HIGH', icon: '🛢️', tag: 'Macro Shock' },
];

export default function StressTest() {
  const { state } = useApp();
  const [selectedScenario, setSelectedScenario] = useState('crash_2008');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const holdings = state.consumer?.holdings || {};
  const totalEquities = (holdings.equities || []).reduce((s, e) => s + (e.value || 0), 0) || 1250000;
  const totalMF = (holdings.mutualFunds || []).reduce((s, m) => s + (m.value || 0), 0) || 880000;
  const totalFD = (holdings.fixedDeposits || []).reduce((s, f) => s + (f.amount || 0), 0) || 300000;
  const netWorth = state.consumer?.netWorth?.total || (totalEquities + totalMF + totalFD);

  useEffect(() => {
    runSimulation(selectedScenario);
  }, [selectedScenario]);

  async function runSimulation(scId = selectedScenario) {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/stress-test/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: scId,
          totalNetWorth: netWorth,
          equities: totalEquities,
          mutualFunds: totalMF,
          fixedDeposits: totalFD,
          monthlyBurn: 75000,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setData(result);
      }
    } catch (e) {
      console.error('Stress test simulation failed:', e);
    } finally {
      setLoading(false);
    }
  }

  const formatINR = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.75rem' }}>⛈️</span>
            <h1 className="text-h1">AI "Black Swan" Crisis Simulator & Stress-Tester</h1>
          </div>
          <p className="text-sm text-secondary">
            Simulate how your portfolio and family survival runway hold up against market shocks, layoffs, and inflation spikes.
          </p>
        </div>

        <button
          onClick={() => runSimulation(selectedScenario)}
          disabled={loading}
          className="btn btn-ghost btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          {loading ? 'Simulating...' : 'Re-run Simulation'}
        </button>
      </div>

      {/* Scenario Picker Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.875rem' }}>
        {SCENARIOS.map(sc => {
          const isSelected = sc.id === selectedScenario;
          return (
            <div
              key={sc.id}
              onClick={() => setSelectedScenario(sc.id)}
              className="card"
              style={{
                cursor: 'pointer',
                border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--glass-border)'}`,
                background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--surface)',
                boxShadow: isSelected ? '0 0 20px rgba(99, 102, 241, 0.2)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{sc.icon}</span>
                <span className={`badge ${sc.severity === 'SEVERE' ? 'badge-red' : 'badge-gold'}`} style={{ fontSize: '0.65rem' }}>
                  {sc.severity}
                </span>
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>
                {sc.title}
              </div>
              <div className="text-xs text-muted" style={{ marginTop: 2 }}>{sc.tag}</div>
            </div>
          );
        })}
      </div>

      {data && (
        <>
          {/* Top Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="card" style={{ borderLeft: '4px solid var(--red)' }}>
              <div className="text-xs text-muted" style={{ textTransform: 'uppercase' }}>Projected Max Drawdown</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--red)', marginTop: 4 }}>
                -{data.metrics.maxDrawdownPct}%
              </div>
              <div className="text-xs text-secondary" style={{ marginTop: 2 }}>
                Portfolio drops by {formatINR(data.metrics.absoluteDrawdown)}
              </div>
            </div>

            <div className="card">
              <div className="text-xs text-muted" style={{ textTransform: 'uppercase' }}>Trough Portfolio Value</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: 'var(--gold)', marginTop: 4 }}>
                {formatINR(data.metrics.troughNetWorth)}
              </div>
              <div className="text-xs text-secondary" style={{ marginTop: 2 }}>
                Lowest point expected at Month 6
              </div>
            </div>

            <div className="card" style={{ borderLeft: '4px solid var(--green)' }}>
              <div className="text-xs text-muted" style={{ textTransform: 'uppercase' }}>Emergency Survival Runway</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--green)', marginTop: 4 }}>
                {data.metrics.emergencyRunwayMonths} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Months</span>
              </div>
              <div className="text-xs text-secondary" style={{ marginTop: 2 }}>
                At {formatINR(data.metrics.monthlyBurn)}/mo non-discretionary burn
              </div>
            </div>
          </div>

          {/* Drawdown Trajectory Chart */}
          <div className="card">
            <h3 className="text-h3" style={{ marginBottom: '0.25rem' }}>12-Month Drawdown & Rebound Trajectory</h3>
            <p className="text-xs text-secondary" style={{ marginBottom: '1rem' }}>
              Projected net worth behavior from initial crisis shock through trough to partial market recovery.
            </p>

            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trajectory} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} />
                  <Tooltip
                    formatter={val => [formatINR(val), 'Projected Value']}
                    contentStyle={{ background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, fontSize: '0.85rem' }}
                  />
                  <ReferenceLine y={data.metrics.currentNetWorth} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Baseline', fill: '#10b981', fontSize: 11 }} />
                  <Area type="monotone" dataKey="portfolioValue" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#stressGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Hedging Prescription Card */}
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), var(--surface))',
            border: '1px solid rgba(99, 102, 241, 0.3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <ShieldCheck size={18} style={{ color: 'var(--primary)' }} />
              <h3 className="text-h3">Personalized AI Hedging Prescription</h3>
            </div>
            <p className="text-sm text-secondary" style={{ lineHeight: 1.6 }}>
              {data.scenario.hedgingPrescription}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
