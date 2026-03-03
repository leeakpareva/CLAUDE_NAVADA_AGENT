#!/usr/bin/env node
/**
 * Cloudflare Stream - Video Management
 * Upload, list, serve, and manage videos via Cloudflare Stream API.
 *
 * Usage:
 *   node cloudflare-stream.js list
 *   node cloudflare-stream.js upload <file-or-url> [--name "Video Title"]
 *   node cloudflare-stream.js info <videoId>
 *   node cloudflare-stream.js delete <videoId>
 *   node cloudflare-stream.js url <videoId>
 *   node cloudflare-stream.js embed <videoId>
 *
 * Called programmatically:
 *   const { listVideos, uploadFromUrl, getVideo } = require('./cloudflare-stream');
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const STREAM_SUBDOMAIN = process.env.CLOUDFLARE_STREAM_SUBDOMAIN;
const API_BASE = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream`;

const headers = {
  Authorization: `Bearer ${API_TOKEN}`,
  'Content-Type': 'application/json',
};

function checkConfig() {
  if (!ACCOUNT_ID || !API_TOKEN) {
    throw new Error('Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN in .env');
  }
}

/**
 * Upload a video from a URL (YouTube, direct link, etc.)
 */
async function uploadFromUrl(url, meta = {}) {
  checkConfig();
  const body = {
    url,
    meta: {
      name: meta.name || path.basename(url).split('?')[0] || 'Untitled',
      ...meta,
    },
  };

  const res = await axios.post(API_BASE, body, { headers });
  const video = res.data.result;
  console.log(`Upload started: ${video.uid}`);
  console.log(`Status: ${video.status?.state || 'queued'}`);
  console.log(`Name: ${video.meta?.name || 'Untitled'}`);
  return video;
}

/**
 * Upload a local video file via direct upload (two-step: get upload URL, then PUT)
 */
async function uploadVideo(filePath, meta = {}) {
  checkConfig();
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const fileSize = fs.statSync(filePath).size;
  const name = meta.name || path.basename(filePath);

  // Step 1: Request a direct upload URL
  const initRes = await axios.post(`${API_BASE}/direct_upload`, {
    maxDurationSeconds: 3600,
    metadata: { name, ...meta },
  }, { headers });

  const { uploadURL, uid } = initRes.data.result;

  // Step 2: Upload the file
  const FormData = require('form-data');
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));

  await axios.post(uploadURL, form, {
    headers: {
      ...form.getHeaders(),
    },
    maxContentLength: 500 * 1024 * 1024,
    maxBodyLength: 500 * 1024 * 1024,
    timeout: 600000,
  });

  console.log(`Upload complete: ${uid}`);
  console.log(`Name: ${name}`);
  console.log(`Size: ${(fileSize / 1024 / 1024).toFixed(1)} MB`);
  return { uid, name };
}

/**
 * List all videos
 */
async function listVideos() {
  checkConfig();
  const res = await axios.get(API_BASE, { headers });
  const videos = res.data.result || [];

  if (videos.length === 0) {
    console.log('No videos found.');
    return [];
  }

  console.log(`Found ${videos.length} video(s):\n`);
  for (const v of videos) {
    const duration = v.duration ? `${Math.round(v.duration)}s` : 'processing';
    const status = v.status?.state || 'unknown';
    console.log(`  ${v.uid} | ${v.meta?.name || 'Untitled'} | ${duration} | ${status}`);
  }
  return videos;
}

/**
 * Get a single video's metadata
 */
async function getVideo(videoId) {
  checkConfig();
  const res = await axios.get(`${API_BASE}/${videoId}`, { headers });
  const v = res.data.result;
  console.log(`Video: ${v.uid}`);
  console.log(`Name: ${v.meta?.name || 'Untitled'}`);
  console.log(`Status: ${v.status?.state || 'unknown'}`);
  console.log(`Duration: ${v.duration ? Math.round(v.duration) + 's' : 'N/A'}`);
  console.log(`Size: ${v.size ? (v.size / 1024 / 1024).toFixed(1) + ' MB' : 'N/A'}`);
  console.log(`Created: ${v.created || 'N/A'}`);
  console.log(`Thumbnail: ${v.thumbnail || 'N/A'}`);
  console.log(`Playback: ${getPlaybackUrl(videoId)}`);
  return v;
}

/**
 * Delete a video
 */
async function deleteVideo(videoId) {
  checkConfig();
  await axios.delete(`${API_BASE}/${videoId}`, { headers });
  console.log(`Deleted video: ${videoId}`);
  return { success: true, videoId };
}

/**
 * Get iframe embed HTML for a video
 */
function getEmbedUrl(videoId) {
  const src = `https://${STREAM_SUBDOMAIN}/${videoId}/iframe`;
  const html = `<iframe src="${src}" style="border: none; width: 100%; height: 100%; position: absolute; top: 0; left: 0;" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
  console.log(`Embed URL: ${src}`);
  console.log(`HTML:\n${html}`);
  return { src, html };
}

/**
 * Get direct HLS playback URL
 */
function getPlaybackUrl(videoId) {
  return `https://${STREAM_SUBDOMAIN}/${videoId}/manifest/video.m3u8`;
}

/**
 * Create a time-limited signed URL (requires signing keys set up in Cloudflare dashboard)
 */
async function createSignedUrl(videoId, ttlSeconds = 3600) {
  checkConfig();
  // Get signing keys
  const keyRes = await axios.get(`${API_BASE}/keys`, { headers });
  const keys = keyRes.data.result || [];

  if (keys.length === 0) {
    // Create a signing key
    const createRes = await axios.post(`${API_BASE}/keys`, {}, { headers });
    const key = createRes.data.result;
    console.log(`Created signing key: ${key.id}`);
  }

  // Use token-based signed URL
  const tokenRes = await axios.post(`${API_BASE}/${videoId}/token`, {
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    accessRules: [{ type: 'any' }],
  }, { headers });

  const token = tokenRes.data.result?.token;
  const signedUrl = `https://${STREAM_SUBDOMAIN}/${token}/manifest/video.m3u8`;
  console.log(`Signed URL (expires in ${ttlSeconds}s): ${signedUrl}`);
  return signedUrl;
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log('Cloudflare Stream CLI');
    console.log('Usage:');
    console.log('  node cloudflare-stream.js list');
    console.log('  node cloudflare-stream.js upload <file-or-url> [--name "Title"]');
    console.log('  node cloudflare-stream.js info <videoId>');
    console.log('  node cloudflare-stream.js delete <videoId>');
    console.log('  node cloudflare-stream.js url <videoId>');
    console.log('  node cloudflare-stream.js embed <videoId>');
    process.exit(0);
  }

  // Parse --name flag
  const nameIdx = args.indexOf('--name');
  const name = nameIdx !== -1 ? args[nameIdx + 1] : undefined;

  const run = async () => {
    try {
      switch (command) {
        case 'list':
          await listVideos();
          break;
        case 'upload': {
          const target = args[1];
          if (!target) { console.error('Provide a file path or URL'); process.exit(1); }
          if (target.startsWith('http://') || target.startsWith('https://')) {
            await uploadFromUrl(target, { name });
          } else {
            await uploadVideo(target, { name });
          }
          break;
        }
        case 'info':
          if (!args[1]) { console.error('Provide a video ID'); process.exit(1); }
          await getVideo(args[1]);
          break;
        case 'delete':
          if (!args[1]) { console.error('Provide a video ID'); process.exit(1); }
          await deleteVideo(args[1]);
          break;
        case 'url':
          if (!args[1]) { console.error('Provide a video ID'); process.exit(1); }
          console.log(getPlaybackUrl(args[1]));
          break;
        case 'embed':
          if (!args[1]) { console.error('Provide a video ID'); process.exit(1); }
          getEmbedUrl(args[1]);
          break;
        default:
          console.error(`Unknown command: ${command}`);
          process.exit(1);
      }
    } catch (err) {
      const errData = err.response?.data || err.message;
      console.error('Error:', JSON.stringify(errData, null, 2));
      process.exit(1);
    }
  };

  run();
}

module.exports = {
  uploadVideo,
  uploadFromUrl,
  listVideos,
  getVideo,
  deleteVideo,
  getEmbedUrl,
  getPlaybackUrl,
  createSignedUrl,
};
