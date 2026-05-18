// server/utils/response.ts

import type { ApiError } from '../types/index'
import type { PostRow } from '../types/index'

/** 创建标准成功响应 */
export function ok<T>(data: T) {
  return data
}

/** 创建标准错误 — 抛出 H3Error */
export function apiError(statusCode: number, code: string, message: string): never {
  throw createError({ statusCode, message, data: { code, message } satisfies ApiError })
}

/** 解析 D1 tags JSON 字段 */
export function parseTags(raw: string | null | undefined): string[] {
  try { return JSON.parse(raw || '[]') as string[] }
  catch { return [] }
}

/** D1 row → PostSummary（不含 content） */
export function rowToSummary(row: PostRow) {
  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    pub_date: row.pub_date,
    tags: parseTags(row.tags),
    draft: row.draft === 1,
    word_count: row.word_count,
  }
}
