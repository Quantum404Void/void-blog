<template>
  <footer class="border-t border-[var(--color-void-border)] py-8 mt-auto">
    <div :class="maxW" class="mx-auto px-4 sm:px-6 flex flex-col items-start gap-3 text-left sm:flex-row sm:items-center sm:justify-between sm:text-left font-mono text-xs text-[var(--color-text-muted)]">
      <NuxtLink v-if="backHref" :href="backHref" class="hover:text-[var(--color-neon-green)] transition-colors">
        ← {{ backLabel }}
      </NuxtLink>
      <slot />
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
