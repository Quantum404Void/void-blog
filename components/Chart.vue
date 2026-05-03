<template>
  <div class="chart-wrapper">
    <div ref="containerRef" :style="{ height: props.height + 'px', position: 'relative' }">
      <canvas ref="canvasRef" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, toRaw } from 'vue'
import {
  Chart,
  CategoryScale, LinearScale, RadialLinearScale, LogarithmicScale,
  BarElement, LineElement, PointElement, ArcElement,
  RadarController, BarController, LineController, DoughnutController, PieController,
  Title, Tooltip, Legend, Filler,
} from 'chart.js'

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

const canvasRef = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

function buildOptions() {
  const base: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#8888aa',
          font: { family: 'JetBrains Mono, monospace', size: 12 },
        },
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
  }

  if (props.type === 'bar' || props.type === 'line') {
    base.scales = {
      x: {
        ticks: { color: '#8888aa', font: { family: 'JetBrains Mono', size: 11 } },
        grid: { color: 'rgba(30,30,48,0.8)' },
      },
      y: {
        ticks: { color: '#8888aa', font: { family: 'JetBrains Mono', size: 11 } },
        grid: { color: 'rgba(30,30,48,0.8)' },
      },
    }
  }

  return deepMerge(base, props.options ?? {})
}

function deepMerge(target: any, source: any): any {
  const out = { ...target }
  for (const key of Object.keys(source ?? {})) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && typeof source[key] !== 'function') {
      out[key] = deepMerge(target[key] ?? {}, source[key])
    } else {
      out[key] = source[key]
    }
  }
  return out
}

function createChart() {
  if (!canvasRef.value) return
  destroyChart()
  chartInstance = new Chart(canvasRef.value, {
    type: props.type as any,
    data: toRaw(props.data),
    options: buildOptions(),
  })
}

function destroyChart() {
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
}

onMounted(() => {
  createChart()
})

onUnmounted(() => {
  destroyChart()
})

watch(() => props.data, () => {
  createChart()
}, { deep: true })

watch(() => props.options, () => {
  createChart()
}, { deep: true })
</script>

<style scoped>
.chart-wrapper {
  background: var(--color-void-card);
  border: 1px solid var(--color-void-border);
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin: 1.5rem 0;
}
canvas {
  display: block;
}
</style>
