#!/usr/bin/env node
/**
 * NAVADA Edge Version Snapshot
 * Captures infrastructure config files and uploads versioned snapshots to R2.
 *
 * Usage:
 *   node edge-version-snapshot.js --version 2.0 --description "AWS expansion"
 *   node edge-version-snapshot.js --backport   (upload historical v1.0, v1.5 manifests)
 *   node edge-version-snapshot.js --list       (list all versions in R2)
 *
 * Prefix structure: edge-versions/v{X}.{Y}/
 */

const fs = require('fs');
const path = require('path');
const r2 = require('./cloudflare-r2');

// --- Config ---

const SNAPSHOT_FILES = [
  { path: 'C:\\Users\\leeak\\CLAUDE.md', label: 'CLAUDE.md' },
  { path: 'C:\\Users\\leeak\\CLAUDE_NAVADA_AGENT\\ecosystem.config.js', label: 'ecosystem.config.js' },
  { path: 'C:\\Users\\leeak\\CLAUDE_NAVADA_AGENT\\infrastructure\\nginx\\conf.d\\default.conf', label: 'nginx-default.conf' },
  { path: 'C:\\Users\\leeak\\CLAUDE_NAVADA_AGENT\\infrastructure\\docker-compose.yml', label: 'docker-compose.yml' },
  { path: 'C:\\Users\\leeak\\CLAUDE_NAVADA_AGENT\\infrastructure\\nginx\\nginx.conf', label: 'nginx.conf' },
  { path: 'C:\\Users\\leeak\\.claude\\projects\\C--Users-leeak\\memory\\MEMORY.md', label: 'MEMORY.md' },
];

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--version' && argv[i + 1]) args.version = argv[++i];
    else if (argv[i] === '--description' && argv[i + 1]) args.description = argv[++i];
    else if (argv[i] === '--backport') args.backport = true;
    else if (argv[i] === '--list') args.list = true;
  }
  return args;
}

function versionPrefix(version) {
  return `edge-versions/v${version}/`;
}

// --- Snapshot: collect files + manifest, upload to R2 ---

async function createSnapshot(version, description) {
  const prefix = versionPrefix(version);
  const now = new Date().toISOString();
  const uploadedFiles = [];

  console.log(`\n=== NAVADA Edge Snapshot v${version} ===`);
  console.log(`Prefix: ${prefix}`);
  console.log(`Description: ${description}\n`);

  // Upload each config file
  for (const file of SNAPSHOT_FILES) {
    if (!fs.existsSync(file.path)) {
      console.warn(`  SKIP (not found): ${file.path}`);
      continue;
    }
    const buffer = fs.readFileSync(file.path);
    const key = `${prefix}${file.label}`;
    const contentType = file.label.endsWith('.js') ? 'application/javascript'
      : file.label.endsWith('.md') ? 'text/markdown'
      : file.label.endsWith('.yml') ? 'text/yaml'
      : file.label.endsWith('.conf') ? 'text/plain'
      : 'application/octet-stream';

    await r2.uploadBuffer(buffer, key, contentType);
    uploadedFiles.push({
      key,
      label: file.label,
      sourcePath: file.path,
      size: buffer.length,
      sha256: require('crypto').createHash('sha256').update(buffer).digest('hex'),
    });
  }

  // Build manifest
  const manifest = {
    version: `v${version}`,
    date: now,
    description,
    files: uploadedFiles.map(f => ({
      key: f.key,
      label: f.label,
      size: f.size,
      sha256: f.sha256,
    })),
    changelog: [`v${version}: ${description}`],
    services: getServicesForVersion(version),
    nodes: getNodesForVersion(version),
  };

  // Upload manifest
  const manifestKey = `${prefix}manifest.json`;
  const manifestBuffer = Buffer.from(JSON.stringify(manifest, null, 2));
  await r2.uploadBuffer(manifestBuffer, manifestKey, 'application/json');
  console.log(`\nManifest uploaded: ${manifestKey}`);

  console.log(`\nSnapshot v${version} complete: ${uploadedFiles.length} files + manifest`);
  return manifest;
}

// --- Historical backport ---

async function backportHistorical() {
  console.log('\n=== Backporting Historical Versions ===\n');

  const versions = [
    {
      version: '1.0',
      date: '2025-06-15T00:00:00.000Z',
      description: 'Original HP-only NAVADA Edge deployment',
      changelog: [
        'Initial NAVADA Edge deployment on HP laptop',
        'HP as sole always-on production server (Windows 11 Pro, ethernet)',
        'PM2 process management for Node.js services',
        'Telegram bot (Claude Chief of Staff) first deployment',
        'Nginx reverse proxy in Docker on HP',
        'Cloudflare tunnel for public HTTPS access',
        'PostgreSQL on HP (port 5433) for pipeline data',
        'Scheduled automations via Windows Task Scheduler',
      ],
      services: [
        'telegram-bot', 'worldmonitor', 'worldmonitor-api',
        'trading-api', 'inbox-responder', 'auto-deploy',
        'trading-scheduler', 'network-scanner',
      ],
      nodes: [
        { name: 'HP (NAVADA)', role: 'Primary server', ip: '192.168.0.58' },
        { name: 'ASUS (NAVADA2025)', role: 'Dev workstation', ip: '192.168.0.18' },
      ],
    },
    {
      version: '1.5',
      date: '2025-11-01T00:00:00.000Z',
      description: 'Oracle VM migration: Docker and ELK moved off HP',
      changelog: [
        'Docker workloads migrated from HP to Oracle Cloud VM (HP disk full)',
        'ELK stack (Elasticsearch + Kibana + Filebeat) deployed on Oracle',
        'Oracle VM: OCI E5.Flex, 1 OCPU, 12GB RAM at 132.145.46.184',
        'Cloudflare tunnel reconfigured for Oracle-hosted services',
        'CloudBeaver deployed on Oracle for database management',
        'SSH tunnels from HP to Oracle for ELK access',
        'Tailscale mesh expanded: HP, ASUS, Oracle, iPhone',
        'NAVADA Flix video streaming platform launched',
        'NotebookLM R2 auto-upload watcher added',
      ],
      services: [
        'telegram-bot', 'worldmonitor', 'worldmonitor-api',
        'trading-api', 'inbox-responder', 'auto-deploy',
        'trading-scheduler', 'network-scanner', 'navada-flix',
        'navada-logo', 'notebooklm-watcher', 'oracle-elk-tunnel',
      ],
      nodes: [
        { name: 'HP (NAVADA)', role: 'Primary server', ip: '192.168.0.58' },
        { name: 'ASUS (NAVADA2025)', role: 'Dev workstation', ip: '192.168.0.18' },
        { name: 'Oracle VM', role: 'Docker infrastructure host', ip: '132.145.46.184', tailscale: '100.77.206.9' },
      ],
    },
    {
      version: '2.0',
      date: '2026-03-08T00:00:00.000Z',
      description: 'EC2 + Lambda + SageMaker + Bedrock expansion (NAVADA Edge v2)',
      changelog: [
        'AWS EC2 t3.medium added: health monitor, bot standby, YOLO inference',
        'AWS Lambda vision-router: detect, faces, yolo, analyse endpoints',
        'AWS SageMaker serverless: YOLOv8n endpoint (scales to zero)',
        'AWS Bedrock: Claude Sonnet 4.6 + Opus 4.6 access',
        'AWS Rekognition face collection + DynamoDB face/vision logs',
        'EC2 health monitor: 16 endpoints, Telegram + SMS alerts',
        'Auto-failover: HP down 15 min triggers Oracle failover',
        'Bot standby: HP bot down 15 min starts EC2 bot (polling mode)',
        'Jenkins CI/CD on HP Docker (:8082)',
        'Cloudflare subdomains expanded to 10',
        'Twilio SMS + Voice integration (NAVADA phone: +447446994961)',
        'LinkedIn publishing integration',
        'Multi-user Telegram access with guest demo mode',
        'R2 version storage for infrastructure snapshots',
      ],
      services: [
        'telegram-bot', 'worldmonitor', 'worldmonitor-api',
        'trading-api', 'inbox-responder', 'auto-deploy',
        'trading-scheduler', 'network-scanner', 'navada-flix',
        'navada-logo', 'notebooklm-watcher', 'oracle-elk-tunnel',
        'failover-sync',
      ],
      nodes: [
        { name: 'HP (NAVADA)', role: 'Primary server', ip: '192.168.0.58', tailscale: '100.121.187.67' },
        { name: 'ASUS (NAVADA2025)', role: 'Dev workstation', ip: '192.168.0.18', tailscale: '100.88.118.128' },
        { name: 'Oracle VM', role: 'Docker infrastructure host', ip: '132.145.46.184', tailscale: '100.77.206.9' },
        { name: 'AWS EC2', role: 'Health monitor + bot standby + YOLO', ip: '18.130.242.13', tailscale: '100.98.118.33' },
      ],
    },
  ];

  for (const v of versions) {
    const prefix = versionPrefix(v.version);

    // Manifest
    const manifest = {
      version: `v${v.version}`,
      date: v.date,
      description: v.description,
      files: [],
      changelog: v.changelog,
      services: v.services,
      nodes: v.nodes,
    };
    const manifestBuf = Buffer.from(JSON.stringify(manifest, null, 2));
    await r2.uploadBuffer(manifestBuf, `${prefix}manifest.json`, 'application/json');

    // Changelog
    const changelogMd = generateChangelog(v);
    const changelogBuf = Buffer.from(changelogMd);
    await r2.uploadBuffer(changelogBuf, `${prefix}changelog.md`, 'text/markdown');

    console.log(`  Backported v${v.version}: manifest.json + changelog.md`);
  }

  console.log('\nHistorical backport complete.');
}

function generateChangelog(v) {
  const lines = [
    `# NAVADA Edge v${v.version} Changelog`,
    '',
    `**Date**: ${v.date.split('T')[0]}`,
    `**Description**: ${v.description}`,
    '',
    '## Changes',
    '',
    ...v.changelog.map(c => `- ${c}`),
    '',
    '## Services',
    '',
    ...v.services.map(s => `- \`${s}\``),
    '',
    '## Nodes',
    '',
    ...v.nodes.map(n => `- **${n.name}** | ${n.role} | ${n.ip}${n.tailscale ? ` (Tailscale: ${n.tailscale})` : ''}`),
    '',
  ];
  return lines.join('\n');
}

// --- Helpers for live snapshots ---

function getServicesForVersion(version) {
  // Return current PM2 services for any live snapshot
  return [
    'telegram-bot', 'worldmonitor', 'worldmonitor-api',
    'trading-api', 'inbox-responder', 'auto-deploy',
    'trading-scheduler', 'network-scanner', 'navada-flix',
    'navada-logo', 'notebooklm-watcher', 'oracle-elk-tunnel',
    'failover-sync',
  ];
}

function getNodesForVersion(version) {
  return [
    { name: 'HP (NAVADA)', role: 'Primary server', ip: '192.168.0.58', tailscale: '100.121.187.67' },
    { name: 'ASUS (NAVADA2025)', role: 'Dev workstation', ip: '192.168.0.18', tailscale: '100.88.118.128' },
    { name: 'Oracle VM', role: 'Docker infrastructure host', ip: '132.145.46.184', tailscale: '100.77.206.9' },
    { name: 'AWS EC2', role: 'Health monitor + bot standby + YOLO', ip: '18.130.242.13', tailscale: '100.98.118.33' },
  ];
}

// --- List versions ---

async function listVersions() {
  console.log('\n=== NAVADA Edge Versions in R2 ===\n');
  const objects = await r2.listObjects('edge-versions/');
  return objects;
}

// --- CLI ---

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.list) {
    await listVersions();
    return;
  }

  if (args.backport) {
    await backportHistorical();
    return;
  }

  if (!args.version) {
    console.log('NAVADA Edge Version Snapshot');
    console.log('Usage:');
    console.log('  node edge-version-snapshot.js --version 2.0 --description "..."');
    console.log('  node edge-version-snapshot.js --backport');
    console.log('  node edge-version-snapshot.js --list');
    process.exit(0);
  }

  const description = args.description || `NAVADA Edge v${args.version} snapshot`;
  await createSnapshot(args.version, description);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

module.exports = { createSnapshot, backportHistorical, listVersions };
