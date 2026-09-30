import React, { useState, useEffect } from 'react';
import {
  FileText, ShieldCheck, AlertTriangle, CheckCircle2, Download,
  Sparkles, Upload, Key, RefreshCw, ExternalLink, Scissors, DollarSign
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function ForensicAudit() {
  const { state } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [file, setFile] = useState(null);

  useEffect(() => {
    runAudit(true);
  }, []);

  async function runAudit(isSample = false) {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/forensic/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSample, password }),
      });
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (e) {
      console.error('Forensic audit failed:', e);
    } finally {
      setLoading(false);
    }
  }

  function exportTaxDeductionsCSV() {
    if (!data) return;
    const rows = [
      ['Tax Section', 'Category', 'Recipient / Institution', 'Amount (INR)', 'Tax Saved (30% Slab)'],
      ...data.taxDeductionsHarvested.map(d => [
        d.section,
        d.category,
        d.recipient,
        d.amount,
        d.taxSavedAt30Pct
      ])
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Tax_Deductions_Packet_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const formatINR = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.75rem' }}>🧾</span>
            <h1 className="text-h1">AI Bank & UPI Forensic Statement Auditor</h1>
          </div>
          <p className="text-sm text-secondary">
            Scans bank & credit card statements to isolate recurring zombie debits, decode cryptic UPI strings, and harvest missed tax deductions.
          </p>
        </div>

        <button
          onClick={() => runAudit(true)}
          className="btn btn-ghost btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}
        >
          <Sparkles size={14} /> Try Sample 3-Month HDFC Statement
        </button>
      </div>

      {/* Upload Box */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 className="text-h3" style={{ marginBottom: '0.25rem' }}>Upload Bank Statement or Credit Card E-Bill (PDF / CSV)</h3>
        <p className="text-xs text-secondary" style={{ marginBottom: '1rem' }}>Supports password-encrypted monthly e-statements from HDFC, SBI, ICICI, Axis, Kotak.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
          <div>
            <label className="text-xs text-muted">Bank Statement PDF / CSV</label>
            <input
              type="file"
              accept=".pdf,.csv"
              onChange={e => setFile(e.target.files[0])}
              style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}
            />
          </div>

          <div>
            <label className="text-xs text-muted">PDF Password (Optional)</label>
            <input
              type="password"
              placeholder="e.g. PAN + DOB"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '0.5rem 0.75rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
            />
          </div>

          <button
            onClick={() => runAudit(false)}
            disabled={loading}
            className="btn btn-primary"
            style={{ height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <Upload size={16} /> {loading ? 'Auditing Statement...' : 'Run Forensic Audit'}
          </button>
        </div>
      </div>

      {data && (
        <>
          {/* Top KPI Banner */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="card" style={{ borderLeft: '4px solid var(--red)' }}>
              <div className="text-xs text-muted" style={{ textTransform: 'uppercase' }}>Zombie Subscriptions Bleed</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--red)', marginTop: 4 }}>
                {formatINR(data.zombieSubscriptionAnnualBleed)} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ yr</span>
              </div>
              <div className="text-xs text-secondary" style={{ marginTop: 2 }}>Recurring auto-debits with zero utility</div>
            </div>

            <div className="card" style={{ borderLeft: '4px solid var(--green)' }}>
              <div className="text-xs text-muted" style={{ textTransform: 'uppercase' }}>Tax Deductions Recovered</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--green)', marginTop: 4 }}>
                {formatINR(data.unclaimedTaxDeductionsFound)}
              </div>
              <div className="text-xs text-secondary" style={{ marginTop: 2 }}>Eligible under 80D, 80G, and 80C</div>
            </div>

            <div className="card">
              <div className="text-xs text-muted" style={{ textTransform: 'uppercase' }}>Total Debit Volume Scanned</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'Space Grotesk', marginTop: 4 }}>
                {formatINR(data.totalDebitSpend)}
              </div>
              <div className="text-xs text-secondary" style={{ marginTop: 2 }}>{data.statementPeriod}</div>
            </div>
          </div>

          {/* Zombie Subscriptions List */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 className="text-h3">Zombie Subscriptions & Silent Leaks ({data.zombieSubscriptions.length})</h3>
                <p className="text-xs text-secondary">Recurring charges detected from gym memberships, unused cloud tiers, and auto-renewals.</p>
              </div>
              <span className="badge badge-red">Bleeding {formatINR(data.zombieSubscriptionAnnualBleed)}/yr</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {data.zombieSubscriptions.map(sub => (
                <div key={sub.id} style={{
                  padding: '1rem',
                  background: 'var(--surface-raised)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{sub.merchant}</span>
                      <span className={`badge ${sub.status === 'HIGH_LEAK' ? 'badge-red' : 'badge-gold'}`} style={{ fontSize: '0.65rem' }}>
                        {sub.status === 'HIGH_LEAK' ? 'UNATTENDED LEAK' : 'UNDER-UTILIZED'}
                      </span>
                    </div>
                    <div className="text-xs text-muted" style={{ fontFamily: 'monospace' }}>Raw: {sub.rawString}</div>
                    <div className="text-xs text-secondary" style={{ marginTop: 4 }}>💡 {sub.insight}</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, color: 'var(--red)', fontSize: '1.1rem' }}>
                        -{formatINR(sub.annualCost)}/yr
                      </div>
                      <div className="text-xs text-muted">{sub.frequency}</div>
                    </div>

                    <a
                      href={sub.cancelUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      Cancel <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tax Deductions Harvester */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 className="text-h3">Auto-Harvested Tax Deduction Receipts</h3>
                <p className="text-xs text-secondary">Payments identified as eligible tax deductions under Indian Income Tax sections.</p>
              </div>

              <button
                onClick={exportTaxDeductionsCSV}
                className="btn btn-primary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Download size={14} /> Export Tax Proof Packet (CSV)
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Section & Category</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Recipient</th>
                    <th style={{ textAlign: 'right', padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Amount</th>
                    <th style={{ textAlign: 'right', padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Tax Saved (30% Slab)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.taxDeductionsHarvested.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--glass-border)22' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>{item.section}</span>
                        <div className="text-xs text-secondary" style={{ marginTop: 2 }}>{item.category}</div>
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>{item.recipient}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'Space Grotesk' }}>{formatINR(item.amount)}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'Space Grotesk', fontWeight: 800, color: 'var(--green)' }}>
                        +{formatINR(item.taxSavedAt30Pct)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
