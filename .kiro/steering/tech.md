---
inclusion: always
---

# NAVADA Edge — Technology Stack

## Runtime
- **Node.js 22** (primary language across all nodes)
- **Python 3** (data science, trading, economy reports) — use `py` on Windows
- **Cloudflare Workers** (edge compute, D1 SQLite, R2 storage)

## AI Models
- **Claude Sonnet 4.6 / Opus 4.6** via Anthropic API (primary)
- **OpenAI GPT-4o / DALL-E 3** (image generation, fallback)
- **Cloudflare Workers AI** (free Flux image generation)
- **AWS Bedrock** (Claude on AWS)
- **AWS Rekognition** (face detection, known face search)
- **AWS SageMaker** (YOLOv8n object detection)

## Databases
- **Cloudflare D1** (navada-edge): metrics, logs, health, conversations, command_log
- **PostgreSQL 17** (HP :5433): navada_pipeline, prospects, leads
- **SQLite** (LeadPipeline): local pipeline.db
- **DynamoDB** (AWS): navada-edge-logs, navada-faces, navada-vision-log

## Infrastructure
- **PM2** on EC2 (process management)
- **Docker** on Oracle (Nginx, Grafana, Prometheus, Portainer, CloudBeaver)
- **Tailscale** mesh VPN across all nodes
- **Cloudflare** DNS, CDN, Workers, D1, R2, Stream, WAF

## Key Libraries
- playwright (E2E testing on EC2)
- @aws-sdk/* (CloudWatch, DynamoDB, SageMaker, Rekognition, S3)
- node-telegram-bot-api patterns (webhook-based)
- Zoho SMTP/IMAP (email)
- Twilio (SMS, voice)
- Hunter.io (email finding)

## Conventions
- Conventional commits (feat:, fix:, docs:)
- No em dashes in external content
- No client names in outreach
- HTML-formatted emails always (never plain text)
- Secrets in .env files, never hardcoded
