/**
 * NAVADA Grok Realtime Voice Module
 * Real-time bidirectional voice conversation via xAI Grok WebSocket API
 *
 * Features:
 *   - Server-side VAD (voice activity detection) — no manual silence detection
 *   - Real-time audio streaming (24kHz PCM)
 *   - Grok web_search + x_search tools built-in
 *   - Input transcription via grok-2-audio
 *
 * Usage:
 *   node voice-grok.js                  # Start Grok voice session
 *   node voice-grok.js --voice Sage     # Use different voice (Ara, Sage, etc.)
 *
 * Requires: XAI_API_KEY in .env
 */

require('dotenv').config({ path: __dirname + '/.env' });
const WebSocket = require('ws');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'logs', 'voice-grok.log');
const FFMPEG = 'C:\\Users\\leeak\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.0.1-full_build\\bin\\ffmpeg.exe';
const FFPLAY = 'C:\\Users\\leeak\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.0.1-full_build\\bin\\ffplay.exe';

const S8_MIC_INDEX = 2;
const XAI_API_KEY = process.env.XAI_API_KEY;

// Grok voices: Ara, Sage, Ember, Nova, Orbit
const DEFAULT_VOICE = 'Sage';
const SAMPLE_RATE = 24000; // Grok realtime uses 24kHz

let ws = null;
let micProcess = null;
let speakerProcess = null;
let sessionId = null;
let isConnected = false;
let isRecording = false;
let onStopCallback = null;
let onExitPhraseCallback = null;
const EXIT_PHRASES = ['switch to openai', 'use openai', 'exit grok', 'leave grok', 'stop grok', 'back to normal'];

function log(msg) {
  const line = `[${new Date().toISOString()}] [GROK] ${msg}`;
  console.log(line);
  try { fs.appendFileSync(LOG_FILE, line + '\n'); } catch (e) { /* */ }
}

/**
 * Start ffplay as a raw PCM speaker — we pipe audio chunks into its stdin
 */
function startSpeaker() {
  if (speakerProcess) return;
  speakerProcess = spawn(FFPLAY, [
    '-nodisp', '-autoexit', '-loglevel', 'quiet',
    '-f', 's16le',           // raw signed 16-bit little-endian
    '-ar', String(SAMPLE_RATE),
    '-i', 'pipe:0',
  ], {
    stdio: ['pipe', 'ignore', 'ignore'],
    windowsHide: true,
  });
  speakerProcess.on('close', () => { speakerProcess = null; });
  speakerProcess.on('error', (e) => log(`Speaker error: ${e.message}`));
  speakerProcess.stdin.on('error', () => { /* ffplay closed early */ });
  log('Speaker started (24kHz PCM)');
}

/**
 * Stop the speaker process
 */
function stopSpeaker() {
  if (speakerProcess) {
    try { speakerProcess.stdin.end(); } catch (e) { /* */ }
    try { speakerProcess.kill(); } catch (e) { /* */ }
    speakerProcess = null;
  }
}

/**
 * Restart speaker — used when interrupting playback
 */
function restartSpeaker() {
  stopSpeaker();
  startSpeaker();
}

/**
 * Start capturing mic audio via ffmpeg and stream to WebSocket
 * Uses S8 Bluetooth mic, outputs raw 24kHz 16-bit mono PCM
 */
function startMic() {
  if (micProcess || !ws || !isConnected) return;

  micProcess = spawn(FFMPEG, [
    '-f', 'dshow',
    '-i', 'audio=Headset (2- S8)',
    '-ar', String(SAMPLE_RATE),
    '-ac', '1',
    '-f', 's16le',
    '-loglevel', 'quiet',
    'pipe:1',
  ], {
    stdio: ['ignore', 'pipe', 'ignore'],
    windowsHide: true,
  });

  isRecording = true;

  // Stream mic audio chunks to Grok every ~100ms (4800 bytes at 24kHz 16-bit mono)
  const CHUNK_SIZE = 4800; // 100ms of 24kHz 16-bit mono
  let buffer = Buffer.alloc(0);

  micProcess.stdout.on('data', (data) => {
    if (!isConnected || !ws) return;
    buffer = Buffer.concat([buffer, data]);

    while (buffer.length >= CHUNK_SIZE) {
      const chunk = buffer.subarray(0, CHUNK_SIZE);
      buffer = buffer.subarray(CHUNK_SIZE);

      try {
        ws.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: chunk.toString('base64'),
        }));
      } catch (e) {
        /* WebSocket might be closing */
      }
    }
  });

  micProcess.on('close', () => {
    micProcess = null;
    isRecording = false;
    log('Mic stopped');
  });
  micProcess.on('error', (e) => log(`Mic error: ${e.message}`));
  log('Mic started (24kHz PCM via S8 Bluetooth)');
}

/**
 * Stop mic capture
 */
function stopMic() {
  if (micProcess) {
    try { micProcess.kill(); } catch (e) { /* */ }
    micProcess = null;
    isRecording = false;
  }
}

/**
 * Connect to Grok Realtime WebSocket API
 */
function connect(voice = DEFAULT_VOICE, instructions = '') {
  return new Promise((resolve, reject) => {
    if (!XAI_API_KEY) {
      reject(new Error('XAI_API_KEY not set in .env'));
      return;
    }

    log(`Connecting to Grok Realtime API (voice: ${voice})...`);

    ws = new WebSocket('wss://api.x.ai/v1/realtime', {
      headers: { Authorization: `Bearer ${XAI_API_KEY}` },
    });

    const timeout = setTimeout(() => {
      reject(new Error('Connection timeout'));
      if (ws) ws.close();
    }, 15000);

    ws.on('open', () => {
      log('WebSocket connected — sending session config');
      ws.send(JSON.stringify({
        type: 'session.update',
        session: {
          voice: voice,
          instructions: instructions || `You are Claude, the AI assistant on the NAVADA home server run by Lee Akpareva. You are having a real-time voice conversation via Bluetooth speaker. Be natural, warm, and conversational like a smart colleague. Keep responses concise (2-3 sentences max) — this is spoken aloud. You have web search and X (Twitter) search capabilities. If Lee asks about current events, news, or anything that needs live data, use your search tools.`,
          turn_detection: { type: 'server_vad' },
          tools: [{ type: 'web_search' }, { type: 'x_search' }],
          input_audio_transcription: { model: 'grok-2-audio' },
          audio: {
            input: { format: { type: 'audio/pcm', rate: SAMPLE_RATE } },
            output: { format: { type: 'audio/pcm', rate: SAMPLE_RATE } },
          },
        },
      }));
    });

    ws.on('message', (raw) => {
      let event;
      try {
        event = JSON.parse(raw.toString());
      } catch (e) {
        log(`Invalid JSON from Grok: ${raw.toString().substring(0, 100)}`);
        return;
      }

      switch (event.type) {
        case 'session.created':
          sessionId = event.session?.id;
          if (!isConnected) {
            isConnected = true;
            clearTimeout(timeout);
            log(`Session created: ${sessionId}`);
            resolve(sessionId);
          }
          break;

        case 'session.updated':
          sessionId = event.session?.id || sessionId;
          if (!isConnected) {
            isConnected = true;
            clearTimeout(timeout);
            log(`Session ready (via update): ${sessionId}`);
            resolve(sessionId);
          } else {
            log('Session config updated');
          }
          break;

        case 'input_audio_buffer.speech_started':
          log('User speaking — interrupting playback');
          // Cancel any ongoing response and restart speaker to clear buffer
          try {
            ws.send(JSON.stringify({ type: 'response.cancel' }));
          } catch (e) { /* */ }
          restartSpeaker();
          break;

        case 'input_audio_buffer.speech_stopped':
          log('User stopped speaking');
          break;

        case 'input_audio_buffer.committed':
          log('Audio buffer committed');
          break;

        case 'conversation.item.input_audio_transcription.completed':
          if (event.transcript) {
            log(`You said: "${event.transcript}"`);
            // Check for exit phrases to switch back to OpenAI mode
            const lower = event.transcript.toLowerCase();
            if (EXIT_PHRASES.some(p => lower.includes(p))) {
              log('Exit phrase detected — stopping Grok session');
              if (onExitPhraseCallback) onExitPhraseCallback();
              else stopSession();
            }
          }
          break;

        case 'response.audio.delta':
        case 'response.output_audio.delta':
          // Base64-encoded PCM audio chunk — decode and play
          if (event.delta) {
            const pcm = Buffer.from(event.delta, 'base64');
            if (speakerProcess && speakerProcess.stdin.writable) {
              try {
                speakerProcess.stdin.write(pcm);
              } catch (e) { /* */ }
            }
          }
          break;

        case 'response.audio_transcript.delta':
        case 'response.output_audio_transcript.delta':
          if (event.delta) {
            process.stdout.write(event.delta);
          }
          break;

        case 'response.audio_transcript.done':
        case 'response.output_audio_transcript.done':
          // Full transcript complete
          if (event.transcript) {
            log(`Grok said: "${event.transcript}"`);
          }
          console.log(''); // newline after streaming transcript
          break;

        case 'response.done':
          log(`Response done — tokens: ${event.response?.usage?.total_tokens || 'N/A'}`);
          break;

        case 'response.created':
          log('Grok responding...');
          break;

        case 'error':
          log(`Grok error: ${event.error?.message || event.message || JSON.stringify(event)}`);
          break;

        default:
          // Uncomment for debugging:
          // log(`Event: ${event.type}`);
          break;
      }
    });

    ws.on('close', (code, reason) => {
      isConnected = false;
      sessionId = null;
      log(`WebSocket closed: ${code} ${reason || ''}`);
      stopMic();
      stopSpeaker();
      if (onStopCallback) onStopCallback();
    });

    ws.on('error', (e) => {
      log(`WebSocket error: ${e.message}`);
      clearTimeout(timeout);
      if (!isConnected) reject(e);
    });
  });
}

/**
 * Send a text message to Grok (useful for initial greeting or typed input)
 */
function sendText(text) {
  if (!ws || !isConnected) {
    log('Not connected — cannot send text');
    return;
  }
  ws.send(JSON.stringify({
    type: 'conversation.item.create',
    item: {
      type: 'message',
      role: 'user',
      content: [{ type: 'input_text', text }],
    },
  }));
  ws.send(JSON.stringify({ type: 'response.create' }));
  log(`Sent text: "${text}"`);
}

/**
 * Start a full Grok voice session — mic + speaker + WebSocket
 */
async function startSession(options = {}) {
  const voice = options.voice || DEFAULT_VOICE;
  const instructions = options.instructions || '';
  const greeting = options.greeting !== false;

  try {
    await connect(voice, instructions);
    startSpeaker();
    startMic();

    if (greeting) {
      sendText('Hello! I just connected via the NAVADA Grok voice system. Give me a brief greeting.');
    }

    log('Grok voice session active — speak freely');
    return sessionId;
  } catch (e) {
    log(`Failed to start session: ${e.message}`);
    throw e;
  }
}

/**
 * Stop the Grok voice session
 */
function stopSession() {
  log('Stopping Grok session...');
  stopMic();
  stopSpeaker();
  if (ws) {
    isConnected = false;
    try { ws.close(); } catch (e) { /* */ }
    ws = null;
  }
  sessionId = null;
}

/**
 * Check if session is active
 */
function isActive() {
  return isConnected && ws !== null;
}

/**
 * Set callback for when session stops
 */
function onStop(cb) {
  onStopCallback = cb;
}

/**
 * Set callback for when user says an exit phrase (e.g. "switch to openai")
 */
function onExitPhrase(cb) {
  onExitPhraseCallback = cb;
}

// ==========================================
// CLI — standalone mode
// ==========================================
if (require.main === module) {
  fs.mkdirSync(path.join(__dirname, 'logs'), { recursive: true });

  const args = process.argv.slice(2);
  const voiceIdx = args.indexOf('--voice');
  const voice = voiceIdx !== -1 ? args[voiceIdx + 1] : DEFAULT_VOICE;

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
NAVADA Grok Realtime Voice
  Real-time voice conversation powered by xAI Grok

  node voice-grok.js                  Start voice session (default voice: Sage)
  node voice-grok.js --voice Ara      Use Ara voice
  node voice-grok.js --voice Ember    Use Ember voice
  node voice-grok.js --text "Hi"      Send text message to Grok

  Available voices: Ara, Sage, Ember, Nova, Orbit

  Press Ctrl+C to stop.
`);
    process.exit(0);
  }

  console.log(`\n  NAVADA Grok Voice (${voice})`);
  console.log('  Press Ctrl+C to stop.\n');

  startSession({ voice })
    .then(() => {
      // Send text if provided
      const textIdx = args.indexOf('--text');
      if (textIdx !== -1 && args[textIdx + 1]) {
        sendText(args[textIdx + 1]);
      }
    })
    .catch((e) => {
      console.error(`Failed: ${e.message}`);
      process.exit(1);
    });

  // Graceful shutdown
  const shutdown = () => {
    console.log('\nShutting down...');
    stopSession();
    setTimeout(() => process.exit(0), 1000);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

module.exports = { startSession, stopSession, sendText, isActive, onStop, onExitPhrase, connect, startMic, stopMic, startSpeaker, stopSpeaker };
