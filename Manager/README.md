# NAVADA Manager

Operational hub for the NAVADA home server. Cost tracking, daily ops reports, product catalog, and system documentation.

---

## Prospect Pipeline (Contract Outreach)

Automated system for finding companies hiring AI/ML contractors, discovering decision-maker emails, and running personalized outreach campaigns.

### Architecture

```
Google/LinkedIn/Websites ──→ lead-scraper.js ──→ prospect_companies
                                                  prospect_contacts
                                                       │
                                                       ▼
                              email-finder.js ──→ Hunter.io API
                              (domain search,     (verify emails)
                               email finder)           │
                                                       ▼
                              outreach.js ────→ Zoho SMTP
                              (intro, followup)   (send emails)
                                                       │
                                                       ▼
                              prospect-pipeline.js ──→ Daily Report
                              (orchestrator)           (email to Lee)
```

### Database (PostgreSQL — `navada_pipeline` on port 5433)

| Table | Purpose |
|-------|---------|
| `prospect_companies` | Target companies with sector, AI signal, priority, status |
| `prospect_contacts` | Decision-makers (CTO, VP Eng, Head of AI) with email verification |
| `prospect_emails` | Full outbound/inbound email history with threading |
| `prospect_audit` | Immutable audit log — every action timestamped (TIMESTAMPTZ) |
| `prospect_notes` | Free-form notes on companies or contacts |

### Files

| File | Location | Purpose |
|------|----------|---------|
| `prospect-db.js` | `LeadPipeline/` | Schema creation + CRUD + audit logging + stats |
| `lead-scraper.js` | `LeadPipeline/` | Google/LinkedIn/website scraping, Bright Data MCP import, company enrichment |
| `email-finder.js` | `LeadPipeline/` | Hunter.io domain search, email finder, email verifier (rate-limited) |
| `outreach.js` | `LeadPipeline/` | Professional intro + follow-up email templates, batch send via Zoho |
| `prospect-pipeline.js` | `LeadPipeline/` | Daily orchestrator: scrape → verify → inbox → follow-ups → escalation → report |

### Outreach Flow

```
Day 0:  Intro email sent → status: contacted
Day 4:  Follow-up 1 (gentle nudge) → if no reply
Day 8:  Follow-up 2 (final touch) → if still no reply
Day 12: Escalate to cold → priority 5
```

### CLI Commands

```bash
# Schema
node LeadPipeline/prospect-db.js init          # Create/migrate tables
node LeadPipeline/prospect-db.js stats         # Pipeline statistics

# Scraping
node LeadPipeline/lead-scraper.js run          # Enrich new companies (scrape websites)
node LeadPipeline/lead-scraper.js enrich <id>  # Enrich specific company
node LeadPipeline/lead-scraper.js queries      # Show search queries for Bright Data MCP

# Email Discovery (requires HUNTER_API_KEY in Automation/.env)
node LeadPipeline/email-finder.js run                          # Find + verify all
node LeadPipeline/email-finder.js domain <domain>              # Domain search
node LeadPipeline/email-finder.js find <domain> <first> <last> # Find person's email
node LeadPipeline/email-finder.js verify <email>               # Verify single email

# Outreach
node LeadPipeline/outreach.js ready            # List contacts ready for outreach
node LeadPipeline/outreach.js intro <id>       # Send intro to specific contact
node LeadPipeline/outreach.js batch [limit]    # Send intros to top N ready contacts
node LeadPipeline/outreach.js followups        # Send all pending follow-ups
node LeadPipeline/outreach.js followup <id> 1  # Send follow-up N to contact

# Full Pipeline
node LeadPipeline/prospect-pipeline.js         # Run everything end-to-end
node LeadPipeline/prospect-pipeline.js inbox   # Check inbox only
node LeadPipeline/prospect-pipeline.js escalate # Run escalation only
node LeadPipeline/prospect-pipeline.js report  # Generate report only
```

### Hunter.io Integration

- **API Key**: `HUNTER_API_KEY` in `Automation/.env`
- **Free tier**: 25 domain searches + 50 email verifications per month
- **Rate limiting**: Built-in counter with warnings when approaching limits
- **Sign up**: https://hunter.io

### Email Templates

**Intro** — Professional pitch positioning Lee as Principal AI Consultant. Sector-specific social proof (insurance → Generali, logistics → DHL, healthcare → NHS Digital). Soft CTA for 15-minute chat.

**Follow-up 1** — Brief nudge referencing original email. Sector-specific value prop.

**Follow-up 2** — Final touch. Offers to share AI roadmap ideas. Graceful exit if timing isn't right.

All emails sent from `claude.navada@zohomail.eu` as "Lee Akpareva | NAVADA", CC'd to `leeakpareva@gmail.com`.

### Prerequisites

- [x] PostgreSQL running on port 5433
- [ ] Hunter.io API key added to `Automation/.env`
- [x] Bright Data MCP configured
- [x] Zoho SMTP credentials in `.env`

---

## Other Manager Tools

| File | Purpose |
|------|---------|
| `cost-tracker.js` | Track API/service costs |
| `cost-report.py` | Generate cost reports |
| `send-cost-report.js` | Email cost reports to Lee |
| `daily-ops-report.js` | Daily server operations summary |
| `market-pipeline.py` | Market research pipeline |
| `PRODUCTS.md` | NAVADA product catalog (WorldMonitor, etc.) |
| `TODO.md` | Server infrastructure to-do list |

---

*Last updated: 2026-02-28*
