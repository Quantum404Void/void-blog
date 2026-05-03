<template>
  <div ref="container" class="giscus-wrap mt-4" />
</template>

<script setup lang="ts">
const props = defineProps<{ slug: string }>()
const container = ref<HTMLDivElement>()

onMounted(() => {
  if (!container.value) return
  const s = document.createElement('script')
  s.src = 'https://giscus.app/client.js'
  s.setAttribute('data-repo', 'Quantum505Void/void-blog')
  s.setAttribute('data-repo-id', 'R_kgDOSQz6vQ')
  s.setAttribute('data-category', 'General')
  s.setAttribute('data-category-id', 'DIC_kwDOSQz6vc4C8PXU')
  s.setAttribute('data-mapping', 'specific')
  s.setAttribute('data-term', props.slug)
  s.setAttribute('data-strict', '0')
  s.setAttribute('data-reactions-enabled', '1')
  s.setAttribute('data-emit-metadata', '0')
  s.setAttribute('data-input-position', 'top')
  s.setAttribute('data-theme', 'dark_dimmed')
  s.setAttribute('data-lang', 'zh-CN')
  s.setAttribute('data-loading', 'lazy')
  s.crossOrigin = 'anonymous'
  s.async = true
  container.value.appendChild(s)
})
</script>
