import React, { useState } from 'react';
import { DollarSign, ArrowRight, Sparkles, Share2, Download, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PublicW2TaxLeak() {
  const navigate = useNavigate();
  const [grossSalary, setGrossSalary] = useState(195000);
  const [traditional401k, setTraditional401k] = useState(11700); // 6%
  const [employerMatchMaxPct, setEmployerMatchMaxPct] = useState(6);
  const [employerMatchRatePct, setEmployerMatchRatePct] = useState(50);
  const [hsaContribution, setHsaContribution] = useState(0);
  const [shared, setShared] = useState(false);

  // Computations
  const fullEmployerMatchUSD = Math.round((grossSalary * (employerMatchMaxPct / 100)) * (employerMatchRatePct / 100));
  const current401kPct = grossSalary > 0 ? (traditional401k / grossSalary) * 100 : 0;
  const capturedMatchUSD = current401kPct >= employerMatchMaxPct
    ? fullEmployerMatchUSD
    : Math.round(traditional401k * (employerMatchRatePct / 100));
  const freeMoneyLeftOnTable = Math.max(0, fullEmployerMatchUSD - capturedMatchUSD);

  // Potential tax savings by maxing 401k to $23,000 and HSA to $4,150
  const additional401kCapacity = Math.max(0, 23000 - traditional401k);
  const additionalHsaCapacity = Math.max(0, 4150 - hsaContribution);
  const estimatedTaxSavingsUSD = Math.round((additional401kCapacity + additionalHsaCapacity) * 0.35); // 35% marginal rate proxy

  function handleShare() {
    const text = `I just ran my W-2 salary through the Free 401(k) Match & Tax Auditor and found $${freeMoneyLeftOnTable.toLocaleString()} in unclaimed company match! Check your paycheck here:`;
    if (navigator.share) {
      navigator.share({ title: 'W-2 Tax & 401(k) Auditor', text, url: window.location.href });
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(59, 130, 246, 0.15)', color: 'var(--primary)', padding: '0.3rem 0.8rem', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            <span>🇺🇸</span> ZERO-LOGIN US TAX AUDITOR
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 900, fontFamily: 'Space Grotesk', letterSpacing: '-0.02em', margin: '0 0 0.5rem 0' }}>
            Free W-2 Paycheck & 401(k) Match Auditor
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: 620, margin: '0 auto' }}>
            Discover if you are leaving thousands in unclaimed company 401(k) match on the table, and quantify your tax savings from maxing pre-tax HSA & elective deductions.
          </p>
        </div>

        {/* Input Card */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6 }}>
                <span className="text-muted">Gross W-2 Annual Salary</span>
                <strong style={{ fontFamily: 'Space Grotesk' }}>${Number(grossSalary).toLocaleString()}</strong>
              </div>
              <input
                type="range" min={50000} max={500000} step={5000}
                value={grossSalary} onChange={e => setGrossSalary(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6 }}>
                <span className="text-muted">Your Current 401(k) Deferral</span>
                <strong style={{ fontFamily: 'Space Grotesk', color: 'var(--primary)' }}>${Number(traditional401k).toLocaleString()} ({current401kPct.toFixed(1)}%)</strong>
              </div>
              <input
                type="range" min={0} max={23000} step={500}
                value={traditional401k} onChange={e => setTraditional401k(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)' }}
              />
            </div>
          </div>
        </div>

        {/* Results Banner */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), var(--surface))',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
          padding: '1.75rem',
        }}>
          <div>
            <div className="text-xs text-secondary">Potential Annual Tax & Free Match Savings:</div>
            <div style={{ fontSize: '3rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: '#4ade80', margin: '0.25rem 0' }}>
              +${(freeMoneyLeftOnTable + estimatedTaxSavingsUSD).toLocaleString()}
              <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>/year</span>
            </div>
            <p className="text-xs text-secondary" style={{ maxWidth: 500 }}>
              Includes <strong>${freeMoneyLeftOnTable.toLocaleString()}</strong> in unclaimed company 401(k) match, plus <strong>${estimatedTaxSavingsUSD.toLocaleString()}</strong> in federal and state tax savings by utilizing available elective space.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: 220 }}>
            <button onClick={() => navigate('/auth/signup')} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Claim Official HR Form <ArrowRight size={15} />
            </button>
            <button onClick={handleShare} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem' }}>
              <Share2 size={14} /> {shared ? 'Link Copied!' : 'Share with Coworkers'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
