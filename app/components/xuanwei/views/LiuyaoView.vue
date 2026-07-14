<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { liuyaoCast } from '@/engine/knowledge/liuyao'
import type { SymbolMatrix } from '@/engine/types'

const matrix = shallowRef<SymbolMatrix | null>(null)
const lines = computed(() => [...(matrix.value?.symbols.filter(symbol => symbol.category === 'yao') ?? [])].reverse().map(symbol => ({ id: symbol.id, name: symbol.position, display: symbol.attributes.name, changing: symbol.attributes.changing === 'true' })))

function cast() { matrix.value = liuyaoCast() }
function reset() { matrix.value = null }
</script>

<template><section class="xw-page"><header><h1>六爻纳甲</h1><p>三枚铜钱掷六次成卦的规则模拟</p></header><div class="xw-stack"><XuanweiPanel><p class="xw-prompt">心中明确所问之事，准备好后开始掷卦。</p><button class="xw-action xw-action-block" type="button" @click="cast">{{ matrix ? '重新掷卦' : '开始掷卦' }}</button></XuanweiPanel><template v-if="matrix"><XuanweiPanel title="爻象"><div class="xw-line-list"><div v-for="line in lines" :key="line.id" class="xw-line"><span>{{ line.name }}</span><strong>{{ line.display }}</strong><span v-if="line.changing" class="xw-tag xw-tag-warning">动爻</span></div></div></XuanweiPanel><XuanweiPanel v-for="item in matrix.interpretations" :key="item.id" compact><p class="xw-interpretation">{{ item.text }}</p></XuanweiPanel><button class="xw-action xw-action-secondary" type="button" @click="reset">清空结果</button></template><XuanweiNotice tone="warning">随机起卦仅供传统文化研究与娱乐参考。</XuanweiNotice></div></section></template>
