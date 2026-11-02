import React, { useState, useRef } from 'react';
import {
  UploadCloud, FileText, CheckCircle2, AlertCircle, FileCheck,
  Sparkles, ArrowRight, X, ExternalLink, ShieldCheck, Hash, Layers
} from 'lucide-react';
import { useTaxStudio } from '../../context/TaxStudioContext';

export default function UniversalDocumentDropzone({ isOpen, onClose }) {
  const { activeMarket, ingestedDocs, ingestDocument, parseAndIngestRealCsv } = useTaxStudio();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDocForDetails, setSelectedDocForDetails] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const fileInputRef = useRef(null);

  const isUS = activeMarket === 'US';

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file) => {
    if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const newDoc = parseAndIngestRealCsv(text, file.name);
        showToast(`Successfully parsed ${newDoc.name} — extracted ${newDoc.verifiedFieldsCount} real tax lot attributes!`);
      };
      reader.readAsText(file);
    } else {
      const newDoc = ingestDocument(file);
      showToast(`Successfully parsed ${newDoc.name} — synchronized ${newDoc.verifiedFieldsCount} fields with TaxStudioContext!`);
    }
  };

  const handleDemoDocLoad = (demoType) => {
    let mockFile;
    if (demoType === 'w2') {
      mockFile = new File(['mock content'], 'W-2_2026_TechCorp_Staff_Eng.pdf', { type: 'application/pdf' });
    } else if (demoType === '1099b') {
      mockFile = new File(['mock content'], '1099-B_Consolidated_Apex_Robinhood_2026.pdf', { type: 'application/pdf' });
    } else if (demoType === 'schwab_csv') {
      const csvData = `Symbol,Description,Quantity,Close Date,Cost Basis,Proceeds,Gain/Loss,Term
AAPL,Apple Inc.,100,02/14/2026,$18500.00,$24200.00,$5700.00,Short-Term
NVDA,NVIDIA Corp,50,02/18/2026,$21000.00,$38500.00,$17500.00,Long-Term
TSLA,Tesla Inc.,60,01/20/2026,$15800.00,$12400.00,-$3400.00,Short-Term`;
      mockFile = new File([csvData], 'Charles_Schwab_Realized_GainLoss_2026.csv', { type: 'text/csv' });
    } else if (demoType === 'zerodha_csv') {
      const csvData = `symbol,isin,trade_date,exchange,segment,series,trade_type,quantity,price,trade_id,order_id
RELIANCE,INE002A01018,2026-02-10,NSE,EQ,EQ,buy,100,2850.00,10928,948271
RELIANCE,INE002A01018,2026-03-05,NSE,EQ,EQ,sell,100,3120.00,10994,948300
TCS,INE467B01029,2026-01-15,NSE,EQ,EQ,sell,50,3890.00,10850,948120`;
      mockFile = new File([csvData], 'Zerodha_Tradebook_FY2025-26.csv', { type: 'text/csv' });
    } else if (demoType === 'form16') {
      mockFile = new File(['mock content'], 'Form16_PartB_Infosys_FY2025-26.pdf', { type: 'application/pdf' });
    } else if (demoType === 'cas') {
      mockFile = new File(['mock content'], 'CAMS_KFintech_Consolidated_CAS_FY2025-26.pdf', { type: 'application/pdf' });
    }
    if (mockFile) {
      processFile(mockFile);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="card"
      style={{
        padding: '1.25rem',
        background: 'var(--surface, #1e293b)',
        border: '1px solid var(--border-active, #6366f1)',
        borderRadius: 'var(--radius-lg, 12px)',
        marginBottom: '1rem',
        position: 'relative',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 45,
            zIndex: 10,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: '#fff',
            padding: '0.4rem 0.85rem',
            borderRadius: 6,
            fontSize: '0.75rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
          }}
        >
          <CheckCircle2 size={14} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              padding: '0.4rem',
              borderRadius: 6,
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UploadCloud size={18} color="#818cf8" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Universal 1-Click Document Ingestion Dropzone
            </h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Instant entity extraction for {isUS ? 'W-2, 1099-B, 1099-DIV, and K-1' : 'Form 16, CAMS/KFin CAS, AIS/TIS, and Broker P&L'}. Updates all 10 sub-modules in real-time.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '0.3rem',
            borderRadius: 6,
          }}
          title="Close Dropzone"
        >
          <X size={18} />
        </button>
      </div>

      {/* Drop Target Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? '#6366f1' : 'var(--glass-border, rgba(255, 255, 255, 0.15))'}`,
          borderRadius: 8,
          padding: '1.5rem',
          textAlign: 'center',
          background: isDragging ? 'rgba(99, 102, 241, 0.08)' : 'rgba(0, 0, 0, 0.15)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          marginBottom: '1rem',
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept=".pdf,.json,.csv,.xml"
          style={{ display: 'none' }}
        />
        <UploadCloud size={32} color={isDragging ? '#6366f1' : 'var(--text-secondary)'} style={{ margin: '0 auto 0.5rem' }} />
        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
          Drag & drop tax statement PDF / JSON or <span style={{ color: '#818cf8', textDecoration: 'underline' }}>Browse local files</span>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          Encrypted client-side OCR & parsing. Cryptographic SHA-256 workpaper verification applied instantly.
        </div>
      </div>

      {/* 1-Click Demo Loading Presets */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Quick Demo Ingestion:
        </span>
        {isUS ? (
          <>
            <button
              type="button"
              onClick={() => handleDemoDocLoad('w2')}
              style={{
                fontSize: '0.72rem',
                padding: '0.25rem 0.6rem',
                borderRadius: 4,
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                color: '#a5b4fc',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              + Ingest Sample W-2 (TechCorp $195k)
            </button>
            <button
              type="button"
              onClick={() => handleDemoDocLoad('1099b')}
              style={{
                fontSize: '0.72rem',
                padding: '0.25rem 0.6rem',
                borderRadius: 4,
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              + Ingest Sample 1099-B (Consolidated Brokerage)
            </button>
            <button
              type="button"
              onClick={() => handleDemoDocLoad('schwab_csv')}
              style={{
                fontSize: '0.72rem',
                padding: '0.25rem 0.6rem',
                borderRadius: 4,
                background: 'rgba(14, 165, 233, 0.12)',
                border: '1px solid rgba(14, 165, 233, 0.3)',
                color: '#38bdf8',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              + Parse Real Schwab CSV (Gain/Loss Export)
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => handleDemoDocLoad('form16')}
              style={{
                fontSize: '0.72rem',
                padding: '0.25rem 0.6rem',
                borderRadius: 4,
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                color: '#a5b4fc',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              + Ingest Sample Form 16 Part B (Infosys ₹26.5L)
            </button>
            <button
              type="button"
              onClick={() => handleDemoDocLoad('cas')}
              style={{
                fontSize: '0.72rem',
                padding: '0.25rem 0.6rem',
                borderRadius: 4,
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              + Ingest CAMS/KFintech CAS (MF Portfolio)
            </button>
            <button
              type="button"
              onClick={() => handleDemoDocLoad('zerodha_csv')}
              style={{
                fontSize: '0.72rem',
                padding: '0.25rem 0.6rem',
                borderRadius: 4,
                background: 'rgba(14, 165, 233, 0.12)',
                border: '1px solid rgba(14, 165, 233, 0.3)',
                color: '#38bdf8',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              + Parse Real Zerodha Tradebook CSV
            </button>
          </>
        )}
      </div>

      {/* Ingested Documents List */}
      <div>
        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <FileCheck size={14} color="#10b981" />
          <span>Active Ingested Workpapers ({ingestedDocs.length})</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {ingestedDocs.map((doc) => (
            <div
              key={doc.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.6rem 0.85rem',
                borderRadius: 6,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <FileText size={18} color="#818cf8" />
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {doc.name}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>{doc.type}</span>
                    <span>•</span>
                    <span>{doc.size}</span>
                    <span>•</span>
                    <span>{doc.uploadedAt}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.45rem',
                    borderRadius: 4,
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <ShieldCheck size={11} />
                  <span>{doc.verifiedFieldsCount} Fields Synced</span>
                </span>

                <button
                  type="button"
                  onClick={() => setSelectedDocForDetails(selectedDocForDetails?.id === doc.id ? null : doc)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: 4,
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.6875rem',
                    cursor: 'pointer',
                  }}
                >
                  {selectedDocForDetails?.id === doc.id ? 'Hide Details' : 'Inspect JSON'}
                </button>
              </div>

              {/* Collapsible Entity Details */}
              {selectedDocForDetails?.id === doc.id && (
                <div
                  style={{
                    width: '100%',
                    marginTop: '0.5rem',
                    padding: '0.75rem',
                    borderRadius: 6,
                    background: '#090d16',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    fontSize: '0.72rem',
                    fontFamily: 'monospace',
                    color: '#94a3b8',
                  }}
                >
                  <div style={{ color: '#818cf8', fontWeight: 700, marginBottom: '0.35rem' }}>
                    // Extracted Statutory Entities (Cryptographic Hash: {doc.hash.slice(0, 24)}...)
                  </div>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {JSON.stringify(doc.extractedEntities, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
