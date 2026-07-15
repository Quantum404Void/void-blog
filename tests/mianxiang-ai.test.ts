import { describe, expect, test } from 'bun:test'
import { MIANXIANG_FEATURES } from '../app/types/mianxiang'
import { MIANXIANG_REFERENCES, mianxiangFromObservations } from '../app/engine/knowledge/mianxiang'
import { MIANXIANG_MODEL, buildMianxiangPrompt, isMianxiangLicenseError, parseMianxiangModelResponse, parseOrRepairMianxiangResponse, responseText, runMianxiangVision } from '../server/utils/mianxiang-ai'

describe('mianxiang knowledge integrity', () => {
  test('covers every supported feature with all 62 references', () => {
    expect(Object.keys(MIANXIANG_REFERENCES).sort()).toEqual([...MIANXIANG_FEATURES].sort())
    expect(Object.values(MIANXIANG_REFERENCES).flat()).toHaveLength(62)
    for (const feature of MIANXIANG_FEATURES) {
      expect(MIANXIANG_REFERENCES[feature].length).toBeGreaterThan(0)
      expect(new Set(MIANXIANG_REFERENCES[feature].map(item => item.form)).size).toBe(MIANXIANG_REFERENCES[feature].length)
      for (const item of MIANXIANG_REFERENCES[feature]) {
        expect(item.form.trim()).toBeTruthy()
        expect(item.meaning.trim()).toBeTruthy()
      }
    }
  })

  test('includes every reference in the constrained model prompt', () => {
    const prompt = buildMianxiangPrompt()
    for (const entries of Object.values(MIANXIANG_REFERENCES)) {
      for (const entry of entries) expect(prompt).toContain(entry.form)
    }
  })
})

describe('mianxiang model response validation', () => {
  test('accepts valid allowlisted observations', () => {
    const result = parseMianxiangModelResponse('```json\n{"imageQuality":"good","observations":[{"feature":"眉","form":"眉长过目","confidence":0.82}]}\n```')
    expect(result.observations).toEqual([{ feature: '眉', form: '眉长过目', confidence: 0.82 }])
  })

  test('drops invented, duplicate and low-confidence observations', () => {
    const result = parseMianxiangModelResponse(JSON.stringify({
      imageQuality: 'limited',
      observations: [
        { feature: '眉', form: '模型捏造', confidence: 0.99 },
        { feature: '眼', form: '目有神采', confidence: 0.4 },
        { feature: '鼻', form: '鼻梁高挺', confidence: 0.8 },
        { feature: '鼻', form: '鼻头圆润', confidence: 0.9 },
        { feature: '年龄', form: '年轻', confidence: 0.9 },
      ],
    }))
    expect(result.observations).toEqual([{ feature: '鼻', form: '鼻梁高挺', confidence: 0.8 }])
  })

  test('rejects malformed output', () => {
    expect(() => parseMianxiangModelResponse('not json')).toThrow('模型输出格式无效')
    expect(() => parseMianxiangModelResponse('{"observations":[]}')).toThrow('模型缺少有效的图像质量结论')
  })

  test('maps validated observations to fixed local references', () => {
    const matrix = mianxiangFromObservations([{ feature: '眉', form: '眉长过目', confidence: 0.82 }])
    expect(matrix.symbols[0]?.attributes.confidence).toBe('0.82')
    expect(matrix.interpretations[0]?.text).toContain('兄弟和睦，朋友众多。')
    expect(matrix.interpretations[0]?.source).toBe('《麻衣相法》')
  })
})

describe('mianxiang model invocation', () => {
  test('reads direct and nested Workers AI response shapes', () => {
    expect(responseText('plain')).toBe('plain')
    expect(responseText({ response: 'direct' })).toBe('direct')
    expect(responseText({ result: { response: 'nested' } })).toBe('nested')
  })

  test('accepts the Meta license once and retries the original vision request', async () => {
    const calls: Array<{ model: string; input: Record<string, unknown> }> = []
    const visionInput = { prompt: 'analyze', image: new ArrayBuffer(1) }
    const ai = {
      async run(model: typeof MIANXIANG_MODEL, input: Record<string, unknown>) {
        calls.push({ model, input })
        if (calls.length === 1) throw new Error('You must agree to the Meta license and Acceptable Use Policy')
        if (input.prompt === 'agree') return { response: 'accepted' }
        return { response: '{"imageQuality":"limited","observations":[]}' }
      },
    }

    await expect(runMianxiangVision(ai, visionInput)).resolves.toEqual({
      response: '{"imageQuality":"limited","observations":[]}',
    })
    expect(calls).toEqual([
      { model: MIANXIANG_MODEL, input: visionInput },
      { model: MIANXIANG_MODEL, input: { prompt: 'agree' } },
      { model: MIANXIANG_MODEL, input: visionInput },
    ])
  })

  test('does not retry unrelated model failures', async () => {
    let calls = 0
    const ai = {
      async run() {
        calls += 1
        throw new Error('Workers AI capacity unavailable')
      },
    }

    expect(isMianxiangLicenseError(new Error('license agreement required'))).toBe(true)
    await expect(runMianxiangVision(ai, { prompt: 'analyze' })).rejects.toThrow('capacity unavailable')
    expect(calls).toBe(1)
  })

  test('repairs malformed model output without inventing observations', async () => {
    const ai = {
      async run() {
        return { response: '{"imageQuality":"limited","observations":[]}' }
      },
    }
    await expect(parseOrRepairMianxiangResponse(ai, 'I cannot determine this reliably.')).resolves.toEqual({
      imageQuality: 'limited',
      observations: [],
      warning: '照片中没有足够清晰、可匹配的面部形态。',
    })
  })

  test('returns an honest limited result when repair is also malformed', async () => {
    const ai = {
      async run() {
        return { response: 'still not json' }
      },
    }
    await expect(parseOrRepairMianxiangResponse(ai, 'not json')).resolves.toEqual({
      imageQuality: 'limited',
      observations: [],
      warning: '模型未能返回可靠的结构化匹配结果，请调整光线和角度后重试。',
    })
  })
})
