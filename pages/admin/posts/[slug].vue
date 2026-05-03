<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <!-- Nav -->
    <nav class="sticky top-0 z-50 border-b border-[var(--color-void-border)] bg-[rgba(10,10,15,0.9)] backdrop-blur-xl">
      <div class="max-w-6xl mx-auto px-6 h-14 flex items-center gap-4">
        <NuxtLink href="/admin" class="font-mono text-sm text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)] transition-colors">← 文章列表</NuxtLink>
        <span class="text-[var(--color-text-muted)]">/</span>
        <span class="font-mono text-sm text-[var(--color-neon-cyan)]">{{ isNew ? '新建文章' : '编辑文章' }}</span>
        <div class="ml-auto flex items-center gap-3">
          <!-- 草稿/发布切换 -->
          <label class="flex items-center gap-2 cursor-pointer">
            <span class="font-mono text-xs text-[var(--color-text-muted)]">草稿</span>
            <div class="relative">
              <input type="checkbox" v-model="form.draft" class="sr-only" />
              <div class="w-10 h-5 rounded-full transition-colors"
                :class="form.draft ? 'bg-[rgba(255,200,0,0.3)]' : 'bg-[rgba(0,255,136,0.3)]'">
                <div class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform bg-white"
                  :style="form.draft ? '' : 'transform:translateX(20px)'"></div>
              </div>
            </div>
          </label>
          <button @click="save" :disabled="saving"
            class="font-mono text-xs px-4 py-1.5 rounded-lg border transition-all"
            :class="saving
              ? 'border-[var(--color-void-border)] text-[var(--color-text-muted)] cursor-not-allowed'
              : 'border-[rgba(0,255,136,0.4)] text-[var(--color-neon-green)] bg-[rgba(0,255,136,0.06)] hover:bg-[rgba(0,255,136,0.12)]'">
            {{ saving ? '保存中…' : (isNew ? '发布' : '更新') }}
          </button>
        </div>
      </div>
    </nav>

    <!-- 错误/成功提示 -->
    <Transition name="slide-down">
      <div v-if="toast.msg" class="fixed top-16 left-1/2 -translate-x-1/2 z-50 font-mono text-xs px-4 py-2 rounded-lg border"
        :class="toast.type === 'ok'
          ? 'bg-[rgba(0,255,136,0.1)] border-[rgba(0,255,136,0.4)] text-[var(--color-neon-green)]'
          : 'bg-[rgba(255,45,120,0.1)] border-[rgba(255,45,120,0.4)] text-[var(--color-neon-pink)]'">
        {{ toast.msg }}
      </div>
    </Transition>

    <div class="max-w-6xl mx-auto px-6 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
        <!-- 左：主内容编辑 -->
        <div class="space-y-4">
          <!-- 标题 -->
          <input v-model="form.title" placeholder="文章标题…"
            class="w-full bg-transparent border-b border-[var(--color-void-border)] focus:border-[rgba(0,212,255,0.5)] outline-none py-3 font-mono text-2xl font-bold text-[var(--color-text-primary)] placeholder:text-[var(--color-void-muted)] transition-colors" />

          <!-- 描述 -->
          <input v-model="form.description" placeholder="文章描述（SEO 用）…"
            class="w-full bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg px-4 py-2.5 font-mono text-sm text-[var(--color-text-secondary)] placeholder:text-[var(--color-void-muted)] outline-none focus:border-[rgba(0,212,255,0.4)] transition-colors" />

          <!-- Markdown 编辑器 -->
          <div class="border border-[var(--color-void-border)] rounded-xl overflow-hidden">
            <!-- 工具栏 -->
            <div class="flex items-center gap-1 px-4 py-2 border-b border-[var(--color-void-border)] bg-[rgba(0,0,0,0.2)]">
              <button v-for="btn in toolbar" :key="btn.label" @click="insertMarkdown(btn.before, btn.after)"
                class="font-mono text-[10px] px-2 py-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-void-muted)] transition-all">
                {{ btn.label }}
              </button>
              <div class="flex-1"></div>
              <button @click="preview = !preview"
                class="font-mono text-[10px] px-2 py-1 rounded transition-all"
                :class="preview
                  ? 'text-[var(--color-neon-cyan)] bg-[rgba(0,212,255,0.1)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-void-muted)]'">
                {{ preview ? '编辑' : '预览' }}
              </button>
            </div>
            <!-- 编辑/预览区 -->
            <div v-if="!preview">
              <textarea v-model="form.content" ref="editor"
                placeholder="用 Markdown 写文章…"
                class="w-full min-h-[60vh] bg-transparent px-4 py-4 font-mono text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-void-muted)] outline-none resize-none leading-relaxed"
                @keydown.tab.prevent="insertTab"
                spellcheck="false" />
            </div>
            <div v-else class="prose min-h-[60vh] px-6 py-4 overflow-auto" v-html="renderedPreview" />
          </div>
        </div>

        <!-- 右：元数据 -->
        <div class="space-y-5 lg:pt-0">
          <!-- Slug -->
          <div>
            <label class="block font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5">Slug</label>
            <input v-model="form.slug" :disabled="!isNew" placeholder="url-slug"
              class="w-full bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg px-3 py-2 font-mono text-xs text-[var(--color-text-primary)] outline-none focus:border-[rgba(0,212,255,0.4)] transition-colors disabled:opacity-50" />
          </div>

          <!-- 日期 -->
          <div>
            <label class="block font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5">发布日期</label>
            <input v-model="form.pub_date" type="date"
              class="w-full bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg px-3 py-2 font-mono text-xs text-[var(--color-text-primary)] outline-none focus:border-[rgba(0,212,255,0.4)] transition-colors" />
          </div>

          <!-- 标签 -->
          <div>
            <label class="block font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5">标签（逗号分隔）</label>
            <input v-model="tagsInput" placeholder="vue, typescript, 工程实践"
              class="w-full bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg px-3 py-2 font-mono text-xs text-[var(--color-text-primary)] outline-none focus:border-[rgba(0,212,255,0.4)] transition-colors" />
            <div class="flex flex-wrap gap-1.5 mt-2">
              <span v-for="tag in parsedTags" :key="tag"
                class="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-void-muted)] text-[var(--color-text-muted)]">
                #{{ tag }}
              </span>
            </div>
          </div>

          <!-- 字数统计 -->
          <div class="border border-[var(--color-void-border)] rounded-lg p-3 space-y-1.5 font-mono text-[10px]">
            <div class="flex justify-between text-[var(--color-text-muted)]">
              <span>字符数</span><span class="text-[var(--color-text-secondary)]">{{ form.content.length }}</span>
            </div>
            <div class="flex justify-between text-[var(--color-text-muted)]">
              <span>预估阅读</span>
              <span class="text-[var(--color-text-secondary)]">
                {{ Math.max(1, Math.round(
                  ((form.content.match(/[\u4e00-\u9fa5]/g)||[]).length / 500) +
                  (form.content.length - (form.content.match(/[\u4e00-\u9fa5]/g)||[]).length) / 1000
                )) }} 分钟
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
// @ts-ignore
import markdownItHljs from 'markdown-it-highlightjs'

definePageMeta({ layout: false })
const { siteName } = useSiteConfig()

const route = useRoute()
const router = useRouter()
const slug = route.params.slug as string | undefined
const isNew = !slug

useSeoMeta({ title: `${isNew ? '新建文章' : '编辑'} | Admin | ${siteName}`, robots: 'noindex' })

// 鉴权
const { error: authError } = await useFetch('/api/auth/me')
if (authError.value) navigateTo('/admin/login')

// 表单
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

// 编辑模式：加载现有内容
if (!isNew) {
  const { data } = await useFetch(`/api/admin/posts/${slug}`)
  if (data.value) {
    const p = data.value as any
    form.slug = p.slug
    form.title = p.title
    form.description = p.description
    form.content = p.content
    form.pub_date = p.pub_date
    form.draft = p.draft
    tagsInput.value = (p.tags || []).join(', ')
  }
}

// 标题自动生成 slug（仅新建）
watch(() => form.title, (val) => {
  if (!isNew || form.slug) return
  // 中文转 pinyin 降级方案：用 pub_date + 标题长度 hash 做后缀
  const ascii = val.toLowerCase()
    .replace(/[\u4e00-\u9fa5]/g, '') // 移除中文
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  const hash = val.length.toString(36)
  form.slug = (ascii || 'post') + (ascii ? '' : `-${hash}`)
})

// Markdown 预览
const md = new MarkdownIt({ html: true, linkify: true, typographer: true })
  .use(markdownItHljs, { hljs, auto: true, code: true })
const preview = ref(false)
const renderedPreview = computed(() => form.content ? md.render(form.content) : '<p class="text-muted">无内容</p>')

// 工具栏
const toolbar = [
  { label: 'H2', before: '\n## ', after: '' },
  { label: 'H3', before: '\n### ', after: '' },
  { label: 'B', before: '**', after: '**' },
  { label: 'I', before: '_', after: '_' },
  { label: 'Code', before: '`', after: '`' },
  { label: 'Block', before: '\n```\n', after: '\n```' },
  { label: 'Link', before: '[', after: '](url)' },
  { label: ':::tip', before: '\n:::tip 提示\n', after: '\n:::' },
  { label: ':::warning', before: '\n:::warning 注意\n', after: '\n:::' },
]
const editor = ref<HTMLTextAreaElement>()

function insertMarkdown(before: string, after: string) {
  const el = editor.value
  if (!el) return
  const start = el.selectionStart
  const end = el.selectionEnd
  const selected = form.content.slice(start, end)
  form.content = form.content.slice(0, start) + before + selected + after + form.content.slice(end)
  nextTick(() => {
    el.focus()
    el.setSelectionRange(start + before.length, start + before.length + selected.length)
  })
}

function insertTab() {
  const el = editor.value
  if (!el) return
  const start = el.selectionStart
  form.content = form.content.slice(0, start) + '  ' + form.content.slice(start)
  nextTick(() => el.setSelectionRange(start + 2, start + 2))
}

// 保存
const saving = ref(false)
const toast = reactive({ msg: '', type: 'ok' })
function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
  toast.msg = msg; toast.type = type
  setTimeout(() => { toast.msg = '' }, 3000)
}

async function save() {
  if (!form.title || !form.slug || !form.content) {
    showToast('标题/slug/内容不能为空', 'err'); return
  }
  saving.value = true
  try {
    const body = { ...form, tags: parsedTags.value }
    if (isNew) {
      await $fetch('/api/admin/posts', { method: 'POST', body })
      showToast('文章已发布 ✓')
      router.push('/admin')
    } else {
      await $fetch(`/api/admin/posts/${slug}`, { method: 'PUT', body })
      showToast('已更新 ✓')
    }
  } catch (e: any) {
    showToast(e?.data?.message || '保存失败', 'err')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.2s; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateX(-50%) translateY(-8px); }
</style>
