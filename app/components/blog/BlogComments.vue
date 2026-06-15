<template>
  <div class="blog-comments">
    <hr class="section-divider" />
    <CommentForm :slug="slug" @submitted="refresh" />
    <CommentList :comments="comments" />
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'BlogComments' })

const props = defineProps<{ slug: string }>()

interface Comment {
  id: number
  nickname: string
  content: string
  parent_id: number | null
  created_at: string
}

const { data, refresh } = await useFetch<Comment[]>(`/api/comments/${props.slug}`)
const comments = computed(() => data.value || [])
</script>

<style scoped>
.section-divider {
  border: none;
  border-top: 1px solid var(--color-void-border);
  margin: 40px 0 24px;
}
</style>
