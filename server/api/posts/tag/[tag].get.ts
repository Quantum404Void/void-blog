export default defineEventHandler(async (event) => {
  const tag = getRouterParam(event, 'tag')
  if (!tag) throw createError({ statusCode: 400, message: 'Missing tag' })
  const rows = await queryD1<{
    slug: string; title: string; description: string; pub_date: string; tags: string; draft: number
  }>(event, `SELECT slug,title,description,pub_date,tags,draft FROM posts WHERE draft=0 AND slug!='about' AND tags LIKE ? ORDER BY pub_date DESC`, [`%"${tag}"%`])
  return rows.map(r => ({
    slug: r.slug, title: r.title, description: r.description,
    pub_date: r.pub_date, tags: JSON.parse(r.tags || '[]') as string[], draft: r.draft === 1,
  }))
})
