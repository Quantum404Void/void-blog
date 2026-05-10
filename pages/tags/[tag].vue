<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'tags', href: '/tags' }, { label: `#${tag}` }]" />
    <main class="max-w-3xl mx-auto px-6 py-16">
      <div class="mb-10">
        <h1 class="font-mono text-2xl font-bold text-[var(--color-text-primary)] mb-2">
          <span class="text-[var(--color-neon-cyan)]">#</span>{{ tag }}
        </h1>
        <p class="font-mono text-xs text-[var(--color-text-muted)]">{{ posts.length }} 篇文章</p>
      </div>

      <div class="space-y-2">
        <PostCard v-for="post in posts" :key="post.slug" :post="post" />
      </div>
    </main>

    <AppFooter backHref="/tags" backLabel="返回标签" />
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
</script>
