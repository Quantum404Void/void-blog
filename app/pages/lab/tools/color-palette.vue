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
import { ref, computed } from 'vue'

const { siteName } = useSiteConfig()
useSeoMeta({ title: `颜色工具 | ${siteName}` })

const base = ref('#b400ff')
const harmonyMode = ref('complementary')
const scaleMode = ref('Material')
const exportFmt = ref('CSS变量')
const toast = ref('')
const topTab = ref<'converter'|'palette'>('converter')
const cvtHex = ref('#39ff14')

const topTabs = [
  { key: 'converter', label: '🎨 颜色转换' },
  { key: 'palette', label: '🖌️ 调色板' },
]

const cvtFormats = computed(() => {
  const h = cvtHex.value
  if (!/^#[0-9a-fA-F]{6}$/.test(h)) return []
  const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16)
  const rf = (r/255).toFixed(3), gf = (g/255).toFixed(3), bf = (b/255).toFixed(3)
  const mn = Math.min(r,g,b)/255, mx = Math.max(r,g,b)/255, delta = mx - mn
  let hue = 0
  if (delta) {
    if (mx === r/255) hue = ((g - b) / 255 / delta) % 6
    else if (mx === g/255) hue = (b - r) / 255 / delta + 2
    else hue = (r - g) / 255 / delta + 4
    hue = Math.round(hue * 60)
    if (hue < 0) hue += 360
  }
  const sat = mx ? Math.round(delta / mx * 100) : 0
  const val = Math.round(mx * 100)
  const lgt = Math.round((mx + mn) / 2 * 100)
  const satL = (mx + mn) / 2 < 0.5 ? delta / (mx + mn) : (delta / (2 - mx - mn))
  const satLp = Math.round((satL || 0) * 100)
  return [
    { label: 'HEX', value: h.toUpperCase(), color: '#39ff14' },
    { label: 'RGB', value: `rgb(${r}, ${g}, ${b})`, color: '#00d4ff' },
    { label: 'HSL', value: `hsl(${hue}, ${satLp}%, ${lgt}%)`, color: '#b400ff' },
    { label: 'HSV', value: `hsv(${hue}°, ${sat}%, ${val}%)`, color: '#ff00aa' },
    { label: 'Float', value: `(${rf}, ${gf}, ${bf})`, color: '#ffa500' },
  ]
})

function onCvtHexInput() { /* hex bound to input */ }

const harmonies = [
  { key: 'complementary', label: '互补色' },
  { key: 'triadic', label: '三等分' },
  { key: 'tetradic', label: '四等分' },
  { key: 'analogous', label: '类似色' },
  { key: 'split', label: '分割互补' },
]
const scales = ['Material', 'Tailwind']

// ---- Color math ----

function hexToHsl(hex: string): [number, number, number] {
  let r = parseInt(hex.slice(1, 3), 16) / 255
  let g = parseInt(hex.slice(3, 5), 16) / 255
  let b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(255 * c).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

const harmonyColors = computed(() => {
  const [h, s, l] = hexToHsl(base.value)
  const offsets: Record<string, number[]> = {
    complementary: [0, 180],
    triadic: [0, 120, 240],
    tetradic: [0, 90, 180, 270],
    analogous: [-30, -15, 0, 15, 30],
    split: [0, 150, 210],
  }
  return (offsets[harmonyMode.value] || [0]).map(off => hslToHex((h + off + 360) % 360, s, l))
})

function generateScale(h: number, s: number, baseL: number, steps: number[]): string[] {
  return steps.map(l => hslToHex(h, Math.min(s, 90), l))
}

const scaleColors = computed(() => {
  const [h, s] = hexToHsl(base.value)
  if (scaleMode.value === 'Material') {
    const ls = [95, 88, 78, 67, 56, 45, 35, 25, 15, 8]
    const labels = ['100','200','300','400','500','600','700','800','900','950']
    return ls.map((l, i) => ({ hex: hslToHex(h, s, l), label: labels[i] }))
  } else {
    const ls = [97, 94, 87, 79, 68, 55, 43, 33, 24, 14]
    const labels = ['50','100','200','300','400','500','600','700','800','900']
    return ls.map((l, i) => ({ hex: hslToHex(h, s, l), label: labels[i] }))
  }
})

function relativeLuminance(hex: string): number {
  const vals = [hex.slice(1,3), hex.slice(3,5), hex.slice(5,7)].map(v => {
    const c = parseInt(v, 16) / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * vals[0] + 0.7152 * vals[1] + 0.0722 * vals[2]
}

function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a), lb = relativeLuminance(b)
  return Math.round(((Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)) * 100) / 100
}

const contrastPairs = computed(() => {
  const bg1 = '#0a0a0f', bg2 = '#ffffff', bg3 = base.value
  return [
    { label: '基础色/深', bg: bg1, fg: base.value, ratio: contrastRatio(bg1, base.value) },
    { label: '基础色/浅', bg: bg2, fg: base.value, ratio: contrastRatio(bg2, base.value) },
    { label: '互补色/深', bg: bg1, fg: harmonyColors.value[1] || base.value, ratio: contrastRatio(bg1, harmonyColors.value[1] || base.value) },
    { label: '白/基础色', bg: bg3, fg: '#ffffff', ratio: contrastRatio(bg3, '#ffffff') },
    { label: '黑/基础色', bg: bg3, fg: '#000000', ratio: contrastRatio(bg3, '#000000') },
  ]
})

function textColor(hex: string): string {
  return relativeLuminance(hex) > 0.3 ? '#000000' : '#ffffff'
}

const exportCode = computed(() => {
  const colors = scaleColors.value
  if (exportFmt.value === 'CSS变量') {
    return `:root {\n${colors.map(c => `  --color-${c.label}: ${c.hex};`).join('\n')}\n}`
  } else if (exportFmt.value === 'Tailwind') {
    const [h] = hexToHsl(base.value)
    const name = 'primary'
    return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n        ${name}: {\n${colors.map(c => `          '${c.label}': '${c.hex}',`).join('\n')}\n        }\n      }\n    }\n  }\n}`
  } else {
    const obj: Record<string, string> = {}
    colors.forEach(c => obj[c.label] = c.hex)
    return JSON.stringify(obj, null, 2)
  }
})

async function copyColor(hex: string) {
  await navigator.clipboard.writeText(hex)
  toast.value = `已复制 ${hex}`
  setTimeout(() => toast.value = '', 2000)
}

async function copyExport() {
  await navigator.clipboard.writeText(exportCode.value)
  toast.value = '已复制导出代码'
  setTimeout(() => toast.value = '', 2000)
}
</script>
