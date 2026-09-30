import { getAnalytics, logEvent, isSupported } from 'firebase/analytics';
import { app as firebaseApp } from '../config/firebase'; // import the firebase app
import mixpanel from 'mixpanel-browser';

let firebaseAnalytics = null;
let mixpanelReady = false;

export async function initAnalytics() {
  // Firebase Analytics
  try {
    if (await isSupported()) {
      firebaseAnalytics = getAnalytics(firebaseApp);
    }
  } catch {}
  
  // Mixpanel
  const token = import.meta.env.VITE_MIXPANEL_TOKEN;
  if (token) {
    try {
      mixpanel.init(token, {
        debug: import.meta.env.DEV,
        track_pageview: false,
        autocapture: true,
        record_sessions_percent: 100,
      });
      mixpanelReady = true;
    } catch (e) {
      console.warn('Mixpanel init error:', e);
    }
  }
  
  // Expose a global for ErrorBoundary to use without importing
  window._fintrack = track;
}

export function identify(userId, traits = {}) {
  try { if (mixpanelReady) mixpanel.identify(userId); } catch {}
  try { if (mixpanelReady && Object.keys(traits).length) mixpanel.people.set(traits); } catch {}
}

export function track(eventName, properties = {}) {
  // Firebase
  try {
    if (firebaseAnalytics) {
      logEvent(firebaseAnalytics, eventName, properties);
    }
  } catch {}
  
  // Mixpanel
  try {
    if (mixpanelReady) {
      mixpanel.track(eventName, properties);
    }
  } catch {}
  
  // Console in dev
  if (import.meta.env.DEV) {
    console.log('[Analytics]', eventName, properties);
  }
}
