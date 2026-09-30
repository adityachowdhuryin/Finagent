export function computeHealthScore(holdings, goals, userProfile) {
  if (!holdings || (Array.isArray(holdings) && holdings.length === 0) || Object.keys(holdings).length === 0) {
    if (!goals || goals.length === 0) {
      return { overall: 0, grade: 'Unrated', empty: true, percentile: 0, components: [], history: [], improvements: [] };
    }
  }

  // Fallback defaults
  const income = userProfile?.income || 600000;
  const monthly_income = income / 12;
  const monthly_expenses = monthly_income * 0.6;

  // 1. Liquidity Buffer (20%)
  const fd_total = holdings?.fd?.reduce((sum, item) => sum + (item.principal || item.invested || 0), 0) || 0;
  const epf_balance = holdings?.epf?.balance || 0;
  const liquid_assets = fd_total + (epf_balance * 0.2);

  const total_loans_emi = holdings?.loans?.reduce((sum, loan) => sum + (loan.emi || 0), 0) || 0;
  const monthly_need = monthly_expenses + total_loans_emi;
  
  const months_covered = monthly_need > 0 ? liquid_assets / monthly_need : 0;
  let lb_score = Math.min(Math.max((months_covered / 6) * 100, 0), 100);
  let lb_status = lb_score >= 75 ? 'good' : lb_score >= 50 ? 'fair' : 'poor';
  let lb_detail = `${months_covered.toFixed(1)} months of expenses covered by liquid assets`;

  // 2. Diversification (20%)
  let div_score = 100;
  let div_detail = '';
  const equities = holdings?.equity || [];
  const mf = holdings?.mf || [];
  
  if (equities.length === 0 && mf.length === 0) {
    div_score = 60;
    div_detail = 'No equity or mutual fund holdings found.';
  } else {
    // Sector concentration
    let sectors = {};
    let total_equity_value = 0;
    equities.forEach(eq => {
      let val = eq.value || (eq.quantity * eq.currentPrice) || 0;
      total_equity_value += val;
      let sector = eq.sector || 'Other';
      sectors[sector] = (sectors[sector] || 0) + val;
    });

    let max_sector_pct = 0;
    let top_sector = 'None';
    if (total_equity_value > 0) {
      for (const [sec, val] of Object.entries(sectors)) {
        let pct = (val / total_equity_value) * 100;
        if (pct > max_sector_pct) {
          max_sector_pct = pct;
          top_sector = sec;
        }
      }
    }

    // Asset class balance
    // Calculate total net worth (simplified for diversification check)
    let total_net_worth = 0;
    ['equity', 'mf', 'fd', 'gold', 'realEstate'].forEach(key => {
      const arr = holdings?.[key] || [];
      if (Array.isArray(arr)) {
        arr.forEach(item => {
          total_net_worth += item.value || (item.quantity && item.currentPrice ? item.quantity * item.currentPrice : 0) || item.principal || item.invested || 0;
        });
      } else if (holdings?.[key]) { // object like epf
          total_net_worth += holdings[key].value || holdings[key].balance || 0;
      }
    });

    let equity_mf_value = total_equity_value;
    mf.forEach(item => {
      equity_mf_value += item.value || (item.units * item.nav) || item.invested || 0;
    });

    let equity_pct = total_net_worth > 0 ? (equity_mf_value / total_net_worth) * 100 : 0;

    let concentration_penalty = Math.max(0, max_sector_pct - 30) * 1.5;
    let equity_penalty = Math.max(0, equity_pct - 70) * 0.5;

    div_score = Math.min(Math.max(100 - concentration_penalty - equity_penalty, 0), 100);
    if (div_score > 80) {
      div_detail = 'Well diversified across asset classes';
    } else {
      div_detail = top_sector !== 'None' ? `Highest sector exposure: ${top_sector} (${max_sector_pct.toFixed(0)}%)` : 'Needs better diversification';
    }
  }
  let div_status = div_score >= 75 ? 'good' : div_score >= 50 ? 'fair' : 'poor';

  // 3. Debt Management (20%)
  let debt_score = 100;
  let debt_status = 'good';
  let debt_detail = 'No outstanding loans — excellent!';
  
  if (total_loans_emi > 0) {
    let emi_ratio = total_loans_emi / monthly_income;
    debt_score = Math.min(Math.max((1 - emi_ratio / 0.5) * 100, 0), 100);
    debt_status = debt_score >= 75 ? 'good' : debt_score >= 50 ? 'fair' : 'poor';
    debt_detail = `EMI is ${(emi_ratio * 100).toFixed(0)}% of monthly income`;
  }

  // 4. Insurance Coverage (20%)
  const annual_income = income;
  const recommended_cover = annual_income * 10;
  const insurance = holdings?.insurance || [];
  
  const term_policies = insurance.filter(i => i.type?.toLowerCase() === 'term life' || i.type?.toLowerCase() === 'term');
  const actual_cover = term_policies.reduce((sum, i) => sum + (i.sumAssured || i.coverAmount || 0), 0);
  
  const has_health = insurance.some(i => i.type?.toLowerCase() === 'health');
  const health_bonus = has_health ? 15 : 0;
  
  let ins_score = Math.max(health_bonus, 0);
  let ins_detail = 'No term insurance detected — high priority';
  if (actual_cover > 0) {
    let coverage_ratio = actual_cover / recommended_cover;
    ins_score = Math.min(Math.max(coverage_ratio * 85 + health_bonus, 0), 100);
    ins_detail = `Term cover ₹${(actual_cover/100000).toFixed(0)}L vs ₹${(recommended_cover/100000).toFixed(0)}L recommended (10× income)`;
  }
  let ins_status = ins_score >= 75 ? 'good' : ins_score >= 50 ? 'fair' : 'poor';

  // 5. Goal Progress (20%)
  let goal_score = 50;
  let goal_detail = 'No goals set yet — add goals to track progress';
  let safe_goals = goals || [];
  
  if (safe_goals.length > 0) {
    const on_track = safe_goals.filter(g => g.status === 'on-track' || g.status === 'ahead' || g.progress >= g.requiredProgress);
    goal_score = Math.min(Math.max((on_track.length / safe_goals.length) * 100, 0), 100);
    goal_detail = `${on_track.length} of ${safe_goals.length} goals on track`;
  }
  let goal_status = goal_score >= 75 ? 'good' : goal_score >= 50 ? 'fair' : 'poor';

  // Overall Score
  const overall = Math.round((lb_score + div_score + debt_score + ins_score + goal_score) / 5);
  const grade = overall >= 85 ? 'Excellent' : overall >= 70 ? 'Good' : overall >= 55 ? 'Fair' : 'Poor';
  const percentile = Math.min(95, Math.round(overall * 0.9 + Math.random() * 5));

  // Improvements
  const improvements = [];
  const comps = [
    { name: 'Liquidity Buffer', score: lb_score },
    { name: 'Diversification', score: div_score },
    { name: 'Debt Management', score: debt_score },
    { name: 'Insurance Coverage', score: ins_score },
    { name: 'Goal Progress', score: goal_score }
  ].sort((a, b) => a.score - b.score);

  if (comps[0].name === 'Insurance Coverage' && comps[0].score < 75) improvements.push({ action: 'Increase Term Life Insurance', impact: 'High', cost: 'Low' });
  else if (comps[0].name === 'Liquidity Buffer' && comps[0].score < 75) improvements.push({ action: 'Build Emergency Fund (FD/Liquid Fund)', impact: 'High', cost: 'Medium' });
  else if (comps[0].name === 'Debt Management' && comps[0].score < 75) improvements.push({ action: 'Prepay High-Interest Loans', impact: 'Medium', cost: 'High' });
  else if (comps[0].name === 'Diversification' && comps[0].score < 75) improvements.push({ action: 'Rebalance Portfolio to Reduce Concentration', impact: 'Medium', cost: 'Low' });
  else if (comps[0].name === 'Goal Progress' && comps[0].score < 75) improvements.push({ action: 'Increase SIP amounts for goals', impact: 'High', cost: 'Medium' });

  if (comps[1] && comps[1].score < 75) {
    if (comps[1].name === 'Insurance Coverage') improvements.push({ action: 'Get Health Insurance', impact: 'High', cost: 'Low' });
    else if (comps[1].name === 'Liquidity Buffer') improvements.push({ action: 'Keep 6 months of expenses in Liquid Assets', impact: 'Medium', cost: 'Medium' });
    else if (comps[1].name === 'Debt Management') improvements.push({ action: 'Consolidate Debt', impact: 'Medium', cost: 'Low' });
    else if (comps[1].name === 'Diversification') improvements.push({ action: 'Invest in other Asset Classes', impact: 'Low', cost: 'Medium' });
    else if (comps[1].name === 'Goal Progress') improvements.push({ action: 'Review and adjust Goal Targets', impact: 'Medium', cost: 'Low' });
  }

  return {
    overall,
    grade,
    percentile,
    components: [
      { name: 'Liquidity Buffer', score: Math.round(lb_score), max: 100, status: lb_status, detail: lb_detail },
      { name: 'Diversification', score: Math.round(div_score), max: 100, status: div_status, detail: div_detail },
      { name: 'Debt Management', score: Math.round(debt_score), max: 100, status: debt_status, detail: debt_detail },
      { name: 'Insurance Coverage', score: Math.round(ins_score), max: 100, status: ins_status, detail: ins_detail },
      { name: 'Goal Progress', score: Math.round(goal_score), max: 100, status: goal_status, detail: goal_detail }
    ],
    history: [],
    improvements: improvements.slice(0, 3)
  };
}
