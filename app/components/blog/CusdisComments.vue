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
  div.setAttribute('data-lang', 'zh-cn')
  container.value.appendChild(div)

  // Set Chinese locale before loading Cusdis
  ;(window as any).CUSDIS_LOCALE = {
    powered_by: '评论系统由 Cusdis 驱动',
    post_comment: '发表评论',
    loading: '加载中…',
    email: '邮箱 (选填)',
    nickname: '昵称',
    reply_placeholder: '写下你的想法…',
    reply_btn: '评论',
    show_other_comments: '显示其他评论',
    load_more: '加载更多',
  }

  const script = document.createElement('script')
  script.src = 'https://cusdis.com/js/cusdis.es.js'
  script.async = true
  script.defer = true
  container.value.appendChild(script)
})
</script>
