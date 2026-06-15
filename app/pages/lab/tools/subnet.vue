<template>
  <div class="min-h-screen" style="background:var(--color-void);color:#e0e0e0">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'tools', href: '/lab' }, { label: 'Subnet Calc' }]" />
    <div class="max-w-3xl mx-auto px-4 py-12">
      <h1 class="text-3xl font-bold mb-2" style="color:#39ff14;font-family:monospace">
        <span style="color:#00ffff">~/</span>subnet
      </h1>
      <p class="mb-8 text-sm" style="color:#666">IPv4 子网计算器</p>

      <!-- Input -->
      <div class="mb-6">
        <label class="block text-xs mb-1" style="color:#888;font-family:monospace">IP / CIDR</label>
        <input
          v-model="input"
          type="text"
          placeholder="192.168.1.0/24"
          class="w-full px-4 py-3 rounded text-sm"
          style="background:var(--color-void-card);border:1px solid #333;color:#e0e0e0;font-family:monospace;font-size:1.1rem;outline:none"
          @focus="($event.target as HTMLInputElement).style.borderColor='#39ff14'"
          @blur="($event.target as HTMLInputElement).style.borderColor=inputError?'#ff3333':'#333'"
          spellcheck="false"
        />
        <div v-if="inputError" class="text-xs mt-1" style="color:#ff6666;font-family:monospace">⚠ {{ inputError }}</div>
      </div>

      <!-- Results -->
      <div v-if="result" class="space-y-4">
        <!-- Key info grid -->
        <div class="grid grid-cols-2 gap-3">
          <InfoCard label="Network Address" :value="result.network" accent="#39ff14" />
          <InfoCard label="Broadcast Address" :value="result.broadcast" accent="#ff6b35" />
          <InfoCard label="First Usable" :value="result.firstHost" accent="#00ffff" />
          <InfoCard label="Last Usable" :value="result.lastHost" accent="#00ffff" />
          <InfoCard label="Subnet Mask" :value="result.maskDec" :sub="result.maskHex" accent="#a855f7" />
          <InfoCard label="Usable Hosts" :value="result.hosts.toLocaleString()" accent="#f59e0b" />
          <InfoCard label="CIDR" :value="`/${result.prefix}`" accent="#39ff14" />
          <InfoCard label="IP Class / Type" :value="result.ipClass" accent="#ec4899" />
        </div>

        <!-- Binary display -->
        <div class="rounded-lg p-4" style="background:#0d0d12;border:1px solid #1a1a2e">
          <div class="text-xs mb-3" style="color:#666;font-family:monospace">BINARY REPRESENTATION</div>
          <div class="space-y-2">
            <BinaryRow label="IP" :octets="result.ipOctets" :prefix="result.prefix" />
            <BinaryRow label="Mask" :octets="result.maskOctets" :prefix="result.prefix" :isMask="true" />
            <BinaryRow label="Net" :octets="result.networkOctets" :prefix="result.prefix" />
          </div>
        </div>

        <!-- CIDR position bar -->
        <div class="rounded-lg p-4" style="background:#0d0d12;border:1px solid #1a1a2e">
          <div class="text-xs mb-2" style="color:#666;font-family:monospace">POSITION IN ADDRESS SPACE (0.0.0.0 → 255.255.255.255)</div>
          <div class="rounded overflow-hidden" style="background:#1a1a1a;height:20px">
            <div
              class="h-full rounded transition-all duration-500"
              :style="`width:${result.spacePercent}%;background:linear-gradient(90deg,#39ff14,#00ffff);min-width:2px`"
            />
          </div>
          <div class="flex justify-between text-xs mt-1 font-mono" style="color:#444">
            <span>0.0.0.0</span>
            <span style="color:#666">{{ result.network }} @ {{ result.spacePercent.toFixed(4) }}%</span>
            <span>255.255.255.255</span>
          </div>
        </div>
      </div>

      <!-- Quick reference table -->
      <div class="mt-10">
        <div class="text-xs mb-3" style="color:#666;font-family:monospace">COMMON SUBNET REFERENCE</div>
        <div class="rounded-lg overflow-hidden" style="border:1px solid #1a1a2e">
          <table class="w-full text-xs font-mono">
            <thead>
              <tr style="background:#0d0d12;color:#555">
                <th class="px-4 py-2 text-left">CIDR</th>
                <th class="px-4 py-2 text-left">Mask</th>
                <th class="px-4 py-2 text-right">Hosts</th>
                <th class="px-4 py-2 text-left">Use</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in quickRef"
                :key="row.cidr"
                class="border-t cursor-pointer transition-colors"
                style="border-color:#1a1a2e"
                @click="input = `192.168.1.0${row.cidr}`"
                @mouseenter="($event.currentTarget as HTMLElement).style.background='#0d1a0d'"
                @mouseleave="($event.currentTarget as HTMLElement).style.background='transparent'"
              >
                <td class="px-4 py-2" style="color:#39ff14">{{ row.cidr }}</td>
                <td class="px-4 py-2" style="color:#888">{{ row.mask }}</td>
                <td class="px-4 py-2 text-right" style="color:#f59e0b">{{ row.hosts.toLocaleString() }}</td>
                <td class="px-4 py-2" style="color:#555">{{ row.use }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="text-xs mt-2" style="color:#333;font-family:monospace">↑ click any row to load example</p>
      </div>
    </div>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineComponent, h } from 'vue'
// @ts-ignore
import ipaddr from 'ipaddr.js'

const { siteName } = useSiteConfig()
useSeoMeta({ title: 'Subnet Calculator — void.lab' })

const input = ref('192.168.1.0/24')

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ipToNum(ip: string): number {
  return ip.split('.').reduce((acc: number, o: string) => (acc << 8) | parseInt(o), 0) >>> 0
}

function numToIp(n: number): string {
  return [(n>>>24)&0xff,(n>>>16)&0xff,(n>>>8)&0xff,n&0xff].join('.')
}

function ipToBinaryOctets(ip: string): string[] {
  return ip.split('.').map((o: string) => parseInt(o).toString(2).padStart(8,'0'))
}

function numToHex(n: number): string {
  return '0x' + n.toString(16).toUpperCase().padStart(8,'0').replace(/(..)(?=..)/g,'$1.')
}

function getIPClass(ip: string, isPrivate: boolean): string {
  const first = parseInt(ip.split('.')[0])
  const cls = first < 128 ? 'A' : first < 192 ? 'B' : first < 224 ? 'C' : first < 240 ? 'D (Multicast)' : 'E (Reserved)'
  return `${cls} / ${isPrivate ? 'Private' : 'Public'}`
}

const inputError = ref('')

const result = computed(() => {
  const raw = input.value.trim()
  if (!raw) { inputError.value = ''; return null }

  try {
    // Parse CIDR with ipaddr.js
    const cidr = raw.includes('/') ? raw : raw + '/32'
    // @ts-ignore
    const [addr, prefix] = ipaddr.parseCIDR(cidr)
    const ipStr = addr.toString()

    // Calculate network info
    const ipNum = ipToNum(ipStr)
    const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0
    const networkNum = (ipNum & mask) >>> 0
    const broadcastNum = (networkNum | (~mask >>> 0)) >>> 0
    const firstHost = prefix < 31 ? networkNum + 1 : networkNum
    const lastHost = prefix < 31 ? broadcastNum - 1 : broadcastNum
    const hosts = prefix >= 31 ? Math.pow(2, 32 - prefix) : Math.max(0, Math.pow(2, 32 - prefix) - 2)
    const maskDec = numToIp(mask)
    const maskHex = numToHex(mask)
    const networkStr = numToIp(networkNum)
    const broadcastStr = numToIp(broadcastNum)
    const spacePercent = (networkNum / 0xffffffff) * 100

    // Determine if private using ipaddr.js range
    // @ts-ignore
    const range = addr.range()
    const isPrivate = ['private', 'loopback', 'linkLocal'].includes(range)

    inputError.value = ''
    return {
      network: networkStr,
      broadcast: broadcastStr,
      firstHost: numToIp(firstHost),
      lastHost: numToIp(lastHost),
      hosts,
      prefix,
      maskDec,
      maskHex,
      ipOctets: ipToBinaryOctets(ipStr),
      maskOctets: ipToBinaryOctets(maskDec),
      networkOctets: ipToBinaryOctets(networkStr),
      ipClass: getIPClass(ipStr, isPrivate),
      spacePercent,
    }
  } catch {
    inputError.value = 'Invalid format. Use IP/CIDR e.g. 192.168.1.0/24'
    return null
  }
})

// ─── Sub-components ──────────────────────────────────────────────────────────

const InfoCard = defineComponent({
  props: ['label', 'value', 'sub', 'accent'],
  setup(props) {
    return () => h('div', {
      style: 'background:#0d0d12;border:1px solid #1a1a2e;border-radius:8px;padding:12px 16px'
    }, [
      h('div', { style: 'font-size:10px;color:#555;font-family:monospace;margin-bottom:4px' }, props.label),
      h('div', { style: `font-size:1rem;font-family:monospace;font-weight:bold;color:${props.accent}` }, props.value),
      props.sub ? h('div', { style: 'font-size:10px;color:#444;font-family:monospace;margin-top:2px' }, props.sub) : null,
    ])
  }
})

const BinaryRow = defineComponent({
  props: ['label', 'octets', 'prefix', 'isMask'],
  setup(props) {
    return () => {
      const children = []
      children.push(h('span', { style: 'color:#555;margin-right:8px;min-width:36px;display:inline-block' }, props.label))

      let bitPos = 0
      for (let i = 0; i < 4; i++) {
        if (i > 0) children.push(h('span', { style: 'color:#333;margin:0 4px' }, '.'))
        const octet = (props.octets as string[])[i]
        for (let b = 0; b < 8; b++) {
          const bit = octet[b]
          const isNetPart = bitPos < props.prefix
          let color = '#555'
          if (props.isMask) {
            color = isNetPart ? '#a855f7' : '#333'
          } else {
            color = isNetPart ? '#00ffff' : '#39ff14'
          }
          children.push(h('span', { style: `color:${color};font-weight:${isNetPart?'bold':'normal'}` }, bit))
          bitPos++
        }
      }

      return h('div', { style: 'font-family:monospace;font-size:12px;letter-spacing:1px' }, children)
    }
  }
})

const quickRef = [
  { cidr: '/8',  mask: '255.0.0.0',     hosts: 16777214, use: 'Class A' },
  { cidr: '/16', mask: '255.255.0.0',   hosts: 65534,    use: 'Class B' },
  { cidr: '/24', mask: '255.255.255.0', hosts: 254,      use: 'Class C / common LAN' },
  { cidr: '/25', mask: '255.255.255.128', hosts: 126,    use: 'Half C' },
  { cidr: '/26', mask: '255.255.255.192', hosts: 62,     use: 'Quarter C' },
  { cidr: '/27', mask: '255.255.255.224', hosts: 30,     use: 'Small office' },
  { cidr: '/28', mask: '255.255.255.240', hosts: 14,     use: 'Small subnet' },
  { cidr: '/29', mask: '255.255.255.248', hosts: 6,      use: 'P2P link' },
  { cidr: '/30', mask: '255.255.255.252', hosts: 2,      use: 'P2P link (min)' },
  { cidr: '/31', mask: '255.255.255.254', hosts: 2,      use: 'P2P (RFC 3021)' },
  { cidr: '/32', mask: '255.255.255.255', hosts: 1,      use: 'Host route' },
]
</script>
