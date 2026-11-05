// server/services/bm25Retriever.js
// In-Memory BM25 Lexical Information Retrieval Engine for FinAgent Knowledge Base

const fs = require('fs');
const path = require('path');

class BM25Retriever {
  constructor(k1 = 1.2, b = 0.75) {
    this.k1 = k1;
    this.b = b;
    this.documents = [];       // [{ id, category, title, content, metadata }]
    this.docTokens = [];       // array of token arrays
    this.docLengths = [];      // array of doc token counts
    this.avgDocLength = 0;
    this.idf = new Map();      // term -> idf score
    this.initialized = false;
  }

  tokenize(text) {
    if (!text) return [];
    return text
      .toLowerCase()
      .replace(/[^\w\s§.-]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1);
  }

  init() {
    if (this.initialized) return;

    try {
      const frontend = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/knowledge/frontendCatalog.json'), 'utf8'));
      const backend = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/knowledge/backendApiCatalog.json'), 'utf8'));
      const statutory = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/knowledge/statutoryTaxCodex.json'), 'utf8'));

      const docs = [];

      // Add Frontend screens & tabs
      (frontend.screens || []).forEach(screen => {
        docs.push({
          id: `screen:${screen.id}`,
          category: 'ui_screen',
          title: screen.name,
          content: `${screen.name} ${screen.route} ${screen.description}`,
          metadata: { route: screen.route, id: screen.id }
        });

        (screen.tabs || []).forEach(tab => {
          docs.push({
            id: `tab:${screen.id}:${tab.id}`,
            category: 'ui_tab',
            title: `${screen.name} - ${tab.name}`,
            content: `${screen.name} ${tab.name} ${tab.queryParam} ${tab.description} ${(tab.capabilities || []).join(' ')} ${tab.spotlightTarget || ''}`,
            metadata: { route: screen.route, queryParam: tab.queryParam, spotlightTarget: tab.spotlightTarget }
          });

          (tab.subTabs || []).forEach(sub => {
            docs.push({
              id: `subtab:${screen.id}:${tab.id}:${sub.id}`,
              category: 'ui_subtab',
              title: `${tab.name} > ${sub.name}`,
              content: `${sub.name} ${sub.queryParam} ${(sub.capabilities || []).join(' ')} ${sub.spotlightTarget || ''}`,
              metadata: { route: screen.route, queryParam: sub.queryParam, spotlightTarget: sub.spotlightTarget }
            });
          });
        });
      });

      // Add Backend APIs
      (backend.endpoints || []).forEach(api => {
        docs.push({
          id: `api:${api.path}`,
          category: 'backend_api',
          title: `API: ${api.method} ${api.path}`,
          content: `${api.method} ${api.path} ${api.description} ${(api.capabilities || []).join(' ')} ${JSON.stringify(api.parameters || {})}`,
          metadata: { path: api.path, method: api.method, category: api.category }
        });
      });

      // Add Statutory Rules
      (statutory.statutes || []).forEach(st => {
        docs.push({
          id: `statute:${st.id}`,
          category: 'statute',
          title: st.title,
          content: `${st.title} ${st.legalCitation} ${st.summary} ${(st.keyRules || []).join(' ')} ${(st.triggers || []).join(' ')}`,
          metadata: { id: st.id, legalCitation: st.legalCitation, country: st.country, category: st.category }
        });
      });

      this.buildIndex(docs);
      this.initialized = true;
      console.log(`[BM25Retriever] Indexed ${this.documents.length} knowledge documents. Avg length: ${this.avgDocLength.toFixed(1)} tokens.`);
    } catch (err) {
      console.warn('[BM25Retriever] Initialization error:', err.message);
    }
  }

  buildIndex(docs) {
    this.documents = docs;
    this.docTokens = docs.map(d => this.tokenize(`${d.title} ${d.content}`));
    this.docLengths = this.docTokens.map(t => t.length);
    const totalTokens = this.docLengths.reduce((a, b) => a + b, 0);
    this.avgDocLength = totalTokens / (docs.length || 1);

    // Compute Document Frequency (DF) for each term
    const N = docs.length;
    const df = new Map();

    this.docTokens.forEach(tokens => {
      const uniqueTokens = new Set(tokens);
      uniqueTokens.forEach(token => {
        df.set(token, (df.get(token) || 0) + 1);
      });
    });

    // Compute IDF
    df.forEach((docFreq, term) => {
      // Standard Lucene / BM25 IDF formulation
      const idfScore = Math.log(1 + (N - docFreq + 0.5) / (docFreq + 0.5));
      this.idf.set(term, idfScore);
    });
  }

  search(query, topK = 5, filterCategory = null) {
    this.init();
    const queryTokens = this.tokenize(query);
    if (queryTokens.length === 0) return [];

    const scores = [];

    for (let i = 0; i < this.documents.length; i++) {
      const doc = this.documents[i];
      if (filterCategory && doc.category !== filterCategory) continue;

      const tokens = this.docTokens[i];
      const docLen = this.docLengths[i];

      // Count term frequencies in this document
      const tf = new Map();
      tokens.forEach(t => tf.set(t, (tf.get(t) || 0) + 1));

      let score = 0;
      queryTokens.forEach(qTerm => {
        const termFreq = tf.get(qTerm) || 0;
        if (termFreq > 0) {
          const idfScore = this.idf.get(qTerm) || 0.1;
          const numerator = termFreq * (this.k1 + 1);
          const denominator = termFreq + this.k1 * (1 - this.b + this.b * (docLen / this.avgDocLength));
          score += idfScore * (numerator / denominator);
        }
      });

      if (score > 0) {
        scores.push({
          doc,
          score,
          bm25Score: score,
        });
      }
    }

    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, topK);
  }
}

const bm25Retriever = new BM25Retriever();
module.exports = { BM25Retriever, bm25Retriever };
