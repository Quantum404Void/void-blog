import type { H3Event } from 'h3'
import { apiError } from './response'
import { calcWordCount } from './fts'
import { getD1 } from './d1'

export interface AdminPostInput {
  slug?: unknown
  title?: unknown
  description?: unknown
  content?: unknown
  pub_date?: unknown
  tags?: unknown
  draft?: unknown
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function parseAdminPostInput(body: AdminPostInput) {
  const slug = typeof body.slug === 'string' ? body.slug.trim() : ''
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const content = typeof body.content === 'string' ? body.content.trim() : ''
  const pubDate = typeof body.pub_date === 'string' && body.pub_date.trim()
    ? body.pub_date.trim()
    : new Date().toISOString().slice(0, 10)
  const tags = Array.isArray(body.tags)
    ? [...new Set(body.tags.filter((tag): tag is string => typeof tag === 'string').map(tag => tag.trim()).filter(Boolean))].slice(0, 20)
    : []

  if (!slug || !title || !content) apiError(400, 'INVALID_POST', '标题、Slug 和正文不能为空')
  if (!SLUG_PATTERN.test(slug) || slug.length > 80) apiError(400, 'INVALID_SLUG', 'Slug 只能包含小写字母、数字和连字符，且不超过 80 个字符')
  if (title.length > 160) apiError(400, 'TITLE_TOO_LONG', '标题不能超过 160 个字符')
  if (description.length > 320) apiError(400, 'DESCRIPTION_TOO_LONG', '摘要不能超过 320 个字符')
  if (!DATE_PATTERN.test(pubDate)) apiError(400, 'INVALID_DATE', '发布日期格式必须为 YYYY-MM-DD')

  return {
    slug,
    title,
    description,
    content,
    pubDate,
    tags,
    draft: Boolean(body.draft),
  }
}

export function createPostStatements(event: H3Event, post: ReturnType<typeof parseAdminPostInput>) {
  const db = getD1(event)
  const statements = [
    db.prepare(`INSERT INTO posts (slug, title, description, content, pub_date, tags, draft, word_count, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`)
      .bind(post.slug, post.title, post.description, post.content, post.pubDate, JSON.stringify(post.tags), post.draft ? 1 : 0, calcWordCount(post.content)),
  ]

  if (!post.draft) {
    statements.push(
      db.prepare('INSERT INTO posts_fts (slug, title, description, content) VALUES (?, ?, ?, ?)')
        .bind(post.slug, post.title, post.description, post.content),
    )
  }

  return statements
}

export async function getStoredPost(event: H3Event, slug: string) {
  const row = await getD1(event).prepare(
    'SELECT slug, title, description, content, pub_date, tags, draft FROM posts WHERE slug=?',
  ).bind(slug).first<{
    slug: string
    title: string
    description: string
    content: string
    pub_date: string
    tags: string
    draft: number
  }>()

  if (!row) apiError(404, 'POST_NOT_FOUND', '文章不存在或已被删除')
  return row
}

export function parseStoredTags(tags: string): string[] {
  try {
    const parsed = JSON.parse(tags)
    return Array.isArray(parsed) ? parsed : []
  }
  catch {
    return []
  }
}

export function updatePostStatements(event: H3Event, slug: string, post: ReturnType<typeof parseAdminPostInput>) {
  const db = getD1(event)
  const statements = [
    db.prepare(`UPDATE posts SET title=?, description=?, content=?, pub_date=?, tags=?, draft=?, word_count=?, updated_at=datetime('now') WHERE slug=?`)
      .bind(post.title, post.description, post.content, post.pubDate, JSON.stringify(post.tags), post.draft ? 1 : 0, calcWordCount(post.content), slug),
    db.prepare('DELETE FROM posts_fts WHERE slug=?').bind(slug),
  ]

  if (!post.draft) {
    statements.push(
      db.prepare('INSERT INTO posts_fts (slug, title, description, content) VALUES (?, ?, ?, ?)')
        .bind(slug, post.title, post.description, post.content),
    )
  }

  return statements
}

export function deletePostStatements(event: H3Event, slug: string) {
  const db = getD1(event)
  return [
    db.prepare('DELETE FROM posts_fts WHERE slug=?').bind(slug),
    db.prepare('DELETE FROM post_stats WHERE slug=?').bind(slug),
    db.prepare('DELETE FROM comments WHERE slug=?').bind(slug),
    db.prepare('DELETE FROM posts WHERE slug=?').bind(slug),
  ]
}

export function getD1Error(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  if (/UNIQUE constraint failed: posts\.slug/i.test(message)) {
    apiError(409, 'SLUG_EXISTS', '这个 Slug 已存在，请修改后再保存')
  }
  console.error(JSON.stringify({ message: 'admin post write failed', error: message }))
  apiError(500, 'POST_WRITE_FAILED', '文章保存失败，请稍后重试')
}
