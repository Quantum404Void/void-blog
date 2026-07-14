<script setup lang="ts">
import { computed, reactive, shallowRef } from 'vue'
import { assertValidBranchHour, assertValidSolarDate } from '@/engine/calendar'
import { chengguFromSolarDate } from '@/engine/knowledge/chenggu'
import type { SymbolMatrix } from '@/engine/types'

const form = reactive({ year: 2000, month: 1, day: 1, hour: 0 })
const hours = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const matrix = shallowRef<SymbolMatrix | null>(null)
const errorMessage = shallowRef('')
const weights = computed(() => matrix.value?.symbols.map(symbol => ({ label: symbol.position, value: symbol.attributes.weight })) ?? [])

function calculate() {
  errorMessage.value = ''
  try {
    assertValidSolarDate(form.year, form.month, form.day)
    assertValidBranchHour(form.hour)
    matrix.value = chengguFromSolarDate(form.year, form.month, form.day, form.hour)
  }
  catch (error) {
    matrix.value = null
    errorMessage.value = error instanceof Error ? error.message : '计算失败，请检查输入'
  }
}
</script>

<template>
  <section class="xw-page"><header><h1>称骨歌</h1><p>按出生年月日时换算骨重并查阅歌诀</p></header><div class="xw-stack">
    <XuanweiPanel title="出生信息"><form class="xw-form" @submit.prevent="calculate"><div class="xw-form-grid">
      <label class="xw-field"><span>出生年</span><input v-model.number="form.year" class="xw-control" type="number" min="1900" max="2100" required></label>
      <label class="xw-field"><span>出生月</span><input v-model.number="form.month" class="xw-control" type="number" min="1" max="12" required></label>
      <label class="xw-field"><span>出生日</span><input v-model.number="form.day" class="xw-control" type="number" min="1" max="31" required></label>
      <label class="xw-field"><span>时辰</span><select v-model.number="form.hour" class="xw-control"><option v-for="(hour, index) in hours" :key="hour" :value="index">{{ hour }}时</option></select></label>
    </div><p v-if="errorMessage" class="xw-error" role="alert">{{ errorMessage }}</p><button class="xw-action xw-action-block" type="submit">开始称骨</button></form></XuanweiPanel>
    <XuanweiPanel v-if="matrix" title="称骨结果"><div class="xw-result-grid" style="--xw-cols: 4"><div v-for="item in weights" :key="item.label" class="xw-result-cell"><div class="xw-result-label">{{ item.label }}</div><div class="xw-result-value">{{ item.value }}钱</div></div></div><hr class="xw-divider"><p class="xw-summary">总骨重 <strong>{{ matrix.derivedTags[0]?.name }}</strong></p><hr class="xw-divider"><p class="xw-interpretation xw-centered">{{ matrix.interpretations[0]?.text }}</p></XuanweiPanel>
    <XuanweiNotice tone="warning">传统称骨歌存在不同版本，本页结果仅供文化研究与娱乐参考。</XuanweiNotice>
  </div></section>
</template>
