export interface Env {
  NAVADA_HOME_IP: string;
  FLIX_PORT: string;
  ASSETS?: R2Bucket;
  CACHE?: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const hostname = url.hostname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route based on subdomain
      if (hostname.startsWith('flix.')) {
        return handleFlix(request, env, url, corsHeaders);
      }

      if (hostname.startsWith('api.') && url.pathname.startsWith('/edge/')) {
        return handleEdgeAPI(request, env, url, corsHeaders);
      }

      // Default: status page
      return new Response(JSON.stringify({
        service: 'NAVADA Edge Worker',
        status: 'ok',
        timestamp: new Date().toISOString(),
        endpoints: {
          flix: 'flix.navada-edge-server.uk',
          api: 'api.navada-edge-server.uk/edge/',
        },
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });

    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  },
};

// NAVADA Flix proxy - routes to home server's Flix instance via Tailscale
async function handleFlix(request: Request, env: Env, url: URL, corsHeaders: Record<string, string>): Promise<Response> {
  const backendUrl = `http://${env.NAVADA_HOME_IP}:${env.FLIX_PORT}${url.pathname}${url.search}`;

  const backendRequest = new Request(backendUrl, {
    method: request.method,
    headers: request.headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
  });

  try {
    const response = await fetch(backendRequest);
    const newHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([k, v]) => newHeaders.set(k, v));

    // Cache HLS segments at the edge
    if (url.pathname.endsWith('.ts')) {
      newHeaders.set('Cache-Control', 'public, max-age=86400');
    } else if (url.pathname.endsWith('.m3u8')) {
      newHeaders.set('Cache-Control', 'no-cache');
    }

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    });
  } catch {
    return new Response(JSON.stringify({
      error: 'NAVADA Flix backend unavailable',
      hint: 'Home server may be offline or Tailscale not connected',
    }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

// Edge API - lightweight serverless endpoints
async function handleEdgeAPI(request: Request, env: Env, url: URL, corsHeaders: Record<string, string>): Promise<Response> {
  const path = url.pathname.replace('/edge/', '');

  // Health check
  if (path === 'health') {
    return new Response(JSON.stringify({ status: 'ok', worker: 'navada-edge', region: request.cf?.colo }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // Server status check (pings home server)
  if (path === 'status') {
    try {
      const res = await fetch(`http://${env.NAVADA_HOME_IP}:4000/health`, { signal: AbortSignal.timeout(5000) });
      const data = await res.json();
      return new Response(JSON.stringify({ home_server: 'online', flix: data }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } catch {
      return new Response(JSON.stringify({ home_server: 'offline' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  }

  // Video catalog (cached at edge)
  if (path === 'videos') {
    try {
      const res = await fetch(`http://${env.NAVADA_HOME_IP}:${env.FLIX_PORT}/api/videos`);
      const videos = await res.json();
      return new Response(JSON.stringify(videos), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',
          ...corsHeaders,
        },
      });
    } catch {
      return new Response(JSON.stringify({ error: 'Cannot reach video catalog' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Not found', available: ['health', 'status', 'videos'] }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
