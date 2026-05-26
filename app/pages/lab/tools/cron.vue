<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'tools', href: '/lab' }, { label: 'cron' }]" />
    <div class="max-w-3xl mx-auto px-6 py-10 space-y-4">
      <p class="font-mono text-[10px] text-[var(--color-text-muted)] tracking-[0.25em] uppercase mb-2">~/lab/tools/cron</p>

      <h1 class="font-mono text-xl font-bold text-[var(--color-neon-purple)] mb-6">Cron 表达式</h1>
      <input v-model="expr" placeholder="* * * * *" class="w-full font-mono text-lg rounded-xl border border-[var(--color-void-border)] px-4 py-3 bg-[var(--color-void-card)] text-[var(--color-neon-cyan)] outline-none">
      <div v-if="desc" class="border border-[var(--color-void-border)] rounded-xl p-4 bg-[var(--color-void-card)]">
        <div class="font-mono text-sm text-[var(--color-text-primary)] mb-3">{{ desc }}</div>
        <div class="grid grid-cols-5 gap-2">
          <div v-for="(f,i) in fields" :key="i" class="text-center">
            <div class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase mb-1">{{ f.label }}</div>
            <div class="font-mono text-xs font-bold" :style="`color:${f.color}`">{{ f.value }}</div>
          </div>
        </div>
      </div>
      <div v-if="nextRuns.length" class="border border-[var(--color-void-border)] rounded-xl p-4 bg-[var(--color-void-card)]">
        <div class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-3">接下来 5 次执行时间</div>
        <div v-for="(t,i) in nextRuns" :key="i" class="font-mono text-xs text-[var(--color-neon-cyan)] py-1">{{ t.toLocaleString('zh-CN') }}</div>
      </div>
      <div class="space-y-2">
        <div class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest">常用示例</div>
        <div v-for="ex in examples" :key="ex.e" @click="expr=ex.e" class="flex gap-4 items-center cursor-pointer hover:bg-[var(--color-void-muted)] rounded-xl px-3 py-2 transition-all">
          <code class="font-mono text-xs text-[var(--color-neon-cyan)] w-32 shrink-0">{{ ex.e }}</code>
          <span class="font-mono text-xs text-[var(--color-text-muted)]">{{ ex.d }}</span>
        </div>
      </div>
    </div>
    <AppFooter />
  </div>
</template>
<script setup lang="ts">
// @ts-ignore
import cronstrue from 'cronstrue/i18n'
// @ts-ignore
import cronParser from 'cron-parser'

const { siteName } = useSiteConfig()
useSeoMeta({ title: `Cron 工具 | ${siteName}` })
const expr=ref('* * * * *')
const examples=[
  {e:'* * * * *',d:'每分钟'},{e:'0 * * * *',d:'每小时整点'},{e:'0 0 * * *',d:'每天 00:00'},
  {e:'0 0 * * 0',d:'每周日 00:00'},{e:'0 0 1 * *',d:'每月1号 00:00'},{e:'*/5 * * * *',d:'每5分钟'},
  {e:'0 9-18 * * 1-5',d:'工作日 9-18点每小时'},{e:'0 7 * * *',d:'每天 07:00'},
]
const LABELS=['分钟','小时','日','月','星期']
const COLORS=['#39ff14','#00d4ff','#b400ff','#ff00aa','#ffa500']
const fields=computed(()=>{const parts=expr.value.trim().split(/\s+/);return LABELS.map((l,i)=>({label:l,value:parts[i]||'*',color:COLORS[i]}))})

const desc=computed(()=>{
  const p=expr.value.trim().split(/\s+/)
  if(p.length!==5) return '⚠ cron 表达式需要 5 个字段'
  try {
    return cronstrue.toString(expr.value, { locale: 'zh_CN' })
  } catch {
    return '⚠ 无效的 cron 表达式'
  }
})

const nextRuns = computed(()=>{
  const p=expr.value.trim().split(/\s+/)
  if(p.length!==5) return []
  try {
    const interval = cronParser.parseExpression(expr.value)
    const results: Date[] = []
    for (let i = 0; i < 5; i++) {
      results.push(interval.next().toDate())
    }
    return results
  } catch {
    return []
  }
})
</script>
