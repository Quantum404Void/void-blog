<template>
  <nav class="sticky top-0 z-50 border-b border-[var(--color-void-border)] nav-glass">
    <div class="max-w-5xl mx-auto px-6 h-14 flex items-center gap-2">
      <!-- Logo -->
      <NuxtLink href="/" class="font-mono font-bold text-[var(--color-neon-green)] glow-green text-sm tracking-widest shrink-0">
        {{ siteName }}
      </NuxtLink>

      <!-- 面包屑 -->
      <template v-if="crumbs.length">
        <template v-for="(crumb, i) in crumbs" :key="i">
          <span class="text-[var(--color-void-muted)] font-mono text-xs">/</span>
          <NuxtLink v-if="crumb.href" :href="crumb.href"
            class="font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)] transition-colors truncate max-w-[200px]">
            {{ crumb.label }}
          </NuxtLink>
          <span v-else class="font-mono text-xs text-[var(--color-text-muted)] truncate max-w-[200px]">
            {{ crumb.label }}
          </span>
        </template>
      </template>

      <!-- 右侧固定导航 -->
      <div class="ml-auto flex items-center gap-5 font-mono text-xs text-[var(--color-text-muted)] shrink-0">
        <NuxtLink v-for="link in navLinks" :key="link.href" :href="link.href"
          class="hidden sm:block transition-colors"
          :class="isActive(link.href)
            ? link.activeClass
            : 'hover:text-[var(--color-neon-cyan)]'"
          :style="link.style">
          {{ link.label }}
        </NuxtLink>
        <!-- 移动端只显示 search -->
        <NuxtLink href="/search" class="sm:hidden hover:text-[var(--color-neon-cyan)] transition-colors flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </NuxtLink>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
const { siteName } = useSiteConfig()
const route = useRoute()

const props = withDefaults(defineProps<{
  crumbs?: { label: string; href?: string }[]
}>(), { crumbs: () => [] })

const navLinks = [
  { href: '/blog',       label: '~/blog',   activeClass: 'text-[var(--color-neon-cyan)]',   style: '' },
  { href: '/tags',       label: '~/tags',   activeClass: 'text-[var(--color-neon-cyan)]',   style: '' },
  { href: '/search',     label: '~/search', activeClass: 'text-[var(--color-neon-cyan)]',   style: '' },
  { href: '/stats',      label: '~/stats',  activeClass: 'text-[var(--color-neon-cyan)]',   style: '' },
  { href: '/lab',        label: '~/lab',    activeClass: 'text-[var(--color-neon-purple)]', style: 'color:rgba(180,0,255,0.75)' },
]

function isActive(href: string) {
  return route.path === href || route.path.startsWith(href + '/')
}
</script>
