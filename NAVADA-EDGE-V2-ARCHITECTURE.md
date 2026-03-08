# NAVADA Edge v2 — Full Architecture Plan
**Date**: 6 March 2026 | **Status**: Building | **Budget**: £1/day (~£30/month)

---

## Node Map (6 Nodes + Cloudflare Edge)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          TAILSCALE MESH (WireGuard encrypted)                │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │ HP (NAVADA)      │  │ ASUS (DEV)       │  │ iPhone           │             │
│  │ 100.121.187.67   │  │ 100.88.118.128   │  │ 100.68.251.111   │             │
│  │ BRAIN + JENKINS  │  │ COCKPIT          │  │ REMOTE           │             │
│  │ Win 11 Pro       │  │ Win 11 Home      │  │ iOS              │             │
│  │ LAN: 192.168.0.58│  │ LAN: 192.168.0.18│  │                  │             │
│  └────────┬─────────┘  └──────────────────┘  └──────────────────┘             │
│           │                                                                   │
│  ┌────────┴─────────┐  ┌─────────────────┐  ┌───────────────────────────────┐│
│  │ Oracle VM         │  │ AWS EC2          │  │ AWS MANAGED SERVICES          ││
│  │ 100.77.206.9      │  │ 100.98.118.33    │  │                               ││
│  │ FAILOVER #1       │  │ FAILOVER #2      │  │ Lambda (vision + routing)     ││
│  │ ELK + Oracle DB   │  │ FULL BOT         │  │ Rekognition (faces + objects) ││
│  │ MCP Servers       │  │ BEDROCK CLAUDE   │  │ SageMaker (YOLOv8)            ││
│  │ Ubuntu 24.04      │  │ MCP Servers      │  │ Bedrock (Claude 4.6)          ││
│  │ 1 OCPU, 12GB RAM  │  │ Jenkins Agent    │  │ DynamoDB (face DB + logs)     ││
│  │ Always Free       │  │ Ubuntu 24.04     │  │ S3 (images + models)          ││
│  └──────────────────┘  └─────────────────┘  │ CloudWatch (3 dashboards)     ││
│                                              │ X-Ray (request tracing)       ││
│  ┌──────────────────────────────────────────┘ API Gateway (traffic mgmt)    ││
│  │                                            ECR (Docker images)            ││
│  │  CLOUDFLARE (Edge Layer)                   └──────────────────────────────┘│
│  │  Workers (intelligent router)                                              │
│  │  R2 (object storage, zero egress)                                          │
│  │  DNS + Tunnel (navada-edge-server.uk)                                      │
│  │  Stream (video CDN)                                                        │
│  │  Flux (free image gen)                                                     │
│  │  WAF + DDoS protection                                                     │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ CHROMADB CLOUD (Shared Data Layer — accessible from ALL nodes)           │ │
│  │ Tenant: 4c0190f5-3e1f-43b0-a709-32e28c69ee13                           │ │
│  │                                                                          │ │
│  │ Collections:                                                             │ │
│  │ ├─ navada-edge         (462+ chunks, RAG knowledge base)                 │ │
│  │ ├─ navada-response-cache (semantic cache, 24hr TTL)                      │ │
│  │ ├─ navada-faces         (face embeddings for similarity search)          │ │
│  │ ├─ navada-scenes        (scene descriptions for image search)            │ │
│  │ ├─ navada-objects       (object detection history)                       │ │
│  │ └─ navada-logs          (cross-node activity log embeddings)             │ │
│  │                                                                          │ │
│  │ Embeddings: Cloudflare Workers AI BGE (free, 768-dim)                    │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Node Roles

| Node | IP (Tailscale) | Role | Services |
|------|---------------|------|----------|
| **HP (NAVADA)** | 100.121.187.67 | Brain + Jenkins Controller | PM2 (12 services), Docker, Nginx, Jenkins, Telegram bot (primary), 23 MCP servers, Task Scheduler (18 tasks) |
| **ASUS (DEV)** | 100.88.118.128 | Dev Workstation | Claude Code, VS Code, LM Studio, Ollama, PG 17 local |
| **Oracle VM** | 100.77.206.9 | Failover #1 + Data | Full telegram-bot, ELK stack, Oracle DB, CloudBeaver, MCP servers |
| **AWS EC2** | 100.98.118.33 | Failover #2 + Jenkins Agent | Full telegram-bot (Bedrock Claude), Jenkins agent, MCP servers, health monitor |
| **AWS Services** | (managed) | AI/ML Platform | Lambda, Rekognition, SageMaker, Bedrock, DynamoDB, S3, CloudWatch, X-Ray, API Gateway, ECR |
| **iPhone** | 100.68.251.111 | Mobile Client | Telegram, Tailscale |
| **Cloudflare** | (edge) | Router + CDN | Workers, R2, DNS, Tunnel, Stream, Flux, WAF |
| **ChromaDB Cloud** | (managed) | Shared Data Layer | RAG, semantic cache, face embeddings, scene search, cross-node logs |

---

## Failover Architecture (24/7 Telegram Bot)

All failover nodes run the FULL telegram-bot.js with ALL 49+ commands and tools.

```
PRIORITY 1: HP (NAVADA) — Primary
  ├─ Anthropic API direct (claude-sonnet-4-6 / claude-opus-4-6)
  ├─ All 49+ commands, all tools
  ├─ 23 MCP servers
  ├─ ChromaDB RAG + semantic cache
  ├─ Full PM2 ecosystem
  └─ Jenkins controller

PRIORITY 2: EC2 (AWS) — Failover #2 (NEW)
  ├─ AWS Bedrock Claude (anthropic.claude-sonnet-4-6 / anthropic.claude-opus-4-6)
  ├─ All 49+ commands, all tools
  ├─ MCP servers (subset, cloud-compatible)
  ├─ ChromaDB RAG + semantic cache (same cloud instance)
  ├─ Jenkins agent
  └─ IAM role auth (no API key needed)

PRIORITY 3: Oracle VM — Failover #1 (existing)
  ├─ Anthropic API (key synced from HP)
  ├─ All 49+ commands, all tools
  ├─ MCP servers (subset)
  ├─ ChromaDB RAG + semantic cache (same cloud instance)
  └─ ELK stack for log aggregation

DETECTION:
  EC2 health monitor pings HP every 5 min
  3 consecutive failures (15 min) = auto-failover
  EC2 activates itself as failover OR triggers Oracle

  New: EC2 can self-activate (no SSH to Oracle needed)
  Cloudflare DNS switches api.navada-edge-server.uk → active node tunnel

FAILBACK:
  EC2 detects HP recovery → DNS restore → state sync → failover node stops
```

---

## ChromaDB Data Architecture (Cross-Node)

ChromaDB Cloud is the shared data layer. All nodes read/write to the same tenant.

```
┌─────────────────────────────────────────────────────────────┐
│                    CHROMADB CLOUD                             │
│                                                              │
│  ┌─────────────────┐  ┌──────────────────┐                  │
│  │ navada-edge       │  │ navada-response-  │                │
│  │ (RAG KB)          │  │ cache             │                │
│  │ 462+ chunks       │  │ (semantic cache)  │                │
│  │                   │  │                   │                │
│  │ Used by: ALL nodes│  │ Used by: ALL nodes│                │
│  └─────────────────┘  └──────────────────┘                  │
│                                                              │
│  ┌─────────────────┐  ┌──────────────────┐                  │
│  │ navada-faces      │  │ navada-scenes     │                │
│  │ (face embeddings) │  │ (scene vectors)   │                │
│  │                   │  │                   │                │
│  │ Fed by: Lambda    │  │ Fed by: Lambda    │                │
│  │ Queried by: ALL   │  │ Queried by: ALL   │                │
│  └─────────────────┘  └──────────────────┘                  │
│                                                              │
│  ┌─────────────────┐  ┌──────────────────┐                  │
│  │ navada-objects    │  │ navada-logs       │                │
│  │ (detection hist)  │  │ (cross-node logs) │                │
│  │                   │  │                   │                │
│  │ Fed by: Lambda    │  │ Fed by: ALL nodes │                │
│  │ Queried by: ALL   │  │ Queried by: ALL   │                │
│  └─────────────────┘  └──────────────────┘                  │
└──────────────────────────────────────────────────────────────┘

Logging flow:
  HP → telegram interaction → ChromaDB navada-logs
  EC2 → health check result → ChromaDB navada-logs
  Lambda → vision result → ChromaDB navada-objects + navada-scenes
  Oracle → ELK indices → also → ChromaDB navada-logs
  All nodes → semantic cache lookups → ChromaDB navada-response-cache
  All nodes → RAG context injection → ChromaDB navada-edge
```

---

## MCP Servers (Distributed)

MCP servers can be hosted on any node and accessed via Tailscale.

| MCP Server | HP | EC2 | Oracle | Cloud |
|------------|----|----|--------|-------|
| PostgreSQL | Yes (port 5433) | - | - | - |
| GitHub | Yes | Yes | - | - |
| Puppeteer | Yes | Yes | - | - |
| Memory | Yes | Yes | Yes | - |
| SQLite | Yes | Yes | - | - |
| DuckDB | Yes | Yes | - | - |
| Context7 | Yes | Yes | Yes | Managed |
| Bright Data | Yes | Yes | - | Managed |
| OpenAI Images | Yes | Yes | Yes | - |
| Hugging Face | Yes | Yes | Yes | Managed |
| Sequential Thinking | Yes | Yes | Yes | - |
| Jupyter | Yes | - | - | - |
| Vizro | Yes | - | - | - |
| Optuna | Yes | - | - | - |
| Excalidraw | Yes | - | - | - |
| **NEW: AWS Bedrock** | - | Yes | - | Managed |
| **NEW: AWS Vision** | - | Yes | - | Managed |
| **NEW: DynamoDB** | - | Yes | - | Managed |

EC2 MCP servers accessible from HP via Tailscale (100.98.118.33:port).
HP MCP servers accessible from EC2 via Tailscale (100.121.187.67:port).

---

## Jenkins CI/CD

### Setup
- **Runs on**: HP (Docker container, port 8082)
- **Remote agent**: EC2 (via Tailscale SSH)
- **Dashboard**: http://192.168.0.58:8082 (LAN) / jenkins.navada-edge-server.uk (public)
- **Added to Nginx**: reverse proxy + Cloudflare subdomain

### Pipelines

| Pipeline | Trigger | Agent | Steps |
|----------|---------|-------|-------|
| `deploy-telegram-bot` | Git push / manual | HP | Git pull → npm install → PM2 restart → health check → Telegram notify |
| `deploy-failover` | Manual / schedule | EC2 | SCP from HP → npm install → verify Bedrock → verify ChromaDB → test bot |
| `deploy-lambda` | Git push | HP | Package → AWS CLI deploy → verify → CloudWatch check |
| `deploy-yolo-model` | Manual | HP | Docker build → ECR push → SageMaker update endpoint → test inference |
| `vision-batch` | Schedule (daily) | EC2 | Process queued images → YOLO + Rekognition → DynamoDB → ChromaDB |
| `run-tests` | PR / push | HP | Lint → unit tests → security scan → report |
| `sync-all-nodes` | Schedule (6hr) | HP | Verify HP → EC2 → Oracle sync state → report gaps → auto-fix |
| `health-check` | Schedule (5 min) | EC2 | Ping all nodes → CloudWatch metric → alert on failure |
| `backup-chromadb` | Schedule (weekly) | HP | Export ChromaDB collections → S3 → verify |

### Jenkins Dashboard Widgets
- Build history (pass/fail/duration)
- Pipeline status (all 9 pipelines)
- Node health (HP, EC2, Oracle)
- Last deployment timestamp per service
- CloudWatch embedded metrics

---

## Vision AI Pipeline

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────────┐
│ Image Input   │     │ API Gateway   │     │ Lambda: navada-      │
│               │────▸│ POST          │────▸│ vision-router        │
│ Sources:      │     │ /vision/*     │     │                      │
│ - Telegram    │     │               │     │ Routes to:           │
│ - Webhook     │     │ X-Ray traced  │     │ - detect (objects)   │
│ - S3 upload   │     │ CloudWatch    │     │ - faces (index/search│
│ - Jenkins     │     │ logged        │     │ - analyse (Claude)   │
└──────────────┘     └──────────────┘     └───────┬──────────────┘
                                                   │
                                    ┌──────────────┼──────────────┐
                                    │              │              │
                              ┌─────┴──────┐ ┌────┴────┐ ┌──────┴──────┐
                              │ Rekognition │ │SageMaker│ │ Bedrock     │
                              │             │ │(YOLOv8) │ │ (Claude)    │
                              │ DetectFaces │ │         │ │             │
                              │ DetectLabels│ │ Custom  │ │ Describe    │
                              │ IndexFaces  │ │ object  │ │ scene,      │
                              │ SearchFaces │ │ detect  │ │ correlate   │
                              │ Celebrities │ │         │ │ faces,      │
                              └──────┬──────┘ └────┬───┘ │ generate    │
                                     │             │     │ report      │
                                     └──────┬──────┘     └──────┬─────┘
                                            │                   │
                              ┌─────────────┴───────────────────┴──────┐
                              │         Lambda: navada-vision-merge      │
                              └─────────────────┬──────────────────────┘
                                                │
                         ┌──────────────────────┼──────────────────────┐
                         │                      │                      │
                    ┌────┴─────┐          ┌─────┴──────┐         ┌────┴──────┐
                    │ DynamoDB  │          │ S3          │         │ ChromaDB  │
                    │           │          │             │         │           │
                    │ navada-   │          │ navada-     │         │ navada-   │
                    │ faces     │          │ vision-     │         │ faces     │
                    │ (metadata)│          │ eu-west-2   │         │ navada-   │
                    │           │          │ (images +   │         │ scenes    │
                    │ navada-   │          │  crops)     │         │ navada-   │
                    │ vision-log│          │             │         │ objects   │
                    │ (history) │          │             │         │ (vectors) │
                    └───────────┘          └─────────────┘         └───────────┘
                                                │
                                          ┌─────┴──────┐
                                          │ HP (notify) │
                                          │ Telegram    │
                                          │ ELK log     │
                                          └─────────────┘
```

---

## Traffic Routing (Cloudflare Workers)

```
navada-edge-server.uk (all traffic enters here)
│
├─ api.navada-edge-server.uk
│  ├─ /telegram/*  → HP tunnel (primary) or EC2 tunnel (failover)
│  ├─ /twilio/*    → HP tunnel (primary) or EC2 tunnel (failover)
│  ├─ /vision/*    → AWS API Gateway (always)
│  ├─ /ml/*        → AWS SageMaker (always)
│  ├─ /mcp/*       → AWS Lambda or HP (load balanced)
│  └─ /edge/*      → Cloudflare Worker (edge compute)
│
├─ jenkins.navada-edge-server.uk → HP:8082
├─ flix.navada-edge-server.uk    → HP:4000
├─ trading.navada-edge-server.uk → HP:5678
├─ kibana.navada-edge-server.uk  → Oracle:5601
├─ network.navada-edge-server.uk → HP:7777
└─ cloudbeaver.navada-edge-server.uk → Oracle:8978
```

---

## CloudWatch Dashboards (3 free)

### Dashboard 1: NAVADA Operations
- HP health (up/down, latency from EC2 ping)
- EC2 health (CPU, memory, disk)
- Lambda invocations + errors + duration
- API Gateway requests/sec + 4xx/5xx
- Failover status (which node is primary)
- Daily cost accumulator (£)
- Bedrock token usage

### Dashboard 2: Vision AI
- Images processed (hourly/daily)
- Faces indexed (total + new today)
- YOLO detections by class (bar chart)
- Rekognition confidence distribution
- SageMaker endpoint status + latency
- Top 10 detected objects (leaderboard)
- ChromaDB collection sizes

### Dashboard 3: Jenkins + Traffic
- Pipeline build history (sparkline per pipeline)
- Last deploy per service (timestamp)
- Requests by route (stacked area)
- HP vs AWS traffic split (%)
- Geographic request distribution (if CloudFront)
- Error rate by service
- Node sync status

---

## Cost Breakdown (daily at £1 budget)

| Service | Daily | Monthly | Notes |
|---------|-------|---------|-------|
| EC2 t3.micro | £0.20 | £6.00 | Always-on (failover + Jenkins agent) |
| Rekognition | £0.25 | £7.50 | ~300 images/day |
| SageMaker Serverless | £0.10 | £3.00 | YOLO, scales to zero |
| Bedrock | £0.05 | £1.50 | Failover only (normally £0) |
| Lambda | £0.00 | £0.00 | Free tier |
| DynamoDB | £0.00 | £0.00 | Free tier (PAY_PER_REQUEST) |
| S3 | £0.01 | £0.30 | Images + models |
| CloudWatch | £0.00 | £0.00 | 3 free dashboards |
| X-Ray | £0.00 | £0.00 | Free tier (100K traces) |
| API Gateway | £0.00 | £0.00 | Free tier |
| ECR | £0.01 | £0.30 | Docker images |
| Jenkins | £0.00 | £0.00 | Runs on HP (Docker) |
| ChromaDB Cloud | £0.00 | £0.00 | Free tier |
| Cloudflare | £0.00 | £0.00 | Free plan |
| **TOTAL** | **~£0.62** | **~£18.60** | Under budget |

---

## Build Phases

### Phase 1: AWS AI Services (NOW)
- [x] Enable Bedrock (Claude working)
- [x] Create Rekognition collection (navada-faces)
- [x] Create DynamoDB tables (navada-faces, navada-vision-log)
- [x] Create S3 bucket (navada-vision-eu-west-2)
- [x] IAM role for Lambda (Rekognition, Bedrock, DynamoDB, S3, SageMaker, X-Ray)
- [x] IAM role for EC2 (Bedrock, CloudWatch, DynamoDB, S3)
- [ ] Deploy vision Lambda functions
- [ ] Wire API Gateway routes

### Phase 2: YOLO on SageMaker
- [ ] Build YOLOv8 Docker image
- [ ] Push to ECR
- [ ] Create SageMaker Serverless endpoint
- [ ] Wire into vision Lambda pipeline

### Phase 3: Jenkins CI/CD
- [ ] Install Jenkins on HP (Docker)
- [ ] Configure EC2 as remote agent (Tailscale SSH)
- [ ] Add to Nginx + Cloudflare subdomain
- [ ] Create 9 pipelines
- [ ] Dashboard widgets

### Phase 4: EC2 Full Failover
- [ ] Deploy full telegram-bot.js to EC2
- [ ] Bedrock adapter (swap Anthropic SDK for Bedrock SDK)
- [ ] Deploy MCP servers on EC2
- [ ] ChromaDB connection (same cloud tenant)
- [ ] Update health monitor for self-activation
- [ ] Test full failover cycle

### Phase 5: ChromaDB Expansion
- [ ] Create new collections (faces, scenes, objects, logs)
- [ ] Cross-node logging middleware
- [ ] Embedding pipeline for vision results
- [ ] Semantic search across all collections

### Phase 6: Dashboards + Traffic
- [ ] Create 3 CloudWatch dashboards
- [ ] Enable X-Ray on Lambda + API Gateway
- [ ] Update Cloudflare Worker as intelligent router
- [ ] Add /vision, /face, /jenkins commands to Telegram bot

### Phase 7: MCP Server Distribution
- [ ] Deploy cloud-compatible MCP servers on EC2
- [ ] Configure cross-node MCP access via Tailscale
- [ ] Add AWS-native MCP servers (Bedrock, DynamoDB, Vision)
- [ ] Update CLAUDE.md with distributed MCP map

---

## Telegram Commands (New)

| Command | Description |
|---------|-------------|
| `/vision <image>` | Detect objects + faces in uploaded image |
| `/face index <name>` | Index a face with a name |
| `/face search` | Search for a face in the database |
| `/face list` | List all indexed faces |
| `/yolo <image>` | Run YOLOv8 detection |
| `/jenkins` | Jenkins dashboard status |
| `/jenkins build <pipeline>` | Trigger a Jenkins build |
| `/jenkins logs <pipeline>` | View build logs |
| `/dashboard` | Links to CloudWatch dashboards |
| `/nodes` | Status of all 6 nodes |
| `/traffic` | Traffic stats (requests/routes/split) |
| `/mcp` | List MCP servers across all nodes |
