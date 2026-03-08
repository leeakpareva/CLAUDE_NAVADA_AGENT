#!/bin/bash
# NAVADA Failover Deactivation Script
# Runs on Oracle VM when HP laptop recovers.
# Syncs state back to HP, stops services, restores DNS.

set -e

FAILOVER_DIR="/home/ubuntu/navada-failover"
INFRA_DIR="$FAILOVER_DIR/infrastructure"
STATE_FILE="$FAILOVER_DIR/.failover-active"
LOG_FILE="$FAILOVER_DIR/logs/failover.log"
HP_TAILSCALE="100.121.187.67"

log() {
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] DEACTIVATE: $1" | tee -a "$LOG_FILE"
}

if [ ! -f "$STATE_FILE" ]; then
  log "Failover not active, nothing to do"
  exit 0
fi

log "=== FAILOVER DEACTIVATION STARTING ==="

# 1. Reverse-sync state back to HP (kb/ directory with updated conversation history)
log "Syncing state back to HP..."
rsync -az -e "ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10" \
  "$FAILOVER_DIR/Automation/kb/" \
  "leeak@${HP_TAILSCALE}:C:/Users/leeak/CLAUDE_NAVADA_AGENT/Automation/kb/" 2>/dev/null || \
  log "WARNING: Reverse sync failed (HP may not be fully ready)"

# Sync any logs generated during failover
rsync -az -e "ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10" \
  "$FAILOVER_DIR/logs/" \
  "leeak@${HP_TAILSCALE}:C:/Users/leeak/CLAUDE_NAVADA_AGENT/Automation/logs/failover/" 2>/dev/null || true

log "State synced back to HP"

# 2. Stop PM2 failover services
log "Stopping PM2 services..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
log "PM2 services stopped"

# 3. Stop failover Docker containers
log "Stopping failover Docker containers..."
cd "$INFRA_DIR"
docker compose --profile failover down 2>/dev/null || true
log "Docker containers stopped"

# 4. Restore Cloudflare DNS to HP tunnel
log "Restoring Cloudflare DNS to HP tunnel..."
source "$FAILOVER_DIR/Automation/.env"

CF_ZONE_ID="38050dc0"
CF_API_TOKEN="$CLOUDFLARE_API_TOKEN"
RECORD_NAME="api.navada-edge-server.uk"
HP_TUNNEL_ID="7c9e3c36-162a-4bb3-9f4e-8aab3f552636"
HP_TUNNEL_HOSTNAME="${HP_TUNNEL_ID}.cfargotunnel.com"

RECORD_ID=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records?name=${RECORD_NAME}&type=CNAME" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" | python3 -c "import sys,json; r=json.load(sys.stdin); print(r['result'][0]['id'] if r['result'] else '')" 2>/dev/null)

if [ -n "$RECORD_ID" ]; then
  curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records/${RECORD_ID}" \
    -H "Authorization: Bearer ${CF_API_TOKEN}" \
    -H "Content-Type: application/json" \
    --data "{\"type\":\"CNAME\",\"name\":\"${RECORD_NAME}\",\"content\":\"${HP_TUNNEL_HOSTNAME}\",\"proxied\":true}" > /dev/null
  log "DNS restored to HP tunnel: $HP_TUNNEL_HOSTNAME"
else
  log "WARNING: Could not find DNS record for $RECORD_NAME"
fi

# 5. Remove failover state file
rm -f "$STATE_FILE"
log "Failover state cleared"

# 6. Send Telegram notification
TELEGRAM_BOT_TOKEN=$(grep TELEGRAM_BOT_TOKEN "$FAILOVER_DIR/Automation/.env" | cut -d= -f2)
TELEGRAM_OWNER_ID=$(grep TELEGRAM_OWNER_ID "$FAILOVER_DIR/Automation/.env" | cut -d= -f2)

if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_OWNER_ID" ]; then
  curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -d "chat_id=${TELEGRAM_OWNER_ID}" \
    -d "parse_mode=HTML" \
    -d "text=<b>FAILBACK COMPLETE</b>%0A%0AHP laptop is back online. All services restored to primary server.%0A%0AState synced back to HP.%0ADeactivated: $(date -u +%H:%M' UTC')" > /dev/null
  log "Telegram notification sent to Lee"
fi

log "=== FAILOVER DEACTIVATION COMPLETE ==="
