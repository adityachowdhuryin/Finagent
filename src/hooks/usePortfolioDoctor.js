import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';

const ALERTS_KEY = 'finagent_doctor_alerts';
const LAST_EMAIL_KEY = 'finagent_doctor_last_email';
const LAST_RUN_KEY = 'finagent_doctor_last_run';

export function usePortfolioDoctor() {
  const { state } = useApp();
  const [alerts, setAlerts] = useState(() => {
    try { return JSON.parse(localStorage.getItem(ALERTS_KEY) || '[]'); } catch { return []; }
  });
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(new Set());

  const runAnalysis = useCallback(async (force = false) => {
    // Throttle: don't re-run within 1 hour unless forced
    const lastRun = localStorage.getItem(LAST_RUN_KEY);
    if (!force && lastRun && Date.now() - Number(lastRun) < 3600000) return;

    const { consumer } = state;
    if (!consumer || (consumer.netWorth?.total || 0) === 0) return;

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/doctor/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolio: consumer }),
      });
      const data = await res.json();
      const newAlerts = data.alerts || [];

      setAlerts(newAlerts);
      localStorage.setItem(ALERTS_KEY, JSON.stringify(newAlerts));
      localStorage.setItem(LAST_RUN_KEY, String(Date.now()));

      // Send email if high-severity alerts and not emailed in last 23h
      const highAlerts = newAlerts.filter(a => a.severity === 'high');
      const lastEmail = localStorage.getItem(LAST_EMAIL_KEY);
      const emailReady = !lastEmail || Date.now() - Number(lastEmail) > 82800000; // 23h

      if (highAlerts.length > 0 && emailReady && consumer.user?.email) {
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/doctor/digest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alerts: newAlerts,
            userEmail: consumer.user.email,
            userName: consumer.user.name,
          }),
        });
        localStorage.setItem(LAST_EMAIL_KEY, String(Date.now()));
      }
    } catch (e) {
      console.warn('[PortfolioDoctor] Analysis failed:', e.message);
    } finally {
      setLoading(false);
    }
  }, [state]);

  // Run on mount
  useEffect(() => {
    const timer = setTimeout(() => runAnalysis(), 2000); // 2s delay after app loads
    return () => clearTimeout(timer);
  }, [runAnalysis]);

  const visibleAlerts = alerts.filter(a => !dismissed.has(a.id));
  const hasNew = visibleAlerts.some(a => a.severity === 'high' || a.severity === 'medium');
  const highCount = visibleAlerts.filter(a => a.severity === 'high').length;

  function dismiss(id) {
    setDismissed(prev => new Set([...prev, id]));
  }

  function dismissAll() {
    setDismissed(new Set(alerts.map(a => a.id)));
  }

  return { alerts: visibleAlerts, allAlerts: alerts, loading, hasNew, highCount, runAnalysis, dismiss, dismissAll };
}
