import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useChat } from '../../context/ChatContext';
import { useApp } from '../../context/AppContext';
import ChatWindow from '../../components/ai/ChatWindow';
import ChatHistorySidebar from '../../components/ai/ChatHistorySidebar';

export default function AIAdvisor() {
  const location = useLocation();
  const { sendMessage, state } = useChat();
  const { isUSMarket } = useApp();
  const sentRef = useRef(false);

  useEffect(() => {
    const initialPrompt = location.state?.initialPrompt;
    if (initialPrompt && !sentRef.current && state.messages.length === 0) {
      sentRef.current = true;
      setTimeout(() => sendMessage(initialPrompt), 400);
    }
  }, [location.state]);

  return (
    <div className="page-enter" style={{ height: 'calc(100vh - var(--topbar-height) - 3rem)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div>
        <h1 className="text-h1">AI Wealth Advisor</h1>
        <p className="text-sm text-secondary mt-1">
          {isUSMarket
            ? 'Ask about your $1,420,000 portfolio — IRS Form 1040, 401(k), Backdoor Roth, wash-sale rules, asset allocation. Every response is audit-logged under SEC Rule 204-2.'
            : 'Ask about your ₹1.24Cr portfolio — taxes, goals, insurance, rebalancing. Every response is audit-logged.'}
        </p>
      </div>

      {/* Disclaimer */}
      <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 'var(--radius)', padding: '0.625rem 0.875rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
        <span style={{ flexShrink: 0 }}>🛡️</span>
        <span>
          {isUSMarket
            ? 'AI-assisted wealth copilot operating under fiduciary supervision (SEC Advisers Act of 1940 Rule 204-2). FinAgent Capital Advisors LLC · CRD #319402 / SEC #801-128490. Subject to SEC Form ADV Part 2A & Form CRS disclosures.'
            : 'AI-assisted analysis for informational purposes. All recommendations are reviewed by your registered Investment Adviser (Meera Kapoor · INA000014523) before action. Not certified financial advice.'}
        </span>
      </div>

      {/* Chat — full remaining height */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: '1rem' }}>
        <ChatHistorySidebar />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <ChatWindow />
        </div>
      </div>
    </div>
  );
}

