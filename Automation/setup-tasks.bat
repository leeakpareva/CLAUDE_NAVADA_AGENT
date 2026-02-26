@echo off
REM Setup Windows Scheduled Tasks for Automation
REM Run this script as Administrator if normal mode fails

echo Setting up scheduled tasks...

REM === AI News Digest: Daily at 7:00 AM ===
schtasks /create /tn "AI-News-Digest" /tr "C:\Users\leeak\Alex\Automation\run-task.bat AI-News-Digest \"C:\Program Files\nodejs\node.exe\" ai-news-mailer.js" /sc daily /st 07:00 /f
if %ERRORLEVEL%==0 (echo [OK] AI-News-Digest registered - Daily 7:00 AM) else (echo [FAIL] AI-News-Digest)

REM === Economy Report: Weekly Monday 8:00 AM ===
schtasks /create /tn "Economy-Report" /tr "C:\Users\leeak\Alex\Automation\run-task.bat Economy-Report py uk-us-economy-report.py" /sc weekly /d MON /st 08:00 /f
if %ERRORLEVEL%==0 (echo [OK] Economy-Report registered - Weekly Monday 8:00 AM) else (echo [FAIL] Economy-Report)

echo.
echo Done! View in Task Scheduler: taskschd.msc
