<template>
  <aside
    class="w-80 shrink-0 p-3 border-l overflow-y-auto"
    style="border-color:var(--color-void-border);background:var(--color-void-card)"
  >
    <!-- Runtime 状态 -->
    <div class="text-xs font-mono font-bold mb-2" style="color:var(--color-neon-cyan)">Runtime</div>
    <div
      class="rounded-lg border p-3 text-xs font-mono"
      style="border-color:var(--color-void-border);background:rgba(255,255,255,0.02);color:var(--color-text-muted)"
    >
      <div>nodes: <span style="color:#e7f7ff">{{ nodeCount }}</span></div>
      <div>wires: <span style="color:#e7f7ff">{{ wireCount }}</span></div>
      <div>groups: <span style="color:#e7f7ff">{{ groupCount }}</span></div>
      <div>selected: <span style="color:#e7f7ff">{{ selectedCount }}</span></div>
      <div>history: <span style="color:#e7f7ff">{{ historyPast }}</span> / <span style="color:#e7f7ff">{{ historyFuture }}</span></div>
      <div>view: <span style="color:#e7f7ff">{{ viewScale }}%</span></div>
      <div>autosave: <span style="color:#e7f7ff">{{ saveState }}</span></div>
      <div class="mt-2" style="color:#c9f8d8">{{ lastRunSummary }}</div>
      <div v-if="globalError" class="mt-2" style="color:#ff7878">{{ globalError }}</div>
    </div>

    <!-- Execution Log -->
    <div class="text-xs font-mono font-bold mt-4 mb-2" style="color:var(--color-neon-cyan)">Execution Log</div>
    <div class="rounded-lg border p-3" style="border-color:var(--color-void-border);background:rgba(255,255,255,0.02)">
      <div v-if="runLog.length === 0" class="text-[10px] font-mono" style="color:var(--color-text-muted)">
        还没跑，点一下 Run。
      </div>
      <div
        v-for="(line, idx) in runLog"
        :key="idx"
        class="text-[10px] font-mono leading-5 break-all"
        :style="line.startsWith('✗') ? 'color:#ff7878' : line.startsWith('↷') ? 'color:#ffd166' : 'color:#c9f8d8'"
      >
        {{ line }}
      </div>
    </div>

    <!-- Mermaid Export -->
    <div class="text-xs font-mono font-bold mt-4 mb-2" style="color:var(--color-neon-cyan)">Mermaid Export</div>
    <textarea
      :value="mermaidCode"
      readonly
      rows="10"
      class="w-full rounded-lg border p-3 text-[10px] font-mono resize-none"
      style="border-color:var(--color-void-border);background:#0f1320;color:#d9f3ff"
    />

    <!-- JSON Export / Import -->
    <div class="text-xs font-mono font-bold mt-4 mb-2" style="color:var(--color-neon-cyan)">JSON Export / Import</div>
    <textarea
      :value="graphJson"
      readonly
      rows="10"
      class="w-full rounded-lg border p-3 text-[10px] font-mono resize-none"
      style="border-color:var(--color-void-border);background:#0f1320;color:#d9f3ff"
    />
    <textarea
      :value="importJsonValue"
      rows="8"
      placeholder="把之前导出的 JSON 粘贴到这里，然后点 Import JSON"
      class="w-full rounded-lg border p-3 text-[10px] font-mono resize-none mt-2"
      style="border-color:var(--color-void-border);background:#0f1320;color:#d9f3ff"
      @input="$emit('update:importJsonValue', ($event.target as HTMLTextAreaElement).value)"
    />
    <div class="flex gap-2 mt-2">
      <button
        class="flex-1 px-3 py-2 rounded border text-[10px] font-mono transition-all"
        style="border-color:#00d4ff;color:#9aeaff;background:rgba(0,212,255,0.08)"
        @click="$emit('importJson', importJsonValue)"
      >Import JSON</button>
      <button
        class="px-3 py-2 rounded border text-[10px] font-mono transition-all"
        style="border-color:var(--color-void-border);color:var(--color-text-muted)"
        @click="$emit('loadExport')"
      >Load Export</button>
    </div>

    <!-- 说明 -->
    <div class="text-xs font-mono font-bold mt-4 mb-2" style="color:var(--color-neon-cyan)">这轮增强</div>
    <div class="text-[10px] font-mono leading-5" style="color:var(--color-text-muted)">
      - Zoom / Pan / Fit / Reset Zoom<br>
      - Minimap + 点击跳转视口<br>
      - 框选 / 多选 / 批量拖动 / Duplicate<br>
      - Auto Layout + Local Autosave / Restore<br>
      - JSON Export / Import<br>
      - Undo / Redo + Arrow-key Nudge<br>
      - Group 容器 + Quick Add 搜索建节点
    </div>

    <div class="text-xs font-mono font-bold mt-4 mb-2" style="color:var(--color-neon-cyan)">玩法说明</div>
    <div class="text-[10px] font-mono leading-5" style="color:var(--color-text-muted)">
      1. 左侧拖节点到画布。<br>
      2. 从节点右侧输出端口拉线到目标左侧输入端口。<br>
      3. Wheel 缩放；Alt/Space + Drag 平移视图。<br>
      4. 在空白区拖拽可框选多个节点，然后一起移动。<br>
      5. Tab 打开 Quick Add；Ctrl/Cmd + G 可把选中节点编组。<br>
      6. 当前执行器只支持 DAG，不支持环。
    </div>
  </aside>
</template>

<script setup lang="ts">
defineProps<{
  nodeCount: number
  wireCount: number
  groupCount: number
  selectedCount: number
  historyPast: number
  historyFuture: number
  viewScale: number
  saveState: string
  lastRunSummary: string
  globalError: string
  runLog: string[]
  graphJson: string
  mermaidCode: string
  importJsonValue: string
}>()

defineEmits<{
  (e: 'importJson', json: string): void
  (e: 'loadExport'): void
  (e: 'update:importJsonValue', val: string): void
}>()
</script>
