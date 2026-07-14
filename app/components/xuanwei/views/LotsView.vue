<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { drawLot } from '@/engine/knowledge/lots'
import type { SymbolMatrix } from '@/engine/types'

const matrix = shallowRef<SymbolMatrix | null>(null)
const lotNumber = computed(() => Number(matrix.value?.symbols[0]?.attributes.number ?? 0))
const level = computed(() => matrix.value?.derivedTags.find(tag => tag.category === 'lotLevel')?.name ?? '')
function draw() { matrix.value = drawLot(Date.now()) }
</script>

<template><section class="xw-page xw-page-narrow"><header><h1>抽签解签</h1><p>观音灵签规则随机抽取</p></header><div class="xw-stack"><XuanweiPanel v-if="!matrix"><button class="xw-draw" type="button" @click="draw"><span aria-hidden="true">签</span><strong>抽取一支签</strong><small>先在心中明确所问之事</small></button></XuanweiPanel><template v-else><XuanweiPanel><div class="xw-lot-heading"><span>第 {{ lotNumber }} 签</span><strong :class="{ 'xw-positive-text': level.includes('上'), 'xw-negative-text': level.includes('下') }">{{ level }}</strong></div><hr class="xw-divider"><div class="xw-reading-list xw-centered"><p v-for="item in matrix.interpretations" :key="item.id" class="xw-interpretation">{{ item.text }}</p></div></XuanweiPanel><button class="xw-action xw-action-secondary" type="button" @click="matrix = null">返回后再抽</button></template><XuanweiNotice tone="warning">随机抽签仅供传统文化研究与娱乐参考。</XuanweiNotice></div></section></template>
