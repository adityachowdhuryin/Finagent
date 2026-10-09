import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged, signOut as firebaseSignOut,
  GoogleAuthProvider, signInWithPopup,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, RecaptchaVerifier, signInWithPhoneNumber,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { track } from '../utils/analytics';

const AuthContext = createContext(null);

// Default investor profile seeded with realistic demo data for new users
const seedInvestorProfile = (uid, name, email) => ({
  name,
  email,
  phone: '',
  city: 'Bangalore',
  dob: '',
  pan: '',
  riskProfile: 'moderate',
  createdAt: new Date().toISOString(),
  lastLogin: new Date().toISOString(),
  netWorth: 12400000,
  holdings: {
    equities: [
      { symbol: 'INFY', name: 'Infosys Ltd', qty: 120, avgBuy: 1340, sector: 'Technology' },
      { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', qty: 85, avgBuy: 1620, sector: 'Banking' },
    ],
    mf: [
      { folio: 'AXS001', scheme: 'Axis Bluechip Fund - Direct Growth', amc: 'Axis MF', units: 892.34, nav: 358.12, value: 319600, xirr: 14.2 },
      { folio: 'MRB001', scheme: 'Mirae Asset Large Cap Fund - Direct Growth', amc: 'Mirae Asset', units: 421.18, nav: 92.45, value: 389378, xirr: 16.1 },
    ],
    fd: [
      { bank: 'HDFC Bank', principal: 250000, rate: 7.1, maturityDate: '2026-09-17', maturityAmount: 267750 },
    ],
    epf: { balance: 2130720, employeeContrib: 121200, employerContrib: 121200, interest: 173641 },
    gold: [
      { type: 'SGB', quantity: 5, currentValue: 450000 },
    ],
    realEstate: [],
  },
  goals: [
    { id: 'g1', name: "Daughter's Education", icon: '🎓', targetAmount: 2500000, targetDate: '2028-06-01', currentCorpus: 1087500, monthlyRequired: 18000, currentSIP: 15000, yearsLeft: 2, progress: 43, status: 'behind', probability: 72 },
    { id: 'g2', name: 'Retirement', icon: '🏖️', targetAmount: 30000000, targetDate: '2045-01-01', currentCorpus: 4800000, monthlyRequired: 25000, currentSIP: 22000, yearsLeft: 19, progress: 16, status: 'on-track', probability: 84 },
    { id: 'g3', name: 'Home Purchase', icon: '🏠', targetAmount: 5000000, targetDate: '2027-01-01', currentCorpus: 1240000, monthlyRequired: 45000, currentSIP: 35000, yearsLeft: 1, progress: 25, status: 'at-risk', probability: 41 },
  ],
  insurance: [
    { type: 'Term Life', insurer: 'LIC of India', sumAssured: 5000000, premium: 18400, maturityYear: 2051 },
    { type: 'Health', insurer: 'Star Health', sumAssured: 500000, premium: 12500, maturityYear: null },
  ],
  loans: [],
  sips: [
    { scheme: 'Axis Bluechip Fund', amount: 15000, date: 5, status: 'active' },
    { scheme: 'Mirae Asset Large Cap', amount: 22000, date: 10, status: 'active' },
  ],
  linkedAdvisorId: null,
});

const seedAdvisorProfile = (uid, name, email, firmName, sebiRegNo) => ({
  name,
  email,
  phone: '',
  firmName: firmName || 'FinAgent Advisory',
  sebiRegNo: sebiRegNo || 'INA000000000',
  feeStructure: { type: 'both', aumPct: 1.0, flatFee: 50000 },
  clients: [],
  modelPortfolios: [],
  invoices: [],
  createdAt: new Date().toISOString(),
});

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'investor' | 'advisor'
  const [loading, setLoading] = useState(true);

  function loginAsDemo(role = 'investor') {
    const isAdv = role === 'advisor';
    const demoUser = {
      uid: isAdv ? 'demo-advisor-id' : 'demo-investor-id',
      displayName: isAdv ? 'Meera Kapoor' : 'Arjun Sharma',
      email: isAdv ? 'meera@advisory.in' : 'arjun.sharma@example.com',
      isDemo: true,
    };
    const demoProfile = isAdv
      ? seedAdvisorProfile(demoUser.uid, demoUser.displayName, demoUser.email)
      : seedInvestorProfile(demoUser.uid, demoUser.displayName, demoUser.email);

    setCurrentUser(demoUser);
    setUserProfile(demoProfile);
    setUserRole(role);
    try {
      localStorage.setItem('finagent_demo_role', role);
    } catch {}
    setLoading(false);
    track('login', { role });
    return demoUser;
  }

  // Listen for auth state changes
  useEffect(() => {
    // Check if demo session exists in localStorage
    const savedDemoRole = localStorage.getItem('finagent_demo_role');
    if (savedDemoRole) {
      loginAsDemo(savedDemoRole);
      return;
    }

    // Safety timeout: Never leave user on loading spinner longer than 1000ms
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        clearTimeout(safetyTimer);
        try {
          if (user) {
            setCurrentUser(user);
            await loadUserProfile(user);
          } else {
            if (!localStorage.getItem('finagent_demo_role')) {
              setCurrentUser(null);
              setUserProfile(null);
              setUserRole(null);
            }
          }
        } catch (e) {
          console.warn('Profile load warning:', e);
        } finally {
          setLoading(false);
        }
      }, (err) => {
        clearTimeout(safetyTimer);
        console.warn('Firebase onAuthStateChanged notice:', err);
        setLoading(false);
      });
    } catch (e) {
      clearTimeout(safetyTimer);
      console.warn('Firebase init notice:', e);
      setLoading(false);
    }

    return () => {
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, []);

  async function loadUserProfile(user) {
    try {
      // Check investor profile first
      const investorRef = doc(db, 'investors', user.uid);
      const investorSnap = await getDoc(investorRef);
      if (investorSnap.exists()) {
        setUserProfile(investorSnap.data());
        setUserRole('investor');
        return;
      }
      // Check advisor profile
      const advisorRef = doc(db, 'advisors', user.uid);
      const advisorSnap = await getDoc(advisorRef);
      if (advisorSnap.exists()) {
        setUserProfile(advisorSnap.data());
        setUserRole('advisor');
        return;
      }
    } catch (err) {
      console.warn('Firestore profile query notice (DB not initialized yet):', err);
    }
    // Default fallback to investor role with seed data
    const fallback = seedInvestorProfile(user.uid, user.displayName || 'Investor', user.email);
    setUserProfile(fallback);
    setUserRole('investor');
  }

  // ── Sign in methods ──────────────────────────────────────────────────────

  async function signInWithGoogle(role) {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    await ensureProfileExists(result.user, role);
    track('signup', { role: role || 'investor', method: 'google' });
    track('login', { role: role || 'investor' });
    return result;
  }

  async function signInWithEmail(email, password) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    track('login', { role: userRole || 'investor' });
    return result;
  }

  async function signUpWithEmail(email, password, displayName, role, extras = {}) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    await createProfile(result.user, role, extras);
    return result;
  }

  async function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  function setupRecaptcha(elementId) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, elementId, { size: 'invisible' });
    return window.recaptchaVerifier;
  }

  async function sendOTP(phone) {
    const verifier = window.recaptchaVerifier || setupRecaptcha('recaptcha-container');
    const result = await signInWithPhoneNumber(auth, phone, verifier);
    return result;
  }

  async function signOut() {
    try {
      localStorage.removeItem('finagent_demo_role');
      await firebaseSignOut(auth);
      track('logout', {});
    } catch (e) {
      console.warn('Sign out notice:', e);
    }
    setCurrentUser(null);
    setUserProfile(null);
    setUserRole(null);
  }

  // ── Profile creation ─────────────────────────────────────────────────────

  async function ensureProfileExists(user, role) {
    try {
      const investorSnap = await getDoc(doc(db, 'investors', user.uid));
      const advisorSnap = await getDoc(doc(db, 'advisors', user.uid));
      if (!investorSnap.exists() && !advisorSnap.exists() && role) {
        await createProfile(user, role);
      }
    } catch {
      // If Firestore unavailable, seed local state
      const p = role === 'advisor'
        ? seedAdvisorProfile(user.uid, user.displayName || 'Advisor', user.email)
        : seedInvestorProfile(user.uid, user.displayName || 'Investor', user.email);
      setUserProfile(p);
      setUserRole(role || 'investor');
    }
  }

  async function createProfile(user, role, extras = {}) {
    if (role === 'advisor') {
      const profile = seedAdvisorProfile(user.uid, user.displayName || extras.name || 'Advisor', user.email, extras.firmName, extras.sebiRegNo);
      try {
        await setDoc(doc(db, 'advisors', user.uid), profile);
        fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/email/welcome`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: user.displayName || extras.name || 'there', 
            email: user.email,
            role: role || 'investor'
          }),
        }).catch(() => {});
        track('signup', { role, method: 'email' });
      } catch (e) {
        console.warn('Firestore setDoc notice:', e);
      }
      setUserProfile(profile);
      setUserRole('advisor');
    } else {
      const profile = seedInvestorProfile(user.uid, user.displayName || extras.name || 'Investor', user.email);
      try {
        await setDoc(doc(db, 'investors', user.uid), profile);
        fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/email/welcome`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: user.displayName || extras.name || 'there', 
            email: user.email,
            role: role || 'investor'
          }),
        }).catch(() => {});
        track('signup', { role, method: 'email' });
      } catch (e) {
        console.warn('Firestore setDoc notice:', e);
      }
      setUserProfile(profile);
      setUserRole('investor');
    }
  }

  const value = {
    currentUser,
    user: currentUser,
    userProfile,
    userRole,
    loading,
    loginAsDemo,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    sendOTP,
    resetPassword,
    signOut,
    createProfile,
    reloadProfile: () => currentUser && loadUserProfile(currentUser),
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '1rem', background: 'var(--bg)' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading FinAgent…</div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
