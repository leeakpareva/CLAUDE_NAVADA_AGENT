# Autonomous Marketing Agent — Technical Specification
## Based on NAVADA Edge Marketing Infrastructure
### Client: Dr Maureen Emeagi | Agent Name: TBD (awaiting client confirmation)

---

## Overview
A 4-pillar autonomous marketing agent designed for digital health product creators. The agent handles the full content lifecycle: research, creation, publishing, monitoring, and lead generation across Pinterest, YouTube, Meta (Instagram/Facebook), and Twitter/X.

This specification is based on the proven NAVADA Edge Marketing Infrastructure that runs NAVADA's own operations 24/7.

---

## Architecture

### Pillar 1: Content Creation (Social Media Lifecycle)
The agent governs the complete social media lifecycle with strategic reasoning.

**Cycle**: Trend Research > Copywriting > Asset Generation > Automated Posting > (repeat)

| Component | Technology | Function |
|-----------|-----------|----------|
| Trend Research | Puppeteer + Bright Data MCP | Scrapes Google Trends, Pinterest trending, Twitter/X trending topics in health/skincare/wellness niche |
| Industry Intelligence | ai-news-mailer.js pattern | Daily scan of health/wellness/skincare news sources, competitor content, emerging topics |
| Copywriting | Claude Sonnet 4 / Opus 4 | Brand-voice copywriting. Maintains tone guide, terminology database, style parameters per platform |
| Asset Generation | DALL-E 3 (OpenAI MCP) | Landscape/portrait images for Pinterest pins, Instagram posts, YouTube thumbnails, Twitter cards |
| Publishing | Platform APIs + Puppeteer | Direct API deployment to LinkedIn, Pinterest, Twitter/X. Puppeteer for platforms without API access |

**Content Types by Platform**:
- **Pinterest**: Pins with custom images, infographics, product showcase graphics. SEO-optimised descriptions.
- **YouTube**: Community posts, video descriptions, script outlines for shorts/long-form. Thumbnail generation.
- **Meta (Instagram/Facebook)**: Carousel posts, stories, reels captions, FB group posts. Image generation.
- **Twitter/X**: Threads, single tweets, quote tweets, engagement replies. Hashtag strategy.

**Scheduling Logic**:
- Morning wave (7-9 AM): Educational content, tips, trending topic takes
- Midday wave (12-2 PM): Product showcases, testimonials, case studies
- Evening wave (6-8 PM): Engagement posts, questions, community building
- Platform-specific optimal times applied automatically

### Pillar 2: Lead Generation (Prospecting to Growth)
Transitions from publishing to proactive audience and client acquisition.

| Component | Technology | Function |
|-----------|-----------|----------|
| Prospecting | lead-scraper.js pattern + Bright Data | Identifies potential customers: health professionals, wellness creators, digital product sellers |
| Verification | Hunter.io API | Email verification for outreach targets |
| Outreach | Zoho SMTP (or client's email) | Sends branded introductory emails to prospects |
| Follow-up Management | prospect-pipeline.js pattern | Automated follow-up sequences (day 4, day 8, day 12) |
| Inbox Monitoring | inbox-monitor.js pattern | Scans replies, flags hot leads, auto-categorises responses |

**Lead Sources**:
- Pinterest followers and engagement signals
- YouTube commenters on health/skincare content
- Twitter/X followers and DM requests
- Instagram DM enquiries
- Website contact form submissions

### Pillar 3: Strategic Monitoring (ROI and Intelligence)
Ensures strict oversight of performance and market intelligence.

| Component | Technology | Function |
|-----------|-----------|----------|
| Daily Intelligence | Web scraping + Claude analysis | Competitive landscape awareness: what competitors are posting, trending topics, market shifts |
| Performance Tracking | Platform APIs + cost-tracker.js pattern | Granular analytics: impressions, clicks, engagement rate, conversion signals per platform per post |
| Executive Summaries | Claude-generated reports | Daily and weekly digest: system health, marketing reach, top performers, recommendations |
| Cost Tracking | cost-tracker.js | Every API call logged with cost, token usage, and ROI calculation |

**Reports Delivered**:
- **Daily (9 PM)**: Today's posts, engagement stats, top performer, tomorrow's content plan
- **Weekly (Sunday 6 PM)**: Week summary, platform comparison, growth trends, content strategy adjustments
- **Monthly**: Full analytics report with charts, revenue attribution, cost breakdown

### Pillar 4: Command & Control (Telegram Integration)
Human-in-the-loop executive control from mobile device.

| Component | Technology | Function |
|-----------|-----------|----------|
| Telegram Bot | telegram-bot.js framework | Full slash command interface + natural language control |
| Model Switching | /sonnet and /opus commands | Fast mode for quick tasks, deep reasoning for strategy |
| Approval Workflow | Message queue + confirmation | Posts can require approval before publishing, or run fully autonomous |
| File Management | Upload/download via Telegram | Send product images, receive reports, share assets |

**Slash Commands (Example)**:
```
/status          — System health, today's post count, engagement summary
/post            — Trigger an immediate post across all platforms
/draft           — Generate content for review before posting
/schedule        — View and modify the content calendar
/analytics       — Today's performance numbers
/leads           — Lead pipeline status
/trending        — Current trending topics in your niche
/pause           — Pause all automated posting
/resume          — Resume automated posting
/report          — Generate and send performance report
/image <prompt>  — Generate a custom marketing image
/product <name>  — Add a new digital product to the marketing rotation
```

---

## Scheduled Automations (Windows Task Scheduler / Cron)

| Time | Task | Description |
|------|------|-------------|
| 6:00 AM | Trend Scan | Research trending topics in health/skincare/wellness |
| 6:30 AM | Content Generation | Draft day's content across all platforms |
| 7:00 AM | Morning Post Wave | Publish first batch of content |
| 9:00 AM | Engagement Check | Review overnight comments, DMs, mentions |
| 12:00 PM | Midday Post Wave | Second content batch (product-focused) |
| 2:00 PM | Lead Scan | Identify new prospects from engagement signals |
| 6:00 PM | Evening Post Wave | Third content batch (community/engagement) |
| 9:00 PM | Daily Report | Performance summary sent to Telegram |
| Sunday 6 PM | Weekly Report | Full weekly analytics digest |
| Every 2hrs | Inbox Monitor | Check for lead responses, customer enquiries |

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| AI Engine | Claude (Anthropic) Sonnet 4 / Opus 4 | Copywriting, analysis, decision-making, reporting |
| Image Generation | DALL-E 3 (OpenAI) | Visual assets for all platforms |
| Browser Automation | Puppeteer MCP | Platform interaction where APIs unavailable |
| Web Scraping | Bright Data MCP | Trend research, competitor monitoring |
| Email | Zoho SMTP/IMAP | Lead outreach, inbox monitoring |
| Database | SQLite / PostgreSQL | Lead tracking, content history, analytics |
| Process Management | PM2 | Always-on services |
| Task Scheduling | Windows Task Scheduler | Automated daily routines |
| Mobile Interface | Telegram Bot API | Phone-based command and control |
| Networking | Tailscale (Tier 2 only) | Encrypted phone-to-server connection |
| Deployment | Vercel (optional) | Landing pages, product storefronts |
| Payments | Stripe | Product checkout (Phase 2) |

---

## Data Flow

### Content Pipeline
```
[Trend Research] → [Topic Selection] → [Claude Copywriting] → [DALL-E Visual] → [Platform Formatting] → [Schedule/Publish] → [Track Performance] → [Optimise Next Cycle]
```

### Lead Pipeline
```
[Engagement Signal] → [Prospect Identified] → [Email Verified] → [Outreach Sent] → [Follow-up Sequence] → [Response Tracked] → [Lead Qualified] → [Client Notification]
```

---

## Estimated API Costs (Monthly)
| Service | Estimated Cost | Notes |
|---------|---------------|-------|
| Anthropic (Claude) | £15-20/mo | Copywriting, analysis, reporting |
| OpenAI (DALL-E 3) | £5-10/mo | Image generation (~30-60 images/month) |
| Bright Data | £0 (free tier) | Web scraping for trend research |
| Hunter.io | £0 (free tier) | Email verification (50/month) |
| **Total Variable** | **~£20-30/mo** | Covered by NAVADA (Tier 1) or client (Tier 2) |

---

## Phase 2: Digital Product Storefront (Future)
Once the marketing engine is running, Phase 2 adds:
- Custom Next.js storefront (Stan.store alternative)
- Stripe checkout for digital products
- Customer dashboard
- Download delivery system
- Email sequences for buyers
- Affiliate/referral tracking

---

## Notes
- Agent name: TBD (awaiting Dr Maureen's confirmation)
- This spec is a living document. Updated as requirements are refined.
- Based on the NAVADA Edge Marketing Infrastructure (14-page deck)
- All code patterns reference proven NAVADA production scripts
