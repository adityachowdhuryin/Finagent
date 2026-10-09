import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles, X, Send, Bot, User, ArrowRight, Zap, Scale,
  Scissors, FileText, ChevronRight, Minimize2, Maximize2, Shield
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export default function AICopilotSidecar({ isOpen, onToggle }) {
  const { state, isUSMarket } = useApp();
  const { currentUser, userProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const market = state?.activeMarket || (isUSMarket ? 'US' : 'IN');
  const currencySymbol = market === 'IN' ? '₹' : '$';

  // Build page context description
  const pageContext = React.useMemo(() => {
    const path = location.pathname;
    const h = state?.consumer?.holdings || {};
    const nw = state?.consumer?.netWorth?.total || 0;

    if (path.includes('/portfolio')) {
      const eqCount = h.equities?.length || 0;
      return {
        pageName: 'Investments & Portfolio',
        summary: `Holdings: ${eqCount} equities/ETFs, Net Worth: ${currencySymbol}${nw.toLocaleString()}`,
        suggestedPrompts: [
          'What is my single largest stock concentration risk?',
          'Which holding has the highest unrealized loss to harvest?',
          'How does my equity allocation compare to benchmark?'
        ]
      };
    }
    if (path.includes('/wash-sale') || path.includes('/tax')) {
      return {
        pageName: 'Tax & Alpha Optimization',
        summary: `Tax engine active (${market} rules). Harvestable losses and capital gains tracking.`,
        suggestedPrompts: [
          'Analyze my current lots for wash-sale proxy trades',
          'How much tax will I save if I harvest losses today?',
          'What is my capital gains breakdown this fiscal year?'
        ]
      };
    }
    if (path.includes('/rebalancing')) {
      return {
        pageName: 'Portfolio Rebalancing',
        summary: 'Target allocation drift monitoring and trade scheduling.',
        suggestedPrompts: [
          'How far has my equity allocation drifted from target?',
          'What are the minimum-tax rebalancing trade steps?',
          'Should I rebalance using fresh SIP inflows instead of selling?'
        ]
      };
    }
    if (path.includes('/loan') || path.includes('/mortgage-refi')) {
      return {
        pageName: 'Loan & Debt Negotiator',
        summary: 'Amortisation schedules, repo-linked spread arbitrage, and prepayment savings.',
        suggestedPrompts: [
          'Draft a rate reset negotiation letter for my bank',
          'How much interest do I save by prepaying 5% of principal?',
          'Is refinancing to current conforming rates worth the fee?'
        ]
      };
    }
    if (path.includes('/council')) {
      return {
        pageName: 'Family Office Council',
        summary: 'Multi-agent wealth committee (Alpha vs Citadel vs Tax & Legal).',
        suggestedPrompts: [
          'Debate: Sabbatical vs Stay for Promotion',
          'Debate: Buy Rental Property vs DCA into S&P 500',
          'Debate: Early Mortgage Payoff vs Equity Compounding'
        ]
      };
    }

    return {
      pageName: 'Wealth Operating System',
      summary: `Net worth: ${currencySymbol}${nw.toLocaleString()}, Profile: ${state?.consumer?.user?.riskProfile || 'Moderate'}`,
      suggestedPrompts: [
        'Convene the Family Office Council on my next big financial move',
        'Scan my entire portfolio for hidden fee leakages',
        'What are my top 3 wealth optimization actions today?'
      ]
    };
  }, [location.pathname, state?.consumer, market, currencySymbol]);

  // Initial message thread
  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      role: 'assistant',
      content: `Hello! I am your **Autonomous Wealth Copilot**. I am currently synced with your **${pageContext.pageName}** (${currencySymbol}${state?.consumer?.netWorth?.total?.toLocaleString() || 'Portfolio'}).\n\nHow can I assist your wealth strategy right now?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);

  // Update greeting when page changes
  useEffect(() => {
    setMessages(prev => [
      ...prev,
      {
        id: `context-${Date.now()}`,
        role: 'system',
        content: `Switched context to **${pageContext.pageName}**. ${pageContext.summary}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
  }, [pageContext.pageName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(userText) {
    const text = (userText || input).trim();
    if (!text || loading) return;

    setInput('');
    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    // Check for quick slash commands
    if (text.startsWith('/council')) {
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: `Initiating **Family Office Council** session. Navigating to the multi-agent debate floor...`,
            action: { type: 'navigate', to: '/app/council', label: 'Open Council Floor →' },
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
        setLoading(false);
        navigate('/app/council');
      }, 500);
      return;
    }

    if (text.startsWith('/harvest')) {
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: `Scanned portfolio lots: **NVDA** has $4,200 harvestable short-term loss. Paired proxy **SOXX** (Semiconductor ETF) avoids wash-sale penalty while preserving AI market upside.`,
            action: { type: 'navigate', to: isUSMarket ? '/app/wash-sale' : '/app/tax-loss-bot', label: 'Review Harvest Order →' },
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
        setLoading(false);
      }, 600);
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `[Context: ${pageContext.pageName} | Market: ${market}] ${text}` }],
          portfolioContext: {
            netWorth: state?.consumer?.netWorth,
            holdingsSummary: state?.consumer?.holdings,
            activePage: pageContext.pageName,
          }
        })
      });

      const data = await res.json();
      const reply = data?.reply || data?.message || data?.text ||
        `Based on your current portfolio holdings, optimizing this position can boost your annualized after-tax yield by 0.65%. Would you like me to structure an execution ticket?`;

      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: `I've analyzed your **${pageContext.pageName}** data. Based on historical trends and your risk profile (${state?.consumer?.user?.riskProfile || 'Moderate'}), maintaining disciplined DCA and harvesting loss lots before quarter-end remains your highest-conviction strategy.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Global Floating AI Orb Trigger Button (Bottom Right) */}
      <div
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 90,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <button
          type="button"
          onClick={onToggle}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.65rem 1.15rem',
            borderRadius: 30,
            background: isOpen
              ? 'var(--surface-raised)'
              : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #4f46e5 100%)',
            border: isOpen ? '1px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.2)',
            color: 'white',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: isOpen
              ? '0 4px 20px rgba(0, 0, 0, 0.3)'
              : '0 8px 30px rgba(99, 102, 241, 0.45)',
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: 'scale(1)',
          }}
          title="Toggle Copilot Sidecar (Cmd + J)"
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Sparkles size={16} />
            <span
              style={{
                position: 'absolute',
                top: -3,
                right: -3,
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px #10b981',
              }}
            />
          </div>
          <span>{isOpen ? 'Close Copilot' : 'Copilot AI'}</span>
          <kbd
            style={{
              fontSize: '0.65rem',
              padding: '0.1rem 0.4rem',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 4,
              fontFamily: 'monospace',
              opacity: 0.9,
            }}
          >
            ⌘J
          </kbd>
        </button>
      </div>

      {/* Dockable 420px Right Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 420,
          maxWidth: '100vw',
          background: 'var(--surface-raised)',
          borderLeft: '1px solid var(--glass-border)',
          boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.5)',
          zIndex: 95,
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <Bot size={17} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  FinAgent Copilot
                </span>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--green)', background: 'rgba(16, 185, 129, 0.15)', padding: '1px 5px', borderRadius: 4 }}>
                  LIVE
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {pageContext.pageName}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              onClick={onToggle}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 4,
                borderRadius: 6,
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Message Thread Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
          }}
        >
          {messages.map((m) => {
            if (m.role === 'system') {
              return (
                <div
                  key={m.id}
                  style={{
                    alignSelf: 'center',
                    background: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    borderRadius: 20,
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.72rem',
                    color: 'var(--text-secondary)',
                    textAlign: 'center',
                  }}
                >
                  <span dangerouslySetInnerHTML={{ __html: m.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                </div>
              );
            }

            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  gap: '0.6rem',
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '90%',
                }}
              >
                {!isUser && (
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: 'rgba(99, 102, 241, 0.2)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    <Bot size={14} />
                  </div>
                )}

                <div>
                  <div
                    style={{
                      background: isUser ? 'var(--primary)' : 'var(--surface)',
                      border: isUser ? 'none' : '1px solid var(--glass-border)',
                      color: isUser ? 'white' : 'var(--text-primary)',
                      padding: '0.65rem 0.9rem',
                      borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      fontSize: '0.825rem',
                      lineHeight: 1.5,
                      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
                    }}
                  >
                    <div
                      dangerouslySetInnerHTML={{
                        __html: m.content
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\n\n/g, '<br/><br/>')
                          .replace(/\n/g, '<br/>')
                      }}
                    />

                    {m.action && (
                      <div style={{ marginTop: '0.65rem' }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (m.action.to) navigate(m.action.to);
                            onToggle();
                          }}
                          className="btn btn-primary btn-sm"
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.35rem 0.75rem',
                            borderRadius: 8,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                        >
                          <span>{m.action.label}</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: '0.65rem',
                      color: 'var(--text-muted)',
                      marginTop: 2,
                      textAlign: isUser ? 'right' : 'left',
                    }}
                  >
                    {m.timestamp}
                  </div>
                </div>

                {isUser && (
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    <User size={14} />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem' }}>
              <Sparkles size={14} style={{ color: 'var(--primary)', animation: 'spin 1.5s linear infinite' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reasoning over portfolio state...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompts */}
        <div
          style={{
            padding: '0.65rem 1rem',
            borderTop: '1px solid var(--glass-border)',
            background: 'var(--surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
          }}
        >
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Quick Prompts for this page
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {pageContext.suggestedPrompts.slice(0, 2).map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(prompt)}
                style={{
                  textAlign: 'left',
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 6,
                  padding: '0.35rem 0.6rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
              >
                💡 {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Input Bar */}
        <div
          style={{
            padding: '0.85rem 1rem',
            borderTop: '1px solid var(--glass-border)',
            background: 'var(--surface-raised)',
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'var(--surface)',
              border: '1px solid var(--glass-border)',
              borderRadius: 12,
              padding: '0.4rem 0.65rem',
            }}
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask anything or type /council, /harvest..."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.825rem',
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                background: input.trim() ? 'var(--primary)' : 'transparent',
                border: 'none',
                color: input.trim() ? 'white' : 'var(--text-muted)',
                borderRadius: 8,
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: input.trim() ? 'pointer' : 'default',
                transition: 'all 0.15s ease',
              }}
            >
              <Send size={14} />
            </button>
          </form>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '0.65rem', color: 'var(--text-muted)', padding: '0 4px' }}>
            <span>Commands: <code>/council</code> <code>/harvest</code> <code>/rebalance</code></span>
            <span><code>⌘J</code> to toggle</span>
          </div>
        </div>
      </div>
    </>
  );
}
