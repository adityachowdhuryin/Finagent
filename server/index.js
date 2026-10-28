require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');

const aiRoutes = require('./routes/ai');
const newsRoutes = require('./routes/news');
const sebiRoutes = require('./routes/sebi');
const marketRoutes = require('./routes/market');
const emailRoutes = require('./routes/email');
const camsRoutes = require('./routes/cams');
const whatsappRoutes = require('./routes/whatsapp');
const { analyzeCashflow } = require('./routes/cashflow');

const { analyzePortfolio, sendDailyDigest } = require('./routes/doctor');
const { getMarketData, getSIPRecommendations } = require('./routes/sipOptimizer');
const { debateCouncil, challengeCouncil } = require('./routes/council');
const { generateLetter, dispatchEmail, preAuthorizeAgreement, settleSavings } = require('./routes/negotiators');
const { generateChart } = require('./routes/reportStudio');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS — allow local dev + Vercel production
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL, // Set to Vercel URL in production
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o)) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  }
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: false })); // Needed for Twilio WhatsApp webhook

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    gemini: !!process.env.GEMINI_API_KEY,
    newsApi: !!process.env.NEWS_API_KEY,
    razorpay: !!process.env.RAZORPAY_KEY_ID,
    resend: !!process.env.RESEND_API_KEY,
    whatsapp: !!process.env.WHATSAPP_TOKEN,
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/ai', aiRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/sebi', sebiRoutes);
app.post('/api/cams/parse-pdf', camsRoutes.parsePdf);
app.post('/api/cashflow/analyze', analyzeCashflow);

// Agentic AI Systems
app.post('/api/council/debate', debateCouncil);
app.post('/api/council/challenge', challengeCouncil);
app.post('/api/negotiator/generate-letter', generateLetter);
app.post('/api/negotiator/dispatch-email', dispatchEmail);
app.post('/api/negotiator/pre-authorize', preAuthorizeAgreement);
app.post('/api/negotiate/pre-authorize', preAuthorizeAgreement);
app.post('/api/negotiator/settle-savings', settleSavings);
app.post('/api/negotiate/settle-savings', settleSavings);
app.post('/api/negotiate/settle', settleSavings);
app.post('/api/chart-studio/generate', generateChart);


// Market routes (handlers exported individually)
app.get('/api/market/quote', marketRoutes.getQuotes);
app.get('/api/market/quotes', marketRoutes.getQuotes);
app.get('/api/market/indices', marketRoutes.getIndices);
app.get('/api/market/history', marketRoutes.getHistory);
app.get('/api/market/benchmark-history', marketRoutes.getBenchmarkHistory);
app.get('/api/market/search', marketRoutes.search);
app.get('/api/market/nav/:schemeCode', marketRoutes.getNav);

// Email routes
app.post('/api/email/welcome', emailRoutes.welcome);
app.post('/api/email/report', emailRoutes.report);
app.post('/api/email/alert', emailRoutes.alert);
app.post('/api/email/invoice', emailRoutes.invoice);
app.post('/api/email/portal-invite', emailRoutes.portalInvite);
app.post('/api/email/itr', emailRoutes.itr);
app.post('/api/email/send', emailRoutes.send); // Generic send (SIP Optimizer, alerts, Doctor)

// WhatsApp
app.get('/api/whatsapp/webhook', whatsappRoutes.verify);
app.post('/api/whatsapp/webhook', whatsappRoutes.webhook);
app.post('/api/whatsapp/send', whatsappRoutes.send);
app.post('/api/whatsapp/sync', whatsappRoutes.syncPortfolio);

// Portfolio Doctor
app.post('/api/doctor/analyze', analyzePortfolio);
app.post('/api/doctor/digest', sendDailyDigest);

// SIP Optimizer
app.get('/api/sip-optimizer/market', getMarketData);
app.post('/api/sip-optimizer/recommend', getSIPRecommendations);

// CAS Auto-Import
const multer = require('multer');
const casImport = require('./routes/casImport');
const casUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
app.post('/api/cas/upload', casUpload.single('pdf'), casImport.upload);
app.post('/api/cas/email-webhook', casImport.emailWebhook);
app.get('/api/cas/status', casImport.status);

// Monthly Report
const { scheduleReport, sendNow: sendReportNow, cronSend } = require('./routes/monthlyReport');
app.post('/api/reports/monthly/schedule', scheduleReport);
app.post('/api/reports/monthly/send-now', sendReportNow);
app.get('/api/reports/monthly/cron', cronSend);

// Tax Engine
const {
  computeLots,
  generateITRXML,
  tracker80C,
  handleScheduleFA,
  handleSurchargeMarginalRelief,
  handleParseDocument,
} = require('./routes/taxEngine');
app.post('/api/tax/compute-lots', computeLots);
app.post('/api/tax/generate-itr-xml', generateITRXML);
app.post('/api/tax/80c-tracker', tracker80C);
app.post('/api/tax/schedule-fa', handleScheduleFA);
app.post('/api/tax/surcharge-marginal-relief', handleSurchargeMarginalRelief);
app.post('/api/tax/parse-document', handleParseDocument);

// Portfolio X-Ray
const { analyze: analyzeXRay } = require('./routes/xray');
app.post('/api/xray/analyze', analyzeXRay);

// Advisor Marketplace
const { getAdvisors, verifySebi, applyAsAdvisor, createBooking, confirmBooking } = require('./routes/marketplace');
app.get('/api/marketplace/advisors', getAdvisors);
app.get('/api/marketplace/verify-sebi', verifySebi);
app.post('/api/marketplace/apply', applyAsAdvisor);
app.post('/api/marketplace/booking/create', createBooking);
app.post('/api/marketplace/booking/confirm', confirmBooking);

// Advisor Practice Management (Real Dispatches & Onboarding Persistence)
const {
  dispatchRecommendation,
  generateRecommendations,
  onboardClient,
  listAdvisorClients,
  listAdvisorDispatches,
  listAuditEvents,
  createClientIPS,
  signAndBridgeExecution,
  getSEBIInspectionLog
} = require('./routes/advisorAdmin');
app.post('/api/advisor/dispatch-recommendation', dispatchRecommendation);
app.post('/api/advisor/generate-recommendations', generateRecommendations);
app.post('/api/advisor/onboard-client', onboardClient);
app.get('/api/advisor/clients', listAdvisorClients);
app.get('/api/advisor/dispatches', listAdvisorDispatches);
app.get('/api/advisor/audit-events', listAuditEvents);
app.post('/api/advisor/create-ips', createClientIPS);
app.post('/api/advisor/sign-and-bridge', signAndBridgeExecution);
app.get('/api/advisor/sebi-inspection-dossier', getSEBIInspectionLog);

// ── 5 High-WTP Features ───────────────────────────────────────────────────────

// 1. Regular-to-Direct Commission Hunter
const { auditCommission } = require('./routes/commissionHunter');
app.post('/api/commission/audit', auditCommission);

// 2. Multi-PAN Family Office Hub
const { getProfiles: getFamilyProfiles, addOrUpdateProfile: addFamilyProfile, optimizeTax: optimizeFamilyTax, simulateGifting } = require('./routes/familyHub');
app.get('/api/family/profiles', getFamilyProfiles);
app.post('/api/family/profile', addFamilyProfile);
app.post('/api/family/optimize-tax', optimizeFamilyTax);
app.post('/api/family/simulate-gifting', simulateGifting);

// 3. Family Emergency Vault & Inactivity Protocol
const { getStatus: getVaultStatus, pingHeartbeat, updateConfig: updateVaultConfig, testTrigger: testVaultTrigger, nomineeAudit } = require('./routes/emergencyVault');
app.get('/api/vault/status', getVaultStatus);
app.post('/api/vault/ping', pingHeartbeat);
app.post('/api/vault/config', updateVaultConfig);
app.post('/api/vault/test-trigger', testVaultTrigger);
app.get('/api/vault/nominee-audit', nomineeAudit);
app.post('/api/vault/nominee-audit', nomineeAudit);

// 4. Account Aggregator (AA) 1-Click Sync
const { initiateConsent, verifyOtp, syncPortfolio, getStatus: getAAStatus } = require('./routes/accountAggregator');
app.post('/api/aa/initiate-consent', initiateConsent);
app.post('/api/aa/verify-otp', verifyOtp);
app.post('/api/aa/sync-portfolio', syncPortfolio);
app.get('/api/aa/status', getAAStatus);

// 5. Year-Round Tax-Loss Harvesting Bot
const { scanHarvestingOpportunities, sendHarvestNotification } = require('./routes/taxLossHarvesting');
app.post('/api/harvesting/scan', scanHarvestingOpportunities);
app.post('/api/harvesting/notify', sendHarvestNotification);

// ── 5 AI-Powered High-WTP Engines ─────────────────────────────────────────────

// 1. AI Insurance Policy Fine-Print Decoder
const { decodeInsurance } = require('./routes/insuranceDecoder');
app.post('/api/insurance/decode', casUpload.single('policyPdf'), decodeInsurance);

// 2. AI CTC & Salary Tax Structuring Engine
const { optimizeCTC } = require('./routes/ctcOptimizer');
app.post('/api/ctc/optimize', optimizeCTC);

// 3. AI Home Loan Rate Arbitrage & Negotiator
const { auditRate: auditLoanRate } = require('./routes/loanNegotiator');
app.post('/api/loan/audit-rate', auditLoanRate);

// 4. AI Forensic Bank Statement Auditor
const { auditStatement } = require('./routes/forensicAudit');
app.post('/api/forensic/audit', auditStatement);

// 5. AI Black Swan Crisis Stress-Tester
const { simulateCrisis } = require('./routes/stressTest');
app.post('/api/stress-test/simulate', simulateCrisis);

// ── Startup-Ready Engines (Group A & Group B) ─────────────────────────────────

// 6. Tech ESOP & US RSU Tax Engine
const esopRsuRoutes = require('./routes/esopRsu');
app.use('/api/esop-rsu', esopRsuRoutes.router);

// 7. Legal Digital Will & Succession Dossier Generator
const digitalWillRoutes = require('./routes/digitalWill');
app.use('/api/will', digitalWillRoutes.router);

// 8. Credit Card Reward Maximizer & Spend Router
const cardOptimizerRoutes = require('./routes/cardOptimizer');
app.use('/api/cards', cardOptimizerRoutes.router);

// 9. Razorpay Webhook & GST Invoicing Engine
const razorpayWebhookRoutes = require('./routes/razorpayWebhook');
app.use('/api/razorpay', razorpayWebhookRoutes.router);
app.use('/api/billing', razorpayWebhookRoutes.router);

// ── US Parallel Market Engines ────────────────────────────────────────────────

// US Tax (Form 1040, Federal & State Slabs)
const { estimateUSTax } = require('./routes/usTaxEngine');
app.post('/api/us-tax/estimate', estimateUSTax);

// US Wash-Sale & Proxy ETF Harvester (IRC § 1091)
const {
  harvestTaxLoss,
  scanHarvestingOpportunitiesUS,
  sendHarvestNotificationUS,
} = require('./routes/usWashSale');
app.post('/api/us-wash-sale/harvest', harvestTaxLoss);
app.post('/api/us-wash-sale/scan', scanHarvestingOpportunitiesUS);
app.post('/api/us-wash-sale/notify', sendHarvestNotificationUS);

// Silicon Valley Equity OS (RSU Under-Withholding, ISO/AMT Form 6251, 83b)
const { analyzeEquity } = require('./routes/usEquityCompensation');
app.post('/api/us-equity/analyze', analyzeEquity);

// 30-Year Mortgage Arbitrage, FHFA Limits, Points NPV, ARM Shock, FCRA 609 & RESPA § 10 Escrow
const {
  auditMortgage,
  computePointsNPV,
  simulateArmShock,
  generateFCRALetter,
  auditEscrow,
} = require('./routes/usMortgageRefi');
app.post('/api/us-mortgage/audit', auditMortgage);
app.post('/api/us-mortgage/points-npv', computePointsNPV);
app.post('/api/us-mortgage/arm-shock', simulateArmShock);
app.post('/api/us-mortgage/fcra-dispute', generateFCRALetter);
app.post('/api/us-mortgage/escrow-audit', auditEscrow);

// US Points & Miles Maximizer (Chase 5/24 & Amex/Chase points router)
const { getUSCardDatabase, optimizeSpend: optimizeUSCards } = require('./routes/usCardOptimizer');
app.get('/api/us-cards/database', getUSCardDatabase);
app.post('/api/us-cards/optimize-spend', optimizeUSCards);

// US Revocable Living Trust & Pour-Over Will (Probate Avoidance)
const { generateLivingTrust } = require('./routes/usLivingTrust');
app.post('/api/us-trust/generate', generateLivingTrust);

// Cross-Border US-India Tax Shield (FBAR FinCEN 114, FATCA 8938, PFIC 8621)
const { auditCrossBorder } = require('./routes/crossBorderTax');
app.post('/api/cross-border/audit', auditCrossBorder);

// Plaid Link Bank & Brokerage Sync Gateway
const { createLinkToken, exchangePublicToken, getAccounts: getPlaidAccounts, disconnect: disconnectPlaid } = require('./routes/plaidGateway');
app.post('/api/plaid/create-link-token', createLinkToken);
app.post('/api/plaid/link/token/create', createLinkToken);
app.post('/api/plaid/exchange-public-token', exchangePublicToken);
app.post('/api/plaid/item/public_token/exchange', exchangePublicToken);
app.get('/api/plaid/accounts', getPlaidAccounts);
app.post('/api/plaid/disconnect', disconnectPlaid);

// Stripe USD Billing & Subscriptions ($19/$99/mo)
const { createCheckoutSession, createPortalSession, getInvoices: getStripeInvoices, handleWebhook: handleStripeWebhook } = require('./routes/stripeBilling');
app.post('/api/stripe/create-checkout-session', createCheckoutSession);
app.post('/api/stripe/checkout-session', createCheckoutSession);
app.post('/api/stripe/create-portal-session', createPortalSession);
app.post('/api/stripe/portal-session', createPortalSession);
app.get('/api/stripe/invoices', getStripeInvoices);
app.post('/api/stripe/webhook', handleStripeWebhook);

// ── Autonomous Execution & Subscription Engines ──────────────────────────────
const {
  getBrokerStatus,
  executeRebalance,
  executeHarvest,
  executeSweep,
  executeMFSwitch,
  executeOverlapConsolidation,
  cancelSubscriptionMandate,
  getExecutionHistory,
  executeBridgedOrder
} = require('./routes/brokerExecution');
app.get('/api/broker/status', getBrokerStatus);
app.post('/api/broker/execute-rebalance', executeRebalance);
app.post('/api/broker/execute-harvest', executeHarvest);
app.post('/api/broker/execute-sweep', executeSweep);
app.post('/api/broker/execute-mf-switch', executeMFSwitch);
app.post('/api/broker/execute-overlap-consolidation', executeOverlapConsolidation);
app.post('/api/broker/execute-bridged-order', executeBridgedOrder);
app.post('/api/subscriptions/cancel-mandate', cancelSubscriptionMandate);
app.get('/api/broker/execution-history', getExecutionHistory);

// ── Indian HUF (Hindu Undivided Family) Tax Studio ───────────────────────────
const { getHUFProfile, createHUFDeed, assessCapitalInfusion, simulateArbitrage } = require('./routes/hufStudio');
app.get('/api/huf/profile', getHUFProfile);
app.post('/api/huf/create-deed', createHUFDeed);
app.post('/api/huf/capital-infusion', assessCapitalInfusion);
app.post('/api/huf/simulate-arbitrage', simulateArbitrage);

const { getDetectedSubscriptions, cancelSubscription, negotiateBill } = require('./routes/subscriptionNegotiator');
app.get('/api/subscriptions/detected', getDetectedSubscriptions);
app.post('/api/subscriptions/cancel', cancelSubscription);
app.post('/api/bills/negotiate', negotiateBill);

// ── Credit Bureau & Institutional Payroll Sync ────────────────────────────────
const { getCreditScore, simulateCreditScore, computeDebtStrategy } = require('./routes/creditBureau');
app.get('/api/credit/score', getCreditScore);
app.post('/api/credit/simulate', simulateCreditScore);
app.post('/api/credit/debt-strategy', computeDebtStrategy);

const { getPayrollStatus, syncPayroll, configureSplitDeposit } = require('./routes/payrollSync');
app.get('/api/payroll/status', getPayrollStatus);
app.post('/api/payroll/sync', syncPayroll);
app.post('/api/payroll/split-deposit', configureSplitDeposit);

// ── Daily Retention Loops & Micro-Investing ───────────────────────────────────
const { generateDailyPulse, getDipRadar } = require('./routes/dailyPulse');
app.post('/api/pulse/generate', generateDailyPulse);
app.get('/api/pulse/dip-radar', getDipRadar);

const { getRoundUpStatus, updateConfig: updateRoundUpConfig, investJar } = require('./routes/roundUpEngine');
app.get('/api/roundup/status', getRoundUpStatus);
app.post('/api/roundup/config', updateRoundUpConfig);
app.post('/api/roundup/invest', investJar);

// ── Multi-Player Wealth & Succession Escrow ───────────────────────────────────
const { getHouseholdOverview, invitePartner, tagAccount } = require('./routes/household');
app.get('/api/household/overview', getHouseholdOverview);
app.post('/api/household/invite', invitePartner);
app.post('/api/household/tag-account', tagAccount);

const { getCPAClients, getClientTaxPackage, batchProcessDossiers, exportBulkForm8949 } = require('./routes/cpaPortal');
app.get('/api/cpa/clients', getCPAClients);
app.get('/api/cpa/client-tax-package', getClientTaxPackage);
app.post('/api/cpa/batch-process', batchProcessDossiers);
app.get('/api/cpa/export-8949-bundle', exportBulkForm8949);

const { getEscrowStatus, recordHeartbeat, challengeNominee } = require('./routes/successionEscrow');
app.get('/api/escrow/status', getEscrowStatus);
app.post('/api/escrow/heartbeat', recordHeartbeat);
app.post('/api/escrow/challenge-nominee', challengeNominee);

// ── High-Bounty Marketplace & B2B "FinAgent for Work" ─────────────────────────
const { getMarketplaceOffers, claimOffer, getBountyLedger, claimCashback } = require('./routes/marketplaceAffiliation');
app.get('/api/marketplace/offers', getMarketplaceOffers);
app.post('/api/marketplace/claim-offer', claimOffer);
app.get('/api/affiliation/bounty-ledger', getBountyLedger);
app.post('/api/affiliation/claim-cashback', claimCashback);

const {
  getWorkplaceOverview,
  updateSeats,
  updateMatchPolicy,
  setupCorporatePlan,
  syncCensus,
  getComplianceAudit,
  calculateTaxCredits,
  updateStudentLoanMatch,
} = require('./routes/enterpriseWork');
app.get('/api/work/overview', getWorkplaceOverview);
app.get('/api/workplace/overview', getWorkplaceOverview);
app.post('/api/work/seats', updateSeats);
app.post('/api/work/policy', updateMatchPolicy);
app.post('/api/work/corporate-plan/setup', setupCorporatePlan);
app.post('/api/workplace/setup', setupCorporatePlan);
app.post('/api/work/corporate-plan/sync-census', syncCensus);
app.get('/api/work/corporate-plan/compliance', getComplianceAudit);
app.post('/api/work/tax-credits', calculateTaxCredits);
app.post('/api/work/student-loan-match', updateStudentLoanMatch);

// ── Wave 2: Autonomous Execution, Multimodal AI & Venture-Scale Engines ───────

// 1. Autonomous Broker Order Routing (Alpaca & Zerodha Kite Connect)
const { getBrokerRouterStatus, updateBrokerConfig, updateBrokerCredentials, placeOrder, triggerSmartAllocation } = require('./routes/brokerOrderRouter');
app.get('/api/broker-router/status', getBrokerRouterStatus);
app.post('/api/broker-router/config', updateBrokerConfig);
app.post('/api/broker-router/credentials', updateBrokerCredentials);
app.post('/api/broker-router/place-order', placeOrder);
app.post('/api/broker-router/smart-allocation', triggerSmartAllocation);

// ── Vector 1: Direct Indexing & Tax-Alpha Harvester ───────────────────────────
const { getDirectIndexModels, rebalanceDirectIndex, harvestConstituentLots, enrollWrapFee, getCashSweepYield } = require('./routes/directIndexing');
app.get('/api/direct-indexing/models', getDirectIndexModels);
app.post('/api/direct-indexing/rebalance', rebalanceDirectIndex);
app.post('/api/direct-indexing/harvest-lots', harvestConstituentLots);
app.post('/api/direct-indexing/enroll-wrap', enrollWrapFee);
app.get('/api/direct-indexing/cash-sweep-yield', getCashSweepYield);

// ── Vector 2: Direct Government Tax & Statutory Legal E-Filing Rails ──────────
const {
  generateTaxSchema,
  lintTaxFiling,
  reconcileAISData,
  transmitEFile,
  notarizeDocument,
  generateFBAR,
  getSavedReturnHandler,
  saveReturnHandler,
  lockReturnHandler,
  getDocumentsHandler,
} = require('./routes/taxEFiling');
app.post('/api/e-file/generate-schema', generateTaxSchema);
app.post('/api/e-file/lint', lintTaxFiling);
app.post('/api/e-file/reconcile-ais', reconcileAISData);
app.post('/api/e-file/reconcile-1099', reconcileAISData);
app.post('/api/e-file/transmit', transmitEFile);
app.post('/api/efile/transmit', transmitEFile);
app.post('/api/e-file/notarize', notarizeDocument);
app.post('/api/e-file/fbar', generateFBAR);

// Multi-Tenant Persistence & CPA / CA Workpaper Rails
app.get('/api/tax/return/:market/:year', getSavedReturnHandler);
app.post('/api/tax/return/save', saveReturnHandler);
app.post('/api/tax/return/lock', lockReturnHandler);
app.get('/api/tax/documents/:userId?', getDocumentsHandler);

// ── US Federal & 50-State Income Tax Rails ─────────────────────────────────────
const {
  calculateFederalAndStateTax,
  calculateAMTTax,
  calculatePTETTax,
  calculateQuarterlyEstimatedTax,
  calculateScheduleDNettingHandler,
  calculateTaxShieldOptimizerHandler,
  calculateForm8606AndFBARHandler,
  handleParseUSDocument,
} = require('./routes/usTax');
app.post('/api/us-tax/calculate-federal-and-state', calculateFederalAndStateTax);
app.post('/api/us-tax/calculate-amt', calculateAMTTax);
app.post('/api/us-tax/calculate-ptet', calculatePTETTax);
app.post('/api/us-tax/quarterly-estimated', calculateQuarterlyEstimatedTax);
app.post('/api/us-tax/schedule-d-netting', calculateScheduleDNettingHandler);
app.post('/api/us-tax/tax-shield-optimizer', calculateTaxShieldOptimizerHandler);
app.post('/api/us-tax/form-8606-fbar', calculateForm8606AndFBARHandler);
app.post('/api/us-tax/parse-document', handleParseUSDocument);

// ── US S-Corporation / LLC Pass-Through Tax Studio ─────────────────────────────
const {
  optimizeSCorpPassThrough,
  getBasisWorksheet,
  getLLCOperatingAgreement,
  getCorporateBankingResolutionHandler,
  getFinCENBOIReportHandler,
} = require('./routes/usBusinessTax');
app.post('/api/us-scorp/optimize', optimizeSCorpPassThrough);
app.post('/api/us-scorp/basis-worksheet', getBasisWorksheet);
app.post('/api/us-scorp/operating-agreement', getLLCOperatingAgreement);
app.post('/api/us-scorp/banking-resolution', getCorporateBankingResolutionHandler);
app.post('/api/us-scorp/fincen-boi', getFinCENBOIReportHandler);

// ── Vector 4: Alternative Investments & Pre-IPO Secondary Marketplace ─────────
const { getSyndicateDeals, commitToSyndicate } = require('./routes/syndicates');
app.get('/api/syndicates/deals', getSyndicateDeals);
app.post('/api/syndicates/commit', commitToSyndicate);

// ── Vector 5: Gemini Live Multimodal WebRTC Vision Banker ─────────────────────
const { analyzeFrame } = require('./routes/liveMultimodal');
app.post('/api/live-multimodal/analyze-frame', analyzeFrame);


// 2. Conversational Voice AI Banker & 10,000-Run Monte Carlo Life Twin
const { respondToVoice } = require('./routes/voiceAdvisor');
app.post('/api/voice-advisor/respond', respondToVoice);

const { runMonteCarloSimulation } = require('./routes/lifeTwin');
app.post('/api/life-twin/simulate', runMonteCarloSimulation);

// 3. Private Equity Cap Table (409A) & Real Estate AVM Engine
const { getPrivateEquityDatabase, analyzeGrant } = require('./routes/privateEquity');
app.get('/api/private-equity/database', getPrivateEquityDatabase);
app.post('/api/private-equity/analyze-grant', analyzeGrant);

const { estimatePropertyValuation } = require('./routes/realEstateAVM');
app.post('/api/real-estate-avm/estimate', estimatePropertyValuation);

// 4. Viral Growth Engines & "Financial Blind" Cohorts + Couple Pre-Nup
const { getCohortsList, benchmarkAgainstCohort, calculateCouplePreNup, generateViralAudit } = require('./routes/viralCohorts');
app.get('/api/cohorts/list', getCohortsList);
app.get('/api/cohorts/benchmark', benchmarkAgainstCohort);
app.post('/api/prenup/calculate', calculateCouplePreNup);
app.post('/api/viral-audit/generate', generateViralAudit);

// 5. Zero-Knowledge Client Encryption & SOC2 Compliance Audit Chain
const { saveEncryptedVault, getEncryptedVault, getAuditTrail } = require('./routes/complianceAudit');
app.post('/api/compliance/vault/save', saveEncryptedVault);
app.get('/api/compliance/vault/retrieve', getEncryptedVault);
app.get('/api/compliance/audit-trail', getAuditTrail);

// 6. Multi-State & Cross-Border Residency Tax Arbitrage Simulator
const { calculateStateArbitrage, calculateRNORStatus, trackPhysicalPresence } = require('./routes/residencyArbitrage');
app.post('/api/residency/state-arbitrage', calculateStateArbitrage);
app.post('/api/residency/rnor-holiday', calculateRNORStatus);
app.post('/api/residency/day-counter', trackPhysicalPresence);

// ── Institutional & Enterprise Expansion Suite ─────────────────────────────

// 1. Corporate Treasury & CFO Yield Sentinel (/treasury)
const { getTreasuryOverview, optimizeSweep, calculateTBillLadder, projectRunway, updateApiConfig } = require('./routes/corporateTreasury');
app.get('/api/corporate-treasury/overview', getTreasuryOverview);
app.post('/api/corporate-treasury/optimize-sweep', optimizeSweep);
app.post('/api/corporate-treasury/tbill-ladder', calculateTBillLadder);
app.post('/api/corporate-treasury/project-runway', projectRunway);
app.post('/api/corporate-treasury/api-config', updateApiConfig);

// 2. Venture Syndicates, SPV & Cap Table OS (/syndicates)
const { getSyndicateDashboard, createSPV, dispatchCapitalCall, calculateWaterfall, generateK1TaxPackage } = require('./routes/syndicateAdmin');
app.get('/api/syndicate-admin/dashboard', getSyndicateDashboard);
app.post('/api/syndicate-admin/create-spv', createSPV);
app.post('/api/syndicate-admin/capital-call', dispatchCapitalCall);
app.post('/api/syndicate-admin/waterfall', calculateWaterfall);
app.post('/api/syndicate-admin/generate-k1', generateK1TaxPackage);

// 3. Non-Profits, Endowments & Tax-Optimized Stock Giving (/giving)
const { getEndowmentOverview, calculateStockGiftTaxSavings, auditEndowmentIPS, generateForm8283, getEmbedWidgetCode } = require('./routes/charitableGiving');
app.get('/api/charitable-giving/overview', getEndowmentOverview);
app.post('/api/charitable-giving/stock-tax-savings', calculateStockGiftTaxSavings);
app.post('/api/charitable-giving/audit-ips', auditEndowmentIPS);
app.post('/api/charitable-giving/generate-form-8283', generateForm8283);
app.get('/api/charitable-giving/widget-code', getEmbedWidgetCode);

// 4. Family Law, Divorce & Forensic Asset Discovery (/divorce)
const { getFamilyLawDashboard, analyzeForensicStatements, calculateEquitableDistribution, modelQDRO, generateCourtAffidavit } = require('./routes/familyLawForensics');
app.get('/api/family-law/dashboard', getFamilyLawDashboard);
app.post('/api/family-law/analyze-statements', analyzeForensicStatements);
app.post('/api/family-law/equitable-distribution', calculateEquitableDistribution);
app.post('/api/family-law/model-qdro', modelQDRO);
app.post('/api/family-law/generate-affidavit', generateCourtAffidavit);

// 5. Commercial Bank & White-Label Embedded Wealth SDK (/bank-embed)
const { getPartnerConfig, savePartnerConfig, simulateDepositSweep, getDeveloperDocs } = require('./routes/embeddedWealthSDK');
app.get('/api/embedded-wealth/config', getPartnerConfig);
app.post('/api/embedded-wealth/save-config', savePartnerConfig);
app.post('/api/embedded-wealth/simulate-sweep', simulateDepositSweep);
app.get('/api/embedded-wealth/developer-docs', getDeveloperDocs);

// 6. Institutional SEC RIA Compliance & Fiduciary Oversight (/api/sec/*)
const { getSecAlerts, generateFormAdv, generateFormCrs } = require('./routes/secCompliance');
app.get('/api/sec/alerts', getSecAlerts);
app.post('/api/sec/generate-form-adv', generateFormAdv);
app.post('/api/sec/generate-form-crs', generateFormCrs);

// ── Start ─────────────────────────────────────────────────────────────────────
if (require.main === module || !process.env.VERCEL) {
app.listen(PORT, () => {
  console.log(`\n🚀 FinAgent Backend running on http://localhost:${PORT}`);
  console.log(`   Gemini API key:  ${process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Missing — add to server/.env'}`);
  console.log(`   NewsAPI key:     ${process.env.NEWS_API_KEY ? '✅ Set' : '❌ Missing — add to server/.env'}`);
  console.log(`   Razorpay key:    ${process.env.RAZORPAY_KEY_ID ? '✅ Set (Test Mode)' : '⚠️  Not set'}`);
  console.log(`   Resend key:      ${process.env.RESEND_API_KEY ? '✅ Set' : '⚠️  Not set — email disabled'}`);
  console.log(`   WhatsApp token:  ${process.env.WHATSAPP_TOKEN ? '✅ Set' : '⚪ Not set — add when ready'}`);
  console.log('');
});
}

module.exports = app;
