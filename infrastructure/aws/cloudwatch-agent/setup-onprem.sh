#!/bin/bash
# ============================================================
# NAVADA Edge — CloudWatch Agent Setup for On-Premise Nodes
# Works on: Oracle (Ubuntu), HP (Git Bash/WSL), ASUS (Git Bash/WSL)
#
# Usage: ./setup-onprem.sh <node-name> <activation-id> <activation-code>
# ============================================================
set -euo pipefail

NODE_NAME="${1:-}"
ACTIVATION_ID="${2:-}"
ACTIVATION_CODE="${3:-}"
REGION="eu-west-2"

if [ -z "$NODE_NAME" ]; then
  echo "Usage: $0 <node-name> [activation-id] [activation-code]"
  echo "  node-name: oracle | hp | asus"
  echo "  activation-id/code: from SSM hybrid activation (optional)"
  exit 1
fi

echo "=== NAVADA CloudWatch Agent Setup — On-Premise ==="
echo "Node: $NODE_NAME | Region: $REGION"
echo ""

# Detect OS
OS_TYPE="linux"
if [[ "$(uname -s)" == *"MINGW"* ]] || [[ "$(uname -s)" == *"MSYS"* ]] || [[ "$(uname -s)" == *"NT"* ]]; then
  OS_TYPE="windows"
fi

if [ "$OS_TYPE" = "windows" ]; then
  echo "Windows detected. Use the PowerShell script setup-onprem.ps1 instead."
  echo "Or run this in WSL2."
  exit 1
fi

# 1. Install SSM Agent + register as hybrid instance
echo "[1/5] Installing SSM Agent..."
if ! command -v amazon-ssm-agent &>/dev/null; then
  sudo snap install amazon-ssm-agent --classic 2>/dev/null || {
    # Fallback for non-snap systems
    wget -q https://s3.${REGION}.amazonaws.com/amazon-ssm-${REGION}/latest/debian_amd64/amazon-ssm-agent.deb
    sudo dpkg -i amazon-ssm-agent.deb
    rm -f amazon-ssm-agent.deb
  }
fi

if [ -n "$ACTIVATION_ID" ] && [ -n "$ACTIVATION_CODE" ]; then
  echo "  Registering as managed instance..."
  sudo amazon-ssm-agent -register -code "$ACTIVATION_CODE" -id "$ACTIVATION_ID" -region "$REGION" -y || true
  sudo systemctl restart amazon-ssm-agent
  echo "  Registered."
else
  echo "  Skipping SSM registration (no activation provided)."
  echo "  Run 'create-log-groups.py' to create SSM activation first."
fi

# 2. Install CloudWatch Agent
echo "[2/5] Installing CloudWatch Agent..."
if ! command -v amazon-cloudwatch-agent-ctl &>/dev/null; then
  wget -q https://amazoncloudwatch-agent-${REGION}.s3.${REGION}.amazonaws.com/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
  sudo dpkg -i amazon-cloudwatch-agent.deb
  rm -f amazon-cloudwatch-agent.deb
  echo "  Installed."
else
  echo "  Already installed."
fi

# 3. Write agent config based on node
echo "[3/5] Writing agent config for $NODE_NAME..."

# Build log collection list based on node
case "$NODE_NAME" in
  oracle)
    LOG_PATHS=$(cat << 'EOF'
          {
            "file_path": "/var/log/syslog",
            "log_group_name": "/navada/oracle/system",
            "log_stream_name": "oracle-syslog",
            "retention_in_days": 30,
            "timezone": "UTC"
          },
          {
            "file_path": "/var/log/auth.log",
            "log_group_name": "/navada/oracle/auth",
            "log_stream_name": "oracle-auth",
            "retention_in_days": 30,
            "timezone": "UTC"
          },
          {
            "file_path": "/var/log/docker*.log",
            "log_group_name": "/navada/oracle/docker",
            "log_stream_name": "oracle-docker",
            "retention_in_days": 30,
            "timezone": "UTC"
          }
EOF
    )
    NETWORK_IFACES='["ens3", "tailscale0"]'
    ;;
  hp)
    LOG_PATHS=$(cat << 'EOF'
          {
            "file_path": "/var/log/syslog",
            "log_group_name": "/navada/hp/system",
            "log_stream_name": "hp-syslog",
            "retention_in_days": 30,
            "timezone": "UTC"
          },
          {
            "file_path": "/var/log/auth.log",
            "log_group_name": "/navada/hp/auth",
            "log_stream_name": "hp-auth",
            "retention_in_days": 30,
            "timezone": "UTC"
          }
EOF
    )
    NETWORK_IFACES='["eth0", "tailscale0"]'
    ;;
  asus)
    LOG_PATHS=$(cat << 'EOF'
          {
            "file_path": "/var/log/syslog",
            "log_group_name": "/navada/asus/system",
            "log_stream_name": "asus-syslog",
            "retention_in_days": 30,
            "timezone": "UTC"
          }
EOF
    )
    NETWORK_IFACES='["eth0", "tailscale0"]'
    ;;
  *)
    echo "Unknown node: $NODE_NAME"
    exit 1
    ;;
esac

NODE_UPPER=$(echo "$NODE_NAME" | tr '[:lower:]' '[:upper:]')

sudo mkdir -p /opt/aws/amazon-cloudwatch-agent/etc
sudo tee /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json > /dev/null << AGENT_EOF
{
  "agent": {
    "metrics_collection_interval": 60,
    "run_as_user": "root",
    "logfile": "/opt/aws/amazon-cloudwatch-agent/logs/amazon-cloudwatch-agent.log"
  },
  "metrics": {
    "namespace": "NAVADA/${NODE_UPPER}-System",
    "append_dimensions": {
      "NodeName": "NAVADA-${NODE_UPPER}"
    },
    "metrics_collected": {
      "cpu": {
        "measurement": ["cpu_usage_idle", "cpu_usage_user", "cpu_usage_system"],
        "metrics_collection_interval": 60,
        "totalcpu": true
      },
      "mem": {
        "measurement": ["mem_used_percent", "mem_available", "mem_total"],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": ["disk_used_percent", "disk_free"],
        "metrics_collection_interval": 300,
        "resources": ["/"],
        "ignore_file_system_types": ["sysfs", "devtmpfs", "tmpfs"]
      },
      "net": {
        "measurement": ["net_bytes_sent", "net_bytes_recv"],
        "metrics_collection_interval": 60,
        "resources": ${NETWORK_IFACES}
      },
      "processes": {
        "measurement": ["processes_running", "processes_total"]
      }
    }
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
${LOG_PATHS}
        ]
      }
    },
    "log_stream_name": "navada-${NODE_NAME}-default",
    "force_flush_interval": 30
  }
}
AGENT_EOF
echo "  Config written."

# 4. Start agent
echo "[4/5] Starting CloudWatch Agent..."
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m onPremise \
  -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
echo "  Agent started."

# 5. Enable on boot
echo "[5/5] Enabling on boot..."
sudo systemctl enable amazon-cloudwatch-agent || true
echo ""
echo "=== NAVADA-${NODE_UPPER} CloudWatch Agent setup complete ==="
echo "Metrics: NAVADA/${NODE_UPPER}-System namespace"
echo "Logs: /navada/${NODE_NAME}/* log groups"
