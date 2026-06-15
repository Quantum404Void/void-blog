// server/types/index.ts
// Server-side shared types (not exported to client)

/** API 错误响应 */
export interface ApiError {
  code: string
  message: string
}

/** 统一分页参数 */
export interface PaginationQuery {
  page?: number
  limit?: number
}

/** Post 数据库行（D1 raw row） */
export interface PostRow {
  slug: string
  title: string
  description: string
  content: string
  pub_date: string
  updated_at: string
  tags: string        // JSON string
  draft: number       // 0 | 1
  word_count?: number
}

/** Stats row */
export interface StatsRow {
  slug: string
  views: number
  likes: number
}
