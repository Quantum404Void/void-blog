import { deletePostStatements, getD1Error, getStoredPost } from '../../../utils/adminPost'
import { getD1 } from '../../../utils/d1'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, message: 'Missing slug' })
  await getStoredPost(event, slug)
  try {
    await getD1(event).batch(deletePostStatements(event, slug))
    return { ok: true }
  }
  catch (error) {
    return getD1Error(error)
  }
})
