// server/routes/rss.xml.ts — 使用 feed 包生成 RSS 2.0
import { Feed } from 'feed'
import { queryD1 } from '../utils/d1'

export default defineEventHandler(async (event) => {
  const rows = await queryD1<{
    slug: string; title: string; description: string; content: string; pub_date: string
  }>(event, "SELECT slug,title,description,content,pub_date FROM posts WHERE draft=0 AND slug!='about' ORDER BY pub_date DESC LIMIT 20")

  const config = useRuntimeConfig()
  const base = config.public.siteUrl as string
  const siteName = config.public.siteName as string
  const siteDescription = config.public.siteDescription as string
  const authorName = config.public.authorName as string
  const authorEmail = config.public.authorEmail as string

  const feed = new Feed({
    title: siteName,
    description: siteDescription,
    id: base,
    link: base,
    language: 'zh-CN',
    image: `${base}/og-default.png`,
    favicon: `${base}/favicon.ico`,
    copyright: `© ${new Date().getFullYear()} ${authorName}`,
    updated: rows[0] ? new Date(rows[0].pub_date) : new Date(),
    feedLinks: {
      rss: `${base}/rss.xml`,
      atom: `${base}/atom.xml`,
    },
    author: {
      name: authorName,
      email: authorEmail,
      link: base,
    },
  })

  for (const r of rows) {
    feed.addItem({
      title: r.title,
      id: `${base}/blog/${r.slug}`,
      link: `${base}/blog/${r.slug}`,
      description: r.description,
      content: r.content,
      date: new Date(r.pub_date),
      image: `${base}/og/${r.slug}`,
    })
  }

  setHeader(event, 'Content-Type', 'application/rss+xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 's-maxage=3600, stale-while-revalidate')
  return feed.rss2()
})
