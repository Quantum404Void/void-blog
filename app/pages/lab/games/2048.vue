<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'games', href: '/lab' }, { label: '2048' }]" />
    <div class="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <Game2048 />
    </div>
    <AppFooter />
  </div>
</template>
<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `2048 | ${siteName}` })
</script>
