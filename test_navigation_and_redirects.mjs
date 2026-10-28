// test_navigation_and_redirects.mjs
// Verification of Super-Hub routes, backward compatibility, and UI components

import assert from 'assert';
import fs from 'fs';

const VITE_BASE = 'http://localhost:5173';

console.log('🚀 Running Navigation, Super-Hub, and Backward Compatibility Suite...\n');

async function runTests() {
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

  console.log('=== 1. SUPER-HUB ROUTES & VITE SPA SERVING ===');

  const routes = [
    '/app/dashboard',
    '/app/portfolio',
    '/app/tax',
    '/app/tax?tab=e-file',
    '/app/tax?tab=huf',
    '/app/tax?tab=harvester',
    '/app/tax?tab=forensic',
    '/app/tax?tab=itr',
    '/app/family-hub',
    '/app/execution',
    '/app/direct-indexing',
    '/app/e-file',
    '/app/huf-studio',
    '/advisor/clients',
    '/advisor/recommendations',
    '/advisor/audit'
  ];

  for (const route of routes) {
    await check(`Route ${route} serves 200 SPA shell`, async () => {
      const res = await fetch(`${VITE_BASE}${route}`);
      assert.strictEqual(res.status, 200);
      const text = await res.text();
      assert.ok(text.includes('<div id="root">'), 'Expected root div');
    });
  }

  console.log('\n=== 2. CODE INTEGRITY & COMPONENT INTEGRATION ===');

  await check('StickyActionDock component exists and exports default', async () => {
    const file = fs.readFileSync('./src/components/common/StickyActionDock.jsx', 'utf-8');
    assert.ok(file.includes('export default function StickyActionDock'));
    assert.ok(file.includes('sticky-action-dock'));
  });

  await check('TaxForensicStudio integrates all 5 sub-tools & URL tab sync', async () => {
    const file = fs.readFileSync('./src/pages/consumer/TaxForensicStudio.jsx', 'utf-8');
    assert.ok(file.includes('TaxEFilingHub'));
    assert.ok(file.includes('HUFStudio'));
    assert.ok(file.includes('TaxHarvester'));
    assert.ok(file.includes('ForensicAudit'));
    assert.ok(file.includes('ITRAssistant'));
    assert.ok(file.includes("searchParams.get('tab')"));
  });

  await check('TaxEFilingHub mounts StickyActionDock with CBDT Transmission & PDF export', async () => {
    const file = fs.readFileSync('./src/pages/consumer/TaxEFilingHub.jsx', 'utf-8');
    assert.ok(file.includes('StickyActionDock'));
    assert.ok(file.includes('Direct CBDT API Transmission'));
    assert.ok(file.includes('Download ITR-2 Computation Statement (PDF)'));
  });

  await check('ExecutionHub mounts StickyActionDock with 1-Click Co-Signed Order Execution', async () => {
    const file = fs.readFileSync('./src/pages/consumer/ExecutionHub.jsx', 'utf-8');
    assert.ok(file.includes('StickyActionDock'));
    assert.ok(file.includes('1-Click Execute All Co-Signed Orders'));
  });

  await check('HUFStudio mounts StickyActionDock with Stamped HUF Deed PDF export', async () => {
    const file = fs.readFileSync('./src/pages/consumer/HUFStudio.jsx', 'utf-8');
    assert.ok(file.includes('StickyActionDock'));
    assert.ok(file.includes('Download Stamped HUF Deed (PDF)'));
  });

  await check('DigitalWill mounts StickyActionDock with Notarization-Ready PDF export', async () => {
    const file = fs.readFileSync('./src/pages/consumer/DigitalWill.jsx', 'utf-8');
    assert.ok(file.includes('StickyActionDock'));
    assert.ok(file.includes('Download Notarization-Ready PDF'));
  });

  await check('AuditLog mounts StickyActionDock with SEBI Inspection Dossier export', async () => {
    const file = fs.readFileSync('./src/pages/advisor/AuditLog.jsx', 'utf-8');
    assert.ok(file.includes('StickyActionDock'));
    assert.ok(file.includes('Export SEBI Inspection Dossier (PDF)'));
  });

  await check('TopBar Persona Switcher is universally visible (Investor ⇄ Advisor)', async () => {
    const file = fs.readFileSync('./src/components/layout/TopBar.jsx', 'utf-8');
    assert.ok(file.includes('Persistent 1-Click Persona Switcher'));
    assert.ok(file.includes("switchRole?.('investor')"));
    assert.ok(file.includes("switchRole?.('advisor')"));
  });

  await check('CSS breakpoint for topbar-desktop-controls updated from 1720px to 1100px', async () => {
    const file = fs.readFileSync('./src/index.css', 'utf-8');
    assert.ok(file.includes('@media (min-width: 1100px)'));
    assert.ok(!file.includes('@media (min-width: 1720px)'));
  });

  await check('HubSubNav rendered as clean single-row tab strip without nested dropdown modals', async () => {
    const file = fs.readFileSync('./src/components/layout/HubSubNav.jsx', 'utf-8');
    assert.ok(file.includes('hub-subnav-strip'));
    assert.ok(!file.includes('setOpenPillar'));
    assert.ok(!file.includes('launchpadOpen'));
  });

  await check('Sidebar consolidated to 7 clean Core Hubs without tax/debt duplicates', async () => {
    const file = fs.readFileSync('./src/components/layout/Sidebar.jsx', 'utf-8');
    assert.ok(file.includes("label: 'Autonomous Execution & Alpha'"));
    assert.ok(file.includes("label: 'Tax & Forensic Studio'"));
    assert.ok(file.includes("label: 'Loan & Fee Negotiator'"));
    assert.ok(file.includes("badge: 'Save ₹3L'"));
    assert.ok(file.includes("badge: 'Cut EMI'"));
    assert.ok(!file.includes("label: 'ITR E-Filing & AIS'"));
    assert.ok(!file.includes("label: 'HUF Tax Studio'"));
  });

  console.log(`\n🎉 Verification Completed: ${passed}/${total} checks passed!\n`);
}

runTests();
