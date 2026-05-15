<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'tools', href: '/lab' }, { label: 'base64' }]" />
    <div class="max-w-3xl mx-auto px-6 py-10">
      <h1 class="font-mono text-xl font-bold text-[var(--color-neon-cyan)] mb-6">Base64 工具</h1>
      <div class="grid gap-4">
        <div>
          <label class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-2 block">输入</label>
          <textarea v-model="input" class="w-full font-mono text-sm rounded-xl border border-[var(--color-void-border)] p-4 resize-none bg-[var(--color-void-card)] text-[var(--color-text-primary)] outline-none" style="height:120px"></textarea>
        </div>
        <div class="flex gap-2">
          <button @click="encode" class="font-mono text-xs px-4 py-2 rounded-lg border border-[rgba(0,212,255,0.4)] text-[var(--color-neon-cyan)] hover:bg-[rgba(0,212,255,0.1)] transition-all">Encode →</button>
          <button @click="decode" class="font-mono text-xs px-4 py-2 rounded-lg border border-[rgba(57,255,20,0.4)] text-[var(--color-neon-green)] hover:bg-[rgba(57,255,20,0.1)] transition-all">← Decode</button>
          <button @click="swap" class="font-mono text-xs px-4 py-2 rounded-lg border border-[rgba(255,255,255,0.1)] text-[var(--color-text-muted)] hover:bg-[rgba(255,255,255,0.05)] transition-all">⇆ 交换</button>
          <button @click="clear" class="font-mono text-xs px-4 py-2 rounded-lg border border-[rgba(255,0,170,0.3)] text-[rgba(255,0,170,0.7)] hover:bg-[rgba(255,0,170,0.1)] transition-all">清空</button>
        </div>
        <div v-if="output!==null">
          <label class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-2 block">输出 {{ error?'（错误）':'' }}</label>
          <div class="border rounded-xl p-4 bg-[var(--color-void-card)] font-mono text-sm break-all" :style="error?'border-color:rgba(255,0,170,0.3);color:#ff00aa':'border-color:rgba(255,255,255,0.08);color:#e8e8f0'">{{ output }}</div>
          <button v-if="!error" @click="copyOut" class="mt-2 font-mono text-[10px] px-3 py-1 rounded border border-[rgba(0,212,255,0.3)] text-[rgba(0,212,255,0.7)] hover:bg-[rgba(0,212,255,0.1)] transition-all">{{ copied?'✓ 已复制':'复制' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
const { copy: copyToClipboard, copied } = useClipboard()
const { siteName } = useSiteConfig()
useSeoMeta({ title: `Base64 工具 | ${siteName}` })
const input=ref(''),output=ref<string|null>(null),error=ref(false)
function encode(){try{output.value=btoa(unescape(encodeURIComponent(input.value)));error.value=false}catch(e){output.value='编码失败';error.value=true}}
function decode(){try{output.value=decodeURIComponent(escape(atob(input.value)));error.value=false}catch(e){output.value='非有效 Base64';error.value=true}}
function swap(){const t=input.value;input.value=output.value??'';output.value=t}
function clear(){input.value='';output.value=null;error.value=false}
async function copyOut(){if(output.value)await copyToClipboard(output.value)}
</script>
