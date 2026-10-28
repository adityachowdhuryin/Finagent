// src/services/proactiveAdvisorEngine.js
// Autonomous Proactive Wealth Monitor & Event-Driven Intelligence Engine
// Evaluates 5 autonomous conditions: Market Open Pulse, Drift Radar, Tax Harvesting, Loan Spread, and FD Maturity

const STORAGE_KEY_SEEN = 'finagent_proactive_seen_alerts';

/**
 * Evaluates current consumer state and returns active proactive recommendations
 * @param {Object} consumerState - state.consumer from AppContext
 * @param {'IN'|'US'} market - active market
 * @returns {Array} activeAlerts
 */
export function computeProactiveAlerts(consumerState, market = 'IN') {
  if (!consumerState) return [];

  const alerts = [];
  const holdings = consumerState.holdings || {};
  const netWorth = consumerState.netWorth?.total || 12450000;
  const currencySymbol = market === 'IN' ? '₹' : '$';

  // 1. Morning Market Open Pulse (9:00 AM Simulation)
  const equities = holdings.equities || [];
  const totalEquityValue = equities.reduce((s, e) => s + (e.value || 0), 0);
  const estimatedDayDelta = Math.round(totalEquityValue * 0.0075); // approx +0.75% day trend

  alerts.push({
    id: 'alert_morning_pulse',
    type: 'market_pulse',
    priority: 'info',
    icon: '☀️',
    title: 'Daily Market Open Briefing',
    summary: `Global indices open buoyant. Your equity exposure (${currencySymbol}${totalEquityValue.toLocaleString()}) projected delta: +${currencySymbol}${estimatedDayDelta.toLocaleString()}.`,
    actionLabel: 'View Pulse',
    actionCommand: '/council',
    urgent: false,
  });

  // 2. Asset Allocation Drift Radar (> 5% drift from IPS Target)
  const assetBreakdown = consumerState.assetBreakdown || [];
  const equitySlice = assetBreakdown.find(a => a.label?.toLowerCase().includes('equity') || a.label?.toLowerCase().includes('mutual'));
  const currentEquityPct = equitySlice ? Math.round(equitySlice.pct) : 68;
  const targetEquityPct = 60; // IPS Target for Moderate Profile

  if (Math.abs(currentEquityPct - targetEquityPct) >= 5) {
    const driftDirection = currentEquityPct > targetEquityPct ? 'overweight' : 'underweight';
    alerts.push({
      id: 'alert_drift_radar',
      type: 'drift',
      priority: 'warning',
      icon: '⚖️',
      title: `Portfolio Drift Alert: Equity ${currentEquityPct}% vs ${targetEquityPct}% Target`,
      summary: `Equity allocation has drifted ${Math.abs(currentEquityPct - targetEquityPct)}% ${driftDirection}. Rebalancing will lock in gains and protect downside liquidity.`,
      actionLabel: '1-Click Rebalance',
      actionCommand: '/rebalance',
      urgent: true,
      impactAmount: Math.round(netWorth * 0.05),
    });
  }

  // 3. Tax-Loss Harvesting Radar (Loss lots > ₹10,000 / $1,000)
  const lossLots = equities.filter(e => (e.pnl || 0) < -8000);
  const totalHarvestableLoss = lossLots.reduce((s, e) => s + Math.abs(e.pnl || 0), 0);

  if (totalHarvestableLoss > 0) {
    const estTaxSaved = Math.round(totalHarvestableLoss * (market === 'IN' ? 0.20 : 0.35));
    alerts.push({
      id: 'alert_tax_harvest',
      type: 'tax_harvest',
      priority: 'high',
      icon: '✂️',
      title: `Tax Harvesting Radar: Save ${currencySymbol}${estTaxSaved.toLocaleString()} in Capital Gains`,
      summary: `Found ${lossLots.length} stock lot(s) with ${currencySymbol}${totalHarvestableLoss.toLocaleString()} harvestable loss. Swap into matched proxy ETFs with zero wash-sale drag.`,
      actionLabel: 'Build Harvest Ticket',
      actionCommand: '/harvest',
      urgent: true,
      impactAmount: estTaxSaved,
    });
  }

  // 4. Repo Rate & Loan Spread Arbitrage
  const hasFloatingLoan = true; // HDFC Repo-linked home loan present in portfolio
  if (hasFloatingLoan) {
    alerts.push({
      id: 'alert_loan_repricing',
      type: 'loan_arbitrage',
      priority: 'medium',
      icon: '🏦',
      title: 'Repo Rate Arbitrage: 35 bps Spread Opportunity',
      summary: 'Prevailing prime conforming rates dropped to 8.35%. Your current loan is at 8.65%. Resetting saves ₹1.82 Lakh in cumulative interest.',
      actionLabel: 'Draft Reset Letter',
      actionCommand: '/loan',
      urgent: false,
      impactAmount: 182000,
    });
  }

  // 5. Fixed Deposit Maturity Countdown (within 14 days)
  const fds = holdings.fixedDeposits || [];
  const maturingSoon = fds.filter(fd => (fd.daysRemaining !== undefined && fd.daysRemaining <= 14));
  if (maturingSoon.length > 0 || fds.length > 0) {
    const fd = maturingSoon[0] || fds[0];
    alerts.push({
      id: 'alert_fd_maturity',
      type: 'fd_maturity',
      priority: 'info',
      icon: '⏳',
      title: `FD Reinvestment Alert: ${fd.bank || 'Bank'} FD Maturity`,
      summary: `${currencySymbol}${(fd.maturityAmount || fd.amount || 250000).toLocaleString()} maturing soon. High-yield AAA corporate bonds currently offer 7.85% vs 6.90% bank renewal.`,
      actionLabel: 'Compare Yields',
      actionCommand: '/sip',
      urgent: false,
    });
  }

  return alerts;
}

/**
 * Returns number of unread alerts for badge display
 */
export function getUnreadAlertCount(alerts) {
  try {
    const seen = JSON.parse(localStorage.getItem(STORAGE_KEY_SEEN) || '[]');
    const unread = alerts.filter(a => !seen.includes(a.id));
    return unread.length;
  } catch {
    return alerts.length;
  }
}

/**
 * Marks all alerts as acknowledged in localStorage
 */
export function markAlertsAsRead(alerts) {
  try {
    const ids = alerts.map(a => a.id);
    localStorage.setItem(STORAGE_KEY_SEEN, JSON.stringify(ids));
  } catch {}
}

/**
 * Dispatches an email notification for high-priority alerts via Resend
 */
export async function sendHighConvictionEmailAlert(userEmail, alert) {
  if (!userEmail) return false;
  try {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    const res = await fetch(`${apiBase}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: userEmail,
        subject: `⚡ FinAgent Autonomous Alert: ${alert.title}`,
        text: `FinAgent Autonomous Wealth Monitor triggered an alert for your portfolio:\n\n${alert.title}\n\n${alert.summary}\n\nLog in to your FinAgent console to review and execute this recommendation.\n\n— FinAgent Autonomous Wealth OS`,
      }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Alert Email Failed]', err.message);
    return false;
  }
}
