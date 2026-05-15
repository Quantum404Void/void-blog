<template>
  <div class="min-h-screen bg-[var(--color-void)] text-[var(--color-text-primary)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'games', href: '/lab' }, { label: 'neural-net' }]" />

    <div class="max-w-7xl mx-auto px-4 py-8">
      <h1 class="font-mono text-2xl text-[var(--color-neon-cyan)] mb-2">神经网络前向传播可视化</h1>
      <p class="text-[var(--color-text-muted)] font-mono text-sm mb-6">逐层激活 · 权重可视化 · ReLU / Sigmoid / Tanh</p>

      <!-- Config row -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <div>
          <label class="font-mono text-xs text-[var(--color-text-muted)] block mb-1">激活函数</label>
          <select v-model="activation" class="w-full font-mono text-sm bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded px-2 py-1.5 focus:outline-none focus:border-[var(--color-neon-cyan)]">
            <option value="relu">ReLU</option>
            <option value="sigmoid">Sigmoid</option>
            <option value="tanh">Tanh</option>
          </select>
        </div>
        <div>
          <label class="font-mono text-xs text-[var(--color-text-muted)] block mb-1">隐藏层数</label>
          <input type="range" v-model.number="numHidden" min="1" max="3" step="1" class="w-full accent-cyan-400" @change="initNetwork" />
          <span class="font-mono text-xs text-[var(--color-text-muted)]">{{ numHidden }} 层</span>
        </div>
        <div>
          <label class="font-mono text-xs text-[var(--color-text-muted)] block mb-1">每层节点数</label>
          <input type="range" v-model.number="hiddenSize" min="1" max="8" step="1" class="w-full accent-cyan-400" @change="initNetwork" />
          <span class="font-mono text-xs text-[var(--color-text-muted)]">{{ hiddenSize }} 节点</span>
        </div>
        <div class="flex flex-col gap-1">
          <button @click="randomWeights" class="px-3 py-1.5 font-mono text-xs bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded hover:border-[var(--color-neon-cyan)] transition-colors">随机权重</button>
          <button @click="loadXOR" class="px-3 py-1.5 font-mono text-xs bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded hover:border-[var(--color-neon-green)] transition-colors text-[var(--color-neon-green)]">XOR 预置</button>
          <button @click="runForward" :disabled="animating" class="px-3 py-1.5 font-mono text-xs bg-[var(--color-neon-cyan)] text-black rounded hover:opacity-80 disabled:opacity-40 transition-opacity">前向传播 ▶</button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <!-- SVG canvas -->
        <div class="lg:col-span-3 bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg p-4 overflow-x-auto">
          <svg :width="netWidth" :height="netHeight" :viewBox="`0 0 ${netWidth} ${netHeight}`">
            <!-- Connections -->
            <g v-for="conn in connections" :key="conn.key">
              <line
                :x1="conn.x1" :y1="conn.y1" :x2="conn.x2" :y2="conn.y2"
                :stroke="conn.w > 0 ? '#00d4ff' : '#ff4444'"
                :stroke-width="Math.max(0.5, Math.abs(conn.w) * 3)"
                :opacity="conn.active ? 0.9 : 0.2"
              />
            </g>

            <!-- Nodes -->
            <g v-for="node in netNodes" :key="node.key">
              <circle :cx="node.x" :cy="node.y" :r="node.r"
                :fill="nodeColor(node.activation)"
                :stroke="node.highlight ? '#00d4ff' : '#2d3748'"
                :stroke-width="node.highlight ? 2.5 : 1"
              />
              <text :x="node.x" :y="node.y + 4" font-family="monospace" font-size="9"
                fill="white" text-anchor="middle" opacity="0.9">
                {{ formatVal(node.activation) }}
              </text>
              <text :x="node.x" :y="node.y + node.r + 12" font-family="monospace" font-size="9"
                fill="#4a5568" text-anchor="middle">
                {{ node.label }}
              </text>
            </g>

            <!-- Layer labels -->
            <g v-for="(lbl, i) in layerLabels" :key="i">
              <text :x="layerX(i)" y="14" font-family="monospace" font-size="10"
                fill="#4a5568" text-anchor="middle">{{ lbl }}</text>
            </g>
          </svg>
        </div>

        <!-- Right: inputs + info -->
        <div class="space-y-4">
          <!-- Input sliders -->
          <div class="bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg p-4">
            <div class="font-mono text-xs text-[var(--color-text-muted)] mb-2">输入值</div>
            <div class="space-y-2">
              <div v-for="(_, i) in inputs" :key="i" class="flex items-center gap-2">
                <span class="font-mono text-xs text-[var(--color-text-muted)] w-6">x{{ i+1 }}</span>
                <input type="range" v-model.number="inputs[i]" min="-1" max="1" step="0.05"
                  class="flex-1 accent-cyan-400" />
                <span class="font-mono text-xs text-[var(--color-neon-cyan)] w-10 text-right">{{ inputs[i].toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <!-- Node detail -->
          <div class="bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg p-4">
            <div class="font-mono text-xs text-[var(--color-text-muted)] mb-2">节点详情</div>
            <div v-if="selectedNode" class="space-y-1">
              <div class="font-mono text-xs">
                <span class="text-[var(--color-text-muted)]">节点：</span>
                <span class="text-[var(--color-neon-cyan)]">{{ selectedNode.label }}</span>
              </div>
              <div class="font-mono text-xs">
                <span class="text-[var(--color-text-muted)]">∑wx+b = </span>
                <span class="text-white">{{ formatVal(selectedNode.preact) }}</span>
              </div>
              <div class="font-mono text-xs">
                <span class="text-[var(--color-text-muted)]">激活值 = </span>
                <span class="text-[var(--color-neon-green)]">{{ formatVal(selectedNode.activation) }}</span>
              </div>
            </div>
            <div v-else class="font-mono text-xs text-[var(--color-text-muted)]">点击节点查看</div>
          </div>

          <!-- Output -->
          <div class="bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg p-4">
            <div class="font-mono text-xs text-[var(--color-text-muted)] mb-2">输出层</div>
            <div class="space-y-1">
              <div v-for="(v, i) in outputValues" :key="i" class="flex items-center gap-2">
                <span class="font-mono text-xs text-[var(--color-text-muted)] w-6">y{{ i+1 }}</span>
                <div class="flex-1 h-3 bg-[var(--color-void)] rounded overflow-hidden">
                  <div class="h-full bg-[var(--color-neon-cyan)] opacity-70 transition-all duration-300"
                    :style="{ width: `${Math.abs(v) * 100}%` }" />
                </div>
                <span class="font-mono text-xs text-[var(--color-neon-cyan)] w-12 text-right">{{ formatVal(v) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `Neural Net | ${siteName}` })
// ─── Types ───────────────────────────────────────────────────────────────────
interface NodeDef { layerIdx: number; nodeIdx: number; x: number; y: number; r: number
  activation: number; preact: number; label: string; highlight: boolean; key: string }
interface ConnDef { x1: number; y1: number; x2: number; y2: number; w: number; active: boolean; key: string }

// ─── Config state ────────────────────────────────────────────────────────────
const activation = ref<'relu'|'sigmoid'|'tanh'>('relu')
const numHidden = ref(2)
const hiddenSize = ref(4)
const animating = ref(false)

// Network layers: array of node counts
const layers = computed(() => [inputs.value.length, ...Array(numHidden.value).fill(hiddenSize.value), 2])

const inputs = ref([0.5, -0.3, 0.8])
const weights = ref<number[][][]>([]) // weights[layer][to][from]
const biases = ref<number[][]>([])   // biases[layer][node]
const activations = ref<number[][]>([])
const preactivations = ref<number[][]>([])
const activeLayer = ref(-1)

// ─── Network geometry ─────────────────────────────────────────────────────────
const netHeight = 380
const netWidth = computed(() => Math.max(500, layers.value.length * 110 + 60))
const nodeR = 20

function layerX(i: number) {
  const total = layers.value.length
  return 50 + i * ((netWidth.value - 100) / Math.max(total - 1, 1))
}
function nodeY(layerIdx: number, nodeIdx: number) {
  const count = layers.value[layerIdx]
  const spacing = Math.min(60, (netHeight - 60) / Math.max(count - 1, 1))
  const total = spacing * (count - 1)
  const start = (netHeight - total) / 2
  return start + nodeIdx * spacing
}

const layerLabels = computed(() => {
  const l = layers.value.length
  return layers.value.map((_, i) => i === 0 ? '输入层' : i === l-1 ? '输出层' : `隐藏 ${i}`)
})

const netNodes = computed<NodeDef[]>(() => {
  const nodes: NodeDef[] = []
  layers.value.forEach((count, li) => {
    for (let ni = 0; ni < count; ni++) {
      const act = activations.value[li]?.[ni] ?? 0
      nodes.push({
        layerIdx: li, nodeIdx: ni,
        x: layerX(li), y: nodeY(li, ni), r: nodeR,
        activation: act,
        preact: preactivations.value[li]?.[ni] ?? act,
        label: li === 0 ? `x${ni+1}` : li === layers.value.length-1 ? `y${ni+1}` : `h${li}.${ni+1}`,
        highlight: activeLayer.value === li,
        key: `${li}-${ni}`
      })
    }
  })
  return nodes
})

const connections = computed<ConnDef[]>(() => {
  const conns: ConnDef[] = []
  for (let li = 0; li < layers.value.length - 1; li++) {
    const fromCount = layers.value[li]
    const toCount = layers.value[li+1]
    for (let fi = 0; fi < fromCount; fi++) {
      for (let ti = 0; ti < toCount; ti++) {
        const w = weights.value[li]?.[ti]?.[fi] ?? 0
        conns.push({
          x1: layerX(li), y1: nodeY(li, fi),
          x2: layerX(li+1), y2: nodeY(li+1, ti),
          w, active: activeLayer.value > li,
          key: `${li}-${fi}-${ti}`
        })
      }
    }
  }
  return conns
})

const outputValues = computed(() => activations.value[layers.value.length-1] ?? [])

const selectedNode = ref<NodeDef | null>(null)

// ─── Activation functions ─────────────────────────────────────────────────────
function activate(x: number): number {
  if (activation.value === 'relu') return Math.max(0, x)
  if (activation.value === 'sigmoid') return 1 / (1 + Math.exp(-x))
  return Math.tanh(x)
}

function nodeColor(v: number): string {
  const t = Math.max(0, Math.min(1, (v + 1) / 2))
  const r = Math.round(t * 0)
  const g = Math.round(t * 212)
  const b = Math.round(t * 255)
  return `rgba(${r},${g},${b},${0.15 + t * 0.7})`
}

function formatVal(v: number) { return isNaN(v) ? '—' : v.toFixed(3) }

// ─── Init ─────────────────────────────────────────────────────────────────────
function initNetwork() {
  const W: number[][][] = []
  const B: number[][] = []
  for (let li = 0; li < layers.value.length - 1; li++) {
    const fromN = layers.value[li]
    const toN = layers.value[li+1]
    W.push(Array.from({ length: toN }, () => Array.from({ length: fromN }, () => (Math.random() * 2 - 1) * 0.8)))
    B.push(Array.from({ length: toN }, () => (Math.random() * 2 - 1) * 0.3))
  }
  weights.value = W
  biases.value = B
  forwardPass(false)
}

function randomWeights() { initNetwork() }

function loadXOR() {
  numHidden.value = 1
  hiddenSize.value = 2
  inputs.value = [1, 1]
  nextTick(() => {
    weights.value = [
      [[1, 1], [1, 1]],    // input->hidden
      [[1, -2]]             // hidden->output
    ]
    biases.value = [[-0.5, -1.5], [-0.5]]
    forwardPass(false)
  })
}

function forwardPass(doAnimate: boolean) {
  const acts: number[][] = [inputs.value.slice()]
  const preacts: number[][] = [inputs.value.slice()]
  for (let li = 0; li < layers.value.length - 1; li++) {
    const fromActs = acts[li]
    const toN = layers.value[li+1]
    const layerActs: number[] = []
    const layerPre: number[] = []
    for (let ti = 0; ti < toN; ti++) {
      let sum = biases.value[li]?.[ti] ?? 0
      for (let fi = 0; fi < fromActs.length; fi++) {
        sum += fromActs[fi] * (weights.value[li]?.[ti]?.[fi] ?? 0)
      }
      layerPre.push(sum)
      layerActs.push(li < layers.value.length - 2 ? activate(sum) : 1 / (1 + Math.exp(-sum)))
    }
    acts.push(layerActs)
    preacts.push(layerPre)
  }
  activations.value = acts
  preactivations.value = preacts
}

async function runForward() {
  if (animating.value) return
  animating.value = true
  activeLayer.value = 0
  for (let li = 0; li <= layers.value.length - 1; li++) {
    activeLayer.value = li
    forwardPass(false)
    await new Promise(r => setTimeout(r, 350))
  }
  activeLayer.value = -1
  animating.value = false
}

watch([inputs, activation], () => forwardPass(false), { deep: true })

onMounted(() => initNetwork())
</script>
