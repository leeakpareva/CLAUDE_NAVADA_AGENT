$action = New-ScheduledTaskAction `
    -Execute 'C:\Program Files\nodejs\node.exe' `
    -Argument 'C:\Users\leeak\CLAUDE_NAVADA_AGENT\Automation\vc-response-monitor.js' `
    -WorkingDirectory 'C:\Users\leeak\CLAUDE_NAVADA_AGENT\Automation'

$trigger = New-ScheduledTaskTrigger -AtStartup

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 5)

Register-ScheduledTask `
    -TaskName 'VC-Response-Monitor' `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -RunLevel Highest `
    -Description 'Monitors inbox for VC initiative replies from Tim and Uncle Patrick, alerts Lee when they respond' `
    -Force

Write-Host "Task registered successfully"
Get-ScheduledTask -TaskName 'VC-Response-Monitor' | Format-List TaskName, State, Description
