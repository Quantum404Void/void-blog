<template>
  <div class="min-h-screen bg-[var(--color-void)] text-[var(--color-text-primary)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'regex-nfa' }]" />

    <div class="max-w-7xl mx-auto px-4 py-8">
      <h1 class="font-mono text-2xl text-[var(--color-neon-cyan)] mb-2">正则引擎 NFA 可视化</h1>
      <p class="text-[var(--color-text-muted)] font-mono text-sm mb-6">Thompson 构造法 · 子集构造模拟</p>

      <!-- Controls -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div class="lg:col-span-2 space-y-3">
          <div>
            <label class="font-mono text-xs text-[var(--color-text-muted)] block mb-1">正则表达式</label>
            <input
              v-model="pattern"
              @input="buildNFA"
              class="w-full font-mono bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded px-3 py-2 text-[var(--color-neon-cyan)] focus:outline-none focus:border-[var(--color-neon-cyan)]"
              placeholder="e.g. a(b|c)*d"
            />
          </div>
          <div>
            <label class="font-mono text-xs text-[var(--color-text-muted)] block mb-1">测试字符串</label>
            <div class="flex gap-2">
              <input
                v-model="testStr"
                class="flex-1 font-mono bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded px-3 py-2 focus:outline-none focus:border-[var(--color-neon-cyan)]"
                placeholder="输入要匹配的字符串"
              />
              <button @click="startMatch" class="px-4 py-2 font-mono text-sm bg-[var(--color-neon-cyan)] text-black rounded hover:opacity-80 transition-opacity">匹配</button>
            </div>
          </div>
        </div>
        <div>
          <label class="font-mono text-xs text-[var(--color-text-muted)] block mb-1">内置示例</label>
          <div class="grid grid-cols-2 gap-1">
            <button v-for="ex in examples" :key="ex.label" @click="loadExample(ex)"
              class="font-mono text-xs px-2 py-1.5 bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded hover:border-[var(--color-neon-cyan)] transition-colors text-left">
              {{ ex.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- Main area -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- NFA SVG -->
        <div class="lg:col-span-2 bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg p-4">
          <div class="font-mono text-xs text-[var(--color-text-muted)] mb-2">NFA 状态图</div>
          <div v-if="nfaError" class="text-red-400 font-mono text-sm">{{ nfaError }}</div>
          <svg v-else ref="svgRef" :width="svgWidth" :height="svgHeight" class="w-full" :viewBox="`0 0 ${svgWidth} ${svgHeight}`">
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#00d4ff" opacity="0.7" />
              </marker>
              <marker id="arrow-active" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#00d4ff" />
              </marker>
            </defs>

            <!-- Transitions -->
            <g v-for="(t, i) in renderedTransitions" :key="i">
              <path
                :d="t.path"
                :stroke="t.isEpsilon ? '#4a5568' : (activeTransitions.has(t.key) ? '#00d4ff' : '#2d3748')"
                :stroke-width="activeTransitions.has(t.key) ? 2 : 1"
                :stroke-dasharray="t.isEpsilon ? '4,4' : 'none'"
                fill="none"
                :marker-end="activeTransitions.has(t.key) ? 'url(#arrow-active)' : 'url(#arrow)'"
              />
              <text
                :x="t.labelX" :y="t.labelY"
                font-family="monospace" font-size="10"
                :fill="t.isEpsilon ? '#4a5568' : '#a0aec0'"
                text-anchor="middle"
              >{{ t.label }}</text>
            </g>

            <!-- States -->
            <g v-for="s in renderedStates" :key="s.id" @click="() => {}">
              <!-- Double circle for start -->
              <circle v-if="s.isStart" :cx="s.x" :cy="s.y" :r="s.r + 5"
                stroke="#39ff14" stroke-width="1.5" fill="none" />
              <!-- Accept state bold ring -->
              <circle v-if="s.isAccept" :cx="s.x" :cy="s.y" :r="s.r - 4"
                :stroke="activeStates.has(s.id) ? '#00d4ff' : '#39ff14'" stroke-width="2" fill="none" />
              <!-- Main circle -->
              <circle :cx="s.x" :cy="s.y" :r="s.r"
                :fill="activeStates.has(s.id) ? 'rgba(0,212,255,0.2)' : 'rgba(0,0,0,0.3)'"
                :stroke="activeStates.has(s.id) ? '#00d4ff' : (s.isStart ? '#39ff14' : '#2d3748')"
                :stroke-width="activeStates.has(s.id) ? 2 : 1"
              />
              <text :x="s.x" :y="s.y + 4" font-family="monospace" font-size="11"
                :fill="activeStates.has(s.id) ? '#00d4ff' : '#718096'"
                text-anchor="middle">{{ s.id }}</text>
            </g>
          </svg>
        </div>

        <!-- Right panel -->
        <div class="space-y-4">
          <!-- Match result -->
          <div class="bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg p-4">
            <div class="font-mono text-xs text-[var(--color-text-muted)] mb-2">匹配结果</div>
            <div v-if="matchResult !== null" class="space-y-2">
              <div :class="matchResult ? 'text-[var(--color-neon-green)]' : 'text-red-400'" class="font-mono text-lg font-bold">
                {{ matchResult ? '✓ 匹配' : '✗ 不匹配' }}
              </div>
              <div class="font-mono text-xs text-[var(--color-text-muted)]">
                步骤数：{{ matchSteps }}
              </div>
              <div class="font-mono text-xs text-[var(--color-text-muted)]">
                当前字符：<span class="text-[var(--color-neon-cyan)]">{{ currentChar || '—' }}</span>
              </div>
            </div>
            <div v-else class="font-mono text-xs text-[var(--color-text-muted)]">点击「匹配」开始</div>
          </div>

          <!-- ε-closure info -->
          <div class="bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg p-4">
            <div class="font-mono text-xs text-[var(--color-text-muted)] mb-2">ε-closure 过程</div>
            <div class="space-y-1 max-h-48 overflow-y-auto">
              <div v-for="(log, i) in closureLogs" :key="i"
                class="font-mono text-xs text-[var(--color-text-muted)] leading-relaxed">
                <span class="text-[var(--color-neon-cyan)]">{{ log.step }}.</span> {{ log.msg }}
              </div>
              <div v-if="!closureLogs.length" class="font-mono text-xs text-[var(--color-text-muted)]">—</div>
            </div>
          </div>

          <!-- Active states -->
          <div class="bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg p-4">
            <div class="font-mono text-xs text-[var(--color-text-muted)] mb-2">活跃状态集</div>
            <div class="flex flex-wrap gap-1">
              <span v-for="s in [...activeStates].sort((a,b)=>a-b)" :key="s"
                class="font-mono text-xs px-2 py-0.5 rounded bg-[rgba(0,212,255,0.15)] border border-[var(--color-neon-cyan)] text-[var(--color-neon-cyan)]">
                q{{ s }}
              </span>
              <span v-if="!activeStates.size" class="font-mono text-xs text-[var(--color-text-muted)]">—</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `Regex NFA | ${siteName}` })
// ─── Types ───────────────────────────────────────────────────────────────────
interface NFAState {
  id: number
  isAccept: boolean
}
interface NFATransition {
  from: number
  to: number
  label: string // '' for ε
}
interface NFA {
  start: number
  accept: number
  states: NFAState[]
  transitions: NFATransition[]
}
interface Example { label: string; pattern: string; test: string }

// ─── State ───────────────────────────────────────────────────────────────────
const pattern = ref('a(b|c)*')
const testStr = ref('abcbc')
const nfaError = ref('')
const matchResult = ref<boolean | null>(null)
const matchSteps = ref(0)
const currentChar = ref('')
const activeStates = ref<Set<number>>(new Set())
const activeTransitions = ref<Set<string>>(new Set())
const closureLogs = ref<{ step: number; msg: string }[]>([])

const svgWidth = 700
const svgHeight = 340

const examples: Example[] = [
  { label: '邮箱', pattern: '[a-z]+@[a-z]+\\.[a-z]+', test: 'user@example.com' },
  { label: 'URL', pattern: 'https?://[a-z.]+', test: 'https://void.dev' },
  { label: 'IP', pattern: '[0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+', test: '192.168.1.1' },
  { label: '日期', pattern: '[0-9]{4}-[0-9]{2}-[0-9]{2}', test: '2026-05-10' },
  { label: 'a(b|c)*', pattern: 'a(b|c)*', test: 'abcbc' },
  { label: '(ab)+', pattern: '(ab)+', test: 'ababab' },
  { label: 'a.b', pattern: 'a.b', test: 'axb' },
  { label: 'a?b', pattern: 'a?b', test: 'b' },
]

// ─── NFA Builder (Thompson Construction, simplified) ─────────────────────────
let stateCount = 0
function newState(): NFAState { return { id: stateCount++, isAccept: false } }

function buildFromChar(ch: string): NFA {
  const s = newState(); const a = newState(); a.isAccept = true
  return { start: s.id, accept: a.id, states: [s, a], transitions: [{ from: s.id, to: a.id, label: ch }] }
}
function concatNFA(n1: NFA, n2: NFA): NFA {
  n1.states.find(s => s.id === n1.accept)!.isAccept = false
  return {
    start: n1.start, accept: n2.accept,
    states: [...n1.states, ...n2.states],
    transitions: [...n1.transitions, ...n2.transitions, { from: n1.accept, to: n2.start, label: '' }]
  }
}
function unionNFA(n1: NFA, n2: NFA): NFA {
  const s = newState(); const a = newState(); a.isAccept = true
  n1.states.find(x => x.id === n1.accept)!.isAccept = false
  n2.states.find(x => x.id === n2.accept)!.isAccept = false
  return {
    start: s.id, accept: a.id,
    states: [s, ...n1.states, ...n2.states, a],
    transitions: [
      ...n1.transitions, ...n2.transitions,
      { from: s.id, to: n1.start, label: '' }, { from: s.id, to: n2.start, label: '' },
      { from: n1.accept, to: a.id, label: '' }, { from: n2.accept, to: a.id, label: '' }
    ]
  }
}
function starNFA(n: NFA): NFA {
  const s = newState(); const a = newState(); a.isAccept = true
  n.states.find(x => x.id === n.accept)!.isAccept = false
  return {
    start: s.id, accept: a.id,
    states: [s, ...n.states, a],
    transitions: [
      ...n.transitions,
      { from: s.id, to: n.start, label: '' }, { from: s.id, to: a.id, label: '' },
      { from: n.accept, to: n.start, label: '' }, { from: n.accept, to: a.id, label: '' }
    ]
  }
}
function plusNFA(n: NFA): NFA { return concatNFA(n, starNFA(cloneNFA(n))) }
function cloneNFA(n: NFA): NFA {
  const offset = stateCount
  const states = n.states.map(s => { stateCount++; return { id: s.id + offset, isAccept: s.isAccept } })
  const transitions = n.transitions.map(t => ({ from: t.from + offset, to: t.to + offset, label: t.label }))
  return { start: n.start + offset, accept: n.accept + offset, states, transitions }
}
function optionalNFA(n: NFA): NFA {
  const s = newState(); const a = newState(); a.isAccept = true
  n.states.find(x => x.id === n.accept)!.isAccept = false
  return {
    start: s.id, accept: a.id,
    states: [s, ...n.states, a],
    transitions: [...n.transitions,
      { from: s.id, to: n.start, label: '' }, { from: s.id, to: a.id, label: '' },
      { from: n.accept, to: a.id, label: '' }]
  }
}

// Simple regex parser supporting: . * + ? | () and char classes basics
function parseRegex(src: string): NFA {
  let pos = 0
  function peek() { return src[pos] }
  function consume() { return src[pos++] }

  function parseExpr(): NFA {
    let left = parseTerm()
    while (pos < src.length && peek() === '|') {
      consume()
      left = unionNFA(left, parseTerm())
    }
    return left
  }
  function parseTerm(): NFA {
    const parts: NFA[] = []
    while (pos < src.length && peek() !== ')' && peek() !== '|') {
      parts.push(parseFactor())
    }
    if (parts.length === 0) return buildFromChar('')
    return parts.reduce((a, b) => concatNFA(a, b))
  }
  function parseFactor(): NFA {
    let base = parseAtom()
    if (pos < src.length) {
      if (peek() === '*') { consume(); return starNFA(base) }
      if (peek() === '+') { consume(); return plusNFA(base) }
      if (peek() === '?') { consume(); return optionalNFA(base) }
    }
    return base
  }
  function parseAtom(): NFA {
    if (peek() === '(') {
      consume()
      const inner = parseExpr()
      if (peek() === ')') consume()
      return inner
    }
    if (peek() === '[') {
      // simplified: treat [abc] as (a|b|c)
      consume()
      const chars: string[] = []
      let negate = false
      if (peek() === '^') { consume(); negate = true }
      while (pos < src.length && peek() !== ']') {
        const c = consume()
        if (peek() === '-' && pos + 1 < src.length && src[pos+1] !== ']') {
          consume() // -
          const end = consume()
          for (let cc = c.charCodeAt(0); cc <= end.charCodeAt(0); cc++) chars.push(String.fromCharCode(cc))
        } else chars.push(c)
      }
      if (peek() === ']') consume()
      const label = negate ? '.' : (chars.slice(0, 4).join('|') + (chars.length > 4 ? '…' : ''))
      return buildFromChar(label)
    }
    if (peek() === '\\') { consume(); return buildFromChar(consume()) }
    const c = consume()
    return buildFromChar(c)
  }

  return parseExpr()
}

// NFA simulation
let currentNFA: NFA | null = null

function epsilonClosure(states: Set<number>, nfa: NFA, logs?: { step: number; msg: string }[]): Set<number> {
  const closure = new Set(states)
  const stack = [...states]
  let step = 1
  while (stack.length) {
    const s = stack.pop()!
    for (const t of nfa.transitions) {
      if (t.from === s && t.label === '' && !closure.has(t.to)) {
        closure.add(t.to)
        stack.push(t.to)
        if (logs) logs.push({ step: step++, msg: `q${s} --ε--> q${t.to}` })
      }
    }
  }
  return closure
}

function move(states: Set<number>, ch: string, nfa: NFA): Set<number> {
  const result = new Set<number>()
  for (const t of nfa.transitions) {
    if (states.has(t.from) && (t.label === ch || t.label === '.'))
      result.add(t.to)
  }
  return result
}

// ─── Rendering ───────────────────────────────────────────────────────────────
interface RenderedState { id: number; x: number; y: number; r: number; isStart: boolean; isAccept: boolean }
interface RenderedTransition { path: string; labelX: number; labelY: number; label: string; isEpsilon: boolean; key: string }

const renderedStates = ref<RenderedState[]>([])
const renderedTransitions = ref<RenderedTransition[]>([])

function layoutNFA(nfa: NFA) {
  const states = nfa.states
  const n = states.length
  const r = 18
  const positions: Record<number, { x: number; y: number }> = {}

  // BFS layering
  const layers: number[][] = []
  const visited = new Set<number>()
  const queue = [nfa.start]
  visited.add(nfa.start)
  while (queue.length) {
    const layer: number[] = []
    const next: number[] = []
    for (const id of queue) {
      layer.push(id)
      for (const t of nfa.transitions) {
        if (t.from === id && !visited.has(t.to)) {
          visited.add(t.to)
          next.push(t.to)
        }
      }
    }
    layers.push(layer)
    queue.length = 0
    queue.push(...next)
  }
  // Add unvisited
  const unvisited = states.map(s => s.id).filter(id => !visited.has(id))
  if (unvisited.length) layers.push(unvisited)

  const paddingX = 60
  const paddingY = 50
  const layerW = Math.min(120, (svgWidth - paddingX * 2) / Math.max(layers.length - 1, 1))
  layers.forEach((layer, li) => {
    const x = paddingX + li * layerW
    const totalH = svgHeight - paddingY * 2
    layer.forEach((id, i) => {
      const y = paddingY + (layer.length === 1 ? totalH / 2 : (i / (layer.length - 1)) * totalH)
      positions[id] = { x, y }
    })
  })

  renderedStates.value = states.map(s => ({
    id: s.id, r,
    x: positions[s.id]?.x ?? 50,
    y: positions[s.id]?.y ?? svgHeight / 2,
    isStart: s.id === nfa.start,
    isAccept: s.isAccept
  }))

  const transitionGroups: Record<string, NFATransition[]> = {}
  for (const t of nfa.transitions) {
    const key = `${Math.min(t.from, t.to)}-${Math.max(t.from, t.to)}`
    if (!transitionGroups[key]) transitionGroups[key] = []
    transitionGroups[key].push(t)
  }

  const rendered: RenderedTransition[] = []
  for (const t of nfa.transitions) {
    const from = positions[t.from]; const to = positions[t.to]
    if (!from || !to) continue
    let path: string; let labelX: number; let labelY: number

    if (t.from === t.to) {
      // self-loop
      const lx = from.x; const ly = from.y - r - 20
      path = `M ${lx - 10} ${from.y - r} C ${lx - 20} ${ly - 20} ${lx + 20} ${ly - 20} ${lx + 10} ${from.y - r}`
      labelX = lx; labelY = ly - 22
    } else {
      const dx = to.x - from.x; const dy = to.y - from.y
      const dist = Math.sqrt(dx*dx + dy*dy)
      const ux = dx / dist; const uy = dy / dist
      const key = `${Math.min(t.from, t.to)}-${Math.max(t.from, t.to)}`
      const group = transitionGroups[key]
      const bend = group.length > 1 ? 25 : 0
      const mx = (from.x + to.x) / 2 - uy * bend
      const my = (from.y + to.y) / 2 + ux * bend
      const sx = from.x + ux * r; const sy = from.y + uy * r
      const ex = to.x - ux * (r + 8); const ey = to.y - uy * (r + 8)
      path = `M ${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}`
      labelX = mx; labelY = my - 6
    }

    rendered.push({
      path, labelX, labelY,
      label: t.label === '' ? 'ε' : t.label,
      isEpsilon: t.label === '',
      key: `${t.from}-${t.to}-${t.label}`
    })
  }
  renderedTransitions.value = rendered
}

function buildNFA() {
  nfaError.value = ''
  matchResult.value = null
  activeStates.value = new Set()
  closureLogs.value = []
  stateCount = 0
  try {
    const p = pattern.value.replace(/\{[0-9]+\}/g, '') // simplify quantifiers
    if (!p) return
    currentNFA = parseRegex(p)
    layoutNFA(currentNFA)
    const logs: { step: number; msg: string }[] = []
    const init = epsilonClosure(new Set([currentNFA.start]), currentNFA, logs)
    closureLogs.value = logs.slice(0, 20)
    activeStates.value = init
  } catch (e: any) {
    nfaError.value = '解析错误: ' + e.message
    currentNFA = null
  }
}

async function startMatch() {
  if (!currentNFA) return
  const nfa = currentNFA
  const str = testStr.value
  matchSteps.value = 0
  matchResult.value = null
  activeTransitions.value = new Set()
  closureLogs.value = []

  const logs: { step: number; msg: string }[] = []
  let current = epsilonClosure(new Set([nfa.start]), nfa, logs)
  activeStates.value = new Set(current)
  closureLogs.value = [...logs]

  for (let i = 0; i < str.length; i++) {
    const ch = str[i]
    currentChar.value = ch
    matchSteps.value++
    await new Promise(r => setTimeout(r, 300))

    const moved = move(current, ch, nfa)
    const stepLogs: { step: number; msg: string }[] = []
    current = epsilonClosure(moved, nfa, stepLogs)

    // highlight transitions
    const activeTrans = new Set<string>()
    for (const t of nfa.transitions) {
      if (current.has(t.from) || current.has(t.to)) activeTrans.add(`${t.from}-${t.to}-${t.label}`)
    }
    activeTransitions.value = activeTrans

    closureLogs.value = [
      { step: 1, msg: `读入 '${ch}'` },
      ...stepLogs.map((l, j) => ({ step: j + 2, msg: l.msg }))
    ]
    activeStates.value = new Set(current)
  }
  currentChar.value = ''
  matchResult.value = [...current].some(id => nfa.states.find(s => s.id === id)?.isAccept)
  setTimeout(() => { activeTransitions.value = new Set() }, 500)
}

function loadExample(ex: Example) {
  pattern.value = ex.pattern
  testStr.value = ex.test
  buildNFA()
}

onMounted(() => buildNFA())
</script>
