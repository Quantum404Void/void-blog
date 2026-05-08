<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'tools', href: '/lab' }, { label: 'url' }]" />
    <div class="max-w-3xl mx-auto px-6 py-10 space-y-4">
      <h1 class="font-mono text-xl font-bold text-[var(--color-neon-purple)] mb-6">URL 工具</h1>
      <textarea v-model="input" placeholder="输入 URL 或文本..." class="w-full font-mono text-sm rounded-xl border border-[var(--color-void-border)] p-4 resize-none bg-[var(--color-void-card)] text-[var(--color-text-primary)] outline-none" style="height:100px"></textarea>
      <div class="flex gap-2 flex-wrap">
        <button @click="encode" class="font-mono text-xs px-4 py-2 rounded-lg border border-[rgba(0,212,255,0.4)] text-[var(--color-neon-cyan)] hover:bg-[rgba(0,212,255,0.1)] transition-all">Encode</button>
        <button @click="decode" class="font-mono text-xs px-4 py-2 rounded-lg border border-[rgba(57,255,20,0.4)] text-[var(--color-neon-green)] hover:bg-[rgba(57,255,20,0.1)] transition-all">Decode</button>
        <button @click="parse" class="font-mono text-xs px-4 py-2 rounded-lg border border-[rgba(180,0,255,0.4)] text-[var(--color-neon-purple)] hover:bg-[rgba(180,0,255,0.1)] transition-all">解析 URL</button>
        <button @click="clear" class="font-mono text-xs px-4 py-2 rounded-lg border border-[rgba(255,0,170,0.3)] text-[rgba(255,0,170,0.7)] hover:bg-[rgba(255,0,170,0.1)] transition-all">清空</button>
      </div>
      <div v-if="output" class="border border-[var(--color-void-border)] rounded-xl p-4 bg-[var(--color-void-card)] font-mono text-sm text-[var(--color-neon-cyan)] break-all">{{ output }}</div>
      <div v-if="parsed" class="border border-[var(--color-void-border)] rounded-xl p-4 bg-[var(--color-void-card)] space-y-2">
        <div v-for="(v,k) in parsed" :key="k" class="flex gap-3 font-mono text-xs">
          <span class="text-[var(--color-text-muted)] shrink-0 w-20">{{ k }}</span>
          <span class="text-[var(--color-neon-cyan)] break-all">{{ v||'—' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `URL 工具 | ${siteName}` })
const input=ref(''),output=ref(''),parsed=ref<Record<string,string>|null>(null)
function encode(){try{output.value=encodeURIComponent(input.value);parsed.value=null}catch(e){output.value='编码失败'}}
function decode(){try{output.value=decodeURIComponent(input.value);parsed.value=null}catch(e){output.value='解码失败'}}
function parse(){try{const u=new URL(input.value);parsed.value={protocol:u.protocol,host:u.host,pathname:u.pathname,search:u.search,hash:u.hash,origin:u.origin};output.value='';u.searchParams.forEach((v,k)=>parsed.value![`param: ${k}`]=v)}catch(e){output.value='无效 URL';parsed.value=null}}
function clear(){input.value='';output.value='';parsed.value=null}
</script>
