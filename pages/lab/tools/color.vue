<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <nav class="sticky top-0 z-50 border-b border-[var(--color-void-border)] bg-[rgba(10,10,15,0.85)] backdrop-blur-xl">
      <div class="max-w-3xl mx-auto px-6 h-14 flex items-center gap-4 font-mono text-xs">
        <NuxtLink to="/lab" class="text-[var(--color-neon-green)]">~/lab</NuxtLink><span>/</span>
        <NuxtLink to="/lab" class="text-[var(--color-neon-cyan)] hover:opacity-80 transition-opacity">tools</NuxtLink><span>/</span><span class="text-[var(--color-neon-purple)]">color</span>
      </div>
    </nav>
    <div class="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <h1 class="font-mono text-xl font-bold text-[var(--color-neon-pink)] mb-6">颜色工具</h1>
      <div class="flex gap-4 items-center">
        <input type="color" v-model="hex" class="w-16 h-16 rounded-xl border-0 cursor-pointer bg-transparent" style="padding:0">
        <input v-model="hex" @input="fromHex" placeholder="#000000" class="font-mono text-lg rounded-xl border border-[var(--color-void-border)] px-4 py-2 bg-[var(--color-void-card)] text-[var(--color-text-primary)] outline-none w-40">
        <div class="w-16 h-16 rounded-xl border border-[var(--color-void-border)]" :style="`background:${hex}`"></div>
      </div>
      <div class="grid grid-cols-1 gap-3">
        <div v-for="fmt in formats" :key="fmt.label" class="border border-[var(--color-void-border)] rounded-xl p-4 bg-[var(--color-void-card)] flex items-center justify-between">
          <div>
            <div class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-1">{{ fmt.label }}</div>
            <div class="font-mono text-sm" :style="`color:${fmt.color}`">{{ fmt.value }}</div>
          </div>
          <button @click="copyVal(fmt.value)" class="font-mono text-[10px] px-3 py-1 rounded border border-[rgba(255,255,255,0.1)] text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)] transition-all">复制</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
useHead({ title: '颜色工具 | void.dev' })
const hex=ref('#39ff14')
const formats=computed(()=>{
  const r=parseInt(hex.value.slice(1,3)||'00',16),g=parseInt(hex.value.slice(3,5)||'00',16),b=parseInt(hex.value.slice(5,7)||'00',16)
  const h=(r/255).toFixed(3),gn=(g/255).toFixed(3),bn=(b/255).toFixed(3)
  const mn=Math.min(r,g,b)/255,mx=Math.max(r,g,b)/255,delta=mx-mn
  let hue=0; if(delta){if(mx===r/255)hue=((g-b)/255/delta)%6;else if(mx===g/255)hue=(b-r)/255/delta+2;else hue=(r-g)/255/delta+4;hue=Math.round(hue*60);if(hue<0)hue+=360}
  const sat=mx?Math.round(delta/mx*100):0, val=Math.round(mx*100)
  return [
    {label:'HEX',value:hex.value.toUpperCase(),color:'#39ff14'},
    {label:'RGB',value:`rgb(${r}, ${g}, ${b})`,color:'#00d4ff'},
    {label:'HSV',value:`hsv(${hue}°, ${sat}%, ${val}%)`,color:'#b400ff'},
    {label:'Float',value:`(${h}, ${gn}, ${bn})`,color:'#ff00aa'},
  ]
})
function fromHex(){/* hex bound to input */}
async function copyVal(v: string){await navigator.clipboard.writeText(v)}
</script>
