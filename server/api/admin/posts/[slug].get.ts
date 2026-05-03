// server/api/admin/posts/[slug].get.ts — 获取单篇（含 content）
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, message: 'Missing slug' })

  const rows = await queryD1<{
    slug: string; title: string; description: string; content: string;
    pub_date: string; tags: string; draft: number; updated_at: string
  }>(event, 'SELECT * FROM posts WHERE slug=?', [slug])

  if (!rows.length) throw createError({ statusCode: 404, message: 'Not found' })
  const r = rows[0]
  return { ...r, tags: JSON.parse(r.tags || '[]'), draft: r.draft === 1 }
})
