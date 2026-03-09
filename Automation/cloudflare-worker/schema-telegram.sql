-- Telegram Bot D1 Schema
-- Conversation memory, user registry, command logs

-- User registry (replaces kb/telegram-users.json)
CREATE TABLE IF NOT EXISTS telegram_users (
  user_id TEXT PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  role TEXT DEFAULT 'guest',
  granted_at DATETIME DEFAULT (datetime('now')),
  expires_at DATETIME,
  blocked INTEGER DEFAULT 0
);

-- Conversation memory (replaces kb/telegram-memory.json)
CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  model TEXT,
  tokens_in INTEGER,
  tokens_out INTEGER,
  ts DATETIME DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_conv_user_ts ON conversations(user_id, ts);

-- Command log (replaces logs/telegram-interactions.jsonl)
CREATE TABLE IF NOT EXISTS command_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  command TEXT,
  message TEXT,
  response TEXT,
  model TEXT,
  cost REAL,
  latency_ms INTEGER,
  ts DATETIME DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_cmdlog_ts ON command_log(ts);

-- Cache table (replaces SQLite + ChromaDB response cache)
CREATE TABLE IF NOT EXISTS response_cache (
  query_hash TEXT PRIMARY KEY,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  model TEXT,
  ts DATETIME DEFAULT (datetime('now'))
);

-- Auto-cleanup: keep 30 days of conversations, 7 days of cache
CREATE TRIGGER IF NOT EXISTS cleanup_old_conversations AFTER INSERT ON conversations
BEGIN
  DELETE FROM conversations WHERE ts < datetime('now', '-30 days') AND id % 50 = 0;
END;

CREATE TRIGGER IF NOT EXISTS cleanup_old_cache AFTER INSERT ON response_cache
BEGIN
  DELETE FROM response_cache WHERE ts < datetime('now', '-7 days') AND rowid % 20 = 0;
END;
