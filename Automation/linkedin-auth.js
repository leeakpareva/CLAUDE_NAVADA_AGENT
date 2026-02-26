#!/usr/bin/env node
/**
 * LinkedIn OAuth2 Authorization Flow
 * Run once to get access token, then use linkedin-post.js to post.
 *
 * Setup:
 * 1. Go to https://www.linkedin.com/developers/apps and create an app
 * 2. Under Products, request "Share on LinkedIn" and "Sign In with LinkedIn using OpenID Connect"
 * 3. Under Auth tab, add redirect URL: http://localhost:3456/callback
 * 4. Copy Client ID and Client Secret to .env
 */

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3456/callback';
const TOKEN_FILE = path.join(__dirname, '.linkedin-token.json');
const SCOPES = 'openid profile w_member_social';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET in .env');
  process.exit(1);
}

const app = express();

app.get('/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    res.send(`<h1>Error</h1><p>${error}</p>`);
    process.exit(1);
  }

  try {
    // Exchange code for access token
    const tokenRes = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const tokenData = {
      access_token: tokenRes.data.access_token,
      expires_in: tokenRes.data.expires_in,
      created_at: Date.now(),
      expires_at: Date.now() + tokenRes.data.expires_in * 1000,
    };

    // Get user profile to store URN
    const profileRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    tokenData.sub = profileRes.data.sub;
    tokenData.name = profileRes.data.name;
    tokenData.person_urn = `urn:li:person:${profileRes.data.sub}`;

    fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokenData, null, 2));

    res.send(`
      <h1>LinkedIn Connected!</h1>
      <p>Authenticated as: <strong>${tokenData.name}</strong></p>
      <p>Token saved. You can close this window.</p>
      <p>Token expires: ${new Date(tokenData.expires_at).toLocaleDateString()}</p>
    `);

    console.log(`\nAuthenticated as: ${tokenData.name}`);
    console.log(`Token saved to: ${TOKEN_FILE}`);
    console.log(`Expires: ${new Date(tokenData.expires_at).toLocaleDateString()}`);
    console.log('\nYou can now use linkedin-post.js to post!');

    setTimeout(() => process.exit(0), 2000);
  } catch (err) {
    console.error('Token exchange failed:', err.response?.data || err.message);
    res.send(`<h1>Error</h1><pre>${JSON.stringify(err.response?.data || err.message, null, 2)}</pre>`);
    process.exit(1);
  }
});

const server = app.listen(3456, () => {
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}`;

  console.log('\nOpening LinkedIn authorization page...\n');
  console.log(`If browser doesn't open, visit:\n${authUrl}\n`);

  // Open browser
  const chrome = '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"';
  exec(`${chrome} "${authUrl}"`);
});
