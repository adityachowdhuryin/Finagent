import React, { useState, useEffect } from 'react';
import {
  RefreshCw, ExternalLink, ChevronDown, ChevronUp, AlertTriangle,
  Download, ShieldCheck, FileCheck, Award, FileText, CheckCircle2,
  Sparkles, Building2, HelpCircle, ArrowRight, ShieldAlert, Scale
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { analyze } from '../../../services/geminiService';
import { useApp } from '../../../context/AppContext';
import { cleanAscii } from '../../../utils/fiduciaryPdfBuilder';

const SEC_CATEGORY_COLORS = {
  'Fiduciary Duty & Reg BI': 'var(--primary)',
  'Marketing Rule': 'var(--purple)',
  'AI & Algorithmic Models': 'var(--cyan)',
  'Cybersecurity & Reg S-P': 'var(--gold)',
  'Books & Records Rule 204-2': 'var(--red)',
  'Custody Rule': 'var(--green)',
  'General': 'var(--text-muted)',
};

export default function SECComplianceWatchdog() {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState('alerts');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [analysis, setAnalysis] = useState({});
  const [lastScanned, setLastScanned] = useState(null);

  // Form ADV State
  const [formAdvData, setFormAdvData] = useState(null);
  const [loadingAdv, setLoadingAdv] = useState(false);

  // Form CRS State
  const [formCrsData, setFormCrsData] = useState(null);
  const [loadingCrs, setLoadingCrs] = useState(false);

  useEffect(() => {
    loadSecAlerts();
    loadFormAdv();
    loadFormCrs();
  }, []);

  async function loadSecAlerts() {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/sec/alerts');
      const data = await res.json();
      if (data.success && data.alerts?.length > 0) {
        setAlerts(data.alerts);
        setLastScanned(new Date());
      }
    } catch (e) {
      console.warn('Failed to fetch SEC alerts:', e);
    } finally {
      setLoading(false);
    }
  }

  async function loadFormAdv() {
    setLoadingAdv(true);
    try {
      const res = await fetch('http://localhost:3001/api/sec/generate-form-adv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) setFormAdvData(data.formAdv);
    } catch (e) {
      console.warn('Failed to load Form ADV:', e);
    } finally {
      setLoadingAdv(false);
    }
  }

  async function loadFormCrs() {
    setLoadingCrs(true);
    try {
      const res = await fetch('http://localhost:3001/api/sec/generate-form-crs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) setFormCrsData(data.formCrs);
    } catch (e) {
      console.warn('Failed to load Form CRS:', e);
    } finally {
      setLoadingCrs(false);
    }
  }

  async function analyzeAlert(alertItem) {
    setAnalyzingId(alertItem.id);
    setExpanded(e => ({ ...e, [alertItem.id]: true }));
    try {
      const advisorProfile = {
        firmName: 'Beacon Hill Wealth Management LLC',
        secNumber: '801-124982',
        crdNumber: '312894',
        totalAUM: '$160.7M',
        discretionaryRatio: '89%',
        custodians: 'Charles Schwab Institutional, Fidelity Wealth, Interactive Brokers',
        clientTypes: 'High-Net-Worth Individuals, Family Trusts, Tech Founders',
        strategies: 'Direct Indexing Tax Harvesting, Core 3-Fund ETFs, Municipal Bond Ladders',
      };

      const prompt = `You are a senior SEC RIA compliance attorney. Analyze this SEC Risk Alert or FINRA Notice for a registered investment adviser under the Investment Advisers Act of 1940.

Alert Title: "${alertItem.title}"
Date: ${alertItem.date}
Agency: ${alertItem.agency}
Category: ${alertItem.category}
Summary: ${alertItem.summary}

Adviser Profile:
${JSON.stringify(advisorProfile, null, 2)}

Return JSON:
{
  "relevance": "high|medium|low",
  "summary": "2-sentence plain English fiduciary breakdown of what examiners are targeting",
  "impactOnAdvisor": "2-3 sentences on how this affects this RIA's client files, marketing, or rebalancing trading desks",
  "affectedClients": "Which type of client accounts (e.g. Taxable Trusts vs IRAs) are directly affected and why",
  "actions": [
    { "deadline": "date or 'Immediate'", "action": "specific compliance directive required", "priority": "high|medium|low" }
  ],
  "keyRules": ["statutory SEC / FINRA rules cited e.g. Rule 204-2, Reg BI, Rule 206(4)-1"],
  "riskIfIgnored": "Enforcement risks (deficiency letter, administrative cease-and-desist, civil penalties)"
}
Return ONLY valid JSON.`;

      const result = await analyze(prompt, 'json');
      setAnalysis(prev => ({
        ...prev,
        [alertItem.id]: result || {
          relevance: 'high',
          summary: alertItem.summary,
          impactOnAdvisor: alertItem.impact,
          actions: alertItem.actionsRequired.map((a, i) => ({ deadline: 'Immediate', action: a, priority: 'high' })),
          riskIfIgnored: 'SEC exam deficiency finding resulting in public enforcement referral.',
        }
      }));
    } catch {
      setAnalysis(prev => ({
        ...prev,
        [alertItem.id]: {
          relevance: 'high',
          summary: alertItem.summary,
          impactOnAdvisor: alertItem.impact,
          actions: alertItem.actionsRequired.map((a, i) => ({ deadline: 'Immediate', action: a, priority: 'high' })),
          riskIfIgnored: 'SEC exam deficiency finding resulting in public enforcement referral.',
        }
      }));
    } finally {
      setAnalyzingId(null);
    }
  }

  function downloadFormAdvPDF() {
    if (!formAdvData) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2);

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 28, pageWidth, 1.2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text('SEC FORM ADV PART 2A: FIRM BROCHURE', margin, 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(191, 219, 254);
    doc.text('Investment Advisers Act of 1940 Fiduciary Disclosure Statement', margin, 17);
    doc.text(`Firm: ${cleanAscii(formAdvData.header?.firmName)} | CRD: ${cleanAscii(formAdvData.header?.crdNumber)} | SEC: ${cleanAscii(formAdvData.header?.secNumber)}`, margin, 23);

    let y = 36;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('SCHEDULE OF ADVISORY FEES & ASSETS UNDER MANAGEMENT', margin, y);
    y += 6;

    const feeRows = (formAdvData.feeSchedule || []).map(f => [
      cleanAscii(f.tier),
      cleanAscii(f.rate),
      `${f.bps} bps`,
      'Quarterly in advance/arrears via Custodian direct debit'
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['AUM TIER', 'ANNUAL RATE', 'BASIS POINTS', 'BILLING CONVENTION']],
      body: feeRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 7.5, fontStyle: 'bold' },
      styles: { fontSize: 7, textColor: [15, 23, 42] },
    });

    y = doc.lastAutoTable.finalY + 8;

    // Sections
    (formAdvData.sections || []).forEach(sec => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 58, 138);
      doc.text(cleanAscii(sec.item), margin, y);
      y += 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(51, 65, 85);
      const lines = doc.splitTextToSize(cleanAscii(sec.narrative), contentWidth);
      doc.text(lines, margin, y);
      y += (lines.length * 3.4) + 6;
    });

    doc.save(`SEC_Form_ADV_Part2A_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  function downloadFormCrsPDF() {
    if (!formCrsData) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2);

    // Header
    doc.setFillColor(30, 27, 75);
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 28, pageWidth, 1.2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text('SEC FORM CRS: CLIENT RELATIONSHIP SUMMARY', margin, 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(199, 210, 254);
    doc.text('Mandated 2-Page Standardized Fiduciary Summary under SEC Rule 17a-14', margin, 17);
    doc.text(`Firm: ${cleanAscii(formCrsData.header?.firmName)} · CRD #${cleanAscii(formCrsData.header?.crdNumber)} · ${cleanAscii(formCrsData.header?.effectiveDate)}`, margin, 23);

    let y = 36;
    (formCrsData.sections || []).forEach((sec, idx) => {
      if (y > 255) {
        doc.addPage();
        y = 20;
      }

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      
      const contentLines = doc.splitTextToSize(cleanAscii(sec.content), contentWidth - 8);
      const starterLines = doc.splitTextToSize(`Conversation Starter: "${cleanAscii(sec.conversationStarter)}"`, contentWidth - 8);
      const boxHeight = (contentLines.length * 3.4) + (starterLines.length * 3.2) + 14;

      doc.roundedRect(margin, y, contentWidth, boxHeight, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text(cleanAscii(sec.question), margin + 4, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text(contentLines, margin + 4, y + 10);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.8);
      doc.setTextColor(16, 185, 129);
      doc.text(starterLines, margin + 4, y + 10 + (contentLines.length * 3.4) + 3);

      y += boxHeight + 4;
    });

    doc.save(`SEC_Form_CRS_Client_Summary_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  function downloadAuditBinderPDF() {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2);

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setFillColor(239, 68, 68);
    doc.rect(0, 28, pageWidth, 1.2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text('SEC BOOKS & RECORDS RULE 204-2 INSPECTION DOSSIER', margin, 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(254, 202, 202);
    doc.text('Contemporaneous Fiduciary Audit Trail & Examination Evidence', margin, 17);
    doc.text('Firm: Beacon Hill Wealth Management LLC | CRD #312894 | SEC #801-124982', margin, 23);

    let y = 36;
    const auditRecords = [
      ['Rule 204-2(a)(7)', 'Written Client Communications & Recommendations', '100% Archival via FinAgent Portal', 'Compliant'],
      ['Rule 204-2(a)(10)', 'Written Supervisory Procedures (WSPs) & Code of Ethics', 'Annual CCO Attestation Signed Jan 2026', 'Compliant'],
      ['Rule 204-2(a)(14)', 'Form ADV Part 2A & Form CRS Delivery Confirmations', 'Electronic Signatures on File for 142 Clients', 'Compliant'],
      ['Rule 206(4)-1', 'Marketing Rule Performance Substantiation Files', 'Contemporaneous Bloomberg/Morningstar Source Data', 'Compliant'],
      ['Reg S-P', 'Safeguarding Customer Records & Incident Response Plan', 'AES-256 Cloud Encryption, Zero Breaches Recorded', 'Compliant'],
    ];

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['STATUTORY CITATION', 'EXAMINATION REQUIREMENT', 'FIRM SUBSTANTIATION EVIDENCE', 'CCO STATUS']],
      body: auditRecords,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 7.5, fontStyle: 'bold' },
      styles: { fontSize: 7, textColor: [15, 23, 42] },
    });

    doc.save(`SEC_Books_And_Records_Rule_204_2_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.75rem' }}>🛡️</span>
            <h1 className="text-h1" style={{ margin: 0 }}>SEC RIA Compliance Watchdog</h1>
            <span className="badge badge-primary">Advisers Act of 1940</span>
          </div>
          <p className="text-sm text-secondary" style={{ margin: 0 }}>
            Surveillance of SEC Division of Examinations Risk Alerts, Form ADV Part 2A/2B brochures, Form CRS (Rule 17a-14), and Books & Records Rule 204-2.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ padding: '0.4rem 0.8rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            🏛️ <strong>Beacon Hill Wealth LLC</strong> · SEC # 801-124982 · CRD # 312894
          </div>
          <button
            onClick={downloadAuditBinderPDF}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Download size={14} /> Rule 204-2 Binder (PDF)
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
        <button
          className={`btn btn-sm ${activeTab === 'alerts' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('alerts')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <ShieldAlert size={14} /> SEC Risk Alerts & FINRA Notices ({alerts.length})
        </button>

        <button
          className={`btn btn-sm ${activeTab === 'adv' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('adv')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <FileText size={14} /> Form ADV Part 2A / 2B Studio
        </button>

        <button
          className={`btn btn-sm ${activeTab === 'crs' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('crs')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <FileCheck size={14} /> Form CRS (Rule 17a-14)
        </button>

        <button
          className={`btn btn-sm ${activeTab === 'records' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('records')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Scale size={14} /> Books & Records Rule 204-2 Audit
        </button>
      </div>

      {/* TAB 1: SEC RISK ALERTS */}
      {activeTab === 'alerts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {lastScanned && (
            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>📡</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>SEC & FINRA Regulatory Feed Active</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Monitored: SEC Division of Examinations, Enforcement Division, FINRA Regulatory Notices.
                  </div>
                </div>
              </div>
              <button onClick={loadSecAlerts} disabled={loading} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                <span>Sync Alerts</span>
              </button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {alerts.map(a => {
              const analysisData = analysis[a.id];
              const isAnalyzing = analyzingId === a.id;
              const isExpanded = expanded[a.id];
              const catColor = SEC_CATEGORY_COLORS[a.category] || 'var(--text-muted)';

              return (
                <div key={a.id} className="card" style={{ border: a.urgency === 'CRITICAL' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.6875rem', background: catColor + '20', color: catColor, border: `1px solid ${catColor}40`, borderRadius: 999, padding: '0.15rem 0.45rem', fontWeight: 600 }}>
                          {a.agency} · {a.category}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.date}</span>
                        <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{a.alertNo}</span>
                        {a.urgency === 'CRITICAL' && <span className="badge badge-red">CRITICAL EXAM PRIORITY</span>}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.4 }}>{a.title}</div>
                      <p className="text-xs text-secondary" style={{ marginTop: '0.4rem', lineHeight: 1.5 }}>{a.summary}</p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                      <a href={a.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-icon btn-sm">
                        <ExternalLink size={14} />
                      </a>
                      {!analysisData ? (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => analyzeAlert(a)}
                          disabled={isAnalyzing}
                          style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          {isAnalyzing ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={13} />}
                          <span>{isAnalyzing ? 'Analyzing…' : '✦ Analyze Impact'}</span>
                        </button>
                      ) : (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setExpanded(e => ({ ...e, [a.id]: !e[a.id] }))}
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* AI Analysis Panel */}
                  {analysisData && isExpanded && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', marginBottom: 2 }}>FIDUCIARY IMPACT ON BEACON HILL WEALTH:</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{analysisData.impactOnAdvisor}</div>
                      </div>

                      {analysisData.actions?.length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>MANDATORY RIA ACTION ITEMS:</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            {analysisData.actions.map((act, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-raised)', padding: '0.45rem 0.75rem', borderRadius: 6, fontSize: '0.8rem' }}>
                                <span className={`badge ${act.priority === 'high' ? 'badge-red' : 'badge-surface'}`} style={{ fontSize: '0.65rem' }}>{act.deadline}</span>
                                <span style={{ color: 'var(--text-secondary)' }}>{act.action}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {analysisData.riskIfIgnored && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid var(--red)', borderRadius: 6, padding: '0.6rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <AlertTriangle size={15} color="var(--red)" />
                          <div style={{ fontSize: '0.75rem', color: 'var(--red)' }}>
                            <strong>Exam Deficiency Risk:</strong> {analysisData.riskIfIgnored}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: FORM ADV PART 2A */}
      {activeTab === 'adv' && formAdvData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>{formAdvData.header?.firmName}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                SEC Form ADV Part 2A (Firm Brochure) · Annual Updating Amendment · Effective {formAdvData.header?.effectiveDate}
              </div>
            </div>
            <button onClick={downloadFormAdvPDF} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Download size={14} /> Download Form ADV Part 2A (PDF)
            </button>
          </div>

          {/* Tiered Fee Schedule Table */}
          <div className="card">
            <h3 className="text-h3" style={{ marginBottom: '0.5rem' }}>Item 5: Fiduciary Tiered AUM Fee Schedule</h3>
            <p className="text-xs text-secondary" style={{ marginBottom: '1rem' }}>
              Fee-Only RIA structure. Zero commissions, zero 12b-1 mutual fund fees, zero soft-dollar conflicts.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
              {(formAdvData.feeSchedule || []).map((t, idx) => (
                <div key={idx} style={{ background: 'var(--surface-raised)', borderRadius: 8, padding: '0.85rem' }}>
                  <div className="text-xs text-muted">{t.tier}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--primary)', marginTop: 4 }}>
                    {t.rate} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>({t.bps} bps)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Core Brochure Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {(formAdvData.sections || []).map((sec, idx) => (
              <div key={idx} className="card" style={{ padding: '1rem 1.25rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '0.25rem' }}>
                  {sec.item}: {sec.title}
                </div>
                <p className="text-xs text-secondary" style={{ lineHeight: 1.6, margin: 0 }}>
                  {sec.narrative}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: FORM CRS (RULE 17A-14) */}
      {activeTab === 'crs' && formCrsData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>SEC Form CRS Client Relationship Summary</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Mandated 2-page standardized fiduciary disclosure document under SEC Exchange Act Rule 17a-14.
              </div>
            </div>
            <button onClick={downloadFormCrsPDF} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Download size={14} /> Download Form CRS (PDF)
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {(formCrsData.sections || []).map((sec, idx) => (
              <div key={idx} className="card" style={{ padding: '1rem 1.25rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  {sec.question}
                </div>
                <p className="text-xs text-secondary" style={{ lineHeight: 1.6, marginBottom: '0.75rem' }}>
                  {sec.content}
                </p>
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid var(--green)', borderRadius: 6, padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <HelpCircle size={15} color="var(--green)" />
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                    <strong>Mandated Conversation Starter: </strong>
                    <span style={{ fontStyle: 'italic', color: 'var(--green)' }}>"{sec.conversationStarter}"</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: BOOKS & RECORDS RULE 204-2 */}
      {activeTab === 'records' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>SEC Rule 204-2 Inspection Ready Dossier</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                5-year electronic recordkeeping repository covering client suitability, trade orders, and Reg BI conflict logs.
              </div>
            </div>
            <button onClick={downloadAuditBinderPDF} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Download size={14} /> Export Rule 204-2 Inspection Dossier (PDF)
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>
                <CheckCircle2 size={18} />
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>1. Client Suitability & W-9 (Rule 204-2(a)(7))</div>
              </div>
              <p className="text-xs text-secondary" style={{ lineHeight: 1.5 }}>
                142 verified client investment policy statements (IPS), risk tolerances, and custodian account opening documents.
              </p>
              <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--green)', fontWeight: 600 }}>
                ✓ 100% Contemporaneously Timestamped
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--green)' }}>
                <CheckCircle2 size={18} />
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>2. Rebalancing Trade Logs (Rule 204-2(a)(3))</div>
              </div>
              <p className="text-xs text-secondary" style={{ lineHeight: 1.5 }}>
                Full trade blotters showing broker-dealer order routing, execution prices, and best execution analyses across Schwab, Fidelity, and IBKR.
              </p>
              <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--green)', fontWeight: 600 }}>
                ✓ Zero Discretionary Unauthorized Trades
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--gold)' }}>
                <CheckCircle2 size={18} />
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>3. Custodian Direct Debit Fee Ledger (Rule 204-2(a)(2))</div>
              </div>
              <p className="text-xs text-secondary" style={{ lineHeight: 1.5 }}>
                Quarterly fee calculation statements reconciling basis points against client daily average AUM.
              </p>
              <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--green)', fontWeight: 600 }}>
                ✓ Clean Custody Invoice Audit
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
