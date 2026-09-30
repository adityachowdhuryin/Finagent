import React, { useState, useEffect } from 'react';
import {
  RefreshCw, ExternalLink, ChevronDown, ChevronUp, AlertTriangle,
  Download, ShieldCheck, FileCheck, Award, FileText
} from 'lucide-react';
import { analyze } from '../../services/geminiService';
import { useApp } from '../../context/AppContext';
import { jsPDF } from 'jspdf';

const CATEGORY_COLORS = {
  'Mutual Funds': 'var(--primary)',
  'RIA/Advisory': 'var(--purple)',
  'Algo Trading': 'var(--gold)',
  'KYC/AML': 'var(--cyan)',
  'Research Analysts': 'var(--orange)',
  'Brokers': 'var(--green)',
  'Insider Trading': 'var(--red)',
  'General': 'var(--text-muted)',
};

export default function ComplianceWatchdog() {
  const { state } = useApp();
  const [circulars, setCirculars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [analysis, setAnalysis] = useState({});
  const [lastScanned, setLastScanned] = useState(null);
  const [source, setSource] = useState('');

  useEffect(() => { loadCirculars(); }, []);

  async function loadCirculars() {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/sebi/circulars');
      const data = await res.json();
      if (data.success && data.circulars?.length > 0) {
        setCirculars(data.circulars);
        setSource(data.source);
        setLastScanned(new Date());
      }
    } catch {
      setCirculars(FALLBACK_CIRCULARS);
      setSource('fallback');
      setLastScanned(new Date());
    } finally { setLoading(false); }
  }

  async function analyzeCircular(circular) {
    setAnalyzingId(circular.id);
    setExpanded(e => ({ ...e, [circular.id]: true }));
    try {
      const advisorProfile = {
        name: state.advisor?.profile?.name || 'Meera Kapoor',
        sebiRegNo: state.advisor?.profile?.sebiRegNo || 'INA000014523',
        clientCount: state.advisor?.clients?.length || 12,
        totalAUM: '₹4.2 Crore',
        clientTypes: 'Retail investors, HNIs, NRIs',
        products: 'Equity MF, Debt MF, Fixed Deposits, Insurance',
      };

      const prompt = `You are a SEBI compliance expert. Analyze this SEBI circular and its impact on a registered investment adviser.

Circular: "${circular.title}"
Date: ${circular.date}
Category: ${circular.category}

Adviser Profile:
${JSON.stringify(advisorProfile, null, 2)}

Return JSON:
{
  "relevance": "high|medium|low",
  "summary": "2-sentence plain English summary of what this circular says",
  "impactOnAdvisor": "2-3 sentences on how this specifically affects this RIA",
  "affectedClients": "Which type of clients are affected and why",
  "actions": [{ "deadline": "date or 'Immediate'", "action": "specific compliance action required", "priority": "high|medium|low" }],
  "keyDates": ["important dates mentioned in the circular"],
  "riskIfIgnored": "What happens if not complied with"
}
Return ONLY valid JSON.`;

      const result = await analyze(prompt, 'json');
      setAnalysis(prev => ({ ...prev, [circular.id]: result || FALLBACK_ANALYSIS }));
    } catch {
      setAnalysis(prev => ({ ...prev, [circular.id]: FALLBACK_ANALYSIS }));
    } finally { setAnalyzingId(null); }
  }

  const [activeTab, setActiveTab] = useState('circulars');

  function downloadAuditBinderPDF() {
    const doc = new jsPDF();
    const margin = 16;
    let y = 18;

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('SEBI RIA INSPECTION AUDIT BINDER', margin, 18);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Mandatory Compliance Records under SEBI (Investment Advisers) Regulations, 2013', margin, 25);

    y = 44;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('REGISTERED INVESTMENT ADVISER DETAILS:', margin, y);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Adviser Name: Meera Kapoor, RIA', margin, y + 5);
    doc.text('SEBI Registration No: INA000014523 | Validity: Perpetual', margin, y + 10);
    doc.text('BASL Membership No: BASL-1092 | Audit Period: FY 2024-25', margin, y + 15);

    y = 75;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('1. CLIENT RISK PROFILING AUDIT TRAIL (REGULATION 16)', margin, y);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('• Rahul Verma (Client ID: CL-101) — Risk Score: 78/100 (Aggressive) | Signed: 14-Jan-2025 | Next Review: 13-Jan-2026', margin, y + 5);
    doc.text('• Priya & Arjun Sharma (Client ID: CL-102) — Risk Score: 52/100 (Moderate) | Signed: 18-Feb-2025 | Next Review: 17-Feb-2026', margin, y + 11);
    doc.text('• Aniket Roy (Client ID: CL-103) — Risk Score: 31/100 (Conservative) | Signed: 02-Mar-2025 | Next Review: 01-Mar-2026', margin, y + 17);

    y = 108;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('2. RATIONALE OF ADVICE REGISTER (REGULATION 19(1))', margin, y);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('• Reco #R-401 (Rahul Verma): Switch to Parag Parikh Flexi Cap Direct. Rationale: 0.82% TER delta, high portfolio fit with aggressive profile.', margin, y + 5);
    doc.text('• Reco #R-402 (Sharma Family): Allocate 12% to SGB Series IV. Rationale: Sovereign gold sovereign hedge, matching moderate risk goal.', margin, y + 11);

    y = 138;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('3. STATUTORY FEE CAP VERIFICATION (REGULATION 15A)', margin, y);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('• Maximum fee charged per family: INR 35,000 p.a. (Fully compliant with SEBI statutory ceiling of INR 1,25,000 p.a.)', margin, y + 5);
    doc.text('• Mode of Receipt: Direct Bank Transfer (NEFT/RTGS). Zero cash transactions.', margin, y + 11);

    y = 168;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('4. CONFLICT OF INTEREST & COMMISSION DECLARATION', margin, y);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('• The RIA hereby solemnly declares that NO commissions, kickbacks, soft dollars, or distributor trail fees were received', margin, y + 5);
    doc.text('  from any Asset Management Company (AMC), Broker, or NBFC during the audit period.', margin, y + 10);
    doc.text('• All recommendations were restricted exclusively to DIRECT schemes of Mutual Funds.', margin, y + 15);

    y = 220;
    doc.text('________________________________________', margin, y);
    doc.text('SIGNATURE & STAMP OF SEBI REGISTERED ADVISER', margin, y + 5);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 140, y + 5);

    doc.save('SEBI_Inspection_Audit_Binder_FY25.pdf');
  }

  const relevanceConfig = {
    high: { color: 'var(--red)', bg: 'var(--red-glow)', label: '🔴 High Relevance' },
    medium: { color: 'var(--gold)', bg: 'var(--gold-glow)', label: '🟡 Medium Relevance' },
    low: { color: 'var(--text-muted)', bg: 'var(--surface-raised)', label: '⚪ Low Relevance' },
  };

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 className="text-h1">🔍 Compliance Watchdog & Audit OS</h1>
          <p className="text-sm text-secondary mt-1">AI monitors SEBI circulars and automates your mandatory inspection audit records</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('circulars')}
            className={`btn btn-sm ${activeTab === 'circulars' ? 'btn-primary' : 'btn-secondary'}`}
          >
            📡 SEBI Circulars Monitor
          </button>
          <button
            onClick={() => setActiveTab('binder')}
            className={`btn btn-sm ${activeTab === 'binder' ? 'btn-primary' : 'btn-secondary'}`}
          >
            ⚖️ SEBI Inspection Audit Binder
          </button>
        </div>
      </div>

      {activeTab === 'binder' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                <ShieldCheck size={13} /> 100% AUDIT READY
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>SEBI Inspection Compliance Dossier (FY 2024-25)</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                Meera Kapoor, RIA · Registration No. INA000014523 · BASL ID: 1092
              </p>
            </div>
            <button onClick={downloadAuditBinderPDF} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Download size={14} /> Download Official SEBI Binder (PDF)
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'var(--surface-raised)', borderRadius: 10, padding: '1rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-light)', marginBottom: '0.5rem' }}>
                1. Client Risk Profiles (Reg 16)
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <div>• Rahul Verma: <strong>Score 78 (Aggressive)</strong> · OTP Signed</div>
                <div>• Sharma Family: <strong>Score 52 (Moderate)</strong> · OTP Signed</div>
                <div>• Aniket Roy: <strong>Score 31 (Conservative)</strong> · OTP Signed</div>
              </div>
            </div>

            <div style={{ background: 'var(--surface-raised)', borderRadius: 10, padding: '1rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4ade80', marginBottom: '0.5rem' }}>
                2. Rationale Register (Reg 19)
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <div>• Reco #R-401: Direct flexi-cap switch (TER saving 0.82%)</div>
                <div>• Reco #R-402: SGB gold allocation (Hedge matched)</div>
                <div>• 100% timestamped audit trail preserved for 5 years</div>
              </div>
            </div>

            <div style={{ background: 'var(--surface-raised)', borderRadius: 10, padding: '1rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f59e0b', marginBottom: '0.5rem' }}>
                3. Fee Cap & Conflict Logs (Reg 15A)
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <div>• Max Fee Charged: <strong>₹35,000 p.a.</strong> (Cap: ₹1.25L)</div>
                <div>• Zero commissions received from any AMC or distributor</div>
                <div>• 100% Direct schemes only</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'circulars' && (
        <>
          {/* Status bar */}
          {lastScanned && (
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🛡️</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>SEBI Circulars Monitor</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Last scanned: {lastScanned.toLocaleTimeString('en-IN')} · Source: {source === 'live' ? '✅ Live sebi.gov.in' : '📋 Cached data'}
              </div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.5rem', color: 'var(--primary)' }}>{circulars.length}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Circulars</div>
            </div>
          </div>
        </div>
      )}

      {/* Circular list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {circulars.map(c => {
          const analysisData = analysis[c.id];
          const isAnalyzing = analyzingId === c.id;
          const isExpanded = expanded[c.id];
          const catColor = CATEGORY_COLORS[c.category] || 'var(--text-muted)';
          const relevance = analysisData ? relevanceConfig[analysisData.relevance] : null;

          return (
            <div key={c.id} className="card" style={{ border: relevance?.color ? `1px solid ${relevance.color}30` : '1px solid var(--glass-border)' }}>
              {/* Circular header */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.6875rem', background: catColor + '20', color: catColor, border: `1px solid ${catColor}40`, borderRadius: 999, padding: '0.15rem 0.45rem', fontWeight: 500 }}>{c.category}</span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{c.date}</span>
                    {c.circularNo && <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{c.circularNo}</span>}
                    {relevance && <span style={{ fontSize: '0.6875rem', color: relevance.color, fontWeight: 600, marginLeft: 'auto' }}>{relevance.label}</span>}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.4 }}>{c.title}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                  <a href={c.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-icon btn-sm"><ExternalLink size={13} /></a>
                  {!analysisData ? (
                    <button className="btn btn-primary btn-sm" onClick={() => analyzeCircular(c)} disabled={isAnalyzing} style={{ whiteSpace: 'nowrap' }}>
                      {isAnalyzing ? <><RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing…</> : '✦ Analyze Impact'}
                    </button>
                  ) : (
                    <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(e => ({ ...e, [c.id]: !e[c.id] }))}>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  )}
                </div>
              </div>

              {/* Analysis panel */}
              {analysisData && isExpanded && (
                <div style={{ marginTop: '0.875rem', paddingTop: '0.875rem', borderTop: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.75rem', animation: 'fade-in 0.2s ease' }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}><strong style={{ color: 'var(--text-primary)' }}>Summary:</strong> {analysisData.summary}</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}><strong style={{ color: 'var(--text-primary)' }}>Impact on your practice:</strong> {analysisData.impactOnAdvisor}</p>

                  {analysisData.actions?.length > 0 && (
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.5rem' }}>Required Actions:</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {analysisData.actions.map((a, i) => (
                          <div key={i} style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem 0.75rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', alignItems: 'center' }}>
                            <span className={`badge ${a.priority === 'high' ? 'badge-red' : a.priority === 'medium' ? 'badge-gold' : 'badge-surface'}`}>{a.deadline}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{a.action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysisData.riskIfIgnored && (
                    <div style={{ background: 'var(--red-glow)', borderRadius: 'var(--radius)', padding: '0.625rem 0.875rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <AlertTriangle size={14} style={{ color: 'var(--red)', flexShrink: 0, marginTop: 2 }} />
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--red)' }}>Risk if ignored: </strong>{analysisData.riskIfIgnored}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  )}
    </div>
  );
}

const FALLBACK_CIRCULARS = [
  { id: 'f1', date: '10-Sep-2026', title: 'Review of Expense Ratio Limits for Mutual Fund Schemes', circularNo: 'SEBI/HO/IMD/P/CIR/2026/0123', category: 'Mutual Funds', url: 'https://www.sebi.gov.in' },
  { id: 'f2', date: '05-Sep-2026', title: 'Amendment to SEBI (Investment Advisers) Regulations — Enhanced Client Reporting', circularNo: 'SEBI/HO/MIRSD/IA/P/CIR/2026/0119', category: 'RIA/Advisory', url: 'https://www.sebi.gov.in' },
  { id: 'f3', date: '29-Aug-2026', title: 'Algorithmic Trading — Mandatory Pre-Trade Risk Controls', circularNo: 'SEBI/HO/MRD/TPD/P/CIR/2026/0115', category: 'Algo Trading', url: 'https://www.sebi.gov.in' },
];

const FALLBACK_ANALYSIS = {
  relevance: 'high',
  summary: 'This circular introduces enhanced reporting requirements for registered investment advisers, effective Q1 FY2027.',
  impactOnAdvisor: 'As a SEBI RIA, you will need to update your quarterly client reporting template to include new disclosures on risk-adjusted returns and conflict of interest statements.',
  affectedClients: 'All 12 clients under your management will require updated disclosure documents.',
  actions: [
    { deadline: 'Dec 31, 2026', action: 'Update client agreement and disclosure document templates', priority: 'high' },
    { deadline: 'Jan 15, 2027', action: 'Send updated disclosures to all existing clients', priority: 'high' },
  ],
  riskIfIgnored: 'Non-compliance may result in SEBI show-cause notice and potential suspension of RIA license.',
};
