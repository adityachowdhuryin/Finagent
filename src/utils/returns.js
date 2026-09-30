// Absolute return %
export function absoluteReturn(invested, current) {
  if (!invested) return 0;
  return ((current - invested) / invested) * 100;
}

// CAGR given start, end values and years
export function cagr(invested, current, years) {
  if (!invested || years <= 0) return 0;
  return (Math.pow(current / invested, 1 / years) - 1) * 100;
}

// Simple XIRR using Newton-Raphson method
// cashflows: array of { amount, date } where first is negative (investment)
export function xirr(cashflows, maxIterations = 100, tolerance = 1e-6) {
  if (!cashflows || cashflows.length === 0) return null;
  
  // Sort cashflows by date
  const sortedFlows = [...cashflows].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const t0 = new Date(sortedFlows[0].date).getTime();
  
  const flows = sortedFlows.map(cf => ({
    amount: cf.amount,
    years: (new Date(cf.date).getTime() - t0) / (1000 * 60 * 60 * 24 * 365.25)
  }));
  
  let rate = 0.1; // Initial guess
  
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dNpv = 0;
    
    for (const f of flows) {
      const denom = Math.pow(1 + rate, f.years);
      npv += f.amount / denom;
      if (rate > -1) {
        dNpv -= (f.years * f.amount) / (denom * (1 + rate));
      } else {
        dNpv -= (f.years * f.amount) / Math.pow(1 + rate, f.years + 1);
      }
    }
    
    if (Math.abs(npv) < tolerance) {
      return rate; // Return as decimal
    }
    
    if (dNpv === 0) {
      return null;
    }
    
    const nextRate = rate - npv / dNpv;
    
    if (Math.abs(nextRate - rate) < tolerance) {
      return nextRate;
    }
    
    rate = nextRate;
    
    // Stop if rate goes out of bounds
    if (rate <= -1) {
       rate = -0.99999;
    }
  }
  
  return null;
}

// Format a return value for display (adds +/- prefix, toFixed(2))
export function formatReturn(val) {
  if (val === null || val === undefined || isNaN(val)) return '-';
  const sign = val > 0 ? '+' : '';
  return `${sign}${val.toFixed(2)}%`;
}

// Get color for a return value (green for positive, red for negative)
export function returnColor(val) { 
  return val >= 0 ? 'var(--green)' : 'var(--red)'; 
}
