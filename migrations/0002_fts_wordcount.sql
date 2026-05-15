-- Migration 0002: FTS5 全文搜索 + word_count 缓存字段

-- 1. 给 posts 表加 word_count 字段（缓存计算结果，避免 stats API 每次扫全文）
ALTER TABLE posts ADD COLUMN word_count INTEGER NOT NULL DEFAULT 0;

-- 2. FTS5 虚拟表：全文检索 title + description + content
--    tokenize='unicode61' 支持 CJK 分字
CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(
  slug UNINDEXED,
  title,
  description,
  content,
  tokenize='unicode61'
);

-- 3. 把现有数据同步到 FTS
INSERT INTO posts_fts (slug, title, description, content)
SELECT slug, title, description, content FROM posts WHERE draft = 0;
