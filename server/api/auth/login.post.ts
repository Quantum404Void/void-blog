// server/api/auth/login.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()

  if (!body?.password) throw createError({ statusCode: 400, message: 'Missing password' })

  // 恒定时间比较，防止时序攻击
  const enc = new TextEncoder()
  const a = enc.encode(body.password)
  const b = enc.encode(config.adminPassword as string)
  let match = a.length === b.length
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if ((a[i] ?? 0) !== (b[i] ?? 0)) match = false
  }

  if (!match) {
    await new Promise(r => setTimeout(r, 500)) // 防暴力破解
    throw createError({ statusCode: 401, message: '密码错误' })
  }

  const token = await createToken(config.jwtSecret as string)

  setCookie(event, TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return { ok: true }
})
