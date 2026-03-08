# NAVADA System Reference (Externalized)

This file contains reference data moved out of the Telegram bot system prompt to reduce token usage.
The bot reads this file when needed via the read_file tool.

## Server: NAVADA HP Laptop
- OS: Windows 11 Pro, Git Bash shell
- Local IP: 192.168.0.58 | Tailscale: 100.121.187.67
- Python: use `py` (not python3)
- Node.js + npm installed globally
- Docker Desktop (WSL2) | PM2 process management

## Key Directories
- Projects: C:/Users/leeak/CLAUDE_NAVADA_AGENT
- Automation: C:/Users/leeak/CLAUDE_NAVADA_AGENT/Automation
- Knowledge base: C:/Users/leeak/CLAUDE_NAVADA_AGENT/Automation/kb
- LeadPipeline: C:/Users/leeak/CLAUDE_NAVADA_AGENT/LeadPipeline
- Infrastructure: C:/Users/leeak/CLAUDE_NAVADA_AGENT/infrastructure
- Trading: C:/Users/leeak/CLAUDE_NAVADA_AGENT/NAVADA-Trading
- Manager: C:/Users/leeak/CLAUDE_NAVADA_AGENT/Manager
- Client docs/proposals: C:/Users/leeak/CLAUDE_NAVADA_AGENT/Manager/Clients
- Logs: C:/Users/leeak/CLAUDE_NAVADA_AGENT/Automation/logs
- NAVADA Edge docs: C:/Users/leeak/CLAUDE_NAVADA_AGENT/Manager

## PM2 Services (14)
worldmonitor, worldmonitor-api, trading-api, inbox-responder, auto-deploy, trading-scheduler, telegram-bot, network-scanner, navada-flix, navada-logo, notebooklm-watcher, oracle-elk-tunnel, failover-sync

## Scheduled Automations (Windows Task Scheduler)
- Morning-Briefing: Daily 6:30 AM (morning-briefing.js)
- AI-News-Digest: Daily 7:00 AM (ai-news-mailer.js)
- Economy-Report: Mon 8:00 AM (uk-us-economy-report.py)
- NAVADA-LeadPipeline: Daily 8:30 AM (pipeline.js)
- Job-Hunter-Daily: Daily 9:00 AM (job-hunter-apify.js)
- NAVADA-ProspectPipeline: Daily 9:30 AM (prospect-pipeline.js)
- Self-Improve-Weekly: Mon 10:00 AM (self-improve.js)
- VC-Response-Monitor: At startup (vc-response-monitor.js)
- Inbox-Monitor: Every 2hrs 8AM-10PM (inbox-monitor.js)
- Weekly-Report: Sunday 6 PM (weekly-report.js)
- Trading tasks: Pre-market, Execution, Close, Report

## NAVADA Products
- NAVADA Edge: Productised AI home server deployment service (core product)
- WorldMonitor: OSINT dashboard (navada-world-view.xyz)
- NAVADA Trading Lab: Autonomous paper trading (Alpaca + IEX)
- NAVADA Robotics: www.navadarobotics.com
- Navada Lab: www.navada-lab.space (GPU ML lab)
- ALEX: Autonomous AI agent (alexnavada.xyz)
- Raven Terminal: raventerminal.xyz (code learning)

## Inspire Powered by NAVADA (Email Distribution List)
Stored at Automation/kb/inspire-distribution.json. 16 members: Abs, Uncle Patrick, Reshia Fearon, Beverly-Celine, Dr Saminu, Akama, Steph 1, Aday, Jenny, Elicia, Delivna, Tim, Stephanie, Lauren, Malcolm, Dr Maureen.
When Lee asks to email someone from Inspire by name, look them up. For "all" or "everyone", send individual personalised emails.

## Prospect Pipeline
- PostgreSQL on port 5433 (navada_pipeline)
- Flow: scrape -> verify -> outreach -> follow-ups -> escalation
- Scripts in LeadPipeline/

## Databases
**PostgreSQL** (port 5433): navada_pipeline DB for prospect/lead CRM
**Oracle XE** (port 1521, on Oracle Cloud VM 132.145.46.184):
- Schema: navada / XEPDB1
- Tables: inbox_replies, sent_emails, contacts
- Docker container on Oracle VM (not HP). Access via SSH tunnel.
- Version: Oracle XE 21c (FREE tier: 12GB storage, 2GB RAM, 2 CPU threads)
- CloudBeaver UI on Oracle VM for visual queries

## MCP Server Access (23 Servers)
All accessible via run_shell:
- PostgreSQL: `psql -h localhost -p 5433 -U navada -d navada_pipeline -c "SELECT ..."`
- LinkedIn: `node Automation/linkedin-post.js "Post text"`
- Twilio SMS/Call: send_sms and make_call tools
- Puppeteer, DuckDB, Jupyter, GitHub CLI, Bright Data, SQLite, Docker
- Cloudflare Stream: stream_video tool
- Cloudflare Trace: cloudflare_trace tool
- Cloudflare R2: r2_storage tool (bucket: navada-assets)
- Cloudflare Flux: flux_image tool (FREE AI image gen)
- ChromaDB RAG: chroma_search tool (462+ chunks)

## ELK Stack
elk_query tool for log search. Indices: navada-telegram-*, navada-automation-*, navada-pm2-*. Kibana: http://192.168.0.58:8080/kibana/

## Content Rules
- No client names in outreach/external content
- No em dashes in email copy or external content

## Tailscale Network
HP (100.121.187.67), ASUS/NAVADA2025 (100.88.118.128), Oracle VM (100.77.206.9), EC2 (100.98.118.33), iPhone (100.68.251.111)

## NAVADA2025 (ASUS Zenbook Duo)
Dev workstation at 192.168.0.18 (WiFi). LM Studio + Ollama for local AI. PG 17. Not always-on.
