// src/components/tax/TaxTerm.jsx
// Interactive Universal Tax Terminology Decoder with Hover-to-Translate ELI5 Popovers

import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, Info, Sparkles, X, ExternalLink, ShieldCheck } from 'lucide-react';
import { TAX_TERM_GLOSSARY } from '../../utils/taxPlainEnglishDictionary';
import { useTaxStudio } from '../../context/TaxStudioContext';

export default function TaxTerm({ term, children, fallbackTitle }) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const { isPlainEnglishMode } = useTaxStudio() || { isPlainEnglishMode: true };

  const glossaryItem = TAX_TERM_GLOSSARY[term] || {
    term: term,
    plainTitle: fallbackTitle || term,
    eli5: 'Financial term used to calculate tax deductions, exemptions, or reporting obligations.',
    whyItMatters: 'Ensures compliance with statutory tax codes while reducing your tax bill.',
    statute: 'Internal Revenue Code / Income Tax Act',
  };

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        onMouseEnter={() => setIsOpen(true)}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          margin: 0,
          font: 'inherit',
          color: 'inherit',
          cursor: 'pointer',
          textDecoration: 'underline dotted',
          textDecorationColor: isPlainEnglishMode ? 'rgba(168, 85, 247, 0.7)' : 'rgba(148, 163, 184, 0.6)',
          textUnderlineOffset: '3px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '2px',
        }}
        title={`Click or hover to explain ${glossaryItem.plainTitle} in plain English`}
      >
        <span>{children || glossaryItem.plainTitle}</span>
        <HelpCircle
          size={11}
          style={{
            opacity: 0.65,
            color: isPlainEnglishMode ? '#c084fc' : '#94a3b8',
            verticalAlign: 'middle',
          }}
        />
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div
          ref={popoverRef}
          onMouseLeave={() => setIsOpen(false)}
          className="page-enter"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 320,
            maxWidth: '90vw',
            background: 'linear-gradient(135deg, #0f172a, #1e293b)',
            border: '1px solid rgba(168, 85, 247, 0.45)',
            borderRadius: 10,
            padding: '0.85rem 1rem',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6), 0 0 15px rgba(168, 85, 247, 0.25)',
            zIndex: 9999,
            color: '#fff',
            fontSize: '0.78rem',
            lineHeight: 1.45,
            textAlign: 'left',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '0.5rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              paddingBottom: '0.45rem',
              marginBottom: '0.55rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span
                  style={{
                    fontSize: '0.625rem',
                    fontWeight: 800,
                    padding: '0.1rem 0.35rem',
                    borderRadius: 4,
                    background: 'rgba(168, 85, 247, 0.25)',
                    color: '#e9d5ff',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                  }}
                >
                  {glossaryItem.term}
                </span>
                <span style={{ fontSize: '0.65rem', color: '#34d399', fontWeight: 700 }}>
                  Plain English Guide
                </span>
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#f8fafc', marginTop: '0.2rem' }}>
                {glossaryItem.plainTitle}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '2px',
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* ELI5 Content */}
          <div style={{ marginBottom: '0.55rem', color: '#e2e8f0' }}>
            <p style={{ margin: 0 }}>{glossaryItem.eli5}</p>
          </div>

          {/* Why it Matters */}
          <div
            style={{
              padding: '0.4rem 0.55rem',
              borderRadius: 6,
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: '#6ee7b7',
              fontSize: '0.72rem',
              marginBottom: '0.55rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.35rem',
            }}
          >
            <Sparkles size={13} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <strong>Why it matters:</strong> {glossaryItem.whyItMatters}
            </div>
          </div>

          {/* Statute Reference */}
          <div
            style={{
              fontSize: '0.65rem',
              color: '#94a3b8',
              fontFamily: 'monospace',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            <ShieldCheck size={11} color="#818cf8" />
            <span>Statute: {glossaryItem.statute}</span>
          </div>
        </div>
      )}
    </span>
  );
}
