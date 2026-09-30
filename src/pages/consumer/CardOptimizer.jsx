import React, { useState, useEffect } from 'react';
import {
  CreditCard, Sparkles, Award, AlertCircle, Check, ArrowRight,
  Plane, Hotel, ShoppingCart, Utensils, Fuel, Home, Zap, Laptop, ShieldPlus
} from 'lucide-react';

const CATEGORIES = [
  { id: 'flights', label: 'Flights & Airfare', icon: Plane, defaultAmount: 35000 },
  { id: 'hotels', label: 'Hotels & Stays', icon: Hotel, defaultAmount: 25000 },
  { id: 'amazon', label: 'Amazon / Online', icon: ShoppingCart, defaultAmount: 15000 },
  { id: 'dining', label: 'Dining & Swiggy', icon: Utensils, defaultAmount: 6000 },
  { id: 'groceries', label: 'Blinkit / Groceries', icon: ShoppingCart, defaultAmount: 8000 },
  { id: 'hospital', label: 'Hospital / Medical', icon: ShieldPlus, defaultAmount: 45000 },
  { id: 'electronics', label: 'Apple / Electronics', icon: Laptop, defaultAmount: 65000 },
  { id: 'utility', label: 'Electricity / Bills', icon: Zap, defaultAmount: 5000 },
  { id: 'rent', label: 'House Rent', icon: Home, defaultAmount: 30000 },
  { id: 'fuel', label: 'Fuel / Petrol', icon: Fuel, defaultAmount: 4000 },
];

const DEFAULT_CARDS = [
  { id: 'hdfc_infinia', name: 'HDFC Infinia Metal', issuer: 'HDFC' },
  { id: 'axis_atlas', name: 'Axis Bank Atlas', issuer: 'Axis' },
  { id: 'sbi_cashback', name: 'SBI Cashback Card', issuer: 'SBI' },
  { id: 'icici_amazon_pay', name: 'ICICI Amazon Pay', issuer: 'ICICI' },
  { id: 'tata_neu_infinity', name: 'Tata Neu Infinity', issuer: 'HDFC' },
  { id: 'axis_airtel', name: 'Airtel Axis Bank', issuer: 'Axis' },
  { id: 'amex_plat_travel', name: 'Amex Platinum Travel', issuer: 'Amex' },
];

export default function CardOptimizer() {
  const [selectedCards, setSelectedCards] = useState(['hdfc_infinia', 'axis_atlas', 'sbi_cashback', 'icici_amazon_pay']);
  const [category, setCategory] = useState('flights');
  const [amount, setAmount] = useState(35000);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    runOptimization();
  }, [category, amount, selectedCards]);

  async function runOptimization() {
    setLoading(true);
    try {
      const res = await fetch('/api/cards/optimize-spend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heldCardIds: selectedCards,
          amount: Number(amount) || 0,
          category,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setResult(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function toggleCard(id) {
    if (selectedCards.includes(id)) {
      if (selectedCards.length === 1) return; // keep at least 1
      setSelectedCards(selectedCards.filter(c => c !== id));
    } else {
      setSelectedCards([...selectedCards, id]);
    }
  }

  return (
    <div className="page-container" style={{ padding: '1.5rem', maxWidth: 1150, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <CreditCard size={24} color="var(--primary)" />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Credit Card Reward Maximizer & Spend Router</h1>
          <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            Daily Wealth Tool
          </span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
          Swipe the right card on every transaction to earn up to 16.5% return in air miles, cashback, or luxury hotel points.
        </p>
      </div>

      {/* Wallet Selector (My Cards) */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>My Card Wallet (Select which cards you hold):</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedCards.length} cards selected</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {DEFAULT_CARDS.map(card => {
            const isSelected = selectedCards.includes(card.id);
            return (
              <button
                key={card.id}
                onClick={() => toggleCard(card.id)}
                className="btn btn-sm"
                style={{
                  background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'var(--surface-raised)',
                  border: isSelected ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                  color: isSelected ? '#a5b4fc' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.75rem',
                  padding: '0.4rem 0.75rem',
                }}
              >
                {isSelected ? <Check size={13} color="var(--primary)" /> : null}
                {card.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Spend Router Controls */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 1rem' }}>Select Spend Category & Amount</h3>
        
        {/* Category Pills */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isSelected = category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setCategory(cat.id);
                  setAmount(cat.defaultAmount);
                }}
                className="btn btn-sm"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  padding: '0.75rem 0.5rem',
                  background: isSelected ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(168, 85, 247, 0.25))' : 'var(--surface-raised)',
                  border: isSelected ? '1px solid #818cf8' : '1px solid var(--glass-border)',
                  color: isSelected ? '#fff' : 'var(--text-secondary)',
                  borderRadius: 10,
                }}
              >
                <Icon size={18} color={isSelected ? '#818cf8' : 'var(--text-muted)'} />
                <span style={{ fontSize: '0.75rem', fontWeight: isSelected ? 600 : 400 }}>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Amount Input */}
        <div style={{ maxWidth: 360 }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Transaction Amount (₹)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
            <input
              type="number"
              className="input"
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              style={{ width: '100%', padding: '0.6rem 0.75rem', fontSize: '1.1rem', fontWeight: 700 }}
            />
          </div>
        </div>
      </div>

      {/* Recommendation Results */}
      {result && (
        <div>
          {/* Winner Card */}
          {result.optimalCard && (
            <div style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.25))', border: '1px solid rgba(34, 197, 94, 0.4)', borderRadius: 14, padding: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#22c55e', color: '#000', padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                    <Award size={12} /> #1 OPTIMAL CARD TO SWIPE
                  </div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.25rem', color: '#fff' }}>
                    {result.optimalCard.cardName}
                  </h2>
                  <p style={{ margin: 0, color: '#86efac', fontSize: '0.85rem' }}>
                    {result.optimalCard.recommendationNote}
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: '#86efac' }}>Estimated Return Value</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#4ade80' }}>
                    ₹{result.optimalCard.expectedSavingsINR.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff', background: 'rgba(0,0,0,0.3)', padding: '0.2rem 0.5rem', borderRadius: 4, display: 'inline-block', marginTop: '0.2rem' }}>
                    {result.optimalCard.ratePct}% Net Reward Rate
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other Ranked Cards in Wallet */}
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Comparison Against Your Other Cards:
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
            {result.allRanked.slice(1).map(card => (
              <div key={card.cardId} className="card" style={{ padding: '1rem', background: 'var(--surface-raised)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{card.cardName}</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    ₹{card.expectedSavingsINR.toLocaleString('en-IN')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>{card.ratePct}% reward</span>
                  <span>{card.recommendationNote}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
