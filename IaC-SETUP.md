# NAVADA Edge — Infrastructure as Code

## Architecture

```
NAVADA-CONTROL (ASUS)     — Dev workstation, Claude Code, local AI
NAVADA-EDGE-SERVER (HP)   — PostgreSQL :5433, SSH-only
NAVADA-COMPUTE (EC2)      — 24/7 compute, 5 PM2 services, 3.11.119.181
NAVADA-ROUTER (Oracle)    — 6 Docker containers, routing, observability
NAVADA-GATEWAY (Cloudflare) — Worker + D1, Telegram bot, DNS, CDN
```

## Quick Start

```bash
# Check all nodes
make status

# Full health check
make health

# View logs
make logs-ec2      # EC2 PM2 logs
make logs-oracle   # Oracle Docker logs
make logs-worker   # Cloudflare Worker live tail
make logs-d1       # D1 database logs

# SSH into any node
make ssh-ec2
make ssh-oracle
make ssh-hp
```

## Deployment

```bash
# Deploy Cloudflare Worker (Telegram bot)
make deploy-worker

# Deploy Oracle Docker stack
make deploy-oracle

# Deploy EC2 services
make deploy-ec2
```

## Backup and Recovery

```bash
# Full backup (PG, D1, PM2, configs) -> S3
make backup

# Restore from latest S3 backup
make recover
```

Backups include: PostgreSQL dumps, D1 exports, PM2 config, Nginx config, knowledge base, Prometheus/AlertManager config.

## Monitoring

```bash
# Start Prometheus + Grafana + AlertManager
make monitoring-up

# CloudWatch dashboards
make cw-dashboards

# AWS costs
make cw-costs
```

## File Structure

```
Dockerfile                              — Node.js app image
docker-compose.yml                      — Dev stack (PG, Redis, ChromaDB)
docker-compose.prod.yml                 — Full production stack (Oracle)
.env.example                            — Environment variables template
Makefile                                — Top-level infrastructure commands

infrastructure/
  docker-compose.yml                    — Existing Oracle stack (Nginx, tunnel, Portainer)
  docker-compose.monitoring.yml         — Standalone monitoring stack
  prometheus.yml                        — Prometheus config (all 5 nodes)
  alert-rules.yml                       — Alert rules (CPU, memory, disk, service down)
  alertmanager.yml                      — Alert routing (email + Telegram)
  nginx/                                — Nginx reverse proxy config
  scripts/
    backup-navada.sh                    — Full backup to S3
    recover-navada.sh                   — Disaster recovery from S3

infrastructure/aws/
  iac/
    cloudformation.yaml                 — AWS VPC/subnet CloudFormation template
    main.tf                             — Terraform equivalent
    cdk_stack.py                        — CDK Python equivalent
    cloudwatch-billing-dashboard.json   — Billing dashboard
  cost-monitor/
    cost_analysis.py                    — Python cost analysis script
    lambda_cost_alert.py                — Lambda daily cost alert
  scripts/
    inspect-resources.sh                — AWS resource inspection
    cost-report.sh                      — Cost report
```

## Recovery Time Objectives

| Component | RTO | Method |
|-----------|-----|--------|
| Telegram Bot | < 2 min | `make deploy-worker` (Cloudflare redeploy) |
| EC2 Services | < 5 min | `pm2 resurrect` from saved dump |
| Oracle Containers | < 5 min | `docker compose up -d` from config |
| PostgreSQL | < 10 min | `pg_restore` from S3 backup |
| Full Infrastructure | < 20 min | `bash recover-navada.sh latest` |
