<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav />

    <!-- Hero -->
    <section class="relative py-20 sm:py-24 border-b border-[var(--color-void-border)] overflow-hidden">
      <div class="absolute inset-0 opacity-[0.06]"
           style="background-image: linear-gradient(var(--color-neon-green) 1px, transparent 1px), linear-gradient(90deg, var(--color-neon-green) 1px, transparent 1px); background-size: 40px 40px;"></div>
      <div class="absolute top-0 right-0 rounded-full" style="width:600px;height:600px;background:radial-gradient(circle, rgba(180,76,255,0.12), transparent 70%);transform:translate(30%,-30%);pointer-events:none"></div>
      <div class="absolute bottom-0 left-0 rounded-full" style="width:400px;height:400px;background:radial-gradient(circle, rgba(0,212,255,0.1), transparent 70%);transform:translate(-30%,30%);pointer-events:none"></div>
      <div class="absolute inset-0" style="background:radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,255,136,0.04), transparent);pointer-events:none"></div>

      <div class="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div class="flex items-start gap-3 sm:gap-4 mb-8" ref="heroBlock">
          <div class="mt-2 w-2 h-2 rounded-full bg-[var(--color-neon-green)] shrink-0 hero-online-dot" style="box-shadow: 0 0 8px rgba(0,255,136,0.8);"></div>
          <div>
            <p ref="heroPrompt" class="font-mono text-[10px] tracking-[0.2em] uppercase mb-3 flex items-center gap-2" style="opacity:0;transform:translateY(12px)">
              <span class="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-neon-green)] hero-online-dot"></span>
              <span style="color:var(--color-neon-green)">root@void</span><span style="color:var(--color-text-muted)">:~$</span>
              <span style="color:var(--color-text-muted)">./init</span>
            </p>
            <h1 ref="heroTitle" class="text-4xl sm:text-7xl font-bold font-mono leading-none mb-6" style="opacity:0;transform:translateY(16px)">
              <span class="text-[var(--color-text-primary)]">void</span><span class="gradient-text">.</span><span class="text-[var(--color-neon-cyan)]">dev</span><span class="cursor-blink text-[var(--color-neon-green)] text-4xl sm:text-5xl"></span>
            </h1>
            <div class="font-mono text-sm space-y-2.5 max-w-xl">
              <p ref="heroLine0Wrap" style="opacity:0;transform:translateY(10px);color:#c8c8e0">
                <span style="color:#b400ff">interest</span>
                <span style="color:#6666aa"> = </span>
                <span ref="heroLine0" style="color:#00d4ff"></span>
              </p>
              <p ref="heroLine1Wrap" style="opacity:0;transform:translateY(10px);color:#c8c8e0">
                <span style="color:#b400ff">stack</span>
                <span style="color:#6666aa"> = </span>
                <span ref="heroLine1" style="color:#39ff14"></span>
              </p>
              <p ref="heroLine2Wrap" style="opacity:0;transform:translateY(10px);color:#c8c8e0">
                <span style="color:#b400ff">status</span>
                <span style="color:#6666aa"> = </span>
                <span ref="heroLine2" style="color:#39ff14"></span>
              </p>
            </div>
          </div>
        </div>

        <!-- Stats bar -->
        <div ref="heroStats" class="flex flex-wrap gap-x-6 gap-y-3 font-mono text-xs text-[var(--color-text-muted)]" style="opacity:0;transform:translateY(10px)">
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
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 sm:gap-12">
      <!-- Posts list -->
      <section>
        <h2 class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
          <span class="text-[var(--color-neon-green)]">▶</span>
          最近更新
          <span class="flex-1 h-px bg-gradient-to-r from-[var(--color-void-border)] to-transparent"></span>
        </h2>

        <!-- Timeline -->
        <div class="relative pl-4 sm:pl-5">
          <!-- vertical line -->
          <div class="absolute left-1.5 top-2 bottom-2 w-px" style="background:linear-gradient(to bottom,rgba(0,212,255,0.3),rgba(180,76,255,0.2),transparent)"></div>
          <div class="space-y-0" ref="postListRef">
            <NuxtLink
              v-for="(post, i) in recentPosts"
              :key="post.slug"
              :href="`/blog/${post.slug}`"
              class="post-item post-card-glow group block p-4 rounded-xl border border-transparent hover:border-[rgba(0,212,255,0.25)] hover:bg-[var(--color-void-card)] transition-all duration-200 relative"
              style="opacity:0;transform:translateY(20px)"
            >
              <!-- timeline dot -->
              <div
                class="absolute -left-[1.15rem] top-5 w-2.5 h-2.5 rounded-full border-2 border-[var(--color-void)] shrink-0 z-10 transition-transform group-hover:scale-125"
                :style="`background: var(--color-${getTagColor(post.tags[0] ?? '')}); box-shadow: 0 0 6px var(--color-${getTagColor(post.tags[0] ?? '')})`"
              ></div>
              <div class="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <h3 class="font-mono text-sm text-[var(--color-text-primary)] group-hover:text-[var(--color-neon-cyan)] transition-colors leading-snug">
                  {{ post.title }}
                </h3>
                <time :datetime="post.pub_date" class="font-mono text-[10px] text-[var(--color-text-muted)] shrink-0 pt-0.5">
                  {{ formatDate(post.pub_date) }}
                </time>
              </div>
              <p v-if="post.description" class="text-xs mt-1 line-clamp-2 sm:line-clamp-1 leading-relaxed" style="color:#9999bb">
                {{ post.description }}
              </p>
              <div class="flex flex-wrap gap-1.5 mt-2">
                <span v-for="tag in post.tags.slice(0, 3)" :key="tag"
                      class="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-void-muted)] text-[var(--color-text-muted)]">
                  #{{ tag }}
                </span>
              </div>
            </NuxtLink>
          </div>
        </div>

        <div class="mt-6">
          <NuxtLink href="/blog"
             class="inline-flex items-center gap-2 font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)] transition-colors border border-[var(--color-void-border)] hover:border-[rgba(0,212,255,0.3)] px-4 py-2 rounded-lg">
            查看全部 {{ allPosts.length }} 篇文章 →
          </NuxtLink>
        </div>
      </section>

      <!-- Sidebar -->
      <aside class="space-y-8">
        <div class="space-y-px">
          <div class="font-mono text-xs text-[var(--color-text-muted)] py-1">
            <span style="color:var(--color-neon-green)">{{ authorName }}</span>
            <span class="ml-2 text-[10px]">C++ / Python / AI Agent / 桌面</span>
          </div>
          <div class="pt-3 mt-2 border-t border-[var(--color-void-border)] flex flex-wrap gap-x-4 gap-y-1.5">
            <a :href="authorGithub" target="_blank" rel="noopener"
               class="font-mono text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)] transition-colors">GitHub ↗</a>
            <NuxtLink href="/rss.xml" class="font-mono text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)] transition-colors">RSS ↗</NuxtLink>
            <NuxtLink href="/search" class="font-mono text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)] transition-colors">Search ↗</NuxtLink>
            <NuxtLink href="/stats" class="font-mono text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)] transition-colors">Stats ↗</NuxtLink>
            <NuxtLink href="/lab" class="font-mono text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)] transition-colors">Lab ↗</NuxtLink>
          </div>
        </div>

        <!-- Hot tags -->
        <div>
          <p class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-3">
            <span class="text-[var(--color-neon-purple)]">▶</span> 热门标签
          </p>
          <div class="flex flex-wrap gap-1.5">
            <NuxtLink
              v-for="[tag] in topTags"
              :key="tag"
              :href="`/tags/${tag}`"
              class="font-mono text-[10px] px-2 py-0.5 rounded border border-[var(--color-void-border)] text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)] hover:border-[rgba(0,212,255,0.3)] transition-all"
            >
              #{{ tag }}
            </NuxtLink>
          </div>
        </div>
      </aside>
    </div>

    <AppFooter maxW="max-w-6xl" backHref="">
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

const { data: allPostsRaw } = await useFetch('/api/posts', { default: () => [] as any[] })
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
  const { gsap } = await useGsap()
  if (!gsap) return

  const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })

  // 入场序列
  tl.to(heroPrompt.value, { opacity: 1, y: 0, duration: 0.4 })
    .to(heroTitle.value, { opacity: 1, y: 0, duration: 0.5 }, '-=0.1')
    .to(heroLine0Wrap.value, { opacity: 1, y: 0, duration: 0.35 }, '-=0.1')
    .to(heroLine1Wrap.value, { opacity: 1, y: 0, duration: 0.35 }, '-=0.2')
    .to(heroLine2Wrap.value, { opacity: 1, y: 0, duration: 0.35 }, '-=0.2')
    .to(heroStats.value, { opacity: 1, y: 0, duration: 0.4 }, '-=0.1')

  // TextPlugin 打字机
  const typeLines = [
    { el: heroLine0, text: '["C++", "Python", "AI Agent", "桌面应用"]', start: 0.3 },
    { el: heroLine1, text: '["C++", "TypeScript", "Vue", "Nuxt"]', start: 0.7 },
    { el: heroLine2, text: '在线 ●', start: 1.1 },
  ]
  typeLines.forEach(({ el, text, start }) => {
    if (!el.value) return
    gsap.to(el.value, {
      duration: text.length * 0.028,
      text: { value: text, delimiter: '' },
      ease: 'none',
      delay: start,
    })
  })

  // 文章列表 ScrollTrigger stagger
  const { ScrollTrigger } = await useGsap()
  if (postListRef.value && ScrollTrigger) {
    const items = postListRef.value.querySelectorAll<HTMLElement>('.post-item')
    gsap.to(items, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: 'power2.out',
      stagger: 0.08,
      scrollTrigger: {
        trigger: postListRef.value,
        start: 'top 88%',
        once: true,
      },
    })
  }
})
</script>
