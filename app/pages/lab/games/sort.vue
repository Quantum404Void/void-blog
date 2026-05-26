<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'games', href: '/lab' }, { label: 'sort-visualizer' }]" />
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex flex-col gap-3">
      <div class="flex flex-wrap gap-2">
        <button v-for="([algo, label, tc, color]) in algos" :key="algo"
          @click="selectAlgo(algo, color)"
          class="algo-btn font-mono text-xs px-3 py-1.5 rounded-lg border transition-all"
          :class="{'opacity-100':currentAlgo===algo,'opacity-60':currentAlgo!==algo}"
          :style="`border-color:${color}44;color:${currentAlgo===algo?color:color+'99'};background:${currentAlgo===algo?color+'15':'transparent'}`">
          {{ label }} <span :style="`color:${color}66;font-size:9px`">{{ tc }}</span>
        </button>
      </div>
      <div class="flex gap-3 flex-1" style="min-height:0">
        <div class="flex flex-col gap-2 flex-1 min-w-0">
          <div class="border border-[var(--color-void-border)] rounded-xl overflow-hidden relative" style="background:#04040c;height:340px">
            <canvas ref="canvasEl" style="display:block;width:100%;height:100%"></canvas>
            <div class="absolute top-3 left-4 font-mono text-sm font-bold" :style="`color:${currentColor};text-shadow:0 0 12px ${currentColor};opacity:0.8`">{{ currentAlgo }}Sort</div>
            <div v-if="!hasData" class="absolute inset-0 flex items-center justify-center font-mono text-[var(--color-text-muted)] text-sm pointer-events-none">选择算法 → ▶ RUN</div>
          </div>
          <div class="border border-[var(--color-void-border)] rounded-xl px-4 py-2 bg-[var(--color-void-card)] font-mono text-xs" style="min-height:36px">
            <span id="step-desc" class="text-[var(--color-text-muted)]">{{ stepDesc }}</span>
            <span class="ml-4 text-[rgba(0,212,255,0.6)]">比较: <span class="text-[var(--color-neon-cyan)] font-bold">{{ cmpCount }}</span></span>
            <span class="ml-3 text-[rgba(255,0,170,0.6)]">交换: <span class="text-[var(--color-neon-pink)] font-bold">{{ swapCount }}</span></span>
            <span class="ml-3 text-[rgba(180,0,255,0.6)]">耗时: <span class="text-[var(--color-neon-purple)] font-bold">{{ timeMs }}</span>ms</span>
          </div>
          <div class="flex flex-wrap gap-2 items-center">
            <button @click="shuffle" class="font-mono text-xs px-3 py-1.5 rounded-lg border border-[rgba(0,212,255,0.3)] text-[rgba(0,212,255,0.8)] hover:bg-[rgba(0,212,255,0.1)] transition-all">🔀 打乱</button>
            <button @click="run" :disabled="running" class="font-mono text-xs px-4 py-1.5 rounded-lg border border-[rgba(57,255,20,0.5)] text-[rgba(57,255,20,0.9)] hover:bg-[rgba(57,255,20,0.1)] transition-all font-bold">▶ 运行</button>
            <button v-if="running && !paused" @click="pause" class="font-mono text-xs px-3 py-1.5 rounded-lg border border-[rgba(255,170,0,0.4)] text-[rgba(255,170,0,0.8)] hover:bg-[rgba(255,170,0,0.1)] transition-all">⏸ 暂停</button>
            <button v-if="running && paused" @click="resume" class="font-mono text-xs px-3 py-1.5 rounded-lg border border-[rgba(57,255,20,0.4)] text-[rgba(57,255,20,0.8)] transition-all">▶ 继续</button>
            <button v-if="paused" @click="stepOne" class="font-mono text-xs px-3 py-1.5 rounded-lg border border-[rgba(0,212,255,0.4)] text-[rgba(0,212,255,0.8)] transition-all">⏭ 单步</button>
            <button v-if="running" @click="stop" class="font-mono text-xs px-3 py-1.5 rounded-lg border border-[rgba(255,0,170,0.3)] text-[rgba(255,0,170,0.7)] transition-all">⏹ 停止</button>
            <select v-model.number="delay" class="font-mono text-xs px-2 py-1.5 rounded-lg border border-[var(--color-void-border)] text-[var(--color-text-muted)] bg-[var(--color-void-card)]">
              <option :value="300">慢速</option><option :value="80">正常</option><option :value="20">快速</option><option :value="3">极速</option>
            </select>
            <select v-model.number="arrSize" @change="shuffle" class="font-mono text-xs px-2 py-1.5 rounded-lg border border-[var(--color-void-border)] text-[var(--color-text-muted)] bg-[var(--color-void-card)]">
              <option :value="30">30</option><option :value="60">60</option><option :value="120">120</option>
            </select>
          </div>
          <div class="grid grid-cols-4 gap-2">
            <div v-for="(info, key) in complexity" :key="key" class="border border-[var(--color-void-border)] rounded-xl p-2 bg-[var(--color-void-card)] text-center font-mono">
              <div class="text-[9px] text-[var(--color-text-muted)] uppercase tracking-widest mb-1">{{ info.label }}</div>
              <div class="text-xs font-bold" :style="`color:${info.color}`">{{ info.value }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
const { siteName } = useSiteConfig()
useHead({ title: `Sort Visualizer | ${siteName}` })
useSeoMeta({ title: `Sort Visualizer | ${siteName}` })
const canvasEl = ref<HTMLCanvasElement>()
const currentAlgo = ref('bubble'), currentColor = ref('#00d4ff')
const hasData = ref(false), running = ref(false), paused = ref(false)
const stepDesc = ref('—'), cmpCount = ref(0), swapCount = ref(0), timeMs = ref(0)
const delay = ref(80), arrSize = ref(60)

const algos = [
  ['bubble','冒泡','O(n²)','#00d4ff'],['selection','选择','O(n²)','#39ff14'],
  ['insertion','插入','O(n²)','#ff00aa'],['quick','快排','O(n log n)','#b400ff'],
  ['merge','归并','O(n log n)','#00d4ff'],['heap','堆排','O(n log n)','#39ff14'],
  ['counting','计数','O(n+k)','#ffa500'],['radix','基数','O(nk)','#ff4444'],['tim','TimSort','O(n log n)','#aaffaa'],
]

const ALGO_INFO: Record<string,any> = {
  bubble:{avg:'O(n²)',worst:'O(n²)',space:'O(1)',stable:'✓',color:'#00d4ff'},
  selection:{avg:'O(n²)',worst:'O(n²)',space:'O(1)',stable:'✗',color:'#39ff14'},
  insertion:{avg:'O(n²)',worst:'O(n²)',space:'O(1)',stable:'✓',color:'#ff00aa'},
  quick:{avg:'O(n log n)',worst:'O(n²)',space:'O(log n)',stable:'✗',color:'#b400ff'},
  merge:{avg:'O(n log n)',worst:'O(n log n)',space:'O(n)',stable:'✓',color:'#00d4ff'},
  heap:{avg:'O(n log n)',worst:'O(n log n)',space:'O(1)',stable:'✗',color:'#39ff14'},
  counting:{avg:'O(n+k)',worst:'O(n+k)',space:'O(k)',stable:'✓',color:'#ffa500'},
  radix:{avg:'O(nk)',worst:'O(nk)',space:'O(n+k)',stable:'✓',color:'#ff4444'},
  tim:{avg:'O(n log n)',worst:'O(n log n)',space:'O(n)',stable:'✓',color:'#aaffaa'},
}

const complexity = computed(()=>{
  const info=ALGO_INFO[currentAlgo.value]||{}
  return [
    {label:'时间（平均）',value:info.avg||'--',color:'#b400ff'},
    {label:'时间（最坏）',value:info.worst||'--',color:'#ff00aa'},
    {label:'空间复杂度',value:info.space||'--',color:'#00d4ff'},
    {label:'稳定性',value:info.stable||'--',color:'#39ff14'},
  ]
})

let arr: number[]=[], highlights: Record<number,string>={}, steps: any[]=[],stepIdx=0,animId=0,stepResolve:any=null,stopFlag=false

function selectAlgo(algo: string, color: string){currentAlgo.value=algo;currentColor.value=color}

function shuffle(){
  const n=arrSize.value
  arr=Array.from({length:n},(_,i)=>Math.floor((i+1)*(380/n)))
  for(let i=n-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}
  highlights={};hasData.value=true;draw();cmpCount.value=0;swapCount.value=0;timeMs.value=0;stepDesc.value='—'
}

function draw(){
  const cv=canvasEl.value!; if(!cv) return
  const ctx=cv.getContext('2d')!; const W=cv.width=cv.offsetWidth,H=cv.height=cv.offsetHeight||340
  ctx.fillStyle='#04040c'; ctx.fillRect(0,0,W,H)
  const n=arr.length; const bw=Math.floor(W/n)-1
  arr.forEach((v,i)=>{
    const h=Math.floor(v/380*H*0.92)+4
    ctx.fillStyle=highlights[i]||ALGO_INFO[currentAlgo.value]?.color||'#00d4ff'
    ctx.shadowColor=highlights[i]||ALGO_INFO[currentAlgo.value]?.color||'#00d4ff'
    ctx.shadowBlur=highlights[i]?8:2
    ctx.fillRect(i*(bw+1),H-h,bw,h)
  })
  ctx.shadowBlur=0
}

function sleep(ms: number){return new Promise<void>(r=>{if(stopFlag){r();return};if(paused.value){stepResolve=r}else setTimeout(r,ms)})}

async function runSort(){
  const start=Date.now(); stopFlag=false; running.value=true; cmpCount.value=0; swapCount.value=0
  const a=[...arr], n=a.length
  const swap=(i:number,j:number)=>{[a[i],a[j]]=[a[j],a[i]];arr=[...a];swapCount.value++}
  const cmp=(i:number,j:number)=>{cmpCount.value++;return a[i]>a[j]}

  try {
    if(currentAlgo.value==='bubble'){
      for(let i=0;i<n-1&&!stopFlag;i++)for(let j=0;j<n-i-1&&!stopFlag;j++){
        highlights={[j]:'#ff2d78',[j+1]:'#ff2d78'};stepDesc.value=`比较 a[${j}]=${a[j]} > a[${j+1}]=${a[j+1]}?`
        if(cmp(j,j+1)){swap(j,j+1);highlights={[j]:'#39ff14',[j+1]:'#39ff14'}}
        draw();await sleep(delay.value)
      }
    } else if(currentAlgo.value==='selection'){
      for(let i=0;i<n-1&&!stopFlag;i++){let mi=i;for(let j=i+1;j<n&&!stopFlag;j++){highlights={[i]:'#ffa500',[j]:'#ff2d78',[mi]:'#00d4ff'};cmpCount.value++;if(a[j]<a[mi])mi=j;draw();await sleep(delay.value)};swap(i,mi);draw();await sleep(delay.value)}
    } else if(currentAlgo.value==='insertion'){
      for(let i=1;i<n&&!stopFlag;i++){let j=i;while(j>0&&!stopFlag){highlights={[j]:'#ff2d78',[j-1]:'#ff2d78'};cmpCount.value++;if(a[j]<a[j-1]){swap(j,j-1);j--}else break;draw();await sleep(delay.value)}}
    } else if(currentAlgo.value==='quick'){
      const qsort=async(lo:number,hi:number)=>{if(lo>=hi||stopFlag)return;const pivot=a[hi];let pi=lo;for(let j=lo;j<hi&&!stopFlag;j++){highlights={[j]:'#ff2d78',[hi]:'#ffa500'};cmpCount.value++;if(a[j]<=pivot){swap(pi,j);pi++;highlights={[pi-1]:'#39ff14'};draw();await sleep(delay.value)}else{draw();await sleep(delay.value)}};swap(pi,hi);await qsort(lo,pi-1);await qsort(pi+1,hi)}
      await qsort(0,n-1)
    } else if(currentAlgo.value==='merge'){
      const merge2=async(lo:number,mid:number,hi:number)=>{const tmp=a.slice(lo,hi+1);let i=0,j=mid-lo+1,k=lo;while(i<=mid-lo&&j<=hi-lo&&!stopFlag){cmpCount.value++;highlights={[lo+i]:'#ff2d78',[lo+j]:'#00d4ff'};if(tmp[i]<=tmp[j])a[k++]=tmp[i++];else a[k++]=tmp[j++];arr=[...a];draw();await sleep(delay.value)};while(i<=mid-lo&&!stopFlag){a[k++]=tmp[i++];arr=[...a];draw();await sleep(delay.value)};while(j<=hi-lo&&!stopFlag){a[k++]=tmp[j++];arr=[...a];draw();await sleep(delay.value)}}
      for(let s=1;s<n&&!stopFlag;s*=2)for(let lo=0;lo<n&&!stopFlag;lo+=2*s){const mid=Math.min(lo+s-1,n-1),hi=Math.min(lo+2*s-1,n-1);if(mid<hi)await merge2(lo,mid,hi)}
    } else if(currentAlgo.value==='heap'){
      const heapify=async(n2:number,i:number)=>{let largest=i,l=2*i+1,r=2*i+2;cmpCount.value+=2;if(l<n2&&a[l]>a[largest])largest=l;if(r<n2&&a[r]>a[largest])largest=r;if(largest!==i){swap(i,largest);highlights={[i]:'#39ff14',[largest]:'#ff2d78'};draw();await sleep(delay.value);await heapify(n2,largest)}}
      for(let i=Math.floor(n/2)-1;i>=0&&!stopFlag;i--)await heapify(n,i)
      for(let i=n-1;i>0&&!stopFlag;i--){swap(0,i);await heapify(i,0)}
    } else if(currentAlgo.value==='counting'){
      const max=Math.max(...a), min=Math.min(...a), range=max-min+1
      const count=new Array(range).fill(0)
      for(let i=0;i<n&&!stopFlag;i++){count[a[i]-min]++;highlights={[i]:'#ffa500'};cmpCount.value++;draw();await sleep(delay.value)}
      let k=0
      for(let i=0;i<range&&!stopFlag;i++)while(count[i]-->0&&!stopFlag){a[k]=i+min;arr=[...a];highlights={[k]:'#39ff14'};swapCount.value++;draw();await sleep(delay.value);k++}
    } else if(currentAlgo.value==='radix'){
      const getDigit=(num:number,place:number)=>Math.floor(Math.abs(num)/Math.pow(10,place))%10
      const digitCount=(num:number)=>num===0?1:Math.floor(Math.log10(Math.abs(num)))+1
      const maxDigits=Math.max(...a.map(digitCount))
      for(let d=0;d<maxDigits&&!stopFlag;d++){
        const buckets:number[][]=Array.from({length:10},()=>[])
        for(let i=0;i<n&&!stopFlag;i++){buckets[getDigit(a[i],d)].push(a[i]);highlights={[i]:'#ff4444'};cmpCount.value++;draw();await sleep(delay.value)}
        let k=0;for(const b of buckets)for(const v of b){a[k]=v;arr=[...a];highlights={[k]:'#39ff14'};swapCount.value++;draw();await sleep(delay.value);k++}
      }
    } else if(currentAlgo.value==='tim'){
      const RUN=32
      const insertionRun=async(left:number,right:number)=>{for(let i=left+1;i<=right&&!stopFlag;i++){let j=i;while(j>left&&!stopFlag){highlights={[j]:'#ff2d78',[j-1]:'#ff2d78'};cmpCount.value++;if(a[j]<a[j-1]){swap(j,j-1);j--}else break;draw();await sleep(delay.value)}}}
      for(let i=0;i<n&&!stopFlag;i+=RUN)await insertionRun(i,Math.min(i+RUN-1,n-1))
      for(let s=RUN;s<n&&!stopFlag;s*=2)for(let lo=0;lo<n&&!stopFlag;lo+=2*s){const mid=Math.min(lo+s-1,n-1),hi=Math.min(lo+2*s-1,n-1);if(mid<hi){const tmp=a.slice(lo,hi+1);let i=0,j=mid-lo+1,k=lo;while(i<=mid-lo&&j<=hi-lo&&!stopFlag){cmpCount.value++;highlights={[lo+i]:'#aaffaa',[lo+j]:'#00d4ff'};if(tmp[i]<=tmp[j])a[k++]=tmp[i++];else a[k++]=tmp[j++];arr=[...a];draw();await sleep(delay.value)};while(i<=mid-lo&&!stopFlag){a[k++]=tmp[i++];arr=[...a];draw();await sleep(delay.value)};while(j<=hi-lo&&!stopFlag){a[k++]=tmp[j++];arr=[...a];draw();await sleep(delay.value)}}}
    }
  } catch(e){}
  highlights={}; draw()
  timeMs.value=Date.now()-start
  running.value=false; paused.value=false
}

function run(){if(!arr.length)shuffle();runSort()}
function pause(){paused.value=true}
function resume(){paused.value=false;if(stepResolve){stepResolve();stepResolve=null}}
function stepOne(){if(stepResolve){const r=stepResolve;stepResolve=null;r()}}
function stop(){stopFlag=true;paused.value=false;if(stepResolve){stepResolve();stepResolve=null}}

onMounted(()=>shuffle())
onUnmounted(()=>{stopFlag=true;if(stepResolve){stepResolve();stepResolve=null}})
</script>
