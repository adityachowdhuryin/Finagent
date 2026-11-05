// server/services/knowledgeGraph.js
// In-Memory Relational Knowledge Graph for FinAgent UI, APIs, and Statutory Rules

const fs = require('fs');
const path = require('path');

class KnowledgeGraph {
  constructor() {
    this.nodes = new Map(); // id -> node
    this.edges = [];        // { from, to, relation, metadata }
    this.indexByCapability = new Map(); // capability -> Set of nodeIds
    this.indexByTarget = new Map();     // spotlightTarget -> nodeId
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;

    try {
      const frontendPath = path.join(__dirname, '../data/knowledge/frontendCatalog.json');
      const backendPath = path.join(__dirname, '../data/knowledge/backendApiCatalog.json');
      const statutoryPath = path.join(__dirname, '../data/knowledge/statutoryTaxCodex.json');

      const frontend = JSON.parse(fs.readFileSync(frontendPath, 'utf8'));
      const backend = JSON.parse(fs.readFileSync(backendPath, 'utf8'));
      const statutory = JSON.parse(fs.readFileSync(statutoryPath, 'utf8'));

      // 1. Ingest Frontend Screens & Tabs
      (frontend.screens || []).forEach(screen => {
        const screenNodeId = `screen:${screen.id}`;
        this.addNode(screenNodeId, {
          type: 'SCREEN',
          id: screen.id,
          name: screen.name,
          route: screen.route,
          market: screen.market,
          description: screen.description,
        });

        (screen.tabs || []).forEach(tab => {
          const tabNodeId = `tab:${screen.id}:${tab.id}`;
          this.addNode(tabNodeId, {
            type: 'TAB',
            screenId: screen.id,
            id: tab.id,
            name: tab.name,
            route: screen.route,
            queryParam: tab.queryParam,
            spotlightTarget: tab.spotlightTarget,
            capabilities: tab.capabilities || [],
            description: tab.description,
          });

          this.addEdge(screenNodeId, tabNodeId, 'HAS_TAB');

          if (tab.spotlightTarget) {
            this.indexByTarget.set(tab.spotlightTarget, tabNodeId);
          }

          (tab.capabilities || []).forEach(cap => {
            if (!this.indexByCapability.has(cap)) this.indexByCapability.set(cap, new Set());
            this.indexByCapability.get(cap).add(tabNodeId);
          });

          // Subtabs
          (tab.subTabs || []).forEach(sub => {
            const subNodeId = `subtab:${screen.id}:${tab.id}:${sub.id}`;
            this.addNode(subNodeId, {
              type: 'SUBTAB',
              screenId: screen.id,
              tabId: tab.id,
              id: sub.id,
              name: sub.name,
              route: screen.route,
              queryParam: sub.queryParam,
              spotlightTarget: sub.spotlightTarget,
              capabilities: sub.capabilities || [],
            });

            this.addEdge(tabNodeId, subNodeId, 'HAS_SUBTAB');

            if (sub.spotlightTarget) {
              this.indexByTarget.set(sub.spotlightTarget, subNodeId);
            }

            (sub.capabilities || []).forEach(cap => {
              if (!this.indexByCapability.has(cap)) this.indexByCapability.set(cap, new Set());
              this.indexByCapability.get(cap).add(subNodeId);
            });
          });
        });

        // Modals
        (screen.modals || []).forEach(modal => {
          const modalNodeId = `modal:${screen.id}:${modal.id}`;
          this.addNode(modalNodeId, {
            type: 'MODAL',
            screenId: screen.id,
            id: modal.id,
            name: modal.name,
            triggerState: modal.triggerState,
            description: modal.description,
          });
          this.addEdge(screenNodeId, modalNodeId, 'HAS_MODAL');
        });
      });

      // 2. Ingest Backend APIs
      (backend.endpoints || []).forEach(api => {
        const apiNodeId = `api:${api.path}:${api.method}`;
        this.addNode(apiNodeId, {
          type: 'API_ENDPOINT',
          path: api.path,
          method: api.method,
          category: api.category,
          description: api.description,
          parameters: api.parameters,
          capabilities: api.capabilities || [],
        });

        (api.capabilities || []).forEach(cap => {
          if (!this.indexByCapability.has(cap)) this.indexByCapability.set(cap, new Set());
          this.indexByCapability.get(cap).add(apiNodeId);
        });
      });

      // 3. Ingest Statutory Rules
      (statutory.statutes || []).forEach(st => {
        const statuteNodeId = `statute:${st.id}`;
        this.addNode(statuteNodeId, {
          type: 'STATUTE',
          id: st.id,
          country: st.country,
          category: st.category,
          title: st.title,
          legalCitation: st.legalCitation,
          summary: st.summary,
          keyRules: st.keyRules,
          triggers: st.triggers || [],
        });

        // Link statutes to relevant tabs and capabilities
        if (st.id.includes('schedule_fa')) {
          this.addEdge(statuteNodeId, 'subtab:tax_studio:itr:schedule-fa', 'GOVERNS_SCREEN');
        } else if (st.id.includes('115bac')) {
          this.addEdge(statuteNodeId, 'subtab:tax_studio:itr:summary', 'GOVERNS_SCREEN');
        } else if (st.id.includes('wash_sale') || st.id.includes('capital_gains')) {
          this.addEdge(statuteNodeId, 'tab:tax_studio:harvester', 'GOVERNS_SCREEN');
        } else if (st.id.includes('huf')) {
          this.addEdge(statuteNodeId, 'tab:tax_studio:huf', 'GOVERNS_SCREEN');
        }
      });

      this.initialized = true;
      console.log(`[KnowledgeGraph] Loaded ${this.nodes.size} nodes and ${this.edges.length} relational edges.`);
    } catch (err) {
      console.warn('[KnowledgeGraph] Initialization warning:', err.message);
    }
  }

  addNode(id, data) {
    this.nodes.set(id, { id, ...data });
  }

  addEdge(from, to, relation, metadata = {}) {
    this.edges.push({ from, to, relation, metadata });
  }

  getNode(id) {
    return this.nodes.get(id);
  }

  findNodesByCapability(cap) {
    this.init();
    const nodeIds = this.indexByCapability.get(cap);
    if (!nodeIds) return [];
    return Array.from(nodeIds).map(id => this.nodes.get(id));
  }

  findUINodeBySpotlight(targetId) {
    this.init();
    const nodeId = this.indexByTarget.get(targetId);
    return nodeId ? this.nodes.get(nodeId) : null;
  }

  getDirectNavigation(intentText) {
    this.init();
    const lower = intentText.toLowerCase();

    // Check specific statutory or feature keywords
    if (lower.includes('schedule fa') || lower.includes('foreign asset') || lower.includes('rsu') || lower.includes('foreign stock')) {
      const sub = this.getNode('subtab:tax_studio:itr:schedule-fa');
      return {
        action: 'navigate',
        route: sub.route,
        tab: sub.tabId,
        subTab: sub.id,
        spotlightTarget: sub.spotlightTarget,
        label: 'Schedule FA (Foreign Assets)',
        explanation: 'Navigated to Schedule FA to report foreign equity, RSUs, and overseas accounts under the Black Money Act.',
      };
    }

    if (lower.includes('harvest') || lower.includes('wash sale') || lower.includes('loss harvest')) {
      const tab = this.getNode('tab:tax_studio:harvester');
      return {
        action: 'navigate',
        route: tab.route,
        tab: tab.id,
        subTab: null,
        spotlightTarget: tab.spotlightTarget,
        label: 'Tax-Loss Harvester',
        explanation: 'Switched to Tax-Loss Harvester for algorithmic capital loss harvesting and proxy reallocations.',
      };
    }

    if (lower.includes('115bac') || lower.includes('regime') || lower.includes('compare regime') || lower.includes('old vs new')) {
      const sub = this.getNode('subtab:tax_studio:itr:summary');
      return {
        action: 'navigate',
        route: sub.route,
        tab: sub.tabId,
        subTab: sub.id,
        spotlightTarget: sub.spotlightTarget,
        label: 'Regime & Deduction Optimizer',
        explanation: 'Opened Regime Optimizer comparing Section 115BAC New Regime vs Old Regime.',
      };
    }

    if (lower.includes('huf') || lower.includes('hindu undivided')) {
      const tab = this.getNode('tab:tax_studio:huf');
      return {
        action: 'navigate',
        route: tab.route,
        tab: tab.id,
        subTab: null,
        spotlightTarget: tab.spotlightTarget,
        label: 'HUF Tax Studio',
        explanation: 'Navigated to Indian HUF Studio to configure separate PAN entity, deeds, and Section 64 anti-clubbing compliance.',
      };
    }

    if (lower.includes('advance tax') || lower.includes('quarterly') || lower.includes('234c') || lower.includes('1040-es')) {
      const tab = this.getNode('tab:tax_studio:quarterly');
      return {
        action: 'navigate',
        route: tab.route,
        tab: tab.id,
        subTab: null,
        spotlightTarget: tab.spotlightTarget,
        label: 'Quarterly & Advance Tax Flight-Control',
        explanation: 'Opened Quarterly Estimated Tax & Section 234 Flight-Control to avoid statutory interest penalties.',
      };
    }

    if (lower.includes('dropzone') || lower.includes('upload w-2') || lower.includes('upload form 16') || lower.includes('upload ais')) {
      return {
        action: 'open_modal',
        modalId: 'dropzone',
        label: 'Document Dropzone',
        explanation: 'Opened Document Dropzone for Form 16, AIS, and W-2 document vision extraction.',
      };
    }

    if (lower.includes('loan') || lower.includes('prepay') || lower.includes('mortgage')) {
      const screen = this.getNode('screen:loan_negotiator');
      return {
        action: 'navigate',
        route: screen.route,
        tab: 'calc',
        subTab: null,
        spotlightTarget: 'loan-prepayment-slider',
        label: 'Loan & Debt Negotiator',
        explanation: 'Navigated to Loan & Debt Negotiator to model prepayment interest reduction and spread arbitrage.',
      };
    }

    return null;
  }
}

const knowledgeGraph = new KnowledgeGraph();
module.exports = { KnowledgeGraph, knowledgeGraph };
