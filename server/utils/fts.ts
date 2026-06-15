// server/utils/fts.ts — FTS5 同步工具函数
import type { H3Event } from 'h3'
import { queryD1, getD1 } from './d1'

/** 计算字数（CJK 按字，英文按单词） */
export function calcWordCount(content: string): number {
  const cjk = (content.match(/[\u4e00-\u9fa5]/g) || []).length
  const en = (content.replace(/[\u4e00-\u9fa5]/g, '').match(/\b\w+\b/g) || []).length
  return cjk + en
}

/** 新建文章后同步到 FTS + 更新 word_count */
export async function ftsInsert(event: H3Event, slug: string, title: string, description: string, content: string) {
  const wc = calcWordCount(content)
  const db = getD1(event)
  await db.batch([
    db.prepare('INSERT OR REPLACE INTO posts_fts (slug, title, description, content) VALUES (?, ?, ?, ?)').bind(slug, title, description, content),
    db.prepare('UPDATE posts SET word_count=? WHERE slug=?').bind(wc, slug),
  ])
}

/** 更新文章后同步 FTS（只更新有变动的字段） */
export async function ftsUpdate(event: H3Event, slug: string, fields: {
  title?: string; description?: string; content?: string
}) {
  const db = getD1(event)
  const stmts = []

  // 先删旧记录再插入（FTS5 content 表需要完整行）
  if (fields.title !== undefined || fields.description !== undefined || fields.content !== undefined) {
    // 取当前数据
    const rows = await queryD1<{ title: string; description: string; content: string }>(
      event, 'SELECT title, description, content FROM posts WHERE slug=?', [slug]
    )
    if (!rows.length) return
    const cur = rows[0]
    const newTitle = fields.title ?? cur.title
    const newDesc = fields.description ?? cur.description
    const newContent = fields.content ?? cur.content
    const wc = calcWordCount(newContent)
    stmts.push(
      db.prepare('DELETE FROM posts_fts WHERE slug=?').bind(slug),
      db.prepare('INSERT INTO posts_fts (slug, title, description, content) VALUES (?, ?, ?, ?)').bind(slug, newTitle, newDesc, newContent),
      db.prepare('UPDATE posts SET word_count=? WHERE slug=?').bind(wc, slug),
    )
    await db.batch(stmts)
  }
}

/** 删除文章后从 FTS 移除 */
export async function ftsDelete(event: H3Event, slug: string) {
  await queryD1(event, 'DELETE FROM posts_fts WHERE slug=?', [slug])
}
