#!/bin/bash
# ============================================================
# NAVADA BACKUP ULTRA — Run ON Oracle VM
# Pulls backups from ASUS and HP laptops via Tailscale SSH
# Schedule via cron on Oracle: every Sunday at 03:00
# ============================================================

set -uo pipefail

BACKUP_ROOT="/opt/navada-backup-ultra"
LOG_DIR="/opt/navada-backup-ultra/logs"
mkdir -p "$LOG_DIR"

TIMESTAMP=$(date +%Y-%m-%d_%H%M)
LOG_FILE="${LOG_DIR}/backup-${TIMESTAMP}.log"

CW_NAMESPACE="NAVADA/BackupUltra"
CW_REGION="eu-west-2"
CW_TMP="/tmp/navada-backup-metrics.json"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"; }

push_metric() {
  local metric_name="$1" value="$2" node="$3" unit="${4:-None}"
  cat > "$CW_TMP" << EOF
[{"MetricName":"${metric_name}","Value":${value},"Unit":"${unit}","Dimensions":[{"Name":"Node","Value":"${node}"}],"Timestamp":"$(date -u +%Y-%m-%dT%H:%M:%SZ)"}]
EOF
  aws cloudwatch put-metric-data \
    --namespace "$CW_NAMESPACE" \
    --region "$CW_REGION" \
    --metric-data "file://${CW_TMP}" 2>/dev/null || true
}

# ── Backup a single node (uses scp -r for Windows compat) ──
backup_node() {
  local NODE_NAME="$1"
  local SSH_HOST="$2"
  local SSH_USER="$3"
  shift 3
  local SOURCES=("$@")

  local DEST="${BACKUP_ROOT}/${NODE_NAME}"
  mkdir -p "$DEST"

  log "=========================================="
  log "BACKUP: ${NODE_NAME} from ${SSH_USER}@${SSH_HOST}"
  log "=========================================="

  push_metric "BackupStarted" 1 "$NODE_NAME"

  # Check if node is reachable
  if ! ssh -o ConnectTimeout=15 -o BatchMode=yes "${SSH_USER}@${SSH_HOST}" "echo ok" >/dev/null 2>&1; then
    log "WARNING: ${NODE_NAME} is offline — skipping"
    push_metric "BackupSuccess" 0 "$NODE_NAME"
    push_metric "BackupFailed" 1 "$NODE_NAME"
    return 1
  fi

  local SYNCED=0
  local FAILED=0

  for SRC in "${SOURCES[@]}"; do
    # Derive a clean subfolder name from the path
    # e.g. C:/Users/leeak/Documents -> Documents
    local DIR_NAME
    DIR_NAME=$(basename "$SRC")
    local DEST_SUB="${DEST}/${DIR_NAME}"
    mkdir -p "$DEST_SUB"

    log "Pulling: ${SRC} -> ${DEST_SUB}"

    # Use scp -r (works with Windows OpenSSH + forward slashes)
    scp -r -o BatchMode=yes "${SSH_USER}@${SSH_HOST}:${SRC}" "${DEST}/" >> "$LOG_FILE" 2>&1

    if [ $? -eq 0 ]; then
      ((SYNCED++))
      log "OK: ${SRC}"
    else
      ((FAILED++))
      log "FAILED: ${SRC}"
    fi
  done

  # Clean up excluded dirs that scp copied (scp can't exclude)
  find "$DEST" -type d \( -name 'node_modules' -o -name '__pycache__' -o -name '.venv' -o -name '.next' -o -name '.cache' \) -exec rm -rf {} + 2>/dev/null
  find "$DEST" -type f \( -name '*.pyc' -o -name '*.tmp' -o -name '*.msi' -o -name '*.iso' -o -name 'Thumbs.db' -o -name 'desktop.ini' \) -delete 2>/dev/null

  # Write manifest
  local TOTAL_SIZE
  TOTAL_SIZE=$(du -sm "$DEST" 2>/dev/null | cut -f1 || echo 0)

  cat > "${DEST}/BACKUP_MANIFEST.txt" << EOFMANIFEST
NAVADA BACKUP ULTRA — ${NODE_NAME}
===================================
Backup Date: $(date '+%Y-%m-%d %H:%M:%S %Z')
Node: ${NODE_NAME}
Source: ${SSH_USER}@${SSH_HOST}
Dirs Synced: ${SYNCED}
Dirs Failed: ${FAILED}
Total Size: ${TOTAL_SIZE} MB
Schedule: Weekly (Sunday 03:00 UTC)

Contents:
$(for SRC in "${SOURCES[@]}"; do echo "  ${SRC}"; done)
EOFMANIFEST

  log "DONE: ${NODE_NAME} — Synced=${SYNCED} Failed=${FAILED} Size=${TOTAL_SIZE}MB"

  push_metric "BackupSuccess" 1 "$NODE_NAME"
  push_metric "BackupFailed" 0 "$NODE_NAME"
  push_metric "BackupSizeMB" "$TOTAL_SIZE" "$NODE_NAME" "Megabytes"
  push_metric "BackupDirsSynced" "$SYNCED" "$NODE_NAME" "Count"
  push_metric "BackupDirsFailed" "$FAILED" "$NODE_NAME" "Count"
}

# ═══════════════════════════════════════════
# NODE DEFINITIONS
# ═══════════════════════════════════════════

log "NAVADA BACKUP ULTRA — starting weekly backup run"

# ── ASUS (NAVADA2025) ──
ASUS_SOURCES=(
  "C:/Users/leeak/CLAUDE_NAVADA_AGENT"
  "C:/Users/leeak/Documents"
  "C:/Users/leeak/Desktop"
  "C:/Users/leeak/.ssh"
  "C:/Users/leeak/.claude"
  "C:/Users/leeak/opencode"
)
backup_node "ASUS" "100.88.118.128" "leeak" "${ASUS_SOURCES[@]}"

# ── HP Server ──
HP_SOURCES=(
  "C:/Users/leeak/CLAUDE_NAVADA_AGENT"
  "C:/Users/leeak/Documents"
  "C:/Users/leeak/Desktop"
  "C:/Users/leeak/.ssh"
  "C:/Users/leeak/.claude"
)
backup_node "HP" "100.121.187.67" "leeak" "${HP_SOURCES[@]}"

# ── Summary ──
TOTAL_BACKUP=$(du -sm "$BACKUP_ROOT" 2>/dev/null | cut -f1 || echo 0)
log "=========================================="
log "ALL BACKUPS COMPLETE — Total: ${TOTAL_BACKUP} MB on Oracle VM"
log "=========================================="

# Cleanup old logs (keep last 30)
ls -t "${LOG_DIR}"/backup-*.log 2>/dev/null | tail -n +31 | xargs rm -f 2>/dev/null
