import React, { useState } from 'react';
import {
  Building2, Users, FileCheck, ShieldCheck, Download, Send,
  RefreshCw, CheckCircle2, AlertTriangle, ExternalLink, ArrowRight,
  Sparkles, Award, Lock, Search, Filter, Copy, Check
} from 'lucide-react';
import { useTaxStudio } from '../../context/TaxStudioContext';

const US_CLIENTS = [
  { id: 'cli-1', name: 'Alex Morgan', email: 'alex.morgan@techcorp.io', aum: '$1.45M', form: 'Form 1040 + Sched C/E', linterStatus: '28/28 Pass', filingStatus: 'Ready to File', taxAlphaSaved: '$18,420', state: 'CA' },
  { id: 'cli-2', name: 'Sarah Jenkins', email: 'sarah.j@bioventures.com', aum: '$3.20M', form: 'Form 1120-S (S-Corp)', linterStatus: '27/28 Pass', filingStatus: 'In Review', taxAlphaSaved: '$34,800', state: 'WA' },
  { id: 'cli-3', name: 'Marcus Vance', email: 'marcus.v@cloudscale.net', aum: '$840k', form: 'Form 1040 + ISO AMT', linterStatus: '28/28 Pass', filingStatus: 'Transmitted (ECN)', taxAlphaSaved: '$12,450', state: 'TX' },
  { id: 'cli-4', name: 'Elena Rostova', email: 'elena@novacapital.us', aum: '$4.80M', form: 'Form 1040 + Form 8938', linterStatus: 'Warning: Form 8938 FBAR', filingStatus: 'Action Required', taxAlphaSaved: '$41,200', state: 'NY' },
  { id: 'cli-5', name: 'David & Rachel Kim', email: 'david.kim@stanford.edu', aum: '$2.10M', form: 'Form 1040 (MFJ)', linterStatus: '28/28 Pass', filingStatus: 'Ready to File', taxAlphaSaved: '$15,800', state: 'CA' },
  { id: 'cli-6', name: 'Julian Thorne', email: 'julian@solargrid.co', aum: '$1.15M', form: 'Form 1065 (LLC PTET)', linterStatus: '28/28 Pass', filingStatus: 'In Review', taxAlphaSaved: '$22,600', state: 'CO' },
];

const IN_CLIENTS = [
  { id: 'cli-in-1', name: 'Arjun Sharma', email: 'arjun.sharma@infosys.com', aum: '₹8.45 Cr', form: 'ITR-2 + Schedule FA', linterStatus: '18/18 Pass', filingStatus: 'Ready to File', taxAlphaSaved: '₹3.28 Lakh', state: 'MH' },
  { id: 'cli-in-2', name: 'Priya & Vikram Patel', email: 'priya.patel@zomato.in', aum: '₹14.20 Cr', form: 'ITR-2 + HUF Deed', linterStatus: '18/18 Pass', filingStatus: 'Transmitted (DIN)', taxAlphaSaved: '₹5.40 Lakh', state: 'KA' },
  { id: 'cli-in-3', name: 'Rajesh Singhal', email: 'rajesh@singhaltextiles.com', aum: '₹6.80 Cr', form: 'ITR-3 (Business & Gains)', linterStatus: 'Warning: AIS Mismatch', filingStatus: 'In Review', taxAlphaSaved: '₹4.15 Lakh', state: 'DL' },
  { id: 'cli-in-4', name: 'Ananya Deshmukh', email: 'ananya@swiggy.in', aum: '₹4.20 Cr', form: 'ITR-2 (ESOPs & US RSUs)', linterStatus: '18/18 Pass', filingStatus: 'Ready to File', taxAlphaSaved: '₹2.85 Lakh', state: 'KA' },
  { id: 'cli-in-5', name: 'Dr. Suresh Mehta', email: 'suresh@mehtaclinic.org', aum: '₹11.50 Cr', form: 'ITR-3 (Presumptive 44ADA)', linterStatus: '18/18 Pass', filingStatus: 'Ready to File', taxAlphaSaved: '₹3.90 Lakh', state: 'GJ' },
  { id: 'cli-in-6', name: 'Karan & Sons HUF', email: 'karan@malhotracap.in', aum: '₹9.10 Cr', form: 'HUF Separate ITR', linterStatus: '18/18 Pass', filingStatus: 'Transmitted (DIN)', taxAlphaSaved: '₹4.80 Lakh', state: 'MH' },
];

export default function CpaPracticePortal() {
  const { activeMarket } = useTaxStudio();
  const isUS = activeMarket === 'US';
  const clients = isUS ? US_CLIENTS : IN_CLIENTS;

  const [searchTerm, setSearchTerm] = useState('');
  const [batchAuditing, setBatchAuditing] = useState(false);
  const [batchAuditCompleted, setBatchAuditCompleted] = useState(false);
  const [intakeLinkModalOpen, setIntakeLinkModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const firmName = isUS
    ? 'Beacon Wealth & Fiduciary Tax LLP (San Francisco, CA)'
    : 'Aggarwal & Singhal Chartered Accountants (Mumbai, MH)';
  const licenseNumber = isUS ? 'CPA Lic #119420 • ERO EFIN #548910' : 'ICAI Reg #104928W • Peer Reviewed Firm';

  const intakeUrl = `http://localhost:5173/app/tax?intake=${isUS ? 'beacon_wealth_cpa' : 'aggarwal_singhal_ca'}&ref=client_onboarding`;

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.form.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRunBatchAudit = () => {
    setBatchAuditing(true);
    setBatchAuditCompleted(false);
    setTimeout(() => {
      setBatchAuditing(false);
      setBatchAuditCompleted(true);
    }, 1200);
  };

  const handleExportLedgerCSV = () => {
    const header = 'Client ID,Client Name,Email,AUM,Tax Form,Linter Status,Filing Status,Tax Alpha Saved,State\n';
    const rows = clients
      .map(
        (c) =>
          `"${c.id}","${c.name}","${c.email}","${c.aum}","${c.form}","${c.linterStatus}","${c.filingStatus}","${c.taxAlphaSaved}","${c.state}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CPA_Firm_Client_Ledger_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Firm Practice Banner */}
      <div
        className="card"
        style={{
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          borderRadius: 12,
          color: '#fff',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Building2 size={24} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>{firmName}</h2>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '0.15rem 0.45rem',
                    borderRadius: 10,
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  PRACTICE PRO
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                {licenseNumber} • Professional Fiduciary Tax & Audit Terminal
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setIntakeLinkModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.85rem',
                borderRadius: 6,
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Send size={13} color="#818cf8" />
              <span>Send Client Intake Link</span>
            </button>

            <button
              type="button"
              onClick={handleRunBatchAudit}
              disabled={batchAuditing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 1rem',
                borderRadius: 6,
                background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
                border: 'none',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: batchAuditing ? 'wait' : 'pointer',
              }}
            >
              {batchAuditing ? <RefreshCw size={13} className="spin" /> : <ShieldCheck size={13} />}
              <span>{batchAuditing ? 'Auditing 6 Client Returns...' : '1-Click Batch Linter Audit'}</span>
            </button>
          </div>
        </div>

        {/* 4 Practice KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          <div style={{ padding: '0.75rem 0.85rem', borderRadius: 8, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Active Practice Clients</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginTop: 2 }}>6 Filers</div>
            <div style={{ fontSize: '0.6875rem', color: '#34d399' }}>✓ All returns digitized</div>
          </div>

          <div style={{ padding: '0.75rem 0.85rem', borderRadius: 8, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Total Client AUM Audited</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#818cf8', marginTop: 2 }}>
              {isUS ? '$13.5M' : '₹54.2 Cr'}
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#cbd5e1' }}>Across all 6 entities</div>
          </div>

          <div style={{ padding: '0.75rem 0.85rem', borderRadius: 8, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Pre-Audit Validation Rate</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399', marginTop: 2 }}>98.4%</div>
            <div style={{ fontSize: '0.6875rem', color: '#34d399' }}>28-Rule IRS/CBDT Checks</div>
          </div>

          <div style={{ padding: '0.75rem 0.85rem', borderRadius: 8, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Total Tax Alpha Identified</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8', marginTop: 2 }}>
              {isUS ? '+$145.3k' : '+₹24.4 Lakh'}
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#cbd5e1' }}>Annual client tax savings</div>
          </div>
        </div>

        {/* Batch Audit Confirmation Banner */}
        {batchAuditCompleted && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.65rem 0.85rem',
              borderRadius: 6,
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              color: '#34d399',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={15} />
              <span>
                <strong>Batch Linter Complete:</strong> 5 returns 100% compliant with zero critical errors. 1 return flagged with Form 8938/FBAR advisory notice.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setBatchAuditCompleted(false)}
              style={{ background: 'transparent', border: 'none', color: '#34d399', cursor: 'pointer', fontSize: '0.72rem', textDecoration: 'underline' }}
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Client Roster Table Card */}
      <div
        className="card"
        style={{
          padding: '1.25rem',
          background: 'var(--surface, #1e293b)',
          border: '1px solid var(--border-active, rgba(99, 102, 241, 0.2))',
          borderRadius: 12,
        }}
      >
        {/* Table Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Practice Client Batch Roster ({filteredClients.length})
            </h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Real-time monitoring of client document intake, statutory rule validations, and gateway transmission readiness.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 9, top: 9, color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="Search client or form..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '0.4rem 0.65rem 0.4rem 1.85rem',
                  borderRadius: 6,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'var(--text-primary)',
                  fontSize: '0.75rem',
                  outline: 'none',
                }}
              />
            </div>

            <button
              type="button"
              onClick={handleExportLedgerCSV}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.75rem',
                borderRadius: 6,
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Client Roster Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                <th style={{ textAlign: 'left', padding: '0.65rem 0.5rem' }}>Client Name & Email</th>
                <th style={{ textAlign: 'left', padding: '0.65rem 0.5rem' }}>Tax Form & State</th>
                <th style={{ textAlign: 'right', padding: '0.65rem 0.5rem' }}>Audited AUM</th>
                <th style={{ textAlign: 'center', padding: '0.65rem 0.5rem' }}>Statutory Linter</th>
                <th style={{ textAlign: 'right', padding: '0.65rem 0.5rem' }}>Identified Tax Alpha</th>
                <th style={{ textAlign: 'center', padding: '0.65rem 0.5rem' }}>Filing Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--glass-border)33' }}>
                  <td style={{ padding: '0.75rem 0.5rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>{c.email}</div>
                  </td>

                  <td style={{ padding: '0.75rem 0.5rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.form}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Jurisdiction: {c.state}</div>
                  </td>

                  <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontFamily: 'Space Grotesk', fontWeight: 600 }}>
                    {c.aum}
                  </td>

                  <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.45rem',
                        borderRadius: 4,
                        background: c.linterStatus.includes('Pass') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: c.linterStatus.includes('Pass') ? '#34d399' : '#fbbf24',
                        border: `1px solid ${c.linterStatus.includes('Pass') ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                      }}
                    >
                      {c.linterStatus.includes('Pass') ? <ShieldCheck size={11} /> : <AlertTriangle size={11} />}
                      <span>{c.linterStatus}</span>
                    </span>
                  </td>

                  <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: '#10b981', fontWeight: 800, fontFamily: 'Space Grotesk' }}>
                    +{c.taxAlphaSaved}
                  </td>

                  <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: 12,
                        background: c.filingStatus.includes('Transmitted') ? 'rgba(99, 102, 241, 0.2)' : c.filingStatus.includes('Ready') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: c.filingStatus.includes('Transmitted') ? '#a5b4fc' : c.filingStatus.includes('Ready') ? '#34d399' : '#fbbf24',
                      }}
                    >
                      {c.filingStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Intake Link Modal */}
      {intakeLinkModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10002,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              borderRadius: 12,
              padding: '1.5rem',
              maxWidth: 540,
              width: '100%',
              color: '#fff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Send size={18} color="#818cf8" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                  Shareable Practice Client Intake Portal Link
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIntakeLinkModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 1rem' }}>
              Send this custom link to your clients. When they upload their W-2s, 1099s, or Form 16s, their data is parsed client-side and mapped straight into your firm’s batch roster with the 28-rule audit pre-calculated.
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '0.5rem 0.75rem',
                borderRadius: 6,
                marginBottom: '1.25rem',
              }}
            >
              <input
                type="text"
                readOnly
                value={intakeUrl}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: '#a5b4fc',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(intakeUrl);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                style={{
                  padding: '0.3rem 0.65rem',
                  borderRadius: 4,
                  background: 'var(--primary, #4f46e5)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                {copiedLink ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setIntakeLinkModalOpen(false)}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: 6,
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#cbd5e1',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
