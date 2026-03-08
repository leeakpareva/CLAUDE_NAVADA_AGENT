/**
 * Oracle Response Cache — Exact-match response cache on Oracle VM PostgreSQL (or SQLite fallback)
 * Part of the 3-tier cache: Memory LRU -> Oracle exact -> ChromaDB semantic -> API call
 *
 * Uses SSH tunnel to Oracle VM via Tailscale (100.77.206.9)
 * Falls back gracefully if Oracle is unreachable (non-blocking).
 */

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// SQLite fallback (local on HP) since Oracle may not have PG installed
const CACHE_DB_PATH = path.join(__dirname, 'data', 'response-cache.db');
let db = null;

function getDb() {
  if (db) return db;
  try {
    const Database = require('better-sqlite3');
    // Ensure data directory exists
    const dir = path.dirname(CACHE_DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    db = new Database(CACHE_DB_PATH);
    db.pragma('journal_mode = WAL');
    db.exec(`
      CREATE TABLE IF NOT EXISTS response_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        query_hash TEXT NOT NULL UNIQUE,
        query_text TEXT NOT NULL,
        response_text TEXT NOT NULL,
        model_used TEXT,
        tokens_saved INTEGER DEFAULT 0,
        cost_saved REAL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        last_hit_at TEXT,
        hit_count INTEGER DEFAULT 0,
        ttl_hours INTEGER DEFAULT 24
      );
      CREATE INDEX IF NOT EXISTS idx_cache_hash ON response_cache(query_hash);
      CREATE INDEX IF NOT EXISTS idx_cache_created ON response_cache(created_at);
    `);
    return db;
  } catch (err) {
    console.log(`[CACHE-DB] SQLite init error (non-blocking): ${err.message}`);
    return null;
  }
}

/**
 * Normalize and hash a query for exact-match lookup
 */
function hashQuery(text) {
  const normalized = text.toLowerCase().trim()
    .replace(/\s+/g, ' ')               // collapse whitespace
    .replace(/\d{1,2}:\d{2}(:\d{2})?/g, '') // strip times
    .replace(/\d{4}-\d{2}-\d{2}/g, '')  // strip dates
    .trim();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Determine TTL based on query type
 */
function getTtl(query) {
  const dynamicPatterns = [/status/i, /uptime/i, /what time/i, /running/i, /pm2/i, /docker/i, /logs?$/i];
  for (const p of dynamicPatterns) {
    if (p.test(query)) return 1; // 1 hour for dynamic queries
  }
  return 24; // 24 hours for factual queries
}

/**
 * Look up a cached response by exact query match
 * @returns {{ response: string, model: string, hit_count: number } | null}
 */
function lookup(query) {
  try {
    const database = getDb();
    if (!database) return null;

    const hash = hashQuery(query);
    const row = database.prepare(`
      SELECT response_text, model_used, hit_count, created_at, ttl_hours
      FROM response_cache WHERE query_hash = ?
    `).get(hash);

    if (!row) return null;

    // Check TTL
    const createdAt = new Date(row.created_at + 'Z');
    const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    if (ageHours > row.ttl_hours) {
      // Expired, delete it
      database.prepare('DELETE FROM response_cache WHERE query_hash = ?').run(hash);
      return null;
    }

    // Update hit count and last_hit_at
    database.prepare(`
      UPDATE response_cache SET hit_count = hit_count + 1, last_hit_at = datetime('now')
      WHERE query_hash = ?
    `).run(hash);

    return {
      response: row.response_text,
      model: row.model_used,
      hit_count: row.hit_count + 1,
      source: 'oracle-exact',
    };
  } catch (err) {
    console.log(`[CACHE-DB] Lookup error (non-blocking): ${err.message}`);
    return null;
  }
}

/**
 * Store a response in the cache
 */
function store(query, response, opts = {}) {
  try {
    const database = getDb();
    if (!database) return;

    const hash = hashQuery(query);
    const ttl = getTtl(query);

    database.prepare(`
      INSERT OR REPLACE INTO response_cache (query_hash, query_text, response_text, model_used, tokens_saved, cost_saved, ttl_hours, created_at, hit_count, last_hit_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), 0, NULL)
    `).run(hash, query.slice(0, 500), response.slice(0, 10000), opts.model || 'unknown', opts.tokens || 0, opts.cost || 0, ttl);
  } catch (err) {
    console.log(`[CACHE-DB] Store error (non-blocking): ${err.message}`);
  }
}

/**
 * Evict expired entries
 * @returns {number} Number of entries deleted
 */
function evict() {
  try {
    const database = getDb();
    if (!database) return 0;

    const result = database.prepare(`
      DELETE FROM response_cache
      WHERE datetime(created_at, '+' || ttl_hours || ' hours') < datetime('now')
    `).run();
    return result.changes;
  } catch (err) {
    console.log(`[CACHE-DB] Evict error: ${err.message}`);
    return 0;
  }
}

/**
 * Get cache stats
 */
function stats() {
  try {
    const database = getDb();
    if (!database) return { error: 'Cache DB not available' };

    const total = database.prepare('SELECT COUNT(*) as count FROM response_cache').get();
    const hits = database.prepare('SELECT SUM(hit_count) as total_hits FROM response_cache').get();
    const tokensSaved = database.prepare('SELECT SUM(tokens_saved * hit_count) as total FROM response_cache').get();
    const costSaved = database.prepare('SELECT SUM(cost_saved * hit_count) as total FROM response_cache').get();
    const oldest = database.prepare('SELECT MIN(created_at) as oldest FROM response_cache').get();

    return {
      entries: total.count,
      total_hits: hits.total_hits || 0,
      tokens_saved: tokensSaved.total || 0,
      cost_saved_gbp: Math.round((costSaved.total || 0) * 10000) / 10000,
      oldest_entry: oldest.oldest || 'none',
      db_path: CACHE_DB_PATH,
    };
  } catch (err) {
    return { error: err.message };
  }
}

module.exports = { lookup, store, evict, stats, hashQuery };
