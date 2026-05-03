// server/api/admin/posts/index.get.ts — 获取所有文章（含草稿）
export default defineEventHandler(async (event) => {
  const rows = await queryD1<{
    slug: string; title: string; description: string; pub_date: string; tags: string; draft: number; updated_at: string
  }>(event, "SELECT slug,title,description,pub_date,tags,draft,updated_at FROM posts ORDER BY pub_date DESC, updated_at DESC")

  return rows.map(r => ({
    slug: r.slug, title: r.title, description: r.description,
    pub_date: r.pub_date, tags: JSON.parse(r.tags || '[]') as string[],
    draft: r.draft === 1, updated_at: r.updated_at,
  }))
})
