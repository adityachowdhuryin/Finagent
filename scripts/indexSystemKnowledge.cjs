// scripts/indexSystemKnowledge.js
// Autonomous Introspector & Continuous Indexer for FinAgent Knowledge Base

const fs = require('fs');
const path = require('path');

// Load environment variables if present
if (fs.existsSync('server/.env')) {
  const envContent = fs.readFileSync('server/.env', 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > -1) {
        const k = trimmed.substring(0, idx).trim();
        const v = trimmed.substring(idx + 1).trim();
        if (!process.env[k]) process.env[k] = v;
      }
    }
  });
}

const { knowledgeGraph } = require('../server/services/knowledgeGraph');
const { bm25Retriever } = require('../server/services/bm25Retriever');
const { vectorStore } = require('../server/services/vectorStore');

async function runIndexer() {
  console.log('\n======================================================');
  console.log('🤖 FinAgent System Knowledge Introspector & Indexer');
  console.log('======================================================\n');

  // 1. Initialize In-Memory Knowledge Graph
  console.log('1. Building In-Memory Relational Knowledge Graph...');
  knowledgeGraph.init();
  console.log(`   ✅ Graph initialized with ${knowledgeGraph.nodes.size} nodes and ${knowledgeGraph.edges.length} edges.`);

  // 2. Initialize BM25 Lexical Index
  console.log('\n2. Indexing BM25 Lexical Corpus & Computing IDF Table...');
  bm25Retriever.init();
  console.log(`   ✅ Indexed ${bm25Retriever.documents.length} documents across UI screens, APIs, and statutes.`);
  console.log(`   ✅ Average document token length: ${bm25Retriever.avgDocLength.toFixed(1)} tokens.`);

  // 3. Batch Embeddings Generation
  console.log('\n3. Verifying / Generating High-Dimensional Vector Embeddings (gemini-embedding-001)...');
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('   ⚠️ GEMINI_API_KEY not found in server/.env — vector generation skipped. BM25 active.');
  } else {
    await vectorStore.init(bm25Retriever.documents);
    const embeddedCount = vectorStore.documents.filter(d => d.vector !== null).length;
    console.log(`   ✅ Vector Store ready: ${embeddedCount} / ${vectorStore.documents.length} documents embedded with 3072 dimensions.`);
  }

  // 4. Verification Sample Query
  console.log('\n4. Running Smoke Retrieval Benchmark...');
  const testQueries = [
    'Where do I declare foreign assets and Google RSUs?',
    'Section 115BAC vs Old Regime Budget 2024 slabs',
    'IRS 30-day wash sale IRC 1091 proxy ETF swap'
  ];

  for (const q of testQueries) {
    const hits = bm25Retriever.search(q, 1);
    const nav = knowledgeGraph.getDirectNavigation(q);
    console.log(`   Query: "${q}"`);
    console.log(`   ↳ Top Match: [${hits[0]?.doc?.category}] ${hits[0]?.doc?.title}`);
    if (nav) {
      console.log(`   ↳ Direct UI Action: ${nav.action} -> ${nav.tab || nav.route} (#${nav.spotlightTarget || 'none'})`);
    }
  }

  console.log('\n======================================================');
  console.log('✨ System Knowledge Indexing Complete & Synced!');
  console.log('======================================================\n');
}

runIndexer().catch(err => {
  console.error('Indexer failed:', err);
  process.exit(1);
});
