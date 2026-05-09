<template>
  <div class="min-h-screen bg-[var(--color-void)] text-[var(--color-text-primary)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'x86-playground' }]" />

    <div class="max-w-7xl mx-auto px-4 py-8">
      <h1 class="font-mono text-2xl text-[var(--color-neon-cyan)] mb-2">x86 Assembly Playground</h1>
      <p class="font-mono text-sm text-[var(--color-text-muted)] mb-6">模拟执行 x86 汇编 · 单步调试 · 寄存器/栈/内存可视化</p>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <!-- Left: Editor -->
        <div class="flex flex-col gap-4">
          <!-- Toolbar -->
          <div class="flex flex-wrap gap-2 items-center">
            <button @click="run" :disabled="running"
              class="font-mono text-sm px-4 py-2 rounded border border-[var(--color-neon-green)] text-[var(--color-neon-green)] hover:bg-[var(--color-neon-green)] hover:text-black transition-colors disabled:opacity-40">
              ▶ 运行
            </button>
            <button @click="step" :disabled="running || pc >= parsedLines.length"
              class="font-mono text-sm px-4 py-2 rounded border border-[var(--color-neon-cyan)] text-[var(--color-neon-cyan)] hover:bg-[var(--color-neon-cyan)] hover:text-black transition-colors disabled:opacity-40">
              ⏭ 单步
            </button>
            <button @click="reset"
              class="font-mono text-sm px-4 py-2 rounded border border-[var(--color-void-border)] text-[var(--color-text-muted)] hover:border-red-400 hover:text-red-400 transition-colors">
              ↺ 重置
            </button>
            <select v-model="selectedExample" @change="loadExample"
              class="font-mono text-sm bg-[var(--color-void-card)] border border-[var(--color-void-border)] text-[var(--color-text-muted)] px-3 py-2 rounded">
              <option value="">内置示例...</option>
              <option value="hello">Hello World</option>
              <option value="fibonacci">斐波那契</option>
              <option value="bubble">冒泡排序</option>
              <option value="factorial">阶乘（递归）</option>
            </select>
          </div>

          <!-- Editor -->
          <div class="relative">
            <div class="absolute left-0 top-0 bottom-0 w-10 bg-[#0d0d1a] border-r border-[var(--color-void-border)] rounded-l-lg overflow-hidden pointer-events-none z-10">
              <div v-for="(_, i) in codeLines" :key="i"
                :class="['font-mono text-xs text-right pr-2 leading-6', i === pc ? 'text-[var(--color-neon-cyan)]' : 'text-[var(--color-text-muted)]']"
                style="padding-top: 2px;">
                {{ i + 1 }}
              </div>
            </div>
            <textarea
              v-model="code"
              @input="onCodeChange"
              spellcheck="false"
              class="font-mono text-sm w-full bg-[var(--color-void-card)] border border-[var(--color-void-border)] text-[var(--color-text-primary)] rounded-lg pl-12 pr-4 py-2 resize-none outline-none focus:border-[var(--color-neon-cyan)] transition-colors"
              style="min-height: 360px; line-height: 1.5rem; tab-size: 4;"
            ></textarea>
          </div>

          <!-- Error -->
          <div v-if="errorMsg" class="font-mono text-xs text-red-400 bg-red-950 border border-red-800 rounded p-3">
            ⚠ {{ errorMsg }}
          </div>

          <!-- Console -->
          <div class="bg-[#0a0a14] border border-[var(--color-void-border)] rounded-lg p-3">
            <div class="font-mono text-xs text-[var(--color-text-muted)] mb-2">控制台输出</div>
            <div class="font-mono text-sm text-[var(--color-neon-green)] whitespace-pre-wrap min-h-16 max-h-40 overflow-y-auto">{{ consoleOutput || '(无输出)' }}</div>
          </div>
        </div>

        <!-- Right: Registers / Flags / Stack / Memory -->
        <div class="flex flex-col gap-4">
          <!-- Registers -->
          <div class="bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg p-4">
            <div class="font-mono text-xs text-[var(--color-text-muted)] mb-3">通用寄存器</div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div v-for="reg in GP_REGS" :key="reg"
                :class="['rounded p-2 border transition-all duration-300', changedRegs.has(reg) ? 'border-[var(--color-neon-cyan)] shadow-[0_0_8px_var(--color-neon-cyan)]' : 'border-[var(--color-void-border)]']">
                <div class="font-mono text-xs text-[var(--color-text-muted)]">{{ reg }}</div>
                <div :class="['font-mono text-sm transition-colors', changedRegs.has(reg) ? 'text-[var(--color-neon-cyan)]' : 'text-[var(--color-text-primary)]']">
                  {{ toHex(regs[reg]) }}
                </div>
                <div class="font-mono text-xs text-[var(--color-text-muted)]">{{ regs[reg] }}</div>
              </div>
            </div>
          </div>

          <!-- Flags -->
          <div class="bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg p-4">
            <div class="font-mono text-xs text-[var(--color-text-muted)] mb-3">标志寄存器 EFLAGS</div>
            <div class="flex gap-4">
              <div v-for="flag in ['ZF','CF','SF','OF']" :key="flag"
                :class="['font-mono text-sm px-3 py-1 rounded border', flags[flag] ? 'border-[var(--color-neon-green)] text-[var(--color-neon-green)] bg-green-950' : 'border-[var(--color-void-border)] text-[var(--color-text-muted)]']">
                {{ flag }}={{ flags[flag] ? '1' : '0' }}
              </div>
            </div>
          </div>

          <!-- Stack -->
          <div class="bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg p-4">
            <div class="font-mono text-xs text-[var(--color-text-muted)] mb-3">栈 (ESP={{ toHex(regs.ESP) }})</div>
            <div class="flex flex-col gap-1">
              <div v-for="(slot, i) in stackSlots" :key="i"
                :class="['flex items-center gap-2 font-mono text-xs rounded px-2 py-1 transition-all duration-300',
                  slot.isTop ? 'border border-[var(--color-neon-cyan)] bg-[#001a1f]' : 'border border-[var(--color-void-border)]',
                  slot.changed ? 'text-[var(--color-neon-cyan)]' : 'text-[var(--color-text-muted)]']">
                <span class="w-20 text-right">{{ toHex(STACK_BASE - i * 4) }}</span>
                <span class="w-4">{{ slot.isTop ? '←ESP' : '' }}</span>
                <span>{{ toHex(slot.value) }}</span>
              </div>
            </div>
          </div>

          <!-- Memory view -->
          <div class="bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg p-4">
            <div class="font-mono text-xs text-[var(--color-text-muted)] mb-3">内存视图 (数据段)</div>
            <div class="overflow-x-auto">
              <table class="font-mono text-xs w-full">
                <thead>
                  <tr class="text-[var(--color-text-muted)]">
                    <th class="text-left pr-3">addr</th>
                    <th v-for="col in 8" :key="col" class="text-center px-1">+{{ (col-1).toString(16).padStart(2,'0') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in 8" :key="row">
                    <td class="pr-3 text-[var(--color-text-muted)]">{{ toHex(DATA_BASE + (row-1)*8) }}</td>
                    <td v-for="col in 8" :key="col"
                      :class="['text-center px-1 rounded transition-all duration-300',
                        memChanged.has(DATA_BASE + (row-1)*8 + (col-1)) ? 'text-[var(--color-neon-cyan)] bg-[#001a1f]' : 'text-[var(--color-text-muted)]']">
                      {{ toHex8(memory[DATA_BASE + (row-1)*8 + (col-1)] ?? 0) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `x86 Playground | ${siteName}` })
const GP_REGS = ['EAX','EBX','ECX','EDX','ESP','EBP','ESI','EDI'] as const
type GpReg = typeof GP_REGS[number]

const STACK_BASE = 0x7fff0000
const STACK_SIZE = 16
const DATA_BASE = 0x10000000

function makeRegs(): Record<string, number> {
  return { EAX:0, EBX:0, ECX:0, EDX:0, ESP: STACK_BASE, EBP: STACK_BASE, ESI:0, EDI:0 }
}
function makeFlags() {
  return { ZF: false, CF: false, SF: false, OF: false }
}

const code = ref('')
const selectedExample = ref('')
const pc = ref(0)
const running = ref(false)
const errorMsg = ref('')
const consoleOutput = ref('')
const regs = ref<Record<string,number>>(makeRegs())
const flags = ref(makeFlags())
const memory = ref<Record<number,number>>({})
const stack = ref<number[]>(Array(STACK_SIZE).fill(0))
const changedRegs = ref<Set<string>>(new Set())
const memChanged = ref<Set<number>>(new Set())

const EXAMPLES: Record<string, string> = {
hello: `; Hello World via INT 0x80
MOV EAX, 4       ; sys_write
MOV EBX, 1       ; stdout
MOV ECX, 0x1000  ; buffer addr (simulated)
MOV EDX, 13      ; length
INT 0x80
MOV EAX, 1       ; sys_exit
MOV EBX, 0
INT 0x80`,

fibonacci: `; 斐波那契: F(8) in EAX
MOV ECX, 8       ; n
MOV EAX, 0       ; F(0)
MOV EBX, 1       ; F(1)
DEC ECX
fib_loop:
CMP ECX, 0
JE fib_done
MOV EDX, EAX
ADD EDX, EBX
MOV EAX, EBX
MOV EBX, EDX
DEC ECX
JMP fib_loop
fib_done:
MOV EAX, EBX`,

bubble: `; 冒泡排序 (模拟3元素)
MOV EAX, 30
MOV EBX, 10
MOV ECX, 20
; 第1趟
CMP EAX, EBX
JLE skip1
PUSH EAX
MOV EAX, EBX
POP EBX
skip1:
CMP EBX, ECX
JLE skip2
PUSH EBX
MOV EBX, ECX
POP ECX
skip2:
; 第2趟
CMP EAX, EBX
JLE skip3
PUSH EAX
MOV EAX, EBX
POP EBX
skip3:`,

factorial: `; 阶乘 5! = 120 → EAX
; 迭代实现
MOV ECX, 5
MOV EAX, 1
fact_loop:
CMP ECX, 0
JE fact_done
MUL ECX
DEC ECX
JMP fact_loop
fact_done:`,
}

function loadExample() {
  if (selectedExample.value && EXAMPLES[selectedExample.value]) {
    code.value = EXAMPLES[selectedExample.value]
    reset()
  }
}

// ---- Parser ----
interface Instr {
  op: string
  args: string[]
  label?: string
  lineNo: number
  raw: string
}

const codeLines = computed(() => code.value.split('\n'))

const parsedLines = computed((): Instr[] => {
  const lines = codeLines.value
  const result: Instr[] = []
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const stripped = raw.replace(/;.*$/, '').trim()
    if (!stripped) continue
    // Label line
    if (stripped.endsWith(':')) {
      // pure label, no instruction
      result.push({ op: 'LABEL', args: [], label: stripped.slice(0,-1).trim(), lineNo: i, raw })
      continue
    }
    // Label + instruction
    const labelMatch = stripped.match(/^(\w+):\s*(.+)$/)
    let instrStr = stripped
    let label: string | undefined
    if (labelMatch) {
      label = labelMatch[1]
      instrStr = labelMatch[2]
    }
    const parts = instrStr.split(/[\s,]+/).filter(Boolean)
    const op = parts[0].toUpperCase()
    const args = parts.slice(1)
    result.push({ op, args, label, lineNo: i, raw })
  }
  return result
})

// Build label→index map
const labelMap = computed(() => {
  const m: Record<string, number> = {}
  parsedLines.value.forEach((instr, i) => {
    if (instr.label) m[instr.label] = i
  })
  return m
})

// ---- Execution ----
function toHex(n: number) {
  const u = n >>> 0
  return '0x' + u.toString(16).toUpperCase().padStart(8, '0')
}
function toHex8(n: number) {
  return (n & 0xff).toString(16).toUpperCase().padStart(2, '0')
}

function resolveOperand(arg: string, r: Record<string,number>, m: Record<number,number>): number {
  if (!arg) return 0
  arg = arg.trim()
  // Memory: [EBX+4] or [EBX]
  const memMatch = arg.match(/^\[(\w+)([+-]\d+)?\]$/)
  if (memMatch) {
    const base = r[memMatch[1].toUpperCase()] ?? 0
    const offset = memMatch[2] ? parseInt(memMatch[2]) : 0
    const addr = (base + offset) >>> 0
    return m[addr] ?? 0
  }
  // Register
  if (GP_REGS.includes(arg.toUpperCase() as GpReg)) {
    return r[arg.toUpperCase()] ?? 0
  }
  // Hex immediate
  if (arg.startsWith('0x') || arg.startsWith('0X')) return parseInt(arg, 16)
  // Decimal
  if (/^-?\d+$/.test(arg)) return parseInt(arg)
  return 0
}

function setOperand(arg: string, val: number, r: Record<string,number>, m: Record<number,number>, changed: Set<string>, memCh: Set<number>) {
  arg = arg.trim()
  // Memory
  const memMatch = arg.match(/^\[(\w+)([+-]\d+)?\]$/)
  if (memMatch) {
    const base = r[memMatch[1].toUpperCase()] ?? 0
    const offset = memMatch[2] ? parseInt(memMatch[2]) : 0
    const addr = (base + offset) >>> 0
    m[addr] = val >>> 0
    memCh.add(addr)
    return
  }
  const upper = arg.toUpperCase()
  if (GP_REGS.includes(upper as GpReg)) {
    r[upper] = val >>> 0
    changed.add(upper)
  }
}

function updateFlags(result: number, r: Record<string,number>, f: Record<string,boolean>, a?: number, b?: number) {
  const s = result | 0
  f.ZF = (result >>> 0) === 0
  f.SF = s < 0
  // Overflow: for ADD
  if (a !== undefined && b !== undefined) {
    const sa = a | 0, sb = b | 0, sr = result | 0
    f.OF = ((sa > 0 && sb > 0 && sr < 0) || (sa < 0 && sb < 0 && sr >= 0))
    f.CF = (a >>> 0) + (b >>> 0) > 0xFFFFFFFF
  }
}

function execInstr(instr: Instr, r: Record<string,number>, f: Record<string,boolean>, m: Record<number,number>, st: number[], changed: Set<string>, memCh: Set<number>): { nextPc?: number; halt?: boolean; output?: string; error?: string } {
  const { op, args } = instr
  if (op === 'LABEL') return {}

  const a0 = args[0] || ''
  const a1 = args[1] || ''

  switch (op) {
    case 'MOV': {
      const val = resolveOperand(a1, r, m)
      setOperand(a0, val, r, m, changed, memCh)
      return {}
    }
    case 'ADD': {
      const lhs = resolveOperand(a0, r, m)
      const rhs = resolveOperand(a1, r, m)
      const res = (lhs + rhs) >>> 0
      setOperand(a0, res, r, m, changed, memCh)
      updateFlags(res, r, f, lhs, rhs)
      return {}
    }
    case 'SUB': {
      const lhs = resolveOperand(a0, r, m)
      const rhs = resolveOperand(a1, r, m)
      const res = (lhs - rhs) >>> 0
      setOperand(a0, res, r, m, changed, memCh)
      updateFlags(res, r, f)
      f.CF = lhs < rhs
      return {}
    }
    case 'MUL': {
      const rhs = resolveOperand(a0, r, m)
      const res = Math.imul(r.EAX, rhs) >>> 0
      r.EAX = res
      changed.add('EAX')
      return {}
    }
    case 'DIV': {
      const divisor = resolveOperand(a0, r, m)
      if (divisor === 0) return { error: '除零错误' }
      r.EAX = Math.floor(r.EAX / divisor) >>> 0
      r.EDX = r.EAX % divisor
      changed.add('EAX'); changed.add('EDX')
      return {}
    }
    case 'INC': {
      const v = (resolveOperand(a0, r, m) + 1) >>> 0
      setOperand(a0, v, r, m, changed, memCh)
      updateFlags(v, r, f)
      return {}
    }
    case 'DEC': {
      const v = (resolveOperand(a0, r, m) - 1) >>> 0
      setOperand(a0, v, r, m, changed, memCh)
      updateFlags(v, r, f)
      return {}
    }
    case 'AND': {
      const res = (resolveOperand(a0, r, m) & resolveOperand(a1, r, m)) >>> 0
      setOperand(a0, res, r, m, changed, memCh)
      updateFlags(res, r, f)
      return {}
    }
    case 'OR': {
      const res = (resolveOperand(a0, r, m) | resolveOperand(a1, r, m)) >>> 0
      setOperand(a0, res, r, m, changed, memCh)
      updateFlags(res, r, f)
      return {}
    }
    case 'XOR': {
      const res = (resolveOperand(a0, r, m) ^ resolveOperand(a1, r, m)) >>> 0
      setOperand(a0, res, r, m, changed, memCh)
      updateFlags(res, r, f)
      f.CF = false; f.OF = false
      return {}
    }
    case 'NOT': {
      const res = (~resolveOperand(a0, r, m)) >>> 0
      setOperand(a0, res, r, m, changed, memCh)
      return {}
    }
    case 'CMP': {
      const lhs = resolveOperand(a0, r, m)
      const rhs = resolveOperand(a1, r, m)
      const res = (lhs - rhs) >>> 0
      updateFlags(res, r, f)
      f.CF = lhs < rhs
      return {}
    }
    case 'PUSH': {
      const val = resolveOperand(a0, r, m)
      r.ESP = (r.ESP - 4) >>> 0
      changed.add('ESP')
      const idx = (STACK_BASE - r.ESP) / 4
      if (idx >= 0 && idx < STACK_SIZE) st[idx] = val
      else return { error: '栈溢出' }
      return {}
    }
    case 'POP': {
      const idx = (STACK_BASE - r.ESP) / 4
      const val = (idx >= 0 && idx < STACK_SIZE) ? st[idx] : 0
      setOperand(a0, val, r, m, changed, memCh)
      r.ESP = (r.ESP + 4) >>> 0
      changed.add('ESP')
      return {}
    }
    case 'JMP': return { nextPc: labelMap.value[a0] ?? pc.value + 1 }
    case 'JE':  return { nextPc: f.ZF ? (labelMap.value[a0] ?? pc.value + 1) : undefined }
    case 'JNE': return { nextPc: !f.ZF ? (labelMap.value[a0] ?? pc.value + 1) : undefined }
    case 'JG':  return { nextPc: (!f.ZF && f.SF === f.OF) ? (labelMap.value[a0] ?? pc.value + 1) : undefined }
    case 'JL':  return { nextPc: (f.SF !== f.OF) ? (labelMap.value[a0] ?? pc.value + 1) : undefined }
    case 'JGE': return { nextPc: (f.SF === f.OF) ? (labelMap.value[a0] ?? pc.value + 1) : undefined }
    case 'JLE': return { nextPc: (f.ZF || f.SF !== f.OF) ? (labelMap.value[a0] ?? pc.value + 1) : undefined }
    case 'CALL': {
      // push next pc, jump to label
      r.ESP = (r.ESP - 4) >>> 0
      changed.add('ESP')
      const retIdx = (STACK_BASE - r.ESP) / 4
      if (retIdx >= 0 && retIdx < STACK_SIZE) st[retIdx] = pc.value + 1
      const target = labelMap.value[a0]
      if (target === undefined) return { error: `未知标签: ${a0}` }
      return { nextPc: target }
    }
    case 'RET': {
      const idx = (STACK_BASE - r.ESP) / 4
      const retAddr = (idx >= 0 && idx < STACK_SIZE) ? st[idx] : -1
      r.ESP = (r.ESP + 4) >>> 0
      changed.add('ESP')
      if (retAddr < 0 || retAddr >= parsedLines.value.length) return { halt: true }
      return { nextPc: retAddr }
    }
    case 'INT': {
      const vec = resolveOperand(a0, r, m)
      if (vec === 0x80) {
        const syscall = r.EAX
        if (syscall === 4) {
          // sys_write - output simulated string
          return { output: `[stdout] Hello, World!\n` }
        }
        if (syscall === 1) {
          return { halt: true, output: `[exit] code=${r.EBX}\n` }
        }
        return { output: `[INT 0x80] syscall=${syscall}\n` }
      }
      return {}
    }
    case 'NOP': return {}
    default:
      return { error: `未知指令: ${op}` }
  }
}

function step() {
  if (pc.value >= parsedLines.value.length) return
  changedRegs.value = new Set()
  memChanged.value = new Set()
  errorMsg.value = ''

  const instr = parsedLines.value[pc.value]
  const r = regs.value
  const f = flags.value
  const m = memory.value
  const st = stack.value

  const result = execInstr(instr, r, f, m, st, changedRegs.value, memChanged.value)

  if (result.output) consoleOutput.value += result.output
  if (result.error) {
    errorMsg.value = `Line ${instr.lineNo + 1}: ${result.error}`
    running.value = false
    return
  }
  if (result.halt) {
    pc.value = parsedLines.value.length
    running.value = false
    return
  }
  if (result.nextPc !== undefined) {
    pc.value = result.nextPc
  } else {
    pc.value++
  }
}

async function run() {
  if (running.value) return
  reset()
  running.value = true
  let guard = 0
  while (pc.value < parsedLines.value.length && running.value) {
    step()
    if (errorMsg.value) break
    guard++
    if (guard > 10000) { errorMsg.value = '执行超时 (循环超过10000步)'; break }
    await new Promise(r => setTimeout(r, 30))
  }
  running.value = false
}

function reset() {
  pc.value = 0
  regs.value = makeRegs()
  flags.value = makeFlags()
  memory.value = {}
  stack.value = Array(STACK_SIZE).fill(0)
  changedRegs.value = new Set()
  memChanged.value = new Set()
  errorMsg.value = ''
  consoleOutput.value = ''
  running.value = false
}

function onCodeChange() {
  reset()
}

const stackSlots = computed(() => {
  return Array.from({ length: STACK_SIZE }, (_, i) => {
    const addr = STACK_BASE - i * 4
    const isTop = addr === regs.value.ESP
    return { addr, value: stack.value[i] ?? 0, isTop, changed: false }
  })
})

// Load hello by default
onMounted(() => {
  code.value = EXAMPLES.hello
})
</script>
