#!/usr/bin/env node
/**
 * Cloudflare Request Tracer
 * Trace how HTTP requests flow through Cloudflare rules, WAF, caching, etc.
 *
 * Usage:
 *   node cloudflare-trace.js https://navada-edge-server.uk
 *   node cloudflare-trace.js https://navada-edge-server.uk --method POST
 *   node cloudflare-trace.js https://navada-edge-server.uk --skip-challenge false
 *
 * Called programmatically:
 *   const { traceRequest } = require('./cloudflare-trace');
 *   const result = await traceRequest('https://navada-edge-server.uk');
 */

require('dotenv').config();
const axios = require('axios');

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const TRACE_URL = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/request-tracer/trace`;

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
 * Trace a request through Cloudflare
 * @param {string} url - URL to trace
 * @param {object} opts - Options: method, headers, cookies, body, skip_challenge, protocol, bot_score, geo
 * @returns {object} Trace result with matched rules and actions
 */
async function traceRequest(url, opts = {}) {
  checkConfig();

  const body = {
    url,
    method: opts.method || 'GET',
    protocol: opts.protocol || 'HTTP/2.0',
    skip_challenge: opts.skip_challenge !== false,
  };

  // Only include non-empty optional fields
  if (opts.headers && Object.keys(opts.headers).length > 0) body.headers = opts.headers;
  if (opts.cookies && Object.keys(opts.cookies).length > 0) body.cookies = opts.cookies;
  if (opts.body) body.body = opts.body;
  if (opts.bot_score !== undefined) body.bot_score = opts.bot_score;
  if (opts.geo) body.geo = opts.geo;

  const res = await axios.post(TRACE_URL, body, { headers });
  const trace = res.data.result;

  // Pretty-print the trace
  console.log(`\nTrace: ${body.method} ${url}`);
  console.log('='.repeat(60));

  if (trace && Array.isArray(trace)) {
    for (const step of trace) {
      const status = step.matched ? 'MATCHED' : 'no match';
      const action = step.action || '-';
      const name = step.name || step.expression_name || step.rule_name || step.type || 'rule';
      const description = step.description || '';
      console.log(`  [${status}] ${name}: ${action}${description ? ' | ' + description : ''}`);
    }
    console.log(`\nTotal rules evaluated: ${trace.length}`);
  } else if (trace) {
    // Single object response - format it
    console.log(JSON.stringify(trace, null, 2));
  } else {
    console.log('No trace data returned.');
  }

  return trace;
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const url = args[0];

  if (!url || url.startsWith('--')) {
    console.log('Cloudflare Request Tracer');
    console.log('Usage:');
    console.log('  node cloudflare-trace.js <url>');
    console.log('  node cloudflare-trace.js <url> --method POST');
    console.log('  node cloudflare-trace.js <url> --skip-challenge false');
    console.log('\nExamples:');
    console.log('  node cloudflare-trace.js https://navada-edge-server.uk');
    console.log('  node cloudflare-trace.js https://navada-edge-server.uk --method POST');
    process.exit(0);
  }

  // Parse flags
  const opts = {};
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--method' && args[i + 1]) {
      opts.method = args[++i];
    } else if (args[i] === '--skip-challenge') {
      opts.skip_challenge = args[i + 1] !== 'false';
      if (args[i + 1] === 'false' || args[i + 1] === 'true') i++;
    } else if (args[i] === '--protocol' && args[i + 1]) {
      opts.protocol = args[++i];
    } else if (args[i] === '--bot-score' && args[i + 1]) {
      opts.bot_score = parseInt(args[++i], 10);
    }
  }

  traceRequest(url, opts)
    .then(() => process.exit(0))
    .catch((err) => {
      const errData = err.response?.data || err.message;
      console.error('Error:', JSON.stringify(errData, null, 2));
      process.exit(1);
    });
}

module.exports = { traceRequest };
