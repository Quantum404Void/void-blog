// server/api/posts/index.get.ts
import type { PostRow } from '../../types/index'
import { rowToSummary } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const rows = await queryD1<PostRow>(
    event,
    "SELECT slug,title,description,pub_date,tags,draft,word_count FROM posts WHERE draft=0 AND slug!='about' ORDER BY pub_date DESC, updated_at DESC"
  )
  return rows.map(rowToSummary)
})
