<script setup lang="ts">
import { computed, reactive, shallowRef } from 'vue'
import { assertValidBranchHour, assertValidSolarDate } from '@/engine/calendar'
import { qimenCast } from '@/engine/knowledge/qimen'
import type { SymbolMatrix } from '@/engine/types'

const form = reactive({ year: 2024, month: 7, day: 14, hour: 10 })
const hours = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const matrix = shallowRef<SymbolMatrix | null>(null)
const errorMessage = shallowRef('')
const palaces = computed(() => matrix.value?.symbols.filter(symbol => symbol.id.startsWith('qm-g')).map(symbol => ({ id: symbol.id, name: symbol.name, star: symbol.attributes.star, door: symbol.attributes.door })) ?? [])

function calculate() {
  errorMessage.value = ''
  try {
    assertValidSolarDate(form.year, form.month, form.day)
    assertValidBranchHour(form.hour)
    matrix.value = qimenCast(form.year, form.month, form.day, form.hour)
  }
  catch (error) {
    matrix.value = null
    errorMessage.value = error instanceof Error ? error.message : '排盘失败，请检查输入'
  }
}
</script>

<template><section class="xw-page"><header><h1>奇门遁甲</h1><p>时家奇门九宫、八门与九星规则排盘</p></header><div class="xw-stack"><XuanweiPanel title="时辰输入"><form class="xw-form" @submit.prevent="calculate"><div class="xw-form-grid xw-form-grid-4"><label class="xw-field"><span>年</span><input v-model.number="form.year" class="xw-control" type="number" min="1900" max="2100" required></label><label class="xw-field"><span>月</span><input v-model.number="form.month" class="xw-control" type="number" min="1" max="12" required></label><label class="xw-field"><span>日</span><input v-model.number="form.day" class="xw-control" type="number" min="1" max="31" required></label><label class="xw-field"><span>时辰</span><select v-model.number="form.hour" class="xw-control"><option v-for="(hour, index) in hours" :key="hour" :value="index">{{ hour }}时</option></select></label></div><p v-if="errorMessage" class="xw-error" role="alert">{{ errorMessage }}</p><button class="xw-action xw-action-block" type="submit">生成九宫盘</button></form></XuanweiPanel><template v-if="matrix"><XuanweiPanel title="九宫"><div class="xw-result-grid" style="--xw-cols: 3"><div v-for="palace in palaces" :key="palace.id" class="xw-result-cell"><div class="xw-result-label">{{ palace.name }}</div><div class="xw-result-value">{{ palace.star }}</div><div class="xw-result-note">{{ palace.door }}</div></div></div></XuanweiPanel><XuanweiPanel v-for="item in matrix.interpretations" :key="item.id" compact><p class="xw-interpretation">{{ item.text }}</p></XuanweiPanel></template><XuanweiNotice tone="warning">排盘结果仅供传统文化规则研究与娱乐参考。</XuanweiNotice></div></section></template>
