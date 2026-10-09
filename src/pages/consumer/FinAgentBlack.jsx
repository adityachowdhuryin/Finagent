// src/pages/consumer/FinAgentBlack.jsx
// "FinAgent Black" Sovereign Virtual Family Office Suite ($2,400/yr / ₹1,50,000/yr)
// Hybrid AI + Human Certified CPA / Chartered Accountant Network

import React, { useState } from 'react';
import {
  Crown, ShieldCheck, Award, Calendar, FileText, CheckCircle2,
  Sparkles, ExternalLink, ArrowRight, UserCheck, Video, Lock, PhoneCall
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';

export default function FinAgentBlack() {
  const { state, isUSMarket } = useApp();
  const { currentUser, userProfile } = useAuth();
  const { tier, upgradeTier } = useSubscription();

  const market = state?.activeMarket || (isUSMarket ? 'US' : 'IN');
  const currencySymbol = market === 'IN' ? '₹' : '$';
  const priceDisplay = market === 'IN' ? '₹1,50,000 / year' : '$2,400 / year';

  const [bookingModal, setBookingModal] = useState(false);
  const [bookingType, setBookingType] = useState('cpa'); // 'cpa' | 'trust' | 'banker'
  const [consultantName, setConsultantName] = useState('');
  const [selectedDate, setSelectedDate] = useState('2026-10-15');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const isBlackMember = tier === 'black';

  function handleOpenBooking(type) {
    setBookingType(type);
    setBookingSuccess(false);
    setBookingModal(true);
  }

  function handleConfirmBooking() {
    setBookingSuccess(true);
  }

  return (
    <div
      className="page-enter"
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '2rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        color: '#fff'
      }}
    >
      {/* Obsidian & Gold VIP Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #09090b 0%, #17171d 50%, #000000 100%)',
          border: '1px solid #D4AF37',
          borderRadius: 24,
          padding: '2.5rem 2rem',
          boxShadow: '0 10px 40px rgba(212, 175, 55, 0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '2rem'
        }}
      >
        <div style={{ maxWidth: 650 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
            <span style={{ background: '#D4AF37', color: '#000', padding: '0.25rem 0.65rem', borderRadius: 6, fontWeight: 900, fontSize: '0.75rem', letterSpacing: '0.1em' }}>
              FLAGSHIP TIER
            </span>
            <span style={{ color: '#D4AF37', fontWeight: 700, fontSize: '0.85rem' }}>
              Sovereign Virtual Family Office
            </span>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: '0 0 0.75rem 0', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #FFF 0%, #D4AF37 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            FinAgent Black
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', lineHeight: 1.6, margin: 0 }}>
            The elite wealth tier pairing autonomous multi-agent intelligence with a dedicated network of licensed CPAs, Chartered Accountants, and estate planning attorneys.
          </p>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {!isBlackMember ? (
              <button
                type="button"
                className="btn"
                onClick={() => upgradeTier('black')}
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #AA771C 100%)',
                  color: '#000',
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  padding: '0.85rem 1.75rem',
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 20px rgba(212, 175, 55, 0.4)'
                }}
              >
                <Crown size={18} />
                <span>Upgrade to Black ({priceDisplay})</span>
              </button>
            ) : (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(212,175,55,0.15)', border: '1px solid #D4AF37', padding: '0.65rem 1.25rem', borderRadius: 10, color: '#D4AF37', fontWeight: 800 }}>
                <CheckCircle2 size={18} />
                <span>Active Sovereign Black Member</span>
              </div>
            )}
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
              Dedicated CA/CPA Sign-Off · 0% SPV Carry · Living Trust Legal Review
            </span>
          </div>
        </div>

        {/* 3D Glossy Obsidian Metal Virtual Card */}
        <div
          style={{
            width: 320,
            height: 190,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #1c1c24 0%, #0d0d12 100%)',
            border: '1px solid rgba(212, 175, 55, 0.6)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 20px 40px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 900, color: '#D4AF37', letterSpacing: '0.15em', fontSize: '0.9rem' }}>FINAGENT BLACK</span>
            <Crown size={20} color="#D4AF37" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 36, height: 26, borderRadius: 4, background: 'linear-gradient(135deg, #D4AF37 0%, #85581A 100%)', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.4)' }} />
            <span style={{ fontFamily: 'monospace', fontSize: '1rem', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.9)' }}>
              •••• 0042
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Sovereign Holder</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>
                {state?.consumer?.user?.name || userProfile?.name || (market === 'IN' ? 'Arjun Sharma' : 'Alex Chen')}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.65rem', color: '#D4AF37', fontWeight: 800 }}>VIP STATUS</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', fontWeight: 700 }}>SOVEREIGN</div>
            </div>
          </div>
        </div>
      </div>

      {/* Flagship Pillars Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Pillar 1: Licensed Human CPA / Chartered Accountant Sign-Off */}
        <div
          className="card"
          style={{
            background: 'rgba(15, 15, 20, 0.7)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16,
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(212,175,55,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37' }}>
                <UserCheck size={24} />
              </div>
              <div>
                <h3 className="text-h3" style={{ margin: 0, fontWeight: 800 }}>Certified CPA / CA Network</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--green)' }}>Human Sign-Off &amp; E-File Filing</span>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Have your IRS Form 1040 (US) or CBDT ITR-2/3 (IN) personally audited, signed, and submitted by a licensed human CPA or Chartered Accountant. Includes Schedule FA and Foreign Tax Credit certification.
            </p>

            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.5rem' }}>
              <li>1-on-1 private video strategy review</li>
              <li>Official digital signature &amp; filing declaration</li>
              <li>Representation in event of statutory notices</li>
            </ul>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleOpenBooking('cpa')}
            style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
          >
            <Calendar size={15} />
            <span>Schedule CA / CPA Consultation</span>
          </button>
        </div>

        {/* Pillar 2: Living Trust & Estate Attorney Legal Review */}
        <div
          className="card"
          style={{
            background: 'rgba(15, 15, 20, 0.7)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16,
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="text-h3" style={{ margin: 0, fontWeight: 800 }}>Estate &amp; Trust Legal Review</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>Licensed Estate Planning Counsel</span>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Every living trust, pour-over will, and durable power of attorney generated by FinAgent is audited by licensed trust attorneys in Delaware/California (US) or Mumbai/Bengaluru (IN) before signing.
            </p>

            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.5rem' }}>
              <li>Remote Online Notarization (RON) included</li>
              <li>Multi-generational estate tax mitigation</li>
              <li>Cross-border foreign probate exclusion</li>
            </ul>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => handleOpenBooking('trust')}
            style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
          >
            <FileText size={15} />
            <span>Request Trust Attorney Review</span>
          </button>
        </div>

        {/* Pillar 3: 0% Syndicate Carry Fee Waiver */}
        <div
          className="card"
          style={{
            background: 'rgba(15, 15, 20, 0.7)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16,
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green)' }}>
                <Award size={24} />
              </div>
              <div>
                <h3 className="text-h3" style={{ margin: 0, fontWeight: 800 }}>0% Syndicate Carry Waiver</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--gold)' }}>Save $15,000+ per $100k Deal</span>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              FinAgent Black members receive a permanent carried interest waiver on all institutional pre-IPO SPVs (SpaceX, Stripe, OpenAI). Standard investors pay 15% carry—you pay 0%.
            </p>

            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.5rem' }}>
              <li>$0 carried interest on unicorn exits</li>
              <li>Priority syndicate allocation over retail subscribers</li>
              <li>Direct secondary block sale matching</li>
            </ul>
          </div>

          <a
            href="/app/syndicates"
            className="btn btn-secondary"
            style={{ width: '100%', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
          >
            <span>View Pre-IPO Deal Room</span>
            <ArrowRight size={15} />
          </a>
        </div>
      </div>

      {/* Booking / Concierge Modal */}
      {bookingModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: 520, width: '100%', padding: '2rem', borderRadius: 16, background: '#121217', border: '1px solid #D4AF37' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <Crown size={24} color="#D4AF37" />
              <div>
                <h2 className="text-h2" style={{ margin: 0, fontSize: '1.25rem', color: '#fff' }}>
                  {bookingType === 'cpa' ? 'Schedule Licensed CPA / CA Sign-Off' : 'Book Trust Attorney Legal Review'}
                </h2>
                <span style={{ fontSize: '0.75rem', color: '#D4AF37' }}>FinAgent Black VIP Concierge</span>
              </div>
            </div>

            {!bookingSuccess ? (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>
                    Select Preferred Date:
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '0.65rem 0.85rem', color: '#fff' }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>
                    Primary Discussion Objective:
                  </label>
                  <select
                    style={{ width: '100%', background: '#1c1c24', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '0.65rem 0.85rem', color: '#fff' }}
                  >
                    <option>Annual Tax Filing Final Audit &amp; CA/CPA Sign-Off</option>
                    <option>Delaware Revocable Living Trust Review &amp; Notarization</option>
                    <option>Pre-IPO Secondary Equity Liquidity &amp; 83(b) Strategy</option>
                    <option>Cross-Border Residency Tax Arbitrage (US &amp; India)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setBookingModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={handleConfirmBooking}
                    style={{ background: 'linear-gradient(135deg, #D4AF37, #AA771C)', color: '#000', fontWeight: 800, border: 'none', padding: '0.65rem 1.25rem', borderRadius: 8 }}
                  >
                    Confirm Concierge Appointment
                  </button>
                </div>
              </>
            ) : (
              <div>
                <div style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid #D4AF37', borderRadius: 12, padding: '1.25rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 6 }}>
                    <CheckCircle2 size={18} color="#D4AF37" />
                    <span style={{ fontWeight: 800, color: '#D4AF37' }}>Appointment Confirmed!</span>
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                    Your dedicated licensed practitioner has received your dossier. A calendar invitation with secure video conferencing link has been dispatched to <strong>{currentUser?.email || 'your email'}</strong>.
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setBookingModal(false)}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
