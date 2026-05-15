export default defineEventHandler(async (event) => {
  const q = ((getQuery(event).q as string) || '').trim()
  if (!q) return []

  // 尝试 FTS5 全文搜索（速度快，支持 CJK）
  // FTS5 match 语法：直接传查询词，自动分字匹配
  const ftsQuery = q.replace(/["*^()\[\]:]/g, ' ').trim() + '*'
  const rows = await queryD1<{ slug: string; title: string; description: string; pub_date: string; tags: string; draft: number }>(
    event,
    `SELECT p.slug, p.title, p.description, p.pub_date, p.tags, p.draft
     FROM posts_fts f
     JOIN posts p ON p.slug = f.slug
     WHERE posts_fts MATCH ? AND p.draft = 0 AND p.slug != 'about'
     ORDER BY rank
     LIMIT 20`,
    [ftsQuery]
  ).catch(() => null)

  // FTS 失败时降级到 LIKE
  if (rows !== null) {
    return rows.map(r => ({ slug: r.slug, title: r.title, description: r.description, pub_date: r.pub_date, tags: JSON.parse(r.tags || '[]') as string[], draft: r.draft === 1 }))
  }

  const like = `%${q}%`
  const fallbackRows = await queryD1<{ slug: string; title: string; description: string; pub_date: string; tags: string; draft: number }>(
    event, `SELECT slug,title,description,pub_date,tags,draft FROM posts WHERE draft=0 AND slug!='about' AND (title LIKE ? OR description LIKE ? OR content LIKE ?) ORDER BY pub_date DESC, updated_at DESC LIMIT 20`, [like, like, like]
  )
  return fallbackRows.map(r => ({ slug: r.slug, title: r.title, description: r.description, pub_date: r.pub_date, tags: JSON.parse(r.tags || '[]') as string[], draft: r.draft === 1 }))
})
