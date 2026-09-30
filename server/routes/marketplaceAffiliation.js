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

module.exports = {
  getMarketplaceOffers,
  claimOffer,
};
