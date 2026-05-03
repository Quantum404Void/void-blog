<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <nav class="sticky top-0 z-50 border-b border-[var(--color-void-border)] bg-[rgba(10,10,15,0.85)] backdrop-blur-xl">
      <div class="max-w-5xl mx-auto px-6 h-14 flex items-center gap-4 font-mono text-xs">
        <NuxtLink to="/lab" class="text-[var(--color-neon-green)]">~/lab</NuxtLink><span>/</span>
        <NuxtLink to="/lab" class="text-[var(--color-neon-cyan)] hover:opacity-80 transition-opacity">tools</NuxtLink><span>/</span><span class="text-[var(--color-neon-purple)]">diff</span>
      </div>
    </nav>
    <div class="max-w-5xl mx-auto px-6 py-10 space-y-4">
      <h1 class="font-mono text-xl font-bold text-[var(--color-neon-cyan)] mb-6">Diff 工具</h1>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-2 block">原始文本</label>
          <textarea v-model="a" class="w-full font-mono text-sm rounded-xl border border-[var(--color-void-border)] p-4 resize-none bg-[var(--color-void-card)] text-[var(--color-text-primary)] outline-none" style="height:200px"></textarea>
        </div>
        <div>
          <label class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-2 block">新文本</label>
          <textarea v-model="b" class="w-full font-mono text-sm rounded-xl border border-[var(--color-void-border)] p-4 resize-none bg-[var(--color-void-card)] text-[var(--color-text-primary)] outline-none" style="height:200px"></textarea>
        </div>
      </div>
      <button @click="compute" class="font-mono text-xs px-4 py-2 rounded-lg border border-[rgba(0,212,255,0.4)] text-[var(--color-neon-cyan)] hover:bg-[rgba(0,212,255,0.1)] transition-all">比较</button>
      <div v-if="lines.length" class="border border-[var(--color-void-border)] rounded-xl overflow-hidden">
        <div v-for="(line,i) in lines" :key="i" class="font-mono text-xs px-4 py-1.5 flex gap-4" :style="lineStyle(line)">
          <span class="w-4 shrink-0">{{ line.type==='add'?'+':line.type==='del'?'-':' ' }}</span>
          <span class="whitespace-pre-wrap">{{ line.text }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
const { siteName } = useSiteConfig()
useHead({ title: `Diff 工具 | ` })
const a=ref(''),b=ref('')
interface Line { type:'add'|'del'|'same'; text:string }
const lines=ref<Line[]>([])
function lineStyle(l: Line){
  if(l.type==='add') return 'background:rgba(57,255,20,0.08);color:#39ff14'
  if(l.type==='del') return 'background:rgba(255,45,120,0.08);color:#ff2d78'
  return 'color:rgba(232,232,240,0.5)'
}
function compute(){
  const al=a.value.split('\n'),bl=b.value.split('\n')
  const res:Line[]=[]
  const m=al.length,n=bl.length
  // LCS diff
  const dp:number[][]=Array.from({length:m+1},()=>Array(n+1).fill(0))
  for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)dp[i][j]=al[i-1]===bl[j-1]?dp[i-1][j-1]+1:Math.max(dp[i-1][j],dp[i][j-1])
  let i=m,j=n
  const ops:Line[]=[]
  while(i>0||j>0){
    if(i>0&&j>0&&al[i-1]===bl[j-1]){ops.unshift({type:'same',text:al[i-1]});i--;j--}
    else if(j>0&&(i===0||dp[i][j-1]>=dp[i-1][j])){ops.unshift({type:'add',text:bl[j-1]});j--}
    else{ops.unshift({type:'del',text:al[i-1]});i--}
  }
  lines.value=ops
}
</script>
