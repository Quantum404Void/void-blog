# void.redx.space

个人技术博客。终端美学，写工程实践里真实踩过的坑。

🌐 **线上地址**：[void.redx.space](https://void.redx.space)

## 技术栈

- **框架**：Astro 6 (SSR)
- **样式**：Tailwind v4 CSS-first
- **内容**：Cloudflare D1（SQLite）— 文章存数据库，无 git 内容仓库
- **部署**：Cloudflare Workers + Static Assets
- **CI/CD**：GitHub Actions 自动部署
- **PWA**：自定义 Service Worker，install即接管，版本变化自动提示

## 架构

```
GitHub push main
    │
    ▼
GitHub Actions
    ├── bun build → dist/server/entry.mjs + dist/client/
    └── wrangler deploy → Cloudflare Worker (void-blog)
                              │
                    ┌─────────┴──────────┐
                    │ Static Assets      │ D1 Database
                    │ dist/client/       │ void-blog-posts
                    └────────────────────┘
                              │
                    void.redx.space
```

## 数据库

文章存储在 Cloudflare D1（`void-blog-posts`），无独立内容仓库。

新增文章方式：

```bash
# 写入 migrations/0002_seed.sql 然后执行
bunx wrangler d1 execute void-blog-posts --remote --file=migrations/0002_seed.sql
```

或用迁移脚本（从 mdx 批量导入）：

```bash
# 把 mdx 文件放到 ../void-blog-content/posts/（临时）
node migrations/migrate-posts.mjs
```

## 本地开发

```sh
bun install
bun run dev       # 开发服务器 localhost:4321（需要 wrangler platformProxy）
bun run build     # 构建输出到 dist/
```

## 版本

当前版本：**v1.0.0**（显示在右下角）
