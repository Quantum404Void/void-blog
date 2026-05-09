<template>
  <div class="min-h-screen bg-[var(--color-void)] relative overflow-hidden">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'silk' }]" />

    <canvas ref="canvasRef" class="absolute inset-0 w-full h-full" style="touch-action: none;" />

    <!-- Control Panel -->
    <div class="absolute top-14 right-4 z-10 flex flex-col gap-2 font-mono text-xs">
      <div class="bg-black/70 border border-[#ff69b4]/30 rounded-xl p-3 backdrop-blur-sm flex flex-col gap-3 min-w-[160px]">
        <p class="text-[#ff69b4] text-[10px] tracking-widest uppercase mb-1">silk controls</p>

        <!-- Symmetry -->
        <div>
          <label class="text-[var(--color-text-muted)] text-[10px] block mb-1">symmetry</label>
          <div class="flex gap-1">
            <button
              v-for="n in [2, 4, 6, 8]"
              :key="n"
              @click="symmetry = n"
              class="flex-1 py-1 rounded border text-[10px] transition-colors"
              :style="symmetry === n
                ? 'border-color:#ff69b4;color:#ff69b4;background:#ff69b41a'
                : 'border-color:#ff69b430;color:#666;background:transparent'"
            >{{ n }}</button>
          </div>
        </div>

        <!-- Color Mode -->
        <div>
          <label class="text-[var(--color-text-muted)] text-[10px] block mb-1">color mode</label>
          <div class="flex gap-1">
            <button
              @click="colorMode = 'rainbow'"
              class="flex-1 py-1 rounded border text-[10px] transition-colors"
              :style="colorMode === 'rainbow'
                ? 'border-color:#ff69b4;color:#ff69b4;background:#ff69b41a'
                : 'border-color:#ff69b430;color:#666;background:transparent'"
            >rainbow</button>
            <button
              @click="colorMode = 'fixed'"
              class="flex-1 py-1 rounded border text-[10px] transition-colors"
              :style="colorMode === 'fixed'
                ? 'border-color:#ff69b4;color:#ff69b4;background:#ff69b41a'
                : 'border-color:#ff69b430;color:#666;background:transparent'"
            >fixed</button>
          </div>
        </div>

        <!-- Hue Speed (rainbow only) -->
        <div v-if="colorMode === 'rainbow'">
          <label class="text-[var(--color-text-muted)] text-[10px] block mb-1">hue speed</label>
          <input
            v-model.number="hueSpeed"
            type="range" min="0" max="3" step="0.1"
            class="w-full accent-[#ff69b4] h-1"
          />
        </div>

        <!-- Lightness (rainbow only) -->
        <div v-if="colorMode === 'rainbow'">
          <label class="text-[var(--color-text-muted)] text-[10px] block mb-1">lightness {{ lightness }}%</label>
          <input
            v-model.number="lightness"
            type="range" min="0" max="100" step="1"
            class="w-full accent-[#ff69b4] h-1"
          />
        </div>

        <!-- Fixed Color Presets -->
        <div v-if="colorMode === 'fixed'">
          <label class="text-[var(--color-text-muted)] text-[10px] block mb-1">color</label>
          <div class="flex gap-1 flex-wrap mb-1">
            <button
              v-for="c in presetColors"
              :key="c"
              @click="fixedColor = c"
              class="w-6 h-6 rounded-full border-2 transition-all"
              :style="`background:${c};border-color:${fixedColor === c ? '#fff' : 'transparent'}`"
            />
          </div>
          <input
            v-model="fixedColor"
            type="color"
            class="w-full h-6 rounded cursor-pointer"
          />
        </div>

        <!-- Clear -->
        <button
          @click="clearCanvas"
          class="py-1.5 rounded border border-[#ff69b4]/30 text-[#ff69b4]/80 hover:bg-[#ff69b4]/10 transition-colors text-[10px] tracking-wider"
        >clear</button>

        <!-- Save -->
        <button
          @click="saveImage"
          class="py-1.5 rounded border border-[#ff69b4]/30 text-[#ff69b4]/80 hover:bg-[#ff69b4]/10 transition-colors text-[10px] tracking-wider"
        >save png</button>
      </div>
    </div>

    <!-- Hint -->
    <div class="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-[10px] text-[var(--color-text-muted)] opacity-50 pointer-events-none">
      move mouse or touch to paint · {{ symmetry }}-axis symmetry
    </div>
  </div>
</template>

<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `Silk | ${siteName}` })

const canvasRef = ref<HTMLCanvasElement | null>(null)
const symmetry = ref(6)
const hueSpeed = ref(0.3)
const colorMode = ref<'rainbow' | 'fixed'>('rainbow')
const fixedColor = ref('#00d4ff')
const lightness = ref(65)
const presetColors = ['#00d4ff', '#ff00aa', '#39ff14', '#b400ff', '#ffa500', '#ff4444']

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

let ctx: CanvasRenderingContext2D | null = null
let hue = 0
let isDrawing = false
let points: { x: number; y: number }[] = []
let lastSpeed = 0
let animFrameId: number | null = null

function resize() {
  const canvas = canvasRef.value
  if (!canvas || !ctx) return
  // Preserve content
  const tmp = document.createElement('canvas')
  tmp.width = canvas.width
  tmp.height = canvas.height
  tmp.getContext('2d')!.drawImage(canvas, 0, 0)
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(tmp, 0, 0)
}

function clearCanvas() {
  const canvas = canvasRef.value
  if (!canvas || !ctx) return
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
}

function saveImage() {
  const canvas = canvasRef.value
  if (!canvas) return
  const a = document.createElement('a')
  a.href = canvas.toDataURL('image/png')
  a.download = `silk-${Date.now()}.png`
  a.click()
}

function drawSymmetric(x: number, y: number, px: number, py: number, ppx: number, ppy: number) {
  if (!ctx || !canvasRef.value) return
  const canvas = canvasRef.value
  const cx = canvas.width / 2
  const cy = canvas.height / 2
  const count = symmetry.value
  const speed = Math.hypot(x - px, y - py)
  lastSpeed = speed
  const lw = Math.max(1.5, 8 - speed * 0.25)

  ctx.globalCompositeOperation = 'lighter'
  ctx.strokeStyle = colorMode.value === 'fixed'
    ? hexToRgba(fixedColor.value, 0.6)
    : `hsla(${hue}, 100%, ${lightness.value}%, 0.6)`
  ctx.lineWidth = lw
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(angle)
    ctx.beginPath()
    ctx.moveTo(ppx - cx, ppy - cy)
    ctx.quadraticCurveTo(px - cx, py - cy, x - cx, y - cy)
    ctx.stroke()
    ctx.restore()
  }
}

function getPos(e: MouseEvent | Touch) {
  const canvas = canvasRef.value!
  const rect = canvas.getBoundingClientRect()
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

function onPointerDown(e: MouseEvent) {
  isDrawing = true
  const pos = getPos(e)
  points = [pos, pos, pos]
}

function onPointerMove(e: MouseEvent) {
  if (!isDrawing) return
  const pos = getPos(e)
  points.push(pos)
  if (points.length >= 3) {
    const [pp, p, cur] = points.slice(-3)
    drawSymmetric(cur.x, cur.y, p.x, p.y, pp.x, pp.y)
  }
}

function onPointerUp() {
  isDrawing = false
  points = []
}

function onTouchStart(e: TouchEvent) {
  e.preventDefault()
  isDrawing = true
  const pos = getPos(e.touches[0])
  points = [pos, pos, pos]
}

function onTouchMove(e: TouchEvent) {
  e.preventDefault()
  if (!isDrawing) return
  const pos = getPos(e.touches[0])
  points.push(pos)
  if (points.length >= 3) {
    const [pp, p, cur] = points.slice(-3)
    drawSymmetric(cur.x, cur.y, p.x, p.y, pp.x, pp.y)
  }
}

function onTouchEnd() {
  isDrawing = false
  points = []
}

function tick() {
  hue = (hue + hueSpeed.value) % 360
  animFrameId = requestAnimationFrame(tick)
}

onMounted(() => {
  const canvas = canvasRef.value!
  ctx = canvas.getContext('2d')!
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  canvas.addEventListener('mousedown', onPointerDown)
  canvas.addEventListener('mousemove', onPointerMove)
  canvas.addEventListener('mouseup', onPointerUp)
  canvas.addEventListener('mouseleave', onPointerUp)
  canvas.addEventListener('touchstart', onTouchStart, { passive: false })
  canvas.addEventListener('touchmove', onTouchMove, { passive: false })
  canvas.addEventListener('touchend', onTouchEnd)

  window.addEventListener('resize', resize)
  tick()
})

onUnmounted(() => {
  const canvas = canvasRef.value
  if (canvas) {
    canvas.removeEventListener('mousedown', onPointerDown)
    canvas.removeEventListener('mousemove', onPointerMove)
    canvas.removeEventListener('mouseup', onPointerUp)
    canvas.removeEventListener('mouseleave', onPointerUp)
    canvas.removeEventListener('touchstart', onTouchStart)
    canvas.removeEventListener('touchmove', onTouchMove)
    canvas.removeEventListener('touchend', onTouchEnd)
  }
  window.removeEventListener('resize', resize)
  if (animFrameId !== null) cancelAnimationFrame(animFrameId)
})
</script>
