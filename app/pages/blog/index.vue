<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'blog', href: '/blog' }]" />

    <main class="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div class="mb-10">
        <h1 class="font-mono text-3xl font-bold mb-2">
          <span class="text-[var(--color-neon-green)]">~/</span><span class="text-[var(--color-text-primary)]">blog</span>
        </h1>
        <p class="font-mono text-xs text-[var(--color-text-muted)]">
          {{ years.length }} 年 · {{ posts.length }} 篇文章
        </p>
      </div>

      <!-- Tag filter -->
      <div class="mb-10">
        <p class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-3">
          <span class="text-[var(--color-neon-purple)]">▶</span> 标签过滤
        </p>
        <div class="flex flex-wrap gap-1.5">
          <button
            @click="activeTag = ''"
            class="font-mono text-[10px] px-3 py-1 rounded-full border transition-all"
            :class="activeTag === ''
              ? 'border-[var(--color-neon-green)] text-[var(--color-neon-green)] bg-[rgba(0,255,136,0.08)]'
              : 'border-[var(--color-void-border)] text-[var(--color-text-muted)] hover:border-[rgba(0,255,136,0.35)] hover:text-[var(--color-neon-green)]'"
          >全部</button>
          <button
            v-for="[tag, count] in topTags"
            :key="tag"
            @click="activeTag = activeTag === tag ? '' : tag"
            class="font-mono text-[10px] px-3 py-1 rounded-full border transition-all"
            :class="activeTag === tag
              ? 'border-[rgba(0,212,255,0.6)] text-[var(--color-neon-cyan)] bg-[rgba(0,212,255,0.1)]'
              : 'border-[var(--color-void-border)] text-[var(--color-text-muted)] hover:border-[rgba(0,212,255,0.35)] hover:text-[var(--color-neon-cyan)]'"
          >#{{ tag }} <span class="opacity-50 ml-0.5">{{ count }}</span></button>
        </div>
      </div>

      <section v-for="year in years" :key="year" class="mb-14 relative">
        <div class="flex items-center gap-4 mb-5">
          <span class="font-mono text-sm font-bold text-[var(--color-neon-cyan)] glow-cyan border border-[rgba(0,212,255,0.4)] px-4 py-1.5 rounded-full bg-[rgba(0,212,255,0.08)] tracking-widest">
            {{ year }}
          </span>
          <span class="flex-1 h-px bg-gradient-to-r from-[rgba(0,212,255,0.3)] to-transparent"></span>
          <span class="font-mono text-[10px] text-[var(--color-text-muted)]">{{ byYear[year].length }} 篇</span>
        </div>

        <div class="space-y-1 pl-1">
          <NuxtLink
            v-for="post in byYear[year]"
            :key="post.slug"
            :href="`/blog/${post.slug}`"
            class="post-card-glow group relative flex flex-col items-start gap-2.5 sm:flex-row sm:items-center sm:gap-4 px-3 py-3 rounded-lg border border-transparent hover:border-[rgba(0,212,255,0.2)] hover:bg-[var(--color-void-card)] transition-all duration-150 overflow-hidden"
          >
            <span class="absolute left-0 top-0 bottom-0 w-0 group-hover:w-[3px] rounded-l-lg transition-all duration-200"
                  :style="`background: var(--color-${getTagColor(post.tags[0] ?? 'x')})`"></span>
            <span class="shrink-0 w-1.5 h-1.5 rounded-full opacity-50 group-hover:opacity-100 transition-opacity"
                  :style="`background: var(--color-${getTagColor(post.tags[0] ?? 'x')})`"></span>
            <time :datetime="post.pub_date"
                  class="font-mono text-[10px] text-[var(--color-text-muted)] shrink-0 w-auto sm:w-16 tabular-nums text-left sm:text-right">
              {{ formatMonthDay(post.pub_date) }}
            </time>
            <div class="w-full sm:flex-1 min-w-0">
              <span class="font-mono text-sm text-[var(--color-text-primary)] group-hover:text-[var(--color-neon-cyan)] transition-colors block leading-snug line-clamp-2 sm:truncate">
                {{ post.title }}
              </span>
              <span v-if="post.description" class="font-mono text-[10px] text-[var(--color-text-secondary)] block mt-0.5 leading-snug opacity-70 group-hover:opacity-100 transition-opacity line-clamp-2 sm:truncate">
                {{ post.description }}
              </span>
            </div>
            <div class="hidden sm:flex gap-1.5 shrink-0">
              <span v-for="tag in post.tags.slice(0, 2)" :key="tag"
                    class="font-mono text-[9px] px-2 py-0.5 rounded-full bg-[var(--color-void-muted)] text-[var(--color-text-muted)]">
                #{{ tag }}
              </span>
            </div>
            <span class="hidden sm:inline font-mono text-xs text-[var(--color-text-muted)] group-hover:text-[var(--color-neon-green)] transition-colors shrink-0 ml-auto">→</span>
          </NuxtLink>
        </div>
      </section>

      <!-- Empty state -->
      <div v-if="filtered.length === 0" class="py-16 text-center">
        <p class="font-mono text-[var(--color-text-muted)] mb-3">没有找到 #{{ activeTag }} 的文章</p>
        <button @click="activeTag = ''" class="font-mono text-xs text-[var(--color-neon-cyan)] hover:underline"> 清除过滤</button>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup lang="ts">
const { siteUrl, siteName } = useSiteConfig()
useCanonical('/blog')
useSeoMeta({
  description: `${siteName} 所有技术文章列表，按年份归档，涵盖 C++、Vue3、AI Agent、Linux 等主题`,
  ogTitle: `全部文章 | ${siteName}`,
  ogDescription: '所有技术文章列表，按年份归档',
  ogUrl: `${siteUrl}/blog`,
})

const { data: postsData } = await useFetch('/api/posts', { default: () => [] as any[] })
const posts = computed(() => postsData.value || [])

const { data: tagsData } = await useFetch('/api/tags', { default: () => ({} as Record<string, number>) })
const topTags = computed(() =>
  Object.entries(tagsData.value || {}).sort((a, b) => b[1] - a[1]).slice(0, 16)
)

const activeTag = ref('')
const filtered = computed(() =>
  activeTag.value ? posts.value.filter((p: any) => p.tags.includes(activeTag.value)) : posts.value
)

const { getTagColor } = useTagColor()
const { formatMonthDay } = useFormatDate()

const byYear = computed(() => {
  const acc: Record<string, any[]> = {}
  for (const p of filtered.value) {
    const y = p.pub_date.slice(0, 4)
    if (!acc[y]) acc[y] = []
    acc[y].push(p)
  }
  return acc
})
const years = computed(() => Object.keys(byYear.value).sort((a, b) => Number(b) - Number(a)))
</script>
