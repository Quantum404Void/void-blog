import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: ['@vite-pwa/nuxt'],

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  runtimeConfig: {
    public: {
      siteUrl: 'https://void.redx.space',
      siteName: 'void.dev',
      siteDescription: '王宇的技术博客 — 代码、工具、折腾与思考',
      authorName: '王宇',
      authorGithub: 'https://github.com/Quantum505Void',
      authorInitial: '王',
    },
  },

  app: {
    head: {
      link: [
        // sitemap href: 生产地址，如需多域部署改这里
        { rel: 'sitemap', type: 'application/xml', href: '/sitemap.xml' },
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
      description: '王宇的技术博客 — 代码、工具、折腾与思考',
      theme_color: '#00ff88',
      background_color: '#0a0a0f',
      display: 'standalone',
      start_url: '/',
      icons: [
        { src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
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
