# void.dev

个人技术博客与浏览器实验室。正式文章存储在 Cloudflare D1，前端提供搜索、评论、AI 助手、在线工具和交互式系统实验。

[![Nuxt 4](https://img.shields.io/badge/Nuxt-4-00DC82?style=flat-square&logo=nuxt.js)](https://nuxt.com)
[![Vue 3](https://img.shields.io/badge/Vue-3-4FC08D?style=flat-square&logo=vue.js)](https://vuejs.org)
[![Tailwind v4](https://img.shields.io/badge/Tailwind-v4-38BDF8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages+D1+AI-F38020?style=flat-square&logo=cloudflare)](https://pages.cloudflare.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)

**[void.redx.space](https://void.redx.space)**

---

## 技术栈

| 层       | 技术                          | 说明                                                           |
| -------- | ----------------------------- | -------------------------------------------------------------- |
| 框架     | Nuxt 4.4 + Vue 3              | `future.compatibilityVersion: 4`，`app/` 子目录结构            |
| 样式     | Tailwind CSS v4               | CSS-native，`@theme` 自定义变量                                |
| 数据库   | Cloudflare D1 (SQLite)        | FTS5 全文搜索，`post_stats` 访问/点赞统计，`comments` 评论系统 |
| 部署     | Cloudflare Pages              | Edge 渲染，CI/CD 自动部署                                      |
| 评论     | 自托管（D1 + Nuxt API）       | 匿名评论，Markdown 支持，IP 速率限制                           |
| 代码高亮 | Shiki + markdown-it           | 客户端懒加载                                                   |
| 动画     | GSAP 3 + Anime.js             | 页面过渡 + Lab 卡片                                            |
| PWA      | @vite-pwa/nuxt                | 离线缓存，可安装                                               |
| AI 助手  | CF Workers AI (Qwen3 30B MoE) | 无需额外 API Key，以已发布文章作为问答上下文                   |

---

## 功能

- D1 驱动的文章发布、草稿、标签、全文搜索、阅读量、点赞与评论。
- Admin 后台支持 Markdown 编辑与预览、文章状态管理和 FTS 维护。
- Lab 包含 37 个交互式游戏/可视化实验和 26 个在线工具。
- AI Flow 支持可执行 DAG、预设流程、拖拽连线、分支、多输入、撤销重做、自动布局、Minimap，以及 JSON / Mermaid 导入导出。
- PWA、响应式布局、键盘操作和 reduced motion 适配。

正式环境以 D1 为唯一文章来源。`server/content/demo-post.ts` 仅用于本地没有 D1 binding 时的页面预览，不会进入生产文章列表或生产直链。

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

| 变量                  | 说明           |
| --------------------- | -------------- |
| `NUXT_ADMIN_PASSWORD` | 后台管理员密码 |
| `NUXT_JWT_SECRET`     | JWT 签名密钥   |

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
│   │   ├── lab/                  # 37 个实验/游戏 + 26 个在线工具
│   │   └── admin/                # 后台（JWT 鉴权）
│   └── plugins/shiki.client.ts  # Markdown 渲染
├── server/api/                   # posts / search / stats / ai-chat / comments / admin
├── server/content/demo-post.ts   # 仅限无 D1 的本地预览文章
├── migrations/                   # D1 SQL
└── wrangler.toml                 # CF Pages 配置
```

---

## License

MIT © 2026 [Void](https://void.redx.space)
