<script setup lang="ts">
import { computed, reactive, shallowRef } from 'vue'
import { assertValidBranchHour, assertValidSolarDate } from '@/engine/calendar'
import { computeBaziMatrix, HOUR_OPTIONS, TEN_GODS, TWELVE_STAGES } from '@/engine/knowledge/bazi'
import type { BaziInput, SymbolMatrix } from '@/engine/types'

const form = reactive<BaziInput>({ year: 2000, month: 1, day: 1, hour: 0, gender: 'male' })
const matrix = shallowRef<SymbolMatrix | null>(null)
const errorMessage = shallowRef('')
const pillars = computed(() => {
  if (!matrix.value) return []
  const names = ['年柱', '月柱', '日柱', '时柱']
  const keys = ['year', 'month', 'day', 'hour']
  return keys.map((key, index) => {
    const stem = matrix.value!.symbols.find(symbol => symbol.position === `${names[index]}/天干`)
    const branch = matrix.value!.symbols.find(symbol => symbol.position === `${names[index]}/地支`)
    const tenGodTag = matrix.value!.derivedTags.find(tag => tag.category === 'tenGod' && tag.position === names[index])
    const stageTag = matrix.value!.derivedTags.find(tag => tag.category === 'twelveStage' && tag.position === names[index])
    const nayinTag = matrix.value!.derivedTags.find(tag => tag.category === 'nayin' && tag.position === names[index])
    const tenGod = TEN_GODS.find(item => item.id === tenGodTag?.id?.replace(`pillar-${key}-`, ''))
    const stage = TWELVE_STAGES.find(item => item.id === stageTag?.id?.replace(`pillar-${key}-`, ''))
    return { key, label: names[index], stem: stem?.name ?? '—', branch: branch?.name ?? '—', nayin: nayinTag?.name ?? '', tenGod: tenGodTag?.name ?? '—', nature: tenGod?.attributes?.nature ?? 'neutral', stage: stageTag?.name ?? stage?.name ?? '—' }
  })
})
const shensha = computed(() => matrix.value?.derivedTags.filter(tag => tag.id.includes('shensha-')) ?? [])

function calculate() {
  errorMessage.value = ''
  try {
    assertValidSolarDate(form.year, form.month, form.day)
    assertValidBranchHour(form.hour)
    matrix.value = computeBaziMatrix({ ...form })
  }
  catch (error) {
    matrix.value = null
    errorMessage.value = error instanceof Error ? error.message : '排盘失败，请检查输入'
  }
}
</script>

<template><section class="xw-page xw-page-wide"><header><h1>八字排盘</h1><p>天干地支、十神、十二长生、纳音与神煞</p></header><div class="xw-stack"><XuanweiPanel title="出生信息"><form class="xw-form" @submit.prevent="calculate"><div class="xw-form-grid xw-form-grid-4"><label class="xw-field"><span>出生年</span><input v-model.number="form.year" class="xw-control" type="number" min="1900" max="2100" required></label><label class="xw-field"><span>出生月</span><input v-model.number="form.month" class="xw-control" type="number" min="1" max="12" required></label><label class="xw-field"><span>出生日</span><input v-model.number="form.day" class="xw-control" type="number" min="1" max="31" required></label><label class="xw-field"><span>时辰</span><select v-model.number="form.hour" class="xw-control"><option v-for="hour in HOUR_OPTIONS" :key="hour.branch" :value="hour.value">{{ hour.branch }}时 · {{ hour.modern }}</option></select></label></div><fieldset class="xw-fieldset"><legend>性别</legend><div class="xw-choice-row"><label class="xw-choice"><input v-model="form.gender" type="radio" value="male">男</label><label class="xw-choice"><input v-model="form.gender" type="radio" value="female">女</label></div></fieldset><p v-if="errorMessage" class="xw-error" role="alert">{{ errorMessage }}</p><button class="xw-action xw-action-block" type="submit">生成八字命盘</button></form></XuanweiPanel><template v-if="matrix"><XuanweiPanel title="四柱"><div class="xw-pillar-grid"><div v-for="pillar in pillars" :key="pillar.key" class="xw-pillar"><span>{{ pillar.label }}</span><strong>{{ pillar.stem }}{{ pillar.branch }}</strong><small>{{ pillar.nayin }}</small><div><span class="xw-tag" :class="{ 'xw-tag-success': pillar.nature === '吉', 'xw-tag-error': pillar.nature === '凶' }">{{ pillar.tenGod }}</span><span class="xw-tag">{{ pillar.stage }}</span></div></div></div></XuanweiPanel><XuanweiPanel v-if="shensha.length" title="神煞"><div class="xw-tags"><span v-for="item in shensha" :key="item.id" class="xw-tag" :class="{ 'xw-tag-success': item.attributes.nature === '吉', 'xw-tag-error': item.attributes.nature === '凶', 'xw-tag-warning': item.attributes.nature !== '吉' && item.attributes.nature !== '凶' }">{{ item.name }} · {{ item.attributes.pillar }}</span></div></XuanweiPanel><XuanweiPanel v-if="matrix.interpretations.length" title="命理解读"><div class="xw-reading-list"><article v-for="item in matrix.interpretations" :key="item.id"><p class="xw-interpretation">{{ item.text }}</p><span v-if="item.source" class="xw-source">{{ item.source }}</span></article></div></XuanweiPanel></template><XuanweiNotice tone="warning">命理规则存在流派差异，结果仅供文化研究与娱乐参考。</XuanweiNotice></div></section></template>
