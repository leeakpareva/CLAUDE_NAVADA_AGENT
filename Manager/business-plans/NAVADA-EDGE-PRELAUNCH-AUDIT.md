# NAVADA Edge Pre-Launch Audit
**Date**: 2 March 2026
**Purpose**: Robustness check before client demos

---

## Must Fix Before Demoing

### 1. Switch to Ethernet Cable
- **Status**: NOT DONE
- **Issue**: Wi-Fi drops will cause intermittent service outages
- **Fix**: Connect HP laptop to router via Ethernet cable, disable Wi-Fi
- **Impact**: Rock-solid connection, <1ms latency, no drops

### 2. No Backup Strategy (CRITICAL)
- **Status**: NOT DONE
- **Issue**: If the laptop dies, everything is lost. No database exports, no off-site copies, zero recovery plan
- **Fix**: Daily automated backup script (SQLite exports, config files) to cloud storage (OneDrive/S3)
- **Impact**: Disaster recovery capability, client data protection

### 3. PM2 Doesn't Auto-Start After Reboot
- **Status**: NOT DONE
- **Issue**: Docker starts automatically but PM2 services (WorldMonitor, trading API, inbox responder) need manual restart after reboot
- **Fix**: Add `pm2 resurrect` to startup.ps1 or register PM2 as a Windows service
- **Impact**: Full auto-recovery after Windows updates or power cuts

### 4. Log File Bloat
- **Status**: NOT DONE
- **Issue**: `voice-command.log` is 298 MB and growing. No log rotation on any service
- **Fix**: Install `pm2-logrotate` module, set max 10 MB per file, keep 5 rotations
- **Impact**: Prevents disk full, keeps logs manageable

### 5. Monitoring Tools Installed But Not Configured
- **Status**: NOT DONE
- **Issue**: Prometheus, Grafana, Uptime Kuma, Portainer all running in Docker but unconfigured
- **Details**:
  - No dashboards in Grafana
  - No alerts in Uptime Kuma
  - Windows/PM2/Docker metric exporters not installed
  - Prometheus scraping empty targets
- **Fix**: Install exporters, import Grafana dashboards, configure Uptime Kuma alerts
- **Impact**: Real observability into server health

### 6. No Alerting
- **Status**: NOT DONE
- **Issue**: If a service crashes at 2am, nobody knows until manual check
- **Fix**: Configure Uptime Kuma to email Lee on service failure
- **Impact**: Immediate awareness of any downtime

---

## Should Fix (Non-Blocking)

| Issue | Risk | Priority |
|-------|------|----------|
| Grafana password hardcoded in docker-compose.yml (`admin/navada`) | Security | Medium |
| No TLS on local services (HTTP only) | Fine for LAN, not for public | Medium |
| Laptop power/sleep settings not locked down | Could sleep mid-operation | Medium |
| No graceful shutdown on power events | Data corruption risk | Medium |
| D: and E: drives nearly full (87%, 77%) | Not critical if C: is main | Low |
| Cloudflare tunnel token in plaintext .env | Security | Medium |
| Jupyter token hardcoded in ecosystem.config.js | Security | Low |

---

## What's Already Solid

- Docker containers all `restart: always`
- PM2 processes have crash recovery with restart limits
- Nginx reverse proxy with rate limiting and security headers
- Cloudflare tunnel for public HTTPS access
- Tailscale for private VPN access
- 8 scheduled automations running via Windows Task Scheduler
- `navada-ctl.js` CLI for service management
- Health check endpoint at `/health`
- 134 GB free on C: drive (47% usage)

---

## Current Production Readiness

| Component | Score |
|-----------|-------|
| Process Management (PM2) | 7/10 |
| Docker Infrastructure | 8/10 |
| Auto-Start at Boot | 6/10 |
| Monitoring (Prometheus/Grafana) | 4/10 |
| Health Checks | 3/10 |
| Backup & Disaster Recovery | 0/10 |
| Log Management | 2/10 |
| Error Alerting | 0/10 |
| **Overall** | **40/100** |

---

## Recommended Fix Order

1. Ethernet cable (5 mins, hardware)
2. PM2 auto-start after reboot (30 mins, script change)
3. Log rotation (15 mins, pm2-logrotate)
4. Backup script (1 hour, new automation)
5. Uptime Kuma alerts (30 mins, config)
6. Laptop power settings (10 mins, Windows settings)
7. Grafana dashboards + exporters (1-2 hours)

---

*Ask Claude to action any of these items when ready.*
