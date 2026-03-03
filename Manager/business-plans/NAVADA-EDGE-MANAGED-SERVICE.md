# NAVADA Edge: Managed AI Service - Business Case

**Author**: Claude (Chief of Staff) on behalf of Lee Akpareva
**Date**: 2 March 2026
**Status**: Ready for Lee's review

---

## Executive Summary

Today we proved a new capability: a guest user (ID 7603217134) was granted sandboxed access to the NAVADA Telegram bot, interacted with Claude, and confirmed working access, all within 30 seconds. No hardware shipped. No software installed. No onboarding call. Just a user ID and a `/grant` command.

This transforms NAVADA Edge from a hardware deployment service into a **managed AI service** with two delivery models:

1. **Full Deployment** (existing): client gets their own machine + Claude + full stack
2. **Managed Access** (new): client accesses NAVADA's infrastructure via Telegram with role-based permissions, custom agents, and usage-based billing

The second model is the unlock. It is SaaS-like revenue with consulting-grade margins, zero client-side setup, and instant onboarding.

---

## What We Proved Today

| Step | Action | Time |
|------|--------|------|
| 1 | Lee said "give user 7603217134 access" | 0s |
| 2 | Claude updated `telegram-users.json` with guest role + 7-day expiry | 5s |
| 3 | Claude restarted the Telegram bot via PM2 | 10s |
| 4 | User messaged the bot and got the NAVADA Edge demo experience | 30s |
| 5 | User confirmed access working | 60s |

**Total onboarding time: under 60 seconds.**

The user received:
- Sandboxed AI assistant (Claude Sonnet 4 / Opus 4)
- Server status monitoring
- AI image generation (DALL-E 3)
- Research and content drafting
- Cost-tracked usage with per-user logging
- Isolated conversation memory
- Auto-expiring access (7 days)

What they could NOT do: access files, send emails, run shell commands, manage services, post to LinkedIn. Full IAM-style permission boundary.

---

## The IAM Model

This is identity and access management for AI, comparable to Azure RBAC or GCP IAM:

### Current Roles

| Role | Permissions | Use Case |
|------|------------|----------|
| **admin** | Full system access: shell, files, email, LinkedIn, PM2, Docker, all 42+ commands | Lee (owner) |
| **guest** | Read-only demo: status, image, research, draft, about, pm2 (view), model, costs | Prospects, demo users |

### Proposed New Roles (To Build Tomorrow)

| Role | Permissions | Target Client | Price Point |
|------|------------|---------------|-------------|
| **starter** | status, image, research, draft, about, model + 50 messages/day cap | Individual professionals | £49/mo |
| **professional** | All starter + email (send/read), voicenote, report, present, LinkedIn draft (not post) | Consultants, freelancers | £149/mo |
| **business** | All professional + shell (whitelisted commands), file read, pm2 view, custom automations (3 max) | SMEs, agencies | £349/mo |
| **enterprise** | All business + custom agent deployment, dedicated MCP servers, LinkedIn posting, priority Opus model | Corporates, funds | £749/mo |
| **custom** | Bespoke permission set defined per client | Large accounts | Custom pricing |

### Permission Architecture

```
telegram-users.json
{
  "users": {
    "<userId>": {
      "role": "professional",
      "plan": "navada-edge-pro",
      "maxMessages": 200,           // daily message cap
      "allowedCommands": [...],     // whitelist
      "blockedCommands": [...],     // blacklist
      "customAgents": ["research-agent", "email-agent"],
      "modelAccess": ["sonnet"],    // or ["sonnet", "opus"]
      "expiresAt": "2026-04-02",
      "billingEmail": "client@example.com",
      "monthlyFee": 149,
      "currency": "GBP"
    }
  }
}
```

---

## Revenue Model

### Unit Economics (Per Client, Per Month)

| Tier | Monthly Fee | API Cost (est.) | Gross Margin | Margin % |
|------|------------|-----------------|--------------|----------|
| Starter | £49 | £5-10 | £39-44 | 80-90% |
| Professional | £149 | £15-30 | £119-134 | 80-90% |
| Business | £349 | £30-60 | £289-319 | 83-91% |
| Enterprise | £749 | £60-120 | £629-689 | 84-92% |

**Key insight**: API costs are the only variable cost. NAVADA's server is already running 24/7. Each additional user is near-zero marginal cost. The Telegram bot handles concurrent users. Cost tracking is already built in.

### Revenue Projections (Conservative)

| Month | Starter (x) | Pro (x) | Business (x) | Enterprise (x) | MRR |
|-------|-------------|---------|---------------|-----------------|-----|
| Month 1 | 3 | 1 | 0 | 0 | £296 |
| Month 3 | 8 | 3 | 1 | 0 | £1,188 |
| Month 6 | 15 | 8 | 3 | 1 | £3,631 |
| Month 12 | 30 | 15 | 8 | 3 | £7,864 |
| Month 18 | 50 | 25 | 15 | 5 | £14,850 |

**Year 1 target: £5K-8K MRR by December 2026.**

### Upsell Path

```
Guest Demo (free, 7 days)
  -> Starter (£49/mo)
    -> Professional (£149/mo)
      -> Business (£349/mo)
        -> Enterprise (£749/mo)
          -> Full Deployment (£2K-5K one-time + retainer)
```

The managed service becomes the **top of funnel** for full NAVADA Edge deployments. Clients who outgrow the managed service want their own machine.

---

## Custom Agents Per Client

This is the high-value differentiator. Each client can have bespoke AI agents deployed on NAVADA's server, accessible via their Telegram access:

### Example Agent Configurations

**For a Restaurant Owner (like TagBistro)**:
- `/menu` - Update today's specials, generate social media posts
- `/bookings` - Check reservation system, send confirmations
- `/review` - Summarise recent Google/TripAdvisor reviews
- `/supplier` - Draft supplier order emails
- `/social` - Generate Instagram content with DALL-E

**For a Consultant**:
- `/research` - Deep research on any topic with citations
- `/proposal` - Generate client proposal from brief
- `/invoice` - Create and email invoices
- `/linkedin` - Draft LinkedIn thought leadership posts
- `/brief` - Morning briefing: calendar, emails, tasks, news

**For a Property Manager**:
- `/tenants` - Tenant communication drafts
- `/maintenance` - Log and track maintenance requests
- `/listings` - Generate property listing copy + images
- `/reports` - Monthly property performance reports

**For a Trader/Investor**:
- `/market` - Pre-market scan and analysis
- `/watchlist` - Monitor specific tickers
- `/news` - Sector-specific news digest
- `/thesis` - Investment thesis generator

### Agent Deployment Process

1. Lee consults with client on their workflow (1-2 hours)
2. Claude builds custom agent commands in `telegram-bot.js`
3. Agent tested on NAVADA server
4. Client granted access with role that includes their custom commands
5. Client uses agents from Telegram immediately
6. Claude monitors usage via interaction logs

**Agent build time: 2-4 hours per client.** At £349/mo, that is payback in under 2 weeks.

---

## Technical Implementation Plan (Tomorrow)

### Phase 1: Role System Upgrade (2-3 hours)

**File**: `Automation/telegram-bot.js`

1. **Extend user schema** in `telegram-users.json`:
   - Add `plan`, `maxMessages`, `allowedCommands`, `modelAccess`, `billingEmail`, `monthlyFee`
   - Add daily message counter with midnight reset

2. **Implement tiered command access**:
   - Replace current binary admin/guest check with role-based permission lookup
   - Create `ROLE_PERMISSIONS` config object mapping roles to allowed commands
   - Add `hasPermission(userId, command)` function

3. **Add message rate limiting**:
   - Track daily message count per user in memory + persist to file
   - Reset at midnight UTC
   - Send polite "limit reached" message when exceeded
   - Admin exempt from limits

4. **Add billing metadata**:
   - Log plan tier + monthly fee in interaction log
   - Add `/usage` command: shows client their message count, model usage, days remaining

### Phase 2: Client Onboarding Flow (1-2 hours)

**New admin commands**:

```
/addclient <userId> <plan> [days]
  - Adds user with plan-specific permissions
  - Sets expiry (default 30 days for paid, 7 for trial)
  - Creates per-user memory file
  - Sends welcome message to user

/editclient <userId> <field> <value>
  - Update plan, permissions, expiry, message cap

/clients
  - List all active clients with plan, usage, expiry, revenue

/revenue
  - Monthly revenue summary: total MRR, per-tier breakdown, API costs, net margin
```

### Phase 3: Custom Agent Framework (2-3 hours)

**New file**: `Automation/client-agents/`

1. **Agent config files**: `client-agents/{userId}.json`
   ```json
   {
     "clientId": "7603217134",
     "clientName": "Abs",
     "agents": [
       {
         "command": "research",
         "description": "Deep research on any topic",
         "systemPrompt": "You are a research analyst...",
         "model": "sonnet",
         "tools": ["generate_image"]
       }
     ]
   }
   ```

2. **Dynamic command registration**: Bot reads client agent configs on startup
3. **Per-client system prompts**: Each client gets a tailored AI personality/focus
4. **Agent marketplace**: Pre-built agent templates Lee can assign to clients

### Phase 4: Billing + Reporting (1-2 hours)

1. **Monthly usage report email**: Auto-send to each client showing their usage stats
2. **Revenue dashboard command**: `/revenue` shows Lee total MRR, per-client breakdown
3. **Stripe integration** (future): Auto-charge monthly via Stripe Payment Links
4. **Invoice generation**: `/invoice <userId>` generates and emails a NAVADA-branded invoice

---

## Competitive Advantage

| Feature | NAVADA Edge Managed | ChatGPT Teams | Microsoft Copilot | Custom GPT |
|---------|--------------------|--------------|--------------------|-----------|
| Full system access | Yes (role-based) | No | No | No |
| Custom agents per client | Yes | No | Limited | Yes (no tools) |
| Email send/read | Yes | No | Outlook only | No |
| Image generation | Yes (DALL-E 3) | Yes | Yes | Yes |
| Server monitoring | Yes | No | No | No |
| Autonomous tasks | Yes (scheduled) | No | No | No |
| Data stays on-prem | Yes | No | No | No |
| LinkedIn integration | Yes | No | No | No |
| Voice notes | Yes | No | No | No |
| MCP server access | 23 servers | No | No | No |
| Cost transparency | Per-message tracking | Per-seat | Per-seat | Per-seat |
| Onboarding time | 60 seconds | Hours | Days | Hours |
| White-label potential | Yes | No | No | Partial |

**NAVADA Edge is the only product that gives non-technical users access to a real AI system operator, not a chatbot.**

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| API costs spike from heavy users | Per-tier message caps, model restrictions (starter = Sonnet only) |
| Guest accesses sensitive data | IAM role enforcement, command whitelist, no file/shell access |
| Server overload with many users | Monitor RAM/CPU via existing status tools, scale to second machine if needed |
| Client churn | 7-day free trial converts to paid, custom agents create switching cost |
| Anthropic API outage | Graceful error handling already in bot, notify users |
| Pricing too high/low | Start with beta pricing, adjust based on usage data we are already collecting |

---

## Immediate Next Steps (Tomorrow, 3 March 2026)

| Priority | Task | Time Est. |
|----------|------|-----------|
| 1 | Implement tiered roles in `telegram-bot.js` (starter/pro/business/enterprise) | 2-3 hrs |
| 2 | Add `/addclient`, `/editclient`, `/clients`, `/revenue` admin commands | 1-2 hrs |
| 3 | Add daily message rate limiting with `/usage` for clients | 1 hr |
| 4 | Create `client-agents/` framework for per-client custom commands | 2 hrs |
| 5 | Build 1 example client agent config (for user 7603217134 as test) | 30 min |
| 6 | Create landing page copy for managed service tiers | 1 hr |
| 7 | Draft pricing email to send to Sabo (INVADE) about managed service model | 30 min |

**Total: ~8 hours of work. Claude handles 90% of implementation. Lee reviews and approves.**

---

## The Vision

```
Today:   Lee types "/grant 7603217134 7" -> user has AI Chief of Staff in 60 seconds
Tomorrow: Lee types "/addclient 7603217134 professional 30" -> paying client onboarded
Next month: 20 clients, £3K MRR, zero infrastructure cost
Q4 2026: 50+ clients, £8K+ MRR, NAVADA Edge is a self-sustaining business

Client's experience:
  Open Telegram -> Message Claude -> Get work done -> Pay monthly

Lee's experience:
  /addclient -> /clients -> /revenue -> collect payment
```

NAVADA Edge is no longer just a deployment service. It is a **managed AI platform** with instant onboarding, role-based access, custom agents, and recurring revenue. The infrastructure is already built. The product is already running. Now we scale.

---

*Prepared by Claude, AI Chief of Staff, NAVADA*
*For review by Lee Akpareva, Founder*
