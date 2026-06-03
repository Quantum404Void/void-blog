<template>
  <div class="min-h-screen bg-[var(--color-void)] overflow-x-hidden">
    <AppNav />

    <!-- Hero -->
    <section class="relative py-20 sm:py-24 border-b border-[var(--color-void-border)] overflow-hidden">
      <div class="absolute inset-0 opacity-[0.025]"
           style="background-image: linear-gradient(var(--color-neon-green) 1px, transparent 1px), linear-gradient(90deg, var(--color-neon-green) 1px, transparent 1px); background-size: 40px 40px;"></div>
      <div class="absolute top-0 right-0 rounded-full" style="width:600px;height:600px;background:radial-gradient(circle, rgba(180,76,255,0.12), transparent 70%);transform:translate(30%,-30%);pointer-events:none"></div>
      <div class="absolute bottom-0 left-0 rounded-full" style="width:400px;height:400px;background:radial-gradient(circle, rgba(0,212,255,0.1), transparent 70%);transform:translate(-30%,30%);pointer-events:none"></div>
      <div class="absolute inset-0" style="background:radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,255,136,0.04), transparent);pointer-events:none"></div>


      <div class="relative max-w-2xl mx-auto px-4 sm:px-6">
        <div class="flex items-start gap-3 sm:gap-4 mb-8" ref="heroBlock">
          <div class="mt-2 w-2 h-2 rounded-full bg-[var(--color-neon-green)] shrink-0 hero-online-dot" style="box-shadow: 0 0 8px rgba(0,255,136,0.8);"></div>
          <div>
            <p ref="heroPrompt" class="font-mono text-[10px] tracking-[0.2em] uppercase mb-3 flex items-center gap-2" >
              <span class="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-neon-green)] hero-online-dot"></span>
              <span style="color:var(--color-neon-green)">root@void</span><span style="color:var(--color-text-muted)">:~$</span>
              <span style="color:var(--color-text-muted)">./init</span>
            </p>
            <h1 ref="heroTitle" class="text-4xl sm:text-7xl font-bold font-mono leading-none mb-6" >
              <span class="text-[var(--color-text-primary)]">void</span><span class="gradient-text">.</span><span class="text-[var(--color-neon-cyan)]">dev</span><span class="cursor-blink text-[var(--color-neon-green)] text-4xl sm:text-5xl"></span>
            </h1>
            <div class="font-mono text-sm space-y-2.5 max-w-xl">
              <p ref="heroLine0Wrap" style="color:#c8c8e0">
                <span style="color:#b400ff">interest</span>
                <span style="color:#6666aa"> = </span>
                <span ref="heroLine0" style="color:#00d4ff">"C++ · 嵌入式 · AI Agent"</span>
              </p>
              <p ref="heroLine1Wrap" style="color:#c8c8e0">
                <span style="color:#b400ff">stack</span>
                <span style="color:#6666aa"> = </span>
                <span ref="heroLine1" style="color:#39ff14">"Qt · Python · Nuxt · Electron"</span>
              </p>
              <p ref="heroLine2Wrap" style="color:#c8c8e0">
                <span style="color:#b400ff">status</span>
                <span style="color:#6666aa"> = </span>
                <span ref="heroLine2" style="color:#39ff14">"folding reality, one commit at a time"</span>
              </p>
            </div>
          </div>
        </div>

        <!-- Stats bar -->
        <div ref="heroStats" class="flex flex-wrap gap-x-6 gap-y-3 font-mono text-xs text-[var(--color-text-muted)]" >
          <div class="flex items-center gap-2">
            <span class="text-[var(--color-neon-green)]">▸</span>
            <span style="color:#e8e8f0;font-weight:bold">{{ allPosts.length }}</span>
            <span>篇文章</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[var(--color-neon-cyan)]">▸</span>
            <span style="color:#e8e8f0;font-weight:bold">{{ allTags.length }}</span>
            <span>个标签</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[var(--color-neon-purple)]">▸</span>
            <span style="color:#e8e8f0;font-weight:bold">{{ startYear }}</span>
            <span>年至今</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Content grid -->
    <div class="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <!-- Quick links row -->
      <div class="flex flex-wrap items-center gap-x-5 gap-y-1.5 mb-10 font-mono text-[11px] text-[var(--color-text-muted)]">
        <a :href="authorGithub" target="_blank" rel="noopener"
           class="hover:text-[var(--color-neon-cyan)] transition-colors">GitHub ↗</a>
        <NuxtLink href="/rss.xml" class="hover:text-[var(--color-neon-cyan)] transition-colors">RSS ↗</NuxtLink>
        <NuxtLink href="/explore" class="hover:text-[var(--color-neon-cyan)] transition-colors">Explore ↗</NuxtLink>
        <NuxtLink href="/lab" class="hover:text-[var(--color-neon-cyan)] transition-colors">Lab ↗</NuxtLink>
      </div>

      <!-- Posts list -->
      <section>
        <h2 class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
          最近更新
          <span class="flex-1 h-px bg-gradient-to-r from-[var(--color-void-border)] to-transparent"></span>
        </h2>

        <div class="space-y-0" ref="postListRef">
          <NuxtLink
            v-for="post in recentPosts"
            :key="post.slug"
            :href="`/blog/${post.slug}`"
            class="post-item group block border-b border-[var(--color-void-border)] py-7 last:border-0 transition-colors"
          >
            <div class="flex items-start justify-between gap-4 mb-2">
              <time :datetime="post.pub_date" class="font-mono text-[10px] font-bold tracking-wider text-[var(--color-text-muted)] uppercase shrink-0 pt-0.5">
                {{ formatDate(post.pub_date) }}
              </time>
              <div class="flex flex-wrap gap-1.5 justify-end">
                <span v-for="tag in post.tags.slice(0, 2)" :key="tag"
                      class="font-mono text-[10px] px-2 py-0.5 rounded border border-[var(--color-void-border)] text-[var(--color-text-muted)] leading-none">
                  #{{ tag }}
                </span>
              </div>
            </div>
            <h3 class="font-mono text-base font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-neon-cyan)] transition-colors leading-snug mb-1.5 min-w-0">
              {{ post.title }}
            </h3>
            <p v-if="post.description" class="text-sm leading-relaxed text-[var(--color-text-muted)] line-clamp-2 group-hover:text-[var(--color-text-secondary)] transition-colors">
              {{ post.description }}
            </p>
            <div class="mt-2 font-mono text-sm text-[var(--color-neon-cyan)] opacity-0 group-hover:opacity-100 translate-x-0 group-hover:translate-x-1 transition-all duration-200">
              阅读全文 →
            </div>
          </NuxtLink>
        </div>

        <div class="mt-8">
          <NuxtLink href="/blog"
             class="font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)] transition-colors">
            查看全部 {{ allPosts.length }} 篇文章 →
          </NuxtLink>
        </div>
      </section>
    </div>

    <AppFooter maxW="max-w-2xl" backHref="">
      <span class="font-mono text-xs">
        构建于 <span class="text-[var(--color-neon-cyan)]">Nuxt 4</span> ·
        <span class="text-[var(--color-neon-purple)]">Tailwind v4</span> ·
        <span class="text-[var(--color-neon-green)]">GSAP 3</span>
        · © {{ startYear }}–{{ currentYear }} {{ authorName }}
      </span>
    </AppFooter>
  </div>
</template>

<script setup lang="ts">
import type { PostSummary } from '~/types/post'
const { siteUrl, siteName, siteDescription, authorName, authorGithub } = useSiteConfig()
useCanonical('/')
useSeoMeta({
  title: siteName,
  description: `${authorName}的技术博客 — C++ / Python / AI Agent / 桌面应用。涵盖 C++、Python、Vue3、AI Agent、Electron 等主题`,
  ogTitle: `${siteName} — ${authorName}的技术博客`,
  ogDescription: '代码、工具、折腾与思考。涵盖 C++、Python、Vue3、AI Agent、Electron 等主题',
  ogType: 'website',
  ogUrl: siteUrl,
  ogImage: `${siteUrl}/og-default.png`,
  twitterCard: 'summary_large_image',
  twitterTitle: `${siteName} — ${authorName}的技术博客`,
  twitterDescription: 'C++ / Python / AI Agent / 桌面应用',
  twitterImage: `${siteUrl}/og-default.png`,
})
useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteName,
      url: siteUrl,
      description: siteDescription,
      author: { '@type': 'Person', name: authorName },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteUrl}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    })
  }]
})

const heroBlock = ref<HTMLElement | null>(null)
const heroPrompt = ref<HTMLElement | null>(null)
const heroTitle = ref<HTMLElement | null>(null)
const heroLine0Wrap = ref<HTMLElement | null>(null)
const heroLine1Wrap = ref<HTMLElement | null>(null)
const heroLine2Wrap = ref<HTMLElement | null>(null)
const heroLine0 = ref<HTMLElement | null>(null)
const heroLine1 = ref<HTMLElement | null>(null)
const heroLine2 = ref<HTMLElement | null>(null)
const heroStats = ref<HTMLElement | null>(null)
const postListRef = ref<HTMLElement | null>(null)

const { data: allPostsRaw } = await useFetch('/api/posts', { default: () => [] as PostSummary[] })
const allPosts = computed(() => allPostsRaw.value || [])
const { data: tagCounts } = await useFetch('/api/tags', { default: () => ({} as Record<string, number>) })

const recentPosts = computed(() => allPosts.value.slice(0, 5))
const startYear = computed(() => allPosts.value.length ? allPosts.value[allPosts.value.length - 1].pub_date.slice(0, 4) : '2021')
const currentYear = new Date().getFullYear()
const allTags = computed(() => Object.keys(tagCounts.value || {}))
const topTags = computed(() =>
  Object.entries(tagCounts.value || {}).sort((a, b) => b[1] - a[1]).slice(0, 10)
)

const { getTagColor } = useTagColor()
const { formatDate } = useFormatDate()

onMounted(async () => {
  const bundle = await useGsap()
  if (!bundle) return
  const { gsap, ScrollTrigger } = bundle

  // Hero 入场
  const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })
  tl.from(heroPrompt.value, { opacity: 0, y: 8, duration: 0.3 }, 0)
  tl.from(heroTitle.value,  { opacity: 0, y: 12, duration: 0.4 }, 0.1)
  const lineWraps = [heroLine0Wrap.value, heroLine1Wrap.value, heroLine2Wrap.value]
  lineWraps.forEach((wrap, i) => {
    tl.from(wrap, { opacity: 0, y: 6, duration: 0.25 }, 0.3 + i * 0.08)
  })
  tl.from(heroStats.value, { opacity: 0, y: 8, duration: 0.3 }, 0.55)

  // 打字机动画（原生 JS，无需 TextPlugin）
  const typeTargets = [
    { el: heroLine0.value, text: '"C++ · 嵌入式 · AI Agent"', delay: 500 },
    { el: heroLine1.value, text: '"Qt · Python · Nuxt · Electron"', delay: 800 },
    { el: heroLine2.value, text: '"folding reality, one commit at a time"', delay: 1100 },
  ]
  typeTargets.forEach(({ el, text, delay }) => {
    if (!el) return
    el.textContent = ''
    let i = 0
    setTimeout(() => {
      const timer = setInterval(() => {
        el.textContent = text.slice(0, ++i)
        if (i >= text.length) clearInterval(timer)
      }, 28)
    }, delay)
  })

  // 文章列表 scroll reveal
  if (postListRef.value) {
    const items = postListRef.value.querySelectorAll<HTMLElement>('.post-item')
    gsap.fromTo(items,
      { opacity: 0, y: 14 },
      {
        opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', stagger: 0.07,
        scrollTrigger: { trigger: postListRef.value, start: 'top 88%', once: true },
      }
    )
  }
})
</script>
