<template>
  <div
    class="minimap-box absolute right-4 bottom-4 rounded-xl border p-2"
    style="width:240px;border-color:rgba(255,255,255,0.08);background:rgba(7,10,18,0.88);backdrop-filter:blur(4px);z-index:80"
  >
    <div class="flex items-center justify-between mb-2">
      <div class="text-[10px] font-mono" style="color:var(--color-neon-cyan)">minimap</div>
      <div class="text-[10px] font-mono" style="color:var(--color-text-muted)">{{ viewScale }}%</div>
    </div>
    <div
      class="relative rounded-md overflow-hidden cursor-pointer"
      :style="`width:${MINIMAP_W}px;height:${MINIMAP_H}px;background:#0c101b;border:1px solid rgba(255,255,255,0.06)`"
      @click.stop="$emit('click', $event)"
    >
      <div
        v-for="node in nodes"
        :key="`mini-${node.id}`"
        class="absolute rounded-sm"
        :style="`
          left:${(node.x / STAGE_W) * MINIMAP_W}px;
          top:${(node.y / STAGE_H) * MINIMAP_H}px;
          width:${Math.max(8, (NODE_W / STAGE_W) * MINIMAP_W)}px;
          height:${Math.max(6, (nodeHeightFn(node) / STAGE_H) * MINIMAP_H)}px;
          background:${isSelectedFn(node.id) ? '#00d4ff' : nodeColorFn(node.type)};
          opacity:0.85;
        `"
      />
      <div
        class="absolute border rounded-sm pointer-events-none"
        :style="{ ...viewportStyle, borderColor: '#ffffff88', background: 'rgba(255,255,255,0.06)' }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FlowNode } from '~/types/ai-flow'

const MINIMAP_W = 220
const MINIMAP_H = 140
const STAGE_W = 3200
const STAGE_H = 2000
const NODE_W = 260

defineProps<{
  nodes: FlowNode[]
  viewScale: number
  viewportStyle: Record<string, string>
  nodeColorFn: (type: string) => string
  nodeHeightFn: (node: FlowNode) => number
  isSelectedFn: (id: string) => boolean
}>()

defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()
</script>
