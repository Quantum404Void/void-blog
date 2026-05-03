<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'ascii' }]" />
    <div class="max-w-3xl mx-auto px-6 py-10 space-y-4">
      <h1 class="font-mono text-xl font-bold text-[var(--color-neon-cyan)] mb-6">ASCII 工具</h1>
      <div class="flex gap-2">
        <input v-model="input" placeholder="输入字符或 ASCII 码..." class="flex-1 font-mono text-sm rounded-xl border border-[var(--color-void-border)] px-4 py-2 bg-[var(--color-void-card)] text-[var(--color-text-primary)] outline-none">
        <button @click="charToCode" class="font-mono text-xs px-4 py-2 rounded-lg border border-[rgba(0,212,255,0.4)] text-[var(--color-neon-cyan)] hover:bg-[rgba(0,212,255,0.1)] transition-all">字符→码</button>
        <button @click="codeToChar" class="font-mono text-xs px-4 py-2 rounded-lg border border-[rgba(57,255,20,0.4)] text-[var(--color-neon-green)] hover:bg-[rgba(57,255,20,0.1)] transition-all">码→字符</button>
      </div>
      <div v-if="output" class="border border-[var(--color-void-border)] rounded-xl p-4 bg-[var(--color-void-card)] font-mono text-sm text-[var(--color-neon-cyan)]">{{ output }}</div>
      <div class="border border-[var(--color-void-border)] rounded-xl overflow-hidden">
        <div class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest px-4 py-2 border-b border-[var(--color-void-border)]">常用 ASCII 表</div>
        <div class="grid grid-cols-8 gap-0">
          <div v-for="n in 96" :key="n+31" @click="input=String.fromCharCode(n+31)" class="border border-[var(--color-void-border)] p-2 text-center font-mono text-xs cursor-pointer hover:bg-[var(--color-void-muted)] transition-all">
            <div class="text-[var(--color-neon-cyan)]">{{ String.fromCharCode(n+31) }}</div>
            <div class="text-[var(--color-text-muted)] text-[9px]">{{ n+31 }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
const { siteName } = useSiteConfig()
useHead({ title: `ASCII 工具 | ` })
const input=ref(''),output=ref('')
function charToCode(){output.value=[...input.value].map(c=>`${c}=${c.charCodeAt(0)} (0x${c.charCodeAt(0).toString(16)})`).join('  ')}
function codeToChar(){const codes=input.value.trim().split(/\s+/);output.value=codes.map(s=>{const n=parseInt(s);return isNaN(n)?'?':String.fromCharCode(n)}).join('')}
</script>
