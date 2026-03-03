#!/usr/bin/env node
/**
 * ChromaDB RAG Module - Vector embedding & retrieval for NAVADA
 * Uses Chroma Cloud for storage + Cloudflare Workers AI for FREE embeddings.
 *
 * Collections:
 *   navada-logs      - Automation logs, ops reports, daily outputs
 *   navada-docs      - CLAUDE.md, MEMORY.md, READMEs, documentation
 *   navada-code      - Key scripts and config files
 *   navada-comms     - Emails, Telegram interactions, LinkedIn posts
 *
 * Usage:
 *   node chroma-rag.js status                    - Show collections + counts
 *   node chroma-rag.js index-docs                - Index all documentation
 *   node chroma-rag.js index-logs                - Index recent logs
 *   node chroma-rag.js index-file <path>         - Index a specific file
 *   node chroma-rag.js search "query" [--n 5]    - Search across all collections
 *   node chroma-rag.js search "query" --collection navada-docs
 *
 * Programmatic:
 *   const rag = require('./chroma-rag');
 *   const results = await rag.search('how does the trading bot work?');
 *   await rag.indexFile('/path/to/file.js', 'navada-code');
 */

require('dotenv').config({ path: __dirname + '/.env' });
const fs = require('fs');
const path = require('path');
const https = require('https');
const { CloudClient } = require('chromadb');

// --- Config ---
const CHROMA_API_KEY = process.env.CHROMA_API_KEY;
const CHROMA_TENANT = process.env.CHROMA_TENANT;
const CHROMA_DATABASE = process.env.CHROMA_DATABASE || 'navada-edge';
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const EMBEDDING_MODEL = '@cf/baai/bge-base-en-v1.5';
const EMBEDDING_URL = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${EMBEDDING_MODEL}`;

const NAVADA_DIR = 'C:/Users/leeak/CLAUDE_NAVADA_AGENT';
const CHUNK_SIZE = 800;       // ~800 chars per chunk (~200 tokens)
const CHUNK_OVERLAP = 100;    // overlap between chunks
const MAX_BATCH = 20;         // max embeddings per API call (CF limit)

// --- Collection (single collection in Chroma Cloud: navada-edge) ---
const COLLECTION_NAME = 'navada-edge';
// Category prefixes in metadata.category: docs, logs, code, comms
const COLLECTIONS = {
  docs: COLLECTION_NAME,
  logs: COLLECTION_NAME,
  code: COLLECTION_NAME,
  comms: COLLECTION_NAME,
};

let client = null;

function getClient() {
  if (client) return client;
  if (!CHROMA_API_KEY) throw new Error('Missing CHROMA_API_KEY in .env');
  const opts = { apiKey: CHROMA_API_KEY };
  if (CHROMA_TENANT) opts.tenant = CHROMA_TENANT;
  if (CHROMA_DATABASE) opts.database = CHROMA_DATABASE;
  client = new CloudClient(opts);
  return client;
}

// --- Embedding via Cloudflare Workers AI (FREE) ---

async function getEmbeddings(texts) {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
    throw new Error('Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN for embeddings');
  }

  const results = [];
  // Process in batches of MAX_BATCH
  for (let i = 0; i < texts.length; i += MAX_BATCH) {
    const batch = texts.slice(i, i + MAX_BATCH);
    const body = JSON.stringify({ text: batch });

    const embeddings = await new Promise((resolve, reject) => {
      const url = new URL(EMBEDDING_URL);
      const req = https.request({
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CF_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      }, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (!json.success) {
              reject(new Error(json.errors?.[0]?.message || 'Embedding API error'));
              return;
            }
            resolve(json.result.data);
          } catch (e) {
            reject(new Error(`Failed to parse embedding response: ${data.slice(0, 200)}`));
          }
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });

    results.push(...embeddings);
  }

  return results;
}

// --- Chunking ---

function chunkText(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = start + chunkSize;

    // Try to break at a natural boundary (newline, period, space)
    if (end < text.length) {
      const segment = text.slice(start, end + 50);
      const newlineIdx = segment.lastIndexOf('\n', chunkSize);
      const periodIdx = segment.lastIndexOf('. ', chunkSize);
      const spaceIdx = segment.lastIndexOf(' ', chunkSize);

      if (newlineIdx > chunkSize * 0.5) end = start + newlineIdx + 1;
      else if (periodIdx > chunkSize * 0.5) end = start + periodIdx + 2;
      else if (spaceIdx > chunkSize * 0.3) end = start + spaceIdx + 1;
    }

    const chunk = text.slice(start, end).trim();
    if (chunk.length > 20) {
      chunks.push(chunk);
    }
    start = end - overlap;
  }
  return chunks;
}

// --- Collection Operations ---

async function getOrCreateCollection(name) {
  const c = getClient();
  return await c.getOrCreateCollection({ name });
}

async function indexChunks(collectionName, chunks, metadata = {}) {
  const collection = await getOrCreateCollection(COLLECTION_NAME);
  if (chunks.length === 0) return { indexed: 0 };

  // Generate embeddings
  const embeddings = await getEmbeddings(chunks);

  // Build IDs and metadata
  const source = metadata.source || 'unknown';
  const timestamp = new Date().toISOString();
  // Deterministic ID from source + chunk index (allows re-indexing same file)
  const sourceHash = source.replace(/[^a-zA-Z0-9]/g, '_').slice(-60);
  const baseId = `${sourceHash}-${Date.now()}`;

  // Determine category from collectionName mapping
  const category = Object.entries(COLLECTIONS).find(([, v]) => v === collectionName)?.[0]
    || Object.keys(COLLECTIONS).find(k => COLLECTIONS[k] === COLLECTION_NAME && metadata.category === k)
    || metadata.category || 'docs';

  const ids = chunks.map((_, i) => `${baseId}-${i}`);
  const metadatas = chunks.map((_, i) => ({
    source,
    category,
    chunk_index: i,
    total_chunks: chunks.length,
    indexed_at: timestamp,
    ...metadata,
  }));

  // Clean metadata (Chroma only accepts string/number/boolean)
  const cleanMetadatas = metadatas.map(m => {
    const clean = {};
    for (const [k, v] of Object.entries(m)) {
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        clean[k] = v;
      }
    }
    return clean;
  });

  // Add in batches (Chroma has limits)
  const BATCH_SIZE = 40;
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const end = Math.min(i + BATCH_SIZE, chunks.length);
    await collection.add({
      ids: ids.slice(i, end),
      embeddings: embeddings.slice(i, end),
      documents: chunks.slice(i, end),
      metadatas: cleanMetadatas.slice(i, end),
    });
  }

  console.log(`Indexed ${chunks.length} chunks [${category}] (source: ${source})`);
  return { indexed: chunks.length, collection: COLLECTION_NAME, category };
}

// --- File Indexing ---

async function indexFile(filePath, collectionName, metadata = {}) {
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);

  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();

  // Skip binary files
  if (['.png', '.jpg', '.jpeg', '.gif', '.mp4', '.mp3', '.zip', '.pdf'].includes(ext)) {
    console.log(`Skipping binary file: ${fileName}`);
    return { indexed: 0, skipped: true };
  }

  const chunks = chunkText(content);
  return await indexChunks(collectionName, chunks, {
    source: filePath,
    file_name: fileName,
    file_ext: ext,
    file_size: content.length,
    ...metadata,
  });
}

// --- Bulk Indexing ---

async function indexDocs() {
  const docFiles = [
    { path: path.join(NAVADA_DIR, 'CLAUDE.md'), collection: COLLECTIONS.docs },
    { path: 'C:/Users/leeak/.claude/projects/C--Users-leeak/memory/MEMORY.md', collection: COLLECTIONS.docs },
    { path: path.join(NAVADA_DIR, 'Automation/telegram-bot.js'), collection: COLLECTIONS.code },
    { path: path.join(NAVADA_DIR, 'Automation/cloudflare-flux.js'), collection: COLLECTIONS.code },
    { path: path.join(NAVADA_DIR, 'Automation/cloudflare-r2.js'), collection: COLLECTIONS.code },
    { path: path.join(NAVADA_DIR, 'Automation/cloudflare-stream.js'), collection: COLLECTIONS.code },
    { path: path.join(NAVADA_DIR, 'Automation/email-service.js'), collection: COLLECTIONS.code },
    { path: path.join(NAVADA_DIR, 'Automation/morning-briefing.js'), collection: COLLECTIONS.code },
    { path: path.join(NAVADA_DIR, 'Automation/ai-news-mailer.js'), collection: COLLECTIONS.code },
    { path: path.join(NAVADA_DIR, 'Automation/job-hunter-apify.js'), collection: COLLECTIONS.code },
    { path: path.join(NAVADA_DIR, 'Automation/self-improve.js'), collection: COLLECTIONS.code },
    { path: path.join(NAVADA_DIR, 'LeadPipeline/prospect-pipeline.js'), collection: COLLECTIONS.code },
    { path: path.join(NAVADA_DIR, 'LeadPipeline/outreach.js'), collection: COLLECTIONS.code },
    { path: path.join(NAVADA_DIR, 'Automation/weekly-report.js'), collection: COLLECTIONS.code },
  ];

  // Also index memory topic files
  const memoryDir = 'C:/Users/leeak/.claude/projects/C--Users-leeak/memory';
  if (fs.existsSync(memoryDir)) {
    const memFiles = fs.readdirSync(memoryDir).filter(f => f.endsWith('.md'));
    for (const f of memFiles) {
      if (!docFiles.some(d => d.path.endsWith(f))) {
        docFiles.push({ path: path.join(memoryDir, f), collection: COLLECTIONS.docs });
      }
    }
  }

  let total = 0;
  for (const doc of docFiles) {
    try {
      if (fs.existsSync(doc.path)) {
        const result = await indexFile(doc.path, doc.collection);
        total += result.indexed;
      } else {
        console.log(`Skipping (not found): ${doc.path}`);
      }
    } catch (err) {
      console.error(`Error indexing ${doc.path}: ${err.message}`);
    }
  }

  console.log(`\nTotal indexed: ${total} chunks across docs + code collections`);
  return { total };
}

async function indexLogs() {
  const logDir = path.join(NAVADA_DIR, 'Automation/logs');
  if (!fs.existsSync(logDir)) return { total: 0 };

  const logFiles = fs.readdirSync(logDir)
    .filter(f => f.endsWith('.log') || f.endsWith('.jsonl'))
    .sort()
    .slice(-10); // Last 10 log files

  let total = 0;
  for (const f of logFiles) {
    try {
      const filePath = path.join(logDir, f);
      const stat = fs.statSync(filePath);
      // Only index files modified in last 7 days and under 500KB
      const ageMs = Date.now() - stat.mtimeMs;
      if (ageMs > 7 * 24 * 3600 * 1000 || stat.size > 500 * 1024) continue;

      const result = await indexFile(filePath, COLLECTIONS.logs, { log_type: path.extname(f) });
      total += result.indexed;
    } catch (err) {
      console.error(`Error indexing log ${f}: ${err.message}`);
    }
  }

  console.log(`\nTotal log chunks indexed: ${total}`);
  return { total };
}

// --- Inline Indexing (for live data) ---

async function indexText(text, source, collectionName = COLLECTIONS.comms, metadata = {}) {
  const chunks = chunkText(text);
  return await indexChunks(collectionName, chunks, { source, ...metadata });
}

// --- Search ---

async function search(query, opts = {}) {
  const nResults = opts.nResults || 5;
  const category = opts.category || null; // 'docs', 'logs', 'code', 'comms'

  // Get query embedding
  const [queryEmbedding] = await getEmbeddings([query]);

  try {
    const c = getClient();
    const collection = await c.getCollection({ name: COLLECTION_NAME });
    const count = await collection.count();
    if (count === 0) return [];

    const queryOpts = {
      queryEmbeddings: [queryEmbedding],
      nResults: Math.min(nResults, count),
    };

    // Filter by category if specified
    if (category) {
      queryOpts.where = { category };
    }

    const results = await collection.query(queryOpts);

    const allResults = [];
    if (results.documents?.[0]) {
      for (let i = 0; i < results.documents[0].length; i++) {
        allResults.push({
          document: results.documents[0][i],
          metadata: results.metadatas?.[0]?.[i] || {},
          distance: results.distances?.[0]?.[i] || 0,
        });
      }
    }

    return allResults;
  } catch (err) {
    console.error(`Search error: ${err.message}`);
    return [];
  }
}

// --- Status ---

async function status() {
  const c = getClient();
  try {
    const collection = await c.getCollection({ name: COLLECTION_NAME });
    const count = await collection.count();
    console.log(`ChromaDB Cloud | Database: ${CHROMA_DATABASE}`);
    console.log(`Collection: ${COLLECTION_NAME} | Total chunks: ${count}`);

    // Sample to show category breakdown (respect free tier limits)
    if (count > 0) {
      try {
        const sample = await collection.get({ limit: Math.min(count, 100), include: ['metadatas'] });
        const categories = {};
        for (const m of (sample.metadatas || [])) {
          const cat = m?.category || 'unknown';
          categories[cat] = (categories[cat] || 0) + 1;
        }
        console.log('\nBy category (sampled):');
        for (const [cat, cnt] of Object.entries(categories).sort((a, b) => b[1] - a[1])) {
          console.log(`  ${cat}: ~${cnt}+ chunks`);
        }
      } catch (e) {
        console.log(`\n(Category breakdown unavailable: ${e.message.split('.')[0]})`);
      }
    }

    return { collection: COLLECTION_NAME, count };
  } catch (err) {
    console.error(`Status error: ${err.message}`);
    return { collection: COLLECTION_NAME, count: 0, error: err.message };
  }
}

// --- CLI ---
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log('NAVADA ChromaDB RAG');
    console.log('Usage:');
    console.log('  node chroma-rag.js status');
    console.log('  node chroma-rag.js index-docs');
    console.log('  node chroma-rag.js index-logs');
    console.log('  node chroma-rag.js index-file <path> [--collection navada-docs]');
    console.log('  node chroma-rag.js search "query" [--n 5] [--collection navada-docs]');
    process.exit(0);
  }

  const flagVal = (flag) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : undefined; };

  const run = async () => {
    try {
      switch (command) {
        case 'status':
          await status();
          break;
        case 'index-docs':
          await indexDocs();
          break;
        case 'index-logs':
          await indexLogs();
          break;
        case 'index-file': {
          const filePath = args[1];
          if (!filePath) { console.error('Provide file path'); process.exit(1); }
          const col = flagVal('--collection') || COLLECTIONS.docs;
          await indexFile(filePath, col);
          break;
        }
        case 'search': {
          const query = args[1];
          if (!query) { console.error('Provide search query'); process.exit(1); }
          const n = parseInt(flagVal('--n') || '5');
          const col = flagVal('--collection') || null;
          const results = await search(query, { nResults: n, collection: col });
          if (results.length === 0) {
            console.log('No results found.');
          } else {
            console.log(`Found ${results.length} results:\n`);
            for (const r of results) {
              const src = r.metadata.source || r.metadata.file_name || 'unknown';
              console.log(`[${r.collection}] (dist: ${r.distance.toFixed(4)}) ${src}`);
              console.log(`  ${r.document.slice(0, 200)}...`);
              console.log();
            }
          }
          break;
        }
        default:
          console.error(`Unknown command: ${command}`);
          process.exit(1);
      }
    } catch (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  };

  run();
}

module.exports = {
  getClient,
  getEmbeddings,
  chunkText,
  indexFile,
  indexText,
  indexDocs,
  indexLogs,
  search,
  status,
  COLLECTIONS,
};
