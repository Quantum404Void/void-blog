<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <nav class="sticky top-0 z-50 border-b border-[var(--color-void-border)] bg-[rgba(10,10,15,0.85)] backdrop-blur-xl">
      <div class="max-w-3xl mx-auto px-6 h-14 flex items-center gap-4 font-mono text-xs">
        <NuxtLink to="/lab" class="text-[var(--color-neon-green)]">~/lab</NuxtLink><span>/</span>
        <NuxtLink to="/lab" class="text-[var(--color-neon-cyan)] hover:opacity-80 transition-opacity">tools</NuxtLink><span>/</span>
        <span class="text-[var(--color-neon-purple)]">json</span>
      </div>
    </nav>
    <div class="max-w-3xl mx-auto px-6 py-10">
      <h1 class="font-mono text-xl font-bold text-[var(--color-neon-green)] mb-6">JSON 工具</h1>
      <div class="grid gap-4">
        <textarea v-model="input" placeholder='{ "key": "value" }' class="w-full font-mono text-sm rounded-xl border border-[var(--color-void-border)] p-4 resize-none bg-[var(--color-void-card)] text-[var(--color-text-primary)] outline-none" style="height:200px"></textarea>
        <div class="flex gap-2 flex-wrap">
          <button @click="format(2)" class="font-mono text-xs px-4 py-2 rounded-lg border border-[rgba(57,255,20,0.4)] text-[var(--color-neon-green)] hover:bg-[rgba(57,255,20,0.1)] transition-all">格式化</button>
          <button @click="minify" class="font-mono text-xs px-4 py-2 rounded-lg border border-[rgba(0,212,255,0.4)] text-[var(--color-neon-cyan)] hover:bg-[rgba(0,212,255,0.1)] transition-all">压缩</button>
          <button @click="sort" class="font-mono text-xs px-4 py-2 rounded-lg border border-[rgba(180,0,255,0.4)] text-[var(--color-neon-purple)] hover:bg-[rgba(180,0,255,0.1)] transition-all">排序 key</button>
          <button @click="clear" class="font-mono text-xs px-4 py-2 rounded-lg border border-[rgba(255,0,170,0.3)] text-[rgba(255,0,170,0.7)] hover:bg-[rgba(255,0,170,0.1)] transition-all">清空</button>
        </div>
        <div v-if="msg" class="font-mono text-xs px-4 py-2 rounded-lg" :style="msgOk?'background:rgba(57,255,20,0.1);color:#39ff14;border:1px solid rgba(57,255,20,0.2)':'background:rgba(255,0,170,0.1);color:#ff00aa;border:1px solid rgba(255,0,170,0.2)'">{{ msg }}</div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
const { siteName } = useSiteConfig()
useHead({ title: `JSON 工具 | ` })
const input=ref(''),msg=ref(''),msgOk=ref(true)
function parse(){try{return{ok:true,val:JSON.parse(input.value)}}catch(e:any){return{ok:false,err:e.message}}}
function format(indent: number){const r=parse();if(!r.ok){msg.value='❌ '+r.err;msgOk.value=false;return};input.value=JSON.stringify(r.val,null,indent);msg.value='✓ 格式化完成';msgOk.value=true}
function minify(){const r=parse();if(!r.ok){msg.value='❌ '+r.err;msgOk.value=false;return};input.value=JSON.stringify(r.val);msg.value='✓ 压缩完成';msgOk.value=true}
function sortKeys(obj: any): any{if(Array.isArray(obj))return obj.map(sortKeys);if(obj&&typeof obj==='object'){return Object.keys(obj).sort().reduce((a:any,k)=>{a[k]=sortKeys(obj[k]);return a},{})}return obj}
function sort(){const r=parse();if(!r.ok){msg.value='❌ '+r.err;msgOk.value=false;return};input.value=JSON.stringify(sortKeys(r.val),null,2);msg.value='✓ Key 已排序';msgOk.value=true}
function clear(){input.value='';msg.value=''}
</script>
