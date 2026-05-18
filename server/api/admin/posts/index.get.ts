// server/api/admin/posts/index.get.ts — 获取所有文章（含草稿 + 访问量/点赞）
export default defineEventHandler(async (event) => {
  const rows = await queryD1<{
    slug: string; title: string; description: string; pub_date: string; tags: string; draft: number; updated_at: string; views: number; likes: number; word_count: number
  }>(event, `
    SELECT p.slug, p.title, p.description, p.pub_date, p.tags, p.draft, p.updated_at,
           p.word_count,
           COALESCE(s.views, 0) AS views, COALESCE(s.likes, 0) AS likes
    FROM posts p
    LEFT JOIN post_stats s ON p.slug = s.slug
    ORDER BY p.pub_date DESC, p.updated_at DESC
  `)

  return rows.map(r => ({
    slug: r.slug, title: r.title, description: r.description,
    pub_date: r.pub_date, tags: JSON.parse(r.tags || '[]') as string[],
    draft: r.draft === 1, updated_at: r.updated_at,
    views: r.views, likes: r.likes, word_count: r.word_count ?? 0,
  }))
})
