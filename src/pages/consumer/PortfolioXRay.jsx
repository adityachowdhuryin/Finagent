import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Search, AlertTriangle, CheckCircle, Layers } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#84cc16'];

export default function PortfolioXRay() {
  const { state } = useApp();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mfs = state.consumer?.holdings?.mutualFunds || [];

  useEffect(() => {
    if (mfs.length >= 2) runAnalysis();
  }, []);

  async function runAnalysis() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/xray/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mutualFunds: mfs.map(f => ({ name: f.name, value: f.value || 0 })) }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalysis(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Score color
  const scoreColor = !analysis ? 'var(--text-muted)' :
    analysis.diversificationScore >= 70 ? 'var(--green)' :
    analysis.diversificationScore >= 45 ? 'var(--gold)' : 'var(--red)';

  // Overlap color
  const overlapColor = pct => pct < 30 ? 'var(--green)' : pct < 60 ? 'var(--gold)' : 'var(--red)';

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 className="text-h1">🔬 Portfolio X-Ray</h1>
          <p className="text-sm text-secondary mt-1">See what's really inside your mutual funds — true stock exposure and hidden overlaps</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={runAnalysis} disabled={loading || mfs.length < 2}>
          {loading ? '⏳ Analyzing...' : '🔬 Run X-Ray'}
        </button>
      </div>

      {/* Not enough funds */}
      {mfs.length < 2 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Layers size={40} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
          <h2 style={{ marginBottom: '0.5rem' }}>Add at least 2 mutual funds</h2>
          <p className="text-sm text-secondary">X-Ray shows overlap between your funds. Add your mutual fund holdings in Portfolio to get started.</p>
        </div>
      )}

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.2)' }}>
          ⚠️ {error}
        </div>
      )}

      {analysis && (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            {[
              { label: 'Funds Analyzed', value: analysis.matchedCount + '/' + analysis.totalFunds, sub: 'of your holdings', color: 'var(--primary)' },
              { label: 'Unique Stocks', value: new Set(analysis.stockExposure.map(s => s.stock)).size + '+', sub: 'actual holdings', color: 'var(--text-primary)' },
              { label: 'Diversification', value: analysis.diversificationScore, sub: '/100', color: scoreColor },
              { label: 'Redundant Pairs', value: analysis.redundancyAlerts?.length || 0, sub: analysis.redundancyAlerts?.length ? 'need review' : 'all clear', color: analysis.redundancyAlerts?.length ? 'var(--red)' : 'var(--green)' },
            ].map(c => (
              <div key={c.label} className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{c.label}</div>
                <div style={{ fontFamily: 'Space Grotesk', fontSize: '2rem', fontWeight: 800, color: c.color, lineHeight: 1 }}>{c.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Redundancy alerts */}
          {analysis.redundancyAlerts?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {analysis.redundancyAlerts.map((alert, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.75rem', padding: '0.875rem 1rem', background: 'rgba(239,68,68,0.07)', borderRadius: 'var(--radius)', border: '1px solid rgba(239,68,68,0.2)', alignItems: 'flex-start' }}>
                  <AlertTriangle size={18} style={{ color: 'var(--red)', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{alert.overlap}% Overlap</div>
                    <div className="text-sm text-secondary" style={{ marginTop: 2 }}>{alert.message}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!analysis.redundancyAlerts?.length && (
            <div style={{ display: 'flex', gap: '0.75rem', padding: '0.875rem 1rem', background: 'rgba(16,185,129,0.07)', borderRadius: 'var(--radius)', border: '1px solid rgba(16,185,129,0.2)', alignItems: 'center' }}>
              <CheckCircle size={18} style={{ color: 'var(--green)', flexShrink: 0 }} />
              <span className="text-sm" style={{ color: 'var(--green)', fontWeight: 600 }}>No significant overlaps detected — your funds are well-diversified</span>
            </div>
          )}

          {/* Stock exposure bar chart */}
          <div className="card">
            <h3 className="text-h3" style={{ marginBottom: '1rem' }}>True Stock Exposure (Top 15)</h3>
            <p className="text-sm text-secondary" style={{ marginBottom: '1rem' }}>How much of your portfolio is in each stock across all funds combined</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={analysis.stockExposure.slice(0, 15)} layout="vertical" margin={{ left: 0, right: 40, top: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={v => v + '%'} />
                <YAxis type="category" dataKey="stock" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} width={130} />
                <Tooltip formatter={(v, n, props) => [v.toFixed(2) + '%', 'Portfolio Exposure']} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 8 }} />
                <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                  {analysis.stockExposure.slice(0, 15).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Overlap matrix */}
          {analysis.overlapMatrix?.length > 0 && (
            <div className="card">
              <h3 className="text-h3" style={{ marginBottom: '0.25rem' }}>Fund Overlap Matrix</h3>
              <p className="text-sm text-secondary" style={{ marginBottom: '1rem' }}>% of top-10 holdings shared between each pair of funds</p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: '0.8125rem', width: '100%' }}>
                  <tbody>
                    {analysis.overlapMatrix.map((row, i) => (
                      <tr key={i}>
                        <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.8rem' }}>
                          {row.fund1.split(' ').slice(0, 3).join(' ')} ↔ {row.fund2.split(' ').slice(0, 3).join(' ')}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', width: 80 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ flex: 1, height: 8, background: 'var(--surface-raised)', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: row.overlap + '%', background: overlapColor(row.overlap), borderRadius: 4, transition: 'width 0.5s' }} />
                            </div>
                            <span style={{ fontWeight: 700, color: overlapColor(row.overlap), fontFamily: 'Space Grotesk', fontSize: '0.875rem', flexShrink: 0 }}>{row.overlap}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Unmatched funds note */}
          {analysis.unmatched?.length > 0 && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.75rem', background: 'var(--surface)', borderRadius: 'var(--radius)' }}>
              ℹ️ These funds weren't in our database yet: {analysis.unmatched.join(', ')}. We're expanding the dataset monthly.
            </div>
          )}
        </>
      )}
    </div>
  );
}
