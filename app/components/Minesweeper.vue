<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// ── difficulty presets ────────────────────────────────────────
interface Difficulty { rows: number; cols: number; mines: number; label: string }
const DIFFS: Record<string, Difficulty> = {
  easy:   { rows: 9,  cols: 9,  mines: 10, label: '初级 9×9/10' },
  medium: { rows: 16, cols: 16, mines: 40, label: '中级 16×16/40' },
  hard:   { rows: 16, cols: 30, mines: 99, label: '高级 30×16/99' },
}

// ── state ─────────────────────────────────────────────────────
const diffKey   = ref('easy')
const diff      = computed(() => DIFFS[diffKey.value])

type CellState = 'hidden' | 'revealed' | 'flagged'
interface Cell { mine: boolean; adj: number; state: CellState; boom: boolean }

const cells     = ref<Cell[][]>([])
const firstClick = ref(true)
const status    = ref<'playing' | 'won' | 'dead'>('playing')
const seconds   = ref(0)
const remaining = ref(0)
let   timer: ReturnType<typeof setInterval> | null = null
const faceMap   = { playing: '🙂', won: '😎', dead: '😵' }

// ── init ──────────────────────────────────────────────────────
function startGame(key?: string) {
  if (key) diffKey.value = key
  const { rows, cols, mines } = diff.value
  cells.value = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ mine: false, adj: 0, state: 'hidden' as CellState, boom: false }))
  )
  firstClick.value = true
  status.value = 'playing'
  remaining.value = mines
  stopTimer(); seconds.value = 0
}

function placeMines(er: number, ec: number) {
  const { rows, cols, mines } = diff.value
  const positions: [number, number][] = []
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (Math.abs(r - er) > 1 || Math.abs(c - ec) > 1)
        positions.push([r, c])
  // Fisher-Yates shuffle, pick first `mines`
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]]
  }
  for (let i = 0; i < mines; i++) cells.value[positions[i][0]][positions[i][1]].mine = true

  // calc adjacency
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      if (cells.value[r][c].mine) continue
      let cnt = 0
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && cells.value[nr][nc].mine) cnt++
        }
      cells.value[r][c].adj = cnt
    }
}

// ── BFS flood reveal ──────────────────────────────────────────
function floodReveal(sr: number, sc: number) {
  const { rows, cols } = diff.value
  const queue: [number, number][] = [[sr, sc]]
  while (queue.length) {
    const [r, c] = queue.shift()!
    const cell = cells.value[r][c]
    if (cell.state !== 'hidden') continue
    cell.state = 'revealed'
    if (cell.adj === 0 && !cell.mine) {
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && cells.value[nr][nc].state === 'hidden')
            queue.push([nr, nc])
        }
    }
  }
}

function checkWin(): boolean {
  return cells.value.every(row => row.every(c => c.mine || c.state === 'revealed'))
}

// ── event handlers ────────────────────────────────────────────
function handleClick(r: number, c: number) {
  if (status.value !== 'playing') return
  const cell = cells.value[r][c]
  if (cell.state !== 'hidden') return

  if (firstClick.value) {
    firstClick.value = false
    placeMines(r, c)
    startTimer()
  }

  if (cell.mine) {
    cell.boom = true
    cell.state = 'revealed'
    status.value = 'dead'
    stopTimer()
    // reveal all mines
    cells.value.forEach(row => row.forEach(cc => { if (cc.mine) cc.state = 'revealed' }))
    return
  }

  floodReveal(r, c)

  if (checkWin()) {
    status.value = 'won'
    stopTimer()
    remaining.value = 0
    cells.value.forEach(row => row.forEach(cc => { if (cc.mine) cc.state = 'flagged' }))
  }
}

function handleRightClick(e: MouseEvent, r: number, c: number) {
  e.preventDefault()
  if (status.value !== 'playing') return
  const cell = cells.value[r][c]
  if (cell.state === 'revealed') return
  if (cell.state === 'flagged') { cell.state = 'hidden'; remaining.value++ }
  else { cell.state = 'flagged'; remaining.value-- }
}

// chord: click on revealed number reveals neighbors if flag count matches
function handleChord(r: number, c: number) {
  const cell = cells.value[r][c]
  if (cell.state !== 'revealed' || cell.adj === 0) return
  const { rows, cols } = diff.value
  let flags = 0
  const neighbors: [number, number][] = []
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      const nr = r + dr, nc = c + dc
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        if (cells.value[nr][nc].state === 'flagged') flags++
        else if (cells.value[nr][nc].state === 'hidden') neighbors.push([nr, nc])
      }
    }
  if (flags === cell.adj) neighbors.forEach(([nr, nc]) => handleClick(nr, nc))
}

// ── timer ─────────────────────────────────────────────────────
function startTimer() {
  timer = setInterval(() => { seconds.value = Math.min(seconds.value + 1, 999) }, 1000)
}
function stopTimer() {
  if (timer) { clearInterval(timer); timer = null }
}

// ── num colors ────────────────────────────────────────────────
const NUM_COLORS = ['', 'rgba(0,212,255,0.9)', 'rgba(57,255,20,0.9)', 'rgba(255,165,0,0.9)',
  'rgba(255,0,170,0.9)', 'rgba(180,0,255,0.9)', 'rgba(0,255,255,0.9)', 'rgba(255,255,255,0.9)', 'rgba(150,150,150,0.9)']

onMounted(() => startGame())
onUnmounted(() => stopTimer())
</script>

<template>
  <div>
    <!-- Difficulty buttons -->
    <div class="flex flex-wrap items-center justify-center gap-4 mb-5">
      <button
        v-for="(d, key) in DIFFS"
        :key="key"
        @click="startGame(key)"
        :class="[
          'font-mono text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer',
          diffKey === key
            ? 'border-[rgba(255,0,170,0.6)] bg-[rgba(255,0,170,0.15)] text-[rgba(255,0,170,1)]'
            : 'border-[rgba(255,0,170,0.3)] text-[rgba(255,0,170,0.7)] hover:bg-[rgba(255,0,170,0.1)]'
        ]"
      >{{ d.label }}</button>
    </div>

    <!-- Status bar -->
    <div class="flex items-center justify-center gap-8 mb-5 font-mono">
      <div class="flex items-center gap-2 border border-[rgba(255,0,170,0.2)] rounded-lg px-4 py-2 bg-[var(--color-void-card)] min-w-[80px] justify-center">
        <span class="text-[rgba(255,0,170,0.7)] text-sm">💣</span>
        <span class="text-[rgba(255,0,170,0.9)] font-bold text-lg min-w-[2rem] text-center">{{ remaining }}</span>
      </div>
      <button
        @click="startGame()"
        class="text-2xl hover:scale-110 transition-transform cursor-pointer select-none"
        title="New Game"
      >{{ faceMap[status] }}</button>
      <div class="flex items-center gap-2 border border-[rgba(255,0,170,0.2)] rounded-lg px-4 py-2 bg-[var(--color-void-card)] min-w-[80px] justify-center">
        <span class="text-[rgba(0,212,255,0.7)] text-sm">⏱</span>
        <span class="text-[rgba(0,212,255,0.9)] font-bold text-lg min-w-[2rem] text-center">{{ seconds }}</span>
      </div>
    </div>

    <!-- Board -->
    <div class="flex justify-center overflow-x-auto pb-2">
      <div>
        <div
          v-for="(row, r) in cells"
          :key="r"
          class="flex gap-[2px] mb-[2px]"
        >
          <div
            v-for="(cell, c) in row"
            :key="c"
            :class="[
              'ms-cell font-mono select-none',
              cell.state === 'revealed' ? 'revealed' : '',
              cell.state === 'flagged'  ? 'flagged'  : '',
              cell.boom                 ? 'boom'     : '',
              !cell.boom && cell.state !== 'revealed' && cell.state !== 'flagged' ? 'unrevealed' : '',
            ]"
            :style="cell.state === 'revealed' && cell.adj > 0 && !cell.mine ? { color: NUM_COLORS[cell.adj] } : {}"
            @click="cell.state === 'revealed' ? handleChord(r, c) : handleClick(r, c)"
            @contextmenu="handleRightClick($event, r, c)"
          >
            <template v-if="cell.state === 'flagged'">🚩</template>
            <template v-else-if="cell.state === 'hidden'">▓</template>
            <template v-else-if="cell.mine">💣</template>
            <template v-else-if="cell.adj > 0">{{ cell.adj }}</template>
            <template v-else></template>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-6 text-center font-mono text-xs text-[var(--color-text-muted)] opacity-60">
      左键翻开 &nbsp;·&nbsp; 右键插旗 &nbsp;·&nbsp; 第一次点击永远安全 &nbsp;·&nbsp; 点数字可和弦展开
    </div>
  </div>
</template>

<style scoped>
.ms-cell {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  border-radius: 4px;
  border: 1px solid rgba(255,0,170,0.15);
  background: rgba(255,0,170,0.06);
  transition: background 0.1s, box-shadow 0.1s;
  user-select: none;
  flex-shrink: 0;
}
.ms-cell.unrevealed:hover {
  background: rgba(255,0,170,0.15);
  box-shadow: 0 0 8px rgba(255,0,170,0.3);
}
.ms-cell.revealed {
  background: rgba(255,255,255,0.04);
  cursor: default;
  border-color: rgba(255,255,255,0.05);
}
.ms-cell.flagged {
  background: rgba(255,0,170,0.12);
}
.ms-cell.boom {
  background: rgba(255,50,50,0.3);
  border-color: rgba(255,50,50,0.5);
  box-shadow: 0 0 12px rgba(255,50,50,0.6);
}
/* hidden cell color for ▓ */
.ms-cell:not(.revealed):not(.flagged):not(.boom) {
  color: rgba(255,0,170,0.3);
}
</style>
