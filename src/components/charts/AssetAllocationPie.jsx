import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatLakh } from '../../utils/formatters';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: '0.75rem', fontSize: '0.8125rem' }}>
      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{d.name}</div>
      <div style={{ color: 'var(--text-secondary)' }}>{formatLakh(d.value)}</div>
      <div style={{ color: d.color, fontWeight: 600 }}>{d.pct}%</div>
    </div>
  );
};

export default function AssetAllocationPie({ data = [] }) {
  const normalizedData = (data || []).map(d => ({
    ...d,
    name: d.name || d.label || 'Asset',
    label: d.label || d.name || 'Asset',
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%' }}>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={normalizedData}
            cx="50%" cy="50%"
            innerRadius={55} outerRadius={80}
            paddingAngle={3}
            dataKey="value"
            nameKey="name"
          >
            {normalizedData.map((entry, i) => (
              <Cell key={i} fill={entry.color} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {normalizedData.map((d, i) => (
          <div key={d.name || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: d.color, flexShrink: 0 }} />
              <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatLakh(d.value)}</span>
              <span style={{ color: d.color }}>{d.pct}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
