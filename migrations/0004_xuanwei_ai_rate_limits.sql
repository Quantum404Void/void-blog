CREATE TABLE IF NOT EXISTS xuanwei_ai_rate_limits (
  ip TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_xuanwei_ai_rate_limits_ip_time
  ON xuanwei_ai_rate_limits (ip, created_at);
