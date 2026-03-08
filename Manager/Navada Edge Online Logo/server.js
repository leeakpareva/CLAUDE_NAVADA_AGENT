const http = require('http');
const PORT = 3000;

const R = '\x1b[0m';
const cols = process.stdout.columns || 120;
const rows = process.stdout.rows || 30;

const C = {
  cyan:    s => `\x1b[96m${s}${R}`,
  blue:    s => `\x1b[94m${s}${R}`,
  white:   s => `\x1b[97m${s}${R}`,
  dim:     s => `\x1b[2m${s}${R}`,
  bold:    s => `\x1b[1m${s}${R}`,
  green:   s => `\x1b[92m${s}${R}`,
  yellow:  s => `\x1b[93m${s}${R}`,
  magenta: s => `\x1b[95m${s}${R}`,
  red:     s => `\x1b[91m${s}${R}`,
  gray:    s => `\x1b[90m${s}${R}`,
};

const hide  = () => process.stdout.write('\x1b[?25l');
const show  = () => process.stdout.write('\x1b[?25h');
const clear = () => process.stdout.write('\x1b[2J\x1b[H');
const move  = (r,c) => process.stdout.write(`\x1b[${r};${c}H`);

const LOGO = [
  '███╗   ██╗ █████╗ ██╗   ██╗ █████╗ ██████╗  █████╗ ',
  '████╗  ██║██╔══██╗██║   ██║██╔══██╗██╔══██╗██╔══██╗',
  '██╔██╗ ██║███████║██║   ██║███████║██║  ██║███████║',
  '██║╚██╗██║██╔══██║╚██╗ ██╔╝██╔══██║██║  ██║██╔══██║',
  '██║ ╚████║██║  ██║ ╚████╔╝ ██║  ██║██████╔╝██║  ██║',
  '╚═╝  ╚═══╝╚═╝  ╚═╝  ╚═══╝  ╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝',
];

const EDGE = [
  '███████╗██████╗  ██████╗ ███████╗',
  '██╔════╝██╔══██╗██╔════╝ ██╔════╝',
  '█████╗  ██║  ██║██║  ███╗█████╗  ',
  '██╔══╝  ██║  ██║██║   ██║██╔══╝  ',
  '███████╗██████╔╝╚██████╔╝███████╗',
  '╚══════╝╚═════╝  ╚═════╝ ╚══════╝',
];

const rainCols = Math.floor(cols / 2);
const drops = Array.from({length: rainCols}, () => Math.random() * rows | 0);
const chars  = '01アイウエオカキクケコサシスセソタチツテト∑∆∏∫Ωαβγδ░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼';

function randChar() { return chars[Math.random() * chars.length | 0]; }

const rainGrid = Array.from({length: rows}, () => Array(rainCols).fill(' '));
const rainBright = Array.from({length: rows}, () => Array(rainCols).fill(false));

function tickRain() {
  for (let c = 0; c < rainCols; c++) {
    const r = drops[c];
    if (r < rows) {
      rainGrid[r][c] = randChar();
      rainBright[r][c] = true;
      if (r > 0) rainBright[r-1][c] = false;
    }
    if (Math.random() > 0.975) drops[c] = 0;
    else drops[c] = (drops[c] + 1) % (rows + 5);
  }
}

function drawRain() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < rainCols; c++) {
      const ch = rainGrid[r][c];
      if (ch === ' ') continue;
      move(r + 1, c * 2 + 1);
      const bright = rainBright[r][c];
      process.stdout.write(bright ? `\x1b[97m${ch}${R}` : `\x1b[32m${ch}${R}`);
    }
  }
}

const glitchChars = '!@#$%^&*░▒▓╬╪╫╔╗╚╝═║';
function glitch(str) {
  return str.split('').map(c =>
    c !== ' ' && Math.random() < 0.04
      ? glitchChars[Math.random() * glitchChars.length | 0]
      : c
  ).join('');
}

const palette = [C.cyan, C.blue, C.magenta, C.white, C.cyan];
let phase = 0;

function logoColor(line, idx) {
  const fn = palette[(idx + phase) % palette.length];
  return fn(line);
}

const statusMsgs = [
  '[ SYSTEM ONLINE ]',
  '[ AGENT CONNECTED ]',
  '[ CHANNEL: ACTIVE ]',
  '[ NAVADA EDGE v2.1 ]',
  '[ ANTHROPIC CORE LOADED ]',
  '[ SECURE TUNNEL ESTABLISHED ]',
];
let statusIdx = 0;
let statusFrame = 0;
const spinners = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];

let scanRow = 0;

function draw(frame) {
  tickRain();
  drawRain();

  const logoWidth = LOGO[0].length;
  const edgeWidth = EDGE[0].length;
  const logoStartCol = Math.max(1, Math.floor((cols - logoWidth) / 2));
  const edgeStartCol = Math.max(1, Math.floor((cols - edgeWidth) / 2));
  const startRow = Math.max(2, Math.floor((rows - 18) / 2));

  const boxW = Math.max(logoWidth, edgeWidth) + 8;
  const boxH = 18;
  const boxC = Math.floor((cols - boxW) / 2);
  const boxR = startRow - 1;
  const boxColor = frame % 60 < 30 ? C.cyan : C.blue;

  move(boxR, boxC);
  process.stdout.write(boxColor('╔' + '═'.repeat(boxW) + '╗'));
  for (let i = 1; i <= boxH; i++) {
    move(boxR + i, boxC);
    process.stdout.write(boxColor('║'));
    move(boxR + i, boxC + boxW + 1);
    process.stdout.write(boxColor('║'));
  }
  move(boxR + boxH + 1, boxC);
  process.stdout.write(boxColor('╚' + '═'.repeat(boxW) + '╝'));

  LOGO.forEach((line, i) => {
    move(startRow + i, logoStartCol);
    const colored = logoColor(glitch(line), i);
    process.stdout.write(colored);
  });

  const sepRow = startRow + LOGO.length + 1;
  move(sepRow, logoStartCol);
  const sepColor = frame % 40 < 20 ? C.cyan : C.blue;
  process.stdout.write(sepColor('─'.repeat(logoWidth)));

  const edgeRow = sepRow + 1;
  EDGE.forEach((line, i) => {
    move(edgeRow + i, edgeStartCol);
    const fn = frame % 30 < 15 ? C.blue : C.cyan;
    process.stdout.write(fn(glitch(line)));
  });

  const onlineRow = edgeRow + EDGE.length + 1;
  const onlineText = frame % 20 < 10
    ? C.green(C.bold('  ●  ONLINE  ●  '))
    : C.dim('  ○  ONLINE  ○  ');
  const onlineCol = Math.floor((cols - 16) / 2);
  move(onlineRow, onlineCol);
  process.stdout.write(onlineText);

  statusFrame++;
  if (statusFrame % 40 === 0) statusIdx = (statusIdx + 1) % statusMsgs.length;
  const spin = spinners[Math.floor(statusFrame / 3) % spinners.length];
  const status = `${spin} ${statusMsgs[statusIdx]} ${spin}`;
  const statusCol = Math.floor((cols - status.length) / 2);
  move(rows - 1, statusCol);
  process.stdout.write(C.yellow(status));

  scanRow = (scanRow + 1) % rows;
  move(scanRow + 1, 1);
  process.stdout.write(`\x1b[7m${' '.repeat(cols)}\x1b[m`);

  phase = Math.floor(frame / 15) % palette.length;
}

async function boot() {
  hide();
  clear();

  const bootLines = [
    '> INITIALISING NAVADA EDGE SYSTEM...',
    '> LOADING ANTHROPIC CORE MODULE......',
    '> ESTABLISHING AGENT CHANNELS........',
    '> TELEGRAM    [████████████] ONLINE',
    '> SMS         [████████████] ONLINE',
    '> WHATSAPP    [████████████] ONLINE',
    '> ALL SYSTEMS NOMINAL. LAUNCHING...',
  ];

  for (let i = 0; i < bootLines.length; i++) {
    move(Math.floor(rows/2) - 3 + i, Math.floor((cols - bootLines[i].length) / 2));
    process.stdout.write(C.green(bootLines[i]));
    await new Promise(r => setTimeout(r, 280));
  }

  await new Promise(r => setTimeout(r, 600));
  clear();
}

// ─── Web server: browser version of the animation ───
const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NAVADA EDGE | ONLINE</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #0a0a0a;
    overflow: hidden;
    font-family: 'Courier New', 'Consolas', monospace;
    color: #00ff88;
    width: 100vw;
    height: 100vh;
  }
  #rain {
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    z-index: 0;
    opacity: 0.4;
  }
  #scanline {
    position: fixed;
    top: 0; left: 0;
    width: 100%;
    height: 3px;
    background: rgba(0,255,136,0.08);
    z-index: 5;
    pointer-events: none;
  }
  .crt::before {
    content: '';
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: repeating-linear-gradient(
      0deg,
      rgba(0,0,0,0.15) 0px,
      rgba(0,0,0,0.15) 1px,
      transparent 1px,
      transparent 3px
    );
    z-index: 10;
    pointer-events: none;
  }
  .crt::after {
    content: '';
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%);
    z-index: 10;
    pointer-events: none;
  }
  #content {
    position: relative;
    z-index: 3;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    gap: 0;
  }
  #boot {
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: #0a0a0a;
    z-index: 100;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: opacity 0.5s;
  }
  .boot-line {
    font-size: 14px;
    color: #00ff88;
    opacity: 0;
    white-space: pre;
    text-shadow: 0 0 8px rgba(0,255,136,0.6);
  }
  #box {
    border: 2px solid #00d4ff;
    padding: 30px 40px;
    position: relative;
    background: rgba(0,0,0,0.7);
    box-shadow: 0 0 30px rgba(0,212,255,0.15), inset 0 0 30px rgba(0,212,255,0.05);
    transition: border-color 1.5s;
  }
  .logo-line {
    font-size: clamp(6px, 1.4vw, 14px);
    line-height: 1.1;
    white-space: pre;
    text-align: center;
    color: #00d4ff;
    text-shadow: 0 0 10px rgba(0,212,255,0.5);
    transition: color 0.8s;
  }
  #separator {
    width: 100%;
    height: 1px;
    background: #00d4ff;
    margin: 10px 0;
    box-shadow: 0 0 8px rgba(0,212,255,0.5);
    transition: background 1.5s;
  }
  .edge-line {
    font-size: clamp(6px, 1.4vw, 14px);
    line-height: 1.1;
    white-space: pre;
    text-align: center;
    color: #0088ff;
    text-shadow: 0 0 10px rgba(0,136,255,0.5);
    transition: color 0.8s;
  }
  #online {
    margin-top: 16px;
    font-size: 18px;
    font-weight: bold;
    letter-spacing: 6px;
    text-align: center;
  }
  .online-on {
    color: #00ff88;
    text-shadow: 0 0 15px rgba(0,255,136,0.8), 0 0 30px rgba(0,255,136,0.4);
  }
  .online-dim {
    color: #336644;
    text-shadow: none;
  }
  #status {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 4;
    font-size: 13px;
    color: #ffcc00;
    text-shadow: 0 0 8px rgba(255,204,0,0.5);
    letter-spacing: 2px;
    white-space: nowrap;
  }
  @keyframes glitchFlicker {
    0%, 92%, 100% { opacity: 1; }
    93% { opacity: 0.8; transform: translate(-2px, 1px); }
    94% { opacity: 0.9; transform: translate(1px, -1px); }
    95% { opacity: 1; transform: translate(0,0); }
  }
  #box { animation: glitchFlicker 4s infinite; }
</style>
</head>
<body class="crt">

<canvas id="rain"></canvas>
<div id="scanline"></div>

<div id="boot"></div>

<div id="content" style="opacity:0">
  <div id="box">
    <div id="logo"></div>
    <div id="separator"></div>
    <div id="edge"></div>
    <div id="online"></div>
  </div>
</div>

<div id="status"></div>

<script>
const LOGO = [
  '\u2588\u2588\u2588\u2557   \u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2557   \u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2588\u2588\u2588\u2557 ',
  '\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557',
  '\u2588\u2588\u2554\u2588\u2588\u2557 \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551\u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551\u2588\u2588\u2551  \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551',
  '\u2588\u2588\u2551\u255a\u2588\u2588\u2557\u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2551\u255a\u2588\u2588\u2557 \u2588\u2588\u2554\u255d\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2551\u2588\u2588\u2551  \u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2551',
  '\u2588\u2588\u2551 \u255a\u2588\u2588\u2588\u2588\u2551\u2588\u2588\u2551  \u2588\u2588\u2551 \u255a\u2588\u2588\u2588\u2588\u2554\u255d \u2588\u2588\u2551  \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255d\u2588\u2588\u2551  \u2588\u2588\u2551',
  '\u255a\u2550\u255d  \u255a\u2550\u2550\u2550\u255d\u255a\u2550\u255d  \u255a\u2550\u255d  \u255a\u2550\u2550\u2550\u255d  \u255a\u2550\u255d  \u255a\u2550\u255d\u255a\u2550\u2550\u2550\u2550\u2550\u255d \u255a\u2550\u255d  \u255a\u2550\u255d',
];

const EDGE = [
  '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557',
  '\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255d\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255d \u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255d',
  '\u2588\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2551  \u2588\u2588\u2551\u2588\u2588\u2551  \u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2557  ',
  '\u2588\u2588\u2554\u2550\u2550\u255d  \u2588\u2588\u2551  \u2588\u2588\u2551\u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u255d  ',
  '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255d\u255a\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255d\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557',
  '\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u255d\u255a\u2550\u2550\u2550\u2550\u2550\u255d  \u255a\u2550\u2550\u2550\u2550\u2550\u255d \u255a\u2550\u2550\u2550\u2550\u2550\u2550\u255d',
];

const glitchChars = '!@#$%^&*\u2591\u2592\u2593\u256c\u256a\u256b\u2554\u2557\u255a\u255d\u2550\u2551';
const matrixChars = '01\u30a2\u30a4\u30a6\u30a8\u30aa\u30ab\u30ad\u30af\u30b1\u30b3\u30b5\u30b7\u30b9\u30bb\u30bd\u30bf\u30c1\u30c4\u30c6\u30c8\u2211\u2206\u220f\u222b\u03a9\u03b1\u03b2\u03b3\u03b4\u2591\u2592\u2593\u2502\u2524\u2561\u2562\u2556\u2555\u2563\u2551\u2557\u255d\u255c\u255b\u2510\u2514\u2534\u252c\u251c\u2500\u253c';

const statusMsgs = [
  '[ SYSTEM ONLINE ]',
  '[ AGENT CONNECTED ]',
  '[ CHANNEL: ACTIVE ]',
  '[ NAVADA EDGE v2.1 ]',
  '[ ANTHROPIC CORE LOADED ]',
  '[ SECURE TUNNEL ESTABLISHED ]',
];
const spinners = ['\u280b','\u2819','\u2839','\u2838','\u283c','\u2834','\u2826','\u2827','\u2807','\u280f'];

const bootLines = [
  '> INITIALISING NAVADA EDGE SYSTEM...',
  '> LOADING ANTHROPIC CORE MODULE......',
  '> ESTABLISHING AGENT CHANNELS........',
  '> TELEGRAM    [\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588] ONLINE',
  '> SMS         [\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588] ONLINE',
  '> WHATSAPP    [\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588] ONLINE',
  '> ALL SYSTEMS NOMINAL. LAUNCHING...',
];

// ── Matrix Rain ──
const canvas = document.getElementById('rain');
const ctx = canvas.getContext('2d');
let W, H, columns, drops2;

function initRain() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  const sz = 14;
  columns = Math.floor(W / sz);
  drops2 = Array.from({length: columns}, () => Math.random() * H / sz | 0);
}
initRain();
window.addEventListener('resize', initRain);

function drawRain() {
  ctx.fillStyle = 'rgba(10,10,10,0.06)';
  ctx.fillRect(0, 0, W, H);
  ctx.font = '14px monospace';
  for (let i = 0; i < columns; i++) {
    const ch = matrixChars[Math.random() * matrixChars.length | 0];
    const x = i * 14;
    const y = drops2[i] * 14;
    ctx.fillStyle = drops2[i] * 14 > H * 0.9 ? '#00ff88' : '#00aa44';
    if (Math.random() < 0.05) ctx.fillStyle = '#ffffff';
    ctx.fillText(ch, x, y);
    if (y > H && Math.random() > 0.975) drops2[i] = 0;
    drops2[i]++;
  }
}

// ── Scanline ──
const scanEl = document.getElementById('scanline');
let scanY = 0;
function moveScanline() {
  scanY = (scanY + 2) % window.innerHeight;
  scanEl.style.top = scanY + 'px';
}

// ── Glitch ──
function glitch(str) {
  return str.split('').map(c =>
    c !== ' ' && Math.random() < 0.03
      ? glitchChars[Math.random() * glitchChars.length | 0]
      : c
  ).join('');
}

// ── Build DOM ──
const logoEl = document.getElementById('logo');
const edgeEl = document.getElementById('edge');

LOGO.forEach(line => {
  const div = document.createElement('div');
  div.className = 'logo-line';
  div.textContent = line;
  logoEl.appendChild(div);
});

EDGE.forEach(line => {
  const div = document.createElement('div');
  div.className = 'edge-line';
  div.textContent = line;
  edgeEl.appendChild(div);
});

// ── Color cycling ──
const cyans = ['#00d4ff','#00aaff','#cc44ff','#ffffff','#00d4ff'];
const blues = ['#0088ff','#00d4ff','#0088ff','#cc44ff','#0088ff'];
let colorPhase = 0;

function cycleColors(frame) {
  colorPhase = Math.floor(frame / 60) % cyans.length;
  const c1 = cyans[colorPhase];
  const c2 = cyans[(colorPhase + 1) % cyans.length];

  document.querySelectorAll('.logo-line').forEach((el, i) => {
    el.style.color = cyans[(i + colorPhase) % cyans.length];
    el.textContent = glitch(LOGO[i]);
  });

  document.querySelectorAll('.edge-line').forEach((el, i) => {
    el.style.color = frame % 120 < 60 ? '#0088ff' : '#00d4ff';
    el.textContent = glitch(EDGE[i]);
  });

  const box = document.getElementById('box');
  box.style.borderColor = frame % 240 < 120 ? '#00d4ff' : '#0088ff';
  box.style.boxShadow = '0 0 30px ' + (frame % 240 < 120 ? 'rgba(0,212,255,0.15)' : 'rgba(0,136,255,0.15)') + ', inset 0 0 30px rgba(0,212,255,0.05)';

  document.getElementById('separator').style.background = frame % 160 < 80 ? '#00d4ff' : '#0088ff';
}

// ── Online pulse ──
const onlineEl = document.getElementById('online');
function pulseOnline(frame) {
  if (frame % 80 < 40) {
    onlineEl.className = 'online-on';
    onlineEl.textContent = '\u25cf  ONLINE  \u25cf';
  } else {
    onlineEl.className = 'online-dim';
    onlineEl.textContent = '\u25cb  ONLINE  \u25cb';
  }
}

// ── Status ──
const statusEl = document.getElementById('status');
let sIdx = 0, sFrame = 0;
function tickStatus() {
  sFrame++;
  if (sFrame % 160 === 0) sIdx = (sIdx + 1) % statusMsgs.length;
  const sp = spinners[Math.floor(sFrame / 3) % spinners.length];
  statusEl.textContent = sp + ' ' + statusMsgs[sIdx] + ' ' + sp;
}

// ── Boot Sequence ──
async function bootSequence() {
  const bootEl = document.getElementById('boot');
  for (let i = 0; i < bootLines.length; i++) {
    const div = document.createElement('div');
    div.className = 'boot-line';
    div.textContent = bootLines[i];
    bootEl.appendChild(div);
    await new Promise(r => setTimeout(r, 50));
    div.style.opacity = '1';
    div.style.transition = 'opacity 0.2s';
    await new Promise(r => setTimeout(r, 280));
  }
  await new Promise(r => setTimeout(r, 600));
  bootEl.style.opacity = '0';
  await new Promise(r => setTimeout(r, 500));
  bootEl.style.display = 'none';
  document.getElementById('content').style.opacity = '1';
  document.getElementById('content').style.transition = 'opacity 0.8s';
}

// ── Main Loop ──
let frame = 0;
function loop() {
  drawRain();
  moveScanline();
  cycleColors(frame);
  pulseOnline(frame);
  tickStatus();
  frame++;
  requestAnimationFrame(loop);
}

bootSequence().then(() => loop());
// Start rain immediately during boot
(function rainLoop() { drawRain(); requestAnimationFrame(rainLoop); })();
</script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(HTML);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(C.green(`\n  NAVADA EDGE Online Logo server running on:`));
  console.log(C.cyan(`  -> http://localhost:${PORT}`));
  console.log(C.cyan(`  -> http://192.168.0.58:${PORT}`));
  console.log(C.dim(`\n  Press Ctrl+C to stop\n`));
});

// Also run terminal animation
async function main() {
  await boot();
  clear();
  let frame = 0;
  const interval = setInterval(() => {
    draw(frame++);
  }, 80);

  process.on('SIGINT', () => {
    clearInterval(interval);
    show();
    clear();
    process.stdout.write(C.cyan('\nNAVADA EDGE offline.\n'));
    process.exit(0);
  });
}

// Only run terminal animation if stdout is a TTY
if (process.stdout.isTTY) {
  main();
}
