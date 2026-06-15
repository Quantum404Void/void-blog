<template>
  <div class="min-h-screen bg-black relative">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'games', href: '/lab' }, { label: 'silk' }]" />

    <canvas ref="canvasEl" class="absolute inset-0 w-full h-full" style="touch-action:none;cursor:crosshair" />

    <!-- Controls -->
    <div class="absolute top-14 right-4 z-10 font-mono text-xs select-none">
      <div class="bg-black/80 border border-white/10 rounded-xl p-3 backdrop-blur-sm flex flex-col gap-3" style="min-width:160px">
        <p class="text-white/40 text-[9px] tracking-widest uppercase">silk</p>

        <div>
          <label class="text-white/30 text-[9px] block mb-1.5">symmetry</label>
          <div class="flex gap-1">
            <button v-for="n in [1,2,4,6,8]" :key="n" @click="symmetry=n"
              class="flex-1 py-1 rounded text-[10px] border transition-all"
              :style="symmetry===n ? 'border-color:rgba(255,255,255,0.5);color:#fff' : 'border-color:rgba(255,255,255,0.1);color:rgba(255,255,255,0.3)'"
            >{{n}}</button>
          </div>
        </div>

        <div>
          <label class="text-white/30 text-[9px] block mb-1">brush <span class="text-white/50">{{brushSize}}</span></label>
          <input v-model.number="brushSize" type="range" min="1" max="20" step="0.5" class="w-full h-1 accent-white" />
        </div>

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
          <div v-if="colorMode==='rainbow'">
            <label class="text-white/30 text-[9px] block mb-1">hue speed</label>
            <input v-model.number="hueSpeed" type="range" min="0" max="5" step="0.1" class="w-full h-1 accent-white" />
          </div>
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

        <button @click="clearCanvas"
          class="py-1.5 rounded border border-white/10 text-white/40 hover:text-white/70 hover:border-white/30 transition-all text-[10px] tracking-wider">
          clear
        </button>
        <button @click="saveImage"
          class="py-1.5 rounded border border-white/10 text-white/40 hover:text-white/70 hover:border-white/30 transition-all text-[10px] tracking-wider">
          save png
        </button>
      </div>
    </div>

    <div class="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-[10px] text-white/20 pointer-events-none whitespace-nowrap select-none">
      press &amp; drag to paint · {{symmetry === 1 ? 'no' : symmetry}}-axis symmetry
    </div>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `Silk | ${siteName}` })

// ---- settings ----
const symmetry  = ref(6)
const brushSize = ref(3)
const hueSpeed  = ref(1)
const colorMode = ref<'rainbow'|'fixed'>('rainbow')
const fixedHex  = ref('#00d4ff')
const presets   = ['#00d4ff','#ff00aa','#ff6b35','#39ff14','#b400ff','#ffffff']

const canvasEl = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null

// ---- 当前笔画路径 ----
let stroke: { x: number; y: number }[] = []
let isDrawing = false
let hue = Math.random() * 360
let rafId = 0

// ---- 颜色 ----
function getColor(alpha: number): string {
  if (colorMode.value === 'fixed') {
    const r = parseInt(fixedHex.value.slice(1,3),16)
    const g = parseInt(fixedHex.value.slice(3,5),16)
    const b = parseInt(fixedHex.value.slice(5,7),16)
    return `rgba(${r},${g},${b},${alpha})`
  }
  return `hsla(${hue},100%,65%,${alpha})`
}

// ---- 绘制一条平滑 bezier 路径（相对中心坐标）----
function drawPath(points: { x: number; y: number }[], lw: number, alpha: number) {
  if (!ctx || points.length < 2) return
  ctx.beginPath()
  ctx.moveTo(points[0]!.x, points[0]!.y)
  for (let i = 1; i < points.length - 1; i++) {
    const p1 = points[i]!
    const p2 = points[i + 1]!
    ctx.quadraticCurveTo(p1.x, p1.y, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2)
  }
  ctx.lineTo(points[points.length - 1]!.x, points[points.length - 1]!.y)
  ctx.strokeStyle = getColor(alpha)
  ctx.lineWidth = lw
  ctx.stroke()
}

// ---- 对称绘制最新的一小段（从倒数第2点到最新点）----
function drawLatestSegment() {
  if (!ctx || stroke.length < 2) return
  const canvas = canvasEl.value!
  const cx = canvas.width / 2
  const cy = canvas.height / 2
  const n = symmetry.value

  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // 取最近的几个点（平滑过渡）
  const recent = stroke.slice(-8)
  // 转为相对中心坐标
  const rel = recent.map(p => ({ x: p.x - cx, y: p.y - cy }))

  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 / n) * i

    // 正向
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(angle)
    drawPath(rel, brushSize.value * 1.8, 0.04)
    drawPath(rel, brushSize.value * 0.9, 0.12)
    drawPath(rel, brushSize.value * 0.4, 0.55)
    ctx.restore()

    // 镜像
    if (n > 1) {
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(angle)
      ctx.scale(1, -1)
      drawPath(rel, brushSize.value * 1.8, 0.04)
      drawPath(rel, brushSize.value * 0.9, 0.12)
      drawPath(rel, brushSize.value * 0.4, 0.55)
      ctx.restore()
    }
  }

  ctx.restore()
}

// ---- RAF：只更新色相，实际绘制在 mousemove 里触发 ----
function loop() {
  hue = (hue + hueSpeed.value) % 360
  rafId = requestAnimationFrame(loop)
}

// ---- 坐标转换 ----
function getPos(e: MouseEvent | Touch) {
  const canvas = canvasEl.value!
  const rect = canvas.getBoundingClientRect()
  const sx = canvas.width / rect.width
  const sy = canvas.height / rect.height
  return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy }
}

// ---- 事件 ----
function onPointerDown(e: MouseEvent | TouchEvent) {
  if (e instanceof TouchEvent) e.preventDefault()
  const pos = getPos(e instanceof TouchEvent ? e.touches[0]! : e)
  isDrawing = true
  stroke = [pos]
}

function onPointerMove(e: MouseEvent | TouchEvent) {
  if (e instanceof TouchEvent) e.preventDefault()
  if (!isDrawing) return
  const pos = getPos(e instanceof TouchEvent ? e.touches[0]! : e)
  stroke.push(pos)
  drawLatestSegment()
}

function onPointerUp() {
  isDrawing = false
  stroke = []
}

function clearCanvas() {
  const canvas = canvasEl.value
  if (!canvas || !ctx) return
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
}

function saveImage() {
  const canvas = canvasEl.value
  if (!canvas) return
  const a = document.createElement('a')
  a.href = canvas.toDataURL('image/png')
  a.download = `silk-${Date.now()}.png`
  a.click()
}

function resize() {
  const canvas = canvasEl.value
  if (!canvas || !ctx) return
  const tmp = document.createElement('canvas')
  tmp.width = canvas.width; tmp.height = canvas.height
  tmp.getContext('2d')!.drawImage(canvas, 0, 0)
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(tmp, (canvas.width - tmp.width) / 2, (canvas.height - tmp.height) / 2)
}

let _resize: () => void

onMounted(() => {
  const canvas = canvasEl.value!
  ctx = canvas.getContext('2d')!
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  canvas.addEventListener('mousedown',  onPointerDown)
  canvas.addEventListener('mousemove',  onPointerMove)
  canvas.addEventListener('mouseup',    onPointerUp)
  window.addEventListener('mouseup',    onPointerUp)
  canvas.addEventListener('touchstart', onPointerDown, { passive: false })
  canvas.addEventListener('touchmove',  onPointerMove, { passive: false })
  canvas.addEventListener('touchend',   onPointerUp)

  _resize = resize
  window.addEventListener('resize', _resize)
  rafId = requestAnimationFrame(loop)
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
  const canvas = canvasEl.value
  if (canvas) {
    canvas.removeEventListener('mousedown',  onPointerDown)
    canvas.removeEventListener('mousemove',  onPointerMove)
    canvas.removeEventListener('mouseup',    onPointerUp)
    canvas.removeEventListener('touchstart', onPointerDown)
    canvas.removeEventListener('touchmove',  onPointerMove)
    canvas.removeEventListener('touchend',   onPointerUp)
  }
  window.removeEventListener('mouseup',  onPointerUp)
  window.removeEventListener('resize',   _resize)
})
</script>
