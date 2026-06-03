<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: activeTab }]" />

    <main class="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <!-- Header -->
      <div class="mb-8">
        <p class="font-mono text-[10px] text-[var(--color-text-muted)] tracking-[0.2em] uppercase mb-2">
          <span class="text-[var(--color-neon-green)]">▸</span> explore
        </p>
        <h1 class="font-mono text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">
          <span class="text-[var(--color-neon-cyan)]">~/</span>explore
        </h1>
      </div>

      <!-- Tab Bar -->
      <div class="flex items-center gap-1 mb-8 border-b border-[var(--color-void-border)]">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="setTab(tab.id)"
          class="tab-btn relative px-4 py-2.5 font-mono text-xs transition-colors"
          :class="activeTab === tab.id
            ? 'text-[var(--color-neon-cyan)]'
            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'"
        >
          <span class="mr-1.5 opacity-70">{{ tab.icon }}</span>{{ tab.label }}
          <span v-if="activeTab === tab.id"
            class="absolute bottom-0 left-0 w-full h-[2px] rounded-full bg-[var(--color-neon-cyan)]"
            style="box-shadow: 0 0 8px var(--color-neon-cyan)"
          />
        </button>
      </div>

      <!-- ═══ TAB: SEARCH ═══ -->
      <div v-show="activeTab === 'search'">
        <form @submit.prevent="doSearch" class="mb-6">
          <div class="relative flex flex-col gap-3 sm:flex-row">
            <div class="relative flex-1">
              <input
                ref="searchInput"
                v-model="q"
                type="text"
                placeholder="搜索文章、标签..."
                class="w-full bg-[#0f0f1a] border border-[var(--color-void-border)] rounded-lg px-4 py-2.5 pr-10 font-mono text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-neon-cyan)] transition-colors"
              />
              <div v-if="pending" class="absolute right-3 top-1/2 -translate-y-1/2">
                <svg class="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(0,212,255,0.6)" stroke-width="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
              </div>
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

        <p v-if="searched && !pending" class="font-mono text-xs text-[var(--color-text-muted)] mb-5">
          <span class="text-[var(--color-neon-cyan)]">"{{ lastQ }}"</span>
          — 找到 <span class="text-[var(--color-text-secondary)] font-bold">{{ results.length }}</span> 篇
        </p>

        <div v-if="searched && !pending && results.length === 0" class="py-10 text-center">
          <div class="font-mono text-[var(--color-text-muted)] text-sm space-y-2">
            <p class="text-2xl mb-4">∅</p>
            <p>没有匹配 <span class="text-[var(--color-neon-cyan)]">"{{ lastQ }}"</span> 的文章</p>
          </div>
        </div>

        <!-- Hot tags (idle state) -->
        <div v-if="!q && !searched" class="py-4">
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
      </div>

      <!-- ═══ TAB: TAGS ═══ -->
      <div v-show="activeTab === 'tags'">
        <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="flex items-center gap-5 font-mono text-xs text-[var(--color-text-muted)]">
            <span><span class="text-[var(--color-neon-cyan)] font-bold text-lg">{{ tags.length }}</span> 个标签</span>
            <span class="text-[var(--color-void-muted)]">·</span>
            <span><span class="text-[var(--color-neon-green)] font-bold text-lg">{{ totalTagPosts }}</span> 篇文章</span>
          </div>
          <div class="relative inline-flex items-center">
            <span class="absolute left-3 font-mono text-[var(--color-neon-cyan)] text-sm pointer-events-none">/</span>
            <input
              v-model="tagQuery"
              type="text"
              placeholder="过滤标签..."
              class="w-56 bg-transparent border border-[var(--color-void-border)] rounded-lg pl-8 pr-4 py-2 font-mono text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[rgba(0,212,255,0.5)] transition-colors"
            />
            <span v-if="tagQuery" @click="tagQuery=''" class="absolute right-3 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer text-xs">✕</span>
          </div>
        </div>

        <div v-if="filteredTags.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <NuxtLink
            v-for="item in filteredTags"
            :key="item.tag"
            :href="`/tags/${item.tag}`"
            class="tag-card group relative flex flex-col rounded-xl border bg-[var(--color-void-card)] overflow-hidden transition-all duration-200"
            :style="{ '--tag-color': getTagColorVar(item.tag) }"
          >
            <div class="absolute left-0 top-0 bottom-0 w-0.5 transition-all duration-200 group-hover:w-1"
                 :style="{ background: getTagColorVar(item.tag) }" />
            <div class="px-5 py-4 flex-1 flex flex-col gap-3">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-baseline gap-1 min-w-0">
                  <span class="font-mono text-base font-bold shrink-0" :style="{ color: getTagColorVar(item.tag) }">#</span>
                  <span class="font-mono text-base font-bold truncate" :style="{ color: getTagColorVar(item.tag) }">{{ item.tag }}</span>
                </div>
                <span class="font-mono text-[10px] shrink-0 px-2 py-0.5 rounded-full border font-bold tabular-nums"
                      :style="{ color: getTagColorVar(item.tag), borderColor: `color-mix(in srgb, ${getTagColorVar(item.tag)} 30%, transparent)`, background: `color-mix(in srgb, ${getTagColorVar(item.tag)} 8%, transparent)` }">
                  {{ item.count }}
                </span>
              </div>
              <div v-if="item.latestTitle" class="flex flex-col gap-1">
                <span class="font-mono text-[9px] text-[var(--color-text-muted)] uppercase tracking-[0.15em]">最新</span>
                <span class="font-mono text-xs text-[var(--color-text-secondary)] leading-relaxed line-clamp-2 group-hover:text-[var(--color-text-primary)] transition-colors">
                  {{ item.latestTitle }}
                </span>
              </div>
              <div v-else class="font-mono text-xs text-[var(--color-text-muted)] italic opacity-50">暂无文章</div>
              <div class="mt-auto flex items-center justify-end">
                <span class="font-mono text-[10px] text-[var(--color-text-muted)] group-hover:text-[var(--color-neon-cyan)] transition-colors opacity-0 group-hover:opacity-100">查看全部 →</span>
              </div>
            </div>
          </NuxtLink>
        </div>

        <div v-else class="py-20 text-center">
          <p class="font-mono text-3xl text-[var(--color-text-muted)] mb-3">∅</p>
          <p class="font-mono text-sm text-[var(--color-text-muted)]">没找到匹配 <span class="text-[var(--color-neon-cyan)]">"{{ tagQuery }}"</span> 的标签</p>
          <button @click="tagQuery=''" class="mt-3 font-mono text-xs text-[var(--color-neon-cyan)] hover:underline">清空过滤</button>
        </div>
      </div>

      <!-- ═══ TAB: STATS ═══ -->
      <div v-show="activeTab === 'stats'">
        <!-- Overview cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <div v-for="card in overviewCards" :key="card.label"
               class="border border-[var(--color-void-border)] bg-[var(--color-void-card)] rounded-xl p-4 sm:p-5">
            <div class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-2 flex items-center gap-1">
              <span :style="`color:var(--color-${card.color})`">▸</span>
              {{ card.label }}
            </div>
            <div class="font-mono text-xl sm:text-2xl font-bold" :style="`color:var(--color-${card.color})`">
              {{ card.value }}
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div class="border border-[var(--color-void-border)] bg-[var(--color-void-card)] rounded-xl p-4 sm:p-6">
            <h2 class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <span class="text-[var(--color-neon-green)]">▶</span> 年度文章分布
            </h2>
            <ClientOnly>
              <Chart type="bar" :data="yearPlotData" :height="220" />
            </ClientOnly>
          </div>
          <div class="border border-[var(--color-void-border)] bg-[var(--color-void-card)] rounded-xl p-4 sm:p-6">
            <h2 class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <span class="text-[var(--color-neon-cyan)]">▶</span> 热门标签 Top 12
            </h2>
            <ClientOnly>
              <Chart type="barh" :data="tagPlotData" :height="280" />
            </ClientOnly>
          </div>
        </div>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import type { PostSummary } from '~/types/post'

const { siteUrl, siteName } = useSiteConfig()
const route = useRoute()
const router = useRouter()

// ── Tab state ──
const tabs = [
  { id: 'search', label: 'search', icon: '🔍' },
  { id: 'tags',   label: 'tags',   icon: '#' },
  { id: 'stats',  label: 'stats',  icon: '◈' },
]
const activeTab = ref((route.query.tab as string) || 'search')

function setTab(id: string) {
  activeTab.value = id
  router.replace({ query: { tab: id } })
}

useCanonical('/explore')
useSeoMeta({
  description: `搜索文章、浏览标签、查看博客统计`,
  ogTitle: `Explore | ${siteName}`,
  ogUrl: `${siteUrl}/explore`,
})

// ── Search ──
const searchInput = ref<HTMLInputElement | null>(null)
const q = ref((route.query.q as string) || '')
const results = ref<PostSummary[]>([])
const pending = ref(false)
const searched = ref(false)
const lastQ = ref('')

const { data: tagsData } = await useFetch('/api/tags', { default: () => ({} as Record<string, number>) })

const hotTags = computed(() =>
  Object.entries(tagsData.value || {}).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([t]) => t)
)

function highlight(text: string): string {
  if (!lastQ.value || !text) return text
  const escaped = lastQ.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark class="search-highlight">$1</mark>')
}

async function doSearch() {
  if (!q.value.trim()) { results.value = []; searched.value = false; return }
  pending.value = true
  lastQ.value = q.value.trim()
  await router.replace({ query: { tab: activeTab.value, q: q.value } })
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

// ── Tags ──
const { getTagColorVar } = useTagColor()
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
  const q = tagQuery.value.trim().toLowerCase()
  return q ? tags.value.filter(item => item.tag.toLowerCase().includes(q)) : tags.value
})

// ── Stats ──
const { data: allPostsRaw } = await useFetch('/api/posts', { key: 'all-posts', default: () => [] as PostSummary[] })
const allPosts = computed(() => allPostsRaw.value || [])

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
  { label: '总文章数', value: allPosts.value.length, color: 'neon-cyan' },
  { label: '标签数量', value: stats.value.totalTags ?? 0, color: 'neon-green' },
  { label: '写作年份', value: Object.keys(stats.value.byYear ?? {}).length, color: 'neon-purple' },
  { label: '创作开始', value: allPosts.value.length ? allPosts.value[allPosts.value.length - 1].pub_date.slice(0, 4) : '-', color: 'neon-pink' },
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
</script>

<style scoped>
.tag-card {
  border-color: rgba(30, 30, 48, 0.8);
}
.tag-card:hover {
  border-color: color-mix(in srgb, var(--tag-color) 35%, rgba(30, 30, 48, 0.8));
  box-shadow: 0 0 20px color-mix(in srgb, var(--tag-color) 10%, transparent);
  transform: translateY(-1px);
}
:deep(.search-highlight) {
  background: rgba(0, 212, 255, 0.2);
  color: var(--color-neon-cyan);
  border-radius: 2px;
  padding: 0 1px;
}
</style>
