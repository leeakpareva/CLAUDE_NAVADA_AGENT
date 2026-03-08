/**
 * NAVADA Edge Command Centre — Mobile Dashboard
 * Crow Theme | Single-column stacked layout | Auto-refresh 60s
 * Pulls live metrics from AWS CloudWatch, EC2, Lambda, SageMaker
 *
 * Deploy: PM2 on HP | Nginx route /dashboard/ | Cloudflare subdomain
 * Access: dashboard.navada-edge-server.uk | 192.168.0.58:8080/dashboard/
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', 'Automation', '.env') });

const express = require('express');
const { CloudWatchClient, GetMetricDataCommand } = require('@aws-sdk/client-cloudwatch');
const { EC2Client, DescribeInstanceStatusCommand, DescribeInstancesCommand } = require('@aws-sdk/client-ec2');
const { LambdaClient, GetFunctionCommand } = require('@aws-sdk/client-lambda');
const http = require('http');

const app = express();
const PORT = process.env.DASHBOARD_PORT || 9090;
const REGION = 'eu-west-2';
const EC2_ID = 'i-0055e7ace24db38b0';
const LAMBDA_NAME = 'navada-vision-router';
const API_ID = 'xxqtcilmzi';

const cw = new CloudWatchClient({ region: REGION });
const ec2 = new EC2Client({ region: REGION });
const lambda = new LambdaClient({ region: REGION });

// Cache metrics for 60s
let metricsCache = null;
let cacheTime = 0;
const CACHE_TTL = 60000;

// Check node reachability via Tailscale ping
function checkNode(ip, port, timeout = 3000) {
  return new Promise(resolve => {
    const { exec } = require('child_process');
    exec('tailscale ping --timeout=2s ' + ip, { timeout: 4000 }, (err, stdout) => {
      resolve(!err && stdout && stdout.includes('pong'));
    });
  });
}

async function fetchMetrics() {
  if (metricsCache && Date.now() - cacheTime < CACHE_TTL) return metricsCache;

  const now = new Date();
  const ago1h = new Date(now - 3600000);
  const ago24h = new Date(now - 86400000);

  // CloudWatch GetMetricData — batch all metrics
  const metricData = await cw.send(new GetMetricDataCommand({
    StartTime: ago24h,
    EndTime: now,
    MetricDataQueries: [
      { Id: 'cpu', MetricStat: { Metric: { Namespace: 'AWS/EC2', MetricName: 'CPUUtilization', Dimensions: [{ Name: 'InstanceId', Value: EC2_ID }] }, Period: 300, Stat: 'Average' } },
      { Id: 'netIn', MetricStat: { Metric: { Namespace: 'AWS/EC2', MetricName: 'NetworkIn', Dimensions: [{ Name: 'InstanceId', Value: EC2_ID }] }, Period: 300, Stat: 'Sum' } },
      { Id: 'netOut', MetricStat: { Metric: { Namespace: 'AWS/EC2', MetricName: 'NetworkOut', Dimensions: [{ Name: 'InstanceId', Value: EC2_ID }] }, Period: 300, Stat: 'Sum' } },
      { Id: 'creditBal', MetricStat: { Metric: { Namespace: 'AWS/EC2', MetricName: 'CPUCreditBalance', Dimensions: [{ Name: 'InstanceId', Value: EC2_ID }] }, Period: 300, Stat: 'Average' } },
      { Id: 'creditUse', MetricStat: { Metric: { Namespace: 'AWS/EC2', MetricName: 'CPUCreditUsage', Dimensions: [{ Name: 'InstanceId', Value: EC2_ID }] }, Period: 300, Stat: 'Average' } },
      { Id: 'statusCheck', MetricStat: { Metric: { Namespace: 'AWS/EC2', MetricName: 'StatusCheckFailed', Dimensions: [{ Name: 'InstanceId', Value: EC2_ID }] }, Period: 60, Stat: 'Maximum' } },
      { Id: 'lambdaInv', MetricStat: { Metric: { Namespace: 'AWS/Lambda', MetricName: 'Invocations', Dimensions: [{ Name: 'FunctionName', Value: LAMBDA_NAME }] }, Period: 3600, Stat: 'Sum' } },
      { Id: 'lambdaErr', MetricStat: { Metric: { Namespace: 'AWS/Lambda', MetricName: 'Errors', Dimensions: [{ Name: 'FunctionName', Value: LAMBDA_NAME }] }, Period: 3600, Stat: 'Sum' } },
      { Id: 'lambdaDur', MetricStat: { Metric: { Namespace: 'AWS/Lambda', MetricName: 'Duration', Dimensions: [{ Name: 'FunctionName', Value: LAMBDA_NAME }] }, Period: 300, Stat: 'Average' } },
      { Id: 'apiCount', MetricStat: { Metric: { Namespace: 'AWS/ApiGateway', MetricName: 'Count', Dimensions: [{ Name: 'ApiId', Value: API_ID }] }, Period: 3600, Stat: 'Sum' } },
      { Id: 'api4xx', MetricStat: { Metric: { Namespace: 'AWS/ApiGateway', MetricName: '4xx', Dimensions: [{ Name: 'ApiId', Value: API_ID }] }, Period: 3600, Stat: 'Sum' } },
      { Id: 'api5xx', MetricStat: { Metric: { Namespace: 'AWS/ApiGateway', MetricName: '5xx', Dimensions: [{ Name: 'ApiId', Value: API_ID }] }, Period: 3600, Stat: 'Sum' } },
      { Id: 'diskRead', MetricStat: { Metric: { Namespace: 'AWS/EC2', MetricName: 'EBSReadBytes', Dimensions: [{ Name: 'InstanceId', Value: EC2_ID }] }, Period: 300, Stat: 'Sum' } },
      { Id: 'diskWrite', MetricStat: { Metric: { Namespace: 'AWS/EC2', MetricName: 'EBSWriteBytes', Dimensions: [{ Name: 'InstanceId', Value: EC2_ID }] }, Period: 300, Stat: 'Sum' } },
    ]
  }));

  // Extract latest value from each metric
  function latest(id) {
    const r = metricData.MetricDataResults.find(m => m.Id === id);
    if (!r || !r.Values || r.Values.length === 0) return null;
    return r.Values[0];
  }
  function sum24h(id) {
    const r = metricData.MetricDataResults.find(m => m.Id === id);
    if (!r || !r.Values) return 0;
    return r.Values.reduce((a, b) => a + b, 0);
  }

  // EC2 instance state
  let ec2State = 'unknown';
  try {
    const desc = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [EC2_ID] }));
    ec2State = desc.Reservations?.[0]?.Instances?.[0]?.State?.Name || 'unknown';
  } catch {}

  // Node checks (parallel)
  const [hpOnline, asusOnline, oracleOnline, ec2Online] = await Promise.all([
    checkNode('100.121.187.67', 8080),
    checkNode('100.88.118.128', 8765),
    checkNode('100.77.206.9', 8978),
    checkNode('100.98.118.33', 22),
  ]);

  metricsCache = {
    timestamp: now.toISOString(),
    ec2: {
      state: ec2State,
      cpu: latest('cpu')?.toFixed(1) || '0',
      netIn: latest('netIn') || 0,
      netOut: latest('netOut') || 0,
      netIn24h: sum24h('netIn'),
      netOut24h: sum24h('netOut'),
      creditBalance: latest('creditBal')?.toFixed(1) || '0',
      creditUsage: latest('creditUse')?.toFixed(2) || '0',
      statusCheck: latest('statusCheck') || 0,
      diskRead: latest('diskRead') || 0,
      diskWrite: latest('diskWrite') || 0,
    },
    lambda: {
      invocations24h: Math.round(sum24h('lambdaInv')),
      errors24h: Math.round(sum24h('lambdaErr')),
      avgDuration: latest('lambdaDur')?.toFixed(0) || '0',
    },
    api: {
      requests24h: Math.round(sum24h('apiCount')),
      errors4xx: Math.round(sum24h('api4xx')),
      errors5xx: Math.round(sum24h('api5xx')),
    },
    nodes: [
      { name: 'HP (NAVADA)', ip: '100.121.187.67', role: 'Primary Server', online: hpOnline },
      { name: 'ASUS (NAVADA2025)', ip: '100.88.118.128', role: 'Dev + Local YOLO', online: asusOnline },
      { name: 'Oracle VM', ip: '100.77.206.9', role: 'ELK + Failover', online: oracleOnline },
      { name: 'EC2 (AWS)', ip: '100.98.118.33', role: 'Cloud Failover', online: ec2Online },
    ]
  };
  cacheTime = Date.now();
  return metricsCache;
}

function formatBytes(b) {
  if (b === 0 || b === null) return '0 B';
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  if (b < 1073741824) return (b / 1048576).toFixed(1) + ' MB';
  return (b / 1073741824).toFixed(2) + ' GB';
}

// --- Crow Theme HTML ---
function renderDashboard(m) {
  const updated = new Date(m.timestamp).toLocaleString('en-GB', { timeZone: 'Europe/London' });
  const ec2Healthy = m.ec2.statusCheck === 0 && m.ec2.state === 'running';
  const nodesOnline = m.nodes.filter(n => n.online).length;
  const overallStatus = ec2Healthy && nodesOnline >= 2 ? 'OPERATIONAL' : (nodesOnline >= 1 ? 'DEGRADED' : 'DOWN');
  const statusColour = overallStatus === 'OPERATIONAL' ? '#888' : (overallStatus === 'DEGRADED' ? '#888' : '#ff4444');

  const nodeRows = m.nodes.map(n => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #1a1a1a;">
      <div>
        <div style="color:#e0e0e0;font-size:14px;">${n.name}</div>
        <div style="color:#555;font-size:11px;font-family:'IBM Plex Mono',monospace;">${n.ip} | ${n.role}</div>
      </div>
      <div style="width:10px;height:10px;background:${n.online ? '#888' : '#ff4444'};flex-shrink:0;"></div>
    </div>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
<title>NAVADA Edge Command Centre</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500&family=Newsreader:wght@300;400&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    background:#050505; color:#e0e0e0;
    font-family:'Newsreader',Georgia,serif; font-weight:300;
    -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;
    min-height:100vh;
  }
  .container { max-width:480px; margin:0 auto; padding:16px; }
  .mono { font-family:'IBM Plex Mono',monospace; }
  .section-label {
    font-family:'IBM Plex Mono',monospace; font-size:10px;
    letter-spacing:0.25em; color:#555; text-transform:uppercase;
    margin-bottom:12px; margin-top:28px;
  }
  .card {
    background:#0a0a0a; border:1px solid #1a1a1a; padding:16px; margin-bottom:8px;
  }
  .card-label {
    font-family:'IBM Plex Mono',monospace; font-size:10px;
    color:#555; text-transform:uppercase; letter-spacing:0.1em;
  }
  .card-value {
    font-family:'IBM Plex Mono',monospace; font-size:32px;
    color:#fff; margin-top:4px; font-weight:400;
  }
  .card-sub {
    font-family:'IBM Plex Mono',monospace; font-size:11px;
    color:#444; margin-top:2px;
  }
  .row { display:flex; gap:8px; }
  .row .card { flex:1; }
  .divider { height:1px; background:#1a1a1a; margin:8px 0; }
  .status-bar {
    display:flex; align-items:center; gap:8px;
    padding:12px 16px; background:#0a0a0a; border:1px solid #1a1a1a;
    margin-bottom:8px;
  }
  .status-dot { width:10px; height:10px; flex-shrink:0; }
  .header { padding:20px 0 8px; border-bottom:1px solid #1a1a1a; margin-bottom:16px; }
  .header-title { font-size:20px; color:#fff; font-weight:300; }
  .header-sub { font-family:'IBM Plex Mono',monospace; font-size:10px; color:#555; letter-spacing:0.2em; text-transform:uppercase; margin-bottom:6px; }
  .footer {
    font-family:'IBM Plex Mono',monospace; font-size:9px;
    color:#333; text-align:center; padding:24px 0 16px;
    letter-spacing:0.1em;
  }
  .refresh-btn {
    display:block; width:100%; padding:12px;
    background:#0a0a0a; border:1px solid #222;
    color:#888; font-family:'IBM Plex Mono',monospace;
    font-size:12px; text-align:center; cursor:pointer;
    text-transform:uppercase; letter-spacing:0.15em;
    margin-top:16px;
  }
  .refresh-btn:active { background:#111; color:#fff; }
</style>
</head>
<body>
<div class="container">

  <!-- Header -->
  <div class="header">
    <div class="header-sub">NAVADA EDGE INFRASTRUCTURE</div>
    <div class="header-title">Command Centre</div>
    <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#444;margin-top:6px;">Updated ${updated} | Auto-refresh 60s</div>
  </div>

  <!-- Section: Overview -->
  <div class="section-label">OVERVIEW</div>

  <div class="status-bar">
    <div class="status-dot" style="background:${statusColour};"></div>
    <div>
      <div class="mono" style="font-size:14px;color:#fff;">${overallStatus}</div>
      <div class="mono" style="font-size:10px;color:#555;">${nodesOnline}/${m.nodes.length} nodes online | EC2 ${m.ec2.state}</div>
    </div>
  </div>

  <div class="card">
    <div class="card-label">EC2 Instance</div>
    <div class="card-sub" style="color:#888;margin-top:6px;">
      t3.medium | 2 vCPU | 4GB | eu-west-2<br>
      State: ${m.ec2.state} | Health: ${m.ec2.statusCheck === 0 ? 'PASSING' : 'FAILING'}
    </div>
  </div>

  <!-- Section: EC2 -->
  <div class="section-label">EC2 COMPUTE</div>

  <div class="card">
    <div class="card-label">CPU Utilization</div>
    <div class="card-value">${m.ec2.cpu}%</div>
    <div class="card-sub">Auto-sleep at &lt;5% for 30min</div>
    <!-- CPU bar -->
    <div style="margin-top:8px;height:4px;background:#1a1a1a;">
      <div style="height:4px;background:#888;width:${Math.min(parseFloat(m.ec2.cpu), 100)}%;"></div>
    </div>
  </div>

  <div class="row">
    <div class="card">
      <div class="card-label">Network In</div>
      <div class="card-value" style="font-size:22px;">${formatBytes(m.ec2.netIn)}</div>
      <div class="card-sub">24h: ${formatBytes(m.ec2.netIn24h)}</div>
    </div>
    <div class="card">
      <div class="card-label">Network Out</div>
      <div class="card-value" style="font-size:22px;">${formatBytes(m.ec2.netOut)}</div>
      <div class="card-sub">24h: ${formatBytes(m.ec2.netOut24h)}</div>
    </div>
  </div>

  <div class="row">
    <div class="card">
      <div class="card-label">CPU Credit Balance</div>
      <div class="card-value" style="font-size:22px;">${m.ec2.creditBalance}</div>
      <div class="card-sub">Burst capacity</div>
    </div>
    <div class="card">
      <div class="card-label">CPU Credit Usage</div>
      <div class="card-value" style="font-size:22px;">${m.ec2.creditUsage}</div>
      <div class="card-sub">Per 5min</div>
    </div>
  </div>

  <div class="row">
    <div class="card">
      <div class="card-label">Disk Read</div>
      <div class="card-value" style="font-size:22px;">${formatBytes(m.ec2.diskRead)}</div>
    </div>
    <div class="card">
      <div class="card-label">Disk Write</div>
      <div class="card-value" style="font-size:22px;">${formatBytes(m.ec2.diskWrite)}</div>
    </div>
  </div>

  <!-- Section: Lambda / Vision -->
  <div class="section-label">LAMBDA / VISION AI</div>

  <div class="card">
    <div class="card-label">Vision API Invocations (24h)</div>
    <div class="card-value">${m.lambda.invocations24h}</div>
    <div class="card-sub">navada-vision-router | Routes: /yolo, /detect, /faces, /analyse</div>
  </div>

  <div class="row">
    <div class="card">
      <div class="card-label">Errors (24h)</div>
      <div class="card-value" style="font-size:22px;${m.lambda.errors24h > 0 ? 'color:#ff4444;' : ''}">${m.lambda.errors24h}</div>
    </div>
    <div class="card">
      <div class="card-label">Avg Latency</div>
      <div class="card-value" style="font-size:22px;">${m.lambda.avgDuration}ms</div>
    </div>
  </div>

  <div class="card">
    <div class="card-label">API Gateway (24h)</div>
    <div class="card-sub" style="color:#888;margin-top:6px;">
      Requests: ${m.api.requests24h} | 4xx: ${m.api.errors4xx} | 5xx: ${m.api.errors5xx}
    </div>
  </div>

  <!-- Section: Cost & Automation -->
  <div class="section-label">COST / AUTOMATION</div>

  <div class="card">
    <div class="card-label">Cost Controls</div>
    <div class="card-sub" style="color:#888;margin-top:6px;">
      Daily budget: USD 1.50 | Alerts at 50/80/100%<br>
      Auto-sleep: CPU &lt;5% for 30min stops EC2<br>
      SageMaker YOLO: Serverless, scales to zero<br>
      Lambda: Free tier (1M requests/month)
    </div>
  </div>

  <div class="card">
    <div class="card-label">Auto-Sleep State</div>
    <div class="card-value" style="font-size:18px;">${m.ec2.state === 'running' ? 'EC2 AWAKE' : 'EC2 SLEEPING'}</div>
    <div class="card-sub">${parseFloat(m.ec2.cpu) < 5 ? 'CPU below threshold, may auto-sleep soon' : 'Active, sleep alarm paused'}</div>
  </div>

  <!-- Section: Network Mesh -->
  <div class="section-label">NETWORK MESH</div>

  <div class="card">
    ${nodeRows}
  </div>

  <div class="card">
    <div class="card-label">Failover Chain</div>
    <div class="card-sub" style="color:#888;margin-top:6px;">
      HP (Primary) &rarr; Oracle VM (Auto 15min) &rarr; EC2 (Manual)<br>
      Cloudflare Tunnel: api.navada-edge-server.uk<br>
      Tailscale mesh: 5 nodes connected
    </div>
  </div>

  <!-- Refresh -->
  <button class="refresh-btn" onclick="location.reload()">Refresh Now</button>

  <!-- Footer -->
  <div class="footer">
    NAVADA EDGE INFRASTRUCTURE<br>
    Director: Lee Akpareva | Chief of Staff: Claude AI<br>
    navada-edge-server.uk
  </div>

</div>

<script>
  // Auto-refresh every 60 seconds
  setTimeout(() => location.reload(), 60000);
</script>
</body>
</html>`;
}

// --- API endpoint for Telegram bot ---
app.get('/api/metrics', async (req, res) => {
  try {
    const m = await fetchMetrics();
    res.json(m);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Dashboard HTML ---
app.get(['/', '/dashboard', '/dashboard/'], async (req, res) => {
  try {
    const m = await fetchMetrics();
    res.send(renderDashboard(m));
  } catch (err) {
    res.status(500).send(`<pre style="color:#ff4444;background:#050505;padding:20px;">Error loading metrics: ${err.message}</pre>`);
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'navada-dashboard', port: PORT });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`NAVADA Edge Command Centre running on :${PORT}`);
  console.log(`Dashboard: http://localhost:${PORT}/`);
  console.log(`API: http://localhost:${PORT}/api/metrics`);
});
