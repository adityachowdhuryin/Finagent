import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles, ArrowRight, Share2, Copy, Check, MessageCircle,
  Briefcase, DollarSign, ShieldAlert, Award, FileText, ChevronRight
} from 'lucide-react';

function calculateTax(taxableIncome) {
  // New Regime FY 2024-25 (Budget 2024 revised slabs)
  const standardDeduction = 75000;
  const net = Math.max(0, taxableIncome - standardDeduction);
  if (net <= 300000) return 0;
  if (net <= 700000) return 0; // Section 87A rebate up to 7L (effectively 7.75L with SD)
  
  let tax = 0;
  if (net > 300000) tax += Math.min(net - 300000, 400000) * 0.05;
  if (net > 700000) tax += Math.min(net - 700000, 300000) * 0.10;
  if (net > 1000000) tax += Math.min(net - 1000000, 200000) * 0.15;
  if (net > 1200000) tax += Math.min(net - 1200000, 300000) * 0.20;
  if (net > 1500000) tax += (net - 1500000) * 0.30;
  
  return Math.round(tax * 1.04); // 4% cess
}

export default function PublicCTCTaxLeak() {
  const [ctc, setCtc] = useState(2500000);
  const [basicPct, setBasicPct] = useState(40);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const basic = Math.round(ctc * (basicPct / 100));
  const hra = Math.round(basic * 0.40);
  const employerPF = Math.round(basic * 0.12);
  
  // Current unoptimized structure: 0 corporate NPS, 0 flexi
  const currentSpecial = Math.max(0, ctc - (basic + hra + employerPF));
  const currentTaxable = ctc - employerPF;
  const currentTax = calculateTax(currentTaxable);
  const currentMonthlyInHand = Math.round((ctc - currentTax - employerPF) / 12);

  // Optimized structure: 10% Corporate NPS (Sec 80CCD(2)), ₹60k Flexi perks
  const corporateNPS = Math.round(basic * 0.10);
  const flexiPerks = Math.min(60000, Math.round(ctc * 0.03));
  const optimizedSpecial = Math.max(0, ctc - (basic + hra + employerPF + corporateNPS + flexiPerks));
  const optimizedTaxable = Math.max(0, ctc - employerPF - corporateNPS - flexiPerks);
  const optimizedTax = calculateTax(optimizedTaxable);
  const optimizedMonthlyInHand = Math.round((ctc - optimizedTax - employerPF - corporateNPS) / 12);

  const annualTaxSaved = Math.max(0, currentTax - optimizedTax);
  const monthlyExtra = Math.max(0, optimizedMonthlyInHand - currentMonthlyInHand);

  const shareText = `I just audited my salary slip on FinAgent and found ₹${annualTaxSaved.toLocaleString('en-IN')} in legal tax leaks via Section 80CCD(2) Corporate NPS & flexi-perks! Find out how much you are overpaying for free 👉 ${window.location.origin}/tools/ctc-tax-leak`;

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
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '0.35rem 0.9rem', borderRadius: 50, fontSize: '0.8125rem', color: '#a5b4fc', marginBottom: '1.25rem' }}>
          <Sparkles size={14} /> 100% Free Public Tool · No Login Required
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 0.75rem' }}>
          Are You Overpaying Taxes on Your <span style={{ background: 'linear-gradient(90deg, #60a5fa, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CTC Salary</span>?
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.05rem', maxWidth: 620, margin: '0 auto', lineHeight: 1.6 }}>
          Most Indian salaried employees leave ₹40,000 to ₹1,20,000 in legal tax shields on the table by not restructuring Basic, Corporate NPS, and Flexi-allowances.
        </p>
      </div>

      {/* Main Interactive Card */}
      <div style={{ maxWidth: 960, margin: '2rem auto 4rem', padding: '0 1.5rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '2rem', backdropFilter: 'blur(16px)' }}>
          {/* Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Annual CTC</label>
                <span style={{ fontWeight: 700, color: '#38bdf8' }}>₹{(ctc / 100000).toFixed(1)} Lakhs / yr</span>
              </div>
              <input
                type="range"
                min="500000"
                max="8000000"
                step="50000"
                value={ctc}
                onChange={e => setCtc(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#6366f1' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                <span>₹5 Lakhs</span>
                <span>₹25L</span>
                <span>₹50L</span>
                <span>₹80 Lakhs</span>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Basic Salary Allocation</label>
                <span style={{ fontWeight: 700, color: '#818cf8' }}>{basicPct}% of CTC</span>
              </div>
              <input
                type="range"
                min="30"
                max="50"
                step="5"
                value={basicPct}
                onChange={e => setBasicPct(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#8b5cf6' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                <span>30% (Lower PF)</span>
                <span>40% (Standard)</span>
                <span>50% (Max NPS)</span>
              </div>
            </div>
          </div>

          {/* Results Summary Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 14, padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8125rem', color: '#fca5a5', marginBottom: '0.35rem' }}>Current Annual Tax (Unoptimized)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f87171' }}>₹{currentTax.toLocaleString('en-IN')}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.3rem' }}>Monthly in-hand: ₹{currentMonthlyInHand.toLocaleString('en-IN')}</div>
            </div>

            <div style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.25)', borderRadius: 14, padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8125rem', color: '#86efac', marginBottom: '0.35rem' }}>Optimized Annual Tax</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4ade80' }}>₹{optimizedTax.toLocaleString('en-IN')}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.3rem' }}>Monthly in-hand: ₹{optimizedMonthlyInHand.toLocaleString('en-IN')}</div>
            </div>

            <div style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15))', border: '1px solid rgba(168, 85, 247, 0.35)', borderRadius: 14, padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8125rem', color: '#c084fc', marginBottom: '0.35rem' }}>Potential Annual Tax Savings</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#e879f9' }}>₹{annualTaxSaved.toLocaleString('en-IN')}</div>
              <div style={{ fontSize: '0.75rem', color: '#86efac', fontWeight: 600, marginTop: '0.3rem' }}>+₹{monthlyExtra.toLocaleString('en-IN')}/mo in your pocket</div>
            </div>
          </div>

          {/* Breakdown Pills */}
          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: '1.25rem', marginBottom: '2rem' }}>
            <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={16} color="#818cf8" /> Where Your ₹{annualTaxSaved.toLocaleString('en-IN')} Savings Come From:
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{ background: '#6366f1', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0 }}>1</div>
                <div>
                  <strong>Section 80CCD(2) Corporate NPS (₹{corporateNPS.toLocaleString('en-IN')})</strong>
                  <p style={{ margin: '0.2rem 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>Up to 10% of basic contributed directly by employer is 100% tax-exempt in New Tax Regime, over and above 80C.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{ background: '#8b5cf6', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0 }}>2</div>
                <div>
                  <strong>Flexi-Benefit Perquisite Basket (₹{flexiPerks.toLocaleString('en-IN')})</strong>
                  <p style={{ margin: '0.2rem 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>Remote work internet, food coupons, books/periodicals reimbursed against actual bills.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Social Share Card Generator */}
          <div style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem' }}>Share Your Audit & Help Friends Save Taxes</h4>
                <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.8125rem' }}>Most employees don't know HR allows restructuring until you show them.</p>
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
            <div style={{ background: '#0F172A', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 10, padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #ef4444, #f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>💸</div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>₹{annualTaxSaved.toLocaleString('en-IN')} Annual Salary Tax Leak Detected</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>FinAgent CTC Tax Optimizer · Free Instant Audit</div>
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 600 }}>finagent.in/tools/ctc-tax-leak</div>
            </div>
          </div>

          {/* Conversion CTA Block */}
          <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'linear-gradient(18deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))', borderRadius: 16, border: '1px solid rgba(168, 85, 247, 0.4)' }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem', fontWeight: 800 }}>Ready to Submit to Your HR / Payroll Team?</h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.95rem', maxWidth: 540, margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
              Sign up for a free FinAgent account to auto-generate and download your official <strong>HR Salary Restructuring Declaration PDF</strong> pre-filled with all exact salary component Annexures.
            </p>
            <Link
              to="/signup?redirect=/app/ctc-optimizer"
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
              <FileText size={18} /> Download Official HR Declaration (Free) <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
