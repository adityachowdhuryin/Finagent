import React, { useState, useEffect } from 'react';
import { Scissors, AlertCircle, ArrowRight, ShieldCheck, Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export default function USTaxLossHarvester() {
  const { state } = useApp();
  const [selectedSymbol, setSelectedSymbol] = useState('VOO');
  const [shares, setShares] = useState(100);
  const [purchasePrice, setPurchasePrice] = useState(520);
  const [currentPrice, setCurrentPrice] = useState(465);
  const [harvestResult, setHarvestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [executed, setExecuted] = useState(false);

  useEffect(() => {
    runHarvestAnalysis();
  }, [selectedSymbol, shares, purchasePrice, currentPrice]);

  async function runHarvestAnalysis() {
    setLoading(true);
    setExecuted(false);
    try {
      const res = await fetch('http://localhost:3001/api/us-wash-sale/harvest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: selectedSymbol,
          shares: Number(shares),
          purchasePrice: Number(purchasePrice),
          currentPrice: Number(currentPrice),
          taxBracketFederal: 0.32,
          taxBracketState: 0.093,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setHarvestResult(data);
      }
    } catch (err) {
      console.error('Wash-sale harvest error:', err);
    } finally {
      setLoading(false);
    }
  }

  const sampleLots = [
    { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', shares: 100, cost: 520, ltp: 465, loss: 5500 },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', shares: 80, cost: 135, ltp: 118, loss: 1360 },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust', shares: 50, cost: 505, ltp: 470, loss: 1750 },
  ];

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            <span>🇺🇸</span> IRS CODE § 1091 COMPLIANT
          </div>
          <h1 className="text-h1">IRS Wash-Sale Tax-Loss Harvester</h1>
          <p className="text-sm text-secondary mt-1">Harvest unrealized losses, write off up to $3,000 in ordinary income, and maintain market exposure via proxy ETFs</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {sampleLots.map(lot => (
            <button
              key={lot.symbol}
              onClick={() => {
                setSelectedSymbol(lot.symbol);
                setShares(lot.shares);
                setPurchasePrice(lot.cost);
                setCurrentPrice(lot.ltp);
              }}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem' }}
            >
              Scan {lot.symbol} (-${lot.loss.toLocaleString()})
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Parameters & Alpha Harvest Card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Left: Position Details */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 className="text-h3">Unrealized Loss Position</h3>

          <div>
            <label className="text-xs text-muted">Stock / ETF Ticker</label>
            <input
              type="text"
              value={selectedSymbol}
              onChange={e => setSelectedSymbol(e.target.value.toUpperCase())}
              style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontWeight: 700 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="text-xs text-muted">Shares</label>
              <input
                type="number"
                value={shares}
                onChange={e => setShares(Number(e.target.value))}
                style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="text-xs text-muted">Cost Basis ($)</label>
              <input
                type="number"
                value={purchasePrice}
                onChange={e => setPurchasePrice(Number(e.target.value))}
                style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="text-xs text-muted">Current LTP ($)</label>
              <input
                type="number"
                value={currentPrice}
                onChange={e => setCurrentPrice(Number(e.target.value))}
                style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          {harvestResult?.summary && (
            <div style={{ background: 'var(--surface-raised)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: 4 }}>
                <span className="text-muted">Total Cost Basis:</span>
                <strong>${harvestResult.summary.costBasis.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: 4 }}>
                <span className="text-muted">Current Market Value:</span>
                <strong>${harvestResult.summary.currentVal.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span className="text-muted">Unrealized Capital Loss:</span>
                <strong style={{ color: 'var(--red)' }}>-${harvestResult.summary.unrealizedLoss.toLocaleString()}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Right: Net Tax Alpha Shield */}
        {harvestResult?.summary && (
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), var(--surface))',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '1rem'
          }}>
            <div>
              <div className="text-xs text-muted">Total Tax Shield Generated (Fed + CA State)</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: '#4ade80', margin: '0.25rem 0' }}>
                +${harvestResult.summary.estimatedTaxShield.toLocaleString()}
              </div>
              <p className="text-xs text-secondary">
                At your combined {harvestResult.summary.combinedMarginalRate}% marginal tax rate, selling this lot writes off <strong>${harvestResult.summary.ordinaryIncomeOffset.toLocaleString()}</strong> of W-2 ordinary income (saving ${harvestResult.summary.ordinaryTaxSaved.toLocaleString()} directly), plus <strong>${harvestResult.summary.capitalGainsOffset.toLocaleString()}</strong> of capital gains.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ background: 'var(--surface-raised)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)' }}>
                <div className="text-xs text-muted">Ordinary Income Offset</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: 'var(--primary)' }}>
                  ${harvestResult.summary.ordinaryIncomeOffset.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>IRS Annual Max: $3,000</div>
              </div>

              <div style={{ background: 'var(--surface-raised)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)' }}>
                <div className="text-xs text-muted">Safe Re-Entry Date</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: '#f59e0b' }}>
                  {harvestResult.washSaleRules.safeReentryDate}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>31-Day Rule (§ 1091)</div>
              </div>
            </div>

            <button
              onClick={() => setExecuted(true)}
              disabled={executed}
              className="btn btn-primary"
              style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}
            >
              {executed ? <><CheckCircle2 size={16} /> Harvest Executed (Calendar Reminder Set)</> : <><Sparkles size={16} /> Execute Wash-Sale Harvest & Swap Proxy</>}
            </button>
          </div>
        )}
      </div>

      {/* Proxy ETF Replacement Recommendation Matrix */}
      {harvestResult?.proxyReplacements && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 className="text-h3">IRS-Compliant Proxy Replacement Matrix</h3>
              <p className="text-xs text-secondary">
                To avoid the IRS Section 1091 Wash-Sale penalty, you cannot buy a "substantially identical" security within 30 days. Deploy into these correlated proxy ETFs to keep market exposure.
              </p>
            </div>
            <span className="badge badge-primary">0% Market Downtime</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {harvestResult.proxyReplacements.map((proxy, i) => (
              <div key={i} style={{ padding: '1rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--primary)' }}>{proxy.symbol}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{proxy.name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#4ade80' }}>
                      {(proxy.correlation * 100).toFixed(1)}%
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Correlation</div>
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.75rem 0' }}>
                  {proxy.rationale}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                  <span className="text-muted">Exp Ratio: <strong>{proxy.expRatio}%</strong></span>
                  <button className="btn btn-secondary btn-sm" style={{ fontSize: '0.7rem' }}>
                    Deploy ${harvestResult.summary.currentVal.toLocaleString()}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
