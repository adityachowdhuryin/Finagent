// server/routes/marketplaceAffiliation.js
// High-Bounty Financial Product Affiliate Marketplace & User Cashback Incentive Engine

const crypto = require('crypto');

const marketplaceOffersUS = [
  {
    id: 'off_us_01',
    category: 'Credit Cards',
    institution: 'JPMorgan Chase',
    title: 'Chase Sapphire Preferred® Card',
    bounty: 200.00,
    userCashback: 75.00,
    currency: 'USD',
    headline: 'Earn 60,000 Bonus Points (~$750 in travel)',
    apr: '21.49% - 28.49% Variable',
    annualFee: 95.00,
    matchReason: 'Your credit score of 782 gives you a 96% approval probability with zero credit score impact on pre-approval.',
    applyUrl: 'https://creditcards.chase.com/a1/sapphire/preferred',
    badge: 'Best Travel Card',
  },
  {
    id: 'off_us_02',
    category: 'Mortgage Refinance',
    institution: 'SoFi Lending Corp',
    title: '30-Year Fixed Rate Refinance',
    bounty: 3500.00,
    userCashback: 500.00,
    currency: 'USD',
    headline: 'Drop Your Rate from 6.85% to 5.625% APR',
    apr: '5.625% APR Fixed',
    annualFee: 0,
    matchReason: 'Based on your home equity of $185k, refinancing eliminates $212/mo in PMI and cuts $480/mo off your mortgage.',
    applyUrl: 'https://www.sofi.com/home-loans/mortgage-refinance/',
    badge: 'Save $57,000 Lifetime',
  },
  {
    id: 'off_us_03',
    category: 'Term Life Insurance',
    institution: 'Ladder Life Insurance',
    title: '$1,500,000 20-Year Term Policy',
    bounty: 180.00,
    userCashback: 50.00,
    currency: 'USD',
    headline: 'Instant Coverage from $38/mo with No Medical Exam',
    apr: 'N/A',
    annualFee: 456.00,
    matchReason: 'Replaces expensive whole life policy, saving $145/month while tripling coverage.',
    applyUrl: 'https://www.ladderlife.com/',
    badge: '10x Income Protection',
  }
];

const marketplaceOffersIN = [
  {
    id: 'off_in_01',
    category: 'Credit Cards',
    institution: 'HDFC Bank Ltd',
    title: 'HDFC Regalia Gold Credit Card',
    bounty: 2500.00,
    userCashback: 1000.00,
    currency: 'INR',
    headline: 'Complimentary Club Marriott & Flight Vouchers',
    apr: '42.0% p.a.',
    annualFee: 2500.00,
    matchReason: 'CIBIL score 794 qualifies you for instant pre-approved issuance with zero joining fee waiver.',
    applyUrl: 'https://www.hdfcbank.com/personal/pay/cards/credit-cards/regalia-gold',
    badge: 'Best Lifestyle Card',
  },
  {
    id: 'off_in_02',
    category: 'Home Loan Balance Transfer',
    institution: 'Axis Bank Home Loans',
    title: 'Home Loan Balance Transfer @ 8.35% p.a.',
    bounty: 35000.00,
    userCashback: 10000.00,
    currency: 'INR',
    headline: 'Cut Existing 9.15% Loan Interest to 8.35%',
    apr: '8.35% p.a. Repo-Linked',
    annualFee: 0,
    matchReason: 'On your ₹34.5L outstanding balance, switching saves ₹1,850/month in EMI and ₹4.8 Lakhs total interest.',
    applyUrl: 'https://www.axisbank.com/retail/loans/home-loan',
    badge: 'Save ₹4.8L Interest',
  },
  {
    id: 'off_in_03',
    category: 'Term Life Insurance',
    institution: 'HDFC Life Click 2 Protect',
    title: '₹2 Crore Term Life Cover till Age 65',
    bounty: 3000.00,
    userCashback: 1000.00,
    currency: 'INR',
    headline: 'Starting at ₹1,120/month with Critical Illness Rider',
    apr: 'N/A',
    annualFee: 13440.00,
    matchReason: 'Satisfies your recommended 15x annual income protection benchmark.',
    applyUrl: 'https://www.hdfclife.com/term-insurance-plans',
    badge: '100% Claim Settlement',
  }
];

// Institutional Origination Bounties & Syndicate Carry Deals (Engine 3)
const institutionalBounties = {
  US: [
    {
      id: 'inst_esop_us',
      category: 'ESOP Non-Recourse Loan',
      partner: 'Quid Capital / LiquidStock Partners',
      title: 'Non-Recourse ESOP Exercise Financing',
      originationBountyRate: '1.50% of Loan Amount',
      sampleLoanAmount: 100000,
      bountyUSD: 1500,
      userCashbackUSD: 300,
      headline: 'Exercise private unicorn options without personal capital risk',
      terms: 'Non-recourse pledge against underlying shares. FinAgent earns 1.5% origination fee.',
      targetCompanies: ['OpenAI', 'SpaceX', 'Stripe', 'Databricks', 'Canva'],
      status: 'ACTIVE_ORIGINATING'
    },
    {
      id: 'inst_spv_spacex',
      category: 'Pre-IPO Secondary Syndicate',
      partner: 'FinAgent Alpha SPV IX (Delaware Series LLC)',
      title: 'SpaceX Pre-IPO Secondary SPV Commitment',
      originationBountyRate: '$1,500 Admin Fee + 15% Carried Interest',
      sampleCommitmentUSD: 50000,
      bountyUSD: 1500,
      carriedInterestPct: 15,
      headline: '$210B Implied Valuation at 14.2% Institutional Discount',
      terms: 'FinAgent collects $1,500 syndication fee + 15% carry on exit gains (0% carry for FinAgent Black).',
      status: 'ACTIVE_ORIGINATING'
    },
    {
      id: 'inst_credit_us',
      category: 'Private Credit Syndicate',
      partner: 'Upper90 Growth Credit Syndicate',
      title: 'Senior Secured B2B SaaS Private Debt',
      originationBountyRate: '1.00% Institutional Placement Fee',
      sampleCommitmentUSD: 25000,
      bountyUSD: 250,
      headline: '11.8% APY Floating Monthly Cash Yield',
      terms: '1st Lien Senior Security with warrants. 1% placement fee earned by FinAgent.',
      status: 'ACTIVE_ORIGINATING'
    }
  ],
  IN: [
    {
      id: 'inst_esop_in',
      category: 'ESOP Exercise Facility',
      partner: 'Stride Ventures / InCred Capital',
      title: 'Indian Unicorn ESOP Exercise Line',
      originationBountyRate: '1.50% of Sanctioned Facility',
      sampleLoanAmount: 2500000,
      bountyINR: 37500,
      userCashbackINR: 7500,
      headline: 'Fund Perquisite Tax (TDS) and strike price seamlessly',
      terms: 'Non-dilutive financing against unlisted vested options. 1.5% partner bounty.',
      targetCompanies: ['Swiggy', 'Razorpay', 'Zepto', 'Meesho', 'Groww'],
      status: 'ACTIVE_ORIGINATING'
    },
    {
      id: 'inst_spv_in',
      category: 'Unlisted Late-Stage Pre-IPO',
      partner: 'FinAgent Bharat Growth SPV IV',
      title: 'Tier-1 Indian Tech Unicorn Block Syndicate',
      originationBountyRate: '2.0% Structuring Fee + 10% Carry',
      sampleCommitmentINR: 1500000,
      bountyINR: 30000,
      carriedInterestPct: 10,
      headline: 'SEBI Cat-II AIF Direct Transfer Window',
      terms: 'Dematerialized share transfer to investor CDSL/NSDL demat. 2% structuring fee + 10% carry.',
      status: 'ACTIVE_ORIGINATING'
    },
    {
      id: 'inst_credit_in',
      category: 'Venture Debt & Invoice Discounting',
      partner: 'KredX / Northern Arc Capital',
      title: 'Senior Asset-Backed Commercial Paper Syndicate',
      originationBountyRate: '1.20% Placement Bounty',
      sampleCommitmentINR: 500000,
      bountyINR: 6000,
      headline: '12.4% p.a. T-Bill Plus Private Yield',
      terms: 'Escrow-backed invoice discounting pool. 1.2% placement bounty paid to FinAgent.',
      status: 'ACTIVE_ORIGINATING'
    }
  ]
};

const { saveBountyClaim, getBountyClaims } = require('../db/database');

/**
 * GET /api/marketplace/offers
 */
function getMarketplaceOffers(req, res) {
  const market = (req.query.market || 'US').toUpperCase();
  const offers = market === 'US' ? marketplaceOffersUS : marketplaceOffersIN;

  res.json({
    success: true,
    market,
    totalOffers: offers.length,
    offers,
  });
}

/**
 * GET /api/affiliation/bounty-ledger
 * Returns full institutional origination bounties, syndicate carry rates, and revenue ledger
 */
function getBountyLedger(req, res) {
  const market = (req.query.market || 'US').toUpperCase();
  const retailOffers = market === 'US' ? marketplaceOffersUS : marketplaceOffersIN;
  const instDeals = institutionalBounties[market] || institutionalBounties.US;

  // Aggregate metrics
  const totalBountyPotential = instDeals.reduce((sum, d) => sum + (market === 'US' ? (d.bountyUSD || 0) : (d.bountyINR || 0)), 0) +
    retailOffers.reduce((sum, r) => sum + (r.bounty || 0), 0);

  res.json({
    success: true,
    market,
    currency: market === 'IN' ? 'INR' : 'USD',
    institutionalDeals: instDeals,
    retailOffers,
    totalBountyPotential,
    carryStructures: {
      standardCarry: '10% to 15% on net capital gains',
      finagentBlackWaiver: '0% Carry Waiver (Black Tier exclusive perk)'
    },
    recentClaims: getBountyClaims(10),
  });
}

/**
 * POST /api/marketplace/claim-offer
 */
function claimOffer(req, res) {
  const { offerId, userEmail = 'user@example.com' } = req.body;
  const trackingCode = `CLM_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  res.json({
    success: true,
    message: 'Pre-qualified offer initiated! Bonus tracking token registered.',
    trackingCode,
    cashbackStatus: 'PENDING_APPROVAL_VERIFICATION',
  });
}

/**
 * POST /api/affiliation/claim-cashback
 */
function claimCashback(req, res) {
  const { dealId, userEmail = 'investor@finagent.app', dealCategory = 'Institutional' } = req.body;
  const claimRef = `CB-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  const claimRecord = {
    claimRef,
    dealId,
    userEmail,
    dealCategory,
    status: 'CLAIM_SUBMITTED_ATTRIBUTED',
    timestamp: new Date().toISOString(),
    payoutTimeline: '30-45 days following institution verification'
  };

  saveBountyClaim(claimRecord);

  res.json({
    success: true,
    claim: claimRecord,
    message: 'Cashback claim submitted! Attribution tracked with institutional partner.'
  });
}

module.exports = {
  getMarketplaceOffers,
  claimOffer,
  getBountyLedger,
  claimCashback,
};

