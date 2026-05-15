export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, message: 'Missing slug' })

  const rows = await queryD1<{
    slug: string; title: string; description: string; content: string; pub_date: string; tags: string; draft: number
  }>(event, 'SELECT * FROM posts WHERE slug=? AND draft=0', [slug])

  if (!rows.length) throw createError({ statusCode: 404, message: 'Post not found' })
  const r = rows[0]!
  return { slug: r.slug, title: r.title, description: r.description, content: r.content, pub_date: r.pub_date, tags: JSON.parse(r.tags || '[]') as string[], draft: r.draft === 1 }
})
