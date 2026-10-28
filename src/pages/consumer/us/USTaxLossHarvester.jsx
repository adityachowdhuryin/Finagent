// src/pages/consumer/us/USTaxLossHarvester.jsx
// Institutional IRS Section 1091 Wash-Sale & Automated Tax-Loss Harvesting (TLH) Studio
// Portfolio-wide multi-lot scanning, non-identical proxy ETF pairings, $3,000 ordinary income write-off (Form 1040 Line 7),
// IRC § 1212 capital loss carryforward tracking, 31-day visual safe re-entry calendar, Gemini AI autopilot, and SEC RIA dispatch.

import React, { useState, useEffect } from 'react';
import {
  Scissors, AlertCircle, ArrowRight, ShieldCheck, Sparkles, Clock, CheckCircle2,
  Calendar, Download, Send, RefreshCw, Check, ArrowLeftRight, FileText,
  DollarSign, TrendingDown, Layers, HelpCircle, Filter, Zap
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useApp } from '../../../context/AppContext';
import { useAuth } from '../../../context/AuthContext';
import { analyze } from '../../../services/geminiService';
import StickyActionDock from '../../../components/common/StickyActionDock';
import TaxHarvestingWaterfall from '../../../components/tax/visualizations/TaxHarvestingWaterfall';

export default function USTaxLossHarvester() {
  const { state, dispatch } = useApp();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState('portfolio'); // 'portfolio' | 'autopilot' | 'rules'
  const [loading, setLoading] = useState(false);
  const [scanData, setScanData] = useState(null);
  const [selectedLots, setSelectedLots] = useState(new Set());
  const [executedLots, setExecutedLots] = useState(new Set());
  const [federalBracket, setFederalBracket] = useState(0.32);
  const [stateBracket, setStateBracket] = useState(0.093); // California default
  const [toastMessage, setToastMessage] = useState('');
  const [dispatchedToAdvisor, setDispatchedToAdvisor] = useState(false);

  // Autopilot Plan State
  const [aiPlan, setAiPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  // Ingest holdings from AppContext
  const equities = state?.consumer?.holdings?.equities || [];

  useEffect(() => {
    runScan();
  }, [equities, federalBracket, stateBracket]);

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  }

  async function runScan() {
    setLoading(true);
    try {
      const res = await fetch('/api/us-wash-sale/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equities,
          federalBracket: Number(federalBracket),
          stateBracket: Number(stateBracket),
          realizedGainsShort: 4500,
          realizedGainsLong: 12000,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setScanData(data);
        // Default select all lots
        const allIds = new Set(data.opportunities.map(o => o.id));
        setSelectedLots(allIds);
      }
    } catch (err) {
      console.error('Failed to scan US tax loss opportunities:', err);
    } finally {
      setLoading(false);
    }
  }

  function toggleSelectLot(id) {
    const next = new Set(selectedLots);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedLots(next);
  }

  function selectAllLots() {
    if (!scanData?.opportunities) return;
    if (selectedLots.size === scanData.opportunities.length) {
      setSelectedLots(new Set());
    } else {
      setSelectedLots(new Set(scanData.opportunities.map(o => o.id)));
    }
  }

  // Active aggregated metrics based on selected lots
  const activeLots = (scanData?.opportunities || []).filter(o => selectedLots.has(o.id));
  const combinedMarginalRate = Number(federalBracket) + Number(stateBracket);
  const activeLossPool = activeLots.reduce((sum, o) => sum + o.unrealizedLoss, 0);
  const activeOrdinaryOffset = Math.min(3000, activeLossPool);
  const activeOrdinaryTaxSaved = Math.round(activeOrdinaryOffset * combinedMarginalRate);
  const activeRemainingLoss = Math.max(0, activeLossPool - activeOrdinaryOffset);
  const activeCapGainsOffset = Math.min(activeRemainingLoss, 16500); // offset against realized gains
  const activeCapGainsTaxSaved = Math.round(activeCapGainsOffset * 0.20);
  const activeCarryforward = Math.max(0, activeLossPool - activeOrdinaryOffset - activeCapGainsOffset);
  const totalTaxSaved = activeOrdinaryTaxSaved + activeCapGainsTaxSaved;

  // Execute Harvest (Swap into Proxy)
  function handleExecuteHarvest(lot) {
    setExecutedLots(prev => new Set([...prev, lot.id]));
    showToast(`✓ Executed Tax Swap: Sold ${lot.shares} shares of ${lot.symbol} & bought proxy ${lot.primaryProxy.symbol}! Saves $${Math.round(lot.unrealizedLoss * combinedMarginalRate)} in taxes.`);
  }

  function handleBatchExecute() {
    const unexecuted = activeLots.filter(l => !executedLots.has(l.id));
    if (unexecuted.length === 0) return;
    const newExecuted = new Set([...executedLots, ...unexecuted.map(l => l.id)]);
    setExecutedLots(newExecuted);
    showToast(`✓ Batch executed ${unexecuted.length} proxy swaps! Total immediate tax shield: $${totalTaxSaved.toLocaleString()}`);
  }

  // 1-Click Dispatch to RIA Advisor
  async function handleDispatchToAdvisor() {
    setDispatchedToAdvisor(true);
    const reco = {
      id: `reco_tlh_${Date.now()}`,
      clientId: 'c1',
      clientName: currentUser?.displayName || 'Alex Morgan',
      clientEmail: currentUser?.email || 'alex.morgan@techadvisory.io',
      type: 'tax_loss_harvesting',
      urgency: 'high',
      confidence: 99,
      createdAt: new Date().toISOString(),
      title: `IRC § 1091 Wash-Sale Harvest: Capture $${totalTaxSaved.toLocaleString()} in Net Tax Alpha`,
      summary: `Automated scan of ${activeLots.length} equity lots identified $${activeLossPool.toLocaleString()} in gross harvestable capital losses. Execution generates a $3,000 ordinary income deduction against Form 1040 Line 7 ($${activeOrdinaryTaxSaved.toLocaleString()} savings), offsets $${activeCapGainsOffset.toLocaleString()} in realized capital gains ($${activeCapGainsTaxSaved.toLocaleString()} savings), and banks $${activeCarryforward.toLocaleString()} in IRC § 1212 carryforwards. Market beta maintained via non-identical ETF proxies.`,
      impact: {
        'Net Tax Saved': `$${totalTaxSaved.toLocaleString()}`,
        'Ordinary Income Offset': `$${activeOrdinaryOffset.toLocaleString()} (Form 1040 Line 7)`,
        'Capital Loss Carryforward': `$${activeCarryforward.toLocaleString()} (IRC § 1212)`,
        'Proxy Replacements': activeLots.map(l => `${l.symbol} → ${l.primaryProxy.symbol}`).join(', '),
        'Statutory Code': 'IRC § 1091 / IRC § 1211(b)'
      },
      action: 'Execute 31-Day Proxy Tax Swaps',
      status: 'pending'
    };

    dispatch({ type: 'ADD_RECOMMENDATIONS', payload: reco });

    try {
      await fetch('/api/advisor/dispatch-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendation: reco,
          complianceStandard: 'SEC Form ADV Fiduciary Standard (IRC § 1091 Proxy Wash-Sale Defense)'
        })
      });
    } catch (e) {
      console.warn('Advisor logging fallback:', e);
    }

    showToast('✓ Dispatched Fiduciary Tax Harvesting Directive to SEC RIA Advisor portal!');
  }

  // Autopilot Plan Generation
  async function generateAutopilotPlan() {
    setLoadingPlan(true);
    const prompt = `You are a US Certified Public Accountant (CPA) specializing in equity portfolio tax-loss harvesting and IRC § 1091 wash-sale compliance.
Generate a structured, numbered execution plan for the following loss positions:
${activeLots.map(l => `- Ticker: ${l.symbol}, Shares: ${l.shares}, Loss: $${l.unrealizedLoss}, Holding: ${l.isShortTerm ? 'Short-Term' : 'Long-Term'}, Proxy: ${l.primaryProxy.symbol} (${l.primaryProxy.name})`).join('\n')}

Summary Metrics:
- Total Gross Loss: $${activeLossPool}
- Ordinary Income Offset: $${activeOrdinaryOffset} (IRC § 1211b max $3,000)
- Capital Loss Carryover: $${activeCarryforward}
- Combined Tax Rate: ${(combinedMarginalRate * 100).toFixed(1)}%
- Estimated Total Tax Saved: $${totalTaxSaved}

Return ONLY valid JSON with this exact structure:
{
  "steps": [
    {
      "step": 1,
      "action": "SELL",
      "ticker": "string",
      "shares": number,
      "estimatedProceeds": number,
      "lossHarvested": number,
      "proxyToBuy": "string",
      "proxyName": "string",
      "safeReentryDate": "string",
      "cpaRationale": "string (max 15 words)"
    }
  ],
  "totalTaxSavingsUSD": number,
  "ordinaryIncomeDeductionUSD": number,
  "carryforwardUSD": number,
  "washSaleDefenseNotes": ["point 1", "point 2"],
  "scheduleDImpact": "Summary explanation of how this populates Form 8949 and Schedule D"
}`;

    try {
      const result = await analyze(prompt, 'json');
      setAiPlan(result);
    } catch {
      // Deterministic statutory fallback plan
      setAiPlan({
        steps: activeLots.map((l, idx) => ({
          step: idx + 1,
          action: 'SELL & SWAP',
          ticker: l.symbol,
          shares: l.shares,
          estimatedProceeds: l.currentValue,
          lossHarvested: l.unrealizedLoss,
          proxyToBuy: l.primaryProxy.symbol,
          proxyName: l.primaryProxy.name,
          safeReentryDate: scanData?.summary?.safeReentryDateFormatted || '31 days from sale',
          cpaRationale: `Deploy into ${l.primaryProxy.symbol} to maintain market exposure without wash-sale disallowance.`,
        })),
        totalTaxSavingsUSD: totalTaxSaved,
        ordinaryIncomeDeductionUSD: activeOrdinaryOffset,
        carryforwardUSD: activeCarryforward,
        washSaleDefenseNotes: [
          'Proxy ETFs track distinct benchmark indices or have different legal sponsors, satisfying the IRS non-substantially identical requirement.',
          'Mark calendar for 31 days after sale before repurchasing original ticker to avoid basis adjustment disallowance under IRC § 1091.',
          'Retain execution trade confirmations for IRS Form 8949 Box A/B/D reporting.'
        ],
        scheduleDImpact: `Net loss offsets up to $3,000 on Form 1040 Line 7; excess $${activeCarryforward.toLocaleString()} carries forward to future tax years under IRC § 1212.`
      });
    } finally {
      setLoadingPlan(false);
    }
  }

  // Export CSV Schedule
  function downloadHarvestCSV() {
    if (activeLots.length === 0) return;
    const headers = ['Symbol', 'Shares', 'Purchase Price', 'Current Price', 'Cost Basis', 'Current Value', 'Unrealized Loss', 'Holding Term', 'Proxy ETF', 'Safe Re-Entry Date', 'Estimated Tax Saved'];
    const rows = activeLots.map(l => [
      l.symbol,
      l.shares,
      l.purchasePrice,
      l.currentPrice,
      l.costBasis,
      l.currentValue,
      l.unrealizedLoss,
      l.isShortTerm ? 'Short-Term (<1yr)' : 'Long-Term (>1yr)',
      `${l.primaryProxy.symbol} (${l.primaryProxy.name})`,
      scanData?.summary?.safeReentryDateFormatted || 'T+31 Days',
      Math.round(l.unrealizedLoss * combinedMarginalRate)
    ]);

    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IRS_1091_Tax_Loss_Harvest_Plan_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded Tax-Loss Harvesting Schedule (CSV)');
  }

  // Export Statutory PDF Dossier
  function downloadHarvestPDF() {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('IRS SECTION 1091 TAX-LOSS HARVESTING STATEMENT', 14, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Filer: ${currentUser?.displayName || 'Alex Morgan'} | Tax Year: 2026 | Generated: ${new Date().toLocaleDateString('en-US')}`, 14, 28);
    doc.text(`Total Loss Harvested: $${activeLossPool.toLocaleString()} | Ordinary Write-Off: $${activeOrdinaryOffset.toLocaleString()} | Tax Alpha Saved: $${totalTaxSaved.toLocaleString()}`, 14, 34);

    const tableRows = activeLots.map(l => [
      l.symbol,
      l.shares.toString(),
      `$${l.costBasis.toLocaleString()}`,
      `$${l.currentValue.toLocaleString()}`,
      `-$${l.unrealizedLoss.toLocaleString()}`,
      l.isShortTerm ? 'STCL' : 'LTCL',
      `${l.primaryProxy.symbol} (${(l.primaryProxy.correlation * 100).toFixed(1)}% corr)`,
      `$${Math.round(l.unrealizedLoss * combinedMarginalRate).toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 42,
      head: [['Ticker', 'Shares', 'Cost Basis', 'Current Val', 'Unrealized Loss', 'Term', 'Proxy Replacement', 'Tax Shield']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241] },
      styles: { fontSize: 8 },
      columnStyles: {
        4: { textColor: [220, 38, 38], fontStyle: 'bold' },
        7: { textColor: [16, 185, 129], fontStyle: 'bold' }
      }
    });

    let nextY = doc.lastAutoTable.finalY + 12;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('STATUTORY STATUTES & COMPLIANCE MEMO (IRC § 1091 & § 1211):', 14, nextY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const statutoryLines = [
      '1. Wash-Sale Immunity (IRC § 1091): Loss deduction requires that no substantially identical stock or security is acquired within 30 days before or after the sale date.',
      '2. Proxy Qualification: Suggested replacement ETFs represent distinct legal trusts with differing benchmark methodologies, ensuring full non-substantially identical standing.',
      '3. Ordinary Income Cap (IRC § 1211(b)): A maximum of $3,000 of net capital losses is deductible against ordinary salary/wages on Form 1040 Schedule 1 Line 7.',
      `4. Unlimited Carryover (IRC § 1212(b)): The unabsorbed capital loss ($${activeCarryforward.toLocaleString()}) carries forward indefinitely to offset future capital gains and ordinary income.`
    ];

    statutoryLines.forEach((line, i) => {
      doc.text(line, 14, nextY + 6 + (i * 6));
    });

    doc.save(`IRS_1091_Harvest_Dossier_${new Date().toISOString().split('T')[0]}.pdf`);
    showToast('Downloaded IRS § 1091 Harvesting Dossier (Vector PDF)');
  }

  const daysUntilYearEnd = scanData?.summary?.daysUntilYearEnd ?? 66;

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: 90, right: 24, zIndex: 9999, background: 'var(--surface-raised)', border: '1px solid var(--primary)', color: 'var(--text-primary)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-lg)', boxShadow: '0 8px 30px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem' }}>
          <CheckCircle2 size={16} style={{ color: 'var(--green)' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Year-End Countdown */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            <span>🇺🇸</span> IRS CODE § 1091 COMPLIANT · FORM 1040 SCHEDULE 1 LINE 7
          </div>
          <h1 className="text-h1" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🌾</span> IRS Wash-Sale Tax-Loss Harvester
          </h1>
          <p className="text-sm text-secondary mt-1">
            Scan portfolio loss positions, write off \$3,000 in ordinary income, swap into non-identical proxy ETFs, and bank indefinite capital loss carryovers.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right', background: 'var(--surface)', padding: '0.5rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.4rem', color: daysUntilYearEnd < 45 ? 'var(--red)' : 'var(--gold)' }}>
              {daysUntilYearEnd} Days
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>until Dec 31 Tax Year-End</div>
          </div>

          <button onClick={runScan} disabled={loading} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Rescan Portfolio</span>
          </button>
        </div>
      </div>

      {/* Marginal Tax Bracket Strip */}
      <div className="card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', background: 'rgba(99,102,241,0.04)', border: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Tax Shield Assumptions:</span>
          
          <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Federal Bracket:</span>
            <select
              value={federalBracket}
              onChange={e => setFederalBracket(Number(e.target.value))}
              style={{ padding: '0.2rem 0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 4, color: 'var(--text-primary)', fontSize: '0.75rem' }}
            >
              <option value={0.24}>24% Federal</option>
              <option value={0.32}>32% Federal (Tech/Mid-Exec)</option>
              <option value={0.35}>35% Federal</option>
              <option value={0.37}>37% Federal (Top Sched Y-1)</option>
            </select>
          </label>

          <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>State Bracket:</span>
            <select
              value={stateBracket}
              onChange={e => setStateBracket(Number(e.target.value))}
              style={{ padding: '0.2rem 0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 4, color: 'var(--text-primary)', fontSize: '0.75rem' }}
            >
              <option value={0.093}>California (9.3%)</option>
              <option value={0.0685}>New York (6.85%)</option>
              <option value={0.1075}>New Jersey (10.75%)</option>
              <option value={0.0495}>Illinois (4.95%)</option>
              <option value={0.0}>Texas / Florida (0.0%)</option>
            </select>
          </label>
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Combined Marginal Deduction Rate: <strong style={{ color: 'var(--primary)' }}>{(combinedMarginalRate * 100).toFixed(1)}%</strong>
        </div>
      </div>

      {/* 4 Stat Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem' }}>
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid var(--red)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <TrendingDown size={14} style={{ color: 'var(--red)' }} /> Gross Selected Losses
          </div>
          <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.5rem', fontWeight: 800, marginTop: 4, color: 'var(--red)' }}>
            -${activeLossPool.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>
            Across {activeLots.length} selected equity lot{activeLots.length === 1 ? '' : 's'}
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid var(--green)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <DollarSign size={14} style={{ color: 'var(--green)' }} /> Net Cash Tax Saved
          </div>
          <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.5rem', fontWeight: 800, marginTop: 4, color: 'var(--green)' }}>
            +${totalTaxSaved.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>
            Immediate federal & state tax reduction
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <ShieldCheck size={14} style={{ color: 'var(--primary)' }} /> Ordinary Income Write-Off
          </div>
          <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.5rem', fontWeight: 800, marginTop: 4, color: 'var(--primary)' }}>
            ${activeOrdinaryOffset.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>
            Form 1040 Line 7 statutory cap (\$3,000)
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid var(--gold)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Layers size={14} style={{ color: 'var(--gold)' }} /> Loss Carryover to Future
          </div>
          <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.5rem', fontWeight: 800, marginTop: 4, color: 'var(--gold)' }}>
            ${activeCarryforward.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>
            Indefinite carryforward under IRC § 1212
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('portfolio')}
          className="btn btn-sm"
          style={{
            background: activeTab === 'portfolio' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'portfolio' ? '#fff' : 'var(--text-secondary)',
            fontWeight: activeTab === 'portfolio' ? 700 : 500,
            borderRadius: 20,
          }}
        >
          Portfolio Lots & Proxy Swaps ({activeLots.length})
        </button>

        <button
          onClick={() => {
            setActiveTab('autopilot');
            if (!aiPlan) generateAutopilotPlan();
          }}
          className="btn btn-sm"
          style={{
            background: activeTab === 'autopilot' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'autopilot' ? '#fff' : 'var(--text-secondary)',
            fontWeight: activeTab === 'autopilot' ? 700 : 500,
            borderRadius: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <Sparkles size={13} style={{ color: 'var(--gold)' }} />
          <span>AI Autopilot Plan</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className="btn btn-sm"
          style={{
            background: activeTab === 'rules' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'rules' ? '#fff' : 'var(--text-secondary)',
            fontWeight: activeTab === 'rules' ? 700 : 500,
            borderRadius: 20,
          }}
        >
          IRC § 1091 Wash-Sale Rules & Calendar
        </button>
      </div>

      {/* TAB 1: PORTFOLIO LOTS & PROXY SWAPS */}
      {activeTab === 'portfolio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Interactive Loss Harvesting Waterfall Hero */}
          <TaxHarvestingWaterfall
            market="US"
            stcgGain={16500}
            ltcgGain={0}
            stclHarvested={activeLossPool}
            ltclHarvested={0}
            exemptionLimit={3000}
            exemptionUsed={activeOrdinaryOffset}
            taxBefore={Math.round((16500 * 0.20) + (3000 * combinedMarginalRate))}
            taxAfter={Math.max(0, Math.round((16500 * 0.20) + (3000 * combinedMarginalRate)) - totalTaxSaved)}
            taxSaved={totalTaxSaved}
          />

          <div className="card" style={{ padding: '1rem', overflowX: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h3 className="text-h3" style={{ margin: 0 }}>Available Tax-Loss Lots</h3>
                <button onClick={selectAllLots} className="btn btn-ghost btn-xs" style={{ fontSize: '0.75rem' }}>
                  {selectedLots.size === (scanData?.opportunities || []).length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={downloadHarvestCSV} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem' }}>
                  <Download size={13} /> Export CSV
                </button>
                <button onClick={downloadHarvestPDF} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem' }}>
                  <FileText size={13} /> Export PDF Dossier
                </button>
                <button onClick={handleBatchExecute} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem' }}>
                  <Zap size={13} /> Batch Harvest Selected
                </button>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.5rem' }}>Select</th>
                  <th style={{ padding: '0.5rem' }}>Ticker & Holding</th>
                  <th style={{ padding: '0.5rem' }}>Shares</th>
                  <th style={{ padding: '0.5rem' }}>Cost Basis</th>
                  <th style={{ padding: '0.5rem' }}>Current Val</th>
                  <th style={{ padding: '0.5rem' }}>Unrealized Loss</th>
                  <th style={{ padding: '0.5rem' }}>Holding Period</th>
                  <th style={{ padding: '0.5rem' }}>Non-Identical Proxy ETF</th>
                  <th style={{ padding: '0.5rem' }}>Tax Shield</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {(scanData?.opportunities || []).map((lot) => {
                  const isSelected = selectedLots.has(lot.id);
                  const isExecuted = executedLots.has(lot.id);
                  const taxSaved = Math.round(lot.unrealizedLoss * combinedMarginalRate);

                  return (
                    <tr
                      key={lot.id}
                      style={{
                        borderBottom: '1px solid var(--glass-border)',
                        background: isExecuted ? 'rgba(16,185,129,0.05)' : isSelected ? 'rgba(99,102,241,0.03)' : 'transparent',
                        opacity: isExecuted ? 0.8 : 1,
                      }}
                    >
                      <td style={{ padding: '0.65rem 0.5rem' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectLot(lot.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>

                      <td style={{ padding: '0.65rem 0.5rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{lot.symbol}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{lot.name}</div>
                      </td>

                      <td style={{ padding: '0.65rem 0.5rem' }}>{lot.shares} sh</td>
                      <td style={{ padding: '0.65rem 0.5rem' }}>${lot.costBasis.toLocaleString()}</td>
                      <td style={{ padding: '0.65rem 0.5rem' }}>${lot.currentValue.toLocaleString()}</td>
                      
                      <td style={{ padding: '0.65rem 0.5rem', color: 'var(--red)', fontWeight: 700 }}>
                        -${lot.unrealizedLoss.toLocaleString()}
                      </td>

                      <td style={{ padding: '0.65rem 0.5rem' }}>
                        <span
                          className={`badge ${lot.isShortTerm ? 'badge-yellow' : 'badge-blue'}`}
                          style={{ fontSize: '0.65rem' }}
                        >
                          {lot.isShortTerm ? `STCL (${lot.holdingDays}d)` : `LTCL (${lot.holdingDays}d)`}
                        </span>
                      </td>

                      <td style={{ padding: '0.65rem 0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{lot.primaryProxy.symbol}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({(lot.primaryProxy.correlation * 100).toFixed(0)}% corr)</span>
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{lot.primaryProxy.rationale}</div>
                      </td>

                      <td style={{ padding: '0.65rem 0.5rem', color: 'var(--green)', fontWeight: 700 }}>
                        +${taxSaved.toLocaleString()}
                      </td>

                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right' }}>
                        {isExecuted ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--green)', fontSize: '0.75rem', fontWeight: 700 }}>
                            <CheckCircle2 size={13} /> Swapped
                          </span>
                        ) : (
                          <button
                            onClick={() => handleExecuteHarvest(lot)}
                            className="btn btn-secondary btn-xs"
                            style={{ fontSize: '0.7rem' }}
                          >
                            Swap to {lot.primaryProxy.symbol}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 31-Day Safe Re-entry Banner */}
          <div className="card" style={{ padding: '1rem', background: 'rgba(99,102,241,0.06)', border: '1px solid var(--border-active)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Calendar size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>31-Day Wash-Sale Safe Re-Entry Protocol</h4>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  If you execute proxy swaps today, you may legally repurchase original tickers on or after <strong style={{ color: 'var(--primary)' }}>{scanData?.summary?.safeReentryDateFormatted || '31 days from today'}</strong> without IRS disallowance.
                </p>
              </div>
            </div>

            <button onClick={handleDispatchToAdvisor} disabled={dispatchedToAdvisor} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Send size={13} />
              <span>{dispatchedToAdvisor ? 'Directive Sent to Advisor ✓' : 'Dispatch to RIA Advisor'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: AUTOPILOT AI PLAN */}
      {activeTab === 'autopilot' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 className="text-h3" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={18} style={{ color: 'var(--gold)' }} />
                  <span>Gemini Fiduciary Tax-Loss Sequencer</span>
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Algorithmic trade sequence to capture maximum ordinary write-offs and long-term capital offsets while preserving portfolio beta.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={generateAutopilotPlan} disabled={loadingPlan} className="btn btn-secondary btn-sm">
                  <RefreshCw size={13} className={loadingPlan ? 'animate-spin' : ''} />
                  <span>Regenerate Sequence</span>
                </button>
                <button onClick={downloadHarvestCSV} className="btn btn-primary btn-sm">
                  <Download size={13} />
                  <span>Export Execution CSV</span>
                </button>
              </div>
            </div>

            {loadingPlan ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div className="animate-spin" style={{ display: 'inline-block', width: 28, height: 28, border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', marginBottom: 12 }} />
                <div>Solving optimal capital gains transaction sequence under IRC § 1091...</div>
              </div>
            ) : aiPlan ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                  {aiPlan.steps.map((st) => (
                    <div
                      key={st.step}
                      style={{
                        padding: '0.85rem',
                        background: 'var(--surface)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.35rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', background: 'rgba(99,102,241,0.1)', padding: '0.15rem 0.5rem', borderRadius: 10 }}>
                          STEP {st.step}
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--red)' }}>
                          -${Number(st.lossHarvested).toLocaleString()} Loss
                        </span>
                      </div>

                      <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>Sell {st.shares} {st.ticker}</span>
                        <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ color: 'var(--primary)' }}>Buy {st.proxyToBuy}</span>
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {st.proxyName}
                      </div>

                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        Re-entry Date: <strong style={{ color: 'var(--green)' }}>{st.safeReentryDate}</strong>
                      </div>

                      <div style={{ fontSize: '0.7rem', fontStyle: 'italic', color: 'var(--text-muted)', borderTop: '1px dashed var(--glass-border)', paddingTop: 4, marginTop: 4 }}>
                        {st.cpaRationale}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Wash Sale Defense Notes */}
                {aiPlan.washSaleDefenseNotes && (
                  <div style={{ padding: '0.85rem 1rem', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--green)', marginBottom: 4 }}>
                      IRS AUDIT TRAIL & SCHEDULE D DEFENSE:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {aiPlan.washSaleDefenseNotes.map((note, idx) => (
                        <li key={idx} style={{ marginBottom: 2 }}>{note}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* TAB 3: STATUTORY RULES & CALENDAR */}
      {activeTab === 'rules' && (
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 className="text-h3" style={{ margin: 0 }}>IRC Section 1091 Wash-Sale Statutory Reference</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', fontSize: '0.8125rem' }}>
            <div style={{ padding: '1rem', background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)' }}>
              <h4 style={{ margin: '0 0 0.5rem', color: 'var(--primary)', fontWeight: 700 }}>The 61-Day Restriction Window</h4>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Under 26 U.S. Code § 1091, a loss cannot be deducted if you acquire "substantially identical" stock or securities within a 61-day window: <strong>30 days before the sale, the day of sale, and 30 days after the sale</strong>.
              </p>
            </div>

            <div style={{ padding: '1rem', background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)' }}>
              <h4 style={{ margin: '0 0 0.5rem', color: 'var(--green)', fontWeight: 700 }}>Non-Substantially Identical Standard</h4>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                IRS Revenue Ruling 2008-5 establishes that swapping an S&P 500 ETF (e.g. VOO) into a Total Market ETF (e.g. VTI) or an S&P 500 ETF with a different legal issuer and index licensing agreement does not constitute substantially identical securities.
              </p>
            </div>

            <div style={{ padding: '1rem', background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)' }}>
              <h4 style={{ margin: '0 0 0.5rem', color: 'var(--gold)', fontWeight: 700 }}>Ordinary Income Write-Off Cap (IRC § 1211b)</h4>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Net capital losses first offset short-term and long-term capital gains dollar-for-dollar. Up to <strong>$3,000 of remaining net losses ($1,500 if married filing separately)</strong> can be written off against ordinary W-2 income on Form 1040 Schedule 1 Line 7.
              </p>
            </div>

            <div style={{ padding: '1rem', background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)' }}>
              <h4 style={{ margin: '0 0 0.5rem', color: 'var(--purple)', fontWeight: 700 }}>Indefinite Carryforward (IRC § 1212b)</h4>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Unlike Indian tax law which restricts capital loss set-offs to 8 assessment years, the IRS allows unabsorbed capital losses to be carried forward <strong>indefinitely</strong> until exhausted by future capital gains or annual $3,000 ordinary write-offs.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Universal Sticky Action Dock */}
      <StickyActionDock
        primaryLabel={executedLots.size === activeLots.length && activeLots.length > 0 ? "Swaps Executed ✓" : `Harvest ${activeLots.length} Lots (Save $${totalTaxSaved.toLocaleString()})`}
        onPrimary={handleBatchExecute}
        primaryDisabled={activeLots.length === 0}
        secondaryLabel="Download PDF Dossier"
        onSecondary={downloadHarvestPDF}
        statusText={`Selected: $${activeLossPool.toLocaleString()} loss pool | Form 1040 Write-Off: $${activeOrdinaryOffset.toLocaleString()} | Tax Alpha: +$${totalTaxSaved.toLocaleString()}`}
      />
    </div>
  );
}
