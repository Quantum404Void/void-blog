<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <!-- Nav -->
    <nav class="sticky top-0 z-50 border-b border-[var(--color-void-border)] nav-glass" aria-label="管理后台导航">
      <div class="layout-shell layout-admin min-h-16 py-2 flex flex-wrap items-center gap-3">
        <NuxtLink href="/" class="font-mono text-sm text-[var(--color-neon-green)]">void.dev</NuxtLink>
        <span class="text-[var(--color-text-muted)] font-mono text-xs">/</span>
        <span class="font-mono text-sm text-[var(--color-neon-cyan)]">admin</span>
        <div class="ml-auto flex items-center gap-2">
          <NuxtLink href="/admin/posts/new"
            class="admin-action inline-flex items-center font-mono text-xs px-3 rounded-lg border border-[rgba(0,255,136,0.4)] text-[var(--color-neon-green)] bg-[rgba(0,255,136,0.06)] hover:bg-[rgba(0,255,136,0.12)] transition-colors">
            + 新文章
          </NuxtLink>
          <button @click="logout"
            class="px-3 font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-neon-pink)] transition-colors">
            退出
          </button>
        </div>
      </div>
    </nav>

    <main class="layout-shell layout-admin py-8 sm:py-10 space-y-8">

      <!-- Dashboard 卡片 -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div v-for="card in dashCards" :key="card.label"
          class="rounded-xl border border-[var(--color-void-border)] bg-[var(--color-void-card)] px-5 py-4 flex flex-col gap-1">
          <div class="font-mono text-[10px] tracking-widest uppercase" :style="{ color: card.color }">{{ card.label }}</div>
          <div class="font-mono text-2xl font-bold text-[var(--color-text-primary)]">{{ card.value }}</div>
          <div class="font-mono text-[10px] text-[var(--color-text-muted)]">{{ card.sub }}</div>
        </div>
      </div>

      <!-- 数据面板：最热文章 + 最近活跃 + 标签统计 -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <!-- 最热文章 -->
        <div v-if="overview?.topViewed?.length" class="lg:col-span-2 rounded-xl border border-[var(--color-void-border)] overflow-hidden">
          <div class="px-4 py-2.5 border-b border-[var(--color-void-border)] bg-[rgba(0,212,255,0.04)] font-mono text-[10px] tracking-widest uppercase text-[var(--color-neon-cyan)]">
            最热文章 · Top 5
          </div>
          <div class="divide-y divide-[var(--color-void-border)]">
            <div v-for="(p, i) in overview.topViewed" :key="p.slug"
              class="flex items-center gap-3 px-4 py-2.5 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
              <span class="font-mono text-xs text-[var(--color-void-muted)] w-4 text-right shrink-0">{{ i + 1 }}</span>
              <NuxtLink :href="`/blog/${p.slug}`" target="_blank"
                class="flex-1 font-mono text-xs text-[var(--color-text-primary)] truncate hover:text-[var(--color-neon-cyan)] transition-colors">
                {{ p.title }}
              </NuxtLink>
              <span class="font-mono text-xs text-[var(--color-text-muted)] shrink-0">👁 {{ p.views }}</span>
              <span class="font-mono text-xs text-[var(--color-text-muted)] shrink-0">❤ {{ p.likes }}</span>
            </div>
          </div>
        </div>

        <!-- 标签统计 -->
        <div class="rounded-xl border border-[var(--color-void-border)] overflow-hidden">
          <div class="px-4 py-2.5 border-b border-[var(--color-void-border)] bg-[rgba(180,0,255,0.04)] font-mono text-[10px] tracking-widest uppercase text-[var(--color-neon-purple, #b400ff)]">
            标签分布 · Top 10
          </div>
          <div v-if="tags.length" class="px-4 py-3 space-y-2">
            <div v-for="t in tags.slice(0,10)" :key="t.tag" class="flex items-center gap-2">
              <span class="font-mono text-[10px] text-[var(--color-text-muted)] w-20 truncate">#{{ t.tag }}</span>
              <div class="flex-1 h-1.5 bg-[var(--color-void-muted)] rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500"
                  :style="{ width: `${Math.round((t.count / (tags[0]?.count || 1)) * 100)}%`, background: 'var(--color-neon-purple, #b400ff)' }"></div>
              </div>
              <span class="font-mono text-[10px] text-[var(--color-text-muted)] w-4 text-right shrink-0">{{ t.count }}</span>
            </div>
          </div>
          <div v-else class="px-4 py-6 text-center font-mono text-[10px] text-[var(--color-text-muted)]">加载中…</div>
        </div>
      </div>

      <!-- 最近活跃 -->
      <div v-if="overview?.recentActive?.length" class="rounded-xl border border-[var(--color-void-border)] overflow-hidden">
        <div class="px-4 py-2.5 border-b border-[var(--color-void-border)] bg-[rgba(0,255,136,0.04)] font-mono text-[10px] tracking-widest uppercase text-[var(--color-neon-green)]">
          最近活跃
        </div>
        <div class="divide-y divide-[var(--color-void-border)]">
          <div v-for="p in overview.recentActive" :key="p.slug"
            class="flex items-center gap-3 px-4 py-2 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
            <NuxtLink :href="`/blog/${p.slug}`" target="_blank"
              class="flex-1 font-mono text-xs text-[var(--color-text-primary)] truncate hover:text-[var(--color-neon-green)] transition-colors">
              {{ p.slug }}
            </NuxtLink>
            <span class="font-mono text-[10px] text-[var(--color-text-muted)] shrink-0">👁 {{ p.views }}</span>
            <span class="font-mono text-[10px] text-[var(--color-text-muted)] shrink-0">{{ p.updated_at?.slice(0,10) }}</span>
          </div>
        </div>
      </div>

      <!-- 系统操作 -->
      <div class="rounded-xl border border-[var(--color-void-border)] overflow-hidden">
        <div class="px-4 py-2.5 border-b border-[var(--color-void-border)] bg-[rgba(0,0,0,0.2)] font-mono text-[10px] tracking-widest uppercase text-[var(--color-text-muted)]">
          系统操作
        </div>
        <div class="flex flex-wrap items-center gap-3 px-4 py-4">
          <button @click="syncWordCount" :disabled="syncing"
            class="font-mono text-xs px-4 py-2 rounded-lg border transition-all"
            :class="syncing ? 'border-[var(--color-void-border)] text-[var(--color-text-muted)] cursor-wait'
              : 'border-[rgba(0,212,255,0.4)] text-[var(--color-neon-cyan)] hover:bg-[rgba(0,212,255,0.06)]'">
            {{ syncing ? '同步中…' : '同步字数' }}
          </button>
          <button @click="rebuildFts" :disabled="rebuilding"
            class="font-mono text-xs px-4 py-2 rounded-lg border transition-all"
            :class="rebuilding ? 'border-[var(--color-void-border)] text-[var(--color-text-muted)] cursor-wait'
              : 'border-[rgba(180,0,255,0.4)] text-[var(--color-neon-purple,#b400ff)] hover:bg-[rgba(180,0,255,0.06)]'">
            {{ rebuilding ? '重建中…' : '重建 FTS 索引' }}
          </button>
          <span v-if="opsMsg" role="status" aria-live="polite" class="font-mono text-[10px]"
            :class="opsMsg.startsWith('已') || opsMsg.startsWith('FTS') ? 'text-[var(--color-neon-green)]' : 'text-[var(--color-neon-pink)]'">
            {{ opsMsg }}
          </span>
        </div>
      </div>

      <!-- 文章列表 -->
      <section aria-labelledby="posts-heading">
        <div class="flex flex-col gap-4 mb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 id="posts-heading" class="font-mono text-xl font-bold text-[var(--color-text-primary)]">
              <span class="text-[var(--color-neon-cyan)]">$</span> ls ~/posts
            </h1>
            <p class="font-mono text-xs text-[var(--color-text-muted)] mt-1">
              共 {{ posts.length }} 篇 · 草稿 {{ drafts }} 篇
            </p>
          </div>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-[9rem_13rem]">
            <select v-model="sortBy"
              aria-label="文章排序"
              class="font-mono text-xs bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg px-3 outline-none text-[var(--color-text-secondary)] cursor-pointer">
              <option value="date">按日期</option>
              <option value="views">按访问量</option>
              <option value="likes">按点赞</option>
              <option value="wc">按字数</option>
            </select>
            <input v-model="q" placeholder="过滤标题、slug 或标签…" aria-label="过滤文章"
              class="font-mono text-sm bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg px-4 outline-none focus:border-[rgba(0,212,255,0.4)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]" />
          </div>
        </div>

        <div class="hidden border border-[var(--color-void-border)] rounded-xl overflow-x-auto md:block">
          <table class="w-full min-w-[58rem] font-mono text-xs">
            <thead>
              <tr class="border-b border-[var(--color-void-border)] bg-[rgba(0,212,255,0.05)]">
                <th class="text-left px-4 py-3 text-[var(--color-neon-cyan)] font-semibold tracking-wider uppercase">标题</th>
                <th class="text-left px-4 py-3 text-[var(--color-neon-cyan)] font-semibold tracking-wider uppercase hidden sm:table-cell">日期</th>
                <th class="text-left px-4 py-3 text-[var(--color-neon-cyan)] font-semibold tracking-wider uppercase hidden md:table-cell">标签</th>
                <th class="text-center px-4 py-3 text-[var(--color-neon-cyan)] font-semibold tracking-wider uppercase hidden lg:table-cell cursor-pointer select-none hover:text-white transition-colors"
                  @click="sortBy = 'views'">
                  👁 访问{{ sortBy === 'views' ? ' ↓' : '' }}
                </th>
                <th class="text-center px-4 py-3 text-[var(--color-neon-cyan)] font-semibold tracking-wider uppercase hidden lg:table-cell cursor-pointer select-none hover:text-white transition-colors"
                  @click="sortBy = 'likes'">
                  ❤ 点赞{{ sortBy === 'likes' ? ' ↓' : '' }}
                </th>
                <th class="text-center px-4 py-3 text-[var(--color-neon-cyan)] font-semibold tracking-wider uppercase hidden xl:table-cell cursor-pointer select-none hover:text-white transition-colors"
                  @click="sortBy = 'wc'">
                  📝 字数{{ sortBy === 'wc' ? ' ↓' : '' }}
                </th>
                <th class="text-left px-4 py-3 text-[var(--color-neon-cyan)] font-semibold tracking-wider uppercase">状态</th>
                <th class="text-right px-4 py-3 text-[var(--color-neon-cyan)] font-semibold tracking-wider uppercase">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="post in filtered" :key="post.slug"
                  class="border-b border-[var(--color-void-border)] last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors group">
                <td class="px-4 py-3">
                  <div class="text-[var(--color-text-primary)] truncate max-w-xs">{{ post.title }}</div>
                  <div class="text-[var(--color-text-muted)] text-[10px] mt-0.5">{{ post.slug }}</div>
                </td>
                <td class="px-4 py-3 text-[var(--color-text-muted)] hidden sm:table-cell whitespace-nowrap">
                  {{ post.pub_date }}
                </td>
                <td class="px-4 py-3 hidden md:table-cell">
                  <div class="flex flex-wrap gap-1">
                    <span v-for="tag in post.tags.slice(0,3)" :key="tag"
                      class="px-1.5 py-0.5 rounded bg-[var(--color-void-muted)] text-[var(--color-text-muted)]">
                      #{{ tag }}
                    </span>
                  </div>
                </td>
                <td class="px-4 py-3 text-center hidden lg:table-cell">
                  <span class="text-[var(--color-text-muted)]" :class="{ 'text-[var(--color-neon-cyan)]!': (post.views ?? 0) > 0 }">
                    {{ post.views ?? 0 }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center hidden lg:table-cell">
                  <span class="text-[var(--color-text-muted)]" :class="{ 'text-[var(--color-neon-pink)]!': (post.likes ?? 0) > 0 }">
                    {{ post.likes ?? 0 }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center hidden xl:table-cell">
                  <span class="text-[var(--color-text-muted)]" :class="{ 'text-[var(--color-text-secondary)]!': (post.word_count ?? 0) > 0 }">
                    {{ post.word_count ? post.word_count.toLocaleString() : '—' }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <span class="px-2 py-0.5 rounded-full text-[10px] whitespace-nowrap cursor-pointer select-none transition-all hover:opacity-80"
                    :class="post.draft
                      ? 'bg-[rgba(255,200,0,0.1)] text-[#ffc800] border border-[rgba(255,200,0,0.3)]'
                      : 'bg-[rgba(0,255,136,0.08)] text-[var(--color-neon-green)] border border-[rgba(0,255,136,0.3)]'"
                    @click.stop="toggleDraft(post)">
                    {{ post.draft ? '草稿' : '已发布' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right whitespace-nowrap">
                  <div class="flex items-center justify-end gap-3">
                    <NuxtLink :href="`/blog/${post.slug}`" target="_blank"
                      class="text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)] transition-colors">预览</NuxtLink>
                    <NuxtLink :href="`/admin/posts/${post.slug}`"
                      class="text-[var(--color-text-muted)] hover:text-[var(--color-neon-green)] transition-colors">编辑</NuxtLink>
                    <button @click="deletePost(post.slug)"
                      class="text-[var(--color-text-muted)] hover:text-[var(--color-neon-pink)] transition-colors">删除</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="filtered.length === 0" class="py-16 text-center font-mono text-xs text-[var(--color-text-muted)]">
            无文章
          </div>
        </div>

        <div class="space-y-3 md:hidden">
          <article v-for="post in filtered" :key="post.slug" class="rounded-xl border border-[var(--color-void-border)] bg-[var(--color-void-card)] p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h2 class="text-sm font-semibold text-[var(--color-text-primary)]">{{ post.title }}</h2>
                <p class="mt-1 break-all font-mono text-[10px] text-[var(--color-text-muted)]">{{ post.slug }}</p>
              </div>
              <button class="shrink-0 rounded-full border px-2.5 font-mono text-[10px]" :class="post.draft ? 'border-[rgba(255,200,0,0.3)] text-[#ffc800]' : 'border-[rgba(0,255,136,0.3)] text-[var(--color-neon-green)]'" @click="toggleDraft(post)">
                {{ post.draft ? '草稿' : '已发布' }}
              </button>
            </div>
            <div class="mt-3 flex flex-wrap gap-1.5">
              <span v-for="tag in post.tags.slice(0, 4)" :key="tag" class="rounded-md border border-[var(--color-void-border)] px-2 py-1 font-mono text-[10px] text-[var(--color-text-muted)]">#{{ tag }}</span>
            </div>
            <div class="mt-4 flex items-center justify-between border-t border-[var(--color-void-border)] pt-3">
              <span class="font-mono text-[10px] text-[var(--color-text-muted)]">{{ post.pub_date }} · {{ post.word_count ?? 0 }} 字</span>
              <div class="flex items-center gap-1">
                <NuxtLink :href="`/blog/${post.slug}`" target="_blank" class="admin-action inline-flex items-center px-3 font-mono text-xs text-[var(--color-neon-cyan)]">预览</NuxtLink>
                <NuxtLink :href="`/admin/posts/${post.slug}`" class="admin-action inline-flex items-center px-3 font-mono text-xs text-[var(--color-neon-green)]">编辑</NuxtLink>
                <button class="px-3 font-mono text-xs text-[var(--color-neon-pink)]" @click="deletePost(post.slug)">删除</button>
              </div>
            </div>
          </article>
          <div v-if="filtered.length === 0" class="border-y border-[var(--color-void-border)] py-12 text-center font-mono text-xs text-[var(--color-text-muted)]">没有匹配文章</div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { PostSummary } from '~/types/post'

interface AdminOverview {
  posts: { total: number; published: number; drafts: number }
  stats: { totalViews: number; totalLikes: number }
  topViewed: Array<{ slug: string; title: string; views: number; likes: number }>
  recentActive: Array<{ slug: string; views: number; updated_at: string }>
}

interface ApiError {
  data?: { message?: string }
  message?: string
}

definePageMeta({ layout: false })
const { siteName } = useSiteConfig()
useSeoMeta({ title: `Admin | ${siteName}`, robots: 'noindex' })

// 鉴权
const { error: authError } = await useFetch('/api/auth/me')
if (authError.value) navigateTo('/admin/login')

const { data: overviewData } = await useFetch<AdminOverview>('/api/admin/overview')
const overview = computed(() => overviewData.value)

const { data, refresh } = await useFetch<PostSummary[]>('/api/admin/posts')
const posts = computed(() => data.value || [])
const drafts = computed(() => posts.value.filter((p: PostSummary) => p.draft).length)

// 标签统计
interface TagCount { tag: string; count: number }
const { data: tagsData } = await useFetch<TagCount[]>('/api/admin/tags')
const tags = computed(() => tagsData.value || [])

const q = shallowRef('')
const sortBy = shallowRef<'date' | 'views' | 'likes' | 'wc'>('date')

const filtered = computed(() => {
  let list = [...posts.value]
  if (q.value) {
    const s = q.value.toLowerCase()
    list = list.filter((p: PostSummary) =>
      p.title.toLowerCase().includes(s)
      || p.slug.toLowerCase().includes(s)
      || p.tags.some(tag => tag.toLowerCase().includes(s)),
    )
  }
  if (sortBy.value === 'views') list.sort((a: PostSummary, b: PostSummary) => (b.views ?? 0) - (a.views ?? 0))
  else if (sortBy.value === 'likes') list.sort((a: PostSummary, b: PostSummary) => (b.likes ?? 0) - (a.likes ?? 0))
  else if (sortBy.value === 'wc') list.sort((a: PostSummary, b: PostSummary) => (b.word_count ?? 0) - (a.word_count ?? 0))
  return list
})

// Dashboard 卡片
const dashCards = computed(() => {
  const ov = overview.value
  return [
    { label: '总文章', value: ov?.posts?.total ?? posts.value.length, sub: `草稿 ${ov?.posts?.drafts ?? drafts.value} 篇`, color: 'var(--color-neon-cyan)' },
    { label: '已发布', value: ov?.posts?.published ?? (posts.value.length - drafts.value), sub: '公开可见', color: 'var(--color-neon-green)' },
    { label: '总访问', value: ov?.stats?.totalViews ?? 0, sub: '全站累计 PV', color: 'var(--color-neon-cyan)' },
    { label: '总点赞', value: ov?.stats?.totalLikes ?? 0, sub: '全站累计', color: 'var(--color-neon-pink)' },
  ]
})

// 系统操作
const syncing = shallowRef(false)
const rebuilding = shallowRef(false)
const opsMsg = shallowRef('')
let opsTimer: ReturnType<typeof setTimeout> | undefined

function getErrorMessage(error: unknown) {
  const apiError = error as ApiError
  return apiError.data?.message ?? apiError.message ?? String(error)
}

function clearOpsMessageLater() {
  if (opsTimer) clearTimeout(opsTimer)
  opsTimer = setTimeout(() => { opsMsg.value = '' }, 4000)
}

onUnmounted(() => {
  if (opsTimer) clearTimeout(opsTimer)
})

async function syncWordCount() {
  syncing.value = true
  opsMsg.value = ''
  try {
    const r = await $fetch<{ updated: number }>('/api/admin/sync-wordcount', { method: 'POST' })
    opsMsg.value = `已同步 ${r.updated} 篇字数`
    await refresh()
  } catch (error: unknown) {
    opsMsg.value = `同步失败：${getErrorMessage(error)}`
  } finally {
    syncing.value = false
    clearOpsMessageLater()
  }
}

async function rebuildFts() {
  rebuilding.value = true
  opsMsg.value = ''
  try {
    const r = await $fetch<{ rebuilt: number }>('/api/admin/rebuild-fts', { method: 'POST' })
    opsMsg.value = `FTS 已重建 ${r.rebuilt} 篇`
  } catch (error: unknown) {
    opsMsg.value = `重建失败：${getErrorMessage(error)}`
  } finally {
    rebuilding.value = false
    clearOpsMessageLater()
  }
}

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  navigateTo('/admin/login')
}

async function toggleDraft(post: PostSummary) {
  try {
    await $fetch(`/api/admin/posts/${post.slug}`, {
      method: 'PUT', body: { draft: !post.draft },
    })
    await refresh()
  } catch (error: unknown) {
    opsMsg.value = `状态更新失败：${getErrorMessage(error)}`
  }
}

async function deletePost(slug: string) {
  if (!confirm(`确认删除 ${slug}？`)) return
  try {
    await $fetch(`/api/admin/posts/${slug}`, { method: 'DELETE' })
    await refresh()
  } catch (error: unknown) {
    opsMsg.value = `删除失败：${getErrorMessage(error)}`
  }
}
</script>
