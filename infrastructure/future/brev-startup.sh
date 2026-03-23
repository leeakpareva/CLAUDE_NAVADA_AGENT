#!/bin/bash
# NAVADA Brev.dev GPU Instance Bootstrap
# Run as startup script when provisioning a Brev instance
# Brev provides: Ubuntu + NVIDIA drivers + Docker pre-installed

set -euo pipefail

echo "=== NAVADA Brev GPU Bootstrap ==="

# Tailscale (join mesh)
echo "[1/4] Installing Tailscale..."
curl -fsSL https://tailscale.com/install.sh | sh
echo "Run: tailscale up --hostname=navada-gpu --ssh"

# PM2
echo "[2/4] Installing PM2..."
npm install -g pm2
pm2 startup systemd -u "$USER" --hp "$HOME" 2>/dev/null || true

# NVIDIA Container Toolkit (usually pre-installed on Brev)
echo "[3/4] Verifying NVIDIA container toolkit..."
if ! dpkg -l | grep -q nvidia-container-toolkit; then
    distribution=$(. /etc/os-release; echo $ID$VERSION_ID)
    curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
    curl -s -L "https://nvidia.github.io/libnvidia-container/${distribution}/libnvidia-container.list" | \
        sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
        tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
    apt-get update -qq && apt-get install -y -qq nvidia-container-toolkit
    nvidia-ctk runtime configure --runtime=docker
    systemctl restart docker
else
    echo "  Already installed"
fi

# Deploy NAVADA GPU stack
echo "[4/4] Deploying NAVADA GPU services..."
mkdir -p /opt/navada
# Copy navada-nvidia-compose.yml to /opt/navada/docker-compose.yml
# Then: docker compose up -d

echo ""
echo "=== Brev Bootstrap Complete ==="
echo "GPU: $(nvidia-smi --query-gpu=name --format=csv,noheader 2>/dev/null || echo 'not detected')"
echo "Next: tailscale up --hostname=navada-gpu --ssh"
echo "Then: docker compose -f /opt/navada/docker-compose.yml up -d"
