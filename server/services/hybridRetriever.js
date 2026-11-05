// server/services/hybridRetriever.js
// Hybrid Rank Fusion Retriever (BM25 + Gemini Vector Embeddings + Knowledge Graph Topology)

const { bm25Retriever } = require('./bm25Retriever');
const { vectorStore } = require('./vectorStore');
const { knowledgeGraph } = require('./knowledgeGraph');

class HybridRetriever {
  constructor() {
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    // 1. Initialize BM25 and KnowledgeGraph
    bm25Retriever.init();
    knowledgeGraph.init();

    // 2. Initialize VectorStore with BM25 documents
    await vectorStore.init(bm25Retriever.documents);

    this.initialized = true;
  }

  async retrieve(query, topK = 4, filterCategory = null) {
    await this.init();

    // 1. Check deterministic graph navigation intent first
    const directNav = knowledgeGraph.getDirectNavigation(query);

    // 2. Execute BM25 search
    const bm25Results = bm25Retriever.search(query, 10, filterCategory);

    // 3. Execute Vector search
    const vectorResults = await vectorStore.search(query, 10, filterCategory);

    // 4. Reciprocal Rank Fusion (RRF) with k = 60
    const rrfScores = new Map(); // docId -> { score, doc, bm25Rank, vectorRank }

    bm25Results.forEach((item, index) => {
      const docId = item.doc.id;
      const rank = index + 1;
      const rrf = 1 / (60 + rank);

      rrfScores.set(docId, {
        doc: item.doc,
        score: rrf,
        bm25Rank: rank,
        vectorRank: null,
        bm25Score: item.score
      });
    });

    vectorResults.forEach((item, index) => {
      const docId = item.doc.id;
      const rank = index + 1;
      const rrf = 1 / (60 + rank);

      if (rrfScores.has(docId)) {
        const existing = rrfScores.get(docId);
        existing.score += rrf;
        existing.vectorRank = rank;
        existing.vectorScore = item.score;
      } else {
        rrfScores.set(docId, {
          doc: item.doc,
          score: rrf,
          bm25Rank: null,
          vectorRank: rank,
          vectorScore: item.score
        });
      }
    });

    const fused = Array.from(rrfScores.values());
    fused.sort((a, b) => b.score - a.score);

    return {
      directNavigation: directNav,
      topHits: fused.slice(0, topK),
    };
  }

  formatContextPrompt(retrievalResult) {
    if (!retrievalResult || !retrievalResult.topHits || retrievalResult.topHits.length === 0) {
      return '';
    }

    const { directNavigation, topHits } = retrievalResult;

    let output = '\n\n[Verified System Knowledge Base Grounding]:\n';

    if (directNavigation) {
      output += `\n>> UI ACTION MATCH:\n`;
      output += `- Action: ${directNavigation.action}\n`;
      if (directNavigation.route) output += `- Route: ${directNavigation.route}\n`;
      if (directNavigation.tab) output += `- Tab: ${directNavigation.tab}\n`;
      if (directNavigation.subTab) output += `- SubTab: ${directNavigation.subTab}\n`;
      if (directNavigation.spotlightTarget) output += `- Spotlight Target DOM ID: ${directNavigation.spotlightTarget}\n`;
      if (directNavigation.explanation) output += `- Directive: ${directNavigation.explanation}\n`;
    }

    output += `\n>> STATUTORY & APPLICATIVE CODEX HITS:\n`;
    topHits.forEach((hit, idx) => {
      const d = hit.doc;
      output += `[Hit ${idx + 1}] (${d.category.toUpperCase()}) ${d.title}\n`;
      if (d.metadata?.legalCitation) {
        output += `  Statutory Citation: ${d.metadata.legalCitation}\n`;
      }
      output += `  Summary: ${d.content.slice(0, 320)}...\n\n`;
    });

    return output;
  }
}

const hybridRetriever = new HybridRetriever();
module.exports = { HybridRetriever, hybridRetriever };
