<template>
  <div class="min-h-screen" style="background:#0a0a0f;color:#e0e0e0">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'tools', href: '/lab' }, { label: 'QR Code' }]" />
    <div class="max-w-2xl mx-auto px-4 py-12">
      <h1 class="text-3xl font-bold mb-2" style="color:#39ff14;font-family:monospace">
        <span style="color:#00ffff">~/</span>qrcode
      </h1>
      <p class="mb-8 text-sm" style="color:#666">二维码生成器 — 纯前端</p>

      <div class="space-y-4 mb-8">
        <div>
          <label class="block text-xs mb-1" style="color:#888;font-family:monospace">INPUT TEXT / URL</label>
          <input
            v-model="text"
            type="text"
            placeholder="https://example.com"
            class="w-full px-3 py-2 rounded text-sm"
            style="background:#111;border:1px solid #333;color:#e0e0e0;font-family:monospace;outline:none"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs mb-1" style="color:#888;font-family:monospace">ECC LEVEL</label>
            <select v-model="eccLevel" class="w-full px-3 py-2 rounded text-sm" style="background:#111;border:1px solid #333;color:#e0e0e0;font-family:monospace">
              <option value="low">L — Low (7%)</option>
              <option value="medium">M — Medium (15%)</option>
              <option value="quartile">Q — Quartile (25%)</option>
              <option value="high">H — High (30%)</option>
            </select>
          </div>
          <div>
            <label class="block text-xs mb-1" style="color:#888;font-family:monospace">SIZE (px)</label>
            <input v-model.number="size" type="range" min="160" max="600" step="10" class="w-full mt-2" />
            <span class="text-xs" style="color:#555;font-family:monospace">{{ size }}px</span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs mb-1" style="color:#888;font-family:monospace">FOREGROUND</label>
            <div class="flex items-center gap-2">
              <input v-model="fgColor" type="color" class="h-8 w-8 rounded cursor-pointer" style="border:1px solid #333;background:transparent" />
              <span class="text-xs" style="color:#555;font-family:monospace">{{ fgColor }}</span>
            </div>
          </div>
          <div>
            <label class="block text-xs mb-1" style="color:#888;font-family:monospace">BACKGROUND</label>
            <div class="flex items-center gap-2">
              <input v-model="bgColor" type="color" class="h-8 w-8 rounded cursor-pointer" style="border:1px solid #333;background:transparent" />
              <span class="text-xs" style="color:#555;font-family:monospace">{{ bgColor }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col items-center gap-4">
        <ClientOnly>
          <div class="rounded-lg p-4" style="background:#111;border:1px solid #222">
            <canvas ref="canvasRef" :width="size" :height="size" />
          </div>
          <template #fallback>
            <div class="rounded-lg p-4 flex items-center justify-center" :style="`background:#111;border:1px solid #222;width:${size}px;height:${size}px`">
              <span style="color:#444;font-family:monospace">loading...</span>
            </div>
          </template>
        </ClientOnly>

        <div v-if="error" class="text-sm px-3 py-2 rounded" style="background:#1a0000;border:1px solid #ff3333;color:#ff6666;font-family:monospace">
          ⚠ {{ error }}
        </div>

        <button v-if="!error" @click="downloadPNG"
          class="px-6 py-2 rounded text-sm font-bold transition-all"
          style="background:#0a1a0a;border:1px solid #39ff14;color:#39ff14;font-family:monospace">
          ↓ DOWNLOAD PNG
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import QRCode from 'qrcode'

useSeoMeta({ title: 'QR Code Generator — void.lab' })

const text = ref('https://void.cat')
const eccLevel = ref<'low'|'medium'|'quartile'|'high'>('medium')
const size = ref(300)
const fgColor = ref('#39ff14')
const bgColor = ref('#0a0a0f')
const canvasRef = ref<HTMLCanvasElement | null>(null)
const error = ref('')

async function render() {
  if (!process.client) return  // qrcode 依赖 canvas，仅客户端运行
  if (!canvasRef.value || !text.value.trim()) return
  error.value = ''
  try {
    await QRCode.toCanvas(canvasRef.value, text.value, {
      width: size.value,
      errorCorrectionLevel: eccLevel.value,
      color: { dark: fgColor.value, light: bgColor.value },
      margin: 2,
    })
  } catch (e: any) {
    error.value = e?.message || 'QR 生成失败（文本可能过长）'
  }
}

watch([text, eccLevel, size, fgColor, bgColor], render)
onMounted(render)

function downloadPNG() {
  const c = canvasRef.value
  if (!c) return
  const a = document.createElement('a')
  a.download = `qr-${Date.now()}.png`
  a.href = c.toDataURL('image/png')
  a.click()
}
</script>
