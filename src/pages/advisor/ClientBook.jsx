import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { formatLakh, formatPct } from '../../utils/formatters';
import AssetAllocationPie from '../../components/charts/AssetAllocationPie';
import { Users, TrendingUp, ClipboardCheck, Heart, ArrowRight, ChevronRight } from 'lucide-react';

function RiskBadge({ profile }) {
  const colors = {
    'Conservative': 'badge-green',
    'Moderate': 'badge-primary',
    'Moderate-Aggressive': 'badge-gold',
    'Aggressive': 'badge-red',
  };
  return <span className={`badge ${colors[profile] || 'badge-surface'}`}>{profile}</span>;
}

function HealthBar({ score }) {
  const color = score >= 75 ? 'var(--green)' : score >= 55 ? 'var(--gold)' : 'var(--red)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ flex: 1, height: 5, background: 'var(--surface-raised)', borderRadius: 999 }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 999 }} />
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color, flexShrink: 0 }}>{score}</span>
    </div>
  );
}

export default function ClientBook() {
  const { state } = useApp();
  const { profile, clients, pendingRecommendations, aumByAsset, riskBreakdown } = state.advisor;
  const navigate = useNavigate();

  const pendingCount = pendingRecommendations.filter(r => r.status === 'pending').length;

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div className="text-label text-muted">WealthWise Advisory · {profile.sebiRegNo}</div>
          <h1 className="text-h1 mt-1">Client Book</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm">Export Report</button>
          <button className="btn btn-primary" onClick={() => navigate('/advisor/recommendations')}>
            Review {pendingCount} Pending Recos →
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="kpi-grid">
        <div className="kpi-tile primary">
          <div className="kpi-icon"><TrendingUp /></div>
          <div className="kpi-label">Total AUM</div>
          <div className="kpi-value">{formatLakh(profile.totalAUM)}</div>
          <div className="kpi-sub" style={{ color: 'var(--green)' }}>▲ 12.4% YTD</div>
        </div>
        <div className="kpi-tile green">
          <div className="kpi-icon"><Users /></div>
          <div className="kpi-label">Active Clients</div>
          <div className="kpi-value">{clients.length}</div>
          <div className="kpi-sub text-secondary">+2 this quarter</div>
        </div>
        <div className="kpi-tile gold">
          <div className="kpi-icon"><ClipboardCheck /></div>
          <div className="kpi-label">Pending Reviews</div>
          <div className="kpi-value">{pendingCount}</div>
          <div className="kpi-sub" style={{ color: 'var(--red)' }}>Action needed</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-icon"><Heart /></div>
          <div className="kpi-label">Avg Health Score</div>
          <div className="kpi-value">{profile.avgHealthScore}/100</div>
          <div className="kpi-sub" style={{ color: 'var(--gold)' }}>Good · Improving</div>
        </div>
      </div>

      {/* Charts + table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.25rem', alignItems: 'start' }}>
        {/* Client table */}
        <div className="card">
          <h2 className="text-h2" style={{ marginBottom: '1rem' }}>All Clients</h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>AUM</th>
                  <th>Risk</th>
                  <th>Health</th>
                  <th>Last Active</th>
                  <th>Actions</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {clients.map(c => (
                  <tr
                    key={c.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/advisor/clients/${c.id}`)}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.875rem', color: 'white', flexShrink: 0 }}>
                          {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{c.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.age}y · {c.city}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'Space Grotesk', fontWeight: 700 }}>{formatLakh(c.aum)}</td>
                    <td><RiskBadge profile={c.riskProfile} /></td>
                    <td style={{ minWidth: 120 }}><HealthBar score={c.healthScore} /></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{c.lastActivity}</td>
                    <td>
                      {c.pendingActions > 0 && (
                        <span className="badge badge-red">{c.pendingActions} pending</span>
                      )}
                    </td>
                    <td><ChevronRight size={16} style={{ color: 'var(--text-muted)' }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <h3 className="text-h3" style={{ marginBottom: '0.875rem' }}>AUM by Asset Class</h3>
            <AssetAllocationPie data={aumByAsset} />
          </div>
          <div className="card">
            <h3 className="text-h3" style={{ marginBottom: '0.875rem' }}>Risk Profile Mix</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {riskBreakdown.map(r => (
                <div key={r.profile}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{r.profile}</span>
                    <span style={{ fontWeight: 600 }}>{r.count} clients</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill primary" style={{ width: `${(r.count / clients.length) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
