<script setup lang="ts">
import { useClipboard } from '@vueuse/core'

const { siteName } = useSiteConfig()
useSeoMeta({ title: `UUID 生成器 | ${siteName}` })

const count = shallowRef(5)
const uuids = shallowRef<string[]>([])
const copiedIndex = shallowRef<number | null>(null)
const copiedAll = shallowRef(false)
const { copy } = useClipboard()
let copiedTimer: ReturnType<typeof setTimeout> | undefined

function generate() {
  const safeCount = Math.min(100, Math.max(1, Math.trunc(count.value || 1)))
  count.value = safeCount
  uuids.value = Array.from({ length: safeCount }, () => crypto.randomUUID())
  copiedIndex.value = null
  copiedAll.value = false
}

async function copySingle(uuid: string, index: number) {
  await copy(uuid)
  copiedIndex.value = index
  copiedAll.value = false
}

async function copyAll() {
  await copy(uuids.value.join('\n'))
  copiedIndex.value = null
  copiedAll.value = true
  clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => { copiedAll.value = false }, 1500)
}

function clear() { uuids.value = []; copiedIndex.value = null; copiedAll.value = false }

onMounted(generate)
onUnmounted(() => clearTimeout(copiedTimer))
</script>

<template>
  <LabLayout title="UUID v4 生成器" desc="使用浏览器密码学随机源批量生成 UUID v4，单次最多 100 个。" accent="var(--color-neon-green)">
    <section class="tool-panel">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div class="w-full sm:max-w-40">
          <label for="uuid-count" class="tool-label">生成数量</label>
          <input id="uuid-count" v-model.number="count" type="number" min="1" max="100" class="tool-field">
        </div>
        <button class="tool-button tool-button-success" @click="generate">生成 UUID</button>
        <button class="tool-button" :disabled="!uuids.length" @click="copyAll">{{ copiedAll ? '已复制全部' : '复制全部' }}</button>
        <button class="tool-button tool-button-danger sm:ml-auto" :disabled="!uuids.length" @click="clear">清空</button>
      </div>
    </section>

    <section v-if="uuids.length" class="mt-6 overflow-hidden rounded-xl border border-[var(--color-void-border)] bg-[var(--color-void-card)]">
      <div v-for="(uuid, index) in uuids" :key="uuid" class="flex items-center gap-3 border-b border-[var(--color-void-border)] px-3 py-2 last:border-0 sm:px-4">
        <span class="w-6 shrink-0 text-right font-mono text-xs text-[var(--color-text-muted)]">{{ index + 1 }}</span>
        <code class="min-w-0 flex-1 break-all font-mono text-xs text-[var(--color-neon-green)] sm:text-sm">{{ uuid }}</code>
        <button class="tool-button shrink-0 px-3" @click="copySingle(uuid, index)">{{ copiedIndex === index ? '已复制' : '复制' }}</button>
      </div>
    </section>
  </LabLayout>
</template>
