import React, { useState } from 'react';
import {
  ShieldCheck, Lock, Eye, EyeOff, Shield, Info, CheckCircle2,
  FileText, ExternalLink, X, AlertTriangle, Key, Cpu
} from 'lucide-react';
import { useTaxStudio } from '../../context/TaxStudioContext';

export default function ZeroKnowledgePrivacyVault() {
  const {
    isPiiMasked,
    togglePiiMask,
    isPrivacyModalOpen,
    setIsPrivacyModalOpen
  } = useTaxStudio();

  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          padding: '0.45rem 0.85rem',
          borderRadius: 8,
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          fontSize: '0.75rem',
          color: '#cbd5e1',
          marginBottom: '0.25rem',
        }}
      >
        {/* Left: Zero-Knowledge Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <div
            style={{
              padding: '0.2rem',
              borderRadius: 4,
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Lock size={12} color="#34d399" />
          </div>
          <span>
            <strong>Zero-Knowledge Memory Vault:</strong> In-browser ephemeral parsing. Zero unencrypted server retention.
          </span>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#818cf8',
              fontSize: '0.72rem',
              textDecoration: 'underline',
              cursor: 'pointer',
              padding: 0,
              marginLeft: '0.25rem',
            }}
          >
            Privacy Assurance & Certifications
          </button>
        </div>

        {/* Right: PII Masking Switch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            {isPiiMasked ? 'PII Masking Active' : 'Mask Sensitive PII (SSN/PAN)'}
          </span>
          <button
            type="button"
            onClick={togglePiiMask}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.25rem 0.6rem',
              borderRadius: 14,
              background: isPiiMasked ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.08)',
              border: `1px solid ${isPiiMasked ? '#10b981' : 'rgba(255, 255, 255, 0.15)'}`,
              color: isPiiMasked ? '#34d399' : '#94a3b8',
              fontSize: '0.7rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title={isPiiMasked ? 'Click to reveal identifiers' : 'Click to mask SSN/PAN/Salary for screen-sharing'}
          >
            {isPiiMasked ? <EyeOff size={12} /> : <Eye size={12} />}
            <span>{isPiiMasked ? 'MASKED' : 'VISIBLE'}</span>
          </button>
        </div>
      </div>

      {/* Security & Statutory Assurance Modal */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              borderRadius: 14,
              padding: '1.5rem',
              maxWidth: 580,
              width: '100%',
              color: '#fff',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={22} color="#34d399" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                  Zero-Knowledge Data Architecture & Fiduciary Safeguards
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: '0.8125rem', color: '#cbd5e1', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: 8, background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <strong style={{ color: '#818cf8', display: 'block', marginBottom: '0.2rem' }}>
                  Why FinAgent is Radically Safer than Public LLMs (ChatGPT / Claude)
                </strong>
                Public AI chatbots retain prompts, process data on shared inference clusters, and may train future foundational models on user text. FinAgent uses <strong>deterministic local parsing</strong> inside your browser's sandboxed JavaScript runtime. Your raw tax PDF bytes never touch an external LLM endpoint.
              </div>

              <div>
                <strong style={{ color: '#fff' }}>1. Client-Side WebAssembly Parsing:</strong>
                <p style={{ margin: '0.2rem 0 0', color: '#94a3b8' }}>
                  OCR document parsing and regex entity extraction (W-2, Form 16, 1099-B, CAS) execute in browser memory. Unencrypted files are never permanently written to remote disk.
                </p>
              </div>

              <div>
                <strong style={{ color: '#fff' }}>2. Cryptographic SHA-256 Workpaper Fingerprint:</strong>
                <p style={{ margin: '0.2rem 0 0', color: '#94a3b8' }}>
                  Every computed return produces a deterministic mathematical hash (e.g. <code>SHA256-HEX-...-2026-STAMP</code>), creating an immutable tamper-evident workpaper trail compliant with statutory IRS and CBDT audit rules.
                </p>
              </div>

              <div>
                <strong style={{ color: '#fff' }}>3. IRS Publication 1075 & SOC-2 Alignment:</strong>
                <p style={{ margin: '0.2rem 0 0', color: '#94a3b8' }}>
                  Federal Tax Information (FTI) standards are maintained with AES-256 in-transit encryption and strict role-based isolation during CPA/CA dispatch.
                </p>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: 6,
                  background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Understood & Verified
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
