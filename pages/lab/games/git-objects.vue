<template>
  <div class="min-h-screen bg-[var(--color-void)] text-[var(--color-text-primary)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'git-objects' }]" />

    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="mb-6">
        <h1 class="text-2xl font-mono font-bold text-[var(--color-neon-cyan)] mb-1">
          git object model
        </h1>
        <p class="text-[var(--color-text-muted)] font-mono text-sm">
          Visualize how Git stores blobs, trees, commits, and refs. Try <kbd class="px-1 border border-[var(--color-void-border)] rounded text-[var(--color-neon-green)]">git init</kbd> to start.
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Left: Command Panel -->
        <div class="lg:col-span-1 flex flex-col gap-3">
          <!-- Command input -->
          <div class="rounded-lg border border-[var(--color-void-border)] bg-[var(--color-void-card)] p-4">
            <div class="font-mono text-xs text-[var(--color-text-muted)] mb-2">$ git command</div>
            <div class="flex gap-2">
              <input
                v-model="cmdInput"
                class="flex-1 bg-black border border-[var(--color-void-border)] rounded px-3 py-2 font-mono text-sm text-[var(--color-neon-green)] outline-none focus:border-[var(--color-neon-cyan)] transition-colors"
                placeholder="git init"
                @keydown.enter="runCmd"
              />
              <button
                class="px-4 py-2 rounded border font-mono text-sm transition-colors"
                :class="repoInit ? 'border-[var(--color-neon-cyan)] text-[var(--color-neon-cyan)] hover:bg-[var(--color-neon-cyan)] hover:text-black' : 'border-[var(--color-void-border)] text-[var(--color-text-muted)] hover:border-[var(--color-neon-green)] hover:text-[var(--color-neon-green)]'"
                @click="runCmd"
              >
                run
              </button>
            </div>

            <!-- Quick commands -->
            <div class="mt-3 flex flex-wrap gap-1">
              <button
                v-for="q in quickCmds"
                :key="q"
                class="px-2 py-1 rounded text-xs font-mono border border-[var(--color-void-border)] text-[var(--color-text-muted)] hover:border-[var(--color-neon-green)] hover:text-[var(--color-neon-green)] transition-colors"
                @click="cmdInput = q"
              >
                {{ q }}
              </button>
            </div>
          </div>

          <!-- Output log -->
          <div class="rounded-lg border border-[var(--color-void-border)] bg-[var(--color-void-card)] p-4 flex-1">
            <div class="font-mono text-xs text-[var(--color-text-muted)] mb-2">output</div>
            <div
              ref="logEl"
              class="font-mono text-xs space-y-1 overflow-y-auto"
              style="max-height: 280px;"
            >
              <div
                v-for="(entry, i) in log"
                :key="i"
                :class="entry.type === 'error' ? 'text-red-400' : entry.type === 'success' ? 'text-[var(--color-neon-green)]' : 'text-[var(--color-text-muted)]'"
              >
                <span v-if="entry.type === 'cmd'" class="text-[var(--color-neon-cyan)]">$ </span>{{ entry.text }}
              </div>
              <div v-if="log.length === 0" class="text-[var(--color-text-muted)]">Run <span class="text-[var(--color-neon-green)]">git init</span> to start</div>
            </div>
          </div>

          <!-- Auto-demo button -->
          <button
            class="w-full py-2 rounded border font-mono text-sm transition-colors"
            :class="demoRunning
              ? 'border-red-400 text-red-400 hover:bg-red-400 hover:text-black'
              : 'border-[var(--color-neon-cyan)] text-[var(--color-neon-cyan)] hover:bg-[var(--color-neon-cyan)] hover:text-black'"
            @click="toggleDemo"
          >
            {{ demoRunning ? '⏹ stop demo' : '▶ auto demo' }}
          </button>

          <!-- Reset -->
          <button
            class="w-full py-2 rounded border border-[var(--color-void-border)] font-mono text-sm text-[var(--color-text-muted)] hover:border-red-400 hover:text-red-400 transition-colors"
            @click="resetRepo"
          >
            ↺ reset
          </button>
        </div>

        <!-- Right: Visualization -->
        <div class="lg:col-span-2 flex flex-col gap-3">
          <!-- SVG Graph -->
          <div
            class="rounded-lg border border-[var(--color-void-border)] bg-black overflow-hidden relative"
            style="height: 420px;"
          >
            <div class="absolute top-3 left-3 font-mono text-xs text-[var(--color-text-muted)]">object graph</div>
            <svg
              ref="svgEl"
              width="100%"
              height="100%"
              @click="handleSvgClick"
            >
              <!-- Arrow defs -->
              <defs>
                <marker id="arrow-commit" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="#a78bfa" opacity="0.7" />
                </marker>
                <marker id="arrow-tree" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="#00d4ff" opacity="0.7" />
                </marker>
                <marker id="arrow-ref" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="#fb923c" opacity="0.7" />
                </marker>
              </defs>

              <!-- Edges -->
              <g v-for="edge in edges" :key="edge.id">
                <line
                  :x1="edge.x1" :y1="edge.y1"
                  :x2="edge.x2" :y2="edge.y2"
                  :stroke="edge.color"
                  stroke-width="1.5"
                  stroke-opacity="0.6"
                  :marker-end="`url(#arrow-${edge.kind})`"
                  stroke-dasharray="4 2"
                />
              </g>

              <!-- Nodes -->
              <g
                v-for="node in visNodes"
                :key="node.id"
                :transform="`translate(${node.x},${node.y})`"
                class="cursor-pointer"
                :class="{ 'opacity-0': node.entering }"
                :style="{ transition: 'opacity 0.4s', opacity: node.entering ? 0 : 1 }"
                @click.stop="selectNode(node)"
              >
                <!-- Commit: circle -->
                <template v-if="node.kind === 'commit'">
                  <circle
                    r="28"
                    :fill="selectedNode?.id === node.id ? '#2d1b69' : '#1a0a3d'"
                    :stroke="selectedNode?.id === node.id ? '#a78bfa' : '#7c3aed'"
                    stroke-width="2"
                  />
                  <text text-anchor="middle" y="-8" fill="#a78bfa" font-size="16">⬤</text>
                  <text text-anchor="middle" y="6" fill="#a78bfa" font-size="9" font-family="monospace">{{ node.sha.slice(0,7) }}</text>
                  <text text-anchor="middle" y="18" fill="#c4b5fd" font-size="8" font-family="monospace">{{ truncate(node.label, 12) }}</text>
                </template>

                <!-- Tree: diamond -->
                <template v-else-if="node.kind === 'tree'">
                  <rect
                    x="-24" y="-24" width="48" height="48"
                    rx="4"
                    :fill="selectedNode?.id === node.id ? '#0a2a2a' : '#051515'"
                    :stroke="selectedNode?.id === node.id ? '#00d4ff' : '#0891b2'"
                    stroke-width="2"
                    transform="rotate(45)"
                  />
                  <text text-anchor="middle" y="-6" fill="#00d4ff" font-size="14">📁</text>
                  <text text-anchor="middle" y="8" fill="#00d4ff" font-size="9" font-family="monospace">{{ node.sha.slice(0,7) }}</text>
                </template>

                <!-- Blob: rect -->
                <template v-else-if="node.kind === 'blob'">
                  <rect
                    x="-28" y="-20" width="56" height="40"
                    rx="6"
                    :fill="selectedNode?.id === node.id ? '#0a1f0a' : '#051005'"
                    :stroke="selectedNode?.id === node.id ? '#39ff14' : '#16a34a'"
                    stroke-width="2"
                  />
                  <text text-anchor="middle" y="-4" fill="#39ff14" font-size="12">📄</text>
                  <text text-anchor="middle" y="8" fill="#39ff14" font-size="9" font-family="monospace">{{ node.sha.slice(0,7) }}</text>
                  <text text-anchor="middle" y="18" fill="#86efac" font-size="8" font-family="monospace">{{ truncate(node.label, 10) }}</text>
                </template>

                <!-- Ref: tag -->
                <template v-else-if="node.kind === 'ref'">
                  <rect
                    x="-32" y="-14" width="64" height="28"
                    rx="14"
                    :fill="selectedNode?.id === node.id ? '#2a1400' : '#150a00'"
                    :stroke="node.label === 'HEAD' ? '#f87171' : (selectedNode?.id === node.id ? '#fb923c' : '#c2410c')"
                    stroke-width="2"
                  />
                  <text
                    text-anchor="middle" y="5"
                    :fill="node.label === 'HEAD' ? '#f87171' : '#fb923c'"
                    font-size="10" font-family="monospace" font-weight="bold"
                  >{{ node.label }}</text>
                </template>
              </g>

              <!-- Empty state -->
              <text v-if="visNodes.length === 0" x="50%" y="50%" text-anchor="middle" fill="#374151" font-size="14" font-family="monospace">
                Run git init to create a repository
              </text>
            </svg>
          </div>

          <!-- Object detail panel -->
          <div
            v-if="selectedNode"
            class="rounded-lg border border-[var(--color-void-border)] bg-[var(--color-void-card)] p-4 font-mono text-xs"
          >
            <div class="flex items-center justify-between mb-2">
              <span :style="{ color: kindColor(selectedNode.kind) }" class="font-bold uppercase text-xs">
                {{ selectedNode.kind }}
              </span>
              <button class="text-[var(--color-text-muted)] hover:text-white" @click="selectedNode = null">✕</button>
            </div>
            <div class="space-y-1 text-[var(--color-text-muted)]">
              <div><span class="text-[var(--color-neon-cyan)]">sha1:</span> {{ selectedNode.sha }}</div>
              <div v-if="selectedNode.label"><span class="text-[var(--color-neon-cyan)]">label:</span> {{ selectedNode.label }}</div>
              <div v-if="selectedNode.detail">
                <span class="text-[var(--color-neon-cyan)]">content:</span>
                <pre class="mt-1 pl-4 text-[var(--color-text-primary)] whitespace-pre-wrap">{{ selectedNode.detail }}</pre>
              </div>
            </div>
          </div>

          <!-- Object store -->
          <div class="rounded-lg border border-[var(--color-void-border)] bg-[var(--color-void-card)] p-4">
            <div class="font-mono text-xs text-[var(--color-text-muted)] mb-2">.git/objects/</div>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="obj in allObjects"
                :key="obj.id"
                class="px-2 py-1 rounded border font-mono text-xs cursor-pointer transition-colors"
                :style="{ borderColor: kindColor(obj.kind) + '60', color: kindColor(obj.kind) }"
                :class="{ 'ring-1': selectedNode?.id === obj.id }"
                :style2="selectedNode?.id === obj.id ? { boxShadow: `0 0 0 1px ${kindColor(obj.kind)}` } : {}"
                @click="selectNode(obj)"
              >
                {{ obj.kind[0] }} {{ obj.sha.slice(0,7) }}
              </div>
              <div v-if="allObjects.length === 0" class="text-[var(--color-text-muted)] text-xs font-mono">
                empty — no objects yet
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, nextTick } from 'vue'

definePageMeta({ layout: 'default' })

// --- Types ---
type ObjKind = 'blob' | 'tree' | 'commit' | 'ref'

interface GitObject {
  id: string
  kind: ObjKind
  sha: string
  label: string
  detail?: string
  // parents (for commits)
  parentIds?: string[]
  // tree ref (for commits)
  treeId?: string
  // blob/tree refs (for trees)
  childIds?: string[]
  // target (for refs)
  targetId?: string
}

interface VisNode extends GitObject {
  x: number
  y: number
  entering: boolean
}

interface Edge {
  id: string
  x1: number; y1: number; x2: number; y2: number
  color: string
  kind: string
}

// --- State ---
const cmdInput = ref('git init')
const log = ref<{ type: 'cmd' | 'success' | 'error' | 'info'; text: string }[]>([])
const logEl = ref<HTMLElement>()
const svgEl = ref<SVGElement>()
const selectedNode = ref<VisNode | null>(null)
const demoRunning = ref(false)
let demoTimer: ReturnType<typeof setTimeout>

// Repo state
const repoInit = ref(false)
const objects = ref<GitObject[]>([])
const refs = ref<Record<string, string>>({}) // name -> object id
const HEAD = ref<string>('main') // branch name or commit id
const currentBranch = ref<string>('main')
const stagingArea = ref<{ filename: string; blobId: string }[]>([])
const workingTree = ref<{ filename: string; content: string }[]>([
  { filename: 'README.md', content: '# My Project\n\nHello, world!' },
  { filename: 'main.js', content: 'console.log("hello")' },
  { filename: 'style.css', content: 'body { margin: 0; }' },
])

const quickCmds = [
  'git init',
  'git add README.md',
  'git add .',
  'git commit -m "init"',
  'git branch feature',
  'git checkout feature',
  'git commit -m "feature"',
  'git merge feature',
]

// --- SHA simulation ---
let shaCounter = 0
function fakeSha(): string {
  shaCounter++
  return Array.from({ length: 40 }, (_, i) =>
    '0123456789abcdef'[Math.floor(Math.random() * 16)]
  ).join('')
}

function addObject(obj: Omit<GitObject, 'id'>): GitObject {
  const id = `obj-${Date.now()}-${Math.random()}`
  const full: GitObject = { id, ...obj }
  objects.value.push(full)
  return full
}

// --- Layout ---
const LAYER_X: Record<ObjKind, number> = {
  ref: 80,
  commit: 220,
  tree: 380,
  blob: 540,
}

function layoutNodes(): VisNode[] {
  const byKind: Record<ObjKind, GitObject[]> = { ref: [], commit: [], tree: [], blob: [] }
  for (const obj of objects.value) byKind[obj.kind].push(obj)

  const nodes: VisNode[] = []
  const svgH = 400
  const place = (obj: GitObject, idx: number, total: number): VisNode => {
    const x = LAYER_X[obj.kind]
    const spacing = Math.min(80, (svgH - 80) / Math.max(1, total))
    const y = 50 + idx * spacing
    return { ...obj, x, y, entering: false }
  }

  for (const kind of ['ref', 'commit', 'tree', 'blob'] as ObjKind[]) {
    byKind[kind].forEach((obj, i) => {
      nodes.push(place(obj, i, byKind[kind].length))
    })
  }
  return nodes
}

const visNodes = computed<VisNode[]>(() => layoutNodes())

const allObjects = computed(() => objects.value)

function getNode(id: string): VisNode | undefined {
  return visNodes.value.find(n => n.id === id)
}

const edges = computed<Edge[]>(() => {
  const result: Edge[] = []
  for (const n of visNodes.value) {
    // commit → parent commit
    for (const pid of n.parentIds || []) {
      const p = getNode(pid)
      if (p) result.push({ id: `${n.id}->${pid}`, x1: n.x - 28, y1: n.y, x2: p.x + 28, y2: p.y, color: '#a78bfa', kind: 'commit' })
    }
    // commit → tree
    if (n.treeId) {
      const t = getNode(n.treeId)
      if (t) result.push({ id: `${n.id}->tree`, x1: n.x + 28, y1: n.y, x2: t.x - 28, y2: t.y, color: '#00d4ff', kind: 'tree' })
    }
    // tree → children
    for (const cid of n.childIds || []) {
      const c = getNode(cid)
      if (c) result.push({ id: `${n.id}->${cid}`, x1: n.x + 28, y1: n.y, x2: c.x - 28, y2: c.y, color: '#00d4ff', kind: 'tree' })
    }
    // ref → target
    if (n.targetId) {
      const t = getNode(n.targetId)
      if (t) result.push({ id: `${n.id}->ref`, x1: n.x + 32, y1: n.y, x2: t.x - 28, y2: t.y, color: '#fb923c', kind: 'ref' })
    }
  }
  return result
})

// --- Helpers ---
function truncate(s: string, n: number) { return s.length > n ? s.slice(0, n) + '…' : s }
function kindColor(k: ObjKind | string): string {
  switch (k) {
    case 'blob': return '#39ff14'
    case 'tree': return '#00d4ff'
    case 'commit': return '#a78bfa'
    case 'ref': return '#fb923c'
    default: return '#888'
  }
}

function pushLog(type: 'cmd' | 'success' | 'error' | 'info', text: string) {
  log.value.push({ type, text })
  nextTick(() => {
    if (logEl.value) logEl.value.scrollTop = logEl.value.scrollHeight
  })
}

// --- Git operations ---
function gitInit() {
  if (repoInit.value) { pushLog('info', 'Reinitialized existing Git repository'); return }
  repoInit.value = true
  refs.value = {}
  objects.value = []
  stagingArea.value = []
  HEAD.value = 'main'
  currentBranch.value = 'main'
  pushLog('success', 'Initialized empty Git repository in .git/')
}

function gitAdd(file: string) {
  if (!repoInit.value) { pushLog('error', 'fatal: not a git repository'); return }
  const files = file === '.' ? workingTree.value : workingTree.value.filter(f => f.filename === file)
  if (!files.length) { pushLog('error', `error: pathspec '${file}' did not match any files`); return }
  for (const f of files) {
    const existing = stagingArea.value.find(s => s.filename === f.filename)
    if (existing) {
      // update blob
      const blob = addObject({ kind: 'blob', sha: fakeSha(), label: f.filename, detail: f.content })
      existing.blobId = blob.id
      pushLog('success', `updated blob for ${f.filename}`)
    } else {
      const blob = addObject({ kind: 'blob', sha: fakeSha(), label: f.filename, detail: f.content })
      stagingArea.value.push({ filename: f.filename, blobId: blob.id })
      pushLog('success', `blob ${blob.sha.slice(0,7)}  (${f.filename})`)
    }
  }
}

function gitCommit(message: string) {
  if (!repoInit.value) { pushLog('error', 'fatal: not a git repository'); return }
  if (!stagingArea.value.length) { pushLog('error', 'nothing to commit, working tree clean'); return }

  // create tree
  const childIds = stagingArea.value.map(s => s.blobId)
  const tree = addObject({
    kind: 'tree',
    sha: fakeSha(),
    label: 'root',
    detail: stagingArea.value.map(s => `blob ${s.blobId.slice(0,7)} ${s.filename}`).join('\n'),
    childIds,
  })

  // parent commit
  const parentId = refs.value[currentBranch.value]
  const commit = addObject({
    kind: 'commit',
    sha: fakeSha(),
    label: message,
    detail: `tree ${tree.sha.slice(0,7)}\n${parentId ? 'parent ' + (objects.value.find(o => o.id === parentId)?.sha.slice(0,7) || '') + '\n' : ''}author void <void@blog> ${new Date().toISOString()}\n\n${message}`,
    treeId: tree.id,
    parentIds: parentId ? [parentId] : [],
  })

  // update branch ref
  const branchObj = objects.value.find(o => o.kind === 'ref' && o.label === currentBranch.value)
  if (branchObj) {
    branchObj.targetId = commit.id
    refs.value[currentBranch.value] = commit.id
  } else {
    const refObj = addObject({ kind: 'ref', sha: fakeSha(), label: currentBranch.value, detail: commit.sha, targetId: commit.id })
    refs.value[currentBranch.value] = commit.id
  }

  // HEAD ref
  const headObj = objects.value.find(o => o.kind === 'ref' && o.label === 'HEAD')
  if (!headObj) {
    addObject({ kind: 'ref', sha: fakeSha(), label: 'HEAD', detail: `ref: refs/heads/${currentBranch.value}`, targetId: objects.value.find(o => o.kind === 'ref' && o.label === currentBranch.value)?.id })
  } else {
    headObj.targetId = objects.value.find(o => o.kind === 'ref' && o.label === currentBranch.value)?.id
  }

  stagingArea.value = []
  pushLog('success', `[${currentBranch.value} ${commit.sha.slice(0,7)}] ${message}`)
  pushLog('info', `${childIds.length} file${childIds.length !== 1 ? 's' : ''} changed`)
}

function gitBranch(name: string) {
  if (!repoInit.value) { pushLog('error', 'fatal: not a git repository'); return }
  if (!name) {
    // list
    const branches = Object.keys(refs.value)
    branches.forEach(b => pushLog('info', (b === currentBranch.value ? '* ' : '  ') + b))
    return
  }
  if (refs.value[name] !== undefined) { pushLog('error', `fatal: A branch named '${name}' already exists.`); return }
  const currentCommitId = refs.value[currentBranch.value]
  refs.value[name] = currentCommitId
  addObject({ kind: 'ref', sha: fakeSha(), label: name, detail: currentCommitId ? objects.value.find(o => o.id === currentCommitId)?.sha : 'empty', targetId: currentCommitId })
  pushLog('success', `branch '${name}' created`)
}

function gitCheckout(name: string) {
  if (!repoInit.value) { pushLog('error', 'fatal: not a git repository'); return }
  if (refs.value[name] === undefined) { pushLog('error', `error: pathspec '${name}' did not match any branch`); return }
  currentBranch.value = name
  HEAD.value = name
  const headObj = objects.value.find(o => o.kind === 'ref' && o.label === 'HEAD')
  const branchObj = objects.value.find(o => o.kind === 'ref' && o.label === name)
  if (headObj && branchObj) headObj.targetId = branchObj.id
  pushLog('success', `Switched to branch '${name}'`)
}

function gitMerge(name: string) {
  if (!repoInit.value) { pushLog('error', 'fatal: not a git repository'); return }
  if (refs.value[name] === undefined) { pushLog('error', `merge: ${name} - not something we can merge`); return }
  const srcId = refs.value[name]
  const dstId = refs.value[currentBranch.value]
  if (srcId === dstId) { pushLog('info', 'Already up to date.'); return }

  // Fake merge commit
  const srcCommit = objects.value.find(o => o.id === srcId)
  const dstCommit = objects.value.find(o => o.id === dstId)

  // merge tree
  const tree = addObject({ kind: 'tree', sha: fakeSha(), label: 'merged', childIds: [] })

  const mergeCommit = addObject({
    kind: 'commit',
    sha: fakeSha(),
    label: `Merge branch '${name}'`,
    detail: `tree ${tree.sha.slice(0,7)}\nparent ${dstCommit?.sha.slice(0,7) || ''}\nparent ${srcCommit?.sha.slice(0,7) || ''}\n\nMerge branch '${name}'`,
    treeId: tree.id,
    parentIds: [dstId, srcId].filter(Boolean),
  })

  refs.value[currentBranch.value] = mergeCommit.id
  const branchObj = objects.value.find(o => o.kind === 'ref' && o.label === currentBranch.value)
  if (branchObj) branchObj.targetId = mergeCommit.id

  pushLog('success', `Merge made by the 'ort' strategy.`)
  pushLog('info', `[${currentBranch.value} ${mergeCommit.sha.slice(0,7)}] Merge branch '${name}'`)
}

// --- Command parser ---
function runCmd() {
  const raw = cmdInput.value.trim()
  if (!raw) return
  pushLog('cmd', raw)

  const parts = raw.split(/\s+/)
  if (parts[0] !== 'git') { pushLog('error', `${parts[0]}: command not found`); return }

  const sub = parts[1]
  const args = parts.slice(2)

  switch (sub) {
    case 'init': gitInit(); break
    case 'add': gitAdd(args[0] || '.'); break
    case 'commit': {
      const mi = args.indexOf('-m')
      const msg = mi >= 0 ? args.slice(mi + 1).join(' ').replace(/^"|"$/g, '') : 'commit'
      gitCommit(msg)
      break
    }
    case 'branch': gitBranch(args[0] || ''); break
    case 'checkout': gitCheckout(args[0] || ''); break
    case 'merge': gitMerge(args[0] || ''); break
    default:
      pushLog('error', `git: '${sub}' is not a git command. See 'git --help'.`)
  }

  cmdInput.value = ''
}

// --- Auto demo ---
const demoSequence = [
  'git init',
  'git add README.md',
  'git add main.js',
  'git commit -m "initial commit"',
  'git branch feature',
  'git checkout feature',
  'git add style.css',
  'git commit -m "add styles"',
  'git checkout main',
  'git merge feature',
]

function runDemoStep(steps: string[], idx: number) {
  if (idx >= steps.length || !demoRunning.value) {
    demoRunning.value = false
    return
  }
  cmdInput.value = steps[idx]
  runCmd()
  demoTimer = setTimeout(() => runDemoStep(steps, idx + 1), 1200)
}

function toggleDemo() {
  if (demoRunning.value) {
    demoRunning.value = false
    clearTimeout(demoTimer)
  } else {
    resetRepo()
    demoRunning.value = true
    demoTimer = setTimeout(() => runDemoStep(demoSequence, 0), 400)
  }
}

function resetRepo() {
  clearTimeout(demoTimer)
  demoRunning.value = false
  repoInit.value = false
  objects.value = []
  refs.value = {}
  HEAD.value = 'main'
  currentBranch.value = 'main'
  stagingArea.value = []
  log.value = []
  selectedNode.value = null
}

// --- Interaction ---
function selectNode(node: GitObject) {
  const vn = visNodes.value.find(n => n.id === node.id)
  selectedNode.value = vn || null
}

function handleSvgClick() {
  selectedNode.value = null
}

onUnmounted(() => {
  clearTimeout(demoTimer)
})
</script>
