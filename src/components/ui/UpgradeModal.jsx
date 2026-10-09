import React, { useState, useEffect } from 'react';
import { X, Zap, Star, Shield, Check } from 'lucide-react';
import { useSubscription, TIERS } from '../../context/SubscriptionContext';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { track } from '../../utils/analytics';

const PLANS_IN = [
  {
    id: 'free',
    icon: '🆓',
    name: 'Free',
    price: 0,
    currencySymbol: '₹',
    color: '#6B7280',
    features: [
      'Dashboard & Portfolio view',
      'Market Pulse & News',
      'Health Score (read-only)',
      'FIRE Calculator',
      '5 AI questions/month',
      'Goals (view only)',
    ],
    missing: [
      'ITR Assistant & Tax Tools',
      'Smart Calculators (Insurance, Loan, Cashflow)',
      'PDF Reports',
      'Unlimited AI Chat',
      'Watchlist & Price Alerts',
      'Portfolio Import (CAMS)',
    ],
  },
  {
    id: 'pro',
    icon: '⚡',
    name: 'Pro',
    price: 299,
    currencySymbol: '₹',
    color: '#6366F1',
    highlight: true,
    features: [
      'Everything in Free',
      'Unlimited AI Chat',
      'ITR Assistant & Tax Harvester',
      'Rebalancing, Insurance & Loan Analyzer',
      'Cashflow & Document Intelligence',
      'PDF Reports (downloadable)',
      'Watchlist with Price Alerts',
      'Government Schemes Tracker',
      'Portfolio Import (CAMS PDF)',
      'Peer Benchmark & Financial DNA',
    ],
    missing: ['Advisor Suite tools'],
  },
  {
    id: 'advisor',
    icon: '🏛️',
    name: 'Advisor',
    price: 999,
    currencySymbol: '₹',
    color: '#F59E0B',
    features: [
      'Everything in Pro',
      'Full Advisor Suite',
      'Client Book & Onboarding',
      'AUM Dashboard & Invoicing',
      'Model Portfolios with Drift Monitor',
      'Client Portal Management',
      'Compliance Watchdog & SEBI Alerts',
      'Meeting Prep & Report Cards',
      'Audit Log (SHA-256)',
      'Advisor ↔ Client Linking',
    ],
    missing: [],
  },
  {
    id: 'black',
    icon: '👑',
    name: 'FinAgent Black',
    price: 150000,
    interval: '/year',
    currencySymbol: '₹',
    color: '#D4AF37',
    features: [
      'Everything in Pro & Advisor',
      'Chartered Accountant (CA) Human Filing Sign-Off',
      'Living Trust Estate Legal Attorney Review',
      '0% Pre-IPO Syndicate Carried Interest Waiver',
      'Unmetered Gemini Live Multimodal Banker',
      'Sovereign Virtual Family Office Suite (/app/black)',
    ],
    missing: [],
  },
];

const PLANS_US = [
  {
    id: 'free',
    icon: '🆓',
    name: 'Free',
    price: 0,
    currencySymbol: '$',
    color: '#6B7280',
    features: [
      'US Dashboard & Portfolio view',
      'Market Pulse & News',
      'Health Score (read-only)',
      'FIRE Calculator',
      '5 AI questions/month',
      'Goals (view only)',
    ],
    missing: [
      'IRC §1091 Wash-Sale Harvester',
      'W-2 Paycheck & 401(k) Match Auditor',
      'Silicon Valley Equity OS (RSU/ISO/AMT)',
      'Living Trust & Pour-Over Will Generator',
      'Plaid 1-Click Sync',
    ],
  },
  {
    id: 'pro',
    icon: '⚡',
    name: 'Pro',
    price: 19,
    currencySymbol: '$',
    color: '#6366F1',
    highlight: true,
    features: [
      'Everything in Free',
      'Unlimited AI Financial Copilot',
      'IRC §1091 Wash-Sale Harvester & Proxy Swaps',
      'W-2 & 401(k) True-Up Match Optimizer',
      'Equity OS (RSU statutory 22% cliff & ISO AMT)',
      'Revocable Living Trust & Will (Legal PDF)',
      'Mortgage Refi & HPA PMI Removal @ 80% LTV',
      'Chase 5/24 & Travel Points Router',
      'US-India Cross-Border Shield (FBAR & PFIC)',
      'Plaid 1-Click Bank & Brokerage Sync',
    ],
    missing: ['Advisor Suite tools'],
  },
  {
    id: 'advisor',
    icon: '🏛️',
    name: 'Advisor OS',
    price: 99,
    currencySymbol: '$',
    color: '#F59E0B',
    features: [
      'Everything in Pro',
      'CFP® / RIA Fiduciary Client Book',
      'Form 1040 Schedule D Tax Drift Review',
      'SEC / FINRA Audit Trail & Compliance Watchdog',
      'AUM Billing & Stripe Invoicing',
      'Model Portfolios with Auto-Rebalance',
      'Client Portal Management',
      'Meeting Prep & AI Report Cards',
    ],
    missing: [],
  },
  {
    id: 'black',
    icon: '👑',
    name: 'FinAgent Black',
    price: 2400,
    interval: '/year',
    currencySymbol: '$',
    color: '#D4AF37',
    features: [
      'Everything in Pro & Advisor',
      'Dedicated Certified CPA Tax Return Review & Sign-Off',
      'Delaware Living Trust Legal Review & Remote Online Notary',
      '0% Pre-IPO SPV Carried Interest Waiver (SpaceX, Stripe)',
      'Unmetered Gemini Live Multimodal Banker Cockpit',
      'Sovereign Virtual Family Office Suite (/app/black)',
    ],
    missing: [],
  },
];

export default function UpgradeModal({ onClose, targetFeature }) {
  const { tier, upgradeTier } = useSubscription();
  const { currentUser, userProfile } = useAuth();
  const { isUSMarket, activeMarket } = useApp();
  const [upgrading, setUpgrading] = useState(null);
  
  const currentPlans = isUSMarket ? PLANS_US : PLANS_IN;

  useEffect(() => {
    track('upgrade_modal_opened', { source: targetFeature, tier, market: activeMarket });
  }, [targetFeature, tier, activeMarket]);

  const handleClose = () => {
    if (!upgrading) {
      track('upgrade_abandoned', { tier, market: activeMarket });
    }
    onClose();
  };

  const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;

  async function handleUpgrade(planId) {
    if (planId === tier) return;
    setUpgrading(planId);

    // US Market -> Stripe Checkout
    if (isUSMarket) {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/stripe/create-checkout-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tier: planId,
            customerEmail: currentUser?.email || 'user@example.com',
            successUrl: `${window.location.origin}/app/invoices?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${window.location.origin}/app/invoices?canceled=true`,
          }),
        });
        const data = await res.json();
        if (data.url && !data.url.includes('mock_upgraded')) {
          window.location.href = data.url;
          return;
        }
      } catch (err) {
        console.warn('Stripe checkout error, applying sandbox tier:', err.message);
      }
      // Instant upgrade fallback
      await new Promise(r => setTimeout(r, 600));
      await upgradeTier(planId);
      setUpgrading(null);
      onClose();
      return;
    }

    // India Market -> Razorpay
    if (razorpayKeyId && typeof window !== 'undefined' && window.Razorpay) {
      // Real Razorpay flow
      const amount = currentPlans.find(p => p.id === planId)?.price || 0;
      const options = {
        key: razorpayKeyId,
        amount: amount * 100, // in paise
        currency: 'INR',
        name: 'FinAgent Wealth',
        description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Subscription`,
        image: '/favicon.svg',
        handler: async (response) => {
          // Payment successful
          await upgradeTier(planId);
          setUpgrading(null);
          onClose();
        },
        prefill: {
          name: userProfile?.name || currentUser?.displayName || '',
          email: currentUser?.email || '',
          contact: userProfile?.phone || '',
        },
        theme: { color: '#6366F1' },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        console.error('Payment failed:', resp.error);
        alert(`Payment Failed: ${resp.error.description}`);
        setUpgrading(null);
      });
      rzp.open();
    } else {
      // Direct upgrade (instant test / beta)
      await new Promise(r => setTimeout(r, 600));
      await upgradeTier(planId);
      setUpgrading(null);
      onClose();
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--radius)',
        border: '1px solid var(--glass-border)',
        width: '100%', maxWidth: 860, maxHeight: '90vh', overflow: 'auto',
        boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
      }}>
        {/* Header */}
        <div style={{ padding: '1.5rem 1.5rem 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 700 }}>Upgrade FinAgent</h2>
            {targetFeature && (
              <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                🔒 <strong>{targetFeature}</strong> requires an upgrade to access.
              </p>
            )}
            {isUSMarket ? (
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--primary-light)', background: 'rgba(99,102,241,0.12)', borderRadius: 6, padding: '4px 10px', display: 'inline-block' }}>
                💳 Stripe USD Checkout · IRC §1091 Wash-Sale & Living Trust Enabled
              </div>
            ) : razorpayKeyId ? (
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--green)', background: 'rgba(16,185,129,0.1)', borderRadius: 6, padding: '4px 10px', display: 'inline-block' }}>
                💳 Secured by Razorpay {razorpayKeyId.startsWith('rzp_test') ? '(Test Mode Active)' : ''}
              </div>
            ) : (
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--gold)', background: 'rgba(245,158,11,0.1)', borderRadius: 6, padding: '4px 10px', display: 'inline-block' }}>
                ⚡ Beta mode — upgrade is instant & free during launch
              </div>
            )}
          </div>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Plans grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', padding: '1.5rem' }}>
          {currentPlans.map(plan => {
            const isCurrent = plan.id === tier;
            const isDowngrade = ['free', 'pro', 'advisor'].indexOf(plan.id) < ['free', 'pro', 'advisor'].indexOf(tier);
            return (
              <div key={plan.id} style={{
                border: `2px solid ${plan.highlight ? plan.color : 'var(--glass-border)'}`,
                borderRadius: 'var(--radius)',
                padding: '1.25rem',
                position: 'relative',
                background: plan.highlight ? `${plan.color}08` : 'var(--surface-raised)',
              }}>
                {plan.highlight && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    background: plan.color, color: '#fff', fontSize: '0.7rem', fontWeight: 700,
                    borderRadius: 20, padding: '2px 12px', whiteSpace: 'nowrap',
                  }}>MOST POPULAR</div>
                )}

                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{plan.icon}</div>
                <div style={{ fontWeight: 700, fontSize: '1.125rem', color: plan.color }}>{plan.name}</div>
                <div style={{ margin: '0.25rem 0 1rem' }}>
                  {plan.price === 0 ? (
                    <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>Free</span>
                  ) : (
                    <>
                      <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{plan.currencySymbol || (isUSMarket ? '$' : '₹')}{plan.price}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>/month</span>
                    </>
                  )}
                </div>

                {/* Features */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem', fontSize: '0.8125rem' }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }}>
                      <Check size={13} style={{ color: 'var(--green)', flexShrink: 0, marginTop: 2 }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{f}</span>
                    </div>
                  ))}
                  {plan.missing.map(f => (
                    <div key={f} style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start', opacity: 0.4 }}>
                      <X size={13} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
                      <span style={{ color: 'var(--text-muted)' }}>{f}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isCurrent || isDowngrade || upgrading === plan.id}
                  style={{
                    width: '100%', padding: '0.6rem',
                    borderRadius: 8, cursor: isCurrent || isDowngrade ? 'default' : 'pointer',
                    fontWeight: 600, fontSize: '0.875rem',
                    background: isCurrent ? 'var(--surface)' : plan.color,
                    color: isCurrent ? 'var(--text-muted)' : '#fff',
                    border: isCurrent ? '1px solid var(--glass-border)' : '1px solid transparent',
                    opacity: isDowngrade ? 0.4 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  {isCurrent ? '✓ Current Plan'
                    : upgrading === plan.id ? 'Connecting…'
                    : isDowngrade ? 'Downgrade'
                    : isUSMarket ? `Upgrade via Stripe (${plan.currencySymbol}${plan.price})` : `Upgrade to ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', padding: '0 1.5rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          {isUSMarket
            ? 'Cancel anytime · Secure checkout via Stripe · All amounts in USD · 14-day refund window'
            : 'Cancel anytime · Secure checkout via Razorpay · All amounts in INR incl. GST'}
        </div>
      </div>
    </div>
  );
}
