// server/services/vectorStore.js
// In-Memory Vector Store with Gemini gemini-embedding-001 (3072 dim) & Disk Cache

const fs = require('fs');
const path = require('path');

const fetchFn = typeof fetch !== 'undefined' ? fetch : require('node-fetch');
const CACHE_FILE = path.join(__dirname, '../data/knowledge/embeddingsCache.json');

class VectorStore {
  constructor() {
    this.documents = [];       // [{ id, category, title, content, vector }]
    this.cache = new Map();    // textHash -> 3072-dim array
    this.initialized = false;
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return hash.toString();
  }

  loadCache() {
    try {
      if (fs.existsSync(CACHE_FILE)) {
        const raw = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
        Object.entries(raw).forEach(([k, v]) => this.cache.set(k, v));
        console.log(`[VectorStore] Loaded ${this.cache.size} cached vector embeddings from disk.`);
      }
    } catch (e) {
      console.warn('[VectorStore] Could not load embeddings cache:', e.message);
    }
  }

  saveCache() {
    try {
      const obj = {};
      this.cache.forEach((v, k) => { obj[k] = v; });
      fs.writeFileSync(CACHE_FILE, JSON.stringify(obj, null, 2), 'utf8');
      console.log(`[VectorStore] Saved ${this.cache.size} vector embeddings to disk.`);
    } catch (e) {
      console.warn('[VectorStore] Could not save embeddings cache:', e.message);
    }
  }

  normalizeVector(vec) {
    let norm = 0;
    for (let i = 0; i < vec.length; i++) norm += vec[i] * vec[i];
    norm = Math.sqrt(norm);
    if (norm === 0) return vec;
    return vec.map(v => v / norm);
  }

  async getEmbedding(text, apiKey) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) return null;

    const hash = this.simpleHash(text);
    if (this.cache.has(hash)) {
      return this.cache.get(hash);
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${key}`;
      const res = await fetchFn(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/gemini-embedding-001',
          content: { parts: [{ text }] }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const rawVec = data?.embedding?.values;
        if (rawVec && Array.isArray(rawVec)) {
          const normalized = this.normalizeVector(rawVec);
          this.cache.set(hash, normalized);
          return normalized;
        }
      }
    } catch (err) {
      console.warn('[VectorStore] Embedding API call failed:', err.message);
    }
    return null;
  }

  async init(docs) {
    if (this.initialized) return;
    this.loadCache();

    let newVectorsCount = 0;
    const key = process.env.GEMINI_API_KEY;

    for (const doc of docs) {
      const textToEmbed = `${doc.title}\n${doc.content}`;
      const hash = this.simpleHash(textToEmbed);

      let vector = this.cache.get(hash);
      if (!vector && key) {
        vector = await this.getEmbedding(textToEmbed, key);
        if (vector) newVectorsCount++;
      }

      this.documents.push({
        ...doc,
        vector: vector || null
      });
    }

    if (newVectorsCount > 0) {
      this.saveCache();
    }

    this.initialized = true;
    const embeddedCount = this.documents.filter(d => d.vector !== null).length;
    console.log(`[VectorStore] Initialized with ${this.documents.length} docs (${embeddedCount} embedded).`);
  }

  async search(query, topK = 5, filterCategory = null) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return [];

    const queryVec = await this.getEmbedding(query, key);
    if (!queryVec) return [];

    const scores = [];

    for (const doc of this.documents) {
      if (filterCategory && doc.category !== filterCategory) continue;
      if (!doc.vector) continue;

      // Dot product of normalized vectors = Cosine Similarity
      let dot = 0;
      const v = doc.vector;
      for (let i = 0; i < queryVec.length; i++) {
        dot += queryVec[i] * v[i];
      }

      scores.push({
        doc: {
          id: doc.id,
          category: doc.category,
          title: doc.title,
          content: doc.content,
          metadata: doc.metadata
        },
        score: dot,
        vectorScore: dot
      });
    }

    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, topK);
  }
}

const vectorStore = new VectorStore();
module.exports = { VectorStore, vectorStore };
