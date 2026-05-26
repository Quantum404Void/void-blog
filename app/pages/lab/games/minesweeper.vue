<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'games', href: '/lab' }, { label: 'minesweeper' }]" />
    <div class="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <Minesweeper />
    </div>
    <AppFooter />
  </div>
</template>
<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `Minesweeper | ${siteName}` })
</script>
