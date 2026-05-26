<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'tools', href: '/lab' }, { label: 'timestamp' }]" />
    <div class="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <p class="font-mono text-[10px] text-[var(--color-text-muted)] tracking-[0.25em] uppercase mb-2">~/lab/tools/timestamp</p>

      <h1 class="font-mono text-xl font-bold text-[var(--color-neon-cyan)] mb-6">时间戳工具</h1>
      <div class="border border-[var(--color-void-border)] rounded-xl p-6 bg-[var(--color-void-card)]">
        <div class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-3">当前时间</div>
        <div class="font-mono text-2xl font-bold text-[var(--color-neon-green)] mb-1">{{ nowTs }}</div>
        <div class="font-mono text-sm text-[var(--color-text-muted)]">{{ nowStr }}</div>
      </div>
      <div class="grid grid-cols-1 gap-4">
        <div>
          <label class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-2 block">时间戳 → 时间</label>
          <div class="flex gap-2">
            <input v-model="tsInput" placeholder="1700000000" class="flex-1 font-mono text-sm rounded-xl border border-[var(--color-void-border)] px-4 py-2 bg-[var(--color-void-card)] text-[var(--color-text-primary)] outline-none">
            <button @click="ts2date" class="font-mono text-xs px-4 py-2 rounded-lg border border-[rgba(0,212,255,0.4)] text-[var(--color-neon-cyan)] hover:bg-[rgba(0,212,255,0.1)] transition-all">转换</button>
          </div>
          <div v-if="tsResult" class="mt-2 font-mono text-sm text-[var(--color-neon-cyan)] px-4 py-2 rounded-lg bg-[rgba(0,212,255,0.05)] border border-[rgba(0,212,255,0.1)]">{{ tsResult }}</div>
        </div>
        <div>
          <label class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-2 block">时间 → 时间戳</label>
          <div class="flex gap-2">
            <input v-model="dateInput" type="datetime-local" class="flex-1 font-mono text-sm rounded-xl border border-[var(--color-void-border)] px-4 py-2 bg-[var(--color-void-card)] text-[var(--color-text-primary)] outline-none">
            <button @click="date2ts" class="font-mono text-xs px-4 py-2 rounded-lg border border-[rgba(57,255,20,0.4)] text-[var(--color-neon-green)] hover:bg-[rgba(57,255,20,0.1)] transition-all">转换</button>
          </div>
          <div v-if="dateResult" class="mt-2 font-mono text-sm text-[var(--color-neon-green)] px-4 py-2 rounded-lg bg-[rgba(57,255,20,0.05)] border border-[rgba(57,255,20,0.1)]">{{ dateResult }}</div>
        </div>
      </div>
    </div>
    <AppFooter />
  </div>
</template>
<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `时间戳工具 | ${siteName}` })
const tsInput=ref(''),dateInput=ref(''),tsResult=ref(''),dateResult=ref('')
const nowTs=ref(''),nowStr=ref('')
function update(){const d=new Date();nowTs.value=String(Math.floor(d.getTime()/1000));nowStr.value=d.toLocaleString('zh-CN')}
function ts2date(){const ts=parseInt(tsInput.value);if(isNaN(ts)){tsResult.value='无效时间戳';return};const d=new Date(ts*(String(ts).length<=10?1000:1));tsResult.value=d.toLocaleString('zh-CN')+' (UTC: '+d.toUTCString()+')'}
function date2ts(){if(!dateInput.value){dateResult.value='请选择时间';return};const d=new Date(dateInput.value);dateResult.value=`${Math.floor(d.getTime()/1000)} (ms: ${d.getTime()})`}
let interval: any
onMounted(()=>{update();interval=setInterval(update,1000)})
onUnmounted(()=>clearInterval(interval))
</script>
