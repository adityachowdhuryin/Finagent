// src/pages/consumer/ExecutionHub.jsx
// Autonomous Wealth Execution & "1-Click" Action Engines
// Rebalancing baskets, Tax-Loss Harvest Swaps, HYSA Cash Sweeps, and Bill Negotiation Bot

import React, { useState, useEffect } from 'react';
import {
  Zap, ArrowRightLeft, Scissors, DollarSign, TrendingUp, ShieldCheck,
  CheckCircle2, Clock, AlertTriangle, RefreshCw, Smartphone, Globe,
  FileText, ExternalLink, ChevronRight, Sparkles, Building, Landmark, Trash2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatShortCurrency } from '../../utils/formatters';

export default function ExecutionHub() {
  const { state, isUSMarket } = useApp();
  const [activeTab, setActiveTab] = useState('rebalance'); // 'rebalance' | 'harvest' | 'sweep' | 'negotiate'
  const [loading, setLoading] = useState(false);
  const [brokerStatus, setBrokerStatus] = useState(null);
  const [subscriptionsData, setSubscriptionsData] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  // Rebalance basket state
  const [rebalanceExecuting, setRebalanceExecuting] = useState(false);
  const [rebalanceResult, setRebalanceResult] = useState(null);

  // Harvest swap state
  const [harvestExecuting, setHarvestExecuting] = useState(false);
  const [harvestResult, setHarvestResult] = useState(null);

  // Sweep state
  const [sweepAmount, setSweepAmount] = useState(isUSMarket ? 2500 : 75000);
  const [sweepExecuting, setSweepExecuting] = useState(false);
  const [sweepResult, setSweepResult] = useState(null);

  // Subscription modal
  const [selectedSub, setSelectedSub] = useState(null);
  const [cancelModal, setCancelModal] = useState(false);
  const [negotiateModal, setNegotiateModal] = useState(false);
  const [negotiationStep, setNegotiationStep] = useState('idle'); // 'negotiating' | 'done'
  const [negotiationResult, setNegotiationResult] = useState(null);

  const market = isUSMarket ? 'US' : 'IN';
  const currencySymbol = isUSMarket ? '$' : '₹';

  // Fetch broker and subscription data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [brokerRes, subRes] = await Promise.all([
        fetch(`/api/broker/status?market=${market}`).then(r => r.json()),
        fetch(`/api/subscriptions/detected?market=${market}`).then(r => r.json())
      ]);

      if (brokerRes.success) setBrokerStatus(brokerRes);
      if (subRes.success) setSubscriptionsData(subRes);
    } catch (err) {
      console.error('Failed to load execution status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isUSMarket]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // 1-Click Rebalance Handler
  const handleExecuteRebalance = async () => {
    setRebalanceExecuting(true);
    try {
      const defaultOrders = isUSMarket ? [
        { symbol: 'TSLA', side: 'SELL', shares: 12, price: 242.10 },
        { symbol: 'VOO', side: 'BUY', shares: 6, price: 498.40 },
        { symbol: 'BND', side: 'BUY', shares: 25, price: 73.15 }
      ] : [
        { symbol: 'TATASTEEL', side: 'SELL', shares: 120, price: 138.50 },
        { symbol: 'NIFTYBEES', side: 'BUY', shares: 50, price: 282.10 },
        { symbol: 'GOLDBEES', side: 'BUY', shares: 35, price: 68.40 }
      ];

      const res = await fetch('/api/broker/execute-rebalance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market,
          orders: defaultOrders,
          notes: 'Automated 1-Click Drift Correction'
        })
      });
      const data = await res.json();
      if (data.success) {
        setRebalanceResult(data.order);
        showToast('✓ 1-Click Rebalance executed successfully!');
        fetchData();
      }
    } catch (err) {
      showToast('Error executing rebalance');
    } finally {
      setRebalanceExecuting(false);
    }
  };

  // 1-Click Tax Harvest Handler
  const handleExecuteHarvest = async () => {
    setHarvestExecuting(true);
    try {
      const harvestPayload = isUSMarket ? {
        market: 'US',
        sellSymbol: 'VOO',
        sellQty: 10,
        sellPrice: 498.20,
        buyProxySymbol: 'IVV',
        buyQty: 10,
        buyPrice: 498.30,
        lossHarvested: 2450.00
      } : {
        market: 'IN',
        sellSymbol: 'HDFCBANK',
        sellQty: 40,
        sellPrice: 1640.00,
        buyProxySymbol: 'ICICIBANK',
        buyQty: 55,
        buyPrice: 1195.00,
        lossHarvested: 18400.00
      };

      const res = await fetch('/api/broker/execute-harvest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(harvestPayload)
      });
      const data = await res.json();
      if (data.success) {
        setHarvestResult(data.order);
        showToast(`✓ Tax loss harvest executed! Realized ${currencySymbol}${Number(harvestPayload.lossHarvested).toLocaleString()}`);
        fetchData();
      }
    } catch (err) {
      showToast('Error executing tax harvest');
    } finally {
      setHarvestExecuting(false);
    }
  };

  // 1-Click Cash Sweep Handler
  const handleExecuteSweep = async () => {
    setSweepExecuting(true);
    try {
      const res = await fetch('/api/broker/execute-sweep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market,
          sweepAmount: Number(sweepAmount),
          fromAccount: isUSMarket ? 'Chase Checking (...4821)' : 'HDFC Salary A/c (...9012)',
          toTarget: isUSMarket ? 'Goldman Marcus 4.40% HYSA' : 'HDFC Liquid Arbitrage Fund',
          autoSweepEnabled: true
        })
      });
      const data = await res.json();
      if (data.success) {
        setSweepResult(data.sweep);
        showToast(`✓ Swept ${currencySymbol}${Number(sweepAmount).toLocaleString()} into high-yield account!`);
        fetchData();
      }
    } catch (err) {
      showToast('Error executing cash sweep');
    } finally {
      setSweepExecuting(false);
    }
  };

  // Cancel Subscription
  const handleCancelSubscription = async () => {
    if (!selectedSub) return;
    try {
      const res = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: selectedSub.id,
          reason: 'Too expensive / Service not actively used'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✓ Cancellation dispatched for ${selectedSub.name}`);
        setCancelModal(false);
        fetchData();
      }
    } catch (err) {
      showToast('Failed to cancel subscription');
    }
  };

  // Negotiate Bill
  const handleNegotiateBill = async () => {
    if (!selectedSub) return;
    setNegotiationStep('negotiating');
    try {
      const res = await fetch('/api/bills/negotiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: selectedSub.id
        })
      });
      const data = await res.json();
      if (data.success) {
        setNegotiationResult(data);
        setNegotiationStep('done');
        fetchData();
      }
    } catch (err) {
      setNegotiationStep('idle');
      showToast('Failed to negotiate bill');
    }
  };

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
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
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(16,185,129,0.08) 100%)',
        border: '1px solid rgba(99,102,241,0.3)',
        padding: '1.75rem',
        borderRadius: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Zap size={12} /> Autonomous Execution
              </span>
              <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <ShieldCheck size={12} /> {brokerStatus?.connection?.mode === 'LIVE_BROKER' ? 'Live Broker Connected' : 'High-Fidelity Sandbox'}
              </span>
            </div>
            <h1 className="text-h1" style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              Autonomous Wealth Execution Hub
            </h1>
            <p className="text-secondary" style={{ marginTop: '0.25rem', maxWidth: 640 }}>
              Execute rebalancing orders, harvest tax losses via proxy ETFs, sweep idle checking cash, and deploy AI bots to cancel or slash recurring bills.
            </p>
          </div>

          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--glass-border)',
            borderRadius: 12,
            padding: '1rem 1.25rem',
            textAlign: 'right',
            minWidth: 200
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Connected Broker Rail</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginTop: 2 }}>
              {brokerStatus?.connection?.provider || (isUSMarket ? 'Alpaca Securities LLC' : 'Zerodha Kite Connect')}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--green)', fontWeight: 600, marginTop: 4 }}>
              Buying Power: {currencySymbol}{brokerStatus?.connection?.buyingPower ? Number(brokerStatus.connection.buyingPower).toLocaleString() : (isUSMarket ? '42,752' : '5,56,260')}
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem', flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${activeTab === 'rebalance' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('rebalance')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <ArrowRightLeft size={15} /> 1-Click Rebalance
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'harvest' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('harvest')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Scissors size={15} /> Tax-Loss Proxy Swap
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'sweep' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('sweep')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <TrendingUp size={15} /> Smart Cash Sweep
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'negotiate' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('negotiate')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Scissors size={15} /> Bill & Sub Negotiator
          </button>
        </div>
      </div>

      {/* TAB 1: 1-CLICK REBALANCE */}
      {activeTab === 'rebalance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 className="text-h3" style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ArrowRightLeft size={18} color="var(--primary)" /> Ready-to-Execute Rebalance Basket
                </h3>
                <p className="text-sm text-secondary" style={{ marginTop: 2 }}>
                  Compiled from your target allocation drift. Executes batch market-on-open orders with 0 slippage.
                </p>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleExecuteRebalance}
                disabled={rebalanceExecuting}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.625rem 1.25rem', fontWeight: 700 }}
              >
                {rebalanceExecuting ? <RefreshCw className="spin" size={16} /> : <Zap size={16} />}
                {rebalanceExecuting ? 'Executing Basket…' : '1-Click Execute Basket'}
              </button>
            </div>

            {/* Proposed Orders Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Action</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Asset</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Quantity</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Est. Price</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Estimated Value</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Broker Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {isUSMarket ? (
                    <>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '0.75rem 0.5rem' }}><span className="badge badge-red">SELL</span></td>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>TSLA (Tesla Inc)</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>12 shares</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>$242.10</td>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>$2,905.20</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--green)' }}>$0.00 (Zero Comm)</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '0.75rem 0.5rem' }}><span className="badge badge-green">BUY</span></td>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>VOO (Vanguard S&P 500)</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>6 shares</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>$498.40</td>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>$2,990.40</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--green)' }}>$0.00 (Zero Comm)</td>
                      </tr>
                    </>
                  ) : (
                    <>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '0.75rem 0.5rem' }}><span className="badge badge-red">SELL</span></td>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>TATASTEEL (Tata Steel Ltd)</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>120 shares</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>₹138.50</td>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>₹16,620.00</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--green)' }}>₹20.00 flat</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '0.75rem 0.5rem' }}><span className="badge badge-green">BUY</span></td>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>NIFTYBEES (Nippon ETF)</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>50 shares</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>₹282.10</td>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>₹14,105.00</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--green)' }}>₹20.00 flat</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {rebalanceResult && (
              <div style={{
                marginTop: '1.25rem',
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid var(--green)',
                borderRadius: 12,
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <CheckCircle2 size={24} color="var(--green)" />
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--green)' }}>
                    Basket Order Filled · ID: {rebalanceResult.id}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    {rebalanceResult.summary} — Total Traded Value: {currencySymbol}{rebalanceResult.totalValue.toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TAX LOSS PROXY SWAP */}
      {activeTab === 'harvest' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 className="text-h3" style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Scissors size={18} color="var(--primary)" /> {isUSMarket ? 'IRC § 1091 Wash-Sale Safe Proxy Swap' : 'Tax-Loss Harvesting Swap'}
                </h3>
                <p className="text-sm text-secondary" style={{ marginTop: 2 }}>
                  Sell underwater holdings to lock in capital loss deductions, while instantly buying an index proxy so you never miss market upside.
                </p>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleExecuteHarvest}
                disabled={harvestExecuting}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.625rem 1.25rem', fontWeight: 700 }}
              >
                {harvestExecuting ? <RefreshCw className="spin" size={16} /> : <Zap size={16} />}
                {harvestExecuting ? 'Executing Swap…' : '1-Click Harvest Swap'}
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.25rem',
              marginTop: '1rem'
            }}>
              <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase' }}>Sell Leg (Underwater Lot)</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.25rem' }}>
                  {isUSMarket ? '10x VOO @ $498.20' : '40x HDFCBANK @ ₹1,640'}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Unrealized Loss: <span style={{ color: 'var(--red)', fontWeight: 700 }}>{isUSMarket ? '-$2,450.00' : '-₹18,400.00'}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Holding period: 142 days · Eligible for short-term offset
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)'
                }}>
                  <ArrowRightLeft size={20} />
                </div>
              </div>

              <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, padding: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase' }}>Buy Leg (Proxy Tracker)</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.25rem' }}>
                  {isUSMarket ? '10x IVV @ $498.30' : '55x ICICIBANK @ ₹1,195'}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Correlation: <span style={{ color: 'var(--green)', fontWeight: 700 }}>0.992 (Near-Identical Beta)</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  {isUSMarket ? 'Zero Wash-Sale Trigger (Different Issuer)' : 'Compliant with IT Act FY26 rules'}
                </div>
              </div>
            </div>

            {harvestResult && (
              <div style={{
                marginTop: '1.25rem',
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid var(--green)',
                borderRadius: 12,
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <CheckCircle2 size={24} color="var(--green)" />
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--green)' }}>
                    Harvest Executed · Confirmation: {harvestResult.id}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    {harvestResult.summary} — {harvestResult.savingsYield}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SMART CASH SWEEP */}
      {activeTab === 'sweep' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 className="text-h3" style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendingUp size={18} color="var(--primary)" /> Automated Checking-to-HYSA Cash Sweep
                </h3>
                <p className="text-sm text-secondary" style={{ marginTop: 2 }}>
                  Maintains a safe checking liquidity floor and auto-sweeps idle cash into 4.40% APY HYSA / Arbitrage fund.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              <div className="card" style={{ background: 'var(--surface-raised)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Checking Buffer Target</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: 4 }}>
                  {currencySymbol}{isUSMarket ? '5,000' : '1,50,000'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--green)', marginTop: 4 }}>
                  Covers ~1.8 months living expenses
                </div>
              </div>

              <div className="card" style={{ background: 'var(--surface-raised)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Available Idle Cash</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)', marginTop: 4 }}>
                  {currencySymbol}{isUSMarket ? '3,840.50' : '1,12,000.00'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  Earning only 0.01% in checking
                </div>
              </div>

              <div className="card" style={{ background: 'var(--surface-raised)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target Yield Destination</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--green)', marginTop: 4 }}>
                  {isUSMarket ? '4.40% APY' : '7.10% p.a.'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  {isUSMarket ? 'Goldman Marcus / VUSXX' : 'Liquid Arbitrage Fund'}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: '1.25rem' }}>
              <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Manual Sweep Trigger</div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '0.5rem 0.875rem' }}>
                  <span>{currencySymbol}</span>
                  <input
                    type="number"
                    value={sweepAmount}
                    onChange={(e) => setSweepAmount(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 700, width: 120 }}
                  />
                </div>
                <button
                  className="btn btn-primary"
                  onClick={handleExecuteSweep}
                  disabled={sweepExecuting}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
                >
                  {sweepExecuting ? <RefreshCw className="spin" size={15} /> : <Zap size={15} />}
                  {sweepExecuting ? 'Sweeping Funds…' : 'Execute Instant Sweep'}
                </button>
              </div>

              {sweepResult && (
                <div style={{
                  marginTop: '1rem',
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid var(--green)',
                  borderRadius: 12,
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <CheckCircle2 size={24} color="var(--green)" />
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--green)' }}>
                      Transfer Settled · ID: {sweepResult.id}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      {sweepResult.summary} — {sweepResult.savingsYield}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BILL & SUB NEGOTIATOR */}
      {activeTab === 'negotiate' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Top Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div className="card">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Monthly Subscriptions</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: 4 }}>
                {currencySymbol}{subscriptionsData ? subscriptionsData.totalMonthlySpend.toLocaleString() : (isUSMarket ? '669.48' : '3,499.00')}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                Auto-detected from bank statements
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Identified Annual Savings</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--green)', marginTop: 4 }}>
                {currencySymbol}{subscriptionsData ? subscriptionsData.totalAnnualPotentialSavings.toLocaleString() : (isUSMarket ? '1,920.00' : '4,800.00')}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--green)', marginTop: 4 }}>
                Across {subscriptionsData?.subscriptions?.filter(s => s.negotiable).length || 3} negotiable carriers
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rocket Money Model Split</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginTop: 4 }}>
                60% User / 40% FinAgent
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                Zero fee unless savings are locked
              </div>
            </div>
          </div>

          {/* Subscriptions List */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 className="text-h3" style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Scissors size={18} color="var(--primary)" /> Detected Subscriptions & Bills
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(subscriptionsData?.subscriptions || []).map((sub) => (
                <div
                  key={sub.id}
                  style={{
                    background: 'var(--surface-raised)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 12,
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontSize: '1.75rem' }}>{sub.logo}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{sub.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {sub.category} · Last billed {sub.lastBilled}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                        {currencySymbol}{sub.amount.toFixed(2)}/mo
                      </div>
                      {sub.negotiable && sub.status === 'ACTIVE' && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--green)', fontWeight: 600 }}>
                          Save ~{currencySymbol}{sub.potentialSavingsPerMonth}/mo
                        </div>
                      )}
                      {sub.status === 'SAVINGS_LOCKED' && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--green)', fontWeight: 700 }}>
                          ✓ Savings Locked
                        </div>
                      )}
                      {sub.status === 'CANCELLED' && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--red)', fontWeight: 700 }}>
                          ✓ Cancelled
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {sub.negotiable && sub.status === 'ACTIVE' && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => {
                            setSelectedSub(sub);
                            setNegotiateModal(true);
                            setNegotiationStep('idle');
                            setNegotiationResult(null);
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
                        >
                          <Sparkles size={14} /> Negotiate Bill
                        </button>
                      )}
                      {sub.status === 'ACTIVE' && (
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => {
                            setSelectedSub(sub);
                            setCancelModal(true);
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--red)' }}
                        >
                          <Trash2 size={14} /> 1-Click Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CANCEL MODAL */}
      {cancelModal && selectedSub && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: 480, width: '100%', padding: '1.75rem' }}>
            <h3 className="text-h3" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              Confirm 1-Click Cancellation
            </h3>
            <p className="text-sm text-secondary">
              FinAgent will dispatch an official cancellation notice to <strong>{selectedSub.name}</strong> and terminate recurring billings of {currencySymbol}{selectedSub.amount}/mo.
            </p>

            <div style={{
              background: 'var(--surface-raised)',
              borderRadius: 8,
              padding: '1rem',
              marginTop: '1rem',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              borderLeft: '3px solid var(--primary)'
            }}>
              <strong>Annual Savings:</strong> {currencySymbol}{(selectedSub.amount * 12).toFixed(2)}/year retained in your wallet.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button className="btn btn-ghost" onClick={() => setCancelModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCancelSubscription} style={{ background: 'var(--red)' }}>
                Confirm & Dispatch Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEGOTIATE MODAL */}
      {negotiateModal && selectedSub && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: 540, width: '100%', padding: '1.75rem' }}>
            <h3 className="text-h3" style={{ fontSize: '1.25rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={20} color="var(--primary)" /> Bill Negotiator Bot
            </h3>
            <p className="text-sm text-secondary">
              Deploy our carrier retentions bot to slash your bill with <strong>{selectedSub.name}</strong>.
            </p>

            {negotiationStep === 'idle' && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{
                  background: 'var(--surface-raised)',
                  borderRadius: 12,
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Bill</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{currencySymbol}{selectedSub.amount}/mo</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target Reduced Bill</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--green)' }}>
                      {currencySymbol}{Math.max(selectedSub.amount - selectedSub.potentialSavingsPerMonth, 15)}/mo
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  * Rocket Money 60/40 Guarantee: You keep 60% of the first year's locked savings. We only charge 40% if our bot succeeds.
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button className="btn btn-ghost" onClick={() => setNegotiateModal(false)}>Close</button>
                  <button className="btn btn-primary" onClick={handleNegotiateBill}>
                    Start Negotiation Bot
                  </button>
                </div>
              </div>
            )}

            {negotiationStep === 'negotiating' && (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <RefreshCw className="spin" size={36} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>Contacting Carrier Retentions System…</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Matching ZIP code promotions and applying 12-month loyalty credit…
                </div>
              </div>
            )}

            {negotiationStep === 'done' && negotiationResult && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid var(--green)',
                  borderRadius: 12,
                  padding: '1.25rem',
                  textAlign: 'center'
                }}>
                  <CheckCircle2 size={36} color="var(--green)" style={{ margin: '0 auto 0.5rem' }} />
                  <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--green)' }}>
                    Savings Successfully Locked!
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: 4 }}>
                    New monthly rate: <strong>{currencySymbol}{negotiationResult.newMonthlyRate}/mo</strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 6 }}>
                    You keep: <strong>{currencySymbol}{negotiationResult.userNetAnnualSavings}/yr</strong> · Deal Code: {negotiationResult.dealId}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button className="btn btn-primary" onClick={() => setNegotiateModal(false)}>
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Execution Audit Log */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 className="text-h3" style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={18} color="var(--primary)" /> Autonomous Execution Audit Trail
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {(brokerStatus?.recentOrders || []).map((order) => (
            <div
              key={order.id}
              style={{
                background: 'var(--surface-raised)',
                border: '1px solid var(--glass-border)',
                borderRadius: 10,
                padding: '0.875rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="badge badge-surface" style={{ fontSize: '0.7rem' }}>{order.id}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{order.summary}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {order.broker} · {new Date(order.timestamp).toLocaleString()}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-green" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                  {order.status}
                </span>
                <div style={{ fontSize: '0.75rem', color: 'var(--green)', marginTop: 2 }}>
                  {order.savingsYield}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
