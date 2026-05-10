<template>
  <footer class="border-t border-[var(--color-void-border)] py-8 mt-auto">
    <div :class="maxW" class="mx-auto px-6 flex items-center justify-between flex-wrap gap-4 font-mono text-xs text-[var(--color-text-muted)]">
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
