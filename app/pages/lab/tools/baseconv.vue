<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'tools', href: '/lab' }, { label: 'baseconv' }]" />
    <div class="max-w-3xl mx-auto px-6 py-10 space-y-4">
      <p class="font-mono text-[10px] text-[var(--color-text-muted)] tracking-[0.25em] uppercase mb-2">~/lab/tools/baseconv</p>

      <h1 class="font-mono text-xl font-bold text-[var(--color-neon-green)] mb-6">进制转换</h1>
      <div v-for="base in bases" :key="base.n" class="flex items-center gap-4">
        <label class="font-mono text-xs text-[var(--color-text-muted)] w-16 shrink-0">{{ base.label }}</label>
        <input :value="values[base.n]" @input="fromBase(base.n, ($event.target as HTMLInputElement).value)"
          class="flex-1 font-mono text-sm rounded-xl border px-4 py-2 bg-[var(--color-void-card)] outline-none transition-all"
          :style="`border-color:${base.color}44;color:${base.color}`">
      </div>
    </div>
    <AppFooter />
  </div>
</template>
<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `进制转换 | ${siteName}` })
const bases=[{n:2,label:'二进制',color:'#39ff14'},{n:8,label:'八进制',color:'#00d4ff'},{n:10,label:'十进制',color:'#b400ff'},{n:16,label:'十六进制',color:'#ff00aa'}]
const values=reactive<Record<number,string>>({2:'',8:'',10:'',16:''})
function fromBase(n: number, val: string){
  if(!val.trim()){bases.forEach(b=>values[b.n]='');return}
  try{const dec=parseInt(val,n);if(isNaN(dec))return;bases.forEach(b=>values[b.n]=dec.toString(b.n).toUpperCase())}catch(e){}
}
</script>
