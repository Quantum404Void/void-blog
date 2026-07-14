<script setup lang="ts">
defineProps<{ title?: string; compact?: boolean }>()
</script>

<template>
  <section class="xuanwei-panel" :class="{ 'xuanwei-panel-compact': compact }">
    <header v-if="title"><h3>{{ title }}</h3></header>
    <div class="xuanwei-panel-body"><slot /></div>
  </section>
</template>

<style scoped>
.xuanwei-panel { border: 1px solid var(--color-void-border); border-radius: .75rem; background: var(--color-void-card); }
.xuanwei-panel > header { padding: .8rem 1rem; border-bottom: 1px solid var(--color-void-border); }
.xuanwei-panel h3 { margin: 0; color: var(--color-text-primary); font-family: var(--xw-serif); font-size: .9rem; letter-spacing: .03em; }
.xuanwei-panel-body { padding: 1rem; }
.xuanwei-panel-compact .xuanwei-panel-body { padding: .75rem; }
</style>
