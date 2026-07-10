<template>
  <div class="min-h-screen bg-[var(--color-void)] overflow-x-hidden">
    <AppNav :crumbs="[{ label: 'blog', href: '/blog' }]" />

    <main class="max-w-2xl mx-auto px-4 sm:px-6 py-14 sm:py-20" ref="mainRef">
      <!-- Header -->
      <div class="mb-12 blog-header">
        <h1 class="font-mono text-4xl font-black tracking-tight mb-3">
          <span class="text-[var(--color-neon-green)]">~/</span><span class="text-[var(--color-text-primary)]">blog</span>
        </h1>
        <p class="font-mono text-sm text-[var(--color-text-muted)]">
          {{ years.length }} 年 · <span class="text-[var(--color-text-secondary)]">{{ posts.length }}</span> 篇文章
        </p>
      </div>

      <!-- Tag filter -->
      <div class="mb-12 blog-tags">
        <div class="flex flex-wrap gap-2">
          <button
            @click="activeTag = ''"
            class="font-mono text-[11px] px-3 py-1 rounded-full border transition-all duration-200"
            :class="activeTag === ''
              ? 'border-[var(--color-neon-green)] text-[var(--color-neon-green)] bg-[rgba(0,255,136,0.08)]'
              : 'border-[var(--color-void-border)] text-[var(--color-text-muted)] hover:border-[rgba(0,255,136,0.35)] hover:text-[var(--color-neon-green)]'"
          >全部</button>
          <button
            v-for="[tag, count] in topTags"
            :key="tag"
            @click="activeTag = activeTag === tag ? '' : tag"
            class="font-mono text-[11px] px-3 py-1 rounded-full border transition-all duration-200"
            :class="activeTag === tag
              ? 'border-[rgba(0,212,255,0.6)] text-[var(--color-neon-cyan)] bg-[rgba(0,212,255,0.1)]'
              : 'border-[var(--color-void-border)] text-[var(--color-text-muted)] hover:border-[rgba(0,212,255,0.35)] hover:text-[var(--color-neon-cyan)]'"
          >#{{ tag }} <span class="opacity-40 ml-0.5">{{ count }}</span></button>
        </div>
      </div>

      <!-- Post list -->
      <div ref="listParent" class="blog-list">
        <div v-for="year in years" :key="year" class="mb-16 year-block">
          <!-- Year divider -->
          <div class="flex items-center gap-4 mb-8">
            <span class="font-mono text-xs font-bold text-[var(--color-neon-cyan)] tracking-[0.2em] uppercase">{{ year }}</span>
            <span class="flex-1 h-px bg-gradient-to-r from-[rgba(0,212,255,0.25)] to-transparent"></span>
            <span class="font-mono text-[10px] text-[var(--color-text-muted)]">{{ byYear[year].length }} 篇</span>
          </div>

          <!-- Cards — ssvex 大卡片风格 -->
          <div class="space-y-0 year-section-list">
            <NuxtLink
              v-for="post in byYear[year]"
              :key="post.slug"
              :href="`/blog/${post.slug}`"
              class="post-scroll-item group block border-b border-[var(--color-void-border)] py-8 last:border-0 transition-all duration-200 hover:border-[rgba(0,212,255,0.15)]"
            >
              <div class="flex flex-col gap-2">
                <!-- Date + tags row -->
                <div class="flex items-center gap-3">
                  <time :datetime="post.pub_date"
                        class="font-mono text-[11px] font-bold tracking-wider text-[var(--color-text-muted)] uppercase tabular-nums">
                    {{ formatFullDate(post.pub_date) }}
                  </time>
                  <span
                    v-for="tag in post.tags.slice(0, 2)" :key="tag"
                    class="font-mono text-[10px] px-2 py-0.5 rounded border border-[var(--color-void-border)] text-[var(--color-text-muted)] leading-none"
                  >#{{ tag }}</span>
                </div>

                <!-- Title -->
                <h2 class="font-mono text-xl font-bold leading-snug text-[var(--color-text-primary)] transition-colors duration-200 group-hover:text-[var(--color-neon-cyan)]"
                    :style="`--tag-color: var(--color-${getTagColor(post.tags[0] ?? 'x')})`">
                  {{ post.title }}
                </h2>

                <!-- Description -->
                <p v-if="post.description"
                   class="text-sm leading-relaxed text-[var(--color-text-muted)] line-clamp-2 group-hover:text-[var(--color-text-secondary)] transition-colors duration-200">
                  {{ post.description }}
                </p>

                <!-- Read more arrow — ssvex 风格，hover 右滑 -->
                <div class="mt-2 flex items-center gap-1 text-sm font-mono font-medium text-[var(--color-neon-cyan)] opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0 group-hover:translate-x-1">
                  阅读全文 →
                </div>
              </div>
            </NuxtLink>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="filtered.length === 0" class="py-20 text-center">
          <p class="font-mono text-[var(--color-text-muted)] mb-3">没有找到 #{{ activeTag }} 的文章</p>
          <button @click="activeTag = ''" class="font-mono text-xs text-[var(--color-neon-cyan)] hover:underline">清除过滤</button>
        </div>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import type { PostSummary } from '~/types/post'
import { useAutoAnimate } from '@formkit/auto-animate/vue'

const { siteUrl, siteName } = useSiteConfig()
useCanonical('/blog')
useSeoMeta({
  description: `${siteName} 所有技术文章列表，按年份归档，涵盖 C++、Vue3、AI Agent、Linux 等主题`,
  ogTitle: `全部文章 | ${siteName}`,
  ogDescription: '所有技术文章列表，按年份归档',
  ogUrl: `${siteUrl}/blog`,
})

const { data: postsData } = await useFetch('/api/posts', { default: () => [] as PostSummary[] })
const posts = computed(() => postsData.value || [])

const { data: tagsData } = await useFetch('/api/tags', { default: () => ({} as Record<string, number>) })
const topTags = computed(() =>
  Object.entries(tagsData.value || {}).sort((a, b) => b[1] - a[1]).slice(0, 16)
)

const activeTag = ref('')
const filtered = computed(() =>
  activeTag.value ? posts.value.filter((p: PostSummary) => p.tags.includes(activeTag.value)) : posts.value
)

const { getTagColor } = useTagColor()
const { formatMonthDay } = useFormatDate()

// 完整日期格式：Jan 17, 2026
function formatFullDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const byYear = computed(() => {
  const map: Record<string, PostSummary[]> = {}
  for (const p of filtered.value) {
    const y = p.pub_date.slice(0, 4)
    ;(map[y] = map[y] || []).push(p)
  }
  return map
})
const years = computed(() => Object.keys(byYear.value).sort((a, b) => Number(b) - Number(a)))

const [listParent] = useAutoAnimate({ duration: 200 })
const mainRef = useTemplateRef<HTMLElement>('mainRef')
const prefersReducedMotion = useReducedMotion()

onMounted(async () => {
  if (prefersReducedMotion.value) return
  const bundle = await useGsap()
  if (!bundle) return
  const { gsap, ScrollTrigger } = bundle

  // 页面头部入场
  const header = mainRef.value?.querySelector('.blog-header')
  const tags = mainRef.value?.querySelector('.blog-tags')
  gsap.fromTo([header, tags],
    { opacity: 0, y: 18 },
    { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', stagger: 0.1 }
  )

  // 每个年份块：滚动揭示
  const yearBlocks = document.querySelectorAll<HTMLElement>('.year-block')
  yearBlocks.forEach((block) => {
    const items = block.querySelectorAll<HTMLElement>('.post-scroll-item')
    const yearLabel = block.querySelector<HTMLElement>(':first-child')
    gsap.fromTo(yearLabel,
      { opacity: 0, x: -10 },
      {
        opacity: 1, x: 0, duration: 0.3, ease: 'power2.out',
        scrollTrigger: { trigger: block, start: 'top 88%', once: true },
      }
    )
    gsap.fromTo(items,
      { opacity: 0, y: 12 },
      {
        opacity: 1, y: 0, duration: 0.4, ease: 'power2.out',
        stagger: 0.07,
        scrollTrigger: { trigger: block, start: 'top 82%', once: true },
      }
    )
  })

  setTimeout(() => ScrollTrigger?.refresh?.(), 150)
})
</script>
