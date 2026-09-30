import React, { useState } from 'react';
import {
  Sparkles, DollarSign, Share2, Download, CheckCircle2,
  TrendingDown, ArrowRight, ShieldAlert, Award
} from 'lucide-react';
import html2canvas from 'html2canvas';

export default function PublicViralDiagnostic() {
  const [market, setMarket] = useState('US');
  const [title, setTitle] = useState('Senior Software Engineer');
  const [company, setCompany] = useState('Google');
  const [comp, setComp] = useState(market === 'US' ? 320000 : 4500000);

  const [scorecard, setScorecard] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const currencySymbol = market === 'US' ? '$' : '₹';

  async function handleAudit(e) {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await fetch('/api/viral-audit/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          company,
          annualCompensation: Number(comp),
          market
        })
      });
      const data = await res.json();
      if (data.success) {
        setScorecard(data.scorecard);
      }
    } catch (err) {
      console.error('Audit generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleDownloadCard() {
    const el = document.getElementById('viral-leak-card');
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#0f0f23' });
    const link = document.createElement('a');
    link.download = `FinAgent-Wealth-Leak-${company}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  function handleCopyShareLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  }

  return (
    <div style={{ maxWidth: 880, margin: '2rem auto', padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99,102,241,0.1)', padding: '0.35rem 0.85rem', borderRadius: 20, marginBottom: '0.75rem' }}>
          <Sparkles size={14} color="var(--primary)" />
          <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>10-Second Wealth Leak Diagnostic</span>
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          How Much Wealth Are You Leaking?
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 540, margin: '0.6rem auto 0', fontSize: '0.95rem' }}>
          Tech workers leak an average of 4% to 7% of total compensation to unoptimized tax withholding, 401(k) fee drag, and idle cash.
        </p>
      </div>

      {/* Input Card */}
      <div className="card" style={{ maxWidth: 600, margin: '0 auto', width: '100%' }}>
        <form onSubmit={handleAudit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 2 }}>Target Market / Geography</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => { setMarket('US'); setComp(320000); }}
                className={`btn btn-sm ${market === 'US' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ flex: 1 }}
              >
                🇺🇸 US Tech (USD)
              </button>
              <button
                type="button"
                onClick={() => { setMarket('IN'); setComp(4500000); }}
                className={`btn btn-sm ${market === 'IN' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ flex: 1 }}
              >
                🇮🇳 India Tech (INR)
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 2 }}>Current Employer</label>
              <input
                type="text"
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="Google, Meta, Stripe..."
                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', background: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                required
              />
            </div>

            <div>
              <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 2 }}>Job Role / Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Staff SWE, Product Lead..."
                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', background: 'var(--surface-raised)', color: 'var(--text-primary)' }}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 2 }}>Total Annual Compensation ({currencySymbol})</label>
            <input
              type="number"
              value={comp}
              onChange={e => setComp(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', background: 'var(--surface-raised)', color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.1rem' }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            className="btn btn-primary"
            style={{ padding: '0.8rem', fontWeight: 700, marginTop: '0.25rem' }}
          >
            {isGenerating ? 'Computing Forensic Leak...' : '⚡ Audit My Wealth Leak'}
          </button>
        </form>
      </div>

      {/* Shareable Card Output */}
      {scorecard && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          {/* Card to Download / Screenshot */}
          <div
            id="viral-leak-card"
            style={{
              width: '100%',
              maxWidth: 580,
              background: 'linear-gradient(135deg, #0f0f23 0%, #1e1b4b 100%)',
              border: '2px solid rgba(99,102,241,0.4)',
              borderRadius: 24,
              padding: '2rem',
              color: '#fff',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.05em', color: '#a5b4fc' }}>
                FinAgent · Forensic Leak Audit
              </div>
              <span style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', padding: '0.2rem 0.6rem', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700 }}>
                CRITICAL LEAK
              </span>
            </div>

            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
              {scorecard.title} @ <strong>{scorecard.company}</strong>
            </div>

            <div style={{ fontSize: '3rem', fontWeight: 900, color: '#f87171', margin: '0.5rem 0' }}>
              -{currencySymbol}{scorecard.estimatedAnnualLeak.toLocaleString()}
              <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}> / year</span>
            </div>

            <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '1.25rem' }}>
              {scorecard.headline}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: 12 }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Identified Leaks:
              </div>
              {scorecard.leakBreakdown.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span>{item.item}</span>
                  <span style={{ fontWeight: 700, color: '#f87171' }}>+{currencySymbol}{item.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.75rem', color: '#64748b' }}>
              <span>Verified via FinAgent Wealth OS</span>
              <span>app.finagent.wealth</span>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={handleDownloadCard} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Download size={14} /> Download Share Card
            </button>
            <button className="btn btn-ghost btn-sm" onClick={handleCopyShareLink} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Share2 size={14} /> {copiedLink ? 'Link Copied!' : 'Copy Share Link'}
            </button>
            <a
              href="/app/dashboard"
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              Plug Your Wealth Leak on FinAgent <ArrowRight size={14} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
