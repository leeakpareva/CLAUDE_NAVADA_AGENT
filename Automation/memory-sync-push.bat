@echo off
REM NAVADA Memory Sync: HP -> ASUS (hourly via Windows Task Scheduler)
REM Uses Git's SSH (native OpenSSH has permission issues with CodexSandbox)

set HOME=C:\Users\leeak
set GIT_SSH=C:\Program Files\Git\usr\bin\ssh.exe
set SRC=C:\Users\leeak\.claude\projects\C--Users-leeak\memory
set DEST=leeak@100.88.118.128:C:/Users/leeak/.claude/projects/C--Users-leeak/memory/
set LOG=C:\Users\leeak\CLAUDE_NAVADA_AGENT\Automation\logs\memory-sync.log

"C:\Program Files\Git\bin\bash.exe" -c "scp -q -o ConnectTimeout=10 -o BatchMode=yes '%SRC%/MEMORY.md' '%SRC%/hp-server.md' '%SRC%/asus-workstation.md' '%SRC%/automations.md' '%SRC%/aws-serverless.md' '%SRC%/creative-emails.md' '%SRC%/crow-theme.md' '%SRC%/failover.md' '%SRC%/navada-edge-v2.md' '%SRC%/navada-edge.md' '%SRC%/navada-flix.md' '%SRC%/navada-trading.md' '%SRC%/oracle-cloud.md' '%SRC%/telegram-bot-troubleshooting.md' '%SRC%/worldmonitor-product.md' '%SRC%/worldmonitor.md' 'leeak@100.88.118.128:C:/Users/leeak/.claude/projects/C--Users-leeak/memory/'"

if %ERRORLEVEL% equ 0 (
    echo [%date% %time%] Memory sync HP-^>ASUS OK >> "%LOG%"
) else (
    echo [%date% %time%] Memory sync HP-^>ASUS FAILED (ASUS offline?) >> "%LOG%"
)
