@echo off
REM NAVADA AI Trading Lab — Windows Task Scheduler Setup
REM Run this as Administrator to create the scheduled tasks

SET PYTHON=py
SET PROJECT=C:\Users\leeak\CLAUDE_NAVADA_AGENT\NAVADA-Trading

echo Creating NAVADA-Trading-Execute task (3:45 PM daily, Mon-Fri)...
schtasks /create /tn "NAVADA-Trading-Execute" /tr "%PYTHON% %PROJECT%\scripts\run_trading.py" /sc weekly /d MON,TUE,WED,THU,FRI /st 15:45 /rl HIGHEST /f

echo Creating NAVADA-Trading-Report task (4:30 PM daily, Mon-Fri)...
schtasks /create /tn "NAVADA-Trading-Report" /tr "%PYTHON% %PROJECT%\scripts\run_report.py" /sc weekly /d MON,TUE,WED,THU,FRI /st 16:30 /rl HIGHEST /f

echo Creating NAVADA-Trading-FridayClose task (8:30 PM Friday)...
schtasks /create /tn "NAVADA-Trading-FridayClose" /tr "%PYTHON% %PROJECT%\scripts\close_all.py" /sc weekly /d FRI /st 20:30 /rl HIGHEST /f

echo.
echo Done. Tasks created:
echo   NAVADA-Trading-Execute    - Mon-Fri 3:45 PM
echo   NAVADA-Trading-Report     - Mon-Fri 4:30 PM
echo   NAVADA-Trading-FridayClose - Fri 8:30 PM
echo.
pause
