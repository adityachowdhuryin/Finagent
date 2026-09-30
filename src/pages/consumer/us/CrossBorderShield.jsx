import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, ArrowRight, DollarSign, CheckCircle2, Globe, FileText } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export default function CrossBorderShield() {
  const { state } = useApp();
  const [foreignAccounts, setForeignAccounts] = useState([
    { name: 'HDFC NRE Savings & FDs', type: 'Bank / FD', maxBalanceINR: 1250000 },
    { name: 'Zerodha Demat (Direct Equities)', type: 'Direct Equities', maxBalanceINR: 950000 },
    { name: 'ICICI Prudential Bluechip Mutual Fund', type: 'Indian Mutual Fund (PFIC)', maxBalanceINR: 650000 },
  ]);
  const [auditResult, setAuditResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    runCrossBorderAudit();
  }, [foreignAccounts]);

  async function runCrossBorderAudit() {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/cross-border/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usTaxResident: true,
          filingStatus: 'single',
          foreignAccounts,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAuditResult(data);
      }
    } catch (err) {
      console.error('Cross border audit error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            <span>🇺🇸 ⇋ 🇮🇳</span> US-INDIA CROSS-BORDER TAX OS
          </div>
          <h1 className="text-h1">US-India Cross-Border Tax & Asset Shield</h1>
          <p className="text-sm text-secondary mt-1">Audit FBAR (FinCEN 114) $10k aggregate thresholds, FATCA 8938, and avoid punitive Indian Mutual Fund PFIC traps</p>
        </div>
      </div>

      {/* FBAR & PFIC Dual Alert Banner */}
      {auditResult && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          {/* FBAR Alert */}
          <div className="card" style={{
            background: auditResult.fbarAudit.fbarRequired
              ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), var(--surface))'
              : 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), var(--surface))',
            border: auditResult.fbarAudit.fbarRequired ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(34, 197, 94, 0.3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>{auditResult.fbarAudit.fbarRequired ? '🚨' : '✅'}</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: auditResult.fbarAudit.fbarRequired ? 'var(--red)' : '#4ade80' }}>
                  {auditResult.fbarAudit.fbarRequired ? 'FBAR FinCEN 114 Filing MANDATORY' : 'Below FBAR $10,000 Threshold'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Aggregate Foreign Peak: ${auditResult.aggregateForeignMaxBalanceUSD.toLocaleString()} (Threshold: $10,000)</div>
              </div>
            </div>
            <p className="text-xs text-secondary">
              {auditResult.fbarAudit.penaltyNotice}
            </p>
          </div>

          {/* PFIC Indian Mutual Fund Trap */}
          <div className="card" style={{
            background: auditResult.pficAudit.hasPFIC
              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), var(--surface))'
              : 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), var(--surface))',
            border: auditResult.pficAudit.hasPFIC ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(34, 197, 94, 0.3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#f59e0b' }}>
                  PFIC Trap Warning (IRC § 1291 & Form 8621)
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Detected {auditResult.pficAudit.pficAccountsCount} Indian Mutual Fund Account(s)</div>
              </div>
            </div>
            <p className="text-xs text-secondary">
              {auditResult.pficAudit.punitiveTaxWarning}
            </p>
          </div>
        </div>
      )}

      {/* Foreign Accounts Table */}
      <div className="card">
        <h3 className="text-h3" style={{ marginBottom: '0.75rem' }}>Overseas Indian Accounts (Converted at Treasury 84.00 INR/USD)</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.5rem' }}>Account Name</th>
                <th style={{ padding: '0.5rem' }}>Category</th>
                <th style={{ padding: '0.5rem' }}>Peak Balance (INR)</th>
                <th style={{ padding: '0.5rem' }}>USD Equivalent</th>
                <th style={{ padding: '0.5rem', textAlign: 'right' }}>IRS Status</th>
              </tr>
            </thead>
            <tbody>
              {foreignAccounts.map((acc, i) => {
                const usd = Math.round(acc.maxBalanceINR / 84);
                const isPFIC = acc.type.includes('Mutual Fund');
                return (
                  <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>{acc.name}</td>
                    <td style={{ padding: '0.6rem 0.5rem', color: 'var(--text-secondary)' }}>{acc.type}</td>
                    <td style={{ padding: '0.6rem 0.5rem' }}>₹{acc.maxBalanceINR.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '0.6rem 0.5rem', fontWeight: 700, fontFamily: 'Space Grotesk' }}>${usd.toLocaleString()}</td>
                    <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>
                      {isPFIC ? (
                        <span className="badge badge-red" style={{ fontSize: '0.7rem' }}>PFIC Form 8621 Required</span>
                      ) : (
                        <span className="badge badge-surface" style={{ fontSize: '0.7rem' }}>FBAR Reportable</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Safe Migration Blueprint */}
      <div className="card">
        <h3 className="text-h3" style={{ marginBottom: '0.5rem' }}>Safe Cross-Border India Equity Strategy</h3>
        <p className="text-xs text-secondary" style={{ marginBottom: '1rem' }}>
          Instead of holding Indian mutual funds (which trigger lethal IRS Section 1291 compound interest penalties), US tax residents should hold US-domiciled India index ETFs:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
          <div style={{ padding: '0.75rem 1rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)' }}>
            <div style={{ fontWeight: 800, color: 'var(--primary)' }}>INDA</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>iShares MSCI India ETF (BlackRock)</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Standard 15%–20% US LTCG · Zero Form 8621</div>
          </div>
          <div style={{ padding: '0.75rem 1rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)' }}>
            <div style={{ fontWeight: 800, color: 'var(--primary)' }}>EPI</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>WisdomTree India Earnings Fund</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Deep liquidity · Direct NYSE trading</div>
          </div>
          <div style={{ padding: '0.75rem 1rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)' }}>
            <div style={{ fontWeight: 800, color: 'var(--primary)' }}>INDY</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>iShares India 50 ETF (Nifty 50 Tracker)</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Top 50 Indian blue-chips</div>
          </div>
        </div>
      </div>
    </div>
  );
}
