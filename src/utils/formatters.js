// Utility formatters for financial data (Supports 🇺🇸 US Market & 🇮🇳 India Market)

export function getActiveMarket() {
  try {
    return localStorage.getItem('finagent_market') || 'US';
  } catch {
    return 'US';
  }
}

export function formatCurrency(value, compact = false, explicitMarket = null) {
  if (value === null || value === undefined) return '—';
  const market = explicitMarket || getActiveMarket();

  if (market === 'US') {
    if (compact) {
      const abs = Math.abs(value);
      if (abs >= 1000000000) return `$${(value / 1000000000).toFixed(2)}B`;
      if (abs >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
      if (abs >= 1000) return `$${(value / 1000).toFixed(1)}k`;
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    }
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }

  // India market
  if (compact) {
    if (Math.abs(value) >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (Math.abs(value) >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
    if (Math.abs(value) >= 1000) return `₹${(value / 1000).toFixed(1)}k`;
    return `₹${value.toLocaleString('en-IN')}`;
  }
  return `₹${value.toLocaleString('en-IN')}`;
}

export function formatLakh(value, explicitMarket = null) {
  const market = explicitMarket || getActiveMarket();
  if (market === 'US') {
    return formatCurrency(value, true, 'US');
  }
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  return `₹${value.toLocaleString('en-IN')}`;
}

export function formatShortCurrency(value, explicitMarket = null) {
  return formatCurrency(value, true, explicitMarket);
}

export function formatPct(value, showPlus = true) {
  if (value === null || value === undefined) return '—';
  const sign = value > 0 && showPlus ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatDate(dateString, explicitMarket = null) {
  const date = new Date(dateString);
  const market = explicitMarket || getActiveMarket();
  if (market === 'US') {
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  }
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function getDeltaClass(value) {
  if (value > 0) return 'positive';
  if (value < 0) return 'negative';
  return 'neutral';
}

export function getStatusColor(status) {
  const map = {
    'on-track': '#10B981',
    'behind': '#F59E0B',
    'at-risk': '#EF4444',
    'good': '#10B981',
    'fair': '#F59E0B',
    'poor': '#EF4444',
    'approved': '#10B981',
    'pending': '#F59E0B',
    'rejected': '#EF4444',
    'edited': '#6366F1',
    'high': '#EF4444',
    'medium': '#F59E0B',
    'low': '#10B981',
  };
  return map[status] || '#94A3B8';
}

export function daysToText(days) {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 30) return `${days} days`;
  if (days < 365) return `${Math.floor(days / 30)} months`;
  return `${(days / 365).toFixed(1)} years`;
}

export function truncate(str, length = 60) {
  if (!str) return '';
  return str.length > length ? str.slice(0, length) + '…' : str;
}
