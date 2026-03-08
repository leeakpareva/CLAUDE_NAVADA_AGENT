# NAVADA EDGE — Full Hybrid Architecture v2.0

**Status**: OFFICIAL — Reference Architecture Document
**Created**: 4 March 2026
**Author**: Claude, Chief of Staff | Lee Akpareva, Founder
**Classification**: Internal — NAVADA Infrastructure

---

## Executive Summary

NAVADA Edge operates a **three-node hybrid cloud architecture** spanning a home server (HP Laptop), an AWS EC2 cloud gateway, and an Oracle Cloud database node. All nodes communicate over an encrypted Tailscale WireGuard mesh. Public traffic enters exclusively through Cloudflare's edge network. Zero services are directly exposed to the internet.

**Design Principles**:
- Zero trust: every request authenticated and encrypted
- Defence in depth: 6 security layers before reaching any service
- Hybrid-first: local compute for speed/privacy, cloud for resilience/scale
- Cost-optimised: free-tier cloud services wherever possible
- Single-operator: one person (Lee) manages the entire stack from an iPhone

---

## Architecture Diagram

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                ║
║   LAYER 0: CLIENTS (Untrusted)                                                ║
║                                                                                ║
║   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       ║
║   │ Lee      │  │ Telegram │  │ Web      │  │ Twilio   │  │ LinkedIn │       ║
║   │ iPhone   │  │ Guests   │  │ Visitors │  │ SMS/Call │  │ API      │       ║
║   │ (Admin)  │  │ (Demo)   │  │ (Flix)   │  │ (Inbound)│  │ (Posts)  │       ║
║   └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       ║
║        │Tailscale     │HTTPS       │HTTPS        │HTTPS        │HTTPS        ║
║        │WireGuard     │Telegram    │Browser      │Webhook      │OAuth         ║
║        │              │Bot API     │             │             │              ║
╠════════╪══════════════╪════════════╪════════════╪═════════════╪══════════════╣
║        │              │            │            │             │              ║
║   LAYER 1: CLOUDFLARE EDGE (Global Security + CDN)                          ║
║                                                                              ║
║   ┌──────────────────────────────────────────────────────────────────┐       ║
║   │  DNS: navada-edge-server.uk (Zone: 38050dc0)                    │       ║
║   │  Account: ff6607db333b4ff7822c52cbe0b7d1be                     │       ║
║   │                                                                  │       ║
║   │  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐ │       ║
║   │  │ WAF + DDoS      │  │ Cloudflare Worker │  │ Cloudflare     │ │       ║
║   │  │ OWASP rules     │  │ navada-edge       │  │ Tunnel 7c9e3c36│ │       ║
║   │  │ Bot protection  │  │                    │  │                │ │       ║
║   │  │ Geo-blocking    │  │ Routes:            │  │ Routes:        │ │       ║
║   │  │ Rate limiting   │  │ flix.navada-*      │  │ api.navada-*   │ │       ║
║   │  │ Challenge pages │  │  → cache + proxy   │  │  → Nginx :80   │ │       ║
║   │  └─────────────────┘  │ api.navada-*/edge/*│  │ logo.navada-*  │ │       ║
║   │                        │  → serverless     │  │  → Nginx :80   │ │       ║
║   │  ┌─────────────────┐  └──────────────────┘  │ network.navada-*│ │       ║
║   │  │ Cloudflare      │                         │  → Nginx :80   │ │       ║
║   │  │ Access (ZT)     │  ┌──────────────────┐  └────────────────┘ │       ║
║   │  │ Email OTP for:  │  │ Cloudflare R2    │                      │       ║
║   │  │ Kibana, Grafana │  │ navada-assets    │  ┌────────────────┐ │       ║
║   │  │ Portainer       │  │ Zero egress cost │  │ Cloudflare     │ │       ║
║   │  │ Flix → Clerk    │  └──────────────────┘  │ Stream (Video) │ │       ║
║   │  └─────────────────┘                         │ $5/mo Starter  │ │       ║
║   │                        ┌──────────────────┐  └────────────────┘ │       ║
║   │                        │ Workers AI (Flux)│                      │       ║
║   │                        │ FREE image gen   │                      │       ║
║   │                        └──────────────────┘                      │       ║
║   └──────────────────────────────────────────────────────────────────┘       ║
║        │                          │                                          ║
╠════════╪══════════════════════════╪══════════════════════════════════════════╣
║        │ Tunnel (encrypted)       │ Worker proxy (via Tailscale)            ║
║        │                          │                                          ║
║   LAYER 2: TAILSCALE MESH VPN (WireGuard, ChaCha20-Poly1305)               ║
║                                                                              ║
║   ┌──────────────────────────────────────────────────────────────────┐       ║
║   │  ACLs: Only Lee's devices can reach servers                      │       ║
║   │  Protocol: WireGuard (UDP, encrypted point-to-point)             │       ║
║   │                                                                   │       ║
║   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │       ║
║   │  │ iPhone       │  │ HP Laptop   │  │ AWS EC2     │             │       ║
║   │  │ 100.68.251  │  │ 100.121.187 │  │ 100.98.118  │             │       ║
║   │  │ .111        │◄►│ .67         │◄►│ .33         │             │       ║
║   │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │       ║
║   │         │                │                 │                     │       ║
║   │         │          ┌─────┴─────┐    ┌──────┴──────┐             │       ║
║   │         │          │ Oracle VM │    │ Future      │             │       ║
║   │         │          │ (planned) │    │ Client VMs  │             │       ║
║   │         │          └───────────┘    └─────────────┘             │       ║
║   └──────────────────────────────────────────────────────────────────┘       ║
║                               │                                              ║
╠═══════════════════════════════╪══════════════════════════════════════════════╣
║                               │                                              ║
║   LAYER 3: COMPUTE NODES (3 Nodes)                                          ║
║                                                                              ║
║   ┌─────────────────────────────────────────────────────────────────────┐   ║
║   │                                                                     │   ║
║   │   NODE A: AWS EC2 — CLOUD GATEWAY (Always-On)                      │   ║
║   │   ─────────────────────────────────────────                        │   ║
║   │   Instance: i-0055e7ace24db38b0 (t3.micro)                        │   ║
║   │   Region: eu-west-2 (London) | Public IP: 18.130.39.222           │   ║
║   │   Tailscale: 100.98.118.33 (navada-ec2)                           │   ║
║   │   OS: Ubuntu 24.04 LTS | 1 vCPU, 1GB RAM, 30GB EBS gp3           │   ║
║   │   SSH: navada-ec2 (via Tailscale) | Key: aws-navada.pem           │   ║
║   │   SG: sg-04f276f8012370b03 (Tailscale SSH + Cloudflare HTTP/S)    │   ║
║   │                                                                     │   ║
║   │   Stack:                                                            │   ║
║   │   ├── Ubuntu 24.04 LTS                                             │   ║
║   │   ├── Claude Code v2.1.68 (Max plan)                               │   ║
║   │   ├── Node.js v22.22.0 + npm 10.9.4                               │   ║
║   │   ├── PM2 v6.0.14 (systemd auto-start)                            │   ║
║   │   ├── AWS CLI v2.34.1 (IAM role access)                           │   ║
║   │   ├── Tailscale v1.94.2 (mesh VPN)                                │   ║
║   │   ├── Git v2.43.0                                                  │   ║
║   │   └── SSH keys (client machine access)                             │   ║
║   │                                                                     │   ║
║   │   Responsibilities:                                                 │   ║
║   │   • Public gateway anchor (stable IP, 99.99% uptime)              │   ║
║   │   • AWS infrastructure management (Lambda, S3, ECS, CloudWatch)    │   ║
║   │   • Disaster recovery (restart home server via Tailscale SSH)      │   ║
║   │   • Client deployment gateway (second SSH path via Tailscale)      │   ║
║   │   • Heavy AWS workloads (S3 uploads free, SageMaker, log analysis) │   ║
║   │   • Health monitor (pings laptop + endpoints every 5 min)          │   ║
║   │                                                                     │   ║
║   │   Cost: £0/mo (free tier 12 months) → ~£7/mo after                │   ║
║   │                                                                     │   ║
║   ├─────────────────────────────────────────────────────────────────────┤   ║
║   │                                                                     │   ║
║   │   NODE B: HP LAPTOP — NAVADA EDGE SERVER (Home Powerhouse)         │   ║
║   │   ─────────────────────────────────────────────────                │   ║
║   │   LAN: 192.168.0.58 (static, ethernet)                            │   ║
║   │   Tailscale: 100.121.187.67 (navada)                               │   ║
║   │   OS: Windows 11 Pro | Git Bash shell                              │   ║
║   │   Runtime: Docker Desktop (WSL2) + Node.js v24 + Python 3.12      │   ║
║   │                                                                     │   ║
║   │   PM2 Services (11):                                                │   ║
║   │   ├── telegram-bot (:3456) — Claude Chief of Staff + Twilio hook   │   ║
║   │   ├── navada-flix (:4000) — HLS video streaming                    │   ║
║   │   ├── worldmonitor (:4173) — OSINT dashboard frontend             │   ║
║   │   ├── worldmonitor-api (:46123) — OSINT API backend               │   ║
║   │   ├── trading-api (:5678) — FastAPI trading bot                    │   ║
║   │   ├── network-scanner (:7777) — Router dashboard                   │   ║
║   │   ├── voice-command (:7778) — S8 Bluetooth voice control           │   ║
║   │   ├── inbox-responder — Email auto-reply + approvals               │   ║
║   │   ├── auto-deploy — Git poll + rebuild (2 min interval)            │   ║
║   │   ├── trading-scheduler — Cron-style trading triggers              │   ║
║   │   └── notebooklm-watcher — Auto-upload NotebookLM to R2           │   ║
║   │                                                                     │   ║
║   │   Docker Containers (8):                                            │   ║
║   │   ├── navada-proxy (Nginx Alpine) — Reverse proxy :80/:443/:8080   │   ║
║   │   ├── navada-tunnel (Cloudflared) — Cloudflare Tunnel              │   ║
║   │   ├── navada-prometheus (:9091) — Metrics collection               │   ║
║   │   ├── navada-grafana (:9090) — Dashboards                          │   ║
║   │   ├── navada-portainer (:9000) — Container management              │   ║
║   │   ├── navada-uptime (:3002) — Uptime Kuma monitoring               │   ║
║   │   ├── navada-elasticsearch (:9200) — Log storage (1GB heap)        │   ║
║   │   └── navada-kibana (:5601) — Log search UI                        │   ║
║   │                                                                     │   ║
║   │   Scheduled Tasks (18 via Windows Task Scheduler):                  │   ║
║   │   ├── Morning-Briefing (daily 6:30 AM)                             │   ║
║   │   ├── AI-News-Digest (daily 7:00 AM)                               │   ║
║   │   ├── Economy-Report (Mon 8:00 AM)                                 │   ║
║   │   ├── NAVADA-LeadPipeline (daily 8:30 AM)                         │   ║
║   │   ├── Job-Hunter-Daily (daily 9:00 AM)                             │   ║
║   │   ├── NAVADA-ProspectPipeline (daily 9:30 AM)                     │   ║
║   │   ├── Self-Improve-Weekly (Mon 10:00 AM)                           │   ║
║   │   ├── NAVADA-Trading-PreMarket (daily 2:15 PM)                    │   ║
║   │   ├── NAVADA-Trading-Execute (daily 3:45 PM)                      │   ║
║   │   ├── Market-Intelligence (daily 6:00 PM)                          │   ║
║   │   ├── Weekly-Report (Sun 6:00 PM)                                  │   ║
║   │   ├── NAVADA-Trading-FridayClose (Fri 8:30 PM)                    │   ║
║   │   ├── Daily-Ops-Report (daily 9:00 PM)                            │   ║
║   │   ├── NAVADA-Trading-Report (daily 9:15 PM)                       │   ║
║   │   ├── Inbox-Monitor (every 2hrs 8AM-10PM)                         │   ║
║   │   ├── VC-Response-Monitor (at startup)                             │   ║
║   │   ├── NAVADA-Infrastructure (at startup)                           │   ║
║   │   └── PM2-Resurrect (at startup)                                   │   ║
║   │                                                                     │   ║
║   │   MCP Servers (23): Excalidraw, Hugging Face, Vercel, Zapier,     │   ║
║   │   Puppeteer, GitHub, PostgreSQL, Bright Data, OpenAI Images,       │   ║
║   │   Fetch, Memory, Sequential Thinking, Context7, DBHub, DuckDB,    │   ║
║   │   SQLite, dbt, Zaturn, Fermat, Vizro, Optuna, NetworkX, Jupyter   │   ║
║   │                                                                     │   ║
║   │   Cost: £0 (owned hardware, home electricity only)                 │   ║
║   │                                                                     │   ║
║   ├─────────────────────────────────────────────────────────────────────┤   ║
║   │                                                                     │   ║
║   │   NODE C: ORACLE CLOUD — DATABASE NODE (Always Free)               │   ║
║   │   ─────────────────────────────────────────────                    │   ║
║   │   Instance: navada-oracle | Region: uk-london-1                    │   ║
║   │   Public IP: 132.145.46.184 | Private IP: 10.0.0.240              │   ║
║   │   Shape: VM.Standard.E5.Flex (1 OCPU, 12GB RAM, Always Free)      │   ║
║   │   OS: Ubuntu 24.04 | SSH: oracle-navada (ED25519)                  │   ║
║   │                                                                     │   ║
║   │   Stack:                                                            │   ║
║   │   ├── Oracle XE 21c (Docker: gvenzl/oracle-xe:21-slim)            │   ║
║   │   │   ├── CDB: XE                                                  │   ║
║   │   │   ├── PDB: XEPDB1 (app data)                                  │   ║
║   │   │   ├── Port: 1521                                               │   ║
║   │   │   └── Volume: oracle-data (persistent)                         │   ║
║   │   └── SSH tunnel access from laptop                                │   ║
║   │                                                                     │   ║
║   │   Planned:                                                          │   ║
║   │   • Join Tailscale mesh (encrypted inter-node comms)               │   ║
║   │   • Overflow compute (video rendering, batch jobs)                 │   ║
║   │   • Secondary MCP server host                                      │   ║
║   │   • Geo-redundancy (London DC, separate from home)                 │   ║
║   │                                                                     │   ║
║   │   Cost: £0 (Oracle Always Free tier, permanent)                    │   ║
║   │                                                                     │   ║
║   └─────────────────────────────────────────────────────────────────────┘   ║
║                               │                                              ║
╠═══════════════════════════════╪══════════════════════════════════════════════╣
║                               │                                              ║
║   LAYER 4: NGINX GATEWAY (Docker Container on Node B)                       ║
║                                                                              ║
║   ┌──────────────────────────────────────────────────────────────────┐       ║
║   │  Container: navada-proxy (nginx:alpine)                          │       ║
║   │  Accepts ONLY: Tunnel (172.x) + Tailscale (100.x)               │       ║
║   │                                                                   │       ║
║   │  Security:                                                        │       ║
║   │  • X-Frame-Options: DENY                                         │       ║
║   │  • Content-Security-Policy: strict                                │       ║
║   │  • HSTS + XSS-Protection                                         │       ║
║   │  • Rate Limit: 10 req/s, burst 20 per IP                        │       ║
║   │  • Body Limit: 50MB max                                          │       ║
║   │  • IP Allowlist: Cloudflare ranges + Tailscale 100.64.0.0/10    │       ║
║   │                                                                   │       ║
║   │  Port 80 (Subdomain routing via Tunnel):                         │       ║
║   │  ┌────────────────────────┬────────────────────────────┐         │       ║
║   │  │ api.navada-*           │ → telegram-bot :3456       │         │       ║
║   │  │ api.navada-*/twilio/*  │ → telegram-bot :3456       │         │       ║
║   │  │ logo.navada-*          │ → logo service :3000       │         │       ║
║   │  │ network.navada-*       │ → network-scanner :7777    │         │       ║
║   │  │ canvas.navada-*        │ → excalidraw :3001         │         │       ║
║   │  └────────────────────────┴────────────────────────────┘         │       ║
║   │                                                                   │       ║
║   │  Port 8080 (Path routing via Tailscale/LAN):                     │       ║
║   │  ┌────────────────────────┬────────────────────────────┐         │       ║
║   │  │ /kibana/               │ → Kibana :5601             │         │       ║
║   │  │ /grafana/              │ → Grafana :9090            │         │       ║
║   │  │ /prometheus/           │ → Prometheus :9091         │         │       ║
║   │  │ /portainer/            │ → Portainer :9000          │         │       ║
║   │  │ /uptime/               │ → Uptime Kuma :3002        │         │       ║
║   │  │ /canvas/               │ → Excalidraw :3001         │         │       ║
║   │  │ /network/              │ → Network Scanner :7777    │         │       ║
║   │  │ /jupyter/              │ → Jupyter :8888            │         │       ║
║   │  │ /mlflow/               │ → MLflow :5000             │         │       ║
║   │  └────────────────────────┴────────────────────────────┘         │       ║
║   └──────────────────────────────────────────────────────────────────┘       ║
║                               │                                              ║
╠═══════════════════════════════╪══════════════════════════════════════════════╣
║                               │                                              ║
║   LAYER 5: APPLICATION SERVICES (All bind 127.0.0.1)                        ║
║                                                                              ║
║   ┌─────────────────────────────────────────────────────────────────────┐   ║
║   │                                                                     │   ║
║   │   CORE PRODUCTS                                                     │   ║
║   │   ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐  │   ║
║   │   │ Telegram Bot      │  │ NAVADA Flix       │  │ WorldMonitor   │  │   ║
║   │   │ :3456             │  │ :4000             │  │ :4173 + :46123 │  │   ║
║   │   │ Claude CoS        │  │ HLS streaming     │  │ 52+ OSINT      │  │   ║
║   │   │ 48+ commands      │  │ Remotion render   │  │ panels         │  │   ║
║   │   │ Twilio webhook    │  │ FFmpeg transcode   │  │ Real-time data │  │   ║
║   │   │ SMS/Call/WhatsApp │  │ sql.js database    │  │ 15+ API feeds  │  │   ║
║   │   │ Email (Zoho)      │  │ Clerk auth (plan) │  │ Military/Econ  │  │   ║
║   │   │ LinkedIn publish  │  │ R2 upload         │  │ Climate/Crypto │  │   ║
║   │   │ Image gen (DALL-E │  └──────────────────┘  └────────────────┘  │   ║
║   │   │ + Flux)           │                                             │   ║
║   │   │ Cost tracking     │  ┌──────────────────┐  ┌────────────────┐  │   ║
║   │   │ Semantic cache    │  │ Trading Lab       │  │ Network Scan   │  │   ║
║   │   │ RAG (ChromaDB)    │  │ :5678             │  │ :7777          │  │   ║
║   │   └──────────────────┘  │ FastAPI/Uvicorn    │  │ Router dash    │  │   ║
║   │                          │ Alpaca paper trade │  │ Device scan    │  │   ║
║   │   ┌──────────────────┐  │ MA+RSI strategy   │  └────────────────┘  │   ║
║   │   │ Voice Command     │  │ Risk controls     │                      │   ║
║   │   │ :7778             │  │ Email reports     │  ┌────────────────┐  │   ║
║   │   │ S8 Bluetooth      │  └──────────────────┘  │ Logo Service   │  │   ║
║   │   │ Wake words        │                         │ :3000          │  │   ║
║   │   └──────────────────┘                          └────────────────┘  │   ║
║   │                                                                     │   ║
║   │   BACKGROUND WORKERS (No port)                                      │   ║
║   │   ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐  │   ║
║   │   │ inbox-responder   │  │ auto-deploy       │  │ trading-sched  │  │   ║
║   │   │ Email auto-reply  │  │ Git poll 2min     │  │ Cron triggers  │  │   ║
║   │   │ + approval queue  │  │ + rebuild         │  │ Pre/Execute/   │  │   ║
║   │   └──────────────────┘  └──────────────────┘  │ Report/Close   │  │   ║
║   │                                                 └────────────────┘  │   ║
║   │   ┌──────────────────┐                                              │   ║
║   │   │ notebooklm-watch │                                              │   ║
║   │   │ Auto-upload to R2│                                              │   ║
║   │   └──────────────────┘                                              │   ║
║   │                                                                     │   ║
║   └─────────────────────────────────────────────────────────────────────┘   ║
║                               │                                              ║
╠═══════════════════════════════╪══════════════════════════════════════════════╣
║                               │                                              ║
║   LAYER 6: DATA + MEMORY (Hybrid Local/Cloud)                               ║
║                                                                              ║
║   ┌─────────────────────────────────────────────────────────────────────┐   ║
║   │                                                                     │   ║
║   │   LOCAL DATABASES (Node B — HP Laptop)                              │   ║
║   │   ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐  │   ║
║   │   │ PostgreSQL        │  │ SQLite            │  │ Elasticsearch  │  │   ║
║   │   │ :5433 (127.0.0.1)│  │ pipeline.db       │  │ :9200 (Docker) │  │   ║
║   │   │ navada_pipeline   │  │ flix.db           │  │ navada-elk     │  │   ║
║   │   │ Prospect tables:  │  │ Local CRM +      │  │ 1GB heap       │  │   ║
║   │   │ companies,        │  │ video metadata    │  │ Indices:       │  │   ║
║   │   │ contacts, emails, │  └──────────────────┘  │ telegram-*     │  │   ║
║   │   │ audit, notes      │                         │ automation-*   │  │   ║
║   │   └──────────────────┘                          │ pm2-*          │  │   ║
║   │                                                  └────────────────┘  │   ║
║   │   CLOUD DATABASES                                                    │   ║
║   │   ┌──────────────────┐  ┌──────────────────┐                        │   ║
║   │   │ Oracle XE 21c     │  │ ChromaDB Cloud    │                        │   ║
║   │   │ Node C (:1521)    │  │ (Managed SaaS)    │                        │   ║
║   │   │ PDB: XEPDB1       │  │ DB: NAVADA        │                        │   ║
║   │   │ Enterprise data   │  │ navada-edge (RAG) │                        │   ║
║   │   │ SSH tunnel access │  │ response-cache    │                        │   ║
║   │   └──────────────────┘  │ BGE 768-dim embed │                        │   ║
║   │                          └──────────────────┘                         │   ║
║   │                                                                     │   ║
║   │   CACHING                                                            │   ║
║   │   ┌──────────────────────────────────────────────────────────┐      │   ║
║   │   │ Tier 1: In-memory LRU (50 entries, 30 min TTL)           │      │   ║
║   │   │ Tier 2: ChromaDB semantic cache (0.12 threshold, 24hr)   │      │   ║
║   │   │ Tier 3: Cloudflare Worker edge cache (.ts=86400s)        │      │   ║
║   │   └──────────────────────────────────────────────────────────┘      │   ║
║   │                                                                     │   ║
║   │   FILE STORAGE                                                       │   ║
║   │   ┌──────────────────┐  ┌──────────────────┐                        │   ║
║   │   │ Local Disk        │  │ Cloudflare R2     │                        │   ║
║   │   │ Reports, logs,    │  │ navada-assets     │                        │   ║
║   │   │ screenshots,      │  │ Media, podcasts,  │                        │   ║
║   │   │ uploads, datasets │  │ NotebookLM files  │                        │   ║
║   │   └──────────────────┘  │ S3-compatible API │                        │   ║
║   │                          │ Zero egress cost  │                        │   ║
║   │                          └──────────────────┘                         │   ║
║   └─────────────────────────────────────────────────────────────────────┘   ║
║                               │                                              ║
╠═══════════════════════════════╪══════════════════════════════════════════════╣
║                               │                                              ║
║   LAYER 7: AI + MODEL LAYER (Hybrid Local/Cloud)                            ║
║                                                                              ║
║   ┌─────────────────────────────────────────────────────────────────────┐   ║
║   │                                                                     │   ║
║   │   PRIMARY (Cloud APIs)                                              │   ║
║   │   ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐  │   ║
║   │   │ Anthropic Claude  │  │ OpenAI            │  │ Cloudflare     │  │   ║
║   │   │ ★ EXCLUSIVE for   │  │ DALL-E 3 (images) │  │ Workers AI     │  │   ║
║   │   │   NAVADA Edge     │  │ TTS HD (voice)    │  │ Flux (FREE     │  │   ║
║   │   │ Sonnet 4 (fast)   │  │ GPT (fallback)    │  │ image gen)     │  │   ║
║   │   │ Opus 4 (powerful) │  └──────────────────┘  │ BGE embeddings │  │   ║
║   │   │ Claude Code (Max) │                         │ (FREE, 768-dim)│  │   ║
║   │   └──────────────────┘  ┌──────────────────┐  └────────────────┘  │   ║
║   │                          │ Other Cloud LLMs  │                      │   ║
║   │   ┌──────────────────┐  │ Groq (WM summaries│                      │   ║
║   │   │ AWS (Available)   │  │  14.4K req/day)  │                      │   ║
║   │   │ Amazon Bedrock    │  │ xAI Grok         │                      │   ║
║   │   │ Amazon SageMaker  │  │ Mistral          │                      │   ║
║   │   │ (train/fine-tune) │  │ Gemini           │                      │   ║
║   │   └──────────────────┘  └──────────────────┘                       │   ║
║   │                                                                     │   ║
║   │   LOCAL (Planned)                                                    │   ║
║   │   ┌──────────────────────────────────────────────────────────┐      │   ║
║   │   │ Ollama: Qwen / DeepSeek / Llama — fast + private        │      │   ║
║   │   │ Runs on Node B (laptop) or Node C (Oracle, 12GB RAM)    │      │   ║
║   │   └──────────────────────────────────────────────────────────┘      │   ║
║   │                                                                     │   ║
║   └─────────────────────────────────────────────────────────────────────┘   ║
║                               │                                              ║
╠═══════════════════════════════╪══════════════════════════════════════════════╣
║                               │                                              ║
║   LAYER 8: COMMS + OUTBOUND (Egress Only — HTTPS)                           ║
║                                                                              ║
║   ┌─────────────────────────────────────────────────────────────────────┐   ║
║   │                                                                     │   ║
║   │   MESSAGING                      PUBLISHING                        │   ║
║   │   ┌──────────────────┐          ┌──────────────────┐               │   ║
║   │   │ Telegram Bot API │          │ LinkedIn API     │               │   ║
║   │   │ Twilio SMS/Voice │          │ (token exp 27/4) │               │   ║
║   │   │ +447446994961    │          └──────────────────┘               │   ║
║   │   │ WhatsApp (sandbox│                                              │   ║
║   │   │ Meta approval    │          DEPLOYMENT                          │   ║
║   │   │ pending)         │          ┌──────────────────┐               │   ║
║   │   └──────────────────┘          │ Vercel           │               │   ║
║   │                                  │ GitHub           │               │   ║
║   │   EMAIL                          └──────────────────┘               │   ║
║   │   ┌──────────────────┐                                              │   ║
║   │   │ Zoho SMTP/IMAP   │          DATA PROVIDERS                      │   ║
║   │   │ claude.navada@   │          ┌──────────────────┐               │   ║
║   │   │ zohomail.eu      │          │ Hunter.io        │               │   ║
║   │   │ Gmail IMAP       │          │ Apify            │               │   ║
║   │   └──────────────────┘          │ Bright Data      │               │   ║
║   │                                  │ Alpaca Markets   │               │   ║
║   │   PUBLIC DATA FEEDS              │ Finnhub, FRED    │               │   ║
║   │   ┌──────────────────┐          │ EIA, NASA FIRMS  │               │   ║
║   │   │ GDELT, UCDP,     │          └──────────────────┘               │   ║
║   │   │ UNHCR, Open-Meteo│                                              │   ║
║   │   │ CoinGecko, USGS, │                                              │   ║
║   │   │ NASA EONET, GDACS│                                              │   ║
║   │   │ USASpending      │                                              │   ║
║   │   └──────────────────┘                                              │   ║
║   │                                                                     │   ║
║   └─────────────────────────────────────────────────────────────────────┘   ║
║                               │                                              ║
╠═══════════════════════════════╪══════════════════════════════════════════════╣
║                               │                                              ║
║   LAYER 9: SECURITY + SECRETS + OBSERVABILITY                               ║
║                                                                              ║
║   ┌─────────────────────────────────────────────────────────────────────┐   ║
║   │                                                                     │   ║
║   │   MONITORING              SECRETS                IDENTITY           │   ║
║   │   ┌────────────────┐     ┌────────────────┐     ┌──────────────┐  │   ║
║   │   │ Prometheus      │     │ .env files      │     │ Tailscale    │  │   ║
║   │   │ Grafana         │     │ (gitignored)    │     │ ACLs (device │  │   ║
║   │   │ Uptime Kuma     │     │ AWS IAM roles   │     │ identity)    │  │   ║
║   │   │ Portainer       │     │ OCI API keys    │     │              │  │   ║
║   │   │ Kibana + ELK    │     │ SSH keys        │     │ Cloudflare   │  │   ║
║   │   │ Filebeat (host) │     │ Never hardcode  │     │ Access (ZT)  │  │   ║
║   │   │ CloudWatch (AWS)│     │                  │     │ Email OTP    │  │   ║
║   │   └────────────────┘     └────────────────┘     │              │  │   ║
║   │                                                   │ Clerk (OAuth)│  │   ║
║   │   LOGGING                                        │ for Flix     │  │   ║
║   │   ┌────────────────────────────────────────┐    │              │  │   ║
║   │   │ telegram-interactions.jsonl             │    │ AWS IAM      │  │   ║
║   │   │ Automation/logs/* (task output)         │    │ (service     │  │   ║
║   │   │ Filebeat → ES → navada-telegram-*      │    │ permissions) │  │   ║
║   │   │ Filebeat → ES → navada-automation-*    │    │              │  │   ║
║   │   │ Filebeat → ES → navada-pm2-*           │    │ Twilio sig   │  │   ║
║   │   │ cost-tracker.js (API spend in GBP)     │    │ validation   │  │   ║
║   │   └────────────────────────────────────────┘    └──────────────┘  │   ║
║   │                                                                     │   ║
║   │   GUEST CONTROLS                                                    │   ║
║   │   ┌────────────────────────────────────────┐                        │   ║
║   │   │ Rate limit: 50 req/day, 20 req/hr      │                        │   ║
║   │   │ Budget cap: £2/day per guest            │                        │   ║
║   │   │ Restricted commands (no shell/email)    │                        │   ║
║   │   │ Isolated conversation memory per user   │                        │   ║
║   │   └────────────────────────────────────────┘                        │   ║
║   │                                                                     │   ║
║   └─────────────────────────────────────────────────────────────────────┘   ║
║                               │                                              ║
╠═══════════════════════════════╪══════════════════════════════════════════════╣
║                               │                                              ║
║   LAYER 10: CI/CD + DEPLOYMENT PIPELINE                                     ║
║                                                                              ║
║   ┌─────────────────────────────────────────────────────────────────────┐   ║
║   │                                                                     │   ║
║   │   SOURCE CONTROL          BUILD/DEPLOY            REGISTRY          │   ║
║   │   ┌────────────────┐     ┌────────────────┐     ┌──────────────┐  │   ║
║   │   │ GitHub          │     │ auto-deploy    │     │ AWS ECR      │  │   ║
║   │   │ Navada25 /      │     │ (PM2, polls    │     │ (available)  │  │   ║
║   │   │ leeakpareva     │     │ git every 2min)│     │              │  │   ║
║   │   │ 23 MCP repos    │     │                │     │ Cloudflare   │  │   ║
║   │   └────────────────┘     │ Vercel (apps)  │     │ R2 (assets)  │  │   ║
║   │                           │                │     └──────────────┘  │   ║
║   │   CLIENT DELIVERY         │ deliver-app.js │                        │   ║
║   │   ┌────────────────┐     │ (Next.js tmpl  │                        │   ║
║   │   │ Template:       │     │ + Vercel deploy│                        │   ║
║   │   │ nextjs-shadcn/  │     │ + email client)│                        │   ║
║   │   │                 │     └────────────────┘                        │   ║
║   │   │ AWS CodeBuild/  │                                               │   ║
║   │   │ CodePipeline    │                                               │   ║
║   │   │ (available)     │                                               │   ║
║   │   └────────────────┘                                                │   ║
║   │                                                                     │   ║
║   └─────────────────────────────────────────────────────────────────────┘   ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Component Registry

### Compute Nodes (3)

| Node | Location | Spec | IP (Tailscale) | IP (Public) | Role | Cost |
|------|----------|------|-----------------|-------------|------|------|
| **Node A** EC2 | AWS eu-west-2 | t3.micro (1vCPU/1GB/30GB) | 100.98.118.33 | 18.130.39.222 | Cloud gateway, DR, AWS mgmt | £0 (free tier) |
| **Node B** HP Laptop | Home (London) | i5/16GB/512GB | 100.121.187.67 | 192.168.0.58 (LAN) | Powerhouse, all services | £0 (owned) |
| **Node C** Oracle VM | OCI uk-london-1 | E5.Flex (1OCPU/12GB) | Planned | 132.145.46.184 | Database, overflow compute | £0 (Always Free) |

### PM2 Services (11 on Node B)

| Service | Port | Protocol | Description |
|---------|------|----------|-------------|
| telegram-bot | 3456 | HTTP | Claude Chief of Staff, Twilio webhook, 48+ commands |
| navada-flix | 4000 | HTTP | HLS video streaming, FFmpeg, sql.js |
| worldmonitor | 4173 | HTTP | OSINT dashboard frontend (52+ panels) |
| worldmonitor-api | 46123 | HTTP | OSINT API backend (15+ data feeds) |
| trading-api | 5678 | HTTP | FastAPI, Alpaca paper trading, MA+RSI strategy |
| network-scanner | 7777 | HTTP | Router dashboard, device scanning |
| voice-command | 7778 | HTTP | S8 Bluetooth voice control |
| inbox-responder | — | — | Email auto-reply + approval queue |
| auto-deploy | — | — | Git poll (2 min) + rebuild |
| trading-scheduler | — | — | Cron triggers for trading sessions |
| notebooklm-watcher | — | — | Auto-upload NotebookLM files to R2 |

### Docker Containers (8 on Node B)

| Container | Image | Port | Description |
|-----------|-------|------|-------------|
| navada-proxy | nginx:alpine | 80/443/8080 | Reverse proxy gateway |
| navada-tunnel | cloudflare/cloudflared | — | Cloudflare Tunnel (7c9e3c36) |
| navada-prometheus | prom/prometheus | 9091 | Metrics (30d retention) |
| navada-grafana | grafana/grafana | 9090 | Dashboards |
| navada-portainer | portainer/portainer-ce | 9000 | Container management |
| navada-uptime | louislam/uptime-kuma | 3002 | Uptime monitoring |
| navada-elasticsearch | elasticsearch:8.17.0 | 9200 | Log storage (1GB heap) |
| navada-kibana | kibana:8.17.0 | 5601 | Log search UI |

### Docker Containers (1 on Node C)

| Container | Image | Port | Description |
|-----------|-------|------|-------------|
| oracle-xe | gvenzl/oracle-xe:21-slim | 1521 | Oracle Database XE 21c |

### Databases (5)

| Database | Type | Location | Port | Purpose |
|----------|------|----------|------|---------|
| navada_pipeline | PostgreSQL | Node B (127.0.0.1) | 5433 | Prospect pipeline, CRM |
| pipeline.db | SQLite | Node B (file) | — | Lead pipeline |
| flix.db | SQLite (sql.js) | Node B (file) | — | Video metadata |
| XEPDB1 | Oracle XE 21c | Node C (Docker) | 1521 | Enterprise data |
| NAVADA | ChromaDB Cloud | Managed SaaS | HTTPS | RAG vectors, semantic cache |
| navada-elk | Elasticsearch | Node B (Docker) | 9200 | Logs (telegram, automation, PM2) |

### Scheduled Automations (18 on Node B)

| Task | Schedule | Script |
|------|----------|--------|
| Morning-Briefing | Daily 6:30 AM | Automation/morning-briefing.js |
| AI-News-Digest | Daily 7:00 AM | Automation/ai-news-mailer.js |
| Economy-Report | Mon 8:00 AM | Automation/uk-us-economy-report.py |
| NAVADA-LeadPipeline | Daily 8:30 AM | LeadPipeline/pipeline.js |
| Job-Hunter-Daily | Daily 9:00 AM | Automation/job-hunter-apify.js |
| NAVADA-ProspectPipeline | Daily 9:30 AM | LeadPipeline/prospect-pipeline.js |
| Self-Improve-Weekly | Mon 10:00 AM | Automation/self-improve.js |
| NAVADA-Trading-PreMarket | Mon-Fri 2:15 PM | NAVADA-Trading/scripts/run_premarket.py |
| NAVADA-Trading-Execute | Mon-Fri 3:45 PM | NAVADA-Trading/scripts/run_trading.py |
| Market-Intelligence | Daily 6:00 PM | Market analysis |
| Weekly-Report | Sun 6:00 PM | Automation/weekly-report.js |
| NAVADA-Trading-FridayClose | Fri 8:30 PM | NAVADA-Trading/scripts/close_all.py |
| Daily-Ops-Report | Daily 9:00 PM | Operations summary |
| NAVADA-Trading-Report | Daily 9:15 PM | NAVADA-Trading/scripts/run_report.py |
| Inbox-Monitor | Every 2hrs 8AM-10PM | Automation/inbox-monitor.js |
| VC-Response-Monitor | At startup | Automation/vc-response-monitor.js |
| NAVADA-Infrastructure | At startup | Infrastructure health check |
| PM2-Resurrect | At startup | pm2 resurrect |

### MCP Servers (23 on Node B)

| Server | Category |
|--------|----------|
| Excalidraw | Canvas/Diagrams |
| Hugging Face | AI/ML Models |
| Vercel | Deployment |
| Zapier | Automation |
| Puppeteer | Browser |
| GitHub | Source Control |
| PostgreSQL | Database |
| Bright Data | Web Scraping |
| OpenAI Images | Image Generation |
| Fetch | HTTP |
| Memory | Knowledge |
| Sequential Thinking | Reasoning |
| Context7 | Documentation |
| DBHub | Database |
| DuckDB | Analytics |
| SQLite | Database |
| dbt | Data Transform |
| Zaturn | Analytics |
| Fermat | Math |
| Vizro | Visualization |
| Optuna | ML Optimization |
| NetworkX | Graph Analysis |
| Jupyter | Notebooks |

### AWS Services (eu-west-2)

| Service | Resource | Purpose | Cost |
|---------|----------|---------|------|
| EC2 | i-0055e7ace24db38b0 (t3.micro) | Cloud gateway node | £0 (free tier) |
| Lambda | navada-mcp-handler | MCP tool calls | £0 (free tier) |
| Lambda | navada-api-gateway | API requests/webhooks | £0 (free tier) |
| API Gateway | xxqtcilmzi | REST API endpoint | £0 (free tier) |
| IAM | navada-lambda-role | Service permissions | £0 |
| EBS | 30GB gp3 | EC2 storage | £0 (free tier) |
| SageMaker | (available) | ML training/hosting | Pay per use |
| S3 | (available) | Object storage | Pay per use |
| ECR | (available) | Docker registry | Pay per use |
| CloudWatch | (available) | Monitoring/logs | Free tier |
| CodeBuild | (available) | CI/CD builds | Pay per use |

### Cloudflare Services

| Service | Resource | Purpose | Cost |
|---------|----------|---------|------|
| DNS | navada-edge-server.uk | Domain management | £0 |
| Tunnel | 7c9e3c36 | Encrypted tunnel to Nginx | £0 |
| Worker | navada-edge | Edge proxy/cache for Flix | £0 (100K req/day) |
| Workers AI | Flux Klein 4B | FREE image generation | £0 |
| Workers AI | BGE | FREE embeddings (768-dim) | £0 |
| R2 | navada-assets | Object storage (zero egress) | £0 (10GB free) |
| Stream | Video CDN | HLS delivery | $5/mo |
| Access | Zero Trust | Admin UI authentication | £0 |
| WAF | OWASP rules | Web application firewall | £0 |

### External API Integrations (28)

| Category | Service | Auth | Free Tier |
|----------|---------|------|-----------|
| **AI/ML** | Anthropic Claude | API key | Max plan (paid) |
| **AI/ML** | OpenAI (DALL-E 3, TTS) | API key | Pay per use |
| **AI/ML** | Cloudflare Workers AI | Account | FREE |
| **AI/ML** | Groq | API key | 14,400 req/day |
| **AI/ML** | xAI Grok | API key | Paid |
| **AI/ML** | Mistral | API key | Paid |
| **AI/ML** | Gemini | API key | Free tier |
| **Comms** | Telegram Bot API | Bot token | FREE |
| **Comms** | Twilio (SMS/Voice) | Account SID | Pay per use |
| **Comms** | Zoho SMTP/IMAP | App password | FREE |
| **Comms** | Gmail IMAP | OAuth | FREE |
| **Comms** | LinkedIn API | OAuth token | FREE |
| **Finance** | Alpaca (paper trading) | API key | FREE (IEX) |
| **Finance** | Finnhub | API key | 60 calls/min |
| **Finance** | FRED | API key | 120 req/min |
| **Finance** | EIA | API key | Unlimited |
| **Data** | Hunter.io | API key | 25 searches/mo |
| **Data** | Apify | API key | Free tier |
| **Data** | Bright Data (MCP) | API key | Pay per use |
| **Data** | ChromaDB Cloud | API key | $5 usage |
| **Public** | GDELT | None | Unlimited |
| **Public** | UCDP | None | Unlimited |
| **Public** | UNHCR | None | Unlimited |
| **Public** | Open-Meteo | None | Unlimited |
| **Public** | CoinGecko | None | Rate limited |
| **Public** | USGS | None | Unlimited |
| **Public** | NASA EONET/FIRMS | API key | FREE |
| **Public** | GDACS | None | Unlimited |

### Communication Channels (8)

| Channel | Direction | Interface | Auth |
|---------|-----------|-----------|------|
| **Telegram** | Bidirectional | Bot webhook via Cloudflare Tunnel (48+ commands) | Bot token + user registry |
| **SMS** | Bidirectional | Twilio +447446994961 | Signature validation |
| **Voice Calls** | Outbound | Twilio +447446994961 | Account SID |
| **WhatsApp** | Bidirectional | Twilio sandbox (pending Meta) | Session-based |
| **Email (Zoho)** | Bidirectional | SMTP/IMAP claude.navada@zohomail.eu | App password |
| **Email (Gmail)** | Inbound | IMAP leeakpareva@gmail.com | OAuth |
| **LinkedIn** | Outbound | API publish | OAuth (exp 27/4/26) |
| **Claude Code** | Bidirectional | Terminal SSH (laptop + EC2) | Max plan |

---

## Security Rules (Enforced)

| Rule | Description |
|------|-------------|
| **INBOUND** | Internet → Cloudflare WAF → Tunnel/Worker → Nginx → 127.0.0.1 |
| **ADMIN** | Lee iPhone → Tailscale (WireGuard) → Nginx :8080 → 127.0.0.1 |
| **OUTBOUND** | Services → HTTPS only → External APIs |
| **FIREWALL** | Windows blocks ALL inbound except Tailscale UDP |
| **DB ACCESS** | PostgreSQL + Elasticsearch = localhost/Docker internal ONLY |
| **WEBHOOKS** | Twilio signature validation on every inbound request |
| **GUESTS** | Rate limited (50/day, 20/hr) + budget capped (£2/day) |
| **LOGGING** | Every request → JSONL → Filebeat → Elasticsearch → Kibana |
| **SSH** | Key-only auth, no passwords. EC2: Tailscale-only (no public SSH) |
| **SECRETS** | .env files only, never hardcoded, all gitignored |
| **ENCRYPTION** | All inter-node traffic: WireGuard (ChaCha20-Poly1305) |
| **BINDING** | All services bind 127.0.0.1 (target state, some still 0.0.0.0) |

---

## Monthly Cost Summary

| Component | Monthly Cost |
|-----------|-------------|
| AWS EC2 (t3.micro) | £0 (free tier, 12 months) |
| AWS Lambda + API Gateway | £0 (free tier) |
| Oracle Cloud (E5.Flex) | £0 (Always Free, permanent) |
| Cloudflare (DNS/Tunnel/Worker/R2/WAF/Access) | £0 |
| Cloudflare Stream | ~£4 ($5) |
| Cloudflare Workers AI (Flux + BGE) | £0 |
| ChromaDB Cloud | £0 (free tier) |
| HP Laptop (electricity) | ~£5 |
| Anthropic Claude (Max plan) | ~£150 ($200) |
| Twilio (SMS/Voice) | ~£5 (usage-based) |
| OpenAI (DALL-E/TTS) | ~£5 (usage-based) |
| **TOTAL** | **~£169/month** |

---

## Implementation Backlog

| # | Task | Priority | Status |
|---|------|----------|--------|
| 1 | Bind services to 127.0.0.1 — N/A (Docker Nginx needs 0.0.0.0; firewall handles security) | HIGH | RESOLVED |
| 2 | Switch Telegram bot from polling to webhook via Tunnel | HIGH | DONE |
| 3 | Add Flix, Trading API routes to Nginx | HIGH | DONE |
| 4 | Set up Cloudflare Access policies for admin UIs | HIGH | PLANNED |
| 5 | Configure Windows Firewall (block all except Tailscale) | HIGH | DONE |
| 6 | Join Oracle VM to Tailscale mesh (100.77.206.9) | MEDIUM | DONE |
| 7 | Set up health monitor on EC2 (pings laptop + alerts) | MEDIUM | DONE |
| 8 | Clone NAVADA repo to EC2 | MEDIUM | DONE |
| 9 | Install Clerk auth on NAVADA Flix | MEDIUM | PLANNED |
| 10 | Set up local Ollama on laptop or Oracle VM | LOW | PLANNED |
| 11 | Add Vercel deployments to architecture | LOW | PLANNED |
| 12 | Evaluate AWS Bedrock / SageMaker for training | LOW | PLANNED |

---

*Document Version: 2.0 | Last Updated: 4 March 2026*
*Maintainer: Claude, Chief of Staff | Approved by: Lee Akpareva, Founder*
