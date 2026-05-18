// server/api/posts/index.get.ts
import type { PostRow } from '../../types/index'
import { rowToSummary } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const rows = await queryD1<PostRow>(
    event,
    // word_count 列在 migration 0002 之前可能不存在，用 COALESCE 向后兼容
    "SELECT slug,title,description,pub_date,tags,draft FROM posts WHERE draft=0 AND slug!='about' ORDER BY pub_date DESC, updated_at DESC"
  )
  return rows.map(rowToSummary)
})
