# NAVADA Edge v4.1 — Autonomous AI Infrastructure

**Claude, Chief of Staff** manages a distributed 7-node network 24/7 from Cloudflare's global edge. **Kiro AI Agents** provide autonomous agentic capabilities for deploys, testing, outreach, and operations.

Founded by **Lee Akpareva** | Principal AI Consultant
leeakpareva@gmail.com | [navada-lab.space](https://navada-lab.space) | [github.com/Navada25](https://github.com/Navada25)

**Live Dashboards** (mobile-responsive): [Traffic](https://edge-api.navada-edge-server.uk/traffic) | [Live Visualiser](https://edge-api.navada-edge-server.uk/live)

## Network Architecture

```
                    ┌──────────────────────────────────────────┐
                    │       NAVADA-GATEWAY (Cloudflare)        │
                    │  Role: CDN / Security / Edge Compute     │
                    │                                          │
                    │  Workers: navada-edge-api                │
                    │  D1: navada-edge (7 tables, WEUR)        │
                    │  R2: navada-assets (backups, media)      │
                    │  DNS: navada-edge-server.uk (13 subs)    │
                    │  Cron: 5 scheduled triggers              │
                    │  WAF / DDoS / SSL / Tunnel Ingress       │
                    └────────────────┬─────────────────────────┘
                                     │ Cloudflare Tunnel (encrypted)
                                     │
     ┌───────────────────────────────┼───────────────────────────────┐
     │              TAILSCALE MESH VPN (WireGuard, 100.x.x.x)       │
     │              Encrypted peer-to-peer overlay network            │
     └──┬──────────────┬──────────────┬──────────────┬──────────────┘
        │              │              │              │
   ┌────▼────┐   ┌────▼──────┐  ┌───▼────────┐ ┌──▼──────────┐
   │ NAVADA- │   │ NAVADA-   │  │ NAVADA-    │ │ NAVADA-     │
   │ CONTROL │   │ EDGE-     │  │ COMPUTE    │ │ ROUTER      │
   │ (ASUS)  │   │ SERVER    │  │ (AWS EC2)  │ │ (Oracle VM) │
   │         │   │ (HP)      │  │            │ │             │
   │ Command │   │ SSH-only  │  │ 24/7       │ │ Routing /   │
   │ Centre  │   │ Node      │  │ Compute /  │ │ Observ. /   │
   │         │   │ Server    │  │ Monitoring │ │ Security    │
   └────┬────┘   └───────────┘  └────────────┘ └─────────────┘
        │
   ┌────▼──────────┐
   │ NAVADA-AGENTS  │
   │ (Kiro IDE)     │
   │                │
   │ 6 AI Agents /│
   │ Hooks / IaC    │
   └────────────────┘
```

## Nodes

### NAVADA-CONTROL (ASUS Zenbook Duo)
- **Role**: Command Centre / Development
- **IP**: 192.168.0.18 (WiFi) / 100.88.118.128 (Tailscale)
- **OS**: Windows 11 Home, Intel Core Ultra 7, 16GB RAM
- **Services**: Claude Code, VS Code, Kiro IDE, LM Studio, Ollama, Docker Desktop
- **Connects to**: All nodes via SSH + Tailscale

### NAVADA-AGENTS (Kiro IDE)
- **Role**: AI Agent Orchestration / IaC / Autonomous Operations
- **Location**: Runs on ASUS (`.kiro/` folder in project root)
- **Agents** (6):

| Agent | Purpose |
|-------|---------|
| chief-of-staff | Full system control, multi-channel comms, operational lead |
| network-ops | Health monitoring, diagnostics, connectivity checks |
| deploy | Safe deploys to Worker + EC2 with validation |
| outreach | Prospect pipeline, email sequences, lead gen |
| test-runner | E2E test execution + failure analysis |
| disk-monitor | Disk usage monitoring + cleanup automation |

- **Steering**: product.md, tech.md, structure.md, network.md (auto-loaded context)
- **Hooks**: pre-deploy (syntax validation), post-deploy (health check)
- **Integration**: Agents call Worker API, forward commands to EC2, query D1

### NAVADA-EDGE-SERVER (HP Laptop)
- **Role**: SSH-only Node Server (no PM2, no scheduled tasks)
- **IP**: 192.168.0.58 (Ethernet, static) / 100.121.187.67 (Tailscale)
- **OS**: Windows 11 Pro
- **Services**: PostgreSQL (:5433), Node.js runtime, SSH server
- **Connection**: Always-on ethernet

### NAVADA-COMPUTE (AWS EC2)
- **Role**: 24/7 Compute / Monitoring / Failover
- **IP**: 3.11.119.181 (Elastic IP) / 100.98.118.33 (Tailscale)
- **Spec**: t3.medium (2 vCPU, 4GB), Ubuntu, eu-west-2
- **PM2 Services** (5):

| Process | Purpose |
|---------|---------|
| ec2-health-monitor | 16-endpoint health checks every 5 min |
| navada-dashboard | NAVADA command centre dashboard |
| worldmonitor | WorldView OSINT dashboard :4000 |
| worldview-monitor | WorldView CloudWatch metrics |
| cloudwatch-dashboard-updater | Auto-updates 11 CW dashboards |

- **AWS Services**: CloudWatch (11 dashboards), DynamoDB, S3, ECR, Lambda, Rekognition, Bedrock, SageMaker

### NAVADA-ROUTER (Oracle VM)
- **Role**: Routing / Observability / Security
- **IP**: 132.145.46.184 / 100.77.206.9 (Tailscale)
- **OS**: Ubuntu (ARM), Oracle Cloud Free Tier
- **Docker Containers** (6):

| Container | Port | Purpose |
|-----------|------|---------|
| navada-proxy | :80, :443, :8080 | Nginx reverse proxy |
| navada-tunnel | — | Cloudflare Tunnel (encrypted ingress) |
| navada-grafana | :3000 | Metrics dashboards |
| navada-prometheus | :9090 | Metrics collection |
| cloudbeaver | :8978 | Database admin UI |
| navada-portainer | :9000 | Docker management UI |

### NAVADA-GATEWAY (Cloudflare)
- **Role**: CDN / Security / Edge Compute / DNS
- **Services**:

| Service | Purpose |
|---------|---------|
| Cloudflare Worker (`navada-edge-api`) | Telegram bot, metrics API, health checks, cron jobs |
| D1 Database (`navada-edge`) | 7 tables: metrics, logs, health, conversations, users, commands, cache |
| R2 Storage (`navada-assets`) | Backups, media, version snapshots |
| DNS (13 subdomains) | Routing for all public services |
| WAF + DDoS | Security layer for all traffic |
| Cron Triggers (5) | Health checks, morning briefing, pipelines |

### NAVADA-MOBILE (iPhone 15 Pro Max)
- **Role**: Client / Mobile Ops
- **IP**: 100.68.251.111 (Tailscale)
- **Interface**: Telegram (primary), SMS, Tailscale direct access

## Claude: Chief of Staff

Claude operates as NAVADA's Chief of Staff from Cloudflare's global edge:
- **24/7 availability** via Telegram, SMS (+447446994961), and WhatsApp
- **Full system control**: shell (EC2), email, images, SMS/calls, D1 database
- **Smart model routing**: Sonnet 4.6 default, auto-escalates to Opus 4.6
- **Multi-user access**: Admin (full control) and guest (demo) roles
- **Conversation memory**: D1-backed, persists across restarts
- **Scheduled operations**: Cron triggers on Cloudflare (no local terminals)

### Telegram Commands (48+)

| Category | Commands |
|----------|----------|
| System | `/status` `/uptime` `/ping` `/about` `/help` |
| AI Model | `/sonnet` `/opus` `/auto` `/model` |
| PM2 | `/pm2` `/pm2restart` `/pm2stop` `/pm2start` `/pm2logs` |
| Files | `/ls` `/cat` `/shell` `/run` |
| Communication | `/email` `/emailme` `/inbox` `/sent` `/sms` `/call` |
| Creative | `/image` `/flux` `/research` `/draft` `/report` `/present` |
| Network | `/tailscale` `/docker` `/nginx` `/failover` `/failback` |
| Monitoring | `/costs` `/usage` `/logs` `/memory` |
| Media | `/stream` `/video` `/media` `/voicenote` |
| Other | `/clear` `/grant` `/revoke` `/users` `/cache` |

## Cloudflare Subdomains (13)

| Subdomain | Backend | Purpose |
|-----------|---------|---------|
| api.navada-edge-server.uk | HP :3456 | Telegram/Twilio webhooks (legacy) |
| edge-api.navada-edge-server.uk | Cloudflare Worker | New API: bot, metrics, health |
| flix.navada-edge-server.uk | HP :4000 | Video streaming |
| trading.navada-edge-server.uk | HP :5678 | Trading Lab |
| network.navada-edge-server.uk | HP :7777 | Network scanner |
| kibana.navada-edge-server.uk | Oracle :5601 | Log search |
| grafana.navada-edge-server.uk | Oracle :3000 | Metrics |
| monitor.navada-edge-server.uk | Oracle :3001 | Uptime Kuma |
| cloudbeaver.navada-edge-server.uk | Oracle :8978 | DB admin |
| nodes.navada-edge-server.uk | Oracle | Network map |
| dashboard.navada-edge-server.uk | EC2 | Command centre |
| logo.navada-edge-server.uk | HP :3000 | Logo service |
| traffic.navada-edge-server.uk | Cloudflare Worker | Architecture diagram (animated, mobile-responsive) |
| live.navada-edge-server.uk | Cloudflare Worker | Canvas traffic visualiser (animated, mobile-responsive) |

## Kiro Agents (IaC)

```
.kiro/
├── settings.json              # Project config + agent registry
├── steering/
│   ├── product.md             # Business context (always loaded)
│   ├── tech.md                # Full tech stack (always loaded)
│   ├── structure.md           # Network nodes + directory layout (always loaded)
│   └── network.md             # API endpoints for all nodes (auto-loaded)
├── agents/
│   ├── chief-of-staff.md      # Full system control, multi-channel comms
│   ├── network-ops.md         # Health monitoring, diagnostics
│   ├── deploy.md              # Safe deploys with validation
│   ├── outreach.md            # Prospect pipeline, email sequences
│   ├── test-runner.md         # E2E test execution + failure analysis
│   └── disk-monitor.md        # Disk usage monitoring + cleanup
└── hooks/
    ├── pre-deploy.md          # Syntax validation before deploy
    └── post-deploy.md         # Health check after deploy
```

**Usage in Kiro IDE**: Open project, chat with `@agent-name`, or let hooks auto-trigger.

## E2E Testing (68 tests)

| Suite | Tests | Covers |
|-------|-------|--------|
| gateway | 13 | Worker API, auth, metrics, logs, health |
| compute | 9 | EC2 dashboard, PM2, YOLO, shell API |
| network | 8 | Tailscale mesh, SSH, TCP connectivity |
| telegram | 8 | Webhook, bot health, commands |
| database | 8 | D1 queries, PostgreSQL connectivity |
| cross-node | 5 | EC2-Oracle, EC2-HP, Worker-EC2 |
| vision | 4 | Rekognition, YOLO, Lambda |
| cron | time-aware | Scheduled task verification |
| playwright | 10 | Headless Chromium, dashboard render, JS errors |

Run: `node Automation/e2e/runner.js once` or `make test`

## Cloudflare Worker (navada-edge-api)

**Endpoints**:

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/telegram/webhook` | Telegram bot webhook |
| POST | `/twilio/sms` | SMS inbound/outbound |
| POST | `/metrics` | Ingest metrics from any node |
| GET | `/metrics` | Query metrics (node, namespace, time range) |
| POST | `/logs` | Ingest edge logs |
| GET | `/logs` | Query logs |
| POST | `/health` | Ingest health check results |
| GET | `/health` | Query health history |
| GET | `/status` | System overview |
| GET | `/traffic` | Animated architecture dashboard (mobile-responsive) |
| GET | `/live` | Canvas traffic visualiser (mobile-responsive) |
| GET | `/health/telegram` | Telegram bot health check |

**Cron Triggers**:

| Schedule | Action |
|----------|--------|
| `*/5 * * * *` | Health check all endpoints |
| `30 6 * * *` | Morning briefing |
| `0 7 * * *` | AI news digest (via EC2) |
| `30 8 * * *` | Lead pipeline (via EC2) |
| `0 9 * * *` | Job hunter (via EC2) |

## D1 Database Schema (7 tables)

| Table | Purpose |
|-------|---------|
| metrics | Time-series metrics from all nodes |
| edge_logs | Event logs (errors, deploys, cron runs) |
| health_checks | Endpoint health check history |
| telegram_users | User registry (admin/guest roles) |
| conversations | AI conversation memory (per-user) |
| command_log | All Telegram/SMS command history |
| response_cache | AI response cache (7-day TTL) |

## AWS Services (eu-west-2)

| Service | Purpose |
|---------|---------|
| EC2 (t3.medium) | 24/7 compute, PM2 services |
| CloudWatch | 11 dashboards, metrics, alarms |
| DynamoDB | navada-faces, navada-vision-log, navada-edge-logs |
| Lambda | navada-vision-router (Vision AI API) |
| API Gateway | Vision API endpoint |
| SageMaker Serverless | YOLOv8n object detection |
| Rekognition | Face collection (navada-faces) |
| S3 | navada-vision-eu-west-2 |
| Bedrock | Claude Sonnet/Opus access |
| ECR | navada-yolo container |
| Budget | $25/month alerts (80%/100%) |

## Directory Structure

```
Alex/
├── Automation/
│   ├── cloudflare-worker/     # Cloudflare Worker + D1 (new)
│   │   ├── worker.js          # Main worker: bot, metrics, health, cron
│   │   ├── wrangler.json      # Wrangler config + cron triggers
│   │   ├── schema.sql         # D1 metrics/logs/health tables
│   │   └── schema-telegram.sql # D1 telegram tables
│   ├── telegram-bot.js        # Legacy bot (HP, now replaced by Worker)
│   ├── hp-health-monitor.js   # Legacy health monitor (replaced by Worker cron)
│   ├── hp-cloudwatch-metrics.js # Legacy metrics (replaced by Worker + D1)
│   ├── ec2-health-monitor.js  # EC2 standby health monitor
│   ├── email-service.js       # NAVADA branded email (Zoho SMTP)
│   ├── morning-briefing.js    # Executive morning brief
│   ├── ai-news-mailer.js      # Daily AI news digest
│   ├── job-hunter-apify.js    # Job search automation
│   ├── self-improve.js        # Ralph self-improvement engine
│   ├── edge-logger.js         # DynamoDB event logger
│   ├── kb/                    # Knowledge base
│   ├── logs/                  # Task output logs
│   └── .env                   # Secrets (gitignored)
├── LeadPipeline/              # Lead generation + CRM
├── .kiro/                     # Kiro IDE: agents, steering, hooks
├── Manager/                   # Cost tracking, ops docs, business plans
├── infrastructure/            # Docker + Nginx configs
├── navada-lambda/             # AWS Lambda functions
├── CLAUDE.md                  # Claude Code instructions
└── README.md                  # This file
```

## Quick Commands

```bash
# Cloudflare Worker
cd Automation/cloudflare-worker
npx wrangler deploy              # Deploy worker
npx wrangler tail                # Live logs
npx wrangler d1 execute navada-edge --remote --command "SELECT COUNT(*) FROM metrics"

# EC2 (via SSH)
ssh navada-ec2 "pm2 list"
ssh navada-ec2 "pm2 logs --lines 20"

# Oracle (via SSH)
ssh navada-oracle -l ubuntu "docker ps"

# HP (via SSH from ASUS)
ssh navada "node --version"
```

## NAVADA Products

| Product | URL | Description |
|---------|-----|-------------|
| NAVADA Edge | navada-edge-server.uk | Autonomous AI infrastructure |
| WorldMonitor | navada-world-view.xyz | OSINT dashboard |
| Trading Lab | trading.navada-edge-server.uk | Autonomous paper trading |
| NAVADA Robotics | navadarobotics.com | Robotics company |
| Navada Lab | navada-lab.space | GPU ML lab + portfolio |
| ALEX | alexnavada.xyz | Autonomous AI agent |
| Raven Terminal | raventerminal.xyz | AI code learning platform |

## Monthly Costs (March 2026)

| Provider | Cost | Notes |
|----------|------|-------|
| AWS | ~$9.18/month | EC2 t3.medium + services (budget: $25) |
| Oracle Cloud | ~£5.46/month | Compute VM only |
| Cloudflare | $0 | Free tier (Workers, D1, R2, DNS) |
| **Total** | **~$16/month** | |

> **AWS CLI cost note**: `aws ce get-cost-and-usage` includes credits/refunds by default. Filter with `--filter '{"Not":{"Dimensions":{"Key":"RECORD_TYPE","Values":["Credit","Refund"]}}}'` for real spend.

---

**Total: 17+ services across 7 nodes, managed 24/7 by Claude Chief of Staff on Cloudflare's edge.**
