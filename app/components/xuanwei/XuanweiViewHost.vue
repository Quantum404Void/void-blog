<script setup lang="ts">
const props = defineProps<{ module: string }>()

const views = {
  bazi: defineAsyncComponent(() => import('./views/BaziView.vue')),
  ziwei: defineAsyncComponent(() => import('./views/ZiweiView.vue')),
  astrology: defineAsyncComponent(() => import('./views/AstrologyView.vue')),
  nameology: defineAsyncComponent(() => import('./views/NameologyView.vue')),
  chenggu: defineAsyncComponent(() => import('./views/ChengguView.vue')),
  liuyao: defineAsyncComponent(() => import('./views/LiuyaoView.vue')),
  meihua: defineAsyncComponent(() => import('./views/MeihuaView.vue')),
  qimen: defineAsyncComponent(() => import('./views/QimenView.vue')),
  daliuren: defineAsyncComponent(() => import('./views/DaliurenView.vue')),
  iching: defineAsyncComponent(() => import('./views/IchingView.vue')),
  tarot: defineAsyncComponent(() => import('./views/TarotView.vue')),
  lots: defineAsyncComponent(() => import('./views/LotsView.vue')),
  fengshui: defineAsyncComponent(() => import('./views/FengshuiView.vue')),
  mianxiang: defineAsyncComponent(() => import('./views/MianxiangView.vue')),
  dream: defineAsyncComponent(() => import('./views/DreamView.vue')),
} as const

const activeView = computed(() => views[props.module as keyof typeof views])
</script>

<template>
  <Suspense>
    <component :is="activeView" v-if="activeView" />
    <template #fallback>
      <div class="xw-view-loading" role="status">正在载入推演模块…</div>
    </template>
  </Suspense>
</template>

<style scoped>
.xw-view-loading { min-height: 20rem; padding: 4rem 1rem; color: var(--color-text-muted); text-align: center; }
</style>
