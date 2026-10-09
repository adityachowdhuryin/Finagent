// server/db/database.js
// FinAgent Dual-Engine ACID Persistent Database Architecture
// Primary Cloud: Supabase PostgreSQL (via pg.Pool & DATABASE_URL)
// Local Resilient Mirror: Node 24 native node:sqlite DatabaseSync with WAL
// Persists all authorizations, settlements, wrap enrollments, claims, corporate plans, and audit trails

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// ── 1. Local SQLite Engine Setup ──────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'finagent.db');
let db = null;

try {
  const { DatabaseSync } = require('node:sqlite');
  db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
} catch (err) {
  console.warn('⚠️ node:sqlite initialization notice:', err.message);
}

// ── 2. Cloud Supabase PostgreSQL Connection Pool ──────────────────────────────
const { Pool } = require('pg');
let pgPool = null;

if (process.env.DATABASE_URL) {
  try {
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    pgPool.on('error', (err) => {
      console.warn('⚠️ Supabase pgPool idle client error:', err.message);
    });
    console.log('⚡ Connected to Supabase PostgreSQL cloud database');
  } catch (err) {
    console.warn('⚠️ Supabase pgPool initialization failed:', err.message);
  }
}

// ── 3. Schema Initialization ──────────────────────────────────────────────────
function initSchema() {
  if (!db) return;

  db.exec(`
    CREATE TABLE IF NOT EXISTS authorizations (
      id TEXT PRIMARY KEY,
      agreement_type TEXT,
      client_signature TEXT,
      user_email TEXT,
      split_ratio TEXT,
      estimated_savings REAL,
      market TEXT,
      data TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS settlements (
      id TEXT PRIMARY KEY,
      auth_token TEXT,
      lender TEXT,
      total_savings REAL,
      client_kept REAL,
      finagent_fee REAL,
      currency TEXT,
      status TEXT,
      data TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS wrap_enrollments (
      id TEXT PRIMARY KEY,
      model_id TEXT,
      aum REAL,
      annual_fee REAL,
      quarterly_debit REAL,
      client_signature TEXT,
      currency TEXT,
      data TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS bounty_claims (
      id TEXT PRIMARY KEY,
      deal_id TEXT,
      user_email TEXT,
      deal_category TEXT,
      status TEXT,
      data TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS enterprise_plans (
      org_id TEXT PRIMARY KEY,
      name TEXT,
      market TEXT,
      total_employees INTEGER,
      seat_price REAL,
      monthly_billing REAL,
      plan_status TEXT,
      data TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS syndicate_commitments (
      id TEXT PRIMARY KEY,
      deal_id TEXT,
      deal_type TEXT,
      amount REAL,
      investor_name TEXT,
      market TEXT,
      data TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS tax_filings (
      id TEXT PRIMARY KEY,
      submission_id TEXT,
      market TEXT,
      agency TEXT,
      status TEXT,
      filer_name TEXT,
      data TEXT,
      created_at TEXT
    );
  `);
}

initSchema();

// Optional hydration from Supabase into local mirror
async function hydrateFromSupabase() {
  if (!pgPool || !db) return;
  try {
    const planRes = await pgPool.query('SELECT data FROM enterprise_plans ORDER BY updated_at DESC LIMIT 10');
    if (planRes && planRes.rows) {
      planRes.rows.forEach(r => {
        try {
          const item = typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
          if (item) saveEnterprisePlan(item, false);
        } catch {}
      });
    }
    console.log('✅ Local cache synchronized with Supabase cloud database');
  } catch (err) {
    // Silent notice in non-critical situations
  }
}

if (pgPool) {
  hydrateFromSupabase().catch(() => {});
}

function getSafeLimit(val, fallback = 100) {
  const parsed = parseInt(val, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

// ── 4. Repository Methods (Dual-Write: SQLite Mirror + Supabase PostgreSQL) ───

// 1. Authorizations
function saveAuthorization(record, broadcastToCloud = true) {
  const id = record.authToken || record.id || record.authId;
  const agreementType = record.agreementType || record.deal_type || 'loan_rate_reset';
  const clientSignature = record.clientSignature || '';
  const userEmail = record.userEmail || record.client_id || '';
  const splitRatio = JSON.stringify(record.splitRatio || { clientPct: 70, finagentPct: 30 });
  const estimatedSavings = Number(record.estimatedSavings || record.min_savings_threshold) || 0;
  const market = record.market || record.currency || 'US';
  const data = JSON.stringify(record);
  const createdAt = record.preAuthTimestamp || new Date().toISOString();

  if (db) {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO authorizations (id, agreement_type, client_signature, user_email, split_ratio, estimated_savings, market, data, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, agreementType, clientSignature, userEmail, splitRatio, estimatedSavings, market, data, createdAt);
  }

  if (broadcastToCloud && pgPool) {
    pgPool.query(
      `INSERT INTO authorizations (id, agreement_type, client_signature, user_email, split_ratio, estimated_savings, market, data, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET
         agreement_type = EXCLUDED.agreement_type,
         client_signature = EXCLUDED.client_signature,
         user_email = EXCLUDED.user_email,
         split_ratio = EXCLUDED.split_ratio,
         estimated_savings = EXCLUDED.estimated_savings,
         market = EXCLUDED.market,
         data = EXCLUDED.data,
         created_at = EXCLUDED.created_at`,
      [id, agreementType, clientSignature, userEmail, splitRatio, estimatedSavings, market, record, createdAt]
    ).catch(err => console.error('⚠️ Supabase write error (authorizations):', err.message));
  }

  return record;
}

function getAuthorizations(limit = 100) {
  if (!db) return [];
  const safeLimit = getSafeLimit(limit);
  const rows = db.prepare(`SELECT data FROM authorizations ORDER BY created_at DESC LIMIT ?`).all(safeLimit);
  return rows.map(r => JSON.parse(r.data));
}

// 2. Settlements
function saveSettlement(record, broadcastToCloud = true) {
  const id = record.settlementId || record.id;
  const authToken = record.authToken || record.auth_id || record.authId || 'DIRECT_SETTLEMENT';
  const lender = record.lender || record.description || 'Financial Institution';
  const totalSavings = Number(record.totalSavings ?? record.gross_savings ?? record.grossSavings) || 0;
  const clientKept = Number(record.clientKept ?? record.client_kept) || 0;
  const finagentFee = Number(record.finagentSuccessFee ?? record.finagentFee ?? record.finagent_fee) || 0;
  const currency = record.currency || 'USD';
  const status = record.status || 'SETTLED_COLLECTED';
  const data = JSON.stringify(record);
  const createdAt = record.timestamp || new Date().toISOString();

  if (db) {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO settlements (id, auth_token, lender, total_savings, client_kept, finagent_fee, currency, status, data, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, authToken, lender, totalSavings, clientKept, finagentFee, currency, status, data, createdAt);
  }

  if (broadcastToCloud && pgPool) {
    pgPool.query(
      `INSERT INTO settlements (id, auth_token, lender, total_savings, client_kept, finagent_fee, currency, status, data, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET
         auth_token = EXCLUDED.auth_token,
         lender = EXCLUDED.lender,
         total_savings = EXCLUDED.total_savings,
         client_kept = EXCLUDED.client_kept,
         finagent_fee = EXCLUDED.finagent_fee,
         currency = EXCLUDED.currency,
         status = EXCLUDED.status,
         data = EXCLUDED.data,
         created_at = EXCLUDED.created_at`,
      [id, authToken, lender, totalSavings, clientKept, finagentFee, currency, status, record, createdAt]
    ).catch(err => console.error('⚠️ Supabase write error (settlements):', err.message));
  }

  return record;
}

function getSettlements(limit = 100) {
  if (!db) return [];
  const safeLimit = getSafeLimit(limit);
  const rows = db.prepare(`SELECT data FROM settlements ORDER BY created_at DESC LIMIT ?`).all(safeLimit);
  return rows.map(r => JSON.parse(r.data));
}

// 3. Wrap Enrollments
function saveWrapEnrollment(record, broadcastToCloud = true) {
  const id = record.agreementRef || record.id;
  const modelId = record.modelId || record.benchmark_index || '';
  const aum = Number(record.aum ?? record.portfolio_aum ?? record.portfolioAum) || 0;
  const annualFee = Number(record.annualWrapFee ?? record.annualFee ?? record.annual_fee) || 0;
  const quarterlyDebit = Number(record.quarterlyDebit ?? record.quarterly_debit) || 0;
  const clientSignature = record.clientSignature || '';
  const currency = record.currency || 'USD';
  const data = JSON.stringify(record);
  const createdAt = record.enrolledAt || new Date().toISOString();

  if (db) {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO wrap_enrollments (id, model_id, aum, annual_fee, quarterly_debit, client_signature, currency, data, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, modelId, aum, annualFee, quarterlyDebit, clientSignature, currency, data, createdAt);
  }

  if (broadcastToCloud && pgPool) {
    pgPool.query(
      `INSERT INTO wrap_enrollments (id, model_id, aum, annual_fee, quarterly_debit, client_signature, currency, data, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET
         model_id = EXCLUDED.model_id,
         aum = EXCLUDED.aum,
         annual_fee = EXCLUDED.annual_fee,
         quarterly_debit = EXCLUDED.quarterly_debit,
         client_signature = EXCLUDED.client_signature,
         currency = EXCLUDED.currency,
         data = EXCLUDED.data,
         created_at = EXCLUDED.created_at`,
      [id, modelId, aum, annualFee, quarterlyDebit, clientSignature, currency, record, createdAt]
    ).catch(err => console.error('⚠️ Supabase write error (wrap_enrollments):', err.message));
  }

  return record;
}

function getWrapEnrollments(limit = 100) {
  if (!db) return [];
  const safeLimit = getSafeLimit(limit);
  const rows = db.prepare(`SELECT data FROM wrap_enrollments ORDER BY created_at DESC LIMIT ?`).all(safeLimit);
  return rows.map(r => JSON.parse(r.data));
}

// 4. Bounty Claims
function saveBountyClaim(record, broadcastToCloud = true) {
  const id = record.claimRef || record.id;
  const dealId = record.dealId || '';
  const userEmail = record.userEmail || '';
  const dealCategory = record.dealCategory || 'Institutional';
  const status = record.status || 'CLAIM_SUBMITTED';
  const data = JSON.stringify(record);
  const createdAt = record.timestamp || new Date().toISOString();

  if (db) {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO bounty_claims (id, deal_id, user_email, deal_category, status, data, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, dealId, userEmail, dealCategory, status, data, createdAt);
  }

  if (broadcastToCloud && pgPool) {
    const payoutAmount = Number(record.payoutAmount || record.payout_amount) || 0;
    const currency = record.currency || 'USD';
    pgPool.query(
      `INSERT INTO bounty_claims (id, bounty_id, user_id, institution, payout_amount, currency, status, data, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET
         bounty_id = EXCLUDED.bounty_id,
         user_id = EXCLUDED.user_id,
         institution = EXCLUDED.institution,
         payout_amount = EXCLUDED.payout_amount,
         currency = EXCLUDED.currency,
         status = EXCLUDED.status,
         data = EXCLUDED.data,
         created_at = EXCLUDED.created_at`,
      [id, dealId, userEmail, dealCategory, payoutAmount, currency, status, record, createdAt]
    ).catch(err => console.error('⚠️ Supabase write error (bounty_claims):', err.message));
  }

  return record;
}

function getBountyClaims(limit = 100) {
  if (!db) return [];
  const safeLimit = getSafeLimit(limit);
  const rows = db.prepare(`SELECT data FROM bounty_claims ORDER BY created_at DESC LIMIT ?`).all(safeLimit);
  return rows.map(r => JSON.parse(r.data));
}

// 5. Enterprise Plans
function saveEnterprisePlan(orgState, broadcastToCloud = true) {
  const orgId = orgState.orgId || orgState.id || 'org_apex_4921';
  const name = orgState.name || orgState.companyName || 'Apex Cloud Technologies Inc';
  const market = orgState.market || orgState.jurisdiction || 'US';
  const totalEmployees = Number(orgState.totalEmployees ?? orgState.initialSeats) || 240;
  const seatPrice = Number(orgState.seatPricePerMonth) || 8.0;
  const monthlyBilling = Number(orgState.monthlyBilling) || 1920.0;
  const planStatus = orgState.planStatus || 'ACTIVE';
  const data = JSON.stringify(orgState);
  const updatedAt = new Date().toISOString();

  if (db) {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO enterprise_plans (org_id, name, market, total_employees, seat_price, monthly_billing, plan_status, data, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(orgId, name, market, totalEmployees, seatPrice, monthlyBilling, planStatus, data, updatedAt);
  }

  if (broadcastToCloud && pgPool) {
    pgPool.query(
      `INSERT INTO enterprise_plans (org_id, name, market, total_employees, seat_price, monthly_billing, plan_status, data, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (org_id) DO UPDATE SET
         name = EXCLUDED.name,
         market = EXCLUDED.market,
         total_employees = EXCLUDED.total_employees,
         seat_price = EXCLUDED.seat_price,
         monthly_billing = EXCLUDED.monthly_billing,
         plan_status = EXCLUDED.plan_status,
         data = EXCLUDED.data,
         updated_at = EXCLUDED.updated_at`,
      [orgId, name, market, totalEmployees, seatPrice, monthlyBilling, planStatus, orgState, updatedAt]
    ).catch(err => console.error('⚠️ Supabase write error (enterprise_plans):', err.message));
  }

  return orgState;
}

function getEnterprisePlan(orgId = 'org_apex_4921') {
  if (!db) return null;
  const row = db.prepare(`SELECT data FROM enterprise_plans WHERE org_id = ?`).get(orgId);
  return row ? JSON.parse(row.data) : null;
}

// 6. Syndicate Commitments
function saveSyndicateCommitment(record, broadcastToCloud = true) {
  const id = record.commitmentId || record.id;
  const dealId = record.dealId || record.deal_id || '';
  const dealType = record.dealType || 'UNICORN_SECONDARY';
  const amount = Number(record.commitmentAmount ?? record.amount) || 0;
  const investorName = record.investorName || record.investor_id || '';
  const market = record.market || record.currency || 'US';
  const data = JSON.stringify(record);
  const createdAt = record.timestamp || new Date().toISOString();

  if (db) {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO syndicate_commitments (id, deal_id, deal_type, amount, investor_name, market, data, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, dealId, dealType, amount, investorName, market, data, createdAt);
  }

  if (broadcastToCloud && pgPool) {
    pgPool.query(
      `INSERT INTO syndicate_commitments (id, deal_id, deal_type, amount, investor_name, market, data, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         deal_id = EXCLUDED.deal_id,
         deal_type = EXCLUDED.deal_type,
         amount = EXCLUDED.amount,
         investor_name = EXCLUDED.investor_name,
         market = EXCLUDED.market,
         data = EXCLUDED.data,
         created_at = EXCLUDED.created_at`,
      [id, dealId, dealType, amount, investorName, market, record, createdAt]
    ).catch(err => console.error('⚠️ Supabase write error (syndicate_commitments):', err.message));
  }

  return record;
}

function getSyndicateCommitments(dealIdOrLimit = 100) {
  if (!db) return [];
  if (typeof dealIdOrLimit === 'string') {
    const rows = db.prepare(`SELECT data FROM syndicate_commitments WHERE deal_id = ? ORDER BY created_at DESC`).all(dealIdOrLimit);
    return rows.map(r => JSON.parse(r.data));
  }
  const safeLimit = getSafeLimit(dealIdOrLimit);
  const rows = db.prepare(`SELECT data FROM syndicate_commitments ORDER BY created_at DESC LIMIT ?`).all(safeLimit);
  return rows.map(r => JSON.parse(r.data));
}

// 7. Tax Filings
function saveTaxFiling(record, broadcastToCloud = true) {
  const id = record.submissionId || record.id;
  const submissionId = record.din_or_receipt || record.submissionId || record.id || '';
  const market = record.market || record.jurisdiction || 'US';
  const agency = record.agency || 'IRS';
  const status = record.status || 'ELECTRONICALLY_ACCEPTED';
  const filerName = record.filerName || 'Taxpayer';
  const data = JSON.stringify(record);
  const createdAt = record.transmittedAt || new Date().toISOString();

  if (db) {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO tax_filings (id, submission_id, market, agency, status, filer_name, data, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, submissionId, market, agency, status, filerName, data, createdAt);
  }

  if (broadcastToCloud && pgPool) {
    const din = record.din_or_receipt || record.din || record.receiptCode || '';
    const digitalSignatureHash = record.digitalSignatureHash || record.signatureHash || '';
    const receiptCode = record.receiptCode || din;
    pgPool.query(
      `INSERT INTO tax_filings (id, submission_id, din, market, agency, status, filer_name, digital_signature_hash, receipt_code, data, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO UPDATE SET
         submission_id = EXCLUDED.submission_id,
         din = EXCLUDED.din,
         market = EXCLUDED.market,
         agency = EXCLUDED.agency,
         status = EXCLUDED.status,
         filer_name = EXCLUDED.filer_name,
         digital_signature_hash = EXCLUDED.digital_signature_hash,
         receipt_code = EXCLUDED.receipt_code,
         data = EXCLUDED.data,
         created_at = EXCLUDED.created_at`,
      [id, submissionId, din, market, agency, status, filerName, digitalSignatureHash, receiptCode, record, createdAt]
    ).catch(err => console.error('⚠️ Supabase write error (tax_filings):', err.message));
  }

  return record;
}

function getTaxFilings(limit = 100) {
  if (!db) return [];
  const safeLimit = getSafeLimit(limit);
  const rows = db.prepare(`SELECT data FROM tax_filings ORDER BY created_at DESC LIMIT ?`).all(safeLimit);
  return rows.map(r => JSON.parse(r.data));
}

function getTaxFilingById(id) {
  if (!db) return null;
  const row = db.prepare(`SELECT data FROM tax_filings WHERE id = ?`).get(id);
  return row ? JSON.parse(row.data) : null;
}

// 8. Audit Events
function logAuditEvent(event) {
  const id = event.id || `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const eventType = event.eventType || event.type || 'SYSTEM_ACTION';
  const actor = event.actor || 'system';
  const market = event.market || 'US';
  const details = event.details || event;
  const createdAt = event.createdAt || new Date().toISOString();

  if (pgPool) {
    pgPool.query(
      `INSERT INTO audit_events (id, event_type, actor, market, details, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, eventType, actor, market, details, createdAt]
    ).catch(err => console.error('⚠️ Supabase write error (audit_events):', err.message));
  }
  return { id, eventType, actor, market, details, createdAt };
}

module.exports = {
  db,
  pgPool,
  saveAuthorization,
  getAuthorizations,
  saveSettlement,
  getSettlements,
  saveWrapEnrollment,
  getWrapEnrollments,
  saveBountyClaim,
  getBountyClaims,
  saveEnterprisePlan,
  getEnterprisePlan,
  saveSyndicateCommitment,
  getSyndicateCommitments,
  saveTaxFiling,
  getTaxFilings,
  getTaxFilingById,
  logAuditEvent,
};
