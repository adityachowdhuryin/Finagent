import React, { useState, useRef } from 'react';
import {
  BarChart2, LineChart as LineChartIcon, PieChart as PieChartIcon, Sparkles,
  Download, Copy, Check, RefreshCw, Send, ArrowRight, TrendingUp,
  Layers, ShieldAlert, Cpu, Share2
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import html2canvas from 'html2canvas';
import { useApp } from '../../context/AppContext';

const PRESET_QUERIES = [
  "Chart my net worth trajectory over 15 years with 12% equity returns vs 7% inflation",
  "Show my asset class allocation breakdown and recommended rebalance target",
  "Compare 10-year growth of DCA into index funds vs idle cash with inflation drag",
  "Simulate monthly retirement drawdown vs portfolio corpus sustainability to age 90",
  "Sector concentration breakdown across Tech, Financials, Healthcare, and Debt"
];

const COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4',
  '#8b5cf6', '#3b82f6', '#14b8a6', '#f43f5e', '#a855f7'
];

export default function AIReportStudio() {
  const { state } = useApp();
  const market = state.market || 'US';
  const cur = market === 'US' ? '$' : '₹';
  const chartRef = useRef(null);

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [chartSpec, setChartSpec] = useState(() => getInitialChartSpec(market));

  async function handleGenerate(customQuery) {
    const queryToRun = (customQuery || prompt).trim();
    if (!queryToRun) return;

    setLoading(true);
    try {
      const res = await fetch('/api/chart-studio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryToRun,
          prompt: queryToRun,
          market,
          portfolioContext: {
            netWorth: state.consumer?.netWorth?.total || (market === 'US' ? 450000 : 7500000),
            assetBreakdown: state.consumer?.assetBreakdown || [],
            holdingsCount: (state.consumer?.holdings?.equities?.length || 0) + (state.consumer?.holdings?.mutualFunds?.length || 0)
          }
        })
      });

      const data = await res.json();
      const raw = data.spec || data.data;
      if (data.success && raw) {
        setChartSpec({
          title: raw.title || 'Financial Simulation',
          subtitle: raw.subtitle || raw.description || '',
          type: raw.type || raw.chartType || 'area',
          xKey: raw.xKey || raw.xAxisKey || 'year',
          series: raw.series || (raw.dataKeys || []).map(k => ({ key: k.key, name: k.name, color: k.color })),
          data: raw.data || [],
          metrics: raw.metrics || (raw.summaryMetrics || []).map(m => ({ label: m.label, value: m.value, subtext: m.trend })),
          narrative: raw.narrative || raw.description || ''
        });
      }
    } catch (err) {
      console.error('Failed to generate chart spec:', err);
    } finally {
      setLoading(false);
    }
  }

  async function exportPng() {
    if (!chartRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(chartRef.current, {
        scale: 2,
        backgroundColor: '#0f0f23',
        logging: false,
        useCORS: true
      });
      const link = document.createElement('a');
      link.download = `${(chartSpec.title || 'finagent-chart').toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('PNG export failed:', err);
    } finally {
      setDownloading(false);
    }
  }

  function copySpecJson() {
    navigator.clipboard.writeText(JSON.stringify(chartSpec, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function renderChart() {
    if (!chartSpec || !chartSpec.data || chartSpec.data.length === 0) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320, color: 'var(--text-muted)' }}>
          No data available to plot
        </div>
      );
    }

    const { type, data, xKey, series } = chartSpec;

    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={data} margin={{ top: 15, right: 20, left: 20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey={xKey} stroke="var(--text-muted)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} tickFormatter={v => `${cur}${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
              <Tooltip content={<CustomTooltip cur={cur} />} />
              <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
              {(series || []).map((s, idx) => (
                <Bar key={s.key} dataKey={s.key} name={s.name || s.key} fill={s.color || COLORS[idx % COLORS.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={data} margin={{ top: 15, right: 20, left: 20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey={xKey} stroke="var(--text-muted)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} tickFormatter={v => `${cur}${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
              <Tooltip content={<CustomTooltip cur={cur} />} />
              <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
              {(series || []).map((s, idx) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name || s.key}
                  stroke={s.color || COLORS[idx % COLORS.length]}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: s.color || COLORS[idx % COLORS.length] }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={340}>
            <PieChart>
              <Tooltip content={<CustomTooltip cur={cur} isPie />} />
              <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
              <Pie
                data={data}
                dataKey={series?.[0]?.key || 'value'}
                nameKey={xKey || 'name'}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={115}
                paddingAngle={4}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.4)" strokeWidth={1.5} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        );

      case 'area':
      default:
        return (
          <ResponsiveContainer width="100%" height={340}>
            <AreaChart data={data} margin={{ top: 15, right: 20, left: 20, bottom: 25 }}>
              <defs>
                {(series || []).map((s, idx) => {
                  const color = s.color || COLORS[idx % COLORS.length];
                  return (
                    <linearGradient key={`grad-${s.key}`} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey={xKey} stroke="var(--text-muted)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} tickFormatter={v => `${cur}${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
              <Tooltip content={<CustomTooltip cur={cur} />} />
              <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
              {(series || []).map((s, idx) => {
                const color = s.color || COLORS[idx % COLORS.length];
                return (
                  <Area
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.name || s.key}
                    stroke={color}
                    strokeWidth={2.5}
                    fill={`url(#grad-${s.key})`}
                  />
                );
              })}
            </AreaChart>
          </ResponsiveContainer>
        );
    }
  }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 className="text-h1">Dynamic Natural Language Chart Studio</h1>
            <span className="badge badge-primary">✦ Gemini Generative Viz</span>
          </div>
          <p className="text-sm text-secondary mt-1">
            Prompt in plain English to synthesize institutional-grade financial projections, scenario models, and portfolio distributions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={copySpecJson}
            title="Copy Recharts JSON spec"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            {copied ? <Check size={14} color="var(--green)" /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy Spec'}
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={exportPng}
            disabled={downloading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Download size={14} />
            {downloading ? 'Rendering PNG...' : 'Export High-Res PNG'}
          </button>
        </div>
      </div>

      {/* Natural Language Prompt Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <form
          onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}
          style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}
        >
          <div style={{ position: 'relative', flex: 1 }}>
            <Sparkles size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. 'Project my portfolio to age 60 assuming $2,500 monthly additions at 10% returns vs cash'..."
              style={{
                width: '100%',
                padding: '0.85rem 1rem 0.85rem 2.75rem',
                borderRadius: 'var(--radius)',
                background: 'var(--surface-raised)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                fontSize: '0.95rem'
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
            {loading ? 'Synthesizing...' : 'Generate Visual'}
          </button>
        </form>

        {/* Preset Prompt Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.85rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quick Prompts:</span>
          {PRESET_QUERIES.map((q, idx) => (
            <button
              key={idx}
              className="btn btn-ghost btn-xs"
              onClick={() => { setPrompt(q); handleGenerate(q); }}
              style={{
                fontSize: '0.75rem',
                padding: '0.3rem 0.65rem',
                background: 'rgba(255,255,255,0.03)',
                borderColor: 'var(--glass-border)'
              }}
            >
              {q.slice(0, 48)}...
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart Card */}
      <div
        ref={chartRef}
        className="card"
        style={{
          padding: '1.75rem',
          background: 'linear-gradient(180deg, rgba(30, 27, 75, 0.4) 0%, rgba(15, 15, 35, 0.8) 100%)',
          borderColor: 'rgba(99, 102, 241, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}
      >
        {/* Chart Header & Meta Badges */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className="badge badge-surface" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>
                {chartSpec.type?.toUpperCase()} VIZ
              </span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {chartSpec.title || 'Dynamic Visualization'}
              </h2>
            </div>
            {chartSpec.subtitle && (
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: 4, margin: '4px 0 0 0' }}>
                {chartSpec.subtitle}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Engine: Gemini 1.5 Flash</span>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} />
          </div>
        </div>

        {/* Dynamic Recharts Stage */}
        <div style={{ width: '100%', minHeight: 340, marginTop: '0.5rem' }}>
          {renderChart()}
        </div>

        {/* Key Metrics Strip */}
        {chartSpec.metrics && chartSpec.metrics.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(160px, 1fr))`, gap: '0.75rem', marginTop: '0.5rem' }}>
            {chartSpec.metrics.map((m, idx) => (
              <div
                key={idx}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius)',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--glass-border)'
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.label}</div>
                <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.25rem', fontWeight: 700, color: m.color || 'var(--text-primary)', marginTop: 2 }}>
                  {m.value}
                </div>
                {m.subtext && <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>{m.subtext}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Analytical Narrative & Takeaway */}
        {chartSpec.narrative && (
          <div
            style={{
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius)',
              background: 'rgba(99, 102, 241, 0.08)',
              borderLeft: '4px solid var(--primary)',
              marginTop: '0.25rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
              <TrendingUp size={16} color="var(--primary-light)" />
              <strong style={{ fontSize: '0.85rem', color: 'var(--primary-light)' }}>Executive Quantitative Interpretation</strong>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              {chartSpec.narrative}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label, cur, isPie }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div
      style={{
        background: '#151528',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 8,
        padding: '0.75rem 1rem',
        boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
        fontSize: '0.8rem',
        color: '#fff'
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>
        {isPie ? payload[0]?.name : label}
      </div>
      {payload.map((item, idx) => (
        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', color: item.color || item.payload?.fill || '#fff', marginTop: 2 }}>
          <span>{item.name}:</span>
          <span style={{ fontWeight: 700 }}>
            {typeof item.value === 'number' ? `${cur}${item.value.toLocaleString()}` : item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function getInitialChartSpec(market) {
  const isUS = market === 'US';
  const cur = isUS ? '$' : '₹';
  const base = isUS ? 450000 : 7500000;

  return {
    title: "15-Year Compounding Trajectory: 11% Equity vs 6% Balanced vs Cash Drag",
    subtitle: "Assuming disciplined monthly portfolio contribution adjusted for inflation",
    type: "area",
    xKey: "year",
    series: [
      { key: "growth", name: "High-Conviction Equity (11%)", color: "#6366f1" },
      { key: "balanced", name: "Balanced Portfolio (7.5%)", color: "#10b981" },
      { key: "cashDrag", name: "Idle Cash (Inflation Drag -3%)", color: "#ef4444" }
    ],
    data: [
      { year: "Year 1", growth: Math.round(base * 1.11), balanced: Math.round(base * 1.075), cashDrag: Math.round(base * 0.97) },
      { year: "Year 3", growth: Math.round(base * 1.36), balanced: Math.round(base * 1.24), cashDrag: Math.round(base * 0.91) },
      { year: "Year 5", growth: Math.round(base * 1.68), balanced: Math.round(base * 1.43), cashDrag: Math.round(base * 0.85) },
      { year: "Year 7", growth: Math.round(base * 2.07), balanced: Math.round(base * 1.65), cashDrag: Math.round(base * 0.80) },
      { year: "Year 10", growth: Math.round(base * 2.83), balanced: Math.round(base * 2.06), cashDrag: Math.round(base * 0.73) },
      { year: "Year 12", growth: Math.round(base * 3.49), balanced: Math.round(base * 2.38), cashDrag: Math.round(base * 0.69) },
      { year: "Year 15", growth: Math.round(base * 4.78), balanced: Math.round(base * 2.95), cashDrag: Math.round(base * 0.63) }
    ],
    metrics: [
      { label: "15Y Growth Terminal Value", value: `${cur}${(base * 4.78).toLocaleString()}`, color: "var(--primary-light)", subtext: "+378% nominal expansion" },
      { label: "Net Inflation-Adjusted Drag", value: `${cur}${(base * 0.37).toLocaleString()}`, color: "var(--red)", subtext: "Purchasing power burned if left uninvested" },
      { label: "Equity Risk Premium Spread", value: "+3.5% p.a.", color: "var(--green)", subtext: "Sustained hurdle rate over treasuries" }
    ],
    narrative: `Maintaining a disciplined 11% equity exposure yields an estimated 4.78× terminal multiplier over 15 years, outperforming the balanced baseline by ${cur}${(base * 1.83).toLocaleString()}. Conversely, unallocated cash suffers a cumulative purchasing power loss of ~37% under historical 3-5% inflation regimes.`
  };
}
