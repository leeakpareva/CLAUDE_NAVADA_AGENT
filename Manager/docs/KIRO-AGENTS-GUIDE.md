# Kiro Agents Guide — NAVADA Edge IaC

## Quick Start

1. Open `C:\Users\leeak\CLAUDE_NAVADA_AGENT` in Kiro IDE
2. Kiro auto-loads all steering files (product, tech, structure, network)
3. Chat with an agent: type `@agent-name` in the chat panel

## Available Agents

### @chief-of-staff
Full operational control. Use for anything: emails, deploys, monitoring, reports.
- "Check all node health and report"
- "Send Lee a status email"
- "Deploy the latest worker.js"

### @network-ops
Infrastructure diagnostics and monitoring.
- "Are all nodes online?"
- "Check D1 for errors in the last hour"
- "Run E2E tests on EC2"
- "Diagnose why Oracle SSH is failing"

### @deploy
Safe deployment with pre/post validation.
- "Deploy worker.js to Cloudflare"
- "Deploy server.js to EC2"
- "Check deployment health"

### @outreach
Prospect pipeline and email automation.
- "Find contacts at [company]"
- "Draft an intro email for [prospect]"
- "Show pipeline status"
- "Send follow-ups for overdue prospects"

### @test-runner
E2E test execution and failure analysis.
- "Run all tests"
- "Run the gateway test suite"
- "Analyse why the playwright tests failed"

## Creating New Agents

Create a markdown file in `.kiro/agents/`:

```markdown
# Agent Name
Description of what this agent does.

## Capabilities
- What it can do

## Tools
@builtin

## Resources
#[[file:.kiro/steering/network.md]]

## Instructions
1. Step-by-step behaviour rules
```

### Agent Ideas

| Agent | File | Purpose |
|-------|------|---------|
| cost-guardian | `.kiro/agents/cost-guardian.md` | Monitor AWS spend, alert before budget breach |
| incident-responder | `.kiro/agents/incident-responder.md` | Watch D1 for errors, auto-diagnose, fix or escalate |
| content-engine | `.kiro/agents/content-engine.md` | Generate LinkedIn posts, emails, reports |
| security-auditor | `.kiro/agents/security-auditor.md` | Scan for secrets, check WAF rules, audit ACLs |
| data-pipeline | `.kiro/agents/data-pipeline.md` | Autonomous prospect scraping and outreach |

## Hooks (Automation Triggers)

Hooks fire on events without you asking:

| Hook | Trigger | Action |
|------|---------|--------|
| pre-deploy | Before saving worker.js or server.js | `node -c` syntax check |
| post-deploy | After deployment | Health check endpoints |

### Creating New Hooks

In Kiro IDE: `Ctrl+Shift+P` > "Kiro: Open Kiro Hook UI"

Or create manually in `.kiro/hooks/`:

```markdown
# Hook Name
## Trigger
On file save matching `*.js` in `Automation/`
## Action
Run syntax validation
## Command
node -c "$FILE_PATH"
```

## Steering Files (Context)

Steering files give agents persistent knowledge. They live in `.kiro/steering/`.

| File | Mode | Purpose |
|------|------|---------|
| product.md | always | Business context, users, objectives |
| tech.md | always | Tech stack, AI models, conventions |
| structure.md | always | Network nodes, directory layout |
| network.md | auto | API endpoints, IPs, D1 tables |

### Inclusion Modes
- **always**: Loaded in every conversation
- **auto**: Loaded when relevant to the request
- **fileMatch**: Loaded when working with matching files
- **manual**: Referenced with `#filename`

## IaC Commands (Makefile)

```bash
make status          # All node status
make health          # CPU/RAM/disk across nodes
make deploy-worker   # Deploy Cloudflare Worker
make deploy-ec2      # Deploy to EC2
make deploy-oracle   # Deploy Oracle Docker stack
make logs-ec2        # EC2 PM2 logs
make logs-oracle     # Oracle Docker logs
make logs-worker     # Cloudflare Worker live tail
make logs-d1         # D1 database logs
make ssh-ec2         # SSH to EC2
make ssh-oracle      # SSH to Oracle
make ssh-hp          # SSH to HP
make backup          # Full backup to S3
make cw-costs        # Current month AWS costs
make clean           # Prune Docker resources
```

## Three-Layer Autonomy

```
LAYER 1: Kiro Agents (dev-time)
  - Code quality, deploys, testing, outreach
  - Hooks auto-trigger on file saves, commits
  - Steering provides persistent context

LAYER 2: Cloudflare Worker (runtime, 24/7)
  - Health checks every 5 min
  - Telegram bot (Claude Chief of Staff)
  - Cron: morning briefing, pipelines, job hunter
  - D1 database for metrics, logs, memory

LAYER 3: Telegram (human interface)
  - Lee commands via phone
  - Claude executes across all nodes
  - Guest demo access for prospects
```

## Network API Quick Reference

```bash
# Worker status
curl -H "X-API-Key: navada-edge-2026" https://edge-api.navada-edge-server.uk/status

# Telegram health
curl -H "X-API-Key: navada-edge-2026" https://edge-api.navada-edge-server.uk/health/telegram

# EC2 status
curl -H "X-API-Key: navada-ec2" http://3.11.119.181:9090/api/status

# D1 logs (last hour)
curl -H "X-API-Key: navada-edge-2026" "https://edge-api.navada-edge-server.uk/logs?hours=1"

# Live dashboards (public, no auth)
# Traffic: https://edge-api.navada-edge-server.uk/traffic
# Live:    https://edge-api.navada-edge-server.uk/live
```
