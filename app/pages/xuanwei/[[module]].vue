<script setup lang="ts">
import { xuanweiModuleMap } from '~/features/xuanwei/modules'

const route = useRoute()
const moduleSlug = computed(() => typeof route.params.module === 'string' ? route.params.module : undefined)

if (moduleSlug.value && !xuanweiModuleMap.has(moduleSlug.value)) {
  throw createError({ statusCode: 404, statusMessage: '未找到这个玄微模块' })
}

const moduleInfo = computed(() => moduleSlug.value ? xuanweiModuleMap.get(moduleSlug.value) : undefined)
useSeoMeta({
  title: computed(() => `${moduleInfo.value?.name ?? '玄微'} | void.dev`),
  description: computed(() => moduleInfo.value?.description ?? '融合十五种东西方术数体系的规则引擎，仅供文化研究与娱乐参考。'),
  robots: 'noindex, follow',
})
</script>

<template>
  <XuanweiShell :module="moduleSlug" />
</template>
