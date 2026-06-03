<div align="center">

<br />

# void.dev

**个人技术博客 — 不灸水，只写真正踩过坑的东西**

[void.redx.space](https://void.redx.space) · Nuxt 4 · Cloudflare Pages + D1

<br />

</div>

---

## 技术栈

| | |
|---|---|
| 框架 | Nuxt 4 + Vue 3 |
| 样式 | Tailwind CSS v4 |
| 数据库 | Cloudflare D1 (SQLite + FTS5) |
| 部署 | Cloudflare Pages (Edge) |
| 代码高亮 | Shiki (客户端懒加载) |
| AI 助手 | CF Workers AI — DeepSeek R1 蒸馏版 |

## 快速开始

```bash
git clone https://github.com/Quantum404Void/void-blog.git
cd void-blog
npm install
npm run dev
```

首次部署需执行 D1 migrations：

```bash
npx wrangler d1 execute void-blog-posts --remote --file=migrations/0001_init.sql
npx wrangler d1 execute void-blog-posts --remote --file=migrations/0002_fts_wordcount.sql
```

CF Pages 环境变量：`NUXT_ADMIN_PASSWORD` · `NUXT_JWT_SECRET`

---

MIT © 2026 Void
