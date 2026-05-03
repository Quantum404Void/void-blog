<template>
  <div class="min-h-screen bg-[var(--color-void)] flex items-center justify-center">
    <p class="font-mono text-xs text-[var(--color-text-muted)]">loading…</p>
  </div>
</template>

<script setup lang="ts">
// new.vue 直接渲染编辑器，不依赖 [slug].vue
definePageMeta({ layout: false })
const { siteName } = useSiteConfig()
useSeoMeta({ title: `新建文章 | Admin | ${siteName}`, robots: 'noindex' })

const { error: authError } = await useFetch('/api/auth/me')
if (authError.value) navigateTo('/admin/login')

import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
// @ts-ignore
import markdownItHljs from 'markdown-it-highlightjs'

const router = useRouter()
const form = reactive({
  slug: '',
  title: '',
  description: '',
  content: '',
  pub_date: new Date().toISOString().slice(0, 10),
  draft: false,
})
const tagsInput = ref('')
const parsedTags = computed(() =>
  tagsInput.value.split(',').map(t => t.trim()).filter(Boolean)
)

watch(() => form.title, (val) => {
  if (form.slug) return
  const ascii = val.toLowerCase().replace(/[\u4e00-\u9fa5]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
  const hash = val.length.toString(36)
  form.slug = (ascii || 'post') + (ascii ? '' : `-${hash}`)
})

const md = new MarkdownIt({ html: true, linkify: true, typographer: true }).use(markdownItHljs, { hljs, auto: true, code: true })
const preview = ref(false)
const renderedPreview = computed(() => form.content ? md.render(form.content) : '')

const toolbar = [
  { label: 'H2', before: '\n## ', after: '' }, { label: 'H3', before: '\n### ', after: '' },
  { label: 'B', before: '**', after: '**' }, { label: 'I', before: '_', after: '_' },
  { label: 'Code', before: '`', after: '`' }, { label: 'Block', before: '\n```\n', after: '\n```' },
  { label: 'Link', before: '[', after: '](url)' },
  { label: ':::tip', before: '\n:::tip 提示\n', after: '\n:::' },
  { label: ':::warning', before: '\n:::warning 注意\n', after: '\n:::' },
]
const editor = ref<HTMLTextAreaElement>()

function insertMarkdown(before: string, after: string) {
  const el = editor.value; if (!el) return
  const start = el.selectionStart; const end = el.selectionEnd
  const sel = form.content.slice(start, end)
  form.content = form.content.slice(0, start) + before + sel + after + form.content.slice(end)
  nextTick(() => { el.focus(); el.setSelectionRange(start + before.length, start + before.length + sel.length) })
}
function insertTab() {
  const el = editor.value; if (!el) return
  const s = el.selectionStart
  form.content = form.content.slice(0, s) + '  ' + form.content.slice(s)
  nextTick(() => el.setSelectionRange(s + 2, s + 2))
}

const saving = ref(false)
const toast = reactive({ msg: '', type: 'ok' as 'ok' | 'err' })
function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
  toast.msg = msg; toast.type = type; setTimeout(() => { toast.msg = '' }, 3000)
}
async function save() {
  if (!form.title || !form.slug || !form.content) { showToast('标题/slug/内容不能为空', 'err'); return }
  saving.value = true
  try {
    await $fetch('/api/admin/posts', { method: 'POST', body: { ...form, tags: parsedTags.value } })
    showToast('文章已发布 ✓')
    router.push('/admin')
  } catch (e: any) { showToast(e?.data?.message || '保存失败', 'err') }
  finally { saving.value = false }
}
</script>
