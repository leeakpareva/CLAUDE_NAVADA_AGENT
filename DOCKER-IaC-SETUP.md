# NAVADA Edge — Docker IaC Setup

## Docker Environments

### Development (ASUS/HP)
```bash
docker compose up -d
```
Starts: PostgreSQL (dev), Redis, ChromaDB. For local development only.

### Production (Oracle VM)
```bash
docker compose -f docker-compose.prod.yml up -d
```
Starts: Nginx, Cloudflare Tunnel, Prometheus, Grafana, AlertManager, Portainer, CloudBeaver, Watchtower.

### Monitoring Only
```bash
cd infrastructure
docker compose -f docker-compose.monitoring.yml up -d
```
Starts: Prometheus, Grafana, AlertManager. Lightweight monitoring stack.

## Container Map

| Container | Node | Port | Purpose |
|-----------|------|------|---------|
| navada-proxy | Oracle | 80/443/8080 | Nginx reverse proxy |
| navada-tunnel | Oracle | — | Cloudflare tunnel |
| navada-prometheus | Oracle | 9090 | Metrics collection |
| navada-grafana | Oracle | 3000 | Dashboards |
| navada-alertmanager | Oracle | 9093 | Alert routing |
| navada-portainer | Oracle | 9000 | Container management |
| cloudbeaver | Oracle | 8978 | Database admin |
| navada-watchtower | Oracle | — | Auto-update containers |

## Building the NAVADA Image

```bash
make build
# or
docker build -t navada-edge .
```

The Dockerfile uses Node.js 22, installs production dependencies, runs as non-root user, and includes a healthcheck.

## Monitoring Stack

### Prometheus
- Scrapes all 5 NAVADA nodes every 30-60s
- 30-day retention
- Alert rules for CPU, memory, disk, service down

### AlertManager
- Critical alerts: email + Telegram (< 1h repeat)
- Warning alerts: email only (4h repeat)
- Uses Zoho SMTP for email delivery

### Grafana
- Access: https://grafana.navada-edge-server.uk
- Default password: Set via GRAFANA_ADMIN_PASSWORD env var
- Auto-discovers Prometheus as data source

## Watchtower
Auto-updates container images daily. Cleans up old images automatically.

## Make Commands
Run `make help` from the repo root for all available commands.
