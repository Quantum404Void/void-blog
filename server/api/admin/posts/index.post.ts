import { createPostStatements, getD1Error, parseAdminPostInput } from '../../../utils/adminPost'
import { getD1 } from '../../../utils/d1'

export default defineEventHandler(async (event) => {
  const post = parseAdminPostInput(await readBody(event))
  try {
    await getD1(event).batch(createPostStatements(event, post))
    return { ok: true, slug: post.slug }
  }
  catch (error) {
    return getD1Error(error)
  }
})
