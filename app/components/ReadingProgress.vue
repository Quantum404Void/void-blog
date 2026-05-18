<template>
  <div
    class="fixed top-0 left-0 h-[2px] transition-none origin-left"
    :style="{
      zIndex: 'var(--z-progress)',
      background: 'linear-gradient(to right, #00ff88, #00d4ff, #b44cff, #ff2d78)',
      boxShadow: '0 0 8px rgba(0,212,255,0.6)',
      transform: `scaleX(${progress})`
    }"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const progress = ref(0)

function updateProgress() {
  const scrollTop = window.scrollY
  const docHeight = document.documentElement.scrollHeight - window.innerHeight
  progress.value = docHeight > 0 ? Math.min(1, scrollTop / docHeight) : 0
}

onMounted(() => {
  window.addEventListener('scroll', updateProgress, { passive: true })
  updateProgress()
})
onUnmounted(() => window.removeEventListener('scroll', updateProgress))
</script>
