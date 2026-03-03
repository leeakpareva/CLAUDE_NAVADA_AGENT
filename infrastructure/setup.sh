#!/bin/bash
# =============================================================
# NAVADA Infrastructure Setup
# Run after reboot once WSL2 is active
# =============================================================

set -e

echo "=== NAVADA Infrastructure Setup ==="

# 1. Check WSL2 is working
echo "[1/5] Checking WSL2..."
if wsl --status 2>&1 | grep -q "Default Version: 2"; then
    echo "  ✓ WSL2 is active"
else
    echo "  ✗ WSL2 not ready. Reboot may be needed."
    exit 1
fi

# 2. Check Docker
echo "[2/5] Checking Docker..."
if docker --version 2>/dev/null; then
    echo "  ✓ Docker is installed"
else
    echo "  ✗ Docker not found. Installing via winget..."
    winget install -e --id Docker.DockerDesktop --accept-source-agreements --accept-package-agreements
    echo "  → Docker Desktop installed. Start it from the Start Menu, then re-run this script."
    exit 0
fi

# 3. Check Docker is running
echo "[3/5] Checking Docker daemon..."
if docker info > /dev/null 2>&1; then
    echo "  ✓ Docker daemon is running"
else
    echo "  ✗ Docker daemon not running. Start Docker Desktop first."
    exit 1
fi

# 4. Create .env if missing
echo "[4/5] Checking environment..."
INFRA_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ ! -f "$INFRA_DIR/.env" ]; then
    echo "CLOUDFLARE_TUNNEL_TOKEN=your-token-here" > "$INFRA_DIR/.env"
    echo "  → Created .env — add your Cloudflare tunnel token"
fi

# 5. Start services
echo "[5/5] Starting NAVADA infrastructure..."
cd "$INFRA_DIR"
docker compose up -d

echo ""
echo "=== NAVADA Infrastructure Online ==="
echo "  http://192.168.0.58        → Status page"
echo "  http://192.168.0.58:8080/dashboard/  → CLAWD Dashboard"
echo "  http://192.168.0.58:8080/canvas/     → Excalidraw"
echo ""
echo "  Subdomains (add to hosts file):"
echo "  dashboard.navada.local → CLAWD Dashboard"
echo "  canvas.navada.local    → Excalidraw"
echo ""
