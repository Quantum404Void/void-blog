import type { H3Event } from 'h3'
import { ensureCommentsTable } from '~~/server/utils/comments-migration'
import { queryD1 } from '~~/server/utils/d1'

export default defineEventHandler(async (event: H3Event) => {
  await ensureCommentsTable(event)
  const slug = getRouterParam(event, 'slug')!

  const rows = await queryD1<{
    id: number
    nickname: string
    content: string
    parent_id: number | null
    created_at: string
  }>(
    event,
    `SELECT id, nickname, content, parent_id, created_at
     FROM comments
     WHERE slug = ? AND approved = 1
     ORDER BY created_at ASC`,
    [slug],
  )

  return rows
})
