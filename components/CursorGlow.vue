<template>
  <template v-if="active">
    <!-- 大光晕（缓动跟随） -->
    <div
      class="cursor-glow"
      :style="{ transform: `translate(${glowX - 128}px, ${glowY - 128}px)` }"
    />
    <!-- 小实心点（立即跟随） -->
    <div
      class="cursor-dot"
      :class="{ clicked: isClicked }"
      :style="{ transform: `translate(${mouseX - 6}px, ${mouseY - 6}px)` }"
    />
  </template>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const active = ref(false)
const mouseX = ref(0)
const mouseY = ref(0)
const glowX = ref(0)
const glowY = ref(0)
const isClicked = ref(false)

let rafId = null

function lerp(a, b, t) {
  return a + (b - a) * t
}

function loop() {
  glowX.value = lerp(glowX.value, mouseX.value, 0.08)
  glowY.value = lerp(glowY.value, mouseY.value, 0.08)
  rafId = requestAnimationFrame(loop)
}

function onMouseMove(e) {
  mouseX.value = e.clientX
  mouseY.value = e.clientY
}

function onMouseDown() {
  isClicked.value = true
  setTimeout(() => { isClicked.value = false }, 200)
}

onMounted(() => {
  if (window.matchMedia('(pointer:coarse)').matches) return
  active.value = true
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mousedown', onMouseDown)
  glowX.value = window.innerWidth / 2
  glowY.value = window.innerHeight / 2
  mouseX.value = glowX.value
  mouseY.value = glowY.value
  loop()
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mousedown', onMouseDown)
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<style scoped>
.cursor-glow {
  position: fixed;
  top: 0;
  left: 0;
  width: 256px;
  height: 256px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 212, 255, 0.04) 0%, transparent 70%);
  pointer-events: none;
  z-index: 9998;
  will-change: transform;
}

.cursor-dot {
  position: fixed;
  top: 0;
  left: 0;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(0, 212, 255, 0.7);
  pointer-events: none;
  z-index: 9999;
  will-change: transform;
  transition: scale 150ms ease;
}

.cursor-dot.clicked {
  scale: 2.5;
}
</style>
