import React, { useState } from 'react';
import { analyze } from '../../services/geminiService';
import { useApp } from '../../context/AppContext';

const DEMO_HOLDINGS = [
  { name: 'Axis Bluechip Fund', type: 'Equity MF', current: 319600, target: 0, allocation: 'Large Cap Equity' },
  { name: 'Mirae Asset Large Cap', type: 'Equity MF', current: 389378, target: 0, allocation: 'Large Cap Equity' },
  { name: 'HDFC Mid-Cap Opp.', type: 'Equity MF', current: 455370, target: 0, allocation: 'Mid Cap Equity' },
  { name: 'SBI Bluechip Fund', type: 'Equity MF', current: 444789, target: 0, allocation: 'Large Cap Equity' },
  { name: 'ICICI Pru Short Term', type: 'Debt MF', current: 643997, target: 0, allocation: 'Debt' },
  { name: 'HDFC FD', type: 'Fixed Deposit', current: 267750, target: 0, allocation: 'Cash/FD' },
  { name: 'SGB Gold', type: 'Gold Bond', current: 450000, target: 0, allocation: 'Gold' },
];

const RISK_TARGETS = {
  Conservative: { 'Large Cap Equity': 20, 'Mid Cap Equity': 5, 'Debt': 45, 'Gold': 15, 'Cash/FD': 15 },
  Moderate:     { 'Large Cap Equity': 40, 'Mid Cap Equity': 15, 'Debt': 25, 'Gold': 10, 'Cash/FD': 10 },
  Aggressive:   { 'Large Cap Equity': 50, 'Mid Cap Equity': 25, 'Debt': 15, 'Gold': 5,  'Cash/FD': 5  },
};

function fmt(n) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  return `₹${Math.abs(n).toLocaleString('en-IN')}`;
}

export default function Rebalancing() {
  const { state } = useApp();
  const { holdings: h, user } = state.consumer;

  const riskProfile = user?.riskProfile || 'Moderate';
  const suggestedTargets = RISK_TARGETS[riskProfile] || RISK_TARGETS.Moderate;

  // Build holdings array from AppContext
  const realHoldings = [
    ...h.equities.map(eq => ({
      name: eq.name || eq.symbol,
      type: 'Equity',
      current: eq.value || 0,
      target: 0,
      allocation: eq.sector === 'Mid Cap' || eq.sector === 'Small Cap' ? 'Mid Cap Equity' : 'Large Cap Equity',
    })),
    ...h.mutualFunds.map(mf => ({
      name: (mf.name || '').replace(' Direct Growth', '').replace(' (ELSS)', ''),
      type: 'Mutual Fund',
      current: mf.value || 0,
      target: 0,
      allocation: (mf.category || '').toLowerCase().includes('debt') ? 'Debt' : (mf.category || '').toLowerCase().includes('mid') ? 'Mid Cap Equity' : 'Large Cap Equity',
    })),
    ...h.fixedDeposits.map(fd => ({
      name: fd.bank + ' FD',
      type: 'Fixed Deposit',
      current: fd.amount || 0,
      target: 0,
      allocation: 'Cash/FD',
    })),
    ...h.gold.map(g => ({
      name: g.name,
      type: 'Gold',
      current: g.currentValue || 0,
      target: 0,
      allocation: 'Gold',
    })),
  ];

  const [holdings, setHoldings] = useState(realHoldings.length > 0 ? realHoldings : DEMO_HOLDINGS);
  const [targets, setTargets] = useState(suggestedTargets);
  const [aiPlan, setAiPlan] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showTaxModal, setShowTaxModal] = useState(false);

  const total = holdings.reduce((s, hld) => s + hld.current, 0);

  // Compute current totals per allocation bucket for proportional target distribution
  const allocationTotals = holdings.reduce((acc, hld) => {
    acc[hld.allocation] = (acc[hld.allocation] || 0) + hld.current;
    return acc;
  }, {});

  // Compute target amount for each holding based on its allocation bucket
  const holdingsWithTargets = holdings.map(hld => ({
    ...hld,
    target: Math.round(total * (targets[hld.allocation] || 0) / 100 * (hld.current / (allocationTotals[hld.allocation] || 1))),
  }));

  // Compute drift for each holding
  const withDrift = holdingsWithTargets.map(hld => {
    const targetTotal = holdingsWithTargets.reduce((s, h2) => s + h2.target, 0) || total;
    const currentPct = (hld.current / total) * 100;
    const targetPct = (hld.target / targetTotal) * 100;
    const driftPct = currentPct - targetPct;
    const action = Math.abs(hld.current - hld.target) < 5000 ? 'hold' : hld.current > hld.target ? 'sell' : 'buy';
    const amount = hld.current - hld.target;
    return { ...hld, currentPct, targetPct, driftPct, action, amount };
  });

  const sells = withDrift.filter(hld => hld.action === 'sell').sort((a, b) => b.amount - a.amount);
  const buys = withDrift.filter(hld => hld.action === 'buy').sort((a, b) => a.amount - b.amount);

  // Tax estimate (simplified): assume 1yr+ equity gains taxed at 12.5% above ₹1.25L
  const totalSell = sells.reduce((s, hld) => s + hld.amount, 0);
  const estimatedGain = totalSell * 0.35;
  const taxableGain = Math.max(0, estimatedGain - 125000);
  const taxLiability = Math.round(taxableGain * 0.125);

  async function generateAIPlan() {
    setAiLoading(true);
    const prompt = `Generate a concise mutual fund rebalancing plan for an Indian investor.
Portfolio total: ${fmt(total)}
Risk Profile: ${riskProfile}
Target Allocation: ${Object.entries(targets).map(([k, v]) => `${k}: ${v}%`).join(', ')}
Sells needed: ${sells.map(hld => `${hld.name}: sell ${fmt(Math.abs(hld.amount))}`).join(', ') || 'None'}
Buys needed: ${buys.map(hld => `${hld.name}: buy ${fmt(Math.abs(hld.amount))}`).join(', ') || 'None'}
Estimated LTCG tax: ₹${taxLiability.toLocaleString('en-IN')}

Provide a 4-step execution plan with specific order (what to sell first, tax tips, timing advice). Max 120 words, use ₹ amounts.`;
    try {
      const r = await analyze(prompt);
      setAiPlan(r);
    } catch {
      setAiPlan(`**Step 1 — Sell overweight holdings first:**\nRedeem ${sells[0] ? fmt(Math.abs(sells[0].amount)) + ' from ' + sells[0].name : 'overweight funds'} to raise cash.\n\n**Step 2 — Wait 1 business day** for redemption to credit.\n\n**Step 3 — Deploy into underweight funds:**\n${buys.map(hld => `Buy ${fmt(Math.abs(hld.amount))} of ${hld.name}`).join(', ') || 'No buys needed'}.\n\n**Step 4 — Tax note:**\nThis rebalance triggers ~₹${taxLiability.toLocaleString('en-IN')} in LTCG tax. If you're near the ₹1.25L annual exemption limit, consider spreading the sale across two financial years.`);
    }
    setAiLoading(false);
  }

  const targetTotal = Object.values(targets).reduce((s, v) => s + v, 0);

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 className="text-h1">⚖️ Portfolio Rebalancer</h1>
          <p className="text-sm text-secondary mt-1">Drift analysis · Tax-aware · AI execution plan</p>
        </div>
        <div style={{ display: 'flex', gap: '0.625rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowTaxModal(true)}>🧾 Tax Impact</button>
          <button className="btn btn-primary btn-sm" onClick={generateAIPlan} disabled={aiLoading}>
            {aiLoading ? 'Planning…' : '✦ Generate Plan'}
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
        {[
          { label: 'Portfolio Value', value: fmt(total), color: 'var(--primary-light)' },
          { label: 'Sell Orders', value: `${sells.length} funds`, sub: fmt(totalSell), color: 'var(--red)' },
          { label: 'Buy Orders', value: `${buys.length} funds`, sub: fmt(buys.reduce((s, hld) => s + Math.abs(hld.amount), 0)), color: 'var(--green)' },
          { label: 'Est. LTCG Tax', value: `₹${taxLiability.toLocaleString('en-IN')}`, color: 'var(--gold)' },
        ].map((k, i) => (
          <div key={i} className="card" style={{ padding: '0.875rem' }}>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.125rem', color: k.color }}>{k.value}</div>
            {k.sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>{k.sub} to reallocate</div>}
          </div>
        ))}
      </div>

      {/* Editable Target Allocation card */}
      <div className="card" style={{ marginBottom: '0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 className="text-h3">Target Allocation ({riskProfile})</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => setTargets(suggestedTargets)}>Reset to {riskProfile}</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem' }}>
          {Object.entries(targets).map(([label, pct]) => (
            <div key={label} style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '0.5rem 0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="number" min={0} max={100} value={pct}
                  onChange={e => setTargets(prev => ({ ...prev, [label]: Number(e.target.value) }))}
                  style={{ width: 48, background: 'transparent', border: 'none', color: 'var(--text-primary)', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1rem' }}
                />
                <span style={{ color: 'var(--text-muted)' }}>%</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Total: {targetTotal}% {targetTotal !== 100 && <span style={{ color: 'var(--red)' }}>(must equal 100%)</span>}
        </div>
      </div>

      {/* Drift table */}
      <div className="card">
        <h3 className="text-h3" style={{ marginBottom: '1rem' }}>Allocation Drift</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Fund / Asset</th>
                <th style={{ textAlign: 'right' }}>Current</th>
                <th style={{ textAlign: 'right' }}>Target</th>
                <th>Drift</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {withDrift.map((hld, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{hld.name}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{hld.type}</div>
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'Space Grotesk' }}>
                    <div>{fmt(hld.current)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{hld.currentPct.toFixed(1)}%</div>
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'Space Grotesk', color: 'var(--text-secondary)' }}>
                    <div>{fmt(hld.target)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{hld.targetPct.toFixed(1)}%</div>
                  </td>
                  <td style={{ width: 140 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <div style={{
                        height: 6, flex: 1, borderRadius: 3,
                        background: 'var(--surface-raised)', overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%', width: `${Math.min(100, Math.abs(hld.driftPct) * 5)}%`,
                          background: Math.abs(hld.driftPct) > 3 ? (hld.driftPct > 0 ? 'var(--red)' : 'var(--green)') : 'var(--text-muted)',
                          borderRadius: 3,
                        }} />
                      </div>
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 600, minWidth: 36,
                        color: Math.abs(hld.driftPct) > 3 ? (hld.driftPct > 0 ? 'var(--red)' : 'var(--green)') : 'var(--text-muted)'
                      }}>
                        {hld.driftPct > 0 ? '+' : ''}{hld.driftPct.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {hld.action === 'sell' && (
                      <span className="badge badge-red" style={{ fontSize: '0.6875rem' }}>
                        SELL {fmt(Math.abs(hld.amount))}
                      </span>
                    )}
                    {hld.action === 'buy' && (
                      <span className="badge badge-green" style={{ fontSize: '0.6875rem' }}>
                        BUY {fmt(Math.abs(hld.amount))}
                      </span>
                    )}
                    {hld.action === 'hold' && (
                      <span className="badge" style={{ fontSize: '0.6875rem', background: 'var(--surface-raised)', color: 'var(--text-muted)' }}>HOLD</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Current vs Target allocation reference */}
      <div className="card">
        <h3 className="text-h3" style={{ marginBottom: '1rem' }}>Current vs Target by Bucket</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {Object.entries(targets).map(([label, targetPct], i) => {
            const currentAmt = holdings
              .filter(hld => hld.allocation === label)
              .reduce((s, hld) => s + hld.current, 0);
            const currentPct = total > 0 ? (currentAmt / total) * 100 : 0;
            const drift = currentPct - targetPct;
            const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#f59e0b', '#64748b'];
            return (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.3rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <span>
                    <span style={{ fontWeight: 700, color: Math.abs(drift) > 3 ? (drift > 0 ? 'var(--red)' : 'var(--green)') : 'var(--text-primary)' }}>
                      {currentPct.toFixed(1)}%
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}> / {targetPct}% target</span>
                  </span>
                </div>
                <div className="progress-bar" style={{ position: 'relative' }}>
                  <div className="progress-fill" style={{ width: `${currentPct}%`, background: colors[i % colors.length] }} />
                  <div style={{
                    position: 'absolute', left: `${targetPct}%`, top: 0, bottom: 0,
                    width: 2, background: 'rgba(255,255,255,0.4)', transform: 'translateX(-50%)'
                  }} />
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          White line = target. Bar fill = current. Red/green drift = overweight/underweight.
        </div>
      </div>

      {/* AI Plan */}
      {(aiPlan || aiLoading) && (
        <div className="card" style={{ borderColor: 'rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.04)' }}>
          <h3 className="text-h3" style={{ marginBottom: '1rem' }}>✦ AI Rebalancing Plan</h3>
          {aiLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <div style={{ width: 18, height: 18, border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              Generating AI execution plan…
            </div>
          ) : (
            <>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}
                dangerouslySetInnerHTML={{ __html: aiPlan.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text-primary)">$1</strong>') }} />
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                <button className="btn btn-primary btn-sm" onClick={() => window.print()}>📄 Download PDF</button>
                <button className="btn btn-ghost btn-sm">📧 Send to Advisor</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tax Impact Modal */}
      {showTaxModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: 420 }}>
            <h3 className="text-h3" style={{ marginBottom: '1rem' }}>🧾 Tax Impact Preview</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              {[
                { label: 'Total proceeds from sells', value: fmt(totalSell) },
                { label: 'Estimated capital gain (35%)', value: fmt(estimatedGain) },
                { label: 'LTCG exemption (Section 112A)', value: '₹1,25,000' },
                { label: 'Taxable LTCG', value: fmt(taxableGain), highlight: true },
                { label: 'LTCG tax @ 12.5%', value: `₹${taxLiability.toLocaleString('en-IN')}`, highlight: true },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                  <span style={{ fontWeight: row.highlight ? 700 : 400, color: row.highlight ? 'var(--gold)' : 'var(--text-primary)' }}>{row.value}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--primary-glow)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              💡 <strong style={{ color: 'var(--primary-light)' }}>Tip:</strong> If FY25-26 LTCG is near ₹1.25L, defer some sells to April 1 to reset the exemption.
            </div>
            <button className="btn btn-ghost" style={{ width: '100%', marginTop: '1rem' }} onClick={() => setShowTaxModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
