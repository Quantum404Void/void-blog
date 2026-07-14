<script setup lang="ts">
import { reactive, shallowRef } from 'vue'
import { assertValidSolarDate } from '@/engine/calendar'
import { meihuaByDateTime, meihuaByNumbers } from '@/engine/knowledge/meihua'
import type { SymbolMatrix } from '@/engine/types'

const mode = shallowRef<'date' | 'number'>('date')
const dateForm = reactive({ year: 2024, month: 7, day: 14, hour: 11 })
const numberForm = reactive({ upper: 3, lower: 5, changing: 2 })
const hours = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const matrix = shallowRef<SymbolMatrix | null>(null)
const errorMessage = shallowRef('')

function cast() {
  errorMessage.value = ''
  try {
    if (mode.value === 'date') {
      assertValidSolarDate(dateForm.year, dateForm.month, dateForm.day)
      matrix.value = meihuaByDateTime(dateForm.year, dateForm.month, dateForm.day, dateForm.hour)
    }
    else {
      if ([numberForm.upper, numberForm.lower, numberForm.changing].some(value => !Number.isInteger(value) || value < 1)) throw new Error('三个起卦数必须是大于 0 的整数')
      matrix.value = meihuaByNumbers(numberForm.upper, numberForm.lower, numberForm.changing)
    }
  }
  catch (error) {
    matrix.value = null
    errorMessage.value = error instanceof Error ? error.message : '起卦失败，请检查输入'
  }
}
</script>

<template><section class="xw-page"><header><h1>梅花易数</h1><p>年月日时或三数起卦</p></header><div class="xw-stack"><XuanweiPanel title="起卦方式"><form class="xw-form" @submit.prevent="cast"><div class="xw-tabs" role="tablist" aria-label="起卦方式"><button type="button" role="tab" :aria-selected="mode === 'date'" @click="mode = 'date'">年月日时</button><button type="button" role="tab" :aria-selected="mode === 'number'" @click="mode = 'number'">三数起卦</button></div><div v-if="mode === 'date'" class="xw-form-grid xw-form-grid-4" role="tabpanel"><label class="xw-field"><span>年</span><input v-model.number="dateForm.year" class="xw-control" type="number" min="1" required></label><label class="xw-field"><span>月</span><input v-model.number="dateForm.month" class="xw-control" type="number" min="1" max="12" required></label><label class="xw-field"><span>日</span><input v-model.number="dateForm.day" class="xw-control" type="number" min="1" max="31" required></label><label class="xw-field"><span>时辰</span><select v-model.number="dateForm.hour" class="xw-control"><option v-for="(hour, index) in hours" :key="hour" :value="index + 1">{{ hour }}时</option></select></label></div><div v-else class="xw-form-grid xw-form-grid-3" role="tabpanel"><label class="xw-field"><span>上卦数</span><input v-model.number="numberForm.upper" class="xw-control" type="number" min="1" required></label><label class="xw-field"><span>下卦数</span><input v-model.number="numberForm.lower" class="xw-control" type="number" min="1" required></label><label class="xw-field"><span>动爻数</span><input v-model.number="numberForm.changing" class="xw-control" type="number" min="1" required></label></div><p v-if="errorMessage" class="xw-error" role="alert">{{ errorMessage }}</p><button class="xw-action xw-action-block" type="submit">生成卦象</button></form></XuanweiPanel><template v-if="matrix"><XuanweiPanel title="卦象"><div class="xw-result-grid" style="--xw-cols: 3"><div v-for="symbol in matrix.symbols" :key="symbol.id" class="xw-result-cell"><div class="xw-result-label">{{ symbol.position }}</div><div class="xw-result-value">{{ symbol.name }}</div></div></div></XuanweiPanel><XuanweiPanel v-for="item in matrix.interpretations" :key="item.id" compact><p class="xw-interpretation">{{ item.text }}</p></XuanweiPanel></template><XuanweiNotice tone="warning">结果仅供传统文化研究与娱乐参考。</XuanweiNotice></div></section></template>
