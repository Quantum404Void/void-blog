import type { H3Event } from 'h3'
import type { MianxiangAnalysisResponse } from '~/types/mianxiang'
import { MIANXIANG_MODEL, buildMianxiangPrompt, parseMianxiangModelResponse, runMianxiangVision } from '~~/server/utils/mianxiang-ai'

const MAX_IMAGE_BYTES = 2 * 1024 * 1024
const MAX_REQUESTS = 6
const RATE_WINDOW_SECONDS = 60
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

interface VisionResponse {
  response?: string
  result?: { response?: string }
}

function getAi(event: H3Event): Ai | undefined {
  const env = event.context.cloudflare?.env as { AI?: Ai } | undefined
  return env?.AI
}

function responseText(value: unknown): string {
  if (!value || typeof value !== 'object') return ''
  const response = value as VisionResponse
  return response.response ?? response.result?.response ?? ''
}

export default defineEventHandler(async (event): Promise<MianxiangAnalysisResponse> => {
  const contentType = getRequestHeader(event, 'content-type')?.split(';')[0]?.trim().toLowerCase() ?? ''
  const contentLength = Number(getRequestHeader(event, 'content-length') ?? 0)
  if (!ALLOWED_TYPES.has(contentType)) throw createError({ statusCode: 415, message: '仅支持 JPEG、PNG 或 WebP 图片' })
  if (contentLength > MAX_IMAGE_BYTES) throw createError({ statusCode: 413, message: '图片不能超过 2 MB' })

  const image = new Uint8Array(await readRawBody(event, false) ?? new ArrayBuffer(0))
  if (!image.byteLength) throw createError({ statusCode: 400, message: '图片内容为空' })
  if (image.byteLength > MAX_IMAGE_BYTES) throw createError({ statusCode: 413, message: '图片不能超过 2 MB' })

  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const env = event.context.cloudflare?.env as { void_blog_posts?: D1Database } | undefined
  const db = env?.void_blog_posts
  if (db) {
    const cutoff = Math.floor(Date.now() / 1000) - RATE_WINDOW_SECONDS
    try {
      const recent = await db.prepare(`SELECT COUNT(*) AS count FROM xuanwei_ai_rate_limits WHERE ip = ? AND created_at >= ?`).bind(ip, cutoff).first<{ count: number }>()
      if ((recent?.count ?? 0) >= MAX_REQUESTS) throw createError({ statusCode: 429, message: '分析请求过于频繁，请稍后再试' })
      await db.prepare(`INSERT INTO xuanwei_ai_rate_limits (ip, created_at) VALUES (?, ?)`).bind(ip, Math.floor(Date.now() / 1000)).run()
    }
    catch (error) {
      if (typeof error === 'object' && error && 'statusCode' in error) throw error
      console.error(JSON.stringify({ message: 'mianxiang rate limit unavailable' }))
    }
  }

  const ai = getAi(event)
  if (!ai) throw createError({ statusCode: 503, message: 'Cloudflare AI 仅在部署环境可用' })

  try {
    const raw = await runMianxiangVision(ai, {
      prompt: buildMianxiangPrompt(),
      image: image.buffer.slice(image.byteOffset, image.byteOffset + image.byteLength),
      max_tokens: 900,
      temperature: 0,
      seed: 20260714,
    })
    const parsed = parseMianxiangModelResponse(responseText(raw))
    return { model: MIANXIANG_MODEL, ...parsed }
  }
  catch (error) {
    const message = error instanceof Error ? error.message : '未知错误'
    console.error(JSON.stringify({ message: 'mianxiang vision failed', error: message }))
    throw createError({ statusCode: 502, message: 'Cloudflare 模型暂时无法完成分析，请稍后重试' })
  }
})
