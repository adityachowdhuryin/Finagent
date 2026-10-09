import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart2, Info, Trophy, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Skeleton } from '../../components/ui/Skeleton';
import { absoluteReturn, cagr, formatReturn, returnColor } from '../../utils/returns';

// ── Category benchmark baselines ─────────────────────────────────────────────
const CATEGORY_BENCHMARKS = {
  'Large Cap': { '1Y': 14.2, '3Y': 12.8, '5Y': 14.1 },
  'Mid Cap': { '1Y': 22.4, '3Y': 18.6, '5Y': 20.3 },
  'Small Cap': { '1Y': 28.1, '3Y': 22.4, '5Y': 24.7 },
  'Flexi Cap': { '1Y': 18.3, '3Y': 15.2, '5Y': 16.8 },
  'ELSS': { '1Y': 16.8, '3Y': 14.1, '5Y': 15.9 },
  'Debt': { '1Y': 7.2, '3Y': 6.8, '5Y': 7.1 },
  'Hybrid': { '1Y': 12.4, '3Y': 10.8, '5Y': 12.1 },
  'Index': { '1Y': 13.8, '3Y': 12.2, '5Y': 13.5 },
};

function getCategoryBenchmark(category, periodYears) {
  const periodKey = periodYears <= 1 ? '1Y' : periodYears <= 3 ? '3Y' : '5Y';
  for (const [key, benchmarks] of Object.entries(CATEGORY_BENCHMARKS)) {
    if ((category || '').toLowerCase().includes(key.toLowerCase())) {
      return benchmarks[periodKey];
    }
  }
  return CATEGORY_BENCHMARKS['Large Cap'][periodKey];
}

export default function PerformanceAnalytics() {
  const { state } = useApp();
  const [period, setPeriod] = useState('1Y');
  const [benchmarks, setBenchmarks] = useState(null);
  const [fundBenchmarks, setFundBenchmarks] = useState({});
  const [loadingBenchmarks, setLoadingBenchmarks] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/market/benchmark-history?period=${period}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.returns) {
          setBenchmarks(data.returns);
        } else {
          setBenchmarks({ nifty50: 14.2, sensex: 13.8, midcap: 18.4, smallcap: 21.2, fd: 7.1, inflation: 5.0 });
        }
      })
      .catch(() => {
        setBenchmarks({ nifty50: 14.2, sensex: 13.8, midcap: 18.4, smallcap: 21.2, fd: 7.1, inflation: 5.0 });
      });
  }, [period]);

  // holdings is a structured object: { equities, mutualFunds, fixedDeposits, epf, gold, realEstate }
  const holdingsObj = state.consumer?.holdings || {};

  // ── MFAPI fund benchmark fetch ────────────────────────────────────────────
  useEffect(() => {
    const mfHoldings = holdingsObj.mutualFunds || [];
    if (mfHoldings.length === 0) return;

    setLoadingBenchmarks(true);

    const MFAPI_CACHE_KEY = 'finagent_mfapi_cache';
    let cache = {};
    try { cache = JSON.parse(localStorage.getItem(MFAPI_CACHE_KEY) || '{}'); } catch {}

    const today = new Date().toDateString();

    async function fetchFundData(mf) {
      const cacheKey = (mf.name || mf.scheme || '').slice(0, 30);
      if (cache[cacheKey] && cache[cacheKey].date === today) return { name: mf.name, ...cache[cacheKey] };

      try {
        const searchRes = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent((mf.name || '').slice(0, 25))}`);
        const schemes = await searchRes.json();
        if (!schemes || schemes.length === 0) return null;

        const schemeCode = schemes[0].schemeCode;
        const navRes = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
        const navData = await navRes.json();

        if (!navData.data || navData.data.length < 10) return null;

        const latest = parseFloat(navData.data[0].nav);
        const oneYearAgo = navData.data.find((d, i) => i >= 250 && i <= 260);
        const threeYearAgo = navData.data.find((d, i) => i >= 750 && i <= 760);

        const return1Y = oneYearAgo ? ((latest - parseFloat(oneYearAgo.nav)) / parseFloat(oneYearAgo.nav)) * 100 : null;
        const return3Y = threeYearAgo ? (Math.pow(latest / parseFloat(threeYearAgo.nav), 1 / 3) - 1) * 100 : null;

        const result = {
          date: today,
          schemeCode,
          schemeName: navData.meta?.scheme_name,
          category: navData.meta?.scheme_category || mf.category || 'Large Cap',
          latestNAV: latest,
          return1Y: return1Y ? Math.round(return1Y * 10) / 10 : null,
          return3Y: return3Y ? Math.round(return3Y * 10) / 10 : null,
        };

        cache[cacheKey] = result;
        localStorage.setItem(MFAPI_CACHE_KEY, JSON.stringify(cache));
        return { name: mf.name, ...result };
      } catch {
        return null;
      }
    }

    (async () => {
      const results = {};
      for (const mf of mfHoldings) {
        const data = await fetchFundData(mf);
        if (data) results[mf.name] = data;
        await new Promise(r => setTimeout(r, 500));
      }
      setFundBenchmarks(results);
      setLoadingBenchmarks(false);
    })();
  }, [period]);

  // Flatten into a tagged array for computation
  const flatHoldings = [
    ...(holdingsObj.equities || []).map(h => ({ ...h, type: 'EQUITY' })),
    ...(holdingsObj.mutualFunds || []).map(h => ({ ...h, type: 'MF' })),
    ...(holdingsObj.fixedDeposits || []).map(h => ({ ...h, type: 'FD' })),
  ];

  let totalInvested = 0;
  let totalCurrent = 0;
  const holdingStats = [];

  flatHoldings.forEach(h => {
    let invested = 0;
    let current = 0;
    let days = h.holdingDays || 365;

    if (h.type === 'EQUITY') {
      invested = (h.avgBuy || h.avgCost || 0) * (h.qty || h.quantity || 0);
      current = (h.ltp || h.currentPrice || 0) * (h.qty || h.quantity || 0);
    } else if (h.type === 'MF') {
      invested = h.invested || (h.units * (h.avgNav || h.nav) || 0);
      current = h.value || (h.units * h.nav) || 0;
    } else if (h.type === 'FD') {
      invested = h.principal || h.invested || 0;
      current = h.maturityAmount || h.principal || 0;
    }

    if (invested > 0) {
      totalInvested += invested;
      totalCurrent += current;

      const ret = absoluteReturn(invested, current);
      const yrs = days / 365.25;
      const cagrVal = yrs > 0 ? cagr(invested, current, yrs) : 0;

      holdingStats.push({
        ...h,
        invested,
        current,
        returnPct: ret,
        cagr: cagrVal,
        years: yrs
      });
    }
  });

  const portfolioReturn = absoluteReturn(totalInvested, totalCurrent);

  // Sort by return
  holdingStats.sort((a, b) => b.returnPct - a.returnPct);

  const bestHoldings = holdingStats.slice(0, 3);
  const worstHoldings = [...holdingStats].sort((a, b) => a.returnPct - b.returnPct).slice(0, 3);

  const benchmarkData = benchmarks ? [
    { name: 'Portfolio (You)', value: portfolioReturn, color: 'var(--primary)' },
    { name: 'Nifty 50', value: benchmarks.nifty50, color: '#0052FF' },
    { name: 'Sensex', value: benchmarks.sensex, color: '#FF9900' },
    { name: 'Nifty Midcap 150', value: benchmarks.midcap, color: '#00A86B' },
    { name: 'Nifty Smallcap 250', value: benchmarks.smallcap, color: '#8A2BE2' },
    { name: 'FD', value: benchmarks.fd, color: '#888888' },
    { name: 'Inflation', value: benchmarks.inflation, color: '#FF0000' }
  ] : [];

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>Portfolio Performance</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Analyze your returns vs market benchmarks</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--surface)', padding: '0.25rem', borderRadius: '8px' }}>
          {['1M', '3M', '6M', '1Y'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                background: period === p ? 'var(--primary)' : 'transparent',
                color: period === p ? 'white' : 'var(--text)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: period === p ? '600' : '400'
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart2 size={20} />
          Returns vs Benchmarks ({period})
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', fontWeight: 'bold', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <div style={{ width: '150px' }}>Benchmark</div>
            <div style={{ flex: 1 }}>Return %</div>
            <div style={{ width: '80px', textAlign: 'right' }}>Value</div>
            <div style={{ width: '80px', textAlign: 'right' }}>vs Portfolio</div>
          </div>
          {benchmarkData.map(b => (
            <div key={b.name} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '150px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: b.color }}></div>
                <span style={{ fontSize: '0.9rem' }}>{b.name}</span>
              </div>
              <div style={{ flex: 1, background: 'var(--bg)', height: '24px', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: 0, top: 0, bottom: 0,
                  width: `${Math.min(Math.max(b.value, 0), 100)}%`,
                  background: b.color,
                  opacity: 0.8
                }}></div>
              </div>
              <div style={{ width: '80px', textAlign: 'right', fontWeight: 'bold' }}>
                {b.value?.toFixed(2)}%
              </div>
              <div style={{ width: '80px', textAlign: 'right', fontSize: '0.9rem', color: b.name === 'Portfolio (You)' ? 'transparent' : returnColor(portfolioReturn - b.value) }}>
                {b.name !== 'Portfolio (You)' && formatReturn(portfolioReturn - b.value)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ margin: '0 0 1.5rem 0' }}>Holding-Level Returns</h3>
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '1rem' }}>Name</th>
              <th style={{ padding: '1rem' }}>Type</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Invested</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Current Value</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Return %</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>CAGR</th>
              <th style={{ padding: '1rem' }}>Period</th>
            </tr>
          </thead>
          <tbody>
            {holdingStats.map((h, i) => (
              <tr key={h.symbol || h.name || i} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {i === 0 && <Trophy size={16} color="var(--primary)" />}
                  {i === holdingStats.length - 1 && holdingStats.length > 1 && <AlertTriangle size={16} color="var(--red)" />}
                  {h.name || h.symbol}
                </td>
                <td style={{ padding: '1rem' }}>{h.type}</td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>₹{h.invested?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>₹{h.current?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                <td style={{ padding: '1rem', textAlign: 'right', color: returnColor(h.returnPct), fontWeight: 'bold' }}>
                  {formatReturn(h.returnPct)}
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>{h.cagr?.toFixed(2)}%</td>
                <td style={{ padding: '1rem' }}>{h.years?.toFixed(1)} Yrs</td>
              </tr>
            ))}
            {holdingStats.length === 0 && (
              <tr>
                <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No holdings found in portfolio.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* ── Fund vs Category Benchmark ──────────────────────────────────────── */}
      {(holdingsObj.mutualFunds || []).length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className="text-h2">Mutual Fund vs Category Benchmark</h2>
            {loadingBenchmarks && <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Fetching live data...</span>}
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fund</th>
                  <th>Category</th>
                  <th>Your XIRR</th>
                  <th>1Y Return (Live)</th>
                  <th>Category Avg</th>
                  <th>Delta</th>
                </tr>
              </thead>
              <tbody>
                {(holdingsObj.mutualFunds || []).map((mf, i) => {
                  const benchmark = fundBenchmarks[mf.name];
                  const liveReturn = benchmark?.return1Y;
                  const categoryAvg = getCategoryBenchmark(benchmark?.category || mf.category, 1);
                  const yourReturn = mf.cagr3Y || mf.pnlPct || 0;
                  const delta = liveReturn != null ? liveReturn - categoryAvg : null;

                  return (
                    <tr key={i}>
                      <td style={{ maxWidth: 200 }}>
                        <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(mf.name || '').replace(' Direct Growth', '')}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{mf.amc}</div>
                      </td>
                      <td><span className="badge badge-surface">{benchmark?.category || mf.category || 'Equity'}</span></td>
                      <td style={{ fontWeight: 600, color: yourReturn >= 0 ? 'var(--green)' : 'var(--red)' }}>{yourReturn.toFixed(1)}%</td>
                      <td style={{ fontFamily: 'Space Grotesk' }}>
                        {liveReturn != null ? (
                          <span style={{ color: liveReturn >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>{liveReturn.toFixed(1)}%</span>
                        ) : loadingBenchmarks ? (
                          <Skeleton width="48px" height="1rem" />
                        ) : '—'}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{categoryAvg?.toFixed(1)}%</td>
                      <td>
                        {delta != null ? (
                          <span style={{ fontWeight: 700, color: delta >= 0 ? 'var(--green)' : 'var(--red)' }}>
                            {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
                          </span>
                        ) : loadingBenchmarks ? (
                          <Skeleton width="48px" height="1rem" />
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Live NAV data from MFAPI.in · Category averages are indicative</div>
        </div>
      )}

      {/* ── What if Nifty Index? ─────────────────────────────────────────────── */}
      {totalInvested > 0 && (
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.06), transparent)', marginBottom: '2rem' }}>
          <h3 className="text-h3" style={{ marginBottom: '0.75rem' }}>🤔 What if you had chosen a Nifty Index Fund?</h3>
          {(() => {
            const nifty1Y = 14.2;
            const hypotheticalValue = totalInvested * (1 + nifty1Y / 100);
            const actualValue = totalCurrent;
            const diff = actualValue - hypotheticalValue;
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Your Actual Portfolio</div>
                  <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.25rem' }}>₹{totalCurrent.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>If Nifty Index Only</div>
                  <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.25rem' }}>₹{Math.round(hypotheticalValue).toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Your Alpha</div>
                  <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.25rem', color: diff >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {diff >= 0 ? '+' : ''}₹{Math.abs(Math.round(diff)).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {holdingStats.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--green)' }}>Best Performing</h3>
            {bestHoldings.map(h => (
              <div key={h.symbol || h.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                <span>{h.name || h.symbol}</span>
                <span style={{ color: 'var(--green)', fontWeight: 'bold' }}>{formatReturn(h.returnPct)}</span>
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--red)' }}>Needs Attention</h3>
            {worstHoldings.map(h => (
              <div key={h.symbol || h.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                <span>{h.name || h.symbol}</span>
                <span style={{ color: 'var(--red)', fontWeight: 'bold' }}>{formatReturn(h.returnPct)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
