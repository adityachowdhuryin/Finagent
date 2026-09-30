import React, { useState, useEffect } from 'react';
import {
  Briefcase, TrendingUp, DollarSign, Layers, ShieldCheck,
  AlertTriangle, RefreshCw, ChevronRight, FileText, CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function PrivateEquityHub() {
  const { state } = useApp();
  const market = state.market || 'US';

  const [loading, setLoading] = useState(true);
  const [unicorns, setUnicorns] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);

  // Grant Form State
  const [grantType, setGrantType] = useState('ISO');
  const [totalShares, setTotalShares] = useState(10000);
  const [vestedShares, setVestedShares] = useState(4500);
  const [strikePrice, setStrikePrice] = useState(5.00);

  const [grantAnalysis, setGrantAnalysis] = useState(null);

  async function fetchDatabase() {
    setLoading(true);
    try {
      const res = await fetch('/api/private-equity/database');
      const data = await res.json();
      if (data.success) {
        setUnicorns(data.companies);
        setSelectedCompany(data.companies[0]);
        runGrantAnalysis(data.companies[0]);
      }
    } catch (err) {
      console.error('Failed to fetch PE database:', err);
    } finally {
      setLoading(false);
    }
  }

  async function runGrantAnalysis(company) {
    if (!company) return;
    try {
      const res = await fetch('/api/private-equity/analyze-grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: company.name,
          grantType,
          totalShares: Number(totalShares),
          vestedShares: Number(vestedShares),
          strikePrice: Number(strikePrice),
          current409A: company.latest409A,
          secondaryPrice: company.secondaryMarketPrice
        })
      });
      const data = await res.json();
      if (data.success) {
        setGrantAnalysis(data);
      }
    } catch (err) {
      console.error('Grant analysis failed:', err);
    }
  }

  useEffect(() => {
    fetchDatabase();
  }, []);

  function handleCompanySelect(comp) {
    setSelectedCompany(comp);
    runGrantAnalysis(comp);
  }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <h1 className="text-h1">Private Equity & Startup Cap Table Engine</h1>
          <span className="badge badge-gold">🦄 409A & Secondaries</span>
        </div>
        <p className="text-sm text-secondary mt-1">
          Track illiquid private stock, ISO/NSO strike prices, secondary market tender offers, and AMT tax liabilities before IPO.
        </p>
      </div>

      {/* Unicorn Market Watch Table */}
      <div className="card">
        <h3 className="text-h3" style={{ marginBottom: '0.75rem' }}>Pre-IPO Secondary Market Valuation Database</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                <th>Company</th>
                <th>Last Round Valuation</th>
                <th>Latest 409A Price</th>
                <th>Secondary Market Price</th>
                <th>Secondary Spread</th>
                <th>Liquidation Stack</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {unicorns.map(comp => (
                <tr
                  key={comp.id}
                  style={{
                    borderBottom: '1px solid var(--glass-border)',
                    background: selectedCompany?.id === comp.id ? 'rgba(99,102,241,0.08)' : 'transparent',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleCompanySelect(comp)}
                >
                  <td style={{ fontWeight: 700 }}>
                    {comp.name} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({comp.sector})</span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{comp.lastRoundValuation}</td>
                  <td>${comp.latest409A.toFixed(2)}</td>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>${comp.secondaryMarketPrice.toFixed(2)}</td>
                  <td>
                    <span className={`badge ${comp.secondaryDiscount.startsWith('+') ? 'badge-green' : 'badge-surface'}`}>
                      {comp.secondaryDiscount}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{comp.liquidationPreference}</td>
                  <td>
                    <button className="btn btn-ghost btn-xs" onClick={() => handleCompanySelect(comp)}>
                      Select
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grant Analyzer for Selected Company */}
      {selectedCompany && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(360px, 1.4fr)', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left: Input Form */}
          <div className="card">
            <h3 className="text-h3" style={{ marginBottom: '0.5rem' }}>
              Your Grant: {selectedCompany.name}
            </h3>
            <p className="text-xs text-secondary mb-3">Model exercise costs and tax liability</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Equity Grant Type</label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {['ISO', 'NSO', 'RSU'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setGrantType(t)}
                      className={`btn btn-sm ${grantType === t ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ flex: 1 }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Total Shares</label>
                  <input
                    type="number"
                    value={totalShares}
                    onChange={e => setTotalShares(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', background: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Vested Shares</label>
                  <input
                    type="number"
                    value={vestedShares}
                    onChange={e => setVestedShares(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', background: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.3rem' }}>Your Strike / Exercise Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={strikePrice}
                  onChange={e => setStrikePrice(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', background: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                />
              </div>

              <button
                className="btn btn-primary"
                onClick={() => runGrantAnalysis(selectedCompany)}
                style={{ marginTop: '0.5rem', fontWeight: 700 }}
              >
                ⚡ Recalculate Net Equity & Tax Liability
              </button>
            </div>
          </div>

          {/* Right: Grant Valuation & Exit Waterfall */}
          <div className="card">
            <h3 className="text-h3" style={{ marginBottom: '1rem' }}>Grant Net Worth & Exit Waterfall</h3>

            {grantAnalysis && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div style={{ background: 'var(--surface-raised)', padding: '0.85rem', borderRadius: 'var(--radius)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gross Vested Value</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', marginTop: 2 }}>
                      ${(grantAnalysis.grantSummary.vestedGrossValue).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ background: 'var(--surface-raised)', padding: '0.85rem', borderRadius: 'var(--radius)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated AMT Tax on Exercise</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--red)', marginTop: 2 }}>
                      ${(grantAnalysis.grantSummary.estimatedAmtTax).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Tax Recommendation Banner */}
                <div style={{ padding: '0.85rem', background: 'rgba(99,102,241,0.06)', borderRadius: 'var(--radius)', fontSize: '0.85rem' }}>
                  💡 <strong>Tax Strategy:</strong> {grantAnalysis.taxRecommendation}
                </div>

                {/* Exit Scenarios Table */}
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    Potential IPO / Acquisition Exit Waterfall
                  </div>
                  <table className="data-table" style={{ width: '100%', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                        <th>Scenario</th>
                        <th>Exit Valuation</th>
                        <th>Share Price</th>
                        <th>Estimated Net Take-Home</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grantAnalysis.exitScenarios.map(s => (
                        <tr key={s.multiplier} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                          <td style={{ fontWeight: 600 }}>{s.multiplier}</td>
                          <td>{s.exitValuation}</td>
                          <td>${s.sharePrice}</td>
                          <td style={{ fontWeight: 700, color: 'var(--green)' }}>${s.netTakeHome.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
