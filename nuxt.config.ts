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
    },
  },

  app: {
    head: {
      link: [
        { rel: 'sitemap', type: 'application/xml', href: 'https://void.redx.space/sitemap.xml' },
      ],
      meta: [
        { name: 'robots', content: 'index, follow' },
      ],
    },
  },

  pwa: {
    registerType: 'prompt',   // waiting SW → 用户手动触发更新，避免强刷丢资源

    client: {
      installPrompt: false,    // 让浏览器自己显示安装提示
      periodicSyncForUpdates: 3600,  // 每小时检查更新
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
      navigateFallback: null,        // SSR 不用 fallback
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      runtimeCaching: [
        {
          urlPattern: /^\/api\/.*/,
          handler: 'NetworkFirst',   // API 永远走网络优先
          options: { cacheName: 'api-cache', networkTimeoutSeconds: 5 },
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
