// composables/usePosts.ts
export interface PostMeta {
  slug: string
  title: string
  description: string
  pub_date: string
  tags: string[]
  draft: boolean
}

export function usePosts() {
  const posts = useState<PostMeta[]>('posts', () => [])
  const pending = ref(false)
  const error = ref<Error | null>(null)

  async function fetchPosts() {
    pending.value = true
    error.value = null
    try {
      const data = await $fetch<PostMeta[]>('/api/posts')
      posts.value = data
    } catch (e) {
      error.value = e as Error
    } finally {
      pending.value = false
    }
  }

  return { posts, pending, error, fetchPosts }
}
