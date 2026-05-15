<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'tools', href: '/lab' }, { label: 'http-status' }]" />
    <div class="max-w-4xl mx-auto px-6 py-10">
      <p class="font-mono text-[10px] text-[var(--color-text-muted)] tracking-[0.25em] uppercase mb-2">~/lab/tools/http-status</p>

      <h1 class="font-mono text-xl font-bold text-[var(--color-neon-cyan)] mb-1">🌐 HTTP 状态码</h1>
      <p class="font-mono text-xs text-[var(--color-text-muted)] mb-6">完整 HTTP 状态码查询，含非标准扩展</p>

      <!-- Search + Random -->
      <div class="flex gap-3 mb-5">
        <input
          v-model="search"
          placeholder="搜索状态码或关键词..."
          class="font-mono text-xs px-3 py-2 rounded-lg border bg-[var(--color-void-card)] text-[var(--color-text-primary)] outline-none flex-1"
          style="border-color:rgba(0,212,255,0.3)"
        />
        <button @click="randomStatus" class="font-mono text-xs px-4 py-2 rounded-lg border transition-all hover:translate-y-[-1px]" style="border-color:rgba(57,255,20,0.4);color:#39ff14;background:rgba(57,255,20,0.06)">
          🎲 随机
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 mb-5 flex-wrap">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="['font-mono text-xs px-3 py-1.5 rounded-lg border transition-all', activeTab === tab.id ? 'opacity-100' : 'opacity-50 hover:opacity-75']"
          :style="activeTab === tab.id ? `border-color:${tab.color}44;color:${tab.color};background:${tab.color}15` : 'border-color:rgba(255,255,255,0.1);color:var(--color-text-muted)'"
        >{{ tab.label }}</button>
      </div>

      <!-- Random spotlight -->
      <transition name="fade">
        <div v-if="spotlight" class="mb-5 rounded-xl border p-5" :style="`border-color:${statusColor(spotlight.code)}44;background:${statusColor(spotlight.code)}08`">
          <div class="flex items-center gap-3 mb-2">
            <span class="font-mono text-4xl font-bold" :style="`color:${statusColor(spotlight.code)}`">{{ spotlight.code }}</span>
            <div>
              <div class="font-mono text-sm font-bold text-[var(--color-text-primary)]">{{ spotlight.name }}</div>
              <div v-if="spotlight.code === 418" class="font-mono text-xs text-[rgba(255,150,50,0.8)]">🫖 I'm a teapot — 这不是玩笑，这是 RFC 2324</div>
            </div>
            <button @click="spotlight = null" class="ml-auto font-mono text-xs text-[rgba(255,100,100,0.6)] hover:text-[rgba(255,100,100,1)]">✕</button>
          </div>
          <p class="font-mono text-xs text-[var(--color-text-muted)] mb-2">{{ spotlight.desc }}</p>
          <p class="font-mono text-xs text-[var(--color-text-muted)] italic">{{ spotlight.usage }}</p>
          <div v-if="spotlight.code === 418" class="mt-3 font-mono text-[var(--color-neon-cyan)] text-xs whitespace-pre leading-tight">{{ teapot }}</div>
        </div>
      </transition>

      <!-- Status list -->
      <div class="space-y-2">
        <div
          v-for="s in filteredStatuses"
          :key="s.code"
          @click="toggleExpand(s.code)"
          class="rounded-xl border cursor-pointer transition-all hover:translate-y-[-1px]"
          :style="`border-color:${statusColor(s.code)}30;background:${statusColor(s.code)}06`"
        >
          <div class="px-4 py-3 flex items-center gap-3">
            <span class="font-mono text-lg font-bold w-12 shrink-0" :style="`color:${statusColor(s.code)}`">{{ s.code }}</span>
            <span class="font-mono text-sm text-[var(--color-text-primary)] flex-1">{{ s.name }}</span>
            <button @click.stop="copyText(String(s.code))" class="font-mono text-[10px] px-2 py-1 rounded border transition-colors" :style="`border-color:${statusColor(s.code)}40;color:${statusColor(s.code)}`">复制</button>
            <span class="font-mono text-xs text-[var(--color-text-muted)]">{{ expanded === s.code ? '▲' : '▼' }}</span>
          </div>
          <transition name="expand">
            <div v-if="expanded === s.code" class="px-4 pb-4 border-t" :style="`border-color:${statusColor(s.code)}20`">
              <p class="font-mono text-xs text-[var(--color-text-muted)] mt-3 mb-2">{{ s.desc }}</p>
              <p class="font-mono text-xs italic text-[rgba(255,255,255,0.35)]">{{ s.usage }}</p>
            </div>
          </transition>
        </div>
        <div v-if="filteredStatuses.length === 0" class="font-mono text-xs text-[var(--color-text-muted)] text-center py-10">无匹配结果</div>
      </div>
    </div>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
const { copy: copyToClipboard } = useClipboard()
const { siteName } = useSiteConfig()
useSeoMeta({ title: `HTTP 状态码 | ${siteName}` })

const search = ref('')
const activeTab = ref('all')
const expanded = ref<number | null>(null)
const spotlight = ref<any>(null)

const teapot = `
    ( (
     ) )
  ........
  |      |]
  \\      /
   \`----'
`

const tabs = [
  { id: 'all', label: '全部', color: '#00d4ff' },
  { id: '1', label: '1xx 信息', color: '#888' },
  { id: '2', label: '2xx 成功', color: '#39ff14' },
  { id: '3', label: '3xx 重定向', color: '#00d4ff' },
  { id: '4', label: '4xx 客户端错误', color: '#ff9500' },
  { id: '5', label: '5xx 服务端错误', color: '#ff3b30' },
]

const statuses = [
  { code: 100, name: 'Continue', desc: '服务器已收到请求头，客户端应继续发送请求体。', usage: '用于大文件上传前的预检。' },
  { code: 101, name: 'Switching Protocols', desc: '服务器同意客户端切换协议，如从 HTTP 升级到 WebSocket。', usage: '建立 WebSocket 连接时。' },
  { code: 102, name: 'Processing', desc: '服务器已收到并正在处理请求，但尚无响应可用。', usage: 'WebDAV 长时操作。' },
  { code: 103, name: 'Early Hints', desc: '在最终响应前返回预加载头部，提升性能。', usage: '配合 Link 头提前推送资源。' },
  { code: 200, name: 'OK', desc: '请求成功。响应体包含请求的资源或操作结果。', usage: '绝大多数成功的 GET/POST 响应。' },
  { code: 201, name: 'Created', desc: '请求已成功，且创建了新资源。响应头 Location 指向新资源地址。', usage: 'POST 创建资源后返回。' },
  { code: 202, name: 'Accepted', desc: '请求已接受，但处理尚未完成（异步操作）。', usage: '异步任务队列、批量处理。' },
  { code: 204, name: 'No Content', desc: '请求成功，但没有响应体。', usage: 'DELETE 操作、CORS 预检成功时。' },
  { code: 206, name: 'Partial Content', desc: '服务器成功处理了部分 GET 请求（Range 请求）。', usage: '断点续传、视频流媒体。' },
  { code: 301, name: 'Moved Permanently', desc: '资源已永久移动到新位置，客户端应更新书签。', usage: '旧 URL 永久重定向，SEO 友好。' },
  { code: 302, name: 'Found', desc: '资源临时移动，客户端应继续使用原 URL。', usage: '登录后跳转、临时重定向。' },
  { code: 304, name: 'Not Modified', desc: '资源未修改，客户端可使用缓存版本。', usage: '配合 ETag/If-None-Match 使用。' },
  { code: 307, name: 'Temporary Redirect', desc: '临时重定向，且保证请求方法不变（不像 302 可能变 GET）。', usage: 'POST 请求的临时重定向。' },
  { code: 308, name: 'Permanent Redirect', desc: '永久重定向，且保证请求方法不变。', usage: 'POST 请求的永久迁移。' },
  { code: 400, name: 'Bad Request', desc: '服务器无法理解该请求（语法错误、参数无效等）。', usage: '表单验证失败、JSON 格式错误。' },
  { code: 401, name: 'Unauthorized', desc: '请求需要身份验证，或认证失败。', usage: '未登录或 Token 过期。' },
  { code: 403, name: 'Forbidden', desc: '服务器拒绝该请求，即使已认证。权限不足。', usage: '无权访问某资源。' },
  { code: 404, name: 'Not Found', desc: '服务器找不到请求的资源。', usage: '页面不存在、接口路径错误。' },
  { code: 405, name: 'Method Not Allowed', desc: '请求方法不被目标资源支持。', usage: '对只读接口发送 POST。' },
  { code: 408, name: 'Request Timeout', desc: '服务器等待请求超时。', usage: '网络慢导致请求未完成。' },
  { code: 409, name: 'Conflict', desc: '请求与当前服务器资源状态冲突。', usage: '用户名重复注册、并发写入冲突。' },
  { code: 410, name: 'Gone', desc: '资源已永久删除，且不会恢复。', usage: '明确提示旧 API 端点已废弃。' },
  { code: 413, name: 'Content Too Large', desc: '请求体超过服务器允许的大小。', usage: '上传文件过大。' },
  { code: 418, name: "I'm a Teapot", desc: '我是茶壶，不能煮咖啡。这是 1998 年愚人节 RFC 2324 中的玩笑，但已被真实实现。', usage: '彩蛋、防爬虫、测试环境标识。' },
  { code: 420, name: 'Enhance Your Calm', desc: 'Twitter 非标准状态码：请求被限速，冷静一下。', usage: 'Twitter API 限流（非官方）。' },
  { code: 422, name: 'Unprocessable Entity', desc: '请求格式正确，但语义错误（如验证失败）。', usage: 'REST API 字段校验失败。' },
  { code: 429, name: 'Too Many Requests', desc: '客户端在给定时间内发送了过多请求（限流）。', usage: 'API Rate Limiting。' },
  { code: 451, name: 'Unavailable For Legal Reasons', desc: '因法律原因无法提供该资源（如版权、政府审查）。灵感来自《华氏451度》。', usage: '内容因法律被屏蔽。' },
  { code: 500, name: 'Internal Server Error', desc: '服务器遇到意外情况，无法完成请求。', usage: '未捕获异常、代码 bug。' },
  { code: 501, name: 'Not Implemented', desc: '服务器不支持完成请求所需的功能。', usage: '服务器不支持某个 HTTP 方法。' },
  { code: 502, name: 'Bad Gateway', desc: '网关或代理服务器收到了无效的上游响应。', usage: '上游服务崩溃或返回非法响应。' },
  { code: 503, name: 'Service Unavailable', desc: '服务器暂时无法处理请求（维护中或过载）。', usage: '部署期间、熔断降级。' },
  { code: 504, name: 'Gateway Timeout', desc: '网关或代理服务器等待上游响应超时。', usage: '上游慢接口、数据库超时。' },
  { code: 507, name: 'Insufficient Storage', desc: '服务器没有足够空间完成请求。', usage: 'WebDAV 磁盘满。' },
]

function statusColor(code: number) {
  if (code < 200) return '#888888'
  if (code < 300) return '#39ff14'
  if (code < 400) return '#00d4ff'
  if (code < 500) return '#ff9500'
  return '#ff3b30'
}

const filteredStatuses = computed(() => {
  let list = statuses
  if (activeTab.value !== 'all') {
    list = list.filter(s => String(s.code).startsWith(activeTab.value))
  }
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(s => String(s.code).includes(q) || s.name.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q))
  }
  return list
})

function toggleExpand(code: number) {
  expanded.value = expanded.value === code ? null : code
}

function randomStatus() {
  const s = statuses[Math.floor(Math.random() * statuses.length)]
  spotlight.value = s
}

async function copyText(text: string) {
  await copyToClipboard(text)
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.expand-enter-active, .expand-leave-active { transition: opacity 0.15s; }
.expand-enter-from, .expand-leave-to { opacity: 0; }
</style>
