#!/usr/bin/env node
/**
 * NotebookLM → R2 Auto-Uploader
 * Watches the NotebookLM folder for new files and automatically uploads them
 * to Cloudflare R2 under the media/ prefix.
 *
 * Usage:
 *   node notebooklm-r2-watcher.js          # Watch mode (continuous)
 *   node notebooklm-r2-watcher.js --sync   # One-time sync of all files
 *
 * PM2: pm2 start notebooklm-r2-watcher.js --name notebooklm-watcher
 */

require('dotenv').config({ path: __dirname + '/.env' });
const fs = require('fs');
const path = require('path');
const https = require('https');

const WATCH_DIR = path.join(__dirname, '..', 'NotebookLM');
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const BUCKET = 'navada-assets';
const R2_PREFIX = 'media/';
const LOG_FILE = path.join(__dirname, 'logs', 'notebooklm-watcher.log');

// Track uploaded files to avoid duplicates
const UPLOADED_TRACKER = path.join(__dirname, 'kb', 'notebooklm-uploaded.json');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + '\n');
  } catch (e) { /* ignore */ }
}

function loadUploaded() {
  try {
    return JSON.parse(fs.readFileSync(UPLOADED_TRACKER, 'utf-8'));
  } catch {
    return {};
  }
}

function saveUploaded(data) {
  fs.mkdirSync(path.dirname(UPLOADED_TRACKER), { recursive: true });
  fs.writeFileSync(UPLOADED_TRACKER, JSON.stringify(data, null, 2));
}

function uploadToR2(filePath, key) {
  return new Promise((resolve, reject) => {
    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const MIME_TYPES = {
      '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
      '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp',
      '.json': 'application/json', '.txt': 'text/plain',
    };
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    const url = new URL(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET}/objects/${key}`
    );

    const opts = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length,
      },
    };

    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.success) {
            resolve({ key, size: fileBuffer.length, contentType });
          } else {
            reject(new Error(json.errors?.[0]?.message || 'Upload failed'));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${data.slice(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(300000, () => { req.destroy(); reject(new Error('Upload timeout')); });
    req.write(fileBuffer);
    req.end();
  });
}

async function processFile(filePath) {
  const filename = path.basename(filePath);
  const key = R2_PREFIX + filename;
  const stat = fs.statSync(filePath);
  const sizeMB = (stat.size / 1024 / 1024).toFixed(2);

  log(`Uploading: ${filename} (${sizeMB} MB)`);

  try {
    const result = await uploadToR2(filePath, key);
    log(`Uploaded: ${result.key} (${sizeMB} MB) to R2`);

    // Track upload
    const uploaded = loadUploaded();
    uploaded[filename] = {
      key: result.key,
      size: stat.size,
      uploaded_at: new Date().toISOString(),
      content_type: result.contentType,
    };
    saveUploaded(uploaded);

    return result;
  } catch (err) {
    log(`Upload FAILED: ${filename} - ${err.message}`);
    throw err;
  }
}

async function syncAll() {
  if (!fs.existsSync(WATCH_DIR)) {
    log(`Watch directory does not exist: ${WATCH_DIR}`);
    return;
  }

  const files = fs.readdirSync(WATCH_DIR).filter(f => {
    const ext = path.extname(f).toLowerCase();
    return ['.mp4', '.mp3', '.wav', '.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext);
  });

  if (files.length === 0) {
    log('No media files found in NotebookLM folder.');
    return;
  }

  const uploaded = loadUploaded();
  let count = 0;

  for (const file of files) {
    const filePath = path.join(WATCH_DIR, file);
    const stat = fs.statSync(filePath);

    // Skip if already uploaded and same size
    if (uploaded[file] && uploaded[file].size === stat.size) {
      log(`Skipping (already uploaded): ${file}`);
      continue;
    }

    try {
      await processFile(filePath);
      count++;
    } catch (err) {
      log(`Error processing ${file}: ${err.message}`);
    }
  }

  log(`Sync complete. ${count} new files uploaded, ${files.length - count} skipped.`);
}

function watch() {
  if (!fs.existsSync(WATCH_DIR)) {
    fs.mkdirSync(WATCH_DIR, { recursive: true });
    log(`Created watch directory: ${WATCH_DIR}`);
  }

  log(`Watching: ${WATCH_DIR}`);
  log('New media files will be auto-uploaded to R2 (media/ prefix)');

  // Debounce map to avoid duplicate events
  const pending = new Map();

  fs.watch(WATCH_DIR, { persistent: true }, (eventType, filename) => {
    if (!filename) return;

    const ext = path.extname(filename).toLowerCase();
    const mediaExts = ['.mp4', '.mp3', '.wav', '.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp'];
    if (!mediaExts.includes(ext)) return;

    // Debounce: wait 3 seconds after last change event
    if (pending.has(filename)) clearTimeout(pending.get(filename));

    pending.set(filename, setTimeout(async () => {
      pending.delete(filename);
      const filePath = path.join(WATCH_DIR, filename);

      if (!fs.existsSync(filePath)) {
        log(`File removed: ${filename} (skipping upload)`);
        return;
      }

      // Wait a bit more for file to finish writing
      const stat1 = fs.statSync(filePath);
      await new Promise(r => setTimeout(r, 2000));
      if (!fs.existsSync(filePath)) return;
      const stat2 = fs.statSync(filePath);

      if (stat1.size !== stat2.size) {
        log(`File still writing: ${filename} (will retry)`);
        return;
      }

      // Check if already uploaded same version
      const uploaded = loadUploaded();
      if (uploaded[filename] && uploaded[filename].size === stat2.size) {
        return; // Already uploaded
      }

      try {
        await processFile(filePath);
      } catch (err) {
        log(`Auto-upload failed: ${filename} - ${err.message}`);
      }
    }, 3000));
  });
}

// CLI
const args = process.argv.slice(2);
if (args.includes('--sync')) {
  log('Running one-time sync...');
  syncAll().catch(err => { log(`Sync error: ${err.message}`); process.exit(1); });
} else {
  // Watch mode: sync first, then watch for changes
  log('NotebookLM → R2 Auto-Uploader starting...');
  syncAll().then(() => watch()).catch(err => {
    log(`Startup error: ${err.message}`);
    process.exit(1);
  });
}
