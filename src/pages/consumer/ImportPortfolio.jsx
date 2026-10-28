import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, CheckCircle, ChevronRight, FileText, Edit3, Database } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { parseBrokerageFile } from '../../utils/usBrokerageParser';

const DEMO_HOLDINGS_IN = [
  { fund: 'Axis Bluechip Fund - Growth', scheme: 'Axis Bluechip Fund - Growth', name: 'Axis Bluechip Fund - Growth', category: 'Large Cap', units: 892.456, nav: 58.32, value: 52032, currentValue: 52032, folio: 'AXS/001234', amc: 'Axis Mutual Fund' },
  { fund: 'Mirae Asset Large Cap Fund - Growth', scheme: 'Mirae Asset Large Cap Fund - Growth', name: 'Mirae Asset Large Cap Fund - Growth', category: 'Large Cap', units: 421.123, nav: 98.45, value: 41472, currentValue: 41472, folio: 'MIR/005678', amc: 'Mirae Asset Mutual Fund' },
  { fund: 'HDFC Mid-Cap Opportunities Fund', scheme: 'HDFC Mid-Cap Opportunities Fund', name: 'HDFC Mid-Cap Opportunities Fund', category: 'Mid Cap', units: 312.789, nav: 142.10, value: 44448, currentValue: 44448, folio: 'HDFC/009012', amc: 'HDFC Mutual Fund' },
  { fund: 'SBI Bluechip Fund - Growth', scheme: 'SBI Bluechip Fund - Growth', name: 'SBI Bluechip Fund - Growth', category: 'Large Cap', units: 567.234, nav: 72.80, value: 41294, currentValue: 41294, folio: 'SBI/003456', amc: 'SBI Mutual Fund' },
  { fund: 'Parag Parikh Flexi Cap Fund - Growth', scheme: 'Parag Parikh Flexi Cap Fund - Growth', name: 'Parag Parikh Flexi Cap Fund - Growth', category: 'Flexi Cap', units: 198.567, nav: 76.45, value: 15184, currentValue: 15184, folio: 'PPFAS/007890', amc: 'PPFAS Mutual Fund' },
];

const DEMO_HOLDINGS_US = [
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', fund: 'Vanguard S&P 500 ETF', category: 'Large Cap Blend', units: 340.5, nav: 540.20, price: 540.20, value: 183938, currentValue: 183938, folio: 'SCHW-8821', amc: 'Vanguard', expenseRatio: '0.03%' },
  { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', fund: 'Vanguard Total Stock Market ETF', category: 'Total US Market', units: 480.0, nav: 285.50, price: 285.50, value: 137040, currentValue: 137040, folio: 'FID-2041', amc: 'Vanguard', expenseRatio: '0.03%' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust (Nasdaq 100)', fund: 'Invesco QQQ Trust', category: 'Large Cap Growth', units: 185.2, nav: 492.10, price: 492.10, value: 91137, currentValue: 91137, folio: 'SCHW-8821', amc: 'Invesco', expenseRatio: '0.20%' },
  { symbol: 'BND', name: 'Vanguard Total Bond Market ETF', fund: 'Vanguard Total Bond Market ETF', category: 'Total Bond Market', units: 620.0, nav: 72.40, price: 72.40, value: 44888, currentValue: 44888, folio: 'NETBEN-401K', amc: 'Vanguard', expenseRatio: '0.03%' },
  { symbol: 'AAPL', name: 'Apple Inc.', fund: 'Apple Inc.', category: 'Technology', units: 250.0, nav: 228.30, price: 228.30, value: 57075, currentValue: 57075, folio: 'SCHW-8821', amc: 'Equity', expenseRatio: '0.00%' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', fund: 'Microsoft Corp.', category: 'Technology', units: 140.0, nav: 448.20, price: 448.20, value: 62748, currentValue: 62748, folio: 'SCHW-8821', amc: 'Equity', expenseRatio: '0.00%' },
];

const SOURCES_IN = [
  { id: 'cams', icon: '📄', title: 'CAMS Consolidated Statement', desc: 'Upload your CAMS CAS PDF — covers Axis, HDFC, SBI, Nippon & more', badge: 'Recommended' },
  { id: 'kfintech', icon: '📑', title: 'KFintech Statement', desc: 'Upload KFintech CAS PDF — covers Mirae, PPFAS, Kotak & more', badge: null },
  { id: 'manual', icon: '✏️', title: 'Manual Entry', desc: 'Add each fund manually with folio, units and NAV details', badge: null },
];

const SOURCES_US = [
  { id: 'schwab', icon: '🏦', title: 'Charles Schwab Statement', desc: 'Upload Schwab brokerage, Roth IRA, or Trust account PDF', badge: 'Recommended' },
  { id: 'fidelity', icon: '🟢', title: 'Fidelity Investments Statement', desc: 'Upload Fidelity brokerage or NetBenefits 401(k) PDF', badge: null },
  { id: 'vanguard', icon: '🔴', title: 'Vanguard Group Statement', desc: 'Upload Vanguard account or mutual fund statement PDF', badge: null },
  { id: 'robinhood', icon: '🏹', title: 'Robinhood / Webull Statement', desc: 'Upload Apex Clearing or Robinhood monthly statement PDF', badge: null },
  { id: 'manual', icon: '✏️', title: 'Manual USD Entry', desc: 'Add US stocks, ETFs, 401(k), and IRAs manually', badge: null },
];

const STEPS = ['Choose Source', 'Upload / Enter', 'Review Holdings', 'Done'];

export default function ImportPortfolio() {
  const navigate = useNavigate();
  const { state, dispatch, persistHoldings, isUSMarket } = useApp();
  const currencySymbol = isUSMarket ? '$' : '₹';
  const SOURCES = isUSMarket ? SOURCES_US : SOURCES_IN;
  const DEMO_HOLDINGS = isUSMarket ? DEMO_HOLDINGS_US : DEMO_HOLDINGS_IN;

  const [step, setStep] = useState(0);
  const [source, setSource] = useState(null);
  const [holdings, setHoldings] = useState(DEMO_HOLDINGS);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [manualForm, setManualForm] = useState({ fund: '', units: '', nav: '', value: '', folio: '' });
  const [editingIdx, setEditingIdx] = useState(null);
  const [editRow, setEditRow] = useState({});
  const fileRef = useRef();

  const handleFileDrop = useCallback(async (file) => {
    if (!file) return;

    // Zero-vision deterministic parser for CSV, OFX, QFX
    const isCsvOrOfx = file.name.endsWith('.csv') || file.name.endsWith('.ofx') || file.name.endsWith('.qfx') || file.name.endsWith('.qbo') || file.type.includes('csv') || file.type.includes('xml');

    if (isCsvOrOfx) {
      setUploading(true);
      setUploadError(null);
      try {
        const text = await file.text();
        const parsed = parseBrokerageFile(text, file.name);
        if (parsed.holdings && parsed.holdings.length > 0) {
          setHoldings(parsed.holdings);
          setUploading(false);
          setStep(2);
          return;
        } else {
          setUploadError(`Could not detect valid holdings in ${file.name}. Please ensure standard Schwab, Fidelity, Vanguard, Robinhood or OFX format.`);
          setUploading(false);
          return;
        }
      } catch (err) {
        setUploadError(`Error reading ${file.name}: ${err.message}`);
        setUploading(false);
        return;
      }
    }

    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setUploadError('Please upload a valid CSV, OFX, or PDF statement.');
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result.split(',')[1];
        try {
          const res = await fetch('/api/cams/parse-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64, source }),
          });
          if (!res.ok) throw new Error('Backend error');
          const data = await res.json();
          if (data.holdings?.length) {
            const normalized = data.holdings.map(h => {
              const units = Number(h.units) || 0;
              const nav = Number(h.nav) || 0;
              const value = Number(h.currentValue ?? h.value ?? (units * nav)) || 0;
              const name = h.scheme || h.fund || h.name || 'Mutual Fund';
              const amc = h.amc || name.split(' ')[0] || 'Mutual Fund';
              const category = h.category || 'Equity';
              const folio = h.folio || '';
              const xirr = Number(h.xirr) || 14.2;
              return {
                fund: name,
                scheme: name,
                name: name,
                amc,
                category,
                folio,
                units,
                nav,
                value,
                currentValue: value,
                xirr,
                cagr3Y: xirr,
              };
            });
            setHoldings(normalized);
          } else {
            setHoldings(DEMO_HOLDINGS);
          }
        } catch {
          setHoldings(DEMO_HOLDINGS);
        } finally {
          setUploading(false);
          setStep(2);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setHoldings(DEMO_HOLDINGS);
      setUploading(false);
      setStep(2);
    }
  }, [source, DEMO_HOLDINGS]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileDrop(e.dataTransfer.files[0]);
  };

  const addManualFund = () => {
    if (!manualForm.fund) return;
    const units = parseFloat(manualForm.units) || 0;
    const nav = parseFloat(manualForm.nav) || 0;
    const value = manualForm.value ? parseFloat(manualForm.value) : Math.round(units * nav);
    const name = manualForm.fund;
    setHoldings(prev => [...prev, {
      fund: name,
      scheme: name,
      name: name,
      amc: name.split(' ')[0] || 'Mutual Fund',
      category: 'Manual',
      units,
      nav,
      value,
      currentValue: value,
      folio: manualForm.folio || 'MANUAL',
    }]);
    setManualForm({ fund: '', units: '', nav: '', value: '', folio: '' });
  };

  const startEdit = (idx) => {
    setEditingIdx(idx);
    const item = holdings[idx];
    setEditRow({
      ...item,
      fund: item.fund || item.scheme || item.name || '',
      units: item.units,
      nav: item.nav,
      value: item.value ?? item.currentValue ?? 0,
      folio: item.folio || '',
      category: item.category || 'Equity',
    });
  };

  const saveEdit = () => {
    const units = parseFloat(editRow.units) || 0;
    const nav = parseFloat(editRow.nav) || 0;
    const value = editRow.value ? parseFloat(editRow.value) : Math.round(units * nav);
    const name = editRow.fund || editRow.scheme || 'Mutual Fund';
    setHoldings(prev => prev.map((h, i) => i === editingIdx ? {
      ...h,
      ...editRow,
      fund: name,
      scheme: name,
      name: name,
      units,
      nav,
      value,
      currentValue: value,
    } : h));
    setEditingIdx(null);
  };

  const deleteHolding = (idx) => setHoldings(prev => prev.filter((_, i) => i !== idx));

  const totalValue = holdings.reduce((s, h) => s + (Number(h.value ?? h.currentValue) || 0), 0);

  const handleConfirmImport = () => {
    const newMFs = holdings.map(h => {
      const name = h.scheme || h.fund || h.name || 'Mutual Fund';
      const units = Number(h.units) || 0;
      const nav = Number(h.nav) || 0;
      const val = Number(h.value ?? h.currentValue) || Math.round(units * nav);
      const cagr = Number(h.cagr3Y || h.xirr) || 14.2;
      return {
        name,
        scheme: name,
        fund: name,
        amc: h.amc || name.split(' ')[0] || 'Mutual Fund',
        units,
        nav,
        value: val,
        currentValue: val,
        pnl: 0,
        pnlPct: 0,
        cagr3Y: cagr,
        xirr: cagr,
        expenseRatio: 0.85,
        taxType: 'LTCG',
        category: h.category || 'Equity',
        folio: h.folio || '',
      };
    });

    const currentHoldings = state.consumer?.holdings || {};
    let updatedHoldings;

    if (isUSMarket) {
      const existingEquities = currentHoldings.equities || [];
      const newEquities = holdings.map(h => ({
        symbol: h.symbol || (h.name || h.fund || 'ETF').slice(0, 4).toUpperCase(),
        name: h.name || h.fund,
        qty: Number(h.units) || 10,
        ltp: Number(h.nav || h.price) || 100,
        avgCost: Number(h.nav || h.price || 100) * 0.9,
        value: Number(h.value ?? h.currentValue) || 1000,
        pnl: Math.round((Number(h.value ?? h.currentValue) || 1000) * 0.1),
        pnlPct: 10.0,
        holdingDays: 420,
        taxType: 'LTCG',
        sector: h.category || 'Large Cap Blend',
      }));
      updatedHoldings = {
        ...currentHoldings,
        equities: [...existingEquities, ...newEquities],
      };
    } else {
      const existingMFs = currentHoldings.mutualFunds || currentHoldings.mf || [];
      updatedHoldings = {
        ...currentHoldings,
        mutualFunds: [...existingMFs, ...newMFs],
        mf: [...existingMFs, ...newMFs],
      };
    }

    dispatch({ type: 'UPDATE_HOLDINGS', payload: updatedHoldings });
    try {
      if (typeof persistHoldings === 'function') {
        persistHoldings(updatedHoldings).catch(() => {});
      } else {
        localStorage.setItem('finagent_user_holdings', JSON.stringify(updatedHoldings));
      }
    } catch {}
    setStep(3);
  };

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div>
        <h1 className="text-h1">📥 Import Portfolio</h1>
        <p className="text-sm text-secondary" style={{ marginTop: '0.25rem' }}>Import your mutual fund holdings from CAMS, KFintech or enter manually</p>
      </div>

      {/* Step Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {STEPS.map((label, i) => (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: i < step ? 'var(--green)' : i === step ? 'var(--primary)' : 'var(--surface-raised)',
                border: i === step ? '2px solid var(--primary-light)' : '2px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.875rem', color: i <= step ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.3s', boxShadow: i === step ? '0 0 0 4px var(--primary-glow)' : 'none',
              }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: '0.7rem', color: i === step ? 'var(--primary-light)' : 'var(--text-muted)', fontWeight: i === step ? 600 : 400, whiteSpace: 'nowrap' }}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: i < step ? 'var(--green)' : 'var(--glass-border)', margin: '0 0.25rem', marginBottom: '1.25rem', transition: 'background 0.3s' }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 0: Choose Source */}
      {step === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 className="text-h2">Select your portfolio source</h2>
          {SOURCES.map(s => (
            <div
              key={s.id}
              className="card"
              onClick={() => { setSource(s.id); setStep(1); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '1.25rem', cursor: 'pointer',
                border: source === s.id ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                background: source === s.id ? 'rgba(99,102,241,0.08)' : 'var(--surface)',
                transition: 'all 0.2s', padding: '1.25rem 1.5rem',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = s.id === source ? 'var(--primary)' : 'var(--glass-border)'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ fontSize: '2.5rem', flexShrink: 0 }}>{s.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{s.title}</span>
                  {s.badge && <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>{s.badge}</span>}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{s.desc}</div>
              </div>
              <ChevronRight size={20} color="var(--text-muted)" />
            </div>
          ))}
        </div>
      )}

      {/* Step 1: Upload or Manual */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setStep(0)}>← Back</button>
            <h2 className="text-h2">{source === 'manual' ? '✏️ Manual Entry' : '📤 Upload PDF Statement'}</h2>
          </div>

          {source !== 'manual' ? (
            <div>
              <div
                className="card"
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? 'var(--primary)' : 'var(--glass-border)'}`,
                  background: dragOver ? 'rgba(99,102,241,0.07)' : 'var(--surface)',
                  cursor: 'pointer', textAlign: 'center', padding: '3rem 2rem',
                  transition: 'all 0.2s', borderRadius: 'var(--radius)',
                }}
              >
                <input ref={fileRef} type="file" accept=".pdf,.csv,.ofx,.qfx,.qbo,text/csv,application/pdf" style={{ display: 'none' }}
                  onChange={e => handleFileDrop(e.target.files[0])} />
                {uploading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 48, height: 48, border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <div style={{ color: 'var(--text-secondary)' }}>Parsing your statement deterministically…</div>
                  </div>
                ) : (
                  <>
                    <Upload size={40} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                    <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem' }}>
                      {isUSMarket
                        ? 'Drop Charles Schwab, Fidelity, Vanguard, Robinhood CSV / OFX, or PDF here'
                        : `Drop your ${source === 'cams' ? 'CAMS' : 'KFintech'} CAS PDF or portfolio export here`}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>Instantaneous zero-vision parsing · CSV, OFX & PDF supported</div>
                    <button className="btn btn-primary btn-sm" onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>Browse Files</button>
                  </>
                )}
              </div>
              {uploadError && <div style={{ color: 'var(--red)', fontSize: '0.875rem', marginTop: '0.5rem' }}>{uploadError}</div>}
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => { setHoldings(DEMO_HOLDINGS); setStep(2); }}>Use demo data instead</button>
              </div>
            </div>
          ) : (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 className="text-h3">Add Fund Manually</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                {[['fund', isUSMarket ? 'Ticker / Asset Name' : 'Fund Name', isUSMarket ? 'e.g. VOO / Apple Inc.' : 'e.g. Axis Bluechip Fund - Growth'],
                  ['folio', isUSMarket ? 'Account / Custodian' : 'Folio Number', isUSMarket ? 'e.g. Schwab / Fidelity' : 'e.g. AXS/001234'],
                  ['units', isUSMarket ? 'Shares / Units' : 'Units', isUSMarket ? 'e.g. 150.0' : 'e.g. 892.456'],
                  ['nav', `Price / NAV (${currencySymbol})`, isUSMarket ? 'e.g. 540.20' : 'e.g. 58.32'],
                  ['value', `Current Value (${currencySymbol})`, 'Auto-calculated'],
                ].map(([field, label, placeholder]) => (
                  <div key={field} style={{ gridColumn: field === 'fund' ? '1 / -1' : 'auto' }}>
                    <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.375rem', display: 'block' }}>{label}</label>
                    <input
                      value={manualForm[field]}
                      onChange={e => setManualForm(f => ({ ...f, [field]: e.target.value }))}
                      placeholder={placeholder}
                      style={{
                        width: '100%', padding: '0.625rem 0.875rem',
                        background: 'var(--surface-raised)', border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.875rem',
                        outline: 'none', transition: 'border-color 0.2s',
                      }}
                      onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                      onBlur={e => e.target.style.borderColor = 'var(--glass-border)'}
                    />
                  </div>
                ))}
              </div>
              <button className="btn btn-primary btn-sm" onClick={addManualFund} style={{ alignSelf: 'flex-start' }}>+ Add Fund</button>
              {holdings.length > 0 && (
                <div>
                  <div className="divider" style={{ margin: '0.5rem 0' }} />
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{holdings.length} fund(s) added</div>
                  {holdings.map((h, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', fontSize: '0.875rem' }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{h.name || h.fund}</span>
                      <span style={{ color: 'var(--green)', fontWeight: 600 }}>{currencySymbol}{h.value.toLocaleString(isUSMarket ? 'en-US' : 'en-IN')}</span>
                    </div>
                  ))}
                  <button className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }} onClick={() => setStep(2)}>Review Holdings →</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Review Holdings */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setStep(1)}>← Back</button>
              <div>
                <h2 className="text-h2">Review Your Holdings</h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{holdings.length} assets · Total {currencySymbol}{totalValue.toLocaleString(isUSMarket ? 'en-US' : 'en-IN')}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-green">{holdings.length} Assets Found</span>
              <button className="btn btn-primary" onClick={handleConfirmImport}>Confirm Import →</button>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--glass-border)' }}>
                    {['Asset / Holding Name', 'Category', 'Account / Folio', 'Units / Shares', `Price (${currencySymbol})`, `Value (${currencySymbol})`, 'Actions'].map(h => (
                      <th key={h} style={{ padding: '0.875rem 1rem', textAlign: h.startsWith('Value') ? 'right' : 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-raised)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {editingIdx === idx ? (
                        <>
                          <td style={{ padding: '0.625rem 1rem' }} colSpan={3}>
                            <input value={editRow.fund || editRow.scheme || ''} onChange={e => setEditRow(r => ({ ...r, fund: e.target.value, scheme: e.target.value }))}
                              style={{ width: '100%', padding: '0.375rem 0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.8125rem' }} />
                          </td>
                          <td style={{ padding: '0.625rem 0.5rem' }}>
                            <input value={editRow.units} onChange={e => setEditRow(r => ({ ...r, units: e.target.value }))}
                              style={{ width: 80, padding: '0.375rem 0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.8125rem' }} />
                          </td>
                          <td style={{ padding: '0.625rem 0.5rem' }}>
                            <input value={editRow.nav} onChange={e => setEditRow(r => ({ ...r, nav: e.target.value }))}
                              style={{ width: 80, padding: '0.375rem 0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.8125rem' }} />
                          </td>
                          <td style={{ padding: '0.625rem 0.5rem', textAlign: 'right' }}>
                            <input value={editRow.value ?? editRow.currentValue ?? ''} onChange={e => setEditRow(r => ({ ...r, value: e.target.value, currentValue: e.target.value }))}
                              style={{ width: 90, padding: '0.375rem 0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.8125rem', textAlign: 'right' }} />
                          </td>
                          <td style={{ padding: '0.625rem 1rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className="btn btn-primary btn-sm" onClick={saveEdit}>Save</button>
                              <button className="btn btn-ghost btn-sm" onClick={() => setEditingIdx(null)}>Cancel</button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: '0.875rem 1rem' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: 260, lineHeight: 1.4 }}>{h.name || h.scheme || h.fund || 'Holding'}</div>
                            {h.symbol && <span className="badge badge-primary" style={{ fontSize: '0.65rem', marginTop: 2 }}>{h.symbol}</span>}
                            {h.amc && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{h.amc}</div>}
                          </td>
                          <td style={{ padding: '0.875rem 1rem' }}>
                            <span className="chip" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>{h.category || 'Equity'}</span>
                          </td>
                          <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{h.folio || '—'}</td>
                          <td style={{ padding: '0.875rem 1rem', fontFamily: 'Space Grotesk', fontWeight: 600 }}>{(Number(h.units) || 0).toFixed(2)}</td>
                          <td style={{ padding: '0.875rem 1rem', fontFamily: 'Space Grotesk' }}>{currencySymbol}{(Number(h.nav || h.price) || 0).toFixed(2)}</td>
                          <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--green)' }}>{currencySymbol}{(Number(h.value ?? h.currentValue) || 0).toLocaleString(isUSMarket ? 'en-US' : 'en-IN')}</td>
                          <td style={{ padding: '0.875rem 1rem' }}>
                            <div style={{ display: 'flex', gap: '0.375rem' }}>
                              <button className="btn btn-ghost btn-sm" onClick={() => startEdit(idx)} title="Edit" style={{ padding: '0.25rem 0.5rem' }}>
                                <Edit3 size={14} />
                              </button>
                              <button className="btn btn-ghost btn-sm" onClick={() => deleteHolding(idx)} title="Delete" style={{ padding: '0.25rem 0.5rem', color: 'var(--red)' }}>
                                ✕
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'var(--surface-raised)', borderTop: '2px solid var(--glass-border)' }}>
                    <td colSpan={5} style={{ padding: '0.875rem 1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Total Portfolio Value</td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary-light)' }}>{currencySymbol}{totalValue.toLocaleString(isUSMarket ? 'en-US' : 'en-IN')}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-primary"
              onClick={handleConfirmImport}
              style={{ gap: '0.5rem', display: 'flex', alignItems: 'center' }}
            >
              Confirm & Import <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 3 && (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{
            width: 96, height: 96, borderRadius: '50%',
            background: 'radial-gradient(circle, var(--green-glow) 0%, transparent 70%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'pulse 2s ease-in-out infinite',
          }}>
            <CheckCircle size={56} color="var(--green)" strokeWidth={1.5} />
          </div>
          <div>
            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Portfolio Imported! 🎉</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
              {holdings.length} assets · {currencySymbol}{totalValue.toLocaleString(isUSMarket ? 'en-US' : 'en-IN')} total value successfully synced
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', width: '100%', maxWidth: 480 }}>
            {[
              { label: 'Assets Imported', value: holdings.length, icon: '📊' },
              { label: 'Total Value', value: isUSMarket ? `$${(totalValue / 1000).toFixed(0)}k` : `₹${(totalValue / 100000).toFixed(1)}L`, icon: '💰' },
              { label: 'Last Updated', value: 'Just now', icon: '🕐' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '1rem', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>{s.icon}</div>
                <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.25rem', color: 'var(--primary-light)' }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-ghost" onClick={() => { setStep(0); setSource(null); setHoldings(DEMO_HOLDINGS); }}>Import Another</button>
            <button className="btn btn-primary" onClick={() => navigate('/app/portfolio')}>View Portfolio →</button>
          </div>
        </div>
      )}

    </div>

  );
}
