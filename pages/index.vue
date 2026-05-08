<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav />

    <!-- Hero -->
    <section class="relative py-24 border-b border-[var(--color-void-border)] overflow-hidden">
      <div class="absolute inset-0 opacity-[0.06]"
           style="background-image: linear-gradient(var(--color-neon-green) 1px, transparent 1px), linear-gradient(90deg, var(--color-neon-green) 1px, transparent 1px); background-size: 40px 40px;"></div>
      <div class="absolute top-0 right-0 rounded-full" style="width:600px;height:600px;background:radial-gradient(circle, rgba(180,76,255,0.12), transparent 70%);transform:translate(30%,-30%);pointer-events:none"></div>
      <div class="absolute bottom-0 left-0 rounded-full" style="width:400px;height:400px;background:radial-gradient(circle, rgba(0,212,255,0.1), transparent 70%);transform:translate(-30%,30%);pointer-events:none"></div>
      <div class="absolute inset-0" style="background:radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,255,136,0.04), transparent);pointer-events:none"></div>

      <div class="relative max-w-5xl mx-auto px-6">
        <div class="flex items-start gap-4 mb-8">
          <div class="mt-2 w-2 h-2 rounded-full bg-[var(--color-neon-green)] shrink-0" style="animation: pulse 1.5s ease-in-out infinite;"></div>
          <div>
            <p class="font-mono text-[10px] tracking-[0.2em] uppercase mb-3 flex items-center gap-2">
              <span class="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-neon-green)]" style="animation:pulse 1.5s ease-in-out infinite"></span>
              <span style="color:var(--color-neon-green)">root@void</span><span style="color:var(--color-text-muted)">:~$</span>
              <span style="color:var(--color-text-muted)">./init</span>
            </p>
            <h1 class="text-5xl sm:text-7xl font-bold font-mono leading-none mb-6">
              <span class="text-[var(--color-text-primary)]">void</span><span class="gradient-text">.</span><span class="text-[var(--color-neon-cyan)]">dev</span><span class="cursor-blink text-[var(--color-neon-green)] text-4xl sm:text-5xl"></span>
            </h1>
            <div class="font-mono text-sm space-y-2.5 max-w-xl">
              <p class="animate-fade-up" style="animation-delay:0.1s;color:#c8c8e0">
                <span style="color:#b400ff">interest</span>
                <span style="color:#6666aa"> = </span>
                <span ref="heroLine0" style="color:#00d4ff"></span>
              </p>
              <p class="animate-fade-up" style="animation-delay:0.2s;color:#c8c8e0">
                <span style="color:#b400ff">stack</span>
                <span style="color:#6666aa"> = </span>
                <span ref="heroLine1" style="color:#39ff14"></span>
              </p>
              <p class="animate-fade-up" style="animation-delay:0.3s;color:#c8c8e0">
                <span style="color:#b400ff">status</span>
                <span style="color:#6666aa"> = </span>
                <span ref="heroLine2" style="color:#39ff14"></span>
              </p>
            </div>
          </div>
        </div>

        <!-- Stats bar -->
        <div class="flex gap-8 font-mono text-xs text-[var(--color-text-muted)] animate-fade-up" style="animation-delay:0.4s">
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
    <div class="max-w-5xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-12">
      <!-- Posts list -->
      <section>
        <h2 class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
          <span class="text-[var(--color-neon-green)]">▶</span>
          最近更新
          <span class="flex-1 h-px bg-gradient-to-r from-[var(--color-void-border)] to-transparent"></span>
        </h2>

        <!-- Timeline -->
        <div class="relative pl-5">
          <!-- vertical line -->
          <div class="absolute left-1.5 top-2 bottom-2 w-px" style="background:linear-gradient(to bottom,rgba(0,212,255,0.3),rgba(180,76,255,0.2),transparent)"></div>
          <div class="space-y-0">
            <NuxtLink
              v-for="(post, i) in recentPosts"
              :key="post.slug"
              :href="`/blog/${post.slug}`"
              class="post-card-glow group block p-4 rounded-xl border border-transparent hover:border-[rgba(0,212,255,0.25)] hover:bg-[var(--color-void-card)] transition-all duration-200 animate-fade-up relative"
              :style="`animation-delay: ${i * 0.05}s`"
            >
              <!-- timeline dot -->
              <div
                class="absolute -left-[1.15rem] top-5 w-2.5 h-2.5 rounded-full border-2 border-[var(--color-void)] shrink-0 z-10 transition-transform group-hover:scale-125"
                :style="`background: var(--color-${getTagColor(post.tags[0] ?? '')}); box-shadow: 0 0 6px var(--color-${getTagColor(post.tags[0] ?? '')})`"
              ></div>
              <div class="flex items-start justify-between gap-4">
                <h3 class="font-mono text-sm text-[var(--color-text-primary)] group-hover:text-[var(--color-neon-cyan)] transition-colors leading-snug">
                  {{ post.title }}
                </h3>
                <time :datetime="post.pub_date" class="font-mono text-[10px] text-[var(--color-text-muted)] shrink-0 pt-0.5">
                  {{ formatDate(post.pub_date) }}
                </time>
              </div>
              <p v-if="post.description" class="text-xs mt-1 line-clamp-1 leading-relaxed" style="color:#9999bb">
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

    <!-- Footer -->
    <footer class="border-t border-[var(--color-void-border)] py-10">
      <div class="max-w-5xl mx-auto px-6">
        <div class="font-mono text-[10px] text-[var(--color-text-muted)] text-center mb-4 opacity-30 select-none leading-relaxed">
          ░▒▓ void.dev ▓▒░
        </div>
        <div class="flex items-center justify-between flex-wrap gap-4 font-mono text-xs text-[var(--color-text-muted)]">
          <span>
            构建于 <span class="text-[var(--color-neon-cyan)]">Nuxt 3</span> ·
            <span class="text-[var(--color-neon-purple)]">Tailwind v4</span> ·
            <span class="text-[var(--color-neon-green)]">Vue 3</span>
          </span>
          <span>© {{ startYear }}–{{ currentYear }} {{ authorName }}</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const { siteUrl, siteName, siteDescription, authorName, authorGithub } = useSiteConfig()
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

const heroLine0 = ref<HTMLElement | null>(null)
const heroLine1 = ref<HTMLElement | null>(null)
const heroLine2 = ref<HTMLElement | null>(null)

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

const tagColors = ['neon-green', 'neon-cyan', 'neon-purple', 'neon-pink']
function getTagColor(tag: string) {
  const idx = Math.abs(tag.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % tagColors.length
  return tagColors[idx]
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

onMounted(() => {
  const lines = [
    { el: heroLine0, text: 'interest = ["C++", "Python", "AI Agent", "桌面应用"]', delay: 200 },
    { el: heroLine1, text: 'stack    = ["C++", "TypeScript", "Vue", "Nuxt"]', delay: 600 },
    { el: heroLine2, text: 'status   = 在线 ●', delay: 1000 },
  ]
  lines.forEach(({ el, text, delay }) => {
    const node = el.value
    if (!node) return
    node.textContent = ''
    let i = 0
    setTimeout(() => {
      const timer = setInterval(() => {
        node.textContent += text[i++]
        if (i >= text.length) clearInterval(timer)
      }, 18)
    }, delay)
  })
})
</script>
