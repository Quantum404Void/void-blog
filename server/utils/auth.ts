// server/utils/auth.ts
// Web Crypto API — 在 Cloudflare Workers 原生支持，无需 Node.js crypto

const TOKEN_COOKIE = 'admin_token'
const TOKEN_MAX_AGE = 60 * 60 * 24 * 7 // 7 天

async function hmacSign(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function hmacVerify(secret: string, data: string, sig: string): Promise<boolean> {
  try {
    const expected = await hmacSign(secret, data)
    return expected === sig
  } catch { return false }
}

export async function createToken(secret: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_MAX_AGE
  const payload = `admin:${exp}`
  const sig = await hmacSign(secret, payload)
  return `${payload}.${sig}`
}

export async function verifyToken(secret: string, token: string): Promise<boolean> {
  try {
    const lastDot = token.lastIndexOf('.')
    const payload = token.slice(0, lastDot)
    const sig = token.slice(lastDot + 1)
    if (!(await hmacVerify(secret, payload, sig))) return false
    const exp = parseInt(payload.split(':')[1])
    return Date.now() / 1000 < exp
  } catch { return false }
}

export { TOKEN_COOKIE }
