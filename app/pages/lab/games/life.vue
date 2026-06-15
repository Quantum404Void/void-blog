<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'games', href: '/lab' }, { label: 'conways-life' }]" />
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div class="mb-6">
        <p class="font-mono text-[10px] text-[var(--color-text-muted)] tracking-[0.25em] uppercase mb-2">process: life.exe</p>
        <h1 class="font-mono text-2xl font-bold text-[var(--color-neon-green)] mb-1" style="text-shadow:0 0 20px rgba(57,255,20,0.5)">CONWAY'S LIFE</h1>
        <p class="font-mono text-xs text-[var(--color-text-muted)]">点击画细胞 · 选择图案 · 运行演化</p>
      </div>
      <div class="flex flex-wrap gap-2 mb-4 font-mono text-xs">
        <button v-for="p in patterns" :key="p" @click="placePattern(p)" class="px-3 py-1.5 rounded-lg border border-[var(--color-void-border)] text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)] hover:border-[rgba(0,212,255,0.3)] transition-all">{{ p }}</button>
        <button @click="randomFill" class="px-3 py-1.5 rounded-lg border border-[rgba(57,255,20,0.3)] text-[rgba(57,255,20,0.8)] hover:bg-[rgba(57,255,20,0.1)] transition-all">随机</button>
        <button @click="clearGrid" class="px-3 py-1.5 rounded-lg border border-[rgba(255,0,170,0.3)] text-[rgba(255,0,170,0.7)] hover:bg-[rgba(255,0,170,0.1)] transition-all">清空</button>
        <button @click="toggleRun" class="px-3 py-1.5 rounded-lg border font-bold transition-all" :style="running?'border-color:rgba(255,170,0,0.5);color:rgba(255,170,0,0.9)':'border-color:rgba(57,255,20,0.5);color:rgba(57,255,20,0.9)'">{{ running ? '⏸ 暂停' : '▶ 运行' }}</button>
        <button @click="step" :disabled="running" class="px-3 py-1.5 rounded-lg border border-[rgba(0,212,255,0.3)] text-[rgba(0,212,255,0.7)] hover:bg-[rgba(0,212,255,0.1)] transition-all">⏭ 单步</button>
        <select v-model.number="speed" class="px-2 py-1.5 rounded-lg border border-[var(--color-void-border)] text-[var(--color-text-muted)] bg-[var(--color-void-card)] text-xs font-mono">
          <option :value="200">慢</option><option :value="60">正常</option><option :value="16">快</option>
        </select>
      </div>
      <canvas ref="canvasEl" class="border border-[var(--color-void-border)] rounded-xl" style="background:#04040c;cursor:crosshair;max-width:100%"></canvas>
    </div>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `Conway's Life | ${siteName}` })
const canvasEl = ref<HTMLCanvasElement>()
const gen = ref(0), liveCount = ref(0), running = ref(false), speed = ref(60)
const CELL=12, COLS=70, ROWS=50
const patterns = ['glider','blinker','pulsar','glider-gun','r-pentomino','diehard']
const PATTERNS: Record<string, number[][]> = {
  glider:[[1,0],[2,1],[0,2],[1,2],[2,2]],
  blinker:[[0,1],[1,1],[2,1]],
  pulsar:[[2,0],[3,0],[4,0],[8,0],[9,0],[10,0],[0,2],[5,2],[7,2],[12,2],[0,3],[5,3],[7,3],[12,3],[0,4],[5,4],[7,4],[12,4],[2,5],[3,5],[4,5],[8,5],[9,5],[10,5],[2,7],[3,7],[4,7],[8,7],[9,7],[10,7],[0,8],[5,8],[7,8],[12,8],[0,9],[5,9],[7,9],[12,9],[0,10],[5,10],[7,10],[12,10],[2,12],[3,12],[4,12],[8,12],[9,12],[10,12]],
  'glider-gun':[[24,0],[22,1],[24,1],[12,2],[13,2],[20,2],[21,2],[34,2],[35,2],[11,3],[15,3],[20,3],[21,3],[34,3],[35,3],[0,4],[1,4],[10,4],[16,4],[20,4],[21,4],[0,5],[1,5],[10,5],[14,5],[16,5],[17,5],[22,5],[24,5],[10,6],[16,6],[24,6],[11,7],[15,7],[12,8],[13,8]],
  'r-pentomino':[[1,0],[2,0],[0,1],[1,1],[1,2]],
  diehard:[[6,0],[0,1],[1,1],[1,2],[5,2],[6,2],[7,2]],
}
let grid: Uint8Array, nextGrid: Uint8Array, animId = 0, lastTime = 0, drawing = false, drawValue = 1

const idx = (x: number, y: number) => (((y%ROWS)+ROWS)%ROWS)*COLS+(((x%COLS)+COLS)%COLS)

function initGrid(){grid=new Uint8Array(COLS*ROWS);nextGrid=new Uint8Array(COLS*ROWS)}

function countLive(){let c=0;for(let i=0;i<grid.length;i++)if(grid[i])c++;liveCount.value=c}

function placePattern(name: string){
  const cells=PATTERNS[name]; if(!cells) return
  const cx=Math.floor(COLS/2), cy=Math.floor(ROWS/2)
  cells.forEach(([dx,dy])=>grid[idx(cx+dx,cy+dy)]=1)
  draw(); countLive()
}

function randomFill(){for(let i=0;i<grid.length;i++)grid[i]=Math.random()<0.3?1:0;gen.value=0;draw();countLive()}
function clearGrid(){initGrid();gen.value=0;draw();countLive()}

function step(){
  nextGrid.fill(0)
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
    let n=0
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(dx===0&&dy===0)continue;n+=grid[idx(x+dx,y+dy)]}
    const alive=grid[idx(x,y)]
    nextGrid[idx(x,y)]=(alive?(n===2||n===3):(n===3))?1:0
  }
  grid.set(nextGrid); gen.value++; draw(); countLive()
}

function draw(){
  const cv=canvasEl.value!; const ctx=cv.getContext('2d')!
  ctx.fillStyle='#04040c'; ctx.fillRect(0,0,cv.width,cv.height)
  ctx.fillStyle='#39ff14'
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
    if(grid[idx(x,y)]){ctx.shadowColor='#39ff14';ctx.shadowBlur=4;ctx.fillRect(x*CELL+1,y*CELL+1,CELL-2,CELL-2)}
  }
  ctx.shadowBlur=0
}

function toggleRun(){
  running.value=!running.value
  if(running.value){lastTime=performance.now();loop(lastTime)}else cancelAnimationFrame(animId)
}

function loop(ts: number){
  if(!running.value) return
  animId=requestAnimationFrame(loop)
  if(ts-lastTime>=speed.value){step();lastTime=ts}
}

let _mouseupHandler: () => void

onMounted(()=>{
  const cv=canvasEl.value!; cv.width=COLS*CELL; cv.height=ROWS*CELL
  initGrid(); draw()
  cv.addEventListener('mousedown',(e)=>{drawing=true;const r=cv.getBoundingClientRect();const x=Math.floor((e.clientX-r.left)/CELL),y=Math.floor((e.clientY-r.top)/CELL);drawValue=grid[idx(x,y)]?0:1;grid[idx(x,y)]=drawValue;draw();countLive()})
  cv.addEventListener('mousemove',(e)=>{if(!drawing)return;const r=cv.getBoundingClientRect();const x=Math.floor((e.clientX-r.left)/CELL),y=Math.floor((e.clientY-r.top)/CELL);grid[idx(x,y)]=drawValue;draw();countLive()})
  _mouseupHandler=()=>drawing=false
  window.addEventListener('mouseup',_mouseupHandler)
})
onUnmounted(()=>{
  cancelAnimationFrame(animId)
  window.removeEventListener('mouseup',_mouseupHandler)
})
</script>
