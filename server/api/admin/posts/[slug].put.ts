import { getD1 } from '../../../utils/d1'
import { getD1Error, getStoredPost, parseAdminPostInput, parseStoredTags, updatePostStatements } from '../../../utils/adminPost'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, message: 'Missing slug' })

  const current = await getStoredPost(event, slug)
  const body = await readBody(event)
  const post = parseAdminPostInput({
    slug,
    title: body.title ?? current.title,
    description: body.description ?? current.description,
    content: body.content ?? current.content,
    pub_date: body.pub_date ?? current.pub_date,
    tags: body.tags ?? parseStoredTags(current.tags),
    draft: body.draft ?? current.draft === 1,
  })

  try {
    await getD1(event).batch(updatePostStatements(event, slug, post))
    return { ok: true }
  }
  catch (error) {
    return getD1Error(error)
  }
})
