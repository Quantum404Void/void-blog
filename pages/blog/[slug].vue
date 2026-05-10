<template>
  <div v-if="post" class="min-h-screen bg-[var(--color-void)]">
    <ReadingProgress />
    
    <!-- Nav -->
    <AppNav :crumbs="[{ label: 'blog', href: '/blog' }, { label: post?.title ?? slug }]" />

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

          <h1 class="text-3xl sm:text-4xl font-bold font-mono leading-tight mb-6 text-[var(--color-text-primary)]" style="text-shadow:0 0 30px rgba(0,255,136,0.15),0 0 60px rgba(0,255,136,0.05)">
            {{ post.title }}
          </h1>

          <p v-if="post.description" class="text-lg text-[var(--color-text-secondary)] mb-6 leading-relaxed">
            {{ post.description }}
          </p>

          <div class="flex items-center gap-4 text-sm text-[var(--color-text-muted)] font-mono border-t border-[var(--color-void-border)] pt-4">
            <time :datetime="post.pub_date">
              <span class="text-[var(--color-neon-green)]">$</span> {{ formatDateLong(post.pub_date) }}
            </time>
            <span class="text-[var(--color-void-border)]">|</span>
            <span class="flex items-center gap-1">
              <span class="text-[var(--color-neon-purple)]">⏱</span>
              约 {{ readingTime }} 分钟
            </span>
          </div>
        </header>

        <!-- Content -->
        <article class="prose" v-html="renderedContent" />

        <!-- Footer -->
        <footer class="mt-16 pt-8 border-t border-[var(--color-void-border)] space-y-10">
          <!-- Views + Likes -->
          <div class="flex items-center justify-center gap-8">
            <div class="flex items-center gap-2 font-mono text-xs text-[var(--color-text-muted)]">
              <span class="text-base">👁</span>
              <span>{{ postViews }} 次阅读</span>
            </div>
            <button
              @click="handleLike"
              :disabled="liked"
              class="flex items-center gap-2 font-mono text-xs px-4 py-2 rounded-full border transition-all"
              :class="liked
                ? 'border-[rgba(255,45,120,0.6)] text-[var(--color-neon-pink)] bg-[rgba(255,45,120,0.08)] cursor-default'
                : 'border-[var(--color-void-border)] text-[var(--color-text-muted)] hover:border-[rgba(255,45,120,0.5)] hover:text-[var(--color-neon-pink)] hover:bg-[rgba(255,45,120,0.05)]'"
            >
              <span class="text-base transition-transform" :class="liked ? 'scale-125' : ''">{{ liked ? '❤️' : '🤍' }}</span>
              <span>{{ postLikes }}</span>
            </button>
          </div>

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

          <!-- Author strip + Share -->
          <div class="flex items-center justify-between flex-wrap gap-4 py-4 border-t border-[var(--color-void-border)]">
            <div class="flex items-center gap-3 font-mono text-xs text-[var(--color-text-muted)]">
              <div class="w-8 h-8 rounded-full border border-[rgba(0,212,255,0.3)] flex items-center justify-center text-sm" style="background:rgba(0,212,255,0.08);color:#00d4ff">{{ authorInitial }}</div>
              <div>
                <div class="text-[var(--color-text-primary)] font-bold" style="font-size:11px">{{ authorName }}</div>
                <div style="font-size:10px;color:rgba(136,136,170,0.8)">C++ / Python / AI Agent / 桌面应用</div>
              </div>
            </div>
            <div class="flex gap-3 font-mono text-[10px] text-[var(--color-text-muted)] items-center">
              <a :href="authorGithub" target="_blank" rel="noopener" class="hover:text-[var(--color-neon-green)] transition-colors">GitHub</a>
              <NuxtLink href="/rss.xml" class="hover:text-[var(--color-neon-cyan)] transition-colors">RSS</NuxtLink>
              <button
                @click="copyLink"
                class="flex items-center gap-1 px-2.5 py-1 rounded border border-[var(--color-void-border)] hover:border-[rgba(0,212,255,0.35)] hover:text-[var(--color-neon-cyan)] transition-all"
                :class="copied ? 'text-[var(--color-neon-green)] border-[rgba(0,255,136,0.35)]' : ''"
              >
                <svg v-if="!copied" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                {{ copied ? '✓ 已复制' : '复制链接' }}
              </button>
            </div>
          </div>

          <NuxtLink href="/" class="font-mono text-sm text-[var(--color-neon-cyan)] hover:text-[var(--color-neon-green)] transition-colors flex items-center gap-2">
            <span>←</span> 返回首页
          </NuxtLink>

          <!-- 评论 -->
          <div class="pt-8 border-t border-[var(--color-void-border)]">
            <p class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
              <span class="text-[var(--color-neon-cyan)]">&#9654;</span> 评论
              <span class="flex-1 h-px bg-gradient-to-r from-[rgba(0,212,255,0.2)] to-transparent"></span>
            </p>
            <ClientOnly>
              <GiscusComments :slug="slug" />
            </ClientOnly>
          </div>
        </footer>
      </main>

      <!-- TOC Sidebar -->
      <aside v-if="tocHeadings.length > 1" class="hidden xl:block w-52 shrink-0 relative">
        <TableOfContents :headings="tocHeadings" />
      </aside>
    </div>
  </div>
  <div v-else class="min-h-screen bg-[var(--color-void)] flex items-center justify-center">
    <p class="font-mono text-[var(--color-text-muted)]">文章不存在</p>
  </div>
  <!-- Mobile TOC drawer -->
  <Transition name="slide-up">
    <div v-if="tocOpen" class="xl:hidden fixed inset-0 z-40 flex flex-col justify-end" @click.self="tocOpen = false">
      <div class="bg-[var(--color-void-card)] border-t border-[var(--color-void-border)] rounded-t-2xl p-6 max-h-[60vh] overflow-y-auto shadow-2xl">
        <div class="flex items-center justify-between mb-4">
          <p class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.2em] flex items-center gap-2">
            <span class="text-[var(--color-neon-green)]">▶</span> 目录
          </p>
          <button @click="tocOpen = false" class="font-mono text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-lg">✕</button>
        </div>
        <TableOfContents :headings="tocHeadings" />
      </div>
    </div>
  </Transition>
  <!-- Mobile TOC float button -->
  <button
    v-if="tocHeadings.length > 1"
    @click="tocOpen = !tocOpen"
    class="xl:hidden fixed bottom-20 right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center font-mono text-base shadow-lg transition-all"
    style="background:rgba(0,212,255,0.12);border:1px solid rgba(0,212,255,0.35);color:var(--color-neon-cyan);backdrop-filter:blur(8px);"
    title="目录"
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="16" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  </button>

  <!-- Continue Reading bar -->
  <Transition name="slide-down">
    <div
      v-if="continueBar.show"
      class="fixed top-0 left-0 right-0 z-[110] flex items-center justify-between px-4 py-2.5 font-mono text-xs"
      style="background:rgba(19,19,31,0.95);border-bottom:1px solid rgba(0,212,255,0.25);backdrop-filter:blur(8px);"
    >
      <span style="color:var(--color-text-muted)">上次读到 <span style="color:var(--color-neon-cyan)">{{ continueBar.pct }}%</span></span>
      <button
        @click="jumpToSaved"
        class="px-3 py-1 rounded border transition-all"
        style="border-color:rgba(0,212,255,0.35);color:var(--color-neon-cyan);background:rgba(0,212,255,0.08);hover:background:rgba(0,212,255,0.15)"
      >继续阅读 →</button>
      <button @click="continueBar.show = false" style="color:var(--color-text-muted)">✕</button>
    </div>
  </Transition>

</template>

<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string

const { data: post, error } = await useFetch(`/api/posts/${slug}`)

if (error.value || !post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found' })
}

const { siteUrl, siteName, authorName, authorGithub, authorInitial } = useSiteConfig()
useSeoMeta({
  title: `${post.value.title} | ${siteName}`,
  description: post.value.description || `${post.value.title} — ${siteName}`,
  ogTitle: `${post.value.title} | ${siteName}`,
  ogDescription: post.value.description || `${post.value.title} — ${siteName}`,
  ogType: 'article',
  ogUrl: `${siteUrl}/blog/${slug}`,
  ogImage: `${siteUrl}/og-default.png`,
  articlePublishedTime: post.value.pub_date,
  articleTag: post.value.tags,
  twitterCard: 'summary_large_image',
  twitterTitle: `${post.value.title} | ${siteName}`,
  twitterDescription: post.value.description,
  twitterImage: `${siteUrl}/og-default.png`,
})

// JSON-LD 结构化数据
useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.value.title,
      description: post.value.description,
      datePublished: post.value.pub_date,
      dateModified: post.value.pub_date,
      author: { '@type': 'Person', name: authorName, url: siteUrl },
      publisher: { '@type': 'Person', name: authorName, url: siteUrl },
      url: `${siteUrl}/blog/${slug}`,
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${siteUrl}/blog/${slug}` },
      keywords: post.value.tags?.join(', '),
    })
  }]
})



const { md } = useMarkdown()
const renderedContent = computed(() => post.value ? md.render(post.value.content) : '')

// Extract headings from RENDERED HTML — 避免代码块里的 # 注释被误识别
// 只取 h2（跳过文章 h1 大标题和过细的 h3），保证 TOC 简洁且锚点真实存在
interface Heading { depth: number; slug: string; text: string }
const tocHeadings = computed<Heading[]>(() => {
  if (!renderedContent.value) return []
  const matches = [...renderedContent.value.matchAll(/<h2[^>]*id="([^"]+)"[^>]*>(.*?)<\/h2>/gs)]
  return matches.map(m => ({
    depth: 2,
    slug: m[1],
    text: m[2].replace(/<[^>]+>/g, '').trim(),
  }))
})

const { calcReadingTime } = useReadingTime()
const { formatDateLong } = useFormatDate()

const readingTime = computed(() => post.value ? calcReadingTime(post.value.content) : 0)

// Get all posts for prev/next/related
const { data: allPostsData } = await useFetch('/api/posts', { default: () => [] as any[] })
const allPosts = computed(() => (allPostsData.value || []).filter((p: any) => p.slug !== slug && p.slug !== 'about'))

const postTags = computed(() => new Set(post.value?.tags ?? []))

const related = computed(() => {
  const curYear = post.value?.pub_date?.slice(0, 4) ?? ''
  const scored = allPosts.value
    .map((p: any) => {
      const tagOverlap = p.tags.filter((t: string) => postTags.value.has(t)).length
      const yearBonus = p.pub_date?.slice(0, 4) === curYear ? 1 : 0
      return { post: p, score: tagOverlap * 2 + yearBonus }
    })
    .filter((x: any) => x.score > 0)
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 3)
    .map((x: any) => x.post)
  if (scored.length > 0) return scored
  // fallback: 2 latest
  return allPosts.value.slice(0, 2)
})

const curIdx = computed(() => allPosts.value.findIndex((p: any) => p.slug === slug))
const prevPost = computed(() => curIdx.value < allPosts.value.length - 1 ? allPosts.value[curIdx.value + 1] : null)
const nextPost = computed(() => curIdx.value > 0 ? allPosts.value[curIdx.value - 1] : null)

// 浏览量 + 点赞
const postViews = ref(0)
const postLikes = ref(0)
const liked = ref(false)

async function loadStats() {
  try {
    const data = await $fetch<{ views: number; likes: number }>(`/api/stats/${slug}`)
    postViews.value = data.views
    postLikes.value = data.likes
  } catch {}
}

async function recordView() {
  try {
    const data = await $fetch<{ views: number; likes: number }>(`/api/stats/${slug}`, {
      method: 'POST', body: { action: 'view' }
    })
    postViews.value = data.views
    postLikes.value = data.likes
  } catch {}
}

async function handleLike() {
  if (liked.value) return
  liked.value = true
  try {
    const data = await $fetch<{ views: number; likes: number }>(`/api/stats/${slug}`, {
      method: 'POST', body: { action: 'like' }
    })
    postLikes.value = data.likes
  } catch { liked.value = false }
}

// Mobile TOC
const tocOpen = ref(false)

// Continue reading bar
const continueBar = reactive({ show: false, pct: 0, savedY: 0 })
const PROGRESS_KEY = computed(() => `reading-progress-${slug}`)

function saveReadingProgress() {
  const scrollTop = window.scrollY
  const docHeight = document.documentElement.scrollHeight - window.innerHeight
  if (docHeight <= 0) return
  const pct = Math.round((scrollTop / docHeight) * 100)
  if (pct > 5) localStorage.setItem(PROGRESS_KEY.value, JSON.stringify({ pct, y: scrollTop }))
}

function jumpToSaved() {
  window.scrollTo({ top: continueBar.savedY, behavior: 'smooth' })
  continueBar.show = false
}

const { attachCopyButtons } = useCodeCopy()

// 当文章内容渲染后重新注入复制按钮（SPA 跳转时 renderedContent 会更新）
watch(renderedContent, async () => {
  await nextTick()
  const articleEl = document.querySelector('.prose') as HTMLElement | null
  attachCopyButtons(articleEl)
}, { flush: 'post' })

onMounted(() => {
  // Continue reading: check saved progress
  const saved = localStorage.getItem(PROGRESS_KEY.value)
  if (saved) {
    try {
      const { pct, y } = JSON.parse(saved)
      if (pct > 5 && pct < 95) {
        continueBar.pct = pct
        continueBar.savedY = y
        continueBar.show = true
      }
    } catch {}
  }
  // Save progress on scroll
  window.addEventListener('scroll', saveReadingProgress, { passive: true })

  loadStats()
  // 延迟 1s 再记录阅读，避免预览模式刻处
  setTimeout(recordView, 1000)
})

onUnmounted(() => {
  window.removeEventListener('scroll', saveReadingProgress)
})

const shareUrl = computed(() => `${siteUrl}/blog/${slug}`)
const copied = ref(false)
async function copyLink() {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {}
}
</script>

<style scoped>
.slide-down-enter-active, .slide-down-leave-active { transition: transform 0.25s ease, opacity 0.25s ease; }
.slide-down-enter-from, .slide-down-leave-to { transform: translateY(-100%); opacity: 0; }
.slide-up-enter-active, .slide-up-leave-active { transition: transform 0.25s ease, opacity 0.25s ease; }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); opacity: 0; }
</style>
