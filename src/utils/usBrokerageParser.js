// src/utils/usBrokerageParser.js
// Deterministic, Zero-Vision Ingestion for US Brokerages & Institutional Data Standards:
// Charles Schwab, Fidelity Investments, Vanguard, Robinhood & OFX / QFX XML/SGML.

/**
 * Clean numeric string into a float, stripping $, commas, quotes, and %
 */
function parseNum(val) {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[\$,\s%]/g, '').trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

/**
 * Split CSV line taking into account quoted fields containing commas
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result.map(s => s.replace(/^"|"$/g, '').trim());
}

/**
 * Detect Brokerage CSV Format
 */
export function detectFileFormat(text) {
  if (!text || typeof text !== 'string') return 'UNKNOWN';

  // Check OFX / QFX SGML/XML
  if (text.includes('<OFX>') || text.includes('OFXHEADER') || text.includes('<INVSTMTTRNRS>')) {
    return 'OFX';
  }

  const firstLines = text.split('\n').slice(0, 10).join(' ').toLowerCase();

  if (firstLines.includes('schwab') || (firstLines.includes('symbol') && firstLines.includes('cost basis') && firstLines.includes('reinvest dividends'))) {
    return 'SCHWAB';
  }
  if (firstLines.includes('fidelity') || (firstLines.includes('account name/number') && firstLines.includes('last price') && firstLines.includes('cost basis per share'))) {
    return 'FIDELITY';
  }
  if (firstLines.includes('vanguard') || (firstLines.includes('account number') && firstLines.includes('investment name') && firstLines.includes('share price'))) {
    return 'VANGUARD';
  }
  if (firstLines.includes('robinhood') || (firstLines.includes('instrument') && firstLines.includes('average cost') && firstLines.includes('equity'))) {
    return 'ROBINHOOD';
  }

  // Generic fallback if standard headers exist
  if (firstLines.includes('symbol') && (firstLines.includes('shares') || firstLines.includes('quantity') || firstLines.includes('units'))) {
    return 'GENERIC_CSV';
  }

  return 'UNKNOWN';
}

/**
 * Parse Charles Schwab Positions CSV
 */
export function parseSchwabCSV(csvText) {
  const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
  const holdings = [];

  // Find header row (usually contains Symbol, Description, Quantity)
  let headerIdx = -1;
  let headers = [];

  for (let i = 0; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase();
    if (lineLower.includes('symbol') && lineLower.includes('description') && lineLower.includes('quantity')) {
      headerIdx = i;
      headers = parseCSVLine(lines[i]).map(h => h.toLowerCase());
      break;
    }
  }

  if (headerIdx === -1) return holdings;

  const symbolIdx = headers.findIndex(h => h.includes('symbol'));
  const descIdx = headers.findIndex(h => h.includes('description'));
  const qtyIdx = headers.findIndex(h => h.includes('quantity'));
  const priceIdx = headers.findIndex(h => h.includes('price') && !h.includes('change'));
  const costIdx = headers.findIndex(h => h.includes('cost basis'));
  const valIdx = headers.findIndex(h => h.includes('market value'));
  const gainIdx = headers.findIndex(h => h.includes('gain/loss $') || h.includes('gain/loss dollar'));
  const gainPctIdx = headers.findIndex(h => h.includes('gain/loss %') || h.includes('gain/loss percent'));

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row.length <= 1) continue;

    const symbol = (row[symbolIdx] || '').trim().toUpperCase();
    if (!symbol || symbol.includes('ACCOUNT TOTAL') || symbol.includes('CASH') || symbol.startsWith('--')) {
      continue;
    }

    const desc = row[descIdx] || symbol;
    const qty = parseNum(row[qtyIdx]);
    const price = parseNum(row[priceIdx]);
    const costBasis = parseNum(row[costIdx]);
    const marketValue = parseNum(row[valIdx]) || (qty * price);
    const pnl = parseNum(row[gainIdx]) || (marketValue - costBasis);
    const pnlPct = parseNum(row[gainPctIdx]) || (costBasis > 0 ? (pnl / costBasis) * 100 : 0);

    if (qty > 0 || marketValue > 0) {
      holdings.push({
        symbol,
        name: desc,
        fund: desc,
        units: qty,
        qty,
        nav: price,
        price,
        ltp: price,
        value: marketValue,
        currentValue: marketValue,
        costBasis,
        avgCost: qty > 0 ? Number((costBasis / qty).toFixed(2)) : price,
        pnl: Math.round(pnl),
        pnlPct: Number(pnlPct.toFixed(2)),
        category: symbol.length <= 4 ? 'US Equity / ETF' : 'Mutual Fund',
        source: 'Charles Schwab',
      });
    }
  }

  return holdings;
}

/**
 * Parse Fidelity Investments Positions CSV
 */
export function parseFidelityCSV(csvText) {
  const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
  const holdings = [];

  let headerIdx = -1;
  let headers = [];

  for (let i = 0; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase();
    if (lineLower.includes('symbol') && (lineLower.includes('last price') || lineLower.includes('current value'))) {
      headerIdx = i;
      headers = parseCSVLine(lines[i]).map(h => h.toLowerCase());
      break;
    }
  }

  if (headerIdx === -1) return holdings;

  const symbolIdx = headers.findIndex(h => h === 'symbol');
  const descIdx = headers.findIndex(h => h.includes('description'));
  const qtyIdx = headers.findIndex(h => h.includes('quantity'));
  const priceIdx = headers.findIndex(h => h.includes('last price') && !h.includes('change'));
  const valIdx = headers.findIndex(h => h.includes('current value'));
  const costIdx = headers.findIndex(h => h.includes('cost basis total'));
  const gainIdx = headers.findIndex(h => h.includes('total gain/loss dollar'));
  const gainPctIdx = headers.findIndex(h => h.includes('total gain/loss percent'));

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row.length <= 1) continue;

    let symbol = (row[symbolIdx] || '').trim().toUpperCase();
    if (!symbol || symbol.includes('PENDING') || symbol.startsWith('TOTAL')) continue;

    // Clean Fidelity money market asterisks e.g. SPAXX**
    symbol = symbol.replace(/\*+$/, '');

    const desc = row[descIdx] || symbol;
    const qty = parseNum(row[qtyIdx]);
    const price = parseNum(row[priceIdx]);
    const marketValue = parseNum(row[valIdx]) || (qty * price);
    const costBasis = parseNum(row[costIdx]);
    const pnl = parseNum(row[gainIdx]) || (marketValue - costBasis);
    const pnlPct = parseNum(row[gainPctIdx]) || (costBasis > 0 ? (pnl / costBasis) * 100 : 0);

    if (qty > 0 || marketValue > 0) {
      holdings.push({
        symbol,
        name: desc,
        fund: desc,
        units: qty,
        qty,
        nav: price,
        price,
        ltp: price,
        value: marketValue,
        currentValue: marketValue,
        costBasis,
        avgCost: qty > 0 ? Number((costBasis / qty).toFixed(2)) : price,
        pnl: Math.round(pnl),
        pnlPct: Number(pnlPct.toFixed(2)),
        category: symbol.length <= 4 ? 'US Equity / ETF' : 'Mutual Fund',
        source: 'Fidelity Investments',
      });
    }
  }

  return holdings;
}

/**
 * Parse Vanguard Positions CSV
 */
export function parseVanguardCSV(csvText) {
  const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
  const holdings = [];

  let headerIdx = -1;
  let headers = [];

  for (let i = 0; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase();
    if (lineLower.includes('symbol') && (lineLower.includes('shares') || lineLower.includes('share price') || lineLower.includes('total value'))) {
      headerIdx = i;
      headers = parseCSVLine(lines[i]).map(h => h.toLowerCase());
      break;
    }
  }

  if (headerIdx === -1) return holdings;

  const symbolIdx = headers.findIndex(h => h.includes('symbol'));
  const descIdx = headers.findIndex(h => h.includes('investment name') || h.includes('description') || h.includes('name'));
  const sharesIdx = headers.findIndex(h => h.includes('shares') || h.includes('quantity'));
  const priceIdx = headers.findIndex(h => h.includes('share price') || h.includes('price'));
  const valIdx = headers.findIndex(h => h.includes('total value') || h.includes('current value'));

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row.length <= 1) continue;

    const symbol = (row[symbolIdx] || '').trim().toUpperCase();
    if (!symbol || symbol.includes('TOTAL') || symbol.includes('ACCOUNT')) continue;

    const desc = row[descIdx] || symbol;
    const qty = parseNum(row[sharesIdx]);
    const price = parseNum(row[priceIdx]);
    const marketValue = parseNum(row[valIdx]) || (qty * price);

    if (qty > 0 || marketValue > 0) {
      holdings.push({
        symbol,
        name: desc,
        fund: desc,
        units: qty,
        qty,
        nav: price,
        price,
        ltp: price,
        value: marketValue,
        currentValue: marketValue,
        costBasis: marketValue, // Vanguard often reports cost basis separately
        avgCost: price,
        pnl: 0,
        pnlPct: 0,
        category: symbol.length <= 4 ? 'US Equity / ETF' : 'Vanguard Mutual Fund',
        source: 'Vanguard Group',
      });
    }
  }

  return holdings;
}

/**
 * Parse Robinhood Holdings CSV
 */
export function parseRobinhoodCSV(csvText) {
  const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
  const holdings = [];

  let headerIdx = -1;
  let headers = [];

  for (let i = 0; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase();
    if (lineLower.includes('instrument') || (lineLower.includes('quantity') && lineLower.includes('average cost'))) {
      headerIdx = i;
      headers = parseCSVLine(lines[i]).map(h => h.toLowerCase());
      break;
    }
  }

  if (headerIdx === -1) return holdings;

  const symbolIdx = headers.findIndex(h => h.includes('instrument') || h.includes('symbol'));
  const descIdx = headers.findIndex(h => h.includes('name') || h.includes('description'));
  const qtyIdx = headers.findIndex(h => h.includes('quantity') || h.includes('shares'));
  const priceIdx = headers.findIndex(h => h.includes('price') && !h.includes('average'));
  const avgCostIdx = headers.findIndex(h => h.includes('average cost'));
  const equityIdx = headers.findIndex(h => h.includes('equity') || h.includes('current value') || h.includes('value'));

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row.length <= 1) continue;

    const symbol = (row[symbolIdx] || '').trim().toUpperCase();
    if (!symbol || symbol.includes('TOTAL')) continue;

    const desc = row[descIdx] || symbol;
    const qty = parseNum(row[qtyIdx]);
    const price = parseNum(row[priceIdx]);
    const avgCost = parseNum(row[avgCostIdx]) || price;
    const marketValue = parseNum(row[equityIdx]) || (qty * price);
    const costBasis = qty * avgCost;
    const pnl = marketValue - costBasis;
    const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

    if (qty > 0 || marketValue > 0) {
      holdings.push({
        symbol,
        name: desc,
        fund: desc,
        units: qty,
        qty,
        nav: price,
        price,
        ltp: price,
        value: marketValue,
        currentValue: marketValue,
        costBasis,
        avgCost,
        pnl: Math.round(pnl),
        pnlPct: Number(pnlPct.toFixed(2)),
        category: 'US Equity / Crypto',
        source: 'Robinhood',
      });
    }
  }

  return holdings;
}

/**
 * Parse Open Financial Exchange (OFX / QFX) SGML / XML
 */
export function parseOFX(ofxText) {
  const holdings = [];

  // Match security info map: SECID -> TICKER / SECNAME
  const securityMap = {};
  const secInfoRegex = /<SECINFO>[\s\S]*?<\/SECINFO>/gi;
  let match;

  while ((match = secInfoRegex.exec(ofxText)) !== null) {
    const secBlock = match[0];
    const uniqueIdMatch = secBlock.match(/<UNIQUEID>([^<\r\n]+)/i);
    const tickerMatch = secBlock.match(/<TICKER>([^<\r\n]+)/i);
    const nameMatch = secBlock.match(/<SECNAME>([^<\r\n]+)/i);

    const uid = uniqueIdMatch ? uniqueIdMatch[1].trim() : null;
    const ticker = tickerMatch ? tickerMatch[1].trim().toUpperCase() : null;
    const name = nameMatch ? nameMatch[1].trim() : ticker;

    if (uid && ticker) {
      securityMap[uid] = { ticker, name };
    }
  }

  // Parse Position blocks: POSSTOCK, POSMF, POSOTHER
  const posRegex = /<(POSSTOCK|POSMF|POSOTHER)>[\s\S]*?<\/(POSSTOCK|POSMF|POSOTHER)>/gi;

  while ((match = posRegex.exec(ofxText)) !== null) {
    const block = match[0];
    const secIdMatch = block.match(/<UNIQUEID>([^<\r\n]+)/i);
    const unitsMatch = block.match(/<UNITS>([^<\r\n]+)/i);
    const unitPriceMatch = block.match(/<UNITPRICE>([^<\r\n]+)/i);
    const mktValMatch = block.match(/<MKTVAL>([^<\r\n]+)/i);

    const uid = secIdMatch ? secIdMatch[1].trim() : null;
    const secInfo = uid && securityMap[uid] ? securityMap[uid] : { ticker: uid || 'UNKNOWN', name: 'Open Financial Holding' };

    const qty = parseNum(unitsMatch ? unitsMatch[1] : 0);
    const price = parseNum(unitPriceMatch ? unitPriceMatch[1] : 0);
    const value = parseNum(mktValMatch ? mktValMatch[1] : qty * price);

    if (qty > 0 || value > 0) {
      holdings.push({
        symbol: secInfo.ticker,
        name: secInfo.name,
        fund: secInfo.name,
        units: qty,
        qty,
        nav: price,
        price,
        ltp: price,
        value,
        currentValue: value,
        costBasis: value,
        avgCost: price,
        pnl: 0,
        pnlPct: 0,
        category: 'OFX Investment Asset',
        source: 'OFX / QFX Export',
      });
    }
  }

  return holdings;
}

/**
 * Universal Ingestion Router
 */
export function parseBrokerageFile(fileContent, fileName = '') {
  const format = detectFileFormat(fileContent);

  switch (format) {
    case 'SCHWAB':
      return { format: 'Charles Schwab CSV', holdings: parseSchwabCSV(fileContent) };
    case 'FIDELITY':
      return { format: 'Fidelity Investments CSV', holdings: parseFidelityCSV(fileContent) };
    case 'VANGUARD':
      return { format: 'Vanguard Group CSV', holdings: parseVanguardCSV(fileContent) };
    case 'ROBINHOOD':
      return { format: 'Robinhood CSV', holdings: parseRobinhoodCSV(fileContent) };
    case 'OFX':
      return { format: 'Open Financial Exchange (OFX/QFX)', holdings: parseOFX(fileContent) };
    case 'GENERIC_CSV':
      // Fallback parser attempt
      return { format: 'Standard CSV', holdings: parseSchwabCSV(fileContent) };
    default:
      // Try generic parse
      const fallbackHoldings = parseSchwabCSV(fileContent);
      if (fallbackHoldings.length > 0) {
        return { format: 'Delimited File', holdings: fallbackHoldings };
      }
      return { format: 'UNKNOWN', holdings: [] };
  }
}
