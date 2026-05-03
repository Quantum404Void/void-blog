<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <nav class="sticky top-0 z-50 border-b border-[var(--color-void-border)] nav-glass">
      <div class="max-w-3xl mx-auto px-6 h-14 flex items-center gap-4">
        <NuxtLink href="/" class="font-mono text-sm text-[var(--color-neon-green)]">{{ siteName }}</NuxtLink>
        <span class="text-[var(--color-text-muted)]">/search</span>
      </div>
    </nav>

    <main class="max-w-3xl mx-auto px-6 py-16">
      <h1 class="font-mono text-2xl font-bold text-[var(--color-text-primary)] mb-8 flex items-center gap-3">
        <span class="text-[var(--color-neon-green)]">$</span> grep -r
      </h1>

      <form @submit.prevent="doSearch" class="mb-10">
        <div class="relative flex gap-3">
          <input
            v-model="q"
            type="text"
            placeholder="搜索文章、标签..."
            autofocus
            class="flex-1 bg-[#0f0f1a] border border-[var(--color-void-border)] rounded-lg px-4 py-2.5 pr-10 font-mono text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-neon-cyan)] transition-colors"
          />
          <!-- loading spinner -->
          <div v-if="pending" class="absolute right-[80px] top-1/2 -translate-y-1/2">
            <svg class="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(0,212,255,0.6)" stroke-width="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          </div>
          <button
            type="submit"
            class="px-5 py-2.5 bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.35)] rounded-lg font-mono text-sm text-[var(--color-neon-cyan)] hover:bg-[rgba(0,212,255,0.2)] transition-colors"
          >搜索</button>
        </div>
      </form>

      <p v-if="q && !pending" class="font-mono text-xs text-[var(--color-text-muted)] mb-6">
        "{{ q }}" — <span class="text-[var(--color-text-secondary)]">{{ results.length }}</span> 篇结果
      </p>

      <!-- Empty state: hot tags -->
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

      <div class="space-y-2">
        <NuxtLink
          v-for="post in results"
          :key="post.slug"
          :href="`/blog/${post.slug}`"
          class="group block p-4 rounded-xl border border-transparent hover:border-[var(--color-void-border)] hover:bg-[var(--color-void-card)] transition-all"
        >
          <div class="flex items-start justify-between gap-4 mb-1">
            <h3 class="font-mono text-sm text-[var(--color-text-primary)] group-hover:text-[var(--color-neon-cyan)] transition-colors">{{ post.title }}</h3>
            <time :datetime="post.pub_date" class="font-mono text-[10px] text-[var(--color-text-muted)] shrink-0">
              {{ formatDate(post.pub_date) }}
            </time>
          </div>
          <p v-if="post.description" class="text-xs text-[var(--color-text-muted)] line-clamp-2">{{ post.description }}</p>
          <div class="flex gap-1.5 mt-2">
            <span v-for="t in post.tags.slice(0, 3)" :key="t"
                  class="font-mono text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--color-void-muted)] text-[var(--color-text-muted)]">#{{ t }}</span>
          </div>
        </NuxtLink>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const { siteUrl, siteName } = useSiteConfig()
useSeoMeta({
  title: `搜索 | ${siteName}`,
  description: `搜索 ${siteName} 所有技术文章，支持标题、正文内容全文检索`,
  ogTitle: `搜索 | ${siteName}`,
  ogDescription: `搜索 ${siteName} 所有技术文章，支持标题、正文内容全文检索`,
  ogUrl: `${siteUrl}/search`,
})

const route = useRoute()
const router = useRouter()
const q = ref((route.query.q as string) || '')
const results = ref<any[]>([])
const pending = ref(false)

const { data: tagsData } = await useFetch('/api/tags', { default: () => ({} as Record<string, number>) })
const hotTags = computed(() =>
  Object.entries(tagsData.value || {}).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([t]) => t)
)

let debounceTimer: ReturnType<typeof setTimeout> | null = null
watch(q, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  if (!val.trim()) { results.value = []; return }
  debounceTimer = setTimeout(() => doSearch(), 300)
})

async function doSearch() {
  if (!q.value.trim()) { results.value = []; return }
  pending.value = true
  await router.replace({ query: { q: q.value } })
  try {
    results.value = await $fetch(`/api/search?q=${encodeURIComponent(q.value)}`) as any[]
  } finally {
    pending.value = false
  }
}

// Auto-search if q from URL
if (q.value) doSearch()

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
</script>
