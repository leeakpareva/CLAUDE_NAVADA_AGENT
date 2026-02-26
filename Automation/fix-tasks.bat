@echo off
schtasks /create /tn "AI-News-Digest" /tr "C:\Users\leeak\Alex\Automation\run-task.bat ai-news-digest node C:\Users\leeak\Alex\Automation\ai-news-mailer.js" /sc daily /st 07:00 /rl highest /f
schtasks /create /tn "Job-Hunter-Daily" /tr "C:\Users\leeak\Alex\Automation\run-task.bat job-hunter node C:\Users\leeak\Alex\Automation\job-hunter-apify.js" /sc daily /st 09:00 /rl highest /f
