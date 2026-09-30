import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const INITIAL_MODELS = [
  {
    id: 1,
    name: 'Conservative — Retiree',
    risk: 'Conservative',
    clients: ['Suresh Kumar (68)', 'Meera Reddy (64)', 'Pooja Iyer (61)'],
    allocation: { Equity: 20, Debt: 60, Gold: 10, Cash: 10 },
    funds: {
      Equity: ['HDFC Balanced Advantage Fund', 'SBI Equity Hybrid Fund'],
      Debt: ['ICICI Prud. Corporate Bond', 'Nippon India Short Term', 'SBI Magnum Gilt Fund'],
      Gold: ['Nippon Gold BeES', 'HDFC Gold Fund'],
      Cash: ['Liquid Bees', 'Parag Parikh Liquid Fund'],
    },
    driftData: [
      { client: 'Suresh Kumar', currentEquity: 23, targetEquity: 20, drift: 3 },
      { client: 'Meera Reddy', currentEquity: 27, targetEquity: 20, drift: 7 },
      { client: 'Pooja Iyer', currentEquity: 21, targetEquity: 20, drift: 1 },
    ],
  },
  {
    id: 2,
    name: 'Balanced — 40s Family',
    risk: 'Moderate',
    clients: ['Rahul Mehta (42)', 'Priya Sharma (39)', 'Ananya Patel (44)', 'Karan Joshi (41)'],
    allocation: { Equity: 55, Debt: 30, Gold: 10, Cash: 5 },
    funds: {
      Equity: ['Mirae Asset Large Cap', 'Axis Midcap Fund', 'Parag Parikh Flexi Cap'],
      Debt: ['HDFC Corporate Bond', 'Kotak Dynamic Bond Fund'],
      Gold: ['SGB 2023-24 Series VIII', 'Axis Gold Fund'],
      Cash: ['DSP Liquid Fund'],
    },
    driftData: [
      { client: 'Rahul Mehta', currentEquity: 58, targetEquity: 55, drift: 3 },
      { client: 'Priya Sharma', currentEquity: 49, targetEquity: 55, drift: -6 },
      { client: 'Ananya Patel', currentEquity: 56, targetEquity: 55, drift: 1 },
      { client: 'Karan Joshi', currentEquity: 62, targetEquity: 55, drift: 7 },
    ],
  },
  {
    id: 3,
    name: 'Aggressive — 30s Growth',
    risk: 'Aggressive',
    clients: ['Vikram Singh (31)', 'Arjun Das (28)', 'Divya Nair (35)', 'Isha Kapoor (29)', 'Sanjay Bose (33)'],
    allocation: { Equity: 80, Debt: 10, Gold: 5, Cash: 5 },
    funds: {
      Equity: ['Quant Small Cap Fund', 'Nippon India Small Cap', 'Axis Growth Opp Fund', 'DSP Midcap Fund'],
      Debt: ['HDFC Short Term Debt Fund'],
      Gold: ['Nippon Gold BeES'],
      Cash: ['Parag Parikh Liquid Fund'],
    },
    driftData: [
      { client: 'Vikram Singh', currentEquity: 85, targetEquity: 80, drift: 5 },
      { client: 'Arjun Das', currentEquity: 88, targetEquity: 80, drift: 8 },
      { client: 'Divya Nair', currentEquity: 79, targetEquity: 80, drift: -1 },
      { client: 'Isha Kapoor', currentEquity: 91, targetEquity: 80, drift: 11 },
      { client: 'Sanjay Bose', currentEquity: 76, targetEquity: 80, drift: -4 },
    ],
  },
];

const ALLOC_COLORS = { Equity: '#6366f1', Debt: '#10b981', Gold: '#f59e0b', Cash: '#06b6d4' };
const RISK_COLORS = { Conservative: 'var(--green)', Moderate: 'var(--gold)', Aggressive: 'var(--red)' };
const RISK_BG = { Conservative: 'rgba(34,197,94,0.1)', Moderate: 'rgba(245,158,11,0.1)', Aggressive: 'rgba(239,68,68,0.1)' };

const emptyModel = { name: '', risk: 'Moderate', allocation: { Equity: 60, Debt: 30, Gold: 5, Cash: 5 } };

export default function ModelPortfolios() {
  const [models, setModels] = useState(INITIAL_MODELS);
  const [selected, setSelected] = useState(INITIAL_MODELS[0]);
  const [showCreate, setShowCreate] = useState(false);
  const [newModel, setNewModel] = useState(emptyModel);
  const [editFunds, setEditFunds] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const allocTotal = Object.values(newModel.allocation).reduce((s, v) => s + (parseInt(v) || 0), 0);

  const pieData = selected ? Object.entries(selected.allocation).map(([k, v]) => ({ name: k, value: v, color: ALLOC_COLORS[k] })) : [];

  const styles = {
    page: { padding: '32px 24px', maxWidth: 1200, margin: '0 auto' },
    layout: { display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24 },
    leftPanel: { background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow)', height: 'fit-content' },
    leftHeader: { padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    modelItem: (sel) => ({
      padding: '16px 20px', cursor: 'pointer', borderBottom: '1px solid var(--glass-border)',
      background: sel ? 'rgba(99,102,241,0.08)' : 'transparent',
      borderLeft: sel ? '3px solid var(--primary)' : '3px solid transparent',
      transition: 'var(--transition)',
    }),
    card: { background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 24, boxShadow: 'var(--shadow)', marginBottom: 20 },
    sectionTitle: { fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--glass-border)' },
    fundChip: { display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: 12, background: 'var(--surface-raised)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)', margin: '3px', fontWeight: 500 },
    clientChip: { display: 'inline-block', padding: '5px 14px', borderRadius: 20, fontSize: 12, background: 'rgba(99,102,241,0.1)', color: 'var(--primary-light)', margin: '3px', fontWeight: 600, border: '1px solid rgba(99,102,241,0.2)' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--glass-border)' },
    td: { padding: '11px 14px', fontSize: 13, color: 'var(--text-primary)', borderBottom: '1px solid var(--glass-border)' },
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 32, width: 480, maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' },
    input: { width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box', marginBottom: 14 },
    label: { fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' },
    allocGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 },
    allocItem: { background: 'var(--surface-raised)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' },
    toast: { position: 'fixed', bottom: 30, right: 30, background: 'var(--green)', color: '#fff', padding: '12px 24px', borderRadius: 'var(--radius)', fontWeight: 600, fontSize: 14, boxShadow: '0 8px 24px rgba(34,197,94,0.4)', zIndex: 9999 },
  };

  return (
    <div style={styles.page} className="page-enter">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>📐</span> Model Portfolios
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>Build, assign, and monitor standardized portfolio templates</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Create New Model</button>
      </div>

      <div style={styles.layout}>
        {/* Left Panel */}
        <div style={styles.leftPanel}>
          <div style={styles.leftHeader}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Model Portfolios</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{models.length} models</span>
          </div>
          {models.map(m => (
            <div key={m.id} style={styles.modelItem(selected?.id === m.id)} onClick={() => setSelected(m)}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>{m.name}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 700,
                  background: RISK_BG[m.risk], color: RISK_COLORS[m.risk],
                }}>{m.risk}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.clients.length} clients</span>
              </div>
            </div>
          ))}
        </div>

        {/* Right Panel */}
        <div>
          {selected && (
            <>
              {/* Model Header */}
              <div style={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{selected.name}</div>
                    <span style={{
                      fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 700,
                      background: RISK_BG[selected.risk], color: RISK_COLORS[selected.risk],
                    }}>{selected.risk} Risk</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-sm btn-ghost" onClick={() => showToast('✏️ Edit mode enabled')}>✏️ Edit</button>
                    <button className="btn btn-sm btn-ghost" style={{ color: 'var(--red)' }} onClick={() => {
                      setModels(models.filter(m => m.id !== selected.id));
                      setSelected(models[0]);
                      showToast('🗑 Model deleted');
                    }}>🗑 Delete</button>
                  </div>
                </div>
              </div>

              {/* Allocation + Chart */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <div style={styles.card}>
                  <div style={styles.sectionTitle}>🎯 Target Allocation</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)' }} />
                      <Legend formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div style={styles.card}>
                  <div style={styles.sectionTitle}>📋 Allocation Breakdown</div>
                  {Object.entries(selected.allocation).map(([asset, pct]) => (
                    <div key={asset} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 2, background: ALLOC_COLORS[asset], display: 'inline-block' }} />
                          {asset}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{pct}%</span>
                      </div>
                      <div style={{ background: 'var(--surface-raised)', borderRadius: 100, height: 6 }}>
                        <div style={{ height: 6, borderRadius: 100, background: ALLOC_COLORS[asset], width: `${pct}%`, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Funds */}
              <div style={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--glass-border)' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>🏦 Fund List</span>
                  <button className="btn btn-sm btn-ghost" onClick={() => setEditFunds(!editFunds)}>
                    {editFunds ? '✅ Done' : '✏️ Edit Funds'}
                  </button>
                </div>
                {Object.entries(selected.funds).map(([bucket, funds]) => (
                  <div key={bucket} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: ALLOC_COLORS[bucket], marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{bucket}</div>
                    <div>
                      {funds.map((f, i) => (
                        <span key={i} style={styles.fundChip}>{f}</span>
                      ))}
                      {editFunds && <button style={{ ...styles.fundChip, cursor: 'pointer', color: 'var(--primary-light)', borderStyle: 'dashed' }}>+ Add</button>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Assigned Clients */}
              <div style={styles.card}>
                <div style={styles.sectionTitle}>👥 Assigned Clients ({selected.clients.length})</div>
                <div>{selected.clients.map((c, i) => <span key={i} style={styles.clientChip}>{c}</span>)}</div>
              </div>

              {/* Drift Monitor */}
              <div style={styles.card}>
                <div style={styles.sectionTitle}>📊 Drift Monitor</div>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {['Client', 'Current Equity %', 'Target %', 'Drift', 'Action'].map(h => <th key={h} style={styles.th}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {selected.driftData.map((row, i) => {
                      const absDrift = Math.abs(row.drift);
                      const isAlert = absDrift > 5;
                      return (
                        <tr key={i} style={{ background: isAlert ? 'rgba(239,68,68,0.04)' : 'transparent' }}>
                          <td style={styles.td}><strong>{row.client}</strong></td>
                          <td style={styles.td}>{row.currentEquity}%</td>
                          <td style={styles.td}>{row.targetEquity}%</td>
                          <td style={styles.td}>
                            <span style={{
                              display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                              background: isAlert ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.12)',
                              color: isAlert ? 'var(--red)' : 'var(--green)',
                            }}>
                              {row.drift > 0 ? '+' : ''}{row.drift}%
                            </span>
                          </td>
                          <td style={styles.td}>
                            {isAlert ? (
                              <button className="btn btn-sm btn-ghost" style={{ color: 'var(--red)', borderColor: 'rgba(239,68,68,0.3)', fontSize: 11 }}
                                onClick={() => showToast(`🔔 Rebalance alert sent to ${row.client}`)}>
                                Send Rebalance Alert
                              </button>
                            ) : (
                              <span style={{ fontSize: 12, color: 'var(--green)' }}>✓ On track</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text-muted)' }}>
                  ⚠️ Clients with drift &gt;5% are highlighted. Send rebalance alerts to notify them.
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create Model Modal */}
      {showCreate && (
        <div style={styles.overlay} onClick={() => setShowCreate(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>📐 Create New Model Portfolio</div>
            <label style={styles.label}>Model Name</label>
            <input style={styles.input} placeholder="e.g. Balanced — Young Professional" value={newModel.name} onChange={e => setNewModel({ ...newModel, name: e.target.value })} />
            <label style={styles.label}>Risk Level</label>
            <select style={styles.input} value={newModel.risk} onChange={e => setNewModel({ ...newModel, risk: e.target.value })}>
              {['Conservative', 'Moderate', 'Aggressive'].map(r => <option key={r}>{r}</option>)}
            </select>
            <div style={styles.label}>Target Allocation (must total 100%)</div>
            <div style={styles.allocGrid}>
              {Object.entries(newModel.allocation).map(([asset, val]) => (
                <div key={asset} style={styles.allocItem}>
                  <div style={{ fontSize: 11, color: ALLOC_COLORS[asset], fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>{asset}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="number" min="0" max="100"
                      style={{ ...styles.input, margin: 0, width: 70 }}
                      value={val}
                      onChange={e => setNewModel({ ...newModel, allocation: { ...newModel.allocation, [asset]: parseInt(e.target.value) || 0 } })}
                    />
                    <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>%</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 13, marginBottom: 16, color: allocTotal === 100 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
              Total: {allocTotal}% {allocTotal === 100 ? '✓' : `(need ${100 - allocTotal}% more)`}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} disabled={allocTotal !== 100 || !newModel.name} onClick={() => {
                const model = {
                  id: Date.now(), name: newModel.name, risk: newModel.risk, clients: [],
                  allocation: newModel.allocation,
                  funds: { Equity: [], Debt: [], Gold: [], Cash: [] },
                  driftData: [],
                };
                setModels([...models, model]);
                setSelected(model);
                setShowCreate(false);
                setNewModel(emptyModel);
                showToast('✅ New model portfolio created!');
              }}>Create Model</button>
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div style={styles.toast}>{toast}</div>}
    </div>
  );
}
