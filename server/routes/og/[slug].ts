// server/routes/og/[slug].ts
import { queryD1 } from '~/server/utils/d1'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const config = useRuntimeConfig()
  const siteUrl = config.public.siteUrl as string
  const siteName = config.public.siteName as string

  // 取文章标题和 tags
  let title = siteName
  let description = ''
  let tags: string[] = []

  try {
    const rows = await queryD1<{ title: string; description: string; tags: string }>(
      event,
      'SELECT title, description, tags FROM posts WHERE slug=? AND draft=0',
      [slug]
    )
    if (rows.length) {
      title = rows[0].title
      description = rows[0].description || ''
      tags = JSON.parse(rows[0].tags || '[]')
    }
  } catch {}

  // 截断标题避免超出
  const shortTitle = title.length > 52 ? title.slice(0, 49) + '...' : title
  const shortDesc = description.length > 80 ? description.slice(0, 77) + '...' : description
  const tagsStr = tags.slice(0, 4).map(t => `#${t}`).join('  ')

  // 文字换行（简单按字符数处理）
  function wrapText(text: string, maxLen: number): string[] {
    const lines: string[] = []
    let cur = ''
    for (const char of text) {
      // CJK 字符算 2 宽
      const w = /[\u4e00-\u9fa5]/.test(char) ? 2 : 1
      if ((cur.length + w) > maxLen && cur) { lines.push(cur); cur = '' }
      cur += char
    }
    if (cur) lines.push(cur)
    return lines
  }

  const titleLines = wrapText(shortTitle, 22)

  const titleSvg = titleLines.map((line, i) =>
    `<text x="60" y="${140 + i * 58}" font-family="monospace" font-size="48" font-weight="bold" fill="#e8e8f0">${escapeXml(line)}</text>`
  ).join('\n')

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a0f"/>
      <stop offset="100%" style="stop-color:#0f0f1a"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#00ff88"/>
      <stop offset="100%" style="stop-color:#00d4ff"/>
    </linearGradient>
  </defs>

  <!-- 背景 -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- 网格点阵 -->
  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
    <circle cx="20" cy="20" r="0.8" fill="rgba(255,255,255,0.06)"/>
  </pattern>
  <rect width="1200" height="630" fill="url(#grid)"/>

  <!-- 左侧渐变装饰条 -->
  <rect x="0" y="0" width="6" height="630" fill="url(#accent)"/>

  <!-- 顶部 site 标识 -->
  <text x="60" y="72" font-family="monospace" font-size="22" fill="#00ff88" letter-spacing="4">void.dev</text>
  <text x="164" y="72" font-family="monospace" font-size="22" fill="#3a3a5a">/</text>
  <text x="180" y="72" font-family="monospace" font-size="22" fill="#6868a0">blog</text>

  <!-- 文章标题 -->
  ${titleSvg}

  <!-- 描述 -->
  ${shortDesc ? `<text x="60" y="${140 + titleLines.length * 58 + 24}" font-family="monospace" font-size="26" fill="#6868a0">${escapeXml(shortDesc)}</text>` : ''}

  <!-- 标签 -->
  ${tagsStr ? `<text x="60" y="540" font-family="monospace" font-size="22" fill="#00d4ff">${escapeXml(tagsStr)}</text>` : ''}

  <!-- 底部分割线 -->
  <rect x="60" y="570" width="200" height="1" fill="rgba(0,212,255,0.3)"/>

  <!-- 作者 -->
  <text x="60" y="600" font-family="monospace" font-size="20" fill="#3a3a5a">王宇 · ${siteName}</text>

  <!-- 右侧装饰（大字终端符号） -->
  <text x="900" y="450" font-family="monospace" font-size="280" fill="rgba(0,255,136,0.04)" font-weight="bold">&gt;_</text>
</svg>`

  setHeader(event, 'Content-Type', 'image/svg+xml')
  setHeader(event, 'Cache-Control', 'public, max-age=86400')
  return svg
})

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}
