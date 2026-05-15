<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'tags', href: '/tags' }]" />

    <main class="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <!-- Header -->
      <div class="mb-10">
        <h1 class="font-mono text-2xl font-bold text-[var(--color-text-primary)] mb-1">
          <span class="text-[var(--color-neon-green)]">$</span> ls ~/tags
        </h1>
        <p class="font-mono text-xs text-[var(--color-text-muted)] mt-2">
          {{ tags.length }} 个标签 · {{ totalPosts }} 篇文章
        </p>
      </div>

      <!-- Search -->
      <div class="mb-8 relative">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[var(--color-text-muted)] text-sm select-none">/</span>
        <input
          v-model="query"
          type="text"
          placeholder="过滤标签..."
          class="w-full max-w-xs bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg pl-7 pr-4 py-2 font-mono text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-neon-cyan)] transition-colors"
        />
      </div>

      <!-- Tag Grid -->
      <div v-if="filteredTags.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <NuxtLink
          v-for="item in filteredTags"
          :key="item.tag"
          :href="`/tags/${item.tag}`"
          class="tag-card group relative overflow-hidden rounded-xl border bg-[var(--color-void-card)] p-5 transition-all duration-200 hover:scale-[1.02]"
          :style="cardStyle(item.tag)"
        >
          <!-- Color bar top -->
          <div
            class="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl transition-all duration-200 group-hover:h-[3px]"
            :style="{ background: getTagColorVar(item.tag) }"
          />

          <!-- Tag name -->
          <div class="flex items-baseline gap-1 mb-3">
            <span class="font-mono text-lg font-bold opacity-50" :style="{ color: getTagColorVar(item.tag) }">#</span>
            <span class="font-mono text-lg font-bold" :style="{ color: getTagColorVar(item.tag) }">{{ item.tag }}</span>
          </div>

          <!-- Stats -->
          <div class="flex items-center gap-3 mb-3">
            <span class="font-mono text-xs text-[var(--color-text-muted)]">
              <span class="text-[var(--color-text-secondary)] font-semibold">{{ item.count }}</span> 篇文章
            </span>
          </div>

          <!-- Latest post -->
          <div v-if="item.latestTitle" class="border-t border-[var(--color-void-border)] pt-3 mt-auto">
            <p class="font-mono text-[10px] text-[var(--color-text-muted)] mb-1 uppercase tracking-wider">最新</p>
            <p class="font-mono text-xs text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
              {{ item.latestTitle }}
            </p>
          </div>
        </NuxtLink>
      </div>

      <!-- Empty state -->
      <div v-else class="font-mono text-sm text-[var(--color-text-muted)] py-16 text-center">
        <span class="text-[var(--color-neon-pink)]">404</span> — 没找到匹配的标签
      </div>
    </main>
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
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      return {
        tag,
        count,
        latestTitle: tagPosts[0]?.title ?? null,
      }
    })
)

const totalPosts = computed(() =>
  Object.values(tagCountsData.value || {}).reduce((a, b) => a + b, 0)
)

const filteredTags = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return tags.value
  return tags.value.filter(item => item.tag.toLowerCase().includes(q))
})

function cardStyle(tag: string) {
  return {
    borderColor: `color-mix(in srgb, ${getTagColorVar(tag)} 20%, var(--color-void-border))`,
    '--hover-glow': getTagColorVar(tag),
  }
}
</script>

<style scoped>
.tag-card:hover {
  border-color: color-mix(in srgb, var(--hover-glow) 45%, var(--color-void-border)) !important;
  box-shadow: 0 0 16px color-mix(in srgb, var(--hover-glow) 15%, transparent);
}
</style>
