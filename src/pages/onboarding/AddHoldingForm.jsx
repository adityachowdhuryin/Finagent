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
    if (!searchQ) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/market/search?q=${searchQ}${tab === 'Mutual Fund' ? '&type=MUTUALFUND' : ''}`)
        .then(res => res.json())
        .then(data => setSearchResults(data.results || []))
        .catch(console.error);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQ, tab]);

  const handleSave = async () => {
    let holding = null;
    let type = '';

    if (tab === 'Stock/ETF') {
      holding = {
        symbol: symbolData?.symbol || searchQ,
        name: symbolData?.name || searchQ,
        qty: Number(qty),
        avgCost: Number(avgPrice),
        ltp: symbolData?.ltp || Number(avgPrice),
        value: Number(qty) * (symbolData?.ltp || Number(avgPrice)),
        pnl: (Number(qty) * (symbolData?.ltp || Number(avgPrice))) - (Number(qty) * Number(avgPrice)),
        pnlPct: (((symbolData?.ltp || Number(avgPrice)) - Number(avgPrice)) / Number(avgPrice)) * 100,
        holdingDays: purchaseDate ? Math.floor((Date.now() - new Date(purchaseDate).getTime())/(1000*3600*24)) : 0,
        taxType: purchaseDate ? (Math.floor((Date.now() - new Date(purchaseDate).getTime())/(1000*3600*24)) > 365 ? 'LTCG' : 'STCG') : 'STCG',
      };
      type = 'equities';
    } else if (tab === 'Mutual Fund') {
      holding = {
        name: symbolData?.name || searchQ,
        units: Number(units),
        nav: Number(avgNav) || (symbolData?.ltp || 0),
        value: Number(units) * (Number(avgNav) || (symbolData?.ltp || 0)),
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
    toast.textContent = `✓ ${holding.name || holding.bank || tab} added`;
    toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--green);color:#000;padding:8px 16px;border-radius:20px;z-index:9999;font-weight:600;';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);

    if (onSave) onSave(holding);
  };

  return (
    <div style={{ padding: '1.5rem', background: 'var(--surface)', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2 className="text-h2">Add Holding</h2>
        {onCancel && <button className="btn btn-ghost btn-icon" onClick={onCancel}><X size={20} /></button>}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
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
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Search {tab === 'Mutual Fund' ? 'Scheme Name' : 'Symbol'}</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                value={searchQ} 
                onChange={e => { setSearchQ(e.target.value); setSymbolData(null); }}
                style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.25rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}
                placeholder={tab === 'Mutual Fund' ? 'e.g. Parag Parikh Flexi Cap' : 'e.g. RELIANCE'}
              />
              {searchResults.length > 0 && !symbolData && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', zIndex: 10, maxHeight: 200, overflowY: 'auto', borderRadius: 'var(--radius)', marginTop: 4 }}>
                  {searchResults.map((r, i) => (
                    <div 
                      key={i} 
                      onClick={() => { setSymbolData(r); setSearchQ(r.symbol || r.name); setSearchResults([]); }}
                      style={{ padding: '0.5rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--glass-border)' }}
                    >
                      <div style={{ fontWeight: 600 }}>{r.symbol || r.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.exchange || r.amc} • ₹{r.ltp}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {symbolData && (
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(99,102,241,0.1)', borderRadius: 'var(--radius)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <div style={{ fontWeight: 600, color: 'var(--primary-light)' }}>{symbolData.name}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Last Price: ₹{symbolData.ltp}</div>
              </div>
            )}
          </div>
        )}

        {tab === 'Stock/ETF' && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Quantity</label>
              <input type="number" value={qty} onChange={e => setQty(e.target.value)} style={{ width: '100%', padding: '0.6rem 1rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Average Buy Price (₹)</label>
              <input type="number" value={avgPrice} onChange={e => setAvgPrice(e.target.value)} style={{ width: '100%', padding: '0.6rem 1rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Purchase Date (Optional)</label>
              <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} style={{ width: '100%', padding: '0.6rem 1rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }} />
            </div>
          </>
        )}

        {tab === 'Mutual Fund' && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Units Held</label>
              <input type="number" value={units} onChange={e => setUnits(e.target.value)} style={{ width: '100%', padding: '0.6rem 1rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Average NAV (₹, optional)</label>
              <input type="number" value={avgNav} onChange={e => setAvgNav(e.target.value)} style={{ width: '100%', padding: '0.6rem 1rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }} />
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
