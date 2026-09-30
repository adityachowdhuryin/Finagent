// Cross-Border US-India Tax Shield (FBAR FinCEN 114, FATCA 8938, PFIC Form 8621)

// Treasury Reporting Rates (Proxy: 84.00 INR per USD)
const TREASURY_EXCHANGE_RATE_INR_USD = 84.00;

// POST /api/cross-border/audit
async function auditCrossBorder(req, res) {
  try {
    const {
      usTaxResident = true, // Citizen, Green Card, H-1B meeting Substantial Presence Test
      filingStatus = 'single',
      foreignAccounts = [
        { name: 'HDFC NRE Savings & FDs', type: 'Bank Account / FD', maxBalanceINR: 1250000, institution: 'HDFC Bank Ltd' },
        { name: 'Zerodha Demat (Direct Equities)', type: 'Brokerage Demat', maxBalanceINR: 950000, institution: 'Zerodha Broking Ltd' },
        { name: 'HDFC Top 100 Mutual Fund', type: 'Indian Mutual Fund (PFIC)', maxBalanceINR: 650000, institution: 'HDFC AMC' },
      ],
    } = req.body;

    let aggregateMaxUSD = 0;
    const evaluatedAccounts = foreignAccounts.map(acc => {
      const balanceUSD = Math.round((acc.maxBalanceINR || 0) / TREASURY_EXCHANGE_RATE_INR_USD);
      aggregateMaxUSD += balanceUSD;
      const isPFIC = (acc.type || '').toLowerCase().includes('mutual fund') || (acc.name || '').toLowerCase().includes('mutual fund');

      return {
        ...acc,
        balanceUSD,
        isPFIC,
      };
    });

    // 1. FBAR FinCEN 114 Threshold ($10,000 aggregate)
    const fbarRequired = aggregateMaxUSD > 10000;
    const fbarPenaltyNotice = 'Non-willful failure to file FBAR carries statutory civil penalties up to $15,611 per violation (indexed for inflation). Willful violations carry penalties up to $100,000 or 50% of account balance.';

    // 2. FATCA Form 8938 Threshold ($50,000 Single / $100,000 MFJ)
    const fatcaThreshold = filingStatus === 'mfj' ? 100000 : 50000;
    const fatcaRequired = aggregateMaxUSD > fatcaThreshold;

    // 3. PFIC Alert (Passive Foreign Investment Company)
    const pficAccounts = evaluatedAccounts.filter(a => a.isPFIC);
    const hasPFIC = pficAccounts.length > 0;
    const totalPFICBalanceUSD = pficAccounts.reduce((s, a) => s + a.balanceUSD, 0);

    res.json({
      success: true,
      usTaxResident,
      exchangeRateUsed: TREASURY_EXCHANGE_RATE_INR_USD,
      aggregateForeignMaxBalanceUSD: aggregateMaxUSD,
      fbarAudit: {
        fbarRequired,
        thresholdUSD: 10000,
        deadline: 'April 15 (Automatic extension to October 15)',
        portal: 'BSA E-Filing System (FinCEN Report 114)',
        status: fbarRequired ? 'MANDATORY_FILING_REQUIRED' : 'BELOW_THRESHOLD',
        penaltyNotice: fbarPenaltyNotice,
      },
      fatcaAudit: {
        fatcaRequired,
        thresholdUSD: fatcaThreshold,
        form: 'IRS Form 8938 (Attached to Form 1040)',
        status: fatcaRequired ? 'MANDATORY_FILING_REQUIRED' : 'BELOW_THRESHOLD',
      },
      pficAudit: {
        hasPFIC,
        totalPFICBalanceUSD,
        pficAccountsCount: pficAccounts.length,
        punitiveTaxWarning: hasPFIC
          ? 'CRITICAL TAX ALERT: Indian Mutual Funds are classified as PFICs under IRC Section 1291. Gains are taxed at the top 37% federal rate PLUS compound interest penalty charges going back to purchase date! Form 8621 is required for each fund.'
          : 'No Indian mutual funds detected in current callout.',
        recommendedAction: hasPFIC
          ? 'Redeem Indian mutual funds and allocate directly to US-domiciled India ETFs (e.g., INDA - iShares MSCI India ETF, or EPI - WisdomTree India Earnings), which have standard 15%-20% LTCG rates and no Form 8621 headaches.'
          : 'Maintain direct stocks or US ETFs for India exposure.',
      },
      accounts: evaluatedAccounts,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { auditCrossBorder };
