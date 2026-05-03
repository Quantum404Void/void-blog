import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  // runtimeConfig: no CF API credentials needed — D1 binding handles auth natively
  runtimeConfig: {},

  routeRules: {
    '/': { prerender: false },   // dynamic — reads from D1
    '/blog/**': { isr: 3600 },
    '/tags/**': { isr: 3600 },
  },

  nitro: {
    preset: 'cloudflare-pages',
    // platformProxy enables D1 binding during `nuxt dev` via wrangler
    experimental: {
      wasm: true,
    },
  },
})
