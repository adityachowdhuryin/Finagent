**FINAGENT UNIVERSAL WEALTH SUPER-APP**

*Master Startup & Product Specification: India-First Brokerage & AI Wealth Advisory Platform — Business Model, Go-to-Market, and Regulatory-Aware Build Roadmap*
*Document Version 6.0 | Supersedes v5.0 | Target Environment: Agentic IDE (Cursor / Antigravity)*

> **THE FINAGENT VISION:** *FinAgent is an India-first Fintech Super-App that unifies a user's entire financial life — brokerage holdings, mutual funds, fixed deposits, EPF/PPF, real estate, insurance, and (later) crypto — into a single AI-driven advisory platform. It combines full-spectrum trading execution with an autonomous Wealth Intelligence layer that reads all assets to deliver hyper-personalized, goal-based financial advice and natural-language, human-confirmed order drafting. It reaches the market two ways at once: direct to self-directed investors, and — the higher-leverage path — as an AI co-pilot licensed to the SEBI-registered advisors and AMFI-registered distributors who are structurally too scarce (or too advice-constrained) to serve India's investor base alone. Global (US/crypto) expansion is a deliberately separate, later phase — not a day-one requirement.*

---

## 0. Executive Summary

India has 20+ crore investors and, per SEBI's own data, roughly 1,000 registered Investment Advisers and an estimated 1,300–1,500 Research Analysts to serve them — a combined regulated-advisor pool of roughly 2,300–2,500 people. SEBI's own chairman has flagged this gap publicly, warning it is being filled by unregulated finfluencers rather than fiduciaries — and as of SEBI's remarks at the ARIA "Aspire 2026" event in March 2026, the registered-adviser count is reportedly *declining*, not growing. Meanwhile, direct-to-consumer aggregation — "see all your money in one app" — is already a won game: INDmoney alone already aggregates stocks, mutual funds, EPF, NPS, US equities, and family net worth for free, and already holds its own stockbroker and RIA registrations. Building "another INDmoney" is not a defensible plan.

**FinAgent's wedge is advisory depth plus a distribution channel INDmoney doesn't run — but v6 makes that wedge honest about scale.** The ~2,300–2,500 SEBI-registered RIAs/RAs are the credibility beachhead: an AI co-pilot that lets one registered advisor serve five to ten times more clients at the same quality bar. On their own, though, that population is small and static-to-shrinking — even aggressive penetration caps B2B2C revenue in the low crores of ARR (Section 4.4). The real scale opportunity sits one layer down, in India's roughly 2.75 lakh AMFI-registered mutual fund distributors (MFDs/IFAs) — served by a deliberately narrower, advice-free **Insights & Practice Tools** tier that sidesteps the IA/RA registration question entirely (Section 4.2). Direct-to-consumer stays in the plan as a secondary, compounding channel (Section 5.2), and brokerage-linked economics arrive only in Stage 2+ once a partner-broker agreement exists.

Business model in one line: **B2B2C SaaS seats sold across two tiers — a small, high-trust Advice Copilot tier for SEBI-registered advisors, and a much larger Insights tier for MFDs/IFAs — layered with a D2C freemium/subscription consumer product, with brokerage-linked economics arriving only in Stage 2+ once a partner-broker agreement exists.**

This document is structured so that Stage 1 is fully buildable today in an agentic IDE — but v6 adds a hard gate *before* Phase 0 starts: a written legal opinion (Phase -0.5) and a pass/fail concierge pilot (Phase -1) with explicit kill criteria (Section 5.4). The biggest risk to this plan was never the engineering — it's discovering, a year in, that the core B2B2C assumption doesn't hold. "Build the code now, flip it live once the paperwork clears" remains the governing principle from v4/v5; v6 adds: **don't build the code until the paperwork and the pilot both say go.**

### 0.1 What Changed in v6 (Read This First)

1. **TAM made honest, and widened correctly.** The Advice Copilot tier alone (~2,300–2,500 regulated advisors) is not venture-scale. Section 4.4 adds sourced numbers, a declining-population risk flag, and bear/base/bull revenue modeling. A second, lower-priced, advice-free MFD/IFA tier (Section 4.2) is added specifically to fix this without diluting the regulated-advisor wedge.
2. **Legal foundation upgraded from "confirm eventually" to a hard gate.** v5 flagged the B2B2C structuring question as unconfirmed; v6 makes getting a written opinion **Phase -0.5**, before a single pilot advisor is recruited (Section 12).
3. **Explicit defensibility section added.** Relationship-based moat alone is fragile against a fast-following, well-capitalized incumbent. Section 2.1 lays out what actually needs to be built to make switching costs real.
4. **AI advisory reliability treated as a first-class deliverable**, not a byproduct of the audit log. Section 7.5 adds a golden-dataset evaluation framework, borrowing directly from agent-evaluation practices (offline eval harnesses, online sampling, drift monitoring).
5. **Kill criteria and pivot paths defined before the pilot runs**, not interpreted after the fact (Section 5.4). Hiring is now gated to traction metrics, not calendar months (Section 10).

---

## 1. Product Vision & Market Position

Traditional wealth management is fragmented. Investors use Zerodha/Groww for stocks and mutual funds, crypto exchanges for digital assets, bank portals for Fixed Deposits, insurers' own portals for policies, and offline records for Real Estate and EPF.

FinAgent unifies this into a single intelligence platform, built on two pillars:

- **Pillar 1 — Modern Brokerage Experience:** Direct execution across Stocks, Derivatives, Mutual Funds, IPOs, FDs, and Bonds — delivered via a registered broker partnership (Section 9.7), not FinAgent's own exchange membership, at least through v1.
- **Pillar 2 — Autonomous Wealth Intelligence:** An AI engine that reads a user's complete multi-asset portfolio — including offline assets like Real Estate, EPF, and insurance — to provide holistic, goal-based financial advice and natural-language, human-confirmed trade drafting, deliverable both directly to consumers and through a human advisor or distributor.

**Scope discipline:** v1 targets the Indian market exclusively. US brokerage parity (Robinhood/Alpaca-style) and crypto trading (Coinbase-style) are real long-term ambitions but are scoped into Stage 4 / Phase 10 (Section 12) as a deliberately separate product line with its own legal entity, licensing, and tax logic — not built in parallel with v1.

---

## 2. Competitive Landscape & Differentiation

| Player | What it actually does today | Advisory depth | Distribution | Where FinAgent doesn't compete head-on |
|---|---|---|---|---|
| **INDmoney** | Free aggregation of stocks, MFs, EPF, NPS, US equities, credit cards; own stockbroker + RIA registration; family net worth view | Algorithmic, not fiduciary/human-backed per client | Pure D2C, ad/content-led | FinAgent doesn't try to out-aggregate a well-funded incumbent for free |
| **Kuvera / ET Money / Groww** | Direct mutual fund platforms, expanding into broader tracking | Light or none | D2C | Same — commoditized aggregation, not a wedge |
| **Richify and smaller trackers** | Manual/no-linking portfolio trackers covering niche assets (gold, real estate equity) | None | D2C, low retention | Feature-only competitors, not platform threats |
| **Bank RMs / traditional IFAs / MFDs** | Human advice, often commission-linked, low tooling | High trust, low leverage per advisor (a handful of clients each) | Relationship-led, offline | **This is FinAgent's actual opening** — not the app, the advisor/distributor |

**The wedge:** every consumer-aggregation competitor is racing to be the free dashboard. None of them are shipping a product an independent advisor can put their own name behind, with an audit trail a regulator would accept, that lets that advisor serve 5-10x more clients. That's a B2B2C SaaS motion with none of the "free-app-with-ads-and-cross-sell" dynamics INDmoney is locked into, and it's defensible precisely because it isn't a race to zero on aggregation features.

FinAgent's stated differentiators against this backdrop (used consistently across sales and product): **explainable, audit-logged AI reasoning** (Section 7.4) an advisor can stand behind; **genuinely Indian-tax-aware goal modeling** (Section 7.1) rather than generic robo-advisor logic; and **a co-pilot workflow**, not a black box, per the human-in-the-loop design in Section 8.

### 2.1 Defensibility Beyond Advisor Relationships *(NEW — v6)*

A relational moat — "we talked to advisors first" — is real but fragile. INDmoney already holds RIA and stockbroker registrations and could plausibly ship an advisor-facing mode as a feature once this wedge is proven; Groww and Zerodha have the capital and distribution to fast-follow within a couple of product cycles. The plan needs mechanisms that survive a competent competitor noticing it, not just a head start.

- **Compliance-record lock-in.** The Recommendation Audit Log (Section 7.3) becomes the advisor's own regulatory record over time. Once a year of audit history sits inside FinAgent, migrating to a competitor means losing a defensible compliance trail — a much stickier switching cost than a dashboard preference, and one that compounds the longer an advisor stays.
- **A deliberate data/model flywheel, not an accidental one.** Every accepted, edited, or rejected recommendation is a labeled signal no aggregator currently captures, because aggregators don't sit inside the advisor's actual workflow. This needs to be an explicit build requirement from Phase 4 onward (see Section 7.5's acceptance-rate logging), not something assumed to accumulate on its own.
- **Win narrow before going broad.** A specific advisor association, professional network, or city-level cohort won deeply — including, ideally, a preferred or exclusive arrangement with an advisor body (Section 5.1) — is harder for a fast-follower to replicate than a feature, because it's a relationship and reputation asset, not a product spec.
- **A temporary but real incentive misalignment.** INDmoney's organizational incentive is to protect its free D2C funnel and its own in-house RIA arm, not to build paid tooling that helps *independent* advisors compete with INDmoney's own advisory business. That gap won't last indefinitely, but it's real leverage for the first 12–24 months.

**Be explicit about the time horizon:** none of the above is a permanent moat. Assume roughly 12–24 months before a well-resourced competitor notices this wedge and responds. The plan needs to have banked real advisor relationships, audit-trail lock-in, and a working data flywheel inside that window — not rely on staying unnoticed.

---

## 3. Feature Parity Matrix

FinAgent targets feature parity with tier-1 Indian discount brokerages and wealth platforms (Zerodha, Groww) for v1, augmented with an AI layer. Global-platform-parity items (marked *[Stage 4]*) are deferred.

| Asset / Capability | Core Brokerage Features (v1, India) | FinAgent AI Layer Expansion |
|---|---|---|
| Equities & ETFs | Real-time streaming charts, Intraday Margin Trading Facility (MTF), Delivery trading, Equity SIPs, Basket Orders, Stop-Loss/Target orders | Prompt-based stock screening, automatic portfolio rebalancing drafts, automated earnings-call summarizer, intraday risk guardrails |
| Futures & Options (F&O) | Interactive Option Chains, Payoff Analyzers, Strategy Builder, Greeks analysis, Commodity & Currency derivatives | Natural language option strategy generator ("Draft a delta-neutral iron condor on Nifty"), real-time hedge suggestions during volatility — all subject to SEBI algo registration (Section 9.3) |
| Direct Mutual Funds | 0% Commission Direct Mutual Funds, Lumpsum & SIP/STP/SWP automation, CAS statement import, AMC switches | Portfolio overlap analysis, fund fee audit, tax-optimized fund switching suggestions |
| IPOs & Debt Instruments | UPI-based ASBA IPO applications, Sovereign Gold Bonds (SGBs), Corporate Fixed Deposits, Treasury Bills, Corporate Bonds | AI IPO grading engine reading Red Herring Prospectuses (DRHPs), yield-curve comparison across FDs vs Debt Funds vs T-Bills |
| Personal Finance & Banking | Bank account linking via Account Aggregator (Section 6), net worth tracking, spend categorization, income/expense analytics | Cash-flow sensitive investment recommendations ("You have ₹X excess liquidity earning 3%; move ₹Y into a liquid fund") |
| **Financial Wellness & Engagement** | — | Financial Health Score (single 0–100 composite of liquidity, diversification, debt ratio, insurance coverage, goal progress), "Why this recommendation" explainability panel, anonymized peer benchmarking (Section 7.4) |
| Cryptocurrency & Web3 *[Stage 4]* | Spot trading, recurring buys, wallet integration | Cross-asset risk correlation alerts — deferred to Stage 4 pending India-specific crypto licensing clarity |
| US Equities *[Stage 4]* | Robinhood/Alpaca-style US brokerage access | Deferred — separate legal entity, SEC/FINRA registration required |

---

## 4. Business Model & Monetization

### 4.1 Revenue by Stage

| Stage | Model | Primary revenue | Secondary revenue |
|---|---|---|---|
| **Stage 1** (Model A, advisory-only) | B2B2C SaaS + D2C subscription | Per-seat SaaS fee across both B2B2C tiers (Section 4.2) | D2C freemium → paid subscription |
| **Stage 2** (Model B, in-app execution) | Adds transaction-linked revenue | Revenue share / referral fee from the partner broker on routed order flow | Higher D2C subscription tier that unlocks execution |
| **Stage 3** (Model C, own stockbroker) | Full brokerage economics | Brokerage/transaction fees, MTF interest spread, float income | SaaS + subscription lines continue, now higher-margin since broker economics no longer shared with a partner |
| **Stage 4** (International) | Mirrors Stage 2/3 in new jurisdiction | Same pattern, separate entity | — |

The key sequencing point: **Stage 1 has real, immediate revenue** and, as of v6, two distinct customer segments large enough in combination to matter. B2B2C SaaS fees don't depend on a partner-broker agreement or Algo-ID registration at all.

### 4.2 Pricing Hypothesis *(illustrative — pressure-test via the Section 5.3 pilot before finalizing)*

- **D2C Free:** net worth aggregation, basic dashboard, Financial Health Score. Lead generation and data moat, not a revenue line.
- **D2C Plus (₹299–499/month):** full AI advisory, goal modeling, tax-loss harvesting, insurance gap analysis, explainability panel.
- **D2C Family (₹599–899/month):** multi-member household view, shared goals.
- **B2B2C — Advice Copilot tier (₹2,000–5,000/advisor/month, tiered by end-client count):** for SEBI-registered RIAs/RAs only. Full personalized recommendation drafting, "why this recommendation" panel, and the Recommendation Audit Log — this is investment advice under Indian law, and the advisor's own registration is what makes it compliant (Section 9.4). Positioned against the cost of a junior research hire (₹40–60k/month): "serve 5x the clients," not "software subscription."
- **B2B2C — Insights & Practice Tools tier (₹500–1,500/advisor/month) *(NEW — v6):*** for the far larger population of AMFI-registered MFDs/IFAs, who are legally distributors, not advisors, and cannot themselves give personalized investment advice. This tier is **deliberately scoped to stop short of advice**: aggregated client-book analytics, portfolio overlap and concentration flags, fee/expense-ratio audits, the document vault, and client-facing dashboards the MFD talks their own client through. No AI-generated "you should do X" recommendation language reaches an end client through this tier — the MFD supplies the judgment, FinAgent supplies the data and visualization. This is what makes the tier's addressable market roughly two orders of magnitude larger than the Advice Copilot tier's (Section 4.4) without inheriting its regulatory weight — but the exact framing still needs the Section 9.4 legal sign-off, since "analytics that strongly implies a recommendation" is a real gray zone SEBI has enforced against before.

### 4.3 Unit Economics Sketch *(directional, not measured — validate with real pilot data)*

- **D2C:** low ARPU, must be won on low CAC (organic/content/SEO/referral from the household net-worth viral loop in 7.3). Paid-conversion economics only work if CAC stays well under ₹1,000/paying user.
- **B2B2C — Advice Copilot:** higher CAC (sales-led, one advisor at a time) but far higher LTV — once an advisor's client workflow runs through FinAgent, switching cost and churn resistance are both high (Section 2.1), and each advisor represents dozens to hundreds of end-clients' worth of data and usage.
- **B2B2C — Insights:** lower ARPU than Advice Copilot but a much larger, more reachable population and a materially lower sales-cycle cost per seat (simpler compliance story, easier to self-serve or sell via the AMC/RTA relationships MFDs already have). This is the tier that should carry volume; Advice Copilot carries credibility and the compliance moat.

### 4.4 TAM Reality Check *(NEW — v6)*

**The numbers, sourced as of mid-2026:** SEBI data puts the registered Investment Adviser count at roughly 1,000 (several public trackers cite ~967 as of August 2025), and SEBI's own chairman flagged at the ARIA "Aspire 2026" event in March 2026 that this figure is *declining*, not growing — the regulator is actively worried about it. Registered Research Analysts are a separate, somewhat larger pool, on the order of 1,300–1,500. Combined, the **regulated-advisor population addressable by the Advice Copilot tier is roughly 2,300–2,500 people, and shrinking on current trend.** Even an aggressive 30–40% penetration of that pool — unrealistic in years 1–2 of a new product — is under 1,000 paying seats.

Separately, AMFI reports **over 2.75 lakh (275,000) registered mutual fund distributors** (ARN holders) collectively overseeing tens of lakh crore in mutual fund assets. This is the Insights tier's addressable ceiling — but treat 2.75 lakh as a ceiling, not a working number: a large share of ARN holders are inactive, part-time, or manage a handful of clients each. The *actively practicing, seriously-run* subset is materially smaller and not precisely published; get a real estimate from AMFI's distributor-activity data and the Phase -1 pilot before sizing a revenue model on it.

**Illustrative 3-year scenarios (wide bands, to be replaced with real data after Phase -1 and Year 1):**

| Scenario | Advice Copilot seats (Yr 3) | Insights seats (Yr 3) | Approx. combined B2B2C ARR (Yr 3) |
|---|---|---|---|
| Bear | 100 | 500 | ~₹50 lakh |
| Base | 400 | 2,500 | ~₹3.5–4.5 crore |
| Bull | 800 | 6,000 | ~₹8–11 crore |

**What this means honestly:** the Advice Copilot tier alone is not a venture-scale wedge — it's a credible, high-trust beachhead that proves the advisory engine works and builds the compliance-audit moat (2.1). The Insights tier and eventual D2C compounding (Section 5.2) are what turn this into a business worth raising a real seed round for. Size the seed round and 12–18 month runway (Section 11) to comfortably survive proving the **base case** above, not the bull case — and treat the bull case as upside, not a planning assumption.

---

## 5. Go-to-Market Strategy

### 5.1 Primary Channel — Arm the Advisor and the Distributor (B2B2C)

SEBI's own registry shows just over 1,000 registered Investment Advisers and roughly 1,300–1,500 Research Analysts serving an investor base north of 20 crore — a combined pool SEBI's chairman has flagged as shrinking, with unregulated influencers filling the resulting gap. That gap is FinAgent's credibility wedge. But GTM in v6 explicitly runs on **two parallel tracks**, not one, because the regulated-advisor pool alone is too small to be the whole plan (Section 4.4):

**Track A — Advice Copilot (RIA/RA):** FinAgent ships a white-labeled, multi-client version of the Stage 1 product — the advisor gets a dashboard across their entire client book, AI-drafted recommendations they review and personally sign off on before a client ever sees them, and the audit log from Section 8 as their own compliance record. The advisor's existing registration is what makes the advice compliant; FinAgent is the tool, not (in this channel) the accountable party itself. *(This has a real regulatory nuance — see Section 9.4 and the Phase -0.5 legal gate in Section 12.)*

**Track B — Insights & Practice Tools (MFD/IFA):** the same underlying aggregation and analytics engine, repackaged without advice-generation, sold to the much larger AMFI-registered distributor population (Section 4.4) at a lower price point and a materially simpler compliance posture. This track carries the volume; Track A carries the credibility and the compliance-record moat (Section 2.1).

**Why this two-track approach, not just one:**
- **Solves cold start on both tracks.** One advisor or MFD conversation can bring dozens to hundreds of end-clients, versus one D2C signup at a time.
- **Solves the accountable-party bootstrap problem for Track A** — pending the Section 9.4 legal opinion — while Track B sidesteps that problem almost entirely by design.
- **Predictable, recurring B2B revenue** is easier to underwrite than consumer subscription churn, and Track B's larger addressable base reduces the whole plan's dependence on a small, shrinking population.
- **Distribution partnership as an accelerant:** explore an exclusive or preferred arrangement with an advisor or distributor professional body (e.g., an RIA/IFA association) for credibility and a channel that's genuinely slower for a well-funded incumbent to replicate than a product feature (Section 2.1). Worth testing during Phase -1, not deferred to Stage 2.

### 5.2 Secondary Channel — D2C Self-Directed

Once the advisor/distributor channel has validated the advisory engine's quality, open a consumer product on the same backend. Growth here should lean on the household net-worth feature (Section 7.3) as an organic, low-CAC referral loop — "see your and your spouse's combined net worth" is a natural invite mechanic — rather than paid acquisition, which is unlikely to beat well-funded incumbents on cost per install.

### 5.3 Validate Before You Build — Concierge Pilot *(governs Phase -1 in Section 12)*

Before writing Phase 1–4 code, run a manual pilot across **both** tracks separately: recruit 5–10 friendly RIAs/RAs for Track A and 5–10 friendly MFDs/IFAs for Track B, and, using spreadsheets plus an LLM chat interface instead of a built product, manually do for their client books what Stage 1's Phases 1–4 aim to automate. Charge for it, even a token amount, in both cohorts.

**Explicit, measurable pass/fail thresholds** (not vague impressions) for each cohort:
- At least 60% of piloted advisors/distributors are still engaged and paying (even a token amount) past month 2.
- At least half of end-clients report the output materially changed a decision they made.
- At least 2 of the 5–10 pilot participants in each cohort say, unprompted, they'd pay the full quoted price today.

This tests three unknowns cheaply per track — trust in an AI-assisted workflow, real end-client value, and willingness to pay — before months of engineering are committed to the automated version.

### 5.4 Kill Criteria & Pivot Paths *(NEW — v6, defined before the pilot runs)*

Decide these outcomes now, not after seeing which way the pilot leans:

- **If Track A (Advice Copilot) fails its thresholds but Track B (Insights) clears them:** pivot the primary wedge to an advice-free practice-management/analytics SaaS for MFDs. Defer the "advice" framing and its regulatory weight entirely; revisit Track A later once Track B revenue funds the effort.
- **If Track B fails but Track A clears its thresholds:** stay with the smaller, higher-trust RIA/RA wedge, but treat the TAM ceiling in Section 4.4 as real — plan the seed round around a smaller, longer-duration path to Series A, and lean harder on D2C (Section 5.2) as the compounding channel earlier than originally planned.
- **If both tracks fail their thresholds:** do not proceed to Phase 1 engineering on the B2B2C thesis. Pivot to D2C-first with a narrower differentiator (most likely the Financial Health Score / explainability retention hook, Section 7.4), and revisit the advisor/distributor channel only after the D2C product has independent traction.
- **If the Phase -0.5 legal opinion concludes FinAgent itself becomes the accountable advice-giver even under the B2B2C framing:** this is a cost/timeline input, not a plan-killer — individual RIA/RA registration is cheap and fast (~₹15–20k, Section 9.4). Re-sequence Phase 0 to prioritize the founder's own registration and proceed.
- **Governing rule:** don't spend Phase 1–4 engineering effort until at least one track clears its threshold, or until a deliberate, documented decision is made to proceed on hypothesis alone with a correspondingly shortened runway assumption.

---

## 6. Universal Multi-Asset Portfolio Aggregation Engine

FinAgent continuously aggregates and synchronizes every component of a user's net worth via automated integrations and intelligent document processing.

### 6.1 Ingestion Architecture — Account Aggregator First

FinAgent does **not** build its own bank/data-aggregation pipeline. It registers as a **Financial Information User (FIU)** under RBI's Account Aggregator (AA) framework and integrates with an existing licensed NBFC-AA (Finvu, OneMoney, CAMSFinServ, Setu AA, Anumati, or others). Data flows via consented pulls from regulated **Financial Information Providers (FIPs)**:

- **Mutual Funds:** Holding statements (CAS/NSDL/CDSL), active SIP schedules, NAV updates, historical expense ratios — via AA where the AMC/RTA is an onboarded FIP, else CAS PDF parsing as fallback.
- **Bank Accounts & Fixed Deposits:** Linked bank deposits, corporate FDs, interest payout schedules, maturity dates, premature-withdrawal rules — via AA.
- **Insurance:** Term, health, and other policies — via AA where the insurer is an onboarded FIP (coverage expanding over time), else manual entry.

**Activation target:** the AA-linking flow should be engineered so a new user sees a first net-worth number within 60 seconds of connecting their first account. Given INDmoney and peers have normalized instant aggregation, a slow or multi-step onboarding is a real churn risk before a user ever reaches the advisory layer that's supposed to be the differentiator — treat this as a hard product requirement for Phase 2, not a nice-to-have.

### 6.2 Manual / Document-Based Ingestion (Not on the AA Network)

These asset classes are **not currently AA-covered FIP categories** and require manual entry or OCR-based document ingestion:

- **Real Estate:** Property estimates, purchase cost basis, active mortgage balances, loan interest rates, rental income, tax deductions.
- **Government & Retirement Funds:** EPF passbooks, PPF accounts, NPS allocations, annuity projections — via passbook PDF upload and OCR parsing.
- **Gold & Precious Metals:** Physical gold bullion (manual entry), SGBs and gold ETFs (via broker/depository holdings, automated).
- **Crypto & Digital Assets** *[Stage 4]*: Exchange balances and non-custodial wallet tracking — deferred pending Stage 4 scoping.

---

## 7. Customized AI Financial Advisory & Goal Management

FinAgent acts as a proactive advisory layer, continuously evaluating total portfolio context to give actionable, bespoke guidance — always routed through a registered human Investment Adviser/Research Analyst as the accountable party (Section 9.4) on the Advice Copilot track, whether that human is a FinAgent-employed adviser (D2C) or the independent advisor using FinAgent as a tool (Track A, Section 5.1). On the Insights track (Track B), the same underlying analysis is surfaced as data and flags, not personalized recommendation text, with the MFD supplying the judgment.

### 7.1 Key Advisory Capabilities

- **Emergency Fund & Liquidity Guard:** Analyzes liquidity across bank accounts, FDs, and liquid funds; recommends recurring auto-investment in high-yield liquid instruments if reserves are insufficient.
- **Debt vs. Investment Arbitrage:** Evaluates debt interest rates against FD/investment returns; flags opportunities to reduce expensive debt.
- **Goal-Based Scenario Modeling:** Maps user life goals (e.g., "Retire at 50 with ₹4 crore," "Buy a ₹80 lakh home in 3 years") against current multi-asset growth rate; generates dynamic rebalancing strategies.
- **Cross-Asset Tax-Loss Harvesting:** Identifies unrealized capital losses across stocks, mutual funds, and (later) crypto to offset realized gains before the Indian financial year-end — logic built specifically around Indian LTCG/STCG and set-off rules, not a generic global model.

### 7.2 Example User Interaction Prompts

- *"Based on my total net worth including my rental property and EPF, am I on track to retire by 50?"*
- *"I have ₹5 lakh coming in as a bonus. Given my current equity, mutual fund, and real estate exposure, where should I invest it for the best risk-adjusted return?"*
- *"Rebalance my portfolio: sell enough of my tech-heavy stocks to lock in gains and buy ₹2 lakh worth of low-risk debt mutual funds."*
- *"Which of my fixed deposits matures soonest, and should I break it to pay off my remaining car loan?"*

### 7.3 Additional High-Value Features

- **Insurance Gap Analysis:** Aggregate term life, health, and vehicle policies (Section 6.1); flag under-insurance relative to income/dependents and coverage overlaps/redundancies.
- **Document Vault:** Secure storage for wills, insurance policies, EPF/PPF nomination records, and property deeds, with AI prompts for missing essentials (e.g., "No nominee set on your PPF account").
- **Life-Event-Triggered Replanning:** Marriage, a new child, a job change, or relocation automatically re-runs goal models rather than waiting for the user to manually request it.
- **Credit Layer:** Credit score tracking and loan-against-securities / loan-against-mutual-fund suggestions as cheaper alternatives to personal loans — a direct extension of the existing debt-arbitrage feature (7.1).
- **Family/Household Net Worth View:** Joint accounts, spouse holdings, and children's education goal tracking — most Indian household financial decisions are made at the household level, not individually. Doubles as the primary D2C referral/viral loop (Section 5.2).
- **Advisor/Distributor-Facing Mode (B2B2C):** The primary go-to-market channel (Section 5.1), across both Track A and Track B.
- **Recommendation Audit Log:** Every AI-generated suggestion is logged with the data inputs and reasoning that produced it, retrievable by the registered adviser and, if needed, a regulator. Close to a hard requirement once SEBI's IA/RA and algo frameworks are factored in (Section 9), and the foundation of the compliance-lock-in moat in Section 2.1.
- **Goal Backtesting/Scenario Simulator:** Let users stress-test a proposed allocation against historical market data before committing, reducing over-reliance on a single AI-generated recommendation for irreversible decisions.

### 7.4 Engagement, Trust & Explainability Layer

Two highest-impact additions aimed directly at the trust gap that separates FinAgent from a black-box robo-advisor, and at the retention problem every aggregation app eventually hits once the novelty of "seeing my net worth" wears off:

- **Financial Health Score:** A single 0–100 composite score (liquidity buffer, diversification, debt-to-asset ratio, insurance coverage, goal-progress trajectory) shown on first login and tracked over time. This is the highest-leverage retention and shareability feature in the spec, and the fallback D2C differentiator if the B2B2C tracks underperform (Section 5.4).
- **"Why This Recommendation" Panel:** Surfaces the same reasoning already captured for the Recommendation Audit Log (7.3) directly to the end user in plain language, not just to the regulator/adviser. Engineering cost is low — the audit log already has the data — but the trust payoff is disproportionate.

### 7.5 AI Advisory Evaluation & Reliability Framework *(NEW — v6)*

The AI is producing fiduciary-adjacent output that a licensed human ultimately signs off on. Advice-quality evaluation needs to be a first-class engineering deliverable from Phase 4 onward, not an afterthought bolted onto the audit log — this is the same discipline already applied to agent evaluation on other GCP/Vertex AI projects, reused here rather than reinvented.

- **Golden dataset.** Before Phase 4 ships, build a small (50–150 scenario) expert-verified test set spanning the capabilities in 7.1 — goal modeling, tax-loss harvesting, debt arbitrage, insurance gap analysis — each with an expected-correct answer or acceptable range signed off by a CA/CFP, not just the founder's own judgment.
- **Offline eval on every meaningful change.** Run the golden set against the advisory pipeline on every prompt, model, or retrieval change, and track pass-rate over time like a regression suite. This maps directly onto the Vertex AI Agent Engine Evaluation tooling already familiar from other agent projects — reuse that harness rather than building a bespoke one.
- **Online sampling.** During the concierge pilot and Stage 1 production, route a fixed share (10–20%) of live recommendations to a second human reviewer (the founder, or a fractional CA/CFP) blind to the AI's output, and compare. This catches systematic errors the golden set didn't anticipate — faster than waiting for a complaint.
- **Drift and regression monitoring.** Log the accept/edit/reject rate per advisor as a leading indicator. A rising edit-or-reject rate on a specific recommendation type is an early warning, before a client complaint or regulator inquiry — and it's also the labeled dataset that feeds the flywheel discussed in Section 2.1.
- **Hard failure modes to explicitly test for, not just hope the LLM avoids:** stale or wrong tax-year assumptions, incorrect LTCG/STCG holding-period math, double-counting assets across manually-entered and AA-linked sources, and recommending an action that's technically correct but ignores a goal or constraint the user stated in an earlier session (context loss). Each needs at least one golden-set case before Stage 1 launch.

---

## 8. Governance, Risk Control & Human-in-the-Loop Execution

> **DETERMINISTIC SAFETY GUARDRAIL:** *The LLM is strictly prohibited from executing trades autonomously. It acts as an intent parser that drafts an interactive "Order Confirmation Card." The user must review order parameters and authorize execution using biometric authentication (FaceID / TouchID / WebAuthn).*

### 8.1 Safety Principles

1. **Air-Gapped Orders:** The LLM outputs only draft order tickets. Execution APIs are air-gapped behind biometric confirmation.
2. **Ephemeral Order Tokens:** Order drafts expire within 60 seconds to protect against market price slippage.
3. **Multi-Agent Review:** Orders above a defined threshold trigger an automated dual-agent (bull/bear) panel detailing upside catalysts and downside risks before user confirmation.
4. **Regulatory Disclaimer:** Every advice response includes mandatory disclaimers ("Automated analysis for informational purposes. Not certified financial advice."). This is necessary but **not sufficient on its own** — see Section 9.4 on registration requirements that disclaimers do not substitute for.
5. **Algo Registration:** Every order-drafting strategy is registered and tagged with an exchange-issued Algo-ID through the partner broker before it can generate a live, executable draft (Section 9.3) — a hard SEBI requirement, not just an internal safety practice.

---

## 9. Regulatory & Custody Model

*(This section replaces the assumption in earlier drafts that FinAgent would independently build full brokerage infrastructure across multiple jurisdictions. Read this before starting Phase 1 build work.)*

### 9.1 The Core Decision: What Is FinAgent, Legally?

| Model | What it means | License required | Realistic timeline |
|---|---|---|---|
| **A. Pure Advisor/Aggregator** | FinAgent never touches money or holds securities. It reads data via the AA network and gives advice; execution happens through the user's existing broker or a partner broker's API under that broker's license. | SEBI Investment Adviser (IA) or Research Analyst (RA) registration | 3–6 months |
| **B. Algo/Advice Provider Under a Partner Broker** | FinAgent's AI drafts and routes orders, operating as a registered "algo provider" under a stockbroker's principal responsibility per SEBI's 2025 algo framework. | Partner agreement with a registered broker + Algo-ID registration, plus IA/RA registration for advice | 6–12 months |
| **C. Full Stockbroker** | FinAgent becomes its own SEBI-registered stockbroker, holds client funds/securities, connects directly to NSE/BSE. | SEBI stockbroker registration, exchange membership, depository participant tie-up, clearing corporation membership, substantial capital | 18–36+ months, significant capital |

**Recommendation: Model A, evolving toward Model B, built as two explicit, sequential stages — not decided once and built as one blend.** Model C is not a startup-stage decision — it is what Zerodha and Groww already spent years and real capital becoming. The differentiated wedge is the aggregation + AI advisory layer sold through the B2B2C channel (Section 5.1), not rebuilt brokerage infrastructure.

> **BUILD SEQUENCING (governs Section 12):**
> - **Stage 1 — Advisory-Only, Model A.** FinAgent aggregates data and gives advice/recommendations in natural language (Track A) or advice-free analytics (Track B). It does **not** execute or draft live orders. Where the AI suggests an action, the UI deep-links the user to their *existing* broker (Zerodha/Groww) to execute manually. No broker-partner agreement, no Algo-ID registration, no biometric order-confirmation flow needed yet — this stage only needs SEBI IA/RA registration where applicable (Section 9.4) and AA/FIU integration (Section 9.2).
> - **Stage 2 — In-App Execution, Model B.** Once Stage 1 has traction and a broker-partner agreement is signed, add in-app order drafting, the biometric HITL confirmation flow (Section 8.1), and Algo-ID-tagged execution (Section 9.3).
> - **Stage 3 — Full Stockbroker Transition, Model C.** Only once Stage 2 has meaningful order volume and revenue to justify the capital outlay. Detailed in Section 9.7 — a Series A/B-stage undertaking, not a pre-seed one.
> - **Stage 4 — International & Multi-Jurisdiction Expansion.** Only after Model C is stable domestically. Detailed in Section 9.8.
>
> **What this means for Cursor:** everything through Stage 1 is a pure engineering task once Phase -0.5 (legal opinion) and Phase -1 (pilot) both clear — hand it the spec and it can build end-to-end. Stage 2's *code* is also buildable in the same way, but it should not go live in production until the broker partnership and Algo-ID registration are actually in place. Treat every stage as "build the code now, flip it live only when the corresponding real-world registration is done."

### 9.2 Data Aggregation Licensing

Covered operationally in Section 6.1 — FinAgent integrates as an FIU with an existing licensed NBFC-AA rather than seeking its own RBI license for data aggregation.

### 9.3 AI-Drafted Orders — SEBI Algo Framework

SEBI's February 2025 circular established a mandatory framework for algorithmic and API-based order execution, fully binding on all stockbrokers from **April 1, 2026** (after a phased glide path through late 2025). Every automated order must carry an exchange-assigned Algo-ID and route through a SEBI-compliant broker API. Brokers are the legal principals responsible for every algorithm on their platform; algo providers — which is what FinAgent's order-drafting engine legally is — must partner with a registered broker rather than connect to exchanges directly.

Implication: the order-drafting logic in Sections 7 and 8 needs to be registered and Algo-ID-tagged through a partner broker before it can generate anything that reaches a live order — this is upstream of the biometric HITL gate, not a substitute for it.

### 9.4 Advisory Layer — SEBI IA/RA Registration and the Two-Track Structuring Question

The Track A advisory features in Section 7 constitute investment advice under Indian law, triggering SEBI Investment Adviser (IA) or Research Analyst (RA) registration depending on the exact activity. SEBI has eased entry for individuals in recent reforms — no minimum net worth requirement for individual RIA registration, two NISM certifications (X-A and X-B), and no prior experience mandated — with total registration cost typically in the ₹15,000–20,000-plus-GST range (exam fees separate). A human-registered IA/RA needs to sit behind the AI's output as the accountable party on Track A, at least initially.

**Three distinct paths to satisfy this, not one:**
1. **D2C path:** a FinAgent founder or early hire personally completes individual RIA/RA registration before any consumer-facing advice goes live. Fast and cheap relative to company-level registration, but a real prerequisite, not a formality.
2. **B2B2C Track A path:** sell FinAgent as a tool to advisors who are *already* SEBI-registered, so the accountable-party requirement is satisfied by the customer, not by FinAgent itself. More capital-efficient — but the exact legal boundary between "we are a software tool" and "we are ourselves giving advice through a channel partner" needs sign-off from a securities lawyer before this is relied upon.
3. **B2B2C Track B path (Insights, NEW — v6):** structure the MFD/IFA-facing product to stop short of personalized advice entirely — analytics, flags, and audits an MFD interprets themselves, no AI-generated recommendation text reaching an end client. This is a materially simpler compliance posture than paths 1–2, but "analytics that functionally implies a recommendation" is a real gray zone SEBI has enforced against before, and it needs its own explicit sign-off, not an assumption that avoiding the word "advice" is sufficient.

**Governing rule for v6 (see Section 12, Phase -0.5): get a written opinion covering all three paths above before recruiting a single pilot advisor or MFD, not after.** This is cheap (₹50k–1.5 lakh, Section 11.1) relative to the cost of building Phase 1–4 on a structuring assumption that doesn't hold.

### 9.5 KYC/AML Pipeline

- Video KYC / Aadhaar e-KYC for account opening (via a KYC Registration Agency, or inherited from a partner broker's existing KYC under Model A/B)
- PAN verification and CKYC record check
- Ongoing AML transaction monitoring, reusing the risk-engine infrastructure from Section 12 Phase 4
- Sanctions/PEP screening at onboarding

### 9.6 Data Security & Privacy Baseline

- Encryption at rest and in transit for all data pulled via the AA network
- Data minimization mirroring the AA framework's consent-scoped, time-bound pulls — not indefinite caching
- DPDP Act (India's data protection law) compliance for storage, breach notification, and deletion rights
- SOC 2 Type II (or equivalent) as a target before approaching banks/AMCs for direct API partnerships — not a Phase 0 requirement, but budget for it before the B2B2C channel scales past early pilot advisors, since compliance-conscious advisors will ask.

### 9.7 Model C — Full Stockbroker Transition (Detailed Plan)

**Trigger criteria — don't start this until:** Stage 2 has meaningful order volume and revenue, the partner-broker's commercial terms (revenue share, rate limits, feature gating) are visibly capping growth, and you can raise or already hold the capital below. This is a licensing-and-capital problem first, an engineering problem second.

**9.7.1 Licensing components**

| Component | Requirement | Notes |
|---|---|---|
| **Stockbroker registration** | Net worth roughly ₹5 crore–₹50 crore depending on membership category and segment, under SEBI's Stock Brokers Regulations, 2026 (notified January 2026, replacing the 1992 framework) | Also requires NISM certification for key personnel and a designated director resident in India for at least 182 days/year |
| **Exchange membership (NSE and/or BSE)** | Base Minimum Capital (BMC) deposit at each exchange, scaled by segment (cash, F&O, currency) | Exchange application ~3–4 weeks; SEBI due diligence/inspection ~30–45 working days; registration ~1–2 months after exchange approval; final setup (clearing accounts, trading terminals) ~2–3 weeks |
| **Depository Participant (NSDL and/or CDSL)** | Stockbroker-route net worth of roughly ₹5 crore per depository (raised from ₹3 crore in Feb 2024) | A lighter-weight NBFC route exists at ₹50 lakh net worth, but that only covers holding your *own* assets, not client demat accounts — not viable for a client-facing broker |
| **Clearing membership** | Either become a Self-Clearing Member of NSCCL/ICCL (highest capital requirement) or route through an existing Professional Clearing Member (PCM) as a Trading Member | The PCM route is materially cheaper and faster — most new brokers start here rather than seeking self-clearing status immediately |

**9.7.2 Technical build-out (in addition to licensing)**

- **Own Order Management System (OMS):** direct exchange connectivity via NSE/BSE CTCL or FIX-based APIs, replacing the Stage 2 partner-broker API dependency.
- **Own Risk Management System (RMS):** exchange-mandated real-time margin, exposure, and position-limit checks — this is a hard regulatory requirement for any trading member, not an internal nice-to-have, and typically needs to be certified/audited.
- **Back-office & regulatory reporting:** daily margin reporting, client fund segregation reporting, and other periodic filings to SEBI/exchanges — this is a genuinely large, ongoing compliance-engineering surface, not a one-time build.
- **Settlement & custody integration:** direct integration with the DP and clearing corporation for T+1 settlement.
- **Client migration tooling:** moving existing users' trading and demat relationships from the Stage 2 partner broker to FinAgent's own broker entity. This is a sensitive, regulated account-transfer process (client consent, demat account transfer instructions, KYC re-verification in some cases) — plan for it as its own project, not a background data migration.

**9.7.3 Realistic timeline and cost**
Registration/membership alone (stockbroker + exchange + DP + clearing route), once capital is committed, realistically runs 6–9 months. The parallel technical build (OMS/RMS/back-office/settlement) is comparable in duration, often 6–12 months given the compliance-audit requirements on RMS specifically. Combined capital requirement across stockbroker net worth, DP net worth, and BMC deposits can run into several crore rupees before a single client is migrated — this is realistically a Series A/B-stage initiative, funded by the revenue and credibility Stage 1–2 have already built, not a bootstrapped one.

### 9.8 Model D / Stage 4 — International & Multi-Jurisdiction Expansion (Detailed Plan)

Only pursue this once Model C is stable and generating predictable domestic revenue — attempting a US or crypto build in parallel with the Indian stockbroker transition would fragment both compliance surfaces at once.

- **Legal structure:** a separate legal entity (typically a US-incorporated subsidiary or sister company, not a branch of the Indian entity), since SEC/FINRA registration, tax treatment, and liability exposure need to be cleanly separated from the Indian regulated entity.
- **US brokerage path:** either (a) become an introducing broker/RIA partnered with an existing US broker-dealer (Alpaca and similar offer exactly this kind of partner-broker API, mirroring the Model B pattern from Stage 2), which is the faster and cheaper route, or (b) pursue full SEC/FINRA broker-dealer registration and SIPC membership directly — the US equivalent of Model C, with its own multi-month registration timeline and net-capital rules (Rule 15c3-1).
- **Crypto:** requires separate money-transmitter licensing on a state-by-state basis in the US (or the equivalent registration in whichever jurisdiction), and is realistically its own product line rather than a bolt-on to equities/MF trading.
- **Advisory logic fork, not extension:** US capital gains treatment, wash-sale rules, and retirement-account structures (401k/IRA) are different enough from India's LTCG/STCG and EPF/PPF rules that the advisory engine from Section 7 needs a genuine second implementation, not a config flag on the Indian one.
- **KYC/AML:** a fully separate stack — US identity verification, OFAC sanctions screening, and BSA/AML program requirements don't reuse the Aadhaar/PAN-based Indian KYC pipeline from Section 9.5 at all.

---

## 10. Team & Hiring Plan

**Founding team, minimum viable composition, with solo-founder feasibility made explicit *(revised — v6)*:**

| Role | Solo-founder feasible? | Hire trigger (metric-based, not calendar-based) |
|---|---|---|
| Technical founder | Yes | Founding role — carries Phases -1 through most of Stage 1 |
| Accountable-party registration holder | Yes — cheap, fast, do it regardless of which track wins | Before any D2C-facing advice output, and re-evaluated immediately once the Phase -0.5 legal opinion lands |
| Advisor/distributor-success & B2B2C sales | Founder can run the first 5–10 pilot relationships per track solo | Hire once combined active pipeline exceeds ~15–20 relationships, or once the founder's calendar — not the market — is the bottleneck to closing |
| Compliance/ops generalist (fractional) | No — needs at least fractional external support once registration work starts | Engage fractional support starting at Phase -0.5; stays fractional through Stage 1 |
| Second backend/AI engineer | No | Hire once MRR covers the fully-loaded cost for 6+ months, **or** once the Section 7.5 evaluation/reliability backlog is visibly slowing new-feature shipping — whichever comes first |
| Dedicated compliance officer | No | Hire once the combined B2B2C book crosses roughly 20–30 active advisors/distributors — compliance surface area is the trigger, not headcount elsewhere |
| Partnerships lead (Stage 2 broker negotiation) | No | Hire only once Stage 2 is actually approved to start (Section 9.1 sequencing), not before |

**One founder can realistically carry Stage -1 through most of Stage 1 solo, with fractional compliance support starting at Phase -0.5.** This is a genuinely achievable solo build. Stage 2 onward structurally requires a small team — don't commit to a Stage 2 timeline that implicitly assumes solo execution continues.

---

## 11. Financials, Costs & Funding Path

*Figures below are illustrative planning assumptions for budgeting purposes, not sourced quotes — confirm current pricing directly with each vendor/regulator and validate with a CA before finalizing a budget.*

### 11.1 Stage 1 Bootstrap Budget (illustrative, 12 months, pre-revenue-scale)

| Line item | Illustrative range |
|---|---|
| Written legal opinion — B2B2C structuring, both tracks (Section 9.4, Phase -0.5) *(NEW — v6)* | ₹50k–1.5 lakh |
| Incorporation & basic legal setup | ₹1–2 lakh |
| Individual RIA/RA registration + NISM exam fees (Section 9.4) | ₹20–30k |
| AA-NBFC integration (sandbox typically low/no-cost; production agreement setup) | ₹2–5 lakh — confirm directly with Setu/Finvu/OneMoney |
| Cloud infra + LLM API costs, scaling with pilot usage | ₹50k–1.5 lakh/month |
| CA/CFP time for golden-dataset sign-off and online-eval sampling (Section 7.5) *(NEW — v6)* | ₹30k–75k |
| DPDP-compliant security basics (SOC 2 readiness deferred, Section 9.6) | ₹1–3 lakh |
| Compliance/legal retainer | ₹1–2 lakh |
| **Total lean runway, 12 months, excluding founder salary** | **roughly ₹16–32 lakh** |

### 11.2 Funding Path

- **Stage 1–2:** pre-seed/seed, roughly $150k–500k (₹1.2–4 crore), sized to comfortably survive proving the **base-case** TAM scenario (Section 4.4), not the bull case — this covers 12–18 months of runway, 2–4 hires from Section 10, and the advisor/distributor-relationship-building GTM motion in Section 5.1.
- **Stage 3 (own stockbroker, Section 9.7):** explicitly a Series A/B-stage raise, sized to the several-crore net-worth/BMC/DP capital requirements in 9.7.1 — do not raise for this until Stage 2 has proven order volume and revenue against a partner broker.
- **Stage 4 (international):** a separate raise into the separate legal entity described in Section 9.8, only after Stage 3 is stable — do not fund this from the Indian entity's balance sheet.

---

## 12. High-Level Architecture & Roadmap

### PHASE -0.5 — Legal Structuring Opinion *(NEW — v6, precedes everything, including the pilot)*

Before recruiting a single pilot advisor or MFD, get a written opinion from a securities lawyer covering all three paths in Section 9.4: (a) whether the Track A "advisor's registration is the accountable party" structuring holds, (b) whether the Track B Insights framing can operate without triggering IA/RA-equivalent obligations for FinAgent or the MFD, and (c) the individual-founder-registration fallback if (a) fails. This gates Phase -1's cohort design — you need to know which populations you're legally allowed to pilot with, and under what product framing, before recruiting them. Budget and timeline in Section 11.1; expect 2–4 weeks.

### PHASE -1 — Concierge Validation

Run the two-track manual pilot described in Section 5.3, against the explicit pass/fail thresholds in 5.3 and the pivot logic in 5.4. This phase produces no code — its deliverable is evidence that advisors, distributors, and end-clients will pay for what Phases 0–4 intend to automate, and a first, real read on the pricing hypothesis in Section 4.2 and the TAM assumptions in Section 4.4.

### STAGE 1 — Advisory-Only Launch (Model A) — buildable once Phase -0.5 and Phase -1 both clear

**Phase 0 — Regulatory Foundation**
Complete SEBI IA/RA registration for whichever accountable-party path Phase -0.5/-1 validated. Stand up the KYC/AML vendor integration (Section 9.5). No broker-partner agreement needed yet.

**Phase 1 — Unified Multi-Asset Schema**
Database schemas for Users, Holdings (Equities, MFs, FDs, Real Estate, Insurance, Crypto*, Bank Accounts), Orders, Goals, and Advisor/Distributor/Client relationships (for the Track A and Track B multi-client views in Section 5.1).
*\*Crypto and Orders schemas included for future-proofing (used starting Stage 2); no order-execution logic runs against them yet.*

**Phase 2 — Multi-Asset Ingestion Pipeline**
Integrate as an FIU with a licensed NBFC-AA (Section 6.1). Build manual/OCR entry for EPF/PPF, real estate, and insurance policies not yet AA-covered (Section 6.2). Hold the 60-second-to-first-net-worth-number activation target (Section 6.1) as an explicit engineering requirement for this phase.

**Phase 3 — Natural Language Advisory Gateway (execution-free)**
LLM Tool Calling Gateway parses portfolio/goal questions and rebalancing *suggestions* into structured, human-readable recommendations (Track A) or into analytics/flags (Track B). Output is advisory text/data and deep-links to the user's existing broker app — **no order JSON, no Algo-ID, no live order draft is generated in this stage.**

**Phase 4 — Agentic Advisory & Optimization Engine**
LangGraph multi-agent Bull/Bear analysis, goal-forecasting simulator, cross-asset tax-loss harvester, insurance gap analysis, document vault, Financial Health Score, and explainability panel (Section 7). Stand up the golden-dataset evaluation harness and online-sampling review (Section 7.5) *before* this phase ships to production, not after. Every Track A output routed through the registered IA/RA as the accountable party, with a full audit trail (Section 7.3). Ship the advisor/distributor-facing multi-client mode (Section 5.1) alongside or immediately after the consumer version — **this is a real, shippable v1 product on its own, and Stage 1 ends here.**

### STAGE 2 — In-App Execution (Model B) — build behind a feature flag; enable only once a broker-partner agreement and Algo-ID registration are actually signed

**Phase 5 — Risk Engine & State Manager**
Deterministic risk checks (buying power, position concentration limits, slippage tolerance) and a Redis 60-second order token generator (Section 8.1).

**Phase 6 — Order Drafting & Execution Gateway**
Extend the Phase 3 gateway to emit live order JSON. Every generated strategy is registered and Algo-ID-tagged through the partner broker (Section 9.3) before it can touch a live order. Route orders through the partner broker's registered API for equities/F&O/MF. WebAuthn biometric approval (Section 8.1) before any order fires. IPO applications via UPI ASBA. **Stage 2 ends here.**

### STAGE 3 — Full Stockbroker Transition (Model C) — Series A/B-stage; do not start until Stage 2 has proven volume and revenue

**Phase 7 — Regulatory & Capital Buildout**
Raise/commit capital for stockbroker net worth, DP net worth, and exchange BMC deposits (Section 9.7.1). File SEBI stockbroker registration and NSE/BSE exchange membership applications in parallel. Register as a Depository Participant with NSDL and/or CDSL. Decide Self-Clearing Member vs. routing through an existing Professional Clearing Member (Section 9.7.1) — the PCM route is the faster, lower-capital starting point.

**Phase 8 — OMS/RMS & Direct Exchange Connectivity**
Build the Order Management System with direct NSE/BSE connectivity (CTCL/FIX), replacing the Stage 2 partner-broker API. Build and get certified the exchange-mandated Risk Management System for real-time margin/exposure/position checks. Build back-office and regulatory reporting pipelines (daily margin reports, client fund segregation reports) and settlement integration with the DP/clearing corporation (Section 9.7.2).

**Phase 9 — Client Migration & Cutover**
Migrate existing Stage 2 users from the partner broker to FinAgent's own broker entity: consented demat account transfer, re-KYC where required, phased cutover with the partner-broker relationship kept live as a fallback until the new stack is proven at scale. **Stage 3 ends here — FinAgent is now a full-stack, self-cleared (or PCM-routed) broker.**

### STAGE 4 — International & Multi-Jurisdiction Expansion — only after Stage 3 is stable and generating predictable domestic revenue

**Phase 10 — International Entity, Licensing & Advisory Fork**
Stand up a separate legal entity for the target market (Section 9.8). Choose the partner-broker-API path (faster, mirrors Stage 2's Model B pattern) or full SEC/FINRA broker-dealer registration (mirrors Stage 3's Model C, with US-specific net-capital rules). Build a genuinely separate advisory engine reflecting the target market's tax code (US capital gains/wash-sale rules vs. India's LTCG/STCG), a fully separate KYC/AML/sanctions-screening stack, and — if in scope — state-by-state crypto money-transmitter licensing as its own product line rather than a bolt-on.

---

*Regulatory details in Section 9 (including the Model C stockbroker/DP/clearing requirements in 9.7 and the international expansion notes in 9.8) reflect publicly available information as of August 2026, gathered for engineering/product planning purposes only — this is not legal advice. The RIA/RA/MFD population figures in Sections 0, 4.4, and 5.1 are drawn from SEBI/AMFI-adjacent public reporting as of mid-2026 and should be re-verified directly against SEBI's and AMFI's own registers before finalizing any pricing or funding model — third-party trackers vary slightly and the RIA count specifically is reported as declining. Business-model, GTM, team, and financial figures in Sections 4, 5, 10, and 11 are planning hypotheses to be pressure-tested against real pilot data (Section 5.3–5.4), not verified benchmarks. Confirm current SEBI/RBI/NSDL/CDSL requirements with a securities lawyer, and budget/pricing assumptions with a CA, before finalizing any path; the algo-trading, IA/RA, and stockbroker frameworks are all actively evolving (full SEBI algo enforcement began April 1, 2026; the Stock Brokers Regulations, 2026 took effect January 7, 2026).*
