<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'tools', href: '/lab' }, { label: 'netinfo' }]" />
    <div class="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <p class="font-mono text-[10px] text-[var(--color-text-muted)] tracking-[0.25em] uppercase mb-2">~/lab/tools/netinfo</p>

      <h1 class="font-mono text-xl font-bold text-[var(--color-neon-cyan)] mb-6">网络信息</h1>
      <div class="grid grid-cols-1 gap-3">
        <div v-for="item in items" :key="item.label" class="border border-[var(--color-void-border)] rounded-xl p-4 bg-[var(--color-void-card)] flex justify-between items-center">
          <span class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest">{{ item.label }}</span>
          <span class="font-mono text-sm" :style="`color:${item.color}`">{{ item.value }}</span>
        </div>
      </div>
      <div class="border border-[var(--color-void-border)] rounded-xl p-4 bg-[var(--color-void-card)]">
        <div class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-3">浏览器网络状态</div>
        <div class="font-mono text-xs space-y-2">
          <div class="flex justify-between"><span class="text-[var(--color-text-muted)]">在线状态</span><span :style="`color:${online?'#39ff14':'#ff2d78'}`">{{ online?'在线 ●':'离线 ○' }}</span></div>
          <div class="flex justify-between"><span class="text-[var(--color-text-muted)]">连接类型</span><span class="text-[var(--color-neon-cyan)]">{{ connType }}</span></div>
        </div>
      </div>
    </div>
    <AppFooter />
  </div>
</template>
<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `网络信息 | ${siteName}` })
const items=ref([
  {label:'User Agent',value:'loading...',color:'#e8e8f0'},
  {label:'Language',value:'',color:'#00d4ff'},
  {label:'Platform',value:'',color:'#b400ff'},
  {label:'Cookies',value:'',color:'#39ff14'},
  {label:'Screen',value:'',color:'#ff00aa'},
  {label:'Timezone',value:'',color:'#ffa500'},
])
const online=ref(true),connType=ref('未知')
const onOnline = () => { online.value = true }
const onOffline = () => { online.value = false }
onMounted(()=>{
  items.value[0].value=navigator.userAgent.slice(0,80)+'...'
  items.value[1].value=navigator.language
  items.value[2].value=navigator.platform||'未知'
  items.value[3].value=navigator.cookieEnabled?'已启用':'已禁用'
  items.value[4].value=`${screen.width}x${screen.height} @${window.devicePixelRatio}x`
  items.value[5].value=Intl.DateTimeFormat().resolvedOptions().timeZone
  online.value=navigator.onLine
  const conn=(navigator as any).connection
  if(conn) connType.value=conn.effectiveType||conn.type||'未知'
  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)
})
onUnmounted(() => {
  window.removeEventListener('online', onOnline)
  window.removeEventListener('offline', onOffline)
})
</script>
