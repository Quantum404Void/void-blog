// server/api/auth/me.get.ts
export default defineEventHandler(async (event) => {
  const token = getCookie(event, TOKEN_COOKIE)
  if (!token) throw createError({ statusCode: 401, message: 'Not authenticated' })
  const config = useRuntimeConfig()
  const ok = await verifyToken(config.jwtSecret as string, token)
  if (!ok) throw createError({ statusCode: 401, message: 'Token expired' })
  return { admin: true }
})
