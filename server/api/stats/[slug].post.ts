// POST /api/stats/:slug  body: { action: 'view' | 'like' }
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, message: 'Missing slug' })

  const body = await readBody(event).catch(() => ({}))
  const action = body?.action === 'like' ? 'like' : 'view'

  const col = action === 'like' ? 'likes' : 'views'

  await queryD1(
    event,
    `INSERT INTO post_stats (slug, ${col}, updated_at)
     VALUES (?, 1, datetime('now'))
     ON CONFLICT(slug) DO UPDATE SET ${col} = ${col} + 1, updated_at = datetime('now')`,
    [slug]
  )

  const rows = await queryD1<{ views: number; likes: number }>(
    event,
    'SELECT views, likes FROM post_stats WHERE slug=?',
    [slug]
  )
  return rows[0] ?? { views: 0, likes: 0 }
})
