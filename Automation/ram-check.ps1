Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 20 Name,@{N='RAM_MB';E={[math]::Round($_.WorkingSet64/1MB)}} | Format-Table -AutoSize
Write-Host ""
$os = Get-CimInstance Win32_OperatingSystem
$total = [math]::Round($os.TotalVisibleMemorySize/1MB,1)
$free = [math]::Round($os.FreePhysicalMemory/1MB,1)
$used = [math]::Round($total - $free, 1)
$pct = [math]::Round(($used/$total)*100)
Write-Host "Total: ${total}GB | Used: ${used}GB | Free: ${free}GB | ${pct}%"
