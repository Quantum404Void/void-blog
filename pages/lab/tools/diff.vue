<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'tools', href: '/lab' }, { label: 'diff' }]" />
    <div class="max-w-5xl mx-auto px-6 py-10 space-y-4">
      <h1 class="font-mono text-xl font-bold text-[var(--color-neon-cyan)] mb-6">Diff 工具</h1>

      <!-- 模式切换 -->
      <div class="flex gap-2 mb-2">
        <button v-for="m in modes" :key="m.value"
          @click="mode = m.value"
          class="font-mono text-[10px] px-3 py-1 rounded-full border transition-all"
          :class="mode === m.value
            ? 'border-[rgba(0,212,255,0.5)] text-[var(--color-neon-cyan)] bg-[rgba(0,212,255,0.08)]'
            : 'border-[var(--color-void-border)] text-[var(--color-text-muted)]'"
        >{{ m.label }}</button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-2 block">原始文本</label>
          <textarea v-model="a" class="w-full font-mono text-sm rounded-xl border border-[var(--color-void-border)] p-4 resize-none bg-[var(--color-void-card)] text-[var(--color-text-primary)] outline-none focus:border-[rgba(0,212,255,0.4)] transition-colors" style="height:220px"></textarea>
        </div>
        <div>
          <label class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-2 block">新文本</label>
          <textarea v-model="b" class="w-full font-mono text-sm rounded-xl border border-[var(--color-void-border)] p-4 resize-none bg-[var(--color-void-card)] text-[var(--color-text-primary)] outline-none focus:border-[rgba(0,212,255,0.4)] transition-colors" style="height:220px"></textarea>
        </div>
      </div>

      <!-- 统计 -->
      <div v-if="stats" class="flex gap-4 font-mono text-xs text-[var(--color-text-muted)]">
        <span class="text-[var(--color-neon-green)]">+{{ stats.added }}</span>
        <span class="text-[var(--color-neon-pink)]">-{{ stats.removed }}</span>
        <span>{{ stats.total }} {{ mode === 'words' ? '词' : '行' }}</span>
      </div>

      <!-- 结果 -->
      <div v-if="parts.length" class="border border-[var(--color-void-border)] rounded-xl overflow-hidden">
        <template v-if="mode === 'lines'">
          <div v-for="(p,i) in parts" :key="i"
            class="font-mono text-xs px-4 py-1.5 flex gap-3"
            :class="p.added ? 'text-[var(--color-neon-green)]' : p.removed ? 'text-[var(--color-neon-pink)]' : 'text-[rgba(232,232,240,0.45)]'"
            :style="p.added ? 'background:rgba(0,255,136,0.07)' : p.removed ? 'background:rgba(255,45,120,0.07)' : ''"
          >
            <span class="w-4 shrink-0 opacity-70">{{ p.added ? '+' : p.removed ? '-' : ' ' }}</span>
            <span class="whitespace-pre-wrap break-all">{{ p.value }}</span>
          </div>
        </template>
        <template v-else>
          <!-- word/char diff: inline rendering -->
          <div class="font-mono text-sm p-4 leading-relaxed break-words">
            <span v-for="(p,i) in parts" :key="i"
              :class="p.added ? 'text-[var(--color-neon-green)] bg-[rgba(0,255,136,0.1)] rounded px-0.5' : p.removed ? 'text-[var(--color-neon-pink)] bg-[rgba(255,45,120,0.1)] rounded px-0.5 line-through' : 'text-[var(--color-text-secondary)]'"
            >{{ p.value }}</span>
          </div>
        </template>
      </div>

      <div v-else-if="a || b" class="font-mono text-xs text-[var(--color-text-muted)] px-4 py-3 border border-[var(--color-void-border)] rounded-xl">
        两段文本相同 ✓
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { diffLines, diffWords, diffChars } from 'diff'

const { siteName } = useSiteConfig()
useSeoMeta({ title: `Diff 工具 | ${siteName}` })

const a = ref('')
const b = ref('')
const mode = ref<'lines'|'words'|'chars'>('lines')

const modes = [
  { value: 'lines', label: '按行' },
  { value: 'words', label: '按词' },
  { value: 'chars', label: '按字符' },
]

const parts = computed(() => {
  if (!a.value && !b.value) return []
  if (mode.value === 'lines')  return diffLines(a.value, b.value)
  if (mode.value === 'words')  return diffWords(a.value, b.value)
  return diffChars(a.value, b.value)
})

const stats = computed(() => {
  if (!parts.value.length) return null
  let added = 0, removed = 0
  for (const p of parts.value) {
    if (p.added)   added   += p.count ?? 1
    if (p.removed) removed += p.count ?? 1
  }
  return { added, removed, total: parts.value.length }
})
</script>
