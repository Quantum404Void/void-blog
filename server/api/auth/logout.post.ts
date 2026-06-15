// server/api/auth/logout.post.ts
export default defineEventHandler(async (event) => {
  deleteCookie(event, TOKEN_COOKIE, { path: '/' })
  return { ok: true }
})
