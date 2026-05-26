<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'tools', href: '/lab' }, { label: 'regex' }]" />
    <div class="max-w-3xl mx-auto px-6 py-10 space-y-4">
      <p class="font-mono text-[10px] text-[var(--color-text-muted)] tracking-[0.25em] uppercase mb-2">~/lab/tools/regex</p>

      <h1 class="font-mono text-xl font-bold text-[var(--color-neon-cyan)] mb-6">正则工具</h1>
      <div class="flex gap-2 items-center">
        <span class="font-mono text-lg text-[var(--color-text-muted)]">/</span>
        <input v-model="pattern" placeholder="正则表达式" class="flex-1 font-mono text-sm rounded-xl border border-[var(--color-void-border)] px-4 py-2 bg-[var(--color-void-card)] text-[var(--color-neon-cyan)] outline-none">
        <span class="font-mono text-lg text-[var(--color-text-muted)]">/</span>
        <input v-model="flags" placeholder="flags" class="w-20 font-mono text-sm rounded-xl border border-[var(--color-void-border)] px-3 py-2 bg-[var(--color-void-card)] text-[var(--color-neon-purple)] outline-none">
      </div>
      <textarea v-model="testStr" placeholder="测试字符串..." class="w-full font-mono text-sm rounded-xl border border-[var(--color-void-border)] p-4 resize-none bg-[var(--color-void-card)] text-[var(--color-text-primary)] outline-none" style="height:120px"></textarea>
      <div v-if="errMsg" class="font-mono text-xs text-[var(--color-neon-pink)] px-4 py-2 rounded-lg bg-[rgba(255,0,170,0.05)] border border-[rgba(255,0,170,0.2)]">{{ errMsg }}</div>
      <div v-else-if="matches.length" class="space-y-2">
        <div class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest">匹配 {{ matches.length }} 个</div>
        <div v-for="(m,i) in matches" :key="i" class="border border-[rgba(0,212,255,0.2)] rounded-xl p-3 bg-[rgba(0,212,255,0.03)] font-mono text-xs">
          <span class="text-[var(--color-text-muted)] mr-3">[{{ i }}]</span>
          <span class="text-[var(--color-neon-cyan)]">{{ m[0] }}</span>
          <span v-if="m.length>1" class="ml-3 text-[var(--color-text-muted)]">groups: {{ m.slice(1).join(', ') }}</span>
        </div>
      </div>
      <div v-else-if="pattern&&testStr" class="font-mono text-xs text-[var(--color-text-muted)] px-4 py-2 rounded-lg bg-[var(--color-void-card)] border border-[var(--color-void-border)]">无匹配</div>
      <div v-if="highlighted" class="border border-[var(--color-void-border)] rounded-xl p-4 bg-[var(--color-void-card)] font-mono text-sm leading-relaxed" v-html="highlighted"></div>
    </div>
    <AppFooter />
  </div>
</template>
<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `正则工具 | ${siteName}` })
const pattern=ref(''),flags=ref('g'),testStr=ref(''),errMsg=ref(''),matches=ref<string[][]>([]),highlighted=ref('')
watchEffect(()=>{
  errMsg.value='';matches.value=[];highlighted.value=''
  if(!pattern.value||!testStr.value) return
  try{
    const re=new RegExp(pattern.value,flags.value.includes('g')?flags.value:flags.value+'g')
    const ms=[...testStr.value.matchAll(re)]
    matches.value=ms.map(m=>Array.from(m))
    highlighted.value=testStr.value.replace(new RegExp(pattern.value,flags.value.includes('g')?flags.value:flags.value+'g'),(m)=>`<mark style="background:rgba(0,212,255,0.2);color:#00d4ff;border-radius:3px;padding:0 2px">${m.replace(/</g,'&lt;')}</mark>`)
  }catch(e:any){errMsg.value='❌ '+e.message}
})
</script>
