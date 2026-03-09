-- NAVADA Edge D1 Schema
-- Replaces: DynamoDB navada-edge-logs, CloudWatch metrics, health checks

-- Metrics table (replaces CloudWatch put-metric-data)
CREATE TABLE IF NOT EXISTS metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  node TEXT NOT NULL,
  namespace TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  value REAL NOT NULL,
  unit TEXT DEFAULT 'Count',
  dimensions TEXT,
  ts DATETIME DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_metrics_node_ts ON metrics(node, ts);
CREATE INDEX IF NOT EXISTS idx_metrics_namespace ON metrics(namespace, metric_name, ts);

-- Edge logs (replaces DynamoDB navada-edge-logs)
CREATE TABLE IF NOT EXISTS edge_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  node TEXT NOT NULL,
  event_type TEXT NOT NULL,
  message TEXT,
  data TEXT,
  ts DATETIME DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_logs_node_ts ON edge_logs(node, ts);
CREATE INDEX IF NOT EXISTS idx_logs_type ON edge_logs(event_type, ts);

-- Health checks (replaces hp-health-monitor alerts)
CREATE TABLE IF NOT EXISTS health_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  node TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  status TEXT NOT NULL,
  response_ms INTEGER,
  error TEXT,
  ts DATETIME DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_health_node_ts ON health_checks(node, ts);

-- Auto-cleanup: keep 30 days
CREATE TRIGGER IF NOT EXISTS cleanup_old_metrics AFTER INSERT ON metrics
BEGIN
  DELETE FROM metrics WHERE ts < datetime('now', '-30 days') AND id % 100 = 0;
END;

CREATE TRIGGER IF NOT EXISTS cleanup_old_logs AFTER INSERT ON edge_logs
BEGIN
  DELETE FROM edge_logs WHERE ts < datetime('now', '-30 days') AND id % 100 = 0;
END;

CREATE TRIGGER IF NOT EXISTS cleanup_old_health AFTER INSERT ON health_checks
BEGIN
  DELETE FROM health_checks WHERE ts < datetime('now', '-30 days') AND id % 100 = 0;
END;
