<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <nav class="sticky top-0 z-50 border-b border-[var(--color-void-border)] bg-[rgba(10,10,15,0.85)] backdrop-blur-xl">
      <div class="max-w-3xl mx-auto px-6 h-14 flex items-center gap-4">
        <NuxtLink href="/" class="font-mono text-sm text-[var(--color-neon-green)]">~/void-blog</NuxtLink>
        <span class="text-[var(--color-text-muted)]">/search</span>
      </div>
    </nav>

    <main class="max-w-3xl mx-auto px-6 py-16">
      <h1 class="font-mono text-2xl font-bold text-[var(--color-text-primary)] mb-8 flex items-center gap-3">
        <span class="text-[var(--color-neon-green)]">$</span> grep -r
      </h1>

      <form @submit.prevent="doSearch" class="mb-10">
        <div class="flex gap-3">
          <input
            v-model="q"
            type="text"
            placeholder="搜索文章..."
            autofocus
            class="flex-1 bg-[#0f0f1a] border border-[var(--color-void-border)] rounded-lg px-4 py-2.5 font-mono text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-neon-cyan)] transition-colors"
          />
          <button
            type="submit"
            class="px-5 py-2.5 bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.35)] rounded-lg font-mono text-sm text-[var(--color-neon-cyan)] hover:bg-[rgba(0,212,255,0.2)] transition-colors"
          >搜索</button>
        </div>
      </form>

      <p v-if="q && !pending" class="font-mono text-xs text-[var(--color-text-muted)] mb-6">
        "{{ q }}" — {{ results.length }} 篇结果
      </p>

      <div class="space-y-2">
        <NuxtLink
          v-for="post in results"
          :key="post.slug"
          :href="`/blog/${post.slug}`"
          class="group block p-4 rounded-xl border border-transparent hover:border-[var(--color-void-border)] hover:bg-[var(--color-void-card)] transition-all"
        >
          <div class="flex items-start justify-between gap-4 mb-1">
            <h3 class="font-mono text-sm text-[var(--color-text-primary)] group-hover:text-[var(--color-neon-cyan)] transition-colors">{{ post.title }}</h3>
            <time :datetime="post.pub_date" class="font-mono text-[10px] text-[var(--color-text-muted)] shrink-0">
              {{ formatDate(post.pub_date) }}
            </time>
          </div>
          <p v-if="post.description" class="text-xs text-[var(--color-text-muted)] line-clamp-2">{{ post.description }}</p>
          <div class="flex gap-1.5 mt-2">
            <span v-for="t in post.tags.slice(0, 3)" :key="t"
                  class="font-mono text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--color-void-muted)] text-[var(--color-text-muted)]">#{{ t }}</span>
          </div>
        </NuxtLink>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({ title: '搜索 | void.dev' })

const route = useRoute()
const router = useRouter()
const q = ref((route.query.q as string) || '')
const results = ref<any[]>([])
const pending = ref(false)

async function doSearch() {
  if (!q.value.trim()) { results.value = []; return }
  pending.value = true
  await router.replace({ query: { q: q.value } })
  try {
    results.value = await $fetch(`/api/search?q=${encodeURIComponent(q.value)}`)
  } finally {
    pending.value = false
  }
}

// Auto-search if q from URL
if (q.value) doSearch()

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
</script>
