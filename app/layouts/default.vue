<template>
  <div>
    <!-- Keyboard shortcuts -->
    <ClientOnly>
      <div id="shortcut-hint" style="
        position:fixed; bottom:1.25rem; right:1.25rem; z-index:999;
        font-family: var(--font-mono); font-size:10px;
        display:flex; flex-direction:column; gap:0.25rem; align-items:flex-end;
        opacity:0; transition:opacity 0.4s; pointer-events:none;
      " ref="hintRef">
        <div style="padding:4px 8px; background:rgba(10,10,15,0.9); border:1px solid rgba(0,212,255,0.2); border-radius:6px; color:rgba(136,136,170,0.8)">
          <kbd style="color:rgba(0,212,255,0.7);font-family:inherit">/</kbd> 搜索  
          <kbd style="color:rgba(0,212,255,0.7);font-family:inherit">T</kbd> 顶部  
          <kbd style="color:rgba(0,212,255,0.7);font-family:inherit">[</kbd><kbd style="color:rgba(0,212,255,0.7);font-family:inherit">]</kbd> 前后篇
        </div>
      </div>
    </ClientOnly>

    <!-- Cursor glow -->
    <ClientOnly>
      <div id="cursor-glow" aria-hidden="true" ref="cursorRef"></div>
      <canvas id="particle-canvas" style="position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9998;" aria-hidden="true" ref="particleCanvasRef"></canvas>
    </ClientOnly>

    <slot />
  </div>
</template>

<script setup lang="ts">
import { useMediaQuery, useEventListener, useWindowSize } from '@vueuse/core'

const hintRef = ref<HTMLElement | null>(null)
const cursorRef = ref<HTMLElement | null>(null)
const particleCanvasRef = ref<HTMLCanvasElement | null>(null)

onMounted(() => {
  // Keyboard shortcuts
  let hintTimer: ReturnType<typeof setTimeout> | null = null
  document.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as Element)?.tagName ?? '')) return
    if ((e.target as Element)?.getAttribute?.('contenteditable') === 'true') return
    const key = e.key
    if ((key === 'k' && (e.metaKey || e.ctrlKey)) || key === '/') {
      e.preventDefault()
      navigateTo('/search')
    }
    if (key === '[') {
      const prev = document.querySelector<HTMLAnchorElement>('.prev-post-link')
      if (prev) window.location.href = prev.href
    }
    if (key === ']') {
      const next = document.querySelector<HTMLAnchorElement>('.next-post-link')
      if (next) window.location.href = next.href
    }
    if (key === 't' || key === 'T') window.scrollTo({ top: 0, behavior: 'smooth' })
    if (key === 'g' || key === 'G') navigateTo('/')
    if (key === '?' && hintRef.value) {
      hintRef.value.style.opacity = '1'
      if (hintTimer) clearTimeout(hintTimer)
      hintTimer = setTimeout(() => { if (hintRef.value) hintRef.value.style.opacity = '0' }, 3000)
    }
  })

  // Cursor glow（只在有精确指针设备时启用）
  const hasPointer = window.matchMedia('(pointer: fine)').matches
  const cursor = cursorRef.value
  if (cursor && hasPointer) {
    cursor.style.cssText = `
      position: fixed;
      width: 300px;
      height: 300px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(0,255,136,0.04) 0%, transparent 70%);
      pointer-events: none;
      transform: translate(-50%, -50%);
      transition: opacity 0.3s;
      z-index: 9999;
    `
    document.addEventListener('mousemove', (e) => {
      cursor.style.left = e.clientX + 'px'
      cursor.style.top = e.clientY + 'px'
    })
    document.addEventListener('mouseleave', () => { cursor.style.opacity = '0' })
    document.addEventListener('mouseenter', () => { cursor.style.opacity = '1' })
  }

  // Click particles
  const pCanvas = particleCanvasRef.value
  const ctx = pCanvas?.getContext('2d')
  const particles: { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }[] = []
  const neonColors = ['#00d4ff', '#39ff14', '#ff00aa', '#b400ff', '#ffa500']

  function spawnParticles(x: number, y: number) {
    const count = 12 + Math.floor(Math.random() * 8)
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5
      const speed = 2 + Math.random() * 4
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: neonColors[Math.floor(Math.random() * neonColors.length)],
        size: 2 + Math.random() * 3
      })
    }
  }

  function animateParticles() {
    if (!ctx || !pCanvas) return
    ctx.clearRect(0, 0, pCanvas.width, pCanvas.height)
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life -= 0.03
      if (p.life <= 0) { particles.splice(i, 1); continue }
      ctx.save()
      ctx.globalAlpha = p.life
      ctx.shadowBlur = 8
      ctx.shadowColor = p.color
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
    requestAnimationFrame(animateParticles)
  }

  if (ctx && pCanvas) {
    const resize = () => { pCanvas.width = window.innerWidth; pCanvas.height = window.innerHeight }
    resize()
    useEventListener(window, 'resize', resize)
    document.addEventListener('click', (e) => spawnParticles(e.clientX, e.clientY))
    animateParticles()
  }
})
</script>
