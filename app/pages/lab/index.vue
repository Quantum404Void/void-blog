<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'lab' }]" />

    <main class="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
      <div class="mb-12">
        <p class="font-mono text-xs text-[var(--color-text-muted)] mb-3">interactive_lab</p>
        <h1 class="font-mono text-4xl sm:text-5xl font-bold tracking-[-0.035em] text-[var(--color-text-primary)] mb-3">
          <span style="color:rgba(180,0,255,0.9)">~/</span>lab
        </h1>
        <p class="max-w-xl text-base leading-relaxed text-[var(--color-text-secondary)]">游戏、开发工具与计算机科学可视化。搜索后直接进入，不需要安装。</p>
        <div class="flex flex-wrap gap-x-6 gap-y-2 mt-4 font-mono text-xs text-[var(--color-text-muted)]">
          <span><span style="color:rgba(180,0,255,0.9)">{{ games.length }}</span> 游戏</span>
          <span><span style="color:rgba(0,212,255,0.9)">{{ tools.length }}</span> 工具</span>
          <span><span style="color:rgba(57,255,20,0.9)">∞</span> 折腾</span>
        </div>

        <!-- 搜索过滤 -->
        <div class="mt-7 relative w-full max-w-xl">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] font-mono text-xs pointer-events-none">~/</span>
          <input
            v-model="searchQuery"
            aria-label="搜索实验与工具"
            type="text"
            placeholder="搜索名称、类别或功能..."
            class="tool-field pl-8 pr-10"
          />
          <button v-if="searchQuery" class="absolute right-1 top-1/2 size-10 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]" aria-label="清空搜索" @click="searchQuery = ''">✕</button>
        </div>
        <p class="tool-help mt-2" aria-live="polite">显示 {{ filteredGames.length + filteredTools.length }} / {{ games.length + tools.length }} 个项目</p>
      </div>

      <!-- GAMES -->
      <section class="mb-12" v-if="filteredGames.length || !searchQuery">
        <h2 class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-5 flex items-center gap-3">
          <span style="color:rgba(180,0,255,0.8)">▶</span> 游戏
          <span class="flex-1 h-px bg-gradient-to-r from-[rgba(180,0,255,0.3)] to-transparent"></span>
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" ref="gamesGrid">
          <NuxtLink
            v-for="game in filteredGames"
            :key="game.href"
            :href="game.href"
            class="lab-card group block min-h-36 border border-[var(--color-void-border)] rounded-xl p-4 sm:p-5 bg-[var(--color-void-card)] transition-colors hover:border-[rgba(180,76,255,0.4)]"
          >
            <div class="flex items-start justify-between gap-3 mb-3">
              <span class="text-2xl transition-transform duration-200 group-hover:scale-110">{{ game.icon }}</span>
              <span class="font-mono text-[10px] px-2 py-0.5 rounded-full border" :style="`border-color:${game.color}44;color:${game.color}`">{{ game.tag }}</span>
            </div>
            <h3 class="font-mono text-sm font-bold text-[var(--color-text-primary)] mb-1 group-hover:transition-colors" style="transition:color 0.2s">{{ game.label }}</h3>
            <p class="text-xs leading-relaxed text-[var(--color-text-muted)]">{{ game.desc }}</p>
          </NuxtLink>
        </div>
      </section>

      <!-- TOOLS -->
      <section v-if="filteredTools.length || !searchQuery">
        <h2 class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-5 flex items-center gap-3">
          <span class="text-[var(--color-neon-cyan)]">▶</span> 在线工具
          <span class="flex-1 h-px bg-gradient-to-r from-[rgba(0,212,255,0.3)] to-transparent"></span>
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" ref="toolsGrid">
          <NuxtLink
            v-for="tool in filteredTools"
            :key="tool.href"
            :href="tool.href"
            class="lab-card group block min-h-36 border border-[var(--color-void-border)] rounded-xl p-4 sm:p-5 bg-[var(--color-void-card)] transition-colors hover:border-[rgba(0,212,255,0.4)]"
          >
            <div class="flex items-start justify-between gap-3 mb-3">
              <span class="text-xl font-mono font-bold transition-transform duration-200 group-hover:scale-110 inline-block" :style="`color:${tool.color}`">{{ tool.icon }}</span>
              <span class="font-mono text-[10px] px-2 py-0.5 rounded-full border" :style="`border-color:${tool.color}44;color:${tool.color}`">{{ tool.tag }}</span>
            </div>
            <h3 class="font-mono text-sm font-bold text-[var(--color-text-primary)] mb-1">{{ tool.label }}</h3>
            <p class="text-xs leading-relaxed text-[var(--color-text-muted)]">{{ tool.desc }}</p>
          </NuxtLink>
        </div>

      </section>

      <div v-if="searchQuery && !filteredGames.length && !filteredTools.length" class="border-y border-[var(--color-void-border)] py-16 text-center font-mono text-[var(--color-text-muted)]">
        <p class="text-sm mb-2">没有找到“{{ searchQuery }}”</p>
        <button class="tool-button mt-2" @click="searchQuery = ''">清空搜索</button>
      </div>
    </main>
    <AppFooter maxW="max-w-5xl" />
  </div>
</template>

<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `Lab | ${siteName}` })

const gamesGrid = useTemplateRef<HTMLElement>('gamesGrid')
const toolsGrid = useTemplateRef<HTMLElement>('toolsGrid')
const prefersReducedMotion = useReducedMotion()

// 将滚动位置写入 sessionStorage，以便返回时恢复
const SCROLL_KEY = 'lab-index-scroll'
onMounted(async () => {
  const saved = sessionStorage.getItem(SCROLL_KEY)
  if (saved) {
    const y = parseInt(saved)
    nextTick(() => window.scrollTo({ top: y, behavior: 'auto' }))
    sessionStorage.removeItem(SCROLL_KEY)
  }

  if (prefersReducedMotion.value) return

  // Anime.js 卡片入场 stagger
  const anime = await useAnime()
  if (!anime) return

  const animateGrid = (grid: HTMLElement | null, delay = 0) => {
    if (!grid) return
    anime({
      targets: grid.querySelectorAll('.lab-card'),
      translateY: [8, 0],
      duration: 350,
      easing: 'easeOutQuart',
      delay: anime.stagger(40, { start: delay }),
    })
  }

  // IntersectionObserver 触发，避免属屏外元素提前播放
  const observe = (grid: HTMLElement | null, delay: number) => {
    if (!grid) return
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        animateGrid(grid, delay)
        io.disconnect()
      }
    }, { threshold: 0.05 })
    io.observe(grid)
  }

  observe(gamesGrid.value, 0)
  observe(toolsGrid.value, 0)
})
onBeforeUnmount(() => {
  sessionStorage.setItem(SCROLL_KEY, String(window.scrollY))
})

const searchQuery = shallowRef('')

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
