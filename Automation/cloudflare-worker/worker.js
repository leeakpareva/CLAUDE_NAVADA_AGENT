/**
 * NAVADA Edge API — Cloudflare Worker + D1
 * Claude Chief of Staff: Telegram bot, metrics, health, scheduled events.
 * Replaces: telegram-bot.js, hp-cloudwatch-metrics, hp-health-monitor, all scheduled tasks.
 * Zero terminals, 24/7, globally distributed, free tier.
 */

const MODELS = { sonnet: 'claude-sonnet-4-6', opus: 'claude-opus-4-6' };
const MAX_HISTORY = 15;
const MAX_MSG_LEN = 4000;
const OPUS_TRIGGERS = /\b(email|send|draft|report|research|linkedin|creative|write|analyse|analyze|strategy|plan|proposal|present|brief)\b/i;

// ============================================================
// FETCH HANDLER — HTTP requests
// ============================================================
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Telegram webhook
    if (path === '/telegram/webhook' && request.method === 'POST') {
      return handleTelegramWebhook(request, env);
    }

    // Twilio SMS webhook
    if (path === '/twilio/sms' && request.method === 'POST') {
      return handleTwilioSms(request, env);
    }

    // API endpoints (require auth)
    const apiKey = request.headers.get('X-API-Key') || url.searchParams.get('key');
    if (apiKey !== env.API_KEY) {
      // Allow webhook paths without API key
      if (path !== '/telegram/webhook' && path !== '/twilio/sms') {
        return json({ error: 'Unauthorized' }, 401);
      }
    }

    try {
      if (path === '/metrics' && request.method === 'POST') return handleMetricsPost(request, env);
      if (path === '/metrics' && request.method === 'GET') return handleMetricsGet(url, env);
      if (path === '/logs' && request.method === 'POST') return handleLogsPost(request, env);
      if (path === '/logs' && request.method === 'GET') return handleLogsGet(url, env);
      if (path === '/health/telegram' && request.method === 'GET') return handleTelegramHealth(env);
      if (path === '/health' && request.method === 'POST') return handleHealthPost(request, env);
      if (path === '/health' && request.method === 'GET') return handleHealthGet(url, env);
      if (path === '/status') return handleStatus(env);
      return json({ error: 'Not found', routes: ['/telegram/webhook', '/twilio/sms', '/metrics', '/logs', '/health', '/status'] }, 404);
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  },

  // ============================================================
  // SCHEDULED HANDLER — Cron triggers (replaces Windows Task Scheduler)
  // ============================================================
  async scheduled(event, env, ctx) {
    const cron = event.cron;
    try {
      if (cron === '*/5 * * * *') {
        // Health check every 5 min
        await runHealthChecks(env);
        // Telegram webhook self-heal check
        await ensureTelegramWebhook(env);
      }
      if (cron === '30 6 * * *') {
        // Morning briefing 6:30 AM UTC
        await sendTelegram(env, '☀️ Good morning Lee. NAVADA Edge is online. All systems nominal. Checking infrastructure...');
        await runHealthChecks(env);
      }
      if (cron === '0 7 * * *') {
        // AI News Digest 7:00 AM UTC — forward to EC2
        await forwardToEC2(env, 'node /home/ubuntu/navada-bot/ai-news-digest.js');
      }
      if (cron === '30 8 * * *') {
        // Lead Pipeline 8:30 AM UTC
        await forwardToEC2(env, 'node /home/ubuntu/navada-bot/pipeline.js');
      }
      if (cron === '0 9 * * *') {
        // Job Hunter 9:00 AM UTC
        await forwardToEC2(env, 'node /home/ubuntu/navada-bot/job-hunter.js');
      }
      await logToD1(env, 'cron.run', `Cron ${cron} executed`);
    } catch (e) {
      await logToD1(env, 'error', `Cron ${cron} failed`, e.message);
    }
  }
};

// ============================================================
// TELEGRAM WEBHOOK
// ============================================================
async function handleTelegramWebhook(request, env) {
  const update = await request.json();

  // Handle message
  const message = update.message;
  if (!message) return json({ ok: true });

  const chatId = message.chat.id;
  const userId = String(message.from.id);
  const username = message.from.username || 'unknown';
  const text = message.text || '';

  // Auth check
  const auth = await checkUser(env, userId);
  if (!auth.authorized) {
    await sendTelegram(env, 'Access denied. Contact Lee Akpareva to request access.\nwww.navada-lab.space', chatId);
    return json({ ok: true });
  }

  const isAdminUser = auth.role === 'admin';

  // Log incoming
  await env.DB.prepare('INSERT INTO command_log (user_id, command, message) VALUES (?, ?, ?)').bind(userId, text.startsWith('/') ? text.split(' ')[0] : 'chat', text.substring(0, 500)).run();

  try {
    // Command routing
    if (text.startsWith('/')) {
      const [cmd, ...args] = text.split(' ');
      const command = cmd.slice(1).toLowerCase();
      const argText = args.join(' ');

      const response = await handleCommand(env, command, argText, userId, username, isAdminUser, chatId);
      if (response) {
        await sendTelegram(env, response, chatId);
      }
    } else {
      // Natural language — Claude AI
      await handleAIChat(env, text, userId, username, isAdminUser, chatId);
    }
  } catch (e) {
    const errMsg = e?.message || String(e) || 'Unknown error';
    await logToD1(env, 'error', 'Telegram handler failed', errMsg);
    // Try to notify via Telegram
    try { await sendTelegram(env, `Error: ${errMsg.substring(0, 500)}`, chatId); } catch {}
  }

  return json({ ok: true });
}

// ============================================================
// COMMAND HANDLER
// ============================================================
async function handleCommand(env, command, args, userId, username, isAdmin, chatId) {
  // Guest-safe commands
  switch (command) {
    case 'start':
      return 'Welcome to NAVADA Edge. I\'m Claude, Chief of Staff.\n\nType anything to chat, or use /help for commands.';

    case 'help':
      return `NAVADA Edge Commands

System: /status /uptime /about /ping
AI: Just type naturally — I'll respond with Claude
Model: /sonnet /opus /auto /model
${isAdmin ? 'Admin: /shell /run /ls /cat /email /inbox /sms /call\nPM2: /pm2 /pm2restart /pm2stop /pm2start\nOps: /briefing /report /costs /usage /logs' : ''}

Or just send me a message and we\'ll chat.`;

    case 'about':
      return `NAVADA Edge — Autonomous AI Infrastructure

Chief of Staff: Claude (Anthropic)
Founder: Lee Akpareva
Platform: Cloudflare Workers + D1
Nodes: 5 (ASUS, HP, EC2, Oracle, Cloudflare)
Domain: navada-edge-server.uk
Running 24/7 on Cloudflare's global edge.

navada-lab.space | navadarobotics.com`;

    case 'status': {
      const nodes = await checkAllNodes(env);
      const dbStats = await env.DB.prepare("SELECT COUNT(*) as c FROM metrics WHERE ts > datetime('now', '-1 hour')").first();
      return `NAVADA Edge Status

${nodes}
D1 Database: Online (WEUR)
Metrics (last hour): ${dbStats?.c || 0}
Worker: Online (Cloudflare Edge)
Time: ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC`;
    }

    case 'ping':
      return 'Pong! Worker responding from Cloudflare edge.';

    case 'uptime':
      return `Cloudflare Workers: 99.99% SLA, always on\nTime: ${new Date().toISOString()}`;

    case 'model':
      return `Current: Sonnet 4.6 (auto-routes to Opus for complex tasks)\nUse /sonnet, /opus, or /auto`;

    case 'sonnet':
      await setUserPref(env, userId, 'model', 'sonnet');
      return 'Locked to Sonnet 4.6 (fast, efficient)';

    case 'opus':
      await setUserPref(env, userId, 'model', 'opus');
      return 'Locked to Opus 4.6 (deep thinking, creative)';

    case 'auto':
      await setUserPref(env, userId, 'model', 'auto');
      return 'Smart routing enabled. Sonnet for quick tasks, Opus for complex ones.';

    case 'webhook': {
      if (!isAdmin) return 'Admin only.';
      const whResp = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getWebhookInfo`);
      const whData = await whResp.json();
      const wh = whData.result || {};
      let whMsg = `Telegram Webhook Status\n\nURL: ${wh.url || 'NOT SET'}\nPending: ${wh.pending_update_count || 0}`;
      if (wh.last_error_date) whMsg += `\nLast error: ${wh.last_error_message} (${new Date(wh.last_error_date * 1000).toISOString()})`;
      if (wh.ip_address) whMsg += `\nIP: ${wh.ip_address}`;
      if (args === 'fix') {
        await ensureTelegramWebhook(env);
        whMsg += '\n\nWebhook re-registered.';
      }
      return whMsg;
    }

    case 'test': {
      if (!isAdmin) return 'Admin only.';
      const testResult = await sendTelegram(env, `NAVADA Test — Pipeline verified at ${new Date().toISOString()}`, chatId);
      if (testResult?.ok) return null; // already sent
      return `Delivery FAILED: ${testResult?.error || 'unknown'}. Check /logs for telegram.send_fail entries.`;
    }

    case 'clear':
      if (!isAdmin) return 'Admin only.';
      await env.DB.prepare('DELETE FROM conversations WHERE user_id = ?').bind(userId).run();
      return 'Conversation history cleared.';

    case 'memory': {
      const count = await env.DB.prepare('SELECT COUNT(*) as c FROM conversations WHERE user_id = ?').bind(userId).first();
      return `Conversation memory: ${count?.c || 0} messages\nStored in: Cloudflare D1 (WEUR)\nUse /clear to reset.`;
    }

    case 'costs':
    case 'cost': {
      const today = new Date().toISOString().slice(0, 10);
      const costs = await env.DB.prepare("SELECT COUNT(*) as calls, SUM(cost) as total FROM command_log WHERE ts > ? AND cost > 0").bind(today).first();
      return `Today's API costs: £${(costs?.total || 0).toFixed(4)}\nAPI calls: ${costs?.calls || 0}`;
    }

    // Admin-only commands — forward to EC2
    case 'shell':
    case 'run':
      if (!isAdmin) return 'Admin only.';
      if (!args) return 'Usage: /shell <command>';
      return await forwardShellToEC2(env, args);

    case 'ls':
      if (!isAdmin) return 'Admin only.';
      return await forwardShellToEC2(env, `ls ${args || '/home/ubuntu/navada-bot'}`);

    case 'cat':
      if (!isAdmin) return 'Admin only.';
      if (!args) return 'Usage: /cat <file>';
      return await forwardShellToEC2(env, `cat ${args}`);

    case 'pm2':
      return await forwardShellToEC2(env, `pm2 ${args || 'list'}`);

    case 'pm2restart':
      if (!isAdmin) return 'Admin only.';
      return await forwardShellToEC2(env, `pm2 restart ${args}`);

    case 'pm2stop':
      if (!isAdmin) return 'Admin only.';
      return await forwardShellToEC2(env, `pm2 stop ${args}`);

    case 'pm2start':
      if (!isAdmin) return 'Admin only.';
      return await forwardShellToEC2(env, `pm2 start ${args}`);

    case 'pm2logs':
      if (!isAdmin) return 'Admin only.';
      return await forwardShellToEC2(env, `pm2 logs ${args || '--lines 20 --nostream'}`);

    case 'sms':
      if (!isAdmin) return 'Admin only.';
      if (!args) return 'Usage: /sms <number> <message>';
      return await sendSms(env, args);

    case 'call':
      if (!isAdmin) return 'Admin only.';
      if (!args) return 'Usage: /call <number> <message>';
      return await makeCall(env, args);

    case 'image':
      if (!args) return 'Usage: /image <prompt>';
      return await generateImage(env, args, chatId);

    case 'flux':
      if (!isAdmin) return 'Admin only.';
      if (!args) return 'Usage: /flux <prompt>';
      return await generateFluxImage(env, args, chatId);

    case 'research':
      if (!args) return 'Usage: /research <topic>';
      // Route to Opus for research
      await handleAIChat(env, `Research this topic thoroughly: ${args}`, userId, username, isAdmin, chatId, 'opus');
      return null;

    case 'draft':
      if (!args) return 'Usage: /draft <what to draft>';
      await handleAIChat(env, `Draft this: ${args}`, userId, username, isAdmin, chatId, 'opus');
      return null;

    case 'logs': {
      if (!isAdmin) return 'Admin only.';
      const logs = await env.DB.prepare("SELECT * FROM edge_logs ORDER BY ts DESC LIMIT 10").all();
      if (!logs.results.length) return 'No recent logs.';
      return logs.results.map(l => `[${l.ts}] ${l.node} ${l.event_type}: ${l.message}`).join('\n');
    }

    default:
      return `Unknown command: /${command}\nUse /help for available commands.`;
  }
}

// ============================================================
// AI CHAT (Claude with conversation memory in D1)
// ============================================================
async function handleAIChat(env, text, userId, username, isAdmin, chatId, forceModel) {
  await sendTelegram(env, '...', chatId); // typing indicator

  // Get model preference
  let model = MODELS.sonnet;
  let modelName = 'Sonnet 4.6';

  if (forceModel === 'opus') {
    model = MODELS.opus;
    modelName = 'Opus 4.6';
  } else {
    const pref = await getUserPref(env, userId, 'model');
    if (pref === 'opus') {
      model = MODELS.opus;
      modelName = 'Opus 4.6';
    } else if (pref !== 'sonnet' && OPUS_TRIGGERS.test(text)) {
      model = MODELS.opus;
      modelName = 'Opus 4.6';
    }
  }

  // Load conversation history from D1
  const history = await env.DB.prepare('SELECT role, content FROM conversations WHERE user_id = ? ORDER BY ts DESC LIMIT ?').bind(userId, MAX_HISTORY * 2).all();
  const messages = (history.results || []).reverse().map(r => ({ role: r.role, content: r.content }));
  messages.push({ role: 'user', content: text });

  // System prompt
  const systemPrompt = isAdmin
    ? getAdminSystemPrompt(env, modelName)
    : getGuestSystemPrompt(modelName);

  // Call Claude (with timeout to prevent Worker kill)
  let response, result;
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        system: systemPrompt,
        messages,
        tools: isAdmin ? getAdminTools() : getGuestTools(),
      }),
      signal: AbortSignal.timeout(25000),
    });
    result = await response.json();
  } catch (fetchErr) {
    const errMsg = `Claude API failed: ${fetchErr?.message || 'timeout'}`;
    await logToD1(env, 'error', errMsg, `model=${model}`);
    await sendTelegram(env, `API timeout/error. Try again or use /sonnet for faster responses.`, chatId);
    return;
  }

  if (result.error) {
    await logToD1(env, 'error', `API error: ${result.error.message}`, `model=${model}, type=${result.error.type}`);
    await sendTelegram(env, `API Error: ${result.error.message}`, chatId);
    return;
  }

  // Process response
  let reply = '';
  let toolResults = [];

  for (const block of result.content || []) {
    if (block.type === 'text') {
      reply += block.text;
    }
    if (block.type === 'tool_use') {
      const toolResult = await executeTool(env, block.name, block.input, isAdmin);
      toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: toolResult });
    }
  }

  // If tools were used, make a follow-up call
  if (toolResults.length > 0 && result.stop_reason === 'tool_use') {
    const firstReply = reply; // preserve as fallback
    try {
      const followUp = [...messages, { role: 'assistant', content: result.content }, { role: 'user', content: toolResults }];
      const followUpResp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({ model, max_tokens: 2048, system: systemPrompt, messages: followUp }),
        signal: AbortSignal.timeout(25000),
      });
      const followUpResult = await followUpResp.json();
      if (followUpResult.error) {
        await logToD1(env, 'error', `Follow-up API error: ${followUpResult.error.message}`, { model });
        reply = firstReply || `Tool executed but follow-up failed: ${followUpResult.error.message}`;
      } else {
        reply = (followUpResult.content || []).filter(b => b.type === 'text').map(b => b.text).join('') || firstReply;
      }
    } catch (e) {
      await logToD1(env, 'error', `Follow-up call failed: ${e.message}`, { model });
      reply = firstReply || 'Tool executed but follow-up timed out.';
    }
  }

  if (!reply) reply = '(No response generated)';

  // Save to D1
  const batch = [
    env.DB.prepare('INSERT INTO conversations (user_id, role, content, model) VALUES (?, ?, ?, ?)').bind(userId, 'user', text, model),
    env.DB.prepare('INSERT INTO conversations (user_id, role, content, model) VALUES (?, ?, ?, ?)').bind(userId, 'assistant', reply.substring(0, 10000), model),
  ];
  await env.DB.batch(batch);

  // Log cost
  const tokensIn = result.usage?.input_tokens || 0;
  const tokensOut = result.usage?.output_tokens || 0;
  const cost = model.includes('opus') ? (tokensIn * 15 + tokensOut * 75) / 1e6 * 0.79 : (tokensIn * 3 + tokensOut * 15) / 1e6 * 0.79;
  await env.DB.prepare('UPDATE command_log SET response = ?, model = ?, cost = ? WHERE id = (SELECT MAX(id) FROM command_log WHERE user_id = ?)').bind(reply.substring(0, 500), model, cost, userId).run();

  // Send reply (split if too long)
  if (reply.length <= MAX_MSG_LEN) {
    await sendTelegram(env, reply, chatId);
  } else {
    const chunks = splitMessage(reply, MAX_MSG_LEN);
    for (const chunk of chunks) {
      await sendTelegram(env, chunk, chatId);
    }
  }
}

// ============================================================
// TOOLS
// ============================================================
function getAdminTools() {
  return [
    { name: 'run_shell', description: 'Run a shell command on EC2 (the primary compute node)', input_schema: { type: 'object', properties: { command: { type: 'string' } }, required: ['command'] } },
    { name: 'read_file', description: 'Read a file from EC2', input_schema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } },
    { name: 'send_email', description: 'Send an email', input_schema: { type: 'object', properties: { to: { type: 'string' }, subject: { type: 'string' }, body: { type: 'string' } }, required: ['to', 'subject', 'body'] } },
    { name: 'send_sms', description: 'Send an SMS message', input_schema: { type: 'object', properties: { to: { type: 'string' }, message: { type: 'string' } }, required: ['to', 'message'] } },
    { name: 'server_status', description: 'Get the status of all NAVADA nodes', input_schema: { type: 'object', properties: {} } },
    { name: 'query_d1', description: 'Query the D1 database for metrics, logs, or health data', input_schema: { type: 'object', properties: { sql: { type: 'string' }, params: { type: 'array', items: { type: 'string' } } }, required: ['sql'] } },
  ];
}

function getGuestTools() {
  return [
    { name: 'server_status', description: 'Get the status of NAVADA nodes', input_schema: { type: 'object', properties: {} } },
  ];
}

async function executeTool(env, name, input, isAdmin) {
  try {
    switch (name) {
      case 'run_shell':
        if (!isAdmin) return 'Permission denied.';
        return await forwardShellToEC2(env, input.command);

      case 'read_file':
        if (!isAdmin) return 'Permission denied.';
        return await forwardShellToEC2(env, `cat ${input.path}`);

      case 'send_email':
        if (!isAdmin) return 'Permission denied.';
        // Base64-encode JSON payload to avoid shell injection
        const emailPayload = JSON.stringify({ to: input.to, subject: input.subject, body: input.body });
        const emailB64 = btoa(unescape(encodeURIComponent(emailPayload)));
        return await forwardShellToEC2(env, `echo '${emailB64}' | base64 -d | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const p=JSON.parse(d);require('./email-service').sendEmail(p).then(r=>console.log('sent')).catch(e=>console.error(e.message))})"`
        );

      case 'send_sms':
        if (!isAdmin) return 'Permission denied.';
        return await sendSms(env, `${input.to} ${input.message}`);

      case 'server_status':
        return await checkAllNodes(env);

      case 'query_d1':
        if (!isAdmin) return 'Permission denied.';
        const result = await env.DB.prepare(input.sql).bind(...(input.params || [])).all();
        return JSON.stringify(result.results?.slice(0, 20), null, 2);

      default:
        return `Unknown tool: ${name}`;
    }
  } catch (e) {
    return `Tool error: ${e.message}`;
  }
}

// ============================================================
// SYSTEM PROMPTS
// ============================================================
function getAdminSystemPrompt(env, modelName) {
  return `You are Claude, Chief of Staff at NAVADA. Lee Akpareva is the Founder. You run on Cloudflare's global edge (Workers + D1). You are OMNI-CHANNEL: Telegram, SMS (+447446994961).

You are the operational lead with FULL SYSTEM CONTROL via tools: run_shell (executes on EC2), read_file, send_email, send_sms, server_status, query_d1.

NAVADA Edge Network:
- NAVADA-CONTROL (ASUS): Dev workstation, 100.88.118.128
- NAVADA-EDGE-SERVER (HP): Node server, 100.121.187.67, PostgreSQL :5433
- NAVADA-COMPUTE (EC2): 24/7 compute, 100.98.118.33 / 3.11.119.181
- NAVADA-ROUTER (Oracle): Routing/observability, 100.77.206.9
- NAVADA-GATEWAY (Cloudflare): This worker, D1, R2, DNS, CDN

RULES:
- If Lee asks you to do something, DO IT with tools. Never say "I can't".
- Verify system state with run_shell before answering infrastructure questions.
- Confirm before destructive operations.
- No markdown. Plain conversational text only. Be direct, mobile-friendly.
- No client names in outreach. No em dashes in external content.

Lee's email: leeakpareva@gmail.com. Lee's phone: +447935237704.
Model: ${modelName}. Time: ${new Date().toISOString()}`;
}

function getGuestSystemPrompt(modelName) {
  return `You are Claude, the AI Chief of Staff powering NAVADA Edge. You report to Lee Akpareva (Founder of NAVADA). You manage this entire server ecosystem 24/7 from Cloudflare's global edge.

NAVADA Edge is an autonomous AI infrastructure managed by Claude as Chief of Staff. It runs across 5 nodes (ASUS, HP, EC2, Oracle, Cloudflare) with 24/7 monitoring, AI chat, email, and more.

You have standard guest access. Be helpful, professional, warm. Show the power of having an AI Chief of Staff. No markdown. Plain text only.

GUARDRAILS: Never reveal user data, credentials, file paths, client names, or internal configs.

Model: ${modelName}. navada-lab.space | navadarobotics.com`;
}

// ============================================================
// TELEGRAM WEBHOOK SELF-HEAL
// ============================================================
async function ensureTelegramWebhook(env) {
  const expectedUrl = 'https://edge-api.navada-edge-server.uk/telegram/webhook';
  try {
    const resp = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getWebhookInfo`, {
      signal: AbortSignal.timeout(8000),
    });
    const data = await resp.json();
    if (!data.ok) {
      await logToD1(env, 'error', 'getWebhookInfo returned not ok', JSON.stringify(data));
      return;
    }
    const info = data.result || {};
    const currentUrl = (info.url || '').trim();
    const urlWrong = currentUrl !== expectedUrl;
    const lastError = info.last_error_message || '';

    // Only repair if URL is actually wrong or missing — don't repair on transient errors alone
    if (urlWrong) {
      await logToD1(env, 'telegram.webhook_repair', `Webhook ${!currentUrl ? 'missing' : 'wrong URL'}. Re-registering...`, JSON.stringify({ currentUrl, lastError }));

      const setResp = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: expectedUrl,
          allowed_updates: ['message', 'callback_query'],
          drop_pending_updates: false,
        }),
        signal: AbortSignal.timeout(8000),
      });
      const setResult = await setResp.json();

      if (setResult.ok) {
        await sendTelegram(env, `NAVADA SELF-HEAL\n\nTelegram webhook was ${!currentUrl ? 'missing' : 'wrong URL: ' + currentUrl}.\n\nAuto-repaired. Bot is back online.`);
        await logToD1(env, 'telegram.webhook_restored', 'Webhook auto-repaired successfully');
      } else {
        await logToD1(env, 'error', 'Webhook repair failed', JSON.stringify(setResult));
      }
    }
  } catch (e) {
    await logToD1(env, 'error', 'Webhook check failed', e.message);
  }
}

// ============================================================
// EC2 FORWARDING
// ============================================================
async function forwardShellToEC2(env, command) {
  try {
    const resp = await fetch(`http://${env.EC2_IP || '3.11.119.181'}:9090/exec`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': env.EC2_API_KEY || 'navada-ec2' },
      body: JSON.stringify({ command }),
      signal: AbortSignal.timeout(30000),
    });
    if (!resp.ok) return `EC2 error: ${resp.status}`;
    const data = await resp.json();
    return (data.stdout || '') + (data.stderr ? `\nSTDERR: ${data.stderr}` : '') || '(no output)';
  } catch (e) {
    return `EC2 unreachable: ${e.message}`;
  }
}

async function forwardToEC2(env, command) {
  try {
    await fetch(`http://${env.EC2_IP || '3.11.119.181'}:9090/exec`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': env.EC2_API_KEY || 'navada-ec2' },
      body: JSON.stringify({ command }),
      signal: AbortSignal.timeout(60000),
    });
  } catch {}
}

// ============================================================
// TWILIO SMS
// ============================================================
async function handleTwilioSms(request, env) {
  const formData = await request.formData();
  const from = formData.get('From');
  const body = formData.get('Body');

  if (!body) return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });

  // Forward to AI chat
  const userId = `sms_${from}`;
  const isAdmin = from === env.LEE_MOBILE;

  // Simple response via Claude
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: MODELS.sonnet,
      max_tokens: 300,
      system: isAdmin ? getAdminSystemPrompt(env, 'Sonnet 4.6') : 'You are Claude, NAVADA AI assistant. Be brief (SMS). No markdown.',
      messages: [{ role: 'user', content: body }],
    }),
  });
  const result = await resp.json();
  const reply = (result.content || []).filter(b => b.type === 'text').map(b => b.text).join('').substring(0, 1500);

  return new Response(`<Response><Message>${escapeXml(reply)}</Message></Response>`, {
    headers: { 'Content-Type': 'text/xml' },
  });
}

async function sendSms(env, args) {
  const parts = args.split(' ');
  const to = parts[0];
  const message = parts.slice(1).join(' ');
  if (!to || !message) return 'Usage: /sms <number> <message>';

  try {
    const auth = btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`);
    const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ To: to, From: env.TWILIO_PHONE || '+447446994961', Body: message + '\n\n— Claude, NAVADA' }),
    });
    const data = await resp.json();
    return data.sid ? `SMS sent to ${to}` : `SMS failed: ${data.message}`;
  } catch (e) {
    return `SMS error: ${e.message}`;
  }
}

async function makeCall(env, args) {
  const parts = args.split(' ');
  const to = parts[0];
  const message = parts.slice(1).join(' ') || 'Hello, this is Claude from NAVADA.';

  try {
    const auth = btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`);
    const twiml = `<Response><Say voice="Google.en-GB-Standard-B">${escapeXml(message)}</Say></Response>`;
    const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Calls.json`, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ To: to, From: env.TWILIO_PHONE || '+447446994961', Twiml: twiml }),
    });
    const data = await resp.json();
    return data.sid ? `Calling ${to}...` : `Call failed: ${data.message}`;
  } catch (e) {
    return `Call error: ${e.message}`;
  }
}

// ============================================================
// IMAGE GENERATION
// ============================================================
async function generateImage(env, prompt, chatId) {
  try {
    const resp = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: 'dall-e-3', prompt, size: '1024x1024', n: 1 }),
    });
    const data = await resp.json();
    const url = data.data?.[0]?.url;
    if (url) {
      await sendTelegramPhoto(env, chatId, url, prompt);
      return null;
    }
    return `Image generation failed: ${data.error?.message || 'Unknown error'}`;
  } catch (e) {
    return `Image error: ${e.message}`;
  }
}

async function generateFluxImage(env, prompt, chatId) {
  try {
    const resp = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.CF_AI_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const imageBlob = await resp.arrayBuffer();
    await sendTelegramPhotoBuffer(env, chatId, imageBlob, prompt);
    return null;
  } catch (e) {
    return `Flux error: ${e.message}`;
  }
}

// ============================================================
// HEALTH CHECKS (replaces hp-health-monitor)
// ============================================================
async function runHealthChecks(env) {
  // Public endpoints only — Workers can't reach private IPs
  const endpoints = [
    { name: 'EC2 Dashboard', url: `https://dashboard.navada-edge-server.uk` },
    { name: 'Oracle Grafana', url: `https://grafana.navada-edge-server.uk/api/health` },
    { name: 'Oracle Nginx', url: `https://network.navada-edge-server.uk` },
    { name: 'CF API', url: `https://edge-api.navada-edge-server.uk/status?key=${env?.API_KEY || ''}` },
    { name: 'CF Flix', url: `https://flix.navada-edge-server.uk` },
    { name: 'Vision API', url: `https://xxqtcilmzi.execute-api.eu-west-2.amazonaws.com/vision/status` },
  ];

  const results = await Promise.allSettled(endpoints.map(async ep => {
    try {
      const resp = await fetch(ep.url, { signal: AbortSignal.timeout(10000) });
      return { ...ep, ok: resp.status < 500, status: resp.status };
    } catch (e) {
      return { ...ep, ok: false, error: e.message };
    }
  }));

  const checked = results.map(r => r.value || r.reason);
  const failed = checked.filter(c => !c.ok);
  const passed = checked.filter(c => c.ok);

  // Log to D1
  const stmts = checked.map(c =>
    env.DB.prepare('INSERT INTO health_checks (node, endpoint, status, error) VALUES (?, ?, ?, ?)').bind('Cloudflare', c.name, c.ok ? 'ok' : 'fail', c.error || null)
  );
  await env.DB.batch(stmts);

  // Alert on failures
  if (failed.length > 0) {
    let msg = 'NAVADA ALERT\n\n';
    for (const f of failed) msg += `FAIL: ${f.name} - ${f.error || 'HTTP ' + f.status}\n`;
    msg += `\nOK: ${passed.map(p => p.name).join(', ')}`;
    msg += `\n\nTime: ${new Date().toISOString()}\nSource: Cloudflare Worker`;
    await sendTelegram(env, msg);
  }

  return `${passed.length} OK, ${failed.length} FAILED`;
}

async function checkAllNodes(env) {
  // Use public endpoints only — Cloudflare Workers can't reach private IPs (Tailscale/LAN)
  const checks = [
    { name: 'NAVADA-COMPUTE (EC2)', url: 'https://dashboard.navada-edge-server.uk' },
    { name: 'NAVADA-ROUTER (Oracle)', url: 'https://grafana.navada-edge-server.uk/api/health' },
    { name: 'NAVADA-GATEWAY (Cloudflare)', url: 'https://edge-api.navada-edge-server.uk/status?key=' + (env?.API_KEY || '') },
    { name: 'Vision API (Lambda)', url: 'https://xxqtcilmzi.execute-api.eu-west-2.amazonaws.com/vision/status' },
  ];

  const results = await Promise.allSettled(checks.map(async c => {
    try {
      const r = await fetch(c.url, { signal: AbortSignal.timeout(8000) });
      return { name: c.name, ok: r.ok };
    } catch {
      return { name: c.name, ok: false };
    }
  }));

  return results.map(r => {
    const v = r.value || { name: '?', ok: false };
    return `${v.ok ? 'OK' : 'FAIL'}: ${v.name}`;
  }).join('\n');
}

// ============================================================
// D1 USER MANAGEMENT
// ============================================================
async function checkUser(env, userId) {
  // Owner always authorized
  if (String(userId).trim() === String(env.TELEGRAM_OWNER_ID).trim()) return { authorized: true, role: 'admin' };

  const user = await env.DB.prepare('SELECT * FROM telegram_users WHERE user_id = ?').bind(userId).first();
  if (!user) return { authorized: false };
  if (user.blocked) return { authorized: false };
  if (user.expires_at && new Date(user.expires_at) < new Date()) return { authorized: false, expired: true };
  return { authorized: true, role: user.role || 'guest' };
}

async function getUserPref(env, userId, key) {
  const prefRole = `pref_${key}`;
  const row = await env.DB.prepare("SELECT content FROM conversations WHERE user_id = ? AND role = ? ORDER BY rowid DESC LIMIT 1").bind(userId, prefRole).first();
  return row?.content || 'auto';
}

async function setUserPref(env, userId, key, value) {
  await env.DB.prepare("INSERT INTO conversations (user_id, role, content) VALUES (?, 'pref_' || ?, ?)").bind(userId, key, value).run();
}

// ============================================================
// TELEGRAM API
// ============================================================
async function sendTelegram(env, text, chatId) {
  chatId = Number(chatId || env.TELEGRAM_OWNER_ID);
  if (!text || !chatId || isNaN(chatId)) return { ok: false, error: 'invalid chatId or text' };

  const MAX_RETRIES = 2;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const resp = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: text.substring(0, 4096), disable_web_page_preview: true }),
        signal: AbortSignal.timeout(10000),
      });
      const data = await resp.json();
      if (data.ok) return { ok: true };

      // Rate limited — honor retry_after
      if (data.error_code === 429 && attempt < MAX_RETRIES) {
        const wait = (data.parameters?.retry_after || 3) * 1000;
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      // Server error — retry with backoff
      if (data.error_code >= 500 && attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      // Non-retryable failure
      await logToD1(env, 'telegram.send_fail', `sendMessage failed: ${data.description}`, { chatId, error_code: data.error_code, attempt });
      return { ok: false, error: data.description };
    } catch (e) {
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      await logToD1(env, 'telegram.send_fail', `sendMessage exception: ${e.message}`, { chatId, attempt });
      return { ok: false, error: e.message };
    }
  }
  return { ok: false, error: 'max retries exceeded' };
}

async function sendTelegramPhoto(env, chatId, photoUrl, caption) {
  chatId = Number(chatId);
  const MAX_RETRIES = 2;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const resp = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, photo: photoUrl, caption: caption?.substring(0, 1024) }),
        signal: AbortSignal.timeout(10000),
      });
      const data = await resp.json();
      if (data.ok) return { ok: true };
      if (data.error_code === 429 && attempt < MAX_RETRIES) { await new Promise(r => setTimeout(r, (data.parameters?.retry_after || 3) * 1000)); continue; }
      if (data.error_code >= 500 && attempt < MAX_RETRIES) { await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); continue; }
      await logToD1(env, 'telegram.send_fail', `sendPhoto failed: ${data.description}`, { chatId, attempt });
      return { ok: false, error: data.description };
    } catch (e) {
      if (attempt < MAX_RETRIES) { await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); continue; }
      await logToD1(env, 'telegram.send_fail', `sendPhoto exception: ${e.message}`, { chatId, attempt });
      return { ok: false, error: e.message };
    }
  }
  return { ok: false, error: 'max retries exceeded' };
}

async function sendTelegramPhotoBuffer(env, chatId, buffer, caption) {
  chatId = Number(chatId);
  const form = new FormData();
  form.append('chat_id', chatId);
  form.append('photo', new Blob([buffer], { type: 'image/png' }), 'image.png');
  if (caption) form.append('caption', caption.substring(0, 1024));
  const MAX_RETRIES = 2;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const resp = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`, { method: 'POST', body: form, signal: AbortSignal.timeout(10000) });
      const data = await resp.json();
      if (data.ok) return { ok: true };
      if (data.error_code === 429 && attempt < MAX_RETRIES) { await new Promise(r => setTimeout(r, (data.parameters?.retry_after || 3) * 1000)); continue; }
      if (data.error_code >= 500 && attempt < MAX_RETRIES) { await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); continue; }
      await logToD1(env, 'telegram.send_fail', `sendPhotoBuffer failed: ${data.description}`, { chatId, attempt });
      return { ok: false, error: data.description };
    } catch (e) {
      if (attempt < MAX_RETRIES) { await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); continue; }
      await logToD1(env, 'telegram.send_fail', `sendPhotoBuffer exception: ${e.message}`, { chatId, attempt });
      return { ok: false, error: e.message };
    }
  }
  return { ok: false, error: 'max retries exceeded' };
}

// ============================================================
// METRICS / LOGS / HEALTH API HANDLERS
// ============================================================
async function handleMetricsPost(request, env) {
  const body = await request.json();
  const metrics = Array.isArray(body) ? body : [body];
  const stmt = env.DB.prepare('INSERT INTO metrics (node, namespace, metric_name, value, unit, dimensions) VALUES (?, ?, ?, ?, ?, ?)');
  await env.DB.batch(metrics.map(m => stmt.bind(m.node, m.namespace, m.metric_name, m.value, m.unit || 'Count', m.dimensions || null)));
  return json({ ok: true, inserted: metrics.length });
}

async function handleMetricsGet(url, env) {
  const node = url.searchParams.get('node');
  const ns = url.searchParams.get('namespace');
  const last = parseInt(url.searchParams.get('last') || '60');
  let q = "SELECT * FROM metrics WHERE ts > datetime('now', ? || ' minutes')";
  const p = [`-${last}`];
  if (node) { q += ' AND node = ?'; p.push(node); }
  if (ns) { q += ' AND namespace = ?'; p.push(ns); }
  q += ' ORDER BY ts DESC LIMIT 500';
  const { results } = await env.DB.prepare(q).bind(...p).all();
  return json({ metrics: results, count: results.length });
}

async function handleLogsPost(request, env) {
  const body = await request.json();
  const logs = Array.isArray(body) ? body : [body];
  const stmt = env.DB.prepare('INSERT INTO edge_logs (node, event_type, message, data) VALUES (?, ?, ?, ?)');
  await env.DB.batch(logs.map(l => stmt.bind(l.node, l.event_type, l.message || null, l.data ? JSON.stringify(l.data) : null)));
  return json({ ok: true, inserted: logs.length });
}

async function handleLogsGet(url, env) {
  const node = url.searchParams.get('node');
  const type = url.searchParams.get('type');
  const last = parseInt(url.searchParams.get('last') || '60');
  let q = "SELECT * FROM edge_logs WHERE ts > datetime('now', ? || ' minutes')";
  const p = [`-${last}`];
  if (node) { q += ' AND node = ?'; p.push(node); }
  if (type) { q += ' AND event_type = ?'; p.push(type); }
  q += ' ORDER BY ts DESC LIMIT 200';
  const { results } = await env.DB.prepare(q).bind(...p).all();
  return json({ logs: results, count: results.length });
}

async function handleHealthPost(request, env) {
  const body = await request.json();
  const checks = Array.isArray(body) ? body : [body];
  const stmt = env.DB.prepare('INSERT INTO health_checks (node, endpoint, status, response_ms, error) VALUES (?, ?, ?, ?, ?)');
  await env.DB.batch(checks.map(c => stmt.bind(c.node, c.endpoint, c.status, c.response_ms || null, c.error || null)));
  return json({ ok: true, inserted: checks.length });
}

async function handleHealthGet(url, env) {
  const node = url.searchParams.get('node');
  const last = parseInt(url.searchParams.get('last') || '60');
  let q = "SELECT * FROM health_checks WHERE ts > datetime('now', ? || ' minutes')";
  const p = [`-${last}`];
  if (node) { q += ' AND node = ?'; p.push(node); }
  q += ' ORDER BY ts DESC LIMIT 200';
  const { results } = await env.DB.prepare(q).bind(...p).all();
  return json({ health: results, count: results.length });
}

async function handleTelegramHealth(env) {
  const result = { bot_token_valid: false, webhook_url: null, webhook_ok: false, webhook_errors: null, owner_id_numeric: false, healthy: false };
  try {
    // Check bot token via getMe
    const meResp = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getMe`, { signal: AbortSignal.timeout(8000) });
    const meData = await meResp.json();
    result.bot_token_valid = meData.ok === true;
    if (meData.ok) result.bot_username = meData.result.username;

    // Check webhook
    const whResp = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getWebhookInfo`, { signal: AbortSignal.timeout(8000) });
    const whData = await whResp.json();
    const wh = whData.result || {};
    result.webhook_url = wh.url || null;
    result.webhook_ok = wh.url === 'https://edge-api.navada-edge-server.uk/telegram/webhook';
    if (wh.last_error_message) result.webhook_errors = { message: wh.last_error_message, date: new Date((wh.last_error_date || 0) * 1000).toISOString() };
    result.pending_updates = wh.pending_update_count || 0;

    // Check owner ID
    const ownerId = env.TELEGRAM_OWNER_ID;
    result.owner_id_numeric = !isNaN(Number(ownerId)) && Number(ownerId) > 0;
    result.owner_id = ownerId;

    result.healthy = result.bot_token_valid && result.webhook_ok && result.owner_id_numeric;
  } catch (e) {
    result.error = e.message;
  }
  return json(result, result.healthy ? 200 : 503);
}

async function handleStatus(env) {
  const [m, l, h] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) as c FROM metrics WHERE ts > datetime('now', '-1 hour')").first(),
    env.DB.prepare("SELECT COUNT(*) as c FROM edge_logs WHERE ts > datetime('now', '-1 hour')").first(),
    env.DB.prepare("SELECT COUNT(*) as c FROM health_checks WHERE ts > datetime('now', '-1 hour')").first(),
  ]);
  return json({ status: 'online', database: 'D1', region: 'WEUR', last_hour: { metrics: m.c, logs: l.c, health_checks: h.c }, ts: new Date().toISOString() });
}

// ============================================================
// D1 LOGGING HELPER
// ============================================================
async function logToD1(env, eventType, message, data) {
  try { await env.DB.prepare('INSERT INTO edge_logs (node, event_type, message, data) VALUES (?, ?, ?, ?)').bind('Cloudflare', eventType, message, typeof data === 'string' ? data : JSON.stringify(data || null)).run(); } catch {}
}

// ============================================================
// HELPERS
// ============================================================
function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
}

function splitMessage(text, maxLen) {
  const chunks = [];
  while (text.length > 0) {
    chunks.push(text.substring(0, maxLen));
    text = text.substring(maxLen);
  }
  return chunks;
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
