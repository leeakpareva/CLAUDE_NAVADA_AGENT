#!/usr/bin/env node
/**
 * LinkedIn Video Post Publisher
 * Pipeline: Text -> TTS audio (OpenAI) -> Branded image (DALL-E 3) -> ffmpeg (MP4) -> LinkedIn Videos API -> Post
 *
 * Usage:
 *   node linkedin-video.js "Text to speak" "LinkedIn post caption"
 *   node linkedin-video.js "Text to speak" "Caption" --voice nova
 *   node linkedin-video.js "Text to speak" "Caption" --image /path/to/image.png
 *
 * Programmatic:
 *   const { postVideoToLinkedIn } = require('./linkedin-video');
 *   await postVideoToLinkedIn({ text: "Spoken words", commentary: "Post caption" });
 */

require('dotenv').config({ path: __dirname + '/.env' });
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { execFileSync } = require('child_process');
const { generateVoice } = require('./voice-service');
const { getToken } = require('./linkedin-post');

const VIDEO_DIR = path.join(__dirname, 'videos');
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(VIDEO_DIR)) fs.mkdirSync(VIDEO_DIR, { recursive: true });
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const FFMPEG = 'C:\\Users\\leeak\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.0.1-full_build\\bin\\ffmpeg.exe';

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const LI_API = 'https://api.linkedin.com';
const LI_VERSION = '202503';

// ---------------------------------------------------------------------------
// Step 1: Generate branded image via DALL-E 3
// ---------------------------------------------------------------------------
async function generateBrandedImage(topic) {
  const prompt = `Professional, modern LinkedIn banner image for a thought leadership video post about: "${topic}". ` +
    'Clean corporate design with subtle tech/AI elements, dark navy and electric blue gradient, ' +
    'abstract geometric patterns, no text overlay, no people, cinematic lighting, 16:9 landscape.';

  console.log('Generating branded image via DALL-E 3...');
  const res = await axios.post(
    'https://api.openai.com/v1/images/generations',
    {
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1792x1024',
      quality: 'standard',
      response_format: 'b64_json',
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 120000,
    }
  );

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const imagePath = path.join(SCREENSHOT_DIR, `linkedin-video-${timestamp}.png`);
  const buf = Buffer.from(res.data.data[0].b64_json, 'base64');
  fs.writeFileSync(imagePath, buf);
  console.log(`Image saved: ${imagePath} (${(buf.length / 1024).toFixed(1)}KB)`);
  return imagePath;
}

// ---------------------------------------------------------------------------
// Step 2: Combine image + audio into MP4 via ffmpeg
// ---------------------------------------------------------------------------
function createVideo(imagePath, audioPath) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outputPath = path.join(VIDEO_DIR, `linkedin-video-${timestamp}.mp4`);

  console.log('Creating video with ffmpeg...');
  const args = [
    '-y',
    '-loop', '1',
    '-i', imagePath,
    '-i', audioPath,
    '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
    '-c:v', 'libx264',
    '-tune', 'stillimage',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-pix_fmt', 'yuv420p',
    '-shortest',
    outputPath,
  ];

  execFileSync(FFMPEG, args, { stdio: 'pipe', timeout: 300000 });

  const stats = fs.statSync(outputPath);
  console.log(`Video created: ${outputPath} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
  return outputPath;
}

// ---------------------------------------------------------------------------
// Step 3: Upload video to LinkedIn Videos API
// ---------------------------------------------------------------------------
async function uploadVideo(videoPath, token) {
  const fileSize = fs.statSync(videoPath).size;
  const headers = {
    Authorization: `Bearer ${token.access_token}`,
    'Content-Type': 'application/json',
    'X-Restli-Protocol-Version': '2.0.0',
    'LinkedIn-Version': LI_VERSION,
  };

  // 3a: Initialize upload
  console.log('Initializing LinkedIn video upload...');
  const initRes = await axios.post(
    `${LI_API}/rest/videos?action=initializeUpload`,
    {
      initializeUploadRequest: {
        owner: token.person_urn,
        fileSizeBytes: fileSize,
        uploadCaptions: false,
        uploadThumbnail: false,
      },
    },
    { headers }
  );

  const { value } = initRes.data;
  const uploadUrl = value.uploadInstructions[0].uploadUrl;
  const videoUrn = value.video;
  console.log(`Video URN: ${videoUrn}`);

  // 3b: Upload binary
  console.log(`Uploading video (${(fileSize / 1024 / 1024).toFixed(2)}MB)...`);
  const videoData = fs.readFileSync(videoPath);
  const uploadRes = await axios.put(uploadUrl, videoData, {
    headers: {
      'Content-Type': 'application/octet-stream',
      Authorization: `Bearer ${token.access_token}`,
    },
    maxContentLength: 200 * 1024 * 1024,
    maxBodyLength: 200 * 1024 * 1024,
    timeout: 300000,
  });

  const etag = uploadRes.headers.etag || uploadRes.headers['etag'];
  console.log(`Upload complete. ETag: ${etag}`);

  // 3c: Finalize upload
  console.log('Finalizing video upload...');
  await axios.post(
    `${LI_API}/rest/videos?action=finalizeUpload`,
    {
      finalizeUploadRequest: {
        video: videoUrn,
        uploadToken: '',
        uploadedPartIds: [etag],
      },
    },
    { headers }
  );

  // 3d: Poll until video is AVAILABLE
  console.log('Waiting for video processing...');
  const encodedUrn = encodeURIComponent(videoUrn);
  let status = 'PROCESSING';
  let attempts = 0;
  const maxAttempts = 60; // 3 minutes max

  while (status !== 'AVAILABLE' && attempts < maxAttempts) {
    await new Promise(r => setTimeout(r, 3000));
    attempts++;
    try {
      const pollRes = await axios.get(
        `${LI_API}/rest/videos/${encodedUrn}`,
        { headers }
      );
      status = pollRes.data.status;
      console.log(`  Poll ${attempts}: ${status}`);
      if (status === 'PROCESSING_FAILED') {
        throw new Error('LinkedIn video processing failed');
      }
    } catch (err) {
      if (err.message === 'LinkedIn video processing failed') throw err;
      // Transient polling errors are OK, keep trying
      console.log(`  Poll ${attempts}: retrying...`);
    }
  }

  if (status !== 'AVAILABLE') {
    throw new Error(`Video not available after ${maxAttempts * 3}s. Last status: ${status}`);
  }

  console.log('Video is AVAILABLE on LinkedIn.');
  return videoUrn;
}

// ---------------------------------------------------------------------------
// Step 4: Create LinkedIn post with video
// ---------------------------------------------------------------------------
async function createVideoPost(videoUrn, commentary, token, visibility = 'PUBLIC') {
  const headers = {
    Authorization: `Bearer ${token.access_token}`,
    'Content-Type': 'application/json',
    'X-Restli-Protocol-Version': '2.0.0',
    'LinkedIn-Version': LI_VERSION,
  };

  const postBody = {
    author: token.person_urn,
    commentary,
    visibility,
    distribution: {
      feedDistribution: 'MAIN_FEED',
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    content: {
      media: {
        title: 'NAVADA Voice Note',
        id: videoUrn,
      },
    },
    lifecycleState: 'PUBLISHED',
    isReshareDisabledByAuthor: false,
  };

  console.log('Creating LinkedIn post with video...');
  const res = await axios.post(`${LI_API}/rest/posts`, postBody, { headers });

  const postId = res.headers['x-restli-id'] || res.headers['x-linkedin-id'] || 'posted';
  console.log(`Posted successfully! ID: ${postId}`);
  return postId;
}

// ---------------------------------------------------------------------------
// Main: Full pipeline
// ---------------------------------------------------------------------------
async function postVideoToLinkedIn({
  text,
  commentary,
  voice = 'onyx',
  image = null,
  visibility = 'PUBLIC',
}) {
  console.log('=== LinkedIn Video Post Pipeline ===');
  console.log(`Text (TTS): ${text.substring(0, 80)}...`);
  console.log(`Caption: ${commentary.substring(0, 80)}...`);
  console.log(`Voice: ${voice}`);

  // Step 1: Generate TTS audio
  console.log('\n--- Step 1: Generate TTS Audio ---');
  const audioPath = await generateVoice(text, voice);

  // Step 2: Get or generate branded image
  console.log('\n--- Step 2: Branded Image ---');
  let imagePath;
  if (image && fs.existsSync(image)) {
    imagePath = image;
    console.log(`Using provided image: ${imagePath}`);
  } else {
    // Extract a topic hint from the first sentence of text
    const topic = text.split(/[.!?]/)[0].trim();
    imagePath = await generateBrandedImage(topic);
  }

  // Step 3: Create MP4 video
  console.log('\n--- Step 3: Create Video ---');
  const videoPath = createVideo(imagePath, audioPath);

  // Step 4: Upload to LinkedIn
  console.log('\n--- Step 4: Upload to LinkedIn ---');
  const token = getToken();
  const videoUrn = await uploadVideo(videoPath, token);

  // Step 5: Create post
  console.log('\n--- Step 5: Create Post ---');
  const postId = await createVideoPost(videoUrn, commentary, token, visibility);

  console.log('\n=== Pipeline Complete ===');
  console.log(`Audio: ${audioPath}`);
  console.log(`Image: ${imagePath}`);
  console.log(`Video: ${videoPath}`);
  console.log(`LinkedIn Post: ${postId}`);
  console.log(`Author: ${token.name}`);

  return {
    success: true,
    postId,
    audioPath,
    imagePath,
    videoPath,
    videoUrn,
    author: token.name,
  };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage:');
    console.log('  node linkedin-video.js "Text to speak" "LinkedIn caption"');
    console.log('  node linkedin-video.js "Text" "Caption" --voice nova');
    console.log('  node linkedin-video.js "Text" "Caption" --image /path/to/image.png');
    process.exit(0);
  }

  const text = args[0];
  const commentary = args[1];
  let voice = 'onyx';
  let image = null;

  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--voice' && args[i + 1]) { voice = args[++i]; }
    if (args[i] === '--image' && args[i + 1]) { image = args[++i]; }
  }

  postVideoToLinkedIn({ text, commentary, voice, image })
    .then(result => {
      if (result.success) {
        console.log('\nVideo posted to LinkedIn successfully!');
        process.exit(0);
      }
    })
    .catch(err => {
      console.error('\nFailed:', err.response?.data || err.message);
      process.exit(1);
    });
}

module.exports = { postVideoToLinkedIn, uploadVideo, createVideoPost, generateBrandedImage, createVideo };
