#!/usr/bin/env node
/**
 * Cloudflare Workers AI - Flux Image Generation
 * Uses @cf/black-forest-labs/flux-2-klein-4b (free tier, no per-image cost).
 *
 * Usage:
 *   node cloudflare-flux.js "A futuristic server room"
 *   node cloudflare-flux.js "NAVADA logo" --width 1024 --height 1024
 *   node cloudflare-flux.js "NAVADA logo" --save output.png
 *   node cloudflare-flux.js "NAVADA logo" --r2
 *
 * Programmatic:
 *   const { generateImage, generateAndStore } = require('./cloudflare-flux');
 */

require('dotenv').config({ path: __dirname + '/.env' });
const fs = require('fs');
const path = require('path');
const https = require('https');
const FormData = require('form-data');

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const MODEL = '@cf/black-forest-labs/flux-2-klein-4b';
const API_URL = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${MODEL}`;
const OUTPUT_DIR = path.join(__dirname, 'uploads');

function checkConfig() {
  if (!ACCOUNT_ID || !API_TOKEN) {
    throw new Error('Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN in .env');
  }
}

/**
 * Generate an image using Cloudflare Workers AI Flux model.
 * Uses multipart/form-data as required by the Flux API.
 * @param {string} prompt - Image description
 * @param {Object} opts - { width, height, steps, savePath }
 * @returns {{ buffer: Buffer, filePath: string }}
 */
async function generateImage(prompt, opts = {}) {
  checkConfig();
  const width = opts.width || 1024;
  const height = opts.height || 1024;
  const steps = opts.steps || 8;

  // Build multipart form data
  const form = new FormData();
  form.append('prompt', prompt);
  form.append('width', String(width));
  form.append('height', String(height));
  form.append('steps', String(steps));

  const result = await new Promise((resolve, reject) => {
    const url = new URL(API_URL);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        ...form.getHeaders(),
      },
    }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const raw = Buffer.concat(chunks);
        const contentType = res.headers['content-type'] || '';

        // Workers AI returns raw image bytes when successful
        if (contentType.includes('image/')) {
          resolve({ imageBuffer: raw });
          return;
        }

        // Otherwise it returns JSON (error or base64)
        try {
          const json = JSON.parse(raw.toString());
          if (!json.success) {
            reject(new Error(json.errors?.[0]?.message || 'Workers AI request failed'));
            return;
          }
          if (json.result?.image) {
            resolve({ imageBuffer: Buffer.from(json.result.image, 'base64') });
            return;
          }
          reject(new Error('Unexpected response format: ' + raw.toString().slice(0, 200)));
        } catch (e) {
          // If parsing fails but we got substantial data, assume it's image bytes
          if (raw.length > 1000) {
            resolve({ imageBuffer: raw });
          } else {
            reject(new Error(`Failed to parse response: ${raw.toString().slice(0, 200)}`));
          }
        }
      });
    });
    req.on('error', reject);
    form.pipe(req);
  });

  // Save to file
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = opts.savePath || path.join(OUTPUT_DIR, `flux-${timestamp}.png`);
  const dir = path.dirname(fileName);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fileName, result.imageBuffer);

  console.log(`Image generated: ${fileName} (${(result.imageBuffer.length / 1024).toFixed(1)} KB)`);
  return { buffer: result.imageBuffer, filePath: fileName };
}

/**
 * Generate image and upload to R2.
 * @param {string} prompt - Image description
 * @param {Object} opts - { width, height, key, bucket }
 * @returns {{ filePath: string, r2Key: string, r2Url: string }}
 */
async function generateAndStore(prompt, opts = {}) {
  const { buffer, filePath } = await generateImage(prompt, opts);

  try {
    const r2 = require('./cloudflare-r2');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const key = opts.key || `images/flux-${timestamp}.png`;
    const bucket = opts.bucket || 'navada-assets';

    const result = await r2.uploadBuffer(buffer, key, 'image/png', bucket);
    const publicUrl = r2.getPublicUrl(key, bucket);
    console.log(`Uploaded to R2: ${key}`);
    console.log(`Public URL: ${publicUrl}`);
    return { filePath, r2Key: key, r2Url: publicUrl };
  } catch (err) {
    console.warn(`R2 upload failed (image saved locally): ${err.message}`);
    return { filePath, r2Key: null, r2Url: null };
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Cloudflare Flux Image Generator');
    console.log('Usage:');
    console.log('  node cloudflare-flux.js "<prompt>"');
    console.log('  node cloudflare-flux.js "<prompt>" --width 1024 --height 1024');
    console.log('  node cloudflare-flux.js "<prompt>" --save output.png');
    console.log('  node cloudflare-flux.js "<prompt>" --r2');
    process.exit(0);
  }

  // Parse args
  const prompt = args.find(a => !a.startsWith('--'));
  const widthIdx = args.indexOf('--width');
  const heightIdx = args.indexOf('--height');
  const saveIdx = args.indexOf('--save');
  const useR2 = args.includes('--r2');

  const opts = {};
  if (widthIdx !== -1) opts.width = parseInt(args[widthIdx + 1]);
  if (heightIdx !== -1) opts.height = parseInt(args[heightIdx + 1]);
  if (saveIdx !== -1) opts.savePath = args[saveIdx + 1];

  if (!prompt) {
    console.error('Provide a prompt in quotes');
    process.exit(1);
  }

  const run = async () => {
    try {
      if (useR2) {
        await generateAndStore(prompt, opts);
      } else {
        await generateImage(prompt, opts);
      }
    } catch (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  };

  run();
}

module.exports = { generateImage, generateAndStore };
