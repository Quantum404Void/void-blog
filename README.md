# void.dev

```
██╗   ██╗ ██████╗ ██╗██████╗     ██████╗ ███████╗██╗   ██╗
██║   ██║██╔═══██╗██║██╔══██╗    ██╔══██╗██╔════╝██║   ██║
██║   ██║██║   ██║██║██║  ██║    ██║  ██║█████╗  ██║   ██║
╚██╗ ██╔╝██║   ██║██║██║  ██║    ██║  ██║██╔══╝  ╚██╗ ██╔╝
 ╚████╔╝ ╚██████╔╝██║██████╔╝    ██████╔╝███████╗ ╚████╔╝
  ╚═══╝   ╚═════╝ ╚═╝╚═════╝     ╚═════╝ ╚══════╝  ╚═══╝
```

<div align="center">

**[void.redx.space](https://void.redx.space)**

不灸水，不追热点，只写真正踩过坑的东西

[![Nuxt 4](https://img.shields.io/badge/Nuxt-4-00DC82?style=flat-square&logo=nuxt.js)](https://nuxt.com)
[![Vue 3](https://img.shields.io/badge/Vue-3-4FC08D?style=flat-square&logo=vue.js)](https://vuejs.org)
[![Tailwind v4](https://img.shields.io/badge/Tailwind-v4-38BDF8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages+D1+AI-F38020?style=flat-square&logo=cloudflare)](https://pages.cloudflare.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![License MIT](https://img.shields.io/badge/License-MIT-6366f1?style=flat-square)](#)

</div>

---

## 技术栈

| 层 | 技术 | 说明 |
|---|---|---|
| **框架** | Nuxt 4.4 + Vue 3 | `future.compatibilityVersion: 4`，app/ 子目录结构 |
| **样式** | Tailwind CSS v4 | CSS-native，零配置，`@theme` 自定义变量 |
| **数据库** | Cloudflare D1 (SQLite) | FTS5 全文搜索，`post_stats` 访问/点赞统计 |
| **部署** | Cloudflare Pages | Edge 渲染，全球分发，CI/CD 自动部署 |
| **AI 助手** | CF Workers AI (`deepseek-r1-distill-qwen-32b`) | 免费，无需 API key，原生 binding |
| **代码高亮** | Shiki + markdown-it | 客户端懒加载，14 种语言按需加载 |
| **动画** | GSAP 3 + Anime.js | GSAP 负责 Hero/ScrollTrigger，Anime.js 负责 Lab 卡片 |
| **PWA** | @vite-pwa/nuxt | 离线缓存，可安装，zh-CN |

---

## 目录结构

```
void-blog/
├── app/
│   ├── assets/css/main.css       # 全局样式（Tailwind v4 + 赛博朋克主题）
│   ├── components/
│   │   ├── ui/                   # AppNav, AppFooter, GlobalActions
│   │   ├── blog/                 # PostCard, ReadingProgress, TocNav
│   │   ├── lab/                  # LabLayout, LabCard
│   │   ├── editor/               # AdminEditor, CodeMirrorEditor
│   │   ├── ai-assistant/         # AiAssistant（AI 对话浮层）
│   │   └── ai-flow/              # AI Flow 可视化节点
│   ├── composables/
│   │   ├── animation/            # useGsap, useAnime
│   │   ├── blog/                 # useTts, useReadingProgress
│   │   └── *.ts                  # useAiFlow, useSiteConfig 等
│   ├── pages/
│   │   ├── index.vue             # 首页 Hero
│   │   ├── blog/[slug].vue       # 文章页（Shiki + TOC + TTS 朗读）
│   │   ├── lab/                  # Lab 工具 + 游戏（20+）
│   │   ├── admin/                # 后台管理（JWT 鉴权）
│   │   └── ...
│   ├── plugins/
│   │   └── shiki.client.ts       # Markdown 渲染（仅客户端）
│   └── types/                    # post.ts, ai.ts, ai-flow.ts
├── server/
│   ├── api/
│   │   ├── posts/                # 文章 CRUD
│   │   ├── admin/                # 后台 API（鉴权）
│   │   ├── ai-chat.post.ts       # AI 助手（CF Workers AI）
│   │   ├── search.get.ts         # FTS5 全文搜索
│   │   └── stats/                # 访问量统计
│   └── utils/                    # d1.ts, auth.ts, fts.ts, response.ts
├── migrations/
│   ├── 0001_init.sql             # 建表：posts
│   └── 0002_fts_wordcount.sql    # post_stats + FTS5 + word_count
└── wrangler.toml                 # CF Pages 配置（D1 + AI binding）
```

---

## 快速开始

```bash
# 克隆
git clone https://github.com/Quantum404Void/void-blog.git
cd void-blog

# 安装依赖
npm install

# 本地开发（D1 本地模式）
npm run dev

# 构建
npm run build

# 预览（本地模拟 CF Pages）
npx wrangler pages dev dist
```

### 数据库初始化（首次部署）

```bash
# 创建 D1 数据库
npx wrangler d1 create void-blog-posts

# 执行 migrations
npx wrangler d1 execute void-blog-posts --remote --file=migrations/0001_init.sql
npx wrangler d1 execute void-blog-posts --remote --file=migrations/0002_fts_wordcount.sql
```

### 必要的环境变量（CF Pages Settings）

| 变量 | 说明 |
|---|---|
| `NUXT_ADMIN_PASSWORD` | 后台管理员密码 |
| `NUXT_JWT_SECRET` | JWT 签名密钥（随机字符串） |

> AI 助手使用 **Cloudflare Workers AI**，无需任何 API key，开箱即用。

---

## 功能一览

### 博客核心
- ✅ Markdown 渲染（Shiki 代码高亮，按需懒加载）
- ✅ FTS5 全文搜索
- ✅ 文章阅读进度条 + TTS 朗读
- ✅ 文章 TOC 目录（滚动高亮）
- ✅ 按年份归档 + 标签过滤
- ✅ 访问量 / 点赞统计（CF D1）
- ✅ RSS 订阅 + Sitemap

### Lab（20+ 工具/游戏）
- 🛠 工具：Hash 计算、正则测试、Cron 解析、子网计算、颜色取色...
- 🎮 游戏：CHIP-8 模拟器、贪吃蛇、2048、扫雷、Conway's Game of Life、Matrix 数字雨...
- 🤖 AI Flow：可视化 AI 节点编排

### AI 助手
- 基于 `@cf/deepseek-ai/deepseek-r1-distill-qwen-32b`（DeepSeek R1 蒸馏版）
- 免费，无需配置，在博客任意页面可用
- 支持多轮对话，最多保留 12 条历史

### 后台管理
- JWT 鉴权（HttpOnly Cookie）
- 文章 CRUD + 草稿管理
- Dashboard：访问量 / 点赞 / 标签分布 / 最近活跃
- 系统操作：字数同步、FTS 重建

---

## 部署

push 到 `main` 分支，Cloudflare Pages 自动构建部署。

```
GitHub main → CF Pages Build → Edge Network → void.redx.space
```

构建命令：`npm run build`  
输出目录：`dist`

---

## License

MIT © 2025 [王宇](https://void.redx.space)
