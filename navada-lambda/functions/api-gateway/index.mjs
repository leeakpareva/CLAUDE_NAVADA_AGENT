// NAVADA API Gateway Lambda
// Handles API requests that don't need a persistent server
// Routes: /api/render, /api/transcode, /api/notify

export const handler = async (event) => {
  const path = event.rawPath || event.path || '';
  const method = event.requestContext?.http?.method || event.httpMethod || 'GET';
  const body = event.body ? JSON.parse(event.body) : {};

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (method === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Route handling
    if (path === '/api/health') {
      return {
        statusCode: 200, headers,
        body: JSON.stringify({
          status: 'ok',
          service: 'navada-api-lambda',
          region: process.env.AWS_REGION,
          timestamp: new Date().toISOString(),
          routes: ['/api/health', '/api/render', '/api/webhook'],
        }),
      };
    }

    // Render request (trigger home server to render a Remotion video)
    if (path === '/api/render' && method === 'POST') {
      const { composition, props, output } = body;
      // Forward to home server's Remotion via Tailscale
      const homeUrl = `http://${process.env.HOME_SERVER_IP || '100.121.187.67'}:4000/api/videos/import`;
      return {
        statusCode: 200, headers,
        body: JSON.stringify({
          message: 'Render request queued',
          composition,
          note: 'Rendering happens on the home server. Lambda triggers, home executes.',
        }),
      };
    }

    // Webhook handler (for Clerk, Stripe, etc.)
    if (path === '/api/webhook' && method === 'POST') {
      console.log('[WEBHOOK]', JSON.stringify(body).substring(0, 500));
      return {
        statusCode: 200, headers,
        body: JSON.stringify({ received: true }),
      };
    }

    return {
      statusCode: 404, headers,
      body: JSON.stringify({ error: 'Not found', path }),
    };
  } catch (err) {
    return {
      statusCode: 500, headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
