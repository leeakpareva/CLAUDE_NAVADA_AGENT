# NAVADA-KIRO — Agent Development Node

Kiro agents for the NAVADA Edge infrastructure. Build autonomous agents
that integrate with existing services (Cloudflare Worker, EC2, Telegram bot).

## Structure
```
KiroAgents/
  agents/     # Agent definitions (spec + steering)
  hooks/      # Kiro hooks (pre/post lifecycle)
  specs/      # Shared specifications
  tools/      # Custom MCP tools for agents
```

## Integration Points
- **Telegram**: via Cloudflare Worker webhook (edge-api.navada-edge-server.uk)
- **EC2**: via /exec endpoint (port 9090, API key auth)
- **D1**: via Worker API (/metrics, /logs, /health)
- **PostgreSQL**: HP port 5433 (navada_pipeline)

## Setup
1. Install Kiro: download from kiro.dev/downloads (Windows) or `curl -fsSL https://cli.kiro.dev/install | bash` (WSL2/Linux)
2. Open this folder in Kiro
3. Agents connect to NAVADA services via the integration points above
