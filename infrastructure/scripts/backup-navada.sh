#!/bin/bash
# NAVADA Edge — Enterprise Backup Script
# Backs up all critical data across nodes to S3 + local
# Schedule: Daily via cron or Windows Task Scheduler
# Usage: bash backup-navada.sh [--full|--db-only|--config-only]

set -euo pipefail

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_ROOT="/tmp/navada-backup-${TIMESTAMP}"
S3_BUCKET="s3://navada-vision-eu-west-2/backups"
REGION="eu-west-2"
LOG_FILE="/tmp/navada-backup-${TIMESTAMP}.log"

echo "=== NAVADA Backup Started: ${TIMESTAMP} ===" | tee "$LOG_FILE"

mkdir -p "${BACKUP_ROOT}"/{db,config,cloudflare,pm2,secrets}

# --- 1. PostgreSQL (HP: 100.121.187.67:5433) ---
echo "[1/7] PostgreSQL dump..." | tee -a "$LOG_FILE"
PGPASSWORD="${POSTGRES_PASSWORD:-Navadaonline2026!}" pg_dump \
  -h 100.121.187.67 -p 5433 -U postgres -d navada \
  -F c -f "${BACKUP_ROOT}/db/navada-pg-${TIMESTAMP}.dump" 2>>"$LOG_FILE" || echo "WARN: PG dump failed" | tee -a "$LOG_FILE"

PGPASSWORD="${POSTGRES_PASSWORD:-Navadaonline2026!}" pg_dump \
  -h 100.121.187.67 -p 5433 -U postgres -d navada_pipeline \
  -F c -f "${BACKUP_ROOT}/db/navada_pipeline-pg-${TIMESTAMP}.dump" 2>>"$LOG_FILE" || echo "WARN: Pipeline PG dump failed" | tee -a "$LOG_FILE"

# --- 2. Cloudflare D1 Export ---
echo "[2/7] Cloudflare D1 export..." | tee -a "$LOG_FILE"
cd /tmp
for table in metrics edge_logs health_checks telegram_users conversations command_log response_cache; do
  npx wrangler d1 execute navada-edge --command "SELECT * FROM ${table}" --json 2>/dev/null \
    > "${BACKUP_ROOT}/cloudflare/d1-${table}-${TIMESTAMP}.json" || true
done

# --- 3. PM2 Config (EC2) ---
echo "[3/7] EC2 PM2 config..." | tee -a "$LOG_FILE"
ssh -o ConnectTimeout=5 -o BatchMode=yes -i ~/.ssh/aws-navada.pem ubuntu@3.11.119.181 \
  "pm2 save && cat ~/.pm2/dump.pm2" > "${BACKUP_ROOT}/pm2/ec2-pm2-dump.json" 2>>"$LOG_FILE" || echo "WARN: PM2 dump failed" | tee -a "$LOG_FILE"

# --- 4. Config Files ---
echo "[4/7] Config files..." | tee -a "$LOG_FILE"
cp -r infrastructure/nginx "${BACKUP_ROOT}/config/" 2>/dev/null || true
cp infrastructure/docker-compose.yml "${BACKUP_ROOT}/config/" 2>/dev/null || true
cp infrastructure/prometheus.yml "${BACKUP_ROOT}/config/" 2>/dev/null || true
cp infrastructure/alertmanager.yml "${BACKUP_ROOT}/config/" 2>/dev/null || true
cp infrastructure/alert-rules.yml "${BACKUP_ROOT}/config/" 2>/dev/null || true
cp docker-compose.prod.yml "${BACKUP_ROOT}/config/" 2>/dev/null || true
cp Dockerfile "${BACKUP_ROOT}/config/" 2>/dev/null || true

# --- 5. Knowledge Base + Bot Memory ---
echo "[5/7] Knowledge base..." | tee -a "$LOG_FILE"
cp -r Automation/kb "${BACKUP_ROOT}/config/" 2>/dev/null || true

# --- 6. Secrets Template (names only, no values) ---
echo "[6/7] Secrets template..." | tee -a "$LOG_FILE"
grep -oP '^[A-Z_]+=?' Automation/.env 2>/dev/null | sed 's/=.*/=/' > "${BACKUP_ROOT}/secrets/env-keys.txt" || true

# --- 7. Compress and Upload ---
echo "[7/7] Compressing and uploading to S3..." | tee -a "$LOG_FILE"
ARCHIVE="/tmp/navada-backup-${TIMESTAMP}.tar.gz"
tar -czf "$ARCHIVE" -C /tmp "navada-backup-${TIMESTAMP}"

aws s3 cp "$ARCHIVE" "${S3_BUCKET}/navada-backup-${TIMESTAMP}.tar.gz" --region "$REGION" 2>>"$LOG_FILE" \
  && echo "Uploaded to S3: ${S3_BUCKET}/navada-backup-${TIMESTAMP}.tar.gz" | tee -a "$LOG_FILE" \
  || echo "WARN: S3 upload failed" | tee -a "$LOG_FILE"

# Keep only last 7 local backups
ls -t /tmp/navada-backup-*.tar.gz 2>/dev/null | tail -n +8 | xargs rm -f 2>/dev/null || true

# --- Summary ---
BACKUP_SIZE=$(du -sh "$ARCHIVE" 2>/dev/null | cut -f1)
echo "" | tee -a "$LOG_FILE"
echo "=== Backup Complete ===" | tee -a "$LOG_FILE"
echo "Archive: ${ARCHIVE} (${BACKUP_SIZE})" | tee -a "$LOG_FILE"
echo "S3: ${S3_BUCKET}/navada-backup-${TIMESTAMP}.tar.gz" | tee -a "$LOG_FILE"
echo "Log: ${LOG_FILE}" | tee -a "$LOG_FILE"

# Cleanup temp
rm -rf "${BACKUP_ROOT}"
