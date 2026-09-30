import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { useSubscription } from '../../context/SubscriptionContext';
import UpgradeModal from './UpgradeModal';

/**
 * Wraps any feature and shows a blurred lock overlay if the user
 * doesn't have the required tier.
 *
 * Usage:
 *   <FeatureGate feature="itr_assistant">
 *     <ITRAssistant />
 *   </FeatureGate>
 *
 * featureName (optional) — human-readable name shown in upgrade modal
 */
export default function FeatureGate({ feature, featureName, children }) {
  const { canAccess, tier } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (canAccess(feature)) {
    return <>{children}</>;
  }

  // Determine which tier is needed
  const tierNeeded = ['pro', 'advisor'].find(t => {
    const ACCESS_MAP = {
      pro: ['itr_assistant','tax_harvester','pdf_reports','rebalancing','insurance',
            'loan_analyzer','cashflow','documents','watchlist','govt_schemes',
            'import_portfolio','peers','dna','goals_edit','goals_autopilot','performance'],
      advisor: ['advisor_tools','client_book','aum_dashboard','model_portfolios',
                'portal_settings','onboarding','compliance','meeting_prep',
                'report_cards','recommendations','audit_log','insights'],
    };
    return (ACCESS_MAP[t] || []).includes(feature);
  }) || 'pro';

  const tierLabel = tierNeeded === 'advisor' ? 'Advisor ₹999/mo' : 'Pro ₹299/mo';
  const displayName = featureName || feature.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <>
      {/* Render children but blur them */}
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius)' }}>
        {/* Blurred preview */}
        <div style={{ filter: 'blur(6px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.5 }}>
          {children}
        </div>

        {/* Lock overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)',
          borderRadius: 'var(--radius)',
          gap: '0.75rem',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Lock size={24} color="#fff" />
          </div>
          <div style={{ textAlign: 'center', color: '#fff', maxWidth: 280 }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>
              {displayName}
            </div>
            <div style={{ fontSize: '0.8125rem', opacity: 0.85 }}>
              Available on <strong>{tierLabel}</strong> and above
            </div>
          </div>
          <button
            onClick={() => setShowUpgrade(true)}
            style={{
              background: 'var(--primary)', color: '#fff', border: 'none',
              borderRadius: 8, padding: '0.6rem 1.5rem', fontWeight: 600, cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Upgrade Now ⚡
          </button>
        </div>
      </div>

      {showUpgrade && (
        <UpgradeModal targetFeature={displayName} onClose={() => setShowUpgrade(false)} />
      )}
    </>
  );
}
