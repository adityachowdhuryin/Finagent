// Indian Tax-Loss Harvesting Engine — FY 2025-26 rules
// STCG: equity/MF held < 12 months, taxed at 20% (post-July 2024 budget)
// LTCG: equity/MF held >= 12 months, taxed at 12.5% above ₹1.25L exemption

export const TAX_RATES = {
  STCG_EQUITY: 0.20, // 20% flat
  LTCG_EQUITY: 0.125, // 12.5%
  LTCG_EXEMPTION: 125000, // ₹1.25 Lakh per FY
  STCG_DEBT: 0.30, // At slab rate (approximated at 30%)
  LTCG_DEBT: 0.20, // 20% with indexation
};

export function classifyHolding(holdingDays, assetClass = 'equity') {
  if (assetClass === 'equity' || assetClass === 'mf_equity') {
    return holdingDays >= 365 ? 'LTCG' : 'STCG';
  }
  if (assetClass === 'mf_debt') {
    return holdingDays >= 1095 ? 'LTCG' : 'STCG'; // 3 years for debt MF
  }
  return holdingDays >= 365 ? 'LTCG' : 'STCG';
}

export function calculateTaxOnGain(gain, gainType) {
  if (gainType === 'LTCG') {
    const taxableGain = Math.max(0, gain - TAX_RATES.LTCG_EXEMPTION);
    return taxableGain * TAX_RATES.LTCG_EQUITY;
  }
  return gain * TAX_RATES.STCG_EQUITY;
}

export function calculateHarvestingSavings(realizedGains, harvestableLosses) {
  const stcgGains = realizedGains.filter(g => g.type === 'STCG').reduce((s, g) => s + g.gain, 0);
  const ltcgGains = realizedGains.filter(g => g.type === 'LTCG').reduce((s, g) => s + g.gain, 0);
  const stcgLosses = harvestableLosses.filter(l => l.type === 'STCG').reduce((s, l) => s + Math.abs(l.loss), 0);
  const ltcgLosses = harvestableLosses.filter(l => l.type === 'LTCG').reduce((s, l) => s + Math.abs(l.loss), 0);

  // STCG losses offset STCG gains first, then LTCG gains
  const netStcgGain = Math.max(0, stcgGains - stcgLosses);
  const remainingStcgLoss = Math.max(0, stcgLosses - stcgGains);
  const netLtcgGain = Math.max(0, ltcgGains - ltcgLosses - remainingStcgLoss);

  const taxWithoutHarvest = calculateTaxOnGain(stcgGains, 'STCG') + calculateTaxOnGain(ltcgGains, 'LTCG');
  const taxWithHarvest = calculateTaxOnGain(netStcgGain, 'STCG') + calculateTaxOnGain(netLtcgGain, 'LTCG');

  return {
    stcgGains, ltcgGains, stcgLosses, ltcgLosses,
    netStcgGain, netLtcgGain,
    taxWithoutHarvest, taxWithHarvest,
    taxSaved: taxWithoutHarvest - taxWithHarvest,
  };
}

// Sample realized gains for FY 2025-26
export const realizedGainsFY26 = [
  { holding: 'Bajaj Finance Ltd.', gain: 22025, type: 'LTCG', date: '2026-06-15' },
  { holding: 'ICICI Bank Ltd.', gain: 14244, type: 'LTCG', date: '2026-04-20' },
  { holding: 'Axis Bank Ltd.', gain: 8400, type: 'STCG', date: '2026-07-10' },
  { holding: 'SBI Liquid Fund (partial)', gain: 12800, type: 'STCG', date: '2026-05-01' },
  { holding: 'HDFC Bank Ltd. (partial)', gain: 29951, type: 'LTCG', date: '2026-03-25' },
];

export const harvestablePositions = [
  { holding: 'Axis Bluechip Direct Growth', loss: -26960, type: 'STCG', holdingDays: 320, action: 'Sell & reinvest after 30 days', washSaleRisk: false },
  { holding: 'Zomato Ltd.', loss: -5675, type: 'STCG', holdingDays: 95, action: 'Sell & wait 30 days', washSaleRisk: true },
  { holding: 'ITC Ltd.', loss: -16560, type: 'STCG', holdingDays: 210, action: 'Sell & replace with similar', washSaleRisk: false },
  { holding: 'Infosys Ltd.', loss: -10266, type: 'STCG', holdingDays: 185, action: 'Sell & replace with TCS', washSaleRisk: false },
];
