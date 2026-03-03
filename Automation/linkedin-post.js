#!/usr/bin/env node
/**
 * LinkedIn Post Publisher
 * Posts text (and optionally images/videos) to your LinkedIn feed.
 *
 * Usage:
 *   node linkedin-post.js "Your post text here"
 *   node linkedin-post.js --file post.txt
 *   node linkedin-post.js --json '{"text":"Hello","visibility":"PUBLIC"}'
 *   node linkedin-post.js --video /path/to/video.mp4 "Post caption"
 *
 * Called programmatically:
 *   const { postToLinkedIn } = require('./linkedin-post');
 *   await postToLinkedIn({ text: "Hello world!" });
 *   await postWithVideo({ text: "Caption", videoPath: "/path/to/video.mp4" });
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const TOKEN_FILE = path.join(__dirname, '.linkedin-token.json');
const LI_API = 'https://api.linkedin.com';
const LI_VERSION = '202503';

function getToken() {
  if (!fs.existsSync(TOKEN_FILE)) {
    throw new Error('No LinkedIn token found. Run: node linkedin-auth.js');
  }
  const data = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));

  if (Date.now() > data.expires_at) {
    throw new Error('LinkedIn token expired. Run: node linkedin-auth.js');
  }

  return data;
}

/**
 * Upload a local image file to LinkedIn and return the asset URN
 */
async function uploadImage(filePath, token) {
  // Step 1: Register the upload
  const registerBody = {
    registerUploadRequest: {
      recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
      owner: token.person_urn,
      serviceRelationships: [
        { relationshipType: 'OWNER', identifier: 'urn:li:userGeneratedContent' },
      ],
    },
  };

  const regRes = await axios.post(
    'https://api.linkedin.com/v2/assets?action=registerUpload',
    registerBody,
    {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const uploadUrl =
    regRes.data.value.uploadMechanism[
      'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
    ].uploadUrl;
  const asset = regRes.data.value.asset;

  // Step 2: Upload the binary image
  const imageData = fs.readFileSync(filePath);
  await axios.put(uploadUrl, imageData, {
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      'Content-Type': 'image/png',
    },
    maxContentLength: 50 * 1024 * 1024,
    maxBodyLength: 50 * 1024 * 1024,
  });

  console.log(`Uploaded image: ${path.basename(filePath)} -> ${asset}`);
  return asset;
}

async function postToLinkedIn({ text, visibility = 'PUBLIC', imageUrl = null, images = null }) {
  const token = getToken();

  const postBody = {
    author: token.person_urn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text },
        shareMediaCategory: 'NONE',
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': visibility,
    },
  };

  // Native image upload: array of local file paths
  if (images && images.length > 0) {
    console.log(`Uploading ${images.length} image(s) to LinkedIn...`);
    const mediaItems = [];
    for (const imgPath of images) {
      const asset = await uploadImage(imgPath, token);
      mediaItems.push({
        status: 'READY',
        media: asset,
        description: { text: path.basename(imgPath, path.extname(imgPath)) },
      });
    }
    postBody.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'IMAGE';
    postBody.specificContent['com.linkedin.ugc.ShareContent'].media = mediaItems;
  }
  // Legacy: external article URL
  else if (imageUrl) {
    postBody.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'ARTICLE';
    postBody.specificContent['com.linkedin.ugc.ShareContent'].media = [
      {
        status: 'READY',
        originalUrl: imageUrl,
      },
    ];
  }

  try {
    const res = await axios.post('https://api.linkedin.com/v2/ugcPosts', postBody, {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });

    const postId = res.headers['x-restli-id'] || res.data.id || 'unknown';
    console.log(`Posted successfully!`);
    console.log(`Post ID: ${postId}`);
    console.log(`Author: ${token.name}`);
    console.log(`Visibility: ${visibility}`);
    console.log(`Images: ${images ? images.length : 0}`);
    console.log(`Text preview: ${text.substring(0, 100)}...`);

    return { success: true, postId, name: token.name };
  } catch (err) {
    const errData = err.response?.data || err.message;
    console.error('Post failed:', JSON.stringify(errData, null, 2));
    return { success: false, error: errData };
  }
}

/**
 * Upload a local video file to LinkedIn via the modern Videos API
 * Returns the video URN once processing completes
 */
async function uploadVideo(videoPath, token) {
  const fileSize = fs.statSync(videoPath).size;
  const headers = {
    Authorization: `Bearer ${token.access_token}`,
    'Content-Type': 'application/json',
    'X-Restli-Protocol-Version': '2.0.0',
    'LinkedIn-Version': LI_VERSION,
  };

  // Initialize upload
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

  // Upload binary
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

  // Finalize upload
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

  // Poll until AVAILABLE
  const encodedUrn = encodeURIComponent(videoUrn);
  let status = 'PROCESSING';
  let attempts = 0;
  while (status !== 'AVAILABLE' && attempts < 60) {
    await new Promise(r => setTimeout(r, 3000));
    attempts++;
    try {
      const pollRes = await axios.get(`${LI_API}/rest/videos/${encodedUrn}`, { headers });
      status = pollRes.data.status;
      if (status === 'PROCESSING_FAILED') throw new Error('LinkedIn video processing failed');
    } catch (err) {
      if (err.message === 'LinkedIn video processing failed') throw err;
    }
  }

  if (status !== 'AVAILABLE') throw new Error(`Video not available after polling`);
  console.log(`Video uploaded: ${videoUrn}`);
  return videoUrn;
}

/**
 * Post to LinkedIn with a video attachment (modern Posts API)
 */
async function postWithVideo({ text, videoPath, visibility = 'PUBLIC' }) {
  const token = getToken();
  const videoUrn = await uploadVideo(videoPath, token);

  const headers = {
    Authorization: `Bearer ${token.access_token}`,
    'Content-Type': 'application/json',
    'X-Restli-Protocol-Version': '2.0.0',
    'LinkedIn-Version': LI_VERSION,
  };

  const postBody = {
    author: token.person_urn,
    commentary: text,
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

  try {
    const res = await axios.post(`${LI_API}/rest/posts`, postBody, { headers });
    const postId = res.headers['x-restli-id'] || res.headers['x-linkedin-id'] || 'posted';
    console.log(`Video post successful! ID: ${postId}`);
    return { success: true, postId, name: token.name, videoUrn };
  } catch (err) {
    const errData = err.response?.data || err.message;
    console.error('Video post failed:', JSON.stringify(errData, null, 2));
    return { success: false, error: errData };
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node linkedin-post.js "Your post text"');
    console.log('  node linkedin-post.js --file post.txt');
    console.log('  node linkedin-post.js --json \'{"text":"Hello","visibility":"PUBLIC"}\'');
    console.log('  node linkedin-post.js --video /path/to/video.mp4 "Post caption"');
    process.exit(0);
  }

  let text, visibility, imageUrl;

  if (args[0] === '--video') {
    const videoPath = args[1];
    text = args.slice(2).join(' ') || 'Check out this video!';
    postWithVideo({ text, videoPath }).then(result => {
      process.exit(result.success ? 0 : 1);
    });
  } else if (args[0] === '--file') {
    text = fs.readFileSync(args[1], 'utf8').trim();
    postToLinkedIn({ text, visibility, imageUrl }).then((result) => {
      process.exit(result.success ? 0 : 1);
    });
  } else if (args[0] === '--json') {
    const data = JSON.parse(args[1]);
    text = data.text;
    visibility = data.visibility;
    imageUrl = data.imageUrl;
    postToLinkedIn({ text, visibility, imageUrl }).then((result) => {
      process.exit(result.success ? 0 : 1);
    });
  } else {
    text = args.join(' ');
    postToLinkedIn({ text, visibility, imageUrl }).then((result) => {
      process.exit(result.success ? 0 : 1);
    });
  }
}

module.exports = { postToLinkedIn, postWithVideo, uploadVideo, getToken };
