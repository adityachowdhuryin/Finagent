import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { track } from '../utils/analytics';

const SubscriptionContext = createContext(null);

// ─── Tier definitions ──────────────────────────────────────────────────────────
export const TIERS = {
  free:    { label: 'Free',    price: 0,   color: '#6B7280' },
  pro:     { label: 'Pro',     price: 299, color: '#6366F1' },
  advisor: { label: 'Advisor', price: 999, color: '#F59E0B' },
};

// ─── Feature access map ────────────────────────────────────────────────────────
const ACCESS = {
  dashboard:       ['free', 'pro', 'advisor'],
  portfolio:       ['free', 'pro', 'advisor'],
  news:            ['free', 'pro', 'advisor'],
  health_score:    ['free', 'pro', 'advisor'],
  fire_calc:       ['free', 'pro', 'advisor'],
  performance:     ['free', 'pro', 'advisor'],
  goals_view:      ['free', 'pro', 'advisor'],
  goals_edit:      ['pro', 'advisor'],
  goals_autopilot: ['pro', 'advisor'],
  ai_chat:         ['free', 'pro', 'advisor'], // limited per month for free
  itr_assistant:   ['pro', 'advisor'],
  tax_harvester:   ['pro', 'advisor'],
  pdf_reports:     ['pro', 'advisor'],
  rebalancing:     ['pro', 'advisor'],
  insurance:       ['pro', 'advisor'],
  loan_analyzer:   ['pro', 'advisor'],
  cashflow:        ['pro', 'advisor'],
  documents:       ['pro', 'advisor'],
  watchlist:       ['pro', 'advisor'],
  govt_schemes:    ['pro', 'advisor'],
  import_portfolio:['pro', 'advisor'],
  peers:           ['pro', 'advisor'],
  dna:             ['pro', 'advisor'],
  // Advisor-only
  advisor_tools:   ['advisor'],
  client_book:     ['advisor'],
  aum_dashboard:   ['advisor'],
  model_portfolios:['advisor'],
  portal_settings: ['advisor'],
  onboarding:      ['advisor'],
  compliance:      ['advisor'],
  meeting_prep:    ['advisor'],
  report_cards:    ['advisor'],
  recommendations: ['advisor'],
  audit_log:       ['advisor'],
  insights:        ['advisor'],
};

export const AI_LIMITS = { free: 5, pro: Infinity, advisor: Infinity };

export function SubscriptionProvider({ children }) {
  const { currentUser, userRole } = useAuth();

  // Demo mode always gets full 'pro' access
  const isDemo = currentUser?.isDemo === true;

  // Dev bypass: VITE_DEV_MODE=true in .env.local gives everyone pro access
  // Also: the owner's email always gets pro (no Firestore needed)
  const OWNER_EMAIL = 'adityachowdhury1995@gmail.com';
  const isDevBypass = import.meta.env.VITE_DEV_MODE === 'true'
    || currentUser?.email === OWNER_EMAIL;

  const [tier, setTier] = useState(() => {
    if (isDemo || isDevBypass) return 'pro';
    if (userRole === 'advisor') return 'advisor';
    return 'free';
  });
  const [aiUsed, setAiUsed] = useState(0);
  const [loading, setLoading] = useState(false);

  // Load subscription from Firestore for real users
  useEffect(() => {
    if (!currentUser || isDemo || isDevBypass) {
      setTier(isDevBypass ? 'pro' : userRole === 'advisor' ? 'advisor' : 'pro');
      return;
    }

    const col = userRole === 'advisor' ? 'advisors' : 'investors';
    const ref = doc(db, col, currentUser.uid);
    setLoading(true);

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const sub = data.subscription || {};
        setTier(sub.tier || (userRole === 'advisor' ? 'advisor' : 'free'));
        setAiUsed(sub.aiUsedThisMonth || 0);
      }
      setLoading(false);
    }, () => {
      // Firestore unavailable — grant pro to owner, free to others
      setTier(isDevBypass ? 'pro' : 'free');
      setLoading(false);
    });

    return unsub;
  }, [currentUser, userRole, isDemo, isDevBypass]);

  /**
   * Check if the current user can access a feature.
   */
  const canAccess = useCallback((feature) => {
    const allowed = ACCESS[feature];
    if (!allowed) return true; // unknown features default to open
    return allowed.includes(tier);
  }, [tier]);

  /**
   * Check if the user has AI questions remaining.
   */
  const canUseAI = useCallback(() => {
    const limit = AI_LIMITS[tier] ?? 5;
    return limit === Infinity || aiUsed < limit;
  }, [tier, aiUsed]);

  /**
   * Consume one AI question and persist counter to Firestore.
   */
  const consumeAIQuestion = useCallback(async () => {
    const newCount = aiUsed + 1;
    setAiUsed(newCount);
    const limit = AI_LIMITS[tier] ?? 5;
    if (newCount >= limit) {
      track('ai_limit_hit', { tier });
    }
    if (!currentUser || isDemo) return;
    try {
      const col = userRole === 'advisor' ? 'advisors' : 'investors';
      await setDoc(doc(db, col, currentUser.uid),
        { subscription: { aiUsedThisMonth: newCount } },
        { merge: true }
      );
    } catch (e) {
      console.warn('[Subscription] AI counter sync failed:', e.message);
    }
  }, [currentUser, userRole, isDemo, aiUsed, tier]);

  /**
   * Manually upgrade tier (for beta — admin sets tier in Firebase Console,
   * or this is called after Razorpay payment confirmation).
   */
  const upgradeTier = useCallback(async (newTier) => {
    track('upgrade_completed', { from_tier: tier, to_tier: newTier });
    setTier(newTier);
    if (!currentUser || isDemo) return;
    try {
      const col = userRole === 'advisor' ? 'advisors' : 'investors';
      await setDoc(doc(db, col, currentUser.uid),
        { subscription: { tier: newTier, upgradedAt: new Date().toISOString() } },
        { merge: true }
      );
    } catch (e) {
      console.warn('[Subscription] Tier upgrade sync failed:', e.message);
    }
  }, [currentUser, userRole, isDemo, tier]);

  const aiLimit = AI_LIMITS[tier] ?? 5;
  const aiRemaining = aiLimit === Infinity ? Infinity : Math.max(0, aiLimit - aiUsed);

  return (
    <SubscriptionContext.Provider value={{
      tier,
      loading,
      canAccess,
      canUseAI,
      consumeAIQuestion,
      upgradeTier,
      aiUsed,
      aiRemaining,
      aiLimit,
      TIERS,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be inside SubscriptionProvider');
  return ctx;
}
