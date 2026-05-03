<template>
  <div v-if="post" class="min-h-screen bg-[var(--color-void)]">
    <ReadingProgress />
    
    <!-- Nav -->
    <nav class="sticky top-0 z-50 border-b border-[var(--color-void-border)] bg-[rgba(10,10,15,0.8)] backdrop-blur-xl">
      <div class="max-w-6xl mx-auto px-6 h-14 flex items-center gap-6">
        <NuxtLink href="/" class="font-mono text-sm text-[var(--color-neon-green)] hover:glow-green transition-all">void.dev</NuxtLink>
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
                <div style="font-size:10px;color:rgba(136,136,170,0.8)">C++ / AI Agent / 桌面应用</div>
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
import hljs from 'highlight.js'
// @ts-ignore
import markdownItHljs from 'markdown-it-highlightjs'
// @ts-ignore
import markdownItContainer from 'markdown-it-container'

const route = useRoute()
const slug = route.params.slug as string

const { data: post, error } = await useFetch(`/api/posts/${slug}`)

if (error.value || !post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found' })
}

const { siteUrl, siteName, authorName, authorGithub, authorInitial } = useSiteConfig()
useSeoMeta({
  title: `${post.value.title} | ${siteName}`,
  description: post.value.description,
  ogTitle: `${post.value.title} | ${siteName}`,
  ogDescription: post.value.description,
  ogType: 'article',
  ogUrl: `${siteUrl}/blog/${slug}`,
  twitterCard: 'summary_large_image',
  twitterTitle: `${post.value.title} | ${siteName}`,
  twitterDescription: post.value.description,
})

// JSON-LD 结构化数据
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
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

// heading slug helper
function toSlug(text: string) {
  return text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '')
}

// Render markdown — heading_open 插入 id，保证 TOC 锚点渲染即存在
const md = new MarkdownIt({ html: true, linkify: true, typographer: true })
  .use(markdownItHljs, { hljs, auto: true, code: true })

// Callout 容器：:::tip / :::warning / :::danger / :::info
const calloutTypes = [
  { name: 'tip',     icon: '💡', label: '提示' },
  { name: 'warning', icon: '⚠️', label: '注意' },
  { name: 'danger',  icon: '🚨', label: '危险' },
  { name: 'info',    icon: 'ℹ️', label: '说明' },
]
for (const { name, icon, label } of calloutTypes) {
  md.use(markdownItContainer, name, {
    render(tokens: any[], idx: number) {
      if (tokens[idx].nesting === 1) {
        const title = tokens[idx].info.trim().slice(name.length).trim() || label
        return `<div class="callout callout-${name}"><p class="callout-title">${icon} ${title}</p>\n`
      }
      return '</div>\n'
    }
  })
}

const defaultHeadingOpen = md.renderer.rules.heading_open ||
  ((tokens: any[], idx: number, options: any, env: any, self: any) => self.renderToken(tokens, idx, options))

md.renderer.rules.heading_open = (tokens: any[], idx: number, options: any, env: any, self: any) => {
  const inline = tokens[idx + 1]
  const text = inline?.children?.map((t: any) => t.content).join('') ?? ''
  const id = toSlug(text)
  tokens[idx].attrSet('id', id)
  return defaultHeadingOpen(tokens, idx, options, env, self)
}

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

const readingTime = computed(() => {
  if (!post.value) return 0
  const content = post.value.content
  const cjkChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length
  const otherChars = content.length - cjkChars
  return Math.max(1, Math.round(cjkChars / 500 + otherChars / 1000))
})

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

onMounted(() => {
  loadStats()
  // 延迟 1s 再记录阅读，避免预览模式刻处
  setTimeout(recordView, 1000)
  // 代码块：语言标签 + 复制按钮（heading id 已在 markdown-it renderer 注入，无需重复）
  document.querySelectorAll('.prose pre').forEach(pre => {
    const code = pre.querySelector('code')
    const lang = [...(code?.classList || [])].find(c => c.startsWith('language-'))?.replace('language-', '') || ''

    // 语言标签
    const label = document.createElement('span')
    label.textContent = lang || 'code'
    label.style.cssText = [
      'position:absolute', 'top:0.75rem', 'left:4.5rem',  // 跳过左边红绿黄点(54px+1rem)
      'font-family:var(--font-mono)', 'font-size:10px',
      'color:rgba(136,136,170,0.55)', 'text-transform:uppercase', 'letter-spacing:0.08em',
      'user-select:none', 'pointer-events:none',
    ].join(';')
    pre.appendChild(label)

    // 复制按钮
    const btn = document.createElement('button')
    btn.textContent = '复制'
    btn.style.cssText = [
      'position:absolute', 'top:0.625rem', 'right:0.75rem',
      'font-family:var(--font-mono)', 'font-size:10px',
      'padding:3px 10px', 'border-radius:4px',
      'background:rgba(0,212,255,0.06)', 'border:1px solid rgba(0,212,255,0.18)',
      'color:rgba(0,212,255,0.65)', 'cursor:pointer',
      'transition:all 0.15s', 'z-index:10',
    ].join(';')
    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(0,212,255,0.12)'
      btn.style.borderColor = 'rgba(0,212,255,0.35)'
      btn.style.color = 'rgba(0,212,255,0.9)'
    })
    btn.addEventListener('mouseleave', () => {
      if (btn.textContent === '复制') {
        btn.style.background = 'rgba(0,212,255,0.06)'
        btn.style.borderColor = 'rgba(0,212,255,0.18)'
        btn.style.color = 'rgba(0,212,255,0.65)'
      }
    })
    btn.addEventListener('click', async () => {
      const text = code?.textContent || ''
      try {
        await navigator.clipboard.writeText(text)
        btn.textContent = '✓ 已复制'
        btn.style.color = 'rgba(0,255,136,0.9)'
        btn.style.borderColor = 'rgba(0,255,136,0.4)'
        btn.style.background = 'rgba(0,255,136,0.08)'
        setTimeout(() => {
          btn.textContent = '复制'
          btn.style.color = 'rgba(0,212,255,0.65)'
          btn.style.borderColor = 'rgba(0,212,255,0.18)'
          btn.style.background = 'rgba(0,212,255,0.06)'
        }, 2000)
      } catch {}
    })
    pre.appendChild(btn)
  })
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
