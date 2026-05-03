<template>
  <div
    :style="{ width: progress + '%' }"
    class="fixed top-0 left-0 h-[2px] z-[100] transition-all duration-100"
    style="background: linear-gradient(to right, #00ff88, #00d4ff);"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const progress = ref(0)

function updateProgress() {
  const scrollTop = window.scrollY
  const docHeight = document.documentElement.scrollHeight - window.innerHeight
  progress.value = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0
}

onMounted(() => {
  window.addEventListener('scroll', updateProgress, { passive: true })
  updateProgress()
})
onUnmounted(() => window.removeEventListener('scroll', updateProgress))
</script>
