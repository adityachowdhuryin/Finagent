// src/components/common/DailyPulseNotification.jsx
// Daily Financial Pulse Notification Bar & Briefing Modal (Morning Briefing & Market Close Digest)

import React, { useState, useEffect } from 'react';
import {
  Sun, Moon, TrendingUp, TrendingDown, Bell, CheckCircle2,
  AlertCircle, X, ChevronRight, Sparkles, ExternalLink
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function DailyPulseNotification() {
  const { state, isUSMarket } = useApp();
  const navigate = useNavigate();
  const [pulseData, setPulseData] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState('morning');

  const market = isUSMarket ? 'US' : 'IN';

  const fetchPulse = async (tod) => {
    try {
      const res = await fetch('/api/pulse/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ market, timeOfDay: tod })
      });
      const data = await res.json();
      if (data.success) {
        setPulseData(data);
      }
    } catch (err) {
      console.error('Failed to load pulse briefing:', err);
    }
  };

  useEffect(() => {
    fetchPulse(timeOfDay);
  }, [isUSMarket, timeOfDay]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Top Banner / Pill Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(16,185,129,0.12) 100%)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 20,
          padding: '0.25rem 0.65rem',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          fontSize: '0.78125rem',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          flexShrink: 0,
          transition: 'all 0.2s ease',
        }}
        title="View Daily Financial Pulse"
      >
        <span style={{ fontSize: '0.85rem' }}>☀️</span>
        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Pulse:</span>
        <span style={{ color: 'var(--green)', fontWeight: 700, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {pulseData?.netWorthDelta || '+0.42% Today'}
        </span>
        <span className="badge badge-surface" style={{ fontSize: '0.625rem', padding: '1px 5px' }}>Digest</span>
      </button>

      {/* Briefing Modal */}
      {isOpen && pulseData && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
          }}
        >
          <div
            className="card"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: 560, width: '100%', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}
          >
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '1rem', position: 'sticky', top: 0,
              background: 'var(--surface)', zIndex: 10, padding: '0.5rem 0',
              borderBottom: '1px solid var(--glass-border)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="badge badge-primary">{pulseData.edition}</span>
                  <span className="badge badge-green">{market} Markets</span>
                </div>
                <h3 className="text-h3" style={{ fontSize: '1.35rem', marginTop: 4, fontWeight: 800 }}>
                  Daily Financial Pulse
                </h3>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setIsOpen(false)}
                style={{ padding: '0.35rem 0.65rem' }}
                title="Close (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            {/* Edition Switcher */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <button
                className={`btn btn-sm ${timeOfDay === 'morning' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setTimeOfDay('morning')}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Sun size={14} /> Morning Outlook
              </button>
              <button
                className={`btn btn-sm ${timeOfDay === 'evening' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setTimeOfDay('evening')}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Moon size={14} /> Market-Close Digest
              </button>
            </div>

            {/* Executive Summary */}
            <div style={{
              background: 'var(--surface-raised)',
              borderLeft: '4px solid var(--primary)',
              borderRadius: 8,
              padding: '1rem',
              fontSize: '0.875rem',
              lineHeight: 1.5,
              marginBottom: '1.25rem'
            }}>
              {pulseData.summary}
            </div>

            {/* Portfolio Movers */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                Key Portfolio Movers
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {pulseData.movers.map((m, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--surface-raised)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 8,
                      padding: '0.625rem 0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{m.symbol}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 8 }}>{m.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{m.price}</span>
                      <span className={`badge ${m.change.startsWith('+') ? 'badge-green' : 'badge-red'}`} style={{ fontWeight: 700 }}>
                        {m.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Items */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                Today's Action Items
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {pulseData.actionItems.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--surface-raised)',
                      borderRadius: 8,
                      padding: '0.625rem 0.875rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      fontSize: '0.825rem'
                    }}
                  >
                    <span className={`badge ${item.priority === 'HIGH' ? 'badge-red' : item.priority === 'MEDIUM' ? 'badge-primary' : 'badge-surface'}`} style={{ fontSize: '0.65rem' }}>
                      {item.priority}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Macro Context */}
            <div style={{
              background: 'rgba(99,102,241,0.06)',
              borderRadius: 8,
              padding: '0.75rem 1rem',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              marginBottom: '1.5rem'
            }}>
              <strong>Macro Pulse:</strong> {pulseData.macro}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setIsOpen(false)}
              >
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/app/execution');
                }}
              >
                Go to Execution Hub →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
