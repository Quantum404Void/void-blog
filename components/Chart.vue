<template>
  <!-- vue-chartjs 声明式封装，统一主题配置 -->
  <component
    :is="chartComponent"
    :data="data"
    :options="mergedOptions"
    :style="{ height: `${height}px` }"
    :plugins="[]"
  />
</template>

<script setup lang="ts">
import { Bar, Line, Doughnut, Pie, Radar } from 'vue-chartjs'
import {
  Chart,
  CategoryScale, LinearScale, RadialLinearScale, LogarithmicScale,
  BarElement, LineElement, PointElement, ArcElement,
  RadarController, BarController, LineController, DoughnutController, PieController,
  Title, Tooltip, Legend, Filler,
} from 'chart.js'

// 全局注册一次
Chart.register(
  CategoryScale, LinearScale, RadialLinearScale, LogarithmicScale,
  BarElement, LineElement, PointElement, ArcElement,
  RadarController, BarController, LineController, DoughnutController, PieController,
  Title, Tooltip, Legend, Filler,
)

const props = withDefaults(defineProps<{
  type?: 'bar' | 'line' | 'doughnut' | 'pie' | 'radar'
  data: any
  options?: any
  height?: number
}>(), {
  type: 'bar',
  options: () => ({}),
  height: 300,
})

const chartComponent = computed(() => ({
  bar: Bar, line: Line, doughnut: Doughnut, pie: Pie, radar: Radar,
}[props.type] ?? Bar))

// 全站统一暗色主题
const baseOptions = computed(() => {
  const hasBoth = props.type === 'bar' || props.type === 'line'
  const scales = hasBoth ? {
    x: {
      ticks: { color: '#8888aa', font: { family: 'JetBrains Mono, monospace', size: 11 } },
      grid: { color: 'rgba(30,30,48,0.8)' }, border: { display: false },
    },
    y: {
      ticks: { color: '#8888aa', font: { family: 'JetBrains Mono, monospace', size: 11 } },
      grid: { color: 'rgba(30,30,48,0.8)' }, border: { display: false },
    },
  } : {}

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#8888aa', font: { family: 'JetBrains Mono, monospace', size: 12 } },
      },
      tooltip: {
        backgroundColor: '#13131f',
        borderColor: '#1e1e30',
        borderWidth: 1,
        titleColor: '#00d4ff',
        bodyColor: '#e8e8f0',
        titleFont: { family: 'JetBrains Mono' },
        bodyFont: { family: 'JetBrains Mono' },
      },
    },
    ...(hasBoth ? { scales } : {}),
  }
})

function deepMerge(target: any, source: any): any {
  const out = { ...target }
  for (const key of Object.keys(source ?? {})) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      out[key] = deepMerge(target[key] ?? {}, source[key])
    } else {
      out[key] = source[key]
    }
  }
  return out
}

const mergedOptions = computed(() => deepMerge(baseOptions.value, props.options ?? {}))
</script>
