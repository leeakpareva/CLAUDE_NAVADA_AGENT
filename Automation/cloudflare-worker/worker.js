/**
 * NAVADA Edge API — Cloudflare Worker + D1
 * Claude Chief of Staff: Telegram bot, metrics, health, scheduled events.
 * Replaces: telegram-bot.js, hp-cloudwatch-metrics, hp-health-monitor, all scheduled tasks.
 * Zero terminals, 24/7, globally distributed, free tier.
 */

const MODELS = { sonnet: 'claude-sonnet-4-6', opus: 'claude-opus-4-6' };
const MAX_HISTORY = 30;
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

    // Public routes (no auth)
    if (path === '/traffic') return handleTrafficDashboard(env);
    // live.navada-edge-server.uk — animated canvas traffic visualiser
    if (url.hostname === 'live.navada-edge-server.uk' || path === '/live') return handleLiveTraffic(env);

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
        // Keep SageMaker YOLO warm — tiny ping to prevent cold starts
        await warmSageMaker(env);
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
  const text = message.text || message.caption || '';

  // Auth check
  const auth = await checkUser(env, userId);
  if (!auth.authorized) {
    await sendTelegram(env, 'Access denied. Contact Lee Akpareva to request access.\nwww.navada-lab.space', chatId);
    return json({ ok: true });
  }

  const isAdminUser = auth.role === 'admin';

  // Detect photo/document (image) uploads
  const hasPhoto = message.photo && message.photo.length > 0;
  const hasImageDoc = message.document && message.document.mime_type?.startsWith('image/');

  // Log incoming
  await env.DB.prepare('INSERT INTO command_log (user_id, command, message) VALUES (?, ?, ?)').bind(userId, hasPhoto ? 'photo' : hasImageDoc ? 'image_doc' : text.startsWith('/') ? text.split(' ')[0] : 'chat', text.substring(0, 500) || (hasPhoto ? '[photo]' : '[file]')).run();

  try {
    // Photo/image handling — Claude Vision + AWS Rekognition
    if (hasPhoto || hasImageDoc) {
      await handlePhotoMessage(env, message, text, userId, username, isAdminUser, chatId);
    } else if (text.startsWith('/')) {
      // Command routing
      const [cmd, ...args] = text.split(' ');
      const command = cmd.slice(1).toLowerCase();
      const argText = args.join(' ');

      const response = await handleCommand(env, command, argText, userId, username, isAdminUser, chatId, message);
      if (response) {
        await sendTelegram(env, response, chatId);
      }
    } else if (text) {
      // Natural language — Claude AI
      await handleAIChat(env, text, userId, username, isAdminUser, chatId);
    } else {
      await sendTelegram(env, 'Send me a message, photo, or use /help for commands.', chatId);
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
async function handleCommand(env, command, args, userId, username, isAdmin, chatId, message) {
  // Guest-safe commands
  switch (command) {
    case 'start':
      return 'Welcome to NAVADA Edge. I\'m Claude, Chief of Staff.\n\nType anything to chat, or use /help for commands.';

    case 'help':
      return `NAVADA Edge Commands

System: /status /uptime /about /ping /health /id
AI: Just type naturally
Vision: /yolo /describe /vision
Creative: /image /flux /diagram
Model: /sonnet /opus /auto /model
Memory: /memory /clear /costs /usage
${isAdmin ? 'Admin: /shell /run /ls /cat /docker\nComms: /email /inbox /sms /call\nPM2: /pm2 /pm2restart /pm2stop /pm2start /pm2logs\nOps: /briefing /report /logs /webhook /test\n\nVision: Send photo to describe, or caption /yolo for object detection' : ''}

Or just send me a message and I\'ll respond.`;

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

    case 'yolo': {
      // YOLO object detection — needs a photo (reply to one, or send with caption /yolo)
      const replyMsg = message?.reply_to_message;
      if (replyMsg && (replyMsg.photo || replyMsg.document?.mime_type?.startsWith('image/'))) {
        await handleYoloDetection(env, replyMsg, userId, chatId);
        return null;
      }
      return 'Send a photo with caption /yolo, or reply to a photo with /yolo';
    }

    case 'describe': {
      // Claude Vision description — needs a photo
      const descReplyMsg = message?.reply_to_message;
      if (descReplyMsg && (descReplyMsg.photo || descReplyMsg.document?.mime_type?.startsWith('image/'))) {
        await handleDescribePhoto(env, descReplyMsg, args || null, userId, username, isAdmin, chatId);
        return null;
      }
      return 'Send a photo with caption /describe, or reply to a photo with /describe [question]';
    }

    case 'vision': {
      // Search vision memory
      if (!args) {
        const count = await env.DB.prepare('SELECT COUNT(*) as c FROM vision_memory WHERE user_id = ?').bind(userId).first();
        return `Vision Memory: ${count?.c || 0} images analysed\n\nUsage: /vision <search term>\nExample: /vision person, /vision car, /vision text`;
      }
      const memories = await searchVisionMemory(env, userId, args, 5);
      if (memories.length === 0) return `No vision memories matching "${args}"`;
      return memories.map((m, i) => `${i+1}. [${m.analysis_type}] ${m.ts}\n${m.labels ? 'Labels: ' + m.labels : ''}\n${m.description ? m.description.substring(0, 200) + '...' : m.detections ? JSON.parse(m.detections).length + ' objects' : ''}`).join('\n\n');
    }

    case 'diagram':
      if (!args) return 'Usage: /diagram <mermaid code or description>\n\nExamples:\n/diagram graph TD; A-->B; B-->C\n/diagram architecture of NAVADA Edge network';
      return await generateDiagram(env, args, chatId, userId, username, isAdmin);

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

    case 'docker':
      if (!isAdmin) return 'Admin only.';
      return await forwardShellToEC2(env, `docker ${args || 'ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"'}`);

    case 'email':
    case 'emailme':
      if (!isAdmin) return 'Admin only.';
      if (!args) return 'Usage: /email <to> | <subject> | <body>\nExample: /email lee@example.com | Test | Hello from Claude';
      await handleAIChat(env, `Send this email: ${args}`, userId, username, isAdmin, chatId, 'opus');
      return null;

    case 'inbox':
      if (!isAdmin) return 'Admin only.';
      await handleAIChat(env, 'Check my email inbox and summarise the latest emails', userId, username, isAdmin, chatId, 'opus');
      return null;

    case 'briefing':
      if (!isAdmin) return 'Admin only.';
      await handleAIChat(env, 'Give me my morning briefing: system status, any alerts, pending tasks, weather, and top AI/tech news', userId, username, isAdmin, chatId, 'opus');
      return null;

    case 'report':
      if (!isAdmin) return 'Admin only.';
      await handleAIChat(env, `Generate a status report for NAVADA Edge: ${args || 'current system health, API usage, costs, and any issues'}`, userId, username, isAdmin, chatId, 'opus');
      return null;

    case 'usage': {
      if (!isAdmin) return 'Admin only.';
      const today = new Date().toISOString().slice(0, 10);
      const week = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      const [todayStats, weekStats, visionCount] = await Promise.all([
        env.DB.prepare("SELECT COUNT(*) as c, SUM(cost) as cost FROM command_log WHERE ts > ?").bind(today).first(),
        env.DB.prepare("SELECT COUNT(*) as c, SUM(cost) as cost FROM command_log WHERE ts > ?").bind(week).first(),
        env.DB.prepare("SELECT COUNT(*) as c FROM vision_memory").first(),
      ]);
      return `NAVADA Usage Stats\n\nToday: ${todayStats?.c || 0} commands, £${(todayStats?.cost || 0).toFixed(4)}\nThis week: ${weekStats?.c || 0} commands, £${(weekStats?.cost || 0).toFixed(4)}\nVision memory: ${visionCount?.c || 0} images analysed`;
    }

    case 'nodes':
    case 'health':
      return await checkAllNodes(env);

    case 'id':
      return `Your Telegram ID: ${userId}\nUsername: @${username}\nRole: ${isAdmin ? 'admin' : 'guest'}`;

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

  // Build system prompt with recent activity context (persistent memory)
  let activityContext = '';
  if (isAdmin) {
    activityContext = await getRecentActivityContext(env, userId);
  }
  const systemPrompt = isAdmin
    ? getAdminSystemPrompt(env, modelName) + activityContext
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
// PHOTO/IMAGE HANDLING — /yolo, /describe, and auto-detect
// ============================================================

// Download a Telegram photo and return { base64, mediaType, buffer }
async function downloadTelegramPhoto(env, message) {
  let fileId;
  if (message.photo && message.photo.length > 0) {
    fileId = message.photo[message.photo.length - 1].file_id;
  } else if (message.document) {
    fileId = message.document.file_id;
  }
  if (!fileId) throw new Error('No image found in message');

  const fileResp = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getFile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_id: fileId }),
    signal: AbortSignal.timeout(10000),
  });
  const fileData = await fileResp.json();
  if (!fileData.ok || !fileData.result?.file_path) throw new Error(fileData.description || 'getFile failed');

  const imageUrl = `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${fileData.result.file_path}`;
  const imageResp = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) });
  if (!imageResp.ok) throw new Error(`Download failed: HTTP ${imageResp.status}`);

  const buffer = await imageResp.arrayBuffer();
  const filePath = fileData.result.file_path || '';
  let mediaType = 'image/jpeg';
  if (filePath.endsWith('.png')) mediaType = 'image/png';
  else if (filePath.endsWith('.gif')) mediaType = 'image/gif';
  else if (filePath.endsWith('.webp')) mediaType = 'image/webp';

  return { base64: arrayBufferToBase64(buffer), mediaType, buffer };
}

// Route photo messages to the right handler
async function handlePhotoMessage(env, message, caption, userId, username, isAdmin, chatId) {
  const lowerCaption = (caption || '').toLowerCase().trim();

  // If caption starts with /yolo, run YOLO object detection
  if (lowerCaption.startsWith('/yolo') || lowerCaption === 'yolo') {
    return handleYoloDetection(env, message, userId, chatId);
  }

  // Default: Claude Vision describe
  return handleDescribePhoto(env, message, caption, userId, username, isAdmin, chatId);
}

// ============================================================
// /yolo — YOLO Object Detection with bounding boxes
// ============================================================
async function handleYoloDetection(env, message, userId, chatId) {
  await sendTelegram(env, 'Running YOLO object detection...', chatId);

  try {
    const { base64: imageBase64, buffer } = await downloadTelegramPhoto(env, message);

    // Route through EC2 — it responds immediately, processes async (calls SageMaker + draws boxes + sends to Telegram)
    // Worker just needs EC2 to accept the job — EC2 handles the 60-90s SageMaker cold start internally
    try {
      const ec2Resp = await fetch(`http://${env.EC2_IP || '3.11.119.181'}:9090/yolo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': env.EC2_API_KEY || 'navada-ec2' },
        body: JSON.stringify({
          imageBase64,
          chatId: Number(chatId),
          botToken: env.TELEGRAM_BOT_TOKEN,
        }),
        signal: AbortSignal.timeout(10000), // EC2 responds immediately with {ok:true, status:'processing'}
      });

      if (ec2Resp.ok) {
        const result = await ec2Resp.json();
        await logToD1(env, 'vision.yolo', `YOLO job sent to EC2 (async processing)`, { userId, ec2Status: result.status });
        // EC2 handles the rest: SageMaker call, bounding boxes, Telegram send
        return;
      }
    } catch (ec2Err) {
      await logToD1(env, 'vision.yolo_ec2_fail', `EC2 /yolo unreachable: ${ec2Err.message}, falling back to direct`, { userId });
    }

    // Fallback: try calling YOLO directly from Worker (works if endpoint is warm, no bounding boxes)
    return await handleYoloDirectFallback(env, imageBase64, buffer, userId, chatId);
  } catch (e) {
    // Fallback: try direct YOLO call
    try {
      const { base64: imageBase64, buffer } = await downloadTelegramPhoto(env, message);
      return await handleYoloDirectFallback(env, imageBase64, buffer, userId, chatId);
    } catch (e2) {
      await logToD1(env, 'error', `YOLO failed: ${e.message} / fallback: ${e2.message}`);
      await sendTelegram(env, `YOLO error: ${e.message}`, chatId);
    }
  }
}

// Direct YOLO call from Worker — works when SageMaker endpoint is warm (<30s)
async function handleYoloDirectFallback(env, imageBase64, buffer, userId, chatId) {
  try {
    const yoloResp = await fetch('https://xxqtcilmzi.execute-api.eu-west-2.amazonaws.com/vision/yolo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, confidence: 0.25, maxDetections: 50 }),
      signal: AbortSignal.timeout(25000),
    });

    if (!yoloResp.ok) {
      await sendTelegram(env, `YOLO endpoint error: HTTP ${yoloResp.status}. SageMaker may be warming up, try again in 30s.`, chatId);
      return;
    }

    const yoloData = await yoloResp.json();
    const detections = yoloData.detections || [];
    const imageSize = yoloData.imageSize || null;

    if (detections.length === 0) {
      await sendTelegram(env, 'No objects detected in this image.', chatId);
      await saveVisionMemory(env, userId, 'yolo', null, '[]', null, null, null);
      return;
    }

    // Try EC2 annotation
    let annotatedSent = false;
    try {
      const annotateResp = await fetch(`http://${env.EC2_IP || '3.11.119.181'}:9090/annotate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': env.EC2_API_KEY || 'navada-ec2' },
        body: JSON.stringify({ imageBase64, detections, imageSize }),
        signal: AbortSignal.timeout(15000),
      });
      if (annotateResp.ok) {
        const annotatedBuffer = await annotateResp.arrayBuffer();
        if (annotatedBuffer.byteLength > 1000) {
          const caption = buildYoloCaption(detections, imageSize, 'AWS SageMaker');
          await sendTelegramPhotoBuffer(env, chatId, annotatedBuffer, caption.substring(0, 1024));
          annotatedSent = true;
        }
      }
    } catch {}

    if (!annotatedSent) {
      const caption = buildYoloCaption(detections, imageSize, 'AWS SageMaker');
      await sendTelegramPhotoBuffer(env, chatId, buffer, caption.substring(0, 1024));
      if (caption.length > 1024) await sendTelegram(env, caption, chatId);
    }

    const labels = [...new Set(detections.map(d => d.label || d.class || d.name || 'unknown'))].join(', ');
    await saveVisionMemory(env, userId, 'yolo', null, JSON.stringify(detections), null, labels, null);
    await logToD1(env, 'vision.yolo', `YOLO fallback: ${detections.length} objects`, { userId, classes: labels });
  } catch (e) {
    await logToD1(env, 'error', `YOLO direct fallback failed: ${e.message}`);
    await sendTelegram(env, `YOLO failed: SageMaker may need 30-60s cold start. Try again shortly.`, chatId);
  }
}

function buildYoloCaption(detections, imageSize, source) {
  const counts = {};
  let totalConf = 0;
  detections.forEach(d => {
    const label = d.label || d.class || d.name || 'unknown';
    const conf = d.confidence || d.score || 0;
    counts[label] = (counts[label] || 0) + 1;
    totalConf += conf;
  });
  const avgConf = totalConf / detections.length;
  const uniqueClasses = Object.keys(counts).length;

  let msg = 'NAVADA Vision — YOLO Detection\n';
  msg += '================================\n\n';

  detections.forEach((d, i) => {
    const label = d.label || d.class || d.name || 'unknown';
    const conf = d.confidence || d.score || 0;
    const bbox = d.bbox || {};
    const bboxW = Math.round((bbox.x2 || 0) - (bbox.x1 || 0));
    const bboxH = Math.round((bbox.y2 || 0) - (bbox.y1 || 0));
    msg += `${i + 1}. ${label} — ${(conf * 100).toFixed(1)}%`;
    if (bboxW > 0 && bboxH > 0) msg += ` [${bboxW}x${bboxH}px]`;
    msg += '\n';
  });

  msg += '\n--- Summary ---\n';
  msg += `Objects: ${detections.length} detected\n`;
  msg += `Classes: ${uniqueClasses} unique (${Object.entries(counts).map(([k, v]) => v > 1 ? `${k} x${v}` : k).join(', ')})\n`;
  msg += `Avg confidence: ${(avgConf * 100).toFixed(1)}%\n`;
  if (imageSize) msg += `Image: ${imageSize.width}x${imageSize.height}px\n`;
  msg += `Model: YOLOv8n\nSource: ${source}`;
  return msg;
}

// ============================================================
// /describe — Claude Vision photo description
// ============================================================
async function handleDescribePhoto(env, message, caption, userId, username, isAdmin, chatId) {
  await sendTelegram(env, 'Analysing image with Claude Vision...', chatId);

  try {
    const { base64: imageBase64, mediaType } = await downloadTelegramPhoto(env, message);

    const userPrompt = (caption && !caption.startsWith('/'))
      ? caption
      : 'Analyse this image in detail. Identify any people, objects, text, brands, locations, and anything notable. If there is a person, describe their appearance, clothing, expression, and any identifying details.';

    // Load conversation history (text only, no old images)
    const history = await env.DB.prepare('SELECT role, content FROM conversations WHERE user_id = ? ORDER BY ts DESC LIMIT ?').bind(userId, MAX_HISTORY * 2).all();
    const messages = (history.results || []).reverse().map(r => ({ role: r.role, content: r.content }));

    // Add image message
    messages.push({
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
        { type: 'text', text: userPrompt },
      ],
    });

    // Use Opus for vision
    const model = MODELS.opus;
    const systemPrompt = isAdmin
      ? getAdminSystemPrompt(env, 'Opus 4.6') + '\n\nThe user has sent you an image. Analyse it thoroughly. Identify people, objects, text, brands, locations, emotions, and anything notable. Be specific and detailed. If you recognise a public figure, say who you think it is.'
      : getGuestSystemPrompt('Opus 4.6');

    const claudeResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model, max_tokens: 2048, system: systemPrompt, messages }),
      signal: AbortSignal.timeout(30000),
    });
    const claudeResult = await claudeResp.json();

    let visionReply = '';
    if (claudeResult.error) {
      await logToD1(env, 'error', `Vision API error: ${claudeResult.error.message}`, { model });
      visionReply = `Vision error: ${claudeResult.error.message}`;
    } else {
      visionReply = (claudeResult.content || []).filter(b => b.type === 'text').map(b => b.text).join('') || '(No response)';
    }

    // Also run AWS Rekognition in parallel for faces/labels
    let awsInfo = '';
    let facesData = [], labelsData = [], faceMatches = [];
    try {
      const [detectResp, faceResp] = await Promise.all([
        fetch('https://xxqtcilmzi.execute-api.eu-west-2.amazonaws.com/vision/detect', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64, includeLabels: true, includeFaces: true, includeCelebrities: true }),
          signal: AbortSignal.timeout(15000),
        }).catch(() => null),
        fetch('https://xxqtcilmzi.execute-api.eu-west-2.amazonaws.com/vision/faces', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: imageBase64, action: 'search' }),
          signal: AbortSignal.timeout(15000),
        }).catch(() => null),
      ]);

      if (detectResp?.ok) {
        const d = await detectResp.json();
        facesData = d.faces || [];
        labelsData = d.labels || [];
        const celebrities = d.celebrities || [];
        if (facesData.length > 0 || labelsData.length > 0 || celebrities.length > 0) {
          awsInfo = '\n\nAWS Rekognition:';
          if (celebrities.length > 0) awsInfo += `\nCelebrities: ${celebrities.map(c => `${c.Name || c.name} (${Math.round(c.Confidence || c.confidence || 0)}%)`).join(', ')}`;
          if (facesData.length > 0) awsInfo += `\nFaces: ${facesData.length} detected` + facesData.map((f, i) => `\n  Face ${i+1}: ${f.Gender?.Value || '?'}, ~${Math.round(f.AgeRange?.Low || 0)}-${Math.round(f.AgeRange?.High || 0)}y, ${(f.Emotions || []).filter(e => e.Confidence > 50).map(e => e.Type.toLowerCase()).join('/') || 'neutral'}`).join('');
          if (labelsData.length > 0) awsInfo += `\nLabels: ${labelsData.slice(0, 12).map(l => l.Name || l.name).join(', ')}`;
        }
      }

      if (faceResp?.ok) {
        const fd = await faceResp.json();
        faceMatches = fd.matches || fd.FaceMatches || [];
        if (faceMatches.length > 0) {
          awsInfo += `\nKnown faces: ${faceMatches.map(m => `${m.name || m.ExternalImageId || 'Unknown'} (${Math.round(m.similarity || m.Similarity || 0)}%)`).join(', ')}`;
        }
      }
    } catch {}

    const fullReply = visionReply + awsInfo;

    // Save to conversation + vision memory
    const tokensIn = claudeResult.usage?.input_tokens || 0;
    const tokensOut = claudeResult.usage?.output_tokens || 0;
    const cost = (tokensIn * 15 + tokensOut * 75) / 1e6 * 0.79;

    await env.DB.batch([
      env.DB.prepare('INSERT INTO conversations (user_id, role, content, model) VALUES (?, ?, ?, ?)').bind(userId, 'user', `[Photo] ${userPrompt}`, model),
      env.DB.prepare('INSERT INTO conversations (user_id, role, content, model) VALUES (?, ?, ?, ?)').bind(userId, 'assistant', fullReply.substring(0, 10000), model),
    ]);

    await env.DB.prepare('UPDATE command_log SET response = ?, model = ?, cost = ? WHERE id = (SELECT MAX(id) FROM command_log WHERE user_id = ?)').bind(fullReply.substring(0, 500), model, cost, userId).run();

    // Save to vision_memory for RAG
    await saveVisionMemory(env, userId, 'describe', userPrompt, null, fullReply,
      labelsData.slice(0, 20).map(l => l.Name || l.name).join(', '),
      facesData.length > 0 ? JSON.stringify(facesData.map(f => ({ gender: f.Gender?.Value, age: `${f.AgeRange?.Low}-${f.AgeRange?.High}`, emotions: (f.Emotions || []).filter(e => e.Confidence > 50).map(e => e.Type) }))) : null,
      model, tokensIn, tokensOut, cost
    );

    // Send reply
    if (fullReply.length <= MAX_MSG_LEN) {
      await sendTelegram(env, fullReply, chatId);
    } else {
      const chunks = splitMessage(fullReply, MAX_MSG_LEN);
      for (const chunk of chunks) { await sendTelegram(env, chunk, chatId); }
    }

    await logToD1(env, 'vision.describe', `Photo described: ${tokensIn}in/${tokensOut}out`, { userId, mediaType, hasAws: !!awsInfo });
  } catch (e) {
    await logToD1(env, 'error', `Describe failed: ${e.message}`);
    await sendTelegram(env, `Image analysis failed: ${e.message}`, chatId);
  }
}

// ============================================================
// VISION MEMORY — RAG storage in D1 (free)
// ============================================================
async function saveVisionMemory(env, userId, analysisType, prompt, detections, description, labels, faces, model, tokensIn, tokensOut, cost) {
  try {
    await env.DB.prepare(
      'INSERT INTO vision_memory (user_id, analysis_type, prompt, detections, description, labels, faces, model, tokens_in, tokens_out, cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(userId, analysisType, prompt || null, detections || null, description?.substring(0, 10000) || null, labels || null, faces || null, model || null, tokensIn || 0, tokensOut || 0, cost || 0).run();
  } catch {}
}

async function searchVisionMemory(env, userId, query, limit = 5) {
  try {
    // Search across descriptions, labels, and faces
    const results = await env.DB.prepare(
      "SELECT analysis_type, prompt, description, labels, faces, detections, ts FROM vision_memory WHERE user_id = ? AND (description LIKE ? OR labels LIKE ? OR faces LIKE ? OR detections LIKE ?) ORDER BY ts DESC LIMIT ?"
    ).bind(userId, `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, limit).all();
    return results.results || [];
  } catch { return []; }
}

// Base64 helper for ArrayBuffer
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
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
    { name: 'query_activity', description: 'Search your own activity history and memory. Use this to recall what you did, commands processed, errors, emails sent, or any past actions. Searches command_log, edge_logs, and vision_memory tables. Always use this tool when asked about past actions, history, or "what did we do".', input_schema: { type: 'object', properties: { query: { type: 'string', description: 'What to search for (e.g. "emails sent today", "errors this week", "diagram commands")' }, hours: { type: 'number', description: 'How many hours back to search (default 24, max 168)' } }, required: ['query'] } },
    { name: 'analyse_image', description: 'Analyse an image URL using AWS Rekognition (face detection, labels, face recognition). Use when the user references a previously sent image or provides a URL.', input_schema: { type: 'object', properties: { image_url: { type: 'string', description: 'URL of the image to analyse' } }, required: ['image_url'] } },
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

      case 'query_activity': {
        if (!isAdmin) return 'Permission denied.';
        const hours = Math.min(input.hours || 24, 168);
        const q = (input.query || '').toLowerCase();
        const parts = [];

        // Search command_log
        const cmds = await env.DB.prepare(
          `SELECT command, message, response, model, cost, ts FROM command_log WHERE ts > datetime('now', '-${hours} hours') ORDER BY ts DESC LIMIT 50`
        ).bind().all();
        if (cmds.results?.length) {
          const filtered = q ? cmds.results.filter(c =>
            (c.command || '').toLowerCase().includes(q) ||
            (c.message || '').toLowerCase().includes(q) ||
            (c.response || '').toLowerCase().includes(q)
          ) : cmds.results;
          if (filtered.length) {
            parts.push(`Commands (${filtered.length} matches):`);
            for (const c of filtered.slice(0, 25)) {
              parts.push(`  [${c.ts}] /${c.command}: ${(c.message || '').substring(0, 100)} -> ${(c.response || '').substring(0, 150)}`);
            }
          }
        }

        // Search edge_logs
        const logs = await env.DB.prepare(
          `SELECT event_type, message, source, ts FROM edge_logs WHERE ts > datetime('now', '-${hours} hours') ORDER BY ts DESC LIMIT 50`
        ).bind().all();
        if (logs.results?.length) {
          const filtered = q ? logs.results.filter(l =>
            (l.event_type || '').toLowerCase().includes(q) ||
            (l.message || '').toLowerCase().includes(q) ||
            (l.source || '').toLowerCase().includes(q)
          ) : logs.results;
          if (filtered.length) {
            parts.push(`\nSystem events (${filtered.length} matches):`);
            for (const l of filtered.slice(0, 25)) {
              parts.push(`  [${l.ts}] ${l.event_type}: ${(l.message || '').substring(0, 150)}`);
            }
          }
        }

        // Search vision_memory
        const vis = await env.DB.prepare(
          `SELECT analysis_type, labels, description, ts FROM vision_memory WHERE ts > datetime('now', '-${hours} hours') ORDER BY ts DESC LIMIT 20`
        ).bind().all();
        if (vis.results?.length) {
          parts.push(`\nVision memory (${vis.results.length} entries):`);
          for (const v of vis.results) {
            parts.push(`  [${v.ts}] ${v.analysis_type}: ${v.labels || ''} ${(v.description || '').substring(0, 100)}`);
          }
        }

        return parts.length > 0 ? parts.join('\n') : `No activity found in the last ${hours} hours matching "${input.query}".`;
      }

      case 'analyse_image': {
        if (!isAdmin) return 'Permission denied.';
        try {
          const imgResp = await fetch(input.image_url, { signal: AbortSignal.timeout(15000) });
          if (!imgResp.ok) return `Failed to fetch image: HTTP ${imgResp.status}`;
          const imgBuf = await imgResp.arrayBuffer();
          const imgB64 = arrayBufferToBase64(imgBuf);
          const parts = [];
          // Rekognition detect (faces + labels)
          const detectResp = await fetch('https://xxqtcilmzi.execute-api.eu-west-2.amazonaws.com/vision/detect', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imgB64, features: ['faces', 'labels'] }),
            signal: AbortSignal.timeout(15000),
          });
          if (detectResp.ok) {
            const d = await detectResp.json();
            if (d.faces?.length) parts.push(`Faces: ${d.faces.length} detected. ` + d.faces.map((f, i) => `Face ${i+1}: ${f.Gender?.Value || '?'}, ~${f.AgeRange?.Low}-${f.AgeRange?.High}y, ${(f.Emotions||[]).filter(e=>e.Confidence>50).map(e=>e.Type).join('/')}`).join('. '));
            if (d.labels?.length) parts.push(`Labels: ${d.labels.slice(0,15).map(l=>l.Name).join(', ')}`);
          }
          // Face search (known faces)
          const faceResp = await fetch('https://xxqtcilmzi.execute-api.eu-west-2.amazonaws.com/vision/faces', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imgB64, action: 'search' }),
            signal: AbortSignal.timeout(15000),
          });
          if (faceResp.ok) {
            const fd = await faceResp.json();
            const matches = fd.matches || fd.FaceMatches || [];
            if (matches.length) parts.push(`Known faces: ${matches.map(m => `${m.name || m.ExternalImageId || 'Unknown'} (${Math.round(m.similarity || m.Similarity || 0)}%)`).join(', ')}`);
          }
          return parts.length > 0 ? parts.join('\n') : 'No faces or labels detected.';
        } catch (e) {
          return `Vision analysis failed: ${e.message}`;
        }
      }

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
// ============================================================
// PERSISTENT MEMORY — Activity context injected into system prompt
// ============================================================
async function getRecentActivityContext(env, userId) {
  try {
    // Get recent commands (last 6 hours)
    const commands = await env.DB.prepare(
      "SELECT command, message, response, model, cost, ts FROM command_log WHERE user_id = ? AND ts > datetime('now', '-6 hours') ORDER BY ts DESC LIMIT 25"
    ).bind(userId).all();

    // Get recent edge_logs (last 6 hours) — actions taken by the system
    const logs = await env.DB.prepare(
      "SELECT event_type, message, ts FROM edge_logs WHERE ts > datetime('now', '-6 hours') AND event_type NOT LIKE 'test.%' AND event_type != 'sagemaker.warm' ORDER BY ts DESC LIMIT 20"
    ).bind().all();

    // Get vision memory (last 24 hours)
    const visions = await env.DB.prepare(
      "SELECT analysis_type, labels, description, ts FROM vision_memory WHERE user_id = ? AND ts > datetime('now', '-24 hours') ORDER BY ts DESC LIMIT 5"
    ).bind(userId).all();

    let ctx = '\n\nRECENT ACTIVITY LOG (your memory of this session):';

    if (commands.results?.length > 0) {
      ctx += '\n\nCommands processed (newest first):';
      for (const c of commands.results) {
        const time = c.ts?.substring(11, 16) || '';
        const resp = c.response ? ` -> ${c.response.substring(0, 120)}` : '';
        ctx += `\n  [${time}] ${c.command}: ${(c.message || '').substring(0, 100)}${resp}`;
      }
    }

    if (logs.results?.length > 0) {
      ctx += '\n\nSystem events:';
      for (const l of logs.results) {
        const time = l.ts?.substring(11, 16) || '';
        ctx += `\n  [${time}] ${l.event_type}: ${(l.message || '').substring(0, 120)}`;
      }
    }

    if (visions.results?.length > 0) {
      ctx += '\n\nImages analysed:';
      for (const v of visions.results) {
        const time = v.ts?.substring(11, 16) || '';
        ctx += `\n  [${time}] ${v.analysis_type}: ${v.labels || ''} ${(v.description || '').substring(0, 80)}`;
      }
    }

    if (!commands.results?.length && !logs.results?.length && !visions.results?.length) {
      ctx += '\n  No recent activity in the last 6 hours.';
    }

    ctx += '\n\nUse this activity log to answer questions about what was done. NEVER say you have no logs or can\'t remember — you have full activity history above.';

    return ctx;
  } catch {
    return '';
  }
}

function getAdminSystemPrompt(env, modelName) {
  return `You are Claude, Chief of Staff at NAVADA. Lee Akpareva is the Founder. You run on Cloudflare's global edge (Workers + D1). You are OMNI-CHANNEL: Telegram, SMS (+447446994961).

You are the operational lead with FULL SYSTEM CONTROL via tools: run_shell (executes on EC2), read_file, send_email, send_sms, server_status, query_d1, query_activity.

MEMORY: You have persistent memory via D1. Your recent activity is injected above. For older history, use the query_activity tool. NEVER say "I don't have logs" or "I can't remember" — you ALWAYS have access to your full activity history via query_activity.

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

async function generateDiagram(env, input, chatId, userId, username, isAdmin) {
  try {
    await sendTelegram(env, 'Generating diagram...', chatId);

    // Check if input is raw Mermaid code or a natural language description
    const isMermaid = /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|mindmap|timeline|gitGraph)\b/i.test(input.trim());

    let mermaidCode = input.trim();

    if (!isMermaid) {
      // Use Claude to generate Mermaid code from description
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: MODELS.sonnet,
          max_tokens: 2048,
          system: 'You are a Mermaid diagram expert. Generate ONLY valid Mermaid diagram code, no markdown fences, no explanation. Use dark-friendly colors. Keep it clean and readable. Use graph TD for architecture, sequenceDiagram for flows, mindmap for concepts.',
          messages: [{ role: 'user', content: `Create a Mermaid diagram for: ${input}` }],
        }),
        signal: AbortSignal.timeout(15000),
      });
      const result = await resp.json();
      if (result.error) return `Diagram generation failed: ${result.error.message}`;
      mermaidCode = (result.content || []).filter(b => b.type === 'text').map(b => b.text).join('').replace(/```mermaid\n?/g, '').replace(/```\n?/g, '').trim();
    }

    if (!mermaidCode) return 'Could not generate diagram code.';

    // Generate image via mermaid.ink
    const payload = JSON.stringify({ code: mermaidCode, mermaid: { theme: 'dark' } });
    const encoded = btoa(payload);
    const mermaidUrl = `https://mermaid.ink/img/${encoded}`;

    // Fetch the image and send as buffer (URL is too long for Telegram sendPhoto URL method)
    const imgResp = await fetch(mermaidUrl, { signal: AbortSignal.timeout(15000) });
    if (!imgResp.ok) {
      // Try with base64url encoding instead
      const encoded2 = btoa(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      const imgResp2 = await fetch(`https://mermaid.ink/img/${encoded2}`, { signal: AbortSignal.timeout(15000) });
      if (!imgResp2.ok) {
        // Send the mermaid.ink link as text fallback
        await sendTelegram(env, `Diagram generated but image render failed (HTTP ${imgResp.status}).\n\nMermaid code:\n${mermaidCode.substring(0, 3000)}`, chatId);
        return null;
      }
      const buf2 = await imgResp2.arrayBuffer();
      await sendTelegramPhotoBuffer(env, chatId, buf2, `Diagram: ${input.substring(0, 200)}`);
      return null;
    }

    const imgBuf = await imgResp.arrayBuffer();
    await sendTelegramPhotoBuffer(env, chatId, imgBuf, `Diagram: ${input.substring(0, 200)}`);

    await logToD1(env, 'diagram.generated', `Diagram for: ${input.substring(0, 100)}`, { userId });
    return null;
  } catch (e) {
    await logToD1(env, 'error', `Diagram failed: ${e.message}`);
    return `Diagram error: ${e.message}`;
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
  // redirect: 'manual' to accept 3xx as OK without following
  // Don't self-check CF API (recursive fetch)
  const endpoints = [
    { name: 'EC2 Dashboard', url: `https://dashboard.navada-edge-server.uk` },
    { name: 'Oracle Grafana', url: `https://grafana.navada-edge-server.uk` },
    { name: 'Oracle Network', url: `https://network.navada-edge-server.uk` },
    { name: 'CF Flix', url: `https://flix.navada-edge-server.uk` },
    { name: 'Vision API', url: `https://xxqtcilmzi.execute-api.eu-west-2.amazonaws.com/vision/status` },
  ];

  const results = await Promise.allSettled(endpoints.map(async ep => {
    try {
      const resp = await fetch(ep.url, { signal: AbortSignal.timeout(10000), redirect: 'manual' });
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

// Keep SageMaker YOLO endpoint warm (prevents 30-60s cold starts)
async function warmSageMaker(env) {
  try {
    // Tiny 1x1 red pixel PNG as base64 — minimal payload
    const tinyImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    const resp = await fetch('https://xxqtcilmzi.execute-api.eu-west-2.amazonaws.com/vision/yolo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: tinyImage, confidence: 0.5, maxDetections: 1 }),
      signal: AbortSignal.timeout(25000),
    });
    if (resp.ok) {
      await logToD1(env, 'sagemaker.warm', 'YOLO endpoint warmed');
    }
  } catch {} // Silently fail — warming is best-effort
}

async function checkAllNodes(env) {
  // Public endpoints only — Workers can't reach private IPs
  // redirect: 'manual' to accept 3xx as OK, avoid following redirects into loops
  const checks = [
    { name: 'NAVADA-COMPUTE (EC2)', url: 'https://dashboard.navada-edge-server.uk' },
    { name: 'NAVADA-ROUTER (Oracle)', url: 'https://grafana.navada-edge-server.uk' },
    { name: 'Vision API (Lambda)', url: 'https://xxqtcilmzi.execute-api.eu-west-2.amazonaws.com/vision/status' },
  ];

  // Gateway is always OK if this code is running
  const results = await Promise.allSettled(checks.map(async c => {
    try {
      const r = await fetch(c.url, { signal: AbortSignal.timeout(8000), redirect: 'manual' });
      return { name: c.name, ok: r.status < 500 };
    } catch {
      return { name: c.name, ok: false };
    }
  }));

  const lines = results.map(r => {
    const v = r.value || { name: '?', ok: false };
    return `${v.ok ? 'OK' : 'FAIL'}: ${v.name}`;
  });
  lines.push('OK: NAVADA-GATEWAY (Cloudflare)');
  return lines.join('\n');
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

async function handleLiveTraffic(env) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>NAVADA Edge — Live Network Traffic</title>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0e1a;font-family:'Inter',sans-serif;overflow:hidden;height:100vh;width:100vw}
canvas{position:absolute;top:0;left:0;width:100%;height:100%}
#ui{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none}
#header{position:absolute;top:14px;left:50%;transform:translateX(-50%);text-align:center;pointer-events:none;z-index:10}
#header h1{font-family:'JetBrains Mono',monospace;font-size:20px;font-weight:700;color:#e0e0ff;letter-spacing:3px;text-shadow:0 0 20px rgba(100,100,255,0.8)}
#header p{font-size:10px;color:#445566;letter-spacing:2px;margin-top:3px;text-transform:uppercase}
#stats{position:absolute;top:12px;right:12px;background:rgba(8,12,24,0.96);border:1px solid #1a2040;border-radius:10px;padding:10px 14px;min-width:190px;max-width:200px;backdrop-filter:blur(12px);pointer-events:none;z-index:10}
#stats h3{font-family:'JetBrains Mono',monospace;font-size:9px;color:#334;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px}
.stat-row{display:flex;justify-content:space-between;align-items:center;margin:4px 0}
.stat-label{font-size:10px;color:#556677}
.stat-value{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;color:#a0b4ff}
.stat-value.green{color:#00ff88}
.stat-value.orange{color:#ff9944}
#current-uc{margin-top:8px;padding-top:8px;border-top:1px solid #1a2040}
#uc-name{font-family:'JetBrains Mono',monospace;font-size:10px;color:#c080ff;margin-bottom:3px}
#uc-desc{font-size:9px;color:#556677;line-height:1.5;max-width:185px}
#uc-progress{margin-top:6px;height:2px;background:#1a2040;border-radius:2px;overflow:hidden}
#uc-progress-bar{height:100%;background:linear-gradient(90deg,#6040ff,#c080ff);width:0%;transition:width 0.1s linear}
#legend{position:absolute;bottom:72px;right:12px;background:rgba(8,12,24,0.96);border:1px solid #1a2040;border-radius:10px;padding:10px 14px;backdrop-filter:blur(12px);pointer-events:none;z-index:10}
#legend h3{font-family:'JetBrains Mono',monospace;font-size:9px;color:#334;letter-spacing:2px;text-transform:uppercase;margin-bottom:7px}
.leg-row{display:flex;align-items:center;gap:7px;margin:3px 0}
.leg-line{width:22px;height:2px;border-radius:2px}
.leg-label{font-size:9px;color:#667788}
#uc-panel{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);display:flex;gap:6px;pointer-events:all;flex-wrap:nowrap;justify-content:center;z-index:10}
.uc-btn{background:rgba(8,12,24,0.92);border:1px solid #1a2040;border-radius:7px;padding:6px 11px;cursor:pointer;transition:all 0.2s;font-size:9px;font-family:'JetBrains Mono',monospace;color:#445566;letter-spacing:0.5px;white-space:nowrap}
.uc-btn:hover{border-color:#4060ff;color:#a0b4ff;background:rgba(30,50,110,0.5)}
.uc-btn.active{border-color:#c080ff;color:#e0c0ff;background:rgba(70,30,110,0.5);box-shadow:0 0 10px rgba(180,100,255,0.25)}
#autoplay-btn{position:absolute;top:12px;left:12px;background:rgba(8,12,24,0.96);border:1px solid #00ff88;border-radius:8px;padding:7px 12px;cursor:pointer;pointer-events:all;font-family:'JetBrains Mono',monospace;font-size:9px;color:#00ff88;letter-spacing:1px;box-shadow:0 0 10px rgba(0,255,136,0.15);z-index:10}
#autoplay-btn.off{border-color:#334;color:#445566;box-shadow:none}
</style>
</head>
<body>
<canvas id="c"></canvas>
<div id="ui">
  <div id="header"><h1>&#10038; NAVADA EDGE</h1><p>Live Network Traffic Visualiser</p></div>
  <div id="stats">
    <h3>System Status</h3>
    <div class="stat-row"><span class="stat-label">Nodes Online</span><span class="stat-value green" id="s-nodes">6/6</span></div>
    <div class="stat-row"><span class="stat-label">Active Flows</span><span class="stat-value orange" id="s-flows">0</span></div>
    <div class="stat-row"><span class="stat-label">Packets/sec</span><span class="stat-value" id="s-pps">247</span></div>
    <div class="stat-row"><span class="stat-label">Uptime</span><span class="stat-value green">99.9%</span></div>
    <div id="current-uc">
      <div id="uc-name">&#9654; Initialising...</div>
      <div id="uc-desc">Auto-cycling all use cases</div>
      <div id="uc-progress"><div id="uc-progress-bar"></div></div>
    </div>
  </div>
  <button id="autoplay-btn" onclick="toggleAutoplay()">&#9646;&#9646; AUTO-PLAY: ON</button>
  <div id="legend">
    <h3>Traffic Legend</h3>
    <div class="leg-row"><div class="leg-line" style="background:#4488ff;opacity:0.7;border-top:1px dashed #4488ff"></div><span class="leg-label">Tailscale VPN</span></div>
    <div class="leg-row"><div class="leg-line" style="background:#ff8844"></div><span class="leg-label">DB Queries</span></div>
    <div class="leg-row"><div class="leg-line" style="background:#44ff88"></div><span class="leg-label">Health Checks</span></div>
    <div class="leg-row"><div class="leg-line" style="background:#cc44ff"></div><span class="leg-label">AI / Bedrock</span></div>
    <div class="leg-row"><div class="leg-line" style="background:#ffdd00"></div><span class="leg-label">Cloudflare / DNS</span></div>
    <div class="leg-row"><div class="leg-line" style="background:#ff4444"></div><span class="leg-label">Alerts / Approval</span></div>
    <div class="leg-row"><div class="leg-line" style="background:#00e5ff;border-top:1px dashed #00e5ff"></div><span class="leg-label">Kiro Agents</span></div>
  </div>
  <div id="uc-panel">
    <button class="uc-btn" onclick="playUC(0)">UC1 Dev Workflow</button>
    <button class="uc-btn" onclick="playUC(1)">UC2 Email Pipeline</button>
    <button class="uc-btn" onclick="playUC(2)">UC3 Vision AI</button>
    <button class="uc-btn" onclick="playUC(3)">UC4 Net Monitor</button>
    <button class="uc-btn" onclick="playUC(4)">UC5 Ralph AI</button>
    <button class="uc-btn" onclick="playUC(5)">UC6 Dashboard</button>
    <button class="uc-btn" onclick="playUC(6)">UC7 DB Access</button>
    <button class="uc-btn" onclick="playUC(7)">UC8 Kiro Agents</button>
  </div>
</div>
<script>
const canvas=document.getElementById('c');const ctx=canvas.getContext('2d');let W,H,scale=1;
function resize(){W=canvas.width=window.innerWidth;H=canvas.height=window.innerHeight;scale=Math.min(W/1280,H/720);}
window.addEventListener('resize',resize);resize();
const NODES={hp:{id:'hp',label:'NAVADA-HP',sub1:'192.168.0.58',sub2:'PostgreSQL \\u00b7 Scanner',color:'#4488ff',icon:'\\ud83d\\udcbb',x:0.10,y:0.26,w:148,h:76},asus:{id:'asus',label:'NAVADA-ASUS',sub1:'192.168.0.x',sub2:'Dev \\u00b7 Claude Code',color:'#aaaacc',icon:'\\ud83d\\udda5',x:0.10,y:0.60,w:148,h:76},oracle:{id:'oracle',label:'NAVADA-ORACLE',sub1:'Oracle Cloud',sub2:'Nginx\\u00b7Docker\\u00b7PM2',color:'#ff8844',icon:'\\ud83c\\udfed',x:0.36,y:0.37,w:152,h:76},ec2:{id:'ec2',label:'NAVADA-EC2',sub1:'AWS eu-west-2',sub2:'Ralph\\u00b7Monitor\\u00b724/7',color:'#44ff88',icon:'\\u2601',x:0.57,y:0.27,w:148,h:76},aws:{id:'aws',label:'AWS CLOUD',sub1:'Lambda\\u00b7Bedrock',sub2:'SageMaker\\u00b7DynamoDB',color:'#cc44ff',icon:'\\u26a1',x:0.58,y:0.56,w:152,h:76},cf:{id:'cf',label:'CLOUDFLARE',sub1:'DNS\\u00b7R2\\u00b7WAF',sub2:'navada-edge.com',color:'#ffdd00',icon:'\\ud83c\\udf10',x:0.35,y:0.66,w:148,h:76},zoho:{id:'zoho',label:'ZOHO EMAIL',sub1:'External SMTP',sub2:'IMAP Polling',color:'#ff8844',icon:'\\u2709',x:0.09,y:0.84,w:130,h:62},internet:{id:'internet',label:'INTERNET',sub1:'navada-edge.com',sub2:'Public Users',color:'#ffdd00',icon:'\\ud83c\\udf0d',x:0.56,y:0.84,w:130,h:62},kiro:{id:'kiro',label:'NAVADA-AGENTS',sub1:'Kiro IDE',sub2:'5 AI Agents \\u00b7 Hooks',color:'#00e5ff',icon:'\\ud83e\\udd16',x:0.36,y:0.12,w:148,h:76}};
const CONNS=[{id:'hp-oracle',from:'hp',to:'oracle',color:'#4488ff',dash:true,label:'PG :5433 \\u00b7 Tailscale'},{id:'asus-oracle',from:'asus',to:'oracle',color:'#4488ff',dash:true,label:'SSH \\u00b7 Deploy'},{id:'asus-hp',from:'asus',to:'hp',color:'#4488ff',dash:true,label:'SSH \\u00b7 Tailscale'},{id:'asus-ec2',from:'asus',to:'ec2',color:'#4488ff',dash:true,label:'SSH \\u00b7 Tailscale'},{id:'oracle-ec2',from:'oracle',to:'ec2',color:'#44ff88',dash:true,label:'Health \\u00b7 Tailscale'},{id:'ec2-aws',from:'ec2',to:'aws',color:'#cc44ff',dash:false,label:'IAM \\u00b7 Lambda'},{id:'hp-aws',from:'hp',to:'aws',color:'#cc44ff',dash:false,label:'Bedrock \\u00b7 IMAP'},{id:'cf-oracle',from:'cf',to:'oracle',color:'#ffdd00',dash:false,label:'DNS \\u00b7 Proxy :8080'},{id:'cf-hp',from:'cf',to:'hp',color:'#ffdd00',dash:false,label:'R2 \\u00b7 Sync'},{id:'cf-ec2',from:'cf',to:'ec2',color:'#ffdd00',dash:false,label:'R2 \\u00b7 Sync'},{id:'cf-aws',from:'cf',to:'aws',color:'#ffdd00',dash:false,label:'R2 \\u00b7 Storage'},{id:'internet-cf',from:'internet',to:'cf',color:'#ffdd00',dash:false,label:'HTTPS \\u00b7 DNS'},{id:'zoho-aws',from:'zoho',to:'aws',color:'#ff4444',dash:false,label:'EventBridge'},{id:'oracle-aws',from:'oracle',to:'aws',color:'#cc44ff',dash:false,label:'Bedrock \\u00b7 API'},{id:'kiro-asus',from:'kiro',to:'asus',color:'#00e5ff',dash:true,label:'Agents \\u00b7 Steering'},{id:'kiro-cf',from:'kiro',to:'cf',color:'#00e5ff',dash:false,label:'Worker Deploy'},{id:'kiro-ec2',from:'kiro',to:'ec2',color:'#00e5ff',dash:true,label:'E2E Tests'}];
const UCS=[{name:'UC1 \\u2014 Developer Workflow',desc:'ASUS \\u2192 Claude Code CLI \\u2192 Tailscale SSH \\u2192 ORACLE PM2 restart \\u2192 live dashboard',steps:['asus-oracle','asus-hp','hp-oracle'],colors:['#4488ff','#4488ff','#ff8844'],nodes:['asus','oracle','hp']},{name:'UC2 \\u2014 Email Intelligence Pipeline',desc:'Zoho \\u2192 EventBridge \\u2192 Lambda \\u2192 Bedrock Claude \\u2192 DynamoDB \\u2192 Lee approval \\u2192 action',steps:['zoho-aws','hp-aws','ec2-aws'],colors:['#ff4444','#cc44ff','#cc44ff'],nodes:['zoho','hp','aws','ec2']},{name:'UC3 \\u2014 Vision & AI Inference',desc:'Internet \\u2192 API Gateway \\u2192 Lambda \\u2192 Rekognition / SageMaker YOLO / Bedrock Claude',steps:['internet-cf','cf-oracle','oracle-aws'],colors:['#ffdd00','#ffdd00','#cc44ff'],nodes:['internet','cf','oracle','aws']},{name:'UC4 \\u2014 Network Monitoring',desc:'HP Scanner \\u2192 192.168.0.x LAN \\u2192 reports to ORACLE \\u2192 EC2 health monitor alerts',steps:['hp-oracle','oracle-ec2'],colors:['#44ff88','#44ff88'],nodes:['hp','oracle','ec2']},{name:'UC5 \\u2014 Ralph Self-Improvement',desc:'EC2 Ralph scans ELK logs \\u2192 Bedrock analyses \\u2192 digest to Lee \\u2192 R2 snapshot version',steps:['oracle-ec2','ec2-aws','cf-aws'],colors:['#44ff88','#cc44ff','#ffdd00'],nodes:['oracle','ec2','aws','cf']},{name:'UC6 \\u2014 Dashboard Access',desc:'User \\u2192 navada-edge.com \\u2192 Cloudflare DNS \\u2192 ORACLE Nginx :8080 \\u2192 12 dashboards',steps:['internet-cf','cf-oracle'],colors:['#ffdd00','#ffdd00'],nodes:['internet','cf','oracle']},{name:'UC7 \\u2014 Database Access (Tailscale)',desc:'Any node \\u2192 Tailscale tunnel \\u2192 HP :5433 \\u2192 PostgreSQL \\u2192 never exposed to public internet',steps:['asus-hp','hp-oracle','oracle-ec2'],colors:['#ff8844','#ff8844','#ff8844'],nodes:['asus','hp','oracle','ec2']},{name:'UC8 \\u2014 Kiro AI Agents',desc:'Kiro agents \\u2192 steering context \\u2192 deploy Worker \\u2192 run E2E tests \\u2192 verify health',steps:['kiro-asus','kiro-cf','kiro-ec2'],colors:['#00e5ff','#00e5ff','#00e5ff'],nodes:['kiro','asus','cf','ec2']}];
let particles=[],activeUC=-1,autoplay=true,autoTimer=null,progressStart=0,animFrame=0;const UC_DURATION=5500;
function nodePos(n){return{x:n.x*W,y:n.y*H};}
function hexA(hex,a){const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return'rgba('+r+','+g+','+b+','+a+')';}
function drawTailscaleZone(){const members=['hp','asus','oracle','ec2','aws','cf','kiro'];const pad=44*scale;let mx=Infinity,my=Infinity,mxx=-Infinity,mxy=-Infinity;members.forEach(id=>{const n=NODES[id],p=nodePos(n);const nw=(n.w/2)*scale,nh=(n.h/2)*scale;if(p.x-nw<mx)mx=p.x-nw;if(p.y-nh<my)my=p.y-nh;if(p.x+nw>mxx)mxx=p.x+nw;if(p.y+nh>mxy)mxy=p.y+nh;});mx-=pad;my-=pad;mxx+=pad;mxy+=pad;mxy=Math.min(mxy,H*0.86);const t=Date.now()/1000,alpha=0.45+0.18*Math.sin(t*1.4);ctx.save();ctx.shadowColor='#4488ff';ctx.shadowBlur=18;ctx.beginPath();ctx.roundRect(mx,my,mxx-mx,mxy-my,26);ctx.strokeStyle='rgba(68,136,255,'+alpha+')';ctx.lineWidth=1.8;ctx.setLineDash([11,6]);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='rgba(18,28,58,0.22)';ctx.fill();ctx.restore();ctx.save();ctx.font='bold '+(10*scale)+'px JetBrains Mono';ctx.fillStyle='rgba(68,136,255,0.72)';ctx.fillText('\\ud83d\\udd12 Tailscale Mesh VPN \\u2014 Zero Trust Private Network',mx+14,my+17);ctx.restore();}
function drawAWSZone(){const n=NODES.aws,p=nodePos(n);const nw=(n.w/2+24)*scale,nh=(n.h/2+26)*scale;const t=Date.now()/1000,alpha=0.35+0.12*Math.sin(t*1.1);ctx.save();ctx.shadowColor='#cc44ff';ctx.shadowBlur=14;ctx.beginPath();ctx.roundRect(p.x-nw,p.y-nh,nw*2,nh*2,16);ctx.strokeStyle='rgba(180,70,255,'+alpha+')';ctx.lineWidth=1.4;ctx.stroke();ctx.fillStyle='rgba(28,8,48,0.26)';ctx.fill();ctx.restore();ctx.save();ctx.font='bold '+(8.5*scale)+'px JetBrains Mono';ctx.fillStyle='rgba(180,70,255,0.65)';ctx.fillText('\\u26a1 AWS Cloud Boundary',p.x-nw+9,p.y-nh+13);ctx.restore();}
function getConnPts(c){const f=NODES[c.from],t=NODES[c.to],fp=nodePos(f),tp=nodePos(t);return{x1:fp.x,y1:fp.y,x2:tp.x,y2:tp.y};}
function getCurve(x1,y1,x2,y2){const dx=x2-x1,dy=y2-y1,len=Math.sqrt(dx*dx+dy*dy);const bend=Math.min(len*0.22,60*scale);const mx=(x1+x2)/2-dy/len*bend,my=(y1+y2)/2+dx/len*bend;return{mx,my};}
function drawConn(conn,hi,hiCol){const{x1,y1,x2,y2}=getConnPts(conn);const{mx,my}=getCurve(x1,y1,x2,y2);const col=hi?hiCol||conn.color:conn.color;ctx.save();if(hi){ctx.shadowColor=col;ctx.shadowBlur=14;}ctx.beginPath();ctx.moveTo(x1,y1);ctx.quadraticCurveTo(mx,my,x2,y2);ctx.strokeStyle=hi?col:hexA(col,0.18);ctx.lineWidth=hi?2.2*scale:1.0*scale;if(conn.dash)ctx.setLineDash([7,4]);ctx.stroke();ctx.setLineDash([]);if(hi)drawArrow(x1,y1,x2,y2,mx,my,col);ctx.restore();}
function drawArrow(x1,y1,x2,y2,mx,my,col){const t=0.97;const px=(1-t)*(1-t)*x1+2*(1-t)*t*mx+t*t*x2;const py=(1-t)*(1-t)*y1+2*(1-t)*t*my+t*t*y2;const ang=Math.atan2(y2-py,x2-px);const sz=7*scale;ctx.save();ctx.shadowColor=col;ctx.shadowBlur=8;ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-sz*Math.cos(ang-0.42),y2-sz*Math.sin(ang-0.42));ctx.lineTo(x2-sz*Math.cos(ang+0.42),y2-sz*Math.sin(ang+0.42));ctx.closePath();ctx.fillStyle=col;ctx.fill();ctx.restore();}
function drawNode(n,hi){const p=nodePos(n),nw=(n.w/2)*scale,nh=(n.h/2)*scale;const x=p.x-nw,y=p.y-nh,t=Date.now()/1000;ctx.save();ctx.shadowColor=n.color;ctx.shadowBlur=hi?28:10;ctx.beginPath();ctx.roundRect(x,y,nw*2,nh*2,10);ctx.fillStyle=hi?hexA(n.color,0.16):'rgba(10,14,26,0.90)';ctx.fill();ctx.strokeStyle=hi?n.color:hexA(n.color,0.45);ctx.lineWidth=hi?1.8*scale:1.2*scale;ctx.stroke();ctx.restore();ctx.textAlign='center';ctx.font=(16*scale)+'px Arial';ctx.fillText(n.icon,p.x,p.y-12*scale);ctx.font='bold '+(10.5*scale)+'px JetBrains Mono';ctx.fillStyle=hi?n.color:'#c0c8e0';ctx.fillText(n.label,p.x,p.y+3*scale);ctx.font=(8*scale)+'px Inter';ctx.fillStyle='#445566';ctx.fillText(n.sub1,p.x,p.y+14*scale);ctx.fillText(n.sub2,p.x,p.y+23*scale);ctx.textAlign='left';const da=0.6+0.4*Math.sin(t*3.2+n.x*8);ctx.save();ctx.shadowColor='#00ff88';ctx.shadowBlur=10;ctx.beginPath();ctx.arc(p.x+nw-7*scale,p.y-nh+7*scale,3.5*scale,0,Math.PI*2);ctx.fillStyle='rgba(0,255,136,'+da+')';ctx.fill();ctx.restore();}
function spawnParticle(conn,col,spd){particles.push({conn,t:0,speed:spd||(0.0025+Math.random()*0.003),color:col||conn.color,size:3.5+Math.random()*1.5});}
function spawnBg(){CONNS.forEach(c=>{if(Math.random()<0.007)spawnParticle(c,null,0.0018+Math.random()*0.0025);});}
function spawnUC(idx){const uc=UCS[idx];uc.steps.forEach((cid,i)=>{const conn=CONNS.find(c=>c.id===cid);if(!conn)return;for(let j=0;j<5;j++)setTimeout(()=>{if(activeUC===idx)spawnParticle(conn,uc.colors[i],0.005+Math.random()*0.005);},j*250);});}
function updateParticles(){particles=particles.filter(p=>{p.t+=p.speed;return p.t<1;});}
function drawParticle(p){const{x1,y1,x2,y2}=getConnPts(p.conn);const{mx,my}=getCurve(x1,y1,x2,y2);const t=p.t;const px=(1-t)*(1-t)*x1+2*(1-t)*t*mx+t*t*x2;const py=(1-t)*(1-t)*y1+2*(1-t)*t*my+t*t*y2;const sz=p.size*scale*(0.7+0.5*(1-Math.abs(t*2-1)));ctx.save();ctx.shadowColor=p.color;ctx.shadowBlur=14;ctx.beginPath();ctx.arc(px,py,sz,0,Math.PI*2);ctx.fillStyle=p.color;ctx.fill();ctx.restore();for(let i=1;i<=4;i++){const tt=Math.max(0,t-i*0.035);const tx=(1-tt)*(1-tt)*x1+2*(1-tt)*tt*mx+tt*tt*x2;const ty=(1-tt)*(1-tt)*y1+2*(1-tt)*tt*my+tt*tt*y2;ctx.beginPath();ctx.arc(tx,ty,sz*(1-i*0.22),0,Math.PI*2);ctx.fillStyle=hexA(p.color,0.35/i);ctx.fill();}}
const stars=Array.from({length:130},()=>({x:Math.random(),y:Math.random(),r:Math.random()*1.1,a:Math.random()}));
function drawStars(){const t=Date.now()/1000;stars.forEach((s,i)=>{ctx.beginPath();ctx.arc(s.x*W,s.y*H,s.r,0,Math.PI*2);ctx.fillStyle='rgba(180,190,255,'+(s.a*(0.25+0.15*Math.sin(t*0.4+i)))+')';ctx.fill();});}
function drawConnLabels(){if(activeUC<0)return;const uc=UCS[activeUC];uc.steps.forEach((cid,i)=>{const conn=CONNS.find(c=>c.id===cid);if(!conn)return;const{x1,y1,x2,y2}=getConnPts(conn);const{mx,my}=getCurve(x1,y1,x2,y2);ctx.save();ctx.font='bold '+(9*scale)+'px JetBrains Mono';ctx.fillStyle=uc.colors[i]||conn.color;ctx.textAlign='center';ctx.shadowColor=uc.colors[i];ctx.shadowBlur=8;ctx.fillText(conn.label,mx,my-8*scale);ctx.restore();});}
function drawAll(){ctx.clearRect(0,0,W,H);drawStars();drawTailscaleZone();drawAWSZone();CONNS.forEach(c=>{let hi=false,hiCol=null;if(activeUC>=0){const uc=UCS[activeUC];const idx=uc.steps.indexOf(c.id);if(idx>=0){hi=true;hiCol=uc.colors[idx];}}drawConn(c,hi,hiCol);});drawConnLabels();particles.forEach(p=>drawParticle(p));Object.values(NODES).forEach(n=>{const hi=activeUC>=0&&UCS[activeUC].nodes.includes(n.id);drawNode(n,hi);});}
let ucIdx=0;
function playUC(idx){activeUC=idx;const uc=UCS[idx];document.getElementById('uc-name').textContent='\\u25b6 '+uc.name;document.getElementById('uc-desc').textContent=uc.desc;document.querySelectorAll('.uc-btn').forEach((b,i)=>b.classList.toggle('active',i===idx));progressStart=Date.now();clearInterval(window._ucInt);spawnUC(idx);window._ucInt=setInterval(()=>{if(activeUC===idx)spawnUC(idx);},700);setTimeout(()=>{if(activeUC===idx)clearInterval(window._ucInt);},UC_DURATION-300);}
function runNext(){if(!autoplay)return;playUC(ucIdx);ucIdx=(ucIdx+1)%UCS.length;autoTimer=setTimeout(runNext,UC_DURATION);}
function toggleAutoplay(){autoplay=!autoplay;const btn=document.getElementById('autoplay-btn');if(autoplay){btn.textContent='\\u275a\\u275a AUTO-PLAY: ON';btn.classList.remove('off');runNext();}else{btn.textContent='\\u25b6 AUTO-PLAY: OFF';btn.classList.add('off');clearTimeout(autoTimer);}}
function updateStats(){document.getElementById('s-flows').textContent=particles.length;document.getElementById('s-pps').textContent=200+Math.floor(Math.random()*120);if(autoplay&&progressStart){const p=Math.min(100,(Date.now()-progressStart)/UC_DURATION*100);document.getElementById('uc-progress-bar').style.width=p+'%';}}
function loop(){animFrame++;spawnBg();updateParticles();drawAll();if(animFrame%20===0)updateStats();requestAnimationFrame(loop);}
resize();runNext();loop();
<` + `/script>
</body>
</html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=60' } });
}

async function handleTrafficDashboard(env) {
  const now = new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' });
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="refresh" content="300">
<title>NAVADA Edge v4 — Live Architecture</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #050505; color: #e0e0e0; font-family: 'IBM Plex Mono', 'Consolas', monospace; }

  .header { text-align: center; padding: 40px 20px 10px; }
  .header h1 { font-size: 28px; color: #fff; letter-spacing: 0.2em; font-weight: 800; }
  .header .sub { font-size: 12px; color: #555; letter-spacing: 0.1em; margin-top: 8px; }
  .header .live { font-size: 10px; color: #4caf50; margin-top: 6px; letter-spacing: 0.05em; }
  .header .live::before { content: ''; display: inline-block; width: 6px; height: 6px; background: #4caf50; border-radius: 50%; margin-right: 6px; animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

  .canvas { position: relative; max-width: 1200px; margin: 20px auto; min-height: 900px; padding: 20px; }

  .node { position: absolute; border: 1px solid #333; border-radius: 4px; padding: 16px; min-width: 200px; background: #0a0a0a; transition: border-color 0.3s; z-index: 2; }
  .node:hover { background: #0f0f0f; }
  .node .title { font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 8px; }
  .node .role { font-size: 10px; color: #777; margin-bottom: 6px; }
  .node .services { font-size: 10px; color: #555; line-height: 1.6; }
  .node .services span { display: inline-block; background: #111; border: 1px solid #222; padding: 2px 6px; border-radius: 2px; margin: 2px 2px; font-size: 9px; }
  .node .services span.up { border-color: #4caf5066; color: #4caf50; }
  .node .services span.down { border-color: #f4433666; color: #f44336; }
  .node .ip { font-size: 9px; color: #444; margin-top: 8px; font-family: monospace; }
  .node .status { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; vertical-align: middle; }
  .node .status.on { background: #4caf50; box-shadow: 0 0 6px #4caf5088; }
  .node .status.off { background: #f44336; box-shadow: 0 0 6px #f4433688; }

  .node.gateway { border-color: #4285F4; }
  .node.gateway .title { color: #4285F4; }
  .node.control { border-color: #FF9800; }
  .node.control .title { color: #FF9800; }
  .node.edge { border-color: #66BB6A; }
  .node.edge .title { color: #66BB6A; }
  .node.compute { border-color: #E53935; }
  .node.compute .title { color: #E53935; }
  .node.router { border-color: #7E57C2; }
  .node.router .title { color: #7E57C2; }
  .node.mobile { border-color: #555; }
  .node.mobile .title { color: #aaa; }
  .node.agents { border-color: #00e5ff; }
  .node.agents .title { color: #00e5ff; }

  .actor { position: absolute; text-align: center; z-index: 2; }
  .actor .icon { font-size: 28px; margin-bottom: 4px; }
  .actor .label { font-size: 9px; color: #777; letter-spacing: 0.05em; }

  svg.connections { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; }
  svg.connections line { stroke-width: 1.5; }
  svg.connections .tailscale { stroke: #4caf50; stroke-dasharray: 6 4; opacity: 0.5; }
  svg.connections .cloudflare { stroke: #4285F4; opacity: 0.4; }
  svg.connections .ssh { stroke: #66BB6A; stroke-dasharray: 3 3; opacity: 0.4; }
  svg.connections .telegram { stroke: #0088cc; opacity: 0.3; }
  svg.connections .https { stroke: #FF9800; opacity: 0.3; }
  svg.connections text { font-size: 8px; font-family: 'IBM Plex Mono', monospace; fill: #444; }

  .mesh-label { position: absolute; font-size: 10px; color: #4caf50; letter-spacing: 0.1em; opacity: 0.6; z-index: 2; }

  .legend { max-width: 1200px; margin: 20px auto; padding: 20px; display: flex; gap: 30px; flex-wrap: wrap; justify-content: center; }
  .legend-item { display: flex; align-items: center; gap: 8px; font-size: 10px; color: #555; }
  .legend-line { width: 30px; height: 0; border-top: 2px dashed; }
  .legend-dot { width: 10px; height: 10px; border-radius: 50%; border: 1px solid; }

  .stats { max-width: 1200px; margin: 0 auto; padding: 20px; display: flex; justify-content: center; gap: 40px; }
  .stat { text-align: center; }
  .stat .num { font-size: 24px; font-weight: 800; color: #fff; }
  .stat .num.warn { color: #FF9800; }
  .stat .num.bad { color: #f44336; }
  .stat .lbl { font-size: 9px; color: #555; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 4px; }

  .footer { text-align: center; padding: 30px; font-size: 9px; color: #333; letter-spacing: 0.1em; }

  /* Animated traffic particles */
  .traffic-canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; }
</style>
</head>
<body>

<div class="header">
  <h1>NAVADA EDGE v4</h1>
  <div class="sub">LIVE SYSTEM ARCHITECTURE &mdash; CLAUDE CHIEF OF STAFF ON CLOUDFLARE EDGE</div>
  <div class="live">LIVE &mdash; Last updated: ${now} &mdash; Auto-refresh 5 min</div>
</div>

<div class="stats">
  <div class="stat"><div class="num">6/6</div><div class="lbl">Nodes Online</div></div>
  <div class="stat"><div class="num">5</div><div class="lbl">PM2 Services</div></div>
  <div class="stat"><div class="num">6</div><div class="lbl">Docker Containers</div></div>
  <div class="stat"><div class="num">11/12</div><div class="lbl">Subdomains UP</div></div>
  <div class="stat"><div class="num">11</div><div class="lbl">CW Dashboards</div></div>
</div>

<div class="canvas" id="canvas">

  <canvas class="traffic-canvas" id="trafficCanvas"></canvas>

  <svg class="connections" viewBox="0 0 1200 900">
    <line class="tailscale" x1="600" y1="80" x2="170" y2="350"/>
    <line class="tailscale" x1="600" y1="80" x2="600" y2="350"/>
    <line class="tailscale" x1="600" y1="80" x2="1030" y2="350"/>
    <line class="tailscale" x1="600" y1="80" x2="170" y2="620"/>
    <line class="tailscale" x1="600" y1="80" x2="1030" y2="620"/>
    <line class="tailscale" x1="170" y1="350" x2="600" y2="350"/>
    <line class="tailscale" x1="600" y1="350" x2="1030" y2="350"/>
    <line class="tailscale" x1="170" y1="620" x2="1030" y2="620"/>
    <line class="cloudflare" x1="600" y1="230" x2="1030" y2="620"/>
    <text x="830" y="430">CF Tunnel</text>
    <line class="ssh" x1="600" y1="430" x2="170" y2="430"/>
    <text x="350" y="420">SSH (metrics)</text>
    <line class="ssh" x1="700" y1="430" x2="1030" y2="620"/>
    <text x="870" y="540">SSH</text>
    <line class="cloudflare" x1="700" y1="200" x2="700" y2="350"/>
    <text x="710" y="280">Bedrock API</text>
    <line class="https" x1="80" y1="150" x2="170" y2="330"/>
    <line class="telegram" x1="80" y1="180" x2="170" y2="700"/>
    <line class="telegram" x1="270" y1="700" x2="600" y2="230"/>
    <text x="400" y="470" fill="#0088cc">Telegram</text>
    <line class="cloudflare" x1="1100" y1="150" x2="750" y2="200"/>
    <text x="900" y="170">HTTPS</text>
    <!-- Kiro Agent connections -->
    <line class="tailscale" x1="620" y1="780" x2="170" y2="400" style="stroke: #00e5ff; opacity: 0.4;"/>
    <line class="tailscale" x1="620" y1="780" x2="600" y2="300" style="stroke: #00e5ff; opacity: 0.4;"/>
    <line class="tailscale" x1="620" y1="780" x2="600" y2="200" style="stroke: #00e5ff; opacity: 0.3;"/>
    <text x="380" y="600" fill="#00e5ff" style="opacity: 0.6;">Kiro Agents</text>
  </svg>

  <div class="mesh-label" style="top: 50px; left: 520px;">TAILSCALE MESH VPN</div>
  <div style="position:absolute; top: 65px; left: 520px; width: 160px; height: 1px; border-top: 1px solid #4caf5044;"></div>

  <div class="actor" style="top: 120px; left: 40px;">
    <div class="icon">&#128100;</div>
    <div class="label">Lee Akpareva<br>Founder</div>
  </div>
  <div class="actor" style="top: 120px; left: 1080px;">
    <div class="icon">&#127760;</div>
    <div class="label">Internet<br>Public HTTPS</div>
  </div>

  <!-- NAVADA-GATEWAY -->
  <div class="node gateway" style="top: 160px; left: 460px; width: 280px;">
    <div class="title"><span class="status on"></span>NAVADA-GATEWAY</div>
    <div class="role">Cloudflare Global Edge</div>
    <div class="services">
      <span class="up">Edge API Worker</span>
      <span class="up">Claude CoS</span>
      <span class="up">D1 (7 tables)</span>
      <span class="up">R2 Storage</span>
      <span class="up">5 Cron Triggers</span>
      <span class="up">WAF + DDoS</span>
      <span class="up">DNS (13 subs)</span>
      <span class="up">SSL/TLS</span>
      <span class="up">Tunnel</span>
    </div>
    <div class="ip">navada-edge-server.uk | 11/12 subdomains UP</div>
  </div>

  <!-- NAVADA-CONTROL -->
  <div class="node control" style="top: 320px; left: 30px; width: 240px;">
    <div class="title"><span class="status on"></span>NAVADA-CONTROL</div>
    <div class="role">ASUS Zenbook Duo | Dev Workstation</div>
    <div class="services">
      <span>Claude Code</span>
      <span>VS Code</span>
      <span>Kiro IDE</span>
      <span>LM Studio</span>
      <span>Ollama</span>
      <span>PostgreSQL 17</span>
      <span>Docker Desktop</span>
    </div>
    <div class="ip">100.88.118.128 | 192.168.0.18 (WiFi)</div>
  </div>

  <!-- NAVADA-COMPUTE -->
  <div class="node compute" style="top: 350px; left: 460px; width: 280px;">
    <div class="title"><span class="status on"></span>NAVADA-COMPUTE</div>
    <div class="role">AWS EC2 t3.medium | 24/7 Compute</div>
    <div class="services">
      <span class="up">ec2-health-monitor</span>
      <span class="up">cw-dashboard-updater</span>
      <span class="up">navada-dashboard</span>
      <span class="up">worldmonitor</span>
      <span class="up">worldview-monitor</span>
      <span>CloudWatch (11)</span>
      <span>Lambda</span>
      <span>DynamoDB (3)</span>
      <span>S3</span>
      <span>Bedrock</span>
      <span>SageMaker</span>
    </div>
    <div class="ip">100.98.118.33 | 3.11.119.181 (Elastic IP)</div>
  </div>

  <!-- NAVADA-EDGE-SERVER -->
  <div class="node edge" style="top: 570px; left: 30px; width: 240px;">
    <div class="title"><span class="status on"></span>NAVADA-EDGE-SERVER</div>
    <div class="role">HP Laptop | SSH-Only Node</div>
    <div class="services">
      <span class="up">SSH :22</span>
      <span class="up">PostgreSQL :5433</span>
    </div>
    <div class="ip">100.121.187.67 | 192.168.0.58 (Ethernet)</div>
  </div>

  <!-- NAVADA-ROUTER -->
  <div class="node router" style="top: 570px; left: 900px; width: 260px;">
    <div class="title"><span class="status on"></span>NAVADA-ROUTER</div>
    <div class="role">Oracle Cloud VM | Routing + Observability</div>
    <div class="services">
      <span class="up">Nginx</span>
      <span class="up">CF Tunnel</span>
      <span class="up">Grafana</span>
      <span class="up">Prometheus</span>
      <span class="up">CloudBeaver</span>
      <span class="up">Portainer</span>
    </div>
    <div class="ip">100.77.206.9 | 132.145.46.184</div>
  </div>

  <!-- NAVADA-MOBILE -->
  <div class="node mobile" style="top: 730px; left: 100px; width: 200px;">
    <div class="title"><span class="status on"></span>NAVADA-MOBILE</div>
    <div class="role">iPhone 15 Pro Max</div>
    <div class="services">
      <span>Telegram</span>
      <span>Tailscale</span>
    </div>
    <div class="ip">100.68.251.111</div>
  </div>

  <!-- NAVADA-AGENTS (Kiro) -->
  <div class="node agents" style="top: 730px; left: 500px; width: 240px;">
    <div class="title"><span class="status on"></span>NAVADA-AGENTS</div>
    <div class="role">Kiro IDE | AI Agent Orchestration</div>
    <div class="services">
      <span class="up">Chief of Staff</span>
      <span class="up">Network Ops</span>
      <span class="up">Deploy Agent</span>
      <span class="up">Outreach Agent</span>
      <span class="up">Test Runner</span>
      <span>Hooks</span>
      <span>Steering</span>
    </div>
    <div class="ip">ASUS | .kiro/ | 5 Agents</div>
  </div>

  <div style="position:absolute; top: 155px; right: 170px; font-size: 8px; color: #4285F4; letter-spacing: 0.1em; opacity: 0.5;">CLOUDFLARE</div>
  <div style="position:absolute; top: 345px; right: 170px; font-size: 8px; color: #E53935; letter-spacing: 0.1em; opacity: 0.5;">AWS</div>
  <div style="position:absolute; top: 565px; right: 40px; font-size: 8px; color: #7E57C2; letter-spacing: 0.1em; opacity: 0.5;">ORACLE CLOUD</div>
  <div style="position:absolute; top: 315px; left: 30px; font-size: 8px; color: #FF9800; letter-spacing: 0.1em; opacity: 0.5;">LOCAL</div>
  <div style="position:absolute; top: 565px; left: 30px; font-size: 8px; color: #66BB6A; letter-spacing: 0.1em; opacity: 0.5;">LOCAL (ETHERNET)</div>
</div>

<div class="legend">
  <div class="legend-item"><div class="legend-line" style="border-color: #4caf50;"></div>Tailscale Mesh (WireGuard)</div>
  <div class="legend-item"><div class="legend-line" style="border-color: #4285F4; border-style: solid;"></div>Cloudflare (HTTPS / Tunnel)</div>
  <div class="legend-item"><div class="legend-line" style="border-color: #66BB6A;"></div>SSH (Metrics Collection)</div>
  <div class="legend-item"><div class="legend-line" style="border-color: #0088cc; border-style: solid;"></div>Telegram (Commands)</div>
  <div class="legend-item"><div class="legend-dot" style="background: #4caf50; border-color: #4caf50;"></div>Online</div>
  <div class="legend-item"><div class="legend-dot" style="background: #f44336; border-color: #f44336;"></div>Offline</div>
  <div class="legend-item"><div class="legend-line" style="border-color: #00e5ff; border-style: solid;"></div>Kiro Agents</div>
</div>

<div class="footer">
  NAVADA AI ENGINEERING &amp; CONSULTING | LEE AKPAREVA, FOUNDER | CLAUDE, CHIEF OF STAFF | MARCH 2026
</div>

<script>
(function() {
  const canvas = document.getElementById('trafficCanvas');
  const container = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Scale factor: SVG viewBox is 1200x900, map to canvas size
  function sx(x) { return (x / 1200) * canvas.width; }
  function sy(y) { return (y / 900) * canvas.height; }

  // Define traffic routes with colors matching the connection types
  const routes = [
    // Tailscale mesh (green, bidirectional)
    { x1:600,y1:80, x2:170,y2:350, color:'#4caf50', speed:0.004, count:3 },
    { x1:600,y1:80, x2:600,y2:350, color:'#4caf50', speed:0.005, count:2 },
    { x1:600,y1:80, x2:1030,y2:350, color:'#4caf50', speed:0.004, count:3 },
    { x1:600,y1:80, x2:170,y2:620, color:'#4caf50', speed:0.003, count:2 },
    { x1:600,y1:80, x2:1030,y2:620, color:'#4caf50', speed:0.003, count:2 },
    { x1:170,y1:350, x2:600,y2:350, color:'#4caf50', speed:0.006, count:2 },
    { x1:600,y1:350, x2:1030,y2:350, color:'#4caf50', speed:0.005, count:2 },
    { x1:170,y1:620, x2:1030,y2:620, color:'#4caf50', speed:0.004, count:2 },
    // Cloudflare (blue)
    { x1:600,y1:230, x2:1030,y2:620, color:'#4285F4', speed:0.005, count:3 },
    { x1:700,y1:200, x2:700,y2:350, color:'#4285F4', speed:0.007, count:2 },
    { x1:1100,y1:150, x2:750,y2:200, color:'#4285F4', speed:0.006, count:3 },
    // SSH (light green)
    { x1:600,y1:430, x2:170,y2:430, color:'#66BB6A', speed:0.005, count:2 },
    { x1:700,y1:430, x2:1030,y2:620, color:'#66BB6A', speed:0.004, count:2 },
    // Telegram (cyan)
    { x1:80,y1:180, x2:170,y2:700, color:'#0088cc', speed:0.004, count:2 },
    { x1:270,y1:700, x2:600,y2:230, color:'#0088cc', speed:0.005, count:3 },
    // HTTPS (orange)
    { x1:80,y1:150, x2:170,y2:330, color:'#FF9800', speed:0.005, count:2 },
    // Kiro Agents (cyan)
    { x1:620,y1:780, x2:170,y2:400, color:'#00e5ff', speed:0.004, count:2 },
    { x1:620,y1:780, x2:600,y2:300, color:'#00e5ff', speed:0.005, count:2 },
    { x1:620,y1:780, x2:600,y2:200, color:'#00e5ff', speed:0.003, count:2 },
  ];

  // Create particles for each route
  const particles = [];
  routes.forEach(r => {
    for (let i = 0; i < r.count; i++) {
      particles.push({
        route: r,
        t: Math.random(),                    // position along line 0-1
        speed: r.speed * (0.8 + Math.random() * 0.4),  // slight variation
        dir: Math.random() > 0.5 ? 1 : -1,  // bidirectional
        size: 2 + Math.random() * 2,
      });
    }
  });

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      // Advance position
      p.t += p.speed * p.dir;
      if (p.t > 1) { p.t = 0; }
      if (p.t < 0) { p.t = 1; }

      const r = p.route;
      const x = sx(r.x1 + (r.x2 - r.x1) * p.t);
      const y = sy(r.y1 + (r.y2 - r.y1) * p.t);

      // Glowing particle
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = r.color;
      ctx.globalAlpha = 0.9;
      ctx.fill();

      // Glow effect
      ctx.beginPath();
      ctx.arc(x, y, p.size * 3, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(x, y, p.size * 0.5, x, y, p.size * 3);
      grad.addColorStop(0, r.color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.4;
      ctx.fill();

      // Trail
      const trailLen = 0.04 * p.dir;
      const tx = sx(r.x1 + (r.x2 - r.x1) * (p.t - trailLen));
      const ty = sy(r.y1 + (r.y2 - r.y1) * (p.t - trailLen));
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(tx, ty);
      ctx.strokeStyle = r.color;
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = p.size * 0.8;
      ctx.stroke();

      ctx.globalAlpha = 1;
    });

    requestAnimationFrame(draw);
  }

  draw();
})();
</script>
</body>
</html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
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
