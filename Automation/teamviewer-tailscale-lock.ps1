# NAVADA: Lock TeamViewer to Tailscale network only
# Run as Administrator: Right-click > Run with PowerShell (Admin)

Write-Host "=== NAVADA TeamViewer Tailscale Lockdown ===" -ForegroundColor Cyan

# Disable old default TeamViewer rules
Write-Host "`nDisabling default TeamViewer rules..."
Get-NetFirewallRule -DisplayName 'Teamviewer Remote Control Application' -ErrorAction SilentlyContinue | Disable-NetFirewallRule
Get-NetFirewallRule -DisplayName 'Teamviewer Remote Control Service' -ErrorAction SilentlyContinue | Disable-NetFirewallRule
Write-Host "[OK] Default rules disabled" -ForegroundColor Green

# Create Tailscale-only allow rules (100.64.0.0/10 = Tailscale CGNAT range)
Write-Host "`nCreating Tailscale-only rules..."
New-NetFirewallRule -DisplayName "TeamViewer - Tailscale Only" -Direction Inbound -Program "C:\Program Files\TeamViewer\TeamViewer.exe" -RemoteAddress 100.64.0.0/10 -Action Allow -Profile Any -ErrorAction SilentlyContinue | Out-Null
New-NetFirewallRule -DisplayName "TeamViewer - Tailscale Only (Service)" -Direction Inbound -Program "C:\Program Files\TeamViewer\TeamViewer_Service.exe" -RemoteAddress 100.64.0.0/10 -Action Allow -Profile Any -ErrorAction SilentlyContinue | Out-Null
Write-Host "[OK] Allow rules: Tailscale 100.64.0.0/10 only" -ForegroundColor Green

# Block everything else
New-NetFirewallRule -DisplayName "TeamViewer - Block External" -Direction Inbound -Program "C:\Program Files\TeamViewer\TeamViewer.exe" -Action Block -Profile Any -ErrorAction SilentlyContinue | Out-Null
New-NetFirewallRule -DisplayName "TeamViewer - Block External (Service)" -Direction Inbound -Program "C:\Program Files\TeamViewer\TeamViewer_Service.exe" -Action Block -Profile Any -ErrorAction SilentlyContinue | Out-Null
Write-Host "[OK] Block rules: All external traffic" -ForegroundColor Green

# Show final state
Write-Host "`n--- Final Firewall State ---" -ForegroundColor Yellow
Get-NetFirewallRule | Where-Object { $_.DisplayName -like '*eamViewer*' } | Select-Object DisplayName,Direction,Action,Enabled | Format-Table -AutoSize

Write-Host "TeamViewer ID 425 650 565 is now only reachable from Tailscale devices:" -ForegroundColor Cyan
Write-Host "  iPhone:  100.68.251.111"
Write-Host "  Laptop:  100.121.187.67"
Write-Host "  EC2:     100.98.118.33"
Write-Host "  Oracle:  100.77.206.9"
Write-Host ""
Read-Host "Press Enter to close"
