# void.dev

个人技术博客 — 不灸水，不追热点，只写真正踩过坑的东西

[![Nuxt 4](https://img.shields.io/badge/Nuxt-4-00DC82?style=flat-square&logo=nuxt.js)](https://nuxt.com)
[![Vue 3](https://img.shields.io/badge/Vue-3-4FC08D?style=flat-square&logo=vue.js)](https://vuejs.org)
[![Tailwind v4](https://img.shields.io/badge/Tailwind-v4-38BDF8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages+D1+AI-F38020?style=flat-square&logo=cloudflare)](https://pages.cloudflare.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)

**[void.redx.space](https://void.redx.space)**

---

## 技术栈

| 层 | 技术 | 说明 |
|---|---|---|
| 框架 | Nuxt 4.4 + Vue 3 | `future.compatibilityVersion: 4`，`app/` 子目录结构 |
| 样式 | Tailwind CSS v4 | CSS-native，`@theme` 自定义变量 |
| 数据库 | Cloudflare D1 (SQLite) | FTS5 全文搜索，`post_stats` 访问/点赞统计，`comments` 评论系统 |
| 部署 | Cloudflare Pages | Edge 渲染，CI/CD 自动部署 |
| 评论 | 自托管（D1 + Nuxt API） | 匿名评论，Markdown 支持，IP 速率限制 |
| 代码高亮 | Shiki + markdown-it | 客户端懒加载 |
| 动画 | GSAP 3 + Anime.js | 页面过渡 + Lab 卡片 |
| PWA | @vite-pwa/nuxt | 离线缓存，可安装 |

---

## 快速开始

```bash
git clone https://github.com/Quantum404Void/void-blog.git
cd void-blog
npm install
npm run dev
```

首次部署，执行 D1 migrations：

```bash
npx wrangler d1 execute void-blog-posts --remote --file=migrations/0001_init.sql
npx wrangler d1 execute void-blog-posts --remote --file=migrations/0002_fts_wordcount.sql
npx wrangler d1 execute void-blog-posts --remote --file=migrations/0003_comments.sql
```

CF Pages 环境变量：

| 变量 | 说明 |
|---|---|
| `NUXT_ADMIN_PASSWORD` | 后台管理员密码 |
| `NUXT_JWT_SECRET` | JWT 签名密钥 |

---

## 目录结构

```
void-blog/
├── app/
│   ├── assets/css/main.css       # 全局样式（Tailwind v4 + 赛博朋克主题）
│   ├── components/ui/            # AppNav, AppFooter
│   ├── components/blog/          # BlogComments, CommentForm, CommentList
│   ├── composables/animation/   # useGsap, useAnime
│   ├── pages/
│   │   ├── index.vue             # 首页
│   │   ├── blog/[slug].vue       # 文章页（Shiki + TOC + TTS + 评论）
│   │   ├── explore.vue           # 搜索 + 标签词云 + 统计
│   │   ├── lab/                  # 20+ 游戏与工具
│   │   └── admin/                # 后台（JWT 鉴权）
│   └── plugins/shiki.client.ts  # Markdown 渲染
├── server/api/                   # posts / search / stats / ai-chat / comments
├── migrations/                   # D1 SQL
└── wrangler.toml                 # CF Pages 配置
```

---

## License

MIT © 2026 [Void](https://void.redx.space)
