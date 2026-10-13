# FinAgent — The Autonomous Multi-Market Financial Operating System

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![SQLite](https://img.shields.io/badge/SQLite-WAL%20Persistence-003B57?logo=sqlite&logoColor=white)](https://sqlite.org/)
[![Google Gemini](https://img.shields.io/badge/AI-Gemini%202.0%20Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Capacitor](https://img.shields.io/badge/Mobile-iOS%20%7C%20Android-119EFF?logo=capacitor&logoColor=white)](https://capacitorjs.com/)
[![GitHub](https://img.shields.io/badge/GitHub-adityachowdhuryin%2FFinagent-181717?logo=github&logoColor=white)](https://github.com/adityachowdhuryin/Finagent)

> **FinAgent** is an institutional-grade, venture-scale, AI-native Financial Operating System designed for dual-market operation (**🇺🇸 United States** & **🇮🇳 India**). It provides unified wealth infrastructure for retail investors, high-net-worth families, Registered Investment Advisors (RIAs), CPAs, corporate treasurers, venture syndicates, non-profit endowments, family law attorneys, and regional banks.

---

## 📑 Table of Contents
1. [Executive Overview & Vision](#1-executive-overview--vision)
2. [Dual-Market Architecture & Experience Modes](#2-dual-market-architecture--experience-modes)
3. [The 9 Core Portals & Ecosystem Personas](#3-the-9-core-portals--ecosystem-personas)
4. [Frontier & Agentic AI Capabilities](#4-frontier--agentic-ai-capabilities)
5. [System Architecture & Data Flows](#5-system-architecture--data-flows)
6. [Tech Stack & Third-Party Integrations](#6-tech-stack--third-party-integrations)
7. [Directory Structure](#7-directory-structure)
8. [Getting Started & Local Setup](#8-getting-started--local-setup)
9. [Mobile App Setup (iOS & Android)](#9-mobile-app-setup-ios--android)
10. [Cloud Deployment Guide](#10-cloud-deployment-guide)
11. [Regulatory Compliance & Security Architecture](#11-regulatory-compliance--security-architecture)

---

## 1. Executive Overview & Vision

Modern personal and institutional wealth is fragmented across disconnected banking portals, brokerages, tax documents, spreadsheets, and advisors. **FinAgent** solves this by unifying financial analysis, tax harvesting, estate planning, corporate treasury, venture syndication, and fiduciary management into a single real-time platform.

### Core Value Drivers:
- **Consumer Wealth**: Real-time portfolio tracking across equities, mutual funds, FDs, EPF/PPF, gold, real estate, and crypto.
- **Enterprise & B2B ARR**: Unlocks **$25,000 to $250,000+ Annual Contract Value (ACV)** through corporate treasury sweep management, venture syndicate formation, non-profit stock donation processing, forensic divorce discovery, and white-label bank SDK licensing.
- **Dual Regulatory Compliance**: Built with dual regulatory rails adhering to both **SEBI (Investment Advisers) Regulations, 2013** and the **U.S. SEC Investment Advisers Act of 1940**.

---

## 2. Dual-Market Architecture & Experience Modes

FinAgent features instant toggling between two macroeconomic jurisdictions and three distinct user experience tiers:

```mermaid
flowchart TD
    subgraph Market_Toggle["Dual-Market Engines"]
        IN["🇮🇳 India Mode (INR ₹)<br/>SEBI, Nifty, CAMS, EPF, Section 80C/112A, Form 64D"]
        US["🇺🇸 US Mode (USD $)<br/>SEC, S&P 500, Plaid, 401(k), IRC § 1040/1065, K-1"]
    end

    subgraph Experience_Tiers["Experience Tiers"]
        E1["Essential (Clean, distraction-free tracker)"]
        E2["Pro (Advanced analytics, tax harvesters, AI agents)"]
        E3["Sovereign / Black VIP (Concierge banking, ZK vault, direct indexing)"]
    end

    Market_Toggle --> Experience_Tiers
```

- **🇮🇳 India Engine**: Handles CAMS/NSDL CAS PDF imports, EPF/PPF calculations, Old vs. New tax regime comparisons, Capital Gains Section 112A harvesting, Sovereign Gold Bonds (SGB), and RBI Treasury bills.
- **🇺🇸 US Engine**: Handles Plaid bank sync, W-2 tax optimization, 401(k) fee auditing, IRS 30-day wash-sale harvesting with proxy ETFs, Revocable Living Trusts, and FBAR/FATCA cross-border compliance.

---

## 3. The 9 Core Portals & Ecosystem Personas

FinAgent provides purpose-built interfaces tailored to each stakeholder in the financial ecosystem:

### 1. 📈 Personal Wealth Cockpit (`/app`)
- **Real-Time Net Worth & Health Score**: 0–100 proprietary financial health engine evaluating liquidity, debt burden, insurance coverage, diversification, and goal glide paths.
- **Goal Glide Paths**: Multi-goal forecasting with automated SIP contribution recommendations.
- **Smart Tools**: FIRE simulator, portfolio rebalancer, cashflow statement extractor, emergency vault, and automated loan prepayment arbitrage.

### 2. 👑 FinAgent Black VIP Sovereign Hub (`/app/black`)
- Reserved for Ultra-High-Net-Worth individuals ($5M+ liquid net worth).
- Features dedicated concierge banker messaging, sovereign wealth asset allocation, zero-knowledge family escrow, and direct secondary private equity allocations.

### 3. 👔 Wealth Advisor OS (`/advisor`)
- **Client Book (`/advisor/clients`)**: Full practice overview displaying client AUM, health scores, and risk profiles.
- **Digital Onboarding Wizard (`/advisor/onboarding`)**: 5-step paperless flow: KYC Details -> Risk Questionnaire -> Gemini AI Investment Policy Statement (IPS) generation -> Touch/Mouse Digital Signature -> Database Registration.
- **Statutory Recommendation Queue (`/advisor/recommendations`)**: Fiduciary approval workflow that formats recommendations into branded letterheads, dispatches them directly to client inboxes via **Resend**, and logs immutable compliance audit records.
- **Compliance Watchdog & Meeting Prep**: AI-generated client dossiers with talking points, risk drift warnings, and portfolio summaries.

### 4. 🏦 Corporate Treasury & CFO Yield Sentinel (`/treasury`)
- **Target Audience**: Startup CFOs, mid-market controllers, treasurers.
- **Dynamic Runway & Burn Counter**: Real-time runway calculations based on operational cash burn.
- **Multi-Bank Insured Cash Sweep (ICS)**: Sweeps deposits across partner banks to achieve **$150M+ extended FDIC / DICGC** insurance coverage.
- **T-Bill Yield Ladder**: Dual-market yield optimizer modeling 4-week to 26-week US Treasuries (5.28%) or Indian RBI 91/182-Day T-Bills (6.84%).
- **ERP Bridge**: One-click sync with NetSuite, QuickBooks Online, and TallyPrime.

### 5. 🤝 Venture Syndicates, SPVs & Cap Table OS (`/syndicates`)
- **Target Audience**: Syndicate leads, angel networks, micro-VCs.
- **SPV Formation & Capital Calls**: Track LP commitments and dispatch digital capital call notices with tracking of wired funds.
- **Waterfall Distribution Engine**: Models European and American distribution waterfalls, preferred returns (8% hurdle), catch-up provisions, and 80/20 carried interest splits.
- **Automated Tax Packages**: Generates US IRS Form 1065 / Schedule K-1 and Indian Category I/II AIF Form 64D tax packages.

### 6. 🏛️ Non-Profits, Endowments & Stock Giving (`/giving`)
- **Target Audience**: University endowments, 501(c)(3) charities, Section 8 non-profits.
- **Zero-Tax Stock Donation Widget**: Demonstrates tax savings for donors giving appreciated equities (circumventing capital gains tax while securing full fair-market deductions).
- **Embeddable Donation Snippet**: Ready-to-use HTML/JavaScript embed widget for fundraising portals.
- **UPMIFA Spending Policy Sentinel**: Audits endowment drawdowns against statutory 4.5%–5.0% caps.

### 7. ⚖️ Family Law, Divorce & Forensic Discovery (`/divorce`)
- **Target Audience**: Matrimonial attorneys, forensic accountants, divorce mediators.
- **AI Forensic Statement Audit**: Ingests hundreds of financial statements to flag suspicious offshore transfers, undisclosed crypto wallets, and hidden cash withdrawals.
- **Equitable Distribution Simulator**: Interactive balance sheet modeling community property vs. separate property across 50/50 splits or custom settlements.
- **QDRO Modeler**: Models ERISA 401(k) / EPF divisions without triggering early withdrawal penalties.

### 8. 🌐 White-Label Bank Embedded Wealth SDK (`/bank-embed`)
- **Target Audience**: Regional commercial banks, credit unions, fintech neobanks.
- **Live Theme Customizer**: Real-time preview of the embedded widget with configurable colors, corner radii, and brand logos.
- **Developer Code Playground**: Ready-to-copy code snippets for **React**, **iOS Swift**, and **Android Kotlin**.
- **Deposit Retention Engine**: Automated sweep rules preventing deposit runoff by routing excess checking balances into high-yield internal certificates.

### 9. 💼 CPA & Tax Practice Portal (`/cpa`)
- Multi-client dashboard for tax practitioners.
- Batch generation and export of IRS **Form 8949 / Schedule D CSV bundles** and Indian ITR capital gains packages.
- Tax-loss harvesting ledger across all managed client accounts.

---

## 4. Frontier & Agentic AI Capabilities

FinAgent integrates advanced agentic AI patterns powered by Google Gemini 2.0 Flash:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   FinAgent Multi-Agent Intelligence                    │
├─────────────────┬──────────────────┬─────────────────┬─────────────────┤
│  Agentic AI     │  Multimodal Live │  Zero-Knowledge │  Life Twin      │
│  Council        │  Banker          │  Privacy Vault  │  Simulator      │
│  Consensus      │  Camera + Voice  │  AES-256-GCM    │  Monte Carlo    │
│  Debate         │  Vision OCR      │  Client-Side    │  Decisions      │
└─────────────────┴──────────────────┴─────────────────┴─────────────────┘
```

1. **Agentic AI Council (`/app/council`)**: Multi-agent deliberative debate where dedicated AI personas (Chief Investment Officer, Conservative Tax Attorney, Aggressive Growth Strategist, and Risk Manager) debate your portfolio and synthesize a consensus recommendation.
2. **Live Multimodal Banker (`/app/live-banker`)**: Real-time voice and vision banker capable of analyzing physical financial documents via device camera and answering spoken inquiries.
3. **Zero-Knowledge Privacy Vault (`/app/zk-vault`)**: Client-side **AES-GCM-256** encryption using PBKDF2 key derivation. Your financial secrets and documents are encrypted before leaving your browser; no plaintext is ever sent to the server.
4. **Automated Tax Loss Harvester (`/app/tax-loss-bot`, `/app/wash-sale`)**: Scans unrealized portfolio losses, executes wash-sale avoidance by swapping into correlated proxy ETFs, and tracks tax savings.
5. **Direct Indexing Engine (`/app/direct-indexing`)**: Replicates benchmark indices (S&P 500, Nifty 50) directly with fractional stock baskets, optimizing for daily tax-loss alpha.
6. **Life Twin Simulator (`/app/life-twin`)**: Monte Carlo simulation platform modeling life events (career pivots, real estate purchases, relocation, early retirement).
7. **Document Intelligence (`/app/documents`)**: Gemini Vision OCR extracting portfolios from CAMS PDFs, NSDL statements, salary slips, EPF passbooks, bank statements, and FD certificates.
8. **Public Viral Diagnostic Tools (`/tools/*`)**: Frictionless zero-login calculators (CTC Tax Leak, W-2 Tax Leak, Mortgage PMI Arbitrage, Loan Arbitrage) designed for viral organic customer acquisition.

---

## 5. System Architecture & Data Flows

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Investor / Advisor
    participant UI as Vite + React Frontend (:5173)
    participant API as Express API Server (:3001)
    participant DB as SQLite WAL (Local)
    participant Cloud as Supabase PostgreSQL
    participant AI as Google Gemini 2.0 Flash
    participant Mail as Resend Transactional Email

    User->>UI: Interacts with Portals (e.g. Onboard Client, Dispatch Reco)
    UI->>API: REST API Call (/api/advisor/onboard-client)
    API->>AI: Generates IPS & Financial Insights
    AI-->>API: Returns Formatted Documentation
    API->>DB: Synchronous Write (Zero-Latency Local Ledger)
    API->>Cloud: Asynchronous Sync (Cloud Durability)
    API->>Mail: Dispatches Official Email to Client (Resend)
    API-->>UI: HTTP 200 OK + Persisted Entity
    UI-->>User: Instant UI Update + Audit Reference
```

---

## 6. Tech Stack & Third-Party Integrations

### Frontend
- **Framework**: [React 18.3](https://react.dev/) + [Vite 5.4](https://vitejs.dev/)
- **Routing**: [React Router DOM v6](https://reactrouter.com/)
- **Charts & Visualization**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Document Export**: [html2canvas](https://html2canvas.hertzen.com/) & [jsPDF](https://github.com/parallax/jsPDF)
- **Styling**: Native CSS Variables with Dark Glassmorphism, Zero-Tailwind runtime overhead

### Mobile Runtime
- **Engine**: [Capacitor 8.5](https://capacitorjs.com/) (`@capacitor/core`, `@capacitor/ios`, `@capacitor/android`)
- **Native Bridges**: Custom haptic feedback, native share sheet, in-app secure browser

### Backend & Storage
- **Runtime**: [Node.js 24](https://nodejs.org/) (Express 4.21, CommonJS)
- **Database (Dual-Persistence)**:
  - **Local**: SQLite 3 with Write-Ahead Logging (WAL) mode
  - **Cloud**: [Supabase](https://supabase.com/) PostgreSQL Pooler (Connection pooling via `pg`)
- **AI / LLM**: `@google/generative-ai` (Gemini 2.0 Flash, Gemini 1.5 Flash)
- **Email**: [Resend](https://resend.com/) transactional email API
- **Payments**: [Razorpay](https://razorpay.com/) (INR) & [Stripe](https://stripe.com/) (USD)
- **Brokerage & Financial Feeds**:
  - Alpaca Securities API (Paper Trading $100k Buying Power)
  - Plaid Link Sandbox (Bank Account Connectivity)
  - Yahoo Finance 2 (Live Market Quotes & Indices)
  - MFAPI.in (Indian Mutual Fund Daily NAVs)
- **Analytics**: Firebase Analytics & [Mixpanel](https://mixpanel.com/)

---

## 7. Directory Structure

```
Fin/
├── index.html                   # HTML Entry Point
├── package.json                 # Frontend dependencies & build scripts
├── vite.config.js               # Vite configuration
├── capacitor.config.ts          # Native iOS/Android Capacitor configuration
├── MOBILE_BUILD.md              # Complete mobile build guide
├── vercel.json                  # Single-Page-App routing for Vercel
├── .env.example                 # Frontend environment template
├── .env.local                   # Local frontend environment variables
│
├── src/                         # Frontend Application Source
│   ├── App.jsx                  # Main router & route hierarchy (80+ routes)
│   ├── main.jsx                 # React root mount
│   ├── components/              # Reusable UI Components
│   │   ├── charts/              # Recharts wrappers (Asset allocation, performance)
│   │   ├── layout/              # TopBar, Sidebar, HubSubNav
│   │   ├── notifications/       # TopBar AI Notification Bell & Panel
│   │   └── ui/                  # ErrorBoundary, FeatureGate, UpgradeModal
│   ├── context/                 # State Contexts
│   │   ├── AppContext.jsx       # Global portfolio, dual-market, & role state
│   │   ├── AuthContext.jsx      # Firebase auth & multi-tenant role switching
│   │   ├── SubscriptionContext.jsx # Stripe/Razorpay tier gating
│   │   └── ToastContext.jsx     # Notifications & feedback toasts
│   ├── hooks/                   # Custom React Hooks
│   │   ├── useActionCards.js    # Investor dashboard action card hydration
│   │   ├── useCapacitor.js      # Native mobile bridge (Haptics, Share)
│   │   └── useNotifications.js  # Top-bar notification hydration
│   ├── pages/                   # Application Views & Pages
│   │   ├── advisor/             # Wealth Advisor OS (ClientBook, RecoQueue, Onboarding)
│   │   ├── auth/                # Login, Signup, Forgot Password
│   │   ├── bank/                # Embedded Wealth White-Label Portal
│   │   ├── consumer/            # Personal Wealth & AI modules
│   │   │   └── us/              # US-specific modules (W2, 401k, Living Trust, Plaid)
│   │   ├── cpa/                 # CPA & Tax Practice Portal
│   │   ├── giving/              # Non-profit & Endowments Giving Portal
│   │   ├── legal/               # Family Law Forensics, Terms of Service, Privacy
│   │   ├── onboarding/          # Consumer & Advisor Onboarding Wizards
│   │   ├── public/              # Zero-auth viral lead generation tools
│   │   ├── syndicates/          # Venture Syndicates & SPV Cap Table OS
│   │   ├── treasury/            # Corporate Treasury & CFO Sentinel
│   │   └── work/                # FinAgent for Work & R&D Tax Credits
│   └── services/                # API Client Services (Gemini, PDF, Market Data)
│
└── server/                      # Backend API Server Source
    ├── index.js                 # Express server bootstrap (Port 3001)
    ├── package.json             # Server dependencies
    ├── .env                     # Server API keys & credentials
    ├── db/
    │   └── database.js          # SQLite WAL & Supabase PostgreSQL dual persistence
    └── routes/                  # API Route Controllers
        ├── advisorAdmin.js      # Recommendations, client onboarding, & audit log
        ├── corporateTreasury.js # Runway burn, FDIC sweep, & T-Bill ladders
        ├── syndicateAdmin.js    # SPVs, capital calls, & waterfall math
        ├── charitableGiving.js  # Stock donations & UPMIFA compliance
        ├── familyLawForensics.js# Forensic audit & divorce split engine
        ├── embeddedWealthSDK.js # White-label config & sweep rules
        ├── ai.js                # Gemini proxy
        ├── cashflow.js          # Bank statement vision extractor
        ├── email.js             # Resend email dispatcher
        ├── market.js            # Stock quotes & indices caching
        ├── plaidGateway.js      # Plaid Sandbox gateway
        └── razorpayWebhook.js   # Payment processing webhooks
```

---

## 8. Getting Started & Local Setup

### Prerequisites
- **Node.js**: `v18.0.0` or higher (Node.js 20+ or 24 recommended)
- **npm**: `v9.0.0` or higher
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/adityachowdhuryin/Finagent.git
cd Finagent
```

### 2. Install Dependencies
Install dependencies for both frontend and backend:
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 3. Environment Variables Configuration

#### Frontend (`.env.local` in project root):
```env
VITE_FIREBASE_API_KEY=AIzaSyC0qLfWDS_TCpqAez2a1MM6QSkIyz-l0Q0
VITE_FIREBASE_AUTH_DOMAIN=finagent-4a4d6.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=finagent-4a4d6
VITE_FIREBASE_STORAGE_BUCKET=finagent-4a4d6.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=560826437698
VITE_FIREBASE_APP_ID=1:560826437698:web:b9052c57c8aa64b472dddb
VITE_FIREBASE_MEASUREMENT_ID=G-18BE014LGS
VITE_API_BASE_URL=http://localhost:3001
VITE_RAZORPAY_KEY_ID=rzp_test_TcfvVFCNf0FiEC
VITE_DEV_MODE=true
```

#### Backend (`server/.env` in `server/` directory):
```env
PORT=3001
GEMINI_API_KEY=your_gemini_api_key_here
NEWS_API_KEY=your_news_api_key_here
RESEND_API_KEY=your_resend_api_key_here
DATABASE_URL=postgresql://postgres.xxx:xxx@aws-0-ap-south-1.pooler.supabase.com:6543/postgres

# Alpaca Paper Trading Credentials ($100k Sandbox)
ALPACA_API_KEY=your_alpaca_key
ALPACA_SECRET_KEY=your_alpaca_secret
ALPACA_ENDPOINT=https://paper-api.alpaca.markets

# Plaid Sandbox Credentials
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox
```

### 4. Run the Application
Run both the Vite frontend and Express server concurrently:
```bash
npm run dev
```

The app will be available at:
- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API Server**: [http://localhost:3001](http://localhost:3001)

### 5. Production Build Verification
To compile and verify the production bundle:
```bash
npm run build
```

---

## 9. Mobile App Setup (iOS & Android)

FinAgent is configured with [Capacitor](https://capacitorjs.com/) for native mobile deployment.

### Quick Commands:
```bash
# 1. Compile web assets and sync native projects
npm run build && npx cap sync

# 2. Open in Xcode (macOS only)
npx cap open ios

# 3. Open in Android Studio
npx cap open android

# 4. Run directly on connected Android device
npx cap run android

# 5. Run on iOS Simulator
npx cap run ios
```

For full details on code signing, app icons, and publishing, see [`MOBILE_BUILD.md`](./MOBILE_BUILD.md).

---

## 10. Cloud Deployment Guide

### Deploy Frontend to Vercel ($0 Free Tier)
1. Push your changes to GitHub.
2. Sign in to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import `adityachowdhuryin/Finagent`.
4. Set Build Settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variables from `.env.local` (set `VITE_API_BASE_URL` to your production backend URL).
6. Click **Deploy**. Vercel will honor `vercel.json` for client-side routing.

### Deploy Backend to Render ($0 Free Tier)
1. Sign in to [Render](https://render.com/) and select **New Web Service**.
2. Connect your GitHub repository.
3. Configure settings:
   - **Root Directory**: `server`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
4. Add all environment variables from `server/.env`.
5. Deploy and copy your Render URL (e.g. `https://finagent-api.onrender.com`).

---

## 11. Regulatory Compliance & Security Architecture

- **SEBI (Investment Advisers) Regulations, 2013**: Fiduciary dispatches enforce mandatory risk profiling, digital Investment Policy Statement (IPS) agreements, and immutable audit logs with SHA-256 integrity hashes.
- **SEC Investment Advisers Act of 1940**: Fiduciary sign-offs with statutory disclaimers for all US asset recommendations.
- **Digital Personal Data Protection (DPDP) Act, 2023 & GDPR**: User privacy options including full account deletion and zero tracking of unauthenticated sessions.
- **Zero-Knowledge Encryption**: Financial vault files and records are secured client-side using PBKDF2 with 100,000 iterations and AES-GCM-256 bit keys.

---

## 👥 Contributors & Support

- **Repository**: [https://github.com/adityachowdhuryin/Finagent](https://github.com/adityachowdhuryin/Finagent)
- **Author**: Aditya Chowdhury
- **Contact / Legal**: `legal@finagent.app`

---

*FinAgent Technologies is an autonomous financial technology platform. Content and AI outputs are for educational and informational purposes. Consult certified financial advisors before executing capital allocations.*
