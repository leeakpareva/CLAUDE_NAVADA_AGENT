#!/bin/bash
# NAVADA Failover Activation Script
# Runs on Oracle VM when HP laptop is detected offline.
# Called by EC2 health monitor or manually via /failover command.

set -e

FAILOVER_DIR="/home/ubuntu/navada-failover"
INFRA_DIR="$FAILOVER_DIR/infrastructure"
STATE_FILE="$FAILOVER_DIR/.failover-active"
LOG_FILE="$FAILOVER_DIR/logs/failover.log"

log() {
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] ACTIVATE: $1" | tee -a "$LOG_FILE"
}

# Prevent double activation
if [ -f "$STATE_FILE" ]; then
  log "Failover already active, skipping"
  exit 0
fi

mkdir -p "$FAILOVER_DIR/logs"
log "=== FAILOVER ACTIVATION STARTING ==="

# 1. Update Cloudflare DNS - switch api.navada-edge-server.uk CNAME to Oracle tunnel
log "Switching Cloudflare DNS to Oracle tunnel..."
source "$FAILOVER_DIR/Automation/.env"

# Get the DNS record ID for api.navada-edge-server.uk
CF_ZONE_ID="38050dc0"
CF_API_TOKEN="$CLOUDFLARE_API_TOKEN"
RECORD_NAME="api.navada-edge-server.uk"

# Get current DNS record
RECORD_ID=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records?name=${RECORD_NAME}&type=CNAME" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" | python3 -c "import sys,json; r=json.load(sys.stdin); print(r['result'][0]['id'] if r['result'] else '')" 2>/dev/null)

if [ -n "$RECORD_ID" ]; then
  # Read Oracle tunnel ID from infrastructure .env
  source "$INFRA_DIR/.env"
  ORACLE_TUNNEL_HOSTNAME="${ORACLE_TUNNEL_ID}.cfargotunnel.com"

  curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records/${RECORD_ID}" \
    -H "Authorization: Bearer ${CF_API_TOKEN}" \
    -H "Content-Type: application/json" \
    --data "{\"type\":\"CNAME\",\"name\":\"${RECORD_NAME}\",\"content\":\"${ORACLE_TUNNEL_HOSTNAME}\",\"proxied\":true}" > /dev/null
  log "DNS switched to Oracle tunnel: $ORACLE_TUNNEL_HOSTNAME"
else
  log "WARNING: Could not find DNS record for $RECORD_NAME"
fi

# 2. Start failover Docker containers (Nginx + Cloudflare tunnel)
log "Starting failover Docker containers..."
cd "$INFRA_DIR"
docker compose --profile failover up -d
log "Docker containers started"

# 3. Start critical PM2 services
log "Starting PM2 services..."
cd "$FAILOVER_DIR"

# Start telegram-bot
pm2 start ecosystem.config.js --only telegram-bot
log "telegram-bot started"

# Start inbox-responder
pm2 start ecosystem.config.js --only inbox-responder
log "inbox-responder started"

# Start trading services (Tier 2)
pm2 start ecosystem.config.js --only trading-scheduler
log "trading-scheduler started"

# Trading API needs Python - check if available
if command -v python3 &> /dev/null; then
  pm2 start ecosystem.config.js --only trading-api
  log "trading-api started"
else
  log "WARNING: Python3 not found, skipping trading-api"
fi

pm2 save

# 4. Mark failover as active
echo "{\"activated\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"reason\":\"HP offline\"}" > "$STATE_FILE"
log "Failover state file created"

# 5. Wait for telegram-bot to start, then send notification
sleep 5
log "=== FAILOVER ACTIVATION COMPLETE ==="

# Try to send Telegram notification directly via API
TELEGRAM_BOT_TOKEN=$(grep TELEGRAM_BOT_TOKEN "$FAILOVER_DIR/Automation/.env" | cut -d= -f2)
TELEGRAM_OWNER_ID=$(grep TELEGRAM_OWNER_ID "$FAILOVER_DIR/Automation/.env" | cut -d= -f2)

if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_OWNER_ID" ]; then
  curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -d "chat_id=${TELEGRAM_OWNER_ID}" \
    -d "parse_mode=HTML" \
    -d "text=<b>FAILOVER ACTIVE</b>%0A%0AHP laptop is offline. Critical services running on Oracle VM.%0A%0A<b>Active services:</b>%0A- telegram-bot%0A- inbox-responder%0A- trading-scheduler%0A%0AActivated: $(date -u +%H:%M' UTC')%0AUse /failover-status to check. Use /failback when HP is back." > /dev/null
  log "Telegram notification sent to Lee"
fi

log "All done. Failover is live."
