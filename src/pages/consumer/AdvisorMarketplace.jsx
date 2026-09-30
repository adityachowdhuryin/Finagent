import React, { useState, useEffect } from 'react';
import { Search, Star, MapPin, Languages, Calendar, CheckCircle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const SPECIALIZATIONS = [
  'Tax Planning', 'Retirement', 'Equity', 'FIRE Planning',
  'Mutual Funds', 'Insurance', 'Estate Planning', 'Women & Finance',
];

function StarRating({ rating }) {
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={12}
          fill={n <= Math.round(rating) ? 'var(--gold)' : 'none'}
          stroke="var(--gold)"
        />
      ))}
      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: 4 }}>{rating}</span>
    </div>
  );
}

function AdvisorModal({ advisor, onClose, userState }) {
  const [sessionType, setSessionType] = useState('30');
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const fee = sessionType === '30' ? advisor.fee30 : advisor.fee60;

  async function handleBook() {
    setBooking(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/marketplace/booking/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advisorId: advisor.id,
          sessionType,
          amount: fee,
          userName: userState?.user?.name,
          userEmail: userState?.user?.email,
        }),
      });
      const order = await res.json();
      if (order.error) throw new Error(order.error);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'FinAgent',
        description: `${sessionType}-min session with ${advisor.name}`,
        order_id: order.orderId,
        prefill: { name: userState?.user?.name, email: userState?.user?.email },
        theme: { color: '#6366f1' },
        handler: async (response) => {
          await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/marketplace/booking/confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              advisorId: advisor.id,
              userEmail: userState?.user?.email,
              userName: userState?.user?.name,
              sessionType,
              amount: fee,
              paymentId: response.razorpay_payment_id,
            }),
          });
          setBooked(true);
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      alert('Booking failed: ' + e.message);
    }
    setBooking(false);
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '1.5rem',
        maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative',
      }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          <X size={20} />
        </button>

        {booked ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <CheckCircle size={48} style={{ color: 'var(--green)', marginBottom: '1rem' }} />
            <h2 style={{ color: 'var(--green)' }}>Session Booked!</h2>
            <p className="text-secondary" style={{ marginTop: '0.5rem' }}>
              Check your email for the confirmation and meeting link.
            </p>
            <a
              href={advisor.calendlyUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
              style={{ marginTop: '1rem', display: 'inline-block', textDecoration: 'none' }}
            >
              Choose Your Time Slot →
            </a>
          </div>
        ) : (
          <>
            {/* Advisor header */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', fontWeight: 800, color: 'white', flexShrink: 0,
              }}>
                {advisor.name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{advisor.name}</div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                  <span className="badge badge-surface" style={{ fontSize: '0.7rem' }}>✓ SEBI {advisor.sebiReg}</span>
                  <StarRating rating={advisor.rating} />
                  <span className="text-xs text-muted">{advisor.reviews} reviews · {advisor.sessionsCompleted} sessions</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <MapPin size={12} style={{ display: 'inline', marginRight: 2 }} />
                    {advisor.city}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <Languages size={12} style={{ display: 'inline', marginRight: 2 }} />
                    {advisor.languages.join(', ')}
                  </span>
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
              {advisor.bio}
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              {advisor.specializations.map(s => (
                <span key={s} className="chip" style={{ fontSize: '0.75rem' }}>{s}</span>
              ))}
            </div>

            {/* Session picker */}
            <div className="card" style={{ background: 'var(--surface-raised)' }}>
              <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Choose Session Type</div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {[['30', advisor.fee30, '30-min intro'], ['60', advisor.fee60, '60-min deep dive']].map(([type, f, label]) => (
                  <button
                    key={type}
                    onClick={() => setSessionType(type)}
                    style={{
                      flex: 1, padding: '0.875rem', borderRadius: 'var(--radius)',
                      border: `2px solid ${sessionType === type ? 'var(--primary)' : 'var(--glass-border)'}`,
                      background: sessionType === type ? 'rgba(99,102,241,0.1)' : 'var(--surface)',
                      cursor: 'pointer', textAlign: 'center',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{label}</div>
                    <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, color: 'var(--primary)', fontSize: '1.25rem', marginTop: 4 }}>
                      ₹{f}
                    </div>
                  </button>
                ))}
              </div>
              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '1rem', fontSize: '1rem' }}
                onClick={handleBook}
                disabled={booking}
              >
                {booking ? '⏳ Opening payment...' : `Pay ₹${fee} & Book Session`}
              </button>
              <div className="text-xs text-muted" style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                Secure payment via Razorpay · 80% goes to advisor · Refundable if advisor cancels
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdvisorMarketplace() {
  const { state } = useApp();
  const [advisors, setAdvisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpec, setSelectedSpec] = useState(null);
  const [citySearch, setCitySearch] = useState('');
  const [selectedAdvisor, setSelectedAdvisor] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/marketplace/advisors`)
      .then(r => r.json())
      .then(data => setAdvisors(data.advisors || []))
      .catch(() => setAdvisors([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = advisors.filter(a =>
    (!selectedSpec || a.specializations.includes(selectedSpec)) &&
    (!citySearch || a.city.toLowerCase().includes(citySearch.toLowerCase()))
  );

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {selectedAdvisor && (
        <AdvisorModal
          advisor={selectedAdvisor}
          onClose={() => setSelectedAdvisor(null)}
          userState={state.consumer}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-h1">🤝 Advisor Marketplace</h1>
        <p className="text-sm text-secondary mt-1">
          Connect with SEBI-verified fee-only advisors. They see your full portfolio before the call.
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
          <Search
            size={14}
            style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          />
          <input
            value={citySearch}
            onChange={e => setCitySearch(e.target.value)}
            placeholder="Search by city..."
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '0.5rem 0.75rem 0.5rem 2rem',
              background: 'var(--surface-raised)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius)',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
            }}
          />
        </div>
        {SPECIALIZATIONS.map(s => (
          <button
            key={s}
            onClick={() => setSelectedSpec(selectedSpec === s ? null : s)}
            className={`btn btn-sm ${selectedSpec === s ? 'btn-primary' : 'btn-ghost'}`}
            style={{ whiteSpace: 'nowrap' }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading advisors...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {filtered.map(advisor => (
            <div
              key={advisor.id}
              className="card"
              style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', cursor: 'pointer', transition: 'var(--transition)' }}
              onClick={() => setSelectedAdvisor(advisor)}
            >
              <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '1.25rem', color: 'white', flexShrink: 0,
                }}>
                  {advisor.name[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{advisor.name}</div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: 2 }}>
                    <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>✓ SEBI Verified</span>
                    <StarRating rating={advisor.rating} />
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    <MapPin size={11} style={{ display: 'inline', marginRight: 2 }} />
                    {advisor.city}
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                {advisor.bio.slice(0, 120)}...
              </p>

              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                {advisor.specializations.slice(0, 3).map(s => (
                  <span key={s} className="chip" style={{ fontSize: '0.7rem' }}>{s}</span>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.625rem', borderTop: '1px solid var(--glass-border)' }}>
                <div>
                  <span style={{ fontFamily: 'Space Grotesk', fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>
                    ₹{advisor.fee30}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 4 }}>/ 30 min</span>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={e => { e.stopPropagation(); setSelectedAdvisor(advisor); }}
                >
                  Book Session
                </button>
              </div>
            </div>
          ))}

          {/* Become an advisor CTA card */}
          <div className="card" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            textAlign: 'center', padding: '2rem',
            border: '2px dashed var(--glass-border)', background: 'transparent', minHeight: 240,
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🎓</div>
            <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Are you a SEBI-registered advisor?</div>
            <p className="text-sm text-secondary" style={{ marginBottom: '1rem' }}>
              List your practice and get high-quality pre-qualified leads with full portfolio context.
            </p>
            <a href="/become-advisor" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
              Apply to List →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
