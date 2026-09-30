// server/routes/realEstateAVM.js
// Algorithmic Real Estate Automated Valuation Model (AVM)
// Powered by metro price/sqft growth indices, LTV tracking, rental yield, and 1031 / Section 54 tax shelters

const METRO_INDICES = {
  US: {
    'Bay Area, CA': { baseSqFtPrice: 1040, annualGrowthPct: 5.2, avgCapRate: 4.1 },
    'New York, NY': { baseSqFtPrice: 1220, annualGrowthPct: 4.8, avgCapRate: 4.4 },
    'Seattle, WA': { baseSqFtPrice: 680, annualGrowthPct: 6.1, avgCapRate: 5.2 },
    'Austin, TX': { baseSqFtPrice: 420, annualGrowthPct: 3.8, avgCapRate: 6.1 },
    'Los Angeles, CA': { baseSqFtPrice: 840, annualGrowthPct: 4.5, avgCapRate: 4.6 }
  },
  IN: {
    'Mumbai (BKC / South)': { baseSqFtPrice: 42000, annualGrowthPct: 8.4, avgCapRate: 3.2 },
    'Bangalore (Indiranagar / ORR)': { baseSqFtPrice: 12500, annualGrowthPct: 9.8, avgCapRate: 4.6 },
    'Gurgaon (Golf Course Road)': { baseSqFtPrice: 16500, annualGrowthPct: 11.2, avgCapRate: 3.8 },
    'Hyderabad (Hitec City)': { baseSqFtPrice: 8500, annualGrowthPct: 10.5, avgCapRate: 4.8 },
    'Pune (Koregaon Park / Hinjewadi)': { baseSqFtPrice: 7800, annualGrowthPct: 7.6, avgCapRate: 4.2 }
  }
};

/**
 * POST /api/real-estate-avm/estimate
 */
function estimatePropertyValuation(req, res) {
  const {
    market = 'US',
    address = '1482 Sunnyvale Saratoga Rd, Sunnyvale, CA 94087',
    metro = 'Bay Area, CA',
    propertyType = 'Single Family Residence',
    sqft = 1850,
    beds = 3,
    baths = 2,
    yearBuilt = 2016,
    purchasePrice = 1450000,
    purchaseYear = 2019,
    currentMortgageBalance = 920000,
    interestRate = 3.25, // percentage
    monthlyRent = 4800,
    monthlyHoa = 150,
    appraisalOverride = null
  } = req.body;

  const currentYear = new Date().getFullYear();
  const yearsHeld = Math.max(1, currentYear - purchaseYear);
  const metroData = (METRO_INDICES[market] && METRO_INDICES[market][metro]) || { baseSqFtPrice: 650, annualGrowthPct: 5.0, avgCapRate: 4.8 };

  // Algorithmic AVM Calculation
  let estimatedValue = appraisalOverride;
  if (!estimatedValue) {
    const rawSqFtValue = sqft * metroData.baseSqFtPrice;
    // Comp adjustment based on year built & bed count
    const compMultiplier = 1.0 + (beds >= 4 ? 0.08 : 0) + (yearBuilt > 2015 ? 0.05 : 0);
    estimatedValue = Math.round(rawSqFtValue * compMultiplier);
  }

  const equity = Math.max(0, estimatedValue - currentMortgageBalance);
  const ltv = Number(((currentMortgageBalance / estimatedValue) * 100).toFixed(1));

  // Cashflow & Yield Analysis
  // Estimated monthly PITI (Principal + Interest + Taxes ~1.2% + Insurance ~0.4%)
  const monthlyInterestRate = (interestRate / 100) / 12;
  const numPayments = 30 * 12;
  const monthlyPI = Math.round(
    (currentMortgageBalance * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numPayments))) /
    (Math.pow(1 + monthlyInterestRate, numPayments) - 1)
  );

  const monthlyTaxes = Math.round((estimatedValue * 0.012) / 12);
  const monthlyInsurance = Math.round((estimatedValue * 0.0035) / 12);
  const totalMonthlyCost = monthlyPI + monthlyTaxes + monthlyInsurance + monthlyHoa;

  const netMonthlyCashflow = monthlyRent - totalMonthlyCost;
  const grossRentalYield = Number(((monthlyRent * 12 / estimatedValue) * 100).toFixed(2));
  const capRate = Number((((monthlyRent - monthlyTaxes - monthlyInsurance - monthlyHoa) * 12 / estimatedValue) * 100).toFixed(2));

  // Capital Gains & Tax Deferral
  const capitalGain = Math.max(0, estimatedValue - purchasePrice);
  const taxShelterStrategy = market === 'US'
    ? {
        rule: 'Section 1031 Like-Kind Exchange & Section 121 Primary Exclusion',
        primaryExclusionAvailable: '$500,000 (Married Filing Jointly) / $250,000 (Single)',
        recommendation: capitalGain <= 500000
          ? 'Full gain is 100% tax-free under IRC §121 if lived in as primary home for 2 of last 5 years.'
          : `IRC §1031 allows rolling the $${capitalGain.toLocaleString()} gain into a replacement property with 0% current tax liability.`
      }
    : {
        rule: 'Section 54 / 54F Capital Gain Exemption (India Income Tax Act)',
        primaryExclusionAvailable: 'Full LTCG exemption if reinvested into residential house within 2 years',
        recommendation: `Reinvesting the net consideration or gain into another residential property or 54EC Capital Gains Bonds shields ₹${(capitalGain / 100000).toFixed(1)}L from 12.5% LTCG tax.`
      };

  res.json({
    success: true,
    market,
    property: {
      address,
      metro,
      propertyType,
      sqft,
      beds,
      baths,
      yearBuilt
    },
    avm: {
      estimatedValue,
      confidenceBand: {
        low: Math.round(estimatedValue * 0.95),
        high: Math.round(estimatedValue * 1.05)
      },
      currentMortgageBalance,
      homeEquity: equity,
      loanToValue: ltv,
      annualMetroGrowth: `${metroData.annualGrowthPct}%`
    },
    cashflow: {
      monthlyRent,
      monthlyMortgagePI: monthlyPI,
      monthlyTaxes,
      monthlyInsurance,
      monthlyHoa,
      totalMonthlyExpenses: totalMonthlyCost,
      netMonthlyCashflow,
      grossRentalYield: `${grossRentalYield}%`,
      capRate: `${capRate}%`
    },
    taxShelter: taxShelterStrategy
  });
}

module.exports = {
  estimatePropertyValuation
};
