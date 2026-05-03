// server/utils/d1.ts
// Cloudflare D1 binding via event.context.cloudflare.env
// Runs natively on Cloudflare Pages Functions — no HTTP overhead, no API key needed.

import type { H3Event } from 'h3'

export function getD1(event: H3Event): D1Database {
  const env = event.context.cloudflare?.env as { void_blog_posts?: D1Database } | undefined
  if (!env?.void_blog_posts) {
    throw new Error('D1 binding void_blog_posts not found. Make sure wrangler.toml is configured.')
  }
  return env.void_blog_posts
}

export async function queryD1<T = Record<string, unknown>>(
  event: H3Event,
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const db = getD1(event)
  const stmt = params.length ? db.prepare(sql).bind(...params) : db.prepare(sql)
  const { results } = await stmt.all<T>()
  return results
}
