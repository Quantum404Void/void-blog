export interface PostSummary {
  slug: string
  title: string
  description: string
  pub_date: string
  tags: string[]
  draft: boolean
  /** 浏览量（来自 post_stats 表，可能为空） */
  views?: number
  /** 点赞数（来自 post_stats 表，可能为空） */
  likes?: number
  /** 字数（来自 D1 migration 0002，可能为空） */
  word_count?: number
}

export interface Post extends PostSummary {
  content: string
  /** 服务端预渲染的基础 HTML（无 Shiki 高亮），客户端立刻展示 */
  content_html?: string
}
