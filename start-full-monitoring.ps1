# NAVADA Complete Monitoring Stack Startup
# Launches all monitoring services with PM2

Write-Host "`n🚀 STARTING NAVADA MONITORING STACK" -ForegroundColor Cyan
Write-Host "=====================================`n" -ForegroundColor Cyan

# Start base monitor
Write-Host "📊 Starting Base Monitor..." -ForegroundColor Yellow
pm2 start navada-monitor.js --name navada-monitor --max-memory-restart 500M

# Start enhanced monitoring
Write-Host "📈 Starting Enhanced Monitor..." -ForegroundColor Yellow
pm2 start enhanced-monitoring.js --name navada-enhanced --max-memory-restart 500M

# Start advanced monitoring suite
Write-Host "🎯 Starting Advanced Suite..." -ForegroundColor Yellow
pm2 start advanced-monitoring-suite.js --name navada-advanced --max-memory-restart 750M

# Save configuration
Write-Host "`n💾 Saving PM2 Configuration..." -ForegroundColor Green
pm2 save

# Display status
Write-Host "`n📋 CURRENT STATUS:" -ForegroundColor Cyan
pm2 status

Write-Host "`n✅ MONITORING STACK DEPLOYED!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host "📊 View at: https://app.pm2.io/bucket/69aa4442b84819c2f2ccac2e" -ForegroundColor White
Write-Host "📱 Telegram Bot: Active" -ForegroundColor White
Write-Host "🌐 Network Nodes: Monitored" -ForegroundColor White
Write-Host "⚡ Real-time Metrics: Streaming" -ForegroundColor White
Write-Host "`n💡 Commands:" -ForegroundColor Yellow
Write-Host "  pm2 monit          - Local monitoring dashboard" -ForegroundColor Gray
Write-Host "  pm2 logs           - View all logs" -ForegroundColor Gray
Write-Host "  pm2 web            - Start web dashboard" -ForegroundColor Gray
Write-Host "  pm2 plus           - Open PM2.io dashboard" -ForegroundColor Gray