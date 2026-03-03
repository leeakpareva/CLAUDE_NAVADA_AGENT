#!/usr/bin/env node
/**
 * Cloudflare R2 Object Storage - S3-compatible API
 * Upload, list, download, delete files in R2 buckets.
 *
 * Usage:
 *   node cloudflare-r2.js buckets
 *   node cloudflare-r2.js upload <file> [--key path/file.pdf] [--bucket navada-assets]
 *   node cloudflare-r2.js list [--prefix docs/] [--bucket navada-assets]
 *   node cloudflare-r2.js delete <key> [--bucket navada-assets]
 *   node cloudflare-r2.js url <key> [--bucket navada-assets]
 *
 * Programmatic:
 *   const r2 = require('./cloudflare-r2');
 *   await r2.uploadFile('file.pdf', 'docs/file.pdf');
 */

require('dotenv').config({ path: __dirname + '/.env' });
const fs = require('fs');
const path = require('path');
const https = require('https');

// Cloudflare API (for bucket management)
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CF_API = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}`;

// R2 S3-compatible API (for object operations)
const R2_ACCESS_KEY = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const R2_SECRET_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const R2_ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT || `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`;
const DEFAULT_BUCKET = process.env.CLOUDFLARE_R2_BUCKET || 'navada-assets';

let s3Client = null;

function getS3Client() {
  if (s3Client) return s3Client;
  if (!R2_ACCESS_KEY || !R2_SECRET_KEY) {
    throw new Error('Missing CLOUDFLARE_R2_ACCESS_KEY_ID or CLOUDFLARE_R2_SECRET_ACCESS_KEY in .env');
  }
  const { S3Client } = require('@aws-sdk/client-s3');
  s3Client = new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY,
      secretAccessKey: R2_SECRET_KEY,
    },
  });
  return s3Client;
}

function cfHeaders() {
  return {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

function cfRequest(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${CF_API}${urlPath}`);
    const opts = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: cfHeaders(),
    };

    const req = https.request(opts, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try {
          const json = JSON.parse(Buffer.concat(chunks).toString());
          if (!json.success) reject(new Error(json.errors?.[0]?.message || 'CF API error'));
          else resolve(json.result);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// --- Bucket Operations (Cloudflare API) ---

async function listBuckets() {
  if (!ACCOUNT_ID || !API_TOKEN) throw new Error('Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN');
  const result = await cfRequest('GET', '/r2/buckets');
  const buckets = result.buckets || [];
  console.log(`R2 Buckets (${buckets.length}):`);
  for (const b of buckets) {
    console.log(`  ${b.name} | Created: ${b.creation_date || 'N/A'}`);
  }
  return buckets;
}

async function createBucket(name) {
  if (!ACCOUNT_ID || !API_TOKEN) throw new Error('Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN');
  const result = await cfRequest('PUT', `/r2/buckets/${name}`, {});
  console.log(`Bucket created: ${name}`);
  return result;
}

async function deleteBucket(name) {
  if (!ACCOUNT_ID || !API_TOKEN) throw new Error('Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN');
  await cfRequest('DELETE', `/r2/buckets/${name}`);
  console.log(`Bucket deleted: ${name}`);
}

async function ensureBucket(name) {
  try {
    const buckets = await listBuckets();
    if (buckets.some(b => b.name === name)) return;
    await createBucket(name);
  } catch (err) {
    // Bucket may already exist
    if (!err.message.includes('already exists')) throw err;
  }
}

// --- Object Operations (S3 API) ---

async function uploadFile(filePath, key, bucket = DEFAULT_BUCKET) {
  const { PutObjectCommand } = require('@aws-sdk/client-s3');
  const client = getS3Client();

  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
  }));

  const size = (fileBuffer.length / 1024 / 1024).toFixed(2);
  console.log(`Uploaded: ${key} (${size} MB) to ${bucket}`);
  return { key, bucket, size: fileBuffer.length, contentType };
}

async function uploadBuffer(buffer, key, contentType = 'application/octet-stream', bucket = DEFAULT_BUCKET) {
  const { PutObjectCommand } = require('@aws-sdk/client-s3');
  const client = getS3Client();

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));

  console.log(`Uploaded buffer: ${key} (${(buffer.length / 1024).toFixed(1)} KB) to ${bucket}`);
  return { key, bucket, size: buffer.length, contentType };
}

async function listObjects(prefix = '', bucket = DEFAULT_BUCKET) {
  const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
  const client = getS3Client();

  const params = { Bucket: bucket, MaxKeys: 100 };
  if (prefix) params.Prefix = prefix;

  const result = await client.send(new ListObjectsV2Command(params));
  const objects = result.Contents || [];

  console.log(`Objects in ${bucket}/${prefix || ''} (${objects.length}):`);
  for (const obj of objects) {
    const size = (obj.Size / 1024 / 1024).toFixed(2);
    console.log(`  ${obj.Key} | ${size} MB | ${obj.LastModified?.toISOString() || 'N/A'}`);
  }
  return objects;
}

async function getObject(key, bucket = DEFAULT_BUCKET) {
  const { GetObjectCommand } = require('@aws-sdk/client-s3');
  const client = getS3Client();

  const result = await client.send(new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  }));

  const chunks = [];
  for await (const chunk of result.Body) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  console.log(`Downloaded: ${key} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
  return { buffer, contentType: result.ContentType, size: buffer.length };
}

async function deleteObject(key, bucket = DEFAULT_BUCKET) {
  const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
  const client = getS3Client();

  await client.send(new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  }));

  console.log(`Deleted: ${key} from ${bucket}`);
  return { key, bucket };
}

function getPublicUrl(key, bucket = DEFAULT_BUCKET) {
  // R2 public access URL (requires public access enabled on bucket)
  return `https://${bucket}.${ACCOUNT_ID}.r2.dev/${key}`;
}

const MIME_TYPES = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.csv': 'text/csv',
  '.zip': 'application/zip',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log('Cloudflare R2 Object Storage CLI');
    console.log('Usage:');
    console.log('  node cloudflare-r2.js buckets');
    console.log('  node cloudflare-r2.js create-bucket <name>');
    console.log('  node cloudflare-r2.js upload <file> [--key path/file.pdf] [--bucket navada-assets]');
    console.log('  node cloudflare-r2.js list [--prefix docs/] [--bucket navada-assets]');
    console.log('  node cloudflare-r2.js delete <key> [--bucket navada-assets]');
    console.log('  node cloudflare-r2.js url <key> [--bucket navada-assets]');
    process.exit(0);
  }

  // Parse flags
  const flagIdx = (flag) => args.indexOf(flag);
  const flagVal = (flag) => { const i = flagIdx(flag); return i !== -1 ? args[i + 1] : undefined; };
  const bucket = flagVal('--bucket') || DEFAULT_BUCKET;

  const run = async () => {
    try {
      switch (command) {
        case 'buckets':
          await listBuckets();
          break;
        case 'create-bucket':
          if (!args[1]) { console.error('Provide bucket name'); process.exit(1); }
          await createBucket(args[1]);
          break;
        case 'upload': {
          const filePath = args[1];
          if (!filePath) { console.error('Provide file path'); process.exit(1); }
          const key = flagVal('--key') || path.basename(filePath);
          await ensureBucket(bucket);
          await uploadFile(filePath, key, bucket);
          break;
        }
        case 'list': {
          const prefix = flagVal('--prefix') || '';
          await listObjects(prefix, bucket);
          break;
        }
        case 'download': {
          if (!args[1]) { console.error('Provide object key'); process.exit(1); }
          const outPath = flagVal('--output') || path.basename(args[1]);
          const { buffer } = await getObject(args[1], bucket);
          fs.writeFileSync(outPath, buffer);
          console.log(`Saved to: ${outPath}`);
          break;
        }
        case 'delete':
          if (!args[1]) { console.error('Provide object key'); process.exit(1); }
          await deleteObject(args[1], bucket);
          break;
        case 'url':
          if (!args[1]) { console.error('Provide object key'); process.exit(1); }
          console.log(getPublicUrl(args[1], bucket));
          break;
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
  listBuckets,
  createBucket,
  deleteBucket,
  ensureBucket,
  uploadFile,
  uploadBuffer,
  listObjects,
  getObject,
  deleteObject,
  getPublicUrl,
};
