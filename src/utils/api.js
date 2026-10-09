// src/utils/api.js
// Safe centralized API fetcher with automatic base URL prefixing

export const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

// Install automatic base URL resolver for window.fetch in environments with custom API base (e.g. mobile Capacitor or production)
if (typeof window !== 'undefined' && API_BASE && !window._finagent_fetch_patched) {
  window._finagent_fetch_patched = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = function (resource, init) {
    if (typeof resource === 'string' && resource.startsWith('/api/')) {
      return originalFetch(`${API_BASE}${resource}`, init);
    }
    return originalFetch(resource, init);
  };
}

/**
 * Fetch wrapper that automatically prepends API_BASE if the path starts with /api
 * and returns standard Response promise.
 */
export async function apiFetch(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = cleanEndpoint.startsWith('http')
    ? cleanEndpoint
    : `${API_BASE}${cleanEndpoint}`;

  return fetch(fullUrl, options);
}

export default apiFetch;
