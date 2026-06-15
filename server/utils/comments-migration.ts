// Auto-migration for comments table — runs on first API call
// No CI dependency needed
import type { H3Event } from 'h3'
import { getD1 } from './d1'

let migrated = false

export async function ensureCommentsTable(event: H3Event): Promise<void> {
  if (migrated) return

  const db = getD1(event)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL,
      nickname TEXT NOT NULL,
      email TEXT DEFAULT '',
      content TEXT NOT NULL,
      parent_id INTEGER DEFAULT NULL,
      approved INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_comments_slug ON comments(slug);
    CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at);
  `)

  migrated = true
}
