# NAVADA Server — To-Do List

## Ops / Monitoring

### [ ] Grafana + Prometheus
- Real-time dashboards for CPU, RAM, disk, Docker stats, PM2 health
- Proper ops visibility — see everything on one screen from iPhone
- Runs as Docker containers, add to `infrastructure/docker-compose.yml`
- Default port: Grafana `:3000` (remap to `:9090`), Prometheus `:9091`

### [ ] Portainer
- Docker management UI — start/stop/inspect containers from a web browser
- Much easier than CLI for day-to-day container management
- Single Docker container, 2 min setup
- Default port: `:9000`

### [ ] Uptime Kuma
- Self-hosted uptime monitor — pings all services, alerts if anything goes down
- Free Pingdom alternative — Slack/email alerts on failure
- Monitors: Nginx, PM2 processes, scheduled tasks, Tailscale, external sites
- Single Docker container
- Default port: `:3001` (remap to avoid conflict)

## Dev / ML

### [ ] MLflow
- ML experiment tracking — logs params, metrics, models, artifacts
- Full ML lifecycle: training runs, model registry, deployment
- Complements TensorBoard (already installed)
- `pip install mlflow` then `mlflow server --host 0.0.0.0`
- Default port: `:5000`

### [ ] Jupyter Lab (Persistent Server)
- Already have Jupyter MCP, but a persistent server accessible from iPhone
- `py -m jupyterlab --ip 0.0.0.0 --port 8888 --no-browser`
- Add to PM2 for always-on access
- Default port: `:8888`

---

*Last updated: 2026-02-26*
