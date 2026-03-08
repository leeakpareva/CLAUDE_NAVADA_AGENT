require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { execSync, exec } = require('child_process');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const initSqlJs = require('sql.js');
const { createClerkClient } = require('@clerk/backend');

const app = express();
const PORT = process.env.PORT || 4000;

// Clerk setup
const clerk = process.env.CLERK_SECRET_KEY
  ? createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })
  : null;

// Directories
const DATA_DIR = path.join(__dirname, 'data');
const HLS_DIR = path.join(__dirname, 'hls');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
[DATA_DIR, HLS_DIR, UPLOAD_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

const DB_PATH = path.join(DATA_DIR, 'flix.db');
let db;

// sql.js helper wrappers (synchronous-style over sql.js)
function dbRun(sql, params = []) {
  db.run(sql, params);
  saveDb();
}

function dbAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function dbGet(sql, params = []) {
  const rows = dbAll(sql, params);
  return rows[0] || null;
}

function saveDb() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

async function start() {
  const SQL = await initSqlJs();

  // Load or create database
  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      filename TEXT NOT NULL,
      duration REAL DEFAULT 0,
      width INTEGER DEFAULT 1920,
      height INTEGER DEFAULT 1080,
      status TEXT DEFAULT 'processing',
      hls_path TEXT,
      thumbnail TEXT,
      source TEXT DEFAULT 'upload',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS playlists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      video_ids TEXT DEFAULT '[]',
      is_live INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  saveDb();

  app.use(cors());
  app.use(express.json());

  // Serve static player
  app.use(express.static(path.join(__dirname, 'public')));

  // Serve uploaded files directly (MP4 fallback when no HLS)
  app.use('/uploads', express.static(UPLOAD_DIR));

  // Auth endpoints (Clerk integration)
  app.get('/api/auth/me', async (req, res) => {
    if (!clerk || !process.env.CLERK_PUBLISHABLE_KEY) {
      // Clerk not fully configured, allow guest access
      return res.json({ name: 'Guest', email: null, role: 'viewer', auth: 'disabled' });
    }

    // Verify Clerk session token from Authorization header or cookie
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const { sub } = await clerk.verifyToken(token);
      const user = await clerk.users.getUser(sub);
      res.json({
        id: user.id,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        email: user.emailAddresses[0]?.emailAddress,
        image: user.imageUrl,
        role: 'viewer',
      });
    } catch (err) {
      res.status(401).json({ error: 'Invalid session' });
    }
  });

  app.get('/api/auth/login', (req, res) => {
    if (process.env.CLERK_PUBLISHABLE_KEY) {
      // Clerk Frontend API domain can be derived from publishable key
      const domain = Buffer.from(process.env.CLERK_PUBLISHABLE_KEY.replace('pk_test_', '').replace('pk_live_', ''), 'base64').toString().replace(/\$$/, '');
      res.redirect(`https://${domain}/sign-in?redirect_url=${encodeURIComponent(req.headers.origin || req.headers.referer || '/')}`);
    } else {
      res.json({ message: 'Clerk publishable key not configured. Add CLERK_PUBLISHABLE_KEY to .env' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    res.json({ success: true });
  });

  // Clerk config endpoint (frontend uses this to initialize)
  app.get('/api/auth/config', (req, res) => {
    res.json({
      publishableKey: process.env.CLERK_PUBLISHABLE_KEY || null,
      enabled: !!process.env.CLERK_PUBLISHABLE_KEY,
    });
  });

  // Serve HLS segments
  app.use('/hls', express.static(HLS_DIR, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.m3u8')) {
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.setHeader('Cache-Control', 'no-cache');
      } else if (filePath.endsWith('.ts')) {
        res.setHeader('Content-Type', 'video/mp2t');
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }
    }
  }));

  // Upload endpoint
  const upload = multer({ dest: UPLOAD_DIR });
  app.post('/api/videos/upload', upload.single('video'), (req, res) => {
    try {
      const { title, description } = req.body;
      const id = uuidv4();
      const ext = path.extname(req.file.originalname) || '.mp4';
      const filename = `${id}${ext}`;
      const destPath = path.join(UPLOAD_DIR, filename);

      fs.renameSync(req.file.path, destPath);

      dbRun(`INSERT INTO videos (id, title, description, filename, source) VALUES (?, ?, ?, ?, 'upload')`,
        [id, title || req.file.originalname, description || '', filename]);

      transcodeVideo(id, destPath);
      res.json({ id, status: 'processing', message: 'Video uploaded, transcoding started' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Import from local path (for Remotion-rendered videos)
  app.post('/api/videos/import', (req, res) => {
    try {
      const { path: filePath, title, description } = req.body;
      if (!filePath || !fs.existsSync(filePath)) {
        return res.status(400).json({ error: 'File not found' });
      }

      const id = uuidv4();
      const ext = path.extname(filePath) || '.mp4';
      const filename = `${id}${ext}`;
      const destPath = path.join(UPLOAD_DIR, filename);

      fs.copyFileSync(filePath, destPath);

      dbRun(`INSERT INTO videos (id, title, description, filename, source) VALUES (?, ?, ?, ?, 'remotion')`,
        [id, title || path.basename(filePath), description || '', filename]);

      transcodeVideo(id, destPath);
      res.json({ id, status: 'processing', message: 'Video imported, transcoding started' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // List videos
  app.get('/api/videos', (req, res) => {
    const videos = dbAll('SELECT * FROM videos ORDER BY created_at DESC');
    res.json(videos);
  });

  // Get single video
  app.get('/api/videos/:id', (req, res) => {
    const video = dbGet('SELECT * FROM videos WHERE id = ?', [req.params.id]);
    if (!video) return res.status(404).json({ error: 'Video not found' });
    res.json(video);
  });

  // Delete video
  app.delete('/api/videos/:id', (req, res) => {
    const video = dbGet('SELECT * FROM videos WHERE id = ?', [req.params.id]);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    const hlsDir = path.join(HLS_DIR, video.id);
    if (fs.existsSync(hlsDir)) fs.rmSync(hlsDir, { recursive: true });
    const uploadPath = path.join(UPLOAD_DIR, video.filename);
    if (fs.existsSync(uploadPath)) fs.unlinkSync(uploadPath);

    dbRun('DELETE FROM videos WHERE id = ?', [req.params.id]);
    res.json({ deleted: true });
  });

  // Playlists
  app.get('/api/playlists', (req, res) => {
    const playlists = dbAll('SELECT * FROM playlists ORDER BY created_at DESC');
    res.json(playlists.map(p => ({ ...p, video_ids: JSON.parse(p.video_ids) })));
  });

  app.post('/api/playlists', (req, res) => {
    const { name, description, video_ids } = req.body;
    const id = uuidv4();
    dbRun('INSERT INTO playlists (id, name, description, video_ids) VALUES (?, ?, ?, ?)',
      [id, name, description || '', JSON.stringify(video_ids || [])]);
    res.json({ id, name });
  });

  // 24/7 loop stream endpoint
  app.get('/api/stream/live', (req, res) => {
    const playlist = dbGet('SELECT * FROM playlists WHERE is_live = 1');
    if (!playlist) {
      return res.json({ live: false, message: 'No live playlist set' });
    }
    const videoIds = JSON.parse(playlist.video_ids);
    const videos = videoIds.map(id => dbGet('SELECT * FROM videos WHERE id = ? AND status = ?', [id, 'ready'])).filter(Boolean);

    let m3u8 = '#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:10\n#EXT-X-MEDIA-SEQUENCE:0\n';
    for (const video of videos) {
      const hlsPath = path.join(HLS_DIR, video.id, 'playlist.m3u8');
      if (fs.existsSync(hlsPath)) {
        const content = fs.readFileSync(hlsPath, 'utf-8');
        const segments = content.split('\n').filter(l => l.endsWith('.ts'));
        const extinfs = content.split('\n').filter(l => l.startsWith('#EXTINF'));
        for (let i = 0; i < segments.length; i++) {
          m3u8 += `${extinfs[i] || '#EXTINF:10.0,'}\n`;
          m3u8 += `/hls/${video.id}/${segments[i]}\n`;
        }
      }
    }
    m3u8 += '#EXT-X-ENDLIST\n';
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.send(m3u8);
  });

  // Health check
  app.get('/health', (req, res) => res.json({ status: 'ok', service: 'navada-flix' }));

  // Generate thumbnail
  app.post('/api/videos/:id/thumbnail', (req, res) => {
    const video = dbGet('SELECT * FROM videos WHERE id = ?', [req.params.id]);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    const inputPath = path.join(UPLOAD_DIR, video.filename);
    const thumbPath = path.join(HLS_DIR, video.id, 'thumb.jpg');

    try {
      execSync(`ffmpeg -i "${inputPath}" -ss 1 -vframes 1 -vf "scale=640:360" -y "${thumbPath}"`);
      dbRun('UPDATE videos SET thumbnail = ? WHERE id = ?', [`/hls/${video.id}/thumb.jpg`, video.id]);
      res.json({ thumbnail: `/hls/${video.id}/thumb.jpg` });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NAVADA Flix running on http://0.0.0.0:${PORT}`);
  });
}

// Transcode function
function transcodeVideo(id, inputPath) {
  const outputDir = path.join(HLS_DIR, id);
  fs.mkdirSync(outputDir, { recursive: true });

  // Check if ffmpeg is available
  try {
    execSync('ffmpeg -version', { stdio: 'pipe' });
  } catch {
    console.log(`[TRANSCODE] FFmpeg not found, marking ${id} as ready without HLS`);
    dbRun('UPDATE videos SET status = ?, hls_path = ? WHERE id = ?', ['ready', null, id]);
    return;
  }

  const cmd = `ffmpeg -i "${inputPath}" -y ` +
    `-vf "scale=1280:720" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k ` +
    `-hls_time 10 -hls_list_size 0 -hls_segment_filename "${outputDir}/720p_%03d.ts" "${outputDir}/720p.m3u8"`;

  console.log(`[TRANSCODE] Starting: ${id}`);

  exec(cmd, (err) => {
    if (err) {
      console.error(`[TRANSCODE] Error for ${id}:`, err.message);
      dbRun('UPDATE videos SET status = ? WHERE id = ?', ['ready', id]);
      return;
    }

    const master = `#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=1280x720\n720p.m3u8\n`;
    fs.writeFileSync(path.join(outputDir, 'playlist.m3u8'), master);

    try {
      const probe = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`).toString().trim();
      dbRun('UPDATE videos SET status = ?, hls_path = ?, duration = ? WHERE id = ?',
        ['ready', `/hls/${id}/playlist.m3u8`, parseFloat(probe) || 0, id]);
    } catch {
      dbRun('UPDATE videos SET status = ?, hls_path = ? WHERE id = ?',
        ['ready', `/hls/${id}/playlist.m3u8`, id]);
    }
    console.log(`[TRANSCODE] Complete: ${id}`);
  });
}

start().catch(err => {
  console.error('Failed to start NAVADA Flix:', err);
  process.exit(1);
});
