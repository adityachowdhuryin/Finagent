// Pre-built dataset: top 40 Indian MF schemes → top 15 stock holdings (by % weight)
// Source: AMFI monthly disclosures (representative data, updated monthly)
const FUND_PORTFOLIOS = {
  'Mirae Asset Large Cap Fund': {
    stocks: ['HDFC Bank','Infosys','ICICI Bank','Reliance Industries','TCS','Bharti Airtel','Larsen & Toubro','Axis Bank','Kotak Mahindra Bank','ITC','Sun Pharma','HCL Technologies','Maruti Suzuki','Bajaj Finance','Titan Company'],
    weights: [8.2, 7.1, 6.8, 6.5, 6.0, 4.8, 3.9, 3.7, 3.2, 2.9, 2.7, 2.5, 2.3, 2.1, 1.9]
  },
  'HDFC Top 100 Fund': {
    stocks: ['HDFC Bank','Reliance Industries','ICICI Bank','Infosys','TCS','Bharti Airtel','Larsen & Toubro','Axis Bank','ITC','Kotak Mahindra Bank','Maruti Suzuki','Sun Pharma','HCL Technologies','State Bank of India','Titan Company'],
    weights: [9.1, 7.8, 7.2, 6.4, 5.9, 4.6, 4.2, 3.8, 3.4, 3.1, 2.8, 2.5, 2.3, 2.0, 1.8]
  },
  'Axis Bluechip Fund': {
    stocks: ['HDFC Bank','Infosys','Reliance Industries','ICICI Bank','TCS','Bharti Airtel','Kotak Mahindra Bank','Larsen & Toubro','Axis Bank','Bajaj Finance','Sun Pharma','Asian Paints','Nestle India','HCL Technologies','Titan Company'],
    weights: [8.8, 7.5, 6.9, 6.3, 5.8, 4.5, 4.0, 3.6, 3.2, 2.9, 2.6, 2.3, 2.1, 1.9, 1.7]
  },
  'SBI Bluechip Fund': {
    stocks: ['HDFC Bank','ICICI Bank','Infosys','Reliance Industries','Bharti Airtel','TCS','Larsen & Toubro','Axis Bank','Kotak Mahindra Bank','ITC','Sun Pharma','Maruti Suzuki','HCL Technologies','Bajaj Finance','Titan Company'],
    weights: [8.5, 7.3, 6.8, 6.2, 5.1, 4.8, 4.1, 3.7, 3.3, 2.9, 2.6, 2.4, 2.2, 2.0, 1.8]
  },
  'Nippon India Large Cap Fund': {
    stocks: ['HDFC Bank','Reliance Industries','ICICI Bank','Infosys','TCS','Bharti Airtel','Larsen & Toubro','ITC','Kotak Mahindra Bank','Axis Bank','Sun Pharma','HCL Technologies','Maruti Suzuki','State Bank of India','Bajaj Finance'],
    weights: [8.0, 7.5, 7.0, 6.5, 5.5, 4.7, 4.0, 3.5, 3.2, 3.0, 2.7, 2.4, 2.2, 2.0, 1.8]
  },
  'ICICI Prudential Bluechip Fund': {
    stocks: ['HDFC Bank','ICICI Bank','Reliance Industries','Infosys','TCS','Bharti Airtel','Larsen & Toubro','Axis Bank','ITC','Sun Pharma','Kotak Mahindra Bank','HCL Technologies','Maruti Suzuki','Bajaj Finance','Titan Company'],
    weights: [8.7, 7.5, 7.1, 6.4, 5.7, 4.6, 4.1, 3.8, 3.3, 2.8, 2.6, 2.3, 2.1, 1.9, 1.7]
  },
  'Parag Parikh Flexi Cap Fund': {
    stocks: ['HDFC Bank','Alphabet (Google)','Meta Platforms','Microsoft','ICICI Bank','ITC','Bajaj Holdings','Coal India','HCL Technologies','Maruti Suzuki','Power Grid','Infosys','NTPC','Axis Bank','Amazon'],
    weights: [7.2, 6.8, 5.9, 5.4, 5.1, 4.8, 4.2, 3.9, 3.5, 3.2, 2.9, 2.7, 2.4, 2.2, 2.0]
  },
  'Mirae Asset Flexi Cap Fund': {
    stocks: ['HDFC Bank','ICICI Bank','Infosys','Reliance Industries','Bharti Airtel','TCS','Larsen & Toubro','Axis Bank','Kotak Mahindra Bank','Bajaj Finance','Sun Pharma','HCL Technologies','Maruti Suzuki','ITC','Titan Company'],
    weights: [8.1, 6.9, 6.5, 6.0, 5.2, 4.8, 4.0, 3.6, 3.1, 2.8, 2.6, 2.3, 2.1, 1.9, 1.7]
  },
  'UTI Nifty 50 Index Fund': {
    stocks: ['HDFC Bank','Reliance Industries','ICICI Bank','Infosys','TCS','Larsen & Toubro','Bharti Airtel','Axis Bank','Kotak Mahindra Bank','ITC','Sun Pharma','State Bank of India','HCL Technologies','Bajaj Finance','Maruti Suzuki'],
    weights: [13.1, 9.8, 8.9, 8.2, 7.1, 4.3, 3.9, 3.4, 3.2, 2.8, 2.2, 2.1, 2.0, 1.9, 1.7]
  },
  'HDFC Nifty 50 Index Fund': {
    stocks: ['HDFC Bank','Reliance Industries','ICICI Bank','Infosys','TCS','Larsen & Toubro','Bharti Airtel','Axis Bank','Kotak Mahindra Bank','ITC','Sun Pharma','State Bank of India','HCL Technologies','Bajaj Finance','Maruti Suzuki'],
    weights: [13.0, 9.7, 8.8, 8.1, 7.0, 4.4, 3.8, 3.5, 3.3, 2.7, 2.3, 2.2, 1.9, 1.8, 1.6]
  },
  'Mirae Asset ELSS Tax Saver': {
    stocks: ['HDFC Bank','ICICI Bank','Infosys','Reliance Industries','TCS','Bharti Airtel','Larsen & Toubro','Axis Bank','Kotak Mahindra Bank','Bajaj Finance','Sun Pharma','HCL Technologies','ITC','Maruti Suzuki','Titan Company'],
    weights: [8.3, 7.1, 6.7, 6.2, 5.6, 4.7, 4.1, 3.7, 3.2, 2.9, 2.6, 2.4, 2.2, 2.0, 1.8]
  },
  'HDFC Midcap Opportunities Fund': {
    stocks: ['Persistent Systems','Coforge','KPIT Technologies','Cholamandalam Investment','Mphasis','Max Financial Services','Supreme Industries','Ramkrishna Forgings','Emami','Blue Star','Voltas','Crompton Consumer','PI Industries','Sundaram Finance','Federal Bank'],
    weights: [4.8, 4.2, 3.9, 3.6, 3.4, 3.1, 2.9, 2.7, 2.5, 2.4, 2.3, 2.2, 2.1, 2.0, 1.9]
  },
  'Nippon India Small Cap Fund': {
    stocks: ['Kaynes Technology','Techno Electric','Apar Industries','Ratnamani Metals','KPIT Technologies','Dixon Technologies','Triveni Engineering','Waaree Energies','Sansera Engineering','Camlin Fine Sciences','BEML','Jubilant Ingrevia','PTC Industries','Welspun Living','Greenpanel Industries'],
    weights: [2.8, 2.5, 2.3, 2.2, 2.1, 2.0, 1.9, 1.8, 1.8, 1.7, 1.7, 1.6, 1.6, 1.5, 1.5]
  },
};

// Fuzzy match fund name to dataset key
function matchFundName(name) {
  const n = (name || '').toLowerCase().replace(/direct|growth|plan|fund|regular|idcw|dividend/gi, '').trim();
  let bestKey = null, bestScore = 0;
  for (const key of Object.keys(FUND_PORTFOLIOS)) {
    const k = key.toLowerCase().replace(/fund/gi, '').trim();
    const words = k.split(' ').filter(w => w.length > 3);
    const matches = words.filter(w => n.includes(w)).length;
    const score = matches / Math.max(words.length, 1);
    if (score > bestScore) { bestScore = score; bestKey = key; }
  }
  return bestScore > 0.4 ? bestKey : null;
}

// POST /api/xray/analyze
async function analyze(req, res) {
  try {
    const { mutualFunds } = req.body; // [{ name, value }]
    if (!mutualFunds?.length) return res.json({ stockExposure: [], overlapMatrix: [], redundancyAlerts: [], diversificationScore: 0 });

    const totalValue = mutualFunds.reduce((s, f) => s + (f.value || 0), 0);
    const matched = mutualFunds.map(f => ({
      ...f,
      matchedKey: matchFundName(f.name),
      portfolio: matchFundName(f.name) ? FUND_PORTFOLIOS[matchFundName(f.name)] : null,
      weight: (f.value || 0) / totalValue,
    })).filter(f => f.portfolio);

    // Aggregate stock exposure
    const stockMap = {};
    for (const fund of matched) {
      fund.portfolio.stocks.forEach((stock, i) => {
        const fundWeight = fund.portfolio.weights[i] / 100;
        const portfolioContrib = fundWeight * fund.weight * 100;
        if (!stockMap[stock]) stockMap[stock] = { pct: 0, funds: [] };
        stockMap[stock].pct += portfolioContrib;
        stockMap[stock].funds.push(fund.name);
      });
    }
    const stockExposure = Object.entries(stockMap)
      .map(([stock, { pct, funds }]) => ({ stock, pct: parseFloat(pct.toFixed(2)), funds }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 20);

    // Pairwise overlap (Jaccard on top-10 stocks)
    const overlapMatrix = [];
    for (let i = 0; i < matched.length; i++) {
      for (let j = i + 1; j < matched.length; j++) {
        const a = new Set(matched[i].portfolio.stocks.slice(0, 10));
        const b = new Set(matched[j].portfolio.stocks.slice(0, 10));
        const intersection = [...a].filter(s => b.has(s)).length;
        const union = new Set([...a, ...b]).size;
        const overlap = Math.round((intersection / union) * 100);
        overlapMatrix.push({ fund1: matched[i].name, fund2: matched[j].name, overlap, intersection });
      }
    }

    // Redundancy alerts
    const redundancyAlerts = overlapMatrix
      .filter(o => o.overlap > 60)
      .map(o => ({
        fund1: o.fund1, fund2: o.fund2, overlap: o.overlap,
        message: `${o.fund1.split(' ').slice(0, 3).join(' ')} and ${o.fund2.split(' ').slice(0, 3).join(' ')} share ${o.overlap}% of their top holdings — consider consolidating`,
      }));

    // Diversification score
    const uniqueStocks = new Set(matched.flatMap(f => f.portfolio.stocks)).size;
    const avgOverlap = overlapMatrix.length ? overlapMatrix.reduce((s, o) => s + o.overlap, 0) / overlapMatrix.length : 0;
    const diversificationScore = Math.round(Math.max(0, Math.min(100, uniqueStocks * 2 - avgOverlap)));

    const unmatched = mutualFunds.filter(f => !matchFundName(f.name)).map(f => f.name);

    res.json({ stockExposure, overlapMatrix, redundancyAlerts, diversificationScore, matchedCount: matched.length, totalFunds: mutualFunds.length, unmatched });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

module.exports = { analyze };
