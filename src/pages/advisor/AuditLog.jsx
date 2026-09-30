import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDateTime } from '../../utils/formatters';
import { Shield, Copy, ExternalLink, Search } from 'lucide-react';

const actionColors = { approved: 'var(--green)', rejected: 'var(--red)', edited: 'var(--primary)' };
const actionIcons = { approved: '✓', rejected: '✕', edited: '✎' };

function AuditRow({ log, expanded, onToggle }) {
  const color = actionColors[log.action] || 'var(--text-secondary)';
  return (
    <>
      <tr style={{ cursor: 'pointer' }} onClick={onToggle}>
        <td style={{ minWidth: 160 }}>
          <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{log.clientName}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDateTime(log.timestamp)}</div>
        </td>
        <td><span className="badge badge-surface">{log.type?.replace(/_/g, ' ')}</span></td>
        <td style={{ fontWeight: 600, maxWidth: 240 }}>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.title}</div>
        </td>
        <td>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color, fontSize: '0.875rem' }}>
            <span style={{ fontFamily: 'monospace', width: 16, textAlign: 'center' }}>{actionIcons[log.action]}</span>
            {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
          </span>
        </td>
        <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', maxWidth: 200 }}>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.advisorNote}</div>
        </td>
        <td style={{ fontFamily: 'monospace', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
          <div>{log.aiVersion}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: 2 }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 100, whiteSpace: 'nowrap' }}>{log.dataHash}</span>
            <Copy size={10} style={{ cursor: 'pointer', flexShrink: 0 }} onClick={e => { e.stopPropagation(); navigator.clipboard?.writeText(log.dataHash); }} />
          </div>
        </td>
        <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{expanded ? '▲' : '▼'}</td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} style={{ padding: 0 }}>
            <div style={{ background: 'var(--surface-raised)', borderLeft: `3px solid ${color}`, padding: '1rem 1.25rem', margin: '0 0 0.25rem', borderRadius: '0 0 var(--radius) var(--radius)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>FULL ADVISOR NOTE</div>
              <div style={{ fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>{log.advisorNote}</div>
              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                <span>AI Model: <strong style={{ color: 'var(--text-secondary)' }}>{log.aiVersion}</strong></span>
                <span>Data Snapshot: <strong style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{log.dataHash}</strong></span>
                <span>SEBI Reg: <strong style={{ color: 'var(--text-secondary)' }}>INA000014523</strong></span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AuditLog() {
  const { state } = useApp();
  const { auditLog } = state.advisor;
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const filtered = auditLog.filter(log => {
    const matchSearch = !search ||
      log.clientName.toLowerCase().includes(search.toLowerCase()) ||
      log.title.toLowerCase().includes(search.toLowerCase()) ||
      (log.type || '').toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === 'all' || log.action === actionFilter;
    return matchSearch && matchAction;
  });

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h1 className="text-h1">SEBI Audit Trail</h1>
        <p className="text-sm text-secondary mt-1">Immutable record of all advisor actions on AI recommendations. Downloadable for SEBI inspection.</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius)', padding: '0.625rem 1rem', fontSize: '0.8125rem' }}>
          <Shield size={14} color="var(--green)" />
          <span style={{ color: 'var(--green)', fontWeight: 600 }}>SEBI RIA Compliant Audit Log · INA000014523</span>
        </div>
        <button className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
          <ExternalLink size={14} /> Export to PDF
        </button>
      </div>

      <div className="kpi-grid">
        {[
          { label: 'Total Entries', value: auditLog.length },
          { label: 'Approved', value: auditLog.filter(l => l.action === 'approved').length, color: 'var(--green)' },
          { label: 'Edited & Approved', value: auditLog.filter(l => l.action === 'edited').length, color: 'var(--primary-light)' },
          { label: 'Rejected', value: auditLog.filter(l => l.action === 'rejected').length, color: 'var(--red)' },
          { label: 'Approval Rate', value: `${Math.round((auditLog.filter(l => l.action === 'approved' || l.action === 'edited').length / Math.max(auditLog.length, 1)) * 100)}%`, color: 'var(--primary-light)' },
        ].map((k, i) => (
          <div key={i} className="kpi-tile">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Search + filter bar */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search size={14} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input"
            style={{ paddingLeft: '2.25rem' }}
            placeholder="Search by client, recommendation, or type…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[['all', 'All'], ['approved', '✓ Approved'], ['edited', '✎ Edited'], ['rejected', '✕ Rejected']].map(([val, label]) => (
            <button key={val} className={`chip ${actionFilter === val ? 'active' : ''}`} onClick={() => setActionFilter(val)}>{label}</button>
          ))}
        </div>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No entries match your search.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Client · Time</th>
                  <th>Type</th>
                  <th>Recommendation</th>
                  <th>Action</th>
                  <th>Advisor Note</th>
                  <th>AI Version · Hash</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(log => (
                  <AuditRow
                    key={log.id}
                    log={log}
                    expanded={expandedId === log.id}
                    onToggle={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ padding: '0.875rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
        Maintained per SEBI Investment Adviser Regulations 2013 and SEBI Circular on AI/ML usage in advisory. AI model versions and SHA-256 data hashes are logged for explainability and non-repudiation. Logs retained for minimum 5 years.
      </div>
    </div>
  );
}
