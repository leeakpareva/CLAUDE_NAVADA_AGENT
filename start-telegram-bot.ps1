# NAVADA Telegram Bot Startup Script
# Ensures Telegram bot runs 24/7 with PM2

Write-Host "Starting NAVADA Telegram Bot..." -ForegroundColor Green

# Ensure PM2 daemon is running
pm2 ping

# Resurrect saved processes (includes telegram bot)
pm2 resurrect

# Check status
pm2 status

# Monitor the Telegram bot
pm2 logs navada-telegram --lines 10 --nostream

Write-Host "`nTelegram bot is running!" -ForegroundColor Green
Write-Host "Monitor at: https://app.pm2.io/#/r/7ogf0c2lvka1ere" -ForegroundColor Cyan
Write-Host "View logs: pm2 logs navada-telegram" -ForegroundColor Yellow