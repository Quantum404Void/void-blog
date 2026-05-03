// server/api/posts/index.get.ts
export default defineEventHandler(async (event) => {
  const rows = await queryD1<{
    slug: string; title: string; description: string; pub_date: string; tags: string; draft: number
  }>(event, "SELECT slug,title,description,pub_date,tags,draft FROM posts WHERE draft=0 AND slug!='about' ORDER BY pub_date DESC, updated_at DESC")

  return rows.map(r => ({
    slug: r.slug, title: r.title, description: r.description,
    pub_date: r.pub_date, tags: JSON.parse(r.tags || '[]') as string[], draft: r.draft === 1,
  }))
})
