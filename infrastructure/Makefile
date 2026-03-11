# NAVADA Edge — Infrastructure Makefile (inside infrastructure/)
# Quick commands for managing the Oracle Docker stack

ORACLE_HOST = ubuntu@100.77.206.9
ORACLE_KEY = ~/.ssh/oracle-navada

up:
	docker compose -f docker-compose.monitoring.yml up -d

down:
	docker compose -f docker-compose.monitoring.yml down

restart:
	docker compose -f docker-compose.monitoring.yml restart

status:
	docker compose -f docker-compose.monitoring.yml ps

logs:
	docker compose -f docker-compose.monitoring.yml logs --tail 50

oracle-up:
	ssh -i $(ORACLE_KEY) $(ORACLE_HOST) "cd /home/ubuntu/navada && docker compose up -d"

oracle-down:
	ssh -i $(ORACLE_KEY) $(ORACLE_HOST) "cd /home/ubuntu/navada && docker compose down"

oracle-status:
	ssh -i $(ORACLE_KEY) $(ORACLE_HOST) "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"

oracle-logs:
	ssh -i $(ORACLE_KEY) $(ORACLE_HOST) "docker logs navada-proxy --tail 30"

.PHONY: up down restart status logs oracle-up oracle-down oracle-status oracle-logs
