/**
 * NAVADA Edge E2E — HTTP request helper
 * Wraps fetch with timeout, retry, API key injection.
 */

const DEFAULT_TIMEOUT = 10000;
const DEFAULT_RETRIES = 1;

async function request(url, opts = {}) {
  const {
    method = 'GET',
    body = null,
    headers = {},
    timeout = DEFAULT_TIMEOUT,
    retries = DEFAULT_RETRIES,
    apiKey = null,
  } = opts;

  const reqHeaders = { ...headers };
  if (apiKey) reqHeaders['X-API-Key'] = apiKey;
  if (body && !reqHeaders['Content-Type']) reqHeaders['Content-Type'] = 'application/json';

  // Also pass API key as query param (Cloudflare WAF may block header-only auth)
  let finalUrl = url;
  if (apiKey) {
    const u = new URL(url);
    if (!u.searchParams.has('key')) {
      u.searchParams.set('key', apiKey);
      finalUrl = u.toString();
    }
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      const resp = await fetch(finalUrl, {
        method,
        headers: reqHeaders,
        body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timer);

      const latencyMs = Date.now() - start;
      let data = null;
      const ct = resp.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        try { data = await resp.json(); } catch { data = null; }
      } else {
        try { data = await resp.text(); } catch { data = null; }
      }

      return { status: resp.status, data, latencyMs, ok: resp.ok };
    } catch (e) {
      if (attempt < retries) continue;
      return { status: 0, data: null, latencyMs: Date.now() - start, ok: false, error: e.message };
    }
  }
}

async function tcpCheck(host, port, timeoutMs = 5000) {
  const net = require('net');
  return new Promise(resolve => {
    const start = Date.now();
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);
    socket.on('connect', () => {
      const latencyMs = Date.now() - start;
      socket.destroy();
      resolve({ ok: true, latencyMs });
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve({ ok: false, latencyMs: Date.now() - start, error: 'timeout' });
    });
    socket.on('error', (e) => {
      socket.destroy();
      resolve({ ok: false, latencyMs: Date.now() - start, error: e.message });
    });
    socket.connect(port, host);
  });
}

module.exports = { request, tcpCheck };
