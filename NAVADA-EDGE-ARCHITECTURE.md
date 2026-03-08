# NAVADA Edge Architecture
### Last Updated: 6 March 2026

---

## Network Topology

```
                            INTERNET
                               |
                    +-----------------------+
                    |    CLOUDFLARE CDN      |
                    |   DDoS / WAF / SSL    |
                    |  navada-edge-server.uk |
                    +-----------+-----------+
                                |
                    Cloudflare Tunnel (outbound from HP)
                                |
+===============================+================================+
|                    TAILSCALE VPN MESH                           |
|              Private encrypted overlay network                  |
|                                                                 |
|   +------------------+  +------------------+  +---------------+ |
|   | ASUS (NAVADA2025)|  |  HP (NAVADA)     |  | ORACLE VM     | |
|   | 100.88.118.128   |  |  100.121.187.67  |  | 100.77.206.9  | |
|   | Dev Workstation  |  |  Production Svr  |  | Data/Monitor  | |
|   +------------------+  +------------------+  +---------------+ |
|                                                                 |
|   +------------------+  +------------------+                    |
|   | AWS EC2          |  |  iPHONE          |                    |
|   | 100.98.118.33    |  |  100.68.251.111  |                    |
|   | Health/Failover  |  |  Mobile Client   |                    |
|   +------------------+  +------------------+                    |
+=================================================================+
```

---

## Layer Architecture

```
+------------------------------------------------------------------+
|  LAYER 1: CLIENT (Lee's devices)                                  |
|  iPhone (Telegram, Safari) | ASUS (Claude Code, VS Code, CLI)    |
+------------------------------------------------------------------+
        |                              |
        | Telegram API                 | SSH / Tailscale SSH
        | Cloudflare URLs              | Direct LAN/Tailscale
        |                              |
+------------------------------------------------------------------+
|  LAYER 2: EDGE GATEWAY (Cloudflare + Nginx on HP)                |
|  Cloudflare Tunnel -> Nginx reverse proxy -> route to services    |
|  Rate limiting, security headers, SSL termination                 |
+------------------------------------------------------------------+
        |
+------------------------------------------------------------------+
|  LAYER 3: APPLICATION SERVICES (PM2 on HP)                       |
|  telegram-bot, worldmonitor, trading-api, inbox-responder, etc.  |
+------------------------------------------------------------------+
        |
+------------------------------------------------------------------+
|  LAYER 4: DATA LAYER                                             |
|  PostgreSQL (HP:5433) | SQLite (HP) | Oracle XE (Oracle VM:1521) |
|  Elasticsearch (Oracle VM:9200) | ChromaDB Cloud                |
+------------------------------------------------------------------+
        |
+------------------------------------------------------------------+
|  LAYER 5: INFRASTRUCTURE                                         |
|  Docker (HP + Oracle) | PM2 (HP + EC2) | Tailscale (all nodes)  |
|  AWS SES (email) | Twilio (SMS/voice) | Cloudflare (CDN/DNS/R2) |
+------------------------------------------------------------------+
```

---

## Node 1: ASUS Zenbook Duo (NAVADA2025) — Primary Dev Workstation

| Attribute | Detail |
|-----------|--------|
| Hostname | navada-asus-control |
| Tailscale IP | 100.88.118.128 |
| LAN IP | 192.168.0.18 (WiFi) |
| OS | Windows 11 Home |
| CPU | Intel Core Ultra 7 |
| RAM | 16 GB |
| Disk | 478 GB free |
| Role | Lee's primary development machine |

### What Runs Here
| Service | Purpose |
|---------|---------|
| Claude Code | Primary AI development interface |
| VS Code + Remote SSH | Edit files on HP remotely |
| LM Studio | Local LLM inference (GUI) |
| Ollama | Local LLM inference (API at :11434) |
| PostgreSQL 17 | Local dev/staging database |
| Docker Desktop (WSL2) | Local container testing |
| AWS CLI | Manage AWS resources |
| OCI CLI | Manage Oracle Cloud resources |
| Wrangler | Manage Cloudflare Workers |

### Startup Automation
| Task | Action |
|------|--------|
| NAVADA-NodeCheckin | Sends Telegram heartbeat + writes to HP PostgreSQL on login |

### SSH Access (from ASUS)
```
ssh leeak@100.121.187.67        # HP server
ssh opc@100.77.206.9            # Oracle VM
ssh ubuntu@100.98.118.33        # AWS EC2
tailscale ssh navada             # HP via Tailscale
tailscale ssh navada-oracle      # Oracle via Tailscale
tailscale ssh navada-ec2         # EC2 via Tailscale
```

---

## Node 2: HP Laptop (NAVADA) — Production Server

| Attribute | Detail |
|-----------|--------|
| Hostname | navada |
| Tailscale IP | 100.121.187.67 |
| LAN IP | 192.168.0.58 (ethernet, static) |
| OS | Windows 11 Pro |
| RAM | ~8 GB |
| Disk | 83 GB free |
| Role | Always-on production server (ethernet, thermal cable) |
| Connection | Wired ethernet, permanently on |

### Docker Containers (3)
| Container | Port | Purpose |
|-----------|------|---------|
| navada-proxy (Nginx) | :80, :443, :8080 | Reverse proxy, API gateway, rate limiting |
| navada-tunnel (Cloudflared) | - | Outbound tunnel to Cloudflare for public HTTPS |
| navada-portainer | :9000 | Docker container management UI |

### PM2 Services (13)
| Process | Port | Purpose |
|---------|------|---------|
| telegram-bot | :3456 | Claude Chief of Staff (Telegram + Twilio webhooks) |
| worldmonitor | :4173 | OSINT dashboard frontend + proxy |
| worldmonitor-api | :46123 | WorldMonitor backend API |
| trading-api | :5678 | NAVADA Trading Lab (FastAPI/Uvicorn) |
| trading-scheduler | - | Cron triggers for trading scripts |
| inbox-responder | - | Email auto-reply + approval gate |
| auto-deploy | - | Git poll every 2 min, rebuild on change |
| network-scanner | :7777 | LAN network scanner + router dashboard |
| navada-flix | :4000 | Video streaming platform |
| navada-logo | :3000 | NAVADA logo/branding service |
| notebooklm-watcher | - | Auto-uploads NotebookLM files to R2 |
| oracle-elk-tunnel | - | SSH tunnels to Oracle ELK (:9200, :5601) |
| failover-sync | - | SCP state to Oracle every 5 min |

### Databases
| Database | Port | Engine | Purpose |
|----------|------|--------|---------|
| navada_pipeline | :5433 | PostgreSQL 17 | CRM, prospects, leads, heartbeats |
| pipeline.db | - | SQLite | Lead pipeline data |

### Windows Task Scheduler (18 automations)
| Time | Task |
|------|------|
| 6:30 AM | Morning Briefing email |
| 7:00 AM | AI News Digest email |
| 8:00 AM Mon | UK/US Economy Report |
| 8:30 AM | Lead Pipeline scan |
| 9:00 AM | Job Hunter (Apify scrape) |
| 9:30 AM | Prospect Pipeline (scrape, verify, outreach) |
| 10:00 AM Mon | Self-Improvement (Ralph Wiggum) |
| 2:15 PM | Trading pre-market scan |
| 3:45 PM | Trading execution |
| 6:00 PM | Market Intelligence |
| 6:00 PM Sun | Weekly Report |
| 8:30 PM Fri | Trading Friday close |
| 9:00 PM | Daily Ops Report |
| 9:15 PM | Trading Daily Report |
| Every 2hrs | Inbox Monitor |
| Startup | VC Response Monitor |
| Startup | Infrastructure Health Check |
| Startup | PM2 Resurrect |

### Nginx Routing (API Gateway)

#### Cloudflare Subdomains (public HTTPS)
| Subdomain | Backend |
|-----------|---------|
| api.navada-edge-server.uk/telegram/ | telegram-bot :3456 |
| api.navada-edge-server.uk/twilio/ | telegram-bot :3456 |
| flix.navada-edge-server.uk | navada-flix :4000 |
| kibana.navada-edge-server.uk | Kibana :5601 (via Oracle tunnel) |
| logo.navada-edge-server.uk | navada-logo :3000 |
| network.navada-edge-server.uk | network-scanner :7777 |
| trading.navada-edge-server.uk | trading-api :5678 |
| cloudbeaver.navada-edge-server.uk | CloudBeaver :8978 (via Oracle tunnel) |

#### Path-based routing (LAN at :8080)
| Path | Backend |
|------|---------|
| /kibana/ | Kibana :5601 |
| /flix/ | navada-flix :4000 |
| /network/ | network-scanner :7777 |
| /trading/ | trading-api :5678 |
| /portainer/ | Portainer :9000 |
| /canvas/ | Excalidraw :3001 |
| /cloudbeaver/ | CloudBeaver :8978 |
| /logo/ | navada-logo :3000 |
| /mlflow/ | MLflow :5000 |
| /jupyter/ | Jupyter :8888 |

---

## Node 3: Oracle Cloud VM (navada-oracle) — Data and Monitoring

| Attribute | Detail |
|-----------|--------|
| Hostname | navada-oracle |
| Tailscale IP | 100.77.206.9 |
| Public IP | 132.145.46.184 |
| OS | Ubuntu (OCI E5.Flex) |
| CPU | 1 OCPU |
| RAM | 12 GB |
| Disk | 65% used |
| Role | ELK stack, monitoring, Oracle XE database |
| Failover | Secondary for HP critical services |

### Docker Containers (7)
| Container | Port | Purpose |
|-----------|------|---------|
| navada-elasticsearch | :9200 | Log storage and search (8.17.0, 1GB heap) |
| navada-kibana | :5601 | Log visualization UI |
| navada-grafana | :3000 | Metrics dashboards |
| navada-prometheus | :9090 | Metrics collection |
| navada-uptime | :3001 | Uptime Kuma health monitoring |
| cloudbeaver | :8978 | Database UI (visual SQL) |
| oracle-xe | :1521 | Oracle XE database (schema: navada) |

### PM2 Services
| Process | Status | Purpose |
|---------|--------|---------|
| navada-inbox-collector | errored | Email inbox collector (needs fix) |

### Failover Role
- Receives state sync from HP every 5 min (via failover-sync)
- Cloudflare tunnel ID: 96e30aeb (standby)
- Activated when EC2 health monitor detects HP is down for 15 min
- Telegram commands: /failover, /failback, /failover-status

---

## Node 4: AWS EC2 (navada-ec2) — Health Monitor and Failover Trigger

| Attribute | Detail |
|-----------|--------|
| Hostname | navada-ec2 |
| Tailscale IP | 100.98.118.33 |
| Public IP | 18.130.39.222 |
| OS | Ubuntu |
| Region | eu-west-2 (London) |
| RAM | 1 GB |
| Disk | 12% used |
| Role | Independent health monitor, failover trigger |

### PM2 Services (2)
| Process | Purpose |
|---------|---------|
| health-monitor | Pings HP every 5 min, triggers failover after 15 min down |
| ec2-health-monitor | Secondary health check process |

### AWS Services Used
| Service | Purpose |
|---------|---------|
| SES | Transactional email sending |
| Lambda | Serverless API (POST /mcp, ANY /api/*) |
| S3 | File storage |
| API Gateway | Lambda HTTP endpoint |

---

## Node 5: iPhone 15 Pro Max — Mobile Client

| Attribute | Detail |
|-----------|--------|
| Tailscale IP | 100.68.251.111 |
| Role | Lee's mobile client |

### Access Methods
| Method | What |
|--------|------|
| Telegram | Primary 24/7 interface to Claude Chief of Staff (48+ commands) |
| Safari | HP dashboards via 192.168.0.58:8080/* (LAN) or Cloudflare URLs |
| Tailscale | VPN access to all nodes from anywhere |
| SMS/Call | 2-way via NAVADA phone +447446994961 |

---

## Communication Channels

```
LEE (iPhone/ASUS)
  |
  +-- Telegram -----> telegram-bot (HP) -----> Claude AI (Sonnet/Opus)
  |                        |
  |                        +---> run_shell, email, SMS, image gen, LinkedIn
  |                        +---> 48+ slash commands
  |                        +---> Guest demo mode for prospects
  |
  +-- SMS/Call -----> Twilio (+447446994961) --> telegram-bot --> Claude
  |
  +-- WhatsApp -----> Twilio sandbox --> telegram-bot --> Claude
  |
  +-- Email --------> Zoho IMAP --> inbox-responder --> auto-reply
  |
  +-- Claude Code --> Direct CLI on ASUS (primary dev interface)
```

---

## Data Flow

```
EXTERNAL TRIGGERS                     HP PROCESSING                    OUTPUT
+-----------------+                  +------------------+             +------------------+
| Telegram msg    | -- webhook ----> | telegram-bot     | ----------> | Reply to Telegram|
| SMS inbound     | -- Twilio -----> | telegram-bot     | ----------> | SMS reply        |
| Email inbound   | -- IMAP poll --> | inbox-responder  | ----------> | Auto-reply email |
| Scheduled task  | -- Win Sched --> | Node.js/Python   | ----------> | Email report     |
| Git push        | -- auto-deploy > | rebuild service  | ----------> | Updated service  |
| ASUS check-in   | -- HTTP -------> | node-checkin.js  | ----------> | PG + Telegram    |
+-----------------+                  +------------------+             +------------------+
```

---

## Security Layers

| Layer | Technology | What It Does |
|-------|-----------|--------------|
| 1. Public access | Cloudflare WAF + DDoS | Absorbs attacks, blocks bad traffic |
| 2. SSL/TLS | Cloudflare certificates | HTTPS for all public endpoints |
| 3. Tunnel | Cloudflare Tunnel (outbound only) | No open router ports, no public IP needed |
| 4. Private network | Tailscale (WireGuard) | Encrypted mesh VPN between all nodes |
| 5. API gateway | Nginx rate limiting | 30 req/s general, 10 req/s API |
| 6. Application | Telegram user registry | Admin/guest roles, time-limited access |
| 7. SSH | Tailscale SSH + key auth | Passwordless secure shell between nodes |
| 8. Secrets | .env files (gitignored) | API keys, tokens, passwords never in code |

---

## External Services

| Service | Purpose | Cost |
|---------|---------|------|
| Cloudflare (Free + Stream) | CDN, DNS, Tunnel, R2, Workers AI, Stream | Stream $5/mo |
| Tailscale (Free) | VPN mesh, SSH, device management | Free |
| Telegram Bot API | Primary mobile interface | Free |
| Twilio | SMS (+447446994961), voice calls | Pay per message |
| Zoho Mail | Business email (IMAP + SMTP) | Free tier |
| OpenAI API | DALL-E 3 images, TTS voice notes | Pay per use |
| Claude API | Telegram bot AI (Sonnet 4 / Opus 4) | Pay per token |
| Hunter.io | Email finding + verification | Free tier (25/mo) |
| Apify | Job scraping | Pay per actor run |
| Oracle Cloud (Free) | VM, Oracle XE, ELK stack | Free tier |
| AWS (Free + SES) | EC2 health monitor, Lambda, SES, S3 | Minimal |
| ChromaDB Cloud | RAG embeddings + semantic cache | Free tier |
| PM2.io | Remote process monitoring dashboard | Free tier |
| Vercel | App deployments for clients | Free tier |
| LinkedIn API | Post to Lee's profile | Free |

---

## Failover Architecture

```
NORMAL OPERATION:
  EC2 health-monitor --> pings HP every 5 min --> HP responds --> OK

HP GOES DOWN (15 min):
  EC2 health-monitor --> HP not responding (3 checks) --> FAILOVER
       |
       +---> SSH to Oracle VM
       +---> Activate Oracle Cloudflare tunnel (96e30aeb)
       +---> Start critical services on Oracle
       +---> Telegram notification to Lee

HP COMES BACK:
  /failback command --> Deactivate Oracle tunnel
                    --> Restore HP as primary
                    --> Sync any data changes back
```

---

## Quick Reference

### Access Everything from ASUS
```bash
# SSH into any node
ssh leeak@100.121.187.67        # HP
ssh opc@100.77.206.9            # Oracle
ssh ubuntu@100.98.118.33        # EC2
tailscale ssh navada             # HP (no keys needed)

# HP dashboards (browser)
http://192.168.0.58:8080/kibana/       # Log search
http://192.168.0.58:8080/flix/         # Video streaming
http://192.168.0.58:8080/network/      # Network scanner
http://192.168.0.58:8080/portainer/    # Docker management
http://192.168.0.58:8080/trading/      # Trading API
http://192.168.0.58:8080/cloudbeaver/  # Database UI

# PM2 remote monitoring
https://app.pm2.io                     # All HP processes

# Oracle VM dashboards (via Tailscale)
http://100.77.206.9:3000               # Grafana
http://100.77.206.9:3001               # Uptime Kuma
http://100.77.206.9:5601               # Kibana (direct)
http://100.77.206.9:9090               # Prometheus
http://100.77.206.9:8978               # CloudBeaver

# Cloud CLIs
aws ec2 describe-instances             # AWS
oci compute instance list              # Oracle Cloud
wrangler pages list                    # Cloudflare
```

### Emergency Commands (from ASUS)
```bash
# Restart Telegram bot
ssh leeak@100.121.187.67 "pm2 restart telegram-bot"

# Restart Nginx
ssh leeak@100.121.187.67 "cd CLAUDE_NAVADA_AGENT/infrastructure && docker compose restart nginx"

# Check HP health
ssh leeak@100.121.187.67 "pm2 list"

# Trigger failover manually
# Send /failover via Telegram

# Kill zombie process on HP
ssh leeak@100.121.187.67 "powershell -Command 'Stop-Process -Name python -Force'"
```

---

## Summary

NAVADA Edge is a 5-node distributed infrastructure running from Lee's home:

1. **ASUS** (cockpit) - Where Lee develops. Claude Code, VS Code, local AI, cloud CLIs.
2. **HP** (engine room) - Always-on production. 13 PM2 services, 3 Docker containers, 18 scheduled tasks, Nginx API gateway, Cloudflare tunnel.
3. **Oracle VM** (data centre) - ELK log search, Grafana monitoring, Oracle XE database, CloudBeaver, Uptime Kuma. Failover standby.
4. **EC2** (watchdog) - Independent health monitor. Triggers failover if HP goes down for 15 min.
5. **iPhone** (remote control) - Telegram to Claude Chief of Staff. 48+ commands. Full system control from anywhere.

All connected via Tailscale VPN mesh. Public access via Cloudflare tunnel (no open ports). Claude operates as Chief of Staff with full sudo across all nodes.
