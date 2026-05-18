<template>
  <footer class="border-t border-[var(--color-void-border)] mt-auto" style="background:rgba(6,6,14,0.6)">
    <div :class="maxW" class="mx-auto px-4 sm:px-6 py-6">
      <!-- top row -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 font-mono text-xs text-[var(--color-text-muted)]">
        <NuxtLink v-if="backHref" :href="backHref" class="hover:text-[var(--color-neon-green)] transition-colors flex items-center gap-1.5">
          <span class="text-[var(--color-neon-green)] opacity-60">←</span> {{ backLabel }}
        </NuxtLink>
        <slot />
      </div>
      <!-- bottom divider + sys info -->
      <div class="mt-4 pt-4 border-t border-[var(--color-void-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-mono text-[10px] text-[var(--color-text-muted)] opacity-40">
        <span class="select-none tracking-widest">░▒▓█ void.dev █▓▒░</span>
        <span class="tabular-nums select-none">uptime: ∞ · kernel: nuxt@3 · shell: cf-pages</span>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  backHref?: string
  backLabel?: string
  maxW?: string
}>(), {
  backHref: '/',
  backLabel: '返回首页',
  maxW: 'max-w-3xl',
})
</script>
