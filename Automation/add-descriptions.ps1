$task1 = Get-ScheduledTask -TaskName "AI-News-Digest" -ErrorAction SilentlyContinue
if ($task1) {
    $task1.Description = "Daily AI/ML news digest from RSS feeds (TechCrunch, MIT, ArXiv, etc). Sends curated HTML email to leeakpareva@gmail.com at 7AM. Script: ai-news-mailer.js | Logs: Automation/logs/"
    $task1 | Set-ScheduledTask
    Write-Host "AI-News-Digest description updated"
} else {
    Write-Host "AI-News-Digest not found"
}

$task2 = Get-ScheduledTask -TaskName "Job-Hunter-Daily" -ErrorAction SilentlyContinue
if ($task2) {
    $task2.Description = "Daily senior AI/ML job search via Apify Indeed Scraper. Searches: Head of AI, AI Engineer, ML Lead, AI Architect across UK+US. Scores against CV, deduplicates, emails top matches to leeakpareva@gmail.com at 9AM. Tracker: jobs-tracker.json | Script: job-hunter-apify.js | Logs: Automation/logs/"
    $task2 | Set-ScheduledTask
    Write-Host "Job-Hunter-Daily description updated"
} else {
    Write-Host "Job-Hunter-Daily not found"
}
