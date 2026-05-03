<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <nav class="sticky top-0 z-50 border-b border-[var(--color-void-border)] bg-[rgba(10,10,15,0.85)] backdrop-blur-xl">
      <div class="max-w-3xl mx-auto px-6 h-14 flex items-center gap-4">
        <NuxtLink href="/" class="font-mono text-sm text-[var(--color-neon-green)]">~/void-blog</NuxtLink>
        <span class="text-[var(--color-text-muted)]">/tags</span>
      </div>
    </nav>
    <main class="max-w-3xl mx-auto px-6 py-16">
      <h1 class="font-mono text-2xl font-bold text-[var(--color-text-primary)] mb-12 flex items-center gap-3">
        <span class="text-[var(--color-neon-green)]">$</span> ls -la ~/tags
      </h1>
      <div class="flex flex-wrap gap-3">
        <NuxtLink
          v-for="[tag, count] in tags"
          :key="tag"
          :href="`/tags/${tag}`"
          class="group flex items-center gap-2 font-mono text-sm px-4 py-2 rounded-lg border border-[var(--color-void-border)] bg-[var(--color-void-card)] text-[var(--color-text-secondary)] hover:border-[rgba(0,212,255,0.4)] hover:text-[var(--color-neon-cyan)] hover:bg-[rgba(0,212,255,0.05)] transition-all"
        >
          <span>#{{ tag }}</span>
          <span class="text-[10px] text-[var(--color-text-muted)] group-hover:text-[var(--color-neon-cyan)]">{{ count }}</span>
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
  ogDescription: `按标签浏览技术文章，涵盖 C++、Vue3、TypeScript、AI、Linux、算法等主题`,
  ogUrl: `${siteUrl}/tags`,
})
const { data: tagCountsData } = await useFetch('/api/tags', { default: () => ({} as Record<string, number>) })
const tags = computed(() => Object.entries(tagCountsData.value || {}).sort((a, b) => b[1] - a[1]))
</script>
