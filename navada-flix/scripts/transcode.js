#!/usr/bin/env node
// Standalone transcode script for converting MP4 to HLS
// Usage: node transcode.js <input.mp4> <output-dir> [video-id]

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const input = process.argv[2];
const outputDir = process.argv[3] || './hls/output';
const videoId = process.argv[4] || 'video';

if (!input) {
  console.log('Usage: node transcode.js <input.mp4> [output-dir] [video-id]');
  process.exit(1);
}

if (!fs.existsSync(input)) {
  console.error(`File not found: ${input}`);
  process.exit(1);
}

fs.mkdirSync(outputDir, { recursive: true });

console.log(`Transcoding: ${input}`);
console.log(`Output: ${outputDir}`);

const qualities = [
  { name: '480p', scale: '854:480', crf: 25, audioBitrate: '96k', bandwidth: 800000 },
  { name: '720p', scale: '1280:720', crf: 23, audioBitrate: '128k', bandwidth: 1400000 },
  { name: '1080p', scale: '1920:1080', crf: 22, audioBitrate: '192k', bandwidth: 2800000 },
];

for (const q of qualities) {
  console.log(`  Encoding ${q.name}...`);
  const cmd = `ffmpeg -i "${input}" -y ` +
    `-vf "scale=${q.scale}" -c:v libx264 -preset fast -crf ${q.crf} ` +
    `-c:a aac -b:a ${q.audioBitrate} ` +
    `-hls_time 10 -hls_list_size 0 ` +
    `-hls_segment_filename "${outputDir}/${q.name}_%03d.ts" ` +
    `"${outputDir}/${q.name}.m3u8"`;

  try {
    execSync(cmd, { stdio: 'pipe' });
    console.log(`  ${q.name} done`);
  } catch (err) {
    console.error(`  ${q.name} failed: ${err.message}`);
  }
}

// Master playlist
const master = `#EXTM3U
#EXT-X-VERSION:3
${qualities.map(q => `#EXT-X-STREAM-INF:BANDWIDTH=${q.bandwidth},RESOLUTION=${q.scale.replace(':', 'x')}
${q.name}.m3u8`).join('\n')}
`;

fs.writeFileSync(path.join(outputDir, 'playlist.m3u8'), master);
console.log('Master playlist created');

// Get duration
try {
  const duration = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${input}"`).toString().trim();
  console.log(`Duration: ${parseFloat(duration).toFixed(1)}s`);
} catch {}

console.log('Transcoding complete!');
