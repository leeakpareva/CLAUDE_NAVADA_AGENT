#!/usr/bin/env node

const io = require('@pm2/io');
const os = require('os');
const { execSync } = require('child_process');
const https = require('https');

// ============================================
// CUSTOM METRICS
// ============================================

// Performance Metrics
const cpuMetric = io.metric({
  name: 'CPU Usage %',
  unit: '%',
});

const memoryMetric = io.metric({
  name: 'Memory Used',
  unit: 'GB',
});

const diskMetric = io.metric({
  name: 'Disk Usage',
  unit: '%',
});

// Network Metrics
const networkLatency = io.metric({
  name: 'Network Latency',
  unit: 'ms',
});

const activeConnections = io.metric({
  name: 'Active Connections',
  value: () => {
    try {
      const netstat = execSync('netstat -an | find /c "ESTABLISHED"', { encoding: 'utf-8' });
      return parseInt(netstat.trim());
    } catch (e) {
      return 0;
    }
  }
});

// Telegram Bot Metrics
const telegramMessages = io.counter({
  name: 'Telegram Messages Processed'
});

const apiCalls = io.counter({
  name: 'API Calls Made'
});

const errorRate = io.meter({
  name: 'Errors/min',
  samples: 60,
  timeframe: 60
});

// ============================================
// CUSTOM ACTIONS (Remote Control)
// ============================================

io.action('clear cache', (cb) => {
  // Clear application cache
  console.log('Clearing cache...');
  // Add your cache clearing logic here
  cb({ success: true, message: 'Cache cleared' });
});

io.action('reload config', (cb) => {
  // Reload configuration without restart
  console.log('Reloading configuration...');
  // Add config reload logic
  cb({ success: true, message: 'Config reloaded' });
});

io.action('health check', (cb) => {
  const health = {
    cpu: os.loadavg(),
    memory: {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem()
    },
    uptime: os.uptime(),
    platform: os.platform()
  };
  cb(health);
});

// ============================================
// HISTOGRAM - Track Response Times
// ============================================

const latencyHistogram = io.histogram({
  name: 'Response Time',
  measurement: 'mean',
  unit: 'ms'
});

// ============================================
// ALERTING
// ============================================

// CPU Alert
setInterval(() => {
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;

  for (let cpu of cpus) {
    for (let type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  }

  const usage = 100 - ~~(100 * totalIdle / totalTick);
  cpuMetric.set(usage);

  // Alert if CPU > 80%
  if (usage > 80) {
    io.notifyError(new Error(`High CPU Usage: ${usage}%`), {
      custom: {
        cpu_usage: usage,
        server: 'NAVADA2025',
        timestamp: new Date().toISOString()
      }
    });
  }
}, 5000);

// Memory Monitoring
setInterval(() => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = (totalMem - freeMem) / 1024 / 1024 / 1024; // GB
  memoryMetric.set(usedMem.toFixed(2));

  // Alert if memory > 90%
  const memPercent = ((totalMem - freeMem) / totalMem) * 100;
  if (memPercent > 90) {
    io.notifyError(new Error(`High Memory Usage: ${memPercent.toFixed(1)}%`), {
      custom: {
        memory_percent: memPercent,
        memory_gb: usedMem.toFixed(2),
        server: 'NAVADA2025'
      }
    });
  }
}, 10000);

// Disk Space Check
setInterval(() => {
  try {
    const diskInfo = execSync('wmic logicaldisk get size,freespace,caption', { encoding: 'utf-8' });
    // Parse disk info and update metric
    // This is simplified - you'd parse the actual output
    diskMetric.set(75); // Example value
  } catch (e) {
    console.error('Disk check failed:', e);
  }
}, 60000);

// ============================================
// TRANSACTION TRACING
// ============================================

// Track important operations
function trackOperation(name, operation) {
  const timer = latencyHistogram.timer();

  return operation()
    .then(result => {
      timer.end();
      return result;
    })
    .catch(err => {
      timer.end();
      errorRate.mark();
      throw err;
    });
}

// ============================================
// NAVADA EDGE NETWORK MONITORING
// ============================================

const navadaNodes = [
  { name: 'HP Server', ip: '100.121.187.67', port: 80 },
  { name: 'Oracle VM', ip: '100.77.206.9', port: 22 },
  { name: 'AWS EC2', ip: '100.98.118.33', port: 22 }
];

// Node health histogram
const nodeHealthHistogram = io.histogram({
  name: 'Node Health Check Time',
  measurement: 'mean',
  unit: 'ms'
});

// Check all nodes
setInterval(() => {
  navadaNodes.forEach(node => {
    const timer = nodeHealthHistogram.timer();

    try {
      const start = Date.now();
      execSync(
        `powershell -Command "& 'C:\\Program Files\\Tailscale\\tailscale.exe' ping --c 1 ${node.ip}"`,
        { encoding: 'utf-8', timeout: 5000 }
      );

      const latency = Date.now() - start;
      timer.end();

      // Update network latency metric
      networkLatency.set(latency);

      // Log healthy node
      console.log(`✓ ${node.name}: ${latency}ms`);

    } catch (e) {
      timer.end();
      errorRate.mark();

      // Alert on node down
      io.notifyError(new Error(`Node Down: ${node.name}`), {
        custom: {
          node: node.name,
          ip: node.ip,
          timestamp: new Date().toISOString()
        }
      });
    }
  });
}, 30000);

// ============================================
// CUSTOM EVENT EMITTER
// ============================================

// Emit custom events to PM2.io
io.emit('custom:event', {
  type: 'monitoring_started',
  server: 'NAVADA2025',
  version: '2.0',
  timestamp: new Date().toISOString()
});

// ============================================
// PROCESS EVENTS
// ============================================

process.on('SIGINT', () => {
  io.emit('custom:event', {
    type: 'graceful_shutdown',
    server: 'NAVADA2025'
  });
  process.exit(0);
});

console.log('Enhanced NAVADA Monitoring Active');
console.log('Dashboard: https://app.pm2.io/bucket/69aa4442b84819c2f2ccac2e');

// Keep process alive
setInterval(() => {
  // Heartbeat
}, 1000);