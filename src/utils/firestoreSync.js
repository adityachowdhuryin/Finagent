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
  (holdings.equities || []).forEach(e => {
    total += (e.qty || 0) * (e.ltp || e.avgBuy || 0);
  });
  (holdings.mf || []).forEach(m => {
    total += m.value || ((m.units || 0) * (m.nav || 0));
  });
  (holdings.fd || []).forEach(f => {
    total += f.maturityAmount || f.principal || f.amount || 0;
  });
  if (holdings.epf) {
    total += holdings.epf.balance || holdings.epf.total || 0;
  }
  (holdings.gold || []).forEach(g => {
    total += g.currentValue || 0;
  });
  (holdings.realEstate || []).forEach(r => {
    total += r.equity || r.currentEstimate || 0;
  });
  return total;
}

/**
 * Derives asset breakdown array (for pie charts + pills) from holdings.
 */
export function computeAssetBreakdown(holdings = {}) {
  const equityVal = (holdings.equities || []).reduce(
    (s, e) => s + (e.qty || 0) * (e.ltp || e.avgBuy || 0), 0
  );
  const mfVal = (holdings.mf || []).reduce(
    (s, m) => s + (m.value || (m.units || 0) * (m.nav || 0)), 0
  );
  const fdVal = (holdings.fd || []).reduce(
    (s, f) => s + (f.maturityAmount || f.principal || f.amount || 0), 0
  );
  const epfVal = holdings.epf ? (holdings.epf.balance || holdings.epf.total || 0) : 0;
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
