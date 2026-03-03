# E2E Test 009: Infrastructure State Snapshot
**Date:** 3 March 2026
**Type:** Full System State Capture

## Server
| Property | Value |
|----------|-------|
| Hostname | NAVADA |
| OS | Windows 11 Pro 10.0.22631 |
| Uptime | 2 days 6 hours |
| Disk C: | 120GB free / 255GB total (47% free) |
| Local IP | 192.168.0.36 |
| Tailscale IP | 100.121.187.67 |
| Node.js | v24.13.1 |
| Python | 3.12 |
| Docker | Desktop v4.60.1 (WSL2) |

## PM2 Services (8/8 Online)
| ID | Name | Version | Uptime | Restarts | Memory |
|----|------|---------|--------|----------|--------|
| 1 | worldmonitor-api | 2.5.19 | 5h | 5 | 46MB |
| 2 | trading-api | N/A | 5h | 451 | 36MB |
| 3 | inbox-responder | 1.0.0 | 7h | 0 | 59MB |
| 4 | auto-deploy | 1.1.0 | 7h | 0 | 51MB |
| 5 | trading-scheduler | N/A | 7h | 0 | 50MB |
| 6 | telegram-bot | 1.0.0 | 2m | 11 | 212MB |
| 7 | voice-command | 1.0.0 | 7h | 0 | 75MB |
| 11 | worldmonitor | 2.5.19 | 3h | 13 | 48MB |

**Note:** trading-api has 451 restarts (known issue, FastAPI crash loop). telegram-bot restarts are from today's E2E fixes.

## Docker Containers (5/6 Healthy)
| Container | Status | Ports |
|-----------|--------|-------|
| navada-grafana | Up 2 days | 9090->3000 |
| navada-proxy | Up 2 days | 80, 443, 8080 |
| navada-prometheus | Up 2 days | 9091->9090 |
| navada-tunnel | RESTARTING | - |
| navada-portainer | Up 2 days | 9000 |
| navada-uptime | Up 2 days (healthy) | 3002->3001 |

**navada-tunnel issue:** "Provided Tunnel token is not valid." Needs new Cloudflare tunnel token.

## Scheduled Tasks (18/18 Ready)
| Task | Next Run | Status |
|------|----------|--------|
| Morning-Briefing | 03/03/2026 06:30 | Ready |
| AI-News-Digest | 03/03/2026 07:00 | Ready |
| Economy-Report | 09/03/2026 08:00 | Ready |
| NAVADA-LeadPipeline | 03/03/2026 08:30 | Ready |
| Job-Hunter-Daily | 03/03/2026 09:00 | Ready |
| NAVADA-ProspectPipeline | 03/03/2026 09:30 | Ready |
| Self-Improve-Weekly | 09/03/2026 10:00 | Ready |
| NAVADA-Trading-PreMarket | 03/03/2026 14:15 | Ready |
| NAVADA-Trading-Execute | 03/03/2026 15:45 | Ready |
| Market-Intelligence | 03/03/2026 18:00 | Ready |
| Weekly-Report | 08/03/2026 18:00 | Ready |
| NAVADA-Trading-FridayClose | 06/03/2026 20:30 | Ready |
| Daily-Ops-Report | 03/03/2026 21:00 | Ready |
| NAVADA-Trading-Report | 03/03/2026 21:15 | Ready |
| Inbox-Monitor | 03/03/2026 08:00 | Ready |
| VC-Response-Monitor | N/A (at startup) | Ready |
| NAVADA-Infrastructure | N/A (at startup) | Ready |
| PM2-Resurrect | N/A (at startup) | Ready |

## Tailscale Network
| Device | IP | OS | Status |
|--------|----|----|--------|
| navada | 100.121.187.67 | Windows | Online |
| headless | 100.71.230.23 | Linux | Offline (6d) |
| iphone-15-pro-max | 100.68.251.111 | iOS | Online |
| maclcolms-macbook-pro | 100.67.218.20 | macOS | Online |

## Email (Zoho IMAP)
| Metric | Value |
|--------|-------|
| Account | claude.navada@zohomail.eu |
| IMAP | Connected, authenticated |
| Inbox unread | 0 |
| Sent folder | 162 emails |
| Most recent sent | 3 March 2026, 02:52 |

## Telegram Bot
| Metric | Value |
|--------|-------|
| Commands | 47 (42 admin + 5 guest-only) |
| Users | 3 (1 admin, 2 guests) |
| Current model | Sonnet 4 |
| Conversation turns loaded | 24 |
| Tools available (admin) | 10 |
| Tools available (guest) | 2 |

## API Costs (Today)
| Metric | Value |
|--------|-------|
| Total calls | 11 |
| AI cost | £0.21 |
| Human equivalent | £287.50 |
| ROI | 1,379x |
| Models | claude-sonnet-4 (10), dall-e-3 (1) |

## Log Files
- 61 log files in Automation/logs/
- Largest: voice-command.log at 337MB (3.3M error lines)
- Most recent: telegram-commands.log (3 Mar 03:18)

## Known Issues
1. navada-tunnel: invalid Cloudflare token, restart loop
2. trading-api: 451 restarts (FastAPI stability)
3. voice-command.log: 337MB, needs rotation
4. Weekly report PDF: Unicode crash (gen-report.py)
5. Ralph: 8 findings pending approval
