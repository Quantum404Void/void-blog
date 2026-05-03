<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <nav class="sticky top-0 z-50 border-b border-[var(--color-void-border)] bg-[rgba(10,10,15,0.85)] backdrop-blur-xl">
      <div class="max-w-3xl mx-auto px-6 h-14 flex items-center gap-4 font-mono text-xs">
        <NuxtLink to="/lab" class="text-[var(--color-neon-green)]">~/lab</NuxtLink><span>/</span>
        <NuxtLink to="/lab" class="text-[var(--color-neon-cyan)] hover:opacity-80 transition-opacity">tools</NuxtLink><span>/</span>
        <span class="text-[var(--color-neon-green)]">uuid</span>
      </div>
    </nav>
    <div class="max-w-3xl mx-auto px-6 py-10">
      <h1 class="font-mono text-xl font-bold text-[var(--color-neon-green)] mb-1">🆔 UUID 生成器</h1>
      <p class="font-mono text-xs text-[var(--color-text-muted)] mb-6">批量生成 v4 UUID，一键复制</p>

      <div class="flex flex-wrap gap-3 mb-6">
        <button
          v-for="n in [1, 5, 10, 20]"
          :key="n"
          @click="generate(n)"
          class="font-mono text-xs px-4 py-2 rounded-lg border transition-all hover:translate-y-[-1px]"
          style="border-color:rgba(0,255,136,0.4);color:#00ff88;background:rgba(0,255,136,0.06)"
        >生成 {{ n }} 个</button>
        <button
          v-if="uuids.length > 0"
          @click="copyAll"
          class="font-mono text-xs px-4 py-2 rounded-lg border transition-all ml-auto"
          :style="copiedAll ? 'border-color:rgba(0,255,136,0.8);color:#00ff88;background:rgba(0,255,136,0.15)' : 'border-color:rgba(0,212,255,0.4);color:#00d4ff;background:rgba(0,212,255,0.06)'"
        >{{ copiedAll ? '✓ 已复制全部' : '复制全部' }}</button>
      </div>

      <div v-if="uuids.length > 0" class="rounded-xl border border-[var(--color-void-border)] overflow-hidden bg-[var(--color-void-card)]">
        <div class="px-4 py-2 font-mono text-[10px] text-[var(--color-text-muted)] border-b border-[var(--color-void-border)] flex items-center justify-between">
          <span>共 {{ uuids.length }} 个 UUID v4</span>
          <button @click="clear" class="text-[rgba(255,0,170,0.6)] hover:text-[rgba(255,0,170,0.9)] transition-colors">清空</button>
        </div>
        <div
          v-for="(uuid, i) in uuids"
          :key="i"
          class="flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-void-border)] last:border-0 group hover:bg-[rgba(255,255,255,0.02)] transition-colors"
        >
          <div class="flex items-center gap-3">
            <span class="font-mono text-[10px] text-[var(--color-text-muted)] w-5 text-right select-none">{{ i + 1 }}</span>
            <span class="font-mono text-sm tracking-wider" style="color:#00ff88">{{ uuid }}</span>
          </div>
          <button
            @click="copySingle(uuid, i)"
            class="font-mono text-[10px] px-2.5 py-1 rounded border opacity-0 group-hover:opacity-100 transition-all"
            :style="copiedIdx === i ? 'border-color:rgba(0,255,136,0.6);color:#00ff88;opacity:1' : 'border-color:rgba(0,212,255,0.3);color:rgba(0,212,255,0.7)'"
          >{{ copiedIdx === i ? '✓' : '复制' }}</button>
        </div>
      </div>

      <div v-else class="mt-10 text-center font-mono text-xs text-[var(--color-text-muted)]">
        点击上方按钮生成 UUID
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'UUID 生成器 | void.dev' })

const uuids = ref<string[]>([])
const copiedAll = ref(false)
const copiedIdx = ref<number | null>(null)

function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

function generate(n: number) {
  uuids.value = Array.from({ length: n }, uuidv4)
  copiedAll.value = false
  copiedIdx.value = null
}

async function copyAll() {
  await navigator.clipboard.writeText(uuids.value.join('\n'))
  copiedAll.value = true
  setTimeout(() => (copiedAll.value = false), 2000)
}

async function copySingle(uuid: string, idx: number) {
  await navigator.clipboard.writeText(uuid)
  copiedIdx.value = idx
  setTimeout(() => (copiedIdx.value = null), 1500)
}

function clear() {
  uuids.value = []
  copiedAll.value = false
  copiedIdx.value = null
}
</script>
