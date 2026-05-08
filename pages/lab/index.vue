<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'lab' }]" />

    <div class="max-w-5xl mx-auto px-6 py-14">
      <div class="mb-12">
        <p class="font-mono text-[10px] text-[var(--color-text-muted)] tracking-[0.25em] uppercase mb-3">interactive_lab</p>
        <h1 class="font-mono text-4xl font-bold text-[var(--color-text-primary)] mb-2" style="text-shadow:0 0 30px rgba(180,0,255,0.2)">
          <span style="color:rgba(180,0,255,0.9)">~/</span>lab
        </h1>
        <p class="font-mono text-sm text-[var(--color-text-muted)]">技术宅的实验室 — 游戏、工具、可视化</p>
        <div class="flex gap-6 mt-4 font-mono text-xs text-[var(--color-text-muted)]">
          <span><span style="color:rgba(180,0,255,0.9)">16</span> 游戏</span>
          <span><span style="color:rgba(0,212,255,0.9)">19</span> 工具</span>
          <span><span style="color:rgba(57,255,20,0.9)">∞</span> 折腾</span>
        </div>
      </div>

      <!-- GAMES -->
      <section class="mb-12">
        <h2 class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-5 flex items-center gap-3">
          <span style="color:rgba(180,0,255,0.8)">▶</span> 游戏
          <span class="flex-1 h-px bg-gradient-to-r from-[rgba(180,0,255,0.3)] to-transparent"></span>
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            v-for="game in games"
            :key="game.href"
            :href="game.href"
            class="group block border border-[var(--color-void-border)] rounded-xl p-5 bg-[var(--color-void-card)] transition-all hover:translate-y-[-2px]"
            @mouseover="e => { (e.currentTarget as HTMLElement).style.borderColor = game.color + '55'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px ' + game.color + '18' }"
            @mouseout="e => { (e.currentTarget as HTMLElement).style.borderColor = ''; (e.currentTarget as HTMLElement).style.boxShadow = '' }"
          >
            <div class="flex items-start justify-between mb-3">
              <span class="text-2xl">{{ game.icon }}</span>
              <span class="font-mono text-[9px] px-2 py-0.5 rounded-full border" :style="`border-color:${game.color}44;color:${game.color}cc`">{{ game.tag }}</span>
            </div>
            <h3 class="font-mono text-sm font-bold text-[var(--color-text-primary)] mb-1 group-hover:transition-colors" style="transition:color 0.2s">{{ game.label }}</h3>
            <p class="font-mono text-[11px] text-[var(--color-text-muted)]">{{ game.desc }}</p>
          </a>
        </div>
      </section>

      <!-- TOOLS -->
      <section>
        <h2 class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-5 flex items-center gap-3">
          <span class="text-[var(--color-neon-cyan)]">▶</span> 在线工具
          <span class="flex-1 h-px bg-gradient-to-r from-[rgba(0,212,255,0.3)] to-transparent"></span>
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <a
            v-for="tool in tools"
            :key="tool.href"
            :href="tool.href"
            class="group block border border-[var(--color-void-border)] rounded-xl p-5 bg-[var(--color-void-card)] transition-all hover:translate-y-[-2px]"
            @mouseover="e => { (e.currentTarget as HTMLElement).style.borderColor = tool.color + '55'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px ' + tool.color + '18' }"
            @mouseout="e => { (e.currentTarget as HTMLElement).style.borderColor = ''; (e.currentTarget as HTMLElement).style.boxShadow = '' }"
          >
            <div class="flex items-start justify-between mb-3">
              <span class="text-xl font-mono font-bold" :style="`color:${tool.color}`">{{ tool.icon }}</span>
              <span class="font-mono text-[9px] px-2 py-0.5 rounded-full border" :style="`border-color:${tool.color}44;color:${tool.color}cc`">{{ tool.tag }}</span>
            </div>
            <h3 class="font-mono text-sm font-bold text-[var(--color-text-primary)] mb-1">{{ tool.label }}</h3>
            <p class="font-mono text-[11px] text-[var(--color-text-muted)]">{{ tool.desc }}</p>
          </a>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `Lab | ${siteName}` })

const games = [
  { href: '/lab/snake', icon: '🐍', label: 'Snake', desc: '霓虹贪吃蛇', tag: 'CLASSIC', color: '#39ff14' },
  { href: '/lab/matrix', icon: '🌧️', label: 'Matrix Rain', desc: '数字雨可视化', tag: 'VISUAL', color: '#00d4ff' },
  { href: '/lab/typing', icon: '⌨️', label: 'Code Typing', desc: '代码打字测速', tag: 'SKILL', color: '#ff00aa' },
  { href: '/lab/sort', icon: '📊', label: 'Sort Visualizer', desc: '9 种排序动画', tag: 'ALGO', color: '#b400ff' },
  { href: '/lab/2048', icon: '🔢', label: '2048', desc: '数字合并游戏，霓虹重制版', tag: 'CLASSIC', color: '#ffa500' },
  { href: '/lab/minesweeper', icon: '💣', label: 'Minesweeper', desc: '扫雷，终端 ASCII 风格', tag: 'CLASSIC', color: '#ff00aa' },
  { href: '/lab/tetris', icon: '🧩', label: 'Tetris', desc: '经典俄罗斯方块，霓虹重制', tag: 'CLASSIC', color: '#b400ff' },
  { href: '/lab/wordle', icon: '📝', label: 'Wordle', desc: '5字母猜词游戏，代码词库版', tag: 'WORD', color: '#39ff14' },
  { href: '/lab/flappy', icon: '🐦', label: 'Flappy Bird', desc: '赛博朋克风霓虹管道', tag: 'CASUAL', color: '#ffa500' },
  { href: '/lab/life', icon: '🔬', label: "Conway's Life", desc: '细胞自动机，点击绘制 · 预设图案', tag: 'SIM', color: '#00ff88' },
  { href: '/lab/breakout', icon: '🧱', label: 'Breakout', desc: '霓虹打砖块，鼠标/键盘控制', tag: 'CLASSIC', color: '#00d4ff' },
  { href: '/lab/pathfinding', icon: '🗺️', label: 'Pathfinding', desc: 'A*/BFS/DFS/Dijkstra/Greedy 路径寻找可视化', tag: 'ALGO', color: '#00d4ff' },
  { href: '/lab/doom-fire', icon: '🔥', label: 'Doom Fire', desc: '经典 DOOM 火焰算法，实时渲染', tag: 'VISUAL', color: '#ff4500' },
  { href: '/lab/binary-tree', icon: '🌲', label: 'Binary Tree', desc: 'BST 插入/查找/删除 + 三种遍历动画', tag: 'ALGO', color: '#00ff88' },
  { href: '/lab/cpu-sim', icon: '💾', label: 'CPU Sim', desc: '8-bit CPU 模拟器，支持 MOV/ADD/JMP 等指令', tag: 'SIM', color: '#b400ff' },
  { href: '/lab/lissajous', icon: '〰️', label: 'Lissajous', desc: '利萨如图形生成器，实时参数控制', tag: 'VISUAL', color: '#ff00aa' },
]

const tools = [
  { href: '/lab/tools/json', icon: '{ }', label: 'JSON 格式化', desc: '格式化 / 压缩 / 校验 JSON', tag: 'FORMAT', color: '#00d4ff' },
  { href: '/lab/tools/regex', icon: '.*', label: '正则测试器', desc: '实时匹配 + 高亮 + 分组提取', tag: 'REGEX', color: '#39ff14' },
  { href: '/lab/tools/base64', icon: '64', label: 'Base64', desc: '编码 / 解码 / 文件转换', tag: 'ENCODE', color: '#ff00aa' },
  { href: '/lab/tools/timestamp', icon: '⏱', label: '时间戳转换', desc: 'Unix 时间戳 ↔ 日期时间', tag: 'TIME', color: '#ffa500' },
  { href: '/lab/tools/color', icon: '🎨', label: '颜色工具', desc: 'HEX / RGB / HSL 互转 + 调色板', tag: 'COLOR', color: '#b400ff' },
  { href: '/lab/tools/hash', icon: '#', label: '哈希计算', desc: 'MD5 / SHA1 / SHA256 在线计算', tag: 'CRYPTO', color: '#00d4ff' },
  { href: '/lab/tools/url', icon: '🔗', label: 'URL 工具', desc: 'URL 解析/编解码/构建', tag: 'NET', color: '#00d4ff' },
  { href: '/lab/tools/diff', icon: '±', label: 'Diff 工具', desc: '文本/代码对比高亮差异', tag: 'DIFF', color: '#39ff14' },
  { href: '/lab/tools/ascii', icon: 'A', label: 'ASCII Art', desc: '文字转 ASCII 艺术字', tag: 'ART', color: '#ff00aa' },
  { href: '/lab/tools/baseconv', icon: '0x', label: '进制转换', desc: '二/八/十/十六进制互转', tag: 'MATH', color: '#ffa500' },
  { href: '/lab/tools/cron', icon: '⏰', label: 'Cron 解析', desc: 'Cron 表达式可视化解析', tag: 'UTIL', color: '#b400ff' },
  { href: '/lab/tools/brainfuck', icon: '🧠', label: 'Brainfuck', desc: 'Brainfuck 解释器', tag: 'ESOTERIC', color: '#00ff88' },
  { href: '/lab/tools/netinfo', icon: '🌐', label: '网络信息', desc: '查看 IP / User-Agent 等网络信息', tag: 'NET', color: '#00d4ff' },
  { href: '/lab/tools/jwt', icon: '🔑', label: 'JWT 解析', desc: '解析 JWT 的 Header / Payload', tag: 'CRYPTO', color: '#f47067' },
  { href: '/lab/tools/uuid', icon: '🆔', label: 'UUID 生成', desc: '批量生成 v4 UUID，一键复制', tag: 'UTIL', color: '#00ff88' },
  { href: '/lab/tools/markdown', icon: 'MD', label: 'Markdown 预览', desc: '实时 Markdown 渲染预览', tag: 'FORMAT', color: '#b400ff' },
  { href: '/lab/tools/qrcode', icon: '▦', label: 'QR 码生成器', desc: '纯前端手写 QR 算法，支持 ECC 四级', tag: 'ENCODE', color: '#00ff88' },
  { href: '/lab/tools/pomodoro', icon: '🍅', label: '番茄钟', desc: '极客风 25/5/15 番茄工作法', tag: 'UTIL', color: '#ff4500' },
  { href: '/lab/tools/subnet', icon: '🌐', label: 'IP 子网计算', desc: 'CIDR 子网掩码 / 地址范围 / 二进制展示', tag: 'NET', color: '#b400ff' },
]
</script>
