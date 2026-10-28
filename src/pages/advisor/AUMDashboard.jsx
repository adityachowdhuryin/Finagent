import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { Download, CheckCircle2, DollarSign } from 'lucide-react';

const IN_CLIENTS = [
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

const US_CLIENTS = [
  { name: 'David Chen', aum: 14200000 },
  { name: 'Jennifer Miller', aum: 11800000 },
  { name: 'Alexander Vance', aum: 9500000 },
  { name: 'Robert Sterling', aum: 8400000 },
  { name: 'Eleanor Winthrop', aum: 7200000 },
  { name: 'Harrison Ford', aum: 6500000 },
  { name: 'Lucas Hayes', aum: 5800000 },
  { name: 'Sophie Taylor', aum: 4900000 },
  { name: 'Liam Zhang', aum: 4200000 },
  { name: 'Maya Patel', aum: 3800000 },
  { name: 'Marcus Vance', aum: 2800000 },
  { name: 'Sarah Jenkins', aum: 1900000 },
];

const IN_INVOICES = [
  { client: 'Rahul Mehta', period: 'Q2 FY26', amount: 82000, status: 'Paid' },
  { client: 'Priya Sharma', period: 'Q2 FY26', amount: 74000, status: 'Pending' },
  { client: 'Vikram Singh', period: 'Q2 FY26', amount: 65000, status: 'Pending' },
  { client: 'Ananya Patel', period: 'Q2 FY26', amount: 58000, status: 'Paid' },
  { client: 'Suresh Kumar', period: 'Q2 FY26', amount: 49000, status: 'Pending' },
];

const US_INVOICES = [
  { client: 'David Chen', period: 'Q3 2026', amount: 28400, status: 'Paid', custodian: 'Charles Schwab' },
  { client: 'Jennifer Miller', period: 'Q3 2026', amount: 23600, status: 'Paid', custodian: 'Fidelity' },
  { client: 'Alexander Vance', period: 'Q3 2026', amount: 19000, status: 'Pending', custodian: 'Charles Schwab' },
  { client: 'Robert Sterling', period: 'Q3 2026', amount: 16800, status: 'Pending', custodian: 'Interactive Brokers' },
  { client: 'Eleanor Winthrop', period: 'Q3 2026', amount: 14400, status: 'Paid', custodian: 'Charles Schwab' },
];

const IN_AUM_TREND = [
  { month: 'Oct', aum: 3.6 }, { month: 'Nov', aum: 3.75 }, { month: 'Dec', aum: 3.82 },
  { month: 'Jan', aum: 3.9 },  { month: 'Feb', aum: 3.95 }, { month: 'Mar', aum: 4.02 },
  { month: 'Apr', aum: 4.0 },  { month: 'May', aum: 3.85 }, { month: 'Jun', aum: 3.98 },
  { month: 'Jul', aum: 4.05 }, { month: 'Aug', aum: 4.12 }, { month: 'Sep', aum: 4.2 },
];

const US_AUM_TREND = [
  { month: 'Oct', aum: 68.5 }, { month: 'Nov', aum: 70.2 }, { month: 'Dec', aum: 71.8 },
  { month: 'Jan', aum: 73.1 }, { month: 'Feb', aum: 74.5 }, { month: 'Mar', aum: 75.9 },
  { month: 'Apr', aum: 76.4 }, { month: 'May', aum: 77.2 }, { month: 'Jun', aum: 78.5 },
  { month: 'Jul', aum: 79.8 }, { month: 'Aug', aum: 80.3 }, { month: 'Sep', aum: 81.0 },
];

export default function AUMDashboard() {
  const { isUSMarket } = useApp();
  const jurisdiction = localStorage.getItem('finagent_advisor_jurisdiction') || (isUSMarket ? 'SEC' : 'SEBI');
  const isUS = Boolean(isUSMarket || jurisdiction === 'SEC');

  const CLIENTS = isUS ? US_CLIENTS : IN_CLIENTS;
  const AUM_TREND = isUS ? US_AUM_TREND : IN_AUM_TREND;

  const [revenueModel, setRevenueModel] = useState(isUS ? 'tiered' : 'percent');
  const [feePercent, setFeePercent] = useState('0.85');
  const [flatFee, setFlatFee] = useState(isUS ? '15000' : '35000');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invClient, setInvClient] = useState('');
  const [invPeriod, setInvPeriod] = useState(isUS ? 'Q4 2026' : 'Q3 FY26');
  const [invAmount, setInvAmount] = useState('');
  const [toast, setToast] = useState('');
  const [invoices, setInvoices] = useState(isUS ? US_INVOICES : IN_INVOICES);

  const totalAUM = CLIENTS.reduce((s, c) => s + c.aum, 0);

  // Tiered fee calculator for US: 100 bps first $1M, 75 bps next $2M, 50 bps next $2M, 35 bps thereafter
  function computeTieredFee(clientAum) {
    let fee = 0;
    let rem = clientAum;
    if (rem > 0) {
      const t1 = Math.min(rem, 1000000);
      fee += t1 * 0.0100;
      rem -= t1;
    }
    if (rem > 0) {
      const t2 = Math.min(rem, 2000000);
      fee += t2 * 0.0075;
      rem -= t2;
    }
    if (rem > 0) {
      const t3 = Math.min(rem, 2000000);
      fee += t3 * 0.0050;
      rem -= t3;
    }
    if (rem > 0) {
      fee += rem * 0.0035;
    }
    return fee;
  }

  const computedRevenue = revenueModel === 'tiered'
    ? Math.round(CLIENTS.reduce((s, c) => s + computeTieredFee(c.aum), 0))
    : revenueModel === 'percent'
      ? Math.round(totalAUM * (parseFloat(feePercent) || 1) / 100)
      : (parseInt(flatFee) || (isUS ? 15000 : 35000)) * CLIENTS.length;

  const outstandingInvoices = invoices.filter(i => i.status === 'Pending').reduce((s, i) => s + i.amount, 0);

  const fmt = (n) => {
    if (isUS) {
      if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
      if (n >= 1000) return '$' + (n / 1000).toFixed(0) + 'k';
      return '$' + n.toLocaleString('en-US');
    }
    if (n >= 10000000) return '₹' + (n / 10000000).toFixed(2) + 'Cr';
    if (n >= 100000) return '₹' + (n / 100000).toFixed(0) + 'L';
    return '₹' + n.toLocaleString('en-IN');
  };

  const fmtFull = (n) => isUS
    ? '$' + Number(n || 0).toLocaleString('en-US')
    : '₹' + Number(n || 0).toLocaleString('en-IN');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  function handleExportCustodianBatchDebit() {
    const csvRows = [
      ['Account Name', 'Custodian Account ID', 'AUM Value', 'BPS Tier', 'Quarterly Fee ($)', 'Debit Method'],
      ...CLIENTS.map((c, i) => [
        c.name,
        `SCHW-${849200 + i}`,
        `$${c.aum.toLocaleString('en-US')}`,
        '75 bps',
        `$${Math.round(computeTieredFee(c.aum) / 4).toLocaleString('en-US')}`,
        'Direct Custodian Electronic Debit (ACH / Wire)'
      ])
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Custodian_Direct_Debit_Batch_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('✓ Custodian batch debit file downloaded for Charles Schwab & Fidelity');
  }

  const styles = {
    page: { padding: '32px 24px', maxWidth: 1200, margin: '0 auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 },
    title: { fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 },
    kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 },
    kpiCard: { background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 22, boxShadow: 'var(--shadow)' },
    kpiLabel: { fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 },
    kpiValue: { fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 },
    kpiSub: { fontSize: 12, color: 'var(--text-muted)' },
    card: { background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: 24, boxShadow: 'var(--shadow)' },
    sectionTitle: { fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--glass-border)' },
    grid2: { display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24, marginBottom: 28 },
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

  return (
    <div style={styles.page} className="page-enter">
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.title}>
            <span>💼</span> {isUS ? 'SEC RIA AUM & Custodian Billing Dashboard' : 'AUM & Revenue Dashboard'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {isUS
              ? 'Fee-Only AUM accounting, basis-point tiered billing, and Schwab/Fidelity custodian batch debit'
              : 'SEBI RIA compliant AUM tracking, direct mutual fund fee schedules, and client billing'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {isUS && (
            <button className="btn btn-secondary" onClick={handleExportCustodianBatchDebit} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Download size={15} /> Custodian Batch Debit (CSV)
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setShowInvoiceModal(true)}>+ Generate Invoice</button>
        </div>
      </div>

      {/* KPI Row */}
      <div style={styles.kpiRow}>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Total AUM</div>
          <div style={styles.kpiValue}>{fmt(totalAUM)}</div>
          <div style={{ ...styles.kpiSub, color: 'var(--green)', fontWeight: 600 }}>
            ▲ {isUS ? '$3.2M (+4.1% MoM)' : '₹18L (+4.5% MoM)'}
          </div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Total Clients</div>
          <div style={styles.kpiValue}>{CLIENTS.length}</div>
          <div style={styles.kpiSub}>Avg AUM: {fmt(Math.round(totalAUM / CLIENTS.length))}</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Annual Advisory Revenue</div>
          <div style={{ ...styles.kpiValue, color: 'var(--green)' }}>{fmtFull(computedRevenue)}</div>
          <div style={styles.kpiSub}>
            {revenueModel === 'tiered'
              ? 'Tiered BPS Schedule (100-35 bps)'
              : revenueModel === 'percent'
                ? `${feePercent}% Flat AUM fee`
                : 'Flat Retainer model'}
          </div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Outstanding Invoices</div>
          <div style={{ ...styles.kpiValue, color: 'var(--red)' }}>{fmtFull(outstandingInvoices)}</div>
          <div style={styles.kpiSub}>{invoices.filter(i => i.status === 'Pending').length} invoices pending debit</div>
        </div>
      </div>

      {/* AUM Chart + Fee Settings */}
      <div style={styles.grid2}>
        <div style={styles.card}>
          <div style={styles.sectionTitle}>👥 AUM by Client</div>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={CLIENTS} layout="vertical" barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={v => isUS ? '$' + (v / 1000000) + 'M' : '₹' + (v / 100000) + 'L'}
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} width={110} />
              <Tooltip formatter={(v) => fmtFull(v)} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)' }} />
              <Bar dataKey="aum" fill="var(--primary)" radius={[0, 4, 4, 0]} name="AUM" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fee Settings */}
        <div style={styles.card}>
          <div style={styles.sectionTitle}>⚙️ Revenue & Fee Model</div>
          <div style={styles.toggleRow}>
            {isUS && (
              <button style={styles.toggleBtn(revenueModel === 'tiered')} onClick={() => setRevenueModel('tiered')}>Tiered BPS</button>
            )}
            <button style={styles.toggleBtn(revenueModel === 'percent')} onClick={() => setRevenueModel('percent')}>Flat % AUM</button>
            <button style={styles.toggleBtn(revenueModel === 'flat')} onClick={() => setRevenueModel('flat')}>Fixed Fee</button>
          </div>

          {revenueModel === 'tiered' ? (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>
                Standard SEC RIA Tiered Billing
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
                • First $1,000,000: <strong>100 bps (1.00%)</strong><br />
                • Next $2,000,000 ($1M - $3M): <strong>75 bps (0.75%)</strong><br />
                • Next $2,000,000 ($3M - $5M): <strong>50 bps (0.50%)</strong><br />
                • Over $5,000,000: <strong>35 bps (0.35%)</strong>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                Blended Effective Rate: <strong style={{ color: 'var(--green)' }}>{((computedRevenue / totalAUM) * 100).toFixed(2)}%</strong> across {CLIENTS.length} accounts.
              </div>
            </div>
          ) : revenueModel === 'percent' ? (
            <div>
              <label style={styles.label}>Annual AUM Fee (%)</label>
              <input style={styles.input} type="number" step="0.05" value={feePercent} onChange={e => setFeePercent(e.target.value)} />
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                At {feePercent}% on {fmt(totalAUM)}, annual revenue = <strong style={{ color: 'var(--green)' }}>{fmtFull(computedRevenue)}</strong>
              </div>
            </div>
          ) : (
            <div>
              <label style={styles.label}>{isUS ? 'Flat Monthly Retainer per Client ($)' : 'Flat Monthly Fee per Client (₹)'}</label>
              <input style={styles.input} type="number" value={flatFee} onChange={e => setFlatFee(e.target.value)} />
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                {CLIENTS.length} clients × {fmtFull(parseInt(flatFee || 0))}/mo × 12 = <strong style={{ color: 'var(--green)' }}>{fmtFull(computedRevenue)}</strong>
              </div>
            </div>
          )}
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => showToast('✅ Fee structure saved')}>Save Fee Structure</button>

          {/* Quick summary */}
          <div style={{ marginTop: 20, padding: 14, background: 'var(--surface-raised)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue Breakdown</div>
            {[
              { label: 'Monthly Revenue', value: fmtFull(Math.round(computedRevenue / 12)) },
              { label: 'Quarterly Revenue (Billing Cycle)', value: fmtFull(Math.round(computedRevenue / 4)) },
              { label: 'Annual Projected Revenue', value: fmtFull(computedRevenue) },
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
        <div style={styles.sectionTitle}>📈 12-Month AUM Growth Trend</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={AUM_TREND}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={v => isUS ? '$' + v + 'M' : '₹' + v + 'Cr'}
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={['auto', 'auto']}
            />
            <Tooltip
              formatter={(v) => isUS ? `$${v}M` : `₹${v}Cr`}
              contentStyle={{ background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)' }}
            />
            <Line type="monotone" dataKey="aum" stroke="var(--primary)" strokeWidth={2.5} dot={{ fill: 'var(--primary)', r: 4 }} name={isUS ? "AUM ($M)" : "AUM (₹Cr)"} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Invoices */}
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--glass-border)' }}>
          <div style={styles.sectionTitle}>🧾 Advisory Fee Invoices</div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{isUS ? 'Q3 2026 Direct Debits' : 'Q2 FY26'}</span>
        </div>
        <table style={styles.table}>
          <thead>
            <tr>
              {['Client', 'Period', isUS ? 'Custodian' : null, 'Amount', 'Status', 'Actions'].filter(Boolean).map(h => <th key={h} style={styles.th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv, i) => (
              <tr key={i}>
                <td style={styles.td}><strong>{inv.client}</strong></td>
                <td style={styles.td}>{inv.period}</td>
                {isUS && <td style={styles.td}><span className="badge badge-surface">{inv.custodian || 'Schwab'}</span></td>}
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
                    <button className="btn btn-sm btn-ghost" onClick={() => showToast(`📧 Reminder sent to ${inv.client}`)}>
                      {isUS ? 'Batch Debit' : 'Send Reminder'}
                    </button>
                  ) : (
                    <button className="btn btn-sm btn-ghost" onClick={() => showToast(`📄 Opening invoice for ${inv.client}`)}>View Receipt</button>
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
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>🧾 Generate Advisory Invoice</div>
            <label style={styles.label}>Select Client</label>
            <select style={styles.input} value={invClient} onChange={e => setInvClient(e.target.value)}>
              <option value="">Choose client…</option>
              {CLIENTS.map(c => <option key={c.name}>{c.name}</option>)}
            </select>
            <label style={styles.label}>Period</label>
            <input style={styles.input} value={invPeriod} onChange={e => setInvPeriod(e.target.value)} placeholder={isUS ? "Q4 2026" : "Q3 FY26"} />
            <label style={styles.label}>{isUS ? 'Amount ($)' : 'Amount (₹)'}</label>
            <input style={styles.input} type="number" value={invAmount} onChange={e => setInvAmount(e.target.value)} placeholder={isUS ? "18500" : "50000"} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => {
                if (invClient && invAmount) {
                  setInvoices([...invoices, { client: invClient, period: invPeriod, amount: parseInt(invAmount), status: 'Pending', custodian: 'Charles Schwab' }]);
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
