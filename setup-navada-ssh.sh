#!/bin/bash
# NAVADA SSH Setup Script
# Run this on each node to enable SSH access from ASUS control station

echo "=== NAVADA Node SSH Setup ==="

# Your SSH public key from ASUS control station
SSH_KEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAID4t/xGZ2TCArYY0MG3GW694itPGgL46wll7f8TWqtga asus-control@navada-edge"

# Ensure .ssh directory exists
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add the key to authorized_keys
echo "$SSH_KEY" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Ensure SSH service is running
if command -v systemctl &> /dev/null; then
    sudo systemctl enable ssh
    sudo systemctl start ssh
    echo "SSH service enabled and started"
elif command -v service &> /dev/null; then
    sudo service ssh start
    echo "SSH service started"
fi

# Enable Tailscale SSH (optional but recommended)
if command -v tailscale &> /dev/null; then
    echo "Enabling Tailscale SSH..."
    sudo tailscale up --ssh
    echo "Tailscale SSH enabled"
fi

echo "=== Setup Complete ==="
echo "This node should now accept SSH from:"
echo "  - ASUS Control (100.88.118.128)"
echo "  - Using key: asus-control@navada-edge"

# Show current Tailscale IP
if command -v tailscale &> /dev/null; then
    echo ""
    echo "This node's Tailscale IP:"
    tailscale ip -4
fi