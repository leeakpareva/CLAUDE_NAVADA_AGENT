#!/usr/bin/env node
/**
 * LinkedIn Post Publisher
 * Posts text (and optionally images) to your LinkedIn feed.
 *
 * Usage:
 *   node linkedin-post.js "Your post text here"
 *   node linkedin-post.js --file post.txt
 *   node linkedin-post.js --json '{"text":"Hello","visibility":"PUBLIC"}'
 *
 * Called programmatically:
 *   const { postToLinkedIn } = require('./linkedin-post');
 *   await postToLinkedIn({ text: "Hello world!" });
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const TOKEN_FILE = path.join(__dirname, '.linkedin-token.json');

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

async function postToLinkedIn({ text, visibility = 'PUBLIC', imageUrl = null }) {
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

  // If image URL provided, add as article share
  if (imageUrl) {
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
    console.log(`Text preview: ${text.substring(0, 100)}...`);

    return { success: true, postId, name: token.name };
  } catch (err) {
    const errData = err.response?.data || err.message;
    console.error('Post failed:', JSON.stringify(errData, null, 2));
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
    process.exit(0);
  }

  let text, visibility, imageUrl;

  if (args[0] === '--file') {
    text = fs.readFileSync(args[1], 'utf8').trim();
  } else if (args[0] === '--json') {
    const data = JSON.parse(args[1]);
    text = data.text;
    visibility = data.visibility;
    imageUrl = data.imageUrl;
  } else {
    text = args.join(' ');
  }

  postToLinkedIn({ text, visibility, imageUrl }).then((result) => {
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = { postToLinkedIn, getToken };
