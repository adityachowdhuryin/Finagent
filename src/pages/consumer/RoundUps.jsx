// src/pages/consumer/RoundUps.jsx
// Spare-Change Round-Up Micro-Investing (Acorns / Jar model) + Intraday Dip Radar

import React, { useState, useEffect } from 'react';
import {
  Coins, Sparkles, TrendingUp, ArrowUpRight, CheckCircle2,
  RefreshCw, DollarSign, Target, Sliders, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function RoundUps() {
  const { state, isUSMarket } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [roundUpData, setRoundUpData] = useState(null);
  const [dipRadar, setDipRadar] = useState(null);
  const [investing, setInvesting] = useState(false);
  const [successToast, setSuccessToast] = useState(null);

  const market = isUSMarket ? 'US' : 'IN';
  const currencySymbol = isUSMarket ? '$' : '₹';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [roundUpRes, dipRes] = await Promise.all([
        fetch(`/api/roundup/status?market=${market}`).then(r => r.json()),
        fetch(`/api/pulse/dip-radar?market=${market}`).then(r => r.json())
      ]);

      if (roundUpRes.success) setRoundUpData(roundUpRes.roundUp);
      if (dipRes.success) setDipRadar(dipRes);
    } catch (err) {
      console.error('Failed to load roundups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isUSMarket]);

  const handleMultiplierChange = async (multiplier) => {
    try {
      const res = await fetch('/api/roundup/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ market, multiplier })
      });
      const data = await res.json();
      if (data.success) {
        setRoundUpData(data.roundUp);
        setSuccessToast(`Multiplier updated to ${multiplier}x!`);
        setTimeout(() => setSuccessToast(null), 3000);
      }
    } catch (err) {
      console.error('Update multiplier failed:', err);
    }
  };

  const handleInvestJarNow = async () => {
    setInvesting(true);
    try {
      const res = await fetch('/api/roundup/invest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ market })
      });
      const data = await res.json();
      if (data.success) {
        setRoundUpData(data.roundUp);
        setSuccessToast(`✓ Successfully invested into ${data.roundUp.targetAsset}!`);
        setTimeout(() => setSuccessToast(null), 4000);
      }
    } catch (err) {
      console.error('Invest error:', err);
    } finally {
      setInvesting(false);
    }
  };

  const jarBalance = roundUpData?.currentJarBalance || 0;
  const threshold = roundUpData?.investThreshold || (isUSMarket ? 25 : 250);
  const progressPct = Math.min((jarBalance / threshold) * 100, 100);

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
      {/* Toast Notification */}
      {successToast && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 9999,
          background: 'var(--primary)',
          color: '#fff',
          padding: '0.875rem 1.25rem',
          borderRadius: 'var(--radius)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: 600
        }}>
          <CheckCircle2 size={18} />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(99,102,241,0.06) 100%)',
        border: '1px solid rgba(245,158,11,0.3)',
        padding: '1.75rem',
        borderRadius: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-gold">Micro-Investing OS</span>
              <span className="badge badge-green">Card Round-Ups Active</span>
            </div>
            <h1 className="text-h1" style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              Spare-Change Round-Up Jar & Dip Radar
            </h1>
            <p className="text-secondary" style={{ marginTop: '0.25rem', maxWidth: 640 }}>
              Every card swipe rounds up to the nearest dollar / ₹10, passively accumulating wealth into index ETFs or 24K Gold. Monitor intraday market dips in real time.
            </p>
          </div>

          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--glass-border)',
            borderRadius: 12,
            padding: '1rem 1.25rem',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Micro-Invested</div>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--gold)', marginTop: 2 }}>
              {currencySymbol}{roundUpData ? roundUpData.totalInvestedToDate.toLocaleString() : '840.00'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              Over 280+ micro-transactions
            </div>
          </div>
        </div>
      </div>

      {/* Main Round-Up Jar & Multiplier Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* The Jar Card */}
        <div className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="badge badge-surface" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Coins size={14} color="var(--gold)" /> Virtual Vault Jar
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Target: {roundUpData?.targetAsset || 'S&P 500 ETF'}
              </span>
            </div>

            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div style={{ fontSize: '3.25rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--gold)', lineHeight: 1 }}>
                {currencySymbol}{jarBalance.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 8 }}>
                Current Accumulation toward {currencySymbol}{threshold} Sweep Threshold
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{
              width: '100%',
              height: 10,
              background: 'var(--surface-raised)',
              borderRadius: 5,
              overflow: 'hidden',
              marginBottom: '0.5rem'
            }}>
              <div style={{
                width: `${progressPct}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--gold), var(--primary))',
                borderRadius: 5,
                transition: 'width 0.4s ease'
              }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>{currencySymbol}0.00</span>
              <span>{Math.round(progressPct)}% Ready to Deploy</span>
              <span>{currencySymbol}{threshold}.00</span>
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleInvestJarNow}
            disabled={investing || jarBalance <= 0}
            style={{
              marginTop: '1.5rem',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontWeight: 700,
              background: 'var(--gold)',
              color: '#000'
            }}
          >
            {investing ? <RefreshCw className="spin" size={16} /> : <Sparkles size={16} />}
            {investing ? 'Investing…' : `Invest Jar Now (${currencySymbol}${jarBalance.toFixed(2)})`}
          </button>
        </div>

        {/* Multiplier & Settings Card */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <h3 className="text-h3" style={{ fontSize: '1.15rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sliders size={18} color="var(--primary)" /> Round-Up Multiplier Controls
          </h3>
          <p className="text-sm text-secondary" style={{ marginBottom: '1.25rem' }}>
            Multiply your spare change on every transaction to accelerate wealth building.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[1, 2, 3].map((mult) => (
              <button
                key={mult}
                onClick={() => handleMultiplierChange(mult)}
                style={{
                  background: roundUpData?.multiplier === mult ? 'rgba(99,102,241,0.15)' : 'var(--surface-raised)',
                  border: `2px solid ${roundUpData?.multiplier === mult ? 'var(--primary)' : 'var(--glass-border)'}`,
                  borderRadius: 12,
                  padding: '1rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: roundUpData?.multiplier === mult ? 'var(--primary)' : 'var(--text-primary)' }}>
                  {mult}x
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  {mult === 1 ? 'Standard' : mult === 2 ? 'Double' : 'Triple'}
                </div>
              </button>
            ))}
          </div>

          <div style={{
            background: 'var(--surface-raised)',
            borderRadius: 10,
            padding: '1rem',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5
          }}>
            <strong>Example Impact:</strong> A {currencySymbol}4.35 coffee rounds up to {currencySymbol}5.00 (+{currencySymbol}0.65). At <strong>{roundUpData?.multiplier || 2}x</strong>, FinAgent auto-saves <strong>{currencySymbol}{(0.65 * (roundUpData?.multiplier || 2)).toFixed(2)}</strong>!
          </div>
        </div>
      </div>

      {/* Intraday Dip Radar */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 className="text-h3" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={20} color="var(--primary)" /> Intraday Dip Radar & Tax-Harvest Scanner
            </h3>
            <p className="text-sm text-secondary" style={{ marginTop: 2 }}>
              Detects intraday selloffs &gt;2% to alert you to tax-loss harvesting or discount accumulation windows.
            </p>
          </div>
          <span className="badge badge-green">Live Scanner</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          {(dipRadar?.opportunities || []).map((opp, idx) => (
            <div
              key={idx}
              style={{
                background: 'var(--surface-raised)',
                border: '1px solid var(--glass-border)',
                borderRadius: 12,
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{opp.symbol}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 8 }}>{opp.name}</span>
                  </div>
                  <span className="badge badge-red" style={{ fontWeight: 700 }}>{opp.drop}</span>
                </div>

                <div style={{ marginTop: '0.75rem', fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {opp.recommendation}
                </div>

                {opp.potentialHarvestLoss > 0 && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--green)', fontWeight: 600 }}>
                    Tax Loss Potential: {currencySymbol}{opp.potentialHarvestLoss.toLocaleString()}
                  </div>
                )}
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => navigate('/app/execution')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  Execute Action →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Micro-Investing Transactions */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <h3 className="text-h3" style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Coins size={18} color="var(--primary)" /> Recent Round-Up Swipes
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {(roundUpData?.transactions || []).map((tx) => (
            <div
              key={tx.id}
              style={{
                background: 'var(--surface-raised)',
                border: '1px solid var(--glass-border)',
                borderRadius: 10,
                padding: '0.875rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{tx.merchant}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {tx.date} · Card spent {currencySymbol}{tx.spent.toFixed(2)}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, color: 'var(--gold)', fontSize: '0.95rem' }}>
                  +{currencySymbol}{tx.multiplied.toFixed(2)}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Round-up {currencySymbol}{tx.roundUp.toFixed(2)} ({roundUpData?.multiplier || 2}x)
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
