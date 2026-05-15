<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <!-- Nav -->
    <nav class="sticky top-0 z-50 border-b border-[var(--color-void-border)] nav-glass">
      <div class="max-w-6xl mx-auto px-6 h-14 flex items-center gap-4">
        <NuxtLink href="/admin" class="font-mono text-sm text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)] transition-colors">← 文章列表</NuxtLink>
        <span class="text-[var(--color-text-muted)]">/</span>
        <span class="font-mono text-sm text-[var(--color-neon-cyan)]">{{ isNew ? '新建文章' : '编辑文章' }}</span>
        <div class="ml-auto flex items-center gap-3">
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

    <!-- Toast -->
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
        <!-- 左：编辑区 -->
        <div class="space-y-4">
          <input v-model="form.title" placeholder="文章标题…"
            class="w-full bg-transparent border-b border-[var(--color-void-border)] focus:border-[rgba(0,212,255,0.5)] outline-none py-3 font-mono text-2xl font-bold text-[var(--color-text-primary)] placeholder:text-[var(--color-void-muted)] transition-colors" />
          <input v-model="form.description" placeholder="文章描述（SEO 用）…"
            class="w-full bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg px-4 py-2.5 font-mono text-sm text-[var(--color-text-secondary)] placeholder:text-[var(--color-void-muted)] outline-none focus:border-[rgba(0,212,255,0.4)] transition-colors" />

          <div class="border border-[var(--color-void-border)] rounded-xl overflow-hidden">
            <!-- 工具栏 -->
            <div class="flex flex-wrap items-center gap-1 px-4 py-2 border-b border-[var(--color-void-border)] bg-[rgba(0,0,0,0.2)]">
              <button v-for="btn in toolbar" :key="btn.label" @click="insertMarkdown(btn.before, btn.after)"
                class="font-mono text-[10px] px-2 py-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-void-muted)] transition-all">
                {{ btn.label }}
              </button>
              <div class="flex-1"></div>
              <button @click="previewMode = !previewMode"
                class="font-mono text-[10px] px-2 py-1 rounded transition-all"
                :class="previewMode ? 'text-[var(--color-neon-cyan)] bg-[rgba(0,212,255,0.1)]' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-void-muted)]'">
                {{ previewMode ? '编辑' : '预览' }}
              </button>
            </div>
            <ClientOnly>
              <CodeMirrorEditor v-if="!previewMode" v-model="form.content" />
              <div v-else class="prose min-h-[60vh] px-6 py-4 overflow-auto" v-html="renderedPreview" />
            </ClientOnly>
          </div>
        </div>

        <!-- 右：元数据 -->
        <div class="space-y-5">
          <div>
            <label class="block font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5">Slug</label>
            <input v-model="form.slug" :disabled="!isNew" placeholder="url-slug"
              class="w-full bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg px-3 py-2 font-mono text-xs text-[var(--color-text-primary)] outline-none focus:border-[rgba(0,212,255,0.4)] transition-colors disabled:opacity-50" />
          </div>
          <div>
            <label class="block font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5">发布日期</label>
            <input v-model="form.pub_date" type="date"
              class="w-full bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg px-3 py-2 font-mono text-xs text-[var(--color-text-primary)] outline-none focus:border-[rgba(0,212,255,0.4)] transition-colors" />
          </div>
          <div>
            <label class="block font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5">标签（逗号分隔）</label>
            <input v-model="tagsInput" placeholder="vue, typescript, 工程实践"
              class="w-full bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg px-3 py-2 font-mono text-xs text-[var(--color-text-primary)] outline-none focus:border-[rgba(0,212,255,0.4)] transition-colors" />
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
                {{ Math.max(1, Math.round(
                  ((form.content.match(/[\u4e00-\u9fa5]/g)||[]).length/500) +
                  (form.content.length-(form.content.match(/[\u4e00-\u9fa5]/g)||[]).length)/1000
                )) }} 分钟
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
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ isNew: boolean; initialSlug?: string }>()
const router = useRouter()

// 鉴权
const { error: authError } = await useFetch('/api/auth/me')
if (authError.value) navigateTo('/admin/login')

const form = reactive({
  slug: '', title: '', description: '', content: '',
  pub_date: new Date().toISOString().slice(0, 10), draft: false,
})
const tagsInput = ref('')
const parsedTags = computed(() => tagsInput.value.split(',').map(t => t.trim()).filter(Boolean))

// 加载现有文章（编辑模式）
if (!props.isNew && props.initialSlug) {
  const { data } = await useFetch(`/api/admin/posts/${props.initialSlug}`)
  if (data.value) {
    const p = data.value as any
    Object.assign(form, { slug: p.slug, title: p.title, description: p.description,
      content: p.content, pub_date: p.pub_date, draft: p.draft })
    tagsInput.value = (p.tags || []).join(', ')
  }
}

// 自动生成 slug（新建 + 纯英文标题）
watch(() => form.title, (val) => {
  if (!props.isNew || form.slug) return
  const ascii = val.toLowerCase().replace(/[\u4e00-\u9fa5]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
  form.slug = ascii || `post-${val.length.toString(36)}`
})

// 未保存提示
const savedSnapshot = ref('')
const isDirty = computed(() => JSON.stringify({ ...form, tags: parsedTags.value }) !== savedSnapshot.value)
onMounted(() => { savedSnapshot.value = JSON.stringify({ ...form, tags: parsedTags.value }) })

// Markdown 预览
const { md } = useMarkdown({ containers: false, lineNumbers: false })
const previewMode = ref(false)
const renderedPreview = computed(() => form.content ? md.render(form.content) : '')

const toolbar = [
  { label: 'H2', before: '\n## ', after: '' }, { label: 'H3', before: '\n### ', after: '' },
  { label: 'B', before: '**', after: '**' }, { label: 'I', before: '_', after: '_' },
  { label: 'Code', before: '`', after: '`' }, { label: 'Block', before: '\n```\n', after: '\n```' },
  { label: 'Link', before: '[', after: '](url)' },
  { label: ':::tip', before: '\n:::tip 提示\n', after: '\n:::' },
  { label: ':::warning', before: '\n:::warning\n', after: '\n:::' },
  { label: ':::danger', before: '\n:::danger\n', after: '\n:::' },
]
const editorEl = ref<HTMLTextAreaElement | null>(null) // legacy ref, kept for insertMarkdown
function insertMarkdown(before: string, after: string) {
  // CodeMirror 接管Tab，这里只处理toolbar插入操作
  form.content = form.content + before + after
}
function insertTab() { /* CodeMirror 内置 Tab缩进 */ }

// Ctrl+S 快捷键
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save() }
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
    const body = { ...form, tags: parsedTags.value }
    if (props.isNew) {
      await $fetch('/api/admin/posts', { method: 'POST', body })
      showToast('文章已发布 ✓')
      savedSnapshot.value = JSON.stringify(body)
      router.push('/admin')
    } else {
      await $fetch(`/api/admin/posts/${props.initialSlug}`, { method: 'PUT', body })
      savedSnapshot.value = JSON.stringify(body)
      showToast('已更新 ✓')
    }
  } catch (e: any) { showToast(e?.data?.message || '保存失败', 'err') }
  finally { saving.value = false }
}
</script>

<style scoped>
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.2s; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateX(-50%) translateY(-8px); }
</style>
