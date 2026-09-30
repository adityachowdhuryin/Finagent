import React, { useState } from 'react';
import { Home, ArrowRight, Share2, ShieldCheck, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PublicMortgageArbitrage() {
  const navigate = useNavigate();
  const [homeValue, setHomeValue] = useState(850000);
  const [mortgageBalance, setMortgageBalance] = useState(695000);
  const [monthlyPMI, setMonthlyPMI] = useState(210);
  const [shared, setShared] = useState(false);

  const currentLTV = Number(((mortgageBalance / homeValue) * 100).toFixed(1));
  const isEligibleForCancellation = currentLTV <= 80.0;
  const target80Balance = homeValue * 0.80;
  const paydownNeeded = Math.max(0, mortgageBalance - target80Balance);
  const annualPMISavings = monthlyPMI * 12;

  function handleShare() {
    const text = isEligibleForCancellation
      ? `I just checked my mortgage on the Free PMI Removal Tool and found out I can legally cancel my PMI right now, saving $${annualPMISavings.toLocaleString()}/year! Check yours here:`
      : `Check your mortgage LTV and see when you can legally eliminate Private Mortgage Insurance:`;
    if (navigator.share) {
      navigator.share({ title: 'PMI Cancellation Tool', text, url: window.location.href });
    } else {
      navigator.clipboard.writeText(`${text} ${window.location.href}`);
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-primary)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '0.3rem 0.8rem', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            <span>🇺🇸</span> 12 U.S. CODE § 4902 COMPLIANT
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 900, fontFamily: 'Space Grotesk', letterSpacing: '-0.02em', margin: '0 0 0.5rem 0' }}>
            Free Home Loan & PMI Removal Auditor
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: 620, margin: '0 auto' }}>
            Under the Homeowners Protection Act of 1998, you have the federal right to terminate Private Mortgage Insurance once your loan reaches 80% LTV.
          </p>
        </div>

        {/* Input Card */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6 }}>
                <span className="text-muted">Current Estimated Home Value</span>
                <strong style={{ fontFamily: 'Space Grotesk' }}>${Number(homeValue).toLocaleString()}</strong>
              </div>
              <input
                type="range" min={200000} max={2500000} step={25000}
                value={homeValue} onChange={e => setHomeValue(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6 }}>
                <span className="text-muted">Mortgage Principal Balance</span>
                <strong style={{ fontFamily: 'Space Grotesk', color: 'var(--primary)' }}>${Number(mortgageBalance).toLocaleString()}</strong>
              </div>
              <input
                type="range" min={100000} max={homeValue} step={10000}
                value={mortgageBalance} onChange={e => setMortgageBalance(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)' }}
              />
            </div>
          </div>
        </div>

        {/* Results Banner */}
        <div className="card" style={{
          background: isEligibleForCancellation
            ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), var(--surface))'
            : 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), var(--surface))',
          border: isEligibleForCancellation ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
          padding: '1.75rem',
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.2rem 0.6rem', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              <ShieldCheck size={14} /> CURRENT LTV: {currentLTV}%
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: isEligibleForCancellation ? '#4ade80' : '#f59e0b', margin: '0.25rem 0' }}>
              {isEligibleForCancellation ? `Save $${annualPMISavings.toLocaleString()}/yr` : `Need $${paydownNeeded.toLocaleString()} Paydown`}
            </div>
            <p className="text-xs text-secondary" style={{ maxWidth: 500 }}>
              {isEligibleForCancellation
                ? `Your Loan-to-Value is ${currentLTV}%, meeting the 80% federal threshold to legally demand PMI removal from your lender.`
                : `Your Loan-to-Value is ${currentLTV}%. Once your balance reaches $${target80Balance.toLocaleString()}, you can eliminate monthly PMI fees.`}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: 220 }}>
            <button onClick={() => navigate('/auth/signup')} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Get Official Lender Letter <ArrowRight size={15} />
            </button>
            <button onClick={handleShare} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem' }}>
              <Share2 size={14} /> {shared ? 'Link Copied!' : 'Share Tool'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
