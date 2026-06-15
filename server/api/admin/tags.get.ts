// server/api/admin/tags.get.ts — 全站标签使用频率统计
import { verifyToken } from '../../utils/auth'

interface TagCount { tag: string; count: number }

export default defineEventHandler(async (event) => {
  await verifyToken(event)
  const rows = await queryD1<{ tags: string }>(
    event,
    `SELECT tags FROM posts WHERE draft=0`
  )
  const counts: Record<string, number> = {}
  for (const r of rows) {
    try {
      const tags: string[] = JSON.parse(r.tags || '[]')
      for (const t of tags) if (t) counts[t] = (counts[t] || 0) + 1
    } catch {}
  }
  const result: TagCount[] = Object.entries(counts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
  return result
})
