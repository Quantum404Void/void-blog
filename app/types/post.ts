export interface PostSummary {
  slug: string
  title: string
  description: string
  pub_date: string
  tags: string[]
  draft: boolean
}

export interface Post extends PostSummary {
  content: string
}
