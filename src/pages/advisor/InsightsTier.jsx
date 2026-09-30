import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatLakh } from '../../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const monthlyAUM = [
  { month: 'Feb', aum: 39.2 }, { month: 'Mar', aum: 40.1 }, { month: 'Apr', aum: 39.8 },
  { month: 'May', aum: 41.2 }, { month: 'Jun', aum: 42.8 }, { month: 'Jul', aum: 44.1 },
  { month: 'Aug', aum: 47.0 },
];

const monthlyRevenue = [
  { month: 'Feb', trail: 32800, advisory: 15000 },
  { month: 'Mar', trail: 33500, advisory: 18000 },
  { month: 'Apr', trail: 33200, advisory: 12000 },
  { month: 'May', trail: 34400, advisory: 20000 },
  { month: 'Jun', trail: 35700, advisory: 22000 },
  { month: 'Jul', trail: 36800, advisory: 18000 },
  { month: 'Aug', trail: 39200, advisory: 25000 },
];

const clientRevenue = [
  { name: 'Sunita Patel', trail: 10000, advisory: 6000, aum: 12000000 },
  { name: 'Ananya Desai', trail: 8000, advisory: 5000, aum: 9600000 },
  { name: 'Rajesh Kumar', trail: 6800, advisory: 4500, aum: 8200000 },
  { name: 'Rohit Aggarwal', trail: 5900, advisory: 3000, aum: 7100000 },
  { name: 'Karan Mehta', trail: 3500, advisory: 2500, aum: 4200000 },
  { name: 'Vikram Singh', trail: 3200, advisory: 2000, aum: 3800000 },
  { name: 'Priya Nair', trail: 1800, advisory: 2000, aum: 2100000 },
];

const mfCommissionBreakdown = [
  { category: 'Large Cap', commission: 12400, aum: 18200000, rate: '0.68%' },
  { category: 'Flexi Cap', commission: 9800, aum: 14400000, rate: '0.68%' },
  { category: 'ELSS', commission: 5200, aum: 7600000, rate: '0.68%' },
  { category: 'Debt / Liquid', commission: 2800, aum: 9800000, rate: '0.29%' },
  { category: 'International', commission: 1800, aum: 2600000, rate: '0.69%' },
];

export default function InsightsTier() {
  const thisMonthRevenue = monthlyRevenue[monthlyRevenue.length - 1];
  const totalMonthly = thisMonthRevenue.trail + thisMonthRevenue.advisory;
  const totalAnnualized = totalMonthly * 12;

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h1 className="text-h1">Practice Insights</h1>
            <span className="badge badge-primary">Track B · MFD Analytics</span>
          </div>
          <p className="text-sm text-secondary">Revenue analytics, AUM growth, and commission breakdown for WealthWise Advisory</p>
        </div>
        <button className="btn btn-secondary btn-sm">Export Report</button>
      </div>

      {/* KPI strip */}
      <div className="kpi-grid">
        {[
          { label: 'Monthly Revenue', value: `₹${totalMonthly.toLocaleString('en-IN')}`, sub: '+8.4% MoM', color: 'var(--green)' },
          { label: 'Annualized Revenue', value: `₹${(totalAnnualized / 100000).toFixed(1)}L`, sub: 'Projected', color: 'var(--primary-light)' },
          { label: 'Trail Commission', value: `₹${thisMonthRevenue.trail.toLocaleString('en-IN')}/mo`, sub: '0.68% avg TER' },
          { label: 'Advisory Fees', value: `₹${thisMonthRevenue.advisory.toLocaleString('en-IN')}/mo`, sub: 'SEBI fee-only' },
          { label: 'Revenue per Client', value: `₹${Math.round(totalMonthly / 7).toLocaleString('en-IN')}/mo`, sub: 'avg across 7 clients' },
        ].map((k, i) => (
          <div key={i} className="kpi-tile">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={{ color: k.color || 'var(--text-primary)', fontSize: '1.125rem' }}>{k.value}</div>
            <div className="kpi-sub" style={{ color: k.color === 'var(--green)' ? k.color : '' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* AUM growth */}
        <div className="card">
          <h2 className="text-h2" style={{ marginBottom: '1rem' }}>AUM Growth (7 months)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyAUM}>
              <defs>
                <linearGradient id="aum-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}L`} />
              <Tooltip formatter={(v) => [`₹${v}L`, 'AUM']} contentStyle={{ background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }} />
              <Area type="monotone" dataKey="aum" stroke="var(--primary)" strokeWidth={2.5} fill="url(#aum-grad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue breakdown */}
        <div className="card">
          <h2 className="text-h2" style={{ marginBottom: '1rem' }}>Monthly Revenue Mix</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v, n) => [`₹${v.toLocaleString('en-IN')}`, n === 'trail' ? 'Trail Commission' : 'Advisory Fee']} contentStyle={{ background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }} />
              <Bar dataKey="trail" stackId="a" fill="var(--primary)" radius={[0,0,0,0]} />
              <Bar dataKey="advisory" stackId="a" fill="var(--purple)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.8125rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--primary)' }} /><span style={{ color: 'var(--text-secondary)' }}>Trail Commission</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--purple)' }} /><span style={{ color: 'var(--text-secondary)' }}>Advisory Fee</span></div>
          </div>
        </div>
      </div>

      {/* Per-client revenue */}
      <div className="card">
        <h2 className="text-h2" style={{ marginBottom: '1rem' }}>Revenue by Client (Aug 2026)</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Client</th><th>AUM</th><th>Trail Commission</th><th>Advisory Fee</th><th>Total Monthly</th><th>Annualized</th></tr>
            </thead>
            <tbody>
              {clientRevenue.map((c, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{formatLakh(c.aum)}</td>
                  <td style={{ color: 'var(--primary-light)', fontWeight: 600 }}>₹{c.trail.toLocaleString('en-IN')}</td>
                  <td style={{ color: 'var(--purple)', fontWeight: 600 }}>₹{c.advisory.toLocaleString('en-IN')}</td>
                  <td style={{ fontWeight: 700 }}>₹{(c.trail + c.advisory).toLocaleString('en-IN')}</td>
                  <td style={{ color: 'var(--green)', fontWeight: 600 }}>₹{((c.trail + c.advisory) * 12).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--glass-border)' }}>
                <td style={{ fontWeight: 700 }}>Total</td>
                <td style={{ fontWeight: 700 }}>₹4.7 Cr</td>
                <td style={{ fontWeight: 700, color: 'var(--primary-light)' }}>₹{clientRevenue.reduce((s,c)=>s+c.trail,0).toLocaleString('en-IN')}</td>
                <td style={{ fontWeight: 700, color: 'var(--purple)' }}>₹{clientRevenue.reduce((s,c)=>s+c.advisory,0).toLocaleString('en-IN')}</td>
                <td style={{ fontWeight: 700, fontSize: '1rem' }}>₹{clientRevenue.reduce((s,c)=>s+c.trail+c.advisory,0).toLocaleString('en-IN')}</td>
                <td style={{ fontWeight: 700, color: 'var(--green)', fontSize: '1rem' }}>₹{(clientRevenue.reduce((s,c)=>s+c.trail+c.advisory,0)*12).toLocaleString('en-IN')}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* MF Commission breakdown */}
      <div className="card">
        <h2 className="text-h2" style={{ marginBottom: '1rem' }}>MF Trail Commission by Category</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {mfCommissionBreakdown.map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 120, fontSize: '0.875rem', color: 'var(--text-secondary)', flexShrink: 0 }}>{m.category}</div>
              <div style={{ flex: 1 }}>
                <div className="progress-bar">
                  <div className="progress-fill primary" style={{ width: `${(m.commission / 12400) * 100}%` }} />
                </div>
              </div>
              <div style={{ width: 80, textAlign: 'right', fontWeight: 600, fontSize: '0.875rem' }}>₹{m.commission.toLocaleString('en-IN')}</div>
              <div style={{ width: 50, textAlign: 'right', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{m.rate}</div>
              <div style={{ width: 90, textAlign: 'right', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{formatLakh(m.aum)} AUM</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
