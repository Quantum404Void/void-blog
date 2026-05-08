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
│   ├── index.vue          # 首页：文章流
│   ├── blog/              # 文章详情
│   ├── tags/              # 标签归档
│   ├── lab/               # 实验性页面
│   ├── stats.vue          # 站点统计
│   ├── search.vue         # 全文搜索
│   └── admin/             # 管理后台（JWT 保护）
├── server/
│   ├── api/               # Nitro server routes（绑定 D1）
│   ├── middleware/         # 鉴权中间件
│   ├── routes/            # 自定义路由（RSS / Sitemap）
│   └── utils/             # 服务端工具
├── components/            # Vue 组件
├── composables/           # 组合式 API
├── assets/css/main.css    # 全局样式入口
├── migrations/            # D1 迁移文件
├── scripts/               # 同步脚本（Obsidian 联动）
├── nuxt.config.ts         # Nuxt 配置
└── wrangler.toml          # CF Workers / D1 绑定
```

## 本地开发

```bash
# 安装依赖（推荐 bun）
bun install

# 本地开发服务器（默认 http://localhost:3000）
bun run dev

# 本地 D1 预览（需要 wrangler 登录）
wrangler pages dev dist --d1=void_blog_posts

# 类型检查
bunx nuxi typecheck
```

## 部署

```bash
# 一键生成 + 部署 + 同步 Obsidian
bun run deploy

# 等价于：
nuxt generate
wrangler pages deploy dist --project-name void-blog
python3 scripts/sync-obsidian.py --direction=to-obsidian
```

> **需要的 CF Pages 环境变量**
>
> | 变量名                | 说明              |
> |----------------------|-------------------|
> | `NUXT_ADMIN_PASSWORD` | 管理后台登录密码  |
> | `NUXT_JWT_SECRET`     | JWT 签名密钥      |

## 数据库

```bash
# 查看 D1 绑定信息
cat wrangler.toml

# 本地执行迁移
wrangler d1 execute void-blog-posts --local --file=migrations/xxx.sql

# 生产执行迁移
wrangler d1 execute void-blog-posts --remote --file=migrations/xxx.sql
```

## 路由规则

| 路径          | 策略         | 说明                    |
|--------------|-------------|------------------------|
| `/`          | 不预渲染     | 动态从 D1 加载          |
| `/api/**`    | NetworkOnly  | 永不缓存                |
| `/rss.xml`   | ISR 3600s   | 每小时重新生成           |
| `/sitemap.xml`| ISR 3600s  | 每小时重新生成           |

## 设计原则

- **内容优先**：D1 作为单一数据源，无外部 CMS 依赖
- **边缘优先**：Nitro preset = `cloudflare-pages`，离用户最近的节点响应
- **零冷启动**：Pages Functions 不同于 Workers，无冷启动惩罚
- **渐进增强**：PWA 离线缓存静态资源，API 永远走网络

---

<div align="center">

made with 🔧 by [Quantum404Void](https://github.com/Quantum404Void)

*「不灸水，不追热点，不水文章」*

</div>
