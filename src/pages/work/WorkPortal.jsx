// src/pages/work/WorkPortal.jsx
// "FinAgent for Work" B2B Enterprise Employer Benefits & Workforce Financial Wellness Portal (/work)

import React, { useState, useEffect } from 'react';
import {
  Building2, Users, HeartHandshake, ShieldCheck, TrendingUp,
  DollarSign, Sliders, CheckCircle2, ChevronRight, Activity, Plus, Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function WorkPortal() {
  const { state, isUSMarket } = useApp();
  const [loading, setLoading] = useState(true);
  const [workData, setWorkData] = useState(null);
  const [seatCount, setSeatCount] = useState(240);
  const [updatingSeats, setUpdatingSeats] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const market = isUSMarket ? 'US' : 'IN';
  const currencySymbol = isUSMarket ? '$' : '₹';

  const fetchWorkData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/work/overview?market=${market}`);
      const data = await res.json();
      if (data.success && data.org) {
        setWorkData(data.org);
        setSeatCount(data.org.totalEmployees);
      }
    } catch (err) {
      console.error('Failed to load enterprise work data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkData();
  }, [isUSMarket]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleUpdateSeats = async () => {
    setUpdatingSeats(true);
    try {
      const res = await fetch('/api/work/seats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newSeatCount: Number(seatCount) })
      });
      const data = await res.json();
      if (data.success) {
        setWorkData(data.org);
        showToast(`✓ Enterprise seats updated to ${seatCount}!`);
      }
    } catch (err) {
      showToast('Failed to update seats');
    } finally {
      setUpdatingSeats(false);
    }
  };

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>
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
        background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(16,185,129,0.08) 100%)',
        border: '1px solid rgba(99,102,241,0.3)',
        padding: '1.75rem',
        borderRadius: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-primary">FinAgent for Work</span>
              <span className="badge badge-green">Enterprise HR Admin</span>
            </div>
            <h1 className="text-h1" style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              {workData?.name || 'Apex Cloud Technologies Inc'} · Employee Benefits & Financial Wellness OS
            </h1>
            <p className="text-secondary" style={{ marginTop: '0.25rem', maxWidth: 640 }}>
              Equip your workforce with autonomous financial co-pilots, maximize 401(k)/PF participation, and monitor anonymized team financial health metrics.
            </p>
          </div>

          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--glass-border)',
            borderRadius: 12,
            padding: '1rem 1.25rem',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Enterprise Subscription</div>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary)', marginTop: 2 }}>
              {currencySymbol}{workData ? workData.monthlyBilling.toLocaleString() : '1,440'}/mo
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--green)', fontWeight: 600, marginTop: 4 }}>
              {workData?.activeSeatsEnrolled || 218} of {workData?.totalEmployees || 240} Seats Enrolled ($6/seat)
            </div>
          </div>
        </div>
      </div>

      {/* Workforce Wellness Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div className="card">
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Workforce Wellness Index</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--green)', marginTop: 4 }}>
            {workData?.workforceWellness?.overallIndex || 78}/100
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Top 15th percentile among tech employers
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>401(k) / PF Participation</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--primary)', marginTop: 4 }}>
            {workData?.workforceWellness?.participationRate || '91%'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--green)', marginTop: 4 }}>
            +24% vs industry baseline
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Productivity Recovered</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
            {workData?.workforceWellness?.productivitySavedHours || '4.2 hrs/mo/emp'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Reduced personal financial stress in office
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Emergency Preparedness</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
            68% Staff
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--green)', marginTop: 4 }}>
            Hold 3+ months living expense reserve
          </div>
        </div>
      </div>

      {/* 401(k) / CTC Match Policy Config */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <h3 className="text-h3" style={{ fontSize: '1.15rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <HeartHandshake size={18} color="var(--primary)" /> Employer Match & Benefits Architecture
        </h3>
        <p className="text-sm text-secondary" style={{ marginBottom: '1.25rem' }}>
          Configured corporate contribution policy synced across ADP / Workday payroll rails.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'var(--surface-raised)', borderRadius: 12, padding: '1.25rem', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Match Formula</div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', marginTop: 4 }}>
              {workData?.matchPolicy?.formula || '100% on first 4% + 50% on next 2%'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--green)', marginTop: 4 }}>
              Safe Harbor 401(k) Compliant (IRS exempts ADP/ACP testing)
            </div>
          </div>

          <div style={{ background: 'var(--surface-raised)', borderRadius: 12, padding: '1.25rem', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vesting Schedule</div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', marginTop: 4 }}>
              {workData?.matchPolicy?.vestingSchedule || 'Immediate 100% Vesting'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              Maximizes employee talent retention
            </div>
          </div>

          <div style={{ background: 'var(--surface-raised)', borderRadius: 12, padding: '1.25rem', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Employer Match Paid YTD</div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary)', marginTop: 4 }}>
              {currencySymbol}{workData ? workData.matchPolicy.totalEmployerContributionsYTD.toLocaleString() : '482,000'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              Tax-deductible business expense
            </div>
          </div>
        </div>
      </div>

      {/* Seat Management Slider */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 className="text-h3" style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={18} color="var(--primary)" /> Employee Seat Management ($6/seat/month)
            </h3>
            <p className="text-sm text-secondary" style={{ marginTop: 2 }}>
              Add or remove licenses for your organization as headcount changes.
            </p>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleUpdateSeats}
            disabled={updatingSeats}
            style={{ fontWeight: 700 }}
          >
            {updatingSeats ? 'Updating…' : 'Save Seat Capacity'}
          </button>
        </div>

        <div style={{ background: 'var(--surface-raised)', borderRadius: 12, padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <input
            type="range"
            min={50}
            max={1000}
            step={10}
            value={seatCount}
            onChange={(e) => setSeatCount(Number(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--primary)', minWidth: 200 }}
          />

          <div style={{ textAlign: 'right', minWidth: 160 }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'Space Grotesk' }}>
              {seatCount} Seats
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              = {currencySymbol}{(seatCount * 6).toLocaleString()}/month
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
