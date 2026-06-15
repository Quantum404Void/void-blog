// server/api/admin/posts/index.post.ts — 新建文章
import { ftsInsert } from '../../../utils/fts'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { slug, title, description, content, pub_date, tags, draft } = body

  if (!slug || !title || !content) throw createError({ statusCode: 400, message: 'slug/title/content required' })

  const tagsJson = JSON.stringify(Array.isArray(tags) ? tags : [])
  const date = pub_date || new Date().toISOString().slice(0, 10)
  const isDraft = draft ? 1 : 0

  await queryD1(event,
    `INSERT INTO posts (slug, title, description, content, pub_date, tags, draft, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [slug, title, description || '', content, date, tagsJson, isDraft]
  )
  // 非草稿时同步 FTS
  if (!isDraft) await ftsInsert(event, slug, title, description || '', content)
  return { ok: true, slug }
})
