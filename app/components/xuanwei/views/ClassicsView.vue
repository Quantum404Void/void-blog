<script setup lang="ts">
import { CLASSICS } from '@/engine/knowledge/classics'

const query = shallowRef('')
const status = shallowRef('all')

const statusLabels: Record<string, string> = {
  all: '全部状态',
  open: '开放全文',
  excerpt_open: '开放节选',
  structured: '已有结构化数据',
  bibliography: '书目索引',
  review: '待核验',
}

const visibleClassics = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  return CLASSICS.filter((item) => {
    const matchesQuery = !keyword || [item.title, item.author, item.period, item.system].some(value => value.toLowerCase().includes(keyword))
    const matchesStatus = status.value === 'all'
      || (status.value === 'structured' ? item.mode === 'structured' : status.value === 'review' ? ['copyright_review', 'title_review', 'variant'].includes(item.source_status) : item.source_status === status.value)
    return matchesQuery && matchesStatus
  })
})
</script>

<template>
  <section class="xw-page">
    <header><h1>古籍目录</h1><p>46 部传统资料的版本、来源与项目收录状态</p></header>
    <div class="xw-stack">
      <XuanweiPanel title="筛选资料">
        <div class="xw-form-grid">
          <label class="xw-field"><span>关键词</span><input v-model="query" class="xw-control" type="search" placeholder="书名、作者、朝代或体系"></label>
          <label class="xw-field"><span>收录状态</span><select v-model="status" class="xw-control"><option v-for="(label, value) in statusLabels" :key="value" :value="value">{{ label }}</option></select></label>
        </div>
        <p class="xw-result-note">显示 {{ visibleClassics.length }} / {{ CLASSICS.length }} 部。开放链接均已核验；目录收录不等同于伪称本地拥有全文。</p>
      </XuanweiPanel>

      <div class="xw-classics-list">
        <article v-for="item in visibleClassics" :key="item.id" class="xw-classic-card">
          <div><span>{{ item.system }}</span><span>{{ item.period }}</span><span>{{ item.mode === 'structured' ? '结构化' : '已索引' }}</span></div>
          <h2>{{ item.title }}</h2>
          <p>{{ item.author }}</p>
          <a v-if="item.source_url" :href="item.source_url" target="_blank" rel="noopener noreferrer">查看开放来源 ↗</a>
          <small v-else>{{ statusLabels[item.source_status] ?? '来源待核验' }}</small>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.xw-classics-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; }
.xw-classic-card { padding: 1rem; border: 1px solid var(--color-void-border); border-radius: .75rem; background: var(--color-void-card); }
.xw-classic-card > div { display: flex; flex-wrap: wrap; gap: .35rem; }
.xw-classic-card span { padding: .15rem .4rem; border-radius: 999px; color: var(--color-text-muted); background: var(--color-void-muted); font-size: .65rem; }
.xw-classic-card h2 { margin: .75rem 0 .25rem; color: var(--color-text-primary); font-family: var(--xw-serif); font-size: 1rem; }
.xw-classic-card p { margin: 0 0 .65rem; color: var(--color-text-muted); font-size: .75rem; }
.xw-classic-card a, .xw-classic-card small { color: var(--xw-accent); font-size: .72rem; text-decoration: none; }
@media (max-width: 40rem) { .xw-classics-list { grid-template-columns: 1fr; } }
</style>
