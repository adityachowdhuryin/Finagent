// src/pages/consumer/CreditHub.jsx
// Institutional Credit Bureau Engine (US FICO 300–850 & Indian CIBIL 300–900), Interactive Simulator, and Snowball vs Avalanche Debt Engine

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, AlertCircle, ArrowUpRight, TrendingUp, Sliders,
  CreditCard, Calendar, Flame, Sparkles, CheckCircle2, ChevronRight,
  Info, RefreshCw, Layers, Landmark, FileText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function CreditHub() {
  const navigate = useNavigate();
  const { state, isUSMarket } = useApp();
  const [loading, setLoading] = useState(true);
  const [creditData, setCreditData] = useState(null);
  const [selectedBureau, setSelectedBureau] = useState('experian'); // 'experian' | 'equifax' | 'transunion'

  // Simulator state
  const [simAction, setSimAction] = useState('PAY_DOWN_DEBT');
  const [simAmount, setSimAmount] = useState(isUSMarket ? 3500 : 75000);
  const [simulationResult, setSimulationResult] = useState(null);
  const [simulating, setSimulating] = useState(false);

  // Debt Strategy state
  const [extraPayment, setExtraPayment] = useState(isUSMarket ? 500 : 15000);
  const [debtStrategy, setDebtStrategy] = useState(null);
  const [activeStrategyView, setActiveStrategyView] = useState('avalanche'); // 'avalanche' | 'snowball'

  const market = isUSMarket ? 'US' : 'IN';
  const currencySymbol = isUSMarket ? '$' : '₹';

  const fetchScoreAndDebts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/credit/score?market=${market}`);
      const data = await res.json();
      if (data.success) {
        setCreditData(data);
        runDebtCalculation(data.accounts, extraPayment);
      }
    } catch (err) {
      console.error('Failed to load credit report:', err);
    } finally {
      setLoading(false);
    }
  };

  const runDebtCalculation = async (accounts, extra) => {
    if (!accounts || accounts.length === 0) return;
    try {
      const res = await fetch('/api/credit/debt-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debts: accounts,
          extraMonthlyPayment: extra,
          currency: currencySymbol
        })
      });
      const data = await res.json();
      if (data.success) {
        setDebtStrategy(data);
      }
    } catch (err) {
      console.error('Failed to compute debt strategy:', err);
    }
  };

  const handleSimulate = async () => {
    if (!creditData) return;
    setSimulating(true);
    try {
      const res = await fetch('/api/credit/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market,
          currentScore: creditData.score,
          action: simAction,
          amount: Number(simAmount)
        })
      });
      const data = await res.json();
      if (data.success) {
        setSimulationResult(data);
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimulating(false);
    }
  };

  useEffect(() => {
    fetchScoreAndDebts();
  }, [isUSMarket]);

  useEffect(() => {
    if (creditData?.accounts) {
      runDebtCalculation(creditData.accounts, extraPayment);
    }
  }, [extraPayment]);

  // Score circular gauge computation
  const minScore = isUSMarket ? 300 : 300;
  const maxScore = isUSMarket ? 850 : 900;
  const currentScore = creditData?.score || 780;
  const scorePercent = Math.min(Math.max(((currentScore - minScore) / (maxScore - minScore)) * 100, 0), 100);

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(59,130,246,0.06) 100%)',
        border: '1px solid rgba(99,102,241,0.3)',
        padding: '1.75rem',
        borderRadius: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-primary">Institutional Bureau Gateway</span>
              <span className="badge badge-green">Direct Bureau Feed</span>
            </div>
            <h1 className="text-h1" style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              {isUSMarket ? 'FICO® Score 8 & Credit Health OS' : 'CIBIL Bureau Score & Credit Health'}
            </h1>
            <p className="text-secondary" style={{ marginTop: '0.25rem', maxWidth: 640 }}>
              Monitor your official credit standing, run predictive scenarios before making major financial moves, and optimize debt payoff via mathematical Avalanche or Snowball models.
            </p>
          </div>

          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--glass-border)',
            borderRadius: 12,
            padding: '1rem 1.25rem',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bureau Source</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              {creditData?.bureau || (isUSMarket ? 'Experian / FICO 8' : 'TransUnion CIBIL')}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              Updated {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* 1-Click Negotiator & Loan Arbitrage Action Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        <div className="card" style={{
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(99,102,241,0.02))',
          border: '1px solid rgba(99,102,241,0.3)',
          cursor: 'pointer'
        }} onClick={() => navigate('/app/loan')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
              <Landmark size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                Loan Repricing & Arbitrage <span className="badge badge-primary">Cut EMI</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                Audit your mortgage spread vs sovereign EBLR benchmarks
              </div>
            </div>
          </div>
          <ChevronRight size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        </div>

        <div className="card" style={{
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))',
          border: '1px solid rgba(16,185,129,0.3)',
          cursor: 'pointer'
        }} onClick={() => navigate('/app/negotiator')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green)', flexShrink: 0 }}>
              <FileText size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                Bank & Fee Negotiator <span className="badge badge-green">Dispute & Reset</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                Draft statutory demand letters to bank nodal grievance officers
              </div>
            </div>
          </div>
          <ChevronRight size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        </div>
      </div>

      {/* Main Score Display & Bureau Factors */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Score Dial Card */}
        <div className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '1rem' }}>
            OFFICIAL CREDIT STANDING
          </div>

          <div style={{
            position: 'relative',
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: `conic-gradient(var(--green) ${scorePercent * 3.6}deg, var(--surface-raised) 0deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 40px rgba(16,185,129,0.15)'
          }}>
            <div style={{
              width: 170,
              height: 170,
              borderRadius: '50%',
              background: 'var(--surface)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{ fontSize: '2.75rem', fontWeight: 900, fontFamily: 'Space Grotesk', lineHeight: 1 }}>
                {creditData?.score || 780}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--green)', fontWeight: 700, marginTop: 4 }}>
                {creditData?.tier || 'Excellent'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Scale: {minScore}–{maxScore}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--green)', fontWeight: 600, fontSize: '0.85rem' }}>
            <ArrowUpRight size={16} />
            <span>+{creditData?.changeLastMonth || 8} points vs last month</span>
          </div>

          <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Qualifies for top-tier prime lending rates (30-yr mortgage / low-APR auto).
          </div>
        </div>

        {/* 5 Bureau Factors */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <h3 className="text-h3" style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={18} color="var(--primary)" /> Bureau Impact Factors
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {(creditData?.factors || []).map((factor, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 10,
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{factor.name}</span>
                    <span className="badge badge-surface" style={{ fontSize: '0.65rem' }}>{factor.weight}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {factor.detail}
                  </div>
                </div>

                <span className="badge badge-green" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                  {factor.rating}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* US Market: Tri-Bureau Network, FICO vs VantageScore & Card Utilization Strip */}
      {isUSMarket && creditData?.triBureau && (
        <>
          {/* Tri-Bureau Comparison Cards */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 className="text-h3" style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Layers size={20} color="var(--primary)" /> Tri-Bureau Scoring Matrix (Experian · Equifax · TransUnion)
                </h3>
                <p className="text-sm text-secondary" style={{ marginTop: 2 }}>
                  US lenders pull specific scoring models depending on product type (Mortgage FICO 2/4/5, Auto FICO 8/9, Credit Cards VantageScore 3.0/4.0).
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['experian', 'equifax', 'transunion'].map(b => (
                  <button
                    key={b}
                    onClick={() => setSelectedBureau(b)}
                    className={`btn btn-sm ${selectedBureau === b ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              {Object.entries(creditData.triBureau).map(([key, bData]) => {
                const isSelected = selectedBureau === key;
                return (
                  <div
                    key={key}
                    onClick={() => setSelectedBureau(key)}
                    style={{
                      background: isSelected ? 'rgba(99,102,241,0.08)' : 'var(--surface-raised)',
                      border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--glass-border)'}`,
                      borderRadius: 14,
                      padding: '1.25rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>
                        {bData.bureau}
                      </span>
                      <span className="badge badge-green" style={{ fontSize: '0.7rem', fontWeight: 700 }}>
                        {bData.status}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div style={{ background: 'var(--surface)', padding: '0.625rem', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>FICO® Score 8</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: '#10b981' }}>
                          {bData.fico8}
                        </div>
                      </div>
                      <div style={{ background: 'var(--surface)', padding: '0.625rem', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>FICO® Score 9</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: '#6366f1' }}>
                          {bData.fico9}
                        </div>
                      </div>
                      <div style={{ background: 'var(--surface)', padding: '0.625rem', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>VantageScore® 3.0</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'Space Grotesk' }}>
                          {bData.vantageScore3}
                        </div>
                      </div>
                      <div style={{ background: 'var(--surface)', padding: '0.625rem', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>VantageScore® 4.0</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'Space Grotesk' }}>
                          {bData.vantageScore4}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--glass-border)', paddingTop: '0.5rem' }}>
                      <span>Oldest Line: <strong>{bData.oldestAccountYears} yrs</strong></span>
                      <span>12-Mo Inquiries: <strong>{bData.inquiries12m}</strong></span>
                      <span>Util: <strong>{bData.utilizationPct}%</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Revolving Credit Card Utilization Meter & Chase 5/24 Tracker */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {/* Utilization Danger Meter */}
            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 className="text-h3" style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CreditCard size={18} color="var(--primary)" /> Revolving Utilization Danger Meter
                  </h3>
                  <span className="badge badge-green" style={{ fontWeight: 700 }}>
                    {creditData.utilizationMetrics.utilizationPct}% (Optimal &lt;30%)
                  </span>
                </div>
                <p className="text-xs text-secondary">
                  FICO algorithms heavily penalize utilization above 30%, while optimal scores require remaining under 9%.
                </p>

                {/* Visual Segmented Progress Bar */}
                <div style={{ margin: '1.25rem 0 0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 4, fontWeight: 600 }}>
                    <span>Balance: ${creditData.utilizationMetrics.totalBalance.toLocaleString()}</span>
                    <span>Total Limit: ${creditData.utilizationMetrics.totalLimit.toLocaleString()}</span>
                  </div>

                  <div style={{ position: 'relative', height: 14, background: 'var(--surface-raised)', borderRadius: 7, overflow: 'hidden', display: 'flex' }}>
                    {/* Optimal Zone (0-9%) */}
                    <div style={{ width: '9%', background: 'rgba(16,185,129,0.3)', borderRight: '1px solid rgba(16,185,129,0.8)' }} title="Optimal: <9%" />
                    {/* Acceptable Zone (9-30%) */}
                    <div style={{ width: '21%', background: 'rgba(245,158,11,0.25)', borderRight: '1px solid rgba(239,68,68,0.8)' }} title="Acceptable: 9-30%" />
                    {/* Danger Zone (>30%) */}
                    <div style={{ width: '70%', background: 'rgba(239,68,68,0.2)' }} title="Danger: >30%" />

                    {/* Actual Utilization Indicator */}
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${Math.min(creditData.utilizationMetrics.utilizationPct, 100)}%`,
                      background: creditData.utilizationMetrics.utilizationPct <= 9
                        ? 'var(--green)'
                        : creditData.utilizationMetrics.utilizationPct <= 30
                        ? '#10b981'
                        : 'var(--red)',
                      borderRadius: 7,
                      transition: 'width 0.4s ease'
                    }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    <span style={{ color: '#10b981' }}>0% - 9% (Optimal Boost)</span>
                    <span style={{ color: '#f59e0b' }}>9% - 30% (Standard)</span>
                    <span style={{ color: 'var(--red)' }}>&gt;30% (Severe Penalty)</span>
                  </div>
                </div>
              </div>

              <div style={{
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: 10,
                padding: '0.75rem 1rem',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <Sparkles size={20} color="var(--primary)" style={{ flexShrink: 0 }} />
                <span>{creditData.utilizationMetrics.alert}</span>
              </div>
            </div>

            {/* Chase 5/24 Rule Status */}
            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 className="text-h3" style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldCheck size={18} color="var(--primary)" /> Chase 5/24 Rule Status
                  </h3>
                  <span className="badge badge-primary" style={{ fontWeight: 800 }}>
                    {creditData.chase524.status}
                  </span>
                </div>
                <p className="text-xs text-secondary">
                  {creditData.chase524.ruleExplanation}
                </p>

                {/* 5 Visual Slots */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, margin: '1.25rem 0' }}>
                  {[1, 2, 3, 4, 5].map((slot) => {
                    const isOccupied = slot <= creditData.chase524.accountsOpened24Months;
                    return (
                      <div
                        key={slot}
                        style={{
                          background: isOccupied ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                          border: `1.5px solid ${isOccupied ? 'rgba(239,68,68,0.5)' : 'rgba(16,185,129,0.5)'}`,
                          borderRadius: 8,
                          padding: '0.5rem',
                          textAlign: 'center'
                        }}
                      >
                        <div style={{ fontSize: '0.7rem', color: isOccupied ? 'var(--red)' : '#10b981', fontWeight: 700 }}>
                          Slot {slot}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {isOccupied ? 'Taken' : 'Open'}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Next slot frees up on: <strong>{creditData.chase524.nextDropOffDate}</strong>
                </div>
              </div>

              {/* Recent Cards List */}
              <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(creditData.chase524.recentCards || []).map((card, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--surface-raised)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 6,
                      fontSize: '0.75rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{card.card}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Drops {card.dropOffDate}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hard Inquiry Aging Schedule */}
          {creditData.inquiryAging && creditData.inquiryAging.length > 0 && (
            <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
              <h3 className="text-h3" style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.75rem' }}>
                <Calendar size={16} color="var(--primary)" /> Hard Credit Inquiries & Score Aging Schedule
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
                {creditData.inquiryAging.map((inq, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--surface-raised)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 8,
                      padding: '0.75rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{inq.inquiry}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{inq.bureau} · {inq.date}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge ${inq.scoreImpact === 0 ? 'badge-surface' : 'badge-gold'}`} style={{ fontSize: '0.7rem' }}>
                        {inq.scoreImpact === 0 ? '0 pts (Aged)' : `${inq.scoreImpact} pts`}
                      </span>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>{inq.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Interactive Credit Score Simulator */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 className="text-h3" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sliders size={20} color="var(--primary)" /> What-If Credit Score Simulator
            </h3>
            <p className="text-sm text-secondary" style={{ marginTop: 2 }}>
              Simulate how actions affect your bureau rating before executing.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              Select Hypothetical Scenario
            </label>
            <select
              value={simAction}
              onChange={(e) => setSimAction(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--surface-raised)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius)',
                padding: '0.625rem 0.875rem',
                color: 'var(--text-primary)',
                fontWeight: 600
              }}
            >
              <option value="PAY_DOWN_DEBT">Pay Down Revolving Balance</option>
              <option value="INCREASE_CREDIT_LIMIT">Request Credit Limit Increase</option>
              <option value="OPEN_NEW_CREDIT_LINE">Apply for New Credit Card</option>
              <option value="CLOSE_OLDEST_CARD">Close Oldest Credit Card</option>
              <option value="MISS_PAYMENT_30_DAYS">Miss 30-Day Payment</option>
            </select>

            {simAction === 'PAY_DOWN_DEBT' && (
              <div style={{ marginTop: '1rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Payoff Amount: {currencySymbol}{Number(simAmount).toLocaleString()}
                </label>
                <input
                  type="range"
                  min={isUSMarket ? 500 : 10000}
                  max={isUSMarket ? 10000 : 250000}
                  step={isUSMarket ? 500 : 10000}
                  value={simAmount}
                  onChange={(e) => setSimAmount(e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>
            )}

            <button
              className="btn btn-primary"
              onClick={handleSimulate}
              disabled={simulating}
              style={{ marginTop: '1.25rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 700 }}
            >
              {simulating ? <RefreshCw className="spin" size={16} /> : <Sparkles size={16} />}
              {simulating ? 'Calculating Bureau Impact…' : 'Simulate Score Delta'}
            </button>
          </div>

          {/* Simulation Output Card */}
          <div style={{
            background: simulationResult ? (simulationResult.delta >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)') : 'var(--surface-raised)',
            border: `1px solid ${simulationResult ? (simulationResult.delta >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)') : 'var(--glass-border)'}`,
            borderRadius: 12,
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            {simulationResult ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Projected Score</span>
                  <span style={{
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    color: simulationResult.delta >= 0 ? 'var(--green)' : 'var(--red)'
                  }}>
                    {simulationResult.delta >= 0 ? `+${simulationResult.delta}` : simulationResult.delta} pts
                  </span>
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'Space Grotesk', marginTop: 4 }}>
                  {simulationResult.projectedScore}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '0.5rem', lineHeight: 1.4 }}>
                  {simulationResult.rationale}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  {simulationResult.advice}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <Sliders size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                <div style={{ fontSize: '0.875rem' }}>Select a scenario and click Simulate to preview the impact on your score.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Debt Avalanche vs. Snowball Engine */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 className="text-h3" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Flame size={20} color="var(--primary)" /> Debt Payoff Engine: Avalanche vs. Snowball
            </h3>
            <p className="text-sm text-secondary" style={{ marginTop: 2 }}>
              Mathematically eliminates high-interest credit lines.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className={`btn btn-sm ${activeStrategyView === 'avalanche' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveStrategyView('avalanche')}
            >
              Avalanche (Max Savings)
            </button>
            <button
              className={`btn btn-sm ${activeStrategyView === 'snowball' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveStrategyView('snowball')}
            >
              Snowball (Quick Wins)
            </button>
          </div>
        </div>

        {/* Extra Monthly Payment Slider */}
        <div style={{
          background: 'var(--surface-raised)',
          borderRadius: 12,
          padding: '1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ fontWeight: 600 }}>Accelerated Monthly Paydown Budget</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Extra monthly cash flow allocated on top of required minimum payments
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 260 }}>
            <input
              type="range"
              min={isUSMarket ? 100 : 5000}
              max={isUSMarket ? 3000 : 75000}
              step={isUSMarket ? 50 : 2500}
              value={extraPayment}
              onChange={(e) => setExtraPayment(Number(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--primary)' }}
            />
            <div style={{ fontWeight: 800, fontSize: '1.1rem', minWidth: 80, textAlign: 'right' }}>
              +{currencySymbol}{extraPayment.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Comparison Result Cards */}
        {debtStrategy && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div style={{
              background: activeStrategyView === 'avalanche' ? 'rgba(99,102,241,0.08)' : 'var(--surface-raised)',
              border: `1px solid ${activeStrategyView === 'avalanche' ? 'var(--primary)' : 'var(--glass-border)'}`,
              borderRadius: 12,
              padding: '1.25rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-primary">Mathematical Winner</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--green)', fontWeight: 700 }}>
                  Saves {currencySymbol}{debtStrategy.avalanche.savingsVsSnowball.toLocaleString()} in interest
                </span>
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '0.5rem' }}>Debt Avalanche</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: 'Space Grotesk', marginTop: 4 }}>
                {debtStrategy.avalanche.monthsToPayoff} Months
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                Total Interest Paid: {currencySymbol}{debtStrategy.avalanche.totalInterest.toLocaleString()}
              </div>

              <div style={{ marginTop: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Priority Payoff Order:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {debtStrategy.avalanche.priorityOrder.map((item, i) => (
                    <div key={i} style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: 'var(--primary)', fontWeight: 700 }}>#{i + 1}</span> {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{
              background: activeStrategyView === 'snowball' ? 'rgba(99,102,241,0.08)' : 'var(--surface-raised)',
              border: `1px solid ${activeStrategyView === 'snowball' ? 'var(--primary)' : 'var(--glass-border)'}`,
              borderRadius: 12,
              padding: '1.25rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-surface">Psychological Momentum</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Earliest Account Closures</span>
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '0.5rem' }}>Debt Snowball</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: 'Space Grotesk', marginTop: 4 }}>
                {debtStrategy.snowball.monthsToPayoff} Months
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                Total Interest Paid: {currencySymbol}{debtStrategy.snowball.totalInterest.toLocaleString()}
              </div>

              <div style={{ marginTop: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Priority Payoff Order:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {debtStrategy.snowball.priorityOrder.map((item, i) => (
                    <div key={i} style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: 'var(--primary)', fontWeight: 700 }}>#{i + 1}</span> {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
