const express = require('express');
const router = express.Router();

/**
 * Indian Credit Card Reward Maximizer & Spend Router
 * Database of 15 top premium & cashback cards in India
 */

const CARDS_DB = [
  {
    id: 'hdfc_infinia',
    name: 'HDFC Infinia Metal',
    issuer: 'HDFC Bank',
    type: 'Super Premium (Reward Points)',
    baseRatePct: 3.33,
    categoryRates: {
      flights: { ratePct: 16.5, portal: 'SmartBuy 5X (10,000 pts/mo cap)' },
      hotels: { ratePct: 33.0, portal: 'SmartBuy 10X (10,000 pts/mo cap)' },
      amazon: { ratePct: 9.9, portal: 'SmartBuy Gyftr Instant Vouchers' },
      dining: { ratePct: 6.6, portal: 'Swiggy / Zomato Gyftr Vouchers' },
      groceries: { ratePct: 3.33, portal: 'Direct POS / Gyftr' },
      hospital: { ratePct: 3.33, portal: 'Standard POS (No capping)' },
      rent: { ratePct: 0, portal: 'Excluded (1% fee + GST)' },
      fuel: { ratePct: 0, portal: '1% surcharge waiver only' },
      utility: { ratePct: 3.33, portal: 'Direct bill pay' },
      electronics: { ratePct: 9.9, portal: 'SmartBuy Apple / Croma vouchers' },
    },
    valuationINRPerPoint: 1.0, // 1 point = ₹1 for flights/hotels
  },
  {
    id: 'hdfc_diners_black',
    name: 'HDFC Diners Club Black',
    issuer: 'HDFC Bank',
    type: 'Super Premium',
    baseRatePct: 3.33,
    categoryRates: {
      flights: { ratePct: 16.5, portal: 'SmartBuy 5X' },
      hotels: { ratePct: 33.0, portal: 'SmartBuy 10X' },
      amazon: { ratePct: 9.9, portal: 'SmartBuy Gyftr' },
      dining: { ratePct: 6.6, portal: 'SmartBuy Gyftr' },
      groceries: { ratePct: 3.33, portal: 'Standard POS' },
      hospital: { ratePct: 3.33, portal: 'Standard POS' },
      rent: { ratePct: 0, portal: 'Excluded' },
      fuel: { ratePct: 0, portal: 'Excluded' },
      utility: { ratePct: 3.33, portal: 'Standard POS' },
      electronics: { ratePct: 9.9, portal: 'SmartBuy Gyftr' },
    },
    valuationINRPerPoint: 1.0,
  },
  {
    id: 'axis_atlas',
    name: 'Axis Bank Atlas',
    issuer: 'Axis Bank',
    type: 'Travel & Miles',
    baseRatePct: 4.0, // 2 Edge Miles per ₹100 = 4 airline miles (~₹4)
    categoryRates: {
      flights: { ratePct: 10.0, portal: 'Direct Airline Websites (5 Edge Miles/₹100)' },
      hotels: { ratePct: 10.0, portal: 'Direct Hotel Bookings (5 Edge Miles/₹100)' },
      amazon: { ratePct: 4.0, portal: 'Standard Spend' },
      dining: { ratePct: 4.0, portal: 'Standard Spend' },
      groceries: { ratePct: 4.0, portal: 'Standard Spend' },
      hospital: { ratePct: 4.0, portal: 'Direct POS' },
      rent: { ratePct: 0, portal: 'Excluded' },
      fuel: { ratePct: 0, portal: 'Excluded' },
      utility: { ratePct: 0, portal: 'Excluded' },
      electronics: { ratePct: 4.0, portal: 'Standard Spend' },
    },
    valuationINRPerPoint: 2.0, // 1 Edge Mile = 2 Accor/Aviation Miles
  },
  {
    id: 'sbi_cashback',
    name: 'SBI Cashback Card',
    issuer: 'SBI Cards',
    type: 'Pure Cashback',
    baseRatePct: 1.0,
    categoryRates: {
      flights: { ratePct: 5.0, portal: 'MakeMyTrip / ClearTrip online (Capped at ₹5,000/mo)' },
      hotels: { ratePct: 5.0, portal: 'Any Online Hotel Booking (Capped at ₹5,000/mo)' },
      amazon: { ratePct: 5.0, portal: 'Direct Online Checkout' },
      dining: { ratePct: 5.0, portal: 'Swiggy / Zomato online' },
      groceries: { ratePct: 5.0, portal: 'Blinkit / Zepto / Instamart online' },
      hospital: { ratePct: 1.0, portal: 'Offline POS (1%)' },
      rent: { ratePct: 0, portal: 'Excluded' },
      fuel: { ratePct: 0, portal: 'Excluded' },
      utility: { ratePct: 0, portal: 'Excluded' },
      electronics: { ratePct: 5.0, portal: 'Any online store (Capped at ₹5,000/mo)' },
    },
    valuationINRPerPoint: 1.0, // Direct statement credit
  },
  {
    id: 'icici_amazon_pay',
    name: 'ICICI Amazon Pay',
    issuer: 'ICICI Bank',
    type: 'Pure Cashback (Prime)',
    baseRatePct: 1.0,
    categoryRates: {
      flights: { ratePct: 5.0, portal: 'Amazon Flights' },
      hotels: { ratePct: 5.0, portal: 'Amazon Hotels' },
      amazon: { ratePct: 5.0, portal: 'Amazon Shopping (Unlimited 5% cashback)' },
      dining: { ratePct: 1.0, portal: 'Standard POS' },
      groceries: { ratePct: 5.0, portal: 'Amazon Fresh (5%)' },
      hospital: { ratePct: 1.0, portal: 'Hospital POS (1%)' },
      rent: { ratePct: 0, portal: 'Excluded' },
      fuel: { ratePct: 0, portal: '1% waiver only' },
      utility: { ratePct: 2.0, portal: 'Amazon Pay Bill Desk' },
      electronics: { ratePct: 5.0, portal: 'Amazon.in' },
    },
    valuationINRPerPoint: 1.0,
  },
  {
    id: 'tata_neu_infinity',
    name: 'Tata Neu Infinity HDFC',
    issuer: 'HDFC Bank',
    type: 'Co-Branded UPI & NeuCoins',
    baseRatePct: 1.5, // 1.5% NeuCoins on UPI & general spends
    categoryRates: {
      flights: { ratePct: 10.0, portal: 'Air India / Tata Neu app' },
      hotels: { ratePct: 10.0, portal: 'IHCL Taj / Vivanta hotels' },
      amazon: { ratePct: 1.5, portal: 'Standard Spend' },
      dining: { ratePct: 1.5, portal: 'Standard Spend' },
      groceries: { ratePct: 10.0, portal: 'BigBasket via Tata Neu' },
      hospital: { ratePct: 10.0, portal: 'Tata 1mg Medicines' },
      rent: { ratePct: 0, portal: 'Excluded' },
      fuel: { ratePct: 0, portal: 'Excluded' },
      utility: { ratePct: 5.0, portal: 'Tata Neu Bill Pay' },
      electronics: { ratePct: 10.0, portal: 'Croma via Tata Neu' },
    },
    valuationINRPerPoint: 1.0,
  },
  {
    id: 'axis_airtel',
    name: 'Airtel Axis Bank',
    issuer: 'Axis Bank',
    type: 'Utility & Bills',
    baseRatePct: 1.0,
    categoryRates: {
      flights: { ratePct: 1.0, portal: 'Standard spend' },
      hotels: { ratePct: 1.0, portal: 'Standard spend' },
      amazon: { ratePct: 1.0, portal: 'Standard spend' },
      dining: { ratePct: 10.0, portal: 'Swiggy / Zomato (Capped at ₹500/mo)' },
      groceries: { ratePct: 10.0, portal: 'BigBasket (Capped at ₹500/mo)' },
      hospital: { ratePct: 1.0, portal: 'Standard spend' },
      rent: { ratePct: 0, portal: 'Excluded' },
      fuel: { ratePct: 0, portal: 'Excluded' },
      utility: { ratePct: 10.0, portal: 'Airtel Thanks Electricity/Gas (Capped at ₹250/mo)' },
      electronics: { ratePct: 1.0, portal: 'Standard spend' },
    },
    valuationINRPerPoint: 1.0,
  },
  {
    id: 'amex_plat_travel',
    name: 'Amex Platinum Travel',
    issuer: 'American Express',
    type: 'Milestone Travel',
    baseRatePct: 2.0,
    categoryRates: {
      flights: { ratePct: 8.0, portal: 'Milestone Spend (₹4L spend = 48k pts + ₹10k Taj voucher)' },
      hotels: { ratePct: 8.0, portal: 'Milestone Spend' },
      amazon: { ratePct: 8.0, portal: 'Any Spend counting towards ₹4L milestone' },
      dining: { ratePct: 8.0, portal: 'Any Spend' },
      groceries: { ratePct: 8.0, portal: 'Any Spend' },
      hospital: { ratePct: 8.0, portal: 'Hospital spend counts towards ₹4L milestone' },
      rent: { ratePct: 0, portal: 'Excluded from milestone' },
      fuel: { ratePct: 0, portal: 'Excluded' },
      utility: { ratePct: 0, portal: 'Excluded' },
      electronics: { ratePct: 8.0, portal: 'Any Spend' },
    },
    valuationINRPerPoint: 0.5,
  },
];

router.get('/cards', (req, res) => {
  return res.json({ success: true, cards: CARDS_DB });
});

router.post('/optimize-spend', (req, res) => {
  try {
    const {
      heldCardIds = [],
      amount = 50000,
      category = 'flights',
    } = req.body;

    // Filter available cards: if user has specified held cards, use them; otherwise use entire DB
    const pool = heldCardIds.length > 0
      ? CARDS_DB.filter(c => heldCardIds.includes(c.id))
      : CARDS_DB;

    const recommendations = pool.map(card => {
      const catConfig = card.categoryRates[category] || { ratePct: card.baseRatePct, portal: 'Base reward rate' };
      const ratePct = catConfig.ratePct;
      const expectedSavingsINR = Math.round(amount * (ratePct / 100));

      let note = catConfig.portal;
      if (category === 'rent') {
        note = 'Most banks levy 1% + GST processing surcharge on rent payments.';
      } else if (category === 'fuel') {
        note = 'Reward points usually excluded; 1% surcharge waiver up to ₹500/mo.';
      }

      return {
        cardId: card.id,
        cardName: card.name,
        issuer: card.issuer,
        type: card.type,
        ratePct,
        expectedSavingsINR,
        recommendationNote: note,
        isOptimal: false,
      };
    });

    // Sort descending by savings
    recommendations.sort((a, b) => b.expectedSavingsINR - a.expectedSavingsINR);
    if (recommendations.length > 0) {
      recommendations[0].isOptimal = true;
    }

    return res.json({
      success: true,
      data: {
        amount,
        category,
        optimalCard: recommendations[0] || null,
        allRanked: recommendations,
      },
    });
  } catch (err) {
    console.error('Card Optimizer Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = { router };
