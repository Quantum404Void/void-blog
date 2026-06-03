<template>
  <div class="min-h-screen bg-[var(--color-void)] overflow-x-hidden">
    <AppNav :crumbs="[{ label: 'explore', href: '/explore' }]" />

    <main class="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-18" ref="mainRef">

      <!-- ══════════════════════════════════════════
           §1  SEARCH
           ══════════════════════════════════════════ -->
      <section class="mb-20 section-search">
        <div class="mb-6">
          <h2 class="font-mono text-xs text-[var(--color-neon-green)] uppercase tracking-[0.2em] mb-1">▸ 搜索</h2>
          <p class="font-mono text-[11px] text-[var(--color-text-muted)]">全文搜索文章标题、摘要、标签</p>
        </div>

        <form @submit.prevent="doSearch" class="mb-5">
          <div class="flex gap-2">
            <div class="relative flex-1 min-w-0">
              <input
                ref="searchInput"
                v-model="q"
                type="text"
                placeholder="搜索文章、标签..."
                class="w-full bg-[#0f0f1a] border border-[var(--color-void-border)] rounded-lg px-4 py-2.5 pr-9 font-mono text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-neon-cyan)] transition-colors"
              />
              <div v-if="pending" class="absolute right-3 top-1/2 -translate-y-1/2">
                <svg class="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(0,212,255,0.6)" stroke-width="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
              </div>
              <button v-else-if="q" type="button" @click="q = ''; results = []; searched = false"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors text-xs">✕</button>
            </div>
            <button type="submit"
              class="shrink-0 px-5 py-2.5 bg-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.3)] rounded-lg font-mono text-sm text-[var(--color-neon-cyan)] hover:bg-[rgba(0,212,255,0.18)] transition-colors">
              搜索
            </button>
          </div>
        </form>

        <!-- Status -->
        <p v-if="searched && !pending" class="font-mono text-xs text-[var(--color-text-muted)] mb-5">
          <span class="text-[var(--color-neon-cyan)]">"{{ lastQ }}"</span>
          — <span class="text-[var(--color-text-secondary)] font-bold">{{ results.length }}</span> 篇
        </p>

        <!-- Idle: hot tags -->
        <div v-if="!q && !searched">
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="tag in hotTags" :key="tag"
              @click="q = tag; doSearch()"
              class="font-mono text-[11px] px-3 py-1 rounded-full border border-[var(--color-void-border)] text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)] hover:border-[rgba(0,212,255,0.3)] transition-all"
            >#{{ tag }}</button>
          </div>
        </div>

        <!-- Empty -->
        <div v-else-if="searched && !pending && results.length === 0" class="py-10 text-center">
          <p class="font-mono text-2xl text-[var(--color-text-muted)] mb-3">∅</p>
          <p class="font-mono text-sm text-[var(--color-text-muted)]">没有匹配 <span class="text-[var(--color-neon-cyan)]">"{{ lastQ }}"</span> 的文章</p>
        </div>

        <!-- Results -->
        <div v-else-if="results.length" class="space-y-0">
          <NuxtLink
            v-for="post in results" :key="post.slug"
            :href="`/blog/${post.slug}`"
            class="result-item group block border-b border-[var(--color-void-border)] py-6 last:border-0 transition-colors"
          >
            <div class="flex flex-col gap-1.5">
              <div class="flex items-center gap-2 flex-wrap">
                <time class="font-mono text-[10px] font-bold tracking-wider text-[var(--color-text-muted)] uppercase">
                  {{ formatFullDate(post.pub_date) }}
                </time>
                <span v-for="tag in post.tags.slice(0,2)" :key="tag"
                  class="font-mono text-[10px] px-2 py-0.5 rounded border border-[var(--color-void-border)] text-[var(--color-text-muted)] leading-none"
                  :class="lastQ && tag.toLowerCase().includes(lastQ.toLowerCase()) ? 'border-[rgba(0,212,255,0.4)] text-[var(--color-neon-cyan)]' : ''"
                >#{{ tag }}</span>
              </div>
              <h3 class="font-mono text-base font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-neon-cyan)] transition-colors leading-snug"
                  v-html="highlight(post.title)" />
              <p v-if="post.description"
                 class="text-sm text-[var(--color-text-muted)] line-clamp-2 leading-relaxed"
                 v-html="highlight(post.description)" />
              <div class="mt-1 font-mono text-sm text-[var(--color-neon-cyan)] opacity-0 group-hover:opacity-100 translate-x-0 group-hover:translate-x-1 transition-all duration-200">
                阅读全文 →
              </div>
            </div>
          </NuxtLink>
        </div>
      </section>

      <!-- Divider -->
      <div class="mb-20 h-px bg-gradient-to-r from-transparent via-[var(--color-void-border)] to-transparent"></div>

      <!-- ══════════════════════════════════════════
           §2  TAGS
           ══════════════════════════════════════════ -->
      <section class="mb-20 section-tags">
        <div class="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 class="font-mono text-xs text-[var(--color-neon-cyan)] uppercase tracking-[0.2em] mb-1">▸ 标签</h2>
            <p class="font-mono text-[11px] text-[var(--color-text-muted)]">
              <span class="text-[var(--color-text-secondary)] font-bold">{{ tags.length }}</span> 个标签 ·
              <span class="text-[var(--color-text-secondary)] font-bold">{{ totalTagPosts }}</span> 篇文章
            </p>
          </div>
          <div class="relative shrink-0">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[var(--color-neon-cyan)] text-sm pointer-events-none">/</span>
            <input
              v-model="tagQuery"
              type="text"
              placeholder="过滤标签..."
              class="w-44 bg-transparent border border-[var(--color-void-border)] rounded-lg pl-8 pr-8 py-2 font-mono text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[rgba(0,212,255,0.5)] transition-colors"
            />
            <span v-if="tagQuery" @click="tagQuery=''"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer text-xs">✕</span>
          </div>
        </div>

        <div v-if="filteredTags.length" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          <NuxtLink
            v-for="item in filteredTags" :key="item.tag"
            :href="`/tags/${item.tag}`"
            class="tag-card group relative flex flex-col rounded-xl border border-[var(--color-void-border)] bg-[var(--color-void-card)] overflow-hidden transition-all duration-200 min-w-0"
            :style="{ '--tag-color': getTagColorVar(item.tag) }"
          >
            <div class="absolute left-0 top-0 bottom-0 w-0.5 group-hover:w-1 transition-all duration-200"
                 :style="{ background: getTagColorVar(item.tag) }" />
            <div class="px-4 py-3 flex flex-col gap-2 min-w-0">
              <div class="flex items-center justify-between gap-2 min-w-0">
                <span class="font-mono text-sm font-bold truncate min-w-0" :style="{ color: getTagColorVar(item.tag) }">#{{ item.tag }}</span>
                <span class="font-mono text-[10px] shrink-0 px-1.5 py-0.5 rounded border font-bold tabular-nums"
                      :style="{ color: getTagColorVar(item.tag), borderColor: `color-mix(in srgb, ${getTagColorVar(item.tag)} 30%, transparent)`, background: `color-mix(in srgb, ${getTagColorVar(item.tag)} 8%, transparent)` }">
                  {{ item.count }}
                </span>
              </div>
              <p v-if="item.latestTitle"
                 class="font-mono text-[10px] text-[var(--color-text-muted)] leading-relaxed line-clamp-2 group-hover:text-[var(--color-text-secondary)] transition-colors min-w-0">
                {{ item.latestTitle }}
              </p>
            </div>
          </NuxtLink>
        </div>

        <div v-else class="py-16 text-center">
          <p class="font-mono text-2xl text-[var(--color-text-muted)] mb-3">∅</p>
          <p class="font-mono text-sm text-[var(--color-text-muted)]">没有匹配 <span class="text-[var(--color-neon-cyan)]">"{{ tagQuery }}"</span> 的标签</p>
          <button @click="tagQuery=''" class="mt-3 font-mono text-xs text-[var(--color-neon-cyan)] hover:underline">清空</button>
        </div>
      </section>

      <!-- Divider -->
      <div class="mb-20 h-px bg-gradient-to-r from-transparent via-[var(--color-void-border)] to-transparent"></div>

      <!-- ══════════════════════════════════════════
           §3  STATS
           ══════════════════════════════════════════ -->
      <section class="section-stats">
        <div class="mb-6">
          <h2 class="font-mono text-xs text-[var(--color-neon-purple)] uppercase tracking-[0.2em] mb-1">▸ 统计</h2>
          <p class="font-mono text-[11px] text-[var(--color-text-muted)]">博客数据一览</p>
        </div>

        <!-- Overview cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          <div v-for="card in overviewCards" :key="card.label"
               class="border border-[var(--color-void-border)] bg-[var(--color-void-card)] rounded-xl px-4 py-4">
            <div class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-2 flex items-center gap-1">
              <span :style="`color:var(--color-${card.color})`">▸</span>{{ card.label }}
            </div>
            <div class="font-mono text-2xl font-black tabular-nums" :style="`color:var(--color-${card.color})`">
              {{ card.value }}
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="border border-[var(--color-void-border)] bg-[var(--color-void-card)] rounded-xl p-5">
            <h3 class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
              <span class="text-[var(--color-neon-green)]">▶</span> 年度分布
            </h3>
            <ClientOnly>
              <Chart type="bar" :data="yearPlotData" :height="200" />
            </ClientOnly>
          </div>
          <div class="border border-[var(--color-void-border)] bg-[var(--color-void-card)] rounded-xl p-5">
            <h3 class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
              <span class="text-[var(--color-neon-cyan)]">▶</span> 热门标签 Top 12
            </h3>
            <ClientOnly>
              <Chart type="barh" :data="tagPlotData" :height="260" />
            </ClientOnly>
          </div>
        </div>
      </section>

    </main>

    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import type { PostSummary } from '~/types/post'

const { siteUrl, siteName } = useSiteConfig()
const route = useRoute()
const router = useRouter()
const mainRef = ref<HTMLElement | null>(null)

useCanonical('/explore')
useSeoMeta({
  description: `搜索文章、浏览标签、查看博客统计`,
  ogTitle: `Explore | ${siteName}`,
  ogUrl: `${siteUrl}/explore`,
})

// ── 搜索 ──────────────────────────────────────────────────
const searchInput = ref<HTMLInputElement | null>(null)
const q = ref((route.query.q as string) || '')
const results = ref<PostSummary[]>([])
const pending = ref(false)
const searched = ref(false)
const lastQ = ref('')

const { data: tagsData } = await useFetch('/api/tags', { default: () => ({} as Record<string, number>) })

const hotTags = computed(() =>
  Object.entries(tagsData.value || {}).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([t]) => t)
)

function highlight(text: string): string {
  if (!lastQ.value || !text) return text
  const escaped = lastQ.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark class="search-highlight">$1</mark>')
}

function formatFullDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

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

// ── 标签 ──────────────────────────────────────────────────
const { getTagColorVar, getTagColor } = useTagColor()
const tagQuery = ref('')
const { data: postsData } = await useFetch('/api/posts', { default: () => [] as PostSummary[] })

const tags = computed(() =>
  Object.entries(tagsData.value || {})
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => {
      const tagPosts = (postsData.value || [])
        .filter((p: PostSummary) => p.tags?.includes(tag))
        .sort((a: PostSummary, b: PostSummary) => b.pub_date?.localeCompare(a.pub_date ?? '') ?? 0)
      return { tag, count, latestTitle: tagPosts[0]?.title ?? null }
    })
)

const totalTagPosts = computed(() =>
  Object.values(tagsData.value || {}).reduce((a, b) => a + b, 0)
)

const filteredTags = computed(() => {
  const tq = tagQuery.value.trim().toLowerCase()
  return tq ? tags.value.filter(item => item.tag.toLowerCase().includes(tq)) : tags.value
})

// ── 统计 ──────────────────────────────────────────────────
interface StatsData {
  totalTags: number
  byYear: Record<string, number>
  byMonth: Record<string, number>
  tagCounts: Record<string, number>
  totalWords?: number
}
const { data: statsRaw } = await useFetch('/api/stats', { default: () => ({}) })
const stats = computed(() => (statsRaw.value ?? {}) as StatsData)

const overviewCards = computed(() => [
  { label: '总文章数', value: (postsData.value || []).length, color: 'neon-cyan' },
  { label: '标签数量', value: stats.value.totalTags ?? 0, color: 'neon-green' },
  { label: '写作年份', value: Object.keys(stats.value.byYear ?? {}).length, color: 'neon-purple' },
  { label: '创作开始', value: (postsData.value || []).length ? (postsData.value || [])[(postsData.value || []).length - 1].pub_date.slice(0, 4) : '-', color: 'neon-pink' },
])

const yearPlotData = computed(() => {
  const byYear = stats.value.byYear ?? {}
  const neon = ['#00d4ff', '#39ff14', '#b44cff', '#ff2d78', '#ffa500']
  return Object.keys(byYear).sort().map((y, i) => ({ label: y, value: byYear[y], color: neon[i % neon.length] }))
})

const tagPlotData = computed(() => {
  const tagCounts = stats.value.tagCounts ?? {}
  return Object.entries(tagCounts)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 12)
    .map(([t, c]) => ({ label: `#${t}`, value: c as number }))
})

// ── 入场动画 ───────────────────────────────────────────────
onMounted(async () => {
  const bundle = await useGsap()
  if (!bundle) return
  const { gsap, ScrollTrigger } = bundle

  const sections = mainRef.value?.querySelectorAll<HTMLElement>('section')
  sections?.forEach((section) => {
    gsap.fromTo(section,
      { opacity: 0, y: 20 },
      {
        opacity: 1, y: 0, duration: 0.5, ease: 'power2.out',
        scrollTrigger: { trigger: section, start: 'top 85%', once: true },
      }
    )
  })

  setTimeout(() => ScrollTrigger?.refresh?.(), 150)
})
</script>

<style scoped>
.tag-card:hover {
  border-color: color-mix(in srgb, var(--tag-color) 35%, rgba(30,30,48,0.8));
  box-shadow: 0 0 18px color-mix(in srgb, var(--tag-color) 8%, transparent);
  transform: translateY(-1px);
}
:deep(.search-highlight) {
  background: rgba(0,212,255,0.2);
  color: var(--color-neon-cyan);
  border-radius: 2px;
  padding: 0 1px;
}
</style>
