import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles, ArrowRight, Share2, Copy, Check, MessageCircle,
  Home, TrendingDown, ShieldAlert, Award, FileText, ChevronRight, Landmark
} from 'lucide-react';

function calculateEMI(principal, annualRate, tenureYears) {
  if (!principal || !annualRate || !tenureYears) return 0;
  const monthlyRate = annualRate / 12 / 100;
  const totalMonths = tenureYears * 12;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
              (Math.pow(1 + monthlyRate, totalMonths) - 1);
  return Math.round(emi);
}

export default function PublicLoanArbitrage() {
  const [loanAmount, setLoanAmount] = useState(6500000);
  const [currentRate, setCurrentRate] = useState(9.35);
  const [tenureYears, setTenureYears] = useState(20);
  const [copied, setCopied] = useState(false);

  // RBI EBLR benchmark lowest repo spread (Repo 6.50% + 1.90% spread = 8.40%)
  const benchmarkRate = 8.40;
  const spreadDiff = Math.max(0, currentRate - benchmarkRate);

  const currentEMI = calculateEMI(loanAmount, currentRate, tenureYears);
  const optimizedEMI = calculateEMI(loanAmount, benchmarkRate, tenureYears);

  const currentTotalInterest = (currentEMI * tenureYears * 12) - loanAmount;
  const optimizedTotalInterest = (optimizedEMI * tenureYears * 12) - loanAmount;

  const totalInterestSaved = Math.max(0, currentTotalInterest - optimizedTotalInterest);
  const monthlyEMISaved = Math.max(0, currentEMI - optimizedEMI);

  const shareText = `My bank has been quietly overcharging me ${spreadDiff.toFixed(2)}% in spread creep on my home loan (₹${Math.round(totalInterestSaved / 100000).toFixed(1)} Lakhs in excess lifetime interest!). Check if your bank is overcharging you for free 👉 ${window.location.origin}/tools/loan-arbitrage`;

  function copyShareLink() {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function shareWhatsApp() {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary, #0B0E14)', color: 'var(--text-primary, #fff)', fontFamily: 'system-ui, sans-serif' }}>
      {/* Top Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 2rem', maxWidth: 1200, margin: '0 auto', borderBottom: '1px solid var(--glass-border, rgba(255,255,255,0.08))' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: '#fff' }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>F</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>Fin<span style={{ color: '#818cf8' }}>Agent</span></div>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/login" style={{ color: 'var(--text-secondary, #94a3b8)', textDecoration: 'none', fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}>Sign In</Link>
          <Link to="/signup" style={{ background: '#6366f1', color: '#fff', textDecoration: 'none', padding: '0.5rem 1rem', borderRadius: 8, fontWeight: 600, fontSize: '0.9rem' }}>Get Full Access</Link>
        </div>
      </header>

      {/* Hero Badge */}
      <div style={{ maxWidth: 900, margin: '2.5rem auto 1rem', padding: '0 1.5rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.35rem 0.9rem', borderRadius: 50, fontSize: '0.8125rem', color: '#fcd34d', marginBottom: '1.25rem' }}>
          <Landmark size={14} /> RBI EBLR Repo Spread Auditor · Free Public Tool
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 0.75rem' }}>
          Is Your Bank Overcharging You on Your <span style={{ background: 'linear-gradient(90deg, #f59e0b, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Home Loan</span>?
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.05rem', maxWidth: 640, margin: '0 auto', lineHeight: 1.6 }}>
          Banks quietly increase "spreads" on existing borrowers up to 9.25%–9.75% while offering 8.40% to new customers. Discover your exact overpayment in seconds.
        </p>
      </div>

      {/* Main Interactive Card */}
      <div style={{ maxWidth: 960, margin: '2rem auto 4rem', padding: '0 1.5rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '2rem', backdropFilter: 'blur(16px)' }}>
          {/* Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem', marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Outstanding Loan Balance</label>
                <span style={{ fontWeight: 700, color: '#38bdf8' }}>₹{(loanAmount / 100000).toFixed(1)} Lakhs</span>
              </div>
              <input
                type="range"
                min="1500000"
                max="25000000"
                step="250000"
                value={loanAmount}
                onChange={e => setLoanAmount(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#38bdf8' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                <span>₹15L</span>
                <span>₹75L</span>
                <span>₹1.5 Cr</span>
                <span>₹2.5 Cr</span>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Current Interest Rate</label>
                <span style={{ fontWeight: 700, color: currentRate > 8.75 ? '#f87171' : '#4ade80' }}>{currentRate.toFixed(2)}% p.a.</span>
              </div>
              <input
                type="range"
                min="8.20"
                max="10.50"
                step="0.05"
                value={currentRate}
                onChange={e => setCurrentRate(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#f59e0b' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                <span>8.20%</span>
                <span>8.40% (RBI Repo)</span>
                <span>9.25% (Overpaying)</span>
                <span>10.50%</span>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Remaining Tenure</label>
                <span style={{ fontWeight: 700, color: '#818cf8' }}>{tenureYears} Years</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                step="1"
                value={tenureYears}
                onChange={e => setTenureYears(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#8b5cf6' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                <span>5 Yrs</span>
                <span>15 Yrs</span>
                <span>20 Yrs</span>
                <span>30 Yrs</span>
              </div>
            </div>
          </div>

          {/* Results Summary Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 14, padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8125rem', color: '#fca5a5', marginBottom: '0.35rem' }}>Lender Spread Creep</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f87171' }}>+{spreadDiff.toFixed(2)}%</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.3rem' }}>Market best: 8.40% vs Your: {currentRate.toFixed(2)}%</div>
            </div>

            <div style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.25)', borderRadius: 14, padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8125rem', color: '#86efac', marginBottom: '0.35rem' }}>Monthly EMI Relief</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4ade80' }}>-₹{monthlyEMISaved.toLocaleString('en-IN')}/mo</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.3rem' }}>₹{currentEMI.toLocaleString('en-IN')} &rarr; ₹{optimizedEMI.toLocaleString('en-IN')}</div>
            </div>

            <div style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(239, 68, 68, 0.15))', border: '1px solid rgba(245, 158, 11, 0.35)', borderRadius: 14, padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8125rem', color: '#fcd34d', marginBottom: '0.35rem' }}>Lifetime Excess Interest Leaked</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fbbf24' }}>₹{totalInterestSaved.toLocaleString('en-IN')}</div>
              <div style={{ fontSize: '0.75rem', color: '#fef08a', fontWeight: 600, marginTop: '0.3rem' }}>Save ₹{(totalInterestSaved / 100000).toFixed(1)} Lakhs by resetting spread</div>
            </div>
          </div>

          {/* Social Share Card Generator */}
          <div style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem' }}>Alert Other Homeowners & Save Lakhs in Interest</h4>
                <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.8125rem' }}>Banks never voluntarily reduce interest rates for old borrowers unless asked.</p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={shareWhatsApp} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#25D366', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                  <MessageCircle size={16} /> Share on WhatsApp
                </button>
                <button onClick={copyShareLink} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem 1rem', borderRadius: 8, fontSize: '0.85rem', cursor: 'pointer' }}>
                  {copied ? <Check size={16} color="#4ade80" /> : <Copy size={16} />} {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>

            {/* Visual Social Card Preview */}
            <div style={{ background: 'var(--surface-raised)', border: '1px dashed var(--glass-border)', borderRadius: 10, padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>🏦</div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>₹{(totalInterestSaved / 100000).toFixed(1)} Lakhs Excess Home Loan Interest Detected</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>FinAgent Loan Arbitrage Auditor · Overcharging {spreadDiff.toFixed(2)}% Spread</div>
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>finagent.in/tools/loan-arbitrage</div>
            </div>
          </div>

          {/* Conversion CTA Block */}
          <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'linear-gradient(18deg, rgba(245, 158, 11, 0.15), rgba(99, 102, 241, 0.2))', borderRadius: 16, border: '1px solid rgba(245, 158, 11, 0.4)' }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem', fontWeight: 800 }}>Demand an Immediate Rate Cut from Your Bank</h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.95rem', maxWidth: 560, margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
              Under RBI Circular <em>RBI/2019-20/54</em>, banks are legally mandated to offer existing borrowers the lowest prevailing repo spread upon paying a nominal administrative fee (₹1,000 to ₹5,000).
            </p>
            <Link
              to="/signup?redirect=/app/loan"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#fff',
                color: '#0F172A',
                fontWeight: 800,
                fontSize: '1rem',
                padding: '0.85rem 1.75rem',
                borderRadius: 10,
                textDecoration: 'none',
                boxShadow: '0 10px 25px -5px rgba(255, 255, 255, 0.3)'
              }}
            >
              <FileText size={18} /> Download RBI-Compliant Bank Letter (Free) <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
