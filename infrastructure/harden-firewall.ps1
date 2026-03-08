# NAVADA Security Hardening — Firewall Rules
# Run as Administrator: Right-click PowerShell > Run as Administrator
# Then: .\infrastructure\harden-firewall.ps1

Write-Host "=== NAVADA Firewall Hardening ===" -ForegroundColor Cyan

# 1. Restrict RDP to LAN + Tailscale only
Write-Host "[1/5] Restricting RDP to LAN (192.168.0.0/24) + Tailscale (100.64.0.0/10)..."
Set-NetFirewallRule -DisplayName "Remote Desktop - User Mode (TCP-In)" -RemoteAddress @("192.168.0.0/255.255.255.0","100.64.0.0/255.192.0.0")
Write-Host "  Done." -ForegroundColor Green

# 2. Block external SMB (port 445)
Write-Host "[2/5] Blocking external SMB (port 445)..."
New-NetFirewallRule -DisplayName "NAVADA Block SMB External" -Direction Inbound -Action Block -Protocol TCP -LocalPort 445 -RemoteAddress Any -ErrorAction SilentlyContinue | Out-Null
New-NetFirewallRule -DisplayName "NAVADA Allow SMB LAN" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 445 -RemoteAddress "192.168.0.0/255.255.255.0" -ErrorAction SilentlyContinue | Out-Null
Write-Host "  Done." -ForegroundColor Green

# 3. Block external RPC (port 135)
Write-Host "[3/5] Blocking external RPC (port 135)..."
New-NetFirewallRule -DisplayName "NAVADA Block RPC External" -Direction Inbound -Action Block -Protocol TCP -LocalPort 135 -RemoteAddress Any -ErrorAction SilentlyContinue | Out-Null
New-NetFirewallRule -DisplayName "NAVADA Allow RPC LAN" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 135 -RemoteAddress "192.168.0.0/255.255.255.0" -ErrorAction SilentlyContinue | Out-Null
Write-Host "  Done." -ForegroundColor Green

# 4. Restart PostgreSQL (listen_addresses changed to 127.0.0.1)
Write-Host "[4/5] Restarting PostgreSQL 17 service..."
Restart-Service -Name "postgresql-x64-17" -ErrorAction SilentlyContinue
Write-Host "  Done." -ForegroundColor Green

# 5. Verify
Write-Host "`n[5/5] Verifying..." -ForegroundColor Yellow
Write-Host "RDP rules:"
Get-NetFirewallRule -DisplayName "Remote Desktop - User Mode (TCP-In)" | Get-NetFirewallAddressFilter | Format-Table RemoteAddress -AutoSize
Write-Host "SMB/RPC rules:"
Get-NetFirewallRule -DisplayName "NAVADA*" | Format-Table DisplayName, Direction, Action -AutoSize

# 6. Fix SSH key file permissions
Write-Host "[6/6] Securing SSH key permissions..."
$keys = @("$env:USERPROFILE\.ssh\id_ed25519", "$env:USERPROFILE\.ssh\oracle-navada", "$env:USERPROFILE\.ssh\aws-navada.pem")
foreach ($key in $keys) {
    if (Test-Path $key) {
        $acl = Get-Acl $key
        $acl.SetAccessRuleProtection($true, $false)
        $rule = New-Object System.Security.AccessControl.FileSystemAccessRule($env:USERNAME, "Read", "Allow")
        $acl.SetAccessRule($rule)
        Set-Acl $key $acl
        Write-Host "  Secured: $key" -ForegroundColor Green
    }
}

Write-Host "`n=== Security hardening complete ===" -ForegroundColor Green
Write-Host "NOTE: Also restart PM2 'oracle-elk-tunnel' to apply localhost binding:" -ForegroundColor Yellow
Write-Host "  pm2 restart oracle-elk-tunnel" -ForegroundColor Yellow
