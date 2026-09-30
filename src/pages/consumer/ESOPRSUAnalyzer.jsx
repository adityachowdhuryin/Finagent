import React, { useState } from 'react';
import {
  Sparkles, DollarSign, Globe, FileText, Download, ShieldAlert,
  ArrowRight, Check, Copy, TrendingUp, AlertTriangle, Building2, HelpCircle
} from 'lucide-react';
import { jsPDF } from 'jspdf';

const PRESETS = {
  googl: {
    company: 'Alphabet Inc (Google)',
    symbol: 'GOOGL',
    exchange: 'NASDAQ',
    vestings: [
      { id: 'v1', vestDate: '2023-03-25', shares: 50, fmvUSD: 105.5, exchangeRate: 82.4 },
      { id: 'v2', vestDate: '2023-09-25', shares: 50, fmvUSD: 131.2, exchangeRate: 83.1 },
      { id: 'v3', vestDate: '2024-03-25', shares: 50, fmvUSD: 151.8, exchangeRate: 83.6 },
      { id: 'v4', vestDate: '2024-09-25', shares: 50, fmvUSD: 163.4, exchangeRate: 84.3 },
    ],
    sales: [
      { id: 's1', vestDate: '2023-03-25', saleDate: '2025-05-10', shares: 40, costPriceUSD: 105.5, salePriceUSD: 175.0, exchangeRate: 84.5 },
    ],
    usWithholdingUSD: 450,
  },
  msft: {
    company: 'Microsoft Corporation',
    symbol: 'MSFT',
    exchange: 'NASDAQ',
    vestings: [
      { id: 'v1', vestDate: '2023-02-15', shares: 30, fmvUSD: 270.0, exchangeRate: 82.5 },
      { id: 'v2', vestDate: '2023-08-15', shares: 30, fmvUSD: 320.0, exchangeRate: 83.0 },
      { id: 'v3', vestDate: '2024-02-15', shares: 30, fmvUSD: 405.0, exchangeRate: 83.4 },
    ],
    sales: [
      { id: 's1', vestDate: '2023-02-15', saleDate: '2024-11-20', shares: 20, costPriceUSD: 270.0, salePriceUSD: 425.0, exchangeRate: 84.2 },
    ],
    usWithholdingUSD: 380,
  }
};

export default function ESOPRSUAnalyzer() {
  const [companyName, setCompanyName] = useState('Alphabet Inc (Google)');
  const [symbol, setSymbol] = useState('GOOGL');
  const [taxSlab, setTaxSlab] = useState(30);
  const [vestings, setVestings] = useState(PRESETS.googl.vestings);
  const [sales, setSales] = useState(PRESETS.googl.sales);
  const [usWithholdingUSD, setUsWithholdingUSD] = useState(PRESETS.googl.usWithholdingUSD);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copiedFA, setCopiedFA] = useState(false);

  async function handleAnalyze() {
    setLoading(true);
    try {
      const res = await fetch('/api/esop-rsu/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          symbol,
          vestings,
          sales,
          taxSlab,
          usWithholdingUSD,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function loadPreset(key) {
    const p = PRESETS[key];
    setCompanyName(p.company);
    setSymbol(p.symbol);
    setVestings(p.vestings);
    setSales(p.sales);
    setUsWithholdingUSD(p.usWithholdingUSD);
    setResult(null);
  }

  function copyScheduleFA() {
    if (!result?.scheduleFA) return;
    const text = `ITR-2 SCHEDULE FA (FOREIGN ASSETS - TABLE A3)\n` +
      `Country: ${result.scheduleFA.countryName} (Code: ${result.scheduleFA.countryCode})\n` +
      `Entity: ${result.scheduleFA.entityName}\n` +
      `Peak Balance during Year: ₹${result.scheduleFA.peakBalanceINR.toLocaleString('en-IN')}\n` +
      `Closing Balance at Year-End: ₹${result.scheduleFA.closingBalanceINR.toLocaleString('en-IN')}\n` +
      `Gross Amount Credited: ₹${result.scheduleFA.grossAmountPaidCreditedINR.toLocaleString('en-IN')}\n` +
      `Gross Sale Proceeds: ₹${result.scheduleFA.grossProceedsFromSaleINR.toLocaleString('en-IN')}`;
    navigator.clipboard.writeText(text);
    setCopiedFA(true);
    setTimeout(() => setCopiedFA(false), 2500);
  }

  function downloadReportPDF() {
    if (!result) return;
    const doc = new jsPDF();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('FinAgent — Foreign Asset & US RSU Tax Dossier', 14, 18);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Compliant with Rule 115, Schedule FA (ITR-2), and Indo-US DTAA Form 67', 14, 25);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Company: ${result.companyName} (${result.symbol})`, 14, 42);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Vested Shares: ${result.summary.totalVestedShares}`, 14, 52);
    doc.text(`Unsold Balance: ${result.summary.unsoldShares} shares`, 14, 59);
    doc.text(`Total Perquisite Value (at Vest): INR ${result.summary.totalPerquisiteValueINR.toLocaleString('en-IN')}`, 14, 66);
    doc.text(`Total Perquisite Tax Paid: INR ${result.summary.totalPerquisiteTaxINR.toLocaleString('en-IN')}`, 14, 73);

    doc.setFont('helvetica', 'bold');
    doc.text('Capital Gains & Foreign Tax Credit (FTC):', 14, 85);
    doc.setFont('helvetica', 'normal');
    doc.text(`Short-Term Capital Gains (STCG): INR ${result.summary.totalSTCG_INR.toLocaleString('en-IN')}`, 14, 93);
    doc.text(`Long-Term Capital Gains (LTCG - 12.5%): INR ${result.summary.totalLTCG_INR.toLocaleString('en-IN')}`, 14, 100);
    doc.text(`US Tax Withheld (IRS 1042-S): INR ${result.summary.usTaxPaidINR.toLocaleString('en-IN')}`, 14, 107);
    doc.text(`Eligible Form 67 FTC Offset: INR ${result.summary.eligibleFTC_INR.toLocaleString('en-IN')}`, 14, 114);
    doc.setFont('helvetica', 'bold');
    doc.text(`Net Payable Tax in India: INR ${result.summary.netPayableTaxINR.toLocaleString('en-IN')}`, 14, 122);

    doc.setFont('helvetica', 'bold');
    doc.text('Schedule FA (Table A3) Disclosures for ITR-2:', 14, 136);
    doc.setFont('helvetica', 'normal');
    doc.text(`- Country Code: ${result.scheduleFA.countryCode} (${result.scheduleFA.countryName})`, 14, 144);
    doc.text(`- Peak Balance during the Year: INR ${result.scheduleFA.peakBalanceINR.toLocaleString('en-IN')}`, 14, 151);
    doc.text(`- Closing Balance at Year-End: INR ${result.scheduleFA.closingBalanceINR.toLocaleString('en-IN')}`, 14, 158);
    doc.text(`- Gross Proceeds from Sale: INR ${result.scheduleFA.grossProceedsFromSaleINR.toLocaleString('en-IN')}`, 14, 165);

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Generated via FinAgent AI Wealth Suite. Please review with your Chartered Accountant before filing.', 14, 280);

    doc.save(`Schedule_FA_RSU_${result.symbol}.pdf`);
  }

  return (
    <div className="page-container" style={{ padding: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Globe size={24} color="var(--primary)" />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Tech ESOP & US RSU Tax Engine</h1>
            <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
              ITR-2 Schedule FA · Form 67
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
            Automate foreign share perquisite tax, Rule 115 SBI TT rate conversion, Schedule FA reporting, and US tax credit.
          </p>
        </div>

        {/* Preset Selector */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => loadPreset('googl')} className="btn btn-secondary btn-sm">
            <Building2 size={14} /> Try Google RSU
          </button>
          <button onClick={() => loadPreset('msft')} className="btn btn-secondary btn-sm">
            <Building2 size={14} /> Try Microsoft RSU
          </button>
        </div>
      </div>

      {/* Black Money Act Warning Banner */}
      <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 12, padding: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.5rem' }}>
        <ShieldAlert size={24} color="#f87171" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.85rem', color: '#fca5a5' }}>
          <strong>Critical Legal Notice:</strong> Holding vested foreign shares (even 1 share) mandates filing <strong>ITR-2 with Schedule FA</strong>. Non-reporting can trigger a ₹10 Lakh penalty under the <em>Black Money (Undisclosed Foreign Income and Assets) Act, 2015</em>.
        </div>
      </div>

      {/* Main Grid: Inputs vs Results */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Left: Input Configuration */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={16} color="var(--primary)" /> Foreign Grant Configuration
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Company Name</label>
              <input
                type="text"
                className="input"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem', marginTop: '0.2rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ticker Symbol</label>
              <input
                type="text"
                className="input"
                value={symbol}
                onChange={e => setSymbol(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem', marginTop: '0.2rem' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Income Tax Slab in India</label>
            <select
              className="input"
              value={taxSlab}
              onChange={e => setTaxSlab(Number(e.target.value))}
              style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem', marginTop: '0.2rem' }}
            >
              <option value={30}>30% Slab (Annual income &gt; ₹15 Lakhs)</option>
              <option value={20}>20% Slab</option>
              <option value={15}>15% Slab</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>US Tax Withheld (IRS 1042-S in USD)</label>
            <input
              type="number"
              className="input"
              value={usWithholdingUSD}
              onChange={e => setUsWithholdingUSD(Number(e.target.value))}
              style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem', marginTop: '0.2rem' }}
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Eligible for Foreign Tax Credit (FTC) in Form 67</span>
          </div>

          {/* Vestings Summary */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Vesting Tranches ({vestings.length})</span>
            </div>
            <div style={{ background: 'var(--surface-raised)', borderRadius: 8, padding: '0.5rem', maxHeight: 150, overflowY: 'auto' }}>
              {vestings.map((v, i) => (
                <div key={v.id || i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '0.35rem 0', borderBottom: i < vestings.length - 1 ? '1px solid var(--glass-border)' : 'none' }}>
                  <span>{v.vestDate}: <strong>{v.shares} shares</strong> @ ${v.fmvUSD}</span>
                  <span style={{ color: 'var(--primary-light)' }}>SBI TT: ₹{v.exchangeRate || 84.35}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sales Summary */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Sales Executed ({sales.length})</span>
            </div>
            <div style={{ background: 'var(--surface-raised)', borderRadius: 8, padding: '0.5rem', maxHeight: 120, overflowY: 'auto' }}>
              {sales.map((s, i) => (
                <div key={s.id || i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '0.35rem 0' }}>
                  <span>Sold {s.shares} shs @ ${s.salePriceUSD} on {s.saleDate}</span>
                  <span style={{ color: '#4ade80' }}>Cost: ${s.costPriceUSD}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem' }}
          >
            <Sparkles size={16} /> {loading ? 'Computing Rule 115 Taxes…' : 'Compute Taxes & Schedule FA'}
          </button>
        </div>

        {/* Right: Analysis & Schedule FA Output */}
        <div className="card" style={{ padding: '1.5rem' }}>
          {!result ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <Globe size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <h4 style={{ margin: 0 }}>No Analysis Generated Yet</h4>
              <p style={{ fontSize: '0.85rem', maxWidth: 320, margin: '0.5rem auto 1.5rem' }}>
                Click "Compute Taxes & Schedule FA" or load one of the tech company presets.
              </p>
              <button onClick={() => { loadPreset('googl'); setTimeout(handleAnalyze, 100); }} className="btn btn-secondary btn-sm">
                Run Google Demo Analysis
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Tax & Compliance Summary</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={downloadReportPDF} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Download size={14} /> PDF
                  </button>
                  <button onClick={copyScheduleFA} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {copiedFA ? <Check size={14} color="#4ade80" /> : <Copy size={14} />} {copiedFA ? 'Copied' : 'Copy FA'}
                  </button>
                </div>
              </div>

              {/* KPI Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ background: 'var(--surface-raised)', borderRadius: 10, padding: '0.75rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Perquisite Value at Vest</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    ₹{result.summary.totalPerquisiteValueINR.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#818cf8', marginTop: '0.2rem' }}>
                    TDS Deducted: ₹{result.summary.totalPerquisiteTaxINR.toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ background: 'var(--surface-raised)', borderRadius: 10, padding: '0.75rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>LTCG (&gt;24 mos @ 12.5%)</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#4ade80' }}>
                    ₹{result.summary.totalLTCG_INR.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    STCG: ₹{result.summary.totalSTCG_INR.toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ background: 'var(--surface-raised)', borderRadius: 10, padding: '0.75rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>US Tax Withheld (IRS 1042-S)</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f59e0b' }}>
                    ₹{result.summary.usTaxPaidINR.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#4ade80', marginTop: '0.2rem' }}>
                    Form 67 FTC: ₹{result.summary.eligibleFTC_INR.toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))', borderRadius: 10, padding: '0.75rem', border: '1px solid rgba(168,85,247,0.3)' }}>
                  <div style={{ fontSize: '0.7rem', color: '#c084fc' }}>Net Payable in India</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#e879f9' }}>
                    ₹{result.summary.netPayableTaxINR.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#86efac', marginTop: '0.2rem' }}>
                    After Form 67 Foreign Tax Credit
                  </div>
                </div>
              </div>

              {/* Schedule FA Box */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: 10, padding: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-light)' }}>
                    ITR-2 Schedule FA (Table A3) Ready Values
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Country Code: 740 (USA)</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.75rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Peak Balance: </span>
                    <strong>₹{result.scheduleFA.peakBalanceINR.toLocaleString('en-IN')}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Closing Balance: </span>
                    <strong>₹{result.scheduleFA.closingBalanceINR.toLocaleString('en-IN')}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Gross Inflows: </span>
                    <strong>₹{result.scheduleFA.grossAmountPaidCreditedINR.toLocaleString('en-IN')}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Gross Sale Proceeds: </span>
                    <strong>₹{result.scheduleFA.grossProceedsFromSaleINR.toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              </div>

              {/* Compliance Notes List */}
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Filing Guidelines:</div>
                <ul style={{ paddingLeft: '1.2rem', margin: 0, lineHeight: 1.5 }}>
                  {result.complianceNotes.map((note, i) => (
                    <li key={i}>{note}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
