# Fix all NAVADA scheduled tasks to run hidden (no visible terminal window)
# Must run as Administrator: powershell -ExecutionPolicy Bypass -File fix-task-visibility.ps1

$vbs = "C:\Users\leeak\Alex\Automation\run-hidden.vbs"
$wscript = "C:\Windows\System32\wscript.exe"

$taskNames = @(
    "AI-News-Digest",
    "Daily-Ops-Report",
    "Economy-Report",
    "Inbox-Monitor",
    "Job-Hunter-Daily",
    "Market-Intelligence",
    "Morning-Briefing",
    "NAVADA-DB-Strategy-Reminder",
    "NAVADA-LeadPipeline",
    "NAVADA-ProspectPipeline",
    "NAVADA-Reminder-AWS-MCP",
    "NAVADA-SecureNetwork-Reminder",
    "NAVADA-Trading-Execute",
    "NAVADA-Trading-FridayClose",
    "NAVADA-Trading-PreMarket",
    "NAVADA-Trading-Report",
    "PM2-Resurrect",
    "Self-Improve-Weekly",
    "VC-Response-Monitor",
    "Weekly-Report"
)

# Skip NAVADA-Infrastructure (already uses -WindowStyle Hidden in its PowerShell args)

foreach ($name in $taskNames) {
    try {
        $task = Get-ScheduledTask -TaskName $name -ErrorAction Stop
        $action = $task.Actions[0]
        $oldExe = $action.Execute -replace '"', ''
        $oldArgs = $action.Arguments

        # Skip if already wrapped with wscript
        if ($oldExe -match 'wscript') {
            Write-Host "[SKIP] $name (already wrapped)"
            continue
        }

        # Build new arguments: wscript "run-hidden.vbs" <original-exe> <original-args>
        if ($oldArgs) {
            $newArgs = """$vbs"" ""$oldExe"" $oldArgs"
        } else {
            $newArgs = """$vbs"" ""$oldExe"""
        }

        $action.Execute = $wscript
        $action.Arguments = $newArgs

        # Set hidden
        $task.Settings.Hidden = $true

        Set-ScheduledTask -InputObject $task | Out-Null
        Write-Host "[OK] $name"
        Write-Host "     Was: $oldExe $oldArgs"
        Write-Host "     Now: $wscript $newArgs"
    } catch {
        Write-Host "[FAIL] $name : $($_.Exception.Message)"
    }
}

Write-Host "`nDone. All tasks now run silently (no terminal flicker)."
