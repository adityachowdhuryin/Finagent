// src/pages/consumer/PayrollHub.jsx
// Institutional Payroll Connectivity & Automated Paycheck Splitter (ADP, Gusto, Workday, Rippling)

import React, { useState, useEffect } from 'react';
import {
  Briefcase, CheckCircle2, Sliders, ArrowRight, ShieldCheck,
  Building, RefreshCw, DollarSign, Wallet, PiggyBank, TrendingUp, AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function PayrollHub() {
  const { state, isUSMarket } = useApp();
  const [loading, setLoading] = useState(true);
  const [payrollData, setPayrollData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Split percentages
  const [checkingPct, setCheckingPct] = useState(55);
  const [savingsPct, setSavingsPct] = useState(20);
  const [investPct, setInvestPct] = useState(25);

  const market = isUSMarket ? 'US' : 'IN';
  const currencySymbol = isUSMarket ? '$' : '₹';

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/payroll/status?market=${market}`);
      const data = await res.json();
      if (data.success && data.payroll) {
        setPayrollData(data.payroll);
        if (data.payroll.allocations && data.payroll.allocations.length >= 3) {
          setCheckingPct(data.payroll.allocations[0].percentage);
          setSavingsPct(data.payroll.allocations[1].percentage);
          setInvestPct(data.payroll.allocations[2].percentage);
        }
      }
    } catch (err) {
      console.error('Failed to load payroll data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, [isUSMarket]);

  const totalPct = checkingPct + savingsPct + investPct;
  const netPay = payrollData?.estimatedNetPay || (isUSMarket ? 5850 : 185000);

  const handleSaveAllocations = async () => {
    if (totalPct !== 100) return;
    setSaving(true);
    try {
      const res = await fetch('/api/payroll/split-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market,
          estimatedNetPay: netPay,
          allocations: [
            {
              destination: isUSMarket ? 'Chase Checking (...4821)' : 'HDFC Salary A/c (...9012)',
              purpose: 'Living Expenses & Bills',
              percentage: checkingPct
            },
            {
              destination: isUSMarket ? 'Goldman Marcus HYSA (...9012)' : 'ICICI Emergency FD Sweep',
              purpose: 'Emergency Fund',
              percentage: savingsPct
            },
            {
              destination: isUSMarket ? 'Alpaca / Fidelity Brokerage (...3310)' : 'Zerodha / Mutual Fund Direct SIP',
              purpose: 'Automated DCA Investing',
              percentage: investPct
            },
          ]
        })
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
        fetchPayroll();
      }
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(16,185,129,0.06) 100%)',
        border: '1px solid rgba(99,102,241,0.3)',
        padding: '1.75rem',
        borderRadius: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-primary">Institutional Payroll Sync</span>
              <span className="badge badge-green">Direct Deposit Automation</span>
            </div>
            <h1 className="text-h1" style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              Automated Paycheck Splitter & Direct Deposit OS
            </h1>
            <p className="text-secondary" style={{ marginTop: '0.25rem', maxWidth: 640 }}>
              Split your paychecks at the employer rail before money ever hits your checking account. Pay your future self first through automated savings and investment DCA.
            </p>
          </div>

          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--glass-border)',
            borderRadius: 12,
            padding: '1rem 1.25rem',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Connected Payroll</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              {payrollData?.employer || (isUSMarket ? 'TechCorp LLC' : 'TCS Ltd')}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--green)', fontWeight: 600, marginTop: 4 }}>
              Via {payrollData?.payrollProvider || (isUSMarket ? 'ADP Workforce Now' : 'Workday HR')}
            </div>
          </div>
        </div>
      </div>

      {/* Paycheck Overview Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        <div className="card">
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated Net Paycheck</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: 4 }}>
            {currencySymbol}{netPay.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Paid {payrollData?.payFrequency || 'Bi-Weekly'}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Annual Automated DCA</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--green)', marginTop: 4 }}>
            {currencySymbol}{Math.round((netPay * (investPct / 100)) * (isUSMarket ? 26 : 12)).toLocaleString()}/yr
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--green)', marginTop: 4 }}>
            Auto-invested before temptation to spend
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Emergency Fund Allocation</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginTop: 4 }}>
            {currencySymbol}{Math.round((netPay * (savingsPct / 100)) * (isUSMarket ? 26 : 12)).toLocaleString()}/yr
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Strengthens liquidity buffer
          </div>
        </div>
      </div>

      {/* Paycheck Split Builder */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 className="text-h3" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sliders size={20} color="var(--primary)" /> Configure Direct Deposit Split
            </h3>
            <p className="text-sm text-secondary" style={{ marginTop: 2 }}>
              Slide to adjust the exact percentage distributed to each account per pay cycle.
            </p>
          </div>

          <div style={{
            fontSize: '0.875rem',
            fontWeight: 700,
            padding: '0.4rem 0.8rem',
            borderRadius: 'var(--radius)',
            background: totalPct === 100 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            color: totalPct === 100 ? 'var(--green)' : 'var(--red)'
          }}>
            Total: {totalPct}% {totalPct !== 100 && '(Must equal 100%)'}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Destination 1: Checking */}
          <div style={{ background: 'var(--surface-raised)', borderRadius: 12, padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Wallet size={20} color="var(--primary)" />
                <div>
                  <div style={{ fontWeight: 700 }}>Living Expenses & Daily Bills</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Primary Checking Account ({isUSMarket ? 'Chase ...4821' : 'HDFC ...9012'})
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{checkingPct}%</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {currencySymbol}{Math.round(netPay * (checkingPct / 100)).toLocaleString()}/paycheck
                </div>
              </div>
            </div>
            <input
              type="range"
              min={10}
              max={90}
              value={checkingPct}
              onChange={(e) => setCheckingPct(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--primary)' }}
            />
          </div>

          {/* Destination 2: Emergency Savings */}
          <div style={{ background: 'var(--surface-raised)', borderRadius: 12, padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <PiggyBank size={20} color="var(--green)" />
                <div>
                  <div style={{ fontWeight: 700 }}>High-Yield Emergency Reserve</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    High-Yield Savings ({isUSMarket ? 'Goldman Marcus 4.40%' : 'ICICI FD Sweep'})
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--green)' }}>{savingsPct}%</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {currencySymbol}{Math.round(netPay * (savingsPct / 100)).toLocaleString()}/paycheck
                </div>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={60}
              value={savingsPct}
              onChange={(e) => setSavingsPct(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--green)' }}
            />
          </div>

          {/* Destination 3: Investment DCA */}
          <div style={{ background: 'var(--surface-raised)', borderRadius: 12, padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <TrendingUp size={20} color="var(--gold)" />
                <div>
                  <div style={{ fontWeight: 700 }}>Automated Wealth & Index DCA</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Investment Brokerage ({isUSMarket ? 'Alpaca / Fidelity S&P 500' : 'Zerodha Nifty ETF'})
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--gold)' }}>{investPct}%</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {currencySymbol}{Math.round(netPay * (investPct / 100)).toLocaleString()}/paycheck
                </div>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={60}
              value={investPct}
              onChange={(e) => setInvestPct(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--gold)' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            * Allocations are registered as automated direct deposit instructions directly with your employer's payroll provider.
          </div>

          <button
            className="btn btn-primary"
            onClick={handleSaveAllocations}
            disabled={saving || totalPct !== 100}
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, padding: '0.625rem 1.5rem' }}
          >
            {saving ? <RefreshCw className="spin" size={16} /> : <CheckCircle2 size={16} />}
            {saving ? 'Transmitting to Payroll…' : 'Save & Deploy Split Instructions'}
          </button>
        </div>

        {saveSuccess && (
          <div style={{
            marginTop: '1.25rem',
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid var(--green)',
            borderRadius: 12,
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <CheckCircle2 size={24} color="var(--green)" />
            <div>
              <div style={{ fontWeight: 700, color: 'var(--green)' }}>
                Direct Deposit Split Active!
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                Your next paycheck from {payrollData?.employer} will automatically be routed according to this formula.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
