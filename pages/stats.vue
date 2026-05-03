<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <nav class="sticky top-0 z-50 border-b border-[var(--color-void-border)] nav-glass">
      <div class="max-w-5xl mx-auto px-6 h-14 flex items-center gap-8">
        <NuxtLink href="/" class="font-mono font-bold text-[var(--color-neon-green)] glow-green text-sm tracking-widest">{{ siteName }}</NuxtLink>
        <div class="ml-auto flex items-center gap-5 text-xs font-mono text-[var(--color-text-muted)]">
          <NuxtLink href="/blog" class="hover:text-[var(--color-neon-cyan)] transition-colors">~/blog</NuxtLink>
          <NuxtLink href="/tags" class="hover:text-[var(--color-neon-cyan)] transition-colors">~/tags</NuxtLink>
          <NuxtLink href="/search" class="hover:text-[var(--color-neon-cyan)] transition-colors">~/search</NuxtLink>
          <span class="text-[var(--color-neon-cyan)]">~/stats</span>
          <NuxtLink href="/lab" class="hover:text-[var(--color-neon-cyan)] transition-colors" style="color:rgba(180,0,255,0.8)">~/lab</NuxtLink>
        </div>
      </div>
    </nav>

    <div class="max-w-5xl mx-auto px-6 py-16">
      <div class="mb-12">
        <p class="font-mono text-[10px] text-[var(--color-text-muted)] tracking-[0.2em] uppercase mb-3">analytics</p>
        <h1 class="font-mono text-3xl font-bold text-[var(--color-text-primary)] mb-2">
          <span class="text-[var(--color-neon-cyan)]">~/</span>stats
        </h1>
        <p class="font-mono text-sm text-[var(--color-text-muted)]">博客数据概览</p>
      </div>

      <!-- 概览卡片 -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        <div v-for="card in overviewCards" :key="card.label" class="border border-[var(--color-void-border)] bg-[var(--color-void-card)] rounded-xl p-5">
          <div class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-2 flex items-center gap-1">
            <span :style="`color:var(--color-${card.color})`">▸</span>
            {{ card.label }}
          </div>
          <div class="flex items-end gap-2">
            <div class="font-mono text-2xl font-bold" :style="`color:var(--color-${card.color})`">{{ card.value }}</div>
          </div>
        </div>
      </div>

      <!-- Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="border border-[var(--color-void-border)] bg-[var(--color-void-card)] rounded-xl p-6">
          <h2 class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <span class="text-[var(--color-neon-green)]">▶</span> 年度文章分布
          </h2>
          <ClientOnly>
            <Chart type="bar" :data="yearChartData" :options="yearChartOptions" :height="220" />
          </ClientOnly>
        </div>

        <div class="border border-[var(--color-void-border)] bg-[var(--color-void-card)] rounded-xl p-6">
          <h2 class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <span class="text-[var(--color-neon-cyan)]">▶</span> 热门标签 Top 12
          </h2>
          <ClientOnly>
            <Chart type="bar" :data="tagChartData" :options="tagChartOptions" :height="280" />
          </ClientOnly>
        </div>
      </div>

      <!-- 月度贡献热力图 (GitHub contributions 风格) -->
      <div class="mt-8 border border-[var(--color-void-border)] bg-[var(--color-void-card)] rounded-xl p-6">
        <h2 class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
          <span class="text-[var(--color-neon-green)]">&#9654;</span> 写作热力图
          <span class="ml-auto text-[9px] normal-case tracking-normal">{{ heatmapRange }}</span>
        </h2>
        <div class="overflow-x-auto pb-2">
          <div class="flex gap-[3px]" style="min-width: max-content">
            <div v-for="(week, wi) in heatmapWeeks" :key="wi" class="flex flex-col gap-[3px]">
              <div v-for="(day, di) in week" :key="di"
                class="w-[11px] h-[11px] rounded-sm transition-all"
                :style="{ background: heatColor(day.count), opacity: day.future ? 0.15 : 1 }"
                :title="day.date ? `${day.date}: ${day.count} 篇` : ''"
              />
            </div>
          </div>
          <!-- 炎度图例 -->
          <div class="flex items-center gap-1.5 mt-3 font-mono text-[9px] text-[var(--color-text-muted)]">
            <span>Less</span>
            <div v-for="n in 5" :key="n" class="w-[11px] h-[11px] rounded-sm" :style="{ background: heatColor((n-1) * 2) }"></div>
            <span>More</span>
          </div>
        </div>
      </div>

      <!-- Timeline -->
      <div class="mt-8 border border-[var(--color-void-border)] bg-[var(--color-void-card)] rounded-xl p-6">
        <h2 class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
          <span class="text-[var(--color-neon-purple)]">▶</span> 文章时间线
        </h2>
        <div class="space-y-0.5 max-h-80 overflow-y-auto pr-2 timeline-scroll">
          <NuxtLink
            v-for="p in timelinePosts"
            :key="p.slug"
            :href="`/blog/${p.slug}`"
            class="group flex items-center gap-4 py-2 px-2 rounded-lg hover:bg-[var(--color-void-muted)] transition-colors"
          >
            <time class="font-mono text-[10px] text-[var(--color-text-muted)] shrink-0 w-24">
              {{ new Date(p.pub_date).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }) }}
            </time>
            <span class="font-mono text-xs text-[var(--color-text-primary)] group-hover:text-[var(--color-neon-cyan)] transition-colors line-clamp-1 flex-1">
              {{ p.title }}
            </span>
            <div class="hidden sm:flex flex-wrap gap-1 shrink-0">
              <span v-for="t in p.tags.slice(0, 2)" :key="t" class="font-mono text-[9px] text-[var(--color-text-muted)] bg-[var(--color-void-muted)] px-1.5 py-0.5 rounded-full">#{{ t }}</span>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>

    <footer class="border-t border-[var(--color-void-border)] py-8 mt-8">
      <div class="max-w-5xl mx-auto px-6 font-mono text-xs text-[var(--color-text-muted)] text-center">
        <NuxtLink href="/" class="hover:text-[var(--color-neon-cyan)] transition-colors">← 返回首页</NuxtLink>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const { siteUrl, siteName } = useSiteConfig()
useSeoMeta({
  title: `统计看板 | ${siteName}`,
  description: `${siteName} 博客内容统计：文章数、标签分布、每年产出可视化`,
  ogTitle: `统计看板 | ${siteName}`,
  ogDescription: `${siteName} 博客内容统计：文章数、标签分布、每年产出可视化`,
  ogUrl: `${siteUrl}/stats`,
})

const { data: statsData } = await useFetch('/api/stats')
const { data: postsData } = await useFetch('/api/posts', { default: () => [] as any[] })

const allPosts = computed(() => (postsData.value || []).filter((p: any) => p.slug !== 'about'))
const timelinePosts = computed(() => [...allPosts.value].reverse())

// 月度热力图
const heatmapData = computed(() => {
  const map: Record<string, number> = {}
  for (const p of allPosts.value) {
    map[p.pub_date] = (map[p.pub_date] || 0) + 1
  }
  return map
})

const heatmapWeeks = computed(() => {
  const today = new Date()
  const end = new Date(today)
  // 对齐到本周周六
  end.setDate(end.getDate() + (6 - end.getDay()))
  // 往前 52 周
  const start = new Date(end)
  start.setDate(start.getDate() - 52 * 7 + 1)

  const weeks: { date: string; count: number; future: boolean }[][] = []
  let cur = new Date(start)
  // 对齐到周日
  cur.setDate(cur.getDate() - cur.getDay())

  while (cur <= end) {
    const week: { date: string; count: number; future: boolean }[] = []
    for (let d = 0; d < 7; d++) {
      const dateStr = cur.toISOString().slice(0, 10)
      week.push({
        date: dateStr,
        count: heatmapData.value[dateStr] || 0,
        future: cur > today,
      })
      cur.setDate(cur.getDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
})

const heatmapRange = computed(() => {
  const w = heatmapWeeks.value
  if (!w.length) return ''
  return `${w[0][0].date} ~ ${w[w.length-1][6].date}`
})

function heatColor(count: number): string {
  if (count === 0) return 'rgba(100,100,150,0.12)'
  if (count === 1) return 'rgba(0,212,255,0.25)'
  if (count === 2) return 'rgba(0,212,255,0.5)'
  if (count <= 4) return 'rgba(0,255,136,0.6)'
  return 'rgba(0,255,136,0.9)'
}

const overviewCards = computed(() => {
  const s = statsData.value as any
  return [
    { label: '总文章数', value: allPosts.value.length, color: 'neon-cyan' },
    { label: '标签数量', value: s?.totalTags ?? 0, color: 'neon-green' },
    { label: '写作年份', value: Object.keys(s?.byYear ?? {}).length, color: 'neon-purple' },
    { label: '创作开始', value: allPosts.value.length ? allPosts.value[allPosts.value.length - 1].pub_date.slice(0, 4) : '-', color: 'neon-pink' },
  ]
})

const yearChartData = computed(() => {
  const s = statsData.value as any
  const byYear = s?.byYear ?? {}
  const yearLabels = Object.keys(byYear).sort()
  const yearCounts = yearLabels.map((k: string) => byYear[k])
  const colors = ['rgba(0,212,255,0.7)', 'rgba(57,255,20,0.7)', 'rgba(180,0,255,0.7)', 'rgba(255,0,170,0.7)', 'rgba(255,165,0,0.7)']
  const borderColors = ['rgba(0,212,255,1)', 'rgba(57,255,20,1)', 'rgba(180,0,255,1)', 'rgba(255,0,170,1)', 'rgba(255,165,0,1)']
  return {
    labels: yearLabels,
    datasets: [{
      label: '文章数',
      data: yearCounts,
      backgroundColor: yearLabels.map((_: string, i: number) => colors[i % colors.length]),
      borderColor: yearLabels.map((_: string, i: number) => borderColors[i % borderColors.length]),
      borderWidth: 1,
      borderRadius: 6,
    }]
  }
})

const yearChartOptions = {
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: '#c8c8d8', font: { family: 'JetBrains Mono', size: 11 } }, grid: { display: false }, border: { display: false } },
    y: { ticks: { color: '#8888aa', font: { family: 'JetBrains Mono', size: 10 }, stepSize: 1 }, grid: { color: 'rgba(30,30,48,0.8)' }, border: { display: false } }
  }
}

const tagChartData = computed(() => {
  const s = statsData.value as any
  const tagCounts = s?.tagCounts ?? {}
  const top12 = Object.entries(tagCounts).sort((a: any, b: any) => b[1] - a[1]).slice(0, 12)
  return {
    labels: top12.map(([t]: any) => `#${t}`),
    datasets: [{
      label: '文章数',
      data: top12.map(([, c]: any) => c),
      backgroundColor: 'rgba(0,212,255,0.18)',
      borderColor: 'rgba(0,212,255,0.8)',
      borderWidth: 2,
      pointBackgroundColor: 'rgba(0,212,255,1)',
      pointRadius: 3,
      fill: true,
      tension: 0.3,
    }]
  }
})

const tagChartOptions = {
  indexAxis: 'y' as const,
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: '#8888aa', font: { family: 'JetBrains Mono', size: 10 }, stepSize: 1 }, grid: { color: 'rgba(30,30,48,0.8)' }, border: { display: false } },
    y: { ticks: { color: '#c8c8d8', font: { family: 'JetBrains Mono', size: 10 } }, grid: { display: false }, border: { display: false } }
  }
}
</script>
