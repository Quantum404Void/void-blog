// GET /api/stats/:slug — 返回 views + likes
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, message: 'Missing slug' })

  const rows = await queryD1<{ views: number; likes: number }>(
    event,
    'SELECT views, likes FROM post_stats WHERE slug=?',
    [slug]
  )
  return rows[0] ?? { views: 0, likes: 0 }
})
