# NAVADA Edge API Inventory
**Date**: 2026-03-03
**Author**: Claude (Chief of Staff, NAVADA)
**Total**: 32 External Services (28 Active, 4 Dormant) + 23 MCP Servers

---

## Core AI (6)

| # | Service | Used For | Scripts | Status |
|---|---------|----------|---------|--------|
| 1 | **Anthropic Claude** (Opus 4.6 / Sonnet 4) | Chief of Staff brain, all tool use, natural language | telegram-bot.js | Active (primary) |
| 2 | **OpenAI GPT-4o / GPT-4o-mini** | Fallback LLM, morning briefings | morning-briefing.js, job-hunter-apify.js | Active |
| 3 | **OpenAI DALL-E 3** | Image generation (/image command) | telegram-bot.js, generate-image.js | Active |
| 4 | **OpenAI Whisper** | Speech-to-text (voice commands) | voice-service.js, voice-command.js | Active |
| 5 | **OpenAI TTS-1-HD** | Voice note generation ("onyx" voice) | tts-read.js, voice-service.js | Active |
| 6 | **xAI Grok** (grok-3-mini-fast) | Real-time voice mode, WorldMonitor fallback | voice-grok.js, country-intel.ts | Active |

---

## Communication (4)

| # | Service | Used For | Scripts | Status |
|---|---------|----------|---------|--------|
| 7 | **Telegram Bot API** | 42+ command mobile interface (24/7), multi-user | telegram-bot.js, voice-command.js | Active |
| 8 | **Zoho Mail SMTP** (smtp.zoho.eu:465) | All outbound emails (branded templates) | email-service.js | Active |
| 9 | **Zoho IMAP** (imap.zoho.eu) | Inbox monitoring, auto-responder | inbox-monitor.js, inbox-auto-responder.js | Active |
| 10 | **LinkedIn OAuth** | Direct posting from Telegram/automation | linkedin-post.js, linkedin-auth.js | Active (expires 27 Apr 2026) |

---

## Data & Search (4)

| # | Service | Used For | Scripts | Status |
|---|---------|----------|---------|--------|
| 11 | **Hunter.io** | Email discovery for prospect outreach | LeadPipeline/email-finder.js | Active (free tier: 25 searches/mo) |
| 12 | **Apify** (Indeed scraper) | Daily job posting scraping | job-hunter-apify.js | Active ($0.01/run) |
| 13 | **Bright Data** (MCP) | Google/LinkedIn/website scraping | LeadPipeline/lead-scraper.js | Active |
| 14 | **RSS Feeds** (6 sources) | AI news, world news, morning briefing | morning-briefing.js, rss-proxy.js | Active (free) |

RSS sources: TechCrunch AI, Ars Technica, The Verge AI, MIT News, BBC World, The Guardian

---

## Finance & Trading (5)

| # | Service | Used For | Scripts | Status |
|---|---------|----------|---------|--------|
| 15 | **Alpaca Markets** | Paper trading (SPY, QQQ, AAPL, MSFT, NVDA) | NAVADA-Trading/src/*.py | Active (paper, $0 cost) |
| 16 | **FRED** | Economic indicators (inflation, GDP, unemployment) | worldmonitor-repo/src/services/runtime.ts | Active (free) |
| 17 | **Finnhub** | Stock data, company fundamentals, news | worldmonitor-repo/src/services/runtime.ts | Active (free tier) |
| 18 | **EIA** | Energy market data (oil, gas prices) | worldmonitor-repo/api/eia/ | Active (free) |
| 19 | **Polymarket** | Prediction markets | worldmonitor-repo/api/polymarket.js | Optional |

---

## Geospatial & Environmental (4)

| # | Service | Used For | Scripts | Status |
|---|---------|----------|---------|--------|
| 20 | **NASA FIRMS** | Real-time wildfire detection | worldmonitor-repo/src/services/runtime.ts | Active (free) |
| 21 | **USGS Earthquake** | Earthquake alerts | worldmonitor-repo/src/services/runtime.ts | Active (free) |
| 22 | **NWS Weather** | Weather warnings | worldmonitor-repo/src/services/runtime.ts | Active (free) |
| 23 | **OpenSky Network** | Aircraft tracking | worldmonitor-repo/api/opensky.js | Optional |

---

## Infrastructure & Deployment (5)

| # | Service | Used For | Scripts | Status |
|---|---------|----------|---------|--------|
| 24 | **Vercel** | Client app deployment (Next.js) | deliver-app.js | Active (free tier) |
| 25 | **Cloudflare Tunnel** | Public HTTPS access to home server | infrastructure/docker-compose.yml | Active (free) |
| 26 | **Tailscale VPN** | Secure mesh network (iPhone access) | System-level | Active (free) |
| 27 | **PostgreSQL** (local, port 5433) | Prospect CRM database | LeadPipeline/pg.js, prospect-db.js | Active (local, free) |
| 28 | **SQLite** (local) | Lead pipeline local DB | LeadPipeline/db.js | Active (local, free) |

---

## Dormant / Configured (4)

| # | Service | Used For | Status |
|---|---------|----------|--------|
| 29 | **Mistral AI** | WorldMonitor LLM fallback | Dormant (key in .env.local) |
| 30 | **Groq** | WorldMonitor LLM fallback | Dormant (key in .env.local) |
| 31 | **OpenRouter** | Unified LLM routing | Dormant (key in .env.local) |
| 32 | **Gmail SMTP** | Email fallback if Zoho down | Dormant (key in .env) |

---

## MCP Servers (23)

Excalidraw, Hugging Face, Vercel, Zapier, Puppeteer, GitHub, PostgreSQL, Bright Data, OpenAI Images, Fetch, Memory, Sequential Thinking, Context7, DBHub, DuckDB, SQLite, dbt, Zaturn, Fermat, Vizro, Optuna, NetworkX, Jupyter

---

## Cost Summary

| Service | Cost Model |
|---------|-----------|
| Anthropic Claude | Token-based (variable, only via Telegram) |
| OpenAI (DALL-E/TTS/Whisper) | Token/call-based (variable) |
| xAI Grok | Token-based (voice only) |
| Apify | $0.01/run (daily) |
| All other APIs | Free / free tier |
| Task Scheduler automations | FREE (no API cost) |
| Databases (PostgreSQL, SQLite) | Local, free |

**Key insight**: Only Telegram interactions cost money. All 18 scheduled automations run at zero API cost.

---

## Comparison vs OpenClaw

OpenClaw is a connector to one LLM. NAVADA Edge orchestrates 32 APIs + 23 MCP servers into a unified autonomous platform. See `navada-edge-vs-openclaw.md` for full competitive analysis.
