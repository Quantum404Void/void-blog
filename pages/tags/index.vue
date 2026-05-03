<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <nav class="sticky top-0 z-50 border-b border-[var(--color-void-border)] nav-glass">
      <div class="max-w-4xl mx-auto px-6 h-14 flex items-center gap-4">
        <NuxtLink href="/" class="font-mono text-sm text-[var(--color-neon-green)]">{{ siteName }}</NuxtLink>
        <span class="text-[var(--color-text-muted)]">/</span>
        <span class="font-mono text-sm text-[var(--color-text-muted)]">tags</span>
        <div class="ml-auto font-mono text-xs text-[var(--color-text-muted)]">
          <span class="text-[var(--color-text-secondary)]">{{ tags.length }}</span> 个标签
        </div>
      </div>
    </nav>

    <main class="max-w-4xl mx-auto px-6 py-12">
      <div class="mb-10">
        <h1 class="font-mono text-2xl font-bold text-[var(--color-text-primary)] mb-1">
          <span class="text-[var(--color-neon-green)]">$</span> ls ~/tags <span class="text-[var(--color-text-muted)] text-base font-normal">--sort=frequency</span>
        </h1>
        <p class="font-mono text-xs text-[var(--color-text-muted)] mt-2">
          点击标签查看相关文章 · 字号/亮度反映文章数量
        </p>
      </div>

      <!-- 标签热力云 -->
      <div class="flex flex-wrap gap-2 mb-16">
        <NuxtLink
          v-for="[tag, count] in tags"
          :key="tag"
          :href="`/tags/${tag}`"
          class="font-mono rounded-lg border transition-all hover:scale-105"
          :style="tagStyle(count)"
        >
          <span class="opacity-50 mr-0.5">#</span>{{ tag }}
          <span class="ml-1.5 opacity-40 text-[0.7em]">{{ count }}</span>
        </NuxtLink>
      </div>

      <!-- Top 10 标签条形图 -->
      <div class="border border-[var(--color-void-border)] rounded-xl p-6">
        <p class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
          <span class="text-[var(--color-neon-purple)]">▶</span> 热门标签 Top 10
        </p>
        <div class="space-y-3">
          <div v-for="[tag, count] in top10" :key="tag" class="flex items-center gap-3">
            <NuxtLink :href="`/tags/${tag}`"
              class="font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)] transition-colors w-28 truncate shrink-0">
              #{{ tag }}
            </NuxtLink>
            <div class="flex-1 h-1.5 bg-[var(--color-void-muted)] rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all"
                :style="`width: ${(count / top10[0][1]) * 100}%; background: ${barColor(tag)}`"></div>
            </div>
            <span class="font-mono text-[10px] text-[var(--color-text-muted)] w-6 text-right shrink-0">{{ count }}</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const { siteUrl, siteName } = useSiteConfig()
useSeoMeta({
  title: `Tags | ${siteName}`,
  description: `按标签浏览技术文章，涵盖 C++、Vue3、TypeScript、AI、Linux、算法等主题`,
  ogTitle: `Tags | ${siteName}`,
  ogDescription: `按标签浏览技术文章，涵盖 C++、Vue3、TypeScript、AI、Linux、算法等主题`,
  ogUrl: `${siteUrl}/tags`,
})

const { data: tagCountsData } = await useFetch('/api/tags', { default: () => ({} as Record<string, number>) })
const tags = computed(() =>
  Object.entries(tagCountsData.value || {}).sort((a, b) => b[1] - a[1])
)
const top10 = computed(() => tags.value.slice(0, 10))
const maxCount = computed(() => tags.value[0]?.[1] ?? 1)

const COLORS = ['var(--color-neon-cyan)', 'var(--color-neon-green)', 'var(--color-neon-purple)', 'var(--color-neon-pink)']

function tagStyle(count: number) {
  const ratio = count / maxCount.value
  const size = 10 + ratio * 6  // 10px ~ 16px
  const opacity = 0.5 + ratio * 0.5
  const colorIdx = Math.floor(ratio * (COLORS.length - 1))
  const color = COLORS[colorIdx]
  return {
    fontSize: `${size}px`,
    padding: `${3 + ratio * 3}px ${8 + ratio * 4}px`,
    color,
    borderColor: color.replace(')', ', 0.25)').replace('var(', 'rgba(').replace('--color-', '').replace('neon-cyan', '0,212,255').replace('neon-green', '0,255,136').replace('neon-purple', '180,76,255').replace('neon-pink', '255,45,120'),
    opacity,
  }
}

function barColor(tag: string) {
  const hash = tag.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return COLORS[hash % COLORS.length]
}
</script>
