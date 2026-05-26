<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'games', href: '/lab' }, { label: 'audio-visualizer' }]" />

    <div class="max-w-4xl mx-auto px-6 py-10">
      <h1 class="font-mono text-2xl font-bold mb-2" style="color:#00d4ff;text-shadow:0 0 20px rgba(0,212,255,0.5)">音频可视化</h1>
      <p class="font-mono text-xs text-gray-500 mb-8">Audio Visualizer — FFT / Waveform / Polar</p>

      <!-- Controls -->
      <div class="flex flex-wrap gap-4 mb-6 items-center">
        <div class="flex gap-2">
          <button
            v-for="src in ['mic','tone','file']" :key="src"
            @click="setSource(src as 'mic'|'tone'|'file')"
            class="font-mono text-xs px-4 py-2 rounded-lg border transition-all"
            :style="source===src ? 'border-color:#00d4ff;color:#00d4ff;background:rgba(0,212,255,0.1)' : 'border-color:rgba(255,255,255,0.15);color:#666'"
          >{{ src==='mic'?'🎤 麦克风':src==='tone'?'🎵 音调':'📁 文件' }}</button>
        </div>

        <!-- 文件状态 -->
        <div v-if="source==='file'" class="flex items-center gap-3">
          <span v-if="fileName" class="font-mono text-[11px] text-cyan-400 max-w-[160px] truncate" :title="fileName">{{ fileName }}</span>
          <span v-else class="font-mono text-[11px] text-gray-500">未选择文件</span>
          <button v-if="fileName" @click="setSource('file')" class="font-mono text-[10px] px-2 py-1 rounded border border-gray-700 text-gray-400 hover:border-cyan-800 transition-all">更换</button>
          <div v-if="fileProgress > 0 && fileProgress < 100" class="flex items-center gap-2">
            <div class="w-20 h-1 bg-gray-800 rounded-full overflow-hidden">
              <div class="h-full bg-cyan-400 transition-all" :style="{width: fileProgress+'%'}"></div>
            </div>
            <span class="font-mono text-[10px] text-gray-500">{{ fileProgress }}%</span>
          </div>
        </div>

        <template v-if="source==='tone'">
          <label class="font-mono text-xs text-gray-400 flex items-center gap-2">
            频率
            <input type="range" min="100" max="2000" step="10" v-model.number="toneFreq" @input="updateOscillator" class="w-28 accent-cyan-400" />
            <span class="text-cyan-400 w-14">{{ toneFreq }}Hz</span>
          </label>
          <label class="font-mono text-xs text-gray-400 flex items-center gap-2">
            音量
            <input type="range" min="0" max="1" step="0.01" v-model.number="toneVolume" @input="updateGain" class="w-24 accent-purple-400" />
          </label>
        </template>

        <div class="flex gap-2">
          <button
            v-for="m in modes" :key="m.key"
            @click="mode=m.key"
            class="font-mono text-[10px] px-3 py-1.5 rounded border transition-all"
            :style="mode===m.key ? 'border-color:#b400ff;color:#b400ff;background:rgba(180,0,255,0.1)' : 'border-color:rgba(255,255,255,0.15);color:#666'"
          >{{ m.label }}</button>
        </div>

        <div class="ml-auto flex items-center gap-3">
          <span class="font-mono text-xs text-green-400">BPM: <span class="text-white font-bold">{{ bpm || '—' }}</span></span>
          <button @click="toggleActive" class="font-mono text-xs px-4 py-2 rounded-lg border transition-all"
            :style="active ? 'border-color:#ff2d78;color:#ff2d78;background:rgba(255,45,120,0.1)' : 'border-color:rgba(57,255,20,0.4);color:#39ff14;background:rgba(57,255,20,0.1)'">
            {{ active ? '⏹ 停止' : '▶ 开始' }}
          </button>
        </div>
      </div>

      <!-- Canvas -->
      <div ref="containerEl" class="rounded-2xl overflow-hidden border border-gray-800 relative" style="background:#050508">
        <canvas ref="canvasEl" class="block"
          @mousemove="onMouseMove"
          @mouseleave="hoverFreq=null"
        />
        <div v-if="hoverFreq !== null" class="absolute top-2 right-3 font-mono text-[10px] text-cyan-400 bg-black/60 px-2 py-1 rounded pointer-events-none">
          {{ hoverFreq }} Hz
        </div>
      </div>

      <div v-if="error" class="mt-4 font-mono text-xs text-red-400 bg-red-900/20 rounded-lg p-3 border border-red-800">{{ error }}</div>
    </div>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const { siteName } = useSiteConfig()
useSeoMeta({ title: `音频可视化 | ${siteName}` })

const canvasEl = ref<HTMLCanvasElement | null>(null)
const containerEl = ref<HTMLElement | null>(null)
const active = ref(false)
const source = ref<'mic'|'tone'|'file'>('tone')
const mode = ref<'bars'|'wave'|'polar'>('bars')
const toneFreq = ref(440)
const toneVolume = ref(0.5)
const bpm = ref<number|null>(null)
const error = ref('')
const fileName = ref('')
const fileProgress = ref(0)
let audioBuffer: AudioBuffer | null = null
let bufferSource: AudioBufferSourceNode | null = null
let fileInputEl: HTMLInputElement | null = null
const hoverFreq = ref<number|null>(null)

const PIXEL_RATIO = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1
let cw = 800, ch = 360  // logical size

const modes = [
  { key: 'bars', label: '频域柱状' },
  { key: 'wave', label: '波形' },
  { key: 'polar', label: '圆形极坐标' },
]

let audioCtx: AudioContext | null = null
let analyser: AnalyserNode | null = null
let oscillator: OscillatorNode | null = null
let gainNode: GainNode | null = null
let micStream: MediaStream | null = null
let micSource: MediaStreamAudioSourceNode | null = null
let rafId = 0
let resizeObserver: ResizeObserver | null = null
let ctxScaled = false

// BPM detection
const energyHistory: number[] = []
const beatTimes: number[] = []
let lastBeatTime = 0

function resizeCanvas() {
  const el = canvasEl.value
  if (!el) return
  const container = containerEl.value
  if (!container) return
  cw = container.clientWidth || 800
  ch = Math.round(cw * 0.45)
  el.width = cw * PIXEL_RATIO
  el.height = ch * PIXEL_RATIO
  el.style.width = cw + 'px'
  el.style.height = ch + 'px'
  ctxScaled = false
}

function getScaledCtx(): CanvasRenderingContext2D | null {
  const el = canvasEl.value
  if (!el) return null
  const ctx = el.getContext('2d')
  if (!ctx) return null
  if (!ctxScaled) {
    ctx.setTransform(PIXEL_RATIO, 0, 0, PIXEL_RATIO, 0, 0)
    ctxScaled = true
  }
  return ctx
}

// Logarithmic frequency bins
function logBins(data: Uint8Array, bars: number): number[] {
  const nyquist = (audioCtx?.sampleRate ?? 44100) / 2
  const result = []
  for (let i = 0; i < bars; i++) {
    const logStart = Math.pow(10, Math.log10(20) + (i / bars) * (Math.log10(nyquist) - Math.log10(20)))
    const logEnd = Math.pow(10, Math.log10(20) + ((i + 1) / bars) * (Math.log10(nyquist) - Math.log10(20)))
    const binStart = Math.floor(logStart / nyquist * data.length)
    const binEnd = Math.ceil(logEnd / nyquist * data.length)
    let max = 0
    for (let j = Math.max(binStart, 0); j < Math.min(binEnd, data.length); j++) max = Math.max(max, data[j])
    result.push(max / 255)
  }
  return result
}

function onMouseMove(e: MouseEvent) {
  const el = canvasEl.value
  if (!el || !analyser) { hoverFreq.value = null; return }
  const rect = el.getBoundingClientRect()
  const x = e.clientX - rect.left
  const ratio = x / cw
  const nyquist = (audioCtx?.sampleRate ?? 44100) / 2
  // map x to log frequency
  const freq = Math.pow(10, Math.log10(20) + ratio * (Math.log10(nyquist) - Math.log10(20)))
  hoverFreq.value = Math.round(freq)
}

async function toggleActive() {
  if (active.value) {
    stopAll()
  } else {
    await startAudio()
  }
}

async function startAudio() {
  error.value = ''
  try {
    audioCtx = new AudioContext()
    analyser = audioCtx.createAnalyser()
    analyser.fftSize = 4096
    analyser.smoothingTimeConstant = 0.8

    gainNode = audioCtx.createGain()
    gainNode.gain.value = toneVolume.value

    if (source.value === 'tone') {
      oscillator = audioCtx.createOscillator()
      oscillator.type = 'sine'
      oscillator.frequency.value = toneFreq.value
      oscillator.connect(gainNode)
      gainNode.connect(analyser)
      analyser.connect(audioCtx.destination)
      oscillator.start()
    } else if (source.value === 'file') {
      if (!audioBuffer) { error.value = '请先上传音频文件'; audioCtx.close().catch(() => {}); return }
      bufferSource = audioCtx.createBufferSource()
      bufferSource.buffer = audioBuffer
      bufferSource.loop = true
      bufferSource.connect(gainNode)
      gainNode.connect(analyser)
      analyser.connect(audioCtx.destination)
      bufferSource.start()
      bufferSource.onended = () => { if (active.value) stopAll() }
    } else {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      micSource = audioCtx.createMediaStreamSource(micStream)
      micSource.connect(analyser)
    }

    active.value = true
    ctxScaled = false
    draw()
  } catch (e: any) {
    error.value = e.message || '无法启动音频'
  }
}

function stopAll() {
  cancelAnimationFrame(rafId)
  oscillator?.stop()
  oscillator?.disconnect()
  oscillator = null
  bufferSource?.stop()
  bufferSource?.disconnect()
  bufferSource = null
  micSource?.disconnect()
  micSource = null
  micStream?.getTracks().forEach(t => t.stop())
  micStream = null
  gainNode?.disconnect()
  gainNode = null
  analyser?.disconnect()
  analyser = null
  audioCtx?.close().catch(() => {})
  audioCtx = null
  active.value = false
  bpm.value = null

  const ctx = getScaledCtx()
  if (ctx) {
    ctx.fillStyle = '#050508'
    ctx.fillRect(0, 0, cw, ch)
  }
}

function updateOscillator() {
  oscillator?.frequency.setValueAtTime(toneFreq.value, audioCtx?.currentTime ?? 0)
}

function updateGain() {
  if (gainNode) gainNode.gain.value = toneVolume.value
}

function setSource(s: 'mic'|'tone'|'file') {
  const wasActive = active.value
  if (wasActive) stopAll()
  source.value = s
  if (s === 'file') {
    // 触发文件选择，不自动 startAudio
    if (!fileInputEl) {
      fileInputEl = document.createElement('input')
      fileInputEl.type = 'file'
      fileInputEl.accept = 'audio/*'
      fileInputEl.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) return
        fileName.value = file.name
        fileProgress.value = 0
        error.value = ''
        try {
          const ab = await file.arrayBuffer()
          fileProgress.value = 50
          const tmpCtx = new AudioContext()
          audioBuffer = await tmpCtx.decodeAudioData(ab)
          await tmpCtx.close()
          fileProgress.value = 100
        } catch (err: any) {
          error.value = '解码失败：' + err.message
          fileName.value = ''
          fileProgress.value = 0
        }
      }
    }
    fileInputEl.value = ''
    fileInputEl.click()
    return
  }
  if (wasActive) startAudio()
}

function draw() {
  if (!analyser || !canvasEl.value) return
  const bufLen = analyser.frequencyBinCount  // 2048
  const freqData = new Uint8Array(bufLen)
  const timeData = new Uint8Array(bufLen)

  function frame() {
    if (!analyser) return
    rafId = requestAnimationFrame(frame)
    analyser.getByteFrequencyData(freqData)
    analyser.getByteTimeDomainData(timeData)

    detectBeat(freqData)

    const ctx = getScaledCtx()
    if (!ctx) return

    ctx.fillStyle = 'rgba(5,5,8,0.85)'
    ctx.fillRect(0, 0, cw, ch)

    if (mode.value === 'bars') drawBars(ctx, freqData)
    else if (mode.value === 'wave') drawWave(ctx, timeData)
    else drawPolar(ctx, freqData, timeData)
  }
  frame()
}

function drawBars(ctx: CanvasRenderingContext2D, data: Uint8Array) {
  const bars = 96
  const bins = logBins(data, bars)
  const barW = (cw - bars) / bars

  for (let i = 0; i < bars; i++) {
    const val = bins[i]
    const h = val * ch * 0.9
    // neon green → cyan gradient
    const t = i / bars
    const r = Math.round(0 + t * 0)
    const g = Math.round(255 - t * (255 - 212))
    const b = Math.round(136 + t * (255 - 136))
    const color = `rgb(${r},${g},${b})`
    ctx.fillStyle = color
    ctx.shadowColor = color
    ctx.shadowBlur = 8
    ctx.fillRect(i * (barW + 1), ch - h, barW, h)
  }
  ctx.shadowBlur = 0

  // center line
  ctx.beginPath()
  ctx.strokeStyle = 'rgba(0,255,136,0.15)'
  ctx.lineWidth = 1
  ctx.moveTo(0, ch / 2)
  ctx.lineTo(cw, ch / 2)
  ctx.stroke()
}

function drawWave(ctx: CanvasRenderingContext2D, data: Uint8Array) {
  // Center line
  ctx.beginPath()
  ctx.strokeStyle = 'rgba(0,255,136,0.15)'
  ctx.lineWidth = 1
  ctx.moveTo(0, ch / 2)
  ctx.lineTo(cw, ch / 2)
  ctx.stroke()

  // Neon green → cyan gradient stroke
  const grad = ctx.createLinearGradient(0, 0, cw, 0)
  grad.addColorStop(0, '#00ff88')
  grad.addColorStop(1, '#00d4ff')

  ctx.beginPath()
  ctx.strokeStyle = grad
  ctx.lineWidth = 2
  ctx.shadowColor = '#00ff88'
  ctx.shadowBlur = 10
  const sliceW = cw / data.length
  let x = 0
  for (let i = 0; i < data.length; i++) {
    const v = data[i] / 128 - 1
    const y = (v * ch / 2) + ch / 2
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    x += sliceW
  }
  ctx.stroke()
  ctx.shadowBlur = 0
}

function drawPolar(ctx: CanvasRenderingContext2D, freqData: Uint8Array, timeData: Uint8Array) {
  const cx = cw / 2, cy = ch / 2
  const baseR = Math.min(cx, cy) * 0.3
  const outerR = Math.min(cx, cy) * 0.85

  // Inner circle: time-domain waveform
  ctx.beginPath()
  for (let i = 0; i < timeData.length; i++) {
    const v = timeData[i] / 128 - 1
    const angle = (i / timeData.length) * Math.PI * 2 - Math.PI / 2
    const r = baseR + v * baseR * 0.6
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.strokeStyle = 'rgba(0,255,136,0.7)'
  ctx.lineWidth = 1.5
  ctx.shadowColor = '#00ff88'
  ctx.shadowBlur = 8
  ctx.stroke()
  ctx.shadowBlur = 0

  // Outer ring: frequency bars
  const bars = 128
  const bins = logBins(freqData, bars)

  ctx.save()
  for (let i = 0; i < bars; i++) {
    const val = bins[i]
    const angle = (i / bars) * Math.PI * 2 - Math.PI / 2
    const r1 = baseR * 1.1
    const r2 = r1 + val * (outerR - r1)
    const hue = (i / bars) * 360
    const color = `hsl(${hue},100%,65%)`
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1)
    ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2)
    ctx.strokeStyle = color
    ctx.shadowColor = color
    ctx.shadowBlur = 6
    ctx.lineWidth = 2
    ctx.stroke()
  }
  ctx.restore()

  // base circle
  ctx.beginPath()
  ctx.arc(cx, cy, baseR, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(0,212,255,0.2)'
  ctx.lineWidth = 1
  ctx.shadowBlur = 0
  ctx.stroke()
}

function detectBeat(freqData: Uint8Array) {
  // Energy in bass band (first 10 bins)
  let energy = 0
  for (let i = 0; i < 10; i++) energy += freqData[i]
  energy /= 10 * 255

  energyHistory.push(energy)
  if (energyHistory.length > 43) energyHistory.shift()

  const avg = energyHistory.reduce((a, b) => a + b, 0) / energyHistory.length
  // variance-based threshold
  const variance = energyHistory.reduce((a, b) => a + (b - avg) ** 2, 0) / energyHistory.length
  const stddev = Math.sqrt(variance)

  const now = performance.now()
  if (energy > avg + 1.5 * stddev && energy > 0.05 && now - lastBeatTime > 200) {
    lastBeatTime = now
    beatTimes.push(now)
    while (beatTimes.length > 8) beatTimes.shift()
    if (beatTimes.length >= 2) {
      const intervals: number[] = []
      for (let i = 1; i < beatTimes.length; i++) intervals.push(beatTimes[i] - beatTimes[i-1])
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
      bpm.value = Math.round(60000 / avgInterval)
    }
  }
}

onMounted(() => {
  resizeCanvas()
  resizeObserver = new ResizeObserver(() => {
    resizeCanvas()
    if (!active.value) {
      const ctx = getScaledCtx()
      if (ctx) {
        ctx.fillStyle = '#050508'
        ctx.fillRect(0, 0, cw, ch)
      }
    }
  })
  if (containerEl.value) resizeObserver.observe(containerEl.value)
})

onUnmounted(() => {
  stopAll()
  resizeObserver?.disconnect()
  if (fileInputEl) { fileInputEl.onchange = null; fileInputEl = null }
  audioBuffer = null
})
</script>
