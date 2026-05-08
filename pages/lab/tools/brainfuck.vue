<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'tools', href: '/lab' }, { label: 'brainfuck' }]" />
    <div class="max-w-3xl mx-auto px-6 py-10 space-y-4">
      <h1 class="font-mono text-xl font-bold text-[var(--color-neon-green)] mb-6">Brainfuck 解释器</h1>
      <textarea v-model="code" placeholder="++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.>++." class="w-full font-mono text-sm rounded-xl border border-[var(--color-void-border)] p-4 resize-none bg-[var(--color-void-card)] text-[var(--color-neon-cyan)] outline-none" style="height:120px"></textarea>
      <textarea v-model="input" placeholder="程序输入（可选）" class="w-full font-mono text-sm rounded-xl border border-[var(--color-void-border)] p-3 resize-none bg-[var(--color-void-card)] text-[var(--color-text-primary)] outline-none" style="height:60px"></textarea>
      <div class="flex gap-2">
        <button @click="run" class="font-mono text-xs px-4 py-2 rounded-lg border border-[rgba(57,255,20,0.4)] text-[var(--color-neon-green)] hover:bg-[rgba(57,255,20,0.1)] transition-all">▶ 运行</button>
        <button @click="code='';output='';error=''" class="font-mono text-xs px-4 py-2 rounded-lg border border-[rgba(255,0,170,0.3)] text-[rgba(255,0,170,0.7)] hover:bg-[rgba(255,0,170,0.1)] transition-all">清空</button>
      </div>
      <div v-if="error" class="font-mono text-sm text-[var(--color-neon-pink)] px-4 py-3 rounded-xl bg-[rgba(255,45,120,0.05)] border border-[rgba(255,45,120,0.2)]">{{ error }}</div>
      <div v-if="output!==null&&!error" class="border border-[var(--color-void-border)] rounded-xl p-4 bg-[var(--color-void-card)]">
        <div class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-2">输出</div>
        <div class="font-mono text-sm text-[var(--color-neon-cyan)] whitespace-pre-wrap">{{ output||'（无输出）' }}</div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `Brainfuck | ${siteName}` })
const code=ref(''),input=ref(''),output=ref<string|null>(null),error=ref('')
function run(){
  output.value=null;error.value=''
  try{
    const mem=new Uint8Array(30000),ops=[...code.value],inpArr=[...input.value]
    let dp=0,ip=0,inp=0,out='',steps=0
    const MAX=1e6
    while(ip<ops.length){
      if(++steps>MAX){error.value='超出最大步数 (1M)';return}
      const op=ops[ip]
      if(op==='+')mem[dp]=(mem[dp]+1)%256
      else if(op==='-')mem[dp]=(mem[dp]+255)%256
      else if(op==='>'){dp++;if(dp>=30000){error.value='指针越界';return}}
      else if(op==='<'){dp--;if(dp<0){error.value='指针越界';return}}
      else if(op==='.')out+=String.fromCharCode(mem[dp])
      else if(op===',')mem[dp]=inp<inpArr.length?inpArr[inp++].charCodeAt(0):0
      else if(op==='['&&mem[dp]===0){let d=1;while(d&&++ip<ops.length){if(ops[ip]==='[')d++;else if(ops[ip]===']')d--}}
      else if(op===']'&&mem[dp]!==0){let d=1;while(d&&--ip>=0){if(ops[ip]===']')d++;else if(ops[ip]==='[')d--}}
      ip++
    }
    output.value=out
  }catch(e:any){error.value=String(e)}
}
</script>
