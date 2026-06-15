// server/api/posts/[slug].get.ts
import type { PostRow } from '../../types/index'
import { parseTags } from '../../utils/response'

import { getServerMd } from '../../utils/markdown'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, message: 'Missing slug' })

  const rows = await queryD1<PostRow>(event, 'SELECT * FROM posts WHERE slug=? AND draft=0', [slug])

  if (!rows.length) throw createError({ statusCode: 404, message: 'Post not found' })
  const r = rows[0]!
  // 服务端预渲染基础 HTML（无 Shiki 高亮），客户端立刻展示，Shiki 就绪后静默增量替换
  const contentHtml = getServerMd().render(r.content ?? '')
  return {
    slug: r.slug,
    title: r.title,
    description: r.description,
    content: r.content,
    content_html: contentHtml,
    pub_date: r.pub_date,
    tags: parseTags(r.tags),
    draft: r.draft === 1,
  }
})
