<template>
  <!-- 回到顶部 -->
  <Transition name="fade-up">
    <button v-if="showTop" @click="scrollTop"
      class="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-9 h-9 rounded-full border border-[var(--color-void-border)] bg-[var(--color-void-card)] text-[var(--color-text-muted)] hover:border-[rgba(0,212,255,0.4)] hover:text-[var(--color-neon-cyan)] transition-all flex items-center justify-center"
      title="回到顶部 ↑">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="18 15 12 9 6 15"/>
      </svg>
    </button>
  </Transition>

  <!-- Konami 彩蛋 -->
  <Transition name="konami">
    <div v-if="konamiActive" class="fixed inset-0 z-[999] flex items-center justify-center px-4 pointer-events-none">
      <div class="font-mono text-center pointer-events-auto max-w-full"
        style="background:rgba(0,0,0,0.92);padding:1.5rem 1.25rem;border:1px solid rgba(0,255,136,0.4);border-radius:1rem;box-shadow:0 0 60px rgba(0,255,136,0.2)">
        <pre class="text-[var(--color-neon-green)] text-[10px] sm:text-[11px] leading-tight mb-4 select-none overflow-x-auto">{{ matrixArt }}</pre>
        <div class="text-[var(--color-neon-cyan)] text-sm font-bold mb-1">// CHEAT CODE ACTIVATED</div>
        <div class="text-[var(--color-text-muted)] text-xs">↑↑↓↓←→←→BA — you know the way 🎮</div>
      </div>
    </div>
  </Transition>

  <!-- DOOM 彩蛋 -->
  <Transition name="konami">
    <div v-if="doomActive" class="fixed inset-0 z-[999] flex items-center justify-center px-4 pointer-events-none">
      <div class="font-mono pointer-events-auto doom-terminal w-full max-w-[22rem]"
        style="background:#000;padding:1.25rem 1rem;border:1px solid #00ff00;border-radius:0.5rem;box-shadow:0 0 40px rgba(0,255,0,0.3)">
        <pre class="text-[#00ff00] text-xs sm:text-sm leading-relaxed select-none whitespace-pre-wrap break-words">{{ doomText }}</pre>
      </div>
    </div>
  </Transition>

  <!-- sudo 彩蛋 -->
  <Transition name="konami">
    <div v-if="sudoActive" class="fixed inset-0 z-[999] flex items-center justify-center px-4 pointer-events-none">
      <div class="font-mono pointer-events-auto w-full max-w-[24rem]"
        style="background:#0d0d0d;padding:1.25rem 1rem;border:1px solid #444;border-radius:0.5rem;box-shadow:0 0 30px rgba(0,0,0,0.8)">
        <div class="text-[#cccccc] text-xs sm:text-sm leading-relaxed select-none whitespace-pre-wrap break-words">{{ sudoText }}</div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
// 回到顶部
const showTop = ref(false)
function onScroll() { showTop.value = window.scrollY > 400 }
function scrollTop() { window.scrollTo({ top: 0, behavior: 'smooth' }) }

// Konami code
const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a']
const konamiActive = ref(false)
let konamiTimer: ReturnType<typeof setTimeout>

// DOOM easter egg
const doomActive = ref(false)
const doomText = `> IDDQD ACTIVATED
> GOD MODE: ON
> HEALTH: ████████████ 200%
> [YOU ARE INVULNERABLE]`
let doomTimer: ReturnType<typeof setTimeout>

// sudo easter egg
const sudoActive = ref(false)
const sudoText = ref('')
let sudoTimer1: ReturnType<typeof setTimeout>
let sudoTimer2: ReturnType<typeof setTimeout>

const matrixArt = `
 ██╗   ██╗ ██████╗ ██╗██████╗
 ██║   ██║██╔═══██╗██║██╔══██╗
 ██║   ██║██║   ██║██║██║  ██║
 ╚██╗ ██╔╝██║   ██║██║██║  ██║
  ╚████╔╝ ╚██████╔╝██║██████╔╝
   ╚═══╝   ╚═════╝ ╚═╝╚═════╝`.trim()

// 通用按键缓冲（滚动窗口，最长10字符）
const keyBuffer: string[] = []
const MAX_BUFFER = 10

function checkSequence(seq: string[]): boolean {
  if (keyBuffer.length < seq.length) return false
  const tail = keyBuffer.slice(-seq.length)
  return tail.join(',') === seq.join(',')
}

function triggerMatrix() {
  const canvas = document.createElement('canvas')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  canvas.style.cssText = 'position:fixed;top:0;left:0;z-index:9999;pointer-events:none;background:rgba(0,0,0,0.85)'
  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')!
  const chars = '0123456789アイウエオカキクケコ'
  const colW = 16
  const cols = Math.floor(canvas.width / colW)
  const drops: number[] = Array.from({ length: cols }, () => Math.floor(Math.random() * -50))

  let frame = 0
  const interval = setInterval(() => {
    ctx.fillStyle = 'rgba(0,0,0,0.05)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    for (let i = 0; i < cols; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)]
      const x = i * colW
      const y = drops[i] * colW
      // head: bright white, body: green
      ctx.font = `${colW - 2}px monospace`
      ctx.fillStyle = '#ffffff'
      ctx.fillText(char, x, y)
      ctx.fillStyle = '#00ff41'
      ctx.fillText(chars[Math.floor(Math.random() * chars.length)], x, y - colW)
      if (y > canvas.height && Math.random() > 0.975) drops[i] = 0
      drops[i]++
    }
    frame++
  }, 50)

  setTimeout(() => {
    clearInterval(interval)
    canvas.remove()
  }, 5000)
}

function triggerDoom() {
  doomActive.value = true
  clearTimeout(doomTimer)
  doomTimer = setTimeout(() => { doomActive.value = false }, 3000)
}

function triggerSudo() {
  sudoText.value = '[sudo] password for void: _'
  sudoActive.value = true
  clearTimeout(sudoTimer1)
  clearTimeout(sudoTimer2)
  sudoTimer1 = setTimeout(() => {
    sudoText.value = '[sudo] password for void: ________\n\nvoid is not in the sudoers file.\nThis incident will be reported.'
  }, 3000)
  sudoTimer2 = setTimeout(() => {
    sudoActive.value = false
  }, 5000)
}

function onKeydown(e: KeyboardEvent) {
  // / 快捷键
  if (e.key === '/' && !['INPUT','TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
    e.preventDefault(); navigateTo('/search'); return
  }
  // 只捕获非输入框的按键用于彩蛋检测
  if (['INPUT','TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return

  const key = e.key
  keyBuffer.push(key)
  if (keyBuffer.length > MAX_BUFFER) keyBuffer.shift()

  // Konami
  if (checkSequence(KONAMI)) {
    konamiActive.value = true
    clearTimeout(konamiTimer)
    konamiTimer = setTimeout(() => { konamiActive.value = false }, 4000)
    return
  }

  // Matrix: m-a-t-r-i-x
  if (checkSequence(['m','a','t','r','i','x'])) {
    triggerMatrix()
    keyBuffer.length = 0
    return
  }

  // DOOM: i-d-d-q-d
  if (checkSequence(['i','d','d','q','d'])) {
    triggerDoom()
    keyBuffer.length = 0
    return
  }

  // sudo: s-u-d-o
  if (checkSequence(['s','u','d','o'])) {
    triggerSudo()
    keyBuffer.length = 0
    return
  }
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('keydown', onKeydown)
  clearTimeout(konamiTimer)
  clearTimeout(doomTimer)
  clearTimeout(sudoTimer1)
  clearTimeout(sudoTimer2)
})
</script>

<style scoped>
.fade-up-enter-active, .fade-up-leave-active { transition: all 0.2s; }
.fade-up-enter-from, .fade-up-leave-to { opacity: 0; transform: translateY(8px); }
.konami-enter-active, .konami-leave-active { transition: all 0.3s; }
.konami-enter-from, .konami-leave-to { opacity: 0; transform: scale(0.9); }

.doom-terminal {
  background-image: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.15) 2px,
    rgba(0, 0, 0, 0.15) 4px
  );
}
</style>
