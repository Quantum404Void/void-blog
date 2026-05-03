<template>
  <div class="min-h-screen bg-[var(--color-void)] flex flex-col">
    <nav class="sticky top-0 z-50 border-b border-[var(--color-void-border)] bg-[rgba(10,10,15,0.85)] backdrop-blur-xl">
      <div class="max-w-5xl mx-auto px-6 h-14 flex items-center gap-4">
        <NuxtLink href="/" class="font-mono text-sm text-[var(--color-neon-green)] hover:glow-green">~/void-blog</NuxtLink>
        <span class="text-[var(--color-text-muted)]">/</span>
        <NuxtLink href="/lab" class="font-mono text-xs text-[var(--color-neon-cyan)]">lab</NuxtLink>
        <span class="text-[var(--color-text-muted)]">/</span>
        <span class="font-mono text-xs" style="color:#ffa500">2048</span>
      </div>
    </nav>
    <div class="flex-1 flex items-center justify-center p-4">
      <Game2048 />
    </div>
  </div>
</template>
<script setup lang="ts">
useSeoMeta({ title: '2048 | void.dev' })
</script>
