<template>
  <div class="min-h-screen bg-[var(--color-void)] overflow-x-hidden">
    <AppNav :crumbs="[{ label: 'explore', href: '/explore' }]" />

    <main class="w-full max-w-3xl mx-auto px-5 sm:px-8 py-12 sm:py-18" ref="mainRef">

      <!-- ══════════════════════════════════════════
           §1  SEARCH
           ══════════════════════════════════════════ -->
      <section class="mb-12 sm:mb-16 section-search">
        <div class="mb-6">
          <h1 class="font-mono text-2xl font-bold text-[var(--color-text-primary)] mb-2">搜索与探索</h1>
          <p class="text-sm text-[var(--color-text-secondary)]">全文搜索文章，并从标签与写作统计中发现内容。</p>
        </div>

        <form @submit.prevent="doSearch" class="mb-5">
          <div class="flex gap-2">
            <div class="relative flex-1 min-w-0">
              <input
                ref="searchInput"
                v-model="q"
                type="text"
                placeholder="搜索文章、标签..."
                aria-label="搜索文章"
                class="tool-field pr-12"
              />
              <div v-if="pending" class="absolute right-3 top-1/2 -translate-y-1/2">
                <svg class="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(0,212,255,0.6)" stroke-width="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
              </div>
              <button v-else-if="q" type="button" @click="q = ''; results = []; searched = false"
                class="absolute right-1 top-1/2 size-10 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors text-xs" aria-label="清空搜索">✕</button>
            </div>
            <button type="submit"
              class="tool-button tool-button-primary shrink-0 px-5">
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
              class="inline-flex min-h-11 items-center rounded-full border border-[var(--color-void-border)] px-3 font-mono text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)] hover:border-[rgba(0,212,255,0.3)] transition-colors"
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
      <div class="mb-12 h-px bg-gradient-to-r from-transparent via-[var(--color-void-border)] to-transparent sm:mb-16"></div>

      <!-- ══════════════════════════════════════════
           §2  TAGS
           ══════════════════════════════════════════ -->
      <section class="mb-12 section-tags sm:mb-16">
        <div class="mb-6 flex flex-col items-stretch gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 class="font-mono text-xs text-[var(--color-neon-cyan)] uppercase tracking-[0.2em] mb-1">▸ 标签</h2>
            <p class="font-mono text-[11px] text-[var(--color-text-muted)]">
              <span class="text-[var(--color-text-secondary)] font-bold">{{ tags.length }}</span> 个标签 ·
              <span class="text-[var(--color-text-secondary)] font-bold">{{ totalTagPosts }}</span> 篇文章
            </p>
          </div>
          <div class="relative w-full shrink-0 sm:w-52">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[var(--color-neon-cyan)] text-sm pointer-events-none">/</span>
            <input
              v-model="tagQuery"
              type="text"
              placeholder="过滤标签..."
              aria-label="过滤标签"
              class="tool-field w-full pl-8 pr-12"
            />
            <button v-if="tagQuery" @click="tagQuery=''"
              class="absolute right-1 top-1/2 size-10 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-xs" aria-label="清空标签过滤">✕</button>
          </div>
        </div>

        <!-- Tag Cloud -->
        <div v-if="filteredTags.length"
             class="flex flex-wrap justify-center items-baseline gap-x-3 gap-y-2 px-2 py-2 leading-relaxed">
          <NuxtLink
            v-for="item in filteredTags" :key="item.tag"
            :href="`/tags/${item.tag}`"
            class="group inline-flex items-baseline gap-0.5 rounded-md px-2 py-1 transition-all duration-200 ease-out hover:scale-110"
            :style="tagCloudStyle(item)"
          >
            {{ item.tag }}<span
              class="ml-0.5 font-normal opacity-50 group-hover:opacity-80 transition-opacity"
              :style="{ fontSize: '0.45em', fontWeight: '400' }"
            >{{ item.count }}</span>
          </NuxtLink>
        </div>

        <div v-else class="py-16 text-center">
          <p class="font-mono text-2xl text-[var(--color-text-muted)] mb-3">∅</p>
          <p class="font-mono text-sm text-[var(--color-text-muted)]">没有匹配 <span class="text-[var(--color-neon-cyan)]">"{{ tagQuery }}"</span> 的标签</p>
          <button @click="tagQuery=''" class="mt-3 font-mono text-xs text-[var(--color-neon-cyan)] hover:underline">清空</button>
        </div>
      </section>

      <!-- Divider -->
      <div class="mb-12 h-px bg-gradient-to-r from-transparent via-[var(--color-void-border)] to-transparent sm:mb-16"></div>

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
const mainRef = useTemplateRef<HTMLElement>('mainRef')
const prefersReducedMotion = useReducedMotion()

useCanonical('/explore')
useSeoMeta({
  description: `搜索文章、浏览标签、查看博客统计`,
  ogTitle: `Explore | ${siteName}`,
  ogUrl: `${siteUrl}/explore`,
})

// ── 搜索 ──────────────────────────────────────────────────
const searchInput = useTemplateRef<HTMLInputElement>('searchInput')
const q = shallowRef((route.query.q as string) || '')
const results = ref<PostSummary[]>([])
const pending = shallowRef(false)
const searched = shallowRef(false)
const lastQ = shallowRef('')

const { data: tagsData } = await useFetch('/api/tags', { default: () => ({} as Record<string, number>) })

const hotTags = computed(() =>
  Object.entries(tagsData.value || {}).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([t]) => t)
)

function highlight(text: string): string {
  const safeText = escapeHtml(text)
  if (!lastQ.value || !safeText) return safeText
  const escaped = lastQ.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return safeText.replace(new RegExp(`(${escaped})`, 'gi'), '<mark class="search-highlight">$1</mark>')
}

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character)
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
const { getTagColorVar } = useTagColor()
const tagQuery = shallowRef('')
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

// tag cloud 字体大小按 count 线性缩放 (0.85rem ~ 2.6rem)
const maxTagCount = computed(() => Math.max(...tags.value.map(t => t.count), 1))
const tagColors = ['#00d4ff','#39ff14','#b44cff','#ff6b35','#ff2d78','#ffd700','#00e5cc','#ff8c42']
function tagCloudStyle(item: { tag: string; count: number }) {
  const ratio = item.count / maxTagCount.value
  // 字体：0.85rem ~ 2.6rem
  const size = 0.85 + ratio * 1.75
  const weight = Math.round(400 + ratio * 300)
  const colorIdx = item.tag.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % tagColors.length
  const color = tagColors[colorIdx]
  return {
    fontSize: `${size.toFixed(2)}rem`,
    fontWeight: String(weight),
    color,
    opacity: String(0.6 + ratio * 0.4),
  }
}

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
  if (prefersReducedMotion.value) return
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
