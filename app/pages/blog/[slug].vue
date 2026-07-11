<template>
  <div>
  <div v-if="post" class="min-h-screen bg-[var(--color-void)]">
    <ReadingProgress />
    
    <!-- Nav -->
    <AppNav :crumbs="[{ label: 'blog', href: '/blog' }, { label: post?.title ?? slug }]" />

    <!-- Layout: article + TOC -->
    <div class="article-shell mx-auto px-4 py-10 sm:px-6 sm:py-16">
      <!-- Article -->
      <main class="article-main min-w-0">
        <header class="article-header mb-12 sm:mb-16">
          <div class="mb-6 flex flex-wrap items-center gap-2">
            <span v-if="post.demo" class="inline-flex min-h-8 items-center rounded-full border border-[rgba(0,255,136,0.32)] px-3 font-mono text-[11px] text-[var(--color-neon-green)]">
              Demo · 阅读体验预览
            </span>
            <NuxtLink
              v-for="tag in post.tags"
              :key="tag"
              :href="`/tags/${tag}`"
              class="group inline-flex min-h-8 items-center rounded-full px-3 font-mono text-[11px] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-neon-cyan)]"
            >
              <span class="mr-0.5 text-[var(--color-neon-cyan)] opacity-70">#</span>{{ tag }}
            </NuxtLink>
          </div>

          <h1 class="article-title mb-6 font-mono font-bold leading-[1.15] tracking-[-0.035em] text-[var(--color-text-primary)] text-balance">
            {{ post.title }}
          </h1>

          <p v-if="post.description" class="article-deck mb-8 max-w-[65ch] text-lg leading-relaxed text-[var(--color-text-secondary)] text-pretty sm:text-xl">
            {{ post.description }}
          </p>

          <div class="article-meta flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-[var(--color-void-border)] py-4 font-mono text-xs text-[var(--color-text-muted)]">
            <span class="flex min-h-8 items-center gap-1.5">
              <span aria-hidden="true" class="text-[var(--color-neon-green)]">$</span>
              <time :datetime="post.pub_date" class="text-[var(--color-text-secondary)]">{{ formatDateLong(post.pub_date) }}</time>
            </span>
            <span class="flex min-h-8 items-center gap-1.5">
              <span aria-hidden="true" class="text-[var(--color-neon-purple)]">◷</span>
              <span>{{ formatCount(wordCount) }} 字</span>
              <span class="text-[var(--color-void-muted)]">/</span>
              <span>约 {{ readingTime }} 分钟</span>
            </span>
            <span v-if="!post.demo" class="flex min-h-8 items-center gap-1.5">
              <span aria-hidden="true" class="text-[var(--color-neon-cyan)]">◎</span>
              <span>{{ postViews || '—' }} 次阅读</span>
            </span>
            <button
              v-if="ttsSupported"
              @click="toggleTts"
              class="flex min-h-8 items-center gap-1 font-mono text-xs text-[var(--color-neon-green)] transition-colors hover:text-[var(--color-text-primary)]"
            >
              <span>{{ ttsLabel }}</span>
            </button>
          </div>
        </header>

        <!-- Content -->
        <!-- SSR: content_html 立刻渲染，Shiki 就绪后 renderedContent 静默替换 -->
        <article class="prose article-prose" v-html="displayContent" />

        <!-- Footer -->
        <footer class="mt-16 pt-8 border-t border-[var(--color-void-border)] space-y-10">
          <!-- Views + Likes -->
          <div v-if="!post.demo" class="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
            <div class="flex items-center gap-2 font-mono text-xs text-[var(--color-text-muted)]">
              <span class="text-base">👁</span>
              <span>{{ postViews }} 次阅读</span>
            </div>
            <button
              @click="handleLike"
              :disabled="liked"
              class="flex min-h-11 items-center gap-2 rounded-full border px-4 font-mono text-xs transition-all"
              :class="liked
                ? 'border-[rgba(255,45,120,0.6)] text-[var(--color-neon-pink)] bg-[rgba(255,45,120,0.08)] cursor-default'
                : 'border-[var(--color-void-border)] text-[var(--color-text-muted)] hover:border-[rgba(255,45,120,0.5)] hover:text-[var(--color-neon-pink)] hover:bg-[rgba(255,45,120,0.05)]'"
            >
              <span class="text-base transition-transform" :class="liked ? 'scale-125' : ''">{{ liked ? '❤️' : '🤍' }}</span>
              <span>{{ postLikes }}</span>
            </button>
          </div>

          <!-- Prev/Next -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
            <NuxtLink
              v-if="prevPost"
              :href="`/blog/${prevPost.slug}`"
              class="prev-post-link group flex flex-col gap-1 p-4 rounded-xl border border-[var(--color-void-border)] hover:border-[rgba(0,212,255,0.35)] hover:bg-[var(--color-void-card)] transition-all"
            >
              <span class="text-[var(--color-text-muted)] text-[10px] uppercase tracking-widest">← 上一篇</span>
              <span class="text-[var(--color-text-primary)] group-hover:text-[var(--color-neon-cyan)] transition-colors line-clamp-2 leading-snug">{{ prevPost.title }}</span>
            </NuxtLink>
            <NuxtLink
              v-if="nextPost"
              :href="`/blog/${nextPost.slug}`"
              class="next-post-link group flex flex-col gap-1 p-4 rounded-xl border border-[var(--color-void-border)] hover:border-[rgba(0,212,255,0.35)] hover:bg-[var(--color-void-card)] transition-all text-left sm:text-right"
              :class="!prevPost ? 'sm:col-start-2' : ''"
            >
              <span class="text-[var(--color-text-muted)] text-[10px] uppercase tracking-widest">下一篇 →</span>
              <span class="text-[var(--color-text-primary)] group-hover:text-[var(--color-neon-cyan)] transition-colors line-clamp-2 leading-snug">{{ nextPost.title }}</span>
            </NuxtLink>
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
          <div class="flex flex-col items-start gap-4 py-5 border-t border-[var(--color-void-border)] sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center gap-3 font-mono text-xs text-[var(--color-text-muted)]">
              <div class="w-8 h-8 rounded-full border border-[rgba(0,212,255,0.3)] flex items-center justify-center text-sm" style="background:rgba(0,212,255,0.08);color:#00d4ff">{{ authorInitial }}</div>
              <div>
                <div class="text-[var(--color-text-primary)] font-bold" style="font-size:11px">{{ authorName }}</div>
                <div style="font-size:10px;color:rgba(136,136,170,0.8)">C++ / Python / AI Agent / 桌面应用</div>
              </div>
            </div>
            <div class="flex flex-wrap gap-3 font-mono text-[10px] text-[var(--color-text-muted)] items-center">
              <a :href="authorGithub" target="_blank" rel="noopener" class="inline-flex min-h-11 items-center hover:text-[var(--color-neon-green)] transition-colors">GitHub</a>
              <a href="/rss.xml" class="inline-flex min-h-11 items-center hover:text-[var(--color-neon-cyan)] transition-colors">RSS</a>
              <button
                @click="copyLink"
                class="flex min-h-11 items-center gap-1 whitespace-nowrap rounded border border-[var(--color-void-border)] px-3 hover:border-[rgba(0,212,255,0.35)] hover:text-[var(--color-neon-cyan)] transition-all"
                :class="copied ? 'text-[var(--color-neon-green)] border-[rgba(0,255,136,0.35)]' : ''"
              >
                <svg v-if="!copied" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                {{ copied ? '✓ 已复制' : '复制链接' }}
              </button>
            </div>
          </div>

          <button @click="router.back()" class="flex min-h-11 items-center gap-2 font-mono text-sm text-[var(--color-neon-cyan)] transition-colors hover:text-[var(--color-neon-green)]">
            <span>←</span> 返回
          </button>

          <!-- 评论 -->
          <div v-if="!post.demo" class="pt-8 border-t border-[var(--color-void-border)]">
            <p class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
              <span class="text-[var(--color-neon-cyan)]">&#9654;</span> 评论
              <span class="flex-1 h-px bg-gradient-to-r from-[rgba(0,212,255,0.2)] to-transparent"></span>
            </p>
            <BlogComments :slug="slug" />
          </div>
        </footer>
      </main>

      <!-- Desktop TOC -->
      <aside v-if="tocHeadings.length > 1" class="article-toc hidden xl:block" aria-label="文章目录">
        <TableOfContents :headings="tocHeadings" />
      </aside>
    </div>
  </div>
  <div v-else class="min-h-screen bg-[var(--color-void)] flex items-center justify-center">
    <p class="font-mono text-[var(--color-text-muted)]">文章不存在</p>
  </div>
  <!-- Mobile TOC drawer -->
  <Transition name="slide-up">
    <div v-if="tocOpen" class="xl:hidden fixed inset-0 z-40 flex flex-col justify-end bg-black/60" @click.self="tocOpen = false">
      <div id="mobile-toc" role="dialog" aria-modal="true" aria-label="文章目录" class="bg-[var(--color-void-card)] border-t border-[var(--color-void-border)] rounded-t-2xl p-5 sm:p-6 max-h-[70vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <p class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.2em] flex items-center gap-2">
            <span class="text-[var(--color-neon-green)]">▶</span> 目录
          </p>
          <button @click="tocOpen = false" class="flex size-11 items-center justify-center rounded-md font-mono text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]" aria-label="关闭文章目录">✕</button>
        </div>
        <TableOfContents :headings="tocHeadings" />
      </div>
    </div>
  </Transition>
  <!-- Mobile TOC float button -->
  <button
    v-if="tocHeadings.length > 1"
    @click="tocOpen = !tocOpen"
    class="xl:hidden fixed bottom-4 right-[4.25rem] sm:bottom-6 sm:right-[4.75rem] z-50 size-11 rounded-full flex items-center justify-center font-mono text-base transition-colors"
    style="background:rgba(0,212,255,0.12);border:1px solid rgba(0,212,255,0.35);color:var(--color-neon-cyan);backdrop-filter:blur(8px);"
    aria-label="打开文章目录"
    :aria-expanded="tocOpen"
    aria-controls="mobile-toc"
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="16" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  </button>

  <!-- Continue Reading bar -->
  <Transition name="slide-down">
    <div
      v-if="continueBar.show"
      class="fixed top-0 left-0 right-0 z-[110] flex flex-col items-start gap-2 px-4 py-2.5 font-mono text-xs sm:flex-row sm:items-center sm:justify-between"
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
  </div>
</template>

<script setup lang="ts">
import { useClipboard, useLocalStorage } from '@vueuse/core'
import type { PostSummary } from '~/types/post'
const route = useRoute()
const router = useRouter()
const slug = route.params.slug as string

const { data: post, error } = await useFetch(`/api/posts/${slug}`)

if (error.value || !post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found' })
}

const { siteUrl, siteName, authorName, authorGithub, authorInitial } = useSiteConfig()
useCanonical(`/blog/${slug}`)
useSeoMeta({
  title: `${post.value.title} | ${siteName}`,
  description: post.value.description || `${post.value.title} — ${siteName}`,
  ogTitle: `${post.value.title} | ${siteName}`,
  ogDescription: post.value.description || `${post.value.title} — ${siteName}`,
  ogType: 'article',
  ogUrl: `${siteUrl}/blog/${slug}`,
  ogImage: `${siteUrl}/og/${slug}`,
  articlePublishedTime: post.value.pub_date,
  articleTag: post.value.tags,
  twitterCard: 'summary_large_image',
  twitterTitle: `${post.value.title} | ${siteName}`,
  twitterDescription: post.value.description,
  twitterImage: `${siteUrl}/og/${slug}`,
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

// displayContent: SSR 用 content_html，Shiki 就绪后用 renderedContent（含高亮）
const renderedContent = shallowRef('')
// computed: 优先用 Shiki 渲染结果，否则 fallback 到服务端 HTML（无高亮但立刻可见）
const displayContent = computed<string>(() =>
  renderedContent.value || post.value?.content_html || ''
)

onMounted(() => {
  // Shiki 增量替换：就绪后重新渲染，代码块"亮起"高亮效果
  const { buildMd } = useMarkdown()
  watch(() => post.value?.content, async (content) => {
    if (!content) return
    const md = await buildMd()
    const highlighted = md.render(content)
    // 只在内容有变化时替换（避免闪烁）
    if (highlighted !== renderedContent.value) {
      renderedContent.value = highlighted
    }
  }, { immediate: true })
})

// Extract headings from RENDERED HTML — 避免代码块里的 # 注释被误识别
// h2 为一级，h3 为二级（缩进显示）
interface Heading { depth: number; slug: string; text: string }
const tocHeadings = computed<Heading[]>(() => {
  const content = displayContent.value
  if (!content) return []
  const matches = [...content.matchAll(/<(h[23])[^>]*id="([^"]+)"[^>]*>(.*?)<\/h[23]>/gs)]
  return matches.map(m => ({
    depth: m[1] === 'h2' ? 2 : 3,
    slug: m[2] ?? '',
    text: (m[3] ?? '').replace(/<[^>]+>/g, '')
      .replace(/&quot;/g, '"').replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&apos;/g, "'")
      .replace(/&#39;/g, "'").replace(/&#x27;/g, "'").trim(),
  }))
})

const { calcReadingTime, calcWordCount, formatCount } = useReadingTime()
const { formatDateLong } = useFormatDate()

const readingTime = computed(() => post.value ? calcReadingTime(post.value.content) : 0)
const wordCount = computed(() => post.value ? calcWordCount(post.value.content) : 0)

// Get all posts for prev/next/related（lazy：不阻塞文章内容渲染）
const { data: allPostsData } = useLazyFetch('/api/posts', { default: () => [] as PostSummary[] })
const allPosts = computed(() => (allPostsData.value || []).filter((item: PostSummary) => item.slug !== 'about'))
const otherPosts = computed(() => allPosts.value.filter((item: PostSummary) => item.slug !== slug))

const postTags = computed(() => new Set(post.value?.tags ?? []))

const related = computed(() => {
  const curYear = post.value?.pub_date?.slice(0, 4) ?? ''
  const scored = otherPosts.value
    .map((p: PostSummary) => {
      const tagOverlap = p.tags.filter((t: string) => postTags.value.has(t)).length
      const yearBonus = p.pub_date?.slice(0, 4) === curYear ? 1 : 0
      return { post: p, score: tagOverlap * 2 + yearBonus }
    })
    .filter((x: { post: PostSummary; score: number }) => x.score > 0)
    .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
    .slice(0, 3)
    .map((x: { post: PostSummary; score: number }) => x.post)
  if (scored.length > 0) return scored
  // fallback: 2 latest
  return otherPosts.value.slice(0, 2)
})

const curIdx = computed(() => allPosts.value.findIndex((p: PostSummary) => p.slug === slug))
const prevPost = computed(() => curIdx.value >= 0 && curIdx.value < allPosts.value.length - 1 ? allPosts.value[curIdx.value + 1] : null)
const nextPost = computed(() => curIdx.value > 0 ? allPosts.value[curIdx.value - 1] : null)

// prev/next prefetch
useHead(computed(() => ({
  link: [
    ...(prevPost.value ? [{ rel: 'prefetch', href: `/blog/${prevPost.value.slug}` }] : []),
    ...(nextPost.value ? [{ rel: 'prefetch', href: `/blog/${nextPost.value.slug}` }] : []),
  ]
})))

// 浏览量 + 点赞
const postViews = shallowRef(0)
const postLikes = shallowRef(0)
// 使用 useLocalStorage 持久化点赞状态（避免刷新后重复点赞）
const likedPosts = useLocalStorage<string[]>('void-liked-posts', [])
const liked = computed(() => likedPosts.value.includes(slug))

async function loadStats() {
  if (post.value?.demo) return
  try {
    const data = await $fetch<{ views: number; likes: number }>(`/api/stats/${slug}`)
    postViews.value = data.views
    postLikes.value = data.likes
  } catch {}
}

async function recordView() {
  if (post.value?.demo) return
  try {
    const data = await $fetch<{ views: number; likes: number }>(`/api/stats/${slug}`, {
      method: 'POST', body: { action: 'view' }
    })
    postViews.value = data.views
    postLikes.value = data.likes
  } catch {}
}

async function handleLike() {
  if (liked.value || post.value?.demo) return
  likedPosts.value = [...likedPosts.value, slug]
  try {
    const data = await $fetch<{ views: number; likes: number }>(`/api/stats/${slug}`, {
      method: 'POST', body: { action: 'like' }
    })
    postLikes.value = data.likes
  } catch { likedPosts.value = likedPosts.value.filter(s => s !== slug) }
}

// Mobile TOC
const tocOpen = shallowRef(false)

// 阅读进度持久化
const { bar: continueBar, jumpToSaved } = useReadingProgress(slug)

const { attachCopyButtons } = useCodeCopy()

// SPA 内跳转时 renderedContent 变化 → 重新注入（非首次）
watch(renderedContent, async () => {
  await nextTick()
  const articleEl = document.querySelector('.prose') as HTMLElement | null
  attachCopyButtons(articleEl)
}, { flush: 'post' })

let recordViewTimer: ReturnType<typeof setTimeout> | undefined

onMounted(async () => {
  // 首次挂载注入复制按钮（客户端 hydration 完成后）
  await nextTick()
  attachCopyButtons(document.querySelector('.prose') as HTMLElement | null)

  loadStats()
  // 延迟 1s 再记录阅读，避免预览模式误计
  recordViewTimer = setTimeout(recordView, 1000)
})

onUnmounted(() => clearTimeout(recordViewTimer))

// TTS — 使用 useTts composable 封装
const { supported: ttsSupported, label: ttsLabel, speak: speakArticle } = useTts()

function toggleTts() {
  const plainText = (post.value?.title ?? '') + '\n' +
    (renderedContent.value ?? '').replace(/<[^>]+>/g, '')
  speakArticle(plainText)
}

const shareUrl = computed(() => `${siteUrl}/blog/${slug}`)
const { copy: copyToClipboard, copied } = useClipboard({ source: shareUrl })
const copyLink = () => copyToClipboard(shareUrl.value)
</script>

<style scoped>
.article-shell {
  position: relative;
  width: 100%;
}

.article-main {
  width: min(100%, 45rem);
  margin-inline: auto;
}

.article-title {
  font-size: clamp(2.25rem, 6vw, 4.5rem);
  max-width: 18ch;
}

.article-deck {
  border-left: 1px solid rgba(0, 212, 255, 0.3);
  padding-left: 1rem;
}

.article-prose {
  margin-inline: auto;
}

@media (min-width: 1280px) {
  .article-prose {
    margin-inline: 0;
  }

  .article-toc {
    position: absolute;
    top: 4rem;
    left: calc(50% + 24rem);
    width: 14rem;
    min-width: 0;
  }
}

.slide-down-enter-active, .slide-down-leave-active { transition: transform 0.25s ease, opacity 0.25s ease; }
.slide-down-enter-from, .slide-down-leave-to { transform: translateY(-100%); opacity: 0; }
.slide-up-enter-active, .slide-up-leave-active { transition: transform 0.25s ease, opacity 0.25s ease; }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); opacity: 0; }
</style>
