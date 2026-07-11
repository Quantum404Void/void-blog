<template>
  <div class="h-14" aria-hidden="true"></div>
  <nav aria-label="主导航" class="fixed inset-x-0 top-0 z-50 border-b border-[var(--color-void-border)]" style="background:rgba(5,5,12,0.96);backdrop-filter:blur(10px)">
    <div class="layout-shell layout-content h-14">
    <div class="h-full flex items-center justify-between gap-3 min-w-0">

      <!-- 左侧：Logo + 面包屑 -->
      <div class="flex items-center gap-2 min-w-0 overflow-hidden">
        <NuxtLink href="/" class="flex min-h-11 items-center gap-1.5 shrink-0 group" aria-label="返回首页">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="transition-opacity group-hover:opacity-80 shrink-0">
            <rect width="24" height="24" rx="5" fill="#0a0a0f"/>
            <path d="M5 6 L12 18 L19 6" stroke="#00ff88" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          </svg>
          <span class="font-mono font-bold text-[var(--color-neon-green)] glow-green text-sm tracking-widest">{{ siteName }}</span>
        </NuxtLink>
        <template v-if="crumbs.length" v-for="(crumb, i) in crumbs" :key="i">
          <span class="text-[var(--color-void-muted)] font-mono text-xs shrink-0 hidden lg:inline">/</span>
          <NuxtLink v-if="crumb.href" :href="crumb.href"
            class="hidden lg:inline font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)] transition-colors truncate max-w-[160px]">
            {{ crumb.label }}
          </NuxtLink>
          <span v-else class="hidden lg:inline font-mono text-xs text-[var(--color-text-muted)] truncate max-w-[160px]">
            {{ crumb.label }}
          </span>
        </template>
      </div>

      <!-- 右侧：导航链接 + 时钟 -->
      <div class="flex items-center gap-4 sm:gap-5 font-mono text-xs text-[var(--color-text-muted)] shrink-0">
        <NuxtLink v-for="link in navLinks" :key="link.href" :href="link.href"
          class="hidden sm:block transition-colors relative pb-0.5"
          :class="isActive(link.href) ? link.activeClass : 'hover:text-[var(--color-neon-cyan)]'"
          :style="link.style">
          {{ link.label }}
          <span v-if="isActive(link.href)"
            class="absolute bottom-[-3px] left-0 w-full h-[2px] rounded-full"
            :style="`background:${link.glowColor};box-shadow:0 0 6px ${link.glowColor}`">
          </span>
        </NuxtLink>
        <!-- 时钟已移除 -->
        <!-- 移动端 hamburger -->
        <button
          class="sm:hidden flex size-11 flex-col items-center justify-center gap-1 -mr-1 rounded-md border border-transparent hover:border-[var(--color-void-border)] transition-colors"
          @click="mobileOpen = !mobileOpen"
          aria-label="切换导航菜单"
          :aria-expanded="mobileOpen"
          aria-controls="mobile-navigation"
        >
          <span class="block w-4 h-0.5 transition-all" :class="mobileOpen ? 'rotate-45 translate-y-1.5 bg-[var(--color-neon-cyan)]' : 'bg-[var(--color-text-muted)]'"></span>
          <span class="block w-4 h-0.5 transition-all" :class="mobileOpen ? 'opacity-0' : 'bg-[var(--color-text-muted)]'"></span>
          <span class="block w-4 h-0.5 transition-all" :class="mobileOpen ? '-rotate-45 -translate-y-1.5 bg-[var(--color-neon-cyan)]' : 'bg-[var(--color-text-muted)]'"></span>
        </button>
      </div>
    </div>
    </div>

    <Transition
      enter-active-class="transition-all duration-200"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div id="mobile-navigation" v-if="mobileOpen" class="sm:hidden border-t border-[var(--color-void-border)] px-4 py-2 flex flex-col" style="background:rgba(5,5,12,0.98)">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.href"
          :href="link.href"
          class="font-mono text-sm min-h-11 flex items-center transition-colors"
          :class="isActive(link.href) ? link.activeClass : 'text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)]'"
          :style="link.style"
          @click="mobileOpen = false"
        >
          {{ link.label }}
        </NuxtLink>
      </div>
    </Transition>
  </nav>
</template>

<script setup lang="ts">
defineOptions({ name: 'AppNav' })

const { siteName } = useSiteConfig()
const route = useRoute()

const mobileOpen = ref(false)

watch(() => route.path, () => {
  mobileOpen.value = false
})

const props = withDefaults(defineProps<{
  crumbs?: { label: string; href?: string }[]
}>(), { crumbs: () => [] })

const navLinks = [
  { href: '/blog',   label: '~/blog',   activeClass: 'text-[var(--color-neon-cyan)]',   style: '', glowColor: 'var(--color-neon-cyan)' },
  { href: '/explore', label: '~/explore', activeClass: 'text-[var(--color-neon-cyan)]', style: '', glowColor: 'var(--color-neon-cyan)' },
  { href: '/about',   label: '~/about',   activeClass: 'text-[var(--color-neon-cyan)]', style: '', glowColor: 'var(--color-neon-cyan)' },
  { href: '/lab',    label: '~/lab',    activeClass: 'text-[var(--color-neon-purple)]', style: 'color:rgba(180,0,255,0.75)', glowColor: 'var(--color-neon-purple)' },
]

function isActive(href: string) {
  // /explore 也高亮原先独立的 /tags /search /stats 路径
  if (href === '/explore' && ['/tags', '/search', '/stats'].some(p => route.path === p || route.path.startsWith(p + '/')))
    return true
  return route.path === href || route.path.startsWith(href + '/')
}

</script>
