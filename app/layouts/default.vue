<template>
  <div>
    <slot />
    <ClientOnly><AiAssistant /></ClientOnly>
  </div>
</template>

<script setup lang="ts">
onMounted(() => {
  // 键盘快捷键
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
  })
})
</script>
