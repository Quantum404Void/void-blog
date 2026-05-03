export default defineEventHandler(async (event) => {
  const rows = await queryD1<{ slug: string; pub_date: string; tags: string }>(
    event, 'SELECT slug,pub_date,tags FROM posts WHERE draft=0 ORDER BY pub_date DESC'
  )
  const posts = rows.map(r => ({ slug: r.slug, pub_date: r.pub_date, tags: JSON.parse(r.tags || '[]') as string[] }))
  const byYear: Record<string,number> = {}, byMonth: Record<string,number> = {}, tagCounts: Record<string,number> = {}
  for (const p of posts) {
    const y = p.pub_date.slice(0,4); byYear[y] = (byYear[y]||0)+1
    const m = p.pub_date.slice(0,7); byMonth[m] = (byMonth[m]||0)+1
    for (const t of p.tags) tagCounts[t] = (tagCounts[t]||0)+1
  }
  return { totalPosts: posts.length, totalTags: Object.keys(tagCounts).length, byYear, byMonth, tagCounts, recentPosts: posts.slice(0,5) }
})
