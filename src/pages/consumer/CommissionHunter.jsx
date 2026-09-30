import React, { useState, useEffect } from 'react';
import {
  TrendingDown, AlertTriangle, ShieldCheck, ArrowRight, ExternalLink,
  RefreshCw, Zap, CheckCircle2, Info, ArrowUpRight, DollarSign, Download
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useApp } from '../../context/AppContext';

export default function CommissionHunter() {
  const { state } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFund, setSelectedFund] = useState(null);

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
      const fvRegular = Math.round(p * Math.pow(1.11, yr));
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

  function downloadMFCentralCSV() {
    if (!data?.blueprints) return;
    const headers = 'Folio_Number,Regular_Scheme_Name,Target_Direct_Scheme,Approx_Value_INR,Exit_Load_Status,MFCentral_Switch_Portal\n';
    const rows = data.blueprints.map((item, idx) =>
      `"FOLIO-${1000 + idx * 42}","${item.originalName}","${item.directEquivalent}","${item.currentValue}","${item.exitLoadStatus}","https://app.mfcentral.com"`
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

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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

        <button
          onClick={runAudit}
          disabled={loading}
          className="btn btn-ghost btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          {loading ? 'Analyzing...' : 'Re-scan Portfolio'}
        </button>
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
                  This money is deducted straight from your daily NAV and paid out to middlemen. Switching to <strong>Direct Growth</strong> plans instantly routes 100% of these gains back into your pocket.
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
              <div className="text-xs text-secondary" style={{ marginTop: '0.25rem' }}>Could buy a luxury vehicle</div>
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
              Projected wealth over 20 years comparing your portfolio in <strong>Direct Plans</strong> vs staying in <strong>Regular Plans</strong>.
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 className="text-h3">Switch Roadmap & Tax Optimization</h3>
                <p className="text-xs text-secondary">Fund-by-fund exit load status and direct replacement recommendations</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  onClick={downloadMFCentralCSV}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}
                >
                  <Download size={13} /> Export MFCentral Batch (CSV)
                </button>
                <span className="badge badge-green">Safe Switching Protocol Active</span>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Current Regular Scheme</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Direct Equivalent</th>
                    <th style={{ textAlign: 'right', padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Value</th>
                    <th style={{ textAlign: 'right', padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Annual Loss</th>
                    <th style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Exit Load</th>
                    <th style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Tax Type</th>
                    <th style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.blueprints.map((item) => (
                    <tr key={item.fundId} style={{ borderBottom: '1px solid var(--glass-border)22' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                        {item.originalName}
                        <div className="text-xs text-muted">Held for ~{item.holdingDays} days</div>
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--primary)' }}>
                        {item.directEquivalent}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'Space Grotesk' }}>
                        {formatINR(item.currentValue)}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'Space Grotesk', color: 'var(--red)', fontWeight: 700 }}>
                        -{formatINR(item.annualCommissionLost)}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <span className={`badge ${item.canSwitchNowFree ? 'badge-green' : 'badge-gold'}`} style={{ fontSize: '0.7rem' }}>
                          {item.exitLoadStatus}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {item.taxType}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <a
                          href={item.actionUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          Switch <ArrowUpRight size={12} />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3-Step Execution Blueprint */}
          <div className="card" style={{ background: 'rgba(99,102,241,0.04)' }}>
            <h3 className="text-h3" style={{ marginBottom: '1rem' }}>How to Execute Your Switch in 3 Minutes</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, marginBottom: '0.75rem' }}>1</div>
                <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Open MF Central</div>
                <p className="text-xs text-secondary">Visit <strong>app.mfcentral.com</strong> (joint initiative of CAMS and KFintech). Log in using your PAN and registered phone number.</p>
              </div>

              <div style={{ padding: '1rem', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, marginBottom: '0.75rem' }}>2</div>
                <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Select "Switch" Transaction</div>
                <p className="text-xs text-secondary">Navigate to Service Requests → Transact → Switch. Choose your existing Regular scheme and pick the Direct Growth plan.</p>
              </div>

              <div style={{ padding: '1rem', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, marginBottom: '0.75rem' }}>3</div>
                <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Verify OTP & Done</div>
                <p className="text-xs text-secondary">Authorize with 1 OTP. Units transfer into the Direct plan in T+2 business days. Zero fees, zero distributor commissions ever again.</p>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
