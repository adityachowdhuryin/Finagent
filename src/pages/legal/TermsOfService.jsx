import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function TermsOfService() {
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
        <h1 style={{ fontSize: '1.25rem', margin: 0 }}>Terms of Service</h1>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Last updated: September 17, 2026</div>
      </div>

      <div style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>
        <h2>1. Acceptance of Terms</h2>
        <p>By using FinAgent, you agree to these terms. If you disagree, do not use the service.</p>

        <h2>2. Description of Service</h2>
        <p>FinAgent provides personal financial management tools including portfolio tracking, goal planning, tax analysis, and AI-powered financial insights. <strong>FinAgent Technologies is NOT a SEBI-registered investment advisor.</strong> Content provided is for educational and informational purposes only and does not constitute financial advice. Always consult a qualified financial advisor before making investment decisions.</p>

        <h2>3. User Accounts</h2>
        <p>You are responsible for maintaining the confidentiality of your account. You must provide accurate information. You must be at least 18 years old.</p>

        <h2>4. Subscription and Payments</h2>
        <p>Paid plans (Pro at ₹299/month, Advisor at ₹999/month) are billed monthly. Payments are processed by Razorpay and are subject to Razorpay's terms. Subscriptions auto-renew unless cancelled. <strong>14-day refund window</strong> for first-time subscribers — contact legal@finagent.app.</p>

        <h2>5. Data and Privacy</h2>
        <p>Your financial data is stored securely in Google Firebase (India region). We do not sell your personal data to third parties. See our Privacy Policy for full details.</p>

        <h2>6. Acceptable Use</h2>
        <p>You may not use FinAgent to: (a) provide financial advice to others, (b) attempt to reverse-engineer the service, (c) input false or misleading financial data.</p>

        <h2>7. Intellectual Property</h2>
        <p>All content, code, and branding of FinAgent is the property of FinAgent Technologies.</p>

        <h2>8. Limitation of Liability</h2>
        <p>FinAgent Technologies shall not be liable for any investment losses based on information provided by the platform. The service is provided "as is" without warranties of any kind.</p>

        <h2>9. Termination</h2>
        <p>We reserve the right to suspend accounts that violate these terms. You may delete your account at any time by emailing legal@finagent.app.</p>

        <h2>10. Governing Law</h2>
        <p>These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Mumbai, Maharashtra.</p>

        <h2>11. Contact</h2>
        <p>FinAgent Technologies | legal@finagent.app</p>
      </div>
    </div>
  );
}
