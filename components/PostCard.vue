<template>
  <NuxtLink
    :href="`/blog/${post.slug}`"
    class="group block p-4 rounded-xl border border-transparent hover:border-[var(--color-void-border)] hover:bg-[var(--color-void-card)] transition-all"
  >
    <div class="flex items-start justify-between gap-4 mb-1">
      <h3 class="font-mono text-sm text-[var(--color-text-primary)] group-hover:text-[var(--color-neon-cyan)] transition-colors leading-snug">
        {{ post.title }}
      </h3>
      <time :datetime="post.pub_date" class="font-mono text-[10px] text-[var(--color-text-muted)] shrink-0">
        {{ formatDate(post.pub_date) }}
      </time>
    </div>
    <p v-if="post.description" class="text-xs text-[var(--color-text-muted)] line-clamp-2 mt-0.5">
      {{ post.description }}
    </p>
    <div class="flex flex-wrap gap-1.5 mt-2">
      <span
        v-for="t in post.tags.slice(0, 3)"
        :key="t"
        class="font-mono text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--color-void-muted)] text-[var(--color-text-muted)]"
      >#{{ t }}</span>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { PostSummary } from '~/types/post'
defineProps<{ post: PostSummary }>()
const { formatDate } = useFormatDate()
</script>
