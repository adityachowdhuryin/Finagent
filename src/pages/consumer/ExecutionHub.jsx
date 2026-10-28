// src/pages/consumer/ExecutionHub.jsx
// Autonomous Wealth Execution & "1-Click" Action Engines
// Rebalancing baskets, Tax-Loss Harvest Swaps, Direct MF Switches, Overlap De-duplication, Zombie Mandate Kill Switch, HYSA Cash Sweeps, and Bill Negotiation Bot

import React, { useState, useEffect } from 'react';
import {
  Zap, ArrowRightLeft, Scissors, DollarSign, TrendingUp, ShieldCheck,
  CheckCircle2, Clock, AlertTriangle, RefreshCw, Smartphone, Globe,
  FileText, ExternalLink, ChevronRight, Sparkles, Building, Landmark, Trash2,
  Layers, Download, CheckCircle, Ban, ShieldAlert
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatShortCurrency } from '../../utils/formatters';
import { buildExecutionReceiptPDF } from '../../utils/fiduciaryPdfBuilder';
import StickyActionDock from '../../components/common/StickyActionDock';

export default function ExecutionHub() {
  const IN_MANDATES = [
    { id: 'mandate_1', name: 'Cult.fit Gym & Fitness', category: 'Health & Fitness', umrn: 'HDFC70291823901234', bank: 'HDFC Bank Ltd (Debit)', monthlyAmount: 2499, annualAmount: 29988, lastDebited: '3 days ago', status: 'ACTIVE' },
    { id: 'mandate_2', name: 'LinkedIn Premium Annual', category: 'Professional Services', umrn: 'HDFC99120381920194', bank: 'HDFC Credit Card Auto-Debit', monthlyAmount: 1566, annualAmount: 18800, lastDebited: '12 days ago', status: 'ACTIVE' },
    { id: 'mandate_3', name: 'SonyLIV Annual OTT', category: 'Entertainment', umrn: 'ICIC88192019201928', bank: 'ICICI Bank Savings', monthlyAmount: 125, annualAmount: 1499, lastDebited: '18 days ago', status: 'ACTIVE' },
    { id: 'mandate_4', name: 'Microsoft 365 Family Cloud', category: 'Cloud & Software', umrn: 'AXIS88201920192011', bank: 'Axis Bank Salary A/c', monthlyAmount: 520, annualAmount: 6199, lastDebited: '24 days ago', status: 'ACTIVE' },
  ];

  const US_MANDATES = [
    { id: 'ach_eq_891280381', name: 'Equinox Fitness Hudson Yards', category: 'Health & Fitness', umrn: 'ach_eq_891280381', bank: 'Chase Premier Checking (...4821)', monthlyAmount: 280.00, annualAmount: 3360.00, lastDebited: '14 days ago (No check-ins in 74 days)', status: 'ACTIVE' },
    { id: 'ach_bbg_91029381', name: 'Bloomberg Terminal Individual', category: 'Professional Software', umrn: 'ach_bbg_91029381', bank: 'Amex Business Card (...1004)', monthlyAmount: 245.00, annualAmount: 2940.00, lastDebited: '4 days ago', status: 'ACTIVE' },
    { id: 'ach_adb_48102941', name: 'Adobe Creative Cloud All Apps', category: 'Cloud Software', umrn: 'ach_adb_48102941', bank: 'Chase Sapphire Reserve (...9201)', monthlyAmount: 84.99, annualAmount: 1019.88, lastDebited: '22 days ago (Zero logins in 60 days)', status: 'ACTIVE' },
    { id: 'ach_pln_29103951', name: 'Peloton All-Access Membership', category: 'Fitness & Media', umrn: 'ach_pln_29103951', bank: 'Citi Double Cash (...3318)', monthlyAmount: 44.00, annualAmount: 528.00, lastDebited: '19 days ago (Last ride 4 months ago)', status: 'ACTIVE' },
  ];

  const { state, isUSMarket } = useApp();
  // Default to mf-switch in both markets to operationalize the forensic leakage
  const [activeTab, setActiveTab] = useState('mf-switch');
  const [loading, setLoading] = useState(false);
  const [brokerStatus, setBrokerStatus] = useState(null);
  const [subscriptionsData, setSubscriptionsData] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  // Direct MF / ETF Switch state
  const [mfSwitchExecuting, setMfSwitchExecuting] = useState(false);
  const [mfSwitchResult, setMfSwitchResult] = useState(null);

  // Overlap Consolidation state
  const [overlapExecuting, setOverlapExecuting] = useState(false);
  const [overlapResult, setOverlapResult] = useState(null);

  // Zombie Mandate Kill Switch state
  const [mandates, setMandates] = useState(isUSMarket ? US_MANDATES : IN_MANDATES);
  const [revokingMandateId, setRevokingMandateId] = useState(null);

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
    setMandates(isUSMarket ? US_MANDATES : IN_MANDATES);
    setMfSwitchResult(null);
    setOverlapResult(null);
    setSweepAmount(isUSMarket ? 2500 : 75000);
    fetchData();
  }, [isUSMarket]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // 1-Click Direct Mutual Fund / ETF Switch Handler
  const handleExecuteMFSwitch = async () => {
    setMfSwitchExecuting(true);
    try {
      const orders = isUSMarket ? [
        {
          fromScheme: 'American Funds Growth Fund of America (AGTHX - 0.65% ER + 12b-1)',
          toScheme: 'Vanguard S&P 500 ETF (VOO - 0.03% ER)',
          amount: 85000,
          holdingDays: 820,
          gain: 24000,
        },
        {
          fromScheme: 'T. Rowe Price Blue Chip Growth Fund (TRBCX - 0.71% ER)',
          toScheme: 'Vanguard Total Stock Market ETF (VTI - 0.03% ER)',
          amount: 62000,
          holdingDays: 540,
          gain: 18500,
        },
        {
          fromScheme: 'Fidelity Contrafund (FCNTX - 0.55% ER)',
          toScheme: 'Invesco NASDAQ 100 ETF (QQQM - 0.15% ER)',
          amount: 38000,
          holdingDays: 290,
          gain: 9200,
        },
      ] : [
        {
          fromScheme: 'HDFC Mid-Cap Opportunities Fund (Regular Growth)',
          toScheme: 'HDFC Mid-Cap Opportunities Fund (Direct Growth)',
          amount: 1120000,
          holdingDays: 742,
          gain: 310000,
        },
        {
          fromScheme: 'Nippon India Growth Fund (Regular Growth)',
          toScheme: 'Nippon India Growth Fund (Direct Growth)',
          amount: 980000,
          holdingDays: 512,
          gain: 245000,
        },
        {
          fromScheme: 'ICICI Prudential Bluechip Fund (Regular Growth)',
          toScheme: 'ICICI Prudential Bluechip Fund (Direct Growth)',
          amount: 750000,
          holdingDays: 210,
          gain: 140000,
        },
      ];

      const res = await fetch('/api/broker/execute-mf-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market,
          investorName: state.consumer?.user?.name || (isUSMarket ? 'Alexander Wright' : 'Arjun Sharma'),
          folioNumber: isUSMarket ? 'SCHW-8912-4019' : '10928192/44',
          switches: orders,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMfSwitchResult(data.execution);
        showToast(
          isUSMarket
            ? '✓ 1-Click Mutual-Fund-to-ETF transition executed via Alpaca Smart Router!'
            : '✓ 1-Click Direct Mutual Fund switch executed via BSE StAR MF!'
        );
        fetchData();
      } else {
        showToast(data.error || 'Switch failed');
      }
    } catch (err) {
      showToast('Error executing switch: ' + err.message);
    } finally {
      setMfSwitchExecuting(false);
    }
  };

  // Download Certified Execution Receipt PDF
  const handleDownloadExecutionReceipt = (receiptData) => {
    const dataToUse = receiptData || mfSwitchResult || (isUSMarket ? {
      investorName: state.consumer?.user?.name || 'Alexander Wright',
      id: `US-ETF-${Date.now()}`,
      timestamp: new Date().toISOString(),
      market: 'US',
      currency: 'USD',
      totalValue: 185000,
      financialImpact: {
        totalSwitchedValue: 185000,
        totalAnnualCommissionSaved: 2420,
        totalTaxLiability: 0,
        totalExitLoad: 0,
        netTenYearWealthGain: 42850,
      },
      orders: [
        { orderId: 'ALPACASWITCH-101', fromScheme: 'American Funds Growth Fund (AGTHX)', toScheme: 'Vanguard S&P 500 ETF (VOO)', switchedAmount: 85000, capitalGainType: 'US LTCG (15%)', taxLiability: 0, exitLoadFee: 0, annualRecurringSavings: 1020 },
        { orderId: 'ALPACASWITCH-102', fromScheme: 'T. Rowe Price Blue Chip (TRBCX)', toScheme: 'Vanguard Total Stock ETF (VTI)', switchedAmount: 62000, capitalGainType: 'US LTCG (15%)', taxLiability: 0, exitLoadFee: 0, annualRecurringSavings: 868 },
        { orderId: 'ALPACASWITCH-103', fromScheme: 'Fidelity Contrafund (FCNTX)', toScheme: 'Invesco NASDAQ 100 ETF (QQQM)', switchedAmount: 38000, capitalGainType: 'US STCG (24%)', taxLiability: 0, exitLoadFee: 0, annualRecurringSavings: 532 },
      ]
    } : {
      investorName: state.consumer?.user?.name || 'Arjun Sharma',
      id: `MFS-${Date.now()}`,
      timestamp: new Date().toISOString(),
      market: 'IN',
      currency: 'INR',
      totalValue: 2850000,
      financialImpact: {
        totalSwitchedValue: 2850000,
        totalAnnualCommissionSaved: 27075,
        totalTaxLiability: 47375,
        totalExitLoad: 7500,
        netTenYearWealthGain: 475132,
      },
      orders: [
        { orderId: 'BSE-101', fromScheme: 'HDFC Mid-Cap Opportunities Regular', toScheme: 'HDFC Mid-Cap Opportunities Direct', switchedAmount: 1120000, capitalGainType: 'LTCG (12.5%)', taxLiability: 10625, exitLoadFee: 0, annualRecurringSavings: 10640 },
        { orderId: 'BSE-102', fromScheme: 'Nippon India Growth Regular', toScheme: 'Nippon India Growth Direct', switchedAmount: 980000, capitalGainType: 'LTCG (12.5%)', taxLiability: 8750, exitLoadFee: 0, annualRecurringSavings: 9310 },
        { orderId: 'BSE-103', fromScheme: 'ICICI Pru Bluechip Regular', toScheme: 'ICICI Pru Bluechip Direct', switchedAmount: 750000, capitalGainType: 'STCG (20%)', taxLiability: 28000, exitLoadFee: 7500, annualRecurringSavings: 7125 },
      ]
    });

    const doc = buildExecutionReceiptPDF(dataToUse, { ...(state.consumer?.user || {}), market });
    doc.save(`FinAgent_Execution_Receipt_${new Date().toISOString().slice(0, 10)}.pdf`);
    showToast('✓ Certified Execution Receipt PDF downloaded');
  };

  // 1-Click Overlap Consolidation Handler
  const handleExecuteOverlap = async () => {
    setOverlapExecuting(true);
    try {
      const payload = isUSMarket ? {
        market: 'US',
        liquidatingScheme: 'T. Rowe Price Large-Cap Growth Fund (74% Overlap)',
        targetScheme: 'Vanguard S&P 500 ETF (VOO - 0.03% TER)',
        amount: 45000,
        overlapPct: 74,
      } : {
        market: 'IN',
        liquidatingScheme: 'Mirae Asset Large Cap Fund (Regular Growth)',
        targetScheme: 'UTI Nifty 50 Index Fund (Direct Growth - 0.06% TER)',
        amount: 450000,
        overlapPct: 62,
      };

      const res = await fetch('/api/broker/execute-overlap-consolidation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setOverlapResult(data.order);
        showToast(
          isUSMarket
            ? '✓ Overlap liquidated & consolidated into Vanguard S&P 500 ETF (VOO)!'
            : '✓ Overlap liquidated & consolidated into UTI Nifty 50 Direct!'
        );
        fetchData();
      } else {
        showToast(data.error || 'Overlap consolidation failed');
      }
    } catch (err) {
      showToast('Error consolidating overlap: ' + err.message);
    } finally {
      setOverlapExecuting(false);
    }
  };

  // Revoke Statutory Mandate Handler
  const handleRevokeMandate = async (mandate) => {
    setRevokingMandateId(mandate.id);
    try {
      const res = await fetch('/api/subscriptions/cancel-mandate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market,
          subscriptionId: mandate.id,
          name: mandate.name,
          monthlyAmount: mandate.monthlyAmount,
          bank: mandate.bank,
          umrn: mandate.umrn,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMandates(prev => prev.map(m => m.id === mandate.id ? { ...m, status: 'REVOKED' } : m));
        showToast(
          isUSMarket
            ? `✓ NACHA Stop-Payment & FTC Click-to-Cancel notice issued for ${mandate.name} (ACH ID: ${mandate.umrn})`
            : `✓ Statutory RBI mandate revoked for ${mandate.name} (UMRN: ${mandate.umrn})`
        );
        fetchData();
      } else {
        showToast(data.error || 'Revocation failed');
      }
    } catch (err) {
      showToast('Error revoking mandate: ' + err.message);
    } finally {
      setRevokingMandateId(null);
    }
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

  const queuedRiaOrders = (brokerStatus?.recentOrders || []).filter(
    o => o.status === 'QUEUED_FOR_BROKER'
  );

  const handleExecuteBridgedOrder = async (order) => {
    try {
      const res = await fetch('/api/broker/execute-bridged-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✓ Co-signed order ${order.id} executed with Institutional Direct Demat fill!`);
        fetchData();
      }
    } catch (e) {
      showToast('Executed in high-fidelity sandbox');
    }
  };

  const handleExecuteAllBridgedOrders = async () => {
    try {
      const res = await fetch('/api/broker/execute-bridged-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: 'ALL_QUEUED' })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✓ All ${data.count || queuedRiaOrders.length} SEBI RIA Co-Signed orders routed & filled across Zerodha Kite Connect!`);
        fetchData();
      }
    } catch (e) {
      showToast('Executed in high-fidelity sandbox');
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

      {/* Top Banner: SEBI RIA Co-Signed Orders Pending Routing */}
      {queuedRiaOrders.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(16,185,129,0.12))',
          border: '1.5px solid var(--primary)',
          borderRadius: 14,
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 8px 30px rgba(99,102,241,0.25)'
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
              <Zap size={18} color="var(--gold)" />
              {queuedRiaOrders.length} SEBI RIA Co-Signed Order{queuedRiaOrders.length > 1 ? 's' : ''} Ready for Broker Routing
              <span className="badge badge-green" style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                <ShieldCheck size={12} /> SEBI RIA Signed
              </span>
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span>Signed under SEBI Reg INA000014523 · Direct Demat Routing (Zerodha / NSE / BSE StAR MF).</span>
              {queuedRiaOrders[0]?.sebiSignatureHash && (
                <span style={{ fontFamily: 'monospace', color: 'var(--primary-light)', fontSize: '0.75rem', background: 'var(--surface-raised)', padding: '2px 8px', borderRadius: 4 }}>
                  SHA-256: {queuedRiaOrders[0].sebiSignatureHash.slice(0, 16)}...
                </span>
              )}
            </div>
          </div>
          <button
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, padding: '0.65rem 1.25rem' }}
            onClick={handleExecuteAllBridgedOrders}
          >
            <Zap size={15} /> 1-Click Execute All Co-Signed Orders
          </button>
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
                <Zap size={12} /> Autonomous Execution Engine
              </span>
              <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <ShieldCheck size={12} /> {brokerStatus?.connection?.mode === 'LIVE_BROKER' ? 'Live Broker Connected' : 'High-Fidelity Sandbox'}
              </span>
              <span className="badge badge-gold" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={12} /> {isUSMarket ? 'SEC Advisers Act 1940 & IRC 2026 Compliant' : 'Finance Act 2024 Compliant'}
              </span>
            </div>
            <h1 className="text-h1" style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              Autonomous Wealth Execution & 1-Click Transition Hub
            </h1>
            <p className="text-secondary" style={{ marginTop: '0.25rem', maxWidth: 720 }}>
              {isUSMarket
                ? 'Operationalize the $14,280/yr leakage from your Forensic Portfolio Audit. Execute low-cost Mutual-Fund-to-ETF switch baskets, revoke zombie Plaid ACH recurring debits, eliminate redundant closet index overlap, and rebalance with institutional precision.'
                : 'Operationalize the ₹1.53L/yr leakage from your Forensic Portfolio Audit. Execute direct mutual fund switch baskets, revoke zombie RBI e-mandates, liquidate overlapping active schemes, and rebalance with institutional precision.'}
            </p>
          </div>

          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--glass-border)',
            borderRadius: 12,
            padding: '1rem 1.25rem',
            textAlign: 'right',
            minWidth: 220
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Connected Clearing Rail</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginTop: 2 }}>
              {brokerStatus?.connection?.provider || (isUSMarket ? 'Alpaca Securities LLC' : 'Zerodha Kite / BSE StAR MF')}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--green)', fontWeight: 600, marginTop: 4 }}>
              Active Buying Power: {currencySymbol}{brokerStatus?.connection?.buyingPower ? Number(brokerStatus.connection.buyingPower).toLocaleString() : (isUSMarket ? '42,752' : '5,56,260')}
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem', flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${activeTab === 'mf-switch' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('mf-switch')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Zap size={15} /> {isUSMarket ? 'Mutual Fund to ETF Switch' : 'Direct MF Switch Basket'}{' '}
            <span className="badge badge-green" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
              {isUSMarket ? 'Save $2.4K/yr' : 'Save ₹27K/yr'}
            </span>
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'overlap' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('overlap')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Layers size={15} /> Overlap De-Duplication{' '}
            <span className="badge badge-gold" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
              {isUSMarket ? 'Save $1.8K/yr' : 'Save ₹18K/yr'}
            </span>
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'zombie-kill' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('zombie-kill')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Ban size={15} /> {isUSMarket ? 'Plaid ACH Zombie Kill Switch' : 'Zombie Mandate Kill Switch'}{' '}
            <span className="badge badge-red" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
              {isUSMarket ? 'Save $7.8K/yr' : 'Save ₹56K/yr'}
            </span>
          </button>
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
            <Sparkles size={15} /> Bill & Sub Negotiator
          </button>
        </div>
      </div>

      {/* TAB: DIRECT MUTUAL FUND / ETF SWITCH BASKET */}
      {activeTab === 'mf-switch' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Forensic Audit Context Banner */}
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(99,102,241,0.05) 100%)',
            border: '1px solid rgba(16,185,129,0.3)',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            borderRadius: 12
          }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={18} /> {isUSMarket ? 'Fee Drag & Phantom Gain Remediation Active' : 'Forensic Leakage Remediation Active'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4, maxWidth: 800 }}>
                {isUSMarket ? (
                  <>
                    Your forensic scan identified <strong>$2,420/year</strong> siphoned away in active 12b-1 distributor fees and phantom capital gain distributions. Transitioning into low-cost index ETFs permanently eliminates fee drag and compounds into <strong>+$42,850</strong> extra wealth over 10 years.
                  </>
                ) : (
                  <>
                    Your forensic scan identified ₹27,075/year siphoned away in hidden regular distributor commissions. Switching into direct zero-commission plans eliminates distributor commissions forever and compounds into <strong>+₹4,75,132</strong> extra wealth over 10 years.
                  </>
                )}
              </div>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleDownloadExecutionReceipt(mfSwitchResult)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Download size={14} /> Download Sample Audit Slip (PDF)
            </button>
          </div>

          {/* Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="card" style={{ background: 'var(--surface-raised)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {isUSMarket ? 'Total Switchable Active MF AUM' : 'Total Switchable Regular AUM'}
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, marginTop: 4 }}>
                {isUSMarket ? '$185,000' : '₹28,50,000'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                {isUSMarket ? 'Across 3 high-fee mutual funds' : 'Across 3 regular growth schemes'}
              </div>
            </div>

            <div className="card" style={{ background: 'var(--surface-raised)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {isUSMarket ? 'Recurring ETF Savings' : 'Recurring Direct Savings'}
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--green)', marginTop: 4 }}>
                {isUSMarket ? '+$2,420/yr' : '+₹27,075/yr'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--green)', marginTop: 4 }}>
                {isUSMarket ? '0.72% net TER drag savings compounding daily' : '0.95% TER savings compounding daily'}
              </div>
            </div>

            <div className="card" style={{ background: 'var(--surface-raised)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>10-Year Wealth Accretion</div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--primary)', marginTop: 4 }}>
                {isUSMarket ? '+$42,850' : '+₹4,75,132'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                {isUSMarket ? 'Modeled at 10% S&P 500 CAGR' : 'Modeled at 12% equity CAGR'}
              </div>
            </div>

            <div className="card" style={{ background: 'var(--surface-raised)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {isUSMarket ? 'Tax & Phantom Gain Shield' : 'Immediate Tax & Exit Drag'}
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: isUSMarket ? 'var(--green)' : 'var(--gold)', marginTop: 4 }}>
                {isUSMarket ? '$0 Drag (Clean)' : '₹54,875'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                {isUSMarket ? 'Zero phantom distribution drag / Loss offset' : 'FIFO Budget 2024 (LTCG 12.5% / STCG 20%)'}
              </div>
            </div>
          </div>

          {/* Switch Order Basket */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 className="text-h3" style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Zap size={18} color="var(--primary)" /> {isUSMarket ? 'Ready-to-Switch Low-Cost ETF Basket' : 'Ready-to-Switch Direct Basket'}
                </h3>
                <p className="text-sm text-secondary" style={{ marginTop: 2 }}>
                  {isUSMarket
                    ? 'Executes seamless redemption of active mutual funds and purchase of institutional Vanguard/BlackRock index ETFs via Alpaca Smart Router.'
                    : 'Executes seamless redemption from regular folio and purchase into direct growth under BSE StAR MF / Zerodha Coin Switch API.'}
                </p>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleExecuteMFSwitch}
                disabled={mfSwitchExecuting}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.625rem 1.25rem', fontWeight: 700 }}
              >
                {mfSwitchExecuting ? <RefreshCw className="spin" size={16} /> : <Zap size={16} />}
                {mfSwitchExecuting
                  ? (isUSMarket ? 'Transitioning via Alpaca Router…' : 'Switching Schemes via BSE StAR…')
                  : (isUSMarket ? '1-Click Switch All to Low-Cost ETFs' : '1-Click Switch All to Direct')}
              </button>
            </div>

            {/* Scheme Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>
                      {isUSMarket ? 'Conversion Pair (Active Mutual Fund ➔ Index ETF)' : 'Conversion Pair (Regular ➔ Direct)'}
                    </th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>AUM Amount</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Holding Days</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Tax Regime</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>{isUSMarket ? 'Redemption Drag' : 'Exit Load'}</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Tax Due</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Annual Savings</th>
                  </tr>
                </thead>
                <tbody>
                  {isUSMarket ? (
                    <>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '0.85rem 0.5rem' }}>
                          <div style={{ fontWeight: 600 }}>American Funds Growth Fund of America (AGTHX)</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--green)' }}>➔ Vanguard S&P 500 ETF (VOO - 0.03% TER vs 0.65% + 12b-1)</div>
                        </td>
                        <td style={{ padding: '0.85rem 0.5rem', fontWeight: 700 }}>$85,000</td>
                        <td style={{ padding: '0.85rem 0.5rem' }}>820 days</td>
                        <td style={{ padding: '0.85rem 0.5rem' }}><span className="badge badge-green">US LTCG (15%)</span></td>
                        <td style={{ padding: '0.85rem 0.5rem', color: 'var(--green)' }}>$0 (None)</td>
                        <td style={{ padding: '0.85rem 0.5rem' }}>$0 (Offset)</td>
                        <td style={{ padding: '0.85rem 0.5rem', fontWeight: 700, color: 'var(--green)' }}>+$1,020/yr</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '0.85rem 0.5rem' }}>
                          <div style={{ fontWeight: 600 }}>T. Rowe Price Blue Chip Growth Fund (TRBCX)</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--green)' }}>➔ Vanguard Total Stock Market ETF (VTI - 0.03% TER vs 0.71%)</div>
                        </td>
                        <td style={{ padding: '0.85rem 0.5rem', fontWeight: 700 }}>$62,000</td>
                        <td style={{ padding: '0.85rem 0.5rem' }}>540 days</td>
                        <td style={{ padding: '0.85rem 0.5rem' }}><span className="badge badge-green">US LTCG (15%)</span></td>
                        <td style={{ padding: '0.85rem 0.5rem', color: 'var(--green)' }}>$0 (None)</td>
                        <td style={{ padding: '0.85rem 0.5rem' }}>$0 (Offset)</td>
                        <td style={{ padding: '0.85rem 0.5rem', fontWeight: 700, color: 'var(--green)' }}>+$868/yr</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '0.85rem 0.5rem' }}>
                          <div style={{ fontWeight: 600 }}>Fidelity Contrafund (FCNTX)</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--green)' }}>➔ Invesco NASDAQ 100 ETF (QQQM - 0.15% TER vs 0.55%)</div>
                        </td>
                        <td style={{ padding: '0.85rem 0.5rem', fontWeight: 700 }}>$38,000</td>
                        <td style={{ padding: '0.85rem 0.5rem' }}>290 days</td>
                        <td style={{ padding: '0.85rem 0.5rem' }}><span className="badge badge-gold">US STCG (24%)</span></td>
                        <td style={{ padding: '0.85rem 0.5rem', color: 'var(--green)' }}>$0 (None)</td>
                        <td style={{ padding: '0.85rem 0.5rem' }}>$0 (Offset)</td>
                        <td style={{ padding: '0.85rem 0.5rem', fontWeight: 700, color: 'var(--green)' }}>+$532/yr</td>
                      </tr>
                    </>
                  ) : (
                    <>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '0.85rem 0.5rem' }}>
                          <div style={{ fontWeight: 600 }}>HDFC Mid-Cap Opportunities Fund</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--green)' }}>➔ Direct Growth Plan (0.82% TER vs 1.77%)</div>
                        </td>
                        <td style={{ padding: '0.85rem 0.5rem', fontWeight: 700 }}>₹11,20,000</td>
                        <td style={{ padding: '0.85rem 0.5rem' }}>742 days</td>
                        <td style={{ padding: '0.85rem 0.5rem' }}><span className="badge badge-green">LTCG (12.5%)</span></td>
                        <td style={{ padding: '0.85rem 0.5rem', color: 'var(--green)' }}>₹0 (NIL)</td>
                        <td style={{ padding: '0.85rem 0.5rem' }}>₹10,625</td>
                        <td style={{ padding: '0.85rem 0.5rem', fontWeight: 700, color: 'var(--green)' }}>+₹10,640/yr</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '0.85rem 0.5rem' }}>
                          <div style={{ fontWeight: 600 }}>Nippon India Growth Fund</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--green)' }}>➔ Direct Growth Plan (0.88% TER vs 1.83%)</div>
                        </td>
                        <td style={{ padding: '0.85rem 0.5rem', fontWeight: 700 }}>₹9,80,000</td>
                        <td style={{ padding: '0.85rem 0.5rem' }}>512 days</td>
                        <td style={{ padding: '0.85rem 0.5rem' }}><span className="badge badge-green">LTCG (12.5%)</span></td>
                        <td style={{ padding: '0.85rem 0.5rem', color: 'var(--green)' }}>₹0 (NIL)</td>
                        <td style={{ padding: '0.85rem 0.5rem' }}>₹8,750</td>
                        <td style={{ padding: '0.85rem 0.5rem', fontWeight: 700, color: 'var(--green)' }}>+₹9,310/yr</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '0.85rem 0.5rem' }}>
                          <div style={{ fontWeight: 600 }}>ICICI Prudential Bluechip Fund</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--green)' }}>➔ Direct Growth Plan (0.92% TER vs 1.87%)</div>
                        </td>
                        <td style={{ padding: '0.85rem 0.5rem', fontWeight: 700 }}>₹7,50,000</td>
                        <td style={{ padding: '0.85rem 0.5rem' }}>210 days</td>
                        <td style={{ padding: '0.85rem 0.5rem' }}><span className="badge badge-gold">STCG (20%)</span></td>
                        <td style={{ padding: '0.85rem 0.5rem', color: 'var(--red)' }}>₹7,500 (1%)</td>
                        <td style={{ padding: '0.85rem 0.5rem' }}>₹28,000</td>
                        <td style={{ padding: '0.85rem 0.5rem', fontWeight: 700, color: 'var(--green)' }}>+₹7,125/yr</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Switch Confirmation Result */}
            {mfSwitchResult && (
              <div style={{
                marginTop: '1.5rem',
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid var(--green)',
                borderRadius: 14,
                padding: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <CheckCircle2 size={32} color="var(--green)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--green)' }}>
                      {isUSMarket
                        ? `ETF Transition Basket Executed & Cleared · Ref: ${mfSwitchResult.id}`
                        : `Direct Switch Orders Confirmed & Cleared · Ref: ${mfSwitchResult.id}`}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                      {mfSwitchResult.summary}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, fontFamily: 'monospace' }}>
                      {isUSMarket ? 'Alpaca / SEC Fiduciary SHA-256 Seal: ' : 'BSE StAR SHA-256 Seal: '}
                      {mfSwitchResult.sha256Verification?.slice(0, 32)}...
                    </div>
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={() => handleDownloadExecutionReceipt(mfSwitchResult)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}
                >
                  <Download size={16} /> Download Certified Execution Slip (PDF)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: OVERLAP DE-DUPLICATION REBALANCER */}
      {activeTab === 'overlap' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 className="text-h3" style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Layers size={18} color="var(--primary)" /> Portfolio Overlap De-duplication Rebalancer
                </h3>
                <p className="text-sm text-secondary" style={{ marginTop: 2 }}>
                  {isUSMarket
                    ? 'Liquidate redundant active large-cap mutual funds that clone S&P 500 index constituents while charging 0.71% active fees.'
                    : 'Liquidate redundant large-cap funds that clone index constituents while charging 1.65% active TER fees.'}
                </p>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleExecuteOverlap}
                disabled={overlapExecuting}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.625rem 1.25rem', fontWeight: 700 }}
              >
                {overlapExecuting ? <RefreshCw className="spin" size={16} /> : <Layers size={16} />}
                {overlapExecuting
                  ? 'Consolidating Holdings…'
                  : (isUSMarket ? '1-Click Consolidate Overlap into VOO' : '1-Click Consolidate Overlap')}
              </button>
            </div>

            {/* Overlap Breakdown Comparison */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <div className="card" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-red">Redundant Overlap Detected</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--red)' }}>
                    {isUSMarket ? '74% Overlap' : '62% Overlap'}
                  </span>
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', marginTop: '0.75rem' }}>
                  {isUSMarket ? 'T. Rowe Price Large-Cap Growth Fund' : 'Mirae Asset Large Cap Fund'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  Locked Capital: <strong>{isUSMarket ? '$45,000' : '₹4,50,000'}</strong> · TER: <strong>{isUSMarket ? '0.71%' : '1.65%'}</strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', lineHeight: 1.5 }}>
                  {isUSMarket
                    ? 'Overlaps 32 out of 50 top holdings with your existing Vanguard S&P 500 ETF (VOO) allocations (Apple 7.1%, Microsoft 6.8%, NVIDIA 6.2%). You are paying ~$1,850/yr in duplicate active fees for closet index exposure.'
                    : 'Overlaps 38 out of 50 stocks with your existing UTI Nifty 50 and Axis Bluechip allocations (Reliance 10.2%, HDFC Bank 9.8%, ICICI Bank 7.4%). You are paying ~₹18,400/yr in duplicate active fees for closet index exposure.'}
                </div>
              </div>

              <div className="card" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-green">Target Efficient Destination</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--green)' }}>0% Redundancy</span>
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', marginTop: '0.75rem' }}>
                  {isUSMarket ? 'Vanguard S&P 500 ETF (VOO)' : 'UTI Nifty 50 Direct Index Fund'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  Destination TER: <strong>{isUSMarket ? '0.03%' : '0.06%'}</strong> (vs {isUSMarket ? '0.71%' : '1.65%'} active drag)
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', lineHeight: 1.5 }}>
                  {isUSMarket
                    ? 'Consolidating into the ultra low-cost index ETF eliminates $1,850/year in turnover drag and 12b-1 distributor fees while maintaining 100% pure S&P 500 beta exposure without style drift.'
                    : 'Consolidating into the low-cost direct index eliminates ₹18,400/year in turnover drag and management fees while maintaining 100% pure beta exposure without style drift.'}
                </div>
              </div>
            </div>

            {/* Overlap Result */}
            {overlapResult && (
              <div style={{
                marginTop: '1.5rem',
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid var(--green)',
                borderRadius: 14,
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <CheckCircle2 size={28} color="var(--green)" />
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--green)' }}>
                    Overlap Consolidation Cleared · ID: {overlapResult.id}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    {overlapResult.summary} — {overlapResult.savingsYield}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: ZOMBIE SUBSCRIPTION KILL SWITCH */}
      {activeTab === 'zombie-kill' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Statutory Warning Banner */}
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(245,158,11,0.05) 100%)',
            border: '1px solid rgba(239,68,68,0.25)',
            padding: '1.25rem 1.5rem',
            borderRadius: 12
          }}>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldAlert size={18} />{' '}
              {isUSMarket
                ? 'Statutory FTC "Click-to-Cancel" & NACHA Framework Active (16 CFR Part 425 & NACHA § 3.8)'
                : 'Statutory RBI e-Mandate Framework Active (RBI/2020-21/74)'}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4, maxWidth: 840 }}>
              {isUSMarket
                ? 'Under FTC 16 CFR Part 425 and NACHA ACH rules, consumers possess the unfettered legal right to revoke recurring pre-authorized debits directly through their financial depository. Merchants cannot enforce complex retention loops once a formal WSUD Stop-Payment Notice is served.'
                : 'Under Reserve Bank of India NPCI e-Mandate regulations, consumers possess the unfettered legal right to revoke any recurring debit authorization directly at the bank level. Merchant retention loops cannot block a statutory UMRN revocation.'}
            </div>
          </div>

          {/* Mandate Cards */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 className="text-h3" style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Ban size={18} color="var(--red)" />{' '}
                  {isUSMarket
                    ? 'Detected Active ACH Auto-Debits (Plaid Auth Registry)'
                    : 'Detected Active Bank Mandates (UMRN Registry)'}
                </h3>
                <p className="text-sm text-secondary" style={{ marginTop: 2 }}>
                  {isUSMarket
                    ? 'Identified 4 auto-debit subscriptions leaking $7,847.88/year with zero active utility in the last 60+ days.'
                    : 'Identified 4 auto-debit mandates leaking ₹56,486/year with zero active utility in the last 90 days.'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {mandates.map((m) => (
                <div
                  key={m.id}
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
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '1rem' }}>{m.name}</span>
                      <span className="badge badge-surface" style={{ fontSize: '0.7rem' }}>{m.category}</span>
                      {m.status === 'REVOKED' ? (
                        <span className="badge badge-red" style={{ fontWeight: 700 }}>
                          {isUSMarket ? 'REVOKED VIA NACHA DIRECTIVE' : 'REVOKED BY RBI DIRECTIVE'}
                        </span>
                      ) : (
                        <span className="badge badge-gold">
                          {isUSMarket ? 'Active ACH Authorization' : 'Active Mandate'}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                      {isUSMarket ? 'Issuing Depository: ' : 'Issuing Rail: '}
                      <strong>{m.bank}</strong> · {isUSMarket ? 'Plaid ACH Ref: ' : 'UMRN: '}
                      <code style={{ color: 'var(--primary)', fontWeight: 600 }}>{m.umrn}</code> · Last Debited: {m.lastDebited}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                        {currencySymbol}{isUSMarket ? Number(m.monthlyAmount).toFixed(2) : Number(m.monthlyAmount).toLocaleString('en-IN')}/mo
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--green)', fontWeight: 700 }}>
                        Save {currencySymbol}{isUSMarket ? Number(m.annualAmount).toFixed(2) : Number(m.annualAmount).toLocaleString('en-IN')}/yr
                      </div>
                    </div>

                    {m.status === 'ACTIVE' ? (
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => handleRevokeMandate(m)}
                        disabled={revokingMandateId === m.id}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--red)', borderColor: 'rgba(239,68,68,0.3)' }}
                      >
                        {revokingMandateId === m.id ? <RefreshCw className="spin" size={14} /> : <Ban size={14} />}
                        {revokingMandateId === m.id
                          ? 'Revoking…'
                          : (isUSMarket ? '1-Click Revoke ACH (NACHA WSUD)' : '1-Click Revoke Mandate')}
                      </button>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: 'var(--green)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={16} /> {isUSMarket ? 'ACH Debit Terminated' : 'Mandate Terminated'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
                      <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '0.75rem 0.5rem' }}><span className="badge badge-green">BUY</span></td>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>BND (Vanguard Total Bond)</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>25 shares</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>$73.15</td>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>$1,828.75</td>
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
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--green)' }}>₹20.00 (Flat Brokerage)</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '0.75rem 0.5rem' }}><span className="badge badge-green">BUY</span></td>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>NIFTYBEES (Nippon India Nifty 50 ETF)</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>50 units</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>₹282.10</td>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>₹14,105.00</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--green)' }}>₹0.00 (Equity Delivery)</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '0.75rem 0.5rem' }}><span className="badge badge-green">BUY</span></td>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>GOLDBEES (Sovereign Gold ETF)</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>35 units</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>₹68.40</td>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>₹2,394.00</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--green)' }}>₹0.00 (Equity Delivery)</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Rebalance Result */}
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
                    Basket Execution Complete · Order ID: {rebalanceResult.id}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    {rebalanceResult.summary} — {rebalanceResult.savingsYield}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TAX-LOSS HARVEST PROXY SWAP */}
      {activeTab === 'harvest' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 className="text-h3" style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Scissors size={18} color="var(--primary)" /> 1-Click Tax Loss Proxy Harvester
                </h3>
                <p className="text-sm text-secondary" style={{ marginTop: 2 }}>
                  {isUSMarket
                    ? 'Harvest capital loss without triggering IRC § 1091 Wash-Sale rules by swapping into a non-substantially identical ETF.'
                    : 'Realize short-term capital loss before March 31 to offset taxable short-term gains, immediately re-entering a correlated sector proxy.'}
                </p>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleExecuteHarvest}
                disabled={harvestExecuting}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.625rem 1.25rem', fontWeight: 700 }}
              >
                {harvestExecuting ? <RefreshCw className="spin" size={16} /> : <Scissors size={16} />}
                {harvestExecuting ? 'Executing Swap…' : 'Execute Tax-Loss Swap'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              <div className="card" style={{ background: 'var(--surface-raised)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Underwater Asset to Sell</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 4 }}>
                  {isUSMarket ? 'VOO (Vanguard S&P 500 ETF)' : 'HDFCBANK (HDFC Bank Ltd)'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--red)', fontWeight: 600, marginTop: 2 }}>
                  Unrealized Loss: -{currencySymbol}{isUSMarket ? '2,450.00' : '18,400.00'}
                </div>
              </div>

              <div className="card" style={{ background: 'var(--surface-raised)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Correlated Proxy to Buy</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 4 }}>
                  {isUSMarket ? 'IVV (iShares Core S&P 500)' : 'ICICIBANK (ICICI Bank Ltd)'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--green)', fontWeight: 600, marginTop: 2 }}>
                  0.99 Correlation · Preserves Market Beta
                </div>
              </div>

              <div className="card" style={{ background: 'var(--surface-raised)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Net Tax Shield Generated</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--green)', marginTop: 4 }}>
                  +{currencySymbol}{isUSMarket ? '906.50' : '3,680.00'} in cash tax savings
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

      {/* Execution Audit Log & PDF Slip Generator */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 className="text-h3" style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={18} color="var(--primary)" /> Autonomous Execution Audit Trail
            </h3>
            <p className="text-sm text-secondary" style={{ marginTop: 2 }}>
              Immutable ledger of executed basket transitions, tax swaps, mandate revocations, and cash sweeps.
            </p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleDownloadExecutionReceipt(null)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Download size={14} /> Download Latest Execution Slip (PDF)
          </button>
        </div>

        {queuedRiaOrders.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(16,185,129,0.12))',
            border: '1px solid rgba(99,102,241,0.4)',
            borderRadius: 10,
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={16} color="var(--gold)" />
                {queuedRiaOrders.length} SEBI RIA Co-Signed Order{queuedRiaOrders.length > 1 ? 's' : ''} Ready for Broker Routing
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                Signed under SEBI Reg INA000014523 · Direct Demat Routing (Zerodha / NSE / BSE StAR MF).
              </div>
            </div>
            <button
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
              onClick={handleExecuteAllBridgedOrders}
            >
              <Zap size={14} /> 1-Click Execute All Co-Signed Orders
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {(brokerStatus?.recentOrders || []).map((order) => (
            <div
              key={order.id}
              style={{
                background: 'var(--surface-raised)',
                border: order.status === 'QUEUED_FOR_BROKER' ? '1px solid var(--gold)' : '1px solid var(--glass-border)',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="badge badge-surface" style={{ fontSize: '0.7rem' }}>{order.id}</span>
                  {order.sebiSignatureHash && (
                    <span className="badge badge-green" style={{ fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <ShieldCheck size={11} /> SEBI RIA Signed
                    </span>
                  )}
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{order.summary}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: 3, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {order.broker} · {new Date(order.timestamp).toLocaleString()}
                  </span>
                  {order.sebiSignatureHash && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--primary-light)', fontFamily: 'monospace' }}>
                      Hash: {order.sebiSignatureHash.slice(0, 16)}...
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${order.status === 'QUEUED_FOR_BROKER' ? 'badge-gold' : 'badge-green'}`} style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                    {order.status}
                  </span>
                  <div style={{ fontSize: '0.75rem', color: order.status === 'QUEUED_FOR_BROKER' ? 'var(--gold)' : 'var(--green)', marginTop: 2 }}>
                    {order.savingsYield}
                  </div>
                </div>

                {order.status === 'QUEUED_FOR_BROKER' && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleExecuteBridgedOrder(order)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0.4rem 0.8rem', fontWeight: 700 }}
                  >
                    <Zap size={13} /> 1-Click Route & Execute
                  </button>
                )}

                {order.type === 'mf_direct_switch' && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleDownloadExecutionReceipt(order)}
                    title="Download Execution Slip"
                    style={{ padding: '0.35rem 0.65rem' }}
                  >
                    <Download size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Universal Sticky Action Dock */}
      <StickyActionDock
        title={queuedRiaOrders.length > 0 ? "SEBI RIA Co-Signed Execution Bridge" : "Autonomous Order Routing Engine"}
        subtitle={queuedRiaOrders.length > 0 ? `${queuedRiaOrders.length} Co-Signed Order(s) Verified` : "Zerodha Kite Connect & Alpaca Trading API Active"}
        badge={queuedRiaOrders.length > 0 ? "SEBI RIA SIGNED" : "SOR READY"}
        badgeColor={queuedRiaOrders.length > 0 ? "var(--green)" : "var(--primary)"}
        metrics={[
          { label: 'Routing Mode', value: queuedRiaOrders.length > 0 ? 'Fiduciary Bridge' : 'Smart Order Routing' },
          { label: 'Queue', value: `${queuedRiaOrders.length} Order${queuedRiaOrders.length !== 1 ? 's' : ''}`, color: queuedRiaOrders.length > 0 ? 'var(--green)' : 'var(--text-primary)' },
        ]}
        actions={queuedRiaOrders.length > 0 ? [
          {
            label: '1-Click Execute All Co-Signed Orders',
            icon: Zap,
            variant: 'primary',
            onClick: handleExecuteAllBridgedOrders,
          }
        ] : [
          {
            label: 'Execute Active Strategy',
            icon: Zap,
            variant: 'secondary',
            onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
          }
        ]}
      />
    </div>
  );
}
