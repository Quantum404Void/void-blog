<template>
  <!-- 回到顶部 -->
  <Transition name="fade-up">
    <button v-if="showTop" @click="scrollTop"
      class="fixed bottom-6 right-6 z-50 w-9 h-9 rounded-full border border-[var(--color-void-border)] bg-[var(--color-void-card)] text-[var(--color-text-muted)] hover:border-[rgba(0,212,255,0.4)] hover:text-[var(--color-neon-cyan)] transition-all flex items-center justify-center"
      title="回到顶部">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="18 15 12 9 6 15"/>
      </svg>
    </button>
  </Transition>

  <!-- 暗/亮切换 -->
  <button @click="toggleMode"
    class="fixed bottom-6 right-[3.75rem] z-50 w-9 h-9 rounded-full border border-[var(--color-void-border)] bg-[var(--color-void-card)] text-[var(--color-text-muted)] hover:border-[rgba(0,255,136,0.4)] hover:text-[var(--color-neon-green)] transition-all flex items-center justify-center"
    :title="colorMode.value === 'dark' ? '切换亮色模式' : '切换暗色模式'">
    <svg v-if="colorMode.value === 'dark'" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
    <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  </button>
</template>

<script setup lang="ts">
const colorMode = useColorMode()

function toggleMode() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

// 回到顶部
const showTop = ref(false)
function onScroll() { showTop.value = window.scrollY > 400 }
function scrollTop() { window.scrollTo({ top: 0, behavior: 'smooth' }) }

// / 快捷键打开搜索
function onKeydown(e: KeyboardEvent) {
  if (e.key === '/' && !['INPUT','TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
    e.preventDefault()
    navigateTo('/search')
  }
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.fade-up-enter-active, .fade-up-leave-active { transition: all 0.2s; }
.fade-up-enter-from, .fade-up-leave-to { opacity: 0; transform: translateY(8px); }
</style>
