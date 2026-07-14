<script setup lang="ts">
import { computed, reactive, shallowRef } from 'vue'
import { fengshuiAnalyze } from '@/engine/knowledge/fengshui'
import type { SymbolMatrix } from '@/engine/types'

const form = reactive({ year: 1990, gender: 'male' as 'male' | 'female' })
const matrix = shallowRef<SymbolMatrix | null>(null)
const errorMessage = shallowRef('')
const directions = computed(() => matrix.value?.symbols.filter(symbol => symbol.id.startsWith('fs-g')).map(symbol => ({ id: symbol.id, position: symbol.position, star: String(symbol.attributes.star) })) ?? [])

function calculate() {
  if (!Number.isInteger(form.year) || form.year < 1900 || form.year > 2100) {
    matrix.value = null
    errorMessage.value = '出生年份需在 1900 至 2100 之间'
    return
  }
  errorMessage.value = ''
  matrix.value = fengshuiAnalyze(form.year, form.gender)
}
</script>

<template><section class="xw-page"><header><h1>风水堪舆</h1><p>八宅派命卦与方位规则分析</p></header><div class="xw-stack"><XuanweiPanel title="基本信息"><form class="xw-form" @submit.prevent="calculate"><div class="xw-form-grid"><label class="xw-field"><span>出生年</span><input v-model.number="form.year" class="xw-control" type="number" min="1900" max="2100" required></label><fieldset class="xw-fieldset"><legend>性别</legend><div class="xw-choice-row"><label class="xw-choice"><input v-model="form.gender" type="radio" value="male">男</label><label class="xw-choice"><input v-model="form.gender" type="radio" value="female">女</label></div></fieldset></div><p v-if="errorMessage" class="xw-error" role="alert">{{ errorMessage }}</p><button class="xw-action xw-action-block" type="submit">分析命卦</button></form></XuanweiPanel><template v-if="matrix"><XuanweiPanel title="八宅方位"><div class="xw-result-grid" style="--xw-cols: 4"><div v-for="item in directions" :key="item.id" class="xw-result-cell" :class="{ 'xw-result-positive': item.star.includes('吉'), 'xw-result-negative': item.star.includes('凶') }"><div class="xw-result-label">{{ item.position }}</div><div class="xw-result-value">{{ item.star }}</div></div></div></XuanweiPanel><XuanweiPanel v-for="item in matrix.interpretations" :key="item.id" compact><p class="xw-interpretation">{{ item.text }}</p></XuanweiPanel></template><XuanweiNotice tone="warning">方位结果仅用于传统文化研究，不应替代建筑、消防或专业环境评估。</XuanweiNotice></div></section></template>
