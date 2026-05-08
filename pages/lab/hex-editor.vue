<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'hex-editor' }]" />
    <div class="max-w-5xl mx-auto px-6 py-10">
      <h1 class="font-mono text-xl font-bold mb-1" style="color:rgba(57,255,20,0.9)">Hex Editor</h1>
      <p class="font-mono text-xs text-[var(--color-text-muted)] mb-6">十六进制编辑器 — 查看与编辑二进制数据</p>

      <!-- Toolbar -->
      <div class="flex gap-2 flex-wrap mb-6">
        <button @click="loadExample" class="font-mono text-xs px-3 py-2 rounded-lg border border-[rgba(57,255,20,0.4)] text-[rgba(57,255,20,0.9)] hover:bg-[rgba(57,255,20,0.1)] transition-all">加载示例</button>
        <button @click="triggerPaste" class="font-mono text-xs px-3 py-2 rounded-lg border border-[rgba(0,212,255,0.4)] text-[rgba(0,212,255,0.9)] hover:bg-[rgba(0,212,255,0.1)] transition-all">粘贴文本</button>
        <label class="font-mono text-xs px-3 py-2 rounded-lg border border-[rgba(180,0,255,0.4)] text-[rgba(180,0,255,0.9)] hover:bg-[rgba(180,0,255,0.1)] transition-all cursor-pointer">
          上传文件
          <input type="file" class="hidden" @change="onFileUpload" ref="fileInputRef">
        </label>
        <button @click="downloadFile" :disabled="bytes.length === 0" class="font-mono text-xs px-3 py-2 rounded-lg border border-[rgba(255,165,0,0.4)] text-[rgba(255,165,0,0.9)] hover:bg-[rgba(255,165,0,0.1)] transition-all disabled:opacity-30">下载文件</button>
      </div>

      <!-- Paste text modal -->
      <div v-if="showPaste" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50" @click.self="showPaste=false">
        <div class="bg-[#0d0d14] border border-[rgba(0,212,255,0.3)] rounded-xl p-6 w-full max-w-md">
          <h3 class="font-mono text-sm text-[rgba(0,212,255,0.9)] mb-3">粘贴文本</h3>
          <textarea v-model="pasteText" class="w-full font-mono text-sm bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg p-3 text-[var(--color-text-primary)] outline-none resize-none" rows="6" placeholder="输入或粘贴文本..."></textarea>
          <div class="flex gap-2 mt-3">
            <button @click="confirmPaste" class="font-mono text-xs px-4 py-2 rounded-lg bg-[rgba(0,212,255,0.15)] border border-[rgba(0,212,255,0.4)] text-[rgba(0,212,255,0.9)] hover:bg-[rgba(0,212,255,0.25)] transition-all">确认</button>
            <button @click="showPaste=false" class="font-mono text-xs px-4 py-2 rounded-lg border border-[var(--color-void-border)] text-[var(--color-text-muted)] hover:bg-[rgba(255,255,255,0.05)] transition-all">取消</button>
          </div>
        </div>
      </div>

      <!-- Hex view -->
      <div v-if="bytes.length > 0" class="border border-[var(--color-void-border)] rounded-xl overflow-hidden bg-[var(--color-void-card)]">
        <div class="grid font-mono text-xs border-b border-[var(--color-void-border)] px-4 py-2 text-[var(--color-text-muted)] select-none" style="grid-template-columns: 80px 1fr 1fr">
          <span>偏移量</span>
          <span>十六进制</span>
          <span>ASCII</span>
        </div>
        <div class="overflow-y-auto max-h-[480px]">
          <div
            v-for="(row, ri) in rows"
            :key="ri"
            class="grid px-4 py-[2px] hover:bg-[rgba(255,255,255,0.03)] transition-colors"
            style="grid-template-columns: 80px 1fr 1fr"
          >
            <!-- Offset -->
            <span class="font-mono text-[11px] select-none" style="color:rgba(57,255,20,0.8)">
              {{ (ri * 16).toString(16).padStart(8, '0') }}
            </span>
            <!-- Hex bytes -->
            <div class="flex flex-wrap gap-x-1">
              <template v-for="(byte, ci) in row" :key="ci">
                <span v-if="ci === 8" class="text-[var(--color-text-muted)] select-none">·</span>
                <span
                  v-if="editingIdx !== ri*16+ci"
                  @click="startEdit(ri*16+ci)"
                  class="font-mono text-[11px] cursor-pointer px-[2px] rounded transition-colors"
                  :class="selectedIdx === ri*16+ci ? 'bg-[rgba(57,255,20,0.25)]' : 'hover:bg-[rgba(57,255,20,0.1)]'"
                  :style="selectedIdx === ri*16+ci ? 'color:rgba(57,255,20,1)' : 'color:rgba(57,255,20,0.7)'"
                >{{ byte.toString(16).padStart(2, '0') }}</span>
                <input
                  v-else
                  :ref="el => { if(el) editInputRef = el as HTMLInputElement }"
                  v-model="editVal"
                  @blur="commitEdit(ri*16+ci)"
                  @keydown.enter="commitEdit(ri*16+ci)"
                  @keydown.escape="editingIdx=-1"
                  maxlength="2"
                  class="font-mono text-[11px] w-7 bg-[rgba(57,255,20,0.2)] border border-[rgba(57,255,20,0.6)] rounded outline-none text-center"
                  style="color:rgba(57,255,20,1)"
                >
              </template>
            </div>
            <!-- ASCII -->
            <div class="flex">
              <span
                v-for="(byte, ci) in row"
                :key="ci"
                @click="selectedIdx = ri*16+ci"
                class="font-mono text-[11px] cursor-pointer w-[11px] text-center rounded transition-colors"
                :class="selectedIdx === ri*16+ci ? 'bg-[rgba(0,212,255,0.25)]' : 'hover:bg-[rgba(0,212,255,0.1)]'"
                :style="selectedIdx === ri*16+ci ? 'color:rgba(0,212,255,1)' : byte >= 32 && byte < 127 ? 'color:rgba(0,212,255,0.7)' : 'color:rgba(255,255,255,0.2)'"
              >{{ byte >= 32 && byte < 127 ? String.fromCharCode(byte) : '·' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="border border-dashed border-[var(--color-void-border)] rounded-xl p-16 text-center">
        <p class="font-mono text-sm text-[var(--color-text-muted)]">暂无数据 — 点击「加载示例」或上传文件</p>
      </div>

      <!-- Status bar -->
      <div v-if="bytes.length > 0" class="mt-3 flex flex-wrap gap-6 font-mono text-[11px] text-[var(--color-text-muted)] border border-[var(--color-void-border)] rounded-xl px-5 py-3 bg-[var(--color-void-card)]">
        <span>大小: <span class="text-[var(--color-text-primary)]">{{ bytes.length }}</span> 字节</span>
        <template v-if="selectedIdx >= 0 && selectedIdx < bytes.length">
          <span>偏移: <span style="color:rgba(57,255,20,0.9)">0x{{ selectedIdx.toString(16).padStart(4,'0') }}</span></span>
          <span>十进制: <span style="color:rgba(0,212,255,0.9)">{{ bytes[selectedIdx] }}</span></span>
          <span>二进制: <span style="color:rgba(180,0,255,0.9)">{{ bytes[selectedIdx].toString(2).padStart(8,'0') }}</span></span>
          <span>ASCII: <span style="color:rgba(255,165,0,0.9)">{{ bytes[selectedIdx] >= 32 && bytes[selectedIdx] < 127 ? String.fromCharCode(bytes[selectedIdx]) : 'N/A' }}</span></span>
        </template>
        <span v-else class="italic opacity-60">点击字节查看详情</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `Hex Editor | ${siteName}` })

const bytes = ref<number[]>([])
const selectedIdx = ref(-1)
const editingIdx = ref(-1)
const editVal = ref('')
const editInputRef = ref<HTMLInputElement | null>(null)
const showPaste = ref(false)
const pasteText = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)
const fileName = ref('download.bin')

const rows = computed(() => {
  const result: number[][] = []
  for (let i = 0; i < bytes.value.length; i += 16) {
    result.push(bytes.value.slice(i, i + 16))
  }
  return result
})

function loadData(data: Uint8Array, name?: string) {
  bytes.value = Array.from(data)
  selectedIdx.value = -1
  if (name) fileName.value = name
}

function loadExample() {
  loadData(new TextEncoder().encode('Hello, World!\nThis is a hex editor demo.\n0x00 0xFF 0xAA 0x55'), 'example.txt')
}

function triggerPaste() {
  pasteText.value = ''
  showPaste.value = true
}

function confirmPaste() {
  loadData(new TextEncoder().encode(pasteText.value), 'pasted.txt')
  showPaste.value = false
}

function onFileUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 64 * 1024) { alert('文件过大，最大支持 64KB'); return }
  const reader = new FileReader()
  reader.onload = () => {
    loadData(new Uint8Array(reader.result as ArrayBuffer), file.name)
  }
  reader.readAsArrayBuffer(file)
}

function downloadFile() {
  const blob = new Blob([new Uint8Array(bytes.value)])
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName.value
  a.click()
  URL.revokeObjectURL(url)
}

function startEdit(idx: number) {
  selectedIdx.value = idx
  editingIdx.value = idx
  editVal.value = bytes.value[idx].toString(16).padStart(2, '0')
  nextTick(() => editInputRef.value?.select())
}

function commitEdit(idx: number) {
  const v = parseInt(editVal.value, 16)
  if (!isNaN(v) && v >= 0 && v <= 255) {
    bytes.value[idx] = v
  }
  editingIdx.value = -1
}
</script>
