<template>
  <div class="lissajous-page">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'games', href: '/lab' }, { label: 'lissajous' }]" />
    <div class="lis-container">
      <h1 class="title">Lissajous <span class="dim">Figure Generator</span></h1>

      <div class="main-layout">
        <!-- Left: main canvas -->
        <div class="canvas-col">
          <canvas ref="mainCanvas" class="main-canvas" />
          <div class="equation">
            x(t) = A·sin({{ paramA }}t + {{ phaseLabel }})&nbsp;&nbsp;
            y(t) = B·sin({{ paramB }}t)
          </div>
          <div class="canvas-btns">
            <button class="btn" @click="togglePause">{{ paused ? '▶ Resume' : '⏸ Pause' }}</button>
            <button class="btn" @click="doScreenshot">📷 Save</button>
            <button class="btn" @click="randomize">🎲 Random</button>
          </div>
          <div class="presets-row">
            <span class="presets-label">Presets:</span>
            <button
              v-for="p in presetList"
              :key="p.label"
              class="btn preset-btn"
              @click="applyPreset(p)"
            >{{ p.label }}</button>
          </div>
        </div>

        <!-- Right: controls + aux waves -->
        <div class="controls-col">
          <div class="sliders">
            <div class="slider-row" v-for="s in sliders" :key="s.key">
              <label>{{ s.label }}</label>
              <input
                type="range"
                :min="s.min"
                :max="s.max"
                :step="s.step"
                v-model.number="s.modelRef.value"
                @input="onParamChange"
              />
              <span class="slider-val">{{ displayVal(s) }}</span>
            </div>
          </div>

          <!-- Aux oscillators -->
          <div class="aux-label">Oscillators</div>
          <canvas ref="auxHCanvas" class="aux-canvas" />
          <canvas ref="auxVCanvas" class="aux-canvas" />
        </div>
      </div>
    </div>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

const { siteName } = useSiteConfig()
useSeoMeta({ title: 'Lissajous — Lab' })

// ── Parameters ────────────────────────────────────────────────────────────────
const paramA     = ref(3)
const paramB     = ref(2)
const phase      = ref(Math.PI / 4)
const amplitude  = ref(0.85)

const sliders = [
  { key: 'a', label: 'freq a', min: 1, max: 10, step: 1,       modelRef: paramA },
  { key: 'b', label: 'freq b', min: 1, max: 10, step: 1,       modelRef: paramB },
  { key: 'phase', label: 'phase δ', min: 0, max: 6.28, step: 0.01, modelRef: phase },
  { key: 'amp',   label: 'amplitude', min: 0.2, max: 1, step: 0.01, modelRef: amplitude },
]

function displayVal(s: typeof sliders[0]) {
  if (s.key === 'phase') return (phase.value / Math.PI).toFixed(2) + 'π'
  return s.modelRef.value
}

const phaseLabel = computed(() => (phase.value / Math.PI).toFixed(2) + 'π')

const presetList = [
  { label: '1:1', a: 1, b: 1, d: Math.PI / 4 },
  { label: '1:2', a: 1, b: 2, d: Math.PI / 2 },
  { label: '2:3', a: 2, b: 3, d: Math.PI / 4 },
  { label: '3:4', a: 3, b: 4, d: Math.PI / 6 },
  { label: '3:5', a: 3, b: 5, d: Math.PI / 4 },
]

function applyPreset(p: typeof presetList[0]) {
  paramA.value = p.a; paramB.value = p.b; phase.value = p.d
  resetTrail()
}

function randomize() {
  paramA.value = 1 + Math.floor(Math.random() * 9)
  paramB.value = 1 + Math.floor(Math.random() * 9)
  phase.value  = Math.random() * Math.PI * 2
  amplitude.value = 0.6 + Math.random() * 0.35
  resetTrail()
}

// ── Canvas refs ───────────────────────────────────────────────────────────────
const mainCanvas  = ref<HTMLCanvasElement | null>(null)
const auxHCanvas  = ref<HTMLCanvasElement | null>(null)
const auxVCanvas  = ref<HTMLCanvasElement | null>(null)

// ── Animation state ───────────────────────────────────────────────────────────
let t = 0
let paused = ref(false)
let rafId = 0

// Trail: array of {x, y, hue}
const TRAIL_LEN = 1200
let trail: { x: number; y: number; hue: number }[] = []
let hue = 0

function resetTrail() { trail = []; t = 0; hue = 0 }

function onParamChange() { resetTrail() }

// ── Draw helpers ──────────────────────────────────────────────────────────────
function drawMain() {
  const el = mainCanvas.value
  if (!el) return
  const ctx = el.getContext('2d')!
  const W = el.width, H = el.height
  const cx = W / 2, cy = H / 2
  const AX = cx * amplitude.value
  const AY = cy * amplitude.value

  // Fade trail
  ctx.fillStyle = 'rgba(10,10,15,0.18)'
  ctx.fillRect(0, 0, W, H)

  // Add new point
  const x = cx + AX * Math.sin(paramA.value * t + phase.value)
  const y = cy + AY * Math.sin(paramB.value * t)
  hue = (hue + 0.5) % 360
  trail.push({ x, y, hue })
  if (trail.length > TRAIL_LEN) trail.shift()

  // Draw trail
  for (let i = 1; i < trail.length; i++) {
    const alpha = (i / trail.length) * 0.9
    const p = trail[i], pp = trail[i - 1]
    ctx.strokeStyle = `hsla(${p.hue},100%,65%,${alpha})`
    ctx.lineWidth = 1.5
    ctx.shadowColor = `hsla(${p.hue},100%,65%,0.4)`
    ctx.shadowBlur = 6
    ctx.beginPath()
    ctx.moveTo(pp.x, pp.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
  }

  // Draw current dot
  ctx.shadowColor = `hsl(${hue},100%,80%)`
  ctx.shadowBlur = 20
  ctx.fillStyle = `hsl(${hue},100%,80%)`
  ctx.beginPath()
  ctx.arc(x, y, 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0
}

function drawAux() {
  ;[auxHCanvas, auxVCanvas].forEach((cvRef, idx) => {
    const el = cvRef.value
    if (!el) return
    const ctx = el.getContext('2d')!
    const W = el.width, H = el.height
    ctx.clearRect(0, 0, W, H)

    ctx.strokeStyle = 'rgba(0,212,255,0.15)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke()

    const freq  = idx === 0 ? paramA.value : paramB.value
    const delta = idx === 0 ? phase.value : 0
    const amp   = (H / 2 - 6) * amplitude.value

    ctx.strokeStyle = `hsl(${(hue + idx * 120) % 360},100%,65%)`
    ctx.lineWidth = 1.5
    ctx.shadowColor = ctx.strokeStyle
    ctx.shadowBlur = 8
    ctx.beginPath()
    for (let px = 0; px < W; px++) {
      const pct = px / W
      const tLocal = t - (1 - pct) * (Math.PI * 2 / freq)
      const vy = H / 2 - amp * Math.sin(freq * tLocal + delta)
      px === 0 ? ctx.moveTo(px, vy) : ctx.lineTo(px, vy)
    }
    ctx.stroke()
    ctx.shadowBlur = 0

    // current dot
    const curY = H / 2 - amp * Math.sin(freq * t + delta)
    ctx.fillStyle = `hsl(${(hue + idx * 120) % 360},100%,80%)`
    ctx.beginPath()
    ctx.arc(W - 4, curY, 3, 0, Math.PI * 2)
    ctx.fill()

    // label
    ctx.fillStyle = 'rgba(0,212,255,0.5)'
    ctx.font = '11px monospace'
    ctx.fillText(idx === 0 ? `a=${paramA.value}` : `b=${paramB.value}`, 6, 14)
  })
}

function resizeCanvas() {
  const el = mainCanvas.value
  if (el) { el.width = el.clientWidth; el.height = el.clientHeight }
  ;[auxHCanvas, auxVCanvas].forEach(r => {
    const e = r.value
    if (e) { e.width = e.clientWidth; e.height = e.clientHeight }
  })
}

function loop() {
  rafId = requestAnimationFrame(loop)
  if (!paused.value) {
    t += 0.012
    drawMain()
    drawAux()
  }
}

function togglePause() { paused.value = !paused.value }

function doScreenshot() {
  const el = mainCanvas.value
  if (!el) return
  const a = document.createElement('a')
  a.href = el.toDataURL('image/png')
  a.download = `lissajous-${paramA.value}-${paramB.value}.png`
  a.click()
}

onMounted(() => {
  nextTick(() => {
    resizeCanvas()
    const el = mainCanvas.value
    if (el) { const ctx = el.getContext('2d')!; ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0,0,el.width,el.height) }
    loop()
    window.addEventListener('resize', () => { resizeCanvas(); resetTrail() })
  })
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
  window.removeEventListener('resize', () => {})
})
</script>

<style scoped>
.lissajous-page {
  min-height: 100vh;
  background: #0a0a0f;
  color: #e0e0ff;
  font-family: 'JetBrains Mono', monospace, sans-serif;
}
.lis-container {
  max-width: 1050px;
  margin: 0 auto;
  padding: 20px 16px 40px;
}
.title {
  font-size: 1.6rem;
  font-weight: 700;
  color: #00d4ff;
  margin-bottom: 20px;
  letter-spacing: 0.05em;
}
.title .dim { color: rgba(0,212,255,0.4); font-weight: 400; }

.main-layout {
  display: grid;
  grid-template-columns: 1fr 240px;
  gap: 16px;
  align-items: start;
}

.canvas-col { display: flex; flex-direction: column; gap: 10px; }
.main-canvas {
  width: 100%;
  aspect-ratio: 1 / 1;
  max-height: 520px;
  border: 1px solid rgba(0,212,255,0.12);
  border-radius: 12px;
  background: #0a0a0f;
  display: block;
}
.equation {
  font-size: 0.78rem;
  color: rgba(0,212,255,0.6);
  background: rgba(0,0,0,0.3);
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid rgba(0,212,255,0.1);
}

.canvas-btns, .presets-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.presets-label { font-size: 0.78rem; color: rgba(255,255,255,0.35); }
.btn {
  padding: 5px 13px;
  border-radius: 6px;
  border: 1px solid rgba(0,212,255,0.3);
  background: rgba(0,212,255,0.06);
  color: rgba(0,212,255,0.8);
  font-family: inherit;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.15s;
}
.btn:hover { background: rgba(0,212,255,0.15); border-color: #00d4ff; color: #00d4ff; }
.preset-btn {
  padding: 3px 10px;
  font-size: 0.76rem;
  border-color: rgba(180,0,255,0.3);
  background: rgba(180,0,255,0.06);
  color: rgba(180,0,255,0.8);
}
.preset-btn:hover { background: rgba(180,0,255,0.15); border-color: #b400ff; color: #b400ff; }

/* Controls col */
.controls-col { display: flex; flex-direction: column; gap: 10px; }
.sliders {
  background: #0d0d1a;
  border: 1px solid rgba(0,212,255,0.12);
  border-radius: 10px;
  padding: 12px;
}
.slider-row {
  display: grid;
  grid-template-columns: 70px 1fr 50px;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.slider-row:last-child { margin-bottom: 0; }
label { font-size: 0.75rem; color: rgba(0,212,255,0.6); }
input[type=range] {
  -webkit-appearance: none;
  height: 4px;
  background: rgba(0,212,255,0.2);
  border-radius: 2px;
  outline: none;
}
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px; height: 14px;
  border-radius: 50%;
  background: #00d4ff;
  box-shadow: 0 0 6px #00d4ff;
  cursor: pointer;
}
.slider-val { font-size: 0.75rem; color: #00d4ff; text-align: right; }

.aux-label { font-size: 0.75rem; color: rgba(0,212,255,0.5); margin-bottom: 4px; }
.aux-canvas {
  width: 100%;
  height: 72px;
  display: block;
  background: #090912;
  border: 1px solid rgba(0,212,255,0.1);
  border-radius: 6px;
}

@media (max-width: 650px) {
  .main-layout { grid-template-columns: 1fr; }
}
</style>
