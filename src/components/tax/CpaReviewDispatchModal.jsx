// src/components/tax/CpaReviewDispatchModal.jsx
// Human-in-the-Loop CPA/CA Review Network & Dual-Dispatch Modal
import React, { useState } from 'react';
import {
  Users, CheckCircle2, Calendar, Video, Clock, ShieldCheck,
  ArrowRight, Copy, Check, Lock, ExternalLink, X, FileCheck
} from 'lucide-react';
import { useTaxStudio } from '../../context/TaxStudioContext';

export default function CpaReviewDispatchModal({ isOpen, onClose }) {
  const {
    activeMarket,
    cpaReviewStatus,
    dispatchToCpaPractice,
    computationSeal,
  } = useTaxStudio();

  const isUS = activeMarket === 'US';
  const [selectedFirm, setSelectedFirm] = useState(isUS ? 'beacon' : 'aggarwal');
  const [selectedDate, setSelectedDate] = useState('2026-03-24');
  const [selectedSlot, setSelectedSlot] = useState('11:00 AM - 11:15 AM EST');
  const [dispatchedSuccess, setDispatchedSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const partnerFirms = {
    beacon: {
      name: 'Beacon Wealth CPA LLP',
      lead: 'Sarah Jenkins, CPA (CA Lic #119420)',
      specialty: 'High-Earners, ISO/RSU Equity, S-Corp Reasonable Comp & Multi-State Returns',
      ptin: 'PTIN: P0192847',
      rating: '4.98 ★ (420+ reviews)',
      includedInPro: true,
    },
    aggarwal: {
      name: 'Aggarwal & Singhal Chartered Accountants',
      lead: 'CA Rajesh Aggarwal, FCA (ICAI #084921)',
      specialty: 'HUF Entity Tax Arbitrage, Schedule FA Foreign Assets & Section 112A Portfolios',
      ptin: 'ICAI Firm Reg: 104928W',
      rating: '4.96 ★ (580+ reviews)',
      includedInPro: true,
    },
  };

  const activeFirm = isUS ? partnerFirms.beacon : partnerFirms.aggarwal;

  const magicLinkUrl = `https://finagent.app/cpa/review?token=${computationSeal.slice(0, 16)}&auth=verified&ts=${Date.now()}`;

  const handleDispatch = () => {
    dispatchToCpaPractice({
      firmId: selectedFirm,
      firmName: activeFirm.name,
      practitioner: activeFirm.lead,
      scheduledDate: selectedDate,
      scheduledTime: selectedSlot,
      status: 'DISPATCHED_TO_PRACTICE_QUEUE',
    });
    setDispatchedSuccess(true);
    setTimeout(() => {
      setDispatchedSuccess(false);
      onClose();
    }, 2500);
  };

  const handleCopyMagicLink = () => {
    navigator.clipboard.writeText(magicLinkUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 680,
          background: '#0f172a',
          border: '1px solid #4f46e5',
          borderRadius: 14,
          padding: '1.75rem',
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(79, 70, 229, 0.4)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(79, 70, 229, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
            <Users size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              Human-in-the-Loop CPA / CA Fiduciary Sign-Off
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
              Get your 12-page audit binder reviewed, sealed, and countersigned by an affiliated licensed practitioner.
            </p>
          </div>
        </div>

        {/* Section 1: Verified Partner Firm Card */}
        <div style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid #334155', borderRadius: 10, padding: '1rem', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc' }}>
                {activeFirm.name}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: 700, marginTop: 2 }}>
                {activeFirm.lead}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4 }}>
                {activeFirm.specialty}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ background: '#10b981', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: 4 }}>
                INCLUDED IN PRO
              </span>
              <div style={{ fontSize: '0.7rem', color: '#fbbf24', fontWeight: 700, marginTop: 4 }}>
                {activeFirm.rating}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Book 15-Minute Video Consultation */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid #334155', borderRadius: 10, padding: '1rem', marginBottom: 16 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', marginBottom: 10, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Video size={16} color="#818cf8" /> Schedule 15-Minute Encrypted Video Review
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Target Review Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', background: '#1e293b', border: '1px solid #475569', borderRadius: 6, color: '#f8fafc', fontSize: '0.8rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Available Time Slot</label>
              <select
                value={selectedSlot}
                onChange={(e) => setSelectedSlot(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', background: '#1e293b', border: '1px solid #475569', borderRadius: 6, color: '#f8fafc', fontSize: '0.8rem' }}
              >
                <option value="11:00 AM - 11:15 AM EST">11:00 AM - 11:15 AM EST</option>
                <option value="02:30 PM - 02:45 PM EST">02:30 PM - 02:45 PM EST</option>
                <option value="04:00 PM - 04:15 PM EST">04:00 PM - 04:15 PM EST</option>
                <option value="06:30 PM - 06:45 PM EST">06:30 PM - 06:45 PM EST</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDispatch}
            disabled={dispatchedSuccess}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: 8,
              background: dispatchedSuccess ? '#10b981' : 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.85rem',
              border: 'none',
              cursor: dispatchedSuccess ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 15px rgba(79, 70, 229, 0.4)',
            }}
          >
            {dispatchedSuccess ? (
              <>
                <CheckCircle2 size={16} /> Dispatched to FinAgent B2B Practice Queue!
              </>
            ) : (
              <>
                <FileCheck size={16} /> Dispatch 12-Page Audit Binder to CPA Queue
              </>
            )}
          </button>
        </div>

        {/* Section 3: External CPA Secure Magic Link */}
        <div style={{ background: 'rgba(30, 41, 59, 0.4)', border: '1px solid #334155', borderRadius: 10, padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lock size={14} color="#10b981" /> Or Invite Your Own Personal CPA / CA
            </div>
            <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>7-Day Expiring Zero-Knowledge Link</span>
          </div>
          <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '0 0 10px 0' }}>
            Provide your personal tax preparer with read-only, tamper-proof access to your cryptographically sealed audit workpapers and raw tax software import files.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              readOnly
              value={magicLinkUrl}
              style={{ flex: 1, padding: '0.45rem 0.65rem', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#94a3b8', fontSize: '0.72rem', fontFamily: 'monospace' }}
            />
            <button
              type="button"
              onClick={handleCopyMagicLink}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: 6,
                background: copiedLink ? '#10b981' : '#334155',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              {copiedLink ? <Check size={14} /> : <Copy size={14} />}
              {copiedLink ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
