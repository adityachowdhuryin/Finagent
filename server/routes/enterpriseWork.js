// server/routes/enterpriseWork.js
// "FinAgent for Work" B2B Enterprise Employer Benefits & Workforce Wellness Portal (/work)

const crypto = require('crypto');

let enterpriseOrgState = {
  orgId: 'org_apex_4921',
  name: 'Apex Cloud Technologies Inc',
  domain: 'apexcloud.io',
  market: 'US',
  totalEmployees: 240,
  activeSeatsEnrolled: 218,
  seatPricePerMonth: 6.00,
  monthlyBilling: 1308.00,
  currency: 'USD',
  planTier: 'Enterprise Wellness OS',
  matchPolicy: {
    type: 'Safe Harbor 401(k) Match',
    formula: '100% match on first 4% of salary + 50% match on next 2%',
    vestingSchedule: 'Immediate 100% Vesting',
    totalEmployerContributionsYTD: 482000.00,
  },
  workforceWellness: {
    overallIndex: 78,
    participationRate: '91%',
    emergencyBufferRatio: '68% of staff have 3+ months expenses',
    retirementReadiness: '84% on track for age milestones',
    productivitySavedHours: '4.2 hrs/employee/month from financial stress mitigation',
  },
  employeeRoster: [
    { id: 'emp_01', name: 'Sarah Jenkins', email: 's.jenkins@apexcloud.io', dept: 'Engineering', status: 'ACTIVE', enrolledDate: '2026-01-15' },
    { id: 'emp_02', name: 'Michael Chang', email: 'm.chang@apexcloud.io', dept: 'Product Design', status: 'ACTIVE', enrolledDate: '2026-02-01' },
    { id: 'emp_03', name: 'Aaliyah Patel', email: 'a.patel@apexcloud.io', dept: 'Sales & BD', status: 'ACTIVE', enrolledDate: '2026-02-20' },
    { id: 'emp_04', name: 'David Ross', email: 'd.ross@apexcloud.io', dept: 'Customer Success', status: 'ACTIVE', enrolledDate: '2026-03-10' },
  ]
};

/**
 * GET /api/work/overview
 */
function getWorkplaceOverview(req, res) {
  const market = (req.query.market || 'US').toUpperCase();

  res.json({
    success: true,
    market,
    org: enterpriseOrgState,
  });
}

/**
 * POST /api/work/seats
 * Updates employee seat count ($6/mo/employee).
 */
function updateSeats(req, res) {
  const { newSeatCount = 250 } = req.body;
  enterpriseOrgState.totalEmployees = Number(newSeatCount);
  enterpriseOrgState.monthlyBilling = enterpriseOrgState.totalEmployees * enterpriseOrgState.seatPricePerMonth;

  res.json({
    success: true,
    message: `Enterprise seat count updated to ${enterpriseOrgState.totalEmployees} seats.`,
    org: enterpriseOrgState,
  });
}

/**
 * POST /api/work/policy
 * Updates company 401(k) or CTC employer match formula.
 */
function updateMatchPolicy(req, res) {
  const { formula, vestingSchedule } = req.body;
  if (formula) enterpriseOrgState.matchPolicy.formula = formula;
  if (vestingSchedule) enterpriseOrgState.matchPolicy.vestingSchedule = vestingSchedule;

  res.json({
    success: true,
    message: 'Company 401(k) match policy updated successfully!',
    matchPolicy: enterpriseOrgState.matchPolicy,
  });
}

module.exports = {
  getWorkplaceOverview,
  updateSeats,
  updateMatchPolicy,
};
