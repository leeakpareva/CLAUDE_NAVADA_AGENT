@echo off
echo Setting up NAVADA Task Scheduler tasks...

:: Morning Briefing - 6:30 AM daily
schtasks /create /tn "Morning-Briefing" /tr "C:\Users\leeak\Alex\Automation\run-task.bat morning-briefing node C:\Users\leeak\Alex\Automation\morning-briefing.js" /sc daily /st 06:30 /f
echo [OK] Morning-Briefing at 06:30

:: AI News Digest - 7:00 AM daily (already exists, recreate to be safe)
schtasks /create /tn "AI-News-Digest" /tr "C:\Users\leeak\Alex\Automation\run-task.bat ai-news-digest node C:\Users\leeak\Alex\Automation\ai-news-mailer.js" /sc daily /st 07:00 /f
echo [OK] AI-News-Digest at 07:00

:: Job Hunter - 9:00 AM daily
schtasks /create /tn "Job-Hunter-Daily" /tr "C:\Users\leeak\Alex\Automation\run-task.bat job-hunter node C:\Users\leeak\Alex\Automation\job-hunter-apify.js" /sc daily /st 09:00 /f
echo [OK] Job-Hunter-Daily at 09:00

:: Inbox Monitor - every 2 hours from 8AM-10PM
schtasks /create /tn "Inbox-Monitor" /tr "C:\Users\leeak\Alex\Automation\run-task.bat inbox-monitor node C:\Users\leeak\Alex\Automation\inbox-monitor.js" /sc daily /st 08:00 /ri 120 /du 14:00 /f
echo [OK] Inbox-Monitor every 2hrs (08:00-22:00)

:: Weekly Report - Sunday 6PM
schtasks /create /tn "Weekly-Report" /tr "C:\Users\leeak\Alex\Automation\run-task.bat weekly-report node C:\Users\leeak\Alex\Automation\weekly-report.js" /sc weekly /d SUN /st 18:00 /f
echo [OK] Weekly-Report Sunday 18:00

echo.
echo All tasks registered successfully.
