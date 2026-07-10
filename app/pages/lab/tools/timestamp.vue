<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `时间戳工具 | ${siteName}` })

const timestampInput = shallowRef('1700000000')
const dateInput = shallowRef('')
const timestampResult = shallowRef('')
const dateResult = shallowRef('')
const now = shallowRef(new Date())

const currentTimestamp = computed(() => Math.floor(now.value.getTime() / 1000))
const currentDate = computed(() => now.value.toLocaleString('zh-CN', { dateStyle: 'full', timeStyle: 'medium' }))

function timestampToDate() {
  const timestamp = Number(timestampInput.value)
  if (!Number.isFinite(timestamp)) {
    timestampResult.value = '请输入有效的数字时间戳'
    return
  }
  const date = new Date(timestamp * (String(Math.trunc(timestamp)).length <= 10 ? 1000 : 1))
  timestampResult.value = Number.isNaN(date.getTime()) ? '时间戳超出有效范围' : `${date.toLocaleString('zh-CN')} · ${date.toUTCString()}`
}

function dateToTimestamp() {
  if (!dateInput.value) {
    dateResult.value = '请先选择日期和时间'
    return
  }
  const date = new Date(dateInput.value)
  dateResult.value = `${Math.floor(date.getTime() / 1000)} 秒 · ${date.getTime()} 毫秒`
}

let clock: ReturnType<typeof setInterval> | undefined
onMounted(() => { clock = setInterval(() => { now.value = new Date() }, 1000) })
onUnmounted(() => clearInterval(clock))
</script>

<template>
  <LabLayout title="时间戳转换" desc="在 Unix 秒/毫秒时间戳与本地日期时间之间转换。" accent="#ffa500">
    <div class="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <aside class="tool-panel h-fit">
        <p class="tool-label">当前 Unix 时间</p>
        <div class="break-all font-mono text-3xl font-bold tabular-nums text-[var(--color-neon-green)]">{{ currentTimestamp }}</div>
        <p class="tool-help mt-3">{{ currentDate }}</p>
      </aside>

      <div class="space-y-6">
        <section class="tool-panel">
          <h2 class="mb-1 font-mono text-sm font-semibold text-[var(--color-text-primary)]">时间戳 → 日期时间</h2>
          <p class="tool-help mb-4">自动识别 10 位秒时间戳和 13 位毫秒时间戳。</p>
          <div class="flex flex-col gap-3 sm:flex-row">
            <div class="flex-1">
              <label for="timestamp-input" class="tool-label">Unix 时间戳</label>
              <input id="timestamp-input" v-model="timestampInput" inputmode="numeric" class="tool-field" placeholder="1700000000">
            </div>
            <button class="tool-button tool-button-primary self-end sm:min-w-24" @click="timestampToDate">转换</button>
          </div>
          <div v-if="timestampResult" class="tool-status mt-4 text-[var(--color-neon-cyan)]" role="status">{{ timestampResult }}</div>
        </section>

        <section class="tool-panel">
          <h2 class="mb-1 font-mono text-sm font-semibold text-[var(--color-text-primary)]">日期时间 → 时间戳</h2>
          <p class="tool-help mb-4">浏览器按当前系统时区解释选择的日期时间。</p>
          <div class="flex flex-col gap-3 sm:flex-row">
            <div class="flex-1">
              <label for="date-input" class="tool-label">本地日期时间</label>
              <input id="date-input" v-model="dateInput" type="datetime-local" class="tool-field">
            </div>
            <button class="tool-button tool-button-success self-end sm:min-w-24" @click="dateToTimestamp">转换</button>
          </div>
          <div v-if="dateResult" class="tool-status mt-4 text-[var(--color-neon-green)]" role="status">{{ dateResult }}</div>
        </section>
      </div>
    </div>
  </LabLayout>
</template>
