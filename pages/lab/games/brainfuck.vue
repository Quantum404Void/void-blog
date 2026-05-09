<template>
  <div class="min-h-screen bg-[var(--color-void)] text-[var(--color-text-primary)] font-mono">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'brainfuck' }]" />

    <div class="max-w-7xl mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold text-[var(--color-neon-cyan)] mb-2">Brainfuck Interpreter</h1>
      <p class="text-[var(--color-text-muted)] mb-6 text-sm">A complete Brainfuck interpreter with memory tape visualization</p>

      <!-- Examples -->
      <div class="flex gap-2 mb-4 flex-wrap">
        <span class="text-[var(--color-text-muted)] text-sm self-center">Examples:</span>
        <button
          v-for="ex in examples"
          :key="ex.name"
          @click="loadExample(ex)"
          class="px-3 py-1 text-xs border border-[var(--color-void-border)] text-[var(--color-neon-cyan)] hover:bg-[var(--color-void-card)] rounded transition-colors"
        >
          {{ ex.name }}
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <!-- Code Editor -->
        <div>
          <label class="block text-sm text-[var(--color-text-muted)] mb-2">Code</label>
          <textarea
            v-model="code"
            class="w-full h-64 bg-[var(--color-void-card)] border border-[var(--color-void-border)] text-[var(--color-neon-green)] p-3 rounded text-sm resize-none outline-none focus:border-[var(--color-neon-cyan)] font-mono"
            placeholder="Enter Brainfuck code..."
            spellcheck="false"
          />
          <div class="mt-2">
            <label class="block text-sm text-[var(--color-text-muted)] mb-1">Input (for , command)</label>
            <input
              v-model="inputStr"
              class="w-full bg-[var(--color-void-card)] border border-[var(--color-void-border)] text-[var(--color-text-primary)] p-2 rounded text-sm outline-none focus:border-[var(--color-neon-cyan)]"
              placeholder="Input characters..."
            />
          </div>
        </div>

        <!-- Output -->
        <div>
          <label class="block text-sm text-[var(--color-text-muted)] mb-2">Output</label>
          <div class="w-full h-48 bg-[var(--color-void-card)] border border-[var(--color-void-border)] p-3 rounded text-sm overflow-auto whitespace-pre-wrap break-all">
            <span v-if="output" class="text-[var(--color-neon-green)]">{{ output }}</span>
            <span v-else class="text-[var(--color-text-muted)]">Output will appear here...</span>
          </div>
          <div v-if="error" class="mt-2 text-red-400 text-xs">{{ error }}</div>

          <!-- Stats -->
          <div class="mt-3 flex gap-4 text-xs text-[var(--color-text-muted)]">
            <span>Steps: <span class="text-[var(--color-neon-cyan)]">{{ steps }}</span></span>
            <span>IP: <span class="text-[var(--color-neon-cyan)]">{{ ip }}</span></span>
            <span>Pointer: <span class="text-[var(--color-neon-cyan)]">{{ pointer }}</span></span>
            <span>Status: <span :class="statusColor">{{ status }}</span></span>
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div class="flex gap-3 mb-6">
        <button @click="run" :disabled="running" class="px-4 py-2 bg-[var(--color-neon-cyan)] text-black font-bold rounded hover:opacity-80 disabled:opacity-40 text-sm transition-opacity">
          ▶ Run
        </button>
        <button @click="step" :disabled="running || finished" class="px-4 py-2 border border-[var(--color-neon-cyan)] text-[var(--color-neon-cyan)] rounded hover:bg-[var(--color-void-card)] disabled:opacity-40 text-sm transition-colors">
          Step
        </button>
        <button @click="reset" class="px-4 py-2 border border-[var(--color-void-border)] text-[var(--color-text-muted)] rounded hover:bg-[var(--color-void-card)] text-sm transition-colors">
          Reset
        </button>
      </div>

      <!-- Memory Tape -->
      <div>
        <label class="block text-sm text-[var(--color-text-muted)] mb-2">Memory Tape (first 30 cells)</label>
        <div class="flex flex-wrap gap-1">
          <div
            v-for="(cell, i) in tape.slice(0, 30)"
            :key="i"
            class="flex flex-col items-center"
          >
            <div
              class="w-10 h-10 flex items-center justify-center text-xs border rounded transition-all"
              :class="i === pointer
                ? 'border-[var(--color-neon-cyan)] bg-[var(--color-neon-cyan)] text-black font-bold shadow-[0_0_8px_var(--color-neon-cyan)]'
                : cell !== 0
                  ? 'border-[var(--color-neon-green)] text-[var(--color-neon-green)]'
                  : 'border-[var(--color-void-border)] text-[var(--color-text-muted)]'"
            >
              {{ cell }}
            </div>
            <div class="text-[9px] text-[var(--color-text-muted)] mt-0.5">{{ i }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `Brainfuck | ${siteName}` })
const MAX_STEPS = 100000
const TAPE_SIZE = 30000

const code = ref('')
const inputStr = ref('')
const output = ref('')
const error = ref('')
const steps = ref(0)
const ip = ref(0)
const pointer = ref(0)
const status = ref('idle')
const running = ref(false)
const finished = ref(false)

const tape = ref<number[]>(Array(TAPE_SIZE).fill(0))

const statusColor = computed(() => {
  if (status.value === 'done') return 'text-[var(--color-neon-green)]'
  if (status.value === 'error') return 'text-red-400'
  if (status.value === 'running') return 'text-[var(--color-neon-cyan)]'
  return 'text-[var(--color-text-muted)]'
})

const examples = [
  {
    name: 'Hello World',
    code: '++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.>++.',
    input: ''
  },
  {
    name: 'Cat (echo)',
    code: ',[.,]',
    input: 'Hello!'
  },
  {
    name: 'Add 2+3',
    code: '++>+++<[->+<]>.',
    input: ''
  }
]

function loadExample(ex: typeof examples[0]) {
  code.value = ex.code
  inputStr.value = ex.input
  reset()
}

// Interpreter state for step-by-step
let _tape: number[] = []
let _pointer = 0
let _ip = 0
let _inputIdx = 0
let _steps = 0
let _output = ''
let _code = ''
let _input = ''
let _bracketMap: Map<number, number> = new Map()

function buildBracketMap(src: string): Map<number, number> {
  const map = new Map<number, number>()
  const stack: number[] = []
  for (let i = 0; i < src.length; i++) {
    if (src[i] === '[') stack.push(i)
    else if (src[i] === ']') {
      if (stack.length === 0) throw new Error(`Unmatched ] at position ${i}`)
      const open = stack.pop()!
      map.set(open, i)
      map.set(i, open)
    }
  }
  if (stack.length > 0) throw new Error(`Unmatched [ at position ${stack[0]}`)
  return map
}

function initInterpreter() {
  _code = code.value
  _input = inputStr.value
  _tape = Array(TAPE_SIZE).fill(0)
  _pointer = 0
  _ip = 0
  _inputIdx = 0
  _steps = 0
  _output = ''
  try {
    _bracketMap = buildBracketMap(_code)
  } catch (e: any) {
    error.value = e.message
    status.value = 'error'
    return false
  }
  return true
}

function syncState() {
  tape.value = [..._tape]
  pointer.value = _pointer
  ip.value = _ip
  steps.value = _steps
  output.value = _output
}

function stepOnce(): boolean {
  if (_ip >= _code.length) return false
  const cmd = _code[_ip]
  switch (cmd) {
    case '>': _pointer = Math.min(_pointer + 1, TAPE_SIZE - 1); break
    case '<': _pointer = Math.max(_pointer - 1, 0); break
    case '+': _tape[_pointer] = (_tape[_pointer] + 1) & 0xff; break
    case '-': _tape[_pointer] = (_tape[_pointer] - 1 + 256) & 0xff; break
    case '.': _output += String.fromCharCode(_tape[_pointer]); break
    case ',':
      _tape[_pointer] = _inputIdx < _input.length ? _input.charCodeAt(_inputIdx++) : 0
      break
    case '[':
      if (_tape[_pointer] === 0) _ip = _bracketMap.get(_ip)!
      break
    case ']':
      if (_tape[_pointer] !== 0) _ip = _bracketMap.get(_ip)!
      break
  }
  _ip++
  _steps++
  return true
}

function run() {
  reset()
  if (!initInterpreter()) return
  running.value = true
  status.value = 'running'
  error.value = ''

  try {
    while (_ip < _code.length) {
      if (_steps >= MAX_STEPS) {
        error.value = `Execution limit reached (${MAX_STEPS} steps). Possible infinite loop.`
        status.value = 'error'
        syncState()
        running.value = false
        return
      }
      stepOnce()
    }
    status.value = 'done'
    finished.value = true
  } catch (e: any) {
    error.value = e.message
    status.value = 'error'
  }
  syncState()
  running.value = false
}

function step() {
  if (finished.value) return
  if (steps.value === 0 && _code === '') {
    if (!initInterpreter()) return
    error.value = ''
    status.value = 'running'
  }
  if (_steps >= MAX_STEPS) {
    error.value = `Execution limit reached (${MAX_STEPS} steps).`
    status.value = 'error'
    return
  }
  const cont = stepOnce()
  if (!cont || _ip >= _code.length) {
    status.value = 'done'
    finished.value = true
  }
  syncState()
}

function reset() {
  _tape = Array(TAPE_SIZE).fill(0)
  _pointer = 0
  _ip = 0
  _inputIdx = 0
  _steps = 0
  _output = ''
  _code = ''
  tape.value = Array(TAPE_SIZE).fill(0)
  pointer.value = 0
  ip.value = 0
  steps.value = 0
  output.value = ''
  error.value = ''
  status.value = 'idle'
  running.value = false
  finished.value = false
}
</script>
