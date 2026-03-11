#!/bin/bash
# NAVADA Edge — Disaster Recovery Script
# Restores full NAVADA infrastructure from backup
# Usage: bash recover-navada.sh [backup-file.tar.gz | latest]
#
# Recovery order:
#   1. PostgreSQL databases
#   2. Docker containers (Oracle)
#   3. PM2 processes (EC2)
#   4. Cloudflare Worker
#   5. Telegram webhook
#   6. Verify all nodes

set -euo pipefail

BACKUP_FILE="${1:-latest}"
S3_BUCKET="s3://navada-vision-eu-west-2/backups"
REGION="eu-west-2"
RECOVERY_DIR="/tmp/navada-recovery"

echo "=== NAVADA Disaster Recovery Started: $(date) ==="
echo ""

# --- 0. Get backup ---
if [ "$BACKUP_FILE" = "latest" ]; then
  echo "[0/6] Fetching latest backup from S3..."
  BACKUP_FILE=$(aws s3 ls "${S3_BUCKET}/" --region "$REGION" | sort | tail -1 | awk '{print $4}')
  if [ -z "$BACKUP_FILE" ]; then
    echo "ERROR: No backups found in S3"
    exit 1
  fi
  aws s3 cp "${S3_BUCKET}/${BACKUP_FILE}" "/tmp/${BACKUP_FILE}" --region "$REGION"
  BACKUP_FILE="/tmp/${BACKUP_FILE}"
fi

echo "Using backup: ${BACKUP_FILE}"
rm -rf "$RECOVERY_DIR"
mkdir -p "$RECOVERY_DIR"
tar -xzf "$BACKUP_FILE" -C "$RECOVERY_DIR" --strip-components=1

# --- 1. Restore PostgreSQL (HP: 100.121.187.67:5433) ---
echo ""
echo "[1/6] Restoring PostgreSQL..."
if [ -f "${RECOVERY_DIR}/db/navada-pg-"*.dump ]; then
  PGPASSWORD="${POSTGRES_PASSWORD:-Navadaonline2026!}" pg_restore \
    -h 100.121.187.67 -p 5433 -U postgres -d navada \
    --clean --if-exists \
    "${RECOVERY_DIR}"/db/navada-pg-*.dump 2>/dev/null && echo "  navada DB restored" || echo "  WARN: navada restore had errors (may be OK)"
fi
if [ -f "${RECOVERY_DIR}/db/navada_pipeline-pg-"*.dump ]; then
  PGPASSWORD="${POSTGRES_PASSWORD:-Navadaonline2026!}" pg_restore \
    -h 100.121.187.67 -p 5433 -U postgres -d navada_pipeline \
    --clean --if-exists \
    "${RECOVERY_DIR}"/db/navada_pipeline-pg-*.dump 2>/dev/null && echo "  navada_pipeline DB restored" || echo "  WARN: pipeline restore had errors"
fi

# --- 2. Restore Docker Containers (Oracle: 100.77.206.9) ---
echo ""
echo "[2/6] Restoring Docker containers on Oracle..."
if [ -d "${RECOVERY_DIR}/config/nginx" ]; then
  scp -i ~/.ssh/oracle-navada -r "${RECOVERY_DIR}/config/nginx" ubuntu@100.77.206.9:/tmp/navada-nginx/ 2>/dev/null || true
  ssh -i ~/.ssh/oracle-navada ubuntu@100.77.206.9 "cd /home/ubuntu/navada && docker compose down && docker compose up -d" 2>/dev/null \
    && echo "  Oracle Docker containers restarted" || echo "  WARN: Oracle Docker restart failed"
fi

# --- 3. Restore PM2 (EC2: 3.11.119.181) ---
echo ""
echo "[3/6] Restoring PM2 on EC2..."
if [ -f "${RECOVERY_DIR}/pm2/ec2-pm2-dump.json" ]; then
  scp -i ~/.ssh/aws-navada.pem "${RECOVERY_DIR}/pm2/ec2-pm2-dump.json" ubuntu@3.11.119.181:~/.pm2/dump.pm2
  ssh -i ~/.ssh/aws-navada.pem ubuntu@3.11.119.181 "pm2 resurrect" \
    && echo "  EC2 PM2 processes restored" || echo "  WARN: PM2 resurrect failed"
fi

# --- 4. Redeploy Cloudflare Worker ---
echo ""
echo "[4/6] Redeploying Cloudflare Worker..."
cd "$(dirname "$0")/../../Automation/cloudflare-worker" 2>/dev/null && npx wrangler deploy 2>/dev/null \
  && echo "  Cloudflare Worker deployed" || echo "  WARN: Worker deploy failed (may need manual)"

# --- 5. Re-register Telegram Webhook ---
echo ""
echo "[5/6] Re-registering Telegram webhook..."
WEBHOOK_URL="https://edge-api.navada-edge-server.uk/telegram/webhook"
TOKEN="${TELEGRAM_BOT_TOKEN}"
if [ -n "$TOKEN" ]; then
  RESULT=$(curl -s "https://api.telegram.org/bot${TOKEN}/setWebhook" \
    -H "Content-Type: application/json" \
    -d "{\"url\":\"${WEBHOOK_URL}\",\"allowed_updates\":[\"message\",\"callback_query\"]}")
  echo "  Webhook: ${RESULT}"
else
  echo "  WARN: TELEGRAM_BOT_TOKEN not set, skipping webhook"
fi

# --- 6. Verify All Nodes ---
echo ""
echo "[6/6] Verifying all nodes..."
echo ""

# EC2
ssh -o ConnectTimeout=5 -o BatchMode=yes -i ~/.ssh/aws-navada.pem ubuntu@3.11.119.181 "pm2 list --no-color 2>/dev/null | grep online | wc -l" 2>/dev/null \
  && echo "  EC2: OK" || echo "  EC2: FAIL"

# Oracle
ssh -o ConnectTimeout=5 -o BatchMode=yes -i ~/.ssh/oracle-navada ubuntu@100.77.206.9 "docker ps --format '{{.Names}}' 2>/dev/null | wc -l" 2>/dev/null \
  && echo "  Oracle: OK" || echo "  Oracle: FAIL"

# HP PostgreSQL
PGPASSWORD="${POSTGRES_PASSWORD:-Navadaonline2026!}" psql -h 100.121.187.67 -p 5433 -U postgres -d navada -c "SELECT 1" >/dev/null 2>&1 \
  && echo "  HP PostgreSQL: OK" || echo "  HP PostgreSQL: FAIL"

# Cloudflare Worker
curl -s --connect-timeout 5 "https://edge-api.navada-edge-server.uk/status?key=navada-edge-2026" | grep -q online \
  && echo "  Cloudflare Worker: OK" || echo "  Cloudflare Worker: FAIL"

# Telegram
curl -s --connect-timeout 5 "https://edge-api.navada-edge-server.uk/health/telegram?key=navada-edge-2026" | grep -q '"healthy":true' \
  && echo "  Telegram Bot: OK" || echo "  Telegram Bot: FAIL"

echo ""
echo "=== Recovery Complete: $(date) ==="

# Cleanup
rm -rf "$RECOVERY_DIR"
