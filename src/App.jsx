import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ChatProvider } from './context/ChatContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { ToastProvider } from './context/ToastContext';
import FeatureGate from './components/ui/FeatureGate';

// Auth pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';

// Layout & Landing
import Landing from './pages/Landing';
import ConsumerApp from './pages/consumer/ConsumerApp';
import AdvisorApp from './pages/advisor/AdvisorApp';

// Consumer Pages
import Dashboard from './pages/consumer/Dashboard';
import Portfolio from './pages/consumer/Portfolio';
import AIAdvisor from './pages/consumer/AIAdvisor';
import HealthScore from './pages/consumer/HealthScore';
import Goals from './pages/consumer/Goals';
import TaxHarvester from './pages/consumer/TaxHarvester';
// AI Features (Consumer)
import DocumentIntelligence from './pages/consumer/DocumentIntelligence';
import NewsFeed from './pages/consumer/NewsFeed';
import PeerBenchmark from './pages/consumer/PeerBenchmark';
import FinancialDNA from './pages/consumer/FinancialDNA';
// Smart Tools (Consumer)
import ImportPortfolio from './pages/consumer/ImportPortfolio';
import FIRECalculator from './pages/consumer/FIRECalculator';
import Rebalancing from './pages/consumer/Rebalancing';
import InsuranceAnalyzer from './pages/consumer/InsuranceAnalyzer';
import LoanAnalyzer from './pages/consumer/LoanAnalyzer';
import ITRAssistant from './pages/consumer/ITRAssistant';
import Cashflow from './pages/consumer/Cashflow';
// New Features (Consumer)
import PerformanceAnalytics from './pages/consumer/PerformanceAnalytics';
import GovtSchemes from './pages/consumer/GovtSchemes';
import Watchlist from './pages/consumer/Watchlist';
import LinkAdvisor from './pages/consumer/LinkAdvisor';
import ReportGenerator from './pages/consumer/ReportGenerator';
// AI-Powered Features
import PortfolioDoctor from './pages/consumer/PortfolioDoctor';
import LifeEventAdvisor from './pages/consumer/LifeEventAdvisor';
import SIPOptimizer from './pages/consumer/SIPOptimizer';
import WhatsAppConnect from './pages/consumer/WhatsAppConnect';
// Revenue Features
import CASImport from './pages/consumer/CASImport';
import ReportSettings from './pages/consumer/ReportSettings';
import PortfolioXRay from './pages/consumer/PortfolioXRay';
import AdvisorMarketplace from './pages/consumer/AdvisorMarketplace';
import AdvisorListing from './pages/advisor/AdvisorListing';
import AdvisorApply from './pages/marketplace/AdvisorApply';
// 5 High-WTP Features
import CommissionHunter from './pages/consumer/CommissionHunter';
import FamilyHub from './pages/consumer/FamilyHub';
import EmergencyVault from './pages/consumer/EmergencyVault';
import AccountAggregatorSync from './pages/consumer/AccountAggregatorSync';
import TaxLossHarvesting from './pages/consumer/TaxLossHarvesting';
// 5 High-WTP AI Engines
import CTCOptimizer from './pages/consumer/CTCOptimizer';
import ForensicAudit from './pages/consumer/ForensicAudit';
import StressTest from './pages/consumer/StressTest';
// Startup-Ready Suite (Group A & Group B)
import ESOPRSUAnalyzer from './pages/consumer/ESOPRSUAnalyzer';
import DigitalWill from './pages/consumer/DigitalWill';
import CardOptimizer from './pages/consumer/CardOptimizer';
import BillingInvoices from './pages/consumer/BillingInvoices';

// Onboarding
import OnboardingWizard from './pages/onboarding/OnboardingWizard';

// Legal Pages
import TermsOfService from './pages/legal/TermsOfService';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';

// Public Viral Tools
import PublicCTCTaxLeak from './pages/public/PublicCTCTaxLeak';
import PublicLoanArbitrage from './pages/public/PublicLoanArbitrage';
import PublicW2TaxLeak from './pages/public/PublicW2TaxLeak';
import PublicMortgageArbitrage from './pages/public/PublicMortgageArbitrage';

// US Market Consumer Modules
import USW2Optimizer from './pages/consumer/us/USW2Optimizer';
import USTaxLossHarvester from './pages/consumer/us/USTaxLossHarvester';
import USEquityCompensation from './pages/consumer/us/USEquityCompensation';
import USCardOptimizer from './pages/consumer/us/USCardOptimizer';
import USMortgageRefi from './pages/consumer/us/USMortgageRefi';
import USLivingTrust from './pages/consumer/us/USLivingTrust';
import CrossBorderShield from './pages/consumer/us/CrossBorderShield';
import US401kFeeHunter from './pages/consumer/us/US401kFeeHunter';
import PlaidSync from './pages/consumer/us/PlaidSync';

// Autonomous Execution, Institutional Credit & Multi-Player Wealth
import ExecutionHub from './pages/consumer/ExecutionHub';
import CreditHub from './pages/consumer/CreditHub';
import PayrollHub from './pages/consumer/PayrollHub';
import RoundUps from './pages/consumer/RoundUps';
import HouseholdHub from './pages/consumer/HouseholdHub';
import SuccessionEscrow from './pages/consumer/SuccessionEscrow';
import MarketplaceOffers from './pages/consumer/MarketplaceOffers';
import CPAPortal from './pages/cpa/CPAPortal';
import WorkPortal from './pages/work/WorkPortal';

// Wave 2: Autonomous Execution, Multimodal AI & Venture-Scale Engines
import BrokerOrderRouter from './pages/consumer/BrokerOrderRouter';
import VoiceBanker from './pages/consumer/VoiceBanker';
import LifeTwinSimulator from './pages/consumer/LifeTwinSimulator';
import PrivateEquityHub from './pages/consumer/PrivateEquityHub';
import RealEstateAVMHub from './pages/consumer/RealEstateAVMHub';
import FinancialCohorts from './pages/consumer/FinancialCohorts';
import CouplePreNup from './pages/consumer/CouplePreNup';
import ZeroKnowledgeVault from './pages/consumer/ZeroKnowledgeVault';
import ResidencyArbitrageHub from './pages/consumer/ResidencyArbitrageHub';
import PublicViralDiagnostic from './pages/public/PublicViralDiagnostic';

// Wave 3: Institutional-Grade Agentic AI Operating System
import CouncilHub from './pages/consumer/CouncilHub';
import BillLoanNegotiator from './pages/consumer/BillLoanNegotiator';
import AIReportStudio from './pages/consumer/AIReportStudio';

// Frontier Venture-Scale Expansion Suite (The 5 Highest-Impact Vectors)
import DirectIndexingHub from './pages/consumer/DirectIndexingHub';
import TaxEFilingHub from './pages/consumer/TaxEFilingHub';
import EstateNotaryHub from './pages/consumer/EstateNotaryHub';
import ESOPFinancingMarketplace from './pages/work/ESOPFinancingMarketplace';
import AlternativeSyndicateHub from './pages/consumer/AlternativeSyndicateHub';
import LiveMultimodalBanker from './pages/consumer/LiveMultimodalBanker';
import MarketplaceBounties from './pages/consumer/MarketplaceBounties';
import FinAgentBlack from './pages/consumer/FinAgentBlack';

// Advisor Pages
import ClientBook from './pages/advisor/ClientBook';

import ClientProfile from './pages/advisor/ClientProfile';
import RecoQueue from './pages/advisor/RecoQueue';
import AuditLog from './pages/advisor/AuditLog';
import InsightsTier from './pages/advisor/InsightsTier';
// AI Features (Advisor)
import MeetingPrep from './pages/advisor/MeetingPrep';
import ReportCard from './pages/advisor/ReportCard';
import ComplianceWatchdog from './pages/advisor/ComplianceWatchdog';
// New Features (Advisor)
import ClientOnboarding from './pages/advisor/ClientOnboarding';
import AUMDashboard from './pages/advisor/AUMDashboard';
import ModelPortfolios from './pages/advisor/ModelPortfolios';
import PortalSettings from './pages/advisor/PortalSettings';

// ── Protected Route ─────────────────────────────────────────────────────────
function ProtectedRoute({ children, requiredRole }) {
  const { currentUser, userRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading FinAgent…</div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && userRole && userRole !== requiredRole) {
    return <Navigate to={userRole === 'advisor' ? '/advisor' : '/app'} replace />;
  }

  return children;
}

// ── App Routes ───────────────────────────────────────────────────────────────
function AppRoutes() {
  const { currentUser, userRole } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={currentUser ? <Navigate to={userRole === 'advisor' ? '/advisor' : '/app'} replace /> : <Login />} />
      <Route path="/signup" element={currentUser ? <Navigate to={userRole === 'advisor' ? '/advisor' : '/app'} replace /> : <Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/" element={currentUser ? <Navigate to={userRole === 'advisor' ? '/advisor' : '/app'} replace /> : <Landing />} />
      {/* Advisor invite deep link */}
      <Route path="/link" element={currentUser ? <Navigate to="/app/link-advisor" /> : <Navigate to="/login" />} />
      {/* Onboarding — protected, investor only, full-screen (no sidebar) */}
      <Route path="/onboarding" element={<ProtectedRoute requiredRole="investor"><OnboardingWizard /></ProtectedRoute>} />
      {/* Legal Pages — public, no auth required */}
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      {/* Public Viral Lead-Magnet Tools — zero auth required */}
      <Route path="/tools/ctc-tax-leak" element={<PublicCTCTaxLeak />} />
      <Route path="/tools/loan-arbitrage" element={<PublicLoanArbitrage />} />
      <Route path="/tools/w2-tax-leak" element={<PublicW2TaxLeak />} />
      <Route path="/tools/pmi-arbitrage" element={<PublicMortgageArbitrage />} />
      <Route path="/tools/wealth-leak" element={<PublicViralDiagnostic />} />


      {/* Consumer / Investor App */}
      <Route path="/app" element={<ProtectedRoute requiredRole="investor"><ConsumerApp /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="portfolio" element={<Portfolio />} />
        <Route path="ai-advisor" element={<AIAdvisor />} />
        <Route path="health-score" element={<HealthScore />} />
        <Route path="goals" element={<Goals />} />
        <Route path="tax" element={<FeatureGate feature="tax_harvester" featureName="Tax Harvester"><TaxHarvester /></FeatureGate>} />
        {/* AI Features */}
        <Route path="documents" element={<FeatureGate feature="documents" featureName="Document Intelligence"><DocumentIntelligence /></FeatureGate>} />
        <Route path="news" element={<NewsFeed />} />
        <Route path="peers" element={<FeatureGate feature="peers" featureName="Peer Benchmark"><PeerBenchmark /></FeatureGate>} />
        <Route path="dna" element={<FeatureGate feature="dna" featureName="Financial DNA"><FinancialDNA /></FeatureGate>} />
        {/* Smart Tools */}
        <Route path="import" element={<FeatureGate feature="import_portfolio" featureName="Portfolio Import"><ImportPortfolio /></FeatureGate>} />
        <Route path="fire" element={<FIRECalculator />} />
        <Route path="rebalancing" element={<FeatureGate feature="rebalancing" featureName="Portfolio Rebalancing"><Rebalancing /></FeatureGate>} />
        <Route path="insurance" element={<FeatureGate feature="insurance" featureName="Insurance Analyzer"><InsuranceAnalyzer /></FeatureGate>} />
        <Route path="loan" element={<FeatureGate feature="loan_analyzer" featureName="Loan Analyzer"><LoanAnalyzer /></FeatureGate>} />
        <Route path="itr" element={<FeatureGate feature="itr_assistant" featureName="ITR Assistant"><ITRAssistant /></FeatureGate>} />
        <Route path="cashflow" element={<FeatureGate feature="cashflow" featureName="Cashflow Analyzer"><Cashflow /></FeatureGate>} />
        {/* New Features */}
        <Route path="performance" element={<PerformanceAnalytics />} />
        <Route path="govt-schemes" element={<FeatureGate feature="govt_schemes" featureName="Government Schemes Tracker"><GovtSchemes /></FeatureGate>} />
        <Route path="watchlist" element={<FeatureGate feature="watchlist" featureName="Market Watchlist"><Watchlist /></FeatureGate>} />
        <Route path="link-advisor" element={<LinkAdvisor />} />
        <Route path="reports" element={<FeatureGate feature="pdf_reports" featureName="PDF Reports"><ReportGenerator /></FeatureGate>} />
        {/* AI-Powered Features */}
        <Route path="doctor" element={<PortfolioDoctor />} />
        <Route path="life-events" element={<LifeEventAdvisor />} />
        <Route path="sip-optimizer" element={<SIPOptimizer />} />
        <Route path="whatsapp" element={<WhatsAppConnect />} />
        {/* Revenue Features */}
        <Route path="cas-import" element={<CASImport />} />
        <Route path="report-settings" element={<ReportSettings />} />
        <Route path="xray" element={<PortfolioXRay />} />
        <Route path="marketplace" element={<AdvisorMarketplace />} />
        {/* 5 High-WTP Features */}
        <Route path="commission-hunter" element={<CommissionHunter />} />
        <Route path="family-hub" element={<FamilyHub />} />
        <Route path="emergency-vault" element={<EmergencyVault />} />
        <Route path="aa-sync" element={<AccountAggregatorSync />} />
        <Route path="tax-loss-bot" element={<TaxLossHarvesting />} />
        {/* 5 High-WTP AI Engines */}
        <Route path="ctc-optimizer" element={<CTCOptimizer />} />
        <Route path="forensic-audit" element={<ForensicAudit />} />
        <Route path="stress-test" element={<StressTest />} />
        {/* Startup-Ready Suite (Group A & Group B) */}
        <Route path="esop-rsu" element={<ESOPRSUAnalyzer />} />
        <Route path="digital-will" element={<DigitalWill />} />
        <Route path="card-optimizer" element={<CardOptimizer />} />
        <Route path="invoices" element={<BillingInvoices />} />

        {/* US Market Parallel Modules */}
        <Route path="w2-optimizer" element={<USW2Optimizer />} />
        <Route path="wash-sale" element={<USTaxLossHarvester />} />
        <Route path="equity-os" element={<USEquityCompensation />} />
        <Route path="us-cards" element={<USCardOptimizer />} />
        <Route path="mortgage-refi" element={<USMortgageRefi />} />
        <Route path="living-trust" element={<USLivingTrust />} />
        <Route path="cross-border" element={<CrossBorderShield />} />
        <Route path="fee-hunter" element={<US401kFeeHunter />} />
        <Route path="plaid-sync" element={<PlaidSync />} />

        {/* Autonomous Execution & Institutional Wealth Modules */}
        <Route path="execution" element={<ExecutionHub />} />
        <Route path="credit" element={<CreditHub />} />
        <Route path="payroll" element={<PayrollHub />} />
        <Route path="roundups" element={<RoundUps />} />
        <Route path="household" element={<HouseholdHub />} />
        <Route path="succession" element={<SuccessionEscrow />} />
        <Route path="offers" element={<MarketplaceOffers />} />
        
        {/* Wave 2: Autonomous Execution, Multimodal AI & Venture-Scale Engines */}
        <Route path="broker-router" element={<BrokerOrderRouter />} />
        <Route path="voice-banker" element={<VoiceBanker />} />
        <Route path="life-twin" element={<LifeTwinSimulator />} />
        <Route path="private-equity" element={<PrivateEquityHub />} />
        <Route path="real-estate-avm" element={<RealEstateAVMHub />} />
        <Route path="cohorts" element={<FinancialCohorts />} />
        <Route path="prenup" element={<CouplePreNup />} />
        <Route path="zk-vault" element={<ZeroKnowledgeVault />} />
        <Route path="residency-arbitrage" element={<ResidencyArbitrageHub />} />

        {/* Wave 3: Institutional-Grade Agentic AI Operating System */}
        <Route path="council" element={<CouncilHub />} />
        <Route path="negotiator" element={<BillLoanNegotiator />} />
        <Route path="chart-studio" element={<AIReportStudio />} />

        {/* Frontier Venture-Scale Expansion Routes */}
        <Route path="direct-indexing" element={<DirectIndexingHub />} />
        <Route path="e-file" element={<TaxEFilingHub />} />
        <Route path="notary" element={<EstateNotaryHub />} />
        <Route path="esop-financing" element={<ESOPFinancingMarketplace />} />
        <Route path="syndicates" element={<AlternativeSyndicateHub />} />
        <Route path="live-banker" element={<LiveMultimodalBanker />} />
        <Route path="bounties" element={<MarketplaceBounties />} />
        <Route path="black" element={<FinAgentBlack />} />
      </Route>


      {/* Standalone Portals: CPA & FinAgent for Work */}
      <Route path="/cpa" element={<CPAPortal />} />
      <Route path="/work" element={<WorkPortal />} />

      {/* Advisor Portal */}
      <Route path="/advisor" element={<ProtectedRoute requiredRole="advisor"><AdvisorApp /></ProtectedRoute>}>
        <Route index element={<Navigate to="clients" replace />} />
        <Route path="clients" element={<ClientBook />} />
        <Route path="clients/:clientId" element={<ClientProfile />} />
        <Route path="recommendations" element={<RecoQueue />} />
        <Route path="audit" element={<AuditLog />} />
        <Route path="insights" element={<InsightsTier />} />
        {/* AI Features */}
        <Route path="meeting-prep" element={<MeetingPrep />} />
        <Route path="report-cards" element={<ReportCard />} />
        <Route path="compliance" element={<ComplianceWatchdog />} />
        {/* Advisor Suite */}
        <Route path="onboarding" element={<ClientOnboarding />} />
        <Route path="aum" element={<AUMDashboard />} />
        <Route path="models" element={<ModelPortfolios />} />
        <Route path="portal" element={<PortalSettings />} />
        <Route path="listing" element={<AdvisorListing />} />
      </Route>

      {/* Public — no auth required */}
      <Route path="/become-advisor" element={<AdvisorApply />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <SubscriptionProvider>
            <ChatProvider>
              <ToastProvider>
                <AppRoutes />
              </ToastProvider>
            </ChatProvider>
          </SubscriptionProvider>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
