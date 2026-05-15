<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'lab' }]" />

    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-14">
      <div class="mb-12">
        <p class="font-mono text-[10px] text-[var(--color-text-muted)] tracking-[0.25em] uppercase mb-3">interactive_lab</p>
        <h1 class="font-mono text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] mb-2" style="text-shadow:0 0 30px rgba(180,0,255,0.2)">
          <span style="color:rgba(180,0,255,0.9)">~/</span>lab
        </h1>
        <p class="font-mono text-sm text-[var(--color-text-muted)]">技术宅的实验室 — 游戏、工具、可视化</p>
        <div class="flex flex-wrap gap-x-6 gap-y-2 mt-4 font-mono text-xs text-[var(--color-text-muted)]">
          <span><span style="color:rgba(180,0,255,0.9)">{{ games.length }}</span> 游戏</span>
          <span><span style="color:rgba(0,212,255,0.9)">{{ tools.length }}</span> 工具</span>
          <span><span style="color:rgba(57,255,20,0.9)">∞</span> 折腾</span>
        </div>

        <!-- 搜索过滤 -->
        <div class="mt-6 relative w-full max-w-sm">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] font-mono text-xs pointer-events-none">~/</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="search games & tools..."
            class="w-full font-mono text-xs bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg pl-7 pr-4 py-2 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[rgba(180,0,255,0.5)] focus:outline-none transition-colors"
          />
        </div>
      </div>

      <!-- GAMES -->
      <section class="mb-12" v-if="filteredGames.length || !searchQuery">
        <h2 class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-5 flex items-center gap-3">
          <span style="color:rgba(180,0,255,0.8)">▶</span> 游戏
          <span class="flex-1 h-px bg-gradient-to-r from-[rgba(180,0,255,0.3)] to-transparent"></span>
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            v-for="game in filteredGames"
            :key="game.href"
            :href="game.href"
            class="group block border border-[var(--color-void-border)] rounded-xl p-4 sm:p-5 bg-[var(--color-void-card)] transition-all hover:translate-y-[-2px]"
            @mouseover="e => { (e.currentTarget as HTMLElement).style.borderColor = game.color + '55'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px ' + game.color + '25' }"
            @mouseout="e => { (e.currentTarget as HTMLElement).style.borderColor = ''; (e.currentTarget as HTMLElement).style.boxShadow = '' }"
          >
            <div class="flex items-start justify-between gap-3 mb-3">
              <span class="text-2xl transition-transform duration-200 group-hover:scale-110">{{ game.icon }}</span>
              <span class="font-mono text-[9px] px-2 py-0.5 rounded-full border tracking-wider" :style="`border-color:${game.color}44;color:${game.color}cc;background:${game.color}0d`">{{ game.tag }}</span>
            </div>
            <h3 class="font-mono text-sm font-bold text-[var(--color-text-primary)] mb-1 group-hover:transition-colors" style="transition:color 0.2s">{{ game.label }}</h3>
            <p class="font-mono text-[11px] text-[var(--color-text-muted)]">{{ game.desc }}</p>
          </a>
        </div>
      </section>

      <!-- TOOLS -->
      <section v-if="filteredTools.length || !searchQuery">
        <h2 class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-5 flex items-center gap-3">
          <span class="text-[var(--color-neon-cyan)]">▶</span> 在线工具
          <span class="flex-1 h-px bg-gradient-to-r from-[rgba(0,212,255,0.3)] to-transparent"></span>
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <a
            v-for="tool in filteredTools"
            :key="tool.href"
            :href="tool.href"
            class="group block border border-[var(--color-void-border)] rounded-xl p-4 sm:p-5 bg-[var(--color-void-card)] transition-all hover:translate-y-[-2px] border-l-2"
            :style="`border-left-color:${tool.color}44`"
            @mouseover="e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = tool.color + '55'; el.style.borderLeftColor = tool.color + 'cc'; el.style.boxShadow = '0 8px 32px ' + tool.color + '25' }"
            @mouseout="e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = ''; el.style.borderLeftColor = tool.color + '44'; el.style.boxShadow = '' }"
          >
            <div class="flex items-start justify-between gap-3 mb-3">
              <span class="text-xl font-mono font-bold transition-transform duration-200 group-hover:scale-110 inline-block" :style="`color:${tool.color}`">{{ tool.icon }}</span>
              <span class="font-mono text-[9px] px-2 py-0.5 rounded-full border tracking-wider" :style="`border-color:${tool.color}44;color:${tool.color}cc;background:${tool.color}0d`">{{ tool.tag }}</span>
            </div>
            <h3 class="font-mono text-sm font-bold text-[var(--color-text-primary)] mb-1">{{ tool.label }}</h3>
            <p class="font-mono text-[11px] text-[var(--color-text-muted)]">{{ tool.desc }}</p>
          </a>
        </div>

        <!-- 无结果提示 -->
        <div v-if="searchQuery && !filteredGames.length && !filteredTools.length" class="text-center py-16 font-mono text-[var(--color-text-muted)]">
          <p class="text-sm mb-1">bash: {{ searchQuery }}: command not found</p>
          <p class="text-xs opacity-50">try a different search term</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `Lab | ${siteName}` })

const searchQuery = ref('')

const filteredGames = computed(() => {
  if (!searchQuery.value) return games
  const q = searchQuery.value.toLowerCase()
  return games.filter(g =>
    g.label.toLowerCase().includes(q) ||
    g.desc.toLowerCase().includes(q) ||
    g.tag.toLowerCase().includes(q)
  )
})

const filteredTools = computed(() => {
  if (!searchQuery.value) return tools
  const q = searchQuery.value.toLowerCase()
  return tools.filter(t =>
    t.label.toLowerCase().includes(q) ||
    t.desc.toLowerCase().includes(q) ||
    t.tag.toLowerCase().includes(q)
  )
})

const games = [
  { href: '/lab/games/snake', icon: '🐍', label: 'Snake', desc: '霓虹贪吃蛇', tag: 'CLASSIC', color: '#39ff14' },
  { href: '/lab/games/matrix', icon: '🌧️', label: 'Matrix Rain', desc: '数字雨可视化', tag: 'VISUAL', color: '#00d4ff' },
  { href: '/lab/games/typing', icon: '⌨️', label: 'Code Typing', desc: '代码打字测速', tag: 'SKILL', color: '#ff00aa' },
  { href: '/lab/games/sort', icon: '📊', label: 'Sort Visualizer', desc: '9 种排序动画', tag: 'ALGO', color: '#b400ff' },
  { href: '/lab/games/2048', icon: '🔢', label: '2048', desc: '数字合并游戏，霓虹重制版', tag: 'CLASSIC', color: '#ffa500' },
  { href: '/lab/games/minesweeper', icon: '💣', label: 'Minesweeper', desc: '扫雷，终端 ASCII 风格', tag: 'CLASSIC', color: '#ff00aa' },
  { href: '/lab/games/tetris', icon: '🧩', label: 'Tetris', desc: '经典俄罗斯方块，霓虹重制', tag: 'CLASSIC', color: '#b400ff' },
  { href: '/lab/games/wordle', icon: '📝', label: 'Wordle', desc: '5字母猜词游戏，代码词库版', tag: 'WORD', color: '#39ff14' },
  { href: '/lab/games/flappy', icon: '🐦', label: 'Flappy Bird', desc: '赛博朋克风霓虹管道', tag: 'CASUAL', color: '#ffa500' },
  { href: '/lab/games/life', icon: '🔬', label: "Conway's Life", desc: '细胞自动机，点击绘制 · 预设图案', tag: 'SIM', color: '#00ff88' },
  { href: '/lab/games/breakout', icon: '🧱', label: 'Breakout', desc: '霓虹打砖块，鼠标/键盘控制', tag: 'CLASSIC', color: '#00d4ff' },
  { href: '/lab/games/pathfinding', icon: '🗺️', label: 'Pathfinding', desc: 'A*/BFS/DFS/Dijkstra/Greedy 路径寻找可视化', tag: 'ALGO', color: '#00d4ff' },
  { href: '/lab/games/audio-visualizer', icon: '🎵', label: 'Audio Visualizer', desc: '麦克风/音调实时频谱可视化', tag: 'VISUAL', color: '#ff2d78' },
  { href: '/lab/games/doom-fire', icon: '🔥', label: 'Doom Fire', desc: '经典 DOOM 火焰算法，实时渲染', tag: 'VISUAL', color: '#ff4500' },
  { href: '/lab/games/graph-theory', icon: '🕸️', label: 'Graph Theory', desc: '图论算法可视化 BFS/DFS/Dijkstra', tag: 'ALGO', color: '#00d4ff' },
  { href: '/lab/games/hex-editor', icon: '💾', label: 'Hex Editor', desc: '16进制编辑器，字节/ASCII 联动高亮', tag: 'SYS', color: '#00ff88' },
  { href: '/lab/games/regex-golf', icon: '⛳', label: 'Regex Golf', desc: '10关卡正则高尔夫，越短越好', tag: 'CHALLENGE', color: '#ff00aa' },
  { href: '/lab/games/binary-tree', icon: '🌲', label: 'Binary Tree', desc: 'BST 插入/查找/删除 + 三种遍历动画', tag: 'ALGO', color: '#00ff88' },
  { href: '/lab/games/cpu-sim', icon: '💾', label: 'CPU Sim', desc: '8-bit CPU 模拟器，支持 MOV/ADD/JMP 等指令', tag: 'SIM', color: '#b400ff' },
  { href: '/lab/games/lissajous', icon: '〰️', label: 'Lissajous', desc: '利萨如图形生成器，实时参数控制', tag: 'VISUAL', color: '#ff00aa' },
  { href: '/lab/games/silk', icon: '🪡', label: 'Silk', desc: '丝绸画布——划出发光对称图案', tag: 'VISUAL', color: '#ff69b4' },
  { href: '/lab/games/brainfuck', icon: '🧬', label: 'Brainfuck', desc: 'Brainfuck 解释器，内存带可视化，单步调试', tag: 'ESOTERIC', color: '#00ff88' },
  { href: '/lab/games/base64-visual', icon: '🔡', label: 'Base64 可视化', desc: '字节级 UTF-8 → Base64 编解码对应关系', tag: 'ENCODE', color: '#ffa500' },
  { href: '/lab/games/hash-collision', icon: '💥', label: '哈希碰撞', desc: '生日悖论模拟 + 哈希桶碰撞可视化', tag: 'CRYPTO', color: '#ff00aa' },
  { href: '/lab/games/cpu-scheduler', icon: '⚙️', label: 'CPU 调度器', desc: 'FCFS/SJF/RR/优先级调度甘特图动画', tag: 'SYS', color: '#b400ff' },
  { href: '/lab/games/tcp-handshake', icon: '🤝', label: 'TCP 握手', desc: '三次握手/四次挥手/滑动窗口可视化', tag: 'NET', color: '#00d4ff' },
  { href: '/lab/games/dns-trace', icon: '🔍', label: 'DNS 追踪', desc: '递归解析路径动画，根服务器到权威服务器', tag: 'NET', color: '#39ff14' },
  { href: '/lab/games/http-compare', icon: '📡', label: 'HTTP 对比', desc: 'HTTP/1.1 vs HTTP/2 vs HTTP/3 瀑布图对比', tag: 'NET', color: '#ff4500' },
  { href: '/lab/games/shell-sim', icon: '💻', label: 'Shell 模拟器', desc: '浏览器里的 Linux Shell，含彩蛋', tag: 'SYS', color: '#39ff14' },
  { href: '/lab/games/git-objects', icon: '🌿', label: 'Git 对象模型', desc: 'blob/tree/commit/ref 关系图可视化', tag: 'SYS', color: '#ff6b35' },
  { href: '/lab/games/regex-nfa', icon: '🕸️', label: '正则 NFA', desc: 'Thompson 构造 NFA + 逐字符匹配动画', tag: 'ALGO', color: '#b400ff' },
  { href: '/lab/games/neural-net', icon: '🧠', label: '神经网络', desc: '前向传播可视化，权重/激活值动画', tag: 'AI', color: '#00d4ff' },
  { href: '/lab/games/btree', icon: '🌳', label: 'B+ 树', desc: '插入/删除分裂合并动画，叶节点链表', tag: 'ALGO', color: '#00ff88' },
  { href: '/lab/games/mem-allocator', icon: '🗃️', label: '内存分配器', desc: 'First/Best/Worst Fit + 碎片可视化', tag: 'SYS', color: '#ffa500' },
  { href: '/lab/games/x86-playground', icon: '⚡', label: 'x86 Playground', desc: 'x86 汇编执行器，寄存器/栈/内存实时展示', tag: 'SYS', color: '#ff00aa' },
  { href: '/lab/games/chip8', icon: '🕹️', label: 'CHIP-8', desc: 'CHIP-8 模拟器，内置 IBM Logo / Pong ROM', tag: 'EMU', color: '#39ff14' },
  { href: '/lab/games/ai-flow', icon: '🤖', label: 'AI Flow', desc: '拖拽搭建 AI 流水线，5 关从分类器到 RAG', tag: 'AI', color: '#00d4ff' },
]

const tools = [
  { href: '/lab/tools/json', icon: '{ }', label: 'JSON 格式化', desc: '格式化 / 压缩 / 校验 JSON', tag: 'FORMAT', color: '#00d4ff' },
  { href: '/lab/tools/regex', icon: '.*', label: '正则测试器', desc: '实时匹配 + 高亮 + 分组提取', tag: 'REGEX', color: '#39ff14' },
  { href: '/lab/tools/base64', icon: '64', label: 'Base64', desc: '编码 / 解码 / 文件转换', tag: 'ENCODE', color: '#ff00aa' },
  { href: '/lab/tools/timestamp', icon: '⏱', label: '时间戳转换', desc: 'Unix 时间戳 ↔ 日期时间', tag: 'TIME', color: '#ffa500' },
  { href: '/lab/tools/color-palette', icon: '🎨', label: '颜色工具', desc: 'HEX/RGB/HSL 互转 · 调色板 · WCAG 对比度', tag: 'COLOR', color: '#b400ff' },
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
  { href: '/lab/tools/text-tools', icon: '📝', label: '文本工具集', desc: '字数/大小写/去重/排序/转义/查替', tag: 'TEXT', color: '#ffa500' },
  { href: '/lab/tools/subnet', icon: '🌐', label: 'IP 子网计算', desc: 'CIDR 子网掩码 / 地址范围 / 二进制展示', tag: 'NET', color: '#b400ff' },
  { href: '/lab/tools/bitwise', icon: '🔢', label: '位运算计算器', desc: '32-bit AND/OR/XOR/移位可视化', tag: 'SYS', color: '#00d4ff' },
  { href: '/lab/tools/number-theory', icon: 'π', label: '数论工具箱', desc: '质因数分解 / GCD / Miller-Rabin / 快速幂', tag: 'MATH', color: '#00ff88' },
  { href: '/lab/tools/ascii-table', icon: 'AS', label: 'ASCII 码表', desc: '完整 ASCII 0-127，字节级详情，一键复制', tag: 'REF', color: '#00d4ff' },
  { href: '/lab/tools/http-status', icon: '🌐', label: 'HTTP 状态码', desc: '1xx-5xx 完整查询，含 418 茶壶彩蛋', tag: 'NET', color: '#ff4500' },
  { href: '/lab/tools/lorem-ipsum', icon: '📄', label: 'Lorem Ipsum', desc: '乱数假文生成，支持中文/代码/赛博朋克风', tag: 'TEXT', color: '#b400ff' },
  { href: '/lab/tools/yaml-json', icon: '⇄', label: 'YAML ↔ JSON', desc: 'YAML 与 JSON 实时互转，双栏编辑器', tag: 'FORMAT', color: '#39ff14' },
  { href: '/lab/tools/password-gen', icon: '🔐', label: '密码生成器', desc: '熵值强度评估，可记忆词组，批量生成', tag: 'CRYPTO', color: '#ff00aa' },
]
</script>
