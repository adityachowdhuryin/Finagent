// server/routes/emergencyVault.js
// Family Emergency Financial Dossier, Nominee Audit & 90-Day Inactivity Protocol (Dead Man's Switch)

const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'FinAgent Vault <onboarding@resend.dev>';
const OWNER_EMAIL = 'adityachowdhury1995@gmail.com';

let vaultConfig = {
  userLastActiveAt: new Date().toISOString(),
  inactivityDaysLimit: 90,
  isArmed: true,
  nominee: {
    name: 'Pooja Chowdhury',
    relationship: 'Spouse',
    email: 'adityachowdhury1995@gmail.com', // fallback to owner for test delivery
    phone: '+91 98765 43210',
  },
  secondaryContact: {
    name: 'Rahul Chowdhury',
    relationship: 'Brother',
    email: 'adityachowdhury1995@gmail.com',
  },
  lastPingAt: new Date().toISOString(),
};

// GET /api/vault/status
async function getStatus(req, res) {
  try {
    const lastActive = new Date(vaultConfig.userLastActiveAt);
    const now = new Date();
    const daysInactive = Math.floor((now - lastActive) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, vaultConfig.inactivityDaysLimit - daysInactive);

    res.json({
      success: true,
      isArmed: vaultConfig.isArmed,
      inactivityDaysLimit: vaultConfig.inactivityDaysLimit,
      daysInactive,
      daysRemaining,
      userLastActiveAt: vaultConfig.userLastActiveAt,
      nominee: vaultConfig.nominee,
      secondaryContact: vaultConfig.secondaryContact,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/vault/ping - Reset heartbeat
async function pingHeartbeat(req, res) {
  try {
    vaultConfig.userLastActiveAt = new Date().toISOString();
    vaultConfig.lastPingAt = new Date().toISOString();
    res.json({ success: true, timestamp: vaultConfig.userLastActiveAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/vault/config - Update nominee & trigger settings
async function updateConfig(req, res) {
  try {
    const { nominee, secondaryContact, inactivityDaysLimit, isArmed } = req.body;
    if (nominee) vaultConfig.nominee = { ...vaultConfig.nominee, ...nominee };
    if (secondaryContact) vaultConfig.secondaryContact = { ...vaultConfig.secondaryContact, ...secondaryContact };
    if (inactivityDaysLimit) vaultConfig.inactivityDaysLimit = Number(inactivityDaysLimit);
    if (typeof isArmed === 'boolean') vaultConfig.isArmed = isArmed;

    res.json({ success: true, config: vaultConfig });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/vault/test-trigger - Test emergency protocol email
async function testTrigger(req, res) {
  try {
    const targetEmail = vaultConfig.nominee?.email || OWNER_EMAIL;
    const nomineeName = vaultConfig.nominee?.name || 'Nominee';

    await resend.emails.send({
      from: FROM,
      to: targetEmail,
      subject: `🛡️ [TEST PROTOCOL] Family Emergency Financial Dossier Notification`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#0f0f23;color:#f1f5f9;border-radius:12px;border:1px solid #6366f1;">
          <h2 style="color:#6366f1;margin-top:0;">FinAgent Emergency Vault Protocol</h2>
          <p>Dear <strong>${nomineeName}</strong>,</p>
          <p>This is a <strong>simulated test</strong> of the FinAgent Inactivity Protocol.</p>
          <p>You have been designated as the trusted Emergency Nominee by your family member. In the event of confirmed prolonged inactivity, this protocol releases the confidential steps to unlock the <strong>Master Family Financial Dossier</strong>.</p>
          <div style="background:#1e1e2e;padding:16px;border-radius:8px;margin:20px 0;">
            <div style="color:#94a3b8;font-size:12px;text-transform:uppercase;">Protocol Checklist:</div>
            <ul style="padding-left:20px;font-size:14px;color:#cbd5e1;line-height:1.6;">
              <li>Consolidated listing of all 14 Bank Accounts, FDs & Demat Folios</li>
              <li>Life Insurance policy numbers and claims assistance helpline</li>
              <li>Bank locker identifiers and physical document locations</li>
            </ul>
          </div>
          <p style="font-size:12px;color:#64748b;">This was a manual test initiated from the FinAgent Emergency Vault dashboard.</p>
        </div>
      `,
    }).catch(e => console.warn('[Emergency Email Test Warning]:', e.message));

    res.json({ success: true, recipient: targetEmail });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/vault/nominee-audit
async function nomineeAudit(req, res) {
  try {
    const auditItems = [
      { assetType: 'Mutual Funds', provider: 'HDFC Mutual Fund', account: 'Folio: 10482910', nomineeStatus: 'VERIFIED', nomineeName: 'Pooja Chowdhury (100%)' },
      { assetType: 'Mutual Funds', provider: 'Nippon India MF', account: 'Folio: 99381023', nomineeStatus: 'MISSING', actionUrl: 'https://app.mfcentral.com' },
      { assetType: 'Demat / Stocks', provider: 'Zerodha Broking', account: 'Client: AB1290', nomineeStatus: 'VERIFIED', nomineeName: 'Pooja Chowdhury (100%)' },
      { assetType: 'Fixed Deposit', provider: 'State Bank of India', account: 'A/C: ...4029', nomineeStatus: 'VERIFIED', nomineeName: 'Pooja Chowdhury (100%)' },
      { assetType: 'Fixed Deposit', provider: 'HDFC Bank', account: 'A/C: ...9182', nomineeStatus: 'MISSING', actionUrl: 'https://netbanking.hdfcbank.com' },
      { assetType: 'EPF / PF', provider: 'EPFO (UAN: 1009283910)', account: 'Provident Fund', nomineeStatus: 'MISSING', actionUrl: 'https://unifiedportal-mem.epfindia.gov.in' },
      { assetType: 'Term Insurance', provider: 'HDFC Life Click 2 Protect', account: 'Policy: 8829104', nomineeStatus: 'VERIFIED', nomineeName: 'Pooja Chowdhury (100%)' },
    ];

    const missingCount = auditItems.filter(i => i.nomineeStatus === 'MISSING').length;

    res.json({
      success: true,
      totalAssets: auditItems.length,
      missingCount,
      auditItems,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getStatus, pingHeartbeat, updateConfig, testTrigger, nomineeAudit };
