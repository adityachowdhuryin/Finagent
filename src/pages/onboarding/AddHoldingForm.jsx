import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Search } from 'lucide-react';

const TABS = ['Stock/ETF', 'Mutual Fund', 'Fixed Deposit', 'EPF / PPF', 'Gold', 'Real Estate'];

export default function AddHoldingForm({ onSave, onCancel, compact }) {
  const { state, dispatch, persistHoldings } = useApp();
  const [tab, setTab] = useState('Stock/ETF');
  const [loading, setLoading] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  // Stock/ETF
  const [symbolData, setSymbolData] = useState(null);
  const [qty, setQty] = useState('');
  const [avgPrice, setAvgPrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');

  // MF
  const [units, setUnits] = useState('');
  const [avgNav, setAvgNav] = useState('');

  // FD
  const [bank, setBank] = useState('');
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [maturityDate, setMaturityDate] = useState('');
  const [interestType, setInterestType] = useState('Compound');

  // EPF
  const [accountType, setAccountType] = useState('EPF');
  const [currentBalance, setCurrentBalance] = useState('');
  const [employeeCont, setEmployeeCont] = useState('');
  const [employerCont, setEmployerCont] = useState('');

  // Gold
  const [goldType, setGoldType] = useState('SGB');
  const [goldQty, setGoldQty] = useState('');
  const [goldValue, setGoldValue] = useState('');

  // Real Estate
  const [propertyName, setPropertyName] = useState('');
  const [city, setCity] = useState('');
  const [purchaseValue, setPurchaseValue] = useState('');
  const [currentEst, setCurrentEst] = useState('');
  const [loanOut, setLoanOut] = useState('');
  const [emi, setEmi] = useState('');

  useEffect(() => {
    if (!searchQ || searchQ.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      if (tab === 'Mutual Fund') {
        fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(searchQ)}`)
          .then(res => res.json())
          .then(data => {
            const results = (data || []).slice(0, 8).map(d => ({
              schemeCode: d.schemeCode,
              schemeName: d.schemeName,
              name: d.schemeName,
              symbol: d.schemeCode,
              typeDisp: 'Mutual Fund',
            }));
            setSearchResults(results);
          })
          .catch(() => {
            fetch(`/api/market/search?q=${encodeURIComponent(searchQ)}&type=MUTUALFUND`)
              .then(res => res.json())
              .then(data => setSearchResults(data.results || []))
              .catch(console.error);
          });
      } else {
        fetch(`/api/market/search?q=${encodeURIComponent(searchQ)}`)
          .then(res => res.json())
          .then(data => setSearchResults(data.results || []))
          .catch(console.error);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQ, tab]);

  const handleSelectResult = async (r) => {
    setSearchResults([]);
    setLoading(true);
    setSearchQ(r.symbol || r.shortname || r.name);

    if (tab === 'Stock/ETF') {
      try {
        const res = await fetch(`/api/market/quote?symbols=${r.symbol}`);
        const data = await res.json();
        const q = data.quotes?.[0];
        const ltp = q?.price || 0;
        setSymbolData({
          symbol: r.symbol,
          name: q?.name || r.longname || r.shortname || r.symbol,
          ltp: ltp,
          changePct: q?.changePct || 0,
          exchange: r.exchDisp || 'NSE',
        });
        if (!avgPrice && ltp > 0) {
          setAvgPrice(ltp.toString());
        }
      } catch (err) {
        setSymbolData({
          symbol: r.symbol,
          name: r.longname || r.shortname || r.symbol,
          ltp: 0,
          exchange: r.exchDisp || 'NSE',
        });
      } finally {
        setLoading(false);
      }
    } else if (tab === 'Mutual Fund') {
      if (r.schemeCode) {
        try {
          const res = await fetch(`/api/market/nav/${r.schemeCode}`);
          const data = await res.json();
          const nav = data.data?.[0]?.nav || 0;
          setSymbolData({
            name: data.meta?.scheme_name || r.schemeName,
            ltp: nav,
            amc: data.meta?.fund_house || '',
            category: data.meta?.scheme_category || 'Equity',
          });
          if (!avgNav && nav > 0) setAvgNav(nav.toString());
        } catch {
          setSymbolData({ name: r.schemeName, ltp: 0 });
        } finally {
          setLoading(false);
        }
      } else {
        setSymbolData({ name: r.longname || r.shortname || r.symbol, ltp: 0 });
        setLoading(false);
      }
    }
  };

  const handleSave = async () => {
    let holding = null;
    let type = '';

    if (tab === 'Stock/ETF') {
      const livePrice = symbolData?.ltp || Number(avgPrice);
      const buyPrice = Number(avgPrice) || livePrice;
      const quantity = Number(qty) || 1;
      holding = {
        symbol: symbolData?.symbol || searchQ,
        name: symbolData?.name || searchQ,
        qty: quantity,
        avgCost: buyPrice,
        ltp: livePrice,
        value: quantity * livePrice,
        pnl: (quantity * livePrice) - (quantity * buyPrice),
        pnlPct: buyPrice > 0 ? (((livePrice - buyPrice) / buyPrice) * 100) : 0,
        holdingDays: purchaseDate ? Math.floor((Date.now() - new Date(purchaseDate).getTime())/(1000*3600*24)) : 0,
        taxType: purchaseDate ? (Math.floor((Date.now() - new Date(purchaseDate).getTime())/(1000*3600*24)) > 365 ? 'LTCG' : 'STCG') : 'STCG',
      };
      type = 'equities';
    } else if (tab === 'Mutual Fund') {
      const nav = Number(avgNav) || (symbolData?.ltp || 0);
      const u = Number(units) || 1;
      holding = {
        name: symbolData?.name || searchQ,
        units: u,
        nav: nav,
        value: u * nav,
        pnl: 0,
        pnlPct: 0,
        amc: symbolData?.amc || '',
        category: symbolData?.category || 'Equity',
        cagr3Y: 0,
        expenseRatio: 0,
        taxType: 'LTCG',
      };
      type = 'mutualFunds';
    } else if (tab === 'Fixed Deposit') {
      const p = Number(principal);
      const r = Number(rate);
      const days = maturityDate ? Math.floor((new Date(maturityDate).getTime() - Date.now())/(1000*3600*24)) : 0;
      holding = {
        bank,
        amount: p,
        rate: r,
        maturityDate,
        interest: p * (r / 100),
        daysRemaining: days,
        interestType
      };
      type = 'fixedDeposits';
    } else if (tab === 'EPF / PPF') {
      holding = {
        accountType,
        total: Number(currentBalance),
        employeeContribution: Number(employeeCont),
        employerContribution: Number(employerCont),
        interestEarned: 0,
        interestRate: 8.1,
        projectedAt60: Number(currentBalance) * 2
      };
      type = 'epf';
    } else if (tab === 'Gold') {
      holding = {
        name: `${goldType} Gold`,
        units: Number(goldQty),
        currentValue: Number(goldValue),
        issuePrice: 0,
        maturityDate: new Date().toISOString(),
        interestRate: 2.5
      };
      type = 'gold';
    } else if (tab === 'Real Estate') {
      holding = {
        name: propertyName,
        city,
        purchaseValue: Number(purchaseValue),
        currentEstimate: Number(currentEst),
        loanOutstanding: Number(loanOut),
        emiMonthly: Number(emi),
        equity: Number(currentEst) - Number(loanOut),
        rentalYield: 3,
      };
      type = 'realEstate';
    }

    if (!holding) return;

    // Map internal form key to AppContext holdings key
    const KEY_MAP = { stock: 'equities', mf: 'mutualFunds', fd: 'fixedDeposits', epf: 'epf', gold: 'gold', realEstate: 'realEstate' };
    const holdingsKey = KEY_MAP[type] || type;

    let newHoldings;
    if (holdingsKey === 'epf') {
      newHoldings = { ...state.consumer.holdings, epf: holding };
    } else {
      const arr = state.consumer.holdings[holdingsKey] || [];
      newHoldings = { ...state.consumer.holdings, [holdingsKey]: [...arr, holding] };
    }
    // UPDATE_HOLDINGS exists in the reducer and also recomputes netWorth + assetBreakdown
    dispatch({ type: 'UPDATE_HOLDINGS', payload: newHoldings });
    
    // Fire-and-forget — don't block UI on Firestore write
    try { persistHoldings().catch(() => {}); } catch {}
    
    // Toast
    const toast = document.createElement('div');
    toast.textContent = `✓ ${holding.name || holding.bank || tab} added to portfolio`;
    toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--green);color:#000;padding:10px 20px;border-radius:20px;z-index:9999;font-weight:700;box-shadow:0 4px 20px rgba(0,0,0,0.5);';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);

    if (onSave) onSave(holding);
  };

  return (
    <div style={{ padding: '1.5rem', background: 'var(--surface)', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
        <h2 className="text-h2" style={{ margin: 0 }}>Add Holding</h2>
        {onCancel && <button className="btn btn-ghost btn-icon" onClick={onCancel}><X size={20} /></button>}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setSymbolData(null); setSearchQ(''); setSearchResults([]); }}
            style={{
              padding: '0.5rem 1rem',
              background: tab === t ? 'var(--primary)' : 'var(--surface-raised)',
              border: 'none',
              borderRadius: 'var(--radius)',
              color: tab === t ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontWeight: tab === t ? 600 : 400,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {(tab === 'Stock/ETF' || tab === 'Mutual Fund') && (
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              Search {tab === 'Mutual Fund' ? 'Mutual Fund Scheme' : 'Stock or ETF (NSE / BSE / US)'}
            </label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                value={searchQ} 
                onChange={e => { setSearchQ(e.target.value); setSymbolData(null); }}
                style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.25rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                placeholder={tab === 'Mutual Fund' ? 'e.g. Parag Parikh Flexi Cap' : 'e.g. TCS, RELIANCE, INFY, AAPL'}
              />
              {searchResults.length > 0 && !symbolData && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', zIndex: 20, maxHeight: 220, overflowY: 'auto', borderRadius: 'var(--radius)', marginTop: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                  {searchResults.map((r, i) => (
                    <div 
                      key={i} 
                      onClick={() => handleSelectResult(r)}
                      style={{ padding: '0.6rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{r.symbol ? `${r.symbol} · ` : ''}{r.shortname || r.schemeName || r.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.longname || r.schemeName || r.exchDisp || ''}</div>
                      </div>
                      <span className="badge badge-surface" style={{ fontSize: '0.7rem' }}>{r.exchDisp || (r.schemeCode ? 'AMFI' : 'EQUITY')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {loading && (
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(99,102,241,0.08)', borderRadius: 'var(--radius)', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                ⏳ Fetching live Yahoo Finance market quote for <strong>{searchQ}</strong>…
              </div>
            )}

            {symbolData && (
              <div style={{ marginTop: '0.75rem', padding: '0.875rem', background: 'rgba(99,102,241,0.1)', borderRadius: 'var(--radius)', border: '1px solid rgba(99,102,241,0.25)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{symbolData.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {symbolData.symbol} · {symbolData.exchange || 'Live Market'}
                    </div>
                  </div>
                  {symbolData.ltp > 0 && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.2rem', color: 'var(--green)' }}>
                        ₹{symbolData.ltp.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Live {tab === 'Mutual Fund' ? 'NAV' : 'Yahoo Quote'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'Stock/ETF' && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Quantity (Shares)</label>
              <input type="number" placeholder="e.g. 25" value={qty} onChange={e => setQty(e.target.value)} style={{ width: '100%', padding: '0.6rem 1rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Average Buy Price (₹ per share)</label>
              <input type="number" placeholder="e.g. 2100" value={avgPrice} onChange={e => setAvgPrice(e.target.value)} style={{ width: '100%', padding: '0.6rem 1rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Purchase Date (Optional - for STCG/LTCG)</label>
              <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} style={{ width: '100%', padding: '0.6rem 1rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }} />
            </div>
          </>
        )}

        {tab === 'Mutual Fund' && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Units Held</label>
              <input type="number" placeholder="e.g. 150.5" value={units} onChange={e => setUnits(e.target.value)} style={{ width: '100%', padding: '0.6rem 1rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Average Purchase NAV (₹)</label>
              <input type="number" placeholder="e.g. 75" value={avgNav} onChange={e => setAvgNav(e.target.value)} style={{ width: '100%', padding: '0.6rem 1rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }} />
            </div>
          </>
        )}

        {tab === 'Fixed Deposit' && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Bank Name</label>
              <input type="text" value={bank} onChange={e => setBank(e.target.value)} style={{ width: '100%', padding: '0.6rem 1rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Principal Amount (₹)</label>
              <input type="number" value={principal} onChange={e => setPrincipal(e.target.value)} style={{ width: '100%', padding: '0.6rem 1rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Interest Rate (% p.a.)</label>
              <input type="number" step="0.1" value={rate} onChange={e => setRate(e.target.value)} style={{ width: '100%', padding: '0.6rem 1rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: '100%', padding: '0.6rem 1rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Maturity Date</label>
              <input type="date" value={maturityDate} onChange={e => setMaturityDate(e.target.value)} style={{ width: '100%', padding: '0.6rem 1rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Interest Type</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label><input type="radio" name="intType" checked={interestType === 'Simple'} onChange={() => setInterestType('Simple')} /> Simple</label>
                <label><input type="radio" name="intType" checked={interestType === 'Compound'} onChange={() => setInterestType('Compound')} /> Compound</label>
              </div>
            </div>
            {principal && rate && (
              <div style={{ padding: '0.75rem', background: 'rgba(16,185,129,0.1)', color: 'var(--green)', borderRadius: 'var(--radius)' }}>
                Estimated Maturity: ₹{(Number(principal) * (1 + Number(rate)/100)).toFixed(0)}
              </div>
            )}
          </>
        )}

        {tab === 'EPF / PPF' && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Account Type</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label><input type="radio" name="accType" checked={accountType === 'EPF'} onChange={() => setAccountType('EPF')} /> EPF</label>
                <label><input type="radio" name="accType" checked={accountType === 'PPF'} onChange={() => setAccountType('PPF')} /> PPF</label>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Current Balance (₹)</label>
              <input type="number" value={currentBalance} onChange={e => setCurrentBalance(e.target.value)} style={{ width: '100%', padding: '0.6rem 1rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Employee Contribution (₹, optional)</label>
              <input type="number" value={employeeCont} onChange={e => setEmployeeCont(e.target.value)} style={{ width: '100%', padding: '0.6rem 1rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Employer Contribution (₹, optional)</label>
              <input type="number" value={employerCont} onChange={e => setEmployerCont(e.target.value)} style={{ width: '100%', padding: '0.6rem 1rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }} />
            </div>
          </>
        )}

        {tab === 'Gold' && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Type</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label><input type="radio" name="gType" checked={goldType === 'SGB'} onChange={() => setGoldType('SGB')} /> SGB</label>
                <label><input type="radio" name="gType" checked={goldType === 'Physical'} onChange={() => setGoldType('Physical')} /> Physical</label>
                <label><input type="radio" name="gType" checked={goldType === 'Digital Gold'} onChange={() => setGoldType('Digital Gold')} /> Digital</label>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Quantity/Weight</label>
              <input type="text" value={goldQty} onChange={e => setGoldQty(e.target.value)} style={{ width: '100%', padding: '0.6rem 1rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Current Value (₹)</label>
              <input type="number" value={goldValue} onChange={e => setGoldValue(e.target.value)} style={{ width: '100%', padding: '0.6rem 1rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }} />
            </div>
          </>
        )}

        {tab === 'Real Estate' && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Property Name</label>
              <input type="text" value={propertyName} onChange={e => setPropertyName(e.target.value)} style={{ width: '100%', padding: '0.6rem 1rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>City</label>
              <input type="text" value={city} onChange={e => setCity(e.target.value)} style={{ width: '100%', padding: '0.6rem 1rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Purchase Value (₹)</label>
              <input type="number" value={purchaseValue} onChange={e => setPurchaseValue(e.target.value)} style={{ width: '100%', padding: '0.6rem 1rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Current Estimated Value (₹)</label>
              <input type="number" value={currentEst} onChange={e => setCurrentEst(e.target.value)} style={{ width: '100%', padding: '0.6rem 1rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Loan Outstanding (₹, optional)</label>
              <input type="number" value={loanOut} onChange={e => setLoanOut(e.target.value)} style={{ width: '100%', padding: '0.6rem 1rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>EMI (₹/month, optional)</label>
              <input type="number" value={emi} onChange={e => setEmi(e.target.value)} style={{ width: '100%', padding: '0.6rem 1rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }} />
            </div>
          </>
        )}

        <button 
          onClick={handleSave}
          style={{ width: '100%', padding: '0.875rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600, marginTop: '1rem', cursor: 'pointer' }}
        >
          Save Holding
        </button>
      </div>
    </div>
  );
}
