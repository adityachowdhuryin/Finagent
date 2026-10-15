import React, { useState, useEffect } from 'react';
import {
  TrendingDown, AlertTriangle, ShieldCheck, ArrowRight, ExternalLink,
  RefreshCw, Zap, CheckCircle2, Info, ArrowUpRight, DollarSign, Download,
  Check, UserCheck, FileText, Clock, HelpCircle, Filter
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useApp } from '../../context/AppContext';
import { cleanAscii } from '../../utils/fiduciaryPdfBuilder';

export default function CommissionHunter() {
  const { state, dispatch } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('ALL'); // 'ALL' | 'READY' | 'PENDING'
  const [sentAdvisorIds, setSentAdvisorIds] = useState(new Set());
  const [toastMessage, setToastMessage] = useState('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const mutualFunds = state.consumer?.holdings?.mutualFunds || [];

  useEffect(() => {
    runAudit();
  }, [mutualFunds]);

  async function runAudit() {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/commission/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mutualFunds }),
      });
      const result = await res.json();
      if (result.success) {
        setData(result);
      }
    } catch (err) {
      console.error('Commission audit failed:', err);
    } finally {
      setLoading(false);
    }
  }

  // Generate 20-year projection data for chart
  const projectionChartData = React.useMemo(() => {
    if (!data || !data.totalRegularValue) return [];
    const points = [];
    const p = data.totalRegularValue;
    for (let yr = 0; yr <= 20; yr += 2) {
      const fvDirect = Math.round(p * Math.pow(1.12, yr));
      const fvRegular = Math.round(p * Math.pow(1.1085, yr)); // 1.15% drag
      points.push({
        year: yr === 0 ? 'Today' : `Yr ${yr}`,
        direct: fvDirect,
        regular: fvRegular,
        lost: fvDirect - fvRegular,
      });
    }
    return points;
  }, [data]);

  const formatINR = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

  function handleSendToAdvisor(item) {
    if (sentAdvisorIds.has(item.fundId)) return;

    const clientName = state.consumer?.user?.name || 'Karan Mehta';
    const recoTitle = `Switch ${item.originalName} to Direct Growth Plan`;
    const newReco = {
      id: `reco_switch_${Date.now()}_${item.fundId}`,
      clientId: 'c1',
      clientName,
      type: 'REGULAR_TO_DIRECT_SWITCH',
      title: recoTitle,
      summary: `SEBI IA Regulation 18(2) Direct Scheme mandate. Eliminates ~Rs. ${(item.annualCommissionLost || 0).toLocaleString('en-IN')}/yr trailer commission leakage.`,
      recommendation: `Execute online Switch on MF Central / AMC Portal from ${item.originalName} into ${item.directEquivalent}.`,
      action: `Switch Regular -> Direct (${item.canSwitchNowFree ? 'Immediate 0% Exit Load' : `Wait ${item.daysRemaining} days`})`,
      urgency: item.canSwitchNowFree ? 'high' : 'medium',
      confidence: 98,
      status: 'pending',
      impact: {
        'Annual Trail Leakage Saved': `+Rs. ${(item.annualCommissionLost || 0).toLocaleString('en-IN')}/yr`,
        'Exit Load Impact': item.exitLoadStatus,
        'Statutory Mandate': 'SEBI IA Reg 18(2)'
      },
      aiRationale: [
        `Eliminates distributor trailer drag of 1.15% per annum, compounding over client investment horizon.`,
        item.canSwitchNowFree
          ? 'Zero exit load: Holding period exceeds 365 days.'
          : `Exit load protection: Waiting ${item.daysRemaining} days saves net penalty.`
      ]
    };

    dispatch({
      type: 'ADD_RECOMMENDATIONS',
      payload: newReco
    });

    setSentAdvisorIds(prev => new Set([...prev, item.fundId]));
    setToastMessage(`✓ Sent "${item.originalName}" switch request to SEBI RIA review queue!`);
    setTimeout(() => setToastMessage(''), 4000);
  }

  function downloadDirectSwitchPDF() {
    if (!data?.blueprints) return;
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
      doc.setFillColor(30, 27, 75); // Deep Indigo
      doc.rect(0, 0, pageWidth, 24, 'F');

      doc.setFillColor(217, 119, 6); // Amber
      doc.rect(0, 24, pageWidth, 1.2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12.5);
      doc.setTextColor(255, 255, 255);
      doc.text('REGULAR-TO-DIRECT MUTUAL FUND SWITCH INSTRUCTION SLIP', margin, 10.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(203, 213, 225);
      doc.text('Pursuant to SEBI (Investment Advisers) Regulations, 2013 (Reg 18(2) Direct Scheme Mandate)', margin, 16.5);

      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Client: ${clientName} | PAN Mask: XXXXX9281X | Generated: ${dateStr}`, margin, 21);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(251, 191, 36);
      doc.text('MF CENTRAL SWITCH SLIP', pageWidth - margin, 10.5, { align: 'right' });

      let y = 31;

      // Metrics Card
      doc.setFillColor(254, 242, 242); // Red 50
      doc.setDrawColor(254, 202, 202);
      doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(153, 27, 27);
      doc.text('REGULAR AUM SCANNED', margin + 6, y + 5);
      doc.text('ANNUAL COMMISSION DRAG', margin + 66, y + 5);
      doc.text('20-YEAR COMPOUNDED LOSS', margin + 126, y + 5);

      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`Rs. ${(data.totalRegularValue || 0).toLocaleString('en-IN')}`, margin + 6, y + 11);
      doc.setTextColor(220, 38, 38);
      doc.text(`-Rs. ${(data.annualCommissionLoss || 0).toLocaleString('en-IN')} / yr`, margin + 66, y + 11);
      doc.setTextColor(220, 38, 38);
      doc.text(`-Rs. ${(data.loss20Year || 0).toLocaleString('en-IN')} (12% CAGR)`, margin + 126, y + 11);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Across ${data.regularFundsCount || 0} active regular schemes`, margin + 6, y + 16.5);
      doc.text('1.15% average trailer commission fee', margin + 66, y + 16.5);
      doc.text('Compounded wealth diverted to middlemen', margin + 126, y + 16.5);

      y += 25;

      // Table: Switch Blueprint
      const switchRows = data.blueprints.map(item => [
        cleanAscii(item.folioNo),
        `${cleanAscii(item.originalName)}\n-> ${cleanAscii(item.directEquivalent)}`,
        cleanAscii(String(item.units || '-')),
        `Rs. ${Number(item.currentValue || 0).toLocaleString('en-IN')}`,
        `-Rs. ${Number(item.annualCommissionLost || 0).toLocaleString('en-IN')}`,
        cleanAscii(item.canSwitchNowFree ? '0.0% (Free)' : `1.0% (${item.daysRemaining}d left)`),
        cleanAscii(item.canSwitchNowFree ? 'Tranche 1: Switch Now' : `Tranche 2: Wait ${item.daysRemaining}d`)
      ]);

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['FOLIO NO.', 'SCHEME SWITCH ROADMAP', 'UNITS', 'MARKET VAL', 'COMMISSION', 'EXIT LOAD', 'RECOMMENDED ACTION']],
        body: switchRows,
        theme: 'grid',
        headStyles: { fillColor: [49, 46, 129], fontSize: 7, fontStyle: 'bold', halign: 'left', cellPadding: 2 },
        styles: { fontSize: 7, cellPadding: 2, textColor: [15, 23, 42], overflow: 'linebreak' },
        columnStyles: {
          0: { cellWidth: 26, fontStyle: 'bold' },
          1: { cellWidth: 54 },
          2: { cellWidth: 16, halign: 'center' },
          3: { cellWidth: 26, halign: 'right' },
          4: { cellWidth: 22, halign: 'right', textColor: [220, 38, 38], fontStyle: 'bold' },
          5: { cellWidth: 20, halign: 'center' },
          6: { cellWidth: 18, fontStyle: 'bold', halign: 'center', textColor: [16, 185, 129] }
        }
      });

      y = doc.lastAutoTable.finalY + 5;

      // Submission Instructions Card
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(margin, y, contentWidth, 25, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(30, 41, 59);
      doc.text('HOW TO EXECUTE THIS SWITCH INSTRUCTION (ZERO COST & 100% ONLINE)', margin + 4, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.2);
      doc.setTextColor(71, 85, 105);
      doc.text('Method A (Recommended): Log in to MF Central (app.mfcentral.com) using your PAN. Go to Service Requests -> Switch. Select existing Folio and choose Direct Plan.', margin + 4, y + 9);
      doc.text('Method B: Direct AMC Portals: Visit respective AMC websites (HDFC AMC, ICICI Pru AMC, SBI MF) and execute internal Switch transaction.', margin + 4, y + 13.5);
      doc.text('Method C: Demat / Stock Brokers: For Demat holdings (Zerodha Coin / Groww), place switch order directly through the app without redemption.', margin + 4, y + 18);
      doc.text('Statutory Protection: SEBI IA Regulation 18(2) strictly mandates fee-only registered advisers to only recommend Direct Plans with zero distribution kickbacks.', margin + 4, y + 22.5);

      y += 29;

      // Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text('FinAgent Fiduciary Suite | SEBI IA Reg 18(2) Compliant | Powered by MF Central Protocol | Page 1 of 1', margin, pageHeight - 5);

      doc.save(`MFCentral_Direct_Switch_Plan_${dateStr.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Switch PDF export error:', err);
    } finally {
      setIsExportingPdf(false);
    }
  }

  function downloadMFCentralCSV() {
    if (!data?.blueprints) return;
    const headers = 'Folio_Number,Regular_Scheme_Name,Target_Direct_Scheme,Approx_Value_INR,Exit_Load_Status,Action_Recommendation,MFCentral_Portal\n';
    const rows = data.blueprints.map((item) =>
      `"${item.folioNo}","${item.originalName}","${item.directEquivalent}","${item.currentValue}","${item.exitLoadStatus}","${item.recommendedTranche}","https://app.mfcentral.com"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MFCentral_Direct_Switch_Plan_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const filteredBlueprints = (data?.blueprints || []).filter(item => {
    if (selectedFilter === 'READY') return item.canSwitchNowFree;
    if (selectedFilter === 'PENDING') return !item.canSwitchNowFree;
    return true;
  });

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
            <span style={{ fontSize: '1.75rem' }}>💸</span>
            <h1 className="text-h1">Regular-to-Direct Commission Hunter</h1>
          </div>
          <p className="text-sm text-secondary">
            Identify hidden trailing commissions paid to distributors & generate an exit-load and tax-optimized switch roadmap.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={runAudit}
            disabled={loading}
            className="btn btn-ghost btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            {loading ? 'Analyzing...' : 'Re-scan Portfolio'}
          </button>

          <button
            onClick={downloadDirectSwitchPDF}
            disabled={loading || !data?.blueprints?.length || isExportingPdf}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Download size={14} />
            {isExportingPdf ? 'Exporting...' : 'Download Switch Slip (PDF)'}
          </button>

          <button
            onClick={downloadMFCentralCSV}
            disabled={loading || !data?.blueprints?.length}
            className="btn btn-ghost btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <FileText size={14} /> Export CSV
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
          <Info size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <div className="text-xs text-secondary">
            <strong>Sample Demonstration:</strong> We scanned your portfolio. To illustrate how this engine calculates exit loads and saves lakhs in commissions, sample Regular plans are shown below. Import your CAS to see your exact numbers!
          </div>
        </div>
      )}

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
          <div className="spin" style={{ display: 'inline-block', marginBottom: '1rem' }}>
            <RefreshCw size={32} style={{ color: 'var(--primary)' }} />
          </div>
          <p>Auditing mutual fund expense ratios and commission trailing drag...</p>
        </div>
      ) : data ? (
        <>
          {/* Top Big Callout Banner */}
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(15, 15, 35, 0.95))',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.625rem', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--red)', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                  <AlertTriangle size={14} /> COMMISSIONS BLEEDING DETECTED
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  You are losing approximately
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--red)', margin: '0.25rem 0' }}>
                  {formatINR(data.annualCommissionLoss)} <span style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ year</span>
                </div>
                <p className="text-xs text-secondary" style={{ maxWidth: 500 }}>
                  This money is deducted straight from your daily NAV and paid out to middlemen. Switching to <strong>Direct Growth</strong> plans instantly routes 100% of these gains back into your pocket pursuant to <strong>SEBI IA Regulation 18(2)</strong>.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: 240 }}>
                <a
                  href="https://app.mfcentral.com/investor/signin"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none', padding: '0.75rem 1.25rem' }}
                >
                  Switch on MF Central <ExternalLink size={16} />
                </a>
                <div className="text-xs text-muted" style={{ textAlign: 'center' }}>
                  Government-backed, free official AMC platform
                </div>
              </div>
            </div>
          </div>

          {/* Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="card">
              <div className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Regular AUM Scanned</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Space Grotesk', marginTop: '0.375rem' }}>
                {formatINR(data.totalRegularValue)}
              </div>
              <div className="text-xs text-secondary" style={{ marginTop: '0.25rem' }}>Across {data.regularFundsCount} schemes</div>
            </div>

            <div className="card">
              <div className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>10-Year Compounded Loss</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: 'var(--gold)', marginTop: '0.375rem' }}>
                {formatINR(data.loss10Year)}
              </div>
              <div className="text-xs text-secondary" style={{ marginTop: '0.25rem' }}>Compounded at 12% CAGR</div>
            </div>

            <div className="card">
              <div className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>20-Year Compounded Loss</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: 'var(--red)', marginTop: '0.375rem' }}>
                {formatINR(data.loss20Year)}
              </div>
              <div className="text-xs text-secondary" style={{ marginTop: '0.25rem' }}>Leaked into intermediary pockets</div>
            </div>

            <div className="card">
              <div className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Switchable Today (0% Exit Load)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: 'var(--green)', marginTop: '0.375rem' }}>
                {data.readyToSwitchCount} of {data.regularFundsCount}
              </div>
              <div className="text-xs text-secondary" style={{ marginTop: '0.25rem' }}>Worth {formatINR(data.immediateSwitchValue)}</div>
            </div>
          </div>

          {/* Wealth Gap Chart */}
          <div className="card">
            <h3 className="text-h3" style={{ marginBottom: '0.25rem' }}>The Hidden Cost of Waiting: Direct vs. Regular</h3>
            <p className="text-xs text-secondary" style={{ marginBottom: '1.25rem' }}>
              Projected wealth over 20 years comparing your portfolio in <strong>Direct Plans</strong> vs staying in <strong>Regular Plans</strong> (assuming 1.15% expense drag).
            </p>

            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionChartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDirect" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRegular" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="year" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} />
                  <Tooltip
                    contentStyle={{ background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 8, fontSize: '0.85rem' }}
                    formatter={(val, name) => [formatINR(val), name === 'direct' ? 'Direct Plan Value' : 'Regular Plan Value']}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="direct" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorDirect)" name="Direct Plan (Keep 100%)" />
                  <Area type="monotone" dataKey="regular" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorRegular)" name="Regular Plan (Distributor Cut)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Switch Blueprint Table */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 className="text-h3">Switch Roadmap & Tax Optimization</h3>
                <p className="text-xs text-secondary">Fund-by-fund exit load status and direct replacement recommendations</p>
              </div>

              {/* Filter Tabs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={14} style={{ color: 'var(--text-muted)' }} />
                <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--surface-raised)', padding: 3, borderRadius: 'var(--radius)' }}>
                  {[
                    ['ALL', `All (${data.blueprints.length})`],
                    ['READY', `Tranche 1: Switch Now (${data.readyToSwitchCount})`],
                    ['PENDING', `Tranche 2: Wait for Expiry (${data.blueprints.length - data.readyToSwitchCount})`]
                  ].map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setSelectedFilter(val)}
                      style={{
                        padding: '0.25rem 0.65rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: 4,
                        border: 'none',
                        cursor: 'pointer',
                        background: selectedFilter === val ? 'var(--primary)' : 'transparent',
                        color: selectedFilter === val ? '#fff' : 'var(--text-secondary)',
                        transition: 'var(--transition)'
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Current Regular Scheme</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Direct Equivalent</th>
                    <th style={{ textAlign: 'right', padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Market Value</th>
                    <th style={{ textAlign: 'right', padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Annual Bleed</th>
                    <th style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Exit Load</th>
                    <th style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Action Plan</th>
                    <th style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Fiduciary Review</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBlueprints.map((item) => {
                    const isSent = sentAdvisorIds.has(item.fundId);
                    return (
                      <tr key={item.fundId} style={{ borderBottom: '1px solid var(--glass-border)22' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                          <div>{item.originalName}</div>
                          <div className="text-xs text-muted" style={{ display: 'flex', gap: '0.5rem', marginTop: 2 }}>
                            <span>Folio: <code>{item.folioNo}</code></span>
                            <span>·</span>
                            <span>{item.holdingDays} days</span>
                          </div>
                        </td>

                        <td style={{ padding: '0.75rem', color: 'var(--primary)' }}>
                          <div style={{ fontWeight: 600 }}>{item.directEquivalent}</div>
                          <div className="text-xs text-secondary" style={{ marginTop: 2 }}>
                            {item.recommendedTranche}
                          </div>
                        </td>

                        <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'Space Grotesk' }}>
                          <div style={{ fontWeight: 700 }}>{formatINR(item.currentValue)}</div>
                          <div className="text-xs text-muted">{item.units ? `${item.units.toLocaleString()} units` : ''}</div>
                        </td>

                        <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'Space Grotesk', color: 'var(--red)', fontWeight: 700 }}>
                          -{formatINR(item.annualCommissionLost)}
                          <div className="text-xs text-muted" style={{ fontWeight: 400 }}>/ year</div>
                        </td>

                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <span className={`badge ${item.canSwitchNowFree ? 'badge-green' : 'badge-gold'}`} style={{ fontSize: '0.7rem' }}>
                            {item.exitLoadStatus}
                          </span>
                        </td>

                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <a
                            href={item.actionUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-ghost btn-sm"
                            style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            MF Central <ArrowUpRight size={12} />
                          </a>
                        </td>

                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <button
                            onClick={() => handleSendToAdvisor(item)}
                            disabled={isSent}
                            className={`btn ${isSent ? 'btn-ghost' : 'btn-primary'} btn-sm`}
                            style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                          >
                            {isSent ? (
                              <>
                                <Check size={12} /> Sent
                              </>
                            ) : (
                              <>
                                <UserCheck size={12} /> Send to Advisor
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3-Step Execution Blueprint */}
          <div className="card" style={{ background: 'rgba(99,102,241,0.04)' }}>
            <h3 className="text-h3" style={{ marginBottom: '1rem' }}>How to Execute Your Switch in 3 Minutes (100% Online)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, marginBottom: '0.75rem' }}>1</div>
                <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Log in to MF Central</div>
                <p className="text-xs text-secondary">Visit <strong>app.mfcentral.com</strong> (joint regulatory initiative of CAMS and KFintech). Authenticate with your PAN and Mobile OTP.</p>
              </div>

              <div style={{ padding: '1rem', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, marginBottom: '0.75rem' }}>2</div>
                <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Select "Switch" Transaction</div>
                <p className="text-xs text-secondary">Go to Service Requests → Transact → Switch. Select your existing Regular scheme folio and choose the <strong>Direct Growth</strong> equivalent.</p>
              </div>

              <div style={{ padding: '1rem', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, marginBottom: '0.75rem' }}>3</div>
                <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Verify OTP & Done</div>
                <p className="text-xs text-secondary">Authorize with 1 OTP. Units transfer seamlessly into the Direct plan in T+2 business days. Zero fees, zero trailing commissions ever again.</p>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
