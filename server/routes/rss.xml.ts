export default defineEventHandler(async (event) => {
  const rows = await queryD1<{
    slug: string; title: string; description: string; pub_date: string
  }>(event, 'SELECT slug,title,description,pub_date FROM posts WHERE draft=0 AND slug!=\'about\' ORDER BY pub_date DESC LIMIT 20')

  const base = 'https://void.redx.space'
  const items = rows.map(r => `
    <item>
      <title><![CDATA[${r.title}]]></title>
      <link>${base}/blog/${r.slug}</link>
      <guid>${base}/blog/${r.slug}</guid>
      <pubDate>${new Date(r.pub_date).toUTCString()}</pubDate>
      <description><![CDATA[${r.description}]]></description>
    </item>`).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>void.dev</title>
    <link>${base}</link>
    <description>王宇的技术博客 — 代码、工具、折腾与思考</description>
    <language>zh-CN</language>
    <atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`

  setHeader(event, 'Content-Type', 'application/rss+xml; charset=utf-8')
  return xml
})
