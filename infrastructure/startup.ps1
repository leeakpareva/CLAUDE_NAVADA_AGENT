# =============================================================
# NAVADA Infrastructure Auto-Start
# Runs at boot: waits for Docker, then starts containers
# =============================================================

$logFile = "C:\Users\leeak\CLAUDE_NAVADA_AGENT\Automation\logs\infrastructure-startup.log"
$infraDir = "C:\Users\leeak\CLAUDE_NAVADA_AGENT\infrastructure"

function Log($msg) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$ts  $msg" | Tee-Object -FilePath $logFile -Append
}

Log "=== NAVADA Infrastructure Startup ==="

# Step 1: Ensure Docker Desktop is running
Log "Checking if Docker Desktop is running..."
$dockerProcess = Get-Process "Docker Desktop" -ErrorAction SilentlyContinue
if (-not $dockerProcess) {
    Log "Starting Docker Desktop..."
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    Start-Sleep -Seconds 10
}

# Step 2: Wait for Docker daemon to be ready (max 3 minutes)
Log "Waiting for Docker daemon..."
$maxWait = 180
$waited = 0
$ready = $false

while ($waited -lt $maxWait) {
    try {
        $result = & docker info 2>&1
        if ($LASTEXITCODE -eq 0) {
            $ready = $true
            break
        }
    } catch {}
    Start-Sleep -Seconds 5
    $waited += 5
    if ($waited % 30 -eq 0) {
        Log "  Still waiting... ($waited seconds)"
    }
}

if (-not $ready) {
    Log "ERROR: Docker daemon not ready after $maxWait seconds. Aborting."
    exit 1
}

Log "Docker daemon is ready ($waited seconds)"

# Step 3: Start infrastructure containers
Log "Starting NAVADA infrastructure containers..."
Set-Location $infraDir

try {
    & docker compose up -d 2>&1 | ForEach-Object { Log "  $_" }
    Log "Infrastructure containers started successfully"
} catch {
    Log "ERROR: Failed to start containers: $_"
    exit 1
}

# Step 4: Verify
Start-Sleep -Seconds 5
$containers = & docker ps --format "{{.Names}} {{.Status}}" 2>&1
Log "Running containers:"
$containers | ForEach-Object { Log "  $_" }

# Step 5: Health check
try {
    $health = Invoke-WebRequest -Uri "http://localhost/health" -TimeoutSec 5 -UseBasicParsing
    Log "Health check: $($health.StatusCode) - $($health.Content)"
} catch {
    Log "Health check: nginx not responding yet (may need services on host to start first)"
}

Log "=== Startup complete ==="
