$tasks = @{
    "Morning-Briefing" = "Daily executive briefing at 6:30 AM. Combines: weather, top 3 AI news, job pipeline status, today's priorities. Sent from claude.navada@zohomail.eu to leeakpareva@gmail.com."
    "AI-News-Digest" = "Daily AI/ML news digest from RSS feeds (TechCrunch, MIT, ArXiv, etc). Curated HTML email at 7 AM. Script: ai-news-mailer.js"
    "Job-Hunter-Daily" = "Daily job search via Apify Indeed Scraper. Top 10 jobs with auto-generated cover letters. Searches: Head of AI, AI Engineer, ML Lead, AI Architect. 9 AM daily. Script: job-hunter-apify.js"
    "Inbox-Monitor" = "Checks claude.navada@zohomail.eu every 2 hours (8AM-10PM). Summarises unread emails and forwards digest to Lee. Script: inbox-monitor.js"
    "Weekly-Report" = "Sunday 6 PM weekly intelligence report. PDF with job pipeline metrics, AI industry news, market trends. Voice summary MP3 attached. Script: weekly-report.js"
}

foreach ($name in $tasks.Keys) {
    $task = Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue
    if ($task) {
        $task.Description = $tasks[$name]
        $task | Set-ScheduledTask | Out-Null
        Write-Host "[OK] $name description updated"
    } else {
        Write-Host "[SKIP] $name not found"
    }
}
