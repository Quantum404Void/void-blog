```
██╗   ██╗ ██████╗ ██╗██████╗     ██████╗ ██╗      ██████╗  ██████╗
██║   ██║██╔═══██╗██║██╔══██╗    ██╔══██╗██║     ██╔═══██╗██╔════╝
██║   ██║██║   ██║██║██║  ██║    ██████╔╝██║     ██║   ██║██║  ███╗
╚██╗ ██╔╝██║   ██║██║██║  ██║    ██╔══██╗██║     ██║   ██║██║   ██║
 ╚████╔╝ ╚██████╔╝██║██████╔╝    ██████╔╝███████╗╚██████╔╝╚██████╔╝
  ╚═══╝   ╚═════╝ ╚═╝╚═════╝     ╚═════╝ ╚══════╝ ╚═════╝  ╚═════╝
```

<div align="center">

**[void.redx.space](https://void.redx.space)** — 不灸水，不追热点，不水文章

![Nuxt](https://img.shields.io/badge/Nuxt-4-00DC82?style=flat-square&logo=nuxt.js&logoColor=white)
![Vue](https://img.shields.io/badge/Vue-3-4FC08D?style=flat-square&logo=vue.js&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)
![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-F38020?style=flat-square&logo=cloudflare&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-enabled-5A0FC8?style=flat-square&logo=googlechrome&logoColor=white)
![GSAP](https://img.shields.io/badge/GSAP-3-88CE02?style=flat-square&logo=greensock&logoColor=white)

</div>

---

## 架构概览

```
                       ┌─────────────────────────────────┐
                       │         Cloudflare Edge          │
   Browser             │                                  │
     │                 │   ┌──────────────┐               │
     │  HTTPS          │   │  CF Pages    │  SSR / ISR    │
     └────────────────►│   │  (Nuxt 3)    │◄──────────┐   │
                       │   └──────┬───────┘           │   │
                       │          │ D1 Binding         │   │
                       │   ┌──────▼───────┐           │   │
                       │   │  D1 Database │           │   │
                       │   │  void-blog-posts         │   │
                       │   └──────────────┘           │   │
                       │                              │   │
                       │   Service Worker (PWA) ──────┘   │
                       └─────────────────────────────────-┘
```

## 技术栈

| 层         | 技术                          | 备注                              |
|------------|------------------------------|-----------------------------------|
| 框架       | Nuxt 4 + Vue 3               | SSR + ISR，边缘渲染                |
| 样式       | Tailwind CSS v4              | 原子化，终端暗色主题               |
| 动画       | GSAP 3 + ScrollTrigger       | 入场动画 / 滚动揭示 / 复杂 timeline；hover 等简单状态保持 CSS |
| 数据库     | Cloudflare D1                | SQLite at the edge，零冷启动       |
| 部署       | Cloudflare Pages             | Git push 自动触发                  |
| PWA        | `@vite-pwa/nuxt`             | autoUpdate SW，离线缓存            |
| Markdown   | markdown-it + Shiki          | 客户端渲染，客制 voidTheme 赛博朋克色盘 |
| 评论       | Giscus                       | GitHub Discussions 驱动            |

## 目录结构

```
void-blog/
├── app/                           # Nuxt 4 应用目录
│   ├── pages/
│   │   ├── index.vue              # 首页：GSAP Hero 入场 + 文章流 + 侧边栏
│   │   ├── blog/
│   │   │   ├── index.vue          # 文章列表（按年归档 + 标签过滤 + ScrollTrigger stagger）
│   │   │   └── [slug].vue         # 文章详情（TOC / 评论 / 上下篇 / 浏览量）
│   │   ├── tags/
│   │   │   ├── index.vue          # 标签热力云
│   │   │   └── [tag].vue          # 标签分类列表
│   │   ├── search.vue             # 全文搜索（实时 debounce + D1 FTS5）
│   │   ├── stats.vue              # 站点统计（GitHub 热力图风格 + Chart.js）
│   │   ├── about.vue              # 关于页（终端风格）
│   │   ├── lab/
│   │   │   ├── index.vue          # Lab 入口（游戏 + 工具目录，Anime.js stagger）
│   │   │   ├── games/             # 37 个技术宅游戏
│   │   │   │   ├── ai-flow/       # ★ AI Flow 可执行流程图编辑器
│   │   │   │   ├── chip8.vue      # CHIP-8 模拟器
│   │   │   │   ├── x86-playground.vue  # x86 汇编沙盒
│   │   │   │   ├── silk.vue       # Weavesilk 风格生成艺术
│   │   │   │   └── ...            # snake / tetris / 2048 / flappy 等
│   │   │   └── tools/             # 27 个在线工具
│   │   │       ├── json.vue       # JSON 格式化
│   │   │       ├── regex.vue      # 正则测试器
│   │   │       ├── qrcode.vue     # QR 码生成器（纯前端手写 QR 算法）
│   │   │       └── ...            # hash / url / diff / ascii 等
│   │   └── admin/                 # 管理后台（JWT 保护）
│   ├── components/
│   │   ├── AiFlow/            # AI Flow 子组件
│   │   │   ├── Toolbar.vue    # 工具栏（Snap-to-Grid / Run / Undo 等）
│   │   │   ├── NodePalette.vue # 左侧节点面板 + Presets
│   │   │   ├── LogPanel.vue   # 右侧运行日志 + JSON/Mermaid 导出
│   │   │   ├── QuickAdd.vue   # Tab 快速搜索添加节点
│   │   │   └── Minimap.vue    # 右下角缩略图
│   │   ├── AppNav.vue         # 顶部导航（路径 + 面包屑 + 移动端菜单）
│   │   ├── AppFooter.vue      # 统一页脚
│   │   ├── PostCard.vue       # 文章卡片
│   │   ├── TableOfContents.vue # 文章目录（IntersectionObserver 激活）
│   │   ├── GiscusComments.vue # Giscus 评论
│   │   ├── ReadingProgress.vue # 阅读进度条（transform: scaleX，GPU 加速）
│   │   ├── GlobalActions.vue  # 回顶按钮 + 键盘彩蛋（Konami / DOOM / sudo）
│   │   ├── CodeMirrorEditor.vue # CM6 代码编辑器（lang-cpp + lang-sql）
│   │   └── Chart.vue          # Chart.js 封装
│   ├── composables/
│   │   ├── useGsap.ts           # SSR 安全的 GSAP 懒加载，返回 GsapBundle | null
│   │   ├── useAnime.ts          # SSR 安全的 Anime.js 懒加载，返回 anime | null
│   │   ├── useTts.ts            # 文章朗读（SpeechSynthesis，zh-CN，SSR 安全）
│   │   ├── useReadingProgress.ts # 阅读进度持久化（localStorage + 继续阅读）
│   │   ├── useSiteConfig.ts     # 站点配置（runtimeConfig 统一读取）
│   │   ├── useMarkdown.client.ts # markdown-it 单例（Shiki / callout / 懒加载图）
│   │   ├── useFormatDate.ts     # 日期格式化
│   │   ├── useTagColor.ts       # 标签颜色哈希（neon 四色）
│   │   ├── useReadingTime.ts    # CJK 感知阅读时长 + 字数统计
│   │   ├── useCodeCopy.ts       # 代码块复制按钮
│   │   ├── useCanonical.ts      # Canonical URL 注入
│   │   └── useAiFlow.ts         # AI Flow 核心状态 composable
│   ├── layouts/
│   │   └── default.vue        # 全局布局（光标成价 + 粒子特效 + 键盘快捷键）
│   ├── plugins/
│   │   └── shiki.client.ts    # Shiki 客户端初始化
│   ├── utils/
│   │   ├── ai-flow.ts         # NODE_SPECS（36 节点）+ helper
│   │   ├── ai-flow-presets.ts # 5 个内置 Preset 工厂
│   │   └── ai-flow-runner.ts  # ★ 纯函数拓扑执行器（零副作用）
│   ├── types/
│   │   ├── post.ts            # PostSummary（含 views/likes/word_count）/ Post
│   │   ├── ai.ts              # ChatMessage / AiChatResponse / UiMessage
│   │   ├── ai-flow.ts         # AI Flow 全量类型定义
│   │   └── cloudflare.d.ts    # D1 全局声明
│   └── assets/
│       └── css/main.css       # 全局样式（Tailwind v4 + prose + 终端特效）
├── server/
│   ├── api/
│   │   ├── posts/             # 文章 CRUD（D1 binding）
│   │   ├── auth/              # 登录 / 验证接口
│   │   ├── tags/              # 标签统计
│   │   ├── search.get.ts      # 全文搜索（D1 FTS5）
│   │   └── stats/             # 浏览量 / 点赞
│   ├── routes/
│   │   ├── ai-chat.post.ts    # AI 助手接口（→ GitHub Copilot gpt-5-mini）
│   │   ├── og/[slug].ts       # ★ 动态 OG 图（SVG 边缘生成）
│   │   ├── rss.xml.ts         # RSS Feed（ISR 1h）
│   │   └── sitemap.xml.ts     # Sitemap（ISR 1h）
│   ├── middleware/
│   │   ├── admin-auth.ts      # JWT 鉴权
│   │   └── curl-about.ts      # curl 当 about 用
│   └── utils/
│       ├── d1.ts              # D1 binding helper
│       ├── auth.ts            # JWT 工具
│       └── fts.ts             # FTS5 查询构建器
├── migrations/                # D1 Schema 迁移（0001 初始化 / 0002 FTS + 统计）
├── scripts/                   # Obsidian 同步脚本
├── nuxt.config.ts             # PWA / runtimeConfig / routeRules / nitro
└── wrangler.toml              # CF D1 绑定配置
```


## AI Flow 编辑器

`/lab/ai-flow` — 浏览器内可执行流程图编辑器，数据流向即执行顺序，DAG 拓扑排序执行。

**36 个内置节点（7 类）：**

| 类别 | 节点 |
|------|------|
| Source | Number / Boolean / Text / Array / Range / **Random** |
| Array | Map / Filter / Reduce / Sort / Unique / Take / **Flatten / Chunk / Zip / Count / Reverse** |
| Math | Add / Multiply / Compare / **Round** |
| Control | Merge / Branch |
| Object | **Object.keys / Object.values / Object.pick** |
| String | Split / Join / Uppercase / Lowercase / **Regex Match / Regex Replace / Slice** |
| Output | Preview / JSON.parse / JSON.stringify / Stats |

**编辑器功能：**
- Zoom / Pan（Ctrl+Wheel 缩放，Wheel 平移，Space+拖）
- Minimap 点击跳转 · 框选多选 · 批量拖动
- Snap to Grid（G 键切换，20px 网格吸附）
- Undo / Redo（80 步历史）· Arrow key Nudge
- Auto Layout（Sugiyama 拓扑分层）
- Group 容器 · Quick Add（Tab 搜索）
- 右键上下文菜单（Duplicate / Group / Delete）
- `?` 快捷键 Overlay（14 条快捷键）
- 连线视觉：执行成功实线 / 未执行虚线
- 节点状态：🟢 成功 / 🔴 失败 / ⚪ 未执行
- JSON Export / Import · Mermaid 导出
- LocalStorage 自动保存 / 恢复
- 5 个内置 Preset（squares / text / json / branch / math）

## SEO & 性能

| 功能 | 实现 |
|------|------|
| Canonical URL | `useCanonical.ts` 注入所有页面 |
| 动态 OG 图 | `server/routes/og/[slug].ts` SVG 边缘生成，含标题/标签 |
| RSS 自动发现 | `<link rel="alternate">` 在 `<head>` |
| 文章预取 | `<link rel="prefetch">` 上下篇 |
| 图片懒加载 | markdown-it image renderer 注入 `loading="lazy"` |
| 阅读进度 | `transform: scaleX()` GPU 加速，不触发 layout |
| 字数统计 | CJK 感知，`1.2k字 · 约 3min` |
| 代码块 | 语言 badge（`data-lang` + CSS `::after`）+ 复制按钮 |

## 本地开发

```bash
npm install

# 开发服务器
npm run dev

# 本地 D1 预览（需 wrangler 登录）
wrangler pages dev dist --d1=void_blog_posts

# 类型检查
npx nuxi typecheck

# 生产构建
npm run build
```

## 部署

```bash
npm run deploy
# 等价于：
# nuxt generate && wrangler pages deploy dist --project-name void-blog
# python3 scripts/sync-obsidian.py --direction=to-obsidian
```

> **CF Pages 必需环境变量**
>
> | 变量名 | 说明 |
> |--------|------|
> | `NUXT_ADMIN_PASSWORD` | 管理后台登录密码 |
> | `NUXT_JWT_SECRET` | JWT 签名密钥 |

## 路由规则

| 路径 | 策略 | 说明 |
|------|------|------|
| `/` | 不预渲染 | 动态 D1 |
| `/api/**` | NetworkOnly | 永不缓存 |
| `/og/**` | Cache 24h | 动态 OG SVG |
| `/rss.xml` | ISR 3600s | 每小时重生成 |
| `/sitemap.xml` | ISR 3600s | 每小时重生成 |

## 设计原则

- **SSR 安全**：所有 `localStorage` / `document` 访问在 `onMounted` 内，无 SSR 副作用
- **内容优先**：D1 单一数据源，无外部 CMS
- **边缘优先**：`cloudflare-pages` preset，用户最近节点响应
- **组件化**：composable 抽象共享逻辑，类型全覆盖
- **动画分层**：GSAP 负责入场 / 滚动 / 复杂时间轴；hover 状态等瞬态过渡保持 CSS `transition`，零 JS 开销
- **性能**：GPU 动画、`v-memo` 节点优化、`transform` 代替 `width`

---

<div align="center">

made with 🔧 by [Quantum404Void](https://github.com/Quantum404Void)

*「不灸水，不追热点，不水文章」*

</div>
