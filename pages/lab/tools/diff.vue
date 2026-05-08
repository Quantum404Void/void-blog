<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'diff' }]" />
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
      <div v-if="perfWarn" class="font-mono text-xs px-4 py-2 rounded-lg" style="background:rgba(255,165,0,0.1);color:#ffa500;border:1px solid rgba(255,165,0,0.3)">{{ perfWarn }}</div>
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
useSeoMeta({ title: `Diff 工具 | ${siteName}` })
const a=ref(''),b=ref('')
interface Line { type:'add'|'del'|'same'; text:string }
const lines=ref<Line[]>([])
function lineStyle(l: Line){
  if(l.type==='add') return 'background:rgba(57,255,20,0.08);color:#39ff14'
  if(l.type==='del') return 'background:rgba(255,45,120,0.08);color:#ff2d78'
  return 'color:rgba(232,232,240,0.5)'
}
const perfWarn = ref('')

function myersDiff(aArr: string[], bArr: string[]) {
  const m = aArr.length, n = bArr.length
  const max = m + n
  if (max === 0) return []
  const v = new Int32Array(2 * max + 1).fill(0)
  const trace: Int32Array[] = []
  let found = false, finalD = 0
  for (let d = 0; d <= max; d++) {
    trace.push(v.slice())
    for (let k = -d; k <= d; k += 2) {
      let x = k === -d || (k !== d && v[k-1+max] < v[k+1+max]) ? v[k+1+max] : v[k-1+max] + 1
      let y = x - k
      while (x < m && y < n && aArr[x] === bArr[y]) { x++; y++ }
      v[k+max] = x
      if (x >= m && y >= n) { finalD = d; found = true; break }
    }
    if (found) break
  }
  // backtrack
  const ops: Line[] = []
  let x = m, y = n
  for (let d = finalD; d > 0; d--) {
    const pv = trace[d-1]
    const k = x - y
    const prevK = k === -d || (k !== d && pv[k-1+max] < pv[k+1+max]) ? k+1 : k-1
    const prevX = pv[prevK+max], prevY = prevX - prevK
    while (x > prevX+1 && y > prevY+1) { ops.unshift({type:'same',text:aArr[x-1]}); x--; y-- }
    if (prevX === x-1 && prevY === y) { ops.unshift({type:'del',text:aArr[x-1]}); x-- }
    else if (prevY === y-1 && prevX === x) { ops.unshift({type:'add',text:bArr[y-1]}); y-- }
    else { while (x > prevX && y > prevY) { ops.unshift({type:'same',text:aArr[x-1]}); x--; y-- } }
  }
  while (x > 0 && y > 0) { ops.unshift({type:'same',text:aArr[x-1]}); x--; y-- }
  return ops
}

function compute(){
  perfWarn.value = ''
  let al=a.value.split('\n'), bl=b.value.split('\n')
  if (al.length > 500 || bl.length > 500) {
    perfWarn.value = `⚠ 文本过长（${al.length}行 vs ${bl.length}行），仅对比前 500 行`
    al = al.slice(0, 500); bl = bl.slice(0, 500)
  }
  lines.value = myersDiff(al, bl)
}
</script>
