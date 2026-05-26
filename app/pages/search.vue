<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'search' }]" />

    <main class="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <h1 class="font-mono text-2xl font-bold text-[var(--color-text-primary)] mb-8 flex items-center gap-3">
        <span class="text-[var(--color-neon-green)]">$</span> grep -r
      </h1>

      <form @submit.prevent="doSearch" class="mb-8">
        <div class="relative flex flex-col gap-3 sm:flex-row">
          <div class="relative flex-1">
            <input
              v-model="q"
              type="text"
              placeholder="搜索文章、标签..."
              autofocus
              class="w-full bg-[#0f0f1a] border border-[var(--color-void-border)] rounded-lg px-4 py-2.5 pr-10 font-mono text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-neon-cyan)] transition-colors"
            />
            <!-- loading spinner -->
            <div v-if="pending" class="absolute right-3 top-1/2 -translate-y-1/2">
              <svg class="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(0,212,255,0.6)" stroke-width="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            </div>
            <!-- clear button -->
            <button
              v-else-if="q"
              type="button"
              @click="q = ''; results = []"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
              aria-label="清空"
            >✕</button>
          </div>
          <button
            type="submit"
            class="w-full sm:w-auto px-5 py-2.5 bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.35)] rounded-lg font-mono text-sm text-[var(--color-neon-cyan)] hover:bg-[rgba(0,212,255,0.2)] transition-colors"
          >搜索</button>
        </div>
      </form>

      <!-- 结果数量 -->
      <p v-if="searched && !pending" class="font-mono text-xs text-[var(--color-text-muted)] mb-6">
        <span class="text-[var(--color-neon-cyan)]">"{{ lastQ }}"</span>
        — 找到 <span class="text-[var(--color-text-secondary)] font-bold">{{ results.length }}</span> 篇
      </p>

      <!-- 空结果 -->
      <div v-if="searched && !pending && results.length === 0" class="py-10 text-center">
        <div class="font-mono text-[var(--color-text-muted)] text-sm space-y-2">
          <p class="text-2xl mb-4">∅</p>
          <p>没有匹配 <span class="text-[var(--color-neon-cyan)]">"{{ lastQ }}"</span> 的文章</p>
          <p class="text-xs opacity-60">试试更短的关键词，或浏览 <NuxtLink href="/tags" class="text-[var(--color-neon-purple)] hover:underline">标签</NuxtLink></p>
        </div>
      </div>

      <!-- Hot tags (空状态) -->
      <div v-if="!q" class="py-6">
        <p class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-4">
          <span class="text-[var(--color-neon-purple)]">▶</span> 热门标签
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="tag in hotTags"
            :key="tag"
            @click="q = tag; doSearch()"
            class="font-mono text-xs px-3 py-1 rounded-full border border-[var(--color-void-border)] text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)] hover:border-[rgba(0,212,255,0.3)] transition-all"
          >#{{ tag }}</button>
        </div>
      </div>

      <!-- 结果列表（带高亮） -->
      <div class="space-y-2">
        <NuxtLink
          v-for="post in results"
          :key="post.slug"
          :href="`/blog/${post.slug}`"
          class="result-item group block p-4 sm:p-5 rounded-xl border border-[var(--color-void-border)] hover:border-[rgba(0,212,255,0.35)] hover:bg-[var(--color-void-card)] transition-all"
        >
          <div class="flex flex-wrap gap-1.5 mb-2">
            <span v-for="tag in post.tags.slice(0,3)" :key="tag"
              class="font-mono text-[10px] px-2 py-0.5 rounded-full border"
              :class="lastQ && tag.includes(lastQ)
                ? 'border-[rgba(0,212,255,0.5)] text-[var(--color-neon-cyan)] bg-[rgba(0,212,255,0.08)]'
                : 'border-[var(--color-void-border)] text-[var(--color-text-muted)]'"
            >#{{ tag }}</span>
          </div>
          <h2 class="font-mono text-sm sm:text-base font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-neon-cyan)] transition-colors mb-1.5 line-clamp-2"
            v-html="highlight(post.title)"
          />
          <p v-if="post.description" class="text-xs sm:text-sm text-[var(--color-text-muted)] line-clamp-2 leading-relaxed"
            v-html="highlight(post.description)"
          />
          <div class="flex items-center gap-3 mt-3 font-mono text-[10px] text-[var(--color-text-muted)]">
            <time>{{ post.pub_date }}</time>
          </div>
        </NuxtLink>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import type { PostSummary } from '~/types/post'
import { useDebounceFn } from '@vueuse/core'
const { siteUrl, siteName } = useSiteConfig()
useCanonical('/search')
useSeoMeta({
  description: `搜索 ${siteName} 所有技术文章，支持 FTS5 全文检索`,
  ogTitle: `搜索 | ${siteName}`,
  ogDescription: `搜索 ${siteName} 所有技术文章，支持全文检索`,
  ogUrl: `${siteUrl}/search`,
})

const route = useRoute()
const router = useRouter()
const q = ref((route.query.q as string) || '')
const results = ref<PostSummary[]>([])
const pending = ref(false)
const searched = ref(false)
const lastQ = ref('')

const { data: tagsData } = await useFetch('/api/tags', { default: () => ({} as Record<string, number>) })
const hotTags = computed(() =>
  Object.entries(tagsData.value || {}).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([t]) => t)
)

// 高亮匹配关键词
function highlight(text: string): string {
  if (!lastQ.value || !text) return text
  const escaped = lastQ.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`(${escaped})`, 'gi')
  return text.replace(re, '<mark class="search-highlight">$1</mark>')
}

import { useDebounceFn } from '@vueuse/core'

async function doSearch() {
  if (!q.value.trim()) { results.value = []; searched.value = false; return }
  pending.value = true
  lastQ.value = q.value.trim()
  await router.replace({ query: { q: q.value } })
  try {
    results.value = await $fetch<PostSummary[]>(`/api/search?q=${encodeURIComponent(q.value)}`)
    searched.value = true
  } finally {
    pending.value = false
  }
}

onMounted(() => {
  if (q.value) doSearch()
})

watch(results, async () => {
  const anime = await useAnime()
  if (!anime) return
  await nextTick()
  anime({
    targets: '.result-item',
    opacity: [0, 1],
    translateY: [12, 0],
    duration: 300,
    delay: anime.stagger(50),
    easing: 'easeOutQuad',
  })
})
</script>

<style scoped>
:deep(.search-highlight) {
  background: rgba(0, 212, 255, 0.2);
  color: var(--color-neon-cyan);
  border-radius: 2px;
  padding: 0 1px;
  font-style: normal;
}
</style>
