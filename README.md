# CLAUDE_NAVADA_AGENT

**NAVADA AI Engineering Server** — Autonomous AI agent system run by Claude Code on behalf of Lee Akpareva.

## Architecture

```
iPhone (Lee) ←→ Tailscale VPN ←→ NAVADA Server (HP Laptop, Windows 11)
                                      ↕
                                 Claude Code CLI
                                      ↕
                    ┌─────────────────┼─────────────────┐
                    ↓                 ↓                 ↓
              23 MCP Servers    Automations        Voice System
              (AI/Data/Dev)    (PM2 + Scheduler)   (S8 Bluetooth)
```

## Services & Access (from iPhone)

### Ops / Monitoring (Docker)

| Service | Port | URL | Credentials |
|---------|------|-----|-------------|
| **Grafana** | `:9090` | http://192.168.0.36:9090 | admin / navada |
| **Prometheus** | `:9091` | http://192.168.0.36:9091 | — |
| **Portainer** | `:9000` | http://192.168.0.36:9000 | Set on first login |
| **Uptime Kuma** | `:3002` | http://192.168.0.36:3002 | Set on first login |
| **Nginx** | `:80` / `:8080` | http://192.168.0.36 | — |

### Dev / ML (PM2 — locked ports)

| Service | Port | URL | Auth |
|---------|------|-----|------|
| **MLflow** | `:5000` | http://192.168.0.36:5000 | — |
| **JupyterLab** | `:8888` | http://192.168.0.36:8888/lab?token=navada | Token: `navada` |
| **TensorBoard** | `:6006` | http://192.168.0.36:6006 | — |

### Applications (PM2)

| Service | Port | URL |
|---------|------|-----|
| **CLAWD Dashboard** | `:3000` | http://192.168.0.36:3000 |
| **Excalidraw** | `:3001` | http://192.168.0.36:3001 |
| **Lead Dashboard** | `:3100` | http://192.168.0.36:3100 |

---

## How to Use Each Tool

### Grafana (http://192.168.0.36:9090)

1. Login: `admin` / `navada`
2. Prometheus auto-provisioned as default data source
3. **Import dashboards:** Dashboards > New > Import
   - Node Exporter Full: ID `1860`
   - Docker Dashboard: ID `893`
4. Create custom dashboards for pipeline metrics, PM2 health, etc.

### Prometheus (http://192.168.0.36:9091)

1. **Status > Targets** — see which scrape targets are up
2. **Graph** tab for ad-hoc queries:
   - `up` — which targets are reachable
   - `node_cpu_seconds_total` — CPU usage
   - `process_resident_memory_bytes` — memory
3. Config: `infrastructure/prometheus/prometheus.yml`
4. 30-day retention, lifecycle API enabled

### Portainer (http://192.168.0.36:9000)

1. First visit: create admin account
2. Select **Local** environment
3. **Containers:** start/stop/restart, view logs, exec shell
4. **Stacks:** edit docker-compose from UI
5. **Images:** pull, remove, inspect

### Uptime Kuma (http://192.168.0.36:3002)

1. First visit: create admin account
2. **Add monitors** for each service:
   | Monitor | URL | Type |
   |---------|-----|------|
   | Nginx | http://192.168.0.36/health | HTTP |
   | MLflow | http://192.168.0.36:5000 | HTTP |
   | JupyterLab | http://192.168.0.36:8888 | HTTP |
   | Grafana | http://192.168.0.36:9090 | HTTP |
   | Dashboard | http://192.168.0.36:3000 | HTTP |
   | Lead Pipeline | http://192.168.0.36:3100 | HTTP |
3. **Notifications:** Email, Slack, Telegram alerts on failure
4. **Status page:** create public status page

### MLflow (http://192.168.0.36:5000)

```python
import mlflow

mlflow.set_tracking_uri("http://192.168.0.36:5000")
mlflow.set_experiment("my-experiment")

with mlflow.start_run():
    mlflow.log_param("learning_rate", 0.01)
    mlflow.log_metric("accuracy", 0.95)
    mlflow.log_artifact("model.pkl")
```

- **Compare runs:** select multiple in UI, click Compare
- **Model Registry:** register models for deployment tracking
- **Artifacts:** stored at `CLAUDE_NAVADA_AGENT/mlflow-artifacts`

### JupyterLab (http://192.168.0.36:8888/lab?token=navada)

1. Access with token `navada`
2. Working dir: `CLAUDE_NAVADA_AGENT/`
3. Python 3.12 with all ML packages (PyTorch, HF, scikit-learn, etc.)
4. **Terminal:** File > New > Terminal (full shell access)
5. **Upload files:** drag and drop into file browser

### TensorBoard (http://192.168.0.36:6006)

```python
from torch.utils.tensorboard import SummaryWriter
writer = SummaryWriter("C:/Users/leeak/CLAUDE_NAVADA_AGENT/runs/my-run")
writer.add_scalar("loss", 0.5, step)
```

---

## Lead Pipeline (CRM)

**Dir:** `LeadPipeline/` | **Dashboard:** http://192.168.0.36:3100 | **Schedule:** Daily 8:30 AM

### Email Tracking & 4-Day Follow-Up

Every email is tracked in the `emails` table with type, timestamps, and reply status.

**Automatic flow:**
1. Send intro email → tracked as `email_type='intro'`, `followup_due` set to +4 days
2. Daily pipeline scan: intro sent 4+ days ago? No reply? No follow-up sent?
3. Auto-sends personalized follow-up → tracked as `email_type='followup_1'`
4. Lee gets alert email for every auto follow-up
5. If lead replies → status auto-updates to `responded`

**Pipeline API:**
```javascript
const leads = require('./leads');

// Send intro (auto-tracks + sets 4-day timer)
await leads.sendOutreachEmail(leadId, 'Subject', '<p>Body</p>');

// Manual follow-up
await leads.sendFollowUpEmail(leadId, 1);

// Check pending follow-ups
const pending = leads.getLeadsNeedingFollowUp();

// Email history & stats
const emails = leads.getEmailHistory(leadId);
const stats = leads.getEmailStats();
```

**Pipeline Stages:**
`new` → `researching` → `outreach_drafted` → `outreach_sent` → `responded` → `meeting_scheduled` → `proposal_sent` → `negotiating` → `won` / `lost` / `nurturing`

---

## Directory Structure

```
CLAUDE_NAVADA_AGENT/
├── infrastructure/
│   ├── docker-compose.yml          # Nginx, Cloudflared, Grafana, Prometheus, Portainer, Uptime Kuma
│   ├── ecosystem.config.js         # PM2: MLflow + JupyterLab
│   ├── prometheus/prometheus.yml
│   ├── grafana/provisioning/
│   ├── nginx/nginx.conf            # Upstreams
│   ├── nginx/conf.d/default.conf   # Routes
│   └── startup.ps1                 # Boot auto-start
├── Automation/
│   ├── ai-news-mailer.js           # Daily 7 AM AI news digest
│   ├── job-hunter-apify.js         # Daily 9 AM job scraper
│   ├── uk-us-economy-report.py     # Weekly Mon 8 AM economy report
│   ├── self-improve.js             # Weekly Mon 10 AM self-improvement
│   ├── voice-command.js            # Always-on voice assistant
│   ├── inbox-auto-responder.js     # Email auto-responder
│   ├── deliver-app.js              # App deploy pipeline
│   ├── email-service.js            # NAVADA email template
│   ├── linkedin-post.js            # LinkedIn API posting
│   └── .env                        # Secrets (gitignored)
├── LeadPipeline/
│   ├── pipeline.js                 # Main engine (daily scan + follow-ups)
│   ├── leads.js                    # CRUD + email tracking + follow-up logic
│   ├── db.js                       # SQLite schema
│   ├── logger.js                   # Event logging
│   ├── dashboard.js                # Express web UI (:3100)
│   └── data/pipeline.db            # SQLite database
├── clawd-dashboard/                # CLAWD BOT React app
├── templates/nextjs-shadcn/        # App delivery template
└── mlflow-artifacts/               # MLflow experiment artifacts
```

## Quick Commands

```bash
# Docker services
cd ~/CLAUDE_NAVADA_AGENT/infrastructure
docker compose up -d          # Start all
docker compose down           # Stop all
docker compose restart grafana

# PM2 services
pm2 list                      # View all
pm2 restart mlflow            # Restart one
pm2 logs jupyter-lab          # View logs
pm2 save                      # Persist across reboot

# Pipeline
cd ~/CLAUDE_NAVADA_AGENT/LeadPipeline
node pipeline.js              # Run pipeline manually
node -e "require('./leads').getEmailStats()"  # Check email stats
```

## Scheduled Automations

| Task | Schedule | Script |
|------|----------|--------|
| AI News Digest | Daily 7:00 AM | `ai-news-mailer.js` |
| Lead Pipeline | Daily 8:30 AM | `pipeline.js` (includes follow-up check) |
| Job Hunter | Daily 9:00 AM | `job-hunter-apify.js` |
| Economy Report | Monday 8:00 AM | `uk-us-economy-report.py` |
| Self-Improvement | Monday 10:00 AM | `self-improve.js` |

## PM2 Daemons (Always Running)

| Process | Port | Purpose |
|---------|------|---------|
| inbox-responder | — | Email auto-reply + improvement approval |
| voice-command | — | S8 Bluetooth voice assistant |
| mlflow | `:5000` | ML experiment tracking |
| jupyter-lab | `:8888` | Persistent Jupyter server |
| tensorboard | `:6006` | Training visualisation |
| lead-dashboard | `:3100` | Lead pipeline web UI |
| vc-response-monitor | — | VC email response watcher |

## Voice Command System

| Mode | Enter | Exit |
|------|-------|------|
| **STANDBY** | Default | Auto after command |
| **ACTIVE** | Say "Claude" | Auto → STANDBY |
| **CONVO** | "Claude, let's talk" | "Goodbye" |
| **SLEEPING** | "Claude, go to sleep" | "Claude, wake up" |

## MCP Servers (23)

**Cloud:** Excalidraw, Hugging Face, Vercel, Zapier
**Global:** Puppeteer, GitHub, PostgreSQL, Bright Data, OpenAI Images
**Project:** Fetch, Memory, Sequential Thinking, Context7, DBHub, DuckDB, SQLite, dbt, Zaturn, Fermat, Vizro, Optuna, NetworkX, Jupyter

## Networking

| Endpoint | Address |
|----------|---------|
| Local IP | `192.168.0.36` |
| Tailscale | `100.121.187.67` |

## Adding a New Service

1. Docker → add to `infrastructure/docker-compose.yml`
2. Native → add to `infrastructure/ecosystem.config.js`
3. Add upstream in `nginx/nginx.conf`
4. Add route in `nginx/conf.d/default.conf`
5. `docker compose restart nginx` or `pm2 start ecosystem.config.js`
6. Update this README

---

**Owner:** Lee Akpareva — Founder of NAVADA | Principal AI Consultant
leeakpareva@gmail.com | navada-lab.space | github.com/Navada25
