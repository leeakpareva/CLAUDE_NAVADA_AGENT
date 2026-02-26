$action = New-ScheduledTaskAction -Execute "node" -Argument "C:\Users\leeak\Alex\Automation\self-improve.js" -WorkingDirectory "C:\Users\leeak\Alex\Automation"
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At "10:00AM"
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName "Self-Improve-Weekly" -Description "NAVADA Self-Improvement System - Weekly scan and digest" -Action $action -Trigger $trigger -Settings $settings -User "leeak" -RunLevel Highest -Force
