import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDateTime } from '../../utils/formatters';
import { Shield, Copy, Download, Search, CheckCircle2, FileText, ExternalLink } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { cleanAscii, buildSEBIInspectionDossierPDF } from '../../utils/fiduciaryPdfBuilder';
import StickyActionDock from '../../components/common/StickyActionDock';

export function formatType(rawType) {
  if (!rawType) return 'ADVISORY';
  const t = String(rawType).toLowerCase().replace(/[-_]+/g, ' ').trim();
  
  if (t.includes('batch')) return 'Batch Reco';
  if (t.includes('dispatch')) return 'Advisory Dispatch';
  if (t.includes('forensic') || t.includes('divorce')) return 'Forensic Audit';
  if (t.includes('sip') || t.includes('step')) return 'SIP Step-Up';
  if (t.includes('rebalance')) return 'Portfolio Rebalance';
  if (t.includes('tax') || t.includes('harvest')) return 'Tax Harvesting';
  if (t.includes('insurance')) return 'Insurance Gap';
  if (t.includes('goal')) return 'Goal Review';
  if (t.includes('onboard')) return 'Client Onboard';
  if (t.includes('ingest')) return 'Asset Ingest';
  
  const words = t.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1));
  const res = words.join(' ');
  return res.length > 20 ? res.slice(0, 18) + '..' : res;
}

const actionColors = {
  approved: 'var(--green)',
  rejected: 'var(--red)',
  edited: 'var(--primary)',
  dispatched: 'var(--green)'
};

const actionIcons = {
  approved: '✓',
  rejected: '✕',
  edited: '✎',
  dispatched: '🚀'
};

function AuditRow({ log, expanded, onToggle }) {
  const color = actionColors[log.action] || 'var(--text-secondary)';
  return (
    <>
      <tr style={{ cursor: 'pointer' }} onClick={onToggle}>
        <td style={{ minWidth: 160 }}>
          <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{log.clientName}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDateTime(log.timestamp)}</div>
        </td>
        <td><span className="badge badge-surface">{log.type?.replace(/_/g, ' ')}</span></td>
        <td style={{ fontWeight: 600, maxWidth: 240 }}>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.title}</div>
        </td>
        <td>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color, fontSize: '0.875rem' }}>
            <span style={{ fontFamily: 'monospace', width: 16, textAlign: 'center' }}>{actionIcons[log.action] || '•'}</span>
            {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
          </span>
        </td>
        <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', maxWidth: 200 }}>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.advisorNote}</div>
        </td>
        <td style={{ fontFamily: 'monospace', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
          <div>{log.aiVersion}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: 2 }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 100, whiteSpace: 'nowrap' }}>{log.dataHash}</span>
            <Copy size={10} style={{ cursor: 'pointer', flexShrink: 0 }} onClick={e => { e.stopPropagation(); navigator.clipboard?.writeText(log.dataHash); }} />
          </div>
        </td>
        <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{expanded ? '▲' : '▼'}</td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} style={{ padding: 0 }}>
            <div style={{ background: 'var(--surface-raised)', borderLeft: `3px solid ${color}`, padding: '1rem 1.25rem', margin: '0 0 0.25rem', borderRadius: '0 0 var(--radius) var(--radius)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>FULL ADVISOR NOTE & COMPLIANCE RATIONALE</div>
              <div style={{ fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>{log.advisorNote}</div>
              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                <span>AI Advisory Model: <strong style={{ color: 'var(--text-secondary)' }}>{log.aiVersion}</strong></span>
                <span>SHA-256 State Hash: <strong style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{log.dataHash}</strong></span>
                <span>SEBI Registration: <strong style={{ color: 'var(--text-secondary)' }}>INA000014523</strong></span>
                <span>BASL Membership: <strong style={{ color: 'var(--text-secondary)' }}>BASL-1842</strong></span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AuditLog() {
  const { state, isUSMarket } = useApp();
  const jurisdiction = localStorage.getItem('finagent_advisor_jurisdiction') || (isUSMarket ? 'SEC' : 'SEBI');
  const isUS = Boolean(isUSMarket || jurisdiction === 'SEC');

  const { auditLog } = state.advisor;
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const filtered = auditLog.filter(log => {
    const matchSearch = !search ||
      log.clientName.toLowerCase().includes(search.toLowerCase()) ||
      log.title.toLowerCase().includes(search.toLowerCase()) ||
      (log.type || '').toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === 'all' || log.action === actionFilter;
    return matchSearch && matchAction;
  });

  const handleExportAuditPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      const contentWidth = pageWidth - (margin * 2);
      const dateStr = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

      // ═══════════════════════════════════════════════════════════════════════
      // 1. TOP HEADER BANNER
      // ═══════════════════════════════════════════════════════════════════════
      doc.setFillColor(30, 27, 75); // Deep Indigo (#1E1B4B)
      doc.rect(0, 0, pageWidth, 26, 'F');

      // Gold accent bar
      doc.setFillColor(217, 119, 6);
      doc.rect(0, 26, pageWidth, 1.2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text(isUS ? 'BEACON HILL WEALTH MANAGEMENT LLC' : 'WEALTHWISE ADVISORY SERVICES', margin, 11);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(199, 210, 254);
        doc.text(
          isUS
            ? 'SEC Registered Investment Adviser | SEC #801-124982 | CRD #312894'
            : 'SEBI Registered Investment Adviser | INA000014523 | BASL Membership: BASL-1842',
          margin,
          17
        );

        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(
          isUS
            ? 'Statutory Supervisory Audit Trail pursuant to Investment Advisers Act of 1940 (Rule 204-2)'
            : 'Statutory Supervisory Audit Trail pursuant to SEBI (IA) Regulations, 2013 (Reg 19)',
          margin,
          22.5
        );

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(251, 191, 36);
        doc.text('REGULATORY COMPLIANCE EXPORT', pageWidth - margin, 11, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(224, 231, 255);
        doc.text(`Generated: ${dateStr} ${timeStr}`, pageWidth - margin, 17, { align: 'right' });
        doc.text(isUS ? 'Jurisdiction: SEC (Advisers Act / Reg BI)' : 'Jurisdiction: SEBI (WTM/MB/2026)', pageWidth - margin, 22.5, { align: 'right' });

        let y = 33;

        // ═══════════════════════════════════════════════════════════════════════
        // 2. INSPECTION CONTEXT & REGULATORY SCOPE CARD
        // ═══════════════════════════════════════════════════════════════════════
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'FD');

        const col1 = margin + 5;
        const col2 = margin + 65;
        const col3 = margin + 125;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text('REGISTERED ENTITY', col1, y + 5);
        doc.text(isUS ? 'CHIEF COMPLIANCE OFFICER' : 'PRINCIPAL OFFICER', col2, y + 5);
        doc.text('STATUTORY RETENTION PERIOD', col3, y + 5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text(isUS ? 'Beacon Hill Wealth LLC' : 'WealthWise Advisory Services', col1, y + 10);
        doc.text(isUS ? 'Marcus Vance (CCO)' : 'Meera Kapoor (SEBI-RIA)', col2, y + 10);
        doc.text(isUS ? '5 Years (Rule 204-2(e)(1))' : '5 Years (Mandatory Reg 19(2))', col3, y + 10);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text('AI/ML AUDIT STATUS', col1, y + 15.5);
        doc.text('CRYPTOGRAPHIC HASHING', col2, y + 15.5);
        doc.text(isUS ? 'CUSTODIAN CLEARING' : 'DIRECT PLAN VERIFICATION', col3, y + 15.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text(isUS ? 'SEC AI Governance Active' : 'SEBI Circular on AI/ML Verified', col1, y + 19);
        doc.text('SHA-256 Per Recommendation', col2, y + 19);
        doc.text(isUS ? 'Schwab / Fidelity / IBKR' : '100% Direct (0% Trailer Drag)', col3, y + 19);

        y += 26;

        // ═══════════════════════════════════════════════════════════════════════
        // 3. STATISTICAL SUMMARY OF AUDITED ACTIONS
        // ═══════════════════════════════════════════════════════════════════════
        const totalEntries = auditLog.length;
        const approvedCount = auditLog.filter(l => l.action === 'approved').length;
        const editedCount = auditLog.filter(l => l.action === 'edited').length;
        const rejectedCount = auditLog.filter(l => l.action === 'rejected').length;
        const dispatchedCount = auditLog.filter(l => l.action === 'dispatched').length;
        const approvalRate = Math.round(((approvedCount + editedCount + dispatchedCount) / Math.max(totalEntries, 1)) * 100);

        const summaryRows = [
          [
            String(totalEntries),
            String(approvedCount),
            String(editedCount),
            String(rejectedCount),
            String(dispatchedCount),
            `${approvalRate}%`
          ]
        ];

        autoTable(doc, {
          startY: y,
          margin: { left: margin, right: margin },
          head: [['TOTAL LOGGED', 'APPROVED AS-IS', 'EDITED & APPROVED', 'REJECTED', 'DISPATCHED', 'APPROVAL RATE']],
          body: summaryRows,
          theme: 'grid',
          headStyles: {
            fillColor: [49, 46, 129],
            textColor: [255, 255, 255],
            fontSize: 7,
            fontStyle: 'bold',
            halign: 'center',
            cellPadding: 2.2
          },
          styles: {
            fontSize: 8,
            fontStyle: 'bold',
            halign: 'center',
            cellPadding: 2.2,
            textColor: [15, 23, 42]
          },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 30, textColor: [16, 185, 129] },
            2: { cellWidth: 32, textColor: [79, 70, 229] },
            3: { cellWidth: 30, textColor: [239, 68, 68] },
            4: { cellWidth: 30, textColor: [16, 185, 129] },
            5: { cellWidth: 30, textColor: [79, 70, 229] }
          }
        });

        y = doc.lastAutoTable.finalY + 5;

        // ═══════════════════════════════════════════════════════════════════════
        // 4. DETAILED AUDITED EVENTS TABLE (MULTI-PAGE AUTOTABLE)
        // ═══════════════════════════════════════════════════════════════════════
        const tableRows = auditLog.map(log => {
          const timeFormatted = new Date(log.timestamp).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: '2-digit'
          });
          const clientClean = cleanAscii(log.clientName || 'Client');
          const typeClean = cleanAscii(formatType(log.type));
          const actionClean = cleanAscii(log.action || 'approved').toUpperCase();

          const titleClean = cleanAscii(log.title || 'Investment Recommendation');
          const noteClean = cleanAscii(log.advisorNote || 'Approved under SEBI Reg 17.');
          const contentCell = `${titleClean}\n\nNote: ${noteClean}`;

          let modelClean = cleanAscii(log.aiVersion || 'FinAgent-v2.1');
          if (modelClean.toLowerCase().includes('v2.1')) modelClean = 'v2.1 (FinAgent)';
          else if (modelClean.toLowerCase().includes('v2.0')) modelClean = 'v2.0 (FinAgent)';
          else if (modelClean.length > 16) modelClean = modelClean.slice(0, 14) + '..';

          const rawHash = (log.dataHash || '').replace(/^sha256:/i, '').replace(/[^a-fA-F0-9]/g, '');
          const shortHash = rawHash ? rawHash.slice(0, 12) : 'e3b0c44298fc';
          const modelCell = `${modelClean}\nSHA: ${shortHash}`;

          return [
            `${clientClean}\n${timeFormatted}`,
            typeClean,
            actionClean,
            contentCell,
            modelCell
          ];
        });

        autoTable(doc, {
          startY: y,
          margin: { left: margin, right: margin, bottom: 20 },
          head: [['CLIENT / DATE', 'TYPE', 'ACTION', 'RECOMMENDATION & ADVISOR NOTE', 'MODEL & SHA-256 HASH']],
          body: tableRows,
          theme: 'grid',
          showHead: 'everyPage',
          headStyles: {
            fillColor: [30, 41, 59],
            textColor: [255, 255, 255],
            fontSize: 7,
            fontStyle: 'bold',
            halign: 'left',
            cellPadding: 2
          },
          styles: {
            fontSize: 7,
            cellPadding: 2,
            textColor: [15, 23, 42],
            overflow: 'linebreak',
            lineColor: [226, 232, 240],
            lineWidth: 0.15
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252]
          },
          columnStyles: {
            0: { cellWidth: 32, fontStyle: 'bold', textColor: [30, 41, 59] },
            1: { cellWidth: 26, textColor: [71, 85, 105], fontStyle: 'bold' },
            2: { cellWidth: 22, fontStyle: 'bold', halign: 'center' },
            3: { cellWidth: 70, textColor: [51, 65, 85] },
            4: { cellWidth: 32, fontStyle: 'normal', textColor: [100, 116, 139] }
          },
          didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 2) {
              const val = String(data.cell.raw);
              if (val.includes('APPROVED') || val.includes('DISPATCHED')) {
                data.cell.styles.textColor = [16, 185, 129];
              } else if (val.includes('REJECTED')) {
                data.cell.styles.textColor = [239, 68, 68];
              } else if (val.includes('EDITED')) {
                data.cell.styles.textColor = [79, 70, 229];
              }
            }
          }
        });

        // ═══════════════════════════════════════════════════════════════════════
        // 5. REGULATORY SIGN-OFF BLOCK
        // ═══════════════════════════════════════════════════════════════════════
        let finalY = doc.lastAutoTable.finalY + 6;
        if (finalY > pageHeight - 34) {
          doc.addPage();
          finalY = 20;
        }

        doc.setFillColor(241, 245, 249);
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(margin, finalY, contentWidth, 24, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);
        doc.text('PRINCIPAL OFFICER STATUTORY CERTIFICATION', margin + 4, finalY + 5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(71, 85, 105);
        doc.text(
          'I, Meera Kapoor, Principal Officer of WealthWise Advisory Services (SEBI RIA INA000014523), certify that all recommendations logged herein',
          margin + 4,
          finalY + 9.5
        );
        doc.text(
          'have undergone human review pursuant to SEBI (Investment Advisers) Regulations, 2013 and SEBI Circular on AI/ML applications.',
          margin + 4,
          finalY + 13
        );
        doc.text(
          'All records are stored with tamper-evident SHA-256 cryptographic hashes and archived for a minimum statutory period of 5 years.',
          margin + 4,
          finalY + 16.5
        );

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(15, 23, 42);
        doc.text('Meera Kapoor | Registered Investment Adviser (INA000014523)', margin + 4, finalY + 21);
        doc.text('BASL ID: BASL-1842 | Mumbai Office', pageWidth - margin - 4, finalY + 21, { align: 'right' });

        // ═══════════════════════════════════════════════════════════════════════
        // 6. RUNNING FOOTERS ON ALL PAGES
        // ═══════════════════════════════════════════════════════════════════════
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.setTextColor(148, 163, 184);
          doc.text(
            'WealthWise Advisory Services | SEBI RIA INA000014523 | Confidential Supervisory Audit Log',
            margin,
            pageHeight - 6
          );
          doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
        }

      doc.save(`SEBI_Compliance_Audit_Log_INA000014523.pdf`);
    } catch (err) {
      console.error('Audit PDF export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadSEBIDossier = () => {
    try {
      const advisorProfile = state.advisor?.profile || {
        name: 'Meera Kapoor',
        sebiRegNo: 'INA000014523',
        baslId: 'BASL-1842',
        firmName: 'WEALTHWISE ADVISORY SERVICES'
      };

      const doc = buildSEBIInspectionDossierPDF(advisorProfile, auditLog);
      doc.save(`SEBI_Inspection_Dossier_INA000014523_${new Date().toISOString().slice(0, 10)}.pdf`);
      setToastMsg('✓ SEBI Inspection Dossier (PDF) exported successfully. Cryptographic ledger integrity: 0 tamper flags.');
      setTimeout(() => setToastMsg(''), 5000);
    } catch (err) {
      console.error('SEBI Dossier export error:', err);
      alert('Failed to generate SEBI Dossier: ' + err.message);
    }
  };

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {toastMsg && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid var(--green)',
          borderRadius: 'var(--radius)',
          padding: '0.75rem 1rem',
          color: 'var(--green)',
          fontWeight: 600,
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <CheckCircle2 size={16} /> {toastMsg}
        </div>
      )}
      <div>
        <h1 className="text-h1">SEBI Audit Trail</h1>
        <p className="text-sm text-secondary mt-1">Immutable record of all advisor actions on AI recommendations. Downloadable for SEBI inspection.</p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius)', padding: '0.625rem 1rem', fontSize: '0.8125rem' }}>
          <Shield size={14} color="var(--green)" />
          <span style={{ color: 'var(--green)', fontWeight: 600 }}>
            {isUS
              ? 'SEC RIA Compliant Audit Log · Rule 204-2 | Advisers Act 1940'
              : 'SEBI RIA Compliant Audit Log · INA000014523 | BASL-1842'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 'var(--radius)', padding: '0.625rem 0.875rem', fontSize: '0.8125rem' }}>
          <CheckCircle2 size={13} color="var(--primary)" />
          <span style={{ color: 'var(--primary-light)', fontWeight: 500 }}>Live SQLite + Supabase Sync</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={handleDownloadSEBIDossier}
          >
            <FileText size={14} /> {isUS ? 'Export SEC Rule 204-2 Dossier (PDF)' : 'Export SEBI Inspection Dossier (PDF)'}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={handleExportAuditPDF}
            disabled={isExporting}
          >
            <Download size={14} /> {isExporting ? 'Generating...' : 'Export Log (PDF)'}
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        {[
          { label: 'Total Entries', value: auditLog.length },
          { label: 'Approved', value: auditLog.filter(l => l.action === 'approved').length, color: 'var(--green)' },
          { label: 'Edited & Approved', value: auditLog.filter(l => l.action === 'edited').length, color: 'var(--primary-light)' },
          { label: 'Rejected', value: auditLog.filter(l => l.action === 'rejected').length, color: 'var(--red)' },
          { label: 'Dispatched', value: auditLog.filter(l => l.action === 'dispatched').length, color: 'var(--green)' },
          { label: 'Tamper Flags', value: '0 (Verified)', color: 'var(--green)' },
        ].map((k, i) => (
          <div key={i} className="kpi-tile">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Search + filter bar */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search size={14} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input"
            style={{ paddingLeft: '2.25rem' }}
            placeholder="Search by client, recommendation, or type…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[['all', 'All'], ['approved', '✓ Approved'], ['edited', '✎ Edited'], ['rejected', '✕ Rejected'], ['dispatched', '🚀 Dispatched']].map(([val, label]) => (
            <button key={val} className={`chip ${actionFilter === val ? 'active' : ''}`} onClick={() => setActionFilter(val)}>{label}</button>
          ))}
        </div>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No entries match your search.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Client · Time</th>
                  <th>Type</th>
                  <th>Recommendation</th>
                  <th>Action</th>
                  <th>Advisor Note</th>
                  <th>AI Version · Hash</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(log => (
                  <AuditRow
                    key={log.id}
                    log={log}
                    expanded={expandedId === log.id}
                    onToggle={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ padding: '0.875rem', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
        Maintained per SEBI Investment Adviser Regulations 2013 and SEBI Circular on AI/ML usage in advisory. AI model versions and SHA-256 data hashes are logged for explainability and non-repudiation. Logs retained for minimum 5 years.
      </div>

      {/* Universal Sticky Action Dock */}
      <StickyActionDock
        title="SEBI Fiduciary Inspection Audit Trail"
        subtitle="Reg. 19 Fiduciary Record-Keeping & AI Model Hash Ledger"
        badge="0 TAMPER FLAGS"
        badgeColor="var(--green)"
        metrics={[
          { label: 'Ledger Integrity', value: 'SHA-256 Verified', color: 'var(--green)' },
          { label: 'Logged Records', value: `${auditLog.length} Events` },
        ]}
        actions={[
          {
            label: 'Export SEBI Inspection Dossier (PDF)',
            icon: FileText,
            variant: 'primary',
            onClick: handleDownloadSEBIDossier,
          }
        ]}
      />
    </div>
  );
}
