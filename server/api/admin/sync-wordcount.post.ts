// server/api/admin/sync-wordcount.post.ts
// 批量计算所有文章 word_count 并写入 D1
import { calcWordCount } from '../../utils/fts'
import { queryD1, getD1 } from '../../utils/d1'
import { verifyToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await verifyToken(event)

  const posts = await queryD1<{ slug: string; content: string }>(
    event,
    'SELECT slug, content FROM posts WHERE draft=0',
  )

  const db = getD1(event)
  let updated = 0
  for (const p of posts) {
    const wc = calcWordCount(p.content)
    await db.prepare('UPDATE posts SET word_count=? WHERE slug=?').bind(wc, p.slug).run()
    updated++
  }

  return { updated, total: posts.length }
})
