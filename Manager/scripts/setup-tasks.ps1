# NAVADA Manager — Register Task Scheduler entries

# Daily Ops Report — 9 PM every day
$opsAction = New-ScheduledTaskAction -Execute "node" -Argument "C:\Users\leeak\Alex\Manager\daily-ops-report.js" -WorkingDirectory "C:\Users\leeak\Alex\Manager"
$opsTrigger = New-ScheduledTaskTrigger -Daily -At "21:00"
$opsSettings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName "Daily-Ops-Report" -Description "NAVADA daily operations and cost report email" -Action $opsAction -Trigger $opsTrigger -Settings $opsSettings -User "leeak" -Force
Write-Host "Registered: Daily-Ops-Report (9 PM daily)"

# Market Intelligence — 6 PM weekdays
$mktAction = New-ScheduledTaskAction -Execute "py" -Argument "C:\Users\leeak\Alex\Manager\market-pipeline.py" -WorkingDirectory "C:\Users\leeak\Alex\Manager"
$mktTrigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday,Tuesday,Wednesday,Thursday,Friday -At "18:00"
$mktSettings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName "Market-Intelligence" -Description "NAVADA market data scrape, analysis, and email report" -Action $mktAction -Trigger $mktTrigger -Settings $mktSettings -User "leeak" -Force
Write-Host "Registered: Market-Intelligence (6 PM weekdays)"
