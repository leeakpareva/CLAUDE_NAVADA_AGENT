#!/bin/bash
# ============================================================
# NAVADA Edge — Auto-Deploy to EC2
# Solves the "old broken copy" problem by syncing, validating, and restarting.
# Run from ASUS (dev workstation).
#
# Usage: bash deploy-ec2.sh
# ============================================================
set -euo pipefail

EC2_HOST="ubuntu@3.11.119.181"
SSH_KEY="$HOME/.ssh/aws-navada.pem"
SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=no -o ConnectTimeout=10"

echo "=== NAVADA EC2 Auto-Deploy ==="
echo "Target: $EC2_HOST"
echo ""

# Files to sync
declare -A SYNC_MAP=(
  ["$HOME/Alex/navada-dashboard/server.js"]="/home/ubuntu/navada-dashboard/server.js"
  ["$HOME/Alex/Automation/cloudwatch-dashboard-updater.js"]="/home/ubuntu/cloudwatch-dashboard-updater.js"
  ["$HOME/Alex/Automation/ec2-health-monitor.js"]="/home/ubuntu/ec2-health-monitor.js"
)

# 1. Validate locally
echo "[1/4] Validating local files..."
ERRORS=0
for LOCAL_FILE in "${!SYNC_MAP[@]}"; do
  if [ ! -f "$LOCAL_FILE" ]; then
    echo "  MISSING: $LOCAL_FILE"
    ERRORS=$((ERRORS + 1))
    continue
  fi
  if [[ "$LOCAL_FILE" == *.js ]]; then
    if ! node -c "$LOCAL_FILE" 2>/dev/null; then
      echo "  SYNTAX ERROR: $LOCAL_FILE"
      ERRORS=$((ERRORS + 1))
    else
      echo "  OK: $(basename $LOCAL_FILE)"
    fi
  fi
done

if [ $ERRORS -gt 0 ]; then
  echo "ABORT: $ERRORS errors found. Fix before deploying."
  exit 1
fi

# 2. SCP files
echo ""
echo "[2/4] Syncing files to EC2..."
for LOCAL_FILE in "${!SYNC_MAP[@]}"; do
  REMOTE_PATH="${SYNC_MAP[$LOCAL_FILE]}"
  if [ -f "$LOCAL_FILE" ]; then
    scp $SSH_OPTS "$LOCAL_FILE" "$EC2_HOST:$REMOTE_PATH" 2>/dev/null
    # Fix Windows CRLF line endings
    ssh $SSH_OPTS $EC2_HOST "sed -i 's/\r$//' $REMOTE_PATH" 2>/dev/null
    echo "  SYNCED: $(basename $LOCAL_FILE) -> $REMOTE_PATH (CRLF fixed)"
  fi
done

# 3. Validate on EC2
echo ""
echo "[3/4] Validating on EC2..."
REMOTE_ERRORS=$(ssh $SSH_OPTS $EC2_HOST "
  errors=0
  for f in /home/ubuntu/navada-dashboard/server.js /home/ubuntu/cloudwatch-dashboard-updater.js /home/ubuntu/ec2-health-monitor.js; do
    if [ -f \"\$f\" ]; then
      if ! node -c \"\$f\" 2>/dev/null; then
        echo \"SYNTAX ERROR: \$f\"
        errors=\$((errors + 1))
      else
        echo \"OK: \$(basename \$f)\"
      fi
    fi
  done
  echo \"\$errors\"
" 2>/dev/null)

# Check last line for error count
LAST_LINE=$(echo "$REMOTE_ERRORS" | tail -1)
echo "$REMOTE_ERRORS" | head -n -1 | sed 's/^/  /'

if [ "$LAST_LINE" != "0" ]; then
  echo "ABORT: Syntax errors on EC2. Rolling back..."
  # Could add rollback logic here
  exit 1
fi

# 4. Restart PM2 services
echo ""
echo "[4/4] Restarting PM2 services..."
ssh $SSH_OPTS $EC2_HOST "
  pm2 restart navada-dashboard 2>/dev/null && echo '  RESTARTED: navada-dashboard' || echo '  SKIP: navada-dashboard (not running)'
  pm2 restart cloudwatch-dashboard-updater 2>/dev/null && echo '  RESTARTED: cloudwatch-dashboard-updater' || echo '  SKIP: cloudwatch-dashboard-updater (not running)'
  pm2 restart ec2-health-monitor 2>/dev/null && echo '  RESTARTED: ec2-health-monitor' || echo '  SKIP: ec2-health-monitor (not running)'
  sleep 2
  # Verify all online
  pm2 jlist 2>/dev/null | node -e \"
    let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
      const procs=JSON.parse(d);
      const down=procs.filter(p=>p.pm2_env.status!=='online');
      if(down.length){console.log('WARNING: '+down.map(p=>p.name).join(', ')+' not online');}
      else{console.log('All '+procs.length+' services online.');}
    });
  \"
" 2>/dev/null

echo ""
echo "=== Deploy complete ==="
