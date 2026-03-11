# Post-Deploy Health Check Hook

## Trigger
After successful deployment to Cloudflare Worker or EC2.

## Action
Run health checks against deployed endpoints.

## Instructions
After deploying worker.js, verify:
1. `curl -s -H "X-API-Key: navada-edge-2026" https://edge-api.navada-edge-server.uk/status` returns `{"status":"online"}`
2. `curl -s -H "X-API-Key: navada-edge-2026" https://edge-api.navada-edge-server.uk/health/telegram` returns `{"healthy":true}`

After deploying to EC2, verify:
1. `curl -s -H "X-API-Key: navada-ec2" http://3.11.119.181:9090/api/status` returns 200

## Description
Ensures deployments are verified immediately. Catches silent failures.
