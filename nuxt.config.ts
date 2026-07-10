import tailwindcss from '@tailwindcss/vite'

const isProduction = process.env.NODE_ENV === 'production'

export default defineNuxtConfig({
  compatibilityDate: '2025-05-01',

  future: {
    compatibilityVersion: 4,  // Nuxt 4 目录结构 + 行为变更
  },

  devtools: { enabled: true },

  // 显式声明所有组件子目录，prefix:'' 保持原始组件名（AppNav 不变为 UiAppNav）
  imports: {
    dirs: [
      'composables',
      'composables/animation',
      'composables/blog',
    ],
  },

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

  css: ['~/assets/css/main.css', 'katex/dist/katex.min.css'],

  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          // 把 shiki 语言包单独分离成 chunk，不污染主 bundle
          manualChunks(id: string) {
            if (id.includes('shiki/langs/') || id.includes('shiki/themes/')) {
              return 'shiki-langs'
            }
            if (id.includes('gsap')) return 'gsap'
            if (id.includes('animejs') || id.includes('anime.esm')) return 'anime'
          },
        },
      },
    },
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
      buildHash: (process.env.CF_PAGES_COMMIT_SHA ?? '').slice(0, 7) || 'local',
    },
  },

  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico', sizes: '48x48' },
        { rel: 'apple-touch-icon', href: '/icons/pwa-192x192.png' },
        { rel: 'sitemap', type: 'application/xml', href: '/sitemap.xml' },
        { rel: 'canonical', href: 'https://void.redx.space' },
        { rel: 'alternate', type: 'application/rss+xml', title: 'void.dev RSS', href: '/rss.xml' },
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
    // 页面级 ISR 缓存（CF Pages 支持）
    '/': { isr: isProduction ? 300 : false },
    '/blog': { isr: isProduction ? 300 : false },
    '/blog/**': { isr: isProduction ? 600 : false },
    '/tags': { isr: isProduction ? 600 : false },
    '/tags/**': { isr: isProduction ? 600 : false },
    '/about': { isr: isProduction ? 3600 : false },
    '/stats': { isr: isProduction ? 300 : false },
    // 只读数据：CF Edge 缓存 60s，D1 写入后自动过期（浏览器不缓存，只缓存在 CF edge）
    '/api/posts': { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' } },
    '/api/posts/**': { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' } },
    '/api/tags': { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' } },
    '/api/search': { headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' } },
    '/api/stats': { headers: { 'Cache-Control': 's-maxage=30' } },
    // 动态数据（统计、管理）：不缓存
    '/api/posts/*/stats': { headers: { 'Cache-Control': 'no-store' } },
    '/api/admin/**': { headers: { 'Cache-Control': 'no-store' } },
    '/api/auth/**': { headers: { 'Cache-Control': 'no-store' } },
    '/api/ai-chat': { headers: { 'Cache-Control': 'no-store' } },
    '/rss.xml': { isr: isProduction ? 3600 : false },
    '/sitemap.xml': { isr: isProduction ? 3600 : false },
  },

  nitro: {
    preset: 'cloudflare-pages',
    experimental: { wasm: true },
  },
})
