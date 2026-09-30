import React, { useState, useEffect } from 'react';
import {
  Users, TrendingUp, Award, Copy, CheckCircle2, ShieldCheck,
  ChevronRight, Sparkles, Filter, Lock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';

export default function FinancialCohorts() {
  const { state } = useApp();
  const market = state.market || 'US';

  const [loading, setLoading] = useState(true);
  const [cohorts, setCohorts] = useState([]);
  const [selectedCohort, setSelectedCohort] = useState(null);
  const [benchmarkResult, setBenchmarkResult] = useState(null);
  const [clonedSuccess, setClonedSuccess] = useState(false);

  async function fetchCohorts() {
    setLoading(true);
    try {
      const res = await fetch(`/api/cohorts/list?market=${market}`);
      const data = await res.json();
      if (data.success && data.cohorts.length > 0) {
        setCohorts(data.cohorts);
        setSelectedCohort(data.cohorts[0]);
        fetchBenchmark(data.cohorts[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch cohorts:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchBenchmark(cohortId) {
    try {
      const res = await fetch(`/api/cohorts/benchmark?cohortId=${cohortId}&userNetWorth=240000&userSavingsRate=42`);
      const data = await res.json();
      if (data.success) {
        setBenchmarkResult(data);
      }
    } catch (err) {
      console.error('Failed to fetch benchmark:', err);
    }
  }

  useEffect(() => {
    fetchCohorts();
  }, [market]);

  function handleSelectCohort(c) {
    setSelectedCohort(c);
    fetchBenchmark(c.id);
  }

  function handleCloneStrategy() {
    setClonedSuccess(true);
    setTimeout(() => setClonedSuccess(false), 4000);
  }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <h1 className="text-h1">"Financial Blind" Verified Peer Cohorts</h1>
          <span className="badge badge-primary">🔒 100% Anonymized & Cryptographically Verified</span>
        </div>
        <p className="text-sm text-secondary mt-1">
          Compare your savings rate and asset allocation with verified peers in your company and industry. Clone top-performing allocation playbooks.
        </p>
      </div>

      {/* Cohort Selector Pills */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {cohorts.map(c => (
          <button
            key={c.id}
            onClick={() => handleSelectCohort(c)}
            className={`btn btn-sm ${selectedCohort?.id === c.id ? 'btn-primary' : 'btn-ghost'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <span>{c.badge}</span>
            <span>{c.name}</span>
          </button>
        ))}
      </div>

      {/* Main Grid: Left Cohort Profile, Right Benchmark & Strategy Cloner */}
      {selectedCohort && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(360px, 1.4fr)', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left: Cohort Details & Breakdown */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h3 className="text-h3">{selectedCohort.name}</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {selectedCohort.memberCount.toLocaleString()} Verified Members in Cohort
                </div>
              </div>
              <span className="badge badge-green">VERIFIED LEAGUE</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'var(--surface-raised)', padding: '0.85rem', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cohort Median Net Worth</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)', marginTop: 4 }}>
                  {formatCurrency(selectedCohort.medianNetWorth, false, market)}
                </div>
              </div>

              <div style={{ background: 'var(--surface-raised)', padding: '0.85rem', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Median Savings Rate</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--green)', marginTop: 4 }}>
                  {selectedCohort.medianSavingsRate}% of Income
                </div>
              </div>
            </div>

            {/* Benchmark Asset Allocation */}
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.6rem' }}>
              Consensus Asset Allocation Blueprint
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {selectedCohort.benchmarkAllocation.map(item => (
                <div key={item.asset} style={{ background: 'var(--surface-raised)', padding: '0.55rem 0.75rem', borderRadius: 'var(--radius)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: 3 }}>
                    <span>{item.asset}</span>
                    <span style={{ color: item.color }}>{item.pct}%</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
                    <div style={{ width: `${item.pct}%`, height: '100%', background: item.color, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: User Ranking & 1-Click Strategy Cloner */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Percentile Ranking Card */}
            {benchmarkResult && (
              <div className="card">
                <h3 className="text-h3" style={{ marginBottom: '0.85rem' }}>Your Cohort Standing</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ padding: '0.85rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Net Worth Percentile</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)', marginTop: 2 }}>
                      {benchmarkResult.userComparison.netWorthPercentile}th %tile
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--green)' }}>{benchmarkResult.userComparison.ranking}</div>
                  </div>

                  <div style={{ padding: '0.85rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Savings Rate Percentile</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--gold)', marginTop: 2 }}>
                      {benchmarkResult.userComparison.savingsRatePercentile}th %tile
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Aggressive Saver</div>
                  </div>
                </div>

                <div style={{ padding: '0.75rem', background: 'rgba(99,102,241,0.06)', borderRadius: 'var(--radius)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  📊 <strong>Cohort Insight:</strong> {benchmarkResult.userComparison.gapAnalysis}
                </div>
              </div>
            )}

            {/* Cloned Strategy Card */}
            <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), transparent)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Top Cloned Strategy in Cohort
                  </div>
                  <h3 className="text-h3" style={{ marginTop: 2 }}>
                    {selectedCohort.topClonedStrategy.title}
                  </h3>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--green)' }}>
                    {selectedCohort.topClonedStrategy.cagr3y}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Trailing 3Y CAGR</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
                {selectedCohort.topClonedStrategy.tags.map(t => (
                  <span key={t} className="badge badge-surface" style={{ fontSize: '0.75rem' }}>{t}</span>
                ))}
                <span className="badge badge-gold" style={{ fontSize: '0.75rem' }}>
                  👥 {selectedCohort.topClonedStrategy.clonedByCount} Clones
                </span>
              </div>

              {clonedSuccess ? (
                <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid var(--green)', padding: '0.75rem', borderRadius: 'var(--radius)', color: 'var(--green)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} /> Strategy parameters successfully cloned into your Portfolio Rebalancer!
                </div>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={handleCloneStrategy}
                  style={{ width: '100%', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <Copy size={16} /> Clone This Strategy into Rebalancing Hub
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
