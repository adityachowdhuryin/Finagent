import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, TrendingUp, AlertTriangle, Lightbulb, Calendar, FileDown,
  Eye, BarChart2, Zap, Shield, PieChart, DollarSign, Heart, Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useActionCards } from '../../hooks/useActionCards';
import { NetWorthHero, AssetBreakdownPills } from '../../components/cards/NetWorthCard';
import NetWorthChart from '../../components/charts/NetWorthChart';
import AssetAllocationPie from '../../components/charts/AssetAllocationPie';
import HealthScoreRing from '../../components/cards/HealthScoreRing';
import ReportGenerator from './ReportGenerator';
import { formatLakh, formatPct, getStatusColor, formatCurrency } from '../../utils/formatters';

function ActionCard({ item, onAskAI, onDismiss }) {
  const navigate = useNavigate();
  const iconColors = { high: 'var(--red)', medium: 'var(--gold)', low: 'var(--green)' };
  const title = item.title || item.text || 'Action Recommended';
  const body = item.body || (item.title ? item.text : '');
  const prompt = item.prompt || title;

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        gap: '0.875rem',
        alignItems: 'flex-start',
        cursor: item.href ? 'pointer' : 'default',
        transition: 'var(--transition)',
        position: 'relative',
        background: 'var(--surface)',
      }}
      onClick={() => { if (item.href) navigate(item.href); }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--glass-border)';
        e.currentTarget.style.transform = 'none';
      }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(item.id); }}
        style={{
          position: 'absolute',
          top: '0.5rem',
          right: '0.5rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          fontSize: '1.25rem',
          lineHeight: 1,
        }}
        title="Dismiss insight"
      >
        ×
      </button>
      <div style={{ fontSize: '1.25rem', flexShrink: 0, lineHeight: 1.3 }}>{item.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
          {title}
        </div>
        {body && (
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {body}
          </div>
        )}
        {item.potentialGain && (
          <div style={{ marginTop: '0.4rem', fontSize: '0.8125rem', color: 'var(--green)', fontWeight: 600 }}>
            💰 Potential benefit: {formatCurrency(item.potentialGain)}/year
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.6rem' }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={(e) => { e.stopPropagation(); onAskAI(prompt); }}
          >
            Ask AI → <ArrowRight size={12} />
          </button>
          {item.href && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={(e) => { e.stopPropagation(); navigate(item.href); }}
              style={{ fontSize: '0.75rem' }}
            >
              Open Tool →
            </button>
          )}
        </div>
      </div>
      <div style={{ width: 4, height: '100%', borderRadius: 2, background: iconColors[item.priority || 'medium'], flexShrink: 0, minHeight: 48 }} />
    </div>
  );
}

function GoalSummaryCard({ goal }) {
  const statusColors = { 'on-track': 'var(--green)', 'behind': 'var(--gold)', 'at-risk': 'var(--red)' };
  return (
    <div className="card" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '1.25rem' }}>{goal.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{goal.name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{goal.yearsLeft} years left · {formatLakh(goal.targetAmount)}</div>
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: statusColors[goal.status], flexShrink: 0 }}>
          {goal.progress}%
        </span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{
            width: `${goal.progress}%`,
            background: goal.status === 'on-track' ? 'linear-gradient(90deg, #059669, var(--green))' : goal.status === 'behind' ? 'linear-gradient(90deg, #D97706, var(--gold))' : 'linear-gradient(90deg, #DC2626, var(--red))',
          }}
        />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { state, isUSMarket } = useApp();
  const { netWorth, assetBreakdown, goals, healthScore, netWorthHistory, holdings, user } = state.consumer;
  const { cards: actionCards, loading: cardsLoading, refresh: refreshCards, dismiss: dismissCard } = useActionCards(state.consumer);
  const navigate = useNavigate();
  const [reportOpen, setReportOpen] = useState(false);

  // View mode toggle: 'essential' (calm, focus-first) vs 'deep_dive' (full analytics)
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('finagent_dashboard_view') || 'essential';
  });

  function handleSetViewMode(mode) {
    setViewMode(mode);
    localStorage.setItem('finagent_dashboard_view', mode);
  }

  const isEmpty = (netWorth?.total || 0) === 0 &&
    (holdings?.equities?.length || 0) === 0 &&
    (holdings?.mutualFunds?.length || 0) === 0;

  const profileSteps = [
    { label: 'Add equities', done: (holdings?.equities?.length || 0) > 0 },
    { label: 'Add mutual funds', done: (holdings?.mutualFunds?.length || 0) > 0 },
    { label: 'Add EPF / 401(k)', done: !!holdings?.epf },
    { label: 'Set goals', done: (goals?.length || 0) > 0 },
    { label: 'Add insurance', done: (holdings?.insurance?.length || 0) > 0 },
  ];
  const completedSteps = profileSteps.filter(s => s.done).length;
  const completionPct = Math.round((completedSteps / profileSteps.length) * 100);

  function handleAskAI(prompt) {
    navigate('/app/ai-advisor', { state: { initialPrompt: prompt } });
  }

  if (isEmpty) {
    return (
      <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <h1 className="text-h1">Welcome to FinAgent 👋</h1>
          <p className="text-sm text-secondary mt-1">Let's build your complete financial picture</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div
            className="card"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(99,102,241,0.03))', cursor: 'pointer', transition: 'var(--transition)' }}
            onClick={() => navigate('/app/import')}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📥</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>Import Statement</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Upload your statement PDF to instantly import all your holdings
            </div>
            <div style={{ marginTop: '1rem' }}><span className="badge badge-green">Fastest · 30 seconds</span></div>
          </div>

          <div
            className="card"
            style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))', cursor: 'pointer', transition: 'var(--transition)' }}
            onClick={() => navigate('/app/portfolio')}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--green)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✏️</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>Add Manually</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Add stocks, funds, FDs, gold, EPF/401(k), and real estate one by one
            </div>
            <div style={{ marginTop: '1rem' }}><span className="badge badge-surface">7 asset classes</span></div>
          </div>

          <div
            className="card"
            style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.02))', cursor: 'pointer', transition: 'var(--transition)' }}
            onClick={() => {
              localStorage.setItem('finagent_demo_preview', 'true');
              window.location.reload();
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎭</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>Explore with Demo</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              See what FinAgent looks like with a fully loaded portfolio — no data needed
            </div>
            <div style={{ marginTop: '1rem' }}><span className="badge badge-gold">Preview only</span></div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ fontWeight: 600 }}>Profile Completion</div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--primary)' }}>{completionPct}%</div>
          </div>
          <div className="progress-bar" style={{ marginBottom: '1rem' }}>
            <div className="progress-fill" style={{ width: `${completionPct}%` }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {profileSteps.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <span style={{ color: step.done ? 'var(--green)' : 'var(--text-muted)' }}>{step.done ? '✓' : '○'}</span>
                <span style={{ color: step.done ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const equityTotal = (holdings?.equities || []).reduce((s, e) => s + (e.value || 0), 0) +
    (holdings?.mutualFunds || []).reduce((s, m) => s + (m.value || 0), 0);

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Executive Briefing Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="text-h1" style={{ margin: 0 }}>
            {user?.name ? `Welcome back, ${user.name.split(' ')[0]} 👋` : 'Executive Briefing'}
          </h1>
          <p className="text-sm text-secondary" style={{ marginTop: 2 }}>
            {viewMode === 'essential'
              ? 'Calm executive overview · 3 priority action items today'
              : 'Detailed diagnostic analytics across all portfolios & models'}
          </p>
        </div>

        {/* View Mode Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setReportOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <FileDown size={14} />
            <span>PDF Report</span>
          </button>

          <div
            style={{
              display: 'inline-flex',
              padding: '3px',
              borderRadius: 24,
              background: 'var(--surface-raised)',
              border: '1px solid var(--glass-border)',
            }}
          >
            <button
              type="button"
              onClick={() => handleSetViewMode('essential')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.75rem',
                borderRadius: 20,
                fontSize: '0.78125rem',
                fontWeight: viewMode === 'essential' ? 700 : 500,
                background: viewMode === 'essential' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'essential' ? 'white' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Eye size={13} />
              <span>Essential</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetViewMode('deep_dive')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.75rem',
                borderRadius: 20,
                fontSize: '0.78125rem',
                fontWeight: viewMode === 'deep_dive' ? 700 : 500,
                background: viewMode === 'deep_dive' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'deep_dive' ? 'white' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <BarChart2 size={13} />
              <span>Deep Dive</span>
            </button>
          </div>
        </div>
      </div>

      {/* Completion alert if profile incomplete */}
      {!isEmpty && completionPct < 100 && (
        <div className="card" style={{ padding: '0.625rem 1rem', background: 'rgba(99,102,241,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
            <span style={{ fontWeight: 600 }}>Profile {completionPct}% complete</span>
            <span style={{ color: 'var(--text-muted)' }}>— {profileSteps.find(s => !s.done)?.label} to calibrate health score</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/app/portfolio')} style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
            Complete Setup →
          </button>
        </div>
      )}

      {/* Net Worth Hero */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <NetWorthHero netWorth={netWorth} />
        </div>
      </div>

      {/* Asset Breakdown Pills */}
      <AssetBreakdownPills assets={assetBreakdown} />

      {/* ========================================================================= */}
      {/* ESSENTIAL MODE VIEW (Calm, high focus, zero clutter)                     */}
      {/* ========================================================================= */}
      {viewMode === 'essential' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.2s ease' }}>
          {/* Priority Focus Action Center */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
              <div>
                <h2 className="text-h2" style={{ margin: 0 }}>Today's Priority Actions</h2>
                <p className="text-xs text-secondary" style={{ marginTop: 2 }}>
                  Highest-impact opportunities identified across tax, rebalancing & liquidity
                </p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={refreshCards} disabled={cardsLoading} style={{ fontSize: '0.75rem' }}>
                ↻ Refresh
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.875rem' }}>
              {cardsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="card" style={{ height: 130, background: 'linear-gradient(90deg, var(--surface-raised) 0%, rgba(255,255,255,0.05) 50%, var(--surface-raised) 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
                ))
              ) : (
                actionCards.slice(0, 3).map(item => (
                  <ActionCard key={item.id} item={item} onAskAI={handleAskAI} onDismiss={dismissCard} />
                ))
              )}
            </div>
          </div>

          {/* Quick Hub Launchers (4 Pillars) */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.625rem' }}>
              Wealth Engine Hubs
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.875rem' }}>
              {/* Card 1: Investments */}
              <div
                className="card"
                style={{ cursor: 'pointer', transition: 'var(--transition)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                onClick={() => navigate('/app/portfolio')}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.transform = 'none'; }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                      <PieChart size={17} />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--green)', fontWeight: 600 }}>Active</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Investments</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'Space Grotesk', marginTop: 2 }}>
                    {formatCurrency(equityTotal)}
                  </div>
                </div>
                <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--primary-light)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>Manage Portfolio</span> <ArrowRight size={11} />
                </div>
              </div>

              {/* Card 2: Tax & Alpha */}
              <div
                className="card"
                style={{ cursor: 'pointer', transition: 'var(--transition)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                onClick={() => navigate(isUSMarket ? '/app/wash-sale' : '/app/commission-hunter')}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.transform = 'none'; }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green)' }}>
                      <DollarSign size={17} />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--green)', fontWeight: 600 }}>Calculated</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tax & Alpha</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'Space Grotesk', marginTop: 2 }}>
                    {isUSMarket ? 'Tax Arbitrage' : 'Expense Shield'}
                  </div>
                </div>
                <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>Harvest Alpha</span> <ArrowRight size={11} />
                </div>
              </div>

              {/* Card 3: Family & Protection */}
              <div
                className="card"
                style={{ cursor: 'pointer', transition: 'var(--transition)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                onClick={() => navigate(isUSMarket ? '/app/living-trust' : '/app/family-hub')}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.transform = 'none'; }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
                      <Shield size={17} />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 600 }}>Score: {healthScore?.overall || 78}/100</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Family & Protection</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'Space Grotesk', marginTop: 2 }}>
                    {goals?.length || 0} Goals Active
                  </div>
                </div>
                <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>Family Safe</span> <ArrowRight size={11} />
                </div>
              </div>

              {/* Card 4: AI Banker & Copilot */}
              <div
                className="card"
                style={{ cursor: 'pointer', transition: 'var(--transition)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                onClick={() => navigate('/app/ai-advisor')}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.transform = 'none'; }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(124,58,237,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--purple)' }}>
                      <Sparkles size={17} />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--purple)', fontWeight: 600 }}>Ready</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AI Banker</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'Space Grotesk', marginTop: 2 }}>
                    Autonomous Copilot
                  </div>
                </div>
                <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--purple)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>Ask Question</span> <ArrowRight size={11} />
                </div>
              </div>
            </div>
          </div>

          {/* Calmer prompt to view deep dive */}
          <div style={{ textAlign: 'center', padding: '1rem', borderTop: '1px dashed var(--glass-border)', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => handleSetViewMode('deep_dive')}
              style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}
            >
              Want to see 12-month net worth trajectory and asset allocation breakdown? Switch to <strong>Deep Dive</strong> ↓
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DEEP DIVE MODE VIEW (Full analytics, charts, donut, health rings)         */}
      {/* ========================================================================= */}
      {viewMode === 'deep_dive' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', animation: 'fadeIn 0.2s ease' }}>
          {/* Net Worth Chart */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h2 className="text-h2">Net Worth Growth</h2>
                <p className="text-sm text-secondary">12-month trajectory across all assets</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['6M', '1Y', '3Y'].map(p => (
                  <button key={p} className={`chip ${p === '1Y' ? 'active' : ''}`} style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}>{p}</button>
                ))}
              </div>
            </div>
            <NetWorthChart data={netWorthHistory} />
          </div>

          {/* Health Score + Goals */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 className="text-h2">Financial Health</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setReportOpen(true)}><FileDown size={14} style={{ marginRight: 4 }}/>Report</button>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/app/health-score')}>Details →</button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <HealthScoreRing score={healthScore.overall} size={160} />
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {healthScore.components.map(c => (
                  <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8125rem' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: c.score >= 75 ? 'var(--green)' : c.score >= 55 ? 'var(--gold)' : 'var(--red)' }} />
                    <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{c.name}</span>
                    <span style={{ fontWeight: 600 }}>{c.score}/100</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Asset Allocation Pie */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 className="text-h2">Asset Allocation</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/app/portfolio')}>View All →</button>
            </div>
            <AssetAllocationPie data={assetBreakdown} />
          </div>

          {/* Action Centre */}
          <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h2 className="text-h2">AI Action Centre</h2>
                  <button className="btn btn-ghost btn-sm" onClick={refreshCards} disabled={cardsLoading}>↻ Refresh</button>
                </div>
                <p className="text-sm text-secondary">Priority opportunities identified in your portfolio</p>
              </div>
              <span className="badge badge-primary">{actionCards.length} insights</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
              {cardsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="card" style={{ height: 140, background: 'linear-gradient(90deg, var(--surface-raised) 0%, rgba(255,255,255,0.05) 50%, var(--surface-raised) 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
                ))
              ) : (
                actionCards.map(item => (
                  <ActionCard key={item.id} item={item} onAskAI={handleAskAI} onDismiss={dismissCard} />
                ))
              )}
            </div>
          </div>

          {/* Goals Summary */}
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h2 className="text-h2">Goals Overview</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/app/goals')}>Manage Goals →</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
              {goals.map(goal => <GoalSummaryCard key={goal.id} goal={goal} />)}
            </div>
          </div>
        </div>
      )}

      <ReportGenerator isOpen={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  );
}
