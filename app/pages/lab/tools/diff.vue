<script setup lang="ts">
import { diffChars, diffLines, diffWords } from 'diff'

type DiffMode = 'lines' | 'words' | 'chars'

const { siteName } = useSiteConfig()
useSeoMeta({ title: `Diff 工具 | ${siteName}` })

const original = shallowRef('const runtime = "node"\nconst fast = false\n')
const revised = shallowRef('const runtime = "bun"\nconst fast = true\n')
const mode = shallowRef<DiffMode>('lines')
const modes: Array<{ value: DiffMode; label: string }> = [
  { value: 'lines', label: '按行' },
  { value: 'words', label: '按词' },
  { value: 'chars', label: '按字符' },
]

const parts = computed(() => {
  if (!original.value && !revised.value) return []
  if (mode.value === 'lines') return diffLines(original.value, revised.value)
  if (mode.value === 'words') return diffWords(original.value, revised.value)
  return diffChars(original.value, revised.value)
})

const stats = computed(() => parts.value.reduce((summary, part) => ({
  added: summary.added + (part.added ? part.count ?? 1 : 0),
  removed: summary.removed + (part.removed ? part.count ?? 1 : 0),
}), { added: 0, removed: 0 }))
</script>

<template>
  <LabLayout title="文本 Diff" desc="按行、单词或字符比较两段文本，适合检查配置与代码片段。">
    <div class="mb-5 tool-tabs" role="tablist" aria-label="比较粒度">
      <button v-for="item in modes" :key="item.value" class="tool-tab" role="tab" :aria-selected="mode === item.value" @click="mode = item.value">{{ item.label }}</button>
    </div>

    <div class="grid gap-5 lg:grid-cols-2">
      <div>
        <label for="diff-original" class="tool-label">原始文本</label>
        <textarea id="diff-original" v-model="original" class="tool-field tool-textarea min-h-64" spellcheck="false" />
      </div>
      <div>
        <label for="diff-revised" class="tool-label">新文本</label>
        <textarea id="diff-revised" v-model="revised" class="tool-field tool-textarea min-h-64" spellcheck="false" />
      </div>
    </div>

    <section v-if="parts.length" class="mt-6">
      <div class="mb-3 flex gap-4 font-mono text-xs" aria-live="polite">
        <span class="text-[var(--color-neon-green)]">+{{ stats.added }}</span>
        <span class="text-[var(--color-neon-pink)]">-{{ stats.removed }}</span>
      </div>
      <div class="overflow-x-auto rounded-xl border border-[var(--color-void-border)] bg-[var(--color-void-card)]">
        <div v-if="mode === 'lines'" class="min-w-[36rem] py-2">
          <div v-for="(part, index) in parts" :key="index" class="flex gap-3 px-4 py-1.5 font-mono text-xs" :class="part.added ? 'bg-[rgba(0,255,136,0.07)] text-[var(--color-neon-green)]' : part.removed ? 'bg-[rgba(255,45,120,0.07)] text-[var(--color-neon-pink)]' : 'text-[var(--color-text-muted)]'">
            <span class="w-3 shrink-0">{{ part.added ? '+' : part.removed ? '-' : ' ' }}</span>
            <span class="whitespace-pre-wrap">{{ part.value }}</span>
          </div>
        </div>
        <div v-else class="p-4 font-mono text-sm leading-7">
          <span v-for="(part, index) in parts" :key="index" :class="part.added ? 'rounded bg-[rgba(0,255,136,0.1)] text-[var(--color-neon-green)]' : part.removed ? 'rounded bg-[rgba(255,45,120,0.1)] text-[var(--color-neon-pink)] line-through' : 'text-[var(--color-text-secondary)]'">{{ part.value }}</span>
        </div>
      </div>
    </section>
  </LabLayout>
</template>
