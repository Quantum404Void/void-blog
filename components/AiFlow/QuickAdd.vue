<template>
  <div
    v-if="open"
    class="absolute left-1/2 top-6 -translate-x-1/2 rounded-2xl border p-3"
    style="width:420px;border-color:rgba(255,255,255,0.08);background:rgba(7,10,18,0.96);backdrop-filter:blur(8px);z-index:90"
  >
    <div class="text-xs font-mono mb-2" style="color:var(--color-neon-cyan)">Quick Add · Tab</div>
    <input
      :value="query"
      autofocus
      type="text"
      placeholder="搜节点：map / branch / json / preview..."
      class="w-full rounded-lg border px-3 py-2 text-xs font-mono"
      style="border-color:rgba(255,255,255,0.08);background:#0f1320;color:#e7f7ff"
      @input="$emit('update:query', ($event.target as HTMLInputElement).value)"
    >
    <div class="mt-2 max-h-80 overflow-y-auto">
      <button
        v-for="item in items"
        :key="item.type"
        class="w-full text-left rounded-lg border p-3 mb-2 transition-all"
        :style="`border-color:${item.spec.color}33;background:${item.spec.color}12`"
        @click="$emit('select', item.type)"
      >
        <div class="flex items-center gap-2">
          <span>{{ item.spec.icon }}</span>
          <span class="text-xs font-mono font-bold" :style="`color:${item.spec.color}`">{{ item.spec.title }}</span>
          <span class="text-[10px] font-mono ml-auto" style="color:var(--color-text-muted)">{{ item.spec.category }}</span>
        </div>
        <div class="text-[10px] font-mono mt-1" style="color:var(--color-text-muted)">
          {{ item.type }} · {{ item.spec.description }}
        </div>
      </button>
      <div v-if="items.length === 0" class="text-[10px] font-mono p-3" style="color:var(--color-text-muted)">
        没搜到，换个关键词试试。
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NodeSpec } from '~/types/ai-flow'

defineProps<{
  open: boolean
  query: string
  items: Array<{ type: string; spec: NodeSpec }>
}>()

defineEmits<{
  (e: 'update:query', val: string): void
  (e: 'select', type: string): void
  (e: 'close'): void
}>()
</script>
