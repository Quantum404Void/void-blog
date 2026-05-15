<template>
  <div class="min-h-screen bg-[var(--color-void)] flex flex-col">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'games', href: '/lab' }, { label: 'code-typing' }]" />
    <div class="max-w-4xl mx-auto px-6 py-12 flex-1 flex flex-col">
      <div class="mb-8 text-center">
        <h1 class="font-mono text-2xl font-bold text-[var(--color-neon-pink)] mb-2" style="text-shadow:0 0 20px rgba(255,0,170,0.5)">Code Typing</h1>
        <p class="font-mono text-xs text-[var(--color-text-muted)]">打完一段代码，测你的 WPM</p>
      </div>
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div v-for="(s,i) in stats" :key="i" class="border border-[var(--color-void-border)] rounded-xl p-4 bg-[var(--color-void-card)] text-center">
          <div class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-1">{{ s.label }}</div>
          <div class="font-mono text-xl font-bold" :style="`color:${s.color}`">{{ s.value }}</div>
        </div>
      </div>
      <div class="flex-1 border border-[var(--color-void-border)] rounded-xl bg-[var(--color-void-card)] p-6 mb-4 relative overflow-auto" style="min-height:200px">
        <div class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-4 flex items-center gap-2">
          <span class="text-[var(--color-neon-pink)]">▶</span> snippet.ts
          <span class="ml-auto text-[rgba(255,255,255,0.1)] text-xs">{{ snippetIdx+1 }}/{{ snippets.length }}</span>
        </div>
        <pre class="font-mono text-sm leading-relaxed whitespace-pre-wrap" style="color:#e8e8f0" v-html="displayHtml"></pre>
      </div>
      <div class="relative">
        <textarea ref="inputEl"
          class="w-full font-mono text-sm rounded-xl border p-4 resize-none"
          :style="`background:rgba(0,0,0,0.4);border-color:${hasErrors?'rgba(255,0,170,0.5)':'rgba(57,255,20,0.3)'};color:#e8e8f0;outline:none;height:120px;caret-color:#ff00aa`"
          v-model="typed"
          @input="onInput"
          placeholder="开始打字...（聚焦后自动计时）"
          spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off"
        ></textarea>
        <div class="absolute bottom-4 right-4 flex gap-3">
          <button @click="nextSnippet" class="font-mono text-[10px] px-3 py-1.5 rounded-lg border border-[rgba(255,0,170,0.3)] text-[rgba(255,0,170,0.7)] hover:bg-[rgba(255,0,170,0.1)] transition-all">下一段 →</button>
          <button @click="reset" class="font-mono text-[10px] px-3 py-1.5 rounded-lg border border-[var(--color-void-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-void-muted)] transition-all">重置 R</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { siteName } = useSiteConfig()
useHead({ title: `Code Typing | ${siteName}` })
useSeoMeta({ title: `Code Typing | ${siteName}` })
const snippets = [
  `function debounce(fn, delay) {\n  let timer\n  return (...args) => {\n    clearTimeout(timer)\n    timer = setTimeout(() => fn(...args), delay)\n  }\n}`,
  `const quickSort = (arr) => {\n  if (arr.length <= 1) return arr\n  const pivot = arr[arr.length >> 1]\n  const left = arr.filter(x => x < pivot)\n  const right = arr.filter(x => x > pivot)\n  return [...quickSort(left), pivot, ...quickSort(right)]\n}`,
  `async function fetchWithRetry(url, retries = 3) {\n  for (let i = 0; i < retries; i++) {\n    try {\n      const res = await fetch(url)\n      if (res.ok) return await res.json()\n    } catch (e) {\n      if (i === retries - 1) throw e\n      await new Promise(r => setTimeout(r, 1000 * (i + 1)))\n    }\n  }\n}`,
  `const memo = (fn) => {\n  const cache = new Map()\n  return (...args) => {\n    const key = JSON.stringify(args)\n    if (cache.has(key)) return cache.get(key)\n    const result = fn(...args)\n    cache.set(key, result)\n    return result\n  }\n}`,
  `function binarySearch(arr, target) {\n  let lo = 0, hi = arr.length - 1\n  while (lo <= hi) {\n    const mid = (lo + hi) >> 1\n    if (arr[mid] === target) return mid\n    arr[mid] < target ? lo = mid + 1 : hi = mid - 1\n  }\n  return -1\n}`,
  `class EventEmitter {\n  #events = {}\n  on(e, fn) { (this.#events[e] ??= []).push(fn) }\n  off(e, fn) { this.#events[e] = (this.#events[e]||[]).filter(f=>f!==fn) }\n  emit(e, ...args) { (this.#events[e]||[]).forEach(fn=>fn(...args)) }\n}`,
  `const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x)`,
  `async function* paginate(url) {\n  let next = url\n  while (next) {\n    const res = await fetch(next).then(r => r.json())\n    yield res.data\n    next = res.nextPage\n  }\n}`,
  `function LRUCache(cap) {\n  const map = new Map()\n  return {\n    get(k) { if(!map.has(k))return -1;const v=map.get(k);map.delete(k);map.set(k,v);return v },\n    put(k,v) { map.delete(k);map.set(k,v);if(map.size>cap)map.delete(map.keys().next().value) }\n  }\n}`,
  `const trie = () => {\n  const root = {}\n  const insert = (w) => { let n=root; for(const c of w)(n[c]??={}),n=n[c]; n.$=1 }\n  const search = (w) => { let n=root; for(const c of w){if(!n[c])return false;n=n[c]}; return !!n.$ }\n  return { insert, search }\n}`,
]
const inputEl = ref<HTMLTextAreaElement>()
const typed = ref(''), snippetIdx = ref(0), started = ref(false), finished = ref(false)
const wpm = ref('--'), acc = ref('--'), timeLeft = ref(60), errorsCount = ref(0)
let timerInterval: any=null, startTime=0

const target = computed(()=>snippets[snippetIdx.value%snippets.length])
const hasErrors = computed(()=>{
  const t=typed.value; return t.split('').some((c,i)=>c!==target.value[i])
})

const stats = computed(()=>[
  {label:'WPM',value:wpm.value,color:'#00d4ff'},
  {label:'ACC',value:acc.value,color:'#39ff14'},
  {label:'ERRORS',value:typeof errorsCount.value==='number'?String(errorsCount.value):'--',color:'#ff00aa'},
  {label:'TIME',value:timeLeft.value+'s',color:'#b400ff'},
])

const displayHtml = computed(()=>{
  const t=target.value, ty=typed.value
  let html=''
  t.split('').forEach((ch,i)=>{
    const tc=ty[i], display=ch==='\n'?'↵\n':ch===' '?'·':escHtml(ch)
    const isCursor=i===ty.length
    const cs=isCursor?'outline:2px solid rgba(0,212,255,0.9);outline-offset:-1px;border-radius:2px;':''
    if(tc===undefined) html+=`<span style="color:rgba(232,232,240,0.4);${cs}">${display}</span>`
    else if(tc===ch) html+=`<span style="color:#39ff14;${cs}">${display}</span>`
    else html+=`<span style="color:#ff00aa;text-decoration:underline;background:rgba(255,0,170,0.1);${cs}">${display}</span>`
  })
  if(ty.length===t.length) html+='<span style="display:inline-block;width:0.5ch;background:rgba(0,212,255,0.7);border-radius:1px">&nbsp;</span>'
  return html
})

function escHtml(s: string){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function calcWpm(t: string){if(!startTime)return 0;const e=(Date.now()-startTime)/1000/60;return Math.round((t.length/5)/Math.max(e,0.01))}
function calcAcc(t: string){let ok=0;t.split('').forEach((c,i)=>{if(c===target.value[i])ok++});return t.length?Math.round(ok/t.length*100):100}

function onInput(){
  if(finished.value) return
  if(!started.value){started.value=true;startTime=Date.now();timerInterval=setInterval(()=>{timeLeft.value--;if(timeLeft.value<=0)endGame()},1000)}
  const t=typed.value; let e=0; t.split('').forEach((c,i)=>{if(c!==target.value[i])e++})
  errorsCount.value=e; wpm.value=String(calcWpm(t)); acc.value=calcAcc(t)+'%'
  if(t===target.value){snippetIdx.value++;reset()}
}

function endGame(){
  finished.value=true; clearInterval(timerInterval)
}
function reset(){
  clearInterval(timerInterval); typed.value=''; started.value=false; finished.value=false
  timeLeft.value=60; startTime=0; errorsCount.value=0; wpm.value='--'; acc.value='--'
  nextTick(()=>inputEl.value?.focus())
}
function nextSnippet(){snippetIdx.value++;reset()}

const _typingKey = (e: KeyboardEvent) => { if(e.key==='r'&&document.activeElement!==inputEl.value)reset() }

onMounted(()=>{
  window.addEventListener('keydown', _typingKey)
  inputEl.value?.focus()
})

onUnmounted(()=>{
  window.removeEventListener('keydown', _typingKey)
  clearInterval(timerInterval)
})
</script>
