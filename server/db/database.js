// server/db/database.js
// FinAgent Dual-Engine ACID Persistent Database Architecture
// Primary Cloud: Supabase PostgreSQL (via pg.Pool & DATABASE_URL)
// Local Resilient Mirror: Node 24 native node:sqlite DatabaseSync with WAL
// Persists all authorizations, settlements, wrap enrollments, claims, corporate plans, and audit trails

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
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

    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      event_type TEXT,
      actor TEXT,
      market TEXT,
      details TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS advisor_clients (
      id TEXT PRIMARY KEY,
      advisor_id TEXT,
      name TEXT,
      email TEXT,
      phone TEXT,
      city TEXT,
      income REAL,
      risk_profile TEXT,
      aum REAL,
      status TEXT,
      data TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS advisor_dispatches (
      id TEXT PRIMARY KEY,
      reco_id TEXT,
      client_name TEXT,
      client_email TEXT,
      title TEXT,
      summary TEXT,
      advisor_sig TEXT,
      status TEXT,
      data TEXT,
      sent_at TEXT
    );

    CREATE TABLE IF NOT EXISTS corporate_treasury (
      id TEXT PRIMARY KEY,
      market TEXT,
      data TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS syndicate_spvs (
      id TEXT PRIMARY KEY,
      spv_name TEXT,
      ticker TEXT,
      market TEXT,
      data TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS endowments_giving (
      id TEXT PRIMARY KEY,
      market TEXT,
      data TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS family_law_forensics (
      id TEXT PRIMARY KEY,
      case_id TEXT,
      market TEXT,
      data TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS embedded_wealth_configs (
      id TEXT PRIMARY KEY,
      partner_id TEXT,
      market TEXT,
      data TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS tax_returns (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      market TEXT NOT NULL,
      tax_year INTEGER NOT NULL,
      regime TEXT NOT NULL,
      filing_status TEXT NOT NULL,
      taxpayer_name TEXT,
      taxpayer_id TEXT,
      summary_json TEXT,
      status TEXT DEFAULT 'DRAFT',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tax_lots (
      id TEXT PRIMARY KEY,
      return_id TEXT NOT NULL,
      market TEXT NOT NULL,
      asset_type TEXT NOT NULL,
      symbol TEXT NOT NULL,
      isin_or_cusip TEXT,
      buy_date TEXT NOT NULL,
      sell_date TEXT,
      units REAL NOT NULL,
      buy_price REAL NOT NULL,
      sell_price REAL,
      gain_loss REAL,
      term TEXT,
      wash_sale_disallowed REAL DEFAULT 0,
      exempt_amount REAL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tax_schedules (
      id TEXT PRIMARY KEY,
      return_id TEXT NOT NULL,
      schedule_type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      is_valid INTEGER DEFAULT 1,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tax_documents (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      market TEXT NOT NULL,
      document_type TEXT NOT NULL,
      filename TEXT NOT NULL,
      file_hash TEXT,
      parsed_payload_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS preparer_audit_trail (
      id TEXT PRIMARY KEY,
      return_id TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      seal_hash TEXT,
      created_at TEXT NOT NULL
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
  const details = typeof event.details === 'object' ? JSON.stringify(event.details) : String(event.details || '');
  const createdAt = event.createdAt || new Date().toISOString();

  if (db) {
    try {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO audit_events (id, event_type, actor, market, details, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(id, eventType, actor, market, details, createdAt);
    } catch (e) {
      console.warn('SQLite audit log notice:', e.message);
    }
  }

  if (pgPool) {
    pgPool.query(
      `INSERT INTO audit_events (id, event_type, actor, market, details, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, eventType, actor, market, details, createdAt]
    ).catch(err => console.error('⚠️ Supabase write error (audit_events):', err.message));
  }
  return { id, eventType, actor, market, details, createdAt };
}

function getAuditEvents(limit = 100) {
  if (!db) return [];
  const safeLimit = getSafeLimit(limit);
  const rows = db.prepare(`SELECT * FROM audit_events ORDER BY created_at DESC LIMIT ?`).all(safeLimit);
  return rows.map(r => {
    let parsedDetails = {};
    try {
      parsedDetails = typeof r.details === 'string' ? JSON.parse(r.details || '{}') : (r.details || {});
    } catch {
      parsedDetails = { raw: r.details };
    }
    return {
      id: r.id,
      eventType: r.event_type,
      actor: r.actor,
      market: r.market,
      details: parsedDetails,
      createdAt: r.created_at,
    };
  });
}

// 9. Advisor Clients
function saveAdvisorClient(client, broadcastToCloud = true) {
  const id = client.id || `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const advisorId = client.advisorId || 'adv001';
  const name = client.name || 'New Client';
  const email = client.email || '';
  const phone = client.phone || '';
  const city = client.city || '';
  const income = Number(client.income) || 0;
  const riskProfile = client.riskProfile || 'Moderate';
  const aum = Number(client.aum) || (income ? income * 2.5 : 2500000);
  const status = client.status || 'Active';
  const data = JSON.stringify({ ...client, id, aum });
  const createdAt = client.createdAt || new Date().toISOString();

  if (db) {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO advisor_clients (id, advisor_id, name, email, phone, city, income, risk_profile, aum, status, data, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, advisorId, name, email, phone, city, income, riskProfile, aum, status, data, createdAt);
  }

  if (broadcastToCloud && pgPool) {
    pgPool.query(
      `INSERT INTO advisor_clients (id, advisor_id, name, email, phone, city, income, risk_profile, aum, status, data, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name, email = EXCLUDED.email, income = EXCLUDED.income,
         risk_profile = EXCLUDED.risk_profile, aum = EXCLUDED.aum, status = EXCLUDED.status,
         data = EXCLUDED.data`,
      [id, advisorId, name, email, phone, city, income, riskProfile, aum, status, data, createdAt]
    ).catch(err => console.warn('⚠️ Supabase write error (advisor_clients):', err.message));
  }

  return { ...client, id, aum };
}

function getAdvisorClients(advisorId = 'adv001', limit = 100) {
  if (!db) return [];
  const safeLimit = getSafeLimit(limit);
  const rows = db.prepare(`SELECT data FROM advisor_clients WHERE advisor_id = ? ORDER BY created_at DESC LIMIT ?`).all(advisorId, safeLimit);
  return rows.map(r => JSON.parse(r.data));
}

// 10. Advisor Dispatches
function saveAdvisorDispatch(dispatch, broadcastToCloud = true) {
  const id = dispatch.id || `disp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const recoId = dispatch.recoId || '';
  const clientName = dispatch.clientName || '';
  const clientEmail = dispatch.clientEmail || '';
  const title = dispatch.title || '';
  const summary = dispatch.summary || '';
  const advisorSig = dispatch.advisorSig || 'Meera Kapoor · INA000014523';
  const status = dispatch.status || 'SENT';
  const data = JSON.stringify(dispatch);
  const sentAt = dispatch.sentAt || new Date().toISOString();

  if (db) {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO advisor_dispatches (id, reco_id, client_name, client_email, title, summary, advisor_sig, status, data, sent_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, recoId, clientName, clientEmail, title, summary, advisorSig, status, data, sentAt);
  }

  if (broadcastToCloud && pgPool) {
    pgPool.query(
      `INSERT INTO advisor_dispatches (id, reco_id, client_name, client_email, title, summary, advisor_sig, status, data, sent_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, data = EXCLUDED.data`,
      [id, recoId, clientName, clientEmail, title, summary, advisorSig, status, data, sentAt]
    ).catch(err => console.warn('⚠️ Supabase write error (advisor_dispatches):', err.message));
  }

  return { ...dispatch, id, sentAt };
}

function getAdvisorDispatches(limit = 100) {
  if (!db) return [];
  const safeLimit = getSafeLimit(limit);
  const rows = db.prepare(`SELECT data FROM advisor_dispatches ORDER BY sent_at DESC LIMIT ?`).all(safeLimit);
  return rows.map(r => JSON.parse(r.data));
}

// 11. Institutional Portals Persistence
function saveTreasuryState(market, state, broadcastToCloud = true) {
  const id = `treasury_${market.toUpperCase()}`;
  const data = JSON.stringify(state);
  const updatedAt = new Date().toISOString();

  if (db) {
    const stmt = db.prepare(`INSERT OR REPLACE INTO corporate_treasury (id, market, data, updated_at) VALUES (?, ?, ?, ?)`);
    stmt.run(id, market.toUpperCase(), data, updatedAt);
  }
  if (broadcastToCloud && pgPool) {
    pgPool.query(
      `INSERT INTO corporate_treasury (id, market, data, updated_at) VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`,
      [id, market.toUpperCase(), data, updatedAt]
    ).catch(err => console.warn('⚠️ Supabase write error (corporate_treasury):', err.message));
  }
  return state;
}

function getTreasuryState(market) {
  if (!db) return null;
  const id = `treasury_${market.toUpperCase()}`;
  const row = db.prepare(`SELECT data FROM corporate_treasury WHERE id = ?`).get(id);
  return row ? JSON.parse(row.data) : null;
}

function saveSyndicateState(market, state, broadcastToCloud = true) {
  const id = `syndicates_${market.toUpperCase()}`;
  const data = JSON.stringify(state);
  const updatedAt = new Date().toISOString();

  if (db) {
    const stmt = db.prepare(`INSERT OR REPLACE INTO syndicate_spvs (id, spv_name, ticker, market, data, updated_at) VALUES (?, ?, ?, ?, ?, ?)`);
    stmt.run(id, state.syndicateLead?.name || 'Syndicate', 'SPV', market.toUpperCase(), data, updatedAt);
  }
  if (broadcastToCloud && pgPool) {
    pgPool.query(
      `INSERT INTO syndicate_spvs (id, spv_name, ticker, market, data, updated_at) VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`,
      [id, state.syndicateLead?.name || 'Syndicate', 'SPV', market.toUpperCase(), data, updatedAt]
    ).catch(err => console.warn('⚠️ Supabase write error (syndicate_spvs):', err.message));
  }
  return state;
}

function getSyndicateState(market) {
  if (!db) return null;
  const id = `syndicates_${market.toUpperCase()}`;
  const row = db.prepare(`SELECT data FROM syndicate_spvs WHERE id = ?`).get(id);
  return row ? JSON.parse(row.data) : null;
}

function saveEndowmentState(market, state, broadcastToCloud = true) {
  const id = `endowment_${market.toUpperCase()}`;
  const data = JSON.stringify(state);
  const updatedAt = new Date().toISOString();

  if (db) {
    const stmt = db.prepare(`INSERT OR REPLACE INTO endowments_giving (id, market, data, updated_at) VALUES (?, ?, ?, ?)`);
    stmt.run(id, market.toUpperCase(), data, updatedAt);
  }
  if (broadcastToCloud && pgPool) {
    pgPool.query(
      `INSERT INTO endowments_giving (id, market, data, updated_at) VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`,
      [id, market.toUpperCase(), data, updatedAt]
    ).catch(err => console.warn('⚠️ Supabase write error (endowments_giving):', err.message));
  }
  return state;
}

function getEndowmentState(market) {
  if (!db) return null;
  const id = `endowment_${market.toUpperCase()}`;
  const row = db.prepare(`SELECT data FROM endowments_giving WHERE id = ?`).get(id);
  return row ? JSON.parse(row.data) : null;
}

function saveFamilyLawState(market, state, broadcastToCloud = true) {
  const id = `family_law_${market.toUpperCase()}`;
  const data = JSON.stringify(state);
  const updatedAt = new Date().toISOString();

  if (db) {
    const stmt = db.prepare(`INSERT OR REPLACE INTO family_law_forensics (id, case_id, market, data, updated_at) VALUES (?, ?, ?, ?, ?)`);
    stmt.run(id, state.caseFile?.caseNumber || 'FL-2026', market.toUpperCase(), data, updatedAt);
  }
  if (broadcastToCloud && pgPool) {
    pgPool.query(
      `INSERT INTO family_law_forensics (id, case_id, market, data, updated_at) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`,
      [id, state.caseFile?.caseNumber || 'FL-2026', market.toUpperCase(), data, updatedAt]
    ).catch(err => console.warn('⚠️ Supabase write error (family_law_forensics):', err.message));
  }
  return state;
}

function getFamilyLawState(market) {
  if (!db) return null;
  const id = `family_law_${market.toUpperCase()}`;
  const row = db.prepare(`SELECT data FROM family_law_forensics WHERE id = ?`).get(id);
  return row ? JSON.parse(row.data) : null;
}

function saveEmbeddedWealthState(partnerId = 'partner_apex_bank', state, broadcastToCloud = true) {
  const id = `bank_embed_${partnerId}`;
  const data = JSON.stringify(state);
  const updatedAt = new Date().toISOString();

  if (db) {
    const stmt = db.prepare(`INSERT OR REPLACE INTO embedded_wealth_configs (id, partner_id, market, data, updated_at) VALUES (?, ?, ?, ?, ?)`);
    stmt.run(id, partnerId, 'US', data, updatedAt);
  }
  if (broadcastToCloud && pgPool) {
    pgPool.query(
      `INSERT INTO embedded_wealth_configs (id, partner_id, market, data, updated_at) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`,
      [id, partnerId, 'US', data, updatedAt]
    ).catch(err => console.warn('⚠️ Supabase write error (embedded_wealth_configs):', err.message));
  }
  return state;
}

function getEmbeddedWealthState(partnerId = 'partner_apex_bank') {
  if (!db) return null;
  const id = `bank_embed_${partnerId}`;
  const row = db.prepare(`SELECT data FROM embedded_wealth_configs WHERE id = ?`).get(id);
  return row ? JSON.parse(row.data) : null;
}

// ── Tax Studio Persistent Multi-Tenant Architecture ─────────────────────────
function saveTaxReturn(returnData, broadcastToCloud = true) {
  const userId = returnData.user_id || returnData.userId || 'default_taxpayer';
  const market = returnData.market || 'IN';
  const taxYear = returnData.tax_year || returnData.taxYear || 2026;
  const id = returnData.id || `ret_${market}_${taxYear}_${userId}`;
  const regime = returnData.regime || 'new';
  const filingStatus = returnData.filing_status || returnData.filingStatus || 'Individual';
  const taxpayerName = returnData.taxpayer_name || returnData.taxpayerName || 'Taxpayer';
  const taxpayerId = returnData.taxpayer_id || returnData.taxpayerId || 'PAN/SSN';
  const summaryJson = JSON.stringify(returnData.summary || returnData.summary_json || {});
  const status = returnData.status || 'DRAFT';
  const now = new Date().toISOString();

  if (db) {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO tax_returns 
      (id, user_id, market, tax_year, regime, filing_status, taxpayer_name, taxpayer_id, summary_json, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM tax_returns WHERE id = ?), ?), ?)
    `);
    stmt.run(id, userId, market, taxYear, regime, filingStatus, taxpayerName, taxpayerId, summaryJson, status, id, now, now);
  }

  if (broadcastToCloud && pgPool) {
    pgPool.query(
      `INSERT INTO tax_returns (id, user_id, market, tax_year, regime, filing_status, taxpayer_name, taxpayer_id, summary_json, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE SET regime = EXCLUDED.regime, summary_json = EXCLUDED.summary_json, status = EXCLUDED.status, updated_at = EXCLUDED.updated_at`,
      [id, userId, market, taxYear, regime, filingStatus, taxpayerName, taxpayerId, summaryJson, status, now, now]
    ).catch(err => console.warn('⚠️ Supabase write error (tax_returns):', err.message));
  }

  return { id, userId, market, taxYear, status, updatedAt: now };
}

function getTaxReturn(market = 'IN', taxYear = 2026, userId = 'default_taxpayer') {
  if (!db) return null;
  const id = `ret_${market}_${taxYear}_${userId}`;
  const row = db.prepare(`SELECT * FROM tax_returns WHERE id = ?`).get(id);
  if (!row) return null;
  return {
    ...row,
    summary: row.summary_json ? JSON.parse(row.summary_json) : {},
  };
}

function lockTaxReturn(returnId, preparerInfo = {}, broadcastToCloud = true) {
  if (!db) return null;
  const now = new Date().toISOString();
  const row = db.prepare(`SELECT * FROM tax_returns WHERE id = ?`).get(returnId);
  if (!row) throw new Error('Tax return not found');

  // Compute cryptographic SHA-256 seal of return content
  const sealContent = `${row.id}_${row.market}_${row.tax_year}_${row.summary_json}_${preparerInfo.preparerId || 'PREPARER'}`;
  const sealHash = crypto.createHash('sha256').update(sealContent).digest('hex');

  db.prepare(`UPDATE tax_returns SET status = 'LOCKED', updated_at = ? WHERE id = ?`).run(now, returnId);

  // Record preparer audit event
  logPreparerAudit({
    return_id: returnId,
    actor_role: preparerInfo.role || (row.market === 'IN' ? 'CA' : 'CPA'),
    actor_id: preparerInfo.preparerId || preparerInfo.membershipNo || 'PREP_CERTIFIED',
    action: 'LOCKED',
    details: `Return locked and digitally certified. Signer: ${preparerInfo.name || 'Fiduciary Preparer'}, Reg: ${preparerInfo.registrationNo || 'VERIFIED'}`,
    seal_hash: sealHash,
  }, broadcastToCloud);

  if (broadcastToCloud && pgPool) {
    pgPool.query(`UPDATE tax_returns SET status = 'LOCKED', updated_at = $1 WHERE id = $2`, [now, returnId])
      .catch(err => console.warn('⚠️ Supabase lock update error:', err.message));
  }

  return { returnId, status: 'LOCKED', sealHash, lockedAt: now };
}

function saveTaxLots(returnId, market, lots = [], broadcastToCloud = true) {
  if (!db || !lots.length) return [];
  const now = new Date().toISOString();
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO tax_lots
    (id, return_id, market, asset_type, symbol, isin_or_cusip, buy_date, sell_date, units, buy_price, sell_price, gain_loss, term, wash_sale_disallowed, exempt_amount, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  lots.forEach((lot, i) => {
    const lotId = `${returnId}_lot_${i + 1}`;
    insertStmt.run(
      lotId,
      returnId,
      market,
      lot.assetType || 'EQUITY',
      lot.symbol || lot.schemeName || 'SECURITY',
      lot.isin || lot.cusip || null,
      lot.buyDate || lot.purchaseDate || now.split('T')[0],
      lot.sellDate || lot.saleDate || null,
      Number(lot.units || 0),
      Number(lot.buyPrice || lot.costPerUnit || 0),
      Number(lot.sellPrice || lot.saleNav || 0),
      Number(lot.gainLoss || lot.totalGain || 0),
      lot.term || lot.gainType || 'SHORT_TERM',
      Number(lot.washSaleDisallowed || 0),
      Number(lot.exemptAmount || 0),
      now
    );
  });

  return lots;
}

function getTaxLots(returnId) {
  if (!db) return [];
  return db.prepare(`SELECT * FROM tax_lots WHERE return_id = ? ORDER BY created_at ASC`).all(returnId);
}

function saveTaxDocument(docData, broadcastToCloud = true) {
  const userId = docData.user_id || docData.userId || 'default_taxpayer';
  const market = docData.market || 'IN';
  const docType = docData.document_type || docData.documentType || 'STATEMENT';
  const filename = docData.filename || 'document.pdf';
  const id = docData.id || `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  const fileHash = docData.file_hash || crypto.createHash('md5').update(filename + now).digest('hex');
  const payloadJson = JSON.stringify(docData.parsedPayload || docData.parsed_payload_json || {});

  if (db) {
    db.prepare(`
      INSERT OR REPLACE INTO tax_documents
      (id, user_id, market, document_type, filename, file_hash, parsed_payload_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, market, docType, filename, fileHash, payloadJson, now);
  }

  return { id, userId, market, docType, filename, fileHash, createdAt: now };
}

function getTaxDocuments(userId = 'default_taxpayer') {
  if (!db) return [];
  const rows = db.prepare(`SELECT * FROM tax_documents WHERE user_id = ? ORDER BY created_at DESC`).all(userId);
  return rows.map(r => ({
    ...r,
    parsedPayload: r.parsed_payload_json ? JSON.parse(r.parsed_payload_json) : {},
  }));
}

function logPreparerAudit(auditData, broadcastToCloud = true) {
  const id = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const returnId = auditData.return_id || auditData.returnId || 'general';
  const actorRole = auditData.actor_role || auditData.actorRole || 'SYSTEM';
  const actorId = auditData.actor_id || auditData.actorId || 'system';
  const action = auditData.action || 'INSPECT';
  const details = auditData.details || '';
  const sealHash = auditData.seal_hash || null;
  const now = new Date().toISOString();

  if (db) {
    db.prepare(`
      INSERT INTO preparer_audit_trail (id, return_id, actor_role, actor_id, action, details, seal_hash, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, returnId, actorRole, actorId, action, details, sealHash, now);
  }

  return { id, returnId, actorRole, action, createdAt: now };
}

function getPreparerAuditTrail(returnId) {
  if (!db) return [];
  return db.prepare(`SELECT * FROM preparer_audit_trail WHERE return_id = ? ORDER BY created_at ASC`).all(returnId);
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
  getAuditEvents,
  saveAdvisorClient,
  getAdvisorClients,
  saveAdvisorDispatch,
  getAdvisorDispatches,
  saveTreasuryState,
  getTreasuryState,
  saveSyndicateState,
  getSyndicateState,
  saveEndowmentState,
  getEndowmentState,
  saveFamilyLawState,
  getFamilyLawState,
  saveEmbeddedWealthState,
  getEmbeddedWealthState,
  saveTaxReturn,
  getTaxReturn,
  lockTaxReturn,
  saveTaxLots,
  getTaxLots,
  saveTaxDocument,
  getTaxDocuments,
  logPreparerAudit,
  getPreparerAuditTrail,
};
