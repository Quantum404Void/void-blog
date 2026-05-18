<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <!-- Nav -->
    <nav class="sticky top-0 z-50 border-b border-[var(--color-void-border)] nav-glass">
      <div class="max-w-5xl mx-auto px-6 h-14 flex items-center gap-4">
        <NuxtLink href="/" class="font-mono text-sm text-[var(--color-neon-green)]">void.dev</NuxtLink>
        <span class="text-[var(--color-text-muted)] font-mono text-xs">/</span>
        <span class="font-mono text-sm text-[var(--color-neon-cyan)]">admin</span>
        <div class="ml-auto flex items-center gap-4">
          <NuxtLink href="/admin/posts/new"
            class="font-mono text-xs px-3 py-1.5 rounded-lg border border-[rgba(0,255,136,0.4)] text-[var(--color-neon-green)] bg-[rgba(0,255,136,0.06)] hover:bg-[rgba(0,255,136,0.12)] transition-all">
            + 新文章
          </NuxtLink>
          <button @click="logout"
            class="font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-neon-pink)] transition-colors">
            退出
          </button>
        </div>
      </div>
    </nav>

    <main class="max-w-5xl mx-auto px-6 py-10 space-y-8">

      <!-- Dashboard 卡片 -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div v-for="card in dashCards" :key="card.label"
          class="rounded-xl border border-[var(--color-void-border)] bg-[var(--color-void-card)] px-5 py-4 flex flex-col gap-1">
          <div class="font-mono text-[10px] tracking-widest uppercase" :style="{ color: card.color }">{{ card.label }}</div>
          <div class="font-mono text-2xl font-bold text-[var(--color-text-primary)]">{{ card.value }}</div>
          <div class="font-mono text-[10px] text-[var(--color-text-muted)]">{{ card.sub }}</div>
        </div>
      </div>

      <!-- 最热文章 -->
      <div v-if="overview?.topViewed?.length" class="rounded-xl border border-[var(--color-void-border)] overflow-hidden">
        <div class="px-4 py-2.5 border-b border-[var(--color-void-border)] bg-[rgba(0,212,255,0.04)] font-mono text-[10px] tracking-widest uppercase text-[var(--color-neon-cyan)]">
          🔥 最热文章 Top 5
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

      <!-- 文章列表 -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="font-mono text-xl font-bold text-[var(--color-text-primary)]">
              <span class="text-[var(--color-neon-cyan)]">$</span> ls ~/posts
            </h1>
            <p class="font-mono text-xs text-[var(--color-text-muted)] mt-1">
              共 {{ posts.length }} 篇 · 草稿 {{ drafts }} 篇
            </p>
          </div>
          <div class="flex items-center gap-3">
            <!-- 排序 -->
            <select v-model="sortBy"
              class="font-mono text-xs bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg px-3 py-2 outline-none text-[var(--color-text-muted)] cursor-pointer">
              <option value="date">按日期</option>
              <option value="views">按访问量</option>
              <option value="likes">按点赞</option>
            </select>
            <!-- 搜索 -->
            <input v-model="q" placeholder="过滤文章…"
              class="font-mono text-sm bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg px-4 py-2 w-48 outline-none focus:border-[rgba(0,212,255,0.4)] text-[var(--color-text-primary)] placeholder:text-[var(--color-void-muted)]" />
          </div>
        </div>

        <div class="border border-[var(--color-void-border)] rounded-xl overflow-hidden">
          <table class="w-full font-mono text-xs">
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
                  <span class="text-[var(--color-text-muted)]" :class="{ 'text-[var(--color-neon-cyan)]!': post.views > 0 }">
                    {{ post.views ?? 0 }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center hidden lg:table-cell">
                  <span class="text-[var(--color-text-muted)]" :class="{ 'text-[var(--color-neon-pink)]!': post.likes > 0 }">
                    {{ post.likes ?? 0 }}
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
                  <div class="flex items-center justify-end gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
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
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { PostSummary } from '~/types/post'
definePageMeta({ layout: false })
const { siteName } = useSiteConfig()
useSeoMeta({ title: `Admin | ${siteName}`, robots: 'noindex' })

// 鉴权
const { error: authError } = await useFetch('/api/auth/me')
if (authError.value) navigateTo('/admin/login')

const { data: overviewData } = await useFetch<any>('/api/admin/overview')
const overview = computed(() => overviewData.value)

const { data, refresh } = await useFetch<PostSummary[]>('/api/admin/posts')
const posts = computed(() => data.value || [])
const drafts = computed(() => posts.value.filter((p: PostSummary) => p.draft).length)

const q = ref('')
const sortBy = ref<'date' | 'views' | 'likes'>('date')

const filtered = computed(() => {
  let list = [...posts.value]
  if (q.value) {
    const s = q.value.toLowerCase()
    list = list.filter((p: PostSummary) => p.title.toLowerCase().includes(s) || p.slug.includes(s))
  }
  if (sortBy.value === 'views') list.sort((a: PostSummary, b: PostSummary) => (b.views ?? 0) - (a.views ?? 0))
  else if (sortBy.value === 'likes') list.sort((a: PostSummary, b: PostSummary) => (b.likes ?? 0) - (a.likes ?? 0))
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

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  navigateTo('/admin/login')
}

async function toggleDraft(post: PostSummary) {
  await $fetch(`/api/admin/posts/${post.slug}`, {
    method: 'PUT', body: { draft: !post.draft }
  })
  post.draft = !post.draft
}

async function deletePost(slug: string) {
  if (!confirm(`确认删除 ${slug}？`)) return
  await $fetch(`/api/admin/posts/${slug}`, { method: 'DELETE' })
  await refresh()
}
</script>
