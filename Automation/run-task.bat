@echo off
REM Generic task wrapper - runs a script and logs output
REM Usage: run-task.bat <task-name> <command> [args...]
REM Example: run-task.bat AI-News-Digest node ai-news-mailer.js

setlocal
set TASK_NAME=%1
shift

set LOG_DIR=C:\Users\leeak\Alex\Automation\logs
set TIMESTAMP=%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set LOG_FILE=%LOG_DIR%\%TASK_NAME%_%TIMESTAMP%.log

cd /d C:\Users\leeak\Alex\Automation

echo [%date% %time%] Starting %TASK_NAME% >> "%LOG_FILE%" 2>&1
echo ---------------------------------------- >> "%LOG_FILE%" 2>&1

REM Build the command from remaining args
set CMD=
:buildcmd
if "%~1"=="" goto runcmd
set CMD=%CMD% %1
shift
goto buildcmd

:runcmd
%CMD% >> "%LOG_FILE%" 2>&1

echo ---------------------------------------- >> "%LOG_FILE%" 2>&1
echo [%date% %time%] Finished %TASK_NAME% (exit code: %ERRORLEVEL%) >> "%LOG_FILE%" 2>&1

REM Keep only last 30 log files per task
forfiles /p "%LOG_DIR%" /m "%TASK_NAME%_*.log" /d -30 /c "cmd /c del @path" 2>nul

exit /b %ERRORLEVEL%
