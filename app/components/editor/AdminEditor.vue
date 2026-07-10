<script setup lang="ts">
defineOptions({ name: 'AdminEditor' })

import type { Post } from '~/types/post'

interface AdminPost extends Post {
  updated_at?: string
}

interface MarkdownRenderer {
  render: (source: string) => string
}

interface ApiError {
  data?: { message?: string }
  message?: string
}

const props = defineProps<{ isNew: boolean; initialSlug?: string }>()
const router = useRouter()

const { error: authError } = await useFetch('/api/auth/me')
if (authError.value) navigateTo('/admin/login')

const form = reactive({
  slug: '', title: '', description: '', content: '',
  pub_date: new Date().toISOString().slice(0, 10), draft: false,
})
const tagsInput = shallowRef('')
const parsedTags = computed(() => tagsInput.value.split(',').map(tag => tag.trim()).filter(Boolean))

if (!props.isNew && props.initialSlug) {
  const { data } = await useFetch<AdminPost>(`/api/admin/posts/${props.initialSlug}`)
  if (data.value) {
    const post = data.value
    Object.assign(form, {
      slug: post.slug, title: post.title, description: post.description,
      content: post.content, pub_date: post.pub_date, draft: post.draft,
    })
    tagsInput.value = (post.tags || []).join(', ')
  }
}

watch(() => form.title, (value) => {
  if (!props.isNew || form.slug) return
  const ascii = value.toLowerCase().replace(/[\u4e00-\u9fa5]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
  form.slug = ascii || `post-${value.length.toString(36)}`
})

const snapshot = () => JSON.stringify({ ...form, tags: parsedTags.value })
const savedSnapshot = shallowRef(snapshot())
const isDirty = computed(() => snapshot() !== savedSnapshot.value)
const estimatedReadingMinutes = computed(() => {
  const chineseCharacters = form.content.match(/[\u4e00-\u9fa5]/g)?.length ?? 0
  return Math.max(1, Math.round(chineseCharacters / 500 + (form.content.length - chineseCharacters) / 1000))
})

const { buildMd } = useMarkdown()
const mdInst = shallowRef<MarkdownRenderer | null>(null)
onMounted(async () => { mdInst.value = await buildMd() })
const previewMode = shallowRef(false)
const renderedPreview = computed(() => form.content && mdInst.value ? mdInst.value.render(form.content) : '')

const toolbar = [
  { label: 'H2', before: '\n## ', after: '' }, { label: 'H3', before: '\n### ', after: '' },
  { label: 'B', before: '**', after: '**' }, { label: 'I', before: '_', after: '_' },
  { label: 'Code', before: '`', after: '`' }, { label: 'Block', before: '\n```\n', after: '\n```' },
  { label: 'Link', before: '[', after: '](url)' },
  { label: ':::tip', before: '\n:::tip 提示\n', after: '\n:::' },
  { label: ':::warning', before: '\n:::warning\n', after: '\n:::' },
  { label: ':::danger', before: '\n:::danger\n', after: '\n:::' },
]

function insertMarkdown(before: string, after: string) {
  form.content += before + after
}

function handleKeydown(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault()
    void save()
  }
}

function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (!isDirty.value) return
  event.preventDefault()
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('beforeunload', handleBeforeUnload)
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('beforeunload', handleBeforeUnload)
  if (toastTimer) clearTimeout(toastTimer)
})

onBeforeRouteLeave(() => !isDirty.value || window.confirm('有未保存的修改，确定离开吗？'))

const saving = shallowRef(false)
const toast = reactive({ msg: '', type: 'ok' as 'ok' | 'err' })
let toastTimer: ReturnType<typeof setTimeout> | undefined

function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
  if (toastTimer) clearTimeout(toastTimer)
  toast.msg = msg
  toast.type = type
  toastTimer = setTimeout(() => { toast.msg = '' }, 3000)
}

function getErrorMessage(error: unknown) {
  const apiError = error as ApiError
  return apiError.data?.message ?? apiError.message ?? '保存失败'
}

async function save() {
  if (saving.value) return
  if (!form.title.trim() || !form.slug.trim() || !form.content.trim()) {
    showToast('标题、slug 和内容不能为空', 'err')
    return
  }
  saving.value = true
  try {
    const body = { ...form, tags: parsedTags.value }
    if (props.isNew) {
      await $fetch('/api/admin/posts', { method: 'POST', body })
      savedSnapshot.value = JSON.stringify(body)
      showToast('文章已发布')
      await router.push('/admin')
    } else {
      await $fetch(`/api/admin/posts/${props.initialSlug}`, { method: 'PUT', body })
      savedSnapshot.value = JSON.stringify(body)
      showToast('文章已更新')
    }
  } catch (error: unknown) {
    showToast(getErrorMessage(error), 'err')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <!-- Nav -->
    <nav class="sticky top-0 z-50 border-b border-[var(--color-void-border)] nav-glass">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 min-h-16 py-2 flex flex-wrap items-center gap-3">
        <NuxtLink href="/admin" class="admin-action inline-flex items-center px-2 font-mono text-sm text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)] transition-colors">← 文章列表</NuxtLink>
        <span class="text-[var(--color-text-muted)]">/</span>
        <span class="font-mono text-sm text-[var(--color-neon-cyan)]">{{ isNew ? '新建文章' : '编辑文章' }}</span>
        <div class="ml-auto flex items-center gap-3">
          <label class="min-h-11 flex items-center gap-2 cursor-pointer">
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
            class="font-mono text-xs px-4 rounded-lg border transition-colors"
            :class="saving
              ? 'border-[var(--color-void-border)] text-[var(--color-text-muted)] cursor-not-allowed'
              : 'border-[rgba(0,255,136,0.4)] text-[var(--color-neon-green)] bg-[rgba(0,255,136,0.06)] hover:bg-[rgba(0,255,136,0.12)]'">
            {{ saving ? '保存中…' : (isNew ? '发布' : '更新') }}
          </button>
        </div>
      </div>
    </nav>

    <!-- Toast -->
    <Transition name="slide-down">
      <div v-if="toast.msg" role="status" aria-live="polite" class="fixed top-20 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 font-mono text-xs px-4 py-3 rounded-lg border"
        :class="toast.type === 'ok'
          ? 'bg-[rgba(0,255,136,0.1)] border-[rgba(0,255,136,0.4)] text-[var(--color-neon-green)]'
          : 'bg-[rgba(255,45,120,0.1)] border-[rgba(255,45,120,0.4)] text-[var(--color-neon-pink)]'">
        {{ toast.msg }}
      </div>
    </Transition>

    <main class="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-6 lg:gap-8">
        <!-- 左：编辑区 -->
        <div class="space-y-4">
          <label for="post-title" class="sr-only">文章标题</label>
          <input id="post-title" v-model="form.title" placeholder="文章标题…"
            class="w-full bg-transparent border-b border-[var(--color-void-border)] focus:border-[rgba(0,212,255,0.5)] outline-none py-3 font-mono text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition-colors" />
          <label for="post-description" class="sr-only">文章描述</label>
          <input id="post-description" v-model="form.description" placeholder="文章描述（SEO 用）…"
            class="w-full bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg px-4 font-mono text-sm text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[rgba(0,212,255,0.4)] transition-colors" />

          <div class="border border-[var(--color-void-border)] rounded-xl overflow-hidden">
            <!-- 工具栏 -->
            <div class="flex flex-wrap items-center gap-1 px-2 sm:px-4 py-2 border-b border-[var(--color-void-border)] bg-[rgba(0,0,0,0.2)]">
              <button v-for="btn in toolbar" :key="btn.label" @click="insertMarkdown(btn.before, btn.after)"
                class="font-mono text-[10px] px-3 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-void-muted)] transition-colors">
                {{ btn.label }}
              </button>
              <div class="flex-1"></div>
              <button @click="previewMode = !previewMode"
                class="font-mono text-[10px] px-3 rounded transition-colors"
                :class="previewMode ? 'text-[var(--color-neon-cyan)] bg-[rgba(0,212,255,0.1)]' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-void-muted)]'">
                {{ previewMode ? '编辑' : '预览' }}
              </button>
            </div>
            <ClientOnly>
              <CodeMirrorEditor v-if="!previewMode" v-model="form.content" min-height="clamp(28rem, 60vh, 48rem)" />
              <div v-else class="prose min-h-[clamp(28rem,60vh,48rem)] px-4 sm:px-6 py-4 overflow-auto" v-html="renderedPreview" />
            </ClientOnly>
          </div>
        </div>

        <!-- 右：元数据 -->
        <aside class="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div>
            <label for="post-slug" class="block font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5">Slug</label>
            <input id="post-slug" v-model="form.slug" :disabled="!isNew" placeholder="url-slug"
              class="w-full bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg px-3 font-mono text-xs text-[var(--color-text-primary)] outline-none focus:border-[rgba(0,212,255,0.4)] transition-colors disabled:opacity-50" />
          </div>
          <div>
            <label for="post-date" class="block font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5">发布日期</label>
            <input id="post-date" v-model="form.pub_date" type="date"
              class="w-full bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg px-3 font-mono text-xs text-[var(--color-text-primary)] outline-none focus:border-[rgba(0,212,255,0.4)] transition-colors" />
          </div>
          <div>
            <label for="post-tags" class="block font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5">标签（逗号分隔）</label>
            <input id="post-tags" v-model="tagsInput" placeholder="vue, typescript, 工程实践"
              class="w-full bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg px-3 font-mono text-xs text-[var(--color-text-primary)] outline-none focus:border-[rgba(0,212,255,0.4)] transition-colors" />
            <div class="flex flex-wrap gap-1.5 mt-2">
              <span v-for="tag in parsedTags" :key="tag"
                class="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-void-muted)] text-[var(--color-text-muted)]">#{{ tag }}</span>
            </div>
          </div>
          <!-- 统计 -->
          <div class="border border-[var(--color-void-border)] rounded-lg p-3 space-y-1.5 font-mono text-[10px]">
            <div class="flex justify-between text-[var(--color-text-muted)]">
              <span>字符数</span><span class="text-[var(--color-text-secondary)]">{{ form.content.length }}</span>
            </div>
            <div class="flex justify-between text-[var(--color-text-muted)]">
              <span>预估阅读</span>
              <span class="text-[var(--color-text-secondary)]">
                {{ estimatedReadingMinutes }} 分钟
              </span>
            </div>
            <!-- 未保存提示 -->
            <div v-if="isDirty" class="flex items-center gap-1 text-[#ffc800] pt-1 border-t border-[var(--color-void-border)]">
              <span>●</span><span>有未保存的修改</span>
            </div>
          </div>
          <!-- 快捷键说明 -->
          <div class="font-mono text-[9px] text-[var(--color-text-muted)] space-y-1 border border-[var(--color-void-border)] rounded-lg p-3">
            <div class="text-[var(--color-text-muted)] uppercase tracking-wider mb-1">快捷键</div>
            <div>Tab → 2空格缩进</div>
            <div>Ctrl+S → 保存</div>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>

<style scoped>
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.2s; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateX(-50%) translateY(-8px); }

@media (prefers-reduced-motion: reduce) {
  .slide-down-enter-active, .slide-down-leave-active { transition: opacity 0.01ms; }
}
</style>
