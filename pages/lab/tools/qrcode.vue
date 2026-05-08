<template>
  <div class="min-h-screen" style="background:#0a0a0f;color:#e0e0e0">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'tools', href: '/lab' }, { label: 'QR Code' }]" />
    <div class="max-w-2xl mx-auto px-4 py-12">
      <h1 class="text-3xl font-bold mb-2" style="color:#39ff14;font-family:monospace">
        <span style="color:#00ffff">~/</span>qrcode
      </h1>
      <p class="mb-8 text-sm" style="color:#666">二维码生成器 — 纯前端</p>

      <div class="space-y-4 mb-8">
        <div>
          <label class="block text-xs mb-1" style="color:#888;font-family:monospace">INPUT TEXT / URL</label>
          <input
            v-model="text"
            type="text"
            placeholder="https://example.com"
            class="w-full px-3 py-2 rounded text-sm"
            style="background:#111;border:1px solid #333;color:#e0e0e0;font-family:monospace;outline:none"
            @focus="($event.target as HTMLInputElement).style.borderColor='#39ff14'"
            @blur="($event.target as HTMLInputElement).style.borderColor='#333'"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs mb-1" style="color:#888;font-family:monospace">ECC LEVEL</label>
            <select
              v-model="eccLevel"
              class="w-full px-3 py-2 rounded text-sm"
              style="background:#111;border:1px solid #333;color:#e0e0e0;font-family:monospace"
            >
              <option value="L">L — Low (7%)</option>
              <option value="M" selected>M — Medium (15%)</option>
              <option value="Q">Q — Quartile (25%)</option>
              <option value="H">H — High (30%)</option>
            </select>
          </div>
          <div>
            <label class="block text-xs mb-1" style="color:#888;font-family:monospace">SIZE</label>
            <input
              v-model.number="size"
              type="range" min="200" max="500" step="10"
              class="w-full mt-2"
            />
            <span class="text-xs" style="color:#555;font-family:monospace">{{ size }}px</span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs mb-1" style="color:#888;font-family:monospace">FOREGROUND</label>
            <div class="flex items-center gap-2">
              <input v-model="fgColor" type="color" class="h-8 w-8 rounded cursor-pointer" style="border:1px solid #333;background:transparent" />
              <span class="text-xs" style="color:#555;font-family:monospace">{{ fgColor }}</span>
            </div>
          </div>
          <div>
            <label class="block text-xs mb-1" style="color:#888;font-family:monospace">BACKGROUND</label>
            <div class="flex items-center gap-2">
              <input v-model="bgColor" type="color" class="h-8 w-8 rounded cursor-pointer" style="border:1px solid #333;background:transparent" />
              <span class="text-xs" style="color:#555;font-family:monospace">{{ bgColor }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col items-center gap-4">
        <ClientOnly>
          <div
            class="rounded-lg p-4"
            style="background:#111;border:1px solid #222"
          >
            <canvas ref="canvasRef" :width="size" :height="size" />
          </div>
          <template #fallback>
            <div class="rounded-lg p-4 flex items-center justify-center" :style="`background:#111;border:1px solid #222;width:${size}px;height:${size}px`">
              <span style="color:#444;font-family:monospace">loading...</span>
            </div>
          </template>
        </ClientOnly>

        <div v-if="error" class="text-sm px-3 py-2 rounded" style="background:#1a0000;border:1px solid #ff3333;color:#ff6666;font-family:monospace">
          ⚠ {{ error }}
        </div>

        <button
          v-if="!error"
          @click="downloadPNG"
          class="px-6 py-2 rounded text-sm font-bold transition-all"
          style="background:#0a1a0a;border:1px solid #39ff14;color:#39ff14;font-family:monospace;cursor:pointer"
          @mouseenter="($event.target as HTMLElement).style.background='#39ff14';($event.target as HTMLElement).style.color='#0a0a0f'"
          @mouseleave="($event.target as HTMLElement).style.background='#0a1a0a';($event.target as HTMLElement).style.color='#39ff14'"
        >
          ↓ DOWNLOAD PNG
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'

useSeoMeta({ title: 'QR Code Generator — void.lab' })

const text = ref('https://void.cat')
const eccLevel = ref<'L'|'M'|'Q'|'H'>('M')
const size = ref(300)
const fgColor = ref('#39ff14')
const bgColor = ref('#0a0a0f')
const canvasRef = ref<HTMLCanvasElement | null>(null)
const error = ref('')

// ─── QR Code Generator (pure JS, Version 1-3, byte mode) ───────────────────

const GF256_EXP = new Uint8Array(512)
const GF256_LOG = new Uint8Array(256)
;(function initGF() {
  let x = 1
  for (let i = 0; i < 255; i++) {
    GF256_EXP[i] = x
    GF256_LOG[x] = i
    x <<= 1
    if (x & 0x100) x ^= 0x11d
  }
  for (let i = 255; i < 512; i++) GF256_EXP[i] = GF256_EXP[i - 255]
})()

function gfMul(a: number, b: number) {
  if (a === 0 || b === 0) return 0
  return GF256_EXP[GF256_LOG[a] + GF256_LOG[b]]
}

function rsGenPoly(n: number) {
  let poly = [1]
  for (let i = 0; i < n; i++) {
    const next = new Array(poly.length + 1).fill(0)
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j]
      next[j + 1] ^= gfMul(poly[j], GF256_EXP[i])
    }
    poly = next
  }
  return poly
}

function rsEncode(data: number[], n: number) {
  const gen = rsGenPoly(n)
  const msg = [...data, ...new Array(n).fill(0)]
  for (let i = 0; i < data.length; i++) {
    const coef = msg[i]
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        msg[i + j] ^= gfMul(gen[j], coef)
      }
    }
  }
  return msg.slice(data.length)
}

// Version capacity table [version][ecc_level] = {dc, ec}
// dc = data codewords, ec = error correction codewords
const VERSION_INFO: Record<number, Record<string, {dc: number, ec: number}>> = {
  1: { L:{dc:19,ec:7}, M:{dc:16,ec:10}, Q:{dc:13,ec:13}, H:{dc:9,ec:17} },
  2: { L:{dc:34,ec:10}, M:{dc:28,ec:16}, Q:{dc:22,ec:22}, H:{dc:16,ec:28} },
  3: { L:{dc:55,ec:15}, M:{dc:44,ec:26}, Q:{dc:34,ec:36}, H:{dc:26,ec:44} },
}

function encodeData(text: string, version: number, ecc: string) {
  const bytes = new TextEncoder().encode(text)
  const info = VERSION_INFO[version][ecc]
  const bits: number[] = []

  // Mode indicator: byte mode = 0100
  bits.push(0,1,0,0)

  // Character count: version 1-3 byte mode uses 8 bits
  const len = bytes.length
  for (let i = 7; i >= 0; i--) bits.push((len >> i) & 1)

  // Data
  for (const b of bytes) {
    for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1)
  }

  // Terminator
  for (let i = 0; i < 4 && bits.length < info.dc * 8; i++) bits.push(0)

  // Pad to byte boundary
  while (bits.length % 8 !== 0) bits.push(0)

  // Pad codewords
  const padBytes = [0xEC, 0x11]
  let pi = 0
  while (bits.length < info.dc * 8) {
    const pb = padBytes[pi++ % 2]
    for (let i = 7; i >= 0; i--) bits.push((pb >> i) & 1)
  }

  // Convert to codewords
  const codewords: number[] = []
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0
    for (let j = 0; j < 8; j++) byte = (byte << 1) | (bits[i + j] || 0)
    codewords.push(byte)
  }

  const ec = rsEncode(codewords, info.ec)
  return [...codewords, ...ec]
}

function getVersion(text: string, ecc: string): number {
  const byteLen = new TextEncoder().encode(text).length
  // byte mode capacity
  const caps: Record<string, number[]> = {
    L: [17, 32, 53],
    M: [14, 26, 42],
    Q: [11, 20, 32],
    H: [7, 14, 24],
  }
  for (let v = 1; v <= 3; v++) {
    if (byteLen <= caps[ecc][v - 1]) return v
  }
  return -1
}

function buildMatrix(version: number) {
  const size = version * 4 + 17
  const mat: (0|1|null)[][] = Array.from({length: size}, () => new Array(size).fill(null))
  const func: boolean[][] = Array.from({length: size}, () => new Array(size).fill(false))

  function setFn(r: number, c: number, v: 0|1) {
    mat[r][c] = v; func[r][c] = true
  }

  // Finder patterns
  function finder(row: number, col: number) {
    for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) {
      setFn(row+r, col+c, (r===0||r===6||c===0||c===6||( r>=2&&r<=4&&c>=2&&c<=4))?1:0)
    }
    // Separators
    for (let i = -1; i <= 7; i++) {
      if (row+i >= 0 && row+i < size) {
        if (col-1 >= 0) setFn(row+i, col-1, 0)
        if (col+7 < size) setFn(row+i, col+7, 0)
      }
      if (col+i >= 0 && col+i < size) {
        if (row-1 >= 0) setFn(row-1, col+i, 0)
        if (row+7 < size) setFn(row+7, col+i, 0)
      }
    }
  }
  finder(0, 0); finder(0, size-7); finder(size-7, 0)

  // Timing patterns
  for (let i = 8; i < size-8; i++) {
    setFn(6, i, i%2===0?1:0)
    setFn(i, 6, i%2===0?1:0)
  }

  // Dark module
  setFn(size-8, 8, 1)

  // Format info placeholder
  const fmtPositions = [
    ...[...Array(6)].map((_,i)=>[8,i] as [number,number]),
    [8,7] as [number,number],[8,8] as [number,number],[7,8] as [number,number],
    ...[...Array(6)].map((_,i)=>[5-i,8] as [number,number]),
  ]
  for (const [r,c] of fmtPositions) func[r][c] = true
  for (let i = 0; i < 7; i++) { func[size-1-i][8] = true; func[8][size-1-i] = true }

  // Alignment patterns (version >= 2)
  if (version >= 2) {
    const aligns: Record<number, number[]> = { 2:[6,18], 3:[6,22] }
    const al = aligns[version]
    if (al) {
      for (const r of al) for (const c of al) {
        if (func[r][c]) continue
        for (let dr=-2;dr<=2;dr++) for (let dc=-2;dc<=2;dc++) {
          setFn(r+dr, c+dc, (Math.abs(dr)===2||Math.abs(dc)===2||( dr===0&&dc===0))?1:0)
        }
      }
    }
  }

  return { mat, func, size }
}

function placeData(mat: (0|1|null)[][], func: boolean[][], data: number[], size: number) {
  let bitIdx = 0
  const bits = data.flatMap(b => [...Array(8)].map((_,i)=>(b>>(7-i))&1))

  let up = true
  let col = size - 1
  while (col > 0) {
    if (col === 6) col--
    const cols = [col, col-1]
    for (let row = 0; row < size; row++) {
      const r = up ? size-1-row : row
      for (const c of cols) {
        if (!func[r][c] && mat[r][c] === null) {
          mat[r][c] = bitIdx < bits.length ? bits[bitIdx++] as 0|1 : 0
        }
      }
    }
    col -= 2
    up = !up
  }
}

function applyMask(mat: (0|1|null)[][], func: boolean[][], maskNum: number, size: number) {
  const masked = mat.map(r => [...r]) as (0|1)[][]
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
    if (func[r][c]) { masked[r][c] = mat[r][c] as 0|1; continue }
    const v = mat[r][c] as 0|1
    let flip = false
    switch(maskNum) {
      case 0: flip = (r+c)%2===0; break
      case 1: flip = r%2===0; break
      case 2: flip = c%3===0; break
      case 3: flip = (r+c)%3===0; break
      case 4: flip = (Math.floor(r/2)+Math.floor(c/3))%2===0; break
      case 5: flip = (r*c)%2+(r*c)%3===0; break
      case 6: flip = ((r*c)%2+(r*c)%3)%2===0; break
      case 7: flip = ((r+c)%2+(r*c)%3)%2===0; break
    }
    masked[r][c] = flip ? (v^1) as 0|1 : v
  }
  return masked
}

// Format string for mask pattern and ECC level
function formatString(ecc: string, mask: number) {
  const eccBits: Record<string, number> = { L:1, M:0, Q:3, H:2 }
  const data = (eccBits[ecc] << 3) | mask
  let d = data
  for (let i = 0; i < 10; i++) d <<= 1
  const gen = 0x537
  let rem = d
  for (let i = 14; i >= 5; i--) {
    if ((rem >> i) & 1) rem ^= gen << (i - 5)
  }
  const fmt = ((data << 10) | rem) ^ 0x5412
  return fmt
}

function writeFormat(mat: (0|1)[][], size: number, ecc: string, mask: number) {
  const fmt = formatString(ecc, mask)
  const bits = [...Array(15)].map((_,i)=>(fmt>>(14-i))&1) as (0|1)[]
  // Top-left
  const pos1 = [[0,8],[1,8],[2,8],[3,8],[4,8],[5,8],[7,8],[8,8],[8,7],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0]]
  pos1.forEach(([r,c],i) => mat[r][c] = bits[i])
  // Bottom/right
  for (let i = 0; i < 7; i++) mat[size-1-i][8] = bits[i]
  for (let i = 0; i < 8; i++) mat[8][size-8+i] = bits[7+i]
}

function generateQR(inputText: string, ecc: string): (0|1)[][] | null {
  const version = getVersion(inputText, ecc)
  if (version < 0) return null

  const codewords = encodeData(inputText, version, ecc)
  const { mat, func, size } = buildMatrix(version)
  placeData(mat, func, codewords, size)

  // Try all 8 masks, pick best penalty
  let bestMask = 0
  let bestPenalty = Infinity
  let bestMat: (0|1)[][] | null = null

  for (let m = 0; m < 8; m++) {
    const masked = applyMask(mat, func, m, size)
    const p = penalty(masked, size)
    if (p < bestPenalty) { bestPenalty = p; bestMask = m; bestMat = masked }
  }

  writeFormat(bestMat!, size, ecc, bestMask)
  return bestMat
}

function penalty(mat: (0|1)[][], size: number) {
  let pen = 0
  // Rule 1: 5+ in a row
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size;) {
      const v = mat[r][c]; let run = 0
      while (c < size && mat[r][c] === v) { run++; c++ }
      if (run >= 5) pen += 3 + run - 5
    }
  }
  for (let c = 0; c < size; c++) {
    for (let r = 0; r < size;) {
      const v = mat[r][c]; let run = 0
      while (r < size && mat[r][c] === v) { run++; r++ }
      if (run >= 5) pen += 3 + run - 5
    }
  }
  // Rule 2: 2x2 blocks
  for (let r = 0; r < size-1; r++) for (let c = 0; c < size-1; c++) {
    const v = mat[r][c]
    if (mat[r+1][c]===v && mat[r][c+1]===v && mat[r+1][c+1]===v) pen += 3
  }
  return pen
}

// ─── Rendering ──────────────────────────────────────────────────────────────

function drawQR(qr: (0|1)[][], canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!
  const n = qr.length
  const cellSize = size.value / (n + 8)
  const offset = cellSize * 4

  canvas.width = size.value
  canvas.height = size.value

  ctx.fillStyle = bgColor.value
  ctx.fillRect(0, 0, size.value, size.value)

  ctx.fillStyle = fgColor.value
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr[r][c] === 1) {
        ctx.fillRect(offset + c * cellSize, offset + r * cellSize, cellSize, cellSize)
      }
    }
  }
}

function render() {
  if (!canvasRef.value) return
  error.value = ''
  if (!text.value.trim()) {
    const ctx = canvasRef.value.getContext('2d')!
    ctx.fillStyle = bgColor.value
    ctx.fillRect(0, 0, size.value, size.value)
    return
  }
  try {
    const qr = generateQR(text.value, eccLevel.value)
    if (!qr) {
      error.value = `Text too long for Version 1-3 with ECC ${eccLevel.value} (max ~${eccLevel.value==='L'?53:eccLevel.value==='M'?42:eccLevel.value==='Q'?32:24} bytes)`
      return
    }
    drawQR(qr, canvasRef.value)
  } catch (e: any) {
    error.value = e.message || 'Generation failed'
  }
}

function downloadPNG() {
  if (!canvasRef.value) return
  const a = document.createElement('a')
  a.href = canvasRef.value.toDataURL('image/png')
  a.download = 'qrcode.png'
  a.click()
}

onMounted(() => nextTick(render))
watch([text, eccLevel, size, fgColor, bgColor], () => nextTick(render))
</script>
