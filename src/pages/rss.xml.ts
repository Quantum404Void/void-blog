import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'
import type { APIContext } from 'astro'

export async function GET(context: APIContext) {
  const posts = (await getCollection('blog', ({ data }) => !data.draft))
    .filter(p => p.id !== 'about.mdx')
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())

  return rss({
    title: 'void.dev',
    description: '王宇的技术博客 — 代码、工具、系统、与一切值得折腾的东西',
    site: context.site!,
    items: posts.map(post => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${post.id.replace(/\.mdx?$/, '')}/`,
    })),
    customData: '<language>zh-CN</language>',
  })
}
