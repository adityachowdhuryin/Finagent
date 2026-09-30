import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { harvestablePositions, realizedGainsFY26, calculateHarvestingSavings } from '../../utils/taxEngine';
import { formatLakh } from '../../utils/formatters';
import { ExternalLink, AlertTriangle, Info } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { analyze } from '../../services/geminiService';

export default function TaxHarvester() {
  const [selected, setSelected] = useState(new Set(['0', '2', '3']));
  const navigate = useNavigate();
  const { state } = useApp();

  // ── Tab state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('existing');

  // ── Autopilot state ────────────────────────────────────────────────────────
  const [cryptoHoldings, setCryptoHoldings] = useState([]);
  const [newCrypto, setNewCrypto] = useState({ coin: '', qty: 0, avgBuy: 0, currentPrice: 0 });
  const [harvestPlan, setHarvestPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  // ── Existing tab helpers ───────────────────────────────────────────────────
  const toggleSelect = (idx) => {
    const s = new Set(selected);
    if (s.has(String(idx))) s.delete(String(idx));
    else s.add(String(idx));
    setSelected(s);
  };

  const selectedLosses = harvestablePositions
    .filter((_, i) => selected.has(String(i)))
    .map(h => ({ loss: h.loss, type: h.type }));

  const gains = realizedGainsFY26.map(g => ({ gain: g.gain, type: g.type }));
  const stats = calculateHarvestingSavings(gains, selectedLosses);

  const fyDeadline = new Date('2027-03-31');
  const today = new Date();
  const daysLeft = Math.ceil((fyDeadline - today) / (1000 * 60 * 60 * 24));

  // ── Autopilot helpers ──────────────────────────────────────────────────────
  function computeHarvestOpportunities() {
    const holdings = (state?.consumer?.holdings) || {};
    const LTCG_EXEMPTION = 125000;

    const losses = [
      ...(holdings.equities || [])
        .filter(eq => (eq.pnl || 0) < 0)
        .map(eq => ({
          asset: eq.name || eq.symbol,
          type: 'EQUITY',
          units: eq.qty,
          loss: Math.abs(eq.pnl || 0),
          holdingDays: eq.holdingDays || 0,
          gainType: (eq.holdingDays || 0) > 365 ? 'LTCL' : 'STCL',
        })),
      ...(holdings.mutualFunds || [])
        .filter(mf => (mf.pnl || 0) < 0)
        .map(mf => ({
          asset: (mf.name || '').replace(' Direct Growth', ''),
          type: 'MF',
          units: mf.units,
          loss: Math.abs(mf.pnl || 0),
          holdingDays: mf.holdingDays || 400,
          gainType: (mf.holdingDays || 400) > 365 ? 'LTCL' : 'STCL',
        })),
      ...cryptoHoldings
        .filter(c => ((c.currentPrice - c.avgBuy) * c.qty) < 0)
        .map(c => ({
          asset: c.coin,
          type: 'CRYPTO',
          units: c.qty,
          loss: Math.abs((c.currentPrice - c.avgBuy) * c.qty),
          holdingDays: 400,
          gainType: 'CRYPTO_LOSS',
        })),
    ];

    const ltcgGains = [
      ...(holdings.equities || [])
        .filter(eq => (eq.pnl || 0) > 0 && (eq.holdingDays || 0) > 365)
        .map(eq => ({ asset: eq.name || eq.symbol, type: 'EQUITY', gain: eq.pnl || 0, taxRate: 0.125 })),
      ...(holdings.mutualFunds || [])
        .filter(mf => (mf.pnl || 0) > 0 && (mf.holdingDays || 400) > 365)
        .map(mf => ({ asset: (mf.name || '').replace(' Direct Growth', ''), type: 'MF', gain: mf.pnl || 0, taxRate: 0.125 })),
    ];

    const stcgGains = [
      ...(holdings.equities || [])
        .filter(eq => (eq.pnl || 0) > 0 && (eq.holdingDays || 0) <= 365)
        .map(eq => ({ asset: eq.name || eq.symbol, type: 'EQUITY', gain: eq.pnl || 0, taxRate: 0.20 })),
      ...(holdings.mutualFunds || [])
        .filter(mf => (mf.pnl || 0) > 0 && (mf.holdingDays || 400) <= 365)
        .map(mf => ({ asset: (mf.name || '').replace(' Direct Growth', ''), type: 'MF', gain: mf.pnl || 0, taxRate: 0.20 })),
    ];

    const cryptoGains = cryptoHoldings
      .filter(c => ((c.currentPrice - c.avgBuy) * c.qty) > 0)
      .map(c => ({
        asset: c.coin,
        gain: (c.currentPrice - c.avgBuy) * c.qty,
        taxRate: 0.30,
        tds: (c.currentPrice * c.qty) * 0.01,
      }));

    const totalLTCG = ltcgGains.reduce((s, g) => s + g.gain, 0);
    const totalSTCG = stcgGains.reduce((s, g) => s + g.gain, 0);
    const totalCryptoGain = cryptoGains.reduce((s, g) => s + g.gain, 0);

    const ltcgTaxBefore = Math.max(0, totalLTCG - LTCG_EXEMPTION) * 0.125;
    const stcgTaxBefore = totalSTCG * 0.20;
    const cryptoTaxBefore = totalCryptoGain * 0.30;
    const taxBefore = ltcgTaxBefore + stcgTaxBefore + cryptoTaxBefore;

    const stcgAfter = Math.max(0, totalSTCG - losses.filter(l => l.gainType === 'STCL').reduce((s, l) => s + l.loss, 0));
    const ltcgAfter = Math.max(0, totalLTCG - losses.filter(l => l.gainType !== 'STCL' && l.gainType !== 'CRYPTO_LOSS').reduce((s, l) => s + l.loss, 0));
    const stcgTaxAfter = stcgAfter * 0.20;
    const ltcgTaxAfter = Math.max(0, ltcgAfter - LTCG_EXEMPTION) * 0.125;
    const taxAfter = stcgTaxAfter + ltcgTaxAfter + cryptoTaxBefore;
    const taxSaved = Math.max(0, taxBefore - taxAfter);

    return { losses, ltcgGains, stcgGains, cryptoGains, taxBefore, taxAfter, taxSaved, totalLTCG, totalSTCG, LTCG_EXEMPTION };
  }

  async function generateHarvestPlan() {
    setLoadingPlan(true);
    const opp = computeHarvestOpportunities();

    const prompt = `You are a tax expert specializing in Indian capital gains tax. Generate a specific tax loss harvesting transaction sequence.

Portfolio Analysis:
- Total LTCG (Long-term gains): ₹${(opp.totalLTCG / 1000).toFixed(0)}K (taxable above ₹1.25L)
- Total STCG (Short-term gains): ₹${(opp.totalSTCG / 1000).toFixed(0)}K
- Unrealized losses: ${opp.losses.map(l => l.asset + ' ₹' + (l.loss / 1000).toFixed(0) + 'K ' + l.gainType).join(', ') || 'None'}
- Crypto gains: ₹${(opp.cryptoGains.reduce((s, g) => s + g.gain, 0) / 1000).toFixed(0)}K (taxed at 30%)
- LTCG exemption remaining: ₹${Math.max(0, 125000 - opp.totalLTCG) / 1000}K
- Estimated tax saving from harvesting: ₹${(opp.taxSaved / 1000).toFixed(0)}K

Generate a numbered transaction sequence. Return ONLY valid JSON:
{
  "transactions": [
    {
      "step": 1,
      "action": "SELL|BUY",
      "asset": "asset name",
      "reason": "why (max 15 words)",
      "estimatedImpact": "₹X tax saving",
      "executeBy": "date or timeframe",
      "rebuySuggestion": null or "what to rebuy after 30 days"
    }
  ],
  "totalTaxSaving": number,
  "cryptoNote": "note about crypto tax if applicable",
  "importantWarnings": ["warning 1", "warning 2"]
}`;

    try {
      const result = await analyze(prompt, 'json');
      setHarvestPlan({ ...result, opportunities: opp });
    } catch {
      setHarvestPlan({
        transactions: opp.losses.map((l, i) => ({
          step: i + 1,
          action: 'SELL',
          asset: l.asset,
          reason: `Harvest ₹${(l.loss / 1000).toFixed(0)}K ${l.gainType} loss to offset gains`,
          estimatedImpact: `~₹${((l.loss * (l.gainType === 'STCL' ? 0.20 : 0.125)) / 1000).toFixed(0)}K tax saved`,
          executeBy: 'Before March 31',
          rebuySuggestion: 'Wait 30+ days then rebuy equivalent exposure',
        })),
        totalTaxSaving: opp.taxSaved,
        cryptoNote: opp.cryptoGains.length > 0
          ? 'Crypto gains taxed at 30% flat + 1% TDS on sale. Crypto losses CANNOT be offset against non-crypto income.'
          : null,
        importantWarnings: [
          'Consult a CA before executing',
          'Rebuy only after 30+ days to avoid wash sale concerns',
          'Crypto TDS applies on each sale transaction',
        ],
        opportunities: opp,
      });
    } finally {
      setLoadingPlan(false);
    }
  }

  function downloadCSV() {
    if (!harvestPlan?.transactions) return;
    const headers = ['Step', 'Action', 'Asset', 'Reason', 'Tax Impact', 'Execute By', 'Rebuy Suggestion'];
    const rows = harvestPlan.transactions.map(t => [
      t.step, t.action, t.asset, t.reason, t.estimatedImpact, t.executeBy, t.rebuySuggestion || '',
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tax-harvest-plan.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 className="text-h1">🌾 Tax-Loss Harvesting</h1>
          <p className="text-sm text-secondary mt-1">Offset realized gains with unrealized losses before FY end · India LTCG / STCG rules</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.5rem', color: daysLeft < 60 ? 'var(--red)' : 'var(--gold)' }}>{daysLeft} days</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>until FY2026-27 end</div>
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <button
          className={`btn btn-sm ${activeTab === 'existing' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('existing')}
        >
          📊 Tax Analysis
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'autopilot' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('autopilot')}
        >
          🤖 Autopilot
        </button>
      </div>

      {/* ── Existing tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'existing' && (
        <>
          {/* Summary banner */}
          <div className="card card-glow-green" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.04))', display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Potential Tax Saving</div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '2.5rem', color: 'var(--green)', lineHeight: 1 }}>
                ₹{stats.taxSaved.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>with selected positions</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem 2rem', flex: 1 }}>
              {[
                { label: 'Realized STCG this FY', value: `₹${stats.stcgGains.toLocaleString('en-IN')}`, color: 'var(--gold)' },
                { label: 'Realized LTCG this FY', value: `₹${stats.ltcgGains.toLocaleString('en-IN')}`, color: 'var(--gold)' },
                { label: 'Selected losses to harvest', value: `-₹${stats.stcgLosses.toLocaleString('en-IN')}`, color: 'var(--red)' },
                { label: 'Net taxable gain (post harvest)', value: `₹${(stats.netStcgGain + stats.netLtcgGain).toLocaleString('en-IN')}`, color: 'var(--text-primary)' },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                  <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {/* Harvestable losses */}
            <div className="card">
              <h2 className="text-h2" style={{ marginBottom: '0.875rem' }}>Harvestable Positions</h2>
              <p className="text-sm text-secondary" style={{ marginBottom: '1rem' }}>Select positions to harvest. Deselect to exclude.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {harvestablePositions.map((pos, i) => (
                  <div
                    key={i}
                    onClick={() => toggleSelect(i)}
                    style={{
                      background: selected.has(String(i)) ? 'rgba(239,68,68,0.06)' : 'var(--surface-raised)',
                      border: `1px solid ${selected.has(String(i)) ? 'rgba(239,68,68,0.25)' : 'var(--glass-border)'}`,
                      borderRadius: 'var(--radius)', padding: '0.875rem', cursor: 'pointer', transition: 'var(--transition)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <input
                        type="checkbox"
                        checked={selected.has(String(i))}
                        onChange={() => toggleSelect(i)}
                        style={{ marginTop: 3, accentColor: 'var(--primary)', flexShrink: 0 }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{pos.holding}</div>
                          <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--red)', fontSize: '0.9375rem' }}>
                            -₹{Math.abs(pos.loss).toLocaleString('en-IN')}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span className={`badge ${pos.type === 'STCG' ? 'badge-gold' : 'badge-purple'}`}>{pos.type}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pos.holdingDays} days held</span>
                          {pos.washSaleRisk && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: 'var(--gold)' }}>
                              <AlertTriangle size={10} /> Wash-sale window applies
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>{pos.action}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Realized gains this FY */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="card">
                <h2 className="text-h2" style={{ marginBottom: '0.875rem' }}>Realized Gains this FY</h2>
                <table className="data-table">
                  <thead><tr><th>Holding</th><th>Type</th><th>Gain</th><th>Date</th></tr></thead>
                  <tbody>
                    {realizedGainsFY26.map((g, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 500, fontSize: '0.8125rem' }}>{g.holding.replace(' (partial)', '')}</td>
                        <td><span className={`badge ${g.type === 'LTCG' ? 'badge-green' : 'badge-gold'}`}>{g.type}</span></td>
                        <td style={{ color: 'var(--green)', fontWeight: 600 }}>+₹{g.gain.toLocaleString('en-IN')}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{new Date(g.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tax rules reference */}
              <div className="card" style={{ background: 'var(--surface-raised)' }}>
                <h3 className="text-h3" style={{ marginBottom: '0.875rem' }}>Tax Rules Reference</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem' }}>
                  {[
                    ['STCG on Equity/MF', 'Held < 12 months', '20% flat (post Jul 2024)'],
                    ['LTCG on Equity/MF', 'Held ≥ 12 months', '12.5% above ₹1.25L'],
                    ['STCG can offset', 'STCG gains first, then LTCG', 'Set-off allowed'],
                    ['Wash-sale window', "Don't rebuy same security within 30 days", 'IRS-style, India practice'],
                  ].map(([k, v, note], i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{k}</span>
                        <span style={{ color: 'var(--primary-light)' }}>{note}</span>
                      </div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius)', padding: '0.875rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <Info size={14} style={{ flexShrink: 0, marginTop: 1, color: 'var(--gold)' }} />
                  <strong style={{ color: 'var(--gold)' }}>Disclaimer</strong>
                </div>
                This is AI-assisted analysis for informational purposes only. Tax treatment may vary based on your specific situation. Please consult your CA before executing any tax-loss harvesting transactions.
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => navigate('/app/ai-advisor', { state: { initialPrompt: 'Help me harvest capital losses to save tax before March 31.' } })}>
                  🤖 Ask AI for full analysis
                </button>
                <button className="btn btn-secondary" style={{ flex: 1 }}>
                  <ExternalLink size={14} /> Execute on Zerodha
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Autopilot tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'autopilot' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Summary cards */}
          {(() => {
            const opp = computeHarvestOpportunities();
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                <div className="card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Potential Tax Saving</div>
                  <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.5rem', fontWeight: 700, color: 'var(--green)' }}>₹{(opp.taxSaved / 1000).toFixed(0)}K</div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Total Losses Available</div>
                  <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.5rem', fontWeight: 700, color: 'var(--red)' }}>₹{(opp.losses.reduce((s, l) => s + l.loss, 0) / 1000).toFixed(0)}K</div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>LTCG Exemption Used</div>
                  <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.5rem', fontWeight: 700, color: opp.totalLTCG > 125000 ? 'var(--red)' : 'var(--gold)' }}>
                    ₹{(Math.min(opp.totalLTCG, 125000) / 1000).toFixed(0)}K / ₹125K
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Crypto Holdings Input */}
          <div className="card">
            <h3 className="text-h3" style={{ marginBottom: '0.75rem' }}>🪙 Add Crypto Holdings</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Crypto gains are taxed at 30% flat + 1% TDS. Losses cannot offset other income.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {[['coin', 'Coin (BTC, ETH...)', 'text'], ['qty', 'Quantity', 'number'], ['avgBuy', 'Avg Buy Price ₹', 'number'], ['currentPrice', 'Current Price ₹', 'number']].map(([key, label, type]) => (
                <div key={key}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                  <input
                    type={type}
                    value={newCrypto[key]}
                    onChange={e => setNewCrypto(p => ({ ...p, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                    placeholder={key === 'coin' ? 'BTC' : '0'}
                    style={{
                      width: '100%',
                      background: 'var(--surface-raised)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius)',
                      padding: '0.4rem 0.6rem',
                      color: 'var(--text-primary)',
                      fontFamily: 'Space Grotesk',
                    }}
                  />
                </div>
              ))}
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                if (!newCrypto.coin) return;
                setCryptoHoldings(p => [...p, newCrypto]);
                setNewCrypto({ coin: '', qty: 0, avgBuy: 0, currentPrice: 0 });
              }}
            >
              + Add Coin
            </button>
            {cryptoHoldings.length > 0 && (
              <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {cryptoHoldings.map((c, i) => {
                  const pnl = (c.currentPrice - c.avgBuy) * c.qty;
                  return (
                    <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)' }}>
                      <span style={{ fontWeight: 600 }}>{c.coin}</span>
                      <span style={{ fontSize: '0.875rem', color: pnl >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                        {pnl >= 0 ? '+' : ''}₹{Math.abs(pnl).toLocaleString('en-IN')}
                      </span>
                      {pnl > 0 && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Tax: ₹{Math.round(pnl * 0.30).toLocaleString('en-IN')} (30%)
                        </span>
                      )}
                      <button
                        onClick={() => setCryptoHoldings(p => p.filter((_, j) => j !== i))}
                        style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Generate button */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={generateHarvestPlan} disabled={loadingPlan}>
              {loadingPlan ? '⏳ Generating plan...' : '🤖 Generate Autopilot Plan'}
            </button>
            {harvestPlan && (
              <button className="btn btn-ghost" onClick={downloadCSV}>
                📥 Download CSV
              </button>
            )}
          </div>

          {/* Transaction sequence */}
          {harvestPlan && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 className="text-h3">Transaction Sequence</h3>
                <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--green)', fontSize: '1.25rem' }}>
                  ₹{(harvestPlan.totalTaxSaving / 1000).toFixed(0)}K saved
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      {['Step', 'Action', 'Asset', 'Reason', 'Tax Impact', 'Execute By'].map(h => (
                        <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {harvestPlan.transactions.map(t => (
                      <tr key={t.step} style={{ borderBottom: '1px solid var(--glass-border)22' }}>
                        <td style={{ padding: '0.75rem', fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--primary)' }}>{t.step}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span className={`badge ${t.action === 'SELL' ? 'badge-red' : 'badge-green'}`}>{t.action}</span>
                        </td>
                        <td style={{ padding: '0.75rem', fontWeight: 600, fontSize: '0.875rem' }}>{t.asset}</td>
                        <td style={{ padding: '0.75rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', maxWidth: 200 }}>{t.reason}</td>
                        <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'var(--green)', fontWeight: 600 }}>{t.estimatedImpact}</td>
                        <td style={{ padding: '0.75rem', fontSize: '0.8125rem', color: 'var(--gold)' }}>{t.executeBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {harvestPlan.cryptoNote && (
                <div style={{ marginTop: '1rem', padding: '0.875rem', background: 'rgba(245,158,11,0.08)', borderRadius: 'var(--radius)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--gold)', marginBottom: 4 }}>🪙 Crypto Note</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{harvestPlan.cryptoNote}</div>
                </div>
              )}

              {(harvestPlan.importantWarnings || []).length > 0 && (
                <div style={{ marginTop: '0.75rem', padding: '0.875rem', background: 'rgba(239,68,68,0.06)', borderRadius: 'var(--radius)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--red)', marginBottom: 4 }}>⚠️ Important</div>
                  {harvestPlan.importantWarnings.map((w, i) => (
                    <div key={i} style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 2 }}>• {w}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
