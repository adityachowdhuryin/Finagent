import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { track } from '../utils/analytics';

const SubscriptionContext = createContext(null);

// ─── Tier definitions ──────────────────────────────────────────────────────────
export const TIERS = {
  free:    { label: 'Free',           price: 0,      priceUSD: 0,    color: '#6B7280' },
  pro:     { label: 'Pro',            price: 299,    priceUSD: 19,   color: '#6366F1' },
  advisor: { label: 'Advisor',        price: 999,    priceUSD: 99,   color: '#F59E0B' },
  black:   { label: 'FinAgent Black', price: 150000, priceUSD: 2400, color: '#D4AF37' },
};

// ─── Feature access map ────────────────────────────────────────────────────────
const ACCESS = {
  dashboard:       ['free', 'pro', 'advisor', 'black'],
  portfolio:       ['free', 'pro', 'advisor', 'black'],
  news:            ['free', 'pro', 'advisor', 'black'],
  health_score:    ['free', 'pro', 'advisor', 'black'],
  fire_calc:       ['free', 'pro', 'advisor', 'black'],
  performance:     ['free', 'pro', 'advisor', 'black'],
  goals_view:      ['free', 'pro', 'advisor', 'black'],
  goals_edit:      ['pro', 'advisor', 'black'],
  goals_autopilot: ['pro', 'advisor', 'black'],
  ai_chat:         ['free', 'pro', 'advisor', 'black'], // limited per month for free
  itr_assistant:   ['pro', 'advisor', 'black'],
  tax_harvester:   ['pro', 'advisor', 'black'],
  pdf_reports:     ['pro', 'advisor', 'black'],
  rebalancing:     ['pro', 'advisor', 'black'],
  insurance:       ['pro', 'advisor', 'black'],
  loan_analyzer:   ['pro', 'advisor', 'black'],
  cashflow:        ['pro', 'advisor', 'black'],
  documents:       ['pro', 'advisor', 'black'],
  watchlist:       ['pro', 'advisor', 'black'],
  govt_schemes:    ['pro', 'advisor', 'black'],
  import_portfolio:['pro', 'advisor', 'black'],
  peers:           ['pro', 'advisor', 'black'],
  dna:             ['pro', 'advisor', 'black'],
  // FinAgent Black Sovereign Family Office Perks
  black_concierge:      ['black'],
  cpa_human_signoff:    ['black'],
  trust_legal_review:   ['black'],
  zero_carry_spv:       ['black'],
  multimodal_unlimited: ['pro', 'advisor', 'black'],
  // Advisor-only
  advisor_tools:   ['advisor', 'black'],
  client_book:     ['advisor', 'black'],
  aum_dashboard:   ['advisor', 'black'],
  model_portfolios:['advisor', 'black'],
  portal_settings: ['advisor', 'black'],
  onboarding:      ['advisor', 'black'],
  compliance:      ['advisor', 'black'],
  meeting_prep:    ['advisor', 'black'],
  report_cards:    ['advisor', 'black'],
  recommendations: ['advisor', 'black'],
  audit_log:       ['advisor', 'black'],
  insights:        ['advisor', 'black'],
};

export const AI_LIMITS = { free: 5, pro: Infinity, advisor: Infinity, black: Infinity };

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
