// server/api/posts/[slug].get.ts
import type { PostRow } from '../../types/index'
import { parseTags } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, message: 'Missing slug' })

  const rows = await queryD1<PostRow>(event, 'SELECT * FROM posts WHERE slug=? AND draft=0', [slug])

  if (!rows.length) throw createError({ statusCode: 404, message: 'Post not found' })
  const r = rows[0]!
  return {
    slug: r.slug,
    title: r.title,
    description: r.description,
    content: r.content,
    pub_date: r.pub_date,
    tags: parseTags(r.tags),
    draft: r.draft === 1,
  }
})
