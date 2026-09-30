const fetch = require('node-fetch');

const API_BASE = process.env.RESEND_API_KEY ? 'https://api.resend.com' : null;

const FROM = process.env.RESEND_FROM_EMAIL || 'FinAgent <onboarding@resend.dev>';

function buildHeaders() {
  return {
    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function sendEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email] RESEND_API_KEY not set — would send to ${to}: ${subject}`);
    return { success: true, simulated: true };
  }
  const res = await fetch(`${API_BASE}/emails`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ from: FROM, to: Array.isArray(to) ? to : [to], subject, html }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Resend error');
  return { success: true, id: data.id };
}

// POST /api/email/welcome
module.exports.welcome = async (req, res) => {
  const { name, email, role } = req.body;
  try {
    const result = await sendEmail({
      to: email,
      subject: `Welcome to FinAgent, ${name}! 🚀`,
      html: welcomeTemplate(name, role),
    });
    res.json(result);
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

// POST /api/email/report — quarterly report with PDF attachment
module.exports.report = async (req, res) => {
  const { to, clientName, advisorName, period, pdfBase64 } = req.body;
  try {
    const emailPayload = {
      from: FROM,
      to: [to],
      subject: `Your ${period} Portfolio Report — FinAgent`,
      html: reportTemplate(clientName, advisorName, period),
    };
    if (pdfBase64 && process.env.RESEND_API_KEY) {
      emailPayload.attachments = [{ filename: `FinAgent_Report_${period}.pdf`, content: pdfBase64 }];
    }
    if (!process.env.RESEND_API_KEY) {
      console.log(`[Email] Would send report to ${to}`);
      return res.json({ success: true, simulated: true });
    }
    const r = await fetch(`${API_BASE}/emails`, { method: 'POST', headers: buildHeaders(), body: JSON.stringify(emailPayload) });
    const data = await r.json();
    res.json({ success: true, id: data.id });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

// POST /api/email/alert
module.exports.alert = async (req, res) => {
  const { to, name, alertTitle, alertBody } = req.body;
  try {
    const result = await sendEmail({ to, subject: `⚠️ FinAgent Alert: ${alertTitle}`, html: alertTemplate(name, alertTitle, alertBody) });
    res.json(result);
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

// POST /api/email/invoice
module.exports.invoice = async (req, res) => {
  const { to, clientName, advisorName, amount, period, pdfBase64 } = req.body;
  try {
    const result = await sendEmail({ to, subject: `Invoice from ${advisorName} — ${period}`, html: invoiceTemplate(clientName, advisorName, amount, period) });
    res.json(result);
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

// POST /api/email/portal-invite
module.exports.portalInvite = async (req, res) => {
  const { to, clientName, advisorName, magicLink } = req.body;
  try {
    const result = await sendEmail({ to, subject: `${advisorName} has shared your FinAgent portal`, html: portalInviteTemplate(clientName, advisorName, magicLink) });
    res.json(result);
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

// POST /api/email/itr — send ITR summary to CA
module.exports.itr = async (req, res) => {
  const { to, clientName, year, pdfBase64 } = req.body;
  try {
    const result = await sendEmail({ to, subject: `ITR Summary FY ${year} — ${clientName} (via FinAgent)`, html: itrTemplate(clientName, year) });
    res.json(result);
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

// ── Email Templates ─────────────────────────────────────────────────────────

function base(content) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body { font-family: 'Inter', Arial, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 0; }
    .wrap { max-width: 600px; margin: 32px auto; background: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid rgba(99,102,241,0.2); }
    .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 32px; text-align: center; }
    .logo { font-size: 28px; font-weight: 800; color: white; letter-spacing: -0.5px; }
    .logo span { color: #a5b4fc; }
    .body { padding: 32px; }
    .footer { padding: 20px 32px; border-top: 1px solid rgba(255,255,255,0.08); color: #64748b; font-size: 12px; text-align: center; }
    .btn { display: inline-block; background: #4f46e5; color: white !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0; }
    .highlight { color: #a5b4fc; font-weight: 600; }
    p { line-height: 1.7; color: #cbd5e1; }
    h2 { color: #f1f5f9; margin-top: 0; }
  </style></head><body><div class="wrap">
    <div class="header"><div class="logo">Fin<span>Agent</span></div><div style="color: rgba(255,255,255,0.7); font-size: 13px; margin-top: 6px;">AI-powered wealth intelligence</div></div>
    <div class="body">${content}</div>
    <div class="footer">FinAgent · SEBI Registered Platform · <a href="#" style="color: #4f46e5">Unsubscribe</a></div>
  </div></body></html>`;
}

function welcomeTemplate(name, role) {
  return base(`<h2>Welcome to FinAgent, ${name}! 🚀</h2>
    <p>Your ${role === 'advisor' ? 'advisor' : 'investor'} account is ready. Here's what you can do right away:</p>
    <ul style="color: #cbd5e1; line-height: 2;">
      <li>📊 View your live portfolio dashboard</li>
      <li>🤖 Chat with your AI financial advisor</li>
      <li>🎯 Set up and track your financial goals</li>
      <li>📰 Get personalized market news and alerts</li>
    </ul>
    <a href="https://finagent.app/app" class="btn">Open FinAgent →</a>`);
}

function reportTemplate(clientName, advisorName, period) {
  return base(`<h2>Your ${period} Portfolio Report</h2>
    <p>Dear <span class="highlight">${clientName}</span>,</p>
    <p>Your quarterly portfolio report from <strong>${advisorName}</strong> is attached to this email as a PDF.</p>
    <p>The report includes your portfolio performance, asset allocation, goal progress, and AI-generated insights.</p>
    <p style="color: #94a3b8; font-size: 13px;">This report was generated by FinAgent on behalf of your advisor. For queries, please contact your advisor directly.</p>`);
}

function alertTemplate(name, title, body) {
  return base(`<h2>⚠️ ${title}</h2>
    <p>Dear <span class="highlight">${name}</span>,</p>
    <p>${body}</p>
    <a href="https://finagent.app/app/dashboard" class="btn">View in FinAgent →</a>`);
}

function invoiceTemplate(clientName, advisorName, amount, period) {
  return base(`<h2>Advisory Fee Invoice</h2>
    <p>Dear <span class="highlight">${clientName}</span>,</p>
    <p>Please find your advisory fee invoice for <strong>${period}</strong> from <strong>${advisorName}</strong> attached.</p>
    <div style="background: rgba(99,102,241,0.1); border-radius: 8px; padding: 16px; margin: 16px 0; border: 1px solid rgba(99,102,241,0.3);">
      <div style="font-size: 13px; color: #94a3b8; margin-bottom: 4px;">Amount Due</div>
      <div style="font-size: 28px; font-weight: 700; color: #a5b4fc;">${amount}</div>
    </div>`);
}

function portalInviteTemplate(clientName, advisorName, magicLink) {
  return base(`<h2>Your FinAgent Portal is Ready</h2>
    <p>Dear <span class="highlight">${clientName}</span>,</p>
    <p><strong>${advisorName}</strong> has given you access to your personalized FinAgent wealth portal. You can now view your portfolio, track goals, and access reports — all in one place.</p>
    <a href="${magicLink || 'https://finagent.app/login'}" class="btn">Access Your Portal →</a>
    <p style="color: #64748b; font-size: 12px;">This link is for your use only. Do not share it with others.</p>`);
}

function itrTemplate(clientName, year) {
  return base(`<h2>ITR Summary FY ${year}</h2>
    <p>The attached document contains the tax return summary for <span class="highlight">${clientName}</span> for FY ${year}, prepared via FinAgent.</p>
    <p>The summary includes:</p>
    <ul style="color: #cbd5e1; line-height: 2;">
      <li>Capital gains (STCG + LTCG) from all holdings</li>
      <li>Section 80C, 80D, 80CCD deductions</li>
      <li>Estimated tax liability (Old vs New regime)</li>
    </ul>`);
}

// Generic send — used by SIP Optimizer, Watchlist alerts, Portfolio Doctor digest
module.exports.send = async (req, res) => {
  try {
    const { to, subject, html, text } = req.body;
    if (!to || !subject) return res.status(400).json({ error: 'to and subject are required' });
    const result = await sendEmail({ to, subject, html: html || `<p>${text || ''}</p>` });
    res.json({ success: true, id: result?.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
