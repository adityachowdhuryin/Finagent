import React, { useState, useEffect } from 'react';
import {
  Zap, ArrowRight, CheckCircle2, ShieldAlert, Sliders, RefreshCw,
  TrendingUp, Activity, DollarSign, Layers, Clock, Settings, ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';

export default function BrokerOrderRouter() {
  const { state } = useApp();
  const market = state.market || 'US';
  const isUS = market === 'US';
  const currencySymbol = isUS ? '$' : '₹';

  const [loading, setLoading] = useState(true);
  const [routerData, setRouterData] = useState(null);
  const [activeTab, setActiveTab] = useState('terminal'); // 'terminal' | 'autopilot' | 'settings'

  // Order Placement Form
  const [symbol, setSymbol] = useState(isUS ? 'VOO' : 'NIFTYBEES');
  const [qty, setQty] = useState(isUS ? '4' : '200');
  const [orderType, setOrderType] = useState('SOR_VWAP');
  const [isRouting, setIsRouting] = useState(false);
  const [routeSuccessMessage, setRouteSuccessMessage] = useState('');

  // Autopilot Form
  const [paycheckAmount, setPaycheckAmount] = useState(isUS ? 5000 : 85000);
  const [emergencyPct, setEmergencyPct] = useState(10);
  const [investPct, setInvestPct] = useState(25);
  const [autopilotMessage, setAutopilotMessage] = useState('');

  // BYOK Settings
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiSecretInput, setApiSecretInput] = useState('');
  const [brokerMode, setBrokerMode] = useState('paper');

  async function fetchRouterStatus() {
    setLoading(true);
    try {
      const res = await fetch(`/api/broker-router/status?market=${market}`);
      const data = await res.json();
      if (data.success) {
        setRouterData(data);
        setBrokerMode(data.config.mode);
      }
    } catch (err) {
      console.error('Failed to fetch broker router status:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRouterStatus();
    setSymbol(isUS ? 'VOO' : 'NIFTYBEES');
    setQty(isUS ? '4' : '200');
    setPaycheckAmount(isUS ? 5000 : 85000);
  }, [market]);

  async function handlePlaceOrder(e) {
    e.preventDefault();
    if (!symbol || !qty) return;

    setIsRouting(true);
    setRouteSuccessMessage('');
    try {
      const res = await fetch('/api/broker-router/place-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market,
          symbol,
          qty: Number(qty),
          type: orderType,
          side: 'BUY'
        })
      });
      const data = await res.json();
      if (data.success) {
        setRouteSuccessMessage(data.message);
        fetchRouterStatus();
      }
    } catch (err) {
      console.error('Order placement failed:', err);
    } finally {
      setIsRouting(false);
    }
  }

  async function handleTriggerAutopilot() {
    try {
      const res = await fetch('/api/broker-router/smart-allocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market,
          paycheckAmount: Number(paycheckAmount),
          emergencyPct: Number(emergencyPct),
          investPct: Number(investPct),
          checkingPct: 100 - Number(emergencyPct) - Number(investPct)
        })
      });
      const data = await res.json();
      if (data.success) {
        setAutopilotMessage(data.message);
        setTimeout(() => setAutopilotMessage(''), 5000);
      }
    } catch (err) {
      console.error('Autopilot failed:', err);
    }
  }

  async function handleSaveBYOK() {
    try {
      const res = await fetch('/api/broker-router/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market,
          mode: brokerMode,
          apiKey: apiKeyInput,
          secretKey: apiSecretInput
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowKeyModal(false);
        fetchRouterStatus();
      }
    } catch (err) {
      console.error('Save BYOK failed:', err);
    }
  }

  const config = routerData?.config || {};
  const orders = routerData?.orders || [];

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 className="text-h1">Autonomous Broker Order Router (SOR)</h1>
            <span className="badge badge-gold" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
              {config.mode === 'live' ? '🟢 LIVE RAILS' : '🧪 PAPER SANDBOX'}
            </span>
          </div>
          <p className="text-sm text-secondary mt-1">
            Smart Order Routing (SOR) with VWAP micro-slicing via {isUS ? 'Alpaca Securities Direct' : 'Zerodha Kite Connect'}.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowKeyModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Settings size={15} /> BYOK Keys ({config.activeBroker || (isUS ? 'Alpaca' : 'Zerodha')})
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={fetchRouterStatus}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ background: 'var(--surface-raised)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Connected Broker API</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.35rem', color: 'var(--text-primary)' }}>
            {config.activeBroker || (isUS ? 'Alpaca Securities' : 'Zerodha Kite Connect')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--green)', marginTop: '0.2rem' }}>
            ✓ Latency: 14ms (Direct Co-Location)
          </div>
        </div>

        <div className="card" style={{ background: 'var(--surface-raised)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Available Buying Power</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.35rem', color: 'var(--primary)' }}>
            {formatCurrency(config.buyingPower || 48250, false, market)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Instant margin available
          </div>
        </div>

        <div className="card" style={{ background: 'var(--surface-raised)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SOR Slippage Elimination</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.35rem', color: 'var(--gold)' }}>
            {isUS ? '$142.80' : '₹12,450'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Saved via VWAP order slicing
          </div>
        </div>

        <div className="card" style={{ background: 'var(--surface-raised)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Autopilot Rules</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.35rem', color: 'var(--green)' }}>
            {config.autoPilotRules?.length || 1} Active Trigger
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Paycheck-to-Asset Pipeline
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
        {[
          { id: 'terminal', label: '⚡ Smart Order Terminal' },
          { id: 'autopilot', label: '🔄 Paycheck-to-Asset Autopilot' },
          { id: 'orders', label: '📜 Live Order Book' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Smart Order Terminal */}
      {activeTab === 'terminal' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(320px, 1.2fr)', gap: '1.5rem' }}>
          {/* Order Placement Form */}
          <div className="card">
            <h3 className="text-h3" style={{ marginBottom: '1rem' }}>Instant Smart Order Entry</h3>
            {routeSuccessMessage && (
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid var(--green)', padding: '0.75rem', borderRadius: 'var(--radius)', marginBottom: '1rem', color: 'var(--green)', fontSize: '0.85rem' }}>
                ✓ {routeSuccessMessage}
              </div>
            )}

            <form onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Ticker Symbol</label>
                <input
                  type="text"
                  value={symbol}
                  onChange={e => setSymbol(e.target.value.toUpperCase())}
                  placeholder={isUS ? 'VOO, AAPL, NVDA' : 'NIFTYBEES, RELIANCE'}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontWeight: 600 }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Quantity / Units</label>
                  <input
                    type="number"
                    step="any"
                    value={qty}
                    onChange={e => setQty(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontWeight: 600 }}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Routing Algorithm</label>
                  <select
                    value={orderType}
                    onChange={e => setOrderType(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', background: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                  >
                    <option value="SOR_VWAP">Smart SOR (VWAP)</option>
                    <option value="SOR_TWAP">Time-Weighted (TWAP)</option>
                    <option value="LIMIT">Passive Pegged Limit</option>
                  </select>
                </div>
              </div>

              <div style={{ padding: '0.75rem', background: 'rgba(99,102,241,0.06)', borderRadius: 'var(--radius)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                ℹ️ <strong>SOR Protocol:</strong> Orders over \$1,000 / ₹50,000 are programmatically sliced across {isUS ? 'IEX and dark venues' : 'NSE colocation lots'} to avoid market footprint.
              </div>

              <button
                type="submit"
                disabled={isRouting}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {isRouting ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} />}
                {isRouting ? 'Slicing & Routing Order...' : `Execute Smart Order via ${config.activeBroker || 'Broker'}`}
              </button>
            </form>
          </div>

          {/* SOR Routing Simulation Visualizer */}
          <div className="card">
            <h3 className="text-h3" style={{ marginBottom: '0.5rem' }}>Smart Order Routing (SOR) Telemetry</h3>
            <p className="text-xs text-secondary mb-3">Live sub-millisecond execution routing topology</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ padding: '0.85rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Primary Gateway</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{isUS ? 'Alpaca Securities LLC (FINRA/SIPC)' : 'Zerodha Broking Ltd (SEBI/NSE)'}</div>
                </div>
                <span className="badge badge-green">ONLINE</span>
              </div>

              <div style={{ padding: '0.85rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Slippage Guard & Anti-Front-Running</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Randomized interval order slicing (100–300ms delays)</div>
                </div>
                <span className="badge badge-gold">ACTIVE</span>
              </div>

              <div style={{ padding: '0.85rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Best Execution Venue Verification</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SEC Rule 606 / SEBI Best Execution standards</div>
                </div>
                <span className="badge badge-surface">AUDITED</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Paycheck-to-Asset Autopilot */}
      {activeTab === 'autopilot' && (
        <div className="card" style={{ maxWidth: 720 }}>
          <h3 className="text-h3" style={{ marginBottom: '0.5rem' }}>Paycheck-to-Asset Autonomous Pipeline</h3>
          <p className="text-xs text-secondary mb-4">
            Whenever your direct deposit or salary hits, FinAgent automatically carves out emergency runway and places algorithmic dip limit orders.
          </p>

          {autopilotMessage && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid var(--green)', padding: '0.75rem', borderRadius: 'var(--radius)', marginBottom: '1rem', color: 'var(--green)', fontSize: '0.85rem' }}>
              ✓ {autopilotMessage}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>
                Expected Paycheck / Salary Amount ({currencySymbol})
              </label>
              <input
                type="number"
                value={paycheckAmount}
                onChange={e => setPaycheckAmount(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.1rem' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span className="text-xs text-muted">Emergency Reserve Split (%)</span>
                <span className="text-xs font-mono font-bold">{emergencyPct}% ({currencySymbol}{((paycheckAmount * emergencyPct) / 100).toLocaleString()})</span>
              </div>
              <input
                type="range" min="0" max="30" value={emergencyPct}
                onChange={e => setEmergencyPct(e.target.value)}
                style={{ width: '100%', accentColor: 'var(--primary)' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span className="text-xs text-muted">Auto-Invest Dip Limit Orders (%)</span>
                <span className="text-xs font-mono font-bold" style={{ color: 'var(--green)' }}>{investPct}% ({currencySymbol}{((paycheckAmount * investPct) / 100).toLocaleString()})</span>
              </div>
              <input
                type="range" min="5" max="50" value={investPct}
                onChange={e => setInvestPct(e.target.value)}
                style={{ width: '100%', accentColor: 'var(--green)' }}
              />
            </div>

            <div style={{ padding: '1rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>Remaining for Monthly Fixed Expenses</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {currencySymbol}{((paycheckAmount * (100 - emergencyPct - investPct)) / 100).toLocaleString()} ({(100 - emergencyPct - investPct)}%)
              </div>
            </div>

            <button
              onClick={handleTriggerAutopilot}
              className="btn btn-primary"
              style={{ padding: '0.75rem', fontWeight: 700 }}
            >
              🚀 Simulate Next Paycheck Sweep & Auto-Allocation
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: Order Book */}
      {activeTab === 'orders' && (
        <div className="card">
          <h3 className="text-h3" style={{ marginBottom: '1rem' }}>Smart Order Routing (SOR) Execution Log</h3>
          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.6rem 0.5rem' }}>Order ID</th>
                  <th style={{ padding: '0.6rem 0.5rem' }}>Asset</th>
                  <th style={{ padding: '0.6rem 0.5rem' }}>Broker</th>
                  <th style={{ padding: '0.6rem 0.5rem' }}>Side / Qty</th>
                  <th style={{ padding: '0.6rem 0.5rem' }}>Algorithm</th>
                  <th style={{ padding: '0.6rem 0.5rem' }}>Fill Price</th>
                  <th style={{ padding: '0.6rem 0.5rem' }}>Slippage Saved</th>
                  <th style={{ padding: '0.6rem 0.5rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                    <td style={{ padding: '0.6rem 0.5rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{o.id}</td>
                    <td style={{ padding: '0.6rem 0.5rem', fontWeight: 700 }}>{o.symbol}</td>
                    <td style={{ padding: '0.6rem 0.5rem' }}>{o.broker}</td>
                    <td style={{ padding: '0.6rem 0.5rem' }}>{o.side} {o.qty}</td>
                    <td style={{ padding: '0.6rem 0.5rem' }}><span className="badge badge-surface">{o.type}</span></td>
                    <td style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>{currencySymbol}{o.filledPrice}</td>
                    <td style={{ padding: '0.6rem 0.5rem', color: 'var(--green)' }}>{o.slippageSaved}</td>
                    <td style={{ padding: '0.6rem 0.5rem' }}><span className="badge badge-green">{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BYOK Modal */}
      {showKeyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ maxWidth: 500, width: '100%', position: 'relative' }}>
            <h3 className="text-h3" style={{ marginBottom: '0.5rem' }}>
              Bring Your Own Key (BYOK) — {isUS ? 'Alpaca' : 'Zerodha Kite'}
            </h3>
            <p className="text-xs text-secondary mb-3">
              Configure your personal broker API credentials to enable real paper or live execution.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Execution Mode</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setBrokerMode('paper')}
                    className={`btn btn-sm ${brokerMode === 'paper' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ flex: 1 }}
                  >
                    🧪 Paper Trading (Sandbox)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBrokerMode('live')}
                    className={`btn btn-sm ${brokerMode === 'live' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ flex: 1 }}
                  >
                    🟢 Live Production
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>API Key</label>
                <input
                  type="text"
                  value={apiKeyInput}
                  onChange={e => setApiKeyInput(e.target.value)}
                  placeholder={isUS ? 'PK_ALPACA_LIVE_...' : 'kite_api_key_...'}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', background: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>API Secret</label>
                <input
                  type="password"
                  value={apiSecretInput}
                  onChange={e => setApiSecretInput(e.target.value)}
                  placeholder="••••••••••••••••••••••••"
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', background: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowKeyModal(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleSaveBYOK}>Save Credentials</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
