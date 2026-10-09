// src/pages/work/WorkPortal.jsx
// "FinAgent for Work" B2B Enterprise Employer Benefits & Workforce Financial Wellness Portal (/work)
// Turnkey Corporate 401(k) (US) & Corporate NPS (IN) Plan Administration Suite ($500 setup + $8/seat/mo)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Users, HeartHandshake, ShieldCheck, TrendingUp,
  DollarSign, Sliders, CheckCircle2, ChevronRight, Activity, Plus, Sparkles,
  RefreshCw, FileText, CheckCircle, Calendar, ArrowUpRight, Lock, Award,
  ArrowLeft, Home, Sun, Moon
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../hooks/useTheme';

export default function WorkPortal() {
  const navigate = useNavigate();
  const { isUSMarket, switchMarket } = useApp();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [workData, setWorkData] = useState(null);
  const [seatCount, setSeatCount] = useState(240);
  const [updatingSeats, setUpdatingSeats] = useState(false);
  const [syncingCensus, setSyncingCensus] = useState(false);
  const [complianceData, setComplianceData] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState('Rippling');
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setupSubmitting, setSetupSubmitting] = useState(false);
  const [setupForm, setSetupForm] = useState({
    orgName: 'Apex Cloud Technologies Inc',
    adminEmail: 'admin@apexcloud.io',
    planType: isUSMarket ? 'Safe Harbor 401(k)' : 'Corporate NPS Tier-1',
    initialSeats: 240,
  });
  const [toastMsg, setToastMsg] = useState(null);

  const market = isUSMarket ? 'US' : 'IN';
  const currencySymbol = isUSMarket ? '$' : '₹';
  const unitSeatPrice = isUSMarket ? 8 : 499;
  const unitSetupFee = isUSMarket ? 500 : 40000;

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchWorkData = async () => {
    setLoading(true);
    try {
      const [resOverview, resComp] = await Promise.all([
        fetch(`/api/work/overview?market=${market}`),
        fetch(`/api/work/corporate-plan/compliance?market=${market}`)
      ]);
      const data = await resOverview.json();
      const comp = await resComp.json();

      if (data.success && data.org) {
        setWorkData(data.org);
        setSeatCount(data.org.totalEmployees);
      }
      if (comp.success && comp.compliance) {
        setComplianceData(comp.compliance);
      }
    } catch (err) {
      console.error('Failed to load enterprise work data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkData();
    setSetupForm(prev => ({
      ...prev,
      planType: isUSMarket ? 'Safe Harbor 401(k)' : 'Corporate NPS Tier-1'
    }));
  }, [isUSMarket]);

  const handleUpdateSeats = async () => {
    setUpdatingSeats(true);
    try {
      const res = await fetch('/api/work/seats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newSeatCount: Number(seatCount), market })
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

  const handleSyncCensus = async () => {
    setSyncingCensus(true);
    try {
      const res = await fetch('/api/work/corporate-plan/sync-census', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: selectedProvider, autoEnroll: true })
      });
      const data = await res.json();
      if (data.success && data.org) {
        setWorkData(data.org);
        setSeatCount(data.org.totalEmployees);
        showToast(`✓ Payroll census synced via ${selectedProvider}! (${data.org.totalEmployees} employees active)`);
      }
    } catch (err) {
      showToast('Census sync failed. Please check payroll API credentials.');
    } finally {
      setSyncingCensus(false);
    }
  };

  const handleExecuteSetupPlan = async (e) => {
    e.preventDefault();
    setSetupSubmitting(true);
    try {
      const res = await fetch('/api/work/corporate-plan/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...setupForm,
          market,
        })
      });
      const data = await res.json();
      if (data.success && data.org) {
        setWorkData(data.org);
        setSeatCount(data.org.totalEmployees);
        setShowSetupModal(false);
        showToast(`✓ Corporate ${setupForm.planType} adopted! Invoiced ${currencySymbol}${unitSetupFee.toLocaleString()} setup fee.`);
        // Refresh compliance
        fetchWorkData();
      }
    } catch (err) {
      showToast('Plan adoption failed. Check connection.');
    } finally {
      setSetupSubmitting(false);
    }
  };

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1240, margin: '0 auto', padding: '2rem 1.5rem' }}>
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

      {/* Top Navigation Bar with Back button and Quick Exit */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1.25rem',
        background: 'var(--surface-raised)',
        border: '1px solid var(--glass-border)',
        borderRadius: 12,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        gap: '1rem',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => navigate(-1)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 700,
              fontSize: '0.85rem',
              padding: '0.4rem 0.85rem',
              background: 'var(--surface)',
              border: '1px solid var(--glass-border)',
              borderRadius: 8,
              color: 'var(--text-primary)',
            }}
            title="Go Back"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>

          <div style={{ width: 1, height: 22, background: 'var(--glass-border)' }} />

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/app/dashboard')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--text-secondary)',
              fontSize: '0.8125rem',
              padding: '0.35rem 0.65rem',
            }}
            title="Return to Personal Wealth Cockpit"
          >
            <Home size={15} />
            <span>Personal Dashboard</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Market Switcher Pill (US ⇋ IN) */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'var(--surface)',
            border: '1px solid var(--glass-border)',
            borderRadius: 20,
            padding: '2px',
            fontSize: '0.75rem',
            fontWeight: 700,
          }}>
            <button
              type="button"
              onClick={() => switchMarket?.('US')}
              style={{
                border: 'none',
                background: isUSMarket ? 'var(--primary)' : 'transparent',
                color: isUSMarket ? '#fff' : 'var(--text-muted)',
                borderRadius: 16,
                padding: '0.2rem 0.55rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
              }}
              title="US Corporate Plan Context"
            >
              <span>🇺🇸</span> US
            </button>
            <button
              type="button"
              onClick={() => switchMarket?.('IN')}
              style={{
                border: 'none',
                background: !isUSMarket ? 'var(--primary)' : 'transparent',
                color: !isUSMarket ? '#fff' : 'var(--text-muted)',
                borderRadius: 16,
                padding: '0.2rem 0.55rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
              }}
              title="Indian Corporate NPS Context"
            >
              <span>🇮🇳</span> IN
            </button>
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{ width: 34, height: 34, flexShrink: 0 }}
          >
            <span className="theme-toggle-icon">
              {theme === 'dark' ? <Sun size={16} style={{ color: 'var(--gold)' }} /> : <Moon size={16} style={{ color: 'var(--primary)' }} />}
            </span>
          </button>
        </div>
      </div>

      {/* Header Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(16,185,129,0.08) 100%)',
        border: '1px solid rgba(99,102,241,0.3)',
        padding: '1.75rem',
        borderRadius: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <span className="badge badge-primary">FinAgent for Work</span>
              <span className="badge badge-green">Engine 6: Turnkey Plan Administration</span>
              <span className="badge badge-gold">{isUSMarket ? 'Safe Harbor 401(k)' : 'Corporate NPS Model'}</span>
            </div>
            <h1 className="text-h1" style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              {workData?.name || 'Apex Cloud Technologies Inc'} · Retirement & Workforce Financial Wellness
            </h1>
            <p className="text-secondary" style={{ marginTop: '0.25rem', maxWidth: 680 }}>
              Turnkey plan administration, fiduciary Form 5500/PFRDA compliance, automated payroll census sync, and AI financial co-pilots for every employee.
            </p>
          </div>

          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--glass-border)',
            borderRadius: 12,
            padding: '1rem 1.25rem',
            textAlign: 'right',
            minWidth: 260
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Setup Fee Status:</span>
              <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>✓ PAID ({currencySymbol}{unitSetupFee.toLocaleString()})</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recurring Plan Administration</div>
            <div style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--primary)', marginTop: 2 }}>
              {currencySymbol}{workData ? workData.monthlyBilling.toLocaleString() : (240 * unitSeatPrice).toLocaleString()}/mo
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--green)', fontWeight: 600, marginTop: 4 }}>
              {workData?.activeSeatsEnrolled || 218} of {workData?.totalEmployees || 240} Seats Enrolled ({currencySymbol}{unitSeatPrice}/seat/mo)
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowSetupModal(true)}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', fontWeight: 700 }}
              >
                ⚙️ Plan Config
              </button>
              <a
                href="/app/esop-financing"
                className="btn btn-primary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 700 }}
              >
                🚀 ESOP Funding <ChevronRight size={14} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Commercial Pricing Tier Card */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(99,102,241,0.04) 100%)',
        border: '1px solid rgba(212,175,55,0.3)',
        padding: '1.25rem 1.5rem',
        borderRadius: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10, background: 'rgba(212,175,55,0.15)',
            border: '1px solid rgba(212,175,55,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.25rem', color: '#D4AF37'
          }}>
            💼
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Commercial Pricing: {currencySymbol}{unitSetupFee.toLocaleString()} One-Time Setup + {currencySymbol}{unitSeatPrice}/Seat/Month
              <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>Turnkey B2B Tier</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              Includes DOL/PFRDA plan document adoption, automated payroll integrations, continuous ERISA compliance, and FinAgent mobile copilots.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Setup Invoice</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {workData?.setupFeeInvoice?.id || 'inv_corp_setup_9481'}
            </div>
          </div>
          <button
            onClick={() => showToast(`✓ Official receipt for ${currencySymbol}${unitSetupFee.toLocaleString()} setup fee downloaded!`)}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '0.75rem', fontWeight: 600, border: '1px solid var(--glass-border)' }}
          >
            <FileText size={14} style={{ marginRight: 4 }} /> Receipt
          </button>
        </div>
      </div>

      {/* Workforce Wellness & Plan Health Metrics */}
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
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Plan Participation Rate</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--primary)', marginTop: 4 }}>
            {workData?.workforceWellness?.participationRate || '91%'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--green)', marginTop: 4 }}>
            Only {workData?.workforceWellness?.optOutRate || '9%'} opt-out rate via auto-enrollment
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Corporate Tax Deduction Saved</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: '#10b981', marginTop: 4 }}>
            {currencySymbol}{complianceData?.employerTaxSavings?.corporateTaxDollarsSaved?.toLocaleString() || (101220).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            {complianceData?.employerTaxSavings?.taxDeductionRate || (isUSMarket ? '21% Federal deduction' : '25.17% deduction')}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ERISA / PFRDA Compliance Score</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: '#D4AF37', marginTop: 4 }}>
            {complianceData?.complianceScore || 99}/100
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--green)', marginTop: 4 }}>
            ✓ Form 5500 Ready · Safe Harbor Exempt
          </div>
        </div>
      </div>

      {/* Payroll Census Sync & Auto-Enrollment Module */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 className="text-h3" style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <RefreshCw size={18} color="var(--primary)" /> Payroll Census Sync & Auto-Enrollment Roster
            </h3>
            <p className="text-sm text-secondary" style={{ marginTop: 2 }}>
              Direct bi-directional webhook with your payroll provider. Automatically provisions FinAgent seats for new hires.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              style={{
                background: 'var(--surface-raised)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                padding: '0.45rem 0.75rem',
                borderRadius: 'var(--radius)',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              <option value="Rippling">Rippling HR</option>
              <option value="Gusto">Gusto Payroll</option>
              <option value="ADP">ADP Workforce Now</option>
              <option value="Workday">Workday HCM</option>
              <option value="RazorpayX">RazorpayX Payroll (India)</option>
            </select>

            <button
              className="btn btn-primary btn-sm"
              onClick={handleSyncCensus}
              disabled={syncingCensus}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
            >
              <RefreshCw size={14} className={syncingCensus ? 'spin' : ''} />
              {syncingCensus ? 'Syncing Roster…' : `Sync ${selectedProvider} Census`}
            </button>
          </div>
        </div>

        {/* Employee Roster Sample Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '0.6rem 0.75rem' }}>Employee</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Department</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Status</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Contribution %</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Enrolled Date</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>FinAgent License</th>
              </tr>
            </thead>
            <tbody>
              {(workData?.employeeRoster || []).map((emp) => (
                <tr key={emp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>
                    <div>{emp.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.email}</div>
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-secondary)' }}>{emp.dept}</td>
                  <td style={{ padding: '0.6rem 0.75rem' }}>
                    <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>ACTIVE</span>
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                    {emp.contributionPct || 6}% of Salary
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>{emp.enrolledDate}</td>
                  <td style={{ padding: '0.6rem 0.75rem' }}>
                    <span className="badge badge-surface" style={{ fontSize: '0.7rem' }}>{currencySymbol}{unitSeatPrice}/mo Paid</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ERISA / PFRDA Statutory Compliance Card */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <h3 className="text-h3" style={{ fontSize: '1.15rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={18} color="#D4AF37" /> Statutory ERISA (US) & PFRDA (IN) Compliance Audit Trail
        </h3>
        <p className="text-sm text-secondary" style={{ marginBottom: '1.25rem' }}>
          Automated fiduciary filings, annual IRS Form 5500 transmission readiness, and non-discrimination testing exemptions.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'var(--surface-raised)', borderRadius: 12, padding: '1.25rem', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Filing Document</span>
              <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>READY TO FILE</span>
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', marginTop: 4 }}>
              {isUSMarket ? 'DOL / IRS Form 5500-SF' : 'PFRDA Form 1 (Corporate NPS)'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              Deadline: July 31, 2026 · Auto-assembled from payroll records
            </div>
          </div>

          <div style={{ background: 'var(--surface-raised)', borderRadius: 12, padding: '1.25rem', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Non-Discrimination Test</span>
              <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>EXEMPT</span>
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', marginTop: 4 }}>
              Safe Harbor 401(k) / NPS Rules
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              Exempts employer from complex ADP/ACP annual discrimination tests
            </div>
          </div>

          <div style={{ background: 'var(--surface-raised)', borderRadius: 12, padding: '1.25rem', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fiduciary Protection</span>
              <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>ACTIVE</span>
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', marginTop: 4 }}>
              ERISA § 3(16) / PFRDA POP Fiduciary
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              FinAgent acts as named plan administrator, shielding officers from personal liability
            </div>
          </div>
        </div>
      </div>

      {/* 401(k) / CTC Match Policy Config */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <h3 className="text-h3" style={{ fontSize: '1.15rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <HeartHandshake size={18} color="var(--primary)" /> Employer Match & Benefits Architecture
        </h3>
        <p className="text-sm text-secondary" style={{ marginBottom: '1.25rem' }}>
          Configured corporate contribution policy synced across payroll rails.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'var(--surface-raised)', borderRadius: 12, padding: '1.25rem', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Match Formula</div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', marginTop: 4 }}>
              {workData?.matchPolicy?.formula || '100% on first 4% + 50% on next 2%'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--green)', marginTop: 4 }}>
              Safe Harbor Compliant (IRS Notice 98-52 / PFRDA Model)
            </div>
          </div>

          <div style={{ background: 'var(--surface-raised)', borderRadius: 12, padding: '1.25rem', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vesting Schedule</div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', marginTop: 4 }}>
              {workData?.matchPolicy?.vestingSchedule || 'Immediate 100% Vesting'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              Maximizes employee talent retention & morale
            </div>
          </div>

          <div style={{ background: 'var(--surface-raised)', borderRadius: 12, padding: '1.25rem', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Employer Match Paid YTD</div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary)', marginTop: 4 }}>
              {currencySymbol}{workData ? workData.matchPolicy.totalEmployerContributionsYTD.toLocaleString() : '482,000'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              100% tax-deductible business expense for employer
            </div>
          </div>
        </div>
      </div>

      {/* Seat Management Slider ($8/seat/mo or ₹499/seat/mo) */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 className="text-h3" style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={18} color="var(--primary)" /> Employee Seat Capacity & Billing ({currencySymbol}{unitSeatPrice}/seat/month)
            </h3>
            <p className="text-sm text-secondary" style={{ marginTop: 2 }}>
              Scale plan seats dynamically as your team grows. Monthly invoice automatically prorates changes.
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
            min={20}
            max={1000}
            step={10}
            value={seatCount}
            onChange={(e) => setSeatCount(Number(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--primary)', minWidth: 200 }}
          />

          <div style={{ textAlign: 'right', minWidth: 180 }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'Space Grotesk' }}>
              {seatCount} Seats
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700 }}>
              = {currencySymbol}{(seatCount * unitSeatPrice).toLocaleString()}/month
            </div>
          </div>
        </div>
      </div>

      {/* Plan Setup / Reconfiguration Modal */}
      {showSetupModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(6px)', zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: 520, width: '100%', padding: '2rem', border: '1px solid var(--primary)' }}>
            <h3 className="text-h3" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              🏛️ Establish Corporate Retirement Plan
            </h3>
            <p className="text-sm text-secondary" style={{ marginBottom: '1.25rem' }}>
              Commercial terms: <strong>{currencySymbol}{unitSetupFee.toLocaleString()}</strong> one-time setup fee + <strong>{currencySymbol}{unitSeatPrice}/seat/mo</strong>.
            </p>

            <form onSubmit={handleExecuteSetupPlan} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Company Legal Entity Name
                </label>
                <input
                  type="text"
                  required
                  value={setupForm.orgName}
                  onChange={(e) => setSetupForm(prev => ({ ...prev, orgName: e.target.value }))}
                  style={{
                    width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius)', padding: '0.6rem 0.75rem', color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Plan Administrator Email
                </label>
                <input
                  type="email"
                  required
                  value={setupForm.adminEmail}
                  onChange={(e) => setSetupForm(prev => ({ ...prev, adminEmail: e.target.value }))}
                  style={{
                    width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius)', padding: '0.6rem 0.75rem', color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Retirement Plan Structure
                </label>
                <select
                  value={setupForm.planType}
                  onChange={(e) => setSetupForm(prev => ({ ...prev, planType: e.target.value }))}
                  style={{
                    width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius)', padding: '0.6rem 0.75rem', color: 'var(--text-primary)'
                  }}
                >
                  {isUSMarket ? (
                    <>
                      <option value="Safe Harbor 401(k)">Safe Harbor 401(k) (IRS Notice 98-52)</option>
                      <option value="Traditional 401(k) + Profit Sharing">Traditional 401(k) + Profit Sharing</option>
                      <option value="Roth 401(k) Dual Scheme">Roth 401(k) Dual Scheme</option>
                    </>
                  ) : (
                    <>
                      <option value="Corporate NPS Tier-1">Corporate NPS Model Tier-1 (PFRDA Registered)</option>
                      <option value="Superannuation Trust Scheme">Superannuation Trust Scheme</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Initial Employee Licenses (Seats)
                </label>
                <input
                  type="number"
                  min="10"
                  max="5000"
                  required
                  value={setupForm.initialSeats}
                  onChange={(e) => setSetupForm(prev => ({ ...prev, initialSeats: Number(e.target.value) }))}
                  style={{
                    width: '100%', background: 'var(--surface-raised)', border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius)', padding: '0.6rem 0.75rem', color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div style={{
                background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 8, padding: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)'
              }}>
                By clicking establish, you authorize the {currencySymbol}{unitSetupFee.toLocaleString()} plan document adoption setup fee and execute the § 3(16) fiduciary plan administration agreement.
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowSetupModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={setupSubmitting}
                  className="btn btn-primary"
                  style={{ fontWeight: 700 }}
                >
                  {setupSubmitting ? 'Establishing…' : `Pay ${currencySymbol}${unitSetupFee.toLocaleString()} & Establish Plan`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
