<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'tags', href: '/tags' }, { label: `#${tag}` }]" />

    <main class="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <!-- Tag Header -->
      <div class="mb-10">
        <!-- Color accent bar -->
        <div
          class="h-1 w-16 rounded-full mb-6"
          :style="{ background: tagColor }"
        />

        <div class="flex items-baseline gap-2 mb-4">
          <span class="font-mono text-3xl font-bold" :style="{ color: tagColor }">#</span>
          <h1 class="font-mono text-3xl font-bold text-[var(--color-text-primary)]">{{ tag }}</h1>
        </div>

        <!-- Stats row -->
        <div class="flex flex-wrap gap-6 font-mono text-xs text-[var(--color-text-muted)] mb-6">
          <span>
            <span class="text-[var(--color-text-secondary)] font-semibold">{{ posts.length }}</span> 篇文章
          </span>
          <span v-if="dateRange">
            <span class="text-[var(--color-text-muted)]">{{ dateRange.earliest }}</span>
            <span class="mx-1 opacity-40">→</span>
            <span class="text-[var(--color-text-muted)]">{{ dateRange.latest }}</span>
          </span>
        </div>

        <!-- Related tags -->
        <div v-if="relatedTags.length" class="flex flex-wrap gap-2">
          <span class="font-mono text-xs text-[var(--color-text-muted)] mr-1 self-center">相关：</span>
          <NuxtLink
            v-for="rt in relatedTags"
            :key="rt.tag"
            :href="`/tags/${rt.tag}`"
            class="inline-flex items-center font-mono text-xs rounded-md border px-2 py-0.5 transition-all hover:brightness-125"
            :style="relatedTagStyle(rt.tag)"
          >
            <span class="opacity-50 mr-0.5">#</span>{{ rt.tag }}
            <span class="ml-1 opacity-40 text-[0.8em]">{{ rt.count }}</span>
          </NuxtLink>
        </div>
      </div>

      <!-- Divider -->
      <div
        class="h-px mb-8 rounded-full opacity-30"
        :style="{ background: `linear-gradient(to right, ${tagColor}, transparent)` }"
      />

      <!-- Posts -->
      <div class="space-y-2">
        <PostCard v-for="post in posts" :key="post.slug" :post="post" />
      </div>
    </main>

    <AppFooter backHref="/tags" backLabel="返回标签" />
  </div>
</template>

<script setup lang="ts">
import type { PostSummary } from '~/types/post'
const { siteUrl, siteName } = useSiteConfig()
const route = useRoute()
const tag = route.params.tag as string

useCanonical(`/tags/${tag}`)
useSeoMeta({
  title: `#${tag} | ${siteName}`,
  description: `${siteName} 上关于 #${tag} 的所有技术文章`,
  ogTitle: `#${tag} | ${siteName}`,
  ogDescription: `${siteName} 上关于 #${tag} 的所有技术文章`,
  ogUrl: `${siteUrl}/tags/${tag}`,
})

const { getTagColorVar } = useTagColor()
const tagColor = computed(() => getTagColorVar(tag))

const { data: postsData } = await useFetch(`/api/posts/tag/${tag}`, { default: () => [] as PostSummary[] })
const posts = computed(() => postsData.value || [])

// Date range
const dateRange = computed(() => {
  const dates = posts.value
    .map((p: PostSummary) => p.pub_date ? new Date(p.date) : null)
    .filter(Boolean)
    .sort((a: Date, b: Date) => a.getTime() - b.getTime())
  if (dates.length < 2) return null
  const fmt = (d: Date) => `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`
  return { earliest: fmt(dates[0]), latest: fmt(dates[dates.length - 1]) }
})

// Related tags (co-occurring in same posts)
const relatedTags = computed(() => {
  const coCount: Record<string, number> = {}
  for (const post of posts.value) {
    for (const t of (post.tags || []) as string[]) {
      if (t !== tag) coCount[t] = (coCount[t] || 0) + 1
    }
  }
  return Object.entries(coCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([t, count]) => ({ tag: t, count }))
})

function relatedTagStyle(t: string) {
  const color = getTagColorVar(t)
  return {
    color,
    borderColor: `color-mix(in srgb, ${color} 25%, var(--color-void-border))`,
    background: `color-mix(in srgb, ${color} 5%, transparent)`,
  }
}
</script>
