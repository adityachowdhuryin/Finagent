const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Hard-coded category average benchmarks for underperformance detection
const CATEGORY_BENCHMARKS = {
  'Large Cap': 13.5, 'Mid Cap': 18.0, 'Small Cap': 22.0,
  'Flexi Cap': 15.5, 'ELSS': 14.0, 'Debt': 7.0, 'Index': 13.0,
};

async function analyzePortfolio(req, res) {
  const { portfolio } = req.body; // portfolio = state.consumer
  if (!portfolio) return res.json({ alerts: [] });

  const alerts = [];
  const { holdings, user, netWorth, goals, healthScore } = portfolio;

  // --- Rule-based checks (fast, no Gemini needed) ---

  // 1. Equity concentration check
  if (holdings.equities && netWorth.total > 0) {
    holdings.equities.forEach(eq => {
      const pct = ((eq.value || 0) / netWorth.total) * 100;
      if (pct > 20) {
        alerts.push({
          id: `conc_${eq.symbol}`,
          type: 'concentration',
          severity: 'high',
          icon: '⚠️',
          title: `${eq.name || eq.symbol} is ${pct.toFixed(0)}% of your portfolio`,
          body: `Single stock concentration above 20% adds significant risk. Consider trimming to bring it under 15%.`,
          action: `Trim ${eq.name || eq.symbol} and diversify into index funds`,
          prompt: `My ${eq.name || eq.symbol} holding is ${pct.toFixed(0)}% of my total portfolio. How much should I sell and what should I do with the proceeds?`,
        });
      }
    });
  }

  // 2. MF underperformance check
  if (holdings.mutualFunds) {
    holdings.mutualFunds.forEach(mf => {
      const category = mf.category || 'Large Cap';
      const benchmark = CATEGORY_BENCHMARKS[category] || 13.5;
      const cagr = mf.cagr3Y || mf.pnlPct || 0;
      if (cagr < benchmark - 2 && cagr !== 0) {
        alerts.push({
          id: `underperf_${(mf.name || '').slice(0, 20)}`,
          type: 'underperformance',
          severity: 'medium',
          icon: '📉',
          title: `${(mf.name || '').replace(' Direct Growth', '')} underperforming`,
          body: `This fund's ${cagr.toFixed(1)}% return is ${(benchmark - cagr).toFixed(1)}% below the ${category} category average of ${benchmark}%. Consider reviewing.`,
          action: 'Review and consider switching',
          prompt: `My ${mf.name} mutual fund has returned ${cagr.toFixed(1)}% CAGR but the category average is ${benchmark}%. Should I switch and to what?`,
        });
      }
    });
  }

  // 3. Insurance gap check
  const totalCover = (holdings.insurance || []).reduce((s, i) => s + (i.sumAssured || 0), 0);
  const income = user?.income || 0;
  if (income > 0 && totalCover < income * 10) {
    const gap = income * 10 - totalCover;
    alerts.push({
      id: 'insurance_gap',
      type: 'insurance',
      severity: 'high',
      icon: '🛡️',
      title: `Insurance cover ₹${(totalCover/100000).toFixed(0)}L — you need ₹${(income*10/100000).toFixed(0)}L`,
      body: `Your current life cover is only ${Math.round(totalCover/income)}x your annual income. Financial advisors recommend 10x. You're ₹${(gap/100000).toFixed(0)}L short.`,
      action: 'Get a term insurance quote',
      prompt: `My current life insurance cover is ₹${(totalCover/100000).toFixed(0)}L and my income is ₹${(income/100000).toFixed(0)}L per year. How much term insurance do I need and what should I look for?`,
    });
  }

  // 4. Emergency fund check
  const liquidAssets = (holdings.fixedDeposits || []).reduce((s, fd) => s + (fd.amount || 0), 0);
  const monthlyExpenses = income > 0 ? (income * 0.6) / 12 : 50000;
  const emergencyMonths = liquidAssets / monthlyExpenses;
  if (emergencyMonths < 3 && liquidAssets >= 0) {
    alerts.push({
      id: 'emergency_fund',
      type: 'emergency',
      severity: emergencyMonths < 1 ? 'high' : 'medium',
      icon: '🏦',
      title: `Emergency fund covers only ${emergencyMonths.toFixed(1)} months`,
      body: `You need 3–6 months of expenses (₹${(monthlyExpenses*3/1000).toFixed(0)}K–₹${(monthlyExpenses*6/1000).toFixed(0)}K) in liquid savings. Current liquid assets: ₹${(liquidAssets/1000).toFixed(0)}K.`,
      action: 'Build emergency fund first',
      prompt: `My emergency fund covers only ${emergencyMonths.toFixed(1)} months of expenses. How should I build it up without disrupting my investments?`,
    });
  }

  // 5. Goal drift check
  if (goals && goals.length > 0) {
    goals.forEach(goal => {
      if (goal.status === 'at-risk' || (goal.status === 'behind' && goal.progress < 30)) {
        alerts.push({
          id: `goal_${goal.name}`,
          type: 'goal',
          severity: goal.status === 'at-risk' ? 'high' : 'medium',
          icon: '🎯',
          title: `"${goal.name}" goal is ${goal.status}`,
          body: `Progress: ${goal.progress}% with ${goal.yearsLeft} years left. You may need to increase your monthly contribution to stay on track.`,
          action: 'Review goal SIP',
          prompt: `My goal "${goal.name}" is ${goal.status} at ${goal.progress}% progress with ${goal.yearsLeft} years remaining. What should I do to get back on track?`,
        });
      }
    });
  }

  // 6. LTCG exemption opportunity
  const unrealizedLTCG = (holdings.equities || [])
    .filter(eq => (eq.holdingDays || 0) > 365 && (eq.pnl || 0) > 0)
    .reduce((s, eq) => s + (eq.pnl || 0), 0)
    + (holdings.mutualFunds || [])
    .filter(mf => (mf.holdingDays || 366) > 365 && (mf.pnl || 0) > 0)
    .reduce((s, mf) => s + (mf.pnl || 0), 0);

  if (unrealizedLTCG > 0 && unrealizedLTCG < 200000) {
    alerts.push({
      id: 'ltcg_opportunity',
      type: 'tax',
      severity: 'low',
      icon: '💡',
      title: `Book ₹${(unrealizedLTCG/1000).toFixed(0)}K LTCG tax-free this year`,
      body: `You have ₹${(unrealizedLTCG/1000).toFixed(0)}K in long-term gains. The ₹1.25L annual exemption resets April 1. Consider booking and rebuying to reset your cost basis.`,
      action: 'Book and rebuy to reset cost basis',
      prompt: `I have ₹${(unrealizedLTCG/1000).toFixed(0)}K in unrealized long-term capital gains. Should I book them now to use the ₹1.25L exemption? How does the book-and-rebuy strategy work?`,
    });
  }

  // Use Gemini to generate one additional personalized insight
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are a financial advisor AI. Analyze this Indian investor's portfolio and generate ONE additional personalized alert not already covered by these existing alerts: ${JSON.stringify(alerts.map(a => a.type))}.

Portfolio summary:
- Net Worth: ₹${((netWorth?.total || 0)/100000).toFixed(1)}L
- Age: ${user?.age || 'unknown'}, City: ${user?.city || 'India'}
- Equity holdings: ${(holdings.equities || []).length} stocks
- MF holdings: ${(holdings.mutualFunds || []).length} funds
- Health Score: ${healthScore?.overall || 0}/100
- Goals: ${(goals || []).map(g => g.name).join(', ') || 'none'}

Return JSON only:
{ "id": "ai_insight", "type": "insight", "severity": "low", "icon": "🤖", "title": "...", "body": "...", "action": "...", "prompt": "..." }`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(text);
    if (parsed.title) alerts.push(parsed);
  } catch (e) {
    // Gemini insight is additive — skip on error
  }

  res.json({ alerts, generatedAt: new Date().toISOString() });
}

async function sendDailyDigest(req, res) {
  const { alerts, userEmail, userName } = req.body;
  if (!alerts || alerts.length === 0) return res.json({ sent: false, reason: 'no alerts' });

  try {
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const highAlerts = alerts.filter(a => a.severity === 'high');
    const medAlerts = alerts.filter(a => a.severity === 'medium');
    const lowAlerts = alerts.filter(a => a.severity === 'low');

    const renderAlert = (a) => `
      <div style="margin-bottom:16px;padding:16px;border-radius:8px;background:#1e1e2e;border-left:4px solid ${a.severity === 'high' ? '#ef4444' : a.severity === 'medium' ? '#f59e0b' : '#6366f1'}">
        <div style="font-size:16px;font-weight:700;color:#f1f5f9;margin-bottom:6px">${a.icon} ${a.title}</div>
        <div style="font-size:14px;color:#94a3b8;line-height:1.5">${a.body}</div>
        <div style="margin-top:10px;font-size:13px;color:#818cf8">💡 ${a.action}</div>
      </div>`;

    const html = `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#0f0f23;padding:32px;border-radius:12px;color:#f1f5f9">
        <div style="text-align:center;margin-bottom:24px">
          <h1 style="color:#6366f1;font-size:24px;margin:0">🩺 Portfolio Doctor</h1>
          <p style="color:#64748b;margin:8px 0 0">Daily Health Check — ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <p style="color:#94a3b8">Hi ${userName || 'there'},</p>
        <p style="color:#94a3b8">Here's your daily portfolio health summary:</p>
        ${highAlerts.length ? `<h3 style="color:#ef4444">🔴 High Priority (${highAlerts.length})</h3>${highAlerts.map(renderAlert).join('')}` : ''}
        ${medAlerts.length ? `<h3 style="color:#f59e0b">🟡 To Review (${medAlerts.length})</h3>${medAlerts.map(renderAlert).join('')}` : ''}
        ${lowAlerts.length ? `<h3 style="color:#6366f1">💡 Opportunities (${lowAlerts.length})</h3>${lowAlerts.map(renderAlert).join('')}` : ''}
        <div style="margin-top:24px;text-align:center">
          <a href="http://localhost:5173/app/doctor" style="background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">View Full Analysis →</a>
        </div>
        <p style="margin-top:24px;font-size:12px;color:#475569;text-align:center">FinAgent · Your AI Financial Advisor</p>
      </div>`;

    await resend.emails.send({
      from: 'FinAgent Doctor <onboarding@resend.dev>',
      to: userEmail,
      subject: `🩺 ${highAlerts.length > 0 ? `${highAlerts.length} urgent alert${highAlerts.length > 1 ? 's' : ''}` : 'Daily health check'} — FinAgent Portfolio Doctor`,
      html,
    });
    res.json({ sent: true });
  } catch (e) {
    res.json({ sent: false, error: e.message });
  }
}

module.exports = { analyzePortfolio, sendDailyDigest };
