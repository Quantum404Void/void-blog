<template>
  <div class="min-h-screen bg-[var(--color-void)] flex flex-col items-center justify-center p-4">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'flappy-void' }]" />
    <div class="pt-20 flex flex-col items-center gap-4">
      <h1 class="font-mono text-xl font-bold text-[var(--color-neon-cyan)]" style="text-shadow:0 0 20px rgba(0,212,255,0.5)">Flappy Void</h1>
      <p class="font-mono text-xs text-[var(--color-text-muted)]">Space / Click / Tap 跳跃</p>
      <canvas ref="canvasEl" width="380" height="540" class="border border-[var(--color-void-border)] rounded-xl" style="background:#06060e;cursor:pointer"></canvas>
      <div class="flex gap-6 font-mono text-xs text-[var(--color-text-muted)]">
        <span>SCORE: <span class="text-[var(--color-neon-cyan)] font-bold">{{ score }}</span></span>
        <span>BEST: <span class="text-[var(--color-neon-green)] font-bold">{{ best }}</span></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { siteName } = useSiteConfig()
useHead({ title: `Flappy Void | ${siteName}` })
const canvasEl = ref<HTMLCanvasElement>()
const score = ref(0), best = ref(0)
const W=380,H=540,GRAVITY=0.45,JUMP=-7.5,PIPE_SPEED=2.5,GAP=140,PW=52,PI=1900

let state='idle', bird: any={}, pipes: any[]=[], lastPipe=0, animFrame=0, rafId=0

function initBird(){bird={x:80,y:H/2,vy:0,angle:0}}
function jump(){if(state==='idle'||state==='dead'){initBird();pipes=[];score.value=0;lastPipe=0;state='playing'};bird.vy=JUMP}

function spawnPipe(now: number){
  if(now-lastPipe<PI)return; lastPipe=now
  const top=80+Math.random()*(H-GAP-160)
  pipes.push({x:W+20,top,scored:false})
}

function update(now: number,dt: number){
  if(state!=='playing')return
  bird.vy+=GRAVITY*(dt/16); bird.y+=bird.vy*(dt/16)
  bird.angle=Math.min(Math.max(bird.vy*3,-30),80)
  spawnPipe(now)
  for(const p of pipes){
    p.x-=PIPE_SPEED*(dt/16)
    if(!p.scored&&p.x+PW<bird.x){p.scored=true;score.value++;best.value=Math.max(best.value,score.value);localStorage.setItem('flappy-best',String(best.value))}
  }
  pipes=pipes.filter(p=>p.x>-PW-10)
  if(bird.y<0||bird.y>H-20) die()
  for(const p of pipes){
    const bx=bird.x,by=bird.y,br=14
    if(bx+br>p.x&&bx-br<p.x+PW&&(by-br<p.top||by+br>p.top+GAP)) die()
  }
}

function die(){state='dead'}

function drawScene(ctx: CanvasRenderingContext2D){
  ctx.fillStyle='#06060e'; ctx.fillRect(0,0,W,H)
  // pipes
  for(const p of pipes){
    ctx.fillStyle='#00d4ff'; ctx.shadowColor='#00d4ff'; ctx.shadowBlur=8
    ctx.fillRect(p.x,0,PW,p.top)
    ctx.fillRect(p.x,p.top+GAP,PW,H-p.top-GAP)
    ctx.shadowBlur=0
    // caps
    ctx.fillStyle='#00aacc'
    ctx.fillRect(p.x-4,p.top-12,PW+8,12)
    ctx.fillRect(p.x-4,p.top+GAP,PW+8,12)
  }
  // bird
  ctx.save(); ctx.translate(bird.x,bird.y); ctx.rotate(bird.angle*Math.PI/180)
  ctx.beginPath(); ctx.ellipse(0,0,14,10,0,0,Math.PI*2)
  ctx.fillStyle='#b400ff'; ctx.shadowColor='#b400ff'; ctx.shadowBlur=15; ctx.fill(); ctx.shadowBlur=0
  ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.fillRect(2,-5,6,4)
  ctx.restore()
  // UI
  ctx.font='bold 28px JetBrains Mono,monospace'; ctx.fillStyle='#e8e8f0'; ctx.textAlign='center'
  ctx.shadowColor='rgba(0,0,0,0.5)'; ctx.shadowBlur=4
  ctx.fillText(String(score.value),W/2,50); ctx.shadowBlur=0
  if(state==='idle'||state==='dead'){
    ctx.fillStyle='rgba(10,10,15,0.7)'; ctx.fillRect(0,0,W,H)
    ctx.font='bold 22px JetBrains Mono,monospace'; ctx.fillStyle=state==='dead'?'#ff2d78':'#b400ff'
    ctx.fillText(state==='dead'?'GAME OVER':'FLAPPY VOID',W/2,H/2-30)
    ctx.font='14px JetBrains Mono,monospace'; ctx.fillStyle='#8888aa'
    ctx.fillText('Space / Click 开始',W/2,H/2+10)
    if(state==='dead'){ctx.font='14px JetBrains Mono,monospace';ctx.fillStyle='#8888aa';ctx.fillText(`Score: ${score.value}  Best: ${best.value}`,W/2,H/2+35)}
  }
  ctx.textAlign='left'
}

let lastTs=0
function frame(ts: number){
  rafId=requestAnimationFrame(frame)
  const dt=Math.min(ts-lastTs,100); lastTs=ts
  const cv=canvasEl.value!; const ctx=cv.getContext('2d')!
  update(ts,dt); drawScene(ctx)
}

onMounted(()=>{
  best.value=parseInt(localStorage.getItem('flappy-best')||'0')
  initBird()
  const cv=canvasEl.value!
  cv.addEventListener('click',jump)
  const _flappyKey=(e:KeyboardEvent)=>{if(e.code==='Space'){e.preventDefault();jump()}}
  window.addEventListener('keydown',_flappyKey)
  ;(cv as any)._flappyKey=_flappyKey
  rafId=requestAnimationFrame(frame)
})
const _flappyCleanup=()=>{
  cancelAnimationFrame(rafId)
  const cv=canvasEl.value
  if(cv&&(cv as any)._flappyKey) window.removeEventListener('keydown',(cv as any)._flappyKey)
}
onUnmounted(_flappyCleanup)
</script>
