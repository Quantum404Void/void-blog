export const MIANXIANG_FEATURES = ['眉', '眼', '鼻', '口', '耳', '额', '颧', '下巴'] as const

export type MianxiangFeature = typeof MIANXIANG_FEATURES[number]

export interface MianxiangObservation {
  feature: MianxiangFeature
  form: string
  confidence: number
}

export interface MianxiangAnalysisResponse {
  model: string
  imageQuality: 'good' | 'limited'
  observations: MianxiangObservation[]
  warning?: string
}
