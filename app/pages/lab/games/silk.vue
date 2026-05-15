<template>
  <div class="min-h-screen bg-black relative overflow-hidden">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'games', href: '/lab' }, { label: 'silk' }]" />

    <canvas ref="baseCanvas" class="absolute inset-0 w-full h-full" style="touch-action:none;" />

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

          <div v-if="colorMode==='rainbow'">
            <label class="text-white/30 text-[9px] block mb-1">hue speed</label>
            <input v-model.number="hueSpeed" type="range" min="0" max="4" step="0.1" class="w-full h-1 accent-white" />
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

        <!-- Brush size -->
        <div>
          <label class="text-white/30 text-[9px] block mb-1">brush <span class="text-white/50">{{brushSize}}</span></label>
          <input v-model.number="brushSize" type="range" min="1" max="5" step="0.5" class="w-full h-1 accent-white" />
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
      press &amp; drag to paint · {{symmetry}}-axis symmetry
    </div>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `Silk | ${siteName}` })

// ---- refs ----
const baseCanvas = ref<HTMLCanvasElement | null>(null)

// ---- settings ----
const symmetry   = ref(6)
const fadeAmount = ref(8)
const hueSpeed   = ref(0.5)
const brushSize  = ref(2)
const colorMode  = ref<'rainbow'|'fixed'>('rainbow')
const fixedHex   = ref('#00d4ff')
const presets    = ['#00d4ff','#ff00aa','#ff6b35','#39ff14','#b400ff','#ffffff']

// ---- Perlin Noise ----
const perm = new Uint8Array(512)

function initNoise() {
  for (let i = 0; i < 256; i++) perm[i] = i
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = perm[i]!
    perm[i] = perm[j]!
    perm[j] = tmp
  }
  for (let i = 0; i < 256; i++) perm[i + 256] = perm[i]!
}

function fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10) }
function lerp(a: number, b: number, t: number) { return a + t * (b - a) }

function grad(hash: number, x: number, y: number): number {
  const h = hash & 3
  return (h < 2 ? x : -x) + (h & 1 ? y : -y)
}

function noise2d(x: number, y: number): number {
  const xi = Math.floor(x) & 255
  const yi = Math.floor(y) & 255
  const xf = x - Math.floor(x)
  const yf = y - Math.floor(y)
  const u = fade(xf)
  const v = fade(yf)
  const a = perm[xi]! + yi
  const b = perm[xi + 1]! + yi
  return lerp(
    lerp(grad(perm[a]!, xf, yf), grad(perm[b]!, xf - 1, yf), u),
    lerp(grad(perm[a + 1]!, xf, yf - 1), grad(perm[b + 1]!, xf - 1, yf - 1), u),
    v
  ) * 0.5 + 0.5
}

// ---- Particle System ----
interface Particle {
  x: number; y: number
  px: number; py: number
  inputVx: number; inputVy: number
  life: number
  hue: number
}

let particles: Particle[] = []

function addPoint(x: number, y: number, vx: number, vy: number) {
  particles.push({
    x, y,
    px: x - vx,
    py: y - vy,
    inputVx: vx,
    inputVy: vy,
    life: 150,
    hue: currentHue,
  })
}

function stepParticles(time: number) {
  const canvas = baseCanvas.value
  if (!canvas) return

  for (let i = 0; i < particles.length; i++) {
    const pt = particles[i]!

    const noiseVal = noise2d(
      pt.x * 0.02 + time * 0.005,
      pt.y * 0.02 + time * 0.005
    )
    const noiseAngle = noiseVal * Math.PI * 5

    let accx = Math.cos(noiseAngle) * 1.0
    let accy = Math.sin(noiseAngle) * 1.0

    accx += pt.inputVx * 0.3
    accy += pt.inputVy * 0.3
    pt.inputVx *= 0.98
    pt.inputVy *= 0.98

    const newX = pt.x + (pt.x - pt.px) * 0.975 + accx
    const newY = pt.y + (pt.y - pt.py) * 0.975 + accy
    pt.px = pt.x
    pt.py = pt.y
    pt.x = newX
    pt.y = newY
    pt.life--
  }

  particles = particles.filter(pt => pt.life > 0)
}

// ---- Drawing ----
function hexToRgb(hex: string) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  }
}

function getStrokeColor(h: number, alpha: number): string {
  if (colorMode.value === 'fixed') {
    const { r, g, b } = hexToRgb(fixedHex.value)
    return `rgba(${r},${g},${b},${alpha})`
  }
  return `hsla(${h},100%,65%,${alpha})`
}

function drawCurve(
  ctx: CanvasRenderingContext2D,
  pts: Particle[],
  cx: number,
  cy: number,
  flipY: boolean
) {
  if (pts.length < 2) return

  const sy = flipY ? -1 : 1

  // Draw 3 layers for glow effect
  const layers = [
    { lw: brushSize.value * 1.5, alpha: 0.05 },
    { lw: brushSize.value * 1.0, alpha: 0.09 },
    { lw: brushSize.value * 0.5, alpha: 0.09 },
  ]

  for (const layer of layers) {
    ctx.beginPath()
    ctx.moveTo(pts[0]!.x - cx, (pts[0]!.y - cy) * sy)
    for (let i = 1; i < pts.length - 1; i++) {
      const p1 = pts[i]!
      const p2 = pts[i + 1]!
      const mx = (p1.x + p2.x) / 2 - cx
      const my = ((p1.y + p2.y) / 2 - cy) * sy
      ctx.quadraticCurveTo(p1.x - cx, (p1.y - cy) * sy, mx, my)
    }
    const last = pts[pts.length - 1]!
    ctx.lineTo(last.x - cx, (last.y - cy) * sy)

    // Use hue from the most recent particle
    const h = pts[pts.length - 1]!.hue
    ctx.strokeStyle = getStrokeColor(h, layer.alpha)
    ctx.lineWidth = layer.lw
    ctx.globalCompositeOperation = 'lighter'
    ctx.globalAlpha = 1
    ctx.stroke()
  }
}

function drawSymmetric(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  if (particles.length < 2) return

  const n = symmetry.value
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 / n) * i

    // Normal
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(angle)
    drawCurve(ctx, particles, cx, cy, false)
    ctx.restore()

    // Mirrored
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(angle)
    ctx.scale(1, -1)
    drawCurve(ctx, particles, cx, cy, false)
    ctx.restore()
  }
}

// ---- State ----
let baseCtx: CanvasRenderingContext2D | null = null
let currentHue = 0
let time = 0
let rafId = 0
let isPressed = false
let mouseX = -9999
let mouseY = -9999
let prevX = -9999
let prevY = -9999

// ---- Main Loop ----
function loop() {
  const canvas = baseCanvas.value
  const ctx = baseCtx
  if (!canvas || !ctx) {
    rafId = requestAnimationFrame(loop)
    return
  }

  const cx = canvas.width / 2
  const cy = canvas.height / 2

  currentHue = (currentHue + hueSpeed.value) % 360
  time++

  // Add particle at current mouse position if pressed
  if (isPressed && prevX > -9000) {
    const vx = mouseX - prevX
    const vy = mouseY - prevY
    if (Math.hypot(vx, vy) > 0.5) {
      addPoint(mouseX, mouseY, vx, vy)
    }
  }

  // Step physics
  stepParticles(time)

  // Fade (directly on base canvas)
  if (fadeAmount.value > 0) {
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
    ctx.fillStyle = `rgba(0,0,0,${fadeAmount.value / 2000})`
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  // Draw
  drawSymmetric(ctx, cx, cy)

  // Update prev position
  if (isPressed) {
    prevX = mouseX
    prevY = mouseY
  }

  rafId = requestAnimationFrame(loop)
}

// ---- Event Handlers ----
function getPos(e: MouseEvent | Touch) {
  const canvas = baseCanvas.value!
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  }
}

function onMouseDown(e: MouseEvent) {
  const pos = getPos(e)
  isPressed = true
  mouseX = pos.x; mouseY = pos.y
  prevX = pos.x; prevY = pos.y
}
function onMouseMove(e: MouseEvent) {
  const pos = getPos(e)
  mouseX = pos.x; mouseY = pos.y
}
function onMouseUp() {
  isPressed = false
  prevX = -9999; prevY = -9999
}
function onTouchStart(e: TouchEvent) {
  e.preventDefault()
  const pos = getPos(e.touches[0]!)
  isPressed = true
  mouseX = pos.x; mouseY = pos.y
  prevX = pos.x; prevY = pos.y
}
function onTouchMove(e: TouchEvent) {
  e.preventDefault()
  const pos = getPos(e.touches[0]!)
  mouseX = pos.x; mouseY = pos.y
}
function onTouchEnd() {
  isPressed = false
  prevX = -9999; prevY = -9999
}

// ---- Utils ----
function clearAll() {
  if (!baseCtx || !baseCanvas.value) return
  particles = []
  baseCtx.globalCompositeOperation = 'source-over'
  baseCtx.globalAlpha = 1
  baseCtx.fillStyle = '#000'
  baseCtx.fillRect(0, 0, baseCanvas.value.width, baseCanvas.value.height)
}

function saveImage() {
  const canvas = baseCanvas.value
  if (!canvas) return
  const a = document.createElement('a')
  a.href = canvas.toDataURL('image/png')
  a.download = `silk-${Date.now()}.png`
  a.click()
}

function resizeCanvas() {
  const canvas = baseCanvas.value
  if (!canvas || !baseCtx) return
  const tmp = document.createElement('canvas')
  tmp.width = canvas.width; tmp.height = canvas.height
  tmp.getContext('2d')!.drawImage(canvas, 0, 0)
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  baseCtx.globalCompositeOperation = 'source-over'
  baseCtx.fillStyle = '#000'
  baseCtx.fillRect(0, 0, canvas.width, canvas.height)
  baseCtx.drawImage(tmp, 0, 0)
}

// ---- Lifecycle ----
onMounted(() => {
  initNoise()

  const canvas = baseCanvas.value!
  baseCtx = canvas.getContext('2d')!
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  baseCtx.fillStyle = '#000'
  baseCtx.fillRect(0, 0, canvas.width, canvas.height)

  canvas.addEventListener('mousedown',  onMouseDown)
  canvas.addEventListener('mousemove',  onMouseMove)
  canvas.addEventListener('mouseup',    onMouseUp)
  window.addEventListener('mouseup',    onMouseUp)
  canvas.addEventListener('touchstart', onTouchStart, { passive: false })
  canvas.addEventListener('touchmove',  onTouchMove,  { passive: false })
  canvas.addEventListener('touchend',   onTouchEnd)
  window.addEventListener('resize', resizeCanvas)

  rafId = requestAnimationFrame(loop)
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
  const canvas = baseCanvas.value
  if (canvas) {
    canvas.removeEventListener('mousedown',  onMouseDown)
    canvas.removeEventListener('mousemove',  onMouseMove)
    canvas.removeEventListener('mouseup',    onMouseUp)
    canvas.removeEventListener('touchstart', onTouchStart)
    canvas.removeEventListener('touchmove',  onTouchMove)
    canvas.removeEventListener('touchend',   onTouchEnd)
  }
  window.removeEventListener('mouseup',  onMouseUp)
  window.removeEventListener('resize', resizeCanvas)
})
</script>
