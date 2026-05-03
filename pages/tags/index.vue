<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'tags', href: '/tags' }]" />

    <main class="max-w-4xl mx-auto px-6 py-12">
      <div class="mb-10">
        <h1 class="font-mono text-2xl font-bold text-[var(--color-text-primary)] mb-1">
          <span class="text-[var(--color-neon-green)]">$</span> ls ~/tags
        </h1>
        <p class="font-mono text-xs text-[var(--color-text-muted)] mt-2">字号与亮度反映文章数量，点击进入分类</p>
      </div>

      <!-- 标签热力云 -->
      <div class="flex flex-wrap gap-2">
        <NuxtLink
          v-for="[tag, count] in tags"
          :key="tag"
          :href="`/tags/${tag}`"
          class="font-mono rounded-lg border transition-all hover:scale-105 hover:brightness-125"
          :style="tagStyle(count)"
        >
          <span class="opacity-40 mr-0.5">#</span>{{ tag
          }}<span class="ml-1.5 opacity-35 text-[0.7em]">{{ count }}</span>
        </NuxtLink>
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
  ogUrl: `${siteUrl}/tags`,
})

const { data: tagCountsData } = await useFetch('/api/tags', { default: () => ({} as Record<string, number>) })
const tags = computed(() =>
  Object.entries(tagCountsData.value || {}).sort((a, b) => b[1] - a[1])
)
const maxCount = computed(() => tags.value[0]?.[1] ?? 1)

const PALETTE = [
  { color: '0,255,136',  var: 'var(--color-neon-green)' },
  { color: '0,212,255',  var: 'var(--color-neon-cyan)' },
  { color: '180,76,255', var: 'var(--color-neon-purple)' },
  { color: '255,45,120', var: 'var(--color-neon-pink)' },
]

function tagStyle(count: number) {
  const ratio = count / maxCount.value
  const size = 10 + ratio * 7
  const idx = Math.floor(ratio * (PALETTE.length - 1))
  const p = PALETTE[idx]
  return {
    fontSize: `${size}px`,
    padding: `${3 + ratio * 3}px ${8 + ratio * 5}px`,
    color: p.var,
    borderColor: `rgba(${p.color}, ${0.15 + ratio * 0.25})`,
    background: `rgba(${p.color}, ${0.03 + ratio * 0.05})`,
  }
}
</script>
