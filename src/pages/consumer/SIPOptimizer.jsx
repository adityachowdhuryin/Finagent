import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

const CACHE_KEY = 'finagent_sip_optimizer';
const CACHE_EXPIRY = 86400000 * 30; // 30 days

const ACTION_BADGE = {
  INCREASE: 'badge badge-green',
  DECREASE: 'badge badge-red',
  SWITCH: 'badge badge-gold',
  HOLD: 'badge badge-surface',
};

export default function SIPOptimizer() {
  const { state } = useApp();
  const navigate = useNavigate();

  const [marketData, setMarketData] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMarket, setLoadingMarket] = useState(true);
  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // ── Mount: load cache + fetch fresh market data ─────────────────────────────
  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      if (cached.recommendations && Date.now() - (cached.timestamp || 0) < CACHE_EXPIRY) {
        setRecommendations(cached.recommendations);
      }
    } catch {}

    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/sip-optimizer/market`)
      .then((r) => r.json())
      .then((data) => setMarketData(data))
      .catch(() =>
        setMarketData({ niftyPE: 22.4, repoRate: 6.5, marketSignal: 'FAIR', source: 'fallback' })
      )
      .finally(() => setLoadingMarket(false));
  }, []);

  // ── Generate AI recommendations ─────────────────────────────────────────────
  async function generateRecommendations() {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/sip-optimizer/recommend`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mutualFunds: state.consumer.holdings.mutualFunds || [],
            marketData,
            userProfile: state.consumer.user,
          }),
        }
      );
      const data = await res.json();
      setRecommendations(data);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ recommendations: data, timestamp: Date.now() }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // ── Email plan ───────────────────────────────────────────────────────────────
  async function sendEmail() {
    if (!recommendations?.emailHtml) return;
    setSendingEmail(true);
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: state.consumer?.user?.email,
          subject: `📈 Your ${new Date().toLocaleString('en-IN', { month: 'long' })} SIP Plan — FinAgent`,
          html: recommendations.emailHtml,
        }),
      });
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 4000);
    } catch {}
    setSendingEmail(false);
  }

  const mutualFunds = state.consumer?.holdings?.mutualFunds || [];
  const hasFunds = mutualFunds.length > 0;

  // ── Signal helpers ───────────────────────────────────────────────────────────
  const peColor = !marketData
    ? 'var(--text-muted)'
    : marketData.niftyPE < 18
    ? 'var(--green)'
    : marketData.niftyPE > 24
    ? 'var(--red)'
    : 'var(--gold)';

  const signalColor = !marketData
    ? 'var(--text-muted)'
    : marketData.marketSignal === 'CHEAP'
    ? 'var(--green)'
    : marketData.marketSignal === 'EXPENSIVE'
    ? 'var(--red)'
    : 'var(--gold)';

  const signalLabel = loadingMarket
    ? '...'
    : marketData?.marketSignal === 'CHEAP'
    ? '🟢 Cheap'
    : marketData?.marketSignal === 'EXPENSIVE'
    ? '🔴 Expensive'
    : '🟡 Fair Value';

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="page-enter" style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 className="text-h1" style={{ marginBottom: '0.4rem' }}>
          📈 SIP Optimizer
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: 560 }}>
          AI-powered monthly SIP adjustments based on live market valuations and your portfolio.
          Refresh every month for data-driven tweaks.
        </p>
      </div>

      {/* Market Pulse Card */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(99,102,241,0.03))',
          marginBottom: '1.25rem',
        }}
      >
        <h2 className="text-h2" style={{ marginBottom: '1rem' }}>📊 Market Pulse</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
          {/* Nifty P/E */}
          <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              Nifty 50 P/E
            </div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '2.5rem', fontWeight: 800, color: peColor, lineHeight: 1 }}>
              {loadingMarket ? '...' : marketData?.niftyPE?.toFixed(1)}
            </div>
          </div>

          {/* Repo Rate */}
          <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              RBI Repo Rate
            </div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              {loadingMarket ? '...' : `${marketData?.repoRate}%`}
            </div>
          </div>

          {/* Market Signal */}
          <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              Market Signal
            </div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.25rem', fontWeight: 800, color: signalColor, marginTop: 8 }}>
              {signalLabel}
            </div>
          </div>

          {/* Data Source */}
          <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              Data Source
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: 8 }}>
              {marketData?.source === 'live' ? '✅ Live' : '📋 Reference'}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {marketData?.lastUpdated}
            </div>
          </div>
        </div>

        {/* CTA buttons */}
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={generateRecommendations}
            disabled={loading || loadingMarket || !hasFunds}
          >
            {loading ? '⏳ Generating...' : "🤖 Generate This Month's SIP Plan"}
          </button>

          {recommendations && (
            emailSent
              ? <span style={{ color: 'var(--green)', fontWeight: 600 }}>✓ Emailed!</span>
              : (
                <button className="btn btn-ghost" onClick={sendEmail} disabled={sendingEmail}>
                  {sendingEmail ? 'Sending...' : '📧 Email Me This Plan'}
                </button>
              )
          )}
        </div>
      </div>

      {/* Overall Strategy + Top Insight */}
      {recommendations?.overallStrategy && (
        <div
          className="card"
          style={{ background: 'rgba(99,102,241,0.06)', borderLeft: '3px solid var(--primary)', marginBottom: '1.25rem' }}
        >
          <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>
            💡 {recommendations.topInsight}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {recommendations.overallStrategy}
          </div>
        </div>
      )}

      {/* Recommendations Table */}
      {recommendations?.recommendations?.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '1.25rem' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
            <h3 className="text-h3" style={{ margin: 0 }}>Fund-by-Fund Recommendations</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {['Fund', 'Category', 'Current Est. SIP', 'Recommended SIP', 'Action', 'Reason'].map((h) => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recommendations.recommendations.map((rec, i) => {
                  const delta = (rec.recommendedSIP || 0) - (rec.currentEstimatedSIP || 0);
                  const up = delta > 0;
                  const flat = delta === 0;

                  return (
                    <tr
                      key={i}
                      style={{ borderTop: i > 0 ? '1px solid var(--glass-border)' : 'none', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-raised)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Fund name */}
                      <td style={{ padding: '0.9rem 1rem', fontWeight: 600, color: 'var(--text-primary)', maxWidth: 200 }}>
                        {rec.fundName}
                        {rec.switchTo && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            → {rec.switchTo}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td style={{ padding: '0.9rem 1rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {rec.category}
                      </td>

                      {/* Current est. SIP */}
                      <td style={{ padding: '0.9rem 1rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                        ₹{rec.currentEstimatedSIP?.toLocaleString('en-IN')}
                      </td>

                      {/* Recommended SIP + delta */}
                      <td style={{ padding: '0.9rem 1rem', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          ₹{rec.recommendedSIP?.toLocaleString('en-IN')}
                        </span>
                        {!flat && (
                          <span style={{ marginLeft: 6, fontSize: '0.78rem', fontWeight: 600, color: up ? 'var(--green)' : 'var(--red)' }}>
                            {up ? '↑' : '↓'} ₹{Math.abs(delta).toLocaleString('en-IN')}
                          </span>
                        )}
                      </td>

                      {/* Action badge */}
                      <td style={{ padding: '0.9rem 1rem', whiteSpace: 'nowrap' }}>
                        <span className={ACTION_BADGE[rec.action] || 'badge badge-surface'} style={{ fontWeight: 700, fontSize: '0.72rem' }}>
                          {rec.action}
                        </span>
                      </td>

                      {/* Reason */}
                      <td style={{ padding: '0.9rem 1rem', color: 'var(--text-secondary)', fontSize: '0.82rem', maxWidth: 220, lineHeight: 1.5 }}>
                        {rec.reason}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!hasFunds && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
          <h2 className="text-h2">Add Mutual Funds to Use SIP Optimizer</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 420, margin: '0.5rem auto 0' }}>
            The SIP Optimizer analyzes your existing SIPs and suggests monthly adjustments based on market conditions.
          </p>
          <button
            className="btn btn-primary"
            style={{ marginTop: '1.5rem' }}
            onClick={() => navigate('/app/portfolio')}
          >
            Add Mutual Funds →
          </button>
        </div>
      )}

      {/* Disclaimer */}
      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1.5rem', lineHeight: 1.6 }}>
        AI-generated analysis. Review with your registered adviser before acting. Not SEBI investment advice.
      </p>
    </div>
  );
}
