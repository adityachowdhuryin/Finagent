// server/routes/syndicates.js
// Institutional Alternative Investments & Pre-IPO Secondary Marketplace Rails
// Live secondary quotes, 409A valuation spreads, accredited investor KYC verification, SPV subscription commitments, and fractional private credit

const crypto = require('crypto');

const UNICORN_SECONDARY_DEALS = [
  {
    id: 'spv_spacex_2026',
    company: 'SpaceX (Space Exploration Technologies Corp.)',
    ticker: 'SPCX (Pre-IPO)',
    logo: '🚀',
    category: 'Deep Tech & Aerospace',
    impliedValuation: '$210B',
    secondaryPrice: '$112.50 / share',
    lastRoundValuation: '$180B (Tender Offer)',
    valuationSpread409A: '-14.2% (Trading at discount to private institutional broker quote)',
    discountBadge: '14.2% Institutional Discount',
    stage: 'Late Stage / Series N',
    minCommitment: 25000,
    minCommitmentINR: 2000000,
    targetAllocation: 5000000,
    filledAllocation: 3850000,
    structure: 'Delaware Series LLC (FinAgent Alpha SPV IX)',
    mgmtFee: '1.5% p.a.',
    carriedInterest: '15%',
    liquidityHorizon: '18-24 months (Tender / Secondary windows)',
    status: 'ACTIVE_SYNDICATE_OPEN',
    thesis: 'Starlink cashflow inflecting positive with 4M+ active subscribers globally; Starship orbital operations unlocking multi-payload DoD manifest.'
  },
  {
    id: 'spv_stripe_2026',
    company: 'Stripe Inc.',
    ticker: 'STRP (Pre-IPO)',
    logo: '💳',
    category: 'Global Fintech & Payments',
    impliedValuation: '$70B',
    secondaryPrice: '$27.80 / share',
    lastRoundValuation: '$65B',
    valuationSpread409A: '-8.5% (Fair Value Spread vs Latest 409A Appraisal)',
    discountBadge: '8.5% Secondary Discount',
    stage: 'Late Stage / Pre-IPO Direct Listing',
    minCommitment: 15000,
    minCommitmentINR: 1200000,
    targetAllocation: 3000000,
    filledAllocation: 2450000,
    structure: 'Delaware Series LLC (FinAgent Stripe SPV II)',
    mgmtFee: '1.0% p.a.',
    carriedInterest: '10%',
    liquidityHorizon: '12-18 months (Anticipated S-1 Registration)',
    status: 'ACTIVE_SYNDICATE_OPEN',
    thesis: 'Over $1T in total transaction volume processed annually; expanding AI billing infrastructure powering leading frontier lab subscriptions.'
  },
  {
    id: 'spv_openai_2026',
    company: 'OpenAI LLC / Inc.',
    ticker: 'OPAI (Pre-IPO)',
    logo: '🧠',
    category: 'Frontier Artificial Intelligence',
    impliedValuation: '$157B',
    secondaryPrice: '$135.00 / share',
    lastRoundValuation: '$157B (Thrive / Softbank Round)',
    valuationSpread409A: '+1.2% (Par with latest $6.6B primary financing)',
    discountBadge: 'Par Allocation Access',
    stage: 'Growth Round / Corporate Restructuring',
    minCommitment: 50000,
    minCommitmentINR: 4000000,
    targetAllocation: 7500000,
    filledAllocation: 6900000,
    structure: 'Cayman Islands SPV / Delaware Series LLC',
    mgmtFee: '2.0% p.a.',
    carriedInterest: '20%',
    liquidityHorizon: '24-36 months',
    status: 'LIMITED_ALLOCATION_REMAINING',
    thesis: 'Dominant enterprise LLM platform with 250M+ weekly active users; corporate equity restructuring establishing traditional fiduciary governance.'
  },
  {
    id: 'spv_anthropic_2026',
    company: 'Anthropic PBC',
    ticker: 'ANTH (Pre-IPO)',
    logo: '⚡',
    category: 'Enterprise AI & Cognitive Safety',
    impliedValuation: '$40B',
    secondaryPrice: '$38.20 / share',
    lastRoundValuation: '$40B (Amazon / Google Syndicate)',
    valuationSpread409A: '-6.4% (Secondary block sale discount)',
    discountBadge: '6.4% Block Discount',
    stage: 'Series D Extension',
    minCommitment: 25000,
    minCommitmentINR: 2000000,
    targetAllocation: 4000000,
    filledAllocation: 3100000,
    structure: 'Delaware Series LLC (FinAgent Claude SPV)',
    mgmtFee: '1.5% p.a.',
    carriedInterest: '15%',
    liquidityHorizon: '24-36 months',
    status: 'ACTIVE_SYNDICATE_OPEN',
    thesis: 'Leading choice for enterprise coding benchmarks and high-context constitutional AI reasoning across Fortune 500 tech stacks.'
  },
  {
    id: 'spv_databricks_2026',
    company: 'Databricks Inc.',
    ticker: 'DATA (Pre-IPO)',
    logo: '🧱',
    category: 'Data Lakehouse & GenAI Infrastructure',
    impliedValuation: '$43B',
    secondaryPrice: '$73.50 / share',
    lastRoundValuation: '$43B',
    valuationSpread409A: '-11.0% (Employee secondary liquidity pool)',
    discountBadge: '11.0% Employee Pool Discount',
    stage: 'Pre-IPO',
    minCommitment: 20000,
    minCommitmentINR: 1600000,
    targetAllocation: 2500000,
    filledAllocation: 1950000,
    structure: 'Delaware Series LLC',
    mgmtFee: '1.25% p.a.',
    carriedInterest: '12%',
    liquidityHorizon: '12-18 months',
    status: 'ACTIVE_SYNDICATE_OPEN',
    thesis: 'Lakehouse platform processing exabytes of enterprise telemetry with ARR crossing $2.4B and positive free cash flows.'
  }
];

const PRIVATE_CREDIT_SYNDICATES = [
  {
    id: 'cred_saas_senior_2026',
    name: 'Apollo / Vista Senior Secured SaaS ARR Credit Vault',
    category: 'Senior Secured Private Credit',
    netYield: '11.4% Net APR',
    distribFrequency: 'Monthly Cash Distribution',
    ltv: '28% Loan-to-Value',
    collateral: 'First-lien perfected security interest in recurring B2B software contracts',
    term: '24 Months',
    minCommitment: 10000,
    minCommitmentINR: 800000,
    targetVault: '$12,000,000',
    filledVault: '$9,800,000',
    riskScore: 'A+ Rated Credit Standard',
    status: 'OPEN_FOR_SUBSCRIPTION'
  },
  {
    id: 'cred_infra_green_2026',
    name: 'Brookfield Clean Transition Infrastructure Bridge Facility',
    category: 'Asset-Backed Infrastructure Debt',
    netYield: '9.85% Net APR',
    distribFrequency: 'Quarterly Cash Distribution',
    ltv: '42% Loan-to-Cost',
    collateral: 'Direct charge on operating utility-scale battery storage & solar farms',
    term: '36 Months',
    minCommitment: 25000,
    minCommitmentINR: 2000000,
    targetVault: '$25,000,000',
    filledVault: '$21,400,000',
    riskScore: 'AA- Rated Institutional Credit',
    status: 'OPEN_FOR_SUBSCRIPTION'
  },
  {
    id: 'cred_receivable_bridge_2026',
    name: 'Institutional Global Trade Receivable Short-Duration Vault',
    category: 'Short-Duration Factoring & Working Capital',
    netYield: '12.80% Net APR',
    distribFrequency: 'Monthly Cash Distribution',
    ltv: '18% Revolving Cushion',
    collateral: 'Credit-insured investment grade Fortune 500 invoices (Allianz/Euler Hermes)',
    term: '12 Months (Rolling)',
    minCommitment: 15000,
    minCommitmentINR: 1200000,
    targetVault: '$8,000,000',
    filledVault: '$6,950,000',
    riskScore: 'A Rated Insured Credit',
    status: 'OPEN_FOR_SUBSCRIPTION'
  }
];

const { saveSyndicateCommitment, getSyndicateCommitments } = require('../db/database');

async function getSyndicateDeals(req, res) {
  const market = req.query.market || 'US';

  return res.json({
    success: true,
    market,
    accreditedInvestorThresholds: {
      US: {
        income: '$200,000 individually / $300,000 joint for past 2 years',
        netWorth: '$1,000,000+ excluding primary residence',
        certification: 'SEC Rule 501 of Regulation D (Series 7, 65, or 82 license)'
      },
      IN: {
        income: '₹50 Lakhs annual gross income',
        netWorth: '₹5 Crores minimum liquid net worth',
        certification: 'SEBI Accredited Investor (Regulation 21 of AIF Regulations)'
      }
    }[market],
    unicornSecondaries: UNICORN_SECONDARY_DEALS,
    privateCredit: PRIVATE_CREDIT_SYNDICATES,
    myCommitments: getSyndicateCommitments(50)
  });
}

async function commitToSyndicate(req, res) {
  const {
    dealId,
    dealType = 'UNICORN_SECONDARY',
    commitmentAmount,
    amount: rawAmount,
    investorName: rawInvestorName,
    investorId,
    investorEntity = 'Individual Accredited Investor',
    market = 'US',
    accreditedConfirmed = true
  } = req.body;

  const investorName = rawInvestorName || investorId || 'Alex Chen';

  if (!accreditedConfirmed) {
    return res.status(403).json({
      success: false,
      error: 'Accredited Investor verification (SEC Rule 501 / SEBI AIF) is legally required prior to capital commitment.'
    });
  }

  const allDeals = dealType === 'UNICORN_SECONDARY' ? UNICORN_SECONDARY_DEALS : PRIVATE_CREDIT_SYNDICATES;
  const targetDeal = allDeals.find(d => d.id === dealId) || allDeals[0];

  const min = market === 'US' ? (targetDeal.minCommitment || 10000) : (targetDeal.minCommitmentINR || 1000000);
  const amount = Number(commitmentAmount !== undefined ? commitmentAmount : rawAmount) || min;

  if (amount < min) {
    return res.status(400).json({
      success: false,
      error: `Commitment amount must meet the syndicate minimum of ${market === 'US' ? '$' + min.toLocaleString() : '₹' + min.toLocaleString()}.`
    });
  }

  const commitmentId = `SPV-COMMIT-${Date.now().toString().slice(-6)}`;
  const timestamp = new Date().toISOString();
  const subAgreementHash = crypto.createHash('sha256').update(`${commitmentId}-${investorName}-${amount}-${timestamp}`).digest('hex');

  const newCommitment = {
    commitmentId,
    dealId: targetDeal.id,
    company: targetDeal.company || targetDeal.name,
    dealType,
    amount,
    currency: market === 'US' ? '$' : '₹',
    investorName,
    investorEntity,
    status: 'ALLOCATION_CONFIRMED',
    executedAt: timestamp,
    digitalSignatureHash: subAgreementHash,
    structure: targetDeal.structure || 'Asset-Backed SPV Vault',
    estimatedUnits: Number((amount / 100).toFixed(2)),
    capitalCallDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    custodianBank: market === 'US' ? 'Silicon Valley Bank (Div. of First Citizens) / Apex Clearing' : 'HDFC Bank Custody / ICICI Securities'
  };

  saveSyndicateCommitment(newCommitment);

  return res.json({
    success: true,
    message: `Allocation of ${market === 'US' ? '$' : '₹'}${amount.toLocaleString()} in ${targetDeal.company || targetDeal.name} successfully reserved!`,
    commitment: newCommitment
  });
}

module.exports = {
  getSyndicateDeals,
  commitToSyndicate
};
