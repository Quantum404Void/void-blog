<template>
  <div
    class="px-4 pt-3 pb-2 flex flex-wrap gap-2 items-center border-b"
    style="border-color:var(--color-void-border)"
  >
    <div class="text-sm font-mono font-bold" style="color:var(--color-neon-cyan)">AI Flow / Executable Flowchart</div>
    <div class="text-xs font-mono" style="color:var(--color-text-muted)">
      带 Zoom / Pan / Minimap / 框选，多输入和分支。
    </div>

    <button
      class="ml-auto px-3 py-1.5 rounded border text-xs font-mono transition-all"
      style="border-color:#00d4ff;color:#9aeaff;background:rgba(0,212,255,0.08)"
      @click="$emit('quickAdd')"
    >+ Node</button>

    <button
      class="px-3 py-1.5 rounded border text-xs font-mono transition-all"
      style="border-color:#39ff14;color:#39ff14;background:rgba(57,255,20,0.08)"
      @click="$emit('run')"
    >▶ Run</button>

    <button
      class="px-3 py-1.5 rounded border text-xs font-mono transition-all"
      style="border-color:var(--color-void-border);color:var(--color-text-muted)"
      @click="$emit('fitView')"
    >Fit</button>

    <button
      class="px-3 py-1.5 rounded border text-xs font-mono transition-all"
      style="border-color:var(--color-void-border);color:var(--color-text-muted)"
      @click="$emit('autoLayout')"
    >Auto Layout</button>

    <button
      class="px-3 py-1.5 rounded border text-xs font-mono transition-all"
      style="border-color:var(--color-void-border);color:var(--color-text-muted)"
      @click="$emit('resetZoom')"
    >100%</button>

    <button
      class="px-3 py-1.5 rounded border text-xs font-mono transition-all"
      :style="canUndo
        ? 'border-color:#f59e0b;color:#fcd34d;background:rgba(245,158,11,0.08)'
        : 'border-color:var(--color-void-border);color:var(--color-text-muted)'"
      @click="$emit('undo')"
    >Undo</button>

    <button
      class="px-3 py-1.5 rounded border text-xs font-mono transition-all"
      :style="canRedo
        ? 'border-color:#f59e0b;color:#fcd34d;background:rgba(245,158,11,0.08)'
        : 'border-color:var(--color-void-border);color:var(--color-text-muted)'"
      @click="$emit('redo')"
    >Redo</button>

    <button
      class="px-3 py-1.5 rounded border text-xs font-mono transition-all"
      style="border-color:var(--color-void-border);color:var(--color-text-muted)"
      @click="$emit('clear')"
    >Clear</button>

    <button
      class="px-3 py-1.5 rounded border text-xs font-mono transition-all"
      :style="hasSelection
        ? 'border-color:#ff6b6b;color:#ff8f8f;background:rgba(255,107,107,0.08)'
        : 'border-color:var(--color-void-border);color:var(--color-text-muted)'"
      @click="$emit('deleteSelected')"
    >Delete Selected</button>

    <button
      class="px-3 py-1.5 rounded border text-xs font-mono transition-all"
      :style="hasSelection
        ? 'border-color:#22c55e;color:#bbf7d0;background:rgba(34,197,94,0.08)'
        : 'border-color:var(--color-void-border);color:var(--color-text-muted)'"
      @click="$emit('group')"
    >Group</button>

    <button
      class="px-3 py-1.5 rounded border text-xs font-mono transition-all"
      :style="hasSelection
        ? 'border-color:#8b5cf6;color:#c4b5fd;background:rgba(139,92,246,0.08)'
        : 'border-color:var(--color-void-border);color:var(--color-text-muted)'"
      @click="$emit('duplicate')"
    >Duplicate</button>

    <button
      class="px-3 py-1.5 rounded border text-xs font-mono transition-all"
      style="border-color:var(--color-void-border);color:var(--color-text-muted)"
      @click="$emit('copyMermaid')"
    >Copy Mermaid</button>

    <button
      class="px-3 py-1.5 rounded border text-xs font-mono transition-all"
      style="border-color:var(--color-void-border);color:var(--color-text-muted)"
      @click="$emit('copyJson')"
    >Copy JSON</button>

    <button
      class="px-2 py-1.5 rounded border text-xs font-mono transition-all"
      :style="snapToGrid
        ? 'border-color:rgba(0,255,136,0.4);color:var(--color-neon-green)'
        : 'border-color:rgba(100,100,150,0.3);color:var(--color-text-muted)'"
      title="网格对齐 (G)"
      @click="$emit('toggleSnap')"
    >⊞</button>

    <button
      class="px-2 py-1.5 rounded border text-xs font-mono transition-all"
      style="border-color:rgba(100,100,150,0.3);color:var(--color-text-muted)"
      title="快捷键帮助 (?)"
      @click="$emit('help')"
    >?</button>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'AiFlowToolbar' })

defineProps<{
  hasSelection: boolean
  canUndo: boolean
  canRedo: boolean
  snapToGrid: boolean
}>()

defineEmits<{
  (e: 'run'): void
  (e: 'fitView'): void
  (e: 'resetZoom'): void
  (e: 'autoLayout'): void
  (e: 'undo'): void
  (e: 'redo'): void
  (e: 'clear'): void
  (e: 'deleteSelected'): void
  (e: 'duplicate'): void
  (e: 'group'): void
  (e: 'copyMermaid'): void
  (e: 'copyJson'): void
  (e: 'quickAdd'): void
  (e: 'help'): void
  (e: 'toggleSnap'): void
}>()
</script>
