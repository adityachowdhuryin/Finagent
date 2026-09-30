const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Resend } = require('resend');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'FinAgent Reports <onboarding@resend.dev>';

// In-memory schedule store (replace with Firestore when Firebase is live)
const schedules = {}; // { email: { reportDay, ccEmail, lastSent } }

function formatINR(n) {
  return '₹' + (n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function formatChange(n) {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${formatINR(n)}`;
}

async function buildReportHTML(portfolio, aiInsight) {
  const { user, netWorth, holdings, goals, healthScore } = portfolio;
  const month = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  const equities = holdings?.equities || [];
  const mfs = holdings?.mutualFunds || [];
  const allHoldings = [
    ...equities.map(e => ({ name: e.name || e.symbol, pnlPct: e.pnlPct || 0, pnl: e.pnl || 0 })),
    ...mfs.map(m => ({ name: (m.name || '').replace(' Direct Growth', ''), pnlPct: m.pnlPct || 0, pnl: m.pnl || 0 })),
  ];
  const topGainer = [...allHoldings].sort((a, b) => b.pnlPct - a.pnlPct)[0];
  const topLoser = [...allHoldings].sort((a, b) => a.pnlPct - b.pnlPct)[0];

  const goalsOnTrack = (goals || []).filter(g => g.status === 'on-track').length;
  const goalsBehind = (goals || []).filter(g => g.status !== 'on-track').length;
  const mostBehind = [...(goals || [])].sort((a, b) => (a.progress || 0) - (b.progress || 0))[0];

  const fds = holdings?.fixedDeposits || [];
  const upcomingFDs = fds.filter(fd => (fd.daysRemaining || 0) < 60 && (fd.daysRemaining || 0) > 0);

  const scoreColor = (healthScore?.overall || 0) >= 75 ? '#10b981' : (healthScore?.overall || 0) >= 55 ? '#f59e0b' : '#ef4444';

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#0a0a1a;font-family:Inter,-apple-system,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:24px">

  <!-- Header -->
  <div style="text-align:center;margin-bottom:32px">
    <h1 style="color:#6366f1;font-size:22px;font-weight:800;margin:0">FinAgent</h1>
    <p style="color:#64748b;font-size:13px;margin:6px 0 0">Monthly Financial Summary — ${month}</p>
  </div>

  <!-- Net Worth -->
  <div style="background:linear-gradient(135deg,#1e1b4b,#0f0f23);border:1px solid rgba(99,102,241,0.3);border-radius:12px;padding:24px;margin-bottom:16px;text-align:center">
    <div style="color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px">Total Net Worth</div>
    <div style="color:#f1f5f9;font-size:36px;font-weight:800;font-family:'Space Grotesk',sans-serif">${formatINR(netWorth?.total || 0)}</div>
    ${healthScore?.overall ? `<div style="margin-top:12px;display:inline-block;padding:4px 14px;border-radius:20px;background:${scoreColor}22;color:${scoreColor};font-weight:700;font-size:13px">Health Score: ${healthScore.overall}/100</div>` : ''}
  </div>

  <!-- Two col: gainer + loser -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
    <div style="background:#1e1e2e;border-radius:10px;padding:16px">
      <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px">📈 Top Performer</div>
      ${topGainer ? `<div style="color:#f1f5f9;font-weight:700;font-size:14px;margin-bottom:4px">${topGainer.name.split(' ').slice(0, 3).join(' ')}</div><div style="color:#10b981;font-weight:700">${topGainer.pnlPct >= 0 ? '+' : ''}${topGainer.pnlPct.toFixed(1)}%</div>` : '<div style="color:#64748b">No data</div>'}
    </div>
    <div style="background:#1e1e2e;border-radius:10px;padding:16px">
      <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px">⚠️ Needs Review</div>
      ${topLoser && topLoser.pnlPct < 0 ? `<div style="color:#f1f5f9;font-weight:700;font-size:14px;margin-bottom:4px">${topLoser.name.split(' ').slice(0, 3).join(' ')}</div><div style="color:#ef4444;font-weight:700">${topLoser.pnlPct.toFixed(1)}%</div>` : '<div style="color:#10b981">All positive ✓</div>'}
    </div>
  </div>

  <!-- Goals -->
  ${goals?.length ? `
  <div style="background:#1e1e2e;border-radius:10px;padding:16px;margin-bottom:16px">
    <div style="color:#f1f5f9;font-weight:700;margin-bottom:12px">🎯 Goals</div>
    <div style="display:flex;gap:16px;margin-bottom:${mostBehind ? '12px' : '0'}">
      <div style="color:#10b981">✓ ${goalsOnTrack} on track</div>
      ${goalsBehind ? `<div style="color:#f59e0b">⚠ ${goalsBehind} behind</div>` : ''}
    </div>
    ${mostBehind ? `<div style="background:#0f0f23;border-radius:8px;padding:12px">
      <div style="color:#94a3b8;font-size:13px">Most behind: <strong style="color:#f1f5f9">${mostBehind.name}</strong></div>
      <div style="background:#1e1e2e;border-radius:4px;height:6px;margin:8px 0">
        <div style="background:#6366f1;height:6px;border-radius:4px;width:${Math.min(100, mostBehind.progress || 0)}%"></div>
      </div>
      <div style="color:#64748b;font-size:12px">${mostBehind.progress || 0}% complete · ${mostBehind.yearsLeft || 0} years left</div>
    </div>` : ''}
  </div>` : ''}

  <!-- Upcoming -->
  ${upcomingFDs.length ? `
  <div style="background:#1e1e2e;border-radius:10px;padding:16px;margin-bottom:16px">
    <div style="color:#f1f5f9;font-weight:700;margin-bottom:10px">🔔 Upcoming</div>
    ${upcomingFDs.map(fd => `<div style="color:#94a3b8;font-size:13px;margin-bottom:6px">• FD maturity: <strong style="color:#f59e0b">${fd.bank || 'FD'} ${formatINR(fd.amount)}</strong> in ${fd.daysRemaining} days</div>`).join('')}
  </div>` : ''}

  <!-- AI Insight -->
  ${aiInsight ? `
  <div style="background:linear-gradient(135deg,rgba(99,102,241,0.1),rgba(99,102,241,0.03));border:1px solid rgba(99,102,241,0.2);border-radius:10px;padding:16px;margin-bottom:16px">
    <div style="color:#818cf8;font-weight:700;margin-bottom:8px">🤖 AI Insight</div>
    <div style="color:#cbd5e1;font-size:14px;line-height:1.6">${aiInsight}</div>
  </div>` : ''}

  <!-- CTA -->
  <div style="text-align:center;margin:24px 0">
    <a href="http://localhost:5173/app/dashboard" style="background:#6366f1;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">View Full Dashboard →</a>
  </div>

  <p style="color:#334155;font-size:11px;text-align:center;margin:24px 0 0">FinAgent · Your AI Financial Advisor · <a href="#" style="color:#475569">Unsubscribe</a></p>
</div>
</body>
</html>`;
}

// POST /api/reports/monthly/schedule — save user's preferences
async function scheduleReport(req, res) {
  const { email, reportDay, ccEmail } = req.body;
  if (!email || !reportDay) return res.status(400).json({ error: 'email and reportDay required' });
  schedules[email] = { reportDay: parseInt(reportDay), ccEmail: ccEmail || null, lastSent: null };
  res.json({ success: true });
}

// POST /api/reports/monthly/send-now — send report immediately (test or on-demand)
async function sendNow(req, res) {
  const { portfolio, userEmail, ccEmail } = req.body;
  if (!portfolio || !userEmail) return res.status(400).json({ error: 'portfolio and userEmail required' });

  try {
    // Generate AI insight
    let aiInsight = null;
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `Write a 2-3 sentence personalized financial insight for an Indian investor. Net worth: ₹${((portfolio.netWorth?.total || 0)/100000).toFixed(1)}L, Risk profile: ${portfolio.user?.riskProfile || 'Moderate'}, Health score: ${portfolio.healthScore?.overall || 0}/100, MF holdings: ${(portfolio.holdings?.mutualFunds || []).length}, Goals: ${(portfolio.goals || []).length}. Be specific, actionable, and encouraging. No generic advice.`;
      const result = await model.generateContent(prompt);
      aiInsight = result.response.text().trim();
    } catch { /* AI insight is optional */ }

    const html = await buildReportHTML(portfolio, aiInsight);
    const month = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    const subject = `📊 Your ${month} Financial Summary — FinAgent`;

    const to = ccEmail ? [userEmail, ccEmail] : userEmail;
    await resend.emails.send({ from: FROM, to, subject, html });

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// GET /api/reports/monthly/cron — called by Render cron daily at 8 AM IST
async function cronSend(req, res) {
  const today = new Date().getDate();
  const sent = [];

  for (const [email, prefs] of Object.entries(schedules)) {
    if (prefs.reportDay === today) {
      // In a real app, fetch portfolio from Firestore here
      // For now, log the send
      console.log(`[Monthly Report Cron] Would send to ${email} (day ${today})`);
      sent.push(email);
    }
  }

  res.json({ sent, day: today });
}

module.exports = { scheduleReport, sendNow, cronSend };
