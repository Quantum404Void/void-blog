<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { dreamInterpret } from '@/engine/knowledge/dream'
import type { SymbolMatrix } from '@/engine/types'

const keyword = shallowRef('')
const matrix = shallowRef<SymbolMatrix | null>(null)
const errorMessage = shallowRef('')
const resultLabel = computed(() => keyword.value.trim() || '梦境')

function search() {
  const value = keyword.value.trim()
  if (!value) {
    matrix.value = null
    errorMessage.value = '请输入一个梦境关键词'
    return
  }
  errorMessage.value = ''
  matrix.value = dreamInterpret(value)
}
</script>

<template><section class="xw-page"><header><h1>周公解梦</h1><p>按关键词查阅传统梦象条目</p></header><div class="xw-stack"><XuanweiPanel title="梦境关键词"><form class="xw-form" @submit.prevent="search"><label class="xw-field"><span>你梦见了什么</span><input v-model="keyword" class="xw-control" type="search" maxlength="24" placeholder="例如：蛇、水、飞、鱼、龙" autocomplete="off"></label><p v-if="errorMessage" class="xw-error" role="alert">{{ errorMessage }}</p><button class="xw-action xw-action-block" type="submit">查阅梦象</button></form></XuanweiPanel><XuanweiPanel v-if="matrix" :title="`${resultLabel} · 相关条目`"><div class="xw-reading-list"><p v-for="item in matrix.interpretations" :key="item.id" class="xw-interpretation">{{ item.text }}</p></div></XuanweiPanel><XuanweiNotice tone="warning">梦境解释不具有诊断或预测效力，仅供传统文化阅读与娱乐参考。</XuanweiNotice></div></section></template>
