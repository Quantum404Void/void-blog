<template>
  <aside
    class="w-72 shrink-0 p-3 border-r overflow-y-auto"
    style="border-color:var(--color-void-border);background:var(--color-void-card)"
  >
    <!-- 简介 -->
    <div class="text-[10px] font-mono leading-5 p-2 mb-1" style="color:var(--color-text-muted)">
      拖节点到画布；从右端口拉线；Wheel 缩放；Space+拖 平移；框选多节点。
      <button class="text-[var(--color-neon-cyan)] hover:underline ml-1" @click="$emit('openHelp')">查看全部快捷键 →</button>
    </div>

    <!-- Presets -->
    <div class="mt-4 mb-2 text-xs font-mono font-bold" style="color:var(--color-neon-cyan)">Presets</div>
    <button
      v-for="preset in presets"
      :key="preset.key"
      class="w-full text-left rounded-lg border p-3 mb-2 transition-all"
      :style="selectedPreset === preset.key
        ? 'border-color:#00d4ff;background:rgba(0,212,255,0.08);color:#e6faff'
        : 'border-color:var(--color-void-border);background:rgba(255,255,255,0.02);color:var(--color-text-primary)'"
      @click="$emit('loadPreset', preset.key)"
    >
      <div class="text-xs font-mono font-bold">{{ preset.label }}</div>
      <div class="text-[10px] font-mono mt-1" style="color:var(--color-text-muted)">{{ preset.desc }}</div>
    </button>

    <!-- Node Palette -->
    <div class="mt-4 mb-2 text-xs font-mono font-bold" style="color:var(--color-neon-cyan)">Node Palette</div>
    <div v-for="(items, category) in groupedSpecs" :key="category" class="mb-4">
      <div class="text-[11px] font-mono mb-2 uppercase tracking-wide" style="color:var(--color-text-muted)">
        {{ category }}
      </div>
      <div
        v-for="item in items"
        :key="item.type"
        draggable="true"
        class="rounded-lg border p-3 mb-2 cursor-grab active:cursor-grabbing transition-all"
        :style="`border-color:${item.spec.color}44;background:${item.spec.color}12`"
        @dragstart="$emit('dragStart', $event, item.type)"
      >
        <div class="flex items-center gap-2">
          <span>{{ item.spec.icon }}</span>
          <span class="text-xs font-mono font-bold" :style="`color:${item.spec.color}`">{{ item.spec.title }}</span>
        </div>
        <div class="text-[10px] font-mono mt-1" style="color:var(--color-text-muted)">{{ item.spec.description }}</div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { NodeSpec, Preset } from '~/types/ai-flow'

defineProps<{
  groupedSpecs: Record<string, Array<{ type: string; spec: NodeSpec }>>
  presets: Preset[]
  selectedPreset: string
}>()

defineEmits<{
  (e: 'loadPreset', key: string): void
  (e: 'dragStart', event: DragEvent, type: string): void
  (e: 'openHelp'): void
}>()
</script>
