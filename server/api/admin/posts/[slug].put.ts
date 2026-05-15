// server/api/admin/posts/[slug].put.ts — 更新文章
import { ftsUpdate } from '~/server/utils/fts'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, message: 'Missing slug' })

  const body = await readBody(event)
  const fields: string[] = []
  const params: unknown[] = []

  if (body.title !== undefined)       { fields.push('title=?');       params.push(body.title) }
  if (body.description !== undefined) { fields.push('description=?'); params.push(body.description) }
  if (body.content !== undefined)     { fields.push('content=?');     params.push(body.content) }
  if (body.pub_date !== undefined)    { fields.push('pub_date=?');    params.push(body.pub_date) }
  if (body.tags !== undefined)        { fields.push('tags=?');        params.push(JSON.stringify(body.tags)) }
  if (body.draft !== undefined)       { fields.push('draft=?');       params.push(body.draft ? 1 : 0) }

  if (!fields.length) throw createError({ statusCode: 400, message: 'No fields to update' })

  fields.push("updated_at=datetime('now')")
  params.push(slug)

  await queryD1(event, `UPDATE posts SET ${fields.join(',')} WHERE slug=?`, params)

  // 同步 FTS
  await ftsUpdate(event, slug, {
    title: body.title,
    description: body.description,
    content: body.content,
  })
  return { ok: true }
})
