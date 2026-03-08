#!/usr/bin/env node

const http = require('http');
const https = require('https');
const { execSync } = require('child_process');
const os = require('os');

// PM2 metrics
const io = require('@pm2/io');

// Custom metrics
const cpuMetric = io.metric({
  name: 'CPU Usage',
  unit: '%',
});

const memoryMetric = io.metric({
  name: 'Memory Usage',
  unit: 'MB',
});

const tailscaleMetric = io.metric({
  name: 'Tailscale Status',
  value: () => {
    try {
      execSync('powershell -Command "& \'C:\\Program Files\\Tailscale\\tailscale.exe\' status"', { encoding: 'utf-8' });
      return 'Connected';
    } catch (e) {
      return 'Disconnected';
    }
  }
});

// Node health checks
const navadaNodes = [
  { name: 'HP Server', ip: '100.121.187.67', port: 80 },
  { name: 'Oracle VM', ip: '100.77.206.9', port: 22 },
  { name: 'AWS EC2', ip: '100.98.118.33', port: 22 }
];

// Counter for node checks
const nodeChecks = io.counter({
  name: 'Node Health Checks'
});

// Update metrics every 10 seconds
setInterval(() => {
  // CPU usage
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;

  for (let cpu of cpus) {
    for (type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  }

  const idle = totalIdle / cpus.length;
  const total = totalTick / cpus.length;
  const usage = 100 - ~~(100 * idle / total);
  cpuMetric.set(usage);

  // Memory usage
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = (totalMem - freeMem) / 1024 / 1024; // Convert to MB
  memoryMetric.set(Math.round(usedMem));

  // Check nodes
  navadaNodes.forEach(node => {
    nodeChecks.inc();
    checkNode(node);
  });
}, 10000);

function checkNode(node) {
  const start = Date.now();

  // Try to ping via Tailscale
  try {
    const result = execSync(
      `powershell -Command "& 'C:\\Program Files\\Tailscale\\tailscale.exe' ping --c 1 ${node.ip}"`,
      { encoding: 'utf-8', timeout: 5000 }
    );

    const latency = Date.now() - start;
    console.log(`✓ ${node.name}: ${latency}ms`);

    // Send custom event to PM2.io
    io.notifyError(new Error(`${node.name} is UP (${latency}ms)`), {
      custom: {
        node: node.name,
        ip: node.ip,
        status: 'UP',
        latency: latency
      }
    });
  } catch (e) {
    console.log(`✗ ${node.name}: DOWN`);

    io.notifyError(new Error(`${node.name} is DOWN`), {
      custom: {
        node: node.name,
        ip: node.ip,
        status: 'DOWN'
      }
    });
  }
}

// Create simple HTTP server for health endpoint
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      node: 'NAVADA2025',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: os.loadavg()
    }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(3333, () => {
  console.log('NAVADA Monitor running on port 3333');
  console.log('View metrics at: https://app.pm2.io/bucket/69aa4442b84819c2f2ccac2e');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down NAVADA Monitor...');
  server.close();
  process.exit(0);
});