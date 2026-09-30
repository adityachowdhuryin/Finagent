import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';

const CLIENTS = [
  { name: 'Rahul Mehta', aum: 8200000 },
  { name: 'Priya Sharma', aum: 7400000 },
  { name: 'Vikram Singh', aum: 6500000 },
  { name: 'Ananya Patel', aum: 5800000 },
  { name: 'Suresh Kumar', aum: 4900000 },
  { name: 'Divya Nair', aum: 4100000 },
  { name: 'Karan Joshi', aum: 3700000 },
  { name: 'Meera Reddy', aum: 3200000 },
  { name: 'Arjun Das', aum: 2800000 },
  { name: 'Pooja Iyer', aum: 2500000 },
  { name: 'Sanjay Bose', aum: 2200000 },
  { name: 'Isha Kapoor', aum: 1600000 },
];

const INVOICES = [
  { client: 'Rahul Mehta', period: 'Q2 FY26', amount: 82000, status: 'Paid' },
  { client: 'Priya Sharma', period: 'Q2 FY26', amount: 74000, status: 'Pending' },
  { client: 'Vikram Singh', period: 'Q2 FY26', amount: 65000, status: 'Pending' },
  { client: 'Ananya Patel', period: 'Q2 FY26', amount: 58000, status: 'Paid' },
  { client: 'Suresh Kumar', period: 'Q2 FY26', amount: 49000, status: 'Pending' },
];

const AUM_TREND = [
  { month: 'Oct', aum: 3.6 }, { month: 'Nov', aum: 3.75 }, { month: 'Dec', aum: 3.82 },
  { month: 'Jan', aum: 3.9 },  { month: 'Feb', aum: 3.95 }, { month: 'Mar', aum: 4.02 },
  { month: 'Apr', aum: 4.0 },  { month: 'May', aum: 3.85 }, { month: 'Jun', aum: 3.98 },
  { month: 'Jul', aum: 4.05 }, { month: 'Aug', aum: 4.12 }, { month: 'Sep', aum: 4.2 },
];

const totalAUM = CLIENTS.reduce((s, c) => s + c.aum, 0);
const totalRevenue = Math.round(totalAUM * 0.01);
const outstandingInvoices = INVOICES.filter(i => i.status === 'Pending').reduce((s, i) => s + i.amount, 0);

const fmt = (n) => {
  if (n >= 10000000) return '₹' + (n / 10000000).toFixed(2) + 'Cr';
  if (n >= 100000) return '₹' + (n / 100000).toFixed(0) + 'L';
  return '₹' + n.toLocaleString('en-IN');
};
const fmtFull = (n) => '₹' + n.toLocaleString('en-IN');

export default function AUMDashboard() {
  const [revenueModel, setRevenueModel] = useState('percent');
  const [feePercent, setFeePercent] = useState('1.00');
  const [flatFee, setFlatFee] = useState('35000');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invClient, setInvClient] = useState('');
  const [invPeriod, setInvPeriod] = useState('Q3 FY26');
  const [invAmount, setInvAmount] = useState('');
  const [toast, setToast] = useState('');
  const [invoices, setInvoices] = useState(INVOICES);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const styles = {
    page: { padding: '32px 24px', maxWidth: 1200, margin: '0 auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 },
    title: { fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 },
    kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 },
    kpiCard: { background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 22, boxShadow: 'var(--shadow)' },
    kpiLabel: { fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 },
    kpiValue: { fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 },
    kpiSub: { fontSize: 12, color: 'var(--text-muted)' },
    card: { background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 24, boxShadow: 'var(--shadow)' },
    sectionTitle: { fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--glass-border)' },
    grid2: { display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24, marginBottom: 28 },
    grid2equal: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--glass-border)' },
    td: { padding: '12px 14px', fontSize: 14, color: 'var(--text-primary)', borderBottom: '1px solid var(--glass-border)' },
    toggleRow: { display: 'flex', gap: 0, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--glass-border)', width: 'fit-content', marginBottom: 20 },
    toggleBtn: (active) => ({
      padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
      background: active ? 'var(--primary)' : 'transparent',
      color: active ? '#fff' : 'var(--text-secondary)',
      transition: 'var(--transition)',
    }),
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 32, width: 420, maxWidth: '90vw' },
    input: { width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box', marginBottom: 14 },
    label: { fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' },
    toast: { position: 'fixed', bottom: 30, right: 30, background: 'var(--green)', color: '#fff', padding: '12px 24px', borderRadius: 'var(--radius)', fontWeight: 600, fontSize: 14, boxShadow: '0 8px 24px rgba(34,197,94,0.4)', zIndex: 9999 },
  };

  const computedRevenue = revenueModel === 'percent'
    ? Math.round(totalAUM * (parseFloat(feePercent) || 1) / 100)
    : (parseInt(flatFee) || 35000) * CLIENTS.length;

  return (
    <div style={styles.page} className="page-enter">
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.title}><span>💼</span> AUM & Revenue Dashboard</div>
        <button className="btn btn-primary" onClick={() => setShowInvoiceModal(true)}>+ Generate Invoice</button>
      </div>

      {/* KPI Row */}
      <div style={styles.kpiRow}>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Total AUM</div>
          <div style={styles.kpiValue}>{fmt(totalAUM)}</div>
          <div style={{ ...styles.kpiSub, color: 'var(--green)', fontWeight: 600 }}>▲ ₹18L &nbsp;+4.5% MoM</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Total Clients</div>
          <div style={styles.kpiValue}>{CLIENTS.length}</div>
          <div style={styles.kpiSub}>Avg AUM: {fmt(Math.round(totalAUM / CLIENTS.length))}</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Annual Revenue</div>
          <div style={{ ...styles.kpiValue, color: 'var(--green)' }}>{fmtFull(computedRevenue)}</div>
          <div style={styles.kpiSub}>{revenueModel === 'percent' ? `${feePercent}% AUM fee` : 'Flat fee model'}</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Outstanding Invoices</div>
          <div style={{ ...styles.kpiValue, color: 'var(--red)' }}>{fmtFull(outstandingInvoices)}</div>
          <div style={styles.kpiSub}>{invoices.filter(i => i.status === 'Pending').length} invoices pending</div>
        </div>
      </div>

      {/* AUM Chart + Fee Settings */}
      <div style={styles.grid2}>
        <div style={styles.card}>
          <div style={styles.sectionTitle}>👥 AUM by Client</div>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={CLIENTS} layout="vertical" barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tickFormatter={v => '₹' + (v / 100000) + 'L'} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} width={110} />
              <Tooltip formatter={(v) => fmtFull(v)} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)' }} />
              <Bar dataKey="aum" fill="var(--primary)" radius={[0, 4, 4, 0]} name="AUM" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fee Settings */}
        <div style={styles.card}>
          <div style={styles.sectionTitle}>⚙️ Revenue Model</div>
          <div style={styles.toggleRow}>
            <button style={styles.toggleBtn(revenueModel === 'percent')} onClick={() => setRevenueModel('percent')}>% AUM Fee</button>
            <button style={styles.toggleBtn(revenueModel === 'flat')} onClick={() => setRevenueModel('flat')}>Flat Fee</button>
          </div>
          {revenueModel === 'percent' ? (
            <div>
              <label style={styles.label}>Annual AUM Fee (%)</label>
              <input style={styles.input} type="number" step="0.1" value={feePercent} onChange={e => setFeePercent(e.target.value)} />
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                At {feePercent}% on {fmt(totalAUM)}, annual revenue = <strong style={{ color: 'var(--green)' }}>{fmtFull(computedRevenue)}</strong>
              </div>
            </div>
          ) : (
            <div>
              <label style={styles.label}>Flat Monthly Fee per Client (₹)</label>
              <input style={styles.input} type="number" value={flatFee} onChange={e => setFlatFee(e.target.value)} />
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                {CLIENTS.length} clients × ₹{parseInt(flatFee || 0).toLocaleString('en-IN')}/mo × 12 = <strong style={{ color: 'var(--green)' }}>{fmtFull(computedRevenue)}</strong>
              </div>
            </div>
          )}
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => showToast('✅ Fee structure saved')}>Save Fee Structure</button>

          {/* Quick summary */}
          <div style={{ marginTop: 20, padding: 14, background: 'var(--surface-raised)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue Breakdown</div>
            {[
              { label: 'Monthly Revenue', value: fmtFull(Math.round(computedRevenue / 12)) },
              { label: 'Quarterly Revenue', value: fmtFull(Math.round(computedRevenue / 4)) },
              { label: 'Annual Revenue', value: fmtFull(computedRevenue) },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 2 ? '1px solid var(--glass-border)' : 'none' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{r.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AUM Trend */}
      <div style={{ ...styles.card, marginBottom: 28 }}>
        <div style={styles.sectionTitle}>📈 12-Month AUM Trend</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={AUM_TREND}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => '₹' + v + 'Cr'} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[3.4, 4.4]} />
            <Tooltip formatter={(v) => `₹${v}Cr`} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)' }} />
            <Line type="monotone" dataKey="aum" stroke="var(--primary)" strokeWidth={2.5} dot={{ fill: 'var(--primary)', r: 4 }} name="AUM (₹Cr)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Invoices */}
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--glass-border)' }}>
          <div style={styles.sectionTitle}>🧾 Invoices</div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Q2 FY26</span>
        </div>
        <table style={styles.table}>
          <thead>
            <tr>
              {['Client', 'Period', 'Amount', 'Status', 'Actions'].map(h => <th key={h} style={styles.th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv, i) => (
              <tr key={i}>
                <td style={styles.td}><strong>{inv.client}</strong></td>
                <td style={styles.td}>{inv.period}</td>
                <td style={{ ...styles.td, fontWeight: 700 }}>{fmtFull(inv.amount)}</td>
                <td style={styles.td}>
                  <span style={{
                    display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                    background: inv.status === 'Paid' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                    color: inv.status === 'Paid' ? 'var(--green)' : 'var(--red)',
                  }}>{inv.status}</span>
                </td>
                <td style={styles.td}>
                  {inv.status === 'Pending' ? (
                    <button className="btn btn-sm btn-ghost" onClick={() => showToast(`📧 Reminder sent to ${inv.client}`)}>Send Reminder</button>
                  ) : (
                    <button className="btn btn-sm btn-ghost" onClick={() => showToast(`📄 Opening invoice for ${inv.client}`)}>View</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Generate Invoice Modal */}
      {showInvoiceModal && (
        <div style={styles.overlay} onClick={() => setShowInvoiceModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>🧾 Generate Invoice</div>
            <label style={styles.label}>Select Client</label>
            <select style={styles.input} value={invClient} onChange={e => setInvClient(e.target.value)}>
              <option value="">Choose client…</option>
              {CLIENTS.map(c => <option key={c.name}>{c.name}</option>)}
            </select>
            <label style={styles.label}>Period</label>
            <input style={styles.input} value={invPeriod} onChange={e => setInvPeriod(e.target.value)} placeholder="Q3 FY26" />
            <label style={styles.label}>Amount (₹)</label>
            <input style={styles.input} type="number" value={invAmount} onChange={e => setInvAmount(e.target.value)} placeholder="50000" />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => {
                if (invClient && invAmount) {
                  setInvoices([...invoices, { client: invClient, period: invPeriod, amount: parseInt(invAmount), status: 'Pending' }]);
                  showToast(`✅ Invoice generated for ${invClient}`);
                  setShowInvoiceModal(false);
                } else {
                  showToast('⚠️ Please fill all fields');
                }
              }}>Generate PDF</button>
              <button className="btn btn-ghost" onClick={() => setShowInvoiceModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div style={styles.toast}>{toast}</div>}
    </div>
  );
}
