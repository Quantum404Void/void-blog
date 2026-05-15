<template>
  <div class="min-h-screen bg-[#0a0a0f]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'tools', href: '/lab' }, { label: '颜色工具' }]" />

    <div class="max-w-4xl mx-auto px-6 py-10">
      <h1 class="font-mono text-2xl font-bold mb-2" style="color:#ff2d78;text-shadow:0 0 20px rgba(255,45,120,0.5)">颜色工具</h1>
      <p class="font-mono text-xs text-gray-500 mb-4">Color Tools — 颜色转换 · 调色板 · 对比度检测</p>

      <!-- Top-level tabs -->
      <div class="flex gap-2 mb-8">
        <button v-for="t in topTabs" :key="t.key" @click="topTab=t.key"
          class="font-mono text-xs px-4 py-2 rounded-lg border transition-all"
          :style="topTab===t.key ? 'border-color:#ff2d78;color:#ff2d78;background:rgba(255,45,120,0.1)' : 'border-color:rgba(255,255,255,0.15);color:#666'"
        >{{ t.label }}</button>
      </div>

      <!-- Tab: 颜色转换 -->
      <template v-if="topTab==='converter'">
        <div class="flex gap-4 items-center mb-6">
          <input type="color" v-model="cvtHex" class="w-16 h-16 rounded-xl border-0 cursor-pointer bg-transparent" style="padding:0">
          <input v-model="cvtHex" @input="onCvtHexInput" placeholder="#000000"
            class="font-mono text-lg rounded-xl border border-gray-700 px-4 py-2 bg-[#050508] text-white outline-none w-40">
          <div class="w-16 h-16 rounded-xl border border-gray-700" :style="`background:${cvtHex}`"></div>
        </div>
        <div class="grid grid-cols-1 gap-3">
          <div v-for="fmt in cvtFormats" :key="fmt.label"
            class="border border-gray-800 rounded-xl p-4 bg-[#050508] flex items-center justify-between">
            <div>
              <div class="font-mono text-[10px] text-gray-500 uppercase tracking-widest mb-1">{{ fmt.label }}</div>
              <div class="font-mono text-sm" :style="`color:${fmt.color}`">{{ fmt.value }}</div>
            </div>
            <button @click="copyColor(fmt.value)" class="font-mono text-[10px] px-3 py-1 rounded border border-gray-700 text-gray-400 hover:text-cyan-400 transition-all">复制</button>
          </div>
        </div>
      </template>

      <!-- Tab: 调色板 -->
      <template v-if="topTab==='palette'">

      <!-- Base color input -->
      <div class="flex items-center gap-4 mb-8">
        <input type="color" v-model="base" class="w-16 h-16 rounded-xl cursor-pointer border-0 bg-transparent p-0" />
        <div>
          <div class="font-mono text-xs text-gray-500 mb-1">基础色</div>
          <div class="font-mono text-2xl font-bold" :style="`color:${base}`">{{ base.toUpperCase() }}</div>
        </div>
      </div>

      <!-- Harmony palettes -->
      <section class="mb-8">
        <div class="flex gap-4 mb-4 flex-wrap">
          <button v-for="h in harmonies" :key="h.key" @click="harmonyMode=h.key"
            class="font-mono text-xs px-3 py-1.5 rounded border transition-all"
            :style="harmonyMode===h.key ? 'border-color:#ff2d78;color:#ff2d78;background:rgba(255,45,120,0.1)' : 'border-color:rgba(255,255,255,0.15);color:#666'"
          >{{ h.label }}</button>
        </div>
        <div class="flex gap-2 flex-wrap">
          <div v-for="(c, i) in harmonyColors" :key="i"
            class="flex-1 min-w-[60px] h-20 rounded-lg cursor-pointer flex items-end p-2 border border-gray-800 transition-all hover:scale-105 relative group"
            :style="`background:${c}`"
            @click="copyColor(c)"
          >
            <span class="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded" :style="`background:rgba(0,0,0,0.6);color:${textColor(c)}`">{{ c.toUpperCase() }}</span>
            <span class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 font-mono text-xs transition-all" :style="`color:${textColor(c)}`">复制</span>
          </div>
        </div>
      </section>

      <!-- Scale tabs -->
      <section class="mb-8">
        <div class="flex gap-3 mb-4">
          <button v-for="s in scales" :key="s" @click="scaleMode=s"
            class="font-mono text-xs px-3 py-1.5 rounded border transition-all"
            :style="scaleMode===s ? 'border-color:#00d4ff;color:#00d4ff;background:rgba(0,212,255,0.1)' : 'border-color:rgba(255,255,255,0.15);color:#666'"
          >{{ s }}</button>
        </div>
        <div class="flex gap-1 flex-wrap">
          <div v-for="(c, i) in scaleColors" :key="i"
            class="flex flex-col items-center cursor-pointer group"
            @click="copyColor(c.hex)"
          >
            <div class="w-14 h-14 rounded-lg border border-gray-800 transition-all group-hover:scale-105" :style="`background:${c.hex}`"></div>
            <span class="font-mono text-[9px] text-gray-500 mt-1">{{ c.label }}</span>
            <span class="font-mono text-[8px] text-gray-600">{{ c.hex }}</span>
          </div>
        </div>
      </section>

      <!-- Contrast checker -->
      <section class="mb-8">
        <h2 class="font-mono text-xs text-gray-400 uppercase tracking-widest mb-4">WCAG 对比度检查</h2>
        <div class="flex gap-4 flex-wrap">
          <div v-for="pair in contrastPairs" :key="pair.label"
            class="border border-gray-800 rounded-xl p-4 flex-1 min-w-[140px]"
            :style="`background:${pair.bg}`"
          >
            <div class="font-mono text-base font-bold mb-2" :style="`color:${pair.fg}`">Aa 文字示例</div>
            <div class="font-mono text-[10px]" :style="`color:${pair.fg}`">
              <div>对比度: {{ pair.ratio }}</div>
              <div :style="`color:${pair.ratio >= 4.5 ? '#00ff88' : '#ff2d78'}`">AA: {{ pair.ratio >= 4.5 ? '✓' : '✗' }}</div>
              <div :style="`color:${pair.ratio >= 7 ? '#00ff88' : '#ff2d78'}`">AAA: {{ pair.ratio >= 7 ? '✓' : '✗' }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Export -->
      <section>
        <div class="flex gap-3 mb-4">
          <button v-for="fmt in ['CSS变量','Tailwind','JSON']" :key="fmt" @click="exportFmt=fmt"
            class="font-mono text-xs px-3 py-1.5 rounded border transition-all"
            :style="exportFmt===fmt ? 'border-color:#b400ff;color:#b400ff;background:rgba(180,0,255,0.1)' : 'border-color:rgba(255,255,255,0.15);color:#666'"
          >{{ fmt }}</button>
          <button @click="copyExport" class="font-mono text-xs px-4 py-1.5 rounded border border-gray-600 text-gray-300 hover:text-white transition-all ml-auto">复制导出</button>
        </div>
        <pre class="font-mono text-[11px] bg-[#050508] border border-gray-800 rounded-xl p-4 overflow-x-auto text-gray-300 max-h-48">{{ exportCode }}</pre>
      </section>

      </template>

      <div v-if="toast" class="fixed bottom-6 right-6 font-mono text-xs px-4 py-2 rounded-lg bg-[#1a1a2e] border border-cyan-800 text-cyan-400 shadow-xl">{{ toast }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { colord, extend } from 'colord'
import harmoniesPlugin from 'colord/plugins/harmonies'
import a11yPlugin from 'colord/plugins/a11y'
import mixPlugin from 'colord/plugins/mix'

extend([harmoniesPlugin, a11yPlugin, mixPlugin])

const { siteName } = useSiteConfig()
useSeoMeta({ title: `颜色工具 | ${siteName}` })

const base = ref('#b400ff')
const harmonyMode = ref('complementary')
const scaleMode = ref('Material')
const toast = ref('')
const topTab = ref<'converter'|'palette'>('converter')
const cvtHex = ref('#39ff14')

const topTabs = [
  { key: 'converter', label: '🎨 颜色转换' },
  { key: 'palette', label: '🖌️ 调色板' },
]
const harmonies = [
  { key: 'complementary', label: '互补色' },
  { key: 'triadic', label: '三等分' },
  { key: 'tetradic', label: '四等分' },
  { key: 'analogous', label: '类似色' },
  { key: 'split', label: '分割互补' },
]
const scales = ['Material', 'Tailwind']

// 颜色转换（colord）
const cvtFormats = computed(() => {
  const h = cvtHex.value
  if (!/^#[0-9a-fA-F]{6}$/.test(h)) return []
  const c = colord(h)
  const { r, g, b } = c.toRgb()
  const { h: hh, s, l } = c.toHsl()
  const { h: hv, s: sv, v } = c.toHsv()
  return [
    { label: 'HEX',   value: h.toUpperCase(),                                  color: '#39ff14' },
    { label: 'RGB',   value: `rgb(${r}, ${g}, ${b})`,                          color: '#00d4ff' },
    { label: 'HSL',   value: `hsl(${hh}, ${s}%, ${l}%)`,                       color: '#b400ff' },
    { label: 'HSV',   value: `hsv(${hv}°, ${sv}%, ${v}%)`,                     color: '#ff00aa' },
    { label: 'Float', value: `(${(r/255).toFixed(3)}, ${(g/255).toFixed(3)}, ${(b/255).toFixed(3)})`, color: '#ffa500' },
  ]
})

// 和谐配色
const harmonyColors = computed(() => {
  const c = colord(base.value)
  const map: Record<string, string[]> = {
    complementary: c.harmonies('complementary').map(x => x.toHex()),
    triadic:       c.harmonies('triadic').map(x => x.toHex()),
    tetradic:      c.harmonies('tetradic').map(x => x.toHex()),
    analogous:     c.harmonies('analogous').map(x => x.toHex()),
    split:         c.harmonies('split-complementary').map(x => x.toHex()),
  }
  return map[harmonyMode.value] ?? [base.value]
})

// 色阶
const scaleColors = computed(() => {
  const c = colord(base.value)
  const { h, s } = c.toHsl()
  const lSteps = scaleMode.value === 'Material'
    ? [[95,'100'],[88,'200'],[78,'300'],[67,'400'],[56,'500'],[45,'600'],[35,'700'],[25,'800'],[15,'900'],[8,'950']]
    : [[97,'50'],[94,'100'],[87,'200'],[79,'300'],[68,'400'],[55,'500'],[43,'600'],[33,'700'],[24,'800'],[14,'900']]
  return lSteps.map(([l, label]) => ({
    hex: colord({ h, s: Math.min(s, 90), l: Number(l) }).toHex(),
    label: String(label),
  }))
})

// 对比度（colord a11y plugin）
const contrastPairs = computed(() => {
  const fg = base.value
  return [
    { label: '基础色/深', bg: '#0a0a0f', fg, ratio: colord(fg).contrast('#0a0a0f') },
    { label: '基础色/浅', bg: '#ffffff', fg, ratio: colord(fg).contrast('#ffffff') },
    { label: '互补色对', bg: harmonyColors.value[1] ?? '#ffffff', fg, ratio: colord(fg).contrast(harmonyColors.value[1] ?? '#ffffff') },
  ]
})

// WCAG 等级
function wcagLevel(ratio: number): string {
  if (ratio >= 7) return 'AAA ✓'
  if (ratio >= 4.5) return 'AA ✓'
  if (ratio >= 3) return 'AA Large ✓'
  return '✗ Fail'
}

// 文字颜色
function textColor(hex: string): string {
  return colord(hex).isLight() ? '#000000' : '#ffffff'
}

// 导出 CSS vars
const exportCss = computed(() => {
  return scaleColors.value.map(({ hex, label }) => `  --color-${label}: ${hex};`).join('\n')
})

async function copyColor(val: string) {
  await navigator.clipboard.writeText(val)
  toast.value = '已复制！'
  setTimeout(() => toast.value = '', 1500)
}
</script>
