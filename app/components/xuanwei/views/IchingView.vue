<script setup lang="ts">
import { reactive, shallowRef } from 'vue'
import { castHexagram } from '@/engine/knowledge/iching'
import type { SymbolMatrix } from '@/engine/types'

const form = reactive({ upper: 1, lower: 1, yao: 1 })
const matrix = shallowRef<SymbolMatrix | null>(null)
const errorMessage = shallowRef('')

function cast() {
  const valid = [form.upper, form.lower].every(value => Number.isInteger(value) && value >= 1 && value <= 8) && Number.isInteger(form.yao) && form.yao >= 1 && form.yao <= 6
  if (!valid) {
    matrix.value = null
    errorMessage.value = '上下卦数需为 1 至 8，动爻需为 1 至 6'
    return
  }
  errorMessage.value = ''
  matrix.value = castHexagram(form.upper, form.lower, form.yao)
}
</script>

<template><section class="xw-page"><header><h1>易经六十四卦</h1><p>数字起卦与《周易》卦辞查阅</p></header><div class="xw-stack"><XuanweiPanel title="起卦参数"><form class="xw-form" @submit.prevent="cast"><div class="xw-form-grid xw-form-grid-3"><label class="xw-field"><span>上卦数</span><input v-model.number="form.upper" class="xw-control" type="number" min="1" max="8" required></label><label class="xw-field"><span>下卦数</span><input v-model.number="form.lower" class="xw-control" type="number" min="1" max="8" required></label><label class="xw-field"><span>动爻</span><input v-model.number="form.yao" class="xw-control" type="number" min="1" max="6" required></label></div><p v-if="errorMessage" class="xw-error" role="alert">{{ errorMessage }}</p><button class="xw-action xw-action-block" type="submit">生成卦象</button></form></XuanweiPanel><XuanweiPanel v-if="matrix" title="卦辞与解读"><div class="xw-reading-list"><p v-for="item in matrix.interpretations" :key="item.id" class="xw-interpretation">{{ item.text }}</p></div></XuanweiPanel><XuanweiNotice tone="warning">起卦结果仅供经典阅读与娱乐参考，不构成决策建议。</XuanweiNotice></div></section></template>
