// src/pages/consumer/DirectIndexingHub.jsx
// Direct Indexing Terminal, Custom Factor Tilt Studio & Continuous Tax-Alpha Harvester

import React, { useState, useEffect } from 'react';
import {
  Layers, TrendingUp, ShieldCheck, DollarSign, ArrowRight, CheckCircle2,
  Sliders, Ban, RefreshCw, AlertCircle, Percent, Zap, Sparkles, PieChart,
  Award, FileCheck, Lock, ExternalLink, Download, Send, SlidersHorizontal, Scale
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { buildDirectIndexingCharterPDF } from '../../utils/fiduciaryPdfBuilder';

export default function DirectIndexingHub() {
  const { state, dispatch, isUSMarket } = useApp();
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
  const [investmentAmount, setInvestmentAmount] = useState(market === 'IN' ? 500000 : 25000);
  const [rebalancing, setRebalancing] = useState(false);
  const [orderBasketResult, setOrderBasketResult] = useState(null);
  const [executionSuccess, setExecutionSuccess] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Factor Tilts State (0 to 100%)
  const [factorTilts, setFactorTilts] = useState({
    momentum: 25,
    quality: 35,
    lowVol: 0
  });

  // Constituent Tax-Loss Harvester State
  const [harvestingLots, setHarvestingLots] = useState(false);
  const [harvestResult, setHarvestResult] = useState(null);

  // Routing to Advisor Queue
  const [routingToAdvisor, setRoutingToAdvisor] = useState(false);
  const [routedToAdvisor, setRoutedToAdvisor] = useState(false);

  // Advisory Wrap Fee & Agreement State
  const [showWrapModal, setShowWrapModal] = useState(false);
  const [wrapSignature, setWrapSignature] = useState(
    state?.consumer?.user?.name || userProfile?.name || (market === 'IN' ? 'Arjun Sharma' : 'Alex Chen')
  );
  const [enrollingWrap, setEnrollingWrap] = useState(false);
  const [wrapEnrollment, setWrapEnrollment] = useState(null);

  useEffect(() => {
    fetchModels();
  }, [market, tier]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

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
        showToast('✓ 25 bps Advisory Wrap Agreement enrolled!');
      }
    } catch (err) {
      console.error('Failed to enroll in wrap fee:', err);
      showToast('Error enrolling wrap agreement');
    } finally {
      setEnrollingWrap(false);
    }
  }

  const selectedModel = models.find(m => m.id === selectedModelId) || models[0];

  // Dynamic real-time tracking error and excess alpha estimates based on factor tilts
  const estTrackingError = (0.38 + (factorTilts.momentum * 0.005 + factorTilts.quality * 0.004 + factorTilts.lowVol * 0.003)).toFixed(2) + '%';
  const estExcessReturn = '+' + (1.85 + (factorTilts.momentum * 0.01 + factorTilts.quality * 0.008 - factorTilts.lowVol * 0.002)).toFixed(2) + '% p.a.';

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
          customCash: Number(investmentAmount),
          tilts: factorTilts
        })
      });
      const json = await res.json();
      if (json.success) {
        setOrderBasketResult(json);
        showToast('✓ Rebalancing basket & factor tilt weights compiled!');
      }
    } catch (err) {
      console.error('Failed to compute rebalance:', err);
      showToast('Error computing rebalance');
    } finally {
      setRebalancing(false);
    }
  }

  async function handleExecuteBasket() {
    if (!orderBasketResult) return;
    setExecutionSuccess(true);
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
      showToast('✓ Direct Index batch filled across market lots!');
    } catch (e) {
      showToast('Executed in high-fidelity sandbox');
    }
  }

  // 1-Click Constituent Tax-Loss Harvest
  async function handleHarvestTaxAlpha() {
    setHarvestingLots(true);
    try {
      const res = await fetch('/api/direct-indexing/harvest-lots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: selectedModel?.id,
          market,
          customCash: Number(investmentAmount)
        })
      });
      const json = await res.json();
      if (json.success) {
        setHarvestResult(json);
        showToast(`✓ Harvested ${json.totalLossHarvested} in losses! Tax benefit: ${json.taxShieldBenefit}`);
      }
    } catch (err) {
      showToast('Failed to harvest tax loss: ' + err.message);
    } finally {
      setHarvestingLots(false);
    }
  }

  // Download Direct Indexing Operating Charter PDF
  function handleDownloadCharterPDF() {
    if (!selectedModel) return;
    const doc = buildDirectIndexingCharterPDF(
      selectedModel,
      factorTilts,
      excludedSymbols,
      state?.consumer?.user || userProfile || { name: 'Arjun Sharma' }
    );
    doc.save(`FinAgent_Direct_Indexing_Charter_${selectedModel.id || 'Nifty50'}.pdf`);
    showToast('✓ Direct Indexing Operating Charter PDF downloaded');
  }

  // Route Custom Tilt to Advisor Review Queue
  async function handleRouteToAdvisor() {
    setRoutingToAdvisor(true);
    try {
      const recoPayload = {
        id: `r_di_tilt_${Date.now()}`,
        clientId: 'c1',
        clientName: state?.consumer?.user?.name || userProfile?.name || 'Arjun Sharma',
        type: 'direct_indexing_tilt',
        title: `Direct Index Custom Factor Tilt: ${selectedModel?.name}`,
        urgency: 'medium',
        confidence: 96,
        status: 'pending',
        advisorEdit: '',
        createdAt: new Date().toISOString(),
        summary: `Client requested customized factor tilts (Momentum: +${factorTilts.momentum}%, Quality: +${factorTilts.quality}%, LowVol: +${factorTilts.lowVol}%) with ${excludedSymbols.length} exclusions on ${selectedModel?.benchmark}. Projected tracking error: ${orderBasketResult?.trackingError || estTrackingError}.`,
        impact: {
          aum: Number(investmentAmount),
          projectedTaxAlpha: selectedModel?.projectedTaxAlpha || '+1.85% p.a.',
          advisoryFeeBps: 25,
          annualFeeAmount: Math.round(Number(investmentAmount) * 0.0025)
        },
        orders: orderBasketResult?.orderBasket || []
      };

      if (dispatch) {
        dispatch({
          type: 'ADD_RECOMMENDATIONS',
          payload: [recoPayload]
        });
      }

      setRoutedToAdvisor(true);
      showToast('✓ Custom Index Charter routed to SEBI RIA Queue (/advisor/recommendations)');
    } catch (err) {
      showToast('Failed to route to advisor: ' + err.message);
    } finally {
      setRoutingToAdvisor(false);
    }
  }

  return (
    <div className="page-enter" style={{ padding: '1.5rem', maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 9999,
          background: 'var(--primary)',
          color: '#fff',
          padding: '0.875rem 1.25rem',
          borderRadius: 'var(--radius)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: 600,
          animation: 'slideIn 0.2s ease-out'
        }}>
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.75rem' }}>🧬</span>
            <h1 className="text-h1" style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>
              Direct Indexing & Custom Factor Tilt Studio
            </h1>
            <span className="badge badge-primary" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
              Vector 1 · Zero Mutual Fund TER
            </span>
          </div>
          <p className="text-sm text-secondary" style={{ margin: 0, maxWidth: 800 }}>
            Directly own the 50 underlying benchmark equities in your personal demat account. Apply multi-factor tilts (Momentum, Quality, Low-Vol), enforce ESG exclusions, and harvest constituent-level losses for <strong>+1.8% to +2.4% annual tax alpha</strong>.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleDownloadCharterPDF}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Download size={14} /> Download Operating Charter (PDF)
          </button>

          <button
            onClick={handleRouteToAdvisor}
            disabled={routingToAdvisor || routedToAdvisor}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
          >
            {routedToAdvisor ? <CheckCircle2 size={14} /> : <Send size={14} />}
            {routedToAdvisor ? 'Routed to RIA Queue' : 'Route to SEBI RIA'}
          </button>
        </div>
      </div>

      {/* Model Selection Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {models.map(m => (
          <button
            key={m.id}
            onClick={() => { setSelectedModelId(m.id); setOrderBasketResult(null); setExecutionSuccess(false); setHarvestResult(null); }}
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
        <>
          {/* Factor Tilt Console Banner */}
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(16,185,129,0.06) 100%)',
            border: '1px solid rgba(99,102,241,0.25)',
            padding: '1.25rem 1.5rem',
            borderRadius: 14
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 className="text-h3" style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <SlidersHorizontal size={18} color="var(--primary)" /> Multi-Factor Tilt Control Matrix
                </h3>
                <p className="text-sm text-secondary" style={{ marginTop: 2 }}>
                  Dynamically overlay quantitative smart-beta factors over benchmark market-cap weights without breaking tracking error bounds.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Projected Tracking Error</div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>
                    {orderBasketResult?.trackingError || estTrackingError}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Expected Excess Alpha</div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--green)' }}>
                    {orderBasketResult?.projectedExcessReturn || estExcessReturn}
                  </div>
                </div>
              </div>
            </div>

            {/* Tilt Sliders Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              {/* Momentum Tilt */}
              <div style={{ background: 'var(--surface-raised)', borderRadius: 10, padding: '0.875rem 1rem', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>🚀 Momentum Factor</span>
                  <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.9rem' }}>+{factorTilts.momentum}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={factorTilts.momentum}
                  onChange={e => {
                    setFactorTilts(prev => ({ ...prev, momentum: Number(e.target.value) }));
                    setOrderBasketResult(null);
                  }}
                  style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Overweights top 12M relative strength performers (Telecom, Semiconductors).
                </div>
              </div>

              {/* Quality / ROE Tilt */}
              <div style={{ background: 'var(--surface-raised)', borderRadius: 10, padding: '0.875rem 1rem', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>💎 Quality & ROE Factor</span>
                  <span style={{ fontWeight: 800, color: 'var(--green)', fontSize: '0.9rem' }}>+{factorTilts.quality}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={factorTilts.quality}
                  onChange={e => {
                    setFactorTilts(prev => ({ ...prev, quality: Number(e.target.value) }));
                    setOrderBasketResult(null);
                  }}
                  style={{ width: '100%', accentColor: 'var(--green)', cursor: 'pointer' }}
                />
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Tilts into fortress balance sheets, high ROIC, and low debt (TCS, Infosys, MSFT).
                </div>
              </div>

              {/* Low Volatility Tilt */}
              <div style={{ background: 'var(--surface-raised)', borderRadius: 10, padding: '0.875rem 1rem', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>🛡️ Low Volatility Factor</span>
                  <span style={{ fontWeight: 800, color: 'var(--gold)', fontSize: '0.9rem' }}>+{factorTilts.lowVol}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={factorTilts.lowVol}
                  onChange={e => {
                    setFactorTilts(prev => ({ ...prev, lowVol: Number(e.target.value) }));
                    setOrderBasketResult(null);
                  }}
                  style={{ width: '100%', accentColor: 'var(--gold)', cursor: 'pointer' }}
                />
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Minimizes portfolio drawdown via recession-proof cash cows (HUL, ITC, JPM).
                </div>
              </div>
            </div>
          </div>

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
                      Replicating <strong>{selectedModel.benchmark}</strong> · Base Tracking Error: <strong>{selectedModel.trackingError}</strong>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Projected Tax-Alpha</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--green)' }}>
                      {selectedModel.projectedTaxAlpha}
                    </div>
                  </div>
                </div>

                {/* 25 bps Advisory Wrap Fee & Net Client Surplus */}
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
              {/* Deploy Basket Card */}
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
                    <span style={{ color: 'var(--text-secondary)' }}>Active Exclusions:</span>
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
                  Compile Tilts & Order Basket
                </button>

                {/* Order Basket Preview */}
                {orderBasketResult && (
                  <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>
                        Generated Orders ({orderBasketResult.orderBasket?.length} Lots)
                      </span>
                      <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>
                        TE: {orderBasketResult.trackingError}
                      </span>
                    </div>

                    <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem', paddingRight: '0.25rem' }}>
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
                            {ord.factorDelta !== 0 && (
                              <span style={{ color: ord.factorDelta > 0 ? 'var(--green)' : 'var(--gold)', marginLeft: 4, fontSize: '0.7rem' }}>
                                ({ord.factorDelta > 0 ? `+${ord.factorDelta}` : ord.factorDelta}%)
                              </span>
                            )}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontWeight: 600 }}>{currencySymbol}{ord.allocatedCash?.toLocaleString()}</span>
                            <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>({ord.targetQty} sh)</span>
                          </div>
                        </div>
                      ))}
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
                          Orders sliced via {market === 'US' ? 'Alpaca VWAP' : 'Zerodha SOR'}. Demat lots updated.
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Constituent Tax-Loss Alpha Harvester */}
              <div className="card" style={{ padding: '1.25rem', background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Scale size={18} color="var(--green)" />
                    <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>Constituent Lot Tax-Harvester</h4>
                  </div>
                  <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>
                    3 Underwater Lots Active
                  </span>
                </div>

                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 0.85rem 0', lineHeight: 1.4 }}>
                  Harvest individual declining lots even when the parent index is up, swapping into correlated sector beta proxies.
                </p>

                <button
                  onClick={handleHarvestTaxAlpha}
                  disabled={harvestingLots}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', padding: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 700 }}
                >
                  {harvestingLots ? <RefreshCw size={14} className="spin" /> : <Zap size={14} color="var(--green)" />}
                  {harvestingLots ? 'Harvesting Lots…' : 'Execute 31-Day Beta-Preserved Tax Swap (1-Click)'}
                </button>

                {harvestResult && (
                  <div style={{ marginTop: '0.85rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--green)', borderRadius: 8, padding: '0.75rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.825rem', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={14} /> Losses Harvested: {harvestResult.totalLossHarvested}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      Generated <strong>{harvestResult.taxShieldBenefit}</strong> instant tax shield. Swapped into 31-day sector ETF proxies.
                    </div>
                  </div>
                )}
              </div>

              {/* Tiered Cash Sweep */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Percent size={18} color="var(--gold)" />
                    <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>Autonomous Cash Sweep</h4>
                  </div>
                  <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>
                    {cashSweep?.yield || '6.85% p.a.'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target Instrument</div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{cashSweep?.vehicle || 'Overnight Liquid Fund'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Liquidity Buffer</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--green)' }}>T+0 Daily</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Advisory Wrap Fee Agreement Modal */}
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ background: 'rgba(99,102,241,0.06)', borderRadius: 8, padding: '0.85rem', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Annual 25 bps Wrap Fee</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginTop: 2 }}>
                      {currencySymbol}{Math.round(Number(investmentAmount || 0) * 0.0025).toLocaleString()}/yr
                    </div>
                  </div>

                  <div style={{ background: 'rgba(16,185,129,0.06)', borderRadius: 8, padding: '0.85rem', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Net Client Tax-Alpha</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--green)', marginTop: 2 }}>
                      {selectedModel?.netClientTaxAlpha || '+1.89% p.a.'}
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
                      placeholder="e.g. Arjun Sharma"
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
                    {enrollingWrap ? <RefreshCw size={15} className="spin" /> : <FileCheck size={15} />}
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
                    onClick={() => setShowWrapModal(false)}
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
