import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import HealthScoreRing from '../../components/cards/HealthScoreRing';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function HealthScore() {
  const { state } = useApp();
  const { healthScore } = state.consumer;
  const navigate = useNavigate();

  function scoreColor(s) {
    if (s >= 75) return 'var(--green)';
    if (s >= 55) return 'var(--gold)';
    return 'var(--red)';
  }

  function badgeClass(s) {
    if (s >= 75) return 'badge-green';
    if (s >= 55) return 'badge-gold';
    return 'badge-red';
  }

  const components = healthScore?.components || [];
  const history = healthScore?.history || [];
  const improvements = healthScore?.improvements || [];
  const overall = healthScore?.overall ?? 0;
  const percentile = healthScore?.percentile ?? 0;
  const grade = healthScore?.grade || '—';

  if (healthScore?.empty) {
    return (
      <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <h1 className="text-h1">Financial Health Score</h1>
          <p className="text-sm text-secondary mt-1">Composite score across 5 dimensions of your financial health</p>
        </div>
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
          <h2>Add your first asset to get your Health Score</h2>
          <p>Your score is computed from real holdings, goals, and income data.</p>
          <button onClick={() => navigate('/app/portfolio')} style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', padding: '0.6rem 1.5rem', cursor: 'pointer', fontWeight: 600, marginTop: '1rem' }}>Add Holdings →</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h1 className="text-h1">Financial Health Score</h1>
        <p className="text-sm text-secondary mt-1">Composite score across 5 dimensions of your financial health</p>
      </div>

      <div className="card" style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap', background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04))' }}>
        <HealthScoreRing score={overall} size={200} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Space Grotesk', fontSize: '2.5rem', fontWeight: 700, color: scoreColor(overall), lineHeight: 1 }}>{overall}</div>
          <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>{grade}</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Better than <strong>{percentile}%</strong> of FinAgent users
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {components.slice(0, 3).map(c => (
              <span key={c.name} className={`badge ${badgeClass(c.score)}`}>
                {c.name.split(' ')[0]}: {c.score >= 75 ? 'Good' : c.score >= 55 ? 'Fair' : 'Poor'}
              </span>
            ))}
          </div>
        </div>
      </div>

      {components.length > 0 && (
        <div>
          <h2 className="text-h2" style={{ marginBottom: '0.75rem' }}>Score Breakdown</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.875rem' }}>
            {components.map(c => (
              <div key={c.name} className="card" style={{ borderTop: `3px solid ${scoreColor(c.score)}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.25rem', color: scoreColor(c.score) }}>{c.score}</div>
                </div>
                <div className="progress-bar" style={{ marginBottom: '0.625rem' }}>
                  <div className="progress-fill" style={{ width: `${c.score}%`, background: scoreColor(c.score) }} />
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{c.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {history.length > 0 ? (
        <div className="card">
          <h2 className="text-h2" style={{ marginBottom: '1rem' }}>12-Month Trend</h2>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[50, 100]} tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }} />
              <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2.5} dot={{ fill: 'var(--primary)', strokeWidth: 0, r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📈</div>
          <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Trend chart will appear here</div>
          <div style={{ fontSize: '0.875rem' }}>Your score history builds up over time as you use FinAgent</div>
        </div>
      )}

      {improvements.length > 0 && (
        <div className="card">
          <h2 className="text-h2" style={{ marginBottom: '0.75rem' }}>Top Actions to Improve Your Score</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {improvements.map((imp, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-glow)', border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--primary-light)', fontSize: '0.875rem', flexShrink: 0 }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{imp.action}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{imp.cost}</div>
                </div>
                <span className={`badge ${imp.impact === 'High' || String(imp.impact || '').startsWith('+') ? 'badge-green' : 'badge-gold'}`}>{imp.impact}</span>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/app/ai-advisor')}>Ask AI</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
