// NAVADA MCP Handler Lambda
// Invoked on-demand by Claude for MCP tool calls
// Only charges when executed (no idle costs)

export const handler = async (event) => {
  const { tool, params, requestId } = JSON.parse(event.body || '{}');

  console.log(`[MCP] Tool: ${tool}, RequestId: ${requestId}`);

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    switch (tool) {
      case 'web_search':
        return { statusCode: 200, headers, body: JSON.stringify(await webSearch(params)) };

      case 'scrape_page':
        return { statusCode: 200, headers, body: JSON.stringify(await scrapePage(params)) };

      case 'run_query':
        return { statusCode: 200, headers, body: JSON.stringify(await runQuery(params)) };

      case 'health':
        return {
          statusCode: 200, headers,
          body: JSON.stringify({
            status: 'ok',
            service: 'navada-mcp-lambda',
            region: process.env.AWS_REGION,
            timestamp: new Date().toISOString(),
          }),
        };

      default:
        return {
          statusCode: 400, headers,
          body: JSON.stringify({ error: `Unknown tool: ${tool}`, available: ['web_search', 'scrape_page', 'run_query', 'health'] }),
        };
    }
  } catch (err) {
    console.error(`[MCP] Error: ${err.message}`);
    return {
      statusCode: 500, headers,
      body: JSON.stringify({ error: err.message, tool, requestId }),
    };
  }
};

// Tool implementations
async function webSearch({ query, num_results = 5 }) {
  // Uses native fetch (Node 18+ Lambda runtime)
  const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`);
  const data = await res.json();
  return {
    query,
    results: data.RelatedTopics?.slice(0, num_results).map(t => ({
      text: t.Text,
      url: t.FirstURL,
    })) || [],
  };
}

async function scrapePage({ url }) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'NAVADA-MCP/1.0' },
    signal: AbortSignal.timeout(10000),
  });
  const text = await res.text();
  // Return first 5000 chars of text content
  return { url, status: res.status, content: text.substring(0, 5000) };
}

async function runQuery({ sql, database }) {
  // Placeholder: connect to PostgreSQL or SQLite when needed
  return { message: 'Database queries require RDS or DynamoDB connection. Configure in Lambda env vars.' };
}
