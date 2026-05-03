// composables/usePost.ts
export interface Post {
  slug: string
  title: string
  description: string
  content: string
  pub_date: string
  tags: string[]
  draft: boolean
}

export function usePost(slug: string) {
  return useLazyFetch<Post>(`/api/posts/${slug}`)
}
