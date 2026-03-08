const nodemailer = require('nodemailer');
require('dotenv').config({ path: __dirname + '/.env' });

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.eu',
  port: 465,
  secure: true,
  auth: {
    user: process.env.ZOHO_USER,
    pass: process.env.ZOHO_APP_PASSWORD
  }
});

const html = `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 720px; margin: 0 auto; background: #0a0a0a; color: #e0e0e0; border-radius: 12px; overflow: hidden;">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 32px 40px; border-bottom: 3px solid #00d4ff;">
    <h1 style="margin: 0; font-size: 24px; color: #00d4ff; letter-spacing: 1px;">NAVADA EDGE</h1>
    <p style="margin: 8px 0 0; font-size: 14px; color: #8892b0;">AWS EC2 Cloud Node | Architecture Plan</p>
    <p style="margin: 4px 0 0; font-size: 12px; color: #5a6380;">4 March 2026 | Prepared by Claude, Chief of Staff</p>
  </div>

  <!-- Executive Summary -->
  <div style="padding: 32px 40px;">
    <h2 style="color: #00d4ff; font-size: 18px; margin: 0 0 16px; border-bottom: 1px solid #1a2744; padding-bottom: 8px;">Executive Summary</h2>
    <p style="color: #b0b8cc; line-height: 1.7; margin: 0;">
      NAVADA Edge currently runs entirely on the HP laptop (192.168.0.58). This plan adds a <strong style="color: #fff;">free-tier AWS EC2 instance</strong> to create a <strong style="color: #fff;">two-node architecture</strong>. The cloud node handles public-facing, always-reachable workloads while the home server keeps its existing role as the powerhouse. Cost: <strong style="color: #00ff88;">£0/month</strong> (12-month free tier).
    </p>
  </div>

  <!-- Architecture Diagram -->
  <div style="padding: 0 40px 32px;">
    <h2 style="color: #00d4ff; font-size: 18px; margin: 0 0 16px; border-bottom: 1px solid #1a2744; padding-bottom: 8px;">Architecture Diagram</h2>
    <div style="background: #0d1117; border: 1px solid #1a2744; border-radius: 8px; padding: 24px; font-family: 'Courier New', monospace; font-size: 13px; line-height: 1.5; white-space: pre; overflow-x: auto; color: #c9d1d9;">                        <span style="color: #00d4ff; font-weight: bold;">INTERNET</span>
                           |
                &#9484;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9524;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9488;
                |                     |
       &#9484;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9524;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9488;   &#9484;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9524;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9488;
       | <span style="color: #ff9800;">AWS EC2</span>          |   | <span style="color: #ff9800;">Cloudflare</span>     |
       | t3.micro (FREE)  |   | Tunnel/Workers |
       | Claude Code (Max)|   | DNS / CDN      |
       | Public gateway   |   | R2 / Stream    |
       &#9492;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9516;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9496;   &#9492;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9516;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9496;
                |    <span style="color: #00ff88;">Tailscale VPN</span>     |
                &#9492;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9516;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9496;
                           |
                &#9484;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9524;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9488;
                | <span style="color: #ff9800;">HP LAPTOP (NAVADA)</span>       |
                | 192.168.0.58             |
                | 9 PM2 services           |
                | 8 Docker containers      |
                | 18 scheduled tasks       |
                | 23 MCP servers           |
                | All databases            |
                &#9492;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9496;</div>
  </div>

  <!-- Tailscale Mesh -->
  <div style="padding: 0 40px 32px;">
    <h2 style="color: #00d4ff; font-size: 18px; margin: 0 0 16px; border-bottom: 1px solid #1a2744; padding-bottom: 8px;">Tailscale Mesh Network (3 Nodes)</h2>
    <div style="background: #0d1117; border: 1px solid #1a2744; border-radius: 8px; padding: 24px; font-family: 'Courier New', monospace; font-size: 13px; line-height: 1.5; white-space: pre; overflow-x: auto; color: #c9d1d9;">  &#9484;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9488;   &#9484;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9488;   &#9484;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9488;
  | <span style="color: #00ff88;">Lee's iPhone</span>     |   | <span style="color: #00ff88;">HP Laptop</span>        |   | <span style="color: #00ff88;">AWS EC2</span>          |
  | 100.68.251.111  |&lt;-&gt;| 100.121.187.67  |&lt;-&gt;| 100.x.x.x       |
  &#9492;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9516;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9496;   &#9492;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9516;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9496;   &#9492;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9516;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9496;
           |                     |                      |
           &#9492;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9524;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9496;
                        <span style="color: #00d4ff;">Tailscale Mesh (all nodes see each other)</span></div>
  </div>

  <!-- Role Split Table -->
  <div style="padding: 0 40px 32px;">
    <h2 style="color: #00d4ff; font-size: 18px; margin: 0 0 16px; border-bottom: 1px solid #1a2744; padding-bottom: 8px;">Role Split</h2>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <tr style="background: #1a2744;">
        <th style="padding: 10px 12px; text-align: left; color: #00d4ff; border-bottom: 2px solid #00d4ff;">Concern</th>
        <th style="padding: 10px 12px; text-align: left; color: #00d4ff; border-bottom: 2px solid #00d4ff;">HP Laptop (Current)</th>
        <th style="padding: 10px 12px; text-align: left; color: #00d4ff; border-bottom: 2px solid #00d4ff;">EC2 (New)</th>
      </tr>
      <tr style="background: #0d1117;">
        <td style="padding: 10px 12px; color: #fff; border-bottom: 1px solid #1a2744;">Claude Code</td>
        <td style="padding: 10px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">Lee's primary dev environment</td>
        <td style="padding: 10px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">Always-on cloud Claude agent</td>
      </tr>
      <tr style="background: #111827;">
        <td style="padding: 10px 12px; color: #fff; border-bottom: 1px solid #1a2744;">Scheduled tasks</td>
        <td style="padding: 10px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">Windows Task Scheduler (18 tasks)</td>
        <td style="padding: 10px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">Cron (backup runner, health checks)</td>
      </tr>
      <tr style="background: #0d1117;">
        <td style="padding: 10px 12px; color: #fff; border-bottom: 1px solid #1a2744;">Databases</td>
        <td style="padding: 10px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">SQLite, PostgreSQL, ChromaDB</td>
        <td style="padding: 10px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">None (queries laptop via Tailscale)</td>
      </tr>
      <tr style="background: #111827;">
        <td style="padding: 10px 12px; color: #fff; border-bottom: 1px solid #1a2744;">Telegram bot</td>
        <td style="padding: 10px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">Primary (stays here, port 3456)</td>
        <td style="padding: 10px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">Fallback if laptop offline</td>
      </tr>
      <tr style="background: #0d1117;">
        <td style="padding: 10px 12px; color: #fff; border-bottom: 1px solid #1a2744;">MCP servers</td>
        <td style="padding: 10px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">All 23</td>
        <td style="padding: 10px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">AWS-specific MCPs only</td>
      </tr>
      <tr style="background: #111827;">
        <td style="padding: 10px 12px; color: #fff; border-bottom: 1px solid #1a2744;">Docker</td>
        <td style="padding: 10px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">Nginx, monitoring, ELK</td>
        <td style="padding: 10px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">Lightweight (Claude + Tailscale)</td>
      </tr>
      <tr style="background: #0d1117;">
        <td style="padding: 10px 12px; color: #fff; border-bottom: 1px solid #1a2744;">Public APIs</td>
        <td style="padding: 10px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">Lambda + API Gateway</td>
        <td style="padding: 10px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">Claude manages Lambda deploys</td>
      </tr>
      <tr style="background: #111827;">
        <td style="padding: 10px 12px; color: #fff;">Client deploys</td>
        <td style="padding: 10px 12px; color: #b0b8cc;">SSH via Tailscale</td>
        <td style="padding: 10px 12px; color: #b0b8cc;">SSH via Tailscale (redundant path)</td>
      </tr>
    </table>
  </div>

  <!-- EC2 Stack -->
  <div style="padding: 0 40px 32px;">
    <h2 style="color: #00d4ff; font-size: 18px; margin: 0 0 16px; border-bottom: 1px solid #1a2744; padding-bottom: 8px;">EC2 Instance Stack</h2>
    <div style="background: #0d1117; border: 1px solid #1a2744; border-radius: 8px; padding: 24px; font-family: 'Courier New', monospace; font-size: 13px; line-height: 1.8; color: #c9d1d9;"><span style="color: #ff9800; font-weight: bold;">t3.micro</span> (1 vCPU, 1GB RAM, 30GB EBS)
&#9500;&#9472;&#9472; <span style="color: #00ff88;">Ubuntu 24.04 LTS</span>
&#9500;&#9472;&#9472; <span style="color: #00ff88;">Claude Code</span> (Max plan login)
&#9500;&#9472;&#9472; <span style="color: #00ff88;">Tailscale</span> (mesh VPN)
&#9500;&#9472;&#9472; <span style="color: #00ff88;">Node.js 22 LTS</span> + npm
&#9500;&#9472;&#9472; <span style="color: #00ff88;">AWS CLI v2</span> (native, via instance IAM role)
&#9500;&#9472;&#9472; <span style="color: #00ff88;">AWS MCP server</span> (claude mcp add)
&#9500;&#9472;&#9472; <span style="color: #00ff88;">Git</span> (for pulling NAVADA repos)
&#9500;&#9472;&#9472; <span style="color: #00ff88;">PM2</span> (process manager)
&#9474;   &#9500;&#9472;&#9472; health-check.js (pings laptop, alerts if down)
&#9474;   &#9492;&#9472;&#9472; cron-runner.js (backup tasks, AWS maintenance)
&#9492;&#9472;&#9472; <span style="color: #00ff88;">SSH keys</span> (for client machine access)</div>
  </div>

  <!-- What EC2 Claude Does -->
  <div style="padding: 0 40px 32px;">
    <h2 style="color: #00d4ff; font-size: 18px; margin: 0 0 16px; border-bottom: 1px solid #1a2744; padding-bottom: 8px;">What EC2 Claude Code Does</h2>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <tr style="background: #0d1117;">
        <td style="padding: 14px; color: #ff9800; font-weight: bold; border-bottom: 1px solid #1a2744; width: 180px;">1. AWS Infrastructure</td>
        <td style="padding: 14px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">Deploy Lambda functions, spin up ECS services, check CloudWatch logs, create S3 buckets. All via natural language.</td>
      </tr>
      <tr style="background: #111827;">
        <td style="padding: 14px; color: #ff9800; font-weight: bold; border-bottom: 1px solid #1a2744;">2. Disaster Recovery</td>
        <td style="padding: 14px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">If laptop loses power/internet, EC2 Claude is still reachable. Can restart services via Tailscale SSH and send alerts.</td>
      </tr>
      <tr style="background: #0d1117;">
        <td style="padding: 14px; color: #ff9800; font-weight: bold; border-bottom: 1px solid #1a2744;">3. Client Gateway</td>
        <td style="padding: 14px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">Second SSH path into client machines via Tailscale. Two deployment paths = redundancy for Tier 2 clients.</td>
      </tr>
      <tr style="background: #111827;">
        <td style="padding: 14px; color: #ff9800; font-weight: bold;">4. Offload AWS Tasks</td>
        <td style="padding: 14px; color: #b0b8cc;">SageMaker training, large S3 uploads (free within AWS), CloudWatch analysis. No data transfer costs.</td>
      </tr>
    </table>
  </div>

  <!-- Tier Enhancement -->
  <div style="padding: 0 40px 32px;">
    <h2 style="color: #00d4ff; font-size: 18px; margin: 0 0 16px; border-bottom: 1px solid #1a2744; padding-bottom: 8px;">How This Enhances Each NAVADA Edge Tier</h2>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <tr style="background: #0d1117;">
        <td style="padding: 12px; color: #00ff88; font-weight: bold; border-bottom: 1px solid #1a2744; width: 140px;">Tier 1 (Hosted)</td>
        <td style="padding: 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">EC2 becomes overflow node. Heavy client agents offloaded from laptop to cloud.</td>
      </tr>
      <tr style="background: #111827;">
        <td style="padding: 12px; color: #00ff88; font-weight: bold; border-bottom: 1px solid #1a2744;">Tier 2 (Self-Hosted)</td>
        <td style="padding: 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">Second SSH path into client machines. If laptop offline, EC2 still deploys and maintains.</td>
      </tr>
      <tr style="background: #0d1117;">
        <td style="padding: 12px; color: #00ff88; font-weight: bold;">Tier 3 (Franchise)</td>
        <td style="padding: 12px; color: #b0b8cc;">Demonstrates cloud node architecture to franchise partners. Training tool during 5-day sessions.</td>
      </tr>
    </table>
  </div>

  <!-- Cost -->
  <div style="padding: 0 40px 32px;">
    <h2 style="color: #00d4ff; font-size: 18px; margin: 0 0 16px; border-bottom: 1px solid #1a2744; padding-bottom: 8px;">Cost Breakdown</h2>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <tr style="background: #1a2744;">
        <th style="padding: 10px 12px; text-align: left; color: #00d4ff;">Resource</th>
        <th style="padding: 10px 12px; text-align: right; color: #00d4ff;">Monthly</th>
      </tr>
      <tr style="background: #0d1117;"><td style="padding: 10px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">EC2 t3.micro</td><td style="padding: 10px 12px; color: #00ff88; text-align: right; border-bottom: 1px solid #1a2744;">&#163;0 (free tier)</td></tr>
      <tr style="background: #111827;"><td style="padding: 10px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">EBS 30GB</td><td style="padding: 10px 12px; color: #00ff88; text-align: right; border-bottom: 1px solid #1a2744;">&#163;0 (free tier)</td></tr>
      <tr style="background: #0d1117;"><td style="padding: 10px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">Data transfer (Tailscale P2P)</td><td style="padding: 10px 12px; color: #00ff88; text-align: right; border-bottom: 1px solid #1a2744;">&#163;0</td></tr>
      <tr style="background: #111827;"><td style="padding: 10px 12px; color: #b0b8cc; border-bottom: 1px solid #1a2744;">Claude Code (Max plan)</td><td style="padding: 10px 12px; color: #00ff88; text-align: right; border-bottom: 1px solid #1a2744;">&#163;0 (included)</td></tr>
      <tr style="background: #1a2744;"><td style="padding: 10px 12px; color: #fff; font-weight: bold;">TOTAL</td><td style="padding: 10px 12px; color: #00ff88; font-weight: bold; text-align: right; font-size: 16px;">&#163;0/month</td></tr>
    </table>
    <p style="color: #5a6380; font-size: 11px; margin: 8px 0 0;">After free tier expires (12 months): ~&#163;7/mo for t3.micro on-demand.</p>
  </div>

  <!-- Implementation Steps -->
  <div style="padding: 0 40px 32px;">
    <h2 style="color: #00d4ff; font-size: 18px; margin: 0 0 16px; border-bottom: 1px solid #1a2744; padding-bottom: 8px;">Implementation Steps</h2>
    <ol style="color: #b0b8cc; line-height: 2.2; padding-left: 20px; margin: 0; font-size: 13px;">
      <li>Launch EC2 t3.micro (eu-west-2, Ubuntu 24.04, 30GB EBS)</li>
      <li>Attach IAM role for native AWS CLI access</li>
      <li>Security group: SSH from Tailscale + temp public SSH for initial setup</li>
      <li>Install: Node.js 22 LTS, Tailscale, Claude Code, AWS CLI, PM2, Git</li>
      <li>Join Tailscale network: <code style="background: #1a2744; padding: 2px 6px; border-radius: 4px;">tailscale up --authkey=&lt;key&gt;</code></li>
      <li>Claude Code login: <code style="background: #1a2744; padding: 2px 6px; border-radius: 4px;">claude login</code> (Max plan browser auth)</li>
      <li>Add AWS MCP server: <code style="background: #1a2744; padding: 2px 6px; border-radius: 4px;">claude mcp add aws-mcp</code></li>
      <li>Clone NAVADA agent repo for scripts</li>
      <li>Set up health monitor PM2 process (pings laptop every 5 min)</li>
      <li>Verify: Tailscale mesh (3 nodes), Claude Code, AWS access all working</li>
    </ol>
  </div>

  <!-- Verification -->
  <div style="padding: 0 40px 32px;">
    <h2 style="color: #00d4ff; font-size: 18px; margin: 0 0 16px; border-bottom: 1px solid #1a2744; padding-bottom: 8px;">Verification Checklist</h2>
    <ul style="color: #b0b8cc; line-height: 2; padding-left: 20px; margin: 0; font-size: 13px; list-style: none;">
      <li>&#9744; <code style="background: #1a2744; padding: 2px 6px; border-radius: 4px;">tailscale status</code> shows all 3 nodes (iPhone, laptop, EC2)</li>
      <li>&#9744; <code style="background: #1a2744; padding: 2px 6px; border-radius: 4px;">ssh leeak@100.121.187.67</code> from EC2 reaches laptop</li>
      <li>&#9744; <code style="background: #1a2744; padding: 2px 6px; border-radius: 4px;">claude</code> on EC2 responds and can use AWS MCP tools</li>
      <li>&#9744; <code style="background: #1a2744; padding: 2px 6px; border-radius: 4px;">aws s3 ls</code> from Claude Code session works</li>
      <li>&#9744; Health check pings laptop successfully</li>
      <li>&#9744; Lee can SSH to EC2 from iPhone via Tailscale</li>
    </ul>
  </div>

  <!-- Footer -->
  <div style="background: #1a2744; padding: 20px 40px; text-align: center;">
    <p style="margin: 0; color: #5a6380; font-size: 12px;">NAVADA Edge Infrastructure | Claude, Chief of Staff</p>
    <p style="margin: 4px 0 0; color: #3a4a6b; font-size: 11px;">Implementation proceeding immediately.</p>
  </div>
</div>
`;

transporter.sendMail({
  from: '"NAVADA Edge" <claude.navada@zohomail.eu>',
  to: 'leeakpareva@gmail.com',
  subject: 'NAVADA Edge | AWS EC2 Cloud Node - Architecture Plan',
  html: html
}).then(info => {
  console.log('Email sent:', info.messageId);
}).catch(err => {
  console.error('Error:', err.message);
});
