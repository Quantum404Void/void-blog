<template>
  <nav class="sticky top-0 z-50 border-b border-[var(--color-void-border)]" style="background:rgba(5,5,12,0.9);backdrop-filter:blur(16px) saturate(180%)">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-2 sm:gap-3">
      <!-- Logo -->
      <NuxtLink href="/" class="font-mono font-bold text-[var(--color-neon-green)] glow-green text-sm tracking-widest shrink-0 cursor-blink">
        {{ siteName }}
      </NuxtLink>

      <!-- 面包屑 -->
      <div v-if="crumbs.length" class="hidden lg:flex items-center gap-2 min-w-0">
        <template v-for="(crumb, i) in crumbs" :key="i">
          <span class="text-[var(--color-void-muted)] font-mono text-xs shrink-0">/</span>
          <NuxtLink v-if="crumb.href" :href="crumb.href"
            class="font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)] transition-colors truncate max-w-[160px]">
            {{ crumb.label }}
          </NuxtLink>
          <span v-else class="font-mono text-xs text-[var(--color-text-muted)] truncate max-w-[160px]">
            {{ crumb.label }}
          </span>
        </template>
      </div>

      <!-- 右侧固定导航 -->
      <div class="ml-auto flex items-center gap-4 sm:gap-5 font-mono text-xs text-[var(--color-text-muted)] shrink-0">
        <NuxtLink v-for="link in navLinks" :key="link.href" :href="link.href"
          class="hidden sm:block transition-colors relative pb-0.5"
          :class="isActive(link.href)
            ? link.activeClass
            : 'hover:text-[var(--color-neon-cyan)]'"
          :style="link.style">
          {{ link.label }}
          <!-- 活跃状态荧光下划线 -->
          <span v-if="isActive(link.href)"
            class="absolute bottom-[-3px] left-0 w-full h-[2px] rounded-full"
            :style="`background:${link.glowColor};box-shadow:0 0 6px ${link.glowColor}`">
          </span>
        </NuxtLink>
        <span class="hidden lg:block font-mono text-[9px] text-[var(--color-void-muted)] select-none">v1.0</span>
        <ClientOnly>
          <span class="font-mono text-[10px] text-[var(--color-text-muted)] tabular-nums hidden sm:block select-none">{{ currentTime }}</span>
        </ClientOnly>
        <!-- 移动端 hamburger -->
        <button
          class="sm:hidden flex flex-col gap-1 -mr-1 p-2 rounded-md border border-transparent hover:border-[var(--color-void-border)] transition-colors"
          @click="mobileOpen = !mobileOpen"
          aria-label="Toggle menu"
        >
          <span class="block w-4 h-0.5 transition-all" :class="mobileOpen ? 'rotate-45 translate-y-1.5 bg-[var(--color-neon-cyan)]' : 'bg-[var(--color-text-muted)]'"></span>
          <span class="block w-4 h-0.5 transition-all" :class="mobileOpen ? 'opacity-0' : 'bg-[var(--color-text-muted)]'"></span>
          <span class="block w-4 h-0.5 transition-all" :class="mobileOpen ? '-rotate-45 -translate-y-1.5 bg-[var(--color-neon-cyan)]' : 'bg-[var(--color-text-muted)]'"></span>
        </button>
      </div>
    </div>

    <!-- 移动端下拉菜单 -->
    <Transition
      enter-active-class="transition-all duration-200"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div v-if="mobileOpen" class="sm:hidden border-t border-[var(--color-void-border)] px-4 py-3 flex flex-col gap-2" style="background:rgba(5,5,12,0.95)">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.href"
          :href="link.href"
          class="font-mono text-xs py-2 transition-colors"
          :class="isActive(link.href) ? link.activeClass : 'text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)]'"
          :style="link.style"
          @click="mobileOpen = false"
        >
          {{ link.label }}
        </NuxtLink>
        <div class="pt-2 border-t border-[var(--color-void-border)] mt-1">
          <span class="font-mono text-[9px] text-[var(--color-text-muted)] opacity-40">/ → search  ? → help</span>
        </div>
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
  { href: '/tags',   label: '~/tags',   activeClass: 'text-[var(--color-neon-cyan)]',   style: '', glowColor: 'var(--color-neon-cyan)' },
  { href: '/search', label: '~/search', activeClass: 'text-[var(--color-neon-cyan)]',   style: '', glowColor: 'var(--color-neon-cyan)' },
  { href: '/about',  label: '~/about',  activeClass: 'text-[var(--color-neon-cyan)]',   style: '', glowColor: 'var(--color-neon-cyan)' },
  { href: '/stats',  label: '~/stats',  activeClass: 'text-[var(--color-neon-cyan)]',   style: '', glowColor: 'var(--color-neon-cyan)' },
  { href: '/lab',    label: '~/lab',    activeClass: 'text-[var(--color-neon-purple)]', style: 'color:rgba(180,0,255,0.75)', glowColor: 'var(--color-neon-purple)' },
]

function isActive(href: string) {
  return route.path === href || route.path.startsWith(href + '/')
}

const currentTime = ref('')
let _clockTimer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  const update = () => {
    currentTime.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  }
  update()
  _clockTimer = setInterval(update, 1000)
})
onUnmounted(() => {
  if (_clockTimer) clearInterval(_clockTimer)
})
</script>
