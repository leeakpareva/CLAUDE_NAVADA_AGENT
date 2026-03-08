#!/bin/bash
# NAVADA Edge AWS - EC2 Bootstrap Script
# Run this on a fresh Ubuntu 22.04 EC2 instance

set -euo pipefail

echo "=== NAVADA Edge AWS Setup ==="

# Update system
sudo apt-get update -y && sudo apt-get upgrade -y

# Install Docker
echo "Installing Docker..."
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu
sudo systemctl enable docker
sudo systemctl start docker

# Install Docker Compose
echo "Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Tailscale
echo "Installing Tailscale..."
curl -fsSL https://tailscale.com/install.sh | sh
echo "Run: sudo tailscale up --authkey=<your-key>"

# Install FFmpeg (for video transcoding)
echo "Installing FFmpeg..."
sudo apt-get install -y ffmpeg

# Install Node.js 20 LTS
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Create project directories
sudo mkdir -p /opt/navada/{flix,configs,data,hls,logs}
sudo chown -R ubuntu:ubuntu /opt/navada

# Clone or copy project files
echo "=== Setup complete ==="
echo "Next steps:"
echo "1. sudo tailscale up --authkey=<key>"
echo "2. Copy docker-compose.yml and configs to /opt/navada/"
echo "3. Create .env with CLOUDFLARE_TUNNEL_TOKEN"
echo "4. docker-compose up -d"
