---
inclusion: auto
description: API endpoints, node IPs, and D1 tables for NAVADA Edge network integration
---

# NAVADA Edge — Network Integration

## API Endpoints (for agents to call)

### NAVADA-GATEWAY (Cloudflare Worker)
- Base: `https://edge-api.navada-edge-server.uk`
- Auth: `X-API-Key: navada-edge-2026` header or `?key=navada-edge-2026` query
- POST /metrics — Push metrics
- GET /metrics?node=HP&name=cpu — Query metrics
- POST /logs — Push logs (event_type, message, source)
- GET /logs?type=error&hours=24 — Query logs
- GET /health — Latest health checks
- GET /status — System status + D1 stats
- GET /health/telegram — Telegram bot health
- POST /telegram/webhook — Telegram webhook (bot messages)

### NAVADA-COMPUTE (EC2 Dashboard)
- Base: `http://3.11.119.181:9090` (public) or `http://100.98.118.33:9090` (Tailscale)
- Auth: `X-API-Key: navada-ec2`
- GET /api/status — Node status
- POST /api/shell — Execute shell command {command: "..."}
- POST /api/yolo — YOLO object detection {chatId, imageBase64}
- POST /api/vision/detect — Rekognition detect {image: base64}

### NAVADA-EDGE-SERVER (HP)
- SSH: `ssh navada@100.121.187.67`
- PostgreSQL: `100.121.187.67:5433` (navada_pipeline database)

### NAVADA-ROUTER (Oracle)
- Grafana: `http://100.77.206.9:3000`
- Prometheus: `http://100.77.206.9:9090`
- Portainer: `http://100.77.206.9:9000`

## Cloudflare D1 Tables
- metrics, edge_logs, health_checks, telegram_users, conversations, command_log, response_cache, vision_memory
