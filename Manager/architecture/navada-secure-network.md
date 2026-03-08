# NAVADA Edge — Secure Network Architecture (Target)

**Status**: PLANNED — Not yet implemented
**Created**: 2026-03-04
**Priority**: High — multiple services currently bypass security layers

## Current Gaps
- Telegram bot polls directly (bypasses Cloudflare/Nginx)
- NAVADA Flix binds 0.0.0.0:4000 (exposed on network)
- Trading API binds 0.0.0.0:5678 (exposed on network)
- Network Scanner binds 0.0.0.0:7777 (exposed on network)
- Twilio webhook binds 0.0.0.0:3456 (exposed on network)
- Only Twilio inbound from internet goes through full Cloudflare > Tunnel > Nginx chain

## Target: All Traffic Through Security Layers

```
LAYER 1: CLIENTS (Untrusted)
  Lee iPhone, Guests (Telegram), Web Users (Flix), SMS/WhatsApp (Twilio)
      |                |               |                  |
      | Tailscale      | HTTPS         | HTTPS            | HTTPS
      | (WireGuard)    |               |                  |
------+----------------+---------------+------------------+----------

LAYER 2: CLOUDFLARE EDGE (Global CDN/Security)
  - WAF + DDoS (OWASP rules)
  - Bot Protection + Challenge pages
  - Geo-blocking + Rate limiting
  - Cloudflare Worker (navada-edge): cache + proxy
    - flix.navada-edge-server.uk > cache + proxy to Tailscale
    - api.navada-edge-server.uk/edge/* > serverless endpoints
    - Edge cache: .ts=86400s, .m3u8=no-cache, videos=60s
  - Cloudflare Tunnel (7c9e3c36, encrypted)
    - api.navada-edge-server.uk > Nginx
    - logo.navada-edge-server.uk > Nginx
    - network.navada-edge-server.uk > Nginx
  - Cloudflare Access (Zero Trust)
    - Kibana, Grafana, Portainer > email OTP auth
    - Flix > Clerk (Google OAuth)
--------------------------------------------------------------

LAYER 3: TAILSCALE MESH (WireGuard Encrypted)
  100.68.251.111 (iPhone) <-> 100.121.187.67 (NAVADA Server)
  ACL: only Lee's devices can reach server
  All traffic: WireGuard (ChaCha20-Poly1305)
--------------------------------------------------------------

LAYER 4: NGINX GATEWAY (Single Entry - Docker)
  Container: navada-proxy (Alpine)
  Accepts ONLY: Tunnel (172.x) + Tailscale (100.x)
  - Security Headers: X-Frame-Options, CSP, HSTS, XSS-Protection
  - Rate Limit: 10r/s burst 20 per IP
  - Body Limit: 50MB max
  - IP Allowlist: Cloudflare IPs + Tailscale 100.64.0.0/10

  :80 (subdomains via Tunnel)       :8080 (paths via Tailscale/LAN)
  /twilio/* > :3456                  /kibana/     > Kibana :5601
  logo.*    > :3000                  /grafana/    > Grafana :3000
  network.* > :7777                  /prometheus/ > Prometheus :9090
  canvas.*  > :3001                  /portainer/  > Portainer :9000
                                     /uptime/     > Uptime Kuma :3002
                                     /canvas/     > Excalidraw :3001
                                     /network/    > Scanner :7777
                                     /jupyter/    > Jupyter :8888
                                     /mlflow/     > MLflow :5000
--------------------------------------------------------------

LAYER 5: NAVADA EDGE SERVICES (localhost only)
  ALL services bind 127.0.0.1 — NO external exposure

  Core Services:
  - Telegram Bot (:3456) — Claude Chief of Staff, Twilio webhook, budget cap, signature validation
  - NAVADA Flix (:4000) — HLS streaming, Clerk auth, sql.js, FFmpeg transcode
  - Trading API (:5678) — FastAPI, Alpaca, portfolio
  - WorldMonitor (:4173) + API (:46123)
  - Logo (:3000), Network Scanner (:7777), Voice Command (:7778)

  Background Workers (no port):
  - inbox-responder, auto-deploy, trading-scheduler, notebooklm-watcher

  Databases:
  - PostgreSQL (:5433) — navada_pipeline, 127.0.0.1 only
  - Oracle Cloud DB — via SSH tunnel / OCI API (uk-london-1)
  - SQLite — pipeline.db, flix.db (local files)
  - ChromaDB Cloud — HTTPS API only
  - Elasticsearch (:9200) — Docker internal network only

  Monitoring (Docker):
  - Prometheus (:9091), Grafana (:9090), Uptime Kuma (:3002)
  - Kibana (:5601), Portainer (:9000), Filebeat (host agent)
--------------------------------------------------------------

LAYER 5b: ORACLE CLOUD (uk-london-1, Always Free / E5.Flex)
  Instance: navada-oracle (132.145.38.1)
  Shape: VM.Standard.E5.Flex (1 OCPU, 12GB RAM)
  OS: Ubuntu 24.04
  Access: SSH via oracle-navada key (ed25519)
  Tailscale: join same mesh for encrypted inter-server comms
  Use cases:
  - Oracle DB (FREEPDB1) for enterprise data
  - Overflow compute (video rendering, batch jobs)
  - Secondary MCP server host
  - Disaster recovery / geo-redundancy (London DC)
  Security:
  - SSH key auth only (no password)
  - OCI Security List: allow SSH (22) from Tailscale only
  - Oracle Cloud WAF for any public endpoints
  - Joined to Tailscale mesh (same ACLs as home server)
  - Stop instance when not in use (pay only for storage)
--------------------------------------------------------------

LAYER 6: OUTBOUND APIs (Egress Only)
  AI/ML: Anthropic, OpenAI, Cloudflare Workers AI, xAI, Gemini
  Comms: Telegram API, Twilio, Zoho SMTP, Gmail IMAP, LinkedIn
  Cloud: AWS Lambda, Vercel, Cloudflare R2/Stream, Clerk, Oracle Cloud
  Data:  Hunter.io, Apify, Alpaca, ChromaDB Cloud
```

## Security Rules
- INBOUND: Internet > Cloudflare WAF > Tunnel/Worker > Nginx > 127.0.0.1
- ADMIN: Lee iPhone > Tailscale (encrypted) > Nginx :8080 > 127.0.0.1
- OUTBOUND: Services > HTTPS only > External APIs
- FIREWALL: Windows blocks ALL inbound except Tailscale UDP
- DB ACCESS: PostgreSQL + Elasticsearch = localhost/Docker internal ONLY
- WEBHOOKS: Twilio signature validation on every request
- GUESTS: Rate limited (50/day, 20/hr) + budget capped (£2/day)
- LOGGING: Every request > JSONL > Filebeat > Elasticsearch > Kibana

## Implementation Tasks
1. Bind all services to 127.0.0.1 (not 0.0.0.0)
2. Switch Telegram bot from polling to webhook via Cloudflare Tunnel
3. Add Flix, Trading API routes to Nginx
4. Set up Cloudflare Access policies for admin UIs
5. Configure Windows Firewall to block all inbound except Tailscale
6. Update Cloudflare Worker to proxy Flix via Tunnel (not direct Tailscale)
7. Test all data flows end-to-end
8. Oracle Cloud: install Tailscale, Oracle DB, register MCP server
9. Oracle Cloud: lock down security list (SSH from Tailscale only)
10. Oracle Cloud: add OCI CLI + API key for programmatic access
11. Add Vercel deployments to architecture (frontend hosting)
