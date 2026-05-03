<template>
  <div class="min-h-screen bg-[var(--color-void)] flex items-center justify-center px-6">
    <div class="text-center font-mono">
      <div class="text-8xl font-bold text-[var(--color-void-border)] mb-4">{{ error?.statusCode }}</div>
      <div class="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
        <span class="text-[var(--color-neon-green)]">$</span>
        {{ error?.statusCode === 404 ? 'file not found' : 'internal error' }}
      </div>
      <p class="text-sm text-[var(--color-text-muted)] mb-8">
        {{ error?.statusCode === 404 ? '这个页面不存在，或者已被移除。' : error?.message }}
      </p>
      <NuxtLink href="/" class="inline-flex items-center gap-2 font-mono text-sm text-[var(--color-neon-cyan)] border border-[rgba(0,212,255,0.3)] px-5 py-2.5 rounded-lg hover:bg-[rgba(0,212,255,0.06)] transition-all">
        ← 返回首页
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ error: { statusCode: number; message: string } | null }>()
useHead({ title: `${props.error?.statusCode ?? 'Error'} | void.dev` })
</script>
