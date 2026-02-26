# PM2 Startup — runs on Windows boot to resurrect saved processes
$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c pm2 resurrect" -WorkingDirectory "C:\Users\leeak\CLAUDE_NAVADA_AGENT\Automation"
$trigger = New-ScheduledTaskTrigger -AtLogon -User "leeak"
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName "PM2-Resurrect" -Description "Start PM2 and resurrect saved processes on boot" -Action $action -Trigger $trigger -Settings $settings -User "leeak" -RunLevel Highest -Force
