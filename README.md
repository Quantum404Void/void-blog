# void.redx.space

个人技术博客。终端美学，写工程实践里真实踩过的坑。

🌐 **线上地址**：[void.redx.space](https://void.redx.space)

## 技术栈

- **框架**：Astro 6 (static output)
- **样式**：Tailwind v4 CSS-first
- **内容**：MDX（文章存储在 [void-blog-content](https://github.com/Quantum505Void/void-blog-content) 仓库）
- **部署**：Cloudflare Pages，GitHub Actions 自动触发
- **PWA**：`@vite-pwa/astro`，支持安装到主屏幕

## 工作流

```
void-blog-content (文章)
        │  push → dispatch trigger
        ▼
void-blog (框架) → GitHub Actions → Cloudflare Pages → void.redx.space
```

## 本地开发

```sh
bun install
bun run dev       # 开发服务器 localhost:4321
bun run build     # 构建输出到 dist/
bun run preview   # 预览构建结果
```

## 写文章

文章统一在 [void-blog-content](https://github.com/Quantum505Void/void-blog-content) 仓库管理，push 后自动触发本仓库重新构建部署。
