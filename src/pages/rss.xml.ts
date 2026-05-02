import rss from '@astrojs/rss'
import type { APIContext } from 'astro'
import { getAllPosts } from '../lib/db'

export async function GET(context: APIContext) {
  const db = (context.locals as any).cloudflare.env.void_blog_posts
  const posts = (await getAllPosts(db)).filter(p => p.slug !== 'about')

  return rss({
    title: 'void.dev',
    description: '王宇的技术博客 — 代码、工具、系统、与一切值得折腾的东西',
    site: context.site!,
    items: posts.map(post => ({
      title: post.title,
      description: post.description,
      pubDate: new Date(post.pub_date),
      link: `/blog/${post.slug}/`,
    })),
    customData: '<language>zh-CN</language>',
  })
}
