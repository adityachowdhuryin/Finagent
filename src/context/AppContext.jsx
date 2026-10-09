import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

// Mock data — still used for demo users & as fallbacks
import {
  userProfile as mockUserProfile,
  netWorth as mockNetWorth,
  assetBreakdown as mockAssetBreakdown,
  goals as mockGoals,
  healthScoreData,
  actionItems as mockActionItems,
  equityHoldings,
  mutualFunds,
  fixedDeposits,
  epfData,
  realEstate,
  goldHoldings,
  insurancePolicies,
  netWorthHistory,
} from '../data/mockPortfolio';
import {
  advisorProfile,
  clients,
  pendingRecommendations,
  auditLog,
  advisorAUMByAsset,
  riskProfileBreakdown,
} from '../data/mockAdvisorData';
import { computeNetWorth, computeAssetBreakdown } from '../utils/firestoreSync';
import { computeHealthScore } from '../utils/healthScoreEngine';
import {
  usUserProfile,
  usNetWorth,
  usAssetBreakdown,
  usGoals,
  usHealthScoreData,
  usEquities,
  us401kHoldings,
  usRealEstate,
  usCashHoldings,
  usCrypto,
} from '../data/mockUSPortfolio';

const AppContext = createContext(null);

// ─── State builders ───────────────────────────────────────────────────────────

function buildUSConsumerState(profile, isDemo) {
  if (isDemo || !profile) {
    return {
      user: usUserProfile,
      netWorth: usNetWorth,
      assetBreakdown: usAssetBreakdown,
      goals: usGoals,
      healthScore: usHealthScoreData,
      actionItems: [
        { id: 'us-act-1', text: 'Cancel $195/mo PMI on SF Condo (LTV is 78.1%)', icon: '🏡', href: '/app/mortgage-refi' },
        { id: 'us-act-2', text: 'Harvest $4,200 loss in NVDA lot via SOXX proxy', icon: '📉', href: '/app/wash-sale' },
        { id: 'us-act-3', text: 'Review Chase 5/24 status before applying for CSP', icon: '💳', href: '/app/us-cards' },
      ],
      holdings: {
        equities: usEquities,
        mutualFunds: [],
        fixedDeposits: [],
        epf: null,
        realEstate: usRealEstate,
        gold: [],
        insurance: [],
        retirement401k: us401kHoldings,
        cashHysa: usCashHoldings,
        crypto: usCrypto,
      },
      netWorthHistory: [
        { month: 'Apr-26', total: 785000 },
        { month: 'May-26', total: 798000 },
        { month: 'Jun-26', total: 812000 },
        { month: 'Jul-26', total: 825000 },
        { month: 'Aug-26', total: 834000 },
        { month: 'Sep-26', total: 842500 },
      ],
    };
  }
  return buildConsumerState(profile, isDemo);
}

function buildConsumerState(profile, isDemo) {
  if (isDemo || !profile) {
    // Rich mock data for demos / unauthenticated sessions
    return {
      user: mockUserProfile,
      netWorth: mockNetWorth,
      assetBreakdown: mockAssetBreakdown,
      goals: mockGoals,
      healthScore: healthScoreData,
      actionItems: mockActionItems,
      holdings: {
        equities: equityHoldings,
        mutualFunds,
        fixedDeposits,
        epf: epfData,
        realEstate,
        gold: goldHoldings,
        insurance: insurancePolicies,
      },
      netWorthHistory,
    };
  }

  // Real Firestore user — derive from profile
  const holdings = profile.holdings || {};
  const nwTotal = profile.netWorth || computeNetWorth(holdings);
  const breakdown = computeAssetBreakdown(holdings);
  const goals = profile.goals && profile.goals.length > 0 ? profile.goals : mockGoals;

  return {
    user: {
      name: profile.name || 'Investor',
      age: profile.dob ? Math.floor((Date.now() - new Date(profile.dob)) / 31557600000) : null,
      city: profile.city || '',
      income: profile.income || 0,
      riskProfile: profile.riskProfile || 'Moderate',
      email: profile.email || '',
      phone: profile.phone || '',
    },
    netWorth: {
      total: nwTotal,
      totalInvested: 0,
      unrealizedPnL: 0,
      unrealizedPnLPct: 0,
      monthlyDelta: 0,
      monthlyDeltaPct: 0,
      lastSynced: 'Just now',
      sources: ['FinAgent'],
    },
    assetBreakdown: breakdown.length > 0 ? breakdown : mockAssetBreakdown,
    goals: goals,
    healthScore: computeHealthScore(holdings, goals, profile),
    actionItems: profile.actionCards || mockActionItems,
    holdings: {
      // Normalize equities: handle both mock schema (ltp, avgCost, value, pnl) and seed schema (avgBuy, no ltp)
      equities: (holdings.equities || []).map(eq => ({
        ...eq,
        ltp: eq.ltp || eq.avgBuy || eq.avgCost || 0,
        avgCost: eq.avgCost || eq.avgBuy || 0,
        value: eq.value || ((eq.qty || eq.quantity || 0) * (eq.ltp || eq.avgBuy || 0)),
        pnl: eq.pnl ?? 0,
        pnlPct: eq.pnlPct ?? 0,
        holdingDays: eq.holdingDays || 0,
        taxType: eq.taxType || 'STCG',
      })),
      // Normalize MFs: handle scheme vs name, xirr vs cagr3Y, missing category
      mutualFunds: (holdings.mf || []).map(mf => ({
        ...mf,
        name: mf.name || mf.scheme || '',
        nav: mf.nav || 0,
        units: mf.units || 0,
        value: mf.value || ((mf.units || 0) * (mf.nav || 0)),
        pnl: mf.pnl ?? 0,
        pnlPct: mf.pnlPct ?? 0,
        cagr3Y: mf.cagr3Y || mf.xirr || 0,
        expenseRatio: mf.expenseRatio || 0,
        taxType: mf.taxType || 'LTCG',
        category: mf.category || 'Equity',
      })),
      // Normalize FDs: principal vs amount, compute interest and daysRemaining if missing
      fixedDeposits: (holdings.fd || []).map(fd => {
        const principal = fd.principal || fd.amount || 0;
        const maturityAmount = fd.maturityAmount || principal;
        const daysRemaining = fd.daysRemaining ?? Math.max(0, Math.floor((new Date(fd.maturityDate) - Date.now()) / 86400000));
        return {
          ...fd,
          bank: fd.bank || 'Bank',
          amount: principal,
          principal,
          maturityAmount,
          interest: fd.interest ?? (maturityAmount - principal),
          daysRemaining,
          rate: fd.rate || 0,
          maturityDate: fd.maturityDate || '',
        };
      }),
      // Normalize EPF: handle employerContrib vs employerContribution, balance vs total
      epf: holdings.epf ? {
        ...holdings.epf,
        employerContribution: holdings.epf.employerContribution || holdings.epf.employerContrib || 0,
        employeeContribution: holdings.epf.employeeContribution || holdings.epf.employeeContrib || 0,
        interestEarned: holdings.epf.interestEarned || holdings.epf.interest || 0,
        total: holdings.epf.total || holdings.epf.balance || 0,
        interestRate: holdings.epf.interestRate || 8.25,
        projectedAt60: holdings.epf.projectedAt60 || Math.round((holdings.epf.total || holdings.epf.balance || 0) * 2.5),
      } : null,
      // Normalize real estate: emi vs emiMonthly
      realEstate: (holdings.realEstate || []).map(re => ({
        ...re,
        name: re.name || 'Property',
        city: re.city || '',
        purchaseValue: re.purchaseValue || 0,
        currentEstimate: re.currentEstimate || re.currentValue || 0,
        loanOutstanding: re.loanOutstanding || 0,
        emiMonthly: re.emiMonthly || re.emi || 0,
        rentalYield: re.rentalYield || 0,
        equity: re.equity || ((re.currentEstimate || re.currentValue || 0) - (re.loanOutstanding || 0)),
      })),
      // Normalize gold: quantity vs units, type as name fallback, missing issuePrice
      gold: (holdings.gold || []).map(g => ({
        ...g,
        name: g.name || `${g.type || 'SGB'} Holdings`,
        units: g.units || g.quantity || 0,
        currentValue: g.currentValue || 0,
        maturityDate: g.maturityDate || '',
        interestRate: g.interestRate || 2.5,
        issuePrice: g.issuePrice || 0,
      })),
      insurance: profile.insurance || holdings.insurance || [],
    },
    netWorthHistory: profile.netWorthHistory || netWorthHistory,
  };
}

function buildAdvisorState(profile, isDemo) {
  if (isDemo || !profile) {
    return {
      profile: advisorProfile,
      clients,
      pendingRecommendations,
      auditLog,
      aumByAsset: advisorAUMByAsset,
      riskBreakdown: riskProfileBreakdown,
    };
  }
  return {
    profile: {
      name: profile.name || 'Advisor',
      email: profile.email || '',
      firmName: profile.firmName || 'FinAgent Advisory',
      sebiRegNo: profile.sebiRegNo || '',
      feeStructure: profile.feeStructure || { type: 'both', aumPct: 1.0, flatFee: 50000 },
    },
    clients: profile.clients || [],
    pendingRecommendations,
    auditLog,
    aumByAsset: advisorAUMByAsset,
    riskBreakdown: riskProfileBreakdown,
  };
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

function appReducer(state, action) {
  switch (action.type) {
    case 'INIT_STATE':
      return { ...state, ...action.payload };

    case 'SET_ROLE':
      return { ...state, activeRole: action.payload };

    // ── Holdings ──────────────────────────────────────────────────────────────
    case 'UPDATE_HOLDINGS':
      return {
        ...state,
        consumer: {
          ...state.consumer,
          holdings: action.payload,
          assetBreakdown: computeAssetBreakdown(action.payload),
          netWorth: {
            ...state.consumer.netWorth,
            total: computeNetWorth(action.payload),
          },
        },
      };

    // ── Goals ─────────────────────────────────────────────────────────────────
    case 'UPDATE_GOALS':
      return { ...state, consumer: { ...state.consumer, goals: action.payload } };

    case 'ADD_GOAL':
      return {
        ...state,
        consumer: { ...state.consumer, goals: [...state.consumer.goals, action.payload] },
      };

    case 'UPDATE_GOAL': {
      const goals = state.consumer.goals.map(g =>
        g.id === action.payload.id ? { ...g, ...action.payload } : g
      );
      return { ...state, consumer: { ...state.consumer, goals } };
    }

    case 'DELETE_GOAL': {
      const goals = state.consumer.goals.filter(g => g.id !== action.payload);
      return { ...state, consumer: { ...state.consumer, goals } };
    }

    // ── Action Cards (AI Agent) ───────────────────────────────────────────────
    case 'SET_ACTION_CARDS':
      return { ...state, consumer: { ...state.consumer, actionItems: action.payload } };

    // ── Advisor: Recommendation flow ──────────────────────────────────────────
    case 'APPROVE_RECO': {
      const updated = state.advisor.pendingRecommendations.map(r =>
        r.id === action.payload.id ? { ...r, status: 'approved', advisorEdit: action.payload.text } : r
      );
      const newEntry = {
        id: `al${Date.now()}`,
        clientName: action.payload.clientName,
        timestamp: new Date().toISOString(),
        type: action.payload.recoType,
        title: action.payload.title,
        action: 'approved',
        advisorNote: action.payload.text || 'Approved as recommended.',
        aiVersion: 'FinAgent-Advisory-v2.1',
        dataHash: `sha256:${Math.random().toString(36).substr(2, 12)}...`,
      };
      return {
        ...state,
        advisor: {
          ...state.advisor,
          pendingRecommendations: updated,
          auditLog: [newEntry, ...state.advisor.auditLog],
        },
      };
    }

    case 'REJECT_RECO': {
      const updated = state.advisor.pendingRecommendations.map(r =>
        r.id === action.payload.id ? { ...r, status: 'rejected', advisorEdit: action.payload.reason } : r
      );
      const newEntry = {
        id: `al${Date.now()}`,
        clientName: action.payload.clientName,
        timestamp: new Date().toISOString(),
        type: action.payload.recoType,
        title: action.payload.title,
        action: 'rejected',
        advisorNote: action.payload.reason,
        aiVersion: 'FinAgent-Advisory-v2.1',
        dataHash: `sha256:${Math.random().toString(36).substr(2, 12)}...`,
      };
      return {
        ...state,
        advisor: {
          ...state.advisor,
          pendingRecommendations: updated,
          auditLog: [newEntry, ...state.advisor.auditLog],
        },
      };
    }

    case 'SET_MARKET': {
      const newMarket = action.payload; // 'US' or 'IN'
      try { localStorage.setItem('finagent_market', newMarket); } catch {}
      return {
        ...state,
        activeMarket: newMarket,
        consumer: newMarket === 'US'
          ? buildUSConsumerState(state._rawProfile, state._isDemo)
          : buildConsumerState(state._rawProfile, state._isDemo),
      };
    }

    case 'SET_EXPERIENCE_MODE': {
      const newMode = action.payload; // 'essential' | 'pro' | 'sovereign'
      try { localStorage.setItem('finagent_experience_mode', newMode); } catch {}
      return {
        ...state,
        experienceMode: newMode,
      };
    }

    case 'UPDATE_HEALTH_SCORE':
      return { ...state, consumer: { ...state.consumer, healthScore: action.payload } };

    default:
      return state;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }) {
  const { currentUser, userProfile, userRole } = useAuth();

  const isDemo = currentUser?.isDemo === true;

  const savedMarket = (() => {
    try { return localStorage.getItem('finagent_market') || 'US'; } catch { return 'US'; }
  })();

  const savedExperienceMode = (() => {
    try { return localStorage.getItem('finagent_experience_mode') || 'pro'; } catch { return 'pro'; }
  })();

  // Derive initial state from auth context
  const initialState = {
    activeRole: userRole || null,
    activeMarket: savedMarket,
    experienceMode: savedExperienceMode,
    _rawProfile: userRole === 'investor' ? userProfile : null,
    _isDemo: isDemo || userRole !== 'investor',
    consumer: savedMarket === 'US'
      ? buildUSConsumerState(userRole === 'investor' ? userProfile : null, isDemo || userRole !== 'investor')
      : buildConsumerState(userRole === 'investor' ? userProfile : null, isDemo || userRole !== 'investor'),
    advisor: buildAdvisorState(
      userRole === 'advisor' ? userProfile : null,
      isDemo || userRole !== 'advisor'
    ),
  };

  const [state, dispatch] = useReducer(appReducer, initialState);

  // Re-initialise whenever auth profile changes (login / logout / data update)
  useEffect(() => {
    if (userRole === null) return;
    const currentMarket = state.activeMarket || savedMarket;
    const currentExpMode = state.experienceMode || savedExperienceMode;
    const newState = {
      activeRole: userRole,
      activeMarket: currentMarket,
      experienceMode: currentExpMode,
      _rawProfile: userRole === 'investor' ? userProfile : null,
      _isDemo: isDemo || userRole !== 'investor',
      consumer: currentMarket === 'US'
        ? buildUSConsumerState(userRole === 'investor' ? userProfile : null, isDemo || userRole !== 'investor')
        : buildConsumerState(userRole === 'investor' ? userProfile : null, isDemo || userRole !== 'investor'),
      advisor: buildAdvisorState(
        userRole === 'advisor' ? userProfile : null,
        isDemo || userRole !== 'advisor'
      ),
    };
    dispatch({ type: 'INIT_STATE', payload: newState });
  }, [userProfile, userRole, isDemo]);

  // ── Persistence helpers exposed to pages ────────────────────────────────────
  async function persistGoals(goals) {
    if (!currentUser || isDemo) return;
    try {
      await setDoc(doc(db, 'investors', currentUser.uid), { goals }, { merge: true });
    } catch (e) {
      console.warn('[AppContext] goal persist failed:', e.message);
    }
  }

  async function persistHoldings(holdings) {
    if (!currentUser || isDemo) return;
    try {
      await setDoc(doc(db, 'investors', currentUser.uid), { holdings }, { merge: true });
    } catch (e) {
      console.warn('[AppContext] holdings persist failed:', e.message);
    }
  }

  function recomputeHealthScore() {
    if (!currentUser || isDemo) return;
    const { holdings, goals } = state.consumer;
    const newScore = computeHealthScore(holdings, goals, userProfile);
    dispatch({ type: 'UPDATE_HEALTH_SCORE', payload: newScore });
  }

  function switchMarket(market) {
    dispatch({ type: 'SET_MARKET', payload: market });
  }

  function setExperienceMode(mode) {
    dispatch({ type: 'SET_EXPERIENCE_MODE', payload: mode });
  }

  const contextValue = React.useMemo(() => ({
    state,
    dispatch,
    activeMarket: state.activeMarket || 'US',
    isUSMarket: (state.activeMarket || 'US') === 'US',
    experienceMode: state.experienceMode || 'pro',
    setExperienceMode,
    switchMarket,
    persistGoals,
    persistHoldings,
    recomputeHealthScore
  }), [state, state.activeMarket, state.experienceMode]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function useExperienceMode() {
  const { experienceMode, setExperienceMode } = useApp();
  return { experienceMode, setExperienceMode };
}

export function useActiveMarket() {
  const { activeMarket, isUSMarket, switchMarket } = useApp();
  return { activeMarket, isUSMarket, switchMarket };
}
