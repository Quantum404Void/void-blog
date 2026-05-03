<template>
  <div class="min-h-screen bg-[var(--color-void)] flex flex-col">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: '2048' }]" />
    <div class="flex-1 flex items-center justify-center p-4">
      <Game2048 />
    </div>
  </div>
</template>
<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `2048 | ${siteName}` })
</script>
