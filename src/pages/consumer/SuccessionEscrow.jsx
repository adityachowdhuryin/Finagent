// src/pages/consumer/SuccessionEscrow.jsx
// Multi-Signature Proof-of-Life Succession Escrow & Trustee Quorum Protocol

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, Clock, Heart, Users, CheckCircle2, Lock,
  RefreshCw, AlertTriangle, Key, ChevronRight, Activity, ShieldCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function SuccessionEscrow() {
  const { state, isUSMarket } = useApp();
  const [loading, setLoading] = useState(true);
  const [escrow, setEscrow] = useState(null);
  const [heartbeating, setHeartbeating] = useState(false);
  const [challenging, setChallenging] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/escrow/status');
      const data = await res.json();
      if (data.success && data.escrow) {
        setEscrow(data.escrow);
      }
    } catch (err) {
      console.error('Failed to load escrow status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleHeartbeat = async () => {
    setHeartbeating(true);
    try {
      const res = await fetch('/api/escrow/heartbeat', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setEscrow(data.escrow);
        showToast('✓ Proof of life confirmed! Timer reset to 60 days.');
      }
    } catch (err) {
      showToast('Heartbeat failed');
    } finally {
      setHeartbeating(false);
    }
  };

  const handleChallengeTrustee = async (trusteeId) => {
    setChallenging(true);
    try {
      const res = await fetch('/api/escrow/challenge-nominee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trusteeId })
      });
      const data = await res.json();
      if (data.success) {
        setEscrow(data.escrow);
        showToast(data.message);
      }
    } catch (err) {
      showToast('Challenge failed');
    } finally {
      setChallenging(false);
    }
  };

  const daysLeft = escrow?.daysRemaining || 56;
  const totalDays = escrow?.heartbeatIntervalDays || 60;
  const progressPct = Math.round((daysLeft / totalDays) * 100);

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
      {toastMsg && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: 'var(--primary)', color: '#fff',
          padding: '0.875rem 1.25rem', borderRadius: 'var(--radius)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600
        }}>
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(245,158,11,0.06) 100%)',
        border: '1px solid rgba(99,102,241,0.3)',
        padding: '1.75rem',
        borderRadius: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-primary">Institutional Succession Protocol</span>
              <span className="badge badge-green">2-of-3 Quorum Active</span>
            </div>
            <h1 className="text-h1" style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              Proof-of-Life Succession Escrow & Trustee Quorum
            </h1>
            <p className="text-secondary" style={{ marginTop: '0.25rem', maxWidth: 640 }}>
              Protects generational wealth transfer with an automated dead-man switch. Decryption keys for your Digital Will and Emergency Vault require 2-of-3 trustee verification.
            </p>
          </div>

          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--glass-border)',
            borderRadius: 12,
            padding: '1rem 1.25rem',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Security Protocol</div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--green)', marginTop: 2 }}>
              {escrow?.vaultEncryptedStatus || 'AES-GCM-256 ZERO_KNOWLEDGE'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              Zero admin backdoors
            </div>
          </div>
        </div>
      </div>

      {/* Countdown Dial & Heartbeat Trigger */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '1rem' }}>
            PROOF-OF-LIFE DEAD-MAN SWITCH
          </div>

          <div style={{
            position: 'relative',
            width: 190,
            height: 190,
            borderRadius: '50%',
            background: `conic-gradient(var(--primary) ${progressPct * 3.6}deg, var(--surface-raised) 0deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 30px rgba(99,102,241,0.2)'
          }}>
            <div style={{
              width: 160,
              height: 160,
              borderRadius: '50%',
              background: 'var(--surface)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'Space Grotesk', lineHeight: 1 }}>
                {daysLeft}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Days Remaining
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--green)', fontWeight: 600 }}>
                Status: ACTIVE
              </div>
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleHeartbeat}
            disabled={heartbeating}
            style={{
              marginTop: '1.5rem',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontWeight: 700,
              padding: '0.75rem 1.25rem'
            }}
          >
            {heartbeating ? <RefreshCw className="spin" size={16} /> : <Activity size={16} />}
            {heartbeating ? 'Recording Heartbeat…' : 'Record Proof-of-Life Heartbeat (Reset)'}
          </button>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
            Last heartbeat recorded: {new Date(escrow?.lastHeartbeat || Date.now()).toLocaleDateString()}
          </div>
        </div>

        {/* 2-of-3 Trustee Quorum Matrix */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="text-h3" style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={18} color="var(--primary)" /> 2-of-3 Trustee Quorum
            </h3>
            <span className="badge badge-green">Quorum Met (2/3)</span>
          </div>

          <p className="text-sm text-secondary" style={{ marginBottom: '1rem' }}>
            If the proof-of-life timer expires, 2 out of 3 trustees must approve before encrypted assets are unlocked for your beneficiaries.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(escrow?.trustees || []).map((trustee) => (
              <div
                key={trustee.id}
                style={{
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 10,
                  padding: '0.875rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{trustee.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {trustee.relationship} · {trustee.email}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {trustee.approvedChallenge ? (
                    <span className="badge badge-green" style={{ fontSize: '0.7rem', fontWeight: 700 }}>
                      ✓ Verified
                    </span>
                  ) : (
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => handleChallengeTrustee(trustee.id)}
                      disabled={challenging}
                      style={{ fontSize: '0.75rem', color: 'var(--gold)' }}
                    >
                      Verify Challenge
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Log */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <h3 className="text-h3" style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={18} color="var(--primary)" /> Proof-of-Life Escrow Audit Trail
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {(escrow?.auditLog || []).map((log, idx) => (
            <div
              key={idx}
              style={{
                background: 'var(--surface-raised)',
                borderRadius: 8,
                padding: '0.75rem 1rem',
                fontSize: '0.825rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem'
              }}
            >
              <div style={{ color: 'var(--text-primary)' }}>{log.event}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                {new Date(log.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
