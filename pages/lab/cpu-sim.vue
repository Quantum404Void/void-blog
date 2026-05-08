<template>
  <div class="cpu-page">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'cpu-sim' }]" />
    <div class="cpu-container">
      <h1 class="title">8-bit CPU <span class="dim">Simulator</span></h1>

      <div class="cpu-layout">
        <!-- Left: Code editor -->
        <div class="panel code-panel">
          <div class="panel-header">
            <span>Code</span>
            <select v-model="selectedPreset" class="preset-select" @change="loadPreset">
              <option value="">— presets —</option>
              <option v-for="p in presets" :key="p.name" :value="p.name">{{ p.name }}</option>
            </select>
          </div>
          <div class="code-editor-wrap">
            <div class="line-nums">
              <div
                v-for="(_, i) in codeLines"
                :key="i"
                class="line-num"
                :class="{ active: i === pc }"
              >{{ i + 1 }}</div>
            </div>
            <textarea
              v-model="code"
              class="code-area"
              spellcheck="false"
              @input="onCodeChange"
            />
          </div>
          <div class="controls">
            <button class="btn step" @click="step" :disabled="halted">Step</button>
            <button class="btn run"  @click="toggleRun" :disabled="halted">{{ running ? 'Pause' : 'Run' }}</button>
            <button class="btn reset" @click="reset">Reset</button>
          </div>
          <div class="error-bar" v-if="errorMsg">⚠ {{ errorMsg }}</div>
        </div>

        <!-- Middle: Registers -->
        <div class="panel reg-panel">
          <div class="panel-header">Registers</div>
          <div class="reg-list">
            <div v-for="(val, i) in regs" :key="i" class="reg-row" :class="{ changed: changedRegs.has(i) }">
              <span class="reg-name">R{{ i }}</span>
              <span class="reg-dec">{{ val }}</span>
              <span class="reg-hex">0x{{ val.toString(16).padStart(2,'0').toUpperCase() }}</span>
              <span class="reg-bin">{{ val.toString(2).padStart(8,'0') }}</span>
            </div>
          </div>
          <div class="flag-row">
            <span class="flag-label">ZF</span>
            <span class="flag-val" :class="{ on: flags.Z }">{{ flags.Z ? '1' : '0' }}</span>
          </div>
          <div class="pc-row">PC: {{ pc }}</div>
        </div>

        <!-- Right: Output -->
        <div class="panel out-panel">
          <div class="panel-header">Output</div>
          <div class="out-log" ref="outLogEl">
            <div v-for="(line, i) in output" :key="i" class="out-line">{{ line }}</div>
            <div v-if="halted" class="out-line halt">— HALT —</div>
          </div>
        </div>
      </div>

      <!-- Memory view -->
      <div class="mem-panel">
        <div class="panel-header">Memory (bytes 0–31)</div>
        <div class="mem-grid">
          <div v-for="(b, i) in mem.slice(0,32)" :key="i" class="mem-cell">
            <span class="mem-addr">{{ i.toString(16).padStart(2,'0') }}</span>
            <span class="mem-val">{{ b.toString(16).padStart(2,'0').toUpperCase() }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, onUnmounted } from 'vue'

useSeoMeta({ title: 'CPU Simulator — Lab' })

// ── CPU State ────────────────────────────────────────────────────────────────
const NUM_REGS = 8
const MEM_SIZE = 256

const regs = ref<number[]>(new Array(NUM_REGS).fill(0))
const flags = reactive({ Z: false })
const mem = ref<number[]>(new Array(MEM_SIZE).fill(0))
const pc = ref(0)
const output = ref<string[]>([])
const halted = ref(false)
const errorMsg = ref('')
const running = ref(false)
const changedRegs = ref<Set<number>>(new Set())
const outLogEl = ref<HTMLElement | null>(null)

// ── Code ─────────────────────────────────────────────────────────────────────
const code = ref(`; Fibonacci sequence
MOV R0, 0
MOV R1, 1
MOV R2, 10
PRINT R0
PRINT R1
MOV R3, 0
ADD R3, R0
ADD R3, R1
MOV R0, R1
MOV R1, R3
PRINT R3
SUB R2, R1
; simplified loop via JMP
`)

const selectedPreset = ref('')

const presets = [
  {
    name: 'Fibonacci',
    code: `; Fibonacci - first 8 terms
MOV R0, 0
MOV R1, 1
MOV R7, 6
PRINT R0
PRINT R1
MOV R2, 0
ADD R2, R0
ADD R2, R1
MOV R0, R1
MOV R1, R2
PRINT R2
SUB R7, R1
JZ 14
JMP 5
HLT`
  },
  {
    name: 'Accumulate',
    code: `; Sum 1..5 = 15
MOV R0, 0
MOV R1, 1
MOV R2, 5
ADD R0, R1
ADD R1, R1
SUB R2, R1
JZ 8
JMP 3
PRINT R0
HLT`
  },
  {
    name: 'Countdown',
    code: `; Countdown from 8
MOV R0, 8
PRINT R0
SUB R0, R0
JZ 6
MOV R1, 1
SUB R0, R1
PRINT R0
JZ 9
JMP 1
PRINT R0
HLT`
  }
]

function loadPreset() {
  const p = presets.find(x => x.name === selectedPreset.value)
  if (p) { code.value = p.code; reset() }
}

// ── Parser ────────────────────────────────────────────────────────────────────
const codeLines = computed(() =>
  code.value.split('\n').map(l => l.replace(/;.*$/, '').trim()).filter((_, i) => i >= 0)
)

type Instr =
  | { op: 'MOV', rx: number, imm: number }
  | { op: 'ADD' | 'SUB' | 'AND' | 'OR', rx: number, ry: number }
  | { op: 'JMP' | 'JZ', addr: number }
  | { op: 'PRINT', rx: number }
  | { op: 'HLT' }
  | { op: 'NOP' }

function parseProgram(): { instrs: Instr[], lineMap: number[] } {
  const lines = codeLines.value
  const instrs: Instr[] = []
  const lineMap: number[] = []

  for (let i = 0; i < lines.length; i++) {
    const raw = code.value.split('\n')[i].replace(/;.*$/, '').trim()
    if (!raw) { instrs.push({ op: 'NOP' }); lineMap.push(i); continue }
    const parts = raw.split(/[\s,]+/)
    const op = parts[0].toUpperCase()
    try {
      if (op === 'MOV') {
        instrs.push({ op: 'MOV', rx: parseInt(parts[1].slice(1)), imm: parseInt(parts[2]) })
      } else if (['ADD','SUB','AND','OR'].includes(op)) {
        instrs.push({ op: op as any, rx: parseInt(parts[1].slice(1)), ry: parseInt(parts[2].slice(1)) })
      } else if (op === 'JMP') {
        instrs.push({ op: 'JMP', addr: parseInt(parts[1]) })
      } else if (op === 'JZ') {
        instrs.push({ op: 'JZ', addr: parseInt(parts[1]) })
      } else if (op === 'PRINT') {
        instrs.push({ op: 'PRINT', rx: parseInt(parts[1].slice(1)) })
      } else if (op === 'HLT') {
        instrs.push({ op: 'HLT' })
      } else {
        instrs.push({ op: 'NOP' })
      }
      lineMap.push(i)
    } catch {
      instrs.push({ op: 'NOP' }); lineMap.push(i)
    }
  }
  return { instrs, lineMap }
}

let program: Instr[] = []
let lineMap: number[] = []

function compile() {
  const r = parseProgram()
  program = r.instrs
  lineMap = r.lineMap
}

function onCodeChange() {
  reset()
}

// ── Execution ─────────────────────────────────────────────────────────────────
function clamp8(v: number) { return ((v % 256) + 256) % 256 }

function execStep() {
  if (halted.value) return
  if (pc.value >= program.length) { halted.value = true; return }

  const instr = program[pc.value]
  const changed = new Set<number>()

  const r = regs.value
  switch (instr.op) {
    case 'MOV': r[instr.rx] = clamp8(instr.imm); changed.add(instr.rx); pc.value++; break
    case 'ADD': {
      const v = clamp8(r[instr.rx] + r[instr.ry])
      r[instr.rx] = v; changed.add(instr.rx)
      flags.Z = v === 0; pc.value++; break
    }
    case 'SUB': {
      const v = clamp8(r[instr.rx] - r[instr.ry])
      r[instr.rx] = v; changed.add(instr.rx)
      flags.Z = v === 0; pc.value++; break
    }
    case 'AND': {
      const v = r[instr.rx] & r[instr.ry]
      r[instr.rx] = v; changed.add(instr.rx)
      flags.Z = v === 0; pc.value++; break
    }
    case 'OR': {
      const v = r[instr.rx] | r[instr.ry]
      r[instr.rx] = v; changed.add(instr.rx)
      flags.Z = v === 0; pc.value++; break
    }
    case 'JMP': pc.value = instr.addr; break
    case 'JZ': pc.value = flags.Z ? instr.addr : pc.value + 1; break
    case 'PRINT': {
      output.value.push(`R${instr.rx} = ${r[instr.rx]}`)
      nextTick(() => { if (outLogEl.value) outLogEl.value.scrollTop = 9999 })
      pc.value++; break
    }
    case 'HLT': halted.value = true; running.value = false; break
    case 'NOP': pc.value++; break
  }
  // sync mem with regs (first 8 bytes)
  for (let i = 0; i < NUM_REGS; i++) mem.value[i] = r[i]
  changedRegs.value = changed
}

function step() {
  if (!program.length) compile()
  execStep()
}

let runTimer: ReturnType<typeof setInterval> | null = null

function toggleRun() {
  if (running.value) {
    running.value = false
    if (runTimer) clearInterval(runTimer)
    return
  }
  if (!program.length) compile()
  running.value = true
  runTimer = setInterval(() => {
    if (halted.value) { running.value = false; clearInterval(runTimer!); return }
    execStep()
  }, 120)
}

function reset() {
  if (runTimer) clearInterval(runTimer)
  running.value = false
  halted.value = false
  pc.value = 0
  regs.value = new Array(NUM_REGS).fill(0)
  flags.Z = false
  mem.value = new Array(MEM_SIZE).fill(0)
  output.value = []
  errorMsg.value = ''
  changedRegs.value = new Set()
  compile()
}

onUnmounted(() => { if (runTimer) clearInterval(runTimer) })

// init
compile()
</script>

<style scoped>
.cpu-page {
  min-height: 100vh;
  background: #0a0a0f;
  color: #e0e0ff;
  font-family: 'JetBrains Mono', monospace, sans-serif;
}
.cpu-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 20px 16px 40px;
}
.title {
  font-size: 1.6rem;
  font-weight: 700;
  color: #00d4ff;
  margin-bottom: 20px;
  letter-spacing: 0.05em;
}
.title .dim { color: rgba(0,212,255,0.4); font-weight: 400; }

.cpu-layout {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.panel {
  background: #0d0d1a;
  border: 1px solid rgba(0,212,255,0.15);
  border-radius: 10px;
  overflow: hidden;
}
.panel-header {
  background: rgba(0,212,255,0.07);
  border-bottom: 1px solid rgba(0,212,255,0.15);
  padding: 6px 12px;
  font-size: 0.78rem;
  color: #00d4ff;
  letter-spacing: 0.08em;
  display: flex;
  align-items: center;
  gap: 10px;
}
.preset-select {
  background: #111122;
  border: 1px solid rgba(0,212,255,0.2);
  color: rgba(0,212,255,0.7);
  font-family: inherit;
  font-size: 0.75rem;
  padding: 2px 6px;
  border-radius: 4px;
  cursor: pointer;
  margin-left: auto;
}

/* Code panel */
.code-panel { display: flex; flex-direction: column; }
.code-editor-wrap {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-height: 320px;
}
.line-nums {
  padding: 8px 6px;
  background: #090912;
  border-right: 1px solid rgba(0,212,255,0.08);
  min-width: 32px;
  overflow: hidden;
}
.line-num {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.2);
  text-align: right;
  line-height: 1.6;
  height: 1.6em;
  padding-right: 4px;
}
.line-num.active {
  color: #b400ff;
  background: rgba(180,0,255,0.15);
  border-radius: 2px;
}
.code-area {
  flex: 1;
  background: transparent;
  border: none;
  color: #c8d0f8;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  line-height: 1.6;
  padding: 8px;
  resize: none;
  outline: none;
  width: 100%;
}
.controls {
  display: flex;
  gap: 8px;
  padding: 8px 10px;
  border-top: 1px solid rgba(0,212,255,0.1);
}
.btn {
  padding: 5px 14px;
  border-radius: 6px;
  border: 1px solid;
  font-family: inherit;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.15s;
}
.btn:disabled { opacity: 0.3; cursor: not-allowed; }
.btn.step  { background: rgba(0,255,136,0.08); border-color: #00ff88; color: #00ff88; }
.btn.run   { background: rgba(0,212,255,0.08); border-color: #00d4ff; color: #00d4ff; }
.btn.reset { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.2); color: rgba(255,255,255,0.5); }
.btn:hover:not(:disabled) { filter: brightness(1.25); }
.error-bar { color: #ff4444; font-size: 0.78rem; padding: 4px 10px; background: rgba(255,0,0,0.07); }

/* Register panel */
.reg-panel { padding: 0; min-width: 220px; }
.reg-list { padding: 8px 10px; }
.reg-row {
  display: grid;
  grid-template-columns: 28px 36px 52px auto;
  gap: 6px;
  align-items: center;
  font-size: 0.78rem;
  padding: 2px 4px;
  border-radius: 4px;
  transition: background 0.2s;
}
.reg-row.changed { background: rgba(0,255,136,0.1); }
.reg-name { color: #00d4ff; }
.reg-dec  { color: #e0e0ff; text-align: right; }
.reg-hex  { color: rgba(180,0,255,0.8); }
.reg-bin  { color: rgba(0,212,255,0.4); font-size: 0.7rem; }
.flag-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 14px;
  border-top: 1px solid rgba(0,212,255,0.1);
  font-size: 0.8rem;
}
.flag-label { color: rgba(255,255,255,0.4); }
.flag-val { color: rgba(255,255,255,0.3); font-weight: bold; }
.flag-val.on { color: #00ff88; }
.pc-row { padding: 4px 14px 8px; font-size: 0.78rem; color: rgba(0,212,255,0.6); }

/* Output panel */
.out-panel { display: flex; flex-direction: column; }
.out-log {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px;
  min-height: 200px;
  max-height: 360px;
}
.out-line {
  font-size: 0.85rem;
  color: #00ff88;
  line-height: 1.8;
}
.out-line.halt { color: rgba(255,255,255,0.3); font-style: italic; }

/* Memory */
.mem-panel {
  background: #0d0d1a;
  border: 1px solid rgba(0,212,255,0.15);
  border-radius: 10px;
  overflow: hidden;
}
.mem-grid {
  display: grid;
  grid-template-columns: repeat(16, 1fr);
  gap: 2px;
  padding: 10px;
}
.mem-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(0,212,255,0.1);
  border-radius: 4px;
  padding: 4px 2px;
}
.mem-addr { font-size: 0.6rem; color: rgba(0,212,255,0.4); }
.mem-val  { font-size: 0.72rem; color: #c8d0f8; }

@media (max-width: 700px) {
  .cpu-layout { grid-template-columns: 1fr; }
  .mem-grid { grid-template-columns: repeat(8, 1fr); }
}
</style>
