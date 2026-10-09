/**
 * FinAgent Autonomous Sentinels Engine
 * Evaluates portfolio state in real-time to detect tax loss harvesting opportunities,
 * idle cash drag yield leakages, and asset allocation drift.
 */

// Recommended non-identical proxy pairs compliant with IRS §1091 / Indian tax rules
const PROXY_PAIRS_US = {
  VOO: { proxy: 'IVV', name: 'iShares Core S&P 500 ETF', reason: 'Substantially identical test safe proxy' },
  SPY: { proxy: 'SPLG', name: 'SPDR Portfolio S&P 500 ETF', reason: 'Matches index exposure with lower expense drag' },
  QQQ: { proxy: 'VGT', name: 'Vanguard Information Tech ETF', reason: 'Tech sector proxy avoiding wash sale' },
  NVDA: { proxy: 'SOXX', name: 'iShares Semiconductor ETF', reason: 'Semiconductor basket maintains AI exposure' },
  AAPL: { proxy: 'XLK', name: 'Technology Select Sector SPDR', reason: 'Broad tech proxy with 22% AAPL weighting' },
  MSFT: { proxy: 'FTEC', name: 'Fidelity MSCI Information Tech ETF', reason: 'Captures enterprise software growth' },
  GOOGL: { proxy: 'XLC', name: 'Communication Services SPDR', reason: 'Diversified communications proxy' },
  AMZN: { proxy: 'XLY', name: 'Consumer Discretionary SPDR', reason: 'Retail & cloud infrastructure proxy' },
  TSLA: { proxy: 'CARZ', name: 'First Trust NASDAQ EV ETF', reason: 'Electric vehicle industry proxy' },
};

const PROXY_PAIRS_IN = {
  RELIANCE: { proxy: 'NIFTYBEES', name: 'Nippon India Nifty 50 ETF', reason: 'Captures index recovery with lower single-stock risk' },
  TCS: { proxy: 'ITBEES', name: 'Nippon India Nifty IT ETF', reason: 'Maintains IT sector exposure across Tier-1 tech' },
  INFY: { proxy: 'ITBEES', name: 'Nippon India Nifty IT ETF', reason: 'Sector ETF hedges single-stock margin volatility' },
  HDFCBANK: { proxy: 'BANKBEES', name: 'Nippon India Nifty Bank ETF', reason: 'Private banking basket proxy' },
  ICICIBANK: { proxy: 'BANKBEES', name: 'Nippon India Nifty Bank ETF', reason: 'Banking basket maintains financial sector momentum' },
  TATAMOTORS: { proxy: 'AUTOBEES', name: 'Nippon India Nifty Auto ETF', reason: 'Automotive recovery proxy' },
  ZOMATO: { proxy: 'NIFTYMIDCAP150', name: 'Mirae Asset Nifty Midcap 150 ETF', reason: 'Broad midcap growth proxy' },
};

/**
 * 1. Wash-Sale & Capital Loss Harvest Sentinel
 */
export function evaluateWashSaleSentinel(holdings = {}, market = 'US') {
  const isUS = market === 'US';
  const symbol = isUS ? '$' : '₹';
  const minLossThreshold = isUS ? 800 : 20000;
  const equities = holdings.equities || [];

  const candidates = [];

  for (const eq of equities) {
    const pnl = eq.pnl || 0;
    // Check if position is in unrealized loss exceeding threshold
    if (pnl < -minLossThreshold) {
      const ticker = (eq.symbol || '').toUpperCase();
      const proxyMap = isUS ? PROXY_PAIRS_US : PROXY_PAIRS_IN;
      const proxyInfo = proxyMap[ticker] || {
        proxy: isUS ? 'VOO' : 'NIFTYBEES',
        name: isUS ? 'Vanguard S&P 500 ETF' : 'Nippon Nifty 50 ETF',
        reason: 'Broad market proxy preserving market participation'
      };

      const lossAmount = Math.abs(pnl);
      const estTaxSaved = isUS
        ? Math.round(lossAmount * 0.35) // US ordinary / short-term rate estimate
        : Math.round(lossAmount * 0.20); // Indian STCG rate 20%

      candidates.push({
        id: `harvest_${ticker}`,
        type: 'wash_sale_harvest',
        title: `Harvest ${symbol}${lossAmount.toLocaleString()} Tax Loss on ${ticker}`,
        severity: 'high',
        symbol: ticker,
        companyName: eq.name || ticker,
        lossAmount,
        estTaxSaved,
        currentValue: eq.value || 0,
        qty: eq.qty || 0,
        currentPrice: eq.ltp || 0,
        proxySymbol: proxyInfo.proxy,
        proxyName: proxyInfo.name,
        proxyReason: proxyInfo.reason,
        description: `Sell ${eq.qty} shares of ${ticker} to harvest ${symbol}${lossAmount.toLocaleString()} capital loss. Simultaneously buy ${proxyInfo.proxy} to avoid wash-sale penalties while staying invested in the rally.`,
        actionLabel: `1-Click Harvest (${symbol}${estTaxSaved.toLocaleString()} Saved)`
      });
    }
  }

  return candidates;
}

/**
 * 2. Cash Drag & High-Yield Sweep Sentinel
 */
export function evaluateCashDragSentinel(holdings = {}, user = {}, market = 'US') {
  const isUS = market === 'US';
  const symbol = isUS ? '$' : '₹';
  
  // Estimate monthly expenses: 60% of monthly income or default baseline
  const annualIncome = user.income || (isUS ? 180000 : 1500000);
  const monthlyExpense = (annualIncome * 0.6) / 12;
  const targetBuffer = monthlyExpense * 2; // 2 months in checking

  // Cash equivalents
  const cashAccounts = isUS
    ? [
        { name: 'Chase Premier Checking', balance: 34200, rate: 0.01 },
        { name: 'Fidelity Core Cash', balance: 14500, rate: 2.1 }
      ]
    : [
        { name: 'HDFC Savings Account', balance: 480000, rate: 3.0 },
        { name: 'ICICI Regular Checking', balance: 190000, rate: 3.5 }
      ];

  const totalIdleCash = cashAccounts.reduce((s, a) => s + a.balance, 0);
  const excessCash = Math.max(0, totalIdleCash - targetBuffer);

  const opportunities = [];

  if (excessCash > (isUS ? 5000 : 100000)) {
    const highYieldRate = isUS ? 5.15 : 7.25; // US Treasury/HYSA vs Indian Liquid Fund
    const currentBlendedRate = isUS ? 0.65 : 3.15;
    const rateDiff = (highYieldRate - currentBlendedRate) / 100;
    const annualLostYield = Math.round(excessCash * rateDiff);

    opportunities.push({
      id: 'cash_drag_sweep',
      type: 'cash_drag_sweep',
      title: `Idle Cash Drag: ${symbol}${excessCash.toLocaleString()} Earning Sub-Par Yield`,
      severity: 'medium',
      excessCash,
      targetBuffer,
      annualLostYield,
      recommendedDestination: isUS ? 'Marcus High-Yield Savings (4.75%) or US T-Bills (5.2%)' : 'HDFC Overnight / Liquid Fund (7.15%)',
      description: `You have ${symbol}${totalIdleCash.toLocaleString()} in checking accounts (${symbol}${excessCash.toLocaleString()} above your 2-month reserve). Sweeping into high-yield overnight liquidity earns an extra ${symbol}${annualLostYield.toLocaleString()}/year with zero lock-in.`,
      actionLabel: `Sweep ${symbol}${excessCash.toLocaleString()} to High Yield`
    });
  }

  return opportunities;
}

/**
 * 3. Asset Allocation Rebalancing Drift Sentinel
 */
export function evaluateRebalancingSentinel(holdings = {}, user = {}, market = 'US') {
  const isUS = market === 'US';
  const symbol = isUS ? '$' : '₹';
  const riskProfile = user.riskProfile || 'Moderate';

  // Target equity allocation by risk profile
  const targetEquityMap = { Conservative: 35, Moderate: 60, Aggressive: 80 };
  const targetEquityPct = targetEquityMap[riskProfile] || 60;

  // Compute total portfolio value
  const equityValue = (holdings.equities || []).reduce((s, e) => s + (e.value || 0), 0) +
                      (holdings.mutualFunds || []).reduce((s, m) => s + (m.value || 0), 0);
  const debtValue = (holdings.fixedDeposits || []).reduce((s, d) => s + (d.amount || d.principal || 0), 0) +
                    (holdings.epf?.total || 0);
  const totalVal = equityValue + debtValue;

  if (totalVal <= 0) return [];

  const currentEquityPct = Math.round((equityValue / totalVal) * 100);
  const drift = currentEquityPct - targetEquityPct;

  if (Math.abs(drift) >= 6) {
    const direction = drift > 0 ? 'Overweight Equity' : 'Underweight Equity';
    const dollarDrift = Math.round(totalVal * (Math.abs(drift) / 100));

    return [{
      id: 'allocation_drift',
      type: 'rebalance_drift',
      title: `Portfolio Drift Alert: ${direction} by ${Math.abs(drift)}%`,
      severity: Math.abs(drift) >= 10 ? 'high' : 'medium',
      currentEquityPct,
      targetEquityPct,
      drift,
      dollarDrift,
      description: `Your equity exposure has drifted to ${currentEquityPct}% vs your ${riskProfile} target of ${targetEquityPct}%. Rebalancing ${symbol}${dollarDrift.toLocaleString()} restores target risk symmetry.`,
      actionLabel: 'Review Rebalancing Plan'
    }];
  }

  return [];
}

/**
 * Aggregate All Sentinels
 */
export function runAllSentinels(consumerState = {}, market = 'US') {
  const holdings = consumerState.holdings || {};
  const user = consumerState.user || {};

  const washSaleAlerts = evaluateWashSaleSentinel(holdings, market);
  const cashDragAlerts = evaluateCashDragSentinel(holdings, user, market);
  const rebalanceAlerts = evaluateRebalancingSentinel(holdings, user, market);

  return [...washSaleAlerts, ...cashDragAlerts, ...rebalanceAlerts];
}
