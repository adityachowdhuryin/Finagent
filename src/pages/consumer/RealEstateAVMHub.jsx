import React, { useState, useEffect } from 'react';
import {
  Home, TrendingUp, DollarSign, ShieldCheck, MapPin,
  RefreshCw, CheckCircle2, ChevronRight, Activity, Percent
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';

export default function RealEstateAVMHub() {
  const { state } = useApp();
  const market = state.market || 'US';
  const isUS = market === 'US';
  const currencySymbol = isUS ? '$' : '₹';

  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState(isUS ? '1482 Sunnyvale Saratoga Rd, Sunnyvale, CA 94087' : 'Flat 402, Adarsh Palm Retreat, Bellandur, Bangalore 560103');
  const [metro, setMetro] = useState(isUS ? 'Bay Area, CA' : 'Bangalore (Indiranagar / ORR)');
  const [sqft, setSqft] = useState(isUS ? 1850 : 1650);
  const [beds, setBeds] = useState(3);
  const [baths, setBaths] = useState(2);
  const [currentMortgage, setCurrentMortgage] = useState(isUS ? 880000 : 7200000);
  const [interestRate, setInterestRate] = useState(isUS ? 3.25 : 8.5);
  const [monthlyRent, setMonthlyRent] = useState(isUS ? 4800 : 65000);

  const [avmData, setAvmData] = useState(null);

  async function fetchAVMEstimate() {
    setLoading(true);
    try {
      const res = await fetch('/api/real-estate-avm/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market,
          address,
          metro,
          sqft: Number(sqft),
          beds: Number(beds),
          baths: Number(baths),
          currentMortgageBalance: Number(currentMortgage),
          interestRate: Number(interestRate),
          monthlyRent: Number(monthlyRent)
        })
      });
      const data = await res.json();
      if (data.success) {
        setAvmData(data);
      }
    } catch (err) {
      console.error('Failed to fetch AVM estimate:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setAddress(isUS ? '1482 Sunnyvale Saratoga Rd, Sunnyvale, CA 94087' : 'Flat 402, Adarsh Palm Retreat, Bellandur, Bangalore 560103');
    setMetro(isUS ? 'Bay Area, CA' : 'Bangalore (Indiranagar / ORR)');
    setCurrentMortgage(isUS ? 880000 : 7200000);
    setMonthlyRent(isUS ? 4800 : 65000);
    fetchAVMEstimate();
  }, [market]);

  const avm = avmData?.avm || {};
  const cashflow = avmData?.cashflow || {};
  const taxShelter = avmData?.taxShelter || {};

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 className="text-h1">Real Estate Automated Valuation Model (AVM)</h1>
            <span className="badge badge-primary">🏘️ Metro Price/SqFt Engine</span>
          </div>
          <p className="text-sm text-secondary mt-1">
            Institutional property appraisal, net home equity tracking, rental cashflow yield, and Section 1031 / Section 54 tax shelters.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={fetchAVMEstimate}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Recalculate AVM
        </button>
      </div>

      {/* Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ background: 'var(--surface-raised)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated Property Value</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--primary)' }}>
            {formatCurrency(avm.estimatedValue || (isUS ? 1924000 : 20625000), false, market)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--green)' }}>
            Growth: {avm.annualMetroGrowth || '5.2%'} YoY
          </div>
        </div>

        <div className="card" style={{ background: 'var(--surface-raised)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Net Home Equity</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--green)' }}>
            {formatCurrency(avm.homeEquity || (isUS ? 1044000 : 13425000), false, market)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Current LTV: {avm.loanToValue ?? '45.7'}%
          </div>
        </div>

        <div className="card" style={{ background: 'var(--surface-raised)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gross Rental Yield</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--gold)' }}>
            {cashflow.grossRentalYield || (isUS ? '4.1%' : '3.8%')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Cap Rate: {cashflow.capRate || '3.5%'}
          </div>
        </div>

        <div className="card" style={{ background: 'var(--surface-raised)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Monthly Net Cash Flow</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.2rem', color: (cashflow.netMonthlyCashflow ?? 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {formatCurrency(cashflow.netMonthlyCashflow || (isUS ? 420 : 8500), false, market)}/mo
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            After PITI, taxes & HOA
          </div>
        </div>
      </div>

      {/* Main Grid: Left Property Form, Right AVM Breakdown & Tax Shelter */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(360px, 1.3fr)', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left: Input Form */}
        <div className="card">
          <h3 className="text-h3" style={{ marginBottom: '1rem' }}>Property Valuation Inputs</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Property Address</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '0.6rem 0.8rem', border: '1px solid var(--glass-border)' }}>
                <MapPin size={16} color="var(--primary)" />
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Metro Region</label>
                <select
                  value={metro}
                  onChange={e => setMetro(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', background: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                >
                  {isUS ? (
                    <>
                      <option value="Bay Area, CA">Bay Area, CA ($1,040/sqft)</option>
                      <option value="New York, NY">New York, NY ($1,220/sqft)</option>
                      <option value="Seattle, WA">Seattle, WA ($680/sqft)</option>
                      <option value="Austin, TX">Austin, TX ($420/sqft)</option>
                      <option value="Los Angeles, CA">Los Angeles, CA ($840/sqft)</option>
                    </>
                  ) : (
                    <>
                      <option value="Bangalore (Indiranagar / ORR)">Bangalore (ORR) (₹12,500/sqft)</option>
                      <option value="Mumbai (BKC / South)">Mumbai (BKC) (₹42,000/sqft)</option>
                      <option value="Gurgaon (Golf Course Road)">Gurgaon (₹16,500/sqft)</option>
                      <option value="Hyderabad (Hitec City)">Hyderabad (₹8,500/sqft)</option>
                      <option value="Pune (Koregaon Park / Hinjewadi)">Pune (₹7,800/sqft)</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Square Footage (Sq.Ft)</label>
                <input
                  type="number"
                  value={sqft}
                  onChange={e => setSqft(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', background: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Current Mortgage Balance ({currencySymbol})</label>
                <input
                  type="number"
                  value={currentMortgage}
                  onChange={e => setCurrentMortgage(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', background: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Monthly Rent Collected ({currencySymbol})</label>
                <input
                  type="number"
                  value={monthlyRent}
                  onChange={e => setMonthlyRent(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', background: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={fetchAVMEstimate}
              style={{ marginTop: '0.5rem', fontWeight: 700 }}
            >
              ⚡ Run Valuation & Cashflow Engine
            </button>
          </div>
        </div>

        {/* Right: Cashflow Breakdown & Tax Shield */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <h3 className="text-h3" style={{ marginBottom: '0.85rem' }}>Monthly Cashflow & Operating Expenses</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                <span className="text-muted">Gross Monthly Rental Revenue:</span>
                <span className="font-bold" style={{ color: 'var(--green)' }}>+{formatCurrency(cashflow.monthlyRent || 4800, false, market)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                <span className="text-muted">Mortgage Principal & Interest:</span>
                <span className="font-bold">-{formatCurrency(cashflow.monthlyMortgagePI || 3820, false, market)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                <span className="text-muted">Property Taxes & Insurance:</span>
                <span className="font-bold">-{formatCurrency((cashflow.monthlyTaxes || 450) + (cashflow.monthlyInsurance || 120), false, market)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.9rem', fontWeight: 700 }}>
                <span>Net Monthly Operating Cashflow:</span>
                <span style={{ color: (cashflow.netMonthlyCashflow ?? 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {formatCurrency(cashflow.netMonthlyCashflow || 410, false, market)}
                </span>
              </div>
            </div>
          </div>

          {/* Tax Shelter Card */}
          <div className="card" style={{ background: 'rgba(99,102,241,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <ShieldCheck size={18} color="var(--primary)" />
              <h3 className="text-h3">{taxShelter.rule || 'Capital Gains Tax Shield'}</h3>
            </div>
            <p className="text-xs text-secondary mb-2">
              Primary Exclusion: <strong>{taxShelter.primaryExclusionAvailable}</strong>
            </p>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
              💡 {taxShelter.recommendation}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
