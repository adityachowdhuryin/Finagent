// src/components/ai/cards/InChatDossierExportCard.jsx
// Interactive In-Chat Fiduciary Consultation Dossier PDF Export

import React, { useState } from 'react';
import { FileText, Download, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { buildFiduciaryDossierPDF } from '../../../utils/fiduciaryPdfBuilder';

export default function InChatDossierExportCard({ messages, userProfile, portfolioContext }) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    try {
      const doc = buildFiduciaryDossierPDF(messages || [], userProfile || {}, portfolioContext || {});
      const fileName = `FinAgent_Fiduciary_Consultation_Dossier_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
      setDownloaded(true);
    } catch (err) {
      console.error('[PDF Export Error]', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      style={{
        marginTop: '0.75rem',
        background: 'var(--surface-raised)',
        border: '1px solid var(--primary)',
        borderRadius: 12,
        padding: '0.85rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            background: 'rgba(99, 102, 241, 0.15)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FileText size={13} />
        </div>
        <span style={{ fontWeight: 800, fontSize: '0.825rem', color: 'var(--text-primary)' }}>
          SEBI RIA Consultation Dossier Ready
        </span>
      </div>

      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.65rem', lineHeight: 1.4 }}>
        This transcript has been compiled into an official A4 regulatory advisory dossier with registered RIA credentials (Meera Kapoor · INA000014523), timestamp, and SHA-256 integrity hash.
      </div>

      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        style={{
          width: '100%',
          background: downloaded ? 'rgba(16, 185, 129, 0.15)' : 'var(--primary)',
          color: downloaded ? 'var(--green)' : 'white',
          border: downloaded ? '1px solid var(--green)' : 'none',
          borderRadius: 8,
          padding: '0.55rem',
          fontWeight: 700,
          fontSize: '0.8rem',
          cursor: downloading ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
        }}
      >
        {downloaded ? (
          <>
            <CheckCircle2 size={14} />
            <span>Dossier Downloaded (PDF)</span>
          </>
        ) : downloading ? (
          <span>Generating PDF...</span>
        ) : (
          <>
            <Download size={14} />
            <span>Download Official Fiduciary Dossier (PDF)</span>
          </>
        )}
      </button>
    </div>
  );
}
