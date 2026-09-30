// Plaid Gateway: Live Link & Sandbox Bank/Brokerage Ingestion Engine

let plaidSession = {
  isConnected: false,
  accessToken: null,
  itemId: null,
  institutionName: null,
  lastSyncAt: null,
};

const SAMPLE_PLAID_ACCOUNTS = [
  {
    accountId: 'acc_chase_chk',
    name: 'Total Checking',
    officialName: 'Chase Premier Checking',
    institution: 'Chase Bank',
    type: 'depository',
    subtype: 'checking',
    currentBalance: 15420.50,
    availableBalance: 15100.00,
    currency: 'USD',
  },
  {
    accountId: 'acc_marcus_hysa',
    name: 'Online Savings',
    officialName: 'Marcus High-Yield Savings Account',
    institution: 'Marcus by Goldman Sachs',
    type: 'depository',
    subtype: 'savings',
    currentBalance: 52400.00,
    availableBalance: 52400.00,
    currency: 'USD',
    apy: 4.40,
  },
  {
    accountId: 'acc_fidelity_401k',
    name: 'Company 401(k)',
    officialName: 'Fidelity NetBenefits 401(k)',
    institution: 'Fidelity Investments',
    type: 'investment',
    subtype: '401k',
    currentBalance: 185000.00,
    currency: 'USD',
  },
  {
    accountId: 'acc_schwab_brokerage',
    name: 'Individual Brokerage',
    officialName: 'Charles Schwab One Individual Account',
    institution: 'Charles Schwab',
    type: 'investment',
    subtype: 'brokerage',
    currentBalance: 370700.00,
    currency: 'USD',
  },
  {
    accountId: 'acc_chase_csr',
    name: 'Sapphire Reserve',
    officialName: 'Chase Sapphire Reserve Credit Card',
    institution: 'Chase Bank',
    type: 'credit',
    subtype: 'credit card',
    currentBalance: 2480.30,
    limit: 30000.00,
    currency: 'USD',
  },
];

// POST /api/plaid/create-link-token
async function createLinkToken(req, res) {
  try {
    // If live Plaid credentials exist in process.env, can call official Plaid client
    // For sandbox/development:
    const linkToken = `link-sandbox-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    res.json({
      success: true,
      linkToken,
      expiration: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      environment: process.env.PLAID_ENV || 'sandbox',
      supportedInstitutions: ['Chase', 'Bank of America', 'Wells Fargo', 'Fidelity', 'Charles Schwab', 'Vanguard'],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/plaid/exchange-public-token
async function exchangePublicToken(req, res) {
  try {
    const { publicToken, institutionName = 'Charles Schwab & Chase' } = req.body;

    plaidSession.isConnected = true;
    plaidSession.accessToken = `access-sandbox-${Date.now()}`;
    plaidSession.itemId = `item-sandbox-${Date.now()}`;
    plaidSession.institutionName = institutionName;
    plaidSession.lastSyncAt = new Date().toISOString();

    res.json({
      success: true,
      message: 'Institution connected successfully via Plaid Link.',
      institutionName: plaidSession.institutionName,
      lastSyncAt: plaidSession.lastSyncAt,
      accountsConnected: SAMPLE_PLAID_ACCOUNTS.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/plaid/accounts
async function getAccounts(req, res) {
  try {
    res.json({
      success: true,
      isConnected: plaidSession.isConnected,
      institutionName: plaidSession.institutionName || 'Demo Plaid Sandbox',
      lastSyncAt: plaidSession.lastSyncAt || new Date().toISOString(),
      accounts: SAMPLE_PLAID_ACCOUNTS,
      totalLiquidUSD: 67820.50,
      totalInvestedUSD: 555700.00,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/plaid/disconnect
async function disconnect(req, res) {
  plaidSession = {
    isConnected: false,
    accessToken: null,
    itemId: null,
    institutionName: null,
    lastSyncAt: null,
  };
  res.json({ success: true, message: 'Disconnected from Plaid.' });
}

module.exports = { createLinkToken, exchangePublicToken, getAccounts, disconnect };
