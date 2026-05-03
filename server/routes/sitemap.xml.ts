export default defineEventHandler(async (event) => {
  const rows = await queryD1<{
    slug: string; pub_date: string; updated_at: string
  }>(event, "SELECT slug,pub_date,updated_at FROM posts WHERE draft=0 AND slug!='about' ORDER BY pub_date DESC")

  const base = 'https://void.redx.space'

  const staticUrls = [
    { loc: base, priority: '1.0', changefreq: 'daily' },
    { loc: `${base}/search`, priority: '0.6', changefreq: 'weekly' },
    { loc: `${base}/stats`, priority: '0.5', changefreq: 'weekly' },
    { loc: `${base}/lab`, priority: '0.6', changefreq: 'monthly' },
  ]

  const staticXml = staticUrls.map(u => `
  <url>
    <loc>${u.loc}</loc>
    <priority>${u.priority}</priority>
    <changefreq>${u.changefreq}</changefreq>
  </url>`).join('')

  const postXml = rows.map(r => `
  <url>
    <loc>${base}/blog/${r.slug}</loc>
    <lastmod>${r.updated_at ? r.updated_at.slice(0, 10) : r.pub_date}</lastmod>
    <priority>0.8</priority>
    <changefreq>monthly</changefreq>
  </url>`).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticXml}
${postXml}
</urlset>`

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  return xml
})
