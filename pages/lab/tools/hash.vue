<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'hash' }]" />
    <div class="max-w-3xl mx-auto px-6 py-10">
      <h1 class="font-mono text-xl font-bold text-[var(--color-neon-purple)] mb-6">Hash 工具</h1>
      <div class="flex flex-col gap-4">
        <textarea v-model="input" placeholder="输入文本..." class="w-full font-mono text-sm rounded-xl border border-[var(--color-void-border)] p-4 resize-none bg-[var(--color-void-card)] text-[var(--color-text-primary)] outline-none" style="height:120px"></textarea>
        <div class="flex gap-2 flex-wrap">
          <button v-for="algo in algos" :key="algo" @click="compute(algo)" class="font-mono text-xs px-4 py-2 rounded-lg border transition-all" :style="active===algo?'border-color:rgba(180,0,255,0.5);color:#b400ff;background:rgba(180,0,255,0.1)':'border-color:rgba(255,255,255,0.1);color:rgba(255,255,255,0.5)'">{{ algo }}</button>
        </div>
        <div v-if="result" class="border border-[var(--color-void-border)] rounded-xl p-4 bg-[var(--color-void-card)]">
          <div class="font-mono text-[10px] text-[var(--color-text-muted)] mb-2 uppercase tracking-widest">{{ active }}</div>
          <div class="font-mono text-sm text-[var(--color-neon-cyan)] break-all">{{ result }}</div>
          <button @click="copy" class="mt-3 font-mono text-[10px] px-3 py-1 rounded border border-[rgba(0,212,255,0.3)] text-[rgba(0,212,255,0.7)] hover:bg-[rgba(0,212,255,0.1)] transition-all">{{ copied?'✓ 已复制':'复制' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
const { siteName } = useSiteConfig()
useHead({ title: `Hash 工具 | ` })
const input = ref(''), result = ref(''), active = ref(''), copied = ref(false)
const algos = ['SHA-256','SHA-512','SHA-1','MD5-like']

async function compute(algo: string){
  active.value=algo; if(!input.value){result.value='';return}
  if(algo==='MD5-like'){result.value=simpleMd5(input.value);return}
  const name=algo==='SHA-256'?'SHA-256':algo==='SHA-512'?'SHA-512':'SHA-1'
  const buf=new TextEncoder().encode(input.value)
  const hashBuf=await crypto.subtle.digest(name,buf)
  result.value=Array.from(new Uint8Array(hashBuf)).map(b=>b.toString(16).padStart(2,'0')).join('')
}

function simpleMd5(s: string){
  let h=0; for(let i=0;i<s.length;i++){h=Math.imul(31,h)+s.charCodeAt(i)|0}
  return (h>>>0).toString(16).padStart(8,'0').repeat(4)
}

async function copy(){navigator.clipboard.writeText(result.value);copied.value=true;setTimeout(()=>copied.value=false,2000)}
watch(input,()=>{if(active.value)compute(active.value)})
</script>
