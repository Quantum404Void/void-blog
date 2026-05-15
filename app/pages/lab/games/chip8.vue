<template>
  <div class="min-h-screen bg-black text-[var(--color-text-primary)] font-mono">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'games', href: '/lab' }, { label: 'chip8' }]" />

    <div class="max-w-5xl mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold text-[var(--color-neon-cyan)] mb-2 tracking-widest uppercase">
        CHIP-8 Emulator
      </h1>
      <p class="text-[var(--color-text-muted)] text-sm mb-6">运行真实 CHIP-8 ROM 的模拟器</p>

      <!-- Controls Bar -->
      <div class="flex flex-wrap gap-3 mb-4 items-center">
        <!-- ROM Selector -->
        <select
          v-model="selectedRom"
          @change="loadSelectedRom"
          class="bg-[var(--color-void-card)] border border-[var(--color-void-border)] text-[var(--color-neon-cyan)] px-3 py-1.5 text-sm rounded focus:outline-none focus:border-[var(--color-neon-cyan)]"
        >
          <option value="ibm">IBM Logo</option>
          <option value="pong">Pong</option>
          <option value="test">测试 ROM</option>
        </select>

        <button @click="toggleRunning" class="chip8-btn" :class="running ? 'btn-pause' : 'btn-run'">
          {{ running ? '⏸ 暂停' : '▶ 运行' }}
        </button>
        <button @click="step" :disabled="running" class="chip8-btn btn-step">
          ⏭ 单步
        </button>
        <button @click="reset" class="chip8-btn btn-reset">
          ↺ 重置
        </button>

        <!-- Speed Slider -->
        <div class="flex items-center gap-2 ml-2">
          <span class="text-[var(--color-text-muted)] text-xs">速度:</span>
          <input
            type="range"
            v-model.number="speed"
            min="10"
            max="1000"
            step="10"
            class="w-28 accent-[var(--color-neon-cyan)]"
          />
          <span class="text-[var(--color-neon-cyan)] text-xs w-16">{{ speed }} Hz</span>
        </div>
      </div>

      <!-- Main Layout -->
      <div class="flex flex-col lg:flex-row gap-6">
        <!-- Left: Display + Keyboard -->
        <div class="flex flex-col gap-4">
          <!-- Canvas Display -->
          <div class="relative">
            <canvas
              ref="displayCanvas"
              width="640"
              height="320"
              class="border border-[var(--color-neon-green)] rounded block"
              style="image-rendering: pixelated; box-shadow: 0 0 20px rgba(57,255,20,0.3);"
            ></canvas>
            <!-- CRT Scanlines overlay -->
            <div class="absolute inset-0 pointer-events-none rounded scanlines"></div>
          </div>

          <!-- Keyboard Map -->
          <div class="bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded p-3">
            <div class="text-[var(--color-text-muted)] text-xs mb-2">键盘映射 (CHIP-8 → 键盘)</div>
            <div class="grid grid-cols-4 gap-1.5">
              <div v-for="key in keyboardMap" :key="key.chip8"
                class="key-cell"
                :class="{ 'key-active': pressedKeys.has(key.chip8) }"
              >
                <span class="text-[var(--color-neon-cyan)]">{{ key.chip8.toString(16).toUpperCase() }}</span>
                <span class="text-[var(--color-text-muted)] text-xs">→{{ key.kb }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Debug Panel -->
        <div class="flex-1 min-w-0">
          <button
            @click="showDebug = !showDebug"
            class="flex items-center gap-2 text-[var(--color-text-muted)] text-sm mb-3 hover:text-[var(--color-neon-cyan)] transition-colors"
          >
            <span>{{ showDebug ? '▼' : '▶' }}</span>
            <span>调试面板</span>
          </button>

          <div v-show="showDebug" class="space-y-4">
            <!-- Registers -->
            <div class="bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded p-3">
              <div class="text-[var(--color-neon-cyan)] text-xs mb-2 font-bold">寄存器</div>
              <div class="grid grid-cols-4 gap-1 text-xs">
                <div v-for="(val, i) in cpu.v" :key="i" class="flex justify-between bg-black/30 px-2 py-0.5 rounded">
                  <span class="text-[var(--color-text-muted)]">V{{ i.toString(16).toUpperCase() }}</span>
                  <span class="text-[var(--color-neon-green)]">{{ val.toString(16).toUpperCase().padStart(2,'0') }}</span>
                </div>
              </div>
              <div class="grid grid-cols-3 gap-1 text-xs mt-2">
                <div class="flex justify-between bg-black/30 px-2 py-0.5 rounded">
                  <span class="text-[var(--color-text-muted)]">I</span>
                  <span class="text-[var(--color-neon-cyan)]">{{ cpu.i.toString(16).toUpperCase().padStart(4,'0') }}</span>
                </div>
                <div class="flex justify-between bg-black/30 px-2 py-0.5 rounded">
                  <span class="text-[var(--color-text-muted)]">PC</span>
                  <span class="text-[var(--color-neon-cyan)]">{{ cpu.pc.toString(16).toUpperCase().padStart(4,'0') }}</span>
                </div>
                <div class="flex justify-between bg-black/30 px-2 py-0.5 rounded">
                  <span class="text-[var(--color-text-muted)]">SP</span>
                  <span class="text-[var(--color-neon-cyan)]">{{ cpu.sp.toString(16).toUpperCase().padStart(2,'0') }}</span>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-1 text-xs mt-1">
                <div class="flex justify-between bg-black/30 px-2 py-0.5 rounded">
                  <span class="text-[var(--color-text-muted)]">DT</span>
                  <span class="text-yellow-400">{{ cpu.dt.toString(16).toUpperCase().padStart(2,'0') }}</span>
                </div>
                <div class="flex justify-between bg-black/30 px-2 py-0.5 rounded">
                  <span class="text-[var(--color-text-muted)]">ST</span>
                  <span class="text-yellow-400">{{ cpu.st.toString(16).toUpperCase().padStart(2,'0') }}</span>
                </div>
              </div>
            </div>

            <!-- Current Instruction -->
            <div class="bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded p-3">
              <div class="text-[var(--color-neon-cyan)] text-xs mb-2 font-bold">当前指令</div>
              <div class="text-[var(--color-neon-green)] text-sm font-mono">{{ currentInstruction }}</div>
            </div>

            <!-- Stack -->
            <div class="bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded p-3">
              <div class="text-[var(--color-neon-cyan)] text-xs mb-2 font-bold">栈 (SP={{ cpu.sp }})</div>
              <div class="space-y-0.5">
                <div
                  v-for="(val, i) in cpu.stack.slice(0, cpu.sp)"
                  :key="i"
                  class="flex justify-between text-xs bg-black/30 px-2 py-0.5 rounded"
                >
                  <span class="text-[var(--color-text-muted)]">{{ i }}</span>
                  <span class="text-[var(--color-neon-green)]">{{ val.toString(16).toUpperCase().padStart(4,'0') }}</span>
                </div>
                <div v-if="cpu.sp === 0" class="text-[var(--color-text-muted)] text-xs">(空)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `CHIP-8 | ${siteName}` })
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'

// ─── ROM Data ───────────────────────────────────────────────────────────────

const IBM_LOGO = new Uint8Array([
  0x00, 0xe0, 0xa2, 0x2a, 0x60, 0x0c, 0x61, 0x08, 0xd0, 0x1f, 0x70, 0x09,
  0xa2, 0x39, 0xd0, 0x1f, 0xa2, 0x48, 0x70, 0x08, 0xd0, 0x1f, 0x70, 0x04,
  0xa2, 0x57, 0xd0, 0x1f, 0x70, 0x04, 0xa2, 0x66, 0xd0, 0x1f, 0x70, 0x08,
  0xa2, 0x75, 0xd0, 0x1f, 0x12, 0x28, 0xff, 0x00, 0xff, 0x00, 0x3c, 0x00,
  0x3c, 0x00, 0x3c, 0x00, 0x3c, 0x00, 0xff, 0x00, 0xff, 0xff, 0x00, 0xff,
  0x00, 0x38, 0x00, 0x3f, 0x00, 0x3f, 0x00, 0x38, 0x00, 0xff, 0x00, 0xff,
  0x80, 0x00, 0xe0, 0x00, 0xe0, 0x00, 0x80, 0x00, 0x80, 0x00, 0xe0, 0x00,
  0xe0, 0x00, 0x80, 0xf8, 0x00, 0xfc, 0x00, 0x3e, 0x00, 0x3f, 0x00, 0x3b,
  0x00, 0x39, 0x00, 0xf8, 0x00, 0xf8, 0x03, 0x00, 0x07, 0x00, 0x0f, 0x00,
  0xbf, 0x00, 0xfb, 0x00, 0xf3, 0x00, 0xe3, 0x00, 0x43, 0xe0, 0x00, 0xe0,
  0x00, 0x3c, 0x00, 0x3c, 0x00, 0x3c, 0x00, 0x3c, 0x00, 0xe0, 0x00, 0xe0,
])

// Classic Pong ROM bytes
const PONG_ROM = new Uint8Array([
  0x6a, 0x02, 0x6b, 0x0c, 0x6c, 0x3f, 0x6d, 0x0c, 0xa2, 0xea, 0xda, 0xb6,
  0xdc, 0xd6, 0x6e, 0x00, 0x22, 0xd4, 0x66, 0x03, 0x68, 0x02, 0x60, 0x60,
  0xf0, 0x15, 0xf0, 0x07, 0x30, 0x00, 0x12, 0x1a, 0xc7, 0x17, 0x77, 0x08,
  0x69, 0xff, 0xa2, 0xf0, 0xd6, 0x71, 0xa2, 0xea, 0xda, 0xb6, 0xdc, 0xd6,
  0x60, 0x01, 0xe0, 0xa1, 0x7b, 0xfe, 0x60, 0x04, 0xe0, 0xa1, 0x7b, 0x02,
  0x60, 0x1f, 0x8b, 0x02, 0xda, 0xb6, 0x60, 0x0c, 0xe0, 0xa1, 0x7d, 0xfe,
  0x60, 0x0d, 0xe0, 0xa1, 0x7d, 0x02, 0x60, 0x1f, 0x8d, 0x02, 0xdc, 0xd6,
  0xa2, 0xf0, 0xd6, 0x71, 0x86, 0x84, 0x87, 0x94, 0x60, 0x3f, 0x86, 0x02,
  0x61, 0x1f, 0x87, 0x12, 0x46, 0x02, 0x12, 0x78, 0x46, 0x3f, 0x12, 0x82,
  0x47, 0x1f, 0x69, 0xff, 0x47, 0x00, 0x69, 0x01, 0xd6, 0x71, 0x12, 0x2a,
  0x68, 0x02, 0x63, 0x01, 0x80, 0x70, 0x80, 0xb5, 0x12, 0x8a, 0x68, 0xfe,
  0x63, 0x0a, 0x80, 0x70, 0x80, 0xd5, 0x3f, 0x01, 0x12, 0xa2, 0x61, 0x02,
  0x80, 0x15, 0x3f, 0x01, 0x12, 0xba, 0x80, 0x15, 0x3f, 0x01, 0x12, 0xca,
  0x60, 0x20, 0xf0, 0x18, 0x22, 0xd4, 0x8e, 0x34, 0x22, 0xd4, 0x66, 0x3e,
  0x33, 0x01, 0x66, 0x03, 0x68, 0xfe, 0x33, 0x01, 0x68, 0x02, 0x12, 0x16,
  0x79, 0xff, 0x49, 0xfe, 0x69, 0xff, 0x12, 0xc8, 0x79, 0x01, 0x49, 0x02,
  0x69, 0x01, 0x60, 0x04, 0xe0, 0xa1, 0x7a, 0xfe, 0x60, 0x05, 0xe0, 0xa1,
  0x7a, 0x02, 0x60, 0x1f, 0x8a, 0x02, 0xda, 0xa6, 0x12, 0xd0, 0x20, 0x20,
  0x20, 0x20, 0x20, 0x80, 0x80, 0x80, 0x80, 0x80, 0xaa, 0xaa, 0x00, 0x00,
  0x00, 0x8f, 0x8f, 0x00, 0x00, 0x00,
])

// Simple test ROM: draws patterns, tests basic instructions
const TEST_ROM = new Uint8Array([
  // CLS
  0x00, 0xe0,
  // LD V0, 5
  0x60, 0x05,
  // LD V1, 10
  0x61, 0x0a,
  // LD I, font for 0
  0xf0, 0x29,
  // DRW V0, V1, 5
  0xd0, 0x15,
  // LD V0, 15
  0x60, 0x0f,
  // LD V1, 10
  0x61, 0x0a,
  // LD I, font for 1
  0x61, 0x01,
  0xf1, 0x29,
  // DRW V0, V1, 5
  0xd0, 0x15,
  // LD V0, 25
  0x60, 0x19,
  // LD I, font for 8
  0x62, 0x08,
  0xf2, 0x29,
  // DRW V0,V1,5
  0xd0, 0x15,
  // Jump to self (infinite loop)
  0x12, 0x22,
])

// ─── Font Data ────────────────────────────────────────────────────────────

const FONT_DATA = new Uint8Array([
  0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
  0x20, 0x60, 0x20, 0x20, 0x70, // 1
  0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
  0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
  0x90, 0x90, 0xF0, 0x10, 0x10, // 4
  0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
  0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
  0xF0, 0x10, 0x20, 0x40, 0x40, // 7
  0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
  0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
  0xF0, 0x90, 0xF0, 0x90, 0x90, // A
  0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
  0xF0, 0x80, 0x80, 0x80, 0xF0, // C
  0xE0, 0x90, 0x90, 0x90, 0xE0, // D
  0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
  0xF0, 0x80, 0xF0, 0x80, 0x80, // F
])

// ─── Keyboard mapping ────────────────────────────────────────────────────

const KEY_MAP: Record<string, number> = {
  '1': 0x1, '2': 0x2, '3': 0x3, '4': 0xC,
  'q': 0x4, 'w': 0x5, 'e': 0x6, 'r': 0xD,
  'a': 0x7, 's': 0x8, 'd': 0x9, 'f': 0xE,
  'z': 0xA, 'x': 0x0, 'c': 0xB, 'v': 0xF,
}

const keyboardMap = [
  { chip8: 0x1, kb: '1' }, { chip8: 0x2, kb: '2' }, { chip8: 0x3, kb: '3' }, { chip8: 0xC, kb: '4' },
  { chip8: 0x4, kb: 'Q' }, { chip8: 0x5, kb: 'W' }, { chip8: 0x6, kb: 'E' }, { chip8: 0xD, kb: 'R' },
  { chip8: 0x7, kb: 'A' }, { chip8: 0x8, kb: 'S' }, { chip8: 0x9, kb: 'D' }, { chip8: 0xE, kb: 'F' },
  { chip8: 0xA, kb: 'Z' }, { chip8: 0x0, kb: 'X' }, { chip8: 0xB, kb: 'C' }, { chip8: 0xF, kb: 'V' },
]

// ─── CPU State ────────────────────────────────────────────────────────────

function makeCPU() {
  return {
    memory: new Uint8Array(4096),
    v: new Uint8Array(16),
    i: 0,
    pc: 0x200,
    sp: 0,
    stack: new Uint16Array(16),
    dt: 0,
    st: 0,
    display: new Uint8Array(64 * 32),
    keys: new Uint8Array(16),
    waitingForKey: -1, // register index waiting for key, or -1
  }
}

// ─── Reactive State ────────────────────────────────────────────────────────

const displayCanvas = ref<HTMLCanvasElement | null>(null)
const running = ref(false)
const showDebug = ref(true)
const speed = ref(300)
const selectedRom = ref('ibm')
const pressedKeys = ref(new Set<number>())

const cpu = reactive(makeCPU())
let currentRomData = IBM_LOGO

// ─── Disassembler ─────────────────────────────────────────────────────────

function disassemble(opcode: number): string {
  const nnn = opcode & 0x0FFF
  const n = opcode & 0x000F
  const x = (opcode & 0x0F00) >> 8
  const y = (opcode & 0x00F0) >> 4
  const kk = opcode & 0x00FF

  switch (opcode & 0xF000) {
    case 0x0000:
      if (opcode === 0x00E0) return 'CLS'
      if (opcode === 0x00EE) return 'RET'
      return `SYS ${nnn.toString(16).toUpperCase()}`
    case 0x1000: return `JP ${nnn.toString(16).toUpperCase()}`
    case 0x2000: return `CALL ${nnn.toString(16).toUpperCase()}`
    case 0x3000: return `SE V${x.toString(16).toUpperCase()}, ${kk.toString(16).toUpperCase()}`
    case 0x4000: return `SNE V${x.toString(16).toUpperCase()}, ${kk.toString(16).toUpperCase()}`
    case 0x5000: return `SE V${x.toString(16).toUpperCase()}, V${y.toString(16).toUpperCase()}`
    case 0x6000: return `LD V${x.toString(16).toUpperCase()}, ${kk.toString(16).toUpperCase()}`
    case 0x7000: return `ADD V${x.toString(16).toUpperCase()}, ${kk.toString(16).toUpperCase()}`
    case 0x8000:
      switch (n) {
        case 0x0: return `LD V${x.toString(16).toUpperCase()}, V${y.toString(16).toUpperCase()}`
        case 0x1: return `OR V${x.toString(16).toUpperCase()}, V${y.toString(16).toUpperCase()}`
        case 0x2: return `AND V${x.toString(16).toUpperCase()}, V${y.toString(16).toUpperCase()}`
        case 0x3: return `XOR V${x.toString(16).toUpperCase()}, V${y.toString(16).toUpperCase()}`
        case 0x4: return `ADD V${x.toString(16).toUpperCase()}, V${y.toString(16).toUpperCase()}`
        case 0x5: return `SUB V${x.toString(16).toUpperCase()}, V${y.toString(16).toUpperCase()}`
        case 0x6: return `SHR V${x.toString(16).toUpperCase()}`
        case 0x7: return `SUBN V${x.toString(16).toUpperCase()}, V${y.toString(16).toUpperCase()}`
        case 0xE: return `SHL V${x.toString(16).toUpperCase()}`
      }
      break
    case 0x9000: return `SNE V${x.toString(16).toUpperCase()}, V${y.toString(16).toUpperCase()}`
    case 0xA000: return `LD I, ${nnn.toString(16).toUpperCase()}`
    case 0xB000: return `JP V0, ${nnn.toString(16).toUpperCase()}`
    case 0xC000: return `RND V${x.toString(16).toUpperCase()}, ${kk.toString(16).toUpperCase()}`
    case 0xD000: return `DRW V${x.toString(16).toUpperCase()}, V${y.toString(16).toUpperCase()}, ${n}`
    case 0xE000:
      if (kk === 0x9E) return `SKP V${x.toString(16).toUpperCase()}`
      if (kk === 0xA1) return `SKNP V${x.toString(16).toUpperCase()}`
      break
    case 0xF000:
      switch (kk) {
        case 0x07: return `LD V${x.toString(16).toUpperCase()}, DT`
        case 0x0A: return `LD V${x.toString(16).toUpperCase()}, K`
        case 0x15: return `LD DT, V${x.toString(16).toUpperCase()}`
        case 0x18: return `LD ST, V${x.toString(16).toUpperCase()}`
        case 0x1E: return `ADD I, V${x.toString(16).toUpperCase()}`
        case 0x29: return `LD F, V${x.toString(16).toUpperCase()}`
        case 0x33: return `LD B, V${x.toString(16).toUpperCase()}`
        case 0x55: return `LD [I], V${x.toString(16).toUpperCase()}`
        case 0x65: return `LD V${x.toString(16).toUpperCase()}, [I]`
      }
      break
  }
  return `??? ${opcode.toString(16).toUpperCase().padStart(4, '0')}`
}

const currentInstruction = computed(() => {
  const opcode = (cpu.memory[cpu.pc] << 8) | cpu.memory[cpu.pc + 1]
  return `${cpu.pc.toString(16).toUpperCase().padStart(4,'0')}: ${opcode.toString(16).toUpperCase().padStart(4,'0')} — ${disassemble(opcode)}`
})

// ─── Emulator Core ────────────────────────────────────────────────────────

function initCPU(romData: Uint8Array) {
  // Reset all state
  cpu.memory = new Uint8Array(4096)
  cpu.v = new Uint8Array(16)
  cpu.i = 0
  cpu.pc = 0x200
  cpu.sp = 0
  cpu.stack = new Uint16Array(16)
  cpu.dt = 0
  cpu.st = 0
  cpu.display = new Uint8Array(64 * 32)
  cpu.keys = new Uint8Array(16)
  cpu.waitingForKey = -1

  // Load font
  for (let i = 0; i < FONT_DATA.length; i++) {
    cpu.memory[i] = FONT_DATA[i]
  }

  // Load ROM
  for (let i = 0; i < romData.length; i++) {
    cpu.memory[0x200 + i] = romData[i]
  }
}

function executeInstruction() {
  if (cpu.waitingForKey >= 0) return

  const opcode = (cpu.memory[cpu.pc] << 8) | cpu.memory[cpu.pc + 1]
  const nnn = opcode & 0x0FFF
  const n = opcode & 0x000F
  const x = (opcode & 0x0F00) >> 8
  const y = (opcode & 0x00F0) >> 4
  const kk = opcode & 0x00FF

  cpu.pc += 2

  switch (opcode & 0xF000) {
    case 0x0000:
      if (opcode === 0x00E0) {
        cpu.display.fill(0)
      } else if (opcode === 0x00EE) {
        cpu.sp--
        cpu.pc = cpu.stack[cpu.sp]
      }
      break
    case 0x1000:
      cpu.pc = nnn
      break
    case 0x2000:
      cpu.stack[cpu.sp] = cpu.pc
      cpu.sp++
      cpu.pc = nnn
      break
    case 0x3000:
      if (cpu.v[x] === kk) cpu.pc += 2
      break
    case 0x4000:
      if (cpu.v[x] !== kk) cpu.pc += 2
      break
    case 0x5000:
      if (cpu.v[x] === cpu.v[y]) cpu.pc += 2
      break
    case 0x6000:
      cpu.v[x] = kk
      break
    case 0x7000:
      cpu.v[x] = (cpu.v[x] + kk) & 0xFF
      break
    case 0x8000:
      switch (n) {
        case 0x0: cpu.v[x] = cpu.v[y]; break
        case 0x1: cpu.v[x] |= cpu.v[y]; break
        case 0x2: cpu.v[x] &= cpu.v[y]; break
        case 0x3: cpu.v[x] ^= cpu.v[y]; break
        case 0x4: {
          const sum = cpu.v[x] + cpu.v[y]
          cpu.v[0xF] = sum > 0xFF ? 1 : 0
          cpu.v[x] = sum & 0xFF
          break
        }
        case 0x5: {
          cpu.v[0xF] = cpu.v[x] >= cpu.v[y] ? 1 : 0
          cpu.v[x] = (cpu.v[x] - cpu.v[y] + 256) & 0xFF
          break
        }
        case 0x6: {
          cpu.v[0xF] = cpu.v[x] & 0x1
          cpu.v[x] >>= 1
          break
        }
        case 0x7: {
          cpu.v[0xF] = cpu.v[y] >= cpu.v[x] ? 1 : 0
          cpu.v[x] = (cpu.v[y] - cpu.v[x] + 256) & 0xFF
          break
        }
        case 0xE: {
          cpu.v[0xF] = (cpu.v[x] & 0x80) >> 7
          cpu.v[x] = (cpu.v[x] << 1) & 0xFF
          break
        }
      }
      break
    case 0x9000:
      if (cpu.v[x] !== cpu.v[y]) cpu.pc += 2
      break
    case 0xA000:
      cpu.i = nnn
      break
    case 0xB000:
      cpu.pc = nnn + cpu.v[0]
      break
    case 0xC000:
      cpu.v[x] = Math.floor(Math.random() * 256) & kk
      break
    case 0xD000: {
      const xPos = cpu.v[x] % 64
      const yPos = cpu.v[y] % 32
      cpu.v[0xF] = 0
      for (let row = 0; row < n; row++) {
        const spriteByte = cpu.memory[cpu.i + row]
        for (let col = 0; col < 8; col++) {
          if (spriteByte & (0x80 >> col)) {
            const px = (xPos + col) % 64
            const py = (yPos + row) % 32
            const idx = py * 64 + px
            if (cpu.display[idx]) cpu.v[0xF] = 1
            cpu.display[idx] ^= 1
          }
        }
      }
      break
    }
    case 0xE000:
      if (kk === 0x9E) {
        if (cpu.keys[cpu.v[x]]) cpu.pc += 2
      } else if (kk === 0xA1) {
        if (!cpu.keys[cpu.v[x]]) cpu.pc += 2
      }
      break
    case 0xF000:
      switch (kk) {
        case 0x07: cpu.v[x] = cpu.dt; break
        case 0x0A:
          cpu.waitingForKey = x
          break
        case 0x15: cpu.dt = cpu.v[x]; break
        case 0x18: cpu.st = cpu.v[x]; break
        case 0x1E: cpu.i = (cpu.i + cpu.v[x]) & 0xFFFF; break
        case 0x29: cpu.i = cpu.v[x] * 5; break
        case 0x33:
          cpu.memory[cpu.i] = Math.floor(cpu.v[x] / 100)
          cpu.memory[cpu.i + 1] = Math.floor((cpu.v[x] % 100) / 10)
          cpu.memory[cpu.i + 2] = cpu.v[x] % 10
          break
        case 0x55:
          for (let r = 0; r <= x; r++) cpu.memory[cpu.i + r] = cpu.v[r]
          break
        case 0x65:
          for (let r = 0; r <= x; r++) cpu.v[r] = cpu.memory[cpu.i + r]
          break
      }
      break
  }
}

// ─── Rendering ────────────────────────────────────────────────────────────

function render() {
  const canvas = displayCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, 640, 320)

  ctx.fillStyle = '#39ff14'
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 64; x++) {
      if (cpu.display[y * 64 + x]) {
        ctx.fillRect(x * 10, y * 10, 9, 9)
      }
    }
  }
}

// ─── Main Loop ────────────────────────────────────────────────────────────

let rafId: number | null = null
let lastTime = 0
let timerAccum = 0
let instrAccum = 0

function mainLoop(timestamp: number) {
  if (!running.value) return

  const delta = Math.min(timestamp - lastTime, 100) // cap at 100ms
  lastTime = timestamp

  // Instructions
  instrAccum += delta
  const msPerInstr = 1000 / speed.value
  while (instrAccum >= msPerInstr) {
    executeInstruction()
    instrAccum -= msPerInstr
  }

  // Timers at 60Hz
  timerAccum += delta
  while (timerAccum >= 1000 / 60) {
    if (cpu.dt > 0) cpu.dt--
    if (cpu.st > 0) cpu.st--
    timerAccum -= 1000 / 60
  }

  render()
  rafId = requestAnimationFrame(mainLoop)
}

// ─── Controls ─────────────────────────────────────────────────────────────

function toggleRunning() {
  running.value = !running.value
  if (running.value) {
    lastTime = performance.now()
    instrAccum = 0
    timerAccum = 0
    rafId = requestAnimationFrame(mainLoop)
  } else {
    if (rafId !== null) cancelAnimationFrame(rafId)
    rafId = null
  }
}

function step() {
  if (running.value) return
  executeInstruction()
  if (cpu.dt > 0) cpu.dt--
  if (cpu.st > 0) cpu.st--
  render()
}

function reset() {
  const wasRunning = running.value
  running.value = false
  if (rafId !== null) cancelAnimationFrame(rafId)
  rafId = null
  initCPU(currentRomData)
  render()
  if (wasRunning) {
    running.value = true
    lastTime = performance.now()
    instrAccum = 0
    timerAccum = 0
    rafId = requestAnimationFrame(mainLoop)
  }
}

function loadSelectedRom() {
  if (selectedRom.value === 'ibm') currentRomData = IBM_LOGO
  else if (selectedRom.value === 'pong') currentRomData = PONG_ROM
  else currentRomData = TEST_ROM
  reset()
}

// ─── Keyboard ─────────────────────────────────────────────────────────────

function onKeyDown(e: KeyboardEvent) {
  const key = e.key.toLowerCase()
  const chip8Key = KEY_MAP[key]
  if (chip8Key === undefined) return
  cpu.keys[chip8Key] = 1
  pressedKeys.value = new Set([...pressedKeys.value, chip8Key])

  if (cpu.waitingForKey >= 0) {
    cpu.v[cpu.waitingForKey] = chip8Key
    cpu.waitingForKey = -1
  }
}

function onKeyUp(e: KeyboardEvent) {
  const key = e.key.toLowerCase()
  const chip8Key = KEY_MAP[key]
  if (chip8Key === undefined) return
  cpu.keys[chip8Key] = 0
  const next = new Set(pressedKeys.value)
  next.delete(chip8Key)
  pressedKeys.value = next
}

// ─── Lifecycle ─────────────────────────────────────────────────────────────

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  initCPU(IBM_LOGO)
  render()
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  if (rafId !== null) cancelAnimationFrame(rafId)
})
</script>

<style scoped>
.chip8-btn {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  font-family: monospace;
  border-radius: 0.25rem;
  border-width: 1px;
  transition: colors 0.15s;
  cursor: pointer;
  background: transparent;
}
.btn-run {
  border-color: var(--color-neon-green);
  color: var(--color-neon-green);
}
.btn-run:hover {
  background: var(--color-neon-green);
  color: #000;
}
.btn-pause {
  border-color: #facc15;
  color: #facc15;
}
.btn-pause:hover {
  background: #facc15;
  color: #000;
}
.btn-step {
  border-color: var(--color-neon-cyan);
  color: var(--color-neon-cyan);
}
.btn-step:hover {
  background: var(--color-neon-cyan);
  color: #000;
}
.btn-step:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.btn-reset {
  border-color: var(--color-void-border);
  color: var(--color-text-muted);
}
.btn-reset:hover {
  border-color: #f87171;
  color: #f87171;
}

.key-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.4);
  border: 1px solid var(--color-void-border);
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  transition: all 0.15s;
}
.key-active {
  border-color: var(--color-neon-green);
  background: rgba(57,255,20,0.1);
}

.scanlines {
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 9px,
    rgba(0,0,0,0.15) 9px,
    rgba(0,0,0,0.15) 10px
  );
}
</style>
