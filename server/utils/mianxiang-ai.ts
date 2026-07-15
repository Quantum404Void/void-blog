import { MIANXIANG_FEATURES } from '~/types/mianxiang'
import type { MianxiangAnalysisResponse, MianxiangFeature, MianxiangObservation } from '~/types/mianxiang'
import { MIANXIANG_REFERENCES } from '@/engine/knowledge/mianxiang'

export const MIANXIANG_MODEL = '@cf/meta/llama-3.2-11b-vision-instruct' as const
const LICENSE_ERROR_PATTERN = /agree|acceptable use|license|licence|terms/i

interface VisionAi {
  run(model: typeof MIANXIANG_MODEL, input: Record<string, unknown>): Promise<unknown>
}

interface RawObservation {
  feature?: unknown
  form?: unknown
  confidence?: unknown
}

interface RawAnalysis {
  imageQuality?: unknown
  observations?: unknown
}

export function isMianxiangLicenseError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return LICENSE_ERROR_PATTERN.test(message)
}

export async function runMianxiangVision(ai: VisionAi, input: Record<string, unknown>): Promise<unknown> {
  try {
    return await ai.run(MIANXIANG_MODEL, input)
  }
  catch (error) {
    if (!isMianxiangLicenseError(error)) throw error
    await ai.run(MIANXIANG_MODEL, { prompt: 'agree' })
    return await ai.run(MIANXIANG_MODEL, input)
  }
}

export async function parseOrRepairMianxiangResponse(
  ai: VisionAi,
  text: string,
): Promise<Omit<MianxiangAnalysisResponse, 'model'>> {
  try {
    return parseMianxiangModelResponse(text)
  }
  catch {
    const repaired = await ai.run(MIANXIANG_MODEL, {
      prompt: `Convert the following model output to JSON only. Do not add observations that are not explicitly present.
Required schema: {"imageQuality":"good|limited","observations":[{"feature":"眉","form":"眉长过目","confidence":0.75}]}
If the output has no reliable allowed observation, return {"imageQuality":"limited","observations":[]}.

MODEL OUTPUT:
${text.slice(0, 6000)}`,
      max_tokens: 900,
      temperature: 0,
    })

    try {
      return parseMianxiangModelResponse(responseText(repaired))
    }
    catch {
      return {
        imageQuality: 'limited',
        observations: [],
        warning: '模型未能返回可靠的结构化匹配结果，请调整光线和角度后重试。',
      }
    }
  }
}

export function buildMianxiangPrompt(): string {
  const candidates = MIANXIANG_FEATURES.map(feature =>
    `${feature}: ${MIANXIANG_REFERENCES[feature].map(item => item.form).join('、')}`,
  ).join('\n')

  return `分析照片中清晰可见的面部外观，只能从候选列表选择最接近的形态。
禁止推断身份、年龄、性别、种族、国籍、健康、残疾、情绪、性格、运势或社会属性。
看不清或不确定时不要猜测。每个部位最多返回一个候选，confidence 必须是 0 到 1。
只返回 JSON，不要 Markdown：
{"imageQuality":"good|limited","observations":[{"feature":"眉","form":"眉长过目","confidence":0.75}]}

候选列表：
${candidates}`
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]
  if (fenced) return fenced.trim()
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('模型未返回 JSON')
  return text.slice(start, end + 1)
}

export function responseText(value: unknown): string {
  if (typeof value === 'string') return value
  if (!value || typeof value !== 'object') return ''
  const response = value as { response?: unknown; result?: { response?: unknown } }
  if (typeof response.response === 'string') return response.response
  return typeof response.result?.response === 'string' ? response.result.response : ''
}

function isFeature(value: unknown): value is MianxiangFeature {
  return typeof value === 'string' && MIANXIANG_FEATURES.includes(value as MianxiangFeature)
}

export function parseMianxiangModelResponse(text: string): Omit<MianxiangAnalysisResponse, 'model'> {
  let raw: RawAnalysis
  try {
    raw = JSON.parse(extractJson(text)) as RawAnalysis
  }
  catch {
    throw new Error('模型输出格式无效')
  }

  if (raw.imageQuality !== 'good' && raw.imageQuality !== 'limited') {
    throw new Error('模型缺少有效的图像质量结论')
  }

  const source = Array.isArray(raw.observations) ? raw.observations as RawObservation[] : []
  const seen = new Set<MianxiangFeature>()
  const observations: MianxiangObservation[] = []

  for (const item of source) {
    if (!isFeature(item.feature) || typeof item.form !== 'string' || typeof item.confidence !== 'number') continue
    if (seen.has(item.feature) || item.confidence < 0.55 || item.confidence > 1) continue
    if (!MIANXIANG_REFERENCES[item.feature].some(reference => reference.form === item.form)) continue
    seen.add(item.feature)
    observations.push({ feature: item.feature, form: item.form, confidence: item.confidence })
  }

  return {
    imageQuality: raw.imageQuality,
    observations,
    warning: observations.length ? undefined : '照片中没有足够清晰、可匹配的面部形态。',
  }
}
