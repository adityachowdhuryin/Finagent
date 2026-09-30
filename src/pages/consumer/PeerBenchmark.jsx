import React, { useState } from 'react';
import { RefreshCw, Users } from 'lucide-react';
import { analyze } from '../../services/geminiService';
import { useApp } from '../../context/AppContext';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

export default function PeerBenchmark() {
  const { state } = useApp();
  const { user, netWorth, assetBreakdown, holdings, goals } = state.consumer;

  // Compute real values from state
  const totalMFValue = holdings.mutualFunds.reduce((s, f) => s + (f.value || 0), 0);
  const estimatedMonthlySIP = Math.round(totalMFValue / 36);
  const savingsRatePct = user.income > 0 ? Math.round((estimatedMonthlySIP * 12 / user.income) * 100) : 20;

  const equityBreakdown = assetBreakdown.find(a => a.label === 'Equity' || a.label === 'Mutual Funds');
  const equityPct = equityBreakdown ? Math.round(equityBreakdown.pct) : 45;

  const totalInsuranceCover = holdings.insurance.reduce((s, i) => s + (i.sumAssured || 0), 0);

  const liquidAssets = holdings.fixedDeposits.reduce((s, fd) => s + fd.amount, 0);
  const estimatedMonthlyExpenses = user.income ? user.income * 0.6 / 12 : 50000;
  const emergencyMonths = Math.round(liquidAssets / estimatedMonthlyExpenses);

  // Build initial DEMO_DATA from real user data
  const DEMO_DATA = {
    profile: {
      age: user.age || 30,
      city: user.city || 'India',
      profession: 'Investor',
      income: user.income ? `₹${(user.income / 100000).toFixed(0)}L` : 'N/A',
    },
    cohortSize: 12847,
    dimensions: [
      { metric: 'Savings Rate', user: Math.min(100, savingsRatePct), peer: 54, unit: '%' },
      { metric: 'Equity Allocation', user: equityPct, peer: 58, unit: '%' },
      { metric: 'Insurance Coverage', user: totalInsuranceCover > 0 ? Math.min(100, Math.round(totalInsuranceCover / (user.income || 500000) * 10)) : 40, peer: 65, unit: '%' },
      { metric: 'Goal Progress', user: goals.length > 0 ? Math.round(goals.reduce((s, g) => s + (g.progress || 0), 0) / goals.length) : 50, peer: 61, unit: '%' },
      { metric: 'Emergency Fund', user: Math.min(100, emergencyMonths * 10), peer: 55, unit: 'months' },
      { metric: 'Diversification', user: Math.min(100, assetBreakdown.length * 15), peer: 70, unit: 'score' },
    ],
    percentiles: { overall: 61, savingsRate: 65, equityAllocation: 40, insuranceCoverage: 30, goalProgress: 58 },
    narrative: `You are a ${user.age || 30}-year-old investor in ${user.city || 'India'} with a net worth of ₹${((netWorth.total || 0) / 100000).toFixed(1)}L. Your savings rate of ~${savingsRatePct}% and equity allocation of ${equityPct}% are being benchmarked against your peer cohort. Click "Refresh with AI" for a detailed, personalized analysis.`,
    recommendations: [
      { priority: 'High', action: 'Get a detailed AI peer analysis', reason: 'Click "Refresh with AI" to see your actual standing vs peers', badge: 'badge-gold' },
    ],
  };

  const [data, setData] = useState(DEMO_DATA);
  const [loading, setLoading] = useState(false);

  async function generateComparison() {
    setLoading(true);
    try {
      const prompt = `You are a financial benchmarking AI. Compare this Indian investor's portfolio against their anonymized peer cohort.

User Profile:
- Age: ${user.age || 'N/A'}, ${user.city || 'India'}, Income: ₹${(user.income || 0).toLocaleString('en-IN')}/year
- Net Worth: ₹${(netWorth.total || 0).toLocaleString('en-IN')}
- Savings Rate: ~${savingsRatePct}%
- Equity Allocation: ${equityPct}% of portfolio
- Insurance Cover: ${totalInsuranceCover > 0 ? '₹' + (totalInsuranceCover / 100000).toFixed(0) + 'L' : 'Unknown'}
- Emergency Fund: ~${emergencyMonths} months of expenses
- Goals: ${goals.map(g => g.name).join(', ') || 'Not set'}
- Risk Profile: ${user.riskProfile || 'Moderate'}

Return JSON with this exact structure:
{
  "cohortSize": number,
  "dimensions": [
    { "metric": "Savings Rate", "user": number (0-100), "peer": number (0-100), "unit": "%" },
    { "metric": "Equity Allocation", "user": number, "peer": number, "unit": "%" },
    { "metric": "Insurance Coverage", "user": number, "peer": number, "unit": "%" },
    { "metric": "Goal Progress", "user": number, "peer": number, "unit": "%" },
    { "metric": "Emergency Fund", "user": number, "peer": number, "unit": "months" },
    { "metric": "Diversification", "user": number, "peer": number, "unit": "score" }
  ],
  "percentiles": { "overall": number, "savingsRate": number, "equityAllocation": number, "insuranceCoverage": number, "goalProgress": number },
  "narrative": "3-4 sentence analysis with specific numbers and honest gaps about THIS user's situation",
  "recommendations": [
    { "priority": "High|Medium|Low", "action": "specific action", "reason": "why vs peers", "badge": "badge-red|badge-gold|badge-surface" }
  ]
}
Return ONLY valid JSON.`;

      const result = await analyze(prompt, 'json');
      if (result && result.dimensions) {
        setData({ ...DEMO_DATA, ...result, profile: DEMO_DATA.profile });
      }
    } catch { /* keep demo data */ }
    finally { setLoading(false); }
  }

  const radarData = data.dimensions.map(d => ({ subject: d.metric, You: d.user, Peers: d.peer }));
  const overall = data.percentiles?.overall || 61;

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div>
          <h1 className="text-h1">🤝 Peer Benchmark</h1>
          <p className="text-sm text-secondary mt-1">How do you compare to {data.cohortSize?.toLocaleString()} similar investors?</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={generateComparison} disabled={loading}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {loading ? 'Analyzing…' : 'Refresh with AI'}
        </button>
      </div>

      {/* Cohort profile */}
      <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <Users size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Your Peer Cohort</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 2 }}>
            {data.profile.age}-year-old investor in {data.profile.city} · Income: {data.profile.income} · {data.cohortSize?.toLocaleString()} investors
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '0.5rem 1rem', background: 'var(--primary-glow)', borderRadius: 'var(--radius)', border: '1px solid rgba(99,102,241,0.25)' }}>
          <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-light)' }}>{overall}<span style={{ fontSize: '1rem' }}>th</span></div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Overall Percentile</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {/* Radar chart */}
        <div className="card">
          <h3 className="text-h3" style={{ marginBottom: '1rem' }}>Portfolio Radar</h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--glass-border)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Radar name="You" dataKey="You" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.25} strokeWidth={2} />
              <Radar name="Peers" dataKey="Peers" stroke="var(--text-muted)" fill="var(--text-muted)" fillOpacity={0.1} strokeWidth={1} strokeDasharray="4 2" />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', fontSize: '0.8125rem' }} />
            </RadarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><span style={{ width: 12, height: 3, background: 'var(--primary)', borderRadius: 1, display: 'inline-block' }} /> You</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><span style={{ width: 12, height: 3, background: 'var(--text-muted)', borderRadius: 1, display: 'inline-block' }} /> Peers</span>
          </div>
        </div>

        {/* Dimension bars */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <h3 className="text-h3">Dimension Breakdown</h3>
          {data.dimensions.map((d, i) => {
            const diff = d.user - d.peer;
            const ahead = diff >= 0;
            return (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.8125rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{d.metric}</span>
                  <span style={{ color: ahead ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                    {ahead ? '+' : ''}{diff.toFixed(0)} vs peers
                  </span>
                </div>
                <div style={{ position: 'relative', height: 6, background: 'var(--surface-raised)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${d.peer}%`, background: 'var(--glass-border)', borderRadius: 999 }} />
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${d.user}%`, background: ahead ? 'var(--green)' : 'var(--red)', borderRadius: 999, transition: 'width 1s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  <span>You: {d.user}</span><span>Peers: {d.peer}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Narrative */}
      <div className="card" style={{ borderLeft: '3px solid var(--primary)' }}>
        <h3 className="text-h3" style={{ marginBottom: '0.625rem' }}>✦ AI Analysis</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{data.narrative}</p>
      </div>

      {/* Recommendations */}
      <div className="card">
        <h3 className="text-h3" style={{ marginBottom: '0.875rem' }}>Recommended Actions</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {data.recommendations?.map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', alignItems: 'flex-start' }}>
              <span className={`badge ${r.badge}`} style={{ flexShrink: 0, marginTop: 2 }}>{r.priority}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.2rem' }}>{r.action}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{r.reason}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
