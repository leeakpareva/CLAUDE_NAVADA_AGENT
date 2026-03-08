#!/bin/bash
# ============================================================
# NAVADA BACKUP ULTRA — HP Server weekly backup to Oracle VM
# Run this ON the HP server (or remotely via SSH from ASUS)
# ============================================================

set -euo pipefail

NODE_NAME="HP"
ORACLE_HOST="ubuntu@100.77.206.9"
BACKUP_ROOT="/opt/navada-backup-ultra"
BACKUP_DIR="${BACKUP_ROOT}/${NODE_NAME}"
TIMESTAMP=$(date +%Y-%m-%d_%H%M)
LOG_FILE="/tmp/navada-backup-ultra-${NODE_NAME}-${TIMESTAMP}.log"

CW_NAMESPACE="NAVADA/BackupUltra"
CW_REGION="eu-west-2"
CW_TMP="/tmp/navada-backup-metrics.json"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"; }

push_metric() {
  local metric_name="$1" value="$2" unit="${3:-None}"
  cat > "$CW_TMP" << EOFMETRIC
[{"MetricName":"${metric_name}","Value":${value},"Unit":"${unit}","Dimensions":[{"Name":"Node","Value":"${NODE_NAME}"}],"Timestamp":"$(date -u +%Y-%m-%dT%H:%M:%SZ)"}]
EOFMETRIC
  aws cloudwatch put-metric-data \
    --namespace "$CW_NAMESPACE" \
    --region "$CW_REGION" \
    --metric-data "file://${CW_TMP}" 2>/dev/null || true
}

# ── Source directories (HP Server — adjust paths as needed) ──
SOURCES=(
  "/c/Users/leeak/CLAUDE_NAVADA_AGENT"
  "/c/Users/leeak/Documents"
  "/c/Users/leeak/Desktop"
  "/c/Users/leeak/.ssh"
  "/c/Users/leeak/.claude"
  "/c/Users/leeak/.gitconfig"
)

EXCLUDES=(
  --exclude='node_modules/'
  --exclude='.git/objects/'
  --exclude='__pycache__/'
  --exclude='.venv/'
  --exclude='*.pyc'
  --exclude='.next/'
  --exclude='dist/'
  --exclude='build/'
  --exclude='.cache/'
  --exclude='*.log'
  --exclude='*.tmp'
  --exclude='Thumbs.db'
  --exclude='desktop.ini'
  --exclude='*.msi'
)

log "=========================================="
log "NAVADA BACKUP ULTRA — ${NODE_NAME}"
log "Target: ${ORACLE_HOST}:${BACKUP_DIR}"
log "=========================================="

push_metric "BackupStarted" 1

ssh -o ConnectTimeout=15 "$ORACLE_HOST" "sudo mkdir -p '${BACKUP_DIR}' && sudo chown ubuntu:ubuntu '${BACKUP_DIR}'" 2>&1 | tee -a "$LOG_FILE"
if [ $? -ne 0 ]; then
  log "ERROR: Cannot reach Oracle VM"
  push_metric "BackupSuccess" 0
  push_metric "BackupFailed" 1
  exit 1
fi

TOTAL_SIZE=0; FAILED=0; SYNCED=0

for SRC in "${SOURCES[@]}"; do
  if [ -e "$SRC" ]; then
    DEST_SUBDIR=$(echo "$SRC" | sed 's|^/c/Users/leeak/||; s|^/c/||')
    DEST="${BACKUP_DIR}/${DEST_SUBDIR}"
    log "Syncing: ${SRC} -> ${DEST}"
    ssh "$ORACLE_HOST" "mkdir -p '$(dirname ${DEST})'" 2>/dev/null
    rsync -avz --delete --timeout=300 "${EXCLUDES[@]}" "$SRC" "${ORACLE_HOST}:${DEST}/" 2>&1 | tail -3 | tee -a "$LOG_FILE"
    if [ $? -eq 0 ]; then
      ((SYNCED++))
      SRC_SIZE=$(du -sm "$SRC" 2>/dev/null | cut -f1 || echo 0)
      TOTAL_SIZE=$((TOTAL_SIZE + SRC_SIZE))
      log "OK: ${SRC} (${SRC_SIZE} MB)"
    else
      ((FAILED++)); log "FAILED: ${SRC}"
    fi
  else
    log "SKIP (not found): ${SRC}"
  fi
done

ssh "$ORACLE_HOST" "cat > '${BACKUP_DIR}/BACKUP_MANIFEST.txt'" << EOFMANIFEST
NAVADA BACKUP ULTRA — ${NODE_NAME}
===================================
Backup Date: $(date '+%Y-%m-%d %H:%M:%S %Z')
Node: ${NODE_NAME} (HP EliteBook 840 G5)
Tailscale IP: 100.121.187.67
Dirs Synced: ${SYNCED}
Dirs Failed: ${FAILED}
Total Size: ~${TOTAL_SIZE} MB
Schedule: Weekly (every Sunday)
EOFMANIFEST

REMOTE_SIZE=$(ssh "$ORACLE_HOST" "du -sm '${BACKUP_DIR}' 2>/dev/null | cut -f1" || echo 0)

log "=========================================="
log "BACKUP COMPLETE — Synced: ${SYNCED} | Failed: ${FAILED} | Size: ${REMOTE_SIZE} MB"
log "=========================================="

push_metric "BackupSuccess" 1
push_metric "BackupFailed" 0
push_metric "BackupSizeMB" "$REMOTE_SIZE" "Megabytes"
push_metric "BackupDirsSynced" "$SYNCED" "Count"
push_metric "BackupDirsFailed" "$FAILED" "Count"
push_metric "LastBackupTimestamp" "$(date +%s)" "Seconds"
