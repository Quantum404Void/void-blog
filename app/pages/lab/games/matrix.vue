<template>
  <div style="margin:0;padding:0;overflow:hidden;background:#000;height:100vh;width:100vw;position:relative">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'games', href: '/lab' }, { label: 'matrix-rain' }]" />
    <canvas ref="canvasEl" style="display:block;width:100vw;height:100vh;cursor:crosshair"></canvas>
    <div style="position:fixed;bottom:1rem;left:50%;transform:translateX(-50%);z-index:50;display:flex;align-items:center;gap:0.75rem;padding:0.5rem 1rem;background:rgba(0,0,0,0.75);border:1px solid rgba(0,255,65,0.2);border-radius:10px;backdrop-filter:blur(10px);font-family:'JetBrains Mono',monospace;font-size:11px;white-space:nowrap">
      <button @click="nextTheme" style="padding:4px 10px;border:1px solid rgba(0,255,65,0.3);border-radius:6px;background:transparent;color:rgba(0,255,65,0.8);cursor:pointer">🎨</button>
      <button @click="togglePause" style="padding:4px 10px;border:1px solid rgba(0,212,255,0.3);border-radius:6px;background:transparent;color:rgba(0,212,255,0.8);cursor:pointer">{{ paused ? '▶' : '⏸' }}</button>
      <div style="display:flex;align-items:center;gap:0.4rem;color:rgba(255,255,255,0.4)">
        速度 <input type="range" min="0.2" max="4" step="0.1" v-model="speedMult" style="width:70px;accent-color:#00ff41;cursor:pointer"> <span style="color:rgba(0,255,65,0.8);min-width:2ch">{{ Number(speedMult).toFixed(1) }}x</span>
      </div>
      <div style="display:flex;align-items:center;gap:0.4rem;color:rgba(255,255,255,0.4)">
        字号 <input type="range" min="8" max="28" step="2" v-model.number="fontSize" @change="initCols" style="width:60px;accent-color:#00d4ff;cursor:pointer"> <span style="color:rgba(0,212,255,0.8);min-width:2ch">{{ fontSize }}</span>
      </div>
      <div style="display:flex;align-items:center;gap:0.4rem;color:rgba(255,255,255,0.4)">
        密度 <input type="range" min="0.1" max="1" step="0.05" v-model.number="density" @change="initCols" style="width:60px;accent-color:#b400ff;cursor:pointer">
      </div>
      <button @click="toggleFullscreen" style="padding:4px 10px;border:1px solid rgba(180,0,255,0.3);border-radius:6px;background:transparent;color:rgba(180,0,255,0.8);cursor:pointer">⛶</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const { siteName } = useSiteConfig()
useHead({ title: `Matrix Rain | ${siteName}` })
useSeoMeta({ title: `Matrix Rain | ${siteName}` })
const canvasEl = ref<HTMLCanvasElement>()
const themeNameEl = ref<HTMLElement>()
const paused = ref(false)
const speedMult = ref(1)
const fontSize = ref(14)
const density = ref(0.6)

const THEMES = [
  {name:'GREEN',fg:'#00ff41',head:'#ffffff',bg:'rgba(0,0,0,0.055)',glow:'#00ff41',chars:'アイウエオカキクケコ0123456789<>{}[]/\\|'},
  {name:'CYAN',fg:'#00d4ff',head:'#aaffff',bg:'rgba(0,5,12,0.055)',glow:'#00d4ff',chars:'function const let => {} () if else for while return import export async await'},
  {name:'PURPLE',fg:'#b400ff',head:'#ffaaff',bg:'rgba(4,0,10,0.055)',glow:'#b400ff',chars:'▓▒░█▄▀■□●○◆◇★☆♦♣♠♥01010110'},
  {name:'PINK',fg:'#ff00aa',head:'#ffaaee',bg:'rgba(12,0,6,0.055)',glow:'#ff00aa',chars:'你好世界代码编程算法系统网络数据结构递归迭代循环函数变量指针内存堆栈'},
  {name:'GOLD',fg:'#ffaa00',head:'#ffffff',bg:'rgba(8,5,0,0.055)',glow:'#ffaa00',chars:'#!/usr/bin/env bash echo grep sed awk find chmod sudo apt git npm bun'},
]
let themeIdx=0, cols=0, drops: number[]=[], colSpeeds: number[]=[], ripples: any[]=[], rafId=0, lastTs=0, frameCount=0, fpsAcc=0

function initCols() {
  const cv=canvasEl.value!; cols=Math.floor(cv.width/fontSize.value)
  drops=Array.from({length:cols},()=>Math.random()<density.value?Math.random()*(-(cv.height/fontSize.value)):Math.random()*-50)
  colSpeeds=Array.from({length:cols},()=>0.3+Math.random()*0.7)
}

function nextTheme() {
  themeIdx=(themeIdx+1)%THEMES.length
  const t=THEMES[themeIdx]
  if(themeNameEl.value){themeNameEl.value.textContent=t.name;themeNameEl.value.style.color=t.fg}
  const cv=canvasEl.value!; cv.getContext('2d')!.clearRect(0,0,cv.width,cv.height)
}

function togglePause(){paused.value=!paused.value}
function toggleFullscreen(){if(!document.fullscreenElement)document.documentElement.requestFullscreen();else document.exitFullscreen()}

function frame(ts: number){
  rafId=requestAnimationFrame(frame)
  const dt=Math.min(ts-lastTs,100); lastTs=ts
  frameCount++; fpsAcc+=dt
  if(fpsAcc>=800){const el=document.getElementById('fps-badge');if(el)el.textContent=Math.round(frameCount/(fpsAcc/1000))+' fps';frameCount=0;fpsAcc=0}
  if(paused.value) return
  const cv=canvasEl.value!; const ctx=cv.getContext('2d')!; const t=THEMES[themeIdx]
  ctx.fillStyle=t.bg; ctx.fillRect(0,0,cv.width,cv.height)
  ctx.font=`bold ${fontSize.value}px 'JetBrains Mono',monospace`
  for(let i=0;i<cols;i++){
    const x=i*fontSize.value, y=drops[i]*fontSize.value
    const ch=t.chars[Math.floor(Math.random()*t.chars.length)]
    ctx.shadowBlur=10; ctx.shadowColor=t.glow; ctx.fillStyle=t.head; ctx.fillText(ch,x,y)
    if(drops[i]>1){ctx.shadowBlur=3;ctx.fillStyle=t.fg;ctx.fillText(t.chars[Math.floor(Math.random()*t.chars.length)],x,y-fontSize.value)}
    drops[i]+=colSpeeds[i]*Number(speedMult.value)*(dt/16)
    if(y>cv.height&&Math.random()>0.97) drops[i]=Math.random()*-30
  }
  ctx.shadowBlur=0
  for(let i=ripples.length-1;i>=0;i--){
    const r=ripples[i]; r.r+=4*Number(speedMult.value); r.life-=0.025
    if(r.life<=0){ripples.splice(i,1);continue}
    ctx.save();ctx.globalAlpha=r.life*0.6;ctx.strokeStyle=t.fg;ctx.lineWidth=2;ctx.shadowBlur=8;ctx.shadowColor=t.glow
    ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,Math.PI*2);ctx.stroke();ctx.restore()
  }
}

let _resizeHandler: () => void, _keydownHandler: (e: KeyboardEvent) => void, _clickHandler: (e: MouseEvent) => void

onMounted(()=>{
  const cv=canvasEl.value!
  cv.width=window.innerWidth; cv.height=window.innerHeight
  initCols()
  _clickHandler=(e)=>ripples.push({x:e.clientX,y:e.clientY,r:0,life:1})
  _resizeHandler=()=>{cv.width=window.innerWidth;cv.height=window.innerHeight;initCols()}
  _keydownHandler=(e)=>{
    if(e.key===' '){e.preventDefault();togglePause()}
    if(e.key==='t'||e.key==='T') nextTheme()
    if(e.key==='f'||e.key==='F') toggleFullscreen()
  }
  cv.addEventListener('click', _clickHandler)
  window.addEventListener('resize', _resizeHandler)
  document.addEventListener('keydown', _keydownHandler)
  rafId=requestAnimationFrame(frame)
})
onUnmounted(()=>{
  cancelAnimationFrame(rafId)
  window.removeEventListener('resize', _resizeHandler)
  document.removeEventListener('keydown', _keydownHandler)
  canvasEl.value?.removeEventListener('click', _clickHandler)
})
</script>
