import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-05-01',

  future: {
    compatibilityVersion: 4,  // Nuxt 4 目录结构 + 行为变更
  },

  devtools: { enabled: true },

  // 显式声明所有组件子目录，prefix:'' 保持原始组件名（AppNav 不变为 UiAppNav）
  components: {
    dirs: [
      { path: '~/components/ui',           prefix: '' },
      { path: '~/components/blog',         prefix: '' },
      { path: '~/components/lab',          prefix: '' },
      { path: '~/components/editor',       prefix: '' },
      { path: '~/components/ai-assistant', prefix: '' },
      { path: '~/components/ai-flow',      prefix: '' },
    ],
  },

  modules: ['@vite-pwa/nuxt'],

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  runtimeConfig: {
    // 服务端私有（不暴露给客户端）
    adminPassword: '',  // 生产由 CF Pages 环境变量 NUXT_ADMIN_PASSWORD 注入
    jwtSecret: '',      // 生产由 CF Pages 环境变量 NUXT_JWT_SECRET 注入
    openaiKey: '',      // 生产由 CF Pages 环境变量 NUXT_OPENAI_KEY 注入
    public: {
      siteUrl: 'https://void.redx.space',
      siteName: 'void.dev',
      siteDescription: '王宇的技术博客 — C++ / Python / AI Agent / 桌面应用',
      authorName: '王宇',
      authorEmail: 'moke521_wang@163.com',
      authorGithub: 'https://github.com/Quantum404Void',
      authorInitial: '王',
      authorMotto: '不灸水，不追热点，不水文章',
    },
  },

  app: {
    head: {
      link: [
        // sitemap href: 生产地址，如需多域部署改这里
        { rel: 'sitemap', type: 'application/xml', href: '/sitemap.xml' },
        // canonical 默认指向首页（各页面会覆盖）
        { rel: 'canonical', href: 'https://void.redx.space' },
        // RSS 自动发现
        { rel: 'alternate', type: 'application/rss+xml', title: 'void.dev RSS', href: '/rss.xml' },
        // JetBrains Mono 来自 Google Fonts
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap' },
      ],
      meta: [
        { name: 'robots', content: 'index, follow' },
      ],
    },
  },

  pwa: {
    registerType: 'autoUpdate',  // 新 SW 直接 skipWaiting + clients.claim，即时生效

    client: {
      installPrompt: false,
      periodicSyncForUpdates: 3600,
    },

    manifest: {
      name: 'void.dev',
      short_name: 'void.dev',
      description: '王宇的技术博客 — C++ / Python / AI Agent / 桌面应用',
      theme_color: '#00ff88',
      background_color: '#0a0a0f',
      lang: 'zh-CN',
      display: 'standalone',
      start_url: '/',
      icons: [
        { src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },

    workbox: {
      navigateFallback: null,
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      // /api/* 完全跳过缓存（和 OpenClaw 一致）
      navigateFallbackDenylist: [/^\/api\//],
      runtimeCaching: [
        {
          urlPattern: /^\/api\/.*/,
          handler: 'NetworkOnly',  // API 永远不缓存
          options: {},
        },
        {
          urlPattern: /^\/_nuxt\/.*/,
          handler: 'CacheFirst',   // hash 资源，缓存优先
          options: { cacheName: 'nuxt-assets', expiration: { maxAgeSeconds: 31536000 } },
        },
      ],
    },
  },

  routeRules: {
    '/': { prerender: false },
    '/api/**': { headers: { 'Cache-Control': 'no-store' } },
    '/rss.xml': { isr: 3600 },
    '/sitemap.xml': { isr: 3600 },
  },

  nitro: {
    preset: 'cloudflare-pages',
    experimental: { wasm: true },
  },
})
