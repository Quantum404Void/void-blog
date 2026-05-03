// server/api/admin/posts/[slug].delete.ts — 删除文章
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, message: 'Missing slug' })
  await queryD1(event, 'DELETE FROM posts WHERE slug=?', [slug])
  return { ok: true }
})
