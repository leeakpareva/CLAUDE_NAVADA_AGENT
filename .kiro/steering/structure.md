---
inclusion: always
---

# NAVADA Edge — Project Structure

## Network Nodes
| Node | Hostname | IP | Role |
|------|----------|-----|------|
| NAVADA-CONTROL (ASUS) | navada-asus-control | 100.88.118.128 | Dev workstation, Kiro IDE, Claude Code |
| NAVADA-EDGE-SERVER (HP) | navada | 100.121.187.67 | SSH-only server, PostgreSQL :5433 |
| NAVADA-COMPUTE (EC2) | navada-ec2 | 100.98.118.33 / 3.11.119.181 | 24/7 compute, PM2, E2E tests |
| NAVADA-ROUTER (Oracle) | navada-oracle | 100.77.206.9 / 132.145.46.184 | Docker routing, Grafana, Prometheus |
| NAVADA-GATEWAY (Cloudflare) | edge-api.navada-edge-server.uk | — | Worker, D1, R2, DNS, 13 subdomains |
| NAVADA-AGENTS (Kiro) | — | — | AI agent orchestration, hooks, specs |

## Directory Layout
```
CLAUDE_NAVADA_AGENT/
├── .kiro/                    # Kiro IDE config (steering, hooks, agents)
├── Automation/               # Scheduled tasks, scrapers, mailers
│   ├── cloudflare-worker/    # NAVADA-GATEWAY Worker (worker.js + wrangler.toml)
│   ├── e2e/                  # Playwright E2E test suites
│   ├── logs/                 # Task output logs
│   └── .env                  # Secrets (gitignored)
├── LeadPipeline/             # Lead gen, CRM, prospect outreach
├── Manager/                  # Cost tracking, admin tools
├── NAVADA-Trading/           # Trading algorithms
├── infrastructure/           # Docker, Nginx, Cloudflare tunnel configs
├── navada-dashboard/         # EC2 dashboard (server.js)
├── KiroAgents/               # Kiro agent definitions (legacy scaffold)
└── templates/                # Email templates, report templates
```

## Key Files
- `Automation/cloudflare-worker/worker.js` — Main Telegram bot + API (Cloudflare Worker)
- `navada-dashboard/server.js` — EC2 dashboard + YOLO pipeline
- `Automation/e2e/runner.js` — E2E test daemon
- `LeadPipeline/pipeline.js` — Daily lead pipeline
- `LeadPipeline/prospect-pipeline.js` — Prospect outreach pipeline
- `infrastructure/docker-compose.yml` — Oracle Docker stack
