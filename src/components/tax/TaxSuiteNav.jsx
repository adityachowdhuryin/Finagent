import React from 'react';
import { NavLink } from 'react-router-dom';
import { TrendingDown, DollarSign, Scissors, BookOpen, Briefcase, FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function TaxSuiteNav() {
  const { state } = useApp();
  const isUS = state?.activeMarket === 'US';

  const tabs = isUS ? [
    { to: '/app/wash-sale', label: 'Wash-Sale Harvester', icon: Scissors, badge: 'IRC 1091' },
    { to: '/app/tax-loss-bot', label: 'Dip Loss Bot', icon: TrendingDown, badge: 'Paired Swap' },
    { to: '/app/w2-optimizer', label: 'W-2 & 401(k)', icon: Briefcase, badge: 'Save $12k' },
    { to: '/app/tax', label: 'Tax Harvester', icon: TrendingDown },
    { to: '/app/e-file', label: 'IRS E-Filing', icon: FileText, badge: 'Form 1040' },
  ] : [
    { to: '/app/tax-loss-bot', label: 'Tax-Loss Harvesting Bot', icon: TrendingDown, badge: 'Save 20%' },
    { to: '/app/commission-hunter', label: 'Commission Hunter', icon: DollarSign, badge: 'Direct Switch' },
    { to: '/app/tax', label: 'LTCG Tax Harvester', icon: Scissors, badge: '₹1.25L Free' },
    { to: '/app/itr', label: 'ITR & Regime Optimizer', icon: BookOpen, badge: 'Old vs New' },
    { to: '/app/ctc-optimizer', label: 'CTC Optimizer', icon: Briefcase, badge: 'Save ₹65k' },
    { to: '/app/e-file', label: 'ITR E-Filing', icon: FileText, badge: 'JSON/XML' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        overflowX: 'auto',
        padding: '0.35rem 0.5rem',
        marginBottom: '1rem',
        background: 'var(--surface-raised)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--glass-border)',
        scrollbarWidth: 'none',
      }}
    >
      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 0.5rem', flexShrink: 0 }}>
        Tax Suite:
      </span>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            style={({ isActive }) => ({
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.4rem 0.85rem',
              borderRadius: 20,
              fontSize: '0.8125rem',
              fontWeight: isActive ? 700 : 500,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              color: isActive ? '#fff' : 'var(--text-secondary)',
              background: isActive ? 'var(--primary)' : 'transparent',
              border: `1px solid ${isActive ? 'var(--primary)' : 'transparent'}`,
              transition: 'all 0.15s ease',
              flexShrink: 0,
            })}
          >
            <Icon size={14} />
            <span>{tab.label}</span>
            {tab.badge && (
              <span
                style={{
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  padding: '0.08rem 0.35rem',
                  borderRadius: 10,
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'inherit',
                }}
              >
                {tab.badge}
              </span>
            )}
          </NavLink>
        );
      })}
    </div>
  );
}
