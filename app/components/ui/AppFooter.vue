<template>
  <footer class="border-t border-[var(--color-void-border)] mt-auto" style="background:rgba(6,6,14,0.6)">
    <div :class="maxW" class="mx-auto px-4 sm:px-6 py-8">
      <div class="mb-6 h-px bg-gradient-to-r from-transparent via-[var(--color-void-border)] to-transparent"></div>
      <!-- nav links -->
      <div class="flex flex-wrap items-center justify-center gap-x-5 mb-4">
        <NuxtLink href="/" class="font-mono text-xs min-h-11 flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-neon-green)] transition-colors">~/home</NuxtLink>
        <NuxtLink href="/blog" class="font-mono text-xs min-h-11 flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)] transition-colors">~/blog</NuxtLink>
        <NuxtLink href="/explore" class="font-mono text-xs min-h-11 flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)] transition-colors">~/explore</NuxtLink>
        <NuxtLink href="/about" class="font-mono text-xs min-h-11 flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)] transition-colors">~/about</NuxtLink>
      </div>
      <!-- back link slot -->
      <div v-if="backHref" class="flex justify-center mb-5">
        <NuxtLink :href="backHref" class="font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-neon-green)] transition-colors flex items-center gap-1.5">
          <span class="text-[var(--color-neon-green)] opacity-60">←</span> {{ backLabel }}
        </NuxtLink>
      </div>
      <slot />
      <!-- bottom -->
      <div class="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-[var(--color-text-muted)] opacity-70 select-none">
        <span>CC BY-NC 4.0 &copy; {{ new Date().getFullYear() }} Void</span>
        <span class="tabular-nums">nuxt4 · cf-pages · d1</span>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
defineOptions({ name: 'AppFooter' })

const { buildHash } = useRuntimeConfig().public as any

withDefaults(defineProps<{
  backHref?: string
  backLabel?: string
  maxW?: string
}>(), {
  backHref: '/',
  backLabel: '返回首页',
  maxW: 'max-w-2xl',
})
</script>
