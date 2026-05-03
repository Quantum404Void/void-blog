<template>
  <!-- 回到顶部 -->
  <Transition name="fade-up">
    <button v-if="showTop" @click="scrollTop"
      class="fixed bottom-6 right-6 z-50 w-9 h-9 rounded-full border border-[var(--color-void-border)] bg-[var(--color-void-card)] text-[var(--color-text-muted)] hover:border-[rgba(0,212,255,0.4)] hover:text-[var(--color-neon-cyan)] transition-all flex items-center justify-center"
      title="回到顶部 ↑">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="18 15 12 9 6 15"/>
      </svg>
    </button>
  </Transition>

  <!-- Konami 彩蛋 -->
  <Transition name="konami">
    <div v-if="konamiActive" class="fixed inset-0 z-[999] flex items-center justify-center pointer-events-none">
      <div class="font-mono text-center pointer-events-auto"
        style="background:rgba(0,0,0,0.92);padding:2rem 3rem;border:1px solid rgba(0,255,136,0.4);border-radius:1rem;box-shadow:0 0 60px rgba(0,255,136,0.2)">
        <pre class="text-[var(--color-neon-green)] text-[11px] leading-tight mb-4 select-none">{{ matrixArt }}</pre>
        <div class="text-[var(--color-neon-cyan)] text-sm font-bold mb-1">// CHEAT CODE ACTIVATED</div>
        <div class="text-[var(--color-text-muted)] text-xs">↑↑↓↓←→←→BA — you know the way 🎮</div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
// 回到顶部
const showTop = ref(false)
function onScroll() { showTop.value = window.scrollY > 400 }
function scrollTop() { window.scrollTo({ top: 0, behavior: 'smooth' }) }

// / 快捷键 → 搜索
const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a']
const konamiBuffer: string[] = []
const konamiActive = ref(false)
let konamiTimer: ReturnType<typeof setTimeout>

const matrixArt = `
 ██╗   ██╗ ██████╗ ██╗██████╗
 ██║   ██║██╔═══██╗██║██╔══██╗
 ██║   ██║██║   ██║██║██║  ██║
 ╚██╗ ██╔╝██║   ██║██║██║  ██║
  ╚████╔╝ ╚██████╔╝██║██████╔╝
   ╚═══╝   ╚═════╝ ╚═╝╚═════╝`.trim()

function onKeydown(e: KeyboardEvent) {
  // / 快捷键
  if (e.key === '/' && !['INPUT','TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
    e.preventDefault(); navigateTo('/search'); return
  }
  // Konami
  konamiBuffer.push(e.key)
  if (konamiBuffer.length > KONAMI.length) konamiBuffer.shift()
  if (konamiBuffer.join(',') === KONAMI.join(',')) {
    konamiActive.value = true
    clearTimeout(konamiTimer)
    konamiTimer = setTimeout(() => { konamiActive.value = false }, 4000)
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
})
</script>

<style scoped>
.fade-up-enter-active, .fade-up-leave-active { transition: all 0.2s; }
.fade-up-enter-from, .fade-up-leave-to { opacity: 0; transform: translateY(8px); }
.konami-enter-active, .konami-leave-active { transition: all 0.3s; }
.konami-enter-from, .konami-leave-to { opacity: 0; transform: scale(0.9); }
</style>
