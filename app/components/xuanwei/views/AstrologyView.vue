<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { ZODIAC_SIGNS, generateHoroscope } from '@/engine/knowledge/astrology'
import type { MatrixSymbol, SymbolMatrix } from '@/engine/types'

const glyphs: Record<string, string> = { 白羊座: '♈', 金牛座: '♉', 双子座: '♊', 巨蟹座: '♋', 狮子座: '♌', 处女座: '♍', 天秤座: '♎', 天蝎座: '♏', 射手座: '♐', 摩羯座: '♑', 水瓶座: '♒', 双鱼座: '♓' }
const labels: Record<string, string> = { career: '事业', wealth: '财运', love: '感情', health: '健康', fortune: '开运' }
const selected = shallowRef<MatrixSymbol | null>(null)
const matrix = shallowRef<SymbolMatrix | null>(null)
const interpretations = computed(() => matrix.value?.interpretations ?? [])

function select(sign: MatrixSymbol) {
  selected.value = sign
  const [month, day] = sign.position.split('/')[1]?.split('-') ?? ['1', '1']
  matrix.value = generateHoroscope(Number(month), Number(day))
}
</script>

<template><section class="xw-page xw-page-wide"><header><h1>星座运势</h1><p>选择星座，生成当日娱乐性条目</p></header><div class="xw-stack"><XuanweiPanel title="选择星座"><div class="xw-zodiac-grid"><button v-for="sign in ZODIAC_SIGNS" :key="sign.id" class="xw-zodiac" :aria-pressed="selected?.id === sign.id" type="button" @click="select(sign)"><span>{{ glyphs[sign.name] }}</span><strong>{{ sign.name }}</strong><small>{{ sign.position }}</small></button></div></XuanweiPanel><template v-if="matrix && selected"><XuanweiPanel><div class="xw-sign-summary"><span>{{ glyphs[selected.name] }}</span><div><strong>{{ selected.name }}</strong><small>{{ selected.attributes.trait }}</small></div></div></XuanweiPanel><XuanweiPanel v-for="item in interpretations" :key="item.id" :title="labels[item.category] ?? item.category" compact><p class="xw-interpretation">{{ item.text }}</p></XuanweiPanel></template><XuanweiNotice tone="warning">星座运势由规则随机生成，仅供娱乐参考。</XuanweiNotice></div></section></template>
