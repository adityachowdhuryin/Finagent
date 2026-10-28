import React, { useState, useEffect } from 'react';
import {
  TrendingDown, Zap, ArrowRight, ShieldCheck, CheckCircle2,
  RefreshCw, Bell, Send, AlertTriangle, ArrowLeftRight, ExternalLink, HelpCircle,
  Download, Check, UserCheck, Sparkles, Filter
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useApp } from '../../context/AppContext';
import { cleanAscii } from '../../utils/fiduciaryPdfBuilder';
import TaxSuiteNav from '../../components/tax/TaxSuiteNav';
import USTaxLossHarvester from './us/USTaxLossHarvester';

export default function TaxLossHarvesting() {
  const { state, dispatch, isUSMarket } = useApp();

  if (isUSMarket || state?.activeMarket === 'US') {
    return <USTaxLossHarvester />;
  }

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifying, setNotifying] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(false);
  const [filterCategory, setFilterCategory] = useState('ALL'); // 'ALL' | 'STCL' | 'LTCL'
  const [sentAdvisorIds, setSentAdvisorIds] = useState(new Set());
  const [toastMessage, setToastMessage] = useState('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const holdings = state.consumer?.holdings || {};

  useEffect(() => {
    runScan();
  }, [holdings]);

  async function runScan() {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/harvesting/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equities: holdings.equities || [],
          mutualFunds: holdings.mutualFunds || [],
        }),
      });
      const result = await res.json();
      if (result.success) {
        setData(result);
      }
    } catch (err) {
      console.error('Tax-loss harvesting scan failed:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendAlert() {
    setNotifying(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/harvesting/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: state.consumer?.user?.email,
          totalTaxSavings: data?.totalTaxSavings,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setNotifySuccess(true);
        setTimeout(() => setNotifySuccess(false), 4000);
      }
    } catch (err) {
      alert('Notification failed: ' + err.message);
    } finally {
      setNotifying(false);
    }
  }

  function handleSendToAdvisor(opp) {
    if (sentAdvisorIds.has(opp.id)) return;

    const clientName = state.consumer?.user?.name || 'Karan Mehta';
    const recoTitle = `Harvest Rs. ${opp.unrealizedLoss.toLocaleString('en-IN')} loss in ${opp.name}`;
    const newReco = {
      id: `reco_harvest_${Date.now()}_${opp.id}`,
      clientId: 'c1',
      clientName,
      type: 'TAX_LOSS_HARVESTING',
      title: recoTitle,
      summary: `Proactive dip harvest under Section 70 of Indian IT Act. Offset ${opp.lossCategory === 'STCL' ? 'STCG at 20%' : 'LTCG at 12.5%'} to save Rs. ${opp.taxSaved.toLocaleString('en-IN')}.`,
      recommendation: `Sell ${opp.name} on exchange/AMC and simultaneously deploy Rs. ${opp.currentValue.toLocaleString('en-IN')} into ${opp.replacement?.replacementName}.`,
      action: `Sell ${opp.name} -> Buy ${opp.replacement?.replacementName}`,
      urgency: 'high',
      confidence: 96,
      status: 'pending',
      impact: {
        'Tax Liability Offset': `+Rs. ${opp.taxSaved.toLocaleString('en-IN')}`,
        'Replaced Asset Beta': '1.00 (Market Index)',
        'Statutory Reference': 'Section 70 (Income Tax Act)'
      },
      aiRationale: [
        `Locks in Rs. ${opp.unrealizedLoss.toLocaleString('en-IN')} capital loss to offset capital gains tax before FY close.`,
        `Zero market exit drag: Paired replacement into ${opp.replacement?.replacementName} maintains continuous compounding.`
      ]
    };

    dispatch({
      type: 'ADD_RECOMMENDATIONS',
      payload: newReco
    });

    setSentAdvisorIds(prev => new Set([...prev, opp.id]));
    setToastMessage(`✓ Sent "${opp.name}" harvest plan to SEBI RIA review queue!`);
    setTimeout(() => setToastMessage(''), 4000);
  }

  function downloadHarvestPDF() {
    if (!data?.opportunities) return;
    setIsExportingPdf(true);

    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      const contentWidth = pageWidth - (margin * 2);
      const clientName = cleanAscii(state.consumer?.user?.name || 'Karan Mehta');
      const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

      // Header Banner
      doc.setFillColor(15, 23, 42); // Slate 900
      doc.rect(0, 0, pageWidth, 24, 'F');

      doc.setFillColor(16, 185, 129); // Green 500
      doc.rect(0, 24, pageWidth, 1.2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text('TAX-LOSS HARVESTING & PAIRED SWAP BLUEPRINT', margin, 10.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(203, 213, 225);
      doc.text('Statutory Set-Off pursuant to Indian Income Tax Act, 1961 (Section 70 & 71) | AY 2026-27', margin, 16.5);

      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Client: ${clientName} | PAN Mask: XXXXX9281X | Generated: ${dateStr}`, margin, 21);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(52, 211, 153);
      doc.text('TAX OPTIMIZATION SLIP', pageWidth - margin, 10.5, { align: 'right' });

      let y = 31;

      // Metrics Card
      doc.setFillColor(240, 253, 244); // Green 50
      doc.setDrawColor(187, 247, 208);
      doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(22, 101, 52);
      doc.text('TOTAL HARVESTABLE LOSS', margin + 6, y + 5);
      doc.text('ESTIMATED TAX SAVED', margin + 66, y + 5);
      doc.text('SET-OFF ELIGIBILITY', margin + 126, y + 5);

      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`Rs. ${(data.totalLossHarvestable || 0).toLocaleString('en-IN')}`, margin + 6, y + 11);
      doc.setTextColor(21, 128, 61);
      doc.text(`Rs. ${(data.totalTaxSavings || 0).toLocaleString('en-IN')} (Immediate)`, margin + 66, y + 11);
      doc.setTextColor(15, 23, 42);
      doc.text('STCG (20%) & LTCG (12.5%)', margin + 126, y + 11);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Across ${data.opportunitiesCount || 0} dipping portfolio lots`, margin + 6, y + 16.5);
      doc.text('Direct capital gains liability deduction', margin + 66, y + 16.5);
      doc.text('Sec 70: Zero wash-sale restriction in India', margin + 126, y + 16.5);

      y += 25;

      // Table 1: Positions to Sell
      const sellRows = data.opportunities.map(opp => [
        cleanAscii(opp.name),
        cleanAscii(String(opp.qty || opp.units || 1)),
        `Rs. ${Number(opp.currentValue || 0).toLocaleString('en-IN')}`,
        `-Rs. ${Number(opp.unrealizedLoss || 0).toLocaleString('en-IN')} (-${opp.lossPct}%)`,
        cleanAscii(opp.lossCategory === 'STCL' ? 'STCL (20.0%)' : 'LTCL (12.5%)'),
        `+Rs. ${Number(opp.taxSaved || 0).toLocaleString('en-IN')}`
      ]);

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['ASSET TO SELL (RED LOT)', 'QTY', 'MARKET VAL', 'UNREALIZED LOSS', 'CATEGORY', 'TAX SAVED']],
        body: sellRows,
        theme: 'grid',
        headStyles: { fillColor: [220, 38, 38], fontSize: 7, fontStyle: 'bold', halign: 'left', cellPadding: 2 },
        styles: { fontSize: 7, cellPadding: 2, textColor: [15, 23, 42], overflow: 'linebreak' },
        columnStyles: {
          0: { cellWidth: 54, fontStyle: 'bold' },
          1: { cellWidth: 16, halign: 'center' },
          2: { cellWidth: 28, halign: 'right' },
          3: { cellWidth: 34, halign: 'right', textColor: [220, 38, 38], fontStyle: 'bold' },
          4: { cellWidth: 24, halign: 'center' },
          5: { cellWidth: 26, halign: 'right', textColor: [21, 128, 61], fontStyle: 'bold' }
        }
      });

      y = doc.lastAutoTable.finalY + 5;

      // Table 2: Paired Replacements
      const buyRows = data.opportunities.map(opp => [
        cleanAscii(opp.replacement?.replacementName || 'Nifty 50 Index Fund'),
        `Rs. ${Number(opp.currentValue || 0).toLocaleString('en-IN')}`,
        cleanAscii(opp.replacement?.rationale || 'Maintains portfolio equity beta with zero market drag.')
      ]);

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['PAIRED REPLACEMENT ASSET TO BUY', 'RE-INVEST AMOUNT', 'STRATEGY RATIONALE (ZERO DAYS OUT OF MARKET)']],
        body: buyRows,
        theme: 'grid',
        headStyles: { fillColor: [49, 46, 129], fontSize: 7, fontStyle: 'bold', halign: 'left', cellPadding: 2 },
        styles: { fontSize: 7, cellPadding: 2, textColor: [15, 23, 42], overflow: 'linebreak' },
        columnStyles: {
          0: { cellWidth: 54, fontStyle: 'bold', textColor: [67, 56, 202] },
          1: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
          2: { cellWidth: 98, textColor: [71, 85, 105] }
        }
      });

      y = doc.lastAutoTable.finalY + 5;

      // Statutory Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(margin, y, contentWidth, 24, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(30, 41, 59);
      doc.text('STATUTORY PROVISIONS (INCOME TAX ACT, 1961 & FINANCE ACT 2024)', margin + 4, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.2);
      doc.setTextColor(71, 85, 105);
      doc.text('1. Section 70: Short-term capital loss (STCL) can be set off against both STCG (20%) and LTCG (12.5%).', margin + 4, y + 9);
      doc.text('2. Section 70: Long-term capital loss (LTCL) can only be set off against Long-Term Capital Gains.', margin + 4, y + 13);
      doc.text('3. Section 71: Unabsorbed capital losses can be carried forward for 8 consecutive assessment years, provided ITR is filed timely.', margin + 4, y + 17);
      doc.text('4. Zero Wash-Sale Rule: Unlike US IRS 30-day wash-sale restrictions, Indian tax law permits immediate re-investment without disallowance.', margin + 4, y + 21);

      y += 28;

      // Execution Checklist
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text('EXECUTION CHECKLIST FOR TRADING DESK / BROKER:', margin, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Step 1: Place SELL orders for Red Lots on Zerodha / Groww / AngelOne during market hours (09:15 - 15:30 IST).', margin, y + 4);
      doc.text('Step 2: Place simultaneous BUY orders for Paired Replacement ETFs/Funds using the trade proceeds to prevent cash drag.', margin, y + 8);
      doc.text('Step 3: Retain contract notes and transaction statements for filing under Schedule CG of ITR-2 / ITR-3.', margin, y + 12);

      // Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text('FinAgent Tax Engine | Automated Dip Harvesting | Generated pursuant to Section 70 IT Act | Page 1 of 1', margin, pageHeight - 5);

      doc.save(`Tax_Loss_Harvesting_Plan_${dateStr.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Harvest PDF export error:', err);
    } finally {
      setIsExportingPdf(false);
    }
  }

  const formatINR = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

  const filteredOpportunities = (data?.opportunities || []).filter(opp => {
    if (filterCategory === 'STCL') return opp.lossCategory === 'STCL';
    if (filterCategory === 'LTCL') return opp.lossCategory === 'LTCL';
    return true;
  });

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Tax Suite Tab Navigation */}
      <TaxSuiteNav />

      {/* Toast notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          background: 'var(--green)',
          color: '#064e3b',
          fontWeight: 700,
          padding: '0.75rem 1.25rem',
          borderRadius: 'var(--radius)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.875rem'
        }}>
          <CheckCircle2 size={16} />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.75rem' }}>📉</span>
            <h1 className="text-h1">Year-Round Tax-Loss Harvesting Bot</h1>
          </div>
          <p className="text-sm text-secondary">
            Continuously monitors market dips to harvest capital losses, pairing each exit with a replacement asset so you never miss market upside.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={runScan}
            disabled={loading}
            className="btn btn-ghost btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            {loading ? 'Scanning...' : 'Scan Dips Now'}
          </button>

          <button
            onClick={downloadHarvestPDF}
            disabled={loading || !data?.opportunitiesCount || isExportingPdf}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Download size={14} />
            {isExportingPdf ? 'Exporting...' : 'Download Harvest Slip (PDF)'}
          </button>

          <button
            onClick={handleSendAlert}
            disabled={notifying || !data?.opportunitiesCount}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Send size={14} />
            {notifying ? 'Sending...' : notifySuccess ? '✓ Alert Sent!' : 'Dispatch Dip Alert'}
          </button>
        </div>
      </div>

      {data?.isSimulated && (
        <div style={{
          padding: '0.875rem 1.25rem',
          background: 'rgba(99,102,241,0.08)',
          border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: 'var(--radius)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <Zap size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <div className="text-xs text-secondary">
            <strong>Market Correction Simulation:</strong> Your current portfolio holdings are mostly green. To demonstrate how this bot rescues tax money during market corrections, simulated dip opportunities are illustrated below.
          </div>
        </div>
      )}

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
          <div className="spin" style={{ display: 'inline-block', marginBottom: '1rem' }}>
            <RefreshCw size={32} style={{ color: 'var(--primary)' }} />
          </div>
          <p>Scanning stock & fund lots against current market prices...</p>
        </div>
      ) : data ? (
        <>
          {/* Big Savings Header Banner */}
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), var(--surface))',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem'
          }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.2rem 0.6rem', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--green)', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                <CheckCircle2 size={14} /> HARVESTING OPPORTUNITY ACTIVE
              </div>
              <div className="text-xs text-secondary">Total Tax Liability You Can Wipe Out Today:</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--green)', margin: '0.25rem 0' }}>
                {formatINR(data.totalTaxSavings)}
              </div>
              <div className="text-xs text-muted">
                Offsets capital gains across your FY 2025–26 tax obligations under Section 70 of Income Tax Act.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
              <div style={{ background: 'var(--surface-raised)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
                <div className="text-xs text-muted">Harvestable Loss</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: 'var(--red)', marginTop: 2 }}>
                  {formatINR(data.totalLossHarvestable)}
                </div>
              </div>

              <div style={{ background: 'var(--surface-raised)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
                <div className="text-xs text-muted">STCL (20% Cut)</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: 'var(--green)', marginTop: 2 }}>
                  {formatINR(data.stclTaxSaved || 0)}
                </div>
              </div>

              <div style={{ background: 'var(--surface-raised)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
                <div className="text-xs text-muted">LTCL (12.5% Cut)</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: 'var(--green)', marginTop: 2 }}>
                  {formatINR(data.ltclTaxSaved || 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={15} style={{ color: 'var(--text-muted)' }} />
              <span className="text-xs text-muted" style={{ fontWeight: 600 }}>Filter:</span>
              <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--surface-raised)', padding: 3, borderRadius: 'var(--radius)' }}>
                {[
                  ['ALL', `All (${data.opportunitiesCount})`],
                  ['STCL', 'Short-Term (20% Off)'],
                  ['LTCL', 'Long-Term (12.5% Off)']
                ].map(([cat, label]) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    style={{
                      padding: '0.25rem 0.65rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      borderRadius: 4,
                      border: 'none',
                      cursor: 'pointer',
                      background: filterCategory === cat ? 'var(--primary)' : 'transparent',
                      color: filterCategory === cat ? '#fff' : 'var(--text-secondary)',
                      transition: 'var(--transition)'
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-xs text-muted">Zero Days Out of the Market via Paired Swaps</span>
          </div>

          {/* Active Opportunities Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredOpportunities.map((opp) => {
              const isSent = sentAdvisorIds.has(opp.id);
              return (
                <div key={opp.id} className="card" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '1.25rem',
                  alignItems: 'center',
                  borderLeft: '4px solid var(--green)'
                }}>
                  {/* Left: Asset in Red */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                      <span className="badge badge-red" style={{ fontSize: '0.7rem' }}>
                        -{opp.lossPct}% Drop
                      </span>
                      <span className="badge badge-surface" style={{ fontSize: '0.7rem' }}>
                        {opp.lossCategory} · {opp.taxRatePct}
                      </span>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{opp.name}</div>
                    <div className="text-xs text-secondary">
                      Holding Value: {formatINR(opp.currentValue)} · Unrealized Loss: <strong style={{ color: 'var(--red)' }}>-{formatINR(opp.unrealizedLoss)}</strong>
                    </div>
                    <div className="text-xs text-muted" style={{ marginTop: 4 }}>
                      Held for {opp.holdingDays} days · {opp.setOffRule}
                    </div>
                  </div>

                  {/* Middle: Tax Saved Callout */}
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    padding: '1rem',
                    borderRadius: 'var(--radius)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    textAlign: 'center'
                  }}>
                    <div className="text-xs text-muted" style={{ textTransform: 'uppercase' }}>Direct Tax Cut</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--green)', margin: '0.25rem 0' }}>
                      +{formatINR(opp.taxSaved)}
                    </div>
                    <div className="text-xs text-secondary">Instantly reduces capital gains tax</div>
                  </div>

                  {/* Right: Paired Replacement Asset & Action */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                        <ArrowLeftRight size={14} /> PAIRED REPLACEMENT ASSET
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                        {opp.replacement?.replacementName}
                      </div>
                      <p className="text-xs text-secondary" style={{ lineHeight: 1.4 }}>
                        {opp.replacement?.rationale}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleSendToAdvisor(opp)}
                        disabled={isSent}
                        className={`btn ${isSent ? 'btn-ghost' : 'btn-primary'} btn-sm`}
                        style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        {isSent ? (
                          <>
                            <Check size={12} /> In Advisor Queue
                          </>
                        ) : (
                          <>
                            <UserCheck size={12} /> Send to Advisor
                          </>
                        )}
                      </button>

                      <a
                        href="https://kite.zerodha.com"
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        Execute Trade <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legal / Tax Explainer Box */}
          <div className="card" style={{ background: 'rgba(99,102,241,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <HelpCircle size={16} style={{ color: 'var(--primary)' }} />
              <h3 className="text-h3">How Tax-Loss Harvesting Works in India (Finance Act 2024 Rules)</h3>
            </div>
            <p className="text-xs text-secondary" style={{ lineHeight: 1.6 }}>
              Under <strong>Section 70 of the Indian Income Tax Act</strong>, short-term capital losses (STCL) can be set off against both short-term capital gains (taxed at 20%) and long-term capital gains (taxed at 12.5% above ₹1.25L). Unlike the United States, <strong>India does not have a 30-day Wash-Sale Rule</strong> (meaning you do not face statutory disallowance upon repurchase). However, immediately deploying trade proceeds into a correlated, low-cost index ETF or direct mutual fund peer ensures your capital stays invested to catch the market rebound.
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
