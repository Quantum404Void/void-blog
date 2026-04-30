<template>
  <div class="chart-wrapper">
    <component :is="chartComponent" v-if="mounted" :data="chartData" :options="mergedOptions" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js'

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
)

const props = withDefaults(defineProps<{
  type?: 'bar' | 'line' | 'doughnut' | 'pie'
  data: object
  options?: object
  height?: number
}>(), {
  type: 'bar',
  options: () => ({}),
  height: 300,
})

const mounted = ref(false)
onMounted(() => { mounted.value = true })

const chartComponent = computed(() => {
  const map: Record<string, any> = {
    bar: defineAsyncComponent(() => import('vue-chartjs').then(m => ({ default: m.Bar }))),
    line: defineAsyncComponent(() => import('vue-chartjs').then(m => ({ default: m.Line }))),
    doughnut: defineAsyncComponent(() => import('vue-chartjs').then(m => ({ default: m.Doughnut }))),
    pie: defineAsyncComponent(() => import('vue-chartjs').then(m => ({ default: m.Pie }))),
  }
  return map[props.type] ?? map.bar
})

const chartData = computed(() => props.data)

const mergedOptions = computed(() => ({
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
  scales: props.type === 'bar' || props.type === 'line' ? {
    x: {
      ticks: { color: '#8888aa', font: { family: 'JetBrains Mono', size: 11 } },
      grid: { color: 'rgba(30,30,48,0.8)' },
    },
    y: {
      ticks: { color: '#8888aa', font: { family: 'JetBrains Mono', size: 11 } },
      grid: { color: 'rgba(30,30,48,0.8)' },
    },
  } : undefined,
  ...props.options,
}))
</script>

<style scoped>
.chart-wrapper {
  background: var(--color-void-card);
  border: 1px solid var(--color-void-border);
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin: 1.5rem 0;
  height: v-bind('props.height + "px"');
}
</style>
