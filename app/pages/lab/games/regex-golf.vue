<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'games', href: '/lab' }, { label: 'regex-golf' }]" />
    <div class="max-w-3xl mx-auto px-6 py-10">
      <h1 class="font-mono text-xl font-bold mb-1" style="color:rgba(180,0,255,0.9)">Regex Golf</h1>
      <p class="font-mono text-xs text-[var(--color-text-muted)] mb-6">用最短的正则表达式通过关卡 — 越短越好</p>

      <!-- Level selector -->
      <div class="flex flex-wrap gap-2 mb-6">
        <button
          v-for="(lvl, i) in levels"
          :key="i"
          @click="selectLevel(i)"
          class="font-mono text-xs px-3 py-1.5 rounded-lg border transition-all"
          :style="currentLevel === i
            ? 'border-color:rgba(180,0,255,0.6);color:rgba(180,0,255,1);background:rgba(180,0,255,0.15)'
            : cleared[i]
              ? 'border-color:rgba(57,255,20,0.4);color:rgba(57,255,20,0.8);background:rgba(57,255,20,0.05)'
              : 'border-color:rgba(255,255,255,0.1);color:rgba(255,255,255,0.4)'"
        >{{ cleared[i] ? '✓' : '' }}L{{ i+1 }}</button>
      </div>

      <!-- Level info -->
      <div class="border border-[var(--color-void-border)] rounded-xl p-5 bg-[var(--color-void-card)] mb-5">
        <div class="flex items-center justify-between mb-3">
          <span class="font-mono text-sm font-bold text-[var(--color-text-primary)]">Level {{ currentLevel+1 }}: {{ level.name }}</span>
          <span class="font-mono text-xs text-[var(--color-text-muted)]">最优解: <span :style="cleared[currentLevel] ? 'color:rgba(57,255,20,0.9)' : 'color:rgba(255,255,255,0.3)'">{{ cleared[currentLevel] ? level.bestLen + ' 字符' : '?' }}</span></span>
        </div>
        <p class="font-mono text-xs text-[var(--color-text-muted)] mb-4">{{ level.desc }}</p>

        <div class="grid grid-cols-2 gap-4">
          <!-- MATCH column -->
          <div>
            <div class="font-mono text-[10px] uppercase tracking-widest text-[rgba(57,255,20,0.7)] mb-2">MATCH（要匹配）</div>
            <div v-for="(s, i) in level.match" :key="'m'+i" class="flex items-center gap-2 mb-1">
              <span class="text-sm" :style="matchResults[i] === true ? 'color:rgba(57,255,20,1)' : matchResults[i] === false ? 'color:rgba(255,50,50,0.9)' : 'color:rgba(255,255,255,0.3)'">
                {{ matchResults[i] === true ? '✅' : matchResults[i] === false ? '❌' : '⬜' }}
              </span>
              <code class="font-mono text-xs text-[var(--color-text-primary)] bg-[rgba(255,255,255,0.05)] px-2 py-0.5 rounded">{{ s }}</code>
            </div>
          </div>
          <!-- REJECT column -->
          <div>
            <div class="font-mono text-[10px] uppercase tracking-widest text-[rgba(255,80,80,0.7)] mb-2">REJECT（不能匹配）</div>
            <div v-for="(s, i) in level.reject" :key="'r'+i" class="flex items-center gap-2 mb-1">
              <span class="text-sm" :style="rejectResults[i] === true ? 'color:rgba(57,255,20,1)' : rejectResults[i] === false ? 'color:rgba(255,50,50,0.9)' : 'color:rgba(255,255,255,0.3)'">
                {{ rejectResults[i] === true ? '✅' : rejectResults[i] === false ? '❌' : '⬜' }}
              </span>
              <code class="font-mono text-xs text-[var(--color-text-primary)] bg-[rgba(255,255,255,0.05)] px-2 py-0.5 rounded">{{ s }}</code>
            </div>
          </div>
        </div>
      </div>

      <!-- Regex input -->
      <div class="flex gap-3 items-center mb-4">
        <span class="font-mono text-[var(--color-neon-purple)] text-lg select-none">/</span>
        <input
          v-model="userRegex"
          @input="evaluate"
          placeholder="在此输入正则..."
          class="flex-1 font-mono text-sm bg-[var(--color-void-card)] border rounded-lg px-4 py-3 outline-none transition-all text-[var(--color-text-primary)]"
          :style="regexError ? 'border-color:rgba(255,50,50,0.5)' : 'border-color:rgba(180,0,255,0.4)'"
          spellcheck="false"
        >
        <span class="font-mono text-[var(--color-neon-purple)] text-lg select-none">/</span>
        <span class="font-mono text-xs px-3 py-1.5 rounded-lg border" :style="isCleared ? 'border-color:rgba(57,255,20,0.5);color:rgba(57,255,20,1);background:rgba(57,255,20,0.1)' : 'border-color:rgba(255,255,255,0.1);color:rgba(255,255,255,0.4)'">
          {{ userRegex.length }} 字符
        </span>
      </div>
      <div v-if="regexError" class="font-mono text-xs text-[rgba(255,80,80,0.8)] mb-3">⚠ {{ regexError }}</div>

      <!-- Cleared -->
      <div v-if="isCleared" class="border border-[rgba(57,255,20,0.4)] rounded-xl p-4 bg-[rgba(57,255,20,0.05)] text-center">
        <div class="font-mono text-sm text-[rgba(57,255,20,1)] mb-1">🎉 通关！{{ userRegex.length }} 字符</div>
        <div class="font-mono text-xs text-[var(--color-text-muted)]">参考答案: <code class="text-[rgba(0,212,255,0.9)]">{{ level.answer }}</code>（{{ level.bestLen }} 字符）</div>
        <button v-if="currentLevel < levels.length-1" @click="selectLevel(currentLevel+1)" class="mt-3 font-mono text-xs px-4 py-2 rounded-lg border border-[rgba(180,0,255,0.4)] text-[rgba(180,0,255,0.9)] hover:bg-[rgba(180,0,255,0.1)] transition-all">下一关 →</button>
      </div>
    </div>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `Regex Golf | ${siteName}` })

const levels = [
  {
    name: '热身', desc: '匹配包含 "foo" 的字符串，不匹配 "bar"',
    match: ['foo', 'foobar', 'foo123'], reject: ['bar', 'baz', 'hello'],
    answer: 'foo', bestLen: 3
  },
  {
    name: '数字', desc: '匹配纯数字字符串',
    match: ['0', '42', '1234567890'], reject: ['a', '12x', '', ' 1'],
    answer: '^\\d+$', bestLen: 5
  },
  {
    name: 'Email', desc: '匹配合法邮箱格式（简化版）',
    match: ['a@b.com', 'x.y@z.org', 'test@mail.cn'], reject: ['nope', '@bad', 'no@', 'a@b'],
    answer: '^[^@]+@[^@]+\\.[^@]+$', bestLen: 18
  },
  {
    name: 'IPv4', desc: '匹配 IPv4 地址（简化：合法数字格式即可）',
    match: ['1.2.3.4', '192.168.0.1', '255.255.255.255'], reject: ['1.2.3', '1.2.3.4.5', 'a.b.c.d'],
    answer: '^(\\d{1,3}\\.){3}\\d{1,3}$', bestLen: 22
  },
  {
    name: '元音开头', desc: '匹配以元音字母（a/e/i/o/u，大小写）开头的单词',
    match: ['apple', 'Echo', 'ice', 'Orange', 'umbrella'], reject: ['banana', 'cat', 'Dog', 'Zoo'],
    answer: '^[aeiouAEIOU]', bestLen: 13
  },
  {
    name: '回文', desc: '匹配 2-4 字符的回文（如 aa, aba, abba）',
    match: ['aa', 'aba', 'abba', 'bb', 'abcba'.slice(0,4)], reject: ['ab', 'abc', 'abcd', 'abbc'],
    answer: '^(.)\\1$|^(.).\\2$|^(.)(.)(\\4)(\\3)$', bestLen: 36
  },
  {
    name: 'Hex 颜色', desc: '匹配 CSS hex 颜色（#rgb 或 #rrggbb）',
    match: ['#fff', '#000', '#a1b2c3', '#FFF', '#AB12CD'], reject: ['#gg', '#12345', 'fff', '#1234567'],
    answer: '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$', bestLen: 36
  },
  {
    name: 'Base64', desc: '匹配合法 Base64 字符串（带 = 填充）',
    match: ['YQ==', 'YWJj', 'aGVsbG8=', 'dGVzdA=='], reject: ['YQ=', '!!==', 'YQ===', 'a b'],
    answer: '^[A-Za-z0-9+/]+={0,2}$', bestLen: 22
  },
  {
    name: 'URL', desc: '匹配 http/https URL',
    match: ['http://a.com', 'https://x.org/p', 'https://foo.bar?q=1'], reject: ['ftp://x.com', 'http://', 'www.x.com', 'just text'],
    answer: '^https?://\\S+\\.\\S', bestLen: 18
  },
  {
    name: '质数', desc: '输入字符串长度为质数（用重复字符 "x" 测试，如 "xxx" 长度=3 是质数）',
    match: ['xx', 'xxx', 'xxxxx', 'xxxxxxx', 'xxxxxxxxxxx'], reject: ['x', 'xxxx', 'xxxxxx', 'xxxxxxxx', 'xxxxxxxxxx'],
    answer: '^(?!(xx+)\\1+$)xx+$', bestLen: 18
  }
]

const currentLevel = ref(0)
const userRegex = ref('')
const regexError = ref('')
const matchResults = ref<(boolean | null)[]>([])
const rejectResults = ref<(boolean | null)[]>([])
const cleared = ref<boolean[]>(new Array(levels.length).fill(false))

const level = computed(() => levels[currentLevel.value])

const isCleared = computed(() => {
  if (matchResults.value.length === 0) return false
  return matchResults.value.every(r => r === true) && rejectResults.value.every(r => r === true)
})

function selectLevel(i: number) {
  currentLevel.value = i
  userRegex.value = ''
  regexError.value = ''
  matchResults.value = []
  rejectResults.value = []
}

function evaluate() {
  const pat = userRegex.value
  if (!pat) {
    matchResults.value = []
    rejectResults.value = []
    regexError.value = ''
    return
  }
  let re: RegExp
  try {
    re = new RegExp(pat)
    regexError.value = ''
  } catch (e: any) {
    regexError.value = e.message
    matchResults.value = []
    rejectResults.value = []
    return
  }
  matchResults.value = level.value.match.map(s => re.test(s))
  // For reject: "result is true" means "correctly NOT matched"
  rejectResults.value = level.value.reject.map(s => !re.test(s))

  if (isCleared.value) {
    cleared.value[currentLevel.value] = true
  }
}
</script>
