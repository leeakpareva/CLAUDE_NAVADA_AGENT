/**
 * Semantic Response Cache - ChromaDB + Cloudflare Workers AI
 * Caches Claude API responses and returns cached answers for similar queries.
 * Saves Anthropic API tokens on repeated/similar questions.
 *
 * How it works:
 * 1. Before calling Claude: embed the query, search cache collection
 * 2. If a match with distance < threshold exists and isn't stale, return cached response
 * 3. After Claude responds: embed query + store response in cache
 *
 * Cache invalidation:
 * - TTL-based: entries expire after CACHE_TTL_HOURS
 * - Tool-use responses are NOT cached (they depend on live state)
 * - Admin commands that modify state are NOT cached
 *
 * Usage:
 *   const cache = require('./semantic-cache');
 *   const cached = await cache.lookup(userMessage);
 *   if (cached) return cached.response;
 *   // ... call Claude ...
 *   await cache.store(userMessage, claudeResponse, metadata);
 */

require('dotenv').config({ path: __dirname + '/.env' });
const { CloudClient } = require('chromadb');

const CHROMA_API_KEY = process.env.CHROMA_API_KEY;
const CHROMA_TENANT = process.env.CHROMA_TENANT;
const CHROMA_DATABASE = process.env.CHROMA_DATABASE || 'NAVADA';

const CACHE_COLLECTION = 'navada-response-cache';
const CACHE_THRESHOLD = 0.12;       // distance below this = cache hit (tighter = more exact)
const CACHE_TTL_HOURS = 24;         // cache entries expire after this
const MIN_QUERY_LENGTH = 10;        // don't cache very short queries
const MAX_CACHE_RESPONSE = 3000;    // max response length to cache

// Queries that should never be cached (live state dependent)
const NOCACHE_PATTERNS = [
  /^\/status/i, /^\/pm2/i, /^\/disk/i, /^\/uptime/i, /^\/docker/i,
  /^\/tailscale/i, /^\/nginx/i, /^\/processes/i, /^\/costs/i,
  /^\/inbox/i, /^\/sent/i, /^\/users/i, /^\/stream/i, /^\/r2/i,
  /^\/tasks/i, /^\/memory/i, /^\/ls/i, /^\/cat/i, /^\/shell/i,
  /server status/i, /how much disk/i, /what.s running/i,
  /check (my |the )?(inbox|email)/i, /pm2 (restart|stop|start|logs)/i,
];

let client = null;
let collection = null;
let rag = null;

function getRag() {
  if (!rag) rag = require('./chroma-rag');
  return rag;
}

function getClient() {
  if (client) return client;
  if (!CHROMA_API_KEY) return null;
  const opts = { apiKey: CHROMA_API_KEY };
  if (CHROMA_TENANT) opts.tenant = CHROMA_TENANT;
  if (CHROMA_DATABASE) opts.database = CHROMA_DATABASE;
  client = new CloudClient(opts);
  return client;
}

async function getCollection() {
  if (collection) return collection;
  const c = getClient();
  if (!c) return null;
  try {
    collection = await c.getOrCreateCollection({ name: CACHE_COLLECTION });
    return collection;
  } catch (err) {
    console.warn(`[CACHE] Failed to get collection: ${err.message}`);
    return null;
  }
}

function shouldCache(query) {
  if (!query || query.length < MIN_QUERY_LENGTH) return false;
  for (const pattern of NOCACHE_PATTERNS) {
    if (pattern.test(query)) return false;
  }
  return true;
}

function isExpired(indexedAt) {
  if (!indexedAt) return true;
  const age = Date.now() - new Date(indexedAt).getTime();
  return age > CACHE_TTL_HOURS * 3600 * 1000;
}

// --- In-memory LRU for hot queries (avoids even the ChromaDB call) ---
const memCache = new Map();
const MEM_CACHE_MAX = 50;
const MEM_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function memLookup(queryLower) {
  const entry = memCache.get(queryLower);
  if (!entry) return null;
  if (Date.now() - entry.ts > MEM_CACHE_TTL) {
    memCache.delete(queryLower);
    return null;
  }
  return entry;
}

function memStore(queryLower, response, metadata) {
  if (memCache.size >= MEM_CACHE_MAX) {
    // Evict oldest
    const oldest = memCache.keys().next().value;
    memCache.delete(oldest);
  }
  memCache.set(queryLower, { response, metadata, ts: Date.now() });
}

/**
 * Look up a cached response for a similar query.
 * @param {string} query - The user's message
 * @returns {{ response: string, distance: number, source: string, cached_at: string } | null}
 */
async function lookup(query) {
  if (!shouldCache(query)) return null;

  // Check in-memory first
  const queryLower = query.toLowerCase().trim();
  const memHit = memLookup(queryLower);
  if (memHit) {
    console.log(`[CACHE] Memory hit for: "${query.slice(0, 50)}..."`);
    return { response: memHit.response, distance: 0, source: 'memory', cached_at: new Date(memHit.ts).toISOString() };
  }

  // Check ChromaDB
  try {
    const col = await getCollection();
    if (!col) return null;

    const count = await col.count();
    if (count === 0) return null;

    const ragModule = getRag();
    const [embedding] = await ragModule.getEmbeddings([query]);

    const results = await col.query({
      queryEmbeddings: [embedding],
      nResults: 1,
    });

    if (!results.documents?.[0]?.[0]) return null;

    const distance = results.distances?.[0]?.[0] || 1;
    const metadata = results.metadatas?.[0]?.[0] || {};
    const cachedResponse = metadata.response || '';

    // Check threshold and TTL
    if (distance > CACHE_THRESHOLD) return null;
    if (isExpired(metadata.cached_at)) return null;
    if (!cachedResponse) return null;

    console.log(`[CACHE] ChromaDB hit (dist: ${distance.toFixed(4)}) for: "${query.slice(0, 50)}..."`);

    // Promote to memory cache
    memStore(queryLower, cachedResponse, metadata);

    return {
      response: cachedResponse,
      distance,
      source: 'chromadb',
      cached_at: metadata.cached_at,
    };
  } catch (err) {
    console.warn(`[CACHE] Lookup error: ${err.message}`);
    return null;
  }
}

/**
 * Store a query-response pair in the cache.
 * @param {string} query - The user's message
 * @param {string} response - Claude's text response
 * @param {Object} metadata - { userId, model, inputTokens, outputTokens, usedTools }
 */
async function store(query, response, metadata = {}) {
  if (!shouldCache(query)) return;
  if (!response || response.length < 10) return;
  if (metadata.usedTools) return;  // Don't cache tool-dependent responses

  const trimmedResponse = response.slice(0, MAX_CACHE_RESPONSE);

  // Store in memory
  const queryLower = query.toLowerCase().trim();
  memStore(queryLower, trimmedResponse, metadata);

  // Store in ChromaDB
  try {
    const col = await getCollection();
    if (!col) return;

    const ragModule = getRag();
    const [embedding] = await ragModule.getEmbeddings([query]);

    const id = `cache-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    await col.add({
      ids: [id],
      embeddings: [embedding],
      documents: [query],
      metadatas: [{
        response: trimmedResponse,
        cached_at: now,
        model: metadata.model || 'unknown',
        input_tokens: metadata.inputTokens || 0,
        output_tokens: metadata.outputTokens || 0,
        user_id: String(metadata.userId || ''),
      }],
    });

    console.log(`[CACHE] Stored response for: "${query.slice(0, 50)}..." (${trimmedResponse.length} chars)`);
  } catch (err) {
    console.warn(`[CACHE] Store error: ${err.message}`);
  }
}

/**
 * Get cache stats.
 */
async function stats() {
  const result = { memoryEntries: memCache.size, chromaEntries: 0 };
  try {
    const col = await getCollection();
    if (col) result.chromaEntries = await col.count();
  } catch {}
  return result;
}

/**
 * Clear expired entries from ChromaDB cache.
 */
async function cleanup() {
  try {
    const col = await getCollection();
    if (!col) return { removed: 0 };

    const count = await col.count();
    if (count === 0) return { removed: 0 };

    const all = await col.get({ limit: Math.min(count, 100), include: ['metadatas'] });
    const expiredIds = [];

    for (let i = 0; i < (all.ids || []).length; i++) {
      const meta = all.metadatas?.[i];
      if (isExpired(meta?.cached_at)) {
        expiredIds.push(all.ids[i]);
      }
    }

    if (expiredIds.length > 0) {
      await col.delete({ ids: expiredIds });
      console.log(`[CACHE] Cleaned up ${expiredIds.length} expired entries`);
    }

    return { removed: expiredIds.length };
  } catch (err) {
    console.warn(`[CACHE] Cleanup error: ${err.message}`);
    return { removed: 0, error: err.message };
  }
}

module.exports = { lookup, store, stats, cleanup, shouldCache };
