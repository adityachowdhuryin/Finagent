# FinAgent — The Autonomous Multi-Market Financial Operating System

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![SQLite](https://img.shields.io/badge/SQLite-WAL%20Persistence-003B57?logo=sqlite&logoColor=white)](https://sqlite.org/)
[![Google Gemini](https://img.shields.io/badge/AI-Gemini%202.0%20Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Capacitor](https://img.shields.io/badge/Mobile-iOS%20%7C%20Android-119EFF?logo=capacitor&logoColor=white)](https://capacitorjs.com/)
[![SEBI Compliance](https://img.shields.io/badge/SEBI-RIA%20INA000014523-blue)](https://www.sebi.gov.in/)
[![CBDT AY 2026-27](https://img.shields.io/badge/CBDT-ITR--2%20AY%202026--27-emerald)](https://www.incometax.gov.in/)
[![IRS MeF v2026](https://img.shields.io/badge/IRS-MeF%20v2026.1-red)](https://www.irs.gov/)
[![Tests Passing](https://img.shields.io/badge/Tests-119%2F119%20Pass%20(100%25)-success)](./tests)
[![GitHub](https://img.shields.io/badge/GitHub-adityachowdhuryin%2FFinagent-181717?logo=github&logoColor=white)](https://github.com/adityachowdhuryin/Finagent)

> **FinAgent** is an institutional-grade, venture-scale, AI-native Financial Operating System architected for dual-market operation (**🇺🇸 United States** & **🇮🇳 India**). It provides unified financial infrastructure for retail investors, high-net-worth families, Registered Investment Advisors (SEBI RIAs / SEC RIAs), CPAs, Chartered Accountants (CAs), corporate treasurers, venture syndicates, non-profit endowments, matrimonial attorneys, and regional commercial banks.

---

## 📑 Table of Contents
1. [Executive Overview & Vision](#1-executive-overview--vision)
2. [Dual-Market Macroeconomic Architecture](#2-dual-market-macroeconomic-architecture)
3. [The Core Ecosystem Portals & Personas](#3-the-core-ecosystem-portals--personas)
4. [Deep Dive: Frontier Platforms & Statutory Engines](#4-deep-dive-frontier-platforms--statutory-engines)
   - [4.1 Tax & Forensic Studio: Dual-Market Institutional Engine (`/app/tax`)](#41-tax--forensic-studio-dual-market-institutional-engine-apptax)
   - [4.2 Commercial Monetization & AI Defensibility Moats](#42-commercial-monetization--ai-defensibility-moats)
   - [4.3 Universal US 50-State, Territories & Expatriate Relief Engine](#43-universal-us-50-state-territories--expatriate-relief-engine)
   - [4.4 Direct Indexing & Custom Factor Tilt Studio (`/app/direct-indexing`)](#44-direct-indexing--custom-factor-tilt-studio-appdirect-indexing)
   - [4.5 Direct Government Tax E-Filing Rails & AIS / TIS Reconciler (`/app/e-file`)](#45-direct-government-tax-e-filing-rails--ais--tis-reconciler-appe-file)
   - [4.6 SEBI RIA & SEC RIA Fiduciary Practice Management (`/advisor`)](#46-sebi-ria--sec-ria-fiduciary-practice-management-advisor)
   - [4.7 Legally-Binding Estate Succession & Living Trust Hubs (`/app/digital-will`, `/app/us/trust`)](#47-legally-binding-estate-succession--living-trust-hubs-appdigital-will-appustrust)
   - [4.8 Forensic Portfolio X-Ray & Fee Leakage Auditor (`/app/forensic-audit`, `/app/xray`)](#48-forensic-portfolio-x-ray--fee-leakage-auditor-appforensic-audit-appxray)
   - [4.9 Multi-PAN Family Office Hub & Dead Man's Emergency Vault (`/app/family-hub`, `/app/emergency-vault`)](#49-multi-pan-family-office-hub--dead-mans-emergency-vault-appfamily-hub-appemergency-vault)
   - [4.10 HUF Statutory Tax Studio & S-Corp FICA Arbitrage (`/app/huf-studio`, `/app/us/scorp`)](#410-huf-statutory-tax-studio--s-corp-fica-arbitrage-apphuf-studio-appusscorp)
   - [4.11 Bank Fee & Loan Repricing / Mortgage Refi Engine (`/app/loan`, `/app/us/mortgage`)](#411-bank-fee--loan-repricing--mortgage-refi-engine-apploan-appusmortgage)
   - [4.12 Agentic AI Council & Frontier Intelligence Suite (`/app/council`, `/app/live-banker`, `/app/life-twin`)](#412-agentic-ai-council--frontier-intelligence-suite-appcouncil-applive-banker-applife-twin)
5. [Deep Dive: Frontier AI Copilot Chatbot Architecture](#5-deep-dive-frontier-ai-copilot-chatbot-architecture)
   - [5.1 Dual-Topology AI Advisory System](#51-dual-topology-ai-advisory-system)
   - [5.2 Dynamic Context-Aware Route Introspection & Page Profiling](#52-dynamic-context-aware-route-introspection--page-profiling)
   - [5.3 Autonomous Proactive Wealth Monitor & Event-Driven Alerts](#53-autonomous-proactive-wealth-monitor--event-driven-alerts)
   - [5.4 Long-Term Memory Knowledge Graph & Financial DNA Archetypes](#54-long-term-memory-knowledge-graph--financial-dna-archetypes)
   - [5.5 Emotional Panic-Selling Intervention Protocol](#55-emotional-panic-selling-intervention-protocol)
   - [5.6 Bidirectional Voice System (Web Speech API)](#56-bidirectional-voice-system-web-speech-api)
   - [5.7 Multimodal Vision & In-Chat Document OCR](#57-multimodal-vision--in-chat-document-ocr)
   - [5.8 Interactive Executable In-Chat Action Cards](#58-interactive-executable-in-chat-action-cards)
   - [5.9 Gemini Function-Calling Tool Declarations](#59-gemini-function-calling-tool-declarations)
   - [5.10 Fiduciary Audit Logging & Regulatory Supervision](#510-fiduciary-audit-logging--regulatory-supervision)
6. [Deep Dive: Consumer Wealth, Behavioral & Life Engines](#6-deep-dive-consumer-wealth-behavioral--life-engines)
   - [6.1 Portfolio Doctor (`/app/doctor`)](#61-portfolio-doctor-appdoctor)
   - [6.2 Life Event Re-Architect (`/app/life-events`)](#62-life-event-re-architect-applife-events)
   - [6.3 SIP & Inflow Optimizer (`/app/sip-optimizer`)](#63-sip--inflow-optimizer-appsip-optimizer)
   - [6.4 WhatsApp AI Assistant (`/app/whatsapp`)](#64-whatsapp-ai-assistant-appwhatsapp)
   - [6.5 Document Intelligence OCR (`/app/documents`)](#65-document-intelligence-ocr-appdocuments)
   - [6.6 Credit Score Sentinel & Bureau Dispute Generator (`/app/credit`)](#66-credit-score-sentinel--bureau-dispute-generator-appcredit)
   - [6.7 Credit Card & Points Maximizer (`/app/card-optimizer`, `/app/us-cards`)](#67-credit-card--points-maximizer-appcard-optimizer-appus-cards)
   - [6.8 ESOP & RSU Equity OS (`/app/esop-rsu`, `/app/equity-os`)](#68-esop--rsu-equity-os-appesop-rsu-appequity-os)
   - [6.9 Couple Pre-Nup & Wealth Alignment (`/app/prenup`)](#69-couple-pre-nup--wealth-alignment-appprenup)
   - [6.10 Financial DNA & Psychometrics (`/app/dna`)](#610-financial-dna--psychometrics-appdna)
   - [6.11 Peer Leagues & Blind Demographic Cohorts (`/app/peers`, `/app/cohorts`)](#611-peer-leagues--blind-demographic-cohorts-apppeers-appcohorts)
   - [6.12 Real Estate Automated Valuation Model (AVM) (`/app/real-estate-avm`)](#612-real-estate-automated-valuation-model-avm-appreal-estate-avm)
   - [6.13 Private Equity & 409A Cap Table (`/app/private-equity`)](#613-private-equity--409a-cap-table-appprivate-equity)
   - [6.14 Residency Tax Arbitrage (`/app/residency-arbitrage`)](#614-residency-tax-arbitrage-appresidency-arbitrage)
   - [6.15 Micro-Invest Round-Ups (`/app/roundups`)](#615-micro-invest-round-ups-approundups)
   - [6.16 Insurance Decoder & HLV Calculator (`/app/insurance`)](#616-insurance-decoder--hlv-calculator-appinsurance)
   - [6.17 FIRE Calculator & Safe Withdrawal Rate Modeler (`/app/fire`)](#617-fire-calculator--safe-withdrawal-rate-modeler-appfire)
   - [6.18 Cashflow & Statement Vision (`/app/cashflow`)](#618-cashflow--statement-vision-appcashflow)
   - [6.19 Government Schemes & Sovereign Wealth (`/app/govt-schemes`)](#619-government-schemes--sovereign-wealth-appgovt-schemes)
   - [6.20 FinAgent Black Sovereign VIP Wealth Portal (`/app/black`)](#620-finagent-black-sovereign-vip-wealth-portal-appblack)
7. [Deep Dive: Zero-Auth Viral Lead-Magnet Tools (`/tools/*`)](#7-deep-dive-zero-auth-viral-lead-magnet-tools-tools)
   - [7.1 CTC Tax Leak Calculator (`/tools/ctc-tax-leak`)](#71-ctc-tax-leak-calculator-toolsctc-tax-leak)
   - [7.2 Loan Arbitrage Calculator (`/tools/loan-arbitrage`)](#72-loan-arbitrage-calculator-toolsloan-arbitrage)
   - [7.3 US W-2 Tax Drag Calculator (`/tools/w2-tax-leak`)](#73-us-w-2-tax-drag-calculator-toolsw2-tax-leak)
   - [7.4 PMI Removal & Refi Calculator (`/tools/pmi-arbitrage`)](#74-pmi-removal--refi-calculator-toolspmi-arbitrage)
   - [7.5 Comprehensive Wealth Diagnostic (`/tools/wealth-leak`)](#75-comprehensive-wealth-diagnostic-toolswealth-leak)
8. [Deep Dive: Wealth Advisor OS Operational Depth (`/advisor/*`)](#8-deep-dive-wealth-advisor-os-operational-depth-advisor)
   - [8.1 Client Book & AUM Matrix (`/advisor/clients`)](#81-client-book--aum-matrix-advisorclients)
   - [8.2 Client Profile & Statutory IPS Builder (`/advisor/clients/:clientId`)](#82-client-profile--statutory-ips-builder-advisorclientsclientid)
   - [8.3 Fiduciary Recommendation Queue & Order Bridging (`/advisor/recommendations`)](#83-fiduciary-recommendation-queue--order-bridging-advisorrecommendations)
   - [8.4 Five-Year Regulatory Audit Trail & SEBI Form B Dossier (`/advisor/audit`)](#84-five-year-regulatory-audit-trail--sebi-form-b-dossier-advisoraudit)
   - [8.5 Digital Client Onboarding Flow (`/advisor/onboarding`)](#85-digital-client-onboarding-flow-advisoronboarding)
   - [8.6 AI Pre-Meeting Briefing Dossiers (`/advisor/meeting-prep`)](#86-ai-pre-meeting-briefing-dossiers-advisormeeting-prep)
   - [8.7 Quarterly Fiduciary Report Cards (`/advisor/report-cards`)](#87-quarterly-fiduciary-report-cards-advisorreport-cards)
   - [8.8 Compliance Watchdog & Drift Monitor (`/advisor/compliance`)](#88-compliance-watchdog--drift-monitor-advisorcompliance)
   - [8.9 Model Portfolios & Rebalancing Templates (`/advisor/models`)](#89-model-portfolios--rebalancing-templates-advisormodels)
   - [8.10 AUM Revenue Analytics & Fee Billing (`/advisor/aum`)](#810-aum-revenue-analytics--fee-billing-advisoraum)
   - [8.11 SEC Rule 204-2 Books & Records Watchdog (`/advisor/us/compliance`)](#811-sec-rule-204-2-books--records-watchdog-advisoruscompliance)
9. [Deep Dive: Institutional & Enterprise B2B Portals](#9-deep-dive-institutional--enterprise-b2b-portals)
   - [9.1 Corporate Treasury & CFO Yield Sentinel (`/treasury`)](#91-corporate-treasury--cfo-yield-sentinel-treasury)
   - [9.2 Venture Syndicates, SPVs & Cap Table OS (`/syndicates`)](#92-venture-syndicates-spvs--cap-table-os-syndicates)
   - [9.3 FinAgent for Work & R&D Tax Credits (`/work`)](#93-finagent-for-work--rd-tax-credits-work)
   - [9.4 Non-Profit Endowments & Stock Giving Portal (`/giving`)](#94-non-profit-endowments--stock-giving-portal-giving)
   - [9.5 Family Law, Divorce & Forensic Discovery (`/divorce`)](#95-family-law-divorce--forensic-discovery-divorce)
   - [9.6 White-Label Bank Embedded Wealth SDK (`/bank-embed`)](#96-white-label-bank-embedded-wealth-sdk-bank-embed)
   - [9.7 B2B CPA & CA Practice Portal (`/cpa` & Practice Mode)](#97-b2b-cpa--ca-practice-portal-cpa--practice-mode)
10. [Statutory Vector PDF Engine (12+ Institutional Documents)](#10-statutory-vector-pdf-engine-12-institutional-documents)
11. [Complete Route Catalog (100+ Routes)](#11-complete-route-catalog-100-routes)
12. [System Architecture & End-to-End Data Flows](#12-system-architecture--end-to-end-data-flows)
13. [Technology Stack & Third-Party Integrations](#13-technology-stack--third-party-integrations)
14. [Repository Directory Structure](#14-repository-directory-structure)
15. [Automated Verification & Test Suites (119/119 Tests)](#15-automated-verification--test-suites-119119-tests)
16. [Getting Started & Local Setup](#16-getting-started--local-setup)
17. [Mobile App Setup (Capacitor iOS & Android)](#17-mobile-app-setup-capacitor-ios--android)
18. [Cloud Deployment Guide (Vercel & Render)](#18-cloud-deployment-guide-vercel--render)
19. [Regulatory Compliance & Security Architecture](#19-regulatory-compliance--security-architecture)

---

## 1. Executive Overview & Vision

Personal and institutional finance has long suffered from severe fragmentation across retail banks, brokerages, manual spreadsheets, PDFs, and disconnected advisors. In the age of commoditized generative AI chatbots (ChatGPT, Claude, Gemini), conversational interfaces can answer generic questions but fail on **fiduciary liability, legal audit defense, multi-year state persistence, client-side zero-knowledge privacy, and last-mile government filing rails**.

**FinAgent** bridges this divide by functioning as a high-conviction, deterministic, statutory system of record. It combines algorithmic tax-loss harvesting, multi-jurisdiction tax return compilation, fiduciary RIA execution, corporate treasury sweeps, venture syndication, and client-side cryptographic vaults into a single real-time platform.

### Core Value Drivers:
- **Consumer Wealth Multiplier**: Real-time aggregation across equities, mutual funds, fixed deposits, EPF/PPF, physical/digital gold, real estate, and crypto with autonomous fee leakage elimination.
- **Enterprise & B2B Monetization**: Generates **$25,000 to $250,000+ Annual Contract Value (ACV)** across corporate treasury sweeps, venture syndicate formation, non-profit stock donation widgets, matrimonial forensic discovery, and white-label bank SDK licensing.
- **B2B CPA & CA Practice Suite**: Practice portal for accounting firms ($99/seat/month) with batch client linting, manifest CSV exports, and shareable client intake links.
- **Dual Regulatory Compliance**: Dual regulatory engines adhering to both **SEBI (Investment Advisers) Regulations, 2013** (Registration No. `INA000014523`, BASL `BASL-1842`) and the **U.S. SEC Investment Advisers Act of 1940**.
- **Statutory E-Filing Rails**: Direct compilation conforming to India **CBDT e-Filing JSON Schema AY 2026-27** (Finance Act 2024 revised rates) and **IRS Modernized e-File (MeF) Release 2026v1.0 XML**.

---

## 2. Dual-Market Macroeconomic Architecture

FinAgent features runtime switching between two macroeconomic jurisdictions and three distinct user experience tiers:

```mermaid
flowchart TD
    subgraph Market_Toggle["Dual-Market Macroeconomic Engines"]
        IN["🇮🇳 India Mode (INR ₹)<br/>SEBI RIA, Nifty 50, CAMS/NSDL CAS, EPF/PPF, Sec 80C/112A/111A, HUF Tax Studio, AIS/TIS Matrix, Schedule FA"]
        US["🇺🇸 US Mode (USD $)<br/>SEC RIA, S&P 500, Plaid, 401(k), IRC § 1040/Schedule D/8949, 50 States + Territories, Living Trusts, FBAR Form 114"]
    end

    subgraph Experience_Tiers["Experience Tiers"]
        E1["Essential (Clean, distraction-free portfolio tracker)"]
        E2["Pro (Advanced analytics, tax harvesters, AI council)"]
        E3["Sovereign / Black VIP (Concierge banking, ZK vault, direct indexing)"]
    end

    Market_Toggle --> Experience_Tiers
```

- **🇮🇳 India Engine**: Handles CAMS/NSDL CAS PDF parsing, EPF/PPF calculation, Old vs. New tax regime comparisons, Capital Gains Section 112A (12.5% > ₹1.25L) & 111A (20%), Sovereign Gold Bonds (SGB), Hindu Undivided Family (HUF) tax shields, Schedule FA foreign asset reporting with Rule 115 SBI TT rates, and RBI Treasury bills.
- **🇺🇸 US Engine**: Handles Plaid bank sync, W-2 tax optimization, 401(k) fee auditing, IRS 30-day wash-sale harvesting with proxy ETFs, S-Corp reasonable compensation FICA arbitrage, PTET SALT workarounds, Revocable Living Trusts, 50-State + Territory calculations (Puerto Rico Act 60, USVI, Guam), and FBAR/FATCA cross-border compliance.

---

## 3. The Core Ecosystem Portals & Personas

FinAgent provides purpose-built interfaces tailored to each stakeholder in the financial ecosystem:

1. **📈 Personal Wealth Cockpit (`/app`)**: Net worth tracking, 0–100 health scoring, tax harvesting, direct indexing, and autonomous execution.
2. **👑 FinAgent Black Sovereign VIP Hub (`/app/black`)**: Reserved for $5M+ net worth individuals with bespoke allocations, ZK escrow, and concierge banker access.
3. **👔 Wealth Advisor OS (`/advisor`)**: SEBI RIA & SEC RIA practice management with IPS builders, 1-click order co-signing, and 5-year immutable audit ledgers.
4. **🏦 Corporate Treasury & CFO Yield Sentinel (`/treasury`)**: Dynamic burn monitoring, $150M+ extended FDIC/DICGC cash sweeps, and dual-market T-Bill yield ladders.
5. **🤝 Venture Syndicates, SPVs & Cap Table OS (`/syndicates`)**: Capital calls, European/American distribution waterfalls, carried interest, and K-1/Form 64D tax packages.
6. **🏛️ Non-Profits, Endowments & Stock Giving (`/giving`)**: Zero-tax appreciated stock donation widgets, embeddable donation snippets, and UPMIFA spending monitors.
7. **⚖️ Family Law, Divorce & Forensic Discovery (`/divorce`)**: AI forensic statement audits, 50/50 community property division, and QDRO retirement plan splitting.
8. **🌐 White-Label Bank Embedded Wealth SDK (`/bank-embed`)**: Configurable embeddable wealth widgets for regional banks, credit unions, and fintech neobanks.
9. **💼 CPA & Tax Practice Portal (`/cpa` & `/app/tax` Practice Mode)**: Multi-client practice suite with batch Form 8949 / Schedule D generation and 28-rule batch linting.

---

## 4. Deep Dive: Frontier Platforms & Statutory Engines

### 4.1 Tax & Forensic Studio: Dual-Market Institutional Engine (`/app/tax`)
A unified command center bridging US & India tax strategies across 11 integrated modules:
1. **Overview & Executive Strategy**: Real-time dynamic ROI counter, Tax Alpha breakdown, and interactive Recharts visualizations.
2. **Direct Document Ingestion**: Client-side parsing of CAMS/NSDL CAS PDFs, Form 16 Part A/B, 1099-B, and W-2s with zero server-side PII retention.
3. **Regime & Brackets**: Progressive bracket step visualizer comparing Section 115BAC New Regime vs. Old Regime with Chapter VI-A deductions, alongside Federal and 50-state tax curves.
4. **Tax-Loss Harvesting**: Waterfall optimizer applying Finance Act 2024 revised rates (12.5% LTCG, 20% STCG) and US IRC § 1211(b) $3,000 ordinary loss offset limits.
5. **Entity & Restructuring**: S-Corp Reasonable Comp FICA savings (IRC § 1366 / Rev. Rul. 74-44), PTET SALT workarounds (CA AB 150 / NY Article 24-A), and Indian HUF separate PAN arbitrage.
6. **Loss Carryforward Vault**: Multi-year loss tracking under India Section 74 (8-year expiration ledger) and US IRC § 1211/1212 (indefinite carryforward, Form 8801 AMT credits, Form 1116 FTC).
7. **Scenario Sandbox**: Side-by-side what-if modeler simulating interstate relocation (California to Texas), Puerto Rico Act 60 decree incentives, and compensation restructurings.
8. **Forensic Fee Audit & Switcher**: Regular-to-Direct mutual fund switch engine, SEC Rule 12b-1 drag elimination, and NACHA/NPCI zombie auto-debit plugger.
9. **Statutory Penalty Defense**: Proactive defense matrices for Schedule FA Foreign Assets (Black Money Act 2015 Sec 43), Form 8606 Backdoor Roth Pro-Rata Trap (IRC § 408(d)(2)), FinCEN BOI ($591/day statutory cap), and FBAR Form 114 ($10k threshold).
10. **E-Filing & Transmission Gateway**: Direct compilation of CBDT JSON AY 2026-27 and IRS MeF XML v2026.1 with automated 28-point statutory pre-flight validation.
11. **Workpapers & Fiduciary Sign-Off**: Compilation of the 12-Page Institutional Audit Binder PDF with SHA-256 seal and Circular 230 / Section 288 attestation blocks.

---

### 4.2 Commercial Monetization & AI Defensibility Moats

| LLM Commoditization Weakness | FinAgent Commercial Moat | Implementation |
| :--- | :--- | :--- |
| **Fiduciary Liability & Audit Defense**<br>Public LLMs disclaim all legal & tax liability ("Not tax advice"). | **Audit-Proof Workpapers with Fiduciary Sign-Off**<br>Legally binding Circular 230 / Section 288 certified workpapers. | [`src/utils/institutionalTaxBinderPdf.js`](file:///Users/adityachowdhury/Downloads/Fin/src/utils/institutionalTaxBinderPdf.js) |
| **Data Privacy & Corporate IP Security**<br>Public LLMs log prompts and ingest PII to train frontier models. | **Zero-Knowledge Privacy Vault**<br>Client-side ephemeral RAM parsing; zero raw SSN/PAN/W-2 storage; 1-click on-screen PII redaction. | [`src/components/tax/ZeroKnowledgePrivacyVault.jsx`](file:///Users/adityachowdhury/Downloads/Fin/src/components/tax/ZeroKnowledgePrivacyVault.jsx) |
| **Manual Data Entry & Formatting Fatigue**<br>Users refuse to copy-paste 40-page PDF broker statements or tax lots. | **1-Click Broker & Payroll Auto-Sync**<br>Direct API & simulated OAuth ledger connectors for Schwab, Fidelity, ADP, Zerodha, Groww, CAMS. | [`src/components/tax/DirectBrokerPayrollSyncModal.jsx`](file:///Users/adityachowdhury/Downloads/Fin/src/components/tax/DirectBrokerPayrollSyncModal.jsx) |
| **Stateless Execution & Loss Expiry**<br>Chatbots have no state; they cannot track multi-year loss carryover banks. | **Persistent Statutory Vault & Tax Alpha Engine**<br>8-year Sec 74 loss ledger, $3k ordinary loss offset tracker, S-Corp FICA & PTET models. | [`src/context/TaxStudioContext.jsx`](file:///Users/adityachowdhury/Downloads/Fin/src/context/TaxStudioContext.jsx) |
| **Last-Mile Filing Gateways**<br>Chatbots cannot transmit IRS MeF XML or CBDT JSON schemas. | **Electronic Transmission & Schema Linting**<br>28-rule automated validation & direct e-filing pipeline. | [`src/pages/consumer/us/US1040EFilingStudio.jsx`](file:///Users/adityachowdhury/Downloads/Fin/src/pages/consumer/us/US1040EFilingStudio.jsx) |
| **Accountant Workflow Friction**<br>Individual tools do not scale for accounting firms and CPAs. | **B2B CPA & CA Practice Mode**<br>Multi-client batch management, cross-client linter, and firm-branded intake portals (\$99/mo/seat). | [`src/components/tax/CpaPracticePortal.jsx`](file:///Users/adityachowdhury/Downloads/Fin/src/components/tax/CpaPracticePortal.jsx) |

- **Executive Value-Gated Paywall (`TaxExecutionPaywallModal.jsx`)**: Free diagnostic scans with execution actions gated behind a dynamic ROI display (**61.6x – 83.2x ROI**) and a strict **3x ROI Money-Back Guarantee** ($299–$599 US / ₹7,999–₹14,999 IN). Includes a **VIP Demo Access** button for instantaneous testing.

---

### 4.3 Universal US 50-State, Territories & Expatriate Relief Engine
Covers all 50 US States + DC + 5 Overseas Territories and international expats:
- **Zero-Tax Jurisdictions**: Alaska, Florida, Nevada, New Hampshire, South Dakota, Tennessee, Texas, Wyoming, Washington ($0 wage tax, 7% on long-term capital gains above $250,000).
- **Flat-Tax Jurisdictions**: Arizona (2.50%), Colorado (4.40%), Georgia (5.39%), Idaho (5.695%), Illinois (4.95%), Indiana (3.05%), Kentucky (4.00%), Michigan (4.25%), Mississippi (4.70%), North Carolina (4.50%), Pennsylvania (3.07%), Utah (4.55%).
- **Progressive High-Tax States**: California (up to 13.3% + 1.2% uncapped SDI), New York (State brackets up to 10.9% + NYC local tax up to 3.876%), Massachusetts (5% base + 4% Fair Share surtax above $1,000,000), Hawaii (up to 11.0%), New Jersey (up to 10.75%).
- **US Overseas Territories (IRC §§ 931–935)**:
  - **Puerto Rico (PR)**: IRC § 933 bona fide resident exclusion from US federal taxation on PR-source income; Act 60 decree provides **0% capital gains tax** and 4% corporate rate.
  - **U.S. Virgin Islands (VI)**: IRC § 932 mirror code where filing Form 1040 with the VI Bureau of Internal Revenue satisfies US federal filing obligations.
  - **Guam (GU) & CNMI (MP)**: IRC § 935 single mirror return filing.
  - **American Samoa (AS)**: IRC § 931 non-mirror territorial source exclusion.
- **US Expatriates Engine**:
  - **Form 2555 Foreign Earned Income Exclusion (FEIE)**: 330-day Physical Presence Test and Bona Fide Residence Test with 2026 statutory cap ($130,000).
  - **Form 1116 Foreign Tax Credit (FTC)**: Limitation calculations and 10-year excess credit carryforwards.
  - **Dual-Optimizer**: Automatically recommends FEIE vs. FTC based on foreign host-country tax rates (e.g. FEIE for Dubai/UAE; FTC for Germany/UK).
- **Universal 50-State LLC Formation**: Statutorily compliant LLC Operating Agreements and Corporate Banking Resolutions citing governing acts across all 50 states (e.g. Del. Code tit. 6, Tex. Bus. Orgs. Code, Cal. Corp. Code).

---

### 4.4 Direct Indexing & Custom Factor Tilt Studio (`/app/direct-indexing`)
- **Factor Tilt Sliders**: Interactive controls for **Momentum** (52W high proximity, 6M alpha), **Quality** (Return on Equity, low leverage), and **Low Volatility** (Beta < 0.85).
- **Dynamic Risk Math**: Calculates active constituent weights, tracking error ($\Delta \text{TE}$), and projected excess alpha against Nifty 50 TRI or S&P 500 benchmarks.
- **Constituent Lot Harvester**: Scans individual stock lots for unrealized losses and executes 31-day sector ETF proxy swaps (e.g. INFY $\rightarrow$ NIFTYIT) to bank tax loss without breaking sector beta.
- **25 bps Wrap Fee Covenant**: Models 0.25% p.a. wrap fees debited quarterly in arrears at 6.25 bps, delivering $>85\%$ net client surplus over active mutual funds.
- **Direct Indexing Charter PDF**: One-click download of the complete institutional operating charter via [`buildDirectIndexingCharterPDF`](file:///Users/adityachowdhury/Downloads/Fin/src/utils/fiduciaryPdfBuilder.js).

---

### 4.5 Direct Government Tax E-Filing Rails & AIS / TIS Reconciler (`/app/e-file`)
- **AY 2026-27 CBDT JSON Schema**: Targets Finance Act 2024 post-July 23 rules: Section 112A LTCG at **12.5%** with ₹1,25,000 autonomous exemption, Section 111A STCG at **20%**, Schedule Salary standard deduction of ₹75,000 u/s 16(ia) under New Regime (Sec 115BAC), and quarterly capital gains apportionment for Section 234C interest waiver.
- **AIS / TIS Discrepancy Matrix**: Side-by-side reconciliation across 7 reporting sources (Employer Form 16 u/s 192, RTA Form 194 Dividend, Bank SFT-005 Savings Interest, Bank 194A FD Interest, CAMS/KFintech SFT-006 Mutual Fund sales, Zerodha SFT-017 share trades).
- **1-Click Auto-Align Discrepancies**: Automatically synchronizes declared income with AIS figures to eliminate Section 143(1)(a) automated adjustment notices.
- **28-Point Pre-Flight Statutory Linter**: Audits 28 statutory rules across Personal, Capital Gains, Deductions, and Statutory Heads with 100% compliance pass validation.
- **Official Computation Statement PDF**: Generates the certified Computation of Total Income (Form ITR-2 / ITR-3) with Part B-TI, Part B-TT, and AIS DIN seal via [`buildITRComputationStatementPDF`](file:///Users/adityachowdhury/Downloads/Fin/src/utils/fiduciaryPdfBuilder.js).

---

### 4.6 SEBI RIA & SEC RIA Fiduciary Practice Management (`/advisor`)
- **Statutory IPS Tab (`/advisor/clients/:clientId`)**: Implements SEBI Regulation 17 / SEC suitability requirements with horizon, return hurdles, strategic asset allocation bands, and ESG negative screening.
- **Bilateral Statutory IPS PDF**: One-click download of the formal RIA Investment Policy Statement via [`buildClientIPSPDF`](file:///Users/adityachowdhury/Downloads/Fin/src/utils/fiduciaryPdfBuilder.js).
- **Fiduciary Co-Signing & Order Bridging (`/advisor/recommendations`)**: Advisors review recommendations and click **"⚡ SEBI RIA Co-Sign & Bridge to Execution"**. This co-signs the order under SEBI Reg `INA000014523` and bridges it directly into [`brokerExecution.js`](file:///Users/adityachowdhury/Downloads/Fin/server/routes/brokerExecution.js) for consumer execution.
- **Compliance Dossiers**: One-click export of the regulatory inspection dossier via [`buildSEBIInspectionDossierPDF`](file:///Users/adityachowdhury/Downloads/Fin/src/utils/fiduciaryPdfBuilder.js) and SEC Form ADV Part 2A trackers.

---

### 4.7 Legally-Binding Estate Succession & Living Trust Hubs (`/app/digital-will`, `/app/us/trust`)
- **Indian Succession Act, 1925 & Hindu Succession Act, 1956**: Testamentary schedule mapping across demat accounts, mutual fund folios, real estate, physical gold, and crypto with executor appointment and dual-witness attestation.
- **US Revocable Living Trust Studio (`/app/us/trust`)**: California Probate Code / Uniform Trust Code revocable living trust deed generator, certificate of trust, and pour-over will.
- **Emergency Vault Sync**: Hashes the executed deed using SHA-256 and syncs with the Dead Man's Emergency Vault.

---

### 4.8 Forensic Portfolio X-Ray & Fee Leakage Auditor (`/app/forensic-audit`, `/app/xray`)
- **Multi-Tier Fee Detection**: Audits investment portfolios across 5 critical leakage categories: Regular vs. Direct plan expense ratio spreads (1.00% - 1.50%), high portfolio turnover drag, AMC distributor trail commissions, transaction stamp duties, and cash drag.
- **Compounded Drag Modeling**: Models the 10-year, 20-year, and 30-year future wealth loss incurred from seemingly minor 1.25% annual commission bleed.
- **Forensic X-Ray Audit PDF**: Generates the institutional audit statement with itemized scheme-level leakage and direct switch recommendations via [`buildForensicXRayAuditPDF`](file:///Users/adityachowdhury/Downloads/Fin/src/utils/fiduciaryPdfBuilder.js).

---

### 4.9 Multi-PAN Family Office Hub & Dead Man's Emergency Vault (`/app/family-hub`, `/app/emergency-vault`)
- **Multi-PAN Aggregation**: Consolidates balance sheets across individual, spouse, parent, child, and HUF PAN profiles under a unified family dashboard.
- **Inter-Family Gifting Simulator**: Models tax-free gifts under Section 56(2)(x) of the Income Tax Act among linear ascendants and descendants.
- **Dead Man's Heartbeat Protocol**: Automated 30/60/90-day inactivity monitoring. If heartbeat check-ins fail, the vault initiates multi-party cryptographic key release and dispatches emergency dossier access to designated family trustees.
- **Emergency Vault Dossier PDF**: One-click export of emergency instructions, account numbers, and nominee contacts via [`buildEmergencyVaultDossierPDF`](file:///Users/adityachowdhury/Downloads/Fin/src/utils/fiduciaryPdfBuilder.js).

---

### 4.10 HUF Statutory Tax Studio & S-Corp FICA Arbitrage (`/app/huf-studio`, `/app/us/scorp`)
- **HUF Separate Tax Entity**: Leverages Hindu Undivided Family legal entity creation under Hindu Law to claim independent basic exemptions and Section 112A capital gains exemptions, saving upwards of ₹3,00,000+ per year.
- **HUF Constitution Deed PDF**: Generates legal declaration deeds via [`buildHUFDeedPDF`](file:///Users/adityachowdhury/Downloads/Fin/src/utils/fiduciaryPdfBuilder.js).
- **S-Corp Studio (`/app/us/scorp`)**: Models IRC § 1366 pass-through taxation and RCReports-compliant reasonable compensation to shield business income from 15.3% self-employment FICA taxes (saving $10,000–$25,000+ annually). Includes Pass-Through Entity Tax (PTET) state SALT workarounds.

---

### 4.11 Bank Fee & Loan Repricing / Mortgage Refi Engine (`/app/loan`, `/app/us/mortgage`)
- **RBI Repo Rate Arbitrage**: Detects when lending institutions fail to pass on RBI External Benchmark Lending Rate (EBLR) rate cuts to floating-rate home and personal loan borrowers.
- **Formal Legal Repricing Letters**: Generates formal demand notices citing RBI Master Directions to bank nodal officers (SBI, HDFC, ICICI, Axis).
- **US Mortgage Refi Studio (`/app/us/mortgage`)**: Analyzes conventional 30-year/15-year conforming loans, FHA loans, and jumbo spreads; calculates monthly savings, amortization schedules, and break-even payoff horizons.

---

### 4.12 Agentic AI Council & Frontier Intelligence Suite (`/app/council`, `/app/live-banker`, `/app/life-twin`)
- **Agentic AI Council (`/app/council`)**: Multi-agent deliberative debate where 4 specialized AI personas (Chief Investment Officer, Conservative Tax Attorney, Aggressive Growth Strategist, and Risk Manager) debate portfolio holdings and synthesize a unanimous consensus.
- **Interactive User Challenge**: Allows the investor to inject counter-arguments or lifestyle constraints, prompting a multi-turn recalculation.
- **Gemini Live Multimodal Banker (`/app/live-banker`)**: Real-time voice and WebRTC vision banker inspecting physical documents through your device camera.
- **10,000-Run Monte Carlo Life Twin (`/app/life-twin`)**: Simulates 10,000 economic scenarios assessing retirement probability, catastrophic healthcare shocks, and real estate acquisition timing.

---

## 5. Deep Dive: Frontier AI Copilot Chatbot Architecture

FinAgent incorporates an AI advisory infrastructure designed to operate both as an autonomous consumer copilot and as a fiduciary institutional advisor assistant.

```mermaid
flowchart TD
    subgraph UI_Layer ["User Interface Access Points"]
        Sidecar["Global AI Copilot Sidecar (Cmd+J / TopBar / Mobile)<br/>AICopilotSidecar.jsx"]
        FullTerminal["Full-Page AI Wealth Terminal (/app/ai-advisor)<br/>AIAdvisor.jsx & ChatWindow.jsx"]
    end

    subgraph Intelligence_Engines ["Proactive Intelligence & Memory"]
        Proactive["Autonomous Proactive Wealth Monitor<br/>proactiveAdvisorEngine.js"]
        Memory["Long-Term Memory & Knowledge Graph<br/>copilotMemoryService.js"]
        Panic["Emotional Panic-Selling Intervention<br/>checkPanicSellingIntent()"]
    end

    subgraph Multimodal_IO ["Multimodal Input / Output"]
        Voice["Bidirectional Speech API<br/>SpeechRecognition & SpeechSynthesis"]
        Vision["Screen & Document OCR<br/>Inspect Current Screen + CAS/W-2/1099 Ingestion"]
    end

    subgraph Execution_Cards ["Interactive In-Chat Action Cards"]
        Card1["InChatBasketOrderCard (1-Click Rebalance/Harvest)"]
        Card2["InChatPrepaymentSliderCard (Dynamic Loan Slider)"]
        Card3["InChatFundCompareCard (Fund Overlap & Alpha)"]
        Card4["InChatDossierExportCard (SEBI/SEC Dossier PDF)"]
    end

    subgraph Backend_Tools ["Gemini Function Calling (copilotTools.js)"]
        Tool1["draft_basket_order"]
        Tool2["simulate_loan_prepayment"]
        Tool3["compare_mutual_funds"]
        Tool4["calculate_tax_breakdown"]
        Tool5["generate_advisor_suitability_memo"]
    end

    UI_Layer --> Intelligence_Engines
    UI_Layer --> Multimodal_IO
    Intelligence_Engines --> Execution_Cards
    Execution_Cards --> Backend_Tools
```

### 5.1 Dual-Topology AI Advisory System
1. **Full-Page AI Wealth Terminal (`/app/ai-advisor`)** ([`AIAdvisor.jsx`](file:///Users/adityachowdhury/Downloads/Fin/src/pages/consumer/AIAdvisor.jsx)):
   - Dedicated conversational workstation for in-depth financial planning.
   - Includes full conversation history preservation via [`ChatHistorySidebar.jsx`](file:///Users/adityachowdhury/Downloads/Fin/src/components/ai/ChatHistorySidebar.jsx).
   - Real-time voice interaction with visual audio waveforms ([`VoiceOrb.jsx`](file:///Users/adityachowdhury/Downloads/Fin/src/components/ai/VoiceOrb.jsx)).
   - Regulated under **SEC Rule 204-2** (CRD #319402) and **SEBI Reg 19** (`INA000014523`) with statutory disclaimers.
2. **Persistent Global Copilot Sidecar Drawer** ([`AICopilotSidecar.jsx`](file:///Users/adityachowdhury/Downloads/Fin/src/components/ai/AICopilotSidecar.jsx)):
   - Non-blocking slide-out drawer accessible anywhere across the platform using `Cmd+J` / `Ctrl+J`, the mobile bottom navigation bar, or the header bar.
   - Maintains continuous conversational state as the user navigates between portfolio, tax, and advisor views.

---

### 5.2 Dynamic Context-Aware Route Introspection & Page Profiling
The Copilot continuously introspects the user's active route and live portfolio data, dynamically tailoring its system prompt, context badge, and suggested prompt chips:
- **Investments & Portfolio (`/app/portfolio`, `/app/performance`)**: Ingests total equity count and net worth; suggests concentration risk audits and benchmark comparisons.
- **Tax & Alpha Optimization (`/app/tax`, `/app/wash-sale`)**: Ingests harvestable loss lots and active tax jurisdiction rules; suggests wash-sale proxy swaps and 115BAC vs. Old Regime simulations.
- **Loan & Debt Negotiator (`/app/loan`, `/app/mortgage-refi`)**: Ingests outstanding principal and repo rates; suggests loan reset demand letters and prepayment savings.
- **Family Office Council (`/app/council`)**: Ingests committee persona state; suggests lifestyle tradeoff debates.
- **Wealth Advisor OS (`/advisor/*`)**: Switches to **SEBI/SEC RIA Institutional Copilot**, preparing suitability memos, asset allocation drift audits, and pre-meeting client briefings.

---

### 5.3 Autonomous Proactive Wealth Monitor & Event-Driven Alerts
Implemented in [`src/services/proactiveAdvisorEngine.js`](file:///Users/adityachowdhury/Downloads/Fin/src/services/proactiveAdvisorEngine.js), the proactive engine monitors 5 event conditions, surfacing unread alert counters and action buttons:
1. **Daily Market Open Briefing (☀️)**: Simulates 9:00 AM market trends, projecting day-delta impact across user equities.
2. **Asset Allocation Drift Alert (⚖️)**: Triggers when equity/debt allocations drift $\ge 5\%$ from IPS targets, offering a 1-click rebalance shortcut.
3. **Tax-Loss Harvesting Radar (✂️)**: Scans individual lots for unrealized losses ($>\$1,000$ or $>₹8,000$) and calculates immediate tax savings.
4. **Repo Rate & Loan Spread Arbitrage (🏦)**: Identifies floating-rate loan spread discrepancies against benchmark rates.
5. **Fixed Deposit Maturity Countdown (⏳)**: Alerts the investor when bank FDs are within 14 days of maturity to prevent low-yield auto-rollovers.

---

### 5.4 Long-Term Memory Knowledge Graph & Financial DNA Archetypes
Implemented in [`src/services/copilotMemoryService.js`](file:///Users/adityachowdhury/Downloads/Fin/src/services/copilotMemoryService.js), this service persists the investor's mental model and profile across sessions:
- **Strategy & ESG Constraints**: Hard rules that the Copilot must respect (e.g. strict exclusion of tobacco and defense weapons; mandate for direct mutual funds; minimum liquid cash reserve).
- **Life Milestones & Targets**: Target retirement age, target corpus, and major planned expenses.
- **Financial DNA Traits**: Behavioral psychology scores including **Archetype** (e.g., *Strategic Compounder*), **Loss Aversion Score** (0–100 sensitivity to market dips), and **Impulse Selling Risk**.

---

### 5.5 Emotional Panic-Selling Intervention Protocol
When market volatility spikes, investors frequently make destructive emotional decisions. The Copilot contains a built-in behavioral intervention guardrail ([`checkPanicSellingIntent`](file:///Users/adityachowdhury/Downloads/Fin/src/services/copilotMemoryService.js#L66)):
- Evaluates prompts for panic language (`"sell all"`, `"dump everything"`, `"panic sell"`, `"cash out now"`, `"exit market"`).
- Automatically halts immediate order execution and presents grounding guidance:
  1. Displays the user's defined long-term Financial DNA archetype and target retirement horizon.
  2. Presents historical market data showing broad market index recoveries within 18 months.
  3. Quantifies the immediate tax cost (realizing short-term capital gains) and loss of compounded dividend income.

---

### 5.6 Bidirectional Voice System (Web Speech API)
- **Speech-to-Text Recognition**: Uses `window.SpeechRecognition` / `webkitSpeechRecognition` with locale switching (`en-US` vs. `en-IN`) for hands-free queries.
- **Text-to-Speech Audio Readouts**: Uses `window.SpeechSynthesis` (`SpeechSynthesisUtterance`) to speak back advice with regex-sanitized markdown formatting.

---

### 5.7 Multimodal Vision & In-Chat Document OCR
- **"Inspect Current Screen" Action**: Automatically captures the active page DOM state and sends it to Gemini to highlight hidden risks or unoptimized allocations.
- **In-Chat Drag-and-Drop File Upload**: Upload PDF statements, Form 16, 1099-B, W-2s, or bank statements directly into the chat for OCR parsing and portfolio ingestion.

---

### 5.8 Interactive Executable In-Chat Action Cards
Rather than generating plain text responses, the Copilot renders rich interactive React cards directly inside the conversation:
1. **[`InChatBasketOrderCard.jsx`](file:///Users/adityachowdhury/Downloads/Fin/src/components/ai/cards/InChatBasketOrderCard.jsx)**: Multi-leg order ticket for rebalancing or tax harvesting with symbol, action (BUY/SELL), quantity, price, tax impact, and a **"⚡ Bridge to 1-Click Execution"** button.
2. **[`InChatPrepaymentSliderCard.jsx`](file:///Users/adityachowdhury/Downloads/Fin/src/components/ai/cards/InChatPrepaymentSliderCard.jsx)**: Interactive slider allowing users to adjust lump-sum loan prepayments and see live interest savings and tenure reductions.
3. **[`InChatFundCompareCard.jsx`](file:///Users/adityachowdhury/Downloads/Fin/src/components/ai/cards/InChatFundCompareCard.jsx)**: Side-by-side mutual fund comparison showing 1Y/3Y/5Y CAGR, Expense Ratio (TER), Alpha, Sharpe Ratio, and Portfolio Overlap %.
4. **[`InChatDossierExportCard.jsx`](file:///Users/adityachowdhury/Downloads/Fin/src/components/ai/cards/InChatDossierExportCard.jsx)**: Summary card for advisory memos with a **"📄 Download Official PDF"** button.

---

### 5.9 Gemini Function-Calling Tool Declarations
Located in [`server/services/copilotTools.js`](file:///Users/adityachowdhury/Downloads/Fin/server/services/copilotTools.js), the backend registers structured function-calling tools with the Gemini API:
- `draft_basket_order`: Generates validated order tickets.
- `simulate_loan_prepayment`: Calculates amortization deltas and interest savings.
- `compare_mutual_funds`: Evaluates risk-adjusted returns and expense drags.
- `calculate_tax_breakdown`: Computes tax liability under Old vs. New (115BAC) regimes.
- `generate_advisor_suitability_memo`: Produces SEBI-compliant suitability documentation.

---

### 5.10 Fiduciary Audit Logging & Regulatory Supervision
Every response generated across `/app/ai-advisor` and `AICopilotSidecar` is logged in the backend database with:
- Client identifier, actor persona, and timestamp.
- Cryptographic SHA-256 digest of advice text.
- Governing regulatory citation (**SEBI Reg 19** for India; **SEC Rule 204-2** for US).

---

## 6. Deep Dive: Consumer Wealth, Behavioral & Life Engines

### 6.1 Portfolio Doctor (`/app/doctor`)
Diagnostic scanner evaluating asset health across concentration risk, liquidity buffer, insurance adequacy, and asset class overlap, generating prioritized clinical prescriptions.

### 6.2 Life Event Re-Architect (`/app/life-events`)
Interactive life planner modeling financial impacts for marriage, home purchases, career sabbaticals, parenthood, and inheritance with goal-adjusted cash flow glide paths.

### 6.3 SIP & Inflow Optimizer (`/app/sip-optimizer`)
Models Step-Up SIP schedules (e.g. 10% annual increase), analyzes date-of-month return distributions, and simulates step-down safety buffers during financial emergencies.

### 6.4 WhatsApp AI Assistant (`/app/whatsapp`)
Twilio webhook-powered mobile assistant allowing users to query net worth, log expenses, and receive morning market briefings via WhatsApp.

### 6.5 Document Intelligence OCR (`/app/documents`)
Multimodal OCR engine extracting tabular data from CAMS/NSDL CAS statements, Form 16, Bank FDs, and Insurance Policy schedules.

### 6.6 Credit Score Sentinel & Bureau Dispute Generator (`/app/credit`)
Ingests CIBIL and Experian bureau files, tracks credit utilization ratios across accounts, and drafts formal dispute letters citing statutory credit reporting standards.

### 6.7 Credit Card & Points Maximizer (`/app/card-optimizer`, `/app/us-cards`)
Optimizes reward point valuations, tracks the Chase 5/24 rule, and balances annual fees against spend multipliers and travel credits.

### 6.8 ESOP & RSU Equity OS (`/app/esop-rsu`, `/app/equity-os`)
Comprehensive equity compensation management modeling Section 17(2)(vi) perquisite tax on vesting, capital gains on sale, AMT triggers for ISOs, and 83(b) election deadlines.

### 6.9 Couple Pre-Nup & Wealth Alignment (`/app/prenup`)
Aligns pre-marital assets, tracks separate vs. joint property, models shared financial goals, and generates transparent wealth disclosure schedules.

### 6.10 Financial DNA & Psychometrics (`/app/dna`)
Evaluates user risk tolerance, loss aversion, and behavioral archetypes (e.g., *Strategic Compounder*, *Guardian Filer*) to calibrate investment recommendations.

### 6.11 Peer Leagues & Blind Demographic Cohorts (`/app/peers`, `/app/cohorts`)
Blind benchmarking comparing savings rates, net worth percentiles, and asset allocations against peer groups without exposing personal identifying data.

### 6.12 Real Estate Automated Valuation Model (AVM) (`/app/real-estate-avm`)
Models property appreciation, rental yields, mortgage amortization, and tax deductions under Section 24(b) / US IRC § 163(h).

### 6.13 Private Equity & 409A Cap Table (`/app/private-equity`)
Models startup equity grants, secondary market share sales, 409A valuation discounts, and liquidation waterfall preferences.

### 6.14 Residency Tax Arbitrage (`/app/residency-arbitrage`)
Evaluates physical presence rules (e.g., India 182-day rule, US state statutory residence), DTAA double taxation treaties, and interstate tax migration (e.g., California to Texas).

### 6.15 Micro-Invest Round-Ups (`/app/roundups`)
Rounds up daily debit card and UPI transactions to the nearest ₹10 or \$1, sweeping spare change into low-cost index ETFs.

### 6.16 Insurance Decoder & HLV Calculator (`/app/insurance`)
Calculates Human Life Value (HLV), evaluates health insurance room rent sub-limits, and models surrender values for traditional endowment/ULIP policies.

### 6.17 FIRE Calculator & Safe Withdrawal Rate Modeler (`/app/fire`)
Models Lean FIRE, Fat FIRE, and Coast FIRE targets using safe withdrawal rates (3.0%–4.0%) adjusted for healthcare inflation.

### 6.18 Cashflow & Statement Vision (`/app/cashflow`)
Categorizes bank transaction statements, tracks monthly burn rates, and flags silent recurring subscription leaks.

### 6.19 Government Schemes & Sovereign Wealth (`/app/govt-schemes`)
Tracks Indian sovereign savings instruments including Public Provident Fund (PPF), Sukanya Samriddhi Yojana (SSY), Senior Citizens Savings Scheme (SCSS), and Sovereign Gold Bonds (SGB).

### 6.20 FinAgent Black Sovereign VIP Wealth Portal (`/app/black`)
Private wealth portal reserved for ultra-high-net-worth investors (\$5M+ AUM) featuring concierge private banking, secondary allocations, and bespoke escrow services.

---

## 7. Deep Dive: Zero-Auth Viral Lead-Magnet Tools (`/tools/*`)

Public, unauthenticated calculators designed for customer acquisition:
1. **CTC Tax Leak Calculator (`/tools/ctc-tax-leak`)**: Quantifies tax leakage in Indian salary structures and demonstrates savings via Corporate NPS and tax-exempt allowances.
2. **Loan Arbitrage Calculator (`/tools/loan-arbitrage`)**: Calculates interest savings from refinancing floating-rate loans to external benchmark rates.
3. **US W-2 Tax Drag Calculator (`/tools/w2-tax-leak`)**: Evaluates tax drag on executive salaries, recommending S-Corp and HSA optimizations.
4. **PMI Removal & Refi Calculator (`/tools/pmi-arbitrage`)**: Calculates home equity thresholds to eliminate Private Mortgage Insurance (PMI) on conventional US mortgages.
5. **Comprehensive Wealth Diagnostic (`/tools/wealth-leak`)**: Analyzes fee drag, commission leakage, and tax inefficiency across multi-asset portfolios.

---

## 8. Deep Dive: Wealth Advisor OS Operational Depth (`/advisor/*`)

1. **Client Book & AUM Matrix (`/advisor/clients`)**: Practice overview displaying client AUM, health scores, and risk profiles.
2. **Client Profile & Statutory IPS Builder (`/advisor/clients/:clientId`)**: SEBI Regulation 17 / SEC Form ADV Investment Policy Statement (IPS) builder with asset allocation bands and return hurdles.
3. **Fiduciary Recommendation Queue & Order Bridging (`/advisor/recommendations`)**: AI recommendation queue with **1-Click SEBI RIA Co-Signing & Order Bridging** directly into consumer execution rails.
4. **Five-Year Regulatory Audit Trail & SEBI Form B Dossier (`/advisor/audit`)**: Five-year immutable audit log with cryptographic SHA-256 digests and one-click **SEBI Form B Compliance Dossier PDF** export.
5. **Digital Client Onboarding Flow (`/advisor/onboarding`)**: 5-step digital client onboarding wizard with risk profiling and digital agreement execution.
6. **AI Pre-Meeting Briefing Dossiers (`/advisor/meeting-prep`)**: AI-generated client dossiers synthesizing recent portfolio shifts, pending tax harvesting opportunities, and family milestones before client reviews.
7. **Quarterly Fiduciary Report Cards (`/advisor/report-cards`)**: Performance attribution and asset allocation reports ready for client delivery.
8. **Compliance Watchdog & Drift Monitor (`/advisor/compliance`)**: Real-time monitoring of client portfolios for allocation drift and regulatory fee compliance.
9. **Model Portfolios & Rebalancing Templates (`/advisor/models`)**: Practice-wide model portfolio templates with target weights across equity, debt, and alternative assets.
10. **AUM Revenue Analytics & Fee Billing (`/advisor/aum`)**: Revenue tracking, fee tier breakdowns, and automated client billing schedules.
11. **SEC Rule 204-2 Books & Records Watchdog (`/advisor/us/compliance`)**: Dedicated compliance tracking for US RIAs, auditing books and records under SEC Rule 204-2.

---

## 9. Deep Dive: Institutional & Enterprise B2B Portals

1. **Corporate Treasury & CFO Yield Sentinel (`/treasury`)**: Dynamic burn counter, multi-bank Insured Cash Sweep (ICS) providing **$150M+ extended FDIC / DICGC** insurance, and T-Bill yield ladders.
2. **Venture Syndicates, SPVs & Cap Table OS (`/syndicates`)**: LP commitment tracking, digital capital calls, European/American distribution waterfalls, and K-1/Form 64D tax packages.
3. **FinAgent for Work & R&D Tax Credits (`/work`)**: Employee equity financing and enterprise financial wellness.
4. **Non-Profit Endowments & Stock Giving Portal (`/giving`)**: Zero-tax appreciated stock donation widgets, embeddable donation snippets, and UPMIFA spending policy monitoring.
5. **Family Law, Divorce & Forensic Discovery (`/divorce`)**: AI forensic statement audit flagging undisclosed assets, 50/50 balance sheet modeling, and QDRO 401(k)/EPF divisions.
6. **White-Label Bank Embedded Wealth SDK (`/bank-embed`)**: Embeddable wealth management widgets for regional banks and credit unions with live theme customization and code playgrounds.
7. **B2B CPA & CA Practice Portal (`/cpa` & Practice Mode)**: Accountant practice suite with 28-rule batch client linting, manifest CSV exports, and shareable client intake links.

---

## 10. Statutory Vector PDF Engine (12+ Institutional Documents)

FinAgent includes a dedicated 3,800+ line vector PDF generator located across [`src/utils/fiduciaryPdfBuilder.js`](file:///Users/adityachowdhury/Downloads/Fin/src/utils/fiduciaryPdfBuilder.js) and [`src/utils/institutionalTaxBinderPdf.js`](file:///Users/adityachowdhury/Downloads/Fin/src/utils/institutionalTaxBinderPdf.js). Every builder features `cleanAscii` sanitization, ensuring zero UTF-16 glyph corruption, perfect typography, clean table formatting, and SHA-256 integrity digests:

| # | PDF Builder Function | Statutory Standard / Purpose | Document Type |
|---|---|---|---|
| 1 | `buildDirectIndexingCharterPDF` | Direct Indexing Operating Charter | Multi-factor tilts, tracking error covenant, wrap fee |
| 2 | `buildITRComputationStatementPDF` | CBDT Computation of Total Income | AY 2026-27 Part B-TI, Part B-TT, AIS DIN Seal |
| 3 | `buildClientIPSPDF` | SEBI RIA Investment Policy Statement | Regulation 17 suitability, return hurdle, asset bands |
| 4 | `buildSEBIInspectionDossierPDF` | SEBI Form B Compliance Ledger | Chronological audit ledger, Principal Officer sign-off |
| 5 | `buildDigitalWillDeedPDF` | Indian Succession Act Testamentary Deed | Asset bequest schedule, executor & dual-witness ledger |
| 6 | `buildLivingTrustDeedPDF` | US Revocable Living Trust & Pour-Over Will | California Probate Code & Uniform Trust Code compliant |
| 7 | `buildForensicXRayAuditPDF` | Forensic Portfolio Fee Leakage Audit | 5-level fee leakage breakdown & direct switch ledger |
| 8 | `buildHUFDeedPDF` | HUF Constitution Declaration Deed | Hindu Law statutory entity formation & PAN filing |
| 9 | `buildEmergencyVaultDossierPDF` | Emergency Vault Access Protocol | Dead man's switch instructions & asset access ledger |
| 10 | `buildLoanRepricingLetterPDF` | RBI EBLR Loan Repricing Demand | Statutory interest rate reduction notice to bank |
| 11 | `buildFiduciaryRecoPDF` | SEBI RIA Recommendation Letterhead | Regulation 19 fiduciary recommendation letter |
| 12 | `generateInstitutionalTaxBinderPdf` | 12-Page Institutional Audit Binder | Cryptographic SHA-256 seal, schedule crosswalk, Circular 230 / Sec 288 sign-off |

---

## 11. Complete Route Catalog (100+ Routes)

```
FinAgent Route Hierarchy
├── Public & Zero-Auth Viral Tools
│   ├── /                         Landing Page
│   ├── /login                    Investor / Advisor Login
│   ├── /signup                   Registration Flow
│   ├── /onboarding               5-Step New User Onboarding Wizard
│   ├── /terms & /privacy         DPDP Act 2023 & Terms of Service
│   └── /tools/*                  Viral Calculators (CTC Tax Leak, Loan Arbitrage, W-2 Leak, PMI Arbitrage, Wealth Leak)
│
├── Personal Wealth Cockpit (/app/*)
│   ├── /app/dashboard            Net worth, Health Score ring, asset allocation
│   ├── /app/portfolio            Multi-asset holding book (+ Real-time Add Holding form)
│   ├── /app/tax                  Tax & Forensic Studio (11 Statutory Tabs + Paywall + ZK Vault)
│   ├── /app/direct-indexing      Factor Tilt Studio, Tracking Error Math, Lot Harvester
│   ├── /app/e-file               CBDT AY 2026-27 JSON Compiler, AIS/TIS Reconciler, 28-pt Linter
│   ├── /app/execution            1-Click Execution Hub (Alpaca & Zerodha Kite Connect)
│   ├── /app/broker-router        Smart Order Router (SOR) with TWAP/VWAP algorithms
│   ├── /app/digital-will         Indian Succession Act Will Builder & Attestation Ledger
│   ├── /app/forensic-audit       Forensic Fee Leakage Auditor & Regular-to-Direct X-Ray
│   ├── /app/xray                 Detailed Portfolio Overlap & Exposure X-Ray
│   ├── /app/family-hub           Multi-PAN Family Office & Inter-Family Gifting Simulator
│   ├── /app/emergency-vault      Dead Man's Switch Heartbeat & Escrow Vault
│   ├── /app/huf-studio           HUF Statutory Tax Entity Builder (Save ₹3L+/yr)
│   ├── /app/loan                 Loan Repricing & RBI EBLR Repo Arbitrage Engine
│   ├── /app/negotiator           Bank Fee & Interest Rate Negotiator with Email Dispatch
│   ├── /app/council              Agentic AI Council (CIO, Tax, Growth, Risk Debate)
│   ├── /app/live-banker          Gemini Live WebRTC Multimodal Banker (Camera + Voice)
│   ├── /app/voice-banker         Conversational Voice Banker
│   ├── /app/life-twin            10,000-Run Monte Carlo Simulation Life Twin
│   ├── /app/zk-vault             Client-Side AES-GCM-256 Zero-Knowledge Privacy Vault
│   ├── /app/tax-loss-bot         Automated Tax Loss Harvesting Bot
│   ├── /app/itr                  ITR Assistant & Tax Regime Comparison
│   ├── /app/cashflow             Bank Statement Vision Cashflow Extractor
│   ├── /app/documents            Gemini Vision OCR Document Intelligence (CAMS, FDs, Salary)
│   ├── /app/credit               Credit Score Sentinel & Bureau Parser
│   ├── /app/residency-arbitrage  Cross-Border & Inter-State Residency Tax Arbitrage
│   ├── /app/private-equity       Private Equity 409A Cap Table & Grant Vesting Modeler
│   ├── /app/real-estate-avm      Automated Real Estate Valuation (AVM) Engine
│   ├── /app/cohorts              Financial Blind Anonymous Peer Benchmarking
│   ├── /app/prenup               Couple Financial Pre-Nup & Wealth Alignment
│   ├── /app/black                FinAgent Black Sovereign VIP Wealth Portal ($5M+ AUM)
│   └── /app/us/*                 US-Parallel Modules
│       ├── /app/us/tax           US 1040 Tax Assistant (50 States + Overseas Territories)
│       ├── /app/us/scorp         US S-Corp Reasonable Comp & PTET SALT Studio
│       ├── /app/us/retirement    US Retirement Studio (Mega Backdoor Roth & SECURE 2.0)
│       ├── /app/us/trust         US Living Trust & Estate Succession Studio
│       ├── /app/us/mortgage      US Mortgage Refinance & Home Equity Studio
│       ├── /app/us/wash-sale     US 30-Day Wash-Sale Loss Harvester
│       ├── /app/us/w2            W-2 Tax & Compensation Optimizer
│       ├── /app/us/401k          401(k) Fee Hunter & ERISA 408(b)(2) Audit
│       └── /app/us/plaid         Plaid Bank Connection Gateway
│
├── Wealth Advisor OS (/advisor/*)
│   ├── /advisor/clients          Client Book & AUM Matrix
│   ├── /advisor/clients/:id      Client Profile, Portfolio Analytics & Statutory IPS Tab
│   ├── /advisor/recommendations  AI Fiduciary Recommendation Queue + 1-Click Co-Signing
│   ├── /advisor/audit            SEBI Regulatory Audit Trail & Form B Dossier Download
│   ├── /advisor/onboarding       5-Step Digital Client Onboarding Flow
│   ├── /advisor/meeting-prep     AI Pre-Meeting Client Dossiers
│   ├── /advisor/report-cards     Quarterly Fiduciary Client Report Cards
│   ├── /advisor/compliance       Compliance Watchdog & Drift Monitor
│   ├── /advisor/models           Model Portfolios & Asset Allocations
│   ├── /advisor/aum              AUM Revenue, Tier Breakdown & Billing
│   └── /advisor/us/compliance    SEC Rule 204-2 Books & Records Watchdog
│
└── Institutional & Enterprise Portals
    ├── /treasury                 Corporate Treasury & CFO Yield Sentinel
    ├── /syndicates               Venture Syndicates, SPVs & Cap Table OS
    ├── /work                     FinAgent for Work & R&D Tax Credits
    ├── /giving                   Non-Profit Endowments & Stock Giving Portal
    ├── /divorce                  Family Law, Divorce & Forensic Asset Discovery
    ├── /cpa                      CPA & Tax Practice Portal
    └── /bank-embed               White-Label Bank Embedded Wealth SDK
```

---

## 12. System Architecture & End-to-End Data Flows

```mermaid
sequenceDiagram
    autonumber
    actor Investor as Retail Investor / Family Office
    actor Advisor as SEBI / SEC RIA Principal Officer
    participant UI as Vite + React Frontend (:5173)
    participant API as Express API Server (:3001)
    participant DB as SQLite WAL / Supabase PostgreSQL
    participant AI as Google Gemini 2.0 Flash
    participant Broker as Zerodha Kite / Alpaca Paper

    Note over Investor,UI: 1. Broker Sync & Direct Document Parsing
    Investor->>UI: Clicks "1-Click Broker & Payroll Sync" (Schwab/Zerodha)
    UI->>UI: Client-Side Ephemeral Ingestion (Zero-Knowledge RAM)
    UI->>API: POST /api/tax-engine/save-draft (Sanitized State)
    API->>DB: Persists return state & audit timestamps

    Note over Investor,UI: 2. Tax Alpha & Harvesting Execution
    Investor->>UI: Reviews Tax-Loss Harvesting & S-Corp FICA Savings
    Investor->>UI: Clicks "Route Model to Advisor Queue"
    UI->>API: Dispatches recommendation to Advisor review queue

    Note over Advisor,UI: 3. Fiduciary Co-Signing & Order Bridging
    Advisor->>UI: Opens /advisor/recommendations, reviews suitability
    Advisor->>UI: Clicks "⚡ RIA Co-Sign & Bridge to Execution"
    UI->>API: POST /api/advisor/sign-and-bridge
    API->>DB: Logs RIA digital signature hash & audit event
    API->>API: Bridges order into brokerExecution queue
    API-->>UI: HTTP 200 (Order Bridged & Queued)

    Note over Investor,Broker: 4. Autonomous 1-Click Execution & Binder
    Investor->>UI: Navigates to /app/execution, clicks "Execute 1-Click Order"
    UI->>API: POST /api/broker-router/place-order
    API->>Broker: Submits TWAP/VWAP order slices
    Broker-->>API: Order FILLED receipt
    UI->>UI: Generates 12-Page Institutional Audit Binder PDF (SHA-256 Sealed)
```

---

## 13. Technology Stack & Third-Party Integrations

### Frontend
- **Framework**: [React 18.3](https://react.dev/) + [Vite 5.4](https://vitejs.dev/)
- **Routing**: [React Router DOM v6](https://reactrouter.com/) (100+ dynamic and protected routes)
- **Visualization**: [Recharts](https://recharts.org/) (Asset rings, tax bracket step visualizers, fee drag exponential curves, pro-rata donuts)
- **Vector PDF Generator**: [jsPDF 4.2](https://github.com/parallax/jsPDF) + [jspdf-autotable 5.0](https://github.com/simonbengtsson/jsPDF-AutoTable)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Styling**: Native CSS Variables with Dark Glassmorphism, Zero-Tailwind runtime overhead

### Mobile Runtime
- **Engine**: [Capacitor 8.5](https://capacitorjs.com/) (`@capacitor/core`, `@capacitor/ios`, `@capacitor/android`)
- **Native Bridges**: Custom haptic feedback, native share sheet, in-app secure browser

### Backend & Storage
- **Runtime**: [Node.js 24](https://nodejs.org/) (Express 4.21, CommonJS)
- **Database (Dual-Persistence)**:
  - **Local**: SQLite 3 with Write-Ahead Logging (WAL) mode for zero-latency local state
  - **Cloud**: [Supabase](https://supabase.com/) PostgreSQL Pooler (Connection pooling via `pg`)
- **AI / LLM**: `@google/generative-ai` with cascading fallback across:
  - `gemini-2.0-flash`
  - `gemini-1.5-flash`
  - `gemini-3-flash-preview`
- **Transactional Email**: [Resend](https://resend.com/) API with official vector PDF attachments
- **Payment Processing**: [Razorpay](https://razorpay.com/) (INR) & [Stripe](https://stripe.com/) (USD)
- **Brokerage & Financial Feeds**:
  - Alpaca Securities API (Paper Trading $100k Sandbox & Live)
  - Zerodha Kite Connect / BSE StAR MF execution mocks
  - Plaid Link Sandbox (Bank Account Connectivity)
  - Yahoo Finance 2 (Real-Time Market Quotes & Index Historical Feeds)
  - MFAPI.in (Indian Mutual Fund Daily NAVs)
- **Analytics**: Firebase Analytics & [Mixpanel](https://mixpanel.com/)

---

## 14. Repository Directory Structure

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
│   ├── App.jsx                  # Main router & route hierarchy (100+ routes)
│   ├── main.jsx                 # React root mount
│   ├── components/              # Reusable UI Components
│   │   ├── ai/                  # AICopilotSidecar, ChatWindow, InChat artifact cards
│   │   ├── common/              # CommandPalette, StickyActionDock
│   │   ├── layout/              # TopBar, Sidebar, HubSubNav
│   │   ├── notifications/       # TopBar AI Notification Bell & Panel
│   │   ├── tax/                 # Tax Studio components (Paywall, ZK Vault, Sync, Hero)
│   │   │   └── visualizations/  # Recharts: Waterfall, Brackets, Donut, Divergence
│   │   └── ui/                  # ErrorBoundary, FeatureGate, UpgradeModal
│   ├── context/                 # State Contexts
│   │   ├── AppContext.jsx       # Global portfolio, dual-market, & role state
│   │   ├── AuthContext.jsx      # Firebase auth & multi-tenant role switching
│   │   ├── TaxStudioContext.jsx # Central reactive tax store & paywall gating state
│   │   ├── SubscriptionContext.jsx # Stripe/Razorpay tier gating
│   │   └── ToastContext.jsx     # Notifications & feedback toasts
│   ├── hooks/                   # Custom React Hooks
│   ├── pages/                   # Application Views & Pages
│   │   ├── advisor/             # Wealth Advisor OS (Clients, RecoQueue, AuditLog, IPS)
│   │   │   └── us/              # SECComplianceWatchdog.jsx
│   │   ├── auth/                # Login, Signup, Forgot Password
│   │   ├── bank/                # Embedded Wealth White-Label Portal
│   │   ├── consumer/            # Personal Wealth, AI & Statutory Execution Modules
│   │   │   ├── TaxForensicStudio.jsx # Unified 11-Tab Tax Command Center
│   │   │   ├── DirectIndexingHub.jsx # Direct Indexing & Custom Factor Tilt Studio
│   │   │   ├── TaxEFilingHub.jsx     # Government Tax E-Filing & AIS Reconciler
│   │   │   ├── ExecutionHub.jsx      # 1-Click Execution & Broker Routing
│   │   │   ├── DigitalWill.jsx       # Digital Will & Estate Succession
│   │   │   ├── ForensicAudit.jsx     # Forensic Fee Leakage Auditor
│   │   │   ├── HUFStudio.jsx         # HUF Statutory Tax Studio
│   │   │   ├── FamilyHub.jsx         # Multi-PAN Family Office Hub
│   │   │   ├── EmergencyVault.jsx    # Dead Man's Switch Emergency Vault
│   │   │   ├── BillLoanNegotiator.jsx# Bank Loan & Fee Negotiator
│   │   │   ├── CouncilHub.jsx        # Agentic AI Council (4-Persona Debate)
│   │   │   └── us/                   # US-specific modules (1040, S-Corp, Trust, Mortgage, etc.)
│   │   ├── cpa/                 # CPA & Tax Practice Portal
│   │   ├── giving/              # Non-profit & Endowments Giving Portal
│   │   ├── legal/               # Family Law Forensics, Terms of Service, Privacy
│   │   ├── onboarding/          # Consumer & Advisor Onboarding Wizards
│   │   ├── public/              # Zero-auth viral lead generation tools
│   │   ├── syndicates/          # Venture Syndicates & SPV Cap Table OS
│   │   ├── treasury/            # Corporate Treasury & CFO Sentinel
│   │   └── work/                # FinAgent for Work & R&D Tax Credits
│   ├── services/                # API Client Services (Gemini, Copilot, Proactive Advisor)
│   └── utils/
│       ├── fiduciaryPdfBuilder.js     # 3,450+ line Statutory Vector PDF Generator
│       ├── institutionalTaxBinderPdf.js# 12-Page Institutional Audit Binder PDF Generator
│       └── formatters.js              # Currency & date formatters
│
├── server/                      # Backend API Server Source
│   ├── index.js                 # Express server bootstrap (Port 3001, 75+ routes)
│   ├── package.json             # Server dependencies
│   ├── .env                     # Server API keys & credentials
│   ├── db/
│   │   └── database.js          # SQLite WAL & Supabase PostgreSQL dual persistence
│   ├── services/                # Server services (copilotTools, in/us tax doc parsers)
│   └── routes/                  # API Route Controllers (75+ Controllers)
│       ├── usTax.js             # 50-State tax engine, territories, & expats
│       ├── usBusinessTax.js     # S-Corp FICA arbitrage, PTET, FinCEN BOI
│       ├── taxEngine.js         # Indian Tax Engine & AY 2026-27 calculations
│       ├── taxEFiling.js        # CBDT JSON & IRS MeF XML generation
│       ├── directIndexing.js    # Factor tilt rebalancer & lot harvester
│       ├── advisorAdmin.js      # Recommendations, client onboarding, statutory IPS
│       ├── secCompliance.js     # US SEC RIA Compliance Watchdog
│       ├── brokerExecution.js   # Execution history, order bridge, 1-click execution
│       ├── digitalWill.js       # Testamentary deed, executor ledger, emergency sync
│       ├── usLivingTrust.js     # US Revocable Living Trust & Pour-Over Will
│       ├── usMortgageRefi.js    # US Mortgage Refinance & Conforming Analysis
│       ├── forensicAudit.js     # Fee leakage auditor & regular-to-direct switcher
│       └── hufStudio.js         # HUF entity builder & deed generation
│
└── tests/                       # Automated Test Suites (119 Verified Tests)
    ├── test_commercial_monetization_and_moats.mjs
    ├── test_50_states_territories_and_expats.mjs
    ├── test_tax_studio_enterprise_complete.mjs
    ├── test_interactive_visualizations_math.mjs
    └── test_enterprise_commercial_readiness.mjs
```

---

## 15. Automated Verification & Test Suites (119/119 Tests)

FinAgent maintains an automated test pipeline validating statutory computations, bracket calculations, paywall transitions, and PDF generators:

```bash
# 1. Commercial Monetization & AI Defensibility Moats (9 Tests)
node tests/test_commercial_monetization_and_moats.mjs

# 2. Universal 50-State, Territories & Expats Engine (31 Tests)
node tests/test_50_states_territories_and_expats.mjs

# 3. Enterprise Central Architecture & Statutory Tax Rules (17 Tests)
node tests/test_tax_studio_enterprise_complete.mjs

# 4. Interactive Mathematical Visualizations (12 Tests)
node tests/test_interactive_visualizations_math.mjs

# 5. Commercial Production Readiness & Parsers (50 Tests)
node tests/test_enterprise_commercial_readiness.mjs
```

### Verification Results:
```
=============================================================================
📊 COMPLETE SYSTEM VERIFICATION: 119/119 TESTS PASSED (100% SUCCESS)
=============================================================================
  ✅ Commercial Paywall & 3x ROI Multipliers ($299/$599, ₹7,999/₹14,999)
  ✅ Zero-Knowledge Ephemeral Shield & PII Redaction
  ✅ 1-Click Broker & Payroll Auto-Sync Ingestion
  ✅ 12-Page Institutional Audit Binder PDF Generation
  ✅ B2B CPA & CA Practice Portal Roster & 28-Rule Linter
  ✅ Universal 50-State Brackets + DC + 5 Overseas Territories
  ✅ Expat Form 2555 FEIE & Form 1116 Foreign Tax Credit
  ✅ S-Corp Reasonable Comp FICA & PTET SALT Workaround
  ✅ India Schedule FA Foreign Assets & Rule 115 SBI TT Rates
  ✅ Finance Act 2024 Sec 87A Restriction & Surcharge Marginal Relief
  ✅ US Form 8606 Backdoor Roth Pro-Rata Donut Math
  ✅ FinCEN BOI Reporting & $591/Day Civil Penalty Model
  ✅ Multi-Year Loss Carryforward Vaults (US $3k / India Sec 74 8-Year)
  ✅ Production Bundle Build: vite v5.4.21 built in 5.75s (0 errors)
=============================================================================
```

---

## 16. Getting Started & Local Setup

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

## 17. Mobile App Setup (Capacitor iOS & Android)

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

## 18. Cloud Deployment Guide (Vercel & Render)

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

## 19. Regulatory Compliance & Security Architecture

- **SEBI (Investment Advisers) Regulations, 2013**:
  - **Regulation 17 (Suitability)**: Risk profiling and mandatory Investment Policy Statement (IPS) before advising.
  - **Regulation 18(2) (Zero Trailer Drag)**: 100% direct plans mandate with 0.00% commission.
  - **Regulation 19 (Client Agreement & Audit Trail)**: Five-year immutable audit log with cryptographic SHA-256 digests.
- **CBDT Income Tax Act, 1961 (AY 2026-27)**:
  - Finance Act 2024 capital gains rates (12.5% LTCG > ₹1.25L, 20% STCG).
  - Pre-flight statutory schema linting eliminating Section 143(1)(a) discrepancy notices.
  - Schedule FA foreign asset reporting under Black Money Act 2015 Section 43.
- **SEC Investment Advisers Act of 1940 & Rule 204-2**: Fiduciary sign-offs with statutory disclaimers and chronological books & records retention.
- **Digital Personal Data Protection (DPDP) Act, 2023 & GDPR**: User privacy options including full account deletion and zero tracking of unauthenticated sessions.
- **Client-Side Zero-Knowledge Encryption**: Financial vault files and records are secured client-side using PBKDF2 with 100,000 iterations and AES-GCM-256 bit keys with ephemeral RAM parsing.

---

## 👥 Contributors & Support

- **Repository**: [https://github.com/adityachowdhuryin/Finagent](https://github.com/adityachowdhuryin/Finagent)
- **Author**: Aditya Chowdhury
- **Contact / Legal**: `legal@finagent.app`

---

*FinAgent Technologies is an autonomous financial technology platform. Content and AI outputs are for educational and informational purposes. Consult certified financial advisors before executing capital allocations.*
