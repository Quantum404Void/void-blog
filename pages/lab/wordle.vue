<template>
  <div class="min-h-screen bg-[var(--color-void)] flex flex-col">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'wordle' }]" />
    <div class="flex-1 flex flex-col items-center py-8 px-4">
      <div v-if="message" class="font-mono text-sm px-4 py-2 rounded-lg mb-4" :style="msgStyle">{{ message }}</div>
      <!-- Grid -->
      <div class="grid gap-2 mb-6" style="grid-template-rows: repeat(6,1fr)">
        <div v-for="r in 6" :key="r" class="flex gap-2">
          <div v-for="c in 5" :key="c"
            class="w-14 h-14 flex items-center justify-center font-mono text-xl font-bold border-2 transition-all duration-300"
            :style="getTileStyle(r-1,c-1)">
            {{ getTileLetter(r-1,c-1) }}
          </div>
        </div>
      </div>
      <!-- Keyboard -->
      <div class="flex flex-col gap-2">
        <div v-for="row in keyRows" :key="row.join('')" class="flex gap-1 justify-center">
          <button v-for="k in row" :key="k"
            @click="k==='⌫'?del():k==='↵'?submit():type(k)"
            class="font-mono text-xs font-bold rounded-lg border transition-all"
            :style="getKeyStyle(k)"
            :class="k==='⌫'||k==='↵'?'px-3 py-3 min-w-[44px]':'px-2 py-3 min-w-[32px]'">
            {{ k }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { siteName } = useSiteConfig()
useHead({ title: `Wordle | ${siteName}` })
const WORDS=['ARRAY','STACK','QUEUE','CLASS','ASYNC','AWAIT','YIELD','CATCH','THROW','CONST','BREAK','DEBUG','ERROR','EVENT','FETCH','FRAME','GUARD','HOOKS','INDEX','INPUT','JUDGE','LOGIC','MATCH','MUTEX','NODES','OAUTH','PARSE','PROXY','QUERY','REACT','ROUTE','SCOPE','STATE','TABLE','TOKEN','TYPES','UNION','VALID','WATCH','XPATH','BUILD','CACHE','CLONE','DRAFT','EQUAL','FIXED','GRANT','HOIST','INNER','JOINT','LAYER','MERGE','NEVER','OUTER','PATCH','QUICK','REGEX','SLICE','STORE','TRACE','USING','VISIT','WRITE','BLOCK','CHECK','DEFER','EMPTY','FLAGS','GRAPH','LIMIT','ORDER','PRINT','QUOTE','READS','SETUP','TIMER','VALUE','ABORT','ADAPT','AGENT']
const keyRows=[['Q','W','E','R','T','Y','U','I','O','P'],['A','S','D','F','G','H','J','K','L'],['↵','Z','X','C','V','B','N','M','⌫']]

const guesses = ref<string[][]>(Array.from({length:6},()=>[]))
const results = ref<string[][]>(Array.from({length:6},()=>[]))
const currentRow = ref(0), currentCol = ref(0)
const answer = ref(''), gameOver = ref(false), message = ref(''), msgStyle = ref('')

function newGame(){
  answer.value=WORDS[Math.floor(Math.random()*WORDS.length)]
  guesses.value=Array.from({length:6},()=>[])
  results.value=Array.from({length:6},()=>[])
  currentRow.value=0; currentCol.value=0; gameOver.value=false; message.value=''
}

function type(k: string){
  if(gameOver.value||currentCol.value>=5) return
  guesses.value[currentRow.value][currentCol.value]=k; currentCol.value++
}
function del(){if(currentCol.value>0){currentCol.value--;guesses.value[currentRow.value].splice(currentCol.value,1)}}
function submit(){
  if(currentCol.value<5) return
  const guess=guesses.value[currentRow.value].join('')
  const ans=answer.value, res=Array(5).fill('absent')
  const ansArr=ans.split(''), used=Array(5).fill(false)
  for(let i=0;i<5;i++)if(guess[i]===ansArr[i]){res[i]='correct';used[i]=true}
  for(let i=0;i<5;i++)if(res[i]!=='correct'){for(let j=0;j<5;j++){if(!used[j]&&guess[i]===ansArr[j]&&res[j]!=='correct'){res[i]='present';used[j]=true;break}}}
  results.value[currentRow.value]=res
  if(guess===ans){message.value='🎉 CORRECT!';msgStyle.value='background:rgba(57,255,20,0.15);border:1px solid rgba(57,255,20,0.3);color:#39ff14';gameOver.value=true}
  else if(currentRow.value===5){message.value=`答案是 ${ans}`;msgStyle.value='background:rgba(255,0,170,0.15);border:1px solid rgba(255,0,170,0.3);color:#ff00aa';gameOver.value=true}
  currentRow.value++; currentCol.value=0
}

function getTileLetter(r: number, c: number){return guesses.value[r]?.[c]||''}
function getTileStyle(r: number, c: number){
  const result=results.value[r]?.[c]
  const letter=guesses.value[r]?.[c]
  const isCurrent=r===currentRow.value&&c===currentCol.value
  let bg='transparent', border='rgba(255,255,255,0.1)', color='#e8e8f0'
  if(result==='correct'){bg='rgba(57,255,20,0.2)';border='rgba(57,255,20,0.5)';color='#39ff14'}
  else if(result==='present'){bg='rgba(255,170,0,0.2)';border='rgba(255,170,0,0.5)';color='#ffaa00'}
  else if(result==='absent'&&letter){bg='rgba(100,100,150,0.15)';border='rgba(100,100,150,0.3)';color='#6666aa'}
  else if(letter){border='rgba(255,255,255,0.3)'}
  if(isCurrent) border='rgba(0,212,255,0.5)'
  return `background:${bg};border-color:${border};color:${color}`
}
function getKeyStyle(k: string){
  if(k==='⌫'||k==='↵') return 'border-color:rgba(255,255,255,0.15);color:#e8e8f0;background:rgba(255,255,255,0.05)'
  let best='none'
  for(let r=0;r<currentRow.value;r++){
    const g=guesses.value[r].join(''), res=results.value[r]
    for(let c=0;c<5;c++){if(g[c]===k){if(res[c]==='correct'){best='correct';break}else if(res[c]==='present'&&best!=='correct')best='present';else if(res[c]==='absent'&&best==='none')best='absent'}}
    if(best==='correct') break
  }
  if(best==='correct') return 'border-color:rgba(57,255,20,0.5);color:#39ff14;background:rgba(57,255,20,0.15)'
  if(best==='present') return 'border-color:rgba(255,170,0,0.5);color:#ffaa00;background:rgba(255,170,0,0.15)'
  if(best==='absent') return 'border-color:rgba(100,100,150,0.2);color:#444466;background:rgba(50,50,80,0.1)'
  return 'border-color:rgba(255,255,255,0.15);color:#c8c8e0;background:rgba(255,255,255,0.03)'
}

const _wordleKeydown = (e: KeyboardEvent) => {
  if(gameOver.value) return
  if(e.key==='Enter') submit()
  else if(e.key==='Backspace') del()
  else if(/^[A-Za-z]$/.test(e.key)) type(e.key.toUpperCase())
}
onMounted(()=>{ newGame(); window.addEventListener('keydown', _wordleKeydown) })
onUnmounted(()=>{ window.removeEventListener('keydown', _wordleKeydown) })
</script>
