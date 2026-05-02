// src/lib/db.ts
// D1 data access layer for void-blog posts
// Astro v6 + @astrojs/cloudflare v13: use cloudflare:workers env

import { env } from 'cloudflare:workers'

function getDB(): D1Database {
  const e = env as unknown as { void_blog_posts: D1Database }
  if (!e?.void_blog_posts) throw new Error('D1 binding void_blog_posts not found')
  return e.void_blog_posts
}

export interface Post {
  slug: string
  title: string
  description: string
  content: string
  pub_date: string
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

export async function getAllPosts(includeDraft = false): Promise<PostMeta[]> {
  const db = getDB()
  const q = includeDraft
    ? 'SELECT slug,title,description,pub_date,tags,draft FROM posts ORDER BY pub_date DESC'
    : 'SELECT slug,title,description,pub_date,tags,draft FROM posts WHERE draft=0 ORDER BY pub_date DESC'
  const { results } = await db.prepare(q).all()
  return results.map(parsePostMeta)
}

export async function getPost(slug: string): Promise<Post | null> {
  const db = getDB()
  const row = await db.prepare('SELECT * FROM posts WHERE slug=? AND draft=0').bind(slug).first()
  if (!row) return null
  return parsePost(row)
}

export async function getPostsByTag(tag: string): Promise<PostMeta[]> {
  const db = getDB()
  const { results } = await db.prepare(
    `SELECT slug,title,description,pub_date,tags,draft FROM posts WHERE draft=0 AND tags LIKE ? ORDER BY pub_date DESC`
  ).bind(`%"${tag}"%`).all()
  return results.map(parsePostMeta)
}

export async function getAllTags(): Promise<Record<string, number>> {
  const db = getDB()
  const { results } = await db.prepare('SELECT tags FROM posts WHERE draft=0').all()
  const counts: Record<string, number> = {}
  for (const row of results) {
    const tags: string[] = JSON.parse((row.tags as string) || '[]')
    for (const t of tags) counts[t] = (counts[t] || 0) + 1
  }
  return counts
}

export async function searchPosts(q: string): Promise<PostMeta[]> {
  const db = getDB()
  const like = `%${q}%`
  const { results } = await db.prepare(
    `SELECT slug,title,description,pub_date,tags,draft FROM posts WHERE draft=0 AND (title LIKE ? OR description LIKE ?) ORDER BY pub_date DESC LIMIT 20`
  ).bind(like, like).all()
  return results.map(parsePostMeta)
}
