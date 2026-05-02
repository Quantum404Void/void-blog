// src/lib/db.ts
// D1 data access layer for void-blog posts

export interface Post {
  slug: string
  title: string
  description: string
  content: string
  pub_date: string   // YYYY-MM-DD
  tags: string[]
  draft: boolean
}

export interface PostMeta extends Omit<Post, 'content'> {}

function parsePost(row: Record<string, unknown>): Post {
  return {
    slug: row.slug as string,
    title: row.title as string,
    description: row.description as string,
    content: row.content as string,
    pub_date: row.pub_date as string,
    tags: JSON.parse((row.tags as string) || '[]'),
    draft: row.draft === 1,
  }
}

function parsePostMeta(row: Record<string, unknown>): PostMeta {
  return {
    slug: row.slug as string,
    title: row.title as string,
    description: row.description as string,
    pub_date: row.pub_date as string,
    tags: JSON.parse((row.tags as string) || '[]'),
    draft: row.draft === 1,
  }
}

export async function getAllPosts(db: D1Database, includeDraft = false): Promise<PostMeta[]> {
  const q = includeDraft
    ? 'SELECT slug,title,description,pub_date,tags,draft FROM posts ORDER BY pub_date DESC'
    : 'SELECT slug,title,description,pub_date,tags,draft FROM posts WHERE draft=0 ORDER BY pub_date DESC'
  const { results } = await db.prepare(q).all()
  return results.map(parsePostMeta)
}

export async function getPost(db: D1Database, slug: string): Promise<Post | null> {
  const row = await db.prepare(
    'SELECT * FROM posts WHERE slug=? AND draft=0'
  ).bind(slug).first()
  if (!row) return null
  return parsePost(row)
}

export async function getPostsByTag(db: D1Database, tag: string): Promise<PostMeta[]> {
  // tags stored as JSON array, use LIKE for simple match
  const { results } = await db.prepare(
    `SELECT slug,title,description,pub_date,tags,draft FROM posts
     WHERE draft=0 AND tags LIKE ? ORDER BY pub_date DESC`
  ).bind(`%"${tag}"%`).all()
  return results.map(parsePostMeta)
}

export async function getAllTags(db: D1Database): Promise<Record<string, number>> {
  const { results } = await db.prepare(
    'SELECT tags FROM posts WHERE draft=0'
  ).all()
  const counts: Record<string, number> = {}
  for (const row of results) {
    const tags: string[] = JSON.parse((row.tags as string) || '[]')
    for (const t of tags) counts[t] = (counts[t] || 0) + 1
  }
  return counts
}

export async function searchPosts(db: D1Database, q: string): Promise<PostMeta[]> {
  const like = `%${q}%`
  const { results } = await db.prepare(
    `SELECT slug,title,description,pub_date,tags,draft FROM posts
     WHERE draft=0 AND (title LIKE ? OR description LIKE ?)
     ORDER BY pub_date DESC LIMIT 20`
  ).bind(like, like).all()
  return results.map(parsePostMeta)
}
