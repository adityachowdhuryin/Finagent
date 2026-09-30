import React, { useState, useEffect } from 'react';
import { CreditCard, Sparkles, AlertCircle, ArrowRight, ShieldCheck, Plane, Utensils, ShoppingBag, Home } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export default function USCardOptimizer() {
  const { state } = useApp();
  const [category, setCategory] = useState('dining');
  const [spendAmount, setSpendAmount] = useState(250);
  const [cardsOpened24Mos, setCardsOpened24Mos] = useState(3);
  const [ownedCards, setOwnedCards] = useState(['chase_csr', 'amex_gold', 'bilt_mastercard']);
  const [optResult, setOptResult] = useState(null);
  const [allCards, setAllCards] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCards();
  }, []);

  useEffect(() => {
    optimize();
  }, [category, spendAmount, cardsOpened24Mos, ownedCards]);

  async function fetchCards() {
    try {
      const res = await fetch('http://localhost:3001/api/us-cards/database');
      const data = await res.json();
      if (data.success) {
        setAllCards(data.cards);
      }
    } catch (err) {
      console.error('Fetch US cards error:', err);
    }
  }

  async function optimize() {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/us-cards/optimize-spend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          spendAmountUSD: Number(spendAmount),
          ownedCardIds: ownedCards,
          cardsOpenedLast24Months: Number(cardsOpened24Mos),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOptResult(data);
      }
    } catch (err) {
      console.error('Optimize spend error:', err);
    } finally {
      setLoading(false);
    }
  }

  const categories = [
    { id: 'dining', label: 'Dining & Restaurants', icon: Utensils },
    { id: 'groceries', label: 'US Supermarkets', icon: ShoppingBag },
    { id: 'flights', label: 'Airfare & Travel', icon: Plane },
    { id: 'rent', label: 'Monthly Rent (0% fee)', icon: Home },
  ];

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            <span>🇺🇸</span> CHASE 5/24 & AMEX REWARDS ROUTER
          </div>
          <h1 className="text-h1">US Credit Card Points & 5/24 Maximizer</h1>
          <p className="text-sm text-secondary mt-1">Route every transaction to the highest-yielding card and maintain your Chase 5/24 approval status</p>
        </div>
      </div>

      {/* Chase 5/24 Rule Status Card */}
      {optResult?.chase524Status && (
        <div className="card" style={{
          background: optResult.chase524Status.isUnder524
            ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.08), var(--surface))'
            : 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), var(--surface))',
          border: optResult.chase524Status.isUnder524 ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.5rem' }}>{optResult.chase524Status.isUnder524 ? '🟢' : '🔴'}</span>
              <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                Chase 5/24 Status: {cardsOpened24Mos}/24 ({optResult.chase524Status.remainingSlots} Slots Available)
              </div>
            </div>
            <p className="text-xs text-secondary" style={{ marginTop: 4, maxWidth: 620 }}>
              {optResult.chase524Status.guidance}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="text-xs text-muted">Cards opened in last 24 mos:</span>
            <input
              type="number" min={0} max={12}
              value={cardsOpened24Mos} onChange={e => setCardsOpened24Mos(Number(e.target.value))}
              style={{ width: 60, padding: '0.35rem 0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', textAlign: 'center', fontWeight: 700 }}
            />
          </div>
        </div>
      )}

      {/* Category Spend Router */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Left: Spend Selector */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 className="text-h3">Spend Category Router</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {categories.map(c => {
              const Icon = c.icon;
              const isSelected = category === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  style={{
                    padding: '0.75rem',
                    background: isSelected ? 'var(--primary)' : 'var(--surface-raised)',
                    color: isSelected ? '#fff' : 'var(--text-primary)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  <Icon size={16} /> {c.label}
                </button>
              );
            })}
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: 4 }}>
              <span className="text-muted">Spend Amount</span>
              <strong style={{ fontFamily: 'Space Grotesk' }}>${Number(spendAmount).toLocaleString()}</strong>
            </div>
            <input
              type="range" min={10} max={3000} step={25}
              value={spendAmount} onChange={e => setSpendAmount(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--primary)' }}
            />
          </div>

          {/* Wallet Selector */}
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem' }}>Your Active Wallet:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {allCards.map(c => {
                const isOwned = ownedCards.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setOwnedCards(prev => isOwned ? prev.filter(id => id !== c.id) : [...prev, c.id]);
                    }}
                    style={{
                      padding: '0.3rem 0.6rem',
                      background: isOwned ? 'rgba(99, 102, 241, 0.2)' : 'var(--surface-raised)',
                      border: isOwned ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                      color: isOwned ? 'var(--primary)' : 'var(--text-muted)',
                      borderRadius: 16,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {isOwned ? '✓ ' : '+ '}{c.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Best Card Recommendation */}
        {optResult?.bestCard && (
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), var(--surface))',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '1rem'
          }}>
            <div>
              <div className="text-xs text-muted">Swipe This Card For Maximum Net Value:</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
                {optResult.bestCard.cardName}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600 }}>
                {optResult.bestCard.issuer} · Earns {optResult.bestCard.multiplier} Points
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ background: 'var(--surface-raised)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)' }}>
                <div className="text-xs text-muted">Net Return Yield</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: '#4ade80' }}>
                  {optResult.bestCard.effectiveYieldPct}%
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Effective Cashback</div>
              </div>

              <div style={{ background: 'var(--surface-raised)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)' }}>
                <div className="text-xs text-muted">Points Value Earned</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: 'var(--primary)' }}>
                  ${optResult.bestCard.dollarValueEarned}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{optResult.bestCard.pointsEarned.toLocaleString()} points</div>
              </div>
            </div>

            <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <strong>Best Redemption: </strong> Transfer points to <strong>{optResult.bestCard.topTransferPartner}</strong> for maximum outsized value.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
