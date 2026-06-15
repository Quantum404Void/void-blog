// server/middleware/admin-auth.ts
// 保护 /api/admin/** 路由
export default defineEventHandler(async (event) => {
  if (!getRequestURL(event).pathname.startsWith('/api/admin')) return

  const token = getCookie(event, TOKEN_COOKIE)
  if (!token) throw createError({ statusCode: 401, message: 'Not authenticated' })

  const config = useRuntimeConfig()
  const ok = await verifyToken(config.jwtSecret as string, token)
  if (!ok) throw createError({ statusCode: 401, message: 'Token expired or invalid' })
})
