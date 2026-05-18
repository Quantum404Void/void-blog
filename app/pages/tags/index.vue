<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'tags', href: '/tags' }]" />

    <main class="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <!-- Header -->
      <div class="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p class="font-mono text-[10px] text-[var(--color-text-muted)] tracking-[0.2em] uppercase mb-3">
            <span class="text-[var(--color-neon-green)]">▸</span> topics
          </p>
          <h1 class="font-mono text-3xl font-bold text-[var(--color-text-primary)]">
            <span class="text-[var(--color-neon-green)]">~/</span>tags
          </h1>
        </div>
        <div class="flex items-center gap-6 font-mono text-xs text-[var(--color-text-muted)]">
          <span><span class="text-[var(--color-neon-cyan)] font-bold text-lg">{{ tags.length }}</span> 个标签</span>
          <span class="text-[var(--color-void-muted)]">·</span>
          <span><span class="text-[var(--color-neon-green)] font-bold text-lg">{{ totalPosts }}</span> 篇文章</span>
        </div>
      </div>

      <!-- Search -->
      <div class="mb-8">
        <div class="relative inline-flex items-center">
          <span class="absolute left-3 font-mono text-[var(--color-neon-cyan)] text-sm pointer-events-none">/</span>
          <input
            v-model="query"
            type="text"
            placeholder="过滤标签..."
            class="w-64 bg-transparent border border-[var(--color-void-border)] rounded-lg pl-8 pr-4 py-2 font-mono text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[rgba(0,212,255,0.5)] transition-colors"
          />
          <span v-if="query" @click="query=''" class="absolute right-3 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer text-xs">✕</span>
        </div>
        <span v-if="query" class="ml-3 font-mono text-xs text-[var(--color-text-muted)]">{{ filteredTags.length }} 个匹配</span>
      </div>

      <!-- Tag Grid -->
      <div v-if="filteredTags.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <NuxtLink
          v-for="item in filteredTags"
          :key="item.tag"
          :href="`/tags/${item.tag}`"
          class="tag-card group relative flex flex-col rounded-xl border bg-[var(--color-void-card)] overflow-hidden transition-all duration-200"
          :style="{ '--tag-color': getTagColorVar(item.tag) }"
        >
          <!-- 左侧彩色竖条 -->
          <div class="absolute left-0 top-0 bottom-0 w-0.5 transition-all duration-200 group-hover:w-1"
               :style="{ background: getTagColorVar(item.tag) }" />

          <div class="px-5 py-4 flex-1 flex flex-col gap-3">
            <!-- Tag name row -->
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-baseline gap-1 min-w-0">
                <span class="font-mono text-base font-bold shrink-0" :style="{ color: getTagColorVar(item.tag) }">#</span>
                <span class="font-mono text-base font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-text-primary)] truncate" :style="{ color: getTagColorVar(item.tag) }">{{ item.tag }}</span>
              </div>
              <!-- 文章数 badge -->
              <span class="font-mono text-[10px] shrink-0 px-2 py-0.5 rounded-full border font-bold tabular-nums"
                    :style="{ color: getTagColorVar(item.tag), borderColor: `color-mix(in srgb, ${getTagColorVar(item.tag)} 30%, transparent)`, background: `color-mix(in srgb, ${getTagColorVar(item.tag)} 8%, transparent)` }">
                {{ item.count }}
              </span>
            </div>

            <!-- Latest post -->
            <div v-if="item.latestTitle" class="flex flex-col gap-1">
              <span class="font-mono text-[9px] text-[var(--color-text-muted)] uppercase tracking-[0.15em]">最新</span>
              <span class="font-mono text-xs text-[var(--color-text-secondary)] leading-relaxed line-clamp-2 group-hover:text-[var(--color-text-primary)] transition-colors">
                {{ item.latestTitle }}
              </span>
            </div>
            <div v-else class="font-mono text-xs text-[var(--color-text-muted)] italic opacity-50">暂无文章</div>

            <!-- Arrow -->
            <div class="mt-auto flex items-center justify-end">
              <span class="font-mono text-[10px] text-[var(--color-text-muted)] group-hover:text-[var(--color-neon-cyan)] transition-colors opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 duration-150">查看全部 →</span>
            </div>
          </div>
        </NuxtLink>
      </div>

      <!-- Empty state -->
      <div v-else class="py-20 text-center">
        <p class="font-mono text-3xl text-[var(--color-text-muted)] mb-3">∅</p>
        <p class="font-mono text-sm text-[var(--color-text-muted)]">没找到匹配 <span class="text-[var(--color-neon-cyan)]">"{{ query }}"</span> 的标签</p>
        <button @click="query=''" class="mt-3 font-mono text-xs text-[var(--color-neon-cyan)] hover:underline">清空过滤</button>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup lang="ts">
const { siteUrl, siteName } = useSiteConfig()
useCanonical('/tags')
useSeoMeta({
  description: `按标签浏览技术文章，涵盖 C++、Vue3、TypeScript、AI、Linux、算法等主题`,
  ogTitle: `Tags | ${siteName}`,
  ogUrl: `${siteUrl}/tags`,
})

const { getTagColorVar } = useTagColor()
const query = ref('')

const { data: tagCountsData } = await useFetch('/api/tags', { default: () => ({} as Record<string, number>) })
const { data: postsData } = await useFetch('/api/posts', { default: () => [] as any[] })

const tags = computed(() =>
  Object.entries(tagCountsData.value || {})
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => {
      const tagPosts = (postsData.value || [])
        .filter((p: any) => p.tags?.includes(tag))
        .sort((a: any, b: any) => b.pub_date?.localeCompare(a.pub_date ?? '') ?? 0)
      return { tag, count, latestTitle: tagPosts[0]?.title ?? null }
    })
)

const totalPosts = computed(() =>
  Object.values(tagCountsData.value || {}).reduce((a, b) => a + b, 0)
)

const filteredTags = computed(() => {
  const q = query.value.trim().toLowerCase()
  return q ? tags.value.filter(item => item.tag.toLowerCase().includes(q)) : tags.value
})

onMounted(async () => {
  const anime = await useAnime()
  if (!anime) return
  await nextTick()
  anime({
    targets: '.tag-card',
    opacity: [0, 1],
    scale: [0.8, 1],
    duration: 400,
    delay: anime.stagger(20),
    easing: 'easeOutQuad',
  })
})
</script>

<style scoped>
.tag-card {
  border-color: rgba(30, 30, 48, 0.8);
}
.tag-card:hover {
  border-color: color-mix(in srgb, var(--tag-color) 35%, rgba(30, 30, 48, 0.8));
  box-shadow: 0 0 20px color-mix(in srgb, var(--tag-color) 10%, transparent),
              inset 0 0 20px color-mix(in srgb, var(--tag-color) 3%, transparent);
  transform: translateY(-1px);
}
</style>
