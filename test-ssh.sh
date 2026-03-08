#!/bin/bash
# Test SSH connections to all NAVADA nodes

echo "Testing SSH connections to NAVADA nodes..."
echo "=========================================="

# Test HP Server
echo -n "HP Server (100.121.187.67): "
timeout 5 ssh -o StrictHostKeyChecking=no -o ConnectTimeout=3 leeakpareva@100.121.187.67 "echo 'Connected'" 2>/dev/null && echo "✓" || echo "✗"

# Test Oracle VM
echo -n "Oracle VM (100.77.206.9): "
timeout 5 ssh -o StrictHostKeyChecking=no -o ConnectTimeout=3 opc@100.77.206.9 "echo 'Connected'" 2>/dev/null && echo "✓" || echo "✗"

# Test AWS EC2
echo -n "AWS EC2 (100.98.118.33): "
timeout 5 ssh -o StrictHostKeyChecking=no -o ConnectTimeout=3 ubuntu@100.98.118.33 "echo 'Connected'" 2>/dev/null && echo "✓" || echo "✗"

echo ""
echo "For passwordless access, run on each node:"
echo "  sudo tailscale up --ssh"
echo ""
echo "Then use: tailscale ssh [hostname]"