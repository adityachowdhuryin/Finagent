import React, { useState } from 'react';
import {
  Layers, Clock, ShieldCheck, Plus, Trash2, ArrowRight,
  TrendingDown, CheckCircle2, AlertCircle, Info, Sparkles, Scale
} from 'lucide-react';
import { useTaxStudio } from '../../context/TaxStudioContext';

export default function LossCarryforwardVault({ isOpen, onClose }) {
  const {
    activeMarket,
    lossCarryforwards,
    usLossCarryforwards,
    inLossCarryforwards,
    setUsLossCarryforwards,
    setInLossCarryforwards,
    executeLossHarvest
  } = useTaxStudio();

  const isUS = activeMarket === 'US';

  const [newLossModalOpen, setNewLossModalOpen] = useState(false);
  const [newLotYear, setNewLotYear] = useState(isUS ? '2025' : '2025-26');
  const [newLotType, setNewLotType] = useState('STCL');
  const [newLotAmount, setNewLotAmount] = useState(25000);

  if (!isOpen) return null;

  const handleAddLot = (e) => {
    e.preventDefault();
    if (!newLotAmount || newLotAmount <= 0) return;

    if (isUS) {
      const newLot = {
        id: `us-lc-${Date.now()}`,
        year: Number(newLotYear),
        type: newLotType,
        originalLoss: Number(newLotAmount),
        remainingLoss: Number(newLotAmount),
        offsetThisYear: newLotType === 'STCL' ? Math.min(3000, Number(newLotAmount)) : 0,
        statutoryLimit: newLotType === 'STCL' ? '$3,000/yr against ordinary income' : 'Indefinite carryover against future LTCG',
      };
      setUsLossCarryforwards((prev) => [newLot, ...prev]);
    } else {
      const startYear = parseInt(newLotYear.split('-')[0], 10);
      const expiryAY = `${startYear + 8}-${(startYear + 9).toString().slice(-2)}`;
      const newLot = {
        id: `in-lc-${Date.now()}`,
        ay: newLotYear,
        type: newLotType,
        originalLoss: Number(newLotAmount),
        unabsorbedLoss: Number(newLotAmount),
        expiryAY,
        section: newLotType === 'STCL' ? 'Sec 70/74' : 'Sec 74',
      };
      setInLossCarryforwards((prev) => [newLot, ...prev]);
    }

    setNewLossModalOpen(false);
  };

  const handleDeleteLot = (id) => {
    if (isUS) {
      setUsLossCarryforwards((prev) => prev.filter((item) => item.id !== id));
    } else {
      setInLossCarryforwards((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const totalBankedLoss = isUS
    ? usLossCarryforwards.reduce((sum, item) => sum + (item.remainingLoss || item.creditAvailable || 0), 0)
    : inLossCarryforwards.reduce((sum, item) => sum + (item.unabsorbedLoss || 0), 0);

  return (
    <div
      className="card"
      style={{
        padding: '1.25rem',
        background: 'var(--surface, #1e293b)',
        border: '1px solid var(--border-active, #6366f1)',
        borderRadius: 'var(--radius-lg, 12px)',
        marginBottom: '1rem',
        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
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
            <Layers size={18} color="#818cf8" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Multi-Year Loss Carryforward & Tax Credit Vault
            </h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {isUS
                ? 'IRC § 1212(b) Indefinite Capital Loss Offsets, Form 8801 AMT Credits & Form 1116 Foreign Tax Credits.'
                : 'Section 70/74 8-Year Capital Loss Bank, Inter-Head Set-off & Unabsorbed Depreciation Tracker.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setNewLossModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.35rem 0.75rem',
              borderRadius: 6,
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              color: '#a5b4fc',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={13} />
            <span>Add Prior Year Loss</span>
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                padding: '0.3rem',
              }}
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Aggregate Banked Balance Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          borderRadius: 8,
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Total Banked Shield Available</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#818cf8' }}>
            {isUS ? `$${totalBankedLoss.toLocaleString()}` : `₹${totalBankedLoss.toLocaleString('en-IN')}`}
          </div>
        </div>

        <div style={{ fontSize: '0.75rem', color: '#cbd5e1', maxWidth: 450 }}>
          {isUS
            ? 'Offsets $3,000/yr against ordinary W-2 income and 100% of future net capital gains until fully depleted.'
            : 'STCL offsets both STCG & LTCG; LTCL offsets LTCG. Valid for 8 consecutive Assessment Years under Section 74.'}
        </div>
      </div>

      {/* Loss Lots Table / Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {lossCarryforwards.map((lot) => (
          <div
            key={lot.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.7rem 0.85rem',
              borderRadius: 6,
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  padding: '0.35rem 0.55rem',
                  borderRadius: 4,
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  background: lot.type === 'STCL' ? 'rgba(239, 68, 68, 0.15)' : lot.type === 'LTCL' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: lot.type === 'STCL' ? '#f87171' : lot.type === 'LTCL' ? '#fbbf24' : '#34d399',
                  border: '1px solid currentColor',
                }}
              >
                {lot.type}
              </div>

              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {isUS
                    ? `Tax Year ${lot.year} — ${lot.description || `${lot.type} Carryover`}`
                    : `Assessment Year ${lot.ay} (${lot.section})`}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                  {isUS
                    ? `Original: $${lot.originalLoss?.toLocaleString()} • ${lot.statutoryLimit}`
                    : `Original: ₹${lot.originalLoss?.toLocaleString('en-IN')} • Statutory Expiry: AY ${lot.expiryAY}`}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {isUS
                    ? `$${(lot.remainingLoss || lot.creditAvailable || 0).toLocaleString()}`
                    : `₹${(lot.unabsorbedLoss || 0).toLocaleString('en-IN')}`}
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#10b981', fontWeight: 600 }}>
                  {isUS && lot.offsetThisYear ? `$${lot.offsetThisYear.toLocaleString()} Offset in 2026` : 'Active Banked Lot'}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDeleteLot(lot.id)}
                title="Remove lot"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Lot Modal */}
      {newLossModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              borderRadius: 10,
              padding: '1.25rem',
              maxWidth: 440,
              width: '100%',
              color: '#fff',
            }}
          >
            <h4 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 700 }}>
              Add Prior-Year Unabsorbed Loss / Credit
            </h4>
            <form onSubmit={handleAddLot}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                    {isUS ? 'Tax Year' : 'Assessment Year'}
                  </label>
                  <input
                    type="text"
                    value={newLotYear}
                    onChange={(e) => setNewLotYear(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.65rem',
                      borderRadius: 6,
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#fff',
                      fontSize: '0.8125rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                    Loss / Credit Classification
                  </label>
                  <select
                    value={newLotType}
                    onChange={(e) => setNewLotType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.65rem',
                      borderRadius: 6,
                      background: '#1e293b',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#fff',
                      fontSize: '0.8125rem',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="STCL">Short-Term Capital Loss (STCL)</option>
                    <option value="LTCL">Long-Term Capital Loss (LTCL)</option>
                    {isUS && <option value="AMT_MTC">Form 8801 AMT Minimum Tax Credit</option>}
                    {isUS && <option value="FTC">Form 1116 Foreign Tax Credit Carryover</option>}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                    Unabsorbed Balance ({isUS ? '$' : '₹'})
                  </label>
                  <input
                    type="number"
                    value={newLotAmount}
                    onChange={(e) => setNewLotAmount(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.65rem',
                      borderRadius: 6,
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#fff',
                      fontSize: '0.8125rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setNewLossModalOpen(false)}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: 6,
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#cbd5e1',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: 6,
                    background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
                    border: 'none',
                    color: '#fff',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Save to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
