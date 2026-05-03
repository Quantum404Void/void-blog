// server/api/admin/posts/index.post.ts — 新建文章
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
  return { ok: true, slug }
})
