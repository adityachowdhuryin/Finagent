import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '2rem 1rem', color: 'var(--text-primary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, backgroundColor: 'var(--surface)', padding: '1rem 0', zIndex: 10, borderBottom: '1px solid var(--glass-border)', marginBottom: '2rem' }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '1rem' }}
        >
          ← Back
        </button>
        <h1 style={{ fontSize: '1.25rem', margin: 0 }}>Privacy Policy</h1>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Last updated: September 17, 2026</div>
      </div>

      <div style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>
        <h2>1. Introduction</h2>
        <p>FinAgent Technologies values your privacy. This policy explains what data we collect, how we use it, and your rights in compliance with the Digital Personal Data Protection Act, 2023 (DPDP Act).</p>

        <h2>2. Data We Collect</h2>
        <p>(a) Account data: name, email, phone number.<br/>
        (b) Financial data: portfolio holdings, goals, and income figures you enter.<br/>
        (c) Usage data: pages visited, features used, session duration (via Firebase Analytics and Mixpanel).<br/>
        (d) Device data: browser type, IP address.</p>

        <h2>3. How We Use Your Data</h2>
        <p>(a) To provide the FinAgent service.<br/>
        (b) To generate AI-powered financial insights.<br/>
        (c) To send transactional emails (welcome, reports, alerts) via Resend.<br/>
        (d) To process payments via Razorpay.<br/>
        (e) To improve the product via anonymized analytics.</p>

        <h2>4. Data Storage</h2>
        <p>All data is stored in Google Firebase. Firestore database is hosted in the <strong>asia-south1 (Mumbai)</strong> region. Data is encrypted at rest and in transit.</p>

        <h2>5. Data Processors</h2>
        <p>We use the following trusted third parties: Google Firebase (infrastructure), Razorpay (payments), Resend (email), Mixpanel (analytics). Each processes only the minimum data required.</p>

        <h2>6. Data Sharing</h2>
        <p>We do NOT sell your personal data. We do NOT share your financial data with advertisers. We may share anonymized, aggregated data for research purposes.</p>

        <h2>7. Your Rights (DPDP Act 2023)</h2>
        <p>You have the right to:<br/>
        (a) access your data,<br/>
        (b) correct inaccurate data,<br/>
        (c) delete your account and all associated data (email legal@finagent.app — processed within 30 days),<br/>
        (d) withdraw consent.</p>

        <h2>8. Data Retention</h2>
        <p>Active account data is retained while your account exists. After account deletion, data is permanently removed within 30 days.</p>

        <h2>9. Cookies</h2>
        <p>We use essential cookies for authentication (Firebase Auth session cookies). We use analytics cookies (Mixpanel, Firebase Analytics) which can be disabled via browser settings.</p>

        <h2>10. Children</h2>
        <p>FinAgent is not intended for users under 18 years of age.</p>

        <h2>11. Changes to This Policy</h2>
        <p>We will notify users of material changes via email.</p>

        <h2>12. Contact</h2>
        <p>For privacy requests: legal@finagent.app | FinAgent Technologies</p>
      </div>
    </div>
  );
}
