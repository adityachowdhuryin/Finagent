import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatLakh } from '../../utils/formatters';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: '0.75rem', fontSize: '0.8125rem', minWidth: 160 }}>
      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', color: p.fill || p.stroke, marginBottom: '0.2rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>{p.name}</span>
          <span style={{ fontWeight: 600 }}>{formatLakh(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function NetWorthChart({ data = [] }) {
  const hasBreakdown = data.length > 0 && data[0].equity !== undefined;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 10 }}>
        <defs>
          <linearGradient id="grad-total" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#6366F1" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="grad-equity" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#6366F1" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="grad-mf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="grad-other" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={v => formatLakh(v)} tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
        <Tooltip content={<CustomTooltip />} />
        {hasBreakdown ? (
          <>
            <Area type="monotone" dataKey="equity" name="Equity" stackId="1" stroke="#6366F1" fill="url(#grad-equity)" strokeWidth={1.5} />
            <Area type="monotone" dataKey="mf" name="MF" stackId="1" stroke="#8B5CF6" fill="url(#grad-mf)" strokeWidth={1.5} />
            <Area type="monotone" dataKey="fd" name="FD/EPF" stackId="1" stroke="#F59E0B" fill="rgba(245,158,11,0.15)" strokeWidth={1.5} />
            <Area type="monotone" dataKey="other" name="Other" stackId="1" stroke="#10B981" fill="url(#grad-other)" strokeWidth={1.5} />
          </>
        ) : (
          <Area type="monotone" dataKey="total" name="Net Worth" stroke="#6366F1" fill="url(#grad-total)" strokeWidth={2} />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
