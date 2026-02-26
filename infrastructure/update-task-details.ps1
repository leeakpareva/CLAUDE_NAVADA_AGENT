# =============================================================
# Update all NAVADA scheduled tasks with rich descriptions
# =============================================================

$tasks = @(
    @{
        Name = "AI-News-Digest"
        Description = @"
NAVADA Automation | AI News Digest
Owner: Lee Akpareva | NAVADA Home Server
Script: C:\Users\leeak\CLAUDE_NAVADA_AGENT\Automation\ai-news-mailer.js
Schedule: Daily 7:00 AM
Purpose: Scrapes top AI news sources, summarizes with GPT, emails digest to Lee
Dependencies: Node.js, OpenAI API, Gmail SMTP
Log: Automation/logs/ai-news-digest_*.log
Created: Feb 2026 | Status: PRODUCTION
"@
    },
    @{
        Name = "Job-Hunter-Daily"
        Description = @"
NAVADA Automation | Job Hunter
Owner: Lee Akpareva | NAVADA Home Server
Script: C:\Users\leeak\CLAUDE_NAVADA_AGENT\Automation\job-hunter-apify.js
Schedule: Daily 9:00 AM
Purpose: Searches job boards for AI/ML leadership roles, tracks applications, emails new matches
Dependencies: Node.js, Apify API, Gmail SMTP
Data: jobs-tracker.json, jobs-sent.json
Log: Automation/logs/job-hunter_*.log
Created: Feb 2026 | Status: PRODUCTION
"@
    },
    @{
        Name = "Self-Improve-Weekly"
        Description = @"
NAVADA Automation | Ralph Wiggum Self-Improvement System
Owner: Lee Akpareva | NAVADA Home Server
Script: C:\Users\leeak\CLAUDE_NAVADA_AGENT\Automation\self-improve.js
Schedule: Monday 10:00 AM
Purpose: Ralph loops Claude Code in research-only mode, logs improvement proposals, emails digest to Lee. Lee replies 'approve 1, 3, 5' to trigger execution via inbox-auto-responder
Dependencies: Node.js, Bun, Ralph (@th0rgal/ralph-wiggum), Claude Code CLI
Knowledge Base: Automation/kb/improvement-log.json, improvement-history.json
Log: Automation/logs/self-improve.log
Created: Feb 2026 | Status: PRODUCTION
"@
    },
    @{
        Name = "NAVADA-Infrastructure"
        Description = @"
NAVADA Infrastructure | Docker + Nginx Auto-Start
Owner: Lee Akpareva | NAVADA Home Server
Script: C:\Users\leeak\CLAUDE_NAVADA_AGENT\infrastructure\startup.ps1
Trigger: At logon
Purpose: Waits for Docker daemon to be ready, then starts Nginx reverse proxy and Cloudflare tunnel containers via docker compose
Containers: navada-proxy (Nginx), navada-tunnel (Cloudflared)
Dependencies: Docker Desktop, WSL2
Log: Automation/logs/infrastructure-startup.log
Created: Feb 2026 | Status: PRODUCTION
"@
    }
)

foreach ($task in $tasks) {
    try {
        $existing = Get-ScheduledTask -TaskName $task.Name -ErrorAction Stop
        $existing.Description = $task.Description
        Set-ScheduledTask -InputObject $existing | Out-Null
        Write-Host "Updated: $($task.Name)"
    } catch {
        Write-Host "SKIPPED (not found): $($task.Name)"
    }
}

Write-Host "`nAll task descriptions updated."
