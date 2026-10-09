import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Zap, PieChart, Sparkles, Menu } from 'lucide-react';

export default function MobileBottomNav({ onToggleCopilot, onOpenMenu }) {
  const location = useLocation();

  const isHomeActive = ['/app/dashboard', '/app/health-score', '/app/dna', '/app/peers', '/app/cohorts'].some(
    (p) => location.pathname === p || location.pathname.startsWith(p + '/')
  );

  const isExecuteActive = ['/app/execution', '/app/broker-router', '/app/direct-indexing', '/app/roundups', '/app/payroll'].some(
    (p) => location.pathname === p || location.pathname.startsWith(p + '/')
  );

  const isPortfolioActive = ['/app/portfolio', '/app/performance', '/app/xray', '/app/watchlist', '/app/rebalancing'].some(
    (p) => location.pathname === p || location.pathname.startsWith(p + '/')
  );

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      <NavLink
        to="/app/dashboard"
        className={`mobile-nav-item ${isHomeActive ? 'active' : ''}`}
      >
        <LayoutDashboard size={20} />
        <span>Home</span>
      </NavLink>

      <NavLink
        to="/app/execution"
        className={`mobile-nav-item ${isExecuteActive ? 'active' : ''}`}
      >
        <Zap size={20} />
        <span>Execute</span>
      </NavLink>

      <NavLink
        to="/app/portfolio"
        className={`mobile-nav-item ${isPortfolioActive ? 'active' : ''}`}
      >
        <PieChart size={20} />
        <span>Portfolio</span>
      </NavLink>

      <button
        type="button"
        className="mobile-nav-item"
        onClick={onToggleCopilot}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <Sparkles size={20} style={{ color: 'var(--primary-light)' }} />
        <span style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Copilot</span>
      </button>

      <button
        type="button"
        className="mobile-nav-item"
        onClick={onOpenMenu}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <Menu size={20} />
        <span>Menu</span>
      </button>
    </nav>
  );
}
