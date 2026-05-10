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

![Nuxt](https://img.shields.io/badge/Nuxt-3-00DC82?style=flat-square&logo=nuxt.js&logoColor=white)
![Vue](https://img.shields.io/badge/Vue-3-4FC08D?style=flat-square&logo=vue.js&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)
![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-F38020?style=flat-square&logo=cloudflare&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-enabled-5A0FC8?style=flat-square&logo=googlechrome&logoColor=white)

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
                       │   │  void-blog   │           │   │
                       │   │   -posts     │           │   │
                       │   └─────────────-┘           │   │
                       │                              │   │
                       │   Service Worker (PWA) ──────┘   │
                       └─────────────────────────────────-┘
```

## 技术栈

| 层         | 技术                          | 备注                        |
|------------|------------------------------|-----------------------------|
| 框架       | Nuxt 3 + Vue 3               | SSR + ISR，部分页面预渲染     |
| 样式       | Tailwind CSS v4              | 原子化，暗色主题             |
| 数据库     | Cloudflare D1                | SQLite at the edge          |
| 部署       | Cloudflare Pages             | `wrangler pages deploy`     |
| PWA        | `@vite-pwa/nuxt`             | autoUpdate，离线缓存         |
| 构建工具   | Vite 内置（Nuxt 集成）        | TS 严格模式                 |

## 目录结构

```
void-blog/
├── pages/
│   ├── index.vue              # 首页：文章流 + 侧边栏
│   ├── blog/                  # 文章详情（markdown 渲染 + TOC + 评论）
│   ├── tags/                  # 标签归档（热力云 + 分类列表）
│   ├── search.vue             # 全文搜索（实时 debounce）
│   ├── stats.vue              # 站点统计（热力图 + 图表）
│   ├── about.vue              # 关于页
│   ├── lab/
│   │   ├── index.vue          # Lab 入口（游戏 + 工具目录）
│   │   ├── games/
│   │   │   └── ai-flow/       # AI Flow 可执行流程图编辑器
│   │   └── tools/             # 在线工具集合
│   └── admin/                 # 管理后台（JWT 保护）
├── server/
│   ├── api/                   # Nitro server routes（绑定 D1）
│   ├── middleware/             # 鉴权中间件
│   ├── routes/                # 自定义路由（RSS / Sitemap）
│   └── utils/                 # 服务端工具（d1.ts / auth.ts）
├── components/
│   ├── AiFlow/                # AI Flow 编辑器子组件
│   │   ├── Toolbar.vue        # 顶部操作栏
│   │   ├── NodePalette.vue    # 左侧节点面板 + Presets
│   │   ├── LogPanel.vue       # 右侧运行日志 + 导出
│   │   ├── QuickAdd.vue       # Tab 快速添加节点
│   │   └── Minimap.vue        # 右下角缩略图
│   ├── AppNav.vue             # 顶部导航（面包屑 + 移动端菜单）
│   ├── AppFooter.vue          # 统一页脚组件
│   ├── PostCard.vue           # 文章卡片（search / tags 复用）
│   ├── TableOfContents.vue    # 文章目录
│   ├── GiscusComments.vue     # Giscus 评论
│   ├── ReadingProgress.vue    # 阅读进度条
│   ├── GlobalActions.vue      # 全局浮动操作（主题 / 回顶）
│   └── Chart.vue              # Chart.js 封装
├── composables/
│   ├── useSiteConfig.ts       # 站点配置（从 runtimeConfig 统一读取）
│   ├── useMarkdown.ts         # markdown-it 单例（含语法高亮 / callout）
│   ├── useFormatDate.ts       # 日期格式化（formatDate / Long / MonthDay）
│   ├── useTagColor.ts         # 标签颜色哈希（neon 四色）
│   ├── useReadingTime.ts      # CJK 感知阅读时长估算
│   └── useCodeCopy.ts         # 代码块一键复制按钮注入
├── types/
│   ├── post.ts                # PostSummary / Post 接口
│   ├── ai-flow.ts             # AI Flow 所有 TypeScript 类型
│   └── cloudflare.d.ts        # D1 全局类型声明
├── utils/
│   ├── ai-flow.ts             # NODE_SPECS（36 节点）+ helper 函数
│   └── ai-flow-presets.ts     # 5 个内置 Preset 数据工厂
├── assets/css/main.css        # 全局样式 + Tailwind v4 主题变量
├── migrations/                # D1 Schema 迁移文件
├── scripts/                   # 工具脚本（Obsidian 同步等）
├── nuxt.config.ts             # Nuxt 配置（PWA / runtimeConfig / routeRules）
└── wrangler.toml              # CF Workers / D1 绑定配置
```

## AI Flow 编辑器

`/lab/ai-flow` — 一个运行在浏览器里的可执行流程图编辑器，数据流向即执行顺序。

**36 个内置节点（6 类）：**

| 类别 | 节点 |
|------|------|
| Source | Number / Boolean / Text / Array / Range / Random |
| Array | Map / Filter / Reduce / Sort / Unique / Take / Flatten / Chunk / Zip / Count / Reverse |
| Math | Add / Multiply / Compare / Round |
| Control | Merge / Branch |
| Object | Object.keys / Object.values / Object.pick |
| String | Split / Join / Uppercase / Lowercase / Regex Match / Regex Replace / Slice |
| Output | Preview / JSON.parse / JSON.stringify / Stats |

**功能：**
- Zoom / Pan / Fit View（Wheel 缩放，Space+拖 平移）
- Minimap 点击跳转 · 框选 / 多选 · 批量拖动
- Undo / Redo · Arrow key Nudge · Auto Layout
- Group 容器 · Quick Add 搜索（Tab）
- 右键上下文菜单（Duplicate / Group / Delete）
- `?` 键快捷键帮助 Overlay
- JSON Export / Import · Mermaid 导出
- LocalStorage 自动保存 / 恢复
- 5 个内置 Preset（squares / text / json / branch / math）

## 本地开发

```bash
# 安装依赖
npm install

# 本地开发服务器（http://localhost:3000）
npm run dev

# 本地 D1 预览（需要 wrangler 登录）
wrangler pages dev dist --d1=void_blog_posts

# 类型检查
npx nuxi typecheck

# 构建
npm run build
```

## 部署

```bash
# 一键生成 + 部署 + 同步 Obsidian
npm run deploy

# 等价于：
nuxt generate
wrangler pages deploy dist --project-name void-blog
python3 scripts/sync-obsidian.py --direction=to-obsidian
```

> **CF Pages 环境变量**
>
> | 变量名                | 说明              |
> |----------------------|-------------------|
> | `NUXT_ADMIN_PASSWORD` | 管理后台登录密码  |
> | `NUXT_JWT_SECRET`     | JWT 签名密钥      |

## 数据库

```bash
# 查看 D1 绑定
cat wrangler.toml

# 本地执行迁移
wrangler d1 execute void-blog-posts --local --file=migrations/xxx.sql

# 生产执行迁移
wrangler d1 execute void-blog-posts --remote --file=migrations/xxx.sql
```

## 路由规则

| 路径           | 策略         | 说明                    |
|---------------|-------------|------------------------|
| `/`           | 不预渲染     | 动态从 D1 加载          |
| `/api/**`     | NetworkOnly  | 永不缓存                |
| `/rss.xml`    | ISR 3600s   | 每小时重新生成           |
| `/sitemap.xml`| ISR 3600s   | 每小时重新生成           |

## 设计原则

- **内容优先**：D1 作为单一数据源，无外部 CMS 依赖
- **边缘优先**：Nitro preset = `cloudflare-pages`，离用户最近的节点响应
- **零冷启动**：Pages Functions 不同于 Workers，无冷启动惩罚
- **渐进增强**：PWA 离线缓存静态资源，API 永远走网络
- **组件化**：composable 统一共享逻辑，PostCard / AppFooter 跨页面复用

---

<div align="center">

made with 🔧 by [Quantum404Void](https://github.com/Quantum404Void)

*「不灸水，不追热点，不水文章」*

</div>
