# PM2 Multi-Server Setup Script for NAVADA Network (Windows)
# Run this on Windows servers to connect to PM2.io dashboard

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "NAVADA PM2 Multi-Server Setup" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan

# PM2 Keys
$PM2_SECRET = "7x8u4nnk1tpr9hu"
$PM2_PUBLIC = "7ogf0c2lvka1ere"

# Get hostname
$HOSTNAME = hostname

Write-Host "Setting up PM2 monitoring for: $HOSTNAME" -ForegroundColor Green

# Check if PM2 is installed
try {
    pm2 -v | Out-Null
    Write-Host "PM2 is already installed" -ForegroundColor Green
} catch {
    Write-Host "Installing PM2..." -ForegroundColor Yellow
    npm install -g pm2
}

# Install @pm2/io for metrics
Write-Host "Installing PM2 IO module..." -ForegroundColor Yellow
npm install -g @pm2/io

# Link to PM2.io dashboard
Write-Host "Linking to PM2.io dashboard..." -ForegroundColor Yellow
pm2 link $PM2_SECRET $PM2_PUBLIC $HOSTNAME

# Create monitor app
$monitorScript = @'
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
'@

$monitorPath = "$env:TEMP\server-monitor.js"
$monitorScript | Out-File -FilePath $monitorPath -Encoding UTF8

# Start the monitor app with PM2
Write-Host "Starting server monitor..." -ForegroundColor Yellow
pm2 start $monitorPath --name "$HOSTNAME-monitor" --update-env

# Save PM2 configuration
pm2 save

# Setup PM2 startup (Windows)
Write-Host "Setting up PM2 startup script..." -ForegroundColor Yellow
pm2 startup

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host "Dashboard: https://app.pm2.io/#/r/$PM2_PUBLIC" -ForegroundColor Cyan
Write-Host "Server: $HOSTNAME" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan

# Show current status
pm2 list