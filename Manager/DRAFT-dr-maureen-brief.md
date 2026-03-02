# DRAFT — Dr. Maureen Project Brief
## FOR LEE'S REVIEW ONLY — DO NOT SEND UNTIL APPROVED

---

# NAVADA Edge + Digital Product Platform with AI Marketing Automation
## Project Brief for Dr. Maureen

---

## What Dr. Maureen Wants

From the WhatsApp conversation:

1. **A better version of Stan.store** — an easy way for people to build and sell digital products
2. **AI-powered automated marketing** — the hard part isn't building the product, it's marketing it. She wants automated organic marketing across Pinterest, YouTube, Meta (Instagram/Facebook), and Twitter/X
3. **AI agents doing the marketing work** — not just content generation, but actual posting, scheduling, and optimisation
4. **A combination of Stan.store + Blaze.ai** — product selling platform + AI marketing automation in one system

## What Stan.store Does (for reference)
- Digital product storefront ($29-99/month)
- Sell ebooks, courses, templates, coaching sessions
- Link-in-bio style (creators share one link from Instagram/TikTok/YouTube)
- Zero transaction fees (only Stripe processing fees)
- Course builder, subscription management, email collection
- Stan AutoDM (automated Instagram DM responses)
- $400M+ in creator sales
- Simple, mobile-first, creator-focused

## What Blaze.ai Does (for reference)
- AI marketing automation ($65-99/month)
- Auto-generates social media posts, blog content, emails in your brand voice
- Auto-posts to Instagram, Facebook, LinkedIn, Twitter/X, TikTok, YouTube
- Brand kit auto-detection (colours, fonts, voice)
- 50+ content formats
- Content calendar and scheduling
- Performance analytics

## The Gap Dr. Maureen Has Identified
Creators can build digital products. The platforms exist. But marketing those products is where everyone struggles. Nobody wants to spend hours every day creating Pinterest pins, YouTube descriptions, Instagram posts, and Twitter threads to drive traffic to their store. That is the bottleneck. Dr. Maureen wants to solve that bottleneck with AI agents.

---

## The Deliverable: Two Phases

### PHASE 1: NAVADA Edge Setup (Foundation)
Every client needs this first. This is the AI infrastructure.

| Item | Description |
|------|-------------|
| Hardware | Mini PC (Beelink SER5 or equivalent) or Dr. Maureen's existing laptop |
| Claude Code | Installed and configured with her own Claude subscription |
| Tailscale | Encrypted connection, phone-to-server access |
| Task Scheduler | Automated daily tasks (marketing posts, analytics, reports) |
| PM2 | Always-on background processes |
| Custom CLAUDE.md | Tailored to her business, brand voice, product catalogue |
| Daily briefing | Morning email: sales, traffic, social media performance, what to focus on |
| Email system | Zoho SMTP for customer emails, marketing campaigns, transactional emails |

**Dr. Maureen's cost for Phase 1:**
- Hardware: £300-500 (one-time) — or use existing laptop
- Claude subscription: $20/month (~£16/month)
- Tailscale: Free
- Everything else: Free (open source)

### PHASE 2: The Product Build (Stan.store + Blaze.ai Killer)
A custom web application + AI marketing automation suite, built and deployed on her NAVADA Edge server.

#### Part A: Digital Product Storefront
A modern, mobile-first web app where Dr. Maureen (and eventually her customers) can:

| Feature | Description |
|---------|-------------|
| Product listings | Upload and sell digital products (ebooks, templates, courses, guides) |
| Storefront page | Beautiful, branded landing page / link-in-bio style |
| Payment processing | Stripe integration (cards, Apple Pay, Google Pay) |
| Course builder | Create and deliver online courses with modules and lessons |
| Email collection | Lead magnets, newsletter signup, customer list building |
| Customer dashboard | Buyers access their purchased products |
| Subscription / membership | Recurring billing for premium content |
| Analytics dashboard | Sales, revenue, conversion rates, top products |
| Mobile-first | Perfect on phone (both for Dr. Maureen and her customers) |

**Tech stack:**
- Next.js 15 + React (from NAVADA template)
- Tailwind CSS + shadcn/ui components
- Stripe for payments
- PostgreSQL or SQLite for data
- Deployed on Vercel (public access) + backed by NAVADA Edge server
- Admin panel accessible from phone via Tailscale

#### Part B: AI Marketing Automation Suite
This is the killer feature. AI agents running on the NAVADA Edge server that handle all marketing automatically.

| Channel | What The AI Does |
|---------|-----------------|
| **Pinterest** | Generates pin images + descriptions for every product. Creates boards by category. Schedules 5-10 pins/day. Optimises for Pinterest SEO (keywords, hashtags). Drives traffic to storefront. |
| **YouTube** | Generates video scripts, titles, descriptions, tags for product-related content. Creates YouTube Shorts scripts. Optimises for YouTube SEO. Writes community posts. |
| **Instagram** | Generates feed post captions, carousel content ideas, Reels scripts, Stories content. Schedules posts. Creates hashtag strategies. Responds to DMs (AutoDM style). |
| **Facebook** | Cross-posts Instagram content. Creates Facebook-specific posts for groups and pages. Generates event listings for launches. |
| **Twitter/X** | Generates tweet threads about products and expertise. Schedules daily tweets. Engages with relevant conversations. Creates launch announcement threads. |
| **Email** | Writes and sends email campaigns to subscriber list. Welcome sequences for new subscribers. Product launch emails. Weekly newsletters. Abandoned cart reminders. |
| **Blog/SEO** | Writes SEO-optimised blog posts that drive organic Google traffic. Internal linking to products. Lead magnet content. |

**How it works technically:**
- Claude generates all content (text, captions, descriptions, scripts) on the server
- Content is generated in batches (e.g. weekly content calendar every Sunday night)
- Posting via: platform APIs where free (Pinterest, YouTube, Meta Graph API), or browser automation via Puppeteer MCP for platforms with expensive APIs (Twitter/X)
- Dr. Maureen reviews a daily content preview on her phone each morning
- She approves with one tap, or edits, then Claude posts
- Analytics pulled daily: what performed, what to double down on
- Claude learns her brand voice over time from her CLAUDE.md and content history

**Approval flow:**
```
Claude generates weekly content batch (Sunday night)
    → Dr. Maureen reviews on phone (Monday morning)
    → Approves / edits
    → Claude schedules and posts throughout the week
    → Daily performance report sent to phone
    → Claude adjusts next week's strategy based on data
```

---

## What Dr. Maureen Needs to Provide

| Item | Detail | Cost |
|------|--------|------|
| Laptop or mini PC | For the NAVADA Edge server | £300-500 (one-time, or existing laptop) |
| Claude subscription | Anthropic Claude Pro | $20/month (~£16/month) |
| Stripe account | For payment processing | Free (Stripe takes 1.4% + 20p per transaction) |
| Domain name | For the storefront (e.g. her brand.com) | ~£10/year |
| Vercel account | For hosting the public storefront | Free tier covers most use cases |
| Social media accounts | Pinterest, YouTube, Instagram, Facebook, Twitter/X | Free (she likely already has these) |
| Brand assets | Logo, colours, fonts, brand voice guidelines | She provides, or Claude helps create |
| Product catalogue | Her digital products (files, descriptions, pricing) | She provides the actual products |
| Internet connection | For the server to run 24/7 | Existing home broadband |

**Total ongoing cost to Dr. Maureen: ~£16/month** (just the Claude subscription)
Everything else is either free or one-time.

---

## Pricing Options for Lee

### Option A: Flat Fee (One-Time)
| Phase | Fee |
|-------|-----|
| Phase 1: NAVADA Edge setup | £1,500 |
| Phase 2A: Digital product storefront | £3,000 |
| Phase 2B: AI marketing automation suite | £2,500 |
| **Total** | **£7,000** |

- Clean, one-time payment
- Handover after build
- No ongoing obligation from Lee
- Optional: monthly retainer for ongoing support (£300-500/month)

### Option B: Phased Payments
| Milestone | Fee | When |
|-----------|-----|------|
| Deposit (start work) | £2,500 | Day 1 |
| NAVADA Edge + Storefront live | £2,500 | Week 2-3 |
| AI marketing suite live + training | £2,000 | Week 4-5 |
| **Total** | **£7,000** | Over 5 weeks |

### Option C: Lower Upfront + Retainer
| Item | Fee |
|------|-----|
| Full build (Phase 1 + 2) | £4,000 |
| Monthly retainer (ongoing optimisation, new features, support) | £500/month |
| **Total Year 1** | **£10,000** |

- Lower barrier to entry
- Recurring revenue for Lee
- Ongoing relationship (add new marketing channels, optimise, scale)

### Why These Fees Are Justified
For context, what Dr. Maureen would pay for equivalent services:

| Alternative | Monthly Cost | Annual Cost |
|-------------|-------------|-------------|
| Stan.store (Creator Pro) | £79/month | £948/year |
| Blaze.ai (Autopilot) | £79/month | £948/year |
| Social media manager (freelance) | £1,500/month | £18,000/year |
| Part-time marketing assistant | £1,200/month | £14,400/year |
| Custom web development (agency) | — | £15,000-30,000 (one-time) |
| **Combined annual cost** | **~£2,900+/month** | **£34,296+/year** |

NAVADA Edge replaces ALL of the above for a one-time fee of £7,000 + £16/month (Claude sub). The ROI is immediate.

---

## Timeline

| Week | Deliverable |
|------|-------------|
| Week 1 | NAVADA Edge setup (hardware, Claude, Tailscale, daily briefing, email system) |
| Week 2 | Storefront build (product listings, Stripe, customer dashboard, mobile-first design) |
| Week 3 | Storefront polish + course builder + subscription system + analytics |
| Week 4 | AI marketing automation (Pinterest, Instagram, Twitter/X, email campaigns) |
| Week 5 | YouTube + blog/SEO automation + full testing + training + handover |

**Total build time: 5 weeks**

---

## The Pitch to Dr. Maureen (Summary)

Dr. Maureen, here is what we are building for you:

1. **Your own AI home server** — a mini PC at your home, always on, running Claude (AI). You control it from your phone. This is the foundation. We call it NAVADA Edge.

2. **A digital product storefront** — better than Stan.store. Your own branded platform where you sell ebooks, courses, templates, coaching. Stripe payments, zero platform fees (no monthly subscription to Stan). You own it.

3. **AI marketing agents** — this is the game-changer. Every day, Claude generates and posts content across Pinterest, YouTube, Instagram, Facebook, Twitter, email, and your blog. Optimised for each platform. You review and approve from your phone each morning. The marketing runs on autopilot while you focus on creating products.

4. **Daily intelligence** — every morning you get a report: what sold, what content performed, which platform is driving the most traffic, what to post today. Data-driven decisions, not guesswork.

The hard thing is not building the digital product. You already know that. The hard thing is marketing it consistently across 6 platforms every single day. That is what the AI handles. You create the product. The AI sells it.

---

## Notes for Lee

- Dr. Maureen does not have any AI setup currently, so NAVADA Edge is the essential first step
- The digital product platform can be built using our Next.js + shadcn/ui template (already in ~/templates/)
- AI marketing automation is the core value prop — this is what she is really buying
- Pinterest API is free for content creation (rate-limited but sufficient)
- YouTube Data API is free (10,000 quota units/day)
- Meta Graph API is free for page management and posting
- Twitter/X API Basic is $100/month — can use Puppeteer browser automation instead (free)
- Alternatively, all posting can go through Zapier MCP or direct API calls
- The storefront competes with Stan.store but with ZERO monthly fees to any platform
- Brand voice learning: Claude's CLAUDE.md + memory files mean the content gets better over time
- This could become a template we deploy for other creator clients (productise the product)

---

**STATUS: DRAFT — AWAITING LEE'S APPROVAL BEFORE SENDING**
