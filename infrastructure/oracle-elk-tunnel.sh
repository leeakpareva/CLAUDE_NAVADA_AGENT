#!/bin/bash
# NAVADA: SSH tunnels to Oracle VM for ELK access
# Forwards local ports to Oracle VM ELK services via Tailscale
# Run: bash oracle-elk-tunnel.sh

ORACLE_HOST="oracle-navada"

echo "=== NAVADA Oracle ELK Tunnels ==="

# Kill existing tunnels
pkill -f "ssh.*-L 9200:localhost:9200.*oracle-navada" 2>/dev/null
pkill -f "ssh.*-L 5601:localhost:5601.*oracle-navada" 2>/dev/null
sleep 1

# Elasticsearch: localhost:9200 -> Oracle:9200
ssh -f -N -L 9200:localhost:9200 "$ORACLE_HOST" && echo "[OK] Elasticsearch tunnel: localhost:9200 -> Oracle:9200" || echo "[ERROR] ES tunnel failed"

# Kibana: localhost:5601 -> Oracle:5601
ssh -f -N -L 5601:localhost:5601 "$ORACLE_HOST" && echo "[OK] Kibana tunnel: localhost:5601 -> Oracle:5601" || echo "[ERROR] Kibana tunnel failed"

echo ""
echo "Test: curl http://localhost:9200/_cluster/health"
echo "Kibana: http://localhost:5601/kibana/"
