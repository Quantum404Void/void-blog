<script setup lang="ts">
import { computed, reactive, shallowRef } from 'vue'
import { nameologyAnalyze } from '@/engine/knowledge/nameology'
import type { SymbolMatrix } from '@/engine/types'

const form = reactive({ surname: '李', givenName: '明' })
const matrix = shallowRef<SymbolMatrix | null>(null)
const errorMessage = shallowRef('')
const grids = computed(() => matrix.value?.symbols.map(symbol => ({ name: symbol.position, value: symbol.attributes.value, element: symbol.attributes.element })) ?? [])

function calculate() {
  const surname = form.surname.trim()
  const givenName = form.givenName.trim()
  if (!surname || !givenName) {
    matrix.value = null
    errorMessage.value = '请完整输入姓氏和名字'
    return
  }
  try {
    errorMessage.value = ''
    matrix.value = nameologyAnalyze(surname, givenName)
  }
  catch (error) {
    matrix.value = null
    errorMessage.value = error instanceof Error ? error.message : '姓名分析失败，请检查输入'
  }
}
</script>

<template><section class="xw-page"><header><h1>姓名学</h1><p>五格剖象法的规则演示</p></header><div class="xw-stack"><XuanweiPanel title="输入姓名"><form class="xw-form" @submit.prevent="calculate"><div class="xw-form-grid"><label class="xw-field"><span>姓氏</span><input v-model="form.surname" class="xw-control" maxlength="4" autocomplete="off" required></label><label class="xw-field"><span>名字</span><input v-model="form.givenName" class="xw-control" maxlength="8" autocomplete="off" required></label></div><p v-if="errorMessage" class="xw-error" role="alert">{{ errorMessage }}</p><button class="xw-action xw-action-block" type="submit">分析五格</button></form></XuanweiPanel><XuanweiPanel v-if="matrix" title="五格结果"><div class="xw-result-grid" style="--xw-cols: 5"><div v-for="item in grids" :key="item.name" class="xw-result-cell"><div class="xw-result-label">{{ item.name }}</div><div class="xw-result-value">{{ item.value }}</div><div class="xw-result-note">{{ item.element }}</div></div></div><hr class="xw-divider"><div class="xw-reading-list"><p v-for="item in matrix.interpretations" :key="item.id" class="xw-interpretation">{{ item.text }}</p></div></XuanweiPanel><XuanweiNotice tone="warning">姓名笔画与五格体系有多种口径，结果仅供文化研究与娱乐参考。</XuanweiNotice></div></section></template>
