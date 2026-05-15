<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'tools', href: '/lab' }, { label: 'lorem-ipsum' }]" />
    <div class="max-w-3xl mx-auto px-6 py-10">
      <h1 class="font-mono text-xl font-bold text-[var(--color-neon-green)] mb-1">📝 Lorem Ipsum 生成器</h1>
      <p class="font-mono text-xs text-[var(--color-text-muted)] mb-6">生成占位文本，多种风格可选</p>

      <!-- Controls -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div class="flex flex-col gap-1">
          <label class="font-mono text-[10px] text-[var(--color-text-muted)]">风格</label>
          <select v-model="mode" class="font-mono text-xs px-2 py-2 rounded-lg border bg-[var(--color-void-card)] text-[var(--color-text-primary)] outline-none" style="border-color:rgba(57,255,20,0.3)">
            <option value="lorem">经典拉丁文</option>
            <option value="zh">中文乱数假文</option>
            <option value="code">代码风</option>
            <option value="cyber">赛博朋克</option>
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <label class="font-mono text-[10px] text-[var(--color-text-muted)]">单位</label>
          <select v-model="unit" class="font-mono text-xs px-2 py-2 rounded-lg border bg-[var(--color-void-card)] text-[var(--color-text-primary)] outline-none" style="border-color:rgba(57,255,20,0.3)">
            <option value="paragraphs">段落</option>
            <option value="sentences">句子</option>
            <option value="words">单词</option>
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <label class="font-mono text-[10px] text-[var(--color-text-muted)]">数量 ({{ count }})</label>
          <input type="range" min="1" max="20" v-model.number="count" class="mt-2 accent-[var(--color-neon-green)]" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="font-mono text-[10px] text-[var(--color-text-muted)]">格式</label>
          <select v-model="format" class="font-mono text-xs px-2 py-2 rounded-lg border bg-[var(--color-void-card)] text-[var(--color-text-primary)] outline-none" style="border-color:rgba(57,255,20,0.3)">
            <option value="plain">纯文本</option>
            <option value="html">HTML &lt;p&gt;</option>
            <option value="md">Markdown</option>
          </select>
        </div>
      </div>

      <button @click="generate" class="font-mono text-xs px-5 py-2 rounded-lg border transition-all hover:translate-y-[-1px] mb-5" style="border-color:rgba(57,255,20,0.5);color:#39ff14;background:rgba(57,255,20,0.08)">
        ⚡ 生成
      </button>

      <!-- Output -->
      <div v-if="output" class="rounded-xl border border-[var(--color-void-border)] bg-[var(--color-void-card)] overflow-hidden">
        <div class="px-4 py-2 border-b border-[var(--color-void-border)] flex items-center justify-between font-mono text-[10px] text-[var(--color-text-muted)]">
          <span>{{ wordCount }} 字符 · {{ charCount }} 个字</span>
          <button @click="copyOutput" class="text-[var(--color-neon-green)] hover:opacity-80 transition-opacity">{{ copied ? '✓ 已复制' : '复制' }}</button>
        </div>
        <pre class="p-4 font-mono text-xs text-[var(--color-text-primary)] whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">{{ output }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `Lorem Ipsum 生成器 | ${siteName}` })

const mode = ref('lorem')
const unit = ref('paragraphs')
const count = ref(3)
const format = ref('plain')
const output = ref('')
const copied = ref(false)

const loremWords = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum'.split(' ')

const zhWords = '的一了是我不人在他有这个上们来到时大地为子中你说生国年着就那和要她出也得里后自以会家可下而过天去能对小多然于心学么之都好看起发当没成只如事把还用第样道想作种开美总从无情己面最女但现前些所同日手又行意动方期它头经长儿回位分爱老因很给名法间斯知世什两次使身者被高已亲其进此话常与活正感见明问力理尔点文几定本公特做外孩相西果走将月十实向声车全信重三机工物气每并别真打太新比才便夫再书部水像眼等体却加电主界们'.split('')

const codeWords = ['const','let','var','function','async','await','return','export','import','default','class','interface','type','enum','extends','implements','new','this','super','if','else','for','while','do','switch','case','break','continue','throw','try','catch','finally','null','undefined','true','false','void','never','any','string','number','boolean','array','object','promise','resolve','reject','callback','handler','service','controller','module','component','props','state','effect','ref','computed','watch','emit','inject','provide','router','store','dispatch','commit','getters','actions','mutations']

const cyberWords = ['neural','matrix','cipher','ghost','neon','grid','void','flux','data','stream','node','pulse','sync','core','hack','trace','drone','relay','proxy','nexus','byte','bit','zero','binary','quantum','nano','bio','cyber','net','web','cloud','dark','edge','shadow','signal','wave','code','script','protocol','daemon','kernel','shell','root','zero-day','exploit','payload','vector','entropy','entropy','epoch','latency','bandwidth','firewall','intrusion','decrypt','encode','hash','token','key','salt','entropy','forge','mirror','clone','breach','phantom']

function rnd<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)] }

function makeWords(n: number): string {
  if (mode.value === 'lorem') return Array.from({length: n}, () => rnd(loremWords)).join(' ')
  if (mode.value === 'zh') return Array.from({length: n}, () => rnd(zhWords)).join('')
  if (mode.value === 'code') return Array.from({length: n}, () => rnd(codeWords)).join(' ')
  return Array.from({length: n}, () => rnd(cyberWords)).join(' ')
}

function makeSentence(): string {
  const len = 8 + Math.floor(Math.random() * 10)
  const words = makeWords(len)
  const isZh = mode.value === 'zh'
  return words.charAt(0).toUpperCase() + words.slice(1) + (isZh ? '。' : '.')
}

function makeParagraph(first: boolean): string {
  const sentences = 4 + Math.floor(Math.random() * 4)
  const parts = Array.from({length: sentences}, (_, i) => {
    if (i === 0 && first && mode.value === 'lorem') return 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
    return makeSentence()
  })
  return parts.join(' ')
}

function generate() {
  let parts: string[] = []
  if (unit.value === 'words') {
    parts = [makeWords(count.value)]
  } else if (unit.value === 'sentences') {
    parts = Array.from({length: count.value}, (_, i) => makeSentence())
  } else {
    parts = Array.from({length: count.value}, (_, i) => makeParagraph(i === 0))
  }

  if (format.value === 'html') {
    output.value = parts.map(p => `<p>${p}</p>`).join('\n')
  } else if (format.value === 'md') {
    output.value = parts.join('\n\n')
  } else {
    output.value = parts.join('\n\n')
  }
}

const wordCount = computed(() => output.value.length)
const charCount = computed(() => output.value.split(/\s+/).filter(Boolean).length)

async function copyOutput() {
  await navigator.clipboard.writeText(output.value)
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}

generate()
</script>
