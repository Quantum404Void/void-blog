-- void-blog posts table
CREATE TABLE IF NOT EXISTS posts (
  slug        TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  content     TEXT NOT NULL DEFAULT '',
  pub_date    TEXT NOT NULL,  -- ISO 8601
  tags        TEXT NOT NULL DEFAULT '[]',  -- JSON array string
  draft       INTEGER NOT NULL DEFAULT 0,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_posts_pub_date ON posts(pub_date DESC);
CREATE INDEX IF NOT EXISTS idx_posts_draft    ON posts(draft);
