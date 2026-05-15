<template>
  <div class="min-h-screen bg-black relative overflow-hidden">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'games', href: '/lab' }, { label: 'silk' }]" />

    <!-- 底层：永久画布 -->
    <canvas ref="baseCanvas" class="absolute inset-0 w-full h-full" style="touch-action:none;" />
    <!-- 顶层：fade 层，每帧半透明黑色覆盖 -->
    <canvas ref="fadeCanvas" class="absolute inset-0 w-full h-full pointer-events-none" />

    <!-- Control Panel -->
    <div class="absolute top-14 right-4 z-10 font-mono text-xs select-none">
      <div class="bg-black/80 border border-white/10 rounded-xl p-3 backdrop-blur-sm flex flex-col gap-3" style="min-width:160px">
        <p class="text-white/40 text-[9px] tracking-widest uppercase">silk</p>

        <!-- Symmetry -->
        <div>
          <label class="text-white/30 text-[9px] block mb-1.5">symmetry</label>
          <div class="flex gap-1">
            <button v-for="n in [2,4,6,8]" :key="n" @click="symmetry=n"
              class="flex-1 py-1 rounded text-[10px] border transition-all"
              :style="symmetry===n ? 'border-color:rgba(255,255,255,0.5);color:#fff' : 'border-color:rgba(255,255,255,0.1);color:rgba(255,255,255,0.3)'"
            >{{n}}</button>
          </div>
        </div>

        <!-- Fade -->
        <div>
          <label class="text-white/30 text-[9px] block mb-1">fade <span class="text-white/50">{{fadeAmount}}</span></label>
          <input v-model.number="fadeAmount" type="range" min="0" max="40" step="1" class="w-full h-1 accent-white" />
        </div>

        <!-- Color Mode -->
        <div>
          <label class="text-white/30 text-[9px] block mb-1.5">color</label>
          <div class="flex gap-1 mb-2">
            <button @click="colorMode='rainbow'"
              class="flex-1 py-1 rounded text-[10px] border transition-all"
              :style="colorMode==='rainbow' ? 'border-color:rgba(255,255,255,0.5);color:#fff' : 'border-color:rgba(255,255,255,0.1);color:rgba(255,255,255,0.3)'"
            >rainbow</button>
            <button @click="colorMode='fixed'"
              class="flex-1 py-1 rounded text-[10px] border transition-all"
              :style="colorMode==='fixed' ? 'border-color:rgba(255,255,255,0.5);color:#fff' : 'border-color:rgba(255,255,255,0.1);color:rgba(255,255,255,0.3)'"
            >fixed</button>
          </div>

          <!-- Rainbow: hue speed -->
          <div v-if="colorMode==='rainbow'">
            <label class="text-white/30 text-[9px] block mb-1">hue speed</label>
            <input v-model.number="hueSpeed" type="range" min="0" max="4" step="0.1" class="w-full h-1 accent-white" />
          </div>

          <!-- Fixed: presets + picker -->
          <div v-else class="flex flex-col gap-1.5">
            <div class="flex gap-1 flex-wrap">
              <button v-for="c in presets" :key="c" @click="fixedHex=c"
                class="w-5 h-5 rounded-full transition-all"
                :style="`background:${c};outline:${fixedHex===c?'2px solid #fff':'2px solid transparent'};outline-offset:1px`"
              />
            </div>
            <input v-model="fixedHex" type="color" class="w-full h-6 rounded cursor-pointer bg-transparent border-0" />
          </div>
        </div>

        <!-- Brush size -->
        <div>
          <label class="text-white/30 text-[9px] block mb-1">brush <span class="text-white/50">{{brushMax}}</span></label>
          <input v-model.number="brushMax" type="range" min="2" max="30" step="1" class="w-full h-1 accent-white" />
        </div>

        <!-- Clear + Save -->
        <button @click="clearAll"
          class="py-1.5 rounded border border-white/10 text-white/40 hover:text-white/70 hover:border-white/30 transition-all text-[10px] tracking-wider">
          clear
        </button>
        <button @click="saveImage"
          class="py-1.5 rounded border border-white/10 text-white/40 hover:text-white/70 hover:border-white/30 transition-all text-[10px] tracking-wider">
          save png
        </button>
      </div>
    </div>

    <!-- Hint -->
    <div class="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-[10px] text-white/20 pointer-events-none whitespace-nowrap">
      move mouse to paint · {{symmetry}}-axis symmetry
    </div>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `Silk | ${siteName}` })

// ---- refs ----
const baseCanvas = ref<HTMLCanvasElement | null>(null)
const fadeCanvas  = ref<HTMLCanvasElement | null>(null)

// ---- settings ----
const symmetry   = ref(6)
const fadeAmount = ref(8)        // 每帧 fade 强度（0=不消散，40=快速消散）
const hueSpeed   = ref(0.5)
const brushMax   = ref(12)       // 最大笔刷半径
const colorMode  = ref<'rainbow'|'fixed'>('rainbow')
const fixedHex   = ref('#00d4ff')
const presets    = ['#00d4ff','#ff00aa','#ff6b35','#39ff14','#b400ff','#ffffff']

// ---- state ----
let baseCtx: CanvasRenderingContext2D | null = null
let fadeCtx:  CanvasRenderingContext2D | null = null
let hue      = 0
let rafId    = 0

// 鼠标轨迹：最近N个点，用于 tapered 笔触
const TRAIL  = 8
let trail: { x:number; y:number }[] = []
let mouseX   = -9999
let mouseY   = -9999
let prevX    = -9999
let prevY    = -9999
let moving   = false   // 鼠标是否在移动（用于判断是否绘制）

// ---- 颜色 ----
function hexToRgb(hex: string) {
  return {
    r: parseInt(hex.slice(1,3),16),
    g: parseInt(hex.slice(3,5),16),
    b: parseInt(hex.slice(5,7),16),
  }
}

function getStrokeColor(alpha: number): string {
  if (colorMode.value === 'fixed') {
    const {r,g,b} = hexToRgb(fixedHex.value)
    return `rgba(${r},${g},${b},${alpha})`
  }
  // rainbow：用当前 hue，饱和度100%，亮度70%（比纯hsla更亮）
  return `hsla(${hue},100%,70%,${alpha})`
}

// ---- 核心绘制：均匀笔触（weavesilk 风格）----
// 速度决定线宽，三层叠加产生发光感，单条 path 保证均匀
function drawSilkLine(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  speed: number
) {
  const dist = Math.hypot(x2-x1, y2-y1)
  if (dist < 0.3) return

  // 速度越快线越细，停止时最粗；用平滑映射避免突变
  const t = Math.min(1, speed / 20)
  const w = Math.max(0.5, brushMax.value * (1 - t * 0.75))

  ctx.globalCompositeOperation = 'lighter'
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // 外层光晕
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.lineWidth = w * 2.5
  ctx.strokeStyle = getStrokeColor(0.03)
  ctx.stroke()

  // 中层
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.lineWidth = w * 1.2
  ctx.strokeStyle = getStrokeColor(0.10)
  ctx.stroke()

  // 核心亮线
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.lineWidth = Math.max(0.4, w * 0.45)
  ctx.strokeStyle = getStrokeColor(0.55)
  ctx.stroke()
}

// ---- 对称绘制 ----
function drawSymmetric(mx: number, my: number, px: number, py: number) {
  const ctx = baseCtx
  if (!ctx || !baseCanvas.value) return
  const canvas = baseCanvas.value
  const cx = canvas.width / 2
  const cy = canvas.height / 2
  const n  = symmetry.value
  const speed = Math.hypot(mx-px, my-py)

  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 / n) * i
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(angle)

    // 正向
    drawSilkLine(ctx, px-cx, py-cy, mx-cx, my-cy, speed)

    // 镜像
    ctx.scale(1, -1)
    drawSilkLine(ctx, px-cx, -(py-cy), mx-cx, -(my-cy), speed)

    ctx.restore()
  }
}

// ---- Fade（顶层每帧淡化）----
function applyFade() {
  const ctx = fadeCtx
  const canvas = fadeCanvas.value
  if (!ctx || !canvas) return
  const alpha = fadeAmount.value / 255
  if (alpha < 0.001) return
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = `rgba(0,0,0,${alpha})`
  ctx.fillRect(0, 0, canvas.width, canvas.height)
}

// ---- 主循环 ----
function loop() {
  hue = (hue + hueSpeed.value) % 360

  if (moving && prevX > -9000) {
    drawSymmetric(mouseX, mouseY, prevX, prevY)
  }

  // fade 作用于 base canvas 上（直接在 baseCtx 叠一层半透明黑）
  if (fadeAmount.value > 0 && baseCtx && baseCanvas.value) {
    const c = baseCanvas.value
    baseCtx.globalCompositeOperation = 'source-over'
    baseCtx.fillStyle = `rgba(0,0,0,${fadeAmount.value/2000})`
    baseCtx.fillRect(0, 0, c.width, c.height)
  }

  prevX = mouseX
  prevY = mouseY
  moving = false

  rafId = requestAnimationFrame(loop)
}

// ---- 事件处理 ----
function getPos(e: MouseEvent | Touch) {
  const canvas = baseCanvas.value!
  const rect = canvas.getBoundingClientRect()
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

function onMouseMove(e: MouseEvent) {
  const pos = getPos(e)
  mouseX = pos.x; mouseY = pos.y; moving = true
}
function onTouchMove(e: TouchEvent) {
  e.preventDefault()
  const pos = getPos(e.touches[0])
  mouseX = pos.x; mouseY = pos.y; moving = true
}
function onTouchStart(e: TouchEvent) {
  e.preventDefault()
  const pos = getPos(e.touches[0])
  mouseX = pos.x; mouseY = pos.y; prevX = pos.x; prevY = pos.y; moving = false
}

// ---- 工具 ----
function clearAll() {
  if (!baseCtx || !baseCanvas.value) return
  baseCtx.globalCompositeOperation = 'source-over'
  baseCtx.fillStyle = '#000'
  baseCtx.fillRect(0, 0, baseCanvas.value.width, baseCanvas.value.height)
  trail = []
  prevX = -9999; prevY = -9999
}

function saveImage() {
  const canvas = baseCanvas.value
  if (!canvas) return
  const a = document.createElement('a')
  a.href = canvas.toDataURL('image/png')
  a.download = `silk-${Date.now()}.png`
  a.click()
}

function resizeCanvases() {
  const base = baseCanvas.value
  const fade = fadeCanvas.value
  if (!base || !fade || !baseCtx) return

  // 保留内容
  const tmp = document.createElement('canvas')
  tmp.width = base.width; tmp.height = base.height
  tmp.getContext('2d')!.drawImage(base, 0, 0)

  const w = window.innerWidth, h = window.innerHeight
  base.width = w; base.height = h
  fade.width = w; fade.height = h

  baseCtx.globalCompositeOperation = 'source-over'
  baseCtx.fillStyle = '#000'
  baseCtx.fillRect(0, 0, w, h)
  baseCtx.drawImage(tmp, 0, 0)
}

// ---- 生命周期 ----
onMounted(() => {
  const base = baseCanvas.value!
  const fade = fadeCanvas.value!
  baseCtx = base.getContext('2d')!
  fadeCtx  = fade.getContext('2d')!

  const w = window.innerWidth, h = window.innerHeight
  base.width = w; base.height = h
  fade.width = w; fade.height = h

  baseCtx.fillStyle = '#000'
  baseCtx.fillRect(0, 0, w, h)

  base.addEventListener('mousemove',  onMouseMove)
  base.addEventListener('touchstart', onTouchStart, { passive: false })
  base.addEventListener('touchmove',  onTouchMove,  { passive: false })
  window.addEventListener('resize', resizeCanvases)

  rafId = requestAnimationFrame(loop)
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
  const base = baseCanvas.value
  if (base) {
    base.removeEventListener('mousemove',  onMouseMove)
    base.removeEventListener('touchstart', onTouchStart)
    base.removeEventListener('touchmove',  onTouchMove)
  }
  window.removeEventListener('resize', resizeCanvases)
})
</script>
