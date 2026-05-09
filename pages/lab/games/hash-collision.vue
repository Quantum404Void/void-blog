<template>
  <div class="min-h-screen bg-[var(--color-void)] text-[var(--color-text-primary)] font-mono">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'hash-collision' }]" />

    <div class="max-w-5xl mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold text-[var(--color-neon-cyan)] mb-2">Hash Collision & Birthday Paradox</h1>
      <p class="text-[var(--color-text-muted)] mb-6 text-sm">Visualize probability collisions in hashing and birthday problems</p>

      <!-- Tabs -->
      <div class="flex gap-2 mb-8">
        <button
          v-for="t in ['birthday', 'hash']"
          :key="t"
          @click="tab = t as 'birthday' | 'hash'"
          class="px-4 py-1.5 text-sm rounded border transition-colors"
          :class="tab === t
            ? 'border-[var(--color-neon-cyan)] bg-[var(--color-neon-cyan)] text-black font-bold'
            : 'border-[var(--color-void-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-void-card)]'"
        >
          {{ t === 'birthday' ? '🎂 Birthday Paradox' : '#️⃣ Hash Collision' }}
        </button>
      </div>

      <!-- BIRTHDAY PARADOX -->
      <div v-if="tab === 'birthday'">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div class="mb-4">
              <label class="block text-sm text-[var(--color-text-muted)] mb-2">
                Room size: <span class="text-[var(--color-neon-cyan)]">{{ roomSize }} people</span>
              </label>
              <input type="range" v-model.number="roomSize" min="1" max="100" class="w-full accent-[var(--color-neon-cyan)]" />
            </div>

            <!-- Probability gauge -->
            <div class="p-4 bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded mb-4">
              <div class="text-xs text-[var(--color-text-muted)] mb-2">Theoretical Probability of Shared Birthday</div>
              <div class="text-4xl font-bold mb-3" :style="{ color: probColor }">
                {{ (birthdayProb * 100).toFixed(2) }}%
              </div>
              <div class="w-full h-3 bg-[var(--color-void)] rounded overflow-hidden">
                <div
                  class="h-full rounded transition-all duration-300"
                  :style="{ width: (birthdayProb * 100) + '%', background: probColor }"
                />
              </div>
              <div class="mt-2 text-xs text-[var(--color-text-muted)]">
                P = 1 - (365! / (365-n)!) / 365^n where n = {{ roomSize }}
              </div>
            </div>

            <!-- Simulation controls -->
            <div class="p-4 bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded mb-4">
              <div class="text-xs text-[var(--color-text-muted)] mb-3">Monte Carlo Simulation</div>
              <div class="flex gap-2 mb-3">
                <button @click="runSimulation" :disabled="simRunning" class="px-3 py-1.5 text-sm bg-[var(--color-neon-cyan)] text-black font-bold rounded hover:opacity-80 disabled:opacity-40">
                  {{ simRunning ? 'Running...' : 'Simulate 10k' }}
                </button>
                <button @click="resetSim" class="px-3 py-1.5 text-sm border border-[var(--color-void-border)] text-[var(--color-text-muted)] rounded hover:bg-[var(--color-void)]">
                  Reset
                </button>
              </div>
              <div class="text-sm space-y-1">
                <div>Trials: <span class="text-[var(--color-neon-cyan)]">{{ simTrials.toLocaleString() }}</span></div>
                <div>Collisions: <span class="text-[var(--color-neon-green)]">{{ simCollisions.toLocaleString() }}</span></div>
                <div>Simulated P:
                  <span class="text-[var(--color-neon-cyan)] font-bold">
                    {{ simTrials > 0 ? ((simCollisions / simTrials) * 100).toFixed(2) + '%' : '—' }}
                  </span>
                </div>
                <div>Theory P: <span class="text-[var(--color-text-muted)]">{{ (birthdayProb * 100).toFixed(2) }}%</span></div>
              </div>
            </div>

            <!-- Key thresholds -->
            <div class="text-xs text-[var(--color-text-muted)] space-y-1">
              <div>At <span class="text-[var(--color-neon-cyan)]">23 people</span>: ~50.7% chance</div>
              <div>At <span class="text-[var(--color-neon-cyan)]">57 people</span>: ~99% chance</div>
            </div>
          </div>

          <!-- People grid animation -->
          <div>
            <div class="text-sm text-[var(--color-text-muted)] mb-3">People in Room (one recent collision highlighted)</div>
            <div class="p-4 bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded">
              <div class="flex flex-wrap gap-1.5 mb-4">
                <div
                  v-for="(person, i) in people"
                  :key="i"
                  class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 cursor-help"
                  :class="collidingIndices.has(i) ? 'border-[var(--color-neon-cyan)] shadow-[0_0_8px_var(--color-neon-cyan)]' : 'border-[var(--color-void-border)]'"
                  :style="{ background: personColor(person.birthday) }"
                  :title="`Day ${person.birthday}`"
                >
                  {{ i + 1 }}
                </div>
              </div>
              <button @click="generatePeople" class="text-xs border border-[var(--color-void-border)] px-3 py-1 rounded text-[var(--color-text-muted)] hover:bg-[var(--color-void)]">
                Regenerate
              </button>
              <div v-if="collisionPair.length === 2" class="mt-3 text-xs text-[var(--color-neon-cyan)]">
                💥 Person {{ collisionPair[0]+1 }} & {{ collisionPair[1]+1 }} share birthday day {{ people[collisionPair[0]]?.birthday }}!
              </div>
              <div v-else class="mt-3 text-xs text-[var(--color-text-muted)]">No collision found in current group.</div>
            </div>
          </div>
        </div>
      </div>

      <!-- HASH COLLISION -->
      <div v-else>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div class="mb-4">
              <label class="block text-sm text-[var(--color-text-muted)] mb-2">Strings (comma-separated)</label>
              <textarea
                v-model="hashInputStr"
                class="w-full h-28 bg-[var(--color-void-card)] border border-[var(--color-void-border)] text-[var(--color-text-primary)] p-3 rounded text-sm outline-none focus:border-[var(--color-neon-cyan)] resize-none"
                placeholder="hello, world, foo, bar, baz"
              />
            </div>
            <div class="mb-4">
              <label class="block text-sm text-[var(--color-text-muted)] mb-2">
                Bucket count: <span class="text-[var(--color-neon-cyan)]">{{ bucketCount }}</span>
              </label>
              <input type="range" v-model.number="bucketCount" min="4" max="32" class="w-full accent-[var(--color-neon-cyan)]" />
            </div>

            <!-- Hash results table -->
            <div class="overflow-x-auto">
              <table class="text-xs w-full border-collapse">
                <thead>
                  <tr class="text-[var(--color-text-muted)]">
                    <th class="text-left px-2 py-1 border-b border-[var(--color-void-border)]">String</th>
                    <th class="text-left px-2 py-1 border-b border-[var(--color-void-border)]">djb2 (hex)</th>
                    <th class="text-left px-2 py-1 border-b border-[var(--color-void-border)]">FNV-1a (hex)</th>
                    <th class="text-left px-2 py-1 border-b border-[var(--color-void-border)]">Bucket</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in hashItems" :key="item.str" class="hover:bg-[var(--color-void-card)]">
                    <td class="px-2 py-1 text-[var(--color-neon-cyan)]">{{ item.str }}</td>
                    <td class="px-2 py-1 text-[var(--color-neon-green)]">{{ item.djb2hex }}</td>
                    <td class="px-2 py-1 text-[var(--color-text-muted)]">{{ item.fnvhex }}</td>
                    <td class="px-2 py-1">
                      <span
                        class="px-1.5 py-0.5 rounded font-bold text-black text-[11px]"
                        :class="collisionBuckets.has(item.bucket) ? 'bg-red-500' : 'bg-[var(--color-neon-green)]'"
                      >{{ item.bucket }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Bucket visualization -->
          <div>
            <div class="text-sm text-[var(--color-text-muted)] mb-3">Bucket Distribution ({{ bucketCount }} buckets)</div>
            <div class="grid grid-cols-4 gap-1.5">
              <div
                v-for="b in bucketCount"
                :key="b-1"
                class="p-2 rounded border text-center min-h-[60px] flex flex-col"
                :class="collisionBuckets.has(b-1)
                  ? 'border-red-500 bg-red-500/10'
                  : bucketsMap[b-1]?.length
                    ? 'border-[var(--color-neon-green)] bg-[var(--color-neon-green)]/10'
                    : 'border-[var(--color-void-border)]'"
              >
                <div class="text-[10px] text-[var(--color-text-muted)] mb-1">#{{ b-1 }}</div>
                <div class="flex-1 flex flex-wrap gap-0.5 items-center justify-center">
                  <span
                    v-for="item in bucketsMap[b-1]"
                    :key="item.str"
                    class="text-[9px] px-1 rounded"
                    :class="collisionBuckets.has(b-1) ? 'bg-red-500 text-white' : 'bg-[var(--color-neon-green)] text-black'"
                  >{{ item.str }}</span>
                </div>
              </div>
            </div>
            <div class="mt-3 text-xs">
              <span v-if="collisionBuckets.size > 0" class="text-red-400">
                ⚠️ {{ collisionBuckets.size }} collision bucket(s) detected
              </span>
              <span v-else class="text-[var(--color-neon-green)]">✓ No collisions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const tab = ref<'birthday' | 'hash'>('birthday')

// ===== BIRTHDAY PARADOX =====
const roomSize = ref(23)
const simTrials = ref(0)
const simCollisions = ref(0)
const simRunning = ref(false)

interface Person { birthday: number }
const people = ref<Person[]>([])
const collidingIndices = ref<Set<number>>(new Set())
const collisionPair = ref<number[]>([])

const birthdayProb = computed(() => {
  const n = roomSize.value
  if (n >= 365) return 1
  let p = 1
  for (let i = 0; i < n; i++) p *= (365 - i) / 365
  return 1 - p
})

const probColor = computed(() => {
  const p = birthdayProb.value
  if (p < 0.3) return '#39ff14'
  if (p < 0.7) return '#ffd700'
  return '#ff6b6b'
})

function personColor(birthday: number): string {
  const hue = (birthday / 365) * 360
  return `hsl(${hue}, 60%, 25%)`
}

function generatePeople() {
  const n = roomSize.value
  const ps: Person[] = []
  for (let i = 0; i < n; i++) ps.push({ birthday: Math.floor(Math.random() * 365) + 1 })
  people.value = ps
  // find collision
  const seen = new Map<number, number>()
  const collSet = new Set<number>()
  let pair: number[] = []
  for (let i = 0; i < ps.length; i++) {
    const b = ps[i].birthday
    if (seen.has(b)) {
      if (pair.length === 0) pair = [seen.get(b)!, i]
      collSet.add(seen.get(b)!)
      collSet.add(i)
    } else {
      seen.set(b, i)
    }
  }
  collidingIndices.value = collSet
  collisionPair.value = pair
}

function resetSim() {
  simTrials.value = 0
  simCollisions.value = 0
}

async function runSimulation() {
  simRunning.value = true
  const n = roomSize.value
  const TRIALS = 10000
  let cols = 0
  for (let t = 0; t < TRIALS; t++) {
    const days = new Set<number>()
    let hit = false
    for (let i = 0; i < n; i++) {
      const d = Math.floor(Math.random() * 365)
      if (days.has(d)) { hit = true; break }
      days.add(d)
    }
    if (hit) cols++
  }
  simTrials.value += TRIALS
  simCollisions.value += cols
  simRunning.value = false
}

watch(roomSize, generatePeople, { immediate: true })

// ===== HASH COLLISION =====
const hashInputStr = ref('hello, world, foo, bar, baz, test, abc, xyz')
const bucketCount = ref(16)

function djb2(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0
  return h
}

function fnv1a(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = (h * 0x01000193) >>> 0
  }
  return h
}

interface HashItem { str: string; djb2hex: string; fnvhex: string; bucket: number }

const hashItems = computed<HashItem[]>(() => {
  return hashInputStr.value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(str => {
      const d = djb2(str)
      const f = fnv1a(str)
      return {
        str,
        djb2hex: d.toString(16).padStart(8, '0'),
        fnvhex: f.toString(16).padStart(8, '0'),
        bucket: d % bucketCount.value
      }
    })
})

const bucketsMap = computed<Record<number, HashItem[]>>(() => {
  const m: Record<number, HashItem[]> = {}
  for (const item of hashItems.value) {
    if (!m[item.bucket]) m[item.bucket] = []
    m[item.bucket].push(item)
  }
  return m
})

const collisionBuckets = computed(() => {
  const s = new Set<number>()
  for (const [b, items] of Object.entries(bucketsMap.value)) {
    if (items.length > 1) s.add(Number(b))
  }
  return s
})
</script>
