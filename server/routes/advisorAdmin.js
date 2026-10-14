// server/routes/advisorAdmin.js
// Registered Investment Adviser (RIA) Management Rails
// Handles statutory recommendation dispatches via Resend, client onboarding persistence, and SEBI compliance audit trail

const crypto = require('crypto');
const { Resend } = require('resend');
const {
  saveAdvisorClient,
  getAdvisorClients,
  saveAdvisorDispatch,
  getAdvisorDispatches,
  logAuditEvent
} = require('../db/database');

const resendApiKey = process.env.RESEND_API_KEY;
let resendClient = null;
if (resendApiKey) {
  try {
    resendClient = new Resend(resendApiKey);
  } catch (err) {
    console.warn('[AdvisorAdmin] Resend init warning:', err.message);
  }
}

const DEFAULT_SENDER = 'FinAgent Advisory <onboarding@resend.dev>';

/**
 * POST /api/advisor/dispatch-recommendation
 * Dispatches formal investment recommendation to client via email and logs to durable SEBI compliance audit trail
 */
async function dispatchRecommendation(req, res) {
  try {
    const {
      recoId = `reco_${Date.now()}`,
      clientName = 'Client',
      clientEmail,
      title = 'Investment Recommendation',
      summary = '',
      advisorSig = 'Meera Kapoor · SEBI-RIA INA000014523',
      advisorNote = '',
      viaEmail = true,
      viaWhatsApp = false,
      market = 'IN'
    } = req.body;

    const dispatchId = `disp_${crypto.randomBytes(4).toString('hex')}`;
    const sentAt = new Date().toISOString();
    let emailStatus = 'SKIPPED';
    let emailError = null;

    const targetEmail = clientEmail || process.env.TEST_NOTIFICATION_EMAIL || 'aditya.chowdhury.in@gmail.com';
    let resendMessageId = null;

    if (viaEmail && resendClient && targetEmail) {
      try {
        const formattedDate = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        const htmlBody = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 12px; padding: 24px; border: 1px solid #334155;">
            <div style="border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 20px;">
              <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #6366f1; font-weight: 700;">Official RIA Recommendation</span>
              <h2 style="margin: 8px 0 0 0; font-size: 20px; color: #ffffff;">${title}</h2>
              <div style="font-size: 13px; color: #94a3b8; margin-top: 4px;">Prepared for <strong>${clientName}</strong> · ${formattedDate}</div>
            </div>

            <div style="background: #1e293b; border-radius: 8px; padding: 18px; margin-bottom: 20px; border-left: 4px solid #6366f1;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; color: #cbd5e1; letter-spacing: 0.05em;">Fiduciary Recommendation Rationale</h3>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #f1f5f9;">${summary}</p>
              ${advisorNote ? `<div style="margin-top: 12px; font-size: 13px; color: #a5b4fc; background: rgba(99,102,241,0.1); padding: 8px 12px; border-radius: 6px;"><strong>Advisor Note:</strong> ${advisorNote}</div>` : ''}
            </div>

            <div style="font-size: 12px; color: #94a3b8; line-height: 1.5; border-top: 1px solid #334155; padding-top: 16px;">
              <div><strong>Fiduciary Sign-Off:</strong> ${advisorSig}</div>
              <div style="margin-top: 8px; font-size: 11px; color: #64748b;">
                Statutory Regulatory Notice: This communication contains customized investment advice pursuant to SEBI (Investment Advisers) Regulations, 2013 / SEC Investment Advisers Act of 1940. Please review your risk parameters prior to capital deployment.
              </div>
            </div>
          </div>
        `;

        const emailResult = await resendClient.emails.send({
          from: DEFAULT_SENDER,
          to: targetEmail,
          subject: `[Advisory Action] ${title} — ${clientName}`,
          html: htmlBody,
          text: `Official Advisory Recommendation for ${clientName}\n\nTitle: ${title}\n\nSummary:\n${summary}\n\nAdvisor: ${advisorSig}\nSent At: ${sentAt}`
        });

        if (emailResult.error) {
          emailStatus = 'FAILED';
          emailError = emailResult.error.message;
          console.warn('[AdvisorAdmin] Resend delivery error:', emailResult.error);
        } else {
          emailStatus = 'SENT';
          resendMessageId = emailResult?.data?.id;
        }
      } catch (err) {
        emailStatus = 'FAILED';
        emailError = err.message;
        console.warn('[AdvisorAdmin] Email send exception:', err.message);
      }
    }

    // Durable record in SQLite / Supabase PostgreSQL
    const dispatchRecord = {
      id: dispatchId,
      recoId,
      clientName,
      clientEmail: targetEmail,
      title,
      summary,
      advisorSig,
      advisorNote,
      viaEmail,
      viaWhatsApp,
      status: emailStatus,
      emailError,
      resendId: resendMessageId,
      sentAt,
      market
    };

    saveAdvisorDispatch(dispatchRecord);

    // Durable compliance audit trail
    logAuditEvent({
      id: `audit_disp_${dispatchId}`,
      eventType: 'SEBI_ADVISORY_RECOMMENDATION_DISPATCHED',
      actor: advisorSig,
      market,
      details: {
        dispatchId,
        recoId,
        clientName,
        targetEmail,
        title,
        emailStatus,
        resendMessageId
      },
      createdAt: sentAt
    });

    if (emailStatus === 'FAILED') {
      const isSandboxRestriction = emailError && emailError.includes('only send testing emails to your own email address');
      return res.status(400).json({
        success: false,
        error: isSandboxRestriction
          ? `Resend Sandbox Limit: Testing emails can only be sent to your registered account email (aditya.chowdhury.in@gmail.com). To send to other addresses, verify a custom domain at resend.com/domains.`
          : `Email dispatch failed: ${emailError}`,
        emailStatus: 'FAILED',
        dispatch: dispatchRecord
      });
    }

    return res.json({
      success: true,
      message: `Recommendation successfully dispatched via Resend to ${targetEmail}!`,
      dispatch: dispatchRecord
    });
  } catch (err) {
    console.error('[AdvisorAdmin] Dispatch error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/advisor/onboard-client
 * Persists newly completed onboarding profile directly to durable database and client book
 */
function onboardClient(req, res) {
  try {
    const {
      name,
      dob,
      pan,
      aadhaar,
      email,
      phone,
      city,
      income,
      profession,
      taxBracket,
      riskProfile,
      ipsText,
      market = 'IN'
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Client full name is required.' });
    }

    const clientId = `CL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const numIncome = Number(income) || 1200000;
    const estimatedAUM = Math.round(numIncome * 2.8);

    let age = 34;
    if (dob) {
      const birth = new Date(dob);
      if (!isNaN(birth.getTime())) {
        age = Math.floor((Date.now() - birth.getTime()) / 31557600000);
      }
    }

    const clientRecord = {
      id: clientId,
      advisorId: 'adv001',
      name,
      dob: dob || '',
      age,
      pan: pan || '',
      aadhaar: aadhaar ? `****${aadhaar.slice(-4)}` : '',
      email: email || '',
      phone: phone || '',
      city: city || 'Mumbai',
      income: numIncome,
      profession: profession || 'Professional',
      taxBracket: taxBracket || '30%',
      riskProfile: riskProfile?.label || riskProfile || 'Moderate',
      ipsText: ipsText || '',
      aum: estimatedAUM,
      status: 'Active',
      healthScore: 78,
      lastActivity: 'Just onboarded',
      pendingActions: 0,
      onboardedAt: new Date().toISOString(),
      market
    };

    saveAdvisorClient(clientRecord);

    logAuditEvent({
      id: `audit_client_${clientId}`,
      eventType: 'CLIENT_DIGITALLY_ONBOARDED',
      actor: 'Meera Kapoor · INA000014523',
      market,
      details: {
        clientId,
        name,
        riskProfile: clientRecord.riskProfile,
        estimatedAUM
      },
      createdAt: clientRecord.onboardedAt
    });

    return res.json({
      success: true,
      message: `Client ${name} (${clientId}) successfully registered and added to active Client Book.`,
      client: clientRecord
    });
  } catch (err) {
    console.error('[AdvisorAdmin] Onboard error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/advisor/clients
 */
function listAdvisorClients(req, res) {
  try {
    const dbClients = getAdvisorClients('adv001');
    return res.json({ success: true, clients: dbClients });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/advisor/dispatches
 */
function listAdvisorDispatches(req, res) {
  try {
    const dispatches = getAdvisorDispatches(100);
    return res.json({ success: true, dispatches });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  dispatchRecommendation,
  onboardClient,
  listAdvisorClients,
  listAdvisorDispatches
};
