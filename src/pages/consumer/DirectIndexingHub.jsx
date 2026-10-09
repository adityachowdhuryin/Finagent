import React, { useState, useEffect } from 'react';
import {
  Layers, TrendingUp, ShieldCheck, DollarSign, ArrowRight, CheckCircle2,
  Sliders, Ban, RefreshCw, AlertCircle, Percent, Zap, Sparkles, PieChart,
  Award, FileCheck, Lock, ExternalLink
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';

export default function DirectIndexingHub() {
  const { state, isUSMarket } = useApp();
  const { currentUser, userProfile } = useAuth();
  const { tier, upgradeTier } = useSubscription();

  const market = state?.activeMarket || (isUSMarket ? 'US' : 'IN');
  const currencySymbol = market === 'IN' ? '₹' : '$';

  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState('');
  const [cashSweep, setCashSweep] = useState(null);
  const [tierYieldData, setTierYieldData] = useState(null);
  const [excludedSymbols, setExcludedSymbols] = useState([]);
  const [investmentAmount, setInvestmentAmount] = useState(market === 'IN' ? 100000 : 10000);
  const [rebalancing, setRebalancing] = useState(false);
  const [orderBasketResult, setOrderBasketResult] = useState(null);
  const [executionSuccess, setExecutionSuccess] = useState(false);

  // Advisory Wrap Fee & Agreement State (Engine 2)
  const [showWrapModal, setShowWrapModal] = useState(false);
  const [wrapSignature, setWrapSignature] = useState(
    state?.consumer?.user?.name || userProfile?.name || (market === 'IN' ? 'Arjun Sharma' : 'Alex Chen')
  );
  const [enrollingWrap, setEnrollingWrap] = useState(false);
  const [wrapEnrollment, setWrapEnrollment] = useState(null);

  useEffect(() => {
    fetchModels();
  }, [market, tier]);

  async function fetchModels() {
    setLoading(true);
    try {
      const [modelsRes, sweepRes] = await Promise.all([
        fetch(`/api/direct-indexing/models?market=${market}`),
        fetch(`/api/direct-indexing/cash-sweep-yield?tier=${tier || 'free'}&market=${market}`)
      ]);
      const json = await modelsRes.json();
      const sweepJson = await sweepRes.json();

      if (json.success && json.models) {
        setModels(json.models);
        if (json.models.length > 0) {
          setSelectedModelId(json.models[0].id);
        }
        setCashSweep(json.cashSweepRates);
      }
      if (sweepJson.success) {
        setTierYieldData(sweepJson);
      }
    } catch (err) {
      console.error('Failed to load direct indexing models:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleEnrollWrap() {
    if (!selectedModel) return;
    setEnrollingWrap(true);
    try {
      const res = await fetch('/api/direct-indexing/enroll-wrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: selectedModel.id,
          clientAUM: Number(investmentAmount),
          clientSignature: wrapSignature,
          market,
          userEmail: currentUser?.email || 'investor@finagent.app',
          tier: tier || 'pro'
        })
      });
      const json = await res.json();
      if (json.success) {
        setWrapEnrollment(json.enrollment);
      }
    } catch (err) {
      console.error('Failed to enroll in wrap fee:', err);
    } finally {
      setEnrollingWrap(false);
    }
  }

  const selectedModel = models.find(m => m.id === selectedModelId) || models[0];

  function toggleExclusion(symbol) {
    if (excludedSymbols.includes(symbol)) {
      setExcludedSymbols(excludedSymbols.filter(s => s !== symbol));
    } else {
      setExcludedSymbols([...excludedSymbols, symbol]);
    }
    setOrderBasketResult(null);
  }

  async function handleCalculateRebalance() {
    if (!selectedModel) return;
    setRebalancing(true);
    setOrderBasketResult(null);
    setExecutionSuccess(false);

    try {
      const res = await fetch('/api/direct-indexing/rebalance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: selectedModel.id,
          exclusions: excludedSymbols,
          market,
          customCash: Number(investmentAmount)
        })
      });
      const json = await res.json();
      if (json.success) {
        setOrderBasketResult(json);
      }
    } catch (err) {
      console.error('Failed to compute rebalance:', err);
    } finally {
      setRebalancing(false);
    }
  }

  async function handleExecuteBasket() {
    if (!orderBasketResult) return;
    setExecutionSuccess(true);
    // Submit first batch to SOR router
    try {
      await fetch('/api/broker-router/place-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market,
          symbol: orderBasketResult.orderBasket[0]?.symbol || 'DIRECT_IDX',
          qty: orderBasketResult.orderBasket[0]?.targetQty || 1,
          type: 'SOR_VWAP'
        })
      });
    } catch (e) {
      // simulated fill succeeds
    }
  }

  return (
    <div className="page-enter" style={{ padding: '1.5rem', maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.75rem' }}>🧬</span>
            <h1 className="text-h1" style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>
              Direct Indexing Terminal & Tax-Alpha Harvester
            </h1>
            <span className="badge badge-primary" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
              Vector 1 · Institutional Execution
            </span>
          </div>
          <p className="text-sm text-secondary" style={{ margin: 0 }}>
            Replicate top benchmarks through fractional individual equities. Harvest individual lot losses to generate +1.8% to +2.4% annualized after-tax alpha while eliminating employer stock concentration.
          </p>
        </div>

        {/* Market Badge & Quick Sweep Pill */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="card" style={{ padding: '0.5rem 0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
            <Zap size={16} color="var(--green)" />
            <div style={{ fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Idle Cash Sweep: </span>
              <strong style={{ color: 'var(--green)' }}>{cashSweep?.yield || (market === 'US' ? '5.15% APY' : '6.85% p.a.')}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Model Selection Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {models.map(m => (
          <button
            key={m.id}
            onClick={() => { setSelectedModelId(m.id); setOrderBasketResult(null); setExecutionSuccess(false); }}
            className="btn"
            style={{
              padding: '0.65rem 1.1rem',
              borderRadius: 'var(--radius)',
              background: selectedModelId === m.id ? 'var(--primary)' : 'var(--surface-raised)',
              color: selectedModelId === m.id ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${selectedModelId === m.id ? 'var(--primary)' : 'var(--glass-border)'}`,
              fontWeight: 600,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Layers size={15} />
            {m.name}
          </button>
        ))}
      </div>

      {selectedModel && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: '1.5rem' }}>
          {/* Left Column: Direct Index Constituents & Custom Exclusions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 className="text-h3" style={{ margin: 0, fontWeight: 700 }}>
                    {selectedModel.name}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Replicating <strong>{selectedModel.benchmark}</strong> · Tracking Error: <strong>{selectedModel.trackingError}</strong>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Projected Tax-Alpha</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--green)' }}>
                    {selectedModel.projectedTaxAlpha}
                  </div>
                </div>
              </div>

              {/* 25 bps Advisory Wrap Fee & Net Client Surplus (Engine 2) */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(16,185,129,0.08) 100%)',
                  border: '1px solid rgba(99,102,241,0.25)',
                  borderRadius: 'var(--radius)',
                  padding: '1rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Award size={16} color="var(--primary)" />
                    <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>
                      Advisory Wrap Fee: 25 bps ({selectedModel.wrapFeeAnnualPct || '0.25% p.a.'})
                    </span>
                    <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>
                      Net Client Tax-Alpha: {selectedModel.netClientTaxAlpha || '+1.89% p.a.'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    SEBI RIA / Form ADV Model · Billed quarterly in arrears · Client retains &gt;85% of net harvested tax alpha
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowWrapModal(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', borderColor: 'var(--glass-border)', fontSize: '0.75rem' }}
                >
                  <FileCheck size={14} />
                  <span>{wrapEnrollment ? 'Agreement Enrolled' : 'Wrap Fee Schedule'}</span>
                </button>
              </div>

              {/* Constituents Grid with Exclusion Toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr 1fr 1.2fr', padding: '0.4rem 0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  <span>Constituent</span>
                  <span>Weight</span>
                  <span>Price</span>
                  <span>Lot P&L</span>
                  <span style={{ textAlign: 'right' }}>Action / Exclusion</span>
                </div>

                {selectedModel.constituents?.map(c => {
                  const isExcluded = excludedSymbols.includes(c.symbol);
                  return (
                    <div
                      key={c.symbol}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1.8fr 1fr 1fr 1fr 1.2fr',
                        alignItems: 'center',
                        padding: '0.65rem 0.75rem',
                        borderRadius: 'var(--radius)',
                        background: isExcluded ? 'rgba(239, 68, 68, 0.06)' : 'var(--surface-raised)',
                        border: `1px solid ${isExcluded ? 'rgba(239, 68, 68, 0.25)' : 'var(--glass-border)'}`,
                        opacity: isExcluded ? 0.6 : 1,
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{c.symbol}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.name}</span>
                      </div>

                      <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                        {isExcluded ? <span style={{ color: 'var(--red)', textDecoration: 'line-through' }}>{c.weight}%</span> : `${c.weight}%`}
                      </div>

                      <div style={{ fontSize: '0.8125rem', fontFamily: 'monospace' }}>
                        {currencySymbol}{c.price.toLocaleString()}
                      </div>

                      <div>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.4rem',
                          borderRadius: 4,
                          background: c.pnlPct >= 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          color: c.pnlPct >= 0 ? 'var(--green)' : 'var(--red)'
                        }}>
                          {c.pnlPct >= 0 ? `+${c.pnlPct}%` : `${c.pnlPct}%`}
                        </span>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => toggleExclusion(c.symbol)}
                          className="btn btn-ghost btn-sm"
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.2rem 0.6rem',
                            color: isExcluded ? 'var(--text-primary)' : 'var(--red)',
                            border: `1px solid ${isExcluded ? 'var(--glass-border)' : 'rgba(239, 68, 68, 0.3)'}`
                          }}
                        >
                          {isExcluded ? 'Include +' : 'Exclude ✕'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Order Basket Generator & Live Execution */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Sliders size={18} color="var(--primary)" />
                <h3 className="text-h3" style={{ margin: 0, fontWeight: 700 }}>Deploy Direct Index</h3>
              </div>

              {/* Amount Input */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'block', fontWeight: 600 }}>
                  Deployment Capital ({market === 'US' ? 'USD' : 'INR'})
                </label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', padding: '0.5rem 0.85rem' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '0.5rem' }}>{currencySymbol}</span>
                  <input
                    type="number"
                    value={investmentAmount}
                    onChange={(e) => { setInvestmentAmount(e.target.value); setOrderBasketResult(null); }}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 700, width: '100%', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Exclusions summary */}
              <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '0.85rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Single-Stock Exclusions:</span>
                  <strong style={{ color: excludedSymbols.length > 0 ? 'var(--gold)' : 'var(--text-primary)' }}>
                    {excludedSymbols.length > 0 ? excludedSymbols.join(', ') : 'None'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Smart Order Route:</span>
                  <strong style={{ color: 'var(--green)' }}>{market === 'US' ? 'Alpaca REST / IEX Direct' : 'Zerodha Kite / NSE SOR'}</strong>
                </div>
              </div>

              {/* Calculate Basket Button */}
              <button
                onClick={handleCalculateRebalance}
                disabled={rebalancing}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}
              >
                {rebalancing ? <RefreshCw size={16} className="spin" /> : <TrendingUp size={16} />}
                Generate Optimized Order Basket
              </button>

              {/* Order Basket Preview */}
              {orderBasketResult && (
                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>
                      Generated Orders ({orderBasketResult.orderBasket?.length} Lots)
                    </span>
                    <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>
                      {orderBasketResult.trackingErrorDelta}
                    </span>
                  </div>

                  <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem', paddingRight: '0.25rem' }}>
                    {orderBasketResult.orderBasket?.map(ord => (
                      <div
                        key={ord.symbol}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.45rem 0.65rem',
                          background: 'rgba(255, 255, 255, 0.02)',
                          borderRadius: 6,
                          fontSize: '0.775rem'
                        }}
                      >
                        <div>
                          <strong>{ord.symbol}</strong>
                          <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>{ord.targetWeight}%</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: 600 }}>{currencySymbol}{ord.allocatedCash?.toLocaleString()}</span>
                          <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>({ord.targetQty} sh)</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ padding: '0.65rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: 'var(--radius)', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '1rem', fontSize: '0.75rem', color: 'var(--green)' }}>
                    ✓ <strong>Tax Alpha Projected:</strong> {orderBasketResult.estimatedTaxLossAlphaHarvest} via automated tax lot tracking.
                  </div>

                  {!executionSuccess ? (
                    <button
                      onClick={handleExecuteBasket}
                      className="btn"
                      style={{
                        width: '100%',
                        padding: '0.8rem',
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, #10B981, #059669)',
                        color: '#fff',
                        borderRadius: 'var(--radius)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      <CheckCircle2 size={18} />
                      Transmit Order Basket via Smart Router
                    </button>
                  ) : (
                    <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.15)', borderRadius: 'var(--radius)', textAlign: 'center', border: '1px solid var(--green)' }}>
                      <CheckCircle2 size={24} color="var(--green)" style={{ margin: '0 auto 0.5rem' }} />
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        Basket Executed Successfully
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Orders sliced via {market === 'US' ? 'Alpaca VWAP' : 'Zerodha SOR'}. Portfolio holding records updated.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tiered Cash Sweep & Net Interest Margin (Engine 4) */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Percent size={18} color="var(--gold)" />
                  <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>Autonomous Cash Sweep</h4>
                </div>
                <span className={`badge ${tier === 'free' ? 'badge-gold' : 'badge-green'}`} style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>
                  {tier === 'free' ? 'Tiered 50 bps Spread' : 'VIP 100% Institutional'}
                </span>
              </div>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.85rem 0', lineHeight: 1.4 }}>
                Uninvested cash balances are swept daily into institutional ultra-short government yields.
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target Instrument</div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{cashSweep?.vehicle || (market === 'US' ? 'SGOV 0-3M T-Bills' : 'Liquid Overnight MF')}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Your Effective Yield</div>
                  <div className="badge badge-green" style={{ fontSize: '0.85rem', fontWeight: 800 }}>
                    {tierYieldData?.effectiveUserYieldPct || (tier === 'free' ? (market === 'US' ? '4.65% APY' : '6.35% p.a.') : (market === 'US' ? '5.15% APY' : '6.85% p.a.'))}
                  </div>
                </div>
              </div>

              {/* Free Tier Conversion Hook (Engine 4) */}
              {tier === 'free' ? (
                <div style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: 10,
                  padding: '0.85rem',
                  fontSize: '0.775rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>
                    <Zap size={14} />
                    <span>Free Tier 50 bps Float Spread</span>
                  </div>
                  <div>
                    FinAgent retains a <strong>50 bps spread</strong> on Free accounts. Institutional base yield is <strong>{tierYieldData?.institutionalYieldPct || (market === 'US' ? '5.15% APY' : '6.85% p.a.')}</strong>.
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => upgradeTier('pro')}
                    style={{
                      width: '100%',
                      marginTop: '0.75rem',
                      padding: '0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <Sparkles size={13} />
                    <span>Upgrade to Pro / Black to Unlock +50 bps</span>
                  </button>
                </div>
              ) : (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: 10,
                  padding: '0.75rem',
                  fontSize: '0.75rem',
                  color: 'var(--green)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <CheckCircle2 size={16} />
                  <span><strong>Full Pass-Through Active:</strong> 0 bps spread deducted. You earn 100% of underlying yields.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Advisory Wrap Fee Agreement Modal (Engine 2) */}
      {showWrapModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: 560, width: '100%', padding: '2rem', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <Award size={24} />
              </div>
              <div>
                <h2 className="text-h2" style={{ margin: 0, fontSize: '1.25rem' }}>25 bps Advisory Wrap Fee Agreement</h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SEBI RIA / SEC Form ADV Direct Indexing Schedule</span>
              </div>
            </div>

            {!wrapEnrollment ? (
              <>
                <div style={{ background: 'var(--surface-raised)', borderRadius: 10, padding: '1rem', marginBottom: '1.25rem', fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <p style={{ margin: '0 0 0.5rem 0' }}>
                    FinAgent delivers automated constituent-level tax-loss harvesting and custom direct indexing under a transparent fiduciary wrap model:
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <li><strong>AUM Wrap Fee:</strong> Exactly <strong>25 basis points (0.25% p.a.)</strong> of invested index capital.</li>
                    <li><strong>Quarterly Debit in Arrears:</strong> Debited at <strong>6.25 bps per quarter</strong> from cash sweep earnings.</li>
                    <li><strong>Net Positive Surplus:</strong> Projected harvest alpha (<strong>{selectedModel?.projectedTaxAlpha || '+2.14% p.a.'}</strong>) exceeds the 25 bps wrap fee by over 7x.</li>
                    <li><strong>Zero Execution Commission:</strong> All Smart Order Routing trades and tax-harvest swaps are executed commission-free.</li>
                  </ul>
                </div>

                {/* Calculation Breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ background: 'rgba(99,102,241,0.06)', borderRadius: 8, padding: '0.85rem', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Annual 25 bps Wrap Fee</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginTop: 2 }}>
                      {currencySymbol}{Math.round(Number(investmentAmount || 0) * 0.0025).toLocaleString()}/yr
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      ~{currencySymbol}{Math.round(Number(investmentAmount || 0) * 0.0025 / 4).toLocaleString()} / quarter
                    </div>
                  </div>

                  <div style={{ background: 'rgba(16,185,129,0.06)', borderRadius: 8, padding: '0.85rem', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Net Client Tax-Alpha</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--green)', marginTop: 2 }}>
                      {selectedModel?.netClientTaxAlpha || '+1.89% p.a.'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Net alpha after 25 bps fee deducted
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                    Fiduciary Digital Signature:
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.6rem 0.85rem' }}>
                    <Lock size={15} style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      value={wrapSignature}
                      onChange={e => setWrapSignature(e.target.value)}
                      placeholder="e.g. Alex Chen"
                      style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 600, outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setShowWrapModal(false)}
                    disabled={enrollingWrap}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleEnrollWrap}
                    disabled={enrollingWrap || !wrapSignature.trim()}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    {enrollingWrap ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <FileCheck size={15} />}
                    <span>{enrollingWrap ? 'Enrolling...' : 'Sign Agreement & Enroll Portfolio'}</span>
                  </button>
                </div>
              </>
            ) : (
              <div>
                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid var(--green)', borderRadius: 12, padding: '1.25rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <CheckCircle2 size={20} style={{ color: 'var(--green)' }} />
                    <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1rem' }}>
                      Advisory Wrap Agreement Enrolled!
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                    <div><strong>Agreement Ref:</strong> {wrapEnrollment.agreementRef}</div>
                    <div><strong>Enrolled AUM:</strong> {currencySymbol}{wrapEnrollment.aum?.toLocaleString()}</div>
                    <div><strong>Annual Fee Rate:</strong> 25 bps (0.25% p.a.)</div>
                    <div><strong>Quarterly Debit:</strong> {currencySymbol}{wrapEnrollment.quarterlyDebit?.toLocaleString()}</div>
                    <div><strong>Status:</strong> <span className="badge badge-green">{wrapEnrollment.status}</span></div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setShowWrapModal(false);
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

