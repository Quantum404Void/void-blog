<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `正则工具 | ${siteName}` })

const pattern = shallowRef('(?:Nuxt|Vue)')
const flags = shallowRef('gi')
const testString = shallowRef('Nuxt 基于 Vue 构建，Vue 负责组件模型。')
const errorMessage = shallowRef('')
const matches = shallowRef<string[][]>([])
const highlighted = shallowRef('')

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character)
}

watchEffect(() => {
  errorMessage.value = ''
  matches.value = []
  highlighted.value = ''
  if (!pattern.value || !testString.value) return

  try {
    const normalizedFlags = flags.value.includes('g') ? flags.value : `${flags.value}g`
    const expression = new RegExp(pattern.value, normalizedFlags)
    matches.value = [...testString.value.matchAll(expression)].map(match => Array.from(match))

    let cursor = 0
    const parts: string[] = []
    for (const match of testString.value.matchAll(new RegExp(pattern.value, normalizedFlags))) {
      const index = match.index ?? 0
      parts.push(escapeHtml(testString.value.slice(cursor, index)))
      parts.push(`<mark class="regex-match">${escapeHtml(match[0])}</mark>`)
      cursor = index + match[0].length
    }
    parts.push(escapeHtml(testString.value.slice(cursor)))
    highlighted.value = parts.join('')
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '正则表达式无效'
  }
})
</script>

<template>
  <LabLayout title="正则测试器" desc="实时测试表达式、检查捕获组，并在原始文本中查看匹配位置。" accent="var(--color-neon-cyan)">
    <div class="space-y-6">
      <section class="tool-panel">
        <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
          <div>
            <label for="regex-pattern" class="tool-label">正则表达式</label>
            <div class="flex items-center gap-2">
              <span aria-hidden="true" class="font-mono text-[var(--color-neon-cyan)]">/</span>
              <input id="regex-pattern" v-model="pattern" class="tool-field text-[var(--color-neon-cyan)]" placeholder="(?:Nuxt|Vue)">
              <span aria-hidden="true" class="font-mono text-[var(--color-neon-cyan)]">/</span>
            </div>
          </div>
          <div>
            <label for="regex-flags" class="tool-label">Flags</label>
            <input id="regex-flags" v-model="flags" class="tool-field text-[var(--color-neon-purple)]" placeholder="gi">
          </div>
        </div>
        <div class="mt-5">
          <label for="regex-text" class="tool-label">测试文本</label>
          <textarea id="regex-text" v-model="testString" class="tool-field tool-textarea min-h-40" placeholder="输入要匹配的文本..." />
        </div>
      </section>

      <div v-if="errorMessage" class="tool-status text-[var(--color-neon-pink)]" role="alert">! {{ errorMessage }}</div>

      <section v-else class="grid gap-6 lg:grid-cols-2">
        <div class="tool-panel">
          <h2 class="font-mono text-sm font-semibold text-[var(--color-text-primary)]">高亮预览</h2>
          <p class="tool-help mt-1 mb-4">共 {{ matches.length }} 个匹配结果</p>
          <div v-if="highlighted" class="break-words whitespace-pre-wrap font-mono text-sm leading-7 text-[var(--color-text-secondary)]" v-html="highlighted" />
          <p v-else class="tool-help">输入表达式与测试文本后显示结果。</p>
        </div>
        <div class="tool-panel">
          <h2 class="font-mono text-sm font-semibold text-[var(--color-text-primary)]">匹配与捕获组</h2>
          <div v-if="matches.length" class="mt-4 space-y-2">
            <div v-for="(match, index) in matches" :key="`${index}-${match[0]}`" class="rounded-lg border border-[var(--color-void-border)] p-3 font-mono text-xs">
              <span class="mr-2 text-[var(--color-text-muted)]">{{ index + 1 }}.</span>
              <span class="text-[var(--color-neon-cyan)]">{{ match[0] }}</span>
              <span v-if="match.length > 1" class="ml-2 text-[var(--color-text-muted)]">groups: {{ match.slice(1).join(', ') || '—' }}</span>
            </div>
          </div>
          <p v-else class="tool-help mt-4">当前没有匹配。</p>
        </div>
      </section>
    </div>
  </LabLayout>
</template>

<style scoped>
:deep(.regex-match) {
  border-radius: 0.2rem;
  background: rgba(0, 212, 255, 0.18);
  color: var(--color-neon-cyan);
  padding: 0.08rem 0.2rem;
}
</style>
