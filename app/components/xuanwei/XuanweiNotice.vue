<script setup lang="ts">
withDefaults(defineProps<{ tone?: 'info' | 'warning' }>(), { tone: 'info' })
</script>

<template><p class="xuanwei-notice" :class="`xuanwei-notice-${tone}`"><slot /></p></template>

<style scoped>
.xuanwei-notice { margin: 0; padding: .75rem .9rem; border: 1px solid var(--color-void-border); border-radius: .6rem; color: var(--color-text-secondary); background: var(--color-void-muted); font-size: .75rem; line-height: 1.7; }
.xuanwei-notice-warning { border-color: rgb(255 200 0 / 25%); color: #ffc800; background: rgb(255 200 0 / 6%); }
</style>
