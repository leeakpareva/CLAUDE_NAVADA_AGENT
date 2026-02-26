$action = New-ScheduledTaskAction `
    -Execute 'C:\Program Files\nodejs\node.exe' `
    -Argument 'C:\Users\leeak\CLAUDE_NAVADA_AGENT\LeadPipeline\pipeline.js' `
    -WorkingDirectory 'C:\Users\leeak\CLAUDE_NAVADA_AGENT\LeadPipeline'

$trigger = New-ScheduledTaskTrigger -Daily -At '08:30AM'

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 5)

Register-ScheduledTask `
    -TaskName 'NAVADA-LeadPipeline' `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -RunLevel Highest `
    -Description 'NAVADA Lead Pipeline — daily scan: check responses, stale leads, overdue tasks, weekly report on Mondays' `
    -Force

Write-Host "NAVADA-LeadPipeline scheduled task registered"
Get-ScheduledTask -TaskName 'NAVADA-LeadPipeline' | Format-List TaskName, State
