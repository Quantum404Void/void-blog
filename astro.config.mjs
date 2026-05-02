import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
// Note: sitemap integration is kept for static pages only; dynamic blog routes handled separately
import tailwindcss from '@tailwindcss/vite';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://void.redx.space',
  output: 'server',
  adapter: cloudflare({
    platformProxy: { enabled: true },
  }),
  integrations: [
    vue(),
    mdx(),
    sitemap(),
  ],
  vite: {
    plugins: [tailwindcss()],
    build: {
      chunkSizeWarningLimit: 3000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('mermaid')) return 'mermaid-vendor'
            if (id.includes('chart.js') || id.includes('vue-chartjs')) return 'chart-vendor'
          },
        },
      },
    },
  },
  markdown: {
    shikiConfig: {
      theme: 'tokyo-night',
      wrap: true,
    },
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: 'append', properties: { className: ['heading-link'] } }],
    ],
  },
});
