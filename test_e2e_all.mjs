// test_e2e_all.mjs
// Automated verification of Options A, B, and C

import assert from 'assert';

const API_BASE = 'http://localhost:3001';
const VITE_BASE = 'http://localhost:5173';

console.log('🚀 Starting Automated End-to-End Test Suite for Options A, B & C...\n');

async function testAll() {
  let passed = 0;
  let total = 0;

  async function check(name, fn) {
    total++;
    process.stdout.write(`  [${total}] ${name}... `);
    try {
      await fn();
      passed++;
      console.log('✅ PASSED');
    } catch (err) {
      console.log(`❌ FAILED: ${err.message}`);
    }
  }

  console.log('=== OPTION A: DIRECT INDEXING TERMINAL & FACTOR TILTS ===');

  await check('Vite frontend serves Direct Indexing Hub HTML', async () => {
    const res = await fetch(`${VITE_BASE}/app/direct-indexing`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('<div id="root">'), 'Expected root div');
  });

  await check('GET /api/direct-indexing/models?market=IN returns models & factor metadata', async () => {
    const res = await fetch(`${API_BASE}/api/direct-indexing/models?market=IN`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.ok(json.success, 'Expected success: true');
    assert.ok(json.models.length >= 1, 'Expected at least 1 model');
    const nifty = json.models.find(m => m.id === 'nifty50_direct');
    assert.ok(nifty, 'Expected nifty50_direct model');
    assert.strictEqual(nifty.benchmark, 'Nifty 50 TRI (NIFTYBEES)');
    assert.ok(nifty.constituents.length >= 10, 'Expected at least 10 constituents');
  });

  await check('POST /api/direct-indexing/rebalance with factor tilts computes QP-solved basket', async () => {
    const res = await fetch(`${API_BASE}/api/direct-indexing/rebalance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modelId: 'nifty50_direct',
        market: 'IN',
        customCash: 500000,
        factorTilts: { momentum: 50, quality: 30, lowVol: 10 },
        exclusions: ['ITC', 'COALINDIA']
      })
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.ok(json.success, 'Expected success: true');
    assert.ok(json.orderBasket && json.orderBasket.length > 0, 'Expected non-empty order basket');
    assert.ok(json.trackingError, 'Expected trackingError');
    assert.ok(json.projectedExcessReturn, 'Expected projectedExcessReturn');
  });

  await check('POST /api/direct-indexing/harvest-lots executes 31-day proxy tax swap', async () => {
    const res = await fetch(`${API_BASE}/api/direct-indexing/harvest-lots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modelId: 'nifty50_direct',
        market: 'IN',
        customCash: 500000
      })
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.ok(json.success, 'Expected success: true');
    assert.ok(json.harvestPairs.length >= 3, 'Expected underwater constituent lots');
    assert.ok(json.totalLossHarvested, 'Expected totalLossHarvested');
    assert.ok(json.taxShieldBenefit, 'Expected taxShieldBenefit');
  });

  console.log('\n=== OPTION B: FORENSIC PORTFOLIO X-RAY & TAX E-FILING HUB ===');

  await check('Vite frontend serves Tax E-Filing Hub HTML', async () => {
    const res = await fetch(`${VITE_BASE}/app/e-file`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('<div id="root">'), 'Expected root div');
  });

  let generatedHash = null;
  await check('POST /api/e-file/generate-schema compiles CBDT ITR-2 JSON', async () => {
    const res = await fetch(`${API_BASE}/api/e-file/generate-schema`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        market: 'IN',
        pan: 'ABCDE1234F',
        name: 'Arjun Sharma',
        salary: 2400000,
        ltcg: 285000,
        stcg: 120000,
        dividendIncome: 42000,
        bankInterest: 14200,
        fdInterest: 38000,
        tds: 145000
      })
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.ok(json.success, 'Expected success: true');
    assert.ok(json.schemaFormat.includes('AY 2026-27'), 'Expected AY 2026-27 format');
    assert.ok(json.hash, 'Expected SHA-256 hash');
    generatedHash = json.hash;
  });

  await check('POST /api/e-file/lint passes 28 statutory audit rules (100% score)', async () => {
    const res = await fetch(`${API_BASE}/api/e-file/lint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        market: 'IN',
        formData: {
          salary: 2400000,
          ltcg: 285000,
          stcg: 120000,
          dividendIncome: 42000,
          bankInterest: 14200,
          fdInterest: 38000,
          tds: 145000
        }
      })
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.ok(json.success, 'Expected success: true');
    assert.strictEqual(json.complianceScore, 100);
    assert.strictEqual(json.errorCount, 0);
    assert.strictEqual(json.totalRulesAudited, 28);
  });

  await check('POST /api/e-file/reconcile-ais flags discrepancies and confirms 100% match when synchronized', async () => {
    // 1. Initial unaligned state flags variance
    const resUnaligned = await fetch(`${API_BASE}/api/e-file/reconcile-ais`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pan: 'ABCDE1234F',
        declaredData: {
          dividendIncome: 38000, // Under-reported by 4,000
          bankInterest: 10000    // Under-reported by 4,200
        }
      })
    });
    const jsonUnaligned = await resUnaligned.json();
    assert.strictEqual(jsonUnaligned.summary.status, 'RECONCILIATION_REQUIRED');
    assert.strictEqual(jsonUnaligned.summary.netVariance, 8200);

    // 2. Aligned with AIS confirms 100% match
    const resAligned = await fetch(`${API_BASE}/api/e-file/reconcile-ais`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pan: 'ABCDE1234F',
        declaredData: {
          salary: 1850000,
          ltcg: 245000,
          stcg: 85000,
          dividendIncome: 42000,
          bankInterest: 14200,
          fdInterest: 68000
        }
      })
    });
    const jsonAligned = await resAligned.json();
    assert.strictEqual(jsonAligned.summary.status, 'PERFECTLY_MATCHED');
    assert.strictEqual(jsonAligned.summary.netVariance, 0);
  });

  await check('POST /api/e-file/transmit accepts statutory filing with official DIN', async () => {
    const res = await fetch(`${API_BASE}/api/e-file/transmit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        market: 'IN',
        payloadHash: generatedHash || 'hash_test',
        filerName: 'Arjun Sharma'
      })
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.ok(json.success, 'Expected success: true');
    assert.ok(json.data.submissionId.startsWith('CBDT-DIN-2026-'), 'Expected CBDT-DIN submissionId');
  });

  console.log('\n=== OPTION C: MULTI-CLIENT ADVISOR PORTAL & EXECUTION BRIDGE ===');

  await check('GET /api/advisor/clients returns client roster', async () => {
    const res = await fetch(`${API_BASE}/api/advisor/clients`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.ok(json.success, 'Expected success: true');
    assert.ok(json.clients.length >= 1, 'Expected at least 1 client');
  });

  await check('POST /api/advisor/create-ips creates statutory IPS covenant with SHA-256 digest', async () => {
    const res = await fetch(`${API_BASE}/api/advisor/create-ips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: 'c1',
        clientName: 'Arjun Sharma',
        pan: 'ABCDE1234F',
        riskProfile: 'Moderate Growth',
        horizonYears: 10,
        targetReturnHurdle: '12.5% p.a.',
        equityBand: '55% - 70%',
        debtBand: '20% - 35%',
        goldCashBand: '10% - 15%'
      })
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.ok(json.success, 'Expected success: true');
    assert.ok(json.integrityDigest, 'Expected integrityDigest');
    assert.ok(json.ips.bilateralSignatures.advisorSigned, 'Expected advisorSigned');
  });

  let bridgedOrderId = null;
  await check('POST /api/advisor/sign-and-bridge co-signs reco and queues in broker ledger', async () => {
    const res = await fetch(`${API_BASE}/api/advisor/sign-and-bridge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recoId: 'reco_test_opt_c_suite',
        reco: {
          title: 'Direct Index Factor Tilt: Momentum Alpha & Loss Harvest',
          amount: 500000
        },
        clientName: 'Arjun Sharma',
        advisorSig: 'Meera Kapoor · SEBI-RIA INA000014523'
      })
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.ok(json.success, 'Expected success: true');
    assert.ok(json.bridgedOrder.id.startsWith('ord_ria_'), 'Expected ord_ria_ prefix');
    assert.strictEqual(json.bridgedOrder.status, 'QUEUED_FOR_BROKER');
    assert.ok(json.signatureHash, 'Expected signature hash');
    bridgedOrderId = json.bridgedOrder.id;
  });

  await check('GET /api/broker/status?market=IN returns queued bridged order in recentOrders', async () => {
    const res = await fetch(`${API_BASE}/api/broker/status?market=IN`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.ok(json.success, 'Expected success: true');
    const order = json.recentOrders.find(o => o.id === bridgedOrderId);
    assert.ok(order, 'Expected bridged order in recent orders list');
    assert.strictEqual(order.status, 'QUEUED_FOR_BROKER');
  });

  await check('POST /api/broker/execute-bridged-order executes queued co-signed order to FILLED_VWAP', async () => {
    const res = await fetch(`${API_BASE}/api/broker/execute-bridged-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: bridgedOrderId })
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.ok(json.success, 'Expected success: true');
    assert.strictEqual(json.order.status, 'FILLED_VWAP');
  });

  await check('GET /api/advisor/sebi-inspection-dossier produces audit ledger with zero tamper events', async () => {
    const res = await fetch(`${API_BASE}/api/advisor/sebi-inspection-dossier`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.ok(json.success, 'Expected success: true');
    assert.ok(json.dossier.statutoryCovenants.length >= 4, 'Expected statutory covenants');
    assert.ok(json.dossier.auditTrail.length > 0, 'Expected audit trail');
    const passAll = json.dossier.statutoryCovenants.every(c => c.compliance.includes('Pass'));
    assert.ok(passAll, 'Expected all covenants to pass');
  });

  console.log(`\n🎉 Test Suite Completed: ${passed}/${total} checks passed!`);
  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

testAll().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
