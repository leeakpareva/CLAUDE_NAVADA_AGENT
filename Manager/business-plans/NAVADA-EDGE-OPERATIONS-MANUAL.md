# NAVADA Edge — Business Operation Manual

**Version**: 1.0
**Date**: March 2026
**Owner**: Lee Akpareva, NAVADA
**Operator**: Claude (AI Chief of Staff)

---

## 1. Product Definition

### What Is NAVADA Edge?
NAVADA Edge is a consulting and deployment service. Lee Akpareva and Claude work as a team to design and deploy personalised AI home server systems for clients. The client gets their own AI employee that runs their business operations 24/7 from a local machine, controlled from their phone.

### What NAVADA Edge Is NOT
- It is not a SaaS product
- It is not a software license
- It is not a managed hosting service
- It is not a chatbot or app

### The Core Proposition
Every client gets a dedicated AI system that lives on their own hardware, has full access to their business tools, runs automated tasks daily, and is controlled from their phone. The AI does the work. The client approves.

---

## 2. Architecture

### The Stack
```
[Client's Phone]
    |
    | Tailscale (encrypted WireGuard tunnel)
    |
[Client's Laptop / Mini PC] (always-on, at home or office)
    |
    |--- Claude Code (AI brain, full system access)
    |--- Windows Task Scheduler / cron (autonomous scheduled tasks)
    |--- PM2 (always-on background processes)
    |--- Node.js + npm (runtime + packages)
    |--- MCP Servers (tool integrations, selected per client)
    |--- Docker + Nginx (optional, for web services)
    |--- Zoho / SMTP (email sending)
    |--- Custom CLAUDE.md (client's AI configuration)
```

### Component Breakdown

| Component | Purpose | Cost | Provider |
|-----------|---------|------|----------|
| Mini PC / Laptop | The server hardware | One-time $300-700 | Client purchases |
| Claude Code | AI brain with full system access | $20/mo subscription | Anthropic (client's account) |
| Tailscale | Encrypted phone-to-server networking | Free (up to 100 devices) | Tailscale Inc |
| Task Scheduler | Autonomous daily automations | Free (built into OS) | Microsoft / Linux |
| PM2 | Process management for always-on services | Free (open source) | Keymetrics |
| Node.js | Runtime for automations and scripts | Free (open source) | OpenJS Foundation |
| Zoho Mail | Email sending (SMTP) | Free tier available | Zoho |

### Total Recurring Cost Per Client: ~$20/month
This is the Claude subscription only. Everything else is free. The client pays this directly to Anthropic.

---

## 3. Roles and Responsibilities

### Lee Akpareva (Architect & Client Owner)
- Client acquisition and relationship management
- Solution scoping (what to automate, what to integrate)
- Pricing and commercial negotiation
- Quality assurance and sign-off
- Strategic direction of NAVADA Edge as a product
- Partner management (INVADE, future partners)

### Claude (Builder & Operator)
- Remote deployment via Tailscale + SSH
- Software installation and configuration
- Custom automation development
- CLAUDE.md creation and tailoring
- Dashboard and integration builds
- Client email communications (introductions, updates, reports)
- Documentation and operational manuals
- Prospect tracking and pipeline management
- Ongoing remote maintenance and optimisation

---

## 4. Client Onboarding Process

### Phase 1: Discovery (Lee-led)
1. Lee has initial conversation with client
2. Understand their business, pain points, and what they want automated
3. Identify which tools they use (email, CRM, website platform, accounting, social media)
4. Determine hardware situation (do they have a laptop? need to purchase?)
5. Agree on scope and pricing

### Phase 2: Client Setup (10 minutes, client-side)
1. Client powers on their laptop or mini PC
2. Client connects to internet (Wi-Fi or ethernet)
3. Client installs Tailscale (download from tailscale.com)
4. Lee sends Tailscale invite link, client clicks to join the tailnet
5. Client enables OpenSSH Server (Windows: Settings > System > Optional Features > OpenSSH Server)
6. Client confirms machine name and username to Lee

### Phase 3: Remote Deployment (Claude-led, via SSH)
1. Connect to client machine: `ssh [user]@[machine].tail[xxxxx].ts.net`
2. Run the deployment checklist (see Section 5)
3. Install all dependencies
4. Set up Claude Code with client's subscription
5. Create custom CLAUDE.md
6. Build automations per scope
7. Configure Task Scheduler entries
8. Set up PM2 for always-on processes
9. Install and configure relevant MCP servers
10. Test all automations end-to-end
11. Deploy dashboard (if in scope)

### Phase 4: Handover & Training
1. Walk client through how to use Claude from their phone
2. Demonstrate each automation and what it does
3. Show them their dashboard (if applicable)
4. Confirm scheduled task times (when things run automatically)
5. Provide a summary document of what was built
6. Confirm ongoing support arrangement

### Phase 5: Ongoing Support (if on retainer)
1. Retain Tailscale SSH access for remote maintenance
2. Add new automations as client needs evolve
3. Troubleshoot issues remotely
4. Monthly optimisation review
5. Update CLAUDE.md as business context changes

---

## 5. Deployment Checklist

Use this checklist for every new NAVADA Edge deployment. Check off each item as completed.

### Pre-Deployment
- [ ] Client scope document agreed (what to build)
- [ ] Client hardware confirmed (specs, OS)
- [ ] Client has internet connection
- [ ] Client has purchased Claude subscription ($20/mo)
- [ ] Tailscale invite sent and accepted
- [ ] SSH access confirmed from NAVADA server

### System Setup
- [ ] OS updated to latest version
- [ ] OpenSSH Server enabled and tested
- [ ] Git installed
- [ ] Node.js (LTS) installed
- [ ] npm updated to latest
- [ ] Python installed (if needed)
- [ ] PM2 installed globally (`npm i -g pm2`)
- [ ] PM2 startup configured (auto-start on boot)

### Claude Code Setup
- [ ] Claude Code CLI installed
- [ ] Client's Anthropic API key or subscription configured
- [ ] Claude Code tested and working
- [ ] Custom CLAUDE.md created (see Section 6)
- [ ] Memory directory created and initialised

### Automations
- [ ] Daily briefing email automation created
- [ ] Email sending configured (Zoho/SMTP credentials)
- [ ] Business-specific automations built (per scope)
- [ ] Task Scheduler entries created for all scheduled tasks
- [ ] PM2 processes configured for always-on services
- [ ] All automations tested manually
- [ ] All scheduled tasks verified (correct times, correct scripts)

### Networking & Access
- [ ] Tailscale running and auto-starting on boot
- [ ] Client can access server from phone via Tailscale
- [ ] Tailscale Funnel configured (if public access needed)
- [ ] Firewall rules verified (no conflicts)

### Security
- [ ] All API keys stored in .env files (never hardcoded)
- [ ] .env files added to .gitignore
- [ ] SSH key-based auth configured (password auth disabled, if appropriate)
- [ ] Tailscale ACLs reviewed (access limited to Lee + client)

### Documentation
- [ ] CLAUDE.md complete and accurate
- [ ] Automation summary document created for client
- [ ] Scheduled task schedule documented
- [ ] Handover training completed

### Sign-Off
- [ ] Lee has reviewed the deployment
- [ ] Client has confirmed everything works
- [ ] Deployment logged in NAVADA Edge prospect tracker

---

## 6. CLAUDE.md Template

Every client gets a custom CLAUDE.md. This is the configuration file that tells Claude who it is working for, what it has access to, and how to operate. Below is the base template. Customise per client.

```markdown
# CLAUDE.md — [Client Name] AI Home Server

## Owner
**[Client Name]** — [Title / Business]
- Email: [client email]
- Business: [business name and description]

## Machine
- **Role**: Always-on AI home server
- **OS**: [Windows 11 / Ubuntu]
- **Tailscale IP**: [IP address]
- **Node.js**: installed globally with npm
- **Python**: [if installed, specify command]

## Key Directories
| Path | Purpose |
|------|---------|
| [project dir] | Main working directory |
| [automation dir] | Scheduled tasks and automations |
| [data dir] | Business data and databases |

## Permissions
- Full machine access granted
- Authorised to: create/delete files, run services, send emails, manage databases
- Always confirm before destructive operations

## Scheduled Automations
| Task | Schedule | Script | Description |
|------|----------|--------|-------------|
| [task name] | [time] | [script path] | [what it does] |

## Business Context
[Description of the client's business, what they do, who their customers are,
what tools they use, what their priorities are. This is the knowledge base
that makes Claude effective for this specific client.]

## Tools & Integrations
[List of connected tools: email provider, website platform, CRM, social media,
databases, APIs, etc.]

## Content Rules
[Any rules about tone, style, branding, confidentiality for this client]

## Working Style
- Bias to action, produce working results
- Concise communication
- Always update memory files when business context changes
```

---

## 7. Service Tiers

### Tier 1: Individual
**For**: entrepreneurs, executives, consultants, content creators, investors

**Includes**:
- Entry-level mini PC setup (Intel N95, 12GB RAM)
- Basic UPS backup
- Claude Code + Tailscale configuration
- 3-5 core automations (daily briefing, email, social media, monitoring)
- Phone access setup
- 1-hour training session

**Recommended hardware**: Beelink Mini S12 or equivalent

### Tier 2: SME / Startup
**For**: restaurants, law firms, agencies, fintechs, growing businesses

**Includes**:
- Mid-range mini PC (Ryzen 5, 16GB RAM, 500GB SSD)
- Solar + battery backup (Nigeria) or UPS (UK)
- Full business automation suite
- CRM/pipeline integration
- Custom dashboard
- Website/SEO optimisation
- Claude Sonnet-level usage
- Multi-user phone access
- 2-hour training + documentation

**Recommended hardware**: Beelink SER5 or equivalent

### Tier 3: Enterprise
**For**: banks, oil and gas, government, large corporates

**Includes**:
- High-spec mini PC (Ryzen 7, 32GB RAM, 1TB SSD)
- Full power backup solution
- Multi-department AI deployment
- Regulatory compliance monitoring (NDPA, CBN, FCA)
- Real-time intelligence dashboards
- Claude Opus-level usage
- On-site staff training (AI Ops workshop)
- Dedicated support with SLA
- Data sovereignty documentation

**Recommended hardware**: Beelink SER9 MAX or equivalent

---

## 8. Pricing Framework

**Status**: Under discussion. Lee to confirm final pricing.

### Pricing Model Options

**Option A: One-Time Flat Fee**
- Single payment for design + deployment
- No ongoing obligation
- Client self-manages after handover
- Risk: undercharging for complex builds

**Option B: Setup Fee + Monthly Retainer (Recommended)**
- Upfront fee covers initial build
- Monthly retainer covers ongoing optimisation, new automations, support
- Creates predictable recurring revenue
- 10 clients at retainer = stable monthly income

**Option C: Tiered by Complexity**
- Individual: lower fee, simpler scope
- SME: mid-range fee, comprehensive build
- Enterprise: premium fee, full deployment

**Option D: Value-Based**
- Price based on value created for the client
- E.g. if system generates £50K in new business, charge 10% (£5K)
- Higher upside, harder to scope

### Cost Benchmarks (What Clients Currently Pay)
- Social media manager (UK): £1,500-3,000/month
- Data analyst: £250-400/day
- Junior developer: £2,000-3,500/month
- Email marketing platform: £50-200/month
- Managed IT services: £1,000-3,000/month
- AI/ML consultant: £500-1,500/day

NAVADA Edge replaces multiple roles for a fraction of the cost. Price accordingly.

---

## 9. Remote Deployment Process (Tailscale + SSH)

### How We Connect to Client Machines

1. **Client installs Tailscale** on their machine (tailscale.com/download)
2. **Lee sends invite link** to join the NAVADA tailnet
3. **Client clicks link** and authenticates (Google/Microsoft/GitHub account)
4. **Machine appears on tailnet** with a hostname like `client-pc.tail394c36.ts.net`
5. **Client enables OpenSSH Server**:
   - Windows 11: Settings > System > Optional Features > Add Feature > OpenSSH Server > Install
   - Then: Services > OpenSSH SSH Server > Start + set to Automatic
   - Linux: `sudo apt install openssh-server && sudo systemctl enable ssh`
6. **Claude connects**: `ssh [username]@[machine].tail394c36.ts.net`
7. **Full terminal access** to the client's machine. Build everything remotely.

### Network Requirements
- Tailscale uses WireGuard (extremely lightweight, works on 3G/4G/5G)
- SSH is low-bandwidth (text-only protocol)
- No port forwarding, no static IP, no firewall configuration needed
- Tailscale handles NAT traversal automatically
- Works across any ISP, any country, any network type

### Security Model
- All traffic encrypted end-to-end via WireGuard
- Tailscale ACLs control who can access what
- SSH key-based authentication recommended
- Access can be revoked instantly by removing machine from tailnet
- No data transits through Tailscale's servers (peer-to-peer when possible)

### After Deployment
- Retain SSH access for ongoing maintenance (if client agrees)
- Can add new automations, update configs, troubleshoot remotely
- Client can revoke access at any time by removing us from their tailnet

---

## 10. Starter Automation Pack

Every NAVADA Edge client gets these 5 automations on day one. These are templatable and work across all business types.

### 1. Daily Morning Briefing
- **Runs**: 7:00 AM daily (Task Scheduler)
- **Sends**: email to client with previous day's summary
- **Includes**: key metrics, action items, alerts, schedule for the day
- **Customised per client**: restaurant gets order stats, consultant gets pipeline status, investor gets market data

### 2. Email Marketing / Outreach
- **Capability**: compose and send branded emails on behalf of the client
- **Uses**: Zoho SMTP or client's email provider
- **Templates**: mobile-first HTML, dark theme, single-column layout
- **Triggered by**: client request via Claude or scheduled campaign

### 3. Social Media Content Generation
- **Capability**: generate captions, hashtag strategies, content calendars
- **Platforms**: Instagram, LinkedIn, Twitter/X, TikTok (text content)
- **Frequency**: daily or weekly batch generation
- **Approval flow**: Claude drafts, client approves via phone

### 4. Review / Reputation Monitoring
- **Monitors**: Google Reviews, social media mentions, industry news
- **Alerts**: sends notification to client when new reviews appear
- **Drafts**: professional responses for client approval
- **Frequency**: continuous (PM2 process) or scheduled checks

### 5. Competitor Watch
- **Monitors**: competitor websites, social media, pricing, news mentions
- **Reports**: weekly competitor intelligence briefing via email
- **Tracks**: menu/pricing changes, new products, marketing campaigns
- **Customised per client**: relevant competitors identified during discovery

---

## 11. Partner Model

### INVADE Partnership (Nigeria)
- **Partner**: Sabo Adesina, INVADE, Abuja, Nigeria
- **Role**: Local deployment partner for the Nigerian market
- **Model**: NAVADA provides the platform + remote build, INVADE handles local operations
- **INVADE responsibilities**: hardware sourcing, on-site setup (Tailscale install), client onboarding, local support, training workshops
- **Revenue**: setup fees + retainers split between NAVADA and INVADE
- **Status**: In discussion (March 2026)

### Future Partner Model
- Same template can be replicated in other markets
- Partner provides: local presence, client relationships, on-site support
- NAVADA provides: remote deployment, AI expertise, ongoing maintenance
- Revenue split negotiated per partner

---

## 12. Prospect & Client Tracker

### Active Prospects

| Name | Email | Business | Location | Status | Date |
|------|-------|----------|----------|--------|------|
| Ayo | Slyburner@icloud.com | Lee's friend | UK | Intro + visual + briefing + voice note sent | Mar 2026 |
| Sabo Adesina | Sabo.adesina@gmail.com | INVADE (cloud) | Abuja, Nigeria | Full sales sequence sent. Nigeria partner. | Mar 2026 |
| Abi Adebowale | Adebowale.abi@gmail.com | TagBistro (restaurant) | SE14, London | Intro email sent. Restaurant AI pitch. | Mar 2026 |
| Malcolm | send2chopstix@gmail.com | TBD | Nigeria | Remote deployment confirmation sent. | Mar 2026 |

### Client Pipeline Stages
1. **Prospect**: initial contact made, interest expressed
2. **Discovery**: scoping call completed, requirements understood
3. **Proposal**: pricing and scope shared with client
4. **Agreed**: client has accepted, ready to deploy
5. **Deploying**: Tailscale connected, build in progress
6. **Live**: system deployed, client using it
7. **Retainer**: ongoing monthly support active

---

## 13. Email Communication Templates

All client emails follow the mobile-first design system:
- Single-column layout, max-width 480px
- Dark theme (background #0a0a0a)
- Stacked sections (never side-by-side columns)
- 16-20px horizontal padding
- Max 24px headings, 20px section headers
- border="0" on all tables
- `-webkit-text-size-adjust:100%` on body
- Colour-coded per client/brand
- See `creative-emails.md` in memory for full style guide

### Email Types
| Type | Purpose | Example |
|------|---------|---------|
| Introduction | First contact, explain NAVADA Edge | send-abi-tagbistro.js |
| Visual Brief | Architecture overview with charts/diagrams | send-sabo-visual.js |
| Revenue Plan | Business case with unit economics | send-sabo-revenue-plan.js |
| Clarity / Explainer | Deep-dive on how the system works | send-sabo-clarity-mobile.js |
| Confirmation | Confirm technical capability | send-malcolm-edge.js |
| Voice Note | TTS audio message with transcript | send-ayo-voicenote.js |

---

## 14. Quality Assurance

### Before Every Deployment
- [ ] All automations tested manually
- [ ] Scheduled tasks fire at correct times
- [ ] Emails send correctly (check spam folder)
- [ ] Dashboard loads on mobile
- [ ] Tailscale connection stable
- [ ] PM2 processes restart on reboot
- [ ] CLAUDE.md is accurate and complete
- [ ] Client can reach Claude from their phone

### Before Every Client Email
- [ ] Renders correctly on mobile (single-column, no side-by-side)
- [ ] All links work
- [ ] No em dashes in content (NAVADA content rule)
- [ ] No client names leaked (unless authorised)
- [ ] CC to leeakpareva@gmail.com
- [ ] Subject line is clear and professional

---

## 15. Security & Data Policy

### Data Sovereignty
- All client data remains on the client's physical machine
- No client data is stored on NAVADA's server
- No client data is uploaded to cloud storage
- Claude API calls send prompts to Anthropic but no persistent storage
- Tailscale traffic is peer-to-peer encrypted (does not transit Tailscale servers when possible)

### Access Control
- SSH access granted only during deployment and agreed maintenance windows
- Client can revoke Tailscale access at any time
- API keys and credentials stored in .env files on client machine only
- .env files are gitignored and never committed to version control

### Compliance Considerations
- **UK (GDPR)**: data stays on client's machine, no cross-border transfer
- **Nigeria (NDPA 2023)**: on-premise processing, no data leaves the building
- **Regulated sectors**: banking (CBN), healthcare, legal: data sovereignty guaranteed by architecture

---

## 16. Reference Deployment

Lee's own NAVADA home server is the reference implementation and proof of concept for all NAVADA Edge sales.

### Specs
- **Hardware**: HP Laptop, Windows 11 Pro
- **Status**: Always-on home server since 2025
- **Tailscale**: Connected to iPhone for mobile control
- **Public demo**: navada-world-view.xyz (WorldMonitor dashboard)

### What It Runs
- 23 MCP server integrations
- 7+ scheduled automations (news digest, job hunter, economy report, lead pipeline, self-improvement, prospect outreach, VC monitor)
- PM2 ecosystem (5 processes: worldmonitor, API server, trading bot, inbox responder, auto-deploy)
- Voice command system (Bluetooth, OpenAI Whisper + TTS)
- Lead pipeline (SQLite CRM)
- Prospect pipeline (PostgreSQL, Hunter.io, automated outreach)
- WorldMonitor dashboard (real-time OSINT, markets, predictions, tech events)
- NAVADA Trading Lab (autonomous paper trading, Alpaca API)
- Creative visual email system (magazine-style HTML emails)
- LinkedIn publishing (OAuth, automated posts)

This is what every client's system can become. Show them navada-world-view.xyz and explain that their version would be tailored to their business.

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | March 2026 | Initial manual created |
