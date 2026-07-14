<script setup lang="ts">
import { computed, reactive, shallowRef } from 'vue'
import { assertValidBranchHour, assertValidSolarDate } from '@/engine/calendar'
import { computeZiweiMatrix } from '@/engine/knowledge/ziwei'
import type { SymbolMatrix } from '@/engine/types'

const form = reactive({ year: 2000, month: 1, day: 1, hour: 0, gender: 'male' as 'male' | 'female' })
const hours = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const matrix = shallowRef<SymbolMatrix | null>(null)
const errorMessage = shallowRef('')
const summary = computed(() => ({
  ming: matrix.value?.symbols.find(symbol => symbol.id === 'zw-ming')?.name ?? '',
  shen: matrix.value?.symbols.find(symbol => symbol.id === 'zw-shen')?.name ?? '',
  wuxing: matrix.value?.interpretations.find(item => item.id === 'zw-wuxing')?.text.match(/五行局：(.+)局/)?.[1] ?? '',
}))
const palaces = computed(() => matrix.value?.symbols
  .filter(symbol => symbol.category === 'ziwei' && symbol.position !== '命宫' && symbol.position !== '身宫')
  .map(symbol => ({ name: symbol.position, stars: symbol.attributes.stars, branch: symbol.attributes.branch })) ?? [])

function calculate() {
  errorMessage.value = ''
  try {
    assertValidSolarDate(form.year, form.month, form.day)
    assertValidBranchHour(form.hour)
    matrix.value = computeZiweiMatrix(form.year, form.month, form.day, form.hour, form.gender)
  }
  catch (error) {
    matrix.value = null
    errorMessage.value = error instanceof Error ? error.message : '排盘失败，请检查输入'
  }
}
</script>

<template>
  <section class="xw-page xw-page-wide">
    <header><h1>紫微斗数</h1><p>十四主星、十二宫与命身宫规则排盘</p></header>
    <div class="xw-stack">
      <XuanweiPanel title="出生信息">
        <form class="xw-form" @submit.prevent="calculate">
          <div class="xw-form-grid xw-form-grid-4">
            <label class="xw-field"><span>出生年</span><input v-model.number="form.year" class="xw-control" type="number" min="1900" max="2100" required></label>
            <label class="xw-field"><span>出生月</span><input v-model.number="form.month" class="xw-control" type="number" min="1" max="12" required></label>
            <label class="xw-field"><span>出生日</span><input v-model.number="form.day" class="xw-control" type="number" min="1" max="31" required></label>
            <label class="xw-field"><span>时辰</span><select v-model.number="form.hour" class="xw-control"><option v-for="(hour, index) in hours" :key="hour" :value="index">{{ hour }}时</option></select></label>
          </div>
          <fieldset class="xw-fieldset"><legend>性别</legend><div class="xw-choice-row"><label class="xw-choice"><input v-model="form.gender" type="radio" value="male">男</label><label class="xw-choice"><input v-model="form.gender" type="radio" value="female">女</label></div></fieldset>
          <p v-if="errorMessage" class="xw-error" role="alert">{{ errorMessage }}</p>
          <button class="xw-action xw-action-block" type="submit">生成命盘</button>
        </form>
      </XuanweiPanel>
      <template v-if="matrix">
        <XuanweiPanel><p class="xw-summary">命宫 <strong>{{ summary.ming }}</strong><span>·</span>身宫 <strong>{{ summary.shen }}</strong><span>·</span>五行局 <strong>{{ summary.wuxing }}</strong></p></XuanweiPanel>
        <XuanweiPanel title="十二宫"><div class="xw-result-grid" style="--xw-cols: 4"><div v-for="palace in palaces" :key="palace.name" class="xw-result-cell"><div class="xw-result-label">{{ palace.name }}</div><div class="xw-result-value">{{ palace.stars || '—' }}</div><div class="xw-result-note">{{ palace.branch }}</div></div></div></XuanweiPanel>
        <XuanweiPanel v-for="item in matrix.interpretations" :key="item.id" compact><p class="xw-interpretation">{{ item.text }}</p></XuanweiPanel>
      </template>
      <XuanweiNotice tone="warning">规则结果仅供传统文化研究与娱乐参考，不构成现实决策建议。</XuanweiNotice>
    </div>
  </section>
</template>
