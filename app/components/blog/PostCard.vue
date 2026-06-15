<template>
  <NuxtLink
    :href="`/blog/${post.slug}`"
    class="group relative block p-4 rounded-xl border border-[var(--color-void-border)] hover:border-[rgba(0,212,255,0.35)] bg-[var(--color-void-card)] hover:bg-[rgba(19,19,31,0.95)] transition-all duration-200 overflow-hidden"
    :style="'box-shadow:0 0 0 0 transparent'"
    @mouseover="(e: MouseEvent) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(0,212,255,0.07)' }"
    @mouseout="(e: MouseEvent) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 0 transparent' }"
  >
    <!-- 左侧 neon 标签色条 -->
    <div
      class="absolute left-0 top-3 bottom-3 w-[3px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      :style="`background: var(--color-${getTagColor(post.tags[0] ?? '')});box-shadow:0 0 8px var(--color-${getTagColor(post.tags[0] ?? '')})`"
    ></div>

    <div class="mb-1 flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4 pl-1">
      <!-- 文件名风格标题 -->
      <h3 class="font-mono text-sm text-[var(--color-text-primary)] group-hover:text-[var(--color-neon-cyan)] transition-colors leading-snug flex items-center gap-2">
        <span class="text-[var(--color-text-muted)] opacity-50 group-hover:opacity-100 transition-opacity text-[11px]">▸</span>
        {{ post.title }}
      </h3>
      <time :datetime="post.pub_date" class="font-mono text-[10px] text-[var(--color-text-muted)] shrink-0 tabular-nums">
        {{ formatDate(post.pub_date) }}
      </time>
    </div>
    <p v-if="post.description" class="text-xs text-[var(--color-text-muted)] line-clamp-2 mt-1 pl-1 leading-relaxed">
      {{ post.description }}
    </p>
    <div class="flex flex-wrap gap-1.5 mt-2.5 pl-1">
      <span
        v-for="t in post.tags.slice(0, 3)"
        :key="t"
        class="font-mono text-[9px] px-1.5 py-0.5 rounded border border-[var(--color-void-muted)] text-[var(--color-text-muted)] tracking-wide"
      >#{{ t }}</span>
    </div>

    <!-- hover 右箭头 -->
    <span class="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-sm text-[var(--color-neon-cyan)] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200">→</span>
  </NuxtLink>
</template>

<script setup lang="ts">
defineOptions({ name: 'PostCard' })

import type { PostSummary } from '~/types/post'
defineProps<{ post: PostSummary }>()
const { formatDate } = useFormatDate()
const { getTagColor } = useTagColor()
</script>
