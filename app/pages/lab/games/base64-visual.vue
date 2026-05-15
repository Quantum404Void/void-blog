<template>
  <div class="min-h-screen bg-[var(--color-void)] text-[var(--color-text-primary)] font-mono">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'games', href: '/lab' }, { label: 'base64-visual' }]" />

    <div class="max-w-5xl mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold text-[var(--color-neon-cyan)] mb-2">Base64 / UTF-8 Visualizer</h1>
      <p class="text-[var(--color-text-muted)] mb-6 text-sm">Byte-level visualization of text encoding</p>

      <!-- Mode Toggle -->
      <div class="flex gap-2 mb-6">
        <button
          v-for="m in ['encode', 'decode']"
          :key="m"
          @click="mode = m as 'encode' | 'decode'"
          class="px-4 py-1.5 text-sm rounded border transition-colors"
          :class="mode === m
            ? 'border-[var(--color-neon-cyan)] bg-[var(--color-neon-cyan)] text-black font-bold'
            : 'border-[var(--color-void-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-void-card)]'"
        >
          {{ m === 'encode' ? '→ Encode' : '← Decode' }}
        </button>
      </div>

      <!-- Encode Mode -->
      <div v-if="mode === 'encode'">
        <div class="mb-4">
          <label class="block text-sm text-[var(--color-text-muted)] mb-2">Input Text</label>
          <input
            v-model="encodeInput"
            class="w-full bg-[var(--color-void-card)] border border-[var(--color-void-border)] text-[var(--color-text-primary)] p-3 rounded text-sm outline-none focus:border-[var(--color-neon-cyan)]"
            placeholder="Type something..."
          />
        </div>

        <!-- Char breakdown -->
        <div v-if="encodeInput" class="space-y-6">
          <!-- Base64 result -->
          <div class="p-4 bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded">
            <div class="text-xs text-[var(--color-text-muted)] mb-1">Base64 Output</div>
            <div class="text-[var(--color-neon-green)] break-all text-sm">{{ base64Result }}</div>
          </div>

          <!-- Byte groups visual -->
          <div>
            <div class="text-sm text-[var(--color-text-muted)] mb-3">Byte → Base64 Mapping (3 bytes = 4 Base64 chars)</div>
            <div class="flex flex-wrap gap-3">
              <div
                v-for="(group, gi) in byteGroups"
                :key="gi"
                class="border rounded p-3"
                :style="{ borderColor: groupColors[gi % groupColors.length] }"
              >
                <!-- Bytes row -->
                <div class="flex gap-1 mb-2">
                  <div
                    v-for="(byte, bi) in group.bytes"
                    :key="bi"
                    class="text-center"
                  >
                    <div class="text-[9px] text-[var(--color-text-muted)]">{{ group.chars[bi] || '' }}</div>
                    <div
                      class="px-1 py-0.5 rounded text-[10px] font-bold mb-1"
                      :style="{ background: groupColors[gi % groupColors.length] + '33', color: groupColors[gi % groupColors.length] }"
                    >
                      {{ byte.toString(16).padStart(2, '0').toUpperCase() }}
                    </div>
                    <div class="text-[9px] text-[var(--color-text-muted)]">{{ byte.toString(2).padStart(8, '0') }}</div>
                  </div>
                  <!-- Padding indicators -->
                  <div v-for="p in group.padding" :key="'p'+p" class="text-center opacity-30">
                    <div class="text-[9px] text-[var(--color-text-muted)]">&nbsp;</div>
                    <div class="px-1 py-0.5 rounded text-[10px] border border-dashed border-gray-600">00</div>
                    <div class="text-[9px] text-[var(--color-text-muted)]">00000000</div>
                  </div>
                </div>
                <!-- Arrow -->
                <div class="text-center text-[var(--color-text-muted)] text-xs mb-2">↓ 6-bit groups ↓</div>
                <!-- Base64 chars -->
                <div class="flex gap-1 justify-center">
                  <div
                    v-for="(ch, ci) in group.b64chars"
                    :key="ci"
                    class="w-7 h-7 flex items-center justify-center rounded text-sm font-bold"
                    :style="{ background: groupColors[gi % groupColors.length] + '22', color: groupColors[gi % groupColors.length] }"
                  >
                    {{ ch }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Unicode code points table -->
          <div>
            <div class="text-sm text-[var(--color-text-muted)] mb-2">Unicode Code Points & UTF-8 Bytes</div>
            <div class="overflow-x-auto">
              <table class="text-xs border-collapse w-full">
                <thead>
                  <tr class="text-[var(--color-text-muted)]">
                    <th class="text-left px-2 py-1 border-b border-[var(--color-void-border)]">Char</th>
                    <th class="text-left px-2 py-1 border-b border-[var(--color-void-border)]">Code Point</th>
                    <th class="text-left px-2 py-1 border-b border-[var(--color-void-border)]">UTF-8 Bytes (hex)</th>
                    <th class="text-left px-2 py-1 border-b border-[var(--color-void-border)]">Binary</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(info, i) in charInfos" :key="i" class="hover:bg-[var(--color-void-card)]">
                    <td class="px-2 py-1 text-[var(--color-neon-cyan)] font-bold">{{ info.char }}</td>
                    <td class="px-2 py-1 text-[var(--color-neon-green)]">U+{{ info.codePoint }}</td>
                    <td class="px-2 py-1">
                      <span
                        v-for="(b, bi) in info.utf8"
                        :key="bi"
                        class="inline-block mr-1 px-1 rounded text-black text-[10px] font-bold"
                        :style="{ background: byteHighlightColor(i, bi) }"
                      >{{ b }}</span>
                    </td>
                    <td class="px-2 py-1 text-[var(--color-text-muted)] text-[10px]">{{ info.binary }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Decode Mode -->
      <div v-else>
        <div class="mb-4">
          <label class="block text-sm text-[var(--color-text-muted)] mb-2">Base64 Input</label>
          <input
            v-model="decodeInput"
            class="w-full bg-[var(--color-void-card)] border border-[var(--color-void-border)] text-[var(--color-text-primary)] p-3 rounded text-sm outline-none focus:border-[var(--color-neon-cyan)]"
            placeholder="Enter Base64 string..."
          />
        </div>

        <div v-if="decodeInput">
          <div v-if="decodeError" class="text-red-400 text-sm mb-4">{{ decodeError }}</div>
          <div v-else class="space-y-4">
            <div class="p-4 bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded">
              <div class="text-xs text-[var(--color-text-muted)] mb-1">Decoded Text</div>
              <div class="text-[var(--color-neon-green)] break-all">{{ decodeText }}</div>
            </div>
            <div class="p-4 bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded">
              <div class="text-xs text-[var(--color-text-muted)] mb-2">Raw Bytes (hex)</div>
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="(b, i) in decodeBytes"
                  :key="i"
                  class="px-1.5 py-0.5 rounded text-[11px] font-bold"
                  :style="{ background: groupColors[Math.floor(i/3) % groupColors.length] + '33', color: groupColors[Math.floor(i/3) % groupColors.length] }"
                >{{ b }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `Base64 Visual | ${siteName}` })
const mode = ref<'encode' | 'decode'>('encode')
const encodeInput = ref('Hello')
const decodeInput = ref('')

const groupColors = ['#00d4ff', '#39ff14', '#ff6b6b', '#ffd700', '#da70d6']

const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function toUtf8Bytes(str: string): number[] {
  const bytes: number[] = []
  for (let i = 0; i < str.length; ) {
    const cp = str.codePointAt(i)!
    if (cp < 0x80) bytes.push(cp)
    else if (cp < 0x800) { bytes.push(0xc0 | (cp >> 6)); bytes.push(0x80 | (cp & 0x3f)) }
    else if (cp < 0x10000) { bytes.push(0xe0 | (cp >> 12)); bytes.push(0x80 | ((cp >> 6) & 0x3f)); bytes.push(0x80 | (cp & 0x3f)) }
    else { bytes.push(0xf0 | (cp >> 18)); bytes.push(0x80 | ((cp >> 12) & 0x3f)); bytes.push(0x80 | ((cp >> 6) & 0x3f)); bytes.push(0x80 | (cp & 0x3f)) }
    i += cp > 0xffff ? 2 : 1
  }
  return bytes
}

interface CharInfo {
  char: string
  codePoint: string
  utf8: string[]
  binary: string
  byteOffset: number
}

const charInfos = computed<CharInfo[]>(() => {
  const result: CharInfo[] = []
  let offset = 0
  for (let i = 0; i < encodeInput.value.length; ) {
    const cp = encodeInput.value.codePointAt(i)!
    const ch = String.fromCodePoint(cp)
    const bytes = toUtf8Bytes(ch)
    result.push({
      char: ch,
      codePoint: cp.toString(16).toUpperCase().padStart(4, '0'),
      utf8: bytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')),
      binary: bytes.map(b => b.toString(2).padStart(8, '0')).join(' '),
      byteOffset: offset
    })
    offset += bytes.length
    i += cp > 0xffff ? 2 : 1
  }
  return result
})

const allBytes = computed(() => {
  const bytes: number[] = []
  for (const info of charInfos.value) {
    for (const h of info.utf8) bytes.push(parseInt(h, 16))
  }
  return bytes
})

interface ByteGroup {
  bytes: number[]
  chars: string[]
  padding: number[]
  b64chars: string[]
}

const byteGroups = computed<ByteGroup[]>(() => {
  const bytes = allBytes.value
  const groups: ByteGroup[] = []
  // Map byte index to char
  const byteToChar: string[] = []
  for (const info of charInfos.value) {
    for (let j = 0; j < info.utf8.length; j++) byteToChar.push(info.char)
  }

  for (let i = 0; i < bytes.length; i += 3) {
    const chunk = bytes.slice(i, i + 3)
    const pad = 3 - chunk.length
    const paddedChunk = [...chunk, ...Array(pad).fill(0)]
    const n = (paddedChunk[0] << 16) | (paddedChunk[1] << 8) | paddedChunk[2]
    const b64 = [
      B64_CHARS[(n >> 18) & 63],
      B64_CHARS[(n >> 12) & 63],
      pad > 1 ? '=' : B64_CHARS[(n >> 6) & 63],
      pad > 0 ? '=' : B64_CHARS[n & 63]
    ]
    groups.push({
      bytes: chunk,
      chars: chunk.map((_, bi) => byteToChar[i + bi] || ''),
      padding: Array(pad).fill(0).map((_, k) => k),
      b64chars: b64
    })
  }
  return groups
})

const base64Result = computed(() => {
  if (!encodeInput.value) return ''
  try { return btoa(unescape(encodeURIComponent(encodeInput.value))) } catch { return '' }
})

function byteHighlightColor(charIdx: number, byteIdx: number): string {
  const globalByteIdx = charInfos.value.slice(0, charIdx).reduce((s, c) => s + c.utf8.length, 0) + byteIdx
  const groupIdx = Math.floor(globalByteIdx / 3)
  return groupColors[groupIdx % groupColors.length]
}

// Decode
const decodeError = ref('')
const decodeText = ref('')
const decodeBytes = ref<string[]>([])

watch(decodeInput, (val) => {
  if (!val) { decodeError.value = ''; decodeText.value = ''; decodeBytes.value = []; return }
  try {
    const binary = atob(val)
    const bytes = Array.from(binary).map(c => c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0'))
    decodeBytes.value = bytes
    decodeText.value = decodeURIComponent(escape(binary))
    decodeError.value = ''
  } catch (e: any) {
    decodeError.value = 'Invalid Base64: ' + e.message
    decodeText.value = ''
    decodeBytes.value = []
  }
})
</script>
