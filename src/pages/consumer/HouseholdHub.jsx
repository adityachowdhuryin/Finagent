// src/pages/consumer/HouseholdHub.jsx
// Household & Spouse Co-Pilot (Monarch Money granular privacy model: Joint vs Private tags)

import React, { useState, useEffect } from 'react';
import {
  Users, Shield, Eye, EyeOff, Lock, UserPlus, Heart,
  CheckCircle2, ChevronRight, Target, Home, Sparkles, RefreshCw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function HouseholdHub() {
  const { state, isUSMarket } = useApp();
  const [loading, setLoading] = useState(true);
  const [householdData, setHouseholdData] = useState(null);
  const [inviteModal, setInviteModal] = useState(false);
  const [partnerEmail, setPartnerEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const market = isUSMarket ? 'US' : 'IN';
  const currencySymbol = isUSMarket ? '$' : '₹';

  const fetchHousehold = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/household/overview?market=${market}`);
      const data = await res.json();
      if (data.success && data.household) {
        setHouseholdData(data.household);
      }
    } catch (err) {
      console.error('Failed to load household data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHousehold();
  }, [isUSMarket]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleTagAccount = async (accountId, newTag) => {
    try {
      const res = await fetch('/api/household/tag-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, privacyTag: newTag, market })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Privacy updated to ${newTag === 'JOINT' ? 'Joint (Shared)' : 'Private (Balance Only)'}`);
        fetchHousehold();
      }
    } catch (err) {
      showToast('Failed to update privacy tag');
    }
  };

  const handleInvite = async () => {
    if (!partnerEmail) return;
    setInviting(true);
    try {
      const res = await fetch('/api/household/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerEmail, market })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Invite sent to ${partnerEmail}!`);
        setInviteModal(false);
        fetchHousehold();
      }
    } catch (err) {
      showToast('Invite failed');
    } finally {
      setInviting(false);
    }
  };

  const netWorth = householdData?.combinedNetWorth;
  const primaryPct = netWorth ? Math.round((netWorth.primaryShare / netWorth.total) * 100) : 62;
  const partnerPct = 100 - primaryPct;

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
        background: 'linear-gradient(135deg, rgba(236,72,153,0.12) 0%, rgba(99,102,241,0.08) 100%)',
        border: '1px solid rgba(236,72,153,0.3)',
        padding: '1.75rem',
        borderRadius: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-primary" style={{ background: 'rgba(236,72,153,0.2)', color: '#f472b6' }}>
                <Heart size={12} /> Multi-Player Wealth OS
              </span>
              <span className="badge badge-green">Monarch Privacy Standard</span>
            </div>
            <h1 className="text-h1" style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              Household & Spouse Co-Pilot
            </h1>
            <p className="text-secondary" style={{ marginTop: '0.25rem', maxWidth: 640 }}>
              Manage shared family finances with complete transparency without sacrificing individual financial privacy. Tag accounts as Joint or Private.
            </p>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => setInviteModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}
          >
            <UserPlus size={16} /> Invite Partner / Co-Pilot
          </button>
        </div>
      </div>

      {/* Household Net Worth Card */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Combined Household Net Worth
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'Space Grotesk', marginTop: 4 }}>
              {currencySymbol}{netWorth ? netWorth.total.toLocaleString() : '842,500'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ background: 'var(--surface-raised)', borderRadius: 10, padding: '0.75rem 1rem', textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>You ({primaryPct}%)</div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>
                {currencySymbol}{netWorth ? netWorth.primaryShare.toLocaleString() : '520,000'}
              </div>
            </div>
            <div style={{ background: 'var(--surface-raised)', borderRadius: 10, padding: '0.75rem 1rem', textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Partner ({partnerPct}%)</div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#f472b6' }}>
                {currencySymbol}{netWorth ? netWorth.partnerShare.toLocaleString() : '322,500'}
              </div>
            </div>
          </div>
        </div>

        {/* Ownership Bar */}
        <div style={{ width: '100%', height: 12, background: 'var(--surface-raised)', borderRadius: 6, overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: `${primaryPct}%`, height: '100%', background: 'var(--primary)' }} />
          <div style={{ width: `${partnerPct}%`, height: '100%', background: '#f472b6' }} />
        </div>
      </div>

      {/* Granular Accounts & Privacy Management */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <h3 className="text-h3" style={{ fontSize: '1.15rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={18} color="var(--primary)" /> Granular Account Privacy Matrix
        </h3>
        <p className="text-sm text-secondary" style={{ marginBottom: '1.25rem' }}>
          Accounts tagged as <strong>Joint</strong> show full line-item activity to your partner. Accounts tagged as <strong>Private</strong> only share their balance into the household total.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {(householdData?.accounts || []).map((acc) => (
            <div
              key={acc.id}
              style={{
                background: 'var(--surface-raised)',
                border: '1px solid var(--glass-border)',
                borderRadius: 12,
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className={`badge ${acc.owner === 'Primary' ? 'badge-primary' : 'badge-gold'}`} style={{ fontSize: '0.65rem' }}>
                    {acc.owner}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{acc.name}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {acc.institution}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                    {currencySymbol}{acc.balance.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: acc.privacyTag === 'JOINT' ? 'var(--green)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                    {acc.privacyTag === 'JOINT' ? <Eye size={12} /> : <EyeOff size={12} />}
                    {acc.privacyTag === 'JOINT' ? 'Joint Visibility' : 'Private (Balance Only)'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className={`btn btn-sm ${acc.privacyTag === 'JOINT' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => handleTagAccount(acc.id, 'JOINT')}
                    style={{ fontSize: '0.75rem' }}
                  >
                    Joint
                  </button>
                  <button
                    className={`btn btn-sm ${acc.privacyTag === 'PRIVATE_TOTAL_ONLY' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => handleTagAccount(acc.id, 'PRIVATE_TOTAL_ONLY')}
                    style={{ fontSize: '0.75rem' }}
                  >
                    Private
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shared Household Goals */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <h3 className="text-h3" style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Target size={18} color="var(--primary)" /> Shared Household Goals
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {(householdData?.sharedGoals || []).map((goal, idx) => {
            const pct = Math.round((goal.current / goal.target) * 100);
            return (
              <div key={idx} style={{ background: 'var(--surface-raised)', borderRadius: 12, padding: '1.25rem', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700 }}>{goal.name}</span>
                  <span className="badge badge-green">On Track</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.5rem' }}>
                  {currencySymbol}{goal.current.toLocaleString()} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ {currencySymbol}{goal.target.toLocaleString()}</span>
                </div>
                <div style={{ width: '100%', height: 6, background: 'var(--surface)', borderRadius: 3, marginTop: '0.75rem', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), #f472b6)' }} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                  {pct}% funded across both partners
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invite Modal */}
      {inviteModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: 440, width: '100%', padding: '1.75rem' }}>
            <h3 className="text-h3" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              Invite Partner / Spouse
            </h3>
            <p className="text-sm text-secondary">
              They will receive a secure invite link to link their financial institutions into your household dashboard.
            </p>

            <div style={{ marginTop: '1rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Partner's Email</label>
              <input
                type="email"
                placeholder="partner@example.com"
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius)',
                  padding: '0.625rem 0.875rem',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button className="btn btn-ghost" onClick={() => setInviteModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleInvite} disabled={inviting}>
                {inviting ? 'Sending Invite…' : 'Send Co-Pilot Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
