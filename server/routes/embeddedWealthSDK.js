// server/routes/embeddedWealthSDK.js
// Commercial Bank & White-Label Embedded Wealth SDK (/bank-embed)
// Embedded Robo-Advisory, Deposit-to-Wealth Sweeps, and Bank Partner Revenue Share (15-25 bps)

const crypto = require('crypto');
const { saveEmbeddedWealthState, getEmbeddedWealthState, logAuditEvent } = require('../db/database');

let partnerConfig = {
  partnerId: 'bank_partner_882',
  institutionName: 'First Pacific Bank & Trust',
  institutionType: 'Commercial Bank & Trust',
  market: 'US',
  brand: {
    primaryColor: '#0284C7',
    secondaryColor: '#0EA5E9',
    accentColor: '#10B981',
    themeMode: 'dark',
    logoText: 'FirstPacific Wealth AI',
    customDomain: 'wealth.firstpacificbank.com',
  },
  commercialTerms: {
    advisoryWrapBps: 25, // 25 bps annual management fee
    bankRevenueSharePct: 70, // 70% to bank, 30% to FinAgent infrastructure
    monthlyPlatformLicenseFee: 4500.00,
    contractStatus: 'ENTERPRISE_ACTIVE',
  },
  metrics: {
    totalRetailCheckingAccounts: 65000,
    sweptWealthAccountsActive: 11840,
    conversionRate: '18.2%',
    embeddedAUM: 88750000.00, // $88.75M in swept assets
    bankAnnualFeeRevenueProjected: 155312.50, // 25 bps * 70% on $88.75M
    depositRetentionScore: 94,
  },
  enabledFeatures: {
    directIndexing: true,
    automatedSweepRobo: true,
    taxLossHarvesting: true,
    fireSimulator: true,
    voiceBanker: true,
  }
};

function getPartnerConfig(req, res) {
  const isIN = req.query.market === 'IN';
  const partnerId = req.query.partnerId || partnerConfig.partnerId;
  const saved = getEmbeddedWealthState(partnerId);
  if (saved) {
    partnerConfig = { ...partnerConfig, ...saved };
  }

  res.json({
    success: true,
    data: {
      ...partnerConfig,
      market: isIN ? 'IN' : 'US',
      currency: isIN ? 'INR' : 'USD',
      currencySymbol: isIN ? '₹' : '$',
      statutoryFramework: isIN
        ? 'RBI Digital Lending & SEBI (Investment Advisers) Regulations'
        : 'OCC Fiduciary Standards, FDIC Part 330 & FINRA Rule 2210',
    }
  });
}

function savePartnerConfig(req, res) {
  const { institutionName, brand, commercialTerms, enabledFeatures, partnerId = partnerConfig.partnerId } = req.body;
  if (institutionName) partnerConfig.institutionName = institutionName;
  if (brand) partnerConfig.brand = { ...partnerConfig.brand, ...brand };
  if (commercialTerms) partnerConfig.commercialTerms = { ...partnerConfig.commercialTerms, ...commercialTerms };
  if (enabledFeatures) partnerConfig.enabledFeatures = { ...partnerConfig.enabledFeatures, ...enabledFeatures };

  saveEmbeddedWealthState(partnerId, partnerConfig);
  logAuditEvent({ eventType: 'EMBEDDED_WEALTH_CONFIG_SAVED', actor: 'Bank Admin', market: 'US', details: { partnerId, institutionName: partnerConfig.institutionName } });

  res.json({
    success: true,
    message: 'Partner white-label configuration saved',
    config: partnerConfig
  });
}

function simulateDepositSweep(req, res) {
  const { totalAccounts = 50000, avgCheckingBalance = 8000, adoptionRatePct = 15, wrapFeeBps = 25 } = req.body;
  const accounts = Number(totalAccounts);
  const avgBal = Number(avgCheckingBalance);
  const adoption = Number(adoptionRatePct) / 100;
  const bps = Number(wrapFeeBps) / 10000;

  const mobilizedAccounts = Math.round(accounts * adoption);
  const totalMobilizedAUM = mobilizedAccounts * avgBal;
  const grossAnnualFee = totalMobilizedAUM * bps;
  const bankNetRevenue = grossAnnualFee * 0.70; // 70% bank share
  const finagentNetRevenue = grossAnnualFee * 0.30;

  res.json({
    success: true,
    simulationInput: { accounts, avgCheckingBalance: avgBal, adoptionRate: `${adoptionRatePct}%`, wrapFeeBps },
    projectedMobilizedAccounts: mobilizedAccounts,
    projectedAUM: Math.round(totalMobilizedAUM),
    grossAnnualFeeGenerated: Math.round(grossAnnualFee),
    bankNetAnnualRevenue: Math.round(bankNetRevenue),
    finagentPlatformTake: Math.round(finagentNetRevenue),
    depositChurnReductionPct: '34%',
    roiMultiplier: `${((bankNetRevenue / (4500 * 12)).toFixed(1))}x on software license cost`
  });
}

function getDeveloperDocs(req, res) {
  res.json({
    success: true,
    sdkVersion: '2.4.0-enterprise',
    endpoints: [
      { method: 'POST', path: '/api/v1/embed/sso-token', description: 'Exchange core banking session token for secure single sign-on user token' },
      { method: 'GET', path: '/api/v1/embed/portfolio', description: 'Retrieve customer real-time swept wealth holdings and automated allocations' },
      { method: 'POST', path: '/api/v1/embed/sweep-instruction', description: 'Trigger automatic recurring sweep from checking account to wealth portfolio' },
      { method: 'GET', path: '/api/v1/embed/tax-summary', description: 'Retrieve annual tax-loss harvest savings and 1099-B/DIV summaries' }
    ],
    embedSnippet: `<div id="finagent-embedded-root"></div>
<script src="https://cdn.finagent.app/sdk/v2/embed.js"
  data-partner-id="${partnerConfig.partnerId}"
  data-theme="${partnerConfig.brand.themeMode}"
  data-primary-color="${partnerConfig.brand.primaryColor}">
</script>`
  });
}

module.exports = {
  getPartnerConfig,
  savePartnerConfig,
  simulateDepositSweep,
  getDeveloperDocs
};
