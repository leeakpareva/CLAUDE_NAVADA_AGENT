# NAVADA Edge — Infrastructure Management
# Usage: make <target>

# === VARIABLES ===
IMAGE_NAME = navada-edge
CONTAINER_NAME = navada-edge
REGION = eu-west-2
EC2_HOST = ubuntu@3.11.119.181
EC2_KEY = ~/.ssh/aws-navada.pem
ORACLE_HOST = ubuntu@100.77.206.9
ORACLE_KEY = ~/.ssh/oracle-navada
HP_HOST = leeak@192.168.0.58

# === BUILD ===
build:
	docker build -t $(IMAGE_NAME) .

# === DEPLOY ===
deploy-worker:
	cd Automation/cloudflare-worker && npx wrangler deploy

deploy-oracle:
	ssh -i $(ORACLE_KEY) $(ORACLE_HOST) "cd /home/ubuntu/navada && docker compose pull && docker compose up -d"

deploy-ec2:
	scp -i $(EC2_KEY) -r Automation/ $(EC2_HOST):/home/ubuntu/navada-bot/
	ssh -i $(EC2_KEY) $(EC2_HOST) "cd /home/ubuntu/navada-bot && npm install && pm2 restart all"

# === STATUS ===
status:
	@echo "=== NAVADA Edge Status ==="
	@echo ""
	@echo "--- EC2 (NAVADA-COMPUTE) ---"
	@ssh -o ConnectTimeout=5 -o BatchMode=yes -i $(EC2_KEY) $(EC2_HOST) "pm2 list --no-color" 2>/dev/null || echo "UNREACHABLE"
	@echo ""
	@echo "--- Oracle (NAVADA-ROUTER) ---"
	@ssh -o ConnectTimeout=5 -o BatchMode=yes -i $(ORACLE_KEY) $(ORACLE_HOST) "docker ps --format 'table {{.Names}}\t{{.Status}}'" 2>/dev/null || echo "UNREACHABLE"
	@echo ""
	@echo "--- HP (NAVADA-EDGE-SERVER) ---"
	@ssh -o ConnectTimeout=5 -o BatchMode=yes $(HP_HOST) "hostname" 2>/dev/null || echo "UNREACHABLE"
	@echo ""
	@echo "--- Cloudflare (NAVADA-GATEWAY) ---"
	@curl -s "https://edge-api.navada-edge-server.uk/status?key=navada-edge-2026" 2>/dev/null || echo "UNREACHABLE"
	@echo ""
	@echo ""
	@echo "--- Telegram Bot ---"
	@curl -s "https://edge-api.navada-edge-server.uk/health/telegram?key=navada-edge-2026" 2>/dev/null || echo "UNREACHABLE"
	@echo ""

# === HEALTH ===
health:
	@echo "=== Node Health ==="
	@ssh -o ConnectTimeout=5 -o BatchMode=yes -i $(EC2_KEY) $(EC2_HOST) "uptime && free -h | head -2 && df -h / | tail -1" 2>/dev/null || echo "EC2: UNREACHABLE"
	@echo "---"
	@ssh -o ConnectTimeout=5 -o BatchMode=yes -i $(ORACLE_KEY) $(ORACLE_HOST) "uptime && free -h | head -2 && df -h / | tail -1" 2>/dev/null || echo "Oracle: UNREACHABLE"

# === LOGS ===
logs-ec2:
	ssh -i $(EC2_KEY) $(EC2_HOST) "pm2 logs --lines 50 --nostream"

logs-oracle:
	ssh -i $(ORACLE_KEY) $(ORACLE_HOST) "docker logs navada-proxy --tail 50" 2>/dev/null

logs-worker:
	npx wrangler tail --format pretty

logs-d1:
	@curl -s "https://edge-api.navada-edge-server.uk/logs?key=navada-edge-2026&last=60" 2>/dev/null

# === BACKUP / RECOVERY ===
backup:
	bash infrastructure/scripts/backup-navada.sh

recover:
	bash infrastructure/scripts/recover-navada.sh latest

# === SSH ===
ssh-ec2:
	ssh -i $(EC2_KEY) $(EC2_HOST)

ssh-oracle:
	ssh -i $(ORACLE_KEY) $(ORACLE_HOST)

ssh-hp:
	ssh $(HP_HOST)

# === MONITORING ===
monitoring-up:
	cd infrastructure && docker compose -f docker-compose.monitoring.yml up -d

monitoring-down:
	cd infrastructure && docker compose -f docker-compose.monitoring.yml down

# === CLOUDWATCH ===
cw-dashboards:
	aws cloudwatch list-dashboards --region $(REGION) --query 'DashboardEntries[].DashboardName' --output table

cw-costs:
	aws ce get-cost-and-usage \
		--time-period Start=$$(date +%Y-%m-01),End=$$(date +%Y-%m-%d) \
		--granularity MONTHLY \
		--metrics BlendedCost \
		--group-by Type=DIMENSION,Key=SERVICE \
		--output table

# === CLEANUP ===
clean:
	docker container prune -f
	docker image prune -f
	docker volume prune -f

# === HELP ===
help:
	@echo "NAVADA Edge — Make Targets"
	@echo ""
	@echo "  build           Build Docker image"
	@echo "  deploy-worker   Deploy Cloudflare Worker"
	@echo "  deploy-oracle   Deploy Oracle Docker stack"
	@echo "  deploy-ec2      Deploy EC2 services"
	@echo "  status          Show all node status"
	@echo "  health          Show node health (CPU/RAM/disk)"
	@echo "  logs-ec2        EC2 PM2 logs"
	@echo "  logs-oracle     Oracle Docker logs"
	@echo "  logs-worker     Cloudflare Worker live tail"
	@echo "  logs-d1         D1 database logs"
	@echo "  backup          Run full backup to S3"
	@echo "  recover         Restore from latest S3 backup"
	@echo "  ssh-ec2         SSH to EC2"
	@echo "  ssh-oracle      SSH to Oracle"
	@echo "  ssh-hp          SSH to HP"
	@echo "  monitoring-up   Start Prometheus+Grafana+AlertManager"
	@echo "  monitoring-down Stop monitoring stack"
	@echo "  cw-dashboards   List CloudWatch dashboards"
	@echo "  cw-costs        Show current month AWS costs"
	@echo "  clean           Prune Docker resources"

.PHONY: build deploy-worker deploy-oracle deploy-ec2 status health logs-ec2 logs-oracle logs-worker logs-d1 backup recover ssh-ec2 ssh-oracle ssh-hp monitoring-up monitoring-down cw-dashboards cw-costs clean help
