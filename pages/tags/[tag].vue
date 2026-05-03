<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <nav class="sticky top-0 z-50 border-b border-[var(--color-void-border)] bg-[rgba(10,10,15,0.85)] backdrop-blur-xl">
      <div class="max-w-3xl mx-auto px-6 h-14 flex items-center gap-4">
        <NuxtLink href="/" class="font-mono text-sm text-[var(--color-neon-green)]">~/void-blog</NuxtLink>
        <span class="text-[var(--color-text-muted)]">/</span>
        <NuxtLink href="/tags" class="font-mono text-sm text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)]">tags</NuxtLink>
        <span class="text-[var(--color-text-muted)]">/</span>
        <span class="font-mono text-sm" style="color:var(--color-neon-cyan)">#{{ tag }}</span>
      </div>
    </nav>
    <main class="max-w-3xl mx-auto px-6 py-16">
      <div class="mb-10">
        <h1 class="font-mono text-2xl font-bold text-[var(--color-text-primary)] mb-2">
          <span class="text-[var(--color-neon-cyan)]">#</span>{{ tag }}
        </h1>
        <p class="font-mono text-xs text-[var(--color-text-muted)]">{{ posts.length }} 篇文章</p>
      </div>

      <div class="space-y-2">
        <NuxtLink
          v-for="post in posts"
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
const route = useRoute()
const tag = route.params.tag as string

useSeoMeta({
  title: `#${tag} | ${siteName}`,
  description: `${siteName} 上关于 #${tag} 的所有技术文章`,
  ogTitle: `#${tag} | ${siteName}`,
  ogDescription: `${siteName} 上关于 #${tag} 的所有技术文章`,
  ogUrl: `${siteUrl}/tags/${tag}`,
})

const { data: postsData } = await useFetch(`/api/posts/tag/${tag}`, { default: () => [] as any[] })
const posts = computed(() => postsData.value || [])

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
</script>
