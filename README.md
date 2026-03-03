# CLAUDE_NAVADA_AGENT

**NAVADA AI Engineering Server** — Autonomous AI agent system run by Claude (Chief of Staff) on behalf of Lee Akpareva.

## Architecture

```
iPhone (Lee) ←→ Telegram Bot ←→ Claude API (Sonnet 4 / Opus 4)
                                       ↕
iPhone (Lee) ←→ Tailscale VPN ←→ NAVADA Server (HP Laptop, Windows 11)
                                       ↕
                                  Claude Code CLI
                                       ↕
                   ┌───────────────────┼───────────────────┐
                   ↓                   ↓                   ↓
             23 MCP Servers      Automations          Voice System
             (AI/Data/Dev)     (PM2 + Scheduler)    (S8 Bluetooth)
```

## Claude: Chief of Staff

Claude operates as NAVADA's Chief of Staff, not just an assistant:
- **Full server control**: shell, files, processes, email, deployments
- **24/7 availability** via Telegram (primary mobile interface)
- **Proactive management**: monitors, maintains, and improves systems
- Reports to Lee Akpareva (Founder)

## Telegram Bot (Primary Interface)

**Script**: `Automation/telegram-bot.js` | **PM2**: `telegram-bot`

Lee controls the entire server from his iPhone via Telegram. 38 slash commands with autocomplete.

### Capabilities
- **Model switching**: `/sonnet` (Sonnet 4, fast) and `/opus` (Opus 4, powerful)
- **Full system access**: Shell, files (read/write/delete), process management
- **Email E2E**: Send (Zoho SMTP), read inbox, read sent, search (IMAP)
- **Image generation**: `/image` (DALL-E 3 via OpenAI API)
- **Voice notes**: `/voicenote` (OpenAI TTS HD, emailed as attachment)
- **Persistent memory**: Conversation history survives bot restarts
- **Cost tracking**: Every API call logged with model, tokens, ROI
- **MCP access**: All 23 MCP servers accessible via shell commands
- **Natural language**: Any text message routes through Claude with full tool access

### Commands (38)

| Category | Commands |
|----------|----------|
| AI Model | `/sonnet` `/opus` `/model` |
| System | `/status` `/disk` `/uptime` `/ip` `/processes` |
| PM2 | `/pm2` `/pm2restart` `/pm2stop` `/pm2start` `/pm2logs` |
| Automations | `/news` `/jobs` `/pipeline` `/prospect` `/run` `/tasks` |
| Communication | `/email` `/emailme` `/briefing` `/inbox` `/sent` |
| Creative | `/present` `/report` `/research` `/draft` `/image` |
| Voice | `/voice` `/voicenote` |
| Files | `/ls` `/cat` `/shell` |
| Network | `/tailscale` `/docker` `/nginx` |
| Other | `/costs` `/memory` `/clear` `/about` `/help` |

### Tools (Claude API Tool Use)

| Tool | Description |
|------|-------------|
| `run_shell` | Execute any bash command on the server |
| `read_file` | Read file contents (absolute paths) |
| `write_file` | Create or overwrite files |
| `list_files` | List directory contents with optional glob filter |
| `server_status` | Full server health: CPU, RAM, disk, PM2, Docker, Tailscale |
| `send_email` | NAVADA-branded email via Zoho SMTP (any recipient) |
| `read_inbox` | Read Zoho email (INBOX, Sent, Drafts) via IMAP |
| `generate_image` | DALL-E 3 image generation (square, landscape, portrait) |

## PM2 Services (8)

**Config**: `ecosystem.config.js`

| Service | Script | Port | Purpose |
|---------|--------|------|---------|
| worldmonitor | `serve-local.mjs` | 4173 | Frontend + proxy |
| worldmonitor-api | `start-api.mjs` | 46123 | Local API server |
| trading-api | `uvicorn src.api:app` | 5678 | Trading FastAPI |
| inbox-responder | `inbox-auto-responder.js` | — | Email auto-reply + improvement gate |
| auto-deploy | `scripts/auto-deploy.js` | — | Git poll + rebuild |
| trading-scheduler | `scripts/scheduler.js` | — | Trading cron triggers |
| telegram-bot | `telegram-bot.js` | — | Claude Chief of Staff |
| voice-command | `voice-command.js` | 7777 | S8 Bluetooth voice |

## Scheduled Automations (18 Windows Tasks)

| Task | Schedule | Script |
|------|----------|--------|
| Morning-Briefing | Daily 6:30 AM | `morning-briefing.js` |
| AI-News-Digest | Daily 7:00 AM | `ai-news-mailer.js` |
| Economy-Report | Mon 8:00 AM | `uk-us-economy-report.py` |
| NAVADA-LeadPipeline | Daily 8:30 AM | `pipeline.js` |
| Job-Hunter-Daily | Daily 9:00 AM | `job-hunter-apify.js` |
| NAVADA-ProspectPipeline | Daily 9:30 AM | `prospect-pipeline.js` |
| Self-Improve-Weekly | Mon 10:00 AM | `self-improve.js` |
| NAVADA-Trading-PreMarket | Daily 2:15 PM | Trading pre-market scan |
| NAVADA-Trading-Execute | Daily 3:45 PM | Trading execution |
| Market-Intelligence | Daily 6:00 PM | Market analysis |
| Weekly-Report | Sun 6:00 PM | `weekly-report.js` |
| NAVADA-Trading-FridayClose | Fri 8:30 PM | Close positions |
| Daily-Ops-Report | Daily 9:00 PM | Operations summary |
| NAVADA-Trading-Report | Daily 9:15 PM | Trading report |
| Inbox-Monitor | Every 2hrs 8AM-10PM | `inbox-monitor.js` |
| VC-Response-Monitor | At startup | `vc-response-monitor.js` |
| NAVADA-Infrastructure | At startup | Health check |
| PM2-Resurrect | At startup | `pm2 resurrect` |

## Key Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `telegram-bot.js` | Claude Chief of Staff Telegram bot | PM2 managed |
| `email-service.js` | NAVADA-branded email sending | `node email-service.js <to> <subject> <body>` |
| `voice-service.js` | TTS voice notes via OpenAI | `node voice-service.js <to> <message>` |
| `inbox-monitor.js` | Read Zoho inbox via IMAP | `node inbox-monitor.js` |
| `morning-briefing.js` | Executive morning brief | `node morning-briefing.js` |
| `weekly-report.js` | PDF + voice weekly report | `node weekly-report.js` |
| `job-hunter-apify.js` | Job search (max 10/email) | `node job-hunter-apify.js` |
| `voice-command.js` | S8 Bluetooth voice control | PM2 managed |

## NAVADA Products

| Product | URL | Description |
|---------|-----|-------------|
| NAVADA Edge | — | Productised AI home server deployment service |
| WorldMonitor | navada-world-view.xyz | OSINT dashboard |
| NAVADA Trading Lab | — | Autonomous paper trading (Alpaca + IEX) |
| NAVADA Robotics | navadarobotics.com | Robotics company |
| Navada Lab | navada-lab.space | GPU ML lab + portfolio |
| ALEX | alexnavada.xyz | Autonomous AI agent |
| Raven Terminal | raventerminal.xyz | AI code learning platform |

## MCP Servers (23)

**Cloud:** Excalidraw, Hugging Face, Vercel, Zapier
**Global:** Puppeteer, GitHub, PostgreSQL, Bright Data, OpenAI Images
**Project:** Fetch, Memory, Sequential Thinking, Context7, DBHub, DuckDB, SQLite, dbt, Zaturn, Fermat, Vizro, Optuna, NetworkX, Jupyter

## Directory Structure

```
CLAUDE_NAVADA_AGENT/
├── Automation/
│   ├── telegram-bot.js           # Claude Chief of Staff (38 commands)
│   ├── ai-news-mailer.js         # Daily AI news digest
│   ├── morning-briefing.js       # Executive morning brief
│   ├── job-hunter-apify.js       # Job scraper
│   ├── uk-us-economy-report.py   # Economy analysis
│   ├── self-improve.js           # Ralph Wiggum self-improvement
│   ├── voice-command.js          # S8 Bluetooth voice assistant
│   ├── voice-service.js          # TTS voice notes (OpenAI)
│   ├── inbox-monitor.js          # Zoho IMAP inbox monitor
│   ├── inbox-auto-responder.js   # Email auto-responder
│   ├── email-service.js          # NAVADA branded email
│   ├── weekly-report.js          # PDF + voice weekly report
│   ├── deliver-app.js            # App deploy pipeline
│   ├── linkedin-post.js          # LinkedIn API posting
│   ├── kb/                       # Knowledge base (contacts, decisions, memory)
│   ├── logs/                     # Task output logs
│   └── .env                      # Secrets (gitignored)
├── LeadPipeline/
│   ├── pipeline.js               # Lead CRM engine
│   ├── prospect-pipeline.js      # Prospect outreach automation
│   ├── lead-scraper.js           # Google/LinkedIn scraping
│   ├── email-finder.js           # Hunter.io email verification
│   └── outreach.js               # Intro + follow-up emails
├── NAVADA-Trading/
│   ├── src/api.py                # FastAPI trading API
│   └── scripts/scheduler.js      # Trading cron triggers
├── Manager/
│   ├── cost-tracker.js           # API cost logging + ROI
│   └── cost-log.json             # Cost data
├── navada-osint/worldmonitor-repo/
│   ├── serve-local.mjs           # WorldMonitor frontend
│   ├── start-api.mjs             # WorldMonitor API server
│   └── api/                      # API endpoints (incl. navada-costs.js)
├── infrastructure/
│   ├── docker-compose.yml        # Nginx + Cloudflare tunnel
│   └── nginx/                    # Reverse proxy configs
├── ecosystem.config.js           # PM2 unified config (8 services)
├── CLAUDE.md                     # Claude Code instructions
└── README.md                     # This file
```

## Networking

| Endpoint | Address |
|----------|---------|
| Local IP | `192.168.0.58` |
| Tailscale | `100.121.187.67` |
| iPhone Tailscale | `100.68.251.111` |
| WorldMonitor | `navada.tail394c36.ts.net` |

## Quick Commands

```bash
# PM2 services
pm2 list                          # View all 8 services
pm2 restart telegram-bot          # Restart Telegram bot
pm2 logs telegram-bot --lines 20  # View logs
pm2 start ecosystem.config.js     # Start all from config
pm2 save                          # Persist across reboot

# Docker
cd ~/CLAUDE_NAVADA_AGENT/infrastructure
docker compose up -d              # Start Nginx + tunnel
docker compose down               # Stop all containers

# Pipeline
node LeadPipeline/pipeline.js     # Run lead pipeline
node LeadPipeline/prospect-pipeline.js  # Run prospect outreach

# Automations
node Automation/morning-briefing.js
node Automation/ai-news-mailer.js
node Automation/job-hunter-apify.js
```

## Voice Command System

| Mode | Enter | Exit |
|------|-------|------|
| **STANDBY** | Default | Auto after command |
| **ACTIVE** | Say "Claude" | Auto -> STANDBY |
| **CONVO** | "Claude, let's talk" | "Goodbye" |
| **SLEEPING** | "Claude, go to sleep" | "Claude, wake up" |

Wake words: "claude", "navada", "hey claude", "ok claude"

---

**Owner:** Lee Akpareva — Founder of NAVADA | Principal AI Consultant
leeakpareva@gmail.com | navada-lab.space | github.com/Navada25
