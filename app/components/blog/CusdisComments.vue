<template>
  <div ref="container" class="cusdis-wrap mt-4"></div>
</template>

<script setup lang="ts">
defineOptions({ name: 'CusdisComments' })

const props = defineProps<{ slug: string }>()
const container = ref<HTMLDivElement>()

const { siteUrl } = useSiteConfig()

onMounted(() => {
  if (!container.value) return

  const div = document.createElement('div')
  div.id = 'cusdis_thread'
  div.setAttribute('data-host', 'https://cusdis.com')
  div.setAttribute('data-app-id', '21e858c9-95ac-40a0-8d27-a7e676d350fe')
  div.setAttribute('data-page-id', props.slug)
  div.setAttribute('data-page-url', `${siteUrl}/blog/${props.slug}`)
  div.setAttribute('data-page-title', '')
  div.setAttribute('data-theme', 'auto')
  container.value.appendChild(div)

  const script = document.createElement('script')
  script.src = 'https://cusdis.com/js/cusdis.es.js'
  script.async = true
  script.defer = true
  container.value.appendChild(script)
})
</script>
