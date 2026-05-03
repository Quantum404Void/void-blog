<template>
  <div v-if="post" class="min-h-screen bg-[var(--color-void)]">
    <ReadingProgress />
    
    <!-- Nav -->
    <nav class="sticky top-0 z-50 border-b border-[var(--color-void-border)] bg-[rgba(10,10,15,0.8)] backdrop-blur-xl">
      <div class="max-w-6xl mx-auto px-6 h-14 flex items-center gap-6">
        <NuxtLink href="/" class="font-mono text-sm text-[var(--color-neon-green)] hover:glow-green transition-all">~/void-blog</NuxtLink>
        <span class="text-[var(--color-text-muted)]">/</span>
        <span class="font-mono text-xs text-[var(--color-text-muted)] truncate max-w-xs">{{ post.title }}</span>
        <div class="ml-auto flex items-center gap-4 text-xs text-[var(--color-text-muted)] font-mono">
          <span v-if="readingTime">约 {{ readingTime }} 分钟</span>
        </div>
      </div>
    </nav>

    <!-- Layout: article + TOC -->
    <div class="max-w-6xl mx-auto px-6 py-16 flex gap-12">
      <!-- Article -->
      <main class="flex-1 min-w-0 max-w-3xl">
        <header class="mb-12">
          <div v-if="post.tags.length" class="flex flex-wrap gap-2 mb-6">
            <NuxtLink
              v-for="tag in post.tags"
              :key="tag"
              :href="`/tags/${tag}`"
              class="font-mono text-xs px-3 py-1 rounded-full border border-[rgba(0,212,255,0.3)] text-[var(--color-neon-cyan)] bg-[rgba(0,212,255,0.05)] hover:border-[rgba(0,212,255,0.6)] hover:bg-[rgba(0,212,255,0.1)] transition-all"
            >
              #{{ tag }}
            </NuxtLink>
          </div>

          <h1 class="text-3xl sm:text-4xl font-bold font-mono leading-tight mb-6 text-[var(--color-text-primary)]">
            {{ post.title }}
          </h1>

          <p v-if="post.description" class="text-lg text-[var(--color-text-secondary)] mb-6 leading-relaxed">
            {{ post.description }}
          </p>

          <div class="flex items-center gap-4 text-sm text-[var(--color-text-muted)] font-mono border-t border-[var(--color-void-border)] pt-4">
            <time :datetime="post.pub_date">
              <span class="text-[var(--color-neon-green)]">$</span> {{ formatDate(post.pub_date) }}
            </time>
          </div>
        </header>

        <!-- Content -->
        <article class="prose" v-html="renderedContent" />

        <!-- Footer -->
        <footer class="mt-16 pt-8 border-t border-[var(--color-void-border)] space-y-10">
          <!-- Prev/Next -->
          <div class="grid grid-cols-2 gap-4 font-mono text-xs">
            <NuxtLink
              v-if="prevPost"
              :href="`/blog/${prevPost.slug}`"
              class="prev-post-link group flex flex-col gap-1 p-4 rounded-xl border border-[var(--color-void-border)] hover:border-[rgba(0,212,255,0.35)] hover:bg-[var(--color-void-card)] transition-all"
            >
              <span class="text-[var(--color-text-muted)] text-[10px] uppercase tracking-widest">← 上一篇</span>
              <span class="text-[var(--color-text-primary)] group-hover:text-[var(--color-neon-cyan)] transition-colors line-clamp-2 leading-snug">{{ prevPost.title }}</span>
            </NuxtLink>
            <div v-else />
            <NuxtLink
              v-if="nextPost"
              :href="`/blog/${nextPost.slug}`"
              class="next-post-link group flex flex-col gap-1 p-4 rounded-xl border border-[var(--color-void-border)] hover:border-[rgba(0,212,255,0.35)] hover:bg-[var(--color-void-card)] transition-all text-right"
            >
              <span class="text-[var(--color-text-muted)] text-[10px] uppercase tracking-widest">下一篇 →</span>
              <span class="text-[var(--color-text-primary)] group-hover:text-[var(--color-neon-cyan)] transition-colors line-clamp-2 leading-snug">{{ nextPost.title }}</span>
            </NuxtLink>
            <div v-else />
          </div>

          <!-- Related -->
          <div v-if="related.length > 0">
            <div class="flex items-center gap-4 mb-5">
              <span class="h-px flex-1 bg-gradient-to-r from-transparent via-[rgba(180,76,255,0.3)] to-transparent"></span>
              <p class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.2em] flex items-center gap-2">
                <span class="text-[var(--color-neon-purple)]">▶</span> 相关文章
              </p>
              <span class="h-px flex-1 bg-gradient-to-r from-transparent via-[rgba(180,76,255,0.3)] to-transparent"></span>
            </div>
            <div class="space-y-2">
              <NuxtLink
                v-for="r in related"
                :key="r.slug"
                :href="`/blog/${r.slug}`"
                class="group flex items-start gap-3 p-3 rounded-xl border border-transparent hover:border-[var(--color-void-border)] hover:bg-[var(--color-void-card)] transition-all"
              >
                <span class="text-[var(--color-neon-purple)] font-mono text-xs mt-0.5">▸</span>
                <div class="flex-1 min-w-0">
                  <span class="font-mono text-sm text-[var(--color-text-primary)] group-hover:text-[var(--color-neon-cyan)] transition-colors line-clamp-1">{{ r.title }}</span>
                  <div class="flex flex-wrap gap-1.5 mt-1.5">
                    <span v-for="t in r.tags.slice(0, 3)" :key="t" class="font-mono text-[10px] text-[var(--color-text-muted)] bg-[var(--color-void-muted)] px-2 py-0.5 rounded-full">#{{ t }}</span>
                  </div>
                </div>
              </NuxtLink>
            </div>
          </div>

          <!-- Author strip -->
          <div class="flex items-center justify-between flex-wrap gap-4 py-4 border-t border-[var(--color-void-border)]">
            <div class="flex items-center gap-3 font-mono text-xs text-[var(--color-text-muted)]">
              <div class="w-8 h-8 rounded-full border border-[rgba(0,212,255,0.3)] flex items-center justify-center text-sm" style="background:rgba(0,212,255,0.08);color:#00d4ff">王</div>
              <div>
                <div class="text-[var(--color-text-primary)] font-bold" style="font-size:11px">王宇</div>
                <div style="font-size:10px;color:rgba(136,136,170,0.8)">C++ / AI Agent / 桌面应用</div>
              </div>
            </div>
            <div class="flex gap-3 font-mono text-[10px] text-[var(--color-text-muted)]">
              <a href="https://github.com/Quantum505Void" target="_blank" rel="noopener" class="hover:text-[var(--color-neon-green)] transition-colors">GitHub</a>
              <NuxtLink href="/rss.xml" class="hover:text-[var(--color-neon-cyan)] transition-colors">RSS</NuxtLink>
            </div>
          </div>

          <NuxtLink href="/" class="font-mono text-sm text-[var(--color-neon-cyan)] hover:text-[var(--color-neon-green)] transition-colors flex items-center gap-2">
            <span>←</span> 返回首页
          </NuxtLink>
        </footer>
      </main>

      <!-- TOC Sidebar -->
      <aside v-if="tocHeadings.length > 1" class="hidden xl:block w-52 shrink-0">
        <TableOfContents :headings="tocHeadings" />
      </aside>
    </div>
  </div>
  <div v-else class="min-h-screen bg-[var(--color-void)] flex items-center justify-center">
    <p class="font-mono text-[var(--color-text-muted)]">文章不存在</p>
  </div>
</template>

<script setup lang="ts">
import MarkdownIt from 'markdown-it'

const route = useRoute()
const slug = route.params.slug as string

const { data: post, error } = await useFetch(`/api/posts/${slug}`)

if (error.value || !post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found' })
}

useSeoMeta({
  title: `${post.value.title} | void.dev`,
  description: post.value.description,
})

// Render markdown
const md = new MarkdownIt({ html: true, linkify: true, typographer: true })
const renderedContent = computed(() => post.value ? md.render(post.value.content) : '')

// Extract headings from rendered content
interface Heading { depth: number; slug: string; text: string }
const tocHeadings = computed<Heading[]>(() => {
  if (!post.value) return []
  const matches = [...post.value.content.matchAll(/^(#{1,3})\s+(.+)$/gm)]
  return matches.map(m => ({
    depth: m[1].length,
    slug: m[2].toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, ''),
    text: m[2],
  }))
})

const readingTime = computed(() => post.value ? Math.max(1, Math.round(post.value.content.length / 600)) : 0)

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

// Get all posts for prev/next/related
const { data: allPostsData } = await useFetch('/api/posts', { default: () => [] as any[] })
const allPosts = computed(() => (allPostsData.value || []).filter((p: any) => p.slug !== slug && p.slug !== 'about'))

const postTags = computed(() => new Set(post.value?.tags ?? []))

const related = computed(() =>
  allPosts.value
    .map((p: any) => ({ post: p, score: p.tags.filter((t: string) => postTags.value.has(t)).length }))
    .filter((x: any) => x.score > 0)
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 3)
    .map((x: any) => x.post)
)

const curIdx = computed(() => allPosts.value.findIndex((p: any) => p.slug === slug))
const prevPost = computed(() => curIdx.value < allPosts.value.length - 1 ? allPosts.value[curIdx.value + 1] : null)
const nextPost = computed(() => curIdx.value > 0 ? allPosts.value[curIdx.value - 1] : null)
</script>
