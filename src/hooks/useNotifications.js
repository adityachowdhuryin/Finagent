import { useState, useCallback } from 'react';
import { analyze } from '../services/geminiService';

const ALERT_TYPES = {
  tax_deadline: { icon: '📅', color: 'var(--red)', label: 'Tax Deadline' },
  market_opportunity: { icon: '📈', color: 'var(--green)', label: 'Opportunity' },
  goal_risk: { icon: '🎯', color: 'var(--gold)', label: 'Goal Risk' },
  fd_maturity: { icon: '🏦', color: 'var(--primary)', label: 'FD Maturity' },
  rebalance: { icon: '⚖️', color: 'var(--purple)', label: 'Rebalance' },
  insurance_gap: { icon: '🛡️', color: 'var(--red)', label: 'Insurance' },
};

// Fallback alerts shown when backend is unavailable
const FALLBACK_ALERTS = [
  {
    id: 'f1', type: 'tax_deadline', urgency: 'high', read: false,
    title: '₹14,720 tax loss harvesting opportunity',
    description: 'Your Axis Bluechip MF has ₹22,400 in unrealized short-term losses. Booking these before March 31 will offset your ₹14,720 STCG tax liability.',
    action: 'Review in Tax Harvester',
    route: '/app/tax',
  },
  {
    id: 'f2', type: 'fd_maturity', urgency: 'medium', read: false,
    title: 'HDFC FD matures in 7 days',
    description: 'Your ₹2,50,000 HDFC Bank FD (7.1% p.a.) matures on Sep 17. Current best rate is 7.9% at SBI. Consider switching.',
    action: 'View FD details',
    route: '/app/portfolio',
  },
  {
    id: 'f3', type: 'goal_risk', urgency: 'medium', read: false,
    title: 'Daughter\'s education goal is 12% behind',
    description: 'Your Education corpus is ₹18,240 behind the required glide path. Increasing SIP by ₹1,500/month will close the gap by 2028.',
    action: 'Adjust in Goals',
    route: '/app/goals',
  },
  {
    id: 'f4', type: 'rebalance', urgency: 'low', read: false,
    title: 'Equity allocation drifted to 68%',
    description: 'Your target was 60% equity. The recent Nifty rally pushed it to 68%. Consider moving ₹82,000 to debt funds to rebalance.',
    action: 'Ask AI Advisor',
    route: '/app/ai-advisor',
  },
];

export function useNotifications(portfolioData) {
  const [notifications, setNotifications] = useState(FALLBACK_ALERTS);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const generateAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const prompt = `You are a proactive Indian wealth advisor AI. Analyze this user's portfolio and generate 4-5 urgent, actionable alerts.

Portfolio data:
${JSON.stringify(portfolioData, null, 2)}

Current date: ${new Date().toLocaleDateString('en-IN')}
Indian Financial Year ends: March 31

Return a JSON array of alerts. Each alert must have:
{
  "id": "unique string",
  "type": "tax_deadline|market_opportunity|goal_risk|fd_maturity|rebalance|insurance_gap",
  "urgency": "high|medium|low",
  "read": false,
  "title": "Short, specific title with numbers (max 60 chars)",
  "description": "2-3 sentences with specific ₹ amounts and actionable advice",
  "action": "Button label text",
  "route": "/app/tax or /app/portfolio or /app/goals or /app/ai-advisor"
}

Make alerts SPECIFIC with real numbers from the portfolio. Focus on Indian tax deadlines, FD maturities, goal drift, and rebalancing needs.
Return ONLY the JSON array. No markdown.`;

      const data = await analyze(prompt, 'json');
      if (Array.isArray(data) && data.length > 0) {
        setNotifications(data.map((n, i) => ({ ...n, id: n.id || `alert-${Date.now()}-${i}`, read: false })));
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.warn('[Notifications] Gemini unavailable, keeping fallback alerts:', err.message);
    } finally {
      setLoading(false);
    }
  }, [portfolioData]);

  const markRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  return { notifications, unreadCount, loading, lastUpdated, generateAlerts, markRead, markAllRead, ALERT_TYPES };
}
