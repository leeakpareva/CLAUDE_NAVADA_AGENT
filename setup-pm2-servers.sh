#!/bin/bash
# PM2 Multi-Server Setup Script for NAVADA Network
# Run this on each server to connect to PM2.io dashboard

echo "==================================="
echo "NAVADA PM2 Multi-Server Setup"
echo "==================================="

# PM2 Keys
PM2_SECRET="7x8u4nnk1tpr9hu"
PM2_PUBLIC="7ogf0c2lvka1ere"

# Detect hostname
HOSTNAME=$(hostname)

echo "Setting up PM2 monitoring for: $HOSTNAME"

# Install PM2 globally if not present
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Install @pm2/io for metrics
echo "Installing PM2 IO module..."
npm install -g @pm2/io

# Link to PM2.io dashboard
echo "Linking to PM2.io dashboard..."
pm2 link $PM2_SECRET $PM2_PUBLIC $HOSTNAME

# Create sample monitor app for each server
cat > /tmp/server-monitor.js << 'EOF'
const io = require('@pm2/io');
const http = require('http');
const os = require('os');

// Custom metrics
const requestCounter = io.counter({
  name: 'Requests',
  id: 'app/requests/total'
});

const heapMetric = io.metric({
  name: 'Heap Usage',
  id: 'app/heap/usage',
  unit: 'MB'
});

const cpuMetric = io.metric({
  name: 'CPU Load',
  id: 'app/cpu/load',
  unit: '%'
});

// Update metrics every 10 seconds
setInterval(() => {
  const used = process.memoryUsage();
  heapMetric.set((used.heapUsed / 1024 / 1024).toFixed(2));

  const cpus = os.cpus();
  let totalLoad = 0;
  cpus.forEach(cpu => {
    const total = Object.values(cpu.times).reduce((a, b) => a + b);
    const idle = cpu.times.idle;
    totalLoad += ((total - idle) / total) * 100;
  });
  cpuMetric.set((totalLoad / cpus.length).toFixed(2));
}, 10000);

// Simple HTTP server
const server = http.createServer((req, res) => {
  requestCounter.inc();
  res.writeHead(200);
  res.end(`NAVADA Server: ${os.hostname()}\nUptime: ${process.uptime()}s\n`);
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server monitor running on port ${PORT}`);
  console.log(`Hostname: ${os.hostname()}`);
  console.log(`Platform: ${os.platform()}`);
  console.log(`CPUs: ${os.cpus().length}`);
  console.log(`Memory: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server monitor...');
  server.close(() => {
    process.exit(0);
  });
});
EOF

# Start the monitor app with PM2
echo "Starting server monitor..."
pm2 start /tmp/server-monitor.js --name "$HOSTNAME-monitor" --update-env

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
echo "Setting up PM2 startup script..."
pm2 startup

echo "==================================="
echo "Setup complete!"
echo "Dashboard: https://app.pm2.io/#/r/$PM2_PUBLIC"
echo "Server: $HOSTNAME"
echo "==================================="

# Show current status
pm2 list