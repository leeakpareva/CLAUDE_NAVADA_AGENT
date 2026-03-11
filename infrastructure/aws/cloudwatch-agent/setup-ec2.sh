#!/bin/bash
# ============================================================
# NAVADA Edge — CloudWatch Agent Setup for EC2 (NAVADA-COMPUTE)
# Run ON the EC2 instance (ubuntu@3.11.119.181)
# ============================================================
set -euo pipefail

REGION="eu-west-2"
NODE_NAME="ec2"
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)

echo "=== NAVADA CloudWatch Agent Setup ==="
echo "Node: NAVADA-COMPUTE ($INSTANCE_ID)"
echo "Region: $REGION"
echo ""

# 1. Install CloudWatch Agent
echo "[1/5] Installing CloudWatch Agent..."
if ! command -v amazon-cloudwatch-agent-ctl &>/dev/null; then
  wget -q https://amazoncloudwatch-agent-${REGION}.s3.${REGION}.amazonaws.com/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
  sudo dpkg -i amazon-cloudwatch-agent.deb
  rm -f amazon-cloudwatch-agent.deb
  echo "  Installed."
else
  echo "  Already installed."
fi

# 2. Install SSM Agent (if not present)
echo "[2/5] Checking SSM Agent..."
if ! systemctl is-active --quiet amazon-ssm-agent 2>/dev/null; then
  sudo snap install amazon-ssm-agent --classic || true
  sudo systemctl enable amazon-ssm-agent
  sudo systemctl start amazon-ssm-agent
  echo "  SSM Agent started."
else
  echo "  SSM Agent already running."
fi

# 3. Write CloudWatch Agent config
echo "[3/5] Writing agent config..."
sudo mkdir -p /opt/aws/amazon-cloudwatch-agent/etc
sudo tee /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json > /dev/null << 'AGENT_CONFIG'
{
  "agent": {
    "metrics_collection_interval": 60,
    "run_as_user": "root",
    "logfile": "/opt/aws/amazon-cloudwatch-agent/logs/amazon-cloudwatch-agent.log"
  },
  "metrics": {
    "namespace": "NAVADA/EC2-System",
    "append_dimensions": {
      "InstanceId": "${aws:InstanceId}",
      "NodeName": "NAVADA-COMPUTE"
    },
    "aggregation_dimensions": [["InstanceId"], ["NodeName"]],
    "metrics_collected": {
      "cpu": {
        "measurement": ["cpu_usage_idle", "cpu_usage_user", "cpu_usage_system", "cpu_usage_iowait"],
        "metrics_collection_interval": 60,
        "totalcpu": true,
        "resources": ["*"]
      },
      "mem": {
        "measurement": ["mem_used_percent", "mem_available", "mem_total", "mem_used"],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": ["disk_used_percent", "disk_free", "disk_total", "disk_inodes_free"],
        "metrics_collection_interval": 300,
        "resources": ["/", "/home"],
        "ignore_file_system_types": ["sysfs", "devtmpfs", "tmpfs", "squashfs", "overlay"]
      },
      "diskio": {
        "measurement": ["diskio_reads", "diskio_writes", "diskio_read_bytes", "diskio_write_bytes"],
        "metrics_collection_interval": 300,
        "resources": ["*"]
      },
      "net": {
        "measurement": ["net_bytes_sent", "net_bytes_recv", "net_packets_sent", "net_packets_recv", "net_err_in", "net_err_out"],
        "metrics_collection_interval": 60,
        "resources": ["eth0", "tailscale0"]
      },
      "swap": {
        "measurement": ["swap_used_percent", "swap_used", "swap_free"],
        "metrics_collection_interval": 300
      },
      "processes": {
        "measurement": ["processes_running", "processes_sleeping", "processes_zombies", "processes_total"]
      },
      "netstat": {
        "measurement": ["netstat_tcp_established", "netstat_tcp_listen", "netstat_tcp_time_wait"],
        "metrics_collection_interval": 300
      }
    }
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/syslog",
            "log_group_name": "/navada/ec2/system",
            "log_stream_name": "{instance_id}-syslog",
            "retention_in_days": 30,
            "timezone": "UTC"
          },
          {
            "file_path": "/var/log/auth.log",
            "log_group_name": "/navada/ec2/auth",
            "log_stream_name": "{instance_id}-auth",
            "retention_in_days": 30,
            "timezone": "UTC"
          },
          {
            "file_path": "/var/log/cloud-init-output.log",
            "log_group_name": "/navada/ec2/cloud-init",
            "log_stream_name": "{instance_id}",
            "retention_in_days": 30,
            "timezone": "UTC"
          },
          {
            "file_path": "/home/ubuntu/.pm2/logs/*.log",
            "log_group_name": "/navada/ec2/pm2",
            "log_stream_name": "{instance_id}-pm2",
            "retention_in_days": 30,
            "timezone": "UTC",
            "multi_line_start_pattern": "^[0-9]|^\\["
          },
          {
            "file_path": "/opt/aws/amazon-cloudwatch-agent/logs/amazon-cloudwatch-agent.log",
            "log_group_name": "/navada/ec2/agent",
            "log_stream_name": "{instance_id}-cwagent",
            "retention_in_days": 14,
            "timezone": "UTC"
          }
        ]
      }
    },
    "log_stream_name": "navada-compute-default",
    "force_flush_interval": 15
  }
}
AGENT_CONFIG
echo "  Config written."

# 4. Start the agent
echo "[4/5] Starting CloudWatch Agent..."
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
echo "  Agent started."

# 5. Verify
echo "[5/5] Verifying..."
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a status
echo ""
echo "=== NAVADA-COMPUTE CloudWatch Agent setup complete ==="
echo "Metrics: NAVADA/EC2-System namespace"
echo "Logs: /navada/ec2/* log groups"
