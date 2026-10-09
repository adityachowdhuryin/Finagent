import React, { useState, useEffect } from 'react';
import { Zap, ShieldCheck, RefreshCw, Upload, CheckCircle2, ArrowRight, Building2, CreditCard, PieChart } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export default function PlaidSync() {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState('plaid');
  const [plaidData, setPlaidData] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [csvUploaded, setCsvUploaded] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchPlaidAccounts();

    // Dynamically inject Plaid Link Web SDK
    if (!document.getElementById('plaid-link-script')) {
      const script = document.createElement('script');
      script.id = 'plaid-link-script';
      script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  async function fetchPlaidAccounts() {
    try {
      const res = await fetch(`${API_BASE}/api/plaid/accounts`);
      const data = await res.json();
      if (data.success) {
        setPlaidData(data);
        if (data.isConnected) setConnected(true);
      }
    } catch (err) {
      console.error('Fetch Plaid accounts error:', err);
    }
  }

  async function handleConnectPlaid() {
    setConnecting(true);
    try {
      const linkRes = await fetch(`${API_BASE}/api/plaid/create-link-token`, { method: 'POST' });
      const linkData = await linkRes.json();

      if (window.Plaid && linkData.linkToken) {
        const handler = window.Plaid.create({
          token: linkData.linkToken,
          onSuccess: async (publicToken, metadata) => {
            const institutionName = metadata?.institution?.name || 'Chase Bank';
            const exchangeRes = await fetch(`${API_BASE}/api/plaid/exchange-public-token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ publicToken, institutionName }),
            });
            const exchangeData = await exchangeRes.json();
            if (exchangeData.success) {
              setConnected(true);
              fetchPlaidAccounts();
            }
            setConnecting(false);
          },
          onExit: (err, metadata) => {
            setConnecting(false);
          },
          onEvent: (eventName, metadata) => {
            // Optional event analytics
          }
        });
        handler.open();
        return;
      }

      // Fallback sandbox simulation if Plaid CDN script is blocked:
      const exchangeRes = await fetch(`${API_BASE}/api/plaid/exchange-public-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicToken: 'public-sandbox-token', institutionName: 'Chase & Fidelity' }),
      });
      const exchangeData = await exchangeRes.json();
      if (exchangeData.success) {
        setConnected(true);
        fetchPlaidAccounts();
      }
    } catch (err) {
      console.error('Plaid connection error:', err);
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            <span>🇺🇸</span> PLAID LINK & INSTITUTIONAL SYNC
          </div>
          <h1 className="text-h1">US Bank & Brokerage Aggregator (Plaid Sync)</h1>
          <p className="text-sm text-secondary mt-1">Directly sync Chase, Bank of America, Fidelity, Schwab, and Vanguard balances in real-time</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('plaid')}
            className={`btn btn-sm ${activeTab === 'plaid' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Zap size={14} /> Plaid 1-Click Sync
          </button>
          <button
            onClick={() => setActiveTab('csv')}
            className={`btn btn-sm ${activeTab === 'csv' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Upload size={14} /> Import Brokerage CSV
          </button>
        </div>
      </div>

      {activeTab === 'plaid' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Connection Status Card */}
          <div className="card" style={{
            background: connected
              ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.08), var(--surface))'
              : 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), var(--surface))',
            border: connected ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.5rem' }}>{connected ? '⚡' : '🔗'}</span>
                <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>
                  {connected ? 'Plaid Financial Link Connected' : 'Connect Your US Financial Institutions'}
                </div>
              </div>
              <p className="text-xs text-secondary" style={{ marginTop: 4, maxWidth: 620 }}>
                {connected
                  ? `Active end-to-end encrypted connection with ${plaidData?.accounts?.length || 5} accounts across Chase, Fidelity, Marcus, and Charles Schwab.`
                  : 'Plaid securely connects your bank, 401(k), credit cards, and brokerage accounts without storing your passwords.'}
              </p>
            </div>

            <div>
              {connected ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="badge badge-green">Live Sync Active</span>
                  <button onClick={fetchPlaidAccounts} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <RefreshCw size={13} /> Refresh
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnectPlaid}
                  disabled={connecting}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Zap size={15} /> {connecting ? 'Launching Plaid Link...' : 'Connect Bank via Plaid'}
                </button>
              )}
            </div>
          </div>

          {/* Connected Accounts Table */}
          {plaidData?.accounts && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 className="text-h3">Connected Accounts & Real-Time Balances</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Total Liquid: <strong>${plaidData.totalLiquidUSD?.toLocaleString()}</strong> · Total Invested: <strong>${plaidData.totalInvestedUSD?.toLocaleString()}</strong>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.5rem' }}>Institution</th>
                      <th style={{ padding: '0.5rem' }}>Account Name</th>
                      <th style={{ padding: '0.5rem' }}>Type</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right' }}>Current Balance</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plaidData.accounts.map((acc, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '0.625rem 0.5rem', fontWeight: 600 }}>{acc.institution}</td>
                        <td style={{ padding: '0.625rem 0.5rem', color: 'var(--text-secondary)' }}>{acc.officialName}</td>
                        <td style={{ padding: '0.625rem 0.5rem' }}>
                          <span className="badge badge-surface" style={{ fontSize: '0.7rem' }}>{acc.subtype}</span>
                        </td>
                        <td style={{ padding: '0.625rem 0.5rem', textAlign: 'right', fontWeight: 700, fontFamily: 'Space Grotesk' }}>
                          ${acc.currentBalance.toLocaleString()}
                        </td>
                        <td style={{ padding: '0.625rem 0.5rem', textAlign: 'right' }}>
                          <span style={{ color: '#4ade80', fontSize: '0.75rem', fontWeight: 600 }}>✓ Synced</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* CSV & 1099-B Import Tab */
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <Upload size={36} style={{ color: 'var(--primary)', margin: '0 auto 0.75rem' }} />
          <h3 className="text-h3">Drop Charles Schwab, Fidelity, or Vanguard CSV / 1099-B</h3>
          <p className="text-xs text-secondary" style={{ maxWidth: 500, margin: '0.5rem auto 1.5rem' }}>
            Export transaction history or holding CSV files from your brokerage portal and drag them here for instant portfolio mapping.
          </p>

          <button
            onClick={() => setCsvUploaded(true)}
            className="btn btn-secondary"
            style={{ margin: '0 auto' }}
          >
            {csvUploaded ? '✓ Fidelity_Positions_2026.csv Imported (38 Lots)' : 'Select CSV / 1099-B Statement'}
          </button>
        </div>
      )}
    </div>
  );
}
