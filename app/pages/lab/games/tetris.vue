<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'games', href: '/lab' }, { label: 'tetris' }]" />
    <div class="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div class="mb-6">
        <p class="font-mono text-[10px] text-[var(--color-text-muted)] tracking-[0.25em] uppercase mb-2">process: tetris.exe</p>
        <h1 class="font-mono text-2xl font-bold mb-1" style="color:#b400ff;text-shadow:0 0 20px rgba(180,0,255,0.5)">TETRIS</h1>
        <p class="font-mono text-xs text-[var(--color-text-muted)]">← → 移动 · ↑/Z 旋转 · ↓ 加速 · Space 硬降 · P 暂停</p>
      </div>
      <div class="flex gap-4 justify-center items-start">
        <div class="relative border border-[var(--color-void-border)] rounded-xl overflow-hidden" style="background:#06060e;box-shadow:0 0 40px rgba(180,0,255,0.08)">
          <canvas ref="mainCanvas" width="300" height="600" style="display:block"></canvas>
          <div ref="overlay" class="absolute inset-0 flex flex-col items-center justify-center font-mono" style="background:rgba(6,6,14,0.92)">
            <div style="font-size:2.5rem;margin-bottom:0.75rem">🧩</div>
            <div class="text-xl font-bold mb-2" style="color:#b400ff;text-shadow:0 0 15px #b400ff">TETRIS</div>
            <div class="text-xs mb-6" style="color:#8888aa">按 Space 或 Enter 开始</div>
            <button @click="startGame" class="font-mono text-sm px-6 py-2 rounded-lg border transition-all" style="border-color:rgba(180,0,255,0.4);color:#b400ff;background:rgba(180,0,255,0.08)">START GAME</button>
          </div>
        </div>
        <div class="flex flex-col gap-4 min-w-[120px]">
          <div class="border border-[var(--color-void-border)] rounded-xl p-4" style="background:rgba(10,10,15,0.8)">
            <p class="font-mono text-[9px] text-[var(--color-text-muted)] tracking-widest mb-2">NEXT</p>
            <canvas ref="nextCanvas" width="100" height="100" style="display:block"></canvas>
          </div>
          <div v-for="(item, i) in sideStats" :key="i" class="border border-[var(--color-void-border)] rounded-xl p-4" style="background:rgba(10,10,15,0.8)">
            <p class="font-mono text-[9px] text-[var(--color-text-muted)] tracking-widest mb-1">{{ item.label }}</p>
            <p class="font-mono text-lg font-bold" :style="`color:${item.color};text-shadow:0 0 10px ${item.color}88`">{{ item.value }}</p>
          </div>
        </div>
      </div>
    </div>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
// Safe localStorage wrapper (private mode safe)
const safeGet = (k: string, def = '') => { try { return localStorage.getItem(k) ?? def } catch { return def } }
const safeSet = (k: string, v: string) => { try { localStorage.setItem(k, v) } catch {} }

const { siteName } = useSiteConfig()
useHead({ title: `Tetris | ${siteName}` })
useSeoMeta({ title: `Tetris | ${siteName}` })
const mainCanvas = ref<HTMLCanvasElement>()
const nextCanvas = ref<HTMLCanvasElement>()
const overlay = ref<HTMLElement>()
const scoreVal = ref(0)
const levelVal = ref(1)
const linesVal = ref(0)
const bestVal = ref(0)

const sideStats = computed(() => [
  { label: 'SCORE', value: scoreVal.value, color: '#b400ff' },
  { label: 'LEVEL', value: levelVal.value, color: '#00d4ff' },
  { label: 'LINES', value: linesVal.value, color: '#39ff14' },
  { label: 'BEST', value: bestVal.value, color: '#ffa500' },
])

const COLS = 10, ROWS = 20, CELL = 30
const COLORS = { I:'#00d4ff', O:'#ffa500', T:'#b400ff', S:'#39ff14', Z:'#ff4444', J:'#4444ff', L:'#ff8800' }
const PIECES: Record<string, { shape: number[][], color: string }> = {
  I:{shape:[[1,1,1,1]],color:COLORS.I}, O:{shape:[[1,1],[1,1]],color:COLORS.O},
  T:{shape:[[0,1,0],[1,1,1]],color:COLORS.T}, S:{shape:[[0,1,1],[1,1,0]],color:COLORS.S},
  Z:{shape:[[1,1,0],[0,1,1]],color:COLORS.Z}, J:{shape:[[1,0,0],[1,1,1]],color:COLORS.J},
  L:{shape:[[0,0,1],[1,1,1]],color:COLORS.L},
}
const KEYS = Object.keys(PIECES)
const SCORE_TABLE = [0,100,300,500,800]

let board: (string|null)[][], current: any, next: any, pos: {x:number,y:number}
let score=0, lines=0, level=1, gameOver=false, paused=false, dropTimer=0, dropInterval=500
let animFrame=0, started=false

function createBoard() { return Array.from({length:ROWS}, ()=>Array(COLS).fill(null)) }
function randomPiece() { const k=KEYS[Math.floor(Math.random()*KEYS.length)]; const p=PIECES[k]; return {shape:p.shape.map(r=>[...r]),color:p.color} }
function rotate(m: number[][]) { return m[0].map((_,i)=>m.map(r=>r[i]).reverse()) }
function isValid(shape: number[][], px: number, py: number) {
  return shape.every((row,dy)=>row.every((cell,dx)=>{ if(!cell) return true; const nx=px+dx,ny=py+dy; return nx>=0&&nx<COLS&&ny<ROWS&&!board[ny]?.[nx] }))
}
function ghostPos() { let gy=pos.y; while(isValid(current.shape,pos.x,gy+1))gy++; return gy }

function lockPiece() {
  current.shape.forEach((row: number[],dy: number)=>row.forEach((cell: number,dx: number)=>{ if(cell) board[pos.y+dy][pos.x+dx]=current.color }))
  let cleared=0
  for(let r=ROWS-1;r>=0;r--) { if(board[r].every(c=>c!==null)){board.splice(r,1);board.unshift(Array(COLS).fill(null));cleared++;r++} }
  if(cleared>0){ lines+=cleared; score+=SCORE_TABLE[cleared]*level; level=Math.floor(lines/10)+1; dropInterval=Math.max(100,500-(level-1)*40); updateUI() }
  spawnPiece()
}

function spawnPiece() {
  current=next; next=randomPiece()
  pos={x:Math.floor((COLS-current.shape[0].length)/2),y:0}
  if(!isValid(current.shape,pos.x,pos.y)) endGame()
  drawNext()
}

function hardDrop() { const gy=ghostPos(); score+=(gy-pos.y); pos.y=gy; lockPiece(); updateUI() }
function drop() { if(isValid(current.shape,pos.x,pos.y+1)) pos.y++; else lockPiece() }

function updateUI() {
  scoreVal.value=score; levelVal.value=level; linesVal.value=lines
  const best=parseInt(safeGet('tetris-best','0'))
  if(score>best){safeSet('tetris-best',String(score));bestVal.value=score}
}

function drawBoard() {
  const cv=mainCanvas.value!; const ctx=cv.getContext('2d')!
  ctx.fillStyle='#06060e'; ctx.fillRect(0,0,cv.width,cv.height)
  ctx.strokeStyle='rgba(255,255,255,0.03)'; ctx.lineWidth=0.5
  for(let r=0;r<ROWS;r++){ctx.beginPath();ctx.moveTo(0,r*CELL);ctx.lineTo(COLS*CELL,r*CELL);ctx.stroke()}
  for(let c=0;c<COLS;c++){ctx.beginPath();ctx.moveTo(c*CELL,0);ctx.lineTo(c*CELL,ROWS*CELL);ctx.stroke()}
  board.forEach((row,r)=>row.forEach((color,c)=>{ if(color){ctx.shadowColor=color;ctx.shadowBlur=6;ctx.fillStyle=color;ctx.fillRect(c*CELL+1,r*CELL+1,CELL-2,CELL-2);ctx.shadowBlur=0} }))
  if(current&&!gameOver){
    const gy=ghostPos()
    current.shape.forEach((row: number[],dy: number)=>row.forEach((cell: number,dx: number)=>{ if(cell){ctx.globalAlpha=0.25;ctx.fillStyle=current.color;ctx.fillRect((pos.x+dx)*CELL+1,(gy+dy)*CELL+1,CELL-2,CELL-2);ctx.globalAlpha=1} }))
    current.shape.forEach((row: number[],dy: number)=>row.forEach((cell: number,dx: number)=>{ if(cell){ctx.shadowColor=current.color;ctx.shadowBlur=12;ctx.fillStyle=current.color;ctx.fillRect((pos.x+dx)*CELL+1,(pos.y+dy)*CELL+1,CELL-2,CELL-2);ctx.shadowBlur=0} }))
  }
}

function drawNext() {
  const cv=nextCanvas.value!; const ctx=cv.getContext('2d')!
  ctx.fillStyle='#06060e'; ctx.fillRect(0,0,cv.width,cv.height)
  if(!next) return
  const s=next.shape; const cell=24
  const offX=Math.floor((4-s[0].length)/2),offY=Math.floor((4-s.length)/2)
  s.forEach((row: number[],dy: number)=>row.forEach((c: number,dx: number)=>{ if(c){ctx.shadowColor=next.color;ctx.shadowBlur=10;ctx.fillStyle=next.color;ctx.fillRect((offX+dx)*cell+2,(offY+dy)*cell+2,cell-2,cell-2);ctx.shadowBlur=0} }))
}

function gameLoop(now: number) {
  if(!started||gameOver) return
  animFrame=requestAnimationFrame(gameLoop)
  if(!paused){ if(now-dropTimer>=dropInterval){drop();dropTimer=now}; drawBoard() }
}

function startGame() {
  board=createBoard(); score=0; lines=0; level=1; dropInterval=500; gameOver=false; paused=false; started=true
  dropTimer=performance.now()
  bestVal.value=parseInt(safeGet('tetris-best','0'))
  next=randomPiece(); spawnPiece(); updateUI()
  if(overlay.value) overlay.value.style.display='none'
  cancelAnimationFrame(animFrame); animFrame=requestAnimationFrame(gameLoop)
}

function endGame() {
  gameOver=true; started=false
  const best=parseInt(safeGet('tetris-best','0'))
  if(score>best) safeSet('tetris-best',String(score))
  if(overlay.value){overlay.value.style.display='flex';overlay.value.innerHTML=`<div style="font-size:2.5rem;margin-bottom:0.75rem">💀</div><div style="color:#ff4444;font-family:monospace;font-size:1.2rem;font-weight:bold;margin-bottom:0.5rem">GAME OVER</div><div style="color:#8888aa;font-family:monospace;font-size:0.875rem;margin-bottom:1.5rem">Score: <span style="color:#b400ff">${score}</span></div><button onclick="this.dispatchEvent(new CustomEvent('retry',{bubbles:true}))" style="font-family:monospace;font-size:0.875rem;padding:0.5rem 1.5rem;border:1px solid rgba(180,0,255,0.4);color:#b400ff;background:rgba(180,0,255,0.08);border-radius:0.5rem;cursor:pointer">RETRY</button>`; overlay.value.querySelector('button')?.addEventListener('click',startGame)}
}

const handleKeydown = (e: KeyboardEvent) => {
  if(!started||gameOver){if(e.code==='Space'||e.code==='Enter')startGame();return}
  if(e.code==='KeyP'||e.code==='Escape'){paused=!paused;if(!paused){dropTimer=performance.now();animFrame=requestAnimationFrame(gameLoop)};return}
  if(paused) return
  switch(e.code){
    case 'ArrowLeft': if(isValid(current.shape,pos.x-1,pos.y))pos.x--;break
    case 'ArrowRight': if(isValid(current.shape,pos.x+1,pos.y))pos.x++;break
    case 'ArrowDown': if(isValid(current.shape,pos.x,pos.y+1)){pos.y++;score++;updateUI()};break
    case 'ArrowUp': case 'KeyZ': {const r=rotate(current.shape);if(isValid(r,pos.x,pos.y))current.shape=r;else if(isValid(r,pos.x-1,pos.y)){current.shape=r;pos.x--}else if(isValid(r,pos.x+1,pos.y)){current.shape=r;pos.x++};break}
    case 'Space': e.preventDefault(); hardDrop(); break
  }
  drawBoard()
}

onMounted(() => {
  bestVal.value=parseInt(safeGet('tetris-best','0'))
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => { cancelAnimationFrame(animFrame); window.removeEventListener('keydown', handleKeydown) })
</script>
