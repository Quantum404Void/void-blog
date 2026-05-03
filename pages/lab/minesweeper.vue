<template>
  <div class="min-h-screen bg-[var(--color-void)] flex flex-col">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'minesweeper' }]" />
    <div class="flex-1 flex items-center justify-center p-4">
      <Minesweeper />
    </div>
  </div>
</template>
<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `Minesweeper | ${siteName}` })
</script>
