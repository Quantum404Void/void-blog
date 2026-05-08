<template>
  <div class="doom-fire-page">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'games', href: '/lab' }, { label: 'Doom Fire' }]" />

    <main class="content">
      <div class="controls">
        <label class="ctrl-label">
          <span>intensity</span>
          <input
            type="range"
            min="0"
            max="36"
            v-model.number="intensity"
            class="slider"
          />
          <span class="val">{{ intensity }}</span>
        </label>

        <button class="btn" @click="togglePause">
          {{ paused ? '▶ resume' : '⏸ pause' }}
        </button>

        <span class="fps-display">{{ fps }} fps</span>
      </div>

      <div class="canvas-wrap">
        <canvas
          ref="canvasEl"
          :width="W"
          :height="H"
          class="fire-canvas"
          @click="onCanvasClick"
        />
      </div>

      <pre class="algo-info">
<span class="c">// DOOM Fire — Fabien Sanglard's algorithm</span>
<span class="k">for</span> each pixel (x, y) from top to bottom-1:
  decay  = rand() &amp; 1          <span class="c">// 0 or 1</span>
  src    = pixels[(y+1)*W + x] <span class="c">// pixel below</span>
  dst    = (x - decay + W) % W <span class="c">// drift left</span>
  pixels[y*W + dst] = max(0, src - decay)

<span class="c">// bottom row initialized to intensity (0–36)</span>
<span class="c">// click canvas to cool down local area</span>
      </pre>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'

useSeoMeta({ title: 'Doom Fire · lab' })

const W = 320
const H = 180

const PALETTE = [
  '#070707','#1f0707','#2f0f07','#470f07','#571707','#671f07','#771f07','#8f2707',
  '#9f2f07','#af3f07','#bf4707','#c74707','#df4f07','#df5707','#df5707','#d75f07',
  '#d7670f','#cf6f0f','#cf770f','#cf7f0f','#cf8717','#c78717','#c78f17','#c7971f',
  '#bf9f1f','#bf9f1f','#bfa727','#bfa727','#bfaf2f','#b7af2f','#b7b72f','#b7b737',
  '#cfcf6f','#dfdf9f','#efefc7','#ffffff',
]

// Pre-compute palette as RGBA Uint32 values for fast ImageData writes
const paletteRGBA: number[] = PALETTE.map(hex => {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 0xff
  const g = (n >> 8) & 0xff
  const b = n & 0xff
  return (255 << 24) | (b << 16) | (g << 8) | r // ABGR for little-endian canvas
})

const canvasEl = ref<HTMLCanvasElement | null>(null)
const intensity = ref(36)
const paused = ref(false)
const fps = ref(0)

const pixels = new Uint8Array(W * H)

function initBottom() {
  for (let x = 0; x < W; x++) {
    pixels[(H - 1) * W + x] = intensity.value
  }
}

function step() {
  for (let y = 0; y < H - 1; y++) {
    for (let x = 0; x < W; x++) {
      const decay = Math.random() < 0.5 ? 0 : 1
      const src = pixels[(y + 1) * W + x]
      const dst = (x - decay + W) % W
      pixels[y * W + dst] = Math.max(0, src - decay)
    }
  }
}

function render(ctx: CanvasRenderingContext2D, imgData: ImageData, buf32: Uint32Array) {
  for (let i = 0; i < W * H; i++) {
    buf32[i] = paletteRGBA[pixels[i]]
  }
  ctx.putImageData(imgData, 0, 0)
}

let rafId = 0
let lastTime = 0
let frameCount = 0
let fpsTimer = 0

function loop(ts: number) {
  rafId = requestAnimationFrame(loop)

  const dt = ts - lastTime
  lastTime = ts
  frameCount++
  fpsTimer += dt
  if (fpsTimer >= 1000) {
    fps.value = Math.round((frameCount * 1000) / fpsTimer)
    frameCount = 0
    fpsTimer = 0
  }

  if (paused.value) return

  initBottom()
  step()

  const canvas = canvasEl.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')!
  const imgData = ctx.createImageData(W, H)
  const buf32 = new Uint32Array(imgData.data.buffer)
  render(ctx, imgData, buf32)
}

function onCanvasClick(e: MouseEvent) {
  const canvas = canvasEl.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const scaleX = W / rect.width
  const scaleY = H / rect.height
  const cx = Math.floor((e.clientX - rect.left) * scaleX)
  const cy = Math.floor((e.clientY - rect.top) * scaleY)
  const r = 15
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r * r) continue
      const nx = (cx + dx + W) % W
      const ny = cy + dy
      if (ny >= 0 && ny < H) {
        pixels[ny * W + nx] = Math.max(0, pixels[ny * W + nx] - 20)
      }
    }
  }
}

watch(intensity, initBottom)

onMounted(() => {
  initBottom()
  rafId = requestAnimationFrame(loop)
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
})

function togglePause() {
  paused.value = !paused.value
}
</script>

<style scoped>
.doom-fire-page {
  min-height: 100vh;
  background: #0a0a0f;
  color: #e8e8f0;
  font-family: 'JetBrains Mono', 'Fira Mono', monospace;
}

.content {
  max-width: 700px;
  margin: 0 auto;
  padding: 2rem 1rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.controls {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
  padding: 0.75rem 1rem;
  background: rgba(0, 212, 255, 0.04);
  border: 1px solid rgba(0, 212, 255, 0.15);
  border-radius: 6px;
}

.ctrl-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: rgba(136, 136, 170, 0.8);
}

.slider {
  width: 120px;
  accent-color: #00ff88;
  cursor: pointer;
}

.val {
  min-width: 2ch;
  color: #00ff88;
  font-weight: 700;
}

.btn {
  padding: 0.3rem 0.8rem;
  background: transparent;
  border: 1px solid rgba(0, 212, 255, 0.4);
  color: #00d4ff;
  font-family: inherit;
  font-size: 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s;
}
.btn:hover {
  background: rgba(0, 212, 255, 0.1);
}

.fps-display {
  margin-left: auto;
  font-size: 0.75rem;
  color: rgba(136, 136, 170, 0.6);
}

.canvas-wrap {
  display: flex;
  justify-content: center;
}

.fire-canvas {
  width: 100%;
  max-width: 640px;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  border: 1px solid rgba(0, 212, 255, 0.12);
  border-radius: 4px;
  cursor: crosshair;
  display: block;
}

.algo-info {
  font-size: 0.72rem;
  line-height: 1.7;
  color: rgba(136, 136, 170, 0.7);
  background: rgba(0, 0, 0, 0.4);
  border-left: 3px solid rgba(0, 255, 136, 0.4);
  padding: 1rem 1.25rem;
  border-radius: 0 4px 4px 0;
  margin: 0;
  white-space: pre;
  overflow-x: auto;
}

.algo-info .c {
  color: rgba(0, 255, 136, 0.5);
}

.algo-info .k {
  color: #00d4ff;
}
</style>
