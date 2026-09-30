// US Points & Miles Maximizer (Chase 5/24 Rule, Amex MR, Chase UR, Bilt Points Router)

const US_CARD_DATABASE = [
  {
    id: 'chase_csr',
    name: 'Chase Sapphire Reserve',
    issuer: 'Chase',
    annualFee: 550,
    pointCurrency: 'Chase Ultimate Rewards (UR)',
    pointValuationCents: 2.0,
    countsToward524: true,
    categoryMultipliers: {
      flights: 5.0,
      hotels: 10.0,
      dining: 3.0,
      generalTravel: 3.0,
      base: 1.0,
    },
    topTransferPartners: ['World of Hyatt (2.1¢)', 'United Airlines', 'Air Canada Aeroplan', 'British Airways'],
    perks: ['$300 Annual Travel Credit', 'Priority Pass Lounge Access', 'Global Entry / TSA PreCheck Credit'],
  },
  {
    id: 'chase_csp',
    name: 'Chase Sapphire Preferred',
    issuer: 'Chase',
    annualFee: 95,
    pointCurrency: 'Chase Ultimate Rewards (UR)',
    pointValuationCents: 2.0,
    countsToward524: true,
    categoryMultipliers: {
      dining: 3.0,
      onlineGrocery: 3.0,
      streaming: 3.0,
      travel: 2.0,
      base: 1.0,
    },
    topTransferPartners: ['World of Hyatt', 'United Airlines', 'Singapore Airlines'],
    perks: ['$50 Annual Ultimate Rewards Hotel Credit', '10% Anniversary Point Bonus'],
  },
  {
    id: 'amex_gold',
    name: 'American Express Gold Card',
    issuer: 'American Express',
    annualFee: 325,
    pointCurrency: 'Amex Membership Rewards (MR)',
    pointValuationCents: 1.8,
    countsToward524: true,
    categoryMultipliers: {
      dining: 4.0,
      groceries: 4.0, // up to $25k/yr
      flights: 3.0,
      base: 1.0,
    },
    topTransferPartners: ['Delta SkyMiles', 'ANA Mileage Club', 'Air France / KLM Flying Blue', 'Hilton Honors'],
    perks: ['$120 Dining Credit ($10/mo Grubhub)', '$120 Uber Cash ($10/mo)', '$84 Dunkin Credit'],
  },
  {
    id: 'amex_plat',
    name: 'American Express Platinum Card',
    issuer: 'American Express',
    annualFee: 695,
    pointCurrency: 'Amex Membership Rewards (MR)',
    pointValuationCents: 1.8,
    countsToward524: true,
    categoryMultipliers: {
      flights: 5.0,
      prepaidHotels: 5.0,
      base: 1.0,
    },
    topTransferPartners: ['Air Canada', 'British Airways', 'Singapore Airlines', 'Delta'],
    perks: ['Centurion Lounge Access', '$200 Hotel Credit', '$240 Digital Entertainment Credit', '$200 Airline Fee Credit'],
  },
  {
    id: 'capone_venture_x',
    name: 'Capital One Venture X',
    issuer: 'Capital One',
    annualFee: 395,
    pointCurrency: 'Capital One Miles',
    pointValuationCents: 1.7,
    countsToward524: true,
    categoryMultipliers: {
      hotelsAndRentalCars: 10.0,
      flightsPortal: 5.0,
      base: 2.0, // 2x on everything!
    },
    topTransferPartners: ['Air Canada Aeroplan', 'Avianca LifeMiles', 'Turkish Airlines', 'British Airways'],
    perks: ['$300 Annual Travel Portal Credit', '10,000 Anniversary Miles ($100)', 'Capital One Lounge Access'],
  },
  {
    id: 'bilt_mastercard',
    name: 'Bilt World Elite Mastercard',
    issuer: 'Wells Fargo / Bilt',
    annualFee: 0,
    pointCurrency: 'Bilt Rewards Points',
    pointValuationCents: 2.1,
    countsToward524: true,
    categoryMultipliers: {
      rent: 1.0, // 1x on rent with 0% transaction fee (up to 100k pts/yr)
      dining: 3.0, // 6x on Rent Day (1st of month)
      travel: 2.0,
      base: 1.0,
    },
    topTransferPartners: ['World of Hyatt', 'Alaska Airlines', 'Air France Flying Blue', 'United Airlines'],
    perks: ['Zero Annual Fee', 'Pay rent via ACH/card without fees', 'Primary Auto Rental Collision Damage Waiver'],
  },
  {
    id: 'citi_double_cash',
    name: 'Citi Double Cash',
    issuer: 'Citi',
    annualFee: 0,
    pointCurrency: 'Cash Back / Citi ThankYou Points',
    pointValuationCents: 1.0,
    countsToward524: true,
    categoryMultipliers: {
      base: 2.0, // 1% when you buy + 1% as you pay
    },
    topTransferPartners: ['Choice Privileges', 'JetBlue TrueBlue', 'Wyndham Rewards'],
    perks: ['Simple flat 2% cash back everywhere', 'Zero Annual Fee'],
  },
];

// GET /api/us-cards/database
async function getUSCardDatabase(req, res) {
  res.json({ success: true, cards: US_CARD_DATABASE });
}

// POST /api/us-cards/optimize-spend
async function optimizeSpend(req, res) {
  try {
    const {
      category = 'dining', // dining, groceries, flights, rent, general
      spendAmountUSD = 250,
      ownedCardIds = ['chase_csr', 'amex_gold', 'bilt_mastercard'],
      cardsOpenedLast24Months = 3, // For Chase 5/24
    } = req.body;

    const cards = ownedCardIds.length > 0
      ? US_CARD_DATABASE.filter(c => ownedCardIds.includes(c.id))
      : US_CARD_DATABASE;

    // Evaluate yield on each card
    const scoredCards = cards.map(c => {
      let multiplier = c.categoryMultipliers[category] || c.categoryMultipliers.base || 1.0;
      if (category === 'dining' && c.categoryMultipliers.dining) multiplier = c.categoryMultipliers.dining;
      if (category === 'groceries' && c.categoryMultipliers.groceries) multiplier = c.categoryMultipliers.groceries;
      if (category === 'flights' && c.categoryMultipliers.flights) multiplier = c.categoryMultipliers.flights;
      if (category === 'rent' && c.categoryMultipliers.rent) multiplier = c.categoryMultipliers.rent;

      const pointsEarned = Math.round(spendAmountUSD * multiplier);
      const effectiveYieldPct = Number(((multiplier * c.pointValuationCents)).toFixed(2));
      const dollarValueEarned = Number(((pointsEarned * c.pointValuationCents) / 100).toFixed(2));

      return {
        cardId: c.id,
        cardName: c.name,
        issuer: c.issuer,
        multiplier: `${multiplier}x`,
        pointsEarned,
        effectiveYieldPct,
        dollarValueEarned,
        topTransferPartner: c.topTransferPartners[0] || 'Cash Statement Credit',
      };
    });

    scoredCards.sort((a, b) => b.effectiveYieldPct - a.effectiveYieldPct);
    const bestCard = scoredCards[0];

    // Chase 5/24 Rule Analysis
    const isUnder524 = cardsOpenedLast24Months < 5;
    const remaining524Slots = Math.max(0, 5 - cardsOpenedLast24Months);
    const chaseStrategy = isUnder524
      ? `You are at ${cardsOpenedLast24Months}/24 (${remaining524Slots} slot${remaining524Slots > 1 ? 's' : ''} left). Prioritize Chase cards (like Sapphire Preferred or Ink Business) before crossing 5/24.`
      : `You are at ${cardsOpenedLast24Months}/24 (Over 5/24 limit). Chase will automatically reject new personal card applications. Focus on American Express or Capital One.`;

    res.json({
      success: true,
      category,
      spendAmountUSD,
      bestCard,
      allCardRankings: scoredCards,
      chase524Status: {
        cardsOpenedLast24Months,
        isUnder524,
        remainingSlots: remaining524Slots,
        guidance: chaseStrategy,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getUSCardDatabase, optimizeSpend, US_CARD_DATABASE };
