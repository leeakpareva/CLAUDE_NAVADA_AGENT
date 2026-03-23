# CLAUDE.md — NAVADA Edge Network | Control Client

## Owner
**Lee Akpareva** — Founder of NAVADA | Principal AI Consultant
- Email: leeakpareva@gmail.com
- GitHub: Navada25 / leeakpareva

## This Machine
You are running on **Node E: ASUS Vivobook** — Lee's dedicated Control Client for the NAVADA Edge network. This laptop is NOT a server. It is Lee's cockpit for managing the entire network via SSH, Claude Code, and VS Code.

## Architecture Overview

The NAVADA Edge network is a distributed home/cloud infrastructure with 6 nodes connected via Tailscale WireGuard mesh. All nodes can SSH to all other nodes. Cloudflare provides public ingress via tunnel to Node C.

```
┌──────┬────────────────────┬─────────────────┬──────────────────┬─────────────────────────┐
│ ID   │ Node               │ Tailscale IP    │ LAN / Public IP  │ Role                    │
├──────┼────────────────────┼─────────────────┼──────────────────┼─────────────────────────┤
│  A   │ ASUS Zenbook Duo   │ 100.88.118.128  │ 192.168.0.18     │ 24/7 Server Node        │
│  B   │ HP Laptop          │ 100.121.187.67  │ 192.168.0.58     │ Always-on SSH-only Node │
│  C   │ Oracle VM          │ 100.77.206.9    │ 132.145.46.184   │ Gateway / Docker Host   │
│  D   │ AWS EC2            │ 100.98.118.33   │ 3.11.119.181     │ 24/7 Compute            │
│  E   │ ASUS Vivobook      │ TBD             │ TBD              │ Control Client (this)    │
│  F   │ iPhone 15 Pro Max  │ 100.68.251.111  │ mobile           │ Mobile Client            │
└──────┴────────────────────┴─────────────────┴──────────────────┴─────────────────────────┘
```

## Node Details

### A: ASUS Zenbook Duo (navada-asus-control) — 24/7 SERVER
- **SSH**: `ssh navada-asus`
- **Hardware**: Intel Core Ultra 7, 16GB RAM, 478GB free, WiFi, Windows 11 Home
- **Role**: Primary Docker host, local AI inference, dev databases, new services go HERE
- **PM2 Services**:
  - `telegram-bot` :3456 (DEV instance — NOT production)
  - `particle-words` :3100
  - `mindmap` :3101
- **Docker Services** (WSL2 backend, 24/7):
  - `navada-pg-dev` :5434 (PostgreSQL 17 dev)
  - `navada-redis` :6379 (Redis 7)
  - `navada-chroma` :8000 (ChromaDB vector DB)
  - `navada-sqlite-admin` :8088 (SQLite Web UI)
  - `navada-portainer-agent` :9001
  - `navada-node-exporter` :9100 (Prometheus metrics)
  - NemoClaw/OpenClaw (autonomous AI agent, own container)
- **Native Services**:
  - PostgreSQL 17 :5433
  - Ollama :11434 (local LLM inference, free)
  - LM Studio (local AI models)
  - Tailscale (mesh VPN)
- **Storage**: Use A for new files, data, Docker volumes (478GB free)

### B: HP Laptop (navada-edge-hp) — ALWAYS-ON, PROTECTED
- **SSH**: `ssh navada-hp`
- **Hardware**: Windows 11 Pro, Ethernet (static 192.168.0.58), ~119GB free
- **Role**: Production Telegram bot, video streaming, metrics. HP is PROTECTED — add NOTHING new.
- **PM2 Services**:
  - `telegram-bot` :3456 (PRODUCTION — serves Lee's Telegram commands 24/7)
  - `navada-flix` :4000 (video streaming)
  - `hp-cloudwatch-metrics` (system metrics to CloudWatch every 60s)
  - `cloudflare-metrics` (Cloudflare analytics every 5min)
  - `cloudwatch-logs` (PM2/Telegram logs to CloudWatch)
  - `navada-logo` :3000
  - `network-scanner` :7777
  - `trading-api` :5678
- **Native Services**:
  - PostgreSQL 17 :5433 (database: `navada_pipeline` — production data)
- **CRITICAL**: Do NOT create files, install packages, or add services on B. Disk was full. Docker is dead. SSH-only operations.

### C: Oracle VM (navada-oracle) — GATEWAY
- **SSH**: `ssh oracle-navada`
- **Hardware**: Oracle Cloud Free Tier, E5.Flex 1 OCPU, 5.8GB RAM (no swap), Ubuntu
- **Role**: Nginx reverse proxy, Cloudflare tunnel endpoint, monitoring dashboards
- **Docker Containers (7 running)**:
  - `navada-proxy` :80/:443/:8080 (Nginx — routes ALL public traffic)
  - `navada-tunnel` (Cloudflare Tunnel to navada-edge-server.uk)
  - `navada-grafana` :3000 (dashboards)
  - `navada-prometheus` :9090 (metrics collection)
  - `navada-portainer` :9000 (Docker management UI)
  - `cloudbeaver` :8978 (database admin UI)
  - `navada-uptime` :3001 (Uptime Kuma health monitoring)
- **Disabled** (to prevent OOM — only 5.8GB RAM):
  - `navada-elasticsearch` (2GB+ memory)
  - `navada-kibana`
  - `navada-jenkins`
- **Nginx Security**: server_tokens off, HSTS, rate limiting (5 zones), X-NAVADA-Node header
- **Nginx Telegram routing**: HP primary (:3456), ASUS backup
- **WARNING**: This VM has only 5.8GB RAM and no swap. Adding heavy containers causes OOM and full VM freeze. Always check `free -h` before starting new services.

### D: AWS EC2 (navada-ec2-aws) — 24/7 COMPUTE
- **SSH**: `ssh navada-ec2`
- **Hardware**: t3.medium (2 vCPU, 4GB), Ubuntu, eu-west-2, Elastic IP 3.11.119.181
- **Role**: Health monitoring, OSINT dashboard, CloudWatch management
- **PM2 Services (6, all online)**:
  - `ec2-health-monitor` — checks 16 endpoints every 5 min, alerts via Telegram + SMS
  - `cloudwatch-dashboard-updater` — updates 11 CloudWatch dashboards every 5 min
  - `worldmonitor` :4000 — WorldView OSINT dashboard
  - `worldview-monitor` — pushes WorldView metrics to CloudWatch
  - `navada-dashboard` — NAVADA command centre
  - `e2e-tests` — end-to-end test runner
- **AWS Services**: Lambda (vision API), API Gateway, SageMaker (YOLOv8), Bedrock (Claude), DynamoDB, S3, ECR, Rekognition, CloudWatch (11 dashboards)
- **Budget**: $25/month (alerts at 80%/100%)

### E: ASUS Vivobook (THIS MACHINE) — CONTROL CLIENT
- **Role**: Lee's dedicated control laptop. SSH into all nodes. Claude Code sessions. VS Code remote development. NOT a server — no services run here.
- **Required setup**:
  1. Tailscale installed and joined to leeakpareva@ account
  2. SSH keys copied from A or generated fresh
  3. SSH config with all node entries (see below)
  4. Claude Code installed
  5. Node.js + Git installed
  6. VS Code with Remote-SSH extension

### F: iPhone 15 Pro Max — MOBILE CLIENT
- **Tailscale**: 100.68.251.111
- **Role**: Telegram interface to Claude Chief of Staff, web dashboard access
- **NAVADA Phone**: +447446994961 (Claude's Twilio number for SMS/voice)

---

## SSH Config (for this machine)

Ensure `~/.ssh/config` contains:

```
Host navada-asus
    HostName 100.88.118.128
    User leeak
    ServerAliveInterval 60
    ServerAliveCountMax 3

Host navada-hp
    HostName 100.121.187.67
    User leeak
    ServerAliveInterval 60
    ServerAliveCountMax 3

Host oracle-navada
    HostName 100.77.206.9
    User ubuntu
    IdentityFile ~/.ssh/oracle-navada
    ServerAliveInterval 60
    ServerAliveCountMax 3

Host navada-ec2
    HostName 100.98.118.33
    User ubuntu
    IdentityFile ~/.ssh/aws-navada.pem
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

---

## Quick Reference Commands

### Check all nodes
```bash
# Node A (ASUS server)
ssh navada-asus "pm2 list && docker ps --format 'table {{.Names}}\t{{.Status}}'"

# Node B (HP)
ssh navada-hp "pm2 list"

# Node C (Oracle)
ssh oracle-navada "docker ps --format 'table {{.Names}}\t{{.Status}}' && free -h | head -2"

# Node D (EC2)
ssh navada-ec2 "pm2 list"
```

### Service management
```bash
# Restart a PM2 service on any node
ssh navada-hp "pm2 restart telegram-bot"
ssh navada-asus "pm2 restart particle-words"
ssh navada-ec2 "pm2 restart ec2-health-monitor"

# Restart Docker container on Oracle
ssh oracle-navada "docker restart navada-proxy"

# Reload Nginx config on Oracle
ssh oracle-navada "docker exec navada-proxy nginx -t && docker exec navada-proxy nginx -s reload"

# Check Oracle memory before adding anything
ssh oracle-navada "free -h | head -2"
```

### Logs
```bash
# PM2 logs
ssh navada-hp "pm2 logs telegram-bot --lines 50 --nostream"
ssh navada-ec2 "pm2 logs ec2-health-monitor --lines 50 --nostream"

# Nginx access log on Oracle
ssh oracle-navada "docker exec navada-proxy tail -50 /var/log/nginx/access.log"
```

---

## Cloudflare Subdomains (navada-edge-server.uk)

| Subdomain | Backend Node | Port |
|-----------|-------------|------|
| api | B (HP) | :3456 |
| flix | B (HP) | :4000 |
| trading | B (HP) | :5678 |
| network | B (HP) | :7777 |
| logo | B (HP) | :3000 |
| grafana | C (Oracle) | :3000 |
| monitor | C (Oracle) | :3001 |
| cloudbeaver | C (Oracle) | :8978 |
| nodes | C (Oracle) | static |
| dashboard | D (EC2) | :4000 |
| kibana | C (Oracle) | :5601 (disabled) |

---

## Rules

1. **B (HP) is PROTECTED** — never create files, install packages, or add services. SSH-only.
2. **New services go on A (ASUS)** — it has the most resources (16GB RAM, 478GB disk).
3. **Check Oracle memory** before starting any container on C. Only 5.8GB, no swap.
4. **AWS budget is $25/month** — check costs before spinning up new resources.
5. **Telegram bot on B is PRODUCTION** — never restart without good reason.
6. **All SSH via Tailscale IPs** — never use public IPs for inter-node communication.
7. Secrets in `.env` files, never hardcode.
8. Git: conventional commits (feat:, fix:, docs:).
9. When running local servers on any node: bind to `0.0.0.0` for cross-node access.

## Claude: Chief of Staff
- Claude operates as NAVADA's Chief of Staff
- Full control over all nodes via SSH from this machine
- Telegram bot on B is the 24/7 mobile interface
- Reports to Lee Akpareva (Founder)

## Conventions
- Python: PEP 8, type hints
- JavaScript/TypeScript: ESLint, async patterns
- Git: conventional commits
- Logs: `Automation/logs/` on each node
