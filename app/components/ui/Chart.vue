<template>
  <!-- Observable Plot — 声明式 SVG 图表，轻量 1.5MB -->
  <div ref="container" class="plot-container" />
</template>

<script setup lang="ts">
import * as Plot from '@observablehq/plot'

interface ChartDataPoint {
  label: string
  value: number
  color?: string
}

const props = withDefaults(defineProps<{
  type?: 'bar' | 'barh' | 'line' | 'area'
  data: ChartDataPoint[]
  height?: number
  title?: string
}>(), {
  type: 'bar',
  height: 240,
})

const container = ref<HTMLDivElement | null>(null)

// 暗色主题 tokens
const DARK = {
  bg: 'transparent',
  text: 'rgba(136,136,170,0.9)',
  grid: 'rgba(30,30,60,0.8)',
  tick: 'rgba(100,100,140,0.5)',
}

function render() {
  if (!container.value || !props.data.length) return
  container.value.innerHTML = ''

  const neon = ['#00d4ff', '#39ff14', '#b44cff', '#ff2d78', '#ffa500']
  const colors = props.data.map((d, i) => d.color ?? neon[i % neon.length])

  let marks: Plot.Markish[]
  const baseOpts = {
    height: props.height,
    marginLeft: props.type === 'barh' ? 100 : 36,
    marginBottom: props.type === 'barh' ? 20 : 40,
    marginRight: 16,
    marginTop: 8,
    style: { background: DARK.bg, color: DARK.text, fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' },
    x: {
      tickSize: 4,
      tickColor: DARK.tick,
      labelColor: DARK.text,
      gridColor: DARK.grid,
      label: null,
    },
    y: {
      tickSize: 4,
      tickColor: DARK.tick,
      labelColor: DARK.text,
      gridColor: DARK.grid,
      label: null,
    },
  }

  // bar/barh 明确声明 band scale 避免字符串数字警告
  const xBand = props.type === 'bar' ? { ...baseOpts.x, type: 'band' } : baseOpts.x
  const yBand = props.type === 'barh' ? { ...baseOpts.y, type: 'band' } : baseOpts.y

  if (props.type === 'barh') {
    marks = [
      Plot.barX(props.data, {
        x: 'value',
        y: 'label',
        sort: { y: '-x' },
        fill: (_d: ChartDataPoint, i: number) => colors[i],
        rx: 3,
        tip: true,
      }),
      Plot.ruleX([0], { stroke: DARK.tick }),
    ]
  } else if (props.type === 'line') {
    marks = [
      Plot.line(props.data, {
        x: 'label',
        y: 'value',
        stroke: '#00d4ff',
        strokeWidth: 2,
        curve: 'catmull-rom',
      }),
      Plot.dot(props.data, {
        x: 'label',
        y: 'value',
        fill: '#00d4ff',
        r: 3,
        tip: true,
      }),
    ]
  } else if (props.type === 'area') {
    marks = [
      Plot.areaY(props.data, {
        x: 'label',
        y: 'value',
        fill: 'rgba(0,212,255,0.1)',
        curve: 'catmull-rom',
      }),
      Plot.line(props.data, {
        x: 'label',
        y: 'value',
        stroke: '#00d4ff',
        strokeWidth: 2,
        curve: 'catmull-rom',
      }),
    ]
  } else {
    // bar (vertical)
    marks = [
      Plot.barY(props.data, {
        x: 'label',
        y: 'value',
        fill: (_d: ChartDataPoint, i: number) => colors[i],
        rx: 3,
        tip: true,
      }),
      Plot.ruleY([0], { stroke: DARK.tick }),
    ]
  }

  const plot = Plot.plot({ ...baseOpts, x: xBand, y: yBand, marks })

  // 注入暗色主题样式到 SVG
  const svg = plot.querySelector('svg')
  if (svg) {
    svg.style.overflow = 'visible'
    // 修正 tick/label 颜色
    svg.querySelectorAll('text').forEach(t => { (t as HTMLElement).style.fill = DARK.text })
    svg.querySelectorAll('line, path[class*="tick"]').forEach((el) => { (el as HTMLElement).style.stroke = DARK.tick })
    svg.querySelectorAll('[class*="grid"] line').forEach((el) => { (el as HTMLElement).style.stroke = DARK.grid })
  }

  container.value.appendChild(plot)
}

onMounted(render)
watch(() => [props.data, props.type, props.height], render, { deep: true })
onUnmounted(() => {
  if (container.value) container.value.innerHTML = ''
})
</script>

<style scoped>
.plot-container {
  width: 100%;
  overflow-x: auto;
}
.plot-container :deep(svg) {
  width: 100%;
  max-width: 100%;
}
.plot-container :deep([tip]) {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
}
</style>
