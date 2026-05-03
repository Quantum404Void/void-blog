<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

type Dir = 'left' | 'right' | 'up' | 'down'
interface TileColor { bg: string; color: string; shadow: string }

const COLORS: Record<number, TileColor> = {
  0:    { bg: 'rgba(255,255,255,0.03)', color: 'transparent',        shadow: 'none' },
  2:    { bg: 'rgba(0,212,255,0.15)',   color: 'rgba(0,212,255,0.9)',  shadow: '0 0 16px rgba(0,212,255,0.4)' },
  4:    { bg: 'rgba(0,212,255,0.28)',   color: 'rgba(0,212,255,1)',    shadow: '0 0 20px rgba(0,212,255,0.6)' },
  8:    { bg: 'rgba(57,255,20,0.2)',    color: 'rgba(57,255,20,0.9)',  shadow: '0 0 16px rgba(57,255,20,0.4)' },
  16:   { bg: 'rgba(57,255,20,0.35)',   color: 'rgba(57,255,20,1)',    shadow: '0 0 20px rgba(57,255,20,0.6)' },
  32:   { bg: 'rgba(255,165,0,0.2)',    color: 'rgba(255,165,0,0.9)', shadow: '0 0 16px rgba(255,165,0,0.4)' },
  64:   { bg: 'rgba(255,165,0,0.35)',   color: 'rgba(255,165,0,1)',   shadow: '0 0 20px rgba(255,165,0,0.6)' },
  128:  { bg: 'rgba(255,0,170,0.2)',    color: 'rgba(255,0,170,0.9)', shadow: '0 0 16px rgba(255,0,170,0.4)' },
  256:  { bg: 'rgba(255,0,170,0.35)',   color: 'rgba(255,0,170,1)',   shadow: '0 0 20px rgba(255,0,170,0.6)' },
  512:  { bg: 'rgba(180,0,255,0.2)',    color: 'rgba(180,0,255,0.9)', shadow: '0 0 16px rgba(180,0,255,0.4)' },
  1024: { bg: 'rgba(180,0,255,0.35)',   color: 'rgba(180,0,255,1)',   shadow: '0 0 20px rgba(180,0,255,0.6)' },
  2048: { bg: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,1)', shadow: '0 0 32px rgba(255,255,255,0.8)' },
}
function getColor(v: number): TileColor {
  return COLORS[v] ?? { bg: 'rgba(255,255,255,0.2)', color: '#fff', shadow: 'none' }
}

// ── pure game logic ───────────────────────────────────────────
function moveLeft(row: number[]): { row: number[]; score: number } {
  const f = row.filter(x => x !== 0)
  let score = 0
  for (let i = 0; i < f.length - 1; i++) {
    if (f[i] === f[i + 1]) { f[i] *= 2; score += f[i]; f.splice(i + 1, 1); i++ }
  }
  while (f.length < 4) f.push(0)
  return { row: f, score }
}
function transpose(g: number[][]): number[][] { return g[0].map((_, c) => g.map(r => r[c])) }
function reverseRows(g: number[][]): number[][] { return g.map(r => [...r].reverse()) }

function applyMove(g: number[][], dir: Dir): { grid: number[][]; score: number; moved: boolean } {
  let grid = g.map(r => [...r])
  const before = JSON.stringify(grid)
  let totalScore = 0

  if (dir === 'right')     grid = reverseRows(grid)
  else if (dir === 'up')   grid = transpose(grid)
  else if (dir === 'down') { grid = transpose(grid); grid = reverseRows(grid) }

  const res = grid.map(r => moveLeft(r))
  grid = res.map(r => r.row)
  totalScore = res.reduce((s, r) => s + r.score, 0)

  if (dir === 'right')     grid = reverseRows(grid)
  else if (dir === 'up')   grid = transpose(grid)
  else if (dir === 'down') { grid = reverseRows(grid); grid = transpose(grid) }

  return { grid, score: totalScore, moved: JSON.stringify(grid) !== before }
}

function addRandom(g: number[][]): number[][] {
  const empty: [number, number][] = []
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      if (g[r][c] === 0) empty.push([r, c])
  if (!empty.length) return g
  const [r, c] = empty[Math.floor(Math.random() * empty.length)]
  const ng = g.map(row => [...row])
  ng[r][c] = Math.random() < 0.9 ? 2 : 4
  return ng
}

function isGameOver(g: number[][]): boolean {
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++) {
      if (g[r][c] === 0) return false
      if (c < 3 && g[r][c] === g[r][c + 1]) return false
      if (r < 3 && g[r][c] === g[r + 1][c]) return false
    }
  return true
}

// ── flat grid for template (16 cells) ────────────────────────
interface Cell { val: number; key: string }
function toFlat(g: number[][]): Cell[] {
  return g.flatMap((row, r) => row.map((val, c) => ({ val, key: `${r}-${c}` })))
}

// ── reactive state ────────────────────────────────────────────
const grid    = ref<number[][]>(Array.from({ length: 4 }, () => Array(4).fill(0)))
const score   = ref(0)
const best    = ref(0)
const overlay = ref<'win' | 'over' | null>(null)
const mergedKeys = ref<Set<string>>(new Set())

function newGame() {
  let g: number[][] = Array.from({ length: 4 }, () => Array(4).fill(0))
  g = addRandom(g); g = addRandom(g)
  grid.value = g; score.value = 0; overlay.value = null; mergedKeys.value = new Set()
}

function doMove(dir: Dir) {
  if (overlay.value) return
  const { grid: ng, score: s, moved } = applyMove(grid.value, dir)
  if (!moved) return

  const mk = new Set<string>()
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      if (ng[r][c] !== 0 && ng[r][c] !== grid.value[r][c])
        mk.add(`${r}-${c}`)
  mergedKeys.value = mk

  grid.value = addRandom(ng)
  score.value += s
  if (score.value > best.value) {
    best.value = score.value
    try { localStorage.setItem('2048-best', String(best.value)) } catch {}
  }
  if (grid.value.some(row => row.some(v => v >= 2048))) {
    setTimeout(() => { overlay.value = 'win' }, 250)
  } else if (isGameOver(grid.value)) {
    setTimeout(() => { overlay.value = 'over' }, 250)
  }
}

const DIR_MAP: Record<string, Dir> = {
  ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
  a: 'left', d: 'right', w: 'up', s: 'down',
  A: 'left', D: 'right', W: 'up', S: 'down',
}
function onKey(e: KeyboardEvent) {
  const dir = DIR_MAP[e.key]; if (dir) { e.preventDefault(); doMove(dir) }
}

let tx = 0, ty = 0
function onTouchStart(e: TouchEvent) { tx = e.changedTouches[0].clientX; ty = e.changedTouches[0].clientY }
function onTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return
  doMove(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'))
}

onMounted(() => {
  try { best.value = parseInt(localStorage.getItem('2048-best') ?? '0') || 0 } catch {}
  newGame()
  window.addEventListener('keydown', onKey)
})
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="select-none">
    <!-- Score Row -->
    <div class="flex items-center justify-center gap-6 mb-6">
      <div class="font-mono text-center border border-[rgba(255,165,0,0.3)] rounded-xl px-6 py-3 bg-[var(--color-void-card)]">
        <div class="text-[10px] text-[var(--color-text-muted)] tracking-widest uppercase mb-1">Score</div>
        <div class="text-2xl font-bold text-[rgba(255,165,0,0.9)]">{{ score }}</div>
      </div>
      <div class="font-mono text-center border border-[rgba(255,165,0,0.3)] rounded-xl px-6 py-3 bg-[var(--color-void-card)]">
        <div class="text-[10px] text-[var(--color-text-muted)] tracking-widest uppercase mb-1">Best</div>
        <div class="text-2xl font-bold text-[rgba(255,165,0,0.9)]">{{ best }}</div>
      </div>
      <button
        @click="newGame"
        class="font-mono text-sm px-6 py-3 rounded-xl border border-[rgba(255,165,0,0.4)] text-[rgba(255,165,0,0.9)] hover:bg-[rgba(255,165,0,0.1)] transition-colors cursor-pointer"
      >New Game</button>
    </div>

    <!-- Board -->
    <div class="flex justify-center">
      <div
        class="relative"
        style="touch-action:none"
        @touchstart.passive="onTouchStart"
        @touchend.passive="onTouchEnd"
      >
        <div class="board-grid grid gap-3 p-3 rounded-2xl bg-[rgba(255,165,0,0.08)] border border-[rgba(255,165,0,0.2)]">
          <div
            v-for="cell in toFlat(grid)"
            :key="cell.key"
            :class="['tile', cell.val === 0 ? 'tile-empty' : '', mergedKeys.has(cell.key) ? 'tile-merge' : '']"
            :style="{
              background: getColor(cell.val).bg,
              color:      getColor(cell.val).color,
              textShadow: getColor(cell.val).shadow,
              boxShadow:  cell.val >= 2048 ? getColor(cell.val).shadow : '',
            }"
          >{{ cell.val === 0 ? '' : cell.val }}</div>
        </div>

        <!-- Overlay -->
        <Transition name="fade">
          <div
            v-if="overlay"
            class="absolute inset-0 rounded-2xl flex items-center justify-center bg-[rgba(10,10,15,0.85)] backdrop-blur-sm"
          >
            <div class="text-center">
              <div
                class="font-mono text-3xl font-bold mb-4"
                :style="{ color: overlay === 'win' ? 'rgba(57,255,20,0.9)' : '#ff4444' }"
              >{{ overlay === 'win' ? '🎉 YOU WIN!' : 'GAME OVER' }}</div>
              <button
                @click="newGame"
                class="font-mono text-sm px-6 py-2 rounded-xl border border-[rgba(255,165,0,0.4)] text-[rgba(255,165,0,0.9)] hover:bg-[rgba(255,165,0,0.1)] transition-colors cursor-pointer"
              >Play Again</button>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <div class="mt-6 text-center font-mono text-xs text-[var(--color-text-muted)] opacity-60">
      方向键 / WASD 移动 &nbsp;·&nbsp; 移动端支持滑动
    </div>
  </div>
</template>

<style scoped>
.board-grid {
  grid-template-columns: repeat(4, var(--tile-sz));
  grid-template-rows:    repeat(4, var(--tile-sz));
  --tile-sz: 100px;
}
.tile {
  width:  var(--tile-sz);
  height: var(--tile-sz);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-family: monospace;
  font-weight: bold;
  font-size: 28px;
  transition: background-color 0.1s ease;
  border: 1px solid rgba(255,255,255,0.05);
}
.tile-merge { animation: pop 0.15s ease; }
@keyframes pop {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.12); }
  100% { transform: scale(1); }
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 520px) {
  .board-grid { --tile-sz: 72px; }
  .tile { font-size: 20px; border-radius: 8px; }
}
@media (max-width: 380px) {
  .board-grid { --tile-sz: 58px; }
  .tile { font-size: 16px; }
}
</style>
