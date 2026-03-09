$tasks = @(
  "AI-News-Digest",
  "Daily-Ops-Report",
  "Economy-Report",
  "Inbox-Monitor",
  "Job-Hunter-Daily",
  "Market-Intelligence",
  "Morning-Briefing",
  "NAVADA-DailyCostDigest",
  "NAVADA-DB-Strategy-Reminder",
  "NAVADA-Infrastructure",
  "NAVADA-LeadPipeline",
  "NAVADA-MemorySync",
  "NAVADA-ProspectPipeline",
  "NAVADA-Reminder-AWS-MCP",
  "NAVADA-SecureNetwork-Reminder",
  "NAVADA-Trading-Execute",
  "NAVADA-Trading-FridayClose",
  "NAVADA-Trading-PreMarket",
  "NAVADA-Trading-Report",
  "Oracle-Wake",
  "PM2-Resurrect",
  "Self-Improve-Weekly",
  "VC-Response-Monitor",
  "Weekly-Report"
)

foreach ($t in $tasks) {
  try {
    Disable-ScheduledTask -TaskName $t -ErrorAction Stop
    Write-Output "Disabled: $t"
  } catch {
    Write-Output "Skip: $t ($($_.Exception.Message))"
  }
}
Write-Output "Done - all NAVADA tasks disabled"
