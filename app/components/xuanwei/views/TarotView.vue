<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { MAJOR_ARCANA, drawTarot } from '@/engine/knowledge/tarot'
import type { SymbolMatrix } from '@/engine/types'

const spreads = [{ key: 'single' as const, name: '单张牌', description: '聚焦当下问题，获得一条提示' }, { key: 'three' as const, name: '三张牌阵', description: '从过去、现在与未来三个位置观察' }]
const matrix = shallowRef<SymbolMatrix | null>(null)
const cards = computed(() => matrix.value?.symbols.map(symbol => ({ id: symbol.id, name: symbol.name, position: symbol.position, reversed: symbol.attributes.reversed === 'true', element: MAJOR_ARCANA.find(card => card.id === symbol.id)?.attributes.element ?? '' })) ?? [])

function draw(spreadType: 'single' | 'three') { matrix.value = drawTarot({ spreadType, cards: [] }, Date.now()) }
</script>

<template><section class="xw-page xw-page-wide"><header><h1>塔罗牌</h1><p>大阿卡纳随机抽取与牌阵解读</p></header><div class="xw-stack"><XuanweiPanel v-if="!matrix" title="选择牌阵"><p class="xw-prompt">先明确想要观察的问题，再选择适合的牌阵。</p><div class="xw-option-list"><button v-for="spread in spreads" :key="spread.key" class="xw-option" type="button" @click="draw(spread.key)"><strong>{{ spread.name }}</strong><span>{{ spread.description }}</span></button></div></XuanweiPanel><template v-else><XuanweiPanel title="抽牌结果"><div class="xw-card-grid"><article v-for="card in cards" :key="card.id" class="xw-oracle-card"><span>{{ card.position }}</span><strong :class="{ 'xw-reversed': card.reversed }">{{ card.name }}</strong><div><span class="xw-tag" :class="card.reversed ? 'xw-tag-warning' : 'xw-tag-success'">{{ card.reversed ? '逆位' : '正位' }}</span><small>{{ card.element }}</small></div></article></div></XuanweiPanel><XuanweiPanel title="解读"><div class="xw-reading-list"><p v-for="item in matrix.interpretations" :key="item.id" class="xw-interpretation">{{ item.text }}</p></div></XuanweiPanel><button class="xw-action xw-action-secondary" type="button" @click="matrix = null">重新选择牌阵</button></template><XuanweiNotice tone="warning">随机抽牌仅供自我反思与娱乐参考，不构成专业建议。</XuanweiNotice></div></section></template>
