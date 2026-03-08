#!/bin/bash
# Oracle VM Auto-Sleep - runs at midnight UTC via cron
# Gracefully stops Docker containers, then shuts down
# Cron: 0 0 * * * /opt/navada-scripts/oracle-auto-sleep.sh

LOG="/opt/navada-logs/auto-sleep.log"
mkdir -p /opt/navada-logs

echo "[$(date)] Auto-sleep initiated" >> "$LOG"

# Stop all Docker containers gracefully
CONTAINERS=$(sudo docker ps -q)
if [ -n "$CONTAINERS" ]; then
  sudo docker stop $CONTAINERS 2>/dev/null
  echo "[$(date)] Docker containers stopped" >> "$LOG"
else
  echo "[$(date)] No running containers to stop" >> "$LOG"
fi

# Shutdown the VM
echo "[$(date)] Shutting down VM" >> "$LOG"
sudo shutdown -h now
