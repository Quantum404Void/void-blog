<template>
  <div ref="container" class="giscus-wrap mt-4" />
</template>

<script setup lang="ts">
const props = defineProps<{ slug: string }>()
const container = ref<HTMLDivElement>()
const colorMode = useColorMode()

function loadGiscus(theme: string) {
  if (!container.value) return
  container.value.innerHTML = ''
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
  s.setAttribute('data-theme', theme)
  s.setAttribute('data-lang', 'zh-CN')
  s.setAttribute('data-loading', 'lazy')
  s.crossOrigin = 'anonymous'
  s.async = true
  container.value.appendChild(s)
}

// 主题跟随暗/亮模式
const giscusTheme = computed(() =>
  colorMode.value === 'dark' ? 'dark_dimmed' : 'light'
)

watch(giscusTheme, (theme) => {
  // 通知已加载的 giscus iframe 切换主题
  const iframe = document.querySelector<HTMLIFrameElement>('iframe.giscus-frame')
  if (iframe?.contentWindow) {
    iframe.contentWindow.postMessage({ giscus: { setConfig: { theme } } }, 'https://giscus.app')
  }
})

onMounted(() => loadGiscus(giscusTheme.value))
</script>
