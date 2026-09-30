import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import HealthScoreRing from '../../components/cards/HealthScoreRing';
import { formatLakh } from '../../utils/formatters';
import { ArrowLeft } from 'lucide-react';

const TABS = ['Overview', 'Holdings', 'AI Recommendations', 'Audit Log'];

function TabNav({ active, onChange }) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)', gap: 0, overflowX: 'auto', marginBottom: '1.25rem' }}>
      {TABS.map(t => (
        <button key={t} onClick={() => onChange(t)} style={{
          padding: '0.75rem 1.25rem', background: 'none', border: 'none',
          borderBottom: active === t ? '2px solid var(--primary)' : '2px solid transparent',
          color: active === t ? 'var(--primary-light)' : 'var(--text-muted)',
          fontWeight: active === t ? 600 : 400, cursor: 'pointer', fontSize: '0.875rem',
          whiteSpace: 'nowrap', marginBottom: '-1px', transition: 'var(--transition)',
        }}>{t}</button>
      ))}
    </div>
  );
}

function OverviewTab({ client, clientRecos, navigate }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
      <div className="card">
        <h2 className="text-h2" style={{ marginBottom: '1rem' }}>Financial Health</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <HealthScoreRing score={client.healthScore} size={140} />
          <div style={{ flex: 1 }}>
            {['Insurance Gap: Needs Attention', 'Emergency Fund: Good', 'Debt Ratio: Medium', 'Goals: On Track'].map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8125rem', marginBottom: '0.3rem' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: i === 0 ? 'var(--red)' : i === 2 ? 'var(--gold)' : 'var(--green)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 className="text-h2">AI Recommendations</h2>
          <span className="badge badge-red">{clientRecos.filter(r => r.status === 'pending').length} pending</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {clientRecos.slice(0, 2).map(r => (
            <div key={r.id} style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '0.875rem', border: `1px solid ${r.status === 'pending' ? 'rgba(99,102,241,0.2)' : r.status === 'approved' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{r.title}</div>
                <span className={`badge ${r.status === 'pending' ? 'badge-gold' : r.status === 'approved' ? 'badge-green' : 'badge-red'}`}>{r.status}</span>
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{r.summary}</div>
            </div>
          ))}
          {clientRecos.length === 0 && <div className="text-secondary text-sm">No recommendations yet.</div>}
        </div>
        <button className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem', width: '100%' }} onClick={() => navigate('/advisor/recommendations')}>Review All in Queue →</button>
      </div>
      <div className="card">
        <h2 className="text-h2" style={{ marginBottom: '0.875rem' }}>Client Goals</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {client.goals.map((g, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.25rem' }}>{g.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{g.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <div className="progress-bar" style={{ flex: 1 }}><div className="progress-fill green" style={{ width: `${g.progress}%` }} /></div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flexShrink: 0 }}>{g.progress}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h2 className="text-h2" style={{ marginBottom: '0.875rem' }}>Upcoming Actions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {client.upcomingActions.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.75rem', padding: '0.625rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)' }}>
              <span style={{ fontSize: '1.125rem', flexShrink: 0 }}>{a.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{a.action}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.due}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HoldingsTab({ client }) {
  const holdings = [
    { class: 'Mutual Funds', value: Math.round(client.aum * 0.42), color: 'var(--primary)', icon: '📊' },
    { class: 'Equities', value: Math.round(client.aum * 0.28), color: 'var(--purple)', icon: '📈' },
    { class: 'Fixed Deposits', value: Math.round(client.aum * 0.18), color: 'var(--gold)', icon: '🏦' },
    { class: 'EPF / PPF', value: Math.round(client.aum * 0.08), color: 'var(--green)', icon: '🏛️' },
    { class: 'Gold SGBs', value: Math.round(client.aum * 0.04), color: 'var(--orange)', icon: '🥇' },
  ];
  const total = holdings.reduce((s, h) => s + h.value, 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p className="text-sm text-secondary">Portfolio breakdown for {client.name}. Data sourced from AA Network consent.</p>
      <div className="card">
        {holdings.map((h, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: i < holdings.length - 1 ? '0.875rem' : 0 }}>
            <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{h.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                <span style={{ fontWeight: 600 }}>{h.class}</span>
                <span style={{ color: h.color, fontWeight: 700 }}>{formatLakh(h.value)}</span>
              </div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${(h.value / total) * 100}%`, background: h.color }} /></div>
            </div>
            <div style={{ width: 45, textAlign: 'right', fontSize: '0.8125rem', color: 'var(--text-muted)', flexShrink: 0 }}>{Math.round((h.value / total) * 100)}%</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
        {[
          { label: 'Total AUM', value: formatLakh(client.aum) },
          { label: 'Annual Return', value: `${client.annualReturn}% CAGR`, color: 'var(--green)' },
          { label: 'Equity Allocation', value: `${Math.round((holdings[0].value + holdings[1].value) / total * 100)}%` },
          { label: 'Debt Allocation', value: `${Math.round((holdings[2].value + holdings[3].value) / total * 100)}%` },
        ].map((k, i) => (
          <div key={i} className="card" style={{ padding: '0.875rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>{k.label}</div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: k.color || 'var(--text-primary)' }}>{k.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecoTab({ clientRecos, navigate }) {
  if (clientRecos.length === 0) return <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No AI recommendations for this client yet.</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      {clientRecos.map(r => (
        <div key={r.id} className="card" style={{ borderLeft: `3px solid ${r.status === 'pending' ? 'var(--gold)' : r.status === 'approved' ? 'var(--green)' : 'var(--red)'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div style={{ fontWeight: 700 }}>{r.title}</div>
            <span className={`badge ${r.status === 'pending' ? 'badge-gold' : r.status === 'approved' ? 'badge-green' : 'badge-red'}`}>{r.status}</span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.5rem' }}>{r.summary}</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            <span>Type: {r.type?.replace(/_/g, ' ')}</span><span>·</span>
            <span>Confidence: {r.confidence}%</span><span>·</span>
            <span>Urgency: {r.urgency}</span>
          </div>
        </div>
      ))}
      <button className="btn btn-primary" onClick={() => navigate('/advisor/recommendations')}>Open Recommendation Queue →</button>
    </div>
  );
}

function ClientAuditTab({ auditLog, clientName }) {
  const logs = auditLog.filter(l => l.clientName === clientName);
  if (logs.length === 0) return <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No audit entries for this client yet.</div>;
  const actionColors = { approved: 'var(--green)', rejected: 'var(--red)', edited: 'var(--primary)' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {logs.map(log => (
        <div key={log.id} className="card" style={{ borderLeft: `3px solid ${actionColors[log.action]}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{log.title}</div>
            <span className={`badge ${log.action === 'approved' ? 'badge-green' : log.action === 'rejected' ? 'badge-red' : 'badge-primary'}`}>{log.action}</span>
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>{log.advisorNote}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleString('en-IN')} · {log.aiVersion}</div>
        </div>
      ))}
    </div>
  );
}

export default function ClientProfile() {
  const { clientId } = useParams();
  const { state } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');

  const client = state.advisor.clients.find(c => c.id === clientId) || state.advisor.clients[0];
  const clientRecos = state.advisor.pendingRecommendations.filter(r => r.clientName === client?.name);

  if (!client) return <div className="page-enter"><div className="text-secondary">Client not found.</div></div>;

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => navigate('/advisor/clients')}>
        <ArrowLeft size={14} /> Back to Client Book
      </button>

      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.5rem', color: 'white', flexShrink: 0 }}>
            {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.5rem', marginBottom: '0.25rem' }}>{client.name}</h1>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <span>{client.age}y · {client.city}</span><span>·</span><span>{client.occupation}</span><span>·</span><span>Client since {client.clientSince}</span>
            </div>
            <div style={{ marginTop: '0.625rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="badge badge-primary">{client.riskProfile}</span>
              <span className="badge badge-surface">AUM {formatLakh(client.aum)}</span>
              {client.pendingActions > 0 && <span className="badge badge-red">{client.pendingActions} actions pending</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
            <button className="btn btn-secondary btn-sm">Send Report</button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/advisor/recommendations')}>Review Recos</button>
          </div>
        </div>
      </div>

      <div className="kpi-grid">
        {[
          { label: 'Total AUM', value: formatLakh(client.aum) },
          { label: 'Annual Return', value: `${client.annualReturn}%`, sub: 'FY26 CAGR', color: 'var(--green)' },
          { label: 'Health Score', value: `${client.healthScore}/100` },
          { label: 'Next Review', value: client.nextReview },
          { label: 'Annual Income', value: formatLakh(client.income) },
        ].map((k, i) => (
          <div key={i} className="kpi-tile">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={{ fontSize: '1.25rem', color: k.color }}>{k.value}</div>
            {k.sub && <div className="kpi-sub">{k.sub}</div>}
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '1.25rem 1.25rem 0' }}>
        <TabNav active={activeTab} onChange={setActiveTab} />
        <div style={{ paddingBottom: '1.25rem' }}>
          {activeTab === 'Overview' && <OverviewTab client={client} clientRecos={clientRecos} navigate={navigate} />}
          {activeTab === 'Holdings' && <HoldingsTab client={client} />}
          {activeTab === 'AI Recommendations' && <RecoTab clientRecos={clientRecos} navigate={navigate} />}
          {activeTab === 'Audit Log' && <ClientAuditTab auditLog={state.advisor.auditLog} clientName={client.name} />}
        </div>
      </div>
    </div>
  );
}
