// server/api/stats.get.ts
export default defineEventHandler(async (event) => {
  const rows = await queryD1<{ slug: string; pub_date: string; tags: string; content: string; title: string }>(
    event, 'SELECT slug,pub_date,tags,content,title FROM posts WHERE draft=0 ORDER BY pub_date DESC'
  )
  const posts = rows.map(r => ({ slug: r.slug, pub_date: r.pub_date, tags: JSON.parse(r.tags || '[]') as string[], content: r.content || '', title: r.title }))
  const byYear: Record<string,number> = {}, byMonth: Record<string,number> = {}, tagCounts: Record<string,number> = {}
  const tagPosts: Record<string,string[]> = {}
  let totalWords = 0, longestPost = { slug: '', title: '', wordCount: 0 }, shortestPost = { slug: '', title: '', wordCount: Infinity }
  for (const p of posts) {
    const y = p.pub_date.slice(0,4); byYear[y] = (byYear[y]||0)+1
    const m = p.pub_date.slice(0,7); byMonth[m] = (byMonth[m]||0)+1
    for (const t of p.tags) {
      tagCounts[t] = (tagCounts[t]||0)+1
      tagPosts[t] = tagPosts[t] || []
      tagPosts[t].push(p.slug)
    }
    const cjk = (p.content.match(/[\u4e00-\u9fa5]/g) || []).length
    const wc = cjk + Math.round((p.content.length - cjk) / 5)
    totalWords += wc
    if (wc > longestPost.wordCount) longestPost = { slug: p.slug, title: p.title, wordCount: wc }
    if (wc < shortestPost.wordCount) shortestPost = { slug: p.slug, title: p.title, wordCount: wc }
  }
  return {
    totalPosts: posts.length, totalTags: Object.keys(tagCounts).length, byYear, byMonth, tagCounts,
    recentPosts: posts.slice(0,5).map(p => ({ slug: p.slug, pub_date: p.pub_date, tags: p.tags })),
    totalWords,
    longestPost: longestPost.slug ? longestPost : null,
    shortestPost: shortestPost.wordCount !== Infinity ? shortestPost : null,
    tagPosts,
  }
})
