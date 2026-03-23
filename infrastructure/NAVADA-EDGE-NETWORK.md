# NAVADA Edge Network — Architecture Reference
## Version 3.0 | March 2026

---

## Node Registry

```
┌──────┬────────────────────┬─────────────────┬──────────────────┬─────────────────────────┐
│ ID   │ Node               │ Tailscale IP    │ LAN / Public IP  │ Role                    │
├──────┼────────────────────┼─────────────────┼──────────────────┼─────────────────────────┤
│  A   │ ASUS Zenbook Duo   │ 100.88.118.128  │ 192.168.0.18     │ 24/7 Server Node        │
│  B   │ HP Laptop          │ 100.121.187.67  │ 192.168.0.58     │ Always-on SSH-only Node │
│  C   │ Oracle VM          │ 100.77.206.9    │ 132.145.46.184   │ Gateway / Docker Host   │
│  D   │ AWS EC2            │ 100.98.118.33   │ 3.11.119.181     │ 24/7 Compute            │
│  E   │ ASUS Vivobook      │ TBD             │ TBD              │ Control Client           │
│  F   │ iPhone 15 Pro Max  │ 100.68.251.111  │ mobile           │ Mobile Client            │
└──────┴────────────────────┴─────────────────┴──────────────────┴─────────────────────────┘
```

---

## Network Diagram

```
                            ┌─────────────────────────────────────────────────┐
                            │           CLOUDFLARE EDGE (24/7)                │
                            │                                                 │
                            │  DNS: navada-edge-server.uk                     │
                            │  Tunnel → C (Oracle Nginx)                      │
                            │  Workers: cron triggers, health beacon          │
                            │  R2: navada-assets (object storage)             │
                            │  Stream: video CDN                              │
                            │  Flux: free AI image generation                 │
                            │                                                 │
                            │  Subdomains (11):                               │
                            │    api / flix / trading / network / kibana       │
                            │    grafana / monitor / cloudbeaver / nodes       │
                            │    dashboard / logo                             │
                            └───────────────────┬─────────────────────────────┘
                                                │
                                      Cloudflare Tunnel
                                                │
 ┌──────────────────────────────────────────────┼──────────────────────────────────────────┐
 │                                    TAILSCALE MESH                                       │
 │                              (WireGuard, encrypted, P2P)                                │
 │                                                                                         │
 │  ┌─────────────────────────────┐     ┌─────────────────────────────┐                    │
 │  │  A: ASUS ZENBOOK DUO        │     │  B: HP LAPTOP               │                    │
 │  │  navada-asus-control         │     │  navada-edge-hp             │                    │
 │  │  100.88.118.128              │     │  100.121.187.67             │                    │
 │  │  Role: 24/7 SERVER NODE     │     │  Role: ALWAYS-ON SSH NODE   │                    │
 │  │                              │     │                             │                    │
 │  │  Hardware:                   │     │  Hardware:                  │                    │
 │  │    Intel Core Ultra 7        │     │    Windows 11 Pro           │                    │
 │  │    16GB RAM, 478GB free      │     │    Ethernet (static IP)     │                    │
 │  │    Windows 11 Home           │     │    ~119GB free              │                    │
 │  │    WiFi                      │     │                             │                    │
 │  │                              │     │  PM2 Services:              │                    │
 │  │  PM2 Services:               │     │    telegram-bot :3456       │                    │
 │  │    telegram-bot :3456 (DEV)  │     │      (PRODUCTION, 24/7)    │                    │
 │  │    particle-words :3100      │     │    navada-flix :4000        │                    │
 │  │    mindmap :3101             │     │    hp-cloudwatch-metrics    │                    │
 │  │                              │     │    cloudflare-metrics       │                    │
 │  │  Docker (WSL2, 24/7):        │     │    cloudwatch-logs          │                    │
 │  │    navada-pg-dev :5434       │     │                             │                    │
 │  │    navada-redis :6379        │     │  Native:                    │                    │
 │  │    navada-chroma :8000       │     │    PostgreSQL 17 :5433      │                    │
 │  │    navada-sqlite-admin :8088 │     │      (navada_pipeline DB)  │                    │
 │  │    navada-portainer-agt :9001│     │    Tailscale (native)       │                    │
 │  │    navada-node-exporter :9100│     │                             │                    │
 │  │    [NemoClaw/OpenClaw]       │     │  PROTECTED — NO CHANGES    │                    │
 │  │                              │     │    No new files             │                    │
 │  │  Native:                     │     │    No new services          │                    │
 │  │    PostgreSQL 17 :5433       │     │    Disk full for Docker     │                    │
 │  │    Ollama :11434             │     │                             │                    │
 │  │    LM Studio (local AI)      │     │                             │                    │
 │  │    Tailscale (native)        │     │                             │                    │
 │  └──────────────┬──────────────┘     └──────────────┬──────────────┘                    │
 │                 │                                    │                                    │
 │                 │         SSH (Tailscale)            │                                    │
 │                 ├───────────────────────────────────►│                                    │
 │                 │◄───────────────────────────────────┤                                    │
 │                 │                                    │                                    │
 │  ┌─────────────┴───────────────┐     ┌──────────────┴──────────────┐                    │
 │  │  C: ORACLE VM               │     │  D: AWS EC2                 │                    │
 │  │  navada-oracle               │     │  navada-ec2-aws             │                    │
 │  │  100.77.206.9                │     │  100.98.118.33              │                    │
 │  │  Role: GATEWAY / DOCKER     │     │  Role: 24/7 COMPUTE         │                    │
 │  │                              │     │                             │                    │
 │  │  Hardware:                   │     │  Hardware:                  │                    │
 │  │    Oracle Cloud Free Tier    │     │    t3.medium (2 vCPU, 4GB) │                    │
 │  │    E5.Flex 1 OCPU, 5.8GB    │     │    Ubuntu, eu-west-2       │                    │
 │  │    Ubuntu, uk-london-1       │     │    Elastic IP 3.11.119.181 │                    │
 │  │    No swap                   │     │                             │                    │
 │  │                              │     │  PM2 Services (6):          │                    │
 │  │  Docker Containers (7):      │     │    ec2-health-monitor       │                    │
 │  │    navada-proxy :80/443/8080 │     │      (16 endpoints, 5min) │                    │
 │  │      (Nginx reverse proxy)  │     │    cloudwatch-dashboard-    │                    │
 │  │    navada-tunnel              │     │      updater (11 dashboards│                    │
 │  │      (Cloudflare Tunnel)    │     │      every 5min)           │                    │
 │  │    navada-grafana :3000      │     │    worldmonitor :4000       │                    │
 │  │    navada-prometheus :9090   │     │      (OSINT dashboard)     │                    │
 │  │    navada-portainer :9000    │     │    worldview-monitor        │                    │
 │  │    cloudbeaver :8978         │     │    navada-dashboard         │                    │
 │  │    navada-uptime :3001       │     │    e2e-tests                │                    │
 │  │      (Uptime Kuma)          │     │                             │                    │
 │  │                              │     │  AWS Services:              │                    │
 │  │  Disabled (OOM prevention):  │     │    Lambda: vision-router    │                    │
 │  │    navada-elasticsearch      │     │    API GW: /vision/*        │                    │
 │  │    navada-kibana             │     │    SageMaker: YOLOv8n       │                    │
 │  │    navada-jenkins            │     │    Bedrock: Claude AI       │                    │
 │  │                              │     │    DynamoDB: logs, faces    │                    │
 │  │  Nginx Security:             │     │    S3/ECR/Rekognition       │                    │
 │  │    server_tokens off         │     │    CloudWatch: 11 dashboards│                    │
 │  │    HSTS enabled              │     │                             │                    │
 │  │    Rate limiting (5 zones)   │     │                             │                    │
 │  │    X-NAVADA-Node header      │     │                             │                    │
 │  │    Telegram: HP+ASUS backup  │     │                             │                    │
 │  └──────────────┬──────────────┘     └──────────────┬──────────────┘                    │
 │                 │                                    │                                    │
 │                 │         SSH (Tailscale)            │                                    │
 │                 ├───────────────────────────────────►│                                    │
 │                 │◄───────────────────────────────────┤                                    │
 │                 │                                    │                                    │
 │  ┌─────────────┴───────────────┐     ┌──────────────┴──────────────┐                    │
 │  │  E: ASUS VIVOBOOK (NEW)     │     │  F: iPHONE 15 PRO MAX      │                    │
 │  │  TBD hostname                │     │  iphone-15-pro-max          │                    │
 │  │  TBD Tailscale IP            │     │  100.68.251.111             │                    │
 │  │  Role: CONTROL CLIENT        │     │  Role: MOBILE CLIENT        │                    │
 │  │                              │     │                             │                    │
 │  │  Purpose:                    │     │  Purpose:                   │                    │
 │  │    Lee's primary laptop      │     │    Telegram Chief of Staff  │                    │
 │  │    SSH into all nodes        │     │    SMS / Voice via Twilio   │                    │
 │  │    Claude Code sessions      │     │    Web dashboards           │                    │
 │  │    VS Code remote dev        │     │    +447446994961 (NAVADA)   │                    │
 │  │    Control the Edge network  │     │    +447935237704 (Lee)      │                    │
 │  │                              │     │                             │                    │
 │  │  Setup needed:               │     │                             │                    │
 │  │    Tailscale install         │     │                             │                    │
 │  │    SSH keys + config         │     │                             │                    │
 │  │    Claude Code install       │     │                             │                    │
 │  │    Node.js + Git             │     │                             │                    │
 │  └─────────────────────────────┘     └─────────────────────────────┘                    │
 │                                                                                         │
 └─────────────────────────────────────────────────────────────────────────────────────────┘

                            ┌─────────────────────────────────────────────────┐
                            │           AWS SERVERLESS (24/7)                  │
                            │                                                 │
                            │  Lambda: navada-vision-router                   │
                            │  API Gateway: /vision/* /mcp /api/*             │
                            │  SageMaker: navada-yolov8n (scales to zero)     │
                            │  Bedrock: Claude Sonnet/Opus                    │
                            │  Rekognition: navada-faces collection           │
                            │  DynamoDB: faces, vision-log, edge-logs         │
                            │  S3: navada-vision-eu-west-2                    │
                            │  CloudWatch: 11 dashboards, 3 log groups        │
                            │  Budget: $25/month                              │
                            └─────────────────────────────────────────────────┘
```

---

## SSH Mesh (all nodes can reach all nodes)

```
        A (ASUS Zenbook)  ◄──────►  B (HP)
             │    │                   │  │
             │    └────────►  C (Oracle)  │
             │    └────────►  D (EC2) ◄───┘
             │
        E (Vivobook) ──────► A, B, C, D  (control client, SSH to all)
        F (iPhone)   ──────► Telegram bot on B (primary) / A (backup)
```

### SSH Config for E (Vivobook) — copy to ~/.ssh/config

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

## Service Port Map

### A: ASUS Zenbook Duo (100.88.118.128) — 24/7 Server

| Port | Service | Type | Status |
|------|---------|------|--------|
| 3100 | Particle Words | PM2 | Online |
| 3101 | Architecture Mindmap | PM2 | Online |
| 3456 | Telegram Bot (DEV) | PM2 | Online |
| 5433 | PostgreSQL 17 (native) | Native | Running |
| 5434 | PostgreSQL 17 (Docker dev) | Docker | Planned |
| 6379 | Redis 7 | Docker | Planned |
| 8000 | ChromaDB | Docker | Planned |
| 8088 | SQLite Web Admin | Docker | Planned |
| 9001 | Portainer Agent | Docker | Planned |
| 9100 | Node Exporter | Docker | Planned |
| 11434 | Ollama (local AI) | Native | Running |
| 18789 | NemoClaw/OpenClaw Gateway | Docker | Running |

### B: HP Laptop (100.121.187.67) — Always-on SSH Node

| Port | Service | Type | Status |
|------|---------|------|--------|
| 3000 | NAVADA Logo | PM2 | Online |
| 3456 | Telegram Bot (PRODUCTION) | PM2 | Online |
| 4000 | NAVADA Flix | PM2 | Online |
| 5433 | PostgreSQL 17 (navada_pipeline) | Native | Running |
| 5678 | Trading API | PM2 | Online |
| 7777 | Network Scanner | PM2 | Online |

### C: Oracle VM (100.77.206.9) — Gateway

| Port | Service | Type | Status |
|------|---------|------|--------|
| 80 | Nginx Reverse Proxy | Docker | Running |
| 443 | Nginx SSL | Docker | Running |
| 3000 | Grafana | Docker | Running |
| 3001 | Uptime Kuma | Docker | Healthy |
| 8080 | Nginx path-based routing | Docker | Running |
| 8978 | CloudBeaver | Docker | Running |
| 9000 | Portainer | Docker | Running |
| 9090 | Prometheus | Docker | Running |

### D: AWS EC2 (100.98.118.33 / 3.11.119.181) — Compute

| Port | Service | Type | Status |
|------|---------|------|--------|
| 4000 | WorldMonitor (OSINT) | PM2 | Online |
| — | ec2-health-monitor | PM2 | Online |
| — | cloudwatch-dashboard-updater | PM2 | Online |
| — | worldview-monitor | PM2 | Online |
| — | navada-dashboard | PM2 | Online |
| — | e2e-tests | PM2 | Online |

---

## Traffic Flow

```
Internet → Cloudflare DNS → Cloudflare Tunnel → C:Nginx → B:services (HP via Tailscale)
                                                        → A:services (ASUS via Tailscale)
                                                        → C:services (Oracle local Docker)
                                                        → D:WorldMonitor (EC2 via Tailscale)

Lee (iPhone F) → Telegram → B:telegram-bot :3456 (primary)
                           → A:telegram-bot :3456 (backup, via Nginx upstream)

Lee (Vivobook E) → SSH → A, B, C, D (any node, via Tailscale)
                  → Claude Code → direct work on any node
```

---

## Cloudflare Subdomains (11)

| Subdomain | Full URL | Routes To |
|-----------|----------|-----------|
| api | api.navada-edge-server.uk | B:3456 (Telegram/Twilio webhooks) |
| flix | flix.navada-edge-server.uk | B:4000 (NAVADA Flix) |
| trading | trading.navada-edge-server.uk | B:5678 (Trading Lab) |
| network | network.navada-edge-server.uk | B:7777 (Network Scanner) |
| logo | logo.navada-edge-server.uk | B:3000 (Logo Service) |
| grafana | grafana.navada-edge-server.uk | C:3000 (Grafana) |
| monitor | monitor.navada-edge-server.uk | C:3001 (Uptime Kuma) |
| cloudbeaver | cloudbeaver.navada-edge-server.uk | C:8978 (DB Admin) |
| nodes | nodes.navada-edge-server.uk | C:static (Network Map) |
| dashboard | dashboard.navada-edge-server.uk | D (Command Centre) |
| kibana | kibana.navada-edge-server.uk | C:5601 (disabled, OOM) |

---

## Node Health Monitoring

| Monitor | Location | Checks | Interval |
|---------|----------|--------|----------|
| ec2-health-monitor | D (EC2) | 16 endpoints across A,B,C,D | 5 min |
| Uptime Kuma | C (Oracle) | Configurable HTTP/TCP/Ping | Configurable |
| hp-cloudwatch-metrics | B (HP) | System + Node.js + Tailscale | 60s |
| cloudflare-metrics | B (HP) | Subdomain probes + analytics | 5 min |
| cloudwatch-dashboard-updater | D (EC2) | Updates 11 CW dashboards | 5 min |

---

## Storage Strategy

| Location | Use For | Capacity |
|----------|---------|----------|
| A (ASUS) | New files, Docker volumes, data, AI models | 478GB free |
| B (HP) | PROTECTED — existing data only, no new files | 119GB free (disk was full) |
| C (Oracle) | Docker volumes (Grafana, Prometheus, Uptime Kuma) | Limited (free tier) |
| D (EC2) | WorldMonitor data, CloudWatch | EBS volume |
| Cloudflare R2 | Assets, version snapshots, media | Pay-per-use |
| AWS S3 | Vision pipeline images | Pay-per-use |

---

## Protected Resources — DO NOT TOUCH

- B: Telegram bot (PM2, :3456) — PRODUCTION
- B: PostgreSQL 17 (:5433) — navada_pipeline
- B: PM2 services (flix, metrics, cloudwatch) — all running
- B: Disk — ZERO new files or services
- A: Telegram bot (PM2, :3456) — DEV instance
- C: Cloudflare tunnel — routes all public traffic
- D: WorldMonitor — OSINT dashboard
- NemoClaw identity files (SOUL.md, IDENTITY.md) — untouched
