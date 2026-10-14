import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Debounce timers per field
const timers = {};

/**
 * Debounced Firestore write — waits 500ms after last call before writing.
 * Safe to call on every slider move / keystroke.
 */
export function syncToFirestore(uid, role, field, value, delay = 500) {
  if (!uid || uid.startsWith('demo-')) return; // skip demo users
  const key = `${uid}-${field}`;
  if (timers[key]) clearTimeout(timers[key]);
  timers[key] = setTimeout(async () => {
    try {
      const col = role === 'advisor' ? 'advisors' : 'investors';
      await setDoc(doc(db, col, uid), { [field]: value }, { merge: true });
    } catch (e) {
      console.warn('[Firestore sync]', field, e.message);
    }
    delete timers[key];
  }, delay);
}

/**
 * Derives total net worth from a holdings object.
 */
export function computeNetWorth(holdings = {}) {
  let total = 0;
  const equities = holdings.equities || holdings.equity || [];
  equities.forEach(e => {
    total += e.value || ((e.qty || e.quantity || 0) * (e.ltp || e.avgCost || e.avgBuy || 0));
  });

  const mfs = holdings.mutualFunds || holdings.mf || [];
  mfs.forEach(m => {
    total += m.value || ((m.units || 0) * (m.nav || 0));
  });

  const fds = holdings.fixedDeposits || holdings.fd || [];
  fds.forEach(f => {
    total += f.maturityAmount || f.principal || f.amount || 0;
  });

  if (holdings.epf) {
    total += holdings.epf.total || holdings.epf.balance || 0;
  }

  (holdings.gold || []).forEach(g => {
    total += g.currentValue || 0;
  });

  (holdings.realEstate || []).forEach(r => {
    total += r.equity || r.currentEstimate || 0;
  });

  (holdings.retirement401k || []).forEach(r => {
    total += r.balance || 0;
  });

  (holdings.cashHysa || []).forEach(c => {
    total += c.balance || 0;
  });

  (holdings.crypto || []).forEach(c => {
    total += c.value || 0;
  });

  return Math.round(total);
}

/**
 * Computes deep portfolio statistics: Value, Invested, Unrealized P&L, and Day's Change.
 */
export function computePortfolioMetrics(holdings = {}) {
  let totalValue = 0;
  let totalInvested = 0;
  let dayChangeTotal = 0;

  const equities = holdings.equities || holdings.equity || [];
  equities.forEach(e => {
    const qty = Number(e.qty || e.quantity || 0);
    const ltp = Number(e.ltp || e.price || e.avgCost || e.avgBuy || 0);
    const avgCost = Number(e.avgCost || e.avgBuy || ltp);
    const val = Number(e.value || (qty * ltp));
    const invested = Number(qty * avgCost);
    totalValue += val;
    totalInvested += invested;
    if (e.change) {
      dayChangeTotal += qty * Number(e.change);
    }
  });

  const mfs = holdings.mutualFunds || holdings.mf || [];
  mfs.forEach(m => {
    const units = Number(m.units || 0);
    const nav = Number(m.nav || 0);
    const val = Number(m.value || (units * nav));
    const pnl = Number(m.pnl || 0);
    const invested = (val - pnl > 0) ? (val - pnl) : val;
    totalValue += val;
    totalInvested += invested;
  });

  const fds = holdings.fixedDeposits || holdings.fd || [];
  fds.forEach(f => {
    const principal = Number(f.principal || f.amount || 0);
    const maturity = Number(f.maturityAmount || principal);
    totalValue += maturity;
    totalInvested += principal;
  });

  if (holdings.epf) {
    const epfTotal = Number(holdings.epf.total || holdings.epf.balance || 0);
    const epfInvested = Number(holdings.epf.employeeContribution || 0) + Number(holdings.epf.employerContribution || 0);
    totalValue += epfTotal;
    totalInvested += epfInvested > 0 ? epfInvested : epfTotal;
  }

  (holdings.gold || []).forEach(g => {
    const val = Number(g.currentValue || 0);
    const units = Number(g.units || g.quantity || 0);
    const issuePrice = Number(g.issuePrice || 0);
    const invested = (units > 0 && issuePrice > 0) ? (units * issuePrice) : val;
    totalValue += val;
    totalInvested += invested;
  });

  (holdings.realEstate || []).forEach(r => {
    const equity = Number(r.equity || r.currentEstimate || 0);
    const purchase = Number(r.purchaseValue || equity);
    totalValue += equity;
    totalInvested += purchase;
  });

  (holdings.retirement401k || []).forEach(r => {
    totalValue += Number(r.balance || 0);
    totalInvested += Number(r.balance || 0);
  });

  (holdings.cashHysa || []).forEach(c => {
    totalValue += Number(c.balance || 0);
    totalInvested += Number(c.balance || 0);
  });

  (holdings.crypto || []).forEach(c => {
    totalValue += Number(c.value || 0);
    totalInvested += Number(c.value || 0);
  });

  const unrealizedPnL = totalValue - totalInvested;
  const unrealizedPnLPct = totalInvested > 0 ? ((unrealizedPnL / totalInvested) * 100) : 0;
  const dayChangePct = totalValue > 0 ? ((dayChangeTotal / totalValue) * 100) : 0;

  return {
    total: Math.round(totalValue),
    totalInvested: Math.round(totalInvested),
    unrealizedPnL: Math.round(unrealizedPnL),
    unrealizedPnLPct: +(unrealizedPnLPct.toFixed(2)),
    dayChange: Math.round(dayChangeTotal),
    dayChangePct: +(dayChangePct.toFixed(2)),
  };
}

/**
 * Derives asset breakdown array (for pie charts + pills) from holdings.
 */
export function computeAssetBreakdown(holdings = {}) {
  const equities = holdings.equities || holdings.equity || [];
  const equityVal = equities.reduce(
    (s, e) => s + (e.value || ((e.qty || e.quantity || 0) * (e.ltp || e.avgCost || e.avgBuy || 0))), 0
  );

  const mfs = holdings.mutualFunds || holdings.mf || [];
  const mfVal = mfs.reduce(
    (s, m) => s + (m.value || ((m.units || 0) * (m.nav || 0))), 0
  );

  const fds = holdings.fixedDeposits || holdings.fd || [];
  const fdVal = fds.reduce(
    (s, f) => s + (f.maturityAmount || f.principal || f.amount || 0), 0
  );

  const epfVal = holdings.epf ? (holdings.epf.total || holdings.epf.balance || 0) : 0;
  const goldVal = (holdings.gold || []).reduce((s, g) => s + (g.currentValue || 0), 0);
  const reVal = (holdings.realEstate || []).reduce(
    (s, r) => s + (r.equity || r.currentEstimate || 0), 0
  );

  const total = equityVal + mfVal + fdVal + epfVal + goldVal + reVal;
  if (total === 0) return [];

  const pct = v => +(v / total * 100).toFixed(1);

  return [
    equityVal > 0 && { name: 'Equities', value: equityVal, color: '#6366F1', pct: pct(equityVal), invested: 0 },
    mfVal > 0     && { name: 'Mutual Funds', value: mfVal, color: '#8B5CF6', pct: pct(mfVal), invested: 0 },
    fdVal > 0     && { name: 'Fixed Deposits', value: fdVal, color: '#F59E0B', pct: pct(fdVal), invested: fdVal },
    epfVal > 0    && { name: 'EPF / PPF', value: epfVal, color: '#10B981', pct: pct(epfVal), invested: 0 },
    goldVal > 0   && { name: 'Gold', value: goldVal, color: '#F97316', pct: pct(goldVal), invested: 0 },
    reVal > 0     && { name: 'Real Estate', value: reVal, color: '#EC4899', pct: pct(reVal), invested: 0 },
  ].filter(Boolean);
}
