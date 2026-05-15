<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'tools', href: '/lab' }, { label: 'hash' }]" />
    <div class="max-w-3xl mx-auto px-6 py-10">
      <h1 class="font-mono text-xl font-bold text-[var(--color-neon-purple)] mb-6">Hash 工具</h1>
      <div class="flex gap-2 mb-4">
        <button @click="mode='text'" class="font-mono text-xs px-4 py-2 rounded-lg border transition-all" :style="mode==='text'?'border-color:rgba(180,0,255,0.5);color:#b400ff;background:rgba(180,0,255,0.1)':'border-color:rgba(255,255,255,0.1);color:rgba(255,255,255,0.5)'">文本</button>
        <button @click="mode='file'" class="font-mono text-xs px-4 py-2 rounded-lg border transition-all" :style="mode==='file'?'border-color:rgba(180,0,255,0.5);color:#b400ff;background:rgba(180,0,255,0.1)':'border-color:rgba(255,255,255,0.1);color:rgba(255,255,255,0.5)'">文件</button>
      </div>
      <div class="flex flex-col gap-4">
        <textarea v-if="mode==='text'" v-model="input" placeholder="输入文本..." class="w-full font-mono text-sm rounded-xl border border-[var(--color-void-border)] p-4 resize-none bg-[var(--color-void-card)] text-[var(--color-text-primary)] outline-none" style="height:120px"></textarea>
        <div v-else class="border border-dashed border-[var(--color-void-border)] rounded-xl p-8 bg-[var(--color-void-card)] text-center">
          <input type="file" ref="fileInput" @change="onFile" class="hidden">
          <div class="font-mono text-sm text-[var(--color-text-muted)] mb-3">{{ fileName || '选择或拖入文件' }}</div>
          <button @click="fileInput?.click()" class="font-mono text-xs px-4 py-2 rounded-lg border border-[rgba(180,0,255,0.4)] text-[var(--color-neon-purple)] hover:bg-[rgba(180,0,255,0.1)] transition-all">选择文件</button>
        </div>
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
useSeoMeta({ title: `Hash 工具 | ${siteName}` })
const input = ref(''), result = ref(''), active = ref(''), copied = ref(false)
const mode = ref<'text'|'file'>('text')
const fileName = ref('')
const fileBuffer = ref<ArrayBuffer|null>(null)
const fileInput = ref<HTMLInputElement|null>(null)
const algos = ['SHA-256','SHA-512','SHA-384','SHA-1']

async function compute(algo: string){
  active.value = algo
  let buf: ArrayBuffer
  if (mode.value === 'file') {
    if (!fileBuffer.value) { result.value = ''; return }
    buf = fileBuffer.value
  } else {
    if (!input.value) { result.value = ''; return }
    buf = new TextEncoder().encode(input.value).buffer
  }
  const hashBuf = await crypto.subtle.digest(algo, buf)
  result.value = Array.from(new Uint8Array(hashBuf)).map(b=>b.toString(16).padStart(2,'0')).join('')
}

function onFile(e: Event){
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  fileName.value = f.name
  const reader = new FileReader()
  reader.onload = async () => {
    fileBuffer.value = reader.result as ArrayBuffer
    if (active.value) compute(active.value)
  }
  reader.readAsArrayBuffer(f)
}

async function copy(){navigator.clipboard.writeText(result.value);copied.value=true;setTimeout(()=>copied.value=false,2000)}
watch(input,()=>{if(active.value && mode.value==='text')compute(active.value)})
</script>
