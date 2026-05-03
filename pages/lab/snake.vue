<template>
  <div class="min-h-screen bg-[var(--color-void)] flex flex-col items-center justify-center p-4">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'snake' }]" />

    <div class="pt-20 w-full max-w-lg">
      <div class="text-center mb-6">
        <p class="font-mono text-[10px] text-[var(--color-text-muted)] tracking-[0.25em] uppercase mb-2">process: snake.exe</p>
        <h1 class="font-mono text-2xl font-bold text-[var(--color-neon-green)] mb-1" style="text-shadow:0 0 20px rgba(57,255,20,0.5)">SNAKE</h1>
        <p class="font-mono text-xs text-[var(--color-text-muted)]">WASD / 方向键 移动 · Space 暂停 · R 重新开始</p>
      </div>

      <div class="flex items-center justify-between font-mono text-xs mb-3 px-1">
        <div class="text-[var(--color-text-muted)]">SCORE: <span id="score" class="text-[var(--color-neon-cyan)] font-bold">0</span></div>
        <div class="text-[var(--color-text-muted)]">HIGH: <span id="highscore" class="text-[var(--color-neon-green)] font-bold">0</span></div>
        <div class="text-[var(--color-text-muted)]">LEVEL: <span id="level" class="text-[var(--color-neon-purple)] font-bold">1</span></div>
      </div>

      <div class="relative border border-[var(--color-void-border)] rounded-xl overflow-hidden" style="background:#06060e;box-shadow:0 0 40px rgba(0,212,255,0.08),inset 0 0 60px rgba(0,0,0,0.5)">
        <canvas id="snake-canvas" width="400" height="400" style="display:block;width:100%;image-rendering:pixelated"></canvas>
        <div id="game-overlay" class="absolute inset-0 flex flex-col items-center justify-center font-mono" style="background:rgba(6,6,14,0.92)">
          <div id="overlay-icon" style="font-size:2.5rem;margin-bottom:0.75rem">🐍</div>
          <div id="overlay-title" class="text-xl font-bold mb-2" style="color:#00d4ff;text-shadow:0 0 15px #00d4ff">SNAKE</div>
          <div id="overlay-sub" class="text-xs mb-6" style="color:#8888aa">按 Space 或 Enter 开始</div>
          <button id="start-btn" class="font-mono text-sm px-6 py-2 rounded-lg border transition-all" style="border-color:rgba(0,212,255,0.4);color:#00d4ff;background:rgba(0,212,255,0.08)">▶ START</button>
        </div>
      </div>

      <div class="mt-4 grid grid-cols-3 gap-2 font-mono text-[10px] text-center text-[var(--color-text-muted)]">
        <div class="border border-[var(--color-void-border)] rounded-lg p-2 bg-[var(--color-void-card)]"><div class="text-[var(--color-neon-cyan)] mb-1">移动</div><div>WASD / ↑↓←→</div></div>
        <div class="border border-[var(--color-void-border)] rounded-lg p-2 bg-[var(--color-void-card)]"><div class="text-[var(--color-neon-green)] mb-1">暂停</div><div>Space</div></div>
        <div class="border border-[var(--color-void-border)] rounded-lg p-2 bg-[var(--color-void-card)]"><div class="text-[var(--color-neon-purple)] mb-1">重置</div><div>R</div></div>
      </div>

      <div class="mt-4 flex flex-col items-center gap-1 sm:hidden">
        <button class="dpad-btn" data-dir="UP">▲</button>
        <div class="flex gap-1">
          <button class="dpad-btn" data-dir="LEFT">◀</button>
          <button class="dpad-btn" style="opacity:0;pointer-events:none">▲</button>
          <button class="dpad-btn" data-dir="RIGHT">▶</button>
        </div>
        <button class="dpad-btn" data-dir="DOWN">▼</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `Snake | ${siteName}` })

onMounted(() => {
  const COLS = 20, ROWS = 20
  const CELL = 400 / COLS
  const canvas = document.getElementById('snake-canvas') as HTMLCanvasElement
  const ctx = canvas.getContext('2d')!
  const scoreEl = document.getElementById('score')!
  const highEl = document.getElementById('highscore')!
  const levelEl = document.getElementById('level')!
  const overlay = document.getElementById('game-overlay')!
  const overlayIcon = document.getElementById('overlay-icon')!
  const overlayTitle = document.getElementById('overlay-title')!
  const overlaySub = document.getElementById('overlay-sub')!
  const startBtn = document.getElementById('start-btn')!

  type Dir = 'UP'|'DOWN'|'LEFT'|'RIGHT'
  type Pt = {x:number,y:number}

  let snake: Pt[] = []
  let dir: Dir = 'RIGHT', nextDir: Dir = 'RIGHT'
  let food: Pt = {x:0,y:0}
  let score = 0
  let highScore = parseInt(localStorage.getItem('snake-hs') || '0')
  let level = 1
  let gameState: 'idle'|'running'|'paused'|'dead' = 'idle'
  let wallMode = true
  let loopTimer: ReturnType<typeof setTimeout> | null = null
  let foodPulse = 0

  const NEON = { head:'#39ff14', body:'#00d4ff', food:'#ff00aa', grid:'rgba(255,255,255,0.03)' }
  function getSpeed() { return Math.max(60, 200 - (level-1)*20) }

  function init() {
    snake = [{x:12,y:10},{x:11,y:10},{x:10,y:10},{x:9,y:10}]
    dir = 'RIGHT'; nextDir = 'RIGHT'; score = 0; level = 1
    scoreEl.textContent = '0'; levelEl.textContent = '1'; highEl.textContent = String(highScore)
    placeFood()
  }

  function placeFood() {
    const occupied = new Set(snake.map(p => `${p.x},${p.y}`))
    let f: Pt
    do { f = {x:Math.floor(Math.random()*COLS),y:Math.floor(Math.random()*ROWS)} }
    while(occupied.has(`${f.x},${f.y}`))
    food = f
  }

  function step() {
    dir = nextDir
    const head = snake[0]
    const nx = head.x + (dir==='LEFT'?-1:dir==='RIGHT'?1:0)
    const ny = head.y + (dir==='UP'?-1:dir==='DOWN'?1:0)
    if (!wallMode && (nx<0||nx>=COLS||ny<0||ny>=ROWS)) { die(); return }
    const newHead: Pt = { x:(nx+COLS)%COLS, y:(ny+ROWS)%ROWS }
    if (snake.some(p=>p.x===newHead.x&&p.y===newHead.y)) { die(); return }
    snake.unshift(newHead)
    if (newHead.x===food.x&&newHead.y===food.y) {
      score += 10*level; scoreEl.textContent = String(score)
      if (score>highScore) { highScore=score; highEl.textContent=String(highScore); localStorage.setItem('snake-hs',String(highScore)) }
      if (score>=level*80) { level++; levelEl.textContent=String(level) }
      placeFood()
    } else { snake.pop() }
    draw()
  }

  function roundRect(c: CanvasRenderingContext2D, x:number,y:number,w:number,h:number,r:number) {
    c.beginPath(); c.moveTo(x+r,y)
    c.lineTo(x+w-r,y); c.arcTo(x+w,y,x+w,y+r,r)
    c.lineTo(x+w,y+h-r); c.arcTo(x+w,y+h,x+w-r,y+h,r)
    c.lineTo(x+r,y+h); c.arcTo(x,y+h,x,y+h-r,r)
    c.lineTo(x,y+r); c.arcTo(x,y,x+r,y,r); c.closePath()
  }

  function draw() {
    ctx.clearRect(0,0,400,400)
    ctx.strokeStyle=NEON.grid; ctx.lineWidth=0.5
    for(let x=0;x<=COLS;x++){ctx.beginPath();ctx.moveTo(x*CELL,0);ctx.lineTo(x*CELL,400);ctx.stroke()}
    for(let y=0;y<=ROWS;y++){ctx.beginPath();ctx.moveTo(0,y*CELL);ctx.lineTo(400,y*CELL);ctx.stroke()}
    snake.forEach((p,i)=>{
      const t=i/(snake.length-1||1)
      ctx.save()
      if(i===0){ctx.shadowBlur=16;ctx.shadowColor=NEON.head;ctx.fillStyle=NEON.head}
      else{ctx.shadowBlur=6;ctx.shadowColor=NEON.body;ctx.fillStyle=`rgba(0,212,255,${Math.max(0.2,1-t*0.75)})`}
      roundRect(ctx,p.x*CELL+(i===0?1:2),p.y*CELL+(i===0?1:2),CELL-(i===0?2:4),CELL-(i===0?2:4),i===0?4:3)
      ctx.fill(); ctx.restore()
    })
    // Food
    foodPulse=(foodPulse+0.08)%(Math.PI*2)
    const fp=1+Math.sin(foodPulse)*0.2
    ctx.save(); ctx.shadowBlur=18+Math.sin(foodPulse)*8; ctx.shadowColor=NEON.food; ctx.fillStyle=NEON.food
    ctx.beginPath(); ctx.arc(food.x*CELL+CELL/2,food.y*CELL+CELL/2,(CELL*0.28)*fp,0,Math.PI*2); ctx.fill()
    ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(food.x*CELL+CELL/2-2,food.y*CELL+CELL/2-2,(CELL*0.1)*fp,0,Math.PI*2); ctx.fill()
    ctx.restore()
    if(gameState==='paused'){
      ctx.fillStyle='rgba(10,10,15,0.7)'; ctx.fillRect(0,0,400,400)
      ctx.fillStyle='#00d4ff'; ctx.font='bold 28px JetBrains Mono,monospace'; ctx.textAlign='center'
      ctx.shadowBlur=20; ctx.shadowColor='#00d4ff'; ctx.fillText('PAUSED',200,205)
      ctx.font='12px JetBrains Mono,monospace'; ctx.fillStyle='#8888aa'; ctx.shadowBlur=0
      ctx.fillText('Press Space to continue',200,235)
    }
  }

  function startGame() {
    init(); gameState='running'; overlay.style.display='none'; loop()
  }

  function die() {
    gameState='dead'; if(loopTimer)clearTimeout(loopTimer)
    let f=0; const flash=setInterval(()=>{
      ctx.fillStyle=`rgba(255,0,100,${f%2===0?0.3:0})`; ctx.fillRect(0,0,400,400)
      if(++f>=6){clearInterval(flash);showOverlay('💀','GAME OVER',`Score: ${score}`,'RESTART')}
    },80)
  }

  function showOverlay(icon:string,title:string,sub:string,btn:string) {
    overlayIcon.textContent=icon; overlayTitle.textContent=title
    overlayTitle.style.color=title==='GAME OVER'?'#ff00aa':'#00d4ff'
    overlayTitle.style.textShadow=`0 0 15px ${title==='GAME OVER'?'#ff00aa':'#00d4ff'}`
    overlaySub.textContent=sub; startBtn.textContent=`▶ ${btn}`; overlay.style.display='flex'
  }

  function loop() {
    if(gameState!=='running')return; step(); loopTimer=setTimeout(loop,getSpeed())
  }

  type DirType = 'UP'|'DOWN'|'LEFT'|'RIGHT'
  const dirMap: Record<string,DirType> = {ArrowUp:'UP',ArrowDown:'DOWN',ArrowLeft:'LEFT',ArrowRight:'RIGHT',w:'UP',s:'DOWN',a:'LEFT',d:'RIGHT',W:'UP',S:'DOWN',A:'LEFT',D:'RIGHT'}
  const opposite: Record<DirType,DirType> = {UP:'DOWN',DOWN:'UP',LEFT:'RIGHT',RIGHT:'LEFT'}

  document.addEventListener('keydown',(e)=>{
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault()
    if(e.key===' '||e.key==='Enter'){
      if(gameState==='idle'||gameState==='dead')startGame()
      else if(gameState==='running'){gameState='paused';if(loopTimer)clearTimeout(loopTimer);draw()}
      else if(gameState==='paused'){gameState='running';loop()}
      return
    }
    if(e.key==='r'||e.key==='R'){startGame();return}
    const d=dirMap[e.key]
    if(d&&d!==opposite[dir])nextDir=d
  })

  startBtn.addEventListener('click',()=>{if(gameState==='idle'||gameState==='dead')startGame()})

  document.getElementById('wall-mode-btn')?.addEventListener('click',()=>{
    wallMode=!wallMode
    const btn=document.getElementById('wall-mode-btn') as HTMLButtonElement
    btn.textContent=wallMode?'穿墙 ON':'碰壁 ON'
    btn.style.borderColor=wallMode?'rgba(0,212,255,0.3)':'rgba(255,0,170,0.3)'
    btn.style.color=wallMode?'rgba(0,212,255,0.7)':'rgba(255,0,170,0.7)'
  })

  document.querySelectorAll('.dpad-btn').forEach(btn=>{
    const handleDir=()=>{
      const d=(btn as HTMLElement).dataset.dir as DirType
      if(d&&d!==opposite[dir]){
        if(gameState==='running')nextDir=d
        else if(gameState==='idle'||gameState==='dead'){startGame();nextDir=d}
      }
    }
    btn.addEventListener('touchstart',(e)=>{e.preventDefault();handleDir()},{passive:false})
    btn.addEventListener('mousedown',handleDir)
  })

  draw(); highEl.textContent=String(highScore)
})
</script>

<style scoped>
.dpad-btn {
  width:48px;height:48px;font-family:var(--font-mono);font-size:1rem;
  background:rgba(0,212,255,0.08);border:1px solid rgba(0,212,255,0.25);
  border-radius:8px;color:rgba(0,212,255,0.8);cursor:pointer;transition:all 0.1s;
  -webkit-tap-highlight-color:transparent;
}
.dpad-btn:active{background:rgba(0,212,255,0.22);transform:scale(0.92)}
</style>
