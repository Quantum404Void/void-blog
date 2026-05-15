<template>
  <div class="min-h-screen" style="background:var(--color-void);color:#e0e0e0">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'tools', href: '/lab' }, { label: 'Pomodoro' }]" />
    <div class="max-w-xl mx-auto px-4 py-12 flex flex-col items-center">
      <h1 class="text-3xl font-bold mb-2" style="color:#39ff14;font-family:monospace">
        <span style="color:#00ffff">~/</span>pomodoro
      </h1>
      <p class="mb-10 text-sm" style="color:#666">Focus. Rest. Repeat.</p>

      <!-- Mode tabs -->
      <div class="flex gap-2 mb-10">
        <button
          v-for="m in modes"
          :key="m.key"
          @click="switchMode(m.key)"
          class="px-4 py-1 rounded text-xs font-mono transition-all"
          :style="mode===m.key
            ? 'background:#39ff14;color:#0a0a0f;border:1px solid #39ff14'
            : 'background:transparent;color:#555;border:1px solid #333'"
        >{{ m.label }}</button>
      </div>

      <!-- Progress ring + timer -->
      <div class="relative flex items-center justify-center mb-8" style="width:260px;height:260px">
        <svg width="260" height="260" style="position:absolute;top:0;left:0;transform:rotate(-90deg)">
          <circle cx="130" cy="130" r="115" fill="none" stroke="#1a1a1a" stroke-width="8" />
          <circle
            cx="130" cy="130" r="115" fill="none"
            :stroke="ringColor"
            stroke-width="8"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="dashOffset"
            style="transition:stroke-dashoffset 1s linear,stroke 0.3s"
          />
        </svg>
        <div class="text-center" style="z-index:1">
          <div class="font-mono font-bold" style="font-size:4rem;line-height:1;color:#39ff14;text-shadow:0 0 20px #39ff1480">
            {{ displayTime }}
          </div>
          <div class="text-xs mt-2 font-mono" :style="`color:${ringColor}`">{{ modeLabel }}</div>
        </div>
      </div>

      <!-- Controls -->
      <div class="flex gap-4 mb-10">
        <button
          @click="toggleTimer"
          class="px-8 py-3 rounded font-mono font-bold text-sm transition-all"
          style="background:#0a1a0a;border:2px solid #39ff14;color:#39ff14;min-width:120px"
          @mouseenter="($event.target as HTMLElement).style.background='#39ff14';($event.target as HTMLElement).style.color='#0a0a0f'"
          @mouseleave="($event.target as HTMLElement).style.background='#0a1a0a';($event.target as HTMLElement).style.color='#39ff14'"
        >
          {{ running ? '⏸ PAUSE' : '▶ START' }}
        </button>
        <button
          @click="resetTimer"
          class="px-6 py-3 rounded font-mono text-sm transition-all"
          style="background:transparent;border:1px solid #333;color:#555"
          @mouseenter="($event.target as HTMLElement).style.borderColor='#666';($event.target as HTMLElement).style.color='#999'"
          @mouseleave="($event.target as HTMLElement).style.borderColor='#333';($event.target as HTMLElement).style.color='#555'"
        >↺ RESET</button>
      </div>

      <!-- Stats -->
      <div class="flex gap-8 text-center mb-8">
        <div>
          <div class="text-2xl font-mono font-bold" style="color:#ff6b35">{{ pomodoroCount }}</div>
          <div class="text-xs font-mono" style="color:#555">POMODOROS</div>
        </div>
        <div>
          <div class="text-2xl font-mono font-bold" style="color:#00ffff">{{ completedPomodoros }}</div>
          <div class="text-xs font-mono" style="color:#555">TODAY</div>
        </div>
        <div>
          <div class="text-2xl font-mono font-bold" style="color:#39ff14">{{ Math.floor(completedPomodoros * 25 / 60) }}h{{ (completedPomodoros * 25) % 60 }}m</div>
          <div class="text-xs font-mono" style="color:#555">FOCUSED</div>
        </div>
      </div>

      <!-- Session dots -->
      <div class="flex gap-2">
        <div
          v-for="i in 4"
          :key="i"
          class="rounded-full transition-all"
          :style="`width:12px;height:12px;background:${i <= pomodoroCount % 4 || (pomodoroCount % 4 === 0 && pomodoroCount > 0 && i === 4 && mode === 'long') ? '#ff6b35' : '#1a1a1a'};border:1px solid ${i <= pomodoroCount % 4 || (pomodoroCount % 4 === 0 && pomodoroCount > 0 && mode === 'long') ? '#ff6b35' : '#333'}`"
        />
      </div>
      <p class="text-xs mt-2 font-mono" style="color:#333">{{ 4 - (pomodoroCount % 4 || 4) + (pomodoroCount % 4 === 0 ? 0 : 0) }} until long break</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const { siteName } = useSiteConfig()
useSeoMeta({ title: 'Pomodoro Timer — void.lab' })

type Mode = 'focus' | 'short' | 'long'

const DURATIONS: Record<Mode, number> = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
}

const modes = [
  { key: 'focus' as Mode, label: 'FOCUS 25' },
  { key: 'short' as Mode, label: 'SHORT 5' },
  { key: 'long' as Mode, label: 'LONG 15' },
]

const modeLabels: Record<Mode, string> = {
  focus: 'FOCUS TIME',
  short: 'SHORT BREAK',
  long: 'LONG BREAK',
}

const ringColors: Record<Mode, string> = {
  focus: '#39ff14',
  short: '#00ffff',
  long: '#ff6b35',
}

const mode = ref<Mode>('focus')
const running = ref(false)
const timeLeft = ref(DURATIONS.focus)
const pomodoroCount = ref(0)
const completedPomodoros = ref(0)
let interval: ReturnType<typeof setInterval> | null = null

const circumference = 2 * Math.PI * 115
const dashOffset = computed(() => {
  const ratio = timeLeft.value / DURATIONS[mode.value]
  return circumference * (1 - ratio)
})

const displayTime = computed(() => {
  const m = Math.floor(timeLeft.value / 60)
  const s = timeLeft.value % 60
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
})

const modeLabel = computed(() => modeLabels[mode.value])
const ringColor = computed(() => ringColors[mode.value])

watch(displayTime, (t) => {
  if (process.client) document.title = `${t} — ${modeLabels[mode.value]}`
})

function beep(type: 'start' | 'tick' | 'done') {
  if (!process.client) return
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)

  if (type === 'done') {
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.15)
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    osc.start(); osc.stop(ctx.currentTime + 0.6)
  } else if (type === 'start') {
    osc.frequency.setValueAtTime(660, ctx.currentTime)
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
    osc.start(); osc.stop(ctx.currentTime + 0.2)
  }
}

function notify(title: string, body: string) {
  if (!process.client) return
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' })
  }
}

function requestNotificationPermission() {
  if (process.client && 'Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

function toggleTimer() {
  if (running.value) {
    clearInterval(interval!)
    interval = null
    running.value = false
  } else {
    beep('start')
    requestNotificationPermission()
    running.value = true
    interval = setInterval(() => {
      if (timeLeft.value <= 0) {
        clearInterval(interval!)
        interval = null
        running.value = false
        onTimerDone()
        return
      }
      timeLeft.value--
    }, 1000)
  }
}

function onTimerDone() {
  beep('done')
  if (mode.value === 'focus') {
    pomodoroCount.value++
    completedPomodoros.value++
    const isLongBreak = pomodoroCount.value % 4 === 0
    notify('🍅 Pomodoro Done!', isLongBreak ? 'Take a long break (15 min)' : 'Take a short break (5 min)')
    switchMode(isLongBreak ? 'long' : 'short')
  } else {
    notify('⚡ Break Over', 'Time to focus!')
    switchMode('focus')
  }
}

function switchMode(m: Mode) {
  clearInterval(interval!)
  interval = null
  running.value = false
  mode.value = m
  timeLeft.value = DURATIONS[m]
}

function resetTimer() {
  clearInterval(interval!)
  interval = null
  running.value = false
  timeLeft.value = DURATIONS[mode.value]
}

onMounted(() => {
  if (process.client) requestNotificationPermission()
})

onUnmounted(() => {
  clearInterval(interval!)
  if (process.client) document.title = 'void.lab'
})
</script>
