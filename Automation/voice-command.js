/**
 * NAVADA Voice Command System
 * Always-on voice assistant via S8 Bluetooth mic + speaker
 *
 * Modes:
 *   STANDBY  — listening for wake word ("Claude" / "Hey Claude")
 *   ACTIVE   — processes one command, then returns to standby
 *   CONVO    — full back-and-forth conversation (no wake word needed)
 *   SLEEPING — paused, only responds to "Claude wake up"
 *
 * Voice Controls:
 *   "Claude"              → activate from standby
 *   "Let's talk"          → enter conversation mode
 *   "Stop talking" / "Goodbye" → exit conversation mode
 *   "Go to sleep"         → pause listening (sleep mode)
 *   "Wake up"             → resume from sleep
 *
 * Usage:
 *   node voice-command.js                    # Continuous listening (PM2 daemon)
 *   node voice-command.js --once             # One command, then exit
 *   node voice-command.js --test-mic         # Test S8 mic
 *   node voice-command.js --test-speak "hi"  # Test S8 speaker
 */

require('dotenv').config({ path: __dirname + '/.env' });
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');
const axios = require('axios');
const FormData = require('form-data');
const { sendEmail, p } = require('./email-service');
const costTracker = require('../Manager/cost-tracker');

const AUDIO_DIR = path.join(__dirname, 'voice-notes');
const LOG_FILE = path.join(__dirname, 'logs', 'voice-command.log');
const S8_MIC_INDEX = 2;
const S8_SPEAKER_INDEX = 4;
const SILENCE_THRESHOLD = 200;
const MAX_RECORD_SECONDS = 30;
const SAMPLE_RATE = 16000;
const FFPLAY = 'C:\\Users\\leeak\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.0.1-full_build\\bin\\ffplay.exe';

const WAKE_WORDS = ['claude', 'navada', 'hey claude', 'ok claude'];
const SLEEP_PHRASES = ['go to sleep', 'sleep mode', 'turn off', 'shut down voice', 'stop listening'];
const WAKE_PHRASES = ['wake up', 'turn on', 'start listening', 'i need you'];
const CONVO_START = ['let\'s talk', 'lets talk', 'conversation mode', 'talk to me', 'chat with me'];
const CONVO_END = ['stop talking', 'goodbye', 'bye', 'end conversation', 'that\'s all', 'go back to standby'];
const COMPANION_START = ['keep talking', 'radio mode', 'companion mode', 'just talk', 'entertain me', 'tell me things', 'keep going'];
const COMPANION_END = ['quiet', 'shut up', 'enough', 'stop', 'that\'s enough', 'be quiet', 'silence', 'pause'];

const COMPANION_TOPICS = [
  'a short surprising AI fact from the last year — one sentence only',
  'a quick insight about the UK or US stock market today — one sentence',
  'a mind-blowing fact about the future of humanity or technology — one sentence',
  'a short hot take on a current tech trend — one sentence',
  'a quick fun fact about robotics or automation — one sentence',
  'a one-line insight about cryptocurrency or blockchain right now',
  'a short interesting fact about space exploration or science — one sentence',
  'a quick thought about the future of work and AI — one sentence',
  'a surprising stat about a tech company — one sentence',
  'a short prediction about where AI is heading — one sentence',
  'a quick nugget about cybersecurity or privacy — one sentence',
  'a one-line fact about Nigeria or African tech — one sentence',
  'a short insight about startup culture or venture capital — one sentence',
  'a quick thought about quantum computing or edge tech — one sentence',
  'a fun one-liner about programming or developer culture',
];

// State
let mode = 'STANDBY'; // STANDBY | ACTIVE | CONVO | SLEEPING | COMPANION
let conversationHistory = [];
let companionIndex = 0;
const MAX_CONVO_HISTORY = 20;
const CONTROL_FILE = path.join(__dirname, '.voice-control');
const CONTROL_PORT = 7777;
const DAEMON_PORT = 7778;
let controlQueue = [];
let daemonSocket = null;

function log(msg) {
  const line = `[${new Date().toISOString()}] [${mode}] ${msg}`;
  console.log(line);
  try { fs.appendFileSync(LOG_FILE, line + '\n'); } catch (e) { /* */ }
}

/**
 * Check if the Python voice-recorder daemon is running on DAEMON_PORT.
 * If not, spawn it automatically and wait for it to be ready.
 */
async function ensureDaemon() {
  return new Promise((resolve) => {
    const testConn = net.createConnection({ host: '127.0.0.1', port: DAEMON_PORT }, () => {
      testConn.destroy();
      log('Voice recorder daemon already running on port ' + DAEMON_PORT);
      resolve();
    });
    testConn.on('error', () => {
      log('Daemon not running — spawning voice-recorder-daemon.py...');
      const daemonProc = spawn('py', [path.join(__dirname, 'voice-recorder-daemon.py')], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      });
      daemonProc.unref();
      let attempts = 0;
      const check = () => {
        attempts++;
        const probe = net.createConnection({ host: '127.0.0.1', port: DAEMON_PORT }, () => {
          probe.destroy();
          log('Daemon started successfully after ' + attempts + ' attempts');
          resolve();
        });
        probe.on('error', () => {
          if (attempts < 10) setTimeout(check, 500);
          else {
            log('WARNING: Daemon failed to start after 5 seconds');
            resolve();
          }
        });
      };
      setTimeout(check, 500);
    });
  });
}

/**
 * Send a JSON command to the Python daemon and get a JSON response.
 */
function daemonRequest(command) {
  return new Promise((resolve, reject) => {
    const conn = net.createConnection({ host: '127.0.0.1', port: DAEMON_PORT }, () => {
      conn.write(JSON.stringify(command) + '\n');
    });
    let data = '';
    conn.on('data', (chunk) => { data += chunk.toString(); });
    conn.on('end', () => {
      try {
        resolve(JSON.parse(data.trim()));
      } catch (e) {
        reject(new Error('Invalid daemon response: ' + data));
      }
    });
    conn.on('error', (e) => reject(new Error('Daemon connection error: ' + e.message)));
    conn.setTimeout(35000, () => { conn.destroy(); reject(new Error('Daemon request timed out')); });
  });
}

/**
 * Record audio from S8 Bluetooth mic via Python daemon
 */
function recordAudio(outputPath, maxSeconds = MAX_RECORD_SECONDS) {
  return daemonRequest({ action: 'record', output: outputPath, max_seconds: maxSeconds })
    .then((res) => {
      if (res.error) throw new Error(res.error);
      if (!res.speech) return { speech: false, duration: 0 };
      return { speech: true, duration: res.duration, path: res.path || outputPath };
    });
}

/**
 * Transcribe audio using OpenAI Whisper API
 */
async function transcribe(audioPath) {
  const form = new FormData();
  form.append('file', fs.createReadStream(audioPath));
  form.append('model', 'whisper-1');
  form.append('language', 'en');
  form.append('response_format', 'text');
  form.append('prompt', 'Hey Claude, Navada, let\'s talk, goodbye, wake up, go to sleep, system status');
  try {
    const fileSize = fs.statSync(audioPath).size;
    const audioSecs = fileSize / (SAMPLE_RATE * 2); // 16-bit mono
    const res = await axios.post('https://api.openai.com/v1/audio/transcriptions', form, {
      headers: { ...form.getHeaders(), 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      maxContentLength: 25 * 1024 * 1024,
    });
    costTracker.logCall('whisper', { audio_seconds: audioSecs, script: 'voice-command' });
    return res.data.trim();
  } catch (e) {
    log(`Whisper error: ${e.response?.data?.error?.message || e.message}`);
    return null;
  }
}

/**
 * TTS via OpenAI, play through S8 speaker
 */
async function speak(text) {
  if (!text) return;
  try {
    const res = await axios.post('https://api.openai.com/v1/audio/speech', {
      model: 'tts-1-hd',
      input: text.substring(0, 4096),
      voice: 'onyx',
      response_format: 'mp3',
      speed: 1.05,
    }, {
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      responseType: 'stream',
    });
    costTracker.logCall('tts-1-hd', { characters: text.length, script: 'voice-command' });

    // Stream directly into ffplay's stdin for instant playback start
    await new Promise((resolve, reject) => {
      const ffplay = spawn(FFPLAY, ['-nodisp', '-autoexit', '-loglevel', 'quiet', '-i', 'pipe:0'], {
        stdio: ['pipe', 'ignore', 'ignore'],
        windowsHide: true,
      });
      res.data.pipe(ffplay.stdin);
      ffplay.on('close', resolve);
      ffplay.on('error', reject);
      ffplay.stdin.on('error', () => { /* ffplay closed stdin early — ignore */ });
    });
  } catch (e) {
    log(`TTS error: ${e.message}`);
  }
}

/**
 * Listen for one utterance, return transcript or null
 */
async function listenOnce() {
  const audioFile = path.join(AUDIO_DIR, `cmd-${Date.now()}.wav`);
  try {
    const result = await recordAudio(audioFile);
    if (!result.speech) return null;
    log(`Recorded ${result.duration}s`);
    const transcript = await transcribe(audioFile);
    if (!transcript) { log('Transcription empty'); return null; }
    log(`Heard: "${transcript}"`);
    try { fs.unlinkSync(audioFile); } catch (e) { /* */ }
    return transcript;
  } catch (e) {
    log(`Listen error: ${e.message}`);
    return null;
  }
}

/**
 * Chat with conversation history via OpenAI
 */
async function chat(userMessage) {
  conversationHistory.push({ role: 'user', content: userMessage });
  // Trim history
  if (conversationHistory.length > MAX_CONVO_HISTORY) {
    conversationHistory = conversationHistory.slice(-MAX_CONVO_HISTORY);
  }

  try {
    const res = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o-mini',
      max_tokens: 250,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: `You are Claude, the AI assistant on the NAVADA home server run by Lee Akpareva. You are having a voice conversation via an S8 Bluetooth speaker. Keep responses concise (2-3 sentences max) — this is spoken aloud, not read. Be natural, warm, and conversational like a colleague. You have access to the server: PM2 processes, scheduled automations, email, LinkedIn posting, and web research. If Lee asks you to do something on the server, confirm you'll do it.`
        },
        ...conversationHistory
      ]
    }, {
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    });

    const reply = res.data.choices[0].message.content.trim();
    conversationHistory.push({ role: 'assistant', content: reply });
    const usage = res.data.usage || {};
    costTracker.logCall('gpt-4o-mini', { input_tokens: usage.prompt_tokens || 0, output_tokens: usage.completion_tokens || 0, script: 'voice-command' });
    return reply;
  } catch (e) {
    log(`Chat error: ${e.message}`);
    return "Sorry, I had trouble processing that. Can you say it again?";
  }
}

/**
 * Companion mode — proactive short-form chat
 */
async function companionSpeak() {
  const topic = COMPANION_TOPICS[companionIndex % COMPANION_TOPICS.length];
  companionIndex++;

  try {
    const res = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o-mini',
      max_tokens: 80,
      temperature: 0.95,
      messages: [
        {
          role: 'system',
          content: `You are Claude, a witty AI companion chatting with Lee Akpareva via Bluetooth speaker. You're in radio/companion mode — proactively sharing interesting nuggets. Rules:
- ONE sentence only, max 20 words
- Be punchy, surprising, opinionated — not generic
- Sound like a smart friend, not a news anchor
- Use current knowledge, real stats and names
- Vary your tone: sometimes funny, sometimes mind-blowing, sometimes provocative
- Never start with "Did you know" — just say the fact directly`
        },
        { role: 'user', content: `Tell me ${topic}` }
      ]
    }, {
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    });
    const usage = res.data.usage || {};
    costTracker.logCall('gpt-4o-mini', { input_tokens: usage.prompt_tokens || 0, output_tokens: usage.completion_tokens || 0, script: 'voice-companion' });
    return res.data.choices[0].message.content.trim();
  } catch (e) {
    log(`Companion chat error: ${e.message}`);
    return null;
  }
}

/**
 * Quick listen — short timeout, checks if user said something during companion mode
 */
async function quickListen(maxSeconds = 4) {
  const audioFile = path.join(AUDIO_DIR, `cmd-${Date.now()}.wav`);
  try {
    const result = await daemonRequest({ action: 'quick_record', output: audioFile, max_seconds: maxSeconds });
    if (result.error || !result.speech) return null;
    const transcript = await transcribe(audioFile);
    try { fs.unlinkSync(audioFile); } catch (e) { /* */ }
    return transcript ? transcript.trim() : null;
  } catch (e) {
    return null;
  }
}

/**
 * Strip wake word from transcript
 */
function stripWakeWord(text) {
  return text.replace(/^(hey |ok )?(claude|navada)[,.\s!]*/i, '').trim();
}

/**
 * Check if text matches any phrase in a list
 */
function matchesPhrase(text, phrases) {
  const lower = text.toLowerCase();
  return phrases.some(phrase => lower.includes(phrase));
}

/**
 * Process a command (in ACTIVE or CONVO mode)
 */
async function processCommand(transcript, fromConvo = false) {
  const command = fromConvo ? transcript : stripWakeWord(transcript);
  const lower = command.toLowerCase();

  if (!command || command.length < 2) return;
  log(`Processing: "${command}"`);

  // --- Mode control commands ---

  // Sleep
  if (matchesPhrase(lower, SLEEP_PHRASES)) {
    mode = 'SLEEPING';
    await speak("Going to sleep. Say Claude wake up when you need me.");
    log('Entered SLEEPING mode');
    return;
  }

  // Companion mode
  if (matchesPhrase(lower, COMPANION_START)) {
    mode = 'COMPANION';
    companionIndex = Math.floor(Math.random() * COMPANION_TOPICS.length);
    await speak("Companion mode. I'll keep the conversation going — say stop whenever.");
    log('Entered COMPANION mode');
    return;
  }

  // Conversation mode
  if (matchesPhrase(lower, CONVO_START)) {
    mode = 'CONVO';
    conversationHistory = [];
    await speak("Conversation mode. Go ahead, I'm listening.");
    log('Entered CONVO mode');
    return;
  }

  // Exit conversation or companion
  if (fromConvo && matchesPhrase(lower, CONVO_END)) {
    mode = 'STANDBY';
    conversationHistory = [];
    await speak("Alright, going back to standby. Say Claude when you need me.");
    log('Exited CONVO mode → STANDBY');
    return;
  }

  // --- Built-in quick commands ---

  if (lower.includes('what time') || lower.includes("what's the time")) {
    const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    await speak(`It's ${time}.`);
    return;
  }

  if (lower.includes('system status') || lower === 'status') {
    try {
      const pm2 = execSync('pm2 jlist', { encoding: 'utf8', timeout: 5000, windowsHide: true });
      const procs = JSON.parse(pm2);
      const running = procs.filter(p => p.pm2_env.status === 'online').length;
      await speak(`System's running fine. ${running} processes active in PM2. All good.`);
    } catch (e) {
      await speak("I couldn't check the system status right now.");
    }
    return;
  }

  if (lower.includes('send email') || lower.includes('email lee')) {
    await speak("What should the email say?");
    const body = await listenOnce();
    if (body) {
      await sendEmail({
        to: 'lee@navada.info',
        subject: 'Voice Note from Claude',
        heading: 'Voice Command',
        body: p(`<strong>Command:</strong> "${command}"`) + p(`<strong>Message:</strong> "${body}"`),
        type: 'update',
        footerNote: 'Sent via NAVADA Voice Command System',
      });
      await speak("Done, email sent to Lee.");
    } else {
      await speak("I didn't catch that. Email cancelled.");
    }
    return;
  }

  // --- General AI response (with conversation history in CONVO mode) ---
  const reply = await chat(command);
  log(`Reply: "${reply}"`);
  await speak(reply);
}

/**
 * Check for terminal control commands via control file
 */
function checkControl() {
  try {
    if (!fs.existsSync(CONTROL_FILE)) return null;
    const cmd = fs.readFileSync(CONTROL_FILE, 'utf8').trim().toLowerCase();
    fs.unlinkSync(CONTROL_FILE);
    return cmd || null;
  } catch (e) { return null; }
}

async function handleControl(cmd) {
  log(`Terminal command: ${cmd}`);
  switch (cmd) {
    case 'start':
    case 'standby':
      mode = 'STANDBY';
      conversationHistory = [];
      await speak("Voice active. Listening for wake word.");
      log('Terminal → STANDBY');
      break;
    case 'convo':
    case 'conversation':
      mode = 'CONVO';
      conversationHistory = [];
      await speak("Conversation mode activated from terminal.");
      log('Terminal → CONVO');
      break;
    case 'companion':
    case 'radio':
      mode = 'COMPANION';
      companionIndex = Math.floor(Math.random() * COMPANION_TOPICS.length);
      await speak("Companion mode. Here we go.");
      log('Terminal → COMPANION');
      break;
    case 'pause':
    case 'sleep':
      mode = 'SLEEPING';
      await speak("Paused. Send start to resume.");
      log('Terminal → SLEEPING');
      break;
    case 'stop':
      mode = 'STANDBY';
      conversationHistory = [];
      await speak("Stopped. Back to standby.");
      log('Terminal → STANDBY (stop)');
      break;
    case 'status':
      log(`Status: mode=${mode}, history=${conversationHistory.length} turns`);
      break;
    default:
      if (cmd.startsWith('say ')) {
        const text = cmd.slice(4);
        await speak(text);
        log(`Terminal say: "${text}"`);
      } else {
        log(`Unknown terminal command: ${cmd}`);
      }
  }
}

/**
 * HTTP control server — instant command execution on port 7777
 */
function startControlServer() {
  const http = require('http');
  const server = http.createServer(async (req, res) => {
    if (req.method === 'POST' || req.method === 'GET') {
      const url = new URL(req.url, `http://localhost:${CONTROL_PORT}`);
      const cmd = url.pathname.slice(1); // e.g. /companion → companion

      if (cmd === 'say') {
        // Collect POST body for say command
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          const text = body || url.searchParams.get('text') || '';
          if (text) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true, action: 'say', mode }));
            await speak(text);
            log(`HTTP say: "${text}"`);
          } else {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'No text provided' }));
          }
        });
        return;
      }

      if (cmd === 'chat') {
        // Text-to-voice chat: receive text → AI response → speak aloud
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          const text = body || url.searchParams.get('text') || '';
          if (!text) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'No text provided' }));
            return;
          }
          log(`Chat input: "${text}"`);
          const reply = await chat(text);
          log(`Chat reply: "${reply}"`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, input: text, reply, mode }));
          await speak(reply);
        });
        return;
      }

      if (['start', 'stop', 'pause', 'convo', 'companion', 'radio', 'sleep', 'standby', 'status'].includes(cmd)) {
        const prevMode = mode;
        await handleControl(cmd);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, action: cmd, prevMode, mode }));
        return;
      }

      // Default — status
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ mode, uptime: process.uptime(), history: conversationHistory.length }));
      return;
    }
    res.writeHead(404);
    res.end();
  });

  server.listen(CONTROL_PORT, '0.0.0.0', () => {
    log(`Control server on http://0.0.0.0:${CONTROL_PORT}`);
  });
  server.on('error', (e) => log(`Control server error: ${e.message}`));
}

// ==========================================
// MAIN LOOP
// ==========================================

async function startListening() {
  log('=== NAVADA Voice Command System Starting ===');
  log(`Mic: S8 Bluetooth (index ${S8_MIC_INDEX})`);
  log(`Speaker: S8 Bluetooth (index ${S8_SPEAKER_INDEX})`);
  log(`Wake words: ${WAKE_WORDS.join(', ')}`);
  log(`Mode: ${mode}`);

  await ensureDaemon();
  startControlServer();
  await speak("Voice system online. Say Claude to get started.");

  while (true) {
    try {
      // ---- CHECK TERMINAL COMMANDS ----
      const ctrl = checkControl();
      if (ctrl) { await handleControl(ctrl); continue; }

      // ---- SLEEPING MODE ----
      if (mode === 'SLEEPING') {
        const transcript = await listenOnce();
        if (transcript) {
          const lower = transcript.toLowerCase();
          const hasWake = WAKE_WORDS.some(w => lower.includes(w));
          if (hasWake || matchesPhrase(lower, WAKE_PHRASES)) {
            mode = 'STANDBY';
            await speak("I'm awake. What do you need?");
            log('Woke up → STANDBY');
          }
          // Ignore everything else while sleeping
        }
        continue;
      }

      // ---- COMPANION MODE ----
      if (mode === 'COMPANION') {
        // Speak a nugget
        const nugget = await companionSpeak();
        if (nugget) {
          log(`Companion: "${nugget}"`);
          await speak(nugget);
        }

        // Quick listen — check if user wants to stop or respond
        const heard = await quickListen(5);
        if (heard) {
          const hLower = heard.toLowerCase();
          log(`Heard during companion: "${heard}"`);
          if (matchesPhrase(hLower, COMPANION_END) || matchesPhrase(hLower, CONVO_END)) {
            mode = 'STANDBY';
            await speak("Alright, going quiet. Say Claude when you need me.");
            log('Exited COMPANION mode → STANDBY');
          } else {
            // User said something — respond conversationally then continue
            const reply = await chat(heard);
            log(`Reply: "${reply}"`);
            await speak(reply);
          }
        }
        // Brief pause before next nugget
        await new Promise(r => setTimeout(r, 3000));
        continue;
      }

      // ---- CONVERSATION MODE ----
      if (mode === 'CONVO') {
        const transcript = await listenOnce();
        if (transcript) {
          await processCommand(transcript, true);
        }
        continue;
      }

      // ---- STANDBY MODE ----
      const transcript = await listenOnce();
      if (transcript) {
        const lower = transcript.toLowerCase();
        const hasWakeWord = WAKE_WORDS.some(w => lower.includes(w));

        if (hasWakeWord) {
          mode = 'ACTIVE';
          const command = stripWakeWord(transcript);
          if (!command || command.length < 2) {
            // Just the wake word — acknowledge and listen for the actual command
            await speak("Yes?");
            log('Wake word only — waiting for command...');
            const followUp = await listenOnce();
            if (followUp) {
              await processCommand(followUp, true);
            }
          } else {
            await processCommand(transcript, false);
          }
          // Return to standby after processing (unless mode changed)
          if (mode === 'ACTIVE') mode = 'STANDBY';
        } else {
          log(`Ignoring (no wake word): "${transcript}"`);
        }
      }

    } catch (e) {
      log(`Loop error: ${e.message}`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

// --- CLI ---
if (require.main === module) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  fs.mkdirSync(path.join(__dirname, 'logs'), { recursive: true });

  const args = process.argv.slice(2);

  if (args.includes('--test-mic')) {
    log('Testing S8 mic — speak now (5 seconds)...');
    const testFile = path.join(AUDIO_DIR, 'mic-test.wav');
    recordAudio(testFile, 5)
      .then(async (result) => {
        if (result.speech) {
          log(`Recorded ${result.duration}s — transcribing...`);
          const text = await transcribe(testFile);
          console.log(`\nYou said: "${text}"`);
        } else {
          console.log('No speech detected. Check S8 Bluetooth connection.');
        }
        process.exit(0);
      })
      .catch(e => { log(`Failed: ${e.message}`); process.exit(1); });

  } else if (args.includes('--test-speak')) {
    const text = args[args.indexOf('--test-speak') + 1] || 'Hello Lee, voice system is working.';
    speak(text).then(() => process.exit(0));

  } else if (args.includes('--once')) {
    log('Listening for one command...');
    listenOnce().then(async (transcript) => {
      if (transcript) await processCommand(transcript, false);
      else log('No command detected.');
      process.exit(0);
    });

  } else if (args[0] && ['start', 'stop', 'pause', 'convo', 'companion', 'radio', 'sleep', 'standby', 'status'].includes(args[0])) {
    // Send command via HTTP to running daemon (instant), fallback to file
    const http = require('http');
    const req = http.request({ hostname: '127.0.0.1', port: CONTROL_PORT, path: `/${args[0]}`, method: 'GET', timeout: 2000 }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => { console.log(JSON.parse(body).mode ? `Mode: ${JSON.parse(body).mode}` : body); process.exit(0); });
    });
    req.on('error', () => { fs.writeFileSync(CONTROL_FILE, args[0]); console.log(`Sent via file: ${args[0]}`); process.exit(0); });
    req.end();

  } else if (args[0] === 'chat') {
    const text = args.slice(1).join(' ');
    if (!text) { console.log('Usage: node voice-command.js chat "your question"'); process.exit(0); }
    const http = require('http');
    const req = http.request({ hostname: '127.0.0.1', port: CONTROL_PORT, path: '/chat', method: 'POST', timeout: 30000 }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          console.log(`\n${data.reply}\n`);
        } catch (e) { console.log(body); }
        process.exit(0);
      });
    });
    req.on('error', () => { console.log('Voice daemon not running. Start with: pm2 start voice-command.js'); process.exit(1); });
    req.write(text);
    req.end();

  } else if (args[0] === 'say') {
    const text = args.slice(1).join(' ');
    if (!text) { console.log('Usage: node voice-command.js say "Hello Lee"'); process.exit(0); }
    const http = require('http');
    const req = http.request({ hostname: '127.0.0.1', port: CONTROL_PORT, path: '/say', method: 'POST', timeout: 2000 }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => { console.log('Playing...'); process.exit(0); });
    });
    req.on('error', () => { fs.writeFileSync(CONTROL_FILE, `say ${text}`); console.log(`Sent via file: say "${text}"`); process.exit(0); });
    req.write(text);
    req.end();

  } else if (args[0] === 'help') {
    console.log(`
NAVADA Voice Command System — Terminal Controls

  node voice-command.js                 Start daemon (PM2)
  node voice-command.js start           Activate → STANDBY
  node voice-command.js convo           Activate → CONVERSATION mode
  node voice-command.js companion       Activate → COMPANION mode (radio)
  node voice-command.js pause           Pause listening (SLEEP)
  node voice-command.js stop            Stop → STANDBY
  node voice-command.js status          Show current mode
  node voice-command.js chat "text"     Type → AI responds with voice
  node voice-command.js say "text"      Speak text through S8 (no AI)
  node voice-command.js --test-mic      Test S8 microphone
  node voice-command.js --test-speak    Test S8 speaker
  node voice-command.js --once          Listen for one command
  node voice-command.js help            Show this help
`);
    process.exit(0);

  } else {
    // Default: continuous listening mode (PM2 daemon)
    startListening().catch(e => { log(`Fatal: ${e.message}`); process.exit(1); });
  }
}

module.exports = { recordAudio, transcribe, speak, processCommand, startListening, listenOnce, ensureDaemon, daemonRequest };
