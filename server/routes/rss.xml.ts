export default defineEventHandler(async (event) => {
  const rows = await queryD1<{
    slug: string; title: string; description: string; content: string; pub_date: string
  }>(event, "SELECT slug,title,description,content,pub_date FROM posts WHERE draft=0 AND slug!='about' ORDER BY pub_date DESC LIMIT 20")

  const config = useRuntimeConfig()
  const base = config.public.siteUrl as string
  const siteName = config.public.siteName as string
  const siteDescription = config.public.siteDescription as string

  const items = rows.map(r => `
    <item>
      <title><![CDATA[${r.title}]]></title>
      <link>${base}/blog/${r.slug}</link>
      <guid>${base}/blog/${r.slug}</guid>
      <pubDate>${new Date(r.pub_date).toUTCString()}</pubDate>
      <description><![CDATA[${r.description}]]></description>
      <content:encoded><![CDATA[${r.content}]]></content:encoded>
    </item>`).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${siteName}</title>
    <link>${base}</link>
    <description>${siteDescription}</description>
    <language>zh-CN</language>
    <atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`

  setHeader(event, 'Content-Type', 'application/rss+xml; charset=utf-8')
  return xml
})
