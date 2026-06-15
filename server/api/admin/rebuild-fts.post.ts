// server/api/admin/rebuild-fts.post.ts — FTS5 全量重建
import { verifyToken } from '../../utils/auth'
import { calcWordCount } from '../../utils/fts'

export default defineEventHandler(async (event) => {
  await verifyToken(event)
  const db = getD1(event)

  // 取所有文章
  const rows = await queryD1<{ slug: string; title: string; description: string; content: string }>(
    event,
    `SELECT slug, title, description, content FROM posts`
  )

  // 清空 FTS，重新插入
  await db.prepare(`DELETE FROM posts_fts`).run()
  let rebuilt = 0
  for (const p of rows) {
    const wc = calcWordCount(p.content)
    await db.batch([
      db.prepare(`INSERT OR REPLACE INTO posts_fts(slug,title,description,content) VALUES(?,?,?,?)`)
        .bind(p.slug, p.title, p.description || '', p.content),
      db.prepare(`UPDATE posts SET word_count=? WHERE slug=?`).bind(wc, p.slug),
    ])
    rebuilt++
  }

  return { rebuilt, total: rows.length }
})
