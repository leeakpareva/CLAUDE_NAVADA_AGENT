#!/bin/bash
# NAVADA Node Bootstrap — Run on any new Linux node to join the mesh
# Usage: curl -sL <url> | bash -s -- --name <NODE_NAME>
# Prerequisites: Ubuntu 22.04+, root or sudo access

set -euo pipefail

NODE_NAME="${1:-navada-node}"
TAILSCALE_AUTH_KEY="${TAILSCALE_AUTH_KEY:-}"

echo "=== NAVADA Edge Bootstrap ==="
echo "Node: $NODE_NAME"
echo ""

# System updates
echo "[1/6] Updating system..."
apt-get update -qq && apt-get upgrade -y -qq

# Docker
echo "[2/6] Installing Docker..."
if ! command -v docker &>/dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    usermod -aG docker "$USER"
else
    echo "  Docker already installed"
fi

# Docker Compose plugin
echo "[3/6] Ensuring Docker Compose plugin..."
apt-get install -y -qq docker-compose-plugin 2>/dev/null || true

# Node.js 22 LTS
echo "[4/6] Installing Node.js 22..."
if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y -qq nodejs
else
    echo "  Node.js already installed: $(node -v)"
fi

# PM2
echo "[5/6] Installing PM2..."
npm install -g pm2 2>/dev/null || true
pm2 startup systemd -u "$USER" --hp "/home/$USER" 2>/dev/null || true

# Tailscale
echo "[6/6] Installing Tailscale..."
if ! command -v tailscale &>/dev/null; then
    curl -fsSL https://tailscale.com/install.sh | sh
    if [ -n "$TAILSCALE_AUTH_KEY" ]; then
        tailscale up --authkey="$TAILSCALE_AUTH_KEY" --hostname="$NODE_NAME" --ssh
    else
        echo "  Run manually: tailscale up --hostname=$NODE_NAME --ssh"
    fi
else
    echo "  Tailscale already installed"
    tailscale up --hostname="$NODE_NAME" --ssh 2>/dev/null || true
fi

# Create standard directories
mkdir -p /opt/navada/{config,data,logs}

echo ""
echo "=== Bootstrap complete ==="
echo "Next steps:"
echo "  1. Join Tailscale: tailscale up --hostname=$NODE_NAME --ssh"
echo "  2. Deploy base services: docker compose -f navada-base-compose.yml up -d"
echo "  3. Add SSH keys for mesh access"
echo "  4. Register in Prometheus scrape targets on Oracle"
