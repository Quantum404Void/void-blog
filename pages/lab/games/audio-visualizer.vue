<template>
  <div class="min-h-screen bg-[#0a0a0f]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'games', href: '/lab' }, { label: 'audio-visualizer' }]" />

    <div class="max-w-4xl mx-auto px-6 py-10">
      <h1 class="font-mono text-2xl font-bold mb-2" style="color:#00d4ff;text-shadow:0 0 20px rgba(0,212,255,0.5)">音频可视化</h1>
      <p class="font-mono text-xs text-gray-500 mb-8">Audio Visualizer — FFT / Waveform / Polar</p>

      <!-- Controls -->
      <div class="flex flex-wrap gap-4 mb-6 items-center">
        <div class="flex gap-2">
          <button
            v-for="src in ['mic','tone']" :key="src"
            @click="setSource(src as 'mic'|'tone')"
            class="font-mono text-xs px-4 py-2 rounded-lg border transition-all"
            :style="source===src ? 'border-color:#00d4ff;color:#00d4ff;background:rgba(0,212,255,0.1)' : 'border-color:rgba(255,255,255,0.15);color:#666'"
          >{{ src==='mic'?'🎤 麦克风':'🎵 音调' }}</button>
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
      <div class="rounded-2xl overflow-hidden border border-gray-800" style="background:#050508">
        <canvas ref="canvasEl" :width="canvasW" :height="canvasH" class="w-full block" />
      </div>

      <div v-if="error" class="mt-4 font-mono text-xs text-red-400 bg-red-900/20 rounded-lg p-3 border border-red-800">{{ error }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const { siteName } = useSiteConfig()
useSeoMeta({ title: `音频可视化 | ${siteName}` })

const canvasEl = ref<HTMLCanvasElement | null>(null)
const canvasW = 800
const canvasH = 400
const active = ref(false)
const source = ref<'mic'|'tone'>('tone')
const mode = ref<'bars'|'wave'|'polar'>('bars')
const toneFreq = ref(440)
const toneVolume = ref(0.5)
const bpm = ref<number|null>(null)
const error = ref('')

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

// BPM detection
const energyHistory: number[] = []
const beatTimes: number[] = []

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
    analyser.fftSize = 2048
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
    } else {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      micSource = audioCtx.createMediaStreamSource(micStream)
      micSource.connect(analyser)
    }

    active.value = true
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
  micSource?.disconnect()
  micSource = null
  micStream?.getTracks().forEach(t => t.stop())
  micStream = null
  gainNode?.disconnect()
  gainNode = null
  analyser?.disconnect()
  analyser = null
  audioCtx?.close()
  audioCtx = null
  active.value = false
  bpm.value = null

  // Clear canvas
  const canvas = canvasEl.value
  if (canvas) {
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#050508'
    ctx.fillRect(0, 0, canvasW, canvasH)
  }
}

function updateOscillator() {
  oscillator?.frequency.setValueAtTime(toneFreq.value, audioCtx?.currentTime ?? 0)
}

function updateGain() {
  if (gainNode) gainNode.gain.value = toneVolume.value
}

function setSource(s: 'mic'|'tone') {
  const wasActive = active.value
  if (wasActive) stopAll()
  source.value = s
  if (wasActive) startAudio()
}

function draw() {
  if (!analyser || !canvasEl.value) return
  const canvas = canvasEl.value
  const ctx = canvas.getContext('2d')!
  const bufLen = analyser.frequencyBinCount
  const freqData = new Uint8Array(bufLen)
  const timeData = new Uint8Array(bufLen)

  function frame() {
    if (!analyser) return
    rafId = requestAnimationFrame(frame)
    analyser.getByteFrequencyData(freqData)
    analyser.getByteTimeDomainData(timeData)

    detectBeat(freqData)

    ctx.fillStyle = 'rgba(5,5,8,0.85)'
    ctx.fillRect(0, 0, canvasW, canvasH)

    if (mode.value === 'bars') drawBars(ctx, freqData)
    else if (mode.value === 'wave') drawWave(ctx, timeData)
    else drawPolar(ctx, freqData)
  }
  frame()
}

function drawBars(ctx: CanvasRenderingContext2D, data: Uint8Array) {
  const bars = 64
  const step = Math.floor(data.length / bars)
  const barW = canvasW / bars - 1
  for (let i = 0; i < bars; i++) {
    const val = data[i * step] / 255
    const h = val * canvasH * 0.9
    const hue = 120 + i / bars * 180 // green→cyan→purple
    const color = `hsl(${hue},100%,60%)`
    ctx.fillStyle = color
    ctx.shadowColor = color
    ctx.shadowBlur = 8
    ctx.fillRect(i * (barW + 1), canvasH - h, barW, h)
  }
  ctx.shadowBlur = 0
}

function drawWave(ctx: CanvasRenderingContext2D, data: Uint8Array) {
  ctx.beginPath()
  ctx.strokeStyle = '#00ff88'
  ctx.lineWidth = 2
  ctx.shadowColor = '#00ff88'
  ctx.shadowBlur = 10
  const sliceW = canvasW / data.length
  let x = 0
  for (let i = 0; i < data.length; i++) {
    const v = data[i] / 128 - 1
    const y = (v * canvasH / 2) + canvasH / 2
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    x += sliceW
  }
  ctx.stroke()
  ctx.shadowBlur = 0
}

function drawPolar(ctx: CanvasRenderingContext2D, data: Uint8Array) {
  const cx = canvasW / 2, cy = canvasH / 2
  const bars = 128
  const step = Math.floor(data.length / bars)
  const baseR = Math.min(cx, cy) * 0.3

  ctx.save()
  for (let i = 0; i < bars; i++) {
    const val = data[i * step] / 255
    const angle = (i / bars) * Math.PI * 2 - Math.PI / 2
    const r1 = baseR
    const r2 = baseR + val * baseR * 1.8
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

  // inner circle
  ctx.beginPath()
  ctx.arc(cx, cy, baseR, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(0,212,255,0.3)'
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
  if (energy > avg * 1.5 && energy > 0.1) {
    const now = performance.now()
    beatTimes.push(now)
    // keep last 8 beats
    while (beatTimes.length > 8) beatTimes.shift()
    if (beatTimes.length >= 2) {
      const intervals: number[] = []
      for (let i = 1; i < beatTimes.length; i++) intervals.push(beatTimes[i] - beatTimes[i-1])
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
      bpm.value = Math.round(60000 / avgInterval)
    }
  }
}

onUnmounted(() => {
  stopAll()
})
</script>
